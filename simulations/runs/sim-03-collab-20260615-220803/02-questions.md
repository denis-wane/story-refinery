# Clarifying Questions

## Critical (must answer before proceeding)

1. **What is your existing permissions model?**
   Your system already has user permissions — describe it briefly: is it role-based (RBAC), resource-based ACLs, or something else? Can existing permission records be extended with new role types, or does document-level access require a separate authorization layer?
   - _Why it matters:_ The Permissions story is fully blocked. If the existing model can't be extended, a new authorization service is required, which cascades into every story that checks access (viewing, editing, commenting, exporting).
   - _Default assumption if unanswered:_ A new document-level ACL table will be created, decoupled from the existing permissions model, and the two will be joined at the API layer.

2. **What are your maximum document size and concurrent editor targets?**
   Two numbers needed: (a) maximum document size in KB/MB that the editor must handle without degradation, and (b) maximum simultaneous editors per document in the P99 case.
   - _Why it matters:_ These are the primary inputs to CRDT library selection, WebSocket room sizing, presence UI design (10 cursors vs. 200 cursors are different problems), and snapshot storage quotas. Picking the wrong library now means a rewrite later.
   - _Default assumption if unanswered:_ Max document size 2MB; max concurrent editors 25. Stories will be written to these bounds.

3. **Do you have a WebSocket-capable server today, or does one need to be built?**
   Specifically: does your current infrastructure support persistent connections (WebSocket, SSE), or is it purely HTTP/REST? If persistent connections exist, can they host a new collaboration service, or is it fully managed (e.g., behind a gateway that strips connection headers)?
   - _Why it matters:_ The Real-Time Sync and Presence stories depend on a transport layer. If one doesn't exist, a new service is the first deliverable — it's not a story, it's a prerequisite sprint.
   - _Default assumption if unanswered:_ A new dedicated WebSocket service will be provisioned. Stories will be written assuming this is in place.

4. **How should undo work when edits have been merged from another user?**
   When User A types "hello" and User B simultaneously types "world" on the same word, and LWW picks B's edit — can User A undo? If yes, does their undo revert only their own discarded edit (local undo), or can it revert the merged state visible to all users (collaborative undo)?
   - _Why it matters:_ This is the single highest-complexity decision in the conflict resolution system. Local undo is straightforward; collaborative undo requires a shared undo stack and is a known hard problem. The answer determines whether CRDT libraries like Yjs (which supports both) are required over simpler alternatives.
   - _Default assumption if unanswered:_ Local undo only — each user's undo stack reverts their own changes. Merged changes from others are not undoable by peers.

5. **Must mobile / touch-screen editing be supported in v1?**
   Rich text editing on mobile (iOS Safari, Android Chrome) is a distinct engineering effort from desktop — virtual keyboard interactions, touch selection handles, and cursor placement behave differently. Should this be in scope for initial launch?
   - _Why it matters:_ If yes, every editor story gains a mobile-acceptance criterion and the QA surface roughly doubles. If no, we can explicitly descope and note it as a Phase 4 item.
   - _Default assumption if unanswered:_ Mobile editing is out of scope for v1. The editor will be responsive for reading but editing is desktop-only.

---

## Important (strongly recommended)

1. **What is the conflict resolution unit for last-writer-wins?**
   When two users edit the "same character range," how is that range defined for LWW purposes — at the character level, word level, or paragraph level? And when LWW discards the losing edit, how (if at all) is that user notified?
   - _Why it matters:_ The Conflict Resolution story's acceptance criteria cannot be written without this. Character-level LWW and paragraph-level LWW are implemented differently and have very different user-experience implications.
   - _Default assumption if unanswered:_ LWW applies at the character level (standard CRDT behavior); the "losing" user sees their text replaced in real-time with no explicit notification beyond the visual change.

2. **Who can accept or reject suggestions in track-changes mode?**
   Options: (a) any editor, (b) the document owner only, (c) the original author of the suggestion, (d) users with a dedicated "reviewer" role. Also: can a commenter submit suggestions, or only editors?
   - _Why it matters:_ The Suggestion Mode story's permission logic depends on this. Option (a) is simplest; options (b)–(d) require additional ownership metadata on each suggestion.
   - _Default assumption if unanswered:_ Any editor can accept/reject any suggestion. Commenters can submit suggestions but cannot accept/reject.

3. **What does "5 minutes of activity" mean for auto-snapshots?**
   Is a snapshot taken every 5 wall-clock minutes while the document is open, or after 5 cumulative minutes of edit events (i.e., idle documents don't generate snapshots)? High-traffic documents could generate 288 snapshots/day under wall-clock semantics.
   - _Why it matters:_ Storage cost and snapshot pruning policy. Wall-clock snapshots require a retention/TTL policy; activity-based snapshots are naturally sparse.
   - _Default assumption if unanswered:_ Snapshots are taken after 5 minutes of edit activity (idle time does not count). Snapshots older than 30 days are pruned unless manually named.

4. **Should in-app notifications be in scope for v1?**
   Specifically: when someone comments on a document you own, or @-mentions you in a comment, do you receive a notification (in-app badge, email, or both)?
   - _Why it matters:_ Notifications are not mentioned in the requirements. If they're expected, the Comments story needs a notification-dispatch integration. If not, we need to confirm the omission is intentional so commenters aren't frustrated when their comments go unseen.
   - _Default assumption if unanswered:_ No notifications in v1. Comment visibility relies on users actively opening the document.

5. **Can documents be exported by Viewers, or only Editors and Commenters?**
   The export requirements don't specify which roles can trigger PDF/DOCX/Markdown export.
   - _Why it matters:_ The Export story's permission check differs depending on this, and it has compliance implications — a Viewer-exportable document means any read-access user can exfiltrate a full copy.
   - _Default assumption if unanswered:_ Can-comment and above can export. View-only users cannot.

---

## Nice to Have (will use reasonable defaults)

1. **How long can a user be offline before their reconnect merge is flagged or refused?**
   A user offline for 3 minutes is routine; a user offline for 4 days with heavy local edits creates a very different merge problem.
   - _Why it matters:_ Offline Sync story edge-case handling.
   - _Default assumption if unanswered:_ Merge is always attempted regardless of offline duration. If the local change set diverges by more than 24 hours of server history, a warning is shown to the user before applying.

2. **Are document templates a one-time copy or a live link?**
   When a user creates a document from a template, does editing the template later propagate changes to existing documents, or is the template content copied at creation time?
   - _Why it matters:_ Live-link templates require tracking template provenance on every document and a propagation mechanism. One-time copy is simple.
   - _Default assumption if unanswered:_ One-time copy. Template updates do not affect documents already created from it.

3. **Which heading levels are needed?**
   The requirements mention "headings" without specifying H1–H6 or a subset.
   - _Why it matters:_ Toolbar UI design and export fidelity (especially DOCX heading styles).
   - _Default assumption if unanswered:_ H1, H2, H3 only.

---

## Assumptions Being Made
_These are interpretations already baked into the analysis. Flag any that are wrong._

1. **Images are stored by reference, not inline** — A URL pointing to file storage (S3-style) is stored in the document, not base64-encoded binary. Basis: inline base64 would bloat CRDT state and is impractical for documents with multiple images.
2. **Version restore creates a new version, not an overwrite** — Restoring an old version stamps a new named version at the top of history; the intermediate history is preserved. Basis: overwrite-style restore is a common source of data loss complaints.
3. **Comments are archived on resolution, not deleted** — Resolved comments are hidden from the default view but remain accessible in an "archived" filter. Basis: deleted comments are an audit/compliance risk.
4. **Guest / anonymous access is out of scope** — No mention of unauthenticated users. All editor, commenter, and viewer roles are assumed to be authenticated users in the existing system.
5. **"Headless" export rendering is acceptable** — PDF and DOCX exports may be generated server-side (not client-side print) via a rendering pipeline. Basis: client-side PDF generation from CRDT documents has poor fidelity for tables and code blocks.
