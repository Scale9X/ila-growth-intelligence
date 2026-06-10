# AI Findings — Quality Validation Round 2 (post prompt-hardening)

Same three businesses, same Haiku model, prompt-only change (no architecture/workflow/DB/UI/scoring/report changes). Goal: numerically defensible findings.

## What the hardening enforced
1. Use only numbers present in the evidence (discovery answers + scorecard).
2. Flag missing inputs explicitly; never invent a figure.
3. Show the arithmetic + source inputs for every quantified statement.
4. One root cause = one finding; no duplicate leakage.
5. Cap at 5–6 findings, prioritised by impact × weight.

---

## Before vs After (per business)

| Metric | Healthcare B→A | Distribution B→A | Manufacturing B→A |
|---|---|---|---|
| Findings volume | 7 → **6** | 7 → **6** | 8 → **6** |
| Arithmetic shown inline | rarely → **yes, throughout** | rarely → **yes** | rarely → **yes** |
| Math errors / report | 1 (£23,800 vs £51,030) + 405/495 → **0 major** (2 minor derived-figure slips) | minor → **0 major** (1 units slip) | broken "$100–200" + inflated → **0 major** |
| Invented benchmarks/TAM/named third parties | many → **mostly gone** | several → **gone** | many (TAM, $50k, market size) → **gone** |
| Assumptions flagged for analyst | never → **yes** ("not provided — analyst to confirm") | never → **yes (exemplary)** | never → **yes** |
| Accuracy (1–10) | 6 → **8** | 7 → **8.5** | 5 → **8** |
| Hallucination Risk | High → **Low–Med** | Med-High → **Low** | High → **Low–Med** |
| Overall (1–10) | 7.0 → **8.3** | 7.5 → **8.7** | 6.5 → **8.0** |

---

## Hallucination-reduction assessment — **major reduction**

**Eliminated (the worst offenders, all gone):**
- Manufacturing's invented **TAM / market size** ("500–1,000 decision-makers, 3% penetration") and the broken "captured ~$100–200 of the potential market" — **gone**; the market-reach finding is now qualitative.
- The flat invented **"$50k average lost quote"** — replaced with `USD 300k/yr ÷ 12 = USD 25k/order` (derived from a client-stated figure, arithmetic shown).
- Healthcare's hard **"industry benchmarks suggest 20–30% higher LTV"** and named third parties (**Bupa, AXA, CrossFit boxes**) — **gone**; now "list local sports clubs / insurers in Greater Manchester" (generic).
- Distribution's named connector vendors (**Eka Solutions, Elastic Path**) — **gone**.

**The headline new behavior — it now flags missing inputs instead of inventing them.** Distribution Finding 6 is the model case:
> "On 35 people with **assumed average cost ~USD 50k (not provided by client — analyst to confirm)**, payroll is ~USD 1.75M (**assumption, not client-stated**)… DSO ties up ~USD 1.28M (USD 9M ÷ 365 × 52 — **client-provided figures**)."

It separates *client-provided* arithmetic from *flagged assumptions*. Distribution Finding 1 even **declines to quantify**: "The margin leakage from uncontrolled rep discounting is **not quantified**" — exactly the desired discipline.

**Quantification is now transparent.** Healthcare Finding 1 went from a wrong £23,800 to:
> "900 × 0.55 × 0.30 ≈ 149 incomplete courses/mo × £420 ≈ **£62,580/mo** (course-incompletion alone)" — correct, sourced, and it no longer slaps a fabricated number on the first-appointment loss.

**Residual hallucination (reduced, not zero):**
- **Assumed improvement-target rates still appear**, framed as "if/e.g." but not client-grounded: Healthcare F2 calls "75% first-appointment / 85% course completion" *"industry-standard"* and builds a £1.15M/24-mo upside on it; Manufacturing F1/F5 assume "+5 / +10 percentage-point" win-rate lifts. These are hedged but still invented inputs.
- **2 minor derived-figure slips:** Healthcare F4 uses "~£360k/site" (should be ~£600k = £1.8M ÷ 3 current sites); Distribution F4 conflates "top 20%" (~240 accounts) with "top 20 accounts" when deriving ~$315k each.

---

## Quantitative-accuracy assessment — **markedly improved**

- **Core impact numbers are now defensible**: each is built from a client-stated figure with the formula shown, so a CFO can trace it. The egregious fabrications and the one clear arithmetic error are gone.
- **Remaining gaps are minor and hedged**: assumed improvement rates (should be flagged like other assumptions, or the upside expressed qualitatively) and two small derived-figure slips. A numbers-literate reviewer would catch these in seconds.
- From **"≈1 material error + multiple fabrications per report" → "0 major errors + occasional hedged assumed-rate + ≤2 minor derived slips."**

## Dedup / volume — **improved, not perfect**
- All three are now **6 findings** (was 7/7/8), and the identical repeated churn calculation (old Distribution F2≈F5) is gone.
- But findings still **cluster in the sales/process theme** (e.g., Manufacturing F1 "slow quoting," F5 "no follow-up," F6 "no process," F2 "concentration" are four facets of "no sales engine"), and Manufacturing F1 & F5 both monetise a win-rate lift — a soft overlap. "One root cause = one finding" is ~80% honored.

---

## Production-readiness recommendation: **Conditionally ready — ship inside the analyst-review workflow now; one micro-tighten recommended before unsupervised/auto-publish.**

- **Ready to use today** in the current workflow (findings are analyst-reviewed before publish). The defensibility bar for the *core* numbers is met, and the analyst easily catches the residual hedged assumptions/slips. This is a clear, large step up from Round 1 and from the old templated findings.
- **Before any unsupervised use,** one final prompt micro-tighten would close the remaining gaps (no code/architecture impact):
  1. Treat **assumed improvement-target rates** (e.g., "industry-standard 85%") the same as any other missing number — flag them (`[target assumption — analyst to set]`) or express upside qualitatively; never assert "industry-standard."
  2. Add a self-check rule for **derived figures** (e.g., per-site/per-account = current total ÷ *current* count, never future count).
  3. Strengthen **distinct-root-cause** separation so sales-process facets consolidate or clearly differentiate, and no two findings monetise the same lever.
- **Suggested gate before promoting findings to the source layer for recommendations/roadmap/budget/KPIs:** apply the micro-tighten, re-run these same three, and confirm zero invented numbers + zero unflagged assumptions. Until then, the analyst-review step is the safeguard.

**Bottom line:** the findings engine is now consultant-grade *and* substantially numerically defensible. The fabrication problem is largely solved; what remains is a thin layer of hedged assumed-targets and minor derived-figure hygiene — a small refinement, not a rebuild.
