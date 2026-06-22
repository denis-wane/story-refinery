# Clarifying Questions

## Critical (must answer before proceeding)

1. **Import Permissions and Role Access**
   Who can perform bulk imports in your CRM? Should this be limited to specific user roles (admins only), or should regular users be able to import data with potential approval workflows?
   - _Why it matters:_ Determines authentication requirements, UI placement, and whether we need approval/review workflows before imports execute.
   - _Default assumption if unanswered:_ Admin-level permissions required, accessible via admin dashboard only.

2. **Concurrent Import Processing Limits**
   How many bulk imports should the system allow to run simultaneously? Should there be per-user limits or organization-wide limits?
   - _Why it matters:_ Affects Celery queue design, database connection pooling, and memory allocation. Critical for preventing system overload during multiple large imports.
   - _Default assumption if unanswered:_ Maximum 2 concurrent imports per organization, 1 per user, with queueing for additional requests.

3. **Import Transaction Behavior vs Partial Imports**
   You've requested both "partial import option" (import valid rows, skip invalid) and mentioned atomicity concerns. Should imports be all-or-nothing transactions, or should they support committing valid rows even when some rows fail?
   - _Why it matters:_ These approaches are mutually exclusive and affect database design, error handling, and rollback complexity.
   - _Default assumption if unanswered:_ Support partial imports with batched commits every 1000 rows, allowing recovery from mid-import failures.

4. **Async Import Completion Notifications**
   How should users be notified when their large async imports finish? Email, in-app notifications, or should they need to manually check the progress page?
   - _Why it matters:_ Determines integration requirements with email service and real-time notification infrastructure.
   - _Default assumption if unanswered:_ In-app notification only (user must return to the import page to see completion status).

5. **Custom Field Dropdown Validation Rules**
   For custom fields with predefined dropdown values, how should the system handle case mismatches ("Sales" vs "sales") and partial matches? Should these fail validation or attempt fuzzy matching?
   - _Why it matters:_ Affects validation complexity and user frustration during imports. Could cause large imports to fail on minor formatting differences.
   - _Default assumption if unanswered:_ Exact case-sensitive matching required, with clear error messages suggesting available options.

## Important (strongly recommended)

1. **Undo Impact on Related Records**
   When undoing an import within the 48-hour window, what should happen to records that reference the imported data? For example, if imported contacts are assigned to deals created after the import, should the undo operation fail or orphan those deals?
   - _Why it matters:_ Affects referential integrity design and undo complexity. Could prevent undo operations from working in active systems.
   - _Default assumption if unanswered:_ Undo fails if imported records have been referenced by other records created after the import.

2. **File Retention and Storage Policy**
   How long should uploaded CSV files and error report files be retained in S3? Should they be automatically deleted after undo window expires?
   - _Why it matters:_ Affects storage costs and compliance requirements. 50MB files × many customers × retention period could be expensive.
   - _Default assumption if unanswered:_ Keep files for 30 days after import, then auto-delete to manage storage costs.

3. **Processing Performance Expectations**
   What are acceptable processing times for different file sizes? Are there SLA requirements (e.g., "files under 10k rows should complete within 5 minutes")?
   - _Why it matters:_ Affects infrastructure sizing, caching strategies, and database optimization priorities.
   - _Default assumption if unanswered:_ Target 1000 rows per minute processing speed, with progress updates every 10 seconds.

4. **Validation Error Priority and Display**
   When a single field has multiple validation failures (e.g., email format is invalid AND it's a duplicate), which error should be shown to the user? Should all errors be listed or just the first one encountered?
   - _Why it matters:_ Affects user experience when fixing import files. Could require multiple fix-and-retry cycles if only one error shown per field.
   - _Default assumption if unanswered:_ Show the first validation error encountered per field, prioritizing format errors over business rule errors.

## Nice to Have (will use reasonable defaults)

1. **Import Scheduling Capability**
   Should the system support scheduling large imports for off-peak hours, or will all imports run immediately when submitted?
   - _Why it matters:_ Could reduce system load during business hours and improve performance for other users.
   - _Default assumption if unanswered:_ All imports run immediately when submitted.

2. **Detailed Error Reporting Preferences**
   In error report CSVs, do you want technical validation details ("regex pattern ABC failed") or user-friendly messages ("invalid email format")?
   - _Why it matters:_ Affects error message design and user ability to fix issues independently.
   - _Default assumption if unanswered:_ User-friendly error messages with examples of correct formats.

## Assumptions Being Made

_These are interpretations the analysis has already made. Flag any that are wrong._

1. **Enterprise focus** — Analysis assumes this is primarily for large data migrations rather than ongoing small imports — Based on "100k+ rows common for enterprise customers"
2. **Single file type per import** — Analysis assumes each import contains only one data type (contacts OR companies OR deals, not mixed) — Based on separate mention of each type
3. **Standard CRM field mapping** — Analysis assumes familiar CRM fields (name, email, phone, company) rather than completely custom schemas — Based on field examples provided
4. **48-hour undo window is acceptable** — Analysis assumes this timeframe balances data safety with system performance — Based on stated requirement without questioning duration
5. **Direct S3 upload pattern** — Analysis assumes continuing current architecture rather than exploring alternative upload methods — Based on technical context about presigned URLs
