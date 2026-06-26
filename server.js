/* Scale9X Platform — single server, two portals, one shared DB.
   Run: node --experimental-sqlite server.js   (or double-click start.cmd) */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const dbm = require('./db');
dbm.seed(); // roles + demo staff
const auth = require('./auth');
const portal = require('./portal');
const analyst = require('./analyst');
const { uid, now, get, all, run } = dbm;

const PORT = process.env.PORT || process.argv[2] || 8090;
const PUBLIC = path.join(__dirname, 'public');
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png' };

/* ---------- helpers ---------- */
const MAX_BODY = 14 * 1024 * 1024; // ~10MB file once base64-encoded; also a DoS backstop
function send(res, status, obj) { const b = JSON.stringify(obj); res.writeHead(status, { 'Content-Type':'application/json' }); res.end(b); }
function bodyOf(req) { return new Promise(r => { let d=''; let size=0; let over=false; req.on('data',c=>{ size+=c.length; if(size>MAX_BODY){ over=true; req.destroy(); r({ __toolarge:true }); return; } d+=c; }); req.on('end',()=>{ if(over) return; try{r(d?JSON.parse(d):{})}catch(e){r({})} }); req.on('error',()=>r({})); }); }
function tokenOf(req) { const h = req.headers.authorization||''; return h.startsWith('Bearer ')?h.slice(7):null; }
function currentUser(req) { return auth.userByToken(tokenOf(req)); }
function audit(actor, action, entity, id) { run('INSERT INTO audit_trails(id,actor_id,action,entity_type,entity_id,at) VALUES(?,?,?,?,?,?)', uid(), actor||null, action, entity, id, now()); }

/* ---------- API ---------- */
async function api(req, res, pathname) {
  const method = req.method;
  const body = (method==='POST'||method==='PATCH'||method==='PUT') ? await bodyOf(req) : {};
  if (body && body.__toolarge) return send(res,413,{ error:'Upload too large — 10MB maximum per file.' });

  if (pathname === '/api/health') return send(res,200,{ ok:true, time:now(), db:'sqlite' });

  // SIGN UP (business owner)
  if (pathname === '/api/auth/signup' && method==='POST') {
    const { full_name, email, password, company } = body;
    if (!full_name || !email || !password || !company) return send(res,400,{ error:'full_name, email, password, company required' });
    if (get('SELECT id FROM users WHERE email=?', String(email).toLowerCase())) return send(res,409,{ error:'An account with this email already exists' });
    const userId = uid(), companyId = uid(), t = now();
    run('INSERT INTO users(id,email,password_hash,full_name,is_staff,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
      userId, String(email).toLowerCase(), auth.hashPassword(password), full_name, 0, 'active', t, t);
    run('INSERT INTO companies(id,name,owner_id,lifecycle_stage,created_at,updated_at) VALUES(?,?,?,?,?,?)',
      companyId, company, userId, 'lead', t, t);
    run('INSERT INTO company_members(id,company_id,user_id,name,email,member_role,status,created_at) VALUES(?,?,?,?,?,?,?,?)',
      uid(), companyId, userId, full_name, email, 'owner', 'active', t);
    const ownerRole = get('SELECT id FROM roles WHERE key=?', 'owner');
    run('INSERT INTO user_roles(id,user_id,role_id,company_id,created_at) VALUES(?,?,?,?,?)', uid(), userId, ownerRole.id, companyId, t);
    audit(userId,'signup','users',userId);
    const token = auth.createSession(userId);
    return send(res,201,{ token, user:{ id:userId, full_name, email, is_staff:0 }, company:{ id:companyId, name:company } });
  }

  // STAFF SIGN UP (analyst self-registration → 'analyst' role; admins can elevate later)
  if (pathname === '/api/auth/staff-signup' && method==='POST') {
    const { full_name, email, password } = body;
    if (!full_name || !email || !password) return send(res,400,{ error:'full_name, email, password required' });
    if (get('SELECT id FROM users WHERE email=?', String(email).toLowerCase())) return send(res,409,{ error:'An account with this email already exists' });
    const userId = uid(), t = now();
    run('INSERT INTO users(id,email,password_hash,full_name,is_staff,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
      userId, String(email).toLowerCase(), auth.hashPassword(password), full_name, 1, 'active', t, t);
    const role = get("SELECT id FROM roles WHERE key='analyst'");
    run('INSERT INTO user_roles(id,user_id,role_id,company_id,created_at) VALUES(?,?,?,?,?)', uid(), userId, role.id, null, t);
    audit(userId,'staff_signup','users',userId);
    const token = auth.createSession(userId);
    return send(res,201,{ token, user:{ id:userId, full_name, email, is_staff:1 }, roles:auth.rolesFor(userId) });
  }

  // LOGIN
  if (pathname === '/api/auth/login' && method==='POST') {
    const { email, password } = body;
    const u = get('SELECT * FROM users WHERE email=?', String(email||'').toLowerCase());
    if (!u || !auth.verifyPassword(password, u.password_hash)) return send(res,401,{ error:'Invalid email or password' });
    run('UPDATE users SET last_login_at=? WHERE id=?', now(), u.id);
    const token = auth.createSession(u.id);
    return send(res,200,{ token, user:{ id:u.id, full_name:u.full_name, email:u.email, is_staff:u.is_staff }, roles:auth.rolesFor(u.id) });
  }

  // LOGOUT
  if (pathname === '/api/auth/logout' && method==='POST') { const t=tokenOf(req); if(t) auth.deleteSession(t); return send(res,200,{ ok:true }); }

  // ME
  if (pathname === '/api/auth/me' && method==='GET') {
    const u = currentUser(req);
    if (!u) return send(res,401,{ error:'Not authenticated' });
    return send(res,200,{ user:u, roles:auth.rolesFor(u.id), companies:auth.companiesFor(u.id) });
  }

  // CLIENT PORTAL (Phase 2) — all data persists to the shared DB
  if (pathname.startsWith('/api/portal/')) {
    const u = currentUser(req);
    if (!u) return send(res,401,{ error:'Not authenticated' });
    const out = portal.handle(pathname, method, body, u);
    return send(res, out.status, out.data);
  }

  // ANALYST PORTAL (Phase 3) — same shared DB, staff-only
  if (pathname.startsWith('/api/analyst/')) {
    const u = currentUser(req);
    if (!u) return send(res,401,{ error:'Not authenticated' });
    const out = await analyst.handle(pathname, method, body, u);
    return send(res, out.status, out.data);
  }

  return send(res,404,{ error:'Not found', path:pathname });
}

/* ---------- authenticated document download (streamed binary, not JSON) ---------- */
function serveDocument(req, res, pathname) {
  const u = currentUser(req);
  if (!u) { res.writeHead(401, { 'Content-Type':'application/json' }); return res.end('{"error":"Not authenticated"}'); }
  const isAnalyst = pathname.startsWith('/api/analyst/');
  const docId = pathname.split('/').pop();
  const doc = get('SELECT * FROM documents WHERE id=?', docId);
  if (!doc) { res.writeHead(404); return res.end('Not found'); }
  // Authorize: staff who can access an engagement of the doc's company (or admin); else the owning company's own members.
  let ok = false;
  if (isAnalyst) {
    if (!u.is_staff) { res.writeHead(403); return res.end('Forbidden'); }
    const admin = auth.rolesFor(u.id).some(r => r.key === 'admin' || r.key === 'super_admin');
    ok = admin || !!get('SELECT 1 FROM engagements WHERE company_id=? AND (assigned_analyst_id=? OR reviewer_id=?) LIMIT 1', doc.company_id, u.id, u.id);
  } else {
    ok = !!get('SELECT 1 FROM companies WHERE id=? AND owner_id=?', doc.company_id, u.id)
      || !!get('SELECT 1 FROM company_members WHERE company_id=? AND user_id=?', doc.company_id, u.id);
  }
  if (!ok) { res.writeHead(403); return res.end('Forbidden'); }
  if (!doc.file_path || !fs.existsSync(doc.file_path)) { res.writeHead(404, { 'Content-Type':'application/json' }); return res.end('{"error":"File bytes are not stored for this document."}'); }
  const safeName = String(doc.file_name || 'file').replace(/[\r\n"]/g, '');
  res.writeHead(200, { 'Content-Type': doc.mime || 'application/octet-stream', 'Content-Disposition': 'attachment; filename="' + safeName + '"', 'Cache-Control': 'private, no-store' });
  fs.createReadStream(doc.file_path).pipe(res);
}

/* ---------- static (portals) ---------- */
function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const fp = path.join(PUBLIC, rel);
  if (!fp.startsWith(PUBLIC)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type':'text/html' }); return res.end('<h1>404</h1><p>Scale9X Platform — file not found.</p>'); }
    // No caching: the portals are a single-file SPA per role; always serve the latest HTML/JS/CSS
    // so a browser never runs a stale app.js (which makes buttons look "dead").
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'text/plain', 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname;
  // Binary document download is authenticated but streamed (not JSON) — handle before the JSON router.
  if (req.method === 'GET' && /^\/api\/(?:portal|analyst)\/document\/[^/]+$/.test(pathname)) {
    try { return serveDocument(req, res, pathname); } catch (e) { res.writeHead(500); return res.end('error'); }
  }
  if (pathname.startsWith('/api/')) return api(req, res, pathname).catch(e => send(res,500,{ error:String(e&&e.message||e) }));
  serveStatic(req, res, pathname);
});
server.listen(PORT, () => console.log(`\n  Scale9X Platform running →  http://localhost:${PORT}\n  Shared DB: data/1xl.db  ·  Staff login: analyst@1xl.co / changeme\n`));
