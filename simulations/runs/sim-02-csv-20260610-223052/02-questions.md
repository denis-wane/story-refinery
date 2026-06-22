# Clarifying Questions

## Critical (must answer before proceeding)

1. **User Permission Model**
   Who can perform import operations (upload, map, execute, undo) and view import history? Should there be role-based restrictions or can any authenticated user import data?
   - _Why it matters:_ Determines security architecture and access control implementation throughout the import pipeline
   - _Default assumption if unanswered:_ Any CRM user can import and view their own imports; only CRM Administrators can undo imports or view system-wide import history

2. **Relationship Handling During Import**
   When importing contacts with company associations, how should the system handle relationships? Should it auto-create missing companies, require companies to exist first, or skip relationship fields entirely?
   - _Why it matters:_ Affects data integrity, import complexity, and validation logic for interconnected records
   - _Default assumption if unanswered:_ Relationship fields are optional; system will link to existing records by exact name match but won't create new ones

3. **Concurrent Import Behavior**
   Can a single user run multiple imports simultaneously? What happens if two users import files that would create the same records (e.g., duplicate email addresses)?
   - _Why it matters:_ Determines queue management, database locking strategy, and user experience design
   - _Default assumption if unanswered:_ One import per user at a time; subsequent uploads queue automatically; duplicate detection runs across all concurrent imports

4. **Undo Operation Scope**
   When undoing an import, what happens to relationships that were created afterward? For example, if Import A creates Contact X, then a user manually associates Contact X with Deal Y, then Import A is undone—what happens to Deal Y's association?
   - _Why it matters:_ Defines data dependency tracking and rollback complexity; incorrect handling could break existing business data
   - _Default assumption if unanswered:_ Undo only removes the imported records; manually created relationships afterward are preserved but may become orphaned

5. **Custom Field Validation Strictness**
   For custom dropdown/enum fields during import, should the system reject values not in the predefined list, auto-add new values to the dropdown, or allow import with a flag for admin review?
   - _Why it matters:_ Affects data governance, validation logic, and determines if imports can modify system configuration
   - _Default assumption if unanswered:_ Strict validation—reject any values not matching existing dropdown options exactly (case-sensitive)

## Important (strongly recommended)

1. **Performance Expectations**
   What are acceptable processing times for different file sizes? Should users be warned about estimated processing time before starting large imports?
   - _Why it matters:_ Determines infrastructure requirements and sets user expectations for enterprise-scale imports
   - _Default assumption if unanswered:_ Target <30 seconds for 10K rows, <5 minutes for 100K rows; show time estimates for files >25K rows

2. **Import Completion Notifications**
   How should users be notified when async imports complete or fail? Email, in-app notifications, both, or just require manual checking?
   - _Why it matters:_ Affects user workflow and system integration requirements
   - _Default assumption if unanswered:_ Email notification for completion/failure plus persistent in-app status indicator

3. **Data Transformation Capabilities**
   Should the system automatically format/standardize data during import (e.g., phone number formatting, name capitalization, date standardization) or import exactly as provided?
   - _Why it matters:_ Affects validation complexity, data quality, and potential data modification concerns
   - _Default assumption if unanswered:_ Import data exactly as provided; no automatic transformations beyond basic format validation

4. **Partial Import Decision Point**
   When validation errors occur, should the system automatically proceed with partial import of valid rows, require explicit user confirmation, or block the entire import?
   - _Why it matters:_ Affects user workflow and error handling complexity
   - _Default assumption if unanswered:_ Require explicit user confirmation before proceeding with partial import; show validation summary first

5. **File Retention Policy**
   How long should uploaded files and error reports be retained in S3? Should users be able to re-download their original files after import?
   - _Why it matters:_ Affects storage costs and audit capabilities
   - _Default assumption if unanswered:_ Retain files for 90 days; auto-delete afterward; users can download original files and error reports during retention period

## Nice to Have (will use reasonable defaults)

1. **Mapping Template Sharing**
   Should column mapping templates be private to each user or shareable across the organization? Should there be system-wide default templates?
   - _Why it matters:_ Affects template storage design and organizational efficiency
   - _Default assumption if unanswered:_ Templates are private to each user; no sharing capabilities in MVP

2. **Advanced Progress Reporting**
   Should progress tracking include detailed metrics (rows processed per second, estimated completion time, error counts in real-time) or just basic percentage complete?
   - _Why it matters:_ Affects UI complexity and background processing overhead
   - _Default assumption if unanswered:_ Basic percentage complete with simple time estimate; detailed metrics in future iteration

3. **Import Scheduling**
   Should users be able to schedule imports for off-peak hours or recurring imports of updated files?
   - _Why it matters:_ Affects system architecture and enterprise workflow capabilities
   - _Default assumption if unanswered:_ No scheduling in MVP; immediate processing only

## Assumptions Being Made

_These are interpretations the analysis has already made. Flag any that are wrong._

1. **50MB file limit is sufficient** — Based on typical CSV file sizes, assuming this handles 500K+ rows
2. **48-hour undo window is appropriate** — Balances mistake recovery with system complexity
3. **Email uniqueness across imports** — Treating email as the primary unique identifier for contacts
4. **S3 presigned URL workflow exists** — Leveraging existing file upload infrastructure
5. **Celery infrastructure is available** — Using existing async task processing system
6. **Focus on contacts, companies, deals only** — Not handling other CRM entities in this feature
