# Stakeholder Responses

## Critical Questions

### 1. CRDT vs. OT: which sync algorithm?
**Answer:** Go with CRDT — Yjs specifically if that's what your team recommends. We don't have any existing OT investment, and offline-first is a hard requirement. Our field teams work in areas with spotty connectivity, so we can't have a central arbiter as a single point of failure.
**Additional context:** Our infrastructure team flagged last quarter that they want to reduce centralized stateful services where possible. A CRDT approach aligns with that direction.

### 2. Does your existing infrastructure support persistent WebSocket connections at scale?
**Answer:** No, our current backend is HTTP/REST only. We do not have WebSocket infrastructure today. You should treat this as a prerequisite and plan a dedicated WebSocket service — we'd rather stand up something purpose-built than bolt it onto our existing API gateway.
**Additional context:** We have a Kubernetes cluster that can host a sidecar service. DevOps has capacity in the next sprint to help with the initial deployment setup if you give them a heads-up.

### 3. How does the new per-document permission model interact with existing project-level roles?
**Answer:** Additive overlay with a strict ceiling — document permissions can only restrict what someone can do at the project level, never expand it. A project Viewer can be downgraded to view-only on a specific document, but cannot be promoted to editor on a document if they're a Viewer at the project level. Project Admins always retain full access to all documents in their project regardless of document-level settings.
**Additional context:** Our security team has already reviewed this and approved the overlay model. They specifically flagged that granting doc-level escalation would create audit headaches.

### 4. What is the offline conflict resolution policy?
**Answer:** Auto-merge always, using whatever the CRDT library gives us. We do not want to build a manual conflict review UI in v1 — that's a significant scope addition and our users aren't document-power-users who'd know what to do with a diff view. If the algorithm can't resolve something, accept the returning user's changes and move on. We can revisit this if users actually complain.

### 5. What is the maximum document size?
**Answer:** 10 MB text content, 100 MB total including attachments. We have customers who paste in large technical specs and embed architecture diagrams. The 5 MB text limit you assumed is too small — we've seen documents in our current tool that would already exceed it.

---

## Important Questions

### 1. Who can accept or reject track-changes suggestions?
**Answer:** Any user with can-edit permission can accept or reject suggestions. We don't want a bottleneck where only the document owner can approve. Our teams work collaboratively and often the owner is unavailable.

### 2. Does restoring a version overwrite HEAD, or create a new version at HEAD?
**Answer:** Non-destructive — restore creates a new HEAD copied from the old snapshot. Never silently destroy current work. This is non-negotiable; we had a data loss incident with a previous tool and it was a trust-killer with our customers.

### 3. Can Viewers export documents? Can Commenters?
**Answer:** Commenters can export, Viewers cannot. Our stakeholder review workflow involves external reviewers who need to print or share PDFs but we don't want to give them full edit access. Commenters is the right tier for that use case.
**Additional context:** This is actually a selling point for us — "safe external reviewer access" is something we pitch to enterprise customers.

### 4. Are users notified when @mentioned in a comment?
**Answer:** Yes, in-app notifications for @mentions in v1. No email yet — our notification infrastructure is being overhauled in Q3 and we don't want to build a one-off email integration now. Hook into whatever in-app notification system we have, even if it's basic. Resolved-comment notifications can wait for v2.

### 5. Are documents project-scoped only, or can they be shared across projects?
**Answer:** Project-scoped only in v1. Hard requirement. Cross-project sharing creates permission complexity we're not ready to tackle.

---

## Nice to Have

### 1. Should presence show per-document or per-paragraph/section? Idle vs. active?
**Answer:** Per-document with last-known cursor position is fine for v1. No idle/active distinction. The 30-second inactivity removal sounds right.

### 2. Image/file embedding model?
**Answer:** Reference-based URL storage. We already have an S3-backed file storage service used elsewhere in the app. Use that.

### 3. Do template updates propagate to documents created from them?
**Answer:** Independent copies. We don't need living templates. Too much complexity for the value.

---

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | CRDT (Yjs) preferred over OT | ✅ Correct | Confirmed above. |
| 2 | Images stored by reference (URL), not inline base64 | ✅ Correct | We have an existing file storage service to use. |
| 3 | Export requires can-edit or can-comment | ⚠️ Partially | **Commenters can export; Viewers cannot.** Your assumption was right directionally but the framing was can-edit-or-can-comment — that's the correct answer, just needed explicit confirmation. |
| 4 | Version restore is non-destructive (creates new HEAD) | ✅ Correct | Non-negotiable per prior data loss incident. |
| 5 | Comment author can delete their own; any editor can resolve; admins can delete any comment | ✅ Correct | Matches our expectations. |
| 6 | Templates create independent document copies; updates do not propagate | ✅ Correct | Confirmed. |
| 7 | Presence is per-document, cursors removed after 30s inactivity | ✅ Correct | Fine for v1. |
| 8 | Documents are project-scoped in v1 | ✅ Correct | Hard requirement. |
| — | Max document size: 5 MB text / 50 MB total | ❌ Wrong | **10 MB text / 100 MB total.** Current customer documents already exceed the assumed ceiling. Update all performance AC accordingly. |
