# AI Findings — Quality Validation (3 industries)

Validation of the evidence-grounded AI Findings layer across three very different business models, all synthetic-but-realistic, all outside Vin's domain. Model used: **Haiku** (claude-haiku-4-5), ~2¢/run, for consistency. Findings only — no roadmap/budget/KPI/recommendation/report changes. Each business: 31 substantive discovery answers with embedded numbers (so the AI's arithmetic could be checked against known inputs), realistic scoring of both scorecards, then AI findings generated.

---

## Business 1 — Healthcare / Clinic
**Profile:** MoveWell Physiotherapy — 3 outpatient physio clinics, Greater Manchester UK, ~£1.8M revenue, 24 staff (8 physios + 2 reception), clinician-founder. ~900 enquiries/mo, 55% convert to first appt, 30% drop mid-course, £420/course, NHS+private+insurance. Constrained by enquiry/booking leaks, retention, founder/reception bottleneck. **Maturity 45/F · Potential 86 · 7 findings.**

**Strengths:** Quotes the founder's exact words ("reception is overwhelmed at peak, calls go to voicemail"); ties everything to Cliniko (their actual system) with specific config steps; names the real competitor (ActiveRehab); zero-cost, week-1 actions; prioritised Sales/Funnel/Tech correctly.

**Weaknesses / credibility concerns:**
- **Math error:** Finding 1 states `900 × (1−0.55) × 0.30 × £420 ≈ £23,800/mo`. The actual product is **£51,030**, and the logic is wrong (it applies the 30% *course-dropoff* rate to the *non-bookers*).
- **Internal inconsistency:** same finding says "roughly **405** patients book" in the observation but "**495** who do book" in the impact (495 is correct: 900×0.55).
- **Double-count:** Findings 1 and 2 both bill the same ~149 abandoned courses (~£62k/mo).

**Hallucination risks (material):** "industry benchmarks suggest insurer/sports-club patients are 20–30% higher LTV" (invented benchmark); named insurers "Bupa, AXA, Cigna" and "Manchester triathlon club… CrossFit boxes" (fabricated specifics); "new clinic generating £200k–250k (typical for a 2–3 physio satellite)" (invented benchmark); a Google-Ads "£10 CAC, 22:1 ROAS" projection on invented inputs; Finding 7 invents NHS revenue share + margins (5%/40%) to compute an £90k–180k uplift.

**Overall quality: 7/10.**

---

## Business 2 — Retail / Distribution
**Profile:** Northgate Industrial Supplies — B2B wholesaler (fasteners/tools/PPE), Texas, ~$9M revenue, 35 staff. ~1,200 accounts (top 20% = 70% rev), AOV $850, ~40 quotes/day ~50% win, 22% gross margin under pressure, DSO 52 days, no e-commerce/CRM, Epicor Prophet 21. **Maturity 50/E · Potential 60 · 7 findings.**

**Strengths:** Strongest accuracy of the three; correctly uses Epicor, DSO, punchout, account tiering; the working-capital finding (52/365×$9M = ~$1.28M receivables) is **correct** and genuinely insightful; margin-leak math ($9M × 2pts = $180k) is sound; named the real threats (Amazon Business, Fastenal). Deeply specific and actionable.

**Weaknesses / credibility concerns:**
- **Fabricated base figure:** uses "$7,500 average annual value" across 1,200 accounts to size churn — the client never gave this (they gave AOV $850 and "steady accounts $25–40k"). Hedged "conservative," but it's invented and drives a $450k–900k number.
- **Double-count:** Findings 2 (Account Attrition) and 5 (Customer Retention) run the **same** churn calculation twice.
- **Redundancy:** 7 findings, but ~4 distinct themes (CRM/process, discounting/margin, lapsed accounts, e-commerce) — several overlap.

**Hallucination risks:** the $7,500 average; oddly specific vendor names ("Eka Solutions, Elastic Path"); inventory "say 60 days of COGS" and "cost of capital 10–12%" assumptions (reasonable but fabricated).

**Overall quality: 7.5/10.**

---

## Business 3 — Manufacturing
**Profile:** Precision Form Metalworks — contract CNC machining + sheet-metal fab for industrial OEMs, Ohio, ~$6.5M revenue, 42 staff, engineer-founder. 60–80 RFQs/mo ~30% win, 15 active customers (top 3 = 55%), 5–7 day quote turnaround, 18% net margin, 82% on-time, JobBOSS. Constrained by founder-as-sole-estimator, concentration, no sales function. **Maturity 50/E · Potential 63 · 8 findings.**

**Strengths:** Nails the three stated pains (quoting bottleneck, concentration, no BD); uses JobBOSS, RFQ-platform strategy, apprenticeship/vo-tech hiring; concentration risk quantified correctly ($3.6M = 55% of $6.5M; one customer = $1.2M). Reads like a manufacturing consultant wrote it.

**Weaknesses / credibility concerns (weakest accuracy of the three):**
- **Fabricated base figure:** "$50k average lost quote" — invented (client said OEM orders are $300k–1M; custom smaller). Drives an inflated "$2.45M/yr forgone."
- **Broken/nonsensical figure:** Finding 5 — "you have captured perhaps **USD 100–200 of the potential market**" (units missing / meaningless).
- **Muddled logic:** "70 potential customer relationships vs 15 active" / "85% of customer base underdeveloped" — the 70 is unexplained.

**Hallucination risks (material):** invents TAM/market size ("500–1,000 decision-makers," "3% penetration"); RFQ-platform names ("Tradekey, Thomas Industrial"); role costs "$75k–95k/year." Multiple fabricated quantitative inputs.

**Overall quality: 6.5/10.**

---

## The 8 evaluation questions

1. **Grounded in actual discovery answers?** ✅ **Yes, consistently and strongly** — direct quotes, the client's own numbers, their actual systems and competitors. This is the layer's biggest win across all three.
2. **Calculations mathematically correct?** ⚠️ **Mostly, but not reliably.** Distribution's were largely sound; Healthcare had a clear arithmetic error (£23,800 vs £51,030) + a 405/495 inconsistency; Manufacturing had a broken figure ("$100–200 of the market"). Roughly **1 material math error per business.**
3. **Does it invent market sizes / stats / benchmarks / TAM / financial assumptions?** 🔴 **Yes — in all three, repeatedly.** This is the #1 problem: industry benchmarks, TAM/penetration, average account/quote values, CACs, margins, financing rates, and named third parties (insurers, clubs, platforms, vendors) the client never provided — embedded inside authoritative-looking dollar figures, hedged only with "assume/typical/conservative."
4. **Does it misinterpret founder responses?** ✅ **Rarely on the qualitative reading** (root causes and narrative are faithful). Misinterpretation appears in the *quantification* (e.g., applying the course-dropoff rate to non-bookers; treating a lost RFQ as $50k/yr recurring).
5. **Identifies genuine root causes?** ✅ **Yes** — no CRM/process/follow-up, founder bottleneck, customer concentration, no measurement. Real, not superficial.
6. **Would a founder feel understood?** ✅ **Strongly yes** — arguably the standout. It speaks their language, cites their numbers, names their tools and rivals.
7. **Would an experienced consultant be comfortable presenting these?** ⚠️ **Qualitatively yes; quantitatively NOT without correction.** A founder or CFO who checks the arithmetic would catch the errors and invented numbers and lose trust. Presentable only *after* analyst review (which the workflow already mandates before publish).
8. **Unique to the business or generic?** ✅ **Highly unique per business** — each reads bespoke to its industry. No template smell.

---

## Comparison table (1–10; Hallucination Risk: lower is better)

| Area               | Healthcare | Distribution | Manufacturing |
| ------------------ | ---------- | ------------ | ------------- |
| Accuracy           | 6          | 7            | 5             |
| Specificity        | 9          | 9            | 9             |
| Actionability      | 9          | 9            | 9             |
| Commercial Value   | 7          | 8            | 7             |
| Hallucination Risk | High (7/10)| Med-High (5/10) | High (7/10) |
| Founder Relevance  | 9          | 9            | 9             |
| **Overall Score**  | **7.0**    | **7.5**      | **6.5**       |

---

## Common strengths (all three)
- **Genuinely evidence-grounded** — quotes the founder's own words and numbers; never the scorecard-label restatement of the old findings.
- **Highly specific** — names the client's actual tools (Cliniko/Epicor/JobBOSS), competitors, and concrete first steps.
- **Strongly actionable** — week-1, often zero-cost actions a founder could start Monday.
- **Correct root-cause diagnosis** and correct prioritisation by business weight (Sales/Funnel surface first).
- **Bespoke per industry** — a founder would feel the report was written for *their* business. The "worth paying for" emotional bar is cleared on relevance.

## Common weaknesses (all three)
1. **Invents quantitative inputs** (benchmarks, TAM, average values, CACs, margins, costs, named third parties) to power impact figures — consistent and material.
2. **~1 math error or internal inconsistency per business** (wrong product; 405-vs-495; "$100–200 of the market").
3. **Double-counting & redundancy** — the same leak quantified in two findings; 7–8 findings but ~4–5 distinct themes (padded to a count).
4. **Authoritative tone on shaky numbers** — hedges ("assume/typical") are easy to miss inside confident dollar claims.

## Required improvements before production
1. **Prohibit any number not in the evidence.** Harden the prompt: no benchmarks, industry stats, TAM, market sizing, CACs, margins, financing rates, or named third parties unless the client provided them. If a calculation needs a missing input, output `[assumption — analyst to confirm: …]` instead of inventing a figure (or omit the dollar amount).
2. **Show the arithmetic.** Require every quantified impact to display the formula (e.g., `495 first appts × 30% drop × £420 = £62,370/mo`) so errors are visible and verifiable — and instruct the model to self-check the multiplication.
3. **One finding per distinct root cause; count each leak once.** Eliminates double-counting and padding (target 5–6 tight findings, not 7–8 overlapping).
4. **Evaluate Opus for production.** Haiku produced the arithmetic slips; test whether Opus computes more reliably for the same prompt, and weigh the cost difference.
5. **Keep the mandatory analyst-review gate** (already in the workflow) and add a reviewer checklist: verify every number, strip invented benchmarks, merge duplicates. This is the safety net that makes the layer usable *today*.

## Recommendation: **Needs refinement** (do not yet auto-trust for production)
- The **qualitative layer is consultant-grade** — grounding, specificity, actionability, and founder-relevance are all 9/10 and consistent across wildly different industries. That validates the core approach decisively.
- The **quantitative layer is not yet trustworthy** without analyst correction: invented assumptions + ~1 math error per report. A numbers-literate founder would catch them.
- **Safe to use now** *because* findings are analyst-reviewed before publish (human catches the errors). **Not safe to auto-publish.**
- The fixes are **prompt-level only (no architecture change)** — Improvements 1–3 should lift accuracy and hallucination risk to consultant-grade. **Re-validate across the same three businesses after the prompt hardening before promoting findings to the source layer for recommendations/roadmap/budget/KPIs.**
