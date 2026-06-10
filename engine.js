/* 1XL Platform — Diagnostic Engine (Phase 4).
   Scoring (maturity + potential), evidence/confidence, strengths/weaknesses,
   Magic Matrix, and Opportunity Matrix auto-generation. All from the shared DB. */
const { uid, now, get, all, run } = require('./db');
const { STRUCTURAL } = require('./scoring_seed');

/* ---- config (for the scoring UI) ---- */
function config(type) {
  const cards = type ? [get('SELECT * FROM scorecards WHERE type=?', type)] : all('SELECT * FROM scorecards');
  return cards.filter(Boolean).map(card => ({
    id: card.id, type: card.type, name: card.name, total: card.total_points,
    categories: all('SELECT * FROM score_categories WHERE scorecard_id=? ORDER BY ord', card.id).map(cat => ({
      id: cat.id, name: cat.name, weight: cat.weight,
      areas: all('SELECT * FROM score_areas WHERE category_id=? ORDER BY rowid', cat.id).map(a => ({
        id: a.id, name: a.name, max: a.max_points, options: JSON.parse(a.rubric || '[]')
      }))
    }))
  }));
}
function bandsFor(type) {
  const { SCORECARDS } = require('./scoring_seed');
  return (SCORECARDS.find(s => s.type === type) || {}).bands || [];
}
function gradeOf(type, total) {
  const b = bandsFor(type).find(x => total >= x[0]) || ['', '', ''];
  return { grade: b[1], label: b[2] };
}

/* ---- assessments ---- */
// Read-only lookup — used on every view path; never writes.
function getAssessment(engagementId, type) { return get('SELECT * FROM assessments WHERE engagement_id=? AND type=?', engagementId, type); }
// Write path only — creates the assessment row if missing (called from saveScores).
function ensureAssessment(engagementId, type) {
  let a = getAssessment(engagementId, type);
  if (!a) { const id = uid(); run('INSERT INTO assessments(id,engagement_id,type,status,computed_at) VALUES(?,?,?,?,?)', id, engagementId, type, 'draft', now()); a = get('SELECT * FROM assessments WHERE id=?', id); }
  return a;
}
function getScores(engagementId, type) {
  const a = getAssessment(engagementId, type); // read-only: viewing the scorecard must not create rows
  const rows = a ? all('SELECT score_area_id,raw_score,confidence,evidence_note FROM assessment_scores WHERE assessment_id=?', a.id) : [];
  const scores = {};
  rows.forEach(r => scores[r.score_area_id] = { raw_score: r.raw_score, confidence: r.confidence, evidence_note: r.evidence_note });
  return { assessment: a || null, config: config(type)[0], scores };
}
function saveScores(engagementId, type, list, user) {
  const a = ensureAssessment(engagementId, type);
  const CONF = ['low', 'medium', 'high'];
  (list || []).forEach(s => {
    if (s.raw_score == null || s.raw_score === '') return;
    // Validate the area belongs to this scorecard and clamp the score to its rubric range (0..max).
    const ar = get('SELECT a.max_points FROM score_areas a JOIN score_categories c ON c.id=a.category_id JOIN scorecards sc ON sc.id=c.scorecard_id WHERE a.id=? AND sc.type=?', s.area_id, type);
    if (!ar) return; // unknown area or wrong scorecard — reject silently
    let v = Number(s.raw_score);
    if (!Number.isFinite(v)) return; // reject NaN/Infinity
    v = Math.max(0, Math.min(ar.max_points, Math.round(v)));
    const conf = CONF.includes(s.confidence) ? s.confidence : null;
    const ex = get('SELECT id FROM assessment_scores WHERE assessment_id=? AND score_area_id=?', a.id, s.area_id);
    if (ex) run('UPDATE assessment_scores SET raw_score=?,confidence=?,evidence_note=?,scored_by=? WHERE id=?', v, conf, s.evidence_note || null, user.id, ex.id);
    else run('INSERT INTO assessment_scores(id,assessment_id,score_area_id,raw_score,source,confidence,evidence_note,scored_by) VALUES(?,?,?,?,?,?,?,?)', uid(), a.id, s.area_id, v, 'analyst', conf, s.evidence_note || null, user.id);
  });
  recompute(a.id, type, engagementId);
  // Opportunities derive from maturity weaknesses — regenerate them HERE (on score write), not on every view.
  if (type === 'maturity') genOpportunities(engagementId);
  return computeBreakdown(engagementId, type);
}

/* ---- compute ---- */
function computeBreakdown(engagementId, type) {
  const cfg = config(type)[0];
  const a = getAssessment(engagementId, type); // read-only — compute never creates rows
  const sRows = a ? all('SELECT score_area_id,raw_score,confidence FROM assessment_scores WHERE assessment_id=?', a.id) : [];
  const byArea = {}; sRows.forEach(r => byArea[r.score_area_id] = r);
  let total = 0; const confCounts = { low:0, medium:0, high:0 };
  let scoredAreas = 0, totalAreas = 0;
  const categories = cfg.categories.map(cat => {
    let cscore = 0; const areas = cat.areas.map(ar => {
      totalAreas++;
      const r = byArea[ar.id]; const v = r ? r.raw_score : 0; cscore += v;
      if (r) scoredAreas++;
      if (r && r.confidence) confCounts[r.confidence] = (confCounts[r.confidence] || 0) + 1;
      return { id: ar.id, name: ar.name, max: ar.max, score: r ? r.raw_score : null, pct: ar.max ? v / ar.max : 0 };
    });
    total += cscore;
    return { id: cat.id, name: cat.name, weight: cat.weight, score: cscore, pct: cat.weight ? cscore / cat.weight : 0, areas };
  });
  const complete = totalAreas > 0 && scoredAreas === totalAreas;
  const g = gradeOf(type, total);
  const confidence = Object.entries(confCounts).sort((a,b)=>b[1]-a[1])[0];
  // grade/label are only meaningful once every area is scored; null until then so nothing can present a partial grade as final.
  return { type, total, grade: complete ? g.grade : null, label: complete ? g.label : null, categories, confidence: (confidence && confidence[1]) ? confidence[0] : null, scoredAreas, totalAreas, complete };
}
// True only when BOTH scorecards are fully scored — the prerequisite for findings/report/publish.
function scoringReady(engagementId) {
  const m = computeBreakdown(engagementId, 'maturity');
  const p = computeBreakdown(engagementId, 'potential');
  return { complete: m.complete && p.complete, maturity: { scored: m.scoredAreas, total: m.totalAreas }, potential: { scored: p.scoredAreas, total: p.totalAreas } };
}
function recompute(assessmentId, type, engagementId) {
  const b = computeBreakdown(engagementId, type);
  run('UPDATE assessments SET total=?,grade=?,confidence_avg=?,status=?,computed_at=? WHERE id=?', b.total, b.grade, b.confidence, 'scored', now(), assessmentId);
}

/* ---- opportunity matrix auto-generation (from maturity weaknesses) ---- */
function genOpportunities(engagementId) {
  const mb = computeBreakdown(engagementId, 'maturity');
  run("DELETE FROM opportunities WHERE engagement_id=? AND status='auto'", engagementId);
  const ops = [];
  mb.categories.forEach(cat => {
    cat.areas.forEach(ar => {
      if (ar.score == null) return;
      if (ar.pct < 0.5) {
        const impact = cat.weight >= 15 ? 'high' : cat.weight >= 10 ? 'medium' : 'low';
        const effort = 'medium';
        let quadrant;
        if (STRUCTURAL.includes(cat.name)) quadrant = 'transformation';
        else if (impact === 'high') quadrant = 'quick_win';
        else if (impact === 'medium') quadrant = 'strategic';
        else quadrant = 'long_term';
        ops.push({ title: 'Improve ' + ar.name, impact, effort, quadrant, source: cat.name });
      }
    });
  });
  ops.forEach(o => run('INSERT INTO opportunities(id,engagement_id,title,impact,effort,quadrant,recommendation,status,source_area) VALUES(?,?,?,?,?,?,?,?,?)',
    uid(), engagementId, o.title, o.impact, o.effort, o.quadrant, 'Address "'+o.title.replace('Improve ','')+'" — currently below 50% of its maximum.', 'auto', o.source));
  return ops.length;
}

/* ---- full diagnostic ---- */
function diagnostic(engagementId) {
  const maturity = computeBreakdown(engagementId, 'maturity');
  const potential = computeBreakdown(engagementId, 'potential');
  const scoredM = maturity.complete;   // Magic Matrix only when fully scored — no verdict on partial data
  const scoredP = potential.complete;
  // NOTE: opportunities are regenerated in saveScores (on write), NOT here — diagnostic() is read-only.
  const rank = b => [...b.categories].filter(c=>c.areas.some(a=>a.score!=null)).sort((x,y)=>x.pct-y.pct);
  const mRank = rank(maturity);
  // Only label a category a strength if it is genuinely high (>=60%) and a weakness if genuinely low (<50%).
  // Prevents the report from calling a low-scoring category a "strength" (a credibility killer).
  const strengths = mRank.filter(c=>c.pct>=0.6).slice(-3).reverse().map(c=>({name:c.name,score:c.score,weight:c.weight}));
  const weaknesses = mRank.filter(c=>c.pct<0.5).slice(0,3).map(c=>({name:c.name,score:c.score,weight:c.weight}));
  const TH = 60;
  let quadrant = null;
  if (scoredM && scoredP) {
    const hiM = maturity.total >= TH, hiP = potential.total >= TH;
    quadrant = hiM && hiP ? 'Scale Client' : !hiM && hiP ? 'Best Client (Huge Opportunity)' : hiM && !hiP ? 'Mature Business' : 'High Risk Client';
  }
  const opps = all('SELECT title,impact,effort,quadrant,recommendation,status FROM opportunities WHERE engagement_id=?', engagementId);
  const oppByQuad = { quick_win:[], strategic:[], long_term:[], transformation:[] };
  opps.forEach(o => (oppByQuad[o.quadrant] = oppByQuad[o.quadrant] || []).push(o));
  return { maturity, potential, scoredM, scoredP, strengths, weaknesses, matrix: { maturity: maturity.total, potential: potential.total, threshold: TH, quadrant }, opportunities: oppByQuad };
}

module.exports = { config, getScores, saveScores, diagnostic, scoringReady, computeBreakdown };
