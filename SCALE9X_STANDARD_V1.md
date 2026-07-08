# The Scale9X Standard — v1
*The canonical growth methodology behind the Scale9X platforms. This is the source of truth: the Growth Diagnostic Platform measures against it; the Growth Intelligence Platform builds strategy on top of it. Approved by Vin, 2026-07.*

> **Internal document.** The client report shows the *business meaning* of the levers — never this backend question mapping.

## The model
Growth is a system of **9 Growth Levers**, organised into **3 pillars**. A business grows at the speed of its weakest levers.

| Pillar | Question it answers | Levers |
|---|---|---|
| **Growth Foundation** | Are you built to grow? | 1 Positioning & Messaging · 2 Pricing & Packaging · 3 Measurement & Data |
| **Growth Engine** | Can you reliably win customers? | 4 Channels & Partnerships · 5 Acquisition & Demand Gen · 6 Conversion & Sales |
| **Growth Multipliers** | Does growth sustain & multiply? | 7 Retention & Churn · 8 Expansion & LTV · 9 Execution & Operating Rhythm |

## Scoring (v1)
- The diagnostic scores **93 areas** (individual questions), each normalised `raw ÷ max` → 0–1.
- Every area maps to **exactly one lever** (no double-counting). Mapping blends **Maturity** (current state) and **Potential** (growth possibility) inputs — so a lever reflects both how built-out and how promising it is.
- **Lever score (0–100)** = simple average of its areas' normalised scores × 100. *(Simple average chosen for v1: transparent, easy to explain, easy to improve.)*
- **Pillar score** = average of its 3 levers. **9X Score** = average of all 9 levers.
- **Bands:** **Low 0–44** · **Moderate 45–69** · **Strong 70–100**.
- **Growth Constraints** = the lowest 2–3 levers. **Growth Advantages** = the strongest 2–3 levers.
- **Confidence flag** (Pricing & Packaging, Retention & Churn — thinner v1 coverage). Client-facing wording: *"Indicative score based on available diagnostic inputs. Expanded assessment available in future versions."*

---

## The 9 Levers — full definitions & mapping (internal)

### Pillar 1 · Growth Foundation
**1. Positioning & Messaging** — *Measures:* clarity of who you serve, why you win, differentiation. *Why:* if the market can't tell why you're different, all downstream demand works harder.
Maps from — M·Customer Understanding (ICP Definition, Customer Segmentation, Customer Insights, Buying Journey Mapping); M·Competitive Strength (Unique Value Proposition, Market Defensibility, Competitive Advantage, Competitive Awareness, Competitive Monitoring); M·Market Position (Market Differentiation, Category Demand); P·Product/Service Strength (Product-Market Fit, Differentiation); P·Competitive Advantage (Brand Strength, Unique Proposition, Barriers to Entry, Defensibility).

**2. Pricing & Packaging** ⚠️ *(confidence-flagged v1)* — *Measures:* how you price, package and monetise; pricing power and model. *Why:* fastest lever on profit and perceived value.
Maps from — M·Business Foundation (Clear Business Model, Revenue Diversification); M·Financial Health (Margin Health, Customer Economics); P·Revenue Expansion (Pricing Power); P·Product/Service Strength (Repeatability).

**3. Measurement & Data** — *Measures:* whether you can see the truth — tracking, reporting, attribution, data trust. *Why:* you can't fix what you can't see.
Maps from — M·Technology & Data (Tech Stack, System Integration, Automation, Reporting, Data Accuracy); M·Marketing Effectiveness (Performance Measurement); M·Sales Excellence (Forecasting & Reporting); M·Funnel Performance (Funnel Visibility); M·Financial Health (Financial Visibility).

### Pillar 2 · Growth Engine
**4. Channels & Partnerships** — *Measures:* routes to market and leverage via channels, partners, geographies. *Why:* concentrated/weak channels cap how far demand can scale.
Maps from — M·Marketing Effectiveness (Channel Mix); P·Marketing Scalability (Channel Expansion Potential, Partnership Opportunities, Paid Media Scalability); M·Market Position (Geographic Expansion Readiness, Market Opportunity, Market Share Potential); P·Geographic Expansion Potential (Market Replicability, Regional Expansion Readiness, Localization Complexity).

**5. Acquisition & Demand Gen** — *Measures:* how effectively you create and capture demand. *Why:* the top of every growth number.
Maps from — M·Marketing Effectiveness (Strategy Quality, Content & Brand Strength, Marketing ROI); M·Funnel Performance (Lead Qualification, Nurturing Process); P·Customer Demand (Demand Consistency, Customer Urgency); P·Marketing Scalability (Content Scalability, Brand Growth Potential); P·Sales Scalability (Lead Generation Capacity); P·Market Opportunity (Market Size, Market Growth Rate, Market Accessibility).

**6. Conversion & Sales** — *Measures:* how reliably interest becomes revenue. *Why:* weak conversion wastes all upstream demand spend.
Maps from — M·Sales Excellence (Lead Management, CRM Discipline, Conversion Rates, Sales Process Maturity); M·Funnel Performance (Conversion Efficiency, Funnel Optimization); P·Sales Scalability (Sales Process Repeatability, CRM Readiness, Conversion Potential).

### Pillar 3 · Growth Multipliers
**7. Retention & Churn** ⚠️ *(confidence-flagged v1)* — *Measures:* whether customers stay and advocate. *Why:* the multiplier on every acquired customer.
Maps from — M·Customer Understanding (Customer Retention Understanding); P·Customer Demand (Retention Potential, Referral Potential); P·Product/Service Strength (Customer Satisfaction).

**8. Expansion & LTV** — *Measures:* whether accounts grow — upsell, cross-sell, lifetime value, new streams. *Why:* the cheapest growth comes from customers you already have.
Maps from — P·Revenue Expansion (Upsell Potential, Cross-Sell Potential, Lifetime Value Growth, New Revenue Streams).

**9. Execution & Operating Rhythm** — *Measures:* whether the organisation can deliver, decide and scale. *Why:* strategy dies without execution capacity and rhythm.
Maps from — M·Business Foundation (Strategic Direction, Defined Growth Objectives, Scalability Potential); M·Team & Operations (Team Structure, Accountability, Talent Capability, Leadership Alignment, Operational Efficiency); M·Financial Health (Revenue Growth, Growth Investment Capacity); P·Operational Scalability (Process Maturity, Automation Potential, Delivery Capacity, Vendor Ecosystem, Systemization Potential); P·Sales Scalability (Team Expansion Readiness); P·Leadership & Growth Readiness (Founder Ambition, Decision-Making Speed, Investment Appetite, Change Readiness, Leadership Capability).

---
## Version history
- **v1 (2026-07):** first canonical mapping. Blends Maturity + Potential; simple-average scoring; Pricing & Retention confidence-flagged (thin coverage). Computed server-side in the engine from the existing 93-area diagnostic.
- **v2 (planned):** dedicated pricing & retention questions; per-lever weighting; possible split of current-state vs potential per lever.
