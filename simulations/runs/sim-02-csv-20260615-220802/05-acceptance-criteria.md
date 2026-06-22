<!-- STORY COUNT: 9 stories to process -->

# Acceptance Criteria: UPLOAD-01 — Drag-and-drop file upload via presigned URL

## Refined Story Statement
As a CRM Admin or Power User, I want to upload a CSV or .xlsx file (up to 50MB) via drag-and-drop or file picker and select an entity type before upload begins, so that I can initiate a bulk data import without hitting the CRM's API payload limits.

## Assumptions
- The CRM already has an authenticated session mechanism (JWT or session cookie) that this feature integrates with — **Confirmed**
- Entity type selection (contacts / companies / deals) happens before the presigned URL is requested — **Confirmed**
- Presigned URL expiry is set to 15 minutes — **Confirmed**
- Client-side file type and size enforcement is a UX guard only; backend also validates before issuing presigned URL — **Confirmed**
- MIME type validation (not just extension check) is enforced on the backend — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-7: One entity type per import run | Addressed — entity type selector shown before upload; one selection required to proceed | AC-5 |
| G-8: S3 file retention policy | Addressed in UPLOAD-02 (90-day lifecycle rule) — out of scope for this story's AC | Out of Scope for UPLOAD-01 |
| G-11: Roles/permissions for import | Partially addressed — auth gates cover unauthenticated and unauthorized access; specific role list (CRM Admin, Power User) marked as open question pending authorization model | AC-AUTH-1, AC-AUTH-2, Open Questions |

## Acceptance Criteria

### AC-1: Drag-and-drop upload target is rendered and accepts files
**Given** an authenticated user with import permission is on the import initiation screen
**When** the user drags a file over the upload zone
**Then** the upload zone displays a visual highlight indicating the drop target is active, and releasing the file initiates the upload flow

**Category:** happy-path
**Priority:** must-have

### AC-2: File picker opens and accepts file selection
**Given** an authenticated user with import permission is on the import initiation screen
**When** the user clicks the "Browse files" button
**Then** the OS file picker opens filtered to `.csv` and `.xlsx` extensions, and selecting a valid file initiates the upload flow

**Category:** happy-path
**Priority:** must-have

### AC-3: Entity type must be selected before upload is allowed
**Given** an authenticated user has arrived at the import screen
**When** the user attempts to upload a file before selecting an entity type (contacts / companies / deals)
**Then** the upload zone is disabled (or clicking it shows an inline prompt), and an error message reads "Please select an entity type before uploading"

**Category:** edge-case
**Priority:** must-have

### AC-4: Presigned URL is generated for a valid file
**Given** an authenticated user has selected an entity type and chosen a valid CSV or .xlsx file under 50MB
**When** the frontend requests a presigned URL from the backend
**Then** the backend returns a presigned S3 URL valid for at least 15 minutes, along with the S3 key for that upload slot

**Category:** happy-path
**Priority:** must-have

### AC-5: File is uploaded directly to S3 via presigned URL
**Given** a presigned URL has been received by the frontend
**When** the browser uploads the file directly to S3 using that URL
**Then** the upload completes without routing through the CRM backend, and the file lands in the designated S3 import bucket

**Category:** happy-path
**Priority:** must-have

### AC-6: Upload progress indicator displays during upload
**Given** a file upload to S3 is in progress
**When** the browser is transmitting bytes
**Then** a progress indicator (e.g., percentage bar) updates at least every 2 seconds to reflect upload progress

**Category:** happy-path
**Priority:** should-have

### AC-7: Files larger than 50MB are rejected before upload starts
**Given** an authenticated user selects a file larger than 50MB
**When** the file is selected via drag-and-drop or file picker
**Then** the upload does not start, and an inline error reads "File exceeds the 50MB limit. Please split your data into smaller files."

**Category:** boundary
**Priority:** must-have

### AC-8: Files with unsupported formats are rejected
**Given** an authenticated user selects a file that is not `.csv` or `.xlsx` (e.g., `.xls`, `.json`, `.pdf`)
**When** the file is dropped or selected
**Then** the upload does not start, and an inline error reads "Unsupported file type. Only .csv and .xlsx files are accepted."

**Category:** error-handling
**Priority:** must-have

### AC-9: Presigned URL expiry — upload initiated after URL expires fails gracefully
**Given** a presigned URL was issued but the user does not begin the S3 upload within 15 minutes
**When** the frontend attempts to upload to the expired presigned URL
**Then** S3 returns a 403, the frontend displays "Your upload session expired. Please try again.", and the user can restart the upload flow

**Category:** edge-case
**Priority:** must-have

### AC-10: Network interruption during S3 upload is surfaced
**Given** a file upload to S3 is in progress
**When** the network connection is lost mid-upload
**Then** the upload stops, and the UI displays "Upload failed due to a network error. Please check your connection and try again." with a "Retry" button

**Category:** error-handling
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the presigned URL generation endpoint (`POST /api/imports/presigned-url`)
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without import permission
**When** a request is made to the presigned URL generation endpoint
**Then** the system returns 403 Forbidden with a message identifying the missing permission (e.g., `"required_permission": "imports:create"`)

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| S3 returns non-200 on upload | Frontend reads the S3 error XML, surfaces "Upload failed (S3 error). Try again." | must-have |
| Backend returns 500 on presigned URL request | Display "Unable to start upload. Please try again in a moment." | must-have |
| File is 0 bytes | Rejected before upload with "File appears to be empty." | must-have |

### Performance
- **Presigned URL generation:** Backend responds within 500ms p95 under normal load
- **Scale:** Upload UI supports files up to 50MB; no server-side streaming is needed since upload bypasses the CRM backend

### Security
- **Input validation:** Backend validates entity type value (must be one of `contacts`, `companies`, `deals`) before issuing presigned URL; rejects unknown values with 400
- **Authorization:** Presigned URL endpoint requires authenticated session; see AC-AUTH-1 and AC-AUTH-2
- **MIME enforcement:** Backend should verify MIME type (not just file extension) before issuing presigned URL — see Open Questions

### Accessibility
- Upload drop zone must be keyboard-accessible (tab-focusable, Enter/Space triggers file picker)
- Error messages must be announced by screen readers via `aria-live="polite"`

## Open Questions
- G-11: The specific roles permitted to run imports are not defined. Story says "CRM Admin or Power User" — this needs to be encoded as a named permission (`imports:create`) and assigned to roles in the auth system before sprint commit.
- MIME type validation: Should the backend reject requests where the detected MIME type does not match the stated extension? (e.g., a `.csv` file that is actually a ZIP.) If so, this is an additional AC.

---

# Acceptance Criteria: UPLOAD-02 — S3 upload completion callback and import job initialization

## Refined Story Statement
As a CRM Admin or Power User, I want the system to register that my file finished uploading and create a processing job record, so that my file is queued for the next step (column mapping) and I receive a job ID to track progress.

## Assumptions
- The client fires a POST to a backend confirmation endpoint after the S3 PUT request succeeds (client-initiated confirmation, not S3 event) — **Confirmed**
- The backend creates an `ImportJob` record immediately upon receiving a valid confirmation — **Confirmed**
- S3 files receive a 90-day lifecycle policy at the bucket level, not per-object — **Confirmed**
- The `ImportJob` record includes: job ID, status (`pending`), entity type, original filename, S3 key, uploader user ID, and created timestamp — **Confirmed**
- The backend verifies the S3 key exists before creating the job (prevents fabricated confirmations) — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-8: S3 file retention policy | Addressed — 90-day lifecycle rule confirmed in story scope; AC-3 covers backend documentation of the rule | AC-3 |
| G-11: Roles/permissions | Partially addressed — auth gates in AC-AUTH-1 and AC-AUTH-2; specific role list remains open question | AC-AUTH-1, AC-AUTH-2, Open Questions |

## Acceptance Criteria

### AC-1: Confirmation endpoint creates an ImportJob on valid S3 upload
**Given** an authenticated user has successfully uploaded a file to S3 via presigned URL
**When** the frontend POSTs to `/api/imports/confirm` with the S3 key, entity type, and original filename
**Then** the backend creates an `ImportJob` record with status `pending` and returns a JSON response containing the `job_id`, `status: "pending"`, and an ISO 8601 `created_at` timestamp

**Category:** happy-path
**Priority:** must-have

### AC-2: Response includes the job ID for downstream tracking
**Given** the confirmation endpoint returns successfully (HTTP 201)
**When** the frontend receives the response
**Then** the response body contains `job_id` (UUID or equivalent unique identifier) that the frontend stores and uses for all subsequent tracking calls

**Category:** happy-path
**Priority:** must-have

### AC-3: S3 lifecycle rule enforces 90-day auto-deletion
**Given** a file has been uploaded to the import S3 bucket
**When** 90 days have elapsed since the object was created
**Then** S3 automatically deletes the object (verified via bucket lifecycle configuration — this is an infrastructure deliverable of this story)

**Category:** happy-path
**Priority:** must-have

### AC-4: Confirmation rejected if S3 key does not exist
**Given** an authenticated user POSTs a confirmation with a fabricated or incorrect S3 key
**When** the backend attempts to verify the key in S3
**Then** the backend returns 400 Bad Request with `"error": "File not found in upload bucket. Upload may have failed."` and does not create an `ImportJob`

**Category:** security
**Priority:** must-have

### AC-5: Duplicate confirmation for the same S3 key is idempotent
**Given** a confirmation has already been posted for a given S3 key and an `ImportJob` exists
**When** the client POSTs the same confirmation again (retry scenario)
**Then** the backend returns 200 OK with the existing `job_id` and does not create a duplicate `ImportJob`

**Category:** edge-case
**Priority:** must-have

### AC-6: Confirmation with missing required fields returns 400
**Given** an authenticated user POSTs to the confirmation endpoint
**When** the request body omits `s3_key`, `entity_type`, or `original_filename`
**Then** the backend returns 400 Bad Request with a field-level error identifying each missing parameter

**Category:** error-handling
**Priority:** must-have

### AC-7: Confirmation with invalid entity type is rejected
**Given** an authenticated user POSTs a confirmation
**When** `entity_type` is a value other than `contacts`, `companies`, or `deals`
**Then** the backend returns 400 Bad Request with `"error": "Invalid entity type. Must be one of: contacts, companies, deals."`

**Category:** error-handling
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to `POST /api/imports/confirm`
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without import permission
**When** a request is made to `POST /api/imports/confirm`
**Then** the system returns 403 Forbidden with `"required_permission": "imports:create"`

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| S3 key verification call times out | Return 503 with "Unable to verify upload. Please try again." | must-have |
| Database write fails on job creation | Return 500; log error with correlation ID; do not return partial job ID | must-have |

### Performance
- **Response time:** Confirmation endpoint responds within 1,000ms p95 (includes S3 key existence check)
- **Scale:** Must handle burst of concurrent confirmations (e.g., multiple users uploading simultaneously)

### Security
- **Authorization:** Endpoint requires authenticated session; user ID from session is recorded in `ImportJob` — not from request body
- **Input validation:** S3 key must be validated to match the format generated by the presigned URL endpoint (prevents path traversal or cross-bucket references)

### Accessibility
- N/A — this is a backend endpoint with no UI surface

## Open Questions
- G-11: Role assignment for `imports:create` permission is not defined. This must be resolved before implementation to configure the auth middleware correctly.
- S3 key format validation: Should the backend enforce that the S3 key matches a specific prefix pattern (e.g., `imports/{user_id}/`) to prevent users from confirming uploads into arbitrary bucket paths? Recommend yes.

---

# Acceptance Criteria: MAP-01 — Map CSV/xlsx columns to CRM fields

## Refined Story Statement
As a CRM Admin or Power User, I want to map the columns in my uploaded file to CRM fields before the import proceeds, so that the system knows which source column corresponds to which CRM field for validation and insert.

## Assumptions
- Column headers are read from the first row of the file at the time this screen loads — **Confirmed**
- CRM fields shown in the dropdown are scoped to the entity type selected in UPLOAD-01 — **Confirmed**
- Template persistence (save/load) is out of scope for MAP-01 and handled by MAP-02 — **Confirmed**
- "Required CRM fields" are defined by the entity type schema and must be mapped before the user can proceed to validation — **Confirmed**
- "Ignore" is a valid mapping selection for any column — **Confirmed**
- Column value transformations (e.g., splitting Full Name) are out of scope — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-2: No template persistence in v1 | Templates now confirmed in scope via MAP-02 (stakeholder flagged as omission); MAP-01 scoped to single-use mapping only, no save/load here | Out of Scope for MAP-01 |
| G-7: One entity type per import | Addressed — field dropdown is filtered to entity type selected at upload | AC-2 |
| G-11: Roles/permissions | Partially addressed via auth AC; role definition remains open | AC-AUTH-1, AC-AUTH-2, Open Questions |

## Acceptance Criteria

### AC-1: Mapping screen displays all file column headers
**Given** an authenticated user has completed a file upload (UPLOAD-02 job ID exists) and navigated to the mapping step
**When** the mapping screen loads
**Then** every column header from the first row of the uploaded file is listed, one row per column, in the order they appear in the file

**Category:** happy-path
**Priority:** must-have

### AC-2: Each column header has a CRM field dropdown scoped to entity type
**Given** the mapping screen has loaded for a contacts import
**When** the user opens the CRM field dropdown for any column
**Then** the dropdown lists all standard contact fields plus all active custom fields for the contacts entity, and no fields from other entity types appear

**Category:** happy-path
**Priority:** must-have

### AC-3: A column can be marked as "Ignore"
**Given** the user is on the mapping screen
**When** the user selects "Ignore (skip this column)" for a column
**Then** that column is excluded from validation and import; it does not appear in subsequent steps

**Category:** happy-path
**Priority:** must-have

### AC-4: Required CRM fields must all be mapped before proceeding
**Given** the user is on the mapping screen
**When** the user clicks "Continue to Validate" with one or more required CRM fields unmapped
**Then** the form does not advance, and each unmapped required field is highlighted with the message "This required field has no column mapped to it"

**Category:** error-handling
**Priority:** must-have

### AC-5: Each CRM field can only be mapped to one source column
**Given** the user has already mapped column A to the "Email" CRM field
**When** the user attempts to map column B to "Email" as well
**Then** the system prevents the duplicate mapping and displays "Email is already mapped to column A. Each CRM field can only be mapped once."

**Category:** edge-case
**Priority:** must-have

### AC-6: .xlsx files with merged header cells surface a clear error
**Given** an uploaded .xlsx file has merged cells in the header row
**When** the mapping screen attempts to read the headers
**Then** the screen displays "One or more column headers could not be read (merged cells detected). Please unmerge header cells in your file and re-upload." and the user cannot proceed

**Category:** edge-case
**Priority:** must-have

### AC-7: File with no header row is handled
**Given** an uploaded CSV has no header row (first row contains data, not headers)
**When** the mapping screen loads
**Then** the system displays raw first-row values as the column names, and includes an inline notice: "Column names were read from the first row of your file. If this row contains data rather than headers, re-upload a file with a header row."

**Category:** edge-case
**Priority:** should-have

### AC-8: Active custom fields for the entity type appear in the dropdown
**Given** the CRM has 3 active custom fields configured for contacts
**When** the user opens the CRM field dropdown on the mapping screen for a contacts import
**Then** all 3 custom fields appear in the dropdown alongside standard fields

**Category:** happy-path
**Priority:** must-have

### AC-9: Inactive or archived custom fields do not appear
**Given** the CRM has a deactivated custom field for contacts
**When** the user opens the CRM field dropdown
**Then** the deactivated field does not appear in the list

**Category:** edge-case
**Priority:** must-have

### AC-10: Proceeding with a valid mapping saves the mapping to the ImportJob
**Given** all required CRM fields are mapped
**When** the user clicks "Continue to Validate"
**Then** the column mapping is persisted to the `ImportJob` record (stored as a JSON mapping of source column index → CRM field name), and the user advances to the validation step

**Category:** happy-path
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the mapping screen endpoints (header read or mapping save)
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without import permission
**When** a request is made to the mapping screen endpoints
**Then** the system returns 403 Forbidden with `"required_permission": "imports:create"`

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| S3 file read fails when loading headers | Display "Could not read your file. It may have been deleted. Please re-upload." | must-have |
| ImportJob not found for job ID | Return 404; redirect user to import start | must-have |
| CRM fields API call fails | Display "Unable to load CRM fields. Try refreshing the page." | must-have |

### Performance
- **Screen load time:** Mapping screen (including header read from S3 + CRM fields fetch) loads within 3,000ms p95
- **Scale:** Must support files with up to 200 columns without layout degradation

### Security
- **Input validation:** Mapping save endpoint validates that all referenced CRM field names are real, active fields (prevents injection of arbitrary field names)
- **Authorization:** User can only access the mapping step for an `ImportJob` they own (uploader user ID matches session user ID)

### Accessibility
- Dropdowns must be keyboard-navigable and screen-reader compatible with descriptive `aria-label` per row
- Required field errors must be announced via `aria-live`

## Open Questions
- G-11: Permission assignment (`imports:create`) to specific roles not yet defined. Must be resolved before implementation.
- Authorization scope: Can a CRM Admin access the mapping step for an import job created by another user? Story implies personal ownership; confirm.

---

# Acceptance Criteria: MAP-02 — Save and load column mapping templates

## Refined Story Statement
As a CRM Admin or Power User, I want to save a column mapping as a named template and reload it on future imports, so that I don't have to manually re-map the same columns for recurring imports from the same source system.

## Assumptions
- Templates are stored per user and are not shared between users in v1 — **Confirmed**
- Templates are entity-type-specific (a contacts template will not appear for a deals import) — **Confirmed**
- Template CRUD includes: save, load, rename, delete — **Confirmed**
- There is no limit on the number of templates a user can save in v1 — **Unconfirmed**
- Templates store the source column name → CRM field name mapping (not column index), so they can match by header name on future imports — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-2: Template persistence — "no template persistence in v1" | Overridden — stakeholder explicitly confirmed MAP-02 as required (flagged as spec omission). Templates ARE in scope. | Entire story |
| G-11: Roles/permissions | Partially addressed via auth AC; role definition remains open | AC-AUTH-1, AC-AUTH-2, Open Questions |

## Acceptance Criteria

### AC-1: User can save the current mapping as a named template
**Given** an authenticated user is on the column mapping screen with at least one column mapped
**When** the user clicks "Save as template" and enters a template name (1–100 characters)
**Then** the template is saved and associated with the current user and entity type; a success message reads "Template '[name]' saved."

**Category:** happy-path
**Priority:** must-have

### AC-2: Saved template appears in the "Load template" dropdown on the same entity type
**Given** a user has saved a contacts mapping template named "Salesforce Export"
**When** the user starts a new contacts import and opens the mapping screen
**Then** "Salesforce Export" appears in the "Load template" dropdown

**Category:** happy-path
**Priority:** must-have

### AC-3: Loading a template pre-fills the mapping for matching column headers
**Given** a user selects a saved template from the dropdown
**When** the template is applied to the current file's headers
**Then** any source column whose name exactly matches a column name stored in the template is pre-mapped to the corresponding CRM field; non-matching columns remain unmapped

**Category:** happy-path
**Priority:** must-have

### AC-4: Loading a template with no matching headers is handled gracefully
**Given** a user loads a template
**When** none of the current file's column headers match any column name in the template
**Then** the mapping screen remains with all columns unmapped, and an inline notice reads "No columns in this file matched the template. You can map them manually."

**Category:** edge-case
**Priority:** must-have

### AC-5: Templates from a different entity type do not appear in the dropdown
**Given** a user has a saved contacts mapping template
**When** the user runs a deals import and opens the mapping screen
**Then** the contacts template does not appear in the "Load template" dropdown

**Category:** edge-case
**Priority:** must-have

### AC-6: User can rename a template
**Given** a user has a saved template named "Old Export"
**When** the user selects "Rename" and enters "Salesforce Weekly"
**Then** the template is renamed; the updated name appears in the dropdown immediately

**Category:** happy-path
**Priority:** must-have

### AC-7: User can delete a template
**Given** a user has a saved template
**When** the user selects "Delete" and confirms the deletion
**Then** the template is removed; it no longer appears in the "Load template" dropdown; a success message reads "Template deleted."

**Category:** happy-path
**Priority:** must-have

### AC-8: Template name must be unique per user per entity type
**Given** a user already has a contacts template named "Salesforce Export"
**When** the user attempts to save another contacts template with the same name
**Then** the save is rejected with "A template named 'Salesforce Export' already exists for contacts. Please choose a different name or rename the existing template."

**Category:** edge-case
**Priority:** must-have

### AC-9: Template name cannot be blank or exceed 100 characters
**Given** a user is saving a template
**When** the user submits a blank name or a name longer than 100 characters
**Then** the save is rejected with an inline error: "Template name is required and must be 100 characters or fewer."

**Category:** boundary
**Priority:** must-have

### AC-10: Another user's templates are not visible
**Given** User A has saved a contacts template
**When** User B opens the mapping screen for a contacts import
**Then** User A's template does not appear in User B's "Load template" dropdown

**Category:** security
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to any template endpoint (save, load list, rename, delete)
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without import permission
**When** a request is made to any template endpoint
**Then** the system returns 403 Forbidden with `"required_permission": "imports:create"`

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Template save fails (DB error) | Display "Failed to save template. Please try again." | must-have |
| Template delete fails (DB error) | Display "Failed to delete template. Please try again." | must-have |
| Template to rename/delete not found | Return 404; refresh template list | must-have |

### Performance
- **Template list load:** Returns within 500ms p95
- **Scale:** Each user may have up to an undefined number of templates (cap TBD — see Open Questions); list endpoint must be paginated if over 50 per entity type

### Security
- **Authorization:** All template CRUD endpoints must verify that the template's `owner_user_id` matches the session user before any mutation; return 403 if mismatch
- **Input validation:** Template name is sanitized to prevent XSS before storage and rendering

### Accessibility
- "Load template" dropdown must be keyboard-navigable
- Delete confirmation must be a modal (not browser `confirm()`) for screen reader compatibility

## Open Questions
- Template count limit: Is there a maximum number of templates per user? If unbounded, the list endpoint should be paginated.
- Template matching: Should template application use exact column name matching (case-sensitive) or case-insensitive? Recommend case-insensitive to reduce friction.
- G-11: Permission model (`imports:create`) not yet assigned to specific roles.

---

# Acceptance Criteria: VALID-01 — Standard field validation — email, phone, required fields, and encoding

## Refined Story Statement
As the system, I want to validate every row of an imported file against standard field rules (email format, phone format, required fields) and parse the file safely regardless of its character encoding, so that invalid or malformed data is identified before anything is written to the database.

## Assumptions
- Validation runs on the full file, not just the preview rows — **Confirmed**
- Per-row validation results are stored in the `ImportJob` record (or a related `ImportJobRow` table) — **Confirmed**
- `charset-normalizer` (preferred over `chardet`) is used for encoding detection — **Confirmed**
- BOM markers are stripped before any parsing begins — **Confirmed**
- `.xlsx` cell values are coerced to strings before validation — **Confirmed**
- Email validation uses RFC 5322-compatible pattern (not just `@` presence check) — **Confirmed**
- Phone validation accepts international formats; unrecognizable strings (not parseable by a standard library such as `phonenumbers`) are flagged — **Confirmed**
- Date validation is handled in VALID-04, not here — **Confirmed**
- Uniqueness checks are handled in VALID-02, not here — **Confirmed**
- Enum/custom field checks are handled in VALID-03, not here — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-13: Date format handling | Out of scope for VALID-01 — fully addressed in VALID-04 | Out of Scope (see VALID-04) |
| G-7: One entity type per import | Addressed — required field schema used for validation is scoped to the entity type recorded on the ImportJob | AC-3 |
| G-11: Roles/permissions | VALID-01 is a system-triggered background process; auth AC covers the trigger endpoint and result-read endpoint | AC-AUTH-1, AC-AUTH-2 |

## Acceptance Criteria

### AC-1: File encoding is detected and file is parsed without corruption
**Given** a file is uploaded in a non-UTF-8 encoding (e.g., ISO-8859-1, Windows-1252)
**When** the validation engine begins processing the file
**Then** `charset-normalizer` detects the encoding, the file is decoded to UTF-8, and subsequent validation operates on correctly decoded strings

**Category:** happy-path
**Priority:** must-have

### AC-2: BOM markers are stripped before parsing
**Given** a CSV file begins with a UTF-8 BOM (`\xef\xbb\xbf`)
**When** the validation engine parses the file
**Then** the BOM is stripped before column header and data parsing, and the first column header does not begin with the BOM character

**Category:** edge-case
**Priority:** must-have

### AC-3: Low-confidence encoding detection surfaces a warning
**Given** `charset-normalizer` returns an encoding detection confidence below 80%
**When** the validation engine processes the file
**Then** all rows are still validated using the detected encoding, but a warning is recorded on the `ImportJob`: "Encoding detection confidence was low ([X]%). If characters appear garbled in the preview, re-save your file as UTF-8."

**Category:** edge-case
**Priority:** should-have

### AC-4: Valid email addresses pass validation
**Given** a row contains an email field value that conforms to RFC 5322 format (e.g., `user@example.com`)
**When** email validation runs on that row
**Then** the row is not flagged with an email error

**Category:** happy-path
**Priority:** must-have

### AC-5: Invalid email addresses are flagged with a row-level error
**Given** a row contains an email value that does not conform to RFC 5322 (e.g., `not-an-email`, `user@`, `@domain.com`)
**When** email validation runs on that row
**Then** the row is flagged with error code `INVALID_EMAIL` and description "Invalid email format: '[value]'"

**Category:** error-handling
**Priority:** must-have

### AC-6: Valid phone numbers in international formats pass validation
**Given** a row contains a phone field value recognizable as a valid international phone number (e.g., `+1 415 555 0100`, `+44 20 7946 0958`)
**When** phone validation runs on that row
**Then** the row is not flagged with a phone error

**Category:** happy-path
**Priority:** must-have

### AC-7: Unrecognizable phone strings are flagged with a row-level error
**Given** a row contains a phone value that cannot be parsed as a valid phone number (e.g., `abc123`, `000-000-0000` where structurally invalid)
**When** phone validation runs on that row
**Then** the row is flagged with error code `INVALID_PHONE` and description "Unrecognizable phone number format: '[value]'. Use international format (e.g., +1 415 555 0100)."

**Category:** error-handling
**Priority:** must-have

### AC-8: Rows missing required fields are flagged
**Given** the entity type schema requires `email` and `first_name` for contacts
**When** a row has no value for `first_name` (mapped column is empty or whitespace-only)
**Then** the row is flagged with error code `MISSING_REQUIRED_FIELD` and description "Required field 'First Name' is missing."

**Category:** error-handling
**Priority:** must-have

### AC-9: A row can carry multiple validation errors simultaneously
**Given** a row has an invalid email AND is missing a required field
**When** validation runs on that row
**Then** both errors are recorded for that row (not short-circuited after the first error); the row's status is `error`

**Category:** edge-case
**Priority:** must-have

### AC-10: .xlsx numeric cells are coerced to strings before validation
**Given** an .xlsx file contains a column mapped to "Phone" where some cells are formatted as numbers (e.g., `14155550100` without the leading `+`)
**When** the validation engine reads the cell
**Then** the numeric value is converted to its string representation before phone validation runs, preventing a Python type error

**Category:** edge-case
**Priority:** must-have

### AC-11: .xlsx date-typed cells are preserved as strings for VALID-04
**Given** an .xlsx file contains a column mapped to a date field where cells have Excel date type
**When** VALID-01 reads the cell
**Then** the cell value is preserved as an ISO 8601 string (`YYYY-MM-DD`) representation of the Excel serial date, and VALID-04 handles further date validation

**Category:** edge-case
**Priority:** must-have

### AC-12: Per-row results are stored on the ImportJob
**Given** validation of all rows is complete
**When** the validation pass finishes
**Then** each row's result (status: `valid` or `error`; list of error codes and descriptions) is persisted to the `ImportJob`, queryable for the preview and error report steps

**Category:** happy-path
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to trigger validation or retrieve validation results for an `ImportJob`
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without import permission
**When** a request is made to trigger validation or retrieve validation results
**Then** the system returns 403 Forbidden with `"required_permission": "imports:create"`

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| File cannot be read from S3 during validation | Mark ImportJob status as `validation_failed`; store error "Source file could not be read from storage." | must-have |
| Validation Celery task crashes mid-run | Task is retried up to 3 times with exponential backoff; if all retries fail, ImportJob status → `validation_failed` | must-have |
| File contains zero data rows (header only) | Mark ImportJob as `validation_complete`; 0 valid, 0 invalid; user sees empty preview with message "Your file contained no data rows." | must-have |

### Performance
- **Throughput:** Validation engine must process at least 10,000 rows per minute per Celery worker
- **Scale:** Must handle files up to 50MB / 100,000 rows without memory exhaustion (stream-parse, do not load full file into memory)

### Security
- **Input validation:** File content is never executed; all values treated as strings
- **Authorization:** Validation is triggered only for `ImportJob` records owned by the requesting user

### Accessibility
- N/A — this is a backend processing step with no direct UI surface

## Open Questions
- G-11: Role list for `imports:create` not yet assigned.
- Low-confidence encoding: What is the threshold for confidence below which validation should be blocked entirely (vs. warned)? 50%? Recommend defining a hard floor.

---

# Acceptance Criteria: VALID-02 — Uniqueness validation — intra-file dedup and DB check for contacts

## Refined Story Statement
As the system, I want to identify duplicate email addresses within the uploaded file and against existing contact records in the CRM database, so that no duplicate contacts are created.

## Assumptions
- VALID-02 runs after VALID-01 has completed on all rows — **Confirmed**
- Both rows sharing a duplicate email within the same file are flagged as errors (neither is imported) — **Confirmed** (G-15)
- DB uniqueness check is batched in chunks of 1,000 rows to avoid query size limits — **Confirmed**
- An index on `contacts.email` is a required deliverable of this story — **Confirmed**
- Uniqueness checks apply to contacts only in v1; companies and deals have no natural key uniqueness check — **Confirmed** (G-3 assumed)
- Case-insensitive email comparison is used for dedup — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-3: Uniqueness scope (contacts only, or also companies/deals) | Addressed — contacts only in v1; companies and deals explicitly out of scope | AC-5, Open Questions |
| G-15: Intra-file duplicate handling (which row wins) | Addressed — both rows flagged as errors, neither imported | AC-2 |
| G-11: Roles/permissions | Addressed via auth AC on trigger/result endpoints | AC-AUTH-1, AC-AUTH-2, Open Questions |

## Acceptance Criteria

### AC-1: Intra-file dedup pass runs before DB check
**Given** VALID-01 has completed
**When** the uniqueness validation pass begins
**Then** the engine first scans all rows in the file for duplicate email values before making any DB queries

**Category:** happy-path
**Priority:** must-have

### AC-2: Both rows sharing a duplicate email in the file are flagged as errors
**Given** rows 12 and 47 in the file share the same email `alice@example.com`
**When** the intra-file dedup pass runs
**Then** both row 12 and row 47 are flagged with error code `INTRA_FILE_DUPLICATE_EMAIL` and description "Duplicate email within import file — also appears on row [N]. Neither row will be imported." where [N] is the other row's number

**Category:** error-handling
**Priority:** must-have

### AC-3: Three or more rows sharing the same email are all flagged
**Given** rows 5, 18, and 33 all share `bob@example.com`
**When** the intra-file dedup pass runs
**Then** all three rows are flagged with `INTRA_FILE_DUPLICATE_EMAIL` and their error messages reference the other conflicting row numbers

**Category:** edge-case
**Priority:** must-have

### AC-4: DB uniqueness check runs against existing contacts in batches of 1,000
**Given** the file contains 3,500 rows that passed intra-file dedup
**When** the DB uniqueness check runs
**Then** the engine issues 4 batched `WHERE email IN (...)` queries (batches of 1,000) against the `contacts` table, not a single query with 3,500 values

**Category:** happy-path
**Priority:** must-have

### AC-5: Rows with emails matching existing contact records are flagged
**Given** a row's email matches an existing contact record in the CRM
**When** the DB uniqueness check runs
**Then** that row is flagged with error code `DUPLICATE_CONTACT_EMAIL` and description "A contact with email '[value]' already exists in the CRM (Contact ID: [id])."

**Category:** error-handling
**Priority:** must-have

### AC-6: Contacts entity type check only — companies and deals rows are not subject to email uniqueness
**Given** an import job is for the `companies` entity type
**When** VALID-02 runs
**Then** no email uniqueness check is performed (intra-file or DB); a note is recorded on the ImportJob: "Uniqueness validation not applicable for companies imports in v1."

**Category:** edge-case
**Priority:** must-have

### AC-7: Rows that pass all uniqueness checks carry no uniqueness error
**Given** a row's email is unique within the file and does not exist in the CRM
**When** VALID-02 completes
**Then** that row has no uniqueness error and its status from VALID-01 is unchanged (valid unless another error type was found)

**Category:** happy-path
**Priority:** must-have

### AC-8: DB index on contacts.email exists as a deliverable
**Given** VALID-02 is shipped
**When** the migration for this story runs
**Then** a database index on `contacts(email)` exists and is verified via a migration test

**Category:** happy-path
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to trigger uniqueness validation or retrieve its results
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without import permission
**When** a request is made to trigger uniqueness validation or retrieve its results
**Then** the system returns 403 Forbidden with `"required_permission": "imports:create"`

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| DB query fails during batch uniqueness check | Retry the failing batch up to 3 times; if all fail, mark ImportJob `validation_failed` with error "Uniqueness check could not complete." | must-have |
| `contacts.email` index missing at runtime | Log a critical error; do not silently skip uniqueness check — surface "DB configuration error: uniqueness check unavailable." | must-have |

### Performance
- **DB query time:** Each batch of 1,000 email lookups must complete within 200ms p95 (requires the email index)
- **Scale:** Must handle 100,000-row files; batching strategy must not load all emails into application memory simultaneously — stream-process in chunks

### Security
- **Input validation:** Email values are passed as parameterized query values, not interpolated into SQL (prevents SQL injection)
- **Authorization:** Uniqueness check only runs against the entity type and records the requesting user is permitted to view

### Accessibility
- N/A — backend processing step

## Open Questions
- G-3 (deferred): Uniqueness check for companies and deals. What is the natural key for each? (e.g., company name + domain?) This must be addressed before companies or deals imports are enabled.
- Case sensitivity: Should `Alice@Example.com` and `alice@example.com` be treated as duplicates? Recommend yes (case-insensitive). Must be confirmed — affects both intra-file dedup and DB index strategy.
- G-11: Role/permission list not yet defined.

---

# Acceptance Criteria: VALID-03 — Custom field type and enum validation

## Refined Story Statement
As the system, I want to validate custom field values against their configured types and allowed enum options, so that imported data respects the CRM's custom field constraints and data integrity is maintained.

## Assumptions
- Custom field definitions (type, enum options) are read from the CRM's field configuration at validation time — **Confirmed**
- Enum comparison is case-insensitive — **Confirmed**
- Enum mismatch fails the row, not the entire import — **Confirmed** (G-9)
- Valid custom field types are: `text`, `number`, `boolean`, `date`, `enum` — **Confirmed**
- Date custom fields are validated by VALID-04 (not VALID-03) — **Confirmed**
- VALID-03 runs after VALID-01 — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-9: Enum mismatch behavior — fail row or fail import | Addressed — fail the row only; import can proceed with valid rows via partial import | AC-3, AC-4 |
| G-11: Roles/permissions | Addressed via auth AC on trigger/result endpoints | AC-AUTH-1, AC-AUTH-2, Open Questions |

## Acceptance Criteria

### AC-1: Valid enum value passes validation (case-insensitive)
**Given** a custom field `Lead Source` has allowed values `["Web", "Referral", "Event"]`
**And** a row contains `lead_source = "referral"` (lowercase)
**When** VALID-03 runs
**Then** the row is not flagged with an enum error for `Lead Source`

**Category:** happy-path
**Priority:** must-have

### AC-2: Invalid enum value flags the row with an informative error
**Given** `Lead Source` has allowed values `["Web", "Referral", "Event"]`
**And** a row contains `lead_source = "Cold Call"`
**When** VALID-03 runs
**Then** the row is flagged with error code `INVALID_ENUM_VALUE` and description: "Invalid value for 'Lead Source': 'Cold Call'. Allowed values are: Web, Referral, Event."

**Category:** error-handling
**Priority:** must-have

### AC-3: Enum mismatch fails only the affected row, not the whole import
**Given** 500 rows in a file and row 42 has an invalid enum value
**When** VALID-03 runs and the import is committed with partial import enabled
**Then** row 42 is skipped and rows 1–41 and 43–500 (that are otherwise valid) are imported

**Category:** error-handling
**Priority:** must-have

### AC-4: Invalid number field value (non-numeric) flags the row
**Given** a custom field `Revenue` is of type `number`
**And** a row contains `revenue = "high"`
**When** VALID-03 runs
**Then** the row is flagged with error code `INVALID_FIELD_TYPE` and description: "Invalid value for 'Revenue': 'high' is not a valid number."

**Category:** error-handling
**Priority:** must-have

### AC-5: Invalid boolean field value flags the row
**Given** a custom field `Is Customer` is of type `boolean`
**And** a row contains `is_customer = "maybe"`
**When** VALID-03 runs
**Then** the row is flagged with error code `INVALID_FIELD_TYPE` and description: "Invalid value for 'Is Customer': 'maybe' is not a valid boolean. Use true/false or 1/0."

**Category:** error-handling
**Priority:** must-have

### AC-6: Boolean field accepts flexible truthy/falsy representations
**Given** a custom field `Is Customer` is of type `boolean`
**When** a row contains any of `"true"`, `"True"`, `"TRUE"`, `"1"`, `"yes"`, `"false"`, `"False"`, `"FALSE"`, `"0"`, `"no"`
**Then** the row is not flagged with a boolean error (values are normalized to `true` or `false`)

**Category:** edge-case
**Priority:** must-have

### AC-7: Empty value for a non-required custom field is not flagged
**Given** a custom field `Notes` (type: text) is not required
**And** a row has an empty value for `notes`
**When** VALID-03 runs
**Then** the row is not flagged with any error for `Notes`

**Category:** edge-case
**Priority:** must-have

### AC-8: Valid text and number fields pass without error
**Given** a custom field `Score` is of type `number` and a row contains `score = "87.5"`
**When** VALID-03 runs
**Then** the row is not flagged with a type error for `Score`

**Category:** happy-path
**Priority:** must-have

### AC-9: VALID-03 does not re-flag errors already captured by VALID-01
**Given** a row has already been flagged by VALID-01 for an invalid email
**When** VALID-03 runs on the same row
**Then** the VALID-01 errors are preserved and VALID-03 errors (if any) are appended — not replaced

**Category:** edge-case
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to trigger custom field validation or retrieve results
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without import permission
**When** a request is made to trigger custom field validation or retrieve results
**Then** the system returns 403 Forbidden with `"required_permission": "imports:create"`

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Custom field definition deleted between upload and validation | Skip validation for that field; log a warning: "Custom field '[name]' no longer exists — skipping." | should-have |
| Enum options list is empty for an enum field | Skip enum validation for that field; log a warning | should-have |

### Performance
- **Response time:** VALID-03 adds no more than 10% overhead per row compared to VALID-01 alone
- **Scale:** Custom field definitions are cached per ImportJob run (fetched once, not per row)

### Security
- **Input validation:** Enum option values are retrieved from the database, not from the import file — no user-supplied values enter the allowed-values comparison set
- **Authorization:** Custom field definitions are scoped to the entity type; no cross-entity field definitions are accessible

### Accessibility
- N/A — backend processing step

## Open Questions
- G-11: Role/permission list not yet defined.
- Number field precision: Should numbers like `1.23456789012345` be accepted as-is, or is there a precision limit? If truncation occurs, is that silent or flagged?

---

# Acceptance Criteria: VALID-04 — Date field validation — flag ambiguous and inconsistent formats

## Refined Story Statement
As the system, I want to flag date field values that are ambiguous or unrecognizable as row-level errors rather than coercing or guessing, so that no silent date corruption (e.g., month/day transposition) occurs during import.

## Assumptions
- ISO 8601 (`YYYY-MM-DD`) is the only unambiguous format that is always accepted — **Confirmed**
- Any date value that cannot be unambiguously parsed is flagged as an error — **Confirmed** (G-13 resolved)
- Auto-coercion of any date format is explicitly out of scope — **Confirmed**
- User-specified format masks are out of scope — **Confirmed**
- VALID-04 runs after VALID-01 — **Confirmed**
- `.xlsx` date cells coerced to ISO 8601 strings by VALID-01 are subject to VALID-04 date logic — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-13: Date format handling — auto-detect vs. user-specified vs. reject | Fully addressed — reject ambiguous formats with a specific error message; ISO 8601 only | AC-2, AC-3, AC-4 |
| G-11: Roles/permissions | Addressed via auth AC on trigger/result endpoints | AC-AUTH-1, AC-AUTH-2, Open Questions |

## Acceptance Criteria

### AC-1: ISO 8601 date values are accepted
**Given** a date field contains `2024-03-15`
**When** VALID-04 runs
**Then** the row is not flagged with a date error for that field

**Category:** happy-path
**Priority:** must-have

### AC-2: Ambiguous date formats are flagged with an explanatory error
**Given** a date field contains an ambiguous value such as `01/02/03` or `03-04-05`
**When** VALID-04 runs
**Then** the row is flagged with error code `AMBIGUOUS_DATE` and description: "Cannot determine date order for '[value]' — month/day/year ordering is ambiguous. Use YYYY-MM-DD format."

**Category:** error-handling
**Priority:** must-have

### AC-3: Clearly invalid dates (impossible values) are flagged with a distinct error
**Given** a date field contains `2024-13-01` (month 13) or `2024-02-30`
**When** VALID-04 runs
**Then** the row is flagged with error code `INVALID_DATE` and description: "Invalid date '[value]' — this date does not exist."

**Category:** error-handling
**Priority:** must-have

### AC-4: Non-date strings in date fields are flagged
**Given** a date field contains `not-a-date` or `Q3 2024`
**When** VALID-04 runs
**Then** the row is flagged with error code `INVALID_DATE` and description: "Unrecognizable date value '[value]'. Use YYYY-MM-DD format."

**Category:** error-handling
**Priority:** must-have

### AC-5: Rows with date errors participate in partial import
**Given** a row has a date error and partial import is enabled
**When** the import is committed
**Then** the row is skipped (not imported) and counted in the "skipped" tally; the user can download the error report to review all date-flagged rows

**Category:** error-handling
**Priority:** must-have

### AC-6: ISO 8601 date with time component is handled
**Given** a date field contains `2024-03-15T14:30:00Z` (ISO 8601 with time)
**When** VALID-04 runs
**Then** the date portion `2024-03-15` is extracted and accepted; the time component is discarded (or stored if the field supports datetime — this is a schema-level decision, not a validation failure)

**Category:** edge-case
**Priority:** should-have

### AC-7: Empty value in a non-required date field is not flagged
**Given** a date field is optional and a row has an empty value
**When** VALID-04 runs
**Then** the row is not flagged with a date error

**Category:** edge-case
**Priority:** must-have

### AC-8: .xlsx date-typed cells (converted to ISO 8601 by VALID-01) are accepted
**Given** an .xlsx file contains a date cell that VALID-01 coerced to `2024-03-15`
**When** VALID-04 runs
**Then** the value passes date validation as ISO 8601

**Category:** edge-case
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to trigger date validation or retrieve its results
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without import permission
**When** a request is made to trigger date validation or retrieve its results
**Then** the system returns 403 Forbidden with `"required_permission": "imports:create"`

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| All rows in a file have ambiguous dates | All rows flagged; ImportJob validation completes; user sees 0 valid rows and must decide to cancel or download the error report | must-have |

### Performance
- **Throughput:** Date validation adds no more than 5% overhead per row on top of VALID-01
- **Scale:** Handles 100,000 rows without memory pressure (no bulk pre-loading of date values)

### Security
- **Input validation:** Date string values are parsed using a safe library (no `eval` or dynamic expression evaluation)
- **No silent coercion:** The system never silently corrects a date — all mutations of input are errors or explicit transformations documented in AC-6

### Accessibility
- N/A — backend processing step

## Open Questions
- G-13 (resolved): The decision to reject ambiguous dates is made here. This must be communicated to users upfront in the import UI (e.g., "Dates must be in YYYY-MM-DD format") to reduce validation errors.
- AC-6 edge case: If a CRM date field supports datetime (not just date), should the time component be preserved? Needs schema-level confirmation.
- G-11: Role/permission list not yet defined.

---

# Acceptance Criteria: PREVIEW-01 — Preview first 20 rows with per-row validation status and commit controls

## Refined Story Statement
As a CRM Admin or Power User, I want to see the first 20 rows of my file with their validation status, aggregate error counts for the full file, and commit/cancel controls, so that I can make an informed decision before any data is written to the CRM.

## Assumptions
- Full-file validation (VALID-01 through VALID-04) must be complete before this screen renders — **Confirmed**
- Only the first 20 rows are displayed; validation results exist for all rows — **Confirmed**
- "Partial import" checkbox defaults to **on** — **Confirmed** (G-4 resolved)
- Sync threshold: ≤ 500 rows AND ≤ 500KB → sync processing; otherwise → async — **Confirmed** (G-1 partially resolved for this context)
- Async processing navigates to a progress view (a future story); this AC covers the dispatch, not the progress view itself — **Confirmed**
- "Cancel" discards the import job without writing any data — **Confirmed**
- Error rows are shown with inline error descriptions — **Confirmed**
- Downloading the error report is handled by a separate story (ERROR-02) — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Async threshold undefined | Addressed — threshold set at 500 rows / 500KB for sync; above either limit → async. This is the confirmed default for this story. | AC-7, AC-8, Open Questions |
| G-4: Partial import opt-in vs always-on | Addressed — opt-in checkbox defaulting to on at the commit screen | AC-4, AC-5 |
| G-6: Progress polling vs WebSockets/SSE | Addressed — async imports dispatch a job and navigate to the progress view; polling mechanism is defined in the async processing story (PROC-01). Out of scope for PREVIEW-01. | Out of Scope |
| G-11: Roles/permissions | Addressed via auth AC; role assignment remains open | AC-AUTH-1, AC-AUTH-2, Open Questions |

## Acceptance Criteria

### AC-1: Preview screen renders only after full validation is complete
**Given** validation (VALID-01 through VALID-04) has completed for the ImportJob
**When** the user navigates to the preview screen (or is redirected after completing mapping)
**Then** the screen renders within 2,000ms with the full validation results available

**Category:** happy-path
**Priority:** must-have

### AC-2: Validation in progress — user sees a loading state, not a partial preview
**Given** full validation has not yet completed for the ImportJob
**When** the user attempts to access the preview screen
**Then** the screen shows a loading indicator with "Validating your file... This may take a moment." and does not render any row data until validation is complete

**Category:** edge-case
**Priority:** must-have

### AC-3: First 20 rows displayed with CRM-mapped column headers and per-row status badge
**Given** validation is complete and the file has at least 20 rows
**When** the preview screen renders
**Then** a table shows rows 1–20 using CRM field names as column headers; each row displays a status badge: "Valid" (green) or "Error" (red)

**Category:** happy-path
**Priority:** must-have

### AC-4: Error rows show the error description inline in the table
**Given** row 5 has error "Invalid email format: 'notanemail'"
**When** the preview table renders
**Then** row 5's status badge reads "Error" and the error description is visible inline (tooltip, expandable row, or dedicated error column)

**Category:** happy-path
**Priority:** must-have

### AC-5: Aggregate counts are displayed above the table
**Given** a file has 1,000 rows: 900 valid, 100 with errors
**When** the preview screen renders
**Then** above the table the following counts are displayed: "Total: 1,000 rows | Valid: 900 | Invalid: 100"

**Category:** happy-path
**Priority:** must-have

### AC-6: "Partial import" checkbox defaults to on and is labeled clearly
**Given** the preview screen renders
**When** the user views the commit area
**Then** a checkbox labeled "Import valid rows, skip invalid rows (100 rows will be skipped)" is present and checked by default

**Category:** happy-path
**Priority:** must-have

### AC-7: Commit with partial import off and errors present is blocked
**Given** the preview shows 100 invalid rows and the user unchecks "Partial import"
**When** the user clicks "Commit Import"
**Then** the import does not proceed and an inline message reads: "Your file contains 100 invalid rows. Enable 'Partial import' to skip these rows, or cancel and fix your data."

**Category:** error-handling
**Priority:** must-have

### AC-8: Sync import (≤ 500 rows / 500KB) commits immediately on confirmation
**Given** the ImportJob has 300 rows and the file is 400KB (below both sync thresholds)
**When** the user clicks "Commit Import"
**Then** the import runs synchronously, and the UI transitions to an import completion screen showing final row counts within 30 seconds

**Category:** happy-path
**Priority:** must-have

### AC-9: Async import (> 500 rows or > 500KB) dispatches a background job and navigates to progress view
**Given** the ImportJob has 5,000 rows (above the async threshold)
**When** the user clicks "Commit Import"
**Then** a Celery task is dispatched, the user is immediately navigated to the progress view for this ImportJob, and no import data is written synchronously

**Category:** happy-path
**Priority:** must-have

### AC-10: "Cancel" discards the job without writing any data
**Given** the preview screen is displayed
**When** the user clicks "Cancel"
**Then** a confirmation dialog reads "Cancel import? No data will be written. This cannot be undone."; on confirmation, the ImportJob status is set to `cancelled` and the user is returned to the import history or start screen

**Category:** happy-path
**Priority:** must-have

### AC-11: File with zero valid rows — Commit Import is disabled
**Given** the file has 0 valid rows (all rows have errors) and partial import is on
**When** the preview screen renders
**Then** the "Commit Import" button is disabled and a message reads "No valid rows to import. Fix your data and re-upload."

**Category:** edge-case
**Priority:** must-have

### AC-12: File with fewer than 20 rows shows all rows
**Given** the file has 8 rows
**When** the preview screen renders
**Then** all 8 rows are displayed in the table (not just 20)

**Category:** edge-case
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the preview endpoint or the commit endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without import permission
**When** a request is made to the preview endpoint or the commit endpoint
**Then** the system returns 403 Forbidden with `"required_permission": "imports:create"`

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Commit endpoint fails (DB error) | Return 500; display "Import could not be started. Please try again."; ImportJob remains in `validated` state | must-have |
| Celery task dispatch fails for async import | Return 503; display "Could not queue your import. Please try again."; no ImportJob status change | must-have |
| Preview screen accessed for a cancelled or failed ImportJob | Display "This import is no longer active." with a link to start a new import | must-have |

### Performance
- **Preview render time:** Screen loads within 2,000ms p95 after validation is complete
- **Sync import completion:** Sync imports (≤ 500 rows / ≤ 500KB) complete and surface results within 30 seconds p95
- **Scale:** Preview table renders 20 rows regardless of total file size

### Security
- **Authorization:** User can only access preview for an `ImportJob` they own; 403 if another user's job ID is supplied
- **Input validation:** Commit endpoint validates ImportJob is in `validated` status before dispatching; rejects double-submits with 409 Conflict

### Accessibility
- Status badges ("Valid" / "Error") must not rely on color alone — include an icon or text label for color-blind users
- Table must be keyboard-navigable (row focus, expandable error details accessible via Enter/Space)
- "Commit Import" confirmation must be a modal dialog, not browser `confirm()`, for screen reader compatibility

## Open Questions
- G-1 (deferred): The 500 row / 500KB sync threshold is an assumed default. This must be confirmed by the backend team based on observed sync processing times and server capacity before the sprint starts.
- G-11: Role/permission assignment for `imports:create` not yet defined.
- If a user navigates away from the preview screen before committing, how long does the validated ImportJob persist? Should there be a TTL (e.g., 24 hours) after which the job expires and must be re-uploaded?

---

## Coverage Summary
| # | Story Slug | AC Count | Auth AC | Gap Rows | Status |
|---|-----------|----------|---------|----------|--------|
| 1 | UPLOAD-01 | 10 + 2 auth | Yes | 3 | Complete |
| 2 | UPLOAD-02 | 7 + 2 auth | Yes | 2 | Complete |
| 3 | MAP-01 | 10 + 2 auth | Yes | 3 | Complete |
| 4 | MAP-02 | 10 + 2 auth | Yes | 2 | Complete |
| 5 | VALID-01 | 12 + 2 auth | Yes | 3 | Complete |
| 6 | VALID-02 | 8 + 2 auth | Yes | 3 | Complete |
| 7 | VALID-03 | 9 + 2 auth | Yes | 2 | Complete |
| 8 | VALID-04 | 8 + 2 auth | Yes | 2 | Complete |
| 9 | PREVIEW-01 | 12 + 2 auth | Yes | 4 | Complete |
| **Total** | **9 stories** | **86 AC (68 functional + 18 auth)** | **All 9** | **24 gap rows** | **Complete** |


<!-- STORY COUNT: 10 stories to process -->

# Acceptance Criteria: ASYNC-01 — Sync/async routing and Celery task dispatch

## Refined Story Statement
As a System, I want to route import jobs below threshold synchronously and dispatch large imports as idempotent Celery background tasks, so that users get immediate results for small files and non-blocking processing for large ones.

## Assumptions
- Threshold: ≤ 500 rows **AND** ≤ 500KB → synchronous; either limit exceeded → async — **Unconfirmed** (story states this but G-1 flags it as a product decision)
- Entity type is selected at upload time (one type per import run, per G-7) — **Confirmed**
- Partial import flag from the commit screen is passed to the Celery task — **Confirmed**
- Each imported record is tagged with `import_job_id` at write time — **Confirmed**
- ETR uses rolling rows/sec average — **Confirmed** (G-10 assumed)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Async threshold undefined | Partially addressed — story defines ≤500 rows AND ≤500KB as sync threshold; threshold values remain unconfirmed by product | Open Question OQ-1 |
| G-6: Polling vs. WebSocket/SSE | Out of Scope for this story — polling UI is ASYNC-02; this story only dispatches the Celery task and returns job_id | Out of Scope |
| G-7: Mixed entity types per import | Addressed — single entity type per import run assumed; entity_type must be present on ImportJob record | AC-3 |
| G-10: ETR algorithm | Addressed — rolling rows/sec average computed from `update_state` metadata | AC-7 |
| G-11: Auth/authorization for import trigger | Deferred — roles who can trigger imports not formally defined in input | Open Question OQ-2 |

## Acceptance Criteria

### AC-1: Synchronous path for small imports
**Given** a validated import job where the file contains ≤ 500 rows AND the file size is ≤ 500KB
**When** the user confirms commit on the preview screen
**Then** the import executes synchronously in the request/response cycle, and the API returns a completed ImportJob response (status: `complete`, with final row counts) within the same HTTP response, with no Celery task dispatched

**Category:** happy-path
**Priority:** must-have

### AC-2: Async path for large imports (row threshold)
**Given** a validated import job where the file contains more than 500 rows (regardless of file size)
**When** the user confirms commit on the preview screen
**Then** the system dispatches a Celery task and immediately returns HTTP 202 with the `import_job_id`, and the ImportJob record has status `pending`

**Category:** happy-path
**Priority:** must-have

### AC-3: Async path for large imports (size threshold)
**Given** a validated import job where the file size exceeds 500KB (regardless of row count)
**When** the user confirms commit on the preview screen
**Then** the system dispatches a Celery task and immediately returns HTTP 202 with the `import_job_id`, and the ImportJob record has status `pending`

**Category:** edge-case
**Priority:** must-have

### AC-4: ImportJob record lifecycle
**Given** an async import job is dispatched
**When** the Celery task starts processing
**Then** the ImportJob record is updated to status `processing` with a `started_at` timestamp; on each progress tick the record is updated with current `rows_processed`, `rows_total`, `rows_imported`, `rows_skipped`, `rows_failed`; on task completion the record is updated to status `complete` with a `completed_at` timestamp and final counts; on task failure the record is updated to status `failed` with `error_message`

**Category:** happy-path
**Priority:** must-have

### AC-5: Each imported record tagged with import_job_id
**Given** an import job (sync or async) is processing
**When** a record is written to the database
**Then** the record's `import_job_id` foreign key is set to the current ImportJob's ID at write time, with no exceptions for any row in the import

**Category:** happy-path
**Priority:** must-have

### AC-6: Celery task idempotency on retry
**Given** a Celery task for an import job fails mid-run and is retried
**When** the retried task runs
**Then** rows already successfully imported are not re-imported (the task resumes from the last committed checkpoint, not from row 1), and the final ImportJob counts reflect only unique successful insertions

**Category:** edge-case
**Priority:** must-have

### AC-7: ETR computed as rolling rows/sec average
**Given** an async import task is running
**When** the task calls `update_state`
**Then** `estimated_seconds_remaining` is computed as `(rows_total - rows_processed) / rolling_rows_per_second`, where `rolling_rows_per_second` is the average throughput over the last 10 progress ticks; if fewer than 2 ticks have elapsed, ETR is `null`

**Category:** happy-path
**Priority:** should-have

### AC-8: Partial import flag honored inside the task
**Given** an import job is dispatched with `partial_import = true`
**When** the Celery task processes a row that fails validation
**Then** the row is skipped (not imported) and counted in `rows_skipped`; processing continues to the next row without aborting the task

**Category:** happy-path
**Priority:** must-have

### AC-9: Partial import disabled — any invalid row aborts
**Given** an import job is dispatched with `partial_import = false`
**When** the Celery task encounters a row that fails validation
**Then** the entire import is rolled back (no records from this job remain in the database), the ImportJob is set to status `failed`, and `error_message` identifies the first failing row number and error type

**Category:** edge-case
**Priority:** must-have

### AC-10: Sync import within transaction — failure rolls back
**Given** a synchronous import job is executing
**When** a database error occurs mid-import (e.g., constraint violation, connection failure)
**Then** the entire import is rolled back atomically, no partial records are persisted, and the API returns HTTP 500 with an ImportJob record at status `failed`

**Category:** error-handling
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a POST request is made to the import commit endpoint
**Then** the system returns 401 Unauthorized with no import job created

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without import permission (e.g., Read Only role)
**When** a POST request is made to the import commit endpoint
**Then** the system returns 403 Forbidden with a message identifying the missing permission, and no import job is created

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Celery broker unreachable at dispatch time | API returns HTTP 503 with message "Import service temporarily unavailable — try again in a few minutes"; no ImportJob created | must-have |
| Celery task exceeds hard time limit | Task marked as failed, ImportJob status set to `failed`, error_message set to "Task exceeded maximum runtime" | must-have |
| Database write fails mid-async task | Task retried up to 3 times with exponential backoff; if all retries fail, ImportJob set to `failed` | must-have |

### Performance
- **Sync path response time:** < 5 seconds for ≤ 500 rows, ≤ 500KB at p95
- **Async dispatch response time:** < 500ms p95 (just dispatching the task, not processing)
- **Scale:** Must support 10 concurrent import jobs without task queue starvation

### Security
- **Input validation:** `import_job_id` must be a UUID; commit endpoint must verify the ImportJob belongs to the requesting user before executing
- **Authorization:** Import trigger requires a confirmed import-capable role (pending G-11 resolution)

### Accessibility
- N/A — this story is backend-only

## Open Questions
- **OQ-1 (G-1):** Are 500 rows and 500KB the confirmed thresholds for async routing, or does the product team want different values? Wrong thresholds create UX degradation (sync timeout) or unnecessary overhead (async for tiny files).
- **OQ-2 (G-11):** Which roles are permitted to trigger imports? Can Power Users commit imports, or is it CRM Admin only? This directly gates the AC-AUTH-2 permission check.

---

# Acceptance Criteria: ASYNC-02 — Progress tracking endpoint and polling UI

## Refined Story Statement
As a CRM Admin or Power User, I want to see a progress bar with percentage complete and estimated time remaining while my import runs in the background, so that I know it is proceeding and can estimate when to check back.

## Assumptions
- Frontend polls `GET /imports/{job_id}/status` every 3 seconds while status is `pending` or `processing` — **Confirmed** (G-6 assumed: polling over SSE)
- Polling stops automatically when status is `complete` or `failed` — **Confirmed**
- ETR is `null` until at least 2 progress ticks are available — **Confirmed** (from ASYNC-01 AC-7)
- No email notification on completion in v1 — **Confirmed** (G-14 assumed)
- A user can only poll status for their own import jobs (unless CRM Admin) — **Unconfirmed** (G-11 deferred)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-6: Polling vs. WebSocket/SSE | Addressed — HTTP polling at 3s interval confirmed for v1; SSE explicitly out of scope | AC-1, AC-3 |
| G-10: ETR algorithm | Addressed by reference — ETR computed in ASYNC-01; this story surfaces `estimated_seconds_remaining` from the status endpoint | AC-2 |
| G-11: Roles for viewing progress | Deferred — who can query another user's job status is unresolved | Open Question OQ-1 |
| G-14: Completion notification | Addressed — in-app notification is ASYNC-03; this story provides inline summary on the progress page when polling detects completion | AC-5 |

## Acceptance Criteria

### AC-1: Status endpoint returns expected fields
**Given** an ImportJob exists with the given `job_id`
**When** `GET /imports/{job_id}/status` is called by an authenticated user with access to that job
**Then** the response returns HTTP 200 with JSON containing: `status` (one of `pending`, `processing`, `complete`, `failed`), `rows_processed` (integer), `rows_total` (integer), `rows_imported` (integer), `rows_skipped` (integer), `rows_failed` (integer), `estimated_seconds_remaining` (integer or null)

**Category:** happy-path
**Priority:** must-have

### AC-2: ETR is null until sufficient data exists
**Given** an ImportJob has received fewer than 2 `update_state` progress ticks
**When** `GET /imports/{job_id}/status` is called
**Then** `estimated_seconds_remaining` is `null` in the response (frontend renders "Calculating…" in place of a time value)

**Category:** edge-case
**Priority:** should-have

### AC-3: Frontend polls every 3 seconds while job is active
**Given** the user is on the import progress page and the ImportJob status is `pending` or `processing`
**When** the progress page is rendered
**Then** the frontend initiates a polling loop that calls `GET /imports/{job_id}/status` every 3 seconds, and continues polling as long as status remains `pending` or `processing`

**Category:** happy-path
**Priority:** must-have

### AC-4: Progress bar renders rows_processed / rows_total as percentage
**Given** a polling response returns `rows_processed = 3000` and `rows_total = 10000`
**When** the progress bar is rendered
**Then** the progress bar fills to 30% and displays "3,000 / 10,000 rows" alongside the percentage

**Category:** happy-path
**Priority:** must-have

### AC-5: Polling stops and summary renders on completion
**Given** the frontend is polling and a response returns status `complete`
**When** the polling loop receives this response
**Then** polling stops immediately (no further requests are made), the progress bar renders at 100%, and a summary panel appears showing final counts: rows imported, rows skipped, rows failed, with a link to the import history entry

**Category:** happy-path
**Priority:** must-have

### AC-6: Polling stops and error state renders on failure
**Given** the frontend is polling and a response returns status `failed`
**When** the polling loop receives this response
**Then** polling stops immediately, the progress bar is replaced by an error state, and the message "Import failed — see import history for details" is displayed with a link to the import history entry

**Category:** error-handling
**Priority:** must-have

### AC-7: Status endpoint returns 404 for unknown job_id
**Given** a `job_id` that does not exist in the system
**When** `GET /imports/{job_id}/status` is called
**Then** the API returns HTTP 404 with a message "Import job not found"

**Category:** error-handling
**Priority:** must-have

### AC-8: Frontend handles polling network errors gracefully
**Given** the frontend is polling and a network request fails (timeout, 5xx)
**When** the error occurs
**Then** the UI displays "Connection issue — retrying…" and continues polling; after 5 consecutive failed requests, polling stops and the UI displays "Unable to retrieve status — check import history for updates"

**Category:** error-handling
**Priority:** must-have

### AC-9: ETR displayed in human-readable form
**Given** `estimated_seconds_remaining` is 185
**When** the progress page renders the ETR
**Then** the UI displays "About 3 minutes remaining" (rounding to nearest minute for values ≥ 60s; displaying seconds for values < 60s)

**Category:** edge-case
**Priority:** should-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to `GET /imports/{job_id}/status`
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated Power User requesting the status of an import job that belongs to a different user
**When** `GET /imports/{job_id}/status` is called
**Then** the system returns 403 Forbidden (pending G-11 resolution — see Open Questions)

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Status endpoint called for a sync import (no job_id) | Not applicable — sync imports return the result in the commit response; no status endpoint call is made | N/A |
| `rows_total` is 0 at the time of first poll (task not yet started) | Return `rows_processed: 0`, `rows_total: 0`, `estimated_seconds_remaining: null`; frontend shows "Starting…" | must-have |

### Performance
- **Response time:** `GET /imports/{job_id}/status` returns within 100ms p95 (served from ImportJob record, not re-computed)
- **Scale:** Endpoint must handle 100 concurrent pollers (100 simultaneous active imports) without degradation

### Security
- **Authorization:** Status endpoint must verify the requesting user owns the ImportJob, or is a CRM Admin, before returning data (pending G-11 confirmation)
- **Input validation:** `job_id` must be validated as a UUID format before querying; invalid format returns 400

### Accessibility
- Progress bar must have an `aria-valuenow`, `aria-valuemin`, `aria-valuemax` attributes and a visible text label
- Status changes must be announced to screen readers via an `aria-live` region

## Open Questions
- **OQ-1 (G-11):** Can a CRM Admin query the status of any user's import job, or only their own? This determines the authorization logic on the status endpoint. AC-AUTH-2 is written with the assumption that cross-user access is admin-only — confirm or correct.

---

# Acceptance Criteria: ASYNC-03 — In-app completion notification

## Refined Story Statement
As a CRM Admin or Power User, I want to receive an in-app notification when my background import finishes, so that I know the result even if I have navigated away from the progress page.

## Assumptions
- Notifications are created server-side when ImportJob reaches `complete` or `failed` — **Confirmed**
- Notification is scoped to the user who initiated the import — **Confirmed**
- No email, push, or SMS notifications in v1 — **Confirmed** (G-14 assumed)
- A notification tray (bell icon) already exists in the application shell — **Unconfirmed** (story assumes this UI component exists)
- Notifications are not created when the user is still on the progress page (polling surfaces the result instead) — **Unconfirmed** (story says "notification is the fallback" but does not specify mutual exclusivity)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-11: Roles for notifications | Addressed — notifications delivered to the importing user only; no cross-user notification scope | AC-1 |
| G-14: Completion notification method | Addressed — in-app notification tray only; email/push/SMS explicitly out of scope for v1 | AC-1, AC-2 |

## Acceptance Criteria

### AC-1: Notification created on import completion
**Given** a background ImportJob transitions to status `complete`
**When** the transition occurs (Celery task finishes successfully)
**Then** an in-app notification is created for the user who initiated the import, containing: entity type, original filename, rows imported count, rows skipped count, rows failed count, and a link to the import history entry for this job

**Category:** happy-path
**Priority:** must-have

### AC-2: Notification created on import failure
**Given** a background ImportJob transitions to status `failed`
**When** the transition occurs
**Then** an in-app notification is created for the initiating user with: entity type, original filename, failure reason (truncated to 200 characters), and a link to the import history entry

**Category:** happy-path
**Priority:** must-have

### AC-3: Notification appears in app notification tray
**Given** an in-app notification has been created for the current user
**When** the user views any page in the application
**Then** the bell icon shows an unread badge count that includes the new notification; opening the tray shows the notification with content from AC-1 or AC-2; the notification is marked as read when the user opens the tray

**Category:** happy-path
**Priority:** must-have

### AC-4: No duplicate notification when user is on progress page
**Given** a user is on the progress page and polling is active when the import completes
**When** the ImportJob reaches `complete` or `failed`
**Then** the polling UI displays the completion result inline (per ASYNC-02 AC-5/AC-6); a notification is still created server-side so the user sees it if they later visit another page or log in again

**Category:** edge-case
**Priority:** should-have

### AC-5: Notifications are not delivered to other users
**Given** User A's import job completes
**When** User B (including CRM Admins) views their notification tray
**Then** User B does not see a notification for User A's import

**Category:** security
**Priority:** must-have

### AC-6: Notification link navigates to correct import history entry
**Given** the user clicks the link inside the import completion notification
**When** the link is followed
**Then** the user is navigated to the import history detail page for the specific ImportJob that triggered the notification

**Category:** happy-path
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the notifications endpoint (read or dismiss)
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without notification access (e.g., a service account or role without UI access)
**When** a request is made to read another user's notifications
**Then** the system returns 403 Forbidden

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Notification creation fails (DB error) | Failure is logged; import job status is not affected; user may not receive the notification but import result is accessible via history | should-have |
| Notification tray fails to load | Bell icon renders without badge; tray shows "Notifications temporarily unavailable" | should-have |

### Performance
- **Notification creation latency:** Notification must be created within 5 seconds of ImportJob status transition
- **Tray load time:** Notification tray content loads within 500ms p95

### Security
- **Authorization:** Notification read/dismiss endpoints must scope results to `user = current_user`; no endpoint may return another user's notifications
- **Input validation:** Notification IDs must be UUIDs; dismiss endpoint must verify ownership before marking read

### Accessibility
- Unread notification badge must have `aria-label="N unread notifications"` (with N = count)
- Notification tray must be keyboard-navigable and focus-trappable when open

## Open Questions
- None — all gaps resolved or out of scope for this story. G-14 (notification method) is addressed by the in-app-only assumption confirmed for v1.

---

# Acceptance Criteria: ERROR-01 — Validation error summary grouped by error type

## Refined Story Statement
As a CRM Admin or Power User, I want to see a breakdown of validation errors grouped by error type on the preview/commit screen before I confirm an import, so that I can quickly assess overall data quality and decide whether to fix the source file or proceed with partial import.

## Assumptions
- Error counts reflect the full file (all rows validated), not only the 20 preview rows — **Confirmed**
- Error summary is displayed in a panel above the row preview table — **Confirmed**
- Partial import is opt-in via a checkbox on this same screen (G-4 assumed) — **Confirmed**
- Enum mismatch causes a row-level error, not an import-level abort (G-9 assumed) — **Confirmed**
- Date format ambiguity is surfaced as an error type in the summary (G-13 partially addressed — see Open Questions) — **Unconfirmed**
- Intra-file duplicate (two rows with same email) causes both rows to be flagged as errors (G-15 assumed) — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-3: Uniqueness scope (contacts only or all entities?) | Deferred — duplicate email count in the summary applies to contacts; behavior for companies/deals deferred pending stakeholder clarification | Open Question OQ-1 |
| G-4: Partial import opt-in | Out of Scope for this story — partial import checkbox UI is PREVIEW story; this story only displays the error summary panel | Out of Scope |
| G-9: Enum mismatch — fail row or fail import? | Addressed — row-level failure assumed; enum mismatch errors appear as a line item in the summary panel | AC-3 |
| G-11: Roles for viewing error summary | Addressed — both CRM Admin and Power User can view the error summary on the preview screen | AC-AUTH-2 |
| G-13: Date format handling | Deferred — "Ambiguous date" surfaced as a summary line item; behavior (reject, auto-detect, or user-specified format) not yet decided | Open Question OQ-2 |
| G-15: Intra-file duplicate handling | Addressed — both rows flagged; count appears as "Duplicate email (intra-file): N rows" in summary | AC-4 |

## Acceptance Criteria

### AC-1: Error summary panel visible on preview/commit screen
**Given** a file has completed validation and at least one row has a validation error
**When** the user navigates to the preview/commit screen
**Then** an error summary panel is displayed above the row table, listing each error type that occurred with its count; if zero validation errors exist, the panel is replaced by a "No validation errors found" banner

**Category:** happy-path
**Priority:** must-have

### AC-2: Error counts reflect full file, not only preview rows
**Given** a file with 5,000 rows where 300 rows have invalid email format, and the preview shows only the first 20 rows
**When** the error summary panel is rendered
**Then** the panel shows "Invalid email format: 300 rows" (reflecting the full file count, not the count visible in the 20-row preview table)

**Category:** happy-path
**Priority:** must-have

### AC-3: Error types rendered as individual line items
**Given** a file with multiple error types
**When** the error summary panel renders
**Then** each distinct error type appears as a separate line in the following format: "[Error type label]: [N] rows"; error types include at minimum: "Invalid email format", "Missing required field '[FieldName]'", "Duplicate email (intra-file)", "Duplicate email (existing record)", "Enum mismatch on '[FieldName]'", "Ambiguous date in '[FieldName]'"

**Category:** happy-path
**Priority:** must-have

### AC-4: Intra-file duplicate rows counted separately per row
**Given** two rows in the same CSV share the same email address
**When** the error summary panel renders
**Then** the count for "Duplicate email (intra-file)" is 2 (both rows are counted, not 1 pair), consistent with ERROR-02 where both rows appear in the error report

**Category:** edge-case
**Priority:** must-have

### AC-5: Zero-error file suppresses the error panel
**Given** a file where all rows pass validation
**When** the preview/commit screen renders
**Then** no error summary panel is shown; a green "All [N] rows passed validation" banner is displayed instead; the partial import checkbox is hidden or disabled

**Category:** edge-case
**Priority:** must-have

### AC-6: Required field error identifies the field by name
**Given** 23 rows are missing a value for the required field "Company Name"
**When** the error summary panel renders
**Then** the line item reads "Missing required field 'Company Name': 23 rows" (field name is the CRM field label, not the source CSV header)

**Category:** edge-case
**Priority:** must-have

### AC-7: Multiple required fields with errors each get a separate line
**Given** 23 rows are missing "Company Name" and 10 rows are missing "Owner"
**When** the error summary panel renders
**Then** two separate line items appear: "Missing required field 'Company Name': 23 rows" and "Missing required field 'Owner': 10 rows"

**Category:** edge-case
**Priority:** must-have

### AC-8: Error summary link to downloadable report
**Given** the error summary panel is visible
**When** the user clicks "Download full error report"
**Then** the download link described in ERROR-02 is triggered (signed S3 URL for the error CSV); the button is disabled and shows "Generating…" if the error report has not yet been generated

**Category:** happy-path
**Priority:** should-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the validation summary endpoint or the preview/commit page
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with Read Only role
**When** a request is made to the preview/commit screen or its underlying API endpoint
**Then** the system returns 403 Forbidden; no validation summary data is exposed

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Validation job did not complete before preview is requested | Preview screen renders with a spinner; summary panel shows "Validation in progress…" until the validation job completes | must-have |
| Validation summary aggregation query times out | Display "Error summary temporarily unavailable — download the full error report for details" with the download link | should-have |

### Performance
- **Summary panel load time:** Aggregated error counts must render within 1 second p95 for files up to 50,000 rows
- **Scale:** Aggregation must not perform a full table scan; an index on `(import_job_id, error_type)` in the validation errors table is required

### Security
- **Authorization:** The underlying aggregation API must scope results to the ImportJob's owner or a CRM Admin

### Accessibility
- Error count list must be rendered as a `<ul>` or equivalent semantic list, not a visual-only layout
- Color alone must not be the only indicator of error severity (pair color with an icon or label)

## Open Questions
- **OQ-1 (G-3):** Does the "Duplicate email (existing record)" line item apply only to contacts, or also to companies (by name?) and deals (by ID or name?)? If uniqueness is not defined for non-contact entities, the error type should not appear in the summary for those entity types.
- **OQ-2 (G-13):** "Ambiguous date in '[FieldName]'" is listed as an error type in the summary. What behavior triggers this error — inconsistent format across rows, an unrecognized format, or a specific ambiguity (e.g., "01/02/03" could be Jan 2 or Feb 1)? Without this decision, the error type cannot be consistently detected or labeled.

---

# Acceptance Criteria: ERROR-02 — Downloadable error report CSV

## Refined Story Statement
As a CRM Admin or Power User, I want to download a CSV listing every row that failed validation with its row number, original values, and error descriptions, so that I can fix the source data and re-run a clean import.

## Assumptions
- Error report is generated during the validation job and stored on S3 before the preview screen is shown — **Confirmed**
- Download is served via a signed S3 URL with a short expiry (suggested: 15 minutes) — **Confirmed**
- Error report is available from both the preview/commit screen and the import history detail page — **Confirmed**
- For intra-file duplicates, both rows appear as separate rows in the error report — **Confirmed**
- Error report includes all source column values (original, unmapped) — **Confirmed**
- S3 file retention policy for the error report is not defined (G-8 deferred) — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-8: S3 file retention policy | Deferred — error reports stored on S3 but no retention policy defined; a lifecycle rule must be specified before production | Open Question OQ-1 |
| G-11: Roles for downloading the error report | Addressed — CRM Admin and Power User can download; Read Only users cannot access the import flow and thus cannot reach the download link | AC-AUTH-2 |
| G-13: Date format ambiguity in error descriptions | Partially addressed — rows with ambiguous dates appear in the error report with error code `DATE_AMBIGUOUS` and a human-readable description; definitive detection logic deferred (G-13) | AC-3 |
| G-15: Intra-file duplicate handling | Addressed — both duplicate rows appear as separate entries in the error report | AC-4 |

## Acceptance Criteria

### AC-1: Download link available on preview/commit screen
**Given** validation has completed and at least one row has a validation error
**When** the user views the preview/commit screen
**Then** a "Download error report" link or button is visible in the error summary panel; clicking it initiates a download of the error report CSV without requiring additional authentication steps

**Category:** happy-path
**Priority:** must-have

### AC-2: Download link available on import history detail page
**Given** an import job with validation errors has completed (status `complete` or `failed`)
**When** the user navigates to the import history detail page for that job
**Then** a "Download error report" link is visible and functional; the download serves the same S3-stored error report generated during validation

**Category:** happy-path
**Priority:** must-have

### AC-3: Error report CSV column structure
**Given** a user downloads the error report for an import job
**When** the file is opened
**Then** the CSV contains exactly these columns in order: `row_number` (integer, 1-indexed matching the source file), one column per mapped source header (original source values, not CRM field names), `error_codes` (comma-separated codes, e.g., `INVALID_EMAIL,REQUIRED_FIELD_MISSING`), `error_descriptions` (comma-separated human-readable strings, e.g., `"Invalid email format","Missing required field: Owner"`)

**Category:** happy-path
**Priority:** must-have

### AC-4: Intra-file duplicates appear as two rows in the error report
**Given** rows 45 and 102 in the source CSV share the same email address
**When** the error report is downloaded
**Then** row 45 appears with `error_codes = INTRAFILE_DUPLICATE` and `error_descriptions = "Duplicate email (row 102)"`, and row 102 appears with `error_codes = INTRAFILE_DUPLICATE` and `error_descriptions = "Duplicate email (row 45)"`

**Category:** edge-case
**Priority:** must-have

### AC-5: Download served via signed S3 URL
**Given** the user clicks the download link
**When** the link is followed
**Then** the server generates a signed S3 URL with a 15-minute expiry and redirects the browser to that URL; the file downloads as `error_report_{import_job_id}.csv` with `Content-Type: text/csv`

**Category:** happy-path
**Priority:** must-have

### AC-6: Download link unavailable when no validation errors exist
**Given** a file where all rows passed validation (zero errors)
**When** the user views the preview/commit screen or import history detail page
**Then** no "Download error report" link is shown; in its place, "No errors — all rows passed validation" is displayed

**Category:** edge-case
**Priority:** must-have

### AC-7: Download link unavailable if error report generation failed
**Given** the error report S3 upload failed during validation
**When** the user attempts to click the download link
**Then** the link is replaced by the message "Error report unavailable — contact support" and no download is initiated

**Category:** error-handling
**Priority:** must-have

### AC-8: Rows with multiple errors appear once with all error codes
**Given** a row has both an invalid email format and a missing required field
**When** the error report is downloaded
**Then** that row appears exactly once in the error report, with `error_codes = "INVALID_EMAIL,REQUIRED_FIELD_MISSING"` and both descriptions in `error_descriptions`

**Category:** edge-case
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the error report download endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with Read Only role
**When** a request is made to the error report download endpoint
**Then** the system returns 403 Forbidden and no signed URL is generated

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Signed URL expires before user clicks download | New signed URL generated on each download request (don't cache the URL client-side); the underlying S3 object remains | must-have |
| S3 object missing (deleted before retention window) | Return 404 with message "Error report no longer available"; link is hidden on the history detail page if object is missing | should-have |

### Performance
- **Signed URL generation time:** < 300ms p95
- **Download speed:** No artificial throttling; S3 serves the file directly to the client

### Security
- **Signed URL scope:** The signed URL must be scoped to the specific object; URL must not grant list or write permissions on the S3 bucket
- **PII in error report:** The error report contains source data that may include PII (names, emails); S3 bucket must be private; signed URL expiry of 15 minutes limits exposure window
- **Authorization:** Download endpoint must verify the requesting user owns the ImportJob or is a CRM Admin before generating the signed URL

### Accessibility
- The download link must have descriptive text (not "click here"); suggested: "Download error report (CSV)"
- No accessibility requirements on the downloaded file itself (it is a data file)

## Open Questions
- **OQ-1 (G-8):** What S3 lifecycle rule governs error report files? If the retention window is shorter than the import history retention, error report links on old history entries will 404. A policy decision is needed (suggested: 30 days post-import-completion, matching or exceeding the undo window).

---

# Acceptance Criteria: HIST-01 — Import history list with date-range filter

## Refined Story Statement
As a CRM Admin or Power User, I want to view a reverse-chronological list of my past imports with key metrics and a date-range filter, so that I can audit past imports, review outcomes, and access error reports.

## Assumptions
- List shows up to 100 most recent imports (G-12 assumed — no explicit retention or pagination in v1) — **Confirmed**
- Date-range filter options: last 7 days / last 30 days / all time — **Confirmed**
- History retained indefinitely — no expiry policy — **Confirmed** (G-12 partially resolved; see Open Questions)
- Power Users see only their own imports (HIST-02 enforces this) — **Confirmed**
- CRM Admins see all users' imports (HIST-02 enforces this) — **Confirmed**
- No full-text search in v1 — **Confirmed** (G-12 assumed)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-8: S3 file retention (original file) | Out of Scope for this story — history list does not display or link to the original S3 file; error report download is via ERROR-02 | Out of Scope |
| G-11: Roles and visibility for import history | Addressed — CRM Admin sees all; Power User sees own; Read Only has no access | AC-AUTH-2, AC-7 |
| G-12: History retention, pagination, and search | Addressed — indefinite retention, cap at 100 entries per list view, no search in v1; date-range filter is the only narrowing mechanism | AC-1, AC-2, AC-3 |

## Acceptance Criteria

### AC-1: History list renders reverse-chronologically
**Given** the current user has completed at least one import
**When** the user navigates to the import history page
**Then** the list renders imports in reverse-chronological order (newest first), with columns: date/time (formatted as user's locale), filename, entity type, status, total rows, imported rows, skipped rows, failed rows

**Category:** happy-path
**Priority:** must-have

### AC-2: List capped at 100 most recent entries
**Given** a user has more than 100 completed imports
**When** the import history page loads with no date filter applied
**Then** only the 100 most recent imports are displayed; a note "Showing 100 most recent imports" is visible; no pagination controls are shown in v1

**Category:** edge-case
**Priority:** must-have

### AC-3: Date-range filter narrows the list
**Given** the user selects "Last 7 days" from the date-range filter
**When** the filter is applied
**Then** only imports with a `created_at` within the last 7 calendar days (relative to the user's current time) are shown; the 100-entry cap applies within the filtered set; the same behavior applies for "Last 30 days"; selecting "All time" returns to the default 100-entry unfiltered view

**Category:** happy-path
**Priority:** must-have

### AC-4: Each row links to an import detail page
**Given** the history list is rendered
**When** the user clicks on any row
**Then** the user is navigated to the import detail page for that ImportJob, which includes: all list columns' data, and a "Download error report" link (if errors exist, per ERROR-02)

**Category:** happy-path
**Priority:** must-have

### AC-5: Status values are visually distinct
**Given** imports with statuses `complete`, `failed`, `processing`, and `undone` exist in the list
**When** the history list renders
**Then** each status is displayed with a distinct visual treatment (label + color or icon); specifically: `complete` → green, `failed` → red, `processing` → blue with a spinner, `undone` → grey/strikethrough

**Category:** happy-path
**Priority:** should-have

### AC-6: Empty state when no imports exist
**Given** the current user has no imports (or no imports within the selected date range)
**When** the history page or filtered view renders
**Then** the list area shows "No imports found" with a call-to-action link to start a new import

**Category:** edge-case
**Priority:** must-have

### AC-7: Read Only users have no access to import history
**Given** an authenticated user with Read Only role
**When** the user attempts to navigate to the import history page or calls the history API endpoint
**Then** the UI renders a "You don't have permission to view import history" message; the API returns 403 Forbidden

**Category:** security
**Priority:** must-have

### AC-8: Processing imports appear in the list with live status
**Given** an import is currently in status `processing`
**When** it appears in the history list
**Then** the row shows current `rows_processed` / `rows_total` and status `processing`; the user can click the row to navigate to the progress page (ASYNC-02) for live polling

**Category:** edge-case
**Priority:** should-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the import history list endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with Read Only role
**When** a request is made to `GET /imports/history`
**Then** the system returns 403 Forbidden with a message identifying the missing permission

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| History list API times out | Render "Import history temporarily unavailable — try again shortly" in place of the list | should-have |
| Date-range filter returns zero results | Render "No imports found in this date range" with a suggestion to select "All time" | must-have |

### Performance
- **History list load time:** < 1 second p95 for up to 100 rows
- **Date-range filter response:** < 500ms p95; query must use an index on `(uploader_id, created_at)`

### Security
- **Authorization:** History list endpoint enforces role-based visibility at the query level (not just UI hiding); Power User queries are always filtered to `uploader_id = current_user.id`

### Accessibility
- Table must use proper `<th>` headers with `scope` attributes
- Status icons/colors must have accessible text equivalents (e.g., `aria-label="Status: Complete"`)
- Date-range filter must be keyboard-accessible

## Open Questions
- None — G-11 and G-12 are resolved by the assumptions above. If the product team later requires pagination, search, or a finite retention window, those are additive scope changes.

---

# Acceptance Criteria: HIST-02 — Role-based import history visibility

## Refined Story Statement
As a System, I want to enforce role-based visibility on import history so Power Users see only their own imports while CRM Admins see all users' imports, so that users have appropriate access without exposing other users' data unnecessarily.

## Assumptions
- Authorization is enforced at the API layer, not only via UI hiding — **Confirmed**
- Power User: sees only `uploader_id = current_user.id` — **Confirmed**
- CRM Admin: sees all imports with an additional "Uploaded by" column — **Confirmed**
- Read Only: no access (403) — **Confirmed**
- No mechanism for admin to filter by a specific uploader in v1 — **Confirmed** (out of scope)
- No import ownership reassignment in v1 — **Confirmed** (out of scope)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-11: Roles and permissions for import history | Addressed — three roles defined: CRM Admin (all), Power User (own), Read Only (none); authorization at API layer | AC-1, AC-2, AC-3, AC-4 |

## Acceptance Criteria

### AC-1: Power User sees only their own imports
**Given** an authenticated Power User
**When** `GET /imports/history` is called
**Then** the response contains only ImportJob records where `uploader_id = current_user.id`; records belonging to other users are never included, regardless of query parameters passed by the client

**Category:** happy-path
**Priority:** must-have

### AC-2: CRM Admin sees all users' imports
**Given** an authenticated CRM Admin
**When** `GET /imports/history` is called
**Then** the response includes ImportJob records from all users; the response for each record includes an additional `uploaded_by` field containing the uploader's display name and email address

**Category:** happy-path
**Priority:** must-have

### AC-3: Read Only user receives 403
**Given** an authenticated user with Read Only role
**When** `GET /imports/history` is called
**Then** the API returns HTTP 403 Forbidden with the message "You do not have permission to access import history"; no history data is returned

**Category:** happy-path
**Priority:** must-have

### AC-4: Direct URL access to another user's import detail is blocked
**Given** a Power User who knows the `import_job_id` of another user's import
**When** `GET /imports/{import_job_id}` is called
**Then** the API returns HTTP 403 Forbidden (not 404); the detail page renders an access-denied message

**Category:** security
**Priority:** must-have

### AC-5: Power User cannot elevate visibility via query parameters
**Given** a Power User attempting to bypass visibility by passing `?all=true` or `?uploader_id=other_user_id`
**When** the API processes the request
**Then** the query parameters are ignored and only the requesting user's own imports are returned; no 400 error is raised (parameters silently ignored)

**Category:** security
**Priority:** must-have

### AC-6: CRM Admin "Uploaded by" column is present in UI
**Given** a CRM Admin views the import history list
**When** the list renders
**Then** a column "Uploaded by" (showing uploader name and email) is visible; this column is not shown in the Power User view

**Category:** happy-path
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to `GET /imports/history` or `GET /imports/{import_job_id}`
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with Read Only role
**When** a request is made to any import history endpoint
**Then** the system returns 403 Forbidden with a message identifying the missing permission

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Role check indeterminate (auth service timeout) | Return 403 as a safe default; log the timeout | must-have |

### Performance
- **Authorization overhead:** Role check adds < 10ms to response time p95

### Security
- **Defense-in-depth:** Role enforcement must occur at the query/ORM level (row-level security or explicit WHERE clause), not only as a response filter applied after data is fetched
- **Audit logging:** All 403 responses on history endpoints should be logged with `user_id`, `requested_resource`, and `timestamp` for security audit trail

### Accessibility
- N/A — this story is primarily backend authorization logic; UI impact limited to column visibility handled by HIST-01

## Open Questions
- None — G-11 is fully addressed for this story's scope. The confirmed role model (Admin/Power User/Read Only) is sufficient to implement the three branches.

---

# Acceptance Criteria: UNDO-01 — Soft-delete undo with 48-hour window

## Refined Story Statement
As a CRM Admin, I want to reverse a completed import within 48 hours by soft-deleting all records it created, so that I can recover from a mistaken import without permanently destroying data.

## Assumptions
- Soft-delete means records are flagged `deleted = true` and hidden from normal queries; they are retained in the database — **Confirmed** (G-5 partially resolved)
- Records modified after import (`updated_at > import_job.completed_at`) are skipped during undo — **Confirmed** (UNDO-02 handles the confirmation flow)
- Undo uses stored record IDs tagged with `import_job_id`; original S3 file is not required — **Confirmed**
- 48-hour window enforced server-side; client UI also hides the button but server rejects out-of-window requests — **Confirmed**
- Undo is all-or-nothing for records that were imported (no selective record undo) — **Confirmed**
- Power Users cannot trigger undo — **Confirmed**
- Records retained indefinitely after soft-delete (not hard-deleted after any period) — **Unconfirmed** (G-5 deferred)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-5: Undo mechanism — soft-delete retention vs. true delete; behavior for modified records | Partially addressed — soft-delete confirmed (records retained in DB); modified records are skipped (not reverted); records retained indefinitely post-soft-delete pending G-5 resolution; hard-delete after a period is deferred | Open Question OQ-1 |
| G-8: S3 file retention — whether undo requires original file | Addressed — undo uses stored record IDs, not the S3 file; original file not required for undo | AC-3 |
| G-11: Roles for undo | Addressed — CRM Admin only; Power User cannot trigger undo | AC-1, AC-AUTH-2 |

## Acceptance Criteria

### AC-1: Undo action available to CRM Admin within 48-hour window
**Given** an authenticated CRM Admin viewing the import history entry for an import with status `complete`
**When** the import was completed less than 48 hours ago
**Then** an "Undo" button is visible and active on the import history entry row and on the import detail page

**Category:** happy-path
**Priority:** must-have

### AC-2: Undo button hidden after 48-hour window expires
**Given** an import was completed more than 48 hours ago
**When** any user views the import history entry
**Then** the "Undo" button is not shown; if the UI is stale (cached) and a user somehow clicks the button, the server returns 409 Conflict with message "Undo window has expired for this import"

**Category:** edge-case
**Priority:** must-have

### AC-3: Undo soft-deletes all imported records
**Given** a CRM Admin has confirmed the undo action (via UNDO-02 confirmation flow)
**When** undo executes
**Then** all records whose `import_job_id` matches the undone job and `updated_at ≤ import_job.completed_at` are marked `deleted = true`; these records no longer appear in any normal CRM query, list, or search result

**Category:** happy-path
**Priority:** must-have

### AC-4: Modified records are skipped, not reverted
**Given** an import created 500 records, and a user subsequently edited 30 of them
**When** undo executes
**Then** the 30 records with `updated_at > import_job.completed_at` are skipped (remain live in the CRM); the remaining 470 records are soft-deleted; the undo summary reports 470 deleted, 30 skipped

**Category:** edge-case
**Priority:** must-have

### AC-5: ImportJob status updated to `undone` on completion
**Given** undo has completed successfully
**When** the ImportJob record is read
**Then** its status is `undone` and a `undone_at` timestamp is set; the Undo button no longer appears on the history entry

**Category:** happy-path
**Priority:** must-have

### AC-6: Server-side 48-hour window enforcement
**Given** the 48-hour window has expired for an import
**When** a POST request is made to the undo endpoint (regardless of client UI state)
**Then** the server returns HTTP 409 Conflict with message "Undo window has expired for this import — undo is only available within 48 hours of import completion"

**Category:** security
**Priority:** must-have

### AC-7: Undo not available for imports with status other than `complete`
**Given** an import with status `failed`, `processing`, or `undone`
**When** a POST request is made to the undo endpoint for that import
**Then** the server returns HTTP 409 Conflict with a message identifying the current status; no soft-delete operations are performed

**Category:** edge-case
**Priority:** must-have

### AC-8: Undo is transactional — partial failure rolls back
**Given** undo is executing and a database error occurs mid-operation (e.g., connection lost after 200 of 500 records are soft-deleted)
**When** the error is detected
**Then** all soft-deletes from this undo operation are rolled back (the 200 records are restored to live status); the ImportJob status remains `complete`; the undo can be retried

**Category:** error-handling
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a POST request is made to the undo endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated Power User or Read Only user
**When** a POST request is made to the undo endpoint
**Then** the system returns 403 Forbidden with message "Undo is restricted to CRM Admins"; no soft-delete operations are performed

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Undo of an import with 0 records tagged (edge case: all rows failed validation) | Return 409 with "No imported records to undo for this job" | must-have |
| Concurrent undo requests for the same import_job_id | Second request returns 409 "An undo is already in progress for this import" | must-have |

### Performance
- **Small undo (≤ 500 records):** Synchronous, completes within 5 seconds p95
- **Large undo (> 500 records):** Dispatched as async Celery task (UNDO-03); response is immediate HTTP 202

### Security
- **Authorization:** Undo endpoint must verify `import_job.uploader` is visible to the requesting Admin (i.e., the Admin cannot undo imports they cannot see in history)
- **Audit logging:** All undo operations must be logged with `admin_user_id`, `import_job_id`, `records_deleted`, `records_skipped`, `undone_at`

### Accessibility
- "Undo" button must have an accessible label: `aria-label="Undo import [filename] from [date]"`
- Disabled/expired undo button must be visibly and programmatically disabled

## Open Questions
- **OQ-1 (G-5):** Are soft-deleted records retained in the database indefinitely, or are they hard-deleted after a defined period? This affects data retention/compliance posture and must be explicitly decided. If hard-deleted after (e.g.) 90 days, soft-deleted records cannot be recovered after that window.

---

# Acceptance Criteria: UNDO-02 — Undo confirmation screen with modified-record count

## Refined Story Statement
As a CRM Admin, I want to see how many imported records were subsequently edited before I confirm an undo, so that I can make an informed decision knowing that modified records will be skipped rather than reverted.

## Assumptions
- Confirmation is displayed as a modal before undo executes — **Confirmed**
- Modified records are identified by `updated_at > import_job.completed_at` — **Confirmed**
- Skipped (modified) records remain live in the CRM after undo completes — **Confirmed**
- The admin cannot selectively include/exclude modified records — **Confirmed** (explicitly out of scope)
- The count of modified records is computed at the time the confirmation modal is opened, not at undo execution time — **Unconfirmed** (small race condition window)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-5: Behavior for records modified after import | Addressed — modified records (updated_at > completed_at) are counted in the modal and skipped during undo; they remain live; no revert of edits | AC-1, AC-3 |
| G-11: Roles for undo confirmation | Addressed — confirmation modal is only reachable by CRM Admins (UNDO-01 gates the Undo button) | AC-AUTH-2 |

## Acceptance Criteria

### AC-1: Confirmation modal displays three counts
**Given** a CRM Admin clicks the "Undo" button on an eligible import
**When** the confirmation modal appears
**Then** the modal displays: (a) "Total records from this import: [N]", (b) "Records edited since import (will be skipped): [M]", (c) "Records that will be soft-deleted: [N - M]"

**Category:** happy-path
**Priority:** must-have

### AC-2: Confirmation modal has Confirm and Cancel actions
**Given** the confirmation modal is open
**When** the admin reviews the counts
**Then** two buttons are visible: "Confirm Undo" and "Cancel"; clicking "Cancel" closes the modal with no undo initiated; clicking "Confirm Undo" dispatches the undo operation (sync or async per UNDO-03 threshold)

**Category:** happy-path
**Priority:** must-have

### AC-3: Skipped count reflects records edited after import
**Given** an import created 1,000 records and 75 were subsequently edited by any CRM user
**When** the confirmation modal renders
**Then** "Records edited since import (will be skipped): 75" and "Records that will be soft-deleted: 925" are displayed; the 75 skipped records remain fully live and editable in the CRM after undo

**Category:** happy-path
**Priority:** must-have

### AC-4: Modal shows zero modified records correctly
**Given** an import where no records were edited after import
**When** the confirmation modal renders
**Then** "Records edited since import (will be skipped): 0" and "Records that will be soft-deleted: [total]" are displayed; no warning or special treatment is applied

**Category:** edge-case
**Priority:** must-have

### AC-5: Modal shows warning when all records were modified
**Given** an import where all created records were subsequently edited
**When** the confirmation modal renders
**Then** "Records that will be soft-deleted: 0" is displayed along with a warning: "All records from this import have been edited — confirming undo will have no effect (0 records will be deleted)"; the Confirm Undo button remains available but the admin is clearly informed

**Category:** edge-case
**Priority:** must-have

### AC-6: Count query completes before modal renders
**Given** a CRM Admin clicks "Undo" on an import with 100,000+ records
**When** the modal is requested
**Then** the modal shows a loading spinner while the modified-record count query runs; the modal renders with counts within 5 seconds; if the query times out, an error message "Unable to calculate record counts — try again" replaces the modal content

**Category:** edge-case
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the undo confirmation count endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated Power User or Read Only user
**When** a request is made to the undo confirmation count endpoint
**Then** the system returns 403 Forbidden; the modal is not shown

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Race condition: admin opens modal, records are edited before Confirm is clicked | Undo executes with the modified-record logic applied at execution time (not at modal-open time); final deleted/skipped counts in the undo summary may differ slightly from modal counts; this is acceptable and documented | should-have |

### Performance
- **Modified-record count query:** < 5 seconds p95 for imports with up to 100,000 records; requires an index on `(import_job_id, updated_at)` on the records table

### Security
- **Authorization:** Confirmation count endpoint must verify the requesting user is a CRM Admin and the ImportJob is within the 48-hour undo window before returning counts

### Accessibility
- Confirmation modal must be focus-trapped; focus moves to "Cancel" when modal opens (default safe action)
- Modal must be announced to screen readers via `role="alertdialog"` and `aria-labelledby`
- Warning text (AC-5 all-modified case) must have `role="alert"` for screen reader announcement

## Open Questions
- None — G-5 (modified-record behavior) is fully addressed for this story by the skip-and-count model. The only outstanding G-5 item (post-soft-delete retention period) belongs to UNDO-01 OQ-1.

---

# Acceptance Criteria: UNDO-03 — Async undo processing for large imports

## Refined Story Statement
As a CRM Admin, I want large undo operations to run as background Celery tasks with a progress bar, so that the UI does not time out when reversing an import with 100,000+ records.

## Assumptions
- Threshold: > 500 records → async Celery undo task; ≤ 500 records → synchronous undo — **Confirmed** (mirrors ASYNC-01 threshold)
- `GET /imports/{job_id}/undo-status` polling endpoint, same structure as ASYNC-02 status endpoint — **Confirmed**
- Frontend polls every 3 seconds — **Confirmed**
- ETR uses rolling rows/sec average — **Confirmed**
- ImportJob status shows `undoing` during processing, `undone` on completion — **Confirmed**
- No in-app notification on undo completion in v1 — **Confirmed** (out of scope per story)
- Sync path for undo of ≤ 500 records is handled by UNDO-01; this story adds the async path only — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Async threshold | Addressed — same threshold logic applied (> 500 records → async); threshold value subject to same OQ as ASYNC-01 | Open Question OQ-1 |
| G-6: Polling vs. SSE | Addressed — polling at 3s interval, consistent with ASYNC-02 | AC-3 |
| G-10: ETR algorithm | Addressed — rolling rows/sec average from Celery `update_state`, consistent with ASYNC-01 | AC-4 |
| G-11: Roles for async undo | Addressed — CRM Admin only; inherited from UNDO-01 | AC-AUTH-2 |

## Acceptance Criteria

### AC-1: Undo dispatched as Celery task when import exceeds 500 records
**Given** a CRM Admin has confirmed undo for an import with more than 500 imported records
**When** "Confirm Undo" is clicked in the UNDO-02 modal
**Then** the system dispatches a Celery undo task and immediately returns HTTP 202; the ImportJob status changes to `undoing`; the UI transitions to the undo progress view

**Category:** happy-path
**Priority:** must-have

### AC-2: Undo status endpoint returns expected fields
**Given** an async undo task is running for `job_id`
**When** `GET /imports/{job_id}/undo-status` is called by an authenticated CRM Admin
**Then** the response returns HTTP 200 with: `status` (one of `undoing`, `undone`, `failed`), `records_processed` (integer), `records_total` (integer), `records_deleted` (integer), `records_skipped` (integer), `estimated_seconds_remaining` (integer or null)

**Category:** happy-path
**Priority:** must-have

### AC-3: Frontend polls every 3 seconds during async undo
**Given** the undo progress page is displayed and the ImportJob status is `undoing`
**When** the page is rendered
**Then** the frontend polls `GET /imports/{job_id}/undo-status` every 3 seconds; polling stops when status is `undone` or `failed`

**Category:** happy-path
**Priority:** must-have

### AC-4: Progress bar shows records soft-deleted vs. total
**Given** a polling response returns `records_processed = 40,000` and `records_total = 100,000`
**When** the progress bar renders
**Then** the bar fills to 40% and displays "40,000 / 100,000 records reversed"

**Category:** happy-path
**Priority:** must-have

### AC-5: Completion summary rendered on undo completion
**Given** the frontend is polling and a response returns status `undone`
**When** the polling loop receives this response
**Then** polling stops; the progress bar renders at 100%; a summary shows: records soft-deleted, records skipped (modified), and a link to the import history entry (now showing status `undone`)

**Category:** happy-path
**Priority:** must-have

### AC-6: Failure state rendered on undo task failure
**Given** the Celery undo task fails
**When** the frontend polling detects status `failed`
**Then** polling stops; the progress bar is replaced by an error state with the message "Undo failed — some records may not have been reversed. Check import history and contact support if the issue persists."

**Category:** error-handling
**Priority:** must-have

### AC-7: Async undo task is idempotent on retry
**Given** the Celery undo task fails and is retried
**When** the retried task runs
**Then** records already soft-deleted by the prior attempt are not re-processed; the task resumes from the last checkpoint; final `records_deleted` count reflects unique soft-deletes only

**Category:** edge-case
**Priority:** must-have

### AC-8: ETR is null until sufficient data exists
**Given** fewer than 2 `update_state` ticks have occurred for the undo task
**When** `GET /imports/{job_id}/undo-status` is called
**Then** `estimated_seconds_remaining` is `null`; the UI renders "Calculating…" in place of a time value

**Category:** edge-case
**Priority:** should-have

### AC-9: Undo status endpoint returns 404 for unknown job_id
**Given** a `job_id` that does not exist or for which no undo was initiated
**When** `GET /imports/{job_id}/undo-status` is called
**Then** the API returns HTTP 404 with "Undo job not found"

**Category:** error-handling
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to `GET /imports/{job_id}/undo-status`
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated Power User or Read Only user
**When** a request is made to `GET /imports/{job_id}/undo-status`
**Then** the system returns 403 Forbidden; the undo progress page is not rendered for non-Admin users

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Concurrent undo tasks for the same import_job_id | Second task dispatch rejected at API level with 409 "Undo already in progress"; only one undo task per ImportJob at a time | must-have |
| Celery broker unreachable when undo is dispatched | API returns HTTP 503 "Undo service temporarily unavailable — try again in a few minutes"; ImportJob status remains `complete` | must-have |

### Performance
- **Undo throughput:** Celery task must soft-delete at least 5,000 records/second on standard infrastructure
- **Undo of 100,000 records:** Expected to complete in under 30 seconds at the above throughput; ETR should reflect this
- **Status endpoint response time:** < 100ms p95 (read from ImportJob record)

### Security
- **Authorization:** Undo-status endpoint must verify the requesting user is a CRM Admin and owns or has Admin visibility of the ImportJob
- **Concurrent request protection:** Undo dispatch endpoint must use a database-level lock or idempotency key to prevent duplicate task dispatch

### Accessibility
- Undo progress bar must have `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and a visible text label
- Completion and failure states must be announced to screen readers via `aria-live="assertive"`

## Open Questions
- **OQ-1 (G-1):** Is 500 records the confirmed threshold for sync vs. async undo, or does the product team want a different value? If the async import threshold (ASYNC-01) is revised, this threshold should be revised consistently.

---

## Coverage Summary
| # | Story Slug | AC Count | Auth AC | Gap Rows | Status |
|---|-----------|----------|---------|----------|--------|
| 1 | ASYNC-01 | 12 (AC-1–AC-10 + AUTH-1 + AUTH-2) | Yes | 5 | Complete |
| 2 | ASYNC-02 | 11 (AC-1–AC-9 + AUTH-1 + AUTH-2) | Yes | 4 | Complete |
| 3 | ASYNC-03 | 8 (AC-1–AC-6 + AUTH-1 + AUTH-2) | Yes | 2 | Complete |
| 4 | ERROR-01 | 10 (AC-1–AC-8 + AUTH-1 + AUTH-2) | Yes | 6 | Complete |
| 5 | ERROR-02 | 10 (AC-1–AC-8 + AUTH-1 + AUTH-2) | Yes | 4 | Complete |
| 6 | HIST-01 | 10 (AC-1–AC-8 + AUTH-1 + AUTH-2) | Yes | 3 | Complete |
| 7 | HIST-02 | 8 (AC-1–AC-6 + AUTH-1 + AUTH-2) | Yes | 1 | Complete |
| 8 | UNDO-01 | 10 (AC-1–AC-8 + AUTH-1 + AUTH-2) | Yes | 3 | Complete |
| 9 | UNDO-02 | 8 (AC-1–AC-6 + AUTH-1 + AUTH-2) | Yes | 2 | Complete |
| 10 | UNDO-03 | 11 (AC-1–AC-9 + AUTH-1 + AUTH-2) | Yes | 4 | Complete |
| **Total** | **10 stories** | **98 AC items** | **All 10** | **34 gap rows** | |


The stories section in this batch appears to be empty. The `## Stories (batch 03 of 3)` header is present but no individual story definitions (with `###` headings) follow it — the input jumps directly to the dependency map.

The story count in the task instructions also shows a rendering artifact (`0\n0 stories`) rather than an actual number, which confirms the story content wasn't injected into the template.

Based on the coverage check and implementation order, batch 03 likely contains the undo stories (`UNDO-01`, `UNDO-02`, `UNDO-03`) — but I'd be writing against inferred story text rather than the actual decomposer output, which risks drift.

Can you paste the missing story definitions? They should look like:

```
### UNDO-01: [Title]
As a [role], I want [capability], so that [outcome].
...
```

Once I have those, I'll write the full AC document.


