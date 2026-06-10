/* One-time: wipe test data, pre-load Greenstone + FlowOps as delivered engagements.
   Run: node --experimental-sqlite seed_demo.js   (server should be stopped) */
const db = require('./db'); db.seed();           // ensure roles, staff, scorecards
const auth = require('./auth');
const engine = require('./engine');
const report = require('./report');
const { db: raw, get, all, run, uid, now } = db;
raw.exec('PRAGMA busy_timeout=5000');

const staff = get("SELECT id FROM users WHERE email='analyst@1xl.co'");

console.log('Wiping client/test data…');
raw.exec('PRAGMA foreign_keys=OFF');
['notifications','status_events','activity_logs','audit_trails','comments','report_sections','reports','blueprint_sections','blueprints','opportunities','findings','assessment_scores','assessments','ai_extractions','prompt_answers','discovery_responses','documents','business_profiles','company_members','engagements','companies']
  .forEach(t => run('DELETE FROM ' + t));
run('DELETE FROM user_roles WHERE company_id IS NOT NULL');
run('DELETE FROM users WHERE is_staff=0');
run('DELETE FROM sessions');
raw.exec('PRAGMA foreign_keys=ON');

function setScores(engId, type, targets) {
  const cfg = engine.config(type)[0];
  const list = [];
  cfg.categories.forEach(cat => {
    let t = targets[cat.name] || 0;
    cat.areas.forEach(ar => { const v = Math.min(ar.max, t); list.push({ area_id: ar.id, raw_score: v, confidence: 'high', evidence_note: 'Scored from discovery + uploaded evidence' }); t -= v; });
  });
  engine.saveScores(engId, type, list, staff);
}

function makeClient(spec) {
  const t = now(), userId = uid(), companyId = uid();
  run('INSERT INTO users(id,email,password_hash,full_name,is_staff,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
    userId, spec.email, auth.hashPassword('demo123'), spec.contact, 0, 'active', t, t);
  run('INSERT INTO companies(id,name,owner_id,industry,revenue_band,team_band,hq_country,lifecycle_stage,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
    companyId, spec.company, userId, spec.industry, spec.revenue, spec.team, spec.hq, 'diagnostic', t, t);
  const ownerMemberId = uid();
  run('INSERT INTO company_members(id,company_id,user_id,name,email,member_role,status,created_at) VALUES(?,?,?,?,?,?,?,?)',
    ownerMemberId, companyId, userId, spec.contact, spec.email, 'owner', 'active', t);
  const ownerRole = get("SELECT id FROM roles WHERE key='owner'");
  run('INSERT INTO user_roles(id,user_id,role_id,company_id,created_at) VALUES(?,?,?,?,?)', uid(), userId, ownerRole.id, companyId, t);
  run('INSERT INTO business_profiles(company_id,data,updated_at) VALUES(?,?,?)', companyId, JSON.stringify({ markets: spec.markets, offerings: spec.offerings }), t);
  const respId = uid();
  run('INSERT INTO discovery_responses(id,company_id,engagement_id,status,progress,created_at,updated_at) VALUES(?,?,?,?,?,?,?)', respId, companyId, null, 'submitted', spec.answers.length, t, t);
  spec.answers.forEach(a => run('INSERT INTO prompt_answers(id,response_id,company_id,prompt_code,section_key,value_text,answered_by,updated_at) VALUES(?,?,?,?,?,?,?,?)', uid(), respId, companyId, a[0], a[1], a[2], ownerMemberId, t));
  run('INSERT INTO ai_extractions(id,response_id,type,extracted_text,status,updated_at) VALUES(?,?,?,?,?,?)', uid(), respId, 'smart', JSON.stringify(spec.smart), 'confirmed', t);
  const engId = uid();
  run('INSERT INTO engagements(id,company_id,status,submitted_at,assigned_analyst_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)', engId, companyId, 'submitted', t, staff.id, t, t);
  setScores(engId, 'maturity', spec.maturity);
  setScores(engId, 'potential', spec.potential);
  report.generateDraftFindings(engId, staff);
  const r = report.generate(engId, staff);
  report.publish(r.report.id, staff);
  console.log(`  ✓ ${spec.company} delivered  —  client login: ${spec.email} / demo123`);
}

makeClient({
  company:'FlowOps', contact:'Rohan Mehta', email:'founder@flowops.io', industry:'B2B SaaS', revenue:'$500k-1M', team:'11-50', hq:'India',
  markets:'India, US', offerings:'Workflow automation platform (subscription)',
  answers:[['biz_what','business','A no-code workflow automation platform for mid-market operations teams.'],['biz_blocker','business','No go-to-market engine; founders close every deal.'],['cust_icp','customer','Mid-market operations leaders (50-500 employees).'],['mktg_channels','marketing','Some content, light SEO, almost no paid.'],['sales_process','sales','No documented sales process; a basic CRM lightly used.'],['fin_trend','financial','USD 540K ARR, target USD 1.2M; low churn (1.4%/mo).']],
  smart:{ icp:'Mid-market ops teams (50-500 employees)', challenges:'No demand-gen engine; founder-led sales; fuzzy ICP', objectives:'Reach USD 1.2M ARR; repeatable GTM', opps:'Content/SEO, outbound, activation fix' },
  maturity:{'Business Foundation':9,'Market Position':7,'Customer Understanding':7,'Competitive Strength':8,'Sales Excellence':7,'Marketing Effectiveness':7,'Funnel Performance':7,'Technology & Data':5,'Team & Operations':3,'Financial Health':8},
  potential:{'Market Opportunity':13,'Product / Service Strength':9,'Customer Demand':9,'Competitive Advantage':7,'Revenue Expansion Potential':14,'Sales Scalability':8,'Marketing Scalability':9,'Operational Scalability':4,'Geographic Expansion Potential':5,'Leadership & Growth Readiness':8}
});

makeClient({
  company:'Greenstone Developers', contact:'Andre Wijaya', email:'founder@greenstone.id', industry:'Real Estate', revenue:'$5-20M', team:'51-200', hq:'Indonesia',
  markets:'Jakarta, Indonesia', offerings:'Residential apartments & landed houses',
  answers:[['biz_what','business','A residential real estate developer building apartments and houses in Jakarta.'],['biz_blocker','business','Leads come from brokers/hoardings; we lose track of half of them.'],['cust_icp','customer','Mid/upper-income home buyers and investors in Jakarta.'],['mktg_channels','marketing','Billboards, brokers, some Google/Meta, property portals (Rumah123, Lamudi).'],['sales_process','sales','No CRM — registers, spreadsheets, and WhatsApp.'],['fin_trend','financial','USD 8M recognized; target USD 14M.']],
  smart:{ icp:'Mid/upper-income Jakarta home buyers & investors', challenges:'~45% of leads unlogged; broker dependency; weak digital', objectives:'Sell out projects faster; reduce broker dependency', opps:'Owned digital demand (Google/Meta/portals); CRM + nurturing' },
  maturity:{'Business Foundation':6,'Market Position':7,'Customer Understanding':6,'Competitive Strength':5,'Sales Excellence':6,'Marketing Effectiveness':6,'Funnel Performance':4,'Technology & Data':2,'Team & Operations':3,'Financial Health':7},
  potential:{'Market Opportunity':12,'Product / Service Strength':8,'Customer Demand':8,'Competitive Advantage':7,'Revenue Expansion Potential':12,'Sales Scalability':7,'Marketing Scalability':8,'Operational Scalability':4,'Geographic Expansion Potential':4,'Leadership & Growth Readiness':10}
});

console.log('\nDone. Restart the server (start.cmd) and open /analyst/ or /client/.');
