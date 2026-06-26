# Scale9X — Product Experience Review
*Reviewed from the perspective of a CEO / founder / investor experiencing Scale9X for the first time. No changes have been made — this is for us to review together before implementing.*

Scope reviewed: marketing homepage, client portal (login → dashboard → profile → interview → smart discovery → team → documents → review → report center → report viewer → notifications), analyst portal (login → queue → engagement → scoring → results → findings → report builder → history → admin), and the shared design system.

---

## 0. Critical, cross-cutting issues (fix before any demo)

| # | Issue | Why it matters | Recommendation | Priority |
|---|---|---|---|---|
| 0.1 | **Old brand still visible in-app.** "ILAtech / iL" persists in the client sidebar (every screen), client login, client auth box, **report cover**, the analyst sidebar (every screen) and analyst auth box. | The rebrand looks done on the homepage but the actual product still says ILAtech on the navigation the CEO stares at the whole session — and on the flagship report cover. Immediate credibility hit. | Replace all remaining `iL` / `ILA<span>tech</span>` marks with the `S9` / Scale9X treatment + `--grad-brand`. | **High** |
| 0.2 | **Emoji throughout the UI and the report.** Dashboards ("Hello 👋"), every report section header (🎯🔬⚠️🚀📊💡…), KPI icons, nav bell, "underway 🎯". | Brand rules forbid emoji in professional UI. On a board-grade deliverable, emoji read as consumer SaaS, not McKinsey/BCG. | Remove emoji from the report entirely; replace with restrained iconography or nothing. Strip from app chrome (greetings, banners). | **High** |
| 0.3 | **Native `alert()` / `confirm()` dialogs** for errors, validation and the publish confirmation. | Browser-default popups are the single most "cheap software" tell. Jarring against an otherwise premium UI. | Replace with branded toast + a branded confirm dialog (you already have a clean custom modal pattern in `aiPick()` — extend it). | **High** |
| 0.4 | **Random "insight" tips injected into the report** (`insightHTML()` mid-document) and across app screens. | A rotating "💡 did you know" stat inside a $5k board report undercuts authority. | Remove from the report; make it optional/subtle in-app only. | **High** |

---

## 1. Executive-first

| Screen | Finding | Recommendation | Priority |
|---|---|---|---|
| Client dashboard | "Hello {company} 👋" + emoji + casual microcopy reads consumer-onboarding, not executive. | Calmer salutation, drop emoji, lead with status and the single next decision. | High |
| Discovery interview | Framed as a friendly chat with "Maya" (avatar bubbles, acknowledgements). Can feel like a chatbot. | Keep the low-cognitive-load one-question flow, but reframe visually as a structured **executive briefing** (less "chat app", more "guided intake"). Soften the persona, keep professionalism. | Medium |
| Review/submit | "Your diagnostic is underway 🎯" celebratory tone. | Confident, understated confirmation. | Medium |

## 2. Premium over decorative

| Area | Finding | Recommendation | Priority |
|---|---|---|---|
| Report section headers | Each header has a number badge **and** an emoji — redundant decoration. | Keep the numeral, drop the emoji. | High |
| Cards | Heavy reliance on borders + tinted backgrounds + colored pills creates visual noise. | Reduce borders; lean on whitespace + subtle elevation (the new shadow scale). Fewer, larger, calmer cards. | Medium |
| Iconography | Many small icons (KPI layer emoji, ★ bets, ✓/✕ focus-ignore). | Standardize on one restrained icon set or remove; never emoji. | Medium |

## 3. Information hierarchy

| Screen | Finding | Recommendation | Priority |
|---|---|---|---|
| Client dashboard | Progress is shown **three** ways at once (ring + readiness bars + module-card ticks). Nothing is clearly primary. | One focal point: the single next action (large). Demote the rest to secondary/supporting. | High |
| Analyst engagement | Very dense — status stepper, discovery alert, diagnostic engine, profile, smart, team, docs, all responses stacked as equal-weight cards. | Establish primary (status + next action) → secondary (scores/findings) → supporting (raw submission, collapsible). | Medium |
| Report | Strong cover, but 18+ sections at fairly even visual weight. | Add a one-page executive cover-summary and clearer section pacing/rhythm. | Medium |

## 4. Dashboards

| Finding | Recommendation | Priority |
|---|---|---|
| In-progress dashboard mixes 3 redundant completion visuals; cards are tight. | Consolidate to one progress model; increase card padding/whitespace; make the "next action" the hero. | High |
| Delivered dashboard KPIs (Maturity/Potential) are readable but not yet "Bloomberg/Stripe" scannable. | Larger, quieter KPI blocks; copper only on the number; more breathing room; consistent metric treatment with the report. | Medium |
| Charts: radar labels are tiny (8.5px); donut/score-bars are good. | Make charts feel more executive — larger labels, more whitespace, restrained gridlines. | Medium |

## 5. Reports (flagship deliverable)

| Finding | Why | Recommendation | Priority |
|---|---|---|---|
| Emoji in every section header. | Not board-grade. | Remove (see 0.2). | High |
| `insightHTML()` random tip embedded mid-report. | Breaks authority. | Remove from report. | High |
| Cover is strong (navy, scores) ✓ | — | Keep; consider a refined contents/summary page. | — |
| Dense, even-weight sections; decorative bullets (★, ✓/✕). | Reads long, not skimmable by a CEO. | Executive summary up front; tighten typographic rhythm; restrained markers. | Medium |
| Print path exists (`@media print`) ✓ but emoji/print color need a pass. | A board report is often printed. | Verify a clean PDF: page breaks, no emoji, mono-tone print. | Medium |

> The test you set — *"Would I hand this to the CEO of a $100M company?"* — is currently **no**, mainly due to emoji + embedded tips + brand leak on the cover. Those three fixes alone move it most of the way.

## 6. Forms / questionnaire

| Finding | Recommendation | Priority |
|---|---|---|
| Interview one-at-a-time flow is good for cognitive load ✓ | Keep. | — |
| "Every question needs an answer… please don't leave it blank" is repeated and slightly heavy-handed. | Allow an explicit "Not sure / N/A" choice; soften nagging copy. | Medium |
| Profile form is a flat stack of fields. | Group into logical sections with headings + more spacing. | Medium |
| Progress = thin bar + "Part X of 10" + count. | Add sense of effort remaining ("~5 questions left"); clearer stage labels. | Low |

## 7. Navigation

| Finding | Recommendation | Priority |
|---|---|---|
| Completion ticks in the rail answer "what have I done?" ✓ | Keep. | — |
| Client rail is a flat list of 8 items. | Group into "Prepare" vs "Results"; clarify current location beyond the title. | Medium |
| Analyst engagement sub-actions (Score/Results/Findings/Build Report) are a row of buttons. | Promote to a clear linear stepper so the analyst always knows the next step. | Medium |
| Back navigation is a bare `←` (history.back). | Use explicit breadcrumbs/labelled back. | Low |

## 8. Consistency audit

| Component | Finding | Recommendation | Priority |
|---|---|---|---|
| Tables | Report viewer uses `.rtable`; analyst report-builder uses raw inline-styled `<table>`. | One table component. | Medium |
| Hardcoded status colors | Analyst stepper "skipped" (#FEF3C7/#92400E), discovery-incomplete card (#FEF2F2), engagement notes bypass the semantic tokens. | Route all through `--amber/--red/...` tokens. | Medium |
| Spacing | Ad-hoc inline margins (14/16/18px) everywhere — no spacing scale. | Adopt a spacing scale (4/8/12/16/24/32) for consistent rhythm. | Medium |
| Type scale | Mix of `.h-title` and inline `font-size:18px` H2s. | Single documented type scale (already started in DESIGN_SYSTEM.md). | Medium |
| Buttons | Minor size/placement inconsistencies (client uses `.btn lg`, analyst `.btn`). | Standardize primary/secondary usage per screen. | Low |

## 9. Micro UX

| Detail | Finding | Recommendation | Priority |
|---|---|---|---|
| Loading | Plain "Loading…" text only. | Skeleton loaders for dashboard/report/queue. | Medium |
| Errors/confirm | Native `alert`/`confirm`. | Branded toasts + confirm dialog. | High (also 0.3) |
| Empty states | Exist but plain text. | Designed empty states (icon-light, one clear CTA). | Low |
| Success feedback | Inline "✓ Saved" text. | Consistent toast pattern. | Low |
| Transitions/hover | Minimal; cards lift. | Subtle, consistent motion (150ms) on interactive elements. | Low |

---

## Suggested implementation order

**Phase 1 — credibility (do before any CEO/investor sees it):**
- 0.1 Finish the brand replacement in both portals + report cover
- 0.2 Remove emoji from the report (and app chrome)
- 0.4 Remove embedded insight tips from the report
- 0.3 Replace native alert/confirm with branded toast + dialog

**Phase 2 — flagship report polish:**
- Executive summary/contents page, tighter rhythm, restrained markers, verified print/PDF

**Phase 3 — dashboards & hierarchy:**
- Single progress model, calmer KPI blocks, more executive charts, clear primary action

**Phase 4 — system consistency & micro-UX:**
- Spacing scale, type scale, one table component, tokenized status colors, skeleton loaders, designed empty states

---

*Prepared for joint review. On your sign-off I'll turn the agreed items into a build plan and implement in the phases above.*
