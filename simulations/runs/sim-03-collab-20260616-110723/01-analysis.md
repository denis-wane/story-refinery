# Input Analysis

## Summary
The team is embedding a Google Docs-style collaborative document editor into an existing project management tool. The feature spans real-time multi-user editing with rich text, presence awareness, offline support, versioning, commenting, permissioning, templates, and export — a substantial surface area with several unresolved architectural and integration questions.

---

## Identified Features

1. **Rich Text Editing**
   - Key capabilities: headings, bold/italic/underline, bullet lists, numbered lists, code blocks, tables, image embedding, hyperlinks
   - User roles involved: editors, viewers

2. **Real-Time Synchronization**
   - Key capabilities: sub-500ms propagation of changes, multi-user concurrent editing, automatic conflict resolution (CRDT or OT), last-writer-wins for same-range conflicts
   - User roles involved: editors

3. **Presence & Awareness**
   - Key capabilities: live user list (viewing vs. editing), colored cursor overlays, name labels, selection highlighting
   - User roles involved: all active document users

4. **Offline Editing & Sync**
   - Key capabilities: local edits while disconnected, change queuing, merge-on-reconnect, conflict resolution after offline session
   - User roles involved: editors

5. **Version History**
   - Key capabilities: automatic snapshots every 5 minutes of activity, manual named snapshots, version browsing and restore (implied)
   - User roles involved: editors, admins

6. **Comments & Suggestions (Track Changes)**
   - Key capabilities: inline comments on selections, suggestion/track-changes mode, comment threads (implied), resolution of suggestions
   - User roles involved: commenters, editors

7. **Permissions**
   - Key capabilities: per-user per-document access levels (view-only, can-comment, can-edit), integration with existing permissions model
   - User roles involved: admins, document owners

8. **Document Templates**
   - Key capabilities: admin-created templates with pre-populated structure and placeholder content, new-document-from-template flow
   - User roles involved: admins, editors

9. **Export**
   - Key capabilities: export to PDF, DOCX, Markdown
   - User roles involved: editors, viewers (depending on permission level)

---

## User Roles / Personas

| Role | Description | Key Needs |
|------|-------------|-----------|
| Editor | Full edit rights on a document | Real-time sync, rich text tools, offline editing, version history |
| Commenter | Can annotate but not edit | Inline comments, suggestion mode, presence visibility |
| Viewer | Read-only access | Live document view, presence indicators, export |
| Admin | Manages templates and document permissions | Template CRUD, permission assignment, version restore |
| Document Owner | Creator/manager of a specific document | Permission control, named versions, export |

---

## Ambiguities & Missing Context

1. **CRDT vs. OT library choice** — Directly affects sync architecture, conflict resolution semantics, and offline merge behavior. No decision yet. Suggested default: adopt Yjs (CRDT, mature, framework-agnostic) unless existing infra mandates otherwise.

2. **WebSocket infrastructure** — Unclear if a dedicated server is required or if existing infra is reusable. Affects scalability, latency, and operational complexity. No default possible without infra audit.

3. **Image / embedded content storage** — Base64 inline vs. file storage reference has major performance implications for large documents and sync payloads. No decision stated.

4. **Maximum document size** — Pagination, snapshot, and sync strategies differ dramatically between 100KB and 50MB documents. No SLA defined.

5. **Existing permissions model integration** — No description of the current model (RBAC, ACL, per-workspace?). Per-document permissions must compose with or override existing rules; conflict resolution between the two models is undefined.

6. **Version restore behavior** — The spec mentions browsing history but doesn't define restore semantics: does restoring a version create a new snapshot, overwrite HEAD, or branch?

7. **Comment threading** — "Inline comments" could mean flat annotations or threaded replies. Suggestion mode resolution (accept/reject) is unspecified.

8. **Export permissions** — Which roles can export? Viewers exporting could be a data-leak concern in sensitive projects.

9. **Presence visibility scope** — Should presence indicators be visible across the whole app (e.g., in document list) or only inside the open document?

10. **Snapshot trigger definition** — "Every 5 minutes of activity" is ambiguous: 5 minutes of continuous editing, 5 minutes since last save, or a rolling window?

11. **Offline conflict UX** — When offline edits conflict with server state on reconnect, is there a manual resolution UI or is it fully automatic?

12. **Template placeholder behavior** — Are placeholders structured fields (typed, required) or just styled hint text?

13. **Real-time sync scope for comments** — Do comments/suggestions sync in real time alongside document content, or are they eventually consistent?

---

## Gap Analysis

| # | Input Gap | What Was Unclear | Resolution | Impact on Stories |
|---|-----------|-----------------|------------|-------------------|
| G-1 | "CRDT library or OT framework" (Open Questions) | No sync engine selected; affects all collaborative editing stories | **Deferred:** requires infra/architecture decision before implementation | Blocks stories: Real-Time Sync, Offline Editing, Conflict Resolution |
| G-2 | "Dedicated WebSocket server or existing infrastructure" (Open Questions) | Unknown if existing backend can handle persistent connections at scale | **Deferred:** requires infra audit and load estimate | Blocks stories: Real-Time Sync, Presence Indicators |
| G-3 | "Inline base64 or reference to file storage" (Open Questions) | No storage strategy for images/embedded files | **Assumed:** reference-based file storage (base64 is impractical for sync payloads >100KB) — **must validate** | Affects stories: Rich Text Editing (images), Export, Offline Editing |
| G-4 | "Maximum document size" (Open Questions) | No SLA defined; pagination, snapshot, and sync design depend on this | **Deferred:** requires product/stakeholder input | Affects stories: Sync, Version History, Export |
| G-5 | "How does this interact with our existing permissions model" (Open Questions) | Existing model structure unknown; per-document layer may conflict | **Deferred:** requires review of current RBAC/ACL model | Blocks story: Permissions |
| G-6 | Version restore semantics | Spec says "browse history" but doesn't define restore behavior | **Assumed:** restore creates a new named snapshot at HEAD (non-destructive) — **must validate** | Affects story: Version History |
| G-7 | Comment threading model | "Inline comments" could be flat or threaded | **Assumed:** threaded replies per comment anchor (consistent with Google Docs-style UX) — **must validate** | Affects stories: Comments & Suggestions |
| G-8 | Suggestion mode resolution (accept/reject) | Track-changes mode mentioned but accept/reject flow not described | **Deferred:** UX and data model need design | Affects stories: Comments & Suggestions |
| G-9 | Export permissions | No role restriction on export stated | **Deferred:** security/product decision needed (viewers exporting = data leak risk) | Affects story: Export, Permissions |
| G-10 | Presence visibility scope | Only "inside document" mentioned; app-level presence (doc list) not addressed | **Assumed:** presence is document-scoped only — **must validate** | Affects story: Presence Indicators |
| G-11 | Snapshot trigger definition | "5 minutes of activity" is ambiguous | **Assumed:** 5-minute rolling window from last edit keystroke — **must validate** | Affects story: Version History |
| G-12 | Offline conflict UX | Auto-merge assumed but same-range conflicts need a UI decision | **Deferred:** last-writer-wins is stated for same-range, but offline sessions may produce multi-range conflicts requiring UX | Affects story: Offline Editing |
| G-13 | Template placeholder behavior | Structured fields vs. hint text affects editor behavior and validation | **Deferred:** requires product design | Affects story: Document Templates |
| G-14 | Real-time sync scope for comments | Comments may or may not need sub-500ms propagation like edits | **Assumed:** comments sync in real time but are not subject to CRDT merge (server-authoritative append-only) — **must validate** | Affects stories: Comments & Suggestions, Real-Time Sync |

**Unresolved gaps:** 8 (G-1, G-2, G-4, G-5, G-8, G-9, G-12, G-13 — these MUST surface in Clarifier questions)
**Resolved by assumption:** 6 (G-3, G-6, G-7, G-10, G-11, G-14 — these MUST be validated by stakeholder)

---

## Technical Considerations

- **Sync engine is the foundational decision.** CRDT (Yjs, Automerge) vs. OT (ShareDB) determines the entire offline merge story, snapshot format, and server-side processing model. This must be resolved before any sync or offline story is implementable.
- **WebSocket scalability.** Presence and sub-500ms sync require persistent connections. If existing infra is HTTP/REST only, a new WebSocket layer (or SSE + polling fallback) is needed. Consider horizontal scaling implications (sticky sessions or pub/sub broker like Redis).
- **Document storage model.** Documents likely need a dual representation: structured CRDT/OT log for sync, plus a rendered snapshot for display and export. These must stay consistent.
- **Image handling.** Embedding binary content in CRDT operations is dangerous for payload size. A separate upload-then-reference approach is strongly recommended, with offline caching strategy for disconnected image access.
- **Export fidelity.** DOCX and PDF renderers must handle all rich text features including tables, code blocks, and images. This is non-trivial; a server-side headless render (e.g., Puppeteer for PDF, pandoc or docx libraries for DOCX) is likely required.
- **Permissions enforcement.** Per-document ACL must be enforced both at the API layer and at the WebSocket/CRDT layer (can't broadcast edits to view-only users, can't accept ops from unauthorized sessions).
- **Snapshot storage.** Automatic 5-minute snapshots for large, active documents could generate significant storage volume. A retention/pruning policy is needed but not specified.

---

## Suggested Feature Decomposition

### Phase 1 — Core Editing Foundation (highest risk, must sequence first)
1. **Rich Text Editor Integration** — scaffold editor framework (TipTap/ProseMirror/Slate), implement all formatting types
2. **Single-User Document Persistence** — save/load from backend, basic document model
3. **Permissions Model** — define and enforce view/comment/edit tiers, integrate with existing auth

### Phase 2 — Real-Time Collaboration
4. **Real-Time Sync** — WebSocket infrastructure, CRDT/OT engine, sub-500ms propagation
5. **Conflict Resolution** — same-range LWW, multi-range automatic merge
6. **Presence Indicators** — colored cursors, user list, selection sharing

### Phase 3 — Resilience & History
7. **Offline Editing** — local operation queue, reconnect sync, offline conflict handling
8. **Version History** — automatic snapshots, manual named versions, version browser

### Phase 4 — Collaboration Layer
9. **Comments & Suggestions** — inline comments, threading, suggestion/track-changes mode, accept/reject
10. **Export** — PDF, DOCX, Markdown with full fidelity

### Phase 5 — Administration
11. **Document Templates** — template CRUD for admins, new-from-template flow, placeholder behavior
