# Stakeholder Responses

## Critical Questions

### 1. Which sync algorithm are you adopting: CRDT or OT?
**Answer:** Go with Yjs. We evaluated both last quarter and the engineering lead already has a proof-of-concept running with Yjs and y-websocket. OT felt overly complex for our team size and the offline-first requirement pushed us toward CRDT anyway.
**Additional context:** We demoed the Yjs POC to the product team two weeks ago — the offline merge behavior is exactly what we want. Treat that decision as locked.

### 2. Can your existing WebSocket infrastructure meet the 500ms propagation SLA?
**Answer:** Honestly, we don't know yet — that's why we listed it as an open question. Run the spike first. If it can't hold up, spin up a dedicated server. We'd rather know in sprint one than discover it in UAT.
**Additional context:** Our current WS setup handles live notifications for project updates, but it's never been load-tested at document-editing frequency. Assume it will need its own service; I'd rather be pleasantly surprised than blocked.

### 3. How does the new permission model map onto your existing RBAC system?
**Answer:** It's a new additive layer. Document-level view/comment/edit permissions live in a new table. Existing workspace roles determine who can *access the feature at all* — but not what they can do inside a specific document. A workspace Member might be view-only on one doc and editor on another.
**Additional context:** The security team has already reviewed this model and signed off on the approach. Don't try to retrofit it into the existing roles table — that path was explored and rejected.

### 4. What is the maximum document size you need to support?
**Answer:** Target 500KB of plain text. That covers our largest existing documents with room to grow. Per-image limit of 5MB, and a document-level embedded image cap of 20MB total seems reasonable.
**Additional context:** Our legal team occasionally pastes in full contract text, which runs about 200KB. The 500KB ceiling gives them headroom. Anything beyond that should probably be a file attachment, not a doc.

### 5. How are embedded images and files stored?
**Answer:** External references via our existing S3 integration. No base64 — we had that debate with our current rich-text notes feature and base64 was a mistake we've been paying for since. Images will not be available offline in v1; that's fine.
**Additional context:** The S3 bucket and CDN setup already exist. The integration work should be minimal — we mostly need the upload endpoint wired into the editor toolbar.

---

## Important Questions

### 1. Who can accept or reject suggestions in Track Changes mode?
**Answer:** Any Editor can accept or reject suggestions — including suggestions made by other Editors. Commenters can only create suggestions, not resolve them. Document owners don't need a special role here; Editor permission covers it.

### 2. When an offline Editor and an online Editor touch the same character range, who wins on reconnection?
**Answer:** Server state wins. We don't want a conflict resolution UI in v1 — that adds scope we can't absorb right now. The offline user gets a visible notification that their change in that range was superseded. We can revisit manual conflict resolution in v2 if users push back.

### 3. Are comment notifications in scope for v1?
**Answer:** Out of scope for v1. We know it's a gap — but we're already stretching the team with the core editing feature. Add it to the backlog as a fast-follow. Just make sure the stories for v1 explicitly say "no notifications" so the QA team doesn't flag it as a bug.

### 4. How many automatic version snapshots are retained?
**Answer:** Keep the last 100 automatic snapshots. Manual named snapshots are kept indefinitely until explicitly deleted. Add a background pruning job to the v1 scope — we don't want to defer that and inherit unbounded storage debt.

### 5. Can Viewers export documents?
**Answer:** No. Viewers cannot export. Commenters and Editors only. We have some documents with sensitive commercial terms and we don't want anyone with read-only access walking away with a PDF.

---

## Nice to Have

### 1. Does presence indicate "tab open" or "actively typing/scrolling"?
**Answer:** Active within the last 60 seconds is fine. We don't want ghost presences from people who opened a doc and walked away.

### 2. Can non-admin users create personal templates?
**Answer:** Admins only for v1. Personal templates can come later — let's see if people actually ask for it before building it.

### 3. Is there a document lock / freeze capability?
**Answer:** Not in v1. Flag it in the backlog for the compliance review we have scheduled in Q3.

---

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Rich text framework: ProseMirror or Tiptap | ✅ Correct | We're leaning Tiptap specifically — it wraps ProseMirror with a nicer extension API. Either is fine, but lock in Tiptap. |
| 2 | Comments are threaded | ✅ Correct | Yes, threaded with resolved/unresolved state. That's exactly the behavior we want. |
| 3 | Comment resolution authority: author or any Editor | ❌ Wrong | Only the comment author or an Editor on that specific document can resolve it. Commenters cannot resolve their own comments — that would let them close feedback without editorial sign-off. |
| 4 | Offline local persistence via IndexedDB | ✅ Correct | Standard choice, no objection. |
| 5 | Export is server-side rendered | ✅ Correct | We already have a Pandoc pipeline for another feature. Reuse it. |
| 6 | 500ms SLA is same-region only | ⚠️ Partially | Correct for now, but we have a European customer cohort that's growing. Put a note in the backlog to revisit geo-distribution in the next major cycle. Don't architect against it, but don't optimize for it in v1 either. |
| 7 | Admin = workspace-level admin | ✅ Correct | Yes, workspace-level. Document-level ownership is separate from the Admin role. |
