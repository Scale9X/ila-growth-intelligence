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
  required: ['executive_summary', 'business_reality', 'diagnostic_narrative', 'strategic_recommendations', 'executive_questions'],
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
        required: ['finding', 'evidence', 'business_impact', 'diagnostic_insight', 'immediate_consideration'],
        properties: {
          finding: { type: 'string' }, evidence: { type: 'string' },
          business_impact: { type: 'string' }, diagnostic_insight: { type: 'string' }, immediate_consideration: { type: 'string' }
        }
      }
    },
    strategic_recommendations: { type: 'array', items: { type: 'string' } },
    executive_questions: { type: 'array', items: { type: 'string' } }
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

  const system = `You are a senior partner at Scale9X writing the Executive Growth Diagnostic Report — the deliverable of the Growth Diagnostic Platform (a one-time product the client pays USD 2,000 for). Its ONE job is to DIAGNOSE: reveal what is happening in the business today, why, and where growth is being held back — with the rigour and specificity of a McKinsey or Bain partner.
Hard rules:
- Ground every statement in the diagnostic data and the client's own words provided. NEVER invent numbers, metrics, percentages or facts that aren't given. Use the exact scores/grades supplied.
- Be specific to THIS business — name their real constraints in their own language. No generic filler, no clichés, no AI-sounding advice.
- Confident and concrete, not hedgy. Short, punchy sentences.
- CRITICAL BOUNDARY — this is a DIAGNOSTIC, not a strategy. You may state WHAT needs attention and WHY. You must NOT write execution: no roadmaps, no 90-day or 12-month plans, no budgets, no KPI targets, no hiring plans, no tool or vendor names, no campaign designs, no weekly milestones, no owners. Anything that becomes an execution plan belongs to the separate Growth Intelligence Platform — never write it here.
Write these sections:
1) executive_summary: situation (where they stand, citing the real grades and strengths/weaknesses), diagnosis (the ROOT constraints on growth), impact (what leaving this unfixed costs them), opportunity (the upside available), prescription (3–5 crisp DIAGNOSTIC priority areas — focus areas that deserve leadership attention, NOT execution steps).
2) business_reality: ONE rich paragraph (5–7 sentences) — the honest picture of where the business is strong vs where it leaks, in plain language the founder will recognise.
3) diagnostic_narrative: one object per major finding (aim for 5–8), each with EXACTLY this diagnostic structure and nothing more:
   - finding: one sharp sentence naming what is happening (e.g. "Lead acquisition quality is declining.").
   - evidence: the specific signals and data behind it, drawn from the provided numbers and the client's own words.
   - business_impact: what it costs the business if left unaddressed.
   - diagnostic_insight: the sharp read — what this really means for growth (e.g. "Lead quality is currently a primary constraint on growth.").
   - immediate_consideration: a DIAGNOSTIC-LEVEL pointer of what to examine next (e.g. "Review acquisition channels and the lead-qualification process."). NEVER an execution instruction.
4) strategic_recommendations: 5–7 diagnostic PRIORITY AREAS (most important first) — each names an area that deserves leadership attention and why, at insight level. NOT execution plans.
5) executive_questions: 5–7 sharp STRATEGIC QUESTIONS this diagnosis raises for the leadership team — the questions a board would now ask (e.g. "Have we outgrown our current go-to-market model?", "Are we investing in the wrong channels?"). Make them specific to THIS business's findings. Do NOT answer them — they should create urgency to design the strategy next.`;

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
      finding: String(n.finding || ''), evidence: String(n.evidence || ''),
      business_impact: String(n.business_impact || ''), diagnostic_insight: String(n.diagnostic_insight || ''), immediate_consideration: String(n.immediate_consideration || '')
    })),
    strategic_recommendations: (out.strategic_recommendations || []).map(String),
    executive_questions: (out.executive_questions || []).map(String)
  };
  return { available: true, model: ai.resolveModel(model), sections };
}

module.exports = { narrate };
