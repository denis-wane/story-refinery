# Story Decomposition

---

## Phase 0 — Infrastructure Spikes

These are not feature stories — they are time-boxed research tasks that unblock multiple downstream stories. They must complete before the stories they gate can be finalized.

---

### SPIKE-01: CRDT Framework Selection

**Goal:** Evaluate Yjs vs. Automerge (and alternatives) against the confirmed constraints: 5MB max document, 50 concurrent editors, offline merge, local-only undo, character-level LWW.

**Output:** ADR documenting the chosen library, integration approach, and any known limitations.

**Gates:** SYNC-01, SYNC-02, CONF-01, CONF-02, CONF-03, OFFL-01, OFFL-02

**Size estimate:** M (timeboxed to 3 days)

---

## Feature: Document Foundation

These stories establish the base document entity before any editing or collaboration is layered on. They are prerequisites for all other features.

---

### DOC-01: Create a new blank document

**As an** editor,
**I want** to create a new blank document within a project,
**so that** I have a persistent canvas to start writing.

**Scope:**
- In: "New document" action from project context; document gets a default title ("Untitled Document"); document is persisted to the database immediately on creation; document appears in the project's document list; creator is automatically granted edit permission
- Out: templates (TMPL-02), rich text content (EDIT-01+), collaboration (SYNC-01+), permissions UI (PERM-01)

**Dependencies:** Existing project data model; PERM-02 (permission check at creation time, but edit permission auto-granted to creator)
**Priority:** P1
**Size estimate:** S

---

### DOC-02: Open and navigate documents within a project

**As an** editor, commenter, or viewer,
**I want** to see the list of documents in a project and open one,
**so that** I can find and access the document I need to work on.

**Scope:**
- In: Document list view within project (title, last-modified, creator); click to open document in editor view; breadcrumb back to project; documents filtered by the user's permission level (users with no access cannot see the document in the list)
- Out: search/filter (future), folder organization (future), sorting beyond last-modified (future)

**Dependencies:** DOC-01, PERM-02
**Priority:** P1
**Size estimate:** S

---

## Feature: Rich Text Editing

All stories in this feature are single-user editing — no collaboration layer yet. SPIKE-01 must complete first so the editor is built on the chosen CRDT's data model from day one.

---

### EDIT-01: Inline text formatting and headings

**As an** editor,
**I want** to apply bold, italic, underline, and heading levels (H1, H2, H3) to selected text,
**so that** I can communicate structure and emphasis in my document.

**Scope:**
- In: Toolbar buttons and keyboard shortcuts (Ctrl/Cmd+B, I, U) for bold, italic, underline; heading picker for H1–H3; marks apply to current selection; marks render correctly in the editor view; desktop browsers only
- Out: H4–H6, strikethrough, highlight (future); mobile editing (explicitly out of scope for v1)

**Dependencies:** SPIKE-01 (editor built on CRDT data model), DOC-01
**Priority:** P1
**Size estimate:** M

---

### EDIT-02: Bullet and numbered lists

**As an** editor,
**I want** to create bullet and numbered lists with multi-level nesting,
**so that** I can organize enumerable items clearly in my documents.

**Scope:**
- In: Toolbar actions for bullet list and numbered list; Tab/Shift+Tab for nesting (up to 3 levels); list continuation on Enter; backspace at start of list item dedents or removes list marker; lists render correctly in editor
- Out: Task/checklist items (future), custom list styles (future)

**Dependencies:** EDIT-01
**Priority:** P1
**Size estimate:** S

---

### EDIT-03: Code blocks

**As an** editor,
**I want** to insert a code block with syntax-highlighted content,
**so that** I can include technical content without it being interpreted as formatted prose.

**Scope:**
- In: Insert code block via toolbar or slash command; optional language selector for syntax highlighting (common languages: JS, Python, Go, SQL, Bash, JSON, plain text); monospace rendering; Tab inserts literal tab inside code block; code block is not editable with inline formatting marks
- Out: Inline `code` spans (separate, handled in EDIT-01 extension), line numbers (future), copy-to-clipboard button (future)

**Dependencies:** EDIT-01
**Priority:** P1
**Size estimate:** S

---

### EDIT-04: Tables

**As an** editor,
**I want** to insert and edit tables with rows and columns,
**so that** I can present structured comparative data inline in documents.

**Scope:**
- In: Insert table via toolbar (default 2×2, configurable at insert time); add/remove rows and columns via context menu; cell navigation via Tab/Shift+Tab; basic cell content (text, inline formatting only — no nested tables); header row toggle
- Out: Cell merging (future), column resizing (future), sorting (future), images in cells (future)

**Dependencies:** EDIT-01
**Priority:** P1
**Size estimate:** M

---

### EDIT-05: Image insertion via file upload

**As an** editor,
**I want** to insert images into a document by uploading a file,
**so that** I can illustrate content without leaving the document.

**Scope:**
- In: Drag-and-drop and file picker upload; supported formats: PNG, JPG, GIF, WebP; max file size: 10MB per image; image uploaded to S3-compatible storage; document stores the URL reference (not inline base64); image renders inline at natural size with optional resize handles (set width %); alt text field for accessibility
- Out: Pasting images from clipboard (future), embedding external URLs directly (future), image gallery or management (future)

**Dependencies:** EDIT-01; S3-compatible file storage bucket (existing infrastructure per stakeholder)
**Priority:** P2
**Size estimate:** M

---

### EDIT-06: Hyperlinks

**As an** editor,
**I want** to insert and edit hyperlinks on selected text,
**so that** I can reference external resources or other parts of the project.

**Scope:**
- In: Select text → insert link dialog (URL + optional display text); link editing and removal via context menu on existing link; links open in new tab; URL validation (must be a valid URL format); links render visually distinct from body text
- Out: Internal document cross-links (future), link previews/unfurling (future)

**Dependencies:** EDIT-01
**Priority:** P1
**Size estimate:** S

---

## Feature: Real-Time Collaboration Sync

Requires SPIKE-01 to be complete. Coordinate with Platform team before touching the WebSocket service.

---

### SYNC-01: WebSocket session management for document collaboration

**As an** editor or viewer,
**I want** the editor to establish and maintain a real-time connection when I open a document,
**so that** my client can send and receive changes as I and others edit.

**Scope:**
- In: Client opens WebSocket connection via existing Node.js WS service on document open; client joins a document-specific room; connection is authenticated using the user's existing session token; reconnection with exponential backoff on disconnect; connection teardown on document close or tab close; server enforces permission check at join time (view/comment/edit enforced at WS layer)
- Out: Connection status UI (handled in PRES-01), bandwidth throttling controls (future), analytics on session duration (future)

**Dependencies:** SPIKE-01; coordination with Platform team on WS service; DOC-01; PERM-02
**Priority:** P1
**Size estimate:** M

---

### SYNC-02: Real-time CRDT change propagation

**As an** editor,
**I want** my edits to appear on other users' screens within 500ms,
**so that** we can see each other's work in real time without page refreshes.

**Scope:**
- In: Local CRDT operations are broadcast to the document room via WebSocket; server applies and re-broadcasts to all connected clients; receiving clients apply remote operations to their local CRDT state; end-to-end latency target: < 500ms at P95 under normal network conditions (not guaranteed under severe packet loss); all 10 rich text types (EDIT-01 through EDIT-06) produce CRDT operations
- Out: Throttling/batching UI controls (future), per-user latency metrics (future)

**Dependencies:** SPIKE-01, SYNC-01, EDIT-01 (at minimum one edit type for integration testing)
**Priority:** P1
**Size estimate:** L

---

### SYNC-03: Server-side document state persistence

**As a** system,
**I want** the authoritative CRDT document state to be persisted server-side after every change,
**so that** documents survive server restarts and new clients can load the current state on join.

**Scope:**
- In: Server persists CRDT update log to the database (append-only log of CRDT operations); server computes and stores a periodic state snapshot for fast initial load; new client joining a room receives the current state snapshot + any updates since the snapshot; document state survives WS service restart
- Out: Version history snapshots (VER-01), full audit log (future)

**Dependencies:** SPIKE-01, SYNC-01; database schema for CRDT state
**Priority:** P1
**Size estimate:** M

---

## Feature: Presence & Awareness

---

### PRES-01: User presence list

**As a** editor or viewer,
**I want** to see a list of who else currently has the document open,
**so that** I know whether I'm editing alone or collaborating with others in real time.

**Scope:**
- In: Presence sidebar or avatar stack showing display name and avatar for each connected user; role badge indicating whether each user is viewing or editing; user appears in list within 2s of opening document; user disappears from list within 5s of closing document (heartbeat-based); shows up to 10 avatars with "+N more" overflow for documents with more than 10 concurrent users (designed for 50 P99 but UI doesn't need to show all 50 individually)
- Out: Clicking a presence avatar to jump to that user's cursor (future), user-to-user DM (future)

**Dependencies:** SYNC-01; PERM-02 (to determine viewer vs. editor badge)
**Priority:** P1
**Size estimate:** S

---

### PRES-02: Colored cursors and name labels

**As an** editor,
**I want** to see the real-time cursor position and text selection of other editors as colored overlays with name labels,
**so that** I can see exactly where others are working and avoid stepping on the same text.

**Scope:**
- In: Each connected editor gets a unique color assigned at session join (deterministic from user ID, consistent across sessions); remote cursors rendered as colored caret overlays; remote selections rendered as colored highlights; name label appears on hover or persistently near the caret; cursor positions update in real-time as users type; cursors are hidden for view-only users (Viewers have no cursor to show)
- Out: Following another user's cursor (future), cursor presence for commenters (commenters can comment but don't edit body text, so no editing cursor)

**Dependencies:** SYNC-01, SYNC-02, PRES-01
**Priority:** P1
**Size estimate:** M

---

## Feature: Conflict Resolution

These stories depend on SPIKE-01's output for the specific CRDT behaviors.

---

### CONF-01: Automatic merge for non-overlapping concurrent edits

**As an** editor,
**I want** edits I make in one part of the document to merge automatically with another editor's edits in a different part,
**so that** our work coexists without either of us losing changes.

**Scope:**
- In: CRDT handles concurrent inserts, deletes, and formatting changes in non-overlapping character ranges without data loss; both editors see the merged result converge to the same state; no user action required; this is verified through integration tests with two simultaneous clients
- Out: Same-range conflict UI (CONF-02), notification to users about merges (explicitly out of scope per stakeholder)

**Dependencies:** SPIKE-01, SYNC-02
**Priority:** P1
**Size estimate:** M (largely covered by CRDT library; story = integration + test coverage)

---

### CONF-02: Last-writer-wins resolution for same-range concurrent edits

**As an** editor,
**I want** the system to resolve conflicts when two users edit the same character range simultaneously by keeping the most recent write,
**so that** the document always converges to a consistent state.

**Scope:**
- In: LWW resolution at the character level (not word or paragraph); the edit with the later server-received timestamp wins for that character range; losing edit is dropped silently (no notification to the losing user — seeing text change in real time is sufficient per stakeholder); both clients converge to the same post-resolution state
- Out: Conflict notification UI (explicitly excluded), per-user conflict history (future)

**Dependencies:** SPIKE-01, SYNC-02, CONF-01
**Priority:** P1
**Size estimate:** S (CRDT library handles most of this; story = configuration + test coverage of edge cases)

---

### CONF-03: Local-only undo stack

**As an** editor,
**I want** Ctrl+Z / Cmd+Z to undo only my own recent edits,
**so that** I can correct my mistakes without accidentally reverting another editor's work.

**Scope:**
- In: Undo/redo applies only to the local user's CRDT operations; undoing a locally-applied operation that has already been merged does not revert remote changes to the same region — the undo is applied as a new CRDT operation (inverse of local op); redo works symmetrically; undo history is maintained per browser session (not persisted across page reloads)
- Out: Undoing another user's changes (explicitly excluded by stakeholder), persistent undo history across sessions (future)

**Dependencies:** SPIKE-01, SYNC-02
**Priority:** P1
**Size estimate:** M (local-only undo in a CRDT context is non-trivial; Yjs has built-in support)

---

## Feature: Offline Editing & Sync

---

### OFFL-01: Local edit queue while disconnected

**As an** editor,
**I want** to continue editing a document when my network connection drops,
**so that** network instability doesn't block my work.

**Scope:**
- In: Editor detects WebSocket disconnection and switches to offline mode; user can continue making edits; CRDT operations are queued locally in IndexedDB; UI shows a "You're offline — changes will sync when reconnected" banner; editing capability is not degraded while offline (same rich text features available)
- Out: Presence UI while offline (hidden or shows only local user), version snapshots while offline (paused)

**Dependencies:** SYNC-01, SYNC-02, SYNC-03
**Priority:** P1
**Size estimate:** M

---

### OFFL-02: Reconnect merge and divergence warning

**As an** editor,
**I want** my offline edits to automatically merge with server state when I reconnect,
**so that** my work isn't lost after a disconnection, and I'm warned if the gap is large enough to risk meaningful conflicts.

**Scope:**
- In: On reconnection, client replays queued CRDT operations against current server state; merge is always attempted regardless of offline duration; if the client was offline for more than 24 hours, display a warning: "You were offline for [duration] — your changes have been merged. Please review the document for conflicts."; merged state propagated to all connected clients; dismiss-able warning, no blocking action required from user
- Out: Refusing the merge (explicitly excluded by stakeholder), showing a diff of what changed server-side during offline period (future)

**Dependencies:** OFFL-01, CONF-01, CONF-02
**Priority:** P1
**Size estimate:** M

---

## Feature: Version History

---

### VER-01: Automatic snapshots on edit activity

**As an** editor,
**I want** the system to automatically save a snapshot of the document every 5 minutes of edit activity,
**so that** I can recover from mistakes or see how the document evolved without manually saving.

**Scope:**
- In: A snapshot is triggered after 5 cumulative minutes of edit activity (keystrokes, formatting changes) — wall-clock time between edits does not count; snapshots are stored as server-side state captures with a timestamp and the list of contributing editors in that interval; snapshots older than 30 days are automatically pruned if they are not named; named snapshots (VER-02) are never auto-pruned
- Out: Viewing snapshots (VER-03), naming from this view (VER-02), restoring from this view (VER-03)

**Dependencies:** SYNC-03
**Priority:** P1
**Size estimate:** M

---

### VER-02: Manual named version save

**As an** editor,
**I want** to save the current document state as a named version at any time,
**so that** I can mark meaningful milestones (e.g., "Ready for review") that I can reliably return to.

**Scope:**
- In: "Save version" action in document toolbar; prompts for optional version name (max 100 chars); if no name provided, defaults to timestamp; named version is saved immediately; named versions are never auto-pruned (30-day rule does not apply)
- Out: Comparing two named versions (future)

**Dependencies:** VER-01
**Priority:** P1
**Size estimate:** S

---

### VER-03: Version history browser and restore

**As an** editor,
**I want** to browse the version history of a document and restore the document to any previous version,
**so that** I can recover earlier states when edits go wrong.

**Scope:**
- In: Version history panel listing all snapshots (auto and named) in reverse chronological order with timestamp, version name (if set), and contributing editors; clicking a version opens a read-only preview of that version's content in a side-by-side or full-screen view; "Restore this version" action creates a new auto-snapshot of the current state, then creates a new named version from the selected historical state (restore does NOT overwrite — it appends per stakeholder); restored version is now the live document; all connected editors see the restoration as a new state update
- Out: Diff view between versions (future), selective restore of paragraphs (future)

**Dependencies:** VER-01, VER-02
**Priority:** P1
**Size estimate:** L

---

## Feature: Comments & Suggestions

---

### COMM-01: Inline comments on text selections

**As an** editor or commenter,
**I want** to add a comment to a selected region of text,
**so that** I can ask questions or leave feedback anchored to specific content without modifying the document body.

**Scope:**
- In: Select text → comment bubble/button appears; comment dialog with text input (plain text, no rich text in comments for v1); comment is anchored to the selected character range using CRDT position anchors (so comment stays attached as document is edited around it); comment thread shows comment author, timestamp, and text; comments are visible to all users with comment-or-above permission; Viewers cannot add comments; multiple comments can exist on overlapping or adjacent ranges
- Out: @-mentions within comments (handled in NOTIF-01), file attachments in comments (future), emoji reactions (future)

**Dependencies:** SYNC-02 (CRDT position anchors), PERM-02
**Priority:** P1
**Size estimate:** M

---

### COMM-02: Comment replies and resolution

**As an** editor or commenter,
**I want** to reply to comments and mark them as resolved when the discussion is complete,
**so that** comment threads have a clear lifecycle and the document doesn't accumulate stale open threads.

**Scope:**
- In: Reply to any existing comment thread; any user with view-or-above permission can read threads; any user with comment-or-above permission can reply; any editor (can-edit permission) or the original comment author can mark a thread as resolved; resolved threads are archived (not deleted) — stored and visible in a "Show resolved" toggle; resolved threads lose their in-document anchor highlight (document looks clean) but thread content is preserved; no un-resolving (editor can open a new comment if needed)
- Out: Re-opening resolved comments (use a new comment), deleting comments (comments are permanent for audit trail per stakeholder)

**Dependencies:** COMM-01, PERM-02
**Priority:** P1
**Size estimate:** M

---

### COMM-03: Suggestion mode (track-changes submission)

**As a** commenter or editor,
**I want** to submit edits as suggestions rather than direct changes,
**so that** my proposed modifications are visible to editors for review before being accepted into the document.

**Scope:**
- In: Toggle "Suggestion mode" in toolbar; while in suggestion mode, insertions are shown as green underlined text and deletions as red strikethrough text; suggestions are attributed to the user who made them; suggestions are CRDT operations stored as pending, not applied to the base document state until accepted; editors and commenters can submit suggestions; suggestions are visible to all users with view-or-above permission
- Out: Accepting/rejecting suggestions (COMM-04), suggestions in tables or code blocks (v1 scope: plain text and inline formatting only)

**Dependencies:** SYNC-02, PERM-02
**Priority:** P1
**Size estimate:** L

---

### COMM-04: Suggestion acceptance and rejection

**As an** editor,
**I want** to accept or reject individual suggestions made in suggestion mode,
**so that** I can incorporate or discard proposed changes while keeping the final editorial decision with editors.

**Scope:**
- In: Each pending suggestion has an Accept and Reject button visible to users with can-edit permission; accepting a suggestion applies the CRDT operation to the document body (the suggestion styling is removed, text becomes normal); rejecting a suggestion discards the pending operation (text reverts to pre-suggestion state); suggestion submitters (commenters and editors) can see the outcome but cannot accept/reject their own or others' suggestions unless they have editor permission; accepted/rejected suggestions are archived with the outcome and editor who acted
- Out: Bulk accept/reject all (future), suggestion author being notified of acceptance/rejection (tied to NOTIF-01 scope — email for @-mentions only in v1)

**Dependencies:** COMM-03, PERM-02
**Priority:** P1
**Size estimate:** M

---

### NOTIF-01: @-mention email notifications

**As a** commenter or editor,
**I want** to receive an email when someone @-mentions me in a comment, or when someone comments on a document I created,
**so that** I don't miss feedback that requires my attention.

**Scope:**
- In: @-mention syntax (`@username`) in comment text triggers an email to the mentioned user via SendGrid; when a new comment thread is created on a document, the document creator receives an email notification; emails include: document title, the comment text, the commenter's name, and a deep link back to the document at the anchored comment; emails are sent as a digest (batched within a 5-minute window to avoid flooding); email opt-out per document is available in document settings
- Out: In-app notification badges (explicitly out of scope for v1 per stakeholder), Slack/Teams notifications (future), mobile push (future), notification preferences beyond per-document opt-out (future)

**Dependencies:** COMM-01; SendGrid integration (existing per stakeholder)
**Priority:** P1
**Size estimate:** M

---

## Feature: Document Permissions

---

### PERM-01: Per-document permission management via Share UI

**As an** admin or document creator,
**I want** to assign view, comment, or edit permissions to individual users on a document,
**so that** I can control who can read, annotate, or modify the document using a familiar interface.

**Scope:**
- In: "Share" button on document opens the existing Share UI pattern (same UX as project boards per stakeholder); user search by name/email within the organization; assign permission level: View, Comment, Edit; remove a user's access; the document creator always has Edit; permission changes take effect immediately (existing WS sessions are re-validated on next operation); list of current permissions is visible to anyone with Edit access
- Out: Group/role-based permissions (future), permission inheritance from project (future), time-limited access (future)

**Dependencies:** DOC-01; existing Share UI component; existing resource-based ACL system
**Priority:** P1
**Size estimate:** M

---

### PERM-02: Permission enforcement in the editor

**As a** viewer, commenter, or editor,
**I want** the editor to enforce my permission level consistently — showing me what I can do and preventing what I can't —
**so that** access controls are reliable and I don't accidentally mutate content I shouldn't.

**Scope:**
- In: View-only: editor renders in read-only mode (no toolbar, no cursor, content is selectable for reading); Can-comment: toolbar replaced with comment-only controls; suggestion mode available; no body text editing; Can-edit: full editor toolbar; permission level is re-checked at document load, WebSocket join, and on each write operation server-side (defense in depth); attempting a disallowed action shows a clear message ("You have view-only access to this document")
- Out: Real-time permission change propagation mid-session (future; current session uses permission at join time, re-validation on reconnect)

**Dependencies:** PERM-01, SYNC-01
**Priority:** P1
**Size estimate:** M

---

### PERM-03: Public read-only share links

**As an** editor,
**I want** to generate a public link that allows anyone (without logging in) to view a document,
**so that** I can share documents with external clients or stakeholders who don't have accounts in our system.

**Scope:**
- In: "Get public link" option in Share UI; generates a unique, opaque URL token for the document; anyone with the URL can view the document in read-only mode without authenticating; public link access is logged (URL accessed, timestamp, IP); link can be revoked by an editor, invalidating the token; public viewers do not appear in the presence list; public viewers cannot comment, suggest, or export
- Out: Password-protected links (future), link expiration (future), analytics on public link views (future)

**Dependencies:** PERM-01, PERM-02
**Priority:** P1
**Size estimate:** M

---

## Feature: Document Templates

---

### TMPL-01: Admin creates a document template

**As an** admin,
**I want** to create and save a document template with pre-populated structure and placeholder content,
**so that** editors can start new documents with a consistent, reusable format instead of a blank page.

**Scope:**
- In: Admin can access a "Templates" management section; create a template using the full rich text editor (all EDIT-01 through EDIT-06 features available); template has a name, optional description, and optional category tag; template is saved to a global template library accessible to all users in the workspace; admin can edit and delete templates; templates are versioned (editing a template does not affect documents already created from it — one-time copy per stakeholder)
- Out: Per-project templates (future), template access controls beyond admin-create (future), template previews as rendered thumbnails (future)

**Dependencies:** EDIT-01 through EDIT-06; admin role in existing permissions model
**Priority:** P2
**Size estimate:** M

---

### TMPL-02: Create a document from a template

**As an** editor,
**I want** to choose a template when creating a new document,
**so that** I start with a useful structure and placeholder content instead of a blank page.

**Scope:**
- In: "New document" flow includes a template picker step (browse by category, search by name); selecting a template creates a new document with a deep copy of the template's CRDT content at the moment of creation (one-time copy — no link persists); the new document is fully editable immediately; template placeholders are regular editable text (no special placeholder mechanics); "Blank document" is always available as the default option
- Out: Live template links (explicitly excluded by stakeholder), applying a template to an existing document (future)

**Dependencies:** TMPL-01, DOC-01
**Priority:** P2
**Size estimate:** S

---

## Feature: Export

---

### EXP-01: Markdown export

**As an** editor or commenter,
**I want** to export a document as a Markdown file,
**so that** I can use the content in tools that accept Markdown (wikis, git repos, static sites).

**Scope:**
- In: "Export" menu in document toolbar; Markdown option available to users with can-comment permission or above (Viewers cannot export); server-side rendering: document CRDT state → Markdown string → `.md` file download; mapping: bold→`**`, italic→`*`, underline→`<u>` (no native Markdown equivalent, HTML fallback), H1–H3→`#/##/###`, bullet/numbered lists→`-/1.`, code blocks→` ``` `, tables→GFM table syntax, images→`![alt](url)`, links→`[text](url)`; exported file name defaults to document title
- Out: Exporting comments or suggestions (future), export customization options (future)

**Dependencies:** SYNC-03 (current doc state); PERM-02
**Priority:** P2
**Size estimate:** S

---

### EXP-02: PDF export

**As an** editor or commenter,
**I want** to export a document as a PDF,
**so that** I can share a print-quality, read-only version with people who need a fixed-format document.

**Scope:**
- In: PDF option in Export menu; available to can-comment and above; server-side headless rendering (not client-side print CSS); output is paginated with document title as header; all rich text formatting rendered faithfully; images included at stored S3 URL; tables and code blocks render correctly; PDF is generated asynchronously for large documents — user sees a "Preparing export…" state and receives a download link when ready; download link expires after 1 hour
- Out: Custom page size/margin settings (future), headers/footers with page numbers (future), exporting comments as annotations (future)

**Dependencies:** SYNC-03, PERM-02; headless rendering service (Puppeteer or equivalent — new infrastructure)
**Priority:** P2
**Size estimate:** L

---

### EXP-03: DOCX export

**As an** editor or commenter,
**I want** to export a document as a DOCX file,
**so that** I can hand off content to colleagues who work in Microsoft Word.

**Scope:**
- In: DOCX option in Export menu; available to can-comment and above; server-side generation; rich text formatting mapped to Word styles (H1–H3 → Heading 1–3 styles, bold/italic/underline → character formatting, lists → Word list styles, code blocks → monospace styled paragraph, tables → Word tables, images → inline image objects from S3 URL, links → Word hyperlink fields); asynchronous generation for large documents (same "Preparing export…" UX as EXP-02)
- Out: Tracked changes export (suggestion mode in DOCX format — future), comment export as DOCX comments (future), custom Word templates (future)

**Dependencies:** SYNC-03, PERM-02; DOCX generation library (e.g., python-docx or equivalent — new infrastructure, can share with EXP-02 service)
**Priority:** P2
**Size estimate:** L

---

## Feature: Mobile Read-Only Viewing

Stakeholder confirmed: desktop editing only for v1, but mobile viewing must work.

---

### MOB-01: Responsive read-only document view on mobile

**As a** viewer or editor on a mobile device,
**I want** to read a document on my phone without the editing toolbar,
**so that** I can reference document content when I'm away from my desk.

**Scope:**
- In: Document view on mobile (< 768px viewport) renders content in read-only mode regardless of permission level; rich text content is readable and properly formatted (headings, lists, code blocks, tables scroll horizontally); no editor toolbar rendered; comments are visible but not creatable; presence indicators are hidden on mobile; responsive layout matches the host application's existing mobile breakpoints
- Out: Mobile commenting (future), mobile editing (explicitly deferred to post-v1), mobile-specific gestures (future)

**Dependencies:** EDIT-01 through EDIT-06, PERM-02
**Priority:** P1
**Size estimate:** S

---

## Feature: Document Session Lifecycle

---

### SESSION-01: Document deletion with active collaborators

**As a** user editing a document,
**I want** to be notified immediately if the document I'm editing is deleted while I have it open,
**so that** I'm not silently working on a document that no longer exists.

**Scope:**
- In: When a document is deleted (by an admin or editor with delete permission), the server broadcasts a session termination event to all connected clients in that document's room; each connected client shows an in-app modal: "This document has been deleted by [user]. Your unsaved changes have been lost."; WebSocket session for that document is closed; client redirects to the project's document list after modal dismissal
- Out: Recovery of content from deleted document (future), soft-delete / trash bin (future)

**Dependencies:** SYNC-01, DOC-01
**Priority:** P2
**Size estimate:** S

---

## Potential Additions (not in original requirements — flagged only)

These were not in the requirements or analysis. Flagging here rather than silently including:

- **Document search** — full-text search across all documents in a project
- **Document move/copy** — moving a document between projects
- **Folder/collection organization** — grouping documents within a project
- **Notification preferences** — per-user email frequency controls beyond per-document opt-out
- **In-app mentions/notification center** — v2 per stakeholder

---

## Dependency Map

```
SPIKE-01
  └── EDIT-01 → EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06
  └── SYNC-01 → SYNC-02 → SYNC-03
                        └── CONF-01 → CONF-02
                                    → CONF-03
                                    → OFFL-01 → OFFL-02
                                    → VER-01 → VER-02 → VER-03
                        └── PRES-01 → PRES-02
  └── COMM-01 → COMM-02
             → COMM-03 → COMM-04
             → NOTIF-01
DOC-01 → DOC-02
       → PERM-01 → PERM-02 → PERM-03
                           → SYNC-01 (WS join enforcement)
       → TMPL-02
EDIT-01..06 → TMPL-01 → TMPL-02
SYNC-03 → EXP-01, EXP-02, EXP-03
SESSION-01 → SYNC-01
MOB-01 → EDIT-01..06, PERM-02
```

---

## Suggested Implementation Order

### Phase 0 — Unblock (complete before any feature work)
1. **SPIKE-01** — CRDT framework selection; everything depends on this architectural decision

### Phase 1 — Core Foundation (MVP, no collaboration)
2. **DOC-01** — Document creation; anchor for all other stories
3. **DOC-02** — Document navigation; needed to reach any document
4. **PERM-01** — Share UI and permission assignment; must exist before WS enforcement
5. **PERM-02** — Permission enforcement; gate on all editor actions
6. **EDIT-01** — Inline formatting + headings; baseline editing capability
7. **EDIT-02** — Lists; completes core prose editing
8. **EDIT-03** — Code blocks; blocks table work until editor is stable
9. **EDIT-04** — Tables; complex editor node, best done early while codebase is clean
10. **EDIT-06** — Hyperlinks; low-effort, high-value

### Phase 2 — Real-Time Collaboration
11. **SYNC-01** — WS session management; unblocks all collaboration stories
12. **SYNC-02** — CRDT change propagation; the core collaboration feature
13. **SYNC-03** — Server-side state persistence; without this, documents vanish on restart
14. **CONF-01** — Auto-merge for non-overlapping edits; emerges from CRDT integration
15. **CONF-02** — LWW for same-range conflicts; follows from CONF-01
16. **CONF-03** — Local-only undo; needed before releasing collaboration to users
17. **PRES-01** — Presence list; low-effort UX win, confirms WS is working
18. **PRES-02** — Colored cursors; collaboration flagship feature

### Phase 3 — Resilience & Quality
19. **OFFL-01** — Offline edit queue; protects against network drops
20. **OFFL-02** — Reconnect merge + warning; completes offline story
21. **VER-01** — Auto-snapshots; safety net before power users get the tool
22. **VER-02** — Manual named versions; unblocks VER-03
23. **VER-03** — Version history browser + restore; closes the version story end-to-end

### Phase 4 — Collaboration Features
24. **COMM-01** — Inline comments; unblocks all comment stories
25. **COMM-02** — Comment replies + resolution; makes comments useful at team scale
26. **COMM-03** — Suggestion mode submission; unblocks COMM-04
27. **COMM-04** — Suggestion accept/reject; closes track-changes end-to-end
28. **NOTIF-01** — @-mention email notifications; adoption driver per stakeholder

### Phase 5 — Platform & Polish
29. **PERM-03** — Public read-only share links; needed for external sharing
30. **MOB-01** — Mobile read-only view; low-friction addition at this point
31. **EDIT-05** — Image insertion; deferred because it requires S3 upload plumbing
32. **TMPL-01** — Admin creates templates; unblocks TMPL-02
33. **TMPL-02** — Create from template; closes the templates story
34. **EXP-01** — Markdown export; simplest export, quick win
35. **EXP-02** — PDF export; requires headless rendering service
36. **EXP-03** — DOCX export; shares infrastructure with EXP-02
37. **SESSION-01** — Deletion mid-session handling; edge case, low risk to defer

---

## Coverage Check

| Feature from Analysis | Stories | Status |
|---|---|---|
| Rich Text Editing | EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06 | Covered |
| Real-Time Collaboration Sync | SYNC-01, SYNC-02, SYNC-03 | Covered |
| Presence & Awareness | PRES-01, PRES-02 | Covered |
| Conflict Resolution | CONF-01, CONF-02, CONF-03 | Covered |
| Offline Editing & Sync | OFFL-01, OFFL-02 | Covered |
| Version History | VER-01, VER-02, VER-03 | Covered |
| Comments & Suggestions | COMM-01, COMM-02, COMM-03, COMM-04, NOTIF-01 | Covered |
| Document Permissions | PERM-01, PERM-02, PERM-03 | Covered (PERM-03 added from stakeholder correction on assumption #4 — public share links) |
| Document Templates | TMPL-01, TMPL-02 | Covered |
| Export | EXP-01, EXP-02, EXP-03 | Covered |
| Mobile Read-Only Viewing | MOB-01 | Covered (stakeholder confirmed: mobile viewing in, mobile editing out) |
| Document Foundation | DOC-01, DOC-02 | Covered (infrastructure prerequisite; not in original feature list but required for all others) |
| Document Session Lifecycle | SESSION-01 | Covered (from assumed G-18 in analysis) |
| Notifications | NOTIF-01 | Covered (stakeholder elevated from "nice to have" to P1 — email digest for @-mentions and document owner alerts via SendGrid) |
| Mobile editing | — | Deferred — explicitly out of scope for v1 per stakeholder |
| In-app notification badges | — | Deferred — explicitly out of scope for v1 per stakeholder |
| Guest / anonymous editing | — | Deferred — authenticated only; public read-only covered by PERM-03 |
