# Input Analysis

## Summary
The feature adds a Google Docs-style collaborative document editor embedded within an existing project management tool. It combines real-time multi-user co-editing with offline support, versioning, comments, permissions, templates, and export — a substantial, infrastructure-heavy capability.

---

## Identified Features

1. **Rich Text Editor**
   - Key capabilities: headings, bold/italic/underline, bullet lists, numbered lists, code blocks, tables, images, links
   - User roles involved: Editor, Viewer, Commenter

2. **Real-Time Collaboration Sync**
   - Key capabilities: sub-500ms change propagation, CRDT/OT-based merge, conflict resolution (last-writer-wins on same range)
   - User roles involved: Editor (concurrent)

3. **Presence & Awareness**
   - Key capabilities: colored cursors, name labels, viewer/editor distinction, live roster
   - User roles involved: All active document participants

4. **Offline Editing & Sync**
   - Key capabilities: local edit queue while disconnected, automatic merge-on-reconnect, conflict resolution during sync
   - User roles involved: Editor

5. **Version History**
   - Key capabilities: automatic snapshots every 5 minutes of activity, manual named versions, view/restore
   - User roles involved: Editor, Admin

6. **Comments & Suggestions**
   - Key capabilities: inline comments on text selections, suggestion mode (track-changes style), accept/reject suggestions
   - User roles involved: Commenter, Editor

7. **Document Permissions**
   - Key capabilities: view-only / can-comment / can-edit per user per document, integration with existing permissions model
   - User roles involved: Admin, Owner, Editor, Commenter, Viewer

8. **Document Templates**
   - Key capabilities: admin-created templates, placeholder content, pre-populated structure, template library
   - User roles involved: Admin, Editor (consuming templates)

9. **Export**
   - Key capabilities: export to PDF, DOCX, Markdown
   - User roles involved: Editor, Viewer (if allowed)

---

## User Roles / Personas

| Role | Description | Key Needs |
|------|-------------|-----------|
| **Editor** | Full document editing rights | Fast real-time sync, offline support, undo/redo, suggestion mode |
| **Commenter** | Can read and leave inline comments only | Comment thread creation, reply, resolve; no edit access |
| **Viewer** | Read-only access | Presence awareness, export access (TBD) |
| **Admin** | Manages workspace/project settings | Template creation, permission management, access audit |
| **Document Owner** | User who created the document | Assign permissions, manage versions, restore history |

---

## Ambiguities & Missing Context

1. **CRDT vs OT framework choice** — Determines server architecture, latency model, and whether offline merge is eventually consistent or requires server-round-trip. No default can be safely assumed.

2. **WebSocket infrastructure** — Shared vs. dedicated server affects scalability ceiling, deployment complexity, and ops ownership. Current infra capacity unknown.

3. **Image/file storage model** — Inline base64 bloats document payloads and breaks real-time diffing; reference-based requires a file storage service. No existing service referenced.

4. **Maximum document size** — Without this, no pagination, chunking, or memory management strategy can be defined. Affects both client and server design.

5. **Existing permissions model integration** — "Per user per document" permissions may conflict with project-level roles already in the system. Overlap not specified.

6. **Export permissions** — Can Viewers export? Can Commenters? Not stated.

7. **Suggestion mode acceptance** — Who can accept/reject suggestions — only the document owner, any editor, or is it configurable?

8. **Comment resolution and deletion** — Can comment authors delete their own comments? Can editors delete anyone's? No lifecycle defined.

9. **Version restore behavior** — Does restoring a version overwrite HEAD, create a new version, or branch? Concurrent edits during restore not addressed.

10. **Offline conflict scope** — "Last-writer-wins on same character range" is defined for real-time; what is the conflict resolution policy when an offline session's changes arrive and overlap with many subsequent online edits?

11. **Template instantiation** — Does "pre-populate structure" mean a copy is made (editable) or that the template is referenced (locked base)? Can templates be updated and if so, do existing documents change?

12. **Presence granularity** — Is presence per document or per paragraph/section? Does it show idle vs. actively typing distinction?

13. **Session expiry / stale cursors** — What happens to a presence cursor when a tab goes idle, crashes, or loses connection? When does it disappear?

14. **Notification model for comments** — Are users notified (in-app, email) when they are @mentioned in a comment or when a comment is resolved? Not stated.

15. **Multi-tenant / project isolation** — Documents presumably belong to a project; can a document be shared across projects or is it project-scoped only?

---

## Gap Analysis

| # | Input Gap | What Was Unclear | Resolution | Impact on Stories |
|---|-----------|-----------------|------------|-------------------|
| G-1 | "What CRDT library or OT framework should we use?" | Sync algorithm determines server architecture, merge semantics, and offline reconciliation model | **Deferred:** Requires architecture decision (recommend Yjs/CRDT for offline-first; OT for simpler server-side control) | Blocks: Real-Time Sync, Offline Editing, Conflict Resolution stories |
| G-2 | "Do we need a dedicated WebSocket server?" | Existing infra may not support persistent bi-directional connections at scale | **Deferred:** Requires infra audit — stories written assuming WebSocket abstraction layer exists | Blocks: Real-Time Sync, Presence stories |
| G-3 | "Inline base64 or reference to file storage?" | Base64 increases payload size 33%+ and breaks real-time diffing; reference model requires a storage service | **Assumed:** Reference-based (URL) storage — inline base64 is not viable for real-time sync at scale | Affects: Rich Text Editor (images), Export stories |
| G-4 | "Maximum document size?" | Without a size bound, no chunking, lazy-loading, or memory management strategy can be specified | **Deferred:** Requires product decision — recommend 5MB text content, 50MB with attachments as a starting target | Affects: All editor and sync stories; performance AC cannot be written without this |
| G-5 | "How does this interact with our existing permissions model?" | New 3-level doc permission (view/comment/edit) may conflict with or duplicate project-level roles | **Deferred:** Requires permissions model audit — stories assume additive overlay model (doc permissions can only restrict, not expand, project-level access) | Affects: Permissions story; all stories with access-gating AC |
| G-6 | Export permissions | Not stated whether Viewers can export | **Assumed:** Export requires can-edit or can-comment permission; view-only users cannot export | Affects: Export story |
| G-7 | Suggestion mode acceptance rights | Who can accept/reject track-changes suggestions is undefined | **Assumed:** Any user with can-edit permission can accept/reject | Affects: Comments & Suggestions story |
| G-8 | Comment lifecycle (delete, resolve) | No rules for comment deletion or who can resolve | **Assumed:** Comment author can delete their own; any editor can resolve; admins can delete any | Affects: Comments & Suggestions story |
| G-9 | Version restore behavior | Overwrite HEAD vs. create new version vs. branch | **Assumed:** Restore creates a new version at HEAD (non-destructive); prior HEAD is preserved in history | Affects: Version History story |
| G-10 | Offline conflict resolution policy | "Last-writer-wins on same range" defined for real-time; offline multi-edit overlap policy undefined | **Deferred:** Requires product decision — offline divergence may span many operations; CRDT choice (G-1) constrains options | Affects: Offline Editing story — AC for conflict behavior cannot be written until resolved |
| G-11 | Template instantiation model | Copy vs. reference; whether template updates propagate to existing docs | **Assumed:** Templates produce independent copies; updates to a template do not affect existing documents | Affects: Document Templates story |
| G-12 | Presence granularity and idle state | Per-document vs. per-section presence; idle/active distinction; stale cursor cleanup | **Assumed:** Per-document presence; cursor removed after 30s inactivity or disconnect; no idle/active distinction in v1 | Affects: Presence story |
| G-13 | Comment notifications | No mention of @mentions, email notifications, or in-app alerts for comment activity | **Deferred:** Notification system integration scope unknown — stories scoped to UI only; notification hooks noted as future work | Affects: Comments & Suggestions story |
| G-14 | Document scoping across projects | Whether documents are project-scoped or shareable across projects | **Assumed:** Documents are project-scoped in v1; cross-project sharing deferred | Affects: Permissions, Templates stories |

**Unresolved gaps:** 6 (G-1, G-2, G-4, G-5, G-10, G-13)
**Resolved by assumption:** 8 (G-3, G-6, G-7, G-8, G-9, G-11, G-12, G-14) — all assumptions MUST be validated by stakeholder before stories are accepted into a sprint.

---

## Technical Considerations

- **Sync algorithm (CRDT vs OT):** CRDT (e.g., Yjs, Automerge) is strongly preferred for offline-first; OT requires a central server as arbiter which complicates offline merge. This is the highest-leverage architecture decision in the entire feature.
- **Transport layer:** WebSocket is required for sub-500ms sync. If existing infrastructure uses HTTP/2 long-polling, a WebSocket upgrade or sidecar service will be needed.
- **Document storage model:** Real-time CRDT state and snapshot versions are different artifacts — the CRDT op-log and the rendered document snapshot should be stored separately to support both live sync and version restore efficiently.
- **Operational Transform on rich-text:** Tables, embedded images, and nested lists are notoriously difficult to represent in flat OT models. CRDT libraries with native tree support (Yjs `Y.XmlFragment`) handle these better.
- **Offline queue durability:** Client-side op queue needs IndexedDB or equivalent persistent storage — in-memory queues are lost on tab crash.
- **Export rendering:** PDF and DOCX export from a rich CRDT document requires a server-side rendering step (e.g., headless browser for PDF, `pandoc` or `docx` templating for DOCX). This is non-trivial and should be a separate story.
- **Performance — version snapshots:** Storing full document snapshots every 5 minutes of activity could create significant storage volume for large, heavily-edited documents. Delta-based snapshots with periodic full checkpoints are recommended.
- **Permissions enforcement:** Permission checks must happen on the server (WebSocket message handler), not just in the client UI — client-side gating is trivially bypassable.

---

## Suggested Feature Decomposition

**Phase 1 — Core Editor (prerequisite for everything)**
1. Rich Text Editor (single-user, no sync)
2. Document Permissions (view/comment/edit) — requires permissions model decision (G-5)

**Phase 2 — Real-Time Collaboration**
3. Real-Time Sync & Conflict Resolution — requires G-1 (CRDT/OT) and G-2 (WebSocket infra) resolved
4. Presence Indicators

**Phase 3 — Resilience & History**
5. Offline Editing & Sync — depends on Phase 2 + G-10 resolved
6. Version History

**Phase 4 — Collaboration Features**
7. Comments & Suggestions — depends on Phase 1 + G-13 scoped
8. Document Templates

**Phase 5 — Interoperability**
9. Export (PDF, DOCX, Markdown) — depends on Phase 1; G-6 resolved

> **Critical path blocker:** G-1 (sync algorithm) and G-2 (WebSocket infra) must be resolved before any Phase 2+ stories can be estimated or implemented. Recommend a 1-week spike before story refinement begins.
