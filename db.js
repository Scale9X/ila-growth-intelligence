/* Scale9X Platform — shared database (node:sqlite, zero dependencies).
   One file = one shared DB for both portals. Ports to Postgres/Supabase later (same SQL). */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

// Runtime data (database, WAL, uploads) MUST live outside any cloud-synced folder (e.g. OneDrive):
// syncing a live SQLite file risks lock errors and corruption. Configurable via XL_DATA_DIR.
// Default: a folder in the user's home dir (outside OneDrive on Windows).
const DATA_DIR = process.env.XL_DATA_DIR || path.join(os.homedir(), '1xl-data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, '1xl.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;'); // wait up to 5s on a locked DB instead of erroring

/* ---------- schema (idempotent; full set so later phases just add handlers) ---------- */
db.exec(`
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL, name TEXT NOT NULL, scope TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT,
  full_name TEXT, is_staff INTEGER DEFAULT 0, status TEXT DEFAULT 'active',
  last_login_at TEXT, created_at TEXT, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), created_at TEXT
);
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT, industry TEXT, revenue_band TEXT,
  team_band TEXT, hq_country TEXT, website TEXT, lifecycle_stage TEXT DEFAULT 'lead',
  owner_id TEXT REFERENCES users(id), created_at TEXT, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
  role_id TEXT NOT NULL REFERENCES roles(id), company_id TEXT REFERENCES companies(id),
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS company_members (
  id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id),
  user_id TEXT REFERENCES users(id), name TEXT, email TEXT, member_role TEXT,
  assigned_sections TEXT, status TEXT DEFAULT 'active', created_at TEXT
);
CREATE TABLE IF NOT EXISTS engagements (
  id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id),
  status TEXT DEFAULT 'draft', package TEXT, assigned_analyst_id TEXT REFERENCES users(id),
  reviewer_id TEXT REFERENCES users(id), due_date TEXT, submitted_at TEXT, published_at TEXT,
  created_at TEXT, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS business_profiles (
  company_id TEXT PRIMARY KEY REFERENCES companies(id), data TEXT, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS discovery_responses (
  id TEXT PRIMARY KEY, engagement_id TEXT REFERENCES engagements(id),
  company_id TEXT REFERENCES companies(id), status TEXT DEFAULT 'in_progress',
  progress INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS prompt_answers (
  id TEXT PRIMARY KEY, response_id TEXT REFERENCES discovery_responses(id),
  company_id TEXT, prompt_code TEXT, section_key TEXT, value_text TEXT,
  answered_by TEXT, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS ai_extractions (
  id TEXT PRIMARY KEY, response_id TEXT, type TEXT, extracted_text TEXT,
  confidence TEXT, status TEXT DEFAULT 'suggested', updated_at TEXT
);
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY, company_id TEXT, engagement_id TEXT, category TEXT,
  file_name TEXT, file_path TEXT, mime TEXT, size INTEGER, uploaded_by TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS scorecards (
  id TEXT PRIMARY KEY, type TEXT, name TEXT, total_points INTEGER, version INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS score_categories (
  id TEXT PRIMARY KEY, scorecard_id TEXT REFERENCES scorecards(id), name TEXT, weight INTEGER, ord INTEGER
);
CREATE TABLE IF NOT EXISTS score_areas (
  id TEXT PRIMARY KEY, category_id TEXT REFERENCES score_categories(id), name TEXT,
  max_points INTEGER, rubric TEXT, evidence_required TEXT
);
CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY, engagement_id TEXT REFERENCES engagements(id), type TEXT,
  total REAL, grade TEXT, confidence_avg TEXT, status TEXT DEFAULT 'draft',
  computed_by TEXT, computed_at TEXT
);
CREATE TABLE IF NOT EXISTS assessment_scores (
  id TEXT PRIMARY KEY, assessment_id TEXT REFERENCES assessments(id), score_area_id TEXT,
  raw_score INTEGER, source TEXT, confidence TEXT, evidence_note TEXT, scored_by TEXT
);
CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY, engagement_id TEXT REFERENCES engagements(id), area TEXT,
  observation TEXT, root_cause TEXT, business_impact TEXT, opportunity TEXT, action TEXT,
  severity TEXT, confidence TEXT, evidence TEXT, created_by TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY, engagement_id TEXT REFERENCES engagements(id), title TEXT,
  impact TEXT, effort TEXT, quadrant TEXT, recommendation TEXT, status TEXT, source_area TEXT
);
CREATE TABLE IF NOT EXISTS blueprints (
  id TEXT PRIMARY KEY, engagement_id TEXT REFERENCES engagements(id), status TEXT DEFAULT 'draft',
  ai_generated INTEGER DEFAULT 0, approved_by TEXT, approved_at TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS blueprint_sections (
  id TEXT PRIMARY KEY, blueprint_id TEXT REFERENCES blueprints(id), key TEXT, content TEXT, ord INTEGER
);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY, engagement_id TEXT REFERENCES engagements(id), version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft', pdf_path TEXT, published_at TEXT, published_by TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS report_sections (
  id TEXT PRIMARY KEY, report_id TEXT REFERENCES reports(id), key TEXT, content TEXT,
  ai_generated INTEGER DEFAULT 0, edited_by TEXT, ord INTEGER
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, user_id TEXT, type TEXT, payload TEXT, read_at TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS status_events (
  id TEXT PRIMARY KEY, engagement_id TEXT, from_status TEXT, to_status TEXT, actor_id TEXT, note TEXT, at TEXT
);
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY, company_id TEXT, engagement_id TEXT, actor_id TEXT, verb TEXT, object TEXT, at TEXT
);
CREATE TABLE IF NOT EXISTS audit_trails (
  id TEXT PRIMARY KEY, actor_id TEXT, action TEXT, entity_type TEXT, entity_id TEXT, diff TEXT, ip TEXT, at TEXT
);
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY, entity_type TEXT, entity_id TEXT, author_id TEXT, body TEXT, resolved_at TEXT, created_at TEXT
);
`);

/* ---------- indexes (idempotent) — every foreign key / filter column used by a hot query ---------- */
db.exec(`
CREATE INDEX IF NOT EXISTS idx_sessions_token            ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_roles_user           ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company   ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user      ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_owner           ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_engagements_company       ON engagements(company_id);
CREATE INDEX IF NOT EXISTS idx_engagements_analyst       ON engagements(assigned_analyst_id);
CREATE INDEX IF NOT EXISTS idx_engagements_reviewer      ON engagements(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_engagements_status        ON engagements(status);
CREATE INDEX IF NOT EXISTS idx_discovery_company         ON discovery_responses(company_id);
CREATE INDEX IF NOT EXISTS idx_prompt_answers_company    ON prompt_answers(company_id);
CREATE INDEX IF NOT EXISTS idx_prompt_answers_response   ON prompt_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_ai_extractions_response   ON ai_extractions(response_id);
CREATE INDEX IF NOT EXISTS idx_assessments_engagement    ON assessments(engagement_id, type);
CREATE INDEX IF NOT EXISTS idx_scores_assessment         ON assessment_scores(assessment_id);
CREATE INDEX IF NOT EXISTS idx_scores_area               ON assessment_scores(score_area_id);
CREATE INDEX IF NOT EXISTS idx_score_categories_card     ON score_categories(scorecard_id);
CREATE INDEX IF NOT EXISTS idx_score_areas_category      ON score_areas(category_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_engagement  ON opportunities(engagement_id);
CREATE INDEX IF NOT EXISTS idx_findings_engagement       ON findings(engagement_id);
CREATE INDEX IF NOT EXISTS idx_reports_engagement        ON reports(engagement_id, status);
CREATE INDEX IF NOT EXISTS idx_report_sections_report    ON report_sections(report_id);
CREATE INDEX IF NOT EXISTS idx_documents_company         ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_engagement      ON documents(engagement_id);
CREATE INDEX IF NOT EXISTS idx_status_events_engagement  ON status_events(engagement_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_engagement  ON activity_logs(engagement_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_company     ON activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user        ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_company ON business_profiles(company_id);
`);

/* ---------- helpers ---------- */
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const get = (sql, ...p) => db.prepare(sql).get(...p);
const all = (sql, ...p) => db.prepare(sql).all(...p);
const run = (sql, ...p) => db.prepare(sql).run(...p);

/* ---------- seed roles + platform staff ---------- */
function seed() {
  const roles = [
    ['super_admin','Super Admin','platform'],['admin','Admin','platform'],
    ['analyst','Analyst','platform'],['reviewer','Reviewer','platform'],
    ['owner','Client Owner','company'],['client_admin','Client Admin','company'],
    ['contributor','Contributor','company']
  ];
  for (const [key,name,scope] of roles) {
    if (!get('SELECT id FROM roles WHERE key=?', key)) run('INSERT INTO roles(id,key,name,scope) VALUES(?,?,?,?)', uid(), key, name, scope);
  }
  // demo staff so the analyst portal has a login on first run
  ensureStaff('admin@1xl.co', 'Scale9X Admin', 'super_admin', 'changeme');
  ensureStaff('analyst@1xl.co', 'Maya Analyst', 'analyst', 'changeme');
  seedScorecards();
  rebrandFix();
  debrandDemoClient();
}
/* One-time Scale9X rebrand fix for pre-existing (live) databases. Idempotent:
   runs on every boot but is a no-op once names are corrected. Login emails are
   intentionally left as-is so existing credentials keep working. */
function rebrandFix() {
  run("UPDATE users SET full_name=REPLACE(REPLACE(full_name,'ILAtech','Scale9X'),'1XL','Scale9X') WHERE email IN ('admin@1xl.co','analyst@1xl.co') AND (full_name LIKE '%ILAtech%' OR full_name LIKE '%1XL%')");
  run("UPDATE scorecards SET name=REPLACE(REPLACE(name,'1XL ','Scale9X '),'ILAtech ','Scale9X ') WHERE name LIKE '1XL %' OR name LIKE 'ILAtech %'");
}
/* The seeded DEMO client was named "ILAtech" — confusing now that ILAtech is a
   separate partner brand. De-brand it to a neutral demo company across all of its
   content. Idempotent: guarded by the company name, so it runs once then no-ops.
   Only ever touches the rows belonging to that one demo company. */
function debrandDemoClient() {
  const c = get("SELECT id FROM companies WHERE name='ILAtech'");
  if (!c) return;
  const cid = c.id;
  // ILATech (doc-name style) -> Northwind ; ILAtech -> Northwind Solutions ; ilatech -> northwindsolutions
  const norm = s => `REPLACE(REPLACE(REPLACE(${s},'ILATech','Northwind'),'ILAtech','Northwind Solutions'),'ilatech','northwindsolutions')`;
  const eng = 'IN (SELECT id FROM engagements WHERE company_id=?)';
  run(`UPDATE business_profiles SET data=${norm('data')} WHERE company_id=?`, cid);
  run(`UPDATE prompt_answers SET value_text=${norm('value_text')} WHERE company_id=?`, cid);
  run(`UPDATE ai_extractions SET extracted_text=${norm('extracted_text')} WHERE response_id IN (SELECT id FROM discovery_responses WHERE company_id=?)`, cid);
  run(`UPDATE documents SET file_name=${norm('file_name')} WHERE company_id=?`, cid);
  run(`UPDATE findings SET observation=${norm('observation')}, root_cause=${norm('root_cause')}, business_impact=${norm('business_impact')}, opportunity=${norm('opportunity')}, action=${norm('action')}, evidence=${norm('evidence')} WHERE engagement_id ${eng}`, cid);
  run(`UPDATE opportunities SET title=${norm('title')}, recommendation=${norm('recommendation')} WHERE engagement_id ${eng}`, cid);
  run(`UPDATE blueprint_sections SET content=${norm('content')} WHERE blueprint_id IN (SELECT id FROM blueprints WHERE engagement_id ${eng})`, cid);
  run(`UPDATE report_sections SET content=${norm('content')} WHERE report_id IN (SELECT id FROM reports WHERE engagement_id ${eng})`, cid);
  // rename the company LAST so the guard above makes this whole pass idempotent
  run(`UPDATE companies SET name='Northwind Solutions', website=${norm('website')} WHERE id=?`, cid);
}
function seedScorecards() {
  const { SCORECARDS } = require('./scoring_seed');
  for (const sc of SCORECARDS) {
    let card = get('SELECT id FROM scorecards WHERE type=?', sc.type);
    if (!card) { const sid = uid(); run('INSERT INTO scorecards(id,type,name,total_points,version) VALUES(?,?,?,?,1)', sid, sc.type, sc.name, sc.total); card = { id: sid }; }
    sc.categories.forEach((cat, ci) => {
      let c = get('SELECT id FROM score_categories WHERE scorecard_id=? AND name=?', card.id, cat.name);
      if (!c) { const cid = uid(); run('INSERT INTO score_categories(id,scorecard_id,name,weight,ord) VALUES(?,?,?,?,?)', cid, card.id, cat.name, cat.weight, ci); c = { id: cid }; }
      cat.areas.forEach((area, ai) => {
        if (!get('SELECT id FROM score_areas WHERE category_id=? AND name=?', c.id, area.name))
          run('INSERT INTO score_areas(id,category_id,name,max_points,rubric,evidence_required) VALUES(?,?,?,?,?,?)', uid(), c.id, area.name, area.options.length - 1, JSON.stringify(area.options), null);
      });
    });
  }
}
function ensureStaff(email, name, roleKey, password) {
  if (get('SELECT id FROM users WHERE email=?', email)) return;
  const crypto2 = require('./auth');
  const id = uid();
  run('INSERT INTO users(id,email,password_hash,full_name,is_staff,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
    id, email, crypto2.hashPassword(password), name, 1, 'active', now(), now());
  const role = get('SELECT id FROM roles WHERE key=?', roleKey);
  run('INSERT INTO user_roles(id,user_id,role_id,company_id,created_at) VALUES(?,?,?,?,?)', uid(), id, role.id, null, now());
}

module.exports = { db, uid, now, get, all, run, seed, DATA_DIR };
