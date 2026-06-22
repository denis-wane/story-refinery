# Clarifying Questions

## Critical (must answer before proceeding)

1. **CRDT vs. OT: which sync algorithm?**
   Your team listed this as an open question. The choice between a CRDT library (e.g., Yjs, Automerge) and an Operational Transform framework determines server architecture, offline merge semantics, and whether conflict resolution is eventually consistent or server-arbitrated. These are different stories with different acceptance criteria.
   - _Why it matters:_ Real-Time Sync, Offline Editing, and Conflict Resolution stories cannot be written with testable AC until this is decided. An OT approach requires a central server as truth arbiter; CRDT does not. Estimating Phase 2+ without this is guesswork.
   - _Default assumption if unanswered:_ CRDT (Yjs) — preferred for offline-first; avoids central arbiter; better handles rich-text tree structures (tables, nested lists).

2. **Does your existing infrastructure support persistent WebSocket connections at scale?**
   If your current backend is HTTP-only or uses long-polling, sub-500ms sync requires either a WebSocket upgrade or a dedicated sidecar service. This has infra, ops, and sprint-planning implications.
   - _Why it matters:_ Presence and Real-Time Sync stories depend on this transport. If a new service is needed, that's a separate engineering track that must start before Phase 2.
   - _Default assumption if unanswered:_ Stories are written assuming a WebSocket abstraction layer exists or will be stood up as a pre-requisite spike.

3. **How does the new per-document permission model interact with existing project-level roles?**
   You have project-level roles today. You're adding view/comment/edit per document. These may overlap, conflict, or allow users to be granted doc-level access they don't have at the project level — or vice versa.
   - _Why it matters:_ Every story with access-gating AC is potentially wrong without this. The Permissions story is a prerequisite for most others (Phase 1). The wrong model here causes rework across the board.
   - _Default assumption if unanswered:_ Additive overlay — document permissions can only restrict project-level access, never expand it. A project Viewer cannot become a document Editor.

4. **What is the offline conflict resolution policy when many online edits have occurred during disconnection?**
   "Last-writer-wins on same character range" is defined for real-time concurrent edits, but an offline session may diverge across hundreds of operations spanning many sections. The resolution policy (auto-merge all, manual review, flag conflicts) is a product decision with significant UX surface.
   - _Why it matters:_ Offline Editing AC is unwritable without this. If the answer is "manual conflict review," that's a new UI component; if it's "auto-merge always," users may silently lose work.
   - _Default assumption if unanswered:_ Auto-merge via CRDT (assuming G-1 resolves to Yjs); conflicts that cannot be merged algorithmically surface a diff view for the returning user.

5. **What is the maximum document size (text content + attachments)?**
   Without a stated ceiling, client memory management, server chunking strategy, and performance acceptance criteria cannot be written. This affects every editor and sync story.
   - _Why it matters:_ "The editor loads the document" is not a testable AC without knowing what size document must load in what time. Real-time sync stories need a data volume assumption to set latency targets.
   - _Default assumption if unanswered:_ 5 MB text content, 50 MB total with attachments. Documents exceeding this show a warning; hard-blocking upload is enforced server-side.

---

## Important (strongly recommended)

1. **Who can accept or reject track-changes suggestions — any editor, or only the document owner?**
   Suggestion mode creates a workflow dependency: if only the owner can accept, you need owner-notification and queue management. If any editor can accept, the UX is simpler but may surprise document authors.
   - _Why it matters:_ Comments & Suggestions story AC changes significantly. An owner-only model implies a notification and pending-review flow.
   - _Default assumption if unanswered:_ Any user with can-edit permission can accept or reject suggestions.

2. **Does restoring a version overwrite HEAD, or create a new version at HEAD?**
   "Restore" has two common interpretations: destructive (HEAD becomes the old version, current work is gone) or non-destructive (a new version is created from the old snapshot, current HEAD is preserved).
   - _Why it matters:_ Version History story AC differs substantially. Destructive restore with concurrent editors is a dangerous edge case requiring explicit UI warnings and lock behavior.
   - _Default assumption if unanswered:_ Non-destructive — restore creates a new HEAD version copied from the selected snapshot; prior HEAD is preserved in history.

3. **Can Viewers export documents? Can Commenters?**
   Export is a capability that could leak document content to users with read-only access. This is both a product question and a security boundary.
   - _Why it matters:_ Export story has different scope depending on the answer. If Viewers can export, that's a broader permission surface.
   - _Default assumption if unanswered:_ Export requires can-edit or can-comment permission. View-only users cannot export.

4. **Are users notified when @mentioned in a comment, or when a comment on their text is resolved?**
   Comment notifications may integrate with an existing notification system (email, in-app) or require new infrastructure. Scope varies from "no notifications in v1" to "full @mention + email digest."
   - _Why it matters:_ Determines whether Comments & Suggestions stories are self-contained or have a dependency on a notification service. Notification work is frequently underestimated.
   - _Default assumption if unanswered:_ No notifications in v1. Comment UI only. Notification hooks documented as future work.

5. **Are documents project-scoped only, or can they be shared across projects?**
   Cross-project document sharing implies a global namespace, cross-permission model, and potentially different ownership semantics than project-scoped documents.
   - _Why it matters:_ Affects Permissions and Templates stories. If cross-project sharing is in scope, the permissions model is significantly more complex.
   - _Default assumption if unanswered:_ Documents are project-scoped in v1. Cross-project sharing deferred.

---

## Nice to Have (will use reasonable defaults)

1. **Should presence show per-document or per-paragraph/section cursor positions? Is idle vs. actively-typing distinguished?**
   Per-section presence is more useful but more complex to implement and display. Idle distinction requires heartbeat tracking.
   - _Default assumption if unanswered:_ Per-document presence with colored cursors showing last known position. Cursors removed after 30 seconds of inactivity or on disconnect. No idle/active distinction in v1.

2. **What is the image/file embedding model — inline base64 or reference URLs to a storage service?**
   The original requirements list this as an open question. Base64 is simpler to implement but bloats payloads and breaks real-time diffing. Reference-based requires a file storage service.
   - _Default assumption if unanswered:_ Reference-based (URL) storage. Inline base64 is not viable at scale for real-time sync. Stories assume an existing or new file storage service provides upload endpoints.

3. **Do template updates propagate to documents created from that template, or are documents independent copies?**
   "Living" templates that propagate changes require a reference model and migration logic. Independent copies are simpler.
   - _Default assumption if unanswered:_ Documents are independent copies of the template at creation time. Template updates do not affect existing documents.

---

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **CRDT (Yjs) preferred over OT** — Basis: offline-first requirement + rich-text tree structures (tables, nested lists) are poorly served by flat OT models; no existing OT investment mentioned.
2. **Images stored by reference (URL), not inline base64** — Basis: base64 increases payload 33%+ and breaks real-time diff algorithms; no file storage service currently mentioned.
3. **Export requires can-edit or can-comment** — Basis: view-only access implies read-only; export produces a distributable copy, which is a meaningful capability escalation.
4. **Version restore is non-destructive (creates new HEAD)** — Basis: destructive restore + concurrent editors is a loss-of-work risk; non-destructive is the safer default.
5. **Comment author can delete their own; any editor can resolve; admins can delete any comment** — Basis: mirrors common platform conventions (GitHub, Notion, Confluence).
6. **Templates create independent document copies; updates do not propagate** — Basis: propagating template changes to existing documents requires a live-reference model with significant complexity; not implied by the requirements.
7. **Presence is per-document, cursors removed after 30s inactivity** — Basis: per-section presence not mentioned; 30s is a common inactivity threshold in comparable products.
8. **Documents are project-scoped in v1** — Basis: no mention of cross-project sharing; simpler permission model; can be extended later.
