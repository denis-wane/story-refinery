# Clarifying Questions

## Critical (must answer before proceeding)

1. **Which sync algorithm are you adopting: CRDT or OT?**
   Your team listed this as an open question but hasn't resolved it. CRDT (e.g., Yjs) and OT (e.g., ShareDB) require fundamentally different server architectures, client state models, and offline strategies.
   - _Why it matters:_ Every concurrent-edit, offline, and conflict-resolution story changes shape depending on this choice. Writing stories before this is decided means rewriting them after.
   - _Default assumption if unanswered:_ Yjs (CRDT) with y-websocket, as it's the dominant choice for offline-first, browser-native collaborative editors and avoids a central sequencing server.

2. **Can your existing WebSocket infrastructure meet the 500ms propagation SLA under realistic concurrent load?**
   "Existing infrastructure" is ambiguous — it could be a shared API gateway, a purpose-built WS server, or something else. The 500ms SLA is tight, especially for international users.
   - _Why it matters:_ If the existing infra can't hit the SLA, a dedicated WebSocket server becomes a prerequisite story, not an implementation detail.
   - _Default assumption if unanswered:_ The 500ms SLA applies to same-region users only; a spike against existing infra is planned in the first sprint before stories are locked.

3. **How does the new view/comment/edit permission model map onto your existing RBAC system?**
   The current app presumably has roles and permissions already. Is document-level view/comment/edit an overlay on top of those, a migration of them, or a net-new table?
   - _Why it matters:_ If the existing model doesn't support document-level permissions, a new schema migration is required before any access-control story can be implemented. This is a potential sprint-zero item.
   - _Default assumption if unanswered:_ Document permissions are a new additive layer stored in a new table; existing app roles grant access to the feature but don't control per-document rights.

4. **What is the maximum document size you need to support?**
   No upper bound is specified. This sets the floor for performance acceptance criteria across every editing, sync, and snapshot story.
   - _Why it matters:_ Without a bound, "performs acceptably" is untestable. Browser memory limits, WebSocket payload limits, snapshot storage costs, and export feasibility all depend on this number.
   - _Default assumption if unanswered:_ 500KB of text content (roughly 80,000 words); embedded images subject to a separate per-image limit (see question 5).

5. **How are embedded images and files stored: inline base64 or references to a file storage service?**
   Inline base64 bloats document payloads 33% and complicates offline sync. References require a storage service integration (S3, GCS, etc.) but keep documents lean.
   - _Why it matters:_ This decision affects document size budgets, offline behavior (can embedded images be available offline?), export fidelity, and whether a new storage service integration is in scope.
   - _Default assumption if unanswered:_ External references via existing file storage (assumed to exist); base64 is not used. Images are not available offline in v1.

---

## Important (strongly recommended)

1. **Who can accept or reject suggestions in Track Changes mode?**
   The spec says Editors can edit, Commenters can suggest — but it's silent on who can accept/reject those suggestions.
   - _Why it matters:_ Determines the permissions matrix for the suggestion workflow and whether Document Owners get a distinct elevated capability.
   - _Default assumption if unanswered:_ Any user with can-edit permission can accept/reject suggestions; Commenters can only create them.

2. **When an offline Editor and an online Editor touch the same character range, whose edit wins on reconnection?**
   Last-writer-wins is specified for real-time concurrent edits, but the offline reconnect case is unspecified. Treating offline changes as lower-priority (server state wins) may surprise users who expect their local work to be preserved.
   - _Why it matters:_ The reconnection merge strategy affects offline story acceptance criteria and whether you need to surface a conflict UI for users to manually resolve.
   - _Default assumption if unanswered:_ Server state wins for same-range conflicts on reconnect; offline changes in that range are discarded with a visible notification to the user.

3. **Are comment notifications in scope for v1?**
   Inline comments and threaded replies strongly imply notifications (email or in-app) — otherwise commenters have no way to know they received a reply. The spec doesn't mention this.
   - _Why it matters:_ If notifications are expected, the comments feature scope increases by an estimated 30–50%. If they're deferred, stories need explicit "no notification" acceptance criteria so that gap is deliberate, not accidental.
   - _Default assumption if unanswered:_ Notifications are out of scope for v1; a follow-up ticket will cover them.

4. **How many automatic version snapshots are retained, and when are old ones pruned?**
   "Every 5 minutes of activity" with no cap creates unbounded storage growth for long-lived documents.
   - _Why it matters:_ Affects snapshot storage cost estimates and whether a background pruning job is needed as a v1 story.
   - _Default assumption if unanswered:_ Last 100 automatic snapshots retained; manual (named) snapshots kept indefinitely until explicitly deleted.

5. **Can Viewers export documents, or only Commenters and Editors?**
   Export permissions are unspecified. Viewer export is a common expectation but a meaningful security/IP consideration for some teams.
   - _Why it matters:_ Affects export story AC and the permissions enforcement implementation.
   - _Default assumption if unanswered:_ Viewers cannot export; Commenters and Editors can.

---

## Nice to Have (will use reasonable defaults)

1. **Does presence indicate "tab open" or "actively typing/scrolling"?**
   "Viewing/editing" is ambiguous — a user with the tab open but focused elsewhere creates noise in the presence list.
   - _Default assumption if unanswered:_ Presence shown for any user whose tab was active within the last 60 seconds.

2. **Can non-admin users create personal templates in v1?**
   The spec grants template creation to admins only. Personal templates (user-scoped) are a common follow-up request.
   - _Default assumption if unanswered:_ Only admins create workspace-level templates; personal templates are out of scope for v1.

3. **Is there a document lock / freeze capability for compliance or audit purposes?**
   Not mentioned in the spec, but common in teams with audit trails or legal holds.
   - _Default assumption if unanswered:_ Out of scope for v1; flagged for compliance review in backlog.

---

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **Rich text framework: ProseMirror or Tiptap** — Assumed based on ecosystem fit; no framework is locked in yet, but stories are written against a ProseMirror-compatible model.
2. **Comments are threaded** — The spec says "inline comments" without specifying whether replies form a thread. Assumed: yes, threaded replies with a resolved/unresolved state.
3. **Comment resolution authority** — Assumed: the comment author or any Editor can mark a comment resolved.
4. **Offline local persistence via IndexedDB** — No mechanism specified; IndexedDB assumed as the standard browser-side store for offline edits.
5. **Export is server-side rendered** — Assumed: DOCX/PDF export runs on the server (e.g., Pandoc or headless browser pipeline), not in the browser, due to complex rich-text fidelity requirements.
6. **500ms SLA is same-region only** — The spec doesn't scope the SLA geographically; assuming same-region to make it achievable without a global relay infrastructure.
7. **Admin = workspace-level admin** — The spec uses "Admin" without clarifying scope; assumed to mean workspace-level admin, not document-level.
