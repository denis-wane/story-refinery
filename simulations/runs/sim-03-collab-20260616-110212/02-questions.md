# Clarifying Questions

## Critical (must answer before proceeding)

1. **Which sync architecture: CRDT or OT?**
   Your team has named Yjs (CRDT), Automerge (CRDT), and ShareDB (OT) as candidates. This is the single decision that determines server topology, offline correctness, and how every real-time and conflict-resolution story is written. We cannot scope Epic 1 spike stories or any of Epics 3–4 without it.
   - _Why it matters:_ CRDT and OT require fundamentally different server-side architectures. Writing stories against "TBD sync layer" produces unimplementable acceptance criteria.
   - _Default assumption if unanswered:_ Yjs (CRDT) — it is the dominant open-source choice, handles offline merges without a centralized transform server, and has the broadest ecosystem adoption.

2. **Can real-time sync reuse your existing infrastructure, or does it need a dedicated WebSocket gateway?**
   If your current stack is HTTP-only (REST + polling), you need a new WebSocket service with its own deployment footprint, scaling strategy, and connection limits. If you already have a persistent-connection layer (e.g., ActionCable, Socket.IO, Pusher), reuse may be feasible. This is an ops/infra decision, not a product one — but it gates all sync stories.
   - _Why it matters:_ A new gateway is a non-trivial infrastructure epic. It changes team, timeline, and cost assumptions for Epics 3 and 4.
   - _Default assumption if unanswered:_ Dedicated WebSocket server required — a new service will be specced in the architecture spike.

3. **How do the three document tiers (view / comment / edit) map onto your existing permissions model?**
   The existing app already has roles and permissions. If document-level tiers are a superset of existing roles, they compose cleanly. If they conflict (e.g., a workspace Admin who is explicitly view-only on a document), the precedence rule is undefined. We need either a mapping table or confirmation that document-level tiers are fully independent and overlaid on top of existing roles.
   - _Why it matters:_ The permissions epic (Epic 7) cannot produce correct server-side enforcement logic until this is resolved. Getting it wrong means security regressions in the existing app.
   - _Default assumption if unanswered:_ Document-level tiers are additive and always take the more restrictive of the two (existing role vs. document tier) — pending permissions model documentation review.

4. **How are embedded images stored — inline base64 or references to a file store?**
   This is not a low-level implementation detail: it directly determines document size limits, export fidelity (base64 works offline; references require CDN access), storage cost model, and whether the 5MB document size assumption is realistic. It also affects whether images survive a "restore from version" operation.
   - _Why it matters:_ Image support is in scope for the MVP editor (Epic 2). Writing the image story without this resolved produces ambiguous AC.
   - _Default assumption if unanswered:_ File storage references (S3 or equivalent) with signed URLs — inline base64 is ruled out due to document size impact.

5. **When two users edit the same character range while both offline and then reconnect, what should happen?**
   The spec defines last-writer-wins for _real-time_ concurrent edits. Offline introduces a different scenario: both users believe they are the sole editor. The reconnect order determines whose edit "wins," but no merge strategy or user notification is described for this case. This is not the same as real-time conflict and may need different semantics (e.g., fork-and-merge, explicit conflict UI, or per-field last-write-timestamp).
   - _Why it matters:_ Offline sync (Epic 4) stories cannot define correct acceptance criteria without this. An incorrect assumption here produces data-loss bugs at reconnect.
   - _Default assumption if unanswered:_ Last-reconnect-wins for offline conflicts on the same range, with a non-blocking toast listing affected ranges and an undo affordance for 30 seconds.

---

## Important (strongly recommended)

1. **Do inline comments support threaded replies and @mentions?**
   The spec says "inline comments on text selections." Google Docs-style comments are threaded (multiple replies per anchor), support @mentions that trigger notifications, and have a resolved/unresolved state. A flat single-comment model is a much smaller scope. These are not the same story.
   - _Why it matters:_ Threading adds reply data model, render complexity, and notification hooks. @mentions requires user search and a notification dispatch path. Together they could double the size of Epic 6.
   - _Default assumption if unanswered:_ Threaded replies supported (up to one level of nesting); @mentions out of scope for this epic; resolved/unresolved state in scope.

2. **Who can accept or reject suggestions in suggestion/track-changes mode?**
   The spec mentions accept/reject but not by whom. Options: (a) only the Document Owner, (b) any Editor, (c) only the document's designated reviewer. This determines the permission check on the accept/reject endpoint and the UX affordances shown to each role.
   - _Why it matters:_ Wrong answer here produces incorrect server-side permission enforcement and misleading UI (buttons shown to users who can't actually act).
   - _Default assumption if unanswered:_ Any Editor-tier user can accept/reject suggestions; the Document Owner can bulk-accept all pending suggestions.

3. **Are document templates workspace-wide or scoped to individual projects?**
   If templates are global, any admin can create one and any editor sees them on new document creation. If templates are per-project, they need project-association logic, filtered display, and potentially per-project admin rights. These are different data models.
   - _Why it matters:_ Template stories (Epic 8) need a clear scope boundary. A per-project model requires join tables and filtered UI that global templates don't.
   - _Default assumption if unanswered:_ Templates are workspace-wide; any admin can create, edit, or archive them; all users with edit access see available templates.

4. **Are comment, suggestion, and @mention notifications in scope for this epic, or a separate system?**
   Notification systems are typically cross-cutting (email, in-app, push). If this epic owns notifications, it needs to spec channels, frequency, opt-out, and digest behavior — adding significant scope. If notifications are deferred to an existing or future notifications system, the stories only need to emit events.
   - _Why it matters:_ The difference between "emit a notification event" and "build the full notification pipeline" is multiple sprints.
   - _Default assumption if unanswered:_ This epic emits notification events only (pub/sub or webhook); delivery (email, in-app) is owned by the existing notifications system or a future epic.

5. **What is the version history retention policy — how many auto-snapshots are kept, and for how long?**
   Automatic snapshots every 5 minutes per active document can accumulate to thousands of entries per document per month. Without a retention policy, storage costs are unbounded and the version browser UX has no defined pagination model.
   - _Why it matters:_ Retention policy drives storage cost estimates, snapshot purge job stories, and version browser pagination AC.
   - _Default assumption if unanswered:_ Retain the last 100 auto-snapshots per document; purge auto-snapshots older than 90 days; named manual versions are retained indefinitely.

---

## Nice to Have (will use reasonable defaults)

1. **What should the user see when their real-time edit is overwritten by last-writer-wins?**
   The spec says "undo history preserved" but describes no UI. Should the user see a toast, a diff highlight, nothing?
   - _Default assumption if unanswered:_ Non-blocking toast: "Your edit was merged with a concurrent change" with a single "Undo" action, auto-dismissing after 5 seconds.

2. **Can Viewer-tier users export the document?**
   Export (Epic 9) requires a permission check. No export tier is defined.
   - _Default assumption if unanswered:_ Any user with at least Viewer access can export; suggestions and unresolved comments are hidden from Viewer exports.

3. **Is "restore from version" in scope, and does it overwrite the current document or create a new branch?**
   Version history snapshots are specified; restore is implied but not confirmed.
   - _Default assumption if unanswered:_ Restore is in scope; it creates a new version entry ("Restored from vX") rather than a destructive overwrite, preserving the current head in history.

4. **What are the performance SLAs for initial document load, export generation, and version history retrieval?**
   Only the 500ms sync SLA is specified.
   - _Default assumption if unanswered:_ Initial load <2s for documents ≤5MB; export job completion <30s (async with polling); version history list <1s for up to 500 entries.

5. **What is the maximum document size the product needs to support?**
   No size limit stated. Affects CRDT snapshot intervals, WebSocket payload design, and export timeout budgets.
   - _Default assumption if unanswered:_ 5MB of document content (excluding externally-referenced images), consistent with comparable SaaS PM tools.

---

## Assumptions Being Made

_These are interpretations the analysis has already made. Flag any that are wrong._

1. **Restore from version creates a new version entry rather than destructive overwrite** — Basis: non-destructive versioning is the safer default and matches Google Docs behavior; no spec language contradicted it.
2. **Export reflects the caller's permission tier** — Basis: a Viewer exporting should not see track-changes suggestions they cannot act on; this matches standard document permission patterns.
3. **Presence indicators are ephemeral (not persisted)** — Basis: cursor positions are live state, not stored; no spec language suggested otherwise.
4. **Automatic snapshots use incremental CRDT ops, not full document copies** — Basis: full-copy snapshots at 5-minute intervals would be prohibitively expensive at scale; delta storage is the engineering default.
5. **The export pipeline is asynchronous for documents over a threshold size** — Basis: synchronous PDF/DOCX generation for large documents reliably times out; async job + polling is the standard mitigation and is assumed unless the team prefers a different pattern.
