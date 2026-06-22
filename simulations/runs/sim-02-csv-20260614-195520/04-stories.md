# Story Decomposition

## Feature: File Upload & Processing

### UPLOAD-BASIC: File upload with format validation
**As a** CRM user,
**I want** to upload CSV and Excel files up to 50MB,
**so that** I can import my contact data from various sources without format conversion hassles.

**Scope:**
- In: CSV and .xlsx file uploads, 50MB size limit, direct S3 upload with presigned URLs
- Out: Other file formats (.xls, .tsv), files over 50MB, multiple file uploads at once

**Dependencies:** S3 bucket configuration, presigned URL generation
**Priority:** P1
**Size estimate:** M

---

### UPLOAD-ENCODING: Automatic encoding detection and handling
**As a** data migration specialist,
**I want** the system to automatically detect and handle different file encodings,
**so that** I don't have to manually convert files or lose data due to encoding issues.

**Scope:**
- In: Auto-detection of UTF-8, Latin-1, Windows-1252, BOM handling, fallback UI when detection fails
- Out: Manual encoding specification upfront, complex encoding conversions

**Dependencies:** File upload infrastructure (UPLOAD-BASIC)
**Priority:** P2
**Size estimate:** S

---

## Feature: Column Mapping Interface

### MAPPING-UI: Visual column mapping interface
**As a** CRM user,
**I want** to map CSV columns to CRM fields through a visual interface,
**so that** I can ensure my data goes to the right places without technical knowledge.

**Scope:**
- In: Drag-and-drop mapping, field type indicators, required field highlighting, preview of mapped data
- Out: Bulk column operations, saved mapping templates, complex field transformations

**Dependencies:** File upload (UPLOAD-BASIC), CRM field schema
**Priority:** P1
**Size estimate:** L

---

### MAPPING-DATES: Date format specification during mapping
**As a** CRM user importing international data,
**I want** to specify date formats for each column during mapping,
**so that** my dates are interpreted correctly regardless of regional format differences.

**Scope:**
- In: Format picker per date column (MM/DD/YYYY, DD/MM/YYYY, etc.), format preview, default to MM/DD/YYYY
- Out: Auto-detection of date formats, complex date parsing, timezone handling

**Dependencies:** Column mapping UI (MAPPING-UI)
**Priority:** P2
**Size estimate:** S

---

## Feature: Data Validation Engine

### VALIDATE-BASIC: Core field validation
**As a** CRM user,
**I want** my imported data validated against field requirements,
**so that** I don't import incomplete or incorrectly formatted records.

**Scope:**
- In: Email format validation, phone number validation (US/CA/UK/AU/DE), required field checking
- Out: Complex business rule validation, cross-record validation, real-time validation during mapping

**Dependencies:** Column mapping (MAPPING-UI)
**Priority:** P1
**Size estimate:** M

---

### VALIDATE-DUPLICATES: Duplicate detection with batched processing
**As a** data quality manager,
**I want** duplicate email addresses detected efficiently during import,
**so that** I can identify potential duplicates without the system becoming unresponsive.

**Scope:**
- In: Email duplicate checking in 1000-row batches, duplicate warnings (not blocking), duplicate flagging in preview
- Out: Real-time duplicate checking, complex fuzzy matching, automatic duplicate resolution

**Dependencies:** Core validation (VALIDATE-BASIC), database indexing
**Priority:** P1
**Size estimate:** M

---

### VALIDATE-CUSTOM: Custom field dropdown auto-creation
**As a** CRM administrator,
**I want** new dropdown values automatically created during import,
**so that** data imports aren't blocked by slight terminology variations.

**Scope:**
- In: Auto-creation of new dropdown options, admin notification of new values, weekly digest of created values
- Out: Fuzzy matching of existing options, automatic value merging, complex validation rules

**Dependencies:** Core validation (VALIDATE-BASIC), admin notification system
**Priority:** P2
**Size estimate:** M

---

## Feature: Preview & Error Management

### PREVIEW-VALIDATION: Import preview with validation feedback
**As a** CRM user,
**I want** to see a preview of my import with validation results,
**so that** I can fix issues before committing to the import.

**Scope:**
- In: First 20 rows preview, per-row validation status, error highlighting, row-level error messages
- Out: Full file preview, inline editing, real-time preview updates

**Dependencies:** Validation engine (VALIDATE-BASIC), column mapping (MAPPING-UI)
**Priority:** P1
**Size estimate:** M

---

### PREVIEW-ERRORS: Error reporting and export
**As a** data migration specialist,
**I want** to download a detailed error report for validation failures,
**so that** I can efficiently fix data issues in my source files.

**Scope:**
- In: Downloadable CSV error report with row numbers and error descriptions, error count summary by type
- Out: Error fixing within the app, automated error correction, complex error analysis

**Dependencies:** Validation preview (PREVIEW-VALIDATION)
**Priority:** P1
**Size estimate:** S

---

### PREVIEW-PARTIAL: Partial import option
**As a** CRM user,
**I want** to import valid rows while skipping invalid ones,
**so that** I don't lose good data while fixing problematic records.

**Scope:**
- In: Option to proceed with valid rows only, "Unknown Company" placeholder for orphaned contacts, clear success/skip statistics
- Out: Automatic data correction, complex relationship resolution, batch processing of failed records

**Dependencies:** Validation preview (PREVIEW-VALIDATION), data validation engine
**Priority:** P1
**Size estimate:** M

---

## Feature: Asynchronous Processing

### ASYNC-PROCESSING: Background processing for large files
**As a** data migration specialist,
**I want** large imports processed in the background,
**so that** I can import enterprise-scale datasets without blocking my work.

**Scope:**
- In: Automatic async processing for >1000 rows, Celery task queue integration, email notification on completion
- Out: Sync/async choice by user, real-time streaming, complex task orchestration

**Dependencies:** Celery infrastructure, validation engine, import core logic
**Priority:** P1
**Size estimate:** L

---

### ASYNC-PROGRESS: Import progress tracking
**As a** CRM user,
**I want** to see real-time progress of my import,
**so that** I know how long to wait and can plan my next tasks.

**Scope:**
- In: Progress percentage, estimated time remaining, current processing stage, refresh every 5 seconds
- Out: Detailed row-by-row progress, pause/resume functionality, complex time estimation algorithms

**Dependencies:** Async processing (ASYNC-PROCESSING)
**Priority:** P1
**Size estimate:** M

---

### ASYNC-RECOVERY: Task failure handling and retry
**As a** system administrator,
**I want** failed import tasks to retry automatically and notify users of permanent failures,
**so that** temporary issues don't result in lost import work.

**Scope:**
- In: Automatic task restart on failure, user notification for permanent failures, task status tracking
- Out: Resume from checkpoint, manual retry controls, complex failure analysis

**Dependencies:** Async processing (ASYNC-PROCESSING), notification system
**Priority:** P2
**Size estimate:** M

---

## Feature: Import History & Audit Trail

### HISTORY-TRACKING: Import history with role-based access
**As a** CRM user,
**I want** to see a history of my past imports,
**so that** I can track what data I've added and troubleshoot any issues.

**Scope:**
- In: Import list with date/time/filename, row counts (total/imported/skipped/failed), role-based filtering (users see their imports, admins see all)
- Out: Detailed audit logs, data lineage tracking, complex search and filtering

**Dependencies:** User authentication system, import processing core
**Priority:** P2
**Size estimate:** M

---

### HISTORY-DETAILS: Detailed import statistics and metadata
**As a** system administrator,
**I want** detailed statistics for each import operation,
**so that** I can monitor system performance and help users with issues.

**Scope:**
- In: Processing time, error breakdown by type, file metadata, user information, validation statistics
- Out: Real-time analytics, performance dashboards, automated reporting

**Dependencies:** Import history (HISTORY-TRACKING)
**Priority:** P3
**Size estimate:** S

---

## Feature: Undo Functionality

### UNDO-IMPORT: Reverse imports with safety checks
**As a** CRM administrator,
**I want** to reverse an import while protecting subsequently modified records,
**so that** I can fix import mistakes without losing valid user work.

**Scope:**
- In: Soft-delete unmodified imported records, clear warning about protected records, 90-day window, undo confirmation
- Out: Hard delete options, complex relationship cascading, selective undo by record type

**Dependencies:** Import history (HISTORY-TRACKING), record modification tracking
**Priority:** P2
**Size estimate:** L

---

### UNDO-CLEANUP: Automated file and record cleanup
**As a** system administrator,
**I want** imported files and soft-deleted records automatically cleaned up after 90 days,
**so that** storage costs are controlled and compliance requirements are met.

**Scope:**
- In: Scheduled cleanup job, 90-day retention period, S3 file deletion, soft-delete record cleanup
- Out: Configurable retention periods, selective cleanup controls, backup before cleanup

**Dependencies:** File storage system, undo functionality (UNDO-IMPORT)
**Priority:** P3
**Size estimate:** M

---

## Feature: Permission Management

### PERMISSIONS-IMPORT: Role-based import restrictions
**As a** system administrator,
**I want** to control what data types users can import,
**so that** sensitive data like deals are only handled by authorized personnel.

**Scope:**
- In: Users can import contacts and companies, only admins can import deals, permission checking before import start
- Out: Granular field-level permissions, approval workflows, dynamic permission assignment

**Dependencies:** User role system, import processing core
**Priority:** P1
**Size estimate:** S

---

## Dependency Map
- **File uploads** → Column mapping → Validation → Preview → Processing
- **Async processing** depends on core validation and mapping
- **History tracking** depends on all import operations
- **Undo functionality** depends on history and record tracking
- **Permission system** gates all import operations
- **Cleanup jobs** depend on undo and file storage systems

## Suggested Implementation Order
1. **UPLOAD-BASIC** — Core file upload capability
2. **PERMISSIONS-IMPORT** — Security controls before any processing
3. **MAPPING-UI** — Essential for any real imports
4. **VALIDATE-BASIC** — Data quality foundation
5. **PREVIEW-VALIDATION** — User feedback before committing
6. **PREVIEW-PARTIAL** — Allows proceeding with imperfect data
7. **VALIDATE-DUPLICATES** — Enterprise requirement
8. **ASYNC-PROCESSING** — Scalability for large files
9. **ASYNC-PROGRESS** — User experience for long operations
10. **HISTORY-TRACKING** — Audit trail basics
11. **PREVIEW-ERRORS** — Better debugging tools
12. **VALIDATE-CUSTOM** — Flexibility for dropdown values
13. **MAPPING-DATES** — International support
14. **UNDO-IMPORT** — Safety net for mistakes
15. **UPLOAD-ENCODING** — Edge case handling
16. **ASYNC-RECOVERY** — Reliability improvements
17. **HISTORY-DETAILS** — Enhanced monitoring
18. **UNDO-CLEANUP** — Operational maintenance

## Coverage Check
| Feature from Analysis | Stories | Status |
|----------------------|---------|--------|
| File Upload & Processing | UPLOAD-BASIC, UPLOAD-ENCODING | Covered |
| Column Mapping Interface | MAPPING-UI, MAPPING-DATES | Covered |
| Data Validation Engine | VALIDATE-BASIC, VALIDATE-DUPLICATES, VALIDATE-CUSTOM | Covered |
| Preview & Error Management | PREVIEW-VALIDATION, PREVIEW-ERRORS, PREVIEW-PARTIAL | Covered |
| Asynchronous Processing | ASYNC-PROCESSING, ASYNC-PROGRESS, ASYNC-RECOVERY | Covered |
| Import History & Audit Trail | HISTORY-TRACKING, HISTORY-DETAILS | Covered |
| Undo Functionality | UNDO-IMPORT, UNDO-CLEANUP | Covered |
| (Permission Management) | PERMISSIONS-IMPORT | Added based on stakeholder clarification |
