# Test Specifications: SPIKE-01 — CRDT Framework Selection

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, edge-case |
| AC-2 | T-2.1, T-2.2 | happy-path, boundary |
| AC-3 | T-3.1, T-3.2 | happy-path, boundary |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1 | boundary |

> **Note on Authorization Tests:** SPIKE-01 produces a repository artifact (ADR markdown file), not a user-facing API or UI feature. The security posture for ADR access is governed by existing repository permissions (branch protection, GitHub/GitLab ACLs) — not application-layer auth middleware. Mandatory 401/403 tests are recorded here as repository-access controls rather than API endpoint tests. If the ADR is surfaced through an internal web tool or API, those endpoints must have their own auth test suite added at that time.

---

## Test Cases

### T-1.1: ADR file exists at the correct repository path after spike completion
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: CRDT Framework Selection ADR

  Scenario: ADR is produced and committed within the 3-day timebox
    Given the spike was started on day 1
    And the spike timebox is 3 working days
    When the spike concludes (no later than end of day 3)
    Then a file exists in the repository at "docs/adr/NNNN-crdt-framework-selection.md"
    And the file contains a non-empty "## Status" section
    And the file contains a non-empty "## Context" section
    And the file contains a non-empty "## Decision" section
    And the file contains a non-empty "## Options Considered" section
    And the file contains a non-empty "## Decision Rationale" section
    And the file contains a non-empty "## Consequences" section
    And the file is committed to the main branch (or an open PR targeting main)
```

**Test Data:**
- Repository path: `docs/adr/`
- ADR filename pattern: matches `[0-9]{4}-crdt-framework-selection.md`
- Timebox start: recorded in spike kick-off ticket
- Timebox end: kick-off date + 3 working days

**Preconditions:**
- Repository exists and is accessible
- `docs/adr/` directory exists or is created during the spike
- Spike has been formally started (kick-off date recorded)

---

### T-1.2: ADR status field contains a valid decision status
**Maps to:** AC-1
**Category:** edge-case

```gherkin
Feature: CRDT Framework Selection ADR

  Scenario: ADR status field is set to a recognized value
    Given the ADR file exists at "docs/adr/NNNN-crdt-framework-selection.md"
    When the "## Status" section is parsed
    Then the status value is one of: "Accepted", "Decision: DEFERRED", "Superseded", "Proposed"
    And the status is not blank or placeholder text (e.g., not "TODO" or "TBD")
```

**Test Data:**
- Accepted status values: `["Accepted", "Decision: DEFERRED", "Superseded", "Proposed"]`
- Rejected placeholder values: `["TODO", "TBD", "FIXME", ""]`

**Preconditions:**
- ADR file committed to repository

---

### T-2.1: ADR documents all seven evaluation criteria with findings for both candidates
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: CRDT Framework Evaluation Coverage

  Scenario: ADR addresses all required evaluation constraints for each candidate
    Given the ADR is authored with status "Accepted" or "Decision: DEFERRED"
    And the primary candidates are Yjs and Automerge
    When the evaluation section is reviewed
    Then the ADR contains documented findings for "5MB document size" for Yjs
    And the ADR contains documented findings for "5MB document size" for Automerge
    And the ADR contains documented findings for "50 concurrent editors" for Yjs
    And the ADR contains documented findings for "50 concurrent editors" for Automerge
    And the ADR contains documented findings for "offline merge correctness" for Yjs
    And the ADR contains documented findings for "offline merge correctness" for Automerge
    And the ADR contains documented findings for "local-only undo" for Yjs
    And the ADR contains documented findings for "local-only undo" for Automerge
    And the ADR contains documented findings for "character-level LWW conflict resolution" for Yjs
    And the ADR contains documented findings for "character-level LWW conflict resolution" for Automerge
    And the ADR contains documented findings for "client bundle size (gzipped)" for Yjs
    And the ADR contains documented findings for "client bundle size (gzipped)" for Automerge
    And the ADR contains documented findings for "TypeScript/React compatibility" for Yjs
    And the ADR contains documented findings for "TypeScript/React compatibility" for Automerge
```

**Test Data:**
- Candidate frameworks: `["Yjs", "Automerge"]`
- Required criteria: `["5MB document size", "50 concurrent editors", "offline merge correctness", "local-only undo", "character-level LWW", "client bundle size", "TypeScript/React compatibility"]`

**Preconditions:**
- ADR file committed and parseable

---

### T-2.2: Memory and fan-out measurements reference the confirmed scale limits
**Maps to:** AC-2
**Category:** boundary

```gherkin
Feature: CRDT Framework Evaluation Coverage

  Scenario: Scale measurements use the confirmed 5MB and 50-editor thresholds
    Given the ADR documents memory and fan-out performance
    When the quantitative findings are reviewed
    Then the 5MB document size finding includes a measured or estimated memory footprint value (in MB or KB)
    And the 5MB document size finding includes a measured or estimated CRDT state overhead value
    And the 50 concurrent editors finding includes a measured or estimated broadcast fan-out metric (messages/sec or latency)
    And neither finding uses only qualitative language without supporting data (e.g., "works fine" with no numbers)
```

**Test Data:**
- Document size threshold: 5 MB
- Concurrent editor threshold: 50
- Acceptable evidence: benchmark script output, estimation methodology with formula, or cited third-party benchmark

**Preconditions:**
- Benchmarking environment established (Node.js version, hardware spec noted in ADR)

---

### T-3.1: ADR contains integration quickstart sufficient to begin SYNC-01
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: ADR Actionability for Downstream Stories

  Scenario: ADR provides all information needed to start SYNC-01 without further research
    Given the ADR status is "Accepted"
    When an engineer preparing to implement SYNC-01 reads the ADR
    Then the ADR states the chosen package name (e.g., "yjs" or "automerge")
    And the ADR states the chosen package version (e.g., "^13.6.0" or a pinned version)
    And the ADR states the recommended server-side persistence strategy (one of: "update log", "snapshot", or "hybrid")
    And the ADR contains a link to a proof-of-concept branch OR an inline code snippet demonstrating a basic insert and delete round-trip
```

**Test Data:**
- Expected package registries: npmjs.com
- Persistence strategies: `["update log", "snapshot", "hybrid"]`
- PoC branch naming convention: `spike/crdt-poc` or equivalent

**Preconditions:**
- ADR status is "Accepted" (not "DEFERRED")
- PoC branch or code snippet is accessible to the team

---

### T-3.2: ADR is insufficient to unblock SYNC-01 when status is DEFERRED
**Maps to:** AC-3, AC-4
**Category:** boundary

```gherkin
Feature: ADR Actionability for Downstream Stories

  Scenario: DEFERRED ADR does not claim to unblock downstream implementation
    Given the ADR status is "Decision: DEFERRED"
    When the downstream dependencies section is reviewed
    Then the ADR explicitly states that SYNC-01, SYNC-02, CONF-01, and OFFL-01 remain blocked
    And the ADR does not contain a "chosen package" recommendation presented as final
    And the ADR recommends a course of action (extend timebox OR pick default to unblock)
```

**Test Data:**
- Gated downstream stories: `["SYNC-01", "SYNC-02", "CONF-01", "OFFL-01"]`

**Preconditions:**
- ADR status has been set to "Decision: DEFERRED" before timebox end

---

### T-4.1: ADR is published in DEFERRED status with required content when no clear winner is found
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Timebox Overrun Handling

  Scenario: Spike concludes without a clear winner — ADR published as DEFERRED
    Given the 3-day timebox has expired
    And no candidate framework definitively meets all evaluation criteria
    When the ADR is committed to the repository
    Then the ADR status is "Decision: DEFERRED"
    And the ADR documents what was evaluated (frameworks and criteria tested)
    And the ADR documents what remains unresolved (specific open questions)
    And the ADR estimates the additional time needed to reach a decision (e.g., "2 additional days")
    And the ADR contains a recommendation: either "extend timebox" or "pick [framework] as default to unblock downstream"
```

**Test Data:**
- Timebox duration: 3 working days
- Required DEFERRED sections: evaluated, unresolved, estimated-additional-time, recommendation

**Preconditions:**
- Spike started and timebox tracked
- Lead engineer notified before timebox expires (per error handling requirement)

---

### T-5.1: Stories not in the gate list are not blocked by SPIKE-01
**Maps to:** AC-5
**Category:** boundary

```gherkin
Feature: Spike Scope Boundary

  Scenario: Non-gated stories can proceed while spike is in progress
    Given the spike SPIKE-01 is in progress (not yet complete)
    And the following stories are NOT in the SPIKE-01 gate list: DOC-01, DOC-02, PERM-01
    When a team member begins implementation of DOC-01
    Then no process or tooling block prevents DOC-01 from being worked on
    And the sprint board does not mark DOC-01 as "Blocked by SPIKE-01"

  Scenario: Only gated stories are blocked by SPIKE-01
    Given SPIKE-01 is in progress
    When the blocked story list is reviewed
    Then the blocked stories are exactly: SYNC-01, SYNC-02, CONF-01, CONF-02, CONF-03, OFFL-01, OFFL-02
    And no other stories appear in the SPIKE-01 blocked list
```

**Test Data:**
- Gated story IDs: `["SYNC-01", "SYNC-02", "CONF-01", "CONF-02", "CONF-03", "OFFL-01", "OFFL-02"]`
- Non-gated stories (sample): `["DOC-01", "DOC-02", "PERM-01"]`

**Preconditions:**
- Sprint board or dependency tracking tool is in use
- SPIKE-01 is recorded as a blocker only for the gated stories

---

---

# Test Specifications: DOC-01 — Create a New Blank Document

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, negative |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1 | error-handling |
| AC-6 | T-6.1 | edge-case |
| AC-7 | T-7.1 | boundary |
| AC-8 | T-8.1, T-8.2 | boundary, negative |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Successful creation of a blank document
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Create a New Blank Document

  Scenario: Authenticated editor creates a new document within a project
    Given an authenticated user with editor-level access to project "project-alpha"
    And the user is viewing the project page for "project-alpha"
    When the user activates the "New Document" action
    Then a POST request is sent to "/api/projects/project-alpha-id/documents"
    And the API returns 201 Created
    And the response body contains a document with title "Untitled Document"
    And the response body contains a document ID (non-empty UUID)
    And the response body contains a creator permission record with role "editor" for the authenticated user
    And the browser navigates to "/projects/project-alpha-id/documents/{new-document-id}"
    And the editor view renders
```

**Test Data:**
- User: `{ id: "user-001", email: "editor@example.com", role: "editor", status: "active" }`
- Project: `{ id: "project-alpha-id", name: "project-alpha", memberIds: ["user-001"] }`
- Expected document: `{ title: "Untitled Document", content: "", creatorId: "user-001" }`

**Preconditions:**
- User is authenticated with a valid session token
- Project "project-alpha" exists in the database
- User has at least editor-level membership in "project-alpha"
- Database is available and responsive

---

### T-1.2: Document record exists in database immediately after creation
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Create a New Blank Document

  Scenario: New document is persisted immediately — not on first edit
    Given an authenticated editor creates a new document in project "project-alpha-id"
    When the POST to "/api/projects/project-alpha-id/documents" returns 201
    And the user has NOT yet typed any content
    Then querying the database directly for the returned document ID returns a record
    And that record has title "Untitled Document"
    And that record has an empty content body
    And that record has createdAt timestamp within 2 seconds of the API response time
```

**Test Data:**
- Document ID from creation response: captured at runtime
- Expected DB fields: `{ title: "Untitled Document", content: "", projectId: "project-alpha-id" }`

**Preconditions:**
- Database is accessible for direct read in test environment
- System clock skew between API server and DB is < 1 second

---

### T-2.1: New document appears in project document list for authorized users
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Create a New Blank Document

  Scenario: Created document is visible in the project document list
    Given user "editor@example.com" has created document "doc-new-001" in project "project-alpha-id"
    And user "viewer@example.com" has viewer access to project "project-alpha-id"
    When "viewer@example.com" sends GET to "/api/projects/project-alpha-id/documents"
    Then the response contains an entry with documentId "doc-new-001"
    And that entry shows title "Untitled Document"
    And that entry shows creator name "Editor User"
    And that entry shows a lastModified timestamp that reads "just now" or within the last 60 seconds
```

**Test Data:**
- Creator user: `{ id: "user-001", displayName: "Editor User", email: "editor@example.com" }`
- Viewer user: `{ id: "user-002", email: "viewer@example.com", role: "viewer" }`
- Project: `{ id: "project-alpha-id" }`

**Preconditions:**
- Both users are authenticated
- Both users have access to project "project-alpha-id"
- Document has been created within the last 60 seconds

---

### T-3.1: Title field is focused and editable immediately on document creation
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Create a New Blank Document

  Scenario: Editor is navigated to document view with title field pre-focused
    Given an authenticated editor has just created a new document "doc-new-001"
    When the editor view at "/projects/project-alpha-id/documents/doc-new-001" renders
    Then the document title input field has DOM focus (document.activeElement === titleInput)
    And the title field displays "Untitled Document"
    And the title field is in an editable state (not read-only)

  Scenario: Title change is persisted without a separate save action
    Given the editor is in the document view with the title field focused
    When the editor changes the title to "Q3 Roadmap Notes"
    And the title field loses focus (blur event)
    Then a PATCH request is sent to "/api/projects/project-alpha-id/documents/doc-new-001"
    And the request body contains title "Q3 Roadmap Notes"
    And the API returns 200 OK
    And querying the document record in the database returns title "Q3 Roadmap Notes"
```

**Test Data:**
- Document ID: `"doc-new-001"`
- New title: `"Q3 Roadmap Notes"`
- Title max length: 255 characters (enforced per NFR)

**Preconditions:**
- Document has been created and user is navigated to editor view
- User has editor permission on the document

---

### T-4.1: Blank document content area is empty on initial load
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Create a New Blank Document

  Scenario: New blank document has no pre-populated content
    Given an authenticated editor has created a new document "doc-new-001"
    When the editor view renders
    Then the document content area contains no text nodes with visible characters
    And the content area contains no heading elements (H1, H2, H3)
    And the content area contains no formatting marks (bold, italic, underline)
    And the cursor is positioned at the beginning of the empty content area
```

**Test Data:**
- Document ID: `"doc-new-001"`
- Expected CRDT content: empty document (zero operations, no text nodes)

**Preconditions:**
- Document created via POST to `/api/projects/:projectId/documents`
- No additional API calls made to the document content endpoint before this test assertion

---

### T-5.1: Document creation fails gracefully when database is unavailable
**Maps to:** AC-5
**Category:** error-handling

```gherkin
Feature: Create a New Blank Document

  Scenario: Database unavailable during document creation — graceful failure
    Given an authenticated editor is viewing project "project-alpha-id"
    And the database is unavailable (simulated connection timeout)
    When the editor activates the "New Document" action
    Then the POST to "/api/projects/project-alpha-id/documents" returns 503 or 500
    And the user remains on the project view page (no navigation occurs)
    And an inline error message is displayed reading "Failed to create document. Please try again."
    And no document record exists in the database for this attempted creation
    And no creator permission record exists for this attempted creation

  Scenario: No partial document record is left after a failed creation
    Given a document creation fails mid-transaction (DB write succeeds for doc but fails for permission)
    When the transaction is rolled back
    Then querying for any document created in the last 5 seconds in project "project-alpha-id" returns zero results
    And querying for any creator permission records for "user-001" on new documents returns zero new records
```

**Test Data:**
- Simulated failure: database connection timeout after 5000ms
- User: `{ id: "user-001", email: "editor@example.com" }`
- Project: `{ id: "project-alpha-id" }`

**Preconditions:**
- Database failure is injectable via test environment configuration (e.g., network partition, mock DB client)
- Test environment supports transaction rollback inspection

---

### T-6.1: Rapid double-click on "New Document" creates only one document
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Create a New Blank Document

  Scenario: Double-click on "New Document" button creates exactly one document
    Given an authenticated editor is viewing project "project-alpha-id"
    And the project currently has 0 documents
    When the editor double-clicks the "New Document" button within 300ms
    Then exactly one POST request is sent to "/api/projects/project-alpha-id/documents"
    And the API returns 201 Created for that single request
    And the database contains exactly 1 new document in project "project-alpha-id"
    And the "New Document" button is visually disabled between the first click and the creation response

  Scenario: "New Document" button is re-enabled after creation completes
    Given the editor double-clicked "New Document" and one document was created
    When the browser has navigated to the new document's editor view
    Then the "New Document" button (if visible) is in an enabled state
```

**Test Data:**
- Double-click interval: 300ms (simulated programmatically)
- Project: `{ id: "project-alpha-id", documentCount: 0 }`

**Preconditions:**
- User has editor access to the project
- UI debounce or disable-on-click mechanism is implemented

---

### T-7.1: Document is created within the correct project scope
**Maps to:** AC-7
**Category:** boundary

```gherkin
Feature: Create a New Blank Document

  Scenario: Document created in Project A does not appear in Project B
    Given authenticated editor "user-001" has access to project "project-alpha-id" and "project-beta-id"
    When the editor creates a new document in project "project-alpha-id"
    And the POST to "/api/projects/project-alpha-id/documents" returns 201 with document "doc-new-001"
    Then querying GET "/api/projects/project-alpha-id/documents" returns a list containing "doc-new-001"
    And querying GET "/api/projects/project-beta-id/documents" returns a list NOT containing "doc-new-001"
    And the document record in the database has projectId "project-alpha-id"
    And the document record in the database does NOT have projectId "project-beta-id"
```

**Test Data:**
- User: `{ id: "user-001", projects: ["project-alpha-id", "project-beta-id"] }`
- Project Alpha: `{ id: "project-alpha-id", name: "Alpha" }`
- Project Beta: `{ id: "project-beta-id", name: "Beta" }`

**Preconditions:**
- Both projects exist and user has editor access to both
- Both projects have their document lists pre-loaded and cached (to verify no cross-contamination)

---

### T-8.1: Document creation and creator permission are created atomically
**Maps to:** AC-8
**Category:** boundary

```gherkin
Feature: Create a New Blank Document

  Scenario: Both document and creator permission are created in a single transaction
    Given the database supports transactions
    And an authenticated editor triggers document creation
    When the creation transaction commits successfully
    Then the documents table contains the new document record
    And the permissions table contains a record for user "user-001" with role "editor" on the new document
    And both records share the same createdAt timestamp (within 1ms or same DB transaction ID)
```

**Test Data:**
- Document: `{ id: "doc-new-001", projectId: "project-alpha-id", title: "Untitled Document" }`
- Permission: `{ documentId: "doc-new-001", userId: "user-001", role: "editor" }`

**Preconditions:**
- Database supports ACID transactions
- Test can inspect both tables after creation

---

### T-8.2: Document without creator permission is an invalid state — rollback occurs
**Maps to:** AC-8
**Category:** negative

```gherkin
Feature: Create a New Blank Document

  Scenario: Permission insert failure causes document insert to be rolled back
    Given an authenticated editor triggers document creation
    And the permission insert step will fail (simulated constraint violation)
    When the transaction is rolled back
    Then the documents table does NOT contain a new document record from this attempt
    And the API response is 500 or 503 (not 201)
    And the user sees the "Failed to create document. Please try again." error message
```

**Test Data:**
- Simulated failure: foreign key violation or unique constraint error on permissions table insert
- User: `{ id: "user-001" }`

**Preconditions:**
- Permission insert failure is injectable via test double or DB trigger in test environment

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to document creation endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Document Creation Authorization

  Scenario: Request with no auth token is rejected with 401
    Given no authentication token is present in the request headers
    When a POST request is sent to "/api/projects/project-alpha-id/documents" with body {}
    Then the response status is 401 Unauthorized
    And the response body contains an error indicating missing or invalid authentication
    And no document record is created in the database
    And no permission record is created in the database

  Scenario: Request with an expired auth token is rejected with 401
    Given a user has a session token that expired 1 hour ago
    When a POST request is sent to "/api/projects/project-alpha-id/documents" with the expired token
    Then the response status is 401 Unauthorized
    And no document is created
```

**Test Data:**
- No-auth request: `{ headers: {} }` (no Authorization header, no session cookie)
- Expired token request: JWT with `exp` set to `now() - 3600`

**Preconditions:**
- API endpoint is deployed and reachable in the test environment
- Auth middleware is active on the route

---

### T-AUTH-2.1: Request from user without project access returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Document Creation Authorization

  Scenario: Authenticated user with no project membership is rejected with 403
    Given user "outsider@example.com" is authenticated with a valid token
    And "outsider@example.com" has no membership in project "project-alpha-id"
    When a POST request is sent to "/api/projects/project-alpha-id/documents"
    Then the response status is 403 Forbidden
    And the response body identifies the missing permission
    And no document is created in project "project-alpha-id"

  Scenario: Authenticated viewer-only user is rejected with 403 (pending G-5 resolution)
    Given user "viewer@example.com" has viewer-only access to project "project-alpha-id"
    When a POST request is sent to "/api/projects/project-alpha-id/documents"
    Then the response status is 403 Forbidden
    And no document is created
```

**Test Data:**
- Outsider user: `{ id: "user-outsider", email: "outsider@example.com", projectMemberships: [] }`
- Viewer user: `{ id: "user-viewer", email: "viewer@example.com", role: "viewer", projectId: "project-alpha-id" }`
- Target project: `{ id: "project-alpha-id" }`

**Preconditions:**
- Both users are authenticated with valid (non-expired) tokens
- Permission enforcement is implemented in the POST `/api/projects/:projectId/documents` handler

---

---

# Test Specifications: DOC-02 — Open and Navigate Documents Within a Project

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, boundary |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path, negative |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1, T-6.2 | edge-case |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1 | boundary |
| AC-9 | T-9.1, T-9.2 | boundary, error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Document list renders all accessible documents sorted by last-modified descending
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Open and Navigate Documents Within a Project

  Scenario: Authenticated user sees all their accessible documents sorted correctly
    Given authenticated user "editor@example.com" has access to project "project-alpha-id"
    And project "project-alpha-id" contains 3 documents accessible to "editor@example.com":
      | documentId | title          | lastModified         |
      | doc-001    | Alpha Doc      | 2026-06-15T10:00:00Z |
      | doc-002    | Beta Doc       | 2026-06-15T12:00:00Z |
      | doc-003    | Gamma Doc      | 2026-06-15T09:00:00Z |
    When "editor@example.com" sends GET to "/api/projects/project-alpha-id/documents"
    Then the response status is 200 OK
    And the response contains exactly 3 document entries
    And the documents are ordered: doc-002, doc-001, doc-003 (descending lastModified)
```

**Test Data:**
- User: `{ id: "user-001", email: "editor@example.com", role: "editor" }`
- Project: `{ id: "project-alpha-id" }`
- Documents: as specified in the table above

**Preconditions:**
- User is authenticated with a valid token
- All 3 documents exist and user has at least viewer permission on each

---

### T-1.2: Document list API sorts correctly when documents have identical timestamps
**Maps to:** AC-1
**Category:** boundary

```gherkin
Feature: Open and Navigate Documents Within a Project

  Scenario: Documents with the same lastModified timestamp have a stable sort order
    Given two documents "doc-001" and "doc-002" both have lastModified "2026-06-15T10:00:00.000Z"
    When the user requests the document list for project "project-alpha-id"
    Then the response contains both documents
    And the order of "doc-001" and "doc-002" is consistent across multiple requests (stable sort)
```

**Test Data:**
- Doc 001: `{ id: "doc-001", lastModified: "2026-06-15T10:00:00.000Z" }`
- Doc 002: `{ id: "doc-002", lastModified: "2026-06-15T10:00:00.000Z" }`

**Preconditions:**
- Both documents created at the exact same millisecond (forced in test setup)

---

### T-2.1: Document list shows title, creator name, and relative timestamp with tooltip
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Open and Navigate Documents Within a Project

  Scenario: Document list entry displays all required metadata fields
    Given document "doc-001" in project "project-alpha-id" has:
      | title       | Alpha Doc              |
      | creatorId   | user-creator-001       |
      | creatorName | Alice Maker            |
      | lastModified| 2026-06-15T10:00:00Z   |
    And the current time is 2026-06-15T12:00:00Z (2 hours after lastModified)
    When an authenticated user views the project page
    Then the document entry for "doc-001" displays title "Alpha Doc"
    And the entry displays creator name "Alice Maker"
    And the entry displays relative time "2 hours ago"
    And the relative time element has a tooltip containing the absolute datetime "Jun 15, 2026, 10:00 AM" or equivalent locale-formatted string
```

**Test Data:**
- Document: `{ id: "doc-001", title: "Alpha Doc", creatorId: "user-creator-001", lastModified: "2026-06-15T10:00:00Z" }`
- Creator: `{ id: "user-creator-001", displayName: "Alice Maker" }`
- Test execution time: mocked to `2026-06-15T12:00:00Z`

**Preconditions:**
- System clock in test environment is mockable (e.g., jest `useFakeTimers` or equivalent)
- Creator user record exists in the database with displayName set

---

### T-3.1: Documents with no user access are not visible in the list
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Open and Navigate Documents Within a Project

  Scenario: User sees only documents they have access to — inaccessible documents are hidden
    Given project "project-alpha-id" contains 3 documents:
      | documentId | title          | user-viewer access |
      | doc-d1     | D1 Document    | viewer             |
      | doc-d2     | D2 Document    | editor             |
      | doc-d3     | D3 Document    | none               |
    When "viewer@example.com" sends GET to "/api/projects/project-alpha-id/documents"
    Then the response contains doc-d1 and doc-d2
    And the response does NOT contain doc-d3
    And the response does NOT contain the title "D3 Document"
    And the response does NOT contain any field that would reveal doc-d3's existence
```

**Test Data:**
- Viewer user: `{ id: "user-viewer", email: "viewer@example.com" }`
- Permission records: viewer on doc-d1, editor on doc-d2, none on doc-d3

**Preconditions:**
- Permission filtering is enforced server-side on the list endpoint
- All 3 documents exist in the database

---

### T-3.2: Inaccessible document title is not disclosed in error messages
**Maps to:** AC-3
**Category:** negative

```gherkin
Feature: Open and Navigate Documents Within a Project

  Scenario: Server does not leak title or metadata of inaccessible documents
    Given "outsider@example.com" has no access to document "doc-d3" titled "Secret Strategy"
    When "outsider@example.com" sends GET to "/api/projects/project-alpha-id/documents/doc-d3"
    Then the response status is 403 Forbidden
    And the response body does NOT contain the string "Secret Strategy"
    And the response body does NOT contain any document metadata (creator, lastModified, content)
```

**Test Data:**
- Outsider: `{ id: "user-outsider", email: "outsider@example.com" }`
- Inaccessible document: `{ id: "doc-d3", title: "Secret Strategy" }`

**Preconditions:**
- User is authenticated but has no permission record for doc-d3

---

### T-4.1: Clicking a document title navigates to the document editor view
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Open and Navigate Documents Within a Project

  Scenario: Clicking a document in the list navigates to its editor URL
    Given authenticated user "editor@example.com" is viewing the document list for project "project-alpha-id"
    And the list shows document "doc-001" titled "Alpha Doc"
    When the user clicks the title "Alpha Doc"
    Then the browser navigates to "/projects/project-alpha-id/documents/doc-001"
    And the document editor view renders
    And the editor view displays the content of document "doc-001"
```

**Test Data:**
- Document: `{ id: "doc-001", title: "Alpha Doc", projectId: "project-alpha-id" }`
- User: `{ id: "user-001", email: "editor@example.com", documentRole: "editor" }`
- Expected URL: `/projects/project-alpha-id/documents/doc-001`

**Preconditions:**
- Document list is rendered and visible
- Document "doc-001" has non-empty content to verify rendering

---

### T-5.1: Breadcrumb navigates back to project view
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: Open and Navigate Documents Within a Project

  Scenario: Breadcrumb link returns user to project view from document editor
    Given authenticated user "editor@example.com" is on the document editor page for "doc-001"
    And the breadcrumb displays the project name "Alpha Project"
    When the user clicks the breadcrumb link "Alpha Project"
    Then the browser navigates to the project view URL "/projects/project-alpha-id"
    And the document list section is visible on the project view
```

**Test Data:**
- Document: `{ id: "doc-001", projectId: "project-alpha-id" }`
- Project: `{ id: "project-alpha-id", name: "Alpha Project" }`

**Preconditions:**
- User is on the document editor page
- Breadcrumb component is rendered with project name

---

### T-6.1: Empty project shows empty state message
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Open and Navigate Documents Within a Project

  Scenario: Project with no documents shows empty state with create prompt for editors
    Given project "project-empty-id" has 0 documents
    And authenticated user "editor@example.com" has editor access to "project-empty-id"
    When the user navigates to the project page
    Then the document list section displays the message "No documents yet. Create one to get started."
    And a "New Document" action button is visible
    And the "New Document" button is enabled and activatable

  Scenario: Project with no accessible documents shows empty state without "New Document" for viewers
    Given project "project-alpha-id" has documents that "viewer@example.com" has no access to
    When "viewer@example.com" navigates to the project page
    Then the document list section displays an empty state message
    And no "New Document" action is visible (pending G-5 resolution — viewers cannot create)
```

**Test Data:**
- Empty project: `{ id: "project-empty-id", documentCount: 0 }`
- Editor user: `{ id: "user-001", email: "editor@example.com", projectRole: "editor" }`
- Viewer user: `{ id: "user-002", email: "viewer@example.com", projectRole: "viewer" }`

**Preconditions:**
- Project exists in database with no documents (or no accessible documents for viewer)

---

### T-6.2: Document list API error shows inline error, not empty state
**Maps to:** AC-6 (NFR: error handling)
**Category:** edge-case

```gherkin
Feature: Open and Navigate Documents Within a Project

  Scenario: Document list API failure shows error message distinct from empty state
    Given the document list API is unavailable (returns 503)
    When an authenticated user navigates to the project page
    Then the document list section displays "Unable to load documents. Refresh to try again."
    And the "No documents yet" empty state message is NOT shown
    And a retry/refresh mechanism is available to the user
```

**Test Data:**
- Simulated error: GET `/api/projects/project-alpha-id/documents` returns 503

**Preconditions:**
- Network failure is injectable in test environment

---

### T-7.1: Document list paginates when more than 50 documents exist
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Open and Navigate Documents Within a Project

  Scenario: List of 75 accessible documents paginates — first 25 load immediately
    Given project "project-large-id" contains 75 documents accessible to "editor@example.com"
    When the user navigates to the project page
    Then the initial document list renders exactly 25 documents
    And pagination controls are visible (e.g., "Next", page numbers, or "Load more")
    And the page does not experience layout jank during initial load
    And navigating to page 2 renders the next 25 documents
    And navigating to page 3 renders the remaining 25 documents

  Scenario: Document list with 201 documents does not degrade page performance
    Given project "project-giant-id" contains 201 documents accessible to the user
    When the user navigates to the project page
    Then the first 25 documents render within 2 seconds
    And no single JS frame exceeds 50ms during list rendering (no jank)
```

**Test Data:**
- Large project: `{ id: "project-large-id", documentCount: 75 }`
- Giant project: `{ id: "project-giant-id", documentCount: 201 }`
- Page size: 25 items

**Preconditions:**
- Test data seeded with the required document counts
- Performance measurement tooling available (e.g., Playwright Performance API)

---

### T-8.1: Viewer sees document in read-only mode with no editing toolbar
**Maps to:** AC-8
**Category:** boundary

```gherkin
Feature: Open and Navigate Documents Within a Project

  Scenario: Viewer-role user opens a document and sees read-only view
    Given "viewer@example.com" has viewer-only access to document "doc-001"
    When they click on "doc-001" in the document list
    And the browser navigates to "/projects/project-alpha-id/documents/doc-001"
    Then the document content is rendered and readable
    And no formatting toolbar is visible
    And no text editing cursor is shown in the content area
    And attempting to type in the content area produces no changes

  Scenario: Direct API write attempt from viewer is rejected
    Given "viewer@example.com" has viewer-only access to document "doc-001"
    When they send a PATCH to "/api/documents/doc-001" with body { "content": "hacked" }
    Then the response status is 403 Forbidden
    And the document content in the database is unchanged
```

**Test Data:**
- Viewer user: `{ id: "user-viewer", email: "viewer@example.com", documentRole: "viewer" }`
- Document: `{ id: "doc-001", content: "Original content" }`

**Preconditions:**
- Permission enforcement is active on both UI rendering and PATCH endpoint

---

### T-9.1: Direct document URL access works for authorized user
**Maps to:** AC-9
**Category:** boundary

```gherkin
Feature: Open and Navigate Documents Within a Project

  Scenario: User with viewer access navigates directly to a document URL
    Given "viewer@example.com" has viewer access to document "doc-001" in project "project-alpha-id"
    When they navigate directly to "/projects/project-alpha-id/documents/doc-001"
    Then the document view renders with the document's current content
    And the page title reflects the document title "Alpha Doc"
```

**Test Data:**
- Viewer user: `{ id: "user-viewer", email: "viewer@example.com", documentRole: "viewer" }`
- Document: `{ id: "doc-001", title: "Alpha Doc", projectId: "project-alpha-id" }`

**Preconditions:**
- User is authenticated
- Direct URL access routes through the same permission check as list-click navigation

---

### T-9.2: Deleted document accessed via URL shows 404, not crash
**Maps to:** AC-9 (NFR: error handling)
**Category:** error-handling

```gherkin
Feature: Open and Navigate Documents Within a Project

  Scenario: Clicking a document that was deleted between list load and click returns 404
    Given the document list for project "project-alpha-id" was loaded 30 seconds ago showing "doc-deleted"
    And "doc-deleted" has since been deleted from the database
    When the user clicks on "doc-deleted" in the cached list
    Then the navigation attempt returns 404
    And the UI displays "This document no longer exists"
    And a link back to project "project-alpha-id" is visible
    And the application does not throw an unhandled exception
```

**Test Data:**
- Deleted document: `{ id: "doc-deleted", projectId: "project-alpha-id" }`
- Scenario setup: delete document after list is loaded but before navigation occurs

**Preconditions:**
- 404 handling is implemented for the document editor route
- Test controls the deletion timing

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated access to project document list returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Document Navigation Authorization

  Scenario: No auth token — document list endpoint returns 401
    Given no authentication token is present
    When a GET request is sent to "/api/projects/project-alpha-id/documents"
    Then the response status is 401 Unauthorized
    And no document titles or metadata are present in the response

  Scenario: No auth token — direct document URL returns 401
    Given no authentication token is present
    When a GET request is sent to "/api/projects/project-alpha-id/documents/doc-001"
    Then the response status is 401 Unauthorized
    And no document content is returned
```

**Test Data:**
- Request with no auth: `{ headers: {} }` (no Authorization header or session cookie)
- Project: `{ id: "project-alpha-id" }`
- Document: `{ id: "doc-001" }`

**Preconditions:**
- Auth middleware is active on both GET endpoints

---

### T-AUTH-2.1: Authenticated user with no project access receives 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Document Navigation Authorization

  Scenario: Authenticated user with no project membership cannot see document list
    Given "outsider@example.com" is authenticated but not a member of project "project-alpha-id"
    When they send GET to "/api/projects/project-alpha-id/documents"
    Then the response status is 403 Forbidden
    And no document titles, IDs, or metadata are disclosed in the response body

  Scenario: Server returns 403 without leaking that documents exist in the project
    Given "outsider@example.com" has no access to project "project-alpha-id"
    When they send GET to "/api/projects/project-alpha-id/documents"
    Then the response body does NOT include any count of documents in the project
    And the response body does NOT include any document titles from the project
```

**Test Data:**
- Outsider: `{ id: "user-outsider", email: "outsider@example.com", projectMemberships: [] }`
- Project: `{ id: "project-alpha-id", documentCount: 5 }`

**Preconditions:**
- Outsider user is authenticated with a valid, non-expired token
- Project "project-alpha-id" has documents belonging to other users

---

---

# Test Specifications: EDIT-01 — Inline Text Formatting and Headings

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, negative |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path, negative |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1 | happy-path |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1 | edge-case |
| AC-9 | T-9.1 | edge-case |
| AC-10 | T-10.1 | boundary |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Bold, italic, and underline applied to selected text via toolbar
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Inline Text Formatting

  Scenario Outline: Applying <mark> via toolbar button marks selected text
    Given an authenticated editor is editing document "doc-001"
    And the document contains the text "Hello World" in the content area
    And the editor has selected the text "World" (characters 7-11)
    When the editor clicks the <button> button in the formatting toolbar
    Then the text "World" is rendered with the <mark> visual style
    And the <button> toolbar button displays in an active/highlighted state
    And the CRDT document state contains a <mark> mark on characters 7-11

    Examples:
      | mark      | button    |
      | bold      | Bold      |
      | italic    | Italic    |
      | underline | Underline |
```

**Test Data:**
- Document: `{ id: "doc-001", content: "Hello World" }`
- Selection range: characters 6–11 (0-indexed: "World")
- Expected CRDT marks: `{ bold: true }` | `{ italic: true }` | `{ underline: true }`

**Preconditions:**
- User is authenticated with editor permission on doc-001
- Editor view is fully rendered
- Text "Hello World" exists in the document content

---

### T-1.2: Toolbar button does not apply mark when no text is selected (beyond AC-8 toggle-mode)
**Maps to:** AC-1
**Category:** negative

```gherkin
Feature: Inline Text Formatting

  Scenario: Clicking Bold with no selection does not bold existing text
    Given an authenticated editor has placed the cursor in "Hello World" with no text selected
    When the editor clicks the Bold button
    Then no existing text in the document changes its bold state
    And the Bold button toggles to active (indicating new typed text will be bold)
    And the CRDT document state shows no mark applied to previously-existing characters
```

**Test Data:**
- Document: `{ id: "doc-001", content: "Hello World" }`
- Cursor position: character 5 (between "Hello" and " ")

**Preconditions:**
- No text is selected (selection start === selection end)

---

### T-2.1: Keyboard shortcuts apply marks identically to toolbar buttons
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Inline Text Formatting — Keyboard Shortcuts

  Scenario Outline: <shortcut> applies <mark> to selected text on <platform>
    Given an authenticated editor on <platform> is editing document "doc-001"
    And the document contains "Hello World"
    And the editor has selected the text "World"
    When the editor presses <shortcut>
    Then the text "World" is rendered with the <mark> visual style
    And the corresponding toolbar button displays in active state
    And the CRDT document state contains a <mark> mark on the selected range
    And the outcome is identical to clicking the toolbar button

    Examples:
      | platform     | shortcut    | mark      |
      | macOS        | Cmd+B       | bold      |
      | macOS        | Cmd+I       | italic    |
      | macOS        | Cmd+U       | underline |
      | Windows/Linux| Ctrl+B      | bold      |
      | Windows/Linux| Ctrl+I      | italic    |
      | Windows/Linux| Ctrl+U      | underline |
```

**Test Data:**
- Document: `{ id: "doc-001", content: "Hello World" }`
- Selection: "World" (characters 6–11)
- Platforms: macOS (Playwright userAgent override), Windows/Linux (Playwright userAgent override)

**Preconditions:**
- Test environment can simulate OS-specific keyboard events
- Editor has focus in the content area before shortcut is pressed

---

### T-3.1: Heading level applied to paragraph block
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Inline Text Formatting — Headings

  Scenario Outline: Selecting <heading> from toolbar converts paragraph to heading
    Given an authenticated editor is editing document "doc-001"
    And the document contains a paragraph "Introduction text"
    And the editor cursor is positioned anywhere within "Introduction text"
    When the editor selects <heading> from the heading picker in the toolbar
    Then the entire "Introduction text" line is converted to <heading> format
    And the line renders at the appropriate visual size/weight for <heading>
    And the CRDT document state marks the paragraph node as type <heading>
    And the change is reflected in the document without a page reload

    Examples:
      | heading |
      | H1      |
      | H2      |
      | H3      |
```

**Test Data:**
- Document: `{ id: "doc-001", content: "Introduction text" }`
- Cursor position: any character within "Introduction text"
- Expected CRDT node type: `"heading-1"` | `"heading-2"` | `"heading-3"`

**Preconditions:**
- User has editor permission on doc-001
- Heading picker dropdown is accessible in the toolbar

---

### T-3.2: Invalid heading level value is rejected by editor and server
**Maps to:** AC-3 (NFR: security/input validation)
**Category:** negative

```gherkin
Feature: Inline Text Formatting — Headings

  Scenario: Direct API call with invalid heading level is rejected
    Given an authenticated editor sends a PATCH to "/api/documents/doc-001/content"
    And the request body specifies headingLevel "H4"
    When the server processes the request
    Then the response status is 400 Bad Request
    And the response error identifies that headingLevel must be one of H1, H2, H3
    And the document content is unchanged in the CRDT state

  Scenario: Heading picker UI does not allow H4 or higher to be selected
    Given the heading picker dropdown is open
    When the editor inspects the available options
    Then the available heading options are exactly: Normal, H1, H2, H3
    And no option for H4, H5, H6, or "custom" is present
```

**Test Data:**
- Invalid heading values: `["H4", "H5", "H6", "h1", "heading-1", 1, null]`
- Valid heading values: `["H1", "H2", "H3"]`
- Request body: `{ headingLevel: "H4", paragraphId: "para-001" }`

**Preconditions:**
- Server-side input validation is implemented
- Editor component's heading picker is rendered

---

### T-4.1: Toggling bold off removes the mark from selected text
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Inline Text Formatting — Toggle Off

  Scenario: Bold mark is removed when Bold is activated on already-bold text
    Given document "doc-001" contains "Hello **World**" (World is bold)
    And an authenticated editor has selected the text "World"
    And the Bold toolbar button is in active state
    When the editor clicks the Bold button (or presses Cmd+B / Ctrl+B)
    Then the text "World" is no longer rendered in bold
    And the Bold toolbar button returns to inactive state
    And the CRDT document state shows no bold mark on characters covering "World"
```

**Test Data:**
- Document: `{ id: "doc-001", content: "Hello World", marks: [{ type: "bold", start: 6, end: 11 }] }`
- Selection: characters 6–11 ("World")

**Preconditions:**
- "World" already has a bold mark in the CRDT document state
- Editor has loaded the document with existing marks rendered

---

### T-5.1: Heading converted back to normal paragraph
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: Inline Text Formatting — Headings

  Scenario: Re-selecting the same heading level converts line back to paragraph
    Given document "doc-001" contains a line "Chapter One" formatted as H1
    And the editor cursor is within "Chapter One"
    And the heading picker shows H1 as selected
    When the editor selects "Normal" from the heading picker
    Then "Chapter One" is rendered as a body paragraph (no heading style)
    And the CRDT document state marks the node type as "paragraph" (not heading)

  Scenario: Selecting the active heading level also converts back to paragraph
    Given document "doc-001" contains "Chapter One" formatted as H1
    When the editor selects "H1" again from the heading picker (re-selects active heading)
    Then "Chapter One" is converted to a body paragraph
    And the heading picker displays "Normal"
```

**Test Data:**
- Document: `{ id: "doc-001", content: "Chapter One", nodeType: "heading-1" }`
- Expected output: `{ content: "Chapter One", nodeType: "paragraph" }`

**Preconditions:**
- "Chapter One" is currently formatted as H1 in the CRDT state

---

### T-6.1: Formatting change is visible to other connected editors within 500ms
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: Inline Text Formatting — Real-Time Sync

  Scenario: Bold mark applied by editor A is visible to editor B within 500ms
    Given editor A ("editor-a@example.com") and editor B ("editor-b@example.com") are both connected to document "doc-001" via WebSocket
    And the document contains the text "Shared content"
    And editor A selects "Shared" and clicks Bold
    When the bold mark is applied in editor A's local view
    Then within 500ms, editor B's view renders "Shared" in bold
    And the CRDT state broadcast to editor B contains the bold mark for "Shared"
```

**Test Data:**
- Editor A: `{ id: "user-editor-a", email: "editor-a@example.com", documentRole: "editor" }`
- Editor B: `{ id: "user-editor-b", email: "editor-b@example.com", documentRole: "editor" }`
- Document: `{ id: "doc-001", content: "Shared content" }`
- Sync latency SLA: 500ms (per SYNC-02)

**Preconditions:**
- Both users are authenticated and have editor permission on doc-001
- WebSocket connection (SYNC-01) is active for both clients
- Network latency in test environment is < 100ms

---

### T-7.1: Mobile browser receives degraded experience — not a broken editor
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Inline Text Formatting — Mobile Browser Handling

  Scenario: iOS Safari user sees "mobile not supported" banner or read-only mode
    Given a user opens document "doc-001" in iOS Safari (mobile browser)
    When the document editor page renders
    Then either:
      (a) a banner is displayed reading "Mobile editing is not supported in v1" AND the formatting toolbar is hidden
      OR
      (b) the editor loads in read-only mode with no formatting toolbar visible
    And the user is NOT presented with a broken or partially-functional editing UI
    And no unhandled JavaScript errors are thrown during page load

  Scenario: Android Chrome user sees degraded mobile experience
    Given a user opens document "doc-001" in Android Chrome (mobile browser)
    When the document editor page renders
    Then either the mobile-not-supported banner OR read-only mode is shown (same as iOS scenario)
    And the formatting toolbar buttons are not visible or not interactable
```

**Test Data:**
- iOS Safari User-Agent: `"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15..."`
- Android Chrome User-Agent: `"Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36..."`

**Preconditions:**
- Test simulates mobile user-agent via Playwright or equivalent
- Browser detection or viewport-based detection is implemented

---

### T-8.1: Activating bold with cursor (no selection) toggles active state for new typed text
**Maps to:** AC-8
**Category:** edge-case

```gherkin
Feature: Inline Text Formatting — Zero-Length Selection

  Scenario: Bold activated with cursor only — subsequently typed text is bold
    Given an authenticated editor places the cursor in document "doc-001" at position 5 with no selection
    When the editor clicks the Bold toolbar button
    Then the Bold button displays in active state
    And no existing characters in the document have been modified
    When the editor types "New"
    Then the characters "New" are rendered in bold
    And the CRDT document state contains a bold mark on the newly typed characters

  Scenario: Toggling bold off with cursor — subsequent text is not bold
    Given the Bold button is in active state (cursor-only mode)
    When the editor clicks the Bold button again
    Then the Bold button returns to inactive state
    And typing after this toggle produces plain (non-bold) text
```

**Test Data:**
- Document: `{ id: "doc-001", content: "Hello World" }`
- Cursor position: character 5 (no selection, start === end)
- Typed input: `"New"`

**Preconditions:**
- Editor has focus in the content area
- No text is selected (verified by selection API: `window.getSelection().isCollapsed === true`)

---

### T-9.1: Mixed selection shows indeterminate bold state and clicking applies bold to full range
**Maps to:** AC-9
**Category:** edge-case

```gherkin
Feature: Inline Text Formatting — Mixed Selection State

  Scenario: Selection spanning bold and non-bold text shows indeterminate state
    Given document "doc-001" contains "Hello **World** today" (only "World" is bold)
    And the editor selects "World today" (spanning bold and non-bold characters)
    When the toolbar renders
    Then the Bold button is displayed in an indeterminate state (neither fully active nor fully inactive)
    And the visual indicator for indeterminate is distinct from both active and inactive states

  Scenario: Clicking Bold on a mixed selection applies bold to the entire selection
    Given the editor has a mixed selection where some characters are bold and some are not
    And the Bold button is in indeterminate state
    When the editor clicks the Bold button
    Then all characters in the selection are rendered in bold
    And the Bold button transitions to the active (fully bold) state
    And the CRDT document state shows bold marks on all characters in the selection range
```

**Test Data:**
- Document: `{ id: "doc-001", content: "World today", marks: [{ type: "bold", start: 0, end: 5 }] }`
- Selection range: all 11 characters ("World today")
- Expected indeterminate signal: `aria-pressed="mixed"` or custom CSS class

**Preconditions:**
- "World" has a bold mark; "today" does not
- Editor has selected the full range including both marked and unmarked characters

---

### T-10.1: Formatting survives page reload
**Maps to:** AC-10
**Category:** boundary

```gherkin
Feature: Inline Text Formatting — Persistence

  Scenario: Bold formatting applied and synced to CRDT state is present after reload
    Given authenticated editor "editor@example.com" has applied bold to "World" in document "doc-001"
    And the CRDT mutation returned a success response from the server
    When the editor reloads the page (hard refresh of the document URL)
    Then the document "doc-001" loads
    And the text "World" is rendered in bold
    And no other formatting has been added or removed

  Scenario: H2 heading survives page reload
    Given an editor has changed a paragraph to H2 and the change was persisted to the CRDT state
    When the editor reloads the page
    Then the line is rendered as H2
    And the heading picker shows H2 as the current heading level for that line
```

**Test Data:**
- Document: `{ id: "doc-001", content: "Hello World" }`
- Pre-reload state: `{ marks: [{ type: "bold", start: 6, end: 11 }] }`
- Expected post-reload state: identical to pre-reload state

**Preconditions:**
- CRDT state mutation has been confirmed by the server before reload (not just optimistic local update)
- Test performs a hard reload (Ctrl+Shift+R equivalent) to clear client-side cache

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to document content mutation endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Text Formatting Authorization

  Scenario: No auth token — formatting mutation endpoint returns 401
    Given no authentication token is present
    When a PATCH request is sent to "/api/documents/doc-001/content" with body { "op": "bold", "range": { "start": 6, "end": 11 } }
    Then the response status is 401 Unauthorized
    And the document content in the database is unchanged
    And no CRDT operation is applied to the document state

  Scenario: Expired token — formatting mutation endpoint returns 401
    Given a user's session token expired 2 hours ago
    When they send a PATCH to "/api/documents/doc-001/content"
    Then the response status is 401 Unauthorized
    And the document is unchanged
```

**Test Data:**
- No-auth request: `{ headers: {} }`
- Expired-token request: JWT with `exp: now() - 7200`
- Mutation body: `{ op: "bold", range: { start: 6, end: 11 } }`
- Document: `{ id: "doc-001", content: "Hello World" }`

**Preconditions:**
- Auth middleware is active on all document content mutation routes
- Document "doc-001" exists in the database

---

### T-AUTH-2.1: Viewer and commenter cannot apply formatting — toolbar hidden and API rejects writes
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Text Formatting Authorization

  Scenario: Viewer-role user — formatting toolbar is not shown in the editor
    Given "viewer@example.com" has viewer-only access to document "doc-001"
    When they navigate to the document editor view
    Then the formatting toolbar (Bold, Italic, Underline, heading picker) is not rendered
    And no toolbar buttons are focusable or activatable via keyboard

  Scenario: Viewer-role user — direct API formatting mutation is rejected with 403
    Given "viewer@example.com" has viewer-only access to document "doc-001"
    When they send a PATCH to "/api/documents/doc-001/content" with a valid auth token
    And the body contains a formatting operation: { "op": "bold", "range": { "start": 0, "end": 5 } }
    Then the response status is 403 Forbidden
    And the document content is unchanged in the CRDT state

  Scenario: Commenter-role user — direct API formatting mutation is rejected with 403
    Given "commenter@example.com" has commenter-only access to document "doc-001"
    When they send a PATCH to "/api/documents/doc-001/content"
    Then the response status is 403 Forbidden
    And the document CRDT state is unchanged
```

**Test Data:**
- Viewer user: `{ id: "user-viewer", email: "viewer@example.com", documentRole: "viewer" }`
- Commenter user: `{ id: "user-commenter", email: "commenter@example.com", documentRole: "commenter" }`
- Document: `{ id: "doc-001", content: "Hello World" }`
- Mutation body: `{ op: "bold", range: { start: 0, end: 5 } }`

**Preconditions:**
- Both users are authenticated with valid, non-expired tokens
- Permission enforcement is implemented in both the UI layer (toolbar visibility) and the API handler


# Test Specifications: Batch 02 — EDIT-02, EDIT-03, EDIT-04, EDIT-05

---

# Test Specifications: EDIT-02 — Bullet and Numbered Lists

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2, T-1.3 | happy-path |
| AC-2 | T-2.1, T-2.2, T-2.3 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1, T-4.2 | happy-path |
| AC-5 | T-5.1, T-5.2 | happy-path |
| AC-6 | T-6.1, T-6.2 | happy-path |
| AC-7 | T-7.1, T-7.2 | happy-path |
| AC-8 | T-8.1 | boundary |
| AC-9 | T-9.1, T-9.2 | edge-case |
| AC-10 | T-10.1, T-10.2 | edge-case |
| AC-11 | T-11.1 | happy-path |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Create bullet list from empty paragraph via toolbar
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Bullet and Numbered Lists

  Scenario: Create bullet list from empty paragraph via toolbar
    Given an authenticated editor opens document "doc-001"
    And the document has a single empty paragraph with cursor at position 0
    When the editor clicks the "Bullet List" toolbar button
    Then the paragraph is converted to an unordered list item with a bullet marker
    And the CRDT state reflects a list node of type "bullet" at position 0
    And the "Bullet List" toolbar button shows aria-pressed="true"
```

**Test Data:**
- `{ documentId: "doc-001", userId: "user-editor-01", role: "editor", cursorPosition: 0, paragraphContent: "" }`

**Preconditions:**
- User is authenticated with editor role
- Document "doc-001" exists with a single empty paragraph
- CRDT WebSocket connection is established

---

### T-1.2: Create bullet list from a range of paragraphs via toolbar
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Convert multiple selected paragraphs to bullet list
    Given an authenticated editor opens document "doc-001"
    And the document contains three paragraphs: "Alpha", "Beta", "Gamma"
    And the editor selects all three paragraphs
    When the editor clicks the "Bullet List" toolbar button
    Then all three paragraphs are converted to bullet list items in a single list block
    And each item retains its original text: "Alpha", "Beta", "Gamma"
    And the CRDT state shows a list node of type "bullet" containing three child items
    And the "Bullet List" toolbar button shows aria-pressed="true"
```

**Test Data:**
- `{ documentId: "doc-001", paragraphs: ["Alpha", "Beta", "Gamma"], selection: { start: 0, end: "end-of-third-paragraph" } }`

**Preconditions:**
- User is authenticated with editor role
- Document "doc-001" contains exactly three paragraphs with the specified text

---

### T-1.3: Bullet list toolbar button shows inactive state when cursor is in plain paragraph
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Toolbar bullet list button is inactive for plain paragraph
    Given an authenticated editor opens document "doc-001"
    And the cursor is in a plain paragraph (not a list)
    Then the "Bullet List" toolbar button shows aria-pressed="false"
```

**Test Data:**
- `{ documentId: "doc-001", userId: "user-editor-01", cursorContext: "paragraph" }`

**Preconditions:**
- User is authenticated with editor role
- Document contains at least one plain paragraph

---

### T-2.1: Create numbered list from empty paragraph via toolbar
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Create numbered list from empty paragraph via toolbar
    Given an authenticated editor opens document "doc-002"
    And the document has a single empty paragraph with cursor at position 0
    When the editor clicks the "Numbered List" toolbar button
    Then the paragraph is converted to an ordered list item with the number "1."
    And the CRDT state reflects a list node of type "ordered" at position 0
    And the "Numbered List" toolbar button shows aria-pressed="true"
```

**Test Data:**
- `{ documentId: "doc-002", userId: "user-editor-01", role: "editor", cursorPosition: 0 }`

**Preconditions:**
- User is authenticated with editor role
- Document "doc-002" exists with a single empty paragraph

---

### T-2.2: Create numbered list from multiple paragraphs with correct auto-incrementing numbers
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Multiple paragraphs converted to numbered list with correct numbers
    Given an authenticated editor opens document "doc-002"
    And the document contains three paragraphs: "First item", "Second item", "Third item"
    And the editor selects all three paragraphs
    When the editor clicks the "Numbered List" toolbar button
    Then the paragraphs are converted to an ordered list
    And the first item is prefixed with "1.", the second with "2.", the third with "3."
    And the CRDT state shows a list node of type "ordered" with three child items
```

**Test Data:**
- `{ paragraphs: ["First item", "Second item", "Third item"] }`

**Preconditions:**
- User is authenticated with editor role
- Document contains exactly three plain paragraphs in sequence

---

### T-2.3: Numbered list toolbar button shows inactive when cursor is in plain paragraph
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Numbered list toolbar button is inactive outside a list
    Given an authenticated editor places cursor in a plain paragraph
    Then the "Numbered List" toolbar button shows aria-pressed="false"
```

**Test Data:**
- `{ cursorContext: "paragraph" }`

**Preconditions:**
- Cursor is not inside any list node

---

### T-3.1: Enter at end of bullet list item creates new item at same level
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Enter at end of bullet list item continues the list
    Given an authenticated editor has a document with a bullet list containing one item "Buy milk"
    And the cursor is at the end of the "Buy milk" list item
    When the editor presses Enter
    Then a new empty bullet list item is created immediately below
    And the cursor is positioned at the start of the new bullet list item
    And the CRDT state shows the list node now contains two items: "Buy milk" and ""
```

**Test Data:**
- `{ listType: "bullet", items: ["Buy milk"], cursorPosition: "end-of-item-0" }`

**Preconditions:**
- Document contains a single-item bullet list
- Cursor is at end of that item (after "k" in "Buy milk")

---

### T-3.2: Enter at end of numbered list item creates new item with incremented number
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Enter at end of numbered list item continues numbered sequence
    Given an authenticated editor has a document with a numbered list containing "Step one"
    And the cursor is at the end of "Step one"
    When the editor presses Enter
    Then a new empty numbered list item is created with the number "2."
    And the cursor is at the start of the new item
    And the CRDT state reflects two items in the ordered list node
```

**Test Data:**
- `{ listType: "ordered", items: ["Step one"], cursorPosition: "end-of-item-0" }`

**Preconditions:**
- Document contains a single-item numbered list

---

### T-4.1: Tab indents a top-level list item to level 2
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Tab indents level-1 list item to level 2
    Given an authenticated editor has a bullet list with two items: "Parent" (level 1) and "Child candidate" (level 1)
    And the cursor is in the "Child candidate" item
    When the editor presses Tab
    Then "Child candidate" is indented to nesting level 2
    And the item renders with additional left indent visually
    And the CRDT state reflects the item's depth as 2
```

**Test Data:**
- `{ listType: "bullet", items: [{ text: "Parent", depth: 1 }, { text: "Child candidate", depth: 1 }], cursorItem: 1 }`

**Preconditions:**
- Document contains a bullet list with at least two items both at depth 1

---

### T-4.2: Tab indents a level-2 item to level 3
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Tab indents level-2 list item to level 3
    Given an authenticated editor has a bullet list with an item at nesting level 2
    And the cursor is in that level-2 item
    When the editor presses Tab
    Then the item is indented to nesting level 3
    And the CRDT state reflects depth 3
```

**Test Data:**
- `{ listType: "bullet", item: { text: "Nested item", depth: 2 }, cursorItem: "that item" }`

**Preconditions:**
- Item is at depth 2 (not yet at maximum)

---

### T-5.1: Shift+Tab dedents a level-2 item to level 1
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Shift+Tab dedents level-2 item to level 1
    Given an authenticated editor has a bullet list with an item at nesting level 2
    And the cursor is in that nested item
    When the editor presses Shift+Tab
    Then the item is moved to nesting level 1
    And the CRDT state reflects depth 1
```

**Test Data:**
- `{ listType: "bullet", item: { text: "Was nested", depth: 2 } }`

**Preconditions:**
- Item is at depth 2

---

### T-5.2: Shift+Tab dedents a level-3 item to level 2
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Shift+Tab dedents level-3 item to level 2
    Given an authenticated editor has a bullet list with an item at nesting level 3
    And the cursor is in that item
    When the editor presses Shift+Tab
    Then the item moves to nesting level 2
    And the CRDT state reflects depth 2
```

**Test Data:**
- `{ listType: "bullet", item: { text: "Deepest item", depth: 3 } }`

**Preconditions:**
- Item is at depth 3

---

### T-6.1: Backspace at start of level-1 list item removes list marker
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Backspace at start of first-level list item converts it to paragraph
    Given an authenticated editor has a bullet list with item "Remember this" at level 1
    And the cursor is at position 0 (very beginning) of "Remember this"
    When the editor presses Backspace
    Then "Remember this" is no longer a list item
    And it becomes a plain paragraph containing "Remember this"
    And the CRDT state shows a paragraph node (not a list item) with text "Remember this"
```

**Test Data:**
- `{ listType: "bullet", item: { text: "Remember this", depth: 1 }, cursorPosition: 0 }`

**Preconditions:**
- Cursor is at the absolute start of the list item text (offset 0)
- Item is at depth 1

---

### T-6.2: Backspace in middle of level-1 list item does not remove list marker
**Maps to:** AC-6
**Category:** happy-path (negative control)

```gherkin
  Scenario: Backspace mid-item does not remove list marker
    Given an authenticated editor has a bullet list with item "Remember this" at level 1
    And the cursor is at position 5 within "Remember this" (after "Remem")
    When the editor presses Backspace
    Then the character at position 4 ("m") is deleted
    And the item remains a bullet list item
    And the CRDT state still shows a list node
```

**Test Data:**
- `{ item: { text: "Remember this", depth: 1 }, cursorPosition: 5 }`

**Preconditions:**
- Cursor is not at position 0

---

### T-7.1: Backspace at start of level-2 list item dedents it
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: Backspace at start of nested item dedents rather than removes
    Given an authenticated editor has a bullet list with item "Sub-task" at nesting level 2
    And the cursor is at position 0 of "Sub-task"
    When the editor presses Backspace
    Then "Sub-task" is moved to nesting level 1
    And it remains a bullet list item (not converted to paragraph)
    And the CRDT state reflects depth 1 for that item
```

**Test Data:**
- `{ listType: "bullet", item: { text: "Sub-task", depth: 2 }, cursorPosition: 0 }`

**Preconditions:**
- Item is at depth 2
- Cursor is at position 0 of the item text

---

### T-7.2: Backspace at start of level-3 list item dedents to level 2
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: Backspace at start of level-3 item dedents to level 2
    Given an authenticated editor has a bullet list with item "Deep detail" at nesting level 3
    And the cursor is at position 0
    When the editor presses Backspace
    Then "Deep detail" is moved to nesting level 2
    And it remains a list item
    And the CRDT state reflects depth 2
```

**Test Data:**
- `{ listType: "bullet", item: { text: "Deep detail", depth: 3 }, cursorPosition: 0 }`

**Preconditions:**
- Item is at depth 3, cursor at position 0

---

## Boundary Tests

### T-8.1: Tab at maximum nesting depth (level 3) has no effect
**Maps to:** AC-8
**Category:** boundary

```gherkin
  Scenario: Tab on level-3 item does nothing
    Given an authenticated editor has a bullet list with item "Max depth item" at nesting level 3
    And the cursor is in that item
    When the editor presses Tab
    Then the item remains at nesting level 3
    And no error is thrown or displayed
    And the CRDT state is unchanged (no new mutation is dispatched)
```

**Test Data:**
- `{ listType: "bullet", item: { text: "Max depth item", depth: 3 } }`

**Preconditions:**
- Item is already at the maximum nesting depth of 3
- CRDT mutation event listener is attached to verify no spurious mutation fires

---

## Negative / Edge-Case Tests

### T-9.1: Enter on empty level-1 list item exits the list
**Maps to:** AC-9
**Category:** edge-case

```gherkin
  Scenario: Enter on empty top-level list item terminates the list
    Given an authenticated editor has a bullet list with two items: "First item" and "" (empty)
    And the cursor is in the empty second item at level 1
    When the editor presses Enter
    Then the empty list item is removed
    And a new plain paragraph is created below the list
    And the cursor is positioned in that new paragraph
    And the CRDT state shows the list node containing only "First item", followed by a paragraph node
```

**Test Data:**
- `{ listType: "bullet", items: [{ text: "First item", depth: 1 }, { text: "", depth: 1 }], cursorItem: 1 }`

**Preconditions:**
- List has exactly two items; cursor is in the second, which is empty

---

### T-9.2: Enter on empty level-2 list item dedents rather than exits list
**Maps to:** AC-9
**Category:** edge-case

```gherkin
  Scenario: Enter on empty nested item dedents to level 1
    Given an authenticated editor has a bullet list with item "Parent" (level 1) and "" (empty, level 2)
    And the cursor is in the empty level-2 item
    When the editor presses Enter
    Then the empty item is moved to level 1 (dedented)
    And the list is not terminated
    And the cursor remains in the now-level-1 empty item
```

**Test Data:**
- `{ listType: "bullet", items: [{ text: "Parent", depth: 1 }, { text: "", depth: 2 }], cursorItem: 1 }`

**Preconditions:**
- Empty item is at depth 2

---

### T-10.1: Toggle off bullet list converts items to plain paragraphs
**Maps to:** AC-10
**Category:** edge-case

```gherkin
  Scenario: Clicking active bullet list button converts items to paragraphs
    Given an authenticated editor has a bullet list with items "Alpha", "Beta", "Gamma"
    And the cursor is inside the list (or the list items are selected)
    And the "Bullet List" toolbar button is in active state (aria-pressed="true")
    When the editor clicks the "Bullet List" toolbar button
    Then "Alpha", "Beta", "Gamma" become plain paragraphs
    And no bullet markers are visible
    And the CRDT state shows paragraph nodes replacing the list node
    And the "Bullet List" toolbar button shows aria-pressed="false"
```

**Test Data:**
- `{ listType: "bullet", items: ["Alpha", "Beta", "Gamma"] }`

**Preconditions:**
- A bullet list exists and cursor/selection is within it
- Toolbar button reflects active state

---

### T-10.2: Toggle off numbered list converts items to plain paragraphs
**Maps to:** AC-10
**Category:** edge-case

```gherkin
  Scenario: Clicking active numbered list button converts items to paragraphs
    Given an authenticated editor has a numbered list with items "Step one", "Step two"
    And the "Numbered List" toolbar button is in active state
    When the editor clicks the "Numbered List" toolbar button
    Then "Step one" and "Step two" become plain paragraphs preserving their text
    And no number markers are visible
    And the CRDT state shows paragraph nodes
```

**Test Data:**
- `{ listType: "ordered", items: ["Step one", "Step two"] }`

**Preconditions:**
- Numbered list exists; cursor inside list

---

### T-11.1: List changes are visible to other connected users within 500ms
**Maps to:** AC-11
**Category:** happy-path

```gherkin
  Scenario: List mutation propagates to connected editors within 500ms
    Given editor-A and editor-B are both connected to document "doc-collab-01"
    And the document contains a bullet list with item "Shared item"
    When editor-A adds a new bullet list item "New entry" below "Shared item"
    Then within 500ms, editor-B sees the list containing both "Shared item" and "New entry"
    And editor-B's CRDT state reflects the addition
```

**Test Data:**
- `{ documentId: "doc-collab-01", editorA: "user-editor-01", editorB: "user-editor-02", action: "addListItem", newItemText: "New entry" }`

**Preconditions:**
- Two authenticated editor-role users have the document open in separate sessions
- WebSocket connections are both active
- Latency between server and both clients is < 100ms (network controlled test environment)

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to document mutation endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated list mutation is rejected with 401
    Given no authentication token is present in the request headers
    When a POST request is sent to "/api/documents/doc-001/mutations" with body:
      """
      { "type": "list-insert", "listType": "bullet", "position": 0, "text": "Injected item" }
      """
    Then the response status is 401
    And the response body contains { "error": "Unauthorized" }
    And no mutation is applied to the document CRDT state
    And the document "doc-001" remains unchanged
```

**Test Data:**
- `{ endpoint: "POST /api/documents/doc-001/mutations", authHeader: null, body: { type: "list-insert", listType: "bullet", position: 0, text: "Injected item" } }`

**Preconditions:**
- Document "doc-001" exists with a known CRDT state (snapshot taken before request)
- No session cookie or Authorization header in request

---

### T-AUTH-2.1: Viewer role cannot modify lists via UI — buttons disabled
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Viewer user sees list toolbar buttons disabled
    Given an authenticated user with role "viewer" on document "doc-001" opens the document
    When the document renders
    Then the "Bullet List" toolbar button is visually disabled (aria-disabled="true")
    And the "Numbered List" toolbar button is visually disabled (aria-disabled="true")
    And clicking the disabled buttons has no effect
```

**Test Data:**
- `{ documentId: "doc-001", userId: "user-viewer-01", role: "viewer" }`

**Preconditions:**
- User "user-viewer-01" has viewer permission on "doc-001"

---

### T-AUTH-2.2: Commenter role mutation API call returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Commenter role direct API call to insert list item is rejected with 403
    Given an authenticated user with role "commenter" has a valid session token
    When a POST request is sent to "/api/documents/doc-001/mutations" with body:
      """
      { "type": "list-insert", "listType": "bullet", "position": 0, "text": "Unauthorized item" }
      """
    Then the response status is 403
    And the response body contains { "error": "Forbidden" }
    And the CRDT state of "doc-001" is unchanged
```

**Test Data:**
- `{ documentId: "doc-001", userId: "user-commenter-01", role: "commenter", sessionToken: "<valid-commenter-token>" }`

**Preconditions:**
- User "user-commenter-01" has commenter permission (not editor) on "doc-001"
- Session token is valid and not expired

---

---

# Test Specifications: EDIT-03 — Code Blocks

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1, T-5.2 | happy-path |
| AC-6 | T-6.1, T-6.2 | boundary |
| AC-7 | T-7.1, T-7.2 | happy-path |
| AC-8 | T-8.1 | happy-path |
| AC-9 | T-9.1, T-9.2 | edge-case |
| AC-10 | T-10.1, T-10.2 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Insert code block via toolbar button
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Code Blocks

  Scenario: Insert code block via toolbar at cursor position
    Given an authenticated editor opens document "doc-code-01"
    And the document contains paragraphs: "Introduction paragraph" and "Conclusion paragraph"
    And the cursor is at the end of "Introduction paragraph"
    When the editor clicks the "Code Block" toolbar button
    Then a code block node is inserted between "Introduction paragraph" and "Conclusion paragraph"
    And the cursor is positioned inside the new code block
    And the code block renders in monospace font
    And the CRDT state contains a code-block node at the insertion position
```

**Test Data:**
- `{ documentId: "doc-code-01", userId: "user-editor-01", role: "editor", paragraphs: ["Introduction paragraph", "Conclusion paragraph"], cursorParagraph: 0, cursorOffset: "end" }`

**Preconditions:**
- User is authenticated with editor role
- Document exists with two plain paragraphs

---

### T-1.2: Code block toolbar button is not accessible when cursor is inside another code block
**Maps to:** AC-1
**Category:** happy-path (negative control)

```gherkin
  Scenario: Toolbar code block button is unavailable inside existing code block
    Given an authenticated editor has a document with an existing code block
    And the cursor is inside the code block
    Then the "Code Block" toolbar button is visually disabled (aria-disabled="true")
```

**Test Data:**
- `{ documentId: "doc-code-01", cursorContext: "code-block" }`

**Preconditions:**
- Document contains an existing code block; cursor is inside it

---

### T-2.1: Insert code block via slash command /code
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: /code slash command inserts a code block
    Given an authenticated editor has cursor at the start of an empty line in document "doc-code-01"
    When the editor types "/code"
    Then a slash command menu appears
    And "Code Block" is the top result
    When the editor presses Enter to confirm
    Then the line is replaced by a code block node
    And the cursor is positioned inside the code block
    And the CRDT state contains a code-block node at that position
```

**Test Data:**
- `{ documentId: "doc-code-01", slashCommand: "/code", cursorContext: "empty-line-start" }`

**Preconditions:**
- Cursor is at the beginning of an empty line (so "/" triggers the slash command menu)

---

### T-2.2: Slash command menu does not appear mid-word
**Maps to:** AC-2
**Category:** happy-path (negative control)

```gherkin
  Scenario: /code typed mid-sentence does not trigger slash command
    Given an authenticated editor has cursor mid-sentence in "Some text /code more text"
    When the editor types "/code"
    Then no slash command menu appears
    And "/code" is inserted as literal text
```

**Test Data:**
- `{ cursorContext: "mid-paragraph", textBefore: "Some text " }`

**Preconditions:**
- Cursor is not at start of a line/paragraph

---

### T-3.1: Language selector applies syntax highlighting
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Selecting JavaScript applies syntax highlighting to code block
    Given an authenticated editor has a code block with content "const x = 42;"
    And the cursor is inside the code block
    When the editor opens the language picker and selects "JavaScript"
    Then the code block re-renders with JavaScript syntax highlighting
    And keywords and values are visually styled differently
    And the CRDT state stores "javascript" as the language attribute of the code-block node
```

**Test Data:**
- `{ codeBlockContent: "const x = 42;", selectedLanguage: "javascript" }`

**Preconditions:**
- Document has an existing code block with content
- Language picker is accessible while cursor is inside the block

---

### T-3.2: Language selector cycles through all supported languages
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: All supported languages appear in the language picker
    Given an authenticated editor has a code block and opens the language picker
    Then the picker contains exactly the options: "JavaScript", "Python", "Go", "SQL", "Bash", "JSON", "Plain Text"
    And no other language options are present
```

**Test Data:**
- `{ expectedLanguages: ["javascript", "python", "go", "sql", "bash", "json", "plain"] }`

**Preconditions:**
- Cursor is inside a code block

---

### T-4.1: Code block without language selection defaults to plain text
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Newly inserted code block defaults to plain text rendering
    Given an authenticated editor inserts a code block without selecting a language
    When the editor types "SELECT * FROM users;" into the code block
    Then the content renders without any syntax coloring
    And no error or empty-language indicator is shown
    And the CRDT state stores the language attribute as "plain" (or null, depending on implementation)
```

**Test Data:**
- `{ codeBlockContent: "SELECT * FROM users;", language: null }`

**Preconditions:**
- Code block was inserted via toolbar without language selection

---

### T-5.1: Tab inside code block inserts literal tab character
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Tab key inserts literal whitespace inside code block
    Given an authenticated editor has a code block with content "function foo() {"
    And the cursor is at the start of the second line inside the block
    When the editor presses Tab
    Then a tab character (or 4 spaces, per SPIKE-01 decision) is inserted at the cursor position
    And the cursor does not move to the next UI focus element
    And the code block content now starts with the tab/indent followed by remaining text
```

**Test Data:**
- `{ codeBlockContent: "function foo() {\n", cursorLine: 2, cursorOffset: 0 }`

**Preconditions:**
- Cursor is at position 0 on the second line of the code block
- Tab behavior (tab char vs 4 spaces) matches the SPIKE-01 decision configured for this test suite

---

### T-5.2: Tab outside code block indents list (not a code-block concern, verifying no cross-contamination)
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Tab in a list item does not insert literal tab
    Given an authenticated editor has cursor in a bullet list item (not inside any code block)
    When the editor presses Tab
    Then the list item is indented (not a literal tab character inserted)
```

**Test Data:**
- `{ cursorContext: "list-item", listItemText: "Some item", depth: 1 }`

**Preconditions:**
- Cursor is inside a list item, not a code block

---

## Boundary Tests

### T-6.1: Bold shortcut disabled inside code block
**Maps to:** AC-6
**Category:** boundary

```gherkin
  Scenario: Cmd+B inside code block has no effect
    Given an authenticated editor has cursor inside a code block containing "hello world"
    And the editor selects "world"
    When the editor presses Cmd+B (or Ctrl+B on Windows/Linux)
    Then no bold formatting is applied
    And "world" renders as plain text within the code block
    And the CRDT state for the code block contains no bold mark on "world"
    And the toolbar "Bold" button is visually disabled (aria-disabled="true")
```

**Test Data:**
- `{ codeBlockContent: "hello world", selection: { start: 6, end: 11 }, shortcut: "Cmd+B" }`

**Preconditions:**
- Cursor/selection is within a code block

---

### T-6.2: Italic and underline shortcuts disabled inside code block
**Maps to:** AC-6
**Category:** boundary

```gherkin
  Scenario: Cmd+I and Cmd+U inside code block have no effect
    Given an authenticated editor has text selected inside a code block
    When the editor presses Cmd+I (italic)
    Then no italic formatting is applied
    When the editor presses Cmd+U (underline)
    Then no underline formatting is applied
    And the toolbar "Italic" and "Underline" buttons are visually disabled
```

**Test Data:**
- `{ codeBlockContent: "styled text", selection: { start: 0, end: 6 } }`

**Preconditions:**
- Selection is inside a code block

---

### T-7.1: Typing markdown-like syntax inside code block is treated as literal text
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: **bold** typed in code block renders as asterisks, not bold
    Given an authenticated editor has an empty code block
    When the editor types "**bold**"
    Then the code block contains the literal text "**bold**"
    And no bold formatting is applied
    And the rendered output shows the asterisks as visible characters
```

**Test Data:**
- `{ input: "**bold**", expectedRendered: "**bold**" }`

**Preconditions:**
- Cursor is inside a code block

---

### T-7.2: Typing URL-like strings in code block is not auto-linked
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: URL typed in code block is not converted to a hyperlink
    Given an authenticated editor has an empty code block
    When the editor types "https://example.com"
    Then the code block contains the literal text "https://example.com"
    And no anchor element is created
```

**Test Data:**
- `{ input: "https://example.com" }`

**Preconditions:**
- Cursor is inside a code block

---

### T-8.1: Code block insert propagates to connected editors within 500ms
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: Code block insertion is visible to other connected editors within 500ms
    Given editor-A and editor-B are both connected to document "doc-collab-02"
    When editor-A inserts a code block containing "print('hello')" with language "Python"
    Then within 500ms, editor-B sees the code block in the document
    And editor-B's view shows "print('hello')" with Python syntax highlighting
    And editor-B's CRDT state includes the new code-block node
```

**Test Data:**
- `{ documentId: "doc-collab-02", editorA: "user-editor-01", editorB: "user-editor-02", codeContent: "print('hello')", language: "python" }`

**Preconditions:**
- Two editor-role users have the document open in separate sessions
- Both WebSocket connections are active

---

## Negative / Edge-Case Tests

### T-9.1: Deleting a code block via Backspace before it removes it entirely
**Maps to:** AC-9
**Category:** edge-case

```gherkin
  Scenario: Backspace immediately before a code block removes it
    Given an authenticated editor has a paragraph "Before block" followed by a code block containing "some code"
    And the cursor is at the end of "Before block"
    When the editor presses Backspace
    Then the code block and its content "some code" are removed from the document
    And the CRDT state no longer contains the code-block node
    And the paragraph "Before block" remains
```

**Test Data:**
- `{ paragraphBefore: "Before block", codeBlockContent: "some code", cursorPosition: "end-of-paragraph-before" }`

**Preconditions:**
- Cursor is immediately before (adjacent to) the code block

---

### T-9.2: Deleting code block via context menu
**Maps to:** AC-9
**Category:** edge-case

```gherkin
  Scenario: Context menu delete removes code block
    Given an authenticated editor right-clicks on a code block containing "SELECT 1"
    When the context menu appears and the editor selects "Delete Block"
    Then the code block is removed from the document
    And the CRDT state does not contain the code-block node
```

**Test Data:**
- `{ codeBlockContent: "SELECT 1" }`

**Preconditions:**
- A context menu with a "Delete Block" action is implemented for code blocks

---

### T-10.1: Enter inside empty code block inserts a newline (does not exit block)
**Maps to:** AC-10
**Category:** edge-case

```gherkin
  Scenario: Enter in empty code block adds a newline, not exit
    Given an authenticated editor has an empty code block with cursor inside it
    When the editor presses Enter
    Then a new empty line is inserted within the code block
    And the cursor moves to the new line inside the code block
    And the code block is still active in the CRDT state
    And no paragraph node is created outside the code block
```

**Test Data:**
- `{ codeBlockContent: "", cursorPosition: 0 }`

**Preconditions:**
- Code block exists and is completely empty; cursor is inside it

---

### T-10.2: Escape or arrow key past boundary exits code block
**Maps to:** AC-10
**Category:** edge-case

```gherkin
  Scenario: Pressing Escape exits the code block
    Given an authenticated editor has cursor inside a code block containing "exit test"
    When the editor presses Escape
    Then the cursor moves outside the code block
    And the code block itself is not deleted
    And the cursor is positioned in the nearest paragraph node adjacent to the block
```

**Test Data:**
- `{ codeBlockContent: "exit test" }`

**Preconditions:**
- Cursor is inside a code block

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated mutation request returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Code block insert API call without authentication is rejected
    Given no authentication token is present in the request headers
    When a POST request is sent to "/api/documents/doc-code-01/mutations" with body:
      """
      { "type": "code-block-insert", "position": 0, "language": "javascript", "content": "const evil = true;" }
      """
    Then the response status is 401
    And the response body contains { "error": "Unauthorized" }
    And no mutation is applied to the CRDT state of document "doc-code-01"
```

**Test Data:**
- `{ endpoint: "POST /api/documents/doc-code-01/mutations", authHeader: null }`

**Preconditions:**
- No Authorization header or session cookie; document "doc-code-01" exists in a known state

---

### T-AUTH-2.1: Viewer user sees code block insertion UI disabled
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Viewer role cannot access code block toolbar button
    Given an authenticated user with role "viewer" opens document "doc-code-01"
    When the document renders
    Then the "Code Block" toolbar button is visually disabled (aria-disabled="true")
    And clicking the button has no effect
    And the slash command "/code" does not produce a code block insertion
```

**Test Data:**
- `{ documentId: "doc-code-01", userId: "user-viewer-01", role: "viewer" }`

**Preconditions:**
- User has viewer permission on the document

---

### T-AUTH-2.2: Commenter role direct API code block insertion returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Commenter role API call to insert code block is rejected with 403
    Given an authenticated user with role "commenter" has a valid session token
    When a POST request is sent to "/api/documents/doc-code-01/mutations" with body:
      """
      { "type": "code-block-insert", "position": 0, "language": "python", "content": "print('hacked')" }
      """
    Then the response status is 403
    And the response body contains { "error": "Forbidden" }
    And the CRDT state of "doc-code-01" is unchanged
```

**Test Data:**
- `{ documentId: "doc-code-01", userId: "user-commenter-01", role: "commenter", sessionToken: "<valid-commenter-token>" }`

**Preconditions:**
- User "user-commenter-01" has commenter (not editor) permission on "doc-code-01"

---

---

# Test Specifications: EDIT-04 — Tables

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2, T-1.3 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1, T-4.2 | happy-path |
| AC-5 | T-5.1, T-5.2 | happy-path |
| AC-6 | T-6.1, T-6.2 | happy-path |
| AC-7 | T-7.1, T-7.2 | happy-path |
| AC-8 | T-8.1, T-8.2 | happy-path |
| AC-9 | T-9.1, T-9.2 | happy-path |
| AC-10 | T-10.1, T-10.2 | happy-path |
| AC-11 | T-11.1, T-11.2 | boundary |
| AC-12 | T-12.1 | happy-path |
| AC-13 | T-13.1, T-13.2 | boundary |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Insert default 2×2 table via toolbar
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Tables

  Scenario: Insert a default 2x2 table at cursor position
    Given an authenticated editor opens document "doc-table-01"
    And the document contains a paragraph "Intro text"
    And the cursor is at the end of "Intro text"
    When the editor opens the table insertion UI
    And the editor confirms the default dimensions (2 rows × 2 columns)
    Then a 2×2 table is inserted below "Intro text"
    And all four cells are empty
    And the cursor is positioned in cell (row 1, column 1)
    And the CRDT state contains a table node with 2 rows and 2 columns
```

**Test Data:**
- `{ documentId: "doc-table-01", userId: "user-editor-01", role: "editor", dimensions: { rows: 2, cols: 2 } }`

**Preconditions:**
- User is authenticated with editor role
- Document "doc-table-01" contains at least one paragraph

---

### T-1.2: Insert custom-sized table (4 rows × 5 columns) via toolbar
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Insert a 4x5 table with custom dimensions
    Given an authenticated editor opens the table insertion UI
    When the editor sets row count to 4 and column count to 5, then confirms
    Then a 4×5 table is inserted with all cells empty
    And the CRDT state contains a table node with 4 rows and 5 columns
    And the cursor is in cell (row 1, column 1)
```

**Test Data:**
- `{ dimensions: { rows: 4, cols: 5 } }`

**Preconditions:**
- User is authenticated with editor role

---

### T-1.3: Table insertion at a valid cursor position in the document body
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Table inserts between two paragraphs
    Given a document has "Paragraph A" and "Paragraph B"
    And the cursor is at the end of "Paragraph A"
    When the editor inserts a 2×2 table
    Then the table appears between "Paragraph A" and "Paragraph B"
    And neither paragraph is modified
```

**Test Data:**
- `{ paragraphs: ["Paragraph A", "Paragraph B"], dimensions: { rows: 2, cols: 2 } }`

**Preconditions:**
- Cursor is between two paragraphs

---

### T-2.1: Tab moves cursor to next cell in same row
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Tab navigates from cell (1,1) to cell (1,2)
    Given an authenticated editor has a 2×3 table with content in all cells
    And the cursor is in cell (row 1, column 1) containing "A1"
    When the editor presses Tab
    Then the cursor moves to cell (row 1, column 2) containing "A2"
    And no new content is inserted
```

**Test Data:**
- `{ tableData: [["A1","A2","A3"],["B1","B2","B3"]], cursorCell: { row: 1, col: 1 } }`

**Preconditions:**
- Table has 2 rows and 3 columns; cursor is in first cell

---

### T-2.2: Tab at end of row moves cursor to first cell of next row
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Tab in last cell of a row moves to first cell of next row
    Given an authenticated editor has a 2×3 table
    And the cursor is in cell (row 1, column 3) — the last cell of row 1
    When the editor presses Tab
    Then the cursor moves to cell (row 2, column 1)
```

**Test Data:**
- `{ tableData: [["A1","A2","A3"],["B1","B2","B3"]], cursorCell: { row: 1, col: 3 } }`

**Preconditions:**
- Cursor is in the last column of a non-final row

---

### T-3.1: Shift+Tab moves cursor to previous cell
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Shift+Tab navigates from cell (1,2) to cell (1,1)
    Given an authenticated editor has a 2×3 table
    And the cursor is in cell (row 1, column 2) containing "A2"
    When the editor presses Shift+Tab
    Then the cursor moves to cell (row 1, column 1) containing "A1"
```

**Test Data:**
- `{ tableData: [["A1","A2","A3"],["B1","B2","B3"]], cursorCell: { row: 1, col: 2 } }`

**Preconditions:**
- Cursor is not in the first cell

---

### T-4.1: Tab in last cell of last row creates a new row
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Tab in last cell of last row appends a new empty row
    Given an authenticated editor has a 2×2 table
    And the cursor is in cell (row 2, column 2) — the last cell of the table
    When the editor presses Tab
    Then a new empty row (row 3) is appended to the table
    And the cursor moves to cell (row 3, column 1)
    And the CRDT state reflects the table now has 3 rows
```

**Test Data:**
- `{ tableData: [["A1","A2"],["B1","B2"]], cursorCell: { row: 2, col: 2 } }`

**Preconditions:**
- Cursor is in the last cell (final row, final column)

---

### T-4.2: Tab in last cell of last row — new row is empty
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: New row appended by Tab contains only empty cells
    Given an authenticated editor presses Tab in the last cell of a 3×4 table
    Then the new row has exactly 4 empty cells
    And no content is pre-filled in the new row
```

**Test Data:**
- `{ tableData: "3×4 table with any content", cursorCell: { row: 3, col: 4 } }`

**Preconditions:**
- Cursor is in the last cell of the last row of a 3×4 table

---

### T-5.1: Add row above via context menu
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Insert Row Above inserts a new empty row before the current row
    Given an authenticated editor has a 3×2 table with rows: ["R1C1","R1C2"], ["R2C1","R2C2"], ["R3C1","R3C2"]
    When the editor right-clicks on row 2 and selects "Insert Row Above"
    Then a new empty row is inserted before row 2
    And the table now has 4 rows
    And the original rows 2 and 3 shift to become rows 3 and 4
    And the CRDT state reflects 4 rows in the table node
```

**Test Data:**
- `{ tableRows: [["R1C1","R1C2"],["R2C1","R2C2"],["R3C1","R3C2"]], targetRow: 2, action: "Insert Row Above" }`

**Preconditions:**
- Table has 3 rows; editor right-clicks on row 2

---

### T-5.2: Add row below via context menu
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Insert Row Below inserts a new empty row after the current row
    Given an authenticated editor has a 2×2 table
    And the editor right-clicks on row 1
    When the editor selects "Insert Row Below"
    Then a new empty row is inserted after row 1
    And the table has 3 rows
    And the original row 2 is now row 3
```

**Test Data:**
- `{ tableRows: [["A1","A2"],["B1","B2"]], targetRow: 1, action: "Insert Row Below" }`

**Preconditions:**
- Table has 2 rows; right-click is on row 1

---

### T-6.1: Remove row via context menu
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Delete Row removes the targeted row and reflows layout
    Given an authenticated editor has a 3×2 table with rows: ["R1C1","R1C2"], ["R2C1","R2C2"], ["R3C1","R3C2"]
    When the editor right-clicks on row 2 and selects "Delete Row"
    Then row 2 (["R2C1","R2C2"]) is removed from the table
    And the table now has 2 rows: ["R1C1","R1C2"] and ["R3C1","R3C2"]
    And the table layout reflows (no empty gaps)
    And the CRDT state reflects 2 rows
```

**Test Data:**
- `{ tableRows: [["R1C1","R1C2"],["R2C1","R2C2"],["R3C1","R3C2"]], targetRow: 2 }`

**Preconditions:**
- Table has more than 1 row

---

### T-6.2: Delete Row with content — content is discarded
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Deleting a row with content removes that content from the document
    Given an authenticated editor has a 2×2 table
    And row 2 contains "Important data" and "More data"
    When the editor right-clicks row 2 and selects "Delete Row"
    Then "Important data" and "More data" are no longer in the document
    And the CRDT state contains no reference to those text values in the table
```

**Test Data:**
- `{ tableRows: [["Header A","Header B"],["Important data","More data"]], targetRow: 2 }`

**Preconditions:**
- Table has exactly 2 rows; row 2 has non-empty content

---

### T-7.1: Add column to the left via context menu
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: Insert Column Left inserts empty column before targeted column
    Given an authenticated editor has a 2×2 table: [["A","B"],["C","D"]]
    When the editor right-clicks on column 2 and selects "Insert Column Left"
    Then a new empty column is inserted before column 2
    And the table is now 2×3: [["A","","B"],["C","","D"]]
    And the CRDT state reflects 3 columns in the table node
```

**Test Data:**
- `{ tableData: [["A","B"],["C","D"]], targetColumn: 2, action: "Insert Column Left" }`

**Preconditions:**
- Table has 2 columns; right-click on column 2

---

### T-7.2: Add column to the right via context menu
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: Insert Column Right inserts empty column after targeted column
    Given an authenticated editor has a 2×2 table: [["A","B"],["C","D"]]
    When the editor right-clicks on column 1 and selects "Insert Column Right"
    Then a new empty column is inserted after column 1
    And the table is now 2×3: [["A","","B"],["C","","D"]]
```

**Test Data:**
- `{ tableData: [["A","B"],["C","D"]], targetColumn: 1, action: "Insert Column Right" }`

**Preconditions:**
- Table has 2 columns; right-click on column 1

---

### T-8.1: Remove column via context menu removes column and its content
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: Delete Column removes the targeted column and reflows layout
    Given an authenticated editor has a 2×3 table: [["A","B","C"],["D","E","F"]]
    When the editor right-clicks on column 2 and selects "Delete Column"
    Then column 2 (values "B" and "E") is removed from the table
    And the table is now 2×2: [["A","C"],["D","F"]]
    And the CRDT state reflects 2 columns
```

**Test Data:**
- `{ tableData: [["A","B","C"],["D","E","F"]], targetColumn: 2 }`

**Preconditions:**
- Table has more than 1 column

---

### T-8.2: Delete Column content is discarded from CRDT
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: Content of deleted column is not present in document state
    Given an authenticated editor deletes column 2 containing "Sensitive data"
    Then "Sensitive data" is not present in the CRDT state of the table
```

**Test Data:**
- `{ deletedColumnValues: ["Sensitive data", "More sensitive"] }`

**Preconditions:**
- Column 2 contains non-empty content before deletion

---

### T-9.1: Toggle header row makes first row visually distinct
**Maps to:** AC-9
**Category:** happy-path

```gherkin
  Scenario: Toggle Header Row applies header styling to first row
    Given an authenticated editor has a 3×3 table with no header row
    When the editor activates "Toggle Header Row"
    Then the first row is visually distinguished (bold text and/or shaded background)
    And the first row cells are rendered as <th> elements in the DOM
    And the CRDT state stores a "hasHeader: true" attribute on the table node
```

**Test Data:**
- `{ tableData: [["Col1","Col2","Col3"],["R1C1","R1C2","R1C3"],["R2C1","R2C2","R2C3"]], initialHeader: false }`

**Preconditions:**
- Table exists with no header row

---

### T-9.2: Toggle header row again removes header styling
**Maps to:** AC-9
**Category:** happy-path

```gherkin
  Scenario: Toggling header row off removes header styling
    Given an authenticated editor has a table with header row enabled
    When the editor activates "Toggle Header Row" again
    Then the first row reverts to regular cell styling
    And first row cells are rendered as <td> elements (not <th>)
    And the CRDT state stores "hasHeader: false" on the table node
```

**Test Data:**
- `{ initialHeader: true }`

**Preconditions:**
- Table has header row currently enabled

---

### T-10.1: Bold formatting applies within a cell only
**Maps to:** AC-10
**Category:** happy-path

```gherkin
  Scenario: Bold applied in one cell does not affect other cells
    Given an authenticated editor has a 2×2 table with content: [["Alpha","Beta"],["Gamma","Delta"]]
    And the editor selects "Alpha" in cell (row 1, column 1)
    When the editor presses Cmd+B
    Then "Alpha" in cell (1,1) is bold
    And "Beta", "Gamma", "Delta" in other cells remain unformatted
    And the CRDT state carries a bold mark only on the "Alpha" text node
```

**Test Data:**
- `{ tableData: [["Alpha","Beta"],["Gamma","Delta"]], targetCell: { row: 1, col: 1 }, selectedText: "Alpha" }`

**Preconditions:**
- Table exists with content; cursor selection covers only "Alpha"

---

### T-10.2: Heading mark applies within a cell only
**Maps to:** AC-10
**Category:** happy-path

```gherkin
  Scenario: Heading formatting in one cell does not affect adjacent cells
    Given a 2×2 table with text in all cells
    And the editor places cursor in cell (row 2, column 2) containing "Delta"
    When the editor applies Heading 2 formatting
    Then cell (2,2) renders "Delta" as a Heading 2
    And cells (1,1), (1,2), (2,1) retain their original styling
```

**Test Data:**
- `{ targetCell: { row: 2, col: 2 }, format: "heading-2" }`

**Preconditions:**
- Table has content in all cells

---

## Boundary Tests

### T-11.1: Cannot delete the last row of a table
**Maps to:** AC-11
**Category:** boundary

```gherkin
  Scenario: Delete Row is disabled when table has exactly one row
    Given an authenticated editor has a table with exactly 1 row and 2 columns
    When the editor right-clicks on the only row
    Then the "Delete Row" context menu option is either hidden or disabled
    And the table is not modified
    And the CRDT state is unchanged
```

**Test Data:**
- `{ tableData: [["Only","Row"]], rows: 1, cols: 2 }`

**Preconditions:**
- Table has exactly 1 row

---

### T-11.2: Cannot delete the last column of a table
**Maps to:** AC-11
**Category:** boundary

```gherkin
  Scenario: Delete Column is disabled when table has exactly one column
    Given an authenticated editor has a table with 3 rows and exactly 1 column
    When the editor right-clicks on the only column
    Then the "Delete Column" context menu option is either hidden or disabled
    And the CRDT state is unchanged
```

**Test Data:**
- `{ tableData: [["R1"],["R2"],["R3"]], rows: 3, cols: 1 }`

**Preconditions:**
- Table has exactly 1 column

---

### T-12.1: Table changes are visible to connected editors within 500ms
**Maps to:** AC-12
**Category:** happy-path

```gherkin
  Scenario: Table row addition propagates to connected editors within 500ms
    Given editor-A and editor-B are both connected to document "doc-collab-03"
    And the document contains a 2×2 table
    When editor-A right-clicks row 1 and selects "Insert Row Below"
    Then within 500ms, editor-B sees the table now has 3 rows
    And editor-B's CRDT state reflects the table node with 3 rows
```

**Test Data:**
- `{ documentId: "doc-collab-03", editorA: "user-editor-01", editorB: "user-editor-02", action: "Insert Row Below", targetRow: 1 }`

**Preconditions:**
- Both users have editor role; both WebSocket connections are active

---

### T-13.1: Nested table insertion is blocked via toolbar
**Maps to:** AC-13
**Category:** boundary

```gherkin
  Scenario: Table toolbar button is disabled when cursor is inside a table cell
    Given an authenticated editor has cursor inside a table cell
    When the editor views the toolbar
    Then the "Insert Table" toolbar button is visually disabled (aria-disabled="true")
    And clicking it has no effect
    And no nested table is created
```

**Test Data:**
- `{ cursorContext: "table-cell", tableData: [["cursor here","B"],["C","D"]] }`

**Preconditions:**
- Cursor is inside a table cell

---

### T-13.2: Nested table insertion is blocked via slash command
**Maps to:** AC-13
**Category:** boundary

```gherkin
  Scenario: /table slash command inside a cell produces no-op or informational message
    Given an authenticated editor has cursor inside a table cell
    When the editor types "/table" or uses the slash command to insert a table
    Then either:
      - The slash command menu does not show the table option, or
      - Selecting "Insert Table" displays: "Tables cannot be nested"
    And no nested table node is created in the CRDT state
```

**Test Data:**
- `{ cursorContext: "table-cell", slashCommand: "/table" }`

**Preconditions:**
- Cursor is inside a table cell; slash command is typed

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated table mutation request returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated request to table mutation endpoint is rejected
    Given no authentication token is present
    When a POST request is sent to "/api/documents/doc-table-01/mutations" with body:
      """
      { "type": "table-insert", "position": 0, "rows": 2, "cols": 2 }
      """
    Then the response status is 401
    And the response body contains { "error": "Unauthorized" }
    And the CRDT state of "doc-table-01" is unchanged
```

**Test Data:**
- `{ endpoint: "POST /api/documents/doc-table-01/mutations", authHeader: null, body: { type: "table-insert", position: 0, rows: 2, cols: 2 } }`

**Preconditions:**
- No auth token; document "doc-table-01" has a known state (snapshot taken before request)

---

### T-AUTH-2.1: Viewer role sees table insert UI disabled
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Viewer role sees all table mutation UI disabled
    Given an authenticated user with role "viewer" opens document "doc-table-01"
    When the document renders
    Then the "Insert Table" toolbar button is visually disabled
    And right-clicking on a table shows no "Insert Row", "Insert Column", "Delete Row", "Delete Column" options
```

**Test Data:**
- `{ documentId: "doc-table-01", userId: "user-viewer-01", role: "viewer" }`

**Preconditions:**
- User has viewer permission; document contains an existing table

---

### T-AUTH-2.2: Commenter role direct API table mutation returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Commenter direct API call for table row insert is rejected with 403
    Given an authenticated user with role "commenter" has a valid session token
    When a POST request is sent to "/api/documents/doc-table-01/mutations" with body:
      """
      { "type": "table-row-insert", "tableId": "tbl-001", "position": 1 }
      """
    Then the response status is 403
    And the response body contains { "error": "Forbidden" }
    And the table "tbl-001" CRDT state is unchanged
```

**Test Data:**
- `{ documentId: "doc-table-01", userId: "user-commenter-01", role: "commenter", sessionToken: "<valid-commenter-token>", body: { type: "table-row-insert", tableId: "tbl-001", position: 1 } }`

**Preconditions:**
- User "user-commenter-01" has commenter permission; "tbl-001" exists inside "doc-table-01"

---

---

# Test Specifications: EDIT-05 — Image Insertion via File Upload

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2, T-1.3 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1, T-4.2 | happy-path |
| AC-5 | T-5.1, T-5.2 | happy-path |
| AC-6 | T-6.1, T-6.2 | happy-path |
| AC-7 | T-7.1, T-7.2 | error-handling |
| AC-8 | T-8.1, T-8.2 | error-handling |
| AC-9 | T-9.1, T-9.2 | error-handling |
| AC-10 | T-10.1, T-10.2 | boundary |
| AC-11 | T-11.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1, T-AUTH-1.2 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2, T-AUTH-2.3 | security |

---

## Test Cases

### T-1.1: Insert PNG image via file picker — happy path
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Image Insertion via File Upload

  Scenario: Upload a valid PNG via file picker inserts image inline
    Given an authenticated editor opens document "doc-img-01"
    And the cursor is at the end of a paragraph "Description here"
    When the editor clicks the "Insert Image" toolbar button
    And selects file "test-image.png" (500KB, 800×600 PNG) from the file picker
    Then the image is uploaded to S3-compatible storage
    And the returned URL "https://storage.example.com/uploads/test-image.png" is stored in the CRDT state as an image node
    And the image renders inline at the cursor position
    And the image renders at its natural width (800px) or 100% of column width if that exceeds column width
```

**Test Data:**
- `{ documentId: "doc-img-01", userId: "user-editor-01", role: "editor", file: { name: "test-image.png", type: "image/png", size: 512000, dimensions: "800x600" } }`
- S3 bucket: `uploads.example.com`, expected URL pattern: `https://storage.example.com/uploads/<uuid>.png`

**Preconditions:**
- User is authenticated with editor role
- S3-compatible storage is configured and reachable
- File `test-image.png` exists in test fixture directory

---

### T-1.2: Insert JPG image via file picker
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Upload a valid JPG via file picker inserts image inline
    Given an authenticated editor opens document "doc-img-01"
    And the cursor is at an insertion point
    When the editor clicks the "Insert Image" toolbar button and selects "photo.jpg" (2MB, 1920×1080 JPEG)
    Then the image is uploaded to S3
    And the CRDT image node stores an HTTPS URL
    And the image renders inline
```

**Test Data:**
- `{ file: { name: "photo.jpg", type: "image/jpeg", size: 2097152, dimensions: "1920x1080" } }`

**Preconditions:**
- User is authenticated with editor role; S3 available

---

### T-1.3: Insert GIF and WebP via file picker
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: GIF and WebP uploads succeed and render inline
    Given an authenticated editor inserts "animation.gif" (1MB) via file picker
    Then the GIF is uploaded and renders inline as an image node

    Given an authenticated editor inserts "photo.webp" (1.5MB) via file picker
    Then the WebP is uploaded and renders inline as an image node
```

**Test Data:**
- `{ files: [{ name: "animation.gif", type: "image/gif", size: 1048576 }, { name: "photo.webp", type: "image/webp", size: 1572864 }] }`

**Preconditions:**
- Both files exist in test fixture directory

---

### T-2.1: Insert image via drag-and-drop on the document editor area
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Drag and drop a valid PNG onto the editor area inserts it inline
    Given an authenticated editor has document "doc-img-01" open
    When the editor drags "banner.png" (3MB, 1200×400 PNG) from their filesystem and drops it onto the editor area
    Then the image is uploaded to S3
    And the CRDT state stores the S3 URL as an image node at the drop position
    And the image renders inline at the drop location
```

**Test Data:**
- `{ file: { name: "banner.png", type: "image/png", size: 3145728, dimensions: "1200x400" }, dropTarget: "editor-area" }`

**Preconditions:**
- User is authenticated with editor role
- Test environment supports simulated drag-and-drop events

---

### T-2.2: Drag-and-drop fires at the correct document position
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Dropped image inserts at drop coordinates, not cursor position
    Given an authenticated editor has a document with paragraphs "Top" and "Bottom"
    And the cursor is in "Top"
    When the editor drags "icon.png" (100KB) and drops it between "Top" and "Bottom"
    Then the image node is inserted between the two paragraphs
    And it is not inserted at the cursor position in "Top"
```

**Test Data:**
- `{ file: { name: "icon.png", type: "image/png", size: 102400 }, dropBetweenParagraphs: ["Top","Bottom"] }`

**Preconditions:**
- Document has two paragraphs; cursor is in first but drop is between them

---

### T-3.1: CRDT state stores URL, not base64
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Image node in CRDT contains HTTPS URL, no base64
    Given an authenticated editor has uploaded "diagram.png" (200KB)
    When the CRDT document state is inspected after insertion
    Then the image node contains an attribute "url" matching the pattern "^https://storage\\.example\\.com/"
    And the image node does not contain any attribute with a value starting with "data:image"
    And the document CRDT payload size has not increased by ~267KB (base64 overhead) from the upload
```

**Test Data:**
- `{ file: { name: "diagram.png", type: "image/png", size: 204800 }, expectedUrlPattern: "^https://storage\\.example\\.com/uploads/[a-f0-9-]+\\.png$" }`

**Preconditions:**
- Image has been successfully uploaded; CRDT state is accessible for inspection

---

### T-4.1: Upload progress indicator is displayed during upload
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Loading placeholder appears during image upload
    Given an authenticated editor initiates upload of "large-image.jpg" (9MB)
    When the upload is in progress (before S3 confirms receipt)
    Then a loading placeholder (spinner or skeleton block) appears at the insertion point
    And the editor can continue typing in other parts of the document during the upload
    And the placeholder remains until the upload completes
```

**Test Data:**
- `{ file: { name: "large-image.jpg", type: "image/jpeg", size: 9437184 } }`

**Preconditions:**
- Network speed is throttled in test environment to ensure upload takes > 1 second

---

### T-4.2: Editor remains usable during upload
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Editor is not blocked while image upload is in progress
    Given an authenticated editor has initiated an image upload (9MB file)
    And the upload is still in progress (loading placeholder visible)
    When the editor types "Additional text" in a different paragraph
    Then "Additional text" appears immediately in the other paragraph
    And the editor does not freeze or lose input focus
    And the image upload continues in the background
```

**Test Data:**
- `{ uploadFile: "large-image.jpg", typingTarget: "paragraph-below", typedText: "Additional text" }`

**Preconditions:**
- Upload in progress; editor has another paragraph to type in

---

### T-5.1: Alt text field appears when image is selected
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Clicking on inserted image shows alt text input
    Given an authenticated editor has an inserted image in document "doc-img-01"
    When the editor clicks on the image
    Then an alt text input field appears (in a floating toolbar or side panel)
    And the input field is empty if no alt text has been set
    When the editor types "A bar chart showing Q3 revenue"
    Then the alt text "A bar chart showing Q3 revenue" is stored in the CRDT image node
    And the DOM <img> element has alt="A bar chart showing Q3 revenue"
```

**Test Data:**
- `{ imageNodeId: "img-node-001", altText: "A bar chart showing Q3 revenue" }`

**Preconditions:**
- Image has been successfully inserted in the document

---

### T-5.2: Alt text persists across sessions
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Alt text stored in CRDT is visible when document is reopened
    Given an authenticated editor set alt text "Company logo" on an image in document "doc-img-01"
    When a different editor opens document "doc-img-01"
    Then the image renders with alt="Company logo"
    And clicking the image shows the alt text field pre-filled with "Company logo"
```

**Test Data:**
- `{ documentId: "doc-img-01", imageAltText: "Company logo", openedByUserId: "user-editor-02" }`

**Preconditions:**
- Alt text was previously saved; document is reopened by a second editor

---

### T-6.1: Image width changes via resize handle
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Dragging resize handle changes image width proportionally
    Given an authenticated editor has an image inserted at 100% width in document "doc-img-01"
    When the editor drags the right resize handle leftward to 50% of the column width
    Then the image displays at 50% of the editor column width
    And the image height scales proportionally (maintains aspect ratio)
    And the CRDT image node stores "width: 50%" (or equivalent percentage)
```

**Test Data:**
- `{ initialWidth: "100%", targetWidth: "50%", imageNodeId: "img-node-001" }`

**Preconditions:**
- Image is selected; resize handles are visible

---

### T-6.2: Resize change is visible to all connected editors
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Image resize propagates to connected editors
    Given editor-A and editor-B are connected to document "doc-collab-img"
    And both see an image at 100% width
    When editor-A resizes the image to 75% width
    Then editor-B sees the image at 75% width within 500ms
    And editor-B's CRDT state stores "width: 75%" on the image node
```

**Test Data:**
- `{ documentId: "doc-collab-img", editorA: "user-editor-01", editorB: "user-editor-02", newWidth: "75%" }`

**Preconditions:**
- Both editors have the document open; image exists at 100% width

---

## Error Handling Tests

### T-7.1: Unsupported file type is rejected before upload
**Maps to:** AC-7
**Category:** error-handling

```gherkin
  Scenario: SVG file upload is rejected with informational error
    Given an authenticated editor attempts to upload "diagram.svg" (50KB)
    When the file is selected via the file picker
    Then the upload does not proceed (no HTTP request to S3 or upload endpoint)
    And an inline error message reads "Only PNG, JPG, GIF, and WebP images are supported"
    And no CRDT mutation is made
    And the cursor position remains unchanged
```

**Test Data:**
- `{ file: { name: "diagram.svg", type: "image/svg+xml", size: 51200 } }`

**Preconditions:**
- Client-side validation is implemented before upload initiates

---

### T-7.2: PDF and TIFF files are rejected before upload
**Maps to:** AC-7
**Category:** error-handling

```gherkin
  Scenario: PDF and TIFF uploads are rejected with the same error message
    Given an authenticated editor attempts to upload "report.pdf" (2MB)
    When the file is selected via the file picker
    Then the inline error message reads "Only PNG, JPG, GIF, and WebP images are supported"
    And no upload request is initiated

    Given the editor then attempts to upload "scan.tiff" (3MB)
    Then the same inline error message is shown
    And no upload request is initiated
```

**Test Data:**
- `{ files: [{ name: "report.pdf", type: "application/pdf", size: 2097152 }, { name: "scan.tiff", type: "image/tiff", size: 3145728 }] }`

**Preconditions:**
- Client-side validation rejects non-allowed MIME types

---

### T-8.1: File exceeding 10MB is rejected client-side before upload
**Maps to:** AC-8
**Category:** error-handling

```gherkin
  Scenario: 11MB PNG is rejected before upload begins
    Given an authenticated editor selects "huge-image.png" (11MB) via file picker
    When the file is selected
    Then no upload HTTP request is sent
    And an inline error message reads "Image must be under 10MB"
    And no CRDT change is made
```

**Test Data:**
- `{ file: { name: "huge-image.png", type: "image/png", size: 11534336 } }`

**Preconditions:**
- Client-side size check is implemented before upload initiates

---

### T-8.2: File exactly at 10MB boundary is allowed; file at 10MB + 1 byte is rejected
**Maps to:** AC-8
**Category:** error-handling

```gherkin
  Scenario: Boundary file size validation at exactly 10MB
    Given an authenticated editor selects a PNG file of exactly 10485760 bytes (10MB)
    Then the upload proceeds normally and no error is shown

  Scenario: File 1 byte over 10MB is rejected
    Given an authenticated editor selects a PNG file of exactly 10485761 bytes (10MB + 1 byte)
    Then the inline error message reads "Image must be under 10MB"
    And no upload request is sent
```

**Test Data:**
- `{ boundaryFile: { size: 10485760 }, overLimitFile: { size: 10485761 } }`

**Preconditions:**
- Test fixture files of exact sizes are available

---

### T-9.1: Network failure during upload shows retry option
**Maps to:** AC-9
**Category:** error-handling

```gherkin
  Scenario: S3 upload failure shows error with retry button
    Given an authenticated editor initiates upload of "valid-image.png" (1MB)
    And the network connection drops during the upload (simulated by blocking S3 endpoint)
    When the upload request fails (network error or 500 from upload service)
    Then the loading placeholder is removed
    And no image node is added to the CRDT state
    And an inline error message reads "Image upload failed. Please try again."
    And a "Retry" button is visible alongside the error message
```

**Test Data:**
- `{ file: { name: "valid-image.png", type: "image/png", size: 1048576 }, simulatedError: "network-timeout" }`

**Preconditions:**
- Network failure is simulated at the test layer (intercept upload endpoint)

---

### T-9.2: Clicking Retry re-attempts the upload
**Maps to:** AC-9
**Category:** error-handling

```gherkin
  Scenario: Retry button re-initiates a failed upload
    Given an upload has failed and the error "Image upload failed. Please try again." is shown with a Retry button
    And the network has been restored
    When the editor clicks the "Retry" button
    Then the image upload begins again
    And the loading placeholder reappears
    And if successful, the image renders inline with the S3 URL stored in CRDT
```

**Test Data:**
- `{ file: { name: "valid-image.png", type: "image/png", size: 1048576 }, retryNetworkAvailable: true }`

**Preconditions:**
- Upload previously failed; network restored before retry

---

## Boundary Tests

### T-10.1: Image renders for all users with viewer access
**Maps to:** AC-10
**Category:** boundary

```gherkin
  Scenario: Image URL is accessible to all users with document access
    Given document "doc-img-01" contains an image stored at "https://storage.example.com/uploads/img-001.png"
    When a user with role "viewer" opens "doc-img-01"
    Then the image renders successfully from the stored URL
    And no authentication error is returned by the image URL
    And the image alt text is also displayed
```

**Test Data:**
- `{ documentId: "doc-img-01", imageUrl: "https://storage.example.com/uploads/img-001.png", viewerUserId: "user-viewer-01", role: "viewer" }`

**Preconditions:**
- Image URL is either publicly readable or signed with access controls appropriate for the viewer role

---

### T-10.2: Image URL does not expose S3 credentials
**Maps to:** AC-10
**Category:** boundary

```gherkin
  Scenario: Image URL does not contain AWS access keys or secret tokens
    Given an image has been uploaded and its URL stored in CRDT state
    When the image URL is inspected
    Then the URL does not contain query parameters "AWSAccessKeyId", "X-Amz-Security-Token", or "X-Amz-Credential"
    And if the URL is a signed URL, the signature expiry is set to a minimum of 24 hours from generation
```

**Test Data:**
- `{ storedImageUrl: "https://storage.example.com/uploads/img-001.png", forbiddenQueryParams: ["AWSAccessKeyId","X-Amz-Security-Token","X-Amz-Credential"] }`

**Preconditions:**
- Image upload has completed; URL is stored in CRDT state

---

## Edge-Case Tests

### T-11.1: Clipboard paste of image is rejected with informational message
**Maps to:** AC-11
**Category:** edge-case

```gherkin
  Scenario: Pasting image data from clipboard is rejected gracefully
    Given an authenticated editor has image data in their clipboard (copied from an external source)
    When the editor presses Cmd+V (or Ctrl+V)
    Then no image is inserted into the document
    And no upload is initiated
    And an informational message reads "Pasting images from clipboard is not supported yet — use the upload button instead"
    And the CRDT state is unchanged
```

**Test Data:**
- `{ clipboardData: "image/png binary data (1KB)", shortcut: "Cmd+V" }`

**Preconditions:**
- Clipboard contains image/png MIME type data (not text)
- Test environment supports injecting clipboard paste events with image data

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated image upload request returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Image upload API call without authentication is rejected
    Given no authentication token is present
    When a POST request is sent to "/api/documents/doc-img-01/images/upload" with a multipart PNG file (500KB)
    Then the response status is 401
    And the response body contains { "error": "Unauthorized" }
    And no file is written to S3
    And no CRDT mutation is applied to "doc-img-01"
```

**Test Data:**
- `{ endpoint: "POST /api/documents/doc-img-01/images/upload", authHeader: null, file: { name: "test.png", size: 512000 } }`

**Preconditions:**
- No Authorization header or session cookie in request

---

### T-AUTH-1.2: Unauthenticated CRDT mutation for image node returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated direct mutation to add image node is rejected
    Given no authentication token is present
    When a POST request is sent to "/api/documents/doc-img-01/mutations" with body:
      """
      { "type": "image-insert", "url": "https://evil.example.com/fake.png", "position": 0 }
      """
    Then the response status is 401
    And the CRDT state of "doc-img-01" contains no new image node
```

**Test Data:**
- `{ endpoint: "POST /api/documents/doc-img-01/mutations", authHeader: null, body: { type: "image-insert", url: "https://evil.example.com/fake.png", position: 0 } }`

**Preconditions:**
- Document "doc-img-01" has a known state; no auth token present

---

### T-AUTH-2.1: Viewer user sees image insert UI disabled
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Viewer role cannot access image insertion toolbar button
    Given an authenticated user with role "viewer" opens document "doc-img-01"
    When the document renders
    Then the "Insert Image" toolbar button is visually disabled (aria-disabled="true")
    And the drag-and-drop zone is either hidden or shows "View only"
    And attempting to drag a file onto the editor area has no effect
```

**Test Data:**
- `{ documentId: "doc-img-01", userId: "user-viewer-01", role: "viewer" }`

**Preconditions:**
- User has viewer permission on "doc-img-01"

---

### T-AUTH-2.2: Commenter role upload API call returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Commenter direct API call for image upload returns 403
    Given an authenticated user with role "commenter" has a valid session token
    When a POST request is sent to "/api/documents/doc-img-01/images/upload" with a multipart PNG file
    Then the response status is 403
    And the response body contains { "error": "Forbidden" }
    And no file is written to S3
```

**Test Data:**
- `{ documentId: "doc-img-01", userId: "user-commenter-01", role: "commenter", sessionToken: "<valid-commenter-token>", file: { name: "test.png", size: 102400 } }`

**Preconditions:**
- User "user-commenter-01" has commenter permission on "doc-img-01"

---

### T-AUTH-2.3: Commenter role cannot inject image URL via direct CRDT mutation
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Commenter direct API mutation to insert image node is rejected with 403
    Given an authenticated user with role "commenter" has a valid session token
    When a POST request is sent to "/api/documents/doc-img-01/mutations" with body:
      """
      { "type": "image-insert", "url": "https://external.example.com/image.png", "position": 0 }
      """
    Then the response status is 403
    And the CRDT state of "doc-img-01" contains no new image node
    And the URL "https://external.example.com/image.png" is not stored anywhere in the document
```

**Test Data:**
- `{ documentId: "doc-img-01", userId: "user-commenter-01", role: "commenter", injectedUrl: "https://external.example.com/image.png" }`

**Preconditions:**
- User has commenter (not editor) permission; session token is valid

---

*End of Test Specifications — Batch 02 (EDIT-02, EDIT-03, EDIT-04, EDIT-05)*


# Test Specifications: EDIT-06 — Hyperlinks

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1, T-4.2 | happy-path |
| AC-5 | T-5.1, T-5.2 | happy-path |
| AC-6 | T-6.1, T-6.2, T-6.3 | error-handling |
| AC-7 | T-7.1, T-7.2, T-7.3 | security |
| AC-8 | T-8.1 | happy-path |
| AC-9 | T-9.1 | boundary |
| AC-10 | T-10.1, T-10.2 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Editor inserts hyperlink on selected text using toolbar button
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Hyperlink insertion on selected text

  Scenario: Insert hyperlink via toolbar on selected text
    Given the editor is authenticated with role "editor"
    And the document "doc-hyperlink-01" exists with body text "Visit our documentation for more details"
    And the editor has the document open in the editor view
    When the editor selects the text "documentation"
    And clicks the hyperlink toolbar button
    And enters "https://docs.example.com" in the URL field
    And clicks the "Confirm" button
    Then the text "documentation" in the document is wrapped as a hyperlink
    And the link renders underlined and in blue color
    And the link's href is "https://docs.example.com"
    And the CRDT state for doc-hyperlink-01 contains a link mark on "documentation" with url "https://docs.example.com"
```

**Test Data:**
- Document ID: `doc-hyperlink-01`
- Editor user: `{ id: "user-editor-01", email: "editor@example.com", role: "editor", status: "active" }`
- Selected text: `"documentation"` (characters 6–18 in body)
- URL entered: `"https://docs.example.com"`

**Preconditions:**
- User is authenticated with a valid session token
- Document exists and editor has edit permission
- WebSocket connection to document room is established

---

### T-1.2: Editor inserts hyperlink using keyboard shortcut Cmd+K / Ctrl+K
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Insert hyperlink via keyboard shortcut on selected text
    Given the editor is authenticated with role "editor"
    And the document "doc-hyperlink-01" exists with body text "Visit our documentation for more details"
    And the editor has selected the text "our"
    When the editor presses "Cmd+K" (or "Ctrl+K" on Windows/Linux)
    And the link dialog appears
    And enters "https://example.com/about" in the URL field
    And presses "Enter" to confirm
    Then the text "our" is wrapped as a hyperlink pointing to "https://example.com/about"
    And the link renders visually distinct (underlined, colored)
    And the CRDT state contains a link mark on "our" with url "https://example.com/about"
```

**Test Data:**
- Selected text: `"our"` (characters 6–8)
- URL: `"https://example.com/about"`

**Preconditions:**
- User is authenticated with a valid session token
- Editor view is focused (keyboard events are captured by the editor)

---

### T-2.1: Editor inserts hyperlink with explicit display text override (no prior selection)
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Hyperlink insertion with display text

  Scenario: Insert hyperlink with custom display text at cursor position
    Given the editor is authenticated with role "editor"
    And the document "doc-hyperlink-02" exists with body text "Check this out"
    And the editor has placed the cursor after "this " with no text selected
    When the editor opens the link dialog via toolbar
    And enters "https://example.com/resource" in the URL field
    And enters "useful resource" in the Display Text field
    And clicks "Confirm"
    Then the text "useful resource" is inserted at the cursor position as a hyperlink
    And the link's href is "https://example.com/resource"
    And the raw URL "https://example.com/resource" is NOT shown as visible document text
    And the CRDT state stores: display text "useful resource", url "https://example.com/resource"
```

**Test Data:**
- Document ID: `doc-hyperlink-02`
- Cursor position: after character 10 (`"Check this "`)
- URL: `"https://example.com/resource"`
- Display text: `"useful resource"`

**Preconditions:**
- No text is selected in the editor
- Cursor is positioned within the document body

---

### T-2.2: Editor inserts hyperlink and display text field is pre-populated from selection
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Link dialog pre-populates display text from selected text
    Given the editor is authenticated with role "editor"
    And the document "doc-hyperlink-02" exists with body text "Read the announcement post here"
    And the editor has selected the text "announcement post"
    When the editor opens the link dialog via Cmd+K
    Then the Display Text field is pre-populated with "announcement post"
    When the editor enters "https://blog.example.com/announcement" in the URL field
    And clicks "Confirm"
    Then the text "announcement post" is wrapped as a hyperlink to "https://blog.example.com/announcement"
    And the display text in the document remains "announcement post"
```

**Test Data:**
- Selected text: `"announcement post"`
- URL: `"https://blog.example.com/announcement"`

**Preconditions:**
- Text is selected before opening the dialog

---

### T-3.1: Viewer clicks a hyperlink and it opens in a new tab
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Hyperlink opens in new tab

  Scenario: Clicking a hyperlink opens URL in a new browser tab
    Given a document "doc-hyperlink-03" exists with the hyperlink "documentation" → "https://docs.example.com"
    And a user with role "viewer" has the document open in view mode
    When the viewer clicks the "documentation" hyperlink
    Then the browser opens "https://docs.example.com" in a new tab or window
    And the current document view remains open and unchanged
    And the viewer is not navigated away from the document
```

**Test Data:**
- Document: `doc-hyperlink-03`
- Viewer user: `{ id: "user-viewer-01", email: "viewer@example.com", role: "viewer", status: "active" }`
- Hyperlink text: `"documentation"`, href: `"https://docs.example.com"`

**Preconditions:**
- Document contains at least one existing hyperlink
- Viewer has at minimum view access to the document

---

### T-3.2: Editor clicks a hyperlink in preview/view mode and it opens in a new tab
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Editor clicking a link in view mode opens new tab
    Given a document "doc-hyperlink-03" exists with the hyperlink "release notes" → "https://releases.example.com/v2"
    And a user with role "editor" views the document
    When the editor clicks the "release notes" hyperlink
    Then "https://releases.example.com/v2" opens in a new tab
    And the document remains visible in the original tab
```

**Test Data:**
- Hyperlink text: `"release notes"`, href: `"https://releases.example.com/v2"`

**Preconditions:**
- Document is in view/read mode (not actively editing the link itself)

---

### T-4.1: Editor edits an existing link via context menu
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Edit existing hyperlink

  Scenario: Update URL and display text of an existing link via context menu
    Given the editor is authenticated with role "editor"
    And the document "doc-hyperlink-04" exists with hyperlink "old text" → "https://old.example.com"
    When the editor clicks on the "old text" hyperlink in the document
    And the floating toolbar or context menu appears with an "Edit Link" option
    And the editor selects "Edit Link"
    Then the link dialog opens pre-populated with URL "https://old.example.com" and display text "old text"
    When the editor changes the URL to "https://new.example.com"
    And changes the display text to "new text"
    And clicks "Confirm"
    Then the link in the document shows display text "new text" pointing to "https://new.example.com"
    And the CRDT state is updated with the new URL and display text
    And no duplicate link marks exist on that text range
```

**Test Data:**
- Document: `doc-hyperlink-04`
- Original link: `{ text: "old text", href: "https://old.example.com" }`
- Updated link: `{ text: "new text", href: "https://new.example.com" }`

**Preconditions:**
- Document contains at least one existing hyperlink
- Editor has edit permission

---

### T-4.2: Editor cancels the link edit dialog — no changes applied
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Cancelling the edit link dialog leaves original link unchanged
    Given the editor is authenticated with role "editor"
    And the document "doc-hyperlink-04" has hyperlink "stable text" → "https://stable.example.com"
    When the editor clicks on "stable text" and selects "Edit Link"
    And the dialog opens pre-populated with the existing values
    And the editor changes the URL to "https://changed.example.com"
    And presses "Escape" or clicks "Cancel"
    Then the link remains pointing to "https://stable.example.com"
    And the display text remains "stable text"
    And the CRDT state is unchanged
```

**Test Data:**
- Original link: `{ text: "stable text", href: "https://stable.example.com" }`

**Preconditions:**
- Dialog is open with an existing link pre-populated

---

### T-5.1: Editor removes a link via context menu — display text remains as plain text
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: Remove existing hyperlink

  Scenario: Remove link via context menu preserves display text as plain text
    Given the editor is authenticated with role "editor"
    And the document "doc-hyperlink-05" contains hyperlink "click here" → "https://example.com/page"
    When the editor right-clicks on the "click here" link
    And selects "Remove Link" from the context menu
    Then the link mark is removed from "click here"
    And the text "click here" remains in the document at the same position as plain (non-linked) text
    And the CRDT state no longer contains a link mark for that text range
    And the change is persisted to the CRDT state
```

**Test Data:**
- Document: `doc-hyperlink-05`
- Link: `{ text: "click here", href: "https://example.com/page" }`

**Preconditions:**
- Document contains an existing hyperlink
- Editor has edit permission

---

### T-5.2: Removed link is no longer clickable or styled as a link
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Plain text after link removal does not behave as a link
    Given the editor has removed the link mark from "click here" (per T-5.1)
    When any user views the document
    Then "click here" renders without underline and without link color
    And clicking "click here" does not open a new tab or navigate anywhere
```

**Test Data:**
- Text: `"click here"` (post-removal state)

**Preconditions:**
- Link removal was confirmed and persisted (T-5.1 precondition met)

---

## Negative Tests

### T-6.1: Link dialog rejects an empty URL
**Maps to:** AC-6
**Category:** error-handling

```gherkin
Feature: URL validation in link dialog

  Scenario: Empty URL is rejected with validation message
    Given the editor is authenticated with role "editor"
    And the link dialog is open
    When the editor leaves the URL field empty
    And clicks "Confirm"
    Then the dialog shows an inline error "Please enter a valid URL (e.g., https://example.com)"
    And no link is inserted into the document
    And the dialog remains open for correction
    And the CRDT state is unchanged
```

**Test Data:**
- URL input: `""` (empty string)

**Preconditions:**
- Editor has the link dialog open

---

### T-6.2: Link dialog rejects a plaintext non-URL string
**Maps to:** AC-6
**Category:** error-handling

```gherkin
  Scenario: Non-URL string rejected with validation message
    Given the editor is authenticated with role "editor"
    And the link dialog is open
    When the editor enters "not a url" in the URL field
    And clicks "Confirm"
    Then the dialog shows an inline error "Please enter a valid URL (e.g., https://example.com)"
    And the link is not inserted
    And the dialog remains open
```

**Test Data:**
- URL input: `"not a url"`

**Preconditions:**
- Link dialog is open

---

### T-6.3: Link dialog rejects a malformed URL missing scheme
**Maps to:** AC-6
**Category:** error-handling

```gherkin
  Scenario: URL without scheme is rejected
    Given the editor is authenticated with role "editor"
    And the link dialog is open
    When the editor enters "example.com/page" in the URL field (no scheme)
    And clicks "Confirm"
    Then the dialog shows an inline error "Please enter a valid URL (e.g., https://example.com)"
    And the link is not inserted
    And the dialog remains open
```

**Test Data:**
- URL input: `"example.com/page"` (missing `https://`)

**Preconditions:**
- Link dialog is open

---

### T-7.1: `javascript:` scheme URL is blocked
**Maps to:** AC-7
**Category:** security

```gherkin
Feature: Enforce allowed URL schemes

  Scenario: javascript: scheme is rejected to prevent XSS
    Given the editor is authenticated with role "editor"
    And the link dialog is open
    When the editor enters "javascript:alert('xss')" in the URL field
    And clicks "Confirm"
    Then the dialog shows an error "Only http:// and https:// links are allowed"
    And the link is not inserted into the document
    And the CRDT state contains no link mark with a javascript: href
    And the dialog remains open for correction
```

**Test Data:**
- URL input: `"javascript:alert('xss')"`

**Preconditions:**
- Link dialog is open

---

### T-7.2: `data:` scheme URL is blocked
**Maps to:** AC-7
**Category:** security

```gherkin
  Scenario: data: scheme is rejected
    Given the editor is authenticated with role "editor"
    And the link dialog is open
    When the editor enters "data:text/html,<script>alert(1)</script>" in the URL field
    And clicks "Confirm"
    Then the dialog shows an error "Only http:// and https:// links are allowed"
    And no link is inserted
```

**Test Data:**
- URL input: `"data:text/html,<script>alert(1)</script>"`

**Preconditions:**
- Link dialog is open

---

### T-7.3: `file://` scheme URL is blocked
**Maps to:** AC-7
**Category:** security

```gherkin
  Scenario: file:// scheme is rejected
    Given the editor is authenticated with role "editor"
    And the link dialog is open
    When the editor enters "file:///etc/passwd" in the URL field
    And clicks "Confirm"
    Then the dialog shows an error "Only http:// and https:// links are allowed"
    And no link is inserted
```

**Test Data:**
- URL input: `"file:///etc/passwd"`

**Preconditions:**
- Link dialog is open

---

### T-8.1: Link insertion is visible to other connected editors within 500ms
**Maps to:** AC-8
**Category:** happy-path

```gherkin
Feature: Real-time link change visibility

  Scenario: Link insertion propagates to co-editors in under 500ms
    Given editor-A and editor-B are both connected to document room "doc-hyperlink-06"
    And editor-A is authenticated with role "editor"
    And editor-B is authenticated with role "editor"
    When editor-A selects the text "shared content" and inserts a hyperlink to "https://shared.example.com"
    Then editor-B's view of "doc-hyperlink-06" shows "shared content" rendered as a hyperlink within 500ms
    And editor-B's local CRDT state contains the link mark without manual action
```

**Test Data:**
- Document: `doc-hyperlink-06`
- Editor-A: `{ id: "user-editor-02", email: "editor2@example.com", role: "editor" }`
- Editor-B: `{ id: "user-editor-03", email: "editor3@example.com", role: "editor" }`
- Link: `{ text: "shared content", href: "https://shared.example.com" }`

**Preconditions:**
- Both editors have established WebSocket connections to the same document room
- WebSocket service is running (SYNC-01)

---

## Boundary Tests

### T-9.1: Hyperlink persists after page reload
**Maps to:** AC-9
**Category:** boundary

```gherkin
Feature: Hyperlink persistence across reloads

  Scenario: Inserted link survives a full page reload
    Given the editor has inserted a hyperlink "persist-test" → "https://persist.example.com" in document "doc-hyperlink-07"
    And the CRDT mutation was acknowledged by the server
    When any user reloads the document page (F5 or browser reload)
    Then the document loads with the "persist-test" text still rendered as a hyperlink
    And the link's href is "https://persist.example.com"
    And no other link marks are duplicated or missing
```

**Test Data:**
- Document: `doc-hyperlink-07`
- Link: `{ text: "persist-test", href: "https://persist.example.com" }`

**Preconditions:**
- CRDT operation was acknowledged (not just optimistically rendered)
- Server-side state was written (SYNC-03 AC-1)

---

### T-10.1: Inserting a new link on already-linked text replaces the URL
**Maps to:** AC-10
**Category:** edge-case

```gherkin
Feature: Link-on-link update

  Scenario: Applying a link to text with an existing link replaces the old URL
    Given the editor is authenticated with role "editor"
    And the document "doc-hyperlink-08" has hyperlink "overlapping text" → "https://old-url.example.com"
    When the editor selects "overlapping text" and opens the link dialog
    And enters "https://new-url.example.com" in the URL field
    And confirms
    Then the text "overlapping text" points to "https://new-url.example.com"
    And the old URL "https://old-url.example.com" is no longer associated with that text
    And the CRDT state contains exactly ONE link mark on "overlapping text"
    And no duplicate link marks exist on that text range
```

**Test Data:**
- Document: `doc-hyperlink-08`
- Original link: `{ text: "overlapping text", href: "https://old-url.example.com" }`
- Replacement URL: `"https://new-url.example.com"`

**Preconditions:**
- Document contains text with an existing link mark applied

---

### T-10.2: Editing a link on already-linked text does not create nested link marks
**Maps to:** AC-10
**Category:** edge-case

```gherkin
  Scenario: No duplicate link marks created when updating a link
    Given the document "doc-hyperlink-08" has hyperlink "test anchor" → "https://v1.example.com"
    And the editor opens the link dialog on "test anchor"
    When the editor changes the URL to "https://v2.example.com" and confirms
    Then the CRDT operation log for doc-hyperlink-08 shows a single link mark update (not an add on top of existing)
    And rendering the document shows only one link mark on "test anchor"
```

**Test Data:**
- Link before: `{ text: "test anchor", href: "https://v1.example.com" }`
- Link after: `{ text: "test anchor", href: "https://v2.example.com" }`

**Preconditions:**
- Text already has exactly one link mark in CRDT state

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to document mutation endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Unauthenticated access rejected for link mutations

  Scenario: Request without auth token is rejected with 401
    Given no valid authentication token or session is present
    When a direct API request is made to "PATCH /api/documents/doc-hyperlink-01/content" to insert a link mark
    Then the API returns HTTP 401 Unauthorized
    And the response body contains an error message indicating authentication is required
    And no change is made to the document content or CRDT state
```

**Test Data:**
- Request: `PATCH /api/documents/doc-hyperlink-01/content` with a link insertion payload
- Auth header: absent (no `Authorization` header, no session cookie)

**Preconditions:**
- No active session exists for the request origin

---

### T-AUTH-2.1: Viewer cannot insert a link via the UI
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Viewer role cannot modify links

  Scenario: Link insertion controls are not available to viewer-role users
    Given a user with role "viewer" has document "doc-hyperlink-09" open
    When the viewer selects text in the document
    Then the hyperlink toolbar button is absent or disabled
    And pressing Cmd+K / Ctrl+K does not open the link dialog
    And the viewer cannot insert, edit, or remove links through the UI
```

**Test Data:**
- Viewer user: `{ id: "user-viewer-02", email: "viewer2@example.com", role: "viewer", status: "active" }`
- Document: `doc-hyperlink-09`

**Preconditions:**
- User is authenticated with a valid session but with viewer role on the document

---

### T-AUTH-2.2: Authenticated viewer attempting direct API link mutation receives 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Viewer API call to mutate a link returns 403
    Given a user with role "viewer" is authenticated with session token "viewer-session-abc"
    When a direct API request is made to "PATCH /api/documents/doc-hyperlink-09/content" with a link insertion payload
    Then the API returns HTTP 403 Forbidden
    And the response body indicates insufficient permissions
    And no change is made to the document or CRDT state
    And existing links in the document remain intact and followable by the viewer
```

**Test Data:**
- Viewer session token: `"viewer-session-abc"`
- Request: `PATCH /api/documents/doc-hyperlink-09/content`
- Payload: `{ op: "insert_link", text: "click", href: "https://example.com" }`

**Preconditions:**
- User is authenticated but has viewer-level permission on the target document

---

---

# Test Specifications: SYNC-01 — WebSocket Session Management for Document Collaboration

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1, T-4.2 | happy-path |
| AC-5 | T-5.1, T-5.2 | happy-path |
| AC-6 | T-6.1 | happy-path |
| AC-7 | T-7.1, T-7.2 | boundary |
| AC-8 | T-8.1, T-8.2 | edge-case |
| AC-9 | T-9.1, T-9.2 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1, T-AUTH-1.2 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Authenticated user opens document and WebSocket connection is established within 3 seconds
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: WebSocket connection on document open

  Scenario: WebSocket connects within 3 seconds for an editor opening a document
    Given the user "user-editor-01" is authenticated with a valid session token
    And the Node.js WebSocket service is running
    And the document "doc-ws-01" exists
    When the user navigates to the document editor view for "doc-ws-01"
    And the editor view finishes loading
    Then a WebSocket connection is established to the WS service for document room "doc-ws-01"
    And the connection is established within 3 seconds of page load
    And the session token is passed during the WebSocket handshake
```

**Test Data:**
- User: `{ id: "user-editor-01", email: "editor@example.com", role: "editor", sessionToken: "tok-editor-abc123" }`
- Document: `doc-ws-01`
- WS service URL: `wss://ws.example.com`

**Preconditions:**
- User is authenticated (valid session token in cookies/headers)
- Node.js WS service is running and accessible
- Document `doc-ws-01` exists with the user having at least viewer permission

---

### T-1.2: Viewer opening a document also establishes a WebSocket connection within 3 seconds
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: WebSocket connects within 3 seconds for a viewer opening a document
    Given the user "user-viewer-01" is authenticated with role "viewer"
    And the document "doc-ws-01" exists
    When the viewer navigates to the document view
    And the view finishes loading
    Then a WebSocket connection is established to the WS service for room "doc-ws-01"
    And the connection is established within 3 seconds of page load
```

**Test Data:**
- Viewer: `{ id: "user-viewer-01", email: "viewer@example.com", role: "viewer", sessionToken: "tok-viewer-xyz789" }`

**Preconditions:**
- User is authenticated; document exists; viewer has at least view permission

---

### T-2.1: Client sends room join message and server acknowledges it
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Document room join

  Scenario: Client joins document-specific room and receives acknowledgement
    Given the WebSocket connection for user "user-editor-01" to the WS service is established
    When the client sends a room join message with document ID "doc-ws-01"
    Then the server registers the client in room "doc-ws-01"
    And the server sends a join acknowledgement message back to the client
    And subsequent messages from the server to that client are scoped to room "doc-ws-01" only
    And messages from other document rooms are not received by this client
```

**Test Data:**
- Room join payload: `{ type: "room_join", documentId: "doc-ws-01" }`
- Expected ack: `{ type: "room_join_ack", documentId: "doc-ws-01", userId: "user-editor-01" }`

**Preconditions:**
- WebSocket connection is established and authenticated
- WS service is running; document `doc-ws-01` exists

---

### T-2.2: Messages broadcast to room are only received by clients in that room
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Room isolation - messages do not leak between document rooms
    Given user-A is connected to room "doc-ws-01"
    And user-B is connected to room "doc-ws-02"
    When the server broadcasts a test message to room "doc-ws-01"
    Then user-A receives the message
    And user-B does NOT receive the message
```

**Test Data:**
- User-A room: `"doc-ws-01"`
- User-B room: `"doc-ws-02"`

**Preconditions:**
- Both users are authenticated and connected
- Both have joined their respective rooms

---

### T-3.1: Server checks permissions at join time and attaches permission level to connection
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Permission enforcement at WebSocket join

  Scenario: Server enforces permission level at room join and stores it on the connection
    Given user "user-editor-01" has "edit" permission on document "doc-ws-01"
    And the user has established a WebSocket connection
    When the client sends a room join message for "doc-ws-01"
    Then the server validates the user's permission for "doc-ws-01" and finds "edit"
    And the permission level "edit" is stored on the server-side connection object
    And the client receives a join acknowledgement indicating their permission level
```

**Test Data:**
- User: `{ id: "user-editor-01", permission: "edit" }`
- Document: `"doc-ws-01"`
- Expected ack: `{ type: "room_join_ack", documentId: "doc-ws-01", permissionLevel: "edit" }`

**Preconditions:**
- WS connection is authenticated
- User has edit permission in the document permissions table

---

### T-3.2: Server rejects room join for user with no document access
**Maps to:** AC-3
**Category:** happy-path (permission enforcement path)

```gherkin
  Scenario: Server rejects join and closes connection for unauthorized user
    Given user "user-noaccess-01" has NO permission on document "doc-ws-01"
    And the user has established a WebSocket connection (authentication passed)
    When the client sends a room join message for "doc-ws-01"
    Then the server sends a join rejection message to the client
    And the server closes the WebSocket connection with code 4403
    And no document data is transmitted to the client before close
```

**Test Data:**
- User: `{ id: "user-noaccess-01", email: "noaccess@example.com", role: "authenticated" }`
- Document: `"doc-ws-01"` (user has no entry in document_permissions table)
- Expected close code: `4403`

**Preconditions:**
- User is globally authenticated but has no document-level access
- WS connection was established (initial handshake passed)

---

### T-4.1: Client reconnects with exponential backoff after network drop
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: WebSocket reconnection with exponential backoff

  Scenario: Client reconnects automatically after a network interruption
    Given user "user-editor-01" is connected to room "doc-ws-01"
    When the network connection drops (simulated disconnect)
    Then the client detects the disconnect
    And attempts to reconnect after approximately 1 second
    And if that fails, retries after approximately 2 seconds
    And then approximately 4 seconds, then 8 seconds, then 16 seconds
    And retry interval caps at 30 seconds for subsequent attempts
    And reconnection continues until the user navigates away from the document
```

**Test Data:**
- Backoff sequence: `[1s, 2s, 4s, 8s, 16s, 30s, 30s, ...]`
- Tolerance: ±500ms per interval

**Preconditions:**
- Client was previously connected and in a document room
- Network interruption is simulated (not a user-initiated close)

---

### T-4.2: Reconnection attempt succeeds and client re-joins the room
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Successful reconnect after transient network failure
    Given user "user-editor-01" was connected to room "doc-ws-01" and got disconnected
    And the network is restored after 5 seconds
    When the client's backoff timer fires and it attempts reconnection
    Then the WebSocket handshake succeeds with the user's session token
    And the client re-sends the room join message for "doc-ws-01"
    And the server re-registers the client in room "doc-ws-01"
    And the client receives any missed CRDT operations (per SYNC-03 gap-fill)
```

**Test Data:**
- Outage duration: 5 seconds (should trigger reconnect after 1s attempt + backoff)

**Preconditions:**
- Session token is still valid
- Document has not been deleted during the outage

---

### T-5.1: WebSocket connection is cleanly closed when user closes the document tab
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: WebSocket teardown on document close

  Scenario: Tab close triggers clean WebSocket teardown
    Given user "user-editor-01" is connected to room "doc-ws-01"
    When the user closes the document browser tab
    Then the client sends a WebSocket close frame to the server
    And the server removes the client from room "doc-ws-01"
    And the client does NOT attempt to reconnect after the tab close
```

**Test Data:**
- Close trigger: browser tab close (`beforeunload` / `pagehide` event)

**Preconditions:**
- WebSocket connection is active in the browser tab being closed

---

### T-5.2: WebSocket connection is closed when user navigates away from the document
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Navigation away from document tears down the WebSocket connection
    Given user "user-editor-01" is connected to room "doc-ws-01"
    When the user navigates the browser to a different page (e.g., the document list)
    Then the WebSocket connection for "doc-ws-01" is closed with a clean close frame
    And the server removes the client from room "doc-ws-01"
    And no reconnect attempts are made to room "doc-ws-01"
```

**Test Data:**
- Navigation target: `"/documents"` (document list page)

**Preconditions:**
- WebSocket connection is active

---

### T-6.1: Up to 50 concurrent clients connect to the same document room
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: Multiple concurrent clients in the same room

  Scenario: 50 clients can concurrently join and receive broadcasts in the same room
    Given 50 users each have at least viewer permission on document "doc-ws-concurrency-01"
    When all 50 users establish WebSocket connections and join room "doc-ws-concurrency-01"
    Then all 50 clients are registered in room "doc-ws-concurrency-01" by the server
    And a message broadcast to room "doc-ws-concurrency-01" is received by all 50 clients
    And no client receives an error or rejection during join
```

**Test Data:**
- Users: 50 users with IDs `user-concurrent-01` through `user-concurrent-50`
- Document: `doc-ws-concurrency-01`
- All have at least `"viewer"` permission

**Preconditions:**
- WS service is running and not at overall capacity
- All 50 session tokens are valid

---

## Boundary Tests

### T-7.1: 51st client attempting to join a full room receives a capacity rejection
**Maps to:** AC-7
**Category:** boundary

```gherkin
Feature: Room capacity limit enforcement

  Scenario: Room rejects the 51st connection with a capacity-exceeded message
    Given document room "doc-ws-capacity-01" has exactly 50 connected clients
    And a 51st user "user-extra-01" attempts to join the room
    When the 51st client sends the room join message
    Then the server sends a capacity-exceeded rejection message to the 51st client
    And the rejection uses code 4429 (or the platform-equivalent capacity code)
    And the client's UI displays "Too many users are currently editing this document"
    And the client does NOT automatically retry the join
    And all 50 existing clients remain connected and unaffected
```

**Test Data:**
- 51st user: `{ id: "user-extra-01", email: "extra@example.com", role: "editor" }`
- Rejection code: `4429`
- Expected client message: `"Too many users are currently editing this document"`

**Preconditions:**
- Exactly 50 authenticated clients are already in room `doc-ws-capacity-01`

---

### T-7.2: After a client leaves a full room, the next client can join successfully
**Maps to:** AC-7
**Category:** boundary

```gherkin
  Scenario: Room slot freed when a client disconnects allows next client to join
    Given document room "doc-ws-capacity-01" has exactly 50 connected clients
    And a 51st client was previously rejected
    When client 50 disconnects (closes the tab)
    And the 51st client retries the room join
    Then the server accepts the 51st client into the room
    And the room now has 50 clients again
```

**Test Data:**
- Disconnecting client: `user-concurrent-50`
- Retrying client: `user-extra-01`

**Preconditions:**
- Room was at capacity; one client has cleanly disconnected

---

## Edge Case Tests

### T-8.1: All active sessions in a room are terminated when the document is deleted
**Maps to:** AC-8
**Category:** edge-case

```gherkin
Feature: Session termination on document deletion

  Scenario: Document deletion closes all active WebSocket sessions in the room
    Given users "user-editor-01", "user-editor-02", and "user-viewer-01" are connected to room "doc-ws-delete-01"
    When an authorized admin deletes document "doc-ws-delete-01"
    Then the server closes all three client connections with close code 4410
    And each client's editor displays the message "This document has been deleted"
    And no further editing is possible in those editor instances
    And the clients do NOT attempt to reconnect
```

**Test Data:**
- Admin user: `{ id: "admin-01", role: "admin" }`
- Affected connections: `user-editor-01`, `user-editor-02`, `user-viewer-01`
- Close code: `4410`
- Expected client message: `"This document has been deleted"`

**Preconditions:**
- Document exists and all three users have active WebSocket sessions in its room
- Admin user has delete permission

---

### T-8.2: Client receives "document deleted" message and editing is blocked
**Maps to:** AC-8
**Category:** edge-case

```gherkin
  Scenario: Editor UI blocks further input after document deletion close code
    Given user "user-editor-01" was connected to a now-deleted document room
    And the client received close code 4410
    When the user attempts to type in the editor
    Then no new content can be entered
    And the in-app message "This document has been deleted" remains visible
    And no reconnect is attempted
```

**Test Data:**
- Close code received: `4410`

**Preconditions:**
- WebSocket connection was closed with code 4410

---

### T-9.1: Token expiry during active session causes server to close the connection with 4401
**Maps to:** AC-9
**Category:** edge-case

```gherkin
Feature: Session token expiry during active WebSocket session

  Scenario: Server closes connection with 4401 when session token expires
    Given user "user-editor-01" is connected to room "doc-ws-01" with session token "tok-expiring-xyz"
    When the session token "tok-expiring-xyz" expires (server-side TTL reached)
    Then the server detects the token expiry (on next operation or heartbeat check)
    And the server closes the WebSocket connection with code 4401 (Unauthorized)
    And the client displays a prompt to re-authenticate
```

**Test Data:**
- Expiring token: `"tok-expiring-xyz"` (TTL set to near-zero for testing)
- Expected close code: `4401`

**Preconditions:**
- User was actively connected; session token is set to expire during the session

---

### T-9.2: Local CRDT changes are preserved for recovery after re-authentication following token expiry
**Maps to:** AC-9
**Category:** edge-case

```gherkin
  Scenario: Unsaved CRDT changes survive token expiry and are recoverable after re-auth
    Given user "user-editor-01" made unsaved edits to "doc-ws-01" (not yet acknowledged by server)
    And the session token then expires (code 4401 received)
    When the user re-authenticates successfully
    And reconnects to room "doc-ws-01"
    Then the client's locally buffered CRDT operations are still present in memory
    And the client can replay those operations after reconnection
    And no data is lost due to the token expiry event alone
```

**Test Data:**
- Unsaved operation: `{ op: "insert", content: "pending text", position: 42 }`
- Re-auth token: `"tok-renewed-abc"`

**Preconditions:**
- CRDT operations were applied locally but not yet acknowledged by the server before token expiry

---

## Authorization Tests

### T-AUTH-1.1: WebSocket upgrade request without a session token is rejected with HTTP 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Unauthenticated WebSocket connection rejected

  Scenario: WebSocket upgrade without a session token returns HTTP 401
    Given no session token is present (no cookie, no Authorization header)
    When a WebSocket upgrade request is made to "wss://ws.example.com/document/doc-ws-01"
    Then the server responds with HTTP 401 during the handshake
    And no WebSocket connection is established (upgrade is rejected)
    And no document room is joined
```

**Test Data:**
- Request: `GET /document/doc-ws-01` with `Upgrade: websocket` header
- Auth token: absent

**Preconditions:**
- WS service is running and accepting connections

---

### T-AUTH-1.2: WebSocket upgrade with an invalid (expired or tampered) token is rejected with HTTP 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: WebSocket upgrade with an invalid token returns HTTP 401
    Given a tampered session token "invalid-token-xyz"
    When a WebSocket upgrade request is made with "Authorization: Bearer invalid-token-xyz"
    Then the server responds with HTTP 401 during the handshake
    And no WebSocket connection is established
```

**Test Data:**
- Invalid token: `"invalid-token-xyz"` (tampered / expired signature)

**Preconditions:**
- WS service validates session tokens against the auth service

---

### T-AUTH-2.1: Authenticated user with no document access is rejected at room join with 4403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Insufficient permissions rejected at WebSocket room join

  Scenario: User with no document access receives 4403 at join and connection is closed
    Given user "user-noaccess-01" is globally authenticated with valid session token "tok-noaccess-abc"
    And user "user-noaccess-01" has no permission record for document "doc-ws-private-01"
    When the WebSocket upgrade is accepted (authentication passes)
    And the client sends a room join message for "doc-ws-private-01"
    Then the server rejects the join with code 4403
    And the server closes the WebSocket connection
    And no document content or CRDT state is transmitted to the client
```

**Test Data:**
- User: `{ id: "user-noaccess-01", email: "noaccess@example.com" }`
- Token: `"tok-noaccess-abc"` (valid global auth token)
- Document: `"doc-ws-private-01"` (user has no entry in document_permissions table)
- Expected close code: `4403`

**Preconditions:**
- Token is valid for authentication; user lacks document-level permission

---

---

# Test Specifications: SYNC-02 — Real-Time CRDT Change Propagation

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1, T-4.2 | happy-path |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1, T-6.2 | boundary |
| AC-7 | T-7.1 | boundary |
| AC-8 | T-8.1 | edge-case |
| AC-9 | T-9.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Editor's CRDT operation is serialized and sent to WS server within 50ms of local apply
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Local CRDT operation broadcast

  Scenario: Text insertion produces a CRDT operation transmitted within 50ms
    Given user "user-editor-01" is authenticated with role "editor"
    And the user is connected to document room "doc-crdt-01" via WebSocket
    And the user has edit permission on "doc-crdt-01"
    When the user inserts the text "hello" at position 10 in the document
    Then the resulting CRDT insert operation is serialized
    And the serialized operation is transmitted to the WS server within 50ms of the local application
```

**Test Data:**
- User: `{ id: "user-editor-01", role: "editor" }`
- Document: `doc-crdt-01`
- Operation: `{ type: "insert", position: 10, content: "hello", clientId: "user-editor-01" }`
- Latency threshold: 50ms (measured from local apply to WS send)

**Preconditions:**
- WebSocket connection is established and room is joined (SYNC-01)
- User has edit permission

---

### T-1.2: CRDT operation for a format change (bold) is transmitted within 50ms
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Format change (bold) produces a CRDT operation transmitted within 50ms
    Given user "user-editor-01" is connected to room "doc-crdt-01" with edit permission
    When the user selects characters 5–15 and applies bold formatting
    Then the CRDT format operation (mark bold on range [5,15]) is serialized
    And transmitted to the WS server within 50ms
```

**Test Data:**
- Operation: `{ type: "format", range: [5, 15], mark: "bold", value: true, clientId: "user-editor-01" }`

**Preconditions:**
- WebSocket connection is active; user has edit permission

---

### T-2.1: CRDT operation received by server is re-broadcast to all other room clients
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: CRDT operation broadcast to all room peers

  Scenario: Server re-broadcasts received CRDT operation to all other clients in the room
    Given users "user-editor-01", "user-editor-02", and "user-viewer-01" are all connected to room "doc-crdt-02"
    When user-editor-01 inserts "world" at position 20 and the operation reaches the server
    Then the server re-broadcasts the CRDT operation to user-editor-02 and user-viewer-01
    And both users receive the operation and apply it to their local CRDT state
    And the document content on all three clients converges to the same state
```

**Test Data:**
- Room: `doc-crdt-02`
- Operation from editor-01: `{ type: "insert", position: 20, content: "world" }`
- Expected convergence: all clients show "world" at position 20

**Preconditions:**
- All 3 users are connected, have joined the room, and have a baseline document state

---

### T-2.2: Server does NOT re-broadcast the operation back to the originating client
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Originating client does not receive its own operation re-broadcast
    Given users "user-editor-01" and "user-editor-02" are connected to room "doc-crdt-02"
    When user-editor-01 sends a CRDT insert operation to the server
    Then user-editor-02 receives the re-broadcast
    And user-editor-01 does NOT receive its own operation echoed back by the server
```

**Test Data:**
- Originator: `user-editor-01`
- Expected recipients: `user-editor-02` only (not originator)

**Preconditions:**
- Both users are connected and in the room

---

### T-3.1: End-to-end latency is under 500ms at P95 with 50 concurrent editors
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: End-to-end latency SLA

  Scenario: Change propagation meets 500ms P95 SLA under load
    Given 50 users are concurrently connected to room "doc-crdt-load-01" as editors
    And each user is sending 2 CRDT operations per second (100 ops/sec total)
    When load is sustained for 60 seconds
    Then at least 95% of change propagations (from local apply on sender to render on any remote peer) complete within 500ms
    And no propagation takes longer than 2 seconds (hard cap for outliers)
    And this is verified by load test tooling (not manual observation)
```

**Test Data:**
- Concurrent editors: 50
- Operation rate: 2 ops/user/second (100 ops/sec total)
- Duration: 60 seconds
- P95 latency target: < 500ms
- Hard cap: 2000ms

**Preconditions:**
- Load test harness is configured and connected to the WS service
- Network RTT to WS server: < 100ms

---

### T-4.1: All 10 rich text types produce CRDT operations that propagate correctly
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: All rich text types produce valid CRDT operations

  Scenario Outline: Each rich text operation type propagates to all room clients
    Given user "user-editor-01" and user "user-editor-02" are connected to room "doc-crdt-richtext-01"
    When user-editor-01 performs a "<rich_text_action>" in the document
    Then the resulting CRDT operation is transmitted to the server within 50ms
    And user-editor-02 receives the operation and renders it correctly
    And neither user's document enters an inconsistent state

    Examples:
      | rich_text_action                                         |
      | Insert H1 heading "Introduction"                         |
      | Apply bold mark to characters 0–10                       |
      | Apply italic mark to characters 5–12                     |
      | Apply underline mark to characters 15–20                 |
      | Insert an unordered list item "First item"               |
      | Insert an ordered list item "Step one"                   |
      | Insert an inline code block "const x = 1;"              |
      | Insert a fenced code block with language "javascript"    |
      | Insert a table with 3 columns and 2 rows                 |
      | Insert an image node with src "https://img.example.com/x.png" |
      | Insert a hyperlink "Click here" → "https://link.example.com" |
```

**Test Data:**
- All 10 operation types enumerated in Examples table
- Both users: edit-permission on `doc-crdt-richtext-01`

**Preconditions:**
- Both users are connected, in the room, and at the same baseline CRDT state

---

### T-4.2: A failed CRDT operation for one rich text type does not crash the editor
**Maps to:** AC-4
**Category:** happy-path (negative path)

```gherkin
  Scenario: Malformed CRDT operation for table insert is rejected without crashing editor
    Given user "user-editor-01" is connected to room "doc-crdt-richtext-01"
    When a malformed table CRDT operation is sent (missing required cell count)
    Then the server rejects the operation with code 4400 (Bad Request)
    And the server does NOT broadcast the malformed operation to other clients
    And user-editor-01's editor remains functional
    And other clients' document states are unchanged
```

**Test Data:**
- Malformed operation: `{ type: "insert_table", columns: null, rows: null }`

**Preconditions:**
- User is connected with edit permission

---

### T-5.1: Non-overlapping concurrent edits by two editors are auto-merged
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: Non-overlapping concurrent edit auto-merge

  Scenario: Two editors editing different sections auto-merge without conflict
    Given user "user-editor-01" and user "user-editor-02" are connected to room "doc-crdt-merge-01"
    And the document body contains 200 characters
    And user-editor-01 starts editing characters 0–50
    And user-editor-02 starts editing characters 100–150
    When both editors make simultaneous insertions in their respective ranges
    And their CRDT operations are exchanged via the server
    Then both editors' changes are preserved in the merged document state
    And neither user's insertion is lost
    And all clients converge to the same final document content
```

**Test Data:**
- Editor-01 insertion: `{ position: 25, content: "A-section-text" }`
- Editor-02 insertion: `{ position: 125, content: "B-section-text" }`
- Final document: contains both "A-section-text" and "B-section-text"

**Preconditions:**
- Both editors are connected to the same room
- Edits are to non-overlapping character ranges

---

## Boundary Tests

### T-6.1: Viewer receives CRDT operations broadcast in real time
**Maps to:** AC-6
**Category:** boundary

```gherkin
Feature: Viewer receives but cannot send CRDT operations

  Scenario: Viewer-role client receives and renders real-time CRDT updates
    Given user "user-viewer-01" with role "viewer" is connected to room "doc-crdt-viewer-01"
    And user "user-editor-01" with role "editor" is connected to the same room
    When user-editor-01 inserts "new content" at position 30
    Then the server re-broadcasts the operation to user-viewer-01
    And user-viewer-01's local CRDT state is updated and renders "new content" in real time
```

**Test Data:**
- Viewer: `{ id: "user-viewer-01", role: "viewer" }`
- Editor's operation: `{ type: "insert", position: 30, content: "new content" }`

**Preconditions:**
- Viewer is connected and joined the room with `view` permission level

---

### T-6.2: Write operation sent by a viewer is rejected by server with 4403
**Maps to:** AC-6
**Category:** boundary

```gherkin
  Scenario: Viewer CRDT write operation is rejected server-side with 4403
    Given user "user-viewer-01" with role "viewer" is connected to room "doc-crdt-viewer-01"
    When user-viewer-01 sends a CRDT insert operation over the WebSocket
    Then the server rejects the operation with code 4403
    And the server does NOT broadcast the operation to other room clients
    And user-viewer-01 receives an error message indicating insufficient permission
    And the document state for all other clients remains unchanged
```

**Test Data:**
- Viewer operation: `{ type: "insert", position: 10, content: "unauthorized text" }`
- Expected rejection code: `4403`

**Preconditions:**
- Viewer is connected with `view` permission level stored on the server-side connection

---

### T-7.1: Operations from a single client are applied on remote clients in causal order
**Maps to:** AC-7
**Category:** boundary

```gherkin
Feature: CRDT operation ordering

  Scenario: Operations O1, O2, O3 from one editor are applied in causal order on all peers
    Given user "user-editor-01" and user "user-editor-02" are connected to room "doc-crdt-order-01"
    When user-editor-01 sends CRDT operations O1 (insert "A"), O2 (insert "B"), O3 (insert "C") in sequence
    Then user-editor-02 receives and applies O1, O2, O3 in CRDT-causally-consistent order
    And the resulting document on user-editor-02 reflects A, B, C in the correct relative positions
    And no race condition causes B to be applied before A or C before B on any remote client
```

**Test Data:**
- O1: `{ type: "insert", position: 0, content: "A", seqNo: 1 }`
- O2: `{ type: "insert", position: 1, content: "B", seqNo: 2 }`
- O3: `{ type: "insert", position: 2, content: "C", seqNo: 3 }`
- Expected result on all clients: text begins with "ABC"

**Preconditions:**
- Both users are connected to the same room at the same CRDT baseline state

---

## Edge Case Tests

### T-8.1: CRDT propagation near the 5MB document size limit completes within 1 second at P95
**Maps to:** AC-8
**Category:** edge-case

```gherkin
Feature: Propagation performance near document size limit

  Scenario: CRDT broadcast remains under 1 second at P95 for a near-limit document
    Given a document "doc-crdt-large-01" with CRDT state size of 4.9MB (near the 5MB limit)
    And two editors are connected to the room
    When editor-01 makes a single text insertion
    Then the CRDT serialization and broadcast complete within 100ms (server-side)
    And the end-to-end latency (keypress to render on editor-02) is under 1000ms at P95
    And no error or crash occurs due to document size
```

**Test Data:**
- Document CRDT size: 4.9MB (pre-seeded fixture)
- Operation: single character insert `{ type: "insert", position: 100, content: "x" }`
- P95 latency target: < 1000ms
- Server-side serialization target: < 100ms

**Preconditions:**
- A test fixture document with ~4.9MB CRDT state is pre-loaded
- Both editors are connected

---

### T-9.1: Client catches up on missed operations after a brief reconnect
**Maps to:** AC-9
**Category:** edge-case

```gherkin
Feature: Client catch-up after brief disconnect

  Scenario: Reconnecting client receives and applies missed operations from the operation log
    Given user "user-editor-01" was connected to room "doc-crdt-catchup-01" and had CRDT state at sequence number 42
    And the user was disconnected for 15 seconds during which 10 operations (seqNo 43–52) were applied by other editors
    When user-editor-01 reconnects (per SYNC-01 backoff)
    And sends its last-known sequence number 42 to the server
    Then the server sends operations 43–52 to the client (gap-fill from SYNC-03 operation log)
    And the client applies them in causal order
    And the client's CRDT state converges to the current server state (seqNo 52)
    And no duplicate or missing operations appear in the client's document
```

**Test Data:**
- Client's last-known seqNo: `42`
- Missed operations: seqNo `43` through `52` (10 operations)
- Gap-fill request payload: `{ type: "catch_up", lastSeqNo: 42 }`

**Preconditions:**
- SYNC-03 operation log contains all 10 missed operations (seqNo 43–52)
- Client's session token is still valid after the 15-second disconnect

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated WebSocket connection cannot receive any CRDT operations
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Unauthenticated connection excluded from CRDT broadcast

  Scenario: CRDT operations are not broadcast to unauthenticated connections
    Given no valid session token is present
    When a WebSocket upgrade request is made to room "doc-crdt-secure-01"
    Then SYNC-01 rejects the connection with HTTP 401 during the handshake
    And no WebSocket connection is established
    And no CRDT operations — past, present, or future — are transmitted to that client
```

**Test Data:**
- Auth token: absent
- Expected: HTTP 401 during WS upgrade, no connection established

**Preconditions:**
- WS service is running; SYNC-01 authentication layer is active

---

### T-AUTH-2.1: Viewer-role client sending a CRDT write is rejected and not broadcast
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Write operations from insufficient-permission clients rejected

  Scenario: Viewer sending a CRDT write operation receives 4403 and it is not broadcast
    Given user "user-viewer-01" with role "viewer" is connected to room "doc-crdt-secure-01"
    And the server-side connection object records permission level "view" for this connection
    When user-viewer-01 sends a CRDT insert operation: { type: "insert", position: 5, content: "injected" }
    Then the server rejects the operation with code 4403
    And the server does NOT broadcast the operation to any other client in the room
    And the document state on all other clients remains unchanged
    And user-viewer-01 receives an error response: { error: "4403", message: "Insufficient permission to write" }
```

**Test Data:**
- Viewer user: `{ id: "user-viewer-01", role: "viewer", permissionLevel: "view" }`
- Rejected operation: `{ type: "insert", position: 5, content: "injected" }`
- Expected error: `{ error: "4403", message: "Insufficient permission to write" }`

**Preconditions:**
- Viewer is connected; `permissionLevel: "view"` is stored on the server-side connection object

---

### T-AUTH-2.2: Commenter-role client's CRDT write is also rejected
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Commenter sending a CRDT content write receives 4403
    Given user "user-commenter-01" with role "commenter" is connected to room "doc-crdt-secure-01"
    And the server-side connection object records permission level "comment" for this connection
    When user-commenter-01 sends a CRDT delete operation: { type: "delete", range: [0, 50] }
    Then the server rejects the operation with code 4403
    And the operation is not broadcast
    And the document content is unchanged
```

**Test Data:**
- Commenter: `{ id: "user-commenter-01", role: "commenter", permissionLevel: "comment" }`
- Rejected operation: `{ type: "delete", range: [0, 50] }`

**Preconditions:**
- User is connected; permission level `"comment"` is on the server-side connection

---

---

# Test Specifications: SYNC-03 — Server-Side Document State Persistence

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1, T-5.2 | boundary |
| AC-6 | T-6.1 | boundary |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1 | edge-case |
| AC-9 | T-9.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: CRDT operation is appended to the operation log within 500ms of server receipt
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: CRDT operation persistence to append-only log

  Scenario: Operation is durably written to the log within 500ms of being received
    Given user "user-editor-01" is connected to room "doc-persist-01" with edit permission
    When user-editor-01 inserts "persisted text" at position 5 and the CRDT operation reaches the server
    Then the server appends the operation to the document's CRDT operation log within 500ms
    And the log entry contains: document ID "doc-persist-01", a sequence number, the CRDT operation payload, and a server-received timestamp
    And the operation is readable from the log immediately after the 500ms window
```

**Test Data:**
- Document: `doc-persist-01`
- Operation payload: `{ type: "insert", position: 5, content: "persisted text", clientId: "user-editor-01" }`
- Expected log entry: `{ documentId: "doc-persist-01", seqNo: 1, payload: <operation>, receivedAt: <timestamp> }`
- Persistence latency threshold: 500ms

**Preconditions:**
- Document `doc-persist-01` exists in the documents table
- CRDT operation log table exists with correct foreign key to documents table
- Database write latency is within normal operating range

---

### T-1.2: Multiple sequential operations are appended with monotonically increasing sequence numbers
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Three sequential operations are stored with distinct, incrementing sequence numbers
    Given user "user-editor-01" is connected to room "doc-persist-01" with edit permission
    When the user sends three operations in sequence: insert "A", insert "B", insert "C"
    Then the CRDT operation log for "doc-persist-01" contains three entries
    And the entries have sequence numbers 1, 2, 3 respectively
    And the entries are in the order they were received
    And no two entries share the same sequence number
```

**Test Data:**
- Op1: `{ type: "insert", content: "A" }` → seqNo: 1
- Op2: `{ type: "insert", content: "B" }` → seqNo: 2
- Op3: `{ type: "insert", content: "C" }` → seqNo: 3

**Preconditions:**
- Document `doc-persist-01` exists; operation log is empty before the test

---

### T-2.1: Server computes and stores a snapshot after 5 minutes of edit activity
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Periodic CRDT state snapshot

  Scenario: Snapshot is created after 5 minutes of edit activity
    Given document "doc-persist-02" has had at least one CRDT operation since the last snapshot
    And the document has been receiving at least one operation per minute (active editing)
    When 5 minutes of edit activity have elapsed since the last snapshot
    Then the server computes a new snapshot of the current merged CRDT state
    And stores the snapshot in the database with: document ID "doc-persist-02", snapshot sequence number, the operation log index it was computed from, and a wall-clock timestamp
    And the new snapshot supersedes the previous snapshot for fast-load purposes
```

**Test Data:**
- Document: `doc-persist-02`
- Activity window: 5 minutes with at least one operation per minute
- Expected snapshot record: `{ documentId: "doc-persist-02", snapshotSeqNo: 1, lastOpIndex: <N>, computedAt: <timestamp>, statePayload: <crdt-binary> }`

**Preconditions:**
- Document exists; operation log contains entries from the last 5 minutes
- No snapshot has been computed in the last 5 minutes

---

### T-2.2: A document with no activity since last snapshot does not trigger a new snapshot
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Idle document does not generate a new snapshot after 5 minutes
    Given document "doc-persist-03" has had NO CRDT operations in the past 5 minutes
    When the 5-minute snapshot interval fires
    Then no new snapshot is computed or stored for "doc-persist-03"
    And the existing snapshot for "doc-persist-03" is unchanged
```

**Test Data:**
- Document: `doc-persist-03`
- Activity window: 0 operations in the past 5 minutes

**Preconditions:**
- Previous snapshot exists; no new operations have been received

---

### T-3.1: New client joining a room receives snapshot + delta and loads document under 3 seconds
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Efficient initial state load for new clients

  Scenario: Joining client receives latest snapshot plus subsequent operations in under 3 seconds
    Given document "doc-persist-04" has a snapshot at operation index 50 and operations 51–65 in the log
    And the total CRDT state size is approximately 3MB
    When user "user-editor-new-01" joins room "doc-persist-04"
    Then the server sends the latest snapshot (index 50) to the client first
    And then sends operations 51–65 (the delta since the snapshot)
    And the client applies them in sequence to reconstruct the current document state
    And the total time from join to document ready is under 3 seconds
```

**Test Data:**
- Document: `doc-persist-04` (3MB CRDT state)
- Latest snapshot: at seqNo 50
- Delta operations: seqNo 51–65 (15 operations)
- Initial load time target: < 3 seconds

**Preconditions:**
- Snapshot at seqNo 50 exists in the database
- Operations 51–65 are in the operation log
- Client's WebSocket connection is established and room join is acknowledged

---

### T-3.2: New client joining a document with no snapshot receives full operation log replay
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Client joining document with no snapshot receives full log replay under 3 seconds
    Given document "doc-persist-05" has 80 operations in the log and NO snapshot yet
    And the total CRDT state size for these operations is under 5MB
    When user "user-editor-new-02" joins room "doc-persist-05"
    Then the server sends all 80 operations in sequence
    And the client applies them to reconstruct the document
    And total load time is under 3 seconds
```

**Test Data:**
- Document: `doc-persist-05`
- Operation log: 80 entries (seqNo 1–80)
- Snapshot: none
- Load time target: < 3 seconds

**Preconditions:**
- Operation log is populated; no snapshot record exists for the document

---

### T-4.1: Document state is fully recoverable after WS service restart
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Document state persistence through WS service restart

  Scenario: Clients reconnect after a WS service restart and receive unchanged document state
    Given document "doc-persist-06" has an active room with 3 connected clients
    And 20 CRDT operations have been acknowledged and persisted before the restart
    When the WS service restarts (simulated crash and recovery)
    And clients reconnect per SYNC-01 backoff
    Then the server reconstitutes room "doc-persist-06" from the database (latest snapshot + delta)
    And each reconnecting client receives the current document state as if no restart occurred
    And all 20 acknowledged operations are present in the reconstituted state
    And no operations acknowledged before the restart are missing
```

**Test Data:**
- Document: `doc-persist-06`
- Operations before restart: 20 (all acknowledged)
- Reconnecting clients: 3 users

**Preconditions:**
- All 20 operations were written to the database before the simulated restart
- WS service restart completes and service becomes available again

---

## Boundary Tests

### T-5.1: Existing operation log entries cannot be updated or deleted by the application role
**Maps to:** AC-5
**Category:** boundary

```gherkin
Feature: Operation log immutability

  Scenario: Application database role cannot UPDATE or DELETE operation log entries
    Given the application database role "app_crdt_writer" is used for CRDT operations
    And the operation log table has 10 entries for document "doc-persist-07"
    When "app_crdt_writer" attempts to execute "UPDATE crdt_operations SET payload = '{}' WHERE id = 1"
    Then the database returns a permission denied error
    And the operation log entry remains unchanged
    When "app_crdt_writer" attempts to execute "DELETE FROM crdt_operations WHERE id = 1"
    Then the database returns a permission denied error
    And the operation log entry is not deleted
```

**Test Data:**
- DB role: `"app_crdt_writer"` (INSERT-only on `crdt_operations` table)
- Table: `crdt_operations`
- Existing entry ID: `1`

**Preconditions:**
- Database is configured with the `app_crdt_writer` role having INSERT privilege only on `crdt_operations`
- At least one operation log entry exists

---

### T-5.2: Operation log only allows appends — no mutations to existing records
**Maps to:** AC-5
**Category:** boundary

```gherkin
  Scenario: Only append (INSERT) is possible on the operation log table
    Given the application database role "app_crdt_writer"
    When "app_crdt_writer" executes an INSERT on the "crdt_operations" table
    Then the INSERT succeeds and a new log entry is created
    And the existing entries are unmodified
    And the new entry's sequence number is greater than all existing entries
```

**Test Data:**
- New operation: `{ documentId: "doc-persist-07", seqNo: 11, payload: "{}", receivedAt: now() }`

**Preconditions:**
- 10 prior entries exist; application role has INSERT-only access

---

### T-6.1: All operations are durably written under 100 ops/sec load without data loss
**Maps to:** AC-6
**Category:** boundary

```gherkin
Feature: High-volume operation log write durability

  Scenario: 100 CRDT operations per second are all durably persisted without loss
    Given 50 concurrent editors are connected to document room "doc-persist-load-01"
    And each editor is producing 2 CRDT operations per second (100 ops/sec total)
    When the load is sustained for 30 seconds (3,000 total operations)
    Then all 3,000 operations are present in the operation log after the load period
    And no duplicate sequence numbers exist
    And write latency for each operation does not exceed 500ms
    And the SYNC-02 broadcast SLA of 500ms end-to-end is not violated by persistence overhead
```

**Test Data:**
- Editors: 50 concurrent
- Rate: 2 ops/editor/sec = 100 ops/sec
- Duration: 30 seconds
- Total expected operations: 3,000
- Write latency per operation: < 500ms

**Preconditions:**
- Database is provisioned with adequate IOPS for the write volume
- All 50 editors have active WebSocket connections and edit permissions

---

## Edge Case Tests

### T-7.1: Reconnecting client with a known last sequence number receives only the delta
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Gap-fill for reconnecting clients

  Scenario: Client sends last-known seqNo and receives only subsequent operations
    Given document "doc-persist-08" has 60 operations in the log (seqNo 1–60)
    And user "user-editor-reconnect-01" last received operation seqNo 45 before disconnecting
    When the user reconnects and sends: { type: "catch_up", lastSeqNo: 45 }
    Then the server responds with only operations 46–60 (15 operations)
    And does NOT resend operations 1–45
    And the client applies operations 46–60 to catch up to the current state
    And the client's CRDT state converges to seqNo 60
```

**Test Data:**
- Document: `doc-persist-08`
- Client's last seqNo: `45`
- Missed operations: seqNo `46–60`
- Gap-fill payload: `{ type: "catch_up", documentId: "doc-persist-08", lastSeqNo: 45 }`
- Expected response: array of 15 operations

**Preconditions:**
- Operations 1–60 exist in the operation log
- Client reconnected and re-joined the room before sending the catch-up request

---

### T-8.1: Snapshot computation runs asynchronously and does not delay operation broadcast
**Maps to:** AC-8
**Category:** edge-case

```gherkin
Feature: Asynchronous snapshot computation

  Scenario: New operations are broadcast and persisted while a snapshot is being computed
    Given a snapshot computation has been triggered for document "doc-persist-09" (large document, ~3MB)
    And the snapshot computation is estimated to take 5+ seconds
    When a new CRDT operation arrives during snapshot computation
    Then the new operation is appended to the operation log immediately (without waiting for the snapshot)
    And the new operation is broadcast to all room clients without delay
    And the snapshot computation completes in the background
    And the snapshot, when stored, correctly includes all operations up to (and not beyond) its trigger point
```

**Test Data:**
- Document: `doc-persist-09` (~3MB CRDT state)
- Operation during snapshot: `{ type: "insert", position: 100, content: "concurrent" }`
- Snapshot computation budget: up to 10 seconds (async)

**Preconditions:**
- Snapshot has been triggered (5-minute activity window elapsed)
- At least one other editor is connected to verify broadcast is not blocked

---

### T-9.1: No CRDT log entries are created for a document whose creation failed
**Maps to:** AC-9
**Category:** edge-case

```gherkin
Feature: No orphaned operation log entries for failed documents

  Scenario: Rolled-back document creation leaves no operation log entries
    Given a document creation request is initiated for a new document "doc-failed-01"
    And the document creation transaction is rolled back (simulated DB failure mid-transaction)
    When the persistence layer is checked
    Then no operation log entries exist for document "doc-failed-01" in the crdt_operations table
    And no snapshot entries exist for "doc-failed-01" in the crdt_snapshots table
    And the foreign key constraint prevents any orphaned entries from being created
```

**Test Data:**
- Document ID: `"doc-failed-01"` (never committed to documents table)
- Simulated failure: transaction rollback after document insert, before CRDT log init

**Preconditions:**
- Database schema has a foreign key: `crdt_operations.document_id → documents.id` (with NO ACTION or RESTRICT on delete)
- The document `"doc-failed-01"` does NOT exist in the `documents` table

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to the document state API returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Unauthenticated access to document state API rejected

  Scenario: GET /api/documents/:id/state without auth token returns 401
    Given no valid authentication token is present
    When an HTTP GET request is made to "GET /api/documents/doc-persist-10/state"
    Then the API returns HTTP 401 Unauthorized
    And the response body does not contain any CRDT state data
    And neither the snapshot nor any operation log entries are disclosed
```

**Test Data:**
- Request: `GET /api/documents/doc-persist-10/state`
- Auth header: absent
- Expected response: `{ status: 401, error: "Unauthorized" }`

**Preconditions:**
- Document `doc-persist-10` exists with persisted CRDT state
- No session cookie or Authorization header is present in the request

---

### T-AUTH-2.1: Authenticated user with no document access to state API receives 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Insufficient permissions for state access rejected

  Scenario: GET /api/documents/:id/state by a user with no document access returns 403
    Given user "user-noaccess-02" is globally authenticated with session token "tok-noaccess-def"
    And "user-noaccess-02" has no permission record for document "doc-persist-10"
    When an HTTP GET request is made to "GET /api/documents/doc-persist-10/state" with "Authorization: Bearer tok-noaccess-def"
    Then the API returns HTTP 403 Forbidden
    And the response body does not contain any CRDT state data
    And neither the snapshot payload nor any operation log entries are disclosed in the response
```

**Test Data:**
- User: `{ id: "user-noaccess-02", email: "noaccess2@example.com" }`
- Token: `"tok-noaccess-def"` (valid global auth token)
- Document: `"doc-persist-10"` (user has no row in `document_permissions` for this document)
- Expected response: `{ status: 403, error: "Forbidden" }`

**Preconditions:**
- User is globally authenticated; document exists with state; no permission record for the user on this document


# Test Specifications: Batch 04 of 11

---

# Test Specifications: PRES-01 — User Presence List

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1, T-4.2 | edge-case |
| AC-5 | T-5.1, T-5.2 | edge-case |
| AC-6 | T-6.1, T-6.2 | happy-path |
| AC-7 | T-7.1 | error-handling |
| AC-8 | T-8.1 | boundary |
| AC-9 | T-9.1, T-9.2 | edge-case |
| AC-10 | T-10.1 | error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: User appears in all connected clients' presence lists within 2 seconds of joining
**Maps to:** AC-1  
**Category:** happy-path

```gherkin
Feature: User Presence List

  Scenario: New user joins document and appears in existing clients' presence lists
    Given the document "doc-abc-123" is open with Client B authenticated as user
      | field        | value                |
      | user_id      | user-002             |
      | display_name | "Jane Smith"         |
      | avatar_url   | "/avatars/user002.png" |
      | role         | editor               |
    And Client B's WebSocket session is established
    When Client A authenticates as user
      | field        | value                |
      | user_id      | user-001             |
      | display_name | "Alice Doe"          |
      | avatar_url   | "/avatars/user001.png" |
      | role         | editor               |
    And Client A opens document "doc-abc-123"
    And Client A's WebSocket session is established
    Then within 2000 milliseconds, Client B's presence list contains an entry with
      | field        | value                |
      | display_name | "Alice Doe"          |
      | avatar_url   | "/avatars/user001.png" |
      | role_badge   | "Editing"            |
    And Client A's own entry appears in Client A's presence list
```

**Test Data:**
- Document ID: `doc-abc-123`
- Client A: `{ user_id: "user-001", display_name: "Alice Doe", avatar_url: "/avatars/user001.png", role: "editor" }`
- Client B: `{ user_id: "user-002", display_name: "Jane Smith", avatar_url: "/avatars/user002.png", role: "editor" }`
- Timing threshold: 2000ms

**Preconditions:**
- Document `doc-abc-123` exists
- Both users have valid auth tokens with editor role on the document
- WebSocket server is running (SYNC-01 dependency active)

---

### T-1.2: User's role badge correctly reflects permission at join time
**Maps to:** AC-1, AC-3  
**Category:** happy-path

```gherkin
  Scenario: Joining viewer's badge reads "Viewing" in other clients' presence lists
    Given document "doc-abc-123" has Client B open as editor user-002
    When Client C authenticates as user
      | field        | value                |
      | user_id      | user-003             |
      | display_name | "Bob Viewer"         |
      | role         | viewer               |
    And Client C opens document "doc-abc-123"
    And Client C's WebSocket session is established
    Then within 2000 milliseconds, Client B's presence list entry for "Bob Viewer" shows
      | field      | value     |
      | role_badge | "Viewing" |
    And the badge does not read "Editing"
```

**Test Data:**
- Client C: `{ user_id: "user-003", display_name: "Bob Viewer", role: "viewer" }`

**Preconditions:**
- Document `doc-abc-123` exists
- Client B already connected as editor
- user-003 has viewer-level permission on the document

---

### T-2.1: User disappears from presence list within 5 seconds of clean tab close
**Maps to:** AC-2  
**Category:** happy-path

```gherkin
  Scenario: User closes tab and is removed from presence list via heartbeat expiry
    Given document "doc-abc-123" is open with two clients
      | client   | user_id  | display_name |
      | Client A | user-001 | "Alice Doe"  |
      | Client B | user-002 | "Jane Smith" |
    And both clients' presence entries are visible to each other
    When Client A closes its browser tab
    And the WebSocket connection for Client A is terminated cleanly
    Then within 5000 milliseconds, Client B's presence list no longer contains an entry for "Alice Doe"
    And Client B's presence list does not show any stale entry for user-001
```

**Test Data:**
- Both users pre-established in presence list
- Clean WebSocket close (code 1000)

**Preconditions:**
- Both clients connected and visible in each other's presence lists

---

### T-2.2: User disappears within 5 seconds of browser navigate-away
**Maps to:** AC-2  
**Category:** happy-path

```gherkin
  Scenario: User navigates away from document and is removed from presence list
    Given document "doc-abc-123" is open with Client A (user-001) and Client B (user-002)
    When Client A navigates to a different URL, triggering WebSocket close
    Then within 5000 milliseconds, Client B's presence list no longer contains "Alice Doe"
```

**Test Data:**
- Navigation triggers `beforeunload` + WebSocket close

**Preconditions:**
- Both clients active in presence list

---

### T-3.1: Editor role badge reads "Editing"
**Maps to:** AC-3  
**Category:** happy-path

```gherkin
  Scenario: Editor role badge is "Editing" for a user with edit permission
    Given document "doc-abc-123" has user-002 (editor) already connected
    When user-001 with role "editor" joins the document session
    Then Client B's presence list entry for user-001 shows role_badge = "Editing"
```

**Test Data:**
- user-001 document permission: `editor`

**Preconditions:**
- user-001 has edit permission record in the system

---

### T-3.2: Comment-only role badge reads "Viewing"
**Maps to:** AC-3  
**Category:** happy-path

```gherkin
  Scenario: Commenter role badge is "Viewing"
    Given document "doc-abc-123" has user-002 (editor) already connected
    When user-004 with role "commenter" joins the document session
    Then Client B's presence list entry for user-004 shows role_badge = "Viewing"
    And the badge does not read "Editing"
```

**Test Data:**
- user-004: `{ user_id: "user-004", display_name: "Carol Commenter", role: "commenter" }`

**Preconditions:**
- user-004 has comment-only permission on the document

---

### T-4.1: Overflow indicator shows "+N more" when more than 10 users are connected
**Maps to:** AC-4  
**Category:** edge-case

```gherkin
  Scenario: Presence list shows 10 avatars and overflow label when 13 users are connected
    Given document "doc-abc-123" has 12 existing connected users (user-001 through user-012)
    When user-013 joins the document session
    Then the presence list UI renders exactly 10 avatar entries
    And a label "+3 more" is displayed
    And the label "+3 more" accurately reflects the count of 3 additional users beyond 10
```

**Test Data:**
- 13 connected users: `user-001` through `user-013`
- Expected overflow count: `13 - 10 = 3`

**Preconditions:**
- All 13 users authenticated with valid document-level roles
- WebSocket server supports 13 concurrent connections on the document

---

### T-4.2: Overflow count updates accurately when additional users join beyond 10
**Maps to:** AC-4  
**Category:** edge-case

```gherkin
  Scenario: Overflow count increments when a 14th user joins
    Given the presence list shows 10 avatars and "+3 more" (13 users total)
    When user-014 joins the document session
    Then the overflow label updates to "+4 more"
    And the number of rendered avatars remains exactly 10
```

**Test Data:**
- 14th user: `{ user_id: "user-014", display_name: "User Fourteen", role: "viewer" }`

**Preconditions:**
- 13 users already connected

---

### T-5.1: Presence list shows only current user when no others are connected
**Maps to:** AC-5  
**Category:** edge-case

```gherkin
  Scenario: User opens a document with no other connected users
    Given document "doc-abc-123" has no currently connected users
    When user-001 opens document "doc-abc-123"
    And the WebSocket session is established
    Then the presence list shows only user-001's own entry
    And no phantom entries from previous sessions are present
    And the UI does not display an error or empty-state label indicating others are present
```

**Test Data:**
- Document has session history but all prior users have disconnected

**Preconditions:**
- Previous sessions have fully expired (all heartbeats timed out)
- Document exists and is accessible to user-001

---

### T-5.2: Presence list does not retain stale entries after server restart
**Maps to:** AC-5  
**Category:** edge-case

```gherkin
  Scenario: No stale presence entries after server-side session cleanup
    Given the WebSocket server was restarted and all presence state was cleared
    When user-001 opens document "doc-abc-123"
    Then the presence list contains no entries except user-001's own
    And no users from pre-restart sessions appear
```

**Test Data:**
- Server restart scenario (forced session state wipe)

**Preconditions:**
- Server-side presence store is cleared
- user-001 has valid auth token

---

### T-6.1: New user joining mid-session appears in all existing clients' lists within 2 seconds
**Maps to:** AC-6  
**Category:** happy-path

```gherkin
  Scenario: Presence list updates dynamically when a new user joins mid-session
    Given document "doc-abc-123" is open with 3 connected clients (user-001, user-002, user-003)
    When user-004 opens document "doc-abc-123" and their WebSocket session is established
    Then within 2000 milliseconds, user-001's presence list contains an entry for user-004
    And within 2000 milliseconds, user-002's presence list contains an entry for user-004
    And within 2000 milliseconds, user-003's presence list contains an entry for user-004
    And no page reload was required
```

**Test Data:**
- Pre-existing clients: `user-001`, `user-002`, `user-003`
- Joining user: `{ user_id: "user-004", display_name: "Dan Joiner", role: "editor" }`

**Preconditions:**
- 3 clients already connected and stable

---

### T-6.2: User leaving mid-session is removed from all clients' lists within 5 seconds
**Maps to:** AC-6  
**Category:** happy-path

```gherkin
  Scenario: Presence list updates dynamically when an existing user leaves
    Given document "doc-abc-123" is open with clients user-001, user-002, user-003, user-004
    When user-004 closes their connection
    Then within 5000 milliseconds, user-001's presence list does not contain user-004
    And within 5000 milliseconds, user-002's presence list does not contain user-004
    And within 5000 milliseconds, user-003's presence list does not contain user-004
    And no page reload was required on any client
```

**Preconditions:**
- All 4 users connected and visible

---

### T-7.1: Network failure does not leave stale presence entry beyond heartbeat window
**Maps to:** AC-7  
**Category:** error-handling

```gherkin
  Scenario: User's abrupt network failure results in removal within 5 seconds of heartbeat timeout
    Given user-001 and user-002 are connected to document "doc-abc-123"
    When user-001's network connection is killed without a clean WebSocket close
      (simulated via process kill or network partition)
    And 5000 milliseconds elapse after the server detects heartbeat timeout
    Then user-002's presence list no longer contains an entry for user-001
    And no stale entry for user-001 persists beyond the 5-second window
```

**Test Data:**
- Heartbeat timeout setting: 5000ms
- Network kill method: TCP RST / process SIGKILL (no WebSocket close frame)

**Preconditions:**
- Both clients active in presence list
- Server-side heartbeat monitor running

---

### T-8.1: Viewer's badge always reads "Viewing" regardless of client-side state
**Maps to:** AC-8  
**Category:** boundary

```gherkin
  Scenario: View-only user cannot be displayed as "Editing" even with tampered client state
    Given user-005 has view-only permission on document "doc-abc-123"
    And user-002 (editor) is connected to the document
    When user-005 joins the document session
    And an attempt is made to override the role badge to "Editing" via a crafted client message
    Then user-002's presence list entry for user-005 shows role_badge = "Viewing"
    And the server-authoritative role is used, not the client-supplied value
```

**Test Data:**
- user-005: `{ user_id: "user-005", display_name: "Eve Viewer", server_role: "viewer" }`
- Crafted client payload: `{ role_badge: "Editing" }`

**Preconditions:**
- user-005 has view-only server-side permission record
- Server validates role from its own data, not from presence join payload

---

### T-9.1: User's presence is restored after brief reconnect with no duplicate entry
**Maps to:** AC-9  
**Category:** edge-case

```gherkin
  Scenario: Client reconnects within 5-second heartbeat window without creating duplicate presence
    Given user-001 and user-002 are connected to document "doc-abc-123"
    When user-001 experiences a 3-second network interruption
    And user-001's client auto-reconnects within the 5-second heartbeat window
    Then user-002's presence list contains exactly one entry for user-001
    And no duplicate entry for user-001 appears
    And user-001's own presence list reflects accurate current state
```

**Test Data:**
- Disconnection duration: 3000ms (within the 5s threshold)
- Auto-reconnect: client reconnect logic fires within 1s of disconnect

**Preconditions:**
- Both clients active
- Server heartbeat timeout: 5000ms
- Client auto-reconnect enabled

---

### T-9.2: Reconnect after heartbeat expiry creates a fresh presence event without duplicate
**Maps to:** AC-9  
**Category:** edge-case

```gherkin
  Scenario: Client reconnects after heartbeat expiry and re-appears as a new presence event
    Given user-001 and user-002 are connected to document "doc-abc-123"
    When user-001's connection is interrupted for 6 seconds (beyond the 5-second heartbeat window)
    And user-001's presence entry is removed from user-002's list after 5 seconds
    And user-001's client then reconnects
    Then user-002's presence list contains exactly one entry for user-001 (re-added)
    And no stale duplicate entry exists
```

**Test Data:**
- Disconnection duration: 6000ms (exceeds 5s heartbeat timeout)

**Preconditions:**
- Server has expired user-001's presence before reconnect

---

### T-10.1: Document deletion clears all presence entries and notifies clients
**Maps to:** AC-10  
**Category:** error-handling

```gherkin
  Scenario: Document is deleted while users are connected
    Given document "doc-abc-123" is open with 3 connected clients (user-001, user-002, user-003)
    When an authorized admin deletes document "doc-abc-123"
    And the deletion event is broadcast to the WebSocket session
    Then the presence list is cleared for user-001's client
    And the presence list is cleared for user-002's client
    And the presence list is cleared for user-003's client
    And each client displays an in-app notification: "This document has been deleted."
    And the WebSocket collaboration session is terminated for all clients
```

**Test Data:**
- Document ID: `doc-abc-123`
- Admin user: `{ user_id: "admin-001", role: "admin" }`
- Expected notification text: `"This document has been deleted."`

**Preconditions:**
- 3 clients actively connected
- Admin user has delete permission

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to join presence session returns 401
**Maps to:** AC-AUTH-1  
**Category:** security

```gherkin
  Scenario: Unauthenticated WebSocket join attempt is rejected with 401
    Given no valid authentication token is present in the request
    When a WebSocket upgrade request is made to join document "doc-abc-123" presence session
      | header          | value |
      | Authorization   | (none) |
    Then the server returns HTTP 401 Unauthorized
    And no presence entry is created for the requester
    And no presence list broadcast is triggered
    And the WebSocket connection is not established
```

**Test Data:**
- Request: WebSocket upgrade to `/ws/docs/doc-abc-123/presence`
- Auth header: absent

**Preconditions:**
- Document `doc-abc-123` exists
- Server auth middleware is active

---

### T-AUTH-2.1: Authenticated user without document access returns 403
**Maps to:** AC-AUTH-2  
**Category:** security

```gherkin
  Scenario: Authenticated user with no document role is rejected with 403
    Given user-099 is authenticated with a valid token
    But user-099 has no role (viewer, commenter, or editor) on document "doc-abc-123"
    When user-099 makes a WebSocket upgrade request to join document "doc-abc-123" presence session
    Then the server returns HTTP 403 Forbidden
    And no presence entry is created for user-099
    And no presence broadcast is triggered
    And existing clients do not see user-099 in their presence lists
```

**Test Data:**
- user-099: `{ user_id: "user-099", display_name: "Unauthorized User" }` — valid token, no document permission
- Document: `doc-abc-123`

**Preconditions:**
- user-099 exists in the auth system but has no permission record for `doc-abc-123`

---

## Negative Tests

### T-NEG-1.1: Avatar image load failure falls back to initials avatar
**Maps to:** NFR — Error Handling  
**Category:** error-handling

```gherkin
  Scenario: Avatar image URL returns 404 and initials-based fallback is shown
    Given user-001 has avatar_url = "/avatars/broken-image.png" which returns 404
    When user-001 joins document "doc-abc-123" and appears in Client B's presence list
    Then Client B's presence list shows an initials-based avatar derived from "Alice Doe" (e.g., "AD")
    And no broken image icon is displayed
```

**Test Data:**
- user-001 avatar_url: `/avatars/broken-image.png` (returns 404)
- Expected fallback: initials `"AD"`

---

### T-NEG-1.2: WebSocket server unreachable shows degraded state without crashing
**Maps to:** NFR — Error Handling  
**Category:** error-handling

```gherkin
  Scenario: Presence list shows error state when WebSocket server is unreachable
    Given the WebSocket server is unreachable (connection refused)
    When user-001 opens document "doc-abc-123"
    Then the presence list displays "Unable to load collaborators"
    And the document editor remains usable in single-user degraded mode
    And no JavaScript exception is thrown that prevents the page from loading
```

**Preconditions:**
- WebSocket server is stopped or firewalled

---

## Boundary Tests

### T-BOUND-1.1: Exactly 10 users connected — no overflow shown
**Maps to:** AC-4  
**Category:** boundary

```gherkin
  Scenario: Presence list with exactly 10 connected users shows no overflow label
    Given exactly 10 users (user-001 through user-010) are connected to document "doc-abc-123"
    When the presence list is rendered for any client
    Then 10 avatars are displayed
    And no overflow "+N more" label is shown
```

**Test Data:**
- Exactly 10 connected users

---

### T-BOUND-1.2: 11th user triggers overflow label "+1 more"
**Maps to:** AC-4  
**Category:** boundary

```gherkin
  Scenario: Presence list with 11 connected users shows 10 avatars and "+1 more"
    Given 10 users are already connected to document "doc-abc-123"
    When user-011 joins the document
    Then the presence list shows exactly 10 avatars
    And the overflow label reads "+1 more"
```

**Test Data:**
- 11th user: `{ user_id: "user-011", display_name: "User Eleven" }`

---

---

# Test Specifications: PRES-02 — Colored Cursors and Name Labels

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1, T-4.2 | edge-case |
| AC-5 | T-5.1, T-5.2 | boundary |
| AC-6 | T-6.1, T-6.2 | edge-case |
| AC-7 | T-7.1 | happy-path |
| AC-8 | T-8.1 | boundary |
| AC-9 | T-9.1 | performance |
| AC-10 | T-10.1, T-10.2 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Remote editor cursor appears as colored caret at correct position
**Maps to:** AC-1  
**Category:** happy-path

```gherkin
Feature: Colored Cursors and Name Labels

  Scenario: Editor B's cursor appears as a colored caret for Editor A
    Given document "doc-abc-123" is open with two editor sessions
      | session  | user_id  | display_name | assigned_color |
      | Client A | user-001 | "Alice Doe"  | "#E63946"      |
      | Client B | user-002 | "Jane Smith" | "#457B9D"      |
    And both clients have active WebSocket connections
    When Editor B (user-002) moves their cursor to character position 42
    Then within 500 milliseconds, Client A's document view shows a colored caret at position 42
    And the caret color is "#457B9D" (Editor B's assigned color)
    And the caret is visually distinct from the local cursor
```

**Test Data:**
- Editor B cursor position: character offset 42
- Editor B assigned color: `#457B9D`
- Timing threshold: 500ms

**Preconditions:**
- Both clients have editor permission on the document
- CRDT position format agreed (SPIKE-01 dependency noted)
- WebSocket connection active

---

### T-1.2: Cursor updates in real time as Editor B types
**Maps to:** AC-1  
**Category:** happy-path

```gherkin
  Scenario: Remote cursor position updates as Editor B types successive characters
    Given Client A and Client B are both editors on document "doc-abc-123"
    And Client B's cursor is initially visible to Client A at position 42
    When Editor B types the character "H" causing cursor to advance to position 43
    And then types "i" causing cursor to advance to position 44
    Then Client A sees Editor B's caret update to position 43 within 500ms of each keystroke
    And then to position 44 within 500ms of the second keystroke
    And the caret color "#457B9D" remains consistent throughout
```

**Test Data:**
- Keystroke sequence: `H`, `i` at position 42
- Expected positions after each keystroke: 43, 44

**Preconditions:**
- Both clients connected; cursor broadcast channel active

---

### T-2.1: Remote text selection rendered as colored highlight
**Maps to:** AC-2  
**Category:** happy-path

```gherkin
  Scenario: Editor B's text selection appears as colored highlight for Editor A
    Given Client A and Client B are both editing document "doc-abc-123"
    And Editor B's assigned color is "#457B9D"
    When Editor B selects the text range from character position 10 to position 25
    And the selection event is broadcast
    Then Client A sees a highlight overlay in color "#457B9D" covering positions 10–25
    And the highlight does not obscure the underlying text's readability
    And Client A's own cursor and selections are unaffected
```

**Test Data:**
- Selection range: `{ start: 10, end: 25 }`
- Editor B color: `#457B9D`

**Preconditions:**
- Both clients have edit roles; cursor broadcast active

---

### T-2.2: Selection highlight clears when Editor B deselects
**Maps to:** AC-2  
**Category:** happy-path

```gherkin
  Scenario: Remote selection highlight is removed when Editor B clicks to deselect
    Given Client A sees Editor B's selection highlight over positions 10–25
    When Editor B clicks to collapse their selection to a cursor at position 15
    And the deselection event is broadcast
    Then Client A no longer sees the highlight overlay over positions 10–25
    And Client A sees only a cursor caret at position 15 for Editor B
```

**Preconditions:**
- Editor B's selection highlight was previously visible to Client A

---

### T-3.1: Name label appears on hover over remote cursor caret
**Maps to:** AC-3  
**Category:** happy-path

```gherkin
  Scenario: Hovering over remote cursor shows name label
    Given Client A can see Editor B's cursor caret at position 42 in color "#457B9D"
    When the local user hovers the mouse pointer over Editor B's caret
    Then a name label "Jane Smith" appears adjacent to the caret
    And the label is rendered in color "#457B9D"
    And the label disappears when the mouse moves away from the caret
```

**Test Data:**
- Remote editor display name: `"Jane Smith"`
- Label color: same as cursor color `#457B9D`

**Preconditions:**
- Editor B's cursor is visible to Client A
- Hover interaction supported on the target platform

---

### T-4.1: Same user always receives the same cursor color across sessions
**Maps to:** AC-4  
**Category:** edge-case

```gherkin
  Scenario: User's cursor color is deterministic across multiple sessions
    Given user-002 ("Jane Smith") joins document "doc-abc-123" in Session 1
    And their assigned cursor color is "#457B9D"
    When user-002 closes and reopens the document in a new Session 2
    Then user-002's assigned cursor color in Session 2 is "#457B9D"
    And the color was derived deterministically from user_id "user-002"
```

**Test Data:**
- user-002: `{ user_id: "user-002" }`
- Hash-to-color function input: `"user-002"`, expected output: `"#457B9D"` (deterministic)

**Preconditions:**
- Color assignment function is deterministic given user_id

---

### T-4.2: Cursor color does not change when other users join or leave
**Maps to:** AC-4  
**Category:** edge-case

```gherkin
  Scenario: Existing user's cursor color remains stable when a new user joins
    Given Client A (user-001, color "#E63946") and Client B (user-002, color "#457B9D") are in a session
    When user-003 joins the document session
    Then Client A's cursor color remains "#E63946"
    And Client B's cursor color remains "#457B9D"
    And user-003 is assigned a distinct color
```

**Test Data:**
- user-003: `{ user_id: "user-003", expected_color: "#2A9D8F" }` (deterministic from ID)

**Preconditions:**
- Clients A and B active with their colors established

---

### T-5.1: Viewer's cursor caret is not shown in the document
**Maps to:** AC-5  
**Category:** boundary

```gherkin
  Scenario: View-only user does not produce a cursor overlay in other clients' documents
    Given document "doc-abc-123" has Editor A (user-001) and Viewer C (user-003, role: viewer) connected
    When Viewer C clicks at various positions in the document
    And Viewer C's presence is broadcast
    Then Editor A's document view shows no cursor caret or selection overlay for user-003
    And Editor A's presence list still shows user-003's entry (with "Viewing" badge)
```

**Test Data:**
- user-003 role: `viewer`
- Click positions (should not produce cursor): 5, 20, 100

**Preconditions:**
- user-003 has view-only permission server-side

---

### T-5.2: Commenter's cursor caret is not rendered in document body
**Maps to:** AC-5  
**Category:** boundary

```gherkin
  Scenario: Comment-only user does not produce a body-text cursor overlay
    Given document "doc-abc-123" has Editor A and Commenter D (user-004, role: commenter) connected
    When Commenter D interacts with the document (e.g., initiates a comment)
    Then Editor A's document body shows no cursor caret overlay for user-004
    And Commenter D's presence list entry remains visible with "Viewing" badge
```

**Test Data:**
- user-004: `{ user_id: "user-004", role: "commenter" }`

**Preconditions:**
- user-004 has commenter-level permission

---

### T-6.1: 50 concurrent editors have distinct cursor colors
**Maps to:** AC-6  
**Category:** edge-case

```gherkin
  Scenario: 50 concurrent editors each receive a unique cursor color
    Given 50 editor sessions are opened on document "doc-abc-123"
      | user_ids | "user-001" through "user-050" |
    When all 50 sessions are established and cursor colors are assigned
    Then each of the 50 users has a distinct assigned color
    And no two users share the same color value
    And the color palette contains at least 50 distinct accessible color values
```

**Test Data:**
- 50 user IDs: `user-001` through `user-050`
- Color palette: must contain ≥ 50 distinct entries; each accessible (WCAG contrast ratio ≥ 3:1 against document background)

**Preconditions:**
- Color assignment function supports ≥ 50 distinct outputs

---

### T-6.2: Name labels for overlapping cursors do not fully obscure each other
**Maps to:** AC-6  
**Category:** edge-case

```gherkin
  Scenario: Multiple cursors at the same document position apply stacking or offset
    Given 3 editors (user-001, user-002, user-003) all have cursors at position 42
    When their cursor overlays are rendered for a fourth client
    Then all three name labels are readable (no label is completely hidden behind another)
    And a stacking or offset strategy is applied so each label is at least partially visible
```

**Test Data:**
- All three cursors at position 42 (same anchor point)

**Preconditions:**
- UI stacking/offset strategy implemented for co-located cursors

---

### T-7.1: Remote cursor disappears when editor leaves within heartbeat window
**Maps to:** AC-7  
**Category:** happy-path

```gherkin
  Scenario: Remote editor's cursor is removed after they close the document
    Given Client A sees cursor overlays for Editor B (user-002) and Editor C (user-003)
    When Editor B closes the document
    And Editor B's WebSocket connection terminates
    Then within 5000 milliseconds, Client A no longer sees any cursor caret or selection highlight for user-002
    And Editor C's cursor overlay remains unaffected
```

**Test Data:**
- Departure method: clean tab close
- Heartbeat timeout: 5000ms

**Preconditions:**
- Editor B and Editor C both active with visible cursors

---

### T-8.1: Local user does not see their own cursor as a remote overlay
**Maps to:** AC-8  
**Category:** boundary

```gherkin
  Scenario: Local user's own cursor is not rendered as a colored remote overlay
    Given user-001 is editing document "doc-abc-123"
    And cursor overlays for remote editors are being rendered
    When user-001 moves their cursor to position 50
    Then user-001's document view does not show a second colored caret at position 50 representing themselves
    And only the native browser cursor/caret is shown for user-001's own position
    And remote users (e.g., user-002) still see user-001's cursor overlay from their perspective
```

**Test Data:**
- user-001 cursor position: 50
- Expected: only one cursor (local) at position 50 in user-001's own view

**Preconditions:**
- Cursor broadcast filtering: server or client must exclude self from overlay rendering

---

### T-9.1: Local typing latency is not degraded by cursor broadcast traffic
**Maps to:** AC-9  
**Category:** performance

```gherkin
  Scenario: Local keystroke-to-render latency is acceptable under 50 concurrent cursor broadcasts
    Given 50 editors are connected to document "doc-abc-123" and all actively broadcasting cursor positions
    When the local user types 20 characters in rapid succession
    Then each character appears in the local editor within the baseline keystroke-to-render threshold
    And no keystroke is visually delayed by more than the acceptable latency delta attributed to cursor broadcast traffic
    And the document frame rate does not drop below 30 fps during the typing sequence
```

**Test Data:**
- 50 concurrent cursor broadcast streams at 10 updates/second each
- Typing sequence: 20 characters at ~120 WPM
- Frame rate threshold: 30 fps

**Preconditions:**
- Performance benchmark baseline established on mid-range laptop hardware
- All 50 cursor streams active before typing begins

---

### T-10.1: Remote cursor overlay tracks correct position after document scroll
**Maps to:** AC-10  
**Category:** edge-case

```gherkin
  Scenario: Remote cursor appears correctly positioned after local user scrolls to that region
    Given document "doc-abc-123" is a 500-line document
    And Editor B's cursor is at position 1200 (in a region not visible on Client A's screen)
    When Client A scrolls down to the region containing position 1200
    Then Editor B's cursor caret appears at the correct visual position in the viewport
    And no layout shift or misalignment occurs
```

**Test Data:**
- Document length: 500 lines (~3000 characters)
- Remote cursor at: character offset 1200 (approx. line 240)
- Scroll target: viewport shows lines 220–260

**Preconditions:**
- Editor B active with cursor at position 1200
- Document is longer than one viewport height

---

### T-10.2: Remote cursor overlay does not appear in incorrect scroll position
**Maps to:** AC-10  
**Category:** edge-case

```gherkin
  Scenario: Remote cursor overlay is hidden when the cursor is in an off-screen region
    Given Client A is viewing the top of document "doc-abc-123" (lines 1–40)
    And Editor B's cursor is at position 1200 (line 240, off-screen)
    When the cursor overlays are rendered for Client A
    Then no cursor overlay for Editor B is visible in Client A's current viewport
    And the overlay is correctly clipped or hidden until Client A scrolls to that region
```

**Preconditions:**
- Editor B cursor is outside current viewport bounds

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated subscription to cursor broadcast returns 401
**Maps to:** AC-AUTH-1  
**Category:** security

```gherkin
  Scenario: Unauthenticated request to subscribe to cursor events is rejected
    Given no valid authentication token is present
    When a request is made to subscribe to cursor broadcast events for document "doc-abc-123"
      | endpoint                                  | method    |
      | /ws/docs/doc-abc-123/cursors              | WebSocket |
    Then the server returns 401 Unauthorized
    And the WebSocket connection is not established
    And no cursor data is transmitted to the requester
```

**Test Data:**
- Auth header: absent
- Endpoint: `/ws/docs/doc-abc-123/cursors`

**Preconditions:**
- Document exists; auth middleware active

---

### T-AUTH-2.1: Authenticated user without document role returns 403
**Maps to:** AC-AUTH-2  
**Category:** security

```gherkin
  Scenario: Authenticated user with no document-level role is denied cursor subscription
    Given user-099 has a valid auth token but no role on document "doc-abc-123"
    When user-099 requests to subscribe to cursor broadcast events for document "doc-abc-123"
    Then the server returns 403 Forbidden
    And user-099 receives no cursor data
    And no cursor overlay is generated for user-099 in other clients' documents
```

**Test Data:**
- user-099: valid auth token, zero permission records for `doc-abc-123`

**Preconditions:**
- user-099 exists in auth system; no ACL entry for the document

---

## Negative Tests

### T-NEG-2.1: Out-of-order cursor position broadcast is resolved by latest-wins
**Maps to:** NFR — Error Handling  
**Category:** error-handling

```gherkin
  Scenario: Out-of-order cursor broadcasts apply the most recently received position
    Given Editor B's cursor is at position 42
    When the client receives two cursor position messages out of order
      | seq | position | received_at |
      | 2   | 50       | t+100ms     |
      | 1   | 45       | t+150ms     |
    Then the displayed cursor position for Editor B is 50 (seq 2, earlier received)
    And the stale position 45 from seq 1 is discarded
```

**Test Data:**
- Message sequence: seq 2 (pos 50) arrives before seq 1 (pos 45)
- Expected final position: 50

---

### T-NEG-2.2: WebSocket drop hides all remote cursors without crashing
**Maps to:** NFR — Error Handling  
**Category:** error-handling

```gherkin
  Scenario: All remote cursor overlays are hidden when WebSocket drops
    Given Client A sees cursors for Editor B, Editor C, and Editor D
    When Client A's WebSocket connection is dropped
    Then all remote cursor overlays (Editor B, C, D) are hidden from Client A's view
    And Client A's local editor remains usable
    And no error is thrown that prevents further editing
```

**Preconditions:**
- All three remote cursors visible before disconnect

---

## Boundary Tests

### T-BOUND-2.1: Color palette recycling when editors exceed palette size
**Maps to:** NFR — Error Handling  
**Category:** boundary

```gherkin
  Scenario: Color palette recycles in round-robin when editors exceed available distinct colors
    Given the color palette contains exactly 48 distinct colors
    And 50 editors are connected to the document
    When cursor colors are assigned to all 50 editors
    Then the first 48 editors each have a unique color
    And editors 49 and 50 share colors with editors 1 and 2 respectively (round-robin)
    And a warning is logged: "Cursor color palette exhausted; colors recycled for 2 users"
```

**Test Data:**
- Palette size: 48 distinct colors
- Total editors: 50
- Expected recycle log message: `"Cursor color palette exhausted; colors recycled for 2 users"`

---

---

# Test Specifications: CONF-01 — Automatic Merge for Non-Overlapping Concurrent Edits

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1 | boundary |
| AC-7 | T-7.1 | performance |
| AC-8 | T-8.1 | happy-path |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Non-overlapping inserts by two editors converge to identical state
**Maps to:** AC-1  
**Category:** happy-path

```gherkin
Feature: Automatic Merge for Non-Overlapping Concurrent Edits

  Scenario: Two editors insert text at disjoint positions and both clients converge
    Given document "doc-abc-123" has initial content "Hello World, this is a test document."
    And Editor A (user-001) has edit permission
    And Editor B (user-002) has edit permission
    And both editors have the document open with active WebSocket sessions
    When Editor A inserts " AAAA" at position 5 (after "Hello")
    And simultaneously Editor B inserts " BBBB" at position 12 (after "World,")
    And both operations are broadcast to the sync endpoint
    Then within 500 milliseconds of the last operation being received, Client A's document reads:
      "Hello AAAA World, BBBB this is a test document."
    And within 500 milliseconds, Client B's document reads the identical string:
      "Hello AAAA World, BBBB this is a test document."
    And no data from either insertion is lost
```

**Test Data:**
- Initial document: `"Hello World, this is a test document."`
- Editor A insert: `{ position: 5, text: " AAAA" }`
- Editor B insert: `{ position: 12, text: " BBBB" }` (positions are disjoint)
- Expected final content: `"Hello AAAA World, BBBB this is a test document."`
- Convergence threshold: 500ms

**Preconditions:**
- Document exists with known initial state
- Both editors have valid auth tokens with editor role
- CRDT library provides strong eventual consistency

---

### T-1.2: Insert in the beginning and end of document converge correctly
**Maps to:** AC-1  
**Category:** happy-path

```gherkin
  Scenario: One editor inserts at the start, another at the end — both inserts preserved
    Given document "doc-abc-123" contains "Middle content here."
    When Editor A inserts "PREFIX " at position 0 (beginning of document)
    And simultaneously Editor B appends " SUFFIX" at position 20 (end of document)
    Then both clients converge to: "PREFIX Middle content here. SUFFIX"
    And convergence occurs within 500 milliseconds
```

**Test Data:**
- Initial content: `"Middle content here."` (length 20)
- Editor A insert: `{ position: 0, text: "PREFIX " }`
- Editor B insert: `{ position: 20, text: " SUFFIX" }`
- Expected: `"PREFIX Middle content here. SUFFIX"`

**Preconditions:**
- Both editors connected with active sessions

---

### T-2.1: Non-overlapping deletes by two editors converge correctly
**Maps to:** AC-2  
**Category:** happy-path

```gherkin
  Scenario: Two editors delete disjoint character ranges and both clients converge
    Given document "doc-abc-123" contains "AAAAABBBBBCCCCC"
    When Editor A deletes positions 0–4 (the "AAAAA" range)
    And simultaneously Editor B deletes positions 10–14 (the "CCCCC" range)
    And both delete operations are broadcast
    Then both clients converge to "BBBBB"
    And convergence occurs within 500 milliseconds
    And no non-deleted content ("BBBBB") is missing from either client
```

**Test Data:**
- Initial content: `"AAAAABBBBBCCCCC"` (length 15)
- Editor A delete: `{ start: 0, end: 4 }` — deletes "AAAAA"
- Editor B delete: `{ start: 10, end: 14 }` — deletes "CCCCC"
- Expected final: `"BBBBB"`

**Preconditions:**
- Both editors active with edit permission

---

### T-3.1: Non-overlapping formatting changes both appear in final document
**Maps to:** AC-3  
**Category:** happy-path

```gherkin
  Scenario: Bold applied to one range and italic applied to a different range — both formatting preserved
    Given document "doc-abc-123" contains "Quick brown fox jumps over the lazy dog."
    When Editor A applies bold formatting to positions 0–4 ("Quick")
    And simultaneously Editor B applies italic formatting to positions 6–10 ("brown")
    And both formatting operations are broadcast
    Then both clients display "Quick" as bold
    And both clients display "brown" as italic
    And no formatting from either editor is lost
    And convergence occurs within 500 milliseconds
```

**Test Data:**
- Initial content: `"Quick brown fox jumps over the lazy dog."`
- Editor A: `{ operation: "format_bold", start: 0, end: 4 }`
- Editor B: `{ operation: "format_italic", start: 6, end: 10 }`

**Preconditions:**
- Document formatting operations are CRDT-compatible

---

### T-4.1: Concurrent insert and delete in disjoint ranges converge to correct state
**Maps to:** AC-4  
**Category:** edge-case

```gherkin
  Scenario: One editor inserts and another deletes in non-overlapping ranges
    Given document "doc-abc-123" contains "Hello World Goodbye"
    When Editor A inserts " Beautiful" at position 5 (after "Hello")
    And simultaneously Editor B deletes positions 12–18 ("Goodbye")
    And both operations are broadcast
    Then both clients converge to "Hello Beautiful World "
    And Editor A's insertion is present
    And Editor B's deletion has removed "Goodbye"
    And character positions are correctly adjusted for both operations
    And convergence occurs within 500 milliseconds
```

**Test Data:**
- Initial content: `"Hello World Goodbye"` (length 19)
- Editor A insert: `{ position: 5, text: " Beautiful" }`
- Editor B delete: `{ start: 12, end: 18 }` — deletes "Goodbye"
- Expected: `"Hello Beautiful World "`

**Preconditions:**
- Both operations submitted concurrently (within same transaction window)

---

### T-5.1: Merge occurs automatically without any user interaction
**Maps to:** AC-5  
**Category:** happy-path

```gherkin
  Scenario: Non-overlapping merge completes without prompting any user
    Given Editor A and Editor B both have document "doc-abc-123" open
    When Editor A inserts "AAA" at position 0
    And Editor B inserts "BBB" at position 20
    And both operations broadcast
    Then neither Editor A nor Editor B is presented with a merge dialog, prompt, or confirmation
    And both edits appear in the document automatically
```

**Preconditions:**
- No manual merge UI is implemented for non-overlapping changes

---

### T-6.1: No merge notification shown after automatic merge completes
**Maps to:** AC-6  
**Category:** boundary

```gherkin
  Scenario: No banner or notification is shown after non-overlapping merge
    Given Editor A inserts at position 0 and Editor B inserts at position 20 concurrently
    When the merge completes and both clients display the merged document
    Then no notification, toast, banner, or visual indicator appears on either client indicating a merge occurred
    And the merged content simply appears in the document without annotation
```

**Preconditions:**
- Merge notification feature is explicitly not implemented for non-overlapping merges

---

### T-7.1: Merge correctness holds for 50 concurrent editors with disjoint edits
**Maps to:** AC-7  
**Category:** performance

```gherkin
  Scenario: 50 editors each insert in distinct document regions and all clients converge
    Given document "doc-abc-123" is divided into 50 distinct non-overlapping regions of 20 characters each
    And 50 editors (user-001 through user-050) each have exclusive edit rights to one region
    When all 50 editors simultaneously insert a 5-character string in their respective region
    And all 50 operations are broadcast
    Then all 50 clients converge to the same document state
    And the converged document contains all 50 insertions
    And convergence occurs within 500 milliseconds of the last operation being received
    And no data from any of the 50 insertions is lost
```

**Test Data:**
- Document divided into 50 regions: positions `[0–19]`, `[20–39]`, ..., `[980–999]`
- Each editor inserts: `"XNNNN"` where N is the user number (e.g., user-001 inserts `"X0001"`)
- Total 50 insertions expected in final state
- Convergence threshold: 500ms

**Preconditions:**
- 50 concurrent WebSocket sessions active
- CRDT library supports 50 concurrent connections
- Performance tested on a system matching the specified P99 design target

---

### T-8.1: Integration test with two simultaneous clients validates merge and passes in CI
**Maps to:** AC-8  
**Category:** happy-path

```gherkin
  Scenario: Automated integration test confirms both clients reach identical state after concurrent edits
    Given an automated integration test opens document "doc-abc-123" with two distinct authenticated editor sessions
      | session  | user_id  | auth_token      |
      | Session1 | user-001 | valid-token-001 |
      | Session2 | user-002 | valid-token-002 |
    And Session1 submits: insert "AAAA" at position 0
    And Session2 submits concurrently: insert "BBBB" at position 50
    When the test waits up to 500 milliseconds for convergence
    Then Session1's document state equals Session2's document state
    And both states contain "AAAA" and "BBBB" at their respective positions
    And the test exits with status code 0 (pass)
    And this test is registered in the CI pipeline configuration
```

**Test Data:**
- Session1 op: `{ type: "insert", position: 0, text: "AAAA" }`
- Session2 op: `{ type: "insert", position: 50, text: "BBBB" }`
- CI pipeline: test registered in `.github/workflows/ci.yml` or equivalent

**Preconditions:**
- Test environment has a running WebSocket server and CRDT backend
- Both users have valid test auth tokens with editor role

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated operation submission returns 401 and is not applied
**Maps to:** AC-AUTH-1  
**Category:** security

```gherkin
  Scenario: Unauthenticated operation is rejected and not broadcast
    Given no valid authentication token is present
    When a POST request is made to /api/docs/doc-abc-123/operations with payload
      | field     | value                            |
      | type      | insert                           |
      | position  | 0                                |
      | text      | "Injected text"                  |
    Then the server responds with 401 Unauthorized
    And the operation is not applied to the document
    And the operation is not broadcast to any connected clients
    And the document content is unchanged
```

**Test Data:**
- Endpoint: `POST /api/docs/doc-abc-123/operations`
- Payload: `{ type: "insert", position: 0, text: "Injected text" }`
- Auth header: absent

**Preconditions:**
- Document exists; auth middleware active on the operations endpoint

---

### T-AUTH-2.1: Editor without document edit permission returns 403
**Maps to:** AC-AUTH-2  
**Category:** security

```gherkin
  Scenario: Authenticated viewer attempts to submit an operation and is rejected with 403
    Given user-005 has a valid auth token but only "viewer" permission on document "doc-abc-123"
    When user-005 submits a POST to /api/docs/doc-abc-123/operations with payload
      | field    | value           |
      | type     | insert          |
      | position | 0               |
      | text     | "Viewer insert" |
    Then the server responds with 403 Forbidden
    And the operation is not applied
    And the operation is not broadcast
    And the document content is unchanged
```

**Test Data:**
- user-005: valid auth token, `viewer` role on `doc-abc-123`
- Operation: `{ type: "insert", position: 0, text: "Viewer insert" }`

**Preconditions:**
- user-005's ACL record is `viewer` for this document

---

## Negative Tests

### T-NEG-1.1: Network failure during broadcast triggers retry with exponential backoff
**Maps to:** NFR — Error Handling  
**Category:** error-handling

```gherkin
  Scenario: Operation retry on broadcast failure with exponential backoff
    Given Editor A submits an insert operation
    And the WebSocket broadcast fails on first attempt
    When the client retry logic activates
    Then the client retries the operation up to 3 times
    And retry delays follow exponential backoff (e.g., 100ms, 200ms, 400ms)
    And after the third retry fails, a user-facing error is surfaced
    And the error message does not disclose internal system details
```

**Test Data:**
- Retry count: 3
- Backoff delays: `[100ms, 200ms, 400ms]`

**Preconditions:**
- Broadcast endpoint returns 503 on first 3 attempts

---

### T-NEG-1.2: Duplicate operation from retry is idempotent — not applied twice
**Maps to:** NFR — Error Handling  
**Category:** error-handling

```gherkin
  Scenario: Server receives a duplicate operation due to client retry and discards it
    Given Editor A submitted operation ID "op-uuid-001" (insert at position 0)
    And the operation was applied successfully
    When the client retries and sends operation "op-uuid-001" again
    Then the server recognizes the duplicate by operation ID
    And the duplicate is discarded
    And the document content is not corrupted by double-application
    And the server responds with a success acknowledgment (idempotent)
```

**Test Data:**
- Operation ID: `"op-uuid-001"` (UUID, unique per operation)
- Duplicate detection: server checks operation ID in applied-operations log

**Preconditions:**
- Server maintains an idempotency log keyed by operation ID

---

## Boundary Tests

### T-BOUND-1.1: Operations on adjacent (touching) ranges do not corrupt each other
**Maps to:** AC-1  
**Category:** boundary

```gherkin
  Scenario: Editor A inserts at position 5 and Editor B inserts at position 6 (adjacent)
    Given document "doc-abc-123" contains "Hello World"
    When Editor A inserts "AAA" at position 5
    And Editor B inserts "BBB" at position 6
    And both operations are broadcast
    Then both clients converge to a consistent state containing both "AAA" and "BBB"
    And no characters from either insertion are lost or overwritten
    And the relative ordering of the insertions is deterministic and consistent across clients
```

**Test Data:**
- Adjacent positions: Editor A at 5, Editor B at 6
- Expected: CRDT tie-breaking produces a stable ordering

---

---

# Test Specifications: CONF-02 — Last-Writer-Wins Resolution for Same-Range Concurrent Edits

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1 | boundary |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1, T-5.2 | edge-case |
| AC-6 | T-6.1 | happy-path |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Later-received write wins at character level in a two-editor conflict
**Maps to:** AC-1  
**Category:** happy-path

```gherkin
Feature: Last-Writer-Wins Resolution for Same-Range Concurrent Edits

  Scenario: Two editors write to the same character range; later server timestamp wins
    Given document "doc-abc-123" contains "Hello World"
    And Editor A (user-001) and Editor B (user-002) both have edit permission
    And both clients have the document open
    When Editor A sends operation to replace characters 6–10 ("World") with "Earth"
      at server-received timestamp T+100ms
    And Editor B sends operation to replace characters 6–10 ("World") with "Globe"
      at server-received timestamp T+200ms
    Then the server applies Editor B's operation (T+200ms) as the winner
    And both clients converge to "Hello Globe"
    And "Earth" (Editor A's write) is dropped from the contested range 6–10
    And convergence occurs within 500 milliseconds of the last operation received
```

**Test Data:**
- Initial content: `"Hello World"` (length 11)
- Editor A op: `{ range: [6, 10], replacement: "Earth", server_ts: T+100 }`
- Editor B op: `{ range: [6, 10], replacement: "Globe", server_ts: T+200 }`
- Expected winning text: `"Globe"` (later timestamp)
- Expected final content: `"Hello Globe"`

**Preconditions:**
- Server clock synchronized; timestamps meaningful for ordering
- Both editors have valid auth tokens with edit role
- CRDT framework supports per-character timestamp assignment (SPIKE-01)

---

### T-1.2: Character-level LWW applies independently within the contested range
**Maps to:** AC-1  
**Category:** happy-path

```gherkin
  Scenario: LWW applies at the character level within a contested multi-character range
    Given document "doc-abc-123" contains "ABCDE"
    When Editor A replaces positions 0–4 ("ABCDE") with "VVVVV" at server_ts T+100
    And Editor B replaces positions 0–4 ("ABCDE") with "ZZZZZ" at server_ts T+200
    Then for every character position 0–4, Editor B's character ("Z") wins
    And both clients converge to "ZZZZZ"
    And no character from "VVVVV" survives in positions 0–4
```

**Test Data:**
- Initial: `"ABCDE"`
- Editor A: `{ range: [0, 4], text: "VVVVV", server_ts: T+100 }`
- Editor B: `{ range: [0, 4], text: "ZZZZZ", server_ts: T+200 }`
- Expected: `"ZZZZZ"`

**Preconditions:**
- LWW applies per-character, not per-operation block

---

### T-2.1: All clients converge to the winning state within 500ms
**Maps to:** AC-2  
**Category:** happy-path

```gherkin
  Scenario: Three clients all converge to the LWW winner state
    Given document "doc-abc-123" is open with 3 clients (user-001, user-002, user-003)
    And user-001 and user-002 submit conflicting writes to the same range
    And user-003 is a read-only observer
    When the server resolves the conflict via LWW (user-002's write wins)
    And the resolution is broadcast to all clients
    Then within 500 milliseconds:
      - Client user-001 displays the winning content (user-002's text)
      - Client user-002 displays the winning content
      - Client user-003 displays the winning content
    And no client retains the losing content from user-001
```

**Test Data:**
- user-001 write: `"Earth"` at range [6, 10], ts T+100
- user-002 write: `"Globe"` at range [6, 10], ts T+200
- user-003: viewer

**Preconditions:**
- All 3 clients connected; broadcast channel active

---

### T-3.1: Losing user sees their text update to the winner's content without notification
**Maps to:** AC-3  
**Category:** boundary

```gherkin
  Scenario: The user whose write lost sees text change to winning content silently
    Given Editor A typed "Earth" at range [6, 10] and saw it appear locally
    And Editor B's write "Globe" at the same range arrived later (T+200ms)
    And Editor B wins the LWW resolution
    When the winning write is broadcast to Editor A
    Then Editor A's document updates to show "Globe" at positions 6–10
    And no error message is displayed to Editor A
    And no notification, dialog, or banner is shown to Editor A
    And Editor A's editor remains functional (not in error state)
```

**Test Data:**
- Editor A initially sees: `"Hello Earth"` (their own write)
- After LWW resolution: `"Hello Globe"` (Editor B's winning write)

**Preconditions:**
- Editor A's local state was optimistically applied before resolution

---

### T-4.1: LWW resolves correctly when 10 editors edit the same range simultaneously
**Maps to:** AC-4  
**Category:** edge-case

```gherkin
  Scenario: 10 editors submit writes to the same character range; only the latest-timestamp write survives
    Given document "doc-abc-123" contains "TARGET"
    And 10 editors (user-001 through user-010) each submit a replacement for positions 0–5
      | user    | replacement | server_ts |
      | user-001 | "WRITE1"   | T+10      |
      | user-002 | "WRITE2"   | T+20      |
      | user-003 | "WRITE3"   | T+30      |
      | user-004 | "WRITE4"   | T+40      |
      | user-005 | "WRITE5"   | T+50      |
      | user-006 | "WRITE6"   | T+60      |
      | user-007 | "WRITE7"   | T+70      |
      | user-008 | "WRITE8"   | T+80      |
      | user-009 | "WRITE9"   | T+90      |
      | user-010 | "WRITE10"  | T+100     |
    When the server receives and resolves all 10 operations
    Then the document converges to "WRITE10" (user-010's write, latest timestamp)
    And all 10 clients display "WRITE10"
    And no other write (WRITE1 through WRITE9) appears in the contested range
```

**Test Data:**
- 10 concurrent operations with escalating timestamps
- Winning op: user-010, `server_ts: T+100`, text: `"WRITE10"`
- Expected final: `"WRITE10"`

**Preconditions:**
- 10 concurrent authenticated editor sessions active
- Server can process and order 10 concurrent operations

---

### T-5.1: Non-contested characters adjacent to conflict range are preserved
**Maps to:** AC-5  
**Category:** edge-case

```gherkin
  Scenario: Only the overlapping sub-range is subject to LWW; non-overlapping portions are preserved
    Given document "doc-abc-123" contains "123456789"
    When Editor A replaces characters C1–C5 (positions 0–4, "12345") with "AAAAA" at server_ts T+100
    And Editor B replaces characters C3–C8 (positions 2–7, "345678") with "BBBBBB" at server_ts T+200
    Then the overlapping range C3–C5 (positions 2–4) is resolved by LWW in favor of Editor B (T+200)
    And Editor A's non-contested characters C1–C2 (positions 0–1, "AA" from "AAAAA") are preserved
    And Editor B's non-contested characters C6–C8 (positions 5–7, "BBB" from "BBBBBB") are preserved
    And both clients converge to the same consistent document state
```

**Test Data:**
- Initial: `"123456789"` (positions 0–8)
- Editor A: `{ range: [0, 4], text: "AAAAA", ts: T+100 }`
- Editor B: `{ range: [2, 7], text: "BBBBBB", ts: T+200 }`
- Overlap: positions 2–4
- Non-contested from A: positions 0–1 (`"AA"`)
- Non-contested from B: positions 5–7 (`"BBB"`)

**Preconditions:**
- CRDT framework supports per-character LWW resolution within a range

---

### T-5.2: Partial overlap preserves characters outside the conflict range
**Maps to:** AC-5  
**Category:** edge-case

```gherkin
  Scenario: Verify document contains all non-overlapping characters after partial-overlap LWW
    Given the scenario from T-5.1 is applied
    When both clients have converged
    Then the final document contains Editor A's characters at positions 0–1
    And the final document contains Editor B's resolution at positions 2–4
    And the final document contains Editor B's characters at positions 5–7
    And position 8 ("9") from the original document is unchanged
```

**Preconditions:**
- T-5.1 scenario applied; documents converged

---

### T-6.1: Automated integration test validates LWW and passes CI
**Maps to:** AC-6  
**Category:** happy-path

```gherkin
  Scenario: CI integration test with controlled timestamps confirms LWW selects the correct winner
    Given an automated integration test opens document "doc-abc-123" with two authenticated sessions
      | session  | user_id  | auth_token      |
      | Session1 | user-001 | valid-token-001 |
      | Session2 | user-002 | valid-token-002 |
    And the test controls server-side timestamp injection
    When Session1 submits: replace [6, 10] with "LOSER" at injected server_ts T+100
    And Session2 submits: replace [6, 10] with "WINNER" at injected server_ts T+200
    Then the test confirms both clients display "WINNER" in range [6, 10]
    And neither client displays "LOSER" in range [6, 10]
    And both client document states are identical
    And the test exits with status code 0
    And this test is registered in the CI pipeline configuration file
```

**Test Data:**
- Session1: `{ op: { range: [6, 10], text: "LOSER" }, server_ts: T+100 }`
- Session2: `{ op: { range: [6, 10], text: "WINNER" }, server_ts: T+200 }`
- Expected: `"WINNER"` in both clients

**Preconditions:**
- Test environment supports timestamp injection for controlled ordering
- CI pipeline configuration file exists (e.g., `.github/workflows/ci.yml`)

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated write to conflict resolution endpoint returns 401
**Maps to:** AC-AUTH-1  
**Category:** security

```gherkin
  Scenario: Unauthenticated operation is rejected before timestamp assignment
    Given no valid authentication token is present
    When a POST request is made to /api/docs/doc-abc-123/operations with payload
      | field       | value          |
      | type        | replace        |
      | range_start | 6              |
      | range_end   | 10             |
      | text        | "Injected"     |
    Then the server responds with 401 Unauthorized
    And no server-side timestamp is assigned to the operation
    And the operation is not stored or broadcast
    And the document state is unchanged
```

**Test Data:**
- Endpoint: `POST /api/docs/doc-abc-123/operations`
- Payload: `{ type: "replace", range_start: 6, range_end: 10, text: "Injected" }`
- Auth header: absent

**Preconditions:**
- Auth middleware active; document exists

---

### T-AUTH-2.1: Authenticated viewer attempting a write returns 403
**Maps to:** AC-AUTH-2  
**Category:** security

```gherkin
  Scenario: Viewer submits a write operation and is rejected with 403
    Given user-005 has role "viewer" on document "doc-abc-123" and holds a valid auth token
    When user-005 submits POST /api/docs/doc-abc-123/operations with payload
      | field       | value            |
      | type        | replace          |
      | range_start | 6                |
      | range_end   | 10               |
      | text        | "ViewerOverride" |
    Then the server responds with 403 Forbidden
    And the operation is discarded without timestamp assignment
    And the document state is unchanged
    And no broadcast is sent to connected clients
```

**Test Data:**
- user-005: `{ user_id: "user-005", role: "viewer" }` — valid auth token, no edit permission

**Preconditions:**
- user-005 ACL record: `viewer` for `doc-abc-123`

---

## Negative Tests

### T-NEG-2.1: Identical server timestamps resolved by deterministic tie-breaking rule
**Maps to:** NFR — Error Handling  
**Category:** error-handling

```gherkin
  Scenario: Two operations arrive with identical timestamps; tie-breaking is deterministic
    Given Editor A (user-001) and Editor B (user-002) submit conflicting writes to range [6, 10]
    And both operations are assigned the exact same server timestamp T+100
    When the server applies its tie-breaking rule (e.g., lexicographic comparison of user IDs)
    Then "user-002" > "user-001" lexicographically, so Editor B's write wins
    And both clients converge to Editor B's text
    And the tie-breaking rule is documented and reproducible
    And neither operation is silently dropped without being applied — one deterministic winner is always chosen
```

**Test Data:**
- Editor A: `{ user_id: "user-001", text: "FIRST", server_ts: T+100 }`
- Editor B: `{ user_id: "user-002", text: "SECOND", server_ts: T+100 }`
- Tie-breaker: lexicographic `user_id` comparison → `"user-002"` wins
- Expected: `"SECOND"`

**Preconditions:**
- Timestamp collision scenario reproducible in test environment (timestamp injection)

---

### T-NEG-2.2: Server clock skew falls back to logical clock ordering
**Maps to:** NFR — Error Handling  
**Category:** error-handling

```gherkin
  Scenario: Physical timestamp inversion is corrected by server-side logical clock
    Given the server experiences clock skew causing a later-sent operation to have an earlier physical timestamp
    When Editor A submits at logical sequence 1 (physical ts T+200, skewed backward)
    And Editor B submits at logical sequence 2 (physical ts T+100, correct)
    And the server uses a logical/hybrid clock to order operations
    Then the server orders Editor B's operation after Editor A's (logical seq 2 > seq 1)
    And the LWW winner is Editor B (higher logical sequence)
    And the physical timestamp inversion does not cause the wrong operation to win
```

**Test Data:**
- Editor A: `{ logical_seq: 1, physical_ts: T+200 }` (skewed backward)
- Editor B: `{ logical_seq: 2, physical_ts: T+100 }` (correct clock, lower physical value)
- Expected winner: Editor B (logical seq 2)

**Preconditions:**
- Server implements a hybrid logical clock (HLC) or vector clock as fallback
- Test environment can simulate clock skew

---

## Boundary Tests

### T-BOUND-2.1: Single character range conflict resolves to the later write
**Maps to:** AC-1  
**Category:** boundary

```gherkin
  Scenario: LWW resolves a conflict on a single character position
    Given document "doc-abc-123" contains "Hello"
    When Editor A replaces position 4 (character "o") with "A" at server_ts T+100
    And Editor B replaces position 4 (character "o") with "Z" at server_ts T+200
    Then both clients converge to "HellZ"
    And "HellA" (Editor A's losing write) does not appear on any client
```

**Test Data:**
- Single character conflict at position 4
- Editor A: `"A"`, ts T+100
- Editor B: `"Z"`, ts T+200
- Expected: `"HellZ"`

---

### T-BOUND-2.2: Conflict resolved with zero non-contested characters
**Maps to:** AC-5  
**Category:** boundary

```gherkin
  Scenario: Both editors write to the exact same range with no characters outside conflict
    Given document "doc-abc-123" contains "XXXXX"
    When Editor A replaces all positions 0–4 with "AAAAA" at server_ts T+100
    And Editor B replaces all positions 0–4 with "BBBBB" at server_ts T+200
    Then the entire document converges to "BBBBB"
    And no non-contested characters exist — the full document is the conflict range
    And both clients display identical content "BBBBB"
```

**Test Data:**
- Full document overlap: both editors replace the entire content
- Expected winner: `"BBBBB"` (Editor B, later timestamp)

---


# Test Specifications: CONF-03 — Local-Only Undo Stack

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | boundary |
| AC-4 | T-4.1, T-4.2 | edge-case |
| AC-5 | T-5.1, T-5.2 | edge-case |
| AC-6 | T-6.1 | boundary |
| AC-7 | T-7.1 | boundary |
| AC-8 | T-8.1, T-8.2 | happy-path |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Ctrl+Z undoes the most recent local text insertion (Windows/Linux)
**Maps to:** AC-1  
**Category:** happy-path

```gherkin
Feature: Local-only undo stack

  Scenario: Ctrl+Z reverses the most recent local text insertion on Windows/Linux
    Given an authenticated editor with user_id "editor-a" and role "editor"
    And the document "doc-abc123" contains the text "Hello world"
    And editor-a has placed the cursor after "Hello "
    And editor-a has typed "beautiful " making the document read "Hello beautiful world"
    When editor-a presses Ctrl+Z
    Then the document text is "Hello world"
    And the CRDT inverse operation for the "beautiful " insertion is broadcast to connected clients
    And the undo manager stack depth for editor-a decreases by 1
```

**Test Data:**
- `user_id: "editor-a"`, `role: "editor"`, `status: "active"`
- `document_id: "doc-abc123"`
- Initial document text: `"Hello world"`
- Edit applied: insert `"beautiful "` at index 6
- Expected post-undo text: `"Hello world"`

**Preconditions:**
- Editor is authenticated with a valid session token
- Document is open and WebSocket connection is active
- Undo stack for editor-a contains exactly one operation

---

### T-1.2: Cmd+Z undoes the most recent local text insertion (macOS)
**Maps to:** AC-1  
**Category:** happy-path

```gherkin
  Scenario: Cmd+Z reverses the most recent local text insertion on macOS
    Given an authenticated editor with user_id "editor-a" and role "editor" on macOS
    And the document "doc-abc123" contains the text "Draft content"
    And editor-a has appended " — revised" making the document read "Draft content — revised"
    When editor-a presses Cmd+Z
    Then the document text is "Draft content"
    And the CRDT inverse delete operation is broadcast to all connected clients
```

**Test Data:**
- `user_id: "editor-a"`, platform: `"macOS"`
- `document_id: "doc-abc123"`
- Insert: append `" — revised"` at end of document
- Expected post-undo text: `"Draft content"`

**Preconditions:**
- Editor is authenticated on macOS
- Document open, WebSocket active
- Undo stack contains the one insertion operation

---

### T-2.1: Ctrl+Y restores an undone edit (Windows/Linux)
**Maps to:** AC-2  
**Category:** happy-path

```gherkin
  Scenario: Ctrl+Y re-applies the most recently undone edit on Windows/Linux
    Given an authenticated editor with user_id "editor-a" and role "editor"
    And the document "doc-abc123" contains the text "Hello world"
    And editor-a previously typed "beautiful " making the document "Hello beautiful world"
    And editor-a has pressed Ctrl+Z so the document now reads "Hello world"
    When editor-a presses Ctrl+Y
    Then the document text is "Hello beautiful world"
    And the redo stack depth for editor-a decreases by 1
    And the undo stack depth for editor-a increases by 1
```

**Test Data:**
- `user_id: "editor-a"`, platform: `"Windows"`
- Redo stack: contains 1 operation (the undone insertion of `"beautiful "`)

**Preconditions:**
- Editor-a has at least one item in the redo stack
- Document is open with active WebSocket

---

### T-2.2: Cmd+Shift+Z restores an undone edit (macOS)
**Maps to:** AC-2  
**Category:** happy-path

```gherkin
  Scenario: Cmd+Shift+Z re-applies the most recently undone edit on macOS
    Given an authenticated editor with user_id "editor-a" and role "editor" on macOS
    And editor-a has undone a deletion of the word "important"
    And the document currently reads "A document"
    When editor-a presses Cmd+Shift+Z
    Then the word "important" is deleted again and the document returns to its post-deletion state
    And a CRDT delete operation is broadcast to connected clients
```

**Test Data:**
- `user_id: "editor-a"`, platform: `"macOS"`
- Redo stack: contains 1 delete operation for `"important "`

**Preconditions:**
- Editor-a is authenticated on macOS
- Redo stack is non-empty

---

### T-3.1: Ctrl+Z does not revert a remote editor's changes
**Maps to:** AC-3  
**Category:** boundary

```gherkin
  Scenario: Undo only affects local operations, not remote editor operations
    Given an authenticated editor with user_id "editor-a" and role "editor"
    And editor with user_id "editor-b" has inserted " [DRAFT]" at the end of the document
    And that remote change has been applied to editor-a's local view
    And editor-a has then typed "Introduction: " at position 0
    When editor-a presses Ctrl+Z
    Then the text "Introduction: " is removed from the document
    And the text " [DRAFT]" inserted by editor-b remains present in the document
    And no CRDT inverse operation targeting editor-b's insertion is broadcast
```

**Test Data:**
- `user_id: "editor-a"`, `user_id: "editor-b"`, both `role: "editor"`
- Editor-b remote insert: `" [DRAFT]"` at end
- Editor-a local insert: `"Introduction: "` at position 0
- After undo: document starts without `"Introduction: "` but retains `" [DRAFT]"`

**Preconditions:**
- Both editors connected to document "doc-abc123"
- Editor-b's change has been received and applied on editor-a's client
- Editor-a's undo stack contains only editor-a's operations

---

### T-3.2: Undo stack never contains remote operations
**Maps to:** AC-3  
**Category:** boundary

```gherkin
  Scenario: Remote operations do not appear in the local undo stack
    Given an authenticated editor with user_id "editor-a" and role "editor"
    And no local edits have been made by editor-a
    And editor-b has made 5 edits to the document that are reflected in editor-a's view
    When editor-a presses Ctrl+Z
    Then no change is applied to the document
    And no error is shown
    And the undo action is silently ignored
```

**Test Data:**
- `user_id: "editor-a"`: 0 local edits
- `user_id: "editor-b"`: 5 remote edits applied to local view
- Expected undo stack size for editor-a: 0

**Preconditions:**
- Editor-a's undo stack is empty
- Remote operations from editor-b are applied to editor-a's view

---

### T-4.1: Undo of a merged operation is broadcast as a new inverse CRDT operation
**Maps to:** AC-4  
**Category:** edge-case

```gherkin
  Scenario: Undo after merge is applied as a new inverse operation, not a rollback
    Given an authenticated editor with user_id "editor-a" and role "editor"
    And editor-a inserted "Chapter 1: " at position 0 in document "doc-abc123"
    And that operation has been broadcast to and acknowledged by the server
    And editor-b subsequently added " (WIP)" at the end of the same document
    When editor-a presses Ctrl+Z to undo the insertion of "Chapter 1: "
    Then a new CRDT delete operation targeting editor-a's original insertion is generated
    And the new delete operation is broadcast to all connected clients
    And editor-b's client applies the delete operation and sees the document without "Chapter 1: "
    And editor-b's " (WIP)" addition remains intact on both clients
    And the server document state does not revert to any prior snapshot
```

**Test Data:**
- `user_id: "editor-a"`, insert `"Chapter 1: "` at position 0, `operation_id: "op-ea-001"`
- `user_id: "editor-b"`, insert `" (WIP)"` at end, `operation_id: "op-eb-001"`
- Both operations acknowledged by server before undo
- Expected: new inverse operation `op-ea-001-inv` broadcast; editor-b receives it

**Preconditions:**
- Both operations are committed to server state
- Editor-b is connected and has both operations applied
- Undo manager for editor-a has `op-ea-001` tracked

---

### T-4.2: Other clients converge to correct state after receiving inverse operation
**Maps to:** AC-4  
**Category:** edge-case

```gherkin
  Scenario: A third client connected after the original edit converges correctly after receiving the undo inverse operation
    Given document "doc-abc123" has text "Chapter 1: Hello"
    And editor-a originally inserted "Chapter 1: " (now merged)
    And editor-c joins the document after the original insert was applied
    When editor-a presses Ctrl+Z
    Then editor-c receives the inverse delete operation
    And editor-c's view updates to show "Hello" without "Chapter 1: "
    And the document state is consistent across all connected clients
```

**Test Data:**
- `user_id: "editor-c"` joins after initial state
- Initial state seen by editor-c: `"Chapter 1: Hello"`
- State after undo received by editor-c: `"Hello"`

**Preconditions:**
- Editor-c is connected when the undo is performed
- Server has both the original insert and the incoming inverse operation

---

### T-5.1: Undo of an LWW-lost write is silently skipped
**Maps to:** AC-5  
**Category:** edge-case

```gherkin
  Scenario: Undo targeting an LWW-lost write produces no document change
    Given an authenticated editor with user_id "editor-a" and role "editor"
    And editor-a inserted "foo" at position 10 in document "doc-abc123" with timestamp T1
    And editor-b inserted "bar" at the same position 10 with a later timestamp T2 > T1
    And LWW resolution discarded editor-a's "foo" in favor of editor-b's "bar"
    When editor-a presses Ctrl+Z targeting the "foo" insertion
    Then no text is removed from the document
    And "bar" from editor-b remains at position 10
    And no inverse CRDT operation is broadcast (or a no-op is broadcast)
    And the document does not display "foo"
```

**Test Data:**
- Editor-a: insert `"foo"` at position 10, `timestamp: T1`
- Editor-b: insert `"bar"` at position 10, `timestamp: T2` where `T2 > T1`
- LWW result: `"bar"` wins
- Expected undo result: document unchanged, `"bar"` at position 10

**Preconditions:**
- LWW conflict has been resolved by CONF-02 in favor of editor-b
- Editor-a's undo stack still contains the lost operation entry

---

### T-5.2: Undo stack advances past the LWW-lost write to the previous valid operation
**Maps to:** AC-5  
**Category:** edge-case

```gherkin
  Scenario: After silently skipping the LWW-lost write, a second Ctrl+Z undoes the next valid operation
    Given editor-a made two edits: E1 = insert "Hello " at position 0, E2 = insert "foo" at position 10 (LWW-lost)
    And E2 was overwritten by LWW
    When editor-a presses Ctrl+Z twice
    Then the first Ctrl+Z is a no-op (E2 is skipped)
    And the second Ctrl+Z undoes E1, removing "Hello " from position 0
    And the document no longer contains "Hello "
```

**Test Data:**
- E1: `op_id: "op-ea-001"`, insert `"Hello "` at 0, not LWW-lost
- E2: `op_id: "op-ea-002"`, insert `"foo"` at 10, LWW-lost
- After 2× Ctrl+Z: document has neither `"Hello "` at 0 nor `"foo"` at 10

**Preconditions:**
- Undo stack for editor-a: `[op-ea-001, op-ea-002]`
- E2 is marked as LWW-discarded

---

### T-6.1: Undo stack is cleared and non-functional after page reload
**Maps to:** AC-6  
**Category:** boundary

```gherkin
  Scenario: Ctrl+Z has no effect after page reload
    Given an authenticated editor with user_id "editor-a" and role "editor"
    And editor-a has made 5 edits to document "doc-abc123" in the current session
    And editor-a's undo stack contains 5 operations
    When the user reloads the browser page
    Then the page re-renders the document with the current server state
    And the undo stack for editor-a is empty
    When editor-a presses Ctrl+Z
    Then no change is applied to the document
    And no error is shown
    And no network request is made to replay any prior operation
```

**Test Data:**
- `user_id: "editor-a"`, session undo stack depth before reload: 5
- Expected undo stack depth after reload: 0

**Preconditions:**
- Editor-a has made edits and built an undo history
- Page reload triggers full application re-initialization

---

### T-7.1: Each editor has an independent undo stack
**Maps to:** AC-7  
**Category:** boundary

```gherkin
  Scenario: Editor A's Ctrl+Z does not affect Editor B's undo stack
    Given editor-a and editor-b are both authenticated and have the same document open
    And editor-a has made 3 edits (undo stack depth 3)
    And editor-b has made 2 edits (undo stack depth 2)
    When editor-a presses Ctrl+Z
    Then editor-a's undo stack depth decreases to 2
    And editor-b's undo stack depth remains 2
    And editor-b's view does not reflect editor-a's undo action (editor-b sees the inverse operation as a remote change, not an undo of their own work)
    And editor-b's Ctrl+Z still targets editor-b's own most recent edit
```

**Test Data:**
- `user_id: "editor-a"`: undo stack `["ea-op3", "ea-op2", "ea-op1"]`
- `user_id: "editor-b"`: undo stack `["eb-op2", "eb-op1"]`
- After editor-a Ctrl+Z: editor-a stack `["ea-op2", "ea-op1"]`, editor-b stack unchanged

**Preconditions:**
- Both editors connected to the same document
- Undo stacks are maintained client-side per user session

---

### T-8.1: Three consecutive Ctrl+Z presses traverse history in LIFO order
**Maps to:** AC-8  
**Category:** happy-path

```gherkin
  Scenario: Consecutive undo presses reverse edits in last-in-first-out order
    Given an authenticated editor with user_id "editor-a" and role "editor"
    And editor-a has made three edits to document "doc-abc123" in order:
      | Edit | Content Inserted | Position |
      | E1   | "Hello "         | 0        |
      | E2   | "world"          | 6        |
      | E3   | "!"              | 11       |
    And the current document reads "Hello world!"
    When editor-a presses Ctrl+Z the first time
    Then E3 ("!") is undone; document reads "Hello world"
    And inverse operation for E3 is broadcast
    When editor-a presses Ctrl+Z the second time
    Then E2 ("world") is undone; document reads "Hello "
    And inverse operation for E2 is broadcast
    When editor-a presses Ctrl+Z the third time
    Then E1 ("Hello ") is undone; document is empty ""
    And inverse operation for E1 is broadcast
```

**Test Data:**
- E1: `op_id: "ea-op1"`, insert `"Hello "` at position 0
- E2: `op_id: "ea-op2"`, insert `"world"` at position 6
- E3: `op_id: "ea-op3"`, insert `"!"` at position 11
- After 3× Ctrl+Z: document is `""`

**Preconditions:**
- Editor-a's undo stack: `["ea-op3", "ea-op2", "ea-op1"]` (LIFO)
- Document initially empty before E1

---

### T-8.2: Undo stack is empty after all operations are undone; further Ctrl+Z is no-op
**Maps to:** AC-8  
**Category:** boundary

```gherkin
  Scenario: Pressing Ctrl+Z when undo stack is exhausted produces no effect
    Given editor-a has undone all 3 of their edits (undo stack is empty)
    And the document is in its pre-edit state ""
    When editor-a presses Ctrl+Z again
    Then no change is applied to the document
    And no network request is sent
    And no error message is displayed
```

**Test Data:**
- Undo stack depth: 0
- Document state: `""`

**Preconditions:**
- All editor-a operations have been undone

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated undo operation is rejected with 401
**Maps to:** AC-AUTH-1  
**Category:** security

```gherkin
  Scenario: Server rejects an undo sync request with no authentication token
    Given no valid authentication token or session cookie is present in the request
    When a client sends a POST request to "/api/documents/doc-abc123/operations" with an inverse CRDT operation payload
    Then the server returns HTTP 401 Unauthorized
    And the response body contains { "error": "Authentication required" }
    And no operation is applied to the document state
    And no operation is broadcast to connected clients
```

**Test Data:**
- `Authorization` header: absent
- `Cookie` session: absent
- Request body: `{ "type": "inverse-insert", "op_id": "op-ea-001-inv", "document_id": "doc-abc123" }`
- Expected response: `HTTP 401`, `{ "error": "Authentication required" }`

**Preconditions:**
- Document "doc-abc123" exists on the server
- No valid session is established

---

### T-AUTH-2.1: Authenticated viewer's undo sync request is rejected with 403
**Maps to:** AC-AUTH-2  
**Category:** security

```gherkin
  Scenario: A viewer-role user's undo operation is rejected by the server
    Given an authenticated user with user_id "viewer-01" and role "viewer" (read-only)
    And a valid session token is present for "viewer-01"
    When the client sends a POST request to "/api/documents/doc-abc123/operations" with an inverse CRDT operation
    Then the server returns HTTP 403 Forbidden
    And the response body contains { "error": "Insufficient permissions — edit access required" }
    And no operation is applied to the server document state
    And no operation is broadcast to connected clients
    And the local client UI may visually show the undo (client-side state), but the server state is unchanged
```

**Test Data:**
- `user_id: "viewer-01"`, `role: "viewer"`, valid `session_token: "sess-viewer-01"`
- Request body: `{ "type": "inverse-insert", "op_id": "op-v01-inv", "document_id": "doc-abc123" }`
- Expected response: `HTTP 403`, `{ "error": "Insufficient permissions — edit access required" }`

**Preconditions:**
- Viewer-01 is authenticated but has read-only role on document "doc-abc123"
- Document "doc-abc123" exists

---

---

# Test Specifications: OFFL-01 — Local Edit Queue While Disconnected

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1, T-5.2 | boundary |
| AC-6 | T-6.1 | boundary |
| AC-7 | T-7.1 | happy-path |
| AC-8 | T-8.1 | error-handling |
| AC-9 | T-9.1, T-9.2 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: WebSocket close event triggers offline mode and shows banner
**Maps to:** AC-1  
**Category:** happy-path

```gherkin
Feature: Local edit queue while disconnected

  Scenario: Client enters offline mode when WebSocket closes
    Given an authenticated editor with user_id "editor-a" and role "editor"
    And the document "doc-abc123" is open with an active WebSocket connection to "wss://collab.example.com/doc-abc123"
    When the WebSocket connection emits a "close" event with code 1006 (abnormal closure)
    Then the client transitions to offline mode within 500ms
    And the banner "You're offline — changes will sync when reconnected" is displayed
    And the banner is visible at the top of the editor
    And the banner has role="alert" and aria-live="assertive"
    And the editing interface remains fully interactive
```

**Test Data:**
- `user_id: "editor-a"`, `role: "editor"`, `session_token: "sess-ea-001"`
- `document_id: "doc-abc123"`
- WebSocket close code: `1006` (abnormal)
- Banner text: `"You're offline — changes will sync when reconnected"`

**Preconditions:**
- Editor is authenticated with an active session
- Document is open with a live WebSocket connection
- WebSocket close event is simulated

---

### T-1.2: WebSocket error event also triggers offline mode
**Maps to:** AC-1  
**Category:** happy-path

```gherkin
  Scenario: Client enters offline mode when WebSocket emits an error event
    Given an authenticated editor with user_id "editor-a" and role "editor"
    And the document "doc-abc123" is open with an active WebSocket connection
    When the WebSocket connection emits an "error" event
    Then the client transitions to offline mode within 500ms
    And the offline banner is displayed
    And the editing interface remains fully interactive
```

**Test Data:**
- WebSocket error type: `Event { type: "error" }`

**Preconditions:**
- Document is open with active WebSocket
- Network layer simulates a WebSocket error

---

### T-2.1: All rich text features (bold, heading, list) remain available offline
**Maps to:** AC-2  
**Category:** happy-path

```gherkin
  Scenario: Rich text formatting features are available while offline
    Given the client is in offline mode
    And the document "doc-abc123" contains the text "Sample content"
    When editor-a applies bold formatting to "Sample"
    And editor-a changes the paragraph style to Heading 1
    And editor-a inserts a bulleted list item "• First item"
    And editor-a inserts a code block containing "const x = 1;"
    Then all four edits are reflected immediately in the local document view
    And no feature is disabled, grayed out, or shows an error
    And each edit produces a CRDT operation that is appended to the IndexedDB queue
```

**Test Data:**
- `document_id: "doc-abc123"`, initial text: `"Sample content"`
- Operations:
  1. Bold: apply `bold` to range `[0, 6]`
  2. Heading: set paragraph type `"heading-1"` at position 0
  3. List item: insert `"• First item"` at end
  4. Code block: insert code block with content `"const x = 1;"`

**Preconditions:**
- Client is in offline mode (WebSocket closed)
- IndexedDB is available and writable

---

### T-2.2: Text insertion and deletion remain available while offline
**Maps to:** AC-2  
**Category:** happy-path

```gherkin
  Scenario: Text insertion and deletion work normally in offline mode
    Given the client is in offline mode
    And the document reads "Hello"
    When editor-a types " world" appending it to the document
    And editor-a deletes the last 2 characters "ld"
    Then the document reads "Hello wor"
    And two CRDT operations (one insert, one delete) are queued in IndexedDB
```

**Test Data:**
- Initial text: `"Hello"`
- Insert: `" world"` at position 5
- Delete: 2 characters at positions 9–10
- Expected text: `"Hello wor"`

**Preconditions:**
- Client in offline mode

---

### T-3.1: CRDT operations are persisted to IndexedDB in order
**Maps to:** AC-3  
**Category:** happy-path

```gherkin
  Scenario: Three offline edits are queued in IndexedDB in the order they were applied
    Given the client is in offline mode
    When editor-a makes three edits in order:
      | Order | Operation | Content    | Position |
      | 1     | insert    | "Intro: "  | 0        |
      | 2     | insert    | "summary"  | 7        |
      | 3     | delete    | 3 chars    | 7        |
    Then IndexedDB contains exactly 3 queued CRDT operations
    And the operations are stored with sequence numbers 1, 2, 3 reflecting insertion order
    And each operation record includes: operation_id, sequence_number, operation_type, payload, timestamp
```

**Test Data:**
- Op 1: `{ op_id: "op-001", seq: 1, type: "insert", content: "Intro: ", position: 0 }`
- Op 2: `{ op_id: "op-002", seq: 2, type: "insert", content: "summary", position: 7 }`
- Op 3: `{ op_id: "op-003", seq: 3, type: "delete", length: 3, position: 7 }`

**Preconditions:**
- Client in offline mode
- IndexedDB store `"offline-queue"` for document "doc-abc123" is accessible

---

### T-3.2: Offline queue is in IndexedDB (not sessionStorage or memory-only)
**Maps to:** AC-3  
**Category:** happy-path

```gherkin
  Scenario: Offline operations are persisted in IndexedDB and survive JavaScript context loss
    Given the client is in offline mode
    And editor-a has made 2 edits that are queued in IndexedDB
    When the browser's JavaScript context is suspended and resumed (simulating a background tab becoming active)
    Then the 2 queued operations are still present in IndexedDB
    And the queue has not been cleared
```

**Test Data:**
- 2 operations queued before context loss
- Expected count after context resume: 2

**Preconditions:**
- IndexedDB store persists across JavaScript context suspension
- Operations written before suspension

---

### T-4.1: Offline banner is non-blocking and does not obscure the editor
**Maps to:** AC-4  
**Category:** happy-path

```gherkin
  Scenario: Offline banner is displayed without blocking document editing
    Given the client has entered offline mode
    When the offline banner appears
    Then the banner is positioned at the top of the editor viewport
    And the banner height does not overlap the document content area
    And the editor text input area is fully interactive while the banner is visible
    And a user can click inside the document and type while the banner is present
```

**Test Data:**
- Banner z-index: banner does not overlay the document textarea
- Banner position: `top: 0`, `width: 100%`, outside the document scroll area

**Preconditions:**
- Client in offline mode
- Banner rendered in the DOM

---

### T-5.1: Remote cursors and presence list are hidden in offline mode
**Maps to:** AC-5  
**Category:** boundary

```gherkin
  Scenario: Remote presence data is hidden when the client goes offline
    Given editor-a and editor-b are both connected to document "doc-abc123"
    And editor-b's cursor is visible at position 42 in editor-a's view
    And the presence list shows 2 editors
    When the WebSocket closes and editor-a enters offline mode
    Then editor-b's cursor indicator is no longer displayed in editor-a's view
    And the presence list shows only editor-a or shows an "offline" indicator
    And no stale cursor data from editor-b is rendered
```

**Test Data:**
- `user_id: "editor-a"`, `user_id: "editor-b"`
- Editor-b cursor position before disconnect: 42
- Expected presence list after disconnect: `["editor-a"]` or `["You (offline)"]`

**Preconditions:**
- Both editors connected before the disconnect event
- Presence data for editor-b exists in the local state

---

### T-5.2: No stale remote cursors appear after extended offline period
**Maps to:** AC-5  
**Category:** boundary

```gherkin
  Scenario: Stale remote cursor data is not rendered after 30 minutes offline
    Given the client has been in offline mode for 30 minutes
    And editor-b's last known cursor position was position 20
    When editor-a scrolls through the document
    Then no cursor for editor-b is shown at position 20 or anywhere else
    And the presence list does not include editor-b
```

**Test Data:**
- Offline duration: 30 minutes
- Stale cursor: `user_id: "editor-b"`, position 20

**Preconditions:**
- Client has been offline for 30 minutes
- Local state still contains editor-b's last cursor position

---

### T-6.1: Auto-snapshot timer is paused during offline mode
**Maps to:** AC-6  
**Category:** boundary

```gherkin
  Scenario: No snapshot is triggered while offline even after 5 minutes of edit activity
    Given the client is in offline mode
    And editor-a has been making continuous edits for 6 cumulative minutes while offline
    When the 5-minute activity threshold is crossed
    Then no snapshot is triggered
    And no request is made to the snapshot creation endpoint
    And the activity timer indicates "paused" state
```

**Test Data:**
- Offline edit duration: 6 cumulative minutes
- Snapshot endpoint: `POST /api/documents/doc-abc123/snapshots`
- Expected requests to snapshot endpoint while offline: 0

**Preconditions:**
- Client is in offline mode
- Activity timer was running before going offline and is now paused

---

### T-7.1: Offline banner dismisses and reconnect flow begins on WebSocket restore
**Maps to:** AC-7  
**Category:** happy-path

```gherkin
  Scenario: Offline banner is replaced by reconnect indicator when connection is restored
    Given the client is in offline mode with the banner "You're offline — changes will sync when reconnected" displayed
    And there are 5 queued operations in IndexedDB
    When the WebSocket connection is restored successfully
    Then the offline banner is removed from the DOM
    And a reconnect merge status indicator is shown (e.g., "Syncing offline changes…")
    And the OFFL-02 merge flow begins
    And the 5 queued operations begin replaying to the server
```

**Test Data:**
- Queued operations: 5
- Reconnect indicator text: `"Syncing offline changes…"` (or equivalent)

**Preconditions:**
- Client was in offline mode with banner shown
- WebSocket connection re-established

---

### T-8.1: IndexedDB storage exhaustion shows an error and does not crash
**Maps to:** AC-8  
**Category:** error-handling

```gherkin
  Scenario: Editor sees an error message when IndexedDB storage is full
    Given the client is in offline mode
    And the local device's IndexedDB storage quota for this origin is fully consumed
    When editor-a attempts to make a new text edit
    Then the local document view reflects the edit (UI is not blocked)
    And the user sees the error message: "Unable to save offline changes — device storage is full. Your recent edits may not be preserved when you reconnect."
    And the editor does not crash or throw an unhandled exception
    And the error message is visually distinct from the offline banner
```

**Test Data:**
- IndexedDB `QuotaExceededError` simulated on next `put()` call
- Error message: `"Unable to save offline changes — device storage is full. Your recent edits may not be preserved when you reconnect."`

**Preconditions:**
- Client is in offline mode
- IndexedDB storage is at quota (simulated by mocking `IDBObjectStore.put` to reject with `QuotaExceededError`)

---

### T-9.1: Queued operations survive page reload while offline
**Maps to:** AC-9  
**Category:** edge-case

```gherkin
  Scenario: Offline queue persists through a page reload and local document state is restored
    Given the client is offline with 4 queued CRDT operations in IndexedDB
    And the local document view reflects all 4 edits
    When the user reloads the page (F5) while still offline
    Then the page loads and reads the 4 queued operations from IndexedDB
    And the local document state reflects all 4 edits (same as before reload)
    And the offline banner is displayed
    And the 4 queued operations remain in IndexedDB, ready to sync on reconnect
```

**Test Data:**
- 4 operations before reload: `[op-001, op-002, op-003, op-004]`
- Expected state after reload: local document matches post-edit state
- IndexedDB queue count after reload: 4

**Preconditions:**
- Client is offline when reload occurs
- IndexedDB contains the 4 operations
- Application re-reads IndexedDB on startup when offline state is detected

---

### T-9.2: Queue read-back restores document state within 2 seconds
**Maps to:** AC-9  
**Category:** edge-case (performance)

```gherkin
  Scenario: Document state is restored from IndexedDB within 2 seconds after reload while offline
    Given the client is offline with 50 queued operations in IndexedDB
    When the user reloads the page
    Then the document state reflecting all 50 operations is fully displayed within 2000ms of page load
    And the offline banner is visible within that same 2-second window
```

**Test Data:**
- Queue size: 50 CRDT operations
- Performance SLA: local state restored within 2000ms

**Preconditions:**
- Client offline
- 50 operations in IndexedDB queue
- Test measures time from `DOMContentLoaded` to document render complete

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated user cannot open a document (offline mode never entered)
**Maps to:** AC-AUTH-1  
**Category:** security

```gherkin
  Scenario: Unauthenticated document open request is rejected before offline mode is relevant
    Given no valid authentication token or session is present
    When a client sends a GET request to "/api/documents/doc-abc123"
    Then the server returns HTTP 401 Unauthorized
    And the document does not load in the browser
    And the WebSocket connection is never established
    And offline mode is never entered
```

**Test Data:**
- `Authorization` header: absent
- `Cookie`: absent
- `document_id: "doc-abc123"`
- Expected: `HTTP 401`, `{ "error": "Authentication required" }`

**Preconditions:**
- No session established
- Document "doc-abc123" exists on server

---

### T-AUTH-2.1: User without document access cannot open document
**Maps to:** AC-AUTH-2  
**Category:** security

```gherkin
  Scenario: Authenticated user without document access is rejected
    Given an authenticated user with user_id "user-no-access" and role "editor" on a different document
    And user-no-access does not have any permission on document "doc-abc123"
    When the client sends a GET request to "/api/documents/doc-abc123" with a valid session token
    Then the server returns HTTP 403 Forbidden
    And the response body contains { "error": "Access denied" }
    And the document does not load
    And the WebSocket connection is never established
    And offline mode is not entered
```

**Test Data:**
- `user_id: "user-no-access"`, valid `session_token: "sess-noaccess-001"`
- `document_id: "doc-abc123"`: user has no role on this document
- Expected: `HTTP 403`, `{ "error": "Access denied" }`

**Preconditions:**
- User is authenticated globally but has no permissions on "doc-abc123"

---

---

# Test Specifications: OFFL-02 — Reconnect Merge and Divergence Warning

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1 | edge-case |
| AC-4 | T-4.1, T-4.2 | edge-case |
| AC-5 | T-5.1 | boundary |
| AC-6 | T-6.1 | boundary |
| AC-7 | T-7.1 | happy-path |
| AC-8 | T-8.1, T-8.2 | happy-path |
| AC-9 | T-9.1, T-9.2 | error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Queued operations are replayed in order on reconnect
**Maps to:** AC-1  
**Category:** happy-path

```gherkin
Feature: Reconnect merge and divergence warning

  Scenario: All offline queued operations are replayed in sequence on WebSocket reconnect
    Given an authenticated editor with user_id "editor-a" and role "editor"
    And editor-a was offline for 15 minutes with 3 queued CRDT operations in IndexedDB:
      | Seq | Operation | Content   | Position |
      | 1   | insert    | "Preface" | 0        |
      | 2   | insert    | ": "      | 7        |
      | 3   | bold      | range 0-7 | —        |
    And during that time editor-b inserted " [Draft]" at the end of the document
    When the WebSocket connection is restored
    Then the client replays op-seq-1, op-seq-2, op-seq-3 to the server in that order
    And the merged document reflects all 3 of editor-a's offline ops plus editor-b's " [Draft]" addition
    And the document state is consistent between editor-a and editor-b
```

**Test Data:**
- `user_id: "editor-a"`, offline queue: 3 operations, `offline_duration: 15 minutes`
- `user_id: "editor-b"`, online edit during editor-a's offline period: insert `" [Draft]"` at end
- Expected merged state: `"Preface: [document content] [Draft]"` with `"Preface"` bolded

**Preconditions:**
- Editor-a had valid session throughout (not expired)
- Server stored editor-b's edit
- IndexedDB queue for editor-a: 3 operations with sequence numbers 1, 2, 3

---

### T-1.2: Merge completes when there were no remote changes during offline period
**Maps to:** AC-1  
**Category:** happy-path

```gherkin
  Scenario: Offline replay succeeds cleanly when no other editors made changes
    Given editor-a was offline for 10 minutes with 2 queued operations
    And no other editor made changes to document "doc-abc123" during that time
    When the WebSocket connection is restored and operations are replayed
    Then both operations are applied to the server state
    And the server document state matches editor-a's local view exactly
    And the merge completes without conflict
```

**Test Data:**
- Queued ops: 2 (no LWW conflicts expected)
- Remote changes during offline: 0

**Preconditions:**
- Document "doc-abc123" unchanged on server during editor-a's offline period

---

### T-2.1: Merged state is broadcast to all connected clients after replay
**Maps to:** AC-2  
**Category:** happy-path

```gherkin
  Scenario: All connected clients receive the merged operations after reconnect
    Given editor-a has reconnected and replayed 3 queued operations
    And editor-b and editor-c are currently connected to document "doc-abc123"
    When the server applies the replayed operations
    Then editor-b receives all 3 merged CRDT operations via WebSocket
    And editor-c receives all 3 merged CRDT operations via WebSocket
    And editor-b's and editor-c's document views converge to the same state as editor-a's
```

**Test Data:**
- `user_id: "editor-b"`, `user_id: "editor-c"`: both connected
- 3 merged operations broadcast by server
- Expected: all clients converge to identical document state

**Preconditions:**
- Editor-b and editor-c have open WebSocket connections at time of merge
- Server broadcasts merged ops to all subscribers

---

### T-3.1: LWW conflict resolution applies during offline replay
**Maps to:** AC-3  
**Category:** edge-case

```gherkin
  Scenario: Same-range conflict during offline replay is resolved by LWW (later timestamp wins)
    Given editor-a was offline and queued an operation: insert "alpha" at position 10, client_timestamp T1
    And while editor-a was offline, editor-b inserted "beta" at position 10 with server_timestamp T2 where T2 > T1
    When editor-a reconnects and replays the queued insert
    Then the server applies LWW resolution: "beta" (T2) wins over "alpha" (T1)
    And the document contains "beta" at position 10, not "alpha"
    And the merged document state is propagated to all clients
    And editor-a's local view is updated to reflect the LWW result (showing "beta", not "alpha")
```

**Test Data:**
- Editor-a queued op: `{ op_id: "op-ea-001", type: "insert", content: "alpha", position: 10, client_timestamp: "T1" }`
- Editor-b live op: `{ op_id: "op-eb-001", type: "insert", content: "beta", position: 10, server_timestamp: "T2", T2 > T1 }`
- LWW winner: `"beta"` (T2)

**Preconditions:**
- Server has applied editor-b's operation with server timestamp T2
- Editor-a's client timestamp T1 < T2

---

### T-4.1: Divergence warning appears after more than 24 hours offline with correct duration
**Maps to:** AC-4  
**Category:** edge-case

```gherkin
  Scenario: Divergence warning banner shows correct duration after 26-hour offline period
    Given editor-a was offline for exactly 26 hours and 17 minutes
    And the merge has completed successfully
    When the merge confirmation is received
    Then a dismissible banner is displayed with the text:
      "You were offline for 26 hours — your changes have been merged. Please review the document for conflicts."
    And the banner has role="alert" and aria-live="polite"
    And a "Dismiss" button is present with aria-label="Dismiss offline sync warning"
```

**Test Data:**
- Offline duration: 26 hours 17 minutes → rounded to 26 hours
- Banner text: `"You were offline for 26 hours — your changes have been merged. Please review the document for conflicts."`
- Duration rounding rule: nearest hour (26h 17m → 26h; 26h 31m → 27h)

**Preconditions:**
- Merge completed without error
- Disconnect timestamp and reconnect timestamp are both recorded; difference > 86400 seconds

---

### T-4.2: Divergence warning duration rounds to nearest hour
**Maps to:** AC-4  
**Category:** edge-case

```gherkin
  Scenario: Offline duration of 25 hours 45 minutes rounds to 26 hours in the warning
    Given editor-a was offline for exactly 25 hours and 45 minutes
    And the merge has completed successfully
    When the divergence warning banner is displayed
    Then the banner text reads:
      "You were offline for 26 hours — your changes have been merged. Please review the document for conflicts."
```

**Test Data:**
- Offline duration: 25 hours 45 minutes → rounds to 26 hours
- Banner text includes `"26 hours"`

**Preconditions:**
- Merge completed
- Offline duration > 24 hours

---

### T-5.1: No divergence warning for offline periods under 24 hours
**Maps to:** AC-5  
**Category:** boundary

```gherkin
  Scenario: No warning is shown after a 23-hour offline period
    Given editor-a was offline for 23 hours and 59 minutes
    When the merge completes
    Then no divergence warning banner is displayed
    And the offline banner (from OFFL-01) is dismissed
    And the editor returns to normal collaborative mode without additional prompts or banners
```

**Test Data:**
- Offline duration: 23 hours 59 minutes (< 24 hours)
- Expected: 0 divergence banners shown

**Preconditions:**
- Merge completed without error
- Offline duration strictly less than 86400 seconds

---

### T-6.1: Merge is attempted regardless of offline duration (even multi-day)
**Maps to:** AC-6  
**Category:** boundary

```gherkin
  Scenario: Merge is attempted after 72 hours offline without refusing the queue
    Given editor-a was offline for 72 hours with 20 queued operations
    When the WebSocket connection is restored
    Then the client initiates the replay of all 20 queued operations
    And the server accepts the replay (does not reject due to age of operations)
    And no error message like "offline too long" or "queue expired" is shown
    And the merge proceeds normally (with divergence warning shown per AC-4)
```

**Test Data:**
- Offline duration: 72 hours
- Queue size: 20 operations
- Expected: server accepts all 20 ops; no rejection due to age

**Preconditions:**
- Session token is still valid (or renewed) after 72 hours
- Server has no TTL-based rejection on operation age

---

### T-7.1: Divergence warning banner is dismissible
**Maps to:** AC-7  
**Category:** happy-path

```gherkin
  Scenario: User dismisses the divergence warning without further action required
    Given the divergence warning banner is displayed after a 26-hour offline period
    When the user clicks the "Dismiss" button (aria-label="Dismiss offline sync warning")
    Then the banner is removed from the DOM
    And no further action is required
    And the user can continue editing the document immediately
    And the banner does not reappear unless a new offline/reconnect cycle occurs
```

**Test Data:**
- Dismiss button: `aria-label="Dismiss offline sync warning"`, keyboard focusable
- Post-dismiss: banner element removed, editing unblocked

**Preconditions:**
- Divergence warning is visible
- Merge has already completed

---

### T-8.1: IndexedDB queue is cleared after successful merge
**Maps to:** AC-8  
**Category:** happy-path

```gherkin
  Scenario: IndexedDB queue is cleared once the server confirms the merge
    Given editor-a has reconnected and replayed 5 queued operations
    And the server has confirmed successful application of all 5 operations
    When the server confirmation is received
    Then the IndexedDB queue for document "doc-abc123" is empty (0 operations)
    And a subsequent read of the IndexedDB store returns no pending operations
```

**Test Data:**
- Queue before merge: 5 operations
- Server response: `HTTP 200` with confirmation payload
- Queue after merge: 0 operations

**Preconditions:**
- Server confirms all 5 operations applied
- Client waits for server confirmation before clearing queue

---

### T-8.2: A new offline period after merge starts with a fresh empty queue
**Maps to:** AC-8  
**Category:** happy-path

```gherkin
  Scenario: Second offline disconnect-reconnect cycle starts with an empty queue
    Given editor-a has previously completed a merge cycle (queue was cleared)
    And editor-a then makes 2 new online edits
    When the WebSocket disconnects again and editor-a makes 1 offline edit
    Then IndexedDB contains exactly 1 queued operation (the new offline edit)
    And the prior merge's operations are not re-queued or present in IndexedDB
```

**Test Data:**
- Prior queue: cleared after successful merge
- New offline queue: 1 operation
- Expected IndexedDB count: 1

**Preconditions:**
- Merge cycle completed and queue cleared
- New disconnect event simulated

---

## Negative Tests

### T-9.1: Network error during replay leaves queue intact and shows error
**Maps to:** AC-9  
**Category:** error-handling

```gherkin
  Scenario: Mid-batch network error leaves remaining operations queued and shows error message
    Given editor-a has reconnected and starts replaying 10 queued operations
    And operations 1 through 6 have been successfully sent
    When a network error interrupts the replay after operation 6
    Then operations 7 through 10 remain in the IndexedDB queue
    And the user sees the message: "Reconnection interrupted — your changes are still queued and will sync when connection stabilizes."
    And operations 1–6 are not duplicated on the next retry (idempotency keys prevent re-application)
```

**Test Data:**
- Queue: 10 operations (`op-001` through `op-010`)
- Error occurs after op-006 sent
- Remaining queue: `[op-007, op-008, op-009, op-010]`
- Error message: `"Reconnection interrupted — your changes are still queued and will sync when connection stabilizes."`

**Preconditions:**
- WebSocket reconnects but drops mid-batch
- Each operation has a client-generated idempotency key

---

### T-9.2: Full replay retried on next stable connection after partial failure
**Maps to:** AC-9  
**Category:** error-handling

```gherkin
  Scenario: Remaining queue is replayed on next reconnect after partial failure
    Given editor-a experienced a mid-batch failure leaving operations 7–10 in the queue
    When the WebSocket reconnects again successfully
    Then the client replays operations 7–10 to the server
    And the server applies them (operations 1–6 are already applied; idempotency keys prevent double-apply)
    And the queue is fully cleared after this second replay
    And no duplicate operations appear in the document
```

**Test Data:**
- Remaining queue: `[op-007, op-008, op-009, op-010]`
- Server state: already has op-001 through op-006 applied
- Expected: ops 7–10 applied; queue cleared

**Preconditions:**
- Partial merge occurred in a prior reconnect attempt
- Idempotency keys prevent re-application of already-applied ops

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated replay attempt is rejected with 401
**Maps to:** AC-AUTH-1  
**Category:** security

```gherkin
  Scenario: Server rejects operation replay with no authentication token
    Given no valid authentication token is present
    When the client sends a POST request to "/api/documents/doc-abc123/operations/replay" with a batch of 3 operations
    Then the server returns HTTP 401 Unauthorized
    And the response body contains { "error": "Authentication required" }
    And the IndexedDB queue is not cleared
    And the user is redirected to the login page
```

**Test Data:**
- `Authorization` header: absent
- Request body: `{ "operations": [op-001, op-002, op-003], "document_id": "doc-abc123" }`
- Expected: `HTTP 401`, queue remains intact (3 operations)

**Preconditions:**
- No session token present
- Client-side app attempts replay on reconnect regardless of auth state (server enforces)

---

### T-AUTH-2.1: Revoked document access during offline period results in 403 and queue preserved
**Maps to:** AC-AUTH-2  
**Category:** security

```gherkin
  Scenario: Editor whose access was revoked while offline cannot replay their queue
    Given editor-a went offline 2 hours ago with edit access to document "doc-abc123"
    And an admin revoked editor-a's edit access while editor-a was offline
    And editor-a has 8 queued offline operations
    When editor-a reconnects and the client sends the replay request
    Then the server returns HTTP 403 Forbidden
    And the user sees the message: "You no longer have edit access to this document. Your offline changes could not be synced."
    And the IndexedDB queue is NOT cleared (operations preserved for potential recovery)
    And no operations are applied to the document
```

**Test Data:**
- `user_id: "editor-a"`, access revoked at T-offline+30m
- Queue: 8 operations
- Expected: `HTTP 403`, queue count remains 8, error message shown

**Preconditions:**
- Editor-a's role on "doc-abc123" has been changed from "editor" to none
- Server-side permission check validates on replay request, not only on initial connect

---

---

# Test Specifications: VER-01 — Automatic Snapshots on Edit Activity

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1, T-3.2 | edge-case |
| AC-4 | T-4.1, T-4.2 | edge-case |
| AC-5 | T-5.1 | boundary |
| AC-6 | T-6.1, T-6.2 | boundary |
| AC-7 | T-7.1 | boundary |
| AC-8 | T-8.1 | performance |
| AC-9 | T-9.1 | boundary |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Snapshot triggers after exactly 5 cumulative minutes of edit activity
**Maps to:** AC-1  
**Category:** happy-path

```gherkin
Feature: Automatic snapshots on edit activity

  Scenario: A snapshot is saved when the cumulative edit activity timer reaches 5 minutes
    Given an authenticated editor with user_id "editor-a" and role "editor"
    And the document "doc-abc123" has been open for 15 minutes
    And editor-a has made keystrokes continuously for 5 cumulative minutes (idle periods excluded)
    When the cumulative activity clock reaches exactly 300 seconds
    Then the server creates a new snapshot record for document "doc-abc123"
    And the snapshot is stored server-side with a timestamp within 5 seconds of the trigger
    And the activity timer resets to 0
    And no modal, dialog, or visible UI interruption appears in the editor
```

**Test Data:**
- `user_id: "editor-a"`, `document_id: "doc-abc123"`
- Activity pattern: 2 minutes editing → 10 minutes idle → 3 minutes editing = 5 cumulative minutes at T+15m
- Snapshot endpoint: `POST /api/documents/doc-abc123/snapshots`
- Expected: 1 snapshot created

**Preconditions:**
- Editor-a is authenticated with active session
- WebSocket connection is live
- Snapshot creation endpoint is accessible

---

### T-1.2: Activity timer resets after each snapshot; second snapshot triggers at cumulative T+10m
**Maps to:** AC-1  
**Category:** happy-path

```gherkin
  Scenario: Two snapshots are taken at each 5-minute activity boundary
    Given editor-a is editing document "doc-abc123" continuously
    And the first snapshot has been triggered at cumulative activity T=5 minutes and the timer reset to 0
    When editor-a continues editing for another 5 cumulative minutes
    Then a second snapshot is created
    And the second snapshot's timestamp is later than the first's
    And the total snapshot count for this session is 2
```

**Test Data:**
- First snapshot at cumulative activity: 5 minutes
- Second snapshot at cumulative activity: 10 minutes (timer resets after first)
- `document_id: "doc-abc123"`, 2 snapshots expected

**Preconditions:**
- First snapshot has been created and timer reset
- Continuous editing for additional 5 minutes

---

### T-2.1: Snapshot record includes timestamp, document state, and contributing editors
**Maps to:** AC-2  
**Category:** happy-path

```gherkin
  Scenario: Snapshot record contains all required metadata fields
    Given editor-a and editor-b have both made edits during the current 5-minute activity window
    When the snapshot is triggered and stored
    Then the snapshot record contains:
      | Field              | Value                                        |
      | document_state     | Full document content at time of snapshot    |
      | timestamp_utc      | ISO 8601 UTC timestamp of snapshot creation  |
      | contributing_users | ["editor-a", "editor-b"] with display names |
    And no other editor's user_id appears in the contributing_users list
```

**Test Data:**
- `user_id: "editor-a"`, `display_name: "Alice"`: made edits in this window
- `user_id: "editor-b"`, `display_name: "Bob"`: made edits in this window
- Expected contributing_users: `[{ id: "editor-a", name: "Alice" }, { id: "editor-b", name: "Bob" }]`
- Timestamp: valid ISO 8601 UTC, e.g. `"2026-06-15T14:30:00Z"`

**Preconditions:**
- Both editors are authenticated with active sessions
- Both editors made at least 1 keystroke or formatting event in the window
- Snapshot is server-triggered

---

### T-3.1: Contributing editors list is accurate — only editors who made edits in the window are listed
**Maps to:** AC-3  
**Category:** edge-case

```gherkin
  Scenario: An editor who was present but made no edits is not listed as a contributor
    Given editor-a, editor-b, and editor-c all have document "doc-abc123" open
    And editor-a made 3 edits during the activity window
    And editor-b made 1 edit during the activity window
    And editor-c only scrolled and moved their cursor (no keystrokes or formatting changes)
    When the snapshot is triggered
    Then the snapshot contributing_users list contains editor-a and editor-b
    And editor-c is NOT in the contributing_users list
```

**Test Data:**
- Editor-a: 3 keystrokes recorded in activity window
- Editor-b: 1 formatting event in activity window
- Editor-c: 0 edits, 5 cursor moves and 3 scrolls (not counted as edit activity)
- Expected contributing_users: `["editor-a", "editor-b"]`

**Preconditions:**
- All three editors are connected
- Activity tracking distinguishes keystrokes/formatting from cursor/scroll events

---

### T-3.2: Contributing editors list supports up to 50 editors
**Maps to:** AC-3  
**Category:** edge-case

```gherkin
  Scenario: Snapshot records all 50 contributing editors in a maximum-capacity session
    Given 50 editors with user_ids "editor-01" through "editor-50" each make at least 1 edit during the activity window
    When the snapshot is triggered
    Then the contributing_users list contains all 50 user IDs
    And the snapshot is stored successfully without truncation of the editors list
    And the snapshot write completes within 5 seconds
```

**Test Data:**
- 50 editors: `editor-01` through `editor-50`, each with `role: "editor"` and 1 edit each
- Expected: `contributing_users.length === 50`

**Preconditions:**
- 50 authenticated editors connected simultaneously
- Snapshot storage can accommodate a 50-user editor list

---

### T-4.1: Idle time does not advance the activity timer
**Maps to:** AC-4  
**Category:** edge-case

```gherkin
  Scenario: 10 minutes of idle time between edit bursts does not trigger a snapshot
    Given editor-a edits for 2 minutes (cumulative activity: 2min)
    And editor-a is then idle (no keystrokes, no formatting) for 10 minutes
    And editor-a then resumes editing for 2 more minutes (cumulative activity: 4min)
    When the total wall clock time is 14 minutes but cumulative edit activity is only 4 minutes
    Then no snapshot has been triggered yet
    And the activity timer reads 4 cumulative minutes (not 14)
    And the snapshot endpoint has not been called
```

**Test Data:**
- Activity pattern: `[2min active, 10min idle, 2min active]`
- Wall clock at end: 14 minutes
- Cumulative activity: 4 minutes
- Expected snapshot count: 0

**Preconditions:**
- Activity timer is event-driven (increments on edit events, not wall clock)
- Idle detection: absence of keystroke/formatting events for > N milliseconds pauses the timer

---

### T-4.2: Final edit burst completes the 5-minute threshold and triggers snapshot
**Maps to:** AC-4  
**Category:** edge-case

```gherkin
  Scenario: Snapshot is triggered only when cumulative activity reaches 5 minutes, regardless of idle gaps
    Given editor-a has edited for 2 minutes, was idle 10 minutes, then edited 2 more minutes (4min cumulative)
    When editor-a edits for 1 more minute (cumulative reaches 5 minutes)
    Then a snapshot is triggered immediately
    And the activity timer resets to 0
    And the snapshot contains the document state at the moment of the 5-minute threshold
```

**Test Data:**
- Cumulative: 2min + 2min + 1min = 5min triggers snapshot
- Total wall clock: ~15min
- Expected snapshot count: 1

**Preconditions:**
- Activity timer at 4 cumulative minutes before final edit burst
- WebSocket connection active

---

### T-5.1: Snapshot timer is paused during offline mode and resumes after reconnect merge
**Maps to:** AC-5  
**Category:** boundary

```gherkin
  Scenario: No snapshot is triggered during offline editing; timer resumes post-merge
    Given editor-a has accumulated 4 cumulative minutes of edit activity (1 minute to snapshot threshold)
    And editor-a's WebSocket disconnects (offline mode per OFFL-01)
    And editor-a continues editing offline for 2 more minutes
    When the offline state persists
    Then no snapshot is triggered during the 2 offline minutes
    And the activity timer remains at 4 cumulative minutes (paused)
    And the snapshot endpoint is not called while offline
    When the OFFL-02 merge completes and connection is re-established
    And editor-a makes 1 more minute of edits online
    Then the timer reaches 5 cumulative minutes and a snapshot is triggered
```

**Test Data:**
- Pre-disconnect cumulative: 4 minutes
- Offline edit duration: 2 minutes (timer paused)
- Post-merge edits: 1 minute (timer resumes from 4 → 5 minutes)
- Expected snapshot count: 1 (triggered online, post-merge)

**Preconditions:**
- Activity timer is paused when offline mode is entered
- Timer resumes only after OFFL-02 merge completes and WebSocket is restored

---

### T-6.1: Auto-snapshot older than 30 days is deleted by the pruning job
**Maps to:** AC-6  
**Category:** boundary

```gherkin
  Scenario: Unnamed auto-snapshot created 31 days ago is deleted when the pruning job runs
    Given document "doc-abc123" has an auto-snapshot with snapshot_id "snap-old-001"
    And "snap-old-001" was created 31 days ago and is not named
    And a named snapshot "snap-named-001" was created 32 days ago
    When the auto-pruning job runs
    Then "snap-old-001" is deleted from server storage
    And "snap-named-001" is not deleted
    And the total snapshot count decreases by 1
```

**Test Data:**
- `snap-old-001`: auto-snapshot, `created_at: NOW - 31 days`, `named: false`
- `snap-named-001`: named snapshot, `created_at: NOW - 32 days`, `named: true`, `name: "Final Review"`
- Expected after pruning: `snap-old-001` absent, `snap-named-001` present

**Preconditions:**
- Pruning job runs at least once daily
- Pruning job has write access to snapshot storage
- Snapshot metadata includes `created_at` and `named` fields

---

### T-6.2: Auto-snapshot at exactly 30 days old is NOT pruned; pruning starts at > 30 days
**Maps to:** AC-6  
**Category:** boundary

```gherkin
  Scenario: Auto-snapshot exactly 30 days old is retained by the pruning job
    Given an auto-snapshot "snap-boundary-001" was created exactly 30 days ago (to the minute)
    When the pruning job runs
    Then "snap-boundary-001" is not deleted
    And it remains accessible in the snapshot list
```

**Test Data:**
- `snap-boundary-001`: `created_at: NOW - 30 days exactly`, `named: false`
- Expected: retained (pruning deletes snapshots older than 30 days, not snapshots at 30 days)

**Preconditions:**
- Pruning condition: `age > 30 days` (exclusive), not `age >= 30 days`

---

### T-7.1: Named snapshots are never pruned regardless of age
**Maps to:** AC-7  
**Category:** boundary

```gherkin
  Scenario: A named snapshot 60 days old is not deleted by the pruning job
    Given document "doc-abc123" has a named snapshot "snap-named-2024" with name "Version 1.0"
    And "snap-named-2024" was created 60 days ago
    When the auto-pruning job runs
    Then "snap-named-2024" is not deleted
    And it remains retrievable by snapshot_id
    And the pruning job log shows it was skipped due to named status
```

**Test Data:**
- `snap-named-2024`: `created_at: NOW - 60 days`, `named: true`, `name: "Version 1.0"`
- Expected: retained, not in pruning deletion list

**Preconditions:**
- Pruning job checks `named` flag before deleting
- Snapshot metadata field `named: true` is set when name is applied

---

### T-8.1: Snapshot creation does not produce perceptible editor lag
**Maps to:** AC-8  
**Category:** performance

```gherkin
  Scenario: Editor UI remains responsive while a snapshot is being written server-side
    Given a snapshot trigger occurs at the 5-minute activity threshold
    When the server begins writing the snapshot
    Then the local editor UI frame rate does not drop below 30fps during the snapshot write
    And no modal, spinner, or blocking element appears in the editor
    And keystrokes made during snapshot write are registered and applied within 50ms
    And the snapshot completes writing within 5 seconds of the trigger
```

**Test Data:**
- UI responsiveness threshold: < 50ms keystroke-to-display latency during snapshot write
- Snapshot write SLA: ≤ 5 seconds
- No blocking UI elements expected

**Preconditions:**
- Snapshot write is async/non-blocking (fire-and-forget from client perspective)
- Server-side snapshot write does not hold application locks

---

### T-9.1: No snapshot is triggered for a read-only session with no edits
**Maps to:** AC-9  
**Category:** boundary

```gherkin
  Scenario: A viewer who only reads the document does not trigger a snapshot
    Given an authenticated user with user_id "viewer-01" and role "viewer"
    And viewer-01 has document "doc-abc123" open for 20 minutes
    And viewer-01 has scrolled, selected text, and moved their cursor
    And viewer-01 has made 0 edits (no keystrokes, no formatting changes)
    When 20 minutes have elapsed
    Then the activity timer for this session remains at 0 cumulative minutes
    And no snapshot has been triggered
    And the snapshot endpoint has not been called for viewer-01's session
```

**Test Data:**
- `user_id: "viewer-01"`, `role: "viewer"`, session duration: 20 minutes
- Edit events: 0 (only scroll and selection events)
- Expected snapshots triggered: 0

**Preconditions:**
- Activity tracking does not count scroll, selection, or cursor events
- Viewer role does not have edit capability

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated direct snapshot creation request is rejected with 401
**Maps to:** AC-AUTH-1  
**Category:** security

```gherkin
  Scenario: Unauthenticated POST to snapshot creation endpoint returns 401
    Given no valid authentication token or session is present
    When a request is sent to POST "/api/documents/doc-abc123/snapshots"
    Then the server returns HTTP 401 Unauthorized
    And the response body contains { "error": "Authentication required" }
    And no snapshot is created or stored
```

**Test Data:**
- `Authorization` header: absent
- Request: `POST /api/documents/doc-abc123/snapshots`
- Expected: `HTTP 401`, no snapshot record in storage

**Preconditions:**
- Snapshot endpoint is publicly routable but requires authentication
- No session established

---

### T-AUTH-2.1: Viewer directly calling the snapshot endpoint is rejected with 403
**Maps to:** AC-AUTH-2  
**Category:** security

```gherkin
  Scenario: Authenticated viewer attempting to trigger a snapshot via direct API call is rejected
    Given an authenticated user with user_id "viewer-01" and role "viewer" (read-only)
    And viewer-01 has a valid session token
    When viewer-01 sends a POST request to "/api/documents/doc-abc123/snapshots"
    Then the server returns HTTP 403 Forbidden
    And the response body contains { "error": "Insufficient permissions — edit access required for snapshot creation" }
    And no snapshot is created
    And viewer-01's activity is not tracked toward the edit activity timer
```

**Test Data:**
- `user_id: "viewer-01"`, `role: "viewer"`, `session_token: "sess-viewer-01"`
- Request: `POST /api/documents/doc-abc123/snapshots`
- Expected: `HTTP 403`, no snapshot stored

**Preconditions:**
- Viewer-01 is authenticated but has viewer role on "doc-abc123"
- Server validates role before allowing snapshot creation
- Note: in normal operation, snapshots are server-triggered by the activity system (not client-requested); this test validates defense-in-depth against a viewer bypassing that


# Test Specifications: VER-02 — Manual Named Version Save

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1 | edge-case |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1, T-5.2 | boundary |
| AC-6 | T-6.1 | boundary |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1, T-8.2 | boundary |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Save version button is visible in document toolbar for editor
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Manual Named Version Save

  Scenario: Editor sees Save version button in document toolbar
    Given an authenticated user with email "editor@example.com" and role "can-edit"
    And the user has document "doc-abc-123" open in the editor
    When the user inspects the document toolbar
    Then a "Save version" button or menu item is visible
    And the "Save version" control is not nested more than one menu level deep
    And the "Save version" control is in an enabled (clickable) state
```

**Test Data:**
- User: `{ email: "editor@example.com", role: "can-edit", status: "active" }`
- Document: `{ id: "doc-abc-123", title: "Q3 Planning Doc", state: "open" }`

**Preconditions:**
- User is authenticated with a valid session token
- Document exists and user has can-edit permission on it

---

### T-1.2: Save version button is accessible from toolbar without nested menu
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Save version is accessible within one interaction layer
    Given an authenticated editor "editor@example.com" has document "doc-abc-123" open
    When the user counts the number of clicks required to reach "Save version" from the toolbar
    Then the "Save version" action is reachable in at most 1 click from the toolbar (i.e., not buried 2+ menus deep)
```

**Test Data:**
- User: `{ email: "editor@example.com", role: "can-edit", status: "active" }`

**Preconditions:**
- User is authenticated and has document open

---

### T-2.1: Named version is saved with user-provided name and metadata
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Editor saves a named version with a custom name
    Given an authenticated editor "editor@example.com" has document "doc-abc-123" open
    And the document contains the text "Current working draft v7"
    When the editor clicks "Save version"
    And the editor enters the version name "Sprint 3 Baseline"
    And the editor clicks "Confirm" or "Save"
    Then the version is saved immediately (within 3 seconds)
    And the saved version has name "Sprint 3 Baseline"
    And the saved version has a UTC timestamp matching the current time (±5 seconds)
    And the saved version records the saving user as "editor@example.com"
    And the UI displays a success confirmation message
```

**Test Data:**
- User: `{ email: "editor@example.com", role: "can-edit", userId: "user-001" }`
- Document: `{ id: "doc-abc-123", content: "Current working draft v7" }`
- Version name: `"Sprint 3 Baseline"`

**Preconditions:**
- User is authenticated with a valid session token
- User has can-edit permission on the document

---

### T-2.2: Named version metadata persists and is retrievable
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Saved named version appears in version history with correct metadata
    Given an editor "editor@example.com" has saved a named version "Sprint 3 Baseline" for document "doc-abc-123"
    When the editor opens the version history panel for "doc-abc-123"
    Then the version "Sprint 3 Baseline" appears in the list
    And its entry shows author "editor@example.com"
    And its entry shows a UTC timestamp
    And its content snapshot matches the document state at time of save
```

**Test Data:**
- Saved version: `{ name: "Sprint 3 Baseline", authorId: "user-001", documentId: "doc-abc-123" }`

**Preconditions:**
- Named version was previously saved via T-2.1

---

### T-3.1: Version saved with timestamp default name when no name is entered
**Maps to:** AC-3
**Category:** edge-case

```gherkin
  Scenario: Editor saves version without entering a name
    Given an authenticated editor "editor@example.com" has document "doc-abc-123" open
    When the editor clicks "Save version"
    And the editor clears the name field and clicks "Confirm" without entering a name
    Then the version is saved with a default name matching the pattern "Version — YYYY-MM-DD HH:MM UTC"
    And the default name reflects the current UTC date and time (±1 minute)
    And the version is otherwise identical to a named version
    And the version is marked as never-auto-prunable
```

**Test Data:**
- User: `{ email: "editor@example.com", role: "can-edit" }`
- Document: `{ id: "doc-abc-123" }`
- Expected name pattern: `"Version — 2026-06-15 14:30 UTC"` (example)

**Preconditions:**
- User is authenticated and has can-edit permission
- Current UTC time is known for assertion

---

### T-4.1: Named version captures merged state during active multi-editor session
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: Named version captures merged document state while multiple editors are active
    Given document "doc-abc-123" is open by editor "editor-a@example.com" and "editor-b@example.com"
    And "editor-a@example.com" has applied edits that are server-confirmed
    And "editor-b@example.com" has edits in-flight that have NOT yet been applied server-side
    When "editor-a@example.com" triggers "Save version" with name "Mid-session Checkpoint"
    Then the snapshot contains all edits from "editor-a@example.com" that are server-applied
    And the snapshot does NOT contain the in-flight edits from "editor-b@example.com" that were not yet server-applied
    And the save completes successfully
```

**Test Data:**
- Editor A: `{ email: "editor-a@example.com", role: "can-edit", appliedEdit: "paragraph 2 updated" }`
- Editor B: `{ email: "editor-b@example.com", role: "can-edit", pendingEdit: "paragraph 3 added" }`
- Document: `{ id: "doc-abc-123" }`

**Preconditions:**
- Both editors have the document open concurrently
- The CRDT server is active and editor-b has an unacknowledged in-flight operation

---

### T-5.1: Version name exceeding 100 characters is rejected with validation error
**Maps to:** AC-5
**Category:** boundary

```gherkin
  Scenario: Editor enters a version name longer than 100 characters
    Given an authenticated editor has document "doc-abc-123" open
    And the editor clicks "Save version"
    When the editor enters a version name of 101 characters: "A" repeated 101 times
    And the editor clicks "Confirm"
    Then the version is NOT saved
    And the UI displays the error: "Version name must be 100 characters or fewer."
    And the name input remains focused for correction
```

**Test Data:**
- Version name (101 chars): `"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"` (101 A's)

**Preconditions:**
- User is authenticated with can-edit permission

---

### T-5.2: Version name of exactly 100 characters is accepted
**Maps to:** AC-5
**Category:** boundary

```gherkin
  Scenario: Editor enters a version name of exactly 100 characters
    Given an authenticated editor has document "doc-abc-123" open
    And the editor clicks "Save version"
    When the editor enters a version name of exactly 100 characters: "B" repeated 100 times
    And the editor clicks "Confirm"
    Then the version is saved successfully
    And no validation error is displayed
```

**Test Data:**
- Version name (100 chars): `"BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"` (100 B's)

**Preconditions:**
- User is authenticated with can-edit permission

---

### T-6.1: Named versions older than 30 days are not pruned by the auto-prune job
**Maps to:** AC-6
**Category:** boundary

```gherkin
  Scenario: Auto-prune job skips named versions older than 30 days
    Given document "doc-abc-123" has a named version "Old Baseline" created 31 days ago
    And the auto-pruning job (VER-01) is configured to prune unnamed snapshots older than 30 days
    When the auto-pruning job executes for document "doc-abc-123"
    Then the named version "Old Baseline" is NOT in the pruning candidate list
    And the named version "Old Baseline" remains in the version history after the job completes
```

**Test Data:**
- Named version: `{ name: "Old Baseline", documentId: "doc-abc-123", createdAt: "2026-05-15T00:00:00Z", type: "named" }`
- Auto-prune job config: `{ pruneAfterDays: 30, targetType: "auto-snapshot" }`

**Preconditions:**
- Named version created 31 days before test execution
- Auto-prune job is schedulable in test environment

---

### T-7.1: Duplicate version names are permitted and both versions are stored
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: Editor saves two versions with the same name
    Given an authenticated editor "editor@example.com" has saved a version named "Release Candidate" for document "doc-abc-123" at timestamp T1
    When the editor later saves another version named "Release Candidate" for the same document at timestamp T2 (T2 > T1)
    Then both versions exist in the version history
    And both versions are accessible
    And no error or warning is shown for the duplicate name
    And the two versions are distinguishable by their timestamps T1 and T2
```

**Test Data:**
- Version 1: `{ name: "Release Candidate", documentId: "doc-abc-123", timestamp: "2026-06-15T10:00:00Z" }`
- Version 2: `{ name: "Release Candidate", documentId: "doc-abc-123", timestamp: "2026-06-15T14:00:00Z" }`

**Preconditions:**
- User is authenticated with can-edit permission
- Version 1 already exists in the system

---

### T-8.1: Save version button is hidden or disabled for Viewer role
**Maps to:** AC-8
**Category:** boundary

```gherkin
  Scenario: User with view-only permission does not see Save version button enabled
    Given an authenticated user "viewer@example.com" with role "view-only" has document "doc-abc-123" open
    When the user looks at the document toolbar
    Then the "Save version" button is either hidden from the toolbar
    Or the "Save version" button is visible but disabled
    And if disabled, hovering over it shows the tooltip: "You need edit permission to save a version."
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "view-only", status: "active" }`
- Document: `{ id: "doc-abc-123" }`

**Preconditions:**
- User is authenticated
- User has view-only (not can-edit, not can-comment) permission on the document

---

### T-8.2: Save version button is hidden or disabled for Commenter role
**Maps to:** AC-8
**Category:** boundary

```gherkin
  Scenario: User with comment-only permission does not have access to Save version
    Given an authenticated user "commenter@example.com" with role "can-comment" has document "doc-abc-123" open
    When the user looks at the document toolbar
    Then the "Save version" button is either hidden or disabled
    And if disabled, the tooltip reads: "You need edit permission to save a version."
```

**Test Data:**
- User: `{ email: "commenter@example.com", role: "can-comment", status: "active" }`

**Preconditions:**
- User is authenticated with comment-only permission

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to save named version returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated POST to named version save endpoint returns 401
    Given no valid authentication token is present in the request
    When a POST request is made to "/api/documents/doc-abc-123/versions" with body:
      | name | "Unauthorized Attempt" |
    Then the server returns HTTP 401 Unauthorized
    And the response body contains an error indicating missing or invalid authentication
    And no version is created in the database
```

**Test Data:**
- Endpoint: `POST /api/documents/doc-abc-123/versions`
- Request headers: `{ Authorization: null }`
- Request body: `{ name: "Unauthorized Attempt" }`

**Preconditions:**
- No active session or bearer token in the request

---

### T-AUTH-2.1: Authenticated user without edit permission returns 403 when saving version via API
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Viewer bypasses UI and POSTs directly to version save endpoint
    Given an authenticated user "viewer@example.com" with role "view-only" and valid session token
    And the user bypasses the UI and sends a direct POST to the version save endpoint
    When the POST request is made to "/api/documents/doc-abc-123/versions" with body:
      | name | "Bypassed Permission" |
    Then the server returns HTTP 403 Forbidden
    And the response body contains an error indicating insufficient permissions
    And no version is created in the database
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "view-only", sessionToken: "valid-token-xyz" }`
- Endpoint: `POST /api/documents/doc-abc-123/versions`
- Request body: `{ name: "Bypassed Permission" }`

**Preconditions:**
- User is authenticated with a valid session token
- User has only view-only permission on the document

---

## Negative Tests

### T-NEG-1: Server error during save version displays retry prompt
**Maps to:** AC-2 (error path), NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Server returns 500 during named version save
    Given an authenticated editor has "doc-abc-123" open and has entered version name "Final Draft"
    And the save version endpoint is configured to return 500 Internal Server Error
    When the editor clicks "Confirm"
    Then the UI displays: "Failed to save version — please try again."
    And a "Retry" button is offered
    And the document state is unchanged
    And no partial version record is persisted
```

**Test Data:**
- Simulated server error: HTTP 500
- Version name: `"Final Draft"`

**Preconditions:**
- Server fault injection configured for the version save endpoint

---

### T-NEG-2: Version name containing script tags is sanitized on display
**Maps to:** AC-2, NFR Security
**Category:** security

```gherkin
  Scenario: Editor saves a version with a name containing an XSS payload
    Given an authenticated editor has "doc-abc-123" open
    When the editor saves a version with name: "<script>alert('xss')</script>Draft"
    Then the version is saved (if within 100 char limit)
    And when the version name is displayed in the version history, no script is executed
    And the displayed name is the escaped or stripped value: "&lt;script&gt;alert('xss')&lt;/script&gt;Draft" or equivalent safe rendering
```

**Test Data:**
- Version name: `"<script>alert('xss')</script>Draft"` (35 chars, within limit)

**Preconditions:**
- User is authenticated with can-edit permission

---

---

# Test Specifications: VER-03 — Version History Browser and Restore

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | edge-case |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1 | boundary |
| AC-5 | T-5.1, T-5.2 | boundary |
| AC-6 | T-6.1 | happy-path |
| AC-7 | T-7.1 | happy-path |
| AC-8 | T-8.1 | happy-path |
| AC-9 | T-9.1 | edge-case |
| AC-10 | T-10.1 | boundary |
| AC-11 | T-11.1, T-11.2 | error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Version history panel lists all snapshots in reverse chronological order
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Version History Browser and Restore

  Scenario: Version history panel displays all versions newest-first
    Given document "doc-abc-123" has the following versions in chronological order:
      | id    | type          | name              | timestamp              | authors                       |
      | v-001 | auto-snapshot | (unnamed)         | 2026-06-14T08:00:00Z  | editor-a@example.com          |
      | v-002 | named         | Sprint 3 Baseline | 2026-06-14T10:00:00Z  | editor-b@example.com          |
      | v-003 | auto-snapshot | (unnamed)         | 2026-06-15T09:00:00Z  | editor-a@example.com          |
    And an authenticated editor "editor-a@example.com" opens the version history panel
    When the panel loads
    Then the versions are listed in reverse chronological order: v-003, v-002, v-001
    And each entry displays: timestamp, version name (or "Auto-save" for unnamed), and contributing editor display names
```

**Test Data:**
- Versions: as in table above
- User: `{ email: "editor-a@example.com", role: "can-edit" }`

**Preconditions:**
- Document has at least 3 versions of mixed types

---

### T-1.2: Auto-snapshot entries display "Auto-save" label
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Unnamed auto-snapshots display "Auto-save" in the version list
    Given document "doc-abc-123" has an unnamed auto-snapshot (v-001) and a named version "Sprint 3 Baseline" (v-002)
    When an authenticated editor opens the version history panel
    Then the unnamed auto-snapshot entry shows the label "Auto-save"
    And the named version entry shows the name "Sprint 3 Baseline"
```

**Test Data:**
- Auto-snapshot: `{ id: "v-001", name: null, type: "auto-snapshot" }`
- Named version: `{ id: "v-002", name: "Sprint 3 Baseline", type: "named" }`

**Preconditions:**
- Both version types exist for the document

---

### T-2.1: Version history paginates when document has more than 50 entries
**Maps to:** AC-2
**Category:** edge-case

```gherkin
  Scenario: Version history panel loads first 50 entries and offers load-more
    Given document "doc-abc-123" has 75 version entries total
    When an authenticated editor opens the version history panel
    Then exactly 50 entries are displayed initially (the 50 most recent)
    And a "Load more" or pagination control is visible
    When the editor clicks "Load more"
    Then the next 25 entries are appended in reverse chronological order
    And no further "Load more" control is shown (all entries loaded)
```

**Test Data:**
- Document: `{ id: "doc-abc-123", totalVersions: 75 }`
- Page size: 50

**Preconditions:**
- Document has exactly 75 version entries seeded

---

### T-3.1: Clicking a version opens a read-only preview
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: User clicks a version entry and sees a read-only preview
    Given document "doc-abc-123" has version "v-002" named "Sprint 3 Baseline" with content "Phase 1 deliverables complete"
    And an authenticated editor has the version history panel open
    When the editor clicks on version entry "v-002"
    Then a preview pane opens showing the content "Phase 1 deliverables complete"
    And the preview is clearly labeled as "Read-only preview" or equivalent
    And the preview pane displays in side-by-side or full-screen layout
```

**Test Data:**
- Version: `{ id: "v-002", name: "Sprint 3 Baseline", content: "Phase 1 deliverables complete" }`

**Preconditions:**
- Version v-002 exists for the document

---

### T-4.1: Preview is read-only — no edits accepted in preview pane
**Maps to:** AC-4
**Category:** boundary

```gherkin
  Scenario: User attempts to type in the version preview pane
    Given an authenticated editor is viewing the read-only preview of version "v-002"
    When the user clicks inside the preview content area and types "unauthorized edit"
    Then no text is inserted into the preview
    And the live document content is unchanged
    And no version or edit is created as a result of the typing attempt
```

**Test Data:**
- Attempted input: `"unauthorized edit"`
- Version: `{ id: "v-002", content: "Phase 1 deliverables complete" }`

**Preconditions:**
- Preview pane is open for version v-002

---

### T-5.1: Viewer cannot see Restore button in version preview
**Maps to:** AC-5
**Category:** boundary

```gherkin
  Scenario: View-only user sees no Restore button in version history preview
    Given an authenticated user "viewer@example.com" with role "view-only" opens the version history panel for "doc-abc-123"
    When the user clicks on version entry "v-002" to open the preview
    Then the "Restore this version" button is either hidden or disabled
    And if disabled, a tooltip reads: "You need edit permission to restore a version."
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "view-only" }`
- Version: `{ id: "v-002" }`

**Preconditions:**
- User has view-only permission on the document

---

### T-5.2: Commenter cannot see Restore button in version history panel
**Maps to:** AC-5
**Category:** boundary

```gherkin
  Scenario: Comment-only user cannot restore a version
    Given an authenticated user "commenter@example.com" with role "can-comment" opens the version history panel
    When the user clicks on version entry "v-002"
    Then the "Restore this version" button is hidden or disabled
    And if disabled, the tooltip reads: "You need edit permission to restore a version."
```

**Test Data:**
- User: `{ email: "commenter@example.com", role: "can-comment" }`

**Preconditions:**
- User has comment-only permission

---

### T-6.1: Restore creates an auto-snapshot of the current state before proceeding
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Pre-restore snapshot is created before restore operation begins
    Given document "doc-abc-123" currently contains "Current live content v9"
    And an authenticated editor "editor@example.com" initiates restore from version "v-002"
    And the editor confirms the restore in the confirmation dialog
    When the restore operation executes
    Then before any content change occurs, an auto-snapshot of "Current live content v9" is saved
    And the pre-restore snapshot is timestamped at or before the restore operation timestamp
    And the pre-restore snapshot appears in the version history
```

**Test Data:**
- Document current content: `"Current live content v9"`
- Target restore version: `{ id: "v-002", content: "Phase 1 deliverables complete" }`
- Editor: `{ email: "editor@example.com", role: "can-edit" }`

**Preconditions:**
- Editor has confirmed the restore dialog
- Document has at least one historical version

---

### T-7.1: Restore creates a new named version from the historical state
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: Restore from v-002 produces a new named version as the live document
    Given the pre-restore snapshot has been saved (per AC-6)
    And the historical version "v-002" had content "Phase 1 deliverables complete" and name "Sprint 3 Baseline"
    When the restore operation continues to completion
    Then a new named version is created with name "Restored from Sprint 3 Baseline"
    And the new named version becomes the live document
    And the live document content is "Phase 1 deliverables complete"
    And the original version "v-002" still exists in the history unchanged
    And the new restored version appears at the top of the version history
```

**Test Data:**
- Source version: `{ id: "v-002", name: "Sprint 3 Baseline", content: "Phase 1 deliverables complete" }`
- Expected new version name: `"Restored from Sprint 3 Baseline"`

**Preconditions:**
- Pre-restore snapshot successfully created

---

### T-8.1: All connected editors receive restored state within 500ms
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: Connected editors converge to restored state without page reload
    Given editors "editor-a@example.com" and "editor-b@example.com" have document "doc-abc-123" open
    And "editor-a@example.com" initiates and confirms a restore from version "v-002"
    When the restore operation completes
    Then "editor-b@example.com" receives the restored document state as a CRDT update
    And "editor-b@example.com" sees the restored content within 500 milliseconds
    And neither editor needs to reload the page
    And both editors see identical document content after convergence
```

**Test Data:**
- Editor A: `{ email: "editor-a@example.com", role: "can-edit" }` (initiates restore)
- Editor B: `{ email: "editor-b@example.com", role: "can-edit" }` (passive, connected)
- Restored content: `"Phase 1 deliverables complete"`

**Preconditions:**
- Both editors have the document open with active WebSocket/CRDT connections

---

### T-9.1: Offline editor receives restored state upon reconnection
**Maps to:** AC-9
**Category:** edge-case

```gherkin
  Scenario: Offline editor receives restore merge on reconnect
    Given "editor-offline@example.com" was editing document "doc-abc-123" offline with queued edit "added paragraph 5"
    And while "editor-offline@example.com" was offline, "editor-online@example.com" restored version "v-002" (content: "Phase 1 complete")
    When "editor-offline@example.com" reconnects
    Then the OFFL-02 merge process runs
    And the restored content "Phase 1 complete" is present as the server document base
    And the offline editor's queued edit "added paragraph 5" is merged against the restored state
    And the final document reflects the restoration plus the offline edits
    And no data loss of the offline edits occurs
```

**Test Data:**
- Offline user: `{ email: "editor-offline@example.com", queuedEdit: "added paragraph 5" }`
- Restore initiator: `{ email: "editor-online@example.com", role: "can-edit" }`
- Restored content: `"Phase 1 complete"`

**Preconditions:**
- Offline editor has pending operations in local queue
- Restore was completed while the editor was offline

---

### T-10.1: Version history is unchanged after restore — all original entries preserved
**Maps to:** AC-10
**Category:** boundary

```gherkin
  Scenario: Version history retains all original entries after a restore
    Given document "doc-abc-123" has versions: v-001 (auto), v-002 ("Sprint 3 Baseline"), v-003 (auto)
    And an editor restores from version "v-002"
    When the editor opens the version history panel after the restore
    Then v-001, v-002, and v-003 are all still present at their original timestamps
    And two new entries appear at the top: the pre-restore auto-snapshot and "Restored from Sprint 3 Baseline"
    And the total version count increased by exactly 2
    And no existing version entry is deleted, renamed, or modified
```

**Test Data:**
- Pre-restore versions: `[v-001, v-002, v-003]`
- Post-restore expected additions: `[pre-restore-snapshot, restored-named-version]`

**Preconditions:**
- Document had 3 known version entries before restore

---

### T-11.1: Restore confirmation dialog is shown before executing restore
**Maps to:** AC-11
**Category:** error-handling

```gherkin
  Scenario: Editor clicks Restore and sees confirmation dialog before any changes
    Given an authenticated editor "editor@example.com" is previewing version "v-002"
    When the editor clicks "Restore this version"
    Then a confirmation dialog appears with the exact message:
      "Restoring this version will replace the current document with a saved snapshot. A backup of the current state will be saved. Restore anyway?"
    And the dialog has "Restore" and "Cancel" buttons
    And no restore operation has been initiated yet (document unchanged)
```

**Test Data:**
- User: `{ email: "editor@example.com", role: "can-edit" }`
- Version: `{ id: "v-002", name: "Sprint 3 Baseline" }`

**Preconditions:**
- User is viewing the preview of version v-002

---

### T-11.2: Cancel in confirmation dialog aborts the restore
**Maps to:** AC-11
**Category:** error-handling

```gherkin
  Scenario: Editor clicks Cancel in restore confirmation dialog
    Given the restore confirmation dialog is open for version "v-002"
    When the editor clicks "Cancel"
    Then the dialog closes
    And the live document content is unchanged
    And no pre-restore snapshot is created
    And no restore version is created
```

**Test Data:**
- Document current content: `"Current live content v9"` (must remain unchanged)

**Preconditions:**
- Restore confirmation dialog is open

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to version history or restore endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated request to version history list returns 401
    Given no valid authentication token is present
    When a GET request is made to "/api/documents/doc-abc-123/versions"
    Then the server returns HTTP 401 Unauthorized
    And no version data is returned in the response body

  Scenario: Unauthenticated request to restore endpoint returns 401
    Given no valid authentication token is present
    When a POST request is made to "/api/documents/doc-abc-123/versions/v-002/restore"
    Then the server returns HTTP 401 Unauthorized
    And no restore operation is performed
```

**Test Data:**
- Version list endpoint: `GET /api/documents/doc-abc-123/versions`
- Restore endpoint: `POST /api/documents/doc-abc-123/versions/v-002/restore`
- Auth header: `null`

**Preconditions:**
- No active session or bearer token

---

### T-AUTH-2.1: User without document access cannot read version history
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated user with no document access gets 403 on version history
    Given an authenticated user "outsider@example.com" with no permissions on "doc-abc-123"
    When the user sends a GET request to "/api/documents/doc-abc-123/versions" with a valid auth token
    Then the server returns HTTP 403 Forbidden
    And no version data is returned
```

**Test Data:**
- User: `{ email: "outsider@example.com", role: "none", documentId: "doc-abc-123" }`

**Preconditions:**
- User has a valid session but no role on the document

---

### T-AUTH-2.2: View-only user cannot restore via API even with direct endpoint call
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: View-only user bypasses UI and POSTs to restore endpoint
    Given an authenticated user "viewer@example.com" with role "view-only" on "doc-abc-123"
    When the user sends a POST directly to "/api/documents/doc-abc-123/versions/v-002/restore" with valid auth token
    Then the server returns HTTP 403 Forbidden
    And no restore operation is performed
    And the document state is unchanged
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "view-only", sessionToken: "valid-token-abc" }`
- Endpoint: `POST /api/documents/doc-abc-123/versions/v-002/restore`

**Preconditions:**
- User is authenticated with a valid session token
- User has only view-only permission

---

## Negative Tests

### T-NEG-1: Pre-restore snapshot failure aborts the restore
**Maps to:** AC-6, NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Server fails to save pre-restore snapshot — restore is aborted
    Given an editor "editor@example.com" confirms restore of version "v-002"
    And the server is configured to fail the auto-snapshot creation step with a 500 error
    When the restore operation begins
    Then the restore is aborted before any content change is applied
    And the user sees: "Could not save backup of current state. Restore cancelled to protect your document."
    And the live document content is unchanged
    And no "Restored from..." version is created
```

**Test Data:**
- Fault injection: pre-restore snapshot endpoint returns 500

**Preconditions:**
- Restore confirmation was accepted
- Snapshot endpoint is configured to fail

---

### T-NEG-2: Restore fails mid-write — document rolled back using pre-restore snapshot
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Restore fails after pre-restore snapshot is saved
    Given an editor "editor@example.com" confirms restore of version "v-002"
    And the pre-restore snapshot is successfully saved
    And the restore write operation fails with a 500 error
    When the restore operation fails
    Then the document is rolled back to the state captured in the pre-restore snapshot
    And the user sees: "Restore failed — your document has been preserved as it was before the restore attempt."
    And the live document content is identical to the pre-restore state
```

**Test Data:**
- Fault injection: restore write endpoint returns 500 after snapshot creation

**Preconditions:**
- Pre-restore snapshot was successfully created before the fault was injected

---

### T-NEG-3: Empty version history shows helpful message
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: User opens version history panel on a document with no versions
    Given document "doc-new-456" has no version entries
    When an authenticated editor opens the version history panel
    Then the panel shows the message: "No version history yet. Edits are automatically saved every 5 minutes of activity."
    And no version entries are listed
```

**Test Data:**
- Document: `{ id: "doc-new-456", totalVersions: 0 }`

**Preconditions:**
- Document exists but has never had an auto-snapshot or named version created

---

---

# Test Specifications: COMM-01 — Inline Comments on Text Selections

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1 | edge-case |
| AC-6 | T-6.1 | edge-case |
| AC-7 | T-7.1 | error-handling |
| AC-8 | T-8.1 | edge-case |
| AC-9 | T-9.1, T-9.2 | error-handling |
| AC-10 | T-10.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Comment button appears when editor selects text
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Inline Comments on Text Selections

  Scenario: Comment bubble appears when authenticated editor selects text
    Given an authenticated user "editor@example.com" with role "can-edit" has document "doc-abc-123" open
    And the document body contains the paragraph: "This is the first section of the document."
    When the user selects the text "first section"
    Then a comment button or bubble appears adjacent to the selection (in right margin or floating toolbar)
    And the comment button is visible and clickable
```

**Test Data:**
- User: `{ email: "editor@example.com", role: "can-edit" }`
- Document: `{ id: "doc-abc-123", content: "This is the first section of the document." }`
- Selected text: `"first section"` (characters 12–24)

**Preconditions:**
- User is authenticated with a valid session
- Document is open in the editor

---

### T-1.2: Comment button appears when commenter selects text
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Comment bubble appears for can-comment role on text selection
    Given an authenticated user "commenter@example.com" with role "can-comment" has document "doc-abc-123" open
    When the user selects the text "first section"
    Then a comment button or bubble appears adjacent to the selection
```

**Test Data:**
- User: `{ email: "commenter@example.com", role: "can-comment" }`

**Preconditions:**
- User is authenticated with comment-or-above permission

---

### T-2.1: Comment dialog opens with correct controls
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Clicking the comment button opens a comment dialog with required controls
    Given a comment button is visible after "editor@example.com" selected "first section"
    When the user clicks the comment button
    Then a comment dialog opens
    And the dialog contains a plain text input field
    And the dialog contains a "Submit" button
    And the dialog contains a "Cancel" button
    And focus is placed in the text input field
```

**Test Data:**
- User: `{ email: "editor@example.com", role: "can-edit" }`

**Preconditions:**
- Comment button is visible from AC-1 scenario

---

### T-3.1: Comment is submitted and anchored to selection
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Editor submits a comment and it appears anchored to the selected text
    Given "editor@example.com" has the comment dialog open for selection "first section" in "doc-abc-123"
    When the editor types "Should this be 'introduction' instead?" and clicks "Submit"
    Then the comment is saved successfully (server confirmation within 500ms)
    And the text "first section" receives a visual highlight (e.g., yellow underline)
    And the comment sidebar/panel shows the new thread with:
      | Field             | Value                                          |
      | Author            | Display name of editor@example.com             |
      | Timestamp         | Relative time (e.g., "just now")               |
      | Comment text      | "Should this be 'introduction' instead?"       |
    And the comment dialog closes
    And the comment is associated with the CRDT character range of "first section"
```

**Test Data:**
- User: `{ email: "editor@example.com", displayName: "Alex Editor" }`
- Selected text: `"first section"`, CRDT range: `[12, 25]`
- Comment text: `"Should this be 'introduction' instead?"`

**Preconditions:**
- User has can-comment or can-edit permission
- Comment dialog is open

---

### T-3.2: Comment sidebar shows thread for new comment
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Comment thread is visible in sidebar after submission
    Given a comment "Should this be 'introduction' instead?" was submitted by "editor@example.com" on "doc-abc-123"
    When any user with view-or-above permission opens the document
    Then the comment sidebar displays the thread
    And the highlighted text "first section" is visible in the document body
    And clicking the highlight focuses the corresponding thread in the sidebar
```

**Test Data:**
- Comment: `{ id: "comment-001", text: "Should this be 'introduction' instead?", authorId: "user-001" }`

**Preconditions:**
- Comment was previously submitted via T-3.1

---

### T-4.1: Comment thread is visible to all users with view-or-above permission
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Viewer can see comment highlights and threads without submitting
    Given comment "comment-001" exists on document "doc-abc-123" anchored to "first section"
    And an authenticated user "viewer@example.com" with role "view-only" opens the document
    When the document loads
    Then the text "first section" shows a comment highlight
    And the comment thread for "comment-001" is visible in the sidebar
    And the thread shows the author display name and comment text
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "view-only" }`
- Comment: `{ id: "comment-001", authorDisplayName: "Alex Editor", text: "Should this be 'introduction' instead?" }`

**Preconditions:**
- Comment exists on the document
- User has view-only permission

---

### T-5.1: Comment anchor shifts correctly when text is inserted before it
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: Comment anchor drifts when another user inserts text before the anchored range
    Given comment "comment-001" is anchored to the CRDT range for "first section" at positions [12, 25]
    And "editor-b@example.com" inserts the text "important " before position 12 (before "first")
    When "editor-a@example.com" views the document after the insertion
    Then the comment highlight is on "first section" (now at positions [22, 35] due to insertion)
    And the comment thread is still correctly associated with the same text "first section"
    And no orphaned or misplaced highlight exists
```

**Test Data:**
- Comment anchor (before insertion): CRDT range `[12, 25]`
- Inserted text: `"important "` (10 chars) at position 12
- Expected new anchor: `[22, 35]`
- Editor B: `{ email: "editor-b@example.com", role: "can-edit" }`

**Preconditions:**
- Comment exists with a defined CRDT anchor
- CRDT framework is active

---

### T-6.1: Multiple overlapping comments are rendered distinctly
**Maps to:** AC-6
**Category:** edge-case

```gherkin
  Scenario: Two comments on overlapping text ranges are both visible
    Given "doc-abc-123" has two comments:
      | Comment ID  | Text          | Anchor range |
      | comment-001 | "Overlapping A" | [10, 20]   |
      | comment-002 | "Overlapping B" | [15, 25]   |
    And the ranges overlap between positions [15, 20]
    When a user with view-or-above permission opens the document
    Then both comment highlights are visible on the overlapping region
    And both threads are independently accessible in the sidebar
    And clicking comment-001's highlight focuses thread comment-001
    And clicking comment-002's highlight focuses thread comment-002
```

**Test Data:**
- Comment 1: `{ id: "comment-001", anchorStart: 10, anchorEnd: 20 }`
- Comment 2: `{ id: "comment-002", anchorStart: 15, anchorEnd: 25 }`

**Preconditions:**
- Both comments exist on the document with overlapping ranges

---

### T-7.1: Empty comment submission is rejected with inline error
**Maps to:** AC-7
**Category:** error-handling

```gherkin
  Scenario: User submits a comment dialog with an empty input
    Given "editor@example.com" has the comment dialog open for a text selection
    When the user clicks "Submit" without entering any text (input is empty)
    Then the comment is NOT saved
    And the dialog remains open
    And the UI displays the inline validation message: "Comment cannot be empty"

  Scenario: User submits a comment with whitespace-only input
    Given "editor@example.com" has the comment dialog open for a text selection
    When the user enters "   " (three spaces) and clicks "Submit"
    Then the comment is NOT saved
    And the UI displays the inline validation message: "Comment cannot be empty"
```

**Test Data:**
- Input case 1: `""` (empty string)
- Input case 2: `"   "` (3 spaces)

**Preconditions:**
- Comment dialog is open with a text selection

---

### T-8.1: Offline comment is queued, shown optimistically, and synced on reconnect
**Maps to:** AC-8
**Category:** edge-case

```gherkin
  Scenario: User submits a comment while offline
    Given "editor@example.com" with role "can-comment" has document "doc-abc-123" open
    And the user's network connection is offline
    When the user selects "first section" and submits comment "offline comment text"
    Then the comment is stored locally
    And the comment appears optimistically in the sidebar with a "Pending sync" indicator
    And the highlighted anchor is visible in the document
    When the user's network reconnects
    Then the comment is synced to the server
    And the "Pending sync" indicator is removed
    And the comment is visible to other users
```

**Test Data:**
- User: `{ email: "editor@example.com", role: "can-edit" }`
- Comment text: `"offline comment text"`
- Network state: offline → reconnected

**Preconditions:**
- Network is offline when comment is submitted
- Local storage/queue is available

---

### T-9.1: Viewer sees no comment button on text selection
**Maps to:** AC-9
**Category:** error-handling

```gherkin
  Scenario: User with view-only permission selects text and sees no comment button
    Given "viewer@example.com" with role "view-only" has document "doc-abc-123" open
    When the user selects the text "first section"
    Then no comment button or bubble appears adjacent to the selection
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "view-only" }`
- Selected text: `"first section"`

**Preconditions:**
- User is authenticated with view-only permission

---

### T-9.2: Viewer's direct API call to create comment returns 403
**Maps to:** AC-9
**Category:** error-handling

```gherkin
  Scenario: Viewer bypasses UI and POSTs to comment creation endpoint
    Given "viewer@example.com" with role "view-only" has a valid session token
    When the user sends a POST request directly to "/api/documents/doc-abc-123/comments" with:
      | Field  | Value                    |
      | text   | "bypassed UI comment"    |
      | anchor | { start: 12, end: 25 }  |
    Then the server returns HTTP 403 Forbidden
    And the response body reads "You have view-only access to this document" or equivalent
    And no comment is created
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "view-only", sessionToken: "valid-token-xyz" }`
- Request body: `{ text: "bypassed UI comment", anchor: { start: 12, end: 25 } }`

**Preconditions:**
- User is authenticated with valid token but view-only permission

---

### T-10.1: Cancel discards in-progress comment and removes selection highlight
**Maps to:** AC-10
**Category:** edge-case

```gherkin
  Scenario: User cancels comment dialog with text entered
    Given "editor@example.com" has the comment dialog open for selection "first section"
    And the user has typed "work in progress note" in the comment input
    When the user clicks "Cancel"
    Then the dialog closes
    And no comment is saved
    And the text "first section" no longer has a provisional selection highlight

  Scenario: User presses Escape to cancel the comment dialog
    Given "editor@example.com" has the comment dialog open with "work in progress note" typed
    When the user presses the Escape key
    Then the dialog closes
    And no comment is saved
    And the provisional selection highlight is removed
```

**Test Data:**
- In-progress text: `"work in progress note"`
- Selected text: `"first section"`

**Preconditions:**
- Comment dialog is open with text entered

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to comment creation endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: No auth token — POST to comment endpoint returns 401
    Given no valid authentication token is present
    When a POST request is made to "/api/documents/doc-abc-123/comments" with body:
      | Field  | Value              |
      | text   | "anonymous comment" |
      | anchor | { start: 5, end: 15 } |
    Then the server returns HTTP 401 Unauthorized
    And no comment is created
```

**Test Data:**
- Endpoint: `POST /api/documents/doc-abc-123/comments`
- Auth header: `null`
- Body: `{ text: "anonymous comment", anchor: { start: 5, end: 15 } }`

**Preconditions:**
- No session or bearer token in the request

---

### T-AUTH-2.1: View-only user POST to comment endpoint returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated view-only user POSTs to comment creation endpoint
    Given "viewer@example.com" with role "view-only" and a valid session token
    When a POST request is made to "/api/documents/doc-abc-123/comments" with body:
      | Field  | Value            |
      | text   | "view only post"  |
      | anchor | { start: 5, end: 15 } |
    Then the server returns HTTP 403 Forbidden
    And the response body indicates: "requires can-comment or can-edit"
    And no comment is created
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "view-only", sessionToken: "valid-token-abc" }`
- Body: `{ text: "view only post", anchor: { start: 5, end: 15 } }`

**Preconditions:**
- User is authenticated with valid session but view-only permission

---

## Negative Tests

### T-NEG-1: Server error on comment submit shows retry option
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Server returns 500 when comment is submitted
    Given "editor@example.com" has typed "important feedback" in the comment dialog
    And the comment creation endpoint is configured to return HTTP 500
    When the user clicks "Submit"
    Then the UI displays: "Failed to save comment. Please try again."
    And a "Retry" button is shown
    And no comment thread appears in the sidebar
```

**Test Data:**
- Fault injection: `POST /api/documents/doc-abc-123/comments` → HTTP 500

---

### T-NEG-2: Comment text exceeding 2,000 characters is rejected
**Maps to:** NFR Error Handling
**Category:** boundary

```gherkin
  Scenario: User enters a comment exceeding 2000 characters
    Given "editor@example.com" has the comment dialog open
    When the user enters a comment of 2,001 characters (2000 'A's + 1 'B')
    And clicks "Submit"
    Then the submission is blocked
    And the UI displays: "Comments cannot exceed 2,000 characters"
    And no comment is created
```

**Test Data:**
- Comment text: `"A" * 2000 + "B"` (2001 chars)

---

### T-NEG-3: Deleted anchor text shows comment as unavailable without crashing
**Maps to:** NFR Error Handling (CRDT anchor failure)
**Category:** error-handling

```gherkin
  Scenario: Comment anchor text was deleted by another editor
    Given comment "comment-001" was anchored to "first section" (CRDT range [12, 25])
    And another editor deleted that entire text range
    When any user views the document
    Then no highlight appears for "comment-001" (the range no longer exists)
    And the comment thread in the sidebar shows: "Anchor unavailable — original text was deleted"
    And the comment text and author are still displayed in the sidebar entry
    And no runtime error or crash occurs
```

**Test Data:**
- Comment: `{ id: "comment-001", anchorRange: [12, 25], anchorDeleted: true }`

---

---

# Test Specifications: COMM-02 — Comment Replies and Resolution

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1 | edge-case |
| AC-7 | T-7.1, T-7.2 | error-handling |
| AC-8 | T-8.1 | error-handling |
| AC-9 | T-9.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Commenter replies to an existing thread
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Comment Replies and Resolution

  Scenario: Can-comment user replies to a comment thread
    Given document "doc-abc-123" has an open comment thread "comment-001" with root comment "What does 'first section' mean?"
    And the thread was authored by "editor-a@example.com"
    And "commenter@example.com" with role "can-comment" has the document open
    When "commenter@example.com" clicks "Reply" on thread "comment-001"
    And types "I think it refers to the introduction." and clicks "Submit"
    Then the reply is appended to thread "comment-001" in chronological order
    And the reply shows the display name of "commenter@example.com"
    And the reply shows a relative timestamp (e.g., "just now")
    And the reply is visible to all users with view-or-above permission
```

**Test Data:**
- Replying user: `{ email: "commenter@example.com", role: "can-comment", displayName: "Sam Commenter" }`
- Thread: `{ id: "comment-001", rootText: "What does 'first section' mean?" }`
- Reply text: `"I think it refers to the introduction."`

**Preconditions:**
- Thread "comment-001" is open on the document
- User has can-comment permission

---

### T-1.2: Editor replies to a comment thread
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Can-edit user replies to a comment thread
    Given document "doc-abc-123" has open thread "comment-001"
    And "editor@example.com" with role "can-edit" views the thread
    When the editor types "Good catch — I'll clarify." and clicks "Submit"
    Then the reply is appended to the thread
    And the reply shows "editor@example.com"'s display name
```

**Test Data:**
- Replying user: `{ email: "editor@example.com", role: "can-edit", displayName: "Alex Editor" }`
- Reply text: `"Good catch — I'll clarify."`

**Preconditions:**
- Thread "comment-001" is open on the document

---

### T-2.1: Viewer can read all thread content but cannot reply
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: View-only user sees thread content but has no Reply input
    Given document "doc-abc-123" has thread "comment-001" with 3 replies
    And "viewer@example.com" with role "view-only" opens the document
    When the viewer looks at the comment thread in the sidebar
    Then all 3 replies are readable (text, authors, timestamps visible)
    And no "Reply" input field or "Reply" button is available for thread "comment-001"
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "view-only" }`
- Thread: `{ id: "comment-001", replies: [{ text: "Reply 1" }, { text: "Reply 2" }, { text: "Reply 3" }] }`

**Preconditions:**
- Thread has at least 3 replies
- User has view-only permission

---

### T-3.1: Editor resolves a comment thread — thread is archived and highlight removed
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Editor resolves an open comment thread
    Given document "doc-abc-123" has open thread "comment-001" anchored to "first section" (highlighted)
    And "editor@example.com" with role "can-edit" views the thread
    When the editor clicks "Resolve" on thread "comment-001"
    Then the thread is marked as resolved with "editor@example.com"'s display name and the resolution timestamp
    And the in-document highlight on "first section" is removed
    And the thread is no longer visible in the active comments sidebar
    And the document body shows no highlight on "first section"
```

**Test Data:**
- Resolver: `{ email: "editor@example.com", role: "can-edit", displayName: "Alex Editor" }`
- Thread: `{ id: "comment-001", status: "open", anchorText: "first section" }`

**Preconditions:**
- Thread is open and has an active anchor highlight
- User has can-edit permission

---

### T-3.2: After resolution, thread is not visible in active sidebar by default
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Resolved thread is hidden from active sidebar unless Show resolved toggle is on
    Given thread "comment-001" has been resolved by "editor@example.com"
    When any user views the document without enabling "Show resolved"
    Then thread "comment-001" does not appear in the active sidebar
    And no highlight appears on the formerly anchored text
```

**Test Data:**
- Thread: `{ id: "comment-001", status: "resolved" }`

**Preconditions:**
- Thread was resolved in T-3.1

---

### T-4.1: Original comment author can resolve their own thread regardless of role
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: Commenter who authored the root comment resolves their own thread
    Given "commenter@example.com" with role "can-comment" authored the root comment of thread "comment-002"
    And "commenter@example.com" is NOT the author of the document
    When "commenter@example.com" clicks "Resolve" on thread "comment-002"
    Then the same resolution behavior as AC-3 occurs:
      - Thread is marked resolved with "commenter@example.com"'s display name and timestamp
      - In-document anchor highlight is removed
      - Thread moves out of active sidebar view
```

**Test Data:**
- Author: `{ email: "commenter@example.com", role: "can-comment" }`
- Thread: `{ id: "comment-002", rootAuthorId: "commenter@example.com", status: "open" }`

**Preconditions:**
- "commenter@example.com" is the root comment author (not editor-level)

---

### T-5.1: Show resolved toggle displays all resolved threads
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: User enables Show resolved toggle and sees archived threads
    Given document "doc-abc-123" has two resolved threads: "comment-001" (resolved by "editor@example.com") and "comment-002" (resolved by "commenter@example.com")
    And a user with any permission level views the comment sidebar
    When the user activates the "Show resolved" toggle
    Then both resolved threads "comment-001" and "comment-002" are displayed
    And each shows: full conversation thread, resolver display name, and resolution timestamp
```

**Test Data:**
- Resolved thread 1: `{ id: "comment-001", resolvedBy: "Alex Editor", resolvedAt: "2026-06-15T10:00:00Z" }`
- Resolved thread 2: `{ id: "comment-002", resolvedBy: "Sam Commenter", resolvedAt: "2026-06-15T11:00:00Z" }`

**Preconditions:**
- Both threads are resolved
- "Show resolved" toggle defaults to off

---

### T-6.1: Resolved threads are read-only and immutable
**Maps to:** AC-6
**Category:** edge-case

```gherkin
  Scenario: User views a resolved thread via Show resolved toggle
    Given thread "comment-001" is resolved and visible via the "Show resolved" toggle
    When any user views the resolved thread
    Then no "Reply" input is available on the resolved thread
    And no "Re-open" button is present
    And all thread content (root comment + replies) is visible and unchanged
    And the thread content cannot be deleted
```

**Test Data:**
- Thread: `{ id: "comment-001", status: "resolved", replies: [{ text: "Reply 1" }, { text: "Reply 2" }] }`

**Preconditions:**
- Thread is resolved and visible via "Show resolved" toggle

---

### T-7.1: Non-author commenter cannot resolve another user's thread via UI
**Maps to:** AC-7
**Category:** error-handling

```gherkin
  Scenario: Commenter who is not the root author sees no Resolve button on another's thread
    Given thread "comment-003" was authored by "editor@example.com"
    And "other-commenter@example.com" with role "can-comment" (not the thread author) views the thread
    When "other-commenter@example.com" inspects thread "comment-003" in the sidebar
    Then no "Resolve" button is visible to "other-commenter@example.com"
```

**Test Data:**
- Thread author: `{ email: "editor@example.com" }`
- Viewer: `{ email: "other-commenter@example.com", role: "can-comment" }`
- Thread: `{ id: "comment-003", rootAuthorId: "editor@example.com" }`

**Preconditions:**
- "other-commenter@example.com" is NOT the root comment author and does NOT have can-edit permission

---

### T-7.2: Non-author commenter attempting resolve via API returns 403
**Maps to:** AC-7
**Category:** error-handling

```gherkin
  Scenario: Non-author commenter bypasses UI and POSTs resolve via API
    Given "other-commenter@example.com" with role "can-comment" has a valid session token
    And thread "comment-003" was authored by "editor@example.com"
    When "other-commenter@example.com" sends a POST to "/api/documents/doc-abc-123/comments/comment-003/resolve"
    Then the server returns HTTP 403 Forbidden
    And the thread status remains "open"
```

**Test Data:**
- API caller: `{ email: "other-commenter@example.com", role: "can-comment", sessionToken: "valid-token-xyz" }`
- Endpoint: `POST /api/documents/doc-abc-123/comments/comment-003/resolve`

**Preconditions:**
- User has a valid auth token but is not the thread author and lacks can-edit

---

### T-8.1: Empty reply submission is blocked with inline error
**Maps to:** AC-8
**Category:** error-handling

```gherkin
  Scenario: User submits empty reply in an open thread
    Given "commenter@example.com" has clicked "Reply" on thread "comment-001" and the reply input is open
    When the user clicks "Submit" with the reply input empty
    Then the reply is NOT submitted
    And the UI shows inline validation message: "Reply cannot be empty"

  Scenario: User submits whitespace-only reply
    Given "commenter@example.com" has clicked "Reply" on thread "comment-001"
    When the user enters "   " and clicks "Submit"
    Then the reply is NOT submitted
    And the UI shows: "Reply cannot be empty"
```

**Test Data:**
- Input case 1: `""` (empty)
- Input case 2: `"   "` (whitespace only)
- Thread: `{ id: "comment-001", status: "open" }`

**Preconditions:**
- Reply input is open on an active thread

---

### T-9.1: Thread anchored to deleted text can still be resolved
**Maps to:** AC-9
**Category:** edge-case

```gherkin
  Scenario: Resolve a thread whose anchor text was deleted
    Given thread "comment-004" was anchored to text "deleted paragraph" at CRDT range [50, 67]
    And the text at range [50, 67] was subsequently deleted by an editor
    And the thread shows "Anchor unavailable — original text was deleted" in the sidebar
    When an authorized user (can-edit or root author) clicks "Resolve" on thread "comment-004"
    Then the resolution succeeds
    And the thread is marked as resolved
    And no error is thrown due to the missing anchor
```

**Test Data:**
- Thread: `{ id: "comment-004", anchorRange: [50, 67], anchorExists: false }`
- Resolver: `{ email: "editor@example.com", role: "can-edit" }`

**Preconditions:**
- The anchor text has been deleted
- Thread is still visible in the sidebar with anchor-unavailable state

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated requests to reply or resolve endpoints return 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated POST to reply endpoint returns 401
    Given no valid authentication token is present
    When a POST request is made to "/api/documents/doc-abc-123/comments/comment-001/replies" with body:
      | Field | Value              |
      | text  | "anonymous reply"  |
    Then the server returns HTTP 401 Unauthorized
    And no reply is created

  Scenario: Unauthenticated POST to resolve endpoint returns 401
    Given no valid authentication token is present
    When a POST request is made to "/api/documents/doc-abc-123/comments/comment-001/resolve"
    Then the server returns HTTP 401 Unauthorized
    And the thread status remains unchanged
```

**Test Data:**
- Reply endpoint: `POST /api/documents/doc-abc-123/comments/comment-001/replies`
- Resolve endpoint: `POST /api/documents/doc-abc-123/comments/comment-001/resolve`
- Auth header: `null`

**Preconditions:**
- No session or bearer token in request

---

### T-AUTH-2.1: View-only user POST to reply endpoint returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated view-only user attempts to reply via API
    Given "viewer@example.com" with role "view-only" has a valid session token
    When a POST request is made to "/api/documents/doc-abc-123/comments/comment-001/replies" with:
      | Field | Value              |
      | text  | "unauthorized reply" |
    Then the server returns HTTP 403 Forbidden
    And the response body includes a message indicating "requires can-comment or can-edit"
    And no reply is created
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "view-only", sessionToken: "valid-token-abc" }`
- Body: `{ text: "unauthorized reply" }`

**Preconditions:**
- User has a valid auth token but view-only permission only

---

## Negative Tests

### T-NEG-1: Server error on reply submit shows retry option
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Server returns 500 when reply is submitted
    Given "editor@example.com" has typed "This is an important reply." in the reply input for thread "comment-001"
    And the reply endpoint is configured to return HTTP 500
    When the user clicks "Submit"
    Then the UI displays: "Failed to save reply. Please try again."
    And a "Retry" button is shown
    And the reply does not appear in the thread
```

**Test Data:**
- Fault injection: `POST /api/documents/doc-abc-123/comments/comment-001/replies` → HTTP 500

---

### T-NEG-2: Server error on resolve — thread remains open with retry message
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Server returns 500 when resolve is submitted
    Given "editor@example.com" clicks "Resolve" on thread "comment-001"
    And the resolve endpoint is configured to return HTTP 500
    When the resolve is attempted
    Then the UI displays: "Failed to resolve thread. Please try again."
    And the thread status remains "open"
    And the in-document anchor highlight is unchanged
```

**Test Data:**
- Fault injection: `POST /api/documents/doc-abc-123/comments/comment-001/resolve` → HTTP 500

---

### T-NEG-3: Concurrent resolution by two users results in single resolved state
**Maps to:** NFR Error Handling
**Category:** edge-case

```gherkin
  Scenario: Two editors simultaneously click Resolve on the same thread
    Given thread "comment-001" is open on document "doc-abc-123"
    And "editor-a@example.com" and "editor-b@example.com" both click "Resolve" within 100ms of each other
    When both resolve requests reach the server
    Then the thread is resolved exactly once (last-writer-wins)
    And no duplicate resolution records exist
    And both editors see the thread in a resolved state
    And no error or conflict is displayed to either editor
```

**Test Data:**
- Editor A: `{ email: "editor-a@example.com", role: "can-edit" }`
- Editor B: `{ email: "editor-b@example.com", role: "can-edit" }`
- Thread: `{ id: "comment-001", status: "open" }`

**Preconditions:**
- Both editors have the document open concurrently
- Race condition simulated within 100ms window


# Test Specifications: COMM-03 — Suggestion Mode (Track-Changes Submission)

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path, boundary |
| AC-3 | T-3.1, T-3.2 | happy-path, boundary |
| AC-4 | T-4.1, T-4.2 | happy-path, edge-case |
| AC-5 | T-5.1, T-5.2 | happy-path, edge-case |
| AC-6 | T-6.1, T-6.2 | edge-case |
| AC-7 | T-7.1, T-7.2 | edge-case, error-handling |
| AC-8 | T-8.1, T-8.2 | boundary |
| AC-9 | T-9.1 | edge-case |
| AC-10 | T-10.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Suggestion mode toggle activates visual indicator for editor
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Suggestion Mode Toggle

  Scenario: Editor activates suggestion mode via toolbar toggle
    Given an authenticated user with can-edit permission is viewing document "doc-abc123"
    And the user is logged in as { id: "user-101", displayName: "Alice Editor", role: "editor" }
    And suggestion mode is currently inactive (toolbar toggle shows "Edit")
    When the user clicks the "Suggestion mode" toggle in the toolbar
    Then the toolbar toggle is visually highlighted (aria-pressed="true")
    And the toggle label changes to "Suggesting"
    And the document enters suggestion mode state
    And subsequent keystrokes do not apply directly to the base document body
```

**Test Data:**
- User: `{ id: "user-101", displayName: "Alice Editor", email: "alice@example.com", role: "editor", permission: "can-edit" }`
- Document: `{ id: "doc-abc123", title: "Q3 Strategy Doc", baseContent: "Original paragraph text." }`

**Preconditions:**
- User is authenticated with a valid session token
- User has can-edit permission on document `doc-abc123`
- Document is open in the editor
- Suggestion mode is off by default

---

### T-1.2: Suggestion mode toggle activates for commenter
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Suggestion Mode Toggle

  Scenario: Commenter activates suggestion mode via toolbar toggle
    Given an authenticated user with can-comment permission is viewing document "doc-abc123"
    And the user is logged in as { id: "user-202", displayName: "Bob Commenter", role: "commenter" }
    And suggestion mode is currently inactive
    When the user clicks the "Suggestion mode" toggle in the toolbar
    Then the toolbar toggle is visually highlighted (aria-pressed="true")
    And the toggle label changes to "Suggesting"
    And the document enters suggestion mode
    And subsequent keystrokes do not apply directly to the base document body
```

**Test Data:**
- User: `{ id: "user-202", displayName: "Bob Commenter", email: "bob@example.com", role: "commenter", permission: "can-comment" }`
- Document: `{ id: "doc-abc123", title: "Q3 Strategy Doc" }`

**Preconditions:**
- User is authenticated with a valid session token
- User has can-comment permission on document `doc-abc123`
- Document is open in the editor

---

### T-2.1: Inserted characters appear as green underlined text in suggestion mode
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Suggestion Insertion Rendering

  Scenario: User types characters in suggestion mode — insertion styled green underlined
    Given an authenticated user with can-edit permission is viewing document "doc-abc123"
    And the user is logged in as { id: "user-101", displayName: "Alice Editor" }
    And suggestion mode is active
    And the document body contains "The quick fox jumped."
    And the cursor is positioned after "quick "
    When the user types "brown "
    Then the inserted text "brown " appears with green underline styling (CSS class "suggestion-insert" or equivalent)
    And the inserted text is attributed to user-101 in the CRDT pending operations store
    And the base document body still reads "The quick fox jumped." (unmodified)
    And other connected clients receive the suggestion as a pending operation, not a direct edit
```

**Test Data:**
- User: `{ id: "user-101", displayName: "Alice Editor", permission: "can-edit" }`
- Document base content: `"The quick fox jumped."`
- Inserted text: `"brown "`
- Expected pending op: `{ type: "insert", position: 10, text: "brown ", authorId: "user-101", timestamp: <ISO8601> }`

**Preconditions:**
- Suggestion mode is active
- Document has at least one paragraph of text
- User cursor is placed at a valid text position

---

### T-2.2: Suggestion mode does not allow insertion at table/code block positions (boundary overlap)
**Maps to:** AC-2, AC-8
**Category:** boundary

```gherkin
Feature: Suggestion Insertion Rendering

  Scenario: User attempts to type inside a table cell while in suggestion mode
    Given an authenticated user with can-edit permission is in suggestion mode on "doc-abc123"
    And the document contains a table with cell content "Header 1"
    And the cursor is placed inside the table cell "Header 1"
    When the user types "New "
    Then no suggestion insertion is created
    And the UI displays the message "Suggestion mode is not supported for tables and code blocks in v1"
    And the base document is unmodified
```

**Test Data:**
- Document: contains a 2x2 table, cell [0][0] content: `"Header 1"`
- Inserted text attempt: `"New "`

**Preconditions:**
- Suggestion mode is active
- Document contains a table element

---

### T-3.1: Deleted characters appear as red strikethrough text in suggestion mode
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Suggestion Deletion Rendering

  Scenario: User deletes characters via Backspace in suggestion mode — deletion styled red strikethrough
    Given an authenticated user with can-edit permission is in suggestion mode on "doc-abc123"
    And the user is logged in as { id: "user-101", displayName: "Alice Editor" }
    And the document body contains "The quick brown fox jumped."
    And the cursor is positioned after "brown "
    When the user presses Backspace 6 times (deleting "brown ")
    Then the text "brown " remains visible in the document with red strikethrough styling (CSS class "suggestion-delete" or equivalent)
    And the deletion is attributed to user-101 in the CRDT pending operations store
    And the base document body still reads "The quick brown fox jumped." (unmodified)
    And other connected clients see "brown " as a red strikethrough pending deletion
```

**Test Data:**
- User: `{ id: "user-101", displayName: "Alice Editor", permission: "can-edit" }`
- Document base content: `"The quick brown fox jumped."`
- Characters deleted: `"brown "` (6 characters)
- Expected pending op: `{ type: "delete", startPosition: 10, endPosition: 16, authorId: "user-101", timestamp: <ISO8601> }`

**Preconditions:**
- Suggestion mode is active
- Document contains "brown " at the cursor position

---

### T-3.2: Selection-delete in suggestion mode creates red strikethrough for selected range
**Maps to:** AC-3
**Category:** boundary

```gherkin
Feature: Suggestion Deletion Rendering

  Scenario: User selects a range and presses Delete in suggestion mode
    Given an authenticated user with can-edit permission is in suggestion mode on "doc-abc123"
    And the document body contains "The quick brown fox jumped."
    And the user selects the text "brown fox"
    When the user presses the Delete key
    Then "brown fox" remains visible with red strikethrough styling
    And the deletion is stored as a pending CRDT operation spanning the selected range
    And the base document content is unchanged
```

**Test Data:**
- Document base content: `"The quick brown fox jumped."`
- Selected range: positions 10–19, text `"brown fox"`
- Expected pending op: `{ type: "delete", startPosition: 10, endPosition: 19, text: "brown fox", authorId: "user-101" }`

**Preconditions:**
- Suggestion mode is active
- User can select text in the document

---

### T-4.1: Suggestion attribution tooltip shows on hover
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Suggestion Attribution Display

  Scenario: User hovers over a suggestion — tooltip shows author name and timestamp
    Given document "doc-abc123" has a pending suggestion insertion
    And the suggestion metadata is { authorId: "user-101", displayName: "Alice Editor", timestamp: "2026-06-15T10:30:00Z" }
    And the user is logged in as { id: "user-303", displayName: "Carol Viewer", permission: "can-view" }
    When the user hovers over the green underlined suggestion text
    Then a tooltip appears containing:
      | Field           | Value                  |
      | Author name     | "Alice Editor"         |
      | Timestamp       | "Jun 15, 2026 10:30 AM" (or locale equivalent) |
    And the tooltip is keyboard-accessible (visible on focus as well as hover)
```

**Test Data:**
- Suggestion: `{ id: "sug-001", type: "insert", text: "brown ", authorId: "user-101", displayName: "Alice Editor", timestamp: "2026-06-15T10:30:00Z" }`
- Viewing user: `{ id: "user-303", displayName: "Carol Viewer", permission: "can-view" }`

**Preconditions:**
- Document has at least one pending suggestion
- Viewing user has view-or-above permission

---

### T-4.2: Suggestion attribution accessible via sidebar entry (no hover available)
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Suggestion Attribution Display

  Scenario: Suggestion attribution visible in sidebar panel without hover
    Given document "doc-abc123" has a pending suggestion { authorId: "user-101", displayName: "Alice Editor", timestamp: "2026-06-15T10:30:00Z" }
    And the user is viewing the suggestions sidebar panel
    When the user reviews the sidebar entry for the suggestion
    Then the sidebar entry displays:
      | Field      | Value          |
      | Author     | "Alice Editor" |
      | Timestamp  | "Jun 15, 2026 10:30 AM" |
    And the entry is present without requiring mouse hover
```

**Test Data:**
- Same as T-4.1

**Preconditions:**
- Suggestions sidebar panel is open
- At least one pending suggestion exists

---

### T-5.1: Pending suggestions visible to viewer-permission user
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: Suggestion Visibility

  Scenario: User with view-only permission sees all pending suggestions
    Given document "doc-abc123" has 3 pending suggestions:
      | id      | type   | text        | author         |
      | sug-001 | insert | "brown "    | Alice Editor   |
      | sug-002 | delete | "fox"       | Bob Commenter  |
      | sug-003 | insert | " quickly"  | Alice Editor   |
    And the user is logged in as { id: "user-303", displayName: "Carol Viewer", permission: "can-view" }
    When the user opens document "doc-abc123"
    Then all 3 pending suggestions are visible with their visual treatments:
      | Suggestion | Visual treatment          |
      | sug-001    | Green underline on "brown " |
      | sug-002    | Red strikethrough on "fox"  |
      | sug-003    | Green underline on " quickly" |
    And each suggestion shows its author attribution on hover/focus
```

**Test Data:**
- Viewer: `{ id: "user-303", permission: "can-view" }`
- 3 pending suggestions as described in the table

**Preconditions:**
- User has view-or-above permission
- Document has multiple pending suggestions in different states

---

### T-5.2: Suggestions not visible to users with no document access
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: Suggestion Visibility

  Scenario: User without document access cannot see suggestions
    Given document "doc-abc123" has pending suggestions
    And the user { id: "user-999", permission: "none" } has no permission entry on the document
    When the user attempts to open document "doc-abc123"
    Then the document is not displayed (403 or redirect to access-denied page)
    And no suggestion content is exposed in the response
```

**Test Data:**
- User: `{ id: "user-999", email: "stranger@external.com" }` (no ACL entry for `doc-abc123`)

**Preconditions:**
- User is authenticated but has no permission on the document

---

### T-6.1: Editor toggles suggestion mode off — returns to direct editing
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Suggestion Mode Toggle Off

  Scenario: Editor toggles suggestion mode off and resumes direct editing
    Given an authenticated user with can-edit permission is in suggestion mode on "doc-abc123"
    And there are 2 existing pending suggestions in the document
    And the user is logged in as { id: "user-101", displayName: "Alice Editor", permission: "can-edit" }
    When the user clicks the "Suggestion mode" toggle to turn it off
    Then the toolbar toggle returns to normal state (label: "Edit", aria-pressed="false")
    And the user types "New content"
    And "New content" is applied directly to the document body (not as a suggestion)
    And the 2 existing pending suggestions remain visible with their green/red styling
```

**Test Data:**
- User: `{ id: "user-101", permission: "can-edit" }`
- 2 existing suggestions must remain unaffected
- Direct edit text: `"New content"`

**Preconditions:**
- User has can-edit permission
- Suggestion mode was previously active
- At least 2 pending suggestions exist

---

### T-6.2: Disabling suggestion mode does not remove existing pending suggestions
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Suggestion Mode Toggle Off

  Scenario: Pending suggestions persist after suggestion mode is toggled off
    Given document "doc-abc123" has a pending suggestion { id: "sug-001", text: "brown ", type: "insert" }
    And the editor toggles suggestion mode off
    When the editor views the document
    Then sug-001 is still visible with green underline styling
    And sug-001 is still listed as "pending" in the CRDT store
    And no accept/reject action has occurred
```

**Test Data:**
- Suggestion: `{ id: "sug-001", status: "pending" }`

**Preconditions:**
- At least one pending suggestion exists before toggle-off

---

### T-7.1: Commenter cannot toggle suggestion mode off via UI
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Commenter Suggestion Mode Restriction

  Scenario: Commenter's suggestion mode toggle is disabled or absent
    Given an authenticated user with can-comment permission is viewing document "doc-abc123"
    And the user is logged in as { id: "user-202", displayName: "Bob Commenter", permission: "can-comment" }
    When the user looks at the toolbar
    Then the suggestion mode toggle is either:
      - Not rendered, OR
      - Rendered but in a permanently "on" state with no ability to turn it off (disabled, aria-disabled="true")
    And the user cannot switch to direct-edit mode via the UI
```

**Test Data:**
- User: `{ id: "user-202", permission: "can-comment" }`

**Preconditions:**
- User has can-comment (not can-edit) permission

---

### T-7.2: Commenter API call to submit direct edit returns 403
**Maps to:** AC-7
**Category:** error-handling

```gherkin
Feature: Commenter Suggestion Mode Restriction

  Scenario: Commenter attempts direct document edit via API — rejected with 403
    Given an authenticated user with can-comment permission has a valid session token
    And the user is { id: "user-202", permission: "can-comment" }
    When the user sends a direct-edit operation to the document operations API:
      POST /api/documents/doc-abc123/operations
      { type: "direct-edit", position: 5, text: "injected text" }
    Then the server responds with HTTP 403 Forbidden
    And the response body contains { error: "requires can-edit for direct edits" }
    And the document base content is unchanged
```

**Test Data:**
- User: `{ id: "user-202", token: "<valid-can-comment-token>" }`
- Malicious payload: `{ type: "direct-edit", position: 5, text: "injected text" }`
- Expected response: `HTTP 403, { error: "requires can-edit for direct edits" }`

**Preconditions:**
- User is authenticated with a valid can-comment session
- Server enforces permission check on every operation type

---

### T-8.1: Suggestion mode blocks edits inside table cells
**Maps to:** AC-8
**Category:** boundary

```gherkin
Feature: Suggestion Mode Content Restrictions

  Scenario: User attempts to edit a table cell in suggestion mode
    Given an authenticated user with can-edit permission is in suggestion mode on "doc-abc123"
    And the document contains a 2x2 table at position 50-150
    And the cursor is placed inside table cell [0][1] with content "Q3 Revenue"
    When the user presses any character key (e.g., "X")
    Then no character is inserted into the table cell
    And no suggestion operation is created in the CRDT store
    And the UI displays the inline message: "Suggestion mode is not supported for tables and code blocks in v1"
    And the message disappears after 3 seconds (or on cursor move)
```

**Test Data:**
- Document: `{ id: "doc-abc123", contains: ["table[2x2]", "code-block"] }`
- Table cell attempted: `[0][1]`, content `"Q3 Revenue"`

**Preconditions:**
- Suggestion mode is active
- Document has a table element

---

### T-8.2: Suggestion mode blocks edits inside code blocks
**Maps to:** AC-8
**Category:** boundary

```gherkin
Feature: Suggestion Mode Content Restrictions

  Scenario: User attempts to edit a code block in suggestion mode
    Given an authenticated user with can-edit permission is in suggestion mode on "doc-abc123"
    And the document contains a code block with content "const x = 1;"
    And the cursor is placed inside the code block
    When the user presses Backspace or types any character
    Then no suggestion operation is created
    And the UI displays: "Suggestion mode is not supported for tables and code blocks in v1"
    And the code block content is unchanged
```

**Test Data:**
- Code block content: `"const x = 1;"`

**Preconditions:**
- Suggestion mode is active
- Document contains a code block element

---

### T-9.1: Overlapping suggestions from two users are visually distinct
**Maps to:** AC-9
**Category:** edge-case

```gherkin
Feature: Multi-User Suggestion Distinction

  Scenario: Two users submit overlapping suggestions — each attributed with distinct visual treatment
    Given document "doc-abc123" has 2 pending suggestions on overlapping text:
      | id      | author          | authorId   | type   | range   |
      | sug-001 | Alice Editor    | user-101   | insert | pos 10  |
      | sug-002 | Bob Commenter   | user-202   | delete | pos 8-14 |
    When any user with view-or-above permission views the document
    Then sug-001 is attributed to "Alice Editor" with a distinct visual label or color shade
    And sug-002 is attributed to "Bob Commenter" with a different visual label or color shade
    And hovering/focusing either suggestion shows the correct author name and timestamp
    And no suggestion is shown as authored by the wrong user
```

**Test Data:**
- Suggestion 1: `{ id: "sug-001", authorId: "user-101", displayName: "Alice Editor", type: "insert", position: 10, text: "brown " }`
- Suggestion 2: `{ id: "sug-002", authorId: "user-202", displayName: "Bob Commenter", type: "delete", start: 8, end: 14 }`

**Preconditions:**
- Two different users have submitted suggestions to the same document
- Suggestions overlap in document position

---

### T-10.1: Suggestion persists across user disconnect/reconnect
**Maps to:** AC-10
**Category:** edge-case

```gherkin
Feature: Suggestion Persistence Across Reconnect

  Scenario: User submits a suggestion, disconnects, and reconnects — suggestion is preserved
    Given an authenticated user with can-edit permission has submitted suggestion sug-001 while online
    And sug-001 metadata: { type: "insert", text: "brown ", position: 10, status: "pending", authorId: "user-101" }
    When the user's network connection drops
    And the user reconnects after 30 seconds
    Then sug-001 is still present in the document as a pending suggestion
    And sug-001 still shows green underline styling on "brown "
    And sug-001 attribution still reads { displayName: "Alice Editor", timestamp: <original timestamp> }
    And the suggestion has not been auto-applied or auto-discarded during the disconnect
```

**Test Data:**
- Suggestion: `{ id: "sug-001", status: "pending", authorId: "user-101", text: "brown ", position: 10 }`
- Disconnect duration: 30 seconds

**Preconditions:**
- Suggestion was successfully synced to server before disconnect (server confirmed receipt)
- No other user accepted or rejected the suggestion during the disconnect window

---

## Negative Tests

### T-NEG-1: Suggestion not created when user has view-only permission
**Maps to:** AC-AUTH-2
**Category:** error-handling

```gherkin
Feature: Suggestion Submission Authorization

  Scenario: View-only user attempts to submit a suggestion via API — rejected
    Given an authenticated user with view-only permission has a valid session token
    And the user is { id: "user-303", permission: "can-view" }
    When the user sends a suggestion operation to the API:
      POST /api/documents/doc-abc123/operations
      { type: "suggestion-insert", position: 5, text: "new text" }
    Then the server responds with HTTP 403 Forbidden
    And the response body contains { error: "requires can-comment or can-edit" }
    And no suggestion is stored in the CRDT pending operations
```

**Test Data:**
- User: `{ id: "user-303", token: "<valid-can-view-token>", permission: "can-view" }`
- Expected: `HTTP 403`

**Preconditions:**
- User is authenticated with can-view permission only

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to submit suggestion returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Suggestion Mode Authorization

  Scenario: Unauthenticated user attempts to submit a suggestion operation
    Given no authentication token is present in the request headers
    When a POST request is made to /api/documents/doc-abc123/operations:
      { type: "suggestion-insert", position: 5, text: "unauthorized text" }
    Then the server responds with HTTP 401 Unauthorized
    And the response body contains { error: "authentication required" }
    And no suggestion is stored
```

**Test Data:**
- Request: no `Authorization` header, no session cookie
- Endpoint: `POST /api/documents/doc-abc123/operations`
- Payload: `{ type: "suggestion-insert", position: 5, text: "unauthorized text" }`
- Expected: `HTTP 401`

**Preconditions:**
- No valid session exists for the request

---

### T-AUTH-2.1: View-only authenticated user receives 403 on suggestion submission
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Suggestion Mode Authorization

  Scenario: Authenticated viewer attempts to submit a suggestion — rejected with 403
    Given an authenticated user { id: "user-303", permission: "can-view" } has a valid token
    When a POST request is made to /api/documents/doc-abc123/operations with a valid auth token:
      { type: "suggestion-insert", position: 5, text: "viewer text" }
    Then the server responds with HTTP 403 Forbidden
    And the response body contains { error: "requires can-comment or can-edit" }
    And no suggestion is stored in the document
```

**Test Data:**
- User: `{ id: "user-303", token: "<valid-can-view-token>", permission: "can-view" }`
- Expected: `HTTP 403, { error: "requires can-comment or can-edit" }`

**Preconditions:**
- User is authenticated but only has view-only access

---

---

# Test Specifications: COMM-04 — Suggestion Acceptance and Rejection

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, edge-case |
| AC-2 | T-2.1, T-2.2 | happy-path, edge-case |
| AC-3 | T-3.1, T-3.2 | happy-path, edge-case |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1, T-5.2 | edge-case |
| AC-6 | T-6.1 | edge-case |
| AC-7 | T-7.1, T-7.2 | error-handling |
| AC-8 | T-8.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Accept and Reject buttons visible to editor on each pending suggestion
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Suggestion Accept/Reject Controls Visibility

  Scenario: Editor views document with pending suggestions — action buttons rendered
    Given document "doc-abc123" has 2 pending suggestions:
      | id      | author          | type   |
      | sug-001 | Alice Editor    | insert |
      | sug-002 | Bob Commenter   | delete |
    And the user is logged in as { id: "user-101", displayName: "Carol Editor", permission: "can-edit" }
    When the user opens document "doc-abc123"
    Then for sug-001 in the suggestion tooltip or sidebar panel:
      | Button  | Visible |
      | Accept  | true    |
      | Reject  | true    |
    And for sug-002 in the suggestion tooltip or sidebar panel:
      | Button  | Visible |
      | Accept  | true    |
      | Reject  | true    |
    And each button is labeled accessibly (e.g., "Accept suggestion by Alice Editor")
```

**Test Data:**
- Editor: `{ id: "user-101", displayName: "Carol Editor", permission: "can-edit" }`
- Suggestion 1: `{ id: "sug-001", type: "insert", authorId: "user-202", displayName: "Alice Editor" }`
- Suggestion 2: `{ id: "sug-002", type: "delete", authorId: "user-303", displayName: "Bob Commenter" }`

**Preconditions:**
- At least 2 pending suggestions exist in the document
- User has can-edit permission

---

### T-1.2: Accept/Reject buttons not visible to commenter
**Maps to:** AC-1, AC-7
**Category:** edge-case

```gherkin
Feature: Suggestion Accept/Reject Controls Visibility

  Scenario: Commenter views document with pending suggestions — no action buttons
    Given document "doc-abc123" has a pending suggestion { id: "sug-001" }
    And the user is logged in as { id: "user-202", displayName: "Bob Commenter", permission: "can-comment" }
    When the user opens document "doc-abc123"
    Then the suggestion tooltip or sidebar panel for sug-001 does NOT show an "Accept" button
    And does NOT show a "Reject" button
    And the suggestion is visible (viewing is permitted)
```

**Test Data:**
- Commenter: `{ id: "user-202", permission: "can-comment" }`

**Preconditions:**
- User has can-comment (not can-edit) permission

---

### T-2.1: Editor accepts an insertion suggestion — text applied to document body
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Accept Suggestion

  Scenario: Editor accepts an insertion suggestion
    Given document "doc-abc123" has a pending insertion suggestion:
      { id: "sug-001", type: "insert", position: 10, text: "brown ", authorId: "user-202", displayName: "Alice", status: "pending" }
    And the document base content is "The quick fox jumped."
    And the user is logged in as { id: "user-101", displayName: "Carol Editor", permission: "can-edit" }
    When the user clicks "Accept" on sug-001
    Then the document body is updated to "The quick brown fox jumped."
    And sug-001 no longer displays with green underline styling
    And the text "brown " appears as normal document content
    And sug-001 is archived with:
      | Field           | Value              |
      | outcome         | "accepted"         |
      | actingEditorId  | "user-101"         |
      | actingEditorName| "Carol Editor"     |
      | actionTimestamp | <ISO8601 timestamp>|
    And all connected users receive a real-time document update reflecting the accepted text
```

**Test Data:**
- Editor: `{ id: "user-101", displayName: "Carol Editor", permission: "can-edit" }`
- Suggestion: `{ id: "sug-001", type: "insert", position: 10, text: "brown ", authorId: "user-202" }`
- Pre-accept doc content: `"The quick fox jumped."`
- Post-accept doc content: `"The quick brown fox jumped."`

**Preconditions:**
- Suggestion is in "pending" status
- User has can-edit permission
- Document is open and user has a live WebSocket session

---

### T-2.2: Editor accepts a deletion suggestion — text removed from document body
**Maps to:** AC-2
**Category:** edge-case

```gherkin
Feature: Accept Suggestion

  Scenario: Editor accepts a deletion suggestion
    Given document "doc-abc123" has a pending deletion suggestion:
      { id: "sug-002", type: "delete", start: 10, end: 16, text: "brown ", authorId: "user-202", status: "pending" }
    And the document base content is "The quick brown fox jumped."
    And the user is logged in as { id: "user-101", displayName: "Carol Editor", permission: "can-edit" }
    When the user clicks "Accept" on sug-002
    Then the document body is updated to "The quick fox jumped."
    And sug-002 no longer displays with red strikethrough styling
    And the text "brown " is no longer visible in the document
    And sug-002 is archived with outcome="accepted", actingEditorId="user-101"
    And all connected users see the document without "brown "
```

**Test Data:**
- Pre-accept content: `"The quick brown fox jumped."`
- Post-accept content: `"The quick fox jumped."`
- Suggestion: `{ id: "sug-002", type: "delete", start: 10, end: 16, text: "brown " }`

**Preconditions:**
- Suggestion is in "pending" status
- User has can-edit permission

---

### T-3.1: Editor rejects an insertion suggestion — text removed from document view
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Reject Suggestion

  Scenario: Editor rejects an insertion suggestion
    Given document "doc-abc123" has a pending insertion suggestion:
      { id: "sug-001", type: "insert", position: 10, text: "brown ", status: "pending" }
    And the document base content is "The quick fox jumped."
    And the user is logged in as { id: "user-101", displayName: "Carol Editor", permission: "can-edit" }
    When the user clicks "Reject" on sug-001
    Then the green underline text "brown " disappears from the document view
    And the document body remains "The quick fox jumped." (unchanged)
    And sug-001 is archived with outcome="rejected", actingEditorId="user-101"
    And all connected users see the document without the suggestion styling
```

**Test Data:**
- Pre-reject visible: `"The quick [green]brown [/green]fox jumped."`
- Post-reject visible: `"The quick fox jumped."`
- Archive record: `{ id: "sug-001", outcome: "rejected", actingEditorId: "user-101", actionTimestamp: <ISO> }`

**Preconditions:**
- Suggestion is in "pending" status
- User has can-edit permission

---

### T-3.2: Editor rejects a deletion suggestion — deleted text is restored to normal
**Maps to:** AC-3
**Category:** edge-case

```gherkin
Feature: Reject Suggestion

  Scenario: Editor rejects a deletion suggestion — struck-through text returns to normal
    Given document "doc-abc123" has a pending deletion suggestion:
      { id: "sug-002", type: "delete", start: 10, end: 16, text: "brown ", status: "pending" }
    And the document base content is "The quick brown fox jumped."
    And the user is logged in as { id: "user-101", displayName: "Carol Editor", permission: "can-edit" }
    When the user clicks "Reject" on sug-002
    Then the red strikethrough styling is removed from "brown "
    And "brown " is now displayed as normal document content
    And the document body still reads "The quick brown fox jumped."
    And sug-002 is archived with outcome="rejected", actingEditorId="user-101"
```

**Test Data:**
- Suggestion: `{ id: "sug-002", type: "delete", text: "brown " }`
- Post-reject document: `"The quick brown fox jumped."` (visually restored to normal)

**Preconditions:**
- Suggestion is in "pending" status
- User has can-edit permission

---

### T-4.1: Archived suggestions are accessible in suggestion history panel
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Suggestion Archive Access

  Scenario: Editor opens history panel and sees archived suggestion records
    Given sug-001 was accepted { outcome: "accepted", actingEditorId: "user-101", actingEditorName: "Carol Editor", actionTimestamp: "2026-06-15T11:00:00Z" }
    And sug-002 was rejected { outcome: "rejected", actingEditorId: "user-101", actionTimestamp: "2026-06-15T11:05:00Z" }
    And the user is logged in as { id: "user-101", permission: "can-edit" }
    When the user opens the "Show resolved suggestions" panel
    Then the panel lists both archived suggestions with:
      | Field              | sug-001 value       | sug-002 value       |
      | Original diff      | "+brown "           | "-brown "           |
      | Submitter name     | "Alice Editor"      | "Bob Commenter"     |
      | Submission time    | "Jun 15, 2026 10:30"| "Jun 15, 2026 10:45"|
      | Outcome            | "accepted"          | "rejected"          |
      | Acting editor      | "Carol Editor"      | "Carol Editor"      |
      | Action timestamp   | "Jun 15 11:00"      | "Jun 15 11:05"      |
```

**Test Data:**
- Archived suggestion 1: `{ id: "sug-001", outcome: "accepted", submitter: "Alice Editor", submittedAt: "2026-06-15T10:30:00Z", actingEditor: "Carol Editor", actionAt: "2026-06-15T11:00:00Z" }`
- Archived suggestion 2: `{ id: "sug-002", outcome: "rejected", submitter: "Bob Commenter", submittedAt: "2026-06-15T10:45:00Z", actingEditor: "Carol Editor", actionAt: "2026-06-15T11:05:00Z" }`

**Preconditions:**
- At least 2 suggestions have been accepted or rejected

---

### T-5.1: Commenter sees suggestion outcome change in real time without action buttons
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: Commenter Suggestion Outcome Visibility

  Scenario: Commenter sees their suggestion accepted — styling changes, no buttons
    Given user-202 (can-comment) submitted sug-001 (insert, "brown ")
    And user-202 is actively viewing the document
    And the document shows sug-001 with green underline styling
    When editor user-101 accepts sug-001
    Then user-202 sees "brown " change from green underline to normal document text (accepted)
    And no "Accept" or "Reject" button is visible to user-202 at any time
    And no in-app notification badge or popup is shown to user-202 (v1 scope)
```

**Test Data:**
- Commenter: `{ id: "user-202", permission: "can-comment" }`
- Editor: `{ id: "user-101", permission: "can-edit" }`

**Preconditions:**
- Commenter is viewing the document with an active session
- Editor accepts the suggestion during the same session

---

### T-5.2: Commenter sees their suggestion rejected — suggestion disappears
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: Commenter Suggestion Outcome Visibility

  Scenario: Commenter sees their suggestion rejected — insertion disappears
    Given user-202 (can-comment) submitted sug-001 (insert, "brown ")
    And user-202 is actively viewing the document
    When editor user-101 rejects sug-001
    Then user-202 sees the green underline text "brown " disappear from the document view
    And no "Accept" or "Reject" button was ever visible to user-202
    And no in-app notification is shown (v1 scope)
```

**Test Data:**
- Same as T-5.1

**Preconditions:**
- Commenter is active; editor rejects their suggestion

---

### T-6.1: Conflicting suggestion triggers manual review warning
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Conflicting Suggestion Detection

  Scenario: Editor tries to accept a suggestion that conflicts with a subsequent direct edit
    Given document "doc-abc123" has pending suggestion sug-001 on range [10, 16] (text: "brown ")
    And after sug-001 was submitted, an editor directly edited the same range [10, 16] changing it to "red "
    And the current base document content is "The quick red fox jumped."
    And the user is logged in as { id: "user-101", permission: "can-edit" }
    When the user clicks "Accept" on sug-001
    Then the system detects a conflict (sug-001's base range has been modified since submission)
    And the system displays the warning: "This suggestion conflicts with a recent edit — review manually"
    And sug-001 is NOT auto-applied to the document
    And sug-001 status remains "pending"
    And the document body is unchanged
```

**Test Data:**
- Suggestion: `{ id: "sug-001", type: "insert", baseRange: [10, 16], submittedAt: "T0" }`
- Conflicting direct edit: `{ range: [10, 16], text: "red ", editedAt: "T0+5min" }`
- Current document: `"The quick red fox jumped."`

**Preconditions:**
- A direct edit has occurred on the same range as the pending suggestion after the suggestion was submitted

---

### T-7.1: Commenter attempt to accept via UI — buttons not rendered
**Maps to:** AC-7
**Category:** error-handling

```gherkin
Feature: Non-Editor Cannot Accept/Reject

  Scenario: Commenter cannot see or use Accept/Reject buttons
    Given document "doc-abc123" has pending suggestion sug-001
    And the user is logged in as { id: "user-202", permission: "can-comment" }
    When the user views the suggestion tooltip or sidebar panel
    Then no "Accept" button is rendered
    And no "Reject" button is rendered
    And the commenter can only view the suggestion, not act on it
```

**Test Data:**
- User: `{ id: "user-202", permission: "can-comment" }`

**Preconditions:**
- User has can-comment but not can-edit permission

---

### T-7.2: Non-editor direct API call to accept returns 403
**Maps to:** AC-7
**Category:** error-handling

```gherkin
Feature: Non-Editor Cannot Accept/Reject

  Scenario: Commenter calls accept endpoint directly via API — rejected with 403
    Given an authenticated user { id: "user-202", permission: "can-comment" } has a valid token
    When a POST request is made to /api/documents/doc-abc123/suggestions/sug-001/accept
      with a valid can-comment authorization token
    Then the server responds with HTTP 403 Forbidden
    And the response body contains { error: "requires can-edit" }
    And sug-001 status remains "pending" in the CRDT store
```

**Test Data:**
- User: `{ id: "user-202", token: "<valid-can-comment-token>", permission: "can-comment" }`
- Endpoint: `POST /api/documents/doc-abc123/suggestions/sug-001/accept`
- Expected: `HTTP 403, { error: "requires can-edit" }`

**Preconditions:**
- User is authenticated with can-comment token
- Suggestion sug-001 is pending

---

### T-8.1: Two editors concurrently accept the same suggestion — applied exactly once
**Maps to:** AC-8
**Category:** edge-case

```gherkin
Feature: Concurrent Acceptance Idempotency

  Scenario: Two editors simultaneously accept the same suggestion — no duplicate apply
    Given document "doc-abc123" has pending suggestion sug-001 { type: "insert", text: "brown " }
    And editor-A { id: "user-101" } and editor-B { id: "user-104" } both have the document open
    When editor-A and editor-B both click "Accept" on sug-001 within 100ms of each other
    And both POST requests reach the server near-simultaneously
    Then the suggestion operation is applied exactly once to the document body
    And sug-001 is archived exactly once with a single outcome="accepted" record
    And both editor-A and editor-B see the accepted state (text normalized, no suggestion styling)
    And neither editor sees an error message
    And no second archive record is created for sug-001
```

**Test Data:**
- Editor A: `{ id: "user-101", permission: "can-edit" }`
- Editor B: `{ id: "user-104", permission: "can-edit" }`
- Suggestion: `{ id: "sug-001", status: "pending" }`
- Expected archive count for sug-001: exactly 1

**Preconditions:**
- Both editors are authenticated with can-edit permission
- Both are viewing the same document with active sessions
- Server implements idempotent accept (e.g., optimistic locking or CAS on suggestion status)

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to accept/reject returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Suggestion Accept/Reject Authorization

  Scenario: Unauthenticated request to accept suggestion endpoint returns 401
    Given no authentication token is present in the request
    When a POST request is made to /api/documents/doc-abc123/suggestions/sug-001/accept
      with no Authorization header or session cookie
    Then the server responds with HTTP 401 Unauthorized
    And the response body contains { error: "authentication required" }
    And sug-001 status is unchanged
```

**Test Data:**
- Request: no `Authorization` header, no session cookie
- Endpoint: `POST /api/documents/doc-abc123/suggestions/sug-001/accept`
- Expected: `HTTP 401`

**Preconditions:**
- No valid session for the incoming request

---

### T-AUTH-2.1: Commenter or viewer calling accept/reject endpoint returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Suggestion Accept/Reject Authorization

  Scenario: Authenticated commenter calls reject endpoint — rejected with 403
    Given an authenticated user { id: "user-202", permission: "can-comment" } has a valid token
    When a POST request is made to /api/documents/doc-abc123/suggestions/sug-001/reject
      with the can-comment authorization token
    Then the server responds with HTTP 403 Forbidden
    And the response body contains { error: "requires can-edit" }
    And sug-001 status remains "pending"
```

**Test Data:**
- User: `{ id: "user-202", token: "<valid-can-comment-token>", permission: "can-comment" }`
- Endpoint: `POST /api/documents/doc-abc123/suggestions/sug-001/reject`
- Expected: `HTTP 403, { error: "requires can-edit" }`

**Preconditions:**
- User is authenticated with a valid session
- User permission is can-comment or can-view (not can-edit)

---

---

# Test Specifications: NOTIF-01 — @-Mention Email Notifications

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, boundary |
| AC-2 | T-2.1 | edge-case |
| AC-3 | T-3.1, T-3.2 | happy-path, edge-case |
| AC-4 | T-4.1, T-4.2 | edge-case |
| AC-5 | T-5.1, T-5.2 | edge-case |
| AC-6 | T-6.1 | error-handling |
| AC-7 | T-7.1 | security |
| AC-8 | T-8.1, T-8.2 | edge-case |
| AC-9 | T-9.1 | error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: @-mention in a comment triggers email to the mentioned user
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: @-Mention Email Notification

  Scenario: Valid @-mention queues email to mentioned user within digest window
    Given user "alice" is a valid user in the workspace with email "alice@example.com"
    And user "alice" has view-or-above permission on document "doc-abc123"
    And user "alice" has NOT opted out of notifications for "doc-abc123"
    And the user { id: "user-303", displayName: "Carol Commenter" } submits the comment:
      "Hey @alice, can you review this section?"
    When the comment is saved at 2026-06-15T10:00:00Z
    Then a notification is queued for alice@example.com within the 5-minute digest window
    And when the digest fires (by 2026-06-15T10:05:00Z), alice receives exactly 1 email containing:
      | Field           | Expected value                                       |
      | Document title  | "Q3 Strategy Doc"                                    |
      | Comment text    | "Hey @alice, can you review this section?"           |
      | Commenter name  | "Carol Commenter"                                    |
      | Deep link       | https://app.example.com/docs/doc-abc123#comment-001  |
```

**Test Data:**
- Mentioned user: `{ id: "user-101", username: "alice", email: "alice@example.com", permission: "can-view" }`
- Commenter: `{ id: "user-303", displayName: "Carol Commenter" }`
- Comment: `{ id: "comment-001", text: "Hey @alice, can you review this section?", documentId: "doc-abc123" }`
- Document: `{ id: "doc-abc123", title: "Q3 Strategy Doc", creatorId: "user-999" }`

**Preconditions:**
- `alice` is a valid workspace user with document access
- Notification opt-out is NOT set for alice on this document
- Digest window is 5 minutes

---

### T-1.2: @-mention email deep link format is correct
**Maps to:** AC-1
**Category:** boundary

```gherkin
Feature: @-Mention Email Notification

  Scenario: Deep link in notification email anchors to the correct comment
    Given user "alice" receives a notification email for comment "comment-001" on "doc-abc123"
    When alice clicks the deep link in the email
    Then the browser navigates to the document URL with the comment anchor:
      URL format: https://app.example.com/docs/doc-abc123#comment-001
    And the document is scrolled to comment "comment-001"
    And alice's permission is re-verified before showing the document content
```

**Test Data:**
- Deep link: `https://app.example.com/docs/doc-abc123#comment-001`
- Comment anchor ID: `comment-001`

**Preconditions:**
- Alice has view-or-above permission on `doc-abc123`
- Comment `comment-001` exists in the document

---

### T-2.1: Multiple @-mentions within 5 minutes batched into single email
**Maps to:** AC-2
**Category:** edge-case

```gherkin
Feature: Email Digest Batching

  Scenario: Three @-mentions to same user within 5 minutes arrive as one email
    Given user "alice" (alice@example.com) has view-or-above access to "doc-abc123"
    And alice has not opted out of notifications
    When the following 3 comments mentioning @alice are submitted between T0 and T0+4min:
      | id          | text                                | commentedAt            |
      | comment-001 | "@alice please review intro"        | 2026-06-15T10:00:00Z   |
      | comment-002 | "@alice also check conclusion"      | 2026-06-15T10:02:00Z   |
      | comment-003 | "@alice final note on references"   | 2026-06-15T10:04:00Z   |
    And the 5-minute digest window closes at 2026-06-15T10:05:00Z
    Then alice receives exactly 1 email
    And the email contains a summary of all 3 mentions (all 3 comment texts and deep links)
    And alice does not receive 3 separate emails
```

**Test Data:**
- Mentioned user: `{ id: "user-101", username: "alice", email: "alice@example.com" }`
- 3 comments: see table above
- Digest window: 5 minutes from first mention or from previous digest fire

**Preconditions:**
- All 3 comments submitted within a single 5-minute digest window
- Digest job is running

---

### T-3.1: Document creator notified of new comment thread on their document
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Document Creator Notification

  Scenario: New comment thread triggers email to document creator
    Given document "doc-abc123" was created by user { id: "user-999", email: "creator@example.com", displayName: "Document Owner" }
    And user-999 has NOT opted out of notifications for "doc-abc123"
    And user { id: "user-303", displayName: "Carol Commenter" } has can-comment permission
    When user-303 creates a new comment thread:
      { id: "comment-010", text: "Great section on metrics", documentId: "doc-abc123" }
    Then a notification is queued for creator@example.com within the 5-minute digest
    And the email sent to creator@example.com contains:
      | Field           | Expected value              |
      | Document title  | "Q3 Strategy Doc"           |
      | Comment text    | "Great section on metrics"  |
      | Commenter name  | "Carol Commenter"           |
      | Deep link       | URL anchored to comment-010 |
```

**Test Data:**
- Creator: `{ id: "user-999", email: "creator@example.com", displayName: "Document Owner" }`
- Commenter: `{ id: "user-303", displayName: "Carol Commenter", permission: "can-comment" }`
- Comment: `{ id: "comment-010", text: "Great section on metrics" }`

**Preconditions:**
- Creator has not opted out of notifications for this document
- Commenter has can-comment permission on the document

---

### T-3.2: Creator notification batched with @-mention notifications in digest
**Maps to:** AC-3
**Category:** edge-case

```gherkin
Feature: Document Creator Notification

  Scenario: Creator is also @-mentioned — one digest email covers both triggers
    Given user-999 is both the document creator and is @-mentioned in the same comment
    And comment-011 text: "@owner I need your input on this"
    When comment-011 is submitted
    Then user-999 receives exactly 1 digest email covering both the creator-notification and the @-mention
    And the email is not duplicated (creator is not emailed twice for the same comment)
```

**Test Data:**
- Creator/mentioned: `{ id: "user-999", email: "creator@example.com", username: "owner" }`
- Comment: `{ id: "comment-011", text: "@owner I need your input on this" }`

**Preconditions:**
- User is both the document creator and @-mentioned in the same comment
- Both notification triggers fire within the same digest window

---

### T-4.1: Commenter does not receive email for their own @-mention of themselves
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Self-Notification Suppression

  Scenario: User who @-mentions themselves does not receive email
    Given user { id: "user-303", username: "carol", email: "carol@example.com" } is commenting on "doc-abc123"
    When user-303 submits a comment: "@carol reminder to follow up"
    Then no email notification is queued for carol@example.com
    And the comment is saved successfully
```

**Test Data:**
- User: `{ id: "user-303", username: "carol", email: "carol@example.com" }`
- Comment: `{ id: "comment-020", text: "@carol reminder to follow up", authorId: "user-303" }`

**Preconditions:**
- The commenting user's username matches the @-mention target

---

### T-4.2: Document creator does not receive notification for their own comments
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Self-Notification Suppression

  Scenario: Creator commenting on their own document does not receive creator notification
    Given document "doc-abc123" was created by user-999 (email: creator@example.com)
    When user-999 submits a comment on their own document: "I'm adding a note here"
    Then no email notification is sent to creator@example.com for this action
    And the comment is saved successfully
```

**Test Data:**
- Creator: `{ id: "user-999", email: "creator@example.com" }`
- Comment author: same user-999

**Preconditions:**
- Comment author and document creator are the same user

---

### T-5.1: Per-document opt-out prevents email to opted-out user
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: Per-Document Email Opt-Out

  Scenario: User who opted out does not receive @-mention email for that document
    Given user "alice" { id: "user-101", email: "alice@example.com" } has opted out of email notifications for "doc-abc123"
    When another user submits a comment "@alice please look at this" on "doc-abc123"
    Then no email is sent to alice@example.com for this mention
    And the comment is saved normally
    And no error is returned to the commenter
```

**Test Data:**
- Opted-out user: `{ id: "user-101", email: "alice@example.com", optOut: { documentId: "doc-abc123", channel: "email" } }`

**Preconditions:**
- User has explicitly opted out for the specific document
- Opt-out preference is stored and enforced by the notification system

---

### T-5.2: Opt-out is document-scoped — user still receives notifications for other documents
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: Per-Document Email Opt-Out

  Scenario: User opted out of one document still receives notifications for another
    Given user "alice" has opted out of notifications for "doc-abc123"
    And user "alice" has NOT opted out of notifications for "doc-xyz789"
    When a comment "@alice check this" is submitted on "doc-xyz789"
    Then alice@example.com receives the notification email for "doc-xyz789"
    And alice@example.com does NOT receive any email related to "doc-abc123"
```

**Test Data:**
- User: `{ id: "user-101", email: "alice@example.com" }`
- Opt-out: only for `doc-abc123`
- Active notification: from `doc-xyz789`

**Preconditions:**
- User has document-scoped opt-out (not global opt-out)

---

### T-6.1: @-mention of non-existent username handled gracefully
**Maps to:** AC-6
**Category:** error-handling

```gherkin
Feature: Unknown @-Mention Handling

  Scenario: @-mention of a username that does not exist in the workspace
    Given no user with username "unknownuser" exists in the workspace
    When user-303 submits a comment: "Thanks @unknownuser for the feedback"
    Then the comment is saved successfully
    And no email notification is queued
    And the text "@unknownuser" appears as plain text in the comment (no user hyperlink)
    And no error message is shown to the commenter
    And the notification log records: { type: "skip", reason: "unknown-user", mention: "@unknownuser" }
```

**Test Data:**
- Commenter: `{ id: "user-303", displayName: "Carol Commenter" }`
- Mentioned handle: `@unknownuser` (no workspace match)
- Comment text: `"Thanks @unknownuser for the feedback"`

**Preconditions:**
- No workspace user has the username `unknownuser`
- Comment service resolves @-mentions against the user directory at save time

---

### T-7.1: @-mention of user without document access — no email sent
**Maps to:** AC-7
**Category:** security

```gherkin
Feature: Permission-Gated @-Mention Notification

  Scenario: Mentioned user lacks view access — no email sent to prevent document existence leakage
    Given user "dave" { id: "user-500", email: "dave@external.com" } exists in the workspace
    But user "dave" has NO permission on document "doc-abc123" (not even view)
    When user-303 submits a comment "@dave you should see this" on "doc-abc123"
    Then no email notification is sent to dave@external.com
    And no information about the document is disclosed to dave via any channel
    And the comment is saved normally for users who do have access
```

**Test Data:**
- Mentioned: `{ id: "user-500", username: "dave", email: "dave@external.com", documentPermission: "none" }`
- Commenter: `{ id: "user-303", permission: "can-comment" }`

**Preconditions:**
- User exists in workspace but has no permission entry on the target document

---

### T-8.1: Deep link recipient with access sees document scrolled to comment
**Maps to:** AC-8
**Category:** edge-case

```gherkin
Feature: Deep Link Navigation

  Scenario: Recipient with document access clicks deep link — navigates to anchored comment
    Given alice received a notification email with deep link: https://app.example.com/docs/doc-abc123#comment-001
    And alice { id: "user-101", permission: "can-view" } has view-or-above access to "doc-abc123"
    When alice clicks the deep link
    Then alice is authenticated (login redirect if needed)
    And the document "doc-abc123" is displayed
    And the page scrolls to comment-001 (the comment thread is visible and highlighted)
    And document content is visible to alice
```

**Test Data:**
- Deep link URL: `https://app.example.com/docs/doc-abc123#comment-001`
- Recipient: `{ id: "user-101", email: "alice@example.com", permission: "can-view" }`

**Preconditions:**
- Alice is logged in (or will be redirected to login)
- Comment `comment-001` exists in the document

---

### T-8.2: Deep link recipient without document access sees permission-denied page
**Maps to:** AC-8
**Category:** edge-case

```gherkin
Feature: Deep Link Navigation

  Scenario: Recipient without document access clicks deep link — permission-denied page shown
    Given user "dave" { id: "user-500" } received a deep link to https://app.example.com/docs/doc-abc123#comment-001
    But "dave" has no permission on "doc-abc123"
    When dave clicks the deep link (authenticated as dave)
    Then dave is shown a permission-denied page
    And no document content is displayed to dave
    And no comment content is shown
    And the response does not confirm whether the document exists (to avoid existence leakage)
```

**Test Data:**
- User: `{ id: "user-500", email: "dave@external.com", documentPermission: "none" }`
- Deep link: `https://app.example.com/docs/doc-abc123#comment-001`

**Preconditions:**
- User is authenticated but has no ACL entry for the document

---

### T-9.1: SendGrid delivery failure triggers retry with exponential backoff
**Maps to:** AC-9
**Category:** error-handling

```gherkin
Feature: SendGrid Delivery Failure Handling

  Scenario: SendGrid returns 5xx — notification retried 3 times with exponential backoff
    Given a notification email for alice@example.com is queued for delivery
    And SendGrid returns HTTP 503 on every delivery attempt
    When the notification system attempts delivery
    Then attempt 1 occurs immediately
    And attempt 2 occurs approximately 1 second after attempt 1
    And attempt 3 occurs approximately 2 seconds after attempt 2
    And attempt 4 occurs approximately 4 seconds after attempt 3
    And after attempt 4 fails, no further retry is made
    And the failure is recorded in the notification log:
      { notificationId: "notif-001", recipientEmail: "alice@example.com", status: "failed", attempts: 4, lastError: "503" }
    And no user-facing error is shown in the application (silent fail v1)
```

**Test Data:**
- Notification: `{ id: "notif-001", recipientEmail: "alice@example.com", documentId: "doc-abc123" }`
- SendGrid mock: always returns `503 Service Unavailable`
- Retry schedule: 0s, 1s, 2s, 4s (4 total attempts = initial + 3 retries)

**Preconditions:**
- SendGrid integration is wired
- Notification worker has retry logic with exponential backoff
- Failure logging is implemented

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to notification opt-out endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Notification Settings Authorization

  Scenario: Unauthenticated user attempts to change notification opt-out setting
    Given no authentication token is present
    When a PATCH request is made to /api/documents/doc-abc123/notification-settings
      with body { optOut: true }
      and no Authorization header
    Then the server responds with HTTP 401 Unauthorized
    And the response body contains { error: "authentication required" }
    And the notification settings for the document are unchanged
```

**Test Data:**
- Endpoint: `PATCH /api/documents/doc-abc123/notification-settings`
- Payload: `{ optOut: true }`
- Expected: `HTTP 401`

**Preconditions:**
- No valid session for the request

---

### T-AUTH-2.1: Authenticated user modifying settings for inaccessible document returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Notification Settings Authorization

  Scenario: Authenticated user without document access attempts to modify notification settings
    Given an authenticated user { id: "user-500", permission: "none" } for document "doc-abc123"
    When a PATCH request is made to /api/documents/doc-abc123/notification-settings
      with a valid session token for user-500
      and body { optOut: true }
    Then the server responds with HTTP 403 Forbidden
    And the notification settings for "doc-abc123" are unchanged
```

**Test Data:**
- User: `{ id: "user-500", token: "<valid-token>", documentPermission: "none" }`
- Endpoint: `PATCH /api/documents/doc-abc123/notification-settings`
- Expected: `HTTP 403`

**Preconditions:**
- User is authenticated with a valid session token
- User has no permission entry on the target document

---

---

# Test Specifications: PERM-01 — Per-Document Permission Management via Share UI

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, edge-case |
| AC-2 | T-2.1, T-2.2 | happy-path, edge-case |
| AC-3 | T-3.1, T-3.2 | happy-path, error-handling |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1, T-5.2 | happy-path, edge-case |
| AC-6 | T-6.1 | error-handling |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1 | error-handling |
| AC-9 | T-9.1, T-9.2 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Editor opens Share UI and sees current permission list
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Share UI Access

  Scenario: User with can-edit permission opens Share UI — current permissions listed
    Given document "doc-abc123" has the following existing permissions:
      | user            | permission |
      | alice@example.com | can-edit  |
      | bob@example.com   | can-comment |
      | carol@example.com | can-view  |
    And the user is logged in as { id: "user-101", email: "alice@example.com", permission: "can-edit" }
    When the user clicks the "Share" button on document "doc-abc123"
    Then the Share UI dialog opens
    And the dialog lists all 3 users with their permission levels:
      | User              | Permission  |
      | alice@example.com | can-edit    |
      | bob@example.com   | can-comment |
      | carol@example.com | can-view    |
    And the dialog includes a user search field
```

**Test Data:**
- Opening user: `{ id: "user-101", email: "alice@example.com", permission: "can-edit" }`
- Document: `{ id: "doc-abc123", title: "Q3 Strategy Doc", creatorId: "user-101" }`
- Existing ACL: 3 entries as shown

**Preconditions:**
- User has can-edit permission on the document
- Document has 3 existing permission entries

---

### T-1.2: Share button not accessible to users without can-edit permission
**Maps to:** AC-1, AC-7
**Category:** edge-case

```gherkin
Feature: Share UI Access

  Scenario: User with can-comment permission cannot open Share UI with edit controls
    Given the user is logged in as { id: "user-202", permission: "can-comment" }
    And the user is viewing document "doc-abc123"
    When the user looks for the Share button in the document UI
    Then either:
      - The Share button is not displayed, OR
      - The Share button is present but opens a read-only view without edit controls
    And no permission modification controls are accessible to the commenter
```

**Test Data:**
- User: `{ id: "user-202", email: "bob@example.com", permission: "can-comment" }`

**Preconditions:**
- User has can-comment but not can-edit permission

---

### T-2.1: Search for existing user by name returns match in dropdown
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: User Search in Share UI

  Scenario: Admin searches for a user by name — match shown in dropdown
    Given the Share UI is open for document "doc-abc123"
    And the organization has users including:
      { id: "user-400", displayName: "Diana Researcher", email: "diana@example.com" }
    When the editor types "Diana" in the user search field
    Then the dropdown shows at least 1 result:
      | Display Name      | Email               |
      | Diana Researcher  | diana@example.com   |
    And the result includes both the display name and email address
```

**Test Data:**
- Search input: `"Diana"`
- Expected result: `{ displayName: "Diana Researcher", email: "diana@example.com" }`

**Preconditions:**
- Share UI is open
- User "Diana Researcher" exists in the organization directory
- User directory search is functional

---

### T-2.2: Search for user by email returns match
**Maps to:** AC-2
**Category:** edge-case

```gherkin
Feature: User Search in Share UI

  Scenario: Editor searches for a user by email — exact or partial email match returned
    Given the Share UI is open
    And the organization has user { displayName: "Diana Researcher", email: "diana@example.com" }
    When the editor types "diana@" in the user search field
    Then the dropdown shows:
      | Display Name      | Email               |
      | Diana Researcher  | diana@example.com   |
```

**Test Data:**
- Search input: `"diana@"`
- Expected result: `{ displayName: "Diana Researcher", email: "diana@example.com" }`

**Preconditions:**
- Share UI is open
- Search supports both name and email prefix matching

---

### T-3.1: Assign a new permission to a user found via search
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Assign Permission via Share UI

  Scenario: Editor assigns can-view permission to a new user
    Given the Share UI is open for document "doc-abc123"
    And "diana@example.com" does NOT currently have any permission on "doc-abc123"
    And the editor has searched for "Diana" and sees her in the dropdown
    When the editor selects "Diana Researcher" from the dropdown
    And selects permission level "View" from the permission selector
    And clicks "Share" or "Confirm"
    Then diana@example.com is added to the document ACL with permission "can-view"
    And the Share UI updates immediately to show:
      | User               | Permission |
      | diana@example.com  | can-view   |
    And diana's can-view permission takes effect immediately (verified by server)
    And the ACL change is recorded in the audit log:
      { actingUser: "user-101", targetUser: "user-400", newPermission: "can-view", documentId: "doc-abc123", timestamp: <ISO> }
```

**Test Data:**
- New user: `{ id: "user-400", displayName: "Diana Researcher", email: "diana@example.com" }`
- Permission assigned: `"can-view"`
- Acting editor: `{ id: "user-101", permission: "can-edit" }`
- Audit log fields as shown

**Preconditions:**
- Diana does not have an existing ACL entry for the document
- Acting editor has can-edit permission

---

### T-3.2: Permission assignment failure shows error — no partial update
**Maps to:** AC-3
**Category:** error-handling

```gherkin
Feature: Assign Permission via Share UI

  Scenario: ACL system returns error on permission write — no partial update, error shown
    Given the Share UI is open for "doc-abc123"
    And the ACL system is configured to return 500 on write for this test
    When the editor assigns "can-comment" to "diana@example.com" and clicks "Confirm"
    Then the Share UI displays: "Failed to update permissions. Please try again."
    And diana@example.com is NOT added to the document ACL
    And the Share UI permission list shows no change from before the action
    And no partial ACL entry is written
```

**Test Data:**
- ACL system mock: returns `HTTP 500` on permission write
- Expected: no ACL change, error message displayed

**Preconditions:**
- ACL write endpoint is mocked to fail
- Share UI has error handling for write failures

---

### T-4.1: Change an existing user's permission level
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Change Existing Permission Level

  Scenario: Editor upgrades a user's permission from can-view to can-edit
    Given the Share UI is open for "doc-abc123"
    And carol@example.com currently has "can-view" permission
    When the editor changes carol's permission to "can-edit" via the permission dropdown
    Then the ACL is updated immediately to can-edit for carol@example.com
    And the Share UI shows carol@example.com with "can-edit"
    And if carol has an active WebSocket session, her next operation is validated against "can-edit"
    And the audit log records:
      { actingUser: "user-101", targetUser: "carol", oldPermission: "can-view", newPermission: "can-edit", timestamp: <ISO> }
```

**Test Data:**
- Target user: `{ id: "user-303", email: "carol@example.com", currentPermission: "can-view" }`
- New permission: `"can-edit"`
- Acting editor: `{ id: "user-101", permission: "can-edit" }`

**Preconditions:**
- Carol has an existing can-view ACL entry
- Acting editor has can-edit permission

---

### T-5.1: Remove a user's access — user is rejected on next operation
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: Remove User Access

  Scenario: Editor removes a user's permission — revoked immediately
    Given the Share UI is open for "doc-abc123"
    And carol@example.com has "can-comment" permission on "doc-abc123"
    When the editor clicks "Remove" next to carol@example.com
    Then carol's ACL entry for "doc-abc123" is deleted
    And the Share UI no longer shows carol@example.com in the permissions list
    And if carol attempts to access "doc-abc123" via the API:
      GET /api/documents/doc-abc123
      the server responds with HTTP 403
    And the audit log records: { actingUser: "user-101", targetUser: "carol", action: "removed", timestamp: <ISO> }
```

**Test Data:**
- Removed user: `{ id: "user-303", email: "carol@example.com", currentPermission: "can-comment" }`
- Acting editor: `{ id: "user-101", permission: "can-edit" }`
- Post-removal API test: `GET /api/documents/doc-abc123` with carol's token → expect `HTTP 403`

**Preconditions:**
- Carol has an existing ACL entry
- Acting editor has can-edit permission

---

### T-5.2: Removed user's next write operation returns 403
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: Remove User Access

  Scenario: User whose access was removed gets 403 on their next API operation
    Given carol { id: "user-303", permission: "can-comment" } had access to "doc-abc123"
    And an editor removed carol's access at T0
    When carol submits a comment to /api/documents/doc-abc123/comments at T0+10s
    Then the server responds with HTTP 403 Forbidden
    And the comment is not saved
    And the UI shows carol a message: "Your access level has changed — you now have view-only access" (or no-access equivalent)
```

**Test Data:**
- Removed user: `{ id: "user-303", token: "<valid-token-pre-removal>", permission: "none" (post-removal) }`
- Operation: `POST /api/documents/doc-abc123/comments`
- Expected: `HTTP 403`

**Preconditions:**
- User's token is still valid (not expired) but ACL entry was revoked
- Server re-validates permissions on every request

---

### T-6.1: Document creator's Edit permission cannot be removed or downgraded
**Maps to:** AC-6
**Category:** error-handling

```gherkin
Feature: Creator Permission Protection

  Scenario: Admin attempts to remove document creator's permission — blocked
    Given document "doc-abc123" was created by user-101 (alice@example.com)
    And the Share UI is open showing alice@example.com with "can-edit"
    When an admin (user-200) attempts to click "Remove" next to alice@example.com
    Then the action is blocked
    And the UI shows the message: "Document creator's access cannot be removed"
    And alice@example.com's permission remains "can-edit"
    And no ACL change is written
    And the API endpoint also enforces this: DELETE /api/documents/doc-abc123/permissions/user-101 → HTTP 403
```

**Test Data:**
- Creator: `{ id: "user-101", email: "alice@example.com", role: "creator", permission: "can-edit" }`
- Acting admin: `{ id: "user-200", permission: "can-edit" }`
- API: `DELETE /api/documents/doc-abc123/permissions/user-101` → expected `HTTP 403`

**Preconditions:**
- Acting admin has can-edit permission (but is not the creator)
- Document creator's ID is stored and protected in the ACL system

---

### T-7.1: Share button hidden or read-only for non-editor users
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Share UI Visibility by Permission

  Scenario: Viewer opening the Share UI sees no edit controls
    Given the user { id: "user-303", permission: "can-view" } is viewing document "doc-abc123"
    When the user attempts to access the Share UI
    Then either:
      a) The Share button is not present in the UI, OR
      b) The Share button opens a read-only panel showing who has access, without any controls to add/change/remove users
    And no permission modification is possible through the UI
    And any direct API call to modify permissions returns 403
```

**Test Data:**
- Viewer: `{ id: "user-303", permission: "can-view" }`

**Preconditions:**
- User has view-only permission

---

### T-8.1: Search for unknown user returns "No users found"
**Maps to:** AC-8
**Category:** error-handling

```gherkin
Feature: User Search No Results

  Scenario: Search term matches no user in the organization
    Given the Share UI is open for "doc-abc123"
    And no user in the organization has the name or email matching "zzz-nonexistent-user"
    When the editor types "zzz-nonexistent-user" in the user search field
    Then the dropdown shows: "No users found"
    And no user entry is selectable
    And no error is thrown
    And the Share UI remains functional
```

**Test Data:**
- Search input: `"zzz-nonexistent-user"`
- Expected dropdown: `["No users found"]` (non-actionable)

**Preconditions:**
- Organization directory does not contain any user matching the search term

---

### T-9.1: Permission downgrade detected on next write operation — 403 with UI message
**Maps to:** AC-9
**Category:** edge-case

```gherkin
Feature: Permission Change Propagation to Active Session

  Scenario: User with active session has permission downgraded — blocked on next write
    Given user-303 (carol) has can-edit permission and is actively editing "doc-abc123"
    And carol has a live WebSocket session open
    When admin user-101 downgrades carol's permission to "can-view" via the Share UI
    Then carol's current editing session is NOT immediately interrupted or disconnected
    And carol can still view the document content
    When carol attempts her next write operation (e.g., typing text):
      POST /api/documents/doc-abc123/operations { type: "direct-edit", text: "New text" }
    Then the server responds with HTTP 403
    And the editor UI shows carol: "Your access level has changed — you now have view-only access"
```

**Test Data:**
- User: `{ id: "user-303", email: "carol@example.com", previousPermission: "can-edit", newPermission: "can-view" }`
- Operation attempted: `POST /api/documents/doc-abc123/operations { type: "direct-edit" }`
- Expected response: `HTTP 403` + UI message

**Preconditions:**
- Carol has an active editing session at the time of the permission downgrade
- Server validates permission on every write operation, not only on session start

---

### T-9.2: Write operation after permission downgrade — server-side enforcement
**Maps to:** AC-9
**Category:** edge-case

```gherkin
Feature: Permission Change Propagation to Active Session

  Scenario: Server enforces new permission regardless of client-side state
    Given carol's session token was issued when she had can-edit permission
    And carol's permission has since been downgraded to can-view
    When carol sends a direct write operation using her existing session token:
      PUT /api/documents/doc-abc123/body { content: "Injected content" }
    Then the server re-validates carol's permission at request time
    And the server responds with HTTP 403 (not trusting the client-side session state)
    And the document body is unchanged
```

**Test Data:**
- Carol's token: issued when permission was can-edit, still valid JWT
- Current permission in ACL: can-view
- Expected: `HTTP 403` (server-side re-validation wins)

**Preconditions:**
- Permission was downgraded after token was issued but before this request
- Server does not trust permission claims in the JWT; re-validates against live ACL

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to permissions endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Document Permissions Authorization

  Scenario: Unauthenticated request to the document permissions endpoint returns 401
    Given no authentication token is present
    When a POST request is made to /api/documents/doc-abc123/permissions
      with body { targetUserId: "user-400", permission: "can-view" }
      and no Authorization header or session cookie
    Then the server responds with HTTP 401 Unauthorized
    And the response body contains { error: "authentication required" }
    And no ACL change is made
```

**Test Data:**
- Endpoint: `POST /api/documents/doc-abc123/permissions`
- Payload: `{ targetUserId: "user-400", permission: "can-view" }`
- Expected: `HTTP 401`

**Preconditions:**
- No valid session for the request

---

### T-AUTH-2.1: Authenticated commenter or viewer attempting permission modification returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Document Permissions Authorization

  Scenario: Authenticated commenter attempts to grant a permission via API — rejected with 403
    Given an authenticated user { id: "user-202", permission: "can-comment" } has a valid session token
    When a POST request is made to /api/documents/doc-abc123/permissions
      with the can-comment authorization token
      and body { targetUserId: "user-400", permission: "can-edit" }
    Then the server responds with HTTP 403 Forbidden
    And the response body contains { error: "requires can-edit" }
    And no ACL entry is created or modified
    And the audit log records: { attemptedBy: "user-202", status: "denied", reason: "insufficient-permission" }
```

**Test Data:**
- Requesting user: `{ id: "user-202", token: "<valid-can-comment-token>", permission: "can-comment" }`
- Endpoint: `POST /api/documents/doc-abc123/permissions`
- Payload: `{ targetUserId: "user-400", permission: "can-edit" }`
- Expected: `HTTP 403, { error: "requires can-edit" }`

**Preconditions:**
- User is authenticated with a valid can-comment session token
- Server enforces can-edit check for all permission management operations

---

That's the complete test specification for all 4 stories in batch 07. Summary of what was generated:

| Story | ACs covered | Test cases | Auth tests |
|-------|------------|-----------|-----------|
| COMM-03 | 12 ACs | T-1.1 through T-10.1 + T-NEG-1 (13 cases) | T-AUTH-1.1, T-AUTH-2.1 |
| COMM-04 | 10 ACs | T-1.1 through T-8.1 (12 cases) | T-AUTH-1.1, T-AUTH-2.1 |
| NOTIF-01 | 11 ACs | T-1.1 through T-9.1 (14 cases) | T-AUTH-1.1, T-AUTH-2.1 |
| PERM-01 | 11 ACs | T-1.1 through T-9.2 (13 cases) | T-AUTH-1.1, T-AUTH-2.1 |

Every AC maps to at least one test, every test maps back to an AC, and mandatory 401/403 authorization tests are present for all four stories.


# Test Specifications: PERM-02 — Permission enforcement in the editor

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, edge-case |
| AC-2 | T-2.1, T-2.2 | happy-path, edge-case |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1, T-4.2 | security |
| AC-5 | T-5.1, T-5.2 | security |
| AC-6 | T-6.1, T-6.2 | error-handling |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1, T-8.2 | edge-case |
| AC-9 | T-9.1, T-9.2 | security |
| AC-10 | T-10.1, T-10.2 | edge-case |
| AC-AUTH-1 | T-A1.1, T-A1.2 | security |
| AC-AUTH-2 | T-A2.1 | security |

---

## Test Cases

### T-1.1: View-only user sees read-only editor on document load
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Permission enforcement in the editor

  Scenario: View-only user opens a document and sees read-only mode
    Given an authenticated user "viewer@example.com" with role "viewer" (view-only permission) exists
    And document "doc-abc123" belongs to workspace "ws-001"
    And "viewer@example.com" has view-only ACL entry on "doc-abc123"
    When "viewer@example.com" navigates to "/documents/doc-abc123"
    Then the document editor loads successfully
    And the editor container has attribute aria-readonly="true"
    And no editing toolbar is present in the DOM
    And the document body has contenteditable="false"
    And document text is selectable (user-select is not "none")
    And no cursor blink animation is visible on the editor
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "viewer", status: "active", userId: "usr-viewer-001" }`
- Document: `{ id: "doc-abc123", workspaceId: "ws-001", title: "Q3 Strategy Brief", contentLength: 1500 }`
- ACL entry: `{ documentId: "doc-abc123", userId: "usr-viewer-001", permission: "view-only" }`

**Preconditions:**
- User is authenticated (valid session token)
- Document exists and is not deleted
- ACL entry is persisted in the database

---

### T-1.2: View-only user cannot type in the document body
**Maps to:** AC-1
**Category:** edge-case

```gherkin
  Scenario: View-only user attempts to type in the document body
    Given an authenticated user "viewer@example.com" with view-only permission on document "doc-abc123"
    When the user clicks inside the document body
    And the user presses keys "Hello World"
    Then no characters are inserted into the document content
    And the document body text remains unchanged
    And the server receives no write operation for "doc-abc123"
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "viewer", userId: "usr-viewer-001" }`
- Keypresses: `"Hello World"` (11 characters)

**Preconditions:**
- User is authenticated with view-only permission
- Document is loaded and displayed in read-only mode

---

### T-2.1: Can-comment user sees comment-only controls
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Can-comment user opens a document and sees comment-only toolbar
    Given an authenticated user "commenter@example.com" with can-comment permission on document "doc-abc123"
    When "commenter@example.com" navigates to "/documents/doc-abc123"
    Then the document editor loads successfully
    And the toolbar contains a "Add Comment" button
    And the toolbar contains a "Suggestion Mode" toggle
    And the toolbar does NOT contain a bold button
    And the toolbar does NOT contain an italic button
    And the toolbar does NOT contain a heading selector
    And the toolbar does NOT contain a list insert button
    And the document body text is not directly editable via keyboard
```

**Test Data:**
- User: `{ email: "commenter@example.com", role: "commenter", userId: "usr-commenter-001" }`
- ACL entry: `{ documentId: "doc-abc123", userId: "usr-commenter-001", permission: "can-comment" }`

**Preconditions:**
- User is authenticated
- Document exists with content
- ACL entry grants can-comment permission

---

### T-2.2: Can-comment user cannot directly type in document body
**Maps to:** AC-2
**Category:** edge-case

```gherkin
  Scenario: Can-comment user attempts direct body text editing
    Given an authenticated user "commenter@example.com" with can-comment permission on document "doc-abc123"
    And the document is open and the comment-only toolbar is visible
    When the user clicks in the document body
    And the user presses keys "Unauthorized edit"
    Then no characters are inserted into the document body
    And the server receives no body-text write operation
```

**Test Data:**
- User: `{ email: "commenter@example.com", userId: "usr-commenter-001" }`
- Keypresses: `"Unauthorized edit"` (17 characters)

**Preconditions:**
- User is authenticated with can-comment permission
- Document is loaded and comment-only toolbar is visible

---

### T-3.1: Can-edit user sees full editing toolbar
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Can-edit user opens a document and sees the full editor
    Given an authenticated user "editor@example.com" with can-edit permission on document "doc-abc123"
    When "editor@example.com" navigates to "/documents/doc-abc123"
    Then the document editor loads successfully
    And the toolbar contains a bold button
    And the toolbar contains an italic button
    And the toolbar contains a heading selector
    And the toolbar contains a bullet list button
    And the toolbar contains an ordered list button
    And the toolbar contains a code block button
    And the toolbar contains a link insert button
    And the document body has contenteditable="true"
    And the user can place the cursor in the document body
```

**Test Data:**
- User: `{ email: "editor@example.com", role: "editor", userId: "usr-editor-001" }`
- ACL entry: `{ documentId: "doc-abc123", userId: "usr-editor-001", permission: "can-edit" }`

**Preconditions:**
- User is authenticated with can-edit permission
- Document exists with content

---

### T-4.1: Server rejects write operation from view-only user via UI path
**Maps to:** AC-4
**Category:** security

```gherkin
  Scenario: View-only user's fabricated write operation is rejected by server
    Given an authenticated user "viewer@example.com" with view-only permission on document "doc-abc123"
    When a PATCH request is submitted to "POST /api/documents/doc-abc123/ops" with a valid write operation payload
    And the request carries the valid session token for "viewer@example.com"
    Then the server responds with status 403 Forbidden
    And the response body contains "You do not have permission to edit this document"
    And the document content in the database is unchanged
```

**Test Data:**
- User: `{ email: "viewer@example.com", userId: "usr-viewer-001", sessionToken: "tok-viewer-valid" }`
- Write payload: `{ type: "insert", position: 42, content: "injected text", documentId: "doc-abc123" }`

**Preconditions:**
- User has a valid authentication session
- User has only view-only ACL entry on the document
- Document exists and has content

---

### T-4.2: Server rejects write operation from view-only user via direct API call
**Maps to:** AC-4
**Category:** security

```gherkin
  Scenario: Direct API write bypassing UI is rejected for view-only user
    Given "viewer@example.com" is authenticated with a valid session token
    And "viewer@example.com" has view-only permission on document "doc-abc123"
    When a raw HTTP POST is made to "/api/documents/doc-abc123/ops" with a crafted operation payload
    Then the server returns 403 Forbidden
    And no operation is applied to the document
    And the document CRDT state is identical before and after the request
```

**Test Data:**
- Direct API call: `curl -X POST /api/documents/doc-abc123/ops -H "Authorization: Bearer tok-viewer-valid" -d '{"type":"delete","from":0,"to":10}'`
- Expected response: `{ "error": "forbidden", "message": "You do not have permission to edit this document" }`

**Preconditions:**
- Valid session token for a view-only user is obtained
- Document exists with at least 10 characters of content

---

### T-5.1: Server rejects body-text edit from can-comment user
**Maps to:** AC-5
**Category:** security

```gherkin
  Scenario: Can-comment user submits a direct body-text edit operation
    Given an authenticated user "commenter@example.com" with can-comment permission on document "doc-abc123"
    When a POST request is submitted to "/api/documents/doc-abc123/ops" with a direct body-text insert operation
    Then the server responds with status 403 Forbidden
    And the response body contains "You have comment-only access to this document"
    And the document body content in the database is unchanged
```

**Test Data:**
- User: `{ email: "commenter@example.com", userId: "usr-commenter-001", sessionToken: "tok-commenter-valid" }`
- Payload: `{ type: "insert", position: 10, content: "unauthorized body text", operationType: "body-edit" }`

**Preconditions:**
- User is authenticated with can-comment permission
- Document exists with content

---

### T-5.2: Can-comment user sees error message after rejected body edit attempt
**Maps to:** AC-5
**Category:** error-handling

```gherkin
  Scenario: UI displays error message when can-comment user's edit is rejected
    Given an authenticated user "commenter@example.com" with can-comment permission on document "doc-abc123"
    And the document is open with comment-only controls
    When the server returns 403 Forbidden for a body-text edit attempt
    Then the UI displays the message "You have comment-only access to this document"
    And the message is non-blocking (does not require modal dismissal)
    And the message disappears after 5 seconds or user dismissal
```

**Test Data:**
- User: `{ email: "commenter@example.com", userId: "usr-commenter-001" }`
- Error message exact text: `"You have comment-only access to this document"`

**Preconditions:**
- User has can-comment permission and document is loaded
- Server is configured to return 403 for body-text edits from this user

---

### T-6.1: View-only user sees message on attempted edit action
**Maps to:** AC-6
**Category:** error-handling

```gherkin
  Scenario: View-only user clicks in document body and receives access message
    Given an authenticated user "viewer@example.com" with view-only permission on document "doc-abc123"
    And the document is loaded in read-only mode
    When the user clicks within the document body area
    Then a non-blocking message appears: "You have view-only access to this document"
    And the message does not block document viewing or scrolling
    And no edit cursor is placed in the document
```

**Test Data:**
- User: `{ email: "viewer@example.com", userId: "usr-viewer-001" }`
- Expected message: `"You have view-only access to this document"`
- Click target: document body area at approximate position (400, 300)

**Preconditions:**
- User is authenticated with view-only permission
- Document is fully loaded in read-only mode

---

### T-6.2: Can-comment user sees message on direct body edit attempt
**Maps to:** AC-6
**Category:** error-handling

```gherkin
  Scenario: Can-comment user attempts to type in document body and sees access message
    Given an authenticated user "commenter@example.com" with can-comment permission on document "doc-abc123"
    And the document is loaded with comment-only controls
    When the user attempts to type directly in the document body
    Then a non-blocking message appears: "You have comment-only access to this document"
    And no text is inserted into the document body
```

**Test Data:**
- User: `{ email: "commenter@example.com", userId: "usr-commenter-001" }`
- Expected message: `"You have comment-only access to this document"`

**Preconditions:**
- User is authenticated with can-comment permission
- Document is loaded with comment-only toolbar

---

### T-7.1: Permission re-checked at document load reflects current ACL
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: User's permission was downgraded while they were offline; re-opening reflects new permission
    Given user "editor@example.com" previously had can-edit permission on document "doc-abc123"
    And an admin has downgraded "editor@example.com"'s permission to view-only since their last session
    When "editor@example.com" navigates to "/documents/doc-abc123" in a new session
    Then the editor loads in read-only mode
    And no editing toolbar is present
    And the server's ACL lookup for "usr-editor-001" on "doc-abc123" returns "view-only"
    And no cached can-edit state is applied
```

**Test Data:**
- User: `{ email: "editor@example.com", userId: "usr-editor-001" }`
- Previous permission: `can-edit`
- Current ACL entry: `{ userId: "usr-editor-001", documentId: "doc-abc123", permission: "view-only", updatedAt: "2026-06-14T10:00:00Z" }`

**Preconditions:**
- Admin has updated ACL entry for the user before this test
- User has no cached session on this document (fresh load)
- Client-side localStorage/sessionStorage is cleared of any prior permission state

---

### T-8.1: Permission re-validated on WebSocket reconnect — downgraded user transitions to restricted mode
**Maps to:** AC-8
**Category:** edge-case

```gherkin
  Scenario: User reconnects to WebSocket after permission was downgraded; editor transitions
    Given "editor@example.com" had an active can-edit WebSocket session on document "doc-abc123"
    And the WebSocket connection was lost (network drop)
    And during the offline period, an admin downgraded the user's permission to view-only
    When the client reconnects and re-establishes the WebSocket connection to "doc-abc123"
    Then the server re-validates "usr-editor-001"'s permission at WebSocket join
    And the server response signals permission level "view-only"
    And the editor transitions to read-only mode (toolbar hidden, contenteditable="false")
    And the user is not able to submit any write operations
```

**Test Data:**
- User: `{ email: "editor@example.com", userId: "usr-editor-001", wsToken: "ws-tok-editor-001" }`
- New ACL: `{ permission: "view-only" }` set during offline window

**Preconditions:**
- User was actively editing before disconnection
- Admin has updated the ACL before the reconnect attempt
- WebSocket server is configured to re-validate permission on join

---

### T-8.2: WebSocket reconnect with unchanged permission — editor mode preserved
**Maps to:** AC-8
**Category:** edge-case

```gherkin
  Scenario: User reconnects to WebSocket with same permission level — no mode change
    Given "editor@example.com" had a can-edit WebSocket session on document "doc-abc123"
    And the connection was briefly lost and re-established
    And no permission change occurred during the offline window
    When the WebSocket reconnect completes
    Then the server validates "usr-editor-001"'s permission as still "can-edit"
    And the editor remains in full-edit mode
    And the user can continue editing without interruption
```

**Test Data:**
- User: `{ email: "editor@example.com", userId: "usr-editor-001" }`
- ACL: unchanged at `can-edit`

**Preconditions:**
- User was actively connected before the brief disconnect
- No ACL changes occurred during the offline window

---

### T-9.1: Server checks ACL on every write operation — defense in depth
**Maps to:** AC-9
**Category:** security

```gherkin
  Scenario: Write operation is rejected server-side even if client bypasses UI restrictions
    Given "editor@example.com" has an active session token from when they had can-edit permission
    And their permission has since been changed to view-only in the ACL
    And the client UI has not yet refreshed to reflect the downgrade
    When a write operation is submitted using the still-valid session token
    Then the server performs an ACL lookup before applying the operation
    And the server finds the current permission is "view-only"
    And the server returns 403 Forbidden
    And the write operation is NOT applied to the document
```

**Test Data:**
- User session token: `"tok-editor-stale-001"` (issued when user was can-edit)
- Current ACL: `{ permission: "view-only" }`
- Write operation: `{ type: "insert", position: 5, content: "X", documentId: "doc-abc123" }`

**Preconditions:**
- Session token is still valid (not expired)
- ACL has been updated to view-only AFTER the token was issued
- Server does not cache permission from token issue time

---

### T-9.2: Concurrent write operations each individually validated server-side
**Maps to:** AC-9
**Category:** security

```gherkin
  Scenario: Rapid successive write operations are each validated against the ACL
    Given "editor@example.com" has can-edit permission on document "doc-abc123"
    When the user submits 5 rapid write operations in quick succession
    Then the server validates each of the 5 operations individually against the ACL
    And all 5 operations are applied (permission is valid for all)
    And server logs show 5 separate ACL check entries
```

**Test Data:**
- Operations: 5x `{ type: "insert", position: [1,2,3,4,5], content: ["A","B","C","D","E"] }`
- Expected ACL check count: 5

**Preconditions:**
- User has valid can-edit session
- Server-side operation handler is instrumented to log ACL checks

---

### T-10.1: Public link viewer sees read-only editor identical to view-only permission
**Maps to:** AC-10
**Category:** edge-case

```gherkin
  Scenario: Public link visitor sees read-only editor with no commenting controls
    Given document "doc-abc123" has an active public link token "pub-tok-xyz789"
    When an unauthenticated browser navigates to "/share/pub-tok-xyz789"
    Then the document renders in read-only mode
    And no editing toolbar is present
    And no comment button is present
    And no suggestion mode toggle is present
    And document text is selectable but not editable
    And the editor container has aria-readonly="true"
```

**Test Data:**
- Public link token: `"pub-tok-xyz789"`
- Document: `{ id: "doc-abc123", title: "Q3 Strategy Brief" }`
- Browser: unauthenticated (no session cookie, no auth token)

**Preconditions:**
- Public link token is valid and active
- Document exists and is not deleted

---

### T-10.2: Public link viewer cannot submit write or comment operations via API
**Maps to:** AC-10
**Category:** security

```gherkin
  Scenario: Public viewer attempts API write using public link token — rejected
    Given a public link token "pub-tok-xyz789" is valid for document "doc-abc123"
    When a POST request is made to "/api/documents/doc-abc123/ops" with the public link token as auth
    Then the server returns 403 Forbidden
    And the operation is not applied
```

**Test Data:**
- Token type: public link token (not a user session token)
- Endpoint: `POST /api/documents/doc-abc123/ops`
- Payload: `{ type: "insert", position: 0, content: "injected" }`

**Preconditions:**
- Public link token is valid
- Server distinguishes between "public-link" and "authenticated user" token classes

---

## Authorization Tests

### T-A1.1: Unauthenticated request to load document returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated user with no token attempts to load a document
    Given no authentication token is present in the request headers
    And no valid public link token is present in the URL
    When a GET request is made to "/api/documents/doc-abc123"
    Then the server returns 401 Unauthorized
    And the response body contains "Authentication required"
    And no document content is returned
    And the client is redirected to the login page
```

**Test Data:**
- Request: `GET /api/documents/doc-abc123` with no `Authorization` header and no public token
- Expected response: `{ "error": "unauthorized", "message": "Authentication required" }`

**Preconditions:**
- Document "doc-abc123" exists
- No session cookie or bearer token is present in the request

---

### T-A1.2: Unauthenticated write operation returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated request to write to document returns 401
    Given no authentication token is present
    When a POST request is made to "/api/documents/doc-abc123/ops" with a write payload
    Then the server returns 401 Unauthorized
    And the write operation is not applied
```

**Test Data:**
- Request: `POST /api/documents/doc-abc123/ops` with no auth header
- Payload: `{ type: "insert", position: 0, content: "test" }`

**Preconditions:**
- No session token or cookie present

---

### T-A2.1: Authenticated user with no document permission returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated user with no ACL entry for the document is rejected
    Given an authenticated user "stranger@example.com" with a valid session token
    And "stranger@example.com" has no ACL entry for document "doc-abc123"
    When a GET request is made to "/api/documents/doc-abc123"
    Then the server returns 403 Forbidden
    And the response body contains "You don't have access to this document"
    And no document content is returned
```

**Test Data:**
- User: `{ email: "stranger@example.com", userId: "usr-stranger-001", sessionToken: "tok-stranger-valid" }`
- ACL entries for "doc-abc123": none for "usr-stranger-001"
- Expected response: `{ "error": "forbidden", "message": "You don't have access to this document" }`

**Preconditions:**
- User is authenticated with a valid session
- User has no ACL entry (not even view-only) for the target document

---

---

# Test Specifications: PERM-03 — Public read-only share links

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, edge-case |
| AC-2 | T-2.1, T-2.2 | happy-path, security |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1, T-5.2 | security |
| AC-6 | T-6.1, T-6.2 | happy-path, edge-case |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1 | error-handling |
| AC-9 | T-9.1 | edge-case |
| AC-AUTH-1 | T-A1.1 | security |
| AC-AUTH-2 | T-A2.1, T-A2.2 | security |

---

## Test Cases

### T-1.1: Editor generates a public link and sees the URL in Share UI
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Public read-only share links

  Scenario: Editor generates a public link for the first time
    Given an authenticated user "editor@example.com" with can-edit permission on document "doc-abc123"
    And no public link currently exists for "doc-abc123"
    When the editor opens the Share UI for "doc-abc123"
    And clicks "Get public link"
    Then a unique opaque URL token is generated and stored for "doc-abc123"
    And the Share UI displays a full public URL in the format "https://app.example.com/share/<token>"
    And a "Copy to clipboard" button is present next to the URL
    And the token is cryptographically random with at least 128 bits of entropy
```

**Test Data:**
- User: `{ email: "editor@example.com", userId: "usr-editor-001", sessionToken: "tok-editor-valid" }`
- Document: `{ id: "doc-abc123", workspaceId: "ws-001" }`
- Expected URL pattern: `https://app.example.com/share/[a-f0-9-]{36,}` (UUID v4 or equivalent)

**Preconditions:**
- User is authenticated with can-edit permission
- No existing public link for this document
- Share UI is accessible from the document view

---

### T-1.2: Generating a new public link revokes the previous one
**Maps to:** AC-1
**Category:** edge-case

```gherkin
  Scenario: Editor generates a second public link, invalidating the first
    Given an authenticated user "editor@example.com" with can-edit permission on document "doc-abc123"
    And a public link with token "pub-tok-old-111" exists for "doc-abc123"
    When the editor opens the Share UI and clicks "Get public link" again
    Then a new token "pub-tok-new-222" is generated and stored
    And the old token "pub-tok-old-111" is invalidated in the database
    And the Share UI displays the new URL containing "pub-tok-new-222"
    And a GET request to "/share/pub-tok-old-111" now returns 404
```

**Test Data:**
- Existing token: `"pub-tok-old-111"`
- New token: any new UUID (captured from response)

**Preconditions:**
- An existing active public link "pub-tok-old-111" is stored for "doc-abc123"
- User has can-edit permission

---

### T-2.1: Public link grants read-only view to unauthenticated browser
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Unauthenticated user opens a document via valid public link
    Given document "doc-abc123" has an active public link token "pub-tok-xyz789"
    And the document has content "Project roadmap for Q3..."
    When an unauthenticated browser navigates to "/share/pub-tok-xyz789"
    Then the page loads successfully with HTTP 200
    And no login prompt or redirect to login occurs
    And the document content "Project roadmap for Q3..." is displayed
    And the editor is in read-only mode (no editing affordances)
    And no editing toolbar is present
    And no comment controls are present
    And no export button is present
```

**Test Data:**
- Public token: `"pub-tok-xyz789"`
- Document content preview: `"Project roadmap for Q3..."`
- Browser state: no cookies, no Authorization header, no session

**Preconditions:**
- Public link token is active and associated with "doc-abc123"
- Document exists and is not deleted

---

### T-2.2: Public link viewer cannot access document editing endpoints
**Maps to:** AC-2
**Category:** security

```gherkin
  Scenario: Public link token cannot be used to authenticate editing API endpoints
    Given public link token "pub-tok-xyz789" is valid for document "doc-abc123"
    When a POST request is made to "/api/documents/doc-abc123/ops" using "pub-tok-xyz789" as auth bearer
    Then the server returns 403 Forbidden
    And the response does not include any document CRDT or edit session data
```

**Test Data:**
- Token used as bearer: `pub-tok-xyz789`
- Endpoint: `POST /api/documents/doc-abc123/ops`
- Payload: `{ type: "insert", position: 0, content: "injected" }`

**Preconditions:**
- Public link token is valid
- Server enforces that public tokens are scope-restricted to read-only access

---

### T-3.1: Public link access is logged with required fields
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Access log entry is created when public link is visited
    Given document "doc-abc123" has an active public link token "pub-tok-xyz789"
    When a browser at IP "203.0.113.42" navigates to "/share/pub-tok-xyz789"
    Then the document loads successfully
    And an access log entry exists containing:
      | field         | value               |
      | documentId    | doc-abc123          |
      | token         | pub-tok-xyz789      |
      | accessedAt    | (current timestamp) |
      | ipAddress     | 203.0.113.42        |
    And the log entry is created within 1 second of the page load
```

**Test Data:**
- Requester IP: `203.0.113.42` (RFC 5737 documentation range)
- Token: `"pub-tok-xyz789"`
- Document: `"doc-abc123"`

**Preconditions:**
- Public link is active
- Access logging system is running
- Test can inspect the access log table/store after the request

---

### T-4.1: Public viewer does not appear in the presence list
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: Authenticated editor cannot see public viewer in the presence sidebar
    Given document "doc-abc123" has an active public link token "pub-tok-xyz789"
    And authenticated user "editor@example.com" is viewing document "doc-abc123"
    And an unauthenticated browser is also viewing "doc-abc123" via the public link
    When "editor@example.com" looks at the presence sidebar
    Then the presence sidebar does not show any entry for the public viewer
    And the presence list only shows authenticated users (in this case: "editor@example.com")
    And no cursor or name label is rendered for the public viewer's session
```

**Test Data:**
- Editor: `{ email: "editor@example.com", userId: "usr-editor-001" }`
- Public viewer: unauthenticated session via `"pub-tok-xyz789"`

**Preconditions:**
- Both sessions are active simultaneously
- WebSocket presence broadcast is running
- Public viewer session joined within the last 30 seconds

---

### T-5.1: Public viewer cannot add comments via UI or API
**Maps to:** AC-5
**Category:** security

```gherkin
  Scenario: Public viewer has no comment controls and API call returns 403
    Given document "doc-abc123" has an active public link "pub-tok-xyz789"
    When an unauthenticated user views the document at "/share/pub-tok-xyz789"
    Then no "Add Comment" button is rendered in the UI
    When a POST request is made to "/api/documents/doc-abc123/comments" using the public token
    Then the server returns 403 Forbidden
```

**Test Data:**
- Public token: `"pub-tok-xyz789"`
- Comment payload: `{ content: "Test comment", position: 10, documentId: "doc-abc123" }`
- Expected response: `{ "error": "forbidden", "message": "Comments require an authenticated account" }`

**Preconditions:**
- Public link is active
- Document exists with content

---

### T-5.2: Public viewer cannot trigger export via UI or API
**Maps to:** AC-5
**Category:** security

```gherkin
  Scenario: Public viewer has no export option and export API returns 403
    Given document "doc-abc123" has an active public link "pub-tok-xyz789"
    When an unauthenticated user views the document at "/share/pub-tok-xyz789"
    Then no "Export" button or menu item is rendered in the UI
    When a GET request is made to "/api/documents/doc-abc123/export?format=pdf" using the public token
    Then the server returns 403 Forbidden
```

**Test Data:**
- Public token: `"pub-tok-xyz789"`
- Export endpoint: `GET /api/documents/doc-abc123/export?format=pdf`

**Preconditions:**
- Public link is active
- Export feature is available to authenticated editors

---

### T-6.1: Editor revokes a public link — old URL returns 404
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Editor revokes a public link and subsequent access returns 404
    Given an authenticated user "editor@example.com" with can-edit permission on document "doc-abc123"
    And a public link with token "pub-tok-xyz789" exists for "doc-abc123"
    When the editor opens the Share UI and clicks "Revoke link"
    Then the token "pub-tok-xyz789" is invalidated immediately in the database
    And the Share UI no longer shows a public URL for "doc-abc123"
    And a GET request to "/share/pub-tok-xyz789" returns 404
    And the 404 response body contains "This link is no longer valid"
    And no document content is returned in the 404 response
```

**Test Data:**
- Token to revoke: `"pub-tok-xyz789"`
- Expected 404 body: `{ "error": "not_found", "message": "This link is no longer valid" }`

**Preconditions:**
- Public link is active before revocation
- User has can-edit permission

---

### T-6.2: Active public viewer session is notified on link revocation
**Maps to:** AC-6
**Category:** edge-case

```gherkin
  Scenario: Public viewer currently viewing the document is notified when link is revoked
    Given document "doc-abc123" has an active public link "pub-tok-xyz789"
    And an unauthenticated browser is actively viewing "doc-abc123" via the public link
    When "editor@example.com" revokes the public link
    Then the active public viewer's session receives a WebSocket or server-sent event notification
    And the browser displays: "This document is no longer publicly accessible"
    And the public viewer cannot continue to read or reload the document
```

**Test Data:**
- Active public viewer session: WebSocket connection established via `"pub-tok-xyz789"`
- Revocation actor: `{ email: "editor@example.com", userId: "usr-editor-001" }`
- Expected notification message: `"This document is no longer publicly accessible"`

**Preconditions:**
- Public viewer has an active WebSocket/SSE connection to the document
- Revocation event propagates via the same real-time channel

---

### T-7.1: Generating a new public link revokes the previous token
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: Editor generates a replacement public link; old link becomes invalid
    Given a public link with token "pub-tok-old-111" is active for document "doc-abc123"
    And "editor@example.com" has can-edit permission
    When the editor clicks "Get public link" in the Share UI (generating a replacement)
    Then a new token "pub-tok-new-222" is generated and stored
    And the old token "pub-tok-old-111" is invalidated in the database
    And the Share UI shows the URL containing "pub-tok-new-222"
    And a GET request to "/share/pub-tok-old-111" returns 404
    And a GET request to "/share/pub-tok-new-222" returns 200
```

**Test Data:**
- Old token: `"pub-tok-old-111"`
- New token: captured from API response

**Preconditions:**
- Active public link "pub-tok-old-111" exists for "doc-abc123"

---

### T-8.1: Revoked or never-existing public link token returns 404
**Maps to:** AC-8
**Category:** error-handling

```gherkin
  Scenario: User navigates to a revoked or invalid public link URL
    Given token "pub-tok-revoked-999" is either revoked or was never issued
    When any browser navigates to "/share/pub-tok-revoked-999"
    Then the server returns 404 Not Found
    And the page displays: "This link is no longer valid or doesn't exist"
    And no document content or metadata is included in the response
    And the response does not reveal whether a document at any ID exists
```

**Test Data:**
- Invalid token: `"pub-tok-revoked-999"` (revoked) and `"pub-tok-never-existed-000"` (never issued)
- Expected response body: `{ "message": "This link is no longer valid or doesn't exist" }`

**Preconditions:**
- Token "pub-tok-revoked-999" was previously revoked
- Token "pub-tok-never-existed-000" was never inserted into the database

---

### T-9.1: Document deleted while public viewer is active — session terminated
**Maps to:** AC-9
**Category:** edge-case

```gherkin
  Scenario: Editor deletes a document; active public viewer session is terminated
    Given document "doc-abc123" has an active public link "pub-tok-xyz789"
    And an unauthenticated browser is actively viewing "doc-abc123" via the public link
    When an authorized editor deletes document "doc-abc123"
    Then the public viewer's session is terminated (WebSocket/SSE connection closed)
    And the browser displays: "This document has been deleted"
    And a subsequent GET request to "/share/pub-tok-xyz789" returns 404
    And no document content is accessible via any route after deletion
```

**Test Data:**
- Document: `{ id: "doc-abc123" }` (being deleted)
- Public token: `"pub-tok-xyz789"`
- Deletion actor: `{ email: "editor@example.com", userId: "usr-editor-001" }` with can-edit permission
- Expected browser message: `"This document has been deleted"`

**Preconditions:**
- Public viewer has an active real-time connection to the document
- Document exists before deletion
- Editor has permission to delete the document

---

## Authorization Tests

### T-A1.1: Valid public link token grants access without authentication — 200 returned
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated user with valid public token receives 200 OK
    Given document "doc-abc123" has an active public link token "pub-tok-xyz789"
    When an unauthenticated GET request is made to "/share/pub-tok-xyz789"
    Then the server returns 200 OK
    And the response contains the document content in read-only mode
    And no 401 or redirect to login occurs
```

**Test Data:**
- Token: `"pub-tok-xyz789"` (valid and active)
- Request: `GET /share/pub-tok-xyz789` with no Authorization header

**Preconditions:**
- Public link is active
- Document exists

---

### T-A2.1: Invalid token returns 404 — not 403 — to avoid confirming document existence
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Invalid public link token returns 404 rather than 403
    Given token "pub-tok-invalid-000" is not valid (revoked or never issued)
    When a GET request is made to "/share/pub-tok-invalid-000"
    Then the server returns 404 Not Found (NOT 403 Forbidden)
    And the response body does not include any document ID, title, or metadata
    And no information about whether a document exists at any ID is leaked
```

**Test Data:**
- Token: `"pub-tok-invalid-000"` (not present in token store)
- Expected status: `404` (not `401` or `403`)

**Preconditions:**
- Token is not present in the public link token store

---

### T-A2.2: Revoked token returns 404 — not 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Revoked public link token returns 404 to avoid confirming document existence
    Given token "pub-tok-old-111" was previously valid but has been revoked
    When a GET request is made to "/share/pub-tok-old-111"
    Then the server returns 404 Not Found
    And the response body contains "This link is no longer valid or doesn't exist"
    And no document content or existence confirmation is included
```

**Test Data:**
- Token: `"pub-tok-old-111"` (in database with status `revoked`)
- Expected: `404` with message `"This link is no longer valid or doesn't exist"`

**Preconditions:**
- Token exists in the database with `revoked = true`

---

---

# Test Specifications: TMPL-01 — Admin creates a document template

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, error-handling |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path, error-handling |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1 | edge-case |
| AC-7 | T-7.1, T-7.2 | happy-path, edge-case |
| AC-8 | T-8.1 | error-handling |
| AC-9 | T-9.1 | edge-case |
| AC-10 | T-10.1, T-10.2 | error-handling, security |
| AC-AUTH-1 | T-A1.1 | security |
| AC-AUTH-2 | T-A2.1, T-A2.2 | security |

---

## Test Cases

### T-1.1: Admin accesses Templates management page — sees existing templates
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Admin creates a document template

  Scenario: Admin navigates to Templates management and sees existing templates
    Given an authenticated user "admin@example.com" with the "admin" role
    And the following templates exist in the global library:
      | name           | category      | description              | lastModified         |
      | Project Brief  | Planning      | Standard project brief   | 2026-06-01T10:00:00Z |
      | Meeting Notes  | Communication | Meeting notes template   | 2026-06-10T09:00:00Z |
    When the admin navigates to workspace settings
    And clicks "Templates"
    Then the Templates management page loads
    And both templates are displayed with name, category, description, and last-modified date
    And no server error or blank page is shown
```

**Test Data:**
- Admin: `{ email: "admin@example.com", userId: "usr-admin-001", role: "admin" }`
- Existing templates: 2 (as shown in table above)

**Preconditions:**
- Admin is authenticated
- Templates exist in the global library before the test

---

### T-1.2: Admin sees empty state when no templates exist
**Maps to:** AC-1
**Category:** error-handling

```gherkin
  Scenario: Admin sees empty state on Templates page when no templates exist
    Given an authenticated admin "admin@example.com"
    And no templates exist in the global library
    When the admin navigates to the Templates management page
    Then an empty state message is shown (e.g., "No templates yet")
    And a "New Template" button is present
    And no error or crash occurs
```

**Test Data:**
- Admin: `{ email: "admin@example.com", userId: "usr-admin-001", role: "admin" }`
- Template count: 0

**Preconditions:**
- Admin is authenticated
- Template library is empty

---

### T-2.1: Admin creates a new template using the rich text editor
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Admin opens the new template editor with full rich text capability
    Given an authenticated admin "admin@example.com" is on the Templates management page
    When the admin clicks "New Template"
    Then a template editor opens
    And the editor includes a bold button
    And the editor includes an italic button
    And the editor includes a heading selector
    And the editor includes a bullet list button
    And the editor includes a code block button
    And the editor includes a table insert control
    And the editor includes a link insert button
    And the editor includes an image insert button
```

**Test Data:**
- Admin: `{ email: "admin@example.com", userId: "usr-admin-001", role: "admin" }`

**Preconditions:**
- Admin is authenticated
- Admin is on the Templates management page

---

### T-3.1: Admin sets template metadata — name, description, category — and saves
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Admin fills in template metadata and verifies it persists
    Given an authenticated admin is in the template editor for a new template
    When the admin enters name "Product Spec Template"
    And enters description "Standard format for product specifications"
    And enters category tag "Product"
    And adds body content "## Overview\n\nDescribe the product here."
    And clicks "Save Template"
    Then the template is saved with all three metadata fields
    And a GET request to "/api/templates/<new-id>" returns:
      | field       | value                                          |
      | name        | Product Spec Template                          |
      | description | Standard format for product specifications     |
      | category    | Product                                        |
    And the template editor closes and the admin is on the Templates management list
```

**Test Data:**
- Template name: `"Product Spec Template"`
- Description: `"Standard format for product specifications"`
- Category: `"Product"`
- Body: `"## Overview\n\nDescribe the product here."`

**Preconditions:**
- Admin is in the template editor
- Template library accepts new templates

---

### T-3.2: Admin saves template with only required name — optional fields omitted
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Admin saves template with only name; description and category are optional
    Given an authenticated admin is in the template editor
    When the admin enters name "Quick Notes" and leaves description and category blank
    And clicks "Save Template"
    Then the template is saved successfully
    And the stored template has name "Quick Notes", description null, category null
```

**Test Data:**
- Template name: `"Quick Notes"`
- Description: `null` (not provided)
- Category: `null` (not provided)

**Preconditions:**
- Admin is in the template editor

---

### T-4.1: Template saved to global library and immediately visible in template picker
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Newly saved template appears immediately in the template picker for editors
    Given admin "admin@example.com" saves a new template "Project Brief v2"
    When a separate authenticated editor "editor@example.com" opens the template picker via "New Document"
    Then "Project Brief v2" appears in the template picker list
    And the editor can select and use it immediately
    And no cache refresh or admin approval step is required
```

**Test Data:**
- Admin: `{ email: "admin@example.com", userId: "usr-admin-001" }`
- Editor: `{ email: "editor@example.com", userId: "usr-editor-002" }`
- Template name: `"Project Brief v2"`

**Preconditions:**
- Admin has just saved the template
- Editor is in a separate authenticated session

---

### T-5.1: Admin edits an existing template — changes persist
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Admin opens an existing template for editing and saves changes
    Given a template "Meeting Notes" with content "## Attendees\n\n## Agenda" exists in the library
    And admin "admin@example.com" navigates to the Templates management page
    When the admin clicks "Edit" on "Meeting Notes"
    Then the template editor opens with content "## Attendees\n\n## Agenda" pre-loaded
    And the admin changes the content to "## Attendees\n\n## Agenda\n\n## Action Items"
    And clicks "Save Template"
    Then the template is updated with the new content
    And the Templates management list shows "Meeting Notes" with an updated last-modified timestamp
```

**Test Data:**
- Template: `{ name: "Meeting Notes", content: "## Attendees\n\n## Agenda", id: "tmpl-001" }`
- Updated content: `"## Attendees\n\n## Agenda\n\n## Action Items"`

**Preconditions:**
- Template "Meeting Notes" exists in the library
- Admin is authenticated with admin role

---

### T-6.1: Editing a template does not change documents previously created from it
**Maps to:** AC-6
**Category:** edge-case

```gherkin
  Scenario: Existing document is unaffected when its source template is edited
    Given editor "editor@example.com" created document "doc-from-tmpl-001" from template "Meeting Notes" (id: "tmpl-001") one week ago
    And document "doc-from-tmpl-001" has content "## Attendees\n\n## Agenda" (copied at creation)
    When admin "admin@example.com" edits template "tmpl-001" to add "## Action Items"
    And saves the template
    Then the content of "doc-from-tmpl-001" remains "## Attendees\n\n## Agenda"
    And no "Action Items" section appears in the existing document
    And the document has no reference or link to the template
```

**Test Data:**
- Document: `{ id: "doc-from-tmpl-001", content: "## Attendees\n\n## Agenda", templateSourceId: null }`
- Template after edit: `{ id: "tmpl-001", content: "## Attendees\n\n## Agenda\n\n## Action Items" }`

**Preconditions:**
- Document was created from the template at least one step before the template edit
- Document is stored as an independent copy (no live link to template)

---

### T-7.1: Admin deletes a template — it disappears from the library and picker
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: Admin deletes a template and it is removed from the library and picker
    Given template "Deprecated Template" (id: "tmpl-deprecated-001") exists in the global library
    And admin "admin@example.com" is on the Templates management page
    When the admin clicks "Delete" on "Deprecated Template"
    And confirms the deletion in the confirmation dialog
    Then "Deprecated Template" is removed from the Templates management list
    And "Deprecated Template" no longer appears in the template picker for editors
    And a GET request to "/api/templates/tmpl-deprecated-001" returns 404
```

**Test Data:**
- Template: `{ id: "tmpl-deprecated-001", name: "Deprecated Template" }`

**Preconditions:**
- Template exists in the library
- No in-flight document creation is using this template (timing assumed clear)

---

### T-7.2: Deleting a template does not affect documents already created from it
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: Document created from a deleted template is unaffected
    Given template "Old Format" (id: "tmpl-old-001") exists in the library
    And document "doc-from-old-001" was created from "tmpl-old-001" and has content "## Section 1"
    When admin deletes template "tmpl-old-001"
    Then document "doc-from-old-001" still exists with content "## Section 1"
    And the document is fully editable for users with can-edit permission
```

**Test Data:**
- Template (deleted): `{ id: "tmpl-old-001", name: "Old Format" }`
- Document: `{ id: "doc-from-old-001", content: "## Section 1" }`

**Preconditions:**
- Both template and document exist before deletion
- Document has no live link to the template

---

### T-8.1: Saving template without a name shows inline validation error
**Maps to:** AC-8
**Category:** error-handling

```gherkin
  Scenario: Admin attempts to save template without entering a name
    Given admin "admin@example.com" is in the template editor with body content filled in
    And the template name field is empty
    When the admin clicks "Save Template"
    Then the save is blocked (no API call made)
    And an inline validation error appears next to the name field: "Template name is required"
    And the admin remains in the template editor with all content preserved
```

**Test Data:**
- Template name: `""` (empty string)
- Template body: `"## Section 1\n\nContent here."` (filled in)
- Expected validation message: `"Template name is required"`

**Preconditions:**
- Admin is in the template editor
- Name field is blank; other fields may have content

---

### T-9.1: Duplicate template name handling
**Maps to:** AC-9
**Category:** edge-case

```gherkin
  Scenario: Admin saves a template with a name that already exists
    Given a template named "Project Brief" (id: "tmpl-pb-001") already exists
    When admin "admin@example.com" attempts to save a new template also named "Project Brief"
    Then either:
      Option A: the save is blocked with error "A template with this name already exists"
      Option B: the save succeeds with a warning "Another template named 'Project Brief' already exists"
    And the behavior is consistent with the product decision for AC-9
```

**Test Data:**
- Existing template: `{ name: "Project Brief", id: "tmpl-pb-001" }`
- New template: `{ name: "Project Brief", content: "Different content" }`
- Note: Exact outcome (block vs. warn) is a product decision; test both branches

**Preconditions:**
- Template "Project Brief" exists in the library before the test
- Product team has resolved the AC-9 open question (test should be updated to reflect the decision)

---

### T-10.1: Non-admin user cannot see Templates management link in navigation
**Maps to:** AC-10
**Category:** error-handling

```gherkin
  Scenario: Non-admin editor does not see Templates management in workspace settings
    Given an authenticated user "editor@example.com" with the "editor" role (not admin)
    When the editor navigates to workspace settings
    Then no "Templates" link or menu item is present
    And the editor cannot navigate to the Templates management page via the UI
```

**Test Data:**
- User: `{ email: "editor@example.com", userId: "usr-editor-002", role: "editor" }`

**Preconditions:**
- User is authenticated with editor (non-admin) role

---

### T-10.2: Non-admin direct URL access to Templates management returns 403
**Maps to:** AC-10
**Category:** security

```gherkin
  Scenario: Non-admin attempts to access Templates management via direct URL
    Given an authenticated user "editor@example.com" with editor role
    When the editor navigates directly to "/admin/templates"
    Then the server returns 403 Forbidden
    And no template management UI is rendered
    And no template data is returned in the response
```

**Test Data:**
- User: `{ email: "editor@example.com", userId: "usr-editor-002", sessionToken: "tok-editor-valid" }`
- URL: `"/admin/templates"`

**Preconditions:**
- User is authenticated but lacks admin role

---

## Authorization Tests

### T-A1.1: Unauthenticated request to templates endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated request to templates management endpoint returns 401
    Given no authentication token is present in the request
    When a GET request is made to "/api/templates"
    Then the server returns 401 Unauthorized
    And no template data is returned
    And the response does not include any workspace or template metadata
```

**Test Data:**
- Request: `GET /api/templates` with no `Authorization` header
- Expected: `{ "error": "unauthorized", "message": "Authentication required" }`

**Preconditions:**
- No session or token is present

---

### T-A2.1: Non-admin POST to templates endpoint returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated non-admin user attempts to create a template via API
    Given an authenticated user "editor@example.com" with editor role
    When a POST request is made to "/api/templates" with a valid template payload
    Then the server returns 403 Forbidden
    And the response body contains "requires admin role"
    And no template is created in the database
```

**Test Data:**
- User: `{ email: "editor@example.com", userId: "usr-editor-002", sessionToken: "tok-editor-valid" }`
- Payload: `{ name: "Unauthorized Template", content: "## Test" }`
- Expected response: `{ "error": "forbidden", "message": "requires admin role" }`

**Preconditions:**
- User is authenticated with a valid session but not admin role

---

### T-A2.2: Non-admin DELETE to templates endpoint returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated non-admin user attempts to delete a template via API
    Given template "Project Brief" (id: "tmpl-pb-001") exists
    And user "editor@example.com" has editor role (not admin)
    When a DELETE request is made to "/api/templates/tmpl-pb-001"
    Then the server returns 403 Forbidden
    And the response body contains "requires admin role"
    And template "tmpl-pb-001" still exists in the database
```

**Test Data:**
- User: `{ email: "editor@example.com", userId: "usr-editor-002", sessionToken: "tok-editor-valid" }`
- Template: `{ id: "tmpl-pb-001", name: "Project Brief" }`

**Preconditions:**
- Template exists
- User is authenticated but not admin

---

---

# Test Specifications: TMPL-02 — Create a document from a template

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, edge-case |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path, edge-case |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1, T-6.2 | happy-path, error-handling |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1 | error-handling |
| AC-AUTH-1 | T-A1.1 | security |
| AC-AUTH-2 | T-A2.1 | security |

---

## Test Cases

### T-1.1: Template picker appears in New Document flow with browse and search options
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Create a document from a template

  Scenario: Editor clicks "New Document" and sees the template picker
    Given an authenticated user "editor@example.com" with can-edit permission on project "proj-001"
    And the following templates exist in the library:
      | name          | category  |
      | Project Brief | Planning  |
      | Meeting Notes | Meetings  |
      | Blank Doc     | N/A       |
    When "editor@example.com" clicks "New Document"
    Then a template picker dialog/step opens before the document editor
    And a category filter is present
    And a search field is present with label "Search templates"
    And a "Blank Document" option is present
    And both "Project Brief" and "Meeting Notes" are listed
```

**Test Data:**
- User: `{ email: "editor@example.com", userId: "usr-editor-001", sessionToken: "tok-editor-valid" }`
- Project: `{ id: "proj-001" }`
- Templates: 2 (as above)

**Preconditions:**
- User is authenticated with can-edit permission on the project
- Templates exist in the global library

---

### T-1.2: Template picker is the first step before the editor opens
**Maps to:** AC-1
**Category:** edge-case

```gherkin
  Scenario: Document editor does not open until the user makes a template selection
    Given "editor@example.com" has can-edit permission on project "proj-001"
    When the editor clicks "New Document"
    Then the template picker appears
    And no document has been created yet in the database
    And the document editor is not yet open or rendered
    And a document is only created after the user selects a template or "Blank Document" and clicks "Create"
```

**Test Data:**
- User: `{ email: "editor@example.com", userId: "usr-editor-001" }`
- Check: document count in project "proj-001" is unchanged until selection is confirmed

**Preconditions:**
- User is authenticated
- Project exists

---

### T-2.1: Browse templates by category filters results correctly
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Editor filters templates by category and sees only matching templates
    Given the template library contains:
      | name           | category  |
      | Project Brief  | Planning  |
      | Roadmap        | Planning  |
      | Meeting Notes  | Meetings  |
      | Retro Template | Meetings  |
    And the template picker is open
    When the editor selects the category filter "Planning"
    Then only "Project Brief" and "Roadmap" are displayed
    And "Meeting Notes" and "Retro Template" are not displayed
    When the editor selects the category filter "Meetings"
    Then only "Meeting Notes" and "Retro Template" are displayed
```

**Test Data:**
- Templates: 4 (as above)
- Filter selection: `"Planning"` then `"Meetings"`

**Preconditions:**
- Template picker is open
- All 4 templates exist in the library with correct category tags

---

### T-3.1: Creating a document from a template produces a deep copy of the template content
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Editor selects a template and creates a document; document has template content
    Given template "Project Brief" (id: "tmpl-pb-001") has content:
      "## Project Name\n\n[Placeholder: Enter project name]\n\n## Objectives\n\n[Placeholder: List objectives]"
    And "editor@example.com" has can-edit permission on project "proj-001"
    When the editor selects "Project Brief" in the template picker and clicks "Create"
    Then a new document "doc-new-001" is created in project "proj-001"
    And the document content matches:
      "## Project Name\n\n[Placeholder: Enter project name]\n\n## Objectives\n\n[Placeholder: List objectives]"
    And the document is immediately open and editable (contenteditable="true")
    And the placeholder text "[Placeholder: Enter project name]" is regular editable text
    And the document has no reference to "tmpl-pb-001" (templateSourceId is null or not stored)
```

**Test Data:**
- Template: `{ id: "tmpl-pb-001", name: "Project Brief", content: "## Project Name\n\n[Placeholder: Enter project name]\n\n## Objectives\n\n[Placeholder: List objectives]" }`
- New document: `{ projectId: "proj-001", templateSourceId: null }`

**Preconditions:**
- Template exists with rich text content
- User has can-edit permission on the project

---

### T-3.2: Content copy is server-side; client does not directly manipulate the CRDT
**Maps to:** AC-3
**Category:** edge-case

```gherkin
  Scenario: Document creation from template performs CRDT copy server-side
    Given template "Project Brief" (id: "tmpl-pb-001") has CRDT content stored server-side
    When "editor@example.com" clicks "Create" on the template picker
    Then a POST request is sent to "/api/documents" with templateId: "tmpl-pb-001"
    And the server response contains the new document ID and CRDT state
    And the client does NOT send any raw CRDT binary payload in the POST request
    And the response includes the new document's full CRDT state ready for the editor to load
```

**Test Data:**
- POST body: `{ projectId: "proj-001", templateId: "tmpl-pb-001" }` (no CRDT payload from client)
- Expected response: `{ documentId: "doc-new-001", crdtState: "<server-generated-crdt>" }`

**Preconditions:**
- Template exists server-side
- Document creation endpoint supports `templateId` parameter

---

### T-4.1: Template change after document creation has no effect on the created document
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: Admin edits a template after a document was created from it; document is unchanged
    Given "editor@example.com" created document "doc-from-tmpl-001" from template "tmpl-pb-001"
    And the document content at creation was "## Project Name\n\n## Objectives"
    When admin "admin@example.com" edits "tmpl-pb-001" to add "## Risks" section
    And saves the template
    Then document "doc-from-tmpl-001" still has content "## Project Name\n\n## Objectives"
    And no "## Risks" section appears in the document
    And the document content matches the snapshot taken at creation time
```

**Test Data:**
- Document snapshot at creation: `"## Project Name\n\n## Objectives"`
- Template after edit: `"## Project Name\n\n## Objectives\n\n## Risks"`

**Preconditions:**
- Document was created before the template edit
- Document has no live link to the template

---

### T-5.1: Blank Document option creates an empty document immediately
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Editor chooses "Blank Document" in the template picker
    Given "editor@example.com" has can-edit permission on project "proj-001"
    And the template picker is open
    When the editor clicks "Blank Document"
    Then a new empty document is created in project "proj-001"
    And the document editor opens immediately with an empty body
    And the document has no pre-populated content
    And the document is editable from the first keystroke
```

**Test Data:**
- User: `{ email: "editor@example.com", userId: "usr-editor-001" }`
- Expected document: `{ content: "" or empty CRDT state, projectId: "proj-001" }`

**Preconditions:**
- User is authenticated with can-edit permission
- Template picker is open

---

### T-6.1: Template search returns matching results
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Editor searches for a template by partial name and sees matching results
    Given the template library contains:
      | name              |
      | Project Brief     |
      | Project Roadmap   |
      | Meeting Notes     |
    And the template picker is open
    When the editor types "Project" in the search field
    Then "Project Brief" and "Project Roadmap" are displayed
    And "Meeting Notes" is not displayed
    When the editor types "Brief" in the search field
    Then only "Project Brief" is displayed
```

**Test Data:**
- Search term 1: `"Project"` → 2 results
- Search term 2: `"Brief"` → 1 result

**Preconditions:**
- Template picker is open
- All 3 templates exist in the library

---

### T-6.2: Template search with no matches shows appropriate message
**Maps to:** AC-6, AC-8
**Category:** error-handling

```gherkin
  Scenario: Editor searches for a template name that doesn't exist
    Given the template library contains "Project Brief" and "Meeting Notes"
    And the template picker is open
    When the editor types "Quarterly Review" in the search field
    Then the picker displays: "No templates match 'Quarterly Review'"
    And no template cards are shown
    And the "Blank Document" option remains accessible and visible
```

**Test Data:**
- Search term: `"Quarterly Review"` (not matching any template)
- Expected message: `"No templates match 'Quarterly Review'"`

**Preconditions:**
- Template picker is open
- No template named "Quarterly Review" exists in the library

---

### T-7.1: Empty template library shows graceful empty state with Blank Document available
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: Template picker opens when no templates exist — graceful empty state
    Given no templates have been created in the workspace by any admin
    And "editor@example.com" has can-edit permission on project "proj-001"
    When the editor clicks "New Document"
    And the template picker opens
    Then the picker shows the empty state message: "No templates yet — an admin can create templates in workspace settings"
    And the "Blank Document" option is visible and clickable
    And no error or crash occurs
    And the editor can still create a blank document
```

**Test Data:**
- Template count: 0 in the workspace
- Expected empty state: `"No templates yet — an admin can create templates in workspace settings"`

**Preconditions:**
- No templates exist in the global library
- User is authenticated with can-edit permission

---

## Negative Tests

### T-A1.1: Unauthenticated request to template picker or document creation returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated user attempts to access template picker data via API
    Given no authentication token is present
    When a GET request is made to "/api/templates"
    Then the server returns 401 Unauthorized
    And no template data is returned
    When a POST request is made to "/api/documents" with payload { templateId: "tmpl-pb-001" }
    Then the server returns 401 Unauthorized
    And no document is created
```

**Test Data:**
- Request 1: `GET /api/templates` — no auth header
- Request 2: `POST /api/documents` with `{ templateId: "tmpl-pb-001" }` — no auth header
- Expected: both return `401`

**Preconditions:**
- No session or token is present for either request

---

### T-A2.1: Authenticated user without can-edit permission cannot create a document
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated viewer tries to create a document from a template — rejected
    Given "viewer@example.com" has view-only permission on project "proj-001"
    When a POST request is made to "/api/documents" with payload { projectId: "proj-001", templateId: "tmpl-pb-001" }
    Then the server returns 403 Forbidden
    And no document is created in project "proj-001"
```

**Test Data:**
- User: `{ email: "viewer@example.com", userId: "usr-viewer-001", sessionToken: "tok-viewer-valid" }`
- Payload: `{ projectId: "proj-001", templateId: "tmpl-pb-001" }`
- Expected: `{ "error": "forbidden", "message": "You don't have permission to create documents in this project" }`

**Preconditions:**
- User is authenticated with a valid session
- User has view-only (not can-edit) permission on the project

---

## Boundary Tests

### T-B1.1: Template picker search — single character query
**Maps to:** AC-6
**Category:** boundary

```gherkin
  Scenario: Editor types a single character in the search field
    Given templates "Project Brief", "Planning Doc", "Roadmap" exist
    When the editor types "P" in the search field
    Then "Project Brief" and "Planning Doc" are shown
    And "Roadmap" is not shown
    And no error occurs from a single-character search
```

**Test Data:**
- Search term: `"P"` (single character)
- Matching: `"Project Brief"`, `"Planning Doc"`
- Non-matching: `"Roadmap"`

**Preconditions:**
- Template picker is open with at least 3 templates

---

### T-B1.2: Template picker search — maximum length query with no results
**Maps to:** AC-6, AC-8
**Category:** boundary

```gherkin
  Scenario: Editor types a very long search string with no results
    Given templates exist in the library
    When the editor types a 200-character string in the search field
    Then the UI does not crash or freeze
    And the picker shows the no-results message for the long search term
    And the "Blank Document" option remains accessible
```

**Test Data:**
- Search term: 200 `"a"` characters (`"aaa...aaa"`)
- Expected: no crash, empty results message shown

**Preconditions:**
- Template picker is open
- No template name matches 200 `"a"` characters


# Test Specifications: EXP-01 — Markdown Export

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1, T-5.2 | error-handling |
| AC-6 | T-6.1 | edge-case |
| AC-7 | T-7.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Export menu renders Markdown option for can-comment user
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Markdown Export Menu Visibility

  Scenario: Can-comment user sees Markdown export option
    Given a user is authenticated with the following profile:
      | field       | value                          |
      | user_id     | user-456                       |
      | email       | commenter@example.com          |
      | role        | can-comment                    |
      | status      | active                         |
    And the user is viewing document with id "doc-789" titled "Project Brief"
    When the user opens the "Export" menu in the document toolbar
    Then the Export menu is visible
    And a menu item labelled "Markdown (.md)" is rendered
    And the "Markdown (.md)" item is not disabled
```

**Test Data:**
- User: `{ user_id: "user-456", email: "commenter@example.com", role: "can-comment", status: "active" }`
- Document: `{ doc_id: "doc-789", title: "Project Brief", content: "non-empty" }`

**Preconditions:**
- User is authenticated with a valid session token
- Document `doc-789` exists and user has can-comment permission on it

---

### T-1.2: Export menu renders Markdown option for can-edit user
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Markdown Export Menu Visibility

  Scenario: Can-edit user sees Markdown export option
    Given a user is authenticated with the following profile:
      | field       | value                          |
      | user_id     | user-123                       |
      | email       | editor@example.com             |
      | role        | can-edit                       |
      | status      | active                         |
    And the user is viewing document with id "doc-789"
    When the user opens the "Export" menu in the document toolbar
    Then a menu item labelled "Markdown (.md)" is visible and enabled
```

**Test Data:**
- User: `{ user_id: "user-123", email: "editor@example.com", role: "can-edit", status: "active" }`
- Document: `{ doc_id: "doc-789", title: "Project Brief" }`

**Preconditions:**
- User is authenticated with a valid session token
- User has can-edit permission on doc-789

---

### T-2.1: Clicking Markdown export initiates file download with correct filename
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Markdown Export Download

  Scenario: Export triggers browser download with slugified filename
    Given a user with can-edit permission is viewing document "doc-789"
    And the document title is "Project Brief"
    When the user clicks "Markdown (.md)" from the Export menu
    Then a GET request is sent to "/api/documents/doc-789/export/markdown"
    And the server responds with HTTP 200
    And the response Content-Type header is "text/markdown; charset=utf-8"
    And the response Content-Disposition header is "attachment; filename=\"project-brief.md\""
    And a file download is initiated in the browser
```

**Test Data:**
- Document title: `"Project Brief"` → expected filename: `project-brief.md`
- Export endpoint: `GET /api/documents/doc-789/export/markdown`

**Preconditions:**
- User is authenticated with a valid session token bearing can-edit role for doc-789
- Document content is committed CRDT state

---

### T-2.2: Filename sanitizes special filesystem characters in document title
**Maps to:** AC-2
**Category:** edge-case

```gherkin
Feature: Markdown Export Filename Sanitization

  Scenario: Document title with special characters produces sanitized filename
    Given a user with can-comment permission is viewing document "doc-101"
    And the document title is "Q3/Results: A & B Report"
    When the user clicks "Markdown (.md)" from the Export menu
    Then the downloaded file is named "Q3-Results--A---B-Report.md"
    And special filesystem characters ("/", ":", "&") are replaced or omitted
    And the file extension remains ".md"
```

**Test Data:**
- Document title: `"Q3/Results: A & B Report"`
- Expected filename (after sanitization): special chars replaced per sanitization rules

**Preconditions:**
- Document doc-101 exists with the given title
- User has can-comment or above permission

---

### T-3.1: All rich text formatting types are mapped to Markdown syntax correctly
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Markdown Rich Text Mapping

  Scenario: Document with all supported formatting types exports correctly mapped
    Given a document "doc-format-test" with the following CRDT content:
      | Element         | Value                                      |
      | H1 heading      | "Main Title"                               |
      | H2 heading      | "Section One"                              |
      | H3 heading      | "Subsection"                               |
      | Bold text       | "bold word"                                |
      | Italic text     | "italic word"                              |
      | Underlined text | "underlined word"                          |
      | Bullet list     | ["Apple", "Banana", "Cherry"]              |
      | Numbered list   | ["Step one", "Step two", "Step three"]     |
      | Code block      | language=python, code="print('hello')"     |
      | GFM table       | headers=["Name","Age"], rows=[["Alice","30"]] |
      | Image           | alt="A cat", url="https://s3.example.com/cat.jpg" |
      | Hyperlink       | text="Click here", url="https://example.com" |
    When a user with can-edit permission exports the document as Markdown
    Then the downloaded .md file contains exactly:
      | Markdown Output                                   |
      | "# Main Title"                                    |
      | "## Section One"                                  |
      | "### Subsection"                                  |
      | "**bold word**"                                   |
      | "*italic word*"                                   |
      | "<u>underlined word</u>"                          |
      | "- Apple"                                         |
      | "- Banana"                                        |
      | "- Cherry"                                        |
      | "1. Step one"                                     |
      | "1. Step two"                                     |
      | "1. Step three"                                   |
      | "```python\nprint('hello')\n```"                  |
      | "| Name | Age |"                                  |
      | "| --- | --- |"                                   |
      | "| Alice | 30 |"                                  |
      | "![A cat](https://s3.example.com/cat.jpg)"        |
      | "[Click here](https://example.com)"               |
```

**Test Data:**
- Document: `doc-format-test` containing each formatting element listed above
- Expected output: exact Markdown strings for each element

**Preconditions:**
- Document exists with all formatting types present in committed CRDT state
- User has can-edit permission

---

### T-3.2: Nested or combined formatting maps correctly
**Maps to:** AC-3
**Category:** edge-case

```gherkin
Feature: Markdown Rich Text Mapping — Combined Formatting

  Scenario: Text with bold-italic combination exports correctly
    Given a document "doc-combined" with a paragraph containing a run that is both bold AND italic
    And the run text is "important"
    When exported as Markdown
    Then the output contains "***important***" or "**_important_**"
    And the exported text is not "**important*" or any malformed nesting
```

**Test Data:**
- Document: `{ doc_id: "doc-combined", content: [{ type: "paragraph", runs: [{ text: "important", bold: true, italic: true }] }] }`

**Preconditions:**
- Document exists with combined bold+italic formatting in CRDT state

---

### T-4.1: Export reflects latest committed CRDT state
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Markdown Export CRDT Consistency

  Scenario: Export captures latest committed state after concurrent edits
    Given users "editor-A" and "editor-B" are both editing document "doc-collab"
    And "editor-A" has appended the paragraph "Final paragraph added by A"
    And the CRDT state for "doc-collab" has committed that edit
    When "editor-B" triggers a Markdown export of "doc-collab"
    Then the downloaded .md file contains "Final paragraph added by A"
    And the content matches the committed CRDT state at the time of the export request
    And the file does not reflect any in-flight unmerged changes
```

**Test Data:**
- Document: `doc-collab` with at least two concurrent editors active
- Paragraph text written by editor-A: `"Final paragraph added by A"`

**Preconditions:**
- Both users are authenticated with can-edit permissions
- CRDT state is committed (not in a pending/unmerged state)

---

### T-5.1: Viewer cannot see Export menu in toolbar
**Maps to:** AC-5
**Category:** error-handling

```gherkin
Feature: Markdown Export Viewer Restriction

  Scenario: View-only user does not see the Export menu
    Given a user is authenticated with the following profile:
      | field   | value                  |
      | user_id | user-viewer-001        |
      | email   | viewer@example.com     |
      | role    | view-only              |
    And the user navigates to document "doc-789"
    When the document toolbar is rendered
    Then the "Export" menu element is not present in the DOM
    And no "Markdown (.md)" option is accessible via the UI
```

**Test Data:**
- User: `{ user_id: "user-viewer-001", role: "view-only" }`
- Document: `doc-789`

**Preconditions:**
- User has view-only permission on doc-789
- Document renders successfully

---

### T-5.2: Direct API call by viewer returns 403
**Maps to:** AC-5
**Category:** error-handling

```gherkin
Feature: Markdown Export Viewer API Restriction

  Scenario: Viewer making direct export API call receives 403
    Given a user is authenticated with role "view-only" on document "doc-789"
    When the user sends a GET request to "/api/documents/doc-789/export/markdown"
    Then the response status is 403 Forbidden
    And the response body contains "requires can-comment or can-edit"
    And no .md file content is returned
```

**Test Data:**
- Auth token: valid session token for `user-viewer-001` with view-only role
- Endpoint: `GET /api/documents/doc-789/export/markdown`

**Preconditions:**
- User is authenticated but has only view-only permission for doc-789

---

### T-6.1: Empty document exports as valid empty Markdown file
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Markdown Export — Empty Document

  Scenario: Exporting an empty document produces a valid empty .md file
    Given a user with can-edit permission is viewing document "doc-empty"
    And the document "doc-empty" has no content (empty CRDT state)
    And the document title is "Empty Doc"
    When the user clicks "Markdown (.md)" from the Export menu
    Then the server responds with HTTP 200
    And the downloaded file is named "empty-doc.md"
    And the file content is an empty string or contains only whitespace
    And the Content-Type is "text/markdown; charset=utf-8"
    And no error is shown to the user
```

**Test Data:**
- Document: `{ doc_id: "doc-empty", title: "Empty Doc", content: [] }`
- Expected filename: `empty-doc.md`

**Preconditions:**
- Document doc-empty exists with zero content nodes in CRDT state

---

### T-7.1: Document with pending suggestions exports only accepted base content
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Markdown Export — Pending Suggestions Excluded

  Scenario: Export omits pending suggestion markup and includes only base content
    Given a document "doc-suggestions" with the following state:
      | Content Type      | Text                                       |
      | Accepted paragraph | "This is the confirmed base text."        |
      | Pending suggestion | "This suggestion has not been accepted."  |
    When a user with can-comment permission exports the document as Markdown
    Then the downloaded .md file contains "This is the confirmed base text."
    And the file does not contain "This suggestion has not been accepted."
    And no suggestion markup (e.g., tracked-change indicators) appears in the output
```

**Test Data:**
- Document: `doc-suggestions` with one accepted paragraph and one pending suggestion node
- Accepted text: `"This is the confirmed base text."`
- Pending text: `"This suggestion has not been accepted."`

**Preconditions:**
- Document has at least one accepted paragraph and one pending (not yet accepted/rejected) suggestion in CRDT state

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to export endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Markdown Export Authorization — Unauthenticated

  Scenario: Request with no auth token is rejected
    Given no authentication token is present in the request
    When a GET request is sent to "/api/documents/doc-789/export/markdown"
    Then the response status is 401 Unauthorized
    And the response body contains an appropriate error message
    And no document content or file is returned
```

**Test Data:**
- Request: `GET /api/documents/doc-789/export/markdown` with no `Authorization` header and no session cookie

**Preconditions:**
- Document `doc-789` exists in the system

---

### T-AUTH-2.1: Authenticated view-only user receives 403 on export endpoint
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Markdown Export Authorization — Insufficient Permissions

  Scenario: View-only user is rejected from export API
    Given a user is authenticated as:
      | field   | value              |
      | user_id | user-viewer-002    |
      | role    | view-only          |
    And the user has a valid session token
    When a GET request is sent to "/api/documents/doc-789/export/markdown"
    Then the response status is 403 Forbidden
    And the response body contains "requires can-comment or can-edit"
    And no file content is returned
```

**Test Data:**
- Auth token: valid token for `user-viewer-002` scoped to view-only on doc-789
- Endpoint: `GET /api/documents/doc-789/export/markdown`

**Preconditions:**
- User `user-viewer-002` is authenticated and has view-only permission on doc-789

---

## Negative Tests

### T-NEG-1.1: Server error during Markdown generation surfaces user-facing error
**Maps to:** AC-2 (non-functional error handling)
**Category:** error-handling

```gherkin
Feature: Markdown Export — Server Error Handling

  Scenario: 5xx from Markdown generation service shows error toast, no partial download
    Given a user with can-edit permission is viewing document "doc-789"
    And the Markdown generation service is configured to return HTTP 500
    When the user clicks "Markdown (.md)" from the Export menu
    Then no file download is initiated
    And an error message "Export failed. Please try again." is displayed in the UI
    And the Export menu returns to its idle state
```

**Test Data:**
- Mock: export service returns 500 for doc-789

**Preconditions:**
- Export service is running but configured to return 500 for this test

---

---

# Test Specifications: EXP-02 — PDF Export

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1, T-6.2 | edge-case |
| AC-7 | T-7.1, T-7.2 | error-handling |
| AC-8 | T-8.1 | edge-case |
| AC-9 | T-9.1 | error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: PDF option visible to can-comment user
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: PDF Export Menu Visibility

  Scenario: Can-comment user sees PDF export option
    Given a user is authenticated with the following profile:
      | field   | value                      |
      | user_id | user-comm-100              |
      | email   | commenter@example.com      |
      | role    | can-comment                |
    And the user is viewing document "doc-pdf-001"
    When the user opens the "Export" menu in the document toolbar
    Then a menu item labelled "PDF (.pdf)" is visible and enabled
```

**Test Data:**
- User: `{ user_id: "user-comm-100", role: "can-comment" }`
- Document: `{ doc_id: "doc-pdf-001", title: "Annual Review" }`

**Preconditions:**
- User is authenticated with valid session token
- User has can-comment permission on doc-pdf-001

---

### T-1.2: PDF option visible to can-edit user
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: PDF Export Menu Visibility

  Scenario: Can-edit user sees PDF export option
    Given a user is authenticated with role "can-edit" on document "doc-pdf-001"
    When the user opens the Export menu
    Then a menu item labelled "PDF (.pdf)" is visible and enabled
```

**Test Data:**
- User: `{ user_id: "user-edit-200", role: "can-edit" }`

**Preconditions:**
- User has can-edit permission on doc-pdf-001

---

### T-2.1: Small document exports synchronously within 10 seconds
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: PDF Export — Synchronous Path

  Scenario: Document below async threshold downloads directly
    Given a user with can-edit permission is viewing document "doc-small-001"
    And the document "doc-small-001" has content below the async size threshold
    And the headless rendering service is available
    When the user clicks "PDF (.pdf)" from the Export menu
    Then no "Preparing export…" indicator is shown
    And a PDF file download is initiated in the browser within 10 seconds
    And the response Content-Type is "application/pdf"
    And the response Content-Disposition is "attachment; filename=\"annual-review.pdf\""
```

**Test Data:**
- Document: `{ doc_id: "doc-small-001", title: "Annual Review", size: "below_async_threshold" }`
- Expected filename: `annual-review.pdf`

**Preconditions:**
- Document is below the async threshold (value TBD per G-4)
- Headless rendering service (Puppeteer or equivalent) is running and healthy

---

### T-3.1: Large document triggers async export with progress indicator
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: PDF Export — Asynchronous Path

  Scenario: Document above async threshold shows progress and delivers download link
    Given a user with can-edit permission is viewing document "doc-large-001"
    And the document "doc-large-001" has content above the async size threshold
    When the user clicks "PDF (.pdf)" from the Export menu
    Then a "Preparing export…" progress indicator appears immediately in the UI
    And the user can continue editing the document without the export blocking the UI
    And within 60 seconds the export job completes
    And a download link or banner notification appears with the PDF ready to download
```

**Test Data:**
- Document: `{ doc_id: "doc-large-001", size: "above_async_threshold" }`

**Preconditions:**
- Document is above the async threshold
- Async export job queue is running

---

### T-3.2: Async export progress indicator is accessible to screen readers
**Maps to:** AC-3 (non-functional — accessibility)
**Category:** happy-path

```gherkin
Feature: PDF Export — Async Accessibility

  Scenario: Progress indicator announced to screen reader users
    Given a user with can-edit permission triggers an async PDF export
    When the "Preparing export…" indicator appears
    Then the indicator is wrapped in an aria-live region with attribute aria-live="polite"
    And the text "Preparing export…" is announced by screen readers without manual focus
    And when the export completes and the download link appears, the completion message is also announced
```

**Test Data:**
- N/A — accessibility attribute check

**Preconditions:**
- Large document triggers async path
- Accessibility testing tool or screen reader simulation available

---

### T-4.1: PDF renders all rich text formatting faithfully
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: PDF Export — Rich Text Rendering

  Scenario: Document with all formatting types produces a correctly rendered PDF
    Given a document "doc-format-pdf" containing:
      | Element     | Value                                                |
      | H1          | "Main Heading"                                       |
      | H2          | "Sub Heading"                                        |
      | H3          | "Minor Heading"                                      |
      | Bold        | "bold text"                                          |
      | Italic      | "italic text"                                        |
      | Underline   | "underlined text"                                    |
      | Bullet list | ["Item A", "Item B"]                                 |
      | Code block  | language=javascript, code="console.log('hello')"     |
      | Table       | headers=["Col1","Col2"], rows=[["val1","val2"]]       |
      | Image       | alt="Logo", url="https://s3.example.com/logo.png"    |
      | Link        | text="Visit", url="https://example.com"              |
    When a user with can-edit permission exports the document as PDF
    Then the resulting PDF visually renders:
      | Check                                             |
      | H1 at largest heading size                        |
      | H2 at medium heading size                         |
      | H3 at smallest heading size                       |
      | "bold text" in bold weight                        |
      | "italic text" in italic style                     |
      | "underlined text" with underline decoration       |
      | Bullet list with bullet markers                   |
      | Code block in monospace font                      |
      | Table with header row and data row                |
      | Image from S3 URL rendered inline                 |
      | "Visit" as a clickable hyperlink to example.com   |
```

**Test Data:**
- Document: `doc-format-pdf` with all formatting elements
- S3 image URL: `https://s3.example.com/logo.png` (accessible)

**Preconditions:**
- S3 image URL is reachable from the rendering service
- Headless renderer is running

---

### T-5.1: PDF paginated with document title as header
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: PDF Export — Pagination and Header

  Scenario: Multi-page document has title header on each page
    Given a user with can-edit permission is exporting document "doc-multipage"
    And the document title is "Annual Strategy Report"
    And the document content spans more than one PDF page
    When the PDF is generated
    Then each page of the PDF contains the text "Annual Strategy Report" in the header region
    And content is distributed across pages with appropriate page breaks
    And there is no header content bleed or missing header on any page
```

**Test Data:**
- Document: `{ doc_id: "doc-multipage", title: "Annual Strategy Report", content: "enough content to exceed one page" }`

**Preconditions:**
- Document content is long enough to require pagination
- PDF renderer supports page headers

---

### T-6.1: Download link expires after 1 hour for async export
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: PDF Export — Download Link Expiry

  Scenario: Async download link returns expiry error after 1 hour
    Given a user with can-edit permission triggered an async PDF export of "doc-large-001"
    And the export completed successfully
    And the user received a download link with token "tok-abc123"
    And 61 minutes have elapsed since the link was generated
    When the user attempts to GET "/api/export/download/tok-abc123"
    Then the response status is 410 Gone or 403 Forbidden
    And the response body contains "Link expired"
    And no PDF content is returned
```

**Test Data:**
- Download token: `tok-abc123`
- Token age: 61 minutes (past the 1-hour TTL)

**Preconditions:**
- Async export completed successfully and link was issued
- System clock or token TTL can be manipulated in test environment

---

### T-6.2: Download link is valid within the 1-hour window
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: PDF Export — Download Link Valid Within TTL

  Scenario: Download link works within 1-hour window
    Given an async export download link "tok-def456" was generated 30 minutes ago
    When the user GETs "/api/export/download/tok-def456"
    Then the response status is 200 OK
    And the Content-Type is "application/pdf"
    And the PDF content is returned in the response body
```

**Test Data:**
- Download token: `tok-def456`, age: 30 minutes

**Preconditions:**
- Token was issued as part of a completed async export job

---

### T-7.1: View-only user does not see PDF export in UI
**Maps to:** AC-7
**Category:** error-handling

```gherkin
Feature: PDF Export — Viewer Restriction UI

  Scenario: View-only user's toolbar has no PDF export option
    Given a user is authenticated with role "view-only" on document "doc-pdf-001"
    When the document toolbar is rendered
    Then the "Export" menu does not display a "PDF (.pdf)" option
    And the PDF option is absent from the DOM entirely
```

**Test Data:**
- User: `{ user_id: "user-viewer-300", role: "view-only" }`

**Preconditions:**
- User authenticated with view-only permission on the document

---

### T-7.2: Viewer's direct API call to PDF export returns 403
**Maps to:** AC-7
**Category:** error-handling

```gherkin
Feature: PDF Export — Viewer API Restriction

  Scenario: View-only user direct API call is rejected
    Given a user with role "view-only" has a valid session token for document "doc-pdf-001"
    When the user sends a POST request to "/api/documents/doc-pdf-001/export/pdf"
    Then the response status is 403 Forbidden
    And the response body contains "requires can-comment or can-edit"
    And no export job is created
```

**Test Data:**
- Endpoint: `POST /api/documents/doc-pdf-001/export/pdf`
- Auth: valid token for view-only user

**Preconditions:**
- User authenticated, view-only permission only

---

### T-8.1: PDF export excludes pending suggestions
**Maps to:** AC-8
**Category:** edge-case

```gherkin
Feature: PDF Export — Pending Suggestions Excluded

  Scenario: PDF contains only accepted content, not pending suggestion markup
    Given document "doc-suggest-pdf" has:
      | Content             | State    |
      | "Accepted paragraph A" | accepted |
      | "Pending suggestion B" | pending  |
    When a user with can-comment permission exports the document as PDF
    Then the PDF renders "Accepted paragraph A"
    And the PDF does not contain "Pending suggestion B"
    And no green/red suggestion markup appears in the rendered PDF
```

**Test Data:**
- Document: `doc-suggest-pdf` with one accepted and one pending suggestion node

**Preconditions:**
- Document has committed accepted content and at least one pending (unresolved) suggestion

---

### T-9.1: Unavailable image during PDF generation results in placeholder, not failure
**Maps to:** AC-9
**Category:** error-handling

```gherkin
Feature: PDF Export — Image Fetch Failure

  Scenario: Unavailable image URL results in alt-text placeholder, rest of PDF succeeds
    Given document "doc-img-fail" contains:
      | Element   | Value                                           |
      | Paragraph | "Text before image."                            |
      | Image     | alt="Missing Logo", url="https://s3.example.com/missing.png" |
      | Paragraph | "Text after image."                             |
    And the URL "https://s3.example.com/missing.png" returns HTTP 404
    When a user with can-edit permission exports the document as PDF
    Then the PDF is generated successfully (HTTP 200 or async job completes)
    And the image position in the PDF contains the text "Image unavailable" (or a broken-image placeholder with alt text)
    And the paragraphs "Text before image." and "Text after image." are both present in the PDF
    And the export is not aborted due to the missing image
```

**Test Data:**
- Document: `doc-img-fail`
- Broken image: `https://s3.example.com/missing.png` → 404

**Preconditions:**
- Document exists with a reference to an S3 URL that is deliberately unavailable
- Headless renderer is running

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to PDF export endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: PDF Export Authorization — Unauthenticated

  Scenario: No auth token results in 401
    Given no authentication token is present in the request
    When a POST request is sent to "/api/documents/doc-pdf-001/export/pdf"
    Then the response status is 401 Unauthorized
    And no export job is created
    And no PDF content or download link is returned
```

**Test Data:**
- Endpoint: `POST /api/documents/doc-pdf-001/export/pdf`
- Auth: absent (no Authorization header, no session cookie)

**Preconditions:**
- Document `doc-pdf-001` exists in the system

---

### T-AUTH-2.1: View-only user receives 403 on PDF export endpoint
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: PDF Export Authorization — Insufficient Permissions

  Scenario: Authenticated viewer is rejected from PDF export
    Given a user is authenticated with role "view-only" on document "doc-pdf-001"
    When a POST request is sent to "/api/documents/doc-pdf-001/export/pdf"
    Then the response status is 403 Forbidden
    And the response body contains "requires can-comment or can-edit"
    And no export job is created
```

**Test Data:**
- Auth: valid token for `{ user_id: "user-viewer-300", role: "view-only" }`
- Endpoint: `POST /api/documents/doc-pdf-001/export/pdf`

**Preconditions:**
- User is authenticated but holds only view-only permission on the document

---

## Negative Tests

### T-NEG-1.1: Rendering service unavailable surfaces error to user
**Maps to:** AC-2 non-functional error handling
**Category:** error-handling

```gherkin
Feature: PDF Export — Rendering Service Unavailable

  Scenario: Headless renderer is down, user sees actionable error
    Given a user with can-edit permission is viewing document "doc-pdf-001"
    And the headless rendering service is down (connection refused)
    When the user clicks "PDF (.pdf)" from the Export menu
    Then no file download is initiated
    And the UI displays "Export failed. The export service is temporarily unavailable. Please try again later."
    And no partial PDF is returned
```

**Test Data:**
- Mock: rendering service returns connection refused

**Preconditions:**
- Rendering service is stopped or mocked to be unavailable

---

### T-NEG-1.2: Async export job crash results in failure notification
**Maps to:** EXP-02 non-functional error handling
**Category:** error-handling

```gherkin
Feature: PDF Export — Async Job Crash

  Scenario: Export job crashes mid-generation and user is notified
    Given a user triggered an async PDF export of "doc-large-001"
    And the export job crashes during rendering (simulated worker failure)
    When the job failure is detected by the job queue
    Then the job is marked as "failed"
    And the user receives a "Export failed" notification in the UI
    And no download link is created or surfaced
    And the failed job record is not left in an orphaned or pending state
```

**Test Data:**
- Simulated: async job killed during execution

**Preconditions:**
- Async job queue is running
- Job can be killed/simulated as crashed in test environment

---

### T-NEG-1.3: Download link is user-scoped and not usable by another user
**Maps to:** EXP-02 security NFR
**Category:** security

```gherkin
Feature: PDF Export — Download Link Scoping

  Scenario: Download token issued to user A cannot be used by user B
    Given user-A (can-edit) triggered async PDF export and received token "tok-scope-001"
    And user-B (can-comment) has a valid session on the same document
    When user-B sends GET "/api/export/download/tok-scope-001" with user-B's auth token
    Then the response status is 403 Forbidden
    And user-B does not receive the PDF content
```

**Test Data:**
- Token `tok-scope-001` issued to user-A
- user-B: `{ user_id: "user-B", role: "can-comment" }`

**Preconditions:**
- Async export completed for user-A
- Download token is cryptographically random and scoped to user-A's identity

---

---

# Test Specifications: EXP-03 — DOCX Export

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1, T-5.2 | edge-case |
| AC-6 | T-6.1, T-6.2 | error-handling |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1 | error-handling |
| AC-9 | T-9.1, T-9.2 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: DOCX option visible to can-comment user
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: DOCX Export Menu Visibility

  Scenario: Can-comment user sees Word Document export option
    Given a user is authenticated with the following profile:
      | field   | value                      |
      | user_id | user-comm-200              |
      | email   | commenter2@example.com     |
      | role    | can-comment                |
    And the user is viewing document "doc-docx-001" titled "Q3 Planning"
    When the user opens the "Export" menu in the document toolbar
    Then a menu item labelled "Word Document (.docx)" is visible and enabled
```

**Test Data:**
- User: `{ user_id: "user-comm-200", role: "can-comment" }`
- Document: `{ doc_id: "doc-docx-001", title: "Q3 Planning" }`

**Preconditions:**
- User authenticated with valid session
- User has can-comment permission on doc-docx-001

---

### T-1.2: DOCX option visible to can-edit user
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: DOCX Export Menu Visibility

  Scenario: Can-edit user sees Word Document export option
    Given a user is authenticated with role "can-edit" on document "doc-docx-001"
    When the user opens the Export menu
    Then a menu item labelled "Word Document (.docx)" is visible and enabled
```

**Test Data:**
- User: `{ user_id: "user-edit-300", role: "can-edit" }`

**Preconditions:**
- User has can-edit permission on doc-docx-001

---

### T-2.1: Small document exports as DOCX synchronously within 10 seconds
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: DOCX Export — Synchronous Path

  Scenario: Document below async threshold downloads DOCX directly
    Given a user with can-edit permission is viewing document "doc-docx-small"
    And the document has content below the async size threshold
    And the DOCX generation service is available
    When the user clicks "Word Document (.docx)" from the Export menu
    Then no "Preparing export…" indicator is shown
    And a DOCX file download is initiated within 10 seconds
    And the response Content-Type is "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    And the Content-Disposition header is "attachment; filename=\"q3-planning.docx\""
```

**Test Data:**
- Document: `{ doc_id: "doc-docx-small", title: "Q3 Planning", size: "below_async_threshold" }`
- Expected filename: `q3-planning.docx`

**Preconditions:**
- Document is below the async threshold
- DOCX generation service (python-docx or equivalent) is running

---

### T-3.1: Large document triggers async DOCX export with progress indicator
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: DOCX Export — Asynchronous Path

  Scenario: Large document triggers async DOCX generation with UI feedback
    Given a user with can-edit permission is viewing document "doc-docx-large"
    And the document content exceeds the async size threshold
    When the user clicks "Word Document (.docx)" from the Export menu
    Then a "Preparing export…" progress indicator appears in the UI immediately
    And the user can continue editing the document (UI is not blocked)
    And within 60 seconds the DOCX export job completes
    And a download link or banner notification appears so the user can download the DOCX
```

**Test Data:**
- Document: `{ doc_id: "doc-docx-large", size: "above_async_threshold" }`

**Preconditions:**
- Document exceeds async threshold
- Async export job queue is running

---

### T-3.2: Async DOCX progress state is announced to screen readers
**Maps to:** AC-3 (accessibility NFR)
**Category:** happy-path

```gherkin
Feature: DOCX Export — Async Accessibility

  Scenario: "Preparing export…" indicator has aria-live region
    Given a user with can-edit permission triggers an async DOCX export
    When the "Preparing export…" indicator is rendered
    Then the containing element has aria-live="polite"
    And the text "Preparing export…" is announced by screen readers automatically
    And the download-ready notification also fires in the aria-live region
```

**Test Data:**
- N/A — DOM attribute assertion

**Preconditions:**
- Async DOCX export is triggered for a large document

---

### T-4.1: Rich text formatting is correctly mapped to Word styles
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: DOCX Export — Rich Text Mapping

  Scenario: Document with all formatting types exports with correct Word styles
    Given a document "doc-docx-format" containing:
      | Element        | Value                                                   |
      | H1             | "Main Heading"                                          |
      | H2             | "Sub Heading"                                           |
      | H3             | "Minor Heading"                                         |
      | Bold run       | "bold text"                                             |
      | Italic run     | "italic text"                                           |
      | Underline run  | "underlined text"                                       |
      | Bullet list    | ["Point A", "Point B"]                                  |
      | Numbered list  | ["First", "Second"]                                     |
      | Code block     | "console.log('hello')"                                  |
      | Table          | headers=["Name","Score"], rows=[["Alice","95"]]          |
      | Image          | alt="Chart", url="https://s3.example.com/chart.png"     |
      | Link           | text="See docs", url="https://docs.example.com"         |
    When a user with can-edit permission exports the document as DOCX
    Then when the DOCX is opened in Word, the file contains:
      | Assertion                                                           |
      | "Main Heading" paragraph with style "Heading 1"                     |
      | "Sub Heading" paragraph with style "Heading 2"                      |
      | "Minor Heading" paragraph with style "Heading 3"                    |
      | Run "bold text" with bold=true character formatting                  |
      | Run "italic text" with italic=true character formatting              |
      | Run "underlined text" with underline character formatting            |
      | List paragraphs "Point A", "Point B" in bullet list style           |
      | List paragraphs "First", "Second" in numbered list style            |
      | Code paragraph "console.log('hello')" in monospace font (Courier New) |
      | A Word table object with "Name"/"Score" header row and Alice/95 row  |
      | An inline image object from S3 URL embedded in the document body     |
      | Word hyperlink field for "See docs" pointing to https://docs.example.com |
```

**Test Data:**
- Document: `doc-docx-format` with all formatting elements
- S3 image: `https://s3.example.com/chart.png` (accessible)

**Preconditions:**
- All formatting elements are present in committed CRDT state
- S3 image URL accessible from generation service
- DOCX generation library supports all listed mappings

---

### T-5.1: Async DOCX download link is invalid after 1 hour
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: DOCX Export — Download Link Expiry

  Scenario: Download link expires 1 hour after generation
    Given a user completed an async DOCX export and received download token "tok-docx-001"
    And 62 minutes have passed since the token was issued
    When the user sends GET "/api/export/download/tok-docx-001"
    Then the response status is 410 Gone or 403 Forbidden
    And the response body contains "Link expired"
    And no DOCX content is returned
```

**Test Data:**
- Token: `tok-docx-001`, age: 62 minutes

**Preconditions:**
- Async export completed and token was issued
- Test environment allows clock manipulation or token TTL override

---

### T-5.2: DOCX download link is valid within the 1-hour window
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: DOCX Export — Download Link Valid Within TTL

  Scenario: Token works when accessed within 1 hour of generation
    Given a download token "tok-docx-002" was generated 45 minutes ago
    When the user GETs "/api/export/download/tok-docx-002"
    Then the response status is 200 OK
    And the Content-Type is "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    And the DOCX file is returned
```

**Test Data:**
- Token: `tok-docx-002`, age: 45 minutes

**Preconditions:**
- Async export completed and token is still within TTL

---

### T-6.1: View-only user does not see DOCX export in toolbar
**Maps to:** AC-6
**Category:** error-handling

```gherkin
Feature: DOCX Export — Viewer Restriction UI

  Scenario: View-only user sees no DOCX export option
    Given a user with role "view-only" is viewing document "doc-docx-001"
    When the document toolbar renders
    Then the Export menu does not contain a "Word Document (.docx)" option
    And no DOCX export affordance is present in the DOM
```

**Test Data:**
- User: `{ user_id: "user-viewer-400", role: "view-only" }`

**Preconditions:**
- User is authenticated with view-only permission on doc-docx-001

---

### T-6.2: Direct DOCX export API call by viewer returns 403
**Maps to:** AC-6
**Category:** error-handling

```gherkin
Feature: DOCX Export — Viewer API Restriction

  Scenario: Authenticated viewer calling export API is rejected
    Given a user with role "view-only" has a valid session token for "doc-docx-001"
    When the user sends POST "/api/documents/doc-docx-001/export/docx"
    Then the response status is 403 Forbidden
    And the response body contains "requires can-comment or can-edit"
    And no export job is queued
```

**Test Data:**
- Endpoint: `POST /api/documents/doc-docx-001/export/docx`
- Auth: valid token for view-only user

**Preconditions:**
- User is authenticated but has only view-only permission

---

### T-7.1: DOCX export excludes pending suggestions
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: DOCX Export — Pending Suggestions Excluded

  Scenario: DOCX contains only accepted content, not pending suggestions
    Given document "doc-docx-suggest" has:
      | Content                    | State    |
      | "Accepted body paragraph." | accepted |
      | "Pending suggestion text." | pending  |
    When a user with can-edit permission exports the document as DOCX
    Then the resulting DOCX contains "Accepted body paragraph."
    And the DOCX does not contain "Pending suggestion text."
    And no tracked-changes markup (insertions or deletions) appears in the DOCX
```

**Test Data:**
- Document: `doc-docx-suggest` with one accepted node and one pending suggestion node

**Preconditions:**
- Document has committed accepted content and at least one unresolved pending suggestion

---

### T-8.1: Unavailable image during DOCX generation produces placeholder, not failure
**Maps to:** AC-8
**Category:** error-handling

```gherkin
Feature: DOCX Export — Image Fetch Failure

  Scenario: Broken S3 URL causes placeholder insertion, not export abort
    Given document "doc-docx-img-fail" contains:
      | Element   | Value                                             |
      | Paragraph | "Before image paragraph."                         |
      | Image     | alt="Missing", url="https://s3.example.com/x.png" |
      | Paragraph | "After image paragraph."                          |
    And the URL "https://s3.example.com/x.png" returns HTTP 403
    When a user with can-edit permission exports the document as DOCX
    Then the DOCX is generated and available for download
    And at the image location there is a paragraph containing "Image unavailable"
    And "Before image paragraph." and "After image paragraph." are both present
    And the export does not fail due to the inaccessible image
```

**Test Data:**
- Broken image URL: `https://s3.example.com/x.png` → 403
- Placeholder text: `"Image unavailable"`

**Preconditions:**
- Document exists with a reference to an inaccessible S3 URL
- DOCX generation service running

---

### T-9.1: Exported DOCX filename matches document title
**Maps to:** AC-9
**Category:** edge-case

```gherkin
Feature: DOCX Export — Filename Matching

  Scenario: DOCX file is named after the document title
    Given a document with id "doc-docx-001" and title "Q3 Planning"
    When a user with can-comment permission exports it as DOCX
    Then the Content-Disposition header is "attachment; filename=\"Q3 Planning.docx\""
```

**Test Data:**
- Document title: `"Q3 Planning"`
- Expected filename: `Q3 Planning.docx`

**Preconditions:**
- Document title contains only standard characters

---

### T-9.2: DOCX filename is sanitized when document title contains special characters
**Maps to:** AC-9
**Category:** edge-case

```gherkin
Feature: DOCX Export — Filename Sanitization

  Scenario: Title with special filesystem characters produces sanitized DOCX filename
    Given a document with title "Report: Q3/2026 — Results & Findings"
    When a user with can-edit permission exports it as DOCX
    Then the downloaded file name has the special characters "/", ":", "—", "&" replaced or removed
    And the file extension is ".docx"
    And the document body content is unaffected by the filename sanitization
```

**Test Data:**
- Title: `"Report: Q3/2026 — Results & Findings"`
- Expected: sanitized filename ending in `.docx`

**Preconditions:**
- Document exists with the given title

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to DOCX export endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: DOCX Export Authorization — Unauthenticated

  Scenario: Request without authentication token is rejected
    Given no authentication token is present in the request headers or cookies
    When a POST request is sent to "/api/documents/doc-docx-001/export/docx"
    Then the response status is 401 Unauthorized
    And no export job is created
    And no DOCX content is returned
```

**Test Data:**
- Endpoint: `POST /api/documents/doc-docx-001/export/docx`
- Auth: none

**Preconditions:**
- Document `doc-docx-001` exists

---

### T-AUTH-2.1: View-only authenticated user receives 403 on DOCX export
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: DOCX Export Authorization — Insufficient Permissions

  Scenario: Authenticated viewer is refused DOCX export
    Given a user is authenticated with role "view-only" on document "doc-docx-001"
    And the user has a valid session token
    When a POST request is sent to "/api/documents/doc-docx-001/export/docx"
    Then the response status is 403 Forbidden
    And the response body contains "requires can-comment or can-edit"
    And no export job is queued
```

**Test Data:**
- User: `{ user_id: "user-viewer-400", role: "view-only" }`
- Endpoint: `POST /api/documents/doc-docx-001/export/docx`

**Preconditions:**
- User authenticated with view-only permission on doc-docx-001

---

## Negative Tests

### T-NEG-1.1: DOCX generation service unavailable returns user error
**Maps to:** EXP-03 non-functional error handling
**Category:** error-handling

```gherkin
Feature: DOCX Export — Generation Service Down

  Scenario: User sees actionable error when generation service is unavailable
    Given a user with can-edit permission is viewing document "doc-docx-001"
    And the DOCX generation service is unreachable
    When the user clicks "Word Document (.docx)" from the Export menu
    Then no file download is initiated
    And the UI displays "Export failed. The export service is temporarily unavailable. Please try again later."
```

**Test Data:**
- Mock: DOCX generation service returns connection refused

**Preconditions:**
- DOCX generation service is stopped or mocked unavailable

---

### T-NEG-1.2: Download token is scoped to requesting user only
**Maps to:** EXP-03 security NFR
**Category:** security

```gherkin
Feature: DOCX Export — Token User Scoping

  Scenario: Download token cannot be used by a different user
    Given user-A completed an async DOCX export and received token "tok-docx-scope"
    And user-B has a valid session on the same document
    When user-B sends GET "/api/export/download/tok-docx-scope" with user-B's auth token
    Then the response status is 403 Forbidden
    And user-B does not receive any DOCX file content
```

**Test Data:**
- Token `tok-docx-scope` scoped to user-A
- user-B: `{ user_id: "user-B", role: "can-comment" }`

**Preconditions:**
- Async export completed for user-A
- Token is scoped to user-A's identity in the datastore

---

### T-NEG-1.3: Permission revocation before download prevents access
**Maps to:** EXP-03 security NFR — authorization at download time
**Category:** security

```gherkin
Feature: DOCX Export — Permission Check at Download Time

  Scenario: User whose permission was revoked after export cannot download the DOCX
    Given user-X (can-comment) triggered an async DOCX export and received token "tok-revoked"
    And an admin subsequently revoked user-X's access to the document
    When user-X sends GET "/api/export/download/tok-revoked" with a still-valid session token
    Then the response status is 403 Forbidden
    And no DOCX file is returned
```

**Test Data:**
- Token: `tok-revoked`, still within 1-hour TTL
- user-X permission: revoked between export trigger and download attempt

**Preconditions:**
- Async export completed and token issued while user-X had permission
- Admin has since removed user-X's document access

---

---

# Test Specifications: MOB-01 — Responsive Read-Only Document View on Mobile

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1 | edge-case |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1, T-5.2 | happy-path |
| AC-6 | T-6.1 | happy-path |
| AC-7 | T-7.1, T-7.2 | happy-path |
| AC-8 | T-8.1 | happy-path |
| AC-9 | T-9.1, T-9.2 | security |
| AC-10 | T-10.1 | edge-case |
| AC-11 | T-11.1 | error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Document renders in read-only mode on narrow viewport
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Mobile Read-Only Document View

  Scenario: Authenticated user on mobile viewport sees read-only document
    Given a user is authenticated with the following profile:
      | field   | value                   |
      | user_id | user-mob-001            |
      | email   | mobile@example.com      |
      | role    | view-only               |
    And the user navigates to document "doc-mob-001" titled "Team Handbook"
    And the browser viewport width is 375px (iPhone-sized)
    When the page loads
    Then the document content is visible on screen
    And the editing toolbar is not present in the DOM (not just hidden via CSS)
    And the page body has no horizontal overflow (no scrollbar on x-axis of main content)
    And the content is responsive to 375px viewport width
```

**Test Data:**
- Viewport: `375px wide × 812px tall`
- Document: `{ doc_id: "doc-mob-001", title: "Team Handbook", content: "non-empty" }`
- User: `{ user_id: "user-mob-001", role: "view-only" }`

**Preconditions:**
- User is authenticated with valid session token
- Document is loaded and has content

---

### T-1.2: Editing toolbar is absent from the DOM (not CSS-hidden) on mobile
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Mobile Read-Only — Toolbar Absence

  Scenario: Document toolbar element is not in the DOM on mobile viewports
    Given a user is viewing document "doc-mob-001" at viewport width 767px
    When the DOM is inspected
    Then no element with role "toolbar" or id/class related to the editing toolbar is present in the DOM
    And `document.querySelector('[data-testid="editor-toolbar"]')` returns null
```

**Test Data:**
- Viewport: `767px` (just below the 768px breakpoint)
- Assertion: DOM query returns null, not a hidden element

**Preconditions:**
- Page fully loaded at the narrow viewport width

---

### T-2.1: Headings H1–H3 render with distinct visual hierarchy
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Mobile Read-Only — Rich Text Rendering

  Scenario: Heading levels render with visually distinct sizes on mobile
    Given a document "doc-mob-format" contains:
      | Element | Text              |
      | H1      | "Main Title"      |
      | H2      | "Section Header"  |
      | H3      | "Subsection"      |
      | Bold    | "bold word"       |
      | Italic  | "italic word"     |
      | Underline | "underlined"    |
    When viewed in mobile read-only mode at viewport width 375px
    Then "Main Title" is rendered as an <h1> HTML element and is the largest of the three headings
    And "Section Header" is rendered as an <h2> element and is smaller than H1 but larger than H3
    And "Subsection" is rendered as an <h3> element and is the smallest heading
    And "bold word" has font-weight bold or equivalent CSS
    And "italic word" has font-style italic or equivalent CSS
    And "underlined" has text-decoration underline
```

**Test Data:**
- Document: `doc-mob-format` with H1, H2, H3, bold, italic, underline
- Viewport: `375px`

**Preconditions:**
- Document loaded in mobile read-only view

---

### T-2.2: Bullet and numbered lists render with correct markers and indentation
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Mobile Read-Only — List Rendering

  Scenario: Bullet and numbered lists render correctly on mobile
    Given a document "doc-mob-lists" contains:
      | List Type | Items                            |
      | Bullet    | ["Apple", "Banana", "Cherry"]    |
      | Numbered  | ["First item", "Second item"]    |
    When viewed in mobile read-only mode at viewport width 375px
    Then bullet list items "Apple", "Banana", "Cherry" are rendered with bullet markers (disc or similar)
    And numbered list items show "1. First item" and "2. Second item"
    And all list items are indented from the left margin
```

**Test Data:**
- Document: `doc-mob-lists` with one bullet list and one numbered list
- Viewport: `375px`

**Preconditions:**
- Document contains both list types in committed CRDT state

---

### T-3.1: Code blocks scroll horizontally without breaking page layout
**Maps to:** AC-3
**Category:** edge-case

```gherkin
Feature: Mobile Read-Only — Code Block Horizontal Scroll

  Scenario: Wide code block scrolls within its container on mobile
    Given a document "doc-mob-code" contains a code block with a line:
      | Content | "const veryLongVariableName = someFunction(paramOne, paramTwo, paramThree, paramFour);" |
    And the code block content width is wider than 375px
    When viewed in mobile read-only mode at viewport width 375px
    Then the code block container allows horizontal scrolling within itself
    And the page body (html/body) does NOT have horizontal overflow or a horizontal scrollbar
    And the code block renders in a monospace font
    And the text is not wrapped mid-token (no mid-word wrapping inside code)
```

**Test Data:**
- Viewport: `375px`
- Code line: 100+ character JavaScript line that exceeds 375px rendered width

**Preconditions:**
- Document contains a code block with content wider than the mobile viewport

---

### T-4.1: Wide tables scroll horizontally within their container
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Mobile Read-Only — Table Horizontal Scroll

  Scenario: Wide table scrolls horizontally within its bounding box on mobile
    Given a document "doc-mob-table" contains a table with:
      | headers | ["Name", "Department", "Location", "Start Date", "Manager", "Status"] |
      | rows    | [["Alice Smith", "Engineering", "New York", "2024-01-15", "Bob Jones", "Active"]] |
    And the table is wider than 375px when rendered
    When viewed in mobile read-only mode at viewport width 375px
    Then the table container has overflow-x: auto or scroll
    And the table does not reflow into a stacked/single-column layout
    And the table column headers are visible while scrolling horizontally
    And the page body does NOT overflow horizontally
```

**Test Data:**
- Viewport: `375px`
- Table: 6 columns with text content that exceeds mobile width

**Preconditions:**
- Document contains a wide table in CRDT state

---

### T-5.1: Images scale to fit viewport width and maintain aspect ratio
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: Mobile Read-Only — Responsive Images

  Scenario: Image wider than viewport scales down to fit
    Given a document "doc-mob-img" contains an image:
      | field | value                               |
      | url   | https://s3.example.com/wide-img.png |
      | alt   | "Wide banner image"                 |
    And the image natural width is 1200px
    When viewed in mobile read-only mode at viewport width 375px
    Then the image renders with a computed width of at most 375px
    And the image height is scaled proportionally (aspect ratio preserved)
    And the page body does NOT overflow horizontally due to the image
```

**Test Data:**
- Image: `https://s3.example.com/wide-img.png`, natural width 1200px
- Viewport: `375px`

**Preconditions:**
- S3 image URL is reachable and returns a 1200px-wide image

---

### T-5.2: Broken image URL shows placeholder with alt text
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: Mobile Read-Only — Broken Image Handling

  Scenario: Unreachable image URL displays browser broken-image placeholder with alt text
    Given a document "doc-mob-img-broken" contains an image:
      | field | value                                |
      | url   | https://s3.example.com/missing.png   |
      | alt   | "Company Logo"                       |
    And the URL returns 404
    When viewed in mobile read-only mode at viewport width 375px
    Then the image element renders as a broken image placeholder
    And the alt attribute "Company Logo" is present on the <img> element
    And the rest of the document renders without errors
    And the page does not display a JavaScript exception or blank screen
```

**Test Data:**
- Broken URL: `https://s3.example.com/missing.png` → 404
- Alt text: `"Company Logo"`

**Preconditions:**
- Image URL is unreachable in the test environment

---

### T-6.1: Hyperlinks are tappable with adequate touch target size
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: Mobile Read-Only — Tappable Hyperlinks

  Scenario: Hyperlinks meet minimum 44×44px touch target requirement
    Given a document "doc-mob-links" contains a hyperlink:
      | field | value                          |
      | text  | "View report"                  |
      | url   | "https://reports.example.com"  |
    When viewed in mobile read-only mode at viewport width 375px
    Then the link element has a rendered height of at least 44px
    And the link element has a rendered width of at least 44px (or a click-target padding achieves this)
    And tapping the link opens "https://reports.example.com" per the link's target attribute behavior
```

**Test Data:**
- Link: `{ text: "View report", url: "https://reports.example.com", target: "_blank" }`
- Minimum touch target: 44×44px

**Preconditions:**
- Document contains at least one hyperlink

---

### T-7.1: Comment indicators are visible and display thread in read-only mode
**Maps to:** AC-7
**Category:** happy-path

```gherkin
Feature: Mobile Read-Only — Comments Visible

  Scenario: Comment indicators visible and thread opens in read-only mode on tap
    Given a document "doc-mob-comments" has an inline comment on the text "important phrase":
      | field    | value                          |
      | comment  | "Please clarify this point."   |
      | author   | "editor@example.com"           |
    When viewed in mobile read-only mode at viewport width 375px
    Then the text "important phrase" has a visible comment indicator (e.g., highlight or icon)
    When the user taps the comment indicator
    Then a comment thread panel or popover opens showing "Please clarify this point." and the author
    And the comment is displayed in read-only mode (no reply input field is rendered)
    And no "Resolve" button or similar action controls are rendered
```

**Test Data:**
- Document: `doc-mob-comments` with one inline comment on "important phrase"
- Comment text: `"Please clarify this point."`

**Preconditions:**
- Document has at least one unresolved inline comment
- User is viewing the document in mobile read-only mode

---

### T-7.2: No UI affordances for creating, replying to, or resolving comments are rendered
**Maps to:** AC-7
**Category:** happy-path

```gherkin
Feature: Mobile Read-Only — No Comment Mutation Controls

  Scenario: Comment action controls absent from mobile view
    Given a user with can-comment permission is viewing a document on mobile (375px)
    When the document is rendered
    Then no "Add Comment" button or annotation toolbar is present in the DOM
    And after tapping a comment indicator, no reply input field is rendered
    And no "Resolve" or "Delete" button is rendered for any comment thread
```

**Test Data:**
- User: `{ role: "can-comment" }` (would have comment mutation rights on desktop)
- Viewport: `375px`

**Preconditions:**
- User has can-comment permission, which normally grants comment creation rights

---

### T-8.1: Presence indicators are hidden and do not cause layout or JS errors
**Maps to:** AC-8
**Category:** happy-path

```gherkin
Feature: Mobile Read-Only — Presence Indicators Hidden

  Scenario: Concurrent editors do not produce visible presence UI or errors on mobile
    Given users "editor-A" and "editor-B" are actively editing document "doc-mob-001" on desktop
    And user "mobile-viewer" opens the same document at viewport width 375px
    When the mobile read-only view renders for "mobile-viewer"
    Then no cursor overlays representing "editor-A" or "editor-B" are visible
    And no user avatar list or collaborator presence panel is rendered
    And the browser console contains no JavaScript exceptions related to presence components
    And the page layout is not broken or shifted due to the absence of presence UI
```

**Test Data:**
- Active editors: user-A and user-B on desktop sessions
- Mobile viewer: `user-mob-001` at 375px viewport

**Preconditions:**
- At least two users have active sessions on the document at the time of the mobile view loading

---

### T-9.1: Editor-permissioned user on mobile cannot trigger content mutation
**Maps to:** AC-9
**Category:** security

```gherkin
Feature: Mobile Read-Only — Editor Role Locked to Read-Only

  Scenario: Can-edit user cannot mutate document content on mobile viewport
    Given a user is authenticated with the following profile:
      | field   | value              |
      | user_id | user-editor-mob    |
      | role    | can-edit           |
    And the user is viewing document "doc-mob-001" at viewport width 375px
    When the user long-presses on a paragraph of text
    Then no editing cursor appears in the content area
    And no formatting toolbar is rendered
    When the user attempts to type characters into the content area
    Then no characters are inserted into the document
    And the CRDT state of the document is unchanged
```

**Test Data:**
- User: `{ user_id: "user-editor-mob", role: "can-edit" }`
- Action: long-press on content, attempt to type
- Viewport: `375px`

**Preconditions:**
- User has can-edit permission (which allows mutations on desktop)
- Document is rendered in mobile read-only mode

---

### T-9.2: Mobile view does not call any document write/update API endpoints
**Maps to:** AC-9 (security NFR — no mutation endpoints)
**Category:** security

```gherkin
Feature: Mobile Read-Only — No Write API Calls

  Scenario: Mobile read-only view makes no write API calls during normal use
    Given a user with can-edit permission is viewing "doc-mob-001" in mobile read-only mode
    When all network requests made by the mobile view are captured over a 30-second session
    Then no requests are made to any of the following endpoints:
      | Endpoint Pattern                           |
      | PUT /api/documents/*                       |
      | PATCH /api/documents/*                     |
      | POST /api/documents/*/ops (CRDT op push)  |
      | DELETE /api/documents/*                    |
    And all network requests are either GET (data fetching) or WebSocket read-only subscriptions
```

**Test Data:**
- Network capture tool: browser dev tools or test proxy
- Viewport: `375px`, session duration: 30 seconds

**Preconditions:**
- Mobile view is fully loaded and the user scrolls through the document

---

### T-10.1: Empty document shows empty state without errors
**Maps to:** AC-10
**Category:** edge-case

```gherkin
Feature: Mobile Read-Only — Empty Document

  Scenario: Empty document renders clean empty state on mobile
    Given a document "doc-mob-empty" has no content (empty CRDT state)
    And the document title is "New Document"
    When a user with view-only permission views it at viewport width 375px
    Then the content area renders without errors or broken UI elements
    And an empty state placeholder is shown (e.g., blank white area or "This document has no content yet")
    And no JavaScript exceptions appear in the console
    And the page title still reflects "New Document"
```

**Test Data:**
- Document: `{ doc_id: "doc-mob-empty", title: "New Document", content: [] }`

**Preconditions:**
- Document exists in the system with an empty CRDT state

---

### T-11.1: Document load failure displays error message with retry option
**Maps to:** AC-11
**Category:** error-handling

```gherkin
Feature: Mobile Read-Only — Document Load Failure

  Scenario: Network error during document load shows user-facing error with retry
    Given a user with view-only permission navigates to document "doc-mob-001" at viewport 375px
    And the server returns HTTP 500 when fetching document content
    When the mobile view attempts to render
    Then the content area displays "Unable to load document. Please try again."
    And a "Retry" button is rendered below the error message
    And no partial or broken document content is displayed
    And the error is not silently swallowed (no blank screen without message)
    When the user taps "Retry"
    Then the application attempts to reload the document
```

**Test Data:**
- Mock: document fetch endpoint returns 500 for `doc-mob-001`

**Preconditions:**
- Server-side mock or test stub configured to return 500

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated mobile user is redirected to login
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Mobile Read-Only — Unauthenticated Access

  Scenario: No auth token results in 401 and login redirect
    Given no valid authentication token is present (no cookie, no Authorization header)
    When a request is sent to the document view endpoint for "doc-mob-001"
    Then the server responds with HTTP 401 Unauthorized
    And the client redirects the user to the login page
    And no document content is exposed in the response body
```

**Test Data:**
- Endpoint: `GET /documents/doc-mob-001` (or equivalent document view route)
- Auth: absent

**Preconditions:**
- Document `doc-mob-001` exists in the system

---

### T-AUTH-2.1: User without view-only permission sees 403 and no document content
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Mobile Read-Only — Insufficient Permissions

  Scenario: Authenticated user without any document permission is rejected
    Given a user is authenticated with the following profile:
      | field   | value               |
      | user_id | user-no-perm-001    |
      | email   | noperm@example.com  |
    And the user has NO permission on document "doc-mob-001"
    When the user navigates to the document URL on a mobile device (viewport 375px)
    Then the server returns 403 Forbidden
    And the client displays "You don't have permission to view this document"
    And a link back to the project document list is rendered
    And no document content (text, headings, images) is exposed in the response or the page
```

**Test Data:**
- User: `{ user_id: "user-no-perm-001" }` with no permission record on doc-mob-001
- Expected message: `"You don't have permission to view this document"`

**Preconditions:**
- User is authenticated but has no permission entry for the document

---

## Negative Tests

### T-NEG-1.1: Viewport at exactly 768px renders desktop view, not mobile view
**Maps to:** AC-1 (breakpoint boundary)
**Category:** edge-case

```gherkin
Feature: Mobile Breakpoint Boundary

  Scenario: Viewport at exactly the breakpoint threshold renders desktop view
    Given an authenticated user views document "doc-mob-001"
    When the viewport width is exactly 768px
    Then the editing toolbar IS present in the DOM (desktop mode applies)
    And the document renders in the full editing layout, not the mobile read-only layout
```

**Test Data:**
- Viewport: `768px` (boundary value — must be ABOVE the < 768px mobile threshold)

**Preconditions:**
- User has can-edit permission to confirm toolbar is rendered at 768px

---

### T-NEG-1.2: Viewport at 767px renders mobile read-only view
**Maps to:** AC-1 (breakpoint boundary)
**Category:** edge-case

```gherkin
Feature: Mobile Breakpoint Boundary

  Scenario: Viewport at 767px renders mobile read-only view
    Given an authenticated user views document "doc-mob-001"
    When the viewport width is 767px
    Then the editing toolbar is NOT present in the DOM
    And the document renders in mobile read-only mode
```

**Test Data:**
- Viewport: `767px` (one pixel below the 768px threshold)

**Preconditions:**
- User has can-edit permission (to verify the toolbar is genuinely suppressed, not just inaccessible)

---

### T-NEG-1.3: Rich text content is sanitized — no unsanitized innerHTML
**Maps to:** MOB-01 security NFR
**Category:** security

```gherkin
Feature: Mobile Read-Only — XSS Prevention

  Scenario: Document content containing script tags is sanitized before render
    Given a document "doc-mob-xss" contains a paragraph with the raw text:
      | Content | "<script>alert('xss')</script>Legitimate text" |
    When viewed in mobile read-only mode at viewport width 375px
    Then the text "Legitimate text" is visible in the document
    And no JavaScript alert is executed in the browser
    And the `<script>` tag is not present in the rendered DOM
    And the browser console shows no XSS-related script execution
```

**Test Data:**
- Document: `doc-mob-xss` with script-tag content in a paragraph node
- Expected: script tag stripped; plain text rendered safely

**Preconditions:**
- Document content is stored in CRDT and rendered via sanitized HTML pipeline

---

### T-NEG-1.4: Offline state shows non-blocking banner without destroying rendered content
**Maps to:** MOB-01 non-functional — network drop
**Category:** error-handling

```gherkin
Feature: Mobile Read-Only — Offline State

  Scenario: Network drop after partial load shows offline banner without clearing content
    Given a user has opened and partially rendered document "doc-mob-001" at viewport 375px
    And the network connection is dropped (offline simulation)
    When the user continues scrolling or waiting
    Then the previously rendered document content remains visible
    And a "You're offline" banner appears in a non-blocking position (e.g., bottom of screen)
    And the banner does not replace or obscure the document content
    And the banner disappears or updates when connectivity is restored
```

**Test Data:**
- Network: simulated offline (Chrome DevTools network throttle or service worker intercept)

**Preconditions:**
- Document was at least partially loaded before going offline


# Test Specifications: Batch 10 of 11

Stories covered: SESSION-01, TMPL-01, TMPL-02, EXP-01

---

# Test Specifications: SESSION-01 — Document Deletion with Active Collaborators

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2, T-2.3 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1, T-4.2 | happy-path |
| AC-5 | T-5.1 | edge-case |
| AC-6 | T-6.1, T-6.2 | edge-case |
| AC-7 | T-7.1, T-7.2 | error-handling |
| AC-8 | T-8.1, T-8.2 | happy-path |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: All connected editors receive termination event on deletion
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Document Deletion with Active Collaborators

  Scenario: All connected editors receive termination event within 1 second
    Given the following users are connected to document room "doc-uuid-abc123":
      | user_id   | display_name | role   | connection_state |
      | user-101  | Alice Admin  | admin  | connected        |
      | user-102  | Bob Editor   | editor | connected        |
      | user-103  | Carol Viewer | viewer | connected        |
    And user "user-101" has delete permission on document "doc-uuid-abc123"
    When user "user-101" deletes document "doc-uuid-abc123"
    Then the server broadcasts a "document.deleted" event to all connected clients in the room
    And the event is received by "user-102" within 1000 milliseconds
    And the event is received by "user-103" within 1000 milliseconds
    And the event payload contains:
      | field         | value                        |
      | event         | document.deleted             |
      | document_id   | doc-uuid-abc123              |
      | deleted_by    | user-101                     |
      | deleter_name  | Alice Admin                  |
```

**Test Data:**
- Document ID: `doc-uuid-abc123`
- Users: `{ user_id: "user-101", display_name: "Alice Admin", role: "admin" }`, `{ user_id: "user-102", display_name: "Bob Editor", role: "editor" }`, `{ user_id: "user-103", display_name: "Carol Viewer", role: "viewer" }`
- All three users have active WebSocket connections in the document room

**Preconditions:**
- Document `doc-uuid-abc123` exists in project `proj-001`
- WebSocket room `doc-uuid-abc123` is open and all three clients are joined
- `user-101` has delete permission

---

### T-1.2: Single connected viewer receives termination event
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Viewer-only connected client receives termination event
    Given only user "user-103" (role: viewer) is connected to document room "doc-uuid-abc123"
    And user "user-999" (role: admin) deletes the document from a separate session without joining the room
    When user "user-999" confirms document deletion
    Then a "document.deleted" event is broadcast to the room
    And user "user-103" receives the event within 1000 milliseconds
```

**Test Data:**
- Document ID: `doc-uuid-abc123`
- Connected viewer: `{ user_id: "user-103", role: "viewer" }`
- Deleting admin: `{ user_id: "user-999", role: "admin" }` (not in room)

**Preconditions:**
- Document exists
- Room has exactly one connected client (viewer)
- Deleting admin is authenticated but not in the WebSocket room

---

### T-2.1: Modal displays correct deletion message with deleter name
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Connected client sees modal with deleter's display name
    Given user "user-102" (Bob Editor) has an open WebSocket connection to document "doc-uuid-abc123"
    When the client receives a "document.deleted" event with payload:
      """
      {
        "event": "document.deleted",
        "document_id": "doc-uuid-abc123",
        "deleted_by": "user-101",
        "deleter_name": "Alice Admin"
      }
      """
    Then a modal dialog is displayed with the exact message:
      "This document has been deleted by Alice Admin. Your unsaved changes have been lost."
    And the modal blocks interaction with the document content area
    And the modal contains exactly one dismissal action labeled "OK" or "Go to Documents"
    And no other interactive controls are accessible while the modal is open
```

**Test Data:**
- Event payload: `{ event: "document.deleted", document_id: "doc-uuid-abc123", deleted_by: "user-101", deleter_name: "Alice Admin" }`

**Preconditions:**
- Client is rendering document editor for `doc-uuid-abc123`
- WebSocket connection is active

---

### T-2.2: Modal blocks all underlying document interaction while open
**Maps to:** AC-2
**Category:** edge-case

```gherkin
  Scenario: Modal prevents editing while displayed
    Given user "user-102" receives a "document.deleted" event
    And the deletion modal is displayed
    When the user attempts to interact with the document editor behind the modal (click, type, scroll)
    Then the document editor does not register the interaction
    And the modal remains displayed
    And no text changes are applied to the document
```

**Test Data:**
- Any connected editor who received the deletion event

**Preconditions:**
- Deletion modal is currently rendered

---

### T-2.3: Modal renders correctly when deleter_name is absent from payload
**Maps to:** AC-2
**Category:** edge-case

```gherkin
  Scenario: Modal handles missing deleter display name gracefully
    Given user "user-102" receives a "document.deleted" event with payload:
      """
      {
        "event": "document.deleted",
        "document_id": "doc-uuid-abc123",
        "deleted_by": "user-101",
        "deleter_name": null
      }
      """
    When the client processes the event
    Then a modal dialog is displayed
    And the modal message does not show "null" or "undefined" as the deleter name
    And the modal falls back to a message such as: "This document has been deleted. Your unsaved changes have been lost."
```

**Test Data:**
- Event payload with `deleter_name: null`

**Preconditions:**
- Client is in document editor view
- WebSocket connection active

---

### T-3.1: WebSocket room is closed after broadcast completes
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: WebSocket room is closed after deletion broadcast
    Given document "doc-uuid-abc123" has been deleted
    And the "document.deleted" event has been broadcast to all connected clients
    When the broadcast completes
    Then the server closes the WebSocket room "doc-uuid-abc123"
    And the room no longer accepts new connections
```

**Test Data:**
- Document ID: `doc-uuid-abc123`

**Preconditions:**
- Document deletion completed
- Broadcast event was sent

---

### T-3.2: New connection to deleted document room returns not-found error
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Client connecting to deleted document room receives room not found
    Given document "doc-uuid-abc123" has been deleted
    And the WebSocket room for "doc-uuid-abc123" has been closed
    When a new WebSocket connection attempt is made to the room for "doc-uuid-abc123"
    Then the server responds with error code 404 or error type "room.not_found"
    And the client is not admitted to the room
```

**Test Data:**
- Document ID: `doc-uuid-abc123` (deleted)
- Connecting user: `{ user_id: "user-200", role: "editor" }` (valid auth token)

**Preconditions:**
- Document has been deleted
- Room has been closed server-side

---

### T-4.1: Dismissing modal redirects to document list
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: User is redirected to document list after dismissing deletion modal
    Given user "user-102" sees the document deletion modal for document "doc-uuid-abc123" in project "proj-001"
    When the user clicks the "OK" dismissal button
    Then the client navigates to the document list page for project "proj-001"
    And no reconnection attempt is made to the WebSocket room "doc-uuid-abc123"
    And document "doc-uuid-abc123" does not appear in the document list
```

**Test Data:**
- Document ID: `doc-uuid-abc123`
- Project ID: `proj-001`
- Expected redirect URL: `/projects/proj-001/documents`

**Preconditions:**
- Deletion modal is displayed
- `doc-uuid-abc123` has been deleted from the database

---

### T-4.2: Dismissing modal via "Go to Documents" also redirects correctly
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: "Go to Documents" button redirects to document list
    Given user "user-102" sees the document deletion modal
    When the user clicks "Go to Documents"
    Then the client navigates to the document list for the document's project
    And no reconnection loop is triggered
```

**Test Data:**
- Modal with "Go to Documents" action

**Preconditions:**
- Deletion modal is displayed

---

### T-5.1: Deleting user receives confirmation, not peer-deletion modal
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: Document owner connected to the room does not see the peer deletion modal
    Given user "user-101" (Alice Admin) is connected to document "doc-uuid-abc123"
    And user "user-101" has delete permission on the document
    When user "user-101" confirms the deletion of document "doc-uuid-abc123"
    Then user "user-101" sees a standard deletion confirmation message (e.g., "Document deleted")
    And user "user-101" is redirected to the document list
    And user "user-101" does NOT see the modal: "This document has been deleted by Alice Admin. Your unsaved changes have been lost."
```

**Test Data:**
- Deleting user: `{ user_id: "user-101", display_name: "Alice Admin", role: "admin" }`
- Document ID: `doc-uuid-abc123`

**Preconditions:**
- `user-101` is both the deletion initiator and connected to the room

---

### T-6.1: No server error when deleting a document with no connected clients
**Maps to:** AC-6
**Category:** edge-case

```gherkin
  Scenario: Document is deleted with no active WebSocket connections in room
    Given document "doc-uuid-abc123" has no active WebSocket connections (all users have closed their tabs)
    When user "user-101" (admin) deletes the document via the API
    Then the deletion succeeds with 200 OK
    And no server-side error is triggered by the empty room broadcast
    And the document is removed from the data store
```

**Test Data:**
- Document ID: `doc-uuid-abc123`
- Active connections: 0
- Deleting user: `{ user_id: "user-101", role: "admin" }`

**Preconditions:**
- Document exists
- No active WebSocket connections in the room

---

### T-6.2: User who had closed tab navigates to deleted document and sees not-found
**Maps to:** AC-6
**Category:** edge-case

```gherkin
  Scenario: Offline user navigates to deleted document URL and sees not-found page
    Given user "user-103" previously viewed document "doc-uuid-abc123" but closed their browser tab
    And document "doc-uuid-abc123" was subsequently deleted
    When user "user-103" navigates to the document URL "/documents/doc-uuid-abc123"
    Then the page displays a "Document not found" message
    And the deletion modal is NOT shown (user never received the WebSocket event)
    And a link back to the document list is provided
```

**Test Data:**
- Document URL: `/documents/doc-uuid-abc123`
- Document status: deleted

**Preconditions:**
- `user-103` has no active WebSocket connection (tab was closed before deletion)
- Document `doc-uuid-abc123` is deleted

---

### T-7.1: Client reconnects after dropped connection and receives not-found
**Maps to:** AC-7
**Category:** error-handling

```gherkin
  Scenario: Client whose connection dropped during deletion reconnects and sees document-not-found
    Given user "user-102" had an active WebSocket connection to "doc-uuid-abc123"
    And user "user-102"'s WebSocket connection dropped before the "document.deleted" event was delivered
    And document "doc-uuid-abc123" was deleted during the outage
    When user "user-102"'s client reconnects to the document WebSocket room
    Then the server returns a "room.not_found" or 404 error
    And the client displays: "This document no longer exists."
    And a link back to the document list is provided
```

**Test Data:**
- Document ID: `doc-uuid-abc123` (deleted)
- User: `{ user_id: "user-102", role: "editor" }`
- Reconnection attempt after room was closed

**Preconditions:**
- Document was deleted while user's connection was dropped
- Room is now closed

---

### T-7.2: Client does not enter reconnection retry loop for non-existent document
**Maps to:** AC-7
**Category:** error-handling

```gherkin
  Scenario: Client does not retry WebSocket connection for a deleted document
    Given user "user-102" navigates to document URL "/documents/doc-uuid-abc123"
    And document "doc-uuid-abc123" does not exist (was deleted)
    When the client receives a 404 or "room.not_found" response on WebSocket connection
    Then the client makes at most 1 connection attempt (no retry loop)
    And the client displays the not-found state
    And no further WebSocket reconnection attempts are made for "doc-uuid-abc123"
```

**Test Data:**
- Document ID: `doc-uuid-abc123` (deleted)

**Preconditions:**
- Document does not exist

---

### T-8.1: Delete action presents confirmation dialog before proceeding
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: User is shown confirmation dialog before document deletion
    Given user "user-101" (admin) is viewing document "My Q3 Roadmap" (id: "doc-uuid-abc123")
    And user "user-101" has delete permission
    When user "user-101" selects "Delete Document" from the document action menu
    Then a confirmation dialog is displayed with the message:
      "Are you sure you want to delete 'My Q3 Roadmap'? This cannot be undone and all collaborators will lose access immediately."
    And the dialog contains two actions: "Delete" (confirm) and "Cancel"
    And the document is not deleted at this point
```

**Test Data:**
- Document: `{ id: "doc-uuid-abc123", title: "My Q3 Roadmap" }`
- User: `{ user_id: "user-101", role: "admin" }`

**Preconditions:**
- User is authenticated and on the document page
- User has delete permission on the document

---

### T-8.2: Canceling deletion dialog leaves document intact
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: User cancels deletion and document remains
    Given user "user-101" is viewing the delete confirmation dialog for "doc-uuid-abc123"
    When user "user-101" clicks "Cancel"
    Then the confirmation dialog is dismissed
    And document "doc-uuid-abc123" remains in the data store
    And the document editor is accessible as before
    And no "document.deleted" event is broadcast
```

**Test Data:**
- Document ID: `doc-uuid-abc123`

**Preconditions:**
- Delete confirmation dialog is open
- Document exists and is accessible

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated delete request is rejected
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated request to delete endpoint returns 401
    Given no valid authentication token is present in the request
    When a DELETE request is made to "/api/documents/doc-uuid-abc123"
    Then the server returns 401 Unauthorized
    And the response body contains an authentication error message
    And document "doc-uuid-abc123" is not deleted
    And no "document.deleted" event is broadcast to the document room
```

**Test Data:**
- Request: `DELETE /api/documents/doc-uuid-abc123` with no `Authorization` header
- Document ID: `doc-uuid-abc123` (must remain intact)

**Preconditions:**
- Document `doc-uuid-abc123` exists
- No auth token in request headers

---

### T-AUTH-2.1: Viewer cannot delete document via API
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated viewer gets 403 when attempting document deletion
    Given user "user-103" is authenticated with the Viewer role
    And user "user-103" does not have delete permission on document "doc-uuid-abc123"
    When user "user-103" sends a DELETE request to "/api/documents/doc-uuid-abc123"
    Then the server returns 403 Forbidden
    And the response body contains: "You do not have permission to delete this document"
    And document "doc-uuid-abc123" is not deleted
    And no "document.deleted" event is broadcast
```

**Test Data:**
- User: `{ user_id: "user-103", role: "viewer", token: "valid-viewer-jwt" }`
- Request: `DELETE /api/documents/doc-uuid-abc123` with valid viewer auth token

**Preconditions:**
- Document exists
- User is authenticated but lacks delete permission

---

### T-AUTH-2.2: Commenter cannot delete document via API
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated commenter gets 403 when attempting document deletion
    Given user "user-104" is authenticated with the Commenter role
    When user "user-104" sends a DELETE request to "/api/documents/doc-uuid-abc123"
    Then the server returns 403 Forbidden
    And the response body contains: "You do not have permission to delete this document"
    And document "doc-uuid-abc123" is not deleted
```

**Test Data:**
- User: `{ user_id: "user-104", role: "commenter", token: "valid-commenter-jwt" }`

**Preconditions:**
- Document exists
- User is authenticated as commenter

---

## Negative Tests

### T-N-1: Delete DB transaction failure — no event broadcast, document preserved
**Maps to:** Non-functional error handling
**Category:** error-handling

```gherkin
  Scenario: Database transaction fails during deletion — document preserved, no broadcast
    Given user "user-101" has initiated and confirmed document deletion of "doc-uuid-abc123"
    And the database transaction for deletion fails mid-flight
    When the delete API processes the request
    Then the server returns 500 Internal Server Error
    And document "doc-uuid-abc123" remains accessible in the data store
    And no "document.deleted" event is broadcast to the WebSocket room
    And user "user-101" sees a server error message
```

**Test Data:**
- Simulated DB failure (use fault injection / mock)

**Preconditions:**
- Document exists
- DB failure injected server-side

---

### T-N-2: Duplicate document.deleted event is a no-op on client
**Maps to:** Non-functional error handling
**Category:** error-handling

```gherkin
  Scenario: Client receives duplicate document.deleted event without side effects
    Given user "user-102" has already received and processed one "document.deleted" event
    And the deletion modal was displayed once
    When a second "document.deleted" event is received by the same client for the same document
    Then the modal is not shown a second time
    And no second redirect is triggered
    And no JavaScript error occurs
```

**Test Data:**
- Two identical `document.deleted` events for `doc-uuid-abc123`

**Preconditions:**
- Client already processed the first deletion event (modal was shown, user dismissed it and was redirected)

---

## Boundary Tests

### T-B-1: Broadcast latency at max concurrent connections
**Maps to:** AC-1 (non-functional performance)
**Category:** performance / boundary

```gherkin
  Scenario: Termination event delivered within 1 second for maximum concurrent connections
    Given the maximum number of concurrent clients are connected to document "doc-uuid-stress-001"
    When a user with delete permission deletes the document
    Then the "document.deleted" event is delivered to all clients within 1000 milliseconds at p95
```

**Test Data:**
- Document ID: `doc-uuid-stress-001`
- Connected clients: max concurrent editors (TBD per G-15; use 100 as provisional load target)

**Preconditions:**
- Load test environment with max concurrent WebSocket connections
- Performance monitoring in place

---

---

# Test Specifications: TMPL-01 — Admin Creates a Document Template

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1, T-5.2 | edge-case |
| AC-6 | T-6.1 | happy-path |
| AC-7 | T-7.1, T-7.2 | happy-path |
| AC-8 | T-8.1 | error-handling |
| AC-9 | T-9.1 | boundary |
| AC-10 | T-10.1, T-10.2 | boundary |
| AC-11 | T-11.1 | security |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Admin sees template list and create button
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Admin Creates a Document Template

  Scenario: Admin navigates to template management and sees existing templates
    Given user "admin-001" is authenticated with the Admin role
    And templates "Weekly Status Report" and "Project Kickoff" exist in workspace "ws-001"
    When user "admin-001" navigates to "/admin/settings/templates"
    Then the page displays a list containing "Weekly Status Report" and "Project Kickoff"
    And a "Create Template" button is visible and enabled
```

**Test Data:**
- Admin user: `{ user_id: "admin-001", role: "admin", workspace_id: "ws-001" }`
- Existing templates: `["Weekly Status Report", "Project Kickoff"]`

**Preconditions:**
- Admin is authenticated
- Two templates exist in the workspace

---

### T-1.2: Admin sees empty state with create prompt when no templates exist
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Admin sees empty state when no templates exist
    Given user "admin-001" is authenticated with the Admin role
    And no templates exist in workspace "ws-001"
    When user "admin-001" navigates to "/admin/settings/templates"
    Then the page displays an empty state with a "Create Template" prompt
    And a "Create Template" button is visible and enabled
```

**Test Data:**
- Admin user: `{ user_id: "admin-001", role: "admin" }`
- Workspace templates: none

**Preconditions:**
- Admin authenticated
- No templates in workspace

---

### T-2.1: All rich-text formatting elements are preserved on save
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Admin saves template with full rich-text formatting and all formatting is preserved
    Given user "admin-001" is on the "Create Template" page
    When the admin authors template content containing:
      | element         | example_content                          |
      | H1 heading      | "Project Overview"                       |
      | H2 heading      | "Goals"                                  |
      | H3 heading      | "Key Results"                            |
      | bold text       | "Important: review before sharing"       |
      | italic text     | "See appendix for reference"             |
      | underline text  | "Action required"                        |
      | bulleted list   | "Item A", "Item B", "Item C"             |
      | numbered list   | "Step 1", "Step 2", "Step 3"             |
      | code block      | "SELECT * FROM projects WHERE active=1"  |
      | table           | 2 columns × 3 rows of placeholder text   |
      | hyperlink       | text "Confluence", url "https://conf.example.com" |
    And the admin enters name "Project Template" and clicks "Save Template"
    Then the template is saved successfully
    And when the template is opened for viewing, all formatting elements are rendered exactly as authored
```

**Test Data:**
- Template name: `"Project Template"`
- Content: full rich-text feature set as described

**Preconditions:**
- Admin is authenticated
- Template editor supports all listed element types

---

### T-2.2: Template preview after save matches authored content
**Maps to:** AC-2
**Category:** edge-case

```gherkin
  Scenario: Template preview accurately reflects saved rich-text content
    Given admin "admin-001" has saved template "Meeting Notes" with an H1, a bulleted list, and a code block
    When admin "admin-001" opens "Meeting Notes" from the template list
    Then the template editor/preview renders the H1 heading, bulleted list, and code block without data loss or formatting regression
```

**Test Data:**
- Template name: `"Meeting Notes"`
- Content: `{ h1: "Meeting Agenda", bullets: ["Topic 1", "Topic 2"], code_block: "# shell command" }`

**Preconditions:**
- Template was previously saved

---

### T-3.1: Template saves with valid name and appears in list with timestamp
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Admin saves a named template and it appears in the template list
    Given user "admin-001" has authored template content
    And has entered the template name "Q4 Planning Doc"
    When admin "admin-001" clicks "Save Template"
    Then the system persists the template
    And displays a success notification: "Template saved"
    And "Q4 Planning Doc" appears in the template list
    And the template list entry shows the name "Q4 Planning Doc" and a creation timestamp
```

**Test Data:**
- Template name: `"Q4 Planning Doc"` (18 chars, valid)
- Expected list entry: `{ name: "Q4 Planning Doc", created_at: <ISO timestamp> }`

**Preconditions:**
- Admin is authenticated
- Template name is valid (1–100 chars, no leading/trailing whitespace)

---

### T-3.2: Template name with leading/trailing whitespace is trimmed or rejected
**Maps to:** AC-3
**Category:** boundary

```gherkin
  Scenario: Template name with leading whitespace is treated as invalid or trimmed
    Given user "admin-001" enters the template name "  Sprint Review  " (with leading and trailing spaces)
    When admin "admin-001" clicks "Save Template"
    Then either:
      - the name is trimmed to "Sprint Review" and the template saves successfully, OR
      - an inline validation message is displayed: "Template name must not have leading or trailing whitespace."
    And no template is saved with the raw whitespace-padded name
```

**Test Data:**
- Input name: `"  Sprint Review  "` (leading + trailing spaces)

**Preconditions:**
- Admin on create template page

---

### T-4.1: Image in template is stored as reference URL, not base64
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: Admin inserts image; template stores reference URL, not base64
    Given admin "admin-001" is authoring a new template
    When they insert an image by uploading "logo.png" (50KB)
    And click "Save Template" with name "Brand Template"
    Then the template is saved with the image represented as a reference URL (e.g., "https://storage.example.com/ws-001/images/logo-abc123.png")
    And the raw template content does NOT contain a base64 data URI for the image
    And when the template is previewed, the image renders from the reference URL
```

**Test Data:**
- Image: `logo.png` (50KB PNG)
- Expected image storage: S3-backed URL, not `data:image/png;base64,...`

**Preconditions:**
- Admin on create template page
- Image storage service is operational

---

### T-5.1: Editing template does not change documents previously created from it
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: Editing template does not retroactively change existing documents
    Given template "Release Notes v1" was saved with content "## Summary\nPlaceholder text"
    And editor "user-102" created document "doc-555" from template "Release Notes v1"
    And document "doc-555" was saved with content "## Summary\nActual release notes for v1.0"
    When admin "admin-001" edits template "Release Notes v1" to change the content to "## Overview\nNew placeholder"
    And saves the template
    Then document "doc-555" still contains "## Summary\nActual release notes for v1.0"
    And the template "Release Notes v1" shows the updated content "## Overview\nNew placeholder"
```

**Test Data:**
- Template: `{ name: "Release Notes v1", content: "## Summary\nPlaceholder text" }`
- Document: `{ id: "doc-555", content: "## Summary\nActual release notes for v1.0" }`

**Preconditions:**
- Template and document both exist
- Document was created from the template before the template edit

---

### T-5.2: Editing a document created from a template does not change the template
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: Document edits do not propagate back to the source template
    Given template "Onboarding Checklist" exists with content "- [ ] Task A"
    And document "doc-666" was created from "Onboarding Checklist" and now contains "- [x] Task A — done by Jane"
    When admin "admin-001" views template "Onboarding Checklist"
    Then the template content is still "- [ ] Task A"
    And no changes from "doc-666" appear in the template
```

**Test Data:**
- Template: `{ name: "Onboarding Checklist", content: "- [ ] Task A" }`
- Document: `{ id: "doc-666", content: "- [x] Task A — done by Jane" }`

**Preconditions:**
- Both template and document exist

---

### T-6.1: Admin edits existing template and changes are persisted
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Admin edits a template and changes are saved with updated timestamp
    Given template "Weekly Sync" exists with name "Weekly Sync" and content "# Agenda"
    When admin "admin-001" clicks "Edit" on template "Weekly Sync"
    And changes the name to "Weekly Team Sync"
    And adds a line "## Action Items" to the content
    And clicks "Save"
    Then the template is updated with name "Weekly Team Sync" and content "# Agenda\n## Action Items"
    And the template list shows "Weekly Team Sync" with a "Last modified" timestamp reflecting the current time
    And "Weekly Sync" no longer appears in the template list
```

**Test Data:**
- Original template: `{ name: "Weekly Sync", content: "# Agenda" }`
- Updated name: `"Weekly Team Sync"`
- Updated content: `"# Agenda\n## Action Items"`

**Preconditions:**
- Template exists in workspace
- Admin is authenticated

---

### T-7.1: Admin deletes a template and it disappears from list
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: Admin deletes a template after confirmation
    Given template "Deprecated Template" exists in workspace "ws-001"
    When admin "admin-001" clicks "Delete" on "Deprecated Template"
    And confirms the deletion in the confirmation dialog
    Then "Deprecated Template" is removed from the template list
    And "Deprecated Template" is no longer available for document creation
    And the template is removed from the data store
```

**Test Data:**
- Template: `{ name: "Deprecated Template", id: "tmpl-999" }`

**Preconditions:**
- Template exists
- Admin is authenticated

---

### T-7.2: Documents previously created from deleted template are unaffected
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: Deleting a template does not affect documents created from it
    Given template "Old Kickoff Template" (id: "tmpl-100") was deleted
    And document "doc-777" was previously created from "tmpl-100" and contains "# Project Kickoff\nObjective: ..."
    When editor "user-102" opens document "doc-777"
    Then the document opens normally with content "# Project Kickoff\nObjective: ..."
    And no error is shown regarding the deleted template
```

**Test Data:**
- Deleted template: `{ id: "tmpl-100", name: "Old Kickoff Template" }`
- Existing document: `{ id: "doc-777", content: "# Project Kickoff\nObjective: ..." }`

**Preconditions:**
- Template has been deleted
- Document was created from the template before deletion

---

### T-8.1: Network error during save shows inline error with preserved content
**Maps to:** AC-8
**Category:** error-handling

```gherkin
  Scenario: Network error during template save shows inline error and preserves editor content
    Given admin "admin-001" has authored template content "# Project Brief\nObjective: ..." in the editor
    And has entered template name "Project Brief"
    When admin "admin-001" clicks "Save Template"
    And a network error occurs during the save request
    Then the UI displays an inline error: "Failed to save template. Your changes are preserved — please try again."
    And the template editor still shows the content "# Project Brief\nObjective: ..."
    And no partial or corrupt template record is created on the server
```

**Test Data:**
- Template name: `"Project Brief"`
- Content: `"# Project Brief\nObjective: ..."`
- Simulated network failure during POST to `/api/templates`

**Preconditions:**
- Admin is authenticated on the create template page
- Network failure is injected (use test double or network condition simulation)

---

## Negative Tests

### T-9.1: Empty template name is rejected with inline validation
**Maps to:** AC-9
**Category:** boundary

```gherkin
  Scenario: Save is blocked when template name is empty
    Given admin "admin-001" is on the create template page with valid template content
    And the template name field is empty
    When admin "admin-001" clicks "Save Template"
    Then the save action does not proceed
    And an inline validation message is displayed: "Template name is required."
    And no template is created
```

**Test Data:**
- Template name: `""` (empty string)

**Preconditions:**
- Admin on create template page
- Template body has content

---

### T-9.2: Template name with only whitespace is rejected
**Maps to:** AC-9
**Category:** boundary

```gherkin
  Scenario: Save is blocked when template name contains only whitespace
    Given admin "admin-001" enters the template name "     " (five spaces)
    When admin "admin-001" clicks "Save Template"
    Then the save action does not proceed
    And an inline validation message is displayed: "Template name is required."
```

**Test Data:**
- Template name: `"     "` (5 spaces only)

**Preconditions:**
- Admin on create template page

---

### T-10.1: Template name at exactly 100 characters is accepted
**Maps to:** AC-10
**Category:** boundary

```gherkin
  Scenario: Template name of exactly 100 characters saves successfully
    Given admin "admin-001" enters a template name that is exactly 100 characters long:
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" (100 A's)
    When admin "admin-001" clicks "Save Template"
    Then the template is saved successfully
    And the template list shows the full 100-character name
```

**Test Data:**
- Template name: 100 × `"A"` = `"AAAA...A"` (100 chars)

**Preconditions:**
- Admin on create template page

---

### T-10.2: Template name of 101 characters is rejected
**Maps to:** AC-10
**Category:** boundary

```gherkin
  Scenario: Template name exceeding 100 characters is rejected with inline error
    Given admin "admin-001" enters a template name that is 101 characters long
    When admin "admin-001" clicks "Save Template"
    Then the save action is blocked
    And an inline validation message reads: "Template name must be 100 characters or fewer."
    And no template is created
```

**Test Data:**
- Template name: 101 × `"B"` = `"BBBB...B"` (101 chars)

**Preconditions:**
- Admin on create template page

---

## Authorization Tests

### T-11.1: Non-admin user is redirected with 403 when accessing template management URL
**Maps to:** AC-11
**Category:** security

```gherkin
  Scenario: Editor navigating directly to template management URL is blocked
    Given user "user-102" is authenticated with the Editor role
    When user "user-102" navigates directly to "/admin/settings/templates"
    Then the server returns 403 Forbidden
    And the user is redirected to their document dashboard
    And a message is displayed: "You do not have permission to manage templates."
```

**Test Data:**
- User: `{ user_id: "user-102", role: "editor", token: "valid-editor-jwt" }`
- Target URL: `/admin/settings/templates`

**Preconditions:**
- User is authenticated as editor (not admin)

---

### T-AUTH-1.1: Unauthenticated request to any template endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated requests to template CRUD endpoints return 401
    Given no valid authentication token is present
    When requests are made to the following endpoints without an Authorization header:
      | method | endpoint                  |
      | GET    | /api/templates            |
      | POST   | /api/templates            |
      | PUT    | /api/templates/tmpl-001   |
      | DELETE | /api/templates/tmpl-001   |
    Then each request returns 401 Unauthorized
    And no template data is returned or modified
```

**Test Data:**
- No auth token in any request
- Template: `{ id: "tmpl-001" }` (exists in DB)

**Preconditions:**
- Template `tmpl-001` exists
- No auth token provided

---

### T-AUTH-2.1: Editor cannot create a template via API
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated editor gets 403 when calling the create template API
    Given user "user-102" is authenticated with the Editor role
    When user "user-102" sends POST to "/api/templates" with body:
      """
      { "name": "Injected Template", "content": "# Injected Content" }
      """
    Then the server returns 403 Forbidden
    And the response body contains: "Admin role required to manage templates."
    And no template is created
```

**Test Data:**
- User: `{ user_id: "user-102", role: "editor", token: "valid-editor-jwt" }`
- Request body: `{ name: "Injected Template", content: "# Injected Content" }`

**Preconditions:**
- User is authenticated as editor

---

### T-AUTH-2.2: Viewer cannot update or delete a template via API
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated viewer gets 403 when calling update or delete template API
    Given user "user-103" is authenticated with the Viewer role
    And template "tmpl-001" exists
    When user "user-103" sends PUT to "/api/templates/tmpl-001" with name change
    Then the server returns 403 Forbidden with "Admin role required to manage templates."
    When user "user-103" sends DELETE to "/api/templates/tmpl-001"
    Then the server returns 403 Forbidden with "Admin role required to manage templates."
    And template "tmpl-001" is not modified or deleted
```

**Test Data:**
- User: `{ user_id: "user-103", role: "viewer", token: "valid-viewer-jwt" }`
- Template: `{ id: "tmpl-001", name: "Protected Template" }`

**Preconditions:**
- User is authenticated as viewer
- Template exists

---

---

# Test Specifications: TMPL-02 — Editor Creates a Document from Template

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1 | edge-case |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1 | edge-case |
| AC-6 | T-6.1 | edge-case |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1 | error-handling |
| AC-9 | T-9.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Editor sees template selection options at document creation
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Editor Creates a Document from Template

  Scenario: Editor sees "Start from blank" and "Start from template" options at creation
    Given user "user-102" is authenticated with the Editor role
    And templates "Weekly Status" and "OKR Planning" exist in workspace "ws-001"
    When user "user-102" initiates "Create New Document"
    Then the creation dialog presents two options: "Start from blank" and "Start from template"
    And when user "user-102" selects "Start from template"
    Then a list of available templates is displayed including "Weekly Status" and "OKR Planning"
```

**Test Data:**
- User: `{ user_id: "user-102", role: "editor" }`
- Available templates: `["Weekly Status", "OKR Planning"]`

**Preconditions:**
- Editor is authenticated
- Two templates exist in the workspace

---

### T-1.2: Admin also sees template selection at document creation
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Admin can also create a document from a template
    Given user "admin-001" is authenticated with the Admin role
    And template "Kickoff Agenda" exists in workspace "ws-001"
    When user "admin-001" initiates "Create New Document" and selects "Start from template"
    Then the template list includes "Kickoff Agenda"
    And user "admin-001" can select it to create a document
```

**Test Data:**
- User: `{ user_id: "admin-001", role: "admin" }`
- Template: `"Kickoff Agenda"`

**Preconditions:**
- Admin authenticated
- Template exists

---

### T-2.1: New document contains all template formatting elements correctly rendered
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Document created from template contains all template content and formatting
    Given template "Project Kickoff" (id: "tmpl-pk-001") has the following content:
      | element        | content                                       |
      | H1             | "Project Kickoff"                             |
      | H2             | "Objectives"                                  |
      | H3             | "Key Metrics"                                 |
      | bold           | "Owner: TBD"                                  |
      | italic         | "Status: draft"                               |
      | underline      | "Action required"                             |
      | bulleted list  | "Milestone 1", "Milestone 2"                  |
      | numbered list  | "Step 1: Align", "Step 2: Execute"            |
      | code block     | "SELECT * FROM metrics WHERE project_id=X"    |
      | table          | 2×2 with headers "Phase" and "Owner"          |
      | hyperlink      | text: "Confluence", url: "https://conf.example.com" |
      | image          | reference URL: "https://storage.example.com/logo.png" |
    When user "user-102" selects template "Project Kickoff" and confirms creation
    Then a new document opens in the editor
    And all listed formatting elements are present and rendered correctly matching the template
```

**Test Data:**
- Template ID: `tmpl-pk-001`
- All rich-text element types as defined above

**Preconditions:**
- Template `tmpl-pk-001` exists with all listed formatting
- Editor is authenticated and in "Create New Document" flow

---

### T-3.1: Images in new document render as reference URLs, not base64
**Maps to:** AC-3
**Category:** edge-case

```gherkin
  Scenario: Document created from template uses reference URLs for images
    Given template "Brand Template" (id: "tmpl-brand-001") contains an image stored at:
      "https://storage.example.com/ws-001/images/brand-logo-abc.png"
    When user "user-102" creates a document from template "Brand Template"
    Then the new document's raw content stores the image as:
      "https://storage.example.com/ws-001/images/brand-logo-abc.png" (reference URL)
    And the document content does NOT contain a base64-encoded data URI for the image
    And the image renders correctly in the document editor
```

**Test Data:**
- Template: `{ id: "tmpl-brand-001", image_url: "https://storage.example.com/ws-001/images/brand-logo-abc.png" }`

**Preconditions:**
- Template exists with a reference URL image
- Image storage URL is accessible

---

### T-4.1: Editing template after document creation does not affect the document
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: Document retains original template content when template is later edited
    Given template "Sprint Retro" (id: "tmpl-sr-001") has content "## What went well\n## What to improve"
    And user "user-102" created document "doc-888" from template "tmpl-sr-001" at T+0
    And document "doc-888" currently contains "## What went well\n## What to improve"
    When admin "admin-001" edits template "tmpl-sr-001" to "## Positives\n## Improvements\n## Actions" at T+1
    Then document "doc-888" still contains "## What went well\n## What to improve"
    And the template "Sprint Retro" shows "## Positives\n## Improvements\n## Actions"
```

**Test Data:**
- Template original content: `"## What went well\n## What to improve"`
- Template updated content: `"## Positives\n## Improvements\n## Actions"`
- Document: `{ id: "doc-888" }` created before template edit

**Preconditions:**
- Template and document exist
- Document was created before the template was edited

---

### T-5.1: Document is intact after source template is deleted
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: Document opens normally after its source template is deleted
    Given user "user-102" created document "doc-999" from template "tmpl-deleted-001"
    And admin "admin-001" later deletes template "tmpl-deleted-001"
    When user "user-102" opens document "doc-999"
    Then the document opens with full content intact
    And no error is displayed regarding the missing template
    And the document is fully editable
```

**Test Data:**
- Deleted template ID: `tmpl-deleted-001`
- Document: `{ id: "doc-999", source_template: "tmpl-deleted-001" }`

**Preconditions:**
- Document was created from the template
- Template has since been deleted

---

### T-6.1: Deleted template does not appear in template selection list
**Maps to:** AC-6
**Category:** edge-case

```gherkin
  Scenario: Template list does not show deleted templates
    Given templates "Active Template" and "Deleted Template" both existed in workspace "ws-001"
    And admin "admin-001" has deleted "Deleted Template"
    When user "user-102" opens the "Start from template" dialog
    Then the template list contains "Active Template"
    And "Deleted Template" is NOT present in the list
```

**Test Data:**
- Active template: `"Active Template"`
- Deleted template: `"Deleted Template"` (removed from DB)

**Preconditions:**
- "Deleted Template" has been deleted
- "Active Template" still exists

---

### T-7.1: Creating a document from an empty template creates a blank document
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: Creating a document from an empty-content template creates a document without error
    Given template "Empty Template" (id: "tmpl-empty-001") has an empty body and name "Empty Template"
    When user "user-102" creates a document from "Empty Template"
    Then a new document is created without error
    And the document body is empty
    And the document title is either "Empty Template" (inherited from template name) or a default title
    And the document is editable
```

**Test Data:**
- Template: `{ id: "tmpl-empty-001", name: "Empty Template", content: "" }`

**Preconditions:**
- Template with empty body exists

---

### T-8.1: Document creation failure shows inline error and keeps dialog open
**Maps to:** AC-8
**Category:** error-handling

```gherkin
  Scenario: Server error during document creation shows inline error; dialog remains open
    Given user "user-102" selects template "Weekly Status" in the creation dialog
    And confirms creation
    And the server returns a 500 error during document creation
    Then the user sees an inline error: "Failed to create document. Please try again."
    And no partial document is created
    And the template selection dialog remains open with "Weekly Status" still selected
    And user "user-102" can retry without re-selecting the template
```

**Test Data:**
- Template: `"Weekly Status"`
- Server response: 500 Internal Server Error
- Expected UI state: dialog open, template pre-selected, error shown

**Preconditions:**
- Template exists
- Server error is simulated during POST to `/api/documents`

---

### T-9.1: Empty template list shows empty state with blank document fallback
**Maps to:** AC-9
**Category:** edge-case

```gherkin
  Scenario: No templates available — empty state shown with blank document option
    Given no templates exist in workspace "ws-001"
    When user "user-102" opens the "Start from template" dialog
    Then the dialog displays: "No templates available. Ask your admin to create one."
    And a "Start from blank" option is available as a fallback
    And no error is thrown
```

**Test Data:**
- Workspace templates: none

**Preconditions:**
- Editor is authenticated
- No templates exist in the workspace

---

## Negative Tests

### T-N-1: Template list fails to load — inline error shown
**Maps to:** Non-functional error handling
**Category:** error-handling

```gherkin
  Scenario: Template list API failure shows inline error with blank fallback
    Given the template list API endpoint is unavailable (returns 503)
    When user "user-102" opens the "Start from template" dialog
    Then the dialog displays an inline error: "Unable to load templates. Try again or start from blank."
    And the "Start from blank" option is still functional
```

**Test Data:**
- GET `/api/templates` returns 503 Service Unavailable

**Preconditions:**
- Template service is simulated as unavailable

---

### T-N-2: Broken image URL in template does not prevent document creation
**Maps to:** Non-functional error handling
**Category:** error-handling

```gherkin
  Scenario: Broken reference image in template does not fail document creation
    Given template "Brand Template" has an image with URL "https://storage.example.com/deleted-img.png" (broken)
    When user "user-102" creates a document from "Brand Template"
    Then the document is created successfully
    And the image slot shows a broken-image icon
    And no creation error is thrown
```

**Test Data:**
- Template with broken image URL: `"https://storage.example.com/deleted-img.png"`

**Preconditions:**
- Template exists
- Image URL resolves to 404

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to document creation returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated request to template-based document creation returns 401
    Given no valid authentication token is present
    When a POST request is made to "/api/documents" with body:
      """
      { "template_id": "tmpl-pk-001", "project_id": "proj-001" }
      """
    Then the server returns 401 Unauthorized
    And no document is created
```

**Test Data:**
- Request: `POST /api/documents` with no `Authorization` header
- Request body: `{ template_id: "tmpl-pk-001", project_id: "proj-001" }`

**Preconditions:**
- No auth token in request

---

### T-AUTH-2.1: Viewer cannot create a document from a template via API
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated viewer gets 403 when attempting document creation
    Given user "user-103" is authenticated with the Viewer role
    When user "user-103" sends POST to "/api/documents" with body:
      """
      { "template_id": "tmpl-pk-001", "project_id": "proj-001" }
      """
    Then the server returns 403 Forbidden
    And the response body contains: "You do not have permission to create documents."
    And no document is created
```

**Test Data:**
- User: `{ user_id: "user-103", role: "viewer", token: "valid-viewer-jwt" }`
- Request body: `{ template_id: "tmpl-pk-001", project_id: "proj-001" }`

**Preconditions:**
- User is authenticated as viewer

---

## Boundary Tests

### T-B-1: Document creation from 500KB template completes within 2 seconds
**Maps to:** Non-functional performance
**Category:** performance / boundary

```gherkin
  Scenario: Document creation from large template meets p95 performance target
    Given template "Large Doc Template" has content that is 500KB in size
    When user "user-102" creates a document from "Large Doc Template"
    Then the document opens in the editor within 2000 milliseconds at p95
```

**Test Data:**
- Template content size: exactly 500KB
- Performance target: document creation and editor load in < 2000ms at p95

**Preconditions:**
- Performance test environment with monitoring instrumentation

---

---

# Test Specifications: EXP-01 — Export Document as Markdown

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1 | edge-case |
| AC-6 | T-6.1, T-6.2 | happy-path |
| AC-7 | T-7.1 | boundary |
| AC-8 | T-8.1 | error-handling |
| AC-9 | T-9.1 | error-handling |
| AC-10 | T-10.1 | edge-case |
| AC-11 | T-11.1, T-11.2 | happy-path |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Editor sees Export option with Markdown choice in document toolbar
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Export Document as Markdown

  Scenario: Editor sees Export > Markdown option in document action menu
    Given user "user-102" is authenticated with the Editor role
    And user "user-102" is viewing document "doc-export-001" ("Q3 Roadmap")
    When user "user-102" opens the document action menu (or toolbar)
    Then an "Export" option is present
    And selecting "Export" presents format choices including "Markdown (.md)"
```

**Test Data:**
- User: `{ user_id: "user-102", role: "editor" }`
- Document: `{ id: "doc-export-001", title: "Q3 Roadmap" }`

**Preconditions:**
- Editor is authenticated and on the document page

---

### T-1.2: Commenter and Admin also see the Export option
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Commenter and Admin roles can see the Export option
    Given user "user-104" is authenticated with the Commenter role
    And user "admin-001" is authenticated with the Admin role
    And both are viewing document "doc-export-001"
    When each user opens the document action menu
    Then both "user-104" and "admin-001" see the "Export" option
    And both can select "Markdown (.md)"
```

**Test Data:**
- Commenter: `{ user_id: "user-104", role: "commenter" }`
- Admin: `{ user_id: "admin-001", role: "admin" }`

**Preconditions:**
- Both users authenticated and viewing the document

---

### T-2.1: Headings export with correct Markdown notation
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Document headings export as correct Markdown heading syntax
    Given document "doc-export-001" contains the following headings:
      | level | text                 |
      | H1    | "Annual Strategy"    |
      | H2    | "Financial Goals"    |
      | H3    | "Key Metrics"        |
    When user "user-102" exports the document as Markdown
    Then the exported .md file contains:
      """
      # Annual Strategy
      ## Financial Goals
      ### Key Metrics
      """
    And the heading text is preserved exactly
```

**Test Data:**
- Document headings: H1 `"Annual Strategy"`, H2 `"Financial Goals"`, H3 `"Key Metrics"`
- Expected output lines: `"# Annual Strategy"`, `"## Financial Goals"`, `"### Key Metrics"`

**Preconditions:**
- Document with all three heading levels exists
- User has export permission

---

### T-3.1: Inline formatting exports correctly with underline dropped silently
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Bold, italic, underline, and hyperlink format correctly in Markdown export
    Given document "doc-export-001" contains:
      | formatting | text                           |
      | bold       | "Important Note"               |
      | italic     | "refer to appendix"            |
      | underline  | "Action Required"              |
      | hyperlink  | text: "Docs", url: "https://docs.example.com" |
    When user "user-102" exports the document as Markdown
    Then the exported file contains:
      | formatting | exported_as                              |
      | bold       | "**Important Note**"                     |
      | italic     | "*refer to appendix*"                    |
      | underline  | "Action Required" (no markup — dropped)  |
      | hyperlink  | "[Docs](https://docs.example.com)"       |
    And no error is thrown for the underline (it is silently dropped)
    And no `<u>` HTML tag is emitted
```

**Test Data:**
- Input: bold `"Important Note"`, italic `"refer to appendix"`, underline `"Action Required"`, link `[Docs](https://docs.example.com)`
- Expected: `**Important Note**`, `*refer to appendix*`, `Action Required` (no markup), `[Docs](https://docs.example.com)`

**Preconditions:**
- Document with all listed inline formatting types exists

---

### T-4.1: Images export as Markdown image syntax with reference URL
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Images export as Markdown image reference syntax
    Given document "doc-export-001" contains an image with:
      | field    | value                                                    |
      | alt text | "Company Logo"                                           |
      | url      | "https://storage.example.com/ws-001/images/logo-abc.png" |
    When user "user-102" exports the document as Markdown
    Then the exported file contains:
      "![Company Logo](https://storage.example.com/ws-001/images/logo-abc.png)"
```

**Test Data:**
- Image: `{ alt: "Company Logo", url: "https://storage.example.com/ws-001/images/logo-abc.png" }`
- Expected Markdown: `![Company Logo](https://storage.example.com/ws-001/images/logo-abc.png)`

**Preconditions:**
- Document with a reference-URL image exists

---

### T-4.2: Image with no alt text exports with empty alt string
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: Image without alt text exports with empty alt text in Markdown
    Given document "doc-export-001" contains an image with no alt attribute set:
      | field    | value                                    |
      | alt text | (none / empty)                           |
      | url      | "https://storage.example.com/img.png"    |
    When user "user-102" exports the document as Markdown
    Then the exported file contains:
      "![](https://storage.example.com/img.png)"
```

**Test Data:**
- Image: `{ alt: null, url: "https://storage.example.com/img.png" }`
- Expected Markdown: `![](https://storage.example.com/img.png)`

**Preconditions:**
- Document with an image that has no alt text

---

### T-5.1: Comments and suggestions are excluded from Markdown export
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: Exported Markdown contains only body text; comments and suggestions are excluded
    Given document "doc-export-001" has the following content:
      - Body text: "The Q3 target is 10M ARR."
      - Inline comment on "10M": "Is this right? Should be 12M." (by user-103)
      - Pending suggestion to replace "10M" with "12M" (unaccepted)
    When user "user-102" exports the document as Markdown
    Then the exported file contains: "The Q3 target is 10M ARR."
    And the file does NOT contain the comment text "Is this right? Should be 12M."
    And the file does NOT contain the suggested replacement "12M"
    And no comment markers or thread IDs appear in the file
```

**Test Data:**
- Document body: `"The Q3 target is 10M ARR."`
- Comment (must be excluded): `"Is this right? Should be 12M."`
- Pending suggestion (must not be applied): replace `"10M"` with `"12M"`

**Preconditions:**
- Document has both inline comments and unaccepted suggestions

---

### T-6.1: Code block with language hint exports with language identifier
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Code block with language identifier exports correctly fenced
    Given document "doc-export-001" contains a code block with language "python" and content:
      "def greet(name):\n    return f'Hello, {name}!'"
    When user "user-102" exports the document as Markdown
    Then the exported file contains:
      """
      ```python
      def greet(name):
          return f'Hello, {name}!'
      ```
      """
```

**Test Data:**
- Code block: `{ language: "python", content: "def greet(name):\n    return f'Hello, {name}!'" }`

**Preconditions:**
- Document with a language-tagged code block exists

---

### T-6.2: Code block without language hint exports without identifier
**Maps to:** AC-6
**Category:** edge-case

```gherkin
  Scenario: Code block with no language identifier exports with empty fence
    Given document "doc-export-001" contains a code block with no language set and content:
      "echo hello world"
    When user "user-102" exports the document as Markdown
    Then the exported file contains:
      """
      ```
      echo hello world
      ```
      """
    And no language identifier appears after the opening backticks
```

**Test Data:**
- Code block: `{ language: null, content: "echo hello world" }`

**Preconditions:**
- Document with an untagged code block exists

---

### T-7.1: Large document export returns timeout error within 35 seconds
**Maps to:** AC-7
**Category:** boundary

```gherkin
  Scenario: Export of oversized document returns timeout error message within 35 seconds
    Given document "doc-huge-001" exceeds the export processing time limit (>30 seconds server-side)
    When user "user-102" requests a Markdown export
    Then the request times out or returns an error within 35 seconds from the user's perspective
    And the UI displays: "This document is too large to export right now. Please try again or contact support."
    And the user is NOT left on an indefinitely loading state
    And no partial file is downloaded
```

**Test Data:**
- Document: `doc-huge-001` (deliberately oversized for this test)
- Max acceptable response time: 35 seconds from user perspective
- Expected message: `"This document is too large to export right now. Please try again or contact support."`

**Preconditions:**
- Test document is configured to exceed server-side 30-second generation limit

---

### T-8.1: Export of deleted document returns 404 with not-found message
**Maps to:** AC-8
**Category:** error-handling

```gherkin
  Scenario: Export of a document deleted during viewing returns 404
    Given user "user-102" is viewing document "doc-export-001"
    And document "doc-export-001" is deleted while user "user-102" is on the page
    When user "user-102" initiates a Markdown export
    Then the export API returns 404 Not Found
    And the UI displays: "This document no longer exists."
    And no file is downloaded
```

**Test Data:**
- Document: `{ id: "doc-export-001" }` (deleted before export is requested)
- Expected UI message: `"This document no longer exists."`

**Preconditions:**
- User is on the document page
- Document is deleted (simulated race condition)

---

### T-9.1: Server-side export failure returns inline error; no partial file downloaded
**Maps to:** AC-9
**Category:** error-handling

```gherkin
  Scenario: Internal server error during export shows inline error with no file delivery
    Given the server-side Markdown generation fails with a 500 Internal Server Error
    When user "user-102" requests a Markdown export of document "doc-export-001"
    Then the UI displays an inline error:
      "Export failed. Please try again. If the problem persists, contact support."
    And no file download is initiated
    And no partial or corrupt .md file is delivered to the browser
```

**Test Data:**
- Server error: 500 Internal Server Error from GET `/api/documents/doc-export-001/export?format=markdown`

**Preconditions:**
- Server export endpoint is configured to return 500 (use test double)

---

### T-10.1: Empty document exports as valid empty Markdown file
**Maps to:** AC-10
**Category:** edge-case

```gherkin
  Scenario: Empty document exports as valid empty Markdown file without error
    Given document "doc-empty-001" has a title "Untitled" but no body content
    When user "user-102" exports the document as Markdown
    Then a valid .md file is downloaded
    And the file is either zero bytes or contains only the document title as a line
    And no error is thrown during export
    And the HTTP response is 200 OK
```

**Test Data:**
- Document: `{ id: "doc-empty-001", title: "Untitled", content: "" }`

**Preconditions:**
- Document with empty body exists

---

### T-11.1: Exported file is named after the document title
**Maps to:** AC-11
**Category:** happy-path

```gherkin
  Scenario: Downloaded file is named <document-title>.md
    Given document "doc-export-001" has the title "Q3 Roadmap"
    When user "user-102" exports the document as Markdown
    Then the browser initiates a file download
    And the filename is "Q3 Roadmap.md"
```

**Test Data:**
- Document title: `"Q3 Roadmap"`
- Expected filename: `"Q3 Roadmap.md"`

**Preconditions:**
- Document with clean title exists

---

### T-11.2: Special characters in document title are replaced with hyphens in filename
**Maps to:** AC-11
**Category:** edge-case

```gherkin
  Scenario: Document title with special filename-unsafe characters produces sanitized filename
    Given document "doc-export-special" has the title "Budget / Plan: 2026 \"Draft\" <Final>"
    When user "user-102" exports the document as Markdown
    Then the downloaded filename is "Budget - Plan- 2026 -Draft- -Final-.md"
    And the characters / : " < > are each replaced with a hyphen "-"
    And the .md extension is present
```

**Test Data:**
- Document title: `"Budget / Plan: 2026 \"Draft\" <Final>"`
- Unsafe characters: `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`
- Expected filename: `"Budget - Plan- 2026 -Draft- -Final-.md"` (each unsafe char → `-`)

**Preconditions:**
- Document with special characters in title exists

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to export endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated export request returns 401 Unauthorized
    Given no valid authentication token is present in the request
    When a GET request is made to "/api/documents/doc-export-001/export?format=markdown"
    Then the server returns 401 Unauthorized
    And no file is downloaded
    And no document content is exposed
```

**Test Data:**
- Request: `GET /api/documents/doc-export-001/export?format=markdown` with no `Authorization` header

**Preconditions:**
- Document exists
- No auth token provided

---

### T-AUTH-2.1: Viewer cannot export document via API
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated viewer gets 403 when calling the export endpoint
    Given user "user-103" is authenticated with the Viewer role
    When user "user-103" sends GET to "/api/documents/doc-export-001/export?format=markdown"
    Then the server returns 403 Forbidden
    And the response body contains: "You do not have permission to export this document."
    And no file is downloaded
```

**Test Data:**
- User: `{ user_id: "user-103", role: "viewer", token: "valid-viewer-jwt" }`
- Request: `GET /api/documents/doc-export-001/export?format=markdown` with valid viewer token

**Preconditions:**
- User authenticated as viewer
- Document exists

---

### T-AUTH-2.2: Viewer does not see Export option in the document UI
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Viewer role does not see the Export option in the document toolbar
    Given user "user-103" is authenticated with the Viewer role
    And user "user-103" is viewing document "doc-export-001"
    When user "user-103" opens the document action menu
    Then the "Export" option is NOT present in the menu
```

**Test Data:**
- User: `{ user_id: "user-103", role: "viewer" }`

**Preconditions:**
- Viewer authenticated and on document page

---

## Negative Tests

### T-N-1: Export output does not contain server-side file paths or internal IDs
**Maps to:** Non-functional security
**Category:** security

```gherkin
  Scenario: Exported Markdown does not leak server paths, internal IDs, or PII
    Given document "doc-export-001" was created by user "user-102" (wanedr@gmail.com)
    When user "user-102" exports the document as Markdown
    Then the exported file content does NOT contain:
      - Any server file system path (e.g., "/var/app/data/...")
      - Any internal UUID or record ID not present in the document body
      - Any user email addresses not authored in the document body
      - Any database column names or query strings
```

**Test Data:**
- Document with standard content, no user-authored PII
- Verify exported file via content inspection

**Preconditions:**
- Document exists and is exported successfully

---

## Boundary Tests

### T-B-1: Export of 1MB document begins download within 3 seconds
**Maps to:** Non-functional performance
**Category:** performance / boundary

```gherkin
  Scenario: 1MB document export begins file download within 3000ms at p95
    Given document "doc-1mb-001" has content that is approximately 1MB
    When user "user-102" requests a Markdown export
    Then the file download begins within 3000 milliseconds at p95
    And the HTTP response starts within the 3-second window
```

**Test Data:**
- Document size: ~1MB of text content
- Performance target: download initiation < 3000ms at p95

**Preconditions:**
- Performance test environment with instrumentation
- 50 concurrent export requests can be sustained (provisional scale target)

---

---

## Summary

| Story | AC Count | Tests Generated | Auth Tests | Categories Covered |
|-------|----------|----------------|------------|--------------------|
| SESSION-01 | 10 AC + 2 AUTH | 21 | T-AUTH-1.1, T-AUTH-2.1, T-AUTH-2.2 | happy-path, edge-case, error-handling, security, boundary |
| TMPL-01 | 11 AC + 2 AUTH | 21 | T-AUTH-1.1, T-AUTH-2.1, T-AUTH-2.2 | happy-path, edge-case, error-handling, security, boundary |
| TMPL-02 | 9 AC + 2 AUTH | 17 | T-AUTH-1.1, T-AUTH-2.1 | happy-path, edge-case, error-handling, security, boundary |
| EXP-01 | 11 AC + 2 AUTH | 22 | T-AUTH-1.1, T-AUTH-2.1, T-AUTH-2.2 | happy-path, edge-case, error-handling, security, boundary |
| **Total** | **43 AC + 8 AUTH** | **81 test cases** | **8 mandatory 401/403 tests** | All categories |


# Test Specifications: EXP-02 — Export Document as PDF

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2, T-1.3 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1, T-4.2 | happy-path / edge-case |
| AC-5 | T-5.1, T-5.2 | edge-case |
| AC-6 | T-6.1 | happy-path |
| AC-7 | T-7.1, T-7.2 | happy-path |
| AC-8 | T-8.1 | boundary |
| AC-9 | T-9.1 | error-handling |
| AC-10 | T-10.1 | error-handling |
| AC-11 | T-11.1, T-11.2 | happy-path |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Editor can see PDF export option in export menu
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: PDF Export Access Control

  Scenario: Editor sees PDF export option in export menu
    Given an authenticated user with email "editor@example.com" and role "Editor"
    And the user is viewing document with id "doc-abc-123" titled "Q3 Budget Report"
    When the user opens the export menu
    Then "PDF (.pdf)" is listed as an available export format option
```

**Test Data:**
- User: `{ email: "editor@example.com", role: "Editor", status: "active", auth_token: "tok-editor-001" }`
- Document: `{ id: "doc-abc-123", title: "Q3 Budget Report", owner_id: "user-001", status: "active" }`

**Preconditions:**
- User is authenticated with a valid session token
- Document exists and is accessible by this user
- Export menu is rendered in the document toolbar

---

### T-1.2: Commenter can see PDF export option in export menu
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: PDF Export Access Control

  Scenario: Commenter sees PDF export option in export menu
    Given an authenticated user with email "commenter@example.com" and role "Commenter"
    And the user is viewing document with id "doc-abc-123" titled "Q3 Budget Report"
    When the user opens the export menu
    Then "PDF (.pdf)" is listed as an available export format option
```

**Test Data:**
- User: `{ email: "commenter@example.com", role: "Commenter", status: "active", auth_token: "tok-commenter-001" }`
- Document: `{ id: "doc-abc-123", title: "Q3 Budget Report", status: "active" }`

**Preconditions:**
- User is authenticated
- Document exists and user has Commenter access to it

---

### T-1.3: Viewer does not see PDF export option in export menu
**Maps to:** AC-1
**Category:** negative

```gherkin
Feature: PDF Export Access Control

  Scenario: Viewer does not see PDF export option
    Given an authenticated user with email "viewer@example.com" and role "Viewer"
    And the user is viewing document with id "doc-abc-123" titled "Q3 Budget Report"
    When the user opens the export menu
    Then "PDF (.pdf)" is NOT listed as an export format option
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "Viewer", status: "active", auth_token: "tok-viewer-001" }`
- Document: `{ id: "doc-abc-123", title: "Q3 Budget Report", status: "active" }`

**Preconditions:**
- User is authenticated with Viewer role only
- Document exists and user has Viewer access

---

### T-2.1: Heading levels render at distinct visual sizes in PDF
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: PDF Heading Visual Hierarchy

  Scenario: H1, H2, and H3 headings render at distinct sizes in exported PDF
    Given an authenticated user with role "Editor"
    And a document with id "doc-headings-001" containing:
      | Block Type | Content               |
      | H1         | "Annual Report 2024"  |
      | H2         | "Executive Summary"   |
      | H3         | "Key Findings"        |
      | paragraph  | "Body text here."     |
    When the user exports the document as PDF
    Then the exported PDF renders "Annual Report 2024" at font size equivalent to 24pt
    And the exported PDF renders "Executive Summary" at font size equivalent to 18pt
    And the exported PDF renders "Key Findings" at font size equivalent to 14pt
    And all three heading sizes are visually distinct from the body text font size
```

**Test Data:**
- Document: `{ id: "doc-headings-001", blocks: [{ type: "h1", text: "Annual Report 2024" }, { type: "h2", text: "Executive Summary" }, { type: "h3", text: "Key Findings" }, { type: "paragraph", text: "Body text here." }] }`
- User: `{ role: "Editor", auth_token: "tok-editor-001" }`

**Preconditions:**
- Document is saved and persisted with all three heading levels
- PDF export endpoint is available

---

### T-2.2: Document with only one heading level still exports correctly
**Maps to:** AC-2
**Category:** edge-case

```gherkin
Feature: PDF Heading Visual Hierarchy

  Scenario: Document with only H2 headings still exports with correct styling
    Given an authenticated user with role "Editor"
    And a document with id "doc-h2-only-001" containing only H2 headings and body paragraphs
    When the user exports the document as PDF
    Then H2 headings render at their defined size (18pt equivalent)
    And no H1 or H3 heading elements are present in the exported PDF
```

**Test Data:**
- Document: `{ id: "doc-h2-only-001", blocks: [{ type: "h2", text: "Section One" }, { type: "paragraph", text: "Content." }, { type: "h2", text: "Section Two" }] }`

**Preconditions:**
- Document contains no H1 or H3 blocks

---

### T-3.1: Inline formatting (bold, italic, underline, hyperlink) renders in PDF
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: PDF Inline Formatting

  Scenario: Bold, italic, underline, and hyperlink text all render correctly in PDF
    Given an authenticated user with role "Editor"
    And a document with id "doc-formatting-001" containing:
      | Text          | Formatting  | URL                        |
      | "Bold word"   | bold        | —                          |
      | "Italic word" | italic      | —                          |
      | "Underlined"  | underline   | —                          |
      | "Click here"  | hyperlink   | "https://example.com/page" |
    When the user exports the document as PDF
    Then "Bold word" renders in bold font weight in the PDF
    And "Italic word" renders in italic font style in the PDF
    And "Underlined" renders with underline decoration in the PDF
    And "Click here" renders as a blue underlined clickable link in the PDF
    And the link "Click here" resolves to the URL "https://example.com/page"
```

**Test Data:**
- Document: `{ id: "doc-formatting-001", blocks: [{ type: "paragraph", spans: [{ text: "Bold word", bold: true }, { text: " " }, { text: "Italic word", italic: true }, { text: " " }, { text: "Underlined", underline: true }, { text: " " }, { text: "Click here", href: "https://example.com/page" }] }] }`

**Preconditions:**
- Document is saved with inline formatting marks applied

---

### T-3.2: JavaScript hyperlink URL is sanitized in PDF
**Maps to:** AC-3 (security NFR)
**Category:** security / negative

```gherkin
Feature: PDF Inline Formatting Security

  Scenario: JavaScript protocol hyperlinks are sanitized in PDF export
    Given an authenticated user with role "Editor"
    And a document with id "doc-xss-001" containing a hyperlink with URL "javascript:alert(1)"
    When the user exports the document as PDF
    Then the exported PDF does not contain a link with the "javascript:" protocol
    And the link URL is replaced with "about:blank" or the link is rendered as plain text
```

**Test Data:**
- Document: `{ id: "doc-xss-001", blocks: [{ type: "paragraph", spans: [{ text: "Malicious link", href: "javascript:alert(1)" }] }] }`

**Preconditions:**
- Document contains a hyperlink with a javascript: URL

---

### T-4.1: Accessible image renders in PDF at correct dimensions
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: PDF Image Rendering

  Scenario: Image with accessible URL renders correctly in PDF
    Given an authenticated user with role "Editor"
    And a document with id "doc-images-001" containing an image with URL "https://cdn.example.com/images/chart-001.png"
    And the image at that URL is accessible and has dimensions 800x400 pixels
    When the user exports the document as PDF
    Then the PDF contains a rendered image in the location corresponding to the document image block
    And the image dimensions are constrained to the page width if the original width exceeds the page width
    And the image aspect ratio is preserved
```

**Test Data:**
- Document: `{ id: "doc-images-001", blocks: [{ type: "image", url: "https://cdn.example.com/images/chart-001.png", width: 800, height: 400 }] }`
- Image response: `HTTP 200, Content-Type: image/png, dimensions: 800x400`

**Preconditions:**
- The image URL is publicly accessible at export time
- The PDF rendering service can fetch external URLs

---

### T-4.2: Inaccessible image URL renders placeholder in PDF without blocking export
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: PDF Image Rendering

  Scenario: Broken image URL results in placeholder, export still completes
    Given an authenticated user with role "Editor"
    And a document with id "doc-broken-img-001" containing:
      | Block      | URL                                              |
      | image 1    | "https://cdn.example.com/images/accessible.png" |
      | image 2    | "https://cdn.example.com/images/missing-404.png"|
    And "images/missing-404.png" returns HTTP 404 when fetched
    When the user exports the document as PDF
    Then the export completes successfully
    And "image 1" renders correctly in the PDF
    And a placeholder box labeled "[Image unavailable]" is rendered in place of "image 2"
    And the PDF file is delivered to the browser
```

**Test Data:**
- Document: `{ id: "doc-broken-img-001", blocks: [{ type: "image", url: "https://cdn.example.com/images/accessible.png" }, { type: "image", url: "https://cdn.example.com/images/missing-404.png" }] }`
- Server mock: `GET /images/missing-404.png → 404`

**Preconditions:**
- One image is accessible, one returns 404
- PDF rendering service does not abort on individual image failures

---

### T-5.1: Comments and comment markers excluded from PDF export
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: PDF Comments and Suggestions Exclusion

  Scenario: Comment markers and comment thread content are absent from the exported PDF
    Given an authenticated user with role "Editor"
    And a document with id "doc-comments-001" containing:
      | Content                         | Type              |
      | "The revenue target is $1M."    | body text         |
      | "Is this confirmed?"            | inline comment    |
      | "Yes, confirmed by finance."    | comment reply     |
    When the user exports the document as PDF
    Then the PDF contains the text "The revenue target is $1M."
    And the PDF does not contain the text "Is this confirmed?"
    And the PDF does not contain the text "Yes, confirmed by finance."
    And no comment marker annotations or sidebar elements are present in the PDF
```

**Test Data:**
- Document: `{ id: "doc-comments-001", blocks: [{ type: "paragraph", text: "The revenue target is $1M.", comments: [{ id: "c-001", text: "Is this confirmed?", replies: [{ text: "Yes, confirmed by finance." }] }] }] }`

**Preconditions:**
- Document has inline comment threads attached to body text
- Document is in a saved state

---

### T-5.2: Pending suggestions excluded from PDF export
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: PDF Comments and Suggestions Exclusion

  Scenario: Unaccepted suggestion text is not present in the exported PDF
    Given an authenticated user with role "Editor"
    And a document with id "doc-suggestions-001" containing accepted text "Market size is large."
    And an unaccepted suggestion to replace "large" with "enormous"
    When the user exports the document as PDF
    Then the PDF contains "Market size is large."
    And the PDF does not contain "enormous" as replacement text
    And no suggestion markup or track-changes annotations appear in the PDF
```

**Test Data:**
- Document: `{ id: "doc-suggestions-001", blocks: [{ type: "paragraph", text: "Market size is large.", suggestions: [{ id: "s-001", status: "pending", original: "large", replacement: "enormous" }] }] }`

**Preconditions:**
- Document has at least one pending suggestion in suggestion mode

---

### T-6.1: Code blocks render in monospace font with visual distinction in PDF
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: PDF Code Block Rendering

  Scenario: Code blocks render in monospace font, visually distinct from prose
    Given an authenticated user with role "Editor"
    And a document with id "doc-code-001" containing:
      | Block      | Content                          |
      | paragraph  | "The function is shown below:"   |
      | code block | "def hello():\n    print('hi')"  |
      | paragraph  | "Refer to the above snippet."    |
    When the user exports the document as PDF
    Then the code block content "def hello():\n    print('hi')" renders in a monospace font
    And the code block has a visually distinct background shade or border separating it from surrounding prose
    And the code content is not line-wrapped mid-word
    And code content is not altered or reformatted
```

**Test Data:**
- Document: `{ id: "doc-code-001", blocks: [{ type: "paragraph", text: "The function is shown below:" }, { type: "code", language: "python", text: "def hello():\n    print('hi')" }, { type: "paragraph", text: "Refer to the above snippet." }] }`

**Preconditions:**
- Document contains a code block with multi-line content

---

### T-7.1: Table renders with grid structure in PDF
**Maps to:** AC-7
**Category:** happy-path

```gherkin
Feature: PDF Table Rendering

  Scenario: Table with headers and data rows renders correctly in PDF
    Given an authenticated user with role "Editor"
    And a document with id "doc-table-001" containing a table:
      | Header Row | Q1    | Q2    | Q3    |
      | Revenue    | $100K | $120K | $140K |
      | Expenses   | $80K  | $90K  | $95K  |
    When the user exports the document as PDF
    Then the PDF contains a table with visible cell borders or alternating row shading
    And the header row "Q1, Q2, Q3" is visually distinguished (bold or background color)
    And all cell content "Revenue, $100K, $120K, $140K, Expenses, $80K, $90K, $95K" is present and readable
    And no column content overlaps another column
```

**Test Data:**
- Document: `{ id: "doc-table-001", blocks: [{ type: "table", headers: ["", "Q1", "Q2", "Q3"], rows: [["Revenue", "$100K", "$120K", "$140K"], ["Expenses", "$80K", "$90K", "$95K"]] }] }`

**Preconditions:**
- Document contains a properly structured table with at least one header row

---

### T-7.2: Wide table is scaled or wrapped across pages in PDF
**Maps to:** AC-7
**Category:** boundary

```gherkin
Feature: PDF Table Rendering

  Scenario: Table wider than page width is scaled or wrapped without content loss
    Given an authenticated user with role "Editor"
    And a document with id "doc-wide-table-001" containing a table with 12 columns of data
    And the combined column widths exceed the PDF page width
    When the user exports the document as PDF
    Then all 12 columns and their data are present in the PDF
    And the table is either scaled proportionally to fit the page width or wrapped across multiple pages
    And no column content is clipped or truncated
```

**Test Data:**
- Document: `{ id: "doc-wide-table-001", blocks: [{ type: "table", headers: ["Col1","Col2","Col3","Col4","Col5","Col6","Col7","Col8","Col9","Col10","Col11","Col12"], rows: [["A","B","C","D","E","F","G","H","I","J","K","L"]] }] }`

**Preconditions:**
- Table has enough columns that their total width exceeds a standard A4/Letter page width

---

### T-8.1: PDF export timeout returns error message within 65 seconds
**Maps to:** AC-8
**Category:** boundary

```gherkin
Feature: PDF Export Timeout Handling

  Scenario: Server terminates export after 60 seconds and UI shows error within 65 seconds
    Given an authenticated user with role "Editor"
    And a document with id "doc-very-large-001" whose content causes PDF generation to exceed 60 seconds
    When the user requests a PDF export
    Then the server terminates the PDF generation after 60 seconds
    And the UI displays the message: "This document is too large to export as PDF right now. Try exporting a smaller section, or contact support."
    And the error message is displayed within 65 seconds of the user initiating the export
    And no partial or incomplete PDF file is delivered to the browser
    And the UI is not stuck in an indefinite loading state
```

**Test Data:**
- Document: `{ id: "doc-very-large-001" }` — simulated via server mock that delays PDF generation > 60s
- Server behavior: rendering service stalls beyond the 60s timeout threshold

**Preconditions:**
- Server-side PDF generation timeout is configured at 60 seconds
- UI has a 65-second client-side timeout
- A stub or test document is configured to trigger the timeout condition

---

### T-9.1: Export request on deleted document returns 404 and displays message
**Maps to:** AC-9
**Category:** error-handling

```gherkin
Feature: PDF Export on Deleted Document

  Scenario: User attempts to export a document that was deleted concurrently
    Given an authenticated user with role "Editor" is viewing document with id "doc-deleted-001"
    And document "doc-deleted-001" is deleted by an admin while the user is on the page
    When the user initiates a PDF export
    Then the export API returns HTTP 404 Not Found
    And the UI displays the message: "This document no longer exists."
    And no PDF file is delivered
```

**Test Data:**
- User: `{ email: "editor@example.com", role: "Editor", auth_token: "tok-editor-001" }`
- Document: `{ id: "doc-deleted-001", status: "deleted" }` (deleted before export request arrives)

**Preconditions:**
- Document was previously accessible to the user
- Document is deleted before the export API call is processed

---

### T-10.1: Rendering service unavailable returns error, no partial PDF delivered
**Maps to:** AC-10
**Category:** error-handling

```gherkin
Feature: PDF Export Rendering Service Unavailable

  Scenario: PDF rendering service is down when user requests export
    Given an authenticated user with role "Editor"
    And a document with id "doc-abc-123" exists and is accessible
    And the PDF rendering service is currently unavailable (returns HTTP 503)
    When the user requests a PDF export
    Then the UI displays the message: "PDF export is temporarily unavailable. Please try again later."
    And no PDF file is delivered to the browser
    And no partial or corrupt PDF file is delivered
```

**Test Data:**
- User: `{ role: "Editor", auth_token: "tok-editor-001" }`
- Document: `{ id: "doc-abc-123", status: "active" }`
- Rendering service mock: returns `HTTP 503 Service Unavailable`

**Preconditions:**
- PDF rendering service is mocked to return 503
- The application's export handler has error handling for rendering service failures

---

### T-11.1: Downloaded PDF file has correct filename and MIME type
**Maps to:** AC-11
**Category:** happy-path

```gherkin
Feature: PDF Download Filename and MIME Type

  Scenario: PDF export delivers file with correct filename based on document title
    Given an authenticated user with role "Editor"
    And a document with id "doc-named-001" titled "Q3 Budget Report"
    When the user triggers a PDF export
    Then the HTTP response includes the header "Content-Type: application/pdf"
    And the downloaded filename is "Q3 Budget Report.pdf"
```

**Test Data:**
- Document: `{ id: "doc-named-001", title: "Q3 Budget Report" }`
- User: `{ role: "Editor", auth_token: "tok-editor-001" }`

**Preconditions:**
- Document title contains no special characters

---

### T-11.2: PDF filename sanitizes special characters in document title
**Maps to:** AC-11
**Category:** edge-case

```gherkin
Feature: PDF Download Filename and MIME Type

  Scenario: Special characters in document title are replaced with hyphens in filename
    Given an authenticated user with role "Editor"
    And a document with id "doc-special-chars-001" titled "Q3: Budget & Forecast (2024)"
    When the user triggers a PDF export
    Then the downloaded filename is "Q3--Budget---Forecast--2024-.pdf"
    And the HTTP response includes the header "Content-Type: application/pdf"
```

**Test Data:**
- Document: `{ id: "doc-special-chars-001", title: "Q3: Budget & Forecast (2024)" }`
- Expected filename: special characters `:`, `&`, `(`, `)` replaced with `-`

**Preconditions:**
- Document title contains characters that are invalid or problematic in filenames

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to PDF export API returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: PDF Export Authentication

  Scenario: Request to PDF export endpoint without auth token is rejected
    Given no valid authentication token is present in the request
    When a POST request is made to "/api/documents/doc-abc-123/export/pdf"
    Then the system returns HTTP 401 Unauthorized
    And no PDF content is included in the response body
```

**Test Data:**
- Request: `POST /api/documents/doc-abc-123/export/pdf` with no `Authorization` header and no session cookie
- Document: `{ id: "doc-abc-123", status: "active" }`

**Preconditions:**
- The export endpoint requires authentication
- No valid session or token is attached to the request

---

### T-AUTH-2.1: Viewer role receives 403 when attempting PDF export
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: PDF Export Authorization

  Scenario: Authenticated Viewer is rejected from PDF export endpoint
    Given an authenticated user with email "viewer@example.com" and role "Viewer"
    And the user has a valid auth token "tok-viewer-001"
    When the user makes a POST request to "/api/documents/doc-abc-123/export/pdf"
    Then the system returns HTTP 403 Forbidden
    And the response body contains the message: "You do not have permission to export this document."
    And no PDF content is included in the response body
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "Viewer", auth_token: "tok-viewer-001" }`
- Document: `{ id: "doc-abc-123", status: "active" }`

**Preconditions:**
- User is authenticated but has Viewer role only
- Authorization check is enforced at the API layer before any rendering begins

---

---

# Test Specifications: EXP-03 — Export Document as DOCX

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2, T-1.3 | happy-path / negative |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path / security |
| AC-4 | T-4.1, T-4.2 | happy-path / edge-case |
| AC-5 | T-5.1, T-5.2 | edge-case |
| AC-6 | T-6.1, T-6.2 | happy-path |
| AC-7 | T-7.1 | happy-path |
| AC-8 | T-8.1, T-8.2 | happy-path |
| AC-9 | T-9.1 | boundary |
| AC-10 | T-10.1 | error-handling |
| AC-11 | T-11.1 | error-handling |
| AC-12 | T-12.1, T-12.2 | happy-path |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Editor sees Word Document export option in export menu
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: DOCX Export Access Control

  Scenario: Editor sees DOCX export option in export menu
    Given an authenticated user with email "editor@example.com" and role "Editor"
    And the user is viewing document with id "doc-abc-123" titled "Product Roadmap"
    When the user opens the export menu
    Then "Word Document (.docx)" is listed as an available export format option
```

**Test Data:**
- User: `{ email: "editor@example.com", role: "Editor", status: "active", auth_token: "tok-editor-001" }`
- Document: `{ id: "doc-abc-123", title: "Product Roadmap", status: "active" }`

**Preconditions:**
- User is authenticated with a valid session token
- Document is active and accessible to this user

---

### T-1.2: Commenter sees Word Document export option in export menu
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: DOCX Export Access Control

  Scenario: Commenter sees DOCX export option in export menu
    Given an authenticated user with email "commenter@example.com" and role "Commenter"
    And the user is viewing document with id "doc-abc-123"
    When the user opens the export menu
    Then "Word Document (.docx)" is listed as an available export format option
```

**Test Data:**
- User: `{ email: "commenter@example.com", role: "Commenter", auth_token: "tok-commenter-001" }`
- Document: `{ id: "doc-abc-123", status: "active" }`

**Preconditions:**
- User has Commenter role on the document

---

### T-1.3: Viewer does not see Word Document export option in export menu
**Maps to:** AC-1
**Category:** negative

```gherkin
Feature: DOCX Export Access Control

  Scenario: Viewer does not see DOCX export option
    Given an authenticated user with email "viewer@example.com" and role "Viewer"
    And the user is viewing document with id "doc-abc-123"
    When the user opens the export menu
    Then "Word Document (.docx)" is NOT listed as an export format option
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "Viewer", auth_token: "tok-viewer-001" }`
- Document: `{ id: "doc-abc-123", status: "active" }`

**Preconditions:**
- User has Viewer role only on this document

---

### T-2.1: H1, H2, H3 map to Word Heading 1, 2, 3 paragraph styles
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: DOCX Heading Style Mapping

  Scenario: Document headings map to Word native heading paragraph styles
    Given an authenticated user with role "Editor"
    And a document with id "doc-headings-002" containing:
      | Block Type | Content              |
      | H1         | "Introduction"       |
      | H2         | "Background"         |
      | H3         | "Prior Research"     |
      | paragraph  | "Some body text."    |
    When the user exports the document as DOCX
    Then the exported .docx file contains a paragraph with style "Heading 1" containing "Introduction"
    And the exported .docx file contains a paragraph with style "Heading 2" containing "Background"
    And the exported .docx file contains a paragraph with style "Heading 3" containing "Prior Research"
    And when opened in Microsoft Word 2016+, "Introduction", "Background", and "Prior Research" appear in the document navigation pane
```

**Test Data:**
- Document: `{ id: "doc-headings-002", blocks: [{ type: "h1", text: "Introduction" }, { type: "h2", text: "Background" }, { type: "h3", text: "Prior Research" }, { type: "paragraph", text: "Some body text." }] }`
- Expected DOCX paragraph styles: `w:pStyle w:val="Heading1"`, `"Heading2"`, `"Heading3"`

**Preconditions:**
- Document saved with all three heading levels
- DOCX generation tool supports Word heading styles

---

### T-2.2: Document with no headings exports without heading-style paragraphs
**Maps to:** AC-2
**Category:** negative

```gherkin
Feature: DOCX Heading Style Mapping

  Scenario: Document with only body text exports without any heading-style paragraphs
    Given an authenticated user with role "Editor"
    And a document with id "doc-no-headings-001" containing only paragraph blocks
    When the user exports the document as DOCX
    Then no paragraphs in the exported DOCX have "Heading 1", "Heading 2", or "Heading 3" styles applied
    And all paragraphs use the "Normal" paragraph style
```

**Test Data:**
- Document: `{ id: "doc-no-headings-001", blocks: [{ type: "paragraph", text: "First paragraph." }, { type: "paragraph", text: "Second paragraph." }] }`

**Preconditions:**
- Document has no heading-type blocks

---

### T-3.1: Bold, italic, underline, and hyperlink formatting preserved in DOCX
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: DOCX Inline Formatting

  Scenario: Inline formatting marks render correctly in exported Word document
    Given an authenticated user with role "Editor"
    And a document with id "doc-formatting-002" containing a paragraph with:
      | Text          | Format    | URL                        |
      | "Bold text"   | bold      | —                          |
      | "Italic text" | italic    | —                          |
      | "Underlined"  | underline | —                          |
      | "Visit us"    | hyperlink | "https://example.com/home" |
    When the user exports the document as DOCX
    Then "Bold text" has bold formatting (`<w:b/>` run property) in the exported DOCX
    And "Italic text" has italic formatting (`<w:i/>` run property) in the exported DOCX
    And "Underlined" has underline formatting (`<w:u/>` run property) in the exported DOCX
    And "Visit us" is a clickable hyperlink in the exported DOCX linking to "https://example.com/home"
    And the display text "Visit us" is preserved on the hyperlink
```

**Test Data:**
- Document: `{ id: "doc-formatting-002", blocks: [{ type: "paragraph", spans: [{ text: "Bold text", bold: true }, { text: "Italic text", italic: true }, { text: "Underlined", underline: true }, { text: "Visit us", href: "https://example.com/home" }] }] }`

**Preconditions:**
- Document saved with inline formatting marks applied

---

### T-3.2: JavaScript hyperlink URL is sanitized in DOCX export
**Maps to:** AC-3 (security NFR)
**Category:** security / negative

```gherkin
Feature: DOCX Inline Formatting Security

  Scenario: Hyperlinks with javascript: protocol are sanitized in DOCX
    Given an authenticated user with role "Editor"
    And a document with id "doc-xss-002" containing a hyperlink with URL "javascript:void(document.cookie)"
    When the user exports the document as DOCX
    Then the exported DOCX does not contain a hyperlink with a "javascript:" target
    And the link URL is replaced with "about:blank" or the link is rendered as plain text
```

**Test Data:**
- Document: `{ id: "doc-xss-002", blocks: [{ type: "paragraph", spans: [{ text: "Exploit", href: "javascript:void(document.cookie)" }] }] }`

**Preconditions:**
- Document contains a hyperlink with javascript: protocol scheme

---

### T-4.1: Image is fetched and embedded as binary in DOCX
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: DOCX Image Embedding

  Scenario: Accessible image URL is fetched and embedded in DOCX file
    Given an authenticated user with role "Editor"
    And a document with id "doc-images-002" containing an image with URL "https://cdn.example.com/images/diagram-001.png"
    And the image at that URL is accessible and returns a valid PNG file (150KB)
    When the user exports the document as DOCX
    Then the exported .docx file contains the image as an embedded binary object in the media/ directory of the DOCX zip
    And the image renders correctly when the DOCX is opened in Microsoft Word without internet access
    And the DOCX is self-contained (does not require network access to display the image)
```

**Test Data:**
- Document: `{ id: "doc-images-002", blocks: [{ type: "image", url: "https://cdn.example.com/images/diagram-001.png" }] }`
- Image response: `HTTP 200, Content-Type: image/png, body: <150KB PNG binary>`

**Preconditions:**
- Image URL is publicly accessible at export time
- DOCX generation tool supports image embedding

---

### T-4.2: Inaccessible image URL results in placeholder text, DOCX export still completes
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: DOCX Image Embedding

  Scenario: Broken image URL results in placeholder, export completes without failure
    Given an authenticated user with role "Editor"
    And a document with id "doc-broken-img-002" containing:
      | Block   | URL                                                |
      | image 1 | "https://cdn.example.com/images/valid.png"         |
      | image 2 | "https://cdn.example.com/images/does-not-exist.png"|
    And "does-not-exist.png" returns HTTP 404 when fetched
    When the user exports the document as DOCX
    Then the export completes successfully and a .docx file is delivered
    And "image 1" is embedded correctly in the DOCX
    And the location of "image 2" contains the placeholder text "[Image unavailable]"
    And no error is surfaced to the user for the single broken image
```

**Test Data:**
- Document: `{ id: "doc-broken-img-002", blocks: [{ type: "image", url: "https://cdn.example.com/images/valid.png" }, { type: "image", url: "https://cdn.example.com/images/does-not-exist.png" }] }`

**Preconditions:**
- One image accessible, one returns 404

---

### T-5.1: Inline comments excluded from DOCX body and not included as Word comments
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: DOCX Comments and Suggestions Exclusion

  Scenario: Inline comment markers are absent from exported DOCX body and Word comment panel
    Given an authenticated user with role "Editor"
    And a document with id "doc-comments-002" containing body text "Launch date is Q2."
    And an inline comment thread "Are we sure about Q2?" attached to "Q2"
    When the user exports the document as DOCX
    Then the exported DOCX body contains "Launch date is Q2."
    And the exported DOCX does not contain "Are we sure about Q2?" anywhere in the document body
    And the exported DOCX has no Word comment annotations (`<w:comment>` elements) in the document XML
```

**Test Data:**
- Document: `{ id: "doc-comments-002", blocks: [{ type: "paragraph", text: "Launch date is Q2.", comments: [{ id: "c-002", text: "Are we sure about Q2?" }] }] }`

**Preconditions:**
- Document has inline comment threads

---

### T-5.2: Unaccepted suggestions excluded from DOCX body
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: DOCX Comments and Suggestions Exclusion

  Scenario: Pending suggestion text does not appear in exported DOCX
    Given an authenticated user with role "Editor"
    And a document with id "doc-suggestions-002" with accepted text "We should scale aggressively."
    And a pending suggestion to replace "aggressively" with "deliberately"
    When the user exports the document as DOCX
    Then the exported DOCX body contains "We should scale aggressively."
    And the exported DOCX does not contain "deliberately" in the document body
    And no track-changes or revision markup appears in the exported DOCX
```

**Test Data:**
- Document: `{ id: "doc-suggestions-002", blocks: [{ type: "paragraph", text: "We should scale aggressively.", suggestions: [{ id: "s-002", status: "pending", original: "aggressively", replacement: "deliberately" }] }] }`

**Preconditions:**
- Document has at least one pending (unaccepted) suggestion

---

### T-6.1: Bulleted and numbered lists export as native Word list styles
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: DOCX List Rendering

  Scenario: Bulleted and numbered lists export as native Word list paragraphs
    Given an authenticated user with role "Editor"
    And a document with id "doc-lists-001" containing:
      | Block Type      | Content                   |
      | bulleted list   | ["Item A", "Item B"]      |
      | numbered list   | ["Step 1", "Step 2"]      |
    When the user exports the document as DOCX
    Then the bulleted list items "Item A" and "Item B" use Word's native bullet list paragraph style
    And the numbered list items "Step 1" and "Step 2" use Word's native numbered list paragraph style
    And list items are formatted as proper Word list paragraphs (not plain paragraphs with manual "•" characters or "1." prefixes)
```

**Test Data:**
- Document: `{ id: "doc-lists-001", blocks: [{ type: "bullet_list", items: ["Item A", "Item B"] }, { type: "numbered_list", items: ["Step 1", "Step 2"] }] }`
- Expected DOCX: `<w:numPr>` elements present on list paragraph runs

**Preconditions:**
- Document contains both a bulleted list and a numbered list

---

### T-6.2: Nested list items preserve indentation level in DOCX
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: DOCX List Rendering

  Scenario: Nested list items export at correct indentation level
    Given an authenticated user with role "Editor"
    And a document with id "doc-nested-list-001" containing a bulleted list with one nested sub-item:
      | Level | Content       |
      | 1     | "Main item"   |
      | 2     | "Sub-item"    |
    When the user exports the document as DOCX
    Then "Main item" is a level-1 list paragraph in the DOCX
    And "Sub-item" is a level-2 (indented) list paragraph in the DOCX
    And the visual indentation difference between the two levels is preserved
```

**Test Data:**
- Document: `{ id: "doc-nested-list-001", blocks: [{ type: "bullet_list", items: [{ text: "Main item", level: 1 }, { text: "Sub-item", level: 2 }] }] }`

**Preconditions:**
- Document has a nested list structure

---

### T-7.1: Code blocks export in monospace font style in DOCX
**Maps to:** AC-7
**Category:** happy-path

```gherkin
Feature: DOCX Code Block Rendering

  Scenario: Code block content renders in monospace font in exported DOCX
    Given an authenticated user with role "Editor"
    And a document with id "doc-code-002" containing:
      | Block      | Content                              |
      | paragraph  | "Example function:"                  |
      | code block | "function add(a, b) { return a+b; }" |
    When the user exports the document as DOCX
    Then the code block content "function add(a, b) { return a+b; }" is rendered in a monospace font (e.g., Courier New)
    And the code block paragraph uses a visually distinct style (shaded background or bordered box)
    And the code content is preserved verbatim with no modifications
```

**Test Data:**
- Document: `{ id: "doc-code-002", blocks: [{ type: "paragraph", text: "Example function:" }, { type: "code", text: "function add(a, b) { return a+b; }" }] }`

**Preconditions:**
- Document has a code block
- DOCX generation tool supports custom paragraph styles or character formatting

---

### T-8.1: Table exports as native Word table with correct rows and columns
**Maps to:** AC-8
**Category:** happy-path

```gherkin
Feature: DOCX Table Rendering

  Scenario: Table exports as a native editable Word table
    Given an authenticated user with role "Editor"
    And a document with id "doc-table-002" containing a table:
      | Name     | Role      | Department  |
      | Alice    | Manager   | Engineering |
      | Bob      | Engineer  | Platform    |
    When the user exports the document as DOCX
    Then the exported DOCX contains a native Word table (`<w:tbl>`) with 3 rows and 3 columns
    And the header row "Name, Role, Department" is formatted with bold text or distinct background
    And all cell content "Alice, Manager, Engineering, Bob, Engineer, Platform" is present in the table cells
    And the table is editable when opened in Microsoft Word
```

**Test Data:**
- Document: `{ id: "doc-table-002", blocks: [{ type: "table", headers: ["Name", "Role", "Department"], rows: [["Alice", "Manager", "Engineering"], ["Bob", "Engineer", "Platform"]] }] }`

**Preconditions:**
- Document has a table with a header row and data rows

---

### T-8.2: Table cell content with special characters is preserved in DOCX
**Maps to:** AC-8
**Category:** edge-case

```gherkin
Feature: DOCX Table Rendering

  Scenario: Table cells containing special characters export without corruption
    Given an authenticated user with role "Editor"
    And a document with id "doc-table-special-001" containing a table cell with content "Revenue: $1M & growing (>10%)"
    When the user exports the document as DOCX
    Then the DOCX table cell contains exactly "Revenue: $1M & growing (>10%)"
    And no XML-encoding artifacts appear in the cell content (e.g., "&amp;" instead of "&")
    And the DOCX file is valid and openable in Microsoft Word
```

**Test Data:**
- Document: `{ id: "doc-table-special-001", blocks: [{ type: "table", headers: ["Metric"], rows: [["Revenue: $1M & growing (>10%)"]] }] }`

**Preconditions:**
- Table cell contains characters that require XML escaping (`&`, `<`, `>`)

---

### T-9.1: DOCX export timeout terminates generation and displays error within 65 seconds
**Maps to:** AC-9
**Category:** boundary

```gherkin
Feature: DOCX Export Timeout Handling

  Scenario: Server terminates DOCX generation after 60 seconds, UI shows error within 65 seconds
    Given an authenticated user with role "Editor"
    And a document with id "doc-very-large-002" whose DOCX generation exceeds 60 seconds server-side
    When the user requests a DOCX export
    Then the server terminates the generation after 60 seconds
    And the UI displays the message: "This document is too large to export as Word right now. Please try again or contact support."
    And the error is shown within 65 seconds of the user initiating the export
    And no partial or corrupt .docx file is delivered to the browser
```

**Test Data:**
- Document: `{ id: "doc-very-large-002" }` — server mock configured to stall beyond 60 seconds
- Server behavior: DOCX rendering service delays response past the 60s server timeout

**Preconditions:**
- Server-side DOCX generation timeout is set at 60 seconds
- Client-side timeout is set at 65 seconds
- A stub document or render-service mock triggers the timeout

---

### T-10.1: DOCX export request on deleted document returns 404
**Maps to:** AC-10
**Category:** error-handling

```gherkin
Feature: DOCX Export on Deleted Document

  Scenario: User attempts DOCX export on a document that was deleted concurrently
    Given an authenticated user with role "Editor" is viewing document with id "doc-deleted-002"
    And document "doc-deleted-002" is deleted before the export request is processed
    When the user initiates a DOCX export
    Then the export API returns HTTP 404 Not Found
    And the UI displays the message: "This document no longer exists."
    And no .docx file is delivered
```

**Test Data:**
- User: `{ email: "editor@example.com", role: "Editor", auth_token: "tok-editor-001" }`
- Document: `{ id: "doc-deleted-002", status: "deleted" }`

**Preconditions:**
- Document was previously visible to the user
- Document is deleted before the export API receives the request

---

### T-11.1: Rendering failure returns clear error message, no corrupt file delivered
**Maps to:** AC-11
**Category:** error-handling

```gherkin
Feature: DOCX Export Rendering Failure

  Scenario: DOCX rendering service returns internal error, UI shows clear message
    Given an authenticated user with role "Editor"
    And a document with id "doc-abc-123" exists and is accessible
    And the DOCX rendering service returns HTTP 500 Internal Server Error
    When the user requests a DOCX export
    Then the UI displays the message: "Word export failed. Please try again. If the problem persists, contact support."
    And no .docx file is delivered to the browser
    And no partial or corrupt .docx file is delivered
```

**Test Data:**
- User: `{ role: "Editor", auth_token: "tok-editor-001" }`
- Document: `{ id: "doc-abc-123", status: "active" }`
- Rendering service mock: returns `HTTP 500 Internal Server Error`

**Preconditions:**
- DOCX rendering service is mocked to return 500
- Application export handler catches rendering service errors

---

### T-12.1: Downloaded DOCX has correct filename and MIME type
**Maps to:** AC-12
**Category:** happy-path

```gherkin
Feature: DOCX Download Filename and MIME Type

  Scenario: DOCX export delivers file with correct filename and MIME type
    Given an authenticated user with role "Editor"
    And a document with id "doc-named-002" titled "Product Roadmap 2025"
    When the user triggers a DOCX export
    Then the HTTP response includes the header "Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    And the downloaded filename is "Product Roadmap 2025.docx"
```

**Test Data:**
- Document: `{ id: "doc-named-002", title: "Product Roadmap 2025" }`
- User: `{ role: "Editor", auth_token: "tok-editor-001" }`

**Preconditions:**
- Document title contains no special characters requiring sanitization

---

### T-12.2: DOCX filename sanitizes special characters in document title
**Maps to:** AC-12
**Category:** edge-case

```gherkin
Feature: DOCX Download Filename and MIME Type

  Scenario: Special characters in document title replaced with hyphens in DOCX filename
    Given an authenticated user with role "Editor"
    And a document with id "doc-special-chars-002" titled "Report: Q4/2024 (Final Draft)"
    When the user triggers a DOCX export
    Then the downloaded filename is "Report--Q4-2024--Final-Draft-.docx"
    And the HTTP response includes "Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document"
```

**Test Data:**
- Document: `{ id: "doc-special-chars-002", title: "Report: Q4/2024 (Final Draft)" }`
- Special characters `:`, `/`, `(`, `)` replaced with `-`

**Preconditions:**
- Document title includes characters invalid in filenames across common operating systems

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to DOCX export API returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: DOCX Export Authentication

  Scenario: Request to DOCX export endpoint without auth token is rejected
    Given no valid authentication token is present in the request
    When a POST request is made to "/api/documents/doc-abc-123/export/docx"
    Then the system returns HTTP 401 Unauthorized
    And no DOCX content is included in the response body
```

**Test Data:**
- Request: `POST /api/documents/doc-abc-123/export/docx` with no `Authorization` header or session cookie
- Document: `{ id: "doc-abc-123", status: "active" }`

**Preconditions:**
- The export endpoint requires authentication
- No valid session or token is attached to the request

---

### T-AUTH-2.1: Viewer role receives 403 when attempting DOCX export
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: DOCX Export Authorization

  Scenario: Authenticated Viewer is rejected from DOCX export endpoint with 403
    Given an authenticated user with email "viewer@example.com" and role "Viewer"
    And the user has a valid auth token "tok-viewer-001"
    When the user makes a POST request to "/api/documents/doc-abc-123/export/docx"
    Then the system returns HTTP 403 Forbidden
    And the response body contains the message: "You do not have permission to export this document."
    And no .docx content is included in the response body
```

**Test Data:**
- User: `{ email: "viewer@example.com", role: "Viewer", auth_token: "tok-viewer-001" }`
- Document: `{ id: "doc-abc-123", status: "active" }`

**Preconditions:**
- User is authenticated but holds only the Viewer role
- Authorization is enforced at the API layer prior to any rendering

---

---

# Test Specifications: SESSION-01 — Deletion Mid-Session Handling

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1 | edge-case |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1 | edge-case |
| AC-6 | T-6.1, T-6.2 | edge-case |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1, T-8.2, T-8.3 | happy-path / negative |
| AC-9 | T-9.1 | error-handling |
| AC-10 | T-10.1 | error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: All active editors see in-app deletion modal within 2 seconds
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Document Deletion Mid-Session Notification

  Scenario: Multiple editors are notified via in-app modal within 2 seconds of document deletion
    Given the following users are all actively viewing document with id "doc-collab-001":
      | User                      | Role     | Connection |
      | "editor1@example.com"     | Editor   | WebSocket  |
      | "editor2@example.com"     | Editor   | WebSocket  |
      | "commenter@example.com"   | Commenter| WebSocket  |
    And a user with deletion permission deletes document "doc-collab-001"
    When the deletion is committed on the server
    Then within 2 seconds, "editor1@example.com" sees a modal dialog
    And within 2 seconds, "editor2@example.com" sees a modal dialog
    And within 2 seconds, "commenter@example.com" sees a modal dialog
    And the modal message is: "This document has been deleted and your session has ended. Any unsaved changes have been lost."
    And the modal contains a single button labeled "Back to Dashboard"
```

**Test Data:**
- Document: `{ id: "doc-collab-001", status: "active" }`
- Active sessions: 3 connected WebSocket clients
- Deleting user: `{ email: "admin@example.com", role: "Admin" }`
- Expected notification latency: ≤ 2000ms p95

**Preconditions:**
- All three users have active WebSocket connections to the collaboration server
- The document exists and all users have valid sessions

---

### T-1.2: Modal "Back to Dashboard" button navigates user away from deleted document
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Document Deletion Mid-Session Notification

  Scenario: Clicking "Back to Dashboard" navigates user to the document dashboard
    Given an editor with email "editor1@example.com" is viewing document "doc-collab-001"
    And the document is deleted while the editor is viewing it
    And the editor sees the deletion modal: "This document has been deleted and your session has ended. Any unsaved changes have been lost."
    When the editor clicks "Back to Dashboard"
    Then the editor is navigated to the document dashboard page (e.g., "/dashboard")
    And the deleted document's editor page is no longer displayed
```

**Test Data:**
- User: `{ email: "editor1@example.com", role: "Editor", auth_token: "tok-editor-001" }`
- Document: `{ id: "doc-collab-001", status: "deleted" }`
- Dashboard URL: `/dashboard`

**Preconditions:**
- User received the deletion modal
- Dashboard page exists and is accessible to this user

---

### T-2.1: Editor UI becomes non-interactive after document deletion
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Session Termination on Document Deletion

  Scenario: All editing controls are disabled after deletion event is received
    Given an editor with email "editor1@example.com" is actively editing document "doc-collab-001"
    And the editor has a text cursor placed in the document body
    When the document is deleted by an admin and the deletion event is broadcast
    Then the editor's WebSocket connection is closed by the server
    And the editor UI disables all editing controls (text input, formatting toolbar, comment button)
    And any attempt by the editor to type or interact with the editor produces no changes
```

**Test Data:**
- User: `{ email: "editor1@example.com", role: "Editor", auth_token: "tok-editor-001" }`
- Document: `{ id: "doc-collab-001", status: "active" → "deleted" }`

**Preconditions:**
- User has an active editing session with a live WebSocket connection
- Document deletion event is broadcast over WebSocket

---

### T-2.2: No further edits can be submitted to deleted document from any session
**Maps to:** AC-2
**Category:** negative

```gherkin
Feature: Session Termination on Document Deletion

  Scenario: Edit submitted after deletion is rejected by the server
    Given an editor with email "editor2@example.com" attempts to submit an edit to document "doc-collab-001"
    And document "doc-collab-001" has already been deleted
    When the editor's client submits an edit operation to the document's collaboration endpoint
    Then the server rejects the operation and returns HTTP 404 or 410 Gone
    And the edit is not applied to any document state
    And no orphaned operation remains in the collaboration service queue
```

**Test Data:**
- User: `{ email: "editor2@example.com", role: "Editor", auth_token: "tok-editor-002" }`
- Document: `{ id: "doc-collab-001", status: "deleted" }`
- Operation: `{ type: "insert", content: "New text", position: 50 }`

**Preconditions:**
- Document is in "deleted" status in the system
- The editor's client still has a session token for this document

---

### T-3.1: Version history, comments, and session state are permanently removed on deletion
**Maps to:** AC-3
**Category:** edge-case

```gherkin
Feature: Document Data Destruction on Deletion

  Scenario: Version history, comments, and CRDT state are permanently destroyed with the document
    Given a document with id "doc-rich-001" that has:
      | Data Type       | Count |
      | versions        | 15    |
      | inline comments | 8     |
      | comment threads | 3     |
    When an admin deletes document "doc-rich-001" and confirms the deletion
    Then the document is permanently removed from the system
    And a GET request to "/api/documents/doc-rich-001" returns 404
    And a GET request to "/api/documents/doc-rich-001/versions" returns 404
    And a GET request to "/api/documents/doc-rich-001/comments" returns 404
    And none of the 15 versions are accessible via the version history UI
    And the data is not recoverable through any UI action
```

**Test Data:**
- Document: `{ id: "doc-rich-001", version_count: 15, comment_count: 8, thread_count: 3, status: "active" }`
- Deleting user: `{ role: "Admin", auth_token: "tok-admin-001" }`

**Preconditions:**
- Document exists with version history and comments
- Deleting user has deletion permission
- Deletion is permanent (not soft-delete)

---

### T-4.1: Deleting user is redirected to dashboard after confirming document deletion
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Deleting User Session Handling

  Scenario: Admin who deletes a document is redirected to dashboard, not left on deleted document
    Given an admin with email "admin@example.com" is viewing document "doc-collab-001"
    And the admin clicks "Delete Document"
    And the deletion confirmation dialog is displayed
    When the admin clicks "Delete" to confirm
    Then the document "doc-collab-001" is deleted
    And the admin is redirected to the document dashboard (e.g., "/dashboard")
    And the admin is not left on the editor page for the now-deleted document
    And the admin sees no broken or empty editor state for the deleted document
```

**Test Data:**
- Admin user: `{ email: "admin@example.com", role: "Admin", auth_token: "tok-admin-001" }`
- Document: `{ id: "doc-collab-001", status: "active" }`

**Preconditions:**
- Admin is both the deleting user and a session participant
- Deletion confirmation flow is triggered from within the document editor

---

### T-5.1: CRDT session state is cleaned up within 5 seconds of document deletion
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: CRDT Session Cleanup on Deletion

  Scenario: Server removes all CRDT state for deleted document within 5 seconds
    Given a document with id "doc-crdt-001" has an active CRDT collaboration session
    And the session state includes: persisted document CRDT state, a pending operation queue, and a session room
    When document "doc-crdt-001" is deleted
    Then within 5 seconds, the CRDT document state for "doc-crdt-001" is cleared from the collaboration service
    And the pending operation queue for "doc-crdt-001" is emptied
    And the session room for "doc-crdt-001" is removed from the collaboration service
    And no request to any endpoint for "doc-crdt-001" can retrieve session or CRDT state
```

**Test Data:**
- Document: `{ id: "doc-crdt-001", crdt_state: "<non-empty>", operation_queue: ["op-1", "op-2"], session_room: "room-doc-crdt-001" }`
- Expected cleanup latency: ≤ 5000ms p95

**Preconditions:**
- Document has an active CRDT session with queued operations
- Collaboration service exposes internal state for verification in test environment

---

### T-6.1: Offline user sees 404 error message on reconnect to deleted document
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Offline User Notification on Reconnect

  Scenario: User who was offline when document was deleted sees notification on reconnect
    Given a user with email "editor3@example.com" was editing document "doc-collab-001"
    And the user goes offline (network disconnects)
    And while offline, an admin deletes document "doc-collab-001"
    When the user's client reconnects and attempts to resume the session for "doc-collab-001"
    Then the server returns HTTP 404 Not Found (or 410 Gone)
    And the client displays the message: "This document no longer exists. It may have been deleted while you were offline."
    And the client displays a "Back to Dashboard" button
    And any locally queued offline changes are discarded and not submitted
```

**Test Data:**
- User: `{ email: "editor3@example.com", role: "Editor", auth_token: "tok-editor-003" }`
- Document: `{ id: "doc-collab-001", status: "deleted" }`
- Offline changes queue: `[{ type: "insert", content: "added while offline", position: 100 }]`

**Preconditions:**
- User was an active session participant before disconnecting
- Document was deleted during the user's offline period
- Client stores offline changes locally before reconnecting

---

### T-6.2: Locally queued offline changes are discarded, not applied, when document no longer exists
**Maps to:** AC-6
**Category:** edge-case

```gherkin
Feature: Offline User Notification on Reconnect

  Scenario: Offline edit queue is discarded when document is found to be deleted on reconnect
    Given a user with email "editor3@example.com" has 5 queued edit operations stored locally for document "doc-collab-001"
    And document "doc-collab-001" has been deleted while the user was offline
    When the user's client reconnects and receives a 404 for "doc-collab-001"
    Then the local edit queue of 5 operations is cleared
    And none of the 5 queued operations are submitted to the server
    And the user sees the deletion notification message
```

**Test Data:**
- User: `{ email: "editor3@example.com", role: "Editor", auth_token: "tok-editor-003" }`
- Local queue: `5 pending insert/delete operations for doc-collab-001`
- Document: `{ id: "doc-collab-001", status: "deleted" }`

**Preconditions:**
- Client has a non-empty offline operation queue
- Document is confirmed deleted on server when client reconnects

---

### T-7.1: Deleting a template does not terminate sessions for documents created from it
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Template Deletion Isolation

  Scenario: Deleting a template does not interrupt editors of documents derived from it
    Given a template with id "tmpl-001" titled "Standard Report Template"
    And documents "doc-from-tmpl-001" and "doc-from-tmpl-002" were created from "tmpl-001"
    And users "editor-a@example.com" and "editor-b@example.com" are actively editing those documents respectively
    When an admin deletes template "tmpl-001"
    Then no session termination event is sent to "editor-a@example.com"
    And no session termination event is sent to "editor-b@example.com"
    And "doc-from-tmpl-001" remains fully editable by "editor-a@example.com"
    And "doc-from-tmpl-002" remains fully editable by "editor-b@example.com"
    And neither editor sees the deletion modal
```

**Test Data:**
- Template: `{ id: "tmpl-001", status: "active" }`
- Documents: `{ id: "doc-from-tmpl-001", source_template: "tmpl-001" }`, `{ id: "doc-from-tmpl-002", source_template: "tmpl-001" }`
- Users: `{ email: "editor-a@example.com", role: "Editor" }`, `{ email: "editor-b@example.com", role: "Editor" }`

**Preconditions:**
- Template and derived documents exist
- Both editors have active WebSocket sessions on their respective documents
- Template and documents are independent entities after creation

---

### T-8.1: Deletion confirmation dialog displays correct warning message
**Maps to:** AC-8
**Category:** happy-path

```gherkin
Feature: Deletion Confirmation Dialog

  Scenario: Deletion confirmation dialog shows correct warning text
    Given an admin with email "admin@example.com" is viewing document "doc-collab-001"
    When the admin clicks the "Delete Document" action
    Then a confirmation dialog appears containing the message: "Deleting this document is permanent and cannot be undone. All version history and comments will be deleted. Active editors will be disconnected."
    And the dialog contains a "Delete" button to confirm
    And the dialog contains a "Cancel" button to abort
```

**Test Data:**
- Admin user: `{ email: "admin@example.com", role: "Admin", auth_token: "tok-admin-001" }`
- Document: `{ id: "doc-collab-001", status: "active" }`

**Preconditions:**
- Admin has deletion permission on the document
- "Delete Document" action is available in the document's menu

---

### T-8.2: Pressing Escape on deletion confirmation dialog cancels the deletion
**Maps to:** AC-8
**Category:** negative

```gherkin
Feature: Deletion Confirmation Dialog

  Scenario: Pressing Escape on the deletion dialog cancels and document is not deleted
    Given an admin has opened the "Delete Document" confirmation dialog for document "doc-collab-001"
    When the admin presses the Escape key
    Then the confirmation dialog closes
    And document "doc-collab-001" is not deleted
    And a GET request to "/api/documents/doc-collab-001" still returns the document (200 OK)
```

**Test Data:**
- Admin user: `{ email: "admin@example.com", role: "Admin", auth_token: "tok-admin-001" }`
- Document: `{ id: "doc-collab-001", status: "active" }`

**Preconditions:**
- Deletion confirmation dialog is open
- Document is in active state

---

### T-8.3: Clicking outside the deletion confirmation dialog cancels the deletion
**Maps to:** AC-8
**Category:** negative

```gherkin
Feature: Deletion Confirmation Dialog

  Scenario: Clicking outside deletion dialog dismisses it without deleting the document
    Given an admin has opened the "Delete Document" confirmation dialog for document "doc-collab-001"
    When the admin clicks on the backdrop area outside the dialog
    Then the confirmation dialog closes
    And document "doc-collab-001" is not deleted
    And all active editor sessions remain connected and unaffected
```

**Test Data:**
- Admin user: `{ email: "admin@example.com", role: "Admin", auth_token: "tok-admin-001" }`
- Document: `{ id: "doc-collab-001", status: "active" }`

**Preconditions:**
- Deletion confirmation dialog is open
- Active editor sessions exist for the document

---

### T-9.1: WebSocket broadcast failure does not block document deletion; users get 404 on next interaction
**Maps to:** AC-9
**Category:** error-handling

```gherkin
Feature: Notification Delivery Failure Handling

  Scenario: Deletion commits even if WebSocket broadcast fails for some users
    Given users "editor1@example.com" and "editor2@example.com" are in an active session on document "doc-collab-001"
    And "editor2@example.com" drops their connection at the same moment the deletion is broadcast
    When the document is deleted and the WebSocket broadcast fails for "editor2@example.com"
    Then the document deletion is committed regardless of the broadcast failure
    And "editor1@example.com" receives the deletion notification modal
    And when "editor2@example.com" next makes any request to "doc-collab-001" (e.g., reconnect, load, edit)
    Then the server returns HTTP 404 Not Found for that request
    And the client for "editor2@example.com" shows: "This document no longer exists. It may have been deleted while you were offline." with a "Back to Dashboard" button
```

**Test Data:**
- Document: `{ id: "doc-collab-001", status: "active" → "deleted" }`
- editor1: WebSocket connected and receives broadcast
- editor2: WebSocket drops at broadcast time; reconnects later

**Preconditions:**
- Document deletion is an atomic operation — committed independently of notification delivery
- The collaboration server does not roll back deletion on WebSocket failure

---

### T-10.1: Export request processed after concurrent document deletion returns 404
**Maps to:** AC-10
**Category:** error-handling

```gherkin
Feature: Export on Concurrently Deleted Document

  Scenario: Export API request arriving after document is deleted returns 404
    Given a user with email "editor1@example.com" initiates a PDF export of document "doc-collab-001"
    And document "doc-collab-001" is deleted before the export API processes the request
    When the export API processes the request
    Then the export API returns HTTP 404 Not Found
    And the UI displays the message: "This document no longer exists."
    And no file (partial or complete) is delivered
```

**Test Data:**
- User: `{ email: "editor1@example.com", role: "Editor", auth_token: "tok-editor-001" }`
- Document: `{ id: "doc-collab-001", status: "deleted" }` — deleted before export is processed
- Race condition: deletion committed after export request received but before it is serviced

**Preconditions:**
- Export endpoint checks document existence before initiating rendering
- Database read for document returns 404/null

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to document deletion endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Document Deletion Authentication

  Scenario: Request to delete endpoint without auth token is rejected
    Given no valid authentication token is present in the request
    When a DELETE request is made to "/api/documents/doc-collab-001"
    Then the system returns HTTP 401 Unauthorized
    And document "doc-collab-001" is not deleted
    And no deletion event is broadcast to any connected sessions
```

**Test Data:**
- Request: `DELETE /api/documents/doc-collab-001` with no `Authorization` header or session cookie
- Document: `{ id: "doc-collab-001", status: "active" }`

**Preconditions:**
- Document exists and is in active state
- No auth credentials are attached to the request

---

### T-AUTH-2.1: Editor without deletion permission receives 403 when attempting to delete document
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Document Deletion Authorization

  Scenario: Authenticated Editor without deletion permission is rejected with 403
    Given an authenticated user with email "editor@example.com" and role "Editor"
    And the user has a valid auth token "tok-editor-001"
    And the user does not have document deletion permission
    When the user makes a DELETE request to "/api/documents/doc-collab-001"
    Then the system returns HTTP 403 Forbidden
    And the response body contains the message: "You do not have permission to delete this document."
    And document "doc-collab-001" is not deleted
```

**Test Data:**
- User: `{ email: "editor@example.com", role: "Editor", auth_token: "tok-editor-001", can_delete: false }`
- Document: `{ id: "doc-collab-001", status: "active" }`

**Preconditions:**
- User is authenticated but does not hold deletion permission
- Authorization check is enforced at the API layer

---

### T-AUTH-2.2: Commenter without deletion permission receives 403 when attempting to delete document
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Document Deletion Authorization

  Scenario: Authenticated Commenter is rejected from delete endpoint with 403
    Given an authenticated user with email "commenter@example.com" and role "Commenter"
    And the user has a valid auth token "tok-commenter-001"
    When the user makes a DELETE request to "/api/documents/doc-collab-001"
    Then the system returns HTTP 403 Forbidden
    And the response body contains the message: "You do not have permission to delete this document."
    And document "doc-collab-001" is not deleted
    And no deletion event is broadcast to any active sessions
```

**Test Data:**
- User: `{ email: "commenter@example.com", role: "Commenter", auth_token: "tok-commenter-001" }`
- Document: `{ id: "doc-collab-001", status: "active" }`

**Preconditions:**
- User is authenticated with Commenter role
- Commenter role does not include document deletion permission

---

## Negative Tests

### T-NEG-SESSION-1: Concurrent deletion by two admins results in one success and one 404
**Maps to:** AC-9 (NFR — concurrent deletion)
**Category:** error-handling

```gherkin
Feature: Concurrent Document Deletion

  Scenario: Two admins attempt to delete the same document simultaneously
    Given two admins "admin-a@example.com" and "admin-b@example.com" both open the deletion dialog for document "doc-collab-001"
    When both admins click "Delete" at approximately the same time (within 100ms)
    Then exactly one deletion request succeeds (HTTP 200)
    And the second deletion request returns HTTP 404 (document already deleted)
    And the document is deleted exactly once (no double-delete error or corruption)
    And active editors connected at the time receive exactly one deletion notification modal
```

**Test Data:**
- Admin A: `{ email: "admin-a@example.com", role: "Admin", auth_token: "tok-admin-a" }`
- Admin B: `{ email: "admin-b@example.com", role: "Admin", auth_token: "tok-admin-b" }`
- Document: `{ id: "doc-collab-001", status: "active" }`

**Preconditions:**
- Both admins have deletion permission
- System handles deletion with optimistic locking or equivalent idempotency mechanism

---

## Boundary Tests

### T-BOUNDARY-SESSION-1: Deletion notification delivered within 2 seconds under high concurrency
**Maps to:** AC-1 (NFR — performance)
**Category:** boundary

```gherkin
Feature: Deletion Notification Performance

  Scenario: Deletion notification delivered within 2 seconds with 50 concurrent active editors
    Given 50 editors are actively connected to document "doc-stress-001" via WebSocket
    And all connections are stable at the time of deletion
    When an admin deletes document "doc-stress-001"
    Then at least 95% of connected editors (48 of 50) receive the deletion modal within 2000ms
    And the remaining editors receive the modal or detect deletion via their next server interaction
    And the deletion operation itself completes in under 500ms
```

**Test Data:**
- Document: `{ id: "doc-stress-001", status: "active" }`
- Connected sessions: 50 WebSocket clients
- Deleting user: `{ role: "Admin", auth_token: "tok-admin-001" }`
- Target: notification latency ≤ 2000ms p95

**Preconditions:**
- Load test environment with 50 concurrent WebSocket connections
- Server-side broadcast mechanism can handle 50 simultaneous pushes


