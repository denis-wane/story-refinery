# Stakeholder Responses

## Critical Questions

### 1. Which sync engine will you use — CRDT or OT?
**Answer:** Go with Yjs. We've looked at this briefly and a few engineers on the team have experience with it from a previous project. The offline-first behavior is important for us — we have a lot of users who work from planes and coffee shops.
**Additional context:** We're also considering Tiptap as the editor layer, which has solid Yjs integration built in. Worth evaluating that before picking an editor framework from scratch.

### 2. Can your existing backend handle persistent WebSocket connections, or does a new service need to be provisioned?
**Answer:** No, our current backend is REST-only (Node.js/Express). We'll need a new service. We'd prefer to self-host rather than use a managed solution — the security team has concerns about document content leaving our infra.
**Additional context:** We already have a small Redis cluster we use for session state. If the WebSocket service can use that for pub/sub, it would save us provisioning a separate message broker.

### 3. How does per-document permissioning compose with your existing access model?
**Answer:** Our current model is workspace-level RBAC — users get a role (Owner, Admin, Member, Guest) within a workspace. Per-document permissions should be additive restrictions only. You cannot grant someone access to a document if they don't have at least Member-level access to the workspace. Most restrictive wins.
**Additional context:** Guests are a special case — they can be invited directly to a document by an Admin or Owner, even without workspace membership. That's an existing pattern we use for external collaborators on tasks.

### 4. Which roles can export documents?
**Answer:** Editors and Owners can export. Viewers and Commenters cannot. That's the right call from a data governance perspective — we've had issues in the past with view-only content walking out the door via screenshots but we shouldn't make it trivially easy.

### 5. What is the maximum document size you need to support?
**Answer:** 10MB is our target. We have some product requirements documents and engineering specs that are quite long with embedded diagrams and screenshots. 5MB would be too tight. Hard cap at 10MB is fine — we can surface a warning at 8MB so users know they're approaching it.

---

## Important Questions

### 1. When restoring a version, does it overwrite HEAD or create a new snapshot?
**Answer:** Non-destructive — restore creates a new snapshot at HEAD. We don't want anyone to accidentally blow away a colleague's work. Should probably also show a confirmation dialog before the restore kicks off, just so it's not a one-click disaster.

### 2. When offline edits conflict with server state on reconnect, is resolution automatic or does the user get a UI?
**Answer:** Automatic is fine. We don't want to burden users with a merge conflict UI — most of our users aren't technical and a diff view would panic them. A toast notification saying "X changes were merged from your offline session" is exactly the right UX. Keep it invisible unless something actually went sideways.

### 3. Are template placeholders structured fields or styled hint text?
**Answer:** Styled hint text for now. We want to ship this feature without a lot of ceremony. Admins can write templates that have placeholder text like "[Enter project goal here]" and users just click and type. If the product succeeds, we can revisit structured fields in a later quarter.

### 4. Are inline comments flat annotations or threaded replies?
**Answer:** Threaded. Our users are already familiar with GitHub PR review comments and Notion, so they'll expect to be able to reply to a comment in context. Flat annotations would feel broken to them.

### 5. What is the accept/reject flow for suggestion mode?
**Answer:** Editors and Owners can accept or reject suggestions. One-by-one is fine for now — bulk is a nice-to-have for later. Yes, those events should sync in real time so reviewers can see the document evolving during a review session.
**Additional context:** We'll need a way for commenters to make suggestions but not directly edit — that's actually a key use case. An external stakeholder should be able to suggest wording changes without being given edit access.

---

## Nice to Have

### 1. Should presence indicators appear outside the document?
**Answer:** Document-scoped only for now. A small "3 people editing" badge in the document list would be nice eventually, but it's not required for launch.

### 2. What is the exact snapshot trigger for automatic version history?
**Answer:** 5 minutes after the last edit keystroke — the debounced approach makes sense. We don't want to snapshot an empty session.

### 3. Do comments and suggestions need sub-500ms real-time sync?
**Answer:** Near-instant is good enough. Eventual consistency on comments is acceptable as long as it feels live during an active review. The server-authoritative append-only model sounds reasonable — comments aren't something we need to merge.

---

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Images use reference-based storage (not inline base64) | ✅ Correct | Confirmed. We already have S3-backed file storage from the task attachment feature — use that. |
| 2 | Yjs (CRDT) is the default sync engine | ✅ Correct | Confirmed above. Yjs is the choice. |
| 3 | Version restore is non-destructive | ✅ Correct | Confirmed — creates new HEAD snapshot, with a confirmation dialog. |
| 4 | Comment threading model matches Google Docs | ✅ Correct | Threaded replies confirmed. |
| 5 | Snapshot retention policy is undefined | ⚠️ Partially | We can't keep unlimited history forever — storage costs will blow up. Retain the last 50 automatic snapshots per document, plus all named manual snapshots indefinitely. That should be in scope for the initial stories, not deferred. |
