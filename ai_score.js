/* Scale9X Platform — AI-assisted scoring (optional).
   Claude reads the client's submission and drafts a first-pass scorecard:
   a rubric level + confidence + evidence note for every area. The analyst
   reviews and edits in the UI before anything is saved — the deterministic
   engine still computes all grades/matrices from the SAVED scores, never from AI.

   Zero dependencies: calls the Anthropic API via the built-in fetch (Node 18+).
   Set ANTHROPIC_API_KEY (env) or paste your key into data/anthropic_key.txt. */
const fs = require('fs');
const path = require('path');
const engine = require('./engine');
const { get, all, DATA_DIR } = require('./db');

// Default to the most capable model; override with AI_MODEL if you want a cheaper tier (e.g. claude-haiku-4-5).
const MODEL = process.env.AI_MODEL || 'claude-opus-4-8';

function apiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY.trim();
  // Accept the key file in data/ or the project root, with or without .txt.
  const candidates = [
    path.join(DATA_DIR, 'anthropic_key.txt'),
    path.join(__dirname, 'data', 'anthropic_key.txt'),
    path.join(__dirname, 'anthropic_key.txt'),
    path.join(DATA_DIR, 'anthropic_key'),
    path.join(__dirname, 'data', 'anthropic_key'),
    path.join(__dirname, 'anthropic_key')
  ];
  for (const f of candidates) {
    try { if (fs.existsSync(f)) { const k = fs.readFileSync(f, 'utf8').trim(); if (k) return k; } } catch (e) {}
  }
  return null;
}
function available() { return !!apiKey(); }

/* Gather everything the client told us — the evidence the analyst would read. */
function evidence(engagementId) {
  const e = get('SELECT * FROM engagements WHERE id=?', engagementId);
  if (!e) throw new Error('Engagement not found');
  const c = get('SELECT * FROM companies WHERE id=?', e.company_id);
  const profRow = get('SELECT data FROM business_profiles WHERE company_id=?', e.company_id);
  const extra = profRow ? JSON.parse(profRow.data || '{}') : {};
  const answers = all('SELECT prompt_code,value_text FROM prompt_answers WHERE company_id=? AND value_text IS NOT NULL', e.company_id);
  const r = get('SELECT id FROM discovery_responses WHERE company_id=?', e.company_id);
  const smRow = r ? get("SELECT extracted_text FROM ai_extractions WHERE response_id=? AND type='smart'", r.id) : null;
  const smart = smRow ? JSON.parse(smRow.extracted_text || '{}') : {};
  return {
    company: c.name, industry: c.industry, revenue: c.revenue_band, team: c.team_band,
    markets: extra.markets, offerings: extra.offerings,
    smart, answers
  };
}

function buildPrompt(type, cfg, ev) {
  const lines = [];
  lines.push(`COMPANY: ${ev.company}`);
  if (ev.industry) lines.push(`Industry: ${ev.industry}`);
  if (ev.revenue) lines.push(`Revenue band: ${ev.revenue}`);
  if (ev.team) lines.push(`Team size: ${ev.team}`);
  if (ev.markets) lines.push(`Markets: ${ev.markets}`);
  if (ev.offerings) lines.push(`Offerings: ${ev.offerings}`);
  if (ev.smart && Object.keys(ev.smart).length) {
    lines.push('\nSMART DISCOVERY (client-confirmed summary):');
    ['icp','challenges','objectives','opps'].forEach(k => { if (ev.smart[k]) lines.push(`- ${k}: ${ev.smart[k]}`); });
  }
  lines.push('\nDISCOVERY INTERVIEW ANSWERS (the client, in their own words):');
  ev.answers.forEach(a => lines.push(`- [${a.prompt_code}] ${a.value_text}`));

  const rubric = cfg.categories.map(cat => {
    const areas = cat.areas.map(ar => {
      const levels = (ar.options || []).map((o, i) => `${i}=${o}`).join(' | ');
      return `  • area_id "${ar.id}" — ${ar.name} (score 0..${ar.max}): ${levels}`;
    }).join('\n');
    return `Category: ${cat.name} (weight ${cat.weight})\n${areas}`;
  }).join('\n\n');

  const label = type === 'maturity' ? 'Growth Maturity (how built-out the business is today)'
                                    : 'Growth Potential (the upside available)';
  const system = `You are a senior growth consultant at Scale9X scoring a client's ${label} against a FIXED rubric.
For every area, choose the integer rubric level (0..max) whose description best matches the evidence.
Rules:
- Score ONLY from the evidence provided. Do not assume facts the client did not state.
- When evidence for an area is thin or absent, score conservatively and set confidence "low".
- In evidence_note (<=140 chars), quote or paraphrase the SPECIFIC client statement that justifies the score. If nothing supports it, write "no direct evidence — conservative default".
- Return a score for EVERY area_id listed. Use the exact area_id strings given.`;

  const user = `CLIENT EVIDENCE\n${lines.join('\n')}\n\nRUBRIC TO SCORE\n${rubric}\n\nScore every area now.`;
  return { system, user };
}

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['scores'],
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['area_id', 'raw_score', 'confidence', 'evidence_note'],
        properties: {
          area_id: { type: 'string' },
          raw_score: { type: 'integer' },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
          evidence_note: { type: 'string' }
        }
      }
    }
  }
};

// Allowed models the UI can request; anything else falls back to the configured default.
const ALLOWED = ['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-8'];
function resolveModel(m) { return ALLOWED.includes(m) ? m : MODEL; }

// Shared Claude call → returns the parsed JSON object validated against `schema`.
async function complete(system, user, schema, model) {
  const key = apiKey();
  if (!key) throw new Error('No API key');
  const mdl = resolveModel(model);
  const body = {
    model: mdl,
    max_tokens: 16000,
    output_config: { format: { type: 'json_schema', schema } },
    system,
    messages: [{ role: 'user', content: user }]
  };
  // Extended thinking + effort are Opus/Sonnet-4.6 features; sending them to Haiku 4.5 returns a 400.
  if (/opus|sonnet-4-6/.test(mdl)) { body.thinking = { type: 'adaptive' }; body.output_config.effort = 'medium'; }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Claude API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const textBlock = (data.content || []).find(b => b.type === 'text');
  if (!textBlock) throw new Error('No content returned from Claude');
  try { return JSON.parse(textBlock.text); } catch (e) { throw new Error('Could not parse AI response as JSON'); }
}

async function suggest(engagementId, type, model) {
  if (!apiKey()) return { available: false, error: 'AI scoring is off. Set ANTHROPIC_API_KEY or paste your key into data/anthropic_key.txt, then restart the server.' };
  const cfg = engine.config(type)[0];
  if (!cfg) throw new Error('Scorecard not found');
  const ev = evidence(engagementId);
  const { system, user } = buildPrompt(type, cfg, ev);
  const parsed = await complete(system, user, SCHEMA, model);

  // Validate + clamp against the real rubric (defensive — AI never decides the final number, the analyst does).
  const maxByArea = {}, nameByArea = {};
  cfg.categories.forEach(cat => cat.areas.forEach(ar => { maxByArea[ar.id] = ar.max; nameByArea[ar.id] = ar.name; }));
  const suggestions = (parsed.scores || [])
    .filter(s => maxByArea[s.area_id] != null)
    .map(s => ({
      area_id: s.area_id,
      raw_score: Math.max(0, Math.min(maxByArea[s.area_id], Number(s.raw_score) || 0)),
      confidence: ['low', 'medium', 'high'].includes(s.confidence) ? s.confidence : 'low',
      evidence_note: String(s.evidence_note || '').slice(0, 200)
    }));
  const total = cfg.categories.reduce((n, cat) => n + cat.areas.length, 0);
  return { available: true, model: resolveModel(model), count: suggestions.length, total, suggestions };
}

module.exports = { suggest, available, complete, evidence, MODEL, resolveModel };
