# Stakeholder Responses

## Critical Questions

### 1. What is your existing permissions model?
**Answer:** We use resource-based ACLs — every object in the system (projects, tasks, boards) has an access list with user/role entries. It's not a global RBAC system; permissions are set per resource. We can extend it to support documents with new entry types (view, comment, edit) without a separate service — the pattern is already established.

**Additional context:** The security team has already signed off on extending the ACL model for documents. The main constraint is that document permissions must be manageable from the existing "Share" UI pattern users already know from project boards. Don't reinvent that UX.

---

### 2. What are your maximum document size and concurrent editor targets?
**Answer:** Max document size: 5MB. Concurrent editors per document: 50 in the P99 case. We have some large internal documents (engineering specs, strategy docs) that get edited by big teams.

**Additional context:** The 50-editor target is for our largest enterprise customers. Most documents will have 2–5 editors. Design for 50, but don't gold-plate the presence UI assuming 50 is common.

---

### 3. Do you have a WebSocket-capable server today, or does one need to be built?
**Answer:** We have WebSockets for our existing real-time notifications (task assignments, comments). It's a Node.js service behind our API gateway, and the gateway does pass through WebSocket upgrades — we verified this last year when we built the notification system. You can build the collaboration service on the same infrastructure.

**Additional context:** The team running that service is the Platform team — coordinate with them before touching the WebSocket layer. They have deployment ownership.

---

### 4. How should undo work when edits have been merged from another user?
**Answer:** Local undo only. I don't want users accidentally undoing someone else's work. Each person's undo stack should only touch their own edits.

---

### 5. Must mobile / touch-screen editing be supported in v1?
**Answer:** No — desktop-only editing for v1 is fine. Our user research shows document editing happens almost exclusively on desktop. Mobile viewing (read-only) should work, but we can push mobile editing to a later phase.

---

## Important Questions

### 1. What is the conflict resolution unit for last-writer-wins?
**Answer:** Character level. And no explicit notification when a user loses a LWW conflict — seeing their text replaced in real-time is enough. If we notify on every conflict in a live document with 10 people typing, it'll be chaos.

---

### 2. Who can accept or reject suggestions in track-changes mode?
**Answer:** Any editor can accept or reject any suggestion. Keep it simple. Commenters can submit suggestions but cannot accept/reject them.

**Additional context:** We considered owner-only approval but our teams work collaboratively — making the owner a bottleneck would kill adoption.

---

### 3. What does "5 minutes of activity" mean for auto-snapshots?
**Answer:** Edit activity, not wall clock. If no one's typing, don't snapshot. And 30-day pruning for unnamed snapshots sounds right.

---

### 4. Should in-app notifications be in scope for v1?
**Answer:** Yes — but email only, not in-app badges. When someone @-mentions you in a comment or comments on a document you own, send an email digest. Real-time in-app notification badges are out of scope for v1, but silent @-mentions will kill adoption.

**Additional context:** We already have a transactional email service (SendGrid). Route through that.

---

### 5. Can documents be exported by Viewers, or only Editors and Commenters?
**Answer:** Commenters and above can export. Viewers cannot. A view-only link should not be an easy exfiltration path.

---

## Nice to Have

### 1. How long can a user be offline before their reconnect merge is flagged or refused?
**Answer:** Always attempt the merge. Show a warning if the offline period was more than 24 hours — that's a reasonable threshold. Don't refuse the merge outright.

---

### 2. Are document templates a one-time copy or a live link?
**Answer:** One-time copy. Nobody expects editing a template to change existing documents — that would be terrifying.

---

### 3. Which heading levels are needed?
**Answer:** H1, H2, H3. That's what we use in every document in the company. H4–H6 would just clutter the toolbar.

---

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Images are stored by reference, not inline | ✅ Correct | We use S3-compatible storage already. Store the URL, not the bytes. |
| 2 | Version restore creates a new version, not an overwrite | ✅ Correct | Preserve history. We've had data loss incidents with overwrite-style restores in other tools — never again. |
| 3 | Comments are archived on resolution, not deleted | ✅ Correct | We need the audit trail. Legal has asked for this explicitly on past projects. |
| 4 | Guest / anonymous access is out of scope | ⚠️ Partially | Authenticated users only is correct for editing and commenting. However, we do need **public read-only share links** (no login required) for sharing documents externally with clients. This was in the original feature ask but got lost — add it back as a Viewer-tier capability. |
| 5 | Headless export rendering is acceptable | ✅ Correct | Server-side rendering is fine. We don't want a client-side dependency for something as critical as export. |
