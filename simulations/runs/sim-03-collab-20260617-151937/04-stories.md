# Story Decomposition

---

## Feature: Collaboration Infrastructure (Foundation — prerequisite for all other features)

### INFRA-001: Yjs collaboration service bootstrapping

**As a** platform engineer,
**I want** a dedicated WebSocket collaboration service backed by Yjs,
**so that** all document sync, conflict resolution, and offline merge capabilities have a reliable, scalable foundation to build on.

**Scope:**
- In: Deploy a standalone Node.js service with Yjs (`y-websocket` provider), JWT validation (trusts existing app JWT — no separate auth), health check endpoint, document room creation/teardown on connect/disconnect
- Out: Presence broadcasting, persistence, scaling to multiple instances, client-side integration

**Dependencies:** Existing JWT auth system (assumption G-5 resolved: shared session)
**Priority:** P1
**Size estimate:** M

---

### INFRA-002: Document persistence and Yjs state storage

**As a** platform engineer,
**I want** Yjs document state persisted to durable storage (database + blob store),
**so that** documents survive service restarts and can be loaded by clients joining mid-session.

**Scope:**
- In: Persist encoded Yjs `Y.Doc` state to blob storage (S3-compatible) on change (debounced); load and hydrate on room creation; document metadata record (id, owner, created_at, updated_at) in relational DB
- Out: Version snapshots (INFRA-003), ACL schema (PERM-001), media file storage (RTE-005)

**Dependencies:** INFRA-001
**Priority:** P1
**Size estimate:** M

---

## Feature: Rich Text Editing Engine

### RTE-001: Core inline formatting and block structure

**As an** editor,
**I want** to apply inline formatting (bold, italic, underline) and block-level structure (headings H1–H4, paragraph),
**so that** I can produce structured, readable documents without switching to a separate tool.

**Scope:**
- In: ProseMirror (or Tiptap) editor mounted in the app; toolbar with B/I/U toggles; heading block type selector; keyboard shortcuts (Cmd+B, Cmd+I, Cmd+U); plain-text paste sanitization
- Out: Sync (SYNC-001), images (RTE-005), tables (RTE-004), collaborative cursors (PRES-001)

**Dependencies:** INFRA-001 (editor integration point selected), INFRA-002
**Priority:** P1
**Size estimate:** M

---

### RTE-002: Bullet lists and numbered lists

**As an** editor,
**I want** to create bullet and numbered lists, including nested sub-lists,
**so that** I can organize information hierarchically without workarounds.

**Scope:**
- In: Bullet list node, ordered list node, list item nesting (Tab to indent, Shift+Tab to dedent), toolbar buttons, markdown-style shortcut (`- ` for bullet, `1. ` for numbered)
- Out: Checklist/task list (deferred as unspecified)

**Dependencies:** RTE-001
**Priority:** P1
**Size estimate:** S

---

### RTE-003: Code blocks

**As an** editor,
**I want** to insert monospaced code blocks with optional language label,
**so that** I can document technical content legibly without losing formatting.

**Scope:**
- In: Code block node with monospace rendering, language selector (display-only label — no syntax highlighting at launch), triple-backtick markdown shortcut, paste-as-code-block option
- Out: Syntax highlighting (deferred), inline code span is included

**Dependencies:** RTE-001
**Priority:** P2
**Size estimate:** S

---

### RTE-004: Tables

**As an** editor,
**I want** to insert and edit tables with rows and columns,
**so that** I can present structured data inline without embedding a spreadsheet.

**Scope:**
- In: Insert table (N×M), add/delete rows and columns, cell merging excluded, basic cell text content (inline formatting within cells)
- Out: Cell merging, sorting, formula evaluation

**Dependencies:** RTE-001
**Priority:** P2
**Size estimate:** M

---

### RTE-005: Inline images via reference storage

**As an** editor,
**I want** to upload images that appear inline in the document,
**so that** I can include visual content without leaving the editor.

**Scope:**
- In: Drag-and-drop or file picker upload → S3-compatible blob store → presigned URL embedded as image node attribute; max single image 10MB; display with optional alt text; resize by dragging corners
- Out: Inline base64 (explicitly excluded), video/file attachment embeds (unspecified)

**Dependencies:** RTE-001, existing blob storage service
**Priority:** P2
**Size estimate:** M

---

### RTE-006: Hyperlinks

**As an** editor,
**I want** to insert and edit hyperlinks on text selections,
**so that** I can reference external resources directly from document content.

**Scope:**
- In: Link tooltip on cursor hover (showing URL + edit/remove actions), link insertion dialog (URL + display text), auto-linkify pasted URLs, Cmd+K shortcut
- Out: Internal document cross-links (unspecified), link preview cards

**Dependencies:** RTE-001
**Priority:** P2
**Size estimate:** S

---

## Feature: Real-Time Collaboration Sync

### SYNC-001: Two-client real-time edit propagation

**As an** editor,
**I want** my edits to appear on a co-editor's screen within 500ms (p95),
**so that** we can work on the same document simultaneously without overwriting each other.

**Scope:**
- In: Yjs `y-websocket` provider wired to the ProseMirror/Tiptap editor binding (`y-prosemirror`); client connects to INFRA-001 WebSocket service on document open; local operations broadcast to server and relayed to all other connected clients; two-client smoke-test passing the 500ms p95 latency target
- Out: Presence cursors (PRES-001), conflict resolution policy (CONF-001), offline queue (OFFLINE-001), scaling beyond dev env

**Dependencies:** INFRA-001, INFRA-002, RTE-001
**Priority:** P1
**Size estimate:** M

---

### SYNC-002: Multi-client sync at target scale (25 editors, p99 <1s)

**As an** editor in a busy document session,
**I want** edits to remain fast and consistent when up to 25 people are editing simultaneously,
**so that** collaboration doesn't degrade as the team grows.

**Scope:**
- In: Load-test harness simulating 25 concurrent Yjs clients on a single document; server-side operation fan-out benchmarked against p95 ≤ 500ms and p99 ≤ 1s targets; any necessary server-side batching or throttling of high-frequency updates; document size ceiling enforced at 5MB (reject edits that would exceed it with an error message)
- Out: Horizontal scaling of the collab service (separate ops story), mobile clients

**Dependencies:** SYNC-001
**Priority:** P1
**Size estimate:** L

---

## Feature: Presence & Awareness

### PRES-001: Live remote cursors and selection highlights

**As an** editor,
**I want** to see other editors' cursors and text selections in the document in real time,
**so that** I know where collaborators are working and can avoid stepping on their edits.

**Scope:**
- In: Each connected client broadcasts cursor position and selection range via Yjs awareness (not persisted to document state); each remote user rendered with a colored cursor caret and name label (color derived from user ID hash); selection range shown as a translucent colored highlight; cursor updates throttled to ≤ 50ms intervals client-side
- Out: Cursor persistence, presence in version history, commenter cursors (same mechanism, covered by COMM-001)

**Dependencies:** SYNC-001, INFRA-001 (awareness channel)
**Priority:** P1
**Size estimate:** M

---

### PRES-002: Active viewers panel ("who's here")

**As an** editor or viewer,
**I want** to see a list of everyone currently viewing or editing the document,
**so that** I know who might see my changes and can coordinate verbally if needed.

**Scope:**
- In: Header or sidebar panel showing avatars/names of all connected users (editors and viewers); role badge (editing / viewing / commenting); user joins and leaves trigger panel update via awareness; max display of 8 avatars with "+N more" overflow
- Out: Notification when a specific person joins (unspecified), "last seen" timestamps (presence is ephemeral per INFRA-001)

**Dependencies:** PRES-001
**Priority:** P2
**Size estimate:** S

---

## Feature: Conflict Resolution

### CONF-001: Automatic merge of concurrent non-overlapping edits

**As an** editor,
**I want** concurrent edits to different parts of the document to merge automatically without any intervention,
**so that** collaborators don't interrupt each other when working in separate sections.

**Scope:**
- In: Yjs CRDT handles this natively for non-overlapping character ranges — this story covers writing automated tests that verify concurrent edits to distinct document sections (paragraphs, list items) merge correctly with no data loss or ordering artifacts; test coverage for ≥ 5 concurrent-edit scenarios
- Out: Same-range conflict policy (CONF-002), offline merge (OFFLINE-002)

**Dependencies:** SYNC-001
**Priority:** P1
**Size estimate:** S

---

### CONF-002: Last-writer-wins for same-range concurrent edits with local undo

**As an** editor,
**I want** to be able to undo my own edits independently of what other editors have done,
**so that** I can recover from my own mistakes without affecting others' work, even when we edited the same region.

**Scope:**
- In: Yjs CRDT last-writer-wins semantics apply for concurrent same-range edits (no additional code required — document behavior); local undo stack (UndoManager scoped to local origin) — undo reverts only the local user's operations, not any remote user's; redo follows same local scope; keyboard shortcuts Cmd+Z / Cmd+Shift+Z / Cmd+Y; undo history cleared on disconnect/reconnect (ephemeral)
- Out: Global undo (explicitly deferred — local undo only per stakeholder), undo in offline scenarios

**Dependencies:** SYNC-001, RTE-001
**Priority:** P1
**Size estimate:** S

---

## Feature: Offline Editing & Sync

### OFFLINE-001: Local edit queue while disconnected

**As an** editor with intermittent connectivity,
**I want** to continue editing a document when my network drops,
**so that** I don't lose work or have to stop mid-thought when I go offline.

**Scope:**
- In: Yjs `y-indexeddb` provider persists document state locally; browser detects disconnect and switches to local-only mode; editor remains fully functional (all RTE-001–RTE-006 features); offline banner displayed in the editor header; all edits since disconnect buffered in IndexedDB
- Out: Mobile offline (deferred per stakeholder for launch), sync-on-reconnect (OFFLINE-002)

**Dependencies:** SYNC-001, RTE-001
**Priority:** P1
**Size estimate:** M

---

### OFFLINE-002: Merge-on-reconnect with notification banner

**As an** editor returning from offline,
**I want** my offline edits to merge silently into the live document, with a notification if any of my changes may have been overwritten,
**so that** I don't need to manually resolve a diff but still know when to check version history.

**Scope:**
- In: On network restore, Yjs syncs local state with server state (CRDT merge); same-range conflicts resolved by Yjs last-writer-wins; after merge completes, display a non-blocking banner: "Your offline edits were merged. [N] changes may have been overwritten — view version history to recover." (N = count of same-range LWW resolutions); banner dismissible; banner links to VH-001
- Out: Manual merge UI (explicitly excluded per stakeholder), mobile offline merge (deferred)

**Dependencies:** OFFLINE-001, VH-001
**Priority:** P1
**Size estimate:** M

---

## Feature: Version History

### VH-001: Automatic 5-minute activity snapshots

**As a** document owner or editor,
**I want** the system to automatically save a snapshot of the document every 5 minutes of editing activity,
**so that** I can recover a recent state without remembering to manually save.

**Scope:**
- In: Server-side cron/timer per active document room: if any edits have been received in the last 5 minutes, write a full Yjs state snapshot to blob storage with a timestamp; snapshots retained for 90 days rolling; cap at 500 snapshots per document (oldest auto-snapshot deleted when cap hit); storage counted against tenant plan quota; named versions do not count toward the 500-snapshot cap
- Out: Named manual saves (VH-002), version browsing UI (VH-003), snapshot delta compression (deferred optimization)

**Dependencies:** INFRA-002, SYNC-001, existing tenant quota system
**Priority:** P2
**Size estimate:** M

---

### VH-002: Named manual version saves

**As an** editor,
**I want** to save a named version of the document at any point,
**so that** I can mark significant milestones and retrieve them without hunting through auto-snapshots.

**Scope:**
- In: "Save version" button in document header; optional name input (defaults to "Version — [timestamp]"); stored as a snapshot with `is_named: true` flag; named versions are retained indefinitely (until explicitly deleted by the owner); editor can delete a named version they created; document owner can delete any named version; confirmation dialog before deletion
- Out: Sharing a named version as a link (unspecified), named version count limit (none — retained indefinitely per stakeholder)

**Dependencies:** VH-001
**Priority:** P2
**Size estimate:** S

---

### VH-003: Version history browser and document restore

**As an** editor or document owner,
**I want** to browse the version history and restore the document to any past snapshot,
**so that** I can recover content that was lost or overwritten.

**Scope:**
- In: Version history sidebar (or modal) listing all snapshots (auto + named) in reverse-chronological order; each entry shows: timestamp, author of the save, "Named" badge if applicable; clicking a version shows a read-only preview of the document at that point; "Restore this version" creates a new auto-snapshot of the current state, then replaces the live document with the selected snapshot (so the current state is not lost); only editors and document owners can restore (viewers see read-only preview only)
- Out: Diff view between two versions (unspecified), restoring individual sections without replacing the whole document

**Dependencies:** VH-001, VH-002, PERM-001 (to check restore permission)
**Priority:** P2
**Size estimate:** L

---

## Feature: Comments & Suggestions

### COMM-001: Inline comments on text selections

**As a** commenter or editor,
**I want** to leave an inline comment anchored to a text selection,
**so that** I can give feedback on specific content without modifying the document body.

**Scope:**
- In: Highlight a text range → "Add comment" button appears in toolbar or margin; comment composer with plain text input; comment anchored to the Yjs selection range using Yjs relative positions (so the anchor moves correctly as the document is edited); comment appears as a highlighted text range with a margin indicator; comment data stored in the app database (not in the Yjs document state) with: document_id, anchor range, author, body, created_at, status=open; data model includes a `mentions` JSON field (empty at launch, reserved for @mention follow-on)
- Out: Comment threads/replies (COMM-002), comment resolution (COMM-002), @mention notifications (deferred)

**Dependencies:** SYNC-001, PERM-001 (role check: can-comment and above)
**Priority:** P2
**Size estimate:** M

---

### COMM-002: Comment threads, resolution, and archived view

**As an** editor or commenter,
**I want** to reply to comments, mark them resolved, and view archived resolved comments,
**so that** discussions are traceable and don't clutter the active document once addressed.

**Scope:**
- In: Reply thread on a comment (flat thread, no nested replies); any can-edit user or the original comment author can mark a comment resolved; resolved comments archived (status=resolved, not deleted); "Show resolved" toggle in comments panel reveals archived comments; comments panel lists all open comments in document order; clicking a comment in panel scrolls to and highlights the anchor in the document
- Out: @mention notifications (deferred per stakeholder), email notifications on comments (unspecified at launch)

**Dependencies:** COMM-001
**Priority:** P2
**Size estimate:** M

---

### SUGG-001: Suggestion mode (track changes)

**As a** commenter or editor,
**I want** to propose changes in suggestion mode rather than editing the document directly,
**so that** my proposed edits are visible as suggestions that others can review before accepting.

**Scope:**
- In: "Suggesting" toggle in the editor toolbar; when active, all insertions appear as green underlined text and all deletions appear as red strikethrough text; suggestions stored as Yjs marks with author metadata; the underlying document content is not committed until a suggestion is accepted; multiple authors can have overlapping suggestions; viewer sees the document with suggestion marks visible
- Out: Accepting/rejecting suggestions (SUGG-002), comments on suggestions (scope-extension deferred)

**Dependencies:** SYNC-001, RTE-001, PERM-001
**Priority:** P2
**Size estimate:** L

---

### SUGG-002: Accept and reject suggestions

**As an** editor,
**I want** to accept or reject individual suggestions,
**so that** the document converges to a clean final state after collaborative review.

**Scope:**
- In: Each suggestion has an Accept / Reject button visible to any can-edit user; Accept commits the change (removes mark, content becomes permanent); Reject discards the change (removes mark, restores original); accept/reject is broadcast to all connected clients via Yjs; accepted/rejected suggestions log to the version history system (logged as a note on the next auto-snapshot, not a separate snapshot)
- Out: Bulk accept-all / reject-all (deferred), accepting partial suggestion (must accept/reject the whole suggestion unit)

**Dependencies:** SUGG-001, PERM-001
**Priority:** P3
**Size estimate:** M

---

## Feature: Document Permissions

### PERM-001: Per-document ACL data model

**As a** platform engineer,
**I want** a new ACL data layer that supports per-document permission grants to individual users and Okta groups,
**so that** document-level access control can be enforced independently of the project-level role.

**Scope:**
- In: New `document_acl` table: `(document_id, principal_type [user|okta_group], principal_id, role [view|comment|edit])` with unique constraint on `(document_id, principal_type, principal_id)`; role precedence: explicit grant wins over project-level default (most permissive explicit grant applies when multiple grants exist); Okta group membership resolved at request time via existing Okta integration; migration script; no UI in this story
- Out: Permission assignment UI (PERM-002), enforcement middleware (PERM-003), Okta group sync service (assumed pre-existing)

**Dependencies:** INFRA-002, existing Okta integration
**Priority:** P1
**Size estimate:** M

---

### PERM-002: Document permission management UI

**As a** document owner or admin,
**I want** to assign view, comment, or edit access to specific users or Okta groups for a document,
**so that** I can control who can do what without changing project-wide roles.

**Scope:**
- In: "Share" button in document header opens a permissions dialog; search for users by name/email or Okta group by name; assign role (View / Comment / Edit) per principal; revoke access; current grants listed with principal name and role; document owner always retains edit access (cannot be revoked from the dialog); project-level inherited role shown as context ("inherits Edit from project")
- Out: Per-document permission for external users (outside the Okta directory — unspecified), link sharing (unspecified)

**Dependencies:** PERM-001
**Priority:** P1
**Size estimate:** M

---

### PERM-003: Permission enforcement in editor, API, and WebSocket service

**As a** platform engineer,
**I want** every API endpoint and WebSocket connection to enforce the document ACL,
**so that** view-only users cannot send edits and commenters cannot modify document body text.

**Scope:**
- In: REST API middleware checks effective role before serving document content, comments, suggestions, version history, and export; WebSocket service checks effective role on connect (view-only clients receive doc state but their operation broadcasts are rejected by server with an error message); frontend disables edit toolbar for view-only and comment-only users; comment toolbar disabled for view-only users
- Out: Audit log of permission check decisions (unspecified), row-level security in DB (implementation detail)

**Dependencies:** PERM-001, SYNC-001, COMM-001
**Priority:** P1
**Size estimate:** M

---

## Feature: Document Templates

### TMPL-001: Admin publishes a workspace template

**As a** workspace admin,
**I want** to publish a document as a workspace-wide template,
**so that** any team member can start a new document from a consistent structure without rebuilding it each time.

**Scope:**
- In: "Publish as template" action in document options menu, available to admin role only; requires a template name and optional description; published template stores a snapshot of the current document Yjs state and metadata (name, description, author, published_at); template listed in the workspace template gallery; updating or unpublishing a template does not affect documents already created from it (copy-at-instantiation model)
- Out: Template versioning (unspecified), template categories/tags (unspecified), editor personal templates (TMPL-002)

**Dependencies:** INFRA-002, PERM-001 (admin role check)
**Priority:** P3
**Size estimate:** M

---

### TMPL-002: Editor saves a personal template from their own document

**As an** editor,
**I want** to save any document I own as a personal template,
**so that** I can reuse my own document structures without asking an admin to publish them.

**Scope:**
- In: "Save as personal template" action in document options menu, available to editors (not viewers or commenters); personal templates are visible only to their creator; personal template gallery is separate from the workspace gallery; naming and description same as TMPL-001; personal templates not subject to admin approval
- Out: Sharing a personal template with others (unspecified), converting a personal template to a workspace template via this flow (admin must use TMPL-001 on a new document)

**Dependencies:** TMPL-001 (data model reused)
**Priority:** P3
**Size estimate:** S

---

### TMPL-003: Create a new document from a template

**As an** editor,
**I want** to start a new document pre-populated from a workspace or personal template,
**so that** I don't have to manually re-create recurring document structures.

**Scope:**
- In: "New document" flow offers "Start from template" option; template gallery shows workspace templates (all users) and personal templates (current user only); selecting a template creates a new document by copying the stored Yjs snapshot — the template is not linked (changes to the template have zero effect on the new document); new document opens in the editor with all template content editable; template placeholder text (if any) is just regular editable content
- Out: Guided placeholder highlighting ("fill in this field") — unspecified, deferred

**Dependencies:** TMPL-001, TMPL-002, INFRA-002
**Priority:** P3
**Size estimate:** S

---

## Feature: Export

### EXP-001: Export document to Markdown

**As an** editor or viewer,
**I want** to export the current document as a Markdown file,
**so that** I can use the content in other tools that accept Markdown.

**Scope:**
- In: "Export" menu in document header with "Markdown (.md)" option; available to all roles (view-only included, per stakeholder decision); converts current live document state (not a snapshot) using Yjs → ProseMirror → Markdown serializer; headings, bold, italic, underline (rendered as HTML `<u>` tag), lists, code blocks, links, tables (GitHub-flavored Markdown table syntax), images (rendered as `![alt](presigned-url)`); file download triggered in browser
- Out: Exporting a specific version (deferred), stripping images from export (unspecified option)

**Dependencies:** RTE-001–RTE-006, PERM-003 (role check before export)
**Priority:** P2
**Size estimate:** S

---

### EXP-002: Export document to PDF

**As an** editor or viewer,
**I want** to export the document as a PDF,
**so that** I can share a print-ready version with stakeholders who don't have access to the tool.

**Scope:**
- In: "Export → PDF" option in export menu; server-side rendering via headless Chromium (Puppeteer): load the document in a headless browser using the read-only viewer route, print to PDF; images embedded via presigned URLs (fetched by headless browser); A4 page size default; export triggers as a background job with a loading indicator, then downloads on completion; max export timeout: 60 seconds (returns error if exceeded)
- Out: Custom page size selection, PDF/A compliance, watermarking (unspecified)

**Dependencies:** EXP-001 (export menu pattern), PERM-003
**Priority:** P3
**Size estimate:** L

---

### EXP-003: Export document to DOCX

**As an** editor or viewer,
**I want** to export the document as a Word (.docx) file,
**so that** I can hand off content to stakeholders or collaborators who work in Microsoft Office.

**Scope:**
- In: "Export → Word (.docx)" option in export menu; server-side conversion using Pandoc (Markdown → DOCX pipeline via EXP-001's Markdown serializer as intermediate format); headings, bold, italic, lists, code blocks, tables, links included; images embedded as inline pictures in the DOCX; file download on completion
- Out: Preserving tracked changes / suggestions in DOCX format (mapping is lossy — suggestions stripped and a note added to the document header warning of this), custom DOCX styles/themes

**Dependencies:** EXP-001, PERM-003
**Priority:** P3
**Size estimate:** M

---

## Dependency Map

- **INFRA-001** ← all sync, presence, offline stories
- **INFRA-002** ← all persistence-dependent stories (versions, comments, permissions, templates)
- **RTE-001** ← RTE-002 through RTE-006, SYNC-001 (editor binding)
- **SYNC-001** ← SYNC-002, PRES-001, CONF-001, CONF-002, OFFLINE-001, SUGG-001
- **PERM-001** ← PERM-002, PERM-003, COMM-001, VH-003, TMPL-001
- **OFFLINE-001** ← OFFLINE-002
- **VH-001** ← VH-002, VH-003, OFFLINE-002
- **COMM-001** ← COMM-002
- **SUGG-001** ← SUGG-002
- **TMPL-001** ← TMPL-002, TMPL-003
- **EXP-001** ← EXP-002, EXP-003

---

## Suggested Implementation Order

1. **INFRA-001** — Everything requires the Yjs WebSocket service
2. **INFRA-002** — Document persistence required before any state can survive
3. **PERM-001** — ACL data model needed before enforcement can be wired anywhere; unlocks all other P1 permission work in parallel
4. **RTE-001** — Core editing; prerequisite for all rich-text stories
5. **SYNC-001** — First real-time wiring; validates the INFRA-001/RTE-001 integration
6. **PERM-002, PERM-003** — Permission UI and enforcement (can proceed in parallel after PERM-001 + SYNC-001)
7. **CONF-001, CONF-002** — Conflict guarantees validated while PERM stories land
8. **SYNC-002** — Scale validation; run this before shipping
9. **RTE-002, RTE-003, RTE-005, RTE-006** — Parallel: fill out rich text (RTE-004/Tables after RTE-002)
10. **PRES-001** — Cursors; prerequisite for PRES-002
11. **PRES-002** — Viewers panel
12. **OFFLINE-001** — Local queue; prerequisite for OFFLINE-002
13. **VH-001** — Snapshots; prerequisite for VH-002, VH-003, OFFLINE-002
14. **VH-002, OFFLINE-002** — Can proceed in parallel after VH-001
15. **VH-003** — Version browser after VH-002
16. **COMM-001** — Inline comments
17. **COMM-002** — Threads and resolution after COMM-001
18. **SUGG-001** — Suggestion mode; after SYNC-001 and RTE-001 are stable
19. **SUGG-002** — Accept/reject after SUGG-001
20. **EXP-001** — Markdown export (simplest; unblocks EXP-002, EXP-003)
21. **EXP-002, EXP-003** — PDF and DOCX in parallel after EXP-001
22. **TMPL-001** — Workspace templates
23. **TMPL-002** — Personal templates (reuses TMPL-001 data model)
24. **TMPL-003** — Create from template

---

## Potential Additions (not in requirements — do not include without stakeholder sign-off)

- **@mention in comments** — explicitly deferred; data model in COMM-001 reserves `mentions` field. Requires notification infrastructure not yet specified.
- **Mobile offline support** — deferred at launch per stakeholder; iOS Safari IndexedDB behavior differs.
- **Syntax highlighting in code blocks** — not specified; easy to add later via ProseMirror plugin.
- **Link sharing / public documents** — not specified in requirements.
- **Checklist / task list node** — common in collaborative editors; not mentioned.
- **Audit log of permission changes** — not specified; security team may require it.

---

## Coverage Check

| Feature from Analysis | Stories | Status |
|---|---|---|
| Rich Text Editing Engine | RTE-001, RTE-002, RTE-003, RTE-004, RTE-005, RTE-006 | Covered |
| Real-Time Collaboration Sync | SYNC-001, SYNC-002 | Covered |
| Presence & Awareness | PRES-001, PRES-002 | Covered |
| Conflict Resolution | CONF-001, CONF-002 | Covered |
| Offline Editing & Sync | OFFLINE-001, OFFLINE-002 | Covered |
| Version History | VH-001, VH-002, VH-003 | Covered |
| Comments & Suggestions | COMM-001, COMM-002, SUGG-001, SUGG-002 | Covered |
| Document Permissions | PERM-001, PERM-002, PERM-003 | Covered |
| Document Templates | TMPL-001, TMPL-002, TMPL-003 | Covered (stakeholder clarification: editors can create personal templates — captured in TMPL-002, which was not in the original analyst output) |
| Export | EXP-001, EXP-002, EXP-003 | Covered |
| Collaboration Infrastructure (prerequisite) | INFRA-001, INFRA-002 | Covered — added as Phase 1 foundation stories; not a separate analyst feature but required to unlock all others |
