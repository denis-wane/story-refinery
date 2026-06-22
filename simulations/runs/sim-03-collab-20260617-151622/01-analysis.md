# Input Analysis

## Summary
The team is embedding a Google Docs-style collaborative document editor into an existing project management tool. The feature spans real-time multi-user editing with conflict resolution, offline capability, versioning, comments, permissions, templates, and export — a significant surface area with several unresolved architectural decisions that will constrain implementation choices.

---

## Identified Features

1. **Rich Text Editing Engine**
   - Key capabilities: headings (H1–H? levels unspecified), bold/italic/underline, bullet lists, numbered lists, code blocks, tables, images, links
   - User roles involved: all editors
   - Notes: No mention of nesting (nested lists?), table cell formatting, or inline code vs. fenced code blocks

2. **Real-Time Collaboration Sync**
   - Key capabilities: sub-500ms change propagation to other connected clients, operational merge without data loss
   - User roles involved: all simultaneous editors
   - Notes: 500ms is an end-to-end SLA — network + server + client render; achievability depends on transport choice and geographic distribution

3. **Presence & Cursor Awareness**
   - Key capabilities: colored user cursors with name labels, viewer/editor distinction
   - User roles involved: any user with at least view permission
   - Notes: Cursor color assignment strategy unspecified (random, user-settable, role-based?)

4. **Conflict Resolution**
   - Key capabilities: auto-merge for non-overlapping edits, last-writer-wins (LWW) for same-range conflicts, undo history preserved post-merge
   - User roles involved: concurrent editors
   - Notes: "Same character range" LWW is atypical for CRDT-based systems; this may need to be reconsidered once the CRDT/OT choice is made

5. **Offline Editing & Sync**
   - Key capabilities: local edit continuation when disconnected, background sync and merge on reconnect
   - User roles involved: editors
   - Notes: Conflict resolution behavior on reconnect (particularly for long offline windows) is unspecified; no mention of offline read-only for view-only users

6. **Version History**
   - Key capabilities: auto-snapshot every 5 minutes of activity, named manual saves, implicit version diff/restore
   - User roles involved: editors (create), all permitted users (view)
   - Notes: Restore behavior (overwrite vs. branch), retention policy, and who can delete versions are unspecified

7. **Comments & Suggestions (Track Changes)**
   - Key capabilities: inline comments anchored to text selections, suggestion mode (propose changes without applying)
   - User roles involved: can-comment role minimum for comments; can-edit for suggestions unclear
   - Notes: Comment threading (replies), resolution/dismissal, and how comments survive the text they're anchored to being deleted are unspecified

8. **Document Permissions**
   - Key capabilities: per-user, per-document roles: view-only, can-comment, can-edit
   - User roles involved: document owner / admin (assign), all users (subject to)
   - Notes: Integration with existing permissions model is explicitly open; no mention of group/team-level permissions or inheritance from project membership

9. **Document Templates**
   - Key capabilities: admin-created templates with pre-populated structure and placeholder content
   - User roles involved: admins (create/manage), editors (instantiate)
   - Notes: Template versioning, template permissions, and what "placeholder content" means technically (editable fields vs. instructional text) are unspecified

10. **Export**
    - Key capabilities: export to PDF, DOCX, Markdown
    - User roles involved: any user with at least view permission (assumption)
    - Notes: Fidelity expectations (tables, images, code blocks in each format), server-side vs. client-side rendering, and file delivery mechanism (download, email, file storage) unspecified

---

## User Roles / Personas

| Role | Description | Key needs |
|------|-------------|-----------|
| Editor | Full read/write access to a document | Low-latency sync, undo history, offline continuity |
| Commenter | Can read and comment, cannot directly edit | Inline annotation, suggestion mode (unclear if allowed) |
| Viewer | Read-only access | Real-time presence (others' cursors), can view version history (unclear) |
| Admin | Manages templates and likely user permissions | Template CRUD, permission assignment, audit |
| Document Owner | Creates the document, likely initial admin | Assign per-user permissions, manage versions |

---

## Ambiguities & Missing Context

1. **CRDT vs OT framework** — The open questions call this out explicitly. The choice fundamentally affects conflict resolution semantics, offline merge behavior, and server architecture. "Last-writer-wins for same character range" may not be implementable with certain CRDTs (e.g., Yjs uses positional merges, not LWW). This must be decided before stories are estimated.

2. **WebSocket infrastructure** — Dedicated server vs. reuse of existing infra affects latency guarantees and the 500ms SLA. Unknown whether existing infra supports persistent bidirectional connections at the required scale.

3. **Embedded content storage** — Images/files referenced inline vs. stored externally changes the document model significantly (blob size, offline availability, export fidelity). Base64 inline encoding at scale is problematic.

4. **Maximum document size** — No ceiling stated. This affects pagination strategy for version history, snapshot storage costs, export render timeout limits, and whether the 500ms sync SLA holds for very large docs.

5. **Existing permissions model integration** — The product already has a permissions model. Whether collaborative document permissions are a superset, subset, or separate plane is undefined. Risk: conflicting access rules or dual-maintenance overhead.

6. **Offline conflict resolution depth** — What happens when User A edits offline for 2 hours and reconnects to a document that has diverged significantly? Is there a human-in-the-loop fallback or is auto-merge always applied?

7. **Comment lifecycle** — Threading (replies to comments)? Resolution vs. deletion? What happens to a comment when its anchor text is deleted?

8. **Suggestion mode eligibility** — Can "can-comment" users propose suggestions, or only "can-edit" users?

9. **Version history access control** — Can viewers see version history? Can commenters restore versions? No policy stated.

10. **Export permissions** — Who can export? Any viewer? Only editors? Export of sensitive documents to PDF/DOCX with no DRM may be a security concern.

11. **Template placeholder semantics** — Are placeholders structured fields (form-style) or just styled instructional text? This determines whether a template engine is needed or just a document copy.

12. **Heading level range** — "Headings" is listed as a formatting option but H1–H6 or a subset? Affects editor toolbar design and export mapping.

13. **Cursor color assignment** — Per-user persistent color, per-session random, or user-selectable? Affects user model and UI.

14. **Version retention policy** — How long are auto-snapshots kept? Is there a storage quota? Who can delete versions?

15. **Geographic/latency scope** — Is the 500ms sync SLA measured at a single datacenter or globally? Affects infrastructure requirements substantially.

---

## Gap Analysis

| # | Input Gap | What Was Unclear | Resolution | Impact on Stories |
|---|-----------|-----------------|------------|-------------------|
| G-1 | "What CRDT library or OT framework should we use?" | Conflict resolution semantics depend entirely on this choice; "last-writer-wins for same character range" may be impossible with some CRDTs | **Deferred:** Must be decided by tech lead before conflict resolution stories are written | Blocks: Real-time Sync, Conflict Resolution, Offline Sync stories |
| G-2 | "Do we need a dedicated WebSocket server or can we use our existing infrastructure?" | 500ms sync SLA feasibility is unknown without knowing transport layer | **Deferred:** Architecture decision needed; default assumption is dedicated sync service required | Blocks: Real-time Sync story; affects infra stories |
| G-3 | "How do we handle embedded content (images, files)?" | Inline base64 is impractical at scale; reference model requires file storage integration | **Assumed:** Reference-based (URL/key to file storage service); base64 rejected due to document size impact | Affects: Rich Text Editing, Offline Sync, Export stories |
| G-4 | "What's the maximum document size?" | No SLA can be committed without a size ceiling | **Deferred:** Product must define target (suggested: 1MB text content, 50 images per document as starting point for estimation) | Affects: Sync SLA story, Version History storage, Export timeout |
| G-5 | "How does this interact with our existing permissions model?" | Undefined integration boundary; risk of conflicting rules | **Deferred:** Requires review of existing permissions model with platform team | Blocks: Permissions story; affects all access-controlled stories |
| G-6 | Offline conflict resolution for long disconnection windows | Auto-merge always vs. human-in-the-loop fallback unspecified | **Assumed:** Auto-merge always applied; conflicts surfaced in undo history only (no manual merge UI in v1) | Affects: Offline Sync, Conflict Resolution stories |
| G-7 | Comment threading and lifecycle | No mention of replies, resolution, or behavior when anchor text is deleted | **Assumed:** Single-level threading (replies); comments persist when anchor text deleted (shown as orphaned); resolution by comment author or editor | Affects: Comments & Suggestions stories |
| G-8 | Suggestion mode eligibility | "can-comment" vs "can-edit" role required to submit suggestions | **Assumed:** "can-edit" required for suggestions; "can-comment" for inline comments only | Affects: Comments & Suggestions, Permissions stories |
| G-9 | Version history access control | Who can view/restore versions? | **Assumed:** view-only can view history but not restore; can-comment same; can-edit can restore; only owner/admin can delete versions | Affects: Version History story |
| G-10 | Export permissions | Who can trigger export? Any access level? | **Assumed:** Any user with at least view-only permission can export | Affects: Export story; may have security implications for sensitive documents |
| G-11 | Template placeholder semantics | Structured form fields vs. styled instructional text | **Assumed:** Plain styled text only in v1 (no structured field engine); placeholders are editorial convention, not enforced schema | Affects: Document Templates story; defers template engine complexity |
| G-12 | Heading level range | H1–H? levels supported | **Assumed:** H1–H3 in v1 (covers majority of use cases; avoids deep nesting complexity) | Affects: Rich Text Editing story, Export fidelity |
| G-13 | Cursor color assignment | Random per session, persistent per user, or user-selectable | **Assumed:** Persistent random assignment per user (stable across sessions, not user-configurable in v1) | Affects: Presence Indicators story |
| G-14 | Version retention policy | No storage quota or TTL stated | **Deferred:** Product + infra must define; blocks storage cost estimation | Affects: Version History story |
| G-15 | Geographic latency scope for 500ms SLA | Single-region vs. global SLA target | **Assumed:** Single primary region only for v1; global distribution deferred | Affects: Real-time Sync story scope and infra requirements |

**Unresolved gaps:** 5 (G-1, G-2, G-4, G-5, G-14) — these MUST be answered before dependent stories can be estimated or developed  
**Resolved by assumption:** 10 (G-3, G-6, G-7, G-8, G-9, G-10, G-11, G-12, G-13, G-15) — these MUST be validated by a stakeholder or product owner before AC is finalized

---

## Technical Considerations

- **CRDT vs OT is the central decision.** Yjs (CRDT) is the current community standard for browser-native real-time editing; Automerge is an alternative. OT (as in Google Docs) requires a central authority server and is harder to implement correctly. This choice determines whether offline merge is purely client-side or server-mediated.
- **WebSocket persistence at scale.** If the existing backend is HTTP/REST-only, a separate WebSocket gateway (e.g., via Socket.io, Liveblocks, or a custom server) is required. This is an infra addition, not just a library swap.
- **Snapshot storage costs.** Auto-snapshots every 5 minutes of activity on potentially many documents simultaneously will accumulate rapidly. A diffing/delta storage strategy (not full document per snapshot) is strongly recommended. Retention policy (G-14) is critical to cost forecasting.
- **Offline sync on mobile vs. desktop.** "Offline support" is stated without platform scope. Browser offline (Service Worker + IndexedDB) is substantially different from native mobile offline. Scope should be clarified.
- **Export rendering.** PDF/DOCX generation from rich text with tables and images typically requires server-side rendering (e.g., Puppeteer for PDF, docx library for DOCX). This is a separate service concern, not frontend work.
- **Image storage integration.** The assumed reference model (G-3) requires integration with a file storage service (S3 or equivalent). If the project management tool already has file storage, reuse it. If not, this is a new dependency.
- **Permission enforcement at the sync layer.** Real-time sync must enforce document permissions server-side — a WebSocket connection should not broadcast edits to users who have since had their access revoked.

---

## Suggested Feature Decomposition

**Phase 1 — Core Editing Foundation** *(prerequisite for everything)*
1. Rich Text Editing Engine (local, no collaboration)
2. Document Permissions (view/comment/edit per user)
3. Real-Time Sync Infrastructure (WebSocket + CRDT/OT — requires G-1 and G-2 resolved)

**Phase 2 — Collaboration Layer**
4. Presence Indicators (cursors, name labels)
5. Conflict Resolution (auto-merge + undo history)
6. Offline Editing & Sync

**Phase 3 — Productivity Features**
7. Version History (auto-snapshots + manual saves)
8. Comments & Suggestions (inline comments first, track-changes second)

**Phase 4 — Platform Integration**
9. Document Templates
10. Export (PDF, DOCX, Markdown)

> **Critical path blocker:** G-1 (CRDT/OT choice) and G-2 (WebSocket infrastructure) must be resolved before Phase 1 stories can be estimated. G-5 (permissions model integration) must be resolved before Phase 1 story 2. All other phases are blocked behind Phase 1.
