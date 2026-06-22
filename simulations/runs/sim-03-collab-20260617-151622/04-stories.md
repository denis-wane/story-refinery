# Story Decomposition

---

## Infrastructure Prerequisites

### INFRA-WS: Stand up dedicated WebSocket service

**As a** platform engineer,
**I want** a persistent WebSocket service deployed as a standalone Node process,
**so that** document clients can maintain bidirectional connections that Lambda cannot provide.

**Scope:**
- In: Node.js WebSocket server (e.g., ws or Socket.io), connection lifecycle management, basic auth/token validation on connect, deployment to existing infra alongside Lambda backend
- Out: document sync logic (handled in SYNC-001), permission enforcement beyond token validation

**Dependencies:** None (greenfield service)
**Priority:** P1
**Size estimate:** M

---

### INFRA-YJS: Integrate Yjs CRDT library and shared document model

**As a** platform engineer,
**I want** a shared Yjs document model wired into both the client and the WebSocket service,
**so that** all subsequent sync, conflict resolution, and offline features have a consistent CRDT foundation.

**Scope:**
- In: Yjs installed on client and server, Y.Doc initialization per document ID, y-websocket provider on server, basic awareness protocol bootstrapped; review Marcus's PoC for salvageable code before writing from scratch
- Out: Rich text binding (RTE-001), persistence (VER-001), presence UI (PRES-001)

**Dependencies:** INFRA-WS
**Priority:** P1
**Size estimate:** M

---

## Feature: Rich Text Editing Engine

### RTE-001: Inline text formatting

**As an** editor,
**I want** to apply bold, italic, underline, and inline code formatting to selected text,
**so that** I can express emphasis and structure within prose without leaving the keyboard.

**Scope:**
- In: Bold, italic, underline, inline code via toolbar and keyboard shortcuts; formatting marks visible in document; formatting stored in Yjs document model via y-prosemirror or Tiptap binding
- Out: Block-level formatting (RTE-002), tables (RTE-003), images (RTE-004), real-time sync (handled in SYNC-001)

**Dependencies:** INFRA-YJS
**Priority:** P1
**Size estimate:** S

---

### RTE-002: Block-level formatting — headings, lists, code blocks

**As an** editor,
**I want** to format paragraphs as H1–H3 headings, unordered/ordered lists, and fenced code blocks,
**so that** I can create structured documents with visual hierarchy.

**Scope:**
- In: H1, H2, H3 headings; bullet lists; numbered lists; fenced code blocks (syntax highlight display only, no execution); block type switching via toolbar and markdown shortcuts (e.g., `##` → H2, `-` → bullet)
- Out: H4–H6, nested lists, inline code (RTE-001), tables (RTE-003)

**Dependencies:** RTE-001
**Priority:** P1
**Size estimate:** S

---

### RTE-003: Tables

**As an** editor,
**I want** to insert and edit tables with arbitrary rows and columns,
**so that** I can present structured data without exporting to a spreadsheet.

**Scope:**
- In: Insert table via toolbar; add/delete rows and columns; basic cell text editing; tab-to-next-cell navigation
- Out: Cell merging, cell-level formatting, table captions, column resizing in v1 (these are explicitly deferred)

**Dependencies:** RTE-001
**Priority:** P2
**Size estimate:** M

---

### RTE-004: Image insertion via S3

**As an** editor,
**I want** to embed images in the document by uploading from my device,
**so that** I can include screenshots and diagrams inline without switching to a file-sharing tool.

**Scope:**
- In: Image upload from local device; images stored in existing S3 bucket by reference (URL key, not base64); thumbnail display in document; per-document limit of 10 images enforced with graceful error message on the 11th upload
- Out: Image resizing, captions, alt text (deferred), drag-from-URL embed (deferred)

**Dependencies:** RTE-001; S3 file storage service (existing bucket reuse confirmed)
**Priority:** P2
**Size estimate:** M

---

### RTE-005: Hyperlinks

**As an** editor,
**I want** to insert and edit hyperlinks on selected text,
**so that** I can reference external resources or other project documents inline.

**Scope:**
- In: Insert link via toolbar or `Ctrl/Cmd+K`; link editing dialog (URL + display text); link preview on hover; link removal
- Out: Internal document cross-references (deferred), link unfurl/preview cards (deferred)

**Dependencies:** RTE-001
**Priority:** P2
**Size estimate:** S

---

## Feature: Document Permissions

### PERM-001: Per-document role assignment

**As a** document owner or admin,
**I want** to assign view-only, can-comment, or can-edit roles to individual project members for a specific document,
**so that** I can control who reads, annotates, or modifies sensitive project docs.

**Scope:**
- In: Permission assignment UI on document settings panel; roles: view-only, can-comment, can-edit; project membership is a prerequisite (users outside the project cannot be assigned); permissions stored per user per document; permission checks enforced on document load and API calls
- Out: Group/team-level permissions (deferred), permission inheritance from project settings (deferred), public sharing links (out of scope)

**Dependencies:** Existing project membership model (platform team review of integration boundary required per G-5 resolution)
**Priority:** P1
**Size estimate:** M

---

### PERM-002: Project admin implicit can-edit

**As a** project admin,
**I want** to always have can-edit access to all documents in my project without requiring an explicit assignment,
**so that** I can recover documents when a team member leaves or a document becomes inaccessible.

**Scope:**
- In: Server-side enforcement that project admin role from existing permissions model grants implicit can-edit on all documents in that project; admin implicit access is not shown as an explicit assignment in the permissions panel (it's contextual, not stored)
- Out: Override suppression (admins cannot have their implicit access revoked by document owner), audit log of admin access (deferred)

**Dependencies:** PERM-001; existing project admin role definition
**Priority:** P1
**Size estimate:** S

---

### PERM-003: Permission enforcement on WebSocket sync

**As a** platform engineer,
**I want** the WebSocket service to validate document permissions on every connection and broadcast only to users whose access is current,
**so that** a user whose access was revoked mid-session stops receiving updates immediately.

**Scope:**
- In: Permission check on WebSocket connect; periodic re-validation (e.g., every 60 seconds or on permission change event); forceful disconnect of sessions where access has been revoked; server never broadcasts edits to clients without current valid access
- Out: Client-side permission UI changes (handled in PERM-001), fine-grained op-level filtering (all-or-nothing access model)

**Dependencies:** INFRA-WS, PERM-001
**Priority:** P1
**Size estimate:** M

---

## Feature: Real-Time Collaboration Sync

### SYNC-001: Real-time edit propagation to connected clients

**As an** editor,
**I want** my changes to appear on co-editors' screens within 500ms,
**so that** collaboration feels fluid and I don't unknowingly duplicate work.

**Scope:**
- In: Yjs updates broadcast from client → WebSocket server → all other connected clients for the same document; 500ms end-to-end target measured in single US region; server applies no transformation (CRDT handles merge client-side); document state persisted to storage on each update (debounced, not per-keystroke)
- Out: Cross-region sync (deferred to post-v1), offline merge (OFFLINE-001), presence/cursors (PRES-001)

**Dependencies:** INFRA-YJS, PERM-003, RTE-001
**Priority:** P1
**Size estimate:** M

---

### SYNC-002: Document size enforcement

**As a** platform engineer,
**I want** the server to reject Yjs updates that would push a document past 1 MB of text content,
**so that** we can maintain sync performance guarantees and avoid unbounded storage growth.

**Scope:**
- In: Server-side check on incoming Yjs update payloads; reject and return error to client when text content ceiling would be exceeded; client displays user-facing error ("Document size limit reached"); existing content is never truncated
- Out: Per-user quota (deferred), per-project quota (deferred), image count enforcement (handled in RTE-004)

**Dependencies:** SYNC-001
**Priority:** P1
**Size estimate:** S

---

## Feature: Presence & Cursor Awareness

### PRES-001: Active user presence list

**As a** user with any permission level,
**I want** to see an avatar list of everyone currently viewing or editing the document,
**so that** I know who might be responding to my changes in real time.

**Scope:**
- In: Yjs awareness protocol for presence; avatar/initials + name display in document header; viewer vs. editor distinction displayed (icon or label); join/leave presence events propagated within 2 seconds
- Out: Presence on specific sections (that's cursor awareness in PRES-002), "last active" timestamps (deferred)

**Dependencies:** INFRA-YJS, SYNC-001
**Priority:** P2
**Size estimate:** S

---

### PRES-002: Remote cursor and selection display

**As an** editor,
**I want** to see other editors' cursors and text selections in real time, labeled with their names,
**so that** I can avoid editing the same paragraph as a colleague simultaneously.

**Scope:**
- In: Cursor position and selection range transmitted via Yjs awareness; each user assigned a stable color on first session (persisted in user profile, not reassigned across sessions); colored cursor caret + name label floating above; colored selection highlight
- Out: User-configurable cursor color (deferred), cursor display for view-only users (view-only users see others' cursors but their own cursor is not broadcast)

**Dependencies:** PRES-001
**Priority:** P2
**Size estimate:** M

---

## Feature: Conflict Resolution

### CONF-001: Automatic CRDT merge for concurrent edits

**As an** editor,
**I want** concurrent edits to different parts of the document to merge automatically without any action on my part,
**so that** co-editing is seamless and neither editor loses their changes.

**Scope:**
- In: Yjs positional merge semantics for all concurrent text operations (insert, delete, format); no last-writer-wins override (requirement dropped per stakeholder); merge behavior is implicit via CRDT — no UI required for the common case
- Out: Manual conflict resolution UI (explicitly out of scope per stakeholder), merge for same-position concurrent inserts (Yjs determines ordering deterministically)

**Dependencies:** INFRA-YJS, SYNC-001
**Priority:** P1
**Size estimate:** S

*Note: This story is largely delivered by correct Yjs integration (INFRA-YJS + SYNC-001). Its scope is validating merge behavior with automated tests for concurrent edit scenarios, not implementing new logic.*

---

### CONF-002: Undo history preservation across merges

**As an** editor,
**I want** my local undo history to remain intact after remote edits are merged into my session,
**so that** I can undo my own changes even after a collaborator has edited nearby text.

**Scope:**
- In: Yjs `UndoManager` configured per document with user-scoped tracking; Ctrl/Cmd+Z undoes only the current user's ops, not remote ops; undo stack not cleared on remote merge
- Out: Cross-user undo (i.e., undoing a collaborator's change), redo after disconnect/reconnect (deferred)

**Dependencies:** CONF-001
**Priority:** P1
**Size estimate:** S

---

## Feature: Offline Editing & Sync

### OFFLINE-001: Local editing while disconnected (browser)

**As an** editor,
**I want** to keep editing a document after losing internet connection,
**so that** my work isn't interrupted by a brief network outage.

**Scope:**
- In: Browser offline detection; Yjs ops buffered locally (IndexedDB via y-indexeddb provider) when WebSocket is unavailable; visual offline indicator in document header; editing continues uninterrupted; offline scope is browser only (mobile browser offline is a nice-to-have, not required for v1)
- Out: Native mobile offline (deferred), view-only offline access (read from cache is implicit but not a committed deliverable in v1)

**Dependencies:** INFRA-YJS, SYNC-001
**Priority:** P2
**Size estimate:** M

---

### OFFLINE-002: Reconnect sync and auto-merge

**As an** editor,
**I want** my offline changes to sync and merge automatically when I reconnect,
**so that** no work is lost and I don't need to manually resolve conflicts.

**Scope:**
- In: On reconnect, buffered local Yjs ops submitted to server; Yjs CRDT merges local ops with any remote ops that occurred during disconnection; auto-merge always applied (no manual conflict resolution UI in v1); reconnect indicator shown to user; undo history available post-merge for recovery; no special handling for long offline windows (same auto-merge behavior regardless of disconnect duration)
- Out: Manual merge UI, branch-style divergence detection, notification of what changed remotely while offline

**Dependencies:** OFFLINE-001
**Priority:** P2
**Size estimate:** S

*Note: With Yjs + y-indexeddb, this is mostly configuration + testing of reconnection flows rather than new logic.*

---

## Feature: Version History

### VER-001: Automatic delta snapshots

**As a** platform engineer,
**I want** the system to automatically save delta snapshots of a document every 5 minutes of activity,
**so that** editors have a rolling recovery window without requiring manual saves.

**Scope:**
- In: Server-side timer: snapshot triggered after 5 minutes of document activity (not 5 minutes of wall time); delta storage (diff from previous snapshot, not full document copy); snapshots retained for 30 days, then automatically deleted; S3 used for snapshot storage (existing bucket, path prefix to be agreed with platform team); snapshot creation is invisible to users
- Out: Snapshot UI (VER-003), named manual versions (VER-002), restore (VER-003), version diffing UI (deferred)

**Dependencies:** SYNC-001; S3 storage (existing bucket)
**Priority:** P2
**Size estimate:** M

---

### VER-002: Manual named version saves

**As an** editor,
**I want** to save a named version of the document at any point,
**so that** I can mark meaningful milestones (e.g., "Approved by legal") and find them later without scrolling through auto-snapshots.

**Scope:**
- In: "Save version" action in document menu; optional name field (defaults to timestamp if blank); named versions stored indefinitely (not subject to 30-day TTL); per-document cap of 50 named versions; on attempting to save a 51st, prompt user to delete an existing one before proceeding; named versions displayed separately from auto-snapshots in version history panel
- Out: Version descriptions/notes beyond the name field (deferred), version tagging (deferred)

**Dependencies:** VER-001
**Priority:** P2
**Size estimate:** S

---

### VER-003: Version history browser and restore

**As a** user,
**I want** to browse the version history of a document and restore any past version,
**so that** I can recover from accidental deletions or unwanted bulk changes.

**Scope:**
- In: Version history panel listing auto-snapshots (last 30 days) and named versions; preview any version inline; restore action available to can-edit users only (view-only and can-comment users can browse but not restore); restore flow: (1) auto-snapshot current state, (2) apply historical version as new document state — never silently overwrite; only document owner and project admins can delete named versions; auto-snapshots are not manually deletable
- Out: Side-by-side diff view (deferred), branching/forking from a version (deferred)

**Dependencies:** VER-001, VER-002, PERM-001
**Priority:** P2
**Size estimate:** M

---

## Feature: Comments & Suggestions

### CMNT-001: Inline comment creation

**As a** user with can-comment or can-edit permission,
**I want** to leave an inline comment anchored to a text selection,
**so that** I can give contextual feedback without editing the document directly.

**Scope:**
- In: Comment creation via toolbar or right-click on selection; comment anchored to character range via Yjs relative position; comment panel on the right showing all comments in document order; comments visible to all users with any access level; comments persist when their anchor text is edited (position updates)
- Out: Comment threading/replies (CMNT-002), comment lifecycle when anchor is deleted (CMNT-003), suggestion mode (CMNT-004)

**Dependencies:** PERM-001, SYNC-001, RTE-001
**Priority:** P2
**Size estimate:** M

---

### CMNT-002: Comment replies

**As a** user with can-comment or can-edit permission,
**I want** to reply to an existing comment in a single-level thread,
**so that** feedback can be discussed in context without spawning separate threads.

**Scope:**
- In: Single-level reply thread under each comment (replies to replies are not supported in v1); reply author and timestamp displayed; data model must support future nesting without a migration (i.e., parent_comment_id stored on all replies, even if UI only renders one level deep)
- Out: @mentions in replies (deferred), rich text in comments (deferred — plain text only in v1)

**Dependencies:** CMNT-001
**Priority:** P2
**Size estimate:** S

---

### CMNT-003: Comment resolution and orphan handling

**As an** editor or comment author,
**I want** to resolve comments when they're addressed, and see orphaned comments when their anchor text has been deleted,
**so that** the comment panel stays actionable and I never silently lose annotations.

**Scope:**
- In: Resolve action available to the comment author or any can-edit user; resolved comments hidden by default but accessible via "show resolved" toggle; when anchor text is deleted, comment becomes orphaned — shown with a grey pill indicator at the deletion point and a label "anchor deleted"; orphaned comments are not auto-deleted; comment author and any can-edit user can delete comments
- Out: Comment re-anchoring after deletion (deferred), bulk resolve (deferred)

**Dependencies:** CMNT-001
**Priority:** P2
**Size estimate:** S

---

### CMNT-004: Suggestion mode (track changes)

**As an** editor,
**I want** to propose text changes as suggestions rather than applying them directly,
**so that** a reviewer can accept or reject my edits before they become permanent.

**Scope:**
- In: Suggestion mode toggle in toolbar; available only to can-edit users (can-comment users cannot propose suggestions); suggested insertions shown with underline + author color; suggested deletions shown with strikethrough + author color; document owner and can-edit users can accept or reject individual suggestions; accepted suggestions applied to document; rejected suggestions discarded; suggestions sync in real time like regular edits
- Out: Batch accept/reject all (deferred), suggestion comments (deferred — a suggestion is distinct from a comment)

**Dependencies:** CMNT-001, PERM-001, CONF-001
**Priority:** P3
**Size estimate:** L

---

## Feature: Document Templates

### TMPL-001: Admin template creation and management

**As a** project admin,
**I want** to save a document as a reusable template,
**so that** editors can start new documents with pre-built structure instead of a blank page.

**Scope:**
- In: "Save as template" action on any document; template stored with a name; templates list in admin settings; admin can rename and delete templates; templates are styled text only — no structured field engine (placeholders are editorial convention, not enforced schema)
- Out: Template versioning (deferred), per-project template scoping (all templates visible to all admins in v1), template permissions beyond admin-only management (deferred)

**Dependencies:** PERM-001, RTE-001 through RTE-005
**Priority:** P3
**Size estimate:** M

---

### TMPL-002: Document instantiation from template

**As an** editor,
**I want** to create a new document from a template,
**so that** I get a pre-structured starting point without copy-pasting manually.

**Scope:**
- In: "New document from template" flow; template picker showing all available templates; new document is a full copy of the template content (template itself is never modified); new document is owned by the creating user; standard permission assignment flow applies
- Out: Template preview before instantiation (deferred), partial template application to existing documents (deferred)

**Dependencies:** TMPL-001, PERM-001
**Priority:** P3
**Size estimate:** S

---

## Feature: Export

### EXPORT-001: Server-side export rendering service

**As a** platform engineer,
**I want** a server-side export service that converts Yjs document state to rendered output,
**so that** export fidelity is consistent and not dependent on client-side browser capabilities.

**Scope:**
- In: Export service endpoint accepting document ID + format; fetches current document state from storage; renders to requested format; returns file for download; auth check: any user with at least view-only permission may trigger export
- Out: Export scheduling, email delivery, or saving to external storage (deferred — download only in v1)

**Dependencies:** SYNC-001, PERM-001
**Priority:** P3
**Size estimate:** M

---

### EXPORT-002: PDF export

**As a** user with at least view-only permission,
**I want** to download the document as a PDF,
**so that** I can share a read-only snapshot with stakeholders who don't have access to the tool.

**Scope:**
- In: PDF rendered server-side (Puppeteer or equivalent); all rich text formatting preserved (bold, italic, headings, lists, code blocks); tables rendered; images included; links preserved as clickable; H1–H3 rendered with appropriate sizing
- Out: Watermarking (explicitly out of scope per stakeholder), custom page layout/margins (deferred), headers/footers (deferred)

**Dependencies:** EXPORT-001
**Priority:** P3
**Size estimate:** M

---

### EXPORT-003: DOCX export

**As a** user with at least view-only permission,
**I want** to download the document as a DOCX file,
**so that** I can hand it off to stakeholders who work in Microsoft Word.

**Scope:**
- In: DOCX rendered server-side (docx library or equivalent); inline formatting (bold, italic, underline), headings H1–H3, bullet and numbered lists, code blocks (monospace style), tables, images embedded, links
- Out: Comments exported to DOCX (deferred — comments are tool-internal), tracked changes exported (deferred), exact visual fidelity to PDF version

**Dependencies:** EXPORT-001
**Priority:** P3
**Size estimate:** M

---

### EXPORT-004: Markdown export

**As a** user with at least view-only permission,
**I want** to download the document as a Markdown file,
**so that** I can paste it into a README or a static site generator.

**Scope:**
- In: CommonMark-compatible Markdown output; headings as `#`/`##`/`###`; bold/italic; bullet and numbered lists; fenced code blocks with language tag if set; tables as GFM table syntax; images as `![alt](url)` pointing to S3 URLs; links
- Out: Underline (no Markdown equivalent — stripped), inline comments (stripped), custom block types beyond what Markdown supports

**Dependencies:** EXPORT-001
**Priority:** P3
**Size estimate:** S

---

## Dependency Map

```
INFRA-WS
  └─► INFRA-YJS
        └─► RTE-001 → RTE-002, RTE-003, RTE-004, RTE-005
        └─► PERM-001 → PERM-002
              └─► PERM-003
                    └─► SYNC-001 → SYNC-002
                          └─► CONF-001 → CONF-002
                          └─► PRES-001 → PRES-002
                          └─► OFFLINE-001 → OFFLINE-002
                          └─► VER-001 → VER-002 → VER-003
                          └─► CMNT-001 → CMNT-002, CMNT-003
                                └─► CMNT-004 (also needs PERM-001, CONF-001)
                          └─► EXPORT-001 → EXPORT-002, EXPORT-003, EXPORT-004

RTE-001..005 + PERM-001
  └─► TMPL-001 → TMPL-002
```

**Hard blockers before any story can be estimated:**
- ~~G-1 (CRDT/OT)~~ — **Resolved:** Yjs
- ~~G-2 (WebSocket infra)~~ — **Resolved:** dedicated Node service
- ~~G-5 (permissions model integration)~~ — **Resolved:** additive, project-membership prerequisite

**Pre-development action items before stories begin:**
- Contact Marcus re: Yjs PoC code (INFRA-YJS)
- Confirm S3 bucket path prefix with platform team (VER-001, RTE-004)
- Confirm WebSocket service deployment target with infra team (INFRA-WS)

---

## Suggested Implementation Order

1. **INFRA-WS** — foundation for all real-time features; no other story is unblocked without it
2. **INFRA-YJS** — CRDT model that every editing and sync story builds on; check Marcus's PoC first
3. **PERM-001** — access control must exist before any document is readable or writable
4. **PERM-002** — small add-on to PERM-001; ship together
5. **RTE-001** — core text editing; all other RTE stories and SYNC-001 need this
6. **RTE-002** — block formatting; needed before CMNT-001 (comments must anchor to any block type)
7. **PERM-003** — WebSocket permission enforcement must be in before SYNC-001 goes to any test environment
8. **SYNC-001** — first collab milestone; validates INFRA-WS + INFRA-YJS + PERM-003 together
9. **SYNC-002** — size enforcement; ship with SYNC-001 or immediately after
10. **CONF-001** — merge validation; should be tested as part of SYNC-001 but scoped separately
11. **CONF-002** — undo manager; ship with CONF-001
12. **PRES-001** — presence list; low-risk, high visibility, validates awareness protocol
13. **PRES-002** — cursor display; depends on PRES-001
14. **OFFLINE-001** — IndexedDB buffering; can be developed in parallel with PRES stories
15. **OFFLINE-002** — reconnect sync; depends on OFFLINE-001
16. **RTE-003** — tables; P2, unblocked after RTE-001
17. **RTE-004** — images + S3; P2, parallel with RTE-003
18. **RTE-005** — links; P2, small
19. **VER-001** — auto-snapshots; P2, requires SYNC-001 + S3 confirmation
20. **VER-002** — named versions; small add-on to VER-001
21. **VER-003** — version browser + restore; depends on VER-001, VER-002
22. **CMNT-001** — inline comments; P2, requires SYNC-001, PERM-001, RTE-001
23. **CMNT-002** — comment replies; small, ship with or after CMNT-001
24. **CMNT-003** — resolution + orphan handling; ship with CMNT-002
25. **EXPORT-001** — export service scaffold; P3, unblocked after SYNC-001
26. **EXPORT-004** — Markdown; smallest export format, good to validate EXPORT-001
27. **EXPORT-002** — PDF; larger render effort
28. **EXPORT-003** — DOCX; parallel with PDF
29. **TMPL-001** — template creation; P3, requires full RTE suite
30. **TMPL-002** — template instantiation; small, depends on TMPL-001
31. **CMNT-004** — suggestion mode; P3, most complex comments story, ship last in Phase 3

---

## Potential Additions (Not in Scope, Not Silently Included)

These were hinted at or implied but are absent from the requirements and not added to any story:

- **Emoji reactions on comments** — common in collaborative tools, not stated
- **@mentions in comments** — not stated; comment model doesn't include notification routing
- **Document activity feed / audit log** — no requirement stated beyond version history
- **Mobile offline** — explicitly deferred by stakeholder
- **Nested list support** — H1–H3 confirmed, nested lists not addressed; assuming flat lists only until clarified
- **Inline code vs. fenced code blocks** — requirements list both "code blocks" and RTE-001 handles inline; fenced code is in RTE-002; distinction between the two should be confirmed during RTE-001 acceptance
- **DRM / watermarking on export** — explicitly declined by stakeholder for v1
- **Template structured field engine** — explicitly deferred by stakeholder

---

## Coverage Check

| Feature from Analysis | Stories | Status |
|---|---|---|
| Rich Text Editing Engine | RTE-001, RTE-002, RTE-003, RTE-004, RTE-005 | Covered |
| Real-Time Collaboration Sync | INFRA-WS, INFRA-YJS, SYNC-001, SYNC-002 | Covered |
| Presence & Cursor Awareness | PRES-001, PRES-002 | Covered |
| Conflict Resolution | CONF-001, CONF-002 | Covered |
| Offline Editing & Sync | OFFLINE-001, OFFLINE-002 | Covered |
| Version History | VER-001, VER-002, VER-003 | Covered |
| Comments & Suggestions (Track Changes) | CMNT-001, CMNT-002, CMNT-003, CMNT-004 | Covered |
| Document Permissions | PERM-001, PERM-002, PERM-003 | Covered |
| Document Templates | TMPL-001, TMPL-002 | Covered |
| Export | EXPORT-001, EXPORT-002, EXPORT-003, EXPORT-004 | Covered |

**Total stories: 30** (2 infra + 28 feature)
**Unresolved blockers: 0** — all 5 deferred gaps (G-1, G-2, G-4, G-5, G-14) were answered by stakeholder
**Pre-development actions required: 3** (Marcus/Yjs PoC, S3 bucket path, WebSocket deployment target)
