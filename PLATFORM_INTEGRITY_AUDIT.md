# 1XL Platform — Platform Integrity Audit

**Scope:** Full review of workflow integrity, data integrity, permission integrity, and diagnostic defensibility across the client portal, analyst portal, API, diagnostic engine, report engine, and AI layer.
**Method:** Four independent auditors (permission/auth, workflow/state, data/documents/resilience, AI-defensibility/audit-trail) reviewed the codebase read-only, then fixes were implemented and verified.
**Trigger:** A founder end-to-end test exposed an incomplete interview (14/31) reaching a delivered report. That symptom implied systemic gaps — confirmed below.

**Status legend:** ✅ Implemented & verified · 🟡 Partially implemented · ⛔ Deferred (documented, with remaining risk)

---

## Summary scorecard

| # | Issue | Risk | Status |
|---|---|---|---|
| P1 | Analyst could access/score/publish **any** engagement by URL id (no assignment check) | Critical | ✅ |
| P2 | Assign endpoint not admin-gated → analyst could self-assign any engagement | Critical | ✅ |
| W1 | `setStatus` allowed `submitted→delivered` directly, delivering with **no report** | Critical | ✅ |
| W2 | `publish` had **zero prerequisites** (no approve / scores / findings) | Critical | ✅ |
| W3 | `publish` not idempotent → double-publish, duplicate client notifications | Critical | ✅ |
| D1 | Discovery could be **submitted incomplete**; analyst could score/report incomplete | Critical | ✅ (prior pass + reinforced) |
| A1 | Audit trail logged only 2 auth events; no who-did-what-when; no history UI | Critical | ✅ |
| W4 | Report could be generated/graded from **zero/partial scores** (fake 0/100·F) | High | ✅ |
| W5 | Published report could be silently **overwritten** by regenerate | High | ✅ |
| E1 | `saveScores` accepted out-of-range / NaN scores (no clamp) | High | ✅ |
| E2 | Unscored areas counted as 0 → misleading grade on partial scoring | High | ✅ |
| S1 | No session expiry; suspended users' tokens kept working | High | ✅ |
| R1 | No double-click guard → duplicate submits/members/notifications | High | ✅ |
| DOC1 | Uploaded documents store **filename only** — bytes never saved or retrievable | Critical | ⛔ |
| R2 | 401 mid-flow / hard refresh drops unsaved Profile & Smart Discovery edits | High | 🟡 |
| P3 | Open staff self-signup (anyone can become an analyst account) | High | 🟡 |
| AIQ1 | Count-only completeness gate; 31 "not sure" answers pass; no answer-quality floor | High | 🟡 |
| P4 | Within-tenant client roles flat (a contributor can invite/submit/edit profile) | Medium | ⛔ |
| AIQ2 | Smart Discovery confirmable without real review; labeled "client-confirmed" to AI | Medium | ⛔ |
| M1 | No optimistic-concurrency on concurrent analyst edits (last-write-wins) | Medium | ⛔ |
| W6 | No "send back to client" path when discovery/info is insufficient | Medium | ⛔ |
| E3 | Per-area confidence/evidence not surfaced in the client report | Medium | ⛔ |
| OPS1 | Seed ships default admin/analyst creds (`changeme`) printed to console | Critical (prod) | ⛔ (dev-only; documented) |

---

## Detailed findings

Each finding: **Issue · Risk · Root cause · Recommended fix · Implemented fix · Remaining risk.**

### P1 — Engagement access not authorized per-object (IDOR) — **Critical — ✅**
- **Root cause:** Authorization was a *list filter* on the queue only; detail/score/report/publish handlers trusted the engagement id in the URL with no assignment check.
- **Recommended fix:** Per-object guard on every engagement/report/finding route.
- **Implemented:** Added `canAccess(engagementId, user)` (admin OR `assigned_analyst_id`/`reviewer_id` == user) and a centralized guard in `analyst.handle` covering `/engagement/:id/*`, `/report/:id/*`, `/finding/:id`. Report/finding ids resolve to their engagement first. Returns 403 otherwise. **Verified:** analyst→unassigned detail/status = 403.
- **Remaining risk:** None material for staff scoping. Reviewer role is honored but not yet assignable via UI.

### P2 — Assignment endpoint not admin-gated — **Critical — ✅**
- **Root cause:** `/assign` had no `isAdmin` check and defaulted `analyst_id` to the caller (`|| user.id`).
- **Implemented:** `/assign` now requires admin, requires a valid **staff** `analyst_id` (`isStaffUser`), and is audit-logged. **Verified:** analyst self-assign = 403.
- **Remaining risk:** None.

### W1 — `setStatus` delivered-bypass — **Critical — ✅**
- **Root cause:** `setStatus` accepted any stage and special-cased `delivered` (set `published_at`, notified client) with no report.
- **Implemented:** `setStatus` now **rejects `delivered`** (must use Publish), rejects mutating an already-delivered engagement, and removed the `published_at` side-effect. Delivery is reachable only via `report.publish`. **Verified:** status→delivered = 400.
- **Remaining risk:** Non-delivered transitions are still free-form (forward/back). Acceptable — the binding gate is publish; a strict adjacency matrix is a recommended hardening.

### W2 — `publish` had no prerequisites — **Critical — ✅**
- **Root cause:** `publish` flipped status/notified/locked with no checks.
- **Implemented:** `publish` now requires: report status `approved`, **both scorecards fully scored**, **≥1 finding**, and not already published; else 4xx with the specific missing prerequisite. `approve` enforces the same scoring+findings prereqs and is audit-logged.
- **Remaining risk:** Approve/publish are not yet restricted to a *separate* reviewer role (any assigned staff/admin can do both). Separation-of-duties is a recommended next control.

### W3 — `publish` not idempotent — **Critical — ✅**
- **Implemented:** First line of `publish`/`approve` rejects an already-published report (409). No more double-notify / moving `published_at`.

### D1 — Incomplete discovery reaching diagnostics — **Critical — ✅**
- **Implemented (prior pass, reinforced):** Client submit gate (`< 31` non-blank → 400), analyst gate (`notReady`) on scoring/suggest/findings/report/narrate, "save-before-advance" in the interview, and an analyst engagement banner + lock. **Verified:** submit 0/3/14 = blocked; analyst actions on incomplete = locked.
- **Remaining risk:** "Complete" means 31 non-blank answers, not 31 *substantive* ones — see AIQ1.

### A1 — Audit trail / history — **Critical — ✅**
- **Root cause:** `audit_trails` was written in only 2 auth spots; `activity_logs` was write-only with no reader and no UI.
- **Implemented:** A `logAct()` helper now records every staff mutation — score saves (with coverage), AI suggest/narrate runs (+ model), findings create/generate/delete, report generate/edit/approve/publish, status changes, assignments, staff creation. New admin/assigned endpoint `GET /api/analyst/engagement/:id/history` merges `status_events` + `activity_logs` into a newest-first who-did-what-when timeline, surfaced via a **🕓 History** button + timeline view in the analyst portal. **Verified:** history endpoint returns actor + action + timestamp.
- **Remaining risk:** History shows *that* a thing changed, not full before→after value diffs (the `audit_trails.diff` column is still unused). Score edits overwrite prior values (no per-area version history). Recommended next: snapshot old→new on score/section edits.

### W4 — Report from zero/partial scores — **High — ✅**
- **Root cause:** `generate`/`findings` were gated only on discovery, not scoring; unscored areas summed to 0 → a fake `0/100 · F`.
- **Implemented:** `scoringGate` (both scorecards fully scored) now blocks `findings/generate`, `report/generate`, and `narrate`; engine suppresses grade/label until complete; UI shows "Not fully scored (X/N)". **Verified:** unscored report/findings generate = 400; partial scoring shows no grade.

### W5 — Published report overwritable — **High — ✅**
- **Implemented:** `report/generate` now returns 409 if a published report already exists for the engagement (it cannot be regenerated).
- **Remaining risk:** Formal, audited "create a new revision of a delivered report" flow is not built (intentionally — delivered reports are locked).

### E1 — Score range not validated — **High — ✅**
- **Implemented:** `saveScores` validates the area belongs to the scorecard, rejects non-finite numbers, and clamps to `0..max`. **Verified:** 999 → stored 2 (rubric max).

### E2 — Unscored treated as 0 — **High — ✅**
- **Implemented:** `computeBreakdown` returns `scoredAreas/totalAreas/complete`; grade/label null until complete; Magic Matrix verdict requires both scorecards complete. Covered by W4 verification.

### S1 — Sessions never expire / suspended users keep access — **High — ✅**
- **Implemented:** `userByToken` now expires sessions older than 30 days (deletes the row) and rejects users whose `status !== 'active'`.
- **Remaining risk:** No "log out all sessions" on password change, and no sliding refresh; tokens are still bearer tokens in `localStorage`.

### R1 — Double-click duplicates — **High — ✅**
- **Implemented:** In-flight guards (`_busy`) on submit, invite, save-scores, generate, approve, publish; these also now surface server errors via alert instead of silently swallowing. Submit notification only fires on first submission.

### DOC1 — Uploaded documents not stored or retrievable — **Critical — ⛔ (deferred)**
- **Root cause:** The client sends only `{category, name}`; the server stores a filename string. No byte transport (multipart/base64), no storage, no download route. The schema's `file_path/mime/size` columns are never written.
- **Recommended fix:** Client sends bytes (base64 for small files, or multipart); server writes to `data/uploads/<id>` + persists `file_path/mime/size`; add scoped `GET .../document/:id` download routes (client owner + assigned staff); validate type/size.
- **Implemented (partial):** Upload now **validates** presence + category allowlist and **links the document to the active engagement** (`engagement_id`). Byte storage/retrieval is **not yet built**.
- **Remaining risk: HIGH.** Analysts still cannot open client-uploaded files — the "we review your real data" promise is unmet. This is the **top recommended next build**. Until then, treat uploaded docs as a *signal that a file exists*, not as retrievable evidence. (No data corruption risk; purely a missing capability.)

### R2 — Unsaved work lost on 401 / refresh (Profile, Smart Discovery) — **High — 🟡**
- **Root cause:** The 401 handler wipes state and navigates to login; Profile and Smart Discovery hold edits in the DOM only (no draft net like the interview now has).
- **Implemented (partial):** The interview is fully protected (save-before-advance + localStorage drafts + retry). Profile/Smart still rely on clicking Save.
- **Remaining risk: MEDIUM.** A token expiry or refresh mid-edit on Profile/Smart loses those (short) forms. Recommended: extend the interview's localStorage-draft pattern + a `beforeunload` guard to Profile and Smart Discovery.

### P3 — Open staff self-signup — **High — 🟡**
- **Root cause:** `/api/auth/staff-signup` lets anyone create an `analyst` staff account (added earlier so analysts could self-register).
- **Mitigation already in place:** With P1 fixed, a self-registered analyst sees **nothing** and can access **no** engagement until an admin assigns one — so the blast radius is now small.
- **Remaining risk: MEDIUM.** Strangers can still create staff logins (clutter / a foothold). Recommended: gate staff-signup behind an admin invite code (e.g. an env-var `STAFF_SIGNUP_CODE`) or default new staff to `status='pending'` until an admin activates.

### AIQ1 — Completeness is a count, not a quality check — **High — 🟡**
- **Root cause:** The gate counts 31 non-blank answers; the UI even coaches "even 'not sure yet' counts." So 31 thin answers pass, and AI/analyst will still produce a confident scorecard.
- **Note:** Per your explicit product decision, clients must type *something* rather than be blocked — so non-blank is intentional. The defensibility backstop is now scoring + evidence notes + human review.
- **Remaining risk: MEDIUM.** A garbage-in submission can still be scored. Recommended (optional): an answer-quality heuristic (length / "not sure" detection / per-section coverage) that warns the analyst and forces `confidence: low` for thinly-evidenced areas before AI scoring.

### P4 — Flat within-tenant client roles — **Medium — ⛔**
- A `contributor` can invite members, reassign sections, edit the company profile, and submit. Recommended: gate `team`/`assign`/`profile`/`submit` to `owner`/`client_admin`. **Remaining risk: LOW–MEDIUM** (intra-company only; no cross-tenant exposure).

### AIQ2 — Smart Discovery "confirmed" without real review — **Medium — ⛔**
- Auto-filled from raw answers; one click stamps `confirmed` and the AI prompts treat it as "client-confirmed ground truth." Recommended: require an explicit edit/acknowledge before stamping confirmed, and label unedited auto-fill differently to the AI. **Remaining risk: LOW–MEDIUM** (analyst still reviews the report).

### M1 — No optimistic concurrency — **Medium — ⛔**
- Two staff editing the same engagement = last-write-wins (mitigated by P1 narrowing who can touch an engagement, and Node's single-threaded synchronous DB which prevents true interleaving on a single submit). Recommended: `updated_at`/version precondition on UPDATEs. **Remaining risk: LOW.**

### W6 — No "send back to client" recovery path — **Medium — ⛔**
- When discovery is incomplete or info is insufficient, the analyst is locked but cannot reopen the client's submission; the client sees a terminal "under review." Recommended: a "return to client" action that sets `discovery_responses.status='in_progress'` and notifies the client. **Remaining risk: MEDIUM** (operational dead-end; today requires manual DB intervention).

### E3 — Confidence/evidence not in client report — **Medium — ⛔**
- Per-area confidence is collapsed to one label and `evidence_note` never reaches the client report. Recommended: an evidence appendix. **Remaining risk: LOW** (defensibility/polish).

### OPS1 — Default seed credentials — **Critical for production — ⛔ (dev-only today)**
- `db.seed()` creates `admin@1xl.co` / `analyst@1xl.co` with password `changeme` and the server prints them on boot. Fine for local dev; **must be removed/rotated before any shared/production deployment.** **Remaining risk: deployment-time** — flagged for the go-live checklist.

---

## What changed in this pass (files)

- **engine.js** — score range validation/clamp; `scoredAreas/totalAreas/complete`; grade suppressed until complete; Magic Matrix requires full scoring; `scoringReady()` export.
- **report.js** — `reportPrereqs()`; `approve`/`publish` enforce approved→scored→findings→idempotency; approval audit-logged.
- **analyst.js** — `canAccess` per-object guard (centralized); admin-gated + validated assignment; `setStatus` delivered-block; `scoringGate`; published-report regenerate block (409); `logAct` on all mutations; `engagementHistory()` + `GET /engagement/:id/history`.
- **auth.js** — session TTL (30d) + active-status enforcement in `userByToken`.
- **portal.js** — document validation + engagement linking; submit notification de-duplicated.
- **public/analyst/app.js** — scoring-progress + Findings/Report lock until scored; honest "Not fully scored (X/N)"; 🕓 History timeline view; double-click guards + error surfacing on generate/approve/publish/save-scores.
- **public/client/app.js** — double-click guards + error surfacing on submit/invite (interview save-before-advance from prior pass retained).

## Verified live (free, no AI/billable calls)
Permission 403s (unassigned detail/status/assign) · `setStatus→delivered` blocked (400) · report+findings generate blocked when unscored (400) · score clamp 999→max · partial scoring shows no grade · submit blocked at 0/3/14 · audit history returns actor+action+time.

## Recommended next controls (priority order)
1. **DOC1** — real document storage + retrieval (highest user-facing gap).
2. **W6** — "return to client" recovery path.
3. **P3** — invite-gate staff signup.
4. **A1+** — before→after value diffs and score-edit history.
5. **R2** — draft/`beforeunload` protection for Profile & Smart Discovery.
6. **AIQ1 / AIQ2 / P4 / E3 / M1** — quality heuristics, real smart-confirm, intra-tenant roles, evidence appendix, optimistic concurrency.
7. **OPS1** — remove default seed creds before go-live.
