# 1XL Platform — Scale Analysis (100 engagements · 10 analysts)

**Question:** What workflow, performance, concurrency, and data-integrity issues appear once the platform carries ~100 simultaneous engagements and ~10 analysts working concurrently?

**Short answer:** Functionally the platform handles it. **Architecturally it does not.** The design is a single Node process backed by a *synchronous* embedded database (`node:sqlite` `DatabaseSync`), with the data file living inside a **OneDrive-synced folder**. Three properties — (1) every DB query blocks the event loop, (2) synchronous password hashing and file writes block it too, (3) the database file is being cloud-synced — mean the platform will feel fine for one founder and degrade or corrupt under real concurrent load. None of this is a code-correctness bug; it's a capacity/architecture ceiling. The fixes are mostly infrastructure, plus a handful of query/index changes.

**Severity legend:** 🟥 Will break/degrade badly at this scale · 🟧 Noticeable slowdowns / risk · 🟨 Inefficiency to fix before growth.

---

## A. Concurrency & event-loop (the dominant ceiling)

### A1 🟥 The whole server is single-threaded and every DB call is *synchronous* (blocks the event loop)
`node:sqlite`'s `DatabaseSync` runs queries **synchronously** — while one request executes its queries, **all other requests are frozen**. With 10 analysts + their clients hitting endpoints that each run many queries (`detail()` alone fires ~10+), the server serializes everything through one thread. Throughput is capped at "one request's DB work at a time." A heavy endpoint (a Results view that recomputes the diagnostic) stalls every other user for its duration.
- **Why it bites at scale:** 1 user never overlaps; 30–50 concurrent humans constantly overlap.
- **Fix:** Move to an out-of-process database with async drivers (Postgres + `pg`, or even better-sqlite on a worker). At minimum, run the diagnostic/report compute off the request path. Long-term this is the **#1 scale change**: migrate to Postgres (the SQL is already plain and portable — `db.js` even says "Ports to Postgres later, same SQL").

### A2 🟥 `scryptSync` password hashing blocks the event loop on every login/signup
`auth.js` uses `crypto.scryptSync` (intentionally CPU-expensive, ~50–150ms). It is **synchronous**, so each login freezes the entire server for that time. Ten analysts logging in at 9am, or any login burst, produces visible global stalls.
- **Fix:** Use the async `crypto.scrypt` (callback/promise) so hashing doesn't block; better, offload to a worker thread. Trivial change, high payoff.

### A3 🟧 No single-process concurrency limit, no clustering, no load balancer
One `node server.js`. No `cluster`/PM2/worker pool, so it can't use multiple cores; one crash takes the whole platform down (and `start.cmd` just `pause`s — no auto-restart/supervisor).
- **Fix:** Run under a supervisor (PM2/systemd/Windows Service) with auto-restart; once on async DB, scale to N workers behind a reverse proxy.

### A4 🟧 No optimistic concurrency on shared engagement state (last-write-wins)
Two analysts (or admin + analyst) editing the same engagement's status, scores, or report sections overwrite each other silently; each `setStatus` also appends a `status_events` row, producing a confusing back-and-forth history. Detail is fetched once on navigation and never revalidated. (Flagged as **M1** in the integrity audit.)
- **Fix:** `updated_at`/version precondition on UPDATEs (`WHERE id=? AND updated_at=?`) → surface "changed by someone else, reload."

### A5 🟧 AI calls have no concurrency cap or per-org rate-limit handling
10 analysts each clicking "Suggest"/"Rewrite" → up to 10 concurrent 1–2 minute Claude calls. The event loop is fine (network is async), but: (a) you can hit Anthropic's per-org rate limits → 429s with no retry/backoff; (b) cost spikes; (c) no queue. There's also no `AbortController`/timeout — a hung call ties up the request indefinitely.
- **Fix:** A small concurrency queue (e.g. max 3 in flight) + 429 backoff + request timeout. Surface "queued" state.

---

## B. Performance & query efficiency

### B1 🟥 No indexes — every lookup is a full table scan
The schema (`db.js`) defines **no secondary indexes**. Hot queries all scan: `prompt_answers WHERE company_id` (discoveryStatus, on every gate check), `assessment_scores WHERE assessment_id` (every score compute), `engagements WHERE assigned_analyst_id` (queue), `status_events`/`activity_logs WHERE engagement_id` (history), `documents WHERE company_id`, `sessions WHERE token`. At 100 engagements × ~31 answers × ~93 score rows × growing logs, these scans get linearly slower and compound with A1 (each scan blocks everyone).
- **Fix:** Add indexes on every foreign key / filter column used above. This is the single cheapest, highest-impact performance fix and should be done now (even on SQLite). Example: `CREATE INDEX ... ON prompt_answers(company_id)`, `assessment_scores(assessment_id)`, `engagements(assigned_analyst_id, status)`, `activity_logs(engagement_id)`, `status_events(engagement_id)`, `documents(company_id)`, `sessions(token)`, `reports(engagement_id, status)`.

### B2 🟥 `diagnostic()` writes on every read, and is recomputed every time
Opening **Results** or generating a report calls `engine.diagnostic()` which calls `genOpportunities()` — that **DELETEs and re-INSERTs all `opportunities` rows on every call**. So a read-path (viewing results) performs writes, taking the WAL write lock. With 10 analysts viewing results, the write lock thrashes, serializing reads behind writes. There's also no caching: the full breakdown is recomputed from scratch each view.
- **Fix:** Make `diagnostic()` read-only; regenerate opportunities only when scores change (on `saveScores`), not on view. Cache computed breakdowns (invalidate on score change). This removes accidental write contention.

### B3 🟧 No pagination anywhere
`queue()` returns **all** engagements (admin: 100+ rows every poll); `reports`, `notifications`, `activity_logs`/history, and discovery `answers` all return full sets. The client `loadState()` even fetches **every** published report and its sections on each load. Payloads and parse times grow with data.
- **Fix:** Paginate queue/history/notifications; lazy-load report sections on demand; cap and page large lists.

### B4 🟧 `detail()` is an N+1 query cluster recomputed per open
Each engagement open runs ~10–15 sequential queries (company, profile, members, answers, documents, discovery, smart, events, assigned analyst, analyst list, discoveryStatus, scoringReady → which itself recomputes both scorecards). With A1, every open briefly stalls the server.
- **Fix:** Combine into fewer queries / joins; memoize `scoringReady`/`computeBreakdown`.

### B5 🟨 Static assets re-read from disk per request with `no-cache`
`serveStatic` does `fs.readFile` on every page load and sends `Cache-Control: no-cache` (added to fix stale JS). Fine for a few users; at scale it's repeated disk I/O and re-downloads. (OS file cache softens it.)
- **Fix:** In-memory cache assets with an ETag/version query-string for cache-busting instead of `no-cache`.

---

## C. Data integrity at scale

### C1 🟥 The database file lives in a OneDrive-synced folder
`data/1xl.db` (+ `-wal`, `-shm`, and now `data/uploads/`) sit under `…\OneDrive\Documents\…`. **OneDrive continuously syncs these files.** Cloud-sync of a live SQLite database is a well-known corruption/lock hazard: OneDrive can read-lock or snapshot the file mid-write, causing `SQLITE_BUSY`/"database is locked" errors or, worst case, a corrupted DB. WAL mode makes this riskier (three coupled files must stay consistent). This is a risk **today**, and a near-certainty of trouble under concurrent writes.
- **Fix (do this regardless of scale):** Move `data/` out of OneDrive (e.g. `C:\1xl-data\`) via an env var for the DB path; exclude it from OneDrive sync; back it up separately. On a real server, this is moot (no OneDrive), but for any local/demo run it matters.

### C2 🟧 Check-then-act races are mitigated only by single-threaded sync execution
Submit's "no existing non-delivered engagement?" check-then-insert, and similar patterns, are currently safe **only because** `DatabaseSync` runs the whole handler synchronously with no interleaving. The moment you move to an async DB (the A1 fix), these become real race conditions (duplicate engagements, double-publish) unless wrapped in transactions / unique constraints.
- **Fix:** Add DB constraints (e.g. partial unique index "one active engagement per company") and wrap multi-statement mutations in transactions **before** migrating to async. Don't let the A1 migration silently introduce races.

### C3 🟧 Unbounded-growth tables, no retention, no checkpointing strategy
`sessions`, `activity_logs`, `status_events`, `notifications` grow forever. Expired sessions are only deleted lazily when that exact token is used again; abandoned tokens accumulate. The WAL file grows without an explicit checkpoint policy.
- **Fix:** Periodic cleanup job (expired sessions, old notifications), WAL auto-checkpoint settings, and archival/retention for logs.

### C4 🟧 No backups, no migrations, no integrity checks
There is no backup of `1xl.db`, no schema-migration mechanism (schema is `CREATE TABLE IF NOT EXISTS` only — column changes require manual handling), and no `PRAGMA integrity_check`. At 100 paying engagements, a lost or corrupted file is catastrophic.
- **Fix:** Scheduled backups (or managed Postgres with PITR), a migration tool, periodic integrity checks.

### C5 🟨 Score history is overwrite-only; audit logs lack before→after diffs
`assessment_scores` keeps only the latest value (`scored_by` overwritten); the audit log records *that* a change happened, not old→new. At scale, "who changed this score from 2→0 and when" can't be answered. (Flagged **A1+** in the integrity audit.)
- **Fix:** Append-only score versions or populate the unused `audit_trails.diff` with old/new JSON.

---

## D. Workflow integrity at scale

### D1 🟧 No "send back to client" recovery path
With 100 engagements, some clients will submit thin/incorrect info. The analyst is correctly locked (post-audit) but **cannot reopen the client's submission** — the client sees a terminal "under review." At volume this creates stuck engagements requiring manual DB edits. (Flagged **W6**.)
- **Fix:** A "return to client" action that flips `discovery_responses.status` back to in-progress and notifies the client.

### D2 🟧 Assignment is all-or-nothing and manual; no workload balancing or queue triage
An admin must hand-assign each of 100 engagements; the queue has no filters/sort/search, no "unassigned" view, no per-analyst load view, no SLA/aging indicators. Analysts can't see what's overdue.
- **Fix:** Queue filters (status, assignee, age, unassigned), sortable columns, basic workload counts; optional round-robin auto-assign.

### D3 🟧 Notifications are in-app only and unbounded; no email/digest
Clients/analysts only see notifications inside the portal (and the list grows forever). At scale, people won't sit in the portal — they need email on key transitions (submitted, delivered, returned).
- **Fix:** Email (or webhook) on key events; mark-read + retention on the notification list.

### D4 🟨 No separation of duties between scoring analyst and approver
Any assigned staff can score, approve, and publish the same report. At 10 analysts you'd typically want analyst-scores → reviewer-approves → publish. (Related to integrity audit P/W findings.)
- **Fix:** A reviewer role gate on approve/publish distinct from the scorer.

---

## E. Operational / resilience

| # | Issue | Sev | Fix |
|---|---|---|---|
| E1 | No request rate-limiting → scraping/DoS, login brute-force, AI-cost abuse | 🟧 | Per-IP/user rate limits; login throttle/lockout |
| E2 | Body is fully buffered in memory (`bodyOf`); concurrent 10MB uploads spike RAM | 🟧 | Stream uploads to disk (multipart) instead of base64-in-memory; the 14MB cap helps but memory still scales with concurrency |
| E3 | `writeFileSync` on upload blocks the event loop for the duration of the write | 🟧 | Use async `fs.promises.writeFile` (and ideally stream) |
| E4 | No structured logging, metrics, or health/alerting beyond `/api/health` | 🟨 | Request logging, error tracking, basic metrics (p95 latency, error rate) |
| E5 | No HTTPS/TLS in the app itself; tokens in `localStorage` (XSS-exfiltratable) | 🟧 | Terminate TLS at a proxy; consider httpOnly cookie sessions |
| E6 | Default seed creds (`admin@1xl.co`/`changeme`) printed on boot | 🟥 (prod) | Remove/rotate before any shared deployment (also in integrity audit OPS1) |
| E7 | Single SQLite file = single writer; high concurrent-write workloads (logs, score saves, opportunity rewrites) contend on one lock | 🟧 | Postgres (A1) removes the single-writer ceiling; until then, reduce writes-on-read (B2) |

---

## Recommended sequencing (most leverage first)

1. **Get the data out of OneDrive (C1)** and back it up (C4) — do immediately; corruption risk is present *today*.
2. **Add indexes (B1)** and **stop writing on read (B2)** — cheap, large wins, no architecture change.
3. **Async password hashing (A2)** and **async file writes (E3)** — small changes that remove two event-loop stalls.
4. **Migrate to Postgres (A1)** — the real ceiling-lifter; **before/with it**, add transactions + unique constraints (C2) so the move doesn't introduce races. Run under a supervisor with multiple workers (A3).
5. **Pagination + queue triage (B3, D2)**, **AI queue/backoff (A5)**, **rate limiting (E1)**.
6. **Workflow-at-scale**: return-to-client (D1), email notifications (D3), reviewer separation (D4), optimistic concurrency (A4), score history (C5).

**Bottom line for a Dhiraj conversation:** the platform is correct and demo-ready for a handful of users. To carry hundreds of engagements it needs (a) the database moved off OneDrive and onto Postgres, (b) indexes + no-writes-on-read, (c) async hashing/file-IO, and (d) a supervisor + rate limiting. That's a focused infrastructure track, not a rewrite — the application logic and SQL largely carry over.
