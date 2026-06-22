# Clarifying Questions

## Critical (must answer before proceeding)

1. **CRDT or OT — which direction?**
   Has the tech lead or architecture team made a call (or ruled out an approach) for the sync algorithm? The requirement states "last-writer-wins for same character range," which is a fundamentally OT-style semantic — most CRDT libraries (Yjs, Automerge) don't expose LWW at that granularity and would silently produce different merge behavior.
   - _Why it matters:_ Every story touching sync, offline, and conflict resolution has different acceptance criteria depending on this answer. Writing them before the choice is made produces throwaway AC.
   - _Default assumption if unanswered:_ Yjs (CRDT) is used; LWW for same-range conflicts is dropped in favor of positional merge semantics. The requirement will be flagged as incompatible and escalated before sprint planning.

2. **WebSocket infrastructure — new service or reuse existing?**
   Is the existing backend capable of holding persistent bidirectional connections at the concurrent user scale this feature is expected to serve, or will a dedicated sync gateway (Socket.io, Liveblocks, custom) be provisioned?
   - _Why it matters:_ The 500ms sync SLA is unachievable if the transport layer isn't settled. Infrastructure stories can't be scoped without knowing whether "build a WebSocket server" is in or out of scope.
   - _Default assumption if unanswered:_ A dedicated WebSocket service is in scope and must be built. Stories will be written and sized accordingly.

3. **How does this plug into the existing permissions model?**
   The product already has a permissions model. Do collaborative document permissions (view/comment/edit) layer on top of existing project-level access, replace it for document objects, or live in a separate plane with its own assignment UI? Specifically: can a project member with no explicit document permission see a document in that project?
   - _Why it matters:_ The Permissions story and every access-controlled story (sync broadcasting, export, version history) are blocked. Getting this wrong risks privilege escalation or access gaps.
   - _Default assumption if unanswered:_ Document permissions are additive — a user needs both project access AND a document-level role to act on the document. Project membership alone grants no document access.

4. **What is the maximum supported document size?**
   Is there a product-defined ceiling (e.g., 1 MB text, 50 images)? Without a bound, the 500ms sync SLA, auto-snapshot storage costs, and export timeout limits can't be committed to.
   - _Why it matters:_ Sync, Version History, and Export stories all have acceptance criteria that are nonsensical without a size target. Estimation without this is a guess.
   - _Default assumption if unanswered:_ Stories will be written for 500 KB text content and 20 embedded images. Behavior beyond that ceiling is explicitly out of scope for v1.

5. **Version retention: what's the storage budget and TTL?**
   How long should auto-snapshots be retained (days? forever?), and is there a quota per document or per workspace? Is delta/diff storage acceptable, or is full-document snapshot storage required?
   - _Why it matters:_ Without a retention policy, Version History cannot be specced, storage costs can't be estimated, and the feature risks becoming an unbounded cost sink.
   - _Default assumption if unanswered:_ Auto-snapshots retained for 30 days; manual named versions retained indefinitely; delta storage used. This will be called out as an assumption that requires cost sign-off.

---

## Important (strongly recommended)

1. **Offline scope: browser only, or native mobile too?**
   "Offline support" is stated without platform scope. Browser-based offline (Service Worker + IndexedDB) is a fundamentally different implementation from native iOS/Android offline. Is mobile in scope for v1?
   - _Why it matters:_ Offline stories double in scope and complexity if native mobile is included.
   - _Default assumption if unanswered:_ Browser offline only for v1. Native mobile offline is explicitly deferred.

2. **Long offline reconnect: auto-merge always, or human-in-the-loop?**
   If a user edits offline for several hours and reconnects to a document with significant divergence, is auto-merge always applied (with conflicts visible only in undo history), or should a manual merge/conflict review UI exist?
   - _Why it matters:_ A manual merge UI is a substantial additional story. Auto-merge always is simpler but may produce surprising results for users after long disconnections.
   - _Default assumption if unanswered:_ Auto-merge always. Conflicts are surfaced in undo history only. No manual merge UI in v1.

3. **Suggestion mode: which roles can submit suggestions?**
   Can "can-comment" users propose track-changes-style suggestions, or is suggestion mode restricted to "can-edit" users?
   - _Why it matters:_ AC for Comments & Suggestions and Permissions stories changes based on the answer. Role boundary also affects the data model (who can create a suggestion vs. a comment).
   - _Default assumption if unanswered:_ Suggestions require "can-edit." "Can-comment" users can only add inline comments.

4. **Export: is there a data sensitivity or access-control concern?**
   Can any user with view-only access export a document to PDF or DOCX? If documents can contain sensitive project data, unrestricted export (no DRM, no watermarking) may conflict with your data governance posture.
   - _Why it matters:_ If export requires a higher permission tier or watermarking, the Export story is larger. If the current answer is "any viewer can export," that's a policy decision that should be explicit.
   - _Default assumption if unanswered:_ Any user with at least view-only permission can export. No watermarking or DRM in v1.

5. **Comment lifecycle: what happens when anchor text is deleted?**
   If a user deletes the text that an inline comment is anchored to, does the comment (a) move to the nearest surviving character, (b) become "orphaned" and shown at the deletion point, or (c) get auto-deleted?
   - _Why it matters:_ Comment anchor behavior on text deletion affects the data model (comments stored by character offset vs. structural anchor) and is a non-trivial edge case in AC.
   - _Default assumption if unanswered:_ Comment becomes orphaned and is shown at the deletion point with a visual indicator. Comment is not deleted.

---

## Nice to Have (will use reasonable defaults)

1. **Heading levels: H1–H3 or H1–H6?**
   The requirements list "headings" without specifying depth. For most project management use cases H1–H3 covers the full range; deeper nesting increases toolbar complexity and export mapping work.
   - _Default assumption if unanswered:_ H1–H3 in v1.

2. **Cursor color: random-per-session, stable-per-user, or user-selectable?**
   Should a user always appear in the same color across documents and sessions, or is a random per-session color acceptable?
   - _Default assumption if unanswered:_ Stable color per user (assigned on first activity, persisted to user profile). Not user-selectable in v1.

3. **Template placeholders: structured form fields or styled instructional text?**
   Are template placeholders enforced fields (like a form that editors must fill in) or simply styled text that editors can overwrite freely?
   - _Default assumption if unanswered:_ Plain styled text only. No structured field engine in v1.

---

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **Images stored by reference, not inline** — Base64 inline encoding is rejected due to document size impact. Images will be uploaded to a file storage service (S3 or existing equivalent) and referenced by URL/key. _(Basis: industry standard for document editors at scale; base64 is impractical beyond trivial use.)_

2. **Single-region deployment for 500ms SLA** — The sync latency target applies to a single primary datacenter region only. Global multi-region distribution is deferred. _(Basis: no geographic requirements stated; global distribution is a non-trivial infrastructure investment.)_

3. **Version restore = overwrite** — Restoring a historical version overwrites the current document (no branch/fork). _(Basis: simpler UX; branching on restore would require document forking capability not mentioned anywhere in the requirements.)_

4. **Viewers can see version history, not restore it** — View-only users can browse past snapshots but cannot restore. Restore requires can-edit. Only owner/admin can delete versions. _(Basis: least-privilege interpretation of the stated roles.)_

5. **Export service is server-side** — PDF and DOCX generation is handled server-side (Puppeteer / docx library), not client-side. _(Basis: client-side export cannot reliably handle tables, images, and code blocks across browsers.)_

6. **Comment threading is single-level replies** — Nested sub-threads (replies to replies) are not supported in v1. _(Basis: requirement mentions comments but not threading depth; single-level covers the vast majority of review workflows.)_
