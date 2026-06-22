# Input Analysis

## Summary
The team is embedding a Google Docs-style collaborative document editor into an existing project management tool. The feature spans real-time multi-user editing with CRDT/OT conflict resolution, offline sync, comments/suggestions, permissions, version history, templates, and export — a substantial, infrastructure-heavy addition with several unresolved architectural decisions.

## Identified Features

1. **Rich Text Editing Engine**
   - Key capabilities: headings, bold/italic/underline, bullet/numbered lists, code blocks, tables, images, links
   - User roles involved: Editor, Viewer, Commenter

2. **Real-Time Collaboration Sync**
   - Key capabilities: <500ms propagation of edits to all connected clients, operation broadcasting
   - User roles involved: Editor (all concurrent)

3. **Presence & Awareness**
   - Key capabilities: live cursor positions, colored user labels, who-is-viewing list
   - User roles involved: Editor, Viewer, Commenter

4. **Conflict Resolution**
   - Key capabilities: auto-merge for non-overlapping ranges; last-writer-wins for same-range conflicts; undo history preserved
   - User roles involved: Editor

5. **Offline Editing & Sync**
   - Key capabilities: local edit queue while disconnected, merge-on-reconnect
   - User roles involved: Editor

6. **Version History**
   - Key capabilities: automatic 5-minute snapshots during activity, named manual saves, history browser/restore
   - User roles involved: Editor, Admin, Viewer (read-only)

7. **Comments & Suggestions**
   - Key capabilities: inline comments on selections, suggestion/track-changes mode, comment resolution
   - User roles involved: Commenter, Editor, Viewer (read threads)

8. **Document Permissions**
   - Key capabilities: per-user per-document roles (view-only, can-comment, can-edit), integration with existing permissions model
   - User roles involved: Admin, Document Owner

9. **Document Templates**
   - Key capabilities: admin-created templates with pre-populated structure and placeholder content
   - User roles involved: Admin, Editor (consumer)

10. **Export**
    - Key capabilities: export to PDF, DOCX, Markdown
    - User roles involved: Editor, Viewer (if export is allowed at view-only level — unspecified)

---

## User Roles / Personas

| Role | Description | Key needs |
|------|-------------|-----------|
| **Editor** | Full read-write access to a document | Reliable real-time sync, rich formatting, offline editing, undo/redo |
| **Commenter** | Can view and leave inline comments, cannot edit body | See others' presence, add/resolve comments, suggestion mode |
| **Viewer** | Read-only access | See latest state, possibly export (unspecified) |
| **Admin** | Manages templates and user permissions | Create/edit templates, assign doc-level permissions |
| **Document Owner** | Creator or designated owner of a document | Manage per-document permissions, access version history |

---

## Ambiguities & Missing Context

1. **CRDT vs OT framework choice** — Drives architecture of sync server, client library, conflict resolution guarantees, and offline merge behavior. No decision made. — *Suggested default: adopt Yjs (CRDT) — it has offline-first support and active ecosystem; OT requires a central authority server.*

2. **WebSocket infrastructure** — Whether to reuse existing infrastructure or deploy a dedicated WebSocket/collab server determines latency guarantees, scaling model, and deployment complexity. — *Suggested default: dedicated service; embedding collab traffic into a general-purpose server risks head-of-line blocking and makes scaling harder.*

3. **Embedded media storage** — Images and files can be inline base64 (simple but bloats document size) or stored as references to a file store (scalable but adds a dependency). Maximum document size interacts directly with this. — *Suggested default: reference-based with presigned URLs; base64 is not viable for large images or multi-image documents.*

4. **Maximum document size** — No SLA defined. A 500ms sync guarantee behaves very differently for a 5KB note vs a 5MB document with embedded images and 50 contributors. — *Must be defined before performance targets can be validated.*

5. **Existing permissions model integration** — "How does this interact with our existing permissions model?" is open. If the existing model is role-based at the project/workspace level, per-document per-user permissions may require a new ACL layer. Conflict between inherited and explicit permissions is unspecified. — *Must be resolved before the Permissions story can be written.*

6. **Export permissions** — Can view-only users export? Can commenters? No policy stated. — *Suggested default: export mirrors view permission (viewers can export).*

7. **Comment resolution workflow** — Who can resolve a comment? Only the comment author? Any editor? The document owner? Is a resolved comment hidden or archived? — *Suggested default: any editor or the comment author can resolve; resolved comments are archived and viewable in history.*

8. **Suggestion mode acceptance** — Who can accept/reject suggestions? Any editor, or only document owner? — *Suggested default: any editor with can-edit permission.*

9. **Version history retention policy** — How long are auto-snapshots kept? Is there a cap (e.g., last 100 versions)? Storage cost is unbounded otherwise. — *Suggested default: 90-day rolling window, capped at 500 versions.*

10. **Offline conflict granularity** — "Last-writer-wins for the same character range" is defined for real-time concurrent edits. For offline merges (potentially hours of divergence), is the same policy applied or is a manual merge UI required? — *This is a significant UX decision with no guidance.*

11. **Template instantiation** — When a user starts a document from a template, is the template copied (snapshot) or linked (live updates to template propagate)? — *Suggested default: copy at instantiation; live-linking is complex and surprising to users.*

12. **Mention/notification system** — Collaborative editors typically support `@mention` in comments to notify users. Not specified. — *Suggested default: defer to a follow-on story; note the dependency.*

13. **Mobile / browser support matrix** — Rich text + WebSocket + offline sync has very different implementation profiles on Safari/iOS vs Chrome/Desktop. No target matrix specified. — *Must be defined before frontend estimates are meaningful.*

14. **Undo/redo scope in collaboration** — Does undo revert only your own changes (local undo), or anyone's? Local undo is standard for CRDT-based editors but must be explicitly specified. — *Suggested default: local undo only.*

---

## Gap Analysis

| # | Input Gap | What Was Unclear | Resolution | Impact on Stories |
|---|-----------|-----------------|------------|-------------------|
| G-1 | "What CRDT library or OT framework should we use?" | Core sync architecture is unselected; drives conflict resolution, offline merge, and server topology | **Deferred:** needs architectural decision before sync stories can be estimated | Blocks: Real-Time Sync, Conflict Resolution, Offline Sync stories |
| G-2 | "Do we need a dedicated WebSocket server?" | Whether sync runs on existing infra or new service | **Deferred:** requires load/capacity analysis of existing infra | Blocks: infrastructure sizing, deployment story |
| G-3 | "How do we handle embedded content — inline base64 or reference?" | Storage model for images/files directly affects max doc size, sync payload size, and CDN/storage dependencies | **Assumed:** reference-based file storage with presigned URLs (base64 not viable at scale) | Affects: Rich Text Editing, Export, Offline Sync stories |
| G-4 | "What's the maximum document size we need to support?" | No performance SLA can be validated without a size bound | **Deferred:** must be defined by product before 500ms sync guarantee can be spec'd | Affects: Real-Time Sync, Export, Version History stories |
| G-5 | "How does this interact with our existing permissions model?" | ACL inheritance vs override rules are undefined; may require new data layer | **Deferred:** requires audit of existing permissions system | Blocks: Permissions story entirely |
| G-6 | Export permissions (view-only users) | Whether Viewers can trigger export is unspecified | **Assumed:** export is allowed at view-only permission level | Affects: Export story, Permissions story |
| G-7 | Comment resolution ownership | Who can resolve a comment — author only, any editor, or owner? | **Assumed:** any can-edit user or the comment author can resolve | Affects: Comments & Suggestions story |
| G-8 | Suggestion acceptance ownership | Who can accept/reject tracked changes? | **Assumed:** any can-edit user | Affects: Comments & Suggestions story |
| G-9 | Version history retention policy | No retention window or cap defined; unbounded storage otherwise | **Assumed:** 90-day rolling window, max 500 snapshots per document | Affects: Version History story, infrastructure cost |
| G-10 | Offline merge policy for long-divergence cases | "Last-writer-wins for same range" is defined for real-time; offline divergence of hours is a different problem | **Deferred:** needs UX/product decision on whether to surface a manual merge UI | Affects: Offline Sync story significantly |
| G-11 | Template instantiation model | Copy vs live-link behavior on document creation from template | **Assumed:** copy (snapshot) at instantiation time | Affects: Templates story |
| G-12 | @mention/notification in comments | Not specified; common expectation in collaborative editors | **Deferred:** defer to follow-on story; note dependency in Comments story | Affects: Comments story (scope boundary) |
| G-13 | Browser/device support matrix | Rich text + WebSocket + offline has different profiles on Safari iOS vs Chrome desktop | **Deferred:** must be defined by product before frontend stories estimated | Affects: all frontend stories |
| G-14 | Undo/redo scope | Local undo (your edits only) vs global undo (anyone's edits) | **Assumed:** local undo only (standard CRDT behavior) | Affects: Conflict Resolution story, Rich Text Editing story |

**Unresolved gaps:** 7 (G-1, G-2, G-4, G-5, G-10, G-12, G-13) — these MUST be answered before the affected stories can be estimated or finalized.
**Resolved by assumption:** 7 (G-3, G-6, G-7, G-8, G-9, G-11, G-14) — these MUST be validated by stakeholders before development begins.

---

## Technical Considerations

- **CRDT vs OT is the most consequential decision.** Yjs (CRDT) is recommended: it natively supports offline-first, has browser and Node.js bindings, and doesn't require a central operation sequencer. OT (e.g., ShareDB) requires an authoritative server to serialize operations, which complicates offline merge significantly.
- **WebSocket server topology.** A dedicated collaboration service (or use of a managed solution like Liveblocks/PartyKit) should be evaluated against building on existing infrastructure. This is not a simple extension — collab traffic is stateful and latency-sensitive.
- **500ms sync SLA.** This is the 95th-percentile requirement, presumably. It needs to account for server round-trip, broadcast fan-out to N clients, and client DOM reconciliation. At scale (50+ concurrent editors on a large document), this SLA may require server-side optimizations not called out in the requirements.
- **Offline sync merge.** The offline scenario involves potentially hours of divergence. CRDT handles this mathematically but the *user experience* of a large merge is unspecified — silent merge is fine for non-overlapping edits, but the same-range LWW policy may produce confusing results after long offline periods.
- **Version snapshot storage.** Every 5 minutes of activity across all documents generates significant storage. At scale, snapshots should be stored as deltas, not full copies, or costs will grow non-linearly.
- **Permissions ACL layer.** Per-user per-document permissions that override workspace-level roles require an ACL table in the data model. If the existing system is purely role-based, this is a schema and auth middleware change, not just a UI feature.
- **Export fidelity.** DOCX and PDF export from a rich-text CRDT document is non-trivial. Table and image fidelity, font embedding, and pagination in PDF all require a dedicated rendering pipeline (e.g., Pandoc, Puppeteer/headless Chrome, or a purpose-built renderer).
- **Presence broadcast cost.** Cursor position updates are high-frequency (every keystroke/mouse move). These must be throttled and broadcast over a separate ephemeral channel, not persisted to the document operation log.

---

## Suggested Feature Decomposition

**Phase 1 — Foundation (must resolve G-1, G-2, G-4, G-5 first)**
1. Collaboration infrastructure (CRDT/OT selection, WebSocket service, document data model)
2. Rich text editing engine (local, single-user — establishes baseline before adding sync)
3. Real-time sync (two-user baseline, <500ms SLA, no offline yet)
4. Permissions integration (depends on existing model audit)

**Phase 2 — Collaboration UX**
5. Presence indicators (cursors, labels, who's-here panel)
6. Conflict resolution (concurrent same-range LWW, undo history)
7. Comments (inline, thread view, resolution)

**Phase 3 — Resilience & Fidelity**
8. Offline support (local queue, reconnect merge — requires G-10 resolution)
9. Version history (auto-snapshots, named saves, restore)

**Phase 4 — Power Features**
10. Suggestion mode / track changes
11. Document templates
12. Export (PDF, DOCX, Markdown)
