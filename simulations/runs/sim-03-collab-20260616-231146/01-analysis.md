# Input Analysis

## Summary
The team wants to embed a Google Docs-style collaborative document editor into an existing project management tool. The feature is substantial: real-time multi-user editing with CRDT/OT conflict resolution, offline support, version history, comments/suggestions, granular permissions, templates, and multi-format export.

## Identified Features

1. **Rich Text Editing** — Full-featured document authoring with headings, inline formatting, lists, code blocks, tables, images, and links.
   - Key capabilities: formatting toolbar, keyboard shortcuts, copy/paste handling, image upload/embed
   - User roles involved: Editor, Viewer (read-only render)

2. **Real-Time Collaboration Sync** — Sub-500ms propagation of changes to all connected clients.
   - Key capabilities: operational transformation or CRDT engine, WebSocket transport, change broadcasting, client reconciliation
   - User roles involved: All active editors on a document

3. **Presence Indicators** — Live awareness of who is viewing or editing, with per-user colored cursors and name labels.
   - Key capabilities: cursor position broadcast, user color assignment, presence heartbeat, disconnection cleanup
   - User roles involved: All document participants

4. **Conflict Resolution** — Automatic merge for non-overlapping edits; last-writer-wins for overlapping character ranges with undo history intact.
   - Key capabilities: CRDT/OT core, merge strategy for overlapping ranges, undo stack preservation post-merge
   - User roles involved: Concurrent editors (system-managed)

5. **Offline Support** — Allow editing while disconnected; sync and merge on reconnect.
   - Key capabilities: local operation queue, connection state detection, reconnect reconciliation, conflict surface on merge
   - User roles involved: Any editor who loses connectivity

6. **Version History** — Automatic snapshots every 5 minutes of activity plus named manual saves; browsable and restorable.
   - Key capabilities: snapshot scheduler, manual save trigger, version browser UI, restore/diff between versions
   - User roles involved: Editor (save), Viewer (browse), Admin (manage retention)

7. **Comments and Suggestions** — Inline comments anchored to text selections; suggestion mode (tracked changes) with accept/reject.
   - Key capabilities: range-anchored comment threads, comment resolution, suggestion markup rendering, accept/reject actions
   - User roles involved: Commenter, Editor, Viewer (read comments)

8. **Permissions** — Per-user, per-document access levels: view-only, can-comment, can-edit.
   - Key capabilities: permission enforcement at API and UI layer, integration with existing permissions model, real-time enforcement (revoke mid-session)
   - User roles involved: Admin/Owner (grant), all other users (subject to)

9. **Document Templates** — Admins create reusable templates with pre-populated structure and placeholder content.
   - Key capabilities: template authoring UI, template library/browsing, instantiate-from-template flow, placeholder syntax
   - User roles involved: Admin (create/manage), Editor (instantiate)

10. **Export** — Export documents to PDF, DOCX, and Markdown.
    - Key capabilities: server-side render pipeline for PDF/DOCX, Markdown serializer, export triggering, async job handling for large docs
    - User roles involved: Editor, Viewer (if permitted)

## User Roles / Personas

| Role | Description | Key needs |
|------|-------------|-----------|
| Editor | Can make changes to document content | Low-latency editing, conflict transparency, offline safety |
| Commenter | Can add/resolve comments and suggestions but not edit body text | Clear distinction between comment and edit modes |
| Viewer | Read-only access | Fast document load, see presence, read comments |
| Admin/Owner | Manages document permissions and templates | Granular permission control, template authoring, audit trail |
| System / Background | Automated snapshot and sync processes | Reliable scheduling, idempotent operation |

## Ambiguities & Missing Context

1. **CRDT vs. OT library choice** — Affects entire sync and conflict resolution architecture. No framework specified and existing infrastructure constraints are unknown.
2. **WebSocket infrastructure** — Whether the team has an existing WebSocket server or needs a dedicated one determines deployment complexity and latency characteristics.
3. **Image/file storage strategy** — Inline base64 bloats document payloads and breaks real-time sync performance; reference-based storage requires a separate asset service. Strategy unspecified.
4. **Maximum document size** — Directly impacts CRDT snapshot strategy, version storage costs, export timeouts, and real-time sync feasibility. No bound given.
5. **Existing permissions model integration** — Whether "view/comment/edit" maps cleanly to current permission primitives or requires schema changes is unknown; mid-session revocation behavior undefined.
6. **Offline merge conflict surface** — When reconnecting after offline edits, does the user see a conflict UI or is it always auto-merged? The spec says "sync and merge" but doesn't address irreconcilable cases.
7. **Presence for Viewers vs. Editors** — Are viewers shown in the presence indicator? Do they consume a collaboration "seat"?
8. **Comment threading depth** — Are replies to comments supported, or is it a flat list of comments per selection?
9. **Suggestion mode scope** — Does suggestion mode apply only to text edits or also to formatting changes (bold, heading level, etc.)?
10. **Version history retention policy** — How long are automatic snapshots kept? Who can delete them? Is there a storage cap?
11. **Export permissions** — Can viewers export, or is export restricted to editors and above?
12. **Template placeholder syntax** — What mechanism defines placeholders (e.g., `{{field_name}}`), and is there any validation or form-fill UX on instantiation?
13. **Real-time enforcement of permission revocation** — If a user's permission is downgraded mid-session (e.g., editor → viewer), what happens to their open editing session?
14. **Snapshot trigger definition** — "Every 5 minutes of activity" — does "activity" mean any keystroke, or a threshold of edits? Does a snapshot occur on manual save regardless of the 5-minute window?

## Gap Analysis

| # | Input Gap | What Was Unclear | Resolution | Impact on Stories |
|---|-----------|-----------------|------------|-------------------|
| G-1 | "What CRDT library or OT framework should we use?" | No framework specified; choice fundamentally affects sync architecture, offline support, and conflict model | **Deferred:** Requires engineering spike comparing Yjs (CRDT), ShareDB (OT), Automerge, etc. against existing stack | Blocks story decomposition for Sync Engine; all sync/offline/conflict stories depend on this decision |
| G-2 | "Do we need a dedicated WebSocket server or can we use existing infrastructure?" | Existing infrastructure capacity and protocol support unknown | **Deferred:** Requires infra audit; affects deployment story and latency SLA feasibility | Affects real-time sync story and DevOps/infrastructure stories |
| G-3 | "How do we handle embedded content — inline base64 or reference to file storage?" | Both approaches have major trade-offs; no asset service mentioned | **Assumed:** Reference-based storage (URLs to existing file storage service). Base64 is incompatible with 500ms sync SLA for any non-trivial image. | Images feature story must include upload → store → embed-reference flow; sync payload story excludes binary blobs |
| G-4 | "What is the maximum document size?" | No bound specified; affects snapshot strategy, export timeout, CRDT performance | **Assumed:** 5MB of text content (≈ a 100-page document) as working target. Must be validated. | Version history storage estimation, export async job threshold, CRDT performance budget |
| G-5 | "How does this interact with our existing permissions model?" | Existing model schema unknown; "view/comment/edit" may or may not be native primitives | **Deferred:** Requires review of existing permission schema; mid-session revocation behavior completely undefined | Permissions story may require schema migration; real-time revocation is a separate story |
| G-6 | Offline merge — irreconcilable conflict handling | Spec says "sync and merge when reconnected" but does not address cases where auto-merge fails or produces semantic nonsense | **Assumed:** Auto-merge always proceeds (CRDT guarantees convergence); no user-facing conflict dialog in v1. Deferred to post-launch UX iteration. | Offline sync story scoped to always-auto-merge; no conflict resolution UI story in v1 |
| G-7 | Presence indicator — viewers included? | Spec mentions "who else is viewing/editing" but viewer role isn't explicitly addressed for presence | **Assumed:** Viewers appear in presence indicator with a distinct visual treatment (e.g., eye icon vs. cursor) | Presence story must handle two presence states: active-cursor (editor) and passive-view (viewer) |
| G-8 | Comment threading depth | Spec says "inline comments on text selections" — no mention of reply threads | **Assumed:** Flat comment + reply model (one level of replies) in v1, not nested threads | Comments story scoped accordingly; thread UI is simpler |
| G-9 | Suggestion mode scope | "Track changes style" — unclear if formatting changes (bold, heading) are tracked or only insertions/deletions | **Assumed:** Text insertions and deletions tracked; formatting changes are applied immediately (not tracked) in v1 | Suggestion mode story scoped to content changes only |
| G-10 | Version history retention | No retention duration, deletion policy, or storage cap specified | **Deferred:** Requires product and infra decision (storage cost vs. auditability). Suggest: 30-day rolling window for auto-snapshots, manual versions kept indefinitely unless explicitly deleted. | Version history story needs retention policy as a prerequisite |
| G-11 | Export permissions | Not specified whether viewers can export | **Assumed:** Export requires can-edit or can-comment; view-only users cannot export in v1 | Permissions enforcement story must include export gate |
| G-12 | Template placeholder syntax and UX | No placeholder format defined; no mention of form-fill on instantiation | **Assumed:** `{{field_name}}` syntax with simple find-replace on instantiation; no guided form UI in v1 | Templates story scoped to basic placeholder replacement; no dynamic form story |
| G-13 | Real-time permission revocation behavior | If editor is downgraded mid-session, current behavior undefined (silent? forced reload? lock?) | **Deferred:** Requires product decision. Recommend: server invalidates session token → client receives "permission changed" event → UI transitions to new access level without full reload | Permission story must include mid-session enforcement; requires server-push capability |
| G-14 | Snapshot trigger — definition of "activity" | "Every 5 minutes of activity" is ambiguous — any keystroke? A minimum edit count? And does manual save reset the timer? | **Assumed:** Activity = ≥1 edit operation in the window; auto-snapshot fires 5 min after last auto-snapshot if edits occurred; manual save does not reset auto-snapshot timer | Version history story needs precise trigger definition; snapshot scheduler story depends on this |

**Unresolved gaps:** 5 (G-1, G-2, G-5, G-10, G-13 — these MUST be addressed before architecture is finalized)

**Resolved by assumption:** 9 (G-3, G-4, G-6, G-7, G-8, G-9, G-11, G-12, G-14 — these MUST be validated by stakeholders before development begins)

## Technical Considerations

- **CRDT vs. OT is the foundational choice.** Yjs + y-websocket is the current de facto standard for new projects (CRDT, browser-native, rich text via y-prosemirror or Tiptap); ShareDB (OT) is more mature but harder to implement correctly for offline. This decision blocks everything else.
- **WebSocket connection management at scale.** Presence heartbeats, cursor broadcasts, and operation streams all compete on the same connection. Need backpressure handling, connection pooling strategy, and reconnect/resume semantics.
- **Offline operation queue durability.** IndexedDB (browser) is the practical choice for operation queuing offline. The queue must survive page refreshes and handle partial-sync on reconnect.
- **Version snapshot storage.** Storing full document snapshots every 5 minutes at scale can be expensive. Consider storing operational deltas and reconstructing snapshots on demand (like Git's object model).
- **Export pipeline.** Server-side PDF and DOCX generation requires a headless rendering service (e.g., Puppeteer for PDF, docx library for DOCX). These should be async jobs with status polling for documents above a size threshold.
- **Existing permissions integration risk.** If the current permission model doesn't have a "per-document" scope, this could require a significant schema migration. Needs early investigation.
- **Comment anchoring.** When the document is edited around an existing comment anchor, the anchor position must be tracked via the same CRDT/OT mechanism to avoid "floating" comments. This is non-trivial and often underestimated.

## Suggested Feature Decomposition

**Phase 1 — Core Editing Foundation (prerequisite for everything)**
1. Rich text editing engine (single-user, no sync)
2. Sync engine selection spike (CRDT/OT decision)
3. WebSocket infrastructure decision and setup

**Phase 2 — Real-Time Collaboration**
4. Real-time sync (multi-user edits, 500ms SLA)
5. Conflict resolution (concurrent edit handling)
6. Presence indicators (cursors, names, colors)

**Phase 3 — Persistence and Safety**
7. Version history (auto-snapshots + manual saves)
8. Offline support (queue + reconnect merge)

**Phase 4 — Permissions and Access**
9. Document permissions (view/comment/edit per user)
10. Permissions integration with existing model
11. Real-time permission revocation

**Phase 5 — Collaboration Features**
12. Comments and comment threads
13. Suggestion mode (track changes)

**Phase 6 — Content and Distribution**
14. Document templates
15. Export (PDF, DOCX, Markdown)
