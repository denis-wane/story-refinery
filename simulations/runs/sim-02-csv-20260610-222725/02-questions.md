# Clarifying Questions

## Critical (must answer before proceeding)

1. **Duplicate Email Handling Against Existing Records**
   When an imported contact has an email that already exists in the CRM's 2M existing records, what should happen?
   - _Why it matters:_ This determines whether validation is just within the import file vs. against the entire database, affecting performance, user workflow, and data integrity requirements.
   - _Default assumption if unanswered:_ Duplicates against existing records will be flagged as validation errors and skipped during import.

2. **Custom Field Enum Value Mismatch Behavior**
   When an imported value doesn't match existing dropdown options for custom fields, should the system reject the row, auto-create the new option, or prompt for manual mapping?
   - _Why it matters:_ Auto-creation could pollute dropdown lists; rejection could block valid imports; manual mapping adds UX complexity.
   - _Default assumption if unanswered:_ Invalid enum values will cause row validation failure and be included in error reports.

3. **Undo Operation Granularity**
   Does "undo import" reverse the entire import as one operation, or can users selectively undo individual records from an import?
   - _Why it matters:_ Selective undo requires complex tracking and UI; full-import undo is simpler but less flexible for large imports with mixed success.
   - _Default assumption if unanswered:_ Undo will reverse the entire import atomically—all records from that import session are soft-deleted together.

4. **Import Permission Model**
   Who can perform imports, view import history, and execute undo operations? Are these tied to existing CRM roles or need new permissions?
   - _Why it matters:_ Determines access control requirements, audit trails, and whether admin oversight is needed for sensitive operations.
   - _Default assumption if unanswered:_ Any CRM user can import data they have write access to; only admins can view all import history and undo any import.

5. **Async Processing Failure Recovery**
   When a large file import fails mid-processing (database connection loss, server restart), should partial results be preserved, rolled back, or retryable from the failure point?
   - _Why it matters:_ Affects data consistency guarantees and user experience for enterprise customers with large datasets.
   - _Default assumption if unanswered:_ Failed imports will be fully rolled back; users must restart the entire import process.

## Important (strongly recommended)

1. **Concurrent Import Limitations**
   Can multiple users run imports simultaneously, or should there be per-user or system-wide limits to prevent database contention?
   - _Why it matters:_ Affects system performance design and user expectations for enterprise environments.
   - _Default assumption if unanswered:_ Allow concurrent imports with database-level optimization; no artificial user limits.

2. **Error Report Delivery Method**
   How do users access the error CSV reports—immediate browser download, email delivery, or temporary S3 link with expiration?
   - _Why it matters:_ Affects file storage costs, user workflow, and technical implementation for async imports.
   - _Default assumption if unanswered:_ Error reports will be downloadable from the import history page for 7 days, then auto-deleted.

3. **Data Transformation Scope**
   Should the system only validate data as-is, or can it perform normalization (trim whitespace, format phone numbers, standardize case)?
   - _Why it matters:_ Determines validation complexity and user expectations for data cleanup.
   - _Default assumption if unanswered:_ System will perform basic normalization (trim whitespace, standard case) but won't reformat phone numbers or other complex transformations.

## Nice to Have (will use reasonable defaults)

1. **Progress Estimation Accuracy**
   For the async progress bar, should estimated time remaining be based on rows processed per second, file size, or historical averages?
   - _Why it matters:_ User experience quality for long-running imports.
   - _Default assumption if unanswered:_ Use rows-per-second calculation with 5-second update intervals.

2. **File Encoding Detection Priority**
   When multiple encoding interpretations are possible, should the system default to UTF-8, use confidence scoring, or prompt the user?
   - _Why it matters:_ Affects handling edge cases with ambiguous character encoding.
   - _Default assumption if unanswered:_ Auto-detect with UTF-8 preference; show encoding options if detection confidence is low.

## Assumptions Being Made

_These are interpretations the analysis has already made. Flag any that are wrong._

1. **48-hour undo window is fixed** — Analysis assumes this timeframe is set in stone rather than configurable by admin
2. **Preview limited to first 20 rows** — System won't offer pagination or different sample sizes for preview
3. **Partial imports are always user-choice** — System won't automatically import valid rows by default
4. **Column mapping is required** — Users must explicitly map every column rather than having auto-mapping by column name
5. **Single entity type per import** — Each import handles only contacts, companies, OR deals, not mixed entity types
