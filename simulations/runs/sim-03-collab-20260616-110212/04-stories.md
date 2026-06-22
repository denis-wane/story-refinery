# Story Decomposition

---

## Feature: Foundation (Epic 1 — Prerequisite for all other epics)

### FOUND-01: WebSocket gateway architecture document

**As a** tech lead,
**I want** a vetted architecture document for the dedicated Node.js WebSocket gateway,
**so that** the infra team has the design contract needed to provision the staging environment and all engineers have a shared implementation target before a line of service code is written.

**Scope:**
- In: document covering connection lifecycle, Yjs provider integration, document room management, auth token passthrough from Rails API, horizontal scaling approach, deployment model; stakeholder review session with @marcos (infra)
- Out: implementation of the service, actual provisioning (infra executes after doc approval)

**Dependencies:** Yjs decision (resolved — Yjs confirmed by stakeholder); @marcos contact
**Priority:** P1
**Size estimate:** S

---

### FOUND-02: Yjs client integration and shared document schema

**As a** developer,
**I want** Yjs installed in the frontend with a canonical Y.Doc schema defined for document content,
**so that** all features (editor, real-time sync, offline, version history) build on a single consistent shared data structure from the start.

**Scope:**
- In: install `yjs`; define shared types (Y.XmlFragment for rich text body, Y.Map for document metadata); coordinate with @sarah (mobile team) to reuse or adapt existing Yjs PoC bindings; document the schema in the codebase
- Out: WebSocket provider wiring (SYNC-01), server-side persistence, UI rendering (EDITOR-01)

**Dependencies:** FOUND-01 (architecture doc informs schema decisions)
**Priority:** P1
**Size estimate:** S

---

### FOUND-03: WebSocket gateway service bootstrap

**As a** developer,
**I want** a standalone Node.js WebSocket service that accepts Yjs sync connections and manages document rooms,
**so that** real-time collaboration has a dedicated, scalable connection layer that does not require changes to the existing Rails API.

**Scope:**
- In: Node.js service with `y-websocket` server; document room lifecycle (create, join, leave); per-connection authentication via token validated against Rails API; basic `/health` endpoint; Docker container config
- Out: Yjs state persistence (wired in SYNC-01), presence broadcasting (SYNC-03), permission enforcement on ops (PERMS-02)

**Dependencies:** FOUND-01 (architecture doc), FOUND-02 (schema)
**Priority:** P1
**Size estimate:** L

---

### FOUND-04: Document permissions data model

**As a** document owner,
**I want** document-level view / comment / edit tiers stored independently of workspace roles and enforced as the more restrictive permission,
**so that** I can grant or restrict document access regardless of a user's workspace-level role.

**Scope:**
- In: DB schema for per-user per-document permission tiers (view / comment / edit); resolution logic: document tier overrides workspace role (workspace Admin + document View = view-only); Document Owner always retains edit rights; API to read and write permission tiers
- Out: permission management UI (PERMS-01), audit logging (PERMS-03), enforcement on individual endpoints (PERMS-02)

**Dependencies:** None
**Priority:** P1
**Size estimate:** M

---

## Feature: Rich Text Editor (Epic 2)

### EDITOR-01: Basic rich text formatting

**As an** editor,
**I want** to apply headings (H1–H3), bold, italic, underline, and bullet/numbered lists to document text using toolbar buttons and keyboard shortcuts,
**so that** I can structure and emphasize content without needing a separate writing tool.

**Scope:**
- In: embed a Yjs-compatible rich text editor (e.g., TipTap with `y-prosemirror`); toolbar and keyboard shortcuts for heading levels 1–3, bold, italic, underline, unordered list, ordered list; all content stored in the Yjs Y.XmlFragment
- Out: code blocks, tables, images, links (each a separate story); real-time sync wiring (SYNC-01)

**Dependencies:** FOUND-02 (Yjs schema)
**Priority:** P1
**Size estimate:** M

---

### EDITOR-02: Code block support

**As an** editor,
**I want** to insert fenced code blocks with syntax highlighting for common languages,
**so that** code snippets are rendered in monospace without being treated as prose.

**Scope:**
- In: code block node type; monospace rendering; read-only syntax highlighting for a common language set (JS, TypeScript, Python, SQL, Bash, JSON); insert via toolbar button and slash command
- Out: live code execution, line numbers, language auto-detection

**Dependencies:** EDITOR-01
**Priority:** P2
**Size estimate:** S

---

### EDITOR-03: Table support

**As an** editor,
**I want** to insert and edit tables with configurable rows and columns,
**so that** I can organize structured data inline in a document.

**Scope:**
- In: table node type; insert via toolbar/slash command; add/remove rows and columns; merge cells; basic cell formatting (bold, italic); table stored in Yjs and syncs in real time
- Out: sortable columns, formulas, CSV import, nested tables

**Dependencies:** EDITOR-01
**Priority:** P2
**Size estimate:** M

---

### EDITOR-04: Image embeds with S3 storage

**As an** editor,
**I want** to upload images directly into a document via drag-and-drop or file picker and have them stored in S3,
**so that** screenshots and diagrams appear inline without bloating the document's CRDT payload.

**Scope:**
- In: image node type; upload flow (drag-and-drop + file picker) sends image to a server-side endpoint that stores it in the existing S3 bucket; document stores a signed-URL reference (not base64); image rendered via signed URL with server-side expiry refresh; reuse existing S3 bucket and signed URL pattern
- Out: base64 inline storage (explicitly excluded per stakeholder); image editing (crop, resize); CDN invalidation (handled by existing CDN setup)

**Dependencies:** EDITOR-01; existing S3 bucket/signed URL infrastructure (confirmed by stakeholder)
**Priority:** P2
**Size estimate:** M

---

### EDITOR-05: Hyperlink support

**As an** editor,
**I want** to insert, edit, and remove hyperlinks on text selections,
**so that** I can reference external resources and other documents inline.

**Scope:**
- In: link mark type; toolbar button and keyboard shortcut to add/edit/remove link; URL input with validation; hover tooltip showing the URL; links open in a new tab
- Out: link unfurling / preview cards, auto-detection of pasted raw URLs (post-launch)

**Dependencies:** EDITOR-01
**Priority:** P2
**Size estimate:** S

---

## Feature: Real-Time Collaboration Sync (Epic 3)

### SYNC-01: Live Yjs document sync over WebSocket

**As an** editor,
**I want** my keystrokes to appear on all other connected users' screens within 500ms,
**so that** multiple people can collaborate in the same document simultaneously without confusion or overwriting.

**Scope:**
- In: wire the frontend Yjs provider to the WebSocket gateway (FOUND-03); server-side persistence of Yjs document state to survive server restarts (store incremental ops to DB or Redis); validate 500ms end-to-end propagation SLA on a standard connection; server-side rejection of Yjs ops from users without edit access (enforced in gateway)
- Out: presence indicators (SYNC-03), offline queue (OFFLINE-01), conflict resolution toast (SYNC-02)

**Dependencies:** FOUND-02, FOUND-03, FOUND-04, EDITOR-01
**Priority:** P1
**Size estimate:** L

---

### SYNC-02: Last-writer-wins conflict resolution UX

**As an** editor,
**I want** a brief non-blocking toast when a concurrent edit supersedes my change on the same character range,
**so that** I know what happened and can undo without my workflow being interrupted.

**Scope:**
- In: detect when a remote Yjs update supersedes a local op on the same range; display toast: "Your edit was merged with a concurrent change." with an Undo button; toast auto-dismisses after 5 seconds; Undo re-applies the user's local version as a new op (normal merge resolution will follow)
- Out: blocking conflict modal, diff view of the conflict, conflict log

**Dependencies:** SYNC-01
**Priority:** P1
**Size estimate:** S

---

### SYNC-03: Presence indicators

**As an** editor,
**I want** to see colored carets and name labels for every other user currently viewing or editing the document,
**so that** I can avoid working on the same section as a colleague and know at a glance who is in the document.

**Scope:**
- In: broadcast cursor position and selection range per user via the Yjs awareness protocol; assign a consistent color per user per session; render remote cursors as colored carets with floating name labels; display an active-users avatar list in the document toolbar; visually distinguish viewer from editor in the presence list; presence is ephemeral — cursor positions are never persisted
- Out: scroll position sharing, video/audio presence, inactivity timeout indicators

**Dependencies:** SYNC-01 (active WebSocket connection)
**Priority:** P1
**Size estimate:** M

---

## Feature: Offline Editing & Sync (Epic 4)

### OFFLINE-01: Local edit queue with IndexedDB persistence

**As an** editor,
**I want** to continue editing a document when my internet connection drops, with my changes durably saved locally,
**so that** I do not lose work if I go offline, switch networks, or accidentally close the tab.

**Scope:**
- In: detect connection loss and switch the Yjs provider to offline mode; persist pending Yjs ops to IndexedDB so they survive tab close; display a persistent "Offline" status indicator in the document toolbar; disable sync-dependent actions (saving named versions, adding comments) with an informational message while offline
- Out: service worker / PWA shell (out of scope unless explicitly added); offline image upload (images require S3, will fail with an inline error message)

**Dependencies:** FOUND-02, SYNC-01
**Priority:** P2
**Size estimate:** M

---

### OFFLINE-02: Reconnect merge

**As an** editor,
**I want** my locally queued offline changes to sync and merge automatically when I reconnect,
**so that** work done offline is fully preserved without requiring any manual intervention.

**Scope:**
- In: on reconnect, replay queued Yjs ops from IndexedDB against current document state; Yjs CRDT handles merge for non-conflicting ranges automatically; clear IndexedDB queue after confirmed sync; display "Synced" status in the document toolbar; trigger OFFLINE-03 flow for conflicting range cases
- Out: manual merge UI for non-overlapping changes (CRDT handles these transparently)

**Dependencies:** OFFLINE-01, SYNC-01
**Priority:** P2
**Size estimate:** M

---

### OFFLINE-03: Offline conflict notification (last-reconnect-wins)

**As an** editor,
**I want** a non-blocking notification when my offline edit was overwritten by another user's concurrent offline change,
**so that** I am aware of the data loss and can undo, without being blocked by a conflict resolution UI.

**Scope:**
- In: detect when reconnect merge results in a last-reconnect-wins overwrite on a conflicting range; show non-blocking toast: "A concurrent offline edit was applied to this section — your change was overwritten." with an Undo button; toast persists until explicitly dismissed (higher stakes than the 5-second real-time toast); Undo re-applies the local version as a new op
- Out: three-way merge UI, per-character diff view of the conflict

**Dependencies:** OFFLINE-02
**Priority:** P2
**Size estimate:** S

---

## Feature: Version History (Epic 5)

### VER-01: Automatic document snapshots

**As an** editor,
**I want** the system to automatically save a snapshot of the document every 5 minutes of editing activity,
**so that** I can recover from accidental deletions without losing more than 5 minutes of work.

**Scope:**
- In: server-side timer that fires a snapshot 5 minutes after the last Yjs op (timer resets on each op); snapshot stores a full Yjs document state (for restorability without replaying the full op log) plus an incremental diff from the prior snapshot (for storage efficiency); at minimum one full snapshot per session start; retain last 100 auto-snapshots per document; purge auto-snapshots older than 90 days; auto-snapshots labeled with timestamp only
- Out: manual named versions (VER-02), version browser (VER-03), restore (VER-04)

**Dependencies:** SYNC-01
**Priority:** P2
**Size estimate:** M

---

### VER-02: Manual named version creation

**As an** editor,
**I want** to save a named version of the document at any moment,
**so that** I can mark milestones like "Draft sent to legal" that persist indefinitely and are easy to find later.

**Scope:**
- In: "Save version" action in the document toolbar; optional name input (defaults to timestamp if blank); named versions are retained indefinitely (exempt from the 90-day auto-snapshot purge); named versions visually distinguished from auto-snapshots in the version browser (VER-03)
- Out: version comparison/diff view, version sharing with external parties

**Dependencies:** VER-01 (snapshot infrastructure)
**Priority:** P2
**Size estimate:** S

---

### VER-03: Version history browser UI

**As an** editor,
**I want** to browse the full version history of a document in a sidebar,
**so that** I can find, review, and navigate to past document states.

**Scope:**
- In: version history panel (sidebar or modal); list all versions with: type badge (auto / named), timestamp, creator name (for named versions); visual distinction between auto and named entries; click a version to open a read-only preview of the document at that point; version list loads in under 1 second for up to 500 entries
- Out: restore action (VER-04), diff between two selected versions, pagination beyond 500 entries (post-launch)

**Dependencies:** VER-01, VER-02
**Priority:** P2
**Size estimate:** M

---

### VER-04: Non-destructive restore from version

**As an** editor,
**I want** to restore the document to a past version without losing any subsequent edits,
**so that** I can recover from a mistake knowing that no history will be permanently deleted.

**Scope:**
- In: "Restore" action on any version entry in the browser; restore creates a new document version as the head, labeled "Restored from [version name or timestamp]"; restore is applied as a Yjs op (syncs in real time to connected users); all prior history is fully preserved; confirmation dialog shown before restoring (action is non-destructive but consequential)
- Out: destructive overwrite (explicitly forbidden per stakeholder); restoring to a version created by a since-deleted user (post-launch edge case)

**Dependencies:** VER-03, SYNC-01
**Priority:** P2
**Size estimate:** M

---

## Feature: Comments & Suggestions (Epic 6)

### COMM-01: Inline comment creation on text selection

**As a** commenter,
**I want** to add an inline comment to a text selection,
**so that** I can give targeted feedback without altering the document content.

**Scope:**
- In: select text → "Add comment" affordance (toolbar bubble or margin icon); comment anchored to the text range via a Yjs decoration; comment displays author, timestamp, and body text; comments visible to all users with at least view access; comment data stored server-side; only users with comment or edit access can create comments
- Out: threaded replies (COMM-02), resolve/unresolve (COMM-03), @mentions (COMM-02)

**Dependencies:** FOUND-04 (permission enforcement), SYNC-01
**Priority:** P2
**Size estimate:** M

---

### COMM-02: Comment threading and @mentions

**As a** commenter,
**I want** to reply to a comment (one level of nesting) and @mention a workspace member,
**so that** review conversations stay anchored to the relevant text and I can pull specific colleagues into a discussion.

**Scope:**
- In: reply input on each top-level comment (one nesting level — no reply-to-reply); @mention autocomplete populated from workspace members; @mention emits an event to the event bus (notification delivery is out of scope — handled by the notifications team); replies displayed chronologically under the parent comment
- Out: second-level nesting, @mention notification delivery, editing a posted reply (post-launch)

**Dependencies:** COMM-01
**Priority:** P2
**Size estimate:** M

---

### COMM-03: Comment resolve and unresolve

**As an** editor,
**I want** to mark a comment thread as resolved when the feedback has been addressed,
**so that** I can track review progress and reduce clutter in active documents.

**Scope:**
- In: resolve/unresolve toggle on each comment thread (available to editors and document owners); resolved threads collapsed in the document margin (accessible via a "Show resolved" filter toggle); resolved state is persisted server-side and visible to all users; resolving emits an event to the event bus
- Out: deleting comments (post-launch — requires moderation policy), comment analytics

**Dependencies:** COMM-01
**Priority:** P2
**Size estimate:** S

---

### COMM-04: Suggestion / track-changes mode

**As an** editor,
**I want** to switch to suggestion mode so my edits are tracked as proposed changes rather than applied directly,
**so that** document owners and editors can review and approve changes before they become part of the document.

**Scope:**
- In: "Suggest" toggle in the toolbar (per-user setting, not a global document mode); insertions rendered underlined and attributable to the author; deletions rendered with strikethrough; suggestion stored as a Yjs decoration with metadata (author, timestamp); commenters see suggestions in read-only mode and cannot create them; viewers see suggestion highlights in the document but not the markup controls
- Out: accept/reject flow (COMM-05), notification delivery

**Dependencies:** EDITOR-01, FOUND-04
**Priority:** P2
**Size estimate:** L

---

### COMM-05: Accept and reject suggestions

**As an** editor,
**I want** to accept or reject individual suggestions, with document owners able to bulk-accept all pending suggestions,
**so that** review cycles can be completed efficiently without requiring the original author to be present.

**Scope:**
- In: per-suggestion accept/reject buttons visible to all editors; accepting applies the change to the Yjs document and removes the suggestion decoration; rejecting removes the suggestion without applying it; Document Owner has a "Accept all" bulk action; each accept/reject emits an event to the event bus; commenters have no accept/reject controls (view-only on suggestions)
- Out: partial accept (accepting a subset of characters within a suggestion), suggestion attribution history after acceptance (post-launch)

**Dependencies:** COMM-04, FOUND-04
**Priority:** P2
**Size estimate:** M

---

### COMM-06: Collaboration event emission to event bus

**As a** platform,
**I want** the document editor to publish structured events for all key collaboration actions,
**so that** the notifications team can wire up delivery independently without changes to the document editor codebase.

**Scope:**
- In: emit events for: comment created, comment reply created, @mention in comment, comment resolved, suggestion created, suggestion accepted, suggestion rejected, document permission granted/revoked; event schema includes: event type, document ID, actor user ID, target user ID (for @mentions/shares), timestamp; publish to the existing event bus (bus type and topic to be confirmed with platform team)
- Out: notification delivery, email formatting, push notification payloads

**Dependencies:** COMM-01, COMM-02, COMM-03, COMM-04, COMM-05, PERMS-01
**Priority:** P2
**Size estimate:** S

---

## Feature: Document Permissions (Epic 7)

### PERMS-01: Per-user per-document permission management UI

**As a** document owner,
**I want** to grant and revoke view / comment / edit access to individual workspace members from a share dialog,
**so that** I can control who can see and contribute to my document independently of their workspace role.

**Scope:**
- In: "Share" dialog on the document (accessible to document owner); search workspace members by name; assign view / comment / edit tier; remove access; Document Owner cannot set themselves below edit and cannot be demoted by others; workspace admin with explicit view-only document access is treated as view-only (document tier wins); changes take effect immediately
- Out: group or team sharing (post-launch), shareable view-only link, bulk permission assignment across documents

**Dependencies:** FOUND-04 (permissions data model)
**Priority:** P1
**Size estimate:** M

---

### PERMS-02: Server-side permission enforcement on all endpoints

**As a** security requirement,
**I want** every REST endpoint and WebSocket operation to validate the caller's document permission tier server-side,
**so that** a malicious or misconfigured client cannot bypass view-only or comment-only restrictions.

**Scope:**
- In: middleware on all document REST endpoints (read, write, export, version, comment, suggestion API) that resolves the caller's effective tier (document-level tier, overriding workspace role); WebSocket gateway rejects Yjs update ops from users without edit access; HTTP 403 and WebSocket error returned for unauthorized operations; enforcement covers both authenticated and permission-tier checks
- Out: client-side permission gating (added in UI as UX only, not as a security mechanism)

**Dependencies:** FOUND-04, FOUND-03
**Priority:** P1
**Size estimate:** M

---

### PERMS-03: Permission change audit log

**As a** workspace admin,
**I want** a queryable log of every permission change on every document,
**so that** access history is available for the Q3 compliance audit.

**Scope:**
- In: write an audit log entry on every permission grant, revoke, or tier change; log fields: document ID, actor user ID, target user ID, old tier, new tier, timestamp, IP address; admin-accessible audit log API endpoint; basic admin UI view with filters for document and date range
- Out: CSV export of the audit log (post-launch), SIEM integration, real-time alerting on suspicious access changes

**Dependencies:** PERMS-01
**Priority:** P1
**Size estimate:** S

---

## Feature: Document Templates (Epic 8)

### TMPL-01: Admin template creation and management

**As a** workspace admin,
**I want** to create, edit, and archive workspace-wide document templates using the full rich text editor,
**so that** teams can start new documents with a consistent pre-populated structure without copying from existing documents.

**Scope:**
- In: admin-only template management UI (separate route from document editing); create template from scratch using the same editor component as documents; set template name and optional description; edit existing templates; archive (soft-delete) templates — archived templates hidden from the picker but not permanently deleted; templates are workspace-wide (not project-scoped per stakeholder)
- Out: per-project template scoping, non-admin template creation, template version history

**Dependencies:** EDITOR-01 (editor component reused)
**Priority:** P3
**Size estimate:** M

---

### TMPL-02: Template instantiation on new document creation

**As an** editor,
**I want** to choose from available workspace templates when creating a new document,
**so that** I can start with a consistent structure rather than a blank page.

**Scope:**
- In: template picker modal on the "New document" action; lists all active (non-archived) workspace templates by name and description; selecting a template creates a new document pre-populated with the template's content; user proceeds directly to editing the new document; blank document option always available as the default; only users with at least edit access see the template picker
- Out: template preview before selection, template categories or tags, template usage analytics

**Dependencies:** TMPL-01
**Priority:** P3
**Size estimate:** S

---

## Feature: Export (Epic 9)

### EXPORT-01: Async export job infrastructure

**As a** developer,
**I want** all document exports dispatched as async background jobs with a consistent poll-then-download pattern,
**so that** export UX is uniform for all document sizes and users are never blocked by a synchronous HTTP response.

**Scope:**
- In: export job queue (Sidekiq or equivalent); API endpoint to enqueue an export job (returns job ID immediately with HTTP 202); status polling endpoint returning pending / processing / ready / failed; completed job exposes a signed S3 download URL; job and generated file expire after 24 hours; 30-second SLA for export completion from job start; all export formats (PDF, DOCX, Markdown) use this infrastructure
- Out: webhook on export completion (post-launch), email notification of export ready (COMM-06 event emission covers this path)

**Dependencies:** None (standalone infrastructure story)
**Priority:** P2
**Size estimate:** M

---

### EXPORT-02: PDF export

**As a** user with at least viewer access,
**I want** to export the document as a PDF that reflects my permission tier,
**so that** I can share a polished read-only snapshot with stakeholders outside the tool.

**Scope:**
- In: PDF generated via headless browser (Puppeteer or equivalent) rendering the document's HTML view; export reflects the caller's permission tier: viewers receive a clean document with no unresolved comments and no suggestion markup; editors and owners receive full content including comments and suggestions; enqueued via EXPORT-01; download link surfaced in the UI when the job is ready; file served from a signed S3 URL (24-hour expiry)
- Out: custom PDF themes, watermarking, configurable page size or margins (defaults only for launch)

**Dependencies:** EXPORT-01, EDITOR-01, FOUND-04
**Priority:** P2
**Size estimate:** M

---

### EXPORT-03: DOCX export

**As a** user with at least viewer access,
**I want** to export the document as a DOCX file,
**so that** I can continue editing it in Microsoft Word or distribute it to stakeholders who use Office.

**Scope:**
- In: DOCX generated via Pandoc (or equivalent) from the document content model; supports all rich text elements: headings, bold, italic, underline, lists, code blocks, tables, links; images downloaded from S3 and embedded inline in the DOCX; export reflects the caller's permission tier (same clean-doc rule as PDF for viewers); enqueued via EXPORT-01
- Out: company-branded DOCX styles (post-launch), tracked changes in DOCX output, comment export in DOCX format

**Dependencies:** EXPORT-01, EDITOR-01, EDITOR-04
**Priority:** P2
**Size estimate:** M

---

### EXPORT-04: Markdown export

**As a** user with at least viewer access,
**I want** to export the document as a Markdown file,
**so that** I can use the content in documentation systems, static site generators, or version-controlled wikis.

**Scope:**
- In: Markdown export converting the content model to CommonMark; headings, bold, italic, lists, code blocks, links rendered in standard Markdown; tables rendered in GFM table syntax; images exported as Markdown image references using S3 signed URLs (not downloaded/bundled); export reflects the caller's permission tier; enqueued via EXPORT-01
- Out: front matter injection, custom Markdown flavor support, bundled image download alongside the Markdown file (post-launch)

**Dependencies:** EXPORT-01, EDITOR-01
**Priority:** P3
**Size estimate:** S

---

## Dependency Map

| Story | Depends on |
|---|---|
| FOUND-02 | FOUND-01 |
| FOUND-03 | FOUND-01, FOUND-02 |
| EDITOR-01 | FOUND-02 |
| EDITOR-02–05 | EDITOR-01 |
| SYNC-01 | FOUND-02, FOUND-03, FOUND-04, EDITOR-01 |
| SYNC-02 | SYNC-01 |
| SYNC-03 | SYNC-01 |
| OFFLINE-01 | FOUND-02, SYNC-01 |
| OFFLINE-02 | OFFLINE-01, SYNC-01 |
| OFFLINE-03 | OFFLINE-02 |
| VER-01 | SYNC-01 |
| VER-02 | VER-01 |
| VER-03 | VER-01, VER-02 |
| VER-04 | VER-03, SYNC-01 |
| COMM-01 | FOUND-04, SYNC-01 |
| COMM-02 | COMM-01 |
| COMM-03 | COMM-01 |
| COMM-04 | EDITOR-01, FOUND-04 |
| COMM-05 | COMM-04, FOUND-04 |
| COMM-06 | COMM-01, COMM-02, COMM-03, COMM-04, COMM-05, PERMS-01 |
| PERMS-01 | FOUND-04 |
| PERMS-02 | FOUND-04, FOUND-03 |
| PERMS-03 | PERMS-01 |
| TMPL-01 | EDITOR-01 |
| TMPL-02 | TMPL-01 |
| EXPORT-02 | EXPORT-01, EDITOR-01, FOUND-04 |
| EXPORT-03 | EXPORT-01, EDITOR-01, EDITOR-04 |
| EXPORT-04 | EXPORT-01, EDITOR-01 |

---

## Suggested Implementation Order

1. **FOUND-01** — Architecture document; gates all real-time work and infra provisioning
2. **FOUND-04** — Permissions data model; no dependencies, can run in parallel with FOUND-01
3. **FOUND-02** — Yjs client schema; unblocks the entire editor and sync stack
4. **FOUND-03** — WebSocket gateway bootstrap; depends on FOUND-01 and FOUND-02
5. **EDITOR-01** — Basic rich text; foundational for all editor and export stories
6. **PERMS-01** — Permission management UI; unblocks PERMS-03 and COMM-06
7. **PERMS-02** — Server-side enforcement; security requirement, must land before real-time sync goes live
8. **PERMS-03** — Audit log; P1 for compliance, quick win after PERMS-01
9. **SYNC-01** — Live Yjs sync; core collaboration capability, gates SYNC-02/03, offline, and version epics
10. **SYNC-02** — Conflict resolution UX; small, high-visibility; ship immediately after SYNC-01
11. **SYNC-03** — Presence indicators; high impact for collaboration UX, depends only on SYNC-01
12. **EDITOR-02** — Code blocks; parallel with SYNC stories once EDITOR-01 is done
13. **EDITOR-03** — Tables; parallel
14. **EDITOR-04** — Image embeds (S3); needed before EXPORT-03
15. **EDITOR-05** — Links; parallel
16. **OFFLINE-01** — Local edit queue; depends on SYNC-01
17. **OFFLINE-02** — Reconnect merge; depends on OFFLINE-01
18. **OFFLINE-03** — Offline conflict notification; quick follow-on to OFFLINE-02
19. **VER-01** — Automatic snapshots; depends on SYNC-01
20. **VER-02** — Manual named versions; depends on VER-01
21. **VER-03** — Version browser UI; depends on VER-01 and VER-02
22. **VER-04** — Restore from version; depends on VER-03
23. **COMM-01** — Inline comments; depends on SYNC-01 and FOUND-04
24. **COMM-02** — Threading and @mentions; depends on COMM-01
25. **COMM-03** — Resolve/unresolve; depends on COMM-01; parallel with COMM-02
26. **COMM-04** — Suggestion mode; can start as soon as EDITOR-01 and FOUND-04 are done
27. **COMM-05** — Accept/reject; depends on COMM-04
28. **COMM-06** — Event emission; last in comments epic; consolidates all events
29. **EXPORT-01** — Async export infra; no dependencies, can start early in parallel
30. **EXPORT-02** — PDF export; after EXPORT-01, EDITOR-01, FOUND-04
31. **EXPORT-03** — DOCX export; after EXPORT-01, EDITOR-04
32. **EXPORT-04** — Markdown export; after EXPORT-01, EDITOR-01
33. **TMPL-01** — Template creation; after EDITOR-01
34. **TMPL-02** — Template instantiation; after TMPL-01

---

## Potential Additions

The following were flagged in the analysis as possibly needed but are explicitly deferred:

- **Notification delivery** — COMM-06 emits all required events to the event bus. End-to-end notification delivery (email, in-app) is out of scope for this epic per stakeholder; owned by the notifications team.
- **Comment editing after posting** — Not mentioned in requirements; flagged as post-launch.
- **Version diff view** — Not in requirements; post-launch.
- **Group/team sharing** — Not in requirements; post-launch.
- **Mobile offline support** — The mobile team has a Yjs PoC but mobile-specific offline behavior is out of scope for this epic.

---

## Coverage Check

| Feature from Analysis | Stories | Status |
|---|---|---|
| Rich Text Editor | EDITOR-01, EDITOR-02, EDITOR-03, EDITOR-04, EDITOR-05 | Covered |
| Real-Time Collaboration Sync | FOUND-01, FOUND-02, FOUND-03, SYNC-01, SYNC-02 | Covered |
| Presence Indicators | SYNC-03 | Covered |
| Offline Editing & Sync | OFFLINE-01, OFFLINE-02, OFFLINE-03 | Covered |
| Version History | VER-01, VER-02, VER-03, VER-04 | Covered |
| Comments & Suggestions (Track Changes) | COMM-01, COMM-02, COMM-03, COMM-04, COMM-05, COMM-06 | Covered |
| Document Permissions | FOUND-04, PERMS-01, PERMS-02, PERMS-03 | Covered |
| Document Templates | TMPL-01, TMPL-02 | Covered |
| Export | EXPORT-01, EXPORT-02, EXPORT-03, EXPORT-04 | Covered |

**Total stories: 34** across 4 foundation stories and 9 feature areas. All 9 features from the analyst's "Identified Features" list and all gaps from the "Gap Analysis" table have been addressed — either as explicit acceptance criteria within stories, as deferred post-launch scope, or as confirmed out-of-scope per stakeholder answers.
