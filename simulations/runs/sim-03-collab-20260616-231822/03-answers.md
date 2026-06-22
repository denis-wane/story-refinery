# Stakeholder Responses

## Critical Questions

### 1. CRDT vs. OT framework decision
**Answer:** Go with Yjs + Tiptap. We've already had a brief internal discussion and the team that evaluated it liked the offline story. Lock it in.
**Additional context:** Our mobile team also mentioned they might want to embed this eventually, so picking something with broad ecosystem support matters more than marginal perf differences between CRDT approaches.

### 2. WebSocket infrastructure: new service or extend existing?
**Answer:** We'll need a dedicated WebSocket service. Our existing backend doesn't support sticky sessions — it's stateless behind a load balancer. We don't have Redis in prod either, though we've talked about adding it.
**Additional context:** Our infra lead flagged that standing up a new service is fine from a DevOps perspective; we do it regularly. Just needs to go through our standard security review before it touches prod.

### 3. Integration with the existing permissions model
**Answer:** Our current permissions are workspace-level only — there's nothing per-document today. You'll need to build that layer from scratch. We do have a roles table (owner, admin, member, guest) but it operates at the workspace level.
**Additional context:** The security team has already said a new `document_permissions` table is the right call — they reviewed a similar schema for our file attachments feature last quarter and approved the pattern.

### 4. Guest / external collaborator access — in or out of scope?
**Answer:** Out of scope for v1. All users must be authenticated. We might revisit share links in a follow-up quarter, but don't design for it now.

### 5. Concurrent editors scale target
**Answer:** Realistically we expect teams of 3–8 people editing together. Design for 25 to give us headroom, but we don't need to engineer for 50+ at launch.

---

## Important Questions

### 1. Version history retention policy
**Answer:** Retain the last 30 auto-snapshots per document. Manually named versions are kept indefinitely. No tier differentiation in v1 — we'll revisit when we have real usage data.

### 2. Version restore: destructive overwrite or new version?
**Answer:** Non-destructive. Always create a new named version on restore — label it "Restored from [original date/name]". Nobody should be able to silently blow away the current state.

### 3. Comment behavior when anchored text is deleted
**Answer:** Orphan them — keep the comment visible in the sidebar with the original quoted text. Don't silently delete comments; our users would be furious if they lost review feedback just because someone deleted a sentence.

### 4. Export fidelity: full fidelity or best-effort?
**Answer:** Best-effort is fine for v1. Just make sure the release notes are clear about what won't round-trip perfectly. Code block syntax highlighting in DOCX can be documented as a known gap.

### 5. Mobile support — desktop-only or mobile-responsive?
**Answer:** Desktop web only for v1. Our usage data shows less than 8% of sessions come from mobile browsers in the project tool, so it's not worth the complexity at launch.

---

## Nice to Have

### 1. @mentions in comments — in scope for v1?
**Answer:** Out of scope for v1. We already have an in-app notification system though, so the hook should be easy to wire up in a follow-on sprint. Just leave a clear extension point.

### 2. Suggestion mode + real-time sync rendering
**Answer:** Tracked changes should be visible to all users as pending markup regardless of their mode. Acceptance or rejection is an explicit action — don't auto-apply suggestion-mode edits.

### 3. Maximum document size
**Answer:** 2MB text and 50 images sounds right as a starting cap. Flag it clearly in the UI if a document is approaching the limit. We can revisit after GA.

---

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Images are stored by reference, not base64 | ✅ Correct | We have an existing S3-backed file storage service — use that. |
| 2 | Embedded images inherit document permissions | ⚠️ Partially | The file storage service exists but does **not** currently enforce per-document ACLs — it's per-workspace. You'll need to extend it, or proxy image fetches through a permission check. Don't assume the current service handles this automatically. |
| 3 | Offline merge order is determined by server receive timestamp | ✅ Correct | That's the right tradeoff. Surface it in the undo history so users understand why their edit "lost." |
| 4 | Version history is browsable by editors only, not viewers | ❌ Wrong | We actually want **commenters** (can-comment permission) to be able to browse version history too, not just editors. They need it for review workflows. Viewers are still excluded. |
| 5 | The editor framework will be Tiptap (ProseMirror-based) | ✅ Correct | That's what we're going with. Create the decision record as part of the foundation phase — engineering leads want it documented before we write a single line of editor code. |
