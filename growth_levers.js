/* Scale9X Standard v1 — the 9 Growth Levers.
   Canonical methodology: maps the 93 diagnostic areas onto 9 levers across 3 pillars,
   and computes lever / pillar / overall (9X) scores from an engine.diagnostic() result.
   Source of truth for the mapping + scoring: SCALE9X_STANDARD_V1.md.
   Blends Maturity + Potential; simple-average scoring; Pricing & Retention confidence-flagged. */

const PILLARS = [
  { id: 'foundation',  name: 'Growth Foundation',  levers: ['positioning', 'pricing', 'measurement'] },
  { id: 'engine',      name: 'Growth Engine',      levers: ['channels', 'acquisition', 'conversion'] },
  { id: 'multipliers', name: 'Growth Multipliers', levers: ['retention', 'expansion', 'execution'] }
];

// Each lever draws from these areas, keyed "Category::Area" (exact names from scoring_seed).
// Every one of the 93 scored areas maps to exactly one lever (verified: sums to 93).
const LEVERS = {
  positioning: { name: 'Positioning & Messaging', pillar: 'foundation', flagged: false, areas: [
    'Customer Understanding::ICP Definition', 'Customer Understanding::Customer Segmentation', 'Customer Understanding::Customer Insights', 'Customer Understanding::Buying Journey Mapping',
    'Competitive Strength::Unique Value Proposition', 'Competitive Strength::Market Defensibility', 'Competitive Strength::Competitive Advantage', 'Competitive Strength::Competitive Awareness', 'Competitive Strength::Competitive Monitoring',
    'Market Position::Market Differentiation', 'Market Position::Category Demand',
    'Product / Service Strength::Product-Market Fit', 'Product / Service Strength::Differentiation',
    'Competitive Advantage::Brand Strength', 'Competitive Advantage::Unique Proposition', 'Competitive Advantage::Barriers to Entry', 'Competitive Advantage::Defensibility'
  ] },
  pricing: { name: 'Pricing & Packaging', pillar: 'foundation', flagged: true, areas: [
    'Business Foundation::Clear Business Model', 'Business Foundation::Revenue Diversification',
    'Financial Health::Margin Health', 'Financial Health::Customer Economics',
    'Revenue Expansion Potential::Pricing Power',
    'Product / Service Strength::Repeatability'
  ] },
  measurement: { name: 'Measurement & Data', pillar: 'foundation', flagged: false, areas: [
    'Technology & Data::Tech Stack', 'Technology & Data::System Integration', 'Technology & Data::Automation', 'Technology & Data::Reporting', 'Technology & Data::Data Accuracy',
    'Marketing Effectiveness::Performance Measurement',
    'Sales Excellence::Forecasting & Reporting',
    'Funnel Performance::Funnel Visibility',
    'Financial Health::Financial Visibility'
  ] },
  channels: { name: 'Channels & Partnerships', pillar: 'engine', flagged: false, areas: [
    'Marketing Effectiveness::Channel Mix',
    'Marketing Scalability::Channel Expansion Potential', 'Marketing Scalability::Partnership Opportunities', 'Marketing Scalability::Paid Media Scalability',
    'Market Position::Geographic Expansion Readiness', 'Market Position::Market Opportunity', 'Market Position::Market Share Potential',
    'Geographic Expansion Potential::Market Replicability', 'Geographic Expansion Potential::Regional Expansion Readiness', 'Geographic Expansion Potential::Localization Complexity'
  ] },
  acquisition: { name: 'Acquisition & Demand Gen', pillar: 'engine', flagged: false, areas: [
    'Marketing Effectiveness::Strategy Quality', 'Marketing Effectiveness::Content & Brand Strength', 'Marketing Effectiveness::Marketing ROI',
    'Funnel Performance::Lead Qualification', 'Funnel Performance::Nurturing Process',
    'Customer Demand::Demand Consistency', 'Customer Demand::Customer Urgency',
    'Marketing Scalability::Content Scalability', 'Marketing Scalability::Brand Growth Potential',
    'Sales Scalability::Lead Generation Capacity',
    'Market Opportunity::Market Size', 'Market Opportunity::Market Growth Rate', 'Market Opportunity::Market Accessibility'
  ] },
  conversion: { name: 'Conversion & Sales', pillar: 'engine', flagged: false, areas: [
    'Sales Excellence::Lead Management', 'Sales Excellence::CRM Discipline', 'Sales Excellence::Conversion Rates', 'Sales Excellence::Sales Process Maturity',
    'Funnel Performance::Conversion Efficiency', 'Funnel Performance::Funnel Optimization',
    'Sales Scalability::Sales Process Repeatability', 'Sales Scalability::CRM Readiness', 'Sales Scalability::Conversion Potential'
  ] },
  retention: { name: 'Retention & Churn', pillar: 'multipliers', flagged: true, areas: [
    'Customer Understanding::Customer Retention Understanding',
    'Customer Demand::Retention Potential', 'Customer Demand::Referral Potential',
    'Product / Service Strength::Customer Satisfaction'
  ] },
  expansion: { name: 'Expansion & LTV', pillar: 'multipliers', flagged: false, areas: [
    'Revenue Expansion Potential::Upsell Potential', 'Revenue Expansion Potential::Cross-Sell Potential', 'Revenue Expansion Potential::Lifetime Value Growth', 'Revenue Expansion Potential::New Revenue Streams'
  ] },
  execution: { name: 'Execution & Operating Rhythm', pillar: 'multipliers', flagged: false, areas: [
    'Business Foundation::Strategic Direction', 'Business Foundation::Defined Growth Objectives', 'Business Foundation::Scalability Potential',
    'Team & Operations::Team Structure', 'Team & Operations::Accountability', 'Team & Operations::Talent Capability', 'Team & Operations::Leadership Alignment', 'Team & Operations::Operational Efficiency',
    'Financial Health::Revenue Growth', 'Financial Health::Growth Investment Capacity',
    'Operational Scalability::Process Maturity', 'Operational Scalability::Automation Potential', 'Operational Scalability::Delivery Capacity', 'Operational Scalability::Vendor Ecosystem', 'Operational Scalability::Systemization Potential',
    'Sales Scalability::Team Expansion Readiness',
    'Leadership & Growth Readiness::Founder Ambition', 'Leadership & Growth Readiness::Decision-Making Speed', 'Leadership & Growth Readiness::Investment Appetite', 'Leadership & Growth Readiness::Change Readiness', 'Leadership & Growth Readiness::Leadership Capability'
  ] }
};

function bandOf(score) { return score >= 70 ? 'Strong' : score >= 45 ? 'Moderate' : 'Low'; }

// d = engine.diagnostic() result: d.maturity.categories[].areas[] and d.potential.categories[].areas[], each { name, pct, score, max }.
function computeLevers(d) {
  const pctByKey = {};
  ['maturity', 'potential'].forEach(t => {
    const cats = (d && d[t] && d[t].categories) || [];
    cats.forEach(cat => (cat.areas || []).forEach(a => { pctByKey[cat.name + '::' + a.name] = (a.pct != null ? a.pct : 0); }));
  });
  const leverList = Object.keys(LEVERS).map(id => {
    const L = LEVERS[id];
    const vals = L.areas.map(k => pctByKey[k]).filter(v => v != null);
    const score = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 100) : null;
    return { id, name: L.name, pillar: L.pillar, flagged: !!L.flagged, coverage: vals.length, mapped: L.areas.length, score, band: score == null ? null : bandOf(score) };
  });
  const byId = {}; leverList.forEach(l => byId[l.id] = l);
  const pillars = PILLARS.map(p => {
    const ls = p.levers.map(id => byId[id]);
    const sc = ls.filter(l => l.score != null);
    const score = sc.length ? Math.round(sc.reduce((s, l) => s + l.score, 0) / sc.length) : null;
    return { id: p.id, name: p.name, score, band: score == null ? null : bandOf(score), levers: ls.map(l => ({ id: l.id, name: l.name, score: l.score, band: l.band, flagged: l.flagged })) };
  });
  const scored = leverList.filter(l => l.score != null);
  const overall = scored.length ? Math.round(scored.reduce((s, l) => s + l.score, 0) / scored.length) : null;
  const asc = scored.slice().sort((a, b) => a.score - b.score);
  const constraints = asc.slice(0, 3).map(l => ({ name: l.name, score: l.score, flagged: l.flagged }));
  const advantages = asc.slice().reverse().slice(0, 3).map(l => ({ name: l.name, score: l.score }));
  return {
    version: 'v1', overall, band: overall == null ? null : bandOf(overall),
    pillars, levers: leverList.map(l => ({ id: l.id, name: l.name, pillar: l.pillar, score: l.score, band: l.band, flagged: l.flagged })),
    constraints, advantages, anyFlagged: leverList.some(l => l.flagged)
  };
}

module.exports = { PILLARS, LEVERS, computeLevers, bandOf };
