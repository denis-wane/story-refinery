# Clarifying Questions

## Critical (must answer before proceeding)

1. **Real-time technology foundation: CRDT vs Operational Transform?**
   Should we use a CRDT library (like Yjs) for conflict-free merging or an Operational Transform framework (like ShareJS) for centralized coordination? CRDT offers better offline support but larger memory usage; OT has simpler conflict resolution but requires server coordination.
   - _Why it matters:_ This architectural choice affects all real-time features, offline capabilities, and performance characteristics
   - _Default assumption if unanswered:_ We'll prototype with Yjs (CRDT) for offline-first approach

2. **Infrastructure requirements for real-time sync**
   Can our existing API infrastructure handle persistent WebSocket connections for 50+ concurrent users per document, or do we need a dedicated real-time server? What's our current WebSocket capacity?
   - _Why it matters:_ Determines infrastructure costs, deployment complexity, and scaling approach
   - _Default assumption if unanswered:_ We'll plan for a dedicated Node.js WebSocket server with Redis for connection state

3. **Embedded content storage strategy**
   How should we handle images and file attachments in documents? Inline base64 encoding (simpler sync, larger payload) or file references with separate storage (complex sync, better performance)?
   - _Why it matters:_ Affects document size limits, sync performance, and storage architecture
   - _Default assumption if unanswered:_ File reference approach with existing file storage system integration

4. **Permission system integration model**
   How do document permissions connect to existing project roles? Should document access inherit from project membership, or be independently managed? Who can grant document-level permissions?
   - _Why it matters:_ Determines user management complexity and security boundaries
   - _Default assumption if unanswered:_ Document permissions inherit from project roles with document owners able to override

5. **Maximum document size and scaling limits**
   What's the largest document (in MB) and maximum concurrent editors per document we need to support? This affects memory usage, sync performance, and UI design.
   - _Why it matters:_ Determines technical architecture and user experience boundaries
   - _Default assumption if unanswered:_ 10MB text limit, 50MB with media, 50 concurrent editors maximum

## Important (strongly recommended)

1. **Security and compliance requirements**
   Do we need data encryption in transit/at rest, audit logging of all changes, or compliance with specific regulations (GDPR, HIPAA, etc.)?
   - _Why it matters:_ Security requirements affect architecture and may require additional features
   - _Default assumption if unanswered:_ Standard enterprise security (HTTPS, encrypted storage, basic audit logs)

2. **Comment notification behavior**
   When someone adds a comment or replies, how should other users be notified? Real-time popups, email summaries, in-app notifications, or user preference-driven?
   - _Why it matters:_ Affects notification system integration and user engagement
   - _Default assumption if unanswered:_ Real-time in-app notifications plus daily email digest option

3. **Template creation and governance**
   Who can create document templates? Is there an approval workflow for new templates? Can templates be version-controlled or locked after creation?
   - _Why it matters:_ Determines administrative overhead and content governance complexity
   - _Default assumption if unanswered:_ Project admins can create templates with basic approval workflow

4. **Performance SLAs beyond real-time sync**
   What are acceptable loading times for large documents, export generation speeds, and search response times?
   - _Why it matters:_ Affects user experience and may require performance optimization features
   - _Default assumption if unanswered:_ 3-second initial load, 10-second export generation, 1-second search

## Nice to Have (will use reasonable defaults)

1. **Mobile and accessibility support**
   Do we need full editing capabilities on mobile devices? What level of accessibility compliance is required (WCAG 2.1 AA)?
   - _Why it matters:_ Affects UI/UX complexity and development scope
   - _Default assumption if unanswered:_ Responsive web design with basic mobile editing, WCAG 2.1 AA compliance

2. **Backup and disaster recovery**
   What are the backup frequency and retention requirements? Do we need point-in-time recovery or is daily backup sufficient?
   - _Why it matters:_ Affects data persistence architecture and operational procedures
   - _Default assumption if unanswered:_ Daily backups with 30-day retention, matching existing system SLA

3. **Browser compatibility scope**
   Which browsers and versions need support? Are there any specific rich text editing limitations we should plan for?
   - _Why it matters:_ Affects development effort and feature availability across browsers
   - _Default assumption if unanswered:_ Last 2 versions of Chrome, Firefox, Safari, and Edge

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **10MB text documents, 50MB with media** — Based on typical enterprise document usage patterns
2. **50 concurrent editors maximum** — Assumes normal team collaboration sizes, not massive open editing
3. **3-second initial load, 10-second exports** — Based on standard web application performance expectations  
4. **Real-time notifications plus email digest** — Balances immediate awareness with notification fatigue
5. **Admin-only template creation with approval** — Assumes controlled content governance is preferred
6. **Standard enterprise security model** — Encryption in transit/rest, basic audit logs without special compliance
7. **Daily backups with 99.9% availability** — Matching typical existing system SLA and backup frequency
