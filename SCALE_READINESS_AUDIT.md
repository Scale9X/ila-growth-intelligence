# 1XL Platform — Scale-Readiness Audit (post-hardening)

Re-audit after the infrastructure hardening pass. Target load unchanged: **~100 simultaneous engagements, ~10 analysts.**

---

## 1. What was hardened in this pass (all verified)

| # | Change | Verification |
|---|---|---|
| 1 | **Runtime data moved out of OneDrive** — DB, WAL, and uploads now live under a configurable `XL_DATA_DIR` (default `~/1xl-data`, i.e. `C:\Users\ASUS\1xl-data`, outside OneDrive). Existing data (FlowOps, Greenstone, ILAtech, uploads, key) migrated intact. | Server boots on new path; queue returns the 3 existing engagements; DOC upload/download works under the new path. |
| 2 | **`PRAGMA busy_timeout=5000`** — waits up to 5s on a locked DB instead of erroring. | Boots clean. |
| 3 | **29 database indexes added** on every hot foreign-key / filter column (answers, scores, engagements, sessions, logs, documents, reports, etc.). | `sqlite_master` shows 29 `idx_*`. |
| 4 | **Write-on-read eliminated:** `diagnostic()` no longer deletes/re-inserts the opportunity matrix on every view (moved to score-save); `computeBreakdown`/`getScores` are read-only (no longer create an `assessments` row on view); client `buildState` no longer creates a `discovery_responses` row on view. | Opportunities (25) and assessments (2) **unchanged** after 6 read-path hits; opportunities correctly regenerate on score **save** (10). |
| 5 | **Full workflow re-verified end-to-end** on the hardened build: score → complete grade → findings → report → approve → publish → delivered; permission gates; DOC round-trip. | All pass. |

**Net effect:** reads are now indexed and side-effect-free, so they no longer take the single write-lock or trigger write-amplification. The present-day **corruption risk from OneDrive syncing a live DB is removed.**

---

## 2. Before vs After — performance & risk

| Risk (from first scale analysis) | Before | After |
|---|---|---|
| **DB file in OneDrive** (corruption / lock from cloud-sync) | 🟥 Present risk *today* | ✅ **Resolved** — data outside OneDrive, configurable path |
| **No indexes** (full-table scans on every hot query) | 🟥 Scans grow linearly with data | ✅ **Resolved** — 29 targeted indexes; lookups are O(log n) |
| **`diagnostic()` writes on every read** (DELETE+INSERT 25 opp rows per view → write-lock thrash) | 🟥 Every Results view took the write lock | ✅ **Resolved** — reads are pure; opportunities regenerate only on score-save |
| **Hidden writes on view** (`assessments` + `discovery_responses` created on first view) | 🟧 First view of each page wrote a row | ✅ **Resolved** — view paths are read-only |
| **`SQLITE_BUSY` under contention** | 🟧 Immediate error | 🟧→🟢 Softened — 5s busy-timeout retries |
| **Synchronous DB blocks the event loop** | 🟥 Every query freezes all users | 🟥 **Still present** — see Remaining Critical #1 |
| **`scryptSync` login blocks the event loop** | 🟥 Login bursts freeze server | 🟥 **Still present** — see Remaining Critical #2 |
| Concurrent edits last-write-wins | 🟧 | 🟧 **Unchanged** |
| No pagination / N+1 in `detail()` | 🟧 | 🟧 **Unchanged** (indexes reduce the per-query cost, but payloads still unbounded) |
| AI calls no queue/backoff/timeout | 🟧 | 🟧 **Unchanged** |
| No backups / migrations / supervisor / rate-limiting | 🟧 | 🟧 **Unchanged** |
| Upload buffered in memory + `writeFileSync` blocks | 🟧 | 🟧 **Unchanged** (10MB cap limits blast radius) |

**Bottom line:** the *data-integrity* and *query-efficiency* classes of risk are largely closed. The *concurrency/throughput* ceiling (single synchronous thread) is **unchanged** — that's the next, larger track.

---

## 3. Remaining critical risks

### #1 🟥 Synchronous SQLite + single thread = serialized throughput (the ceiling)
Every DB call still blocks the one event-loop thread, so 10 analysts + their clients are serialized through a single worker. Indexes and no-write-on-read make each operation *much cheaper* (so the ceiling is now higher and reads don't fight the writer), but the architecture still can't do two things at once. At sustained concurrent load you'll see latency climb under bursts.
- **Fix:** migrate to **Postgres** (async driver `pg`; the SQL is already plain/portable) and run the app under a process manager with multiple workers. This is the single change that removes the ceiling.

### #2 🟥 `scryptSync` blocks the event loop on every login/signup
Unchanged this pass (it wasn't in the hardening list). A login burst (morning standup, 10 analysts) freezes the whole server for the sum of the hash times.
- **Fix:** switch to async `crypto.scrypt` (one-function change) — recommended as the very next hardening item.

### #3 🟧 Check-then-act races become real the moment the DB goes async
Today's "one active engagement per company" and "publish once" checks are safe **only** because synchronous SQLite can't interleave handlers. Migrating to async Postgres (#1) **will** introduce real races unless you first add DB constraints + transactions.
- **Fix:** add a unique constraint (one active engagement per company), wrap multi-statement mutations in transactions, and add optimistic-concurrency (`updated_at` precondition) on engagement/report updates — **before/with** the Postgres move.

### #4 🟧 No backups, no migration tooling, no supervisor
A lost/corrupted `1xl-data\1xl.db` is still catastrophic, schema changes are still manual (`CREATE TABLE IF NOT EXISTS` only), and a crash still takes the platform down with no auto-restart.
- **Fix:** scheduled DB backups (or managed Postgres with point-in-time recovery), a migration runner, and run under PM2/systemd/Windows-Service with auto-restart + periodic `PRAGMA integrity_check` (SQLite) / monitoring.

### #5 🟧 No rate-limiting / abuse protection
No throttle on login (brute force), API (scraping), or AI (cost abuse). Open staff-signup compounds this.
- **Fix:** per-IP/user rate limits, login lockout/backoff, and an invite-gate on staff-signup.

---

## 4. Recommended next infrastructure improvements (priority order)

1. **Async password hashing** (`crypto.scrypt`) — tiny change, removes a hard event-loop stall. *(Do first — cheapest win remaining.)*
2. **Pre-migration safety:** add unique constraints + transactions + optimistic-concurrency so the Postgres move can't introduce races (#3).
3. **Migrate SQLite → Postgres** with the `pg` async driver, and run under a **supervisor with N workers** behind a reverse proxy (TLS termination). Removes the throughput ceiling (#1) and the single-writer limit.
4. **Backups + migrations + monitoring** (#4): automated backups/PITR, a schema-migration tool, health/restart supervision, structured request logging + error tracking.
5. **Rate-limiting + invite-gated staff signup** (#5).
6. **Async/streamed file uploads** (replace base64-in-memory + `writeFileSync` with streamed multipart) and **pagination** on queue/history/notifications/reports.
7. **AI call queue** (max-in-flight), 429 backoff, and per-request timeout/`AbortController`.
8. **Operational hygiene:** retention/cleanup for `sessions`/`notifications`/logs, WAL checkpoint policy, and remove the default seed credentials before any shared deployment.

---

## 5. Operational notes for running the hardened build

- **Data now lives at `C:\Users\ASUS\1xl-data\`** (DB + `uploads/`). Back **that** folder up, not the project folder. Override with the `XL_DATA_DIR` environment variable to relocate (e.g. a dedicated data disk on a server).
- The project folder in OneDrive now holds **code only** — safe to sync.
- Restart `start.cmd` to run the hardened code; it will read/write the new data location automatically.
- The API key is read from `XL_DATA_DIR`, the old `data/` folder, or the project root — all still work.
