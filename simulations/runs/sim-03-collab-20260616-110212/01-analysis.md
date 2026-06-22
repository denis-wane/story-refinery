# Input Analysis

## Summary
The team is embedding a Google Docs-style collaborative document editor into an existing project management tool. The feature is broad and technically complex, covering real-time multi-user editing, offline sync, version history, comments/suggestions, permissions, templates, and export — all integrated with an existing app and permissions model.

---

## Identified Features

1. **Rich Text Editor**
   - Key capabilities: headings, bold/italic/underline, bullet/numbered lists, code blocks, tables, images, links
   - User roles involved: all editors, viewers

2. **Real-Time Collaboration Sync**
   - Key capabilities: sub-500ms propagation of changes, CRDT/OT-based merge, concurrent conflict resolution (last-writer-wins on same range)
   - User roles involved: all concurrent editors

3. **Presence Indicators**
   - Key capabilities: live cursor positions with colored labels, viewer/editor distinction
   - User roles involved: all document participants

4. **Offline Editing & Sync**
   - Key capabilities: local edit queue while disconnected, merge on reconnect, conflict resolution post-reconnect
   - User roles involved: editors

5. **Version History**
   - Key capabilities: automatic snapshots every 5 min of activity, named manual snapshots, restore (implied), browsable history
   - User roles involved: editors, admins

6. **Comments & Suggestions (Track Changes)**
   - Key capabilities: inline comments on selections, suggestion mode, comment threads (implied), resolve/accept/reject suggestions
   - User roles involved: commenters, editors

7. **Document Permissions**
   - Key capabilities: view-only / can-comment / can-edit tiers per user per document, integration with existing permissions model
   - User roles involved: admins, document owners

8. **Document Templates**
   - Key capabilities: admin-created templates, pre-populated structure and placeholder content, instantiation on new document creation
   - User roles involved: admins, editors

9. **Export**
   - Key capabilities: PDF, DOCX, Markdown output formats
   - User roles involved: all users with at least view access

---

## User Roles / Personas

| Role | Description | Key needs |
|------|-------------|-----------|
| **Viewer** | Read-only access to a document | See current content, see presence indicators of others, export |
| **Commenter** | Can read and annotate | Add/resolve inline comments, view suggestions |
| **Editor** | Full edit access | Real-time typing, offline editing, accept/reject suggestions |
| **Admin** | Manages workspace and documents | Create templates, manage permissions, view all version history |
| **Document Owner** | Creator or designated owner | Grant/revoke per-user permissions, create named versions |

---

## Ambiguities & Missing Context

1. **CRDT vs. OT library choice** — Determines latency model, server architecture, and offline merge correctness. No decision made. The two approaches have different consistency guarantees, especially for offline scenarios. *(Open question acknowledged by team)*

2. **WebSocket infrastructure** — Whether to reuse existing infrastructure or introduce a dedicated WebSocket server affects deployment complexity, cost, and latency. *(Open question acknowledged)*

3. **Image/file storage strategy** — "Inline base64 vs. file storage reference" is open. Has significant impact on document size limits, export fidelity, and storage costs. *(Open question acknowledged)*

4. **Maximum document size** — Not specified. Directly impacts pagination strategy for version history, CRDT snapshot intervals, WebSocket payload sizes, and export timeouts. *(Open question acknowledged)*

5. **Existing permissions model integration** — How the three document-level tiers (view/comment/edit) map to whatever roles already exist is unspecified. Risk of conflict or duplication. *(Open question acknowledged)*

6. **Conflict resolution UX for last-writer-wins** — "Undo history preserved" is mentioned, but what does the user see when their edit is overwritten? No toast, modal, or visual indicator is described.

7. **Comment threads vs. single comments** — "Inline comments" is mentioned, but threading (replies to comments), @mentions, and notification behavior are not specified.

8. **Suggestion mode behavior** — Accept/reject by whom? Only the document owner? Any editor? Are suggestions tracked per-user with attribution?

9. **Offline conflict scope** — What happens when two users edit the same paragraph offline and both reconnect? Last-writer-wins is defined for real-time, but the offline merge strategy for this case is unspecified.

10. **Version history retention policy** — How long are automatic snapshots kept? Is there a cap on snapshot count? What triggers deletion?

11. **Template instantiation scope** — Are templates global (workspace-wide) or per-project? Can non-admins see which templates exist?

12. **Export permissions** — Can viewers export? Can commenters export the raw content (not just their annotated view)?

13. **Restore from version** — Version history mentions snapshots but doesn't state whether restore is supported, and if so, what happens to edits made after the restored snapshot.

14. **Notification model** — Are there email/in-app notifications for comments, suggestions, or mention events? Not mentioned at all.

15. **Document size and performance SLA beyond 500ms sync** — The 500ms sync SLA is specified. No SLA for initial load, export generation time, or version history retrieval is given.

---

## Gap Analysis

| # | Input Gap | What Was Unclear | Resolution | Impact on Stories |
|---|-----------|-----------------|------------|-------------------|
| G-1 | CRDT vs. OT framework | No library or approach selected; two fundamentally different architectures | **Deferred:** requires architecture decision before sync stories can be scoped | Blocks real-time sync, offline merge, and conflict resolution stories |
| G-2 | WebSocket infrastructure | Reuse existing vs. dedicated server — no decision | **Deferred:** requires infra/ops input | Affects all real-time sync stories; may require separate epic |
| G-3 | Image/file storage | Base64 inline vs. storage reference — open question | **Deferred:** requires platform/storage team input | Affects rich text editor (image support), export, and document size stories |
| G-4 | Maximum document size | No size limit stated | **Assumed:** 5MB document content limit (reasonable for SaaS PM tools) pending stakeholder confirmation | Affects CRDT snapshot intervals, export timeouts, WebSocket payload sizing |
| G-5 | Existing permissions model integration | How view/comment/edit tiers map to existing roles is unknown | **Deferred:** requires existing permissions model documentation | Blocks permissions story; may require discovery spike |
| G-6 | Last-writer-wins UX | No UI described for when a user's edit is silently overwritten | **Assumed:** show a non-blocking toast "Your edit was merged with a concurrent change" with undo affordance | Affects conflict resolution story AC |
| G-7 | Comment threading & @mentions | Only "inline comments" mentioned; threads, replies, mentions absent | **Asked:** Clarifier should surface this | Affects comments story scope significantly |
| G-8 | Suggestion mode — accept/reject permissions | Who can accept/reject suggestions is unspecified | **Assumed:** any editor can accept/reject; owner can bulk-accept | Affects suggestions story AC |
| G-9 | Offline conflict resolution (same range, both offline) | Last-writer-wins defined for real-time only; offline scenario silent | **Asked:** Clarifier should surface this | Affects offline sync story; may require different merge semantics |
| G-10 | Version history retention | No retention policy or snapshot count cap | **Assumed:** retain last 100 auto-snapshots, unlimited named versions, 90-day purge for auto-snapshots | Affects version history story AC and storage planning |
| G-11 | Template scope (global vs. per-project) | Not specified whether templates are workspace-wide or project-scoped | **Asked:** Clarifier should surface this | Affects templates story and admin UX |
| G-12 | Export permissions | Whether viewers can export is not stated | **Assumed:** viewers and above can export; export reflects their permission tier (e.g., suggestions hidden for viewers) | Affects export story AC |
| G-13 | Restore from version | Version history described; restore capability not confirmed | **Assumed:** restore is in scope; creates a new "restored from vX" version entry rather than destructive overwrite | Affects version history story scope |
| G-14 | Notification model | No mention of notifications for comments, mentions, or suggestions | **Deferred:** notifications are typically a separate system; flagged as out-of-scope for this epic unless confirmed | May spawn a separate notifications epic |
| G-15 | Performance SLAs beyond sync | Only 500ms sync SLA given; load, export, history retrieval unspecified | **Assumed:** initial load <2s for docs ≤5MB; export <30s; history list <1s | Affects AC for sync, export, and version history stories |

**Unresolved gaps (Deferred/Asked):** 8 (G-1, G-2, G-3, G-5, G-7, G-9, G-11, G-14)
**Resolved by assumption:** 7 (G-4, G-6, G-8, G-10, G-12, G-13, G-15) — all assumptions MUST be validated by stakeholder before sprint commitment.

---

## Technical Considerations

- **CRDT vs. OT is the most consequential decision in this feature.** Yjs (CRDT) is the dominant open-source choice and handles offline merges naturally. Automerge is an alternative. Both require a server-side awareness/persistence layer. OT (e.g., ShareDB) requires a centralized transform server and is harder to extend offline. This decision gates multiple epics.
- **WebSocket connection management at scale:** Presence indicators + real-time sync require persistent connections per active editor. If the existing app uses HTTP-only infrastructure, a new WebSocket gateway is likely needed. Consider connection multiplexing if the PM tool has many concurrent documents.
- **Offline sync introduces a local persistence requirement:** The client must durably queue edits (IndexedDB or similar) to survive tab closure while offline. Service worker strategy should be considered.
- **Version snapshot storage:** Automatic snapshots every 5 minutes per active document can accumulate rapidly. A differential/incremental snapshot format (storing CRDT ops, not full document copies) is strongly recommended.
- **Export pipeline:** DOCX and PDF generation from a rich CRDT document state is non-trivial. Pandoc or a headless browser (Puppeteer) approach may be needed. Export of large documents could be slow — async job with polling or webhook is safer than synchronous HTTP.
- **Permissions enforcement must be server-side:** Client-side permission checks are not sufficient. Every WebSocket op and REST endpoint must validate the caller's document tier.
- **Image storage choice affects CDN strategy:** If images are stored as references to a file store, CDN cache invalidation and signed URL expiry must be handled. Base64 inline is simpler but bloats document size and breaks the 5MB assumption at scale.

---

## Suggested Feature Decomposition

**Epic 1 — Foundation (prerequisite for everything)**
- Architecture decision spike: CRDT vs. OT, WebSocket infra (1 spike story)
- Storage decision spike: image/file handling (1 spike story)
- Permissions model integration discovery (1 spike story)

**Epic 2 — Core Editor (MVP)**
- Rich text editor embed (headings, bold/italic/underline, lists, code blocks)
- Tables and images (depends on storage decision)
- Links

**Epic 3 — Real-Time Collaboration**
- WebSocket sync layer
- Conflict resolution (last-writer-wins + UX feedback)
- Presence indicators (cursors, names, colors)

**Epic 4 — Offline Support**
- Local edit queue (IndexedDB)
- Reconnect merge
- Offline conflict resolution (pending G-9 resolution)

**Epic 5 — Version History**
- Automatic snapshots
- Manual named versions
- Version browser UI
- Restore (if confirmed in scope)

**Epic 6 — Comments & Suggestions**
- Inline comments (depends on G-7 resolution for threading scope)
- Suggestion/track-changes mode
- Accept/reject flow

**Epic 7 — Permissions**
- Per-user per-document tier assignment (view/comment/edit)
- Server-side enforcement across all endpoints

**Epic 8 — Templates**
- Admin template creation (depends on G-11 resolution for scope)
- Template instantiation on new document

**Epic 9 — Export**
- PDF export
- DOCX export
- Markdown export
- Async export job pattern (if needed for large docs)

**Priority order:** Epic 1 → Epic 2 → Epic 3 → Epic 7 → Epic 6 → Epic 4 → Epic 5 → Epic 8 → Epic 9
