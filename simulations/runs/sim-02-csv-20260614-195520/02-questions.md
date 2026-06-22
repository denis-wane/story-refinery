# Clarifying Questions

## Critical (must answer before proceeding)

1. **Custom field validation and dropdown matching**
   When a CSV contains custom field data (e.g., "Lead Source" with value "Trade Show"), how should the system handle mismatches with existing dropdown options? Should it create new options, reject the row, or map to a default?
   - _Why it matters:_ Determines validation engine complexity and data integrity approach
   - _Default assumption if unanswered:_ Strict matching required - invalid dropdown values will cause row rejection with error message

2. **Duplicate detection performance strategy**
   With 2M existing records, how should duplicate email checking be performed without causing timeouts? Should it use database indexes, batch processing, or a different approach?
   - _Why it matters:_ Critical for system performance and user experience during large imports
   - _Default assumption if unanswered:_ Use optimized database queries with email indexing, check duplicates in batches of 1000 rows

3. **Partial import relationship handling**
   When importing "valid rows only" and some company records fail while their related contacts pass validation, should the orphaned contacts be imported, rejected, or linked to a default company?
   - _Why it matters:_ Affects data integrity and import processing logic design
   - _Default assumption if unanswered:_ Reject dependent records when their parent records fail (maintain referential integrity)

4. **Undo scope for related records**
   If records are created or modified after an import (e.g., someone edits a contact imported yesterday), should the undo function skip those records, revert them to their post-import state, or block the entire undo?
   - _Why it matters:_ Determines undo feature complexity and data safety mechanisms
   - _Default assumption if unanswered:_ Undo only affects unmodified imported records, leave modified records unchanged with warning message

5. **Import permission model**
   Which users can import which data types? Can regular users import deals/companies or only their own contacts? Are there approval workflows for large imports?
   - _Why it matters:_ Affects UI design, validation logic, and security architecture
   - _Default assumption if unanswered:_ Role-based permissions - regular users can import contacts only, admins can import all data types, no approval workflows

## Important (strongly recommended)

1. **File retention and cleanup policy**
   How long should uploaded files remain in S3? Who can access them after import completion? Are there compliance requirements for data retention?
   - _Why it matters:_ Affects storage costs, security design, and operational procedures
   - _Default assumption if unanswered:_ Keep files for 30 days, accessible only to file uploader and admins, automatic cleanup

2. **Async processing failure recovery**
   When a Celery task fails mid-processing (server restart, memory issues), should users be able to resume from where it stopped or restart completely?
   - _Why it matters:_ Affects system reliability and user experience for large imports
   - _Default assumption if unanswered:_ Task restart required on failure, with retry logic for transient errors (3 attempts)

3. **Date format ambiguity resolution**
   When encountering dates like "01/02/2024", how should the system determine if it's January 2nd or February 1st? User preference, column analysis, or configuration setting?
   - _Why it matters:_ Affects data accuracy and validation feedback quality
   - _Default assumption if unanswered:_ Use MM/DD/YYYY as default, provide format detection hints in UI

4. **International phone number validation scope**
   Which countries/regions should be supported for phone validation? Should it auto-detect country codes or require users to specify the default country?
   - _Why it matters:_ Affects validation library selection and configuration complexity
   - _Default assumption if unanswered:_ Support major international formats with US/Canada default, configurable by admin

5. **Encoding detection fallback behavior**
   When file encoding cannot be automatically detected, should the system prompt the user to specify encoding, try common encodings, or fail the upload?
   - _Why it matters:_ Affects file processing reliability and user experience
   - _Default assumption if unanswered:_ Auto-try UTF-8, Latin-1, Windows-1252 in sequence, prompt user if all fail

## Nice to Have (will use reasonable defaults)

1. **File size limit enforcement location**
   Should the 50MB limit be enforced in the browser before upload starts, or on the server after upload completes?
   - _Default assumption:_ Client-side validation with server-side verification as backup

2. **Concurrent import limitations**
   How many imports can run simultaneously per user or across the system to prevent resource exhaustion?
   - _Default assumption:_ 1 import per user, 5 system-wide maximum

3. **Progress tracking granularity**
   How frequently should progress updates be sent? Every 100 rows, every 5 seconds, or based on percentage thresholds?
   - _Default assumption:_ Update every 1000 rows processed or every 10 seconds, whichever comes first

4. **Error recovery workflow preferences**
   After users fix data issues in their source file, should they be able to re-upload only failed rows or must they upload the entire corrected file?
   - _Default assumption:_ Full file re-upload required for simplicity

5. **Preview row selection method**
   Should the preview show the first 20 rows, a random sample, or rows with validation issues?
   - _Default assumption:_ First 20 rows for consistency and predictability

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **Role-based import history access** — Regular users see only their own imports, administrators see all imports
2. **UTF-8 encoding preference** — When encoding detection fails, UTF-8 is tried first before other common encodings
3. **Strict email uniqueness** — Duplicate emails are rejected both within the import file and against existing database records
4. **Soft-delete undo mechanism** — Undo functionality marks records as deleted rather than physically removing them
5. **S3 direct upload approach** — Files bypass the application server and upload directly to S3 using presigned URLs
6. **Celery-based async processing** — Large file processing uses the existing Celery infrastructure for background tasks
