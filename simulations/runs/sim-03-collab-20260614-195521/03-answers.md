Looking at this collaborative document editing feature for our project management tool, I'll answer the clarifying questions:

# Stakeholder Responses

## Critical Questions

### 1. Real-time technology foundation: CRDT vs Operational Transform?
**Answer:** Go with CRDT (Yjs). Offline support is critical for our field teams who frequently work in areas with spotty connectivity.
**Additional context:** We've had too many complaints about work getting lost when people lose connection. The memory overhead is worth it for the reliability, and our hosting costs can handle it.

### 2. Infrastructure requirements for real-time sync
**Answer:** We need the dedicated WebSocket server. Our current API can't handle 50+ persistent connections per document without affecting other features.
**Additional context:** Budget for the dedicated server is already approved - engineering mentioned this might be needed and we planned for it. Just make sure it integrates cleanly with our existing Redis setup.

### 3. Embedded content storage strategy
**Answer:** File references with separate storage. We already have robust file storage with CDN - let's use it.
**Additional context:** Our documents will have lots of screenshots and diagrams. Inline base64 would make document sync painfully slow, and our users already upload 50+ MB project files regularly.

### 4. Permission system integration model
**Answer:** Inherit from project roles but allow document owners to override with more restrictive permissions.
**Additional context:** Project managers need to be able to lock down sensitive documents (like client contracts) even within their project teams. The override should only go more restrictive, not more permissive.

### 5. Maximum document size and scaling limits
**Answer:** 25MB total document size, 75 concurrent editors maximum.
**Additional context:** Our largest projects have 60-person teams, and during sprint planning everyone might be in the same doc. The 10MB text limit in the assumption is too small - our requirements docs get lengthy with embedded tables and formatting.

## Important Questions

### 1. Security and compliance requirements
**Answer:** Standard enterprise security plus change audit logs with user attribution.
**Additional context:** We're not HIPAA/financial, but clients audit us annually. They always ask about document change tracking, so make sure every edit is logged with timestamp and user ID.

### 2. Comment notification behavior
**Answer:** Real-time in-app notifications, email digest every 4 hours (not daily), plus @mention notifications immediately via email.
**Additional context:** Daily digest is too slow for project work. When someone @mentions you in a comment, that needs to go to email immediately - those are usually urgent decisions.

### 3. Template creation and governance
**Answer:** Project admins and organization admins can create templates. No approval workflow - just version control with rollback capability.
**Additional context:** Approval workflow will slow us down too much. Trust the admins, but give them tools to fix mistakes quickly.

### 4. Performance SLAs beyond real-time sync
**Answer:** 2-second initial load for documents under 5MB, 5-second for larger. Export generation can be up to 30 seconds - just show a progress indicator.

## Nice to Have

### 1. Mobile and accessibility support
**Answer:** Full editing on tablets, read-only with comment capability on phones. WCAG 2.1 AA compliance required.
**Additional context:** Our project managers live on iPads. Phone editing is too cramped, but they need to review and comment during client meetings.

### 2. Backup and disaster recovery
**Answer:** Hourly incremental backups, daily full backups, 90-day retention.
**Additional context:** Documents change too frequently for daily backups. If we lose a day of work on a critical project document, that's a client relationship issue.

### 3. Browser compatibility scope
**Answer:** Last 2 versions of Chrome, Firefox, Safari, Edge. Drop IE completely.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | 10MB text documents, 50MB with media | ❌ Wrong | 25MB total limit is better - our docs are text-heavy with embedded tables |
| 2 | 50 concurrent editors maximum | ❌ Wrong | Need 75 - our largest project teams hit 60 people in sprint planning |
| 3 | 3-second initial load, 10-second exports | ⚠️ Partially | 2 seconds for small docs, exports can be 30 seconds with progress bar |
| 4 | Real-time notifications plus email digest | ⚠️ Partially | 4-hour digest, not daily, plus immediate @mention emails |
| 5 | Admin-only template creation with approval | ❌ Wrong | No approval workflow - just admin creation with version control |
| 6 | Standard enterprise security model | ✅ Correct | Plus change audit logs with user attribution |
| 7 | Daily backups with 99.9% availability | ⚠️ Partially | Hourly incremental, daily full backups needed |
