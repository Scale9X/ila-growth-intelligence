/* 1XL Client Portal — content model. Conversational Business Discovery Interview,
   business profile, document vault, and the Smart Discovery extraction map.
   The 10 sections + prompts map behind the scenes to the 117-point coverage model. */

const INTERVIEWER = { name: "Maya", role: "ILAtech Discovery Lead", initial: "M" };

/* Business Profile — guided, conversational (not a long form) */
const PROFILE_FIELDS = [
  { id:"company", label:"Company name", type:"text", req:true },
  { id:"industry", label:"Industry", type:"text", req:true, ph:"e.g. B2B SaaS, Real Estate, Wellness" },
  { id:"website", label:"Website", type:"text", ph:"https://" },
  { id:"revenue", label:"Revenue range", type:"select", req:true, opts:["< $100k","$100k–500k","$500k–1M","$1–5M","$5–20M","$20M+"] },
  { id:"team", label:"Team size", type:"select", req:true, opts:["1–10","11–50","51–200","200+"] },
  { id:"markets", label:"Markets served", type:"text", ph:"e.g. Indonesia, SEA" },
  { id:"offerings", label:"Key products / services", type:"text", ph:"What you sell" }
];

/* The 10 interview chapters */
const SECTIONS = [
  { key:"business",    title:"The Big Picture",      sub:"Business" },
  { key:"market",      title:"Your Market",          sub:"Market" },
  { key:"customer",    title:"Your Customers",       sub:"Customer" },
  { key:"competition", title:"The Competition",      sub:"Competition" },
  { key:"sales",       title:"How You Sell",         sub:"Sales" },
  { key:"marketing",   title:"How You're Found",     sub:"Marketing" },
  { key:"funnel",      title:"Your Funnel",          sub:"Funnel" },
  { key:"technology",  title:"Tools & Data",         sub:"Technology" },
  { key:"team",        title:"Your Team",            sub:"Team" },
  { key:"financial",   title:"The Numbers",          sub:"Financial" }
];

/* Conversational prompts — interviewer voice. Each maps to the coverage model behind the scenes. */
const PROMPTS = [
  // Business
  {sec:"business", id:"biz_what", q:"To start, tell me about your business in your own words — what do you do, and who do you do it for?", ph:"Take your time — the more context, the better the diagnosis.", why:"It anchors everything that follows and tells us how you see the business.", big:true},
  {sec:"business", id:"biz_revenue", q:"What part of the business actually drives most of your revenue today?", ph:"Your real engine vs. the side activities.", why:"Reveals revenue concentration and dependency."},
  {sec:"business", id:"biz_goal", q:"Where do you want this business to be 12 months from now?", ph:"Your ambition — revenue, scale, or a specific milestone.", why:"Calibrates the plan to your actual goals."},
  {sec:"business", id:"biz_blocker", q:"And honestly — what's the one thing most getting in the way of growth right now?", ph:"The blocker you feel most.", why:"Points us at the highest-priority area to examine.", big:true},
  // Market
  {sec:"market", id:"mkt_describe", q:"How would you describe the market you operate in — and where is it heading?", ph:"Size, trends, momentum.", why:"Market opportunity shapes your growth ceiling.", big:true},
  {sec:"market", id:"mkt_comp", q:"Who do you see as your main competitors?", ph:"Name a few.", why:"Defines your comparison set."},
  {sec:"market", id:"mkt_worry", q:"Which competitor, if any, keeps you up at night — and why?", ph:"The one that worries you most.", why:"Surfaces the real strategic threat."},
  {sec:"market", id:"mkt_demand", q:"On a scale of 1 to 10, how strong is demand in your market right now?", type:"scale", why:"Your read on demand strength."},
  // Customer
  {sec:"customer", id:"cust_icp", q:"Paint me a picture of your ideal customer.", ph:"Who are they, and what makes them a great fit?", why:"A sharp ICP is the foundation of efficient growth.", big:true},
  {sec:"customer", id:"cust_why", q:"Why do your best customers really choose you?", ph:"The real reason — beyond the obvious.", why:"Identifies your genuine differentiation."},
  {sec:"customer", id:"cust_reject", q:"And why do some prospects walk away?", ph:"The objections you hear most.", why:"Shows where you lose deals."},
  {sec:"customer", id:"cust_value", q:"Roughly, what's a customer worth to you over their lifetime?", ph:"A number or range is fine.", why:"Anchors your unit economics."},
  // Competition
  {sec:"competition", id:"comp_better", q:"What do you genuinely do better than your competitors?", ph:"Your real edge.", why:"Sharpens your positioning."},
  {sec:"competition", id:"comp_ahead", q:"And where are they ahead of you today?", ph:"Be candid — this is where the upside is.", why:"Identifies capability gaps to close."},
  {sec:"competition", id:"comp_channels", q:"How are they winning customers — what channels are they using?", ph:"How competitors acquire.", why:"Reveals channel gaps and opportunities."},
  // Sales
  {sec:"sales", id:"sales_journey", q:"Walk me through how a lead becomes a customer in your business today.", ph:"From first contact to closed deal.", why:"Maps your real sales motion and where it leaks.", big:true},
  {sec:"sales", id:"sales_numbers", q:"Roughly how many leads do you get a month, and how many turn into customers?", ph:"Even ballpark numbers help.", why:"Establishes volume and conversion."},
  {sec:"sales", id:"sales_process", q:"Do you have a documented sales process and a CRM — or is it more informal?", ph:"Be honest — most businesses are more informal than they'd like.", why:"Tests repeatability and visibility."},
  {sec:"sales", id:"sales_scale", q:"If leads doubled tomorrow, could your team handle them?", ph:"Yes, no — and why.", why:"Assesses scale-readiness."},
  // Marketing
  {sec:"marketing", id:"mktg_channels", q:"Which marketing channels are you running right now?", ph:"Everything currently active.", why:"Maps your channel mix."},
  {sec:"marketing", id:"mktg_roi", q:"Which one do you believe actually drives revenue — and which feels like waste?", ph:"Your gut on what works.", why:"Finds winners and leakage."},
  {sec:"marketing", id:"mktg_measure", q:"How do you currently judge whether marketing is working?", ph:"What you look at to call it a success.", why:"Tests measurement maturity."},
  // Funnel
  {sec:"funnel", id:"fun_leak", q:"Where in your funnel do you lose the most people?", ph:"The stage where prospects drop off.", why:"Pinpoints the biggest leak.", big:true},
  {sec:"funnel", id:"fun_nurture", q:"How do you follow up and nurture leads today — automated, manual, or not really?", ph:"Your follow-up reality.", why:"Assesses nurturing and follow-up discipline."},
  // Technology
  {sec:"technology", id:"tech_stack", q:"What tools and systems run your business day to day?", ph:"CRM, analytics, spreadsheets — whatever you use.", why:"Inventories your operating stack."},
  {sec:"technology", id:"tech_data", q:"How confident are you that your numbers and data are accurate?", ph:"Very, somewhat, or not really.", why:"Tests data trustworthiness."},
  // Team
  {sec:"team", id:"team_strength", q:"Which parts of your team are strongest — and which are stretched thin?", ph:"Where you're strong vs. where there are gaps.", why:"Identifies capability and capacity gaps.", big:true},
  {sec:"team", id:"team_break", q:"If the business doubled, where would the team break first?", ph:"The first thing that would buckle.", why:"Assesses scale readiness."},
  // Financial
  {sec:"financial", id:"fin_trend", q:"How has revenue trended over the last year, and what's the target ahead?", ph:"Direction and the goal.", why:"Establishes baseline and ambition."},
  {sec:"financial", id:"fin_margin", q:"What's your gross margin like, and do you track customer acquisition cost?", ph:"Even rough figures are useful.", why:"Assesses economics and visibility."},
  {sec:"financial", id:"fin_constraint", q:"Finally — what financial constraint, if any, limits how fast you can grow?", ph:"What's holding back investment.", why:"Identifies the biggest financial blocker.", big:true}
];

/* warm acknowledgments rotated between answers (feels interviewed, not surveyed) */
const ACKS = ["Thank you — that's really helpful.","Got it.","That makes sense.","Great — noted.","Understood.","Helpful context, thank you.","Perfect.","That's useful to know."];

/* Smart Discovery — which prompts feed each extracted card */
const SMART_MAP = [
  { key:"icp",        title:"Your Ideal Customer",   from:["cust_icp","cust_why"] },
  { key:"challenges", title:"Top Challenges",        from:["biz_blocker","fun_leak","team_break"] },
  { key:"objectives", title:"Growth Objectives",     from:["biz_goal","fin_trend"] },
  { key:"opps",       title:"Opportunities We See",  from:["mkt_describe","comp_ahead","mktg_roi"] }
];

/* Document Vault — categories + recommended evidence */
const DOC_CATS = [
  { key:"sales",      title:"Sales",      recs:["CRM export / pipeline","Sales report or MIS"] },
  { key:"marketing",  title:"Marketing",  recs:["Campaign / channel report","Ad account or media report"] },
  { key:"financial",  title:"Financial",  recs:["P&L summary","Revenue report"] },
  { key:"business",   title:"Business",   recs:["Company / investor deck","Strategy document"] },
  { key:"operations", title:"Operations", recs:["Org chart","Key SOPs"] }
];
