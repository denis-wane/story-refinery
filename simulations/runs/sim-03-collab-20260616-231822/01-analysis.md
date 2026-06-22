# Input Analysis

## Summary
The team wants to embed a Google Docs-style collaborative editor into an existing project management tool. The feature encompasses real-time multi-user editing with conflict resolution, offline support, version history, comments/suggestions, permissions, templates, and export — a substantial full-stack capability with significant infrastructure dependencies on the existing platform.

---

## Identified Features

1. **Rich Text Editing Engine**
   — Full WYSIWYG editing surface embedded in the host app.
   - Key capabilities: headings (H1–H6?), bold/italic/underline, bullet/numbered lists, code blocks, tables, images, hyperlinks
   - User roles involved: editors, viewers

2. **Real-Time Collaboration & Presence**
   — Concurrent multi-user editing with sub-500ms propagation and visible presence.
   - Key capabilities: WebSocket-based change broadcast, colored cursor overlays, name labels, online/away status
   - User roles involved: all active document participants

3. **Conflict Resolution (CRDT/OT)**
   — Automatic merge for non-overlapping edits; last-writer-wins for same character-range conflicts with undo history intact.
   - Key capabilities: CRDT or OT engine, undo/redo stack preservation post-merge, conflict event logging (for audit?)
   - User roles involved: editors (transparent to them)

4. **Offline Editing & Sync**
   — Users can edit disconnected; changes merge on reconnect.
   - Key capabilities: local state persistence (IndexedDB or similar), change queue, reconnect detection, merge-on-sync
   - User roles involved: editors

5. **Version History**
   — Auto-snapshots every 5 minutes of activity; named manual saves; history browsable and presumably restorable.
   - Key capabilities: snapshot storage, diff view or full-copy storage, restore flow, named version management
   - User roles involved: editors (create), viewers/editors (browse), admins (manage retention?)

6. **Comments & Suggestions (Track Changes)**
   — Inline anchored comments on text selections; suggestion mode (tracked insertions/deletions).
   - Key capabilities: comment threads, reply chains, resolve/reopen, suggestion accept/reject, comment anchoring to document positions
   - User roles involved: commenters (can-comment permission), editors

7. **Permission Model**
   — Per-user, per-document access tiers.
   - Key capabilities: view-only, can-comment, can-edit; integration with existing permissions system; permission change UI
   - User roles involved: document owner, admins

8. **Document Templates**
   — Admin-created templates that pre-populate structure and placeholder content.
   - Key capabilities: template creation/editing, placeholder markup, "New from template" flow
   - User roles involved: admins (create), editors (consume)

9. **Export**
   — PDF, DOCX, Markdown output from current document state.
   - Key capabilities: server-side rendering (for PDF fidelity), fidelity mapping for DOCX/Markdown, embedded image handling in exports
   - User roles involved: viewers, editors

---

## User Roles / Personas

| Role | Description | Key needs |
|------|-------------|-----------|
| **Editor** | Full read-write access to a document | Reliable real-time sync, conflict-free editing, offline capability, undo/redo |
| **Commenter** | Can read and leave inline comments but not edit content | Stable anchor positions for comments even as document changes |
| **Viewer** | Read-only access | Accurate render of all rich-text elements; live updates from others |
| **Document Owner** | Created the document; manages permissions | Assign/revoke per-user access, manage version history, lock document |
| **Admin** | Workspace-level administrator | Create/manage templates, manage retention policy for version history |
| **Unauthenticated / External Collaborator** | Guest user accessing via share link (not specified but likely implied) | Unclear — needs resolution |

---

## Ambiguities & Missing Context

1. **CRDT vs. OT library selection** — Architectural decision affects every real-time feature. Yjs, Automerge, ShareDB (OT), or custom. Different libraries have different offline, binary data, and schema support.
2. **WebSocket infrastructure** — Dedicated server (e.g., Hare, Liveblocks, PartyKit) vs. extending existing infra. Determines scalability ceiling, deployment complexity, and cost model.
3. **Image/file storage strategy** — Inline base64 bloats document snapshots and kills performance at scale. Reference to file storage requires a file service with access control mirroring document permissions.
4. **Maximum document size** — Directly gates CRDT library choice, snapshot storage strategy, and pagination/lazy-load requirements for the editor.
5. **Version history retention policy** — How many auto-snapshots are kept? Forever? 30 days? Per plan tier? Affects storage architecture significantly.
6. **Version history: restore behavior** — Does restoring overwrite current state (destructive) or create a new version? Can viewers browse history or only editors?
7. **Conflict resolution edge cases** — "Last-writer-wins for same character range" is defined for concurrent edits, but what happens when offline edits from multiple users arrive simultaneously on reconnect? Which user's clock wins?
8. **Comment anchoring on document mutation** — If text with a comment is deleted, what happens to the comment? Detach and show in margin? Delete? Mark as orphaned?
9. **Suggestion mode (track changes) interaction with real-time sync** — If User A is in suggestion mode and User B is in direct-edit mode on the same paragraph, how do tracked changes render for each?
10. **Integration with existing permissions model** — Does "existing permissions model" already have concepts of document-level ACLs, or will this require schema changes? Is there a roles hierarchy to inherit from?
11. **Export fidelity requirements** — Are custom fonts, embedded images, tables with merged cells, and code block syntax highlighting expected in DOCX/PDF exports? Or best-effort?
12. **Guest / external collaborator access** — Share links are implied (standard for collab docs) but not mentioned. Are unauthenticated users in scope?
13. **Mobile support** — Not mentioned. Is the editor expected to work on mobile browsers or native apps?
14. **Mention / notification system** — `@mentions` in comments are standard in this product category. Not specified; likely expected by users.
15. **Document size / presence scaling** — How many concurrent editors per document should be supported? 5? 50? 500? Affects WebSocket fan-out design.

---

## Gap Analysis

| # | Input Gap | What Was Unclear | Resolution | Impact on Stories |
|---|-----------|-----------------|------------|-------------------|
| G-1 | "What CRDT library or OT framework should we use?" | Core architectural choice — affects offline merge behavior, binary support, persistence format, and bundle size | **Deferred:** Must be decided before implementation begins. Recommend spike: Yjs (CRDT, excellent offline, large ecosystem) vs. ShareDB (OT, mature, requires authoritative server) | All real-time sync, offline, and conflict resolution stories blocked |
| G-2 | "Do we need a dedicated WebSocket server?" | Determines deployment topology, horizontal scale strategy, and whether session affinity is needed | **Deferred:** Needs infra audit of existing stack. If existing infra supports sticky sessions + pub/sub (e.g., Redis), it may be extensible; otherwise a dedicated server is safer | Presence, real-time sync, and offline reconnect stories depend on this |
| G-3 | "Inline base64 or reference to file storage for embedded images/files?" | Base64 bloats CRDT doc state, snapshots, and OT ops. Reference model requires access-controlled file service | **Assumed:** Reference model (URL to file storage). This is the only scalable approach. Needs explicit stakeholder sign-off given the infra dependency | Rich text editing (images), export, and version snapshot stories |
| G-4 | "What's the maximum document size?" | Governs CRDT memory footprint, snapshot size, lazy loading strategy, and export engine limits | **Deferred:** Recommend setting a default cap (e.g., 2MB of text content, 50 embedded images) to unblock design, pending product decision | Performance SLAs for sync (<500ms), snapshot storage, export stories |
| G-5 | "How does this interact with our existing permissions model?" | Unknown whether existing model has document-level ACLs or only project/workspace-level. Schema migration risk unknown | **Deferred:** Requires audit of existing permissions schema. Stories should be written assuming a new `document_permissions` join table is needed, flagged for validation | Permissions story, template access story, export access control |
| G-6 | Version history retention policy | No mention of how long auto-snapshots are kept or whether there's a limit on snapshot count | **Assumed:** Retain last 50 auto-snapshots and all manually named versions, with no expiry. Flag for product/cost review | Version history stories; storage cost estimates |
| G-7 | Version restore behavior | Restoring a snapshot could be destructive (overwrite current) or additive (create new version). Not specified | **Assumed:** Restore creates a new named version ("Restored from [date]") and navigates to it, preserving the current state in history. Non-destructive by default | Version history stories, undo stack interaction |
| G-8 | Comment behavior on text deletion | If the anchored text of an inline comment is deleted, the expected behavior is undefined | **Assumed:** Comment becomes "orphaned" — detached from position, surfaced in a sidebar as unanchored, with original quoted text preserved for context | Comments story; comment rendering and threading |
| G-9 | Suggestion mode + real-time sync interaction | How tracked changes from one user render for another user in direct-edit mode is architecturally non-trivial | **Deferred:** Requires design spike. Recommend: suggestion-mode edits appear as pending markup to all users regardless of their mode; acceptance/rejection is an explicit action | Suggestions/track-changes story — may need to be split |
| G-10 | Guest / external collaborator access | Share links are standard in this product category but are not mentioned at all | **Deferred:** Treat as out-of-scope for v1 unless product confirms otherwise. Stories should not assume unauthenticated access | Permissions story, document sharing UI |
| G-11 | Concurrent offline merge conflict (multi-user reconnect) | "Last-writer-wins for same character range" is defined for real-time, but not for simultaneous offline reconnects | **Assumed:** Merge order determined by server receive timestamp. This is a known CRDT/OT constraint — document in stories and surface in undo history | Offline sync story, conflict resolution story |
| G-12 | Export fidelity requirements | No specification of which rich-text features must round-trip faithfully to DOCX/PDF vs. best-effort | **Assumed:** Best-effort fidelity. Known lossy elements (custom fonts, complex table layouts) documented in release notes | Export story; sets acceptance criteria for what "pass" means |
| G-13 | Mobile support | Not mentioned | **Deferred:** Assume desktop web only for v1. Mobile-responsive is a stretch goal | Rich text editor story; presence/cursor overlay story |
| G-14 | Concurrent editors per document (scale target) | "Multiple users" is undefined — 3 or 300 is architecturally very different | **Assumed:** Target ≤ 25 concurrent editors per document for v1. Flag for infra capacity planning | Real-time sync story; WebSocket fan-out design |
| G-15 | @mention / notification in comments | Not specified but strongly implied by the product category and presence feature | **Deferred:** Treat as out-of-scope for v1 unless product confirms. Comments story should include a placeholder hook | Comments story |

**Unresolved gaps:** 8 (G-1, G-2, G-4, G-5, G-9, G-10, G-13, G-15)
**Resolved by assumption:** 7 (G-3, G-6, G-7, G-8, G-11, G-12, G-14)

---

## Technical Considerations

- **CRDT vs. OT is the single most consequential decision.** Yjs is the current industry default for browser-based collab editors (used by Tiptap, ProseMirror extensions, Lexical). ShareDB (OT) is battle-tested but requires a central authoritative server, making true offline merge harder. This decision must precede any implementation.
- **Editor framework choice.** ProseMirror, Tiptap (ProseMirror wrapper), Lexical (Meta), or Quill. Each has different plugin ecosystems and CRDT binding maturity. Tiptap + Yjs is the most documented pairing currently.
- **WebSocket fan-out at scale.** For ≥25 concurrent editors, naive broadcast is O(n) per keystroke. A pub/sub layer (Redis, NATS) behind the WebSocket server is required if the existing infra doesn't already provide it.
- **Snapshot storage.** If snapshots are full document copies (simplest approach), storage grows linearly. Delta-based snapshots save cost but add restore complexity. At assumed 2MB max doc size × 50 snapshots × N documents, costs should be modeled early.
- **Offline merge on reconnect.** This requires the client to persist the full CRDT state (not just a diff) across sessions. IndexedDB is the standard mechanism; storage quotas and eviction policies need to be designed.
- **Comment position anchoring.** Comments must be anchored to document positions in the CRDT state (not character offsets), or they will drift/break as content is inserted before them. This is a known hard problem in collaborative editors.
- **Export pipeline.** PDF generation from rich text requires headless browser (Puppeteer/Playwright) or a server-side rendering library. DOCX generation via `docx` or `pandoc`. Both are server-side — this adds a rendering service dependency.
- **Integration surface with host app.** The editor will need to consume the host app's auth tokens, user identity (for presence colors/labels), and project context. This integration surface must be defined early.

---

## Suggested Feature Decomposition

**Phase 1 — Foundation (must be sequential, blocks everything)**
1. CRDT/OT framework spike + decision record
2. WebSocket infrastructure design + decision record
3. Basic rich text editor (headings, bold/italic/underline, lists) — no collaboration yet
4. Document persistence (load/save to backend)

**Phase 2 — Collaboration Core**
5. Real-time sync (multi-user editing, <500ms)
6. Presence indicators (cursors, name labels, online status)
7. Conflict resolution (automatic merge + last-writer-wins)

**Phase 3 — Resilience & History**
8. Offline editing + reconnect merge
9. Version history (auto-snapshots + manual named saves + restore)

**Phase 4 — Rich Features**
10. Comments + inline threads + resolve/reopen
11. Suggestion mode (track changes)
12. Extended rich text (code blocks, tables, images, links)

**Phase 5 — Platform Integration**
13. Permissions model (view/comment/edit per user per document)
14. Document templates (admin creation + "new from template")
15. Export (PDF, DOCX, Markdown)
