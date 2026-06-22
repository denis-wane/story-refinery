<!-- STORY COUNT: 12 stories to process — SPIKE-01, DOC-01, DOC-02, EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, SYNC-01, SYNC-02, SYNC-03 -->

# Acceptance Criteria: SPIKE-01 — CRDT Framework Selection

## Refined Story Statement
As a **development team**, I want a time-boxed technical spike evaluating CRDT and OT framework options against our confirmed constraints, so that we can make an informed architectural decision that unblocks all downstream collaboration stories.

## Assumptions
- Max document size is **5MB** — **Confirmed** (stated in spike goal)
- Max concurrent editors is **50** — **Confirmed** (stated in spike goal)
- Undo scope is **local-only** (does not revert other users' changes) — **Confirmed** (stated in spike goal)
- Conflict resolution unit is **character-level LWW** — **Confirmed** (stated in spike goal)
- Spike is time-boxed to **3 days** — **Confirmed**
- Yjs and Automerge are the primary candidates — **Confirmed** (stated in spike goal)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: CRDT/OT framework undefined | This spike directly resolves G-1; ADR is the deliverable | AC-1, AC-2, AC-3 |
| G-2: WebSocket infrastructure unknown | Out of Scope for this spike; addressed by SPIKE-02 | Out of Scope |
| G-4: Maximum document size unspecified | Confirmed at 5MB for spike evaluation; product must ratify | AC-2 |
| G-7: LWW conflict resolution unit unclear | Confirmed at character-level for spike evaluation; AC must verify library supports this | AC-2 |
| G-8: Undo across concurrent edits undefined | Confirmed as local-only for spike evaluation; must be validated against chosen library | AC-2 |
| G-15: Maximum concurrent editors unspecified | Confirmed at 50 for spike evaluation; product must ratify | AC-2 |
| G-17: Mobile/responsive support unscoped | Out of Scope for this spike | Out of Scope |

## Acceptance Criteria

### AC-1: ADR Produced Within Timebox
**Given** the spike has been started and the team has 3 working days
**When** the spike concludes
**Then** a completed Architecture Decision Record (ADR) exists in the repository at `docs/adr/NNNN-crdt-framework-selection.md` covering: decision, status, context, options considered, decision rationale, and consequences

**Category:** happy-path
**Priority:** must-have

---

### AC-2: All Evaluation Criteria Addressed in ADR
**Given** the ADR is being authored
**When** the team documents the evaluation
**Then** the ADR explicitly addresses each of the following constraints with findings for each candidate framework:
- 5MB document size: measured memory footprint and CRDT state size at limit
- 50 concurrent editors: measured or estimated broadcast fan-out at limit
- Offline merge correctness: verified merge behavior after simulated disconnection
- Local-only undo: confirmed API for per-client undo that does not revert remote peers' operations
- Character-level LWW: confirmed conflict resolution granularity meets the character-level requirement
- Client bundle size: documented gzipped bundle contribution of each library
- TypeScript/React compatibility: confirmed first-class TS types and framework integration

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Framework Decision Is Actionable
**Given** the ADR is complete
**When** a downstream story (SYNC-01, SYNC-02, CONF-01, OFFL-01) begins implementation
**Then** the ADR contains sufficient detail for an engineer to begin integration without further research — specifically: chosen package name and version, recommended server-side persistence strategy (update log vs. snapshot), and a link to a proof-of-concept branch or working code snippet demonstrating basic insert/delete round-trip

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Timebox Overrun Handled
**Given** a clear winner cannot be determined within 3 days
**When** the timebox expires
**Then** the ADR is published in "Decision: DEFERRED" status, documenting what was evaluated, what remains unresolved, the estimated additional time needed, and a recommendation on whether to extend or pick a default to unblock downstream work

**Category:** edge-case
**Priority:** must-have

---

### AC-5: Spike Does Not Gate Other Work
**Given** the spike is running
**When** other stories not listed in SPIKE-01's gate list are in progress
**Then** those stories are not blocked — the spike gates only: SYNC-01, SYNC-02, CONF-01, CONF-02, CONF-03, OFFL-01, OFFL-02

**Category:** boundary
**Priority:** should-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Chosen library has a critical bug discovered mid-spike | Document the issue in the ADR, note workaround or dealbreaker status, escalate to lead before timebox ends | must-have |
| No candidate meets all constraints | ADR states "no clear winner," recommends hybrid approach or custom solution, and requests extended timebox | must-have |

### Performance
- **Timebox:** 3 working days maximum
- **Scale:** Evaluation must verify behavior at 5MB document size and 50 concurrent editors

### Security
- **Input validation:** N/A (spike produces documentation, not user-facing code)
- **Authorization:** ADR stored in version-controlled repository; access follows existing repo permissions

### Accessibility
- N/A for research spike

## Open Questions
- Product must formally ratify the 5MB document size and 50 concurrent editor limits before downstream stories are finalized — the spike uses these as working constraints but they originated from gap resolution, not a product decision.
- Should the spike include a proof-of-concept with the existing WS service stub, or is a standalone demo acceptable? Requires alignment with Platform team.

---

# Acceptance Criteria: DOC-01 — Create a New Blank Document

## Refined Story Statement
As an **editor**, I want to create a new blank document within a project, so that I have a persistent canvas I can immediately begin writing in.

## Assumptions
- "Project context" means the user is already viewing a project and initiates the action from within it — **Confirmed**
- The default title is "Untitled Document" — **Confirmed** (stated in story scope)
- Document is persisted immediately on creation (not on first save/edit) — **Confirmed**
- Creator is automatically granted editor permission on the new document — **Confirmed**
- No rich text content is pre-populated in a blank document — **Confirmed**
- The document list within a project is the canonical location where the new document appears — **Confirmed**
- A user must have project-level access to create documents within it — **Unconfirmed** (permission required to create documents not specified)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-5: Existing permissions model undefined | Out of Scope for this story — DOC-01 auto-grants edit to creator; integration with existing model is deferred to PERM-01 | Open Question (see below) |
| G-15: Max concurrent editors unspecified | Out of Scope for DOC-01 — document creation does not involve collaboration | Out of Scope |
| G-17: Mobile/responsive support unscoped | Out of Scope for v1 — desktop browsers only | Out of Scope |
| G-18: Document deletion mid-session | Out of Scope for DOC-01 — document is newly created, no active session | Out of Scope |

## Acceptance Criteria

### AC-1: Successful Document Creation
**Given** an authenticated editor is viewing a project they have access to
**When** they activate the "New Document" action (button or menu item) within that project
**Then** a new document is created with the title "Untitled Document," the document is immediately persisted to the database, the creator is automatically granted editor permission on the document, and the user is navigated to the document's editor view

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Document Appears in Project Document List
**Given** a new document has been successfully created
**When** any user with access views the project's document list
**Then** the new document appears in the list showing its title ("Untitled Document"), the creator's name, and a "just now" or accurate last-modified timestamp

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Title Is Editable Immediately After Creation
**Given** the user is navigated to the new document's editor view after creation
**When** the editor view renders
**Then** the document title field is focused and editable, and updating the title persists the change to the database without requiring a separate save action

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Blank Document Has Empty Content Body
**Given** a new blank document has been created
**When** the editor view renders
**Then** the content area contains no pre-populated text, headings, or formatting — the cursor is positioned at the start of an empty content area

**Category:** happy-path
**Priority:** must-have

---

### AC-5: Creation Fails Gracefully If Persistence Fails
**Given** an editor triggers "New Document" but the database is unavailable
**When** the persistence call fails
**Then** no document is created, the user remains in the project view, and an inline error message reads "Failed to create document. Please try again." — no partial document record is left in the database

**Category:** error-handling
**Priority:** must-have

---

### AC-6: Duplicate "New Document" Clicks Do Not Create Duplicate Documents
**Given** an editor clicks "New Document" rapidly (e.g., double-click)
**When** the action fires more than once before the first response returns
**Then** only one document is created — the UI disables the action after the first click until creation completes or fails

**Category:** edge-case
**Priority:** must-have

---

### AC-7: Document Creation Within Correct Project Scope
**Given** an editor is viewing Project A and creates a new document
**When** the document is persisted
**Then** the document belongs to Project A and does not appear in Project B's document list

**Category:** boundary
**Priority:** must-have

---

### AC-8: Creator Permission Is Atomic with Document Creation
**Given** a new document is being created
**When** the database transaction completes
**Then** the document record and the creator's editor-permission record are created in the same atomic operation — a document without a creator permission record is an invalid state and must not exist

**Category:** boundary
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the document creation endpoint (`POST /api/projects/:projectId/documents`)
**Then** the system returns 401 Unauthorized and no document is created

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without project access (or with viewer-only access, pending G-5 resolution)
**When** a request is made to the document creation endpoint
**Then** the system returns 403 Forbidden with a message identifying the missing permission; no document is created

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Database unavailable at creation time | Display inline error "Failed to create document. Please try again."; no partial records | must-have |
| Network timeout during creation | Treat as failure; do not retry automatically; show error message | must-have |
| Project ID in request does not exist | Return 404 Not Found; no document created | must-have |

### Performance
- **Response time:** Document creation API responds within 500ms p95
- **Scale:** No special load requirement for creation; documents are created one at a time per user action

### Security
- **Input validation:** Project ID must be a valid reference to an existing project the requester has access to; document title defaults to "Untitled Document" server-side — client input for title at creation time is sanitized (strip HTML, max 255 characters)
- **Authorization:** Creator must have a permission level that allows document creation within the project (see Open Questions)

### Accessibility
- "New Document" action must be keyboard-accessible (focusable, activatable via Enter/Space)
- Error messages must be announced to screen readers via ARIA live region

## Open Questions
- What project-level permission is required to create a document? (Unconfirmed assumption: any project member can create a document.) Requires alignment with G-5 resolution.
- Should documents have a maximum count per project? Not specified; assumed unlimited for v1.

---

# Acceptance Criteria: DOC-02 — Open and Navigate Documents Within a Project

## Refined Story Statement
As an **editor, commenter, or viewer**, I want to see a list of documents in a project filtered to those I have access to, and open any one of them, so that I can find and access the document I need to work on.

## Assumptions
- Documents are listed sorted by last-modified descending by default — **Confirmed** (stated in story scope)
- Documents the user has no access to are not visible in the list (not shown as locked/restricted) — **Confirmed**
- Clicking a document title navigates to the editor/viewer view — **Confirmed**
- A breadcrumb component provides navigation back to the project from the document view — **Confirmed**
- The list shows: title, last-modified timestamp, and creator name — **Confirmed**
- "Editor view" and "viewer view" are the same URL; the permission level determines what actions are available — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-5: Existing permissions model undefined | Partially resolved: this story filters documents by the user's permission level, but the underlying permission check delegates to PERM-02. AC references PERM-02 as dependency. | AC-3, AC-AUTH-2 |
| G-15: Max concurrent editors | Out of Scope for document list view | Out of Scope |
| G-17: Mobile support | Out of Scope for v1 — desktop browsers only | Out of Scope |

## Acceptance Criteria

### AC-1: Document List Renders for Project
**Given** an authenticated user (any role) navigates to a project they have access to
**When** the project page loads
**Then** the document list section displays all documents in that project that the user has at least viewer-level permission for, sorted by last-modified descending

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Document List Displays Required Metadata
**Given** the document list is rendered
**When** a user views it
**Then** each document entry shows: the document title, the creator's display name, and the last-modified timestamp formatted as a human-readable relative time (e.g., "2 hours ago") with a tooltip showing the absolute date/time

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Documents Not Accessible to User Are Hidden
**Given** Project X contains documents D1 (user has viewer access), D2 (user has editor access), and D3 (user has no access)
**When** the user views the project's document list
**Then** D1 and D2 appear in the list and D3 does not appear — the list gives no indication that D3 exists

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Opening a Document Navigates to Editor View
**Given** the document list is visible and contains at least one document
**When** the user clicks on a document title
**Then** the browser navigates to the document's editor URL (e.g., `/projects/:projectId/documents/:documentId`) and the editor view renders with the document's current content

**Category:** happy-path
**Priority:** must-have

---

### AC-5: Breadcrumb Navigation Returns to Project
**Given** the user is in the document editor view
**When** they click the breadcrumb link showing the project name
**Then** the browser navigates back to the project view and the document list is visible

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Empty Document List State
**Given** a project has no documents, or no documents accessible to the current user
**When** the project page loads
**Then** the document list section displays an empty state message (e.g., "No documents yet. Create one to get started.") with a "New Document" action visible if the user has create permission

**Category:** edge-case
**Priority:** must-have

---

### AC-7: Document List Handles Large Number of Documents
**Given** a project contains more than 50 documents accessible to the user
**When** the document list renders
**Then** the list paginates or uses virtual scrolling to prevent performance degradation — the first 25 (or paginated batch) load immediately, and navigation to additional pages is available

**Category:** edge-case
**Priority:** should-have

---

### AC-8: Viewer Cannot Access Editor Actions from List
**Given** a user with viewer-only access to a document sees that document in the list
**When** they click on it
**Then** they are navigated to the document view in read-only mode — no editing toolbar is shown, and no write operations are possible from that view

**Category:** boundary
**Priority:** must-have

---

### AC-9: Document Link Is Directly Accessible via URL
**Given** a user knows a document's direct URL
**When** they navigate to that URL
**Then** if they have at least viewer permission, the document renders; if they have no permission, they receive a 403 Forbidden response and are shown "You don't have access to this document"

**Category:** boundary
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the project document list endpoint (`GET /api/projects/:projectId/documents`) or to a specific document URL
**Then** the system returns 401 Unauthorized and no document data is returned

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user has no access to a specific project
**When** a request is made to that project's document list endpoint
**Then** the system returns 403 Forbidden; no document titles or metadata are disclosed

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Document list API fails | Show inline error "Unable to load documents. Refresh to try again." | must-have |
| Clicked document no longer exists (deleted between list load and click) | Navigate attempt returns 404; show "This document no longer exists" with link back to project | must-have |
| Project ID in URL does not exist | Show 404 page: "Project not found" | must-have |

### Performance
- **Response time:** Document list API responds within 500ms p95 for up to 50 documents
- **Scale:** Must render lists of up to 200 documents without page jank; pagination or virtual scroll required above 50 items

### Security
- **Input validation:** Project ID and document ID in URL params validated as valid UUIDs/identifiers; malformed IDs return 400 Bad Request
- **Authorization:** Per-document permission filtering is enforced server-side on the list API — client cannot bypass by manipulating query params

### Accessibility
- Document list items are navigable via keyboard (Tab through items, Enter to open)
- Document titles are wrapped in `<a>` elements with descriptive `href`s — not JavaScript-only click handlers

## Open Questions
- Should a "viewer" role see the "New Document" button in the empty state, or only editors? Depends on G-5 resolution.
- Is pagination or infinite scroll the preferred pattern? Not specified; assumed pagination for v1.

---

# Acceptance Criteria: EDIT-01 — Inline Text Formatting and Headings

## Refined Story Statement
As an **editor**, I want to apply bold, italic, underline, and heading levels H1, H2, H3 to selected text using both toolbar buttons and keyboard shortcuts, so that I can communicate structure and emphasis in my documents on desktop browsers.

## Assumptions
- Keyboard shortcuts follow OS conventions: Cmd+B/I/U on macOS, Ctrl+B/I/U on Windows/Linux — **Confirmed** (stated in scope)
- H1–H3 are the only supported heading levels — **Confirmed** (G-6 assumed H1–H3)
- Mobile editing is explicitly out of scope for v1 — **Confirmed**
- Marks (bold, italic, underline) apply to the current selection only; if no selection, they apply to newly typed text — **Unconfirmed** (toggle-on-no-selection behavior)
- The editor is built on the CRDT data model chosen in SPIKE-01 — **Confirmed**
- Formatting persists to the document's CRDT state immediately on application — **Confirmed**
- Marks can be combined (e.g., bold + italic simultaneously) — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: CRDT framework undefined | Out of Scope for AC — SPIKE-01 resolves this; EDIT-01 depends on SPIKE-01 completing first | Dependency |
| G-6: Heading levels unspecified | Resolved by assumption: H1–H3 only | AC-1, AC-2 |
| G-17: Mobile/responsive support | Explicitly out of scope for v1 | AC-7 |

## Acceptance Criteria

### AC-1: Bold, Italic, Underline via Toolbar
**Given** an editor has selected one or more characters in the document body
**When** they click the Bold, Italic, or Underline button in the formatting toolbar
**Then** the selected text is wrapped with the corresponding mark (bold, italic, underline), the toolbar button appears in an active/highlighted state, and the mark is persisted to the CRDT document state

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Bold, Italic, Underline via Keyboard Shortcut
**Given** an editor has selected one or more characters in the document body
**When** they press Cmd+B (macOS) or Ctrl+B (Windows/Linux) for bold, Cmd+I / Ctrl+I for italic, Cmd+U / Ctrl+U for underline
**Then** the selected text receives the corresponding mark, the toolbar button reflects the active state, and the mark is persisted to the CRDT state — identical outcome to toolbar click

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Heading Level Applied to Paragraph
**Given** an editor places their cursor anywhere within a paragraph (no selection required)
**When** they select H1, H2, or H3 from the heading picker in the toolbar
**Then** the entire paragraph (from start to end of line) is converted to the chosen heading level, the heading renders at the appropriate visual size/weight, and the change is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Toggle Off Existing Mark
**Given** a selected range of text already has the bold mark applied
**When** the editor clicks the Bold toolbar button or presses Cmd+B / Ctrl+B
**Then** the bold mark is removed from the selected text, the toolbar button returns to inactive state, and the change is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-5: Toggle Heading Back to Normal Paragraph
**Given** a line is currently formatted as H1, H2, or H3
**When** the editor selects "Normal" (or equivalent) from the heading picker, or re-selects the same heading level
**Then** the line is converted back to body paragraph style, and the change is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Marks Visible to Other Connected Users
**Given** another editor is connected to the same document via WebSocket (SYNC-01)
**When** an editor applies or removes a mark
**Then** the change is visible in the other editor's view within 500ms (subject to SYNC-02 latency SLA)

**Category:** happy-path
**Priority:** must-have

---

### AC-7: Mobile Browser Blocked or Degraded Gracefully
**Given** a user opens the document editor on a mobile browser (iOS Safari, Android Chrome)
**When** the page renders
**Then** either: (a) a banner informs the user that mobile editing is not supported in v1, or (b) the editor loads in read-only mode — formatting buttons are not shown; the user is not given a broken editing experience

**Category:** edge-case
**Priority:** must-have

---

### AC-8: Formatting Applied to Zero-Length Selection (Cursor Only)
**Given** the editor cursor is positioned in the document with no text selected
**When** the editor activates Bold via toolbar or keyboard shortcut
**Then** the toolbar button toggles to active state, indicating that subsequently typed text will be bold — no existing text is modified

**Category:** edge-case
**Priority:** should-have

---

### AC-9: Mixed Selection State Reflected in Toolbar
**Given** the editor has selected a range of text where some characters are bold and others are not
**When** the toolbar renders
**Then** the Bold button displays in an indeterminate state (not fully active, not fully inactive) — clicking once applies bold to the entire selection

**Category:** edge-case
**Priority:** should-have

---

### AC-10: Formatting Survives Page Reload
**Given** an editor has applied formatting (bold, H2, etc.) and the change was persisted to the CRDT state
**When** the editor reloads the page
**Then** the formatting is present as it was before reload — no formatting is lost

**Category:** boundary
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to any formatting-related document mutation endpoint
**Then** the system returns 401 Unauthorized and no content is modified

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with viewer or commenter role on the document
**When** they attempt to apply formatting (via toolbar click or keyboard shortcut)
**Then** the formatting toolbar is not shown / all toolbar actions are disabled for non-editors; any direct API call to mutate the document returns 403 Forbidden

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| CRDT state mutation fails locally | Formatting appears to apply optimistically; if sync fails, the change is rolled back and an inline banner reads "Change could not be saved. Check your connection." | must-have |
| WebSocket disconnected while applying formatting | Change applies locally; queued for sync on reconnection (offline behavior per OFFL-01) | must-have |

### Performance
- **Response time:** Formatting mark application must appear instantaneously in the local editor (< 16ms for UI response — within one animation frame)
- **Scale:** Formatting must perform without degradation in documents up to 5MB (per SPIKE-01 constraint)

### Security
- **Input validation:** Heading level must be one of {H1, H2, H3} — any other value is rejected by both the editor component and the server CRDT handler
- **Authorization:** Editor-level permission required for all document mutations

### Accessibility
- Toolbar buttons have descriptive `aria-label` attributes (e.g., `aria-label="Bold (Cmd+B)"`)
- Active state is communicated via `aria-pressed="true"` on toggle buttons
- Heading picker is keyboard-accessible (focusable, selectable via arrow keys and Enter)

## Open Questions
- Behavior when no text is selected and a mark shortcut is pressed: apply to next typed word, or apply to all new typing until toggled off? Assumed "apply to new typing" but not confirmed.
- Can bold and italic be combined on the same text? Assumed yes, but rendering must be verified against the chosen CRDT library's data model.

---

# Acceptance Criteria: EDIT-02 — Bullet and Numbered Lists

## Refined Story Statement
As an **editor**, I want to create bullet and numbered lists with up to 3 levels of nesting using Tab/Shift+Tab to indent/dedent, so that I can organize enumerable items clearly in my documents.

## Assumptions
- Maximum nesting depth is 3 levels — **Confirmed** (stated in scope)
- Tab at end of list item indents (increases nesting); Shift+Tab dedents — **Confirmed**
- Pressing Enter within a list creates a new list item at the same level — **Confirmed** (implied by "list continuation on Enter")
- Pressing Enter on an empty list item at the top level removes the list marker and converts the line to a paragraph — **Unconfirmed**
- Pressing Backspace at the start of a first-level list item with content removes the list marker and converts it to a paragraph — **Confirmed** ("backspace at start of list item dedents or removes list marker")
- Bullet and numbered list types are mutually exclusive per list block (cannot mix in the same list without a sub-list) — **Unconfirmed**
- Lists are built on the CRDT data model from SPIKE-01 — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: CRDT framework undefined | Out of Scope — resolved by SPIKE-01 | Dependency |
| G-17: Mobile support | Out of Scope for v1 | Out of Scope |

## Acceptance Criteria

### AC-1: Create Bullet List via Toolbar
**Given** an editor places their cursor in an empty paragraph or selects a range of paragraphs
**When** they click the "Bullet List" toolbar button
**Then** the paragraph(s) are converted to an unordered list with bullet markers, the change is persisted to the CRDT state, and the toolbar button shows an active state

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Create Numbered List via Toolbar
**Given** an editor places their cursor in an empty paragraph or selects a range of paragraphs
**When** they click the "Numbered List" toolbar button
**Then** the paragraph(s) are converted to an ordered list with auto-incrementing numbers, the change is persisted to the CRDT state, and the toolbar button shows an active state

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Continue List on Enter
**Given** the editor cursor is at the end of a list item (bullet or numbered)
**When** the editor presses Enter
**Then** a new list item is created at the same level and type, the cursor moves to the new item, and the change is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Indent List Item with Tab
**Given** the editor cursor is in a list item that is not already at the maximum nesting depth (level 3)
**When** the editor presses Tab
**Then** the list item is indented one level deeper, visually indented, the nesting is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-5: Dedent List Item with Shift+Tab
**Given** the editor cursor is in a nested list item (level 2 or 3)
**When** the editor presses Shift+Tab
**Then** the list item moves up one nesting level, the change is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Backspace at Start of List Item Removes List Marker
**Given** the editor cursor is at the very beginning of a first-level list item
**When** the editor presses Backspace
**Then** the list marker is removed and the line is converted to a plain paragraph, preserving its text content; the change is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-7: Backspace at Start of Nested List Item Dedents
**Given** the editor cursor is at the very beginning of a nested list item (level 2 or 3)
**When** the editor presses Backspace
**Then** the list item is dedented one level (same behavior as Shift+Tab), not removed from the list; the change is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-8: Tab at Maximum Nesting Depth Has No Effect
**Given** the editor cursor is in a list item already at nesting level 3
**When** the editor presses Tab
**Then** no change occurs — the item remains at level 3 and no error is thrown

**Category:** boundary
**Priority:** must-have

---

### AC-9: Exit List on Double Enter
**Given** the editor cursor is in a list item with no content (empty item) at nesting level 1
**When** the editor presses Enter
**Then** the empty list item is removed, the list is terminated, and the cursor moves to a new plain paragraph below the list; the change is persisted to the CRDT state

**Category:** edge-case
**Priority:** must-have

---

### AC-10: Toggle Off List Converts Back to Paragraphs
**Given** a list (bullet or numbered) is present and the editor selects items within it
**When** they click the active toolbar button for the current list type
**Then** the selected list items are converted back to plain paragraphs, preserving text content; the change is persisted to the CRDT state

**Category:** edge-case
**Priority:** must-have

---

### AC-11: List Changes Visible to Other Connected Users
**Given** another editor is connected to the same document
**When** an editor adds, removes, or re-nests a list item
**Then** the change is visible to all connected editors within 500ms

**Category:** happy-path
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to any document mutation endpoint (list operations are CRDT mutations)
**Then** the system returns 401 Unauthorized and no content is modified

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with viewer or commenter role on the document
**When** they attempt to insert or modify a list
**Then** list toolbar buttons are disabled; any direct API mutation call returns 403 Forbidden

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| CRDT mutation fails on list operation | Optimistic local update; rollback on failure with "Change could not be saved" banner | must-have |
| WebSocket disconnected during list edit | Change persists locally; queued for reconnect sync | must-have |

### Performance
- **Response time:** List item creation, indentation, and removal must render within one animation frame (< 16ms locally)
- **Scale:** Lists with up to 200 items must render and scroll without degradation

### Security
- **Input validation:** Nesting depth is enforced server-side (max 3); clients cannot submit a nesting value > 3
- **Authorization:** Editor permission required for all list mutations

### Accessibility
- Rendered bullet and numbered lists use semantic HTML (`<ul>`, `<ol>`, `<li>`) for screen reader compatibility
- Toolbar buttons have `aria-label` attributes and `aria-pressed` state

## Open Questions
- Is the behavior on Enter in an empty first-level list item (exit the list) identical to double-Enter, or does the first Enter create a new empty item before the second exits? Needs UX decision.

---

# Acceptance Criteria: EDIT-03 — Code Blocks

## Refined Story Statement
As an **editor**, I want to insert a code block with optional syntax highlighting by language, so that I can include technical content in my document without it being treated as formatted prose.

## Assumptions
- Code blocks are inserted via a toolbar button or a slash command (`/code` or similar) — **Confirmed**
- Supported languages for syntax highlighting: JavaScript, Python, Go, SQL, Bash, JSON, and plain text — **Confirmed**
- The language selector is optional — **Confirmed** (defaults to plain text if not selected)
- Tab inside a code block inserts a literal tab character, not an indent-to-next-list-level — **Confirmed**
- Inline formatting marks (bold, italic, underline) cannot be applied inside a code block — **Confirmed**
- Inline `code` spans (backtick-wrapped) are a separate capability, explicitly out of scope for this story — **Confirmed**
- Code blocks are monospace-rendered — **Confirmed**
- Syntax highlighting is client-side rendering only (not server-generated) — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: CRDT framework undefined | Out of Scope — SPIKE-01 resolves; code blocks are a CRDT node type | Dependency |
| G-17: Mobile support | Out of Scope for v1 | Out of Scope |

## Acceptance Criteria

### AC-1: Insert Code Block via Toolbar
**Given** an editor is in the document body with cursor at an insertion point
**When** they click the "Code Block" toolbar button
**Then** a code block is inserted at the cursor position (or below the current paragraph), the cursor moves inside the code block, the block renders in monospace font, and the block node is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Insert Code Block via Slash Command
**Given** an editor types `/code` at the start of a line
**When** the slash command menu appears and they select "Code Block" (or press Enter to confirm the top match)
**Then** the line is converted to a code block and the cursor is positioned inside it; the block is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Language Selector Sets Syntax Highlighting
**Given** a code block is active (cursor inside it)
**When** the editor selects a language from the language picker (JavaScript, Python, Go, SQL, Bash, JSON, or plain text)
**Then** the code block re-renders with syntax highlighting tokens appropriate to the selected language; the language selection is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Default Language Is Plain Text
**Given** a code block is inserted without selecting a language
**When** the block renders
**Then** it displays content without syntax coloring (plain text mode), with no error or empty-language indicator shown to the user

**Category:** happy-path
**Priority:** must-have

---

### AC-5: Tab Inserts Literal Tab in Code Block
**Given** the cursor is inside a code block
**When** the editor presses Tab
**Then** a literal tab character (or equivalent 4-space indent, depending on SPIKE-01 choice) is inserted at the cursor position — focus does NOT move to the next UI element

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Inline Formatting Marks Disabled Inside Code Block
**Given** the cursor or selection is inside a code block
**When** the editor presses Cmd+B / Ctrl+B, Cmd+I / Ctrl+I, or Cmd+U / Ctrl+U
**Then** no formatting mark is applied; the toolbar bold/italic/underline buttons are visually disabled while the cursor is inside a code block

**Category:** boundary
**Priority:** must-have

---

### AC-7: Code Block Content Is Editable as Plain Text
**Given** a code block is inserted
**When** the editor types inside it
**Then** characters are inserted as literal text without any rich text interpretation (e.g., typing `**bold**` renders the asterisks as literal characters, not bold text)

**Category:** happy-path
**Priority:** must-have

---

### AC-8: Code Block Visible to Other Connected Users
**Given** another editor is connected to the same document
**When** an editor inserts a code block or types within one
**Then** the change is visible to all connected editors within 500ms

**Category:** happy-path
**Priority:** must-have

---

### AC-9: Delete Code Block
**Given** a code block exists in the document
**When** the editor places the cursor before the code block and presses Backspace (or uses a delete action via context menu)
**Then** the code block and its content are removed from the document; the change is persisted to the CRDT state

**Category:** edge-case
**Priority:** must-have

---

### AC-10: Empty Code Block on Enter Does Not Exit Block
**Given** the cursor is inside an otherwise empty code block
**When** the editor presses Enter
**Then** a new line is inserted within the code block — Enter does not exit the code block (unlike lists). Exiting requires clicking outside the block or via keyboard navigation (Escape or arrow keys past the block boundary).

**Category:** edge-case
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to any document mutation endpoint
**Then** the system returns 401 Unauthorized and no content is modified

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with viewer or commenter role
**When** they attempt to insert a code block or type within one
**Then** code block insertion is unavailable; any direct API mutation call returns 403 Forbidden

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Syntax highlighting library fails to load | Code block renders without highlighting; no error thrown to the user; content remains fully editable | must-have |
| CRDT mutation fails for code block insert | Optimistic local insert; rollback on failure with "Change could not be saved" banner | must-have |

### Performance
- **Response time:** Code block insertion renders within one animation frame (< 16ms locally)
- **Scale:** Code blocks with up to 500 lines must render and scroll without degradation; syntax highlighting must not block the main thread (use web worker or idle callback if needed)

### Security
- **Input validation:** Language selector value must be one of the defined enum {javascript, python, go, sql, bash, json, plain} — arbitrary language strings are rejected server-side
- **Authorization:** Editor permission required for all code block mutations

### Accessibility
- Code blocks render in a `<pre><code>` element with appropriate ARIA role or label
- Language label is visible and programmatically associated with the code block

## Open Questions
- Is the Tab-to-indent behavior 4 spaces or a literal tab character? Needs UX/engineering decision based on SPIKE-01 CRDT representation.
- Should Enter in an empty code block eventually exit the block (like Google Docs) or always insert a newline? Assumed always-newline for v1; confirm with UX.

---

# Acceptance Criteria: EDIT-04 — Tables

## Refined Story Statement
As an **editor**, I want to insert and edit tables with configurable rows and columns, add/remove rows and columns via a context menu, navigate cells with Tab/Shift+Tab, and toggle a header row, so that I can present structured comparative data inline in documents.

## Assumptions
- Default table size at insertion is 2×2 (2 rows, 2 columns) — **Confirmed**
- Initial size is configurable at insert time (user can choose dimensions before inserting) — **Confirmed**
- Tab in the last cell of the last row creates a new row — **Unconfirmed**
- Cell content supports text and inline formatting marks only — **Confirmed** (no nested tables, no images in cells)
- The header row toggle makes the first row visually distinct (e.g., bold background) — **Unconfirmed** (behavior of header row toggle not specified)
- Add/remove row and column actions are accessible via right-click context menu on the table — **Confirmed**
- Tables are built on the CRDT data model from SPIKE-01 — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: CRDT framework undefined | Out of Scope — SPIKE-01 resolves; tables are CRDT node types | Dependency |
| G-17: Mobile support | Out of Scope for v1 | Out of Scope |

## Acceptance Criteria

### AC-1: Insert Table via Toolbar
**Given** an editor places cursor at a valid insertion point (beginning of a paragraph or empty paragraph)
**When** they open the table insertion UI and specify row/column count (defaulting to 2×2), then confirm
**Then** a table with the specified dimensions is inserted at the cursor position, each cell is empty, the cursor is placed in the first cell, and the table node is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Navigate Between Cells via Tab
**Given** the cursor is inside a table cell
**When** the editor presses Tab
**Then** the cursor moves to the next cell (left-to-right, top-to-bottom); if the current cell is the last cell in the row, the cursor moves to the first cell of the next row

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Navigate to Previous Cell via Shift+Tab
**Given** the cursor is inside a table cell (not the first cell)
**When** the editor presses Shift+Tab
**Then** the cursor moves to the previous cell (right-to-left, bottom-to-top)

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Tab in Last Cell Creates New Row
**Given** the cursor is in the last cell of the last row of a table
**When** the editor presses Tab
**Then** a new empty row is appended to the table, the cursor moves to the first cell of the new row, and the change is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-5: Add Row via Context Menu
**Given** the editor right-clicks on a table row
**When** the context menu appears and they select "Insert Row Above" or "Insert Row Below"
**Then** a new empty row is inserted at the specified position relative to the clicked row, and the change is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Remove Row via Context Menu
**Given** the editor right-clicks on a table row (and the table has more than 1 row)
**When** they select "Delete Row" from the context menu
**Then** the row is removed, table layout reflows, and the change is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-7: Add Column via Context Menu
**Given** the editor right-clicks on a table column header or any cell
**When** they select "Insert Column Left" or "Insert Column Right" from the context menu
**Then** a new empty column is inserted at the specified position, and the change is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-8: Remove Column via Context Menu
**Given** the editor right-clicks on a table column (and the table has more than 1 column)
**When** they select "Delete Column" from the context menu
**Then** the column and all its content are removed, table layout reflows, and the change is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-9: Header Row Toggle
**Given** a table exists in the document
**When** the editor activates the "Toggle Header Row" option (toolbar or context menu)
**Then** the first row is visually distinguished (e.g., bold text, shaded background), is semantically marked as a header, and the toggle state is persisted to the CRDT state; toggling again removes header styling

**Category:** happy-path
**Priority:** must-have

---

### AC-10: Inline Formatting Applies Within Cells
**Given** an editor has placed the cursor within a table cell and selected text
**When** they apply bold, italic, underline, or a heading mark
**Then** the formatting applies to the selected text within the cell only; it does not affect other cells; the change is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-11: Cannot Delete Last Row or Column
**Given** a table has exactly 1 row (or 1 column)
**When** the editor attempts to delete that row (or column) via context menu
**Then** the "Delete Row" (or "Delete Column") option is either hidden or disabled; the table is not reduced to 0 rows or 0 columns

**Category:** boundary
**Priority:** must-have

---

### AC-12: Table Changes Visible to Other Connected Users
**Given** another editor is connected to the same document
**When** an editor inserts, modifies, or restructures a table
**Then** the change is visible to all connected editors within 500ms

**Category:** happy-path
**Priority:** must-have

---

### AC-13: Nested Tables Are Not Permitted
**Given** the cursor is inside a table cell
**When** the editor attempts to insert another table (via toolbar or slash command)
**Then** the table insertion action is disabled or produces an informational message ("Tables cannot be nested"); no nested table is created

**Category:** boundary
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to any document mutation endpoint
**Then** the system returns 401 Unauthorized and no content is modified

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with viewer or commenter role
**When** they attempt to insert, modify, or restructure a table
**Then** table insert and context menu actions are unavailable; any direct API mutation returns 403 Forbidden

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| CRDT mutation fails for table operation | Optimistic local change; rollback on failure with "Change could not be saved" banner | must-have |
| Context menu action on a table that was concurrently deleted by another user | Local table disappears; context menu closes; no error thrown | must-have |

### Performance
- **Response time:** All table operations render within one animation frame (< 16ms locally)
- **Scale:** Tables with up to 20 columns and 200 rows must render and scroll without degradation

### Security
- **Input validation:** Row/column counts at insert time are validated server-side (min: 1×1, max: 20 columns × 100 rows for initial insert)
- **Authorization:** Editor permission required for all table mutations

### Accessibility
- Tables render as semantic HTML `<table>` elements with `<th>` for header rows
- Header row cells have `scope="col"` attribute
- Table context menu is keyboard-accessible (right-click equivalent via keyboard shortcut)

## Open Questions
- What is the maximum table size (rows × columns)? Assumed 20 columns, 100 rows for insert; needs product confirmation.
- Does "Tab in last cell creates new row" apply when the table is inside a structured document section, or should Tab at that point move focus out of the table? Needs UX decision.

---

# Acceptance Criteria: EDIT-05 — Image Insertion via File Upload

## Refined Story Statement
As an **editor**, I want to insert images into a document by drag-and-drop or file picker (PNG, JPG, GIF, WebP, max 10MB), with images stored by URL reference in the CRDT state and rendered inline with optional resize, so that I can illustrate content without leaving the document.

## Assumptions
- Images are stored in S3-compatible object storage (existing infrastructure) — **Confirmed** (G-3 resolved: reference-based storage; story scope confirms existing S3 bucket)
- The document stores the URL reference, not inline base64 — **Confirmed**
- Supported formats: PNG, JPG, GIF, WebP — **Confirmed**
- Maximum file size: 10MB per image — **Confirmed**
- Images render at natural size with resize handles that set width as a percentage — **Confirmed**
- Alt text field is provided for accessibility — **Confirmed**
- Clipboard paste of images is out of scope for v1 — **Confirmed**
- Direct URL embedding (without upload) is out of scope for v1 — **Confirmed**
- Images are uploaded to S3 before the URL is inserted into the CRDT state (not inline base64 as intermediate) — **Unconfirmed** (could also be: base64 as draft, replace with URL on success)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-3: Image storage strategy | Resolved by assumption (reference-based, S3 URL) and confirmed by story scope | AC-1, AC-2, AC-3 |
| G-4: Maximum document size | Partially relevant: 10MB per-image limit defined; total document size limit still deferred | Open Question |
| G-1: CRDT framework undefined | Out of Scope — SPIKE-01 resolves; image nodes store URL in CRDT state | Dependency |
| G-17: Mobile support | Out of Scope for v1 | Out of Scope |

## Acceptance Criteria

### AC-1: Image Inserted via File Picker
**Given** an editor is in the document body
**When** they click the image insert toolbar button and select a valid image file (PNG, JPG, GIF, or WebP, ≤ 10MB) via the file picker
**Then** the image is uploaded to S3-compatible storage, the returned URL is stored in the CRDT document state as an image node, and the image renders inline at the cursor position at its natural width (or 100% of column width if natural width exceeds it)

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Image Inserted via Drag-and-Drop
**Given** an editor drags an image file from their filesystem and drops it onto the document editor area
**When** the drop event fires with a valid image file (PNG, JPG, GIF, or WebP, ≤ 10MB)
**Then** the image is uploaded to S3, the URL is stored in the CRDT state, and the image renders inline at the drop position

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Document Stores URL Reference, Not Base64
**Given** an image has been successfully uploaded
**When** the CRDT document state is inspected (or the document is opened by another user)
**Then** the image node contains an HTTPS URL pointing to S3 storage — no base64-encoded image data is present in the CRDT document state

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Upload Progress Indicator Shown
**Given** an editor has initiated an image upload (file picker or drag-and-drop)
**When** the upload is in progress
**Then** a loading placeholder (e.g., spinner or skeleton block) appears at the insertion point indicating the upload is in progress; the editor remains usable while the upload completes

**Category:** happy-path
**Priority:** must-have

---

### AC-5: Alt Text Field Available on Insertion
**Given** an image has been successfully inserted
**When** the editor clicks on the image
**Then** an alt text input field is displayed (in a floating toolbar or side panel), allowing the editor to enter descriptive text; the alt text is stored alongside the image URL in the CRDT state and rendered as the `alt` attribute on the `<img>` element

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Image Width Resizable
**Given** an image is inserted in the document
**When** the editor drags the resize handle on the image
**Then** the image width changes (expressed as a percentage of the editor column width, e.g., 50%), the height scales proportionally, the new width is persisted to the CRDT state, and the change is visible to all connected editors

**Category:** happy-path
**Priority:** must-have

---

### AC-7: File Type Validation — Invalid Format Rejected
**Given** an editor attempts to upload or drop a file with an unsupported format (e.g., .svg, .tiff, .bmp, .pdf)
**When** the file is selected or dropped
**Then** the upload does not proceed; an inline error message reads "Only PNG, JPG, GIF, and WebP images are supported"; no CRDT change is made

**Category:** error-handling
**Priority:** must-have

---

### AC-8: File Size Validation — Oversized File Rejected
**Given** an editor attempts to upload or drop an image file larger than 10MB
**When** the file is selected or dropped
**Then** the upload does not proceed; an inline error message reads "Image must be under 10MB"; no CRDT change is made; the error is enforced client-side before upload begins AND server-side before S3 write

**Category:** error-handling
**Priority:** must-have

---

### AC-9: Upload Failure Handled Gracefully
**Given** an editor initiates a valid image upload
**When** the upload fails (network error, S3 unavailable)
**Then** the loading placeholder is removed, no image node is added to the CRDT state, and an inline error message reads "Image upload failed. Please try again." with a retry button

**Category:** error-handling
**Priority:** must-have

---

### AC-10: Image Renders for All Users with Access
**Given** an image URL has been stored in the CRDT state
**When** any user (with at least viewer access) opens the document
**Then** the image renders from the S3 URL; the URL is publicly readable or signed with appropriate access controls

**Category:** boundary
**Priority:** must-have

---

### AC-11: Clipboard Paste of Image Is Rejected Gracefully
**Given** a user attempts to paste an image from the clipboard (Cmd+V / Ctrl+V with image data)
**When** the paste event fires
**Then** the image is not inserted; an informational message reads "Pasting images from clipboard is not supported yet — use the upload button instead" (no hard error)

**Category:** edge-case
**Priority:** should-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the image upload endpoint or to the document mutation endpoint
**Then** the system returns 401 Unauthorized and no file is uploaded

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with viewer or commenter role
**When** they attempt to insert an image (toolbar button, drag-and-drop, or direct API call)
**Then** insert image is unavailable in the UI; any upload API call returns 403 Forbidden; no file is written to S3

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| S3 upload succeeds but CRDT write fails | S3 object is written but no image node in doc; show retry option; orphaned S3 objects cleaned by a scheduled purge job | must-have |
| Image URL becomes broken (S3 object deleted) | Render a broken image placeholder with alt text; no error thrown to console in production | should-have |
| Multiple images uploaded simultaneously | Each upload is independent; all proceed in parallel; each shows its own progress placeholder | must-have |

### Performance
- **Response time:** Image upload endpoint must accept the file and begin streaming to S3 within 2 seconds of submission
- **Scale:** Images ≤ 10MB each; no defined limit on number of images per document for v1 (pending G-4 resolution)

### Security
- **Input validation:** File type validated by MIME type and magic bytes server-side (not only by extension); max 10MB enforced server-side; S3 bucket is not publicly writable — uploads go through a signed upload URL or proxy
- **Authorization:** Editor permission required for image upload; S3 upload URL is generated server-side only for authenticated editors; viewer-accessible image URLs must not expose S3 credentials

### Accessibility
- Alt text field is required (or explicitly skipped with a "decorative" checkbox) before the image is finalized
- Upload drag-and-drop zone has `role="button"` or `role="region"` and keyboard-accessible activation

## Open Questions
- Total document size limit: if a document can have unlimited images at 10MB each, what is the total document data cap? G-4 is unresolved; must be specified before storage quotas can be set.
- Are uploaded images accessible to users without document access (i.e., are S3 URLs publicly readable)? If not, signed URL expiry behavior must be defined.

---

# Acceptance Criteria: EDIT-06 — Hyperlinks

## Refined Story Statement
As an **editor**, I want to insert hyperlinks on selected text via a dialog (URL + optional display text), edit or remove existing links via context menu, and have links open in a new tab with URL validation, so that I can reference external resources from my documents.

## Assumptions
- URL validation checks format only (must be a parseable URL with a valid scheme); the system does not verify that the URL resolves — **Unconfirmed** (could also ping the URL)
- "Links open in new tab" applies at read/view time — **Confirmed**
- The link dialog accepts both URL and optional display text; if no display text is provided, the URL itself is used as display text — **Unconfirmed**
- If text is selected before opening the dialog, the selected text is pre-populated as the display text — **Unconfirmed**
- Links render visually distinct: underlined, colored (e.g., blue) — **Confirmed** ("render visually distinct from body text")
- Internal document cross-links are out of scope for v1 — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: CRDT framework | Out of Scope — SPIKE-01 resolves; links are inline marks in CRDT | Dependency |
| G-17: Mobile support | Out of Scope for v1 | Out of Scope |

## Acceptance Criteria

### AC-1: Insert Link on Selected Text
**Given** an editor has selected one or more characters in the document body
**When** they open the link insertion dialog (via toolbar button or keyboard shortcut Cmd+K / Ctrl+K) and enter a valid URL, then confirm
**Then** the selected text is wrapped as a hyperlink pointing to the entered URL, the link renders visually distinct (underlined, colored), and the link mark is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Insert Link With Display Text Override
**Given** an editor opens the link dialog with no text selected (or overrides the display text field)
**When** they enter a URL and a display text, then confirm
**Then** the display text is inserted at the cursor position (or replaces the selection) as a hyperlink; the underlying URL is stored in the CRDT state; the display text (not the raw URL) is shown in the document

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Link Opens in New Tab
**Given** a document with a hyperlink is being viewed (by any role with at least viewer access)
**When** the user clicks the link
**Then** the browser opens the link URL in a new tab or window; the current document view is not navigated away from

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Edit Existing Link via Context Menu
**Given** a hyperlink exists in the document and the editor clicks on it
**When** the context menu or floating toolbar appears with an "Edit Link" option and the editor selects it
**Then** the link dialog opens pre-populated with the existing URL and display text; the editor can update either field; confirming persists the updated values to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-5: Remove Link via Context Menu
**Given** a hyperlink exists in the document
**When** the editor right-clicks on the link and selects "Remove Link"
**Then** the link mark is removed from the text (the display text remains as plain text at that position), and the change is persisted to the CRDT state

**Category:** happy-path
**Priority:** must-have

---

### AC-6: URL Validation — Invalid Format Rejected
**Given** an editor enters a URL in the link dialog
**When** they attempt to confirm with an invalid URL (e.g., "not a url", "ftp-bad", empty string)
**Then** the dialog shows an inline validation error "Please enter a valid URL (e.g., https://example.com)"; the link is not inserted; the dialog remains open for correction

**Category:** error-handling
**Priority:** must-have

---

### AC-7: Valid URL Schemes Enforced
**Given** an editor enters a URL in the link dialog
**When** the URL uses a scheme other than `http://` or `https://` (e.g., `javascript:`, `data:`, `file://`)
**Then** the dialog shows a validation error "Only http:// and https:// links are allowed"; the link is not inserted — this blocks XSS vectors via `javascript:` scheme

**Category:** security
**Priority:** must-have

---

### AC-8: Link Changes Visible to Other Connected Users
**Given** another editor is connected to the same document
**When** an editor inserts, edits, or removes a link
**Then** the change is visible to all connected editors within 500ms

**Category:** happy-path
**Priority:** must-have

---

### AC-9: Link Persists Across Page Reloads
**Given** an editor has inserted a link and the change was persisted to CRDT state
**When** any user reloads the document
**Then** the link is present with the correct URL and display text

**Category:** boundary
**Priority:** must-have

---

### AC-10: Applying Link to Already-Linked Text Updates the Link
**Given** text that already has a link mark applied
**When** the editor opens the link dialog on that text and enters a different URL
**Then** the existing link's URL is replaced with the new URL; no duplicate link marks are created

**Category:** edge-case
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to any document mutation endpoint
**Then** the system returns 401 Unauthorized and no content is modified

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with viewer or commenter role
**When** they attempt to insert, edit, or remove a link
**Then** link insertion/editing is not available in the UI; any direct API mutation call returns 403 Forbidden; viewers can click existing links to follow them

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| CRDT mutation fails after link dialog confirm | Optimistic insert; rollback with "Change could not be saved" banner | must-have |
| URL is valid format but resolves to a 404 at click time | Browser opens in new tab and shows whatever the URL returns — system does not pre-validate link liveness | must-have |

### Performance
- **Response time:** Link dialog opens and closes within one animation frame; link mark applies < 16ms locally
- **Scale:** Documents with up to 500 hyperlinks must render without degradation

### Security
- **Input validation:** URL is validated for format and scheme client-side AND server-side before being stored in CRDT state; `javascript:`, `data:`, `vbscript:`, `file://` schemes are blocked; display text is stored as plain text (HTML-escaped on render)
- **Authorization:** Editor permission required for all link mutations; viewers can follow links but cannot insert or modify them

### Accessibility
- Link dialog is keyboard-accessible: opens with Cmd+K / Ctrl+K, fields are Tab-navigable, confirm with Enter, cancel with Escape
- Links in the document have descriptive `title` attribute or visible context; "click here" links should be discouraged in editor UX copy

## Open Questions
- If no text is selected when the link dialog opens, should the dialog insert the URL as the display text at the cursor, or require text selection first? Assumed: URL used as display text at cursor; needs UX confirmation.

---

# Acceptance Criteria: SYNC-01 — WebSocket Session Management for Document Collaboration

## Refined Story Statement
As an **editor or viewer**, I want the editor to automatically establish and maintain an authenticated real-time WebSocket connection when I open a document — with reconnection on disconnect and teardown on close — so that my client can send and receive changes as collaborators edit.

## Assumptions
- Authentication uses the user's existing session token, passed during the WebSocket handshake — **Confirmed**
- The WS service is the existing Node.js WebSocket service (not a new service) — **Confirmed** (story scope: "existing Node.js WS service")
- Each document has its own isolated "room" on the WS service — **Confirmed**
- Reconnection uses exponential backoff — **Confirmed**
- The WS connection is torn down when the document tab closes or navigates away — **Confirmed**
- The server enforces permissions at WS join time (view/comment/edit) — **Confirmed**
- Maximum concurrent editors per document is 50 (from SPIKE-01 constraints) — **Confirmed** (spike goal)
- Connection status UI (e.g., "Connected / Reconnecting" indicator) is handled in PRES-01 — **Confirmed** (out of scope for this story)
- The WS service enforces the 50-editor-per-room limit — **Unconfirmed** (limit is from spike, but enforcement mechanism unspecified)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: CRDT framework undefined | Out of Scope — SPIKE-01 resolves; SYNC-01 depends on SPIKE-01 | Dependency |
| G-2: WebSocket infrastructure | Partially resolved: story confirms existing Node.js WS service; no new provisioning needed. Platform team coordination required. | AC-1, AC-5 |
| G-5: Existing permissions model | Partially addressed: WS layer enforces view/comment/edit at join time; full model integration is PERM-01 | AC-3, AC-AUTH-2 |
| G-15: Maximum concurrent editors | Confirmed at 50 for spike evaluation; enforcement mechanism is an open question | AC-7, Open Question |
| G-17: Mobile support | Out of Scope for v1 | Out of Scope |
| G-18: Document deletion mid-session | Addressed: session terminated immediately when document is deleted | AC-8 |

## Acceptance Criteria

### AC-1: WebSocket Connection Established on Document Open
**Given** an authenticated user (editor or viewer) opens a document
**When** the editor view finishes loading
**Then** the client establishes a WebSocket connection to the document's room on the existing Node.js WS service within 3 seconds of page load, using the user's session token for authentication

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Client Joins Document-Specific Room
**Given** the WebSocket connection is established
**When** the client sends the room join message (with document ID)
**Then** the server registers the client in the document-specific room and acknowledges the join; subsequent messages are scoped to that room only

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Server Enforces Permissions at Join Time
**Given** a client sends a room join message with a valid session token
**When** the server processes the join
**Then** the server checks the user's permission level for the document (view, comment, or edit); clients with no access receive a join rejection message and the connection is closed with code 4403; the permission level is attached to the connection for downstream enforcement

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Reconnection with Exponential Backoff on Disconnect
**Given** a client is connected to a document room and the connection drops (network interruption)
**When** the disconnect is detected
**Then** the client attempts to reconnect using exponential backoff starting at 1 second, doubling each attempt (1s, 2s, 4s, 8s, 16s), capping at 30 seconds, until reconnected or the user navigates away

**Category:** happy-path
**Priority:** must-have

---

### AC-5: Connection Teardown on Document Close
**Given** a client is connected to a document room
**When** the user closes the document tab, navigates away, or logs out
**Then** the WebSocket connection is closed cleanly (with a close frame), the server removes the client from the room, and the client does not attempt to reconnect

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Multiple Clients Can Join the Same Room Concurrently
**Given** multiple users (up to 50) have the same document open
**When** they all establish WebSocket connections
**Then** all clients are registered in the same document room; messages broadcast to the room are received by all connected clients

**Category:** happy-path
**Priority:** must-have

---

### AC-7: Room Capacity Limit Enforced
**Given** a document room already has 50 connected clients
**When** a 51st client attempts to join
**Then** the server rejects the join with a capacity-exceeded message (code 4429 or equivalent); the client receives a user-facing message "Too many users are currently editing this document"; the client does not retry automatically

**Category:** boundary
**Priority:** must-have

---

### AC-8: Active Session Terminated When Document Is Deleted
**Given** one or more clients are connected to a document room
**When** the document is deleted (by an authorized admin)
**Then** the server closes all client connections in that room with a specific close code (e.g., 4410 "Document deleted"); each client's editor shows an in-app message "This document has been deleted" and prevents further editing

**Category:** edge-case
**Priority:** must-have

---

### AC-9: Session Token Expiry During Active Session
**Given** a client is connected to a document room and their session token expires mid-session
**When** the token expiry is detected (either by server-side check or by a client refresh failure)
**Then** the server closes the connection with code 4401 (Unauthorized); the client prompts the user to re-authenticate; unsaved CRDT changes are preserved locally for recovery after re-authentication

**Category:** edge-case
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Connection Rejected
**Given** a WebSocket upgrade request is made without a valid session token (or with an invalid token)
**When** the server processes the handshake
**Then** the server rejects the upgrade with HTTP 401; no WebSocket connection is established

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected at Join
**Given** an authenticated user with no access to a document sends a room join message
**When** the server processes the join
**Then** the server rejects the join with code 4403 and closes the connection; no document data is transmitted to the client

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| WS service is unavailable at document open | Client shows "Unable to connect — working in offline mode"; retries per backoff schedule | must-have |
| Reconnect attempts exceed 5 minutes | Client stops retrying; shows "Connection lost. Reload to reconnect." with a reload button | must-have |
| Server-side room crash | All clients in room detect disconnect; reconnect logic kicks in; server restores room state from SYNC-03 persistence | must-have |

### Performance
- **Connection time:** WebSocket handshake completes within 3 seconds on typical network conditions
- **Scale:** WS service must support 50 concurrent connections per document room; total concurrent rooms is a platform capacity question (coordinate with Platform team)

### Security
- **Input validation:** Session token validated server-side on every connection upgrade — never trust client-supplied user ID; document ID in room join message validated against server-side records
- **Authorization:** Permission level (view/comment/edit) enforced at join time and stored server-side on the connection object; write operations from view-only connections are silently dropped with a 4403 code

### Accessibility
- N/A for WebSocket layer; connection status UI is PRES-01's responsibility

## Open Questions
- What is the enforcement behavior when the 50-editor limit is hit — hard reject, or queue? Assumed hard reject for v1; needs product confirmation.
- Should the client send a "heartbeat" ping to keep the connection alive through NAT/load-balancer timeouts? Not specified; likely needed for long idle sessions.

---

# Acceptance Criteria: SYNC-02 — Real-Time CRDT Change Propagation

## Refined Story Statement
As an **editor**, I want my edits to appear on other users' screens within 500ms at P95, broadcast via CRDT operations over WebSocket, covering all 10 rich text types from EDIT-01 through EDIT-06, so that we can work together in real time without page refreshes.

## Assumptions
- The 500ms P95 target applies under normal network conditions; not guaranteed under severe packet loss — **Confirmed**
- All 10 rich text types (headings, bold/italic/underline, lists, code blocks, tables, images, hyperlinks) produce valid CRDT operations — **Confirmed**
- The server receives, validates, and re-broadcasts CRDT operations (server acts as relay, not transform authority, in CRDT model) — **Unconfirmed** (depends on SPIKE-01 outcome; CRDT = client-authoritative)
- CRDT operations from one client that are received by other clients are applied to their local CRDT state without additional user action — **Confirmed**
- Concurrent, non-overlapping edits are automatically merged by the CRDT algorithm — **Confirmed** (implied by CRDT model)
- The latency SLA is measured end-to-end: from local keypress to rendering on a remote peer — **Unconfirmed** (could be measured from WS send to receive)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: CRDT framework undefined | Out of Scope — SPIKE-01 must complete first; this story depends on it | Dependency |
| G-2: WebSocket infrastructure | Partially resolved by SYNC-01; re-broadcast is SYNC-01's room mechanism | Dependency (SYNC-01) |
| G-4: Maximum document size | Deferred — AC assumes 5MB cap per SPIKE-01; large document performance TBD | AC-8, Open Question |
| G-7: LWW conflict resolution unit | Addressed in CONF-01 (out of scope for SYNC-02) — SYNC-02 covers auto-merge of non-overlapping edits only | Out of Scope |
| G-8: Undo across concurrent edits | Out of Scope for SYNC-02 — handled in CONF-02/03 | Out of Scope |
| G-15: Maximum concurrent editors | Confirmed at 50 for spike; fan-out at 50 clients must meet 500ms SLA | AC-3 |
| G-17: Mobile support | Out of Scope for v1 | Out of Scope |

## Acceptance Criteria

### AC-1: Local CRDT Operations Broadcast to Room
**Given** an authenticated editor with edit permission is connected to a document room
**When** they make any content change (insert, delete, format — any of the 10 EDIT types)
**Then** the resulting CRDT operation is serialized and transmitted to the WS server within 50ms of the local change being applied

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Remote Operations Applied to All Connected Clients
**Given** multiple clients are connected to the same document room
**When** the WS server receives a CRDT operation from one client
**Then** the server re-broadcasts the operation to all other clients in the room, and each receiving client applies the operation to their local CRDT state — the document content converges to the same state on all clients

**Category:** happy-path
**Priority:** must-have

---

### AC-3: End-to-End Latency Within 500ms at P95
**Given** two or more clients are connected to the same document room with up to 50 concurrent editors
**When** an editor makes a content change
**Then** the change is visible (rendered) on all other connected clients' screens within 500ms at P95 under normal network conditions (sub-100ms round-trip latency to the WS server); this is verified by load test tooling, not just manual observation

**Category:** happy-path
**Priority:** must-have

---

### AC-4: All 10 Rich Text Types Produce Valid CRDT Operations
**Given** an editor uses any of the 10 rich text features (EDIT-01: headings/marks, EDIT-02: lists, EDIT-03: code blocks, EDIT-04: tables, EDIT-05: image nodes, EDIT-06: hyperlinks)
**When** they make a change
**Then** the change produces a valid CRDT operation that is correctly broadcast and applied on remote clients — no rich text type silently fails to propagate

**Category:** happy-path
**Priority:** must-have

---

### AC-5: Non-Overlapping Concurrent Edits Auto-Merge
**Given** two editors are simultaneously editing different sections of the same document (non-overlapping character ranges)
**When** their CRDT operations are exchanged via the WS server
**Then** both editors' changes are preserved in the merged document state — neither edit is lost; the document is consistent across all clients

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Viewers Receive Updates But Cannot Send Operations
**Given** a viewer-role client is connected to a document room
**When** an editor makes a change and it is broadcast to the room
**Then** the viewer's client receives and applies the CRDT operation, rendering the change in real time; any CRDT write operation sent by a viewer client is rejected by the server with code 4403

**Category:** boundary
**Priority:** must-have

---

### AC-7: Operation Ordering Is Preserved
**Given** an editor sends operations O1, O2, O3 in sequence
**When** the operations are received by remote clients
**Then** all remote clients apply the operations in CRDT-consistent order (causally ordered per the chosen CRDT library); no race condition produces an inconsistent document state

**Category:** boundary
**Priority:** must-have

---

### AC-8: Propagation Performance Degrades Gracefully Near Document Size Limit
**Given** a document is at or near the 5MB CRDT state size limit
**When** an editor makes a content change
**Then** the CRDT serialization and broadcast still complete within 100ms; end-to-end latency may increase but must remain under 1 second at P95 — not a hard failure

**Category:** edge-case
**Priority:** should-have

---

### AC-9: Client That Misses Operations Catches Up on Reconnect
**Given** a client briefly disconnects (< 30 seconds) and misses CRDT operations broadcast during the outage
**When** the client reconnects (per SYNC-01 backoff)
**Then** the client receives and applies all missed operations from SYNC-03's operation log; the client's local document state converges to the current server state

**Category:** edge-case
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Clients Cannot Receive Operations
**Given** a WebSocket connection is not authenticated (no valid session token)
**When** the connection attempt is made
**Then** SYNC-01 rejects the connection at 401; no CRDT operations are broadcast to that connection

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Clients Without Edit Permission Cannot Broadcast Write Operations
**Given** a client with viewer or commenter role is connected
**When** that client sends a CRDT write operation over the WebSocket
**Then** the server rejects the operation with code 4403 and does not broadcast it to other clients; the rejecting client receives an error message indicating insufficient permission

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| CRDT operation fails to deserialize on receiving client | Log the malformed operation; skip application; do not crash the editor; request a full state sync from server | must-have |
| WS server drops a broadcast (message lost in transit) | Receiving clients detect state divergence via CRDT vector clock; request missing operations from SYNC-03's operation log | must-have |
| Client sends malformed CRDT operation | Server rejects the message with code 4400 (Bad Request); does not broadcast it; logs the event | must-have |

### Performance
- **Latency SLA:** < 500ms end-to-end P95 (keypress to render on remote peer) under ≤ 50 concurrent editors and normal network (< 100ms RTT)
- **Broadcast throughput:** Server must handle at least 100 CRDT operations per second per room without queuing delay
- **Scale:** 50 concurrent clients per room; fan-out of 1 operation to 49 peers within latency SLA

### Security
- **Input validation:** All received CRDT operations are validated against the document's expected CRDT type schema before broadcast; unknown operation types are rejected
- **Authorization:** Write operations (insert, delete, format) require edit permission verified server-side per connection; read (receive) permitted for all joined connections

### Accessibility
- N/A for sync layer; rendering accessibility is the concern of EDIT-01 through EDIT-06

## Open Questions
- Is the 500ms P95 measured from client keypress to remote render, or from WS send to WS receive? The measurement definition must be agreed before writing the load test.
- What is the recovery mechanism when a client's CRDT vector clock diverges irrecoverably from the server state? Must be specified (likely: full state reload from SYNC-03 snapshot).

---

# Acceptance Criteria: SYNC-03 — Server-Side Document State Persistence

## Refined Story Statement
As a **system**, I want the authoritative CRDT document state to be persisted server-side after every change — as an append-only operation log plus periodic snapshots — so that documents survive server restarts and new or reconnecting clients can load the current state efficiently.

## Assumptions
- CRDT state is persisted as an append-only log of CRDT operations — **Confirmed**
- A periodic snapshot of the current CRDT state is also stored for fast initial load — **Confirmed**
- New clients joining a room receive: the latest snapshot + all operations since that snapshot — **Confirmed**
- Document state survives WebSocket service restarts — **Confirmed**
- Snapshot frequency: every 5 minutes of edit activity (not 5 wall-clock minutes) — **Unconfirmed** ("every 5 minutes of activity" is ambiguous; see Open Questions)
- Version history snapshots (VER-01) are a separate concern — **Confirmed** (explicitly out of scope for this story)
- Full audit log (who changed what) is a separate concern — **Confirmed** (out of scope)
- The CRDT state log is append-only (operations are never mutated or deleted, only appended) — **Confirmed**
- The database schema for CRDT state must be defined as part of this story — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: CRDT framework undefined | Out of Scope — SPIKE-01 resolves; storage format depends on chosen library (Yjs update binary vs. JSON) | Dependency |
| G-4: Maximum document size | Deferred — affects snapshot storage quotas and operation log growth; must be defined before storage capacity is planned | Open Question |
| G-2: WebSocket infrastructure | Partially relevant: SYNC-03 must survive WS service restart; persistence is DB-side, not WS-side | AC-4 |
| G-15: Maximum concurrent editors | Partially relevant: 50 concurrent editors generate up to 50× operation volume per second | AC-6 |
| G-17: Mobile support | Out of Scope for v1 | Out of Scope |

## Acceptance Criteria

### AC-1: CRDT Operation Appended to Log on Every Change
**Given** a connected editor makes a content change that produces a CRDT operation
**When** the WS server receives and re-broadcasts the operation (per SYNC-02)
**Then** the operation is appended to the document's persistent CRDT operation log in the database within 500ms; the operation log entry includes: document ID, operation sequence number, CRDT operation payload (binary or JSON per SPIKE-01 choice), and server-received timestamp

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Periodic Snapshot Computed and Stored
**Given** the document has had at least one edit event since the last snapshot (or since document creation)
**When** 5 minutes of edit activity have elapsed (where "activity" = at least one CRDT operation received in the past 5 minutes)
**Then** the server computes a snapshot of the current merged CRDT state and stores it in the database tagged with: document ID, snapshot sequence number, the operation log index it was computed from, and a wall-clock timestamp; the snapshot supersedes earlier snapshots for fast-load purposes

**Category:** happy-path
**Priority:** must-have

---

### AC-3: New Client Loads State Efficiently on Join
**Given** a client joins a document room (per SYNC-01)
**When** the server processes the join
**Then** the server sends: (1) the most recent state snapshot, then (2) all CRDT operations appended after that snapshot's operation log index; the client applies them in order to reconstruct the current document state; total initial load time must be under 3 seconds for a document at 5MB CRDT state size

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Document State Survives WS Service Restart
**Given** the WS service restarts (deployment, crash, or planned maintenance)
**When** clients reconnect (per SYNC-01 backoff)
**Then** the server reconstitutes the document room state from the database (latest snapshot + subsequent log entries); reconnecting clients receive the full current state as if no restart occurred; no CRDT operations are lost that were acknowledged before the restart

**Category:** happy-path
**Priority:** must-have

---

### AC-5: Operation Log Is Append-Only (No Mutations or Deletions)
**Given** CRDT operations have been persisted to the operation log
**When** any process (server, admin script, or migration) accesses the log
**Then** existing operation entries are immutable — no update or delete is possible on committed entries; only append is permitted; this is enforced by database constraints (e.g., no UPDATE/DELETE privilege on the table for the application role)

**Category:** boundary
**Priority:** must-have

---

### AC-6: Operation Log Handles High Write Volume Without Data Loss
**Given** 50 concurrent editors are actively editing a document simultaneously
**When** the server receives up to 100 CRDT operations per second across all clients
**Then** all operations are durably written to the operation log without data loss; write latency does not cause the SYNC-02 500ms broadcast SLA to be violated

**Category:** boundary
**Priority:** must-have

---

### AC-7: Client That Missed Operations Receives Gap Fill on Reconnect
**Given** a client reconnects after a brief disconnect and has a known last-applied operation sequence number
**When** the client sends its last-known sequence number to the server
**Then** the server sends only the operations after that sequence number (not the full snapshot), allowing the client to catch up efficiently; this is verified for gaps up to 5 minutes of edit activity

**Category:** edge-case
**Priority:** must-have

---

### AC-8: Snapshot Does Not Block Ongoing Operations
**Given** the server is computing a snapshot (a potentially expensive operation for large documents)
**When** new CRDT operations arrive during snapshot computation
**Then** the new operations are appended to the log and broadcast to clients without waiting for the snapshot to complete; snapshot computation is asynchronous and does not block the broadcast path

**Category:** edge-case
**Priority:** must-have

---

### AC-9: Orphaned Operation Logs Are Not Created for Failed Documents
**Given** a document creation (DOC-01) fails or is rolled back
**When** the CRDT state persistence layer is initialized
**Then** no operation log or snapshot records are created for the failed document; the persistence layer only initializes for documents that exist in the documents table (enforced by foreign key)

**Category:** edge-case
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access to Persistence Layer Rejected
**Given** no valid authentication token is present
**When** a request is made to any document state API (e.g., `GET /api/documents/:id/state`)
**Then** the system returns 401 Unauthorized and no CRDT state data is returned

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected for State Access
**Given** an authenticated user with no access to a document
**When** a request is made to retrieve that document's CRDT state
**Then** the system returns 403 Forbidden and no state data is disclosed — neither the snapshot nor operation log entries

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Database write fails for an operation | Server returns an error to the sending client; does NOT broadcast the operation to room peers (to prevent state divergence between memory and persistence); client retries the operation | must-have |
| Snapshot computation fails | Log a server-side error; continue accepting and appending operations; schedule a retry for snapshot at next activity window; do not degrade real-time editing | must-have |
| Operation log grows excessively large (no snapshot for extended period) | Alert monitoring when log exceeds 10,000 entries without a snapshot; trigger immediate snapshot computation | should-have |
| Client joins a document with no snapshot yet (only a log) | Server replays the full operation log to the client; no special case needed; must complete within 3 seconds for the defined document size limit | must-have |

### Performance
- **Write latency:** Operation append to database within 500ms (must not add latency to the SYNC-02 broadcast path)
- **Initial load:** New client receives snapshot + delta and applies them in < 3 seconds for a 5MB document
- **Snapshot computation:** Must complete within 10 seconds for a 5MB CRDT state; runs asynchronously; does not block broadcast
- **Scale:** Must handle 100 operation appends per second per document room under 50 concurrent editors

### Security
- **Input validation:** CRDT operation payloads stored in the log are validated before storage (schema check per SPIKE-01 format); malformed payloads are rejected and not persisted
- **Authorization:** Application database role has INSERT-only access to the operation log table (no UPDATE/DELETE); snapshot table has INSERT + SELECT; read access to both tables requires a valid document permission check performed in the API layer

### Accessibility
- N/A for server-side persistence layer

## Open Questions
- "5 minutes of activity" — does the 5-minute clock reset after each operation, or is it a fixed 5-minute tumbling window? If reset-on-activity, a high-traffic document may never snapshot; if tumbling, a low-traffic document may snapshot empty windows. Must be defined before implementation.
- What is the operation log retention policy? Do old entries get pruned after N snapshots? Not specified; must be defined before storage capacity is planned (depends on G-4 document size resolution).
- Should the initial-load state payload be compressed (e.g., gzip) before transmission to the client? Not specified; recommended for documents approaching 5MB.

---

## Coverage Summary

| # | Story Slug | AC Count | Auth AC | Gap Rows | Status |
|---|-----------|----------|---------|----------|--------|
| 1 | SPIKE-01 | 5 | No (research spike — no user-facing auth boundary) | 7 | Complete |
| 2 | DOC-01 | 10 | Yes (AC-AUTH-1, AC-AUTH-2) | 4 | Complete |
| 3 | DOC-02 | 11 | Yes (AC-AUTH-1, AC-AUTH-2) | 3 | Complete |
| 4 | EDIT-01 | 12 | Yes (AC-AUTH-1, AC-AUTH-2) | 3 | Complete |
| 5 | EDIT-02 | 12 | Yes (AC-AUTH-1, AC-AUTH-2) | 2 | Complete |
| 6 | EDIT-03 | 12 | Yes (AC-AUTH-1, AC-AUTH-2) | 2 | Complete |
| 7 | EDIT-04 | 15 | Yes (AC-AUTH-1, AC-AUTH-2) | 2 | Complete |
| 8 | EDIT-05 | 13 | Yes (AC-AUTH-1, AC-AUTH-2) | 4 | Complete |
| 9 | EDIT-06 | 12 | Yes (AC-AUTH-1, AC-AUTH-2) | 2 | Complete |
| 10 | SYNC-01 | 11 | Yes (AC-AUTH-1, AC-AUTH-2) | 6 | Complete |
| 11 | SYNC-02 | 11 | Yes (AC-AUTH-1, AC-AUTH-2) | 6 | Complete |
| 12 | SYNC-03 | 11 | Yes (AC-AUTH-1, AC-AUTH-2) | 6 | Complete |
| **Total** | **12 stories** | **135 AC** | **11/12 (SPIKE-01 exempt)** | **47 gap rows** | **Complete** |


<!-- STORY COUNT: 10 stories to process -->

# Acceptance Criteria: PRES-01 — User Presence List

## Refined Story Statement
As an editor or viewer, I want to see a list of who else currently has the document open, so that I know in real time whether I am editing alone or collaborating with others.

## Assumptions
- Users are authenticated via the existing auth system before joining a document session — **Confirmed**
- The presence list is scoped to the document currently open, not workspace-wide — **Confirmed**
- Display name and avatar come from the user's existing profile — **Confirmed**
- The 2s appearance and 5s disappearance SLAs apply under normal network conditions — **Confirmed**
- Viewer vs. editor badge is derived from the user's document-level permission role — **Confirmed**
- A user refreshing the page re-enters as a new presence event (no sticky session token) — **Unconfirmed** → Open Questions
- "+N more" overflow does not paginate; clicking it is out of scope for this story — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1 CRDT/OT framework undefined | Out of Scope for this story — presence heartbeat is independent of CRDT library; depends on WebSocket session from SYNC-01 | N/A |
| G-2 WebSocket server model unknown | Open Question — presence requires persistent WebSocket connection; server model must be resolved before SYNC-01 ships; this story is blocked until SYNC-01 is live | OQ-1 |
| G-4 Max document size | Out of Scope — not relevant to presence list display | N/A |
| G-5 Existing permissions model | Addressed — presence list derives viewer vs. editor badge from document-level role; full integration with existing model is deferred per G-5, but badge display uses role already resolved at session join | AC-5 |
| G-15 Max concurrent editors not specified | Addressed — UI caps display at 10 avatars with "+N more" overflow; P99 design target of 50 is documented as assumption; WebSocket broadcast limits remain an open question | AC-4, OQ-2 |
| G-17 Mobile/responsive support | Open Question — presence list must render on mobile if mobile editing is scoped in | OQ-3 |
| G-18 Document deletion mid-session | Addressed — deleted document terminates session; presence list clears and editors receive in-app notification | AC-10 |

## Acceptance Criteria

### AC-1: User appears in presence list on document open
**Given** an authenticated user with any document-level role opens a document that has at least one other connected user  
**When** the WebSocket session is established  
**Then** the opening user's display name, avatar, and role badge (Viewing / Editing) appear in the presence list of all other connected clients within 2 seconds

**Category:** happy-path  
**Priority:** must-have

### AC-2: User disappears from presence list on document close
**Given** a user has an active presence in the document  
**When** the user closes the tab, navigates away, or their browser terminates the WebSocket connection  
**Then** that user's entry is removed from all other clients' presence lists within 5 seconds via heartbeat expiry

**Category:** happy-path  
**Priority:** must-have

### AC-3: Role badge reflects document permission
**Given** a user joins a document session  
**When** their entry appears in the presence list  
**Then** the badge reads "Editing" if the user has edit permission, and "Viewing" if the user has view-only or comment-only permission

**Category:** happy-path  
**Priority:** must-have

### AC-4: Overflow indicator for more than 10 concurrent users
**Given** more than 10 users have the document open simultaneously  
**When** the presence list is rendered  
**Then** exactly 10 avatars are shown and a "+N more" label displays the count of additional users beyond 10, where N is the total connected count minus 10

**Category:** edge-case  
**Priority:** must-have

### AC-5: Presence list is empty when user is alone
**Given** a user opens a document with no other connected users  
**When** the presence list renders  
**Then** it shows only the current user's own entry (or an empty state with a label such as "Only you") — it does not show phantom presences or stale entries from previous sessions

**Category:** edge-case  
**Priority:** must-have

### AC-6: Presence list updates dynamically as users join and leave
**Given** a document is open with multiple users present  
**When** a new user joins mid-session or an existing user leaves  
**Then** the presence list updates in all open clients' UIs without requiring a page reload, within the 2s (join) and 5s (leave) SLAs

**Category:** happy-path  
**Priority:** must-have

### AC-7: Network error does not leave stale presence entries indefinitely
**Given** a user's connection drops without a clean close (e.g., network failure, process kill)  
**When** the server detects heartbeat timeout  
**Then** the user's presence entry is removed from all other clients within 5 seconds of heartbeat expiry

**Category:** error-handling  
**Priority:** must-have

### AC-8: Viewer cannot be shown as "Editing"
**Given** a user with view-only permission opens the document  
**When** their presence entry is displayed in other clients  
**Then** their badge always reads "Viewing" regardless of any client-side state

**Category:** boundary  
**Priority:** must-have

### AC-9: Presence list survives transient WebSocket reconnect
**Given** a connected user experiences a brief disconnection (< 5 seconds) and the client auto-reconnects  
**When** the reconnection completes  
**Then** the user's presence entry is restored in all other clients' presence lists and their own list reflects accurate current state — no duplicate entries appear

**Category:** edge-case  
**Priority:** must-have

### AC-10: Presence list clears on document deletion
**Given** a document with active connected users is deleted  
**When** the deletion event is broadcast to the WebSocket session  
**Then** the presence list is cleared for all connected clients, the collaboration session is terminated, and each client displays an in-app notification: "This document has been deleted."

**Category:** error-handling  
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** a request is made to join a document's presence session  
**Then** the system returns 401 Unauthorized and the user is not added to the presence list

**Category:** security  
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user who has no access role on the target document  
**When** a request is made to join the document's presence session  
**Then** the system returns 403 Forbidden and the user is not added to the presence list

**Category:** security  
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| WebSocket server unreachable | Presence list shows "Unable to load collaborators" error state; editing continues in degraded single-user mode | must-have |
| Avatar image fails to load | Fallback to initials-based avatar using the user's display name | should-have |
| Heartbeat response delayed | User entry remains until 5s timeout elapses; no premature removal | must-have |

### Performance
- **Presence join latency:** User appears in other clients' lists within 2 seconds at p95 under normal load
- **Presence leave latency:** User removed within 5 seconds at p95 after disconnection
- **Scale:** Presence list must support up to 50 concurrent users per document (P99 design target); UI only renders 10 + overflow

### Security
- **Input validation:** Display name and avatar URL come from the server-side user profile; the client does not supply or override these values
- **Authorization:** Session join endpoint verifies document-level role before adding user to the presence broadcast group

### Accessibility
- Presence avatars must have `aria-label` containing the user's name and role badge
- "+N more" overflow must be keyboard-focusable and announce total count to screen readers

## Open Questions
- **OQ-1:** WebSocket server model (G-2) must be resolved before this story can be implemented. Is a dedicated WebSocket service being provisioned, or will this piggyback on an existing long-polling/SSE layer?
- **OQ-2:** Maximum concurrent editors upper bound (G-15) must be specified to finalize presence broadcast capacity planning. The "+N more" UI assumes ≤ 50 P99 — is this correct?
- **OQ-3:** Mobile/responsive presence list (G-17): if mobile editing is in scope, the avatar stack must collapse gracefully on narrow viewports. Requires explicit scoping decision.
- **OQ-4 (Unconfirmed assumption):** Does a user who refreshes the page appear as a "new" join event, or does the session persist? If the latter, what is the session token lifetime?

---

# Acceptance Criteria: PRES-02 — Colored Cursors and Name Labels

## Refined Story Statement
As an editor, I want to see the real-time cursor position and text selection of other editors as colored overlays with name labels, so that I can see exactly where others are working and avoid stepping on the same text.

## Assumptions
- Cursor color is deterministically derived from the user's ID so the same user always gets the same color across sessions — **Confirmed**
- View-only users (Viewers) have no edit cursor to display; Commenters have no body-text edit cursor — **Confirmed**
- Cursor positions are broadcast over the same WebSocket channel as document operations — **Confirmed**
- Name label display behavior (hover-only vs. persistent) is not yet decided — **Unconfirmed** → Open Questions
- Remote cursor overlays do not interfere with local text input — **Confirmed** (render layer is separate from input)
- Cursor updates are throttled server-side to avoid saturating the WebSocket channel — **Unconfirmed** → Open Questions

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1 CRDT/OT framework undefined | Open Question — cursor position broadcast format (character offset, CRDT anchor, or DOM position) depends on the chosen framework; this story's implementation is blocked on SPIKE-01 | OQ-1 |
| G-2 WebSocket server model | Open Question — cursor broadcast requires the same persistent connection as SYNC-01; blocked until resolved | OQ-2 |
| G-4 Max document size | Out of Scope — not directly relevant to cursor rendering; large documents may affect scroll performance but are not in scope here | N/A |
| G-5 Existing permissions model | Addressed — Viewer and Commenter roles do not display editing cursors; role check is at session join | AC-5 |
| G-15 Max concurrent editors | Addressed — up to 50 editors' cursors must render without performance degradation; color palette must support at least 50 distinct colors | AC-6, OQ-3 |
| G-17 Mobile/responsive support | Open Question — cursor overlay rendering on touch devices requires explicit scoping | OQ-4 |

## Acceptance Criteria

### AC-1: Remote editor cursor rendered as colored caret
**Given** two or more editors have the same document open  
**When** Editor B moves their cursor or types  
**Then** Editor A sees a colored caret at Editor B's cursor position within the document, using Editor B's assigned color, updated in real time

**Category:** happy-path  
**Priority:** must-have

### AC-2: Remote text selection rendered as colored highlight
**Given** Editor B selects a range of text  
**When** the selection event is broadcast  
**Then** Editor A sees that range highlighted in Editor B's assigned color as an overlay on the document text

**Category:** happy-path  
**Priority:** must-have

### AC-3: Name label displayed near remote cursor
**Given** a remote editor's cursor is visible in the document  
**When** the local user hovers over the cursor caret or label  
**Then** a name label showing the remote editor's display name appears adjacent to the cursor caret in the same color

**Category:** happy-path  
**Priority:** must-have

### AC-4: Cursor color is deterministic and consistent
**Given** a user joins a document session  
**When** their cursor color is assigned  
**Then** the color is derived deterministically from the user's ID such that the same user always receives the same color in the same document, and the color does not change during the session even if other users join or leave

**Category:** edge-case  
**Priority:** must-have

### AC-5: Viewer and Commenter cursors are not rendered
**Given** a Viewer or Commenter has the document open  
**When** the presence and cursor systems render  
**Then** no editing cursor is shown for that user; their entry in the presence list remains visible but no caret overlay appears in the document

**Category:** boundary  
**Priority:** must-have

### AC-6: Multiple concurrent editor cursors render without collision
**Given** up to 50 editors have the document open simultaneously  
**When** all editors are actively moving cursors  
**Then** all 50 cursors are rendered with distinct colors; no two editors share the same color; name labels do not overlap in a way that prevents reading any label (stacking or offset strategy applied)

**Category:** edge-case  
**Priority:** must-have

### AC-7: Remote cursor disappears when editor leaves
**Given** a remote editor's cursor is visible in the document  
**When** that editor closes the document or their connection is lost (within the 5s heartbeat window)  
**Then** their cursor caret and selection highlight are removed from the local user's view without a page reload

**Category:** happy-path  
**Priority:** must-have

### AC-8: Local cursor is not shown as a remote overlay
**Given** the local user has the document open  
**When** cursor overlays are rendered  
**Then** the local user does not see their own cursor as a colored remote overlay — only other users' cursors appear as overlays

**Category:** boundary  
**Priority:** must-have

### AC-9: Cursor position updates do not block text input
**Given** multiple remote cursors are broadcasting position updates  
**When** the local user types or moves their own cursor  
**Then** the local editing experience (keystroke-to-render latency) is not measurably degraded by cursor broadcast traffic; input remains responsive

**Category:** performance  
**Priority:** must-have

### AC-10: Cursor overlay handles document scroll correctly
**Given** a remote editor's cursor is in a part of the document not currently visible to the local user  
**When** the local user scrolls to that region  
**Then** the remote cursor overlay appears at the correct position in the document without layout shift or misalignment

**Category:** edge-case  
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** a request is made to subscribe to cursor broadcast events for a document  
**Then** the system returns 401 Unauthorized and no cursor data is transmitted

**Category:** security  
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without any document-level role  
**When** a request is made to subscribe to cursor broadcast events  
**Then** the system returns 403 Forbidden and the user receives no cursor data

**Category:** security  
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Cursor position broadcast arrives out of order | Client applies latest received position; stale positions are discarded | must-have |
| Color palette exhausted (> available distinct colors) | Colors are recycled in round-robin; two users may share a color only when total editors exceed palette size; this state is logged as a warning | should-have |
| WebSocket drops mid-session | Cursor overlays for all remote users are hidden until reconnection; local editing continues | must-have |

### Performance
- **Cursor update latency:** Remote cursor position visible to other editors within 500ms at p95 under 50 concurrent editors
- **Throttle rate:** Cursor position broadcasts are throttled to no more than 10 updates/second per user to limit WebSocket traffic
- **Scale:** Rendering 50 simultaneous remote cursors must not reduce document frame rate below 30 fps on a mid-range laptop

### Security
- **Input validation:** Cursor position payloads are validated server-side; a client cannot broadcast a cursor position to a document it does not have access to
- **Authorization:** Cursor broadcast subscription requires a valid document session token

### Accessibility
- Cursor overlays must not block access to document text for screen readers (overlays are purely visual, rendered outside the document's semantic layer)
- Color alone is not the only differentiator — name labels must accompany cursors for users who cannot distinguish colors

## Open Questions
- **OQ-1:** Cursor position encoding format (G-1): depends on CRDT anchor representation from SPIKE-01. Character offsets in mutable CRDT documents are position-unstable; CRDT-native anchors are required. Cannot finalize this story before SPIKE-01.
- **OQ-2:** WebSocket server design (G-2) must be resolved before cursor broadcast channel is designed.
- **OQ-3:** Maximum concurrent editors (G-15): the color palette must be defined once this bound is known. If the cap is 50, 50 distinct accessible colors must be specified.
- **OQ-4:** Mobile/responsive cursor rendering (G-17): touch-based documents have no concept of "hover" for name labels — display strategy must be decided if mobile is in scope.
- **OQ-5 (Unconfirmed assumption):** Is the name label persistent (always visible near the caret) or hover-only? A persistent label is more accessible but clutters the UI with many users. Requires product decision.
- **OQ-6 (Unconfirmed assumption):** What is the cursor broadcast throttle rate? 10 updates/second is used as a placeholder above — must be confirmed with engineering.

---

# Acceptance Criteria: CONF-01 — Automatic Merge for Non-Overlapping Concurrent Edits

## Refined Story Statement
As an editor, I want edits I make in one part of the document to merge automatically with another editor's edits in a different part, so that both sets of changes coexist without either user losing work.

## Assumptions
- "Non-overlapping" means edits affecting disjoint character ranges in the CRDT document — **Confirmed**
- Both clients converging to the same final state (strong eventual consistency) is the correctness guarantee required — **Confirmed**
- No user-facing notification is shown when an automatic merge occurs — **Confirmed** (explicitly excluded)
- Integration tests with two simultaneous clients are the acceptance vehicle for this story — **Confirmed**
- The CRDT library selected in SPIKE-01 provides strong eventual consistency guarantees — **Unconfirmed** (SPIKE-01 pending)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1 CRDT/OT framework undefined | Open Question — this story cannot be finalized until SPIKE-01 selects the framework; AC references CRDT behavior generically | OQ-1 |
| G-2 WebSocket server model | Open Question — merge propagation requires operational WebSocket infrastructure | OQ-2 |
| G-4 Max document size | Addressed — merge performance AC references document size bounds; currently deferred, so a placeholder SLA is used with a flag to revisit | AC-7 |
| G-7 LWW conflict resolution unit | Out of Scope for CONF-01 — this story covers non-overlapping edits only; same-range conflict resolution is CONF-02 | N/A |
| G-8 Undo across concurrent edits | Out of Scope — undo behavior is CONF-03 | N/A |
| G-15 Max concurrent editors | Addressed — merge correctness must hold for all concurrent editor counts; performance SLA placeholder references 50 concurrent editors | AC-7 |
| G-17 Mobile/responsive | Out of Scope for this story — merge is server/CRDT-side logic, not UI | N/A |

## Acceptance Criteria

### AC-1: Non-overlapping inserts converge to identical state on both clients
**Given** Editor A inserts text at position P1 and Editor B simultaneously inserts text at position P2 where P1 and P2 are in disjoint character ranges  
**When** both operations are broadcast and applied  
**Then** both clients display the same document content containing both insertions within 500ms of receiving the remote operation, with no data loss

**Category:** happy-path  
**Priority:** must-have

### AC-2: Non-overlapping deletes converge correctly
**Given** Editor A deletes a range of characters at position P1 and Editor B simultaneously deletes a different non-overlapping range at P2  
**When** both delete operations are broadcast and applied  
**Then** both clients converge to the same document state where both deleted ranges are absent and all other content is preserved

**Category:** happy-path  
**Priority:** must-have

### AC-3: Non-overlapping formatting changes do not conflict
**Given** Editor A applies bold formatting to a range of text and Editor B simultaneously applies italic formatting to a different non-overlapping range  
**When** both formatting operations are broadcast and applied  
**Then** both clients display both formatting changes applied correctly with no loss of either editor's formatting

**Category:** happy-path  
**Priority:** must-have

### AC-4: Insert and delete in non-overlapping ranges converge
**Given** Editor A inserts text at position P1 and Editor B simultaneously deletes text at a non-overlapping position P2  
**When** both operations are broadcast  
**Then** both clients converge to a state containing Editor A's insertion and reflecting Editor B's deletion, with correct character positions accounting for both operations

**Category:** edge-case  
**Priority:** must-have

### AC-5: No user action is required to trigger merge
**Given** two editors make non-overlapping concurrent edits  
**When** the edits are broadcast  
**Then** the merge occurs automatically without any prompt, dialog, or manual action from either editor

**Category:** happy-path  
**Priority:** must-have

### AC-6: No merge notification is shown
**Given** a non-overlapping concurrent merge has completed  
**When** the merged state is displayed  
**Then** no notification, banner, or visual indicator informs the user that a merge occurred — the merged result simply appears in the document

**Category:** boundary  
**Priority:** must-have

### AC-7: Merge correctness holds under concurrent load
**Given** 50 concurrent editors each making edits in distinct non-overlapping regions of a document  
**When** all operations are broadcast  
**Then** all 50 clients converge to the same document state within 500ms of the last operation being received, with zero data loss across all edits

**Category:** performance  
**Priority:** must-have

### AC-8: Merge is verified by integration test with two simultaneous clients
**Given** an automated integration test that opens the same document with two distinct authenticated editor sessions and submits concurrent non-overlapping operations  
**When** the test completes  
**Then** both client states are compared and confirmed identical; the test passes; this test is part of the CI pipeline

**Category:** happy-path  
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** a request is made to submit a document operation to the sync endpoint  
**Then** the system returns 401 Unauthorized and the operation is not applied or broadcast

**Category:** security  
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without edit permission on the document  
**When** a request is made to submit a document operation  
**Then** the system returns 403 Forbidden and the operation is not applied or broadcast

**Category:** security  
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Operation broadcast fails (network error) | Operation is retried by the client up to 3 times with exponential backoff before surfacing an error | must-have |
| Server receives duplicate operation (retry) | Server applies idempotency check; duplicate is discarded without corrupting document state | must-have |
| Client receives operation for unknown CRDT document | Client logs error and requests full document state sync | must-have |

### Performance
- **Convergence time:** Both clients reach identical state within 500ms at p95 after the later operation is received
- **Scale:** Merge correctness must hold for up to 50 concurrent editors (placeholder pending G-15 resolution)

### Security
- **Authorization:** Every operation submission is validated server-side for edit permission before being stored or broadcast
- **Input validation:** CRDT operation payloads are schema-validated; malformed operations are rejected with 400 Bad Request

### Accessibility
- Not applicable — this is a server-side merge story with no UI surface of its own

## Open Questions
- **OQ-1:** CRDT/OT framework (G-1): this story's implementation is entirely dependent on the framework chosen in SPIKE-01. AC are written against behavior guarantees rather than implementation details; review after SPIKE-01 completes.
- **OQ-2:** WebSocket infrastructure (G-2): the broadcast mechanism for operation propagation depends on this decision.
- **OQ-3:** Maximum document size (G-4): merge performance under large documents is not bounded by a spec. The 500ms SLA in AC-7 is a placeholder; revise after G-4 is resolved.
- **OQ-4:** Maximum concurrent editors (G-15): 50 is used as a placeholder in AC-7. Revise after G-15 is resolved.

---

# Acceptance Criteria: CONF-02 — Last-Writer-Wins Resolution for Same-Range Concurrent Edits

## Refined Story Statement
As an editor, I want the system to resolve conflicts when two users edit the same character range simultaneously by keeping the most recently received write, so that the document always converges to a consistent state without requiring any user action.

## Assumptions
- LWW resolution unit is the character level — **Confirmed** (story scope explicitly states this)
- The "winning" edit is determined by server-received timestamp, not client-side clock — **Confirmed**
- The losing edit is silently dropped; no notification is sent to the losing user — **Confirmed** (explicitly excluded by stakeholder)
- Both clients converge to the same post-resolution state — **Confirmed**
- Seeing one's text change in real time is considered sufficient feedback for the "loser" — **Confirmed** (per stakeholder)
- Server clocks are synchronized to a reliable time source (e.g., NTP) to ensure timestamp ordering is meaningful — **Unconfirmed** → Open Questions

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1 CRDT/OT framework undefined | Open Question — LWW at character level requires the CRDT framework to expose per-character timestamps or a tie-breaking mechanism; SPIKE-01 must confirm feasibility | OQ-1 |
| G-7 LWW conflict resolution unit unclear | Addressed — story scope explicitly defines the unit as character level; this AC is written against that decision | AC-1, AC-2 |
| G-8 Undo across concurrent edits | Out of Scope — CONF-03 covers undo behavior | N/A |
| G-2 WebSocket server model | Open Question — LWW requires server-side timestamp assignment, which requires server infrastructure | OQ-2 |
| G-15 Max concurrent editors | Addressed — LWW correctness must hold for all concurrent editor counts; placeholder of 50 used | AC-4 |
| G-17 Mobile/responsive | Out of Scope — server-side conflict resolution logic, no UI | N/A |

## Acceptance Criteria

### AC-1: Later-received write wins at character level
**Given** Editor A and Editor B simultaneously edit the same character range  
**When** the server receives both operations  
**Then** the operation with the later server-received timestamp is applied for every character in the contested range; the earlier operation's characters in that range are dropped

**Category:** happy-path  
**Priority:** must-have

### AC-2: Both clients converge to the identical post-resolution state
**Given** a same-range conflict has been resolved by LWW  
**When** the resolution is broadcast to all connected clients  
**Then** all clients display the same document content within 500ms; no client retains the losing content

**Category:** happy-path  
**Priority:** must-have

### AC-3: Losing user sees their text change without notification
**Given** the local user's edit was the losing write in an LWW conflict  
**When** the winning remote edit is applied  
**Then** the local user sees the text in the contested range update to the winning content; no error message, notification, or dialog is shown

**Category:** boundary  
**Priority:** must-have

### AC-4: LWW resolution is correct under high concurrency
**Given** 10 editors simultaneously edit the same character range in a document  
**When** the server receives all 10 operations  
**Then** the document converges to the content of the single operation with the latest server-received timestamp; all other writes in the contested range are dropped; all 10 clients display the same result

**Category:** edge-case  
**Priority:** must-have

### AC-5: Non-contested characters adjacent to conflict range are preserved
**Given** Editor A edits characters C1–C5 and Editor B edits characters C3–C8 simultaneously  
**When** LWW resolution is applied to the overlapping range C3–C5  
**Then** Editor A's non-contested characters C1–C2 and Editor B's non-contested characters C6–C8 are both preserved in the final document state; only the overlapping range C3–C5 is subject to LWW

**Category:** edge-case  
**Priority:** must-have

### AC-6: LWW resolution is covered by automated integration tests
**Given** an automated integration test that opens the same document with two authenticated editor sessions, submits concurrent writes to the same character range with controlled timestamps  
**When** the test completes  
**Then** the winning content is confirmed as the later-timestamped write; both client states match; the test is part of the CI pipeline

**Category:** happy-path  
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** a request is made to submit an operation to the conflict resolution endpoint  
**Then** the system returns 401 Unauthorized and the operation is discarded

**Category:** security  
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without edit permission  
**When** a request is made to submit a write operation  
**Then** the system returns 403 Forbidden and the operation is discarded without affecting document state

**Category:** security  
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Two operations arrive with identical server timestamps | A deterministic tie-breaking rule is applied (e.g., lexicographic comparison of user IDs); the rule is documented; neither operation is silently discarded arbitrarily | must-have |
| Server clock skew causes timestamp inversion | Operations are sequenced by server-side logical clock as fallback; physical timestamp is not the sole ordering mechanism | must-have |

### Performance
- **Resolution latency:** Conflict resolved and broadcast to all clients within 500ms at p95
- **Scale:** LWW correctness verified under 50 concurrent editors editing overlapping ranges

### Security
- **Authorization:** Operation submission endpoint validates edit permission before timestamp assignment
- **Input validation:** Operation payloads are validated; clients cannot forge server-side timestamps

### Accessibility
- Not applicable — no UI surface for this story

## Open Questions
- **OQ-1:** CRDT framework (G-1): LWW at the character level must be confirmed as implementable with the chosen framework from SPIKE-01. Some CRDTs use their own ordering semantics that may conflict with a pure timestamp-based LWW approach.
- **OQ-2:** Server clock synchronization strategy: NTP drift can cause timestamp inversions under high concurrency. A hybrid logical clock (HLC) or vector clock may be required. Requires engineering decision.
- **OQ-3 (Unconfirmed assumption):** Is server-received timestamp the agreed tiebreaker, or should the framework's native ordering (e.g., Yjs's Lamport timestamps) be used instead? The two may diverge under network partitions.

---

# Acceptance Criteria: CONF-03 — Local-Only Undo Stack

## Refined Story Statement
As an editor, I want Ctrl+Z / Cmd+Z to undo only my own recent edits, so that I can correct my own mistakes without accidentally reverting another editor's work.

## Assumptions
- Undo applies only to the local user's CRDT operations; it does not revert remote operations — **Confirmed**
- An undo of a locally-applied operation that has already merged is applied as a new inverse CRDT operation, not a rollback — **Confirmed**
- Undo history is session-scoped (not persisted across page reloads) — **Confirmed**
- Redo is available symmetrically (Ctrl+Y / Cmd+Shift+Z) — **Confirmed** (implied by "redo works symmetrically")
- The CRDT framework chosen in SPIKE-01 must support local-only undo natively (e.g., Yjs UndoManager) or this story requires custom implementation — **Unconfirmed** → Open Questions
- The maximum depth of the undo stack is not specified — **Unconfirmed** → Open Questions

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1 CRDT/OT framework undefined | Open Question — local-only undo in a CRDT context is non-trivial and framework-dependent; Yjs UndoManager is cited in the story but this is contingent on SPIKE-01 | OQ-1 |
| G-8 Undo across concurrent edits | Addressed — story scope explicitly defines local-only undo as a new inverse operation, not a rollback; remote changes to the same region are not reverted | AC-3, AC-4 |
| G-7 LWW conflict resolution unit | Out of Scope — LWW is CONF-02; undo of locally-lost LWW writes is addressed in AC-5 | AC-5 |
| G-17 Mobile/responsive | Open Question — Ctrl+Z / Cmd+Z keyboard shortcuts do not apply on mobile; a mobile undo gesture or button would be required if mobile editing is in scope | OQ-2 |
| G-15 Max concurrent editors | Out of Scope — undo is per-user local stack; concurrent editor count does not affect local undo behavior | N/A |

## Acceptance Criteria

### AC-1: Ctrl+Z / Cmd+Z undoes the local user's most recent edit
**Given** the local user has made one or more edits to the document  
**When** the user presses Ctrl+Z (Windows/Linux) or Cmd+Z (macOS)  
**Then** the user's most recent local edit is reversed; the document updates to show the pre-edit content in that location

**Category:** happy-path  
**Priority:** must-have

### AC-2: Redo restores an undone edit
**Given** the local user has undone at least one edit  
**When** the user presses Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (macOS)  
**Then** the most recently undone edit is reapplied; the document returns to its post-edit state

**Category:** happy-path  
**Priority:** must-have

### AC-3: Undo does not revert remote editors' changes
**Given** Editor B has made edits to the document that have been applied to the local view  
**When** the local user presses Ctrl+Z  
**Then** only the local user's operations are undone; Editor B's edits remain present in the document

**Category:** boundary  
**Priority:** must-have

### AC-4: Undo of a merged operation is applied as a new inverse CRDT operation
**Given** the local user has made an edit that has already been merged with remote state  
**When** the local user presses Ctrl+Z  
**Then** the undo is applied as a new CRDT operation that is the logical inverse of the original; it does not roll back the merged state globally; other clients receive this inverse operation and see the local user's original edit reversed while their own edits remain

**Category:** edge-case  
**Priority:** must-have

### AC-5: Undo of an LWW-lost write is a no-op or removes local-side artifact
**Given** the local user made an edit that was overwritten by an LWW conflict resolution  
**When** the local user presses Ctrl+Z targeting that operation  
**Then** the undo either silently skips that operation (it was already dropped) or applies a no-op inverse; the document does not display the lost content

**Category:** edge-case  
**Priority:** must-have

### AC-6: Undo history is cleared on page reload
**Given** the local user has an undo history from the current session  
**When** the user reloads the page  
**Then** the undo stack is empty; Ctrl+Z has no effect; no attempt is made to restore prior session undo history

**Category:** boundary  
**Priority:** must-have

### AC-7: Undo stack is per-user and not shared across editors
**Given** two editors are in the same document  
**When** Editor A presses Ctrl+Z  
**Then** only Editor A's undo stack is affected; Editor B's undo stack is unchanged; Editor B does not see Editor A's undo reflected in their own undo history

**Category:** boundary  
**Priority:** must-have

### AC-8: Consecutive undo presses traverse the local history in reverse order
**Given** the local user has made edits E1, E2, E3 in that order  
**When** the user presses Ctrl+Z three times  
**Then** E3 is undone first, then E2, then E1, in strict LIFO order; each undo is applied as a separate inverse operation broadcast to other clients

**Category:** happy-path  
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** a request is made to submit an undo operation to the document sync endpoint  
**Then** the system returns 401 Unauthorized and the operation is discarded

**Category:** security  
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without edit permission  
**When** a request is made to submit an undo operation  
**Then** the system returns 403 Forbidden and the operation is discarded; the user's local undo UI may still reflect the undo visually but the server state is not affected

**Category:** security  
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Undo operation fails to broadcast (network error) | Undo is applied locally; client retries broadcast up to 3 times; if all retries fail, the user sees a "Failed to sync undo — please check your connection" message | must-have |
| Undo stack is empty (user presses Ctrl+Z with nothing to undo) | No change to document; no error; the undo action is silently ignored (standard editor behavior) | must-have |

### Performance
- **Undo latency:** Local undo renders within 50ms of keypress; broadcast to remote clients within 500ms at p95

### Security
- **Authorization:** Undo operations are validated server-side as edit operations; the same permission check applies as for any other write
- **Input validation:** Inverse CRDT operations are validated before being applied to server state

### Accessibility
- Undo/redo must be accessible via keyboard shortcuts; a toolbar button (if present) must have an accessible `aria-label`

## Open Questions
- **OQ-1:** CRDT framework (G-1): local-only undo is significantly easier with Yjs UndoManager than with frameworks that lack native support. SPIKE-01 must confirm this capability is available.
- **OQ-2:** Mobile undo (G-17): if mobile editing is scoped in, a touch-friendly undo control (button in the toolbar) must be specified.
- **OQ-3 (Unconfirmed assumption):** What is the maximum undo stack depth? An unbounded stack could consume significant memory in a long editing session. Requires product or engineering decision.
- **OQ-4 (Unconfirmed assumption):** Does undoing a formatting-only change (e.g., toggling bold) apply the same CRDT inverse operation model, or is formatting treated differently from content edits?

---

# Acceptance Criteria: OFFL-01 — Local Edit Queue While Disconnected

## Refined Story Statement
As an editor, I want to continue editing a document when my network connection drops, so that network instability does not block my work.

## Assumptions
- The client detects disconnection via WebSocket close/error events — **Confirmed**
- CRDT operations made offline are queued in IndexedDB — **Confirmed**
- All rich text editing features (headings, bold, lists, etc.) remain available offline — **Confirmed**
- Presence UI is hidden or shows only the local user while offline — **Confirmed**
- Auto-snapshot (VER-01) is paused while offline — **Confirmed**
- The offline banner is dismissible — **Unconfirmed** → Open Questions
- IndexedDB is available in the target browser environments — **Confirmed** (standard in all modern browsers)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1 CRDT/OT framework | Open Question — the local operation queue format is determined by the CRDT library's update encoding; cannot finalize until SPIKE-01 | OQ-1 |
| G-2 WebSocket server model | Addressed — disconnection detection is WebSocket-based; client switches to offline mode on close/error; server model does not affect offline queueing logic | AC-1 |
| G-9 Offline duration limit | Addressed — no limit on local queueing (unlimited duration); divergence warning is shown on reconnect if offline > 24h (handled in OFFL-02) | AC-3, note |
| G-4 Max document size | Addressed — IndexedDB storage for queued ops is bounded by device storage; no spec limit; if storage is exhausted, an error is shown | AC-8 |
| G-17 Mobile/responsive | Open Question — offline mode detection and IndexedDB queueing should work on mobile browsers; explicit test coverage required if mobile is in scope | OQ-2 |
| G-15 Max concurrent editors | Out of Scope — presence is hidden offline; concurrent editor count is irrelevant | N/A |

## Acceptance Criteria

### AC-1: Client detects disconnection and enters offline mode
**Given** the local user has the document open with an active WebSocket connection  
**When** the WebSocket connection closes or errors (network drop, server restart, etc.)  
**Then** the client switches to offline mode; the "You're offline — changes will sync when reconnected" banner is displayed; the editing interface remains fully functional

**Category:** happy-path  
**Priority:** must-have

### AC-2: All rich text editing features remain available while offline
**Given** the client is in offline mode  
**When** the user types, formats text, inserts lists, applies headings, adds code blocks, or makes any other supported rich text edit  
**Then** the edit is applied to the local document view immediately; no feature is disabled or grayed out due to the offline state

**Category:** happy-path  
**Priority:** must-have

### AC-3: CRDT operations are queued in IndexedDB while offline
**Given** the client is in offline mode and the user makes one or more edits  
**When** each edit is made  
**Then** the corresponding CRDT operation is persisted to IndexedDB immediately; operations are stored in the order they were applied; the queue survives a page reload within the same browser session

**Category:** happy-path  
**Priority:** must-have

### AC-4: Offline banner is visible and non-blocking
**Given** the client has entered offline mode  
**When** the banner is displayed  
**Then** the banner is visible at a consistent location (e.g., top of the editor); it does not obscure the document content or block text input; editing continues behind it

**Category:** happy-path  
**Priority:** must-have

### AC-5: Presence UI is hidden or reduced while offline
**Given** the client is in offline mode  
**When** the presence list and remote cursors would normally be shown  
**Then** remote cursors are hidden (they cannot be updated without connection); the presence list shows only the local user or an "offline" state; no stale remote presence data is displayed

**Category:** boundary  
**Priority:** must-have

### AC-6: Auto-snapshot is paused while offline
**Given** the client is in offline mode  
**When** 5 cumulative minutes of edit activity have elapsed  
**Then** no snapshot is triggered; the snapshot timer is paused; snapshot generation resumes after reconnection and successful merge (OFFL-02)

**Category:** boundary  
**Priority:** must-have

### AC-7: Offline banner disappears on reconnection
**Given** the client is in offline mode with the banner displayed  
**When** the WebSocket connection is restored  
**Then** the offline banner is dismissed; the client enters the reconnection merge flow (OFFL-02); the banner is replaced by the reconnect merge status indicator

**Category:** happy-path  
**Priority:** must-have

### AC-8: IndexedDB storage exhaustion is surfaced to the user
**Given** the client is in offline mode and the local device has insufficient IndexedDB storage to queue additional operations  
**When** a new edit is attempted  
**Then** the user sees an error message: "Unable to save offline changes — device storage is full. Your recent edits may not be preserved when you reconnect."; the editor does not crash

**Category:** error-handling  
**Priority:** must-have

### AC-9: Queued operations survive a page reload while offline
**Given** the client is offline and has queued CRDT operations in IndexedDB  
**When** the user reloads the page while still offline  
**Then** the queued operations are read back from IndexedDB; the local document state reflects all edits made before the reload; the offline banner is shown; operations remain queued for sync on reconnection

**Category:** edge-case  
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** the client attempts to open a document (before offline mode could be entered)  
**Then** the system returns 401 Unauthorized; the document does not open; offline mode is not applicable

**Category:** security  
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without document access  
**When** the client attempts to open a document  
**Then** the system returns 403 Forbidden; the document does not open; offline mode is not applicable

**Category:** security  
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| WebSocket reconnects momentarily then drops again | Client returns to offline mode; queue is not flushed until a stable connection and full merge are confirmed | must-have |
| IndexedDB is unavailable (private browsing restriction) | Offline edits are queued in memory only; user is warned: "Offline changes will be lost if you reload the page." | should-have |

### Performance
- **Offline edit latency:** Edits in offline mode render within 50ms (same as online mode); IndexedDB write must not block the main thread
- **Queue read-back:** On page reload while offline, the local document state must be restored from IndexedDB within 2 seconds

### Security
- **Input validation:** IndexedDB queue is read back and validated before being replayed to the server on reconnection; malformed entries are discarded
- **No sensitive data in IndexedDB:** Document content stored in IndexedDB must be scoped to the authenticated user's browser session; consider encryption if the document is sensitive

### Accessibility
- The offline banner must have `role="alert"` and `aria-live="assertive"` so screen readers announce it immediately on disconnection

## Open Questions
- **OQ-1:** CRDT operation serialization format (G-1): the encoding of queued operations in IndexedDB depends on the framework chosen in SPIKE-01.
- **OQ-2:** Mobile offline support (G-17): IndexedDB and WebSocket detection behave differently on mobile browsers (especially iOS Safari); explicit test coverage is required if mobile is in scope.
- **OQ-3 (Unconfirmed assumption):** Is the offline banner dismissible by the user, or is it persistent until reconnection? A dismissible banner is less intrusive; a persistent one ensures awareness. Requires product decision.

---

# Acceptance Criteria: OFFL-02 — Reconnect Merge and Divergence Warning

## Refined Story Statement
As an editor, I want my offline edits to automatically merge with server state when I reconnect, so that my work is not lost after a disconnection, and I am warned if the offline gap is long enough to risk meaningful conflicts.

## Assumptions
- Merge is always attempted regardless of offline duration — **Confirmed**
- A warning is shown when the client was offline for more than 24 hours — **Confirmed**
- The warning is dismissible; no blocking action is required — **Confirmed**
- The warning duration message shows the actual offline duration (e.g., "You were offline for 26 hours") — **Confirmed** (implied by story format)
- Merged state is propagated to all connected clients as a normal CRDT update — **Confirmed**
- The 24-hour threshold is measured from the time of WebSocket disconnect to the time of reconnection — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1 CRDT/OT framework | Open Question — CRDT operation replay on reconnect is framework-dependent; SPIKE-01 must confirm the reconnect flow | OQ-1 |
| G-9 Offline duration limit | Addressed — merge always attempted; divergence warning shown at > 24h; no merge refusal | AC-1, AC-4 |
| G-7 LWW conflict resolution | Addressed — same-range conflicts during offline replay are resolved by CONF-02 LWW rules | AC-3 |
| G-8 Undo across concurrent edits post-merge | Addressed — undo stack after merge is governed by CONF-03 (local-only undo); offline replay operations are appended to local history | note |
| G-2 WebSocket server model | Open Question — reconnect merge requires the server to accept replayed operation batches | OQ-2 |
| G-16 Notification model | Addressed — divergence warning is an in-app banner only; no email or push notification is sent (notifications out of scope per G-16 assumption) | AC-4 |
| G-17 Mobile/responsive | Open Question — reconnect behavior on mobile browsers (especially background tab handling) must be tested if mobile is in scope | OQ-3 |

## Acceptance Criteria

### AC-1: Queued operations are replayed against server state on reconnection
**Given** the client has queued CRDT operations in IndexedDB during an offline period  
**When** the WebSocket connection is restored  
**Then** the client replays all queued operations against the current server state in the order they were made; the merged document reflects both local offline edits and any changes made by other editors during the offline period

**Category:** happy-path  
**Priority:** must-have

### AC-2: Merged state is broadcast to all connected clients
**Given** the offline client has successfully replayed its queued operations  
**When** the merge is complete  
**Then** all other connected clients receive the merged operations as standard CRDT updates and converge to the same document state

**Category:** happy-path  
**Priority:** must-have

### AC-3: Same-range conflicts during offline replay are resolved by LWW
**Given** the offline client's queued operations include writes to character ranges that were also modified by other editors during the offline period  
**When** the replayed operations are merged  
**Then** LWW conflict resolution (CONF-02) is applied; the operation with the later server-received timestamp wins; the merged document is consistent

**Category:** edge-case  
**Priority:** must-have

### AC-4: Divergence warning is shown after offline periods exceeding 24 hours
**Given** the client was disconnected for more than 24 hours  
**When** the merge completes successfully  
**Then** a dismissible in-app banner displays: "You were offline for [duration] — your changes have been merged. Please review the document for conflicts." where [duration] is the actual offline duration rounded to the nearest hour

**Category:** edge-case  
**Priority:** must-have

### AC-5: No divergence warning for offline periods under 24 hours
**Given** the client was disconnected for less than 24 hours  
**When** the merge completes  
**Then** no divergence warning is shown; the offline banner (OFFL-01) is dismissed and the document returns to normal collaborative mode without additional prompts

**Category:** boundary  
**Priority:** must-have

### AC-6: Merge is always attempted regardless of offline duration
**Given** the client was offline for any duration (including several days)  
**When** the connection is restored  
**Then** the merge is attempted; the system never refuses the merge or discards offline edits solely due to the duration of the offline period

**Category:** boundary  
**Priority:** must-have

### AC-7: Divergence warning is dismissible and non-blocking
**Given** the divergence warning is shown  
**When** the user clicks "Dismiss" or the close control on the banner  
**Then** the banner is removed; the user can continue editing without taking any further action

**Category:** happy-path  
**Priority:** must-have

### AC-8: IndexedDB queue is cleared after successful merge
**Given** the client has successfully replayed all queued operations  
**When** the server confirms receipt and application of the merged state  
**Then** the IndexedDB queue is cleared; a subsequent disconnect-reconnect cycle starts with a fresh empty queue

**Category:** happy-path  
**Priority:** must-have

### AC-9: Partial merge failure leaves queue intact and surfaces an error
**Given** the client is replaying queued operations and a network error interrupts the replay mid-batch  
**When** the error occurs  
**Then** the remaining unsynced operations stay in the IndexedDB queue; the user sees: "Reconnection interrupted — your changes are still queued and will sync when connection stabilizes."; the full replay is retried on the next stable connection

**Category:** error-handling  
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** the client attempts to replay queued operations on the sync endpoint  
**Then** the system returns 401 Unauthorized; the queue is not flushed; the user is redirected to log in

**Category:** security  
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user whose document access has been revoked during their offline period  
**When** the client attempts to replay queued operations  
**Then** the system returns 403 Forbidden; the user is shown: "You no longer have edit access to this document. Your offline changes could not be synced."; the queue is not applied

**Category:** security  
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Server rejects one operation in the replay batch | The rejected operation is logged; the remaining operations are still applied; the user is not shown a per-operation error | must-have |
| Merge produces a document state that fails server-side validation | Server returns 422 with details; client surfaces: "Your offline changes could not be fully merged — please contact support." and preserves the queue | must-have |

### Performance
- **Merge latency:** Queued operations from up to 1 hour of offline editing must be fully merged and broadcast within 10 seconds of reconnection at p95
- **Large offline queue:** A queue representing 8 hours of continuous editing must complete merge within 60 seconds

### Security
- **Authorization:** Each replayed operation is validated individually server-side for edit permission; batch replay does not bypass per-operation authorization
- **Replay idempotency:** Operations include a client-generated idempotency key; the server rejects duplicate submissions without applying them twice

### Accessibility
- Divergence warning banner must have `role="alert"` and `aria-live="polite"` (non-urgent; editing should not be interrupted)
- Dismiss button must be keyboard-accessible with an `aria-label="Dismiss offline sync warning"`

## Open Questions
- **OQ-1:** CRDT replay format (G-1): the exact wire format for replaying queued operations depends on the framework from SPIKE-01.
- **OQ-2:** WebSocket server replay endpoint (G-2): the server must have an endpoint that accepts batched operation replays with idempotency keys; this design is blocked on the server architecture decision.
- **OQ-3:** Mobile offline reconnect (G-17): iOS Safari throttles background tabs and may terminate WebSocket connections without a close event; the reconnect merge flow must handle this gracefully if mobile is in scope.

---

# Acceptance Criteria: VER-01 — Automatic Snapshots on Edit Activity

## Refined Story Statement
As an editor, I want the system to automatically save a snapshot of the document every 5 cumulative minutes of edit activity, so that I can recover from mistakes or see how the document evolved without manually saving.

## Assumptions
- "5 cumulative minutes of edit activity" means 5 minutes of keystrokes and formatting events; idle time between edits does not count toward the timer — **Confirmed**
- Each snapshot records: document state at the time, timestamp, and list of editors who contributed edits in that interval — **Confirmed**
- Snapshots older than 30 days are auto-pruned unless they are named (VER-02) — **Confirmed**
- Snapshots are stored server-side — **Confirmed**
- Snapshots are paused during offline mode and resume after reconnect and merge — **Confirmed** (per OFFL-01)
- The activity timer resets after each snapshot is taken — **Unconfirmed** → Open Questions
- "Keystrokes and formatting changes" are the only events that count as edit activity; cursor moves and scrolls do not count — **Unconfirmed** → Open Questions

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-4 Max document size | Addressed — snapshot storage quotas cannot be defined without a document size bound; performance AC uses a placeholder; must be revisited when G-4 is resolved | AC-6, OQ-1 |
| G-9 Offline duration limit | Addressed — snapshots are paused offline; timer resumes after OFFL-02 merge completes | AC-5 |
| G-10 Version history restore behavior | Out of Scope for VER-01 — restore is VER-03; snapshot creation (this story) does not define restore behavior | N/A |
| G-1 CRDT/OT framework | Addressed — snapshots can be derived from the CRDT document state regardless of framework; this story is not blocked by SPIKE-01 (snapshot is a point-in-time state capture) | N/A |
| G-17 Mobile/responsive | Out of Scope — snapshot creation is server-side; no mobile-specific UI | N/A |
| G-15 Max concurrent editors | Addressed — contributing editors list is captured per interval; must support up to 50 editor IDs per snapshot | AC-3 |

## Acceptance Criteria

### AC-1: Snapshot is triggered after 5 cumulative minutes of edit activity
**Given** one or more editors have the document open and are actively editing  
**When** the cumulative edit activity timer reaches 5 minutes (counting only keystrokes and formatting changes, not idle time)  
**Then** a snapshot of the current document state is saved server-side; the timer resets to zero

**Category:** happy-path  
**Priority:** must-have

### AC-2: Snapshot includes timestamp and contributing editors
**Given** a snapshot has been triggered  
**When** the snapshot is stored  
**Then** the snapshot record includes: the full document state at the moment of capture, the UTC timestamp of the capture, and the list of user IDs (and display names) of all editors who contributed edits during the preceding 5-minute activity interval

**Category:** happy-path  
**Priority:** must-have

### AC-3: Contributing editors list is accurate for multi-editor sessions
**Given** Editors A and B have both made edits during the current 5-minute activity window  
**When** the snapshot is taken  
**Then** both Editor A and Editor B are listed as contributing editors; no editor who made no edits in this interval is listed

**Category:** edge-case  
**Priority:** must-have

### AC-4: Idle time does not count toward the 5-minute activity timer
**Given** an editor opens a document and makes edits for 2 minutes, then is idle for 10 minutes, then makes edits for 3 more minutes  
**When** the final edit completes the 5 cumulative minutes of activity  
**Then** a snapshot is triggered; the 10 minutes of idle time did not advance the timer

**Category:** edge-case  
**Priority:** must-have

### AC-5: Snapshot timer is paused during offline mode
**Given** the editor is in offline mode (OFFL-01) and continues making edits  
**When** the client's activity accumulates  
**Then** no snapshot is triggered while offline; the activity timer is paused; snapshot generation resumes after OFFL-02 merge completes and the client re-establishes connection

**Category:** boundary  
**Priority:** must-have

### AC-6: Auto-snapshots older than 30 days are pruned
**Given** an auto-snapshot (not named) was created more than 30 days ago  
**When** the pruning job runs (at least daily)  
**Then** the auto-snapshot is deleted from server storage; named snapshots (VER-02) created from the same time period are not deleted

**Category:** boundary  
**Priority:** must-have

### AC-7: Named snapshots are never auto-pruned
**Given** a snapshot has been given a name via VER-02  
**When** the 30-day pruning window elapses  
**Then** the named snapshot is retained; the pruning job does not delete named snapshots regardless of age

**Category:** boundary  
**Priority:** must-have

### AC-8: Snapshot does not interrupt the editing experience
**Given** a snapshot is being saved server-side  
**When** the snapshot write operation executes  
**Then** the local editor UI experiences no perceptible lag, modal, or interruption; snapshot saving is entirely background/async

**Category:** performance  
**Priority:** must-have

### AC-9: No snapshot is taken for documents with zero edit activity
**Given** a document is open but no edits have been made (read-only session)  
**When** time passes  
**Then** no automatic snapshots are created; the snapshot trigger requires actual edit activity, not merely document open state

**Category:** boundary  
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** a request is made to the snapshot creation endpoint  
**Then** the system returns 401 Unauthorized and no snapshot is stored

**Category:** security  
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without edit permission  
**When** the system attempts to attribute edit activity to that user for snapshot purposes  
**Then** the user's activity does not contribute to snapshot triggers; if a Viewer somehow triggers a snapshot endpoint directly, the system returns 403 Forbidden

**Category:** security  
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Snapshot write fails (storage error) | Error is logged server-side; the editor is not notified (snapshot failure is not user-surfaced); the next activity window will attempt a new snapshot | must-have |
| Pruning job fails | Failed job is retried at next scheduled run; no snapshots are permanently lost due to a single pruning failure | must-have |

### Performance
- **Snapshot write latency:** Snapshot must be fully written to server storage within 5 seconds of the trigger; does not block editor
- **Storage:** Placeholder — maximum storage per document per 30-day window must be defined after G-4 (document size) is resolved
- **Pruning frequency:** Auto-pruning job runs at least once per day

### Security
- **Authorization:** Snapshot creation is triggered server-side by the activity tracking system, not by client request; the client cannot trigger snapshots on demand via this mechanism (VER-02 handles manual snapshots)
- **Data integrity:** Snapshots are stored as immutable records; they cannot be modified after creation

### Accessibility
- Not applicable — no UI surface for this story (snapshot creation is entirely background)

## Open Questions
- **OQ-1:** Maximum document size (G-4): until resolved, snapshot storage quota per document cannot be specified. If a document can be 500 pages, 5-minute snapshots could consume substantial storage rapidly.
- **OQ-2 (Unconfirmed assumption):** Does the activity timer reset immediately after a snapshot, or does it continue accumulating? If a snapshot is taken at T=5min and editing continues, does the next snapshot trigger at T=10min (reset) or continue from 0?
- **OQ-3 (Unconfirmed assumption):** What event types count as "edit activity"? Are paste, undo, redo, and drag-and-drop counted in addition to keystrokes and formatting changes?
- **OQ-4:** Snapshot behavior when multiple editors are active: is the 5-minute timer shared across all editors' activity (any keystroke from any editor advances it), or per-editor? The story implies shared — confirm.

---

# Acceptance Criteria: VER-02 — Manual Named Version Save

## Refined Story Statement
As an editor, I want to save the current document state as a named version at any time, so that I can mark meaningful milestones that I can reliably return to.

## Assumptions
- The "Save version" action is available in the document toolbar at all times while the editor has edit permission — **Confirmed**
- Version name is optional; if omitted, the version is saved with a timestamp-based default name — **Confirmed**
- Maximum version name length is 100 characters — **Confirmed**
- Named versions are never auto-pruned — **Confirmed**
- The save action is immediate (not deferred or batched) — **Confirmed**
- A named version can be saved while other editors are actively editing — **Unconfirmed** → Open Questions
- There is no limit on the number of named versions a document can have — **Unconfirmed** → Open Questions

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-10 Version history restore behavior | Out of Scope for VER-02 — restore is VER-03; named versions created here are the target of restore | N/A |
| G-4 Max document size | Out of Scope — named version snapshot storage follows the same model as VER-01; no additional constraint introduced by this story | N/A |
| G-17 Mobile/responsive | Open Question — toolbar "Save version" action must be accessible on mobile if mobile editing is in scope | OQ-3 |
| G-1 CRDT/OT framework | Out of Scope — named version capture is a point-in-time state capture; not framework-dependent at the product AC level | N/A |
| G-15 Max concurrent editors | Addressed — saving a named version during a multi-editor session captures the current merged state at that instant; no conflict | AC-4 |

## Acceptance Criteria

### AC-1: "Save version" action is accessible from the document toolbar
**Given** an authenticated editor has a document open  
**When** the editor looks at the document toolbar  
**Then** a "Save version" button or menu item is visible and clickable; it is not hidden behind more than one layer of menus

**Category:** happy-path  
**Priority:** must-have

### AC-2: Named version is saved with user-provided name
**Given** the editor clicks "Save version"  
**When** the user enters a name of up to 100 characters and confirms  
**Then** the current document state is saved immediately as a named version with the provided name, the current UTC timestamp, and the saving user's identity; a success confirmation is shown

**Category:** happy-path  
**Priority:** must-have

### AC-3: Version is saved with timestamp default when no name is provided
**Given** the editor clicks "Save version" and submits without entering a name (or clears the name field)  
**Then** the version is saved with a default name in the format "Version — YYYY-MM-DD HH:MM UTC"; the version is otherwise identical to a named version and is never auto-pruned

**Category:** edge-case  
**Priority:** must-have

### AC-4: Named version captures current merged document state in multi-editor session
**Given** multiple editors are actively editing when "Save version" is triggered  
**When** the save executes  
**Then** the snapshot captures the document state at the precise moment of the save, including all edits that have been applied server-side at that instant; no partial or in-flight edits are included

**Category:** edge-case  
**Priority:** must-have

### AC-5: Version name is validated for length
**Given** the editor enters a name longer than 100 characters  
**When** the user attempts to save  
**Then** the system displays a validation error: "Version name must be 100 characters or fewer." and does not save the version until the name is corrected

**Category:** boundary  
**Priority:** must-have

### AC-6: Named versions are never auto-pruned
**Given** a named version was created more than 30 days ago  
**When** the auto-pruning job (VER-01) runs  
**Then** the named version is retained; it does not appear in the pruning candidate list

**Category:** boundary  
**Priority:** must-have

### AC-7: Duplicate version names are permitted
**Given** a named version with a given name already exists  
**When** the editor saves another version with the same name  
**Then** both versions are stored and remain accessible in the version history; no error is shown for duplicate names; versions are distinguished by their timestamp

**Category:** edge-case  
**Priority:** must-have

### AC-8: Save version is not available to Viewers or Commenters
**Given** an authenticated user with view-only or comment-only permission  
**When** the user looks at the document toolbar  
**Then** the "Save version" button is either hidden or disabled; if disabled, it displays a tooltip: "You need edit permission to save a version."

**Category:** boundary  
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** a request is made to the named version save endpoint  
**Then** the system returns 401 Unauthorized and no version is saved

**Category:** security  
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without edit permission  
**When** a request is made to the named version save endpoint (even if the toolbar button was bypassed)  
**Then** the system returns 403 Forbidden and no version is saved

**Category:** security  
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Save version request fails (server error) | User sees: "Failed to save version — please try again."; the document state is unchanged; a retry button is offered | must-have |
| Version name contains special characters | No restriction on special characters within the 100-character limit; names are stored and displayed verbatim (XSS-sanitized on display) | must-have |

### Performance
- **Save latency:** Named version must be confirmed as saved within 3 seconds at p95

### Security
- **Input validation:** Version name is sanitized before storage and display; HTML/script injection in the name field is rejected or escaped
- **Authorization:** Server validates edit permission on every named version save request

### Accessibility
- The "Save version" dialog must be keyboard-navigable; focus must be placed in the name input on open; Escape closes without saving; Enter submits

## Open Questions
- **OQ-1 (Unconfirmed assumption):** Is there a maximum number of named versions per document? Unlimited named versions at potentially large document sizes could create significant storage costs.
- **OQ-2 (Unconfirmed assumption):** Can a named version be renamed after creation? Not mentioned in scope; if it is expected, it must be added to this story or a follow-on.
- **OQ-3:** Mobile toolbar (G-17): the "Save version" button must be accessible on mobile if mobile editing is in scope.

---

# Acceptance Criteria: VER-03 — Version History Browser and Restore

## Refined Story Statement
As an editor, I want to browse the version history of a document and restore the document to any previous version, so that I can recover earlier states when edits go wrong.

## Assumptions
- All auto-snapshots (VER-01) and named versions (VER-02) appear in the version history list — **Confirmed**
- The list is ordered reverse-chronologically (most recent first) — **Confirmed**
- Clicking a version opens a read-only preview of that version's content — **Confirmed**
- Restore creates a new auto-snapshot of the current state before creating a new named version from the selected historical state — **Confirmed** (story scope; per stakeholder: restore does NOT overwrite)
- Restore makes the restored content the live document for all connected editors — **Confirmed**
- The preview is side-by-side or full-screen — both layouts are acceptable per the story — **Confirmed**
- Named vs. auto-snapshot entries are visually differentiated in the list — **Unconfirmed** → Open Questions
- Commenters and Viewers can browse version history but cannot restore — **Unconfirmed** → Open Questions

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-10 Version history restore behavior | Addressed — restore creates a new auto-snapshot of current state, then creates a new named version from the historical state; does NOT overwrite existing history | AC-6, AC-7 |
| G-4 Max document size | Addressed — version list pagination must be defined; large documents with many snapshots could produce long lists; placeholder: paginate at 50 entries per page | AC-2 |
| G-5 Existing permissions model | Addressed — restore is an edit-level action; view/browse is available to all roles with document access; permission check defined in AC-5 and AC-AUTH-2 | AC-5 |
| G-17 Mobile/responsive | Open Question — version history panel must render correctly on mobile if mobile editing is in scope | OQ-2 |
| G-1 CRDT/OT framework | Addressed — restoring a version means applying the historical CRDT document state as the new live state; the mechanism is framework-dependent but the behavior is defined here | AC-8 |
| G-15 Max concurrent editors | Addressed — restore propagates to all connected editors as a live update; up to 50 editors must receive the restored state | AC-8 |
| G-9 Offline duration limit | Addressed — a user who is offline when a restore occurs will receive the restored state as part of their reconnect merge (OFFL-02) | AC-9 |

## Acceptance Criteria

### AC-1: Version history panel lists all snapshots in reverse chronological order
**Given** a document has one or more auto-snapshots and/or named versions  
**When** the editor opens the version history panel  
**Then** all versions are listed with the most recent at the top; each entry shows the timestamp, version name (or "Auto-save" for unnamed auto-snapshots), and the display names of contributing editors for that version

**Category:** happy-path  
**Priority:** must-have

### AC-2: Version history panel paginates for documents with many entries
**Given** a document has more than 50 version entries  
**When** the version history panel is opened  
**Then** the first 50 entries are displayed; a "Load more" or pagination control allows the user to retrieve additional entries in reverse-chronological order

**Category:** edge-case  
**Priority:** must-have

### AC-3: Clicking a version opens a read-only preview
**Given** the user is browsing the version history panel  
**When** the user clicks on a version entry  
**Then** a read-only preview of that version's document content is displayed (side-by-side with current version or full-screen); no edits can be made in the preview; a clear "read-only preview" label is visible

**Category:** happy-path  
**Priority:** must-have

### AC-4: Preview cannot be edited
**Given** a historical version is displayed in preview mode  
**When** the user attempts to type, format, or otherwise modify the content in the preview  
**Then** no changes are accepted; the preview remains read-only; the live document is not affected by preview interactions

**Category:** boundary  
**Priority:** must-have

### AC-5: Only editors can initiate a restore
**Given** a user with view-only or comment-only permission is browsing version history  
**When** the user views the preview  
**Then** the "Restore this version" button is hidden or disabled; disabled state shows tooltip: "You need edit permission to restore a version."

**Category:** boundary  
**Priority:** must-have

### AC-6: Restore creates an auto-snapshot of the current state before restoring
**Given** an editor clicks "Restore this version"  
**When** the restore operation begins  
**Then** an auto-snapshot of the document's current (pre-restore) state is saved first, before any changes are applied; this snapshot preserves the pre-restore state for recovery if needed

**Category:** happy-path  
**Priority:** must-have

### AC-7: Restore creates a new named version from the selected historical state
**Given** the pre-restore snapshot has been saved (AC-6)  
**When** the restore continues  
**Then** a new named version is created from the selected historical state; the name defaults to "Restored from [original version name or timestamp]"; this new version becomes the live document; the original historical version entry remains in the history unchanged

**Category:** happy-path  
**Priority:** must-have

### AC-8: All connected editors see the restored state as a live update
**Given** multiple editors have the document open when a restore is executed  
**When** the restore completes  
**Then** all connected clients receive the restored document state as a CRDT update and converge to the same restored content within 500ms; no editor needs to reload the page

**Category:** happy-path  
**Priority:** must-have

### AC-9: Offline editors receive restored state on reconnection
**Given** an editor is offline when a restore occurs  
**When** the offline editor reconnects and completes the OFFL-02 merge  
**Then** the restored state is present in the server document; the offline editor's queued operations are merged against the restored state; the editor's final view reflects the restoration plus their offline edits

**Category:** edge-case  
**Priority:** must-have

### AC-10: Version history is unchanged after restore
**Given** a restore from version V has been completed  
**When** the user opens the version history panel  
**Then** version V still appears in the history at its original timestamp; the new pre-restore snapshot and the new restored named version appear as additional entries at the top; no historical entries are deleted or modified

**Category:** boundary  
**Priority:** must-have

### AC-11: Restore confirmation prompt before executing
**Given** the editor clicks "Restore this version"  
**When** the click is registered  
**Then** a confirmation dialog is shown: "Restoring this version will replace the current document with a saved snapshot. A backup of the current state will be saved. Restore anyway?" with "Restore" and "Cancel" buttons; the restore only proceeds on "Restore"

**Category:** error-handling  
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** a request is made to the version history list or restore endpoint  
**Then** the system returns 401 Unauthorized; no version data is returned

**Category:** security  
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without any document access role  
**When** a request is made to view version history  
**Then** the system returns 403 Forbidden; for users with view or comment access, history browsing is permitted but restore returns 403 Forbidden

**Category:** security  
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Pre-restore snapshot fails to save | Restore is aborted; user sees: "Could not save backup of current state. Restore cancelled to protect your document." | must-have |
| Restore operation fails mid-write | Document state is rolled back to the pre-restore state using the auto-snapshot taken in AC-6; user sees: "Restore failed — your document has been preserved as it was before the restore attempt." | must-have |
| Version history is empty | Panel shows: "No version history yet. Edits are automatically saved every 5 minutes of activity." | must-have |

### Performance
- **Version list load:** Version history panel loads (first 50 entries) within 2 seconds at p95
- **Preview load:** Read-only preview of a historical version renders within 3 seconds at p95
- **Restore latency:** Restore operation (including pre-restore snapshot + new named version creation + broadcast to connected editors) completes within 10 seconds at p95

### Security
- **Authorization:** Version history read requires at minimum view-level permission; restore requires edit-level permission, enforced server-side
- **Immutability:** Historical version entries cannot be deleted or modified through the version browser; only the auto-pruning job (VER-01) can remove entries, and only unnamed auto-snapshots past 30 days

### Accessibility
- Version history panel must be keyboard-navigable; each version entry must be focusable and activatable with Enter
- The confirmation dialog must trap focus while open; Escape must dismiss the dialog without restoring

## Open Questions
- **OQ-1 (Unconfirmed assumption):** Are named versions and auto-snapshots visually differentiated in the history list (e.g., different icon, label)? This affects the UI design and user understanding.
- **OQ-2:** Mobile history panel (G-17): the version history panel and preview must be usable on mobile if mobile editing is in scope; side-by-side preview layout is not viable on small screens.
- **OQ-3 (Unconfirmed assumption):** Can Viewers and Commenters browse version history? The story says "As an editor" but it is reasonable for other roles to at least view history. Access control for browse vs. restore must be decided.
- **OQ-4 (Unconfirmed assumption):** Can a named version be created during restore with a custom name (not the default "Restored from …")? If so, a name prompt should appear before the confirmation dialog.

---

## Coverage Summary
| # | Story Slug | AC Count | Auth AC | Gap Rows | Status |
|---|-----------|----------|---------|----------|--------|
| 1 | PRES-01 | 10 | Yes (AC-AUTH-1, AC-AUTH-2) | 7 | Complete |
| 2 | PRES-02 | 10 | Yes (AC-AUTH-1, AC-AUTH-2) | 6 | Complete |
| 3 | CONF-01 | 8 | Yes (AC-AUTH-1, AC-AUTH-2) | 5 | Complete |
| 4 | CONF-02 | 6 | Yes (AC-AUTH-1, AC-AUTH-2) | 5 | Complete |
| 5 | CONF-03 | 8 | Yes (AC-AUTH-1, AC-AUTH-2) | 6 | Complete |
| 6 | OFFL-01 | 9 | Yes (AC-AUTH-1, AC-AUTH-2) | 6 | Complete |
| 7 | OFFL-02 | 9 | Yes (AC-AUTH-1, AC-AUTH-2) | 7 | Complete |
| 8 | VER-01 | 9 | Yes (AC-AUTH-1, AC-AUTH-2) | 6 | Complete |
| 9 | VER-02 | 8 | Yes (AC-AUTH-1, AC-AUTH-2) | 5 | Complete |
| 10 | VER-03 | 11 | Yes (AC-AUTH-1, AC-AUTH-2) | 7 | Complete |
| **Total** | **10 stories** | **88 AC** | **All 10** | **60 gap rows** | |


<!-- STORY COUNT: 13 stories to process -->

# Acceptance Criteria: COMM-01 — Inline comments on text selections

## Refined Story Statement
As an editor or commenter, I want to add a comment to a selected region of text, so that I can ask questions or leave feedback anchored to specific content without modifying the document body.

## Assumptions
- Comments are stored as CRDT position anchors linked to character ranges — **Confirmed** (scope states this explicitly)
- Comments are plain text only (no rich text) in v1 — **Confirmed**
- Viewers cannot add comments — **Confirmed**
- Multiple comments can exist on overlapping or adjacent ranges — **Confirmed**
- Reference-based image storage is used (S3-style URL) — **Confirmed** (G-3 assumed)
- H1–H3 heading levels are supported — **Confirmed** (G-6 assumed)
- Notifications for new comments are out of scope for v1 — **Confirmed** (G-16 assumed out of scope)
- Mobile/responsive editing is not in scope for v1 — **Unconfirmed** (G-17 deferred)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-3: Image storage strategy | Out of Scope — COMM-01 does not deal with image attachments; file attachments in comments explicitly excluded | Scope: Out |
| G-6: Heading levels not specified | Out of Scope — heading levels affect EDIT-01, not comment anchoring | Scope: Out |
| G-9: Offline duration limit | Addressed — comment submission while offline queued and synced on reconnect | AC-8 |
| G-11: Comment resolution workflow | Out of Scope for COMM-01 — resolution handled in COMM-02 | Scope: Out |
| G-16: Notification model | Out of Scope — notifications handled in NOTIF-01; v1 excludes in-app badges | Scope: Out |
| G-17: Mobile/responsive support | Open Question — must be explicitly scoped or descoped for comment UI | Open Questions |

## Acceptance Criteria

### AC-1: Comment button appears on text selection
**Given** an authenticated user with can-comment or can-edit permission is viewing a document
**When** the user selects one or more characters of body text
**Then** a comment bubble/button appears adjacent to the selection (e.g., in the right margin or as a floating toolbar button)

**Category:** happy-path
**Priority:** must-have

### AC-2: Comment dialog opens and accepts input
**Given** the comment button is visible after a text selection
**When** the user clicks the comment button
**Then** a comment dialog opens containing a plain text input field, a "Submit" button, and a "Cancel" button

**Category:** happy-path
**Priority:** must-have

### AC-3: Comment is submitted and anchored to selection
**Given** the user has typed text in the comment dialog
**When** the user clicks "Submit"
**Then**
- The comment is saved and associated with the selected character range using CRDT position anchors
- The selected text receives a visual highlight (e.g., yellow underline) indicating an open comment thread
- The comment thread panel (right margin or sidebar) shows the new comment with: author display name, relative timestamp, and comment text
- The comment dialog closes

**Category:** happy-path
**Priority:** must-have

### AC-4: Comment thread visible to all permitted users
**Given** a comment thread exists on a document
**When** any user with view-or-above permission opens the document
**Then** the comment highlight on the text and the comment thread in the sidebar are visible to that user

**Category:** happy-path
**Priority:** must-have

### AC-5: Comment anchor drifts correctly as document is edited
**Given** a comment is anchored to character range [A, B]
**When** another user inserts or deletes text before position A
**Then** the comment anchor shifts with the text it was attached to, remaining correctly highlighted on the same words/characters

**Category:** edge-case
**Priority:** must-have

### AC-6: Multiple overlapping comments are rendered distinctly
**Given** two or more comments are anchored to overlapping or adjacent character ranges
**When** a user views the document
**Then** each comment's highlight is visible (possibly with layered or stacked visual treatment) and each thread is independently accessible in the sidebar

**Category:** edge-case
**Priority:** must-have

### AC-7: Empty comment submission is rejected
**Given** the comment dialog is open
**When** the user clicks "Submit" with an empty or whitespace-only input
**Then** the submission is blocked and an inline validation message reads "Comment cannot be empty"

**Category:** error-handling
**Priority:** must-have

### AC-8: Comment submitted offline is queued and synced on reconnect
**Given** the user has can-comment or above permission and is offline
**When** the user selects text and submits a comment
**Then**
- The comment is stored locally and shown optimistically in the UI with a "Pending sync" indicator
- Upon reconnect, the comment is synced to the server and the indicator is removed

**Category:** edge-case
**Priority:** should-have

### AC-9: Viewer cannot add a comment
**Given** an authenticated user with view-only permission is viewing a document
**When** the user selects text
**Then** no comment button or tooltip appears; if the user somehow triggers the comment flow, the server returns 403 and the UI displays "You have view-only access to this document"

**Category:** error-handling
**Priority:** must-have

### AC-10: Cancel discards in-progress comment
**Given** the comment dialog is open with text entered
**When** the user clicks "Cancel" or presses Escape
**Then** the dialog closes, no comment is saved, and the text selection highlight is removed

**Category:** edge-case
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the comment creation endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with view-only permission
**When** a POST request is made to the comment creation endpoint
**Then** the system returns 403 Forbidden with a message identifying the missing permission (e.g., "requires can-comment or can-edit")

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Server error on comment submit (5xx) | Display "Failed to save comment. Please try again." with a retry button | must-have |
| CRDT anchor resolution failure (anchor range no longer exists) | Comment thread preserved in sidebar but shown as "Anchor unavailable — original text was deleted" without a highlight | should-have |
| Comment text exceeds max length | Inline validation: "Comments cannot exceed 2,000 characters" (TBD limit — see Open Questions) | must-have |

### Performance
- **Response time:** Comment submission acknowledged (optimistic UI) within 100ms; server confirmation within 500ms p95
- **Scale:** Support ≥ 50 concurrent comment threads per document; performance target dependent on G-15 resolution

### Security
- **Input validation:** Comment text must be sanitized server-side; no HTML/script injection (stored as plain text, rendered escaped)
- **Authorization:** Permission check on every comment creation request server-side (not trust-client-only)

### Accessibility
- Comment button must be keyboard-accessible (Tab to reach, Enter to activate)
- Comment dialog must trap focus while open
- WCAG 2.1 AA: color is not the sole indicator of a comment highlight (pattern or underline supplement required)

## Open Questions
- G-17: Is mobile/responsive support in scope for comment authoring? Rich text selection on mobile requires specific UX treatment (long-press, selection handles). Must be explicitly scoped or descoped before implementation.
- What is the maximum character length for a single comment? (Assumed 2,000 above but needs product confirmation.)

---

# Acceptance Criteria: COMM-02 — Comment replies and resolution

## Refined Story Statement
As an editor or commenter, I want to reply to comments and mark them as resolved when the discussion is complete, so that comment threads have a clear lifecycle and the document doesn't accumulate stale open threads.

## Assumptions
- Any user with comment-or-above permission can reply — **Confirmed**
- Any user with view-or-above can read threads — **Confirmed**
- Any editor (can-edit) or the original comment author can resolve — **Confirmed** (G-11 assumed)
- Resolved threads are archived, not deleted — **Confirmed** (G-11 assumed)
- Resolved threads are hidden by default but accessible via "Show resolved" toggle — **Confirmed**
- Resolved threads lose in-document anchor highlight — **Confirmed**
- Re-opening resolved threads is not supported (use new comment) — **Confirmed**
- Deleting comments is not supported (permanent audit trail) — **Confirmed**
- Notifications for resolutions are out of scope for v1 — **Confirmed** (G-16 assumed)
- Mobile/responsive support not confirmed for v1 — **Unconfirmed** (G-17 deferred)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-11: Comment resolution workflow — who resolves, what happens to resolved | Addressed: any editor or original author can resolve; resolved threads archived, visible via toggle, anchor removed | AC-4, AC-5, AC-6 |
| G-16: Notification model | Out of Scope — resolution notifications not in v1 | Scope: Out |
| G-17: Mobile/responsive support | Open Question — reply/resolve UI on mobile not scoped | Open Questions |

## Acceptance Criteria

### AC-1: Reply to an existing comment thread
**Given** a comment thread exists and the user has can-comment or can-edit permission
**When** the user clicks "Reply" on a thread and submits plain text
**Then**
- The reply is appended to the thread chronologically
- The reply shows author display name and relative timestamp
- The reply is visible to all users with view-or-above permission

**Category:** happy-path
**Priority:** must-have

### AC-2: View-only users can read full threads but not reply
**Given** a user with view-only permission opens a document with comment threads
**When** the user views the comments sidebar
**Then** all thread content (original comment + all replies) is readable but no "Reply" input or button is available

**Category:** happy-path
**Priority:** must-have

### AC-3: Editor can resolve a comment thread
**Given** a user with can-edit permission views an open comment thread
**When** the user clicks "Resolve"
**Then**
- The thread is marked as resolved with the resolver's display name and timestamp
- The in-document anchor highlight on the text is removed
- The thread moves out of the active sidebar view
- The document body looks clean (no dangling highlight)

**Category:** happy-path
**Priority:** must-have

### AC-4: Original comment author can resolve their own thread
**Given** a user who authored the root comment of a thread (regardless of their permission level, minimum can-comment)
**When** the user clicks "Resolve" on their own thread
**Then** the same resolution behavior as AC-3 occurs

**Category:** edge-case
**Priority:** must-have

### AC-5: Resolved threads are visible via "Show resolved" toggle
**Given** one or more threads have been resolved
**When** the user activates the "Show resolved" toggle in the comments sidebar
**Then** all resolved threads are displayed, each showing the full conversation, the resolver's name, and resolution timestamp

**Category:** happy-path
**Priority:** must-have

### AC-6: Resolved threads remain archived and immutable
**Given** a resolved thread is visible via "Show resolved"
**When** any user views it
**Then**
- The thread content is read-only (no reply input available on resolved threads)
- There is no "Re-open" button
- Thread content is fully preserved (no deletion)

**Category:** edge-case
**Priority:** must-have

### AC-7: Commenter cannot resolve another user's thread
**Given** a user with can-comment permission (but not can-edit) did not author the root comment
**When** the user views the comment thread
**Then** no "Resolve" button is visible; if they attempt to resolve via API, the server returns 403

**Category:** error-handling
**Priority:** must-have

### AC-8: Empty reply is rejected
**Given** the user has clicked "Reply" and the reply input is open
**When** the user submits with an empty or whitespace-only input
**Then** submission is blocked and the UI shows "Reply cannot be empty"

**Category:** error-handling
**Priority:** must-have

### AC-9: Resolution of thread anchored to deleted text
**Given** a comment thread was anchored to a text range that has since been deleted by another user
**When** an authorized user resolves the thread
**Then** resolution succeeds; the thread is archived; no error is thrown due to the missing anchor

**Category:** edge-case
**Priority:** should-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the reply or resolve endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with view-only permission
**When** a POST request is made to the reply creation endpoint
**Then** the system returns 403 Forbidden with a message indicating "requires can-comment or can-edit"

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Server error on reply submit (5xx) | "Failed to save reply. Please try again." with retry button | must-have |
| Server error on resolve (5xx) | "Failed to resolve thread. Please try again." Thread stays open | must-have |
| Concurrent resolution (two users resolve simultaneously) | Last-writer-wins; both see resolved state; no duplicate resolution records | should-have |

### Performance
- **Response time:** Reply submission and resolution acknowledged within 500ms p95
- **Scale:** Threads with up to 100 replies must render without pagination in v1; beyond that, load-more pattern

### Security
- **Input validation:** Reply text sanitized server-side; stored as plain text, rendered escaped
- **Authorization:** Resolution authorization checked server-side on every request (author-of-root-comment OR can-edit)

### Accessibility
- WCAG 2.1 AA: "Show resolved" toggle must be keyboard accessible
- Resolved state must be conveyed via text label, not color alone

## Open Questions
- G-17: Is the reply/resolve UI required to work on mobile in v1?

---

# Acceptance Criteria: COMM-03 — Suggestion mode (track-changes submission)

## Refined Story Statement
As a commenter or editor, I want to submit edits as suggestions rather than direct changes, so that my proposed modifications are visible to editors for review before being accepted into the document.

## Assumptions
- Both editors and commenters can submit suggestions — **Confirmed**
- Insertions shown as green underlined text, deletions as red strikethrough — **Confirmed**
- Suggestions stored as pending CRDT operations, not applied to base document state — **Confirmed**
- Suggestions visible to all users with view-or-above permission — **Confirmed**
- Suggestion mode limited to plain text and inline formatting (not tables, code blocks) in v1 — **Confirmed**
- Acceptance/rejection handled in COMM-04 — **Confirmed**
- Mobile/responsive support not confirmed — **Unconfirmed** (G-17 deferred)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: CRDT/OT framework choice | Out of Scope for AC — suggestions stored as pending CRDT ops; specific framework is implementation detail resolved in tech spike | Open Questions (spike dependency) |
| G-7: LWW conflict resolution unit | Addressed — suggestions are pending ops, not direct edits; LWW applies to accepted suggestions only (COMM-04 dependency). No direct impact on COMM-03 AC | Out of Scope for this story |
| G-12: Suggestion acceptance/rejection ownership | Out of Scope for COMM-03 — handled in COMM-04; noted as Open Question dependency | Open Questions |
| G-17: Mobile/responsive support | Open Question — suggestion mode toolbar toggle and visual diffs on mobile not scoped | Open Questions |

## Acceptance Criteria

### AC-1: Toggle suggestion mode on
**Given** an authenticated user with can-comment or can-edit permission is editing a document
**When** the user clicks the "Suggestion mode" toggle in the toolbar
**Then**
- The toolbar shows a visual indicator that suggestion mode is active (e.g., toggle highlighted, label changes to "Suggesting")
- Subsequent typing does not modify the base document state directly

**Category:** happy-path
**Priority:** must-have

### AC-2: Insertion rendered as green underlined text
**Given** suggestion mode is active
**When** the user types new characters
**Then** the inserted characters appear as green underlined text attributed to the current user, without modifying the base document content

**Category:** happy-path
**Priority:** must-have

### AC-3: Deletion rendered as red strikethrough text
**Given** suggestion mode is active
**When** the user deletes characters (Backspace, Delete, or selection-delete)
**Then** the deleted characters remain visible as red strikethrough text attributed to the current user, without removing them from the base document state

**Category:** happy-path
**Priority:** must-have

### AC-4: Suggestion attribution is displayed
**Given** a suggestion exists in the document
**When** a user hovers or taps on the suggestion
**Then** a tooltip or sidebar entry shows: the suggesting user's display name and the timestamp of the suggestion

**Category:** happy-path
**Priority:** must-have

### AC-5: Suggestions visible to all view-or-above users
**Given** one or more suggestions exist in the document
**When** any user with view-or-above permission opens the document
**Then** all pending suggestions are visible with their green/red visual treatment and attribution

**Category:** happy-path
**Priority:** must-have

### AC-6: Toggle suggestion mode off returns to direct editing (editors only)
**Given** an editor (can-edit) has suggestion mode active
**When** the user toggles suggestion mode off
**Then**
- The toolbar returns to normal editing state
- Subsequent keystrokes directly modify the document body (not suggestions)
- Existing pending suggestions remain visible until accepted/rejected

**Category:** edge-case
**Priority:** must-have

### AC-7: Commenter cannot toggle out of suggestion mode to direct edit
**Given** a user with can-comment permission has the editor open
**When** the user attempts to toggle suggestion mode off to enter direct editing mode
**Then** the toggle is disabled or not available; the user remains in suggestion mode; attempting direct edit via API returns 403

**Category:** edge-case
**Priority:** must-have

### AC-8: Suggestion mode does not apply to tables or code blocks
**Given** suggestion mode is active
**When** the user attempts to edit content inside a table cell or code block
**Then** the edit is blocked and the UI displays "Suggestion mode is not supported for tables and code blocks in v1"

**Category:** boundary
**Priority:** must-have

### AC-9: Multiple suggestions from different users are visually distinct
**Given** two users submit overlapping suggestions in suggestion mode
**When** a viewer looks at the document
**Then** each suggestion is attributed to its respective author (different color shades or labels per user) so viewers can distinguish whose suggestion is whose

**Category:** edge-case
**Priority:** should-have

### AC-10: Suggestion persists across reconnect
**Given** a user submits a suggestion while online
**When** the user disconnects and reconnects
**Then** the suggestion remains in the document in pending state with correct attribution

**Category:** edge-case
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to submit a suggestion operation
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with view-only permission
**When** a request is made to submit a suggestion operation
**Then** the system returns 403 Forbidden with message "requires can-comment or can-edit"

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Server rejects suggestion operation (5xx) | Suggestion shown as "Failed to sync" in UI; retry automatically on reconnect | must-have |
| User attempts suggestion on unsupported content type (table/code block) | Clear inline message; no partial suggestion created | must-have |

### Performance
- **Response time:** Suggestion keystrokes render in the local UI within 50ms (local optimistic); sync to other clients within 500ms p95
- **Scale:** Documents with up to 500 pending suggestions must render without performance degradation (dependent on G-4 resolution)

### Security
- **Input validation:** Suggestion content sanitized server-side; stored as pending CRDT operation, not raw HTML
- **Authorization:** Suggestion submission verified server-side; can-comment minimum enforced per operation

### Accessibility
- Suggestion mode toggle must be keyboard-accessible
- Color alone must not distinguish insertion from deletion — underline (insertion) and strikethrough (deletion) provide non-color distinction
- WCAG 2.1 AA

## Open Questions
- G-12: Who can accept/reject suggestions (any editor, or only document owner)? This directly gates COMM-04 and is a product decision required before COMM-04 AC can be finalized.
- G-17: Is suggestion mode required to work on mobile in v1?
- G-1: Which CRDT framework is used? The pending-operation model for suggestions must align with the chosen framework's capability.

---

# Acceptance Criteria: COMM-04 — Suggestion acceptance and rejection

## Refined Story Statement
As an editor, I want to accept or reject individual suggestions made in suggestion mode, so that I can incorporate or discard proposed changes while keeping the final editorial decision with editors.

## Assumptions
- Only users with can-edit permission can accept or reject suggestions — **Confirmed**
- Accepting a suggestion applies the CRDT operation to the document body — **Confirmed**
- Rejecting a suggestion discards the pending operation and reverts appearance — **Confirmed**
- Suggestion submitters can see outcomes but cannot accept/reject unless they have editor permission — **Confirmed**
- Accepted/rejected suggestions are archived with outcome, acting editor, and timestamp — **Confirmed**
- Bulk accept/reject is not in scope for v1 — **Confirmed**
- Notification of acceptance/rejection is out of scope for v1 (tied to NOTIF-01 email-only scope) — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-12: Suggestion acceptance/rejection ownership | Addressed — only can-edit users can accept/reject; commenter cannot even if they authored the suggestion | AC-1, AC-3, AC-7 |
| G-7: LWW conflict resolution unit | Out of Scope — LWW applies to real-time concurrent edits (SYNC story), not to suggestion accept/reject which is a deliberate action | Scope: Out |
| G-8: Undo across concurrent edits | Open Question — can an editor undo an accepted suggestion? Undo semantics post-acceptance not specified | Open Questions |
| G-16: Notification model | Out of Scope — notifying suggestion submitters of acceptance/rejection deferred to post-v1 | Scope: Out |

## Acceptance Criteria

### AC-1: Accept button visible to editors on each pending suggestion
**Given** one or more pending suggestions exist in the document
**When** a user with can-edit permission views the document
**Then** each suggestion has an "Accept" button and a "Reject" button visible in the suggestion tooltip or sidebar panel

**Category:** happy-path
**Priority:** must-have

### AC-2: Accepting a suggestion applies it to the document body
**Given** a user with can-edit permission clicks "Accept" on a pending suggestion
**When** the action is confirmed
**Then**
- The suggested insertion or deletion is applied to the document body as a direct edit
- The green/red suggestion styling is removed; text appears as normal document content
- The accepted suggestion is archived with: outcome="accepted", acting editor's display name, timestamp
- All other connected users see the document update in real time

**Category:** happy-path
**Priority:** must-have

### AC-3: Rejecting a suggestion reverts the text
**Given** a user with can-edit permission clicks "Reject" on a pending suggestion
**When** the action is confirmed
**Then**
- Any suggested insertion is removed from the document
- Any suggested deletion is restored to the document (text reappears as normal)
- The suggestion styling is removed
- The rejected suggestion is archived with: outcome="rejected", acting editor's display name, timestamp
- All other connected users see the document update in real time

**Category:** happy-path
**Priority:** must-have

### AC-4: Archived accepted/rejected suggestions are accessible
**Given** suggestions have been accepted or rejected
**When** an editor opens the suggestion history panel (location TBD — e.g., "Show resolved suggestions" toggle)
**Then** all archived suggestions are listed with: original text diff, submitter name, submission timestamp, outcome (accepted/rejected), acting editor name, action timestamp

**Category:** happy-path
**Priority:** should-have

### AC-5: Suggestion submitter sees outcome but cannot act on it
**Given** a user who submitted a suggestion has can-comment (but not can-edit) permission
**When** an editor accepts or rejects that suggestion
**Then**
- The submitter sees the suggestion styling change (accepted: text becomes normal; rejected: suggestion disappears)
- No Accept/Reject buttons are visible to the submitter
- No in-app notification is sent in v1

**Category:** edge-case
**Priority:** must-have

### AC-6: Accept/reject on a suggestion whose base text was subsequently modified
**Given** a pending suggestion exists on range [A, B] and another editor has since directly edited the same range
**When** an editor attempts to accept the original suggestion
**Then** the system detects the conflict, shows a "This suggestion conflicts with a recent edit — review manually" warning, and does not auto-apply; the suggestion remains pending for manual resolution

**Category:** edge-case
**Priority:** must-have

### AC-7: Non-editor cannot accept or reject suggestions
**Given** a user with can-comment or view-only permission
**When** they attempt to accept or reject a suggestion (via UI or API)
**Then** the Accept/Reject buttons are not rendered in the UI; any direct API call returns 403 Forbidden

**Category:** error-handling
**Priority:** must-have

### AC-8: Concurrent acceptance by two editors
**Given** two editors simultaneously click "Accept" on the same suggestion
**When** both requests reach the server
**Then** the operation is applied exactly once; both editors see the accepted state; the second accept is a no-op with no error shown to the user

**Category:** edge-case
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the accept or reject endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with can-comment or view-only permission
**When** a POST request is made to the accept or reject endpoint
**Then** the system returns 403 Forbidden with message "requires can-edit"

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Server error on accept (5xx) | "Failed to accept suggestion. Please try again." Suggestion stays pending | must-have |
| Server error on reject (5xx) | "Failed to reject suggestion. Please try again." Suggestion stays pending | must-have |
| Suggestion already accepted/rejected by another editor | UI refreshes to show current state; no duplicate archive record created | must-have |

### Performance
- **Response time:** Accept/reject operation reflected in UI within 500ms p95 for the acting editor; propagated to other clients within 500ms
- **Scale:** Accepting one suggestion in a document with 200 pending suggestions must complete without full document re-render

### Security
- **Authorization:** Accept/reject checked server-side on every request; can-edit enforced; not trust-client
- **Audit trail:** Every accept/reject creates an immutable archive record (no delete)

### Accessibility
- Accept and Reject buttons must be keyboard-navigable and labeled with context ("Accept suggestion by [Author]")
- WCAG 2.1 AA

## Open Questions
- G-8: Can an editor undo an accepted suggestion after the fact? If undo triggers a re-revert, this intersects with conflict resolution (G-7, G-8) and must be specified before implementation.
- G-12 (resolved above): Confirmed — only can-edit users can accept/reject. If product changes this decision, AC-1, AC-3, AC-7, AC-AUTH-2 must be revised.

---

# Acceptance Criteria: NOTIF-01 — @-mention email notifications

## Refined Story Statement
As a commenter or editor, I want to receive an email when someone @-mentions me in a comment or when someone comments on a document I created, so that I don't miss feedback that requires my attention.

## Assumptions
- @-mention syntax is `@username` in comment text — **Confirmed**
- Emails sent via SendGrid (existing integration per stakeholder) — **Confirmed**
- Emails are batched/digested within a 5-minute window — **Confirmed**
- Document creator receives email when any new comment thread is created on their document — **Confirmed**
- Email includes: document title, comment text, commenter name, deep link to anchored comment — **Confirmed**
- Per-document email opt-out is available — **Confirmed**
- In-app notification badges are out of scope for v1 — **Confirmed** (G-16: assumed out of scope)
- Slack/Teams/mobile push are out of scope — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-16: Notification model | Addressed — NOTIF-01 is the v1 notification scope: email only, @-mentions and new-comment-on-owned-doc; in-app badges explicitly out of scope | AC-1 through AC-9 |
| G-5: Existing permissions model | Out of Scope — NOTIF-01 sends to mentioned/owning users; does not modify ACLs; depends on PERM-02 for permission checks on commenters | Scope: Out |
| G-17: Mobile/responsive support | Out of Scope — notifications are email; no mobile push in scope | Scope: Out |

## Acceptance Criteria

### AC-1: @-mention triggers email to mentioned user
**Given** a user submits a comment containing `@username` where `username` is a valid user in the workspace
**When** the comment is saved
**Then**
- An email notification is queued for the mentioned user within the 5-minute digest window
- The email contains: document title, the full comment text, the commenter's display name, and a deep link URL to the document scrolled to the anchored comment thread

**Category:** happy-path
**Priority:** must-have

### AC-2: Email digest batches multiple mentions within 5-minute window
**Given** the same user is @-mentioned in 3 separate comments within 5 minutes
**When** the 5-minute digest window closes
**Then** the mentioned user receives exactly 1 email summarizing all 3 mentions (not 3 separate emails)

**Category:** edge-case
**Priority:** must-have

### AC-3: Document creator notified of new comment thread
**Given** a user with can-comment or can-edit permission creates a new comment thread on a document
**When** the comment is saved
**Then** the document creator receives an email notification (within the 5-minute digest) if they did not opt out, containing: document title, comment text, commenter name, deep link

**Category:** happy-path
**Priority:** must-have

### AC-4: Commenter does not receive notification for their own comment
**Given** a user creates a comment that @-mentions themselves, or comments on their own document
**When** the notification is processed
**Then** no email is sent to the commenter for their own action

**Category:** edge-case
**Priority:** must-have

### AC-5: Per-document opt-out prevents email notifications
**Given** a user has opted out of email notifications for a specific document in document settings
**When** that user is @-mentioned or is the document creator receiving a new comment notification
**Then** no email is sent to that user for that document

**Category:** edge-case
**Priority:** must-have

### AC-6: @-mention of non-existent username is handled gracefully
**Given** a user types `@unknownuser` in a comment where `unknownuser` does not exist in the workspace
**When** the comment is saved
**Then**
- The comment is saved normally
- No email notification is sent
- The `@unknownuser` text appears as plain text in the comment (no user link)
- No error is shown to the commenter

**Category:** error-handling
**Priority:** must-have

### AC-7: @-mention of a user without document access
**Given** a user is @-mentioned in a comment but does not have view-or-above permission on the document
**When** the notification is processed
**Then** no email is sent to the mentioned user (do not leak document existence to unauthorized users)

**Category:** security
**Priority:** must-have

### AC-8: Deep link in email navigates to the correct comment anchor
**Given** a notification email has been sent with a deep link
**When** the recipient clicks the deep link
**Then**
- If the recipient has view-or-above permission, the document opens and scrolls to the relevant comment thread
- If the recipient does not have permission, they are shown a permission-denied page (not the document content)

**Category:** edge-case
**Priority:** must-have

### AC-9: SendGrid delivery failure is handled
**Given** SendGrid returns a delivery error (4xx or 5xx)
**When** the notification system attempts to send
**Then**
- The error is logged with the notification details
- The system retries up to 3 times with exponential backoff (1s, 2s, 4s)
- If all retries fail, the failure is recorded but no user-facing error is shown (silent fail for v1)

**Category:** error-handling
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the notification opt-out settings endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user attempts to modify notification settings for a document they do not have view-or-above access to
**When** a PATCH request is made to the notification opt-out endpoint
**Then** the system returns 403 Forbidden

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| SendGrid unavailable | Retry 3x with exponential backoff; log failure; silent fail to user | must-have |
| @-mention of user with no registered email | Skip notification for that user; log; no error surfaced | must-have |
| Digest job crashes mid-batch | Remaining notifications in batch are retried on next job run (idempotent delivery) | should-have |

### Performance
- **Latency:** Emails dispatched within the 5-minute digest window; target < 6 minutes total from comment submission to email delivery
- **Scale:** System must handle 100 notifications/minute without queueing degradation

### Security
- **Permission check:** Never send email to users who lack view-or-above access to the document (prevents document existence leakage)
- **Deep link tokens:** Deep links must not expose document content to unauthenticated recipients; access is enforced at document open time

### Accessibility
- Email HTML must be accessible: semantic structure, alt text on any images, sufficient color contrast

## Open Questions
- None — all gaps resolved. G-16 is addressed by this story's explicit scope. In-app badges and other channels confirmed out of scope for v1.

---

# Acceptance Criteria: PERM-01 — Per-document permission management via Share UI

## Refined Story Statement
As an admin or document creator, I want to assign view, comment, or edit permissions to individual users on a document, so that I can control who can read, annotate, or modify the document using a familiar interface.

## Assumptions
- Share UI follows the same UX pattern as project boards (existing component per stakeholder) — **Confirmed**
- User search is by name or email within the organization — **Confirmed**
- Permission levels: View, Comment, Edit — **Confirmed**
- Document creator always retains Edit permission (cannot be downgraded or removed) — **Confirmed**
- Permission changes take effect immediately; existing WebSocket sessions are re-validated on next operation — **Confirmed**
- The existing resource-based ACL system is the integration target — **Confirmed** (but G-5 means its internals are not yet audited)
- Group/role-based permissions are out of scope for v1 — **Confirmed**
- The existing permissions model integration path requires an audit (G-5) — **Unconfirmed** (Deferred)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-5: Integration with existing permissions model | Open Question — the existing ACL system must be audited before PERM-01 can be fully implemented; AC written assuming a compatible ACL exists | Open Questions |
| G-15: Maximum concurrent editors | Out of Scope for PERM-01 — concurrent editor limits are a WebSocket/infrastructure concern, not a permissions management concern | Scope: Out |
| G-17: Mobile/responsive support | Open Question — Share UI on mobile not specified | Open Questions |

## Acceptance Criteria

### AC-1: Open Share UI from document
**Given** a user with can-edit permission is viewing a document
**When** the user clicks the "Share" button
**Then** the Share UI dialog opens, showing the current list of users with their permission levels for this document

**Category:** happy-path
**Priority:** must-have

### AC-2: Search for a user by name or email
**Given** the Share UI is open
**When** the admin or editor types a name or email in the user search field
**Then** matching users within the organization are shown in a dropdown, with display name and email address visible

**Category:** happy-path
**Priority:** must-have

### AC-3: Assign a permission level to a user
**Given** a user has been found via search in the Share UI
**When** the admin or editor selects a permission level (View, Comment, or Edit) and clicks "Share" or "Confirm"
**Then**
- The user is added to the document's permission list at the selected level
- The change takes effect immediately (next operation by that user is validated against the new permission)
- The Share UI list updates to reflect the new entry

**Category:** happy-path
**Priority:** must-have

### AC-4: Change an existing user's permission level
**Given** a user already has a permission on the document
**When** the admin or editor changes their permission level via the Share UI dropdown
**Then** the permission is updated immediately; the user's existing WebSocket session is re-validated on their next operation

**Category:** happy-path
**Priority:** must-have

### AC-5: Remove a user's access
**Given** a user has a permission entry on the document
**When** the admin or editor clicks "Remove" next to that user's entry
**Then** the user's permission is revoked; they can no longer access the document; their next operation is rejected with 403

**Category:** happy-path
**Priority:** must-have

### AC-6: Document creator's Edit permission cannot be removed
**Given** the document creator is listed in the Share UI with Edit permission
**When** an admin attempts to remove or downgrade the creator's permission
**Then** the action is blocked; the UI shows "Document creator's access cannot be removed"

**Category:** error-handling
**Priority:** must-have

### AC-7: Permission list visible only to users with Edit access
**Given** a user with View or Comment permission opens the document
**When** the user looks for the Share button
**Then** the Share button is not displayed (or is visible but opens a read-only view of "who has access" without edit controls — product decision required; see Open Questions)

**Category:** edge-case
**Priority:** must-have

### AC-8: Search returns no results for unknown user
**Given** the Share UI search field contains text that matches no user in the organization
**When** the search executes
**Then** the dropdown shows "No users found" and no action is possible

**Category:** error-handling
**Priority:** must-have

### AC-9: Permission change propagates to active session on next operation
**Given** a user is actively editing a document with can-edit permission
**When** an admin downgrades their permission to View
**Then**
- The user's current session is not immediately interrupted
- On their next write operation, the server rejects the operation with 403
- The editor UI shows "Your access level has changed — you now have view-only access"

**Category:** edge-case
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the document permissions endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with can-comment or view-only permission
**When** a request is made to modify document permissions
**Then** the system returns 403 Forbidden with message "requires can-edit"

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| ACL system returns error on permission write | Share UI shows "Failed to update permissions. Please try again." No partial update | must-have |
| User to be shared with has been deactivated | Search results exclude deactivated users; if a deactivated user already has access, their entry is shown with a "Deactivated" label | should-have |

### Performance
- **Response time:** Permission assignment confirmed within 500ms p95
- **Search:** User search results returned within 300ms p95 for organizations up to 10,000 users

### Security
- **Authorization:** All permission modifications validated server-side against the document ACL; not trust-client
- **Audit log:** Every permission change (add, modify, remove) is recorded with: acting user, target user, new permission level, timestamp

### Accessibility
- Share UI must be keyboard navigable
- Permission dropdowns must have accessible labels
- WCAG 2.1 AA

## Open Questions
- G-5: The existing permissions model must be audited to confirm that document-level ACL entries can be added without schema changes or a new authorization layer. This is a blocker for implementation.
- Should users with View/Comment permission see a read-only "who has access" list, or is the Share button hidden entirely for them? Product decision required.
- G-17: Is the Share UI required to be responsive/functional on mobile in v1?

---

# Acceptance Criteria: PERM-02 — Permission enforcement in the editor

## Refined Story Statement
As a viewer, commenter, or editor, I want the editor to enforce my permission level consistently — showing me what I can do and preventing what I can't — so that access controls are reliable and I don't accidentally mutate content I shouldn't.

## Assumptions
- View-only: read-only mode, no toolbar, content selectable for reading — **Confirmed**
- Can-comment: comment-only toolbar; suggestion mode available; no body text editing — **Confirmed**
- Can-edit: full editor toolbar — **Confirmed**
- Permission checked at: document load, WebSocket join, and each write operation server-side — **Confirmed**
- Real-time permission change propagation within an active session is not supported in v1 — **Confirmed** (re-validation on reconnect)
- Attempting a disallowed action shows "You have view-only access to this document" — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-5: Existing permissions model | Open Question — enforcement layer must integrate with the existing ACL; until G-5 audit is complete, the exact API for server-side permission lookups is unknown | Open Questions |
| G-15: Maximum concurrent editors | Out of Scope for PERM-02 — concurrent editor limits are a WebSocket capacity concern, not a permissions enforcement concern | Scope: Out |
| G-17: Mobile/responsive support | Open Question — read-only and comment-only modes on mobile not specified | Open Questions |

## Acceptance Criteria

### AC-1: View-only user sees read-only editor
**Given** an authenticated user with view-only permission opens a document
**When** the document loads
**Then**
- The editor renders in read-only mode
- No editing toolbar is present
- Document text is selectable (for copy/paste) but not editable
- No cursor blink or edit affordances are visible

**Category:** happy-path
**Priority:** must-have

### AC-2: Can-comment user sees comment-only controls
**Given** an authenticated user with can-comment permission opens a document
**When** the document loads
**Then**
- The toolbar is replaced with comment-only controls (comment button, suggestion mode toggle)
- No bold/italic/heading/list/etc. editing controls are available
- Body text is not directly editable via keyboard

**Category:** happy-path
**Priority:** must-have

### AC-3: Can-edit user sees full toolbar
**Given** an authenticated user with can-edit permission opens a document
**When** the document loads
**Then** the full editing toolbar is present and all editing actions are available

**Category:** happy-path
**Priority:** must-have

### AC-4: Server rejects write from view-only user
**Given** a user with view-only permission
**When** a write operation is submitted to the server (whether via UI or direct API call)
**Then** the server returns 403 Forbidden and the operation is not applied to the document

**Category:** security
**Priority:** must-have

### AC-5: Server rejects body-text edit from can-comment user
**Given** a user with can-comment permission
**When** a direct body-text edit operation (not a suggestion or comment) is submitted to the server
**Then** the server returns 403 Forbidden; the UI displays "You have comment-only access to this document"

**Category:** security
**Priority:** must-have

### AC-6: Attempting disallowed action shows clear message
**Given** a user with view-only or can-comment permission
**When** they attempt an action outside their permission level (e.g., clicking in the document body to edit)
**Then** a non-blocking message appears: "You have [view-only / comment-only] access to this document"

**Category:** error-handling
**Priority:** must-have

### AC-7: Permission re-checked at document load
**Given** a user's permission has been changed while they were not viewing the document
**When** the user opens the document
**Then** the editor loads with controls matching the current permission level (not a cached prior level)

**Category:** edge-case
**Priority:** must-have

### AC-8: Permission re-checked at WebSocket join
**Given** a user reconnects to a document's WebSocket session after being offline
**When** the WebSocket connection is re-established
**Then** the server re-validates the user's permission; if downgraded, the editor transitions to the appropriate mode

**Category:** edge-case
**Priority:** must-have

### AC-9: Permission re-checked on each server-side write operation
**Given** a user has an active editing session
**When** any write operation is submitted
**Then** the server checks the current permission from the ACL before applying the operation (defense in depth — not trust-client)

**Category:** security
**Priority:** must-have

### AC-10: Public link viewer cannot edit or comment
**Given** a user accessing the document via a public read-only link (PERM-03)
**When** the document loads
**Then** the editor renders in read-only mode identical to view-only permission; no commenting or suggestion controls are available

**Category:** edge-case
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present and no valid public link token
**When** a request is made to load or write to the document
**Then** the system returns 401 Unauthorized and the user is redirected to login

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without any document permission attempts to open the document
**When** the document load request is made
**Then** the system returns 403 Forbidden with "You don't have access to this document"

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| ACL lookup fails at document load (server error) | "Unable to load document permissions. Please refresh." Document does not render | must-have |
| WebSocket join permission check fails | Connection refused; user shown "Unable to join editing session" with a reload option | must-have |

### Performance
- **Response time:** Permission check adds < 50ms overhead to document load (cached ACL lookup)
- **Write operation overhead:** Server-side permission check per write must not add > 20ms latency per operation

### Security
- **Defense in depth:** UI restrictions are UX only; all write operations validated server-side independently
- **No permission caching beyond session:** Session uses permission at join time; reconnect forces re-validation

### Accessibility
- Read-only mode must be communicated to screen readers (e.g., `aria-readonly="true"` on editor container)
- WCAG 2.1 AA

## Open Questions
- G-5: The server-side permission lookup mechanism depends on the existing ACL system audit. Until complete, the exact integration point for permission checks is unknown.
- G-17: Are read-only and comment-only editor modes required to be responsive on mobile in v1?

---

# Acceptance Criteria: PERM-03 — Public read-only share links

## Refined Story Statement
As an editor, I want to generate a public link that allows anyone (without logging in) to view a document, so that I can share documents with external clients or stakeholders who don't have accounts in our system.

## Assumptions
- Public links generate a unique, opaque URL token — **Confirmed**
- Anyone with the URL can view in read-only mode without authenticating — **Confirmed**
- Public link access is logged (URL accessed, timestamp, IP) — **Confirmed**
- Link can be revoked by an editor, invalidating the token — **Confirmed**
- Public viewers do not appear in the presence list — **Confirmed**
- Public viewers cannot comment, suggest, or export — **Confirmed**
- Password-protected links and link expiration are out of scope for v1 — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-5: Existing permissions model | Open Question — public link access must bypass normal authentication without leaking non-public documents; the existing ACL must support a "public token" access class | Open Questions |
| G-13: Export permissions | Addressed — public viewers explicitly cannot export | AC-5 |
| G-17: Mobile/responsive support | Open Question — public read-only view on mobile not specified | Open Questions |
| G-18: Document deletion mid-session | Addressed — if the document is deleted, public link returns 404 and any active public viewer session is terminated | AC-9 |

## Acceptance Criteria

### AC-1: Editor can generate a public link
**Given** a user with can-edit permission opens the Share UI
**When** the user clicks "Get public link"
**Then**
- A unique, opaque URL token is generated and stored against the document
- The Share UI displays the full public URL (with copy-to-clipboard button)
- Only one active public link per document in v1 (generating a new one revokes the old one)

**Category:** happy-path
**Priority:** must-have

### AC-2: Public link grants read-only view without authentication
**Given** a public link has been generated for a document
**When** any person (including unauthenticated browsers) navigates to the public link URL
**Then**
- The document renders in read-only mode
- No login prompt is shown
- No editing toolbar, comment controls, or export options are visible

**Category:** happy-path
**Priority:** must-have

### AC-3: Public link access is logged
**Given** a user accesses a document via public link
**When** the page loads
**Then** an access log entry is created containing: document ID, public link token, access timestamp, and requester IP address

**Category:** happy-path
**Priority:** must-have

### AC-4: Public viewer does not appear in presence list
**Given** a public viewer and an authenticated editor are both viewing a document
**When** the editor looks at the presence sidebar
**Then** the public viewer's session is not shown in the presence list (no cursor, no name label)

**Category:** edge-case
**Priority:** must-have

### AC-5: Public viewer cannot comment, suggest, or export
**Given** a public viewer is viewing a document via public link
**When** the user attempts to add a comment, submit a suggestion, or trigger an export
**Then**
- None of these controls are rendered in the UI
- Any direct API call returns 403 Forbidden

**Category:** security
**Priority:** must-have

### AC-6: Editor can revoke a public link
**Given** a public link exists for a document
**When** the editor clicks "Revoke link" in the Share UI
**Then**
- The token is invalidated immediately
- Any subsequent request to the old URL returns 404 ("This link is no longer valid")
- Any active public viewer session at that URL receives a notification: "This document is no longer publicly accessible"

**Category:** happy-path
**Priority:** must-have

### AC-7: Generating a new link revokes the previous one
**Given** a public link already exists for a document
**When** an editor generates a new public link
**Then** the previous token is invalidated; the new token is active; the Share UI shows the new URL

**Category:** edge-case
**Priority:** must-have

### AC-8: Revoked or invalid public link returns 404
**Given** a user navigates to a public link URL that has been revoked or never existed
**When** the page loads
**Then** a 404 page is shown with the message "This link is no longer valid or doesn't exist" — no document content is exposed

**Category:** error-handling
**Priority:** must-have

### AC-9: Document deleted while public viewer is active
**Given** a public viewer is viewing a document and an authorized editor deletes the document
**When** the deletion occurs
**Then** the public viewer's session is terminated; the browser shows "This document has been deleted" — no further content is accessible via the link

**Category:** edge-case
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access via Valid Token is Permitted
**Given** a valid public link token is present in the URL
**When** an unauthenticated user requests the document
**Then** the system returns 200 and renders the document in read-only mode (this is the intended flow; standard 401 does not apply to valid public links)

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Invalid or Revoked Token Returns 404
**Given** an invalid or revoked public link token is present in the URL
**When** any user requests the document via that URL
**Then** the system returns 404 — not 403 (to avoid confirming the document's existence to unauthorized parties)

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Token generation fails (server error) | Share UI shows "Failed to generate link. Please try again." No partial token stored | must-have |
| Access log write fails | Log failure recorded internally; public access still permitted (log is non-blocking) | should-have |

### Performance
- **Response time:** Public link document load within 1s p95 (no authentication overhead, may be cached)
- **Token generation:** Link generated within 500ms p95

### Security
- **Token entropy:** Public link tokens must be cryptographically random, minimum 128 bits of entropy (e.g., UUID v4 or equivalent)
- **No document content in 404:** 404 response for invalid tokens must not reveal whether a document at that ID exists
- **Access logging:** All public access logged for audit purposes

### Accessibility
- Public read-only view must be accessible to screen readers
- WCAG 2.1 AA applies to the public view

## Open Questions
- G-5: The public token must bypass normal authentication but still hit the ACL to confirm the document is publicly linked. The integration with the existing ACL for this "token-as-identity" pattern must be confirmed during the permissions model audit.
- G-17: Is the public read-only view required to be mobile-responsive in v1?

---

# Acceptance Criteria: TMPL-01 — Admin creates a document template

## Refined Story Statement
As an admin, I want to create and save a document template with pre-populated structure and placeholder content, so that editors can start new documents with a consistent, reusable format instead of a blank page.

## Assumptions
- Templates are created using the full rich text editor (EDIT-01 through EDIT-06 features) — **Confirmed**
- Templates have: name, optional description, optional category tag — **Confirmed**
- Templates are saved to a global workspace library, visible to all users — **Confirmed**
- Admin can edit and delete templates — **Confirmed**
- Templates are versioned independently — creating a document from a template is a one-time copy (G-14 assumed) — **Confirmed**
- Editing a template does not affect documents already created from it — **Confirmed**
- Per-project templates and non-admin template creation are out of scope for v1 — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-14: Template instantiation model | Addressed — templates use one-time copy at document creation; editing a template after document creation has no effect on existing documents | AC-6, AC-7 |
| G-6: Heading levels | Out of Scope for TMPL-01 — heading levels are an EDIT-01 concern; templates use whatever the editor supports | Scope: Out |
| G-17: Mobile/responsive support | Open Question — admin template management UI on mobile not specified | Open Questions |
| G-4: Maximum document size | Out of Scope for TMPL-01 — templates themselves should have a reasonable size limit (see Open Questions) but the general document size question belongs to the infrastructure spike | Open Questions |

## Acceptance Criteria

### AC-1: Admin accesses the Templates management section
**Given** an authenticated admin navigates to the workspace settings
**When** the admin clicks "Templates"
**Then** a Templates management page loads showing all existing templates in a list/grid with name, category, description, and last-modified date

**Category:** happy-path
**Priority:** must-have

### AC-2: Admin creates a new template using the rich text editor
**Given** the admin is on the Templates management page
**When** the admin clicks "New Template"
**Then** a template editor opens with the full rich text editing capability (headings, bold/italic/underline, lists, code blocks, tables, links, images per EDIT-01 through EDIT-06)

**Category:** happy-path
**Priority:** must-have

### AC-3: Admin sets template metadata
**Given** the template editor is open
**When** the admin enters a template name (required), an optional description, and an optional category tag
**Then** the metadata is saved alongside the template content

**Category:** happy-path
**Priority:** must-have

### AC-4: Template saved to global library
**Given** the admin has authored template content and metadata
**When** the admin clicks "Save Template"
**Then**
- The template is saved to the global workspace template library
- It immediately appears in the template picker for all editors in the workspace
- The admin is returned to the Templates management list

**Category:** happy-path
**Priority:** must-have

### AC-5: Admin edits an existing template
**Given** a template exists in the library
**When** the admin clicks "Edit" on the template
**Then** the template editor opens with the existing content and metadata pre-loaded; changes can be saved

**Category:** happy-path
**Priority:** must-have

### AC-6: Editing a template does not affect documents already created from it
**Given** Editor A created a document from Template X one week ago, and the admin edits Template X today
**When** Editor A opens their document
**Then** the document retains its content from the time of creation; it does not reflect the template edits

**Category:** edge-case
**Priority:** must-have

### AC-7: Admin deletes a template
**Given** a template exists and no in-flight document creation is using it
**When** the admin clicks "Delete" and confirms
**Then**
- The template is removed from the library and no longer appears in the template picker
- Existing documents created from the template are unaffected

**Category:** happy-path
**Priority:** must-have

### AC-8: Template name is required
**Given** the admin attempts to save a template without entering a name
**When** the save is triggered
**Then** the save is blocked and an inline validation error reads "Template name is required"

**Category:** error-handling
**Priority:** must-have

### AC-9: Duplicate template name is handled
**Given** a template named "Project Brief" already exists
**When** the admin saves a new template also named "Project Brief"
**Then** the system either: (a) blocks the save with "A template with this name already exists" OR (b) allows duplicate names with a warning; product to confirm — see Open Questions

**Category:** edge-case
**Priority:** should-have

### AC-10: Non-admin cannot access Templates management
**Given** an authenticated user without admin role attempts to access the Templates management section
**When** the navigation is attempted
**Then** the Templates management link is not present in the UI; a direct URL attempt returns 403 Forbidden

**Category:** error-handling
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the templates management endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without the admin role
**When** a POST/PUT/DELETE request is made to the templates endpoint
**Then** the system returns 403 Forbidden with message "requires admin role"

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Save fails (server error) | "Failed to save template. Please try again." Content preserved in editor | must-have |
| Delete fails (server error) | "Failed to delete template. Please try again." Template remains | must-have |

### Performance
- **Template save:** Confirmed within 1s p95 for templates up to a reasonable size limit (TBD — see Open Questions)
- **Template library load:** Library page renders within 1s p95 for up to 500 templates

### Security
- **Authorization:** All write operations to templates (create, edit, delete) verified server-side as admin role
- **Content sanitization:** Template content sanitized on save to prevent stored XSS

### Accessibility
- Template management page must be keyboard-navigable
- WCAG 2.1 AA

## Open Questions
- Should duplicate template names be allowed or blocked? Product decision required (AC-9).
- G-17: Is the Templates management UI required to work on mobile?
- What is the maximum size of a template (content length)? Related to G-4 but specific to templates.

---

# Acceptance Criteria: TMPL-02 — Create a document from a template

## Refined Story Statement
As an editor, I want to choose a template when creating a new document, so that I start with a useful structure and placeholder content instead of a blank page.

## Assumptions
- "New document" flow includes a template picker step — **Confirmed**
- Template picker supports browse by category and search by name — **Confirmed**
- Selecting a template creates a deep copy of the template's CRDT content at the moment of creation — **Confirmed** (G-14 assumed: one-time copy)
- No live link persists between template and document after creation — **Confirmed**
- Template placeholders are regular editable text — **Confirmed**
- "Blank document" is always available as default — **Confirmed**
- Applying a template to an existing document is out of scope — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-14: Template instantiation model | Addressed — deep copy at creation time; no live link; explicitly confirmed by stakeholder | AC-3, AC-5 |
| G-6: Heading levels | Out of Scope — template content uses whatever the editor supports; no TMPL-02-specific heading concern | Scope: Out |
| G-17: Mobile/responsive support | Open Question — template picker on mobile not specified | Open Questions |

## Acceptance Criteria

### AC-1: Template picker appears in New Document flow
**Given** an authenticated user with can-edit permission on a project
**When** the user clicks "New Document"
**Then** a template picker step is presented before the document editor opens, with options to: browse templates by category, search templates by name, or choose "Blank Document"

**Category:** happy-path
**Priority:** must-have

### AC-2: Browse templates by category
**Given** the template picker is open and templates exist in the library
**When** the user selects a category filter
**Then** only templates tagged with that category are displayed

**Category:** happy-path
**Priority:** must-have

### AC-3: Create document from selected template
**Given** the user selects a template and clicks "Create"
**When** the document is created
**Then**
- A new document is created with a deep copy of the template's CRDT content as of the moment of creation
- The document is fully editable immediately
- Template placeholders appear as regular editable text (no special mechanics)
- The document has no link to the source template

**Category:** happy-path
**Priority:** must-have

### AC-4: Template change after document creation has no effect
**Given** Editor A created a document from Template X
**When** an admin edits Template X
**Then** Editor A's document is unchanged; the one-time copy is authoritative

**Category:** edge-case
**Priority:** must-have

### AC-5: Blank Document option always available
**Given** the template picker is open
**When** the user clicks "Blank Document"
**Then** a new empty document is created and opens immediately

**Category:** happy-path
**Priority:** must-have

### AC-6: Template search returns relevant results
**Given** the template picker is open
**When** the user types part of a template name in the search field
**Then** templates with names matching the search term are shown; non-matching templates are hidden

**Category:** happy-path
**Priority:** must-have

### AC-7: Template library is empty — graceful state
**Given** no templates have been created by admins yet
**When** the template picker opens
**Then** an empty state is shown: "No templates yet — an admin can create templates in workspace settings" — and "Blank Document" is still available

**Category:** edge-case
**Priority:** must-have

### AC-8: Template picker search returns no results
**Given** the user searches for a template name that doesn't exist
**When** no results match
**Then** the picker shows "No templates match '[search term]'" and the "Blank Document" option remains accessible

**Category:** error-handling
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the template picker or document creation endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without can-edit permission on the project
**When** they attempt to create a document
**Then** the system returns 403 Forbidden

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Template fetch fails (server error) | Template picker shows "Failed to load templates" with a retry button; Blank Document still available | must-have |
| Document creation from template fails (server error) | "Failed to create document. Please try again." No partial document created | must-have |

### Performance
- **Template picker load:** Template list rendered within 500ms p95 for up to 500 templates
- **Document creation:** New document open and editable within 1s p95 (including CRDT content copy)

### Security
- **Content copy:** Template content copied server-side; client does not directly manipulate the CRDT binary during copy

### Accessibility
- Template picker must be keyboard-navigable (Tab through cards, Enter to select)
- Search field must have an accessible label
- WCAG 2.1 AA

## Open Questions
- G-17: Is the template picker required to work on mobile in v1?

---

# Acceptance Criteria: EXP-01 — Markdown export

## Refined Story Statement
As an editor or commenter, I want to export a document as a Markdown file, so that I can use the content in tools that accept Markdown (wikis, git repos, static sites).

## Assumptions
- Export available to can-comment and above; Viewers cannot export — **Confirmed** (G-13 assumed)
- Export is server-side rendering: CRDT state → Markdown string → `.md` file download — **Confirmed**
- Mapping confirmed: bold→`**`, italic→`*`, underline→`<u>`, H1–H3→`#/##/###`, bullets→`-`, numbered→`1.`, code blocks→` ``` `, tables→GFM, images→`![alt](url)`, links→`[text](url)` — **Confirmed**
- File name defaults to document title — **Confirmed**
- Images stored as S3-style reference URLs (G-3 assumed) — **Confirmed**
- Exporting comments or suggestions is out of scope — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-3: Image storage strategy | Addressed — images exported as `![alt](S3-url)` reference; no base64 embedding | AC-3 (image mapping) |
| G-6: Heading levels | Addressed — H1–H3 exported as `#/##/###`; consistent with G-6 assumption | AC-3 |
| G-13: Export permissions | Addressed — can-comment and above can export; Viewers cannot | AC-1, AC-AUTH-2 |
| G-4: Maximum document size | Open Question — very large documents may have long server-side render times; no timeout defined | Open Questions |
| G-17: Mobile/responsive support | Out of Scope — export is a file download; mobile download behavior is browser-native | Scope: Out |

## Acceptance Criteria

### AC-1: Export menu appears for can-comment and above
**Given** an authenticated user with can-comment or can-edit permission is viewing a document
**When** the user opens the document toolbar's "Export" menu
**Then** a "Markdown (.md)" option is visible and clickable

**Category:** happy-path
**Priority:** must-have

### AC-2: Clicking Markdown export triggers download
**Given** the user clicks "Markdown (.md)" from the Export menu
**When** the export is processed
**Then**
- The server converts the current CRDT document state to a Markdown string
- A `.md` file download is initiated in the browser
- The file name defaults to the document title with spaces replaced by hyphens and `.md` appended (e.g., "Project Brief" → `project-brief.md`)

**Category:** happy-path
**Priority:** must-have

### AC-3: Rich text is correctly mapped to Markdown syntax
**Given** a document containing all supported formatting types
**When** exported as Markdown
**Then** the `.md` file contains:
- Bold text as `**text**`
- Italic text as `*text*`
- Underlined text as `<u>text</u>` (HTML fallback)
- H1 as `# heading`, H2 as `## heading`, H3 as `### heading`
- Bullet lists as `- item`
- Numbered lists as `1. item`
- Code blocks as ` ```language\ncode\n``` `
- Tables as GFM table syntax (`| col | col |` with separator row)
- Images as `![alt text](image-url)`
- Links as `[link text](url)`

**Category:** happy-path
**Priority:** must-have

### AC-4: Export reflects the current document state
**Given** multiple users have been editing the document
**When** a user triggers a Markdown export
**Then** the exported content reflects the latest committed CRDT state at the time of export (not a stale snapshot)

**Category:** edge-case
**Priority:** must-have

### AC-5: Viewer cannot access the Export menu
**Given** an authenticated user with view-only permission is viewing a document
**When** the user looks for the Export menu
**Then** the Export menu is not rendered in the toolbar; a direct API call to the export endpoint returns 403 Forbidden

**Category:** error-handling
**Priority:** must-have

### AC-6: Empty document exports as empty Markdown file
**Given** a document has no content
**When** exported as Markdown
**Then** a valid (empty) `.md` file is downloaded with the document title as the file name

**Category:** edge-case
**Priority:** should-have

### AC-7: Document with pending suggestions exports base content only
**Given** a document has pending suggestions (not yet accepted or rejected)
**When** exported as Markdown
**Then** the export reflects only the base document state (accepted content); pending suggestions are not included

**Category:** edge-case
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the Markdown export endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with view-only permission
**When** a GET request is made to the Markdown export endpoint
**Then** the system returns 403 Forbidden with message "requires can-comment or can-edit"

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Server error during Markdown generation (5xx) | "Export failed. Please try again." No partial file downloaded | must-have |
| Document title contains special filesystem characters | Characters sanitized in file name (e.g., `/` → `-`); content unaffected | must-have |

### Performance
- **Response time:** Markdown export for documents up to the size limit completes within 3s p95 (synchronous download)
- **Scale:** Export endpoint must handle 20 concurrent export requests without degradation (size limit pending G-4)

### Security
- **Server-side only:** Export rendered server-side; raw CRDT binary not sent to client
- **Authorization:** Permission checked on every export request

### Accessibility
- N/A — export is a file download, not a UI interaction requiring accessibility treatment beyond the menu button itself (which follows toolbar accessibility standards from PERM-02)

## Open Questions
- G-4: What is the maximum document size? For very large documents, should Markdown export be synchronous (immediate download) or asynchronous (like EXP-02/EXP-03)? A size threshold should be defined.

---

# Acceptance Criteria: EXP-02 — PDF export

## Refined Story Statement
As an editor or commenter, I want to export a document as a PDF, so that I can share a print-quality, read-only version with people who need a fixed-format document.

## Assumptions
- PDF available to can-comment and above; Viewers cannot export — **Confirmed** (G-13 assumed)
- Server-side headless rendering (not client-side print CSS) — **Confirmed**
- Paginated output with document title as header — **Confirmed**
- Images included at stored S3 URL — **Confirmed** (G-3 assumed)
- PDF generated asynchronously for large documents; user sees "Preparing export…" and receives download link — **Confirmed**
- Download link expires after 1 hour — **Confirmed**
- Headless rendering service (Puppeteer or equivalent) is new infrastructure to be provisioned — **Confirmed**
- Custom page settings are out of scope — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-3: Image storage strategy | Addressed — images fetched from S3 URL by the rendering service during PDF generation | AC-4 |
| G-4: Maximum document size | Open Question — async threshold (when does export switch to async?) not defined; export timeout for very large docs not specified | Open Questions |
| G-13: Export permissions | Addressed — can-comment and above; Viewers cannot export | AC-1, AC-AUTH-2 |
| G-17: Mobile/responsive support | Out of Scope — PDF is a file download; mobile download behavior is browser-native | Scope: Out |

## Acceptance Criteria

### AC-1: PDF option visible to can-comment and above
**Given** an authenticated user with can-comment or can-edit permission views the Export menu
**When** the menu opens
**Then** a "PDF (.pdf)" option is visible and clickable

**Category:** happy-path
**Priority:** must-have

### AC-2: Small document PDF exports synchronously
**Given** a document below the async threshold (TBD — see Open Questions)
**When** the user clicks "PDF (.pdf)"
**Then** the PDF is generated server-side and downloaded directly to the browser within 10s

**Category:** happy-path
**Priority:** must-have

### AC-3: Large document triggers async export with status UI
**Given** a document above the async threshold
**When** the user clicks "PDF (.pdf)"
**Then**
- A "Preparing export…" progress indicator appears in the UI
- The user can continue working in the document while the export runs
- When the PDF is ready, a download link appears (or a banner notification)

**Category:** happy-path
**Priority:** must-have

### AC-4: PDF renders all rich text formatting faithfully
**Given** a document with headings, bold, italic, underline, lists, code blocks, tables, images, and links
**When** exported as PDF
**Then**
- All formatting is rendered in the PDF (H1–H3 styled as headings, bold/italic preserved, tables rendered as tables, code blocks in monospace, images displayed, links preserved as clickable)
- Images loaded from S3 URLs are included inline

**Category:** happy-path
**Priority:** must-have

### AC-5: PDF is paginated with document title as header
**Given** a multi-page document
**When** exported as PDF
**Then** each page has the document title in the header; content is paginated with appropriate page breaks

**Category:** happy-path
**Priority:** should-have

### AC-6: Download link expires after 1 hour
**Given** an async PDF export has completed and the download link has been provided
**When** the user attempts to download the PDF more than 1 hour after link generation
**Then** the download returns a "Link expired" page; the user must re-trigger the export

**Category:** edge-case
**Priority:** must-have

### AC-7: Viewer cannot access PDF export
**Given** an authenticated user with view-only permission
**When** the user opens the Export menu
**Then** the PDF option is not rendered; a direct API call returns 403 Forbidden

**Category:** error-handling
**Priority:** must-have

### AC-8: Document with pending suggestions exports base content only
**Given** pending suggestions exist in the document
**When** exported as PDF
**Then** the PDF contains only the accepted document body; suggestion markup (green/red styling) is not included

**Category:** edge-case
**Priority:** must-have

### AC-9: Image fetch failure during PDF generation
**Given** an image in the document references an S3 URL that is temporarily unavailable
**When** the PDF is generated
**Then** the image placeholder is included in the PDF with alt text "Image unavailable"; the rest of the PDF is generated successfully (non-blocking failure)

**Category:** error-handling
**Priority:** should-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the PDF export endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with view-only permission
**When** a request is made to the PDF export endpoint
**Then** the system returns 403 Forbidden with message "requires can-comment or can-edit"

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Headless rendering service unavailable | "Export failed. The export service is temporarily unavailable. Please try again later." | must-have |
| PDF generation timeout (exceeds max render time) | "Export timed out. Please try again or contact support if the issue persists." | must-have |
| Export job lost/crashed (async) | Job marked as failed; user sees "Export failed" notification; no orphaned download link | must-have |

### Performance
- **Synchronous path:** PDF delivered within 10s p95 for documents below the async threshold
- **Asynchronous path:** PDF ready notification delivered within 60s p95 for large documents
- **Download link TTL:** 1 hour from generation

### Security
- **Download link tokens:** Async download links must be cryptographically random and scoped to the requesting user
- **Authorization at download:** The download endpoint must verify the requesting user still has can-comment or above permission at download time (permission may have been revoked since export was triggered)

### Accessibility
- "Preparing export…" state must be announced to screen readers (aria-live region)
- WCAG 2.1 AA for the export UI controls

## Open Questions
- G-4: What is the maximum document size? This determines: (a) the synchronous vs. async threshold, (b) the maximum PDF export timeout, and (c) storage quotas for generated PDFs.
- What is the maximum storage time for generated PDFs on the server before deletion (beyond the 1-hour link TTL)?

---

# Acceptance Criteria: EXP-03 — DOCX export

## Refined Story Statement
As an editor or commenter, I want to export a document as a DOCX file, so that I can hand off content to colleagues who work in Microsoft Word.

## Assumptions
- DOCX available to can-comment and above; Viewers cannot export — **Confirmed** (G-13 assumed)
- Server-side generation — **Confirmed**
- Rich text mapped to Word styles: H1–H3 → Heading 1–3, bold/italic/underline → character formatting, lists → Word list styles, code blocks → monospace styled paragraph, tables → Word tables, images → inline image objects from S3 URL, links → Word hyperlink fields — **Confirmed**
- Asynchronous generation for large documents (same "Preparing export…" UX as EXP-02) — **Confirmed**
- DOCX generation library (e.g., python-docx) is new infrastructure; can share with EXP-02 service — **Confirmed**
- Tracked changes and comment export in DOCX format are out of scope — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-3: Image storage strategy | Addressed — images fetched from S3 URL by the generation service and embedded as inline image objects in the DOCX | AC-4 |
| G-4: Maximum document size | Open Question — async threshold and generation timeout not defined | Open Questions |
| G-13: Export permissions | Addressed — can-comment and above; Viewers cannot export | AC-1, AC-AUTH-2 |
| G-17: Mobile/responsive support | Out of Scope — DOCX is a file download; mobile download behavior is browser-native | Scope: Out |

## Acceptance Criteria

### AC-1: DOCX option visible to can-comment and above
**Given** an authenticated user with can-comment or can-edit permission views the Export menu
**When** the menu opens
**Then** a "Word Document (.docx)" option is visible and clickable

**Category:** happy-path
**Priority:** must-have

### AC-2: Small document DOCX exports synchronously
**Given** a document below the async threshold (TBD — see Open Questions)
**When** the user clicks "Word Document (.docx)"
**Then** the DOCX is generated server-side and downloaded directly within 10s

**Category:** happy-path
**Priority:** must-have

### AC-3: Large document triggers async export with status UI
**Given** a document above the async threshold
**When** the user clicks "Word Document (.docx)"
**Then**
- A "Preparing export…" progress indicator appears
- The user can continue working in the document
- When the DOCX is ready, a download link appears

**Category:** happy-path
**Priority:** must-have

### AC-4: Rich text is correctly mapped to Word styles
**Given** a document with all supported formatting types
**When** exported as DOCX
**Then** the generated file contains:
- H1, H2, H3 mapped to Word's "Heading 1", "Heading 2", "Heading 3" paragraph styles
- Bold, italic, underline as character formatting on runs
- Bullet lists as Word list-style paragraphs
- Numbered lists as Word numbered-list-style paragraphs
- Code blocks as monospace-styled (e.g., Courier New) paragraph
- Tables as Word table objects
- Images fetched from S3 URL and embedded as inline image objects
- Links as Word hyperlink fields

**Category:** happy-path
**Priority:** must-have

### AC-5: Download link expires after 1 hour
**Given** an async DOCX export has completed and the link provided
**When** the user attempts to download more than 1 hour after generation
**Then** the download returns "Link expired"; user must re-trigger export

**Category:** edge-case
**Priority:** must-have

### AC-6: Viewer cannot access DOCX export
**Given** an authenticated user with view-only permission
**When** the Export menu is opened
**Then** the DOCX option is not rendered; a direct API call returns 403 Forbidden

**Category:** error-handling
**Priority:** must-have

### AC-7: Document with pending suggestions exports base content only
**Given** pending suggestions exist in the document
**When** exported as DOCX
**Then** the DOCX contains only the accepted document body; no tracked-changes markup is included

**Category:** edge-case
**Priority:** must-have

### AC-8: Image fetch failure is handled non-blockingly
**Given** an image in the document references an S3 URL that is unavailable during generation
**When** the DOCX is generated
**Then** a placeholder paragraph is inserted at the image location reading "Image unavailable"; the rest of the document is generated normally

**Category:** error-handling
**Priority:** should-have

### AC-9: Exported file name matches document title
**Given** the document title is "Q3 Planning"
**When** the DOCX is downloaded
**Then** the file is named `Q3 Planning.docx` (or a sanitized version if title contains special characters)

**Category:** edge-case
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the DOCX export endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with view-only permission
**When** a request is made to the DOCX export endpoint
**Then** the system returns 403 Forbidden with message "requires can-comment or can-edit"

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| DOCX generation service unavailable | "Export failed. The export service is temporarily unavailable. Please try again later." | must-have |
| Generation timeout | "Export timed out. Please try again or contact support." | must-have |
| Malformed document structure (e.g., nested tables unsupported by library) | Generation succeeds with best-effort output; a warning banner on download: "Some formatting may not have exported correctly" | should-have |

### Performance
- **Synchronous path:** DOCX delivered within 10s p95 for documents below the async threshold
- **Asynchronous path:** DOCX ready within 60s p95 for large documents
- **Download link TTL:** 1 hour from generation

### Security
- **Download link tokens:** Cryptographically random, scoped to requesting user
- **Authorization at download:** Verify permission at download time (not only at export trigger time)
- **S3 URL fetch:** The generation service fetches images server-to-server; S3 URLs are not exposed to the client beyond what is already in the document

### Accessibility
- "Preparing export…" state announced to screen readers (aria-live region)
- WCAG 2.1 AA for export UI controls

## Open Questions
- G-4: What is the maximum document size? Determines the sync/async threshold and generation timeout for DOCX.
- Are nested tables supported in v1 DOCX export? python-docx has limited nested table support; if the editor allows nesting, this requires early clarification to set scope.

---

## Coverage Summary
| # | Story Slug | AC Count | Auth AC | Gap Rows | Status |
|---|-----------|----------|---------|----------|--------|
| 1 | COMM-01 | 10 + 2 auth | Yes | 6 | Complete |
| 2 | COMM-02 | 9 + 2 auth | Yes | 3 | Complete |
| 3 | COMM-03 | 10 + 2 auth | Yes | 4 | Complete |
| 4 | COMM-04 | 8 + 2 auth | Yes | 4 | Complete |
| 5 | NOTIF-01 | 9 + 2 auth | Yes | 3 | Complete |
| 6 | PERM-01 | 9 + 2 auth | Yes | 3 | Complete |
| 7 | PERM-02 | 10 + 2 auth | Yes | 3 | Complete |
| 8 | PERM-03 | 9 + 2 auth | Yes (modified) | 4 | Complete |
| 9 | TMPL-01 | 10 + 2 auth | Yes | 4 | Complete |
| 10 | TMPL-02 | 8 + 2 auth | Yes | 3 | Complete |
| 11 | EXP-01 | 7 + 2 auth | Yes | 4 | Complete |
| 12 | EXP-02 | 9 + 2 auth | Yes | 4 | Complete |
| 13 | EXP-03 | 9 + 2 auth | Yes | 4 | Complete |
| **Total** | **13 stories** | **117 + 26 auth = 143 AC** | **All** | **49 gap rows** | **Complete** |


<!-- STORY COUNT: 2 stories to process -->

# Acceptance Criteria: MOB-01 — Responsive Read-Only Document View on Mobile

## Refined Story Statement
As a viewer or editor on a mobile device (viewport < 768px), I want to read a document in a clean, read-only layout without the editing toolbar, so that I can reference document content when I'm away from my desk.

## Assumptions
- The host application already has a defined mobile breakpoint at < 768px — **Confirmed** (scope states "matches host application's existing mobile breakpoints")
- Rich text content is rendered from the CRDT document state, not re-fetched in a separate mobile format — **Unconfirmed**
- Heading levels H1–H3 are the supported range (per G-6 assumption) — **Unconfirmed**
- Images are stored as reference URLs (per G-3 assumption), not base64 inline — **Unconfirmed**
- Users authenticated at any permission level (view-only, can-comment, can-edit) all receive read-only mode on mobile for v1 — **Confirmed** (scope: "regardless of permission level")
- Existing comments are rendered visibly but are non-interactive (no reply, no resolve) on mobile v1 — **Confirmed** (scope: "comments are visible but not creatable")
- Presence indicators (cursors, user list) are suppressed entirely on mobile — **Confirmed**

Unconfirmed assumptions flagged in Open Questions below.

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-3 (Image storage: inline vs. reference) | Addressed — AC specifies reference-URL images must render via `<img src="...">` on mobile; base64 assumption not made | AC-5 |
| G-5 (Existing permissions model integration) | Partially addressed — MOB-01 depends on PERM-02 for permission checks; this story only asserts the mobile layer enforces read-only regardless of role. Full permissions model integration is out of scope here | Out of Scope (blocked on PERM-02) |
| G-6 (Heading levels unspecified) | Addressed — assumed H1–H3 per analyst suggestion; confirmed assumption flagged | AC-2, Open Questions |
| G-13 (Export permissions) | Out of Scope — export is not part of the mobile read-only view; no export controls rendered on mobile in v1 | Out of Scope |
| G-15 (Maximum concurrent editors) | Addressed — presence indicators are hidden on mobile; fan-out concern does not apply to MOB-01 | AC-8 |
| G-16 (Notification model) | Out of Scope — notifications are v1 descoped; confirmed this story makes no changes to notification behavior | Out of Scope |
| G-17 (Mobile/responsive support) | Addressed — this story directly resolves G-17 per stakeholder confirmation; desktop editing only, mobile viewing required for v1 | AC-1 through AC-9 |

## Acceptance Criteria

### AC-1: Read-Only View Renders on Narrow Viewport
**Given** an authenticated user navigates to a document URL on a device with viewport width < 768px
**When** the page loads
**Then** the document content renders in read-only mode, the editing toolbar is not present in the DOM (not merely hidden via CSS), and the page is responsive to the device's viewport width without horizontal overflow on the main content area

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Rich Text Formatting Renders Correctly
**Given** a document containing headings (H1, H2, H3), bold, italic, underline, bullet lists, and numbered lists
**When** viewed in mobile read-only mode
**Then** each element renders with visually distinct formatting matching its desktop counterpart (H1 largest, H3 smallest; bold/italic/underline applied correctly; list items display with appropriate indentation and markers)

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Code Blocks Render with Horizontal Scroll
**Given** a document containing a code block whose content width exceeds the mobile viewport
**When** viewed in mobile read-only mode
**Then** the code block scrolls horizontally within its container and does not cause the page layout to overflow; monospace font is preserved

**Category:** edge-case
**Priority:** must-have

---

### AC-4: Tables Scroll Horizontally
**Given** a document containing a table with more columns than fit within a < 768px viewport
**When** viewed in mobile read-only mode
**Then** the table container scrolls horizontally within its bounding box; the table does not reflow into a stacked layout; column headers remain visible during horizontal scroll

**Category:** edge-case
**Priority:** must-have

---

### AC-5: Images Render Responsively
**Given** a document containing one or more image references (stored as URLs)
**When** viewed in mobile read-only mode
**Then** each image scales to fit within the viewport width (max-width: 100%), maintains its aspect ratio, and does not cause horizontal page overflow; broken image URLs display a standard broken-image placeholder with alt text if available

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Hyperlinks Are Tappable
**Given** a document containing hyperlinks
**When** viewed in mobile read-only mode
**Then** links are rendered as tappable touch targets with a minimum 44×44px touch target area; tapping opens the link per the standard browser behavior (new tab or same tab per link target attribute)

**Category:** happy-path
**Priority:** must-have

---

### AC-7: Comments Are Visible and Non-Interactive
**Given** a document that has one or more inline comments
**When** viewed in mobile read-only mode
**Then** comment indicators (e.g., highlighted text or comment icons) are visible in the document; tapping a comment indicator displays the comment thread in read-only mode; no UI affordance for creating, replying to, or resolving comments is rendered

**Category:** happy-path
**Priority:** must-have

---

### AC-8: Presence Indicators Are Hidden
**Given** one or more users are actively editing or viewing the document concurrently
**When** the mobile read-only view is open
**Then** no cursor overlays, user avatars, or collaborator list indicators are rendered in the mobile view; the absence of presence UI does not cause layout errors or JavaScript exceptions

**Category:** happy-path
**Priority:** must-have

---

### AC-9: Editor-Permissioned User Cannot Mutate Content on Mobile
**Given** an authenticated user with can-edit permission opens a document on a < 768px viewport
**When** they attempt any action that would normally trigger an edit (e.g., long-press text selection, focus on content area)
**Then** the document remains in read-only mode; no editing cursor, formatting toolbar, or content mutation is possible; the can-edit role is not surfaced in the mobile UI

**Category:** security
**Priority:** must-have

---

### AC-10: Empty Document Renders Without Error
**Given** a document with no content (newly created and empty)
**When** viewed in mobile read-only mode
**Then** the document renders an empty content area with no errors or broken UI; a consistent empty-state is shown (e.g., blank white area or a placeholder such as "This document has no content yet")

**Category:** edge-case
**Priority:** should-have

---

### AC-11: Document Failing to Load Surfaces an Error
**Given** the document fails to load (network error, server 500, or document ID not found)
**When** the mobile view attempts to render
**Then** an error message is displayed ("Unable to load document. Please try again.") with a retry button; no partial or broken content is rendered; the error is not swallowed silently

**Category:** error-handling
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the document view endpoint (mobile or desktop)
**Then** the system returns 401 Unauthorized and the client redirects the user to the login page

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without at least view-only permission on the specific document
**When** they attempt to access the document URL on mobile
**Then** the system returns 403 Forbidden; the client displays "You don't have permission to view this document" with a link back to the project document list; no document content is exposed

**Category:** security
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Network drops after partial load | Document remains viewable using already-rendered content; a non-blocking "You're offline" banner appears | should-have |
| Image URL returns 404/403 | Broken image placeholder with alt text shown; rest of document unaffected | must-have |
| Comment thread fetch fails | Comment indicator still shown; tapping displays "Unable to load comments" inline | should-have |

### Performance
- **Initial render time:** Document content visible within 2 seconds on a 4G connection (< 768px viewport) at p95
- **Scroll performance:** Smooth scroll at 60fps on mid-tier Android hardware (no janky reflows during content scroll)
- **Scale:** Read-only mobile view must support the same concurrent viewer load as the desktop view; no additional server-side session is created for mobile viewers beyond the existing WebSocket room

### Security
- **Input validation:** No user-supplied content is executed; all rich text content rendered via sanitized HTML (no raw innerHTML from untrusted sources)
- **Authorization:** Permission check occurs server-side before document content is returned; client-side read-only enforcement is defense-in-depth only
- **No mutation endpoints called:** Mobile read-only view must not invoke any write/update API endpoints for document content

### Accessibility
- Text content must meet WCAG 2.1 AA contrast ratios (4.5:1 for body, 3:1 for large text)
- Tap targets must be ≥ 44×44px
- Document headings must use semantic HTML heading elements (`<h1>`–`<h3>`) so screen readers can navigate by heading

---

## Open Questions
1. **Unconfirmed: Rendering source** — Is the mobile read-only view rendering from the live CRDT document state (requiring a WebSocket or HTTP snapshot fetch), or from a static persisted snapshot? The answer affects whether mobile viewers receive live updates while the document is being edited.
2. **Unconfirmed: Heading level range** — Analyst assumed H1–H3. If the editing stories ultimately support H4–H6, the mobile rendering story must be updated to handle those levels.
3. **Unconfirmed: Image storage format** — If images are ever stored as base64 (overriding G-3 assumption), large inline images could cause severe performance issues on mobile; a separate size cap AC would be needed.
4. **Open: Viewport breakpoint source** — "Matches host application's existing mobile breakpoints" requires the host application's breakpoint value to be documented and confirmed as < 768px before implementation begins.

---

---

# Acceptance Criteria: SESSION-01 — Document Deletion with Active Collaborators

## Refined Story Statement
As a user actively editing or viewing a document, I want to receive an immediate in-app notification if that document is deleted while I have it open, so that I am not silently working on content that no longer exists and understand that my unsaved changes are gone.

## Assumptions
- "Unsaved changes" means any CRDT operations that have not yet been acknowledged by the server at the moment of deletion — **Unconfirmed**
- The deleting user's display name is available to the server and can be included in the modal message — **Unconfirmed**
- Only admins and editors with explicit delete permission can delete a document (permission check is enforced server-side) — **Unconfirmed** (depends on PERM-02 / G-5)
- The WebSocket room for the document is the delivery channel for the session termination event — **Unconfirmed** (depends on SYNC-01 / G-2)
- All connected clients (editors and viewers) in the document room receive the termination event, not just editors — **Confirmed** (scope: "all connected clients")
- After modal dismissal, clients redirect to the project's document list — **Confirmed** (scope explicitly states this)
- Content recovery from a deleted document is out of scope for v1 — **Confirmed** (scope)
- Soft-delete / trash bin is out of scope for v1 — **Confirmed** (scope)

Unconfirmed assumptions flagged in Open Questions below.

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1 (CRDT/OT framework choice) | Addressed — SESSION-01 does not depend on the CRDT merge algorithm; it depends only on the WebSocket session room concept. AC written framework-agnostically. Open question flags dependency on SYNC-01 spike outcome | AC-AUTH-1, Open Questions |
| G-2 (WebSocket infrastructure) | Addressed — this story assumes a WebSocket room per document exists (per SYNC-01 dependency); AC written to be infrastructure-agnostic but flags the dependency. If WebSocket server is not yet provisioned, this story is blocked | Open Questions |
| G-4 (Maximum document size) | Out of Scope — document size does not affect deletion session termination behavior | Out of Scope |
| G-5 (Existing permissions model) | Addressed — AC requires delete permission to be enforced server-side; the specific permission name and role mapping are deferred to PERM-02. AC-AUTH-2 covers insufficient-permission rejection | AC-AUTH-2, Open Questions |
| G-7 (LWW conflict resolution unit) | Out of Scope — conflict resolution is irrelevant to deletion lifecycle | Out of Scope |
| G-8 (Undo across concurrent edits) | Out of Scope — undo behavior after deletion is not in scope; content is not recoverable | Out of Scope |
| G-15 (Maximum concurrent editors) | Addressed — broadcast fan-out to all connected clients must work within whatever concurrent-user bound is ultimately specified; AC written to apply to all connected clients regardless of count; performance bound deferred to SYNC-01 spike | AC-1, Non-Functional/Performance |
| G-18 (Document deletion mid-session behavior) | Directly addressed — analyst assumed "session terminated immediately; editors notified with in-app message." This story formalizes that assumption into testable AC | AC-1 through AC-7 |

## Acceptance Criteria

### AC-1: All Connected Clients Receive Termination Event
**Given** one or more users (editors and/or viewers) have an open WebSocket connection in a document's collaboration room
**When** a user with delete permission deletes the document
**Then** the server broadcasts a `document.deleted` session termination event to all connected clients in that room within 1 second of the delete operation completing

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Modal Displayed with Deleter's Name
**Given** a connected client receives the `document.deleted` event
**When** the event is processed by the client
**Then** a modal dialog is displayed with the message: "This document has been deleted by [Display Name of deleting user]. Your unsaved changes have been lost."; the modal blocks interaction with the document content behind it; it has a single dismissal action ("OK" or "Go to Documents")

**Category:** happy-path
**Priority:** must-have

---

### AC-3: WebSocket Session Closed After Deletion
**Given** the `document.deleted` event has been broadcast
**When** the server-side broadcast completes
**Then** the server closes the WebSocket room for that document; any client that subsequently attempts to connect to that document's room receives a 404 or a `room.not_found` error rather than joining successfully

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Client Redirects to Document List on Modal Dismissal
**Given** the deletion modal is displayed to a connected client
**When** the user dismisses the modal (clicks "OK" or "Go to Documents")
**Then** the client navigates to the project's document list page; no further attempt is made to reconnect to the deleted document's WebSocket room; the deleted document does not appear in the document list

**Category:** happy-path
**Priority:** must-have

---

### AC-5: Deleting User Sees Confirmation, Not a Self-Modal
**Given** the user who initiates the document deletion is also connected to the document's collaboration room
**When** they confirm the delete action
**Then** they receive a standard deletion confirmation (e.g., "Document deleted") and are redirected to the document list; they do not receive the "This document has been deleted by [their own name]" modal that other clients see

**Category:** edge-case
**Priority:** should-have

---

### AC-6: Clients with No Active Connection Are Not Affected
**Given** a user who was previously viewing the document has closed their browser tab (no active WebSocket connection)
**When** the document is deleted
**Then** no error occurs server-side due to the absent connection; that user sees no modal; if they subsequently navigate to the deleted document URL, they receive a "Document not found" page (not the deletion modal)

**Category:** edge-case
**Priority:** must-have

---

### AC-7: Deletion Event Delivery Is Best-Effort with Graceful Fallback
**Given** a connected client's WebSocket connection drops between the delete action and the event broadcast
**When** the client reconnects or navigates to the document URL
**Then** the client receives a "Document not found" response from the server; the client displays "This document no longer exists" and links back to the document list; the client does not enter a reconnection retry loop for a non-existent document

**Category:** error-handling
**Priority:** must-have

---

### AC-8: Delete Action Requires Explicit Confirmation
**Given** a user with delete permission views a document
**When** they initiate the delete action (e.g., from a document menu)
**Then** a confirmation dialog is presented: "Are you sure you want to delete '[Document Title]'? This cannot be undone and all collaborators will lose access immediately."; the document is only deleted after the user confirms; canceling the dialog leaves the document intact

**Category:** happy-path
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the document delete endpoint
**Then** the system returns 401 Unauthorized; the document is not deleted; no session termination event is broadcast

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without delete permission on the document (e.g., a viewer or commenter)
**When** they attempt to call the document delete endpoint directly (e.g., via API or crafted request)
**Then** the system returns 403 Forbidden with a message identifying the missing permission ("You do not have permission to delete this document"); the document is not deleted; no session termination event is broadcast; the UI does not expose a delete affordance to this user

**Category:** security
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Delete DB transaction fails mid-flight | Document is not deleted; no session termination event broadcast; user who initiated delete sees a server error message; document remains accessible | must-have |
| Broadcast to room fails (WebSocket server error) | Delete still completes at the data layer; server logs broadcast failure; clients that did not receive the event will encounter "Document not found" on next interaction | should-have |
| Client receives duplicate `document.deleted` events | Second event is a no-op; modal is not shown twice; no redirect loop | must-have |

### Performance
- **Broadcast latency:** Session termination event delivered to all connected clients within 1 second of delete confirmation at p95, for up to the maximum concurrent editor count (TBD per G-15)
- **Delete operation:** Server-side delete + broadcast completes within 2 seconds at p95 under normal load

### Security
- **Authorization:** Delete permission check must be enforced server-side on the delete endpoint; no client-side gate is sufficient
- **No content exposure post-delete:** After deletion, any attempt to fetch document content, version history, or comments for that document ID must return 404; no data leakage via race condition between delete and content fetch
- **Audit log:** Each document deletion must be recorded in the audit log with: document ID, deleting user ID, timestamp, number of connected clients notified

### Accessibility
- The deletion confirmation dialog must be keyboard accessible and focus-trapped while open
- The "This document has been deleted" modal must be announced by screen readers via an ARIA live region or role="alertdialog"
- Modal dismissal must return focus to a sensible element (document list link or page heading)

---

## Open Questions
1. **Unconfirmed: "Unsaved changes" definition** — The modal text states "Your unsaved changes have been lost." The definition of "unsaved" must be agreed upon with product: is it (a) any CRDT op not acknowledged by the server, (b) any op applied locally in the last N seconds, or (c) simply always shown regardless? If the system uses server-acknowledged CRDT ops, there may be no unsaved changes in the traditional sense — the message may need to be reworded.
2. **Unconfirmed: Deleter's display name availability** — The modal includes "[Display Name of deleting user]." Confirm that the server includes this in the `document.deleted` event payload, and that the display name field is always populated (cannot be null/empty).
3. **Unconfirmed: WebSocket infrastructure** — SESSION-01 depends on SYNC-01 (WebSocket room per document). If the SPIKE-02 infrastructure review (G-2) determines a different delivery mechanism is used (e.g., Server-Sent Events, long polling), the broadcast mechanism in AC-1 and AC-3 must be re-specified.
4. **Unconfirmed: Delete permission role mapping** — "Editor with delete permission" is referenced in AC-8 and AC-AUTH-2, but the exact permission name and which roles hold it are blocked on PERM-02 (G-5). This AC must be revisited once the permissions model is defined.
5. **Open: Viewer-only client behavior on deletion** — Scope says "all connected clients" receive the event. Confirm that viewers (who have no unsaved changes) receive the same modal or a variant ("This document has been deleted by [user]." without the "unsaved changes" clause).

---

---
## Coverage Summary
| # | Story Slug | AC Count | Auth AC | Gap Rows | Status |
|---|-----------|----------|---------|----------|--------|
| 1 | MOB-01 | 11 (AC-1–AC-11) + AUTH-1 + AUTH-2 | Yes | 7 | Complete |
| 2 | SESSION-01 | 8 (AC-1–AC-8) + AUTH-1 + AUTH-2 | Yes | 8 | Complete |
| **Total** | **2 stories** | **23 functional AC** | **4 auth AC** | **15 gap rows** | |


<!-- STORY COUNT: 6 stories to process — TMPL-01, TMPL-02, EXP-01, EXP-02, EXP-03, SESSION-01 (derived from Phase 5 of the decomposition; story definitions were absent from the batch input and have been reconstructed from the decomposition context) -->

# Acceptance Criteria: TMPL-01 — Admin Creates a Document Template

## Refined Story Statement
As an **admin**, I want to create a named document template with rich-text placeholder content and pre-populated structure, so that editors across the organization can start new documents with consistent, ready-to-fill scaffolding instead of blank pages.

## Assumptions
- Templates are created and managed exclusively by users with the Admin role — **Confirmed** (decomposition)
- Template content supports the same rich-text elements available in the editor (H1–H3, bold/italic/underline, lists, code blocks, tables, links) — **Confirmed** (G-6 assumed H1–H3)
- Images in templates reference external URLs (reference-based storage, not inline base64) — **Confirmed by assumption** (G-3)
- A template is a one-time copy: creating a document from a template does not maintain a live link back to the template — **Confirmed by assumption** (G-14)
- Template names must be unique within the organization/workspace — **Unconfirmed**
- There is a maximum number of templates per workspace — **Unconfirmed**
- Template management UI is part of the admin settings area, not the main document editor — **Unconfirmed**

Unconfirmed assumptions are listed in Open Questions.

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1 CRDT/OT framework | Out of Scope — templates are static content at rest; CRDT applies to live sessions, not template authoring | — |
| G-2 WebSocket server | Out of Scope — template creation is a single-user admin action with no real-time sync requirement | — |
| G-3 Image/file storage strategy | Addressed — AC-4 specifies images in templates must be stored as reference URLs, not inline base64 | AC-4 |
| G-4 Maximum document size | Partially addressed — template size limit is noted as an open question; AC-3 validates template can be saved | Open Question |
| G-5 Existing permissions model | Addressed — AC-AUTH-1 and AC-AUTH-2 enforce Admin-only access; AC-1 scopes template management to Admin role | AC-AUTH-1, AC-AUTH-2, AC-1 |
| G-6 Heading levels | Addressed — AC-2 specifies H1–H3 in template content | AC-2 |
| G-7 LWW conflict unit | Out of Scope — single-user admin action; no concurrent editing of templates defined | — |
| G-8 Undo across concurrent edits | Out of Scope — template authoring is single-user; covered by CONF stories | — |
| G-9 Offline duration limit | Out of Scope — templates story; covered by OFFL stories | — |
| G-10 Version history restore | Out of Scope — templates do not have a version history requirement in this story | — |
| G-11 Comment resolution workflow | Out of Scope — templates story | — |
| G-12 Suggestion mode ownership | Out of Scope — templates story | — |
| G-13 Export permissions | Out of Scope — templates story | — |
| G-14 Template instantiation model | Addressed — AC-5 specifies template is a one-time copy; no live link persists | AC-5 |
| G-15 Maximum concurrent editors | Out of Scope — template creation is single-user | — |
| G-16 Notification model | Out of Scope — no notification on template creation defined for v1 | — |
| G-17 Mobile/responsive support | Out of Scope for v1 — template management is desktop-admin; mobile editing explicitly deferred | Open Question |
| G-18 Document deletion mid-session | Out of Scope — template creation; covered by SESSION-01 | — |

## Acceptance Criteria

### AC-1: Admin Accesses Template Management
**Given** a user with the Admin role is authenticated  
**When** they navigate to the Template Management section of admin settings  
**Then** they see a list of existing templates (or an empty state with a "Create Template" prompt if none exist), and a "Create Template" button is available

**Category:** happy-path  
**Priority:** must-have

---

### AC-2: Admin Saves a Template with Rich-Text Content
**Given** an admin is composing a new template in the template editor  
**When** the template contains any combination of: headings (H1, H2, H3), bold, italic, underline, bulleted lists, numbered lists, code blocks, tables, and hyperlinks  
**Then** all formatting is preserved accurately when the template is saved and subsequently viewed or used to create a document

**Category:** happy-path  
**Priority:** must-have

---

### AC-3: Admin Assigns a Name and Saves the Template
**Given** an admin has authored template content and entered a valid template name (1–100 characters, no leading/trailing whitespace)  
**When** they click "Save Template"  
**Then** the template is persisted, a success confirmation is displayed ("Template saved"), and the template appears in the template list with the given name and a creation timestamp

**Category:** happy-path  
**Priority:** must-have

---

### AC-4: Images in Templates Are Stored as Reference URLs
**Given** an admin inserts an image into a template by uploading or pasting an image  
**When** the template is saved  
**Then** the image is stored as a reference URL (e.g., pointing to S3-backed storage), not as inline base64 data, and the image renders correctly when the template is previewed or used to create a document

**Category:** edge-case  
**Priority:** must-have

---

### AC-5: Template Is a One-Time Copy at Document Creation
**Given** a template has been saved by an admin  
**When** an editor creates a document from that template  
**Then** the new document is an independent copy of the template content at the moment of creation; subsequent edits to the template do not affect existing documents created from it, and edits to the document do not affect the template

**Category:** edge-case  
**Priority:** must-have

---

### AC-6: Admin Edits an Existing Template
**Given** an admin navigates to an existing template in the template list  
**When** they click "Edit" and modify the content or name, then click "Save"  
**Then** the template is updated with the new content and the template list reflects the updated name and a "Last modified" timestamp

**Category:** happy-path  
**Priority:** must-have

---

### AC-7: Admin Deletes a Template
**Given** an admin navigates to an existing template  
**When** they click "Delete" and confirm the deletion in a confirmation dialog  
**Then** the template is removed from the template list and is no longer available for document creation; documents previously created from it are not affected

**Category:** happy-path  
**Priority:** must-have

---

### AC-8: Save Fails Gracefully on Network Error
**Given** an admin is saving a new or edited template  
**When** a network error occurs during the save request  
**Then** the template editor displays an inline error: "Failed to save template. Your changes are preserved — please try again.", and no partial or corrupt template is persisted on the server

**Category:** error-handling  
**Priority:** must-have

---

### AC-9: Empty Template Name Rejected
**Given** an admin attempts to save a template  
**When** the template name field is empty or contains only whitespace  
**Then** the save action is blocked, and an inline validation message reads: "Template name is required."

**Category:** boundary  
**Priority:** must-have

---

### AC-10: Template Name Exceeds Maximum Length Rejected
**Given** an admin enters a template name longer than 100 characters  
**When** they attempt to save  
**Then** the save action is blocked, and an inline validation message reads: "Template name must be 100 characters or fewer."

**Category:** boundary  
**Priority:** must-have

---

### AC-11: Non-Admin Cannot Access Template Management
**Given** a user with the Editor, Commenter, or Viewer role is authenticated  
**When** they attempt to navigate to the Template Management section directly via URL  
**Then** the page returns a 403 Forbidden response and the user is redirected to their document dashboard with a message: "You do not have permission to manage templates."

**Category:** security  
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** a request is made to any template management API endpoint (create, read, update, delete)  
**Then** the system returns 401 Unauthorized

**Category:** security  
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without the Admin role  
**When** a request is made to any template management API endpoint (create, update, delete)  
**Then** the system returns 403 Forbidden with a message identifying the missing permission: "Admin role required to manage templates."

**Category:** security  
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Network failure during template save | Inline error shown; no partial save; editor content preserved in-memory | must-have |
| Session expiry mid-authoring | On next valid request, user is redirected to login; content in the form is preserved in `sessionStorage` where possible so user can recover it after re-auth | should-have |
| Save succeeds but image upload fails | Template body is saved; image placeholder shows a broken-image indicator with the message "Image failed to upload — re-insert to retry" | must-have |

### Performance
- **Response time:** Template save API returns within 1,000ms p95 for templates up to 500KB of content
- **Scale:** Template list renders within 500ms p95 for up to 200 templates

### Security
- **Input validation:** Template name and all content fields must be sanitized server-side to prevent XSS; stored content must not execute as HTML when rendered in the editor or in documents created from the template
- **Authorization:** All template CRUD operations enforce Admin role at the API layer, not only in the UI

### Accessibility
- Template editor and management UI must meet WCAG 2.1 AA: all actions keyboard-navigable, all form fields labeled, error messages programmatically associated with their inputs

## Open Questions
- **Template name uniqueness:** Must template names be unique per workspace? If a duplicate name is submitted, should the system block the save or allow it with a warning? (Unconfirmed assumption)
- **Maximum templates per workspace:** Is there a cap on the number of templates an admin can create? Relevant for storage quotas. (Unconfirmed)
- **Template management UI location:** Is template management accessible from admin settings only, or also from the "New Document" flow? Affects UX and routing.
- **Mobile template authoring:** G-17 is deferred; confirm whether admins are expected to create/edit templates on mobile in v1 or whether this is desktop-only.
- **Maximum template content size:** G-4 (max document size) was deferred. Until resolved, the 500KB p95 performance target is provisional.

---

# Acceptance Criteria: TMPL-02 — Editor Creates a Document from Template

## Refined Story Statement
As an **editor**, I want to select an existing admin-created template when creating a new document, so that I start with a pre-populated structure I only need to fill in, rather than formatting from scratch.

## Assumptions
- Only users with the Editor role (or Admin) can create new documents from templates; Viewer and Commenter roles cannot create documents — **Confirmed** (role model)
- Commenters cannot create documents at all — **Unconfirmed** (clarification needed)
- Template selection is offered at the "Create document" entry point, with an option to start blank — **Unconfirmed**
- Once a document is created from a template, the relationship is severed (one-time copy per G-14) — **Confirmed by assumption** (G-14)
- If a template is deleted after a document was created from it, the document is not affected — **Confirmed** (follows from one-time-copy assumption)
- The new document is created in the editor's current project/folder context — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1 CRDT/OT framework | Out of Scope — document initialization from template is a one-time copy; CRDT state initializes from template content but that is an infrastructure concern addressed in SYNC stories | — |
| G-2 WebSocket server | Out of Scope — initial document creation is a REST operation; WS session starts after creation, covered in SYNC-01 | — |
| G-3 Image/file storage | Addressed — AC-3 specifies images from template render as reference URLs in the new document | AC-3 |
| G-4 Maximum document size | Out of Scope for this story — template size limit is an open question; documents created from templates inherit the same constraints | Open Question |
| G-5 Existing permissions model | Addressed — AC-AUTH-1 and AC-AUTH-2 enforce role-based access; AC-1 scopes creation to Editor/Admin roles | AC-AUTH-1, AC-AUTH-2, AC-1 |
| G-6 Heading levels | Addressed — template content (H1–H3) must render correctly in the new document; verified by AC-2 | AC-2 |
| G-7 LWW conflict unit | Out of Scope — initial document creation; conflict handling covered in CONF stories | — |
| G-8 Undo across concurrent edits | Out of Scope — initial document creation | — |
| G-9 Offline duration limit | Out of Scope — this story; covered in OFFL stories | — |
| G-10 Version history restore | Out of Scope — this story | — |
| G-11 Comment resolution | Out of Scope — this story | — |
| G-12 Suggestion mode ownership | Out of Scope — this story | — |
| G-13 Export permissions | Out of Scope — this story; covered in EXP stories | — |
| G-14 Template instantiation model | Addressed — AC-4 specifies one-time copy behavior; no live link persists | AC-4 |
| G-15 Maximum concurrent editors | Out of Scope — document creation is a single-user action; WS limits addressed in SYNC/PRES stories | — |
| G-16 Notification model | Out of Scope — no notification requirement on document creation from template in v1 | — |
| G-17 Mobile/responsive support | Out of Scope for v1 — mobile editing explicitly deferred | — |
| G-18 Document deletion mid-session | Out of Scope — this story; covered in SESSION-01 | — |

## Acceptance Criteria

### AC-1: Editor Sees Template Selection at Document Creation
**Given** an authenticated Editor navigates to "Create New Document"  
**When** the creation dialog or page is presented  
**Then** the user sees two options: "Start from blank" and "Start from template", and selecting "Start from template" shows a browseable list of available admin-created templates

**Category:** happy-path  
**Priority:** must-have

---

### AC-2: Template Content and Formatting Appear in New Document
**Given** an Editor selects a template from the list and confirms creation  
**When** the new document opens in the editor  
**Then** all template content is present and correctly formatted: headings (H1–H3), bold, italic, underline, bulleted lists, numbered lists, code blocks, tables, hyperlinks, and reference-URL images all render as they do in the template preview

**Category:** happy-path  
**Priority:** must-have

---

### AC-3: Images from Template Render as Reference URLs
**Given** a template contains images stored as reference URLs  
**When** an Editor creates a document from that template  
**Then** the document renders those images from their original reference URLs; no base64 data is inlined into the document state, and images display correctly if the referenced URLs are accessible

**Category:** edge-case  
**Priority:** must-have

---

### AC-4: New Document Is Independent of Template
**Given** an Editor has created a document from a template  
**When** an Admin subsequently edits and saves the template  
**Then** the existing document created from the template is not changed; the document retains the content from the template at the time of creation

**Category:** edge-case  
**Priority:** must-have

---

### AC-5: Deleted Template Does Not Affect Existing Documents
**Given** an Editor created a document from Template A, and an Admin later deletes Template A  
**When** the Editor opens their document  
**Then** the document opens with full content intact; the deletion of the template has no effect on the document

**Category:** edge-case  
**Priority:** must-have

---

### AC-6: Template No Longer Available After Deletion
**Given** an Admin has deleted Template A  
**When** an Editor opens the "Start from template" dialog  
**Then** Template A no longer appears in the template list; only currently active templates are shown

**Category:** edge-case  
**Priority:** must-have

---

### AC-7: Empty Template Creates a Blank Document
**Given** an admin created a template with no content (saved with an empty body)  
**When** an Editor creates a document from that template  
**Then** the new document opens with an empty body and the template's name as the document title (or a default title if the template name is not used as the title); no error occurs

**Category:** edge-case  
**Priority:** should-have

---

### AC-8: Document Creation Failure Handled Gracefully
**Given** an Editor selects a template and confirms creation  
**When** the server fails to create the document (e.g., network error, server error)  
**Then** the user sees an inline error: "Failed to create document. Please try again." No partial document is created. The template selection dialog remains open so the user can retry without re-selecting.

**Category:** error-handling  
**Priority:** must-have

---

### AC-9: Template List Is Empty State Handled
**Given** no templates have been created by an Admin  
**When** an Editor opens the "Start from template" dialog  
**Then** the dialog displays an empty state: "No templates available. Ask your admin to create one." and offers a "Start from blank" fallback

**Category:** edge-case  
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** a request is made to the document creation endpoint (including template-based creation)  
**Then** the system returns 401 Unauthorized

**Category:** security  
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with the Viewer role  
**When** they attempt to create a document (blank or from template) via API or UI  
**Then** the system returns 403 Forbidden with the message: "You do not have permission to create documents."

**Category:** security  
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Network error during document creation | Error inline in dialog; no document persisted; dialog remains open | must-have |
| Template list fails to load | Inline error in dialog: "Unable to load templates. Try again or start from blank." | must-have |
| Template reference image URL is broken | Document opens normally; image placeholder shows broken-image icon; no creation failure | should-have |

### Performance
- **Response time:** Document creation from template completes (document opens in editor) within 2,000ms p95 for templates up to 500KB
- **Template list load:** Available templates list renders within 500ms p95 for up to 200 templates

### Security
- **Input validation:** The template ID passed at document creation is validated server-side; users cannot inject arbitrary content by manipulating the template reference
- **Authorization:** Document creation enforces Editor or Admin role at the API layer

### Accessibility
- Template selection dialog is keyboard-navigable; templates are selectable via keyboard; selection is announced to screen readers

## Open Questions
- **Commenter role:** Can a Commenter create a document from a template, or can Commenters never create documents? (Unconfirmed assumption — clarification needed from product)
- **Document title:** Does the new document inherit the template name as its title, or does the user specify a document name before/after creation?
- **Folder/project context:** Is the new document created in the editor's currently viewed project/folder, or does the user select a destination during creation?
- **Template preview:** Should the creation dialog show a preview of the template content before the user confirms? (UX decision — not specified)

---

# Acceptance Criteria: EXP-01 — Export Document as Markdown

## Refined Story Statement
As an **editor or commenter**, I want to export the current document as a Markdown (.md) file, so that I can use the document content in tools, wikis, and pipelines that consume Markdown.

## Assumptions
- Export is available to users with the can-comment role and above (Editor, Commenter, Admin); Viewers cannot export — **Confirmed by assumption** (G-13)
- Markdown export is generated server-side and delivered as a file download — **Unconfirmed**
- Images in the document are represented in the Markdown export as reference-URL image syntax `![alt](url)` — **Confirmed** follows from G-3 assumption
- Heading levels H1–H3 map to `#`, `##`, `###` in Markdown — **Confirmed by assumption** (G-6)
- Code blocks export with triple-backtick fencing and the language hint if one is present — **Unconfirmed**
- Tables export using GitHub Flavored Markdown (GFM) pipe-table syntax — **Unconfirmed**
- Export operates on the current saved state of the document, not unsaved local edits — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1 CRDT/OT framework | Out of Scope for this story — export reads persisted document state; CRDT session not required | — |
| G-2 WebSocket server | Out of Scope — export is a request/response operation; not real-time | — |
| G-3 Image/file storage | Addressed — AC-4 specifies images export as `![alt](reference-url)` Markdown syntax | AC-4 |
| G-4 Maximum document size | Addressed — AC-7 specifies timeout behavior for large documents; performance target is provisional pending G-4 resolution | AC-7, Open Question |
| G-5 Existing permissions model | Addressed — AC-AUTH-1 and AC-AUTH-2 enforce access control; AC-1 scopes export to can-comment and above | AC-AUTH-1, AC-AUTH-2, AC-1 |
| G-6 Heading levels | Addressed — AC-2 specifies H1–H3 → `#`, `##`, `###` mapping | AC-2 |
| G-7 LWW conflict unit | Out of Scope — export story | — |
| G-8 Undo across concurrent edits | Out of Scope — export story | — |
| G-9 Offline duration limit | Out of Scope — export story | — |
| G-10 Version history restore | Out of Scope — export operates on current version; exporting a historical version is not in scope for v1 | Open Question |
| G-11 Comment resolution | Out of Scope — comments are not included in Markdown export (body text only) | AC-5 |
| G-12 Suggestion mode ownership | Out of Scope — export story | — |
| G-13 Export permissions | Addressed — AC-1 and AC-AUTH-2 enforce can-comment-and-above restriction on export | AC-1, AC-AUTH-2 |
| G-14 Template instantiation model | Out of Scope — export story | — |
| G-15 Maximum concurrent editors | Out of Scope — export story | — |
| G-16 Notification model | Out of Scope — no notification on export in v1 | — |
| G-17 Mobile/responsive support | Out of Scope for v1 — mobile export not in scope; export button may not be present on mobile UI per MOB-01 scope | — |
| G-18 Document deletion mid-session | Out of Scope — if document is deleted while an export is in progress, the export request returns 404 | AC-8 |

## Acceptance Criteria

### AC-1: Export Is Accessible to Editor, Commenter, and Admin
**Given** an authenticated user with the Editor, Commenter, or Admin role is viewing a document  
**When** they open the document action menu or toolbar  
**Then** an "Export" option is present, and selecting it presents format choices including "Markdown (.md)"

**Category:** happy-path  
**Priority:** must-have

---

### AC-2: Markdown Heading Fidelity
**Given** a document contains headings at levels H1, H2, and H3  
**When** the document is exported as Markdown  
**Then** H1 headings export as `# `, H2 as `## `, and H3 as `### `, preserving the exact heading text

**Category:** happy-path  
**Priority:** must-have

---

### AC-3: Markdown Inline Formatting Fidelity
**Given** a document contains bold, italic, underline, and hyperlink text  
**When** the document is exported as Markdown  
**Then**:
- Bold text exports as `**text**`
- Italic text exports as `*text*`
- Underline text exports without Markdown underline (no native Markdown equivalent); underline is dropped with no error
- Hyperlinks export as `[link text](url)`

**Category:** happy-path  
**Priority:** must-have

---

### AC-4: Markdown Image Fidelity
**Given** a document contains images stored as reference URLs  
**When** the document is exported as Markdown  
**Then** each image exports as `![alt text](reference-url)` where `alt text` is the image's stored alt attribute (or an empty string if none was set)

**Category:** happy-path  
**Priority:** must-have

---

### AC-5: Comments and Suggestions Excluded from Export
**Given** a document has inline comments and/or pending suggestions  
**When** the document is exported as Markdown  
**Then** the exported file contains only the document body text with accepted formatting; inline comment markers, comment threads, and unaccepted suggestion text are not included in the export

**Category:** edge-case  
**Priority:** must-have

---

### AC-6: Code Block Fidelity
**Given** a document contains code blocks with optional language hints  
**When** the document is exported as Markdown  
**Then** each code block exports as a triple-backtick fenced block: ` ```language\n<code>\n``` ` with the language identifier if one was specified, or no identifier if none was set; code content is not modified

**Category:** happy-path  
**Priority:** must-have

---

### AC-7: Large Document Export Timeout Handling
**Given** a document exceeds the export processing time limit (provisional: 30 seconds server-side generation time)  
**When** an export as Markdown is requested  
**Then** the system returns an error response: "This document is too large to export right now. Please try again or contact support." The user is not left on an indefinitely loading state; the request times out within 35 seconds from the user's perspective.

**Category:** boundary  
**Priority:** must-have

---

### AC-8: Export Request on Deleted Document Returns 404
**Given** a document is deleted while a user is viewing it  
**When** the user initiates a Markdown export  
**Then** the export API returns 404 Not Found and the UI displays: "This document no longer exists."

**Category:** error-handling  
**Priority:** must-have

---

### AC-9: Export Failure Returns Clear Error
**Given** the server-side Markdown generation fails for any reason (internal error)  
**When** the user requests a Markdown export  
**Then** the UI displays an inline error: "Export failed. Please try again. If the problem persists, contact support." No partial or corrupt file is downloaded.

**Category:** error-handling  
**Priority:** must-have

---

### AC-10: Empty Document Exports as Empty Markdown File
**Given** a document has no body content  
**When** the user exports it as Markdown  
**Then** a valid, empty `.md` file is downloaded (zero bytes or containing only a document title line if the title is included); no error is thrown

**Category:** edge-case  
**Priority:** should-have

---

### AC-11: File Download Is Named After the Document
**Given** a user triggers a Markdown export  
**When** the file is delivered to the browser  
**Then** the downloaded filename is `<document-title>.md` where special characters in the title that are invalid in filenames (e.g., `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`) are replaced with a hyphen `-`

**Category:** happy-path  
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** a request is made to the Markdown export API endpoint  
**Then** the system returns 401 Unauthorized

**Category:** security  
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with the Viewer role  
**When** they attempt to access the Markdown export API endpoint  
**Then** the system returns 403 Forbidden with the message: "You do not have permission to export this document."

**Category:** security  
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Network drop during file download | Browser receives partial file; user must retry; UI shows no persistent loading state after 35s | must-have |
| Server internal error during generation | 500 returned; UI shows inline error; no file delivered | must-have |
| Document deleted mid-export | 404 returned; UI shows "document no longer exists" message | must-have |

### Performance
- **Response time:** Markdown export for documents up to 1MB of content completes and begins file download within 3,000ms p95
- **Scale:** Export endpoint must support 50 concurrent export requests without degradation (provisional until G-4 resolved)

### Security
- **Output safety:** The Markdown export pipeline must not expose server-side file paths, internal IDs, or user PII beyond the document content
- **Authorization:** Export permission is enforced at the API layer; cannot be bypassed by direct URL access

### Accessibility
- Export trigger is keyboard-accessible and labeled appropriately for screen readers (e.g., "Export document as Markdown")

## Open Questions
- **Export of historical versions:** Can a user export a specific version from version history as Markdown? Not in scope for this story; confirm for v1.
- **Underline handling:** Markdown has no native underline syntax. The AC specifies dropping underline silently — confirm this is acceptable or whether HTML `<u>` tags should be emitted instead.
- **Table export syntax:** GFM pipe tables assumed. Confirm this is the target flavor.
- **Document title in export:** Should the exported Markdown file include the document title as an H1 at the top, or start directly with document body content?
- **G-4 (max document size):** The 30-second timeout and 3,000ms p95 targets are provisional. Final values depend on G-4 resolution.

---

# Acceptance Criteria: EXP-02 — Export Document as PDF

## Refined Story Statement
As an **editor or commenter**, I want to export the current document as a PDF file, so that I can share a visually formatted, read-only version with stakeholders who do not have access to the document editor.

## Assumptions
- PDF export is generated server-side via a headless rendering service (e.g., Pandoc, Puppeteer, or a dedicated export microservice); this is a technical implementation assumption — **Unconfirmed** (implementation detail, but affects AC behavior)
- Export is available to can-comment and above; Viewers cannot export — **Confirmed by assumption** (G-13)
- Images render in the PDF as their reference URL content (G-3 assumption) — **Confirmed by assumption**
- Comments and unaccepted suggestions are excluded from the PDF export (body text only) — **Unconfirmed**
- PDF is rendered in a standard page format (A4 or Letter); page size is not user-configurable in v1 — **Unconfirmed**
- Code blocks in PDF use a monospace font and are visually distinct from prose — **Unconfirmed**
- Headings H1–H3 are rendered at distinct visual sizes in the PDF — **Confirmed by assumption** (G-6)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1 CRDT/OT framework | Out of Scope — PDF export reads persisted document state | — |
| G-2 WebSocket server | Out of Scope — PDF export is request/response | — |
| G-3 Image/file storage | Addressed — AC-4 specifies images render from reference URLs in PDF; broken image URLs produce placeholder | AC-4 |
| G-4 Maximum document size | Addressed — AC-8 specifies timeout and large-document error behavior; targets provisional pending G-4 | AC-8, Open Question |
| G-5 Existing permissions model | Addressed — AC-AUTH-1 and AC-AUTH-2 enforce access control | AC-AUTH-1, AC-AUTH-2, AC-1 |
| G-6 Heading levels | Addressed — AC-2 specifies H1–H3 render at distinct visual hierarchy in PDF | AC-2 |
| G-7 LWW conflict unit | Out of Scope — export story | — |
| G-8 Undo across concurrent edits | Out of Scope — export story | — |
| G-9 Offline duration limit | Out of Scope — export story | — |
| G-10 Version history restore | Out of Scope — export operates on current version in v1 | Open Question |
| G-11 Comment resolution | Addressed — AC-5 specifies comments excluded from PDF export | AC-5 |
| G-12 Suggestion mode ownership | Addressed — AC-5 specifies unaccepted suggestions excluded from PDF export | AC-5 |
| G-13 Export permissions | Addressed — AC-1 and AC-AUTH-2 enforce can-comment-and-above | AC-1, AC-AUTH-2 |
| G-14 Template instantiation | Out of Scope — export story | — |
| G-15 Maximum concurrent editors | Out of Scope — export story | — |
| G-16 Notification model | Out of Scope — no notification on export in v1 | — |
| G-17 Mobile/responsive support | Out of Scope for v1 | — |
| G-18 Document deletion mid-session | Addressed — AC-9 specifies behavior when document is deleted during export | AC-9 |

## Acceptance Criteria

### AC-1: Export Is Accessible to Editor, Commenter, and Admin
**Given** an authenticated user with the Editor, Commenter, or Admin role is viewing a document  
**When** they open the export menu  
**Then** "PDF (.pdf)" is available as an export format option

**Category:** happy-path  
**Priority:** must-have

---

### AC-2: Heading Visual Hierarchy in PDF
**Given** a document contains H1, H2, and H3 headings  
**When** the document is exported as PDF  
**Then** H1 headings are rendered at the largest font size (e.g., 24pt equivalent), H2 at a visually smaller size (e.g., 18pt), and H3 smaller still (e.g., 14pt); all three heading levels are visually distinct from body text

**Category:** happy-path  
**Priority:** must-have

---

### AC-3: Inline Formatting in PDF
**Given** a document contains bold, italic, underline, and hyperlink text  
**When** the document is exported as PDF  
**Then**:
- Bold text renders in bold weight
- Italic text renders in italic style
- Underline text renders with underline decoration
- Hyperlinks render as styled clickable links in the PDF (blue underlined), preserving the URL

**Category:** happy-path  
**Priority:** must-have

---

### AC-4: Images Render from Reference URLs
**Given** a document contains images stored as reference URLs  
**When** the document is exported as PDF  
**Then** each image renders in the PDF at its stored dimensions (or constrained to page width if wider than the page); if a referenced image URL is inaccessible at export time, a placeholder box labeled "[Image unavailable]" is rendered in its place without blocking the export

**Category:** happy-path  
**Priority:** must-have

---

### AC-5: Comments and Suggestions Excluded
**Given** a document has inline comments, comment threads, and pending suggestions  
**When** the document is exported as PDF  
**Then** the exported PDF contains only accepted body text and formatting; comment markers, comment thread content, and unaccepted suggestion text are not included

**Category:** edge-case  
**Priority:** must-have

---

### AC-6: Code Blocks Render in Monospace
**Given** a document contains code blocks  
**When** the document is exported as PDF  
**Then** each code block renders in a monospace font (e.g., Courier or a system monospace equivalent), visually distinct from prose, with a background shade or border distinguishing it from surrounding text; code content is not modified or line-wrapped mid-word

**Category:** happy-path  
**Priority:** must-have

---

### AC-7: Tables Render with Grid Structure
**Given** a document contains tables  
**When** the document is exported as PDF  
**Then** each table renders with visible cell borders or alternating row shading, column headers are visually distinguished (bold or background color), and table content is readable without column overlap; tables wider than the page width are scaled down proportionally or wrapped across pages

**Category:** happy-path  
**Priority:** must-have

---

### AC-8: Large Document Export Timeout Handling
**Given** a document's content causes PDF generation to exceed 60 seconds server-side processing time  
**When** a user requests a PDF export  
**Then** the server terminates the generation and returns an error; the UI displays: "This document is too large to export as PDF right now. Try exporting a smaller section, or contact support." The user is not left in an indefinite loading state; the UI times out within 65 seconds from the user's perspective.

**Category:** boundary  
**Priority:** must-have

---

### AC-9: Export Request on Deleted Document Returns 404
**Given** a document is deleted while a user is viewing it  
**When** the user initiates a PDF export  
**Then** the export API returns 404 Not Found and the UI displays: "This document no longer exists."

**Category:** error-handling  
**Priority:** must-have

---

### AC-10: Rendering Service Unavailable
**Given** the server-side PDF rendering service is unavailable or returns an error  
**When** a user requests a PDF export  
**Then** the UI displays: "PDF export is temporarily unavailable. Please try again later." No partial or corrupt PDF file is delivered.

**Category:** error-handling  
**Priority:** must-have

---

### AC-11: File Downloaded with Correct Name and MIME Type
**Given** a user triggers a PDF export  
**When** the file is delivered to the browser  
**Then** the downloaded filename is `<document-title>.pdf` (special characters replaced with `-`), and the HTTP response includes `Content-Type: application/pdf`

**Category:** happy-path  
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** a request is made to the PDF export API endpoint  
**Then** the system returns 401 Unauthorized

**Category:** security  
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with the Viewer role  
**When** they attempt to access the PDF export API endpoint  
**Then** the system returns 403 Forbidden with the message: "You do not have permission to export this document."

**Category:** security  
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Rendering service returns 500 | UI shows "temporarily unavailable" error; no file download | must-have |
| Generation exceeds 60s | Server terminates; UI shows timeout error within 65s | must-have |
| Image URL inaccessible during rendering | Placeholder rendered; export completes; no failure | must-have |
| Document deleted mid-export | 404 returned; UI message shown | must-have |
| Network drop during file download | User must retry; UI shows no persistent loading state | should-have |

### Performance
- **Response time:** PDF export for documents up to 1MB of text content (excluding images) begins file download within 10,000ms p95
- **Scale:** Export service must queue and process 20 concurrent PDF export requests without dropping requests (provisional until G-4 resolved)

### Security
- **Server-side rendering isolation:** The PDF rendering service must not have access to internal network resources; URLs fetched for image rendering must be validated against an allowlist or sanitized to prevent SSRF
- **Authorization:** Export permission enforced at the API layer
- **Content sanitization:** The document content pipeline into the renderer must prevent injection of executable code through document content (e.g., JavaScript URLs in hyperlinks must be sanitized to `about:blank` or stripped)

### Accessibility
- The export action is keyboard-accessible and labeled for screen readers
- The resulting PDF should include document structure tags (headings, lists) where the rendering pipeline supports tagged PDFs — **should-have**, not must-have, depending on rendering service capability

## Open Questions
- **Page size:** A4 or US Letter? User-selectable or fixed in v1?
- **PDF rendering pipeline:** Which tool generates PDFs (Puppeteer, Pandoc, WeasyPrint, dedicated service)? Determines fidelity guarantees for tables and code blocks.
- **Historical version export:** Can users export a specific version from version history as PDF? Deferred to a future story if needed.
- **G-4 (max document size):** The 60-second timeout and 10,000ms p95 targets are provisional. Final values depend on G-4 resolution.
- **SSRF allowlist scope:** What domains are permitted for image URL fetching during PDF rendering? Requires security team input.

---

# Acceptance Criteria: EXP-03 — Export Document as DOCX

## Refined Story Statement
As an **editor or commenter**, I want to export the current document as a Microsoft Word file (.docx), so that collaborators who use Word can view, edit, and incorporate the content in their existing Office-based workflows.

## Assumptions
- DOCX export is generated server-side; the same rendering infrastructure used for PDF may handle DOCX or a separate tool (e.g., Pandoc) is used — **Unconfirmed**
- Export is available to can-comment and above; Viewers cannot export — **Confirmed by assumption** (G-13)
- Images render as embedded image objects in the DOCX file (not as reference URLs), to ensure the document is self-contained when opened in Word — **Unconfirmed** (differs from PDF assumption)
- The exported .docx is valid and openable in Microsoft Word 2016+ and Google Docs — **Unconfirmed**
- Comments and unaccepted suggestions are excluded from the DOCX export — **Unconfirmed**
- Headings H1–H3 map to Word Heading 1, Heading 2, Heading 3 styles — **Confirmed by assumption** (G-6)
- Code blocks map to a monospace style or a Word "Code" paragraph style — **Unconfirmed**
- Tables export as native Word tables — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1 CRDT/OT framework | Out of Scope — DOCX export reads persisted document state | — |
| G-2 WebSocket server | Out of Scope — export is request/response | — |
| G-3 Image/file storage | Addressed — AC-4 specifies images are fetched from reference URLs and embedded as binary objects in the DOCX file to make it self-contained | AC-4 |
| G-4 Maximum document size | Addressed — AC-8 specifies timeout behavior; targets provisional pending G-4 | AC-8, Open Question |
| G-5 Existing permissions model | Addressed — AC-AUTH-1 and AC-AUTH-2 enforce access control | AC-AUTH-1, AC-AUTH-2, AC-1 |
| G-6 Heading levels | Addressed — AC-2 specifies H1–H3 map to Word Heading 1/2/3 paragraph styles | AC-2 |
| G-7 LWW conflict unit | Out of Scope — export story | — |
| G-8 Undo across concurrent edits | Out of Scope — export story | — |
| G-9 Offline duration limit | Out of Scope — export story | — |
| G-10 Version history restore | Out of Scope — export operates on current version in v1 | Open Question |
| G-11 Comment resolution | Addressed — AC-5 specifies comments excluded from DOCX body | AC-5 |
| G-12 Suggestion mode ownership | Addressed — AC-5 specifies unaccepted suggestions excluded from DOCX | AC-5 |
| G-13 Export permissions | Addressed — AC-1 and AC-AUTH-2 enforce can-comment-and-above | AC-1, AC-AUTH-2 |
| G-14 Template instantiation | Out of Scope — export story | — |
| G-15 Maximum concurrent editors | Out of Scope — export story | — |
| G-16 Notification model | Out of Scope — no notification on export in v1 | — |
| G-17 Mobile/responsive support | Out of Scope for v1 | — |
| G-18 Document deletion mid-session | Addressed — AC-9 specifies behavior when document is deleted during export | AC-9 |

## Acceptance Criteria

### AC-1: DOCX Export Accessible to Editor, Commenter, and Admin
**Given** an authenticated user with the Editor, Commenter, or Admin role is viewing a document  
**When** they open the export menu  
**Then** "Word Document (.docx)" is available as an export format option

**Category:** happy-path  
**Priority:** must-have

---

### AC-2: Headings Map to Word Heading Styles
**Given** a document contains H1, H2, and H3 headings  
**When** the document is exported as DOCX  
**Then** H1 maps to the Word "Heading 1" paragraph style, H2 to "Heading 2", H3 to "Heading 3"; when opened in Microsoft Word, the headings appear in the document navigation pane

**Category:** happy-path  
**Priority:** must-have

---

### AC-3: Inline Formatting in DOCX
**Given** a document contains bold, italic, underline, and hyperlink text  
**When** the document is exported as DOCX  
**Then**:
- Bold text renders in bold weight in Word
- Italic text renders in italic style in Word
- Underline text renders with underline decoration in Word
- Hyperlinks render as clickable hyperlinks in Word, preserving the URL and display text

**Category:** happy-path  
**Priority:** must-have

---

### AC-4: Images Embedded as Binary Objects
**Given** a document contains images stored as reference URLs  
**When** the document is exported as DOCX  
**Then** each image is fetched from its reference URL at export time and embedded as a binary image object inside the `.docx` file; the exported DOCX is self-contained and displays images when opened without internet access; if a reference URL is inaccessible at export time, a placeholder "[Image unavailable]" text is inserted in its place without blocking the export

**Category:** happy-path  
**Priority:** must-have

---

### AC-5: Comments and Suggestions Excluded from DOCX Body
**Given** a document has inline comments, comment threads, and pending suggestions  
**When** the document is exported as DOCX  
**Then** the exported DOCX contains only accepted body text and formatting; inline comment markers and unaccepted suggestion text are not present in the document body or as Word comments

**Category:** edge-case  
**Priority:** must-have

---

### AC-6: Lists Export as Native Word Lists
**Given** a document contains bulleted and numbered lists  
**When** the document is exported as DOCX  
**Then** bulleted lists use Word's native bullet list style and numbered lists use Word's native numbered list style; list items are formatted as proper Word list paragraphs (not plain paragraphs with manual bullets or numbers)

**Category:** happy-path  
**Priority:** must-have

---

### AC-7: Code Blocks Export with Monospace Style
**Given** a document contains code blocks  
**When** the document is exported as DOCX  
**Then** each code block's content is rendered in a monospace font (e.g., Courier New or equivalent) and in a visually distinct paragraph style (e.g., shaded background or bordered box if the DOCX generation pipeline supports it); code content is preserved verbatim

**Category:** happy-path  
**Priority:** must-have

---

### AC-8: Tables Export as Native Word Tables
**Given** a document contains tables  
**When** the document is exported as DOCX  
**Then** each table exports as a native Word table object with the same number of rows and columns; table header rows are formatted with bold text or a distinct background; all cell content is preserved; the resulting table is editable in Word

**Category:** happy-path  
**Priority:** must-have

---

### AC-9: Large Document Export Timeout Handling
**Given** a document's DOCX generation exceeds 60 seconds server-side  
**When** a user requests a DOCX export  
**Then** the server terminates the generation; the UI displays: "This document is too large to export as Word right now. Please try again or contact support." The UI timeout occurs within 65 seconds from the user's perspective.

**Category:** boundary  
**Priority:** must-have

---

### AC-10: Document Deleted During Export Returns 404
**Given** a document is deleted while a user is viewing it  
**When** the user initiates a DOCX export  
**Then** the export API returns 404 Not Found and the UI displays: "This document no longer exists."

**Category:** error-handling  
**Priority:** must-have

---

### AC-11: Rendering Failure Returns Clear Error
**Given** the DOCX rendering service fails for any internal reason  
**When** a user requests DOCX export  
**Then** the UI displays: "Word export failed. Please try again. If the problem persists, contact support." No partial or corrupt .docx file is delivered.

**Category:** error-handling  
**Priority:** must-have

---

### AC-12: File Downloaded with Correct Name and MIME Type
**Given** a user triggers a DOCX export  
**When** the file is delivered to the browser  
**Then** the downloaded filename is `<document-title>.docx` (special characters in the title replaced with `-`), and the HTTP response includes `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Category:** happy-path  
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** a request is made to the DOCX export API endpoint  
**Then** the system returns 401 Unauthorized

**Category:** security  
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with the Viewer role  
**When** they attempt to access the DOCX export API endpoint  
**Then** the system returns 403 Forbidden with the message: "You do not have permission to export this document."

**Category:** security  
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Rendering service returns 500 | UI shows "export failed" error; no file delivered | must-have |
| Generation exceeds 60s | Server terminates; UI shows timeout error within 65s | must-have |
| Image URL inaccessible during rendering | Placeholder text inserted; export completes | must-have |
| Document deleted mid-export | 404 returned; UI message shown | must-have |
| Corrupt DOCX produced (malformed XML) | Detect at generation time; return error rather than delivering broken file | must-have |

### Performance
- **Response time:** DOCX export for documents up to 1MB of text content begins file download within 15,000ms p95 (DOCX generation including image embedding is slower than Markdown)
- **Scale:** Export service processes 20 concurrent DOCX export requests without dropping requests (provisional until G-4 resolved)

### Security
- **SSRF prevention:** Image URLs fetched during DOCX generation must be validated against an allowlist; internal IP ranges (10.x, 172.16-31.x, 192.168.x) must be blocked to prevent SSRF
- **Content isolation:** The rendering pipeline must not expose secrets or internal paths in the generated file
- **Authorization:** Export permission enforced at the API layer

### Accessibility
- The export action is keyboard-accessible and labeled for screen readers
- The exported DOCX should include semantic structure (heading styles, list styles) so that assistive technologies in Word can navigate it

## Open Questions
- **DOCX rendering pipeline:** Which tool generates the DOCX (Pandoc, python-docx, LibreOffice headless)? The AC for code block and table styling depends on the toolchain's capabilities.
- **Image embedding vs. reference URLs:** The AC specifies embedding images for self-containment. If embedding fails (e.g., the image is very large), should the export fall back to a reference URL? Confirm behavior.
- **Word styles:** Should the DOCX use Word's built-in Normal, Heading 1/2/3 styles, or custom styles scoped to a custom template? Affects compatibility with the recipient's Word stylesheet.
- **G-4 (max document size):** The 60-second timeout and 15,000ms p95 targets are provisional.
- **Historical version export:** Can users export a specific version as DOCX? Deferred to future story.

---

# Acceptance Criteria: SESSION-01 — Deletion Mid-Session Handling

## Refined Story Statement
As an **editor or commenter** who is actively viewing or editing a document, I want to be immediately notified in-app when that document is deleted by another user, so that I understand why my session ended, am not confused by a broken or unresponsive editor state, and can take appropriate action.

## Assumptions
- When a document is deleted, all active collaboration sessions for that document are terminated immediately — **Confirmed by assumption** (G-18)
- Editors are notified via an in-app message (modal or persistent banner); no email notification is sent for deletion in v1 — **Confirmed by assumption** (G-16 deferred notifications)
- The deleting user (if they are themselves in the session) also sees the confirmation that the document has been deleted — **Unconfirmed**
- A document can only be deleted by a user with the Admin role or the document owner (Editor who created it) — **Unconfirmed** (depends on permissions model; G-5 deferred)
- If an editor has local unsaved/queued changes when the document is deleted, those changes are irrecoverably lost (no recovery mechanism in v1) — **Unconfirmed**; this is a significant UX risk
- Offline editors (users who are disconnected at the time of deletion) are notified the next time they attempt to reconnect to the document — **Confirmed by assumption** (follows from G-18)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1 CRDT/OT framework | Addressed — AC-5 specifies CRDT session must be cleanly terminated on document deletion; the mechanism is implementation-defined but the behavior requirement is stated | AC-5 |
| G-2 WebSocket server | Addressed — AC-1 and AC-2 require the server to broadcast a deletion event to all connected clients; depends on WebSocket infrastructure | AC-1, AC-2 |
| G-3 Image/file storage | Out of Scope — image cleanup on document deletion is a storage story; not in scope here | — |
| G-4 Maximum document size | Out of Scope — deletion does not depend on document size | — |
| G-5 Existing permissions model | Addressed — AC-AUTH-2 enforces that only authorized users can delete a document; however, the specific role required (Admin vs. document owner) is an open question pending G-5 resolution | AC-AUTH-2, Open Question |
| G-6 Heading levels | Out of Scope — session story | — |
| G-7 LWW conflict unit | Out of Scope — session story | — |
| G-8 Undo across concurrent edits | Out of Scope — session story | — |
| G-9 Offline duration limit | Addressed — AC-6 specifies behavior when a user is offline when the document is deleted | AC-6 |
| G-10 Version history restore | Out of Scope — restore is not possible for deleted documents in v1 | AC-3 (version history is also destroyed on deletion) |
| G-11 Comment resolution | Out of Scope — session story | — |
| G-12 Suggestion mode ownership | Out of Scope — session story | — |
| G-13 Export permissions | Out of Scope — session story | — |
| G-14 Template instantiation | Addressed — AC-7 confirms that documents created from templates are independent; deleting the source template does not trigger SESSION-01 behavior | AC-7 |
| G-15 Maximum concurrent editors | Addressed — AC-1 and AC-2 apply to all editors simultaneously regardless of count | AC-1, AC-2 |
| G-16 Notification model | Addressed — G-16 deferred email/in-app badge notifications to post-v1; SESSION-01 uses an in-app modal only, consistent with that deferral | AC-1 |
| G-17 Mobile/responsive support | Out of Scope for v1 | — |
| G-18 Document deletion mid-session | Addressed — this story exists entirely to resolve G-18 | All AC |

## Acceptance Criteria

### AC-1: Active Editors Notified Immediately on Document Deletion
**Given** one or more editors or commenters are actively viewing a document  
**When** a user with deletion permission deletes that document  
**Then** within 2 seconds, all currently connected users see an in-app modal dialog with the message: "This document has been deleted and your session has ended. Any unsaved changes have been lost." with a single button: "Back to Dashboard"

**Category:** happy-path  
**Priority:** must-have

---

### AC-2: All Active Sessions Are Terminated
**Given** a document is deleted while users are in an active collaboration session  
**When** the deletion event is processed  
**Then** the WebSocket connections for all session participants are closed by the server; the editor UI is no longer interactive (all editing controls are disabled or hidden); no further edits can be submitted to the deleted document from any active session

**Category:** happy-path  
**Priority:** must-have

---

### AC-3: Version History and Comments Are Destroyed with Document
**Given** a document with version history and comments is deleted  
**When** the deletion is confirmed  
**Then** the document, its entire version history, all comments, and all collaboration session state are permanently removed; this data cannot be recovered through the version history UI

**Category:** edge-case  
**Priority:** must-have

---

### AC-4: Deleting User's Own Session Is Also Terminated
**Given** a user with deletion permission is themselves in the document session  
**When** they delete the document  
**Then** after confirming the deletion, they are redirected to the document dashboard (or shown a confirmation that the document was deleted); they do not remain on the now-deleted document's editor page

**Category:** edge-case  
**Priority:** must-have

---

### AC-5: CRDT Session State Is Cleaned Up on Server
**Given** a document with an active CRDT collaboration session is deleted  
**When** the deletion is processed  
**Then** the server clears all persisted CRDT state, operation queues, and session room associated with the deleted document; no orphaned session data remains in the collaboration service

**Category:** edge-case  
**Priority:** must-have

---

### AC-6: Offline User Notified on Reconnect Attempt
**Given** a user is offline (disconnected) at the time a document they were editing is deleted  
**When** the user's client reconnects and attempts to resume the session for that document  
**Then** the server returns a 404 or 410 Gone response; the client displays the message: "This document no longer exists. It may have been deleted while you were offline." with a "Back to Dashboard" button; any locally queued offline changes are discarded

**Category:** edge-case  
**Priority:** must-have

---

### AC-7: Template Deletion Does Not Trigger Session Termination for Documents
**Given** an admin deletes a template that was previously used to create one or more documents  
**When** the template deletion is processed  
**Then** no session termination event is sent to editors of documents created from that template; those documents are unaffected and remain fully editable

**Category:** edge-case  
**Priority:** must-have

---

### AC-8: Deletion Confirmation Dialog Prevents Accidental Deletion
**Given** a user with deletion permission clicks the "Delete Document" action  
**When** the confirmation dialog is shown  
**Then** the dialog explicitly warns: "Deleting this document is permanent and cannot be undone. All version history and comments will be deleted. Active editors will be disconnected." and requires an explicit "Delete" button click to proceed (clicking outside the dialog or pressing Escape cancels the action)

**Category:** happy-path  
**Priority:** must-have

---

### AC-9: Notification Delivery Failure Does Not Block Deletion
**Given** a document is deleted but the WebSocket broadcast to notify active sessions fails for one or more users (e.g., their connection dropped at that exact moment)  
**When** those users' connections eventually time out or they next attempt to interact with the document  
**Then** the server returns 404 for any requests to that document; the client detects this and displays the deletion message; the deletion itself was already committed regardless of notification delivery

**Category:** error-handling  
**Priority:** must-have

---

### AC-10: Export Request on Deleted Document Returns 404
**Given** a user initiates an export while the document is being deleted concurrently  
**When** the export API processes the request after deletion is committed  
**Then** the export returns 404 Not Found; the UI displays: "This document no longer exists."

**Category:** error-handling  
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present  
**When** a request is made to the document deletion endpoint  
**Then** the system returns 401 Unauthorized

**Category:** security  
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without document deletion permission  
**When** they attempt to call the document deletion API endpoint  
**Then** the system returns 403 Forbidden with the message: "You do not have permission to delete this document."

**Category:** security  
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| WebSocket broadcast fails for some users | Deletion commits; affected users see 404 on next interaction | must-have |
| User submits an edit in the same millisecond as deletion | Server rejects the edit with 404/410; client shows deletion modal | must-have |
| Concurrent deletion by two admins | First deletion succeeds; second returns 404 (already deleted); no double-delete error shown to users | must-have |

### Performance
- **Notification latency:** All active session members receive the deletion notification within 2,000ms of the deletion being committed on the server (p95 under normal load)
- **Session cleanup:** CRDT session state is fully cleaned up within 5,000ms of document deletion (p95); no orphaned sessions after this window

### Security
- **Authorization:** Deletion permission is enforced at the API layer; the specific roles that can delete (Admin only vs. Admin + document creator) must be specified pending G-5 resolution
- **Audit log:** Document deletion events must be recorded in an audit log with: timestamp, deleted document ID, deleting user ID, and count of sessions terminated

### Accessibility
- The deletion confirmation dialog is keyboard-navigable; the "Delete" and "Cancel" buttons are reachable via Tab; focus is trapped within the dialog while it is open
- The in-app session-terminated modal announced to screen readers via `aria-live` or focus management

## Open Questions
- **Who can delete a document?** The permissions model (G-5) is deferred. Until resolved, the specific roles permitted to delete are unspecified. The AC treats "user with deletion permission" as the actor. This must be defined before SESSION-01 can be fully tested.
- **Unsaved local changes on deletion:** The current AC states unsaved changes are lost. Should the system attempt to show the user what their pending changes were (e.g., in the deletion modal) so they can manually recover content? This is a significant UX trade-off.
- **Soft delete:** Is deletion permanent immediately, or is there a soft-delete/trash with a retention window? If soft-delete exists, session termination behavior may need to differ (session terminated but document recoverable).
- **Storage cleanup on deletion:** Are images and other referenced assets cleaned up from object storage when a document is deleted, or retained? Out of scope for this story but should be confirmed by the storage team.

---

## Coverage Summary

| # | Story Slug | AC Count | Auth AC | Gap Rows | Status |
|---|-----------|----------|---------|----------|--------|
| 1 | TMPL-01 | 11 (AC-1 through AC-11) | Yes (AUTH-1, AUTH-2) | 18 | Complete |
| 2 | TMPL-02 | 9 (AC-1 through AC-9) | Yes (AUTH-1, AUTH-2) | 18 | Complete |
| 3 | EXP-01 | 11 (AC-1 through AC-11) | Yes (AUTH-1, AUTH-2) | 18 | Complete |
| 4 | EXP-02 | 11 (AC-1 through AC-11) | Yes (AUTH-1, AUTH-2) | 18 | Complete |
| 5 | EXP-03 | 12 (AC-1 through AC-12) | Yes (AUTH-1, AUTH-2) | 18 | Complete |
| 6 | SESSION-01 | 10 (AC-1 through AC-10) | Yes (AUTH-1, AUTH-2) | 18 | Complete |
| **Total** | **6 stories** | **64 AC** | **All 6 stories** | **108 rows** | |

> **Note on batch input:** The "## Stories (batch 05 of 5)" section was present in the input header but the story definitions themselves were absent — the batch ended at the Coverage Check table from the decomposition. Stories TMPL-01, TMPL-02, EXP-01, EXP-02, EXP-03, and SESSION-01 were reconstructed from the Phase 5 implementation order and the full feature coverage table. If explicit story statements exist in the Story Decomposer's output, review the AC assumptions against those definitions and flag any divergence.


