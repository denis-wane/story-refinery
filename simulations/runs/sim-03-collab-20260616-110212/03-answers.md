# Stakeholder Responses

## Critical Questions

### 1. Which sync architecture: CRDT or OT?
**Answer:** Go with Yjs. We evaluated all three options last quarter when the team was prototyping and Yjs won on ecosystem maturity and offline story. Automerge felt too academic and ShareDB requires a transform server we'd have to operate. Yjs it is.
**Additional context:** Our mobile team already has a Yjs proof-of-concept sitting in a branch from that prototype — reach out to @sarah on the mobile team, she may be able to hand off the bindings work and save you a sprint.

### 2. Can real-time sync reuse your existing infrastructure, or does it need a dedicated WebSocket gateway?
**Answer:** Dedicated WebSocket server. Our backend is pure REST — no persistent connections anywhere. We'll need a new service. The infra team has already flagged this and said they can support a Node.js service alongside our existing stack. Don't try to bolt WebSockets onto the Rails API.
**Additional context:** We have a rough budget approved for this service. Infra will provision it in the staging environment once you have an architecture doc — loop in @marcos before you write the infra spike.

### 3. How do the three document tiers map onto your existing permissions model?
**Answer:** Document-level tiers are fully independent and overlay on top of existing roles, and document permissions always win — they are the more restrictive. A workspace Admin who is explicitly set to View-only on a document cannot edit it. Document Owner is the person who created the document; they always retain Edit rights and can promote themselves if they accidentally restrict themselves.
**Additional context:** We have a permissions audit coming up in Q3. Whatever you build here needs to be auditable — we'll need a log of every permission change on a document (who changed what, when).

### 4. How are embedded images stored?
**Answer:** File storage references. We already use S3 for file attachments elsewhere in the app — use the same bucket with the same signed URL pattern. Do not use base64. Our documents will have screenshots and diagrams and base64 would blow up document size immediately.

### 5. When two users edit the same character range while both offline and then reconnect, what should happen?
**Answer:** Last-reconnect-wins, but show a non-blocking notification to the user whose change lost. Something like "A concurrent offline edit was applied to this section — your change was overwritten." with an Undo button. We don't want a conflict resolution UI that blocks people; just make it transparent and recoverable.
**Additional context:** This scenario will be rare in practice — most of our users are not heavy offline editors. Don't over-engineer it. The toast + undo is enough for launch.

---

## Important Questions

### 1. Do inline comments support threaded replies and @mentions?
**Answer:** Threaded replies yes, one level of nesting is fine. @mentions yes — this is a must-have because our users will use comments to loop in colleagues for review. Resolved/unresolved state is in scope too.

### 2. Who can accept or reject suggestions in suggestion/track-changes mode?
**Answer:** Any Editor can accept or reject suggestions. We considered restricting to Document Owner but it slows down review workflows. The Document Owner can bulk-accept all pending suggestions. Commenters cannot accept or reject — view only on suggestions.

### 3. Are document templates workspace-wide or scoped to individual projects?
**Answer:** Workspace-wide. We don't have strong project isolation needs right now and a global template library is simpler to manage. Any workspace admin can create, edit, or archive templates. All users with at least Edit access see the template picker on new document creation.

### 4. Are notifications in scope for this epic?
**Answer:** Emit events only. We have a notifications system already and the team that owns it will pick up the delivery side. Just publish the events (comment added, suggestion made, @mention, document shared) to the existing event bus and we'll wire up delivery separately.

### 5. What is the version history retention policy?
**Answer:** Keep the last 100 auto-snapshots per document and purge anything older than 90 days. Named manual versions are kept forever — users who take the time to name a version expect it to stick around. Make sure the version browser makes it visually obvious which entries are manual vs. auto.

---

## Nice to Have

### 1. What should the user see when their real-time edit is overwritten by last-writer-wins?
**Answer:** Non-blocking toast with an Undo action, auto-dismiss after 5 seconds. Keep it short — "Your edit was merged with a concurrent change." Don't use the word "overwritten" — users will panic.

### 2. Can Viewer-tier users export the document?
**Answer:** Yes. Any user with at least Viewer access can export. But Viewers should only see the clean document — no unresolved comments, no suggestions markup. Export reflects their permission tier.

### 3. Is "restore from version" in scope?
**Answer:** Yes, and it must be non-destructive. Restore creates a new head version ("Restored from v12 — [timestamp]") so nothing is lost. We had a bad experience with a destructive restore in our old wiki tool and users were furious. Never overwrite.

### 4. Performance SLAs?
**Answer:** Initial document load under 2 seconds for anything up to 5MB. Export is async — fire the job, poll for completion, 30 seconds is acceptable. Version history list should load in under a second for up to 500 entries.

### 5. Maximum document size?
**Answer:** 5MB of document content, not counting externally stored images. That covers even the largest specs and RFCs our teams write. If someone needs something bigger, they should be splitting the document.

---

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Restore from version creates a new version entry rather than destructive overwrite | ✅ Correct | Confirmed — non-destructive is a hard requirement, see my answer above. |
| 2 | Export reflects the caller's permission tier | ✅ Correct | Viewer exports get the clean doc, no suggestions or unresolved comments. |
| 3 | Presence indicators are ephemeral (not persisted) | ✅ Correct | Cursor positions are live only. Don't store them. |
| 4 | Automatic snapshots use incremental CRDT ops, not full document copies | ⚠️ Partially | Incremental is preferred for storage efficiency, but we need at least one full snapshot per session start (not just deltas) so that version restore doesn't require replaying the entire op log from the beginning of time. Talk to the team about a hybrid approach. |
| 5 | The export pipeline is asynchronous for documents over a threshold size | ❌ Wrong | Async for **all** exports, not just large ones. We want a consistent UX — "your export is ready, click to download" — regardless of size. Synchronous export for small docs creates inconsistent behavior that confuses users when a larger doc suddenly behaves differently. |
