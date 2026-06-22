# Test Specifications: BACKGROUND-IMPORTS — Background Processing for Large File Imports

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, boundary |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path, boundary |
| AC-4 | T-4.1, T-4.2, T-4.3 | happy-path |
| AC-5 | T-5.1 | edge-case |
| AC-6 | T-6.1, T-6.2 | error-handling |
| AC-7 | T-7.1 | boundary |
| AC-AUTH-1 | T-8.1 | security |
| AC-AUTH-2 | T-9.1 | security |

## Test Cases

### T-1.1: Large file automatically queued for background processing
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Background Import Processing

  Scenario: File with 5000+ rows triggers automatic background processing
    Given a user is authenticated with import permissions
    And the import queue has capacity
    When the user uploads a CSV file with 7500 rows
    Then the system queues the import as a background task
    And displays the message "Your import is processing in the background. You'll receive an email when complete."
    And the task status shows as "Queued"
```

**Test Data:**
- CSV file: `large_dataset_7500_rows.csv` with valid product data
- User: `{ email: "importer@company.com", role: "data_importer", permissions: ["import_products"] }`
- Queue status: 15 active background tasks (below 100 limit)

**Preconditions:**
- User is logged in with valid session
- Background task queue service is running
- Database has available connections

### T-1.2: Boundary test for exactly 5000 rows
**Maps to:** AC-1
**Category:** boundary

```gherkin
  Scenario: File with exactly 5000 rows triggers background processing
    Given a user is authenticated with import permissions
    And the import queue has capacity
    When the user uploads a CSV file with exactly 5000 rows
    Then the system queues the import as a background task
    And displays the background processing confirmation message
```

**Test Data:**
- CSV file: `boundary_5000_rows.csv` with exactly 5000 valid customer records
- User: `{ email: "test@company.com", role: "data_importer" }`

**Preconditions:**
- System configured with 5000 row threshold
- Background task queue is operational

### T-2.1: Medium file with user choosing background processing
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: User selects background processing for medium file
    Given a user is authenticated with import permissions
    When the user uploads a CSV file with 2500 rows
    Then the system displays processing options "Process now (may take a few minutes)" and "Process in background (receive email notification)"
    When the user selects "Process in background"
    Then the system queues the import as a background task
    And displays the background processing confirmation message
```

**Test Data:**
- CSV file: `medium_dataset_2500_rows.csv` with valid inventory data
- User: `{ email: "user@company.com", role: "data_importer", permissions: ["import_inventory"] }`

**Preconditions:**
- User has active authenticated session
- File size is within upload limits

### T-2.2: Medium file with user choosing synchronous processing
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: User selects immediate processing for medium file
    Given a user is authenticated with import permissions
    When the user uploads a CSV file with 3000 rows
    Then the system displays processing options "Process now (may take a few minutes)" and "Process in background (receive email notification)"
    When the user selects "Process now"
    Then the system begins synchronous import processing
    And displays real-time progress indicators
```

**Test Data:**
- CSV file: `medium_sync_3000_rows.csv` with customer contact data
- Expected processing time: 45-90 seconds

**Preconditions:**
- System has sufficient memory for synchronous processing
- Database connections available for immediate processing

### T-3.1: Small file processes synchronously without options
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Small file processes immediately without background option
    Given a user is authenticated with import permissions
    When the user uploads a CSV file with 500 rows
    Then the system immediately begins synchronous import processing
    And displays real-time progress without offering background queuing options
    And shows completion status within 30 seconds
```

**Test Data:**
- CSV file: `small_dataset_500_rows.csv` with supplier data
- User: `{ email: "quicktest@company.com", role: "data_importer" }`

**Preconditions:**
- System configured with 1000 row synchronous threshold
- Sufficient system resources for immediate processing

### T-3.2: Boundary test for exactly 999 rows
**Maps to:** AC-3
**Category:** boundary

```gherkin
  Scenario: File with 999 rows processes synchronously
    Given a user is authenticated with import permissions
    When the user uploads a CSV file with exactly 999 rows
    Then the system processes the import synchronously
    And does not offer background processing options
```

**Test Data:**
- CSV file: `boundary_999_rows.csv` with exactly 999 product records

**Preconditions:**
- System threshold set at 1000 rows for synchronous processing

### T-4.1: Background task status displays as queued
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Queued background task shows correct status
    Given a user has submitted a file for background processing
    And the task has been queued but not yet started
    When the user navigates to the import status page
    Then the system displays the task status as "Queued"
    And shows the submission timestamp
    And displays the original filename
```

**Test Data:**
- Background task: `{ id: "bg_task_001", filename: "large_import.csv", status: "queued", submitted_at: "2026-06-15T10:30:00Z" }`
- User session: authenticated with task view permissions

**Preconditions:**
- Background task exists in queue
- User has permission to view import status

### T-4.2: Background task status displays as processing
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Active background task shows processing status
    Given a user has a background import task that is currently running
    When the user navigates to the import status page
    Then the system displays the task status as "Processing"
    And shows the start timestamp
    And displays progress percentage if available
```

**Test Data:**
- Background task: `{ id: "bg_task_002", status: "processing", started_at: "2026-06-15T10:35:00Z", progress: "35%" }`

**Preconditions:**
- Background task is actively being processed by worker
- Task progress tracking is enabled

### T-4.3: Background task status displays as completed
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Completed background task shows success status
    Given a user has a background import task that completed successfully
    When the user navigates to the import status page
    Then the system displays the task status as "Completed"
    And shows the completion timestamp
    And displays the number of records imported
```

**Test Data:**
- Background task: `{ id: "bg_task_003", status: "completed", completed_at: "2026-06-15T11:15:00Z", records_imported: 7500 }`

**Preconditions:**
- Background task has completed successfully
- Task result data is persisted

### T-5.1: Multiple concurrent background imports allowed
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: User can submit multiple background imports concurrently
    Given a user has an active background import task
    And the task status is "Processing"
    When the user attempts to submit another file for background import
    Then the system accepts the new import request
    And queues the second task
    And displays both tasks in the import status page with their respective statuses
```

**Test Data:**
- First task: `{ id: "bg_task_004", status: "processing", filename: "import_1.csv" }`
- Second file: `large_dataset_6000_rows.csv`
- User: authenticated with sufficient permissions

**Preconditions:**
- First background task is already running
- Queue has capacity for additional tasks
- User has not exceeded personal task limits

### T-6.1: Background task failure due to database timeout
**Maps to:** AC-6
**Category:** error-handling

```gherkin
  Scenario: Background task fails with database timeout and preserves file
    Given a background import task is processing
    When the task encounters a database connection timeout
    Then the system marks the task status as "Failed"
    And logs the error details "Database timeout after 300 seconds"
    And preserves the original uploaded file for retry
    And records the failure timestamp
```

**Test Data:**
- Background task: `{ id: "bg_task_005", filename: "timeout_test.csv", error: "database_timeout" }`
- Error details: database connection pool exhaustion

**Preconditions:**
- Background task is actively processing
- Database connection timeout is configured
- Original file is stored in retry location

### T-6.2: Background task failure due to memory limit
**Maps to:** AC-6
**Category:** error-handling

```gherkin
  Scenario: Background task fails with memory limit exceeded
    Given a background import task is processing a very large file
    When the task exceeds the configured memory limit
    Then the system marks the task status as "Failed"
    And logs the error details "Memory limit exceeded: 2GB"
    And preserves the original file for retry
    And provides retry option to user
```

**Test Data:**
- Large file: `massive_dataset_50000_rows.csv` (150MB)
- Memory limit: 2GB per worker process

**Preconditions:**
- System memory monitoring is active
- File retry mechanism is configured

### T-7.1: Queue capacity limit enforced at 100 tasks
**Maps to:** AC-7
**Category:** boundary

```gherkin
  Scenario: Import rejected when queue is at capacity
    Given the background import queue has 100 tasks
    And the queue is at maximum capacity
    When a user attempts to upload a file for background processing
    Then the system displays "Import queue is at capacity. Please try again in 10 minutes."
    And rejects the file upload
    And does not create a background task
```

**Test Data:**
- Queue status: 100 active/pending background tasks
- Upload file: `rejected_upload.csv` with 6000 rows
- Capacity limit: 100 concurrent background tasks

**Preconditions:**
- Queue monitoring is active
- Capacity limits are enforced
- Queue status is accurately tracked

## Security Tests

### T-8.1: Unauthenticated access to background import rejected
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated user cannot access background import endpoints
    Given no valid authentication token is present
    When a request is made to POST /api/imports/background
    Then the system returns 401 Unauthorized
    And includes "Authentication required" in the response
    And does not create any background task
```

**Test Data:**
- Request: POST without Authorization header
- Expected response: `{ "error": "Authentication required", "status": 401 }`

**Preconditions:**
- Authentication middleware is active
- No session cookies or tokens present

### T-9.1: Insufficient permissions rejected for background import
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: User without import permissions cannot queue background tasks
    Given a user is authenticated with read-only permissions
    And the user lacks import permissions for the requested data type
    When the user attempts to queue a background import for product data
    Then the system returns 403 Forbidden
    And displays "Missing required permission: import_products"
    And does not create a background task
```

**Test Data:**
- User: `{ email: "readonly@company.com", role: "viewer", permissions: ["view_products"] }`
- Required permission: `import_products`
- Expected response: `{ "error": "Missing required permission: import_products", "status": 403 }`

**Preconditions:**
- User is authenticated but has limited permissions
- Permission system is enforcing import restrictions

## Boundary Tests

### T-10.1: File with exactly 1000 rows boundary behavior
**Maps to:** AC-2, AC-3
**Category:** boundary

```gherkin
  Scenario: File with exactly 1000 rows triggers choice options
    Given a user is authenticated with import permissions
    When the user uploads a CSV file with exactly 1000 rows
    Then the system displays processing choice options
    And offers both "Process now" and "Process in background" options
```

**Test Data:**
- CSV file: `boundary_1000_rows.csv` with exactly 1000 inventory records

**Preconditions:**
- System boundary is configured at 1000 rows between small and medium files

### T-10.2: File with malformed CSV structure
**Maps to:** AC-6
**Category:** error-handling

```gherkin
  Scenario: Background task fails with malformed CSV and preserves file
    Given a background import task is processing
    When the task encounters a malformed CSV file
    Then the system marks the task status as "Failed"
    And logs the error details "Invalid CSV format: mismatched quotes on line 2,347"
    And preserves the original file for manual review
```

**Test Data:**
- Malformed file: `invalid_csv.csv` with quote escaping errors
- Error location: specific line number and column details

**Preconditions:**
- CSV validation is performed during background processing
- Detailed error reporting is enabled


# Test Specifications: IMPORT-PROGRESS — Real-time progress tracking

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1: Display progress percentage | T-1.1, T-1.2, T-1.3 | happy-path |
| AC-2: Display estimated completion time | T-2.1, T-2.2, T-2.3 | happy-path |
| AC-3: Update progress via polling every 5s | T-3.1, T-3.2 | integration |
| AC-4: Include 25% buffer in estimates | T-4.1, T-4.2 | calculation |
| AC-5: Only for background imports | T-5.1, T-5.2 | scope |
| NFR: Error handling | T-6.1, T-6.2, T-6.3 | error-handling |
| NFR: Performance | T-7.1, T-7.2 | performance |
| NFR: Security | T-8.1, T-8.2 | security |
| NFR: Accessibility | T-9.1 | accessibility |

## Test Cases

### T-1.1: Display progress percentage for active background import
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Import Progress Tracking

  Scenario: View progress percentage during background import
    Given I am logged in as a user with import permissions
    And I have started a background import of a CSV file with 1000 rows
    And the import task ID is "task_12345"
    When I navigate to the import progress page for task "task_12345"
    Then I should see a progress indicator showing "45%" completion
    And the progress percentage should be displayed prominently
    And the progress indicator should be visually recognizable (progress bar or similar)
```

**Test Data:**
- CSV file: 1000 rows, currently processed 450 rows
- Task ID: "task_12345"
- User: `{ id: 101, email: "importer@example.com", role: "data_importer" }`

**Preconditions:**
- Background import service is running
- Import task exists and is actively processing
- User has valid authentication session

### T-1.2: Progress percentage updates as import progresses
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Progress percentage increases as more data is processed
    Given I am logged in as a user with import permissions
    And I have started a background import of a CSV file with 500 rows
    And the import has processed 100 rows (20% complete)
    When I wait for the import to process 150 more rows
    And I refresh the progress page
    Then I should see the progress percentage has increased to "50%"
    And the progress indicator should reflect the updated percentage
```

**Test Data:**
- CSV file: 500 rows total
- Initial state: 100 rows processed (20%)
- Updated state: 250 rows processed (50%)

**Preconditions:**
- Import is actively running and processing data
- Progress tracking is functioning correctly

### T-1.3: Progress shows 100% when import completes
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Progress reaches 100% when import is complete
    Given I am logged in as a user with import permissions
    And I have started a background import of a CSV file with 200 rows
    And the import is nearing completion with 195 rows processed
    When the import completes successfully
    And I view the import progress page
    Then I should see "100%" completion
    And I should see a completion status message "Import completed successfully"
```

**Test Data:**
- CSV file: 200 rows
- Final state: All 200 rows processed
- Status: "completed"

**Preconditions:**
- Import task exists and is nearly complete
- No errors occurred during processing

### T-2.1: Display estimated completion time for active import
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: View estimated completion time during import
    Given I am logged in as a user with import permissions
    And I have started a background import that processes 100 rows per minute
    And the import has 300 rows remaining to process
    When I view the import progress page
    Then I should see an estimated completion time of approximately "4 minutes"
    And the time estimate should include descriptive text like "Estimated completion: 4 minutes"
```

**Test Data:**
- Processing rate: 100 rows per minute
- Rows remaining: 300
- Base calculation: 3 minutes + 25% buffer = ~4 minutes

**Preconditions:**
- Import has been running long enough to establish processing rate
- Sufficient data points exist for time estimation

### T-2.2: Time estimate decreases as import progresses
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Estimated time decreases as work is completed
    Given I am logged in as a user with import permissions
    And I have an active background import with initial estimate of "10 minutes"
    And 5 minutes have passed with normal processing rate
    When I refresh the import progress page
    Then I should see the estimated completion time has decreased to approximately "6 minutes"
    And the estimate should be based on current progress and remaining work
```

**Test Data:**
- Initial estimate: 10 minutes
- Time elapsed: 5 minutes
- Updated estimate: ~6 minutes (with processing rate factored in)

**Preconditions:**
- Import has been running for sufficient time to calculate rate
- Processing is proceeding at expected pace

### T-2.3: Time estimate adjusts for varying processing speeds
**Maps to:** AC-2
**Category:** edge-case

```gherkin
  Scenario: Time estimate adapts to slower than expected processing
    Given I am logged in as a user with import permissions
    And I have an active background import with initial estimate of "8 minutes"
    And the actual processing rate becomes 50% slower than initially calculated
    When I view the import progress page after the system recalculates
    Then I should see the estimated completion time has increased to approximately "12 minutes"
    And the estimate should reflect the adjusted processing rate
```

**Test Data:**
- Initial rate: 200 rows/minute
- Adjusted rate: 100 rows/minute (50% slower)
- Remaining work: 1000 rows
- Updated estimate: ~12 minutes (10 base + 25% buffer)

**Preconditions:**
- Import has been running long enough to detect rate change
- System can recalculate estimates based on performance

### T-3.1: Progress updates automatically via polling
**Maps to:** AC-3
**Category:** integration

```gherkin
  Scenario: Progress information updates without manual refresh
    Given I am logged in as a user with import permissions
    And I have an active background import at 30% completion
    And I am viewing the import progress page
    When I wait for 6 seconds without refreshing the page
    Then the progress information should automatically update
    And I should see updated progress percentage and time estimate
    And no manual page refresh should be required
```

**Test Data:**
- Initial progress: 30%
- Polling interval: 5 seconds
- Wait time: 6 seconds (1 second longer than interval)

**Preconditions:**
- JavaScript polling is enabled and functioning
- Import is actively progressing
- Network connection is stable

### T-3.2: Polling stops when import completes
**Maps to:** AC-3
**Category:** integration

```gherkin
  Scenario: Automatic updates stop when import is finished
    Given I am logged in as a user with import permissions
    And I have an active background import at 95% completion
    And the progress page is polling for updates
    When the import completes successfully
    And I observe the page behavior for 15 seconds
    Then the polling should stop
    And the final status should show "Import completed"
    And no further automatic updates should occur
```

**Test Data:**
- Import near completion: 95%
- Final status: "completed"
- Observation period: 15 seconds

**Preconditions:**
- Import is about to complete
- Polling mechanism is active

### T-4.1: Time estimates include 25% buffer for accuracy
**Maps to:** AC-4
**Category:** calculation

```gherkin
  Scenario: Conservative time estimates with built-in buffer
    Given I am logged in as a user with import permissions
    And I have an active background import processing at exactly 120 rows per minute
    And there are 480 rows remaining to process
    When I view the estimated completion time
    Then the base calculation should be 4 minutes (480/120)
    And the displayed estimate should be "5 minutes" (4 + 25% buffer)
    And the estimate should err on the conservative side
```

**Test Data:**
- Processing rate: 120 rows/minute (exactly)
- Rows remaining: 480
- Base time: 4 minutes
- Buffered time: 5 minutes (4 * 1.25)

**Preconditions:**
- Stable processing rate has been established
- Sufficient data points for accurate rate calculation

### T-4.2: Buffer percentage remains consistent across different import sizes
**Maps to:** AC-4
**Category:** calculation

```gherkin
  Scenario: 25% buffer applies regardless of import size
    Given I am logged in as a user with import permissions
    And I have a small import with 2 minutes base estimate
    And I have a large import with 20 minutes base estimate
    When I view the time estimates for both imports
    Then the small import should show "2.5 minutes" (2 + 25%)
    And the large import should show "25 minutes" (20 + 25%)
    And the buffer percentage should be consistent across all imports
```

**Test Data:**
- Small import: 2 minutes base → 2.5 minutes displayed
- Large import: 20 minutes base → 25 minutes displayed
- Buffer: 25% for both

**Preconditions:**
- Multiple imports of different sizes are available for comparison
- Time calculation logic is consistent

### T-5.1: Progress tracking only applies to background imports
**Maps to:** AC-5
**Category:** scope

```gherkin
  Scenario: No progress tracking for immediate imports
    Given I am logged in as a user with import permissions
    And I upload a small CSV file that processes immediately (< 5 seconds)
    When the import completes without queueing
    Then I should not see a progress tracking page
    And I should be redirected directly to the import results
    And no background processing status should be displayed
```

**Test Data:**
- File size: 50 rows (processes immediately)
- Processing time: < 5 seconds
- Import type: immediate/synchronous

**Preconditions:**
- File is small enough for immediate processing
- Background queueing threshold is not triggered

### T-5.2: Background imports always show progress tracking
**Maps to:** AC-5
**Category:** scope

```gherkin
  Scenario: All background imports have progress tracking
    Given I am logged in as a user with import permissions
    And I upload a large CSV file that requires background processing
    When the file is queued for background import
    Then I should be redirected to the progress tracking page
    And I should see initial progress information (0% or queued status)
    And progress tracking should be available immediately
```

**Test Data:**
- File size: 5000 rows (requires background processing)
- Queue status: "queued" or "processing"
- Initial progress: 0%

**Preconditions:**
- File exceeds immediate processing threshold
- Background queue is operational

### T-6.1: Handle Celery worker unavailable scenario
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Display clear message when import service is unavailable
    Given I am logged in as a user with import permissions
    And the Celery worker is unavailable or stopped
    And I have an import task that was in progress
    When I view the import progress page
    Then I should see the message "Import service temporarily unavailable"
    And I should see a "Retry" button
    And the page should not show misleading progress information
```

**Test Data:**
- Error state: Celery worker down
- Message: "Import service temporarily unavailable"
- Action: Retry button available

**Preconditions:**
- Import task exists in the system
- Celery worker is unavailable

### T-6.2: Handle task queue full scenario
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Reject upload when task queue is full
    Given I am logged in as a user with import permissions
    And the background task queue is at maximum capacity
    When I attempt to start a new background import
    Then the upload should be rejected
    And I should see a clear wait time estimate like "Queue is full. Please try again in 15 minutes"
    And no task should be created in the queue
```

**Test Data:**
- Queue status: Full (50 concurrent tasks)
- Wait estimate: 15 minutes
- Action: Upload rejection

**Preconditions:**
- Task queue is at configured maximum capacity
- Queue monitoring is functional

### T-6.3: Handle background task timeout scenario
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Mark timed-out tasks as failed with retry option
    Given I am logged in as a user with import permissions
    And I have a background import that has been running for the maximum allowed time
    When the task timeout threshold is reached
    And I view the import progress page
    Then I should see the status "Import failed - timeout"
    And I should see an option for "Manual retry"
    And the original file should be preserved for retry
```

**Test Data:**
- Timeout threshold: 30 minutes
- Status: "Import failed - timeout"
- Action: Manual retry available

**Preconditions:**
- Import task has been running beyond timeout threshold
- File preservation system is working

### T-7.1: Queue submission response time under 2 seconds
**Maps to:** NFR Performance
**Category:** performance

```gherkin
  Scenario: Fast response time for queue submission
    Given I am logged in as a user with import permissions
    And I have a valid CSV file ready for upload
    When I submit the file for background import
    Then the queue submission should complete in less than 2 seconds (p95)
    And I should receive immediate confirmation with task ID
    And the response should not wait for actual processing to begin
```

**Test Data:**
- Response time requirement: < 2 seconds p95
- File size: 1000 rows (typical background import size)
- Measurement: Queue submission only, not processing

**Preconditions:**
- System is under normal load
- Queue service is responsive

### T-7.2: Support 50 concurrent background imports
**Maps to:** NFR Performance
**Category:** performance

```gherkin
  Scenario: System handles maximum concurrent imports
    Given I am logged in as a user with import permissions
    And there are already 49 background imports in progress
    When I submit one additional import (the 50th)
    Then the import should be accepted and queued
    And all 50 imports should show progress tracking
    And system performance should remain acceptable
```

**Test Data:**
- Concurrent imports: 50 (maximum)
- All imports: Should show progress tracking
- Performance: Acceptable response times maintained

**Preconditions:**
- System is configured for 50 concurrent imports
- Load testing environment is available

### T-8.1: Unauthorized user cannot access progress tracking
**Maps to:** NFR Security
**Category:** security

```gherkin
  Scenario: Unauthenticated request to progress tracking
    Given I am not logged in
    When I attempt to access the import progress page for task "task_12345"
    Then I should receive a 401 Unauthorized response
    And I should be redirected to the login page
    And no import progress information should be displayed
```

**Test Data:**
- Authentication: None (unauthenticated)
- Task ID: "task_12345"
- Expected response: 401 Unauthorized

**Preconditions:**
- Valid task ID exists in system
- Authentication middleware is functioning

### T-8.2: User with insufficient permissions cannot access progress tracking
**Maps to:** NFR Security
**Category:** security

```gherkin
  Scenario: Wrong-role user cannot access import progress
    Given I am logged in as a user without import permissions
    And another user has started import task "task_67890"
    When I attempt to access the progress page for "task_67890"
    Then I should receive a 403 Forbidden response
    And I should see a message like "You don't have permission to view this import"
    And no progress information should be displayed
```

**Test Data:**
- User role: "viewer" (no import permissions)
- Task owner: Different user
- Expected response: 403 Forbidden

**Preconditions:**
- Task belongs to a different user
- Role-based access control is enforced

### T-9.1: Screen reader announcements for progress updates
**Maps to:** NFR Accessibility
**Category:** accessibility

```gherkin
  Scenario: Screen reader accessibility for progress changes
    Given I am logged in as a user with import permissions
    And I am using a screen reader
    And I have an active background import at 40% completion
    When the progress updates to 50%
    Then the screen reader should announce "Import progress updated to 50 percent"
    And progress changes should be communicated through ARIA live regions
    And the announcement should not be overly frequent or disruptive
```

**Test Data:**
- Initial progress: 40%
- Updated progress: 50%
- Announcement: "Import progress updated to 50 percent"

**Preconditions:**
- Screen reader is active and configured
- ARIA live regions are properly implemented
- Progress update occurs

## Negative Tests

### T-N1: Invalid task ID returns appropriate error
**Maps to:** Error Handling
**Category:** error-handling

```gherkin
  Scenario: Access non-existent import task
    Given I am logged in as a user with import permissions
    When I attempt to view progress for task ID "invalid_task_999"
    Then I should receive a 404 Not Found response
    And I should see the message "Import task not found"
    And I should be offered a link back to my imports list
```

### T-N2: Progress page behavior when network is unavailable
**Maps to:** Error Handling
**Category:** error-handling

```gherkin
  Scenario: Handle network interruption during polling
    Given I am logged in as a user with import permissions
    And I am viewing an active import progress page
    When the network connection is interrupted
    And polling requests fail
    Then I should see a message "Connection lost - attempting to reconnect"
    And the page should attempt to reconnect automatically
    And the last known progress should remain displayed
```

## Boundary Tests

### T-B1: Progress tracking for very small background imports
**Maps to:** AC-1, AC-5
**Category:** boundary

```gherkin
  Scenario: Progress tracking for minimum size background import
    Given I am logged in as a user with import permissions
    And I have a CSV file that just barely qualifies for background processing (501 rows)
    When the background import starts
    Then progress tracking should function normally
    And progress should update from 0% to 100%
    And time estimates should be calculated appropriately
```

### T-B2: Progress tracking for maximum allowed file size
**Maps to:** Performance
**Category:** boundary

```gherkin
  Scenario: Progress tracking for largest allowed import
    Given I am logged in as a user with import permissions
    And I have a CSV file at the maximum allowed size (100MB)
    When the background import starts
    Then progress tracking should handle the large import
    And time estimates should scale appropriately
    And the system should remain responsive during tracking
```


