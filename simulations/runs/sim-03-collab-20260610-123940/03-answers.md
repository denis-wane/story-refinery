# Stakeholder Responses

## Critical Questions

### 1. Concurrent User Limits Per Document
**Answer:** 15 simultaneous editors maximum per document. 
**Additional context:** Most of our team collaboration happens with 3-5 people, but during quarterly planning reviews we sometimes have up to 12-15 stakeholders providing input on strategy docs. Going beyond 15 gets chaotic from a business process perspective anyway.

### 2. Technology Stack Integration
**Answer:** Prefer to build on our existing infrastructure if possible to reduce maintenance overhead. Our engineering team is already stretched thin.
**Additional context:** We're currently using Redis for real-time features in our project management tool, so if that can handle this, great. If not, a dedicated solution is fine but needs to be reliable - document editing downtime is more disruptive than other features.

### 3. Permission Model Integration  
**Answer:** Document permissions should inherit from project permissions by default, with ability to override per document when needed.
**Additional context:** Having to manually set permissions on every document would be a management nightmare. If someone has edit access to a project, they should get edit access to documents in that project unless explicitly restricted.

### 4. Document Size and Performance Limits
**Answer:** Target 50MB documents with 3-second initial load time maximum. Most of our documents are 1-5MB but we have some technical specifications and compliance docs that get quite large.
**Additional context:** Our current file upload limit is 100MB, so document size should be consistent with that. Users get impatient after 5 seconds, so 3 seconds gives us buffer.

### 5. Embedded Content Storage Strategy
**Answer:** File references for everything. We need consistent access control across all content.
**Additional context:** We've had security audit findings about embedded content before. Keep it simple - everything goes through our standard file storage and permissions system.

## Important Questions

### 1. Version History Retention Policy
**Answer:** Keep automatic snapshots for 30 days, manual versions indefinitely until manually deleted.
**Additional context:** Legal sometimes needs to reference document evolution for compliance, so we can't be too aggressive with cleanup.

### 2. Comment Workflow and Lifecycle
**Answer:** No comment threading - keeps it simple. Anyone with edit access can resolve comments. Document owner gets notified when comments are resolved.

### 3. Network Disconnection Recovery  
**Answer:** Show a brief summary of changes when reconnecting - users need to understand what happened while they were away.

### 4. Export Format Fidelity
**Answer:** Export exactly what's in the editor, nothing more. Users shouldn't be surprised by formatting that appears in exports but not in the interface.

### 5. Presence Indicator Timeout
**Answer:** 60-second timeout for cursors. No "was here" indicators - they just create visual clutter.

## Nice to Have

### 1. Mobile-Specific Constraints
**Answer:** Full feature parity. Our users expect consistent experience across devices.

### 2. Performance Monitoring Requirements  
**Answer:** Basic performance metrics. Integrate with our existing DataDog setup if possible.

### 3. Rate Limiting and Abuse Prevention
**Answer:** Reasonable limits fine. Focus on preventing accidental spam rather than malicious abuse.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | WebSocket-based real-time sync | ✅ Correct | Necessary for the 500ms requirement |
| 2 | Document-centric permissions | ❌ Wrong | Should inherit from project permissions by default, with override capability |
| 3 | Rich text focus over layout | ✅ Correct | We're not building a design tool |
| 4 | Embedded editor, not standalone | ✅ Correct | Must integrate with existing project management workflow |
| 5 | Operational Transform or CRDT required | ✅ Correct | Whatever handles the real-time merging reliably |
