# Clarifying Questions

## Critical (must answer before proceeding)

1. **Undo behavior for mutated records**
   When a user edits an imported contact between import and undo, what should happen? Options: (a) undo reverts to pre-import state anyway, overwriting edits; (b) undo skips records that were modified; (c) undo is blocked entirely if any record in the set was modified; (d) user sees a conflict report and chooses per-record.
   - _Why it matters:_ The undo story's soft-delete logic, the data model (need to snapshot pre-import state?), and the 48h window UI all change significantly based on this answer.
   - _Default assumption if unanswered:_ Skip modified records during undo and report them as "skipped — record was edited after import."

2. **Authorization model for import and undo**
   Which roles can trigger an import? Which can trigger undo? Specifically: can a Power User who ran an import also undo it, or is undo admin-only? Can Power Users see the full import history, or only their own?
   - _Why it matters:_ Every API endpoint and UI affordance needs a permission guard. Getting this wrong ships with either a privilege escalation or a usability block.
   - _Default assumption if unanswered:_ Both CRM Admin and Power User can run imports; only CRM Admin can undo; Power Users see only their own import history.

3. **Date format handling behavior**
   When a column is mapped to a date field and rows have inconsistent formats (e.g., `2024-01-15` mixed with `01/15/2024`), should the pipeline: (a) auto-detect per cell and silently coerce; (b) require the user to declare the expected format before commit; (c) flag inconsistent cells as row-level errors?
   - _Why it matters:_ Option (a) risks silent data corruption at scale. Options (b) and (c) require different UI components (a format picker vs. error rows in preview). This changes the Validation Engine and Preview stories.
   - _Default assumption if unanswered:_ Flag inconsistent or ambiguous date cells as row-level validation errors rather than auto-coerce.

4. **Async processing threshold**
   At what file size or row count does the pipeline switch from synchronous (spinner) to async (background job + polling)? This affects whether the user waits on the preview screen or is redirected to a job status page.
   - _Why it matters:_ The UX flow diverges: sync = blocking preview load; async = "we'll notify you" redirect. Two different frontend flows.
   - _Default assumption if unanswered:_ Files exceeding 1,000 rows or 1MB are processed async.

5. **Uniqueness constraint scope beyond contacts**
   The spec calls out "no duplicate emails within an import or against existing records." Does this uniqueness constraint apply only to contacts (where email is the natural key), or also to companies and deals? If yes for companies/deals, what field is the unique key?
   - _Why it matters:_ The Validation Engine story needs different query logic and error messaging per entity type. If deals have no natural unique key, the constraint may not apply at all.
   - _Default assumption if unanswered:_ Uniqueness check applies to contacts only (email as key); companies and deals skip the cross-file uniqueness check in v1.

---

## Important (strongly recommended)

1. **S3 file retention window**
   How long should uploaded CSVs be retained in S3 after import? Is the original file needed to support undo (e.g., to reconstruct which record IDs came from which file)?
   - _Why it matters:_ Affects storage cost, PII compliance posture, and whether the undo feature needs a file reference at all. A 30-day lifecycle rule is standard but not always appropriate for regulated data.
   - _Default assumption if unanswered:_ Retain uploaded files for 30 days post-import via S3 lifecycle rule; undo relies on stored record IDs, not the original file.

2. **Partial import: opt-in or always-on**
   Is "import valid rows, skip invalid ones" always enabled, or does the user choose it per run at the preview/commit screen?
   - _Why it matters:_ If always-on, the preview commit button is straightforward. If opt-in, the commit screen needs a toggle with clear consequences ("12 rows will be skipped"), which adds a state branch to the preview story.
   - _Default assumption if unanswered:_ Opt-in checkbox on the commit screen, defaulting to off (fail the entire import if any errors exist).

3. **Async completion notification**
   When a background import finishes, is the user notified? Options: in-app toast/badge only, email, both, or nothing (user polls the history page).
   - _Why it matters:_ Email notification requires integration with a notification service — that's out of scope if not intended. In-app polling is already covered by the progress endpoint.
   - _Default assumption if unanswered:_ No email notification in v1; in-app status updates via polling are sufficient.

4. **Column mapping template persistence**
   Can users save a mapping configuration (e.g., "Salesforce export → our CRM fields") and reuse it for future imports? Enterprise migrators running repeated imports will expect this.
   - _Why it matters:_ Template persistence requires a mapping-template model, CRUD endpoints, and UI. Without it, the Column Mapping story is significantly simpler.
   - _Default assumption if unanswered:_ No template persistence in v1; each import session requires re-mapping.

5. **Import history scope and retention**
   How many past imports are shown? Is there a search or filter (by date, entity type, status)? How long are history records retained (indefinitely, 1 year, etc.)?
   - _Why it matters:_ Determines whether the history endpoint needs pagination, filtering, and a retention cleanup job, or is a simple list.
   - _Default assumption if unanswered:_ Show last 50 imports in reverse-chronological order, no search, no expiry in v1.

---

## Nice to Have (will use reasonable defaults)

1. **Progress bar delivery mechanism**
   Does the frontend poll a status endpoint for async job progress, or should it use WebSockets or Server-Sent Events for real-time push?
   - _Default assumption if unanswered:_ HTTP polling every 3 seconds. Simpler with Django + Celery; avoids a WebSocket layer in v1.

2. **Intra-file duplicate row resolution**
   If two rows in the same CSV share the same email, which row wins — first, last, or are both flagged as errors and neither imported?
   - _Default assumption if unanswered:_ Both rows flagged as duplicate errors; neither is imported. The error CSV identifies both row numbers.

3. **Custom field enum mismatch severity**
   When a value doesn't match an existing enum option, should that row fail, or should the entire import be blocked?
   - _Default assumption if unanswered:_ Fail the row only (consistent with partial import model); the enum mismatch appears in the error report.

---

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **One entity type per import** — Each CSV file maps to a single entity type (contacts, companies, or deals), selected by the user at the upload step. Mixed-type files are not supported. *Basis: not mentioned in requirements; mixed-type parsing adds schema complexity with no stated use case.*
2. **Progress delivery is polling** — The frontend polls `/api/imports/{id}/status` every 3 seconds. *Basis: Django + Celery stack; WebSockets add infra complexity not justified for v1.*
3. **Full-file validation before preview** — Validation runs on the entire file before the preview screen is shown (not lazily on first 20 rows). *Basis: the spec says "indicator of total errors before committing," which requires full-file knowledge.*
4. **ETR uses rolling rows/sec average** — Estimated time remaining is calculated from the Celery task's rolling throughput, not a fixed heuristic or ML model. *Basis: simplest correct approach with available metadata.*
5. **In-app notification only** — No email sent on async job completion. *Basis: no notification service mentioned in technical context.*
6. **History shows last 50 imports, no search** — Scoped to a simple paginated list in v1. *Basis: no pagination or search requirement stated.*
7. **Undo is also async for large imports** — Soft-deleting 100k records runs as a background Celery task, not synchronously. *Basis: same scale constraints as import itself.*
8. **S3 completion requires client confirmation** — Since uploads go direct to S3 via presigned URL, the client must POST a confirmation to the backend to trigger Celery processing (S3 event notification is an alternative but adds infra). *Basis: current architecture has no S3-to-backend event wiring mentioned.*
