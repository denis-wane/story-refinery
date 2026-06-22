# Stakeholder Responses

## Critical Questions

### 1. CRDT or OT — which direction?
**Answer:** Use Yjs. The architecture team looked at this last quarter when we were scoping the feature and Yjs came out ahead — it's what Notion and Linear use, the community is active, and our frontend lead has experience with it. Drop the last-writer-wins requirement for same-range conflicts. I wrote that before I fully understood the tradeoff. Positional merge is fine.

**Additional context:** We actually have a contractor who built a small Yjs proof-of-concept for a previous feature that was cut. That code might be salvageable — check with Marcus on the backend team before starting from scratch.

---

### 2. WebSocket infrastructure — new service or reuse existing?
**Answer:** Build a dedicated WebSocket service. Our current backend is REST-only and runs on Lambda — it physically can't hold persistent connections. This is a known gap and it's already been flagged to the infrastructure team. You have budget to spin up a small Node service; we're not trying to run this on serverless.

**Additional context:** The security team has already signed off on outbound WebSocket connections from the client, so that's not a blocker.

---

### 3. How does this plug into the existing permissions model?
**Answer:** Additive, exactly as your default assumption describes. Project membership is a prerequisite — you can't even see a document exists unless you're in the project. But being in the project doesn't grant document access automatically. A document owner or admin has to assign a role (view/comment/edit) explicitly.

**Additional context:** One exception: project admins always get implicit can-edit on all documents in their project, even without an explicit assignment. That's non-negotiable — admins need to be able to recover documents when a team member leaves.

---

### 4. What is the maximum supported document size?
**Answer:** 1 MB of text content, 10 embedded images per document. If someone tries to paste more images we show a graceful error. We're not building a file dumping ground — this is for structured project docs, not presentations.

---

### 5. Version retention — storage budget and TTL?
**Answer:** Auto-snapshots: keep the last 30 days, no longer. Manual named versions: keep forever, but cap at 50 named versions per document — after that the user has to delete one before saving another. Delta storage is fine, we don't need full snapshots. Check with the platform team on whether we're using our existing S3 bucket or need a new one.

---

## Important Questions

### 1. Offline scope — browser only or native mobile too?
**Answer:** Browser only for v1. We don't have native mobile apps yet, so this is moot. Just make sure it works on mobile Safari and Chrome when online — offline on mobile browser is a nice-to-have we can revisit.

---

### 2. Long offline reconnect — auto-merge or human-in-the-loop?
**Answer:** Auto-merge always. We're not building a Git merge UI. If the content comes out weird after a long offline session, the user has undo history and version history to recover from. That's the product answer. No manual conflict resolution UI in v1.

---

### 3. Suggestion mode — which roles can submit suggestions?
**Answer:** Can-edit only. If you have comment-only access, you leave a comment explaining what you'd change and the editor decides whether to do it. Suggestion mode is for contributors, not reviewers.

---

### 4. Export — access control and data sensitivity?
**Answer:** Any view-only user can export. No watermarking for v1. We talked about watermarking in the design review and decided it's overkill for our use case — our users are internal teams and trusted external collaborators, not untrusted public viewers.

---

### 5. Comment lifecycle — what happens when anchor text is deleted?
**Answer:** Make it orphaned with a visual indicator. Don't auto-delete — people will complain if their comments disappear silently. Show something like a grey pill at the deletion point so it's obvious the anchor is gone.

---

## Nice to Have

### 1. Heading levels?
**Answer:** H1–H3. Agreed with the default.

---

### 2. Cursor color — random or stable per user?
**Answer:** Stable per user. If I'm always red in one document and blue in another, it's confusing. Pick a color on first appearance and stick with it.

---

### 3. Template placeholders — form fields or styled text?
**Answer:** Styled text only for v1. We can revisit structured field templates as a separate feature if editors ask for it. Keep it simple.

---

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Images stored by reference, not inline | ✅ Correct | Use S3 (we already have a bucket for file attachments — reuse it). |
| 2 | Single-region deployment for 500ms SLA | ✅ Correct | We're US-only for v1. Global distribution is a year out at least. |
| 3 | Version restore = overwrite | ❌ Wrong | Restoring should create a **new version** before overwriting, so you don't lose the current state. The flow should be: restore → auto-snapshot of current state → apply historical version. Don't just stomp the document silently. |
| 4 | Viewers can see version history, not restore it | ✅ Correct | Exactly right. View and comment users browse only. |
| 5 | Export service is server-side | ✅ Correct | Client-side export is not reliable enough. Server-side is the right call. |
| 6 | Comment threading is single-level replies | ⚠️ Partially | Single-level is fine for v1, but make sure the data model can support nesting later without a migration. We'll almost certainly want it in v2. Don't paint yourself into a corner. |
