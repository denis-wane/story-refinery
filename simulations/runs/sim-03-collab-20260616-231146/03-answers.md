# Stakeholder Responses

## Critical Questions

### 1. CRDT vs. OT — what's your existing stack?
**Answer:** We're a Node.js shop — our API gateway runs on Express, and we already have Socket.io in the codebase for a lightweight notifications feature. Go with Yjs + y-websocket. We'd rather extend what we have than introduce a new runtime.

**Additional context:** The Socket.io instance is currently single-node, so you'll need to plan for Redis pub/sub or a similar adapter when we scale the WebSocket layer. That's on our infra team's radar already.

---

### 2. Do you have an existing permissions model, and does it support per-document scoping?
**Answer:** Our permissions today are workspace-level and project-level only — there's no concept of per-resource scoping. So yes, you'll need a migration story to add that. For mid-session revocation: graceful transition with a notification, not a hard kick. We don't want users losing unsaved work because someone changed a permission.

---

### 3. WebSocket infrastructure: existing or greenfield?
**Answer:** Not entirely greenfield — we have Socket.io as I mentioned, but it's not built for stateful room semantics at this scale. Treat it as "extend and harden" rather than pure greenfield. You'll need to add room management and ensure the operation stream is reliable, but you're not starting from zero.

---

### 4. What is the version history retention policy?
**Answer:** Keep auto-snapshots for 90 days, not 30. We've had support escalations where customers needed to recover content from 6 weeks ago. Named versions are kept indefinitely. Only the document owner or an admin can delete a named version — not any editor.

**Additional context:** Our legal team flagged that enterprise-tier customers will eventually want configurable retention per workspace. Don't build it now, but don't architect it out either.

---

### 5. What is the maximum document size you need to support at launch?
**Answer:** 2MB text content is fine — our customer data shows the 99th percentile document is under 800KB. Cap embedded images at 20 per document for v1, not 50. We can revisit after launch once we see real usage patterns.

---

## Important Questions

### 1. Offline conflict surface: auto-merge always, or show a conflict UI?
**Answer:** Always auto-merge in v1. We'd rather ship fast and iterate. If customers complain, we'll build the diff UI in a follow-up.

---

### 2. Should viewers appear in the presence indicator?
**Answer:** Yes, show viewers with a passive indicator. Our product research found that authors actually want to know when someone is reading their document — it creates a sense of audience that people like.

---

### 3. Suggestion mode scope: text-only or formatting changes too?
**Answer:** Text only for v1. Formatting-tracked changes is a v2 feature. Don't even stub it out — just make sure the data model doesn't foreclose adding it later.

---

### 4. Can viewers export, or is export gated to editors/commenters?
**Answer:** Viewers can export to PDF only. We use view-only links as a distribution mechanism — locking export would break existing workflows. DOCX and Markdown export stays gated to can-comment and above.

**Additional context:** This came up in a customer call last week. View-only PDF export is a real requirement for us, not a nice-to-have.

---

### 5. Comment threading: flat replies or nested threads?
**Answer:** One level of replies, flat threads. Same as Notion — good enough for our use case.

---

## Nice to Have

### 1. Template placeholder syntax and instantiation UX
**Answer:** Use `{{field_name}}` syntax. No guided form in v1, just copy and fill manually. We can add the form experience in a later sprint.

---

### 2. Snapshot trigger — definition of "activity"
**Answer:** Any keystroke counts as activity. Manual saves should not reset the auto-snapshot timer — they're independent operations.

---

### 3. Image/file storage: use existing file storage service or new?
**Answer:** Use our existing S3 service. We already have an upload API — route images through that. Don't create a new bucket.

---

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Inline base64 is off the table | ✅ Correct | Confirmed — reference-based storage via existing S3 upload API |
| 2 | Conflict resolution is always auto-merge in v1 | ✅ Correct | Confirmed |
| 3 | Comment threading is one level of replies | ✅ Correct | Confirmed — flat threads |
| 4 | Suggestion mode covers text changes only | ✅ Correct | Confirmed for v1 |
| 5 | Export is restricted to can-comment and higher | ❌ Wrong | View-only users can export to PDF. DOCX and Markdown remain gated to can-comment and above. |
| 6 | `{{field_name}}` placeholder syntax with simple find-replace | ✅ Correct | Confirmed |
| 7 | Max document size working target is 5MB text / 50 images | ⚠️ Partially | Text cap is 2MB, not 5MB. Image cap is 20, not 50. Adjust stories accordingly. |
| 8 | Snapshot fires 5 minutes after the last auto-snapshot if any edits occurred | ✅ Correct | Confirmed — manual saves don't reset the timer |
| 9 | Viewers appear in the presence indicator | ✅ Correct | Confirmed — passive visual treatment |
