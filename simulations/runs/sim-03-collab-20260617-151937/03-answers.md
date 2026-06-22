# Stakeholder Responses

## Critical Questions

### 1. CRDT vs OT framework selection
**Answer:** We don't have a strong preference — the engineering team owns this decision. That said, offline-first is a hard requirement for us (we have field users who lose connectivity), so if Yjs handles that better, go with Yjs. Decision needs to be made before sprint planning, so please lock it in this week.

**Additional context:** We had a brief internal conversation about this last quarter and ShareDB came up, but nobody evaluated it seriously. Don't wait on us for a tie-breaker — just pick the right tool.

---

### 2. Existing permissions model compatibility
**Answer:** Our current system is purely role-based at the project level: Owner, Editor, Viewer. There is no per-resource ACL today — everyone on a project has the same access to every document in that project. Per-user per-document permissions is a real requirement, so yes, we'll need a new layer. We knew this would be a bigger piece.

**Additional context:** The security team has already flagged that any new ACL system needs to integrate with our Okta groups, not just individual users. That means document permissions should support assigning access to a group, not just a person.

---

### 3. WebSocket infrastructure
**Answer:** Our existing backend cannot handle persistent WebSocket connections at any real scale — it's a stateless REST API on Lambda. We'll need a dedicated collaboration service. At launch, we're targeting roughly 200 concurrent document sessions, with a peak assumption of maybe 500 during business hours. We're a B2B tool, so traffic is office-hours concentrated.

---

### 4. Maximum document size and concurrent editor scale
**Answer:** For document size, we'd say 5MB is our realistic upper bound — most documents will be well under 1MB, but we occasionally have large docs with many embedded images. Concurrent editors per document: honestly, 10 is the realistic case, 25 is fine as a cap. Total documents at steady state: we have about 8,000 customers today, we'd expect a few hundred thousand documents within the first year.

---

### 5. Offline conflict UX for long-divergence scenarios
**Answer:** Silent merge with a notification. We don't want to interrupt users with a diff UI — that will confuse most of our customers. Show a banner after reconnect: "Your offline edits were merged. X changes may have been overwritten — view version history to recover." That's the right balance for our user base.

---

## Important Questions

### 1. Browser and device support matrix
**Answer:** Desktop-first at launch: Chrome, Firefox, Edge — latest two versions. Safari on macOS is required, it's a meaningful chunk of our users. Mobile is lower priority: we'd like it to work on iOS Safari 16+ and Chrome on Android, but we can defer offline on mobile if needed. No IE, no legacy Edge.

---

### 2. Suggestion mode acceptance ownership
**Answer:** Any user with can-edit permission can accept or reject suggestions. We don't want a bottleneck on the document owner — editors should be able to collaborate freely.

---

### 3. Comment resolution ownership
**Answer:** Any editor or the comment author can resolve. Resolved comments should be archived, not deleted — users need to be able to review what was discussed. A "Show resolved" toggle is exactly right.

---

### 4. Version history retention policy
**Answer:** 90 days for auto-snapshots sounds right to us. Named versions should be kept indefinitely, or at least until the user explicitly deletes them. Storage cost should come out of the tenant's quota — we already have a quota system per plan tier. 500-snapshot cap per document is fine.

---

### 5. Export access by role
**Answer:** View-only users can export. We considered restricting it but our customers use view-only to share deliverables with external stakeholders who need to download the document. No per-document toggle at launch — that's fine.

---

## Nice to Have

### 1. @mention and notification in comments
**Answer:** Defer it, but mark it clearly as a follow-on. We do want it eventually — it's a common ask — but it's not blocking launch. Make sure the data model doesn't make it hard to add later.

---

### 2. Template instantiation model
**Answer:** Copy at creation time. We don't want a live link — if an admin updates a template, existing documents should not change. That would break trust with our users immediately.

---

### 3. Undo/redo scope in collaboration
**Answer:** Local undo only. Global undo sounds like a nightmare to explain to a user. Keep it simple.

---

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Embedded images use reference-based storage, not inline base64 | ✅ Correct | We have S3-compatible blob storage already. Presigned URLs are the right call. |
| 2 | 500ms sync is a 95th-percentile target, not p99 or mean | ⚠️ Partially | We intended p95, but honestly we'd like p99 to be under 1s. Don't build to p99 500ms, but don't ignore it either. |
| 3 | Presence (cursors, labels) is broadcast-only and not persisted | ✅ Correct | Ephemeral is fine. We don't need to replay who was viewing when. |
| 4 | Admins create templates; editors consume them | ❌ Wrong | We actually want editors to be able to create personal templates from their own documents. "Save as template" should be available to editors, but only admins can publish a template to the whole workspace. |
| 5 | "Our existing app" shares authentication | ✅ Correct | Same session, same auth. The collab service should trust the existing JWT — don't build a separate login. |
