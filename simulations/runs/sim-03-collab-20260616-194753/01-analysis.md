# Input Analysis

## Summary
The team is embedding a Google Docs-style collaborative document editor into an existing project management tool. The feature encompasses rich text editing, real-time multi-user sync, offline support, versioning, inline comments, granular permissions, templates, and multi-format export.

---

## Identified Features

1. **Rich Text Editor**
   - Key capabilities: headings (H1–H6?), bold/italic/underline, bullet/numbered lists, code blocks, tables, images, links
   - User roles involved: editors, viewers, commenters

2. **Real-Time Collaboration & Presence**
   - Key capabilities: sub-500ms change propagation, colored cursors, user name labels, viewer/editor presence list
   - User roles involved: all active document participants

3. **Conflict Resolution**
   - Key capabilities: auto-merge for non-overlapping edits, last-writer-wins for same-range conflicts, undo history preservation
   - User roles involved: editors (transparent to them)

4. **Offline Editing & Sync**
   - Key capabilities: local edit buffering while disconnected, automatic merge-on-reconnect
   - User roles involved: editors working in low-connectivity environments

5. **Version History**
   - Key capabilities: automatic snapshots every 5 minutes of activity, named manual snapshots, presumably version browsing/restore
   - User roles involved: editors, admins

6. **Comments & Suggestions**
   - Key capabilities: inline comments anchored to text selections, suggestion/track-changes mode
   - User roles involved: commenters, editors, viewers (read comments)

7. **Permissions**
   - Key capabilities: per-user per-document roles: view-only, can-comment, can-edit
   - User roles involved: admins, document owners (who can grant?), all user types

8. **Document Templates**
   - Key capabilities: admin-created templates with pre-populated structure and placeholder content
   - User roles involved: admins (create), editors (use)

9. **Export**
   - Key capabilities: export to PDF, DOCX, Markdown
   - User roles involved: editors, viewers (can viewers export?), admins

---

## User Roles / Personas

| Role | Description | Key needs |
|------|-------------|-----------|
| Editor | Can read and write document content | Seamless real-time editing, reliable conflict handling, offline capability |
| Commenter | Can read and leave inline comments, cannot modify body text | Comment anchoring that survives edits to surrounding text |
| Viewer | Read-only access | Accurate rendering of rich content, can see live changes, may or may not export |
| Admin | Manages templates, user permissions | Template creation UI, permission management, version audit |
| Document Owner | Presumably the creator or a designated role | Grant/revoke permissions per document |
| Anonymous / Guest | Not stated — may be a gap | TBD if public sharing is in scope |

---

## Ambiguities & Missing Context

1. **CRDT vs. OT framework** — The choice fundamentally shapes server architecture, merge semantics, and client library size. Listed as an open question but must be resolved before any engineering begins. — *Suggested default: Yjs (CRDT) — mature, browser-native, widely adopted.*

2. **Document size limits** — "Maximum document size" is an open question. Pagination, performance targets, and snapshot storage all depend on this. — *Suggested default: flag as P0 blocker; pick a working limit (e.g., 5 MB body, 1000 pages) for MVP.*

3. **Media storage strategy** — Open question: inline base64 vs. file storage references. Inline base64 bloats CRDT state and snapshot size significantly. — *Suggested default: reference-based (S3/CDN URLs) with upload-on-paste behavior.*

4. **Who can grant permissions?** — Spec says "per user per document" but doesn't say who controls it. Document owner? Any editor? Admin only? — *This affects the permissions UI and API surface area.*

5. **Viewer export rights** — Can view-only users export the document? Export as "printing" is a common loophole for content that should stay contained. — *Needs explicit policy decision.*

6. **Version restore** — Versioning describes creating snapshots but says nothing about restoring them. Is restore in scope? Who can restore? Does restore create a new version or overwrite? — *Assumed out of scope for MVP unless specified.*

7. **Comment lifecycle** — No spec on resolving, deleting, or threading comments. Can comments be deleted by anyone or only the author/admin? Is threading (replies) required? — *Needs clarification; suggestions mode similarly has no resolution workflow defined.*

8. **Suggestion / track-changes resolution** — Who can accept/reject suggestions? Only editors? The author of the surrounding text? — *Unresolved; critical for the commenter/editor role boundary.*

9. **Presence granularity** — "Show who else is viewing/editing" — does presence persist if a tab is backgrounded? What's the timeout for showing someone as "active"? — *Needs a staleness threshold (e.g., inactive after 30s).*

10. **Integration with existing permissions model** — The app already has a permissions model. How does doc-level permission layer on top? Does an "admin" in the project management tool automatically get admin rights in the doc, or is it a separate grant? — *Critical dependency; cannot design the permissions story without this.*

11. **Offline conflict escalation** — Last-writer-wins is defined for concurrent same-range edits in real-time. But an offline user returning after hours of edits may have deep structural conflicts. What happens when auto-merge fails or produces nonsense? — *No escalation path defined.*

12. **Template placeholder behavior** — "Placeholder content" — does the template system use typed placeholders (like `{{client_name}}`) that get filled in, or is it just starter text the user overwrites? — *Affects template engine complexity significantly.*

13. **Heading levels** — "Headings" is listed without specifying H1–H6 or a subset. Matters for DOCX/Markdown export fidelity. — *Suggested default: H1–H3 for MVP.*

14. **Guest / anonymous access** — Not mentioned at all. Public doc links? Share-with-anyone? — *Assumed out of scope but should be explicitly confirmed.*

15. **Notification model** — No mention of notifications for comments, mentions, or suggestions. Is `@mention` in comments in scope? — *Assumed out of scope; flag for clarification.*

---

## Gap Analysis

| # | Input Gap | What Was Unclear | Resolution | Impact on Stories |
|---|-----------|-----------------|------------|-------------------|
| G-1 | "What CRDT library or OT framework should we use?" | Determines merge semantics, server architecture, and client bundle; without this, conflict-resolution stories can't be implemented | **Deferred:** requires architecture decision before sprint 1 | Blocks: Conflict Resolution, Offline Sync, Real-Time Sync stories |
| G-2 | "What's the maximum document size?" | Storage, snapshot frequency, and UI performance all depend on this; no SLA can be written without a bound | **Deferred:** P0 blocker — needs product + infra input | Blocks: Version History, Offline, Performance AC across all stories |
| G-3 | "How do we handle embedded content (images, files)?" | Inline base64 vs. CDN references have wildly different perf/storage implications | **Assumed:** reference-based (URL to file storage); base64 ruled out due to CRDT state bloat | Affects: Rich Text Editor (image upload flow), Export (image resolution) |
| G-4 | "How does this interact with our existing permissions model?" | Doc-level roles may conflict with or duplicate project-level roles; inheritance rules unknown | **Deferred:** must audit existing permission model before designing doc permission stories | Blocks: Permissions story; affects all role-gated features |
| G-5 | Who can grant/revoke per-document permissions? | Spec says "per user per document" but no actor is identified | **Deferred:** needs product decision (doc owner? any editor? admin only?) | Blocks: Permissions UI story |
| G-6 | Can viewers export? | Export could bypass content control; policy needed | **Deferred:** explicit policy decision required | Affects: Export story AC |
| G-7 | Version restore scope | Snapshots are described but restore behavior is not | **Assumed:** restore is out of MVP scope — browsing only | Simplifies: Version History story; if wrong, adds ~1 story |
| G-8 | Comment lifecycle (resolve, delete, thread) | No workflow for comment states or replies | **Deferred:** needs product design; at minimum resolve/unresolve is expected | Affects: Comments & Suggestions story — currently untestable as specified |
| G-9 | Suggestion acceptance workflow | Who can accept/reject suggestions? No actor defined | **Deferred:** needs clarification on role boundaries | Blocks: Suggestions mode story AC |
| G-10 | Presence staleness threshold | "Who is viewing/editing" — no timeout for inactive users | **Assumed:** 30-second inactivity timeout; configurable later | Affects: Presence story AC and WebSocket heartbeat design |
| G-11 | Offline conflict escalation | Last-writer-wins defined for real-time; no path for deep offline merge failures | **Deferred:** needs UX design for conflict escalation UI | Affects: Offline Sync story — current AC is incomplete |
| G-12 | Template placeholder type | Fill-in typed slots vs. editable starter text | **Assumed:** plain editable starter text for MVP; no token substitution engine | Simplifies: Templates story — if wrong, adds significant complexity |
| G-13 | Heading levels (H1–H6 or subset) | "Headings" is unqualified | **Assumed:** H1–H3 for MVP | Affects: Rich Text Editor story AC, Export fidelity |
| G-14 | Guest / anonymous access | Not mentioned; common for doc tools | **Assumed:** out of scope; all users are authenticated | Affects: Permissions story scope |
| G-15 | @mention and notification model | Comments imply mentions; no notification layer described | **Assumed:** out of scope for this feature; handled by existing notification system if any | Affects: Comments story — mention parsing not required |
| G-16 | "Do we need a dedicated WebSocket server?" | Infrastructure dependency; affects latency guarantees | **Deferred:** infra/platform decision required | Blocks: Real-Time Sync and Offline Sync implementation |

**Unresolved gaps:** 9 (G-1, G-2, G-4, G-5, G-6, G-8, G-9, G-11, G-16) — these MUST appear in the Clarifier's questions  
**Resolved by assumption:** 7 (G-3, G-7, G-10, G-12, G-13, G-14, G-15) — these MUST be validated by stakeholder before AC is finalized

---

## Technical Considerations

- **CRDT vs. OT (G-1, G-16):** CRDT (e.g., Yjs) is decentralized-friendly and suits offline-first; OT requires a central transform server. The choice changes every story touching sync and conflict resolution. This is the single most consequential unresolved technical decision.
- **WebSocket infrastructure (G-16):** Sub-500ms sync requires persistent connections. If the existing stack is HTTP/REST-only, a dedicated WebSocket or SSE server is needed. This is a non-trivial infra addition.
- **Snapshot storage:** 5-minute activity snapshots on active documents could generate substantial storage. Need retention policy and cost estimate, especially for large documents.
- **Cursor broadcast:** Presence cursors must be broadcast at low latency (ideally <100ms) but are ephemeral — they should not be stored in the CRDT document state. Requires a separate ephemeral channel (e.g., WebSocket awareness protocol in Yjs).
- **Export fidelity:** DOCX and PDF export from rich text with tables, code blocks, and embedded images requires a server-side rendering step (e.g., Pandoc, headless browser, or a dedicated conversion service). Client-side-only export is unlikely to meet fidelity requirements.
- **Offline merge on reconnect:** The client must buffer the full operation log while offline and replay it against the server's current state on reconnect. This requires local persistence (IndexedDB) and careful ordering logic.
- **Anchor stability for comments:** Comment anchors (text selection ranges) must remain valid as surrounding text is edited. This is a known hard problem — anchors must be stored as CRDT positions, not character offsets.
- **Integration risk:** Embedding this into an existing app means the rich text editor's CSS must not leak into or inherit from the host app's styles. CSS isolation (Shadow DOM or scoped styles) should be evaluated early.

---

## Suggested Feature Decomposition

**Priority 1 — Core Editing Foundation (MVP blocker)**
1. Rich Text Editor (formatting, structure, images) — *dependency for everything*
2. Real-Time Sync & Presence — *core differentiator; needs CRDT/infra decision first*
3. Permissions (view/comment/edit) — *required before any user-facing work ships*

**Priority 2 — Collaboration Layer**
4. Conflict Resolution (auto-merge + last-writer-wins)
5. Offline Support & Sync
6. Comments (inline, without threading for MVP)

**Priority 3 — Power Features**
7. Version History (snapshots + manual; browse only, no restore)
8. Suggestions / Track Changes
9. Document Templates

**Priority 4 — Output**
10. Export (PDF, DOCX, Markdown)

**Dependencies to resolve before sprint 1:**
- CRDT/OT framework selection (G-1)
- WebSocket infrastructure decision (G-16)
- Existing permissions model audit (G-4)
- Maximum document size (G-2)
