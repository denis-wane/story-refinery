# Story Decomposition

## Infrastructure (Cross-Cutting Prerequisites)

### INFRA-001: WebSocket service capacity spike
**As an** engineering team,
**I want** to validate whether our existing WebSocket infrastructure can sustain document-editing traffic at the 500ms propagation SLA,
**so that** we make an evidence-based build-vs-extend decision before committing to the sync architecture.

**Scope:**
- In: load test current WS service at simulated editing frequency (keystrokes, cursor moves); measure p50/p95 latency and max concurrent connections; produce a written recommendation (extend vs. dedicated service)
- Out: actual service provisioning, Yjs integration, any code changes to production

**Dependencies:** None — this is day-one work
**Priority:** P1
**Size estimate:** S

---

### INFRA-002: Dedicated y-websocket service
**As an** editor,
**I want** document changes routed through a dedicated WebSocket service backed by Yjs awareness,
**so that** the collaborative editing path is isolated from general notification traffic and can be scaled independently.

**Scope:**
- In: stand up y-websocket server (or equivalent Yjs provider backend); connect to existing document store for persistence; configure same-region deployment; define health check and restart policy
- Out: global/multi-region distribution (backlog for geo-expansion), load balancing beyond single-region, monitoring dashboards (separate infra story)

**Dependencies:** INFRA-001 (spike output determines whether this is a new service or an upgrade)
**Priority:** P1
**Size estimate:** M

---

### INFRA-003: Document-level permission table
**As an** application,
**I want** a dedicated schema table for document-level view/comment/edit grants per user,
**so that** document permissions are additive over workspace roles without coupling to or modifying the existing RBAC table.

**Scope:**
- In: new `document_permissions` table (document_id, user_id, permission_level enum: view/comment/edit); migration; read/write service layer; basic API endpoints (get permissions for doc, upsert permission for user)
- Out: UI for managing permissions (see PERM-002), enforcement in editor (see PERM-003), workspace-role gate (remains in existing system)

**Dependencies:** None (pure schema + service layer)
**Priority:** P1
**Size estimate:** S

---

## Feature: Rich Text Editing

### RICH-001: Tiptap editor with inline formatting
**As an** editor,
**I want** to apply inline formatting — bold, italic, underline, headings (H1–H3), and hyperlinks — to text in the document,
**so that** I can create structured, readable content without switching to a separate tool.

**Scope:**
- In: embed Tiptap editor; toolbar buttons and keyboard shortcuts for bold/italic/underline/headings/links; link insert/edit dialog with URL input; rendered output in editor canvas
- Out: block-level elements (lists, code blocks, tables — see RICH-002, RICH-003), collaborative sync (see SYNC-002), image embedding (see RICH-004)

**Dependencies:** INFRA-002 (Yjs document model must be initialized before editor mounts, even if sync is not yet wired)
**Priority:** P1
**Size estimate:** M

---

### RICH-002: Block-level elements — lists and code blocks
**As an** editor,
**I want** to insert bullet lists, numbered lists, and fenced code blocks into a document,
**so that** I can represent structured content and technical material with appropriate formatting.

**Scope:**
- In: Tiptap extensions for BulletList, OrderedList, CodeBlock (with language selector); toolbar buttons and markdown-shortcut triggers (e.g., `- `, `1. `, ` ``` `); correct rendering in editor
- Out: tables (see RICH-003), syntax highlighting within code blocks (nice-to-have, not v1 requirement)

**Dependencies:** RICH-001
**Priority:** P1
**Size estimate:** S

---

### RICH-003: Table insertion and editing
**As an** editor,
**I want** to insert a table and add/remove rows and columns,
**so that** I can present tabular data inline in the document.

**Scope:**
- In: Tiptap Table extension; toolbar insert-table dialog (rows × columns); row/column add and delete via context menu; cell selection and basic cell formatting (bold/italic)
- Out: merged cells, table borders styling, table import from clipboard spreadsheet (not v1)

**Dependencies:** RICH-001
**Priority:** P1
**Size estimate:** M

---

### RICH-004: Image upload and embedding via S3
**As an** editor,
**I want** to upload images into a document from my local machine,
**so that** I can embed visual content without storing binary data in the document itself.

**Scope:**
- In: image toolbar button that opens file picker; client-side validation (max 5MB per image, total embedded image cap 20MB per document); upload to existing S3 bucket via upload endpoint; store S3 URL as Tiptap Image node src; render image from CDN URL in editor; reject uploads that would exceed 20MB document cap with a clear error
- Out: offline image availability (images require network in v1), drag-and-drop upload (defer unless trivial), image resizing handles

**Dependencies:** RICH-001; S3/CDN infrastructure (already exists per stakeholder)
**Priority:** P1
**Size estimate:** M

---

## Feature: Real-Time Sync & Presence

### SYNC-001: Yjs document model and client integration
**As an** editor,
**I want** the Tiptap editor to be backed by a Yjs shared document,
**so that** all edits are represented in the CRDT model that enables conflict-free merging.

**Scope:**
- In: wire `@tiptap/extension-collaboration` (Yjs binding) to the Tiptap instance; initialize `Y.Doc` per document; connect to y-websocket provider; confirm that a single user's edits round-trip correctly through the Yjs model
- Out: multi-user sync verification (see SYNC-002), presence (see PRES-001), offline persistence (see OFFL-001)

**Dependencies:** INFRA-002 (y-websocket service), RICH-001
**Priority:** P1
**Size estimate:** M

---

### SYNC-002: Real-time change propagation between concurrent editors
**As an** editor,
**I want** to see changes made by other editors appear in my document within 500ms (same-region),
**so that** I can collaborate in real time without manual refresh.

**Scope:**
- In: multi-client sync via y-websocket; verify p95 propagation latency ≤ 500ms under simultaneous edits in same region (acceptance test with ≥ 2 clients); correct rendering of remote changes in the editor canvas
- Out: cross-region latency (backlog), conflict resolution edge cases (see CONF-001), offline handling (see OFFL-001)

**Dependencies:** SYNC-001
**Priority:** P1
**Size estimate:** M

---

### PRES-001: Cursor presence and active user list
**As an** editor or viewer,
**I want** to see colored cursors and name labels for other users currently active in the document, and a list of who is present,
**so that** I know who I'm collaborating with and where they are working.

**Scope:**
- In: `@tiptap/extension-collaboration-cursor` with per-user color and display name; sidebar or header panel listing users active in last 60 seconds; remove user from presence list after 60 seconds of inactivity; presence visible to Editors, Commenters, and Viewers
- Out: presence for users who have the tab open but are in a different browser tab/unfocused (60-second activity window resolves this per stakeholder), "typing" indicators beyond cursor position

**Dependencies:** SYNC-001, PERM-003 (presence display respects doc access)
**Priority:** P1
**Size estimate:** M

---

## Feature: Conflict Resolution

### CONF-001: Automatic merge and same-range last-writer-wins behavior
**As an** editor,
**I want** non-overlapping concurrent edits to merge automatically and same-range concurrent edits to apply the last received change,
**so that** I never face a manual merge conflict during real-time collaboration.

**Scope:**
- In: acceptance tests that verify (a) two editors editing different paragraphs simultaneously produces a document containing both edits; (b) two editors editing the same character range produces the last-received edit with undo history for both changes intact; configure Yjs awareness so server-relayed order determines "last writer" for same-range edits
- Out: a conflict resolution UI (explicitly deferred to v2 per stakeholder), any changes to Yjs core merge behavior (use defaults)

**Dependencies:** SYNC-002
**Priority:** P1
**Size estimate:** S

---

## Feature: Offline Editing & Reconnection Sync

### OFFL-001: Local edit capture while disconnected
**As an** editor,
**I want** to continue typing in the document when I lose network connectivity, with my edits persisted locally,
**so that** I don't lose work during brief connection drops.

**Scope:**
- In: configure `y-indexeddb` provider to persist the Yjs document to IndexedDB on every update; editor remains fully functional when y-websocket is disconnected; visual indicator (banner/icon) shown when offline; changes accumulated locally are not lost on page reload while offline
- Out: image uploads while offline (blocked by S3 requirement; queue and surface error), offline availability of S3-hosted images (explicitly out of scope v1)

**Dependencies:** SYNC-001
**Priority:** P2
**Size estimate:** L

---

### OFFL-002: Reconnection sync with server-wins notification
**As an** editor,
**I want** my offline edits to sync with the server when I reconnect, with server state winning on same-range conflicts and a visible notification when my change was superseded,
**so that** I know exactly what happened to my offline work without facing a manual merge UI.

**Scope:**
- In: on y-websocket reconnect, sync local IndexedDB state with server Yjs document; Yjs CRDT merges non-overlapping changes automatically; for same-range conflicts, server-relayed order determines the winner; display a non-blocking toast notification listing text ranges where the offline edit was superseded (e.g., "Your edit to paragraph 3 was overwritten by a change made while you were offline"); reconnect within a session and after page reload both handled
- Out: manual conflict resolution UI (v2), undo of server-wins override (standard undo history covers this if Yjs preserves it), same-range conflict detection UI

**Dependencies:** OFFL-001, CONF-001
**Priority:** P2
**Size estimate:** M

---

## Feature: Version History

### VERS-001: Automatic document snapshots
**As an** editor,
**I want** the system to automatically save a snapshot of the document every 5 minutes of edit activity,
**so that** recent versions are always recoverable without requiring manual action.

**Scope:**
- In: server-side async job that creates a snapshot of the Yjs document state (serialized) every 5 minutes after any edit activity; "5 minutes of activity" resets on first edit after 5 minutes of inactivity (i.e., idle time does not accumulate snapshot triggers); snapshots stored with timestamp and auto-generated label ("Auto-save 14:32"); snapshot count capped at 100 per document (oldest auto-snapshot pruned when cap is reached — see VERS-004)
- Out: manual snapshots (see VERS-002), browsing/restoring (see VERS-003), pruning job (see VERS-004)

**Dependencies:** SYNC-001 (Yjs document must be serializable)
**Priority:** P2
**Size estimate:** M

---

### VERS-002: Manual named snapshots
**As an** editor,
**I want** to save a named version of the document at any point,
**so that** I can mark a milestone (e.g., "Draft sent to legal") and return to it precisely.

**Scope:**
- In: "Save version" button in document toolbar; optional name input (default: timestamp if left blank); manual snapshots stored with user ID, timestamp, and name; manual snapshots are not counted against the 100-snapshot auto cap and are never auto-pruned
- Out: sharing a version link, comparing two versions (not v1)

**Dependencies:** VERS-001 (same snapshot storage mechanism)
**Priority:** P2
**Size estimate:** S

---

### VERS-003: Version history browse and restore
**As an** editor or admin,
**I want** to browse the list of saved versions and restore a previous version as the current document state,
**so that** I can recover from accidental deletions or unwanted edits.

**Scope:**
- In: version history panel (sidebar or modal) listing all auto and manual snapshots with timestamp, label, and author; preview of a past version (read-only); "Restore this version" action that replaces current document state and creates an automatic snapshot of the pre-restore state (so the restore is itself undoable via version history); accessible to Editors and Admins only
- Out: visual diff between versions (not v1), Viewers and Commenters accessing version history

**Dependencies:** VERS-001, VERS-002, PERM-003 (access gated to Editors/Admins)
**Priority:** P2
**Size estimate:** M

---

### VERS-004: Automatic snapshot pruning job
**As an** operator,
**I want** a background job to prune auto-snapshots beyond the 100-snapshot cap per document,
**so that** snapshot storage does not grow unboundedly in production.

**Scope:**
- In: scheduled background job (run nightly or triggered when a new auto-snapshot is written); delete the oldest auto-snapshot when the per-document count exceeds 100; never delete manual snapshots; log pruning actions (document ID, snapshot ID, timestamp deleted)
- Out: storage cost monitoring (separate ops story), configurable retention per workspace (not v1)

**Dependencies:** VERS-001
**Priority:** P2
**Size estimate:** S

---

## Feature: Comments & Suggestions (Track Changes)

### COMM-001: Inline comment creation on text selection
**As an** editor or commenter,
**I want** to select a range of text and attach an inline comment to it,
**so that** I can give feedback anchored to a specific passage without modifying the document text.

**Scope:**
- In: text selection triggers a "Add comment" affordance; comment input field with submit; comment stored with author, timestamp, anchor (stable range reference via Yjs relative positions); comment displayed as a side annotation aligned to the anchored text; anchor updates as surrounding text is edited; accessible to Editors and Commenters
- Out: comment threading/replies (see COMM-002), resolution lifecycle (see COMM-003), notifications (explicitly out of scope v1)

**Dependencies:** SYNC-001 (stable Yjs anchors required), PERM-003
**Priority:** P3
**Size estimate:** M

---

### COMM-002: Threaded comment replies
**As an** editor or commenter,
**I want** to reply to an existing comment in a thread,
**so that** discussions about a specific passage stay organized and in context.

**Scope:**
- In: reply input within each comment thread; replies displayed in chronological order below the parent comment; reply count shown in collapsed comment indicator; all users with document access (including Viewers) can read threads
- Out: @mentions in replies (backlog), reaction emoji, notification of replies (out of scope v1)

**Dependencies:** COMM-001
**Priority:** P3
**Size estimate:** M

---

### COMM-003: Comment resolution
**As an** editor or comment author,
**I want** to mark a comment thread as resolved,
**so that** addressed feedback is archived without being permanently deleted.

**Scope:**
- In: "Resolve" button on a comment thread; resolved comments hidden from the default annotation view but accessible via "Show resolved" toggle; resolution recorded with resolver user ID and timestamp; only the comment's original author or any Editor on the document can resolve a thread (Commenters cannot resolve their own threads per stakeholder correction)
- Out: re-opening a resolved comment (can be done via "Show resolved" + adding a new reply, which surfaces it again), bulk resolve

**Dependencies:** COMM-001, PERM-003 (resolver role check)
**Priority:** P3
**Size estimate:** S

---

### SUGG-001: Suggestion mode (track changes)
**As a** commenter or editor,
**I want** to switch to suggestion mode and have my edits appear as proposed changes rather than accepted text,
**so that** I can propose edits for review without immediately altering the canonical document.

**Scope:**
- In: suggestion mode toggle in toolbar; in suggestion mode, insertions displayed with underline highlight and deletions displayed as strikethrough (attributed to the suggester with color); suggestions stored as discrete change objects (not applied to the Yjs document text directly); multiple co-existing unresolved suggestions from different users; Editors and Commenters can create suggestions
- Out: suggestion notifications (out of scope v1), suggestions visible in exported documents (TBD — treat as out of scope unless trivial)

**Dependencies:** SYNC-001, COMM-001 (suggestions use similar anchoring), PERM-003
**Priority:** P3
**Size estimate:** L

---

### SUGG-002: Accept and reject suggestions
**As an** editor,
**I want** to accept or reject individual suggestions,
**so that** I can incorporate approved changes into the document and discard unwanted ones.

**Scope:**
- In: "Accept" and "Reject" buttons on each suggestion annotation; accepting a suggestion applies the insertion/deletion to the Yjs document text and removes the suggestion object; rejecting removes the suggestion without altering document text; any Editor on the document can accept or reject any suggestion (including those made by other Editors); Commenters cannot accept or reject
- Out: bulk accept/reject all, accept with modification (not v1)

**Dependencies:** SUGG-001, PERM-003
**Priority:** P3
**Size estimate:** S

---

## Feature: Permissions Model

### PERM-001: Workspace-role gate and document permission enforcement (API layer)
**As a** workspace member,
**I want** my access to a document to reflect both my workspace role (who can use the feature) and my per-document permission level (view/comment/edit),
**so that** sensitive documents can be restricted without changing workspace-level roles.

**Scope:**
- In: API middleware that (a) checks workspace membership before allowing any document access, (b) reads from `document_permissions` table (INFRA-003) to determine the user's permission level for the specific document, (c) returns 403 for no permission, read-only payload for view, comment-enabled payload for comment, full payload for edit; permission level propagated to the client session for feature gating
- Out: UI for assigning permissions (see PERM-002), admin override / workspace-admin bypass (assumed to be handled by existing workspace admin role having implicit edit everywhere — flag for product review if not)

**Dependencies:** INFRA-003
**Priority:** P1
**Size estimate:** M

---

### PERM-002: Permission management UI
**As a** document owner or admin,
**I want** to assign view, comment, or edit permission to individual workspace members for a specific document,
**so that** I can control who can do what in each document.

**Scope:**
- In: "Share" or "Permissions" panel on the document; search/select workspace members; set or update permission level per user; remove a user's permission (reverts to workspace-default, which is no document access); Document Owner and Admins can manage permissions; show current permissions list
- Out: sharing via public link, group/team permission assignment, permission inheritance from folders (not v1)

**Dependencies:** INFRA-003, PERM-001
**Priority:** P3
**Size estimate:** S

---

### PERM-003: Client-side feature gating by permission level
**As a** viewer or commenter,
**I want** the editor UI to reflect my permission level by disabling or hiding actions I'm not allowed to take,
**so that** I'm not offered capabilities that will be rejected at the API.

**Scope:**
- In: editor toolbar and controls rendered in permission-appropriate state (view: all editing controls hidden; comment: editing controls hidden, comment/suggestion controls shown; edit: full toolbar); export controls hidden for Viewers; version restore hidden for non-Editors; permission level sourced from session data set by PERM-001
- Out: server-side enforcement (that's PERM-001), graceful degradation if session data is stale (treat 403 from API as trigger to re-fetch permissions)

**Dependencies:** PERM-001, RICH-001
**Priority:** P1
**Size estimate:** M

---

## Feature: Document Templates

### TMPL-001: Admin template authoring
**As an** admin,
**I want** to create and save a document template with pre-populated structure and placeholder content,
**so that** teams can start new documents from a consistent baseline.

**Scope:**
- In: "Templates" section in admin settings; admin can open a blank Tiptap editor to author template content (full rich text available: headings, lists, code blocks, tables, links — but not images, as S3 upload in a template context adds complexity); save template with a name and optional description; edit or delete existing templates; templates stored as serialized Tiptap/Yjs JSON
- Out: template preview for non-admins (covered in TMPL-002), personal/team templates (admins only in v1), template versioning

**Dependencies:** RICH-001, RICH-002, RICH-003 (editor foundation); INFRA-003 (for template storage, separate table or documents table with is_template flag)
**Priority:** P3 (does not block any P1/P2 story)
**Size estimate:** M

---

### TMPL-002: Template selection at document creation
**As an** editor,
**I want** to choose a template when creating a new document,
**so that** I start from a pre-built structure instead of a blank page.

**Scope:**
- In: template picker shown in the "New document" flow; list of available workspace templates with name and description; "Start from template" creates a new document pre-populated with the template's content (a copy — edits to the document do not affect the template); "Blank document" option always present
- Out: applying a template to an existing non-empty document (not v1), template search/filtering (not needed at v1 scale)

**Dependencies:** TMPL-001
**Priority:** P3
**Size estimate:** S

---

## Feature: Export

### EXPO-001: Markdown export
**As an** editor or commenter,
**I want** to export the current document as a Markdown file,
**so that** I can use the content in external tools that accept Markdown.

**Scope:**
- In: "Export → Markdown" in document menu; server-side conversion of Tiptap JSON to Markdown via Pandoc pipeline (existing, per stakeholder); download triggered as `.md` file; supported elements: headings, bold/italic, lists, code blocks, links, tables (GFM format); images rendered as `![alt](url)` pointing to S3 CDN URL; export accessible to Editors and Commenters only (Viewers blocked)
- Out: embedded image binary in export, comments/suggestions included in export, fidelity for edge-case formatting not representable in Markdown

**Dependencies:** RICH-001–RICH-004 (content to export), PERM-003 (viewer block); Pandoc pipeline (existing)
**Priority:** P3
**Size estimate:** M

---

### EXPO-002: DOCX export
**As an** editor or commenter,
**I want** to export the current document as a DOCX file,
**so that** I can share it with stakeholders who use Microsoft Word.

**Scope:**
- In: "Export → DOCX" in document menu; server-side Pandoc conversion from Tiptap JSON (via intermediate Markdown or HTML) to `.docx`; supported elements: headings, bold/italic/underline, bullet/numbered lists, code blocks, tables, links; images embedded from S3 URL (fetched server-side at export time); download as `.docx`; accessible to Editors and Commenters only
- Out: track changes / suggestions represented in DOCX revision marks (not v1), comments exported as DOCX comments (not v1), table of contents generation

**Dependencies:** EXPO-001 (Pandoc pipeline already wired)
**Priority:** P3
**Size estimate:** M

---

### EXPO-003: PDF export
**As an** editor or commenter,
**I want** to export the current document as a PDF,
**so that** I can share a fixed-layout, read-only version with external parties.

**Scope:**
- In: "Export → PDF" in document menu; server-side PDF generation via Pandoc pipeline (using DOCX-to-PDF or HTML-to-PDF path — whichever is already supported in the existing pipeline); download as `.pdf`; same element fidelity as DOCX export; accessible to Editors and Commenters only
- Out: custom PDF styling beyond default Pandoc output (not v1), PDF generation client-side

**Dependencies:** EXPO-002 (Pandoc pipeline, same conversion path)
**Priority:** P3
**Size estimate:** S

---

## Dependency Map

- **INFRA-001** → **INFRA-002** (spike informs whether to extend or build new)
- **INFRA-002**, **RICH-001** → **SYNC-001**
- **SYNC-001** → **SYNC-002**, **PRES-001**, **OFFL-001**, **VERS-001**, **COMM-001**, **SUGG-001**
- **SYNC-002** → **CONF-001**
- **OFFL-001** → **OFFL-002**
- **CONF-001** → **OFFL-002**
- **VERS-001** → **VERS-002**, **VERS-003**, **VERS-004**
- **VERS-002** → **VERS-003**
- **COMM-001** → **COMM-002**, **COMM-003**, **SUGG-001**
- **SUGG-001** → **SUGG-002**
- **INFRA-003** → **PERM-001** → **PERM-002**, **PERM-003**
- **RICH-001–RICH-003**, **INFRA-003** → **TMPL-001** → **TMPL-002**
- **RICH-001–RICH-004**, **PERM-003** → **EXPO-001** → **EXPO-002** → **EXPO-003**
- **PERM-003** → all feature-gated UI stories (VERS-003, COMM-001, SUGG-002, EXPO-001–003)

---

## Suggested Implementation Order

1. **INFRA-001** — Spike first; unblocks architecture decision on WS service
2. **INFRA-003** — Schema work parallelizable with INFRA-001; unblocks all permission stories
3. **INFRA-002** — y-websocket service; unblocks all sync stories
4. **RICH-001** — Tiptap baseline; unblocks all other editor stories
5. **PERM-001** — API enforcement; should go in before any real content is stored
6. **PERM-003** — Client gating; pairs with RICH-001 for correct initial UI state
7. **RICH-002** — Block elements; extends RICH-001 with low risk
8. **RICH-003** — Tables; slightly more complex but same integration point
9. **RICH-004** — Images via S3; requires upload endpoint but S3 infra exists
10. **SYNC-001** — Yjs binding; transforms the editor from single-user to CRDT-backed
11. **SYNC-002** — Multi-client sync validation; verifies the 500ms SLA
12. **CONF-001** — Conflict behavior acceptance tests; low implementation effort once SYNC-002 is green
13. **PRES-001** — Presence cursors; high visibility, builds on SYNC-001
14. **OFFL-001** — IndexedDB persistence; prerequisite for reconnect behavior
15. **OFFL-002** — Reconnect sync + server-wins notification; completes offline story
16. **VERS-001** — Async snapshot job; pairs naturally with stable Yjs model
17. **VERS-002** — Manual snapshots; thin add-on to VERS-001
18. **VERS-004** — Pruning job; must ship with or immediately after VERS-001 to avoid storage debt
19. **VERS-003** — Browse and restore UI; completes the version history feature
20. **COMM-001** — Inline comments; requires stable Yjs anchors (SYNC-001)
21. **COMM-002** — Threaded replies; extends COMM-001
22. **COMM-003** — Resolution lifecycle; closes the comment workflow
23. **SUGG-001** — Suggestion mode; most complex collaboration story
24. **SUGG-002** — Accept/reject; completes the track-changes workflow
25. **PERM-002** — Permissions UI; lower risk after enforcement (PERM-001) is solid
26. **TMPL-001** — Admin template authoring
27. **TMPL-002** — Template selection at creation
28. **EXPO-001** — Markdown export; simplest, validates Pandoc pipeline integration
29. **EXPO-002** — DOCX export; builds on same pipeline
30. **EXPO-003** — PDF export; trivially extends EXPO-002

---

## Potential Additions (Not in Scope, Flagged for Backlog)

- **Notification system** (comment replies, @mentions, suggestion activity) — Stakeholder confirmed out of scope v1; estimate adds 30–50% to comment story scope when added
- **Geo-distributed relay** for <500ms SLA across European customer cohort — Stakeholder flagged for next cycle; don't architect against it
- **Document lock/freeze** — Deferred to Q3 compliance review
- **Manual conflict resolution UI** — Deferred to v2 pending user feedback
- **Personal and team-scoped templates** — Admins only in v1
- **Comment/suggestion export fidelity** (DOCX revision marks, PDF annotations)
- **Syntax highlighting** in code blocks

---

## Coverage Check

| Feature from Analysis | Stories | Status |
|---|---|---|
| Rich Text Editing | RICH-001, RICH-002, RICH-003, RICH-004 | Covered |
| Real-Time Sync & Presence | INFRA-002, SYNC-001, SYNC-002, PRES-001 | Covered |
| Conflict Resolution | CONF-001 | Covered (non-overlapping merge is Yjs default; same-range LWW configured and acceptance-tested here) |
| Offline Editing & Reconnection Sync | OFFL-001, OFFL-002 | Covered |
| Version History | VERS-001, VERS-002, VERS-003, VERS-004 | Covered |
| Comments & Suggestions (Track Changes) | COMM-001, COMM-002, COMM-003, SUGG-001, SUGG-002 | Covered |
| Permissions Model | INFRA-003, PERM-001, PERM-002, PERM-003 | Covered |
| Document Templates | TMPL-001, TMPL-002 | Covered |
| Export | EXPO-001, EXPO-002, EXPO-003 | Covered |
