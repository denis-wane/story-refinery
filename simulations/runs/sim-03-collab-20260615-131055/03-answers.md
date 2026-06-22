# Stakeholder Responses

## Critical Questions

### 1. How deep is the integration with the existing PM tool?
**Answer:** Documents should be deeply integrated - embedded within project pages as a dedicated tab, similar to how we handle project files and discussions. Users access them from the project navigation sidebar under "Documents." When someone creates a document, it should automatically inherit the project's team members as potential collaborators.

**Additional context:** We've gotten feedback that users don't want to leave the project context to work on documents. Also, our support team reports that people lose documents when they're in separate systems, so keeping everything in the project workspace is critical for adoption.

### 2. What are the scalability targets for concurrent users and documents?
**Answer:** We need to support up to 25 concurrent editors per document - our largest project teams are around 20 people, and we want some buffer. For overall scale, plan for 50,000 total documents across all customers and up to 1,000 documents being actively edited at any given time.

**Additional context:** Most of our collaborative editing will happen during sprint planning and retrospectives, so we get traffic spikes rather than constant usage. Also, 90% of our documents will have fewer than 5 concurrent editors, but those big planning sessions with the whole team are where this feature will really shine.

### 3. What performance requirements exist beyond the 500ms sync target?
**Answer:** Document opening should be under 3 seconds even for large documents, formatting operations need to respond within 150ms, and cursor tracking should be under 300ms. These aren't negotiable - anything slower feels broken to users.

### 4. How should this integrate with your existing user roles and permissions?
**Answer:** Document permissions should inherit from project permissions by default, but be overridable. So if someone is a "Contributor" on the project, they get "can-edit" on documents by default, but a document owner can downgrade them to "can-comment" if needed. Project Admins can always edit any document in their projects.

**Additional context:** We already have too many permission systems and our users get confused. Inheritance with overrides gives us the flexibility we need without adding complexity for the 80% case.

### 5. What's the maximum document size you need to support?
**Answer:** 50MB total document size, unlimited text length (within that limit), and up to 200 embedded images. Most of our documents will be much smaller, but our technical specifications and project retrospectives can get quite large.

## Important Questions

### 1. What platforms and browsers must be supported?
**Answer:** Modern browsers only - Chrome, Firefox, Safari, Edge from the last 2 years. Mobile web support is required but doesn't need to support editing, just viewing and commenting. No native mobile apps.

**Additional context:** Our user base is primarily desktop workers, and trying to make real-time editing work well on mobile would double our development time for maybe 5% of usage.

### 2. How should users be notified of document activity?
**Answer:** Integrate with our existing notification system. Users should get in-app notifications for mentions and comments, plus email digests for documents they're actively collaborating on. No push notifications needed.

### 3. How should embedded media (images, files) be handled?
**Answer:** Use our existing file storage system that we already have for project attachments. Images should be referenced, not stored inline, to keep sync performance good. Users should be able to drag and drop from their computer or reference files already uploaded to the project.

### 4. What should undo/redo behavior be in collaborative editing?
**Answer:** Each user needs their own undo stack. Collaborative undo would be a disaster - imagine accidentally undoing someone else's work from 10 minutes ago. Individual undo stacks are the only sane option.

### 5. How should admins create and manage document templates?
**Answer:** Project Admins should be able to create templates by copying existing documents or building from scratch in a template editor. We need templates for meeting notes, project retrospectives, and technical specs, so the editor needs full rich text support.

## Nice to Have

### 1. Are there specific security or compliance requirements?
**Answer:** No special compliance requirements beyond what we already do for the main platform. Standard web security is fine. However, we do need audit logs for document changes for our enterprise customers - they ask about this regularly.

**Additional context:** Some of our bigger customers work on sensitive projects and they want to know who changed what and when. Nothing fancy, just basic change tracking.

### 2. What quality is expected for document exports?
**Answer:** PDF exports need to look professional - this is how we share documents with clients. DOCX should preserve formatting well enough that people can continue editing in Word if needed. Markdown can be basic.

### 3. What constitutes "activity" for automatic version snapshots?
**Answer:** Any content change - text edits, formatting changes, adding/removing images. Don't include cursor movements, selections, or comments. We want to capture the actual document evolution.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Standard web app performance is acceptable | ✅ Correct | Though we need the specific SLAs I mentioned above |
| 2 | Document permissions are independent of existing project roles | ❌ Wrong | Should inherit from project permissions with overrides |
| 3 | Modern browser support is sufficient | ✅ Correct | No legacy browser support needed |
| 4 | In-app notifications are adequate | ⚠️ Partially | Need email digests too for active collaborators |
| 5 | Individual user undo stacks are preferred | ✅ Correct | Collaborative undo would be chaos |
| 6 | Templates need dedicated management UI | ✅ Correct | Project Admins need template creation/editing tools |
| 7 | Best-effort export formatting is acceptable | ⚠️ Partially | PDF quality needs to be professional, others can be best-effort |
| 8 | Standard security practices are sufficient | ✅ Correct | Though we need audit logs for enterprise customers |
| 9 | Users primarily access via web interface | ✅ Correct | Mobile is view/comment only |
