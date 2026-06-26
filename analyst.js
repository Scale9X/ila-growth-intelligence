/* Scale9X Platform — Analyst Portal API + status workflow automation (Phase 3).
   Reads the SAME shared DB the client writes to — no sync, no copy. */
const { uid, now, get, all, run } = require('./db');
const engine = require('./engine');
const report = require('./report');
const authmod = require('./auth');
const ai = require('./ai_score');
const aireport = require('./ai_report');
const aifindings = require('./ai_findings');
// All discovery questions must be answered before scoring/report. Keep in sync with public/client/data.js PROMPTS.
const REQUIRED_PROMPTS = 31;
function discoveryStatus(engagementId) {
  const e = get('SELECT company_id FROM engagements WHERE id=?', engagementId);
  if (!e) return { answered: 0, required: REQUIRED_PROMPTS, complete: false };
  const answered = get("SELECT COUNT(*) n FROM prompt_answers WHERE company_id=? AND TRIM(COALESCE(value_text,''))<>''", e.company_id).n;
  return { answered, required: REQUIRED_PROMPTS, complete: answered >= REQUIRED_PROMPTS };
}
// Returns a 400 response if discovery isn't complete, else null. Used to gate scoring/report actions.
function notReady(engagementId) {
  const s = discoveryStatus(engagementId);
  if (!s.complete) return { status: 400, data: { error: `Discovery is incomplete — ${s.answered}/${s.required} questions answered. Scoring and report generation are locked until the client completes the interview.`, discovery: s } };
  return null;
}
function isAdmin(user) { return authmod.rolesFor(user.id).some(r => r.key === 'admin' || r.key === 'super_admin'); }
function analystList() { return all("SELECT DISTINCT u.id, u.full_name FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE u.is_staff=1 AND r.key IN ('analyst','admin','super_admin')"); }
function isStaffUser(uid2) { const u = get('SELECT is_staff FROM users WHERE id=?', uid2); return !!(u && u.is_staff); }

// --- Per-object access control: a non-admin analyst may only act on engagements assigned to them (as analyst or reviewer). ---
function canAccess(engagementId, user) {
  if (isAdmin(user)) return true;
  const e = get('SELECT assigned_analyst_id, reviewer_id FROM engagements WHERE id=?', engagementId);
  return !!e && (e.assigned_analyst_id === user.id || e.reviewer_id === user.id);
}
function engagementOfReport(reportId) { const r = get('SELECT engagement_id FROM reports WHERE id=?', reportId); return r ? r.engagement_id : null; }
const FORBIDDEN = { status: 403, data: { error: 'You are not assigned to this engagement.' } };

// --- Scoring prerequisite: both scorecards fully scored before findings/report/narrate. ---
function scoringGate(engagementId) {
  const sr = engine.scoringReady(engagementId);
  if (!sr.complete) return { status: 400, data: { error: `Both scorecards must be fully scored first — Maturity ${sr.maturity.scored}/${sr.maturity.total}, Potential ${sr.potential.scored}/${sr.potential.total}.`, scoring: sr } };
  return null;
}

// --- Audit: every meaningful staff mutation is logged so an admin can reconstruct who-did-what-when. ---
function logAct(engagementId, actorId, verb, object) {
  const e = engagementId ? get('SELECT company_id FROM engagements WHERE id=?', engagementId) : null;
  run('INSERT INTO activity_logs(id,company_id,engagement_id,actor_id,verb,object,at) VALUES(?,?,?,?,?,?,?)', uid(), e ? e.company_id : null, engagementId || null, actorId, verb, object || null, now());
}
function actorName(id) { if (!id) return 'System'; const u = get('SELECT full_name FROM users WHERE id=?', id); return u ? u.full_name : 'Unknown'; }
// Merged who-did-what-when timeline for an engagement (status changes + activity log), newest first.
function engagementHistory(engagementId) {
  const rows = [];
  all('SELECT from_status,to_status,actor_id,at FROM status_events WHERE engagement_id=?', engagementId)
    .forEach(s => rows.push({ at: s.at, who: actorName(s.actor_id), type: 'status', detail: `${s.from_status || '—'} → ${s.to_status}` }));
  all('SELECT actor_id,verb,object,at FROM activity_logs WHERE engagement_id=?', engagementId)
    .forEach(a => rows.push({ at: a.at, who: actorName(a.actor_id), type: 'activity', detail: a.verb.replace(/_/g, ' ') + (a.object ? ' · ' + a.object : '') }));
  rows.sort((x, y) => (x.at < y.at ? 1 : x.at > y.at ? -1 : 0));
  return rows;
}

const STAGES = ['submitted','in_review','research','audit','report_generation','quality_review','delivered'];
const STAGE_LABEL = {
  submitted:'Submitted', in_review:'Under Review', research:'Research',
  audit:'Audit', report_generation:'Report Generation', quality_review:'Quality Review', delivered:'Delivered'
};
const isStaff = u => u && u.is_staff;

function queue(user) {
  const base = `SELECT e.id, e.status, e.submitted_at, e.assigned_analyst_id, c.name AS company, c.industry
                FROM engagements e JOIN companies c ON c.id = e.company_id WHERE e.status != 'draft'`;
  if (isAdmin(user)) return all(base + ' ORDER BY e.submitted_at DESC');
  return all(base + ' AND e.assigned_analyst_id=? ORDER BY e.submitted_at DESC', user.id);
}

function detail(id, user) {
  const e = get('SELECT * FROM engagements WHERE id=?', id);
  if (!e) return null;
  const c = get('SELECT * FROM companies WHERE id=?', e.company_id);
  const profRow = get('SELECT data FROM business_profiles WHERE company_id=?', e.company_id);
  const extra = profRow ? JSON.parse(profRow.data) : {};
  const members = all('SELECT id,name,email,member_role,assigned_sections FROM company_members WHERE company_id=?', e.company_id)
    .map(m => ({ id:m.id, name:m.name, role:m.member_role, sections: m.assigned_sections ? JSON.parse(m.assigned_sections) : [] }));
  const memName = mid => { const m = members.find(x => x.id === mid); return m ? m.name : (mid ? 'Team member' : ''); };
  const answers = all('SELECT prompt_code,section_key,value_text,answered_by FROM prompt_answers WHERE company_id=?', e.company_id)
    .map(a => ({ code:a.prompt_code, section:a.section_key, value:a.value_text, by: memName(a.answered_by) }));
  const documents = all('SELECT id,category,file_name FROM documents WHERE company_id=?', e.company_id);
  const r = get('SELECT id FROM discovery_responses WHERE company_id=?', e.company_id);
  const smRow = r ? get("SELECT extracted_text,status FROM ai_extractions WHERE response_id=? AND type='smart'", r.id) : null;
  const smart = smRow ? Object.assign(JSON.parse(smRow.extracted_text || '{}'), { confirmed: smRow.status === 'confirmed' }) : null;
  const events = all('SELECT from_status,to_status,at FROM status_events WHERE engagement_id=? ORDER BY at', id);
  const profile = Object.assign({ industry:c.industry, revenue:c.revenue_band, team:c.team_band, website:c.website }, extra);
  const assignedAnalyst = e.assigned_analyst_id ? (get('SELECT full_name FROM users WHERE id=?', e.assigned_analyst_id) || {}).full_name : null;
  return { engagement:e, company:{ id:c.id, name:c.name, lifecycle_stage:c.lifecycle_stage }, profile, members, answers, documents, smart, events, stages:STAGES, stageLabels:STAGE_LABEL,
    assignedAnalyst, assigned_analyst_id: e.assigned_analyst_id, isAdmin: user ? isAdmin(user) : false, analysts: analystList(), discovery: discoveryStatus(id), scoring: engine.scoringReady(id) };
}

function setStatus(id, toStatus, user) {
  const e = get('SELECT * FROM engagements WHERE id=?', id);
  if (!e) return { status:404, data:{ error:'Engagement not found' } };
  if (!STAGES.includes(toStatus)) return { status:400, data:{ error:'Invalid status' } };
  // 'delivered' is reachable ONLY through report.publish (which checks scoring + approval + findings).
  // This closes the bypass where setStatus marked an engagement delivered with no published report.
  if (toStatus === 'delivered') return { status:400, data:{ error:'Use Publish → Deliver to deliver. Status cannot be set to "delivered" directly.' } };
  if (e.status === 'delivered') return { status:400, data:{ error:'Engagement is already delivered and locked.' } };
  const from = e.status;
  run('UPDATE engagements SET status=?, updated_at=? WHERE id=?', toStatus, now(), id);
  run('INSERT INTO status_events(id,engagement_id,from_status,to_status,actor_id,at) VALUES(?,?,?,?,?,?)', uid(), id, from, toStatus, user.id, now());
  const owner = get('SELECT owner_id FROM companies WHERE id=?', e.company_id);
  if (owner && owner.owner_id) {
    const msg = toStatus === 'delivered' ? 'Your growth diagnostic is ready.' : `Status updated: ${STAGE_LABEL[toStatus]}`;
    run('INSERT INTO notifications(id,user_id,type,payload,created_at) VALUES(?,?,?,?,?)', uid(), owner.owner_id, 'status', JSON.stringify({ engagement_id:id, status:toStatus, message:msg }), now());
  }
  run('INSERT INTO activity_logs(id,company_id,engagement_id,actor_id,verb,object,at) VALUES(?,?,?,?,?,?,?)', uid(), e.company_id, id, user.id, 'status_change', toStatus, now());
  return { status:200, data:{ ok:true, status:toStatus } };
}

function handle(pathname, method, body, user) {
  if (!isStaff(user)) return { status:403, data:{ error:'Staff access only' } };
  if (pathname === '/api/analyst/queue' && method === 'GET') return { status:200, data:{ engagements:queue(user), stages:STAGES, stageLabels:STAGE_LABEL, isAdmin:isAdmin(user), me:{ id:user.id, name:user.full_name } } };
  // ADMIN: staff management
  if (pathname === '/api/analyst/staff' && method === 'GET') {
    if (!isAdmin(user)) return { status:403, data:{ error:'Admin only' } };
    return { status:200, data:{ staff: all("SELECT u.id,u.full_name,u.email, GROUP_CONCAT(r.key) AS roles FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id WHERE u.is_staff=1 GROUP BY u.id ORDER BY u.full_name") } };
  }
  if (pathname === '/api/analyst/staff' && method === 'POST') {
    if (!isAdmin(user)) return { status:403, data:{ error:'Admin only' } };
    if (!body.full_name || !body.email) return { status:400, data:{ error:'Name and email required' } };
    if (get('SELECT id FROM users WHERE email=?', String(body.email).toLowerCase())) return { status:409, data:{ error:'Email already exists' } };
    const id = uid(), t = now();
    run('INSERT INTO users(id,email,password_hash,full_name,is_staff,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)', id, String(body.email).toLowerCase(), authmod.hashPassword(body.password || 'changeme'), body.full_name, 1, 'active', t, t);
    const roleKey = (body.role === 'admin') ? 'admin' : 'analyst';
    run('INSERT INTO user_roles(id,user_id,role_id,company_id,created_at) VALUES(?,?,?,?,?)', uid(), id, get('SELECT id FROM roles WHERE key=?', roleKey).id, null, t);
    logAct(null, user.id, 'created_staff', roleKey + ':' + String(body.email).toLowerCase());
    return { status:201, data:{ ok:true } };
  }
  if (pathname === '/api/analyst/analysts' && method === 'GET') return { status:200, data:{ analysts: analystList() } };

  // ---- Centralized per-object access control: a non-admin analyst may only act on engagements assigned to them. ----
  let acc;
  if ((acc = pathname.match(/^\/api\/analyst\/engagement\/([^/]+)(?:\/|$)/))) { if (!canAccess(acc[1], user)) return FORBIDDEN; }
  else if ((acc = pathname.match(/^\/api\/analyst\/report\/([^/]+)(?:\/|$)/))) { const eid = engagementOfReport(acc[1]); if (!eid || !canAccess(eid, user)) return FORBIDDEN; }
  else if ((acc = pathname.match(/^\/api\/analyst\/finding\/([^/]+)$/))) { const f = get('SELECT engagement_id FROM findings WHERE id=?', acc[1]); if (!f || !canAccess(f.engagement_id, user)) return FORBIDDEN; }

  let m;
  if ((m = pathname.match(/^\/api\/analyst\/engagement\/([^/]+)$/)) && method === 'GET') {
    const d = detail(m[1], user); return d ? { status:200, data:d } : { status:404, data:{ error:'Not found' } };
  }
  if ((m = pathname.match(/^\/api\/analyst\/engagement\/([^/]+)\/history$/)) && method === 'GET') {
    return { status:200, data:{ history: engagementHistory(m[1]) } };
  }
  if ((m = pathname.match(/^\/api\/analyst\/engagement\/([^/]+)\/status$/)) && method === 'POST') {
    const out = setStatus(m[1], body.status, user); if (out.status === 200) logAct(m[1], user.id, 'status_change', body.status); return out;
  }
  if ((m = pathname.match(/^\/api\/analyst\/engagement\/([^/]+)\/assign$/)) && method === 'POST') {
    if (!isAdmin(user)) return { status:403, data:{ error:'Only an admin can assign engagements.' } };
    const target = body.analyst_id;
    if (!target || !isStaffUser(target)) return { status:400, data:{ error:'A valid staff analyst is required.' } };
    run('UPDATE engagements SET assigned_analyst_id=?, updated_at=? WHERE id=?', target, now(), m[1]);
    logAct(m[1], user.id, 'assigned_analyst', actorName(target));
    return { status:200, data:{ ok:true } };
  }
  // AI-ASSISTED SCORING (optional) — drafts a scorecard the analyst then reviews/edits/saves
  if ((m = pathname.match(/^\/api\/analyst\/engagement\/([^/]+)\/scores\/(maturity|potential)\/suggest$/)) && method === 'POST') {
    const eid = m[1], stype = m[2];
    const g = notReady(eid); if (g) return g;
    return ai.suggest(eid, stype, body.model)
      .then(data => { if (data && data.available) logAct(eid, user.id, 'ai_suggest_scores', stype + ' · ' + (data.model || '')); return { status: 200, data }; })
      .catch(e => ({ status: 200, data: { available: ai.available(), error: String(e && e.message || e) } }));
  }
  // DIAGNOSTIC ENGINE (Phase 4)
  if ((m = pathname.match(/^\/api\/analyst\/engagement\/([^/]+)\/scores\/(maturity|potential)$/))) {
    if (method === 'GET') return { status:200, data: engine.getScores(m[1], m[2]) };
    if (method === 'POST') { const g = notReady(m[1]); if (g) return g; const out = engine.saveScores(m[1], m[2], body.scores, user); logAct(m[1], user.id, 'saved_scores', m[2] + ' (' + out.scoredAreas + '/' + out.totalAreas + ')'); return { status:200, data: out }; }
  }
  if ((m = pathname.match(/^\/api\/analyst\/engagement\/([^/]+)\/diagnostic$/)) && method === 'GET') {
    return { status:200, data: engine.diagnostic(m[1]) };
  }
  // FINDINGS (Phase 5)
  if ((m = pathname.match(/^\/api\/analyst\/engagement\/([^/]+)\/findings$/))) {
    if (method === 'GET') return { status:200, data:{ findings: report.listFindings(m[1]) } };
    if (method === 'POST') { const id = report.saveFinding(m[1], body, user); logAct(m[1], user.id, 'saved_finding', id); return { status:200, data:{ id, findings: report.listFindings(m[1]) } }; }
  }
  if ((m = pathname.match(/^\/api\/analyst\/engagement\/([^/]+)\/findings\/generate$/)) && method === 'POST') {
    const g = notReady(m[1]) || scoringGate(m[1]); if (g) return g;
    report.generateDraftFindings(m[1], user); logAct(m[1], user.id, 'generated_findings', null); return { status:200, data:{ findings: report.listFindings(m[1]) } };
  }
  // AI-assisted findings — evidence-grounded, quantified, analyst-reviewed (paid Claude call)
  if ((m = pathname.match(/^\/api\/analyst\/engagement\/([^/]+)\/findings\/draft-ai$/)) && method === 'POST') {
    const eid = m[1];
    const g = notReady(eid) || scoringGate(eid); if (g) return g;
    return aifindings.draft(eid, body.model)
      .then(out => {
        if (out.available === false || out.error) return { status: 200, data: out };
        report.setDraftFindings(eid, out.findings);
        logAct(eid, user.id, 'ai_draft_findings', (out.model || '') + ' · ' + out.findings.length);
        return { status: 200, data: { available: true, model: out.model, count: out.findings.length, findings: report.listFindings(eid) } };
      })
      .catch(e => ({ status: 200, data: { available: ai.available(), error: String(e && e.message || e) } }));
  }
  if ((m = pathname.match(/^\/api\/analyst\/finding\/([^/]+)$/)) && method === 'DELETE') {
    const f = get('SELECT engagement_id FROM findings WHERE id=?', m[1]);
    report.deleteFinding(m[1]); if (f) logAct(f.engagement_id, user.id, 'deleted_finding', m[1]); return { status:200, data:{ ok:true } };
  }
  // REPORT (Phase 5)
  if ((m = pathname.match(/^\/api\/analyst\/engagement\/([^/]+)\/report\/generate$/)) && method === 'POST') {
    const g = notReady(m[1]) || scoringGate(m[1]); if (g) return g;
    if (get("SELECT id FROM reports WHERE engagement_id=? AND status='published'", m[1])) return { status:409, data:{ error:'A published report already exists and is locked. It cannot be regenerated.' } };
    const out = report.generate(m[1], user); logAct(m[1], user.id, 'generated_report', null); return { status:200, data: out };
  }
  // AI report narrative — rewrites the 4 editable sections as consulting prose (analyst reviews before publish)
  if ((m = pathname.match(/^\/api\/analyst\/engagement\/([^/]+)\/report\/narrate$/)) && method === 'POST') {
    const eid = m[1];
    const g = notReady(eid) || scoringGate(eid); if (g) return g;
    const rep = report.getReport(eid);
    if (!rep.report) return { status:200, data:{ error:'Generate the report first, then rewrite with AI.' } };
    if (rep.report.status === 'published') return { status:200, data:{ error:'Published report is locked — cannot rewrite.' } };
    return aireport.narrate(eid, body.model)
      .then(out => {
        if (out.available === false || out.error) return { status:200, data: out };
        Object.entries(out.sections).forEach(([k, v]) => report.editSection(rep.report.id, k, v, user));
        logAct(eid, user.id, 'ai_narrate_report', out.model || '');
        return { status:200, data:{ available:true, model:out.model, report: report.getReport(eid) } };
      })
      .catch(e => ({ status:200, data:{ available: ai.available(), error: String(e && e.message || e) } }));
  }
  if ((m = pathname.match(/^\/api\/analyst\/engagement\/([^/]+)\/report$/)) && method === 'GET') {
    return { status:200, data: report.getReport(m[1]) };
  }
  if ((m = pathname.match(/^\/api\/analyst\/report\/([^/]+)\/section$/)) && method === 'POST') {
    const out = report.editSection(m[1], body.key, body.content, user);
    if (out.status === 200) logAct(engagementOfReport(m[1]), user.id, 'edited_section', body.key);
    return out;
  }
  if ((m = pathname.match(/^\/api\/analyst\/report\/([^/]+)\/approve$/)) && method === 'POST') {
    const out = report.approve(m[1], user); if (out.status === 200) logAct(engagementOfReport(m[1]), user.id, 'approved_report', m[1]); return out;
  }
  if ((m = pathname.match(/^\/api\/analyst\/report\/([^/]+)\/publish$/)) && method === 'POST') {
    const out = report.publish(m[1], user); if (out.status === 200) logAct(engagementOfReport(m[1]), user.id, 'published_report', m[1]); return out;
  }
  return { status:404, data:{ error:'Not found' } };
}
module.exports = { handle };
