# Test Specifications: Batch 01 of 5 — File Upload and Column Mapping

---

# Test Specifications: UPLOAD-01 — Drag-and-drop file upload via presigned URL

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, edge-case |
| AC-2 | T-2.1, T-2.2 | happy-path, edge-case |
| AC-3 | T-3.1, T-3.2 | edge-case, error-handling |
| AC-4 | T-4.1, T-4.2, T-4.3 | happy-path, error-handling |
| AC-5 | T-5.1, T-5.2 | happy-path, error-handling |
| AC-6 | T-6.1 | happy-path |
| AC-7 | T-7.1, T-7.2, T-7.3 | boundary |
| AC-8 | T-8.1, T-8.2, T-8.3 | error-handling |
| AC-9 | T-9.1 | edge-case |
| AC-10 | T-10.1 | error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |
| NFR: Empty file | T-NFR-1.1 | error-handling |
| NFR: S3 non-200 | T-NFR-2.1 | error-handling |
| NFR: Backend 500 on presigned URL | T-NFR-3.1 | error-handling |
| NFR: Invalid entity type | T-NFR-4.1 | error-handling |

---

## Test Cases

### T-1.1: Drop zone highlights when a file is dragged over it
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Drag-and-drop file upload

  Scenario: Upload zone shows active highlight on dragover
    Given an authenticated user with role "CRM Admin" is on the import initiation screen
    And the user has selected entity type "contacts"
    And the user has a valid file "contacts_export.csv" (size: 1.2MB, type: text/csv)
    When the user drags "contacts_export.csv" over the upload drop zone
    Then the drop zone element has CSS class "drop-zone--active" (or equivalent highlight state)
    And the drop zone aria-label reads "Drop your file here"
```

**Test Data:**
- User: `{ email: "admin@acme.com", role: "CRM Admin", status: "active", permission: "imports:create" }`
- File: `contacts_export.csv`, 1.2MB, MIME type `text/csv`

**Preconditions:**
- User is authenticated with a valid JWT token
- Entity type "contacts" is selected in the UI
- Import initiation screen is rendered

---

### T-1.2: Releasing a dragged file initiates the upload flow
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Drag-and-drop file upload

  Scenario: Dropping a valid file initiates the upload flow
    Given an authenticated user with role "CRM Admin" is on the import initiation screen
    And the user has selected entity type "contacts"
    And the user has dragged "contacts_export.csv" over the upload zone
    When the user releases the file (drop event fires)
    Then the upload flow begins (presigned URL request is initiated)
    And the drop zone transitions out of the active highlight state
    And a loading or progress indicator becomes visible
```

**Test Data:**
- User: `{ email: "admin@acme.com", role: "CRM Admin", status: "active", permission: "imports:create" }`
- File: `contacts_export.csv`, 1.2MB, MIME type `text/csv`

**Preconditions:**
- User is authenticated
- Entity type "contacts" selected
- File dragged over drop zone (T-1.1 precondition met)

---

### T-2.1: File picker opens with correct extension filter when "Browse files" is clicked
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: File picker upload

  Scenario: Clicking Browse files opens OS picker filtered to .csv and .xlsx
    Given an authenticated user with role "Power User" is on the import initiation screen
    And the user has selected entity type "companies"
    When the user clicks the "Browse files" button
    Then the OS file picker opens
    And the picker's accept attribute is ".csv,.xlsx"
    And files with extensions other than .csv and .xlsx are greyed out or hidden
```

**Test Data:**
- User: `{ email: "poweruser@acme.com", role: "Power User", status: "active", permission: "imports:create" }`
- Entity type: `companies`

**Preconditions:**
- User is authenticated
- Entity type "companies" selected

---

### T-2.2: Selecting a valid file via file picker initiates upload flow
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: File picker upload

  Scenario: Selecting a valid .xlsx file via picker triggers upload flow
    Given an authenticated user with role "Power User" is on the import initiation screen
    And the user has selected entity type "deals"
    And the user has opened the OS file picker
    When the user selects "q3_deals.xlsx" (size: 4.5MB, type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
    Then the upload flow begins (presigned URL request is initiated)
    And the selected filename "q3_deals.xlsx" is displayed in the upload UI
```

**Test Data:**
- User: `{ email: "poweruser@acme.com", role: "Power User", status: "active", permission: "imports:create" }`
- File: `q3_deals.xlsx`, 4.5MB, MIME type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Entity type: `deals`

**Preconditions:**
- User is authenticated
- Entity type "deals" selected

---

### T-3.1: Upload zone is disabled when no entity type is selected
**Maps to:** AC-3
**Category:** edge-case

```gherkin
Feature: Entity type prerequisite enforcement

  Scenario: Upload zone is disabled before entity type selection
    Given an authenticated user with role "CRM Admin" is on the import initiation screen
    And no entity type has been selected
    When the user inspects the upload drop zone
    Then the upload zone is in a disabled state (aria-disabled="true" or pointer-events: none)
    And the "Browse files" button is also disabled
```

**Test Data:**
- User: `{ email: "admin@acme.com", role: "CRM Admin", status: "active", permission: "imports:create" }`

**Preconditions:**
- User is authenticated
- Import initiation screen rendered
- Entity type selector shows no selection

---

### T-3.2: Attempting to upload without selecting entity type shows inline error
**Maps to:** AC-3
**Category:** error-handling

```gherkin
Feature: Entity type prerequisite enforcement

  Scenario: User attempts upload without selecting entity type and sees error prompt
    Given an authenticated user with role "Power User" is on the import initiation screen
    And no entity type has been selected
    When the user attempts to trigger the upload (e.g., drop zone interaction or clicking Browse)
    Then no file picker opens and no presigned URL request is made
    And an inline message is displayed: "Please select an entity type before uploading"
    And the message is announced by screen readers via aria-live="polite"
```

**Test Data:**
- User: `{ email: "poweruser@acme.com", role: "Power User", status: "active", permission: "imports:create" }`

**Preconditions:**
- User is authenticated
- No entity type selected

---

### T-4.1: Backend issues presigned URL for a valid file and entity type
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Presigned URL generation

  Scenario: Valid request returns presigned URL and S3 key
    Given an authenticated user with role "CRM Admin" has selected entity type "contacts"
    And the user has selected "contacts_2024.csv" (size: 8MB, MIME: text/csv)
    When the frontend sends POST /api/imports/presigned-url with:
      | field        | value       |
      | entity_type  | contacts    |
      | filename     | contacts_2024.csv |
      | content_type | text/csv    |
      | file_size    | 8388608     |
    Then the backend responds with HTTP 200
    And the response body contains:
      | field         | constraint              |
      | presigned_url | valid S3 PUT URL        |
      | s3_key        | non-empty string        |
      | expires_at    | at least 15 min from now|
    And the presigned_url is a valid HTTPS S3 URL
```

**Test Data:**
- User: `{ email: "admin@acme.com", role: "CRM Admin", permission: "imports:create" }`
- Request body: `{ "entity_type": "contacts", "filename": "contacts_2024.csv", "content_type": "text/csv", "file_size": 8388608 }`
- Expected expiry: `now + 15 minutes` (±30 seconds tolerance)

**Preconditions:**
- User session is valid
- S3 bucket is accessible from backend
- Entity type "contacts" is a known valid value

---

### T-4.2: Backend rejects presigned URL request for invalid entity type
**Maps to:** AC-4, NFR Security
**Category:** error-handling

```gherkin
Feature: Presigned URL generation

  Scenario: Backend rejects request with unrecognized entity type
    Given an authenticated user with role "CRM Admin" is on the import screen
    When the frontend sends POST /api/imports/presigned-url with:
      | field        | value       |
      | entity_type  | invoices    |
      | filename     | test.csv    |
      | content_type | text/csv    |
      | file_size    | 1024        |
    Then the backend responds with HTTP 400 Bad Request
    And the response body contains an error indicating the entity type is invalid
    And no presigned URL is returned
```

**Test Data:**
- User: `{ email: "admin@acme.com", role: "CRM Admin", permission: "imports:create" }`
- Invalid entity type: `invoices`

**Preconditions:**
- User is authenticated
- Valid entity types are: `contacts`, `companies`, `deals`

---

### T-4.3: Backend rejects presigned URL request when file size exceeds 50MB
**Maps to:** AC-4, AC-7
**Category:** boundary / error-handling

```gherkin
Feature: Presigned URL generation

  Scenario: Backend rejects presigned URL for oversized file
    Given an authenticated user with role "CRM Admin" has selected entity type "contacts"
    When the frontend sends POST /api/imports/presigned-url with file_size: 52428801 (50MB + 1 byte)
    Then the backend responds with HTTP 400 Bad Request
    And no presigned URL is returned
    And the response indicates the file size limit was exceeded
```

**Test Data:**
- `file_size`: `52428801` (50 * 1024 * 1024 + 1)

**Preconditions:**
- User is authenticated with `imports:create` permission

---

### T-5.1: File is uploaded directly to S3 using the presigned URL
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: Direct S3 upload via presigned URL

  Scenario: Browser uploads file directly to S3 without routing through backend
    Given an authenticated user has received a valid presigned URL for "contacts_2024.csv"
    And the S3 key is "imports/user-uuid-123/1719000000000/contacts_2024.csv"
    When the browser sends HTTP PUT to the presigned URL with the file contents
    Then S3 returns HTTP 200
    And no traffic for the file bytes is routed through the CRM backend (verified by network log)
    And the file exists in the designated S3 import bucket at the expected key
```

**Test Data:**
- Presigned URL: valid S3 PUT URL (test environment)
- S3 key: `imports/user-uuid-123/1719000000000/contacts_2024.csv`
- File: `contacts_2024.csv`, 8MB, MIME `text/csv`

**Preconditions:**
- Presigned URL obtained from backend (T-4.1 completed)
- S3 bucket is accessible from test environment
- Network monitoring active to verify bypass of CRM backend

---

### T-5.2: S3 upload failure surfaces an error to the user
**Maps to:** AC-5, NFR error handling
**Category:** error-handling

```gherkin
Feature: Direct S3 upload via presigned URL

  Scenario: S3 returns non-200 error during upload
    Given an authenticated user has initiated an S3 upload
    When S3 returns a non-200 HTTP status (e.g., 403 Forbidden or 500) during the PUT request
    Then the file upload stops
    And the UI displays: "Upload failed (S3 error). Try again."
    And a "Retry" or "Try again" affordance is present
```

**Test Data:**
- Simulated S3 error: HTTP 403 (e.g., via expired URL in test environment or mock)

**Preconditions:**
- User is authenticated
- Presigned URL is set to fail in test environment

---

### T-6.1: Upload progress indicator updates during file transmission
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: Upload progress display

  Scenario: Progress bar updates at least every 2 seconds during upload
    Given an authenticated user has initiated an S3 upload of a 40MB file
    When the browser is transmitting bytes to S3
    Then a progress indicator (percentage bar or numeric %) is visible in the UI
    And the progress value increases at least once within any 2-second window during the upload
    And when the upload completes, the progress indicator shows 100% (or equivalent completion state)
```

**Test Data:**
- File: `large_contacts.csv`, 40MB, MIME `text/csv`
- Network speed: throttled to ~5Mbps to ensure multi-second upload for observation

**Preconditions:**
- User authenticated, entity type selected, presigned URL obtained
- Upload in progress (partial bytes sent)

---

### T-7.1: File over 50MB is rejected at the client before upload starts
**Maps to:** AC-7
**Category:** boundary

```gherkin
Feature: File size validation

  Scenario: File exactly 1 byte over the 50MB limit is rejected immediately
    Given an authenticated user with role "CRM Admin" is on the import screen
    And the user has selected entity type "contacts"
    When the user selects or drops "huge_export.csv" with size 52428801 bytes (50MB + 1 byte)
    Then the upload does not start
    And no presigned URL request is made to the backend
    And the inline error reads: "File exceeds the 50MB limit. Please split your data into smaller files."
    And the error is announced via aria-live="polite"
```

**Test Data:**
- File: `huge_export.csv`, size: `52428801` bytes (50 * 1024 * 1024 + 1)
- MIME: `text/csv`

**Preconditions:**
- User authenticated, entity type selected

---

### T-7.2: File exactly at 50MB boundary is accepted
**Maps to:** AC-7
**Category:** boundary

```gherkin
Feature: File size validation

  Scenario: File exactly 50MB is accepted
    Given an authenticated user with role "CRM Admin" is on the import screen
    And the user has selected entity type "contacts"
    When the user selects a file with size exactly 52428800 bytes (50MB)
    Then the upload flow proceeds normally
    And no size-rejection error is displayed
```

**Test Data:**
- File: `boundary_exact.csv`, size: `52428800` bytes (50 * 1024 * 1024)

**Preconditions:**
- User authenticated, entity type selected

---

### T-7.3: Empty file (0 bytes) is rejected before upload
**Maps to:** AC-7, NFR error handling
**Category:** boundary

```gherkin
Feature: File size validation

  Scenario: Empty file is rejected with specific error message
    Given an authenticated user with role "CRM Admin" is on the import screen
    And the user has selected entity type "contacts"
    When the user drops or selects a file with size 0 bytes
    Then the upload does not start
    And the inline error reads: "File appears to be empty."
```

**Test Data:**
- File: `empty.csv`, size: `0` bytes

**Preconditions:**
- User authenticated, entity type selected

---

### T-8.1: .xls file is rejected with unsupported format error
**Maps to:** AC-8
**Category:** error-handling

```gherkin
Feature: File format validation

  Scenario: Legacy .xls file is rejected at selection
    Given an authenticated user with role "Power User" is on the import screen
    And the user has selected entity type "deals"
    When the user drops "deals_legacy.xls" (MIME: application/vnd.ms-excel)
    Then the upload does not start
    And the inline error reads: "Unsupported file type. Only .csv and .xlsx files are accepted."
```

**Test Data:**
- File: `deals_legacy.xls`, MIME: `application/vnd.ms-excel`

**Preconditions:**
- User authenticated, entity type selected

---

### T-8.2: .json file is rejected with unsupported format error
**Maps to:** AC-8
**Category:** error-handling

```gherkin
Feature: File format validation

  Scenario: JSON file is rejected at selection
    Given an authenticated user with role "Power User" is on the import screen
    And the user has selected entity type "contacts"
    When the user drops "contacts.json" (MIME: application/json)
    Then the upload does not start
    And the inline error reads: "Unsupported file type. Only .csv and .xlsx files are accepted."
```

**Test Data:**
- File: `contacts.json`, MIME: `application/json`

**Preconditions:**
- User authenticated, entity type selected

---

### T-8.3: .pdf file is rejected with unsupported format error
**Maps to:** AC-8
**Category:** error-handling

```gherkin
Feature: File format validation

  Scenario: PDF file is rejected at selection
    Given an authenticated user with role "CRM Admin" is on the import screen
    And the user has selected entity type "contacts"
    When the user drops "report.pdf" (MIME: application/pdf)
    Then the upload does not start
    And the inline error reads: "Unsupported file type. Only .csv and .xlsx files are accepted."
```

**Test Data:**
- File: `report.pdf`, MIME: `application/pdf`

**Preconditions:**
- User authenticated, entity type selected

---

### T-9.1: Upload after presigned URL expiry fails gracefully
**Maps to:** AC-9
**Category:** edge-case

```gherkin
Feature: Presigned URL expiry handling

  Scenario: User attempts S3 upload more than 15 minutes after URL was issued
    Given an authenticated user received a presigned URL at time T
    And 15 minutes have elapsed since time T (URL is now expired)
    When the frontend attempts to PUT the file to the expired presigned URL
    Then S3 returns HTTP 403
    And the frontend does not retry automatically
    And the UI displays: "Your upload session expired. Please try again."
    And the user can click to restart the upload flow and receive a new presigned URL
```

**Test Data:**
- Presigned URL: issued with 15-minute TTL, now expired (TTL set to 1 second in test env, or clock advanced)
- File: `contacts_export.csv`, 1.2MB

**Preconditions:**
- User authenticated
- Presigned URL generated and now expired
- File was not yet uploaded

---

### T-10.1: Network interruption during S3 upload surfaces retry UI
**Maps to:** AC-10
**Category:** error-handling

```gherkin
Feature: Network interruption handling

  Scenario: Network drops during active S3 upload
    Given an authenticated user has started uploading "contacts_export.csv" (40MB) to S3
    And 20% of the file bytes have been transmitted
    When the network connection is lost (simulated via DevTools network throttle → offline)
    Then the upload stops
    And the UI displays: "Upload failed due to a network error. Please check your connection and try again."
    And a "Retry" button is visible
    And clicking "Retry" restarts the upload flow from the beginning (new presigned URL)
```

**Test Data:**
- File: `contacts_export.csv`, 40MB, throttled upload to allow interruption mid-stream
- Network: simulated offline after ~20% upload

**Preconditions:**
- User authenticated, presigned URL obtained, upload in progress

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to presigned URL endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Presigned URL endpoint authorization

  Scenario: Request with no auth token is rejected with 401
    Given no authentication token is present in the request (no Authorization header, no session cookie)
    When a POST request is made to /api/imports/presigned-url with body:
      | field        | value    |
      | entity_type  | contacts |
      | filename     | test.csv |
      | content_type | text/csv |
      | file_size    | 1024     |
    Then the response status is 401 Unauthorized
    And no presigned URL is returned
    And the response does not leak internal system information
```

**Test Data:**
- Request: no `Authorization` header, no session cookie
- Body: `{ "entity_type": "contacts", "filename": "test.csv", "content_type": "text/csv", "file_size": 1024 }`

**Preconditions:**
- Backend is running
- No active session for the request

---

### T-AUTH-2.1: Authenticated user without import permission receives 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Presigned URL endpoint authorization

  Scenario: Authenticated user lacking imports:create permission is rejected with 403
    Given an authenticated user with role "Viewer" and no "imports:create" permission
    When a POST request is made to /api/imports/presigned-url with a valid auth token and body:
      | field        | value    |
      | entity_type  | contacts |
      | filename     | test.csv |
      | content_type | text/csv |
      | file_size    | 1024     |
    Then the response status is 403 Forbidden
    And the response body contains: { "required_permission": "imports:create" }
    And no presigned URL is returned
```

**Test Data:**
- User: `{ email: "viewer@acme.com", role: "Viewer", permissions: [] }`
- Valid JWT for above user

**Preconditions:**
- User account exists with no `imports:create` permission
- Valid authentication token issued for that user

---

## NFR Tests

### T-NFR-1.1: Backend returns 500 on presigned URL request — UI shows fallback error
**Maps to:** NFR error handling
**Category:** error-handling

```gherkin
Feature: Presigned URL generation error handling

  Scenario: Backend returns 500 and UI shows user-friendly error
    Given an authenticated user has selected entity type "contacts" and a valid file
    And the backend presigned URL endpoint is configured to return 500
    When the frontend POSTs to /api/imports/presigned-url
    Then the backend returns HTTP 500
    And the UI displays: "Unable to start upload. Please try again in a moment."
    And the upload does not proceed
```

**Test Data:**
- Backend: stubbed to return 500 for this request in test environment

**Preconditions:**
- User authenticated, entity type selected, valid file ready

---

### T-NFR-2.1: S3 non-200 error response is surfaced to user
**Maps to:** NFR error handling
**Category:** error-handling

```gherkin
Feature: S3 upload error handling

  Scenario: S3 returns an XML error response and UI displays generic error
    Given an authenticated user has received a valid presigned URL
    When the browser PUT request to S3 returns HTTP 403 with S3 XML error body
    Then the frontend parses the S3 error response
    And the UI displays: "Upload failed (S3 error). Try again."
    And technical error details are not exposed to the user
```

**Test Data:**
- S3 response: HTTP 403, body `<Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>`

**Preconditions:**
- Presigned URL configured to fail in test environment

---

### T-NFR-3.1: Backend returns 500 on presigned URL — UI shows correct fallback message
**Maps to:** NFR error handling
**Category:** error-handling

*(See T-NFR-1.1 — covers the same scenario.)*

---

### T-NFR-4.1: Backend rejects invalid entity type with 400
**Maps to:** NFR security / input validation
**Category:** error-handling

```gherkin
Feature: Entity type input validation

  Scenario: Backend rejects unknown entity type value before issuing presigned URL
    Given an authenticated user with role "CRM Admin" is on the import screen
    When the frontend sends POST /api/imports/presigned-url with entity_type: "employees"
    Then the backend returns HTTP 400
    And the response body identifies "entity_type" as the invalid field
    And no presigned URL is issued
```

**Test Data:**
- `entity_type`: `employees` (not one of `contacts`, `companies`, `deals`)

**Preconditions:**
- User authenticated with `imports:create` permission

---

---

# Test Specifications: UPLOAD-02 — S3 upload completion callback and import job initialization

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1 | happy-path (infrastructure) |
| AC-4 | T-4.1 | security / error-handling |
| AC-5 | T-5.1 | edge-case |
| AC-6 | T-6.1, T-6.2, T-6.3 | error-handling |
| AC-7 | T-7.1, T-7.2 | error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |
| NFR: S3 verify timeout | T-NFR-1.1 | error-handling |
| NFR: DB write failure | T-NFR-2.1 | error-handling |

---

## Test Cases

### T-1.1: Confirmation endpoint creates ImportJob and returns 201 with job_id
**Maps to:** AC-1, AC-2
**Category:** happy-path

```gherkin
Feature: Import job initialization

  Scenario: Valid confirmation creates ImportJob with pending status
    Given an authenticated user with role "CRM Admin" has successfully uploaded "contacts_2024.csv" to S3
    And the file exists in the import bucket at key "imports/user-uuid-abc/1719000000000/contacts_2024.csv"
    When the frontend POSTs to /api/imports/confirm with:
      | field             | value                                                              |
      | s3_key            | imports/user-uuid-abc/1719000000000/contacts_2024.csv             |
      | entity_type       | contacts                                                           |
      | original_filename | contacts_2024.csv                                                  |
    Then the backend returns HTTP 201 Created
    And the response body contains:
      | field      | constraint                         |
      | job_id     | valid UUID (non-empty string)       |
      | status     | "pending"                          |
      | created_at | valid ISO 8601 timestamp           |
    And an ImportJob record exists in the database with:
      | field             | value                                                              |
      | status            | pending                                                            |
      | entity_type       | contacts                                                           |
      | original_filename | contacts_2024.csv                                                  |
      | s3_key            | imports/user-uuid-abc/1719000000000/contacts_2024.csv             |
      | uploader_user_id  | user-uuid-abc                                                      |
```

**Test Data:**
- User: `{ id: "user-uuid-abc", email: "admin@acme.com", role: "CRM Admin", permission: "imports:create" }`
- S3 key: `imports/user-uuid-abc/1719000000000/contacts_2024.csv` (file must exist in S3)
- Entity type: `contacts`
- Original filename: `contacts_2024.csv`

**Preconditions:**
- User authenticated
- File exists in the S3 import bucket at the specified key
- Database is accessible

---

### T-1.2: uploader_user_id is taken from session, not request body
**Maps to:** AC-1, NFR security
**Category:** security / happy-path

```gherkin
Feature: Import job initialization

  Scenario: uploader_user_id is always the session user, not a body parameter
    Given an authenticated user with id "user-uuid-abc" has uploaded a file to S3
    When the frontend POSTs to /api/imports/confirm with the S3 key, entity_type, and original_filename
    And the request body does not include a "user_id" field
    Then the created ImportJob has uploader_user_id = "user-uuid-abc" (from session)
    And the endpoint does not accept or process a "user_id" value from the request body
```

**Test Data:**
- Session user ID: `user-uuid-abc`
- Request body: `{ "s3_key": "imports/user-uuid-abc/1719000000000/test.csv", "entity_type": "contacts", "original_filename": "test.csv" }` (no user_id field)

**Preconditions:**
- User authenticated, file exists in S3

---

### T-2.1: Response job_id is stable and usable for subsequent tracking calls
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Job ID for downstream tracking

  Scenario: job_id from confirmation response is retrievable in a subsequent status call
    Given an authenticated user has confirmed an S3 upload and received job_id "550e8400-e29b-41d4-a716-446655440000"
    When the frontend makes a GET request to /api/imports/550e8400-e29b-41d4-a716-446655440000/status
    Then the backend returns HTTP 200
    And the response references the same job_id "550e8400-e29b-41d4-a716-446655440000"
    And the status is "pending" (job not yet processed)
```

**Test Data:**
- `job_id`: `550e8400-e29b-41d4-a716-446655440000`

**Preconditions:**
- Import confirmation completed (T-1.1 passed)
- A status endpoint exists (or this serves as an integration smoke test)

---

### T-3.1: S3 bucket lifecycle rule auto-deletes objects after 90 days
**Maps to:** AC-3
**Category:** happy-path (infrastructure verification)

```gherkin
Feature: S3 90-day lifecycle policy

  Scenario: Import bucket has a lifecycle rule configured for 90-day expiry
    Given the S3 import bucket has been provisioned with the lifecycle configuration from this story
    When the bucket's lifecycle rules are retrieved via the AWS SDK or CLI
    Then at least one rule exists with:
      | field              | value                          |
      | status             | Enabled                        |
      | expiration days    | 90                             |
      | prefix (if scoped) | empty or "imports/"            |
    And the rule applies to all objects in the designated import bucket path
```

**Test Data:**
- Bucket: `crm-imports-{environment}` (test environment bucket)
- Expected lifecycle: `Expiration.Days = 90`

**Preconditions:**
- Terraform/IaC for S3 bucket lifecycle has been applied to the test environment
- AWS credentials available in test runner (or test queries the infra state)

---

### T-4.1: Confirmation with fabricated S3 key is rejected with 400
**Maps to:** AC-4
**Category:** security

```gherkin
Feature: S3 key verification

  Scenario: Backend rejects confirmation when S3 key does not exist in bucket
    Given an authenticated user with role "CRM Admin"
    When the frontend POSTs to /api/imports/confirm with:
      | field             | value                                      |
      | s3_key            | imports/user-uuid-abc/fake/nonexistent.csv |
      | entity_type       | contacts                                   |
      | original_filename | nonexistent.csv                            |
    Then the backend attempts to verify the key exists in S3
    And S3 confirms the key does not exist
    And the backend returns HTTP 400 Bad Request
    And the response body is: { "error": "File not found in upload bucket. Upload may have failed." }
    And no ImportJob record is created
```

**Test Data:**
- S3 key: `imports/user-uuid-abc/fake/nonexistent.csv` (guaranteed to not exist)
- User: `{ id: "user-uuid-abc", permission: "imports:create" }`

**Preconditions:**
- User authenticated
- Specified S3 key does not exist in the import bucket

---

### T-5.1: Duplicate confirmation for same S3 key is idempotent
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: Idempotent confirmation

  Scenario: Second confirmation for the same S3 key returns existing job_id without creating a duplicate
    Given an authenticated user has already confirmed S3 key "imports/user-uuid-abc/1719000000000/contacts_2024.csv"
    And ImportJob with job_id "550e8400-e29b-41d4-a716-446655440000" already exists for that key
    When the frontend POSTs to /api/imports/confirm again with the same:
      | field             | value                                                              |
      | s3_key            | imports/user-uuid-abc/1719000000000/contacts_2024.csv             |
      | entity_type       | contacts                                                           |
      | original_filename | contacts_2024.csv                                                  |
    Then the backend returns HTTP 200 OK
    And the response body contains job_id: "550e8400-e29b-41d4-a716-446655440000" (the existing job)
    And only one ImportJob record exists for that S3 key (no duplicate created)
```

**Test Data:**
- Existing ImportJob: `{ job_id: "550e8400-e29b-41d4-a716-446655440000", s3_key: "imports/user-uuid-abc/1719000000000/contacts_2024.csv", status: "pending" }`

**Preconditions:**
- Initial confirmation already completed
- Existing ImportJob in database

---

### T-6.1: Confirmation missing s3_key returns 400 with field-level error
**Maps to:** AC-6
**Category:** error-handling

```gherkin
Feature: Request field validation

  Scenario: Missing s3_key field returns 400 with field-level error
    Given an authenticated user with role "CRM Admin"
    When the frontend POSTs to /api/imports/confirm with:
      | field             | value             |
      | entity_type       | contacts          |
      | original_filename | contacts_2024.csv |
    And the request body omits "s3_key"
    Then the backend returns HTTP 400 Bad Request
    And the response body identifies "s3_key" as a missing required field
    And no ImportJob is created
```

**Test Data:**
- Request body: `{ "entity_type": "contacts", "original_filename": "contacts_2024.csv" }` (no `s3_key`)

**Preconditions:**
- User authenticated with `imports:create` permission

---

### T-6.2: Confirmation missing entity_type returns 400 with field-level error
**Maps to:** AC-6
**Category:** error-handling

```gherkin
Feature: Request field validation

  Scenario: Missing entity_type field returns 400 with field-level error
    Given an authenticated user with role "CRM Admin"
    When the frontend POSTs to /api/imports/confirm with:
      | field             | value                                                   |
      | s3_key            | imports/user-uuid-abc/1719000000000/contacts_2024.csv  |
      | original_filename | contacts_2024.csv                                       |
    And the request body omits "entity_type"
    Then the backend returns HTTP 400 Bad Request
    And the response body identifies "entity_type" as a missing required field
```

**Test Data:**
- Request body: `{ "s3_key": "imports/user-uuid-abc/1719000000000/contacts_2024.csv", "original_filename": "contacts_2024.csv" }` (no `entity_type`)

**Preconditions:**
- User authenticated

---

### T-6.3: Confirmation missing original_filename returns 400 with field-level error
**Maps to:** AC-6
**Category:** error-handling

```gherkin
Feature: Request field validation

  Scenario: Missing original_filename field returns 400 with field-level error
    Given an authenticated user with role "CRM Admin"
    When the frontend POSTs to /api/imports/confirm with:
      | field             | value                                                   |
      | s3_key            | imports/user-uuid-abc/1719000000000/contacts_2024.csv  |
      | entity_type       | contacts                                                |
    And the request body omits "original_filename"
    Then the backend returns HTTP 400 Bad Request
    And the response body identifies "original_filename" as a missing required field
```

**Test Data:**
- Request body: `{ "s3_key": "imports/user-uuid-abc/1719000000000/contacts_2024.csv", "entity_type": "contacts" }` (no `original_filename`)

**Preconditions:**
- User authenticated

---

### T-7.1: Confirmation with entity_type "employees" is rejected
**Maps to:** AC-7
**Category:** error-handling

```gherkin
Feature: Entity type validation on confirmation

  Scenario: Invalid entity_type value is rejected with 400
    Given an authenticated user with role "Power User"
    When the frontend POSTs to /api/imports/confirm with:
      | field             | value                                                  |
      | s3_key            | imports/user-uuid-xyz/1719000000000/file.csv          |
      | entity_type       | employees                                              |
      | original_filename | file.csv                                               |
    Then the backend returns HTTP 400 Bad Request
    And the response body is: { "error": "Invalid entity type. Must be one of: contacts, companies, deals." }
    And no ImportJob is created
```

**Test Data:**
- `entity_type`: `employees`

**Preconditions:**
- User authenticated, S3 file exists

---

### T-7.2: All three valid entity types are accepted
**Maps to:** AC-7 (inverse / boundary)
**Category:** happy-path

```gherkin
Feature: Entity type validation on confirmation

  Scenario Outline: Each valid entity type produces a successful ImportJob
    Given an authenticated user has uploaded a file to S3
    When the frontend POSTs to /api/imports/confirm with entity_type "<entity_type>"
    Then the backend returns HTTP 201
    And the ImportJob record has entity_type: "<entity_type>"

    Examples:
      | entity_type |
      | contacts    |
      | companies   |
      | deals       |
```

**Test Data:**
- One S3 file per scenario (or re-use same key across scenarios if idempotency is disabled for test purposes)

**Preconditions:**
- Files exist in S3 for each scenario

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to confirm endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Confirmation endpoint authorization

  Scenario: Request with no auth token is rejected with 401
    Given no authentication token is present
    When a POST request is made to /api/imports/confirm with a valid-looking body:
      | field             | value                                                  |
      | s3_key            | imports/user-uuid-abc/1719000000000/contacts_2024.csv |
      | entity_type       | contacts                                               |
      | original_filename | contacts_2024.csv                                      |
    Then the response status is 401 Unauthorized
    And no ImportJob is created
```

**Test Data:**
- No `Authorization` header, no session cookie

**Preconditions:**
- Backend running, no active session

---

### T-AUTH-2.1: Authenticated user without imports:create permission receives 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Confirmation endpoint authorization

  Scenario: Authenticated user without imports:create permission is rejected with 403
    Given a user with role "Viewer" authenticated with a valid JWT
    And the "Viewer" role does not include "imports:create" permission
    When a POST request is made to /api/imports/confirm with valid body fields
    Then the response status is 403 Forbidden
    And the response body contains: { "required_permission": "imports:create" }
    And no ImportJob is created
```

**Test Data:**
- User: `{ email: "viewer@acme.com", role: "Viewer", permissions: [] }`

**Preconditions:**
- Viewer user account exists, JWT issued

---

## NFR Tests

### T-NFR-1.1: S3 key verification timeout returns 503
**Maps to:** NFR error handling
**Category:** error-handling

```gherkin
Feature: S3 key verification error handling

  Scenario: Backend S3 check times out and returns 503
    Given an authenticated user POSTs a valid confirmation request
    And the S3 connectivity is degraded (simulated via network timeout in test env)
    When the backend's S3 HeadObject call times out
    Then the backend returns HTTP 503
    And the response body contains: "Unable to verify upload. Please try again."
    And no ImportJob is created
```

**Test Data:**
- S3 mock configured to time out after 200ms for this test

**Preconditions:**
- User authenticated, S3 mock/stub configured for timeout scenario

---

### T-NFR-2.1: Database write failure returns 500 with correlation ID
**Maps to:** NFR error handling
**Category:** error-handling

```gherkin
Feature: Database write error handling

  Scenario: DB failure during ImportJob creation returns 500 with no partial job_id
    Given an authenticated user POSTs a valid confirmation request
    And the S3 key verification succeeds
    And the database write is configured to fail (simulated via fault injection)
    When the backend attempts to create the ImportJob record
    And the database throws an error
    Then the backend returns HTTP 500
    And the response body does not contain a job_id
    And the response body contains a correlation_id for log lookup
    And the error is logged server-side with the correlation_id
```

**Test Data:**
- DB fault injection: simulate constraint violation or connection drop after S3 check passes

**Preconditions:**
- User authenticated, S3 check passes, DB fault injected

---

---

# Test Specifications: MAP-01 — Map CSV/xlsx columns to CRM fields

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1, T-4.2 | error-handling |
| AC-5 | T-5.1 | edge-case |
| AC-6 | T-6.1 | edge-case |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1 | happy-path |
| AC-9 | T-9.1 | edge-case |
| AC-10 | T-10.1, T-10.2 | happy-path, security |
| AC-AUTH-1 | T-AUTH-1.1, T-AUTH-1.2 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |
| NFR: S3 read failure | T-NFR-1.1 | error-handling |
| NFR: ImportJob not found | T-NFR-2.1 | error-handling |
| NFR: CRM fields API failure | T-NFR-3.1 | error-handling |
| NFR: Job ownership | T-NFR-4.1 | security |

---

## Test Cases

### T-1.1: Mapping screen lists all column headers from the uploaded file
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Column mapping screen

  Scenario: All column headers from CSV first row are displayed in upload order
    Given an authenticated user with role "CRM Admin" has completed an upload with job_id "job-uuid-001"
    And the uploaded file "contacts_export.csv" has a first row with headers: ["First Name", "Last Name", "Email", "Phone", "Company"]
    When the user navigates to the mapping screen for job-uuid-001
    Then the mapping screen displays exactly 5 column rows
    And the column names displayed are: "First Name", "Last Name", "Email", "Phone", "Company" in that order
```

**Test Data:**
- ImportJob: `{ job_id: "job-uuid-001", entity_type: "contacts", status: "pending" }`
- File headers (row 1 of S3 file): `["First Name", "Last Name", "Email", "Phone", "Company"]`

**Preconditions:**
- User authenticated with `imports:create` permission
- Import job exists and belongs to the user
- File is readable in S3

---

### T-1.2: Mapping screen correctly handles a file with 200 columns
**Maps to:** AC-1, NFR performance
**Category:** happy-path / boundary

```gherkin
Feature: Column mapping screen

  Scenario: Mapping screen renders without layout degradation for a 200-column file
    Given an authenticated user has completed an upload of a CSV with 200 columns
    When the mapping screen loads
    Then all 200 column rows are displayed (scrollable if necessary)
    And the page does not crash or render incorrectly
    And the screen load time is under 3000ms (p95 per NFR)
```

**Test Data:**
- File: CSV with 200 unique column headers (`Col_1` through `Col_200`)
- ImportJob: valid job for this file

**Preconditions:**
- File with 200 columns uploaded to S3
- ImportJob created via UPLOAD-02

---

### T-2.1: CRM field dropdown for contacts import shows only contacts fields
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Entity-scoped CRM field dropdown

  Scenario: Contacts import shows contact fields only in the dropdown
    Given an authenticated user is on the mapping screen for a contacts import
    And the CRM has standard contact fields: ["First Name", "Last Name", "Email", "Phone", "Job Title"]
    And the CRM has standard deal fields: ["Deal Name", "Amount", "Close Date"]
    When the user opens the CRM field dropdown for any column
    Then the dropdown contains "First Name", "Last Name", "Email", "Phone", "Job Title"
    And the dropdown does NOT contain "Deal Name", "Amount", or "Close Date"
    And the dropdown contains the "Ignore (skip this column)" option
```

**Test Data:**
- Entity type: `contacts`
- CRM field configuration: standard contacts fields + standard deals fields both defined

**Preconditions:**
- User authenticated
- Mapping screen loaded for contacts ImportJob
- CRM fields API returns the full field list

---

### T-2.2: CRM field dropdown for deals import shows only deals fields
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Entity-scoped CRM field dropdown

  Scenario: Deals import shows deal fields only
    Given an authenticated user is on the mapping screen for a deals import
    And the CRM has standard deal fields: ["Deal Name", "Amount", "Close Date", "Owner"]
    And the CRM has standard contact fields: ["First Name", "Last Name", "Email"]
    When the user opens the CRM field dropdown for any column
    Then the dropdown contains "Deal Name", "Amount", "Close Date", "Owner"
    And the dropdown does NOT contain "First Name", "Last Name", or "Email"
```

**Test Data:**
- Entity type: `deals`

**Preconditions:**
- ImportJob entity_type is `deals`

---

### T-3.1: A column marked as "Ignore" is excluded from validation and subsequent steps
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Ignore column mapping

  Scenario: Column set to Ignore does not appear in subsequent steps
    Given an authenticated user is on the mapping screen
    And the file has columns: ["First Name", "Last Name", "Internal Notes", "Email"]
    And all required fields are mapped
    When the user selects "Ignore (skip this column)" for "Internal Notes"
    And the user clicks "Continue to Validate"
    Then the validation step does not include the "Internal Notes" column
    And no validation errors are raised for unmapped data in that column
```

**Test Data:**
- Columns: `["First Name", "Last Name", "Internal Notes", "Email"]`
- Required fields: `First Name`, `Email` (at minimum)
- Mapping: `First Name` → CRM First Name, `Email` → CRM Email, `Last Name` → CRM Last Name, `Internal Notes` → Ignore

**Preconditions:**
- User authenticated, mapping screen loaded

---

### T-4.1: Clicking "Continue to Validate" with an unmapped required field blocks progression
**Maps to:** AC-4
**Category:** error-handling

```gherkin
Feature: Required field validation on mapping

  Scenario: Form does not advance when a required CRM field has no column mapped
    Given an authenticated user is on the mapping screen for a contacts import
    And the required CRM fields for contacts are: ["Email", "First Name"]
    And the user has mapped "First Name" but has NOT mapped "Email" to any column
    When the user clicks "Continue to Validate"
    Then the user remains on the mapping screen
    And the "Email" row (or its required indicator) is highlighted with an error state
    And an error message reads: "This required field has no column mapped to it" (adjacent to each unmapped required field)
    And the error messages are announced via aria-live="polite"
```

**Test Data:**
- Required fields: `Email`, `First Name`
- Mapped: `First Name` → CRM "First Name"
- Unmapped: `Email`

**Preconditions:**
- User authenticated, mapping screen loaded with contacts ImportJob

---

### T-4.2: Multiple unmapped required fields all show errors simultaneously
**Maps to:** AC-4
**Category:** error-handling

```gherkin
Feature: Required field validation on mapping

  Scenario: All unmapped required fields are highlighted simultaneously
    Given an authenticated user is on the mapping screen with 3 required fields: ["Email", "First Name", "Last Name"]
    And the user has not mapped any of them
    When the user clicks "Continue to Validate"
    Then all three required field rows show the error: "This required field has no column mapped to it"
    And the form does not advance
```

**Test Data:**
- Required fields: `Email`, `First Name`, `Last Name` — all unmapped

**Preconditions:**
- User authenticated, mapping screen loaded

---

### T-5.1: Mapping a CRM field to a second column is prevented
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: Duplicate CRM field mapping prevention

  Scenario: Attempting to map the same CRM field to two columns shows an error
    Given an authenticated user is on the mapping screen
    And the file has columns: ["Email Address", "Email Backup", "First Name"]
    And the user has already mapped "Email Address" → CRM "Email"
    When the user attempts to map "Email Backup" → CRM "Email"
    Then the system prevents the duplicate mapping
    And an error message reads: "Email is already mapped to column Email Address. Each CRM field can only be mapped once."
    And "Email Backup" remains unmapped
```

**Test Data:**
- Columns: `["Email Address", "Email Backup", "First Name"]`
- Existing mapping: `Email Address` → CRM `Email`
- Attempted mapping: `Email Backup` → CRM `Email`

**Preconditions:**
- User authenticated, mapping screen loaded, initial mapping set

---

### T-6.1: .xlsx with merged header cells surfaces an error and blocks progression
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Merged cell detection in xlsx headers

  Scenario: Mapping screen shows error for xlsx with merged header cells
    Given an authenticated user has uploaded an .xlsx file where row 1 contains merged cells (e.g., columns A and B are merged)
    When the mapping screen loads for that ImportJob
    Then the screen does not show a partial column list
    And an error message reads: "One or more column headers could not be read (merged cells detected). Please unmerge header cells in your file and re-upload."
    And the user cannot proceed to the next step from this screen
    And a link or button to "Re-upload" is visible
```

**Test Data:**
- File: `merged_headers.xlsx` — row 1 has cells A1:B1 merged, value "Full Name"

**Preconditions:**
- File uploaded and ImportJob created
- Backend header-read logic detects merged cells

---

### T-7.1: File with no header row shows raw first-row values with an inline notice
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Headerless file handling

  Scenario: CSV without header row displays first-row data as column names with a warning
    Given an authenticated user has uploaded a CSV where row 1 contains data (not headers): ["Alice", "Smith", "alice@example.com"]
    When the mapping screen loads
    Then the mapping screen shows column names: "Alice", "Smith", "alice@example.com" (raw first-row values)
    And an inline notice reads: "Column names were read from the first row of your file. If this row contains data rather than headers, re-upload a file with a header row."
    And the user can still proceed to map these columns
```

**Test Data:**
- CSV row 1 (interpreted as headers): `Alice,Smith,alice@example.com`

**Preconditions:**
- File uploaded and ImportJob created
- No actual header row present

---

### T-8.1: Active custom fields appear in the dropdown alongside standard fields
**Maps to:** AC-8
**Category:** happy-path

```gherkin
Feature: Custom field display in mapping

  Scenario: Active custom fields for the entity type appear in the CRM field dropdown
    Given the CRM has 3 active custom fields for contacts: ["LinkedIn URL", "Lead Source", "Industry Vertical"]
    And an authenticated user is on the mapping screen for a contacts import
    When the user opens the CRM field dropdown for any column
    Then "LinkedIn URL", "Lead Source", and "Industry Vertical" appear in the dropdown
    And they appear alongside standard contact fields (e.g., "Email", "First Name")
```

**Test Data:**
- Active custom fields: `{ entity: "contacts", fields: ["LinkedIn URL", "Lead Source", "Industry Vertical"], status: "active" }`

**Preconditions:**
- Custom fields configured and active in CRM test environment
- User authenticated, contacts ImportJob on mapping screen

---

### T-9.1: Deactivated custom fields do not appear in the dropdown
**Maps to:** AC-9
**Category:** edge-case

```gherkin
Feature: Custom field display in mapping

  Scenario: Archived/deactivated custom field is hidden from dropdown
    Given the CRM has a deactivated custom field "Legacy Campaign Code" for contacts
    And the CRM has an active custom field "LinkedIn URL" for contacts
    When the user opens the CRM field dropdown on the mapping screen for a contacts import
    Then "Legacy Campaign Code" does NOT appear in the dropdown
    And "LinkedIn URL" DOES appear in the dropdown
```

**Test Data:**
- Deactivated field: `{ name: "Legacy Campaign Code", entity: "contacts", status: "inactive" }`
- Active field: `{ name: "LinkedIn URL", entity: "contacts", status: "active" }`

**Preconditions:**
- Both fields exist in CRM; one deactivated

---

### T-10.1: Valid mapping is persisted to ImportJob as JSON on "Continue to Validate"
**Maps to:** AC-10
**Category:** happy-path

```gherkin
Feature: Mapping persistence

  Scenario: Completed mapping is saved to ImportJob record and user advances
    Given an authenticated user is on the mapping screen for job-uuid-001
    And the file has columns: ["First Name", "Email", "Phone", "Notes"]
    And required fields "First Name" and "Email" are mapped:
      | column index | CRM field  |
      | 0            | first_name |
      | 1            | email      |
    And "Phone" is mapped to "phone"
    And "Notes" is set to "Ignore"
    When the user clicks "Continue to Validate"
    Then the backend saves the mapping to ImportJob job-uuid-001 as:
      { "0": "first_name", "1": "email", "2": "phone", "3": null }
    And the ImportJob status advances to "mapping_complete" (or equivalent)
    And the user is redirected to the validation step
```

**Test Data:**
- ImportJob: `{ job_id: "job-uuid-001", entity_type: "contacts" }`
- Expected mapping JSON: `{ "0": "first_name", "1": "email", "2": "phone", "3": null }`

**Preconditions:**
- User authenticated, all required fields mapped

---

### T-10.2: User cannot save mapping for a job they do not own
**Maps to:** AC-10, NFR security
**Category:** security

```gherkin
Feature: Mapping persistence authorization

  Scenario: User B cannot save mapping to User A's ImportJob
    Given User A owns ImportJob with job_id "job-uuid-001"
    And User B is authenticated with role "Power User" and permission "imports:create"
    When User B sends a POST to /api/imports/job-uuid-001/mapping with a valid mapping body
    Then the backend returns HTTP 403 Forbidden
    And the ImportJob mapping is not modified
```

**Test Data:**
- Job owner: `user-uuid-A`
- Requester: `user-uuid-B` (different user, valid token)

**Preconditions:**
- Both users authenticated
- ImportJob created by user-uuid-A

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to load mapping screen headers returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Mapping screen authorization

  Scenario: Unauthenticated request to header read endpoint returns 401
    Given no authentication token is present
    When a GET request is made to /api/imports/job-uuid-001/headers
    Then the response status is 401 Unauthorized
    And no file header data is returned
```

**Test Data:**
- No `Authorization` header, no session cookie

**Preconditions:**
- No active session

---

### T-AUTH-1.2: Unauthenticated request to save mapping returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Mapping screen authorization

  Scenario: Unauthenticated POST to mapping save endpoint returns 401
    Given no authentication token is present
    When a POST request is made to /api/imports/job-uuid-001/mapping with a valid mapping body
    Then the response status is 401 Unauthorized
    And the mapping is not saved
```

**Test Data:**
- No auth token
- Body: `{ "0": "first_name", "1": "email" }`

**Preconditions:**
- No active session

---

### T-AUTH-2.1: Authenticated user without imports:create cannot access mapping endpoints
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Mapping screen authorization

  Scenario: User without imports:create permission receives 403 on mapping endpoints
    Given an authenticated user with role "Viewer" (no imports:create permission)
    When a GET request is made to /api/imports/job-uuid-001/headers with a valid Viewer JWT
    Then the response status is 403 Forbidden
    And the response body contains: { "required_permission": "imports:create" }
```

**Test Data:**
- User: `{ email: "viewer@acme.com", role: "Viewer", permissions: [] }`

**Preconditions:**
- Viewer account exists with valid JWT

---

## NFR Tests

### T-NFR-1.1: S3 file read failure shows re-upload prompt
**Maps to:** NFR error handling
**Category:** error-handling

```gherkin
Feature: S3 read error handling

  Scenario: S3 file unavailable when loading mapping screen
    Given an authenticated user navigates to the mapping screen for job-uuid-001
    And the S3 file for that ImportJob has been deleted or is unavailable
    When the backend attempts to read the file headers from S3
    Then the mapping screen displays: "Could not read your file. It may have been deleted. Please re-upload."
    And the user cannot proceed to mapping
    And a "Re-upload" button is visible
```

**Test Data:**
- S3 file: deleted from bucket before screen load

**Preconditions:**
- ImportJob exists but S3 file has been removed

---

### T-NFR-2.1: ImportJob not found redirects user to import start
**Maps to:** NFR error handling
**Category:** error-handling

```gherkin
Feature: ImportJob not found handling

  Scenario: Navigating to mapping screen for nonexistent job redirects to import start
    Given an authenticated user navigates to the mapping screen with job_id "nonexistent-job-id"
    When the backend looks up ImportJob "nonexistent-job-id"
    And no record is found
    Then the backend returns HTTP 404
    And the frontend redirects the user to the import start screen
    And a message reads: "Import session not found. Please start a new import."
```

**Test Data:**
- `job_id`: `nonexistent-job-id` (does not exist in DB)

**Preconditions:**
- User authenticated

---

### T-NFR-3.1: CRM fields API failure shows refresh prompt
**Maps to:** NFR error handling
**Category:** error-handling

```gherkin
Feature: CRM fields API error handling

  Scenario: CRM fields API is unavailable when loading mapping screen
    Given an authenticated user navigates to the mapping screen
    And the CRM fields API call fails (timeout or 500)
    When the mapping screen attempts to populate the CRM field dropdowns
    Then the dropdowns cannot be populated
    And the screen displays: "Unable to load CRM fields. Try refreshing the page."
    And a "Refresh" button is visible
```

**Test Data:**
- CRM fields API: stubbed to return 500 in test environment

**Preconditions:**
- User authenticated, ImportJob valid, S3 file readable, CRM fields API degraded

---

### T-NFR-4.1: Backend validates that saved CRM field names are real active fields
**Maps to:** NFR security (mapping save endpoint input validation)
**Category:** security

```gherkin
Feature: Mapping save input validation

  Scenario: Mapping save request with fabricated CRM field name is rejected
    Given an authenticated user with role "CRM Admin"
    When the user POSTs a mapping to /api/imports/job-uuid-001/mapping with:
      { "0": "email", "1": "__proto__", "2": "evil_injection_field" }
    Then the backend validates each CRM field name against the list of active fields
    And the backend returns HTTP 400
    And the response identifies "__proto__" and "evil_injection_field" as invalid field names
    And the mapping is not saved
```

**Test Data:**
- Valid field: `email`
- Invalid fields: `__proto__`, `evil_injection_field`

**Preconditions:**
- User authenticated, valid ImportJob

---

---

# Test Specifications: MAP-02 — Save and load column mapping templates

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, boundary |
| AC-2 | T-2.1, T-2.2 | happy-path, edge-case |
| AC-3 | T-3.1, T-3.2 | happy-path, edge-case |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1 | edge-case |
| AC-6 | T-6.1, T-6.2 | happy-path |
| AC-7 | T-7.1 | happy-path |
| AC-8 | T-8.1 | edge-case |
| AC-9 | T-9.1, T-9.2, T-9.3 | boundary |
| AC-10 | T-10.1 | security |
| AC-AUTH-1 | T-AUTH-1.1, T-AUTH-1.2, T-AUTH-1.3, T-AUTH-1.4 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |
| NFR: DB save failure | T-NFR-1.1 | error-handling |
| NFR: DB delete failure | T-NFR-2.1 | error-handling |
| NFR: Template not found on mutate | T-NFR-3.1 | error-handling |
| NFR: XSS prevention | T-NFR-4.1 | security |

---

## Test Cases

### T-1.1: User saves a new mapping template with a valid name
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Save column mapping template

  Scenario: User saves a contacts mapping template named "Salesforce Export"
    Given an authenticated user with role "CRM Admin" is on the mapping screen for a contacts import
    And the user has mapped at least one column: "Email Address" → CRM "email"
    When the user clicks "Save as template"
    And enters the template name "Salesforce Export"
    And submits the save dialog
    Then the template is saved to the backend
    And the success message reads: "Template 'Salesforce Export' saved."
    And the template is associated with the current user's ID and entity type "contacts"
```

**Test Data:**
- User: `{ id: "user-uuid-abc", email: "admin@acme.com", role: "CRM Admin", permission: "imports:create" }`
- Template name: `Salesforce Export`
- Entity type: `contacts`
- Mapping: `{ "Email Address": "email" }`

**Preconditions:**
- User authenticated, on mapping screen, at least one column mapped

---

### T-1.2: User saves a template with a name of exactly 100 characters (boundary)
**Maps to:** AC-1, AC-9
**Category:** boundary

```gherkin
Feature: Save column mapping template

  Scenario: Template name at exactly 100 characters is accepted
    Given an authenticated user is on the mapping screen with a column mapped
    When the user saves a template with name "A" * 100 (exactly 100 characters)
    Then the template is saved successfully
    And the success message reads: "Template '<100-char-name>' saved."
```

**Test Data:**
- Template name: `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA` (100 A's)

**Preconditions:**
- User authenticated, column mapped

---

### T-2.1: Saved contacts template appears in "Load template" dropdown for contacts import
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Template visibility in dropdown

  Scenario: Saved contacts template appears in new contacts import
    Given user "admin@acme.com" has a saved contacts template named "Salesforce Export"
    When the user starts a new contacts import and navigates to the mapping screen
    And opens the "Load template" dropdown
    Then "Salesforce Export" appears in the dropdown list
```

**Test Data:**
- Existing template: `{ name: "Salesforce Export", entity_type: "contacts", owner: "user-uuid-abc" }`

**Preconditions:**
- Template saved via T-1.1
- New contacts ImportJob created

---

### T-2.2: Contacts template does NOT appear in a deals import dropdown
**Maps to:** AC-2, AC-5 (cross-coverage)
**Category:** edge-case

```gherkin
Feature: Template entity-type scoping

  Scenario: Contacts template is hidden on a deals import mapping screen
    Given user "admin@acme.com" has a saved contacts template named "Salesforce Export"
    When the user starts a new deals import and navigates to the mapping screen
    And opens the "Load template" dropdown
    Then "Salesforce Export" does NOT appear in the dropdown
```

**Test Data:**
- Existing template: `{ name: "Salesforce Export", entity_type: "contacts" }`
- Current import: entity_type `deals`

**Preconditions:**
- Contacts template saved, currently on a deals import mapping screen

---

### T-3.1: Loading a template pre-fills matching column headers
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Template application

  Scenario: Loading a template maps matching column headers automatically
    Given user "admin@acme.com" has a saved contacts template with stored mappings:
      { "Email Address": "email", "First Name": "first_name", "Company": "company_name" }
    And the current CSV file has columns: ["Email Address", "First Name", "Job Title", "Phone"]
    When the user selects the template from the "Load template" dropdown
    Then:
      | column       | mapped CRM field | pre-filled? |
      | Email Address | email           | yes         |
      | First Name    | first_name      | yes         |
      | Job Title     | (unmapped)      | no          |
      | Phone         | (unmapped)      | no          |
    And columns "Job Title" and "Phone" remain unmapped
```

**Test Data:**
- Template mappings: `{ "Email Address": "email", "First Name": "first_name", "Company": "company_name" }`
- Current file columns: `["Email Address", "First Name", "Job Title", "Phone"]`

**Preconditions:**
- User authenticated, template saved, mapping screen loaded for new import

---

### T-3.2: Template column matching is exact (case-sensitive baseline)
**Maps to:** AC-3
**Category:** edge-case

```gherkin
Feature: Template column matching

  Scenario: Column "email address" (lowercase) does not match template key "Email Address"
    Given a saved template has mapping: { "Email Address": "email" }
    And the current CSV file has column: "email address" (all lowercase)
    When the user applies the template
    Then the column "email address" is NOT pre-mapped (case mismatch — exact match only)
    And the column remains unmapped
```

**Test Data:**
- Template key: `Email Address`
- Current column: `email address`

**Preconditions:**
- Template saved, file with lowercase header loaded

*Note: If case-insensitive matching is implemented (per Open Questions recommendation), this test should be updated to expect a pre-filled mapping.*

---

### T-4.1: Loading a template with no matching column headers shows inline notice
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Template application with no matches

  Scenario: Template applied to file with completely different headers shows notice
    Given a saved template with mapping: { "Email Address": "email", "First Name": "first_name" }
    And the current CSV file has columns: ["Order ID", "SKU", "Quantity"]
    When the user applies the template
    Then no columns are pre-mapped
    And an inline notice reads: "No columns in this file matched the template. You can map them manually."
    And all columns remain unmapped
```

**Test Data:**
- Template keys: `Email Address`, `First Name`
- Current columns: `Order ID`, `SKU`, `Quantity`

**Preconditions:**
- Template saved, file with non-matching headers loaded

---

### T-5.1: Contacts template does not appear on a deals import dropdown
**Maps to:** AC-5
**Category:** edge-case

*(Covered by T-2.2 above — combined coverage)*

---

### T-6.1: User renames a template successfully
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: Rename template

  Scenario: User renames "Old Export" to "Salesforce Weekly"
    Given user "admin@acme.com" has a contacts template named "Old Export"
    When the user selects "Rename" for "Old Export"
    And enters "Salesforce Weekly" in the rename field
    And submits the rename
    Then the template is renamed in the backend
    And the "Load template" dropdown immediately shows "Salesforce Weekly" instead of "Old Export"
    And "Old Export" no longer appears in the dropdown
```

**Test Data:**
- Existing template: `{ name: "Old Export", entity_type: "contacts", owner: "user-uuid-abc" }`
- New name: `Salesforce Weekly`

**Preconditions:**
- Template exists, user is on the mapping screen

---

### T-6.2: Renamed template preserves its mappings
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: Rename template

  Scenario: Template mappings are preserved after rename
    Given a contacts template "Old Export" with mapping: { "Email Address": "email", "First Name": "first_name" }
    When the user renames it to "Salesforce Weekly"
    And loads "Salesforce Weekly" on a new import with matching columns
    Then the columns "Email Address" and "First Name" are pre-mapped as before
```

**Test Data:**
- Template: `{ name: "Old Export", mapping: { "Email Address": "email", "First Name": "first_name" } }`
- Renamed to: `Salesforce Weekly`

**Preconditions:**
- Template exists and is renamed

---

### T-7.1: User deletes a template and it no longer appears in the dropdown
**Maps to:** AC-7
**Category:** happy-path

```gherkin
Feature: Delete template

  Scenario: User deletes "Old Export" and it disappears from dropdown
    Given user "admin@acme.com" has a contacts template named "Old Export"
    When the user selects "Delete" for "Old Export"
    And confirms the deletion in the modal dialog
    Then the template is removed from the backend
    And a success message reads: "Template deleted."
    And "Old Export" no longer appears in the "Load template" dropdown
```

**Test Data:**
- Template: `{ name: "Old Export", entity_type: "contacts", owner: "user-uuid-abc" }`

**Preconditions:**
- Template exists, user on mapping screen

---

### T-8.1: Saving a template with a duplicate name for the same user and entity type is rejected
**Maps to:** AC-8
**Category:** edge-case

```gherkin
Feature: Template name uniqueness

  Scenario: Duplicate template name for same user and entity type is rejected
    Given user "admin@acme.com" already has a contacts template named "Salesforce Export"
    When the user saves a new contacts template also named "Salesforce Export"
    Then the save is rejected
    And the error reads: "A template named 'Salesforce Export' already exists for contacts. Please choose a different name or rename the existing template."
    And no duplicate template is created
```

**Test Data:**
- Existing: `{ name: "Salesforce Export", entity_type: "contacts", owner: "user-uuid-abc" }`
- Attempted duplicate: same name, same entity type, same owner

**Preconditions:**
- Existing template saved under the same user and entity type

---

### T-9.1: Blank template name is rejected
**Maps to:** AC-9
**Category:** boundary

```gherkin
Feature: Template name validation

  Scenario: Blank template name is rejected with inline error
    Given an authenticated user is on the mapping screen with columns mapped
    When the user opens the "Save as template" dialog
    And submits with an empty name field
    Then the save is rejected
    And an inline error reads: "Template name is required and must be 100 characters or fewer."
```

**Test Data:**
- Template name: `""` (empty string)

**Preconditions:**
- User authenticated, mapping screen loaded, columns mapped

---

### T-9.2: Template name of exactly 101 characters is rejected
**Maps to:** AC-9
**Category:** boundary

```gherkin
Feature: Template name validation

  Scenario: Template name exceeding 100 characters is rejected
    Given an authenticated user is on the mapping screen
    When the user saves a template with a name of 101 characters ("A" * 101)
    Then the save is rejected
    And an inline error reads: "Template name is required and must be 100 characters or fewer."
```

**Test Data:**
- Template name: 101 characters (`A` repeated 101 times)

**Preconditions:**
- User authenticated, at least one column mapped

---

### T-9.3: Whitespace-only template name is rejected
**Maps to:** AC-9
**Category:** boundary

```gherkin
Feature: Template name validation

  Scenario: Whitespace-only template name is treated as blank and rejected
    Given an authenticated user is on the mapping screen
    When the user saves a template with name "   " (spaces only)
    Then the save is rejected
    And an inline error reads: "Template name is required and must be 100 characters or fewer."
```

**Test Data:**
- Template name: `   ` (three spaces)

**Preconditions:**
- User authenticated, column mapped

---

### T-10.1: User B cannot see User A's templates in their dropdown
**Maps to:** AC-10
**Category:** security

```gherkin
Feature: Template ownership isolation

  Scenario: User B cannot see User A's contacts templates
    Given User A (user-uuid-A) has saved a contacts template "Salesforce Export"
    And User B (user-uuid-B) is a different authenticated user with role "Power User"
    When User B starts a contacts import and opens the "Load template" dropdown
    Then User A's template "Salesforce Export" does NOT appear in User B's dropdown
    And the list contains only User B's own templates (if any)
```

**Test Data:**
- User A template: `{ name: "Salesforce Export", entity_type: "contacts", owner: "user-uuid-A" }`
- User B: `{ id: "user-uuid-B", email: "poweruser@acme.com", role: "Power User" }`

**Preconditions:**
- Both user accounts exist
- Template saved under User A

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to list templates returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Template endpoint authorization

  Scenario: Unauthenticated GET to template list returns 401
    Given no authentication token is present
    When a GET request is made to /api/imports/templates?entity_type=contacts
    Then the response status is 401 Unauthorized
    And no template data is returned
```

**Test Data:**
- No auth token

**Preconditions:**
- No active session

---

### T-AUTH-1.2: Unauthenticated POST to save template returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Template endpoint authorization

  Scenario: Unauthenticated POST to save template returns 401
    Given no authentication token is present
    When a POST request is made to /api/imports/templates with body:
      { "name": "Test Template", "entity_type": "contacts", "mapping": { "Email": "email" } }
    Then the response status is 401 Unauthorized
    And no template is saved
```

**Test Data:**
- No auth token

**Preconditions:**
- No active session

---

### T-AUTH-1.3: Unauthenticated PATCH to rename template returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Template endpoint authorization

  Scenario: Unauthenticated PATCH to rename template returns 401
    Given no authentication token is present
    When a PATCH request is made to /api/imports/templates/template-uuid-001 with body: { "name": "New Name" }
    Then the response status is 401 Unauthorized
```

**Test Data:**
- No auth token

**Preconditions:**
- No active session

---

### T-AUTH-1.4: Unauthenticated DELETE to remove template returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Template endpoint authorization

  Scenario: Unauthenticated DELETE to remove template returns 401
    Given no authentication token is present
    When a DELETE request is made to /api/imports/templates/template-uuid-001
    Then the response status is 401 Unauthorized
    And the template is not deleted
```

**Test Data:**
- No auth token

**Preconditions:**
- No active session

---

### T-AUTH-2.1: Authenticated user without imports:create permission receives 403 on all template endpoints
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Template endpoint authorization

  Scenario Outline: User without imports:create permission receives 403 on template <action>
    Given an authenticated user with role "Viewer" (no imports:create permission)
    When a <method> request is made to <endpoint> with a valid Viewer JWT
    Then the response status is 403 Forbidden
    And the response body contains: { "required_permission": "imports:create" }

    Examples:
      | action | method | endpoint                                        |
      | list   | GET    | /api/imports/templates?entity_type=contacts     |
      | save   | POST   | /api/imports/templates                          |
      | rename | PATCH  | /api/imports/templates/template-uuid-001        |
      | delete | DELETE | /api/imports/templates/template-uuid-001        |
```

**Test Data:**
- User: `{ email: "viewer@acme.com", role: "Viewer", permissions: [] }`
- Valid JWT for the Viewer user

**Preconditions:**
- Viewer account exists with valid JWT

---

## NFR Tests

### T-NFR-1.1: Template save failure (DB error) shows user-friendly error
**Maps to:** NFR error handling
**Category:** error-handling

```gherkin
Feature: Template save error handling

  Scenario: Database error during template save returns friendly error
    Given an authenticated user submits a valid template save request
    And the database is configured to fail on write (fault injection)
    When the backend attempts to insert the template record
    Then the backend returns HTTP 500
    And the UI displays: "Failed to save template. Please try again."
    And no partial template is stored
```

**Test Data:**
- DB fault injection active for template insert

**Preconditions:**
- User authenticated, valid template data

---

### T-NFR-2.1: Template delete failure (DB error) shows user-friendly error
**Maps to:** NFR error handling
**Category:** error-handling

```gherkin
Feature: Template delete error handling

  Scenario: Database error during template delete returns friendly error
    Given an authenticated user requests to delete a template they own
    And the database is configured to fail on delete (fault injection)
    When the backend attempts to delete the template record
    Then the backend returns HTTP 500
    And the UI displays: "Failed to delete template. Please try again."
    And the template still exists in the database
```

**Test Data:**
- Existing template: `{ id: "template-uuid-001", owner: "user-uuid-abc" }`
- DB fault injection active for template delete

**Preconditions:**
- Template exists, user authenticated and is owner

---

### T-NFR-3.1: Rename or delete of non-existent template returns 404
**Maps to:** NFR error handling
**Category:** error-handling

```gherkin
Feature: Template not found handling

  Scenario: PATCH to rename a non-existent template returns 404
    Given an authenticated user with role "CRM Admin"
    When a PATCH request is sent to /api/imports/templates/nonexistent-uuid with body: { "name": "New Name" }
    Then the response status is 404 Not Found
    And the UI refreshes the template list (removing any stale entry)
```

**Test Data:**
- `template_id`: `nonexistent-uuid` (does not exist in DB)

**Preconditions:**
- User authenticated

---

### T-NFR-4.1: Template name with XSS payload is sanitized before storage and rendering
**Maps to:** NFR security (input sanitization)
**Category:** security

```gherkin
Feature: Template name XSS prevention

  Scenario: XSS payload in template name is sanitized before save and display
    Given an authenticated user with role "CRM Admin"
    When the user saves a template with name: "<script>alert('xss')</script>My Template"
    Then the backend sanitizes the name before storage
    And the stored template name does not contain an executable script tag
    And when the template name is rendered in the dropdown, no script executes
    And the visible name displays a sanitized version (e.g., "&lt;script&gt;..." or stripped text)
```

**Test Data:**
- Template name: `<script>alert('xss')</script>My Template`

**Preconditions:**
- User authenticated, mapping screen loaded

---

### T-NFR-5.1: User B cannot mutate User A's template via direct ID reference
**Maps to:** NFR security (owner_user_id check)
**Category:** security

```gherkin
Feature: Template ownership enforcement on mutations

  Scenario: User B cannot rename User A's template by supplying its ID directly
    Given User A owns template "template-uuid-A-001"
    And User B is authenticated with role "Power User" and "imports:create" permission
    When User B sends PATCH /api/imports/templates/template-uuid-A-001 with body: { "name": "Hijacked" }
    Then the backend checks the template's owner_user_id against User B's session ID
    And the check fails (owner is User A, not User B)
    And the backend returns HTTP 403 Forbidden
    And the template name remains unchanged
```

**Test Data:**
- Template: `{ id: "template-uuid-A-001", name: "Salesforce Export", owner: "user-uuid-A" }`
- Requester: `user-uuid-B` with valid JWT

**Preconditions:**
- User A's template exists
- User B is authenticated with sufficient role but does not own the template


# Test Specifications: VALID-01 — Standard field validation — email, phone, required fields, and encoding

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, edge-case |
| AC-2 | T-2.1 | edge-case |
| AC-3 | T-3.1 | edge-case |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1, T-5.2, T-5.3 | error-handling |
| AC-6 | T-6.1, T-6.2 | happy-path |
| AC-7 | T-7.1, T-7.2 | error-handling |
| AC-8 | T-8.1, T-8.2 | error-handling |
| AC-9 | T-9.1 | edge-case |
| AC-10 | T-10.1 | edge-case |
| AC-11 | T-11.1 | edge-case |
| AC-12 | T-12.1 | happy-path |
| AC-AUTH-1 | T-AUTH-1.1, T-AUTH-1.2 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Non-UTF-8 encoded file is decoded without corruption
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: File encoding detection and decoding

  Scenario: ISO-8859-1 encoded file is decoded to UTF-8 correctly
    Given an ImportJob record exists with id "job-enc-001" and entity type "contacts"
    And a CSV file "iso_contacts.csv" is stored in S3 encoded in ISO-8859-1
    And the file contains a row with first_name "José" (byte sequence 0x4A 0x6F 0x73 0xE9 in ISO-8859-1)
    And the file's email column contains "jose@example.com"
    When the validation engine begins processing "job-enc-001"
    Then charset-normalizer detects the encoding as "ISO-8859-1"
    And the file is decoded to UTF-8 before any row parsing begins
    And the row's first_name value is the correctly decoded string "José" (U+00E9)
    And no UnicodeDecodeError is raised during processing
```

**Test Data:**
- `ImportJob.id`: `"job-enc-001"`
- `ImportJob.entity_type`: `"contacts"`
- File encoding: `ISO-8859-1`
- Row data: `{ "first_name": "José", "email": "jose@example.com" }` (pre-encoding)
- Expected decoded first_name byte representation: `0x4A 0xC3 0xA9` (UTF-8 for "é")

**Preconditions:**
- S3 bucket contains `iso_contacts.csv` encoded in ISO-8859-1
- ImportJob `"job-enc-001"` has status `"pending_validation"`
- charset-normalizer library is installed and available in the validation worker

---

### T-1.2: Windows-1252 encoded file is decoded without corruption
**Maps to:** AC-1
**Category:** edge-case

```gherkin
Feature: File encoding detection and decoding

  Scenario: Windows-1252 encoded file is decoded to UTF-8 correctly
    Given an ImportJob "job-enc-002" with a CSV file encoded in Windows-1252
    And the file contains a row with company name "Müller GmbH" (Windows-1252 bytes: 0x4D 0xFC 0x6C 0x6C 0x65 0x72)
    When the validation engine processes "job-enc-002"
    Then charset-normalizer detects the encoding as "windows-1252" or "cp1252"
    And the decoded company name is "Müller GmbH" with correct UTF-8 encoding (ü = U+00FC)
    And subsequent validation operates on the correctly decoded string
```

**Test Data:**
- `ImportJob.id`: `"job-enc-002"`
- File encoding: `Windows-1252`
- Row: `{ "company": "Müller GmbH", "email": "info@mueller.de" }`

**Preconditions:**
- File stored in S3 as Windows-1252
- ImportJob status `"pending_validation"`

---

### T-2.1: UTF-8 BOM is stripped before column header parsing
**Maps to:** AC-2
**Category:** edge-case

```gherkin
Feature: BOM stripping

  Scenario: CSV with UTF-8 BOM does not corrupt the first column header
    Given an ImportJob "job-bom-001" with a CSV file that begins with UTF-8 BOM bytes (0xEF 0xBB 0xBF)
    And the first column header after the BOM is "email"
    And the file has one data row: email="bom@example.com", first_name="Alice"
    When the validation engine parses the file for "job-bom-001"
    Then the BOM bytes are stripped before header parsing
    And the first column header is exactly "email" (not "\ufeffemail" or "\xef\xbb\xbfemail")
    And the data row is parsed correctly with email="bom@example.com"
    And no MISSING_REQUIRED_FIELD error is raised due to BOM-corrupted column mapping
```

**Test Data:**
- File bytes begin with: `0xEF 0xBB 0xBF` followed by `"email,first_name\r\nbom@example.com,Alice\r\n"`
- Expected parsed headers: `["email", "first_name"]`
- Data row: `{ "email": "bom@example.com", "first_name": "Alice" }`

**Preconditions:**
- File stored in S3 with BOM prefix
- ImportJob `"job-bom-001"` in `"pending_validation"` state
- Entity type schema requires `email` and `first_name`

---

### T-3.1: Low-confidence encoding detection records a warning but continues validation
**Maps to:** AC-3
**Category:** edge-case

```gherkin
Feature: Low-confidence encoding detection warning

  Scenario: Encoding detected with 65% confidence generates a warning on the ImportJob
    Given an ImportJob "job-enc-lowconf-001" with a file whose encoding confidence is 65%
    And the mock charset-normalizer response returns encoding="ISO-8859-1" with confidence=0.65
    When the validation engine processes "job-enc-lowconf-001"
    Then all rows are still parsed and validated using the detected encoding "ISO-8859-1"
    And the ImportJob record has a warning entry: "Encoding detection confidence was low (65%). If characters appear garbled in the preview, re-save your file as UTF-8."
    And the ImportJob status is NOT set to "validation_failed" due to low confidence alone
    And row-level validation errors (if any) are still recorded

  Scenario: Encoding detected with exactly 80% confidence does not generate a warning
    Given an ImportJob "job-enc-conf80-001" with encoding confidence exactly 80%
    When the validation engine processes "job-enc-conf80-001"
    Then no low-confidence warning is recorded on the ImportJob

  Scenario: Encoding detected with 79% confidence generates a warning
    Given an ImportJob "job-enc-conf79-001" with encoding confidence 79%
    When the validation engine processes "job-enc-conf79-001"
    Then a low-confidence warning is recorded on the ImportJob with the confidence percentage "79%"
```

**Test Data:**
- Test 1: `confidence = 0.65`, `encoding = "ISO-8859-1"`
- Test 2: `confidence = 0.80`, no warning expected
- Test 3: `confidence = 0.79`, warning expected
- Warning message template: `"Encoding detection confidence was low ({X}%). If characters appear garbled in the preview, re-save your file as UTF-8."`

**Preconditions:**
- charset-normalizer is mockable in the test environment
- ImportJob.warnings is a list field (or JSON column) on the ImportJob model

---

### T-4.1: Valid RFC 5322 email address passes without error
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Email format validation

  Scenario Outline: Valid email addresses are accepted
    Given an ImportJob "job-email-valid-001" for entity type "contacts"
    And a CSV row with email="<email>" and first_name="Test"
    When email validation runs on that row
    Then the row is not flagged with an INVALID_EMAIL error

    Examples:
      | email                            |
      | user@example.com                 |
      | firstname.lastname@company.org   |
      | user+tag@subdomain.example.co.uk |
      | u@x.io                           |
      | "user name"@example.com          |
```

**Test Data:**
- Valid emails: `user@example.com`, `firstname.lastname@company.org`, `user+tag@subdomain.example.co.uk`, `u@x.io`
- Row context: `{ "first_name": "Test", "email": "<value>" }`

**Preconditions:**
- ImportJob in `"pending_validation"` state
- Entity type schema maps the `email` column to the email field

---

### T-5.1: Malformed email addresses are flagged with INVALID_EMAIL
**Maps to:** AC-5
**Category:** error-handling

```gherkin
Feature: Email format validation

  Scenario Outline: Invalid email addresses are flagged with error code and description
    Given an ImportJob "job-email-invalid-001" for entity type "contacts"
    And a CSV row with email="<email>" and first_name="Test"
    When email validation runs on that row
    Then the row is flagged with error code "INVALID_EMAIL"
    And the error description is "Invalid email format: '<email>'"
    And the row's status is "error"

    Examples:
      | email           |
      | not-an-email    |
      | user@           |
      | @domain.com     |
      | user@.com       |
      | user            |
      | user @example.com |
```

**Test Data:**
- Invalid email inputs: `"not-an-email"`, `"user@"`, `"@domain.com"`, `"user@.com"`, `"user"`, `"user @example.com"`
- Expected error code: `"INVALID_EMAIL"`
- Expected description pattern: `"Invalid email format: '[value]'"`

**Preconditions:**
- ImportJob in `"pending_validation"` state

---

### T-5.2: Email field with only whitespace is flagged as invalid
**Maps to:** AC-5
**Category:** error-handling

```gherkin
Feature: Email format validation

  Scenario: Whitespace-only email value is treated as invalid
    Given an ImportJob "job-email-ws-001"
    And a CSV row where the email column contains "   " (three spaces)
    When email validation runs on that row
    Then the row is flagged with error code "INVALID_EMAIL"
    And the error description contains "Invalid email format"
```

**Test Data:**
- Email value: `"   "` (3 spaces)
- Note: This is distinct from an empty/missing email which would trigger MISSING_REQUIRED_FIELD if email is required

**Preconditions:**
- ImportJob in `"pending_validation"` state

---

### T-5.3: Email with consecutive dots is flagged as invalid
**Maps to:** AC-5
**Category:** error-handling

```gherkin
Feature: Email format validation

  Scenario: Email with consecutive dots in local part is flagged
    Given an ImportJob "job-email-dots-001"
    And a CSV row with email="user..name@example.com"
    When email validation runs using RFC 5322-compatible pattern
    Then the row is flagged with error code "INVALID_EMAIL"
    And the description is "Invalid email format: 'user..name@example.com'"
```

**Test Data:**
- Email: `"user..name@example.com"` (RFC 5322 disallows consecutive dots in local part outside quoted strings)

**Preconditions:**
- RFC 5322 compliant regex or validation library in use

---

### T-6.1: Valid international phone numbers pass validation
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: Phone number validation

  Scenario Outline: Valid international phone numbers are accepted
    Given an ImportJob "job-phone-valid-001" for entity type "contacts"
    And a CSV row with phone="<phone>" and first_name="Test" and email="test@example.com"
    When phone validation runs on that row
    Then the row is not flagged with an INVALID_PHONE error

    Examples:
      | phone               |
      | +1 415 555 0100     |
      | +44 20 7946 0958    |
      | +49 30 12345678     |
      | +81 3-1234-5678     |
      | +33 1 42 86 83 26   |
      | +55 11 91234-5678   |
```

**Test Data:**
- Valid international formats via `phonenumbers` library: US, UK, Germany, Japan, France, Brazil
- Row context: `{ "first_name": "Test", "email": "test@example.com", "phone": "<value>" }`

**Preconditions:**
- `phonenumbers` library installed and available
- ImportJob in `"pending_validation"` state

---

### T-6.2: Phone number with valid digits but missing country code — library handles it
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Phone number validation

  Scenario: Phone number parseable with default region is accepted
    Given an ImportJob "job-phone-region-001"
    And the validation engine has no default region configured
    And a CSV row with phone="(415) 555-0100" (US local format without +1)
    When phone validation runs
    Then the row validation result depends on whether phonenumbers can parse without a region hint
    And if unparseable, the row is flagged with INVALID_PHONE
    And the error message advises use of international format "+1 415 555 0100"
```

**Test Data:**
- Phone: `"(415) 555-0100"` (no country code)
- This tests behavior — if `phonenumbers.parse()` raises `NumberParseException` for no region, it's invalid

**Preconditions:**
- No default region hint configured on the validation engine

---

### T-7.1: Unrecognizable phone strings are flagged with INVALID_PHONE
**Maps to:** AC-7
**Category:** error-handling

```gherkin
Feature: Phone number validation

  Scenario Outline: Unrecognizable phone strings are flagged
    Given an ImportJob "job-phone-invalid-001" for entity type "contacts"
    And a CSV row with phone="<phone>", first_name="Test", email="test@example.com"
    When phone validation runs on that row
    Then the row is flagged with error code "INVALID_PHONE"
    And the error description is "Unrecognizable phone number format: '<phone>'. Use international format (e.g., +1 415 555 0100)."
    And the row's status is "error"

    Examples:
      | phone            |
      | abc123           |
      | 000-000-0000     |
      | 1234             |
      | phone number     |
      | +0 000 000 0000  |
```

**Test Data:**
- Invalid phone inputs: `"abc123"`, `"000-000-0000"`, `"1234"`, `"phone number"`, `"+0 000 000 0000"`
- Expected error code: `"INVALID_PHONE"`
- Expected description: `"Unrecognizable phone number format: '[value]'. Use international format (e.g., +1 415 555 0100)."`

**Preconditions:**
- `phonenumbers` library installed
- ImportJob in `"pending_validation"` state

---

### T-7.2: Whitespace-only phone value is flagged as invalid
**Maps to:** AC-7
**Category:** error-handling

```gherkin
Feature: Phone number validation

  Scenario: Phone field containing only whitespace is flagged as invalid
    Given an ImportJob "job-phone-ws-001"
    And a CSV row where the phone column contains "  " (two spaces)
    When phone validation runs
    Then the row is flagged with error code "INVALID_PHONE"
```

**Test Data:**
- Phone: `"  "` (whitespace-only, distinct from empty/null)

**Preconditions:**
- Phone field is present but whitespace-only (not empty/absent)

---

### T-8.1: Row missing a required field is flagged with MISSING_REQUIRED_FIELD
**Maps to:** AC-8
**Category:** error-handling

```gherkin
Feature: Required field validation

  Scenario: Row with empty required first_name field is flagged
    Given an ImportJob "job-req-001" for entity type "contacts"
    And the contacts entity schema requires fields: "email", "first_name"
    And a CSV row with email="valid@example.com" and first_name="" (empty string)
    When required field validation runs on that row
    Then the row is flagged with error code "MISSING_REQUIRED_FIELD"
    And the error description is "Required field 'First Name' is missing."
    And the row's status is "error"

  Scenario: Row with whitespace-only required field is treated as missing
    Given an ImportJob "job-req-002" for entity type "contacts"
    And a CSV row with email="valid@example.com" and first_name="   " (whitespace only)
    When required field validation runs on that row
    Then the row is flagged with error code "MISSING_REQUIRED_FIELD"
    And the error description is "Required field 'First Name' is missing."
```

**Test Data:**
- Entity type: `"contacts"`
- Required fields: `["email", "first_name"]`
- Test row 1: `{ "email": "valid@example.com", "first_name": "" }`
- Test row 2: `{ "email": "valid@example.com", "first_name": "   " }`
- Expected error code: `"MISSING_REQUIRED_FIELD"`
- Expected description: `"Required field 'First Name' is missing."`

**Preconditions:**
- Entity schema for `"contacts"` is configured with `first_name` as required
- ImportJob references the `"contacts"` entity type

---

### T-8.2: Row missing email (also required) is flagged for email
**Maps to:** AC-8
**Category:** error-handling

```gherkin
Feature: Required field validation

  Scenario: Row with empty email field is flagged for both missing required and email format
    Given an ImportJob "job-req-003" for entity type "contacts"
    And the contacts schema requires "email" and "first_name"
    And a CSV row has first_name="Bob" and email="" (empty)
    When required field validation runs
    Then the row is flagged with error code "MISSING_REQUIRED_FIELD"
    And the error description is "Required field 'Email' is missing."
```

**Test Data:**
- Row: `{ "first_name": "Bob", "email": "" }`
- Expected error code: `"MISSING_REQUIRED_FIELD"`

**Preconditions:**
- Email is configured as both required and email-format-validated in the schema

---

### T-9.1: Row with multiple validation errors accumulates all errors
**Maps to:** AC-9
**Category:** edge-case

```gherkin
Feature: Multi-error accumulation per row

  Scenario: Row with invalid email and missing required field accumulates both errors
    Given an ImportJob "job-multi-err-001" for entity type "contacts"
    And the contacts schema requires "email" and "first_name"
    And a CSV row has email="not-valid" and first_name="" (empty)
    When validation runs on that row
    Then the row's error list contains error code "INVALID_EMAIL" with description "Invalid email format: 'not-valid'"
    And the row's error list contains error code "MISSING_REQUIRED_FIELD" with description "Required field 'First Name' is missing."
    And both errors are present simultaneously (validation is not short-circuited)
    And the row's status is "error"
    And the total error count for that row is 2
```

**Test Data:**
- Row: `{ "email": "not-valid", "first_name": "" }`
- Expected errors: `[{ "code": "INVALID_EMAIL", ... }, { "code": "MISSING_REQUIRED_FIELD", ... }]`

**Preconditions:**
- Validation engine does not use early-exit / fail-fast logic at the row level

---

### T-10.1: .xlsx numeric phone cell is coerced to string before validation
**Maps to:** AC-10
**Category:** edge-case

```gherkin
Feature: .xlsx cell type coercion

  Scenario: Numeric phone cell in .xlsx is coerced to string before phonenumbers parsing
    Given an ImportJob "job-xlsx-num-001" with an .xlsx source file
    And cell B2 in the sheet is formatted as a number and contains the value 14155550100 (no leading +)
    And column B is mapped to the "Phone" field
    When the validation engine reads cell B2
    Then the value is coerced to the string "14155550100" before any validation
    And no Python TypeError or AttributeError is raised during phone validation
    And if "14155550100" is not parseable by phonenumbers, it is flagged with INVALID_PHONE
    And if parseable (with region hint), it passes phone validation
```

**Test Data:**
- .xlsx cell type: `number` (openpyxl type: `n`)
- Cell value: `14155550100` (integer)
- Expected string after coercion: `"14155550100"`
- Note: `+14155550100` would be valid E.164 — `14155550100` without `+` may be parseable with region `US`

**Preconditions:**
- openpyxl (or equivalent) is used to read .xlsx files
- Coercion to string happens before passing the value to the phonenumbers library

---

### T-11.1: .xlsx date-typed cell is preserved as ISO 8601 string for VALID-04
**Maps to:** AC-11
**Category:** edge-case

```gherkin
Feature: .xlsx date cell preservation

  Scenario: Excel date serial is converted to ISO 8601 string and passed to VALID-04
    Given an ImportJob "job-xlsx-date-001" with an .xlsx source file
    And cell C2 contains an Excel date serial 45366 (representing 2024-03-15)
    And column C is mapped to a date field "Birth Date"
    When VALID-01 reads cell C2
    Then the cell value is converted to the string "2024-03-15" (ISO 8601 format)
    And the string "2024-03-15" is stored as the row's "Birth Date" value for subsequent validation
    And VALID-01 does NOT flag a date error for this cell
    And VALID-04 receives the string "2024-03-15" as input when it processes this row

  Scenario: Excel date serial 1 (1900-01-01) is handled correctly
    Given a cell contains Excel date serial 1
    When VALID-01 reads the cell
    Then the converted ISO 8601 string is "1900-01-01"
    And no error is raised for the conversion
```

**Test Data:**
- Excel serial `45366` → `"2024-03-15"`
- Excel serial `1` → `"1900-01-01"` (Excel epoch base)
- openpyxl `data_only=True` returns date objects for date-typed cells

**Preconditions:**
- .xlsx file has a cell with Excel date type (not a plain string formatted as a date)
- VALID-01 converts openpyxl date objects to `isoformat()` strings

---

### T-12.1: Per-row validation results are persisted on the ImportJob
**Maps to:** AC-12
**Category:** happy-path

```gherkin
Feature: Per-row result persistence

  Scenario: After validation completes, each row's result is queryable on the ImportJob
    Given an ImportJob "job-persist-001" with 3 data rows:
      | row | email                | first_name | phone           |
      |  1  | valid@example.com    | Alice      | +1 415 555 0100 |
      |  2  | not-an-email         | Bob        | +44 20 7946 0958|
      |  3  | another@example.com  |            | +49 30 12345678 |
    When VALID-01 validation completes for "job-persist-001"
    Then row 1 has status "valid" and an empty error list
    And row 2 has status "error" with error code "INVALID_EMAIL"
    And row 3 has status "error" with error code "MISSING_REQUIRED_FIELD" (first_name empty)
    And all three row results are queryable via the ImportJob record (or ImportJobRow table)
    And the results are available for the preview and error report steps
```

**Test Data:**
- Row 1: `{ "email": "valid@example.com", "first_name": "Alice", "phone": "+1 415 555 0100" }` → status: `"valid"`
- Row 2: `{ "email": "not-an-email", "first_name": "Bob", "phone": "+44 20 7946 0958" }` → status: `"error"`, code: `"INVALID_EMAIL"`
- Row 3: `{ "email": "another@example.com", "first_name": "", "phone": "+49 30 12345678" }` → status: `"error"`, code: `"MISSING_REQUIRED_FIELD"`

**Preconditions:**
- ImportJob has a storage mechanism for per-row results (ImportJobRow table or JSON column)
- VALID-01 writes results before returning

---

## Authorization Tests

### T-AUTH-1.1: Trigger validation endpoint rejects unauthenticated requests
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Validation endpoint authentication

  Scenario: Unauthenticated request to trigger validation returns 401
    Given no authentication token is present in the request headers
    When a POST request is made to "/api/import-jobs/job-enc-001/validate"
    Then the response status code is 401
    And the response body contains an error indicating authentication is required
    And no validation task is enqueued
```

**Test Data:**
- Request: `POST /api/import-jobs/job-enc-001/validate` with no `Authorization` header
- Expected HTTP status: `401`

**Preconditions:**
- Authentication middleware is active on the validation trigger endpoint

---

### T-AUTH-1.2: Retrieve validation results endpoint rejects unauthenticated requests
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Validation results authentication

  Scenario: Unauthenticated request to retrieve validation results returns 401
    Given no authentication token is present in the request headers
    When a GET request is made to "/api/import-jobs/job-enc-001/validation-results"
    Then the response status code is 401
    And no validation result data is returned
```

**Test Data:**
- Request: `GET /api/import-jobs/job-enc-001/validation-results` with no `Authorization` header
- Expected HTTP status: `401`

**Preconditions:**
- Authentication middleware is active on the results endpoint

---

### T-AUTH-2.1: Trigger validation endpoint rejects user without imports:create permission
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Validation endpoint authorization

  Scenario: Authenticated user without imports:create permission receives 403
    Given a valid authentication token for user "viewer-user-001" with role "viewer"
    And user "viewer-user-001" does NOT have the "imports:create" permission
    When a POST request is made to "/api/import-jobs/job-enc-001/validate" with the valid token
    Then the response status code is 403
    And the response body contains: { "required_permission": "imports:create" }
    And no validation task is enqueued
```

**Test Data:**
- Auth token: valid JWT for user `"viewer-user-001"`
- User permissions: `["contacts:read"]` (no `"imports:create"`)
- Expected HTTP status: `403`
- Expected body field: `"required_permission": "imports:create"`

**Preconditions:**
- User `"viewer-user-001"` exists and is authenticated but lacks import permissions
- Authorization middleware checks `imports:create` on this endpoint

---

### T-AUTH-2.2: Retrieve validation results endpoint rejects user without imports:create permission
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Validation results authorization

  Scenario: Authenticated user without imports:create permission cannot read results
    Given a valid authentication token for user "viewer-user-001" without "imports:create"
    When a GET request is made to "/api/import-jobs/job-enc-001/validation-results" with the token
    Then the response status code is 403
    And the response body contains: { "required_permission": "imports:create" }
```

**Test Data:**
- Same user context as T-AUTH-2.1
- Expected HTTP status: `403`

**Preconditions:**
- Authorization middleware is enforced on the results read endpoint

---

## Negative Tests

### T-NEG-1: File cannot be read from S3 — ImportJob is marked validation_failed
**Maps to:** Non-functional error handling
**Category:** error-handling

```gherkin
Feature: S3 read failure handling

  Scenario: S3 file access failure during validation marks ImportJob as failed
    Given an ImportJob "job-s3-fail-001" referencing a file that no longer exists in S3
    When the validation engine attempts to read the file from S3
    Then an S3 read error occurs (e.g., NoSuchKey or AccessDenied)
    And the ImportJob status is set to "validation_failed"
    And the ImportJob error message is "Source file could not be read from storage."
    And no row-level results are written
```

**Test Data:**
- ImportJob S3 path: `"s3://import-bucket/nonexistent/file.csv"`
- Expected ImportJob status: `"validation_failed"`
- Expected error message: `"Source file could not be read from storage."`

**Preconditions:**
- S3 mock or stub configured to raise `NoSuchKey` for the target path

---

### T-NEG-2: Header-only file (zero data rows) completes with empty results
**Maps to:** Non-functional error handling
**Category:** edge-case

```gherkin
Feature: Empty file handling

  Scenario: CSV file with headers but no data rows completes validation with zero rows
    Given an ImportJob "job-empty-001" with a CSV containing only the header row "email,first_name,phone"
    When the validation engine processes "job-empty-001"
    Then the ImportJob status is set to "validation_complete"
    And the valid row count is 0
    And the invalid row count is 0
    And no MISSING_REQUIRED_FIELD or other row errors are recorded
    And a message is available for the UI: "Your file contained no data rows."
```

**Test Data:**
- File content: `"email,first_name,phone\r\n"` (header only, no data)
- Expected ImportJob status: `"validation_complete"`
- Expected counts: `{ valid: 0, invalid: 0 }`

**Preconditions:**
- ImportJob references a real file with only a header row

---

## Boundary Tests

### T-BOUND-1: File at the 100,000-row limit is processed without memory exhaustion
**Maps to:** Performance NFR
**Category:** boundary

```gherkin
Feature: Large file handling

  Scenario: 100,000-row CSV file is stream-parsed without loading into memory
    Given an ImportJob "job-large-001" with a CSV file containing exactly 100,000 data rows
    And each row has valid email, first_name, and phone values
    When the validation engine processes "job-large-001"
    Then all 100,000 rows are validated
    And the process does not exceed the memory threshold of [configured limit]
    And no OOM error or MemoryError is raised
    And the ImportJob shows 100,000 valid rows upon completion
```

**Test Data:**
- File: 100,000 rows × 3 columns, all valid
- Stream-parsing verified: each row is processed and discarded, not accumulated

**Preconditions:**
- Validation engine uses a generator or row-by-row stream (not `file.readlines()`)
- Memory profiling is enabled in the test environment

---

---

# Test Specifications: VALID-02 — Uniqueness validation — intra-file dedup and DB check for contacts

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1 | happy-path |
| AC-2 | T-2.1, T-2.2 | error-handling |
| AC-3 | T-3.1 | edge-case |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1 | error-handling |
| AC-6 | T-6.1 | edge-case |
| AC-7 | T-7.1 | happy-path |
| AC-8 | T-8.1 | happy-path |
| AC-AUTH-1 | T-AUTH-1.1, T-AUTH-1.2 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Intra-file dedup scan runs before any DB queries
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Uniqueness validation sequencing

  Scenario: Intra-file dedup completes before DB uniqueness check begins
    Given VALID-01 has completed successfully for ImportJob "job-uniq-seq-001"
    And the file contains 500 rows
    When the uniqueness validation pass begins
    Then all 500 rows in the file are scanned for duplicate emails first
    And the DB uniqueness check does not begin until the intra-file scan is complete
    And no database queries are issued during the intra-file scan phase
```

**Test Data:**
- ImportJob: `"job-uniq-seq-001"`
- File: 500 rows, all with unique valid emails
- Verification: DB query mock should record zero calls during intra-file scan phase

**Preconditions:**
- VALID-01 has run and set ImportJob to a state ready for VALID-02
- DB query instrumentation (mock/spy) is in place to verify ordering

---

### T-2.1: Both rows sharing an intra-file duplicate email are flagged
**Maps to:** AC-2
**Category:** error-handling

```gherkin
Feature: Intra-file duplicate detection

  Scenario: Two rows with the same email are both flagged with cross-references
    Given an ImportJob "job-intradup-001" with a file containing:
      | row | email              | first_name |
      |  12 | alice@example.com  | Alice      |
      |  47 | alice@example.com  | Alice Copy |
    And all other rows have unique emails
    When the intra-file dedup pass runs
    Then row 12 is flagged with error code "INTRA_FILE_DUPLICATE_EMAIL"
    And row 12's error description is "Duplicate email within import file — also appears on row 47. Neither row will be imported."
    And row 47 is flagged with error code "INTRA_FILE_DUPLICATE_EMAIL"
    And row 47's error description is "Duplicate email within import file — also appears on row 12. Neither row will be imported."
    And both rows have status "error"
    And neither row 12 nor row 47 proceeds to the DB uniqueness check
```

**Test Data:**
- Row 12: `{ "row_number": 12, "email": "alice@example.com", "first_name": "Alice" }`
- Row 47: `{ "row_number": 47, "email": "alice@example.com", "first_name": "Alice Copy" }`
- Expected error code: `"INTRA_FILE_DUPLICATE_EMAIL"`
- Expected description row 12: `"Duplicate email within import file — also appears on row 47. Neither row will be imported."`
- Expected description row 47: `"Duplicate email within import file — also appears on row 12. Neither row will be imported."`

**Preconditions:**
- ImportJob contains row number metadata for each row
- VALID-01 completed, rows were previously assigned row numbers

---

### T-2.2: Unique email rows are not affected by the duplicate detection pass
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Intra-file duplicate detection

  Scenario: Rows with unique emails pass intra-file dedup without errors
    Given an ImportJob "job-intradup-002" with rows 1–10 each having distinct email addresses
    When the intra-file dedup pass runs
    Then none of the 10 rows are flagged with INTRA_FILE_DUPLICATE_EMAIL
    And all 10 rows proceed to the DB uniqueness check
```

**Test Data:**
- 10 rows each with `email = "userN@example.com"` where N = 1..10
- All emails distinct

**Preconditions:**
- VALID-01 completed successfully for all rows

---

### T-3.1: Three or more rows sharing the same email are all flagged
**Maps to:** AC-3
**Category:** edge-case

```gherkin
Feature: Intra-file triplicate detection

  Scenario: Three rows sharing an email are all flagged referencing each other
    Given an ImportJob "job-tripledup-001" with:
      | row | email            |
      |   5 | bob@example.com  |
      |  18 | bob@example.com  |
      |  33 | bob@example.com  |
    When the intra-file dedup pass runs
    Then row 5 is flagged with "INTRA_FILE_DUPLICATE_EMAIL"
    And row 5's error description references rows 18 and 33
    And row 18 is flagged with "INTRA_FILE_DUPLICATE_EMAIL"
    And row 18's error description references rows 5 and 33
    And row 33 is flagged with "INTRA_FILE_DUPLICATE_EMAIL"
    And row 33's error description references rows 5 and 18
    And all three rows have status "error"
```

**Test Data:**
- Row 5: `{ "row_number": 5, "email": "bob@example.com" }`
- Row 18: `{ "row_number": 18, "email": "bob@example.com" }`
- Row 33: `{ "row_number": 33, "email": "bob@example.com" }`
- All three share the same email and must cross-reference each other in error messages

**Preconditions:**
- Row number tracking is available
- Error message format supports listing multiple conflicting row numbers

---

### T-4.1: DB check is performed in batches of 1,000 for a 3,500-row file
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Batched DB uniqueness check

  Scenario: 3,500 emails are checked against the DB in 4 batches of up to 1,000
    Given an ImportJob "job-batch-001" with 3,500 rows that all passed intra-file dedup
    And none of the 3,500 emails exist in the contacts table
    When the DB uniqueness check runs
    Then exactly 4 database queries are issued: batches of 1000, 1000, 1000, 500
    And each query is a parameterized "SELECT email FROM contacts WHERE email IN (...)" with up to 1,000 values
    And no single query contains more than 1,000 email values
    And all 3,500 rows pass the DB uniqueness check

  Scenario: Exactly 1,000 rows result in a single batch query
    Given an ImportJob "job-batch-002" with exactly 1,000 rows passing intra-file dedup
    When the DB uniqueness check runs
    Then exactly 1 database query is issued with 1,000 email values
```

**Test Data:**
- Test 1: 3,500 unique emails → 4 queries: `[1000, 1000, 1000, 500]`
- Test 2: 1,000 unique emails → 1 query: `[1000]`
- DB query spy/mock counts total queries issued

**Preconditions:**
- `contacts` table is empty (or emails are distinct from file emails)
- DB query spy captures batch sizes

---

### T-5.1: Rows matching existing CRM contact emails are flagged with DUPLICATE_CONTACT_EMAIL
**Maps to:** AC-5
**Category:** error-handling

```gherkin
Feature: DB duplicate detection

  Scenario: Row email matching existing CRM contact is flagged with contact ID reference
    Given the contacts table contains a contact with id="contact-789" and email="existing@crm.com"
    And an ImportJob "job-dbdup-001" with a row: email="existing@crm.com", first_name="New Alice"
    When the DB uniqueness check runs for "job-dbdup-001"
    Then the row is flagged with error code "DUPLICATE_CONTACT_EMAIL"
    And the error description is "A contact with email 'existing@crm.com' already exists in the CRM (Contact ID: contact-789)."
    And the row's status is "error"

  Scenario: Row email not in CRM passes DB uniqueness check
    Given the contacts table has no contact with email="newuser@crm.com"
    And a row in ImportJob "job-dbdup-002" has email="newuser@crm.com"
    When the DB uniqueness check runs
    Then the row is not flagged with DUPLICATE_CONTACT_EMAIL
```

**Test Data:**
- Existing contact: `{ "id": "contact-789", "email": "existing@crm.com" }`
- Import row: `{ "email": "existing@crm.com", "first_name": "New Alice" }`
- Expected error code: `"DUPLICATE_CONTACT_EMAIL"`
- Expected description: `"A contact with email 'existing@crm.com' already exists in the CRM (Contact ID: contact-789)."`

**Preconditions:**
- `contacts` table seeded with contact `"contact-789"`
- Database index on `contacts(email)` exists

---

### T-6.1: Companies import skips email uniqueness check entirely
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Entity-type-scoped uniqueness check

  Scenario: VALID-02 skips email uniqueness for a companies import
    Given an ImportJob "job-company-001" with entity type "companies"
    And the file contains 100 rows with various email values
    When VALID-02 runs for "job-company-001"
    Then no intra-file email dedup scan is performed
    And no DB uniqueness queries are issued against the contacts table
    And a note is recorded on the ImportJob: "Uniqueness validation not applicable for companies imports in v1."
    And all rows' statuses from VALID-01 are preserved unchanged

  Scenario: Deals import also skips email uniqueness check
    Given an ImportJob "job-deals-001" with entity type "deals"
    When VALID-02 runs for "job-deals-001"
    Then no uniqueness check is performed
    And a note is recorded: "Uniqueness validation not applicable for deals imports in v1."
```

**Test Data:**
- ImportJob 1: `{ "entity_type": "companies" }`
- ImportJob 2: `{ "entity_type": "deals" }`
- Expected note: `"Uniqueness validation not applicable for companies imports in v1."`

**Preconditions:**
- VALID-02 reads entity type from the ImportJob record
- Entity type check happens before any scan or DB query

---

### T-7.1: Row with unique email retains its VALID-01 status after VALID-02
**Maps to:** AC-7
**Category:** happy-path

```gherkin
Feature: Status preservation after uniqueness check

  Scenario: A row that was valid after VALID-01 and has a unique email remains valid after VALID-02
    Given an ImportJob "job-unique-pass-001"
    And row 1 has email="unique@example.com" and passed VALID-01 with status "valid"
    And "unique@example.com" does not appear elsewhere in the file
    And "unique@example.com" does not exist in the contacts table
    When VALID-02 completes
    Then row 1 still has status "valid"
    And row 1 has no uniqueness errors

  Scenario: A row that had a VALID-01 error and a unique email retains the VALID-01 error
    Given row 2 had status "error" with code "INVALID_PHONE" from VALID-01
    And row 2's email is unique
    When VALID-02 completes
    Then row 2 still has status "error"
    And row 2 has error code "INVALID_PHONE" from VALID-01 (unchanged)
    And row 2 has no uniqueness errors added
```

**Test Data:**
- Row 1: `{ "email": "unique@example.com", "status": "valid" }` after VALID-01
- Row 2: `{ "email": "also-unique@example.com", "status": "error", "errors": [{ "code": "INVALID_PHONE" }] }` after VALID-01

**Preconditions:**
- VALID-01 results are persisted and readable by VALID-02
- contacts table does not contain test emails

---

### T-8.1: Migration creates a database index on contacts.email
**Maps to:** AC-8
**Category:** happy-path

```gherkin
Feature: DB index delivery

  Scenario: Running the VALID-02 migration creates an index on contacts.email
    Given the VALID-02 database migration has not yet been applied
    When the migration is applied to the database
    Then an index named "ix_contacts_email" (or equivalent) exists on the "contacts" table for the "email" column
    And a migration test verifies the index exists via a schema introspection query

  Scenario: Querying contacts by email with the index is significantly faster than without
    Given the contacts table has 1,000,000 rows
    And the index on contacts(email) exists
    When a SELECT query runs "WHERE email IN (...)" with 1,000 values
    Then the query completes within 200ms (p95)
    And the query plan uses the index (EXPLAIN shows index scan, not sequential scan)
```

**Test Data:**
- Migration test: `SELECT indexname FROM pg_indexes WHERE tablename='contacts' AND indexname LIKE '%email%'` → non-empty result
- Performance test: 1M rows, batch of 1,000 emails, p95 < 200ms

**Preconditions:**
- Database migration runner is available in the test environment
- The migration file for VALID-02 includes the `CREATE INDEX` statement

---

## Authorization Tests

### T-AUTH-1.1: Trigger uniqueness validation endpoint rejects unauthenticated requests
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Uniqueness validation authentication

  Scenario: Unauthenticated request to trigger uniqueness validation returns 401
    Given no authentication token is present in the request headers
    When a POST request is made to "/api/import-jobs/job-uniq-seq-001/validate-uniqueness"
    Then the response status code is 401
    And the response body indicates authentication is required
    And no uniqueness validation task is enqueued
```

**Test Data:**
- Request: `POST /api/import-jobs/job-uniq-seq-001/validate-uniqueness` with no `Authorization` header
- Expected HTTP status: `401`

**Preconditions:**
- Authentication middleware active on this endpoint

---

### T-AUTH-1.2: Retrieve uniqueness results endpoint rejects unauthenticated requests
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Uniqueness validation authentication

  Scenario: Unauthenticated request to retrieve uniqueness results returns 401
    Given no authentication token is present
    When a GET request is made to "/api/import-jobs/job-uniq-seq-001/uniqueness-results"
    Then the response status code is 401
```

**Test Data:**
- Request: `GET /api/import-jobs/job-uniq-seq-001/uniqueness-results` with no auth header
- Expected HTTP status: `401`

**Preconditions:**
- Authentication middleware active on results endpoint

---

### T-AUTH-2.1: Trigger uniqueness validation endpoint rejects insufficient permissions
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Uniqueness validation authorization

  Scenario: Authenticated user without imports:create cannot trigger uniqueness validation
    Given a valid authentication token for user "readonly-user-001" with permissions ["contacts:read"]
    And user "readonly-user-001" does NOT have "imports:create" permission
    When a POST request is made to "/api/import-jobs/job-uniq-seq-001/validate-uniqueness" with the token
    Then the response status code is 403
    And the response body contains: { "required_permission": "imports:create" }
    And no uniqueness validation task is enqueued
```

**Test Data:**
- User: `"readonly-user-001"`, permissions: `["contacts:read"]`
- Expected HTTP status: `403`
- Expected response: `{ "required_permission": "imports:create" }`

**Preconditions:**
- Authorization middleware checks `imports:create` on this endpoint

---

### T-AUTH-2.2: Retrieve uniqueness results endpoint rejects insufficient permissions
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Uniqueness validation authorization

  Scenario: Authenticated user without imports:create cannot read uniqueness results
    Given a valid token for user "readonly-user-001" without "imports:create"
    When a GET request is made to "/api/import-jobs/job-uniq-seq-001/uniqueness-results"
    Then the response status code is 403
    And the response body contains: { "required_permission": "imports:create" }
```

**Test Data:**
- Same user context as T-AUTH-2.1
- Expected HTTP status: `403`

**Preconditions:**
- Authorization middleware enforced on results endpoint

---

## Negative Tests

### T-NEG-1: DB batch query failure causes ImportJob to fail after 3 retries
**Maps to:** Non-functional error handling
**Category:** error-handling

```gherkin
Feature: DB query failure handling

  Scenario: Persistent DB query failure marks ImportJob as validation_failed after 3 retries
    Given an ImportJob "job-db-fail-001" with 1,000 rows passing intra-file dedup
    And the database is configured to reject all queries (simulated connection failure)
    When the DB uniqueness check runs for batch 1
    Then the query is retried up to 3 times with exponential backoff
    And after 3 failed retries, the ImportJob status is set to "validation_failed"
    And the ImportJob error is "Uniqueness check could not complete."
    And no partial row results from failed batches are written
```

**Test Data:**
- DB mock: raises `OperationalError` on all queries
- Retry count: 3 attempts before failure
- Expected ImportJob status: `"validation_failed"`
- Expected error: `"Uniqueness check could not complete."`

**Preconditions:**
- Retry mechanism (e.g., tenacity or celery retry) is instrumented in the test

---

### T-NEG-2: Missing contacts.email index surfaces a critical error
**Maps to:** Non-functional error handling
**Category:** error-handling

```gherkin
Feature: Missing DB index detection

  Scenario: Absent contacts.email index triggers a critical log and surfaces an error
    Given the contacts.email index has been dropped from the database
    When the DB uniqueness check for any ImportJob runs
    Then a CRITICAL level error is logged: "DB configuration error: uniqueness check unavailable."
    And the ImportJob status is set to "validation_failed"
    And the system does NOT silently skip the uniqueness check and proceed
```

**Test Data:**
- Pre-condition: `DROP INDEX ix_contacts_email;` before test
- Expected log level: CRITICAL
- Expected log message: `"DB configuration error: uniqueness check unavailable."`

**Preconditions:**
- Index existence check runs at startup or before each uniqueness check batch
- A database schema introspection query is used to verify the index exists

---

## Boundary Tests

### T-BOUND-1: File with exactly 1,001 rows splits into two batches correctly
**Maps to:** AC-4
**Category:** boundary

```gherkin
Feature: Batch boundary condition

  Scenario: 1,001 rows result in two DB queries: one of 1,000 and one of 1
    Given an ImportJob "job-batch-boundary-001" with 1,001 rows passing intra-file dedup
    When the DB uniqueness check runs
    Then exactly 2 database queries are issued
    And the first query contains exactly 1,000 email values
    And the second query contains exactly 1 email value
```

**Test Data:**
- 1,001 distinct email addresses: `"user1@example.com"` through `"user1001@example.com"`
- Expected query count: `2`, batch sizes: `[1000, 1]`

**Preconditions:**
- All 1,001 rows passed intra-file dedup
- DB contains none of the 1,001 emails

---

---

# Test Specifications: VALID-03 — Custom field type and enum validation

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, edge-case |
| AC-2 | T-2.1 | error-handling |
| AC-3 | T-3.1 | error-handling |
| AC-4 | T-4.1 | error-handling |
| AC-5 | T-5.1 | error-handling |
| AC-6 | T-6.1 | edge-case |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1 | happy-path |
| AC-9 | T-9.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1, T-AUTH-1.2 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Valid enum value passes case-insensitively
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Enum field validation

  Scenario Outline: Enum values pass regardless of case
    Given a custom field "Lead Source" with allowed values ["Web", "Referral", "Event"]
    And an ImportJob "job-enum-valid-001" with a row containing lead_source="<value>"
    When VALID-03 runs on that row
    Then the row is NOT flagged with INVALID_ENUM_VALUE for "Lead Source"

    Examples:
      | value     |
      | Web       |
      | web       |
      | WEB       |
      | Referral  |
      | referral  |
      | REFERRAL  |
      | Event     |
      | event     |
      | EVENT     |
```

**Test Data:**
- Custom field: `{ "name": "Lead Source", "type": "enum", "options": ["Web", "Referral", "Event"] }`
- Test values: all case variants of each allowed option

**Preconditions:**
- Custom field definition is loaded from the CRM configuration for the ImportJob's entity type
- VALID-01 has completed without flagging these rows

---

### T-1.2: Enum comparison is case-insensitive with mixed-case allowed values
**Maps to:** AC-1
**Category:** edge-case

```gherkin
Feature: Enum field validation

  Scenario: Enum value with different casing than defined option is still accepted
    Given a custom field "Status" with allowed values ["Active", "Inactive", "Pending Review"]
    And a row contains status="pending review" (all lowercase)
    When VALID-03 runs
    Then the row is NOT flagged with INVALID_ENUM_VALUE for "Status"
    And the stored value may be normalized to the canonical form "Pending Review"
```

**Test Data:**
- Allowed: `["Active", "Inactive", "Pending Review"]`
- Input: `"pending review"` → should match `"Pending Review"` case-insensitively

**Preconditions:**
- Enum comparison uses `lower()` on both the input value and each allowed option

---

### T-2.1: Invalid enum value flags the row with an informative error
**Maps to:** AC-2
**Category:** error-handling

```gherkin
Feature: Enum field validation

  Scenario: Value not in the allowed enum list causes INVALID_ENUM_VALUE error
    Given a custom field "Lead Source" with allowed values ["Web", "Referral", "Event"]
    And a row contains lead_source="Cold Call"
    When VALID-03 runs
    Then the row is flagged with error code "INVALID_ENUM_VALUE"
    And the error description is "Invalid value for 'Lead Source': 'Cold Call'. Allowed values are: Web, Referral, Event."
    And the row status is "error"

  Scenario: Partially matching enum value is still rejected
    Given allowed values ["Web", "Referral", "Event"]
    And a row contains lead_source="Web Form"
    When VALID-03 runs
    Then the row is flagged with INVALID_ENUM_VALUE
    And the error description lists all three allowed values: "Web, Referral, Event"
```

**Test Data:**
- Field: `"Lead Source"`, allowed: `["Web", "Referral", "Event"]`
- Invalid inputs: `"Cold Call"`, `"Web Form"`, `"None"`, `"other"`
- Expected error code: `"INVALID_ENUM_VALUE"`
- Expected description: `"Invalid value for 'Lead Source': 'Cold Call'. Allowed values are: Web, Referral, Event."`

**Preconditions:**
- Custom field definition is cached in the ImportJob run
- VALID-01 completed for this row

---

### T-3.1: Enum error on row 42 does not prevent import of valid rows
**Maps to:** AC-3
**Category:** error-handling

```gherkin
Feature: Partial import with enum errors

  Scenario: Invalid enum on one row fails only that row; valid rows are importable
    Given an ImportJob "job-enum-partial-001" with 500 rows
    And all 500 rows passed VALID-01 and VALID-02
    And row 42 contains lead_source="Cold Call" (invalid enum value for "Lead Source")
    And rows 1–41 and 43–500 have valid enum values
    When VALID-03 runs
    Then only row 42 is flagged with INVALID_ENUM_VALUE
    And rows 1–41 have no enum errors
    And rows 43–500 have no enum errors
    And when the import is committed with partial import enabled:
      | outcome |
      | row 42 is skipped and NOT written to the database |
      | rows 1–41 are imported successfully |
      | rows 43–500 are imported successfully |
    And the final import tally shows: 499 imported, 1 skipped
```

**Test Data:**
- File: 500 rows; row 42 has `lead_source = "Cold Call"`, all others have `lead_source = "Web"`
- Partial import mode: enabled
- Expected: 499 imported, 1 skipped

**Preconditions:**
- VALID-01 and VALID-02 completed, all 500 rows have no prior errors
- Partial import is enabled on the ImportJob

---

### T-4.1: Non-numeric value in a number field flags the row
**Maps to:** AC-4
**Category:** error-handling

```gherkin
Feature: Number field type validation

  Scenario Outline: Non-numeric strings in a number field are flagged
    Given a custom field "Revenue" of type "number"
    And a row contains revenue="<value>"
    When VALID-03 runs
    Then the row is flagged with error code "INVALID_FIELD_TYPE"
    And the error description is "Invalid value for 'Revenue': '<value>' is not a valid number."

    Examples:
      | value   |
      | high    |
      | $1,000  |
      | 1.2.3   |
      | one     |
      | NaN     |
      | Inf     |

  Scenario: Whitespace-only value in a number field is flagged
    Given a custom field "Revenue" of type "number"
    And a row contains revenue="   "
    When VALID-03 runs
    Then the row is flagged with INVALID_FIELD_TYPE
    And the description is "Invalid value for 'Revenue': '   ' is not a valid number."
```

**Test Data:**
- Custom field: `{ "name": "Revenue", "type": "number" }`
- Invalid inputs: `"high"`, `"$1,000"`, `"1.2.3"`, `"one"`, `"NaN"`, `"Inf"`, `"   "`
- Valid inputs (not tested here): `"87.5"`, `"0"`, `"-500"`, `"1000000"`

**Preconditions:**
- Number validation uses `float()` or `Decimal()` conversion attempt, not `str.isnumeric()`

---

### T-5.1: Invalid boolean value flags the row with allowed values in the description
**Maps to:** AC-5
**Category:** error-handling

```gherkin
Feature: Boolean field type validation

  Scenario Outline: Unrecognized boolean values are flagged with INVALID_FIELD_TYPE
    Given a custom field "Is Customer" of type "boolean"
    And a row contains is_customer="<value>"
    When VALID-03 runs
    Then the row is flagged with error code "INVALID_FIELD_TYPE"
    And the error description is "Invalid value for 'Is Customer': '<value>' is not a valid boolean. Use true/false or 1/0."

    Examples:
      | value   |
      | maybe   |
      | y       |
      | n       |
      | 2       |
      | -1      |
      | on      |
      | off     |
```

**Test Data:**
- Custom field: `{ "name": "Is Customer", "type": "boolean" }`
- Invalid inputs: `"maybe"`, `"y"`, `"n"`, `"2"`, `"-1"`, `"on"`, `"off"`
- Expected error code: `"INVALID_FIELD_TYPE"`
- Expected description: `"Invalid value for 'Is Customer': 'maybe' is not a valid boolean. Use true/false or 1/0."`

**Preconditions:**
- Boolean validation allowlist is defined as: `{"true", "false", "1", "0", "yes", "no"}` (case-insensitive)

---

### T-6.1: All flexible boolean truthy/falsy representations are accepted
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Boolean field type validation

  Scenario Outline: Flexible boolean representations are accepted and normalized
    Given a custom field "Is Customer" of type "boolean"
    And a row contains is_customer="<value>"
    When VALID-03 runs
    Then the row is NOT flagged with INVALID_FIELD_TYPE for "Is Customer"
    And the stored value is normalized to <normalized>

    Examples:
      | value  | normalized |
      | true   | true       |
      | True   | true       |
      | TRUE   | true       |
      | 1      | true       |
      | yes    | true       |
      | Yes    | true       |
      | YES    | true       |
      | false  | false      |
      | False  | false      |
      | FALSE  | false      |
      | 0      | false      |
      | no     | false      |
      | No     | false      |
      | NO     | false      |
```

**Test Data:**
- All 14 flexible representations must be accepted
- Truthy group: `["true", "True", "TRUE", "1", "yes", "Yes", "YES"]` → normalized to `true`
- Falsy group: `["false", "False", "FALSE", "0", "no", "No", "NO"]` → normalized to `false`

**Preconditions:**
- Boolean normalization mapping is implemented (case-insensitive lookup)

---

### T-7.1: Empty value for a non-required custom field passes without error
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Optional custom field empty value handling

  Scenario: Empty optional custom field text value passes VALID-03
    Given a custom field "Notes" of type "text" that is NOT required
    And a row has an empty value for the notes column
    When VALID-03 runs
    Then the row is NOT flagged with any error for "Notes"
    And no MISSING_REQUIRED_FIELD or INVALID_FIELD_TYPE error is recorded for "Notes"

  Scenario: Empty optional enum field is not flagged
    Given a custom field "Lead Source" of type "enum" that is NOT required
    And a row has an empty value for lead_source
    When VALID-03 runs
    Then the row is NOT flagged with INVALID_ENUM_VALUE for "Lead Source"

  Scenario: Empty optional boolean field is not flagged
    Given a custom field "Is Customer" of type "boolean" that is NOT required
    And a row has an empty value for is_customer
    When VALID-03 runs
    Then the row is NOT flagged with INVALID_FIELD_TYPE for "Is Customer"
```

**Test Data:**
- Empty value representations: `""`, `null`, `None`, `"   "` (whitespace-only) — all should be treated as "absent"
- Custom fields tested: text (Notes), enum (Lead Source), boolean (Is Customer) — all optional

**Preconditions:**
- Field definitions have `required: false`
- Empty value detection uses `strip()` and null check before type validation

---

### T-8.1: Valid number field value passes without error
**Maps to:** AC-8
**Category:** happy-path

```gherkin
Feature: Number field type validation

  Scenario Outline: Valid numeric string values pass number field validation
    Given a custom field "Score" of type "number"
    And a row contains score="<value>"
    When VALID-03 runs
    Then the row is NOT flagged with INVALID_FIELD_TYPE for "Score"

    Examples:
      | value        |
      | 87.5         |
      | 0            |
      | -500         |
      | 1000000      |
      | 0.001        |
      | 99           |
      | -0.5         |
```

**Test Data:**
- Custom field: `{ "name": "Score", "type": "number" }`
- Valid inputs: `"87.5"`, `"0"`, `"-500"`, `"1000000"`, `"0.001"`, `"99"`, `"-0.5"`

**Preconditions:**
- Number validation attempts `float(value.strip())` and succeeds for all listed inputs

---

### T-9.1: VALID-03 errors are appended to, not replacing, VALID-01 errors
**Maps to:** AC-9
**Category:** edge-case

```gherkin
Feature: Error accumulation across validation passes

  Scenario: Row with VALID-01 email error receives VALID-03 enum error appended
    Given an ImportJob "job-multi-pass-001"
    And after VALID-01, row 7 has status "error" with error [{ "code": "INVALID_EMAIL", "description": "Invalid email format: 'bad'" }]
    And row 7 has a custom field lead_source="Cold Call" (invalid enum value)
    When VALID-03 runs on row 7
    Then row 7's error list contains both:
      | code                | description                                                          |
      | INVALID_EMAIL       | Invalid email format: 'bad'                                          |
      | INVALID_ENUM_VALUE  | Invalid value for 'Lead Source': 'Cold Call'. Allowed values are: … |
    And the INVALID_EMAIL error from VALID-01 is preserved (not overwritten)
    And row 7 has status "error"
    And the total error count for row 7 is 2
```

**Test Data:**
- Row 7 after VALID-01: `{ "status": "error", "errors": [{ "code": "INVALID_EMAIL", "description": "Invalid email format: 'bad'" }] }`
- VALID-03 input for row 7: `lead_source = "Cold Call"`
- Expected final error list: 2 entries, both present

**Preconditions:**
- VALID-03 reads the existing error list and appends; does not replace it
- VALID-01 results are persisted and readable before VALID-03 runs

---

## Authorization Tests

### T-AUTH-1.1: Trigger custom field validation endpoint rejects unauthenticated requests
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Custom field validation authentication

  Scenario: Unauthenticated request to trigger custom field validation returns 401
    Given no authentication token is present
    When a POST request is made to "/api/import-jobs/job-enum-valid-001/validate-custom-fields"
    Then the response status code is 401
    And no validation task is enqueued
```

**Test Data:**
- Request: `POST /api/import-jobs/job-enum-valid-001/validate-custom-fields` — no auth header
- Expected HTTP status: `401`

**Preconditions:**
- Authentication middleware active on this endpoint

---

### T-AUTH-1.2: Retrieve custom field validation results rejects unauthenticated requests
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Custom field validation authentication

  Scenario: Unauthenticated GET request for custom field validation results returns 401
    Given no authentication token is present
    When a GET request is made to "/api/import-jobs/job-enum-valid-001/custom-field-results"
    Then the response status code is 401
```

**Test Data:**
- Request: `GET` without `Authorization` header
- Expected HTTP status: `401`

**Preconditions:**
- Authentication middleware active on results endpoint

---

### T-AUTH-2.1: Trigger custom field validation rejects user without imports:create
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Custom field validation authorization

  Scenario: User without imports:create cannot trigger custom field validation
    Given a valid token for user "limited-user-001" with permissions ["contacts:read"]
    When a POST request is made to "/api/import-jobs/job-enum-valid-001/validate-custom-fields" with the token
    Then the response status code is 403
    And the response body contains: { "required_permission": "imports:create" }
```

**Test Data:**
- User: `"limited-user-001"`, permissions: `["contacts:read"]`
- Expected HTTP status: `403`

**Preconditions:**
- Authorization middleware checks `imports:create`

---

### T-AUTH-2.2: Retrieve custom field validation results rejects user without imports:create
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Custom field validation authorization

  Scenario: User without imports:create cannot read custom field validation results
    Given a valid token for user "limited-user-001" without "imports:create"
    When a GET request is made to "/api/import-jobs/job-enum-valid-001/custom-field-results"
    Then the response status code is 403
    And the response body contains: { "required_permission": "imports:create" }
```

**Test Data:**
- Same user context as T-AUTH-2.1
- Expected HTTP status: `403`

**Preconditions:**
- Authorization middleware enforced on results endpoint

---

## Negative Tests

### T-NEG-1: Custom field definition deleted between upload and validation
**Maps to:** Non-functional error handling
**Category:** error-handling

```gherkin
Feature: Deleted custom field handling

  Scenario: Custom field deleted after upload is skipped with a warning
    Given an ImportJob "job-deleted-field-001" where column B was mapped to custom field "Industry"
    And the "Industry" custom field definition has been deleted from the CRM after the file was uploaded
    When VALID-03 runs
    Then no INVALID_FIELD_TYPE or INVALID_ENUM_VALUE error is raised for column B
    And a warning is logged: "Custom field 'Industry' no longer exists — skipping."
    And other custom fields are still validated normally
```

**Test Data:**
- ImportJob column mapping: `{ "column_B": "Industry" }`
- "Industry" field deleted from CRM custom fields config before validation runs
- Expected behavior: skip, log warning, continue

**Preconditions:**
- Custom field definitions are fetched at validation start; field existence is checked before validating

---

### T-NEG-2: Enum field with empty options list is skipped with a warning
**Maps to:** Non-functional error handling
**Category:** error-handling

```gherkin
Feature: Empty enum options handling

  Scenario: Enum field with an empty allowed-values list skips validation with a warning
    Given a custom field "Region" of type "enum" with options []
    And a row contains region="EMEA"
    When VALID-03 runs
    Then the row is NOT flagged with INVALID_ENUM_VALUE for "Region"
    And a warning is logged for the ImportJob: "Custom field 'Region' has no enum options configured — skipping enum validation."
```

**Test Data:**
- Custom field: `{ "name": "Region", "type": "enum", "options": [] }`
- Row value: `"EMEA"`
- Expected: no error raised, warning logged

**Preconditions:**
- Enum validation has a guard for empty options list before attempting comparison

---

## Boundary Tests

### T-BOUND-1: Custom field definitions are fetched once per ImportJob run, not per row
**Maps to:** Performance NFR
**Category:** boundary

```gherkin
Feature: Custom field definition caching

  Scenario: 10,000 rows with custom field validation do not cause 10,000 DB queries for field definitions
    Given an ImportJob "job-caching-001" with 10,000 rows and 5 custom fields
    When VALID-03 runs
    Then custom field definitions are fetched from the DB exactly once (or once per distinct entity type)
    And no more than 5 DB queries are issued to fetch field definitions (one per field or one batch query)
    And the total number of definition-lookup queries is not proportional to the row count
```

**Test Data:**
- 10,000 rows × 5 custom fields
- DB query spy: definition queries must be ≤ 5 (or ≤ 1 if batched), regardless of row count

**Preconditions:**
- Field definitions cache is initialized once before row iteration begins

---

---

# Test Specifications: VALID-04 — Date field validation — flag ambiguous and inconsistent formats

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1 | happy-path |
| AC-2 | T-2.1, T-2.2 | error-handling |
| AC-3 | T-3.1 | error-handling |
| AC-4 | T-4.1 | error-handling |
| AC-5 | T-5.1 | error-handling |
| AC-6 | T-6.1 | edge-case |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1, T-AUTH-1.2 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: ISO 8601 date values are accepted
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Date field validation

  Scenario Outline: Valid ISO 8601 dates pass without error
    Given an ImportJob "job-date-valid-001" with a date field "Birth Date"
    And a row contains birth_date="<date>"
    When VALID-04 runs on that row
    Then the row is NOT flagged with any date error for "Birth Date"

    Examples:
      | date         |
      | 2024-03-15   |
      | 1990-01-01   |
      | 2000-02-29   |
      | 2024-12-31   |
      | 1970-06-15   |
      | 2099-11-30   |
```

**Test Data:**
- Valid ISO 8601 dates: `"2024-03-15"`, `"1990-01-01"`, `"2000-02-29"` (2000 is a leap year), `"2024-12-31"`, `"1970-06-15"`, `"2099-11-30"`

**Preconditions:**
- Date field is configured on the entity schema
- VALID-01 completed without flagging these rows

---

### T-2.1: Ambiguous date formats are flagged with AMBIGUOUS_DATE
**Maps to:** AC-2
**Category:** error-handling

```gherkin
Feature: Date field validation — ambiguous format rejection

  Scenario Outline: Ambiguous date strings are flagged with AMBIGUOUS_DATE error
    Given an ImportJob "job-date-ambig-001" with a date field "Start Date"
    And a row contains start_date="<date>"
    When VALID-04 runs
    Then the row is flagged with error code "AMBIGUOUS_DATE"
    And the error description is "Cannot determine date order for '<date>' — month/day/year ordering is ambiguous. Use YYYY-MM-DD format."
    And the row status is "error"

    Examples:
      | date        |
      | 01/02/03    |
      | 03-04-05    |
      | 12/11/10    |
      | 05/06/07    |
      | 01-02-2024  |
      | 03/15/2024  |
```

**Test Data:**
- Ambiguous inputs: `"01/02/03"`, `"03-04-05"`, `"12/11/10"`, `"05/06/07"`
- Note: `"03/15/2024"` is unambiguous as to year but ambiguous as to separator convention — include to validate rejection
- Note: `"01-02-2024"` could be Jan 2 or Feb 1 — ambiguous

**Preconditions:**
- Date parser does not accept slashed or hyphenated non-ISO formats
- Error includes the exact input value in the description

---

### T-2.2: Non-ISO date with clearly parseable format is still rejected (no coercion)
**Maps to:** AC-2
**Category:** error-handling

```gherkin
Feature: Date field validation — no coercion

  Scenario: "March 15, 2024" is unambiguous but is still rejected as non-ISO
    Given a date field "Event Date"
    And a row contains event_date="March 15, 2024"
    When VALID-04 runs
    Then the row is flagged with error code "INVALID_DATE"
    And the description is "Unrecognizable date value 'March 15, 2024'. Use YYYY-MM-DD format."
    And the system does NOT auto-coerce "March 15, 2024" to "2024-03-15"

  Scenario: "15-Mar-2024" is not coerced
    Given a date field "Event Date"
    And a row contains event_date="15-Mar-2024"
    When VALID-04 runs
    Then the row is flagged with "INVALID_DATE"
    And no silent conversion to ISO 8601 is performed
```

**Test Data:**
- `"March 15, 2024"` → `INVALID_DATE`, no coercion
- `"15-Mar-2024"` → `INVALID_DATE`, no coercion
- Confirms no auto-detection of "friendly" date formats

**Preconditions:**
- Date validator accepts only `YYYY-MM-DD` (and ISO 8601 with time per AC-6)

---

### T-3.1: Impossible date values are flagged with INVALID_DATE
**Maps to:** AC-3
**Category:** error-handling

```gherkin
Feature: Date field validation — impossible dates

  Scenario Outline: Impossible calendar dates are flagged with INVALID_DATE
    Given a date field "Expiry Date"
    And a row contains expiry_date="<date>"
    When VALID-04 runs
    Then the row is flagged with error code "INVALID_DATE"
    And the error description is "Invalid date '<date>' — this date does not exist."

    Examples:
      | date         |
      | 2024-13-01   |
      | 2024-02-30   |
      | 2023-02-29   |
      | 2024-00-15   |
      | 2024-04-31   |
      | 2024-01-00   |
```

**Test Data:**
- `"2024-13-01"` — month 13 doesn't exist
- `"2024-02-30"` — Feb 30 doesn't exist
- `"2023-02-29"` — 2023 is not a leap year
- `"2024-00-15"` — month 0 doesn't exist
- `"2024-04-31"` — April has 30 days
- `"2024-01-00"` — day 0 doesn't exist

**Preconditions:**
- Date parsing uses `datetime.strptime()` or equivalent which raises `ValueError` for impossible dates

---

### T-4.1: Non-date strings in date fields are flagged with INVALID_DATE
**Maps to:** AC-4
**Category:** error-handling

```gherkin
Feature: Date field validation — non-date strings

  Scenario Outline: Non-date strings in date fields are flagged
    Given a date field "Created On"
    And a row contains created_on="<value>"
    When VALID-04 runs
    Then the row is flagged with error code "INVALID_DATE"
    And the error description is "Unrecognizable date value '<value>'. Use YYYY-MM-DD format."

    Examples:
      | value       |
      | not-a-date  |
      | Q3 2024     |
      | 2024        |
      | yesterday   |
      | 20240315    |
      | 2024/03/15  |
```

**Test Data:**
- `"not-a-date"`, `"Q3 2024"`, `"2024"`, `"yesterday"`, `"20240315"` (no separators), `"2024/03/15"` (slashes)
- Expected error code: `"INVALID_DATE"`
- Expected description pattern: `"Unrecognizable date value '[value]'. Use YYYY-MM-DD format."`

**Preconditions:**
- Date validator does not interpret `"20240315"` as a valid date (requires hyphen separators)
- No `dateutil.parser` or similar fuzzy-matching library is used

---

### T-5.1: Rows with date errors are skipped during partial import
**Maps to:** AC-5
**Category:** error-handling

```gherkin
Feature: Date error participation in partial import

  Scenario: Date-errored rows are skipped and counted in the skipped tally
    Given an ImportJob "job-date-partial-001" with 200 rows
    And 15 rows have AMBIGUOUS_DATE or INVALID_DATE errors from VALID-04
    And 185 rows have valid dates and no other errors
    When the import is committed with partial import enabled
    Then the 185 valid rows are written to the database
    And the 15 date-errored rows are skipped
    And the import tally shows: imported=185, skipped=15
    And the user can download an error report listing all 15 skipped rows with their date error codes

  Scenario: Error report includes all date-flagged rows
    Given the error report is generated for "job-date-partial-001" after commit
    When the user downloads the error report
    Then the report contains 15 rows
    And each row has the error code (AMBIGUOUS_DATE or INVALID_DATE) and the invalid value
```

**Test Data:**
- ImportJob: 200 rows; 15 with date errors, 185 valid
- Expected import tally: `{ imported: 185, skipped: 15 }`
- Error report: CSV or JSON listing row numbers, field names, error codes, and invalid values

**Preconditions:**
- Partial import is enabled on the ImportJob
- Error report generation is available post-commit

---

### T-6.1: ISO 8601 datetime strings are accepted with time component discarded
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: ISO 8601 datetime handling

  Scenario: Date field containing ISO 8601 datetime is accepted; time is discarded
    Given a date field "Signed On" (type: date, not datetime)
    And a row contains signed_on="2024-03-15T14:30:00Z"
    When VALID-04 runs
    Then the row is NOT flagged with any date error for "Signed On"
    And the stored value for "Signed On" is "2024-03-15" (time component discarded)

  Scenario: ISO 8601 datetime with offset is accepted
    Given a date field "Signed On"
    And a row contains signed_on="2024-03-15T09:00:00+05:30"
    When VALID-04 runs
    Then the row is NOT flagged with any date error
    And the date portion "2024-03-15" is extracted and accepted

  Scenario: ISO 8601 datetime with invalid date portion is still rejected
    Given a date field "Signed On"
    And a row contains signed_on="2024-13-01T10:00:00Z"
    When VALID-04 runs
    Then the row is flagged with error code "INVALID_DATE"
    And the description is "Invalid date '2024-13-01T10:00:00Z' — this date does not exist."
```

**Test Data:**
- `"2024-03-15T14:30:00Z"` → date extracted: `"2024-03-15"`, no error
- `"2024-03-15T09:00:00+05:30"` → date extracted: `"2024-03-15"`, no error
- `"2024-13-01T10:00:00Z"` → `INVALID_DATE` (invalid date portion)

**Preconditions:**
- Date parser handles ISO 8601 with time component (e.g., `datetime.fromisoformat()`)
- Time stripping logic is applied before final date storage

---

### T-7.1: Empty optional date field is not flagged
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Optional date field empty value handling

  Scenario: Empty value in a non-required date field passes VALID-04
    Given a date field "Last Contacted" that is NOT required
    And a row has an empty value for last_contacted
    When VALID-04 runs
    Then the row is NOT flagged with AMBIGUOUS_DATE or INVALID_DATE for "Last Contacted"

  Scenario: Whitespace-only value in optional date field is treated as absent
    Given a date field "Last Contacted" that is NOT required
    And a row contains last_contacted="   " (whitespace only)
    When VALID-04 runs
    Then the row is NOT flagged with any date error
    And the field value is stored as null/empty
```

**Test Data:**
- Optional date field: `{ "name": "Last Contacted", "type": "date", "required": false }`
- Empty inputs: `""`, `null`, `"   "` — all treated as absent

**Preconditions:**
- VALID-04 checks for empty/null values before attempting date parsing
- Field's `required` attribute is `false`

---

### T-8.1: .xlsx date cell coerced by VALID-01 to ISO 8601 passes VALID-04
**Maps to:** AC-8
**Category:** edge-case

```gherkin
Feature: .xlsx date cell handling end-to-end

  Scenario: Excel date serial coerced to ISO 8601 by VALID-01 is accepted by VALID-04
    Given an ImportJob "job-xlsx-date-e2e-001" with an .xlsx source file
    And an Excel cell contained the date serial 45366 (representing 2024-03-15)
    And VALID-01 already converted it to the string "2024-03-15" in the row's field value
    When VALID-04 runs on this row
    Then the row is NOT flagged with any date error
    And the date value "2024-03-15" is accepted as valid ISO 8601

  Scenario: Excel serial coerced to valid ISO 8601 leap day is accepted
    Given VALID-01 coerced Excel serial 60 to "1900-02-29" (Excel's fictional leap day bug)
    When VALID-04 runs
    Then the behavior is documented:
      | if "1900-02-29" is treated as invalid (1900 is not a leap year) | flagged with INVALID_DATE |
      | if the Excel epoch quirk is handled specially                     | accepted                  |
    And the chosen behavior is implemented consistently and documented in code
```

**Test Data:**
- Excel serial `45366` → VALID-01 converts → `"2024-03-15"` → VALID-04 accepts
- Excel serial `60` → VALID-01 converts → `"1900-02-29"` → behavior depends on implementation decision

**Preconditions:**
- VALID-01 has run and stored the ISO string in the row's field value
- VALID-04 reads from the row's field value, not from the original Excel cell

---

## Authorization Tests

### T-AUTH-1.1: Trigger date validation endpoint rejects unauthenticated requests
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Date validation authentication

  Scenario: Unauthenticated request to trigger date validation returns 401
    Given no authentication token is present
    When a POST request is made to "/api/import-jobs/job-date-valid-001/validate-dates"
    Then the response status code is 401
    And no date validation task is enqueued
```

**Test Data:**
- Request: `POST /api/import-jobs/job-date-valid-001/validate-dates` — no `Authorization` header
- Expected HTTP status: `401`

**Preconditions:**
- Authentication middleware active on this endpoint

---

### T-AUTH-1.2: Retrieve date validation results rejects unauthenticated requests
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Date validation authentication

  Scenario: Unauthenticated GET for date validation results returns 401
    Given no authentication token is present
    When a GET request is made to "/api/import-jobs/job-date-valid-001/date-results"
    Then the response status code is 401
```

**Test Data:**
- Request: `GET /api/import-jobs/job-date-valid-001/date-results` — no auth header
- Expected HTTP status: `401`

**Preconditions:**
- Authentication middleware active on results endpoint

---

### T-AUTH-2.1: Trigger date validation rejects user without imports:create
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Date validation authorization

  Scenario: Authenticated user without imports:create cannot trigger date validation
    Given a valid token for user "readonly-date-user-001" with permissions ["contacts:read"]
    When a POST request is made to "/api/import-jobs/job-date-valid-001/validate-dates"
    Then the response status code is 403
    And the response body contains: { "required_permission": "imports:create" }
    And no date validation task is enqueued
```

**Test Data:**
- User: `"readonly-date-user-001"`, permissions: `["contacts:read"]`
- Expected HTTP status: `403`
- Expected response field: `"required_permission": "imports:create"`

**Preconditions:**
- Authorization middleware checks `imports:create` on this endpoint

---

### T-AUTH-2.2: Retrieve date validation results rejects user without imports:create
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Date validation authorization

  Scenario: Authenticated user without imports:create cannot read date validation results
    Given a valid token for user "readonly-date-user-001" without "imports:create"
    When a GET request is made to "/api/import-jobs/job-date-valid-001/date-results"
    Then the response status code is 403
    And the response body contains: { "required_permission": "imports:create" }
```

**Test Data:**
- Same user context as T-AUTH-2.1
- Expected HTTP status: `403`

**Preconditions:**
- Authorization middleware enforced on results endpoint

---

## Negative Tests

### T-NEG-1: All rows have ambiguous dates — ImportJob completes with zero valid rows
**Maps to:** Non-functional error handling
**Category:** error-handling

```gherkin
Feature: All-rows-invalid date scenario

  Scenario: File where every row has an ambiguous date completes validation with 0 valid rows
    Given an ImportJob "job-all-ambig-001" with 100 rows
    And every row has a date field value of "01/02/03" (ambiguous)
    When VALID-04 completes
    Then the ImportJob status is "validation_complete" (not "validation_failed")
    And the valid row count is 0
    And the invalid row count is 100
    And the user is shown the UI message indicating 0 rows are importable
    And the user can choose to cancel or download the full error report with all 100 rows listed
```

**Test Data:**
- 100 rows, all with `date_field = "01/02/03"`
- Expected ImportJob status: `"validation_complete"` (not a system failure — it's a data quality result)
- Expected counts: `{ valid: 0, invalid: 100 }`

**Preconditions:**
- Validation engine does not set `"validation_failed"` status when data errors occur (only for system/infra failures)
- Error report is available for download after validation completes

---

## Boundary Tests

### T-BOUND-1: Leap year boundary — Feb 29 valid in leap years, invalid in non-leap years
**Maps to:** AC-3
**Category:** boundary

```gherkin
Feature: Leap year boundary validation

  Scenario: Feb 29 in a leap year is accepted
    Given a date field "Birth Date"
    And a row contains birth_date="2024-02-29" (2024 is a leap year)
    When VALID-04 runs
    Then the row is NOT flagged with any date error

  Scenario: Feb 29 in a non-leap year is rejected as INVALID_DATE
    Given a date field "Birth Date"
    And a row contains birth_date="2023-02-29" (2023 is NOT a leap year)
    When VALID-04 runs
    Then the row is flagged with error code "INVALID_DATE"
    And the description is "Invalid date '2023-02-29' — this date does not exist."

  Scenario: Feb 29 in a century year (non-leap) is rejected
    Given a date field "Birth Date"
    And a row contains birth_date="1900-02-29" (1900 is NOT a leap year — divisible by 100 but not 400)
    When VALID-04 runs
    Then the row is flagged with error code "INVALID_DATE"

  Scenario: Feb 29 in a 400-year century is accepted
    Given a date field "Birth Date"
    And a row contains birth_date="2000-02-29" (2000 IS a leap year — divisible by 400)
    When VALID-04 runs
    Then the row is NOT flagged with any date error
```

**Test Data:**
- `"2024-02-29"` → valid (2024 % 4 == 0 and 2024 % 100 != 0)
- `"2023-02-29"` → `INVALID_DATE`
- `"1900-02-29"` → `INVALID_DATE` (1900 % 100 == 0 and 1900 % 400 != 0)
- `"2000-02-29"` → valid (2000 % 400 == 0)

**Preconditions:**
- Python's `datetime` library handles leap year logic correctly (it does)
- No custom leap year calculation is introduced that might re-implement this incorrectly

---

### T-BOUND-2: Year extremes — very early and very late dates
**Maps to:** AC-1, AC-3
**Category:** boundary

```gherkin
Feature: Date year range handling

  Scenario: Minimum reasonable year date is accepted
    Given a date field "Historical Date"
    And a row contains historical_date="0001-01-01"
    When VALID-04 runs
    Then the row is accepted or rejected consistently per the system's year range policy
    And if rejected, the error code is "INVALID_DATE" with a clear message

  Scenario: Far-future date is accepted as valid ISO 8601
    Given a date field "Expiry Date"
    And a row contains expiry_date="9999-12-31"
    When VALID-04 runs
    Then the row is NOT flagged with any date error
```

**Test Data:**
- `"0001-01-01"` — minimum date for Python's `datetime` (year 1)
- `"9999-12-31"` — maximum date for Python's `datetime`

**Preconditions:**
- Date parser can handle year values across the full `datetime` range
- No hardcoded year range limit unless explicitly defined in requirements


# Test Specifications: PREVIEW-01 — Preview first 20 rows with per-row validation status and commit controls

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, edge-case |
| AC-2 | T-2.1 | edge-case |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1 | happy-path |
| AC-7 | T-7.1, T-7.2 | error-handling |
| AC-8 | T-8.1, T-8.2 | happy-path, error-handling |
| AC-9 | T-9.1 | happy-path |
| AC-10 | T-10.1, T-10.2 | happy-path |
| AC-11 | T-11.1 | edge-case |
| AC-12 | T-12.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1, T-AUTH-1.2 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Preview screen renders successfully after validation completes
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Preview Screen Rendering

  Scenario: Preview screen renders within 2000ms after validation is complete
    Given an ImportJob with id "job-uuid-1001" owned by user "admin@crm.example.com" with role "CRM Admin"
    And the ImportJob status is "validated"
    And VALID-01 through VALID-04 validations have all completed for "job-uuid-1001"
    And the file contains 50 rows: 45 valid, 5 with errors
    When the user navigates to GET /imports/job-uuid-1001/preview
    Then the HTTP response is 200
    And the response is returned within 2000ms
    And the response body includes "rows_total": 50, "rows_valid": 45, "rows_invalid": 5
    And the preview data contains exactly 20 rows (rows 1–20)
    And each row in the preview contains a "status" field of either "valid" or "error"
```

**Test Data:**
- `import_job_id`: `"job-uuid-1001"`
- `user`: `{ email: "admin@crm.example.com", role: "CRM Admin", status: "active" }`
- `file`: CSV with 50 rows; rows 1–19 valid, row 20 has `email: "notanemail"` (invalid)
- `import_job_status`: `"validated"`
- `validation_completed_at`: `"2026-06-15T10:00:00Z"` (before request)

**Preconditions:**
- User is authenticated with a valid session token
- ImportJob `job-uuid-1001` exists in the database with status `"validated"`
- All 4 validation steps (VALID-01–04) have records in the `validation_results` table for this job
- Row-level validation results exist for all 50 rows in the `row_validation_results` table

---

### T-1.2: Preview screen measures render time under p95 load
**Maps to:** AC-1
**Category:** performance

```gherkin
  Scenario: Preview screen meets 2000ms p95 render time target
    Given 10 concurrent authenticated CRM Admin users
    And each user has a distinct validated ImportJob with 50 rows
    When all 10 users simultaneously request their preview screens
    Then at least 9 out of 10 responses return within 2000ms
    And all 10 responses return HTTP 200
```

**Test Data:**
- 10 unique `import_job_id` UUIDs, each with status `"validated"` and 50 rows of row-level validation results
- 10 distinct authenticated user sessions

**Preconditions:**
- Database contains 10 validated import jobs with complete validation result rows
- Load test tool (e.g., k6) configured for 10 virtual users with simultaneous ramp-up

---

### T-2.1: Loading state shown when validation is still in progress
**Maps to:** AC-2
**Category:** edge-case

```gherkin
  Scenario: Preview screen shows loading indicator while validation is pending
    Given an ImportJob with id "job-uuid-1002" in status "validating"
    And validation has NOT yet completed for "job-uuid-1002"
    When the user navigates to GET /imports/job-uuid-1002/preview
    Then the HTTP response is 200
    And the response body includes "status": "validating"
    And the response body does NOT include a "rows" preview array
    And the UI displays a loading indicator
    And the UI displays the message "Validating your file... This may take a moment."
    And no row data is rendered in the preview table
```

**Test Data:**
- `import_job_id`: `"job-uuid-1002"`
- `import_job_status`: `"validating"` (not yet `"validated"`)
- `user`: `{ email: "admin@crm.example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- ImportJob `job-uuid-1002` exists with status `"validating"`
- No completed validation result records exist for this job
- User is authenticated and owns the job

---

### T-3.1: First 20 rows displayed with CRM-mapped column headers and status badges
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Preview table renders rows 1-20 with CRM headers and per-row status badges
    Given an ImportJob with id "job-uuid-1003" in status "validated"
    And the file has 150 rows
    And the column mapping maps CSV "email_address" → CRM "Email", "first" → CRM "First Name", "last" → CRM "Last Name"
    And rows 1–14 are valid
    And row 15 has error "Invalid email format: 'bad@'"
    And rows 16–20 are valid
    When the user navigates to GET /imports/job-uuid-1003/preview
    Then the response includes a preview table with exactly 20 rows (rows 1 through 20)
    And the table column headers are ["Email", "First Name", "Last Name"] (CRM field names, not CSV headers)
    And rows 1–14 have status badge "Valid" with green indicator
    And row 15 has status badge "Error" with red indicator
    And rows 16–20 have status badge "Valid" with green indicator
    And rows 21–150 are NOT included in the response preview array
```

**Test Data:**
- `import_job_id`: `"job-uuid-1003"`
- `column_mapping`: `[{ csv: "email_address", crm: "Email" }, { csv: "first", crm: "First Name" }, { csv: "last", crm: "Last Name" }]`
- Row 15 validation result: `{ row_number: 15, status: "error", error_message: "Invalid email format: 'bad@'" }`
- Rows 1–14, 16–150: `{ status: "valid" }`

**Preconditions:**
- ImportJob `job-uuid-1003` exists with status `"validated"` and 150 rows
- Column mapping record exists for this job
- Row-level validation results exist for all 150 rows (only first 20 returned in preview)

---

### T-3.2: Status badges are accessible — not color-only
**Maps to:** AC-3
**Category:** accessibility

```gherkin
  Scenario: Status badges include non-color indicator for accessibility
    Given the preview table renders with at least one "Valid" row and one "Error" row
    When the HTML for the status badges is inspected
    Then each "Valid" badge includes a non-color indicator (text "Valid" or a checkmark icon with aria-label="Valid")
    And each "Error" badge includes a non-color indicator (text "Error" or an X icon with aria-label="Error")
    And no badge relies solely on background/text color to convey status
```

**Test Data:**
- Same as T-3.1

**Preconditions:**
- Preview screen is rendered in a browser or via HTML snapshot

---

### T-4.1: Error rows display inline error description
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Row with validation error shows error description inline in preview table
    Given an ImportJob with id "job-uuid-1004" in status "validated"
    And row 5 has validation error "Invalid email format: 'notanemail'"
    And row 5 data is: { "Email": "notanemail", "First Name": "Jane", "Last Name": "Doe" }
    When the user views the preview screen
    Then row 5 in the preview table shows status badge "Error"
    And the error description "Invalid email format: 'notanemail'" is visible for row 5 (via tooltip, expandable row detail, or dedicated error column)
    And all other valid rows do NOT display an error description
```

**Test Data:**
- `import_job_id`: `"job-uuid-1004"`
- Row 5 data: `{ email: "notanemail", first_name: "Jane", last_name: "Doe" }`
- Row 5 validation result: `{ row_number: 5, status: "error", error_message: "Invalid email format: 'notanemail'" }`

**Preconditions:**
- ImportJob exists with status `"validated"`
- Row 5 has a `row_validation_results` record with `status: "error"` and the specified `error_message`

---

### T-5.1: Aggregate row counts displayed above the preview table
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Aggregate counts of total, valid, and invalid rows appear above the preview table
    Given an ImportJob with id "job-uuid-1005" in status "validated"
    And the file contains 1000 rows: 900 valid, 100 with errors
    When the user views the preview screen
    Then above the preview table, the following text is displayed: "Total: 1,000 rows | Valid: 900 | Invalid: 100"
    And the counts reflect the full file (all 1000 rows), not only the 20 rows shown in the preview
```

**Test Data:**
- `import_job_id`: `"job-uuid-1005"`
- Aggregate validation summary: `{ rows_total: 1000, rows_valid: 900, rows_invalid: 100 }`

**Preconditions:**
- ImportJob exists with status `"validated"`
- The `import_jobs` or `validation_summary` table stores pre-computed aggregate counts for this job

---

### T-6.1: "Partial import" checkbox is present, labeled correctly, and checked by default
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Partial import checkbox defaults to checked with dynamic label
    Given an ImportJob with id "job-uuid-1005" in status "validated"
    And the file contains 1000 rows: 900 valid, 100 with errors
    When the user views the commit area of the preview screen
    Then a checkbox is present in the commit area
    And the checkbox label reads "Import valid rows, skip invalid rows (100 rows will be skipped)"
    And the checkbox is checked by default (checked state = true)
    And the invalid row count in the label (100) matches the "Invalid" count from the aggregate summary
```

**Test Data:**
- `import_job_id`: `"job-uuid-1005"` (same as T-5.1)
- `rows_invalid`: `100`

**Preconditions:**
- Same as T-5.1

---

### T-7.1: Commit blocked when partial import is unchecked and errors are present
**Maps to:** AC-7
**Category:** error-handling

```gherkin
  Scenario: Commit Import is blocked when partial import disabled and invalid rows exist
    Given an ImportJob with id "job-uuid-1005" in status "validated" with 100 invalid rows
    And the user unchecks the "Partial import" checkbox
    When the user clicks "Commit Import"
    Then the import does NOT proceed (no Celery task is dispatched, no sync import runs)
    And an inline message is displayed: "Your file contains 100 invalid rows. Enable 'Partial import' to skip these rows, or cancel and fix your data."
    And the ImportJob status remains "validated"
```

**Test Data:**
- `import_job_id`: `"job-uuid-1005"`
- `partial_import`: `false` (unchecked)
- `rows_invalid`: `100`

**Preconditions:**
- ImportJob exists with status `"validated"` and 100 rows with errors
- User has `imports:create` permission

---

### T-7.2: Commit proceeds when partial import is unchecked and no errors exist
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: Commit Import proceeds normally when partial import is disabled but all rows are valid
    Given an ImportJob with id "job-uuid-1006" in status "validated" with 0 invalid rows
    And the user unchecks the "Partial import" checkbox
    When the user clicks "Commit Import"
    Then the import proceeds normally (sync or async depending on size)
    And no blocking message is displayed
```

**Test Data:**
- `import_job_id`: `"job-uuid-1006"`
- `partial_import`: `false`
- `rows_valid`: `200`, `rows_invalid`: `0`
- File size: `200KB`

**Preconditions:**
- ImportJob exists with status `"validated"` and zero error rows

---

### T-8.1: Sync import completes and transitions to completion screen
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: Small import (below sync threshold) commits synchronously within 30 seconds
    Given an ImportJob with id "job-uuid-1007" in status "validated"
    And the file contains 300 rows, all valid
    And the file size is 400KB
    And "Partial import" checkbox is checked
    When the user clicks "Commit Import"
    Then no Celery task is dispatched
    And the import runs synchronously within the HTTP request/response cycle
    And the API returns HTTP 200 with status "complete", "rows_imported": 300, "rows_skipped": 0, "rows_failed": 0
    And the UI transitions to an import completion screen within 30 seconds
    And the completion screen displays final row counts: "300 imported, 0 skipped, 0 failed"
```

**Test Data:**
- `import_job_id`: `"job-uuid-1007"`
- `rows_total`: `300`, `rows_valid`: `300`, `rows_invalid`: `0`
- File size: `400KB` (below 500KB threshold)
- `partial_import`: `true`

**Preconditions:**
- ImportJob exists with status `"validated"`
- No active Celery task exists for this job
- Database is available and writable

---

### T-8.2: Sync import failure returns 500 and preserves job status
**Maps to:** AC-8, NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Sync import fails on DB error and returns 500 with ImportJob still validated
    Given an ImportJob with id "job-uuid-1007" in status "validated"
    And the file is below the sync threshold (300 rows, 400KB)
    And the database raises a constraint violation when writing import records
    When the user clicks "Commit Import"
    Then the API returns HTTP 500
    And the UI displays: "Import could not be started. Please try again."
    And the ImportJob status remains "validated" (not "failed" or "complete")
    And no partial import records are written to the CRM data tables
```

**Test Data:**
- Same as T-8.1 with a simulated DB constraint violation on record write

**Preconditions:**
- Database is configured to raise an error on the first CRM record insert for this test run

---

### T-9.1: Async import dispatches Celery task and navigates to progress view
**Maps to:** AC-9
**Category:** happy-path

```gherkin
  Scenario: Large import (above row threshold) dispatches async Celery task
    Given an ImportJob with id "job-uuid-1008" in status "validated"
    And the file contains 5000 rows (above the 500-row async threshold)
    And the file size is 3MB
    When the user clicks "Commit Import"
    Then the API returns HTTP 202 immediately (within 500ms)
    And the response body contains "import_job_id": "job-uuid-1008", "status": "pending"
    And a Celery task is dispatched to the import task queue
    And the ImportJob status is updated to "pending"
    And NO import data is written to CRM tables synchronously
    And the user is navigated to the progress view for ImportJob "job-uuid-1008"
```

**Test Data:**
- `import_job_id`: `"job-uuid-1008"`
- `rows_total`: `5000`
- File size: `3MB` (above 500KB threshold)
- `partial_import`: `true`

**Preconditions:**
- ImportJob exists with status `"validated"`
- Celery broker is reachable
- User is authenticated with `imports:create` permission

---

### T-10.1: Cancel shows confirmation dialog and discards import
**Maps to:** AC-10
**Category:** happy-path

```gherkin
  Scenario: Clicking Cancel shows confirmation dialog and sets ImportJob to cancelled
    Given an ImportJob with id "job-uuid-1009" in status "validated"
    And the preview screen is displayed
    When the user clicks "Cancel"
    Then a confirmation dialog appears with the text "Cancel import? No data will be written. This cannot be undone."
    And the dialog has a "Confirm" button and a "Go Back" button
    When the user clicks "Confirm"
    Then the ImportJob status is updated to "cancelled"
    And no CRM records are written for this import job
    And the user is navigated to the import history screen or the import start screen
```

**Test Data:**
- `import_job_id`: `"job-uuid-1009"`
- `import_job_status`: `"validated"`
- User: `{ email: "admin@crm.example.com", role: "CRM Admin" }`

**Preconditions:**
- ImportJob exists with status `"validated"`
- No records written for this job in CRM tables

---

### T-10.2: Cancel dismissed — user remains on preview screen
**Maps to:** AC-10
**Category:** edge-case

```gherkin
  Scenario: Clicking Go Back on cancel dialog returns user to preview screen without cancelling
    Given an ImportJob with id "job-uuid-1009" in status "validated"
    And the cancel confirmation dialog is displayed
    When the user clicks "Go Back"
    Then the dialog closes
    And the user remains on the preview screen
    And the ImportJob status is still "validated"
    And no cancellation action is taken
```

**Test Data:**
- Same as T-10.1

**Preconditions:**
- Cancel dialog is open (user clicked "Cancel" but not yet confirmed)

---

### T-11.1: "Commit Import" button disabled when zero valid rows exist
**Maps to:** AC-11
**Category:** edge-case

```gherkin
  Scenario: All rows invalid with partial import on — Commit Import is disabled
    Given an ImportJob with id "job-uuid-1010" in status "validated"
    And the file contains 50 rows: 0 valid, 50 with errors
    And "Partial import" checkbox is checked (default)
    When the preview screen renders
    Then the "Commit Import" button is disabled (not clickable)
    And the page displays the message: "No valid rows to import. Fix your data and re-upload."
    And clicking "Commit Import" (if somehow triggered) has no effect
```

**Test Data:**
- `import_job_id`: `"job-uuid-1010"`
- `rows_total`: `50`, `rows_valid`: `0`, `rows_invalid`: `50`
- All 50 row validation results have `status: "error"`

**Preconditions:**
- ImportJob exists with status `"validated"`
- All row-level validation records have `status: "error"`

---

### T-12.1: File with fewer than 20 rows — all rows are shown
**Maps to:** AC-12
**Category:** edge-case

```gherkin
  Scenario: Preview shows all rows when file has fewer than 20 rows
    Given an ImportJob with id "job-uuid-1011" in status "validated"
    And the file contains exactly 8 rows: 6 valid, 2 with errors
    When the user views the preview screen
    Then the preview table displays exactly 8 rows (not truncated to 20)
    And rows 1–6 show status badge "Valid"
    And rows 7–8 show status badge "Error"
    And there is no pagination or "showing 8 of X" truncation message
```

**Test Data:**
- `import_job_id`: `"job-uuid-1011"`
- `rows_total`: `8`, `rows_valid`: `6`, `rows_invalid`: `2`
- Row 7: `{ status: "error", error_message: "Missing required field: Last Name" }`
- Row 8: `{ status: "error", error_message: "Duplicate email: 'existing@crm.example.com'" }`

**Preconditions:**
- ImportJob exists with status `"validated"` and exactly 8 row-level validation result records

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated access to preview endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Request to preview endpoint without authentication returns 401
    Given no valid authentication token or session cookie is present in the request
    When a GET request is made to /imports/job-uuid-1001/preview
    Then the system returns HTTP 401 Unauthorized
    And the response body contains an appropriate error message (e.g., "Authentication required")
    And no preview data is returned
```

**Test Data:**
- `import_job_id`: `"job-uuid-1001"` (an existing validated job)
- Request headers: no `Authorization` header, no valid session cookie

**Preconditions:**
- ImportJob `job-uuid-1001` exists in the database

---

### T-AUTH-1.2: Unauthenticated access to commit endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: POST to commit endpoint without authentication returns 401
    Given no valid authentication token is present in the request
    When a POST request is made to /imports/job-uuid-1001/commit with body { "partial_import": true }
    Then the system returns HTTP 401 Unauthorized
    And no import job is created or updated
    And no Celery task is dispatched
```

**Test Data:**
- Request: `POST /imports/job-uuid-1001/commit`
- Body: `{ "partial_import": true }`
- Headers: no `Authorization` header

**Preconditions:**
- ImportJob `job-uuid-1001` exists

---

### T-AUTH-2.1: Insufficient permissions on preview endpoint returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated user without imports:create permission gets 403 on preview
    Given an authenticated user "readonly@crm.example.com" with role "Read Only" (no imports:create permission)
    And an ImportJob with id "job-uuid-1001" that belongs to a different user
    When the user makes a GET request to /imports/job-uuid-1001/preview with a valid auth token
    Then the system returns HTTP 403 Forbidden
    And the response body includes "required_permission": "imports:create"
    And no preview data is returned
```

**Test Data:**
- User: `{ email: "readonly@crm.example.com", role: "Read Only", permissions: [] }`
- `import_job_id`: `"job-uuid-1001"` (belongs to `admin@crm.example.com`)

**Preconditions:**
- Both users exist in the system
- `readonly@crm.example.com` does not have `imports:create` in their permission set
- ImportJob `job-uuid-1001` is owned by a different user

---

### T-AUTH-2.2: Insufficient permissions on commit endpoint returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated user without imports:create permission gets 403 on commit
    Given an authenticated user "readonly@crm.example.com" with role "Read Only"
    When the user makes a POST request to /imports/job-uuid-1001/commit with a valid auth token
    Then the system returns HTTP 403 Forbidden
    And the response body includes "required_permission": "imports:create"
    And no import job is committed, no Celery task dispatched
```

**Test Data:**
- User: `{ email: "readonly@crm.example.com", role: "Read Only", permissions: [] }`
- Request body: `{ "partial_import": true }`

**Preconditions:**
- Same as T-AUTH-2.1

---

## Negative / Boundary Tests (Additional)

### T-NEG-1.1: Preview accessed for cancelled ImportJob
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Preview screen accessed for a cancelled import job
    Given an ImportJob with id "job-uuid-1012" in status "cancelled"
    When an authenticated CRM Admin navigates to GET /imports/job-uuid-1012/preview
    Then the response is HTTP 200
    And the UI displays: "This import is no longer active."
    And a link to "Start a new import" is displayed
    And no preview table or commit controls are rendered
```

**Test Data:**
- `import_job_id`: `"job-uuid-1012"`, `status: "cancelled"`

**Preconditions:**
- ImportJob exists with `status: "cancelled"`

---

### T-NEG-1.2: Double-submit of commit returns 409
**Maps to:** NFR Security
**Category:** error-handling

```gherkin
  Scenario: Submitting commit twice for the same job returns 409 Conflict
    Given an ImportJob with id "job-uuid-1007" in status "processing" (already committed)
    When an authenticated CRM Admin POSTs to /imports/job-uuid-1007/commit
    Then the system returns HTTP 409 Conflict
    And the response body includes an error indicating the job is already in progress
    And no second import is initiated
```

**Test Data:**
- `import_job_id`: `"job-uuid-1007"`, `status: "processing"` (not `"validated"`)

**Preconditions:**
- ImportJob exists with status `"processing"` (already past the `"validated"` state required for commit)

---

---

# Test Specifications: ASYNC-01 — Sync/async routing and Celery task dispatch

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, boundary |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1 | edge-case |
| AC-4 | T-4.1, T-4.2, T-4.3 | happy-path, error-handling |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1 | edge-case |
| AC-7 | T-7.1, T-7.2 | happy-path, edge-case |
| AC-8 | T-8.1 | happy-path |
| AC-9 | T-9.1 | edge-case |
| AC-10 | T-10.1 | error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Sync path executes import inline for small files (below both thresholds)
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Sync/Async Import Routing

  Scenario: Import below both row and size thresholds executes synchronously
    Given an ImportJob with id "async01-job-001" in status "validated"
    And the file contains 300 rows
    And the file size is 400KB
    And the Celery broker is reachable but no task should be dispatched
    When the commit endpoint POST /imports/async01-job-001/commit is called with body { "partial_import": true }
    Then no Celery task is dispatched for this import job
    And the import executes within the same HTTP request/response cycle
    And the API returns HTTP 200 with body containing: { "status": "complete", "rows_imported": 300, "rows_skipped": 0, "rows_failed": 0 }
    And the response is returned within 5 seconds
    And the ImportJob record in the database has status "complete"
```

**Test Data:**
- `import_job_id`: `"async01-job-001"`
- `rows_total`: `300`, all valid
- File size: `400KB`
- `partial_import`: `true`
- User: `{ email: "admin@crm.example.com", role: "CRM Admin", permissions: ["imports:create"] }`

**Preconditions:**
- ImportJob exists with status `"validated"` and 300 valid row validation records
- Celery broker is running (but no tasks should be enqueued for this job)
- Database is writable

---

### T-1.2: Sync path boundary — exactly at both thresholds routes synchronously
**Maps to:** AC-1
**Category:** boundary

```gherkin
  Scenario: Import at exactly 500 rows AND 500KB is processed synchronously (at threshold, not above)
    Given an ImportJob with id "async01-job-002" with exactly 500 rows and file size exactly 500KB
    When the commit endpoint is called
    Then no Celery task is dispatched
    And the import runs synchronously
    And the API returns HTTP 200 with status "complete"
```

**Test Data:**
- `import_job_id`: `"async01-job-002"`
- `rows_total`: `500`, file size: `500KB` exactly (≤ threshold)
- All rows valid

**Preconditions:**
- ImportJob exists with status `"validated"` and exactly 500 row validation records

---

### T-2.1: Async path triggered when row count exceeds 500
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Import with more than 500 rows dispatches Celery task regardless of file size
    Given an ImportJob with id "async01-job-003" with 501 rows and file size 200KB
    When the commit endpoint POST /imports/async01-job-003/commit is called with body { "partial_import": true }
    Then the system dispatches a Celery task to the import task queue
    And the API returns HTTP 202 within 500ms
    And the response body contains: { "import_job_id": "async01-job-003", "status": "pending" }
    And the ImportJob record in the database has status "pending"
    And no CRM records are written synchronously during the HTTP response
```

**Test Data:**
- `import_job_id`: `"async01-job-003"`
- `rows_total`: `501` (above 500-row threshold)
- File size: `200KB` (below 500KB threshold — row count alone triggers async)
- `partial_import`: `true`

**Preconditions:**
- ImportJob exists with status `"validated"` and 501 rows
- Celery broker is reachable
- User has `imports:create` permission

---

### T-3.1: Async path triggered when file size exceeds 500KB regardless of row count
**Maps to:** AC-3
**Category:** edge-case

```gherkin
  Scenario: Import below row threshold but above size threshold dispatches Celery task
    Given an ImportJob with id "async01-job-004" with 100 rows and file size 600KB
    When the commit endpoint is called
    Then the system dispatches a Celery task
    And the API returns HTTP 202
    And the response body contains: { "import_job_id": "async01-job-004", "status": "pending" }
    And no CRM records are written synchronously
```

**Test Data:**
- `import_job_id`: `"async01-job-004"`
- `rows_total`: `100` (below 500-row threshold)
- File size: `600KB` (above 500KB threshold — size alone triggers async)

**Preconditions:**
- ImportJob exists with status `"validated"` and 100 rows

---

### T-4.1: ImportJob lifecycle — async task updates status to processing then complete
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Async import task updates ImportJob through full lifecycle with correct fields
    Given an ImportJob with id "async01-job-005" in status "pending" (Celery task dispatched)
    And the file contains 1000 rows: 950 valid, 50 with errors
    And partial_import is true
    When the Celery task starts processing
    Then the ImportJob status is updated to "processing" with a non-null "started_at" timestamp
    And as the task processes rows, "rows_processed", "rows_total", "rows_imported", "rows_skipped", "rows_failed" are updated on each progress tick
    When the task completes successfully
    Then the ImportJob status is updated to "complete"
    And "completed_at" is set to a non-null timestamp
    And final counts are: { "rows_imported": 950, "rows_skipped": 50, "rows_failed": 0 }
```

**Test Data:**
- `import_job_id`: `"async01-job-005"`
- `rows_total`: `1000`, `rows_valid`: `950`, `rows_invalid`: `50`
- `partial_import`: `true`

**Preconditions:**
- ImportJob exists with status `"pending"` (commit already called, Celery task in queue)
- Celery worker is running and consuming from the import task queue

---

### T-4.2: ImportJob lifecycle — task failure updates status to failed with error message
**Maps to:** AC-4
**Category:** error-handling

```gherkin
  Scenario: Celery task failure updates ImportJob to failed status with error_message
    Given an ImportJob with id "async01-job-005" in status "processing"
    And the database raises an unrecoverable error after 3 retries during row writes
    When all retry attempts are exhausted
    Then the ImportJob status is updated to "failed"
    And "error_message" on the ImportJob record is non-null and describes the failure
    And "completed_at" remains null (or is set to the failure time, per implementation)
```

**Test Data:**
- `import_job_id`: `"async01-job-005"`
- Simulated DB failure: connection timeout after row 400

**Preconditions:**
- ImportJob exists with status `"processing"`
- Database is configured to raise an error (test environment mock or chaos injection)

---

### T-4.3: ImportJob lifecycle — intermediate progress ticks are recorded
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Progress fields are updated on each tick during async processing
    Given an async import with 1000 rows is being processed
    And the task emits progress ticks every 100 rows
    When the task has processed 400 rows (tick 4)
    Then the ImportJob record shows: "rows_processed": 400, "rows_total": 1000
    And when checked at tick 7 (700 rows), "rows_processed" is 700
    And the values monotonically increase with each tick
```

**Test Data:**
- `import_job_id`: `"async01-job-005"`
- Progress ticks at rows: 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000

**Preconditions:**
- Celery task is running and emitting `update_state` calls every 100 rows

---

### T-5.1: Every imported CRM record is tagged with import_job_id
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: All records written during import have import_job_id set
    Given an import job "async01-job-006" (sync or async) processes 300 valid rows
    When the import completes
    Then all 300 records written to the CRM contacts table have "import_job_id" = "async01-job-006"
    And no record from this import has a null or mismatched "import_job_id"
    And records from prior imports are unaffected
```

**Test Data:**
- `import_job_id`: `"async01-job-006"`
- `rows_total`: `300`, all valid
- Table queried: `crm_contacts` (or equivalent entity table)

**Preconditions:**
- ImportJob exists with status `"validated"` and 300 valid rows
- CRM contacts table has `import_job_id` column with FK constraint to `import_jobs`

---

### T-6.1: Celery task resumes from checkpoint on retry — no duplicate records
**Maps to:** AC-6
**Category:** edge-case

```gherkin
  Scenario: Retried Celery task does not re-import already-committed rows
    Given an import job "async01-job-007" processing 1000 rows
    And the task commits rows in checkpoints of 100 rows each
    And the task fails after successfully committing rows 1–400 (checkpoint 4)
    When Celery retries the task
    Then the retried task starts from row 401 (not row 1)
    And rows 1–400 are NOT imported a second time
    And the final ImportJob record shows "rows_imported": 1000 (total, not duplicated)
    And the CRM table contains exactly 1000 records for this import_job_id (no duplicates)
```

**Test Data:**
- `import_job_id`: `"async01-job-007"`
- `rows_total`: `1000`, all valid
- Checkpoint size: `100` rows
- Failure injected after row 400 commit

**Preconditions:**
- ImportJob exists with status `"processing"`
- A checkpoint mechanism exists (e.g., `last_committed_row` stored on ImportJob or a checkpoints table)
- Celery task max retries ≥ 1

---

### T-7.1: ETR computed correctly after 2+ progress ticks
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: ETR is computed as rolling rows/sec average over last 10 ticks
    Given an async import with 10000 rows is processing
    And the following 10 progress ticks have been recorded (rows_processed, elapsed_seconds):
      | Tick | rows_processed | tick_duration_seconds |
      | 1    | 1000           | 10                    |
      | 2    | 2000           | 10                    |
      | 3    | 3000           | 10                    |
      | 4    | 4000           | 10                    |
      | 5    | 5000           | 10                    |
      | 6    | 6000           | 10                    |
      | 7    | 7000           | 10                    |
      | 8    | 8000           | 10                    |
      | 9    | 9000           | 10                    |
      | 10   | 9500           | 5                     |
    When update_state is called for tick 10
    Then rolling_rows_per_second = average of last 10 tick rates = (100 + 100 + 100 + 100 + 100 + 100 + 100 + 100 + 100 + 100) / 10 = 100 rows/sec
    And estimated_seconds_remaining = (10000 - 9500) / 100 = 5 seconds
    And the ImportJob record has "estimated_seconds_remaining": 5
```

**Test Data:**
- `import_job_id`: `"async01-job-008"`
- `rows_total`: `10000`
- Tick throughput: `100 rows/sec` uniform (for deterministic test)

**Preconditions:**
- Celery task is running and has emitted at least 10 `update_state` calls with timing metadata

---

### T-7.2: ETR is null when fewer than 2 progress ticks have elapsed
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: ETR is null after only 1 progress tick
    Given an async import with 10000 rows just started processing
    And only 1 update_state call has been made (1000 rows processed)
    When GET /imports/async01-job-008/status is called
    Then the response contains "estimated_seconds_remaining": null
```

**Test Data:**
- `import_job_id`: `"async01-job-008"`
- `rows_processed`: `1000`, `rows_total`: `10000`
- `tick_count`: `1`

**Preconditions:**
- Celery task has emitted exactly 1 `update_state` call

---

### T-8.1: Partial import flag — invalid rows are skipped, processing continues
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: Task with partial_import=true skips invalid rows and continues processing
    Given an import job "async01-job-009" dispatched with partial_import = true
    And the file has 500 rows: 450 valid, 50 with validation errors
    When the Celery task processes the import
    Then rows that fail validation are skipped (not written to the CRM table)
    And processing continues past each invalid row without aborting
    And the final ImportJob counts are: { "rows_imported": 450, "rows_skipped": 50, "rows_failed": 0 }
    And the ImportJob status is "complete"
    And the CRM table has exactly 450 records for import_job_id "async01-job-009"
```

**Test Data:**
- `import_job_id`: `"async01-job-009"`
- `partial_import`: `true`
- `rows_total`: `500`, `rows_valid`: `450`, `rows_invalid`: `50`
- Invalid rows: rows 10, 50, 100, 200, 300 (and 45 others) — each with `error_type: "missing_required_field"`

**Preconditions:**
- ImportJob exists with status `"pending"` and `partial_import: true`
- Row-level validation results exist for all 500 rows

---

### T-9.1: Partial import disabled — invalid row aborts and rolls back all records
**Maps to:** AC-9
**Category:** edge-case

```gherkin
  Scenario: Task with partial_import=false aborts and rolls back on first invalid row
    Given an import job "async01-job-010" dispatched with partial_import = false
    And the file has 500 rows
    And row 47 has validation error "Invalid phone format: '+1-abc-def-ghij'"
    When the Celery task encounters row 47
    Then the entire import is rolled back (all rows written so far for this job are deleted)
    And the ImportJob status is set to "failed"
    And the ImportJob "error_message" contains "Row 47: Invalid phone format: '+1-abc-def-ghij'"
    And the CRM table contains 0 records with import_job_id "async01-job-010"
```

**Test Data:**
- `import_job_id`: `"async01-job-010"`
- `partial_import`: `false`
- `rows_total`: `500`
- Row 47: `{ phone: "+1-abc-def-ghij" }` — fails phone format validation
- Rows 1–46: all valid

**Preconditions:**
- ImportJob exists with status `"pending"` and `partial_import: false`
- Rows 1–46 have been written to CRM table before row 47 is encountered (to confirm rollback removes them)

---

### T-10.1: Sync import rolls back atomically on database failure
**Maps to:** AC-10
**Category:** error-handling

```gherkin
  Scenario: Sync import DB error mid-import rolls back all records atomically
    Given a sync import job "async01-job-011" with 300 rows (below thresholds)
    And a database constraint violation occurs after writing row 150
    When the commit endpoint is called
    Then the entire transaction is rolled back
    And no records for import_job_id "async01-job-011" exist in the CRM table
    And the API returns HTTP 500
    And the ImportJob status is set to "failed"
    And the response body includes an error message
```

**Test Data:**
- `import_job_id`: `"async01-job-011"`
- `rows_total`: `300`, file size: `200KB`
- Simulated failure: unique constraint violation on row 151 (e.g., duplicate external_id)

**Preconditions:**
- ImportJob exists with status `"validated"` and 300 rows
- DB is configured to raise a unique constraint error at row 151 in this test run
- The import runs within a single database transaction

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated commit request returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: POST to commit endpoint without authentication token returns 401
    Given no valid authentication token is present
    When a POST request is made to /imports/async01-job-001/commit with body { "partial_import": true }
    Then the system returns HTTP 401 Unauthorized
    And no import job is created or updated
    And no Celery task is dispatched
    And the ImportJob status is unchanged
```

**Test Data:**
- Request: `POST /imports/async01-job-001/commit`
- Body: `{ "partial_import": true }`
- Headers: no `Authorization` header, no session cookie

**Preconditions:**
- ImportJob `async01-job-001` exists in the database

---

### T-AUTH-2.1: Authenticated user without import permission gets 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: User with Read Only role cannot trigger import and receives 403
    Given an authenticated user "readonly@crm.example.com" with role "Read Only" and no import permissions
    When the user POSTs to /imports/async01-job-001/commit with a valid auth token
    Then the system returns HTTP 403 Forbidden
    And the response body identifies the missing permission (e.g., "imports:create required")
    And no import job is created
    And no Celery task is dispatched
```

**Test Data:**
- User: `{ email: "readonly@crm.example.com", role: "Read Only", permissions: ["contacts:read"] }`
- Request: `POST /imports/async01-job-001/commit`, body: `{ "partial_import": true }`

**Preconditions:**
- User exists with `Read Only` role
- `Read Only` role does not include `imports:create` permission

---

## Negative / Boundary Tests (Additional)

### T-NEG-1.1: Celery broker unreachable — returns 503
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Celery broker is unreachable when dispatching async import
    Given an ImportJob with id "async01-job-012" requiring async processing (5000 rows)
    And the Celery broker (Redis/RabbitMQ) is unavailable
    When the commit endpoint is called
    Then the API returns HTTP 503
    And the response body includes: "Import service temporarily unavailable — try again in a few minutes"
    And no ImportJob record is created
    And no partial data is written to CRM tables
```

**Test Data:**
- `import_job_id`: `"async01-job-012"`, `rows_total`: `5000`
- Celery broker: connection refused (broker taken offline for test)

**Preconditions:**
- Celery broker is offline (simulated via network rule or broker shutdown in test environment)

---

---

# Test Specifications: ASYNC-02 — Progress tracking endpoint and polling UI

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, boundary |
| AC-2 | T-2.1 | edge-case |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1 | error-handling |
| AC-7 | T-7.1 | error-handling |
| AC-8 | T-8.1, T-8.2 | error-handling |
| AC-9 | T-9.1, T-9.2 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Status endpoint returns all required fields for a processing job
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Import Progress Status Endpoint

  Scenario: GET status endpoint returns correct fields for a processing import job
    Given an ImportJob with id "async02-job-001" in status "processing"
    And the Celery task has processed 3000 of 10000 rows so far
    And "rows_imported" is 2800, "rows_skipped" is 200, "rows_failed" is 0
    And at least 2 progress ticks have elapsed, giving estimated_seconds_remaining = 70
    When an authenticated CRM Admin calls GET /imports/async02-job-001/status
    Then the response is HTTP 200
    And the response Content-Type is "application/json"
    And the response body contains exactly: {
        "status": "processing",
        "rows_processed": 3000,
        "rows_total": 10000,
        "rows_imported": 2800,
        "rows_skipped": 200,
        "rows_failed": 0,
        "estimated_seconds_remaining": 70
      }
    And all integer fields are integers (not strings or floats)
    And "status" is one of ["pending", "processing", "complete", "failed"]
```

**Test Data:**
- `import_job_id`: `"async02-job-001"`
- `status`: `"processing"`
- `rows_processed`: `3000`, `rows_total`: `10000`, `rows_imported`: `2800`, `rows_skipped`: `200`, `rows_failed`: `0`
- `estimated_seconds_remaining`: `70`
- User: `{ email: "admin@crm.example.com", role: "CRM Admin", permissions: ["imports:create"] }`

**Preconditions:**
- ImportJob `async02-job-001` exists in the database with the specified field values
- User is authenticated and owns the import job
- At least 2 Celery `update_state` ticks have been recorded

---

### T-1.2: Status endpoint returns correct fields when job is pending (not yet started)
**Maps to:** AC-1, NFR Error Handling
**Category:** boundary

```gherkin
  Scenario: GET status returns valid response when task is pending and rows_total is 0
    Given an ImportJob with id "async02-job-002" in status "pending"
    And the Celery task has not yet started processing
    And "rows_processed" is 0 and "rows_total" is 0
    When an authenticated user calls GET /imports/async02-job-002/status
    Then the response is HTTP 200
    And the response body contains: {
        "status": "pending",
        "rows_processed": 0,
        "rows_total": 0,
        "rows_imported": 0,
        "rows_skipped": 0,
        "rows_failed": 0,
        "estimated_seconds_remaining": null
      }
    And the UI displays "Starting…" in place of a time estimate
```

**Test Data:**
- `import_job_id`: `"async02-job-002"`, `status: "pending"`, all count fields: `0`

**Preconditions:**
- ImportJob `async02-job-002` exists with `status: "pending"` and the Celery task has not yet called `update_state`

---

### T-2.1: ETR is null when fewer than 2 progress ticks are available
**Maps to:** AC-2
**Category:** edge-case

```gherkin
  Scenario: Status endpoint returns null ETR when only 1 tick has been emitted
    Given an ImportJob with id "async02-job-001" in status "processing"
    And exactly 1 Celery update_state call has been made (rows_processed: 500)
    When GET /imports/async02-job-001/status is called
    Then the response body contains "estimated_seconds_remaining": null
    And the UI renders "Calculating…" in the ETR display area
    And no numeric ETR is shown to the user
```

**Test Data:**
- `import_job_id`: `"async02-job-001"`
- `tick_count`: `1`
- `rows_processed`: `500`, `rows_total`: `10000`

**Preconditions:**
- ImportJob exists with `status: "processing"`
- Exactly 1 `update_state` record exists in the tick history for this job

---

### T-3.1: Frontend polls every 3 seconds while job is active
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Import Progress Polling UI

  Scenario: Frontend initiates 3-second polling loop on progress page for an active job
    Given the user navigates to the progress page for import "async02-job-001"
    And the ImportJob status is "processing"
    When the progress page is fully rendered
    Then the frontend makes a GET request to /imports/async02-job-001/status
    And subsequent GET requests are made at 3-second intervals (± 200ms tolerance)
    And polling continues for at least 3 consecutive cycles without manual intervention
    And exactly 1 request is in-flight at any given time (no concurrent polling requests)
```

**Test Data:**
- `import_job_id`: `"async02-job-001"`
- Polling interval: `3000ms` (± 200ms)
- Observed via browser dev tools / network interceptor in test framework

**Preconditions:**
- User is on the import progress page at `/imports/async02-job-001/progress`
- ImportJob status is `"processing"` (polling-eligible state)
- Frontend test framework can intercept HTTP requests (e.g., Cypress, Playwright)

---

### T-3.2: Polling does not start for a non-active job (complete or failed)
**Maps to:** AC-3
**Category:** edge-case

```gherkin
  Scenario: Frontend does not initiate polling when ImportJob is already complete on page load
    Given an ImportJob with id "async02-job-003" in status "complete"
    When the user navigates to the progress page for import "async02-job-003"
    Then the frontend makes exactly 1 GET request to /imports/async02-job-003/status (on mount)
    And NO subsequent polling requests are made after the first response
    And the completion summary is immediately rendered
```

**Test Data:**
- `import_job_id`: `"async02-job-003"`, `status: "complete"`, `rows_imported: 1000`

**Preconditions:**
- ImportJob is already in `"complete"` state before the page loads

---

### T-4.1: Progress bar renders correct percentage and row label
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Progress bar fills to correct percentage based on rows_processed / rows_total
    Given the frontend receives a polling response with "rows_processed": 3000 and "rows_total": 10000
    When the progress bar is updated
    Then the progress bar fill width corresponds to 30% (3000 / 10000)
    And the progress bar displays the text "3,000 / 10,000 rows"
    And the percentage label reads "30%"
    And the progress bar has aria-valuenow="30", aria-valuemin="0", aria-valuemax="100"
    And a visible text label accompanies the bar (not aria-label only)
```

**Test Data:**
- Polling response: `{ "rows_processed": 3000, "rows_total": 10000, "status": "processing" }`
- Expected percentage: `30`
- Expected label: `"3,000 / 10,000 rows"`

**Preconditions:**
- User is on the import progress page with an active polling loop
- The UI framework renders the progress bar on each polling response

---

### T-5.1: Polling stops and completion summary renders when status becomes complete
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Polling stops and summary panel renders when job transitions to complete
    Given the frontend is actively polling /imports/async02-job-004/status every 3 seconds
    And the job transitions to "complete" on the 5th poll
    When the 5th polling response returns: { "status": "complete", "rows_imported": 950, "rows_skipped": 50, "rows_failed": 0 }
    Then the polling loop stops (no 6th request is made)
    And the progress bar renders at 100%
    And a summary panel is displayed showing:
      - "Rows imported: 950"
      - "Rows skipped: 50"
      - "Rows failed: 0"
    And a link to the import history entry for "async02-job-004" is displayed
    And the summary panel is visible without any user interaction
```

**Test Data:**
- `import_job_id`: `"async02-job-004"`
- 5th poll response: `{ status: "complete", rows_imported: 950, rows_skipped: 50, rows_failed: 0, rows_total: 1000 }`
- History link URL: `/imports/history/async02-job-004`

**Preconditions:**
- Frontend is on the progress page with active 3-second polling
- Mocked or live backend returns `"processing"` for polls 1–4, then `"complete"` on poll 5

---

### T-6.1: Polling stops and error state renders when status is failed
**Maps to:** AC-6
**Category:** error-handling

```gherkin
  Scenario: Polling stops and error message renders when job transitions to failed
    Given the frontend is polling /imports/async02-job-005/status
    And a polling response returns: { "status": "failed", "rows_processed": 300, "rows_total": 1000 }
    When the polling loop receives this response
    Then polling stops immediately (no further requests after this response)
    And the progress bar is replaced by an error state indicator
    And the message "Import failed — see import history for details" is displayed
    And a link to the import history entry for "async02-job-005" is present
    And the error state is visible without any user interaction
```

**Test Data:**
- `import_job_id`: `"async02-job-005"`
- Failure poll response: `{ status: "failed", rows_processed: 300, rows_total: 1000, estimated_seconds_remaining: null }`

**Preconditions:**
- Frontend is on the progress page with active polling
- Backend (or mock) returns `"failed"` status on the triggered poll

---

### T-7.1: Status endpoint returns 404 for non-existent job_id
**Maps to:** AC-7
**Category:** error-handling

```gherkin
  Scenario: GET status for a job_id that does not exist returns 404
    Given no ImportJob with id "non-existent-uuid-9999" exists in the database
    When an authenticated CRM Admin calls GET /imports/non-existent-uuid-9999/status
    Then the response is HTTP 404 Not Found
    And the response body contains: { "error": "Import job not found" }
    And no sensitive data is leaked (no stack trace, no DB query details)
```

**Test Data:**
- `import_job_id`: `"non-existent-uuid-9999"` (UUID format, does not exist in DB)

**Preconditions:**
- No ImportJob with this ID in the database
- User is authenticated

---

### T-8.1: Frontend handles 5xx errors with retry and "Connection issue" message
**Maps to:** AC-8
**Category:** error-handling

```gherkin
  Scenario: Frontend shows "Connection issue" on network/server error and retries
    Given the frontend is polling /imports/async02-job-006/status every 3 seconds
    And consecutive GET requests return HTTP 503 (server error)
    When the first failed request occurs
    Then the UI displays "Connection issue — retrying…"
    And polling continues at the 3-second interval despite the errors
    And the progress bar remains at its last known value (not reset or hidden)
```

**Test Data:**
- `import_job_id`: `"async02-job-006"`
- Mock server returns HTTP 503 for 4 consecutive requests

**Preconditions:**
- Frontend is on the progress page with active polling
- Server is configured to return 503 (test environment mock)

---

### T-8.2: Frontend stops polling and shows "Unable to retrieve status" after 5 consecutive failures
**Maps to:** AC-8
**Category:** error-handling

```gherkin
  Scenario: Frontend stops polling after 5 consecutive network failures and shows fallback message
    Given the frontend is polling /imports/async02-job-006/status
    And 5 consecutive GET requests fail (network timeout or 5xx)
    When the 5th consecutive failure occurs
    Then polling stops permanently (no further requests are made)
    And the UI displays: "Unable to retrieve status — check import history for updates"
    And a link to the import history is provided
    And the error count resets if the user manually refreshes the page
```

**Test Data:**
- `import_job_id`: `"async02-job-006"`
- 5 consecutive failures: HTTP 504 Gateway Timeout on each poll

**Preconditions:**
- Frontend is on the progress page
- Mock server returns 504 for all 5 consecutive poll requests

---

### T-9.1: ETR displayed as human-readable minutes for values ≥ 60 seconds
**Maps to:** AC-9
**Category:** edge-case

```gherkin
  Scenario: ETR of 185 seconds is displayed as "About 3 minutes remaining"
    Given a polling response returns "estimated_seconds_remaining": 185
    When the progress page renders the ETR
    Then the UI displays "About 3 minutes remaining"
    And the raw value 185 is NOT displayed directly
```

**Test Data:**
- `estimated_seconds_remaining`: `185`
- Expected display: `"About 3 minutes remaining"` (rounded to nearest minute: 185/60 = 3.08 → 3 minutes)

**Preconditions:**
- Frontend receives a status response with the specified ETR value

---

### T-9.2: ETR displayed in seconds for values under 60 seconds
**Maps to:** AC-9
**Category:** edge-case

```gherkin
  Scenario: ETR of 45 seconds is displayed as "About 45 seconds remaining"
    Given a polling response returns "estimated_seconds_remaining": 45
    When the progress page renders the ETR
    Then the UI displays "About 45 seconds remaining"
    And no minute conversion is applied
```

**Test Data:**
- `estimated_seconds_remaining`: `45`
- Expected display: `"About 45 seconds remaining"`

**Preconditions:**
- Frontend receives a status response with the specified ETR value

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to status endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: GET status endpoint without authentication token returns 401
    Given no valid authentication token is present in the request
    When a GET request is made to /imports/async02-job-001/status
    Then the system returns HTTP 401 Unauthorized
    And no job status data is returned
    And the response body does not expose any import job fields
```

**Test Data:**
- Request: `GET /imports/async02-job-001/status`
- Headers: no `Authorization` header, no session cookie

**Preconditions:**
- ImportJob `async02-job-001` exists in the database

---

### T-AUTH-2.1: Authenticated user requesting another user's job status returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Power User cannot view status of an import job owned by a different user
    Given an ImportJob "async02-job-001" owned by "admin@crm.example.com"
    And an authenticated Power User "poweruser@crm.example.com" (a different user, non-admin)
    When "poweruser@crm.example.com" calls GET /imports/async02-job-001/status with a valid token
    Then the system returns HTTP 403 Forbidden
    And no job status data is returned
    And the response does not confirm or deny whether the job exists
```

**Test Data:**
- `import_job_id`: `"async02-job-001"` (owned by `admin@crm.example.com`)
- Requesting user: `{ email: "poweruser@crm.example.com", role: "Power User" }` (different owner)

**Preconditions:**
- Both users exist in the system
- ImportJob is owned by `admin@crm.example.com`, not `poweruser@crm.example.com`
- `poweruser@crm.example.com` is not a CRM Admin (non-admin cannot access cross-user jobs per the assumption)

---

## Negative / Boundary Tests (Additional)

### T-NEG-1.1: Status endpoint with invalid UUID format returns 400
**Maps to:** NFR Security
**Category:** error-handling

```gherkin
  Scenario: GET status with non-UUID job_id returns 400 Bad Request
    Given an authenticated user calls GET /imports/not-a-uuid/status
    Then the system returns HTTP 400 Bad Request
    And the response body contains an error describing the invalid format (e.g., "job_id must be a valid UUID")
    And no database query is executed
```

**Test Data:**
- `job_id`: `"not-a-uuid"` (not a UUID format)

**Preconditions:**
- User is authenticated
- Input validation is applied before the database layer is reached

---

---

# Test Specifications: ASYNC-03 — In-app completion notification

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1 | security |
| AC-6 | T-6.1 | happy-path |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Notification created with correct content when import completes successfully
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: In-App Import Completion Notifications

  Scenario: Notification is created with full import result details on successful completion
    Given an ImportJob with id "async03-job-001" owned by user "admin@crm.example.com"
    And the Celery task transitions the ImportJob to status "complete"
    And the final ImportJob record contains:
      - entity_type: "Contact"
      - original_filename: "contacts_june_2026.csv"
      - rows_imported: 950
      - rows_skipped: 50
      - rows_failed: 0
    When the ImportJob status transitions to "complete"
    Then a notification record is created in the "notifications" table
    And the notification is scoped to user "admin@crm.example.com"
    And the notification body includes:
      - entity type: "Contact"
      - original filename: "contacts_june_2026.csv"
      - rows imported count: 950
      - rows skipped count: 50
      - rows failed count: 0
      - a link to the import history entry for "async03-job-001"
    And the notification is marked "unread"
    And the notification is created within 5 seconds of the status transition
```

**Test Data:**
- `import_job_id`: `"async03-job-001"`
- `user`: `{ email: "admin@crm.example.com", role: "CRM Admin" }`
- `entity_type`: `"Contact"`
- `original_filename`: `"contacts_june_2026.csv"`
- `rows_imported`: `950`, `rows_skipped`: `50`, `rows_failed`: `0`
- `history_link`: `/imports/history/async03-job-001`

**Preconditions:**
- ImportJob `async03-job-001` exists with status transitioning from `"processing"` to `"complete"`
- Notification creation is triggered by the Celery task's on-success handler (or a Django signal)
- `notifications` table has fields: `user_id`, `title`, `body`, `link`, `is_read`, `created_at`

---

### T-1.2: Notification is created within 5 seconds of completion
**Maps to:** AC-1, NFR Performance
**Category:** performance

```gherkin
  Scenario: Notification creation latency is under 5 seconds after ImportJob status transition
    Given an ImportJob "async03-job-001" transitions to "complete" at timestamp T
    When the system processes the completion event
    Then a notification record for the import owner is present in the database by T + 5 seconds
```

**Test Data:**
- Completion timestamp: measured at the point the Celery task marks the ImportJob `"complete"`
- Deadline: `T + 5000ms`

**Preconditions:**
- Notification is created via a synchronous step in the Celery task's on-success handler, or via a signal with a known processing path

---

### T-2.1: Notification created with failure reason when import fails
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Notification is created with truncated failure reason when import fails
    Given an ImportJob with id "async03-job-002" owned by "admin@crm.example.com"
    And the Celery task transitions the ImportJob to status "failed"
    And the ImportJob "error_message" is: "Row 247: Database constraint violation — duplicate value in 'external_id' column. The value 'EXT-00247' already exists in the contacts table and cannot be inserted again."
    When the ImportJob status transitions to "failed"
    Then a notification record is created for "admin@crm.example.com"
    And the notification body includes:
      - entity type: "Contact"
      - original filename (from ImportJob): "contacts_june_2026.csv"
      - failure reason truncated to 200 characters: "Row 247: Database constraint violation — duplicate value in 'external_id' column. The value 'EXT-00247' already exists in the contacts table and cannot be inserted "
      - a link to the import history entry for "async03-job-002"
    And the notification is marked "unread"
```

**Test Data:**
- `import_job_id`: `"async03-job-002"`
- `error_message` (full): `"Row 247: Database constraint violation — duplicate value in 'external_id' column. The value 'EXT-00247' already exists in the contacts table and cannot be inserted again."` (211 characters — triggers truncation)
- `error_message` (truncated, 200 chars): `"Row 247: Database constraint violation — duplicate value in 'external_id' column. The value 'EXT-00247' already exists in the contacts table and cannot be inserted "` (200 chars exactly)

**Preconditions:**
- ImportJob `async03-job-002` exists with `status: "failed"` and a `error_message` longer than 200 characters
- Notification creation is triggered by the task's on-failure handler

---

### T-3.1: Notification appears in bell tray with unread badge
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Bell icon shows unread badge including the new import notification
    Given a notification has been created for user "admin@crm.example.com" for import "async03-job-001"
    And the user previously had 2 unread notifications
    When the user views any page in the application (e.g., the dashboard)
    Then the bell icon in the application header shows an unread badge with count "3"
    And the bell icon has aria-label="3 unread notifications"
    When the user clicks the bell icon to open the notification tray
    Then the tray opens and displays the import completion notification at the top (most recent)
    And the notification shows entity type, filename, row counts, and a link to import history
    And after the tray is opened, the notification is marked as "read"
    And the bell badge count decrements to 2 (reflecting the now-read notification)
```

**Test Data:**
- User: `{ email: "admin@crm.example.com" }`
- Pre-existing unread notifications: `2`
- New notification: import completion for `"async03-job-001"`
- Expected badge count: `3` (before open), `2` (after open)

**Preconditions:**
- User has 2 existing unread notifications in the database
- Import completion notification has just been created (unread)
- User is authenticated and on any application page

---

### T-3.2: Notification tray loads within 500ms
**Maps to:** AC-3, NFR Performance
**Category:** performance

```gherkin
  Scenario: Notification tray content loads within 500ms p95
    Given the user clicks the bell icon to open the notification tray
    When the tray data is fetched from the notifications endpoint
    Then the tray content (notification list) renders within 500ms of the click
```

**Test Data:**
- User with 10 unread notifications (to test non-trivial load)
- Measured from click event to first render of tray content

**Preconditions:**
- Notifications endpoint is available
- Test environment simulates production-like DB query performance

---

### T-4.1: Notification is still created even when user is on the progress page
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: Server-side notification is created even if user is actively viewing the progress page
    Given user "admin@crm.example.com" is on the progress page for import "async03-job-003"
    And the polling UI is active and will display the completion inline
    When the ImportJob "async03-job-003" transitions to "complete"
    Then the polling UI displays the completion summary inline (per ASYNC-02 AC-5)
    AND a notification record is also created server-side for "admin@crm.example.com"
    And if the user later navigates to another page or logs in on a different device, the notification appears in the tray
    And only ONE notification is created for this import completion (not duplicate notifications)
```

**Test Data:**
- `import_job_id`: `"async03-job-003"`
- User is on `/imports/async03-job-003/progress` when completion occurs

**Preconditions:**
- User is authenticated and on the progress page with active polling
- Celery task completes and transitions ImportJob to `"complete"` while user is on the page

---

### T-5.1: User B's notification tray does not contain User A's import notifications
**Maps to:** AC-5
**Category:** security

```gherkin
  Scenario: Import notifications are scoped to the importing user only
    Given User A "admin@crm.example.com" has an import completion notification for "async03-job-001"
    And User B "poweruser@crm.example.com" is a CRM Admin (highest permission level)
    When User B opens their notification tray
    Then User B's tray does NOT contain a notification for "async03-job-001"
    And User B's tray contains only notifications scoped to User B's own user_id
    And the notifications API does not return User A's notification_id in User B's response
```

**Test Data:**
- User A: `{ email: "admin@crm.example.com", user_id: "user-uuid-001" }`
- User B: `{ email: "poweruser@crm.example.com", user_id: "user-uuid-002", role: "CRM Admin" }`
- Notification for import `"async03-job-001"` has `user_id: "user-uuid-001"` (User A only)

**Preconditions:**
- Both users are authenticated
- Notification for User A's import exists in the database
- User B has no import notifications of their own

---

### T-6.1: Notification link navigates to the correct import history entry
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Clicking notification link takes user to the specific import history detail page
    Given a notification for import "async03-job-001" is in the user's notification tray
    And the notification contains a link to "/imports/history/async03-job-001"
    When the user clicks the link within the notification
    Then the user is navigated to the import history detail page for ImportJob "async03-job-001"
    And the detail page shows the specific import's results (rows imported, skipped, failed, entity type, filename)
    And the URL is "/imports/history/async03-job-001" (not the generic history list)
```

**Test Data:**
- `import_job_id`: `"async03-job-001"`
- Expected URL: `/imports/history/async03-job-001`
- Expected page title (or H1): `"Import: contacts_june_2026.csv"` (or equivalent)

**Preconditions:**
- ImportJob `"async03-job-001"` has a completed import history entry
- Notification contains the correct deep link
- User is authenticated

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to notifications endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Read notifications endpoint returns 401 for unauthenticated requests
    Given no valid authentication token is present
    When a GET request is made to /notifications
    Then the system returns HTTP 401 Unauthorized
    And no notification data is returned
    And the response does not reveal how many notifications exist
```

**Test Data:**
- Request: `GET /notifications`
- Headers: no `Authorization` header, no session cookie

**Preconditions:**
- The notifications endpoint exists and requires authentication

---

### T-AUTH-1.2: Unauthenticated dismiss request returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Dismiss notification endpoint returns 401 for unauthenticated requests
    Given no valid authentication token is present
    And a notification with id "notif-uuid-001" exists
    When a POST request is made to /notifications/notif-uuid-001/dismiss
    Then the system returns HTTP 401 Unauthorized
    And the notification remains unread
```

**Test Data:**
- `notification_id`: `"notif-uuid-001"` (an existing notification)
- Request: `POST /notifications/notif-uuid-001/dismiss`
- Headers: no auth

**Preconditions:**
- Notification `"notif-uuid-001"` exists in the database

---

### T-AUTH-2.1: User cannot read another user's notifications — returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated user cannot read notifications belonging to another user
    Given notification "notif-uuid-001" belongs to user "admin@crm.example.com" (user_id: "user-uuid-001")
    And an authenticated service account "svc@crm.example.com" (user_id: "user-uuid-svc") with no UI access
    When "svc@crm.example.com" makes a GET request to /notifications?user_id=user-uuid-001
    Then the system returns HTTP 403 Forbidden
    And no notifications for "user-uuid-001" are returned
```

**Test Data:**
- Notification owner: `{ user_id: "user-uuid-001", email: "admin@crm.example.com" }`
- Requesting user: `{ user_id: "user-uuid-svc", email: "svc@crm.example.com", role: "Service Account" }`

**Preconditions:**
- Both users exist in the system
- Notification `"notif-uuid-001"` is scoped to `"user-uuid-001"`
- `"svc@crm.example.com"` has a valid auth token but does not own the notification

---

## Negative / Boundary Tests (Additional)

### T-NEG-1.1: Notification creation failure does not affect import job status
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Import job is not affected when notification creation fails due to DB error
    Given an ImportJob "async03-job-004" transitions to "complete" successfully
    And the notification creation step raises a database error
    When the notification fails to be created
    Then the ImportJob remains at status "complete" (not reverted to "failed")
    And the failure is logged with error severity including the import_job_id and user_id
    And the user can still access the import result via the import history page
    And no notification appears in the user's tray for this import
```

**Test Data:**
- `import_job_id`: `"async03-job-004"`
- Simulated failure: DB connection error specifically on the `INSERT INTO notifications` query

**Preconditions:**
- Notification creation is a non-critical side effect of import completion
- Import completion and notification creation are NOT in the same atomic database transaction

---

### T-NEG-1.2: Notification tray failure renders graceful fallback
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Notification tray renders fallback message when backend is unavailable
    Given the notifications endpoint returns HTTP 503 or times out
    When the user clicks the bell icon to open the notification tray
    Then the bell icon renders without an unread badge count (or retains the last known count)
    And the tray displays: "Notifications temporarily unavailable"
    And the user is not shown a blank tray or an unhandled error
```

**Test Data:**
- Notifications endpoint returns HTTP 503

**Preconditions:**
- Notifications backend is offline (simulated in test environment)
- User is authenticated and on any application page


# Test Specifications: Batch 04 of 5

## Stories Covered
- ERROR-01 — Validation error summary grouped by error type
- ERROR-02 — Downloadable error report CSV
- HIST-01 — Import history list with date-range filter
- HIST-02 — Role-based import history visibility

---

# Test Specifications: ERROR-01 — Validation error summary grouped by error type

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, edge-case |
| AC-2 | T-2.1, T-2.2 | happy-path, boundary |
| AC-3 | T-3.1, T-3.2 | happy-path, edge-case |
| AC-4 | T-4.1, T-4.2 | edge-case |
| AC-5 | T-5.1, T-5.2 | edge-case |
| AC-6 | T-6.1, T-6.2 | edge-case |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1, T-8.2, T-8.3 | happy-path, error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Error summary panel renders above row preview table when validation errors exist
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Validation Error Summary Panel

  Scenario: Error summary panel visible when file has validation errors
    Given an authenticated CRM Admin
    And an import job "job-abc-001" has completed validation
    And the validation results contain 47 rows with errors out of 500 total rows
    When the user navigates to the preview/commit screen for job "job-abc-001"
    Then an error summary panel is displayed above the row preview table
    And the panel contains at least one error type line item with a row count
    And the row preview table is visible below the panel
```

**Test Data:**
- ImportJob ID: `job-abc-001`
- Total rows: 500
- Error rows: 47
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job `job-abc-001` exists and validation status is `complete`
- Validation errors table contains 47 records with `import_job_id = "job-abc-001"`

---

### T-1.2: Zero-error file shows no-error banner instead of error panel
**Maps to:** AC-1
**Category:** edge-case

```gherkin
Feature: Validation Error Summary Panel

  Scenario: No error panel shown when file has zero validation errors
    Given an authenticated CRM Admin
    And an import job "job-clean-001" has completed validation
    And all 1000 rows in the file passed validation with zero errors
    When the user navigates to the preview/commit screen for job "job-clean-001"
    Then no error summary panel is displayed
    And a banner reading "No validation errors found" is displayed
```

**Test Data:**
- ImportJob ID: `job-clean-001`
- Total rows: 1000
- Error rows: 0
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job `job-clean-001` exists and validation status is `complete`
- No records exist in the validation errors table for `import_job_id = "job-clean-001"`

---

### T-2.1: Error counts reflect full file not preview rows
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Validation Error Summary Panel

  Scenario: Error summary shows full-file counts, not preview-row counts
    Given an authenticated CRM Admin
    And an import job "job-large-001" has 5000 rows
    And 300 of those rows have "INVALID_EMAIL" errors (rows 21 through 320, outside the 20-row preview)
    And the preview table shows only the first 20 rows
    When the error summary panel renders on the preview/commit screen
    Then the panel displays "Invalid email format: 300 rows"
    And the count shown is 300, not 0 (which would be the count visible in the 20-row preview)
```

**Test Data:**
- ImportJob ID: `job-large-001`
- Total rows: 5000
- Rows with INVALID_EMAIL: 300 (rows 21–320)
- Preview window: first 20 rows (0 email errors in preview)
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Validation has completed for `job-large-001`
- 300 validation_error records exist with `error_type = "INVALID_EMAIL"` and `row_number` between 21 and 320
- The aggregation query pulls from the full errors table, not the preview slice

---

### T-2.2: Error counts are accurate for a boundary file (1 error row out of 50,000)
**Maps to:** AC-2
**Category:** boundary

```gherkin
Feature: Validation Error Summary Panel

  Scenario: Error summary is accurate for a single error in a 50,000-row file
    Given an authenticated CRM Admin
    And an import job "job-boundary-001" has 50000 rows
    And exactly 1 row (row 49999) has a "REQUIRED_FIELD_MISSING" error on field "Owner"
    When the error summary panel renders
    Then the panel displays "Missing required field 'Owner': 1 rows"
    And no other error type line items appear
    And the panel load time is within 1 second p95
```

**Test Data:**
- ImportJob ID: `job-boundary-001`
- Total rows: 50000
- Error row: row 49999, `error_type = "REQUIRED_FIELD_MISSING"`, `field_name = "Owner"`
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job has validation status `complete`
- Exactly 1 validation_error record exists for this job
- An index on `(import_job_id, error_type)` exists in the validation errors table

---

### T-3.1: Multiple distinct error types render as separate line items
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Validation Error Summary Panel

  Scenario: Each distinct error type appears as a separate labeled line item
    Given an authenticated CRM Admin
    And an import job "job-multi-001" has completed validation with the following error distribution:
      | error_type                | field_name    | count |
      | INVALID_EMAIL             |               | 12    |
      | REQUIRED_FIELD_MISSING    | Company Name  | 5     |
      | REQUIRED_FIELD_MISSING    | Owner         | 3     |
      | INTRAFILE_DUPLICATE       |               | 4     |
      | EXISTING_RECORD_DUPLICATE |               | 2     |
      | ENUM_MISMATCH             | Lead Status   | 7     |
      | DATE_AMBIGUOUS            | Close Date    | 1     |
    When the error summary panel renders
    Then the panel contains exactly 7 line items
    And line item for INVALID_EMAIL reads "Invalid email format: 12 rows"
    And line item for REQUIRED_FIELD_MISSING on "Company Name" reads "Missing required field 'Company Name': 5 rows"
    And line item for REQUIRED_FIELD_MISSING on "Owner" reads "Missing required field 'Owner': 3 rows"
    And line item for INTRAFILE_DUPLICATE reads "Duplicate email (intra-file): 4 rows"
    And line item for EXISTING_RECORD_DUPLICATE reads "Duplicate email (existing record): 2 rows"
    And line item for ENUM_MISMATCH reads "Enum mismatch on 'Lead Status': 7 rows"
    And line item for DATE_AMBIGUOUS reads "Ambiguous date in 'Close Date': 1 rows"
```

**Test Data:**
- ImportJob ID: `job-multi-001`
- Error distribution: as per table above
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job validation is complete
- Validation errors table has 34 total records distributed as shown

---

### T-3.2: Field-specific error types use CRM field label not CSV header
**Maps to:** AC-3, AC-6
**Category:** edge-case

```gherkin
Feature: Validation Error Summary Panel

  Scenario: Error type labels use CRM field names, not raw CSV column headers
    Given an authenticated CRM Admin
    And a CSV file has a column header "company" (CSV header)
    And that column maps to the CRM field "Company Name" (CRM label)
    And 23 rows are missing a value in that column
    When the error summary panel renders
    Then the line item reads "Missing required field 'Company Name': 23 rows"
    And the label does NOT read "Missing required field 'company': 23 rows"
```

**Test Data:**
- CSV column header: `"company"`
- CRM field label: `"Company Name"`
- Rows missing value: 23
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Field mapping is recorded and the system resolves from CSV header to CRM label at error render time
- Import job validation is complete

---

### T-4.1: Intra-file duplicate counts both rows, not one pair
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Validation Error Summary Panel

  Scenario: Both rows in an intra-file duplicate pair are counted in the summary
    Given an authenticated CRM Admin
    And a CSV file contains 100 rows
    And rows 10 and 55 both have the email address "duplicate@example.com"
    And no other rows are duplicates
    When the error summary panel renders
    Then the line item reads "Duplicate email (intra-file): 2 rows"
    And the count is 2, not 1 (one pair)
```

**Test Data:**
- ImportJob ID: `job-dup-001`
- Row 10: `{ email: "duplicate@example.com", name: "Alice" }`
- Row 55: `{ email: "duplicate@example.com", name: "Bob" }`
- Total rows: 100
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- 2 validation_error records exist with `error_type = "INTRAFILE_DUPLICATE"`, one for row 10 and one for row 55

---

### T-4.2: Three-way intra-file duplicate counts all three rows
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Validation Error Summary Panel

  Scenario: All rows in a three-way duplicate are counted in the summary
    Given an authenticated CRM Admin
    And rows 5, 20, and 75 all share the email "triple@example.com"
    When the error summary panel renders
    Then the line item reads "Duplicate email (intra-file): 3 rows"
```

**Test Data:**
- Row 5, 20, 75: `{ email: "triple@example.com" }`
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- 3 validation_error records exist with `error_type = "INTRAFILE_DUPLICATE"` for this job

---

### T-5.1: Zero-error file renders green all-passed banner
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: Validation Error Summary Panel

  Scenario: All rows passed validation shows green banner with row count
    Given an authenticated CRM Admin
    And an import job "job-perfect-001" with 250 rows where all rows pass validation
    When the preview/commit screen renders
    Then no error summary panel is displayed
    And a green "All 250 rows passed validation" banner is displayed
    And the partial import checkbox is hidden or disabled
```

**Test Data:**
- ImportJob ID: `job-perfect-001`
- Total rows: 250
- Error rows: 0
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job validation is complete with 0 error records

---

### T-5.2: Single-row file with one passing row shows correct banner count
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: Validation Error Summary Panel

  Scenario: Single-row all-passing file shows correct row count in banner
    Given an authenticated CRM Admin
    And an import job with exactly 1 row that passed validation
    When the preview/commit screen renders
    Then the banner reads "All 1 rows passed validation"
    And no error panel is shown
```

**Test Data:**
- Total rows: 1
- Error rows: 0
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job validation is complete with 0 error records

---

### T-6.1: Missing required field error identifies the field by CRM label
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Validation Error Summary Panel

  Scenario: Required field error line item names the CRM field label
    Given an authenticated CRM Admin
    And 23 rows are missing a value for the CRM required field "Company Name"
    When the error summary panel renders
    Then exactly one line item reads "Missing required field 'Company Name': 23 rows"
    And the field name shown is "Company Name" (CRM label), not any CSV column header variant
```

**Test Data:**
- CRM field label: `"Company Name"`
- Rows with missing value: 23
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- 23 validation_error records with `error_type = "REQUIRED_FIELD_MISSING"` and `field_name = "Company Name"`

---

### T-6.2: Required field error with zero missing rows does not appear as a line item
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Validation Error Summary Panel

  Scenario: Error type with zero occurrences is not listed in the panel
    Given an authenticated CRM Admin
    And "Owner" is a required field with 0 missing rows
    And "Company Name" is a required field with 5 missing rows
    When the error summary panel renders
    Then no line item for "Missing required field 'Owner'" appears
    And a line item for "Missing required field 'Company Name': 5 rows" appears
```

**Test Data:**
- `"Owner"`: 0 missing rows
- `"Company Name"`: 5 missing rows
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- 5 validation_error records for `"Company Name"`, 0 for `"Owner"`

---

### T-7.1: Two distinct required field errors produce two separate line items
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Validation Error Summary Panel

  Scenario: Multiple required field errors each produce their own line item
    Given an authenticated CRM Admin
    And 23 rows are missing "Company Name"
    And 10 rows are missing "Owner"
    When the error summary panel renders
    Then two separate line items appear:
      | Line Item |
      | Missing required field 'Company Name': 23 rows |
      | Missing required field 'Owner': 10 rows |
    And they appear as separate entries, not merged into one line
```

**Test Data:**
- `"Company Name"` missing: 23 rows
- `"Owner"` missing: 10 rows
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- 23 validation_error records for `REQUIRED_FIELD_MISSING / Company Name`
- 10 validation_error records for `REQUIRED_FIELD_MISSING / Owner`

---

### T-8.1: Download full error report link triggers S3 download
**Maps to:** AC-8
**Category:** happy-path

```gherkin
Feature: Validation Error Summary Panel

  Scenario: Download error report link triggers file download when report is ready
    Given an authenticated CRM Admin
    And the error summary panel is visible for job "job-abc-001"
    And the error report S3 object has been successfully generated
    When the user clicks "Download full error report"
    Then a file download is initiated via a signed S3 URL
    And the downloaded file is named "error_report_job-abc-001.csv"
    And the response Content-Type is "text/csv"
```

**Test Data:**
- ImportJob ID: `job-abc-001`
- S3 object key: `error-reports/job-abc-001.csv`
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job has errors and error report has been generated to S3
- `error_report_s3_key` is set on the ImportJob record

---

### T-8.2: Download button shows "Generating…" while error report is not yet available
**Maps to:** AC-8
**Category:** error-handling

```gherkin
Feature: Validation Error Summary Panel

  Scenario: Download button is disabled while error report is being generated
    Given an authenticated CRM Admin
    And the error summary panel is visible for job "job-gen-001"
    And the error report S3 upload has not yet completed (report_status = "generating")
    When the user views the error summary panel
    Then the "Download full error report" button is disabled
    And the button label reads "Generating…"
    And the button becomes enabled once the S3 upload completes
```

**Test Data:**
- ImportJob ID: `job-gen-001`
- `error_report_status`: `"generating"`
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job validation is complete but S3 upload of error report is still in progress

---

### T-8.3: Validation still in progress shows spinner in summary panel
**Maps to:** AC-8, NFR (validation job not complete before preview)
**Category:** error-handling

```gherkin
Feature: Validation Error Summary Panel

  Scenario: Preview screen shows spinner when validation job has not yet completed
    Given an authenticated CRM Admin
    And an import job "job-pending-001" has been uploaded but validation is still running
    When the user navigates to the preview/commit screen for job "job-pending-001"
    Then the error summary panel area shows "Validation in progress…" with a spinner
    And no error type line items are shown yet
    And the panel updates automatically when validation completes
```

**Test Data:**
- ImportJob ID: `job-pending-001`
- Validation status: `"in_progress"`
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job exists with validation_status = `"in_progress"`

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to preview/commit screen is rejected
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Validation Error Summary Panel — Authorization

  Scenario: Unauthenticated user cannot access the validation summary endpoint
    Given no authentication token is present in the request headers
    When a GET request is made to "/imports/job-abc-001/preview"
    Then the API returns HTTP 401 Unauthorized
    And no validation summary data is included in the response body
```

**Test Data:**
- Endpoint: `GET /imports/job-abc-001/preview`
- Auth header: absent
- ImportJob ID: `job-abc-001` (exists and is complete)

**Preconditions:**
- Import job `job-abc-001` exists in the database

---

### T-AUTH-2.1: Read Only user is rejected from preview/commit screen
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Validation Error Summary Panel — Authorization

  Scenario: Read Only user cannot access the preview/commit screen or its API
    Given an authenticated user with Read Only role
    When a GET request is made to "/imports/job-abc-001/preview"
    Then the API returns HTTP 403 Forbidden
    And no validation summary data is included in the response body
    And the UI renders an access-denied message when the page is loaded
```

**Test Data:**
- Endpoint: `GET /imports/job-abc-001/preview`
- User: `{ email: "readonly@example.com", role: "Read Only", status: "active" }`
- Auth token: valid, role: Read Only

**Preconditions:**
- Import job `job-abc-001` exists and belongs to a different user

---

## Negative Tests

### T-NEG-1: Summary panel gracefully handles aggregation query timeout
**Maps to:** NFR (aggregation timeout)
**Category:** error-handling

```gherkin
Feature: Validation Error Summary Panel — Error Handling

  Scenario: Summary panel shows fallback message when aggregation query times out
    Given an authenticated CRM Admin
    And the error summary aggregation query times out for job "job-timeout-001"
    When the preview/commit screen renders
    Then the error summary panel displays "Error summary temporarily unavailable — download the full error report for details"
    And a "Download full error report" link is still visible and functional
```

**Test Data:**
- ImportJob ID: `job-timeout-001`
- Simulated aggregation timeout: query exceeds configured timeout threshold
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job is complete with errors
- Error report S3 object is available

---

### T-NEG-2: Power User sees error summary only for their own import job
**Maps to:** AC-AUTH-2 (scope enforcement)
**Category:** security

```gherkin
Feature: Validation Error Summary Panel — Authorization

  Scenario: Power User cannot access the preview screen for another user's import
    Given an authenticated Power User with user ID "user-002"
    And an import job "job-other-001" belongs to user ID "user-001"
    When the Power User makes a GET request to "/imports/job-other-001/preview"
    Then the API returns HTTP 403 Forbidden
    And no validation summary data is returned
```

**Test Data:**
- Requesting user: `{ id: "user-002", role: "Power User" }`
- ImportJob owner: `user-001`
- ImportJob ID: `job-other-001`

**Preconditions:**
- Import job `job-other-001` exists with `uploader_id = "user-001"`

---

## Boundary Tests

### T-BOUND-1: Error summary panel renders within 1 second for a 50,000-row file
**Maps to:** AC-2, NFR (performance)
**Category:** performance

```gherkin
Feature: Validation Error Summary Panel — Performance

  Scenario: Error summary panel loads within 1 second p95 at 50,000 rows
    Given an authenticated CRM Admin
    And an import job with 50000 rows and 12500 validation errors spread across 5 error types
    When the preview/commit screen is loaded
    Then the error summary panel renders within 1000ms (p95)
    And all 5 error type line items are shown with accurate counts
```

**Test Data:**
- Total rows: 50000
- Error distribution: 2500 each across INVALID_EMAIL, REQUIRED_FIELD_MISSING/Company Name, INTRAFILE_DUPLICATE, ENUM_MISMATCH/Lead Status, DATE_AMBIGUOUS/Close Date
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Index on `(import_job_id, error_type)` exists in the validation errors table

---

---

# Test Specifications: ERROR-02 — Downloadable error report CSV

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path, edge-case |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1, T-5.2 | happy-path, edge-case |
| AC-6 | T-6.1 | edge-case |
| AC-7 | T-7.1 | error-handling |
| AC-8 | T-8.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Download error report link is visible on preview/commit screen when errors exist
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Downloadable Error Report

  Scenario: Download link visible on preview/commit screen when validation has errors
    Given an authenticated CRM Admin
    And an import job "job-err-001" has completed validation with 47 error rows
    And the error report CSV has been generated and stored in S3
    When the user navigates to the preview/commit screen for job "job-err-001"
    Then a "Download error report" button or link is visible within the error summary panel
    And clicking the link initiates a download without requiring additional authentication steps
```

**Test Data:**
- ImportJob ID: `job-err-001`
- Total rows: 500
- Error rows: 47
- S3 key: `error-reports/job-err-001.csv`
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job is complete with errors
- S3 object at `error-reports/job-err-001.csv` exists

---

### T-1.2: Download link text is descriptive, not generic
**Maps to:** AC-1, Accessibility NFR
**Category:** happy-path

```gherkin
Feature: Downloadable Error Report — Accessibility

  Scenario: Download link has descriptive accessible text
    Given an authenticated CRM Admin
    And the error summary panel is visible with a download link
    When the page renders
    Then the download link text reads "Download error report (CSV)"
    And the link text does not read "click here" or "download" alone
    And the link element has accessible text meeting WCAG requirements
```

**Test Data:**
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Error summary panel is visible (import job with errors exists)

---

### T-2.1: Download link is visible and functional on import history detail page
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Downloadable Error Report

  Scenario: Download error report link available on import history detail page for completed job with errors
    Given an authenticated CRM Admin
    And an import job "job-hist-001" with status "complete" has 15 error rows
    When the user navigates to the import history detail page for job "job-hist-001"
    Then a "Download error report" link is visible on the detail page
    And clicking the link downloads the same S3-stored error report generated during validation
```

**Test Data:**
- ImportJob ID: `job-hist-001`
- Job status: `"complete"`
- Error rows: 15
- S3 key: `error-reports/job-hist-001.csv`
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job exists in history with status `complete`
- S3 object for error report exists

---

### T-2.2: Download link is available for a failed import job on the history detail page
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Downloadable Error Report

  Scenario: Download link available for failed import on history detail page
    Given an authenticated CRM Admin
    And an import job "job-failed-001" with status "failed" has 200 error rows
    When the user navigates to the import history detail page for job "job-failed-001"
    Then a "Download error report" link is visible
    And clicking it initiates download of the error report CSV
```

**Test Data:**
- ImportJob ID: `job-failed-001`
- Job status: `"failed"`
- Error rows: 200
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job exists with status `"failed"` and error report generated in S3

---

### T-3.1: Error report CSV has correct column structure
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Downloadable Error Report — CSV Structure

  Scenario: Downloaded error report has correct columns in correct order
    Given an authenticated CRM Admin
    And an import job "job-struct-001" with a CSV that has source headers: "first_name", "last_name", "email", "company"
    And the job has 3 rows with validation errors
    When the user downloads the error report CSV
    Then the CSV contains exactly these columns in this order:
      | Column |
      | row_number |
      | first_name |
      | last_name |
      | email |
      | company |
      | error_codes |
      | error_descriptions |
    And the values in source columns are the original source values, not CRM field names
    And "error_codes" contains comma-separated error code strings (e.g., "INVALID_EMAIL")
    And "error_descriptions" contains comma-separated human-readable strings
```

**Test Data:**
- ImportJob ID: `job-struct-001`
- Source CSV headers: `["first_name", "last_name", "email", "company"]`
- Sample error row: `{ row_number: 5, first_name: "John", last_name: "Doe", email: "not-an-email", company: "Acme", error_codes: "INVALID_EMAIL", error_descriptions: "Invalid email format" }`
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job is complete with errors
- Field mapping stored: `first_name → First Name`, `email → Email`, etc.

---

### T-3.2: Error report row_number is 1-indexed matching source file row position
**Maps to:** AC-3
**Category:** edge-case

```gherkin
Feature: Downloadable Error Report — CSV Structure

  Scenario: Row numbers in error report are 1-indexed and match source file position
    Given an authenticated CRM Admin
    And a source CSV file where row 1 is the header and row 3 (the second data row) has an invalid email
    When the error report is downloaded
    Then the error report row for the invalid email entry has "row_number" = 3
    And "row_number" = 1 corresponds to the first data row (excluding the header row)
    And "row_number" = 2 corresponds to the second data row
```

**Test Data:**
- Source CSV row 1: header row (`first_name,email,...`)
- Source CSV row 2: `Alice,alice@example.com,...` (valid)
- Source CSV row 3: `Bob,not-an-email,...` (invalid email)
- Expected error row: `{ row_number: 3, email: "not-an-email", error_codes: "INVALID_EMAIL", ... }`
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job with 2 data rows, only row 3 has an error

---

### T-4.1: Intra-file duplicate rows appear as two separate entries with cross-references
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Downloadable Error Report — Intra-File Duplicates

  Scenario: Both duplicate rows appear in error report with cross-reference to each other
    Given an authenticated CRM Admin
    And a source CSV file with row 45 and row 102 both containing email "shared@example.com"
    When the user downloads the error report
    Then the error report contains an entry for row 45 with:
      | Field | Value |
      | row_number | 45 |
      | email | shared@example.com |
      | error_codes | INTRAFILE_DUPLICATE |
      | error_descriptions | Duplicate email (row 102) |
    And the error report contains an entry for row 102 with:
      | Field | Value |
      | row_number | 102 |
      | email | shared@example.com |
      | error_codes | INTRAFILE_DUPLICATE |
      | error_descriptions | Duplicate email (row 45) |
    And both entries appear as separate rows in the CSV
```

**Test Data:**
- Row 45: `{ email: "shared@example.com", name: "Alice Corp" }`
- Row 102: `{ email: "shared@example.com", name: "Alice Corp Ltd" }`
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- 2 validation_error records with `error_type = "INTRAFILE_DUPLICATE"`, each cross-referencing the other row

---

### T-5.1: Download is served via signed S3 URL with 15-minute expiry
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: Downloadable Error Report — S3 Signed URL

  Scenario: Download link generates a signed S3 URL with correct expiry and filename
    Given an authenticated CRM Admin
    And an import job "job-s3-001" with a generated error report
    When the user clicks the "Download error report" link
    Then the server generates a signed S3 URL for object "error-reports/job-s3-001.csv"
    And the signed URL has an expiry of 15 minutes from generation time
    And the browser is redirected to the signed URL
    And the download begins with filename "error_report_job-s3-001.csv"
    And the response Content-Type header is "text/csv"
```

**Test Data:**
- ImportJob ID: `job-s3-001`
- S3 key: `error-reports/job-s3-001.csv`
- Expected filename: `error_report_job-s3-001.csv`
- Signed URL expiry: 900 seconds (15 minutes)
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- S3 object `error-reports/job-s3-001.csv` exists
- AWS credentials for signed URL generation are available

---

### T-5.2: New signed URL is generated on each download request (not cached)
**Maps to:** AC-5, NFR (signed URL expiry)
**Category:** edge-case

```gherkin
Feature: Downloadable Error Report — S3 Signed URL

  Scenario: Each download request generates a fresh signed URL
    Given an authenticated CRM Admin
    And the user previously clicked the download link 16 minutes ago (URL now expired)
    When the user clicks the download link again
    Then a new signed S3 URL is generated with a fresh 15-minute expiry
    And the download succeeds despite the previous URL being expired
    And the URL is not cached from the previous request
```

**Test Data:**
- Time of first click: T-0 (URL expires at T+15min)
- Time of second click: T+16min (previous URL expired)
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- S3 object still exists at the time of second click
- Client-side URL caching is disabled for the download endpoint

---

### T-6.1: No download link shown when file has zero validation errors
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Downloadable Error Report

  Scenario: Download link is hidden when no validation errors exist
    Given an authenticated CRM Admin
    And an import job "job-clean-001" where all 500 rows passed validation
    When the user views the preview/commit screen
    Then no "Download error report" link or button is shown
    And a message "No errors — all rows passed validation" is displayed in its place
    When the user views the import history detail page for job "job-clean-001"
    Then no "Download error report" link or button is shown there either
```

**Test Data:**
- ImportJob ID: `job-clean-001`
- Total rows: 500
- Error rows: 0
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job is complete with 0 error records and no S3 error report generated

---

### T-7.1: Download link shows error message when S3 upload failed
**Maps to:** AC-7
**Category:** error-handling

```gherkin
Feature: Downloadable Error Report — Error Handling

  Scenario: Download link replaced with error message when error report generation failed
    Given an authenticated CRM Admin
    And an import job "job-s3fail-001" where the error report S3 upload failed
    And the import job has errors (validation errors exist)
    When the user views the preview/commit screen or history detail page
    Then the download link is replaced by the message "Error report unavailable — contact support"
    And no download is initiated when the user clicks/taps the message area
```

**Test Data:**
- ImportJob ID: `job-s3fail-001`
- `error_report_status`: `"failed"`
- Validation errors: 10 rows
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job exists with errors but `error_report_s3_key` is null and `error_report_status = "failed"`

---

### T-8.1: Row with multiple errors appears once with all error codes
**Maps to:** AC-8
**Category:** edge-case

```gherkin
Feature: Downloadable Error Report — Multi-Error Rows

  Scenario: Row with multiple validation errors appears exactly once in the error report
    Given an authenticated CRM Admin
    And row 7 in the source CSV has both an invalid email format and a missing required field "Owner"
    When the user downloads the error report
    Then row 7 appears exactly once in the error report
    And the "error_codes" column for row 7 is "INVALID_EMAIL,REQUIRED_FIELD_MISSING"
    And the "error_descriptions" column reads "Invalid email format","Missing required field: Owner"
    And row 7 does not appear as two separate rows
```

**Test Data:**
- Row 7: `{ row_number: 7, email: "bademail", owner: "", ... }`
- Expected error_codes: `"INVALID_EMAIL,REQUIRED_FIELD_MISSING"`
- Expected error_descriptions: `"Invalid email format","Missing required field: Owner"`
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- 2 validation_error records exist for row 7 with different error types
- Error report generation aggregates all errors per row into a single CSV row

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to error report download endpoint is rejected
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Downloadable Error Report — Authorization

  Scenario: Unauthenticated user cannot access the error report download endpoint
    Given no authentication token is present in the request headers
    When a GET request is made to "/imports/job-err-001/error-report"
    Then the API returns HTTP 401 Unauthorized
    And no signed S3 URL is generated
    And no file download is initiated
```

**Test Data:**
- Endpoint: `GET /imports/job-err-001/error-report`
- Auth header: absent
- ImportJob ID: `job-err-001` (exists with errors)

**Preconditions:**
- Import job `job-err-001` exists and has error report in S3

---

### T-AUTH-2.1: Read Only user is rejected from error report download endpoint
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Downloadable Error Report — Authorization

  Scenario: Read Only user cannot download the error report
    Given an authenticated user with Read Only role
    When a GET request is made to "/imports/job-err-001/error-report"
    Then the API returns HTTP 403 Forbidden
    And no signed S3 URL is generated or returned
    And the response body contains an appropriate authorization error message
```

**Test Data:**
- Endpoint: `GET /imports/job-err-001/error-report`
- User: `{ email: "readonly@example.com", role: "Read Only", status: "active" }`
- Auth token: valid, role: Read Only

**Preconditions:**
- Import job `job-err-001` exists and has error report in S3

---

## Negative Tests

### T-NEG-1: S3 object missing returns 404 with informative message
**Maps to:** NFR (S3 object missing)
**Category:** error-handling

```gherkin
Feature: Downloadable Error Report — Error Handling

  Scenario: Error report link hidden when S3 object no longer exists
    Given an authenticated CRM Admin
    And an import job "job-old-001" that completed 45 days ago
    And the S3 object for its error report has been deleted (retention window exceeded)
    When the user navigates to the history detail page for job "job-old-001"
    Then the download link is hidden
    And a message "Error report no longer available" is displayed in its place
    When the user makes a direct GET request to the download endpoint
    Then the API returns HTTP 404 with message "Error report no longer available"
```

**Test Data:**
- ImportJob ID: `job-old-001`
- S3 object: deleted
- `error_report_s3_key`: set but object does not exist in S3
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job exists but S3 object has been deleted
- S3 existence check is performed before generating signed URL

---

### T-NEG-2: Power User cannot download error report for another user's import
**Maps to:** AC-AUTH-2, Security NFR
**Category:** security

```gherkin
Feature: Downloadable Error Report — Authorization

  Scenario: Power User cannot download error report belonging to another user
    Given an authenticated Power User with user ID "user-002"
    And an import job "job-other-001" belongs to user ID "user-001"
    When the Power User makes a GET request to "/imports/job-other-001/error-report"
    Then the API returns HTTP 403 Forbidden
    And no signed S3 URL is generated
    And the authorization check occurs at the API layer before any S3 interaction
```

**Test Data:**
- Requesting user: `{ id: "user-002", role: "Power User" }`
- ImportJob owner: `user-001`
- ImportJob ID: `job-other-001`

**Preconditions:**
- Import job `job-other-001` exists with `uploader_id = "user-001"`

---

### T-NEG-3: Signed URL does not grant S3 bucket list or write permissions
**Maps to:** Security NFR
**Category:** security

```gherkin
Feature: Downloadable Error Report — Security

  Scenario: Generated signed URL is scoped to single object with read-only access
    Given an authenticated CRM Admin
    And a signed S3 URL has been generated for object "error-reports/job-err-001.csv"
    When the URL is inspected for AWS signature scope
    Then the URL grants GET access only to "error-reports/job-err-001.csv"
    And the URL does not grant s3:ListBucket permission
    And the URL does not grant s3:PutObject permission
    And the URL expires after exactly 900 seconds (15 minutes)
```

**Test Data:**
- S3 object key: `error-reports/job-err-001.csv`
- Expected permissions: `s3:GetObject` on specific key only
- Expiry: 900 seconds

**Preconditions:**
- Signed URL generation uses restricted IAM policy scoped to object-level GetObject

---

---

# Test Specifications: HIST-01 — Import history list with date-range filter

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | edge-case, boundary |
| AC-3 | T-3.1, T-3.2, T-3.3 | happy-path, edge-case |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1, T-6.2 | edge-case |
| AC-7 | T-7.1 | security |
| AC-8 | T-8.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: History list renders in reverse-chronological order with required columns
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Import History List

  Scenario: Import history renders newest-first with all required columns
    Given an authenticated CRM Admin
    And the CRM Admin has completed 3 imports with the following metadata:
      | import_job_id | created_at              | filename      | entity_type | status   | total_rows | imported_rows | skipped_rows | failed_rows |
      | job-001       | 2026-06-15T10:00:00Z   | contacts.csv  | contacts    | complete | 500        | 480           | 10           | 10          |
      | job-002       | 2026-06-14T09:00:00Z   | deals.csv     | deals       | failed   | 200        | 0             | 0            | 200         |
      | job-003       | 2026-06-13T08:00:00Z   | companies.csv | companies   | complete | 100        | 100           | 0            | 0           |
    When the user navigates to the import history page
    Then the list renders 3 rows in this order: job-001, job-002, job-003 (newest first)
    And each row displays: date/time in user's locale, filename, entity type, status, total rows, imported rows, skipped rows, failed rows
    And "job-001" appears in the first row with all its metadata values
```

**Test Data:**
- CRM Admin: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`
- Imports as per table above

**Preconditions:**
- 3 ImportJob records exist as described, all owned by or visible to the CRM Admin

---

### T-1.2: History list date/time is formatted in user's locale
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Import History List

  Scenario: Date/time column formatted according to user's locale setting
    Given an authenticated CRM Admin with locale "en-US"
    And an import with "created_at" = "2026-06-15T14:30:00Z"
    When the history list renders
    Then the date/time column for that import shows a value equivalent to "6/15/2026, 2:30 PM" (en-US locale format)
    And the raw UTC timestamp is not displayed directly
```

**Test Data:**
- User locale: `en-US`
- Import `created_at`: `"2026-06-15T14:30:00Z"` (UTC)
- Expected display: `"6/15/2026, 2:30 PM"` or equivalent locale-formatted string

**Preconditions:**
- User locale preference is stored and accessible to the frontend

---

### T-2.1: History list is capped at 100 entries with informational note
**Maps to:** AC-2
**Category:** edge-case

```gherkin
Feature: Import History List

  Scenario: List is capped at 100 most recent imports with a note
    Given an authenticated CRM Admin
    And the admin has completed 150 imports over the past year
    When the import history page loads with no date filter
    Then only 100 rows are displayed
    And the 100 rows are the 100 most recent imports (by created_at DESC)
    And a note "Showing 100 most recent imports" is visible on the page
    And no pagination controls (next/previous page buttons) are shown
```

**Test Data:**
- Total imports: 150
- Expected displayed rows: 100 (most recent 100)
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- 150 ImportJob records exist owned by or visible to the CRM Admin

---

### T-2.2: History list shows all entries when user has exactly 100 imports
**Maps to:** AC-2
**Category:** boundary

```gherkin
Feature: Import History List

  Scenario: User with exactly 100 imports sees all imports with no truncation note
    Given an authenticated CRM Admin
    And the admin has completed exactly 100 imports
    When the import history page loads
    Then all 100 rows are displayed
    And no "Showing 100 most recent imports" truncation note is shown
    And no pagination controls are shown
```

**Test Data:**
- Total imports: 100
- Expected displayed rows: 100 (all)
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Exactly 100 ImportJob records exist

---

### T-3.1: Last 7 days filter narrows list to recent imports
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Import History List — Date Filter

  Scenario: "Last 7 days" filter shows only imports within the past 7 calendar days
    Given an authenticated CRM Admin
    And the current date is 2026-06-15
    And imports exist on these dates:
      | import_job_id | created_at              |
      | job-recent-1  | 2026-06-14T10:00:00Z   |
      | job-recent-2  | 2026-06-09T08:00:00Z   |
      | job-old-1     | 2026-06-07T10:00:00Z   |
      | job-old-2     | 2026-05-01T12:00:00Z   |
    When the user selects "Last 7 days" from the date-range filter
    Then only job-recent-1 and job-recent-2 appear in the list (within last 7 calendar days)
    And job-old-1 and job-old-2 are not displayed
    And the 100-entry cap applies within the filtered result set
```

**Test Data:**
- Current date: `2026-06-15` (user's local time)
- Last 7 days window: `2026-06-08T00:00:00` to `2026-06-15T23:59:59` (user's local time)
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- 4 ImportJob records as described above

---

### T-3.2: "Last 30 days" filter shows imports within 30 calendar days
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Import History List — Date Filter

  Scenario: "Last 30 days" filter shows only imports within the past 30 calendar days
    Given an authenticated CRM Admin
    And the current date is 2026-06-15
    And imports exist on dates: 2026-06-10, 2026-05-20, 2026-04-30
    When the user selects "Last 30 days" from the date-range filter
    Then only imports from 2026-05-16 onward are displayed
    And the import from 2026-04-30 is not shown
```

**Test Data:**
- Current date: `2026-06-15`
- Last 30 days window: `2026-05-16T00:00:00` to `2026-06-15T23:59:59` (user's local time)
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- 3 ImportJob records with dates as specified

---

### T-3.3: "All time" filter returns to default 100-entry unfiltered view
**Maps to:** AC-3
**Category:** edge-case

```gherkin
Feature: Import History List — Date Filter

  Scenario: Selecting "All time" resets the list to the default 100-entry view
    Given an authenticated CRM Admin
    And the user previously selected "Last 7 days" and saw 5 imports
    When the user selects "All time" from the date-range filter
    Then the list resets to the default view showing up to 100 most recent imports
    And all imports regardless of date are eligible to appear (up to the 100-entry cap)
```

**Test Data:**
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`
- Total imports: 150 (so cap of 100 will apply)

**Preconditions:**
- Multiple imports spread across different date ranges exist

---

### T-4.1: Clicking a history row navigates to the import detail page
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Import History List — Row Navigation

  Scenario: Clicking a history row navigates to the detail page for that import
    Given an authenticated CRM Admin
    And the import history list is rendered showing job "job-detail-001"
    When the user clicks on the row for job "job-detail-001"
    Then the user is navigated to the import detail page for job "job-detail-001"
    And the detail page displays: date/time, filename, entity type, status, total rows, imported rows, skipped rows, failed rows
    And a "Download error report" link is visible on the detail page (because errors exist for this job)
```

**Test Data:**
- ImportJob ID: `job-detail-001`
- Job has 12 error rows
- S3 error report exists for this job
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job exists and is visible in the history list
- Error report is available in S3

---

### T-5.1: Each status value has distinct visual treatment
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: Import History List — Status Display

  Scenario: Import statuses are visually distinct with label and color or icon
    Given an authenticated CRM Admin
    And the history list contains imports with all four statuses: complete, failed, processing, undone
    When the history list renders
    Then the "complete" status is displayed with a green visual treatment
    And the "failed" status is displayed with a red visual treatment
    And the "processing" status is displayed with a blue visual treatment and a spinner icon
    And the "undone" status is displayed with a grey/strikethrough visual treatment
    And each status has an accessible text label (not relying on color alone)
    And each status has an aria-label equivalent (e.g., aria-label="Status: Complete")
```

**Test Data:**
- Import statuses: `["complete", "failed", "processing", "undone"]`
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- 4 ImportJob records exist, one per status type

---

### T-6.1: Empty state renders when user has no imports
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Import History List — Empty State

  Scenario: Empty state shown when user has no import history
    Given an authenticated Power User with no previous imports
    When the user navigates to the import history page
    Then the list area shows "No imports found"
    And a call-to-action link to start a new import is displayed
    And no table rows or error messages are shown
```

**Test Data:**
- User: `{ email: "newuser@example.com", role: "Power User", status: "active" }`
- Import history: empty

**Preconditions:**
- 0 ImportJob records exist with `uploader_id = current_user.id`

---

### T-6.2: Empty state renders when date filter returns no results
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Import History List — Empty State

  Scenario: Empty state shown when date filter returns no matching imports
    Given an authenticated CRM Admin
    And the admin has imports only from 2026-05-01 (45 days ago)
    When the user selects "Last 7 days" from the date-range filter
    Then the list shows "No imports found in this date range"
    And a suggestion to select "All time" is displayed
    And a call-to-action link to start a new import is visible
```

**Test Data:**
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`
- Import dates: `2026-05-01` only (outside "Last 7 days" window as of `2026-06-15`)
- Active filter: "Last 7 days"

**Preconditions:**
- ImportJob records exist but none fall within the "Last 7 days" window

---

### T-7.1: Read Only user cannot access import history page
**Maps to:** AC-7
**Category:** security

```gherkin
Feature: Import History List — Access Control

  Scenario: Read Only user is blocked from the import history page and API
    Given an authenticated user with Read Only role
    When the user navigates to the import history page in the UI
    Then the page renders a "You don't have permission to view import history" message
    And no import records are displayed
    When the user makes a GET request to "/imports/history"
    Then the API returns HTTP 403 Forbidden
    And no import history data is included in the response body
```

**Test Data:**
- User: `{ email: "readonly@example.com", role: "Read Only", status: "active" }`
- Endpoint: `GET /imports/history`

**Preconditions:**
- Read Only user exists in the system with valid auth token

---

### T-8.1: Processing import appears in history list with live status indicator
**Maps to:** AC-8
**Category:** edge-case

```gherkin
Feature: Import History List — Processing Status

  Scenario: In-progress import shows current processing progress in the history list
    Given an authenticated CRM Admin
    And an import job "job-proc-001" is currently in status "processing"
    And the job has rows_processed = 3500 and rows_total = 10000
    When the import history list renders
    Then the row for job "job-proc-001" appears in the list
    And the status column shows "processing" with a spinner
    And the row displays current progress: "3500 / 10000"
    And clicking the row navigates to the live progress page (ASYNC-02) for polling
```

**Test Data:**
- ImportJob ID: `job-proc-001`
- Status: `"processing"`
- rows_processed: 3500
- rows_total: 10000
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`

**Preconditions:**
- Import job exists with status `"processing"` and progress fields populated

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to history list endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Import History List — Authorization

  Scenario: Unauthenticated user cannot access the import history list endpoint
    Given no authentication token is present in the request headers
    When a GET request is made to "/imports/history"
    Then the API returns HTTP 401 Unauthorized
    And no import history data is included in the response body
```

**Test Data:**
- Endpoint: `GET /imports/history`
- Auth header: absent

**Preconditions:**
- At least one ImportJob record exists in the database

---

### T-AUTH-2.1: Read Only user receives 403 from history list API
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Import History List — Authorization

  Scenario: Read Only user receives 403 with descriptive error from history API
    Given an authenticated user with Read Only role
    When a GET request is made to "GET /imports/history"
    Then the API returns HTTP 403 Forbidden
    And the response body includes a message identifying the missing permission
    And no import history records are returned
```

**Test Data:**
- Endpoint: `GET /imports/history`
- User: `{ email: "readonly@example.com", role: "Read Only", status: "active" }`
- Auth token: valid, role: Read Only

**Preconditions:**
- Read Only user exists with valid auth token

---

## Negative Tests

### T-NEG-1: History list API timeout renders graceful error message
**Maps to:** NFR (API timeout)
**Category:** error-handling

```gherkin
Feature: Import History List — Error Handling

  Scenario: History page renders error message when API times out
    Given an authenticated CRM Admin
    And the history list API call times out before returning data
    When the import history page loads
    Then the list area renders "Import history temporarily unavailable — try again shortly"
    And no partial data is shown
    And the user can retry by refreshing the page
```

**Test Data:**
- User: `{ email: "admin@example.com", role: "CRM Admin", status: "active" }`
- Simulated API timeout: response exceeds configured timeout threshold

**Preconditions:**
- API timeout is simulated (e.g., via delayed response in testing environment)

---

### T-NEG-2: Query uses index on (uploader_id, created_at) for performance
**Maps to:** NFR (performance)
**Category:** performance

```gherkin
Feature: Import History List — Performance

  Scenario: History list API responds within 500ms for date-range filtered queries
    Given an authenticated Power User
    And the user has 200 past imports spanning 6 months
    When the user selects "Last 30 days" filter
    Then the filtered list renders within 500ms p95
    And the query uses the index on "(uploader_id, created_at)" (no full table scan)
```

**Test Data:**
- User: `{ email: "power@example.com", role: "Power User", status: "active" }`
- Total imports for user: 200
- Active filter: "Last 30 days"

**Preconditions:**
- Index on `(uploader_id, created_at)` exists in the import_jobs table
- 200 ImportJob records exist for this user

---

---

# Test Specifications: HIST-02 — Role-based import history visibility

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, security |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1, T-4.2 | security |
| AC-5 | T-5.1, T-5.2 | security |
| AC-6 | T-6.1, T-6.2 | happy-path, edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Power User sees only their own imports in the history list
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Role-Based Import History Visibility

  Scenario: Power User history list contains only their own imports
    Given an authenticated Power User with user ID "user-power-001"
    And the following imports exist in the database:
      | import_job_id | uploader_id     | filename      |
      | job-mine-1    | user-power-001  | contacts.csv  |
      | job-mine-2    | user-power-001  | deals.csv     |
      | job-other-1   | user-admin-001  | companies.csv |
      | job-other-2   | user-power-002  | leads.csv     |
    When the Power User calls GET /imports/history
    Then the response contains only job-mine-1 and job-mine-2
    And job-other-1 and job-other-2 are not present in the response
    And the response contains exactly 2 records
```

**Test Data:**
- Power User ID: `user-power-001`
- User's imports: `job-mine-1`, `job-mine-2`
- Other users' imports: `job-other-1` (admin), `job-other-2` (another Power User)
- User: `{ id: "user-power-001", email: "power@example.com", role: "Power User", status: "active" }`

**Preconditions:**
- 4 ImportJob records exist as described with distinct `uploader_id` values

---

### T-1.2: Power User filter is enforced at the database query level
**Maps to:** AC-1, Security NFR
**Category:** security

```gherkin
Feature: Role-Based Import History Visibility — Defense in Depth

  Scenario: Power User visibility is enforced via WHERE clause at query level
    Given an authenticated Power User with user ID "user-power-001"
    And another user "user-power-002" has 50 imports
    When GET /imports/history is called
    Then the SQL query executed includes WHERE uploader_id = 'user-power-001'
    And the query does not fetch all records and filter them post-retrieval
    And the response contains only records where uploader_id = 'user-power-001'
```

**Test Data:**
- Power User ID: `user-power-001`
- Another user's import count: 50

**Preconditions:**
- Row-level filtering implemented at ORM/query level (not in-memory filter)

---

### T-2.1: CRM Admin sees all users' imports with uploaded_by field
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Role-Based Import History Visibility

  Scenario: CRM Admin sees all imports across all users including uploaded_by field
    Given an authenticated CRM Admin with user ID "user-admin-001"
    And the following imports exist:
      | import_job_id | uploader_id     | uploader_name | uploader_email          |
      | job-1         | user-power-001  | Alice Smith   | alice@example.com       |
      | job-2         | user-power-002  | Bob Jones     | bob@example.com         |
      | job-3         | user-admin-001  | Admin User    | admin@example.com       |
    When the CRM Admin calls GET /imports/history
    Then the response contains all 3 imports (job-1, job-2, job-3)
    And each record includes an "uploaded_by" field with the uploader's display name and email:
      | import_job_id | uploaded_by.name | uploaded_by.email |
      | job-1         | Alice Smith      | alice@example.com |
      | job-2         | Bob Jones        | bob@example.com   |
      | job-3         | Admin User       | admin@example.com |
```

**Test Data:**
- CRM Admin: `{ id: "user-admin-001", email: "admin@example.com", role: "CRM Admin" }`
- 3 ImportJob records with distinct uploaders

**Preconditions:**
- User records for `user-power-001` and `user-power-002` exist with name and email populated

---

### T-2.2: CRM Admin response includes uploaded_by field absent from Power User response
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Role-Based Import History Visibility

  Scenario: uploaded_by field is present in Admin response but absent from Power User response
    Given import job "job-shared-view" exists
    When a CRM Admin calls GET /imports/history
    Then the response records include an "uploaded_by" field for each import
    When a Power User (who owns some imports) calls GET /imports/history
    Then the response records do NOT include an "uploaded_by" field
```

**Test Data:**
- CRM Admin: `{ email: "admin@example.com", role: "CRM Admin" }`
- Power User: `{ email: "power@example.com", role: "Power User" }`

**Preconditions:**
- Both users have at least 1 import visible to them

---

### T-3.1: Read Only user receives 403 from the history list endpoint
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Role-Based Import History Visibility

  Scenario: Read Only user receives 403 Forbidden with descriptive message
    Given an authenticated user with Read Only role
    When the user calls GET /imports/history
    Then the API returns HTTP 403 Forbidden
    And the response body contains the message "You do not have permission to access import history"
    And the response contains no history data
```

**Test Data:**
- User: `{ email: "readonly@example.com", role: "Read Only", status: "active" }`
- Endpoint: `GET /imports/history`

**Preconditions:**
- Read Only user has a valid auth token

---

### T-4.1: Power User cannot access another user's import detail by direct URL
**Maps to:** AC-4
**Category:** security

```gherkin
Feature: Role-Based Import History Visibility — Direct URL Access

  Scenario: Power User is blocked from accessing another user's import detail via direct URL
    Given an authenticated Power User with user ID "user-power-001"
    And import job "job-other-001" belongs to user "user-power-002"
    When the Power User calls GET /imports/job-other-001
    Then the API returns HTTP 403 Forbidden (not 404)
    And the response body contains an access-denied message
    And when the user navigates to the import detail URL in the browser
    Then the page renders an access-denied message
```

**Test Data:**
- Requesting user: `{ id: "user-power-001", role: "Power User" }`
- ImportJob owner: `user-power-002`
- ImportJob ID: `job-other-001`

**Preconditions:**
- Import job `job-other-001` exists with `uploader_id = "user-power-002"`
- The API returns 403, not 404 (to avoid leaking resource existence)

---

### T-4.2: CRM Admin can access any user's import detail by direct URL
**Maps to:** AC-4 (inverse — admin should succeed)
**Category:** security

```gherkin
Feature: Role-Based Import History Visibility — Direct URL Access

  Scenario: CRM Admin can access any user's import detail page
    Given an authenticated CRM Admin with user ID "user-admin-001"
    And import job "job-power-001" belongs to Power User "user-power-001"
    When the CRM Admin calls GET /imports/job-power-001
    Then the API returns HTTP 200 OK
    And the response contains the full import detail for job-power-001
    And the response includes an "uploaded_by" field with the Power User's name and email
```

**Test Data:**
- CRM Admin: `{ id: "user-admin-001", role: "CRM Admin" }`
- ImportJob owner: `user-power-001`
- ImportJob ID: `job-power-001`

**Preconditions:**
- Import job `job-power-001` exists with `uploader_id = "user-power-001"`

---

### T-5.1: Power User cannot bypass visibility via query parameter manipulation
**Maps to:** AC-5
**Category:** security

```gherkin
Feature: Role-Based Import History Visibility — Query Parameter Bypass

  Scenario: Power User query parameter ?all=true is silently ignored
    Given an authenticated Power User with user ID "user-power-001"
    And another user "user-power-002" has 10 imports
    When the Power User calls GET /imports/history?all=true
    Then the API returns HTTP 200 OK (no 400 error)
    And the response contains only the Power User's own imports
    And the "all=true" parameter is silently ignored
    And no other user's imports are included in the response
```

**Test Data:**
- Requesting user: `{ id: "user-power-001", role: "Power User" }`
- Other user's imports: 10 records for `user-power-002`
- Query string: `?all=true`

**Preconditions:**
- `user-power-002` has 10 ImportJob records
- `user-power-001` has at least 1 ImportJob record

---

### T-5.2: Power User cannot bypass visibility via uploader_id query parameter
**Maps to:** AC-5
**Category:** security

```gherkin
Feature: Role-Based Import History Visibility — Query Parameter Bypass

  Scenario: Power User query parameter ?uploader_id=other_user_id is silently ignored
    Given an authenticated Power User with user ID "user-power-001"
    And user "user-power-002" has 5 imports
    When the Power User calls GET /imports/history?uploader_id=user-power-002
    Then the API returns HTTP 200 OK (no 400 error)
    And the response contains only imports where uploader_id = "user-power-001"
    And the "uploader_id=user-power-002" parameter is silently ignored
    And no imports belonging to "user-power-002" are returned
```

**Test Data:**
- Requesting user: `{ id: "user-power-001", role: "Power User" }`
- Queried user: `user-power-002`
- Query string: `?uploader_id=user-power-002`

**Preconditions:**
- `user-power-002` has 5 ImportJob records

---

### T-6.1: CRM Admin sees "Uploaded by" column in history list UI
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: Role-Based Import History Visibility — UI Column Visibility

  Scenario: CRM Admin history list includes "Uploaded by" column
    Given an authenticated CRM Admin
    When the import history list renders in the UI
    Then a column labeled "Uploaded by" is visible in the table header
    And each row in the list shows the uploader's name and email in that column
```

**Test Data:**
- CRM Admin: `{ email: "admin@example.com", role: "CRM Admin" }`
- Import row: `{ imported_by_name: "Alice Smith", imported_by_email: "alice@example.com" }`

**Preconditions:**
- CRM Admin has at least one import record visible (from any user)

---

### T-6.2: Power User history list does NOT show "Uploaded by" column
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Role-Based Import History Visibility — UI Column Visibility

  Scenario: Power User history list does not include "Uploaded by" column
    Given an authenticated Power User
    When the import history list renders in the UI
    Then no column labeled "Uploaded by" is visible in the table header
    And no uploader name or email data is shown in any row
```

**Test Data:**
- Power User: `{ email: "power@example.com", role: "Power User" }`

**Preconditions:**
- Power User has at least 1 import record visible

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to history or detail endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Role-Based Import History Visibility — Authorization

  Scenario: Unauthenticated user cannot access history list or import detail
    Given no authentication token is present in the request headers
    When a GET request is made to "/imports/history"
    Then the API returns HTTP 401 Unauthorized
    And no history data is returned
    When a GET request is made to "/imports/job-001"
    Then the API returns HTTP 401 Unauthorized
    And no import detail data is returned
```

**Test Data:**
- Endpoints: `GET /imports/history`, `GET /imports/job-001`
- Auth header: absent

**Preconditions:**
- At least one ImportJob record exists in the database

---

### T-AUTH-2.1: Read Only user receives 403 from all import history endpoints
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Role-Based Import History Visibility — Authorization

  Scenario: Read Only user is rejected from all import history endpoints with descriptive 403
    Given an authenticated user with Read Only role
    When a GET request is made to "/imports/history"
    Then the API returns HTTP 403 Forbidden
    And the response body identifies the missing permission
    When a GET request is made to "/imports/job-001"
    Then the API returns HTTP 403 Forbidden
    And the response body identifies the missing permission
    And no import data is returned in either response
```

**Test Data:**
- User: `{ email: "readonly@example.com", role: "Read Only", status: "active" }`
- Endpoints: `GET /imports/history`, `GET /imports/job-001`

**Preconditions:**
- Read Only user has valid auth token
- At least one ImportJob exists in the database

---

## Negative Tests

### T-NEG-1: Role check timeout defaults to 403 as safe fallback
**Maps to:** NFR (role check indeterminate)
**Category:** error-handling

```gherkin
Feature: Role-Based Import History Visibility — Error Handling

  Scenario: Auth service timeout causes API to return 403 as a safe default
    Given an authenticated user whose role cannot be determined due to auth service timeout
    When a GET request is made to "/imports/history"
    Then the API returns HTTP 403 Forbidden
    And no import history data is returned
    And the timeout event is logged with user_id and timestamp
```

**Test Data:**
- User: `{ email: "power@example.com" }`
- Auth service: simulated timeout before role is resolved

**Preconditions:**
- Auth service timeout is simulated in the test environment
- Fail-secure behavior is implemented (deny on error, not allow)

---

### T-NEG-2: 403 responses are audit-logged with required fields
**Maps to:** Security NFR (audit logging)
**Category:** security

```gherkin
Feature: Role-Based Import History Visibility — Audit Logging

  Scenario: 403 response on history endpoint is logged with required audit fields
    Given an authenticated Power User with user ID "user-power-001"
    And import job "job-other-001" belongs to "user-power-002"
    When the Power User calls GET /imports/job-other-001 and receives 403
    Then an audit log entry is created containing:
      | Field               | Value                    |
      | user_id             | user-power-001           |
      | requested_resource  | /imports/job-other-001   |
      | timestamp           | (current UTC timestamp)  |
      | outcome             | 403                      |
    And no import data is included in the audit log entry (only metadata)
```

**Test Data:**
- Requesting user: `{ id: "user-power-001", role: "Power User" }`
- Target resource: `/imports/job-other-001`

**Preconditions:**
- Audit logging is enabled for 403 responses on history endpoints
- Log destination (e.g., audit log table or log aggregator) is available

---

### T-NEG-3: Power User with no imports sees empty state, not another user's data
**Maps to:** AC-1, AC-3
**Category:** security

```gherkin
Feature: Role-Based Import History Visibility — Empty State Under Authorization

  Scenario: New Power User with zero imports sees empty state, not other users' imports
    Given an authenticated Power User with user ID "user-new-001" who has no imports
    And other users have a total of 500 imports in the database
    When the Power User calls GET /imports/history
    Then the API returns HTTP 200 OK with an empty results list
    And the response contains zero ImportJob records
    And none of the 500 other users' imports are visible
```

**Test Data:**
- New Power User: `{ id: "user-new-001", role: "Power User", status: "active" }`
- Total imports in DB: 500 (all belonging to other users)

**Preconditions:**
- 0 ImportJob records with `uploader_id = "user-new-001"`
- 500 ImportJob records belonging to other users


# Test Specifications: UNDO-01 — Soft-delete undo with 48-hour window

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | edge-case |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1, T-4.2 | edge-case |
| AC-5 | T-5.1, T-5.2 | happy-path |
| AC-6 | T-6.1 | security |
| AC-7 | T-7.1, T-7.2, T-7.3 | edge-case |
| AC-8 | T-8.1 | error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Undo button is visible on history row for Admin within 48-hour window
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Undo import within 48-hour window

  Scenario: CRM Admin sees Undo button on history row for recently completed import
    Given an authenticated CRM Admin with credentials { email: "admin@corp.com", role: "crm_admin" }
    And an ImportJob exists with:
      | import_job_id | status   | completed_at              | filename          |
      | job-001       | complete | [now minus 2 hours]       | contacts-may.csv  |
    When the admin navigates to the import history page
    Then the row for import job-001 displays an "Undo" button
    And the "Undo" button is enabled (not disabled)
    And the button has aria-label "Undo import contacts-may.csv from [formatted date]"
```

**Test Data:**
- `import_job_id`: `job-001`
- `status`: `complete`
- `completed_at`: current UTC time minus 2 hours (well within 48-hour window)
- `filename`: `contacts-may.csv`
- Admin user: `{ email: "admin@corp.com", role: "crm_admin", status: "active" }`

**Preconditions:**
- Database contains ImportJob `job-001` with status `complete` and `completed_at` 2 hours ago
- Admin is authenticated with a valid session token

---

### T-1.2: Undo button is visible on import detail page for Admin within 48-hour window
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Undo import within 48-hour window

  Scenario: CRM Admin sees Undo button on import detail page for recently completed import
    Given an authenticated CRM Admin with credentials { email: "admin@corp.com", role: "crm_admin" }
    And an ImportJob with id "job-002", status "complete", completed 23 hours ago
    When the admin navigates to the detail page for import "job-002"
    Then the detail page displays an "Undo" button
    And the "Undo" button is enabled
    And the button has aria-label "Undo import [filename] from [date]"
```

**Test Data:**
- `import_job_id`: `job-002`
- `completed_at`: current UTC time minus 23 hours (just inside 48-hour window)

**Preconditions:**
- ImportJob `job-002` exists with status `complete`, `completed_at` 23 hours ago
- Admin has a valid session

---

### T-2.1: Undo button is hidden after 48-hour window expires
**Maps to:** AC-2
**Category:** edge-case

```gherkin
Feature: Undo window expiry

  Scenario: Undo button not shown for import completed more than 48 hours ago
    Given an authenticated CRM Admin
    And an ImportJob with id "job-003", status "complete", completed_at 49 hours ago
    When the admin views the import history entry for "job-003"
    Then the "Undo" button is not present in the DOM for that row
    And no undo affordance is rendered on the import detail page for "job-003"
```

**Test Data:**
- `import_job_id`: `job-003`
- `completed_at`: current UTC time minus 49 hours (outside window)

**Preconditions:**
- ImportJob `job-003` exists with `completed_at` 49 hours ago

---

### T-2.2: Server rejects undo POST when 48-hour window has expired (stale UI path)
**Maps to:** AC-2, AC-6
**Category:** edge-case / security

```gherkin
Feature: Undo window server enforcement

  Scenario: Stale client sends undo request after window expiry
    Given an authenticated CRM Admin
    And an ImportJob with id "job-003", status "complete", completed_at 49 hours ago
    When a POST request is made to "/imports/job-003/undo" with a valid Admin auth token
    Then the response status is 409 Conflict
    And the response body contains { "error": "Undo window has expired for this import" }
    And no records are soft-deleted
```

**Test Data:**
- `import_job_id`: `job-003`
- Auth token: valid CRM Admin JWT
- `completed_at`: 49 hours before request time

**Preconditions:**
- ImportJob `job-003` has `completed_at` 49 hours ago and status `complete`
- No soft-delete operations have been started for this job

---

### T-3.1: Undo soft-deletes all unmodified imported records
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Undo soft-deletes imported records

  Scenario: All imported records are marked deleted=true after undo
    Given an authenticated CRM Admin
    And an ImportJob "job-010" completed 1 hour ago with status "complete"
    And 300 contact records exist with import_job_id "job-010" and updated_at equal to import_job.completed_at
    And the admin has confirmed the undo action via the UNDO-02 modal
    When the undo executes for "job-010"
    Then all 300 records with import_job_id "job-010" have deleted = true
    And a query to the contacts list endpoint returns 0 of those 300 records
    And a search of those records' emails returns no results
```

**Test Data:**
- `import_job_id`: `job-010`
- Records: 300 contacts, `updated_at` = `import_job.completed_at` (not modified after import)
- Sample record: `{ id: "rec-001", email: "contact1@test.com", import_job_id: "job-010", deleted: false, updated_at: "2026-06-15T10:00:00Z" }`

**Preconditions:**
- 300 records in the `contacts` table with `import_job_id = "job-010"` and `deleted = false`
- ImportJob `job-010` has `completed_at = "2026-06-15T10:00:00Z"`
- Admin has confirmed undo via modal (UNDO-02 flow completed)

---

### T-3.2: Soft-deleted records do not appear in any normal CRM query
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Soft-deleted records hidden from normal queries

  Scenario: Soft-deleted records are excluded from list, filter, and search results
    Given 100 contacts were imported under job "job-011" and then soft-deleted by undo
    When an authenticated CRM user queries the contacts list
    And a CRM user searches by email "importeduser@example.com" (one of the soft-deleted records)
    And a CRM user applies a filter returning all contacts
    Then none of the 100 soft-deleted records appear in any query result
    And the record with id "rec-deleted-001" is not retrievable via GET /contacts/rec-deleted-001 (returns 404)
```

**Test Data:**
- 100 contacts with `deleted = true`, `import_job_id = "job-011"`
- Sample soft-deleted record: `{ id: "rec-deleted-001", email: "importeduser@example.com", deleted: true }`

**Preconditions:**
- Undo has already completed for `job-011`
- All 100 records have `deleted = true` in the database

---

### T-4.1: Records modified after import are skipped during undo
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Modified records skipped during undo

  Scenario: Undo skips records modified after import and soft-deletes only unmodified records
    Given an ImportJob "job-020" completed at "2026-06-14T09:00:00Z" with 500 records
    And 30 of those records have updated_at "2026-06-14T12:00:00Z" (after completed_at)
    And 470 of those records have updated_at "2026-06-14T09:00:00Z" (equal to completed_at)
    And a CRM Admin has confirmed undo for "job-020"
    When the undo executes for "job-020"
    Then exactly 470 records have deleted = true
    And exactly 30 records remain with deleted = false and are accessible via normal CRM queries
    And the undo response summary shows { "records_deleted": 470, "records_skipped": 30 }
```

**Test Data:**
- `import_job_id`: `job-020`
- `import_job.completed_at`: `"2026-06-14T09:00:00Z"`
- Unmodified records (470): `updated_at = "2026-06-14T09:00:00Z"`
- Modified records (30): `updated_at = "2026-06-14T12:00:00Z"`

**Preconditions:**
- ImportJob `job-020` has 500 records, 30 of which have been edited after import
- Admin has confirmed undo

---

### T-4.2: Modified records remain fully accessible after undo
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Skipped modified records remain live

  Scenario: Records edited after import remain in CRM after undo completes
    Given an ImportJob "job-020" with 500 records, 30 modified after import
    And undo has completed for "job-020"
    When a CRM user queries the contacts list
    Then the 30 modified records appear in query results with deleted = false
    And the field values on those 30 records reflect the edits made after import (not rolled back)
```

**Test Data:**
- 30 modified records with IDs `rec-mod-001` through `rec-mod-030`
- Each has a field edit, e.g., `{ phone: "555-9999" }` applied after import

**Preconditions:**
- Undo completed for `job-020`; 470 records are `deleted = true`; 30 remain `deleted = false`

---

### T-5.1: ImportJob status is `undone` after successful undo
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: ImportJob status update after undo

  Scenario: ImportJob record reflects undone status after undo completes
    Given an ImportJob "job-030" with status "complete" and completed_at within 48 hours
    And undo has successfully executed for "job-030"
    When a GET request is made to "/imports/job-030"
    Then the response contains { "status": "undone", "undone_at": "[non-null ISO timestamp]" }
    And "undone_at" is within 60 seconds of the current time
```

**Test Data:**
- `import_job_id`: `job-030`
- Pre-undo status: `complete`
- Expected post-undo status: `undone`

**Preconditions:**
- Undo executed successfully for `job-030`

---

### T-5.2: Undo button no longer appears after ImportJob is marked undone
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: Undo button removed after undo completes

  Scenario: Undo button absent for import with status undone
    Given an ImportJob "job-030" with status "undone"
    When an authenticated CRM Admin views the history entry for "job-030"
    Then the "Undo" button is not present for that row
    And the import status label shows "Undone"
```

**Test Data:**
- `import_job_id`: `job-030`, `status`: `undone`

**Preconditions:**
- ImportJob `job-030` has status `undone`

---

### T-6.1: Server rejects undo POST after 48-hour window (direct API call)
**Maps to:** AC-6
**Category:** security

```gherkin
Feature: Server-side 48-hour window enforcement

  Scenario: Direct API undo request rejected after window expires
    Given an authenticated CRM Admin
    And an ImportJob "job-040" with status "complete" and completed_at 50 hours ago
    When a POST request is made directly to "/imports/job-040/undo" with a valid Admin auth token
    Then the response status is 409 Conflict
    And the response body is:
      {
        "error": "Undo window has expired for this import — undo is only available within 48 hours of import completion"
      }
    And no soft-delete operations are performed for any records with import_job_id "job-040"
```

**Test Data:**
- `import_job_id`: `job-040`
- `completed_at`: 50 hours before request time
- Admin token: valid JWT for `{ email: "admin@corp.com", role: "crm_admin" }`

**Preconditions:**
- ImportJob `job-040` exists with `completed_at` 50 hours ago and `status = "complete"`
- Records associated with `job-040` have `deleted = false` (none pre-deleted)

---

### T-7.1: Undo rejected for import with status `failed`
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Undo only available for complete imports

  Scenario: Undo endpoint returns 409 for import with status failed
    Given an authenticated CRM Admin
    And an ImportJob "job-050" with status "failed" and completed_at within 48 hours
    When a POST request is made to "/imports/job-050/undo" with a valid Admin auth token
    Then the response status is 409 Conflict
    And the response body contains { "error": "Cannot undo import with status: failed" }
    And no soft-delete operations are performed
```

**Test Data:**
- `import_job_id`: `job-050`, `status`: `failed`

**Preconditions:**
- ImportJob `job-050` has `status = "failed"`

---

### T-7.2: Undo rejected for import with status `processing`
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Undo only available for complete imports

  Scenario: Undo endpoint returns 409 for import with status processing
    Given an authenticated CRM Admin
    And an ImportJob "job-051" with status "processing"
    When a POST request is made to "/imports/job-051/undo"
    Then the response status is 409 Conflict
    And the response body contains { "error": "Cannot undo import with status: processing" }
    And no soft-delete operations are performed
```

**Test Data:**
- `import_job_id`: `job-051`, `status`: `processing`

---

### T-7.3: Undo rejected for import with status `undone`
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Undo only available for complete imports

  Scenario: Undo endpoint returns 409 for import already in undone status
    Given an authenticated CRM Admin
    And an ImportJob "job-052" with status "undone"
    When a POST request is made to "/imports/job-052/undo"
    Then the response status is 409 Conflict
    And the response body contains { "error": "Cannot undo import with status: undone" }
    And no further soft-delete operations are performed
```

**Test Data:**
- `import_job_id`: `job-052`, `status`: `undone`

---

## Error-Handling Tests

### T-8.1: Database failure mid-undo triggers full rollback
**Maps to:** AC-8
**Category:** error-handling

```gherkin
Feature: Transactional undo with rollback on failure

  Scenario: Partial database failure during undo rolls back all soft-deletes
    Given an ImportJob "job-060" with 500 unmodified records
    And undo has started and soft-deleted 200 of the 500 records
    When a database error occurs (simulated connection loss) after the 200th soft-delete
    Then all 200 previously soft-deleted records are restored to deleted = false
    And the ImportJob "job-060" status remains "complete"
    And a subsequent GET /imports/job-060/records returns all 500 records with deleted = false
    And a retry of the undo POST is accepted (not rejected as duplicate)
```

**Test Data:**
- `import_job_id`: `job-060`
- 500 records, all with `updated_at = import_job.completed_at`
- Fault injection: DB error after 200th UPDATE statement

**Preconditions:**
- ImportJob `job-060` has 500 records and `status = "complete"`
- Test environment supports fault injection at the DB layer

---

## Negative / Boundary Tests

### T-AUTH-1.1: Unauthenticated POST to undo endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Undo endpoint authentication

  Scenario: Undo request with no auth token is rejected with 401
    Given no authentication token is present in the request
    And an ImportJob "job-070" with status "complete" exists within the undo window
    When a POST request is made to "/imports/job-070/undo" without an Authorization header
    Then the response status is 401 Unauthorized
    And the response body contains { "error": "Authentication required" }
    And no soft-delete operations are performed
```

**Test Data:**
- Request: POST `/imports/job-070/undo`, no `Authorization` header
- ImportJob `job-070`: `status = "complete"`, `completed_at` 1 hour ago

**Preconditions:**
- ImportJob `job-070` is eligible for undo
- Request is made without any auth credentials

---

### T-AUTH-2.1: Power User POST to undo endpoint returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Undo endpoint authorization — Power User

  Scenario: Power User attempt to undo import is rejected with 403
    Given an authenticated Power User with credentials { email: "poweruser@corp.com", role: "power_user" }
    And an ImportJob "job-070" with status "complete" within the undo window
    When a POST request is made to "/imports/job-070/undo" with the Power User's auth token
    Then the response status is 403 Forbidden
    And the response body contains { "error": "Undo is restricted to CRM Admins" }
    And no soft-delete operations are performed for any records with import_job_id "job-070"
```

**Test Data:**
- User: `{ email: "poweruser@corp.com", role: "power_user", status: "active" }`
- ImportJob `job-070`: `status = "complete"`, `completed_at` 1 hour ago

**Preconditions:**
- Power User has a valid session token
- ImportJob `job-070` has 100 records with `deleted = false`

---

### T-AUTH-2.2: Read Only user POST to undo endpoint returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Undo endpoint authorization — Read Only user

  Scenario: Read Only user attempt to undo import is rejected with 403
    Given an authenticated Read Only user with credentials { email: "readonly@corp.com", role: "read_only" }
    And an ImportJob "job-071" with status "complete" within the undo window
    When a POST request is made to "/imports/job-071/undo" with the Read Only user's auth token
    Then the response status is 403 Forbidden
    And the response body contains { "error": "Undo is restricted to CRM Admins" }
    And no records are soft-deleted
```

**Test Data:**
- User: `{ email: "readonly@corp.com", role: "read_only", status: "active" }`

**Preconditions:**
- Read Only user has a valid session token

---

# Test Specifications: UNDO-02 — Undo confirmation screen with modified-record count

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1 | edge-case |
| AC-6 | T-6.1, T-6.2 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Confirmation modal displays all three counts correctly
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Undo confirmation modal counts

  Scenario: Confirmation modal renders three accurate record counts
    Given an authenticated CRM Admin
    And an ImportJob "job-100" completed 3 hours ago with status "complete"
    And the import created 1,000 contact records
    And 75 of those records have been edited since import (updated_at > import_job.completed_at)
    When the admin clicks the "Undo" button for import "job-100"
    Then a confirmation modal appears
    And the modal displays "Total records from this import: 1,000"
    And the modal displays "Records edited since import (will be skipped): 75"
    And the modal displays "Records that will be soft-deleted: 925"
```

**Test Data:**
- `import_job_id`: `job-100`
- `total_records`: 1000
- `modified_records`: 75 (with `updated_at` after `import_job.completed_at`)
- `records_to_delete`: 925

**Preconditions:**
- ImportJob `job-100` exists with `status = "complete"`, `completed_at` 3 hours ago
- 1000 records in DB with `import_job_id = "job-100"`, 75 of which have `updated_at > completed_at`
- Admin has a valid session

---

### T-1.2: Confirmation modal count API returns correct payload
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Confirmation count endpoint

  Scenario: Count endpoint returns correct totals for confirmation modal
    Given an authenticated CRM Admin
    And an ImportJob "job-100" with 1,000 records, 75 modified after import
    When a GET request is made to "/imports/job-100/undo-preview" with a valid Admin auth token
    Then the response status is 200 OK
    And the response body contains:
      {
        "total_records": 1000,
        "modified_records": 75,
        "records_to_delete": 925
      }
```

**Test Data:**
- Endpoint: `GET /imports/job-100/undo-preview`
- Admin token: valid JWT

**Preconditions:**
- Same as T-1.1

---

### T-2.1: Clicking Cancel closes modal with no undo initiated
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Confirmation modal cancel action

  Scenario: Admin cancels undo — no operation is triggered
    Given an authenticated CRM Admin
    And the undo confirmation modal is open for import "job-100"
    When the admin clicks the "Cancel" button
    Then the modal closes
    And no POST request is made to "/imports/job-100/undo"
    And the ImportJob "job-100" status remains "complete"
    And all 1,000 records with import_job_id "job-100" remain with deleted = false
```

**Test Data:**
- `import_job_id`: `job-100`, pre-cancel status: `complete`

**Preconditions:**
- Modal is open; no undo has been dispatched yet

---

### T-2.2: Clicking Confirm Undo dispatches the undo operation
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Confirmation modal confirm action

  Scenario: Admin confirms undo — undo operation is dispatched
    Given an authenticated CRM Admin
    And the undo confirmation modal is open for import "job-110" (300 records, 0 modified)
    When the admin clicks the "Confirm Undo" button
    Then a POST request is made to "/imports/job-110/undo"
    And the modal closes
    And for a ≤ 500 record import: the response is 200 OK and undo completes synchronously
    And for a > 500 record import: the response is 202 Accepted and undo runs asynchronously
```

**Test Data:**
- `import_job_id`: `job-110`, `total_records`: 300 (sync path)

**Preconditions:**
- Modal is open with counts: total=300, modified=0, to_delete=300

---

### T-3.1: Skipped count reflects records edited after import
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Skipped record count reflects post-import edits

  Scenario: Modal accurately counts and skips records edited after import
    Given an ImportJob "job-120" created 1,000 records at completed_at "2026-06-14T08:00:00Z"
    And 75 records have updated_at "2026-06-14T14:00:00Z" (after completed_at)
    And 925 records have updated_at "2026-06-14T08:00:00Z" (equal to completed_at)
    When a CRM Admin opens the undo confirmation modal for "job-120"
    Then the modal shows "Records edited since import (will be skipped): 75"
    And the modal shows "Records that will be soft-deleted: 925"
    When the admin confirms undo
    Then 925 records are soft-deleted
    And the 75 modified records remain with deleted = false and updated_at "2026-06-14T14:00:00Z"
    And the 75 records are accessible via normal CRM list and search queries
```

**Test Data:**
- `import_job_id`: `job-120`
- `import_job.completed_at`: `"2026-06-14T08:00:00Z"`
- Modified records (75): `updated_at = "2026-06-14T14:00:00Z"`
- Unmodified records (925): `updated_at = "2026-06-14T08:00:00Z"`

**Preconditions:**
- 1000 records in DB with `import_job_id = "job-120"` in the described states

---

## Negative / Edge Tests

### T-4.1: Modal shows zero modified records when none were edited
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Zero modified records edge case

  Scenario: Confirmation modal handles zero modified records correctly
    Given an ImportJob "job-130" with 500 records, none edited after import
    When a CRM Admin opens the undo confirmation modal for "job-130"
    Then the modal shows "Total records from this import: 500"
    And the modal shows "Records edited since import (will be skipped): 0"
    And the modal shows "Records that will be soft-deleted: 500"
    And no warning or special styling is applied to the zero-modified count
    And the "Confirm Undo" and "Cancel" buttons are both visible and enabled
```

**Test Data:**
- `import_job_id`: `job-130`, `total_records`: 500
- All 500 records: `updated_at = import_job.completed_at`

**Preconditions:**
- 500 records exist with `import_job_id = "job-130"`, none edited after import

---

### T-5.1: Modal shows warning when all records were modified
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: All records modified edge case

  Scenario: Modal warns admin when confirming undo would delete zero records
    Given an ImportJob "job-140" with 200 records, all 200 edited after import
    When a CRM Admin opens the undo confirmation modal for "job-140"
    Then the modal shows "Records that will be soft-deleted: 0"
    And the modal displays the warning: "All records from this import have been edited — confirming undo will have no effect (0 records will be deleted)"
    And the warning element has role="alert"
    And the "Confirm Undo" button remains enabled (admin can still confirm)
    And the "Cancel" button remains visible and enabled
```

**Test Data:**
- `import_job_id`: `job-140`, `total_records`: 200
- All 200 records: `updated_at > import_job.completed_at`

**Preconditions:**
- All 200 records for `job-140` have been edited after import

---

### T-6.1: Modal shows loading spinner and count completes within 5 seconds
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Count query completes before modal renders

  Scenario: Undo preview for large import shows spinner then resolves within 5 seconds
    Given an ImportJob "job-150" with 100,000 records, 5,000 modified after import
    When a CRM Admin clicks the "Undo" button for import "job-150"
    Then the modal opens with a loading spinner immediately
    And within 5 seconds the spinner is replaced with the counts:
      | label                                        | value   |
      | Total records from this import:              | 100,000 |
      | Records edited since import (will be skipped): | 5,000  |
      | Records that will be soft-deleted:           | 95,000  |
```

**Test Data:**
- `import_job_id`: `job-150`, `total_records`: 100,000, `modified_records`: 5,000
- Index required: `(import_job_id, updated_at)` on records table

**Preconditions:**
- 100,000 records exist for `job-150`
- Database index on `(import_job_id, updated_at)` is in place
- Request is timed from click to modal render

---

### T-6.2: Modal shows error message when count query times out
**Maps to:** AC-6
**Category:** edge-case / error-handling

```gherkin
Feature: Count query timeout handling

  Scenario: Modal shows error when count query exceeds timeout
    Given an ImportJob "job-151" with 100,000 records
    And the count query is simulated to exceed the 5-second timeout
    When a CRM Admin clicks "Undo" for import "job-151"
    Then the modal initially shows a loading spinner
    And after the timeout the modal body displays: "Unable to calculate record counts — try again"
    And the "Confirm Undo" button is not rendered (admin cannot proceed without counts)
    And a "Close" or "Cancel" button is available
```

**Test Data:**
- `import_job_id`: `job-151`
- Fault injection: count query delayed beyond 5 seconds

**Preconditions:**
- Test environment supports query timeout simulation

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to count endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Undo confirmation count endpoint authentication

  Scenario: Unauthenticated request to undo preview endpoint is rejected
    Given no authentication token is present
    And an ImportJob "job-160" with status "complete" within the undo window
    When a GET request is made to "/imports/job-160/undo-preview" without an Authorization header
    Then the response status is 401 Unauthorized
    And the response body contains { "error": "Authentication required" }
    And no record count data is returned
```

**Test Data:**
- Request: GET `/imports/job-160/undo-preview`, no `Authorization` header

**Preconditions:**
- ImportJob `job-160` is eligible for undo

---

### T-AUTH-2.1: Power User request to count endpoint returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Undo confirmation count endpoint authorization — Power User

  Scenario: Power User request to undo preview endpoint is rejected with 403
    Given an authenticated Power User { email: "poweruser@corp.com", role: "power_user" }
    And an ImportJob "job-160" with status "complete" within the undo window
    When a GET request is made to "/imports/job-160/undo-preview" with the Power User's auth token
    Then the response status is 403 Forbidden
    And the response body contains { "error": "Undo is restricted to CRM Admins" }
    And the confirmation modal is not rendered in the UI
```

**Test Data:**
- User: `{ email: "poweruser@corp.com", role: "power_user" }`

**Preconditions:**
- Power User has valid session token; ImportJob `job-160` is eligible

---

### T-AUTH-2.2: Read Only user request to count endpoint returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Undo confirmation count endpoint authorization — Read Only

  Scenario: Read Only user request to undo preview endpoint is rejected with 403
    Given an authenticated Read Only user { email: "readonly@corp.com", role: "read_only" }
    And an ImportJob "job-161" with status "complete" within the undo window
    When a GET request is made to "/imports/job-161/undo-preview" with the Read Only user's auth token
    Then the response status is 403 Forbidden
    And the confirmation modal is not shown
```

**Test Data:**
- User: `{ email: "readonly@corp.com", role: "read_only" }`

**Preconditions:**
- Read Only user has a valid session token

---

# Test Specifications: UNDO-03 — Async undo processing for large imports

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1 | error-handling |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1 | edge-case |
| AC-9 | T-9.1 | error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Undo of >500-record import returns 202 and dispatches Celery task
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Async undo for large imports

  Scenario: Undo for import with more than 500 records is dispatched asynchronously
    Given an authenticated CRM Admin
    And an ImportJob "job-200" with status "complete", completed 2 hours ago, with 1,000 records
    And the admin has confirmed undo via the UNDO-02 modal
    When the "Confirm Undo" button is clicked
    Then a POST request is made to "/imports/job-200/undo"
    And the response status is 202 Accepted
    And the ImportJob "job-200" status changes to "undoing"
    And a Celery task with task type "undo_import" is enqueued for job_id "job-200"
    And the UI transitions to the undo progress view for "job-200"
```

**Test Data:**
- `import_job_id`: `job-200`
- `total_records`: 1000 (> 500 async threshold)
- Admin: `{ email: "admin@corp.com", role: "crm_admin" }`
- `completed_at`: 2 hours ago

**Preconditions:**
- ImportJob `job-200` has 1000 records with `deleted = false`
- Admin has confirmed undo via the UNDO-02 confirmation modal
- Celery broker is reachable

---

### T-1.2: Undo of ≤500-record import executes synchronously (not async)
**Maps to:** AC-1
**Category:** happy-path (boundary)

```gherkin
Feature: Sync vs async undo threshold

  Scenario: Undo for import with exactly 500 records executes synchronously
    Given an authenticated CRM Admin
    And an ImportJob "job-201" with status "complete" and exactly 500 records
    And the admin has confirmed undo
    When the POST request is made to "/imports/job-201/undo"
    Then the response status is 200 OK (synchronous completion)
    And no Celery task is enqueued
    And all 500 records have deleted = true
    And the ImportJob status is "undone"
```

**Test Data:**
- `import_job_id`: `job-201`, `total_records`: 500 (at sync threshold)

**Preconditions:**
- ImportJob `job-201` has exactly 500 records

---

### T-2.1: Undo status endpoint returns all required fields while task is running
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Async undo status endpoint fields

  Scenario: Undo status endpoint returns expected fields during active undo task
    Given an authenticated CRM Admin
    And an async undo Celery task is running for ImportJob "job-200" with 1,000 records
    And the task has processed 400 records so far (300 deleted, 100 skipped)
    When a GET request is made to "/imports/job-200/undo-status" with a valid Admin auth token
    Then the response status is 200 OK
    And the response body contains:
      {
        "status": "undoing",
        "records_processed": 400,
        "records_total": 1000,
        "records_deleted": 300,
        "records_skipped": 100,
        "estimated_seconds_remaining": [integer or null]
      }
    And all six fields are present in the response
```

**Test Data:**
- `import_job_id`: `job-200`, mid-task state: 400 of 1000 processed
- `records_deleted`: 300, `records_skipped`: 100

**Preconditions:**
- Celery undo task is in progress for `job-200`
- Task has emitted `update_state` with the above progress values

---

### T-3.1: Frontend polls every 3 seconds while status is `undoing`
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Frontend polling during async undo

  Scenario: Undo progress page polls status endpoint every 3 seconds
    Given the undo progress page is rendered for ImportJob "job-200" with status "undoing"
    When the page is active and the Celery task is running
    Then the frontend sends a GET to "/imports/job-200/undo-status" at t=0
    And sends another GET to "/imports/job-200/undo-status" at t=3 seconds
    And sends another GET to "/imports/job-200/undo-status" at t=6 seconds
    And the polling interval is consistent at 3 ± 0.5 seconds between requests
```

**Test Data:**
- Polling interval: 3 seconds
- Status observed across 3 cycles: `undoing`, `undoing`, `undoing`

**Preconditions:**
- Frontend is on the undo progress page for `job-200`
- Status API returns `{ "status": "undoing", ... }` for all three poll responses

---

### T-3.2: Frontend stops polling when status changes to `undone`
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Frontend polling stops on completion

  Scenario: Polling stops when undo status transitions to undone
    Given the undo progress page is polling for ImportJob "job-200"
    And status is "undoing" for the first two poll responses
    When the third poll response returns { "status": "undone", "records_deleted": 850, "records_skipped": 150 }
    Then no further GET requests are made to "/imports/job-200/undo-status"
    And the UI transitions to the completion summary view
```

**Test Data:**
- Poll 1 & 2: `{ "status": "undoing", ... }`
- Poll 3: `{ "status": "undone", "records_deleted": 850, "records_skipped": 150, ... }`

**Preconditions:**
- Undo progress page is active and polling

---

### T-4.1: Progress bar renders correct percentage and label
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Undo progress bar rendering

  Scenario: Progress bar correctly reflects 40% completion
    Given the undo progress page is displaying for ImportJob "job-200"
    And the latest poll response contains:
      { "status": "undoing", "records_processed": 40000, "records_total": 100000 }
    When the progress bar renders
    Then the bar fill is at 40% width
    And the visible label reads "40,000 / 100,000 records reversed"
    And the progress bar element has:
      | attribute      | value  |
      | aria-valuenow  | 40000  |
      | aria-valuemin  | 0      |
      | aria-valuemax  | 100000 |
```

**Test Data:**
- `records_processed`: 40,000
- `records_total`: 100,000
- Expected fill: 40%

**Preconditions:**
- Frontend has received the poll response with the above values

---

### T-5.1: Completion summary renders on undo status `undone`
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: Undo completion summary

  Scenario: Completion summary displayed when undo task finishes
    Given the undo progress page is polling for ImportJob "job-200"
    When a poll response returns:
      {
        "status": "undone",
        "records_deleted": 850,
        "records_skipped": 150,
        "records_total": 1000
      }
    Then polling stops
    And the progress bar renders at 100%
    And the UI displays a summary section containing:
      | field                              | value                        |
      | Records soft-deleted:              | 850                          |
      | Records skipped (edited since import): | 150                      |
    And a link to the import history entry for "job-200" is shown
    And the import history entry shows status "Undone"
    And the completion state is announced via aria-live="assertive"
```

**Test Data:**
- `records_deleted`: 850, `records_skipped`: 150, `records_total`: 1000

**Preconditions:**
- Poll response with `status = "undone"` received by frontend

---

## Error-Handling Tests

### T-6.1: Failure state rendered when Celery task fails
**Maps to:** AC-6
**Category:** error-handling

```gherkin
Feature: Undo task failure state

  Scenario: Frontend renders error state when undo task fails
    Given the undo progress page is polling for ImportJob "job-200"
    When a poll response returns { "status": "failed", ... }
    Then polling stops
    And the progress bar is replaced by an error state
    And the error message reads: "Undo failed — some records may not have been reversed. Check import history and contact support if the issue persists."
    And the error state is announced via aria-live="assertive"
    And the ImportJob history entry remains accessible for the admin to review
```

**Test Data:**
- Poll response: `{ "status": "failed", "records_processed": 500, "records_total": 1000 }`

**Preconditions:**
- Celery task has failed; status endpoint returns `failed`

---

### T-7.1: Retry of failed async undo task is idempotent
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Async undo task idempotency on retry

  Scenario: Retried Celery undo task does not double-count already soft-deleted records
    Given an ImportJob "job-210" with 1,000 records
    And a prior undo attempt soft-deleted 400 records before failing
    And those 400 records have deleted = true with undo_attempt_id "attempt-001"
    When the Celery undo task is retried for "job-210"
    Then the retried task skips the 400 already-soft-deleted records
    And soft-deletes only the remaining 600 records
    And the final records_deleted count in the undo summary is 1,000 (unique soft-deletes only)
    And no record is soft-deleted twice
```

**Test Data:**
- `import_job_id`: `job-210`, total: 1000
- Prior attempt: 400 records soft-deleted (`deleted = true`)
- Remaining: 600 records with `deleted = false`

**Preconditions:**
- Prior undo attempt partially completed and failed
- 400 records have `deleted = true`; 600 have `deleted = false`

---

### T-8.1: ETR is null when fewer than 2 update_state ticks have occurred
**Maps to:** AC-8
**Category:** edge-case

```gherkin
Feature: ETR null state during early undo progress

  Scenario: estimated_seconds_remaining is null before sufficient data exists
    Given an async undo task is running for ImportJob "job-220" with 100,000 records
    And only 1 update_state tick has occurred so far
    When a GET request is made to "/imports/job-220/undo-status"
    Then the response contains { "estimated_seconds_remaining": null }
    And the UI renders "Calculating…" in place of a time estimate
```

**Test Data:**
- `import_job_id`: `job-220`
- Task state: 1 `update_state` tick has been emitted

**Preconditions:**
- Undo task has processed one batch but has insufficient data to compute rolling average

---

### T-9.1: Undo status endpoint returns 404 for unknown job_id
**Maps to:** AC-9
**Category:** error-handling

```gherkin
Feature: Undo status 404 for unknown job

  Scenario: Status endpoint returns 404 when job_id does not exist
    Given an authenticated CRM Admin
    And no ImportJob with id "job-nonexistent" exists in the system
    When a GET request is made to "/imports/job-nonexistent/undo-status"
    Then the response status is 404 Not Found
    And the response body contains { "error": "Undo job not found" }
```

**Test Data:**
- `job_id`: `job-nonexistent` (not present in DB)
- Auth: valid CRM Admin JWT

**Preconditions:**
- No ImportJob or undo task with ID `job-nonexistent` exists

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to undo-status endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Undo status endpoint authentication

  Scenario: Unauthenticated GET to undo-status returns 401
    Given no authentication token is present
    And an async undo task is running for ImportJob "job-200"
    When a GET request is made to "/imports/job-200/undo-status" without an Authorization header
    Then the response status is 401 Unauthorized
    And the response body contains { "error": "Authentication required" }
    And no task status data is returned
```

**Test Data:**
- Request: GET `/imports/job-200/undo-status`, no `Authorization` header

**Preconditions:**
- ImportJob `job-200` has an active undo task

---

### T-AUTH-2.1: Power User request to undo-status endpoint returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Undo status endpoint authorization — Power User

  Scenario: Power User request to undo-status endpoint is rejected with 403
    Given an authenticated Power User { email: "poweruser@corp.com", role: "power_user" }
    And an async undo task is running for ImportJob "job-200"
    When a GET request is made to "/imports/job-200/undo-status" with the Power User's auth token
    Then the response status is 403 Forbidden
    And the response body contains { "error": "Undo is restricted to CRM Admins" }
    And the undo progress page is not rendered for the Power User
```

**Test Data:**
- User: `{ email: "poweruser@corp.com", role: "power_user", status: "active" }`

**Preconditions:**
- Power User has a valid session token
- Undo task is running for `job-200`

---

### T-AUTH-2.2: Read Only user request to undo-status endpoint returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Undo status endpoint authorization — Read Only

  Scenario: Read Only user request to undo-status endpoint is rejected with 403
    Given an authenticated Read Only user { email: "readonly@corp.com", role: "read_only" }
    And an async undo task is running for ImportJob "job-200"
    When a GET request is made to "/imports/job-200/undo-status" with the Read Only user's auth token
    Then the response status is 403 Forbidden
    And the undo progress page is not accessible to the Read Only user
```

**Test Data:**
- User: `{ email: "readonly@corp.com", role: "read_only" }`

**Preconditions:**
- Read Only user has a valid session token

---

## Boundary Tests

### T-BOUNDARY-1: Undo dispatch at exact 501-record threshold routes to async
**Maps to:** AC-1
**Category:** edge-case (boundary)

```gherkin
Feature: Async threshold boundary

  Scenario: Import with exactly 501 records dispatches async Celery task
    Given an ImportJob "job-230" with status "complete" and exactly 501 records
    And an authenticated CRM Admin has confirmed undo
    When the POST request is made to "/imports/job-230/undo"
    Then the response status is 202 Accepted
    And a Celery undo task is enqueued for "job-230"
    And the ImportJob status is "undoing"
```

**Test Data:**
- `import_job_id`: `job-230`, `total_records`: 501

**Preconditions:**
- ImportJob `job-230` exists with exactly 501 records

---

### T-BOUNDARY-2: Concurrent undo dispatch rejected with 409
**Maps to:** UNDO-03 NFR (concurrent request protection)
**Category:** edge-case

```gherkin
Feature: Concurrent undo prevention

  Scenario: Second undo dispatch for same import_job_id is rejected
    Given an async undo Celery task is already running for ImportJob "job-240"
    And the ImportJob status is "undoing"
    When a second POST request is made to "/imports/job-240/undo" by a CRM Admin
    Then the response status is 409 Conflict
    And the response body contains { "error": "An undo is already in progress for this import" }
    And only one Celery task is running for "job-240"
```

**Test Data:**
- `import_job_id`: `job-240`, current `status`: `undoing`

**Preconditions:**
- First undo dispatch succeeded; Celery task is running
- DB-level lock or idempotency key is active for `job-240`

---

### T-BOUNDARY-3: Celery broker unreachable returns 503
**Maps to:** UNDO-03 NFR (broker unavailable)
**Category:** error-handling

```gherkin
Feature: Celery broker unavailability handling

  Scenario: Undo dispatch returns 503 when Celery broker is unreachable
    Given an ImportJob "job-250" with status "complete" and 1,000 records
    And the Celery broker is unreachable (simulated connection failure)
    When a CRM Admin sends POST to "/imports/job-250/undo"
    Then the response status is 503 Service Unavailable
    And the response body contains { "error": "Undo service temporarily unavailable — try again in a few minutes" }
    And the ImportJob status remains "complete" (not changed to "undoing")
    And no records are soft-deleted
```

**Test Data:**
- `import_job_id`: `job-250`
- Fault injection: Celery broker connection failure

**Preconditions:**
- Celery broker is simulated as unreachable
- ImportJob `job-250` has 1000 records, all `deleted = false`


