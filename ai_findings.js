/* 1XL Platform — AI-assisted KEY FINDINGS (optional, analyst-reviewed).
   Turns the scorecard + the client's actual discovery answers into specific, quantified,
   consulting-grade findings — the opposite of "Area X scored 0/2". The analyst reviews/edits
   before they reach the report. Reuses the same Claude call + evidence used for scoring/narrative.
   No new infrastructure. */
const engine = require('./engine');
const ai = require('./ai_score');
const { get } = require('./db');

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['area', 'observation', 'root_cause', 'business_impact', 'opportunity', 'action', 'severity', 'confidence'],
        properties: {
          area: { type: 'string' },
          observation: { type: 'string' },
          root_cause: { type: 'string' },
          business_impact: { type: 'string' },
          opportunity: { type: 'string' },
          action: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
        }
      }
    }
  }
};

function buildPrompt(company, d, ev) {
  // Weak categories with their weight + the specific weak areas inside them (the data anchors).
  const weakCats = d.maturity.categories
    .map(c => ({ name: c.name, weight: c.weight, pct: Math.round(c.pct * 100), weakAreas: c.areas.filter(a => a.score != null && a.pct < 0.5).map(a => `${a.name} (${a.score}/${a.max})`) }))
    .filter(c => c.weakAreas.length)
    .sort((a, b) => b.weight - a.weight);

  const data = [
    `COMPANY: ${company}` + (ev.industry ? ` — ${ev.industry}` : ''),
    ev.revenue ? `Revenue band: ${ev.revenue}` : '',
    ev.team ? `Team size: ${ev.team}` : '',
    ev.markets ? `Markets: ${ev.markets}` : '',
    ev.offerings ? `Offerings: ${ev.offerings}` : '',
    `\nDIAGNOSTIC RESULT (use these exact numbers; invent none):`,
    `Growth Maturity ${d.maturity.total}/100 (Grade ${d.maturity.grade || 'pending'}); Growth Potential ${d.potential.total}/100; Magic Matrix: ${d.matrix.quadrant || 'pending'}.`,
    `\nWEAK CATEGORIES (ordered by business weight — prioritise the heaviest):`,
    ...weakCats.map(c => `- ${c.name} (weight ${c.weight}/100, scored ${c.pct}%): weak areas — ${c.weakAreas.join('; ')}`),
    `\nSMART DISCOVERY (client-confirmed):`,
    ...['icp', 'challenges', 'objectives', 'opps'].map(k => ev.smart && ev.smart[k] ? `- ${k}: ${ev.smart[k]}` : '').filter(Boolean),
    `\nTHE CLIENT'S OWN WORDS (discovery interview — your ONLY source of facts and numbers):`,
    ...ev.answers.map(a => `- [${a.prompt_code}] ${a.value_text}`),
    `\n(The facts and numbers above — plus the scorecard scores/weights — are the ONLY data you may use. There is no other information about this business.)`
  ].filter(Boolean).join('\n');

  const system = `You are a senior growth consultant at 1XL writing the KEY FINDINGS of a premium diagnostic. The findings must be consultant-grade AND numerically defensible in front of a founder, CFO, or board member who will check every number.

OUTPUT: Produce EXACTLY 5–6 findings (no more), PRIORITISED by business impact — weight the heaviest weak categories first (a 15-weight Sales gap outranks a 5-weight one). Cover the most important DISTINCT problems.

NUMERICAL DISCIPLINE (the rules you will be judged on):
1. You may use ONLY numbers that appear verbatim in the evidence provided (the client's stated figures — leads, percentages, LTV, revenue, margin, counts, targets — and the scorecard scores/weights).
2. You must NOT introduce ANY other number. Specifically forbidden: industry benchmarks, market sizes, TAM, penetration rates, CAC, ROAS, conversion-rate assumptions, assumed margins, assumed average values, financing/interest rates, salary/headcount costs, "typical" figures, or any "let's assume / conservatively / roughly" number the client did not state.
3. If a useful calculation needs an input the client did NOT provide, DO NOT invent it. Instead either: (a) describe the impact qualitatively with no dollar figure, OR (b) write the gap explicitly, e.g. "[not provided: average order value — analyst to confirm before quantifying]". Leave the number for the analyst.
4. SHOW THE ARITHMETIC for every quantified statement, inline, with its source inputs named, e.g.: "≈900 enquiries/mo × (1 − 0.55 conversion) × 30% drop × £420 course = £51,030/mo (inputs: enquiries, conversion %, drop %, course value — all client-stated)". Double-check that the multiplication is actually correct before writing it.
5. Do NOT name specific external vendors, tools, insurers, platforms, or partners the client did not mention. If you suggest a tool category, frame it generically ("a CRM / field-service tool") — never assert a named third party as if it were a fact about this business. Tools the client DID name may be referenced directly.
6. NO "industry-standard" / "best-practice" improvement targets. Do NOT use a target rate or improved-state number (e.g. "lift close rate to 35%", "industry-standard 85% completion") unless the client provided that target. If you model an upside, you MUST: (a) show the CURRENT-state loss using only client numbers with arithmetic, and (b) write any target figure inline as "[analyst assumption to validate: X]". Never call a target "industry-standard" or "typical".

NO DUPLICATION: One root cause = one finding. Never quantify the same leakage in two findings, and never split one problem (e.g. "no follow-up") across multiple findings, and never have two findings monetise the same lever. If two issues share a root cause, merge them into one finding.

GROUNDING: In the observation, reference what the client actually SAID (their process, their words, their numbers) — never the scorecard label, never "Area X scored N/2".

ACTION: a concrete first move a founder could start this week — not "Improve X".

Each finding has: area, observation (what's happening, in their words + data), root_cause (why), business_impact (the cost — quantified ONLY from client-stated numbers with the arithmetic shown; otherwise qualitative or flagged as needing an input), opportunity (the upside), action (the specific first move), severity (high/medium/low by weight×gap), confidence (high/medium/low by how much evidence supports it).

SELF-CHECK before you output (verify and fix silently; do not include this checklist in the response):
- Sourced: every number either traces to the evidence OR is labelled "[analyst assumption to validate: …]". No unlabelled invented figure remains.
- Labelled: every assumption (including any improvement target) is explicitly labelled.
- Correct: re-compute each calculation; the stated result equals the arithmetic shown, and derived per-unit figures use the CURRENT count (e.g. revenue ÷ current sites, not future sites).
- Distinct: each finding has a different root cause; merge or drop any overlap. Exactly 5–6 findings remain.`;

  const user = `Write the key findings for this engagement. Use only the data below — invent no numbers or named third parties.\n\n${data}`;
  return { system, user };
}

async function draft(engagementId, model) {
  if (!ai.available()) return { available: false, error: 'AI is off. Add your Anthropic API key (data dir or ANTHROPIC_API_KEY) and restart the server.' };
  const e = get('SELECT * FROM engagements WHERE id=?', engagementId);
  if (!e) throw new Error('Engagement not found');
  const c = get('SELECT name FROM companies WHERE id=?', e.company_id);
  const d = engine.diagnostic(engagementId);
  const ev = ai.evidence(engagementId);
  const { system, user } = buildPrompt(c.name, d, ev);
  const out = await ai.complete(system, user, SCHEMA, model);
  const findings = (out.findings || []).map(f => ({
    area: String(f.area || '').slice(0, 120),
    observation: String(f.observation || ''),
    root_cause: String(f.root_cause || ''),
    business_impact: String(f.business_impact || ''),
    opportunity: String(f.opportunity || ''),
    action: String(f.action || ''),
    severity: ['high', 'medium', 'low'].includes(f.severity) ? f.severity : 'medium',
    confidence: ['high', 'medium', 'low'].includes(f.confidence) ? f.confidence : 'medium',
    evidence: ['Discovery interview', 'Diagnostic scorecard']
  }));
  return { available: true, model: ai.resolveModel(model), findings };
}

module.exports = { draft };
