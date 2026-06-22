# Story Decomposition

## Feature: File Upload & Processing

### IMPORT-UPLOAD: Basic file upload with validation
**As a** standard user,
**I want** to upload CSV and Excel files up to 50MB for contact and company imports,
**so that** I can bulk import my data without file size restrictions blocking me.

**Scope:**
- In: CSV/Excel file upload, 50MB size limit for standard users, 25MB for large files during business hours, file format validation, encoding detection (UTF-8, Latin-1, Windows-1252), BOM marker handling
- Out: Deal imports (admin only), file processing, column mapping

**Dependencies:** User authentication and role checking
**Priority:** P1
**Size estimate:** M

---

### IMPORT-UPLOAD-DEALS: Deal import for privileged users
**As an** admin or sales manager,
**I want** to upload CSV and Excel files containing deal data,
**so that** I can import sensitive revenue information with appropriate access controls.

**Scope:**
- In: Deal data import capability, role-based access control, same file format support as contacts/companies
- Out: Standard user access to deal imports

**Dependencies:** IMPORT-UPLOAD, user role management
**Priority:** P2
**Size estimate:** S

---

### IMPORT-S3-STORAGE: Secure file storage
**As a** system,
**I want** to store uploaded files in S3 with presigned URLs and automatic cleanup,
**so that** we can handle large files efficiently without overwhelming the application server.

**Scope:**
- In: S3 upload with presigned URLs, file retention policy (1 year max), cleanup automation
- Out: Local file storage, indefinite retention

**Dependencies:** AWS S3 configuration
**Priority:** P1
**Size estimate:** M

## Feature: Column Mapping Interface

### IMPORT-MAPPING: Interactive column mapping
**As a** data importer,
**I want** to map CSV columns to CRM fields through a visual interface,
**so that** I can ensure my data lands in the correct fields regardless of CSV header names.

**Scope:**
- In: Drag-and-drop or dropdown mapping UI, required field indicators, custom field support, preview of mapping results
- Out: Automatic field detection, mapping validation

**Dependencies:** IMPORT-UPLOAD, field schema definition
**Priority:** P1
**Size estimate:** L

---

### IMPORT-TEMPLATES: Reusable mapping templates
**As a** frequent data importer,
**I want** to save and reuse column mapping configurations,
**so that** I don't have to recreate mappings for regular imports from the same source systems.

**Scope:**
- In: Template naming and saving, template suggestion based on similar headers, template management (edit/delete)
- Out: Automatic template application, cross-organization template sharing

**Dependencies:** IMPORT-MAPPING, user account management
**Priority:** P2
**Size estimate:** M

## Feature: Data Validation Engine

### IMPORT-VALIDATION: Core data validation
**As a** system,
**I want** to validate imported data against schema rules and business constraints,
**so that** only clean, properly formatted data enters the CRM.

**Scope:**
- In: Email format validation, phone format validation, required field checks, data type validation, international phone number support
- Out: Custom business rules, cross-record validation

**Dependencies:** Field schema definition, validation rule configuration
**Priority:** P1
**Size estimate:** M

---

### IMPORT-DUPLICATE-CHECK: Duplicate detection and update
**As a** data importer,
**I want** duplicate emails to update existing records with new information,
**so that** I can refresh contact data without manual merging work.

**Scope:**
- In: Email-based duplicate detection, existing record updates, clear summary of updates vs. new records
- Out: Duplicate rejection, manual merge workflows, other uniqueness constraints

**Dependencies:** IMPORT-VALIDATION, record update mechanisms
**Priority:** P1
**Size estimate:** M

---

### IMPORT-CUSTOM-VALIDATION: Custom field validation
**As a** system,
**I want** to validate dropdown and enum custom fields against existing valid options,
**so that** data quality is maintained and invalid options don't pollute field values.

**Scope:**
- In: Dropdown/enum validation, rejection of invalid values, display of valid options in error reports
- Out: Auto-creation of new dropdown options, type validation beyond dropdowns

**Dependencies:** Custom field schema, IMPORT-VALIDATION
**Priority:** P2
**Size estimate:** M

## Feature: Preview & Error Management

### IMPORT-PREVIEW: Data preview with validation status
**As a** data importer,
**I want** to see a preview of the first 20 rows with validation status per row,
**so that** I can verify my mapping and data quality before committing the import.

**Scope:**
- In: 20-row preview, row-level validation status, field-level error indicators, summary statistics
- Out: Full file preview, real-time validation during preview

**Dependencies:** IMPORT-VALIDATION, IMPORT-MAPPING
**Priority:** P1
**Size estimate:** M

---

### IMPORT-ERROR-REPORT: Detailed error reporting
**As a** data importer,
**I want** to download a CSV report showing validation errors with original data,
**so that** I can fix my source file and retry the import.

**Scope:**
- In: CSV error report generation, row numbers, field names, error descriptions, original problematic field values only, valid dropdown options for custom fields
- Out: Full row data in error reports, PDF reports, real-time error correction

**Dependencies:** IMPORT-VALIDATION, IMPORT-CUSTOM-VALIDATION
**Priority:** P2
**Size estimate:** M

---

### IMPORT-PARTIAL: Partial import option
**As a** data importer,
**I want** to import only the valid rows while skipping invalid ones,
**so that** I don't have to fix every error before getting good data into the system.

**Scope:**
- In: Checkbox confirmation for partial import, clear summary of valid vs. invalid row counts, user confirmation required
- Out: Automatic partial import, mixed import/correction workflows

**Dependencies:** IMPORT-PREVIEW, IMPORT-VALIDATION
**Priority:** P2
**Size estimate:** S

## Feature: Asynchronous Processing

### IMPORT-ASYNC: Background processing for large files
**As a** data importer,
**I want** files with 5,000+ rows to process in the background,
**so that** I can continue using the application while large imports complete.

**Scope:**
- In: 5,000-row threshold, background task queuing, task status tracking, optional background processing for any file size
- Out: Synchronous processing for large files, manual queue management

**Dependencies:** Celery task queue, IMPORT-VALIDATION
**Priority:** P1
**Size estimate:** M

---

### IMPORT-PROGRESS: Real-time progress tracking
**As a** data importer,
**I want** to see progress percentage and estimated completion time for background imports,
**so that** I know how long to wait and can plan accordingly.

**Scope:**
- In: Progress percentage, conservative time estimates with buffer, real-time updates via polling or WebSocket
- Out: Exact completion times, progress for synchronous imports

**Dependencies:** IMPORT-ASYNC, progress calculation algorithms
**Priority:** P2
**Size estimate:** M

---

### IMPORT-NOTIFICATIONS: Completion notifications
**As a** data importer,
**I want** to receive email notifications when background imports complete,
**so that** I can act on the results even when away from the application.

**Scope:**
- In: Email notifications with import summary (success/failure counts), link to detailed results, sent to user's registered email
- Out: In-app notifications only, SMS notifications, custom notification preferences

**Dependencies:** IMPORT-ASYNC, email service configuration
**Priority:** P2
**Size estimate:** S

## Feature: Import Audit & History

### IMPORT-HISTORY: Import history dashboard
**As a** data importer,
**I want** to view a history of my past imports with key statistics,
**so that** I can track my import activity and find specific imports to review or undo.

**Scope:**
- In: Import history list, date/time stamps, file names, row counts (total/imported/skipped/failed), import status, 1-year retention
- Out: Indefinite history retention, file content storage, cross-user history access

**Dependencies:** Import tracking and logging
**Priority:** P2
**Size estimate:** M

---

### IMPORT-UNDO: Import rollback functionality
**As a** data importer,
**I want** to undo an import within 48 hours (7 days for admins),
**so that** I can reverse mistakes without losing previously good data.

**Scope:**
- In: Soft-delete imported records, restore previous values for updated records, 48-hour window for standard users, 7-day window for admins, confirmation prompts
- Out: Hard deletion, indefinite undo window, bulk undo across multiple imports

**Dependencies:** Change tracking, soft-delete mechanisms, user role management
**Priority:** P3
**Size estimate:** L

---

### IMPORT-AUDIT: Comprehensive audit trail
**As an** admin user,
**I want** detailed audit logs of all import activities,
**so that** I can track data changes for compliance and troubleshooting.

**Scope:**
- In: User actions, timestamps, affected record counts, validation results, file metadata, change summaries
- Out: Field-level change tracking, external audit system integration

**Dependencies:** Logging infrastructure, admin user interface
**Priority:** P3
**Size estimate:** M

## Infrastructure Stories

### IMPORT-PERMISSIONS: Role-based access control
**As a** system administrator,
**I want** to enforce import permissions based on user roles and data types,
**so that** sensitive data like deals remains restricted to authorized users.

**Scope:**
- In: Role checking for contacts/companies (all users), deals (admin/sales manager only), file size limits by role
- Out: Granular field-level permissions, custom role definitions

**Dependencies:** User authentication system, role management
**Priority:** P1
**Size estimate:** S

---

### IMPORT-PERFORMANCE: Database optimization for bulk operations
**As a** system,
**I want** to handle bulk imports efficiently against a 2M+ record database,
**so that** large imports don't impact system performance or cause timeouts.

**Scope:**
- In: Chunked database transactions, index optimization, connection pooling, memory management for large files
- Out: Real-time processing optimization, cross-database transactions

**Dependencies:** PostgreSQL configuration, Celery setup
**Priority:** P1
**Size estimate:** M

## Coverage Check
| Feature from Analysis | Stories | Status |
|----------------------|---------|--------|
| File Upload & Processing | IMPORT-UPLOAD, IMPORT-UPLOAD-DEALS, IMPORT-S3-STORAGE | Covered |
| Column Mapping Interface | IMPORT-MAPPING, IMPORT-TEMPLATES | Covered |
| Data Validation Engine | IMPORT-VALIDATION, IMPORT-DUPLICATE-CHECK, IMPORT-CUSTOM-VALIDATION | Covered |
| Preview & Error Management | IMPORT-PREVIEW, IMPORT-ERROR-REPORT, IMPORT-PARTIAL | Covered |
| Asynchronous Processing | IMPORT-ASYNC, IMPORT-PROGRESS, IMPORT-NOTIFICATIONS | Covered |
| Import Audit & History | IMPORT-HISTORY, IMPORT-UNDO, IMPORT-AUDIT | Covered |

## Dependency Map
- **Core flow:** IMPORT-UPLOAD → IMPORT-MAPPING → IMPORT-VALIDATION → IMPORT-PREVIEW → IMPORT-ASYNC
- **Permission gates:** IMPORT-PERMISSIONS must be implemented before any import functionality
- **Infrastructure:** IMPORT-S3-STORAGE and IMPORT-PERFORMANCE support all other stories
- **Advanced features:** IMPORT-TEMPLATES, IMPORT-UNDO, IMPORT-AUDIT build on core functionality

## Suggested Implementation Order
1. **IMPORT-PERMISSIONS** — Foundation for all access control
2. **IMPORT-UPLOAD** — Basic file handling without processing
3. **IMPORT-S3-STORAGE** — Reliable file storage infrastructure
4. **IMPORT-VALIDATION** — Core validation without UI
5. **IMPORT-MAPPING** — Column mapping interface
6. **IMPORT-PREVIEW** — Preview and validation results UI
7. **IMPORT-DUPLICATE-CHECK** — Handle duplicate record updates
8. **IMPORT-ASYNC** — Background processing capability
9. **IMPORT-PROGRESS** — Progress tracking for async imports
10. **IMPORT-PARTIAL** — Allow partial imports after preview
11. **IMPORT-ERROR-REPORT** — Downloadable error reports
12. **IMPORT-HISTORY** — Import tracking and history
13. **IMPORT-NOTIFICATIONS** — Email notifications for completion
14. **IMPORT-TEMPLATES** — Reusable mapping configurations
15. **IMPORT-CUSTOM-VALIDATION** — Custom field validation
16. **IMPORT-UNDO** — Rollback functionality
17. **IMPORT-AUDIT** — Comprehensive audit logging
18. **IMPORT-UPLOAD-DEALS** — Deal import for privileged users
19. **IMPORT-PERFORMANCE** — Database optimization (ongoing)
