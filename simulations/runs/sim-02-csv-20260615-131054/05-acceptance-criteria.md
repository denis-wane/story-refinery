<!-- STORY COUNT: 4 stories to process -->

# Acceptance Criteria: IMPORT-ASYNC — Background processing for large files

## Refined Story Statement
As a data importer, I want files with 5,000+ rows to process in the background, so that I can continue using the application while large imports complete.

## Assumptions
- Files below 5,000 rows continue to process synchronously — **Confirmed** (story scope)
- Background processing uses Celery task queue — **Confirmed** (dependencies)
- Users can optionally choose background processing for smaller files — **Confirmed** (story scope)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: User permissions model unclear | Addressed in AC | AC-AUTH-1, AC-AUTH-2 |
| G-3: Async processing threshold assumed >1000 rows | Story specifies 5000+ rows | AC-1, AC-2 |
| G-9: Notification mechanisms not defined | Out of Scope | Handled by IMPORT-NOTIFICATIONS story |

## Acceptance Criteria

### AC-1: Automatic Background Processing for Large Files
**Given** a user uploads a CSV/Excel file with 5,000 or more rows
**When** the system processes the file upload
**Then** the system automatically queues the import as a background task and displays a message "Your import is processing in the background. You'll receive an email when complete."

**Category:** happy-path
**Priority:** must-have

### AC-2: Optional Background Processing for Medium Files
**Given** a user uploads a file with 1,000-4,999 rows
**When** the system processes the file upload
**Then** the system offers a choice: "Process now (may take a few minutes)" or "Process in background (receive email notification)"

**Category:** happy-path
**Priority:** should-have

### AC-3: Synchronous Processing Preserved for Small Files
**Given** a user uploads a file with fewer than 1,000 rows
**When** the system processes the file upload
**Then** the import processes synchronously and shows real-time progress without background queuing

**Category:** happy-path
**Priority:** must-have

### AC-4: Background Task Status Tracking
**Given** a file is queued for background processing
**When** the user navigates to the import status page
**Then** the system displays the task status as "Queued", "Processing", "Completed", or "Failed" with timestamp

**Category:** happy-path
**Priority:** must-have

### AC-5: Multiple Concurrent Background Imports
**Given** a user has an active background import
**When** they attempt to start another background import
**Then** the system allows the new import and displays both tasks in the import queue with their respective statuses

**Category:** edge-case
**Priority:** should-have

### AC-6: Background Task Failure Handling
**Given** a background import task encounters a system error (database timeout, memory limit)
**When** the task fails
**Then** the system marks the task as "Failed", logs the error details, and preserves the original uploaded file for retry

**Category:** error-handling
**Priority:** must-have

### AC-7: Queue Capacity Management
**Given** the system has 100+ background imports queued
**When** a user attempts to queue another import
**Then** the system displays "Import queue is at capacity. Please try again in 10 minutes." and rejects the upload

**Category:** boundary
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to background import endpoints
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without import permissions for the requested data type
**When** a request is made to queue a background import
**Then** the system returns 403 Forbidden with a message identifying the missing permission

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Celery worker unavailable | Display "Import service temporarily unavailable" with retry button | must-have |
| Task queue full | Reject upload with clear wait time estimate | must-have |
| Background task timeout | Mark as failed, preserve file for manual retry | must-have |

### Performance
- **Response time:** Queue submission < 2s p95
- **Scale:** Support 50 concurrent background imports

### Security
- **Input validation:** File size limits enforced before queueing
- **Authorization:** Role-based access to background processing features

### Accessibility
- Screen reader announcements for background processing status changes

## Open Questions
- What is the maximum retention period for failed background task logs?
- Should admin users have higher concurrent import limits?

---

# Acceptance Criteria: IMPORT-PROGRESS — Real-time progress tracking

## Refined Story Statement
As a data importer, I want to see progress percentage and estimated completion time for background imports, so that I know how long to wait and can plan accordingly.

## Assumptions
- Progress updates via polling every 5 seconds — **Unconfirmed** (needs technical decision)
- Time estimates include 25% buffer for conservative estimates — **Confirmed** (story scope)
- Progress tracking only applies to background imports — **Confirmed** (story dependencies)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-7: Time estimation algorithm not specified | Addressed in AC | AC-2, resolved by assumption |
| G-3: Async processing threshold | Inherited from IMPORT-ASYNC | Background imports only |

## Acceptance Criteria

### AC-1: Real-time Progress Display
**Given** a background import is processing
**When** the user views the import status page
**Then** the system displays a progress bar with percentage (0-100%) updated every 5 seconds

**Category:** happy-path
**Priority:** must-have

### AC-2: Conservative Time Estimation
**Given** a background import has processed at least 100 rows
**When** the system calculates estimated completion time
**Then** the estimate is based on average processing rate plus 25% buffer and displays as "Estimated completion: 5-7 minutes remaining"

**Category:** happy-path
**Priority:** must-have

### AC-3: Processing Rate Display
**Given** a background import is active
**When** the user views progress details
**Then** the system shows "Processing 150 rows/minute" based on the last 30 seconds of activity

**Category:** happy-path
**Priority:** should-have

### AC-4: Progress Persistence Across Sessions
**Given** a user has a background import in progress
**When** they log out and log back in
**Then** the system displays the current progress state without resetting

**Category:** edge-case
**Priority:** must-have

### AC-5: Multi-step Progress Breakdown
**Given** a background import involves validation, transformation, and database insertion
**When** the system reports progress
**Then** it shows overall progress plus current step: "45% complete - Validating data (step 1 of 3)"

**Category:** happy-path
**Priority:** should-have

### AC-6: Stalled Import Detection
**Given** a background import shows no progress updates for 5 minutes
**When** the system checks task health
**Then** it displays "Import may be stalled - Support has been notified" and marks for admin review

**Category:** error-handling
**Priority:** must-have

### AC-7: Progress for Very Small Batches
**Given** a background import has fewer than 50 rows to process
**When** the system calculates progress
**Then** it skips time estimation and shows "Processing... almost complete" to avoid showing "0 seconds remaining"

**Category:** boundary
**Priority:** should-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to progress tracking endpoints
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user attempting to view another user's import progress
**When** a request is made without proper authorization
**Then** the system returns 403 Forbidden with message "Access denied to this import"

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Progress polling endpoint unavailable | Show last known progress with "Live updates unavailable" | must-have |
| WebSocket connection failed | Fall back to HTTP polling automatically | should-have |
| Task worker becomes unresponsive | Display stalled warning after 5 minutes | must-have |

### Performance
- **Response time:** Progress updates < 200ms p95
- **Scale:** Support progress tracking for 50 concurrent imports

### Security
- **Input validation:** Import ID validation to prevent unauthorized access
- **Authorization:** Users can only view progress for their own imports

### Accessibility
- Progress announced to screen readers at 10% intervals

## Open Questions
- Should WebSocket be implemented for real-time updates, or is HTTP polling sufficient?
- What should happen to progress tracking data after import completion?

---

# Acceptance Criteria: IMPORT-NOTIFICATIONS — Completion notifications

## Refined Story Statement
As a data importer, I want to receive email notifications when background imports complete, so that I can act on the results even when away from the application.

## Assumptions
- Notifications sent to user's registered email address — **Confirmed** (story scope)
- Notification preferences are not configurable initially — **Unconfirmed** (needs UX decision)
- Notifications include success/failure counts and link to results — **Confirmed** (story scope)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-9: Notification mechanisms not defined | Addressed in AC | AC-1, AC-2, AC-3 |

## Acceptance Criteria

### AC-1: Successful Import Notification
**Given** a background import completes successfully
**When** the processing finishes
**Then** the system sends an email to the user's registered address with subject "Import Complete: [filename]" and summary "Successfully imported 1,847 contacts. View details: [link]"

**Category:** happy-path
**Priority:** must-have

### AC-2: Failed Import Notification
**Given** a background import fails completely
**When** the processing encounters an unrecoverable error
**Then** the system sends an email with subject "Import Failed: [filename]" and message "Import failed due to [error reason]. Your file is preserved for retry. View details: [link]"

**Category:** error-handling
**Priority:** must-have

### AC-3: Partial Import Notification
**Given** a background import completes with validation errors
**When** some rows are imported and others are skipped
**Then** the system sends an email with subject "Import Partially Complete: [filename]" and summary "Imported 1,203 of 1,500 contacts. 297 rows had validation errors. Download error report: [link]"

**Category:** happy-path
**Priority:** must-have

### AC-4: Notification Link Security
**Given** an email notification contains a link to import results
**When** the user clicks the link
**Then** the link includes a secure token that expires after 7 days and requires user authentication

**Category:** security
**Priority:** must-have

### AC-5: Email Delivery Failure Handling
**Given** an email notification fails to deliver
**When** the email service returns a bounce or failure
**Then** the system logs the failure and displays an in-app notification as fallback

**Category:** error-handling
**Priority:** should-have

### AC-6: Multiple Import Notification Batching
**Given** a user has 3+ imports complete within 15 minutes
**When** the notification system processes the queue
**Then** it sends a single digest email: "3 imports completed" with a summary table of all results

**Category:** edge-case
**Priority:** should-have

### AC-7: Invalid Email Address Handling
**Given** a user's registered email address is invalid or undeliverable
**When** the system attempts to send a notification
**Then** it skips email delivery, logs the issue, and shows in-app notification only

**Category:** error-handling
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to notification settings endpoints
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user attempting to configure notifications for another user
**When** a request is made without admin privileges
**Then** the system returns 403 Forbidden with message "Access denied to notification settings"

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Email service outage | Queue notifications for retry up to 24 hours | must-have |
| Malformed email template | Log error and send plain text fallback notification | must-have |
| SMTP authentication failure | Alert system administrators and use backup email service | must-have |

### Performance
- **Response time:** Notification queuing < 1s after import completion
- **Scale:** Support 1000 notifications per hour

### Security
- **Input validation:** Email address format validation before sending
- **Authorization:** Secure tokens in notification links with 7-day expiration

### Accessibility
- Email notifications use plain text with HTML fallback for screen reader compatibility

## Open Questions
- Should users be able to configure notification preferences (disable, frequency, email vs in-app)?
- Should admin users receive copies of failed import notifications for monitoring?

---

# Acceptance Criteria: IMPORT-HISTORY — Import history dashboard

## Refined Story Statement
As a data importer, I want to view a history of my past imports with key statistics, so that I can track my import activity and find specific imports to review or undo.

## Assumptions
- History retained for 1 year per user — **Confirmed** (story scope)
- History shows user's own imports only — **Unconfirmed** (admin access model unclear)
- File content storage not included in history — **Confirmed** (story scope)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: User permissions model unclear | Open Question | Admin access to all import history needs clarification |

## Acceptance Criteria

### AC-1: Import History List Display
**Given** a user accesses the import history page
**When** the page loads
**Then** the system displays a table with columns: Date/Time, File Name, Type (contacts/companies/deals), Total Rows, Imported, Failed, Status, Actions

**Category:** happy-path
**Priority:** must-have

### AC-2: History Sorting and Filtering
**Given** a user has multiple imports in their history
**When** they use the sort/filter controls
**Then** they can sort by date (newest first default) and filter by status (All, Completed, Failed, In Progress) or type (contacts, companies, deals)

**Category:** happy-path
**Priority:** should-have

### AC-3: Import Details View
**Given** a user clicks on an import entry
**When** the details modal opens
**Then** it shows file metadata, validation summary, error counts by type, processing duration, and download links for error reports if available

**Category:** happy-path
**Priority:** must-have

### AC-4: Search Import History
**Given** a user wants to find a specific import
**When** they use the search box
**Then** the system searches file names and returns matching results with highlighting

**Category:** edge-case
**Priority:** should-have

### AC-5: Pagination for Large History
**Given** a user has 100+ imports in their history
**When** they view the history page
**Then** the system displays 25 imports per page with pagination controls and shows "Showing 1-25 of 147 imports"

**Category:** boundary
**Priority:** must-have

### AC-6: Empty History State
**Given** a new user with no import history
**When** they access the history page
**Then** the system displays "No imports yet. Upload your first file to get started." with a link to the upload page

**Category:** edge-case
**Priority:** should-have

### AC-7: History Data Retention
**Given** an import record is older than 1 year
**When** the daily cleanup job runs
**Then** the system archives the import record (removing file references but keeping metadata) and marks it as "Archived" in the history

**Category:** boundary
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to import history endpoints
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user attempting to view another user's import history
**When** a request is made without proper authorization
**Then** the system returns 403 Forbidden with message "Access denied to import history"

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Database unavailable for history query | Display "Import history temporarily unavailable" with retry button | must-have |
| Corrupted import metadata | Show entry as "Data corrupted" with admin contact info | should-have |
| Missing error report files | Show "Error report no longer available" instead of broken download link | must-have |

### Performance
- **Response time:** History page load < 1s p95 for 100 imports
- **Scale:** Support 1000 imports per user over 1 year

### Security
- **Input validation:** Search query sanitization to prevent SQL injection
- **Authorization:** Users can only access their own import history

### Accessibility
- Sortable table headers with screen reader support
- High contrast status indicators for import success/failure

## Open Questions
- Should admin users have access to view all users' import history for compliance purposes?
- What should happen to import history when a user account is deleted?

---

## Coverage Summary
| # | Story Slug | AC Count | Auth AC | Gap Rows | Status |
|---|-----------|----------|---------|----------|--------|
| 1 | IMPORT-ASYNC | 7 | Yes | 3 | Complete |
| 2 | IMPORT-PROGRESS | 7 | Yes | 2 | Complete |
| 3 | IMPORT-NOTIFICATIONS | 7 | Yes | 1 | Complete |
| 4 | IMPORT-HISTORY | 7 | Yes | 1 | Complete |
| **Total** | **4 stories** | **28** | **8** | **7** | **Complete** |


I see the gap analysis and context, but the actual user stories for batch 03 are missing from the input. The section "## Stories (batch 03 of 3)" is empty - it doesn't contain the 2 user stories I'm supposed to write acceptance criteria for.

To write complete acceptance criteria, I need:
1. The specific user story definitions (title, description, acceptance criteria outline)
2. Which gaps from the analysis apply to each story

Could you provide the missing user stories for batch 03? I'm ready to write complete AC following the exact format with Gap Traceability tables, auth requirements (AC-AUTH-1 and AC-AUTH-2), and full coverage once I have the story definitions.


