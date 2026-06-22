# Clarifying Questions

## Critical (must answer before proceeding)

1. **Concurrent User Limits Per Document**
   How many users should be able to simultaneously edit a single document? This affects whether we need horizontal scaling, connection pooling strategies, and performance optimization priorities.
   - _Why it matters:_ Architecture choices between simple WebSocket handling vs load-balanced connection pools
   - _Default assumption if unanswered:_ 25 concurrent editors maximum per document

2. **Technology Stack Integration**
   Should this use your existing real-time infrastructure (if any) or can we introduce a new WebSocket server? Do you have preferences for CRDT libraries (Yjs) vs Operational Transform (ShareJS) based on your current tech stack?
   - _Why it matters:_ Determines whether we build on existing infrastructure vs introduce new dependencies
   - _Default assumption if unanswered:_ New dedicated WebSocket server with Yjs (CRDT) for conflict resolution

3. **Permission Model Integration**
   How should document permissions inherit from your existing project management permissions? For example, if someone has "edit" access to a project, do they automatically get "edit" access to all documents in that project?
   - _Why it matters:_ Affects permission check implementation and user experience consistency
   - _Default assumption if unanswered:_ Document permissions are independent of project permissions; must be set per document

4. **Document Size and Performance Limits**
   What's the maximum document size you need to support, and what's an acceptable load time for large documents? This affects storage strategy and sync optimization.
   - _Why it matters:_ Determines caching strategy, chunking approach, and performance targets
   - _Default assumption if unanswered:_ 10MB text limit with 2-second load time target for full documents

5. **Embedded Content Storage Strategy**
   Should images and attachments be stored inline (base64) or as separate file references? How do you want to handle access control for embedded files?
   - _Why it matters:_ Affects storage costs, sync performance, and security implementation
   - _Default assumption if unanswered:_ File references with separate access control; base64 fallback for images <100KB

## Important (strongly recommended)

1. **Version History Retention Policy**
   How long should automatic snapshots be kept, and is there a storage budget constraint? Daily snapshots can accumulate quickly for active documents.
   - _Why it matters:_ Storage costs and cleanup job complexity
   - _Default assumption if unanswered:_ Keep hourly snapshots for 7 days, daily for 90 days, then delete

2. **Comment Workflow and Lifecycle**
   Should comments support threading (replies to comments)? Who can resolve comments—only the author, document owner, or anyone with edit access? Can resolved comments be reopened?
   - _Why it matters:_ UI complexity and permission logic for comment management
   - _Default assumption if unanswered:_ No comment threading; anyone with edit access can resolve; resolved comments can be reopened

3. **Network Disconnection Recovery**
   When users reconnect after being offline, should they see a summary of changes made by others, or should the merge happen transparently? How long should we buffer offline changes?
   - _Why it matters:_ User experience during reconnection and local storage requirements
   - _Default assumption if unanswered:_ Transparent merge with 24-hour offline change buffering

4. **Export Format Fidelity**
   For PDF/DOCX export, how closely should formatting match the editor? Should we support advanced formatting (fonts, spacing) even if the editor doesn't support editing them?
   - _Why it matters:_ Export feature complexity and user expectations
   - _Default assumption if unanswered:_ Export supports only formatting available in the editor; no advanced layout features

5. **Presence Indicator Timeout**
   How long after someone stops editing should their cursor/presence indicator disappear? How long should "User X was here 5 minutes ago" type indicators persist?
   - _Why it matters:_ Real-time data cleanup and UI clutter management
   - _Default assumption if unanswered:_ 30-second timeout for active cursors; no "was here" indicators

## Nice to Have (will use reasonable defaults)

1. **Mobile-Specific Constraints**
   Are there mobile-specific editing limitations we should implement (e.g., simplified toolbar, touch-optimized selection)? Should mobile users have reduced sync frequency to save bandwidth?
   - _Default assumption:_ Full desktop feature parity on mobile with standard touch optimizations

2. **Performance Monitoring Requirements**
   Do you need built-in analytics for sync latency, document load times, or user activity? Should this integrate with existing monitoring tools?
   - _Default assumption:_ Basic performance logging; no special monitoring integration

3. **Rate Limiting and Abuse Prevention**
   Should there be limits on edit frequency, comment creation, or version saves per user to prevent spam or abuse?
   - _Default assumption:_ 1000 operations per minute per user; 10 manual version saves per day

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **WebSocket-based real-time sync** — Based on <500ms requirement and presence indicators
2. **Document-centric permissions** — Assumes permissions are set per document rather than inherited from parent containers
3. **Rich text focus over layout** — Assumes this is for text-heavy documents, not visual layout like presentations
4. **Embedded editor, not standalone** — Based on "embedded into our project management tool" language
5. **Operational Transform or CRDT required** — Based on simultaneous editing and conflict resolution requirements
