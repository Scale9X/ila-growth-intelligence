/* Scale9X Platform — AI report narrative (optional).
   Turns the deterministic scaffold into client-ready consulting prose for the four
   EDITABLE sections (executive_summary, business_reality, diagnostic_narrative,
   strategic_recommendations). Grounded entirely in the real diagnostic + the client's
   own words — no invented numbers. The analyst reviews/edits before publishing.
   The derived sections (scores, matrices, plans, budget) stay deterministic. */
const engine = require('./engine');
const report = require('./report');
const ai = require('./ai_score');
const { get } = require('./db');

const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['executive_summary', 'business_reality', 'diagnostic_narrative', 'strategic_recommendations'],
  properties: {
    executive_summary: {
      type: 'object', additionalProperties: false,
      required: ['situation', 'diagnosis', 'impact', 'opportunity', 'prescription'],
      properties: {
        situation: { type: 'string' }, diagnosis: { type: 'string' },
        impact: { type: 'string' }, opportunity: { type: 'string' },
        prescription: { type: 'array', items: { type: 'string' } }
      }
    },
    business_reality: { type: 'string' },
    diagnostic_narrative: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['observation', 'root_cause', 'business_impact', 'opportunity', 'action'],
        properties: {
          observation: { type: 'string' }, root_cause: { type: 'string' },
          business_impact: { type: 'string' }, opportunity: { type: 'string' }, action: { type: 'string' }
        }
      }
    },
    strategic_recommendations: { type: 'array', items: { type: 'string' } }
  }
};

function flatOpps(o) { return [...(o.quick_win || []), ...(o.strategic || []), ...(o.long_term || []), ...(o.transformation || [])]; }

function buildPrompt(company, d, findings, ev) {
  const strengths = d.strengths.map(s => `${s.name} (${s.score}/${s.weight})`).join(', ') || '—';
  const weaknesses = d.weaknesses.map(w => `${w.name} (${w.score}/${w.weight})`).join(', ') || '—';
  const opps = flatOpps(d.opportunities).map(o => `${o.title} [${o.impact} impact/${o.effort} effort]`).slice(0, 16).join('; ');
  const find = findings.map(f => `- ${f.area}: ${f.observation}`).join('\n') || '(none recorded)';

  const data = [
    `COMPANY: ${company}` + (ev.industry ? ` — ${ev.industry}` : ''),
    ev.revenue ? `Revenue band: ${ev.revenue}` : '',
    ev.team ? `Team size: ${ev.team}` : '',
    ev.offerings ? `Offerings: ${ev.offerings}` : '',
    `\nDIAGNOSTIC RESULT (use these exact numbers — do not invent others):`,
    `Growth Maturity: ${d.maturity.total}/100 (Grade ${d.maturity.grade} — ${d.maturity.label})`,
    `Growth Potential: ${d.potential.total}/100 (${d.potential.grade} — ${d.potential.label})`,
    `Growth Position Matrix verdict: ${d.matrix.quadrant || 'pending'}`,
    `Relative strengths: ${strengths}`,
    `Priority weaknesses: ${weaknesses}`,
    `Opportunities (Impact×Effort): ${opps || '—'}`,
    `\nKEY FINDINGS:\n${find}`,
    `\nSMART DISCOVERY (client-confirmed):`,
    ...['icp', 'challenges', 'objectives', 'opps'].map(k => ev.smart && ev.smart[k] ? `- ${k}: ${ev.smart[k]}` : '').filter(Boolean),
    `\nCLIENT'S OWN WORDS (discovery interview):`,
    ...ev.answers.slice(0, 40).map(a => `- ${a.value_text}`)
  ].filter(Boolean).join('\n');

  const system = `You are a senior growth consultant at Scale9X writing the narrative of a PREMIUM diagnostic report — a deliverable a client pays USD 5,000 for. Write with the authority and specificity of a doctor delivering a diagnosis: direct, evidence-led, and tailored to THIS business.
Hard rules:
- Ground every statement in the diagnostic data and the client's own words provided. NEVER invent numbers, metrics, percentages, or facts that aren't given. Use the exact scores/grades supplied.
- Be specific to this company — name their actual constraints (e.g. founder dependence, no repeatable GTM) using their language. No generic filler, no "in today's competitive landscape" clichés.
- Confident and concrete, not hedgy. Short, punchy sentences over long ones.
Write these four sections:
1) executive_summary: situation (where they stand, citing the real grades and what they're strong/weak at), diagnosis (the ROOT constraints on growth), impact (what it costs them to leave this unfixed), opportunity (the upside — tie to the Growth Position Matrix verdict and quick wins), prescription (3–5 crisp, imperative next-step bullets).
2) business_reality: ONE rich paragraph (5–7 sentences) — the honest picture of where the business is strong vs where it leaks, in plain language the founder will recognise.
3) diagnostic_narrative: one object per major weakness/finding (aim for 5–8). Each: observation (what the data shows), root_cause (why), business_impact (the cost), opportunity (the upside of fixing), action (the concrete move). Full sentences, specific.
4) strategic_recommendations: 5–7 prioritised, specific recommendation lines (most impactful first).`;

  const user = `Write the diagnostic report narrative for the following engagement.\n\n${data}`;
  return { system, user };
}

async function narrate(engagementId, model) {
  if (!ai.available()) return { available: false, error: 'AI is off. Add your Anthropic API key (data/anthropic_key.txt or ANTHROPIC_API_KEY) and restart the server.' };
  const e = get('SELECT * FROM engagements WHERE id=?', engagementId);
  if (!e) throw new Error('Engagement not found');
  const c = get('SELECT name FROM companies WHERE id=?', e.company_id);
  const d = engine.diagnostic(engagementId);
  const findings = report.listFindings(engagementId);
  const ev = ai.evidence(engagementId);
  const { system, user } = buildPrompt(c.name, d, findings, ev);
  const out = await ai.complete(system, user, SCHEMA, model);

  // Normalise to the exact section shapes the report expects.
  const sections = {
    executive_summary: {
      situation: String(out.executive_summary.situation || ''),
      diagnosis: String(out.executive_summary.diagnosis || ''),
      impact: String(out.executive_summary.impact || ''),
      opportunity: String(out.executive_summary.opportunity || ''),
      prescription: (out.executive_summary.prescription || []).map(String)
    },
    business_reality: String(out.business_reality || ''),
    diagnostic_narrative: (out.diagnostic_narrative || []).map(n => ({
      observation: String(n.observation || ''), root_cause: String(n.root_cause || ''),
      business_impact: String(n.business_impact || ''), opportunity: String(n.opportunity || ''), action: String(n.action || '')
    })),
    strategic_recommendations: (out.strategic_recommendations || []).map(String)
  };
  return { available: true, model: ai.resolveModel(model), sections };
}

module.exports = { narrate };
