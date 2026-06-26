/* Scale9X Platform — Blueprint + Report Generation Engine (Phase 5).
   Deterministic: every generated section is composed from real scores, findings,
   evidence and the opportunity matrix. No invented numbers. Analyst edits before publish. */
const { uid, now, get, all, run } = require('./db');
const engine = require('./engine');
const playbooks = require('./industry_playbooks');

const EDITABLE = ['executive_summary','business_reality','diagnostic_narrative','strategic_recommendations'];

/* ---------------- Findings Builder ---------------- */
function listFindings(engagementId) {
  return all('SELECT * FROM findings WHERE engagement_id=? ORDER BY created_at', engagementId)
    .map(f => ({ ...f, evidence: f.evidence ? JSON.parse(f.evidence) : [] }));
}
function saveFinding(engagementId, f, user) {
  const ev = JSON.stringify(f.evidence || []);
  if (f.id && get('SELECT id FROM findings WHERE id=?', f.id)) {
    run('UPDATE findings SET area=?,observation=?,root_cause=?,business_impact=?,opportunity=?,action=?,severity=?,confidence=?,evidence=? WHERE id=?',
      f.area, f.observation, f.root_cause, f.business_impact, f.opportunity, f.action, f.severity, f.confidence, ev, f.id);
    return f.id;
  }
  const id = uid();
  run('INSERT INTO findings(id,engagement_id,area,observation,root_cause,business_impact,opportunity,action,severity,confidence,evidence,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
    id, engagementId, f.area, f.observation, f.root_cause, f.business_impact, f.opportunity, f.action, f.severity || 'medium', f.confidence || 'medium', ev, user.id, now());
  return id;
}
function deleteFinding(id) { run('DELETE FROM findings WHERE id=?', id); }

// Draft findings derived from the weakest scored areas (analyst then edits)
function generateDraftFindings(engagementId, user) {
  const d = engine.diagnostic(engagementId);
  run("DELETE FROM findings WHERE engagement_id=? AND created_by='engine'", engagementId);
  const weakAreas = [];
  d.maturity.categories.forEach(cat => cat.areas.forEach(a => { if (a.score != null && a.pct < 0.5) weakAreas.push({ cat, a }); }));
  // Prioritise by category WEIGHT (business leverage), then by how far below standard; spread across categories
  // so the highest-weight pains (e.g. Sales) surface instead of clustering in one low-scoring category.
  weakAreas.sort((x,y) => (y.cat.weight - x.cat.weight) || (x.a.pct - y.a.pct));
  const perCat = {}; const weakSel = [];
  for (const w of weakAreas) { const k = w.cat.name; if ((perCat[k] || 0) < 2) { weakSel.push(w); perCat[k] = (perCat[k] || 0) + 1; } if (weakSel.length >= 6) break; }
  weakSel.forEach(({cat,a}) => {
    const id = uid();
    run('INSERT INTO findings(id,engagement_id,area,observation,root_cause,business_impact,opportunity,action,severity,confidence,evidence,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
      id, engagementId, cat.name,
      `${a.name} scored ${a.score}/${a.max} — below half of its maximum.`,
      `${cat.name} is under-developed relative to its weight (${cat.weight}/100).`,
      `Limits ${cat.name.toLowerCase()} and constrains overall growth.`,
      `Bring ${a.name} up to a structured, repeatable standard.`,
      `Prioritise ${a.name} in the next 90 days.`,
      cat.weight >= 15 ? 'high' : 'medium', 'medium',
      JSON.stringify(['Growth Maturity scorecard', 'Discovery responses']), 'engine', now());
  });
  return listFindings(engagementId).length;
}
// Replace the engine-drafted findings with a provided set (used by the AI findings path; analyst then reviews/edits).
function setDraftFindings(engagementId, findings) {
  run("DELETE FROM findings WHERE engagement_id=? AND created_by='engine'", engagementId);
  (findings || []).forEach(f => run('INSERT INTO findings(id,engagement_id,area,observation,root_cause,business_impact,opportunity,action,severity,confidence,evidence,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
    uid(), engagementId, f.area, f.observation, f.root_cause, f.business_impact, f.opportunity, f.action,
    f.severity || 'medium', f.confidence || 'medium', JSON.stringify(f.evidence || ['Discovery interview', 'Diagnostic scorecard']), 'engine', now()));
  return listFindings(engagementId).length;
}

/* ---------------- Generators (all data-derived) ---------------- */
const BUDGET_BASE = { 'Demand Generation':18,'Performance Marketing':18,'Content & SEO':14,'CRM & Retention':14,'Sales Enablement':12,'Technology & Data':12,'Testing & Experiments':12 };
const WEAK_TO_BUDGET = {
  'Marketing Effectiveness':['Demand Generation','Content & SEO'], 'Sales Excellence':['Sales Enablement','CRM & Retention'],
  'Funnel Performance':['CRM & Retention','Performance Marketing'], 'Technology & Data':['Technology & Data'],
  'Customer Understanding':['Content & SEO'], 'Market Position':['Demand Generation']
};
function genBudget(d) {
  const b = { ...BUDGET_BASE };
  d.weaknesses.forEach(w => (WEAK_TO_BUDGET[w.name]||[]).forEach(area => b[area]=(b[area]||0)+6));
  const tot = Object.values(b).reduce((s,v)=>s+v,0);
  return Object.entries(b).map(([area,v])=>({ area, pct: Math.round(v/tot*100) }));
}
const KPI_MAP = {
  Business:['Revenue','Revenue growth %','Gross margin'],
  Marketing:['Cost per lead','CAC','ROAS','Marketing-attributed revenue'],
  Sales:['Lead→opportunity %','Win rate','Average deal size','Sales cycle length'],
  Customer:['Retention rate','Net Promoter Score','Lifetime value','Referral rate'],
  Operations:['On-time delivery / SLA','Automation rate'],
  Finance:['Net margin','CAC payback','Cash runway']
};
function genKPIs() { return Object.entries(KPI_MAP).map(([layer,items])=>({ layer, items })); }
function flatOpps(d) {
  const o = d.opportunities;
  return [...(o.quick_win||[]), ...(o.strategic||[]), ...(o.long_term||[]), ...(o.transformation||[])];
}
function genPlan90(d) {
  const ops = flatOpps(d); const weeks = [['1–2'],['3–4'],['5–6'],['7–8'],['9–10'],['11–12']];
  return weeks.map((w,i)=>({ weeks:w[0], items:[ops[i*2], ops[i*2+1]].filter(Boolean).map(o=>o.title) })).filter(s=>s.items.length);
}
function genRoadmap12(d) {
  const o = d.opportunities;
  // Always emit all four quarters. If a quarter has no opportunities of its type, give it a sensible default
  // (a "12-month roadmap" that renders only 9 months reads as unfinished).
  const fallbacks = {
    Q1: 'Stabilise reporting and instrument the funnel so progress is measurable',
    Q2: 'Operationalise the quick wins and tighten the sales process',
    Q3: 'Scale the channels and capabilities that are now working',
    Q4: 'Embed the new systems and shift focus from fixing to scaling'
  };
  const q = (quarter, objective, items) => ({ quarter, objective, initiatives: (items && items.length) ? items.slice(0,4).map(x=>x.title) : [fallbacks[quarter]] });
  return [
    q('Q1', 'Stop the leaks — quick wins', o.quick_win),
    q('Q2', 'Build the engine — strategic initiatives', o.strategic),
    q('Q3', 'Scale — long-term opportunities', o.long_term),
    q('Q4', 'Institutionalise — transformation', o.transformation)
  ];
}
function genExecSummary(d, company) {
  const wk = d.weaknesses.map(w=>w.name).join(', ') || 'several areas';
  const st = d.strengths.map(s=>s.name).join(', ') || 'its foundations';
  const quick = (d.opportunities.quick_win||[]).length;
  const totalOps = flatOpps(d).length;
  return {
    situation: `${company} scores ${d.maturity.total}/100 (Grade ${d.maturity.grade}) on Growth Maturity and ${d.potential.total}/100 (${d.potential.grade}) on Growth Potential. Its relative strengths are ${st}.`,
    diagnosis: `Growth is constrained by under-developed ${wk}. These are the categories scoring lowest against their weight in the diagnostic.`,
    impact: `${totalOps} priority gaps were identified across the diagnostic. Left unaddressed, the lowest-scoring areas (${wk}) will continue to cap conversion and scalability.`,
    opportunity: `Growth position: ${d.matrix.quadrant || 'pending both scores'}. ${quick} quick wins are available to recover value quickly, alongside longer-term initiatives.`,
    prescription: (d.opportunities.quick_win||[]).slice(0,3).map(o=>o.title)
  };
}
function genBusinessReality(d, company) {
  const st = d.strengths.map(s=>s.name).join(', ');
  const wk = d.weaknesses.map(w=>w.name).join(', ');
  return `${company} shows genuine strength in ${st||'parts of the business'}, but the diagnostic surfaces under-built ${wk||'execution areas'}. The pattern is consistent: where the business is measured and systematic it performs; where it is manual or ad-hoc it leaks. The plan that follows sequences the fixes by impact and effort, starting with the quick wins that recover value fastest.`;
}
function genNarrative(findings, d) {
  if (findings.length) return findings.map(f=>({ observation:f.observation, root_cause:f.root_cause, business_impact:f.business_impact, opportunity:f.opportunity, action:f.action }));
  // fall back to weaknesses if no findings yet
  return d.weaknesses.map(w=>({ observation:`${w.name} scored ${w.score}/${w.weight}.`, root_cause:`${w.name} is under-developed.`, business_impact:`Constrains growth.`, opportunity:`Strengthen ${w.name}.`, action:`Prioritise ${w.name}.` }));
}
function genRecommendations(d, findings) {
  // Directional recommendations derived from the validated findings (one line each).
  // Lightweight by design: the finding holds the depth and the arithmetic; this is the
  // "what to do" headline (the opportunity), clipped before it dives into the maths.
  if (findings && findings.length) {
    const clip = (t, n = 210) => {
      t = String(t || '').trim();
      // Cut where the directional prose turns into a results projection / arithmetic.
      let cutAt = t.length;
      [/\s+would\s+(?:add|generate|deliver|recover)/i, /\s+unlocks?\b/i, /\s+could\s+add/i].forEach(re => {
        const m = t.match(re); if (m && m.index < cutAt) cutAt = m.index;
      });
      t = t.slice(0, cutAt).trim().replace(/[\s,;:—-]+$/, '');
      if (t.length <= n) return t;
      const cut = t.slice(0, n);
      const sp = cut.lastIndexOf(' ');
      return (sp > 80 ? cut.slice(0, sp) : cut).replace(/[\s,;:—-]+$/, '') + '…';
    };
    return findings.slice(0, 6).map(f => `${f.area} — ${clip(f.opportunity || f.action)}`);
  }
  return flatOpps(d).slice(0,5).map(o=>`${o.title} — ${o.impact} impact, ${o.effort} effort.`);
}

/* ---------------- Industry intelligence + growth sections (qualitative, finding-grounded) ---------------- */
function engagementContext(engagementId) {
  const e = get('SELECT company_id FROM engagements WHERE id=?', engagementId) || {};
  const c = get('SELECT industry,name FROM companies WHERE id=?', e.company_id) || {};
  let offerings = '';
  try { const bp = get('SELECT data FROM business_profiles WHERE company_id=?', e.company_id); if (bp && bp.data) { const j = JSON.parse(bp.data); offerings = [j.offerings, j.markets].filter(Boolean).join(' '); } } catch (_) {}
  return { industry: c.industry || '', offerings, company: c.name || '' };
}
const _firstS = t => { const m = String(t || '').trim().match(/^.*?[.!?](\s|$)/); return (m ? m[0] : String(t || '')).trim(); };
const _clip = (t, n) => { t = String(t || '').trim(); if (t.length <= n) return t; const cut = t.slice(0, n); const sp = cut.lastIndexOf(' '); return (sp > 40 ? cut.slice(0, sp) : cut).replace(/[\s,;:—-]+$/, '') + '…'; };
const _sevRank = { high: 0, medium: 1, low: 2 };

// Growth Blueprint — the one-page action plan, derived entirely from existing findings + roadmap.
function genGrowthBlueprint(d, findings) {
  const fs = (findings || []).slice().sort((a, b) => (_sevRank[a.severity] ?? 1) - (_sevRank[b.severity] ?? 1));
  const top = fs.slice(0, 3), mid = fs.slice(3, 6);
  const d30 = top.map(f => ({ action: _clip(_firstS(f.action) || ('Address ' + f.area), 150), outcome: _clip(_firstS(f.opportunity) || ('Strengthen ' + f.area), 150), impact: f.area }));
  const d90 = (mid.length ? mid : top).map(f => ({ action: _clip(_firstS(f.opportunity) || ('Systematise ' + f.area), 150), outcome: 'Turn the fix into a repeatable, measurable system', impact: f.area }));
  const road = genRoadmap12(d);
  const m12 = [road[2], road[3]].filter(Boolean).map(q => ({ action: q.objective.replace(/^.*?—\s*/, ''), outcome: (q.initiatives || []).slice(0, 2).join('; '), impact: q.quarter }));
  return { d30, d90, m12 };
}
// Revenue Expansion — where future revenue can come from (industry library; qualitative only).
function genRevenueExpansion(pb) { return { industry: pb.label, items: pb.revenue || [] }; }
// Strategic Bets — 2–3 transformational, industry-specific opportunities.
function genStrategicBets(pb) { return { industry: pb.label, items: pb.bets || [] }; }
// What to focus on (from findings) vs what to ignore for now (industry distractions).
function genFocusIgnore(d, findings, pb) {
  const seen = new Set(); const focus = [];
  (findings || []).slice().sort((a, b) => (_sevRank[a.severity] ?? 1) - (_sevRank[b.severity] ?? 1)).forEach(f => {
    if (focus.length >= 5 || seen.has(f.area)) return; seen.add(f.area);
    focus.push({ item: f.area, why: _clip(_firstS(f.business_impact) || _firstS(f.observation), 120) });
  });
  return { focus, ignore: (pb.ignore || []).slice(0, 4) };
}
// Opportunity Matrix v2 — business language: fix-now (findings) → grow-soon/later (revenue) → transform (bets).
function genOpportunityV2(d, findings, pb) {
  const highF = (findings || []).filter(f => f.severity === 'high');
  const qwSrc = (highF.length ? highF : (findings || [])).slice(0, 4);
  const easy = (pb.revenue || []).filter(r => r.difficulty !== 'High' && r.timeline !== '12+ months');
  const hard = (pb.revenue || []).filter(r => r.difficulty === 'High' || r.timeline === '12+ months');
  return {
    quick_win: qwSrc.map(f => ({ title: _clip(_firstS(f.opportunity) || ('Recover value from ' + f.area), 96) })),
    strategic: easy.slice(0, 4).map(r => ({ title: r.name })),
    long_term: (hard.length ? hard : (pb.revenue || []).slice(4)).slice(0, 3).map(r => ({ title: r.name })),
    transformation: (pb.bets || []).map(b => ({ title: b.name }))
  };
}

/* ---------------- Report assembly ---------------- */
function buildSections(engagementId) {
  const e = get('SELECT * FROM engagements WHERE id=?', engagementId);
  const c = get('SELECT name FROM companies WHERE id=?', e.company_id);
  const d = engine.diagnostic(engagementId);
  const findings = listFindings(engagementId);
  const ctx = engagementContext(engagementId);
  const pb = playbooks.playbook(ctx.industry, ctx.offerings);
  return [
    ['executive_summary', genExecSummary(d, c.name)],
    ['business_reality', genBusinessReality(d, c.name)],
    ['growth_blueprint', genGrowthBlueprint(d, findings)],
    ['diagnostic_scores', { maturity:{ total:d.maturity.total, grade:d.maturity.grade, label:d.maturity.label, categories:d.maturity.categories.map(x=>({name:x.name,score:x.score,weight:x.weight})) }, potential:{ total:d.potential.total, grade:d.potential.grade, label:d.potential.label, categories:d.potential.categories.map(x=>({name:x.name,score:x.score,weight:x.weight})) } }],
    ['magic_matrix', d.matrix],
    ['strengths_weaknesses', { strengths:d.strengths, weaknesses:d.weaknesses }],
    ['key_findings', findings.map(f=>({ area:f.area, observation:f.observation, business_impact:f.business_impact, severity:f.severity, evidence:f.evidence }))],
    ['diagnostic_narrative', genNarrative(findings, d)],
    ['opportunity_matrix', d.opportunities],
    ['opportunity_matrix_v2', genOpportunityV2(d, findings, pb)],
    ['revenue_expansion', genRevenueExpansion(pb)],
    ['strategic_bets', genStrategicBets(pb)],
    ['focus_ignore', genFocusIgnore(d, findings, pb)],
    ['strategic_recommendations', genRecommendations(d, findings)],
    ['ninety_day_plan', genPlan90(d)],
    ['twelve_month_roadmap', genRoadmap12(d)],
    ['kpi_framework', genKPIs()],
    ['budget_allocation', genBudget(d)],
    ['industry_context', { industry: ctx.industry, label: pb.label }]
  ];
}
function generate(engagementId, user) {
  // refresh draft report
  const old = get("SELECT id FROM reports WHERE engagement_id=? AND status='draft'", engagementId);
  if (old) { run('DELETE FROM report_sections WHERE report_id=?', old.id); run('DELETE FROM reports WHERE id=?', old.id); }
  const verRow = get('SELECT MAX(version) v FROM reports WHERE engagement_id=?', engagementId);
  const version = (verRow && verRow.v ? verRow.v : 0) + 1;
  const rid = uid();
  run('INSERT INTO reports(id,engagement_id,version,status,created_at) VALUES(?,?,?,?,?)', rid, engagementId, version, 'draft', now());
  buildSections(engagementId).forEach(([key,content],i)=>run('INSERT INTO report_sections(id,report_id,key,content,ai_generated,ord) VALUES(?,?,?,?,?,?)', uid(), rid, key, JSON.stringify(content), 1, i));
  // mark blueprint generated
  if (!get('SELECT id FROM blueprints WHERE engagement_id=?', engagementId)) run('INSERT INTO blueprints(id,engagement_id,status,ai_generated,created_at) VALUES(?,?,?,?,?)', uid(), engagementId, 'generated', 0, now());
  return getReport(engagementId);
}
function getReport(engagementId) {
  const r = get("SELECT * FROM reports WHERE engagement_id=? ORDER BY version DESC LIMIT 1", engagementId);
  if (!r) return { report:null };
  const sections = {};
  all('SELECT key,content,edited_by FROM report_sections WHERE report_id=? ORDER BY ord', r.id).forEach(s=>sections[s.key]={ content:JSON.parse(s.content), edited:!!s.edited_by });
  return { report:{ id:r.id, version:r.version, status:r.status, published_at:r.published_at }, sections, editable:EDITABLE };
}
function editSection(reportId, key, content, user) {
  if (!EDITABLE.includes(key)) return { status:400, data:{ error:'Section is auto-derived and not editable' } };
  const r = get('SELECT status FROM reports WHERE id=?', reportId);
  if (r && r.status === 'published') return { status:400, data:{ error:'Published report is locked' } };
  run('UPDATE report_sections SET content=?, edited_by=? WHERE report_id=? AND key=?', JSON.stringify(content), user.id, reportId, key);
  return { status:200, data:{ ok:true } };
}
// Prerequisites shared by approve/publish: both scorecards fully scored + at least one finding.
function reportPrereqs(engagementId) {
  const sr = engine.scoringReady(engagementId);
  if (!sr.complete) return `Both scorecards must be fully scored first (Maturity ${sr.maturity.scored}/${sr.maturity.total}, Potential ${sr.potential.scored}/${sr.potential.total}).`;
  if (listFindings(engagementId).length === 0) return 'At least one finding is required before approval/publishing.';
  return null;
}
function approve(reportId, user) {
  const r = get('SELECT * FROM reports WHERE id=?', reportId);
  if (!r) return { status:404, data:{ error:'Report not found' } };
  if (r.status === 'published') return { status:409, data:{ error:'Report is already published and locked.' } };
  const bad = reportPrereqs(r.engagement_id);
  if (bad) return { status:400, data:{ error: bad } };
  run('UPDATE reports SET status=? WHERE id=?', 'approved', reportId);
  const e = get('SELECT company_id FROM reports r JOIN engagements e ON e.id=r.engagement_id WHERE r.id=?', reportId) || {};
  run('INSERT INTO activity_logs(id,company_id,engagement_id,actor_id,verb,object,at) VALUES(?,?,?,?,?,?,?)', uid(), e.company_id||null, r.engagement_id, user.id, 'approved_report', reportId, now());
  return { status:200, data:{ ok:true, status:'approved' } };
}
function publish(reportId, user) {
  const r = get('SELECT * FROM reports WHERE id=?', reportId);
  if (!r) return { status:404, data:{ error:'Report not found' } };
  if (r.status === 'published') return { status:409, data:{ error:'Report is already published.' } };       // idempotency
  if (r.status !== 'approved') return { status:400, data:{ error:'Report must be approved before publishing.' } }; // separation of duties
  const bad = reportPrereqs(r.engagement_id);
  if (bad) return { status:400, data:{ error: bad } };
  run('UPDATE reports SET status=?, published_at=?, published_by=? WHERE id=?', 'published', now(), user.id, reportId);
  const e = get('SELECT * FROM engagements WHERE id=?', r.engagement_id);
  run('UPDATE engagements SET status=?, published_at=?, updated_at=? WHERE id=?', 'delivered', now(), now(), e.id);
  run('INSERT INTO status_events(id,engagement_id,from_status,to_status,actor_id,at) VALUES(?,?,?,?,?,?)', uid(), e.id, e.status, 'delivered', user.id, now());
  const owner = get('SELECT owner_id FROM companies WHERE id=?', e.company_id);
  if (owner && owner.owner_id) run('INSERT INTO notifications(id,user_id,type,payload,created_at) VALUES(?,?,?,?,?)', uid(), owner.owner_id, 'report', JSON.stringify({ engagement_id:e.id, status:'delivered', message:'Your growth diagnostic report is ready.' }), now());
  run('INSERT INTO activity_logs(id,company_id,engagement_id,actor_id,verb,object,at) VALUES(?,?,?,?,?,?,?)', uid(), e.company_id, e.id, user.id, 'published_report', r.id, now());
  return { status:200, data:{ ok:true, status:'delivered' } };
}

module.exports = { listFindings, saveFinding, deleteFinding, generateDraftFindings, setDraftFindings, generate, getReport, editSection, approve, publish };
