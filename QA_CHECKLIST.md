# 1XL Platform — End-to-End QA Checklist

Full path: **Client login → discovery → submit → analyst diagnostic → report → publish → client delivery**, across **Client / Analyst / Admin** roles. Run against a live server (`node --experimental-sqlite server.js`).

Legend: each item is PASS / FAIL / GAP. "GAP" = missing behaviour that isn't an outright bug.

---

## A. Authentication & access control (all roles)
- A1. Client signup creates user + company + owner membership + owner role, returns token.
- A2. Duplicate email on signup is rejected (409).
- A3. Login with correct credentials returns token + roles.
- A4. Login with wrong password returns **401 + "Invalid email or password"** (NOT a generic "auth" crash).
- A5. A previously created account can log out and log back in successfully.
- A6. Analyst (staff) self-signup creates an `is_staff=1` user with the `analyst` role + token.
- A7. `/api/auth/me` returns user + roles + companies for a valid token; 401 without token.
- A8. Unauthenticated request to `/api/portal/*` and `/api/analyst/*` returns 401.
- A9. A non-staff (client) token hitting `/api/analyst/*` is rejected (403 staff-only).
- A10. A plain analyst hitting admin endpoints (`/api/analyst/staff`) is rejected (403 admin-only).

## B. Client portal — discovery & profile
- B1. `GET state` returns company, profile, answers, members, ownerId, engagement, report, unread.
- B2. `PATCH profile` persists profile fields and reflects on next state read.
- B3. `PUT answer` persists an answer with **attribution** (answered_by → member name).
- B4. Smart extraction can be read/confirmed.
- B5. Team invite adds a company member; member appears in the access list.
- B6. **Access visibility**: logged-in client can see everyone with access to the project (owner + members).
- B7. Document add then delete works and reflects in state.

## C. Client portal — submission & gating
- C1. `submit` creates an engagement (status `submitted`) and a notification.
- C2. Client cannot list/read any report while it is still a draft (unpublished).
- C3. Client cannot read another company's report (ownership enforced).
- C4. Published report excludes analyst-only sections (key_findings / evidence / severity).
- C5. Notifications: client can list and mark-as-read; unread count updates.

## D. Analyst portal — queue & diagnostic engine
- D1. Analyst queue returns only engagements **assigned to that analyst**; `isAdmin=false`.
- D2. Engagement detail returns company, profile, members, answers, documents, smart, events, assignment fields.
- D3. Status transition (e.g. submitted→in_review) records a status_event AND notifies the client.
- D4. Maturity scores: get seeded scorecard, save scores → recompute breakdown.
- D5. Potential scores: get/save → recompute.
- D6. Diagnostic returns breakdown, grades, strengths/weaknesses, Magic Matrix (threshold 60), and auto-generated opportunities (Impact×Effort).
- D7. Findings: generate drafts, list, save, delete.

## E. Analyst portal — report lifecycle
- E1. Report generate builds all expected sections (exec summary, business reality, narrative, recommendations, budget, KPI, 90-day, 12-month).
- E2. Edit an EDITABLE section (e.g. executive_summary) persists.
- E3. Editing a DERIVED section is rejected (400).
- E4. Approve marks the report approved.
- E5. Publish sets the engagement to `delivered`, stamps published_at, and notifies the client.
- E6. After publish, the client can now read the published report (closes the loop with C2).

## F. Admin role
- F1. Admin queue returns **all** engagements; `isAdmin=true`.
- F2. Admin can list all staff.
- F3. Admin can create a new analyst/admin account.
- F4. Admin can assign an engagement to an analyst; that analyst then sees it in their queue.
- F5. Engagement detail (admin view) returns assignedAnalyst + analyst options for the dropdown.

## G. Front-end wiring (static review)
- G1. Brand reads "1XL" on platform landing, client rail, analyst rail.
- G2. Back arrow present in both portal topbars.
- G3. Sign out is a visible control in both portals.
- G4. Analyst login exposes a Sign-up path; router handles `#/admin` and signup.
- G5. Client api()/analyst api() only redirect on 401 when a token exists (the A4/A5 fix).
