/* 1XL Platform — Client Portal API (Phase 2). All data persists to the shared DB.
   handle(pathname, method, body, user) -> { status, data } */
const { uid, now, get, all, run, DATA_DIR } = require('./db');
const fs = require('fs');
const path = require('path');
const MAX_FILE = 10 * 1024 * 1024; // 10MB per document
const MIME_OK = ['application/pdf','image/png','image/jpeg','image/gif','image/webp','text/plain','text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword','application/vnd.ms-excel','application/vnd.ms-powerpoint','application/octet-stream'];
// All discovery questions must be answered before a client can submit. Keep in sync with public/client/data.js PROMPTS.
const REQUIRED_PROMPTS = 31;
function answeredCount(companyId) { return get("SELECT COUNT(*) n FROM prompt_answers WHERE company_id=? AND TRIM(COALESCE(value_text,''))<>''", companyId).n; }

function companyOf(userId) {
  return get('SELECT * FROM companies WHERE owner_id=?', userId)
      || get('SELECT c.* FROM companies c JOIN company_members m ON m.company_id=c.id WHERE m.user_id=? LIMIT 1', userId);
}
function ensureResponse(companyId) {
  let r = get('SELECT * FROM discovery_responses WHERE company_id=?', companyId);
  if (!r) { const id = uid(); run('INSERT INTO discovery_responses(id,company_id,status,progress,created_at,updated_at) VALUES(?,?,?,?,?,?)', id, companyId, 'in_progress', 0, now(), now()); r = get('SELECT * FROM discovery_responses WHERE id=?', id); }
  return r;
}
function buildState(user) {
  const c = companyOf(user.id);
  if (!c) return { status: 400, data: { error: 'No company for this user' } };
  const prof = get('SELECT data FROM business_profiles WHERE company_id=?', c.id);
  const extra = prof ? JSON.parse(prof.data) : {};
  const profile = { company: c.name, industry: c.industry || '', website: c.website || '', revenue: c.revenue_band || '', team: c.team_band || '', markets: extra.markets || '', offerings: extra.offerings || '' };
  const r = get('SELECT * FROM discovery_responses WHERE company_id=?', c.id); // read-only — don't create on view
  const ansRows = all('SELECT prompt_code,value_text,answered_by FROM prompt_answers WHERE company_id=?', c.id);
  const answers = {}, answeredBy = {};
  ansRows.forEach(a => { answers[a.prompt_code] = a.value_text; answeredBy[a.prompt_code] = a.answered_by; });
  const sRow = r ? get("SELECT extracted_text,status FROM ai_extractions WHERE response_id=? AND type='smart'", r.id) : null;
  const smart = sRow ? Object.assign(JSON.parse(sRow.extracted_text || '{}'), { confirmed: sRow.status === 'confirmed' }) : { confirmed: false };
  const docs = {};
  all('SELECT id,category,file_name FROM documents WHERE company_id=?', c.id).forEach(d => { (docs[d.category] = docs[d.category] || []).push({ id: d.id, name: d.file_name }); });
  const members = all('SELECT id,name,email,member_role,assigned_sections FROM company_members WHERE company_id=?', c.id)
    .map(m => ({ id: m.id, name: m.name + (m.member_role === 'owner' ? ' (you)' : ''), email: m.email, role: m.member_role === 'owner' ? 'Owner' : (m.member_role || 'Contributor'), sections: m.assigned_sections ? JSON.parse(m.assigned_sections) : [] }));
  const ownerMember = members.find(m => m.role === 'Owner');
  const eng = get("SELECT id,status,published_at FROM engagements WHERE company_id=? ORDER BY created_at DESC LIMIT 1", c.id);
  const pub = eng ? get("SELECT id,version,published_at FROM reports WHERE engagement_id=? AND status='published' ORDER BY version DESC LIMIT 1", eng.id) : null;
  const unread = get('SELECT COUNT(*) n FROM notifications WHERE user_id=? AND read_at IS NULL', user.id).n;
  return { status: 200, data: {
    company: { id: c.id, name: c.name }, profile, responseId: r ? r.id : null, submitted: !!(r && r.status === 'submitted'),
    answers, answeredBy, smart, docs, members, ownerId: ownerMember ? ownerMember.id : 'owner',
    engagement: eng ? { status: eng.status, delivered: eng.status === 'delivered', published_at: eng.published_at } : null,
    report: pub || null, unread
  }};
}

function handle(pathname, method, body, user) {
  const c = companyOf(user.id);
  if (!c && pathname !== '/api/portal/state') return { status: 400, data: { error: 'No company' } };
  const cid = c ? c.id : null;

  if (pathname === '/api/portal/state' && method === 'GET') return buildState(user);

  if (pathname === '/api/portal/profile' && method === 'PATCH') {
    run('UPDATE companies SET name=?,industry=?,website=?,revenue_band=?,team_band=?,updated_at=? WHERE id=?',
      body.company || c.name, body.industry || null, body.website || null, body.revenue || null, body.team || null, now(), cid);
    const existing = get('SELECT company_id FROM business_profiles WHERE company_id=?', cid);
    const data = JSON.stringify({ markets: body.markets || '', offerings: body.offerings || '' });
    if (existing) run('UPDATE business_profiles SET data=?,updated_at=? WHERE company_id=?', data, now(), cid);
    else run('INSERT INTO business_profiles(company_id,data,updated_at) VALUES(?,?,?)', cid, data, now());
    return { status: 200, data: { ok: true } };
  }

  if (pathname === '/api/portal/answer' && method === 'PUT') {
    const r = ensureResponse(cid);
    const ex = get('SELECT id FROM prompt_answers WHERE company_id=? AND prompt_code=?', cid, body.code);
    if (ex) run('UPDATE prompt_answers SET value_text=?,answered_by=?,section_key=?,updated_at=? WHERE id=?', body.value, body.by || null, body.section || null, now(), ex.id);
    else run('INSERT INTO prompt_answers(id,response_id,company_id,prompt_code,section_key,value_text,answered_by,updated_at) VALUES(?,?,?,?,?,?,?,?)', uid(), r.id, cid, body.code, body.section || null, body.value, body.by || null, now());
    const n = get('SELECT COUNT(*) n FROM prompt_answers WHERE company_id=?', cid).n;
    run('UPDATE discovery_responses SET progress=?,updated_at=? WHERE id=?', n, now(), r.id);
    return { status: 200, data: { ok: true } };
  }

  if (pathname === '/api/portal/smart' && method === 'POST') {
    const r = ensureResponse(cid);
    const text = JSON.stringify({ icp: body.icp || '', challenges: body.challenges || '', objectives: body.objectives || '', opps: body.opps || '' });
    const st = body.confirmed ? 'confirmed' : 'suggested';
    const ex = get("SELECT id FROM ai_extractions WHERE response_id=? AND type='smart'", r.id);
    if (ex) run('UPDATE ai_extractions SET extracted_text=?,status=?,updated_at=? WHERE id=?', text, st, now(), ex.id);
    else run("INSERT INTO ai_extractions(id,response_id,type,extracted_text,status,updated_at) VALUES(?,?,?,?,?,?)", uid(), r.id, 'smart', text, st, now());
    return { status: 200, data: { ok: true } };
  }

  if (pathname === '/api/portal/team' && method === 'POST') {
    const id = uid();
    run('INSERT INTO company_members(id,company_id,name,email,member_role,assigned_sections,status,created_at) VALUES(?,?,?,?,?,?,?,?)',
      id, cid, body.name, body.email || null, (body.role || 'Contributor').toLowerCase(), JSON.stringify(body.sections || []), 'invited', now());
    return { status: 201, data: buildState(user).data };
  }

  if (pathname === '/api/portal/assign' && method === 'POST') {
    // remove section from all members, add to target
    all('SELECT id,assigned_sections FROM company_members WHERE company_id=?', cid).forEach(m => {
      let secs = m.assigned_sections ? JSON.parse(m.assigned_sections) : [];
      secs = secs.filter(s => s !== body.section);
      if (m.id === body.member_id) secs.push(body.section);
      run('UPDATE company_members SET assigned_sections=? WHERE id=?', JSON.stringify(secs), m.id);
    });
    return { status: 200, data: buildState(user).data };
  }

  if (pathname === '/api/portal/document' && method === 'POST') {
    const CATS = ['sales','marketing','financial','business','operations'];
    if (!body.name || !String(body.name).trim()) return { status: 400, data: { error: 'A file name is required.' } };
    if (!CATS.includes(body.category)) return { status: 400, data: { error: 'Invalid document category.' } };
    if (!body.data) return { status: 400, data: { error: 'No file data received.' } };
    let buf; try { buf = Buffer.from(String(body.data), 'base64'); } catch (e) { return { status: 400, data: { error: 'Could not read the file data.' } }; }
    if (!buf.length) return { status: 400, data: { error: 'The file appears to be empty.' } };
    if (buf.length > MAX_FILE) return { status: 400, data: { error: 'File exceeds the 10MB limit.' } };
    const mime = MIME_OK.includes(body.mime) ? body.mime : 'application/octet-stream';
    const id = uid();
    const dir = path.join(DATA_DIR, 'uploads');
    try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, id), buf); }
    catch (e) { return { status: 500, data: { error: 'Could not store the file.' } }; }
    const eng = get("SELECT id FROM engagements WHERE company_id=? AND status!='delivered' ORDER BY created_at DESC LIMIT 1", cid);
    run('INSERT INTO documents(id,company_id,engagement_id,category,file_name,file_path,mime,size,uploaded_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
      id, cid, eng ? eng.id : null, body.category, String(body.name).slice(0, 300), path.join(dir, id), mime, buf.length, user.id, now());
    return { status: 201, data: { id, size: buf.length } };
  }
  if (pathname.startsWith('/api/portal/document/') && method === 'DELETE') {
    const id = pathname.split('/').pop();
    const doc = get('SELECT file_path FROM documents WHERE id=? AND company_id=?', id, cid);
    run('DELETE FROM documents WHERE id=? AND company_id=?', id, cid);
    if (doc && doc.file_path) { try { fs.unlinkSync(doc.file_path); } catch (e) {} }
    return { status: 200, data: { ok: true } };
  }

  if (pathname === '/api/portal/submit' && method === 'POST') {
    const done = answeredCount(cid);
    if (done < REQUIRED_PROMPTS) return { status: 400, data: { error: `Please answer all ${REQUIRED_PROMPTS} discovery questions before submitting — you've completed ${done}.`, answered: done, required: REQUIRED_PROMPTS } };
    const r = ensureResponse(cid);
    run('UPDATE discovery_responses SET status=?,updated_at=? WHERE id=?', 'submitted', now(), r.id);
    // Phase 3 expands the workflow; here we create the engagement so the analyst side has it.
    let eng = get("SELECT * FROM engagements WHERE company_id=? AND status!='delivered'", cid);
    if (!eng) {
      const id = uid();
      run('INSERT INTO engagements(id,company_id,status,submitted_at,created_at,updated_at) VALUES(?,?,?,?,?,?)', id, cid, 'submitted', now(), now(), now());
      run('INSERT INTO status_events(id,engagement_id,from_status,to_status,actor_id,at) VALUES(?,?,?,?,?,?)', uid(), id, 'draft', 'submitted', user.id, now());
      run('UPDATE companies SET lifecycle_stage=? WHERE id=?', 'diagnostic', cid);
      eng = get('SELECT * FROM engagements WHERE id=?', id);
      // Notify only on first submission — re-submits (double-click) must not spam the client.
      run('INSERT INTO notifications(id,user_id,type,payload,created_at) VALUES(?,?,?,?,?)', uid(), user.id, 'status', JSON.stringify({ engagement_id: eng.id, status: 'submitted', message: 'Your diagnostic has been submitted and is now under review.' }), now());
    }
    return { status: 200, data: { ok: true, engagement_id: eng.id, status: 'submitted' } };
  }

  // ---- Phase 6: client report center + notifications (published only) ----
  let m;
  if (pathname === '/api/portal/reports' && method === 'GET') {
    const reports = all("SELECT r.id,r.version,r.published_at FROM reports r JOIN engagements e ON e.id=r.engagement_id WHERE e.company_id=? AND r.status='published' ORDER BY r.published_at DESC", cid);
    return { status: 200, data: { reports } };
  }
  if ((m = pathname.match(/^\/api\/portal\/report\/([^/]+)$/)) && method === 'GET') {
    const r = get('SELECT r.*, e.company_id FROM reports r JOIN engagements e ON e.id=r.engagement_id WHERE r.id=?', m[1]);
    if (!r || r.company_id !== cid || r.status !== 'published') return { status: 404, data: { error: 'Report not available' } };
    const order = ['executive_summary','business_reality','growth_blueprint','diagnostic_scores','magic_matrix','strengths_weaknesses','key_findings','diagnostic_narrative','opportunity_matrix','opportunity_matrix_v2','revenue_expansion','strategic_bets','focus_ignore','strategic_recommendations','ninety_day_plan','twelve_month_roadmap','kpi_framework','budget_allocation','industry_context'];
    const sections = {};
    all('SELECT key,content FROM report_sections WHERE report_id=?', r.id).forEach(s => { if (order.includes(s.key)) sections[s.key] = JSON.parse(s.content); });
    return { status: 200, data: { report: { id: r.id, version: r.version, published_at: r.published_at, company: c.name }, sections, order } };
  }
  if (pathname === '/api/portal/notifications' && method === 'GET') {
    const items = all('SELECT id,type,payload,read_at,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC', user.id)
      .map(n => Object.assign({ id: n.id, type: n.type, read: !!n.read_at, at: n.created_at }, JSON.parse(n.payload || '{}')));
    return { status: 200, data: { items, unread: items.filter(i => !i.read).length } };
  }
  if (pathname === '/api/portal/notifications/read' && method === 'POST') {
    run('UPDATE notifications SET read_at=? WHERE user_id=? AND read_at IS NULL', now(), user.id);
    return { status: 200, data: { ok: true } };
  }

  return { status: 404, data: { error: 'Not found', path: pathname } };
}
module.exports = { handle };
