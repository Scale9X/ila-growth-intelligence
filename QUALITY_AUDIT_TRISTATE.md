# Report Quality Audit — "Tri-State Comfort Heating & Cooling" (synthetic real-world test)

A blind test business outside Vin's domain: a 22-person residential/light-commercial HVAC company in Columbus OH, ~$3.2M revenue, founder-led, strong on technical quality + reputation, weak on marketing/CRM/funnel/data. The founder gave rich, specific answers (180–220 leads/mo, ~25% install close rate, $8–12k LTV, 45–50% install margin, $3.2M→$6M goal, Apex Air as the PE-backed threat, no CRM, quotes "in my head," office maxed). Diagnostic came out **Maturity 50/E, Potential 86, "Best Client (Huge Opportunity)."** Report published deterministically (no AI rewrite — see note).

## Verdict: **A founder would NOT pay for this report as-is.**
The diagnostic *scores* and the *quadrant* are credible and would land. But the five sections that carry the commercial value — **findings, recommendations, roadmap, budget, KPIs** — read as automated restatements of the scorecard. They contain **none** of the specifics the founder handed over, name area-labels instead of actions, and in places contradict what the client said. The founder's dominant reaction would be **"you didn't listen to me"** — fatal for a $5k sale.

Crucially: this business *gave us gold* (real numbers, a named competitor, a precise leak point) and **almost none of it appears** in the output. That's the core failure.

---

## Section-by-section (brutal)

### 1. Executive Summary — **C− (and one credibility bug)**
> "Its relative strengths are Team & Operations, Market Position, **Marketing Effectiveness**."
- 🟥 **Credibility bug:** Marketing is listed as a **strength** (computed 67%), yet the founder said marketing is their *weakness* ("we don't measure anything," "Facebook is a waste," "Apex out-markets us"). The deterministic strengths list is computed purely from rounded scorecard % with **no sanity-check against the client's own words** — so it can assert the opposite of reality. A founder spots this in 5 seconds and distrusts everything after it.
- "15 priority gaps were identified… will continue to cap conversion and scalability" — generic, could be any company.
- Prescription = three bare labels ("Improve Lead Management / CRM Discipline / Conversion Rates"). No "how."
- *Note:* with **Rewrite with AI** this section becomes genuinely bespoke (proven on ILAtech). The bug above is in the deterministic fallback that ships if AI isn't run.

### 2. Business Reality — **C**
> "…where the business is measured and systematic it performs; where it is manual or ad-hoc it leaks."
- True but **boilerplate** — applies to literally any company. No HVAC specifics, no founder dependence, no Apex threat, no numbers. (AI rewrite fixes this; deterministic version is filler.)

### 3. KEY FINDINGS — **F (the worst offender)**
> "Funnel Visibility scored 0/2 — below half of its maximum." · "Lead Qualification scored 0/2 — below half of its maximum." · *(business_impact, verbatim 6×:)* "Limits funnel performance and constrains overall growth."
- 🟥 **These are not findings — they're the scorecard read back.** Six items, each = an area name + "scored X/2 — below half" + the *identical* impact sentence with one word swapped. Zero insight.
- 🟥 **Relevance failure:** the founder described, in plain English, *no CRM, quotes in his head, leads going cold between quote and close, a maxed-out office, 25% install close rate.* **None of it appears.** Instead they get "Funnel Optimization" and "Nurturing Process."
- 🟥 **Logic bug — wrong things surfaced:** findings pick the 6 *lowest-scoring areas*, which were all in one category (Funnel, all 0/2). Result: **5 of 6 findings are Funnel sub-areas; Sales Excellence — weight 15, the founder's #1 stated pain — gets no finding at all.** The selection ignores category weight and over-indexes one bucket.
- A founder paying real money expects: *"You have ~200 leads/month but no system to track or follow up on them; your 25% install close rate and the quotes 'going quiet' are the same problem — there's no CRM and no defined follow-up, so whoever calls back first wins the job. At $8–12k per customer, even 10 recovered quotes a year is ~$100k."* That's a finding. What shipped is a label.

### 4. STRATEGIC RECOMMENDATIONS — **D−**
> "Improve Lead Management — high impact, medium effort." (×5, every one identical shape, every one "medium effort")
- 🟥 Every recommendation is **"Improve [area] — high impact, medium effort."** No *how*, no tool, no sequence, no expected result, no cost. "Improve CRM Discipline" is not something a founder can do Monday morning.
- Uniform "medium effort" on all five is obviously templated.

### 5. OPPORTUNITY MATRIX — **D**
- 15 entries, **all titled "Improve [area]"**, all effort "medium," impact bucketed crudely by category weight. "Improve Reporting / Automation / Data Accuracy" — indistinguishable filler.
- 🟧 **Transformation quadrant empty** → and the roadmap silently drops Q4 because of it (below).

### 6. 90-DAY PLAN — **D**
> "1–2: Improve Lead Management, Improve CRM Discipline" … "11–12: Improve Tech Stack, Improve System Integration"
- 🟥 It's the opportunity labels **dealt two-per-fortnight**. No actions, owners, milestones, metrics, or rationale. A 90-day plan that says "Weeks 1–2: Improve Lead Management" is not a plan — it's a sorted list. Expected: "Weeks 1–2: select & implement a field-service CRM (ServiceTitan/Housecall Pro), migrate the quote pipeline off spreadsheets, define the 5 sales stages."

### 7. 12-MONTH ROADMAP — **C− (and incomplete)**
- The quarter *themes* are actually decent ("Stop the leaks → Build the engine → Scale → Institutionalise"). But:
- 🟥 **Q4 is missing entirely** (only Q1–Q3 rendered) because the Transformation quadrant was empty and the builder filters empty quarters. A founder sees a "12-month roadmap" with 9 months on it and assumes it's unfinished.
- Initiatives are again "Improve [area]" labels, not initiatives.

### 8. BUDGET ALLOCATION — **D (and arguably wrong for this client)**
> Performance Marketing 18%, Demand Generation 14%, Content & SEO 11%, CRM & Retention 20%, Sales Enablement 14%, Technology & Data 14%, Testing 9%
- 🟥 **No dollars, no basis, no rationale.** Budget of *what*? % of revenue? Of a marketing budget? The founder explicitly said cash is their constraint and they won't spend on marketing they can't measure — yet **~43% is allocated to top-of-funnel paid acquisition** (Perf Marketing + Demand Gen + Content) when the *diagnosis itself* says the leak is **mid-funnel** (no CRM, no follow-up). The budget contradicts the diagnosis.
- It's a fixed base table with small per-weakness bumps — not derived from this client's reality, and not defensible line-by-line ("why 11% on SEO?" → no answer).

### 9. KPI FRAMEWORK — **D− (identical for every client)**
- A **static list** of ~20 generic metrics (NPS, Cash runway, Automation rate, ROAS…). **Zero tailoring**, no targets, no baselines, no "track these 3 first."
- For a company that admits it **tracks nothing today**, handing over 20 unprioritized KPIs is not actionable. The valuable version: "Start with 3 — cost per lead, quote→close %, and maintenance-plan attach rate — because you have no funnel visibility today. Here's a realistic 90-day target for each."

### Scores / Magic Matrix / Strengths-Weaknesses — **B (the credible core)**
- The numbers (50/E, 86, quadrant) and the per-category breakdown are believable and would land. The *strengths* list inherits the Marketing bug (#1). Weaknesses (Funnel, Tech, Sales) are right.

---

## Cross-cutting failures (why it doesn't feel "worth paying for")

1. **The discovery goldmine is thrown away.** The single biggest issue. The founder gave specific numbers and a vivid situation; findings/recs/roadmap/budget/KPI reference **none** of it. Everything downstream of scoring is generated from *area names and scores only*, never from the answers. This is what makes it feel like a form-filler, not a consultant.
2. **Labels masquerading as insight.** "Improve [Area]" appears ~30 times across the report. It's the scorecard taxonomy reflected back, not advice.
3. **No numbers, no money, no "how."** A $5k diagnostic must quantify the cost of the leak and the upside of the fix (the data is *right there*: leads × close rate × LTV). The report never multiplies anything.
4. **Internal contradictions slip through** (marketing = strength; budget over-weights acquisition while the diagnosis says the leak is follow-up). Nothing cross-checks the report against itself or the client's words.
5. **Selection logic ignores weight/severity** — findings clustered in one category and missed the highest-weight pain (Sales). A founder notices when their #1 problem isn't mentioned.
6. **Two completion bugs** that read as "unfinished": missing Q4 roadmap; uniform "medium effort" everywhere.

## What's actually good (keep)
- The **scores, grades, Magic Matrix verdict** are credible and well-presented.
- The **AI-rewritten narrative** (exec summary, business reality, diagnostic narrative, recommendations) is genuinely strong when run — ILAtech proved it cites real numbers and the client's words. **But AI rewrite does not touch the 5 focus sections**, which is exactly why they remain templated. That contrast (brilliant intro, template body) arguably makes the whole feel *worse*.

---

## Recommended fixes (low-risk, no architecture change), priority order

1. **Findings → evidence-grounded & weight-aware (biggest lever).** Generate findings from the *discovery answers + scores together* (hybrid AI, analyst-reviewed — same model as scoring/narrative), one per top weakness *by weight×severity* (so Sales/CRM surface, not 5 funnel sub-areas). Each finding: what the data shows + the client's own words + quantified impact (leads×close×LTV) + a concrete action. Kills the #1 failure.
2. **Recommendations & opportunities → specific & costed.** Replace "Improve [area]" with concrete moves ("Implement a field-service CRM and a 5-stage pipeline"), differentiated effort, and an expected outcome. Drive impact ranking by category weight, not a flat bucket.
3. **90-day plan & roadmap → real plans.** Each item = action + owner + metric/milestone; always render all 4 quarters (fix the empty-Transformation drop).
4. **Budget → tied to the diagnosis + dollars.** Allocate against the *actual* weak areas (here: weight mid-funnel/CRM over paid acquisition), express as a range and as % of a stated basis, with a one-line rationale per line.
5. **KPIs → tailored + prioritized + targeted.** Pick the 3–5 that matter for *this* client's gaps, with baselines/targets, not a 20-item static list.
6. **Two guard fixes:** (a) sanity-check strengths/weaknesses & exec-summary against low-scored categories so the report can't call a weakness a strength; (b) always emit 4 quarters.

**Bottom line:** the engine is correct and the narrative ceiling is high, but the commercial body of the report is templated and ignores the richest input the client gave. The fastest path to "worth paying for" is to make findings/recs/roadmap/budget/KPI *evidence-grounded and quantified*, the same hybrid way scoring and the narrative already work — no new infrastructure required.
