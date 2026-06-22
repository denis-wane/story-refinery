# Story Decomposition

---

## Feature: Rich Text Editing

### EDITOR-001: Editor framework scaffold with Tiptap and Yjs binding
**As an** editor,
**I want** a Tiptap-based rich text editor embedded in the document view with a Yjs document bound to it,
**so that** I have a collaborative-ready editing canvas that all subsequent formatting and sync features can build on.

**Scope:**
- In: Tiptap editor initialized and rendered in the document view; Y.Doc instance created and bound to Tiptap via `@tiptap/extension-collaboration`; document loads from and auto-saves to backend (debounced); empty toolbar scaffold; 10MB document size cap enforced; 8MB warning surfaced to the user
- Out: Specific formatting extensions (EDITOR-002 through EDITOR-006); real-time multi-user sync (SYNC-001); image uploads; comments

**Dependencies:** DOC-001 (document persistence must exist to load/save); INFRA-001 will be wired in during SYNC-001
**Priority:** P1
**Size estimate:** M

---

### EDITOR-002: Core inline formatting
**As an** editor,
**I want** to apply bold, italic, underline, and heading levels (H1–H3) to selected text,
**so that** I can structure and emphasize content the way I would in any professional writing tool.

**Scope:**
- In: Bold, italic, underline toggles via toolbar buttons and keyboard shortcuts (Ctrl/Cmd+B, +I, +U); H1, H2, H3 heading marks via toolbar and `/` slash command trigger; formatting persisted in document model
- Out: Strikethrough, font color, font size (not in spec); lists, code blocks, tables (separate stories)

**Dependencies:** EDITOR-001
**Priority:** P1
**Size estimate:** S

---

### EDITOR-003: Bullet and numbered lists
**As an** editor,
**I want** to create bullet lists and numbered lists with support for nesting,
**so that** I can organize information hierarchically within a document.

**Scope:**
- In: Unordered bullet lists; ordered numbered lists; list indentation (tab/shift-tab for nesting); keyboard triggers (`-` or `*` for bullets, `1.` for numbered); toolbar buttons
- Out: Task/checklist lists (not in spec); custom list markers; list-to-table conversion

**Dependencies:** EDITOR-001
**Priority:** P1
**Size estimate:** S

---

### EDITOR-004: Code blocks and tables
**As an** editor,
**I want** to insert fenced code blocks with syntax highlighting and tables with editable rows and columns,
**so that** I can include technical content and structured data in project documents.

**Scope:**
- In: Fenced code blocks with language selector and client-side syntax highlighting; table insertion via toolbar; add/remove rows and columns; basic cell text editing; code blocks and table content persisted in Yjs document
- Out: Table cell merging, sorting, or CSV export; inline `code` spans (add if trivial, but not required); code block execution

**Dependencies:** EDITOR-001
**Priority:** P1
**Size estimate:** M

---

### EDITOR-005: Image embedding via S3-backed file storage
**As an** editor,
**I want** to upload images and embed them in a document as storage references,
**so that** I can include visual content without bloating the sync payload or hitting the document size cap.

**Scope:**
- In: Drag-and-drop and file-picker image upload; images stored in the existing S3-backed file storage (same service as task attachments); document stores a reference URL, not base64; image rendered inline in the editor; file-level size warning if a single image would push the document past 8MB
- Out: Inline base64 embedding; image resizing handles; embedding images from external URLs; offline image access while disconnected (OFFLINE-002)

**Dependencies:** EDITOR-001; existing S3 file storage service
**Priority:** P1
**Size estimate:** M

---

### EDITOR-006: Hyperlinks
**As an** editor,
**I want** to insert and edit hyperlinks on selected text,
**so that** I can reference external resources and internal pages directly from document content.

**Scope:**
- In: Insert link via dialog (URL + display text); edit or remove existing link; Ctrl/Cmd+K shortcut; links render as clickable in read/view mode; link data persisted in document model
- Out: Smart link previews or unfurls; internal cross-document links; link reachability validation

**Dependencies:** EDITOR-001
**Priority:** P2
**Size estimate:** S

---

### DOC-001: Single-user document persistence
**As an** editor,
**I want** my document to be saved automatically and restored when I return,
**so that** I never lose work between sessions before real-time collaboration is enabled.

**Scope:**
- In: Create document with a title; auto-save on edit (debounced write to backend); load document state from backend on open; document list/index view; document deletion by the creator/owner
- Out: Multi-user sync (SYNC-001); version history (VER-001); permission enforcement beyond creator-owns (PERM-001)

**Dependencies:** EDITOR-001
**Priority:** P1
**Size estimate:** M

---

## Feature: Permissions

### PERM-001: Per-document access tiers composing with workspace RBAC
**As a** document owner or admin,
**I want** to assign view-only, can-comment, or can-edit access to specific users on a document,
**so that** I can restrict sensitive documents below a user's default workspace role.

**Scope:**
- In: Three access tiers: view-only, can-comment, can-edit; per-document permissions are additive restrictions — most restrictive between workspace role and document role wins; workspace Members and above can be granted any tier; document Owner always retains full edit access; permission management UI on the document (Owner/Admin only); permission model stored as a per-document ACL that composes with workspace RBAC
- Out: Guest direct-invite flow (PERM-002); WebSocket-layer enforcement (PERM-003); export access gating (EXPORT-001)

**Dependencies:** Existing workspace RBAC model; DOC-001
**Priority:** P1
**Size estimate:** M

---

### PERM-002: Guest direct document invitation
**As an** admin or document owner,
**I want** to invite external collaborators as Guests scoped to a single document,
**so that** external stakeholders can participate in review without being granted workspace membership.

**Scope:**
- In: Admin or Owner can invite a user by email as a Guest; Guest access is scoped to that document only; Guest can be assigned view-only or can-comment tier (cannot receive can-edit without workspace membership, matching existing Guest pattern); invitation creates a document-scoped session token for the Guest
- Out: Email notification delivery (depends on existing notification infrastructure, not in scope here); workspace-level Guest management; Guest invite for can-edit tier

**Dependencies:** PERM-001; existing Guest role in workspace RBAC
**Priority:** P1
**Size estimate:** M

---

### PERM-003: Permission enforcement at WebSocket and API layers
**As the** platform,
**I want** document permissions enforced at both the REST API and the WebSocket/CRDT layers,
**so that** a view-only user cannot receive edit operations or inject unauthorized changes via any protocol path.

**Scope:**
- In: WebSocket connection auth check against document ACL at connect time; server rejects Yjs ops from sessions without can-edit permission; REST endpoints enforce appropriate tier per route; view-only and can-comment clients receive broadcasted document updates but cannot push Y.Doc operations; permission checks re-evaluated if ACL changes mid-session
- Out: Permission audit logging; rate limiting; transport encryption (handled by infra)

**Dependencies:** PERM-001; INFRA-001
**Priority:** P1
**Size estimate:** M

---

## Feature: Real-Time Synchronization

### INFRA-001: Dedicated WebSocket service with Redis pub/sub
**As the** platform,
**I want** a standalone WebSocket server that uses the existing Redis cluster for pub/sub message routing,
**so that** clients can maintain persistent connections for real-time sync without requiring a separate message broker or exposing document content outside our infrastructure.

**Scope:**
- In: New Node.js WebSocket service separate from the existing Express backend; Redis pub/sub for broadcasting ops to all nodes handling a given document room; JWT/session auth handshake at connect time; connection lifecycle management (join room, leave room, disconnect cleanup); health check endpoint; deployment configuration (Dockerfile or service manifest)
- Out: Yjs document logic (SYNC-001); presence channel (PRES-001); horizontal auto-scaling (design for it, don't automate it)

**Dependencies:** Existing Redis cluster; DevOps/deployment pipeline
**Priority:** P1
**Size estimate:** L

---

### SYNC-001: Yjs real-time document sync under 500ms
**As an** editor,
**I want** my edits to appear on all other connected editors' screens within 500ms,
**so that** collaborators can work on the same document simultaneously without confusion.

**Scope:**
- In: Yjs Y.Doc bound to the Tiptap editor; Yjs sync protocol (state vector + update exchange) over the WebSocket service (INFRA-001); server-side Y.Doc maintained as the authoritative state; document state initialized from server Y.Doc snapshot on client connect; ops persisted server-side after apply; sub-500ms propagation target under normal network conditions
- Out: Presence cursors (PRES-002); offline queuing (OFFLINE-001); manual conflict resolution UI (not needed — Yjs handles this)

**Dependencies:** EDITOR-001; INFRA-001; DOC-001
**Priority:** P1
**Size estimate:** L

---

### SYNC-002: Same-range conflict resolution with undo history preserved
**As an** editor,
**I want** concurrent edits to the same character range to be resolved automatically, with my undo history intact,
**so that** I can always recover my own changes if they were overwritten by a simultaneous edit.

**Scope:**
- In: Yjs CRDT merge handles non-overlapping concurrent edits automatically (no implementation needed beyond SYNC-001); same-range conflicts use Yjs's built-in tie-breaking (last-writer-wins by vector clock); Yjs UndoManager configured per-user so each editor's undo stack is independent and preserves their own overwritten operations
- Out: Manual conflict resolution UI (stakeholder explicitly rejected); cross-session offline conflicts (OFFLINE-002)

**Dependencies:** SYNC-001
**Priority:** P1
**Size estimate:** S

---

## Feature: Presence & Awareness

### PRES-001: Active user presence list
**As a** document user (any role),
**I want** to see who else is currently viewing or editing the document,
**so that** I know when colleagues are active and can coordinate in real time.

**Scope:**
- In: Avatar strip or side panel showing all connected users; distinction between viewing state (no cursor movement) and actively editing state; user name and avatar from workspace profile; presence updates within ~500ms of join/leave events; document-scoped only (no app-level or document-list presence)
- Out: "X people editing" badge in document list view (confirmed deferred by stakeholder); user activity beyond in-document state

**Dependencies:** INFRA-001; SYNC-001 (presence state carried via Yjs awareness protocol)
**Priority:** P1
**Size estimate:** S

---

### PRES-002: Colored cursor and selection overlays
**As an** editor,
**I want** to see other users' cursors and text selections rendered in their assigned colors with name labels,
**so that** I can see exactly where my collaborators are working without needing to ask.

**Scope:**
- In: Each connected user assigned a unique color at session start (consistent per user per document session); remote carets rendered at other users' cursor positions; remote text selections rendered as colored highlights; name label displayed near the caret; positions synced via Yjs awareness protocol
- Out: Cursor history trails; user-customizable colors; presence cursors for view-only users (they have no editable cursor position)

**Dependencies:** PRES-001; SYNC-001
**Priority:** P1
**Size estimate:** M

---

## Feature: Offline Editing & Sync

### OFFLINE-001: Local edit queue while disconnected
**As an** editor,
**I want** to continue editing a document when I lose internet connection, with my changes queued locally,
**so that** working from a plane or coffee shop doesn't force me to stop mid-thought.

**Scope:**
- In: Detect WebSocket disconnection and surface an "Editing offline — changes will sync when reconnected" indicator; Yjs Y.Doc continues accepting local operations; local Y.Doc state persisted to IndexedDB so edits survive a browser refresh while still offline; re-connection detection triggers OFFLINE-002
- Out: Image uploads while offline (blocked by network — surface a clear error deferring the upload); reconnect merge logic (OFFLINE-002)

**Dependencies:** SYNC-001
**Priority:** P1
**Size estimate:** M

---

### OFFLINE-002: Reconnect sync with automatic merge and toast notification
**As an** editor,
**I want** my offline edits to merge automatically with the server state when I reconnect, with a simple notification confirming it happened,
**so that** I don't have to manually reconcile changes or lose anyone else's work.

**Scope:**
- In: On reconnect, local Y.Doc diff sent to server using Yjs state vector exchange; server merges and broadcasts to other connected clients; offline image uploads re-queued and sent after reconnect; toast notification shown only if changes were actually merged: "X changes merged from your offline session"; no manual conflict resolution UI presented to the user
- Out: Merge conflict UI (stakeholder explicitly rejected); toast shown when zero changes merged

**Dependencies:** OFFLINE-001; SYNC-002
**Priority:** P1
**Size estimate:** M

---

## Feature: Version History

### VER-001: Automatic document snapshots with retention policy
**As an** editor,
**I want** the system to automatically save a version snapshot 5 minutes after my last edit,
**so that** recent work is always recoverable without any action on my part.

**Scope:**
- In: Server-side debounce: snapshot triggered 5 minutes after the most recent edit operation reaches the server; snapshot stores serialized Y.Doc state + rendered document content + timestamp + list of contributing users; automatic snapshots retained up to a maximum of 50 per document (oldest auto-snapshot pruned when the limit is exceeded); no snapshot created for idle sessions
- Out: Manual named snapshots (VER-002); version browser UI (VER-003); retention policy for manual snapshots (indefinite — covered in VER-002)

**Dependencies:** SYNC-001; DOC-001
**Priority:** P1
**Size estimate:** M

---

### VER-002: Manual named version snapshots
**As an** editor or document owner,
**I want** to save a named snapshot of the document at any point,
**so that** I can mark significant milestones and locate them easily later.

**Scope:**
- In: "Save version" action available to all can-edit users; optional name field (defaults to timestamp label if left blank); manual snapshots stored indefinitely (no pruning); manual snapshots visually distinguished from automatic snapshots in the history list
- Out: Version-level comments or descriptions; version-level sharing or access control; version diffing

**Dependencies:** VER-001
**Priority:** P1
**Size estimate:** S

---

### VER-003: Version history browser
**As an** editor or document owner,
**I want** to browse automatic and manual snapshots and preview their content,
**so that** I can identify the right version before deciding to restore it.

**Scope:**
- In: Side panel listing all snapshots sorted newest-first; metadata per entry: timestamp, name (if manual), contributing users, auto vs. manual badge; read-only content preview of a selected snapshot; "Restore this version" action that routes to VER-004
- Out: Side-by-side diff view; in-panel restore without confirmation (must go through VER-004 flow); snapshot deletion

**Dependencies:** VER-001; VER-002
**Priority:** P1
**Size estimate:** M

---

### VER-004: Non-destructive version restore with confirmation
**As an** editor or document owner,
**I want** to restore a previous snapshot as a new document version, with a confirmation step before anything changes,
**so that** I can recover from mistakes without risking a colleague's recent unsaved work.

**Scope:**
- In: "Restore" from VER-003 triggers a confirmation dialog: "This will create a new version at the top of history. Your current document will be saved first. Continue?"; on confirm: current HEAD is auto-snapshotted (labelled "Before restore"); selected snapshot's Y.Doc state applied as new HEAD and broadcast to all connected clients; restore event appears in version history labelled "Restored from [version name / timestamp]"
- Out: Branching history; partial restore (restoring only a section); restore by Commenters or Viewers

**Dependencies:** VER-003; SYNC-001
**Priority:** P1
**Size estimate:** M

---

## Feature: Comments & Suggestions (Track Changes)

### COMMENT-001: Inline comment creation on a text selection
**As a** commenter or editor,
**I want** to anchor a comment to a specific text selection in the document,
**so that** I can give feedback tied to the exact passage I'm referring to.

**Scope:**
- In: Select text → "Add comment" UI trigger (toolbar or context menu); comment input field; comment anchored to text range as a Yjs mark; comment persisted server-side; visible to all users with at least view-only access; author name and timestamp displayed
- Out: Threaded replies (COMMENT-002); comment resolution (COMMENT-003); suggestion mode (COMMENT-004)

**Dependencies:** EDITOR-001; SYNC-001; PERM-001
**Priority:** P1
**Size estimate:** M

---

### COMMENT-002: Threaded comment replies
**As a** user with at least can-comment access,
**I want** to reply to an existing comment thread,
**so that** discussion about a specific passage stays organized and in context rather than scattered.

**Scope:**
- In: Reply input field within the comment thread panel; replies displayed chronologically under the parent comment; all users with can-comment access or higher can reply; thread shows all replies with author name and timestamp; plain text replies only
- Out: @mention notifications; emoji reactions; rich text formatting in replies

**Dependencies:** COMMENT-001
**Priority:** P1
**Size estimate:** S

---

### COMMENT-003: Comment thread resolution
**As an** editor or document owner,
**I want** to mark a comment thread as resolved,
**so that** addressed feedback is archived without cluttering the active document view.

**Scope:**
- In: "Resolve" action on a thread, available to Editors and Owners only; resolved threads hidden from the editor view by default; accessible via a "Resolved" filter in the comments panel; resolution event syncs in real time to other connected users
- Out: Reopening resolved threads (deferred); deleting comments

**Dependencies:** COMMENT-002; COMMENT-006
**Priority:** P2
**Size estimate:** S

---

### COMMENT-004: Suggestion mode (track changes) for commenters
**As a** commenter,
**I want** to propose specific text changes to a document without being able to directly edit it,
**so that** external stakeholders can suggest wording without being granted edit access.

**Scope:**
- In: "Suggest" toggle available to users with can-comment access; edits made in suggest mode are stored as suggestions against the document (not applied directly to the Y.Doc); suggestions rendered as tracked changes — inserted text highlighted, deleted text struck through; suggestion author name and timestamp shown; all connected users can see suggestions in real time
- Out: Accepting or rejecting suggestions (COMMENT-005); suggestion mode for Editors making direct edits (Editors use direct editing; suggestion mode is for commenters)

**Dependencies:** COMMENT-001; PERM-001
**Priority:** P1
**Size estimate:** L

---

### COMMENT-005: Accept and reject suggestions
**As an** editor or document owner,
**I want** to accept or reject individual suggestions one at a time,
**so that** I can incorporate or discard proposed changes with a visible audit trail.

**Scope:**
- In: Accept and reject actions on each suggestion, available to can-edit users and Owners; accepting a suggestion applies the change to the Y.Doc and broadcasts to all connected clients; rejecting discards the suggestion; both events sync in real time; each action logged with the actioning user's name; one-by-one only
- Out: Bulk accept/reject (deferred to a later quarter); partial acceptance of a multi-word suggestion; suggestion diff viewer

**Dependencies:** COMMENT-004; SYNC-001
**Priority:** P1
**Size estimate:** M

---

### COMMENT-006: Real-time comment sync
**As a** reviewer,
**I want** new comments, replies, resolutions, and suggestion state changes to appear near-instantly for all connected users,
**so that** a live review session feels fluid without anyone needing to refresh the page.

**Scope:**
- In: All comment events (create, reply, resolve, suggestion accept/reject) broadcast to connected clients via the WebSocket service using the same Redis pub/sub infrastructure as document edits; server-authoritative append-only model — comments are not CRDT-merged; eventual consistency is acceptable (no 500ms SLA); feels live during an active session
- Out: Push notifications for comments when the user is not in the document; email digests

**Dependencies:** COMMENT-001; INFRA-001
**Priority:** P1
**Size estimate:** S

---

## Feature: Export

### EXPORT-001: Markdown export
**As an** editor or document owner,
**I want** to export a document as a Markdown file,
**so that** I can use the content in version control systems or other tools that consume Markdown.

**Scope:**
- In: "Export → Markdown" action available to Editors and Owners only; server-side conversion of Tiptap document JSON to Markdown; browser download triggered; headings, bold, italic, lists, code blocks, tables, links, and image references (S3 URLs) included in output; comments and suggestions excluded
- Out: Export for Viewers or Commenters (confirmed restricted by stakeholder); comment/suggestion annotations in export output

**Dependencies:** DOC-001; PERM-001
**Priority:** P2
**Size estimate:** S

---

### EXPORT-002: PDF export
**As an** editor or document owner,
**I want** to export a document as a PDF,
**so that** I can share a polished, read-only version with stakeholders who don't have platform access.

**Scope:**
- In: "Export → PDF" action available to Editors and Owners only; server-side headless render (Puppeteer or equivalent); full fidelity: headings, bold/italic, lists, code blocks (with syntax highlighting), tables, images (fetched from S3 and embedded), links; browser download triggered
- Out: Custom PDF branding or styles; comments or annotations in the PDF; export for Viewers or Commenters

**Dependencies:** DOC-001; PERM-001; EDITOR-002 through EDITOR-006 (all formatting types must be renderable)
**Priority:** P2
**Size estimate:** L

---

### EXPORT-003: DOCX export
**As an** editor or document owner,
**I want** to export a document as a DOCX file,
**so that** I can hand off content to stakeholders who work in Microsoft Word.

**Scope:**
- In: "Export → DOCX" action available to Editors and Owners only; server-side DOCX generation (docx library or pandoc); full fidelity: headings, bold/italic, lists, code blocks, tables, images (fetched from S3 and embedded), links; browser download triggered
- Out: Custom DOCX styles or themes; tracked changes or comments exported to DOCX; export for Viewers or Commenters

**Dependencies:** DOC-001; PERM-001; EDITOR-002 through EDITOR-006
**Priority:** P2
**Size estimate:** L

---

## Feature: Document Templates

### TMPL-001: Template creation and management for admins
**As an** admin,
**I want** to create, edit, and delete document templates using styled placeholder text,
**so that** my team has consistent starting points for common document types without a lot of setup ceremony.

**Scope:**
- In: Admin-only template management UI; templates authored using the full rich text editor (all EDITOR-* features available); placeholder text is regular text styled as a hint (e.g., "[Enter project goal here]") — not structured fields; templates listed in an admin panel with edit and delete actions; templates stored separately from regular documents
- Out: Template categories or tagging; template sharing across workspaces; template versioning; structured typed placeholder fields (explicitly deferred by stakeholder)

**Dependencies:** EDITOR-001 through EDITOR-006; PERM-001 (admin access gate)
**Priority:** P3
**Size estimate:** M

---

### TMPL-002: Create a new document from a template
**As an** editor,
**I want** to pick a template when creating a new document,
**so that** I start with the right structure and placeholder prompts instead of a blank page.

**Scope:**
- In: Template picker shown in the new-document creation flow; selected template's content copied into the new document as a starting state; the template itself is not modified; the new document is fully independent after creation; placeholder hint text is editable like any other text
- Out: Applying a template to an existing document; previewing template content before selecting; template search or filtering

**Dependencies:** TMPL-001; DOC-001
**Priority:** P3
**Size estimate:** S

---

## Dependency Map

| Story | Blocked By |
|-------|-----------|
| EDITOR-002 through EDITOR-006, DOC-001 | EDITOR-001 |
| SYNC-001 | EDITOR-001, INFRA-001, DOC-001 |
| SYNC-002 | SYNC-001 |
| PERM-002, PERM-003 | PERM-001 |
| PERM-003 | PERM-001, INFRA-001 |
| PRES-001 | INFRA-001, SYNC-001 |
| PRES-002 | PRES-001, SYNC-001 |
| OFFLINE-001 | SYNC-001 |
| OFFLINE-002 | OFFLINE-001, SYNC-002 |
| VER-001 | SYNC-001, DOC-001 |
| VER-002 | VER-001 |
| VER-003 | VER-001, VER-002 |
| VER-004 | VER-003, SYNC-001 |
| COMMENT-001 | EDITOR-001, SYNC-001, PERM-001 |
| COMMENT-002, COMMENT-003, COMMENT-004 | COMMENT-001 |
| COMMENT-003 | COMMENT-002, COMMENT-006 |
| COMMENT-005 | COMMENT-004, SYNC-001 |
| COMMENT-006 | COMMENT-001, INFRA-001 |
| EXPORT-001 through EXPORT-003 | DOC-001, PERM-001 |
| TMPL-001 | EDITOR-001 through EDITOR-006, PERM-001 |
| TMPL-002 | TMPL-001, DOC-001 |

---

## Suggested Implementation Order

**Phase 1 — Core Editing Foundation**
1. `EDITOR-001` — Editor scaffold; every other story depends on it
2. `DOC-001` — Single-user persistence; needed before sync or permissions can layer on
3. `EDITOR-002` — Core inline formatting
4. `EDITOR-003` — Lists
5. `EDITOR-004` — Code blocks and tables
6. `EDITOR-005` — Image embedding
7. `EDITOR-006` — Hyperlinks
8. `PERM-001` — Permission tiers; required before collaboration features can enforce access
9. `PERM-002` — Guest invitations; extends PERM-001 with external-collaborator pattern

**Phase 2 — Real-Time Collaboration**
10. `INFRA-001` — WebSocket service + Redis pub/sub; unblocks all sync and presence
11. `SYNC-001` — Yjs real-time sync; the core collaboration primitive
12. `SYNC-002` — Conflict resolution via UndoManager; minimal work on top of SYNC-001
13. `PERM-003` — Permission enforcement at WebSocket layer; must follow INFRA-001 and PERM-001
14. `PRES-001` — User presence list
15. `PRES-002` — Colored cursor overlays

**Phase 3 — Resilience & History**
16. `OFFLINE-001` — Offline edit queue; local-only, doesn't touch server logic
17. `OFFLINE-002` — Reconnect sync and auto-merge
18. `VER-001` — Automatic snapshots with retention policy
19. `VER-002` — Manual named snapshots
20. `VER-003` — Version history browser
21. `VER-004` — Non-destructive restore

**Phase 4 — Collaboration Layer**
22. `COMMENT-001` — Inline comment creation
23. `COMMENT-002` — Threaded replies
24. `COMMENT-006` — Real-time comment sync (wire up alongside comment persistence)
25. `COMMENT-003` — Thread resolution
26. `COMMENT-004` — Suggestion mode for commenters
27. `COMMENT-005` — Accept/reject suggestions

**Phase 5 — Export & Administration**
28. `EXPORT-001` — Markdown export (simplest render path)
29. `EXPORT-002` — PDF export (server-side headless render)
30. `EXPORT-003` — DOCX export (server-side generation)
31. `TMPL-001` — Template CRUD for admins
32. `TMPL-002` — New document from template

---

## Potential Additions

The following items were not in the original spec and have not been included:
- **Snapshot deletion** — No mechanism defined for removing individual manual snapshots; retention policy covers auto-snapshots only.
- **Email notifications for comments** — Not in spec. COMMENT-006 covers in-session sync only.
- **Inline `code` spans** — Not explicitly called out in spec (only code blocks). Trivial to add in EDITOR-004 if confirmed.
- **Bulk accept/reject suggestions** — Stakeholder confirmed this is a nice-to-have for a later quarter.
- **App-level presence badge in document list** — Stakeholder confirmed deferred.

---

## Coverage Check

| Feature from Analysis | Stories | Status |
|---|---|---|
| Rich Text Editing | EDITOR-001, EDITOR-002, EDITOR-003, EDITOR-004, EDITOR-005, EDITOR-006 | Covered |
| Real-Time Synchronization | INFRA-001, SYNC-001, SYNC-002 | Covered |
| Presence & Awareness | PRES-001, PRES-002 | Covered |
| Offline Editing & Sync | OFFLINE-001, OFFLINE-002 | Covered |
| Version History | VER-001, VER-002, VER-003, VER-004 | Covered |
| Comments & Suggestions (Track Changes) | COMMENT-001, COMMENT-002, COMMENT-003, COMMENT-004, COMMENT-005, COMMENT-006 | Covered |
| Permissions | PERM-001, PERM-002, PERM-003 | Covered |
| Document Templates | TMPL-001, TMPL-002 | Covered |
| Export | EXPORT-001, EXPORT-002, EXPORT-003 | Covered |
| Document persistence (cross-cutting infra) | DOC-001 | Covered — infrastructure prerequisite, not a standalone analysis feature but required by all features |
