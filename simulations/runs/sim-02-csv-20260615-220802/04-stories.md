# Story Decomposition

---

## Feature: File Upload

### UPLOAD-01: Drag-and-drop file upload via presigned URL
**As a** CRM Admin or Power User,
**I want** to upload a CSV or .xlsx file (up to 50MB) via drag-and-drop or file picker,
**so that** I can initiate a bulk data import without hitting the CRM's API payload limits.

**Scope:**
- In: CSV and .xlsx file type enforcement client-side; drag-and-drop and file picker UI; 50MB size check before upload starts; entity type selector (contacts / companies / deals) shown before upload; presigned S3 URL generation endpoint (backend); presigned URL expiry set to 15 minutes minimum; direct browser-to-S3 upload using the presigned URL
- Out: File parsing, validation, column mapping — those follow in later steps; authentication enforcement (assumed handled by existing CRM auth layer)

**Dependencies:** AWS S3 bucket configured; UPLOAD-02 (completion callback)
**Priority:** P1
**Size estimate:** M

---

### UPLOAD-02: S3 upload completion callback and import job initialization
**As a** CRM Admin or Power User,
**I want** the system to register that my file finished uploading and create a processing job,
**so that** my file is queued for the next step and I receive a job ID to track progress.

**Scope:**
- In: Client-side POST to a confirmation endpoint after S3 upload succeeds; backend creates an `ImportJob` record (status: `pending`, entity type, original filename, S3 key, uploader user ID, timestamp); endpoint returns job ID; S3 lifecycle rule set to auto-delete uploaded files after 90 days
- Out: Validation or processing (triggered later); S3 event-based triggers (client POST is the confirmed mechanism)

**Dependencies:** UPLOAD-01
**Priority:** P1
**Size estimate:** S

---

## Feature: Column Mapping UI

### MAP-01: Map CSV/xlsx columns to CRM fields
**As a** CRM Admin or Power User,
**I want** to map the columns in my uploaded file to CRM fields before import,
**so that** the system knows which source column corresponds to which CRM field for validation and insert.

**Scope:**
- In: Auto-read headers from uploaded file (first row); UI displaying each CSV column alongside a CRM field dropdown; CRM fields shown are scoped to the selected entity type (standard fields + all active custom fields for that entity); ability to mark a column as "ignore" (unmapped); validation that all required CRM fields have a mapping before the user can proceed; .xlsx and CSV both supported
- Out: Saving the mapping as a reusable template (MAP-02); column value transformations (e.g., splitting "Full Name" into first/last); reordering columns

**Dependencies:** UPLOAD-02 (job ID + S3 key needed to read headers)
**Priority:** P1
**Size estimate:** M

---

### MAP-02: Save and load column mapping templates
**As a** CRM Admin or Power User,
**I want** to save a column mapping as a named template and reload it on future imports,
**so that** I don't have to re-map the same columns every time I run a recurring import (e.g., weekly Salesforce exports).

**Scope:**
- In: "Save as template" action on the mapping screen; user provides a template name; template stored per user (not shared between users in v1); "Load template" dropdown on the mapping screen that pre-fills the current mapping; templates are entity-type-specific (a contacts template won't appear for a deals import); template CRUD: save, load, rename, delete
- Out: Sharing templates between users; template versioning; auto-matching templates to incoming file headers based on column name similarity

**Dependencies:** MAP-01
**Priority:** P1 (confirmed required — stakeholder explicitly flagged this as a spec omission)
**Size estimate:** M

---

## Feature: Data Validation Engine

### VALID-01: Standard field validation — email, phone, required fields, and encoding
**As a** System,
**I want** to validate every row against standard field rules and parse the file safely regardless of encoding,
**so that** invalid or malformed data is identified before anything is written to the database.

**Scope:**
- In: Encoding detection using `charset-normalizer` (or `chardet`); BOM markers stripped before parsing; email format validation (RFC 5322 pattern); phone number validation — international formats accepted, unrecognizable strings flagged; required field presence check per entity type schema; .xlsx cell-type coercion to string before further validation (prevents silent type mismatch from Excel); per-row validation result stored with error code and human-readable description
- Out: Uniqueness checks (VALID-02); enum/custom field checks (VALID-03); date ambiguity (VALID-04) — separate passes

**Dependencies:** MAP-01; `ImportJob` record from UPLOAD-02
**Priority:** P1
**Size estimate:** L

---

### VALID-02: Uniqueness validation — intra-file dedup and DB check for contacts
**As a** System,
**I want** to identify duplicate emails within the file and against existing contact records,
**so that** no duplicate contacts are created in the CRM.

**Scope:**
- In: Intra-file dedup pass: when two rows share the same email, both are flagged as errors and neither is imported; both row numbers included in the error output; DB uniqueness check: batch queries against `contacts.email` in chunks of 1,000 rows (avoids query size limits); `contacts.email` DB index created as a required deliverable of this story; uniqueness check applies to contacts entity type only — companies and deals have no natural key check in v1
- Out: Company or deal uniqueness checks; phone number deduplication; fuzzy-match deduplication

**Dependencies:** VALID-01 (runs after standard validation pass on the full row set)
**Priority:** P1
**Size estimate:** M

---

### VALID-03: Custom field type and enum validation
**As a** System,
**I want** to validate custom field values against their configured types and allowed enum options,
**so that** imported data respects the CRM's custom field constraints.

**Scope:**
- In: Type validation for all custom field types (text, number, boolean, date, enum); enum fields: value must match one of the configured options (case-insensitive comparison); enum mismatch fails the row only — not the full import; error message includes field name, submitted value, and list of valid options
- Out: Creating or modifying enum options during import; fuzzy enum matching; per-field override of case sensitivity

**Dependencies:** VALID-01
**Priority:** P1
**Size estimate:** S

---

### VALID-04: Date field validation — flag ambiguous and inconsistent formats
**As a** System,
**I want** to flag date values that are ambiguous or unrecognizable as row-level validation errors rather than coercing them,
**so that** no silent month/day transposition or other date corruption occurs.

**Scope:**
- In: Date fields parsed strictly; ISO 8601 (YYYY-MM-DD) always accepted; any value that cannot be unambiguously parsed (e.g., `01/02/03`, `03-04-05`) is flagged as an error with a message explaining why (e.g., "Cannot determine month/day order — use YYYY-MM-DD"); clearly invalid values (e.g., `2024-13-01`, `not-a-date`) flagged with a different message; flagged rows participate in partial import (skipped if partial import is on)
- Out: Auto-coercion of any date format; user-specified format masks; per-column date format configuration

**Dependencies:** VALID-01
**Priority:** P1
**Size estimate:** S

---

## Feature: Preview Screen

### PREVIEW-01: Preview first 20 rows with per-row validation status and commit controls
**As a** CRM Admin or Power User,
**I want** to see the first 20 rows of my file with their validation status, a full-file error summary, and controls to commit or cancel,
**so that** I can make an informed decision about whether to proceed before any data is written.

**Scope:**
- In: Table showing first 20 rows with CRM-mapped column headers; each row has a status badge (valid / error); error rows show the error description inline; aggregate counts above the table: total rows, valid, invalid; "Partial import" checkbox defaulting to **on** (imports valid rows, skips invalid); "Commit Import" and "Cancel" actions; full-file validation must be complete before this screen renders — no lazy preview; sync imports (≤ 500 rows / 500KB) proceed immediately on commit; async imports dispatch a job and navigate to the progress view
- Out: Inline row editing; pagination beyond 20 rows on this screen; downloading the error report (that's ERROR-02)

**Dependencies:** VALID-01, VALID-02, VALID-03, VALID-04 all complete; MAP-01
**Priority:** P1
**Size estimate:** M

---

## Feature: Async Import Processing with Progress

### ASYNC-01: Sync/async routing and Celery task dispatch
**As a** System,
**I want** to route small imports synchronously and large imports through a Celery background task,
**so that** users get immediate results for small files and non-blocking processing for large ones.

**Scope:**
- In: Threshold check at commit time: ≤ 500 rows **and** ≤ 500KB → synchronous; either limit exceeded → Celery task dispatched, job ID returned immediately; Celery task is idempotent (safe to retry on failure); task calls `update_state` to record: `rows_processed`, `rows_total`, `rows_imported`, `rows_skipped`, `rows_failed`, `status`; ETR computed as rolling rows/sec average from task metadata; each inserted record tagged with `import_job_id` (foreign key) at write time; ImportJob record updated at task start, on progress ticks, and on completion/failure; partial import flag honored inside the task (skip invalid rows when on)
- Out: Progress polling UI (ASYNC-02); in-app completion notification (ASYNC-03)

**Dependencies:** PREVIEW-01 (commit action triggers this); all VALID stories complete
**Priority:** P1
**Size estimate:** L

---

### ASYNC-02: Progress tracking endpoint and polling UI
**As a** CRM Admin or Power User,
**I want** to see a progress bar with percentage complete and estimated time remaining while my import runs,
**so that** I know it's proceeding and can estimate when to check back.

**Scope:**
- In: `GET /imports/{job_id}/status` returns: `status`, `rows_processed`, `rows_total`, `rows_imported`, `rows_skipped`, `rows_failed`, `estimated_seconds_remaining`; frontend polls every 3 seconds while status is `pending` or `processing`; progress bar renders `rows_processed / rows_total` as percentage; polling stops when status is `complete` or `failed`; on completion, summary counts displayed inline
- Out: WebSockets or SSE; email notification on completion

**Dependencies:** ASYNC-01
**Priority:** P1
**Size estimate:** M

---

### ASYNC-03: In-app completion notification
**As a** CRM Admin or Power User,
**I want** to receive an in-app notification when my background import finishes,
**so that** I know the result even if I navigated away from the progress page.

**Scope:**
- In: On ImportJob reaching `complete` or `failed` status, create an in-app notification for the importing user; notification content: entity type, filename, rows imported / skipped / failed, link to the import history entry; notification appears in the app's notification tray (bell icon); if the user is still on the progress page, polling surfaces the result directly — notification is the fallback for navigation-away cases
- Out: Email notifications; push/SMS notifications; notifications to other users (e.g., an admin watching another user's import)

**Dependencies:** ASYNC-01
**Priority:** P2
**Size estimate:** S

---

## Feature: Error Reporting

### ERROR-01: Validation error summary grouped by error type
**As a** CRM Admin or Power User,
**I want** to see a breakdown of validation errors by type before I commit an import,
**so that** I can quickly assess my data quality and decide whether to fix the source file or proceed with partial import.

**Scope:**
- In: Error summary panel on the preview/commit screen (above the row table); counts grouped by error type, e.g.: "Invalid email format: 142 rows", "Missing required field 'Name': 23 rows", "Duplicate email (intra-file): 6 rows", "Enum mismatch on 'Status': 11 rows", "Ambiguous date in 'Close Date': 4 rows"; counts reflect the full file, not just the preview rows
- Out: Per-row error detail in this panel (that's the row table in PREVIEW-01); downloadable report (ERROR-02)

**Dependencies:** VALID-01, VALID-02, VALID-03, VALID-04
**Priority:** P2
**Size estimate:** S

---

### ERROR-02: Downloadable error report CSV
**As a** CRM Admin or Power User,
**I want** to download a CSV listing every row that failed validation with its row number and error details,
**so that** I can fix the source data and re-run a clean import.

**Scope:**
- In: Download link available on the preview/commit screen and on the import history detail page; error report columns: `row_number`, all mapped source columns (original values), `error_codes` (comma-separated), `error_descriptions` (human-readable); for intra-file duplicates: both row numbers appear as separate rows in the error report; report generated during the validation job and stored on S3; download served via a signed S3 URL with short expiry
- Out: Auto-fix suggestions; in-browser row editing; error report for successfully imported rows

**Dependencies:** VALID-01, VALID-02, VALID-03, VALID-04; UPLOAD-02 (S3 access)
**Priority:** P2
**Size estimate:** S

---

## Feature: Import History

### HIST-01: Import history list with date-range filter
**As a** CRM Admin or Power User,
**I want** to view a reverse-chronological list of past imports with key metrics and a date-range filter,
**so that** I can audit past imports, review outcomes, and access error reports.

**Scope:**
- In: List of up to 100 most recent imports (subject to role-based visibility from HIST-02); columns: date/time, filename, entity type, status (`complete` / `failed` / `processing` / `undone`), total rows, imported, skipped, failed; date-range filter: last 7 days / last 30 days / all time; each row links to an import detail page (which includes error report download link if applicable); history retained indefinitely — no expiry policy
- Out: Full-text search; export of the history list itself; deleting history entries

**Dependencies:** ASYNC-01 (ImportJob record is the data source); UPLOAD-02
**Priority:** P2
**Size estimate:** M

---

### HIST-02: Role-based import history visibility
**As a** System,
**I want** to enforce role-based visibility so Power Users see only their own imports while CRM Admins see everyone's,
**so that** users have appropriate access without exposing other users' data unnecessarily.

**Scope:**
- In: Power User history list filtered to `uploader = current_user`; CRM Admin history list shows all users' imports with an additional "Uploaded by" column (name + email); Read Only users: no access to import history — no UI entry point, API returns 403; authorization enforced at the API layer (not just UI hiding)
- Out: Admins filtering history by a specific user; reassigning import ownership between users

**Dependencies:** HIST-01
**Priority:** P2
**Size estimate:** S

---

## Feature: Undo Import

### UNDO-01: Soft-delete undo with 48-hour window
**As a** CRM Admin,
**I want** to reverse an import within 48 hours by soft-deleting all the records it created,
**so that** I can recover from a mistaken import without permanently destroying data.

**Scope:**
- In: "Undo" action on import history entries where: status is `complete`, import completed less than 48 hours ago, current user is CRM Admin; undo marks all records tagged with `import_job_id` as soft-deleted (hidden from normal queries, retained in DB); undo uses stored record IDs — the original S3 file is not required; on completion, ImportJob status changes to `undone`; 48-hour window enforced server-side (client UI also hides the button, but server rejects out-of-window requests)
- Out: Undo by Power Users; selective undo of individual records; restoring previously undone records; undo of partial imports where only some rows were imported (undo is all-or-nothing for the rows that were imported)

**Dependencies:** ASYNC-01 (each imported record tagged with `import_job_id` at write time); HIST-01
**Priority:** P2
**Size estimate:** M

---

### UNDO-02: Undo confirmation screen with modified-record count
**As a** CRM Admin,
**I want** to see how many imported records were subsequently edited before I confirm an undo,
**so that** I can make an informed decision knowing that modified records will be skipped rather than reverted.

**Scope:**
- In: Confirmation modal shown before undo executes; modal displays: total records from the import, count of records modified after import (will be skipped — `updated_at > import_job.completed_at`), count of records that will be soft-deleted; "Confirm Undo" and "Cancel" actions; skipped (modified) records remain live in the CRM after undo
- Out: Listing which specific records were modified; allowing the admin to selectively include or exclude modified records from the undo

**Dependencies:** UNDO-01
**Priority:** P2
**Size estimate:** S

---

### UNDO-03: Async undo processing for large imports
**As a** CRM Admin,
**I want** large undo operations to run as background Celery tasks with a progress bar,
**so that** the UI doesn't time out when reversing an import with 100k+ records.

**Scope:**
- In: If the import has more than 500 rows, undo dispatched as a Celery task (same threshold as import processing); `GET /imports/{job_id}/undo-status` polling endpoint, same structure as ASYNC-02's status endpoint; frontend polls every 3 seconds; progress bar shows records soft-deleted vs. total; ImportJob status shows `undoing` during processing, `undone` on completion; ETR uses rolling rows/sec average (same approach as ASYNC-02)
- Out: In-app notification on undo completion (out of scope v1); sync path for undo of small imports (below threshold, undo is synchronous — no separate story needed)

**Dependencies:** UNDO-01, UNDO-02; ASYNC-01 (Celery task pattern established)
**Priority:** P2
**Size estimate:** M

---

## Dependency Map

```
UPLOAD-01 → UPLOAD-02 → MAP-01 → MAP-02
                          ↓
                       VALID-01 → VALID-02
                                → VALID-03
                                → VALID-04
                          ↓ (all four complete)
                       PREVIEW-01 → ASYNC-01 → ASYNC-02
                                             → ASYNC-03
                       ERROR-01 (from validation results)
                       ERROR-02 (from validation results + S3)
                       ASYNC-01 → HIST-01 → HIST-02
                       ASYNC-01 + HIST-01 → UNDO-01 → UNDO-02 → UNDO-03
```

---

## Suggested Implementation Order

1. **UPLOAD-01** — foundational entry point; nothing else starts without file upload
2. **UPLOAD-02** — job initialization gates all downstream processing
3. **MAP-01** — column mapping required before validation can run
4. **VALID-01** — core validation engine; VALID-02/03/04 extend it
5. **VALID-02** — uniqueness checks; delivers the required `contacts.email` DB index
6. **VALID-03** — enum/custom field validation; parallelizable with VALID-02
7. **VALID-04** — date validation; parallelizable with VALID-02 and VALID-03
8. **PREVIEW-01** — first user-visible result of validation; gates the commit flow
9. **ASYNC-01** — commit triggers processing; defines the sync/async split
10. **ASYNC-02** — progress UI; needed immediately once async processing exists
11. **ERROR-01** — error summary on the preview screen; relatively small lift at this point
12. **ERROR-02** — error report download; extends ERROR-01 with S3 artifact
13. **HIST-01** — import history; requires ImportJob to be populated by ASYNC-01
14. **HIST-02** — role visibility on history; small addition on top of HIST-01
15. **MAP-02** — mapping templates; P1 but not on the critical path for the core pipeline
16. **ASYNC-03** — in-app notification; decoupled from the core flow
17. **UNDO-01** — undo core; depends on record tagging from ASYNC-01
18. **UNDO-02** — undo confirmation screen; adds safety gate on top of UNDO-01
19. **UNDO-03** — async undo; extends UNDO-01 for large datasets

---

## Potential Additions (not in scope, not silently included)

- **Notification on undo completion** — Courier integration deferred (same rationale as import completion email)
- **Column mapping template sharing** — user-owned only in v1; team-shared templates are a natural v2 addition
- **Company/deal uniqueness checks** — deferred by stakeholder; domain-based fuzzy match for companies is a future story
- **Import scheduling** — recurring imports on a cron (e.g., daily Salesforce sync) not mentioned; would build on MAP-02 templates
- **Restore after undo** — soft-deleted records are retained in DB but no restore UI exists; flagged as a gap

---

## Coverage Check

| Feature from Analysis | Stories | Status |
|---|---|---|
| File Upload | UPLOAD-01, UPLOAD-02 | Covered |
| Column Mapping UI | MAP-01, MAP-02 | Covered (MAP-02 upgraded to P1 per stakeholder) |
| Data Validation Engine | VALID-01, VALID-02, VALID-03, VALID-04 | Covered — encoding/BOM folded into VALID-01; date handling in VALID-04; international phone in VALID-01 |
| Preview Screen | PREVIEW-01 | Covered |
| Async Import Processing with Progress | ASYNC-01, ASYNC-02, ASYNC-03 | Covered |
| Error Reporting | ERROR-01, ERROR-02 | Covered |
| Import History | HIST-01, HIST-02 | Covered — history scope corrected to 100 entries + date filter per stakeholder |
| Undo Import | UNDO-01, UNDO-02, UNDO-03 | Covered — modified-record skip behavior per stakeholder answer; async undo per technical note |
| Edge case: Encoding / BOM | — | Folded into VALID-01 (in scope) |
| Edge case: Date format handling | — | Covered by VALID-04 (resolved: flag as errors, no auto-coerce) |
| Edge case: International phone | — | Folded into VALID-01 (flag unrecognizable strings) |
