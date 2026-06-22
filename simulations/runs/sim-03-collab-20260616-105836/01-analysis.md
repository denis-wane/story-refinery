# Input Analysis

## Summary
The team is embedding a Google Docs-style collaborative document editor into an existing project management tool. The scope covers real-time multi-user editing with conflict resolution, offline support, version history, commenting, permissions, templates, and export — a substantial feature set with several open architectural decisions that affect core implementation choices.

## Identified Features

1. **Rich Text Editing**
   - Key capabilities: headings, bold/italic/underline, bullet/numbered lists, code blocks, tables, images, links
   - User roles involved: Editor, Commenter, Viewer

2. **Real-Time Sync & Presence**
   - Key capabilities: sub-500ms change propagation, colored cursor/selection display, user name labels, active viewer list
   - User roles involved: Editor, Commenter, Viewer

3. **Conflict Resolution**
   - Key capabilities: automatic merge of non-overlapping edits; last-writer-wins on same character range; undo history preserved through conflict resolution
   - User roles involved: Editor (concurrent)

4. **Offline Editing & Reconnection Sync**
   - Key capabilities: local edit capture while disconnected, background sync on reconnect, merge of offline changes with server state
   - User roles involved: Editor

5. **Version History**
   - Key capabilities: automatic snapshots every 5 minutes of activity, manual named snapshots, browse/restore past versions
   - User roles involved: Editor, Admin

6. **Comments & Suggestions (Track Changes)**
   - Key capabilities: inline comments on text selections, threaded replies (assumed), suggestion mode with accept/reject, notification of comment activity (assumed)
   - User roles involved: Editor, Commenter, Viewer (read comments)

7. **Permissions Model**
   - Key capabilities: view-only / can-comment / can-edit per user per document, integration with existing permissions model
   - User roles involved: Admin, Document Owner

8. **Document Templates**
   - Key capabilities: admin-created templates, pre-populated structure and placeholder content, template selection at document creation
   - User roles involved: Admin, Editor

9. **Export**
   - Key capabilities: PDF, DOCX, Markdown export; fidelity of rich text elements across formats
   - User roles involved: Editor, Viewer (if permitted)

---

## User Roles / Personas

| Role | Description | Key Needs |
|------|-------------|-----------|
| **Editor** | Full document editing rights | Low-latency editing, reliable conflict resolution, offline support, version restore |
| **Commenter** | Can read and leave comments/suggestions but cannot directly edit content | Stable text references for comments, notification of replies |
| **Viewer** | Read-only access | Real-time reflection of others' edits, export access (TBD) |
| **Admin** | Manages templates, may control permissions at workspace level | Template authoring, permission management, audit/version review |
| **Document Owner** | Creator or designated owner of a document | Per-user permission grants, version history management |

---

## Ambiguities & Missing Context

1. **CRDT vs. OT framework** — Core architectural decision affecting every concurrent-edit story. Unresolved in open questions. Impacts conflict resolution behavior, offline sync, and server infrastructure.

2. **WebSocket infrastructure** — Whether to use existing infrastructure or a dedicated server affects latency SLA achievability (500ms) and scalability. No current baseline provided.

3. **Embedded media storage** — Inline base64 vs. external file references affects document size limits, export fidelity, offline behavior, and storage costs.

4. **Maximum document size** — No upper bound specified. Impacts pagination strategy, memory usage in browser, snapshot storage costs, and export feasibility.

5. **Version history retention policy** — How many automatic snapshots are kept? Are old snapshots pruned? At what interval does "5 minutes of activity" reset?

6. **Offline conflict behavior for same-range edits** — Last-writer-wins is specified for real-time concurrent edits, but what is the merge strategy when an offline edit and an online edit touch the same range upon reconnection?

7. **Suggestion mode workflow** — Who can accept/reject suggestions? Only editors, or also document owners? What happens when a suggestion is accepted while the suggester is offline?

8. **Comment threading and resolution** — Are comments threaded (replies)? Can comments be marked resolved? Who can resolve them?

9. **Export permissions** — Can Viewers export, or only Editors and above?

10. **Existing permissions model integration** — How does the new view/comment/edit permission map onto the existing app's role/permission structure? Is this additive or replacing?

11. **Notification system** — Are there in-app or email notifications for comments, mentions, or suggestions? None mentioned, but implied by "comments."

12. **Template permissions** — Can non-admins create personal templates? Can templates be shared at team vs. workspace level?

13. **Real-time presence granularity** — Does presence show users currently in the document (viewing the tab) or only those actively typing?

14. **Document locking / administrative override** — Can an admin lock a document to prevent edits (e.g., for auditing)?

---

## Gap Analysis

| # | Input Gap | What Was Unclear | Resolution | Impact on Stories |
|---|-----------|-----------------|------------|-------------------|
| G-1 | "What CRDT library or OT framework should we use?" | No sync algorithm chosen; CRDT and OT have fundamentally different server requirements, client models, and offline behaviors | **Deferred:** Requires architecture decision before implementation begins | Blocks all real-time sync, conflict resolution, and offline stories |
| G-2 | "Do we need a dedicated WebSocket server?" | Unknown whether existing infrastructure can meet 500ms SLA under concurrent load | **Deferred:** Requires load modeling against current infrastructure | Affects real-time sync story acceptance criteria; 500ms SLA may need revision |
| G-3 | "How do we handle embedded content?" | Inline base64 inflates document payloads and breaks large-file limits; references require storage service integration | **Deferred:** Requires storage strategy decision | Affects image/file embedding stories, offline sync stories, export fidelity, and document size limits |
| G-4 | "What's the maximum document size?" | No upper bound; affects memory budgets, snapshot storage, WebSocket payload size, and export feasibility | **Deferred:** Requires product + infra agreement | Affects performance AC on all editing stories; without a bound, SLAs cannot be validated |
| G-5 | "How does this interact with our existing permissions model?" | Integration approach unknown — additive overlay, migration, or replacement | **Deferred:** Requires review of existing permission schema | Blocks permissions story and affects all document-level access stories |
| G-6 | Offline + same-range conflict strategy | Input specifies last-writer-wins for real-time only; offline merge on reconnect for same-range edits is unspecified | **Assumed:** Apply last-writer-wins consistently, including on reconnect; offline changes treated as lower priority than server state | Affects offline sync story AC; assumption may surprise users who expect offline edits to win |
| G-7 | Version history retention policy | "Every 5 minutes of activity" — no cap on snapshot count, no pruning rule | **Assumed:** Retain last 100 automatic snapshots; manual snapshots kept indefinitely until explicitly deleted | Affects version history story and storage cost estimates |
| G-8 | Comment threading and resolution | Inline comments mentioned but no threading, reply, or resolution lifecycle described | **Assumed:** Threaded replies supported; comments can be marked resolved by the comment author or any Editor | Affects comments story scope; threading adds significant UI/data complexity |
| G-9 | Suggestion mode accept/reject authority | Who can accept or reject suggestions is unspecified | **Assumed:** Any Editor (can-edit) can accept/reject; Commenters can only create suggestions | Affects suggestion mode story AC and permissions matrix |
| G-10 | Export permissions | Not specified whether view-only users can export | **Assumed:** Viewers cannot export; Commenters and Editors can export | Affects export story AC and permissions enforcement |
| G-11 | Notification system | Comments and suggestions imply notifications; none mentioned | **Deferred:** Notifications are out of scope for this feature unless explicitly added; comments stories will note this gap | If notifications are expected, comments stories underestimate scope by 30–50% |
| G-12 | Template scope and non-admin authoring | Only admins can create templates per spec; personal/team templates not addressed | **Assumed:** Only admins create workspace-level templates; personal templates are out of scope for v1 | Affects templates story scope |
| G-13 | Presence definition | "Viewing/editing" — unclear if "viewing" means tab open or actively scrolling/typing | **Assumed:** Presence shown for all users with the document open (tab active in last 60 seconds) | Affects presence story AC and WebSocket session management |
| G-14 | Document administrative lock | No mention of freeze/lock capability for compliance or audit | **Assumed:** Out of scope for v1 | No immediate story impact; flag for compliance review |

**Unresolved gaps:** 6 (G-1, G-2, G-3, G-4, G-5, G-11 — these MUST be answered before implementation stories can be fully sized)
**Resolved by assumption:** 8 (G-6, G-7, G-8, G-9, G-10, G-12, G-13, G-14 — these MUST be validated by stakeholders before stories are baselined)

---

## Technical Considerations

- **Sync algorithm is the foundational decision.** CRDT (e.g., Yjs, Automerge) favors peer-to-peer and offline-first but requires clients to carry more state. OT (e.g., ShareDB) requires a central server to sequence operations. Yjs with y-websocket is the most common choice for this profile — but this must be decided before any concurrent-edit or offline story can be written with meaningful AC.
- **500ms latency SLA** is tight for global users. If the app has international users, regional relay infrastructure may be required. This SLA should be scoped to same-region or explicitly tiered.
- **Offline editing** requires local persistence (IndexedDB or equivalent). Service worker strategy for PWA-style offline support needs a decision.
- **Document snapshots** stored every 5 minutes at scale (many concurrent documents) require an async snapshot job, not synchronous saves. Storage backend and diff compression strategy needed.
- **Export to DOCX/PDF** for complex rich text (tables, code blocks, embedded images) is non-trivial. A server-side rendering pipeline (e.g., Pandoc, headless browser for PDF) is likely needed. This is often underestimated.
- **Existing auth/permissions integration** — the new view/comment/edit model needs to map cleanly to whatever RBAC system exists. If the existing model doesn't support document-level permissions, a new permission table is required.
- **Comment anchoring** in a CRDT/OT document is a known hard problem — comment position references shift as content is edited. The sync framework's approach to stable range anchors must be evaluated.

---

## Suggested Feature Decomposition

**Priority 1 — Core Editing Foundation (blocks everything else)**
1. Rich text editor integration (framework selection: ProseMirror/Tiptap recommended)
2. Real-time sync infrastructure (CRDT/OT decision, WebSocket setup)
3. Basic presence indicators (cursors, name labels)
4. Conflict resolution behavior (non-overlapping and same-range)

**Priority 2 — Persistence & Recovery**
5. Version history (automatic snapshots + manual save)
6. Offline editing + reconnect sync

**Priority 3 — Collaboration Layer**
7. Comments (inline, threaded, resolved state)
8. Suggestion mode (track changes)
9. Permissions (view/comment/edit per user per document + existing model integration)

**Priority 4 — Content & Administration**
10. Document templates (admin authoring + selection flow)
11. Export (PDF, DOCX, Markdown)

> **Recommendation:** Do not begin writing implementation stories until G-1 (sync algorithm), G-2 (WebSocket infrastructure), and G-5 (permissions integration) are resolved. These three decisions constrain the architecture of every other story in the feature.
