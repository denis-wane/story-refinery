# Clarifying Questions

## Critical (must answer before proceeding)

1. **CRDT vs. OT — what's your existing stack?**
   Your backend language, existing real-time infrastructure (if any), and whether you have Node.js/browser-native constraints will determine whether Yjs (CRDT) or ShareDB (OT) is viable. "We use Java microservices with no existing WebSocket layer" points to a different answer than "we already run Socket.io on Node."
   - _Why it matters:_ Every sync, offline, and conflict story depends on this. Writing stories against the wrong architecture wastes sprint capacity.
   - _Default assumption if unanswered:_ Yjs + y-websocket (CRDT) on a Node.js sidecar service. Stories will be written against this stack.

2. **Do you have an existing permissions model, and does it support per-document scoping?**
   We need to know if your current model has a concept like `resource_type / resource_id / user_id / role`, or if permissions today are only at project/workspace level. Also: when a user's permission is revoked mid-session, should they see a notification and gracefully transition, or be hard-kicked?
   - _Why it matters:_ If no per-document scope exists, a schema migration story is required before any permissions story can be built. Mid-session behavior is a distinct story that may require server-push capability you don't yet have.
   - _Default assumption if unanswered:_ Permissions require a new per-document scope table (migration story included). Mid-session revocation sends a "permission-changed" event; client transitions without full reload.

3. **WebSocket infrastructure: existing or greenfield?**
   Do you have a WebSocket server today (e.g., ActionCable, Socket.io, Centrifugo), or does this feature require standing one up? If existing, can it support stateful room/channel semantics and bi-directional operation streams?
   - _Why it matters:_ "Add a channel" is a half-day story; "deploy and operate a new WebSocket service" is a multi-sprint infrastructure workstream.
   - _Default assumption if unanswered:_ Greenfield WebSocket service required. DevOps/infrastructure stories will be included in Phase 1.

4. **What is the version history retention policy?**
   How long should automatic snapshots be kept (days/weeks/indefinitely)? Who can delete a named version — owner only, any editor, admins? Is there a storage budget or hard cap per document?
   - _Why it matters:_ Storage architecture (full snapshots vs. delta chain) and the version management UI both depend on this. Without it, the version history story has no acceptance criteria for retention behavior.
   - _Default assumption if unanswered:_ Auto-snapshots retained for 30 days rolling; named (manual) versions kept indefinitely until explicitly deleted by the document owner or admin.

5. **What is the maximum document size you need to support at launch?**
   Specifically: maximum characters of text, and maximum number of embedded images per document. This is a hard constraint, not a soft guideline — it sets the CRDT performance budget, snapshot storage estimates, and export timeout thresholds.
   - _Why it matters:_ A 500KB document and a 50MB document require fundamentally different sync, snapshot, and export strategies. Stories written without this bound may be scoped incorrectly.
   - _Default assumption if unanswered:_ 5MB text content (~100 pages), max 50 embedded images per document. Stories will call out if any design choice depends on this bound.

---

## Important (strongly recommended)

1. **Offline conflict surface: auto-merge always, or show a conflict UI?**
   CRDT guarantees convergence, but the merged result may be semantically nonsensical (e.g., two authors deleted the same paragraph and inserted different replacements). Should v1 always auto-merge silently, or surface a diff/review screen when the reconnect delta exceeds a threshold?
   - _Why it matters:_ A conflict review UI is a significant story. Auto-merge-only is simpler but may frustrate users in adversarial edits.
   - _Default assumption if unanswered:_ Always auto-merge in v1; no conflict dialog. Post-launch UX iteration can add a review screen.

2. **Should viewers appear in the presence indicator?**
   Editors clearly need cursor presence. Should read-only viewers also appear (e.g., with an eye icon rather than a cursor), or is presence limited to active editors?
   - _Why it matters:_ Two distinct presence states require different UI components and different heartbeat/broadcast logic.
   - _Default assumption if unanswered:_ Viewers appear with a distinct passive indicator (eye icon, no cursor). Both presence states handled in the presence story.

3. **Suggestion mode scope: text-only or formatting changes too?**
   Google Docs tracks formatting changes (bold, heading level) as suggestions. That requires a substantially more complex suggestion model than tracking only insertions and deletions.
   - _Why it matters:_ Text-only tracked changes is one story. Formatting-tracked changes is two to three additional stories.
   - _Default assumption if unanswered:_ Text insertions and deletions only. Formatting changes apply immediately and are not tracked in v1.

4. **Can viewers export, or is export gated to editors/commenters?**
   Some teams use export as a distribution mechanism (viewer downloads a PDF); others treat export as a privileged action.
   - _Why it matters:_ Permission enforcement story must include export gating; affects UI (hide vs. disable the export button for viewers).
   - _Default assumption if unanswered:_ Export requires can-comment or higher. View-only users see no export option.

5. **Comment threading: flat replies or nested threads?**
   Are replies to a comment supported in v1 (one level of nesting), or is it a flat list of top-level comments per selection?
   - _Why it matters:_ Nested threading is a materially more complex UI and data model.
   - _Default assumption if unanswered:_ One level of replies (flat thread). No nested threading in v1.

---

## Nice to Have (will use reasonable defaults)

1. **Template placeholder syntax and instantiation UX**
   Should the placeholder syntax be `{{field_name}}`, `[FIELD_NAME]`, or something else? On instantiation, does the user get a guided form to fill placeholders, or do they just get a copy of the document and fill it manually?
   - _Default assumption if unanswered:_ `{{field_name}}` syntax, simple find-replace on instantiation, no guided form UI in v1.

2. **Snapshot trigger — definition of "activity"**
   Does the 5-minute auto-snapshot clock start on any keystroke, or only after a minimum number of edit operations? Does a manual save reset the auto-snapshot timer?
   - _Default assumption if unanswered:_ Activity = ≥1 edit in the window; timer is independent of manual saves (manual save does not reset or defer the auto-snapshot).

3. **Image/file storage: use existing file storage service or new?**
   Reference-based image embedding (URLs) is assumed. The question is whether images upload to your existing file storage service (S3, GCS, etc.) or require a new asset bucket.
   - _Default assumption if unanswered:_ Images upload to existing file storage service via current upload API. If no such service exists, a new storage story will be flagged.

---

## Assumptions Being Made
*These are interpretations the analysis has already made. Flag any that are wrong.*

1. **Inline base64 is off the table** — Reference-based image storage (URLs) assumed throughout. Base64 is incompatible with the 500ms sync SLA for any non-trivial image size.
2. **Conflict resolution is always auto-merge in v1** — No user-facing conflict dialog. CRDT convergence is the only guarantee; semantic quality of merged output is not checked.
3. **Comment threading is one level of replies** — Not nested threads.
4. **Suggestion mode covers text changes only** — Formatting changes (bold, heading) apply immediately and are not tracked.
5. **Export is restricted to can-comment and higher** — View-only users cannot export.
6. **`{{field_name}}` placeholder syntax with simple find-replace** — No dynamic form fill on template instantiation.
7. **Max document size working target is 5MB text / 50 images** — Must be validated; stories will flag any design choices sensitive to this bound.
8. **Snapshot fires 5 minutes after the last auto-snapshot if any edits occurred** — Manual saves do not reset this timer.
9. **Viewers appear in the presence indicator** — With a passive visual treatment distinct from active-editor cursors.
