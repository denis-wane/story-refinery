# Input Analysis

## Summary
The team is embedding a Google Docs-style collaborative document editor into an existing project management tool, requiring real-time multi-user editing with rich text, offline support, versioning, comments, permissions, templates, and export — a substantial feature set with significant architectural dependencies on infrastructure not described in the input.

---

## Identified Features

1. **Rich Text Editing**
   - Key capabilities: headings (H1–H? unspecified levels), bold/italic/underline, bullet/numbered lists, code blocks, tables, images, hyperlinks
   - User roles involved: Editor

2. **Real-Time Collaboration Sync**
   - Key capabilities: sub-500ms change propagation, CRDT/OT-based merge, concurrent edit handling
   - User roles involved: Editor, Viewer

3. **Presence & Awareness**
   - Key capabilities: colored cursors with name labels, viewer/editor distinction in presence UI
   - User roles involved: Editor, Viewer

4. **Conflict Resolution**
   - Key capabilities: auto-merge for non-overlapping edits, last-writer-wins (LWW) for same-range conflicts, undo history preservation across merges
   - User roles involved: Editor

5. **Offline Editing & Sync**
   - Key capabilities: local editing while disconnected, change queuing, reconnect merge
   - User roles involved: Editor

6. **Version History**
   - Key capabilities: automatic snapshots every 5 minutes of activity, named manual versions, version browsing/restore (assumed)
   - User roles involved: Editor, Admin

7. **Comments & Suggestions**
   - Key capabilities: inline comments on text selections, suggestion (track-changes) mode
   - User roles involved: Editor, Commenter

8. **Document Permissions**
   - Key capabilities: per-user per-document roles (view-only, can-comment, can-edit), integration with existing permissions model
   - User roles involved: Admin, Editor, Commenter, Viewer

9. **Document Templates**
   - Key capabilities: admin-created templates, placeholder content, pre-populated structure
   - User roles involved: Admin

10. **Export**
    - Key capabilities: PDF, DOCX, Markdown export
    - User roles involved: Editor, Viewer (permission TBD)

---

## User Roles / Personas

| Role | Description | Key Needs |
|------|-------------|-----------|
| Editor | Can read and write document content | Real-time sync, conflict-free editing, offline support, undo |
| Commenter | Can view and add comments/suggestions but not edit body text | Inline commenting, suggestion mode, presence visibility |
| Viewer | Read-only access | Live presence display, no accidental mutation |
| Admin | Manages templates and document-level permissions | Template authoring, permission assignment |
| Anonymous / Guest | Not mentioned — may be out of scope | Needs clarification |

---

## Ambiguities & Missing Context

1. **CRDT vs. OT framework choice** — Determines sync architecture, server-side complexity, and client bundle size. Without this, implementation estimates are unreliable. — *Suggested default: evaluate Yjs (CRDT) first; widely adopted, framework-agnostic.*

2. **WebSocket infrastructure** — No indication whether a WebSocket-capable server exists or needs to be provisioned. Determines deployment model and operational cost. — *Suggested default: assume new dedicated service unless confirmed otherwise.*

3. **Image/file storage strategy** — "Inline base64 or reference to file storage" is listed as an open question. Drives document size limits, CDN requirements, and export complexity. — *Suggested default: reference-based storage (avoids bloating CRDT state).*

4. **Maximum document size** — Directly affects CRDT performance bounds, snapshot storage, and export timeouts. A 10KB notepad and a 500-page spec behave very differently. — *No suggested default; must be specified.*

5. **Heading levels** — "Headings" mentioned without specifying H1–H6 or a subset. Affects editor toolbar UI and export fidelity. — *Suggested default: H1–H3.*

6. **LWW conflict specifics** — "Last-writer-wins" for same-range edits is stated, but the resolution unit is unclear (character? word? paragraph?). Also unclear how the "loser" is notified. — *Must be specified.*

7. **Undo across concurrent edits** — "Undo history preserved" with LWW is non-trivial. Does undo revert only the local user's changes, or can it revert a merged state? — *Must be specified; this is architecturally significant.*

8. **Offline conflict limit** — How long can a user be offline before reconnect merge is refused or flagged? A user offline for 3 days with heavy edits creates a very different problem than 3 minutes. — *Suggested default: merge always attempted; flag divergence > 24h for review.*

9. **Version history restore behavior** — Viewing old versions is implied, but can users restore? Does restore create a new version or overwrite? — *Suggested default: restore creates a new named version.*

10. **Comment resolution workflow** — Can comments be resolved/closed? By whom? Are resolved comments archived or deleted? — *Suggested default: resolver = original author or document editor; archived.*

11. **Suggestion mode acceptance/rejection** — Who can accept/reject suggestions — any editor, or only the document owner? — *Must be specified.*

12. **Export permissions** — Can Viewers export? Can Commenters? Not specified. — *Suggested default: can-comment and above can export.*

13. **Integration with existing permissions model** — "How does this interact with our existing permissions model?" is listed as an open question. This is a blocker for the Permissions story. — *Cannot proceed without understanding the existing model.*

14. **Template instantiation** — When a user creates a document from a template, does the template link persist (e.g., template updates propagate) or is it a one-time copy? — *Suggested default: one-time copy; no live link.*

15. **Maximum concurrent editors** — No upper bound stated. Affects WebSocket room sizing, presence UI (10 cursors vs. 200 cursors look very different), and CRDT broadcast fan-out. — *Must be specified.*

16. **Notification model** — Are users notified of new comments on their documents? Of mentions? No mention of notifications. — *Likely out of scope for v1 but must be confirmed.*

17. **Mobile / responsive support** — Not mentioned. Rich text editors on mobile are notoriously complex. — *Must be explicitly descoped or scoped.*

18. **Deletion behavior** — What happens to a document's collaboration session if the document is deleted mid-session? — *Suggested default: session terminated, users notified.*

---

## Gap Analysis

| # | Input Gap | What Was Unclear | Resolution | Impact on Stories |
|---|-----------|-----------------|------------|-------------------|
| G-1 | "What CRDT library or OT framework should we use?" | Sync architecture is undefined; story estimates and AC cannot reference specific behaviors | **Deferred:** requires tech spike; blocks Real-Time Sync and Conflict Resolution stories | Cannot finalize sync stories; spike story required first |
| G-2 | "Do we need a dedicated WebSocket server?" | Infrastructure deployment model unknown | **Deferred:** infrastructure review needed before Sync story AC can be written | Sync and Presence stories depend on server model |
| G-3 | "How do we handle images/files — inline base64 or reference?" | Storage strategy affects CRDT document size, CDN requirements, and export | **Assumed:** reference-based storage (S3-style URL stored in doc) | Image insertion story AC must specify URL storage + upload flow |
| G-4 | "What's the maximum document size?" | No size bound stated | **Deferred:** must be specified by product | Affects CRDT performance, snapshot storage quotas, export timeout SLAs |
| G-5 | "How does this interact with our existing permissions model?" | Existing permission system not described; integration scope unknown | **Deferred:** requires audit of existing permissions system | Permissions story is fully blocked |
| G-6 | Heading levels not specified | "Headings" with no level range | **Assumed:** H1–H3 supported | Toolbar story, export fidelity for PDF/DOCX |
| G-7 | LWW conflict resolution unit unclear | "Same character range" — is unit char, word, or paragraph? | **Deferred:** must be defined before conflict resolution story AC | Conflict Resolution story AC incomplete without this |
| G-8 | Undo across concurrent edits undefined | "Undo history preserved" with LWW is architecturally ambiguous | **Deferred:** requires product decision + likely tech research | Conflict Resolution story cannot be finalized |
| G-9 | Offline duration limit not specified | No policy for long-offline reconnect | **Assumed:** always attempt merge; flag divergence > 24h for manual review | Offline Sync story AC; edge case handling |
| G-10 | Version history restore behavior unspecified | Can users restore? Does restore overwrite? | **Assumed:** restore creates new named version; does not overwrite | Version History story AC |
| G-11 | Comment resolution workflow not defined | Who resolves? What happens to resolved comments? | **Assumed:** any editor can resolve; resolved comments are archived, not deleted | Comments story AC |
| G-12 | Suggestion mode acceptance/rejection ownership unspecified | Who can accept/reject suggestions | **Deferred:** product decision required | Suggestions story AC incomplete |
| G-13 | Export permissions not specified | Which roles can export? | **Assumed:** can-comment and above | Export story AC |
| G-14 | Template instantiation model unclear | Live link vs. one-time copy | **Assumed:** one-time copy at document creation | Templates story AC |
| G-15 | Maximum concurrent editors not specified | No upper bound on simultaneous editors | **Deferred:** must be specified; affects WebSocket design and presence UI | Presence and Sync stories |
| G-16 | Notification model not mentioned | No email/in-app alerts for comments, mentions | **Assumed:** out of scope for v1; confirm with product | Comments story scope |
| G-17 | Mobile/responsive support not mentioned | Rich text editing on mobile is distinct effort | **Deferred:** must be explicitly scoped or descoped | All editing stories could require mobile variants |
| G-18 | Document deletion mid-session behavior | What happens to active collaboration session on deletion | **Assumed:** session terminated immediately; editors notified with in-app message | Session lifecycle story |

**Unresolved gaps (Deferred):** 9 — G-1, G-2, G-4, G-5, G-7, G-8, G-12, G-15, G-17  
**Resolved by assumption:** 9 — G-3, G-6, G-9, G-10, G-11, G-13, G-14, G-16, G-18

---

## Technical Considerations

- **CRDT vs. OT:** This is the highest-risk architectural decision. CRDTs (Yjs, Automerge) are client-authoritative and work well offline; OT requires a server transformation step. The offline requirement in this spec strongly favors CRDT.
- **WebSocket server:** Real-time multi-user sync requires a persistent connection layer. If the existing infrastructure is HTTP/REST only, a new service (e.g., Node.js + ws, or a managed service like Liveblocks/PartyKit) is needed.
- **Document storage format:** The CRDT document state must be persisted server-side. Storing raw CRDT binary (Yjs updates) vs. a derived JSON snapshot vs. both affects query-ability and restore complexity.
- **Version snapshots:** Snapshotting every 5 minutes of activity is ambiguous — is this 5 wall-clock minutes, or 5 minutes of edit events? High-activity documents could generate large snapshot volumes.
- **Export fidelity:** DOCX export from a rich-text CRDT document (especially tables and code blocks) is non-trivial. A headless rendering pipeline (e.g., Pandoc, or a dedicated export service) may be needed.
- **Permissions integration:** Without knowing the existing permissions model, it is unknown whether document-level ACLs can be added to the existing system or require a new authorization layer.
- **Presence fan-out:** Broadcasting cursor positions to all connected editors at sub-500ms latency scales quadratically with concurrent users. An upper bound on concurrent editors is critical for capacity planning.
- **Offline merge on reconnect:** The client must queue operations locally (IndexedDB or similar) and replay them against the server state on reconnect. Merge correctness depends entirely on the chosen CRDT implementation.

---

## Suggested Feature Decomposition

### Phase 0 — Infrastructure & Foundations (blockers, must complete first)
- **SPIKE: CRDT/OT framework evaluation** *(resolves G-1)*
- **SPIKE: WebSocket server design** *(resolves G-2)*
- **SPIKE: Existing permissions model audit** *(resolves G-5)*
- **SPIKE: Maximum document size & concurrent user targets** *(resolves G-4, G-15)*

### Phase 1 — Core Editing (MVP)
1. Rich text editor (single-user, no collaboration) — headings, bold/italic/underline, lists, code blocks, tables, links
2. Real-time sync — CRDT integration, WebSocket session, sub-500ms propagation
3. Presence indicators — cursors, name labels, color assignment
4. Conflict resolution — auto-merge + LWW *(after G-7, G-8 resolved)*
5. Basic permissions — view/comment/edit per user per document *(after G-5 resolved)*

### Phase 2 — Collaboration Quality
6. Offline editing & reconnect sync
7. Version history — auto-snapshots + manual versions + restore
8. Comments — inline on selections, resolution workflow
9. Suggestion mode (track changes)

### Phase 3 — Platform Features
10. Image insertion & file embedding
11. Document templates (admin)
12. Export — PDF, DOCX, Markdown

### Phase 4 — Post-Launch
13. Notifications (if scoped in)
14. Mobile/responsive editing (if scoped in)
