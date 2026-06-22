# Input Analysis

## Summary
The CRM application requires a bulk data import pipeline supporting CSV and Excel files up to 50MB, with schema-mapped validation, async processing for large files, and reversible imports. The feature targets enterprise customers migrating large contact/company/deal datasets from other CRMs.

---

## Identified Features

1. **File Upload**
   - Key capabilities: CSV + .xlsx support, drag-and-drop UI, 50MB limit, direct-to-S3 presigned URL upload
   - User roles involved: CRM Admin, Power User

2. **Column Mapping UI**
   - Key capabilities: Map CSV headers to CRM fields (standard + custom), persist mapping templates, handle unmapped columns
   - User roles involved: CRM Admin, Power User

3. **Data Validation Engine**
   - Key capabilities: Email format, phone format, required fields, uniqueness (intra-file + against existing records), custom field type/enum validation, encoding detection
   - User roles involved: System (automated)

4. **Preview Screen**
   - Key capabilities: First 20 rows rendered with per-row validation status, indicator of total errors before committing
   - User roles involved: CRM Admin, Power User

5. **Async Import Processing with Progress**
   - Key capabilities: Celery task, percentage progress, estimated time remaining, background processing for large files
   - User roles involved: CRM Admin, Power User

6. **Error Reporting**
   - Key capabilities: Error summary by type, downloadable error CSV with row numbers and descriptions, partial import toggle
   - User roles involved: CRM Admin, Power User

7. **Import History**
   - Key capabilities: List of past imports with date, filename, row counts (total/imported/skipped/failed)
   - User roles involved: CRM Admin, Power User

8. **Undo Import**
   - Key capabilities: Soft-delete all records from an import, 48-hour window enforced
   - User roles involved: CRM Admin

---

## User Roles / Personas

| Role | Description | Key Needs |
|------|-------------|-----------|
| CRM Admin | Manages data, migrations, user access | Reliable bulk import, undo safety net, audit history |
| Power User | Heavy daily user, may run imports but not manage system | Clear error feedback, partial import option, minimal friction |
| Enterprise Migrator | One-time or infrequent large-scale data migrator | 100k+ row support, encoding flexibility, column mapping templates |
| System/Backend | Celery workers, Django ORM | Idempotency, file cleanup, job status tracking |

---

## Ambiguities & Missing Context

1. **Threshold for async processing** — At what row count or file size does processing switch from synchronous to async? Affects UX (spinner vs. background job + polling). — *Suggested default: files > 1,000 rows or > 1MB go async.*

2. **Column mapping persistence** — Can users save a mapping template for repeated imports? Input mentions UI but not reuse. — *Suggested default: no template persistence in v1.*

3. **Uniqueness check scope** — "No duplicate emails within an import or against existing records" — does this apply to companies and deals too, or only contacts? — *Needs clarification; email is the natural key for contacts, but deals/companies may differ.*

4. **Partial import UX flow** — Is "partial import" opt-in per import run, or always-on? Who decides: a setting, a checkbox at commit time? — *Suggested default: opt-in checkbox on the preview/commit screen.*

5. **Undo mechanism internals** — Soft-delete means records are hidden but retained in DB? Or truly deleted after 48h? What happens to records modified after import (e.g., user edited an imported contact)? — *Significant data integrity risk if not specified.*

6. **Progress bar delivery mechanism** — Does the frontend poll a status endpoint, or use WebSockets/SSE? Django + Celery implies polling is simpler, but real-time UX favors SSE. — *Suggested default: polling with 3s interval.*

7. **Import entity types in one file** — Can one CSV contain mixed types (contacts + companies), or is each import scoped to one entity type? — *Suggested default: one entity type per import run.*

8. **File retention policy** — How long are uploaded CSVs retained in S3? Does undo require the original file? — *Affects storage costs and compliance; no policy stated.*

9. **Custom field enum mismatch behavior** — "must match existing options or fail" — fail the row or fail the entire import? — *Suggested default: fail the row (consistent with partial import model).*

10. **Estimated time remaining algorithm** — Is ETR based on rows/sec throughput, fixed heuristics, or ML? Undefined. — *Suggested default: rolling rows/sec average.*

11. **Authentication and authorization** — Which roles can run imports? Can a non-admin user trigger an undo? — *Not stated; likely admin-only for undo.*

12. **Import history retention** — How long is history kept? Is there a pagination or search requirement on the history list? — *Not specified.*

13. **Date format handling** — "Inconsistent date formats across rows" is called out as an edge case. What is the expected behavior — auto-detect per cell, reject inconsistent formats, or let the user specify a format? — *High risk of silent data corruption if auto-detected incorrectly.*

14. **Notification on async completion** — When a background import finishes, is the user notified (email, in-app, both, none)? — *Not mentioned.*

15. **Duplicate handling within an import** — If two rows in the same CSV have the same email, which row wins, or are both flagged as errors?

---

## Gap Analysis

| # | Input Gap | What Was Unclear | Resolution | Impact on Stories |
|---|-----------|-----------------|------------|-------------------|
| G-1 | "For large files, process asynchronously" | Threshold for async vs sync is undefined | **Deferred:** needs product decision (suggested: >1,000 rows or >1MB) | Import Processing story: branch logic depends on this threshold |
| G-2 | Column mapping UI | No mention of saving/reusing mappings | **Assumed:** no template persistence in v1 | Column Mapping story scoped to single-use mapping only |
| G-3 | "No duplicate emails within an import or against existing records" | Uniqueness scope: contacts only, or also companies/deals? | **Deferred:** needs stakeholder clarification | Validation Engine story: determines query scope and uniqueness constraint logic |
| G-4 | "Partial import option" | Whether partial import is always-on or an opt-in per run | **Assumed:** opt-in checkbox on the commit screen | Preview/Commit story: UI layout and import flow branching |
| G-5 | "Undo import: ability to reverse an import within 48 hours" | Behavior when an imported record was subsequently edited; DB retention vs. true delete after 48h | **Deferred:** high data integrity risk — needs explicit policy | Undo story: soft-delete logic, what "undo" means for mutated records |
| G-6 | Async progress bar | Delivery mechanism (polling vs. WebSocket/SSE) not specified | **Assumed:** HTTP polling every 3s (simpler with Django+Celery stack) | Progress Tracking story: frontend polling loop vs. SSE consumer |
| G-7 | Multiple entity types (contacts, companies, deals) | Whether a single CSV can contain mixed entity types | **Assumed:** one entity type per import run; entity type selected at upload step | All stories: scoping assumption affects schema, validation, and mapping UI |
| G-8 | File retention on S3 | No retention policy stated; unclear if original file needed for undo | **Deferred:** compliance/storage decision needed | File Upload story: S3 lifecycle rule; Undo story: may need original file reference |
| G-9 | "Custom fields with dropdown/enum values — imports need to match existing options or fail" | "Fail" = fail the row or fail the entire import? | **Assumed:** fail the row (consistent with partial import model) | Validation Engine story: error classification and partial import interplay |
| G-10 | Estimated time remaining | Algorithm undefined (rows/sec, fixed heuristics, ML?) | **Assumed:** rolling rows/sec average from Celery task metadata | Progress Tracking story: ETR calculation in Celery task |
| G-11 | Roles and permissions for import/undo | Which user roles can trigger imports or undo? | **Deferred:** authorization model not defined in input | All stories: permission guards on API endpoints and UI |
| G-12 | Import history retention and UX | No retention window, no pagination, no search mentioned | **Assumed:** show last 50 imports, no search in v1; no explicit retention policy | Import History story: list endpoint, pagination default |
| G-13 | Inconsistent date formats across rows | Auto-detect per cell vs. user-specified format vs. reject on inconsistency | **Deferred:** silent corruption risk if auto-detect is wrong; needs UX decision | Validation Engine story + Preview story: error reporting for date fields |
| G-14 | Async completion notification | No mention of user notification (email, in-app, etc.) when background job completes | **Assumed:** in-app status update only (polling surfaces result); no email in v1 | Progress Tracking story: no notification service integration required in v1 |
| G-15 | Intra-file duplicate handling | Two rows in same CSV with same email — which wins, or are both errors? | **Assumed:** both rows flagged as errors; neither imported | Validation Engine story: de-dup pass before uniqueness check against DB |

**Unresolved gaps:** 6 (G-1, G-3, G-5, G-8, G-11, G-13) — these MUST appear in the Clarifier's questions
**Resolved by assumption:** 9 (G-2, G-4, G-6, G-7, G-9, G-10, G-12, G-14, G-15) — these MUST be validated by stakeholder before sprint commit

---

## Technical Considerations

- **Presigned URL upload bypass:** Files go direct to S3 (current 10MB API limit is irrelevant for uploads), but the backend must receive a completion callback (S3 event or client-side notification) to trigger the Celery processing task. A webhook or client-posted confirmation endpoint is required.
- **Uniqueness at scale:** Checking new emails against 2M existing contacts will require a database index on `contacts.email`. Bulk set-membership queries (e.g., `WHERE email IN (...)`) need batching to avoid query size limits — recommend batches of 1,000 rows.
- **Celery task design:** Task must be idempotent (retries safe), support progress reporting (Celery `update_state`), and handle partial commits transactionally. Consider a per-import staging table or batch insert with savepoints.
- **Encoding detection:** Libraries like `chardet` or `charset-normalizer` can detect encoding automatically, but confidence is not 100%. BOM markers should be stripped before detection. UTF-8 with BOM (`\xef\xbb\xbf`) is a common gotcha.
- **Excel (.xlsx) support:** Requires a library like `openpyxl`. Cell types in Excel (dates, numbers) differ from CSV strings — type coercion must be explicit to avoid silent data corruption.
- **Undo at scale:** If 100k records are soft-deleted, the undo operation itself is a long-running task. It should also be async with progress tracking.
- **S3 lifecycle:** Uploaded files should have a lifecycle rule to auto-delete after a defined retention period (e.g., 30 days post-import), especially if they may contain PII.
- **Preview rendering:** Preview shows first 20 rows, but validation must run on the full file before the user can commit. This means full validation is a prerequisite for the preview screen — not a lazy preview.

---

## Suggested Feature Decomposition

**Priority 1 — Core upload and validation pipeline (MVP)**
1. File Upload (S3 presigned URL, completion callback, entity type selection)
2. Column Mapping UI (manual mapping, no templates)
3. Validation Engine (email, phone, required, uniqueness, enum, encoding, intra-file dedup)
4. Preview Screen (first 20 rows, per-row status, total error count, commit/cancel)

**Priority 2 — Async processing and error UX**
5. Async Import Processing (Celery task, progress tracking, polling endpoint)
6. Error Reporting (summary by type, downloadable error CSV)
7. Partial Import option (opt-in at commit screen)

**Priority 3 — History, undo, and resilience**
8. Import History (list with row counts, entity type, status)
9. Undo Import (soft-delete, 48h window, async for large sets)

**Priority 4 — Edge case hardening**
10. Encoding detection and BOM handling
11. Date format handling (decision-dependent — deferred gap G-13)
12. International phone number normalization
