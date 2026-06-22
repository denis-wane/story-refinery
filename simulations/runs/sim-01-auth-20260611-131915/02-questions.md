# Clarifying Questions

## Critical (must answer before proceeding)

1. **Account linking strategy for SSO users**
   When a user signs in via SSO for the first time, how should the system match them to existing accounts? Should it automatically link by email address, require manual account claiming, or create new accounts?
   - _Why it matters:_ Determines core SSO assertion processing logic and affects user data integrity
   - _Default assumption if unanswered:_ Auto-link by email address with email domain verification

2. **SSO transition strategy for existing users**  
   When an organization enables SSO enforcement, what happens to users who currently authenticate with email/password? Do they get a grace period, forced immediate migration, or admin-managed transition?
   - _Why it matters:_ Affects user migration stories, data cleanup, and change management flows
   - _Default assumption if unanswered:_ 30-day grace period where both auth methods work, then hard cutover with email notification

3. **SSO provider downtime fallback behavior**
   When the configured SSO provider is unavailable, should users be completely locked out, have temporary password authentication, or see a "try again later" page?
   - _Why it matters:_ Core availability vs security trade-off that affects error handling and backup auth flows
   - _Default assumption if unanswered:_ Complete lockout with clear error message and admin notification (no password fallback)

4. **Rate limiting thresholds and escalation**
   What are the specific rate limits for authentication attempts (per IP, per user, per organization), time windows, and progressive penalty escalation (delays, temporary blocks, etc.)?
   - _Why it matters:_ Determines security implementation parameters and user experience during legitimate high-volume usage
   - _Default assumption if unanswered:_ 5 attempts per user per 15 minutes, 50 attempts per IP per hour, with exponential backoff delays

5. **SSO configuration interface and ownership**
   Where do organization admins configure SSO settings (metadata upload, certificate management, provider URLs)? Is this a self-service UI, assisted setup, or API-only?
   - _Why it matters:_ Determines admin portal implementation scope and support workflow complexity
   - _Default assumption if unanswered:_ Self-service web interface with guided setup wizard and metadata file upload

## Important (strongly recommended)

1. **Audit log retention and compliance requirements**
   How long should authentication logs be retained, what compliance frameworks must be supported (SOC2, GDPR), and are there export requirements for security teams?
   - _Why it matters:_ Affects storage planning, compliance implementation, and data management workflows
   - _Default assumption if unanswered:_ 1-year retention with JSON export capability, SOC2 compliance only

2. **SMS provider selection and cost constraints**
   Which SMS service should be integrated (Twilio, AWS SNS), what are the cost limits per organization, and what international coverage is required?
   - _Why it matters:_ Determines vendor integration complexity, cost model, and feature availability
   - _Default assumption if unanswered:_ Twilio integration with $500/month cost cap per organization, US/Canada/UK coverage only

3. **MFA device loss recovery process**  
   When users lose access to their MFA device, is recovery self-service (security questions, recovery codes only) or does it require admin assistance with identity verification?
   - _Why it matters:_ Affects support team workload and security vs usability trade-offs
   - _Default assumption if unanswered:_ Self-service via recovery codes only, admin can disable MFA after email verification

4. **MFA enforcement granularity validation**
   The analysis assumes MFA enforcement is organization-wide only. Should there be role-based or group-based enforcement options (e.g., enforce for admins only)?
   - _Why it matters:_ Determines policy management complexity and feature scope for enterprise customers
   - _Default assumption if unanswered:_ Organization-wide enforcement only in initial version, role-based planned for future phase

5. **Admin notification requirements**
   Which authentication events should trigger notifications to organization admins (failed SSO assertions, MFA bypasses, suspicious activity), and via what channels (email, in-app, webhook)?
   - _Why it matters:_ Affects security monitoring implementation and operational notification volume
   - _Default assumption if unanswered:_ Email notifications for SSO configuration changes and repeated authentication failures only

## Nice to Have (will use reasonable defaults)

1. **Recovery code specifications validation**
   The analysis assumes 10 single-use recovery codes, regenerated when fewer than 3 remain. Should codes be reusable, have expiration dates, or use different quantities?
   - _Why it matters:_ Minor UX and security considerations for backup authentication
   - _Default assumption if unanswered:_ 10 single-use codes, auto-regeneration prompt at 3 remaining, no expiration

2. **Session timeout behavior validation**  
   The analysis assumes hard logout with redirect when session timeout is reached. Should there be a warning period, activity-based extension, or graceful degradation?
   - _Why it matters:_ User experience during active work sessions
   - _Default assumption if unanswered:_ Hard logout with 5-minute warning notification and redirect to login

3. **SSO provider prioritization**
   Beyond "Okta and Azure AD integration," should any specific providers be prioritized for testing and documentation (Google Workspace, Ping, Auth0)?
   - _Why it matters:_ Testing scope and documentation focus for initial release
   - _Default assumption if unanswered:_ Okta, Azure AD, and Google Workspace as primary test providers

4. **Progressive MFA rollout timeline**
   The security team requires MFA for admin users by Q3. Should there be a phased rollout schedule for different user types or organizations?
   - _Why it matters:_ Implementation timeline and change management planning
   - _Default assumption if unanswered:_ Admin users first (Q3), then organization-by-organization voluntary adoption

5. **Audit log export formats**
   What data formats should be supported for audit log exports (CSV, JSON, SIEM integration formats), and should there be real-time streaming options?
   - _Why it matters:_ Security team tooling integration and compliance report generation
   - _Default assumption if unanswered:_ JSON export via admin UI, no real-time streaming in initial version

## Assumptions Being Made

_These are interpretations the analysis has already made. Flag any that are wrong._

1. **MFA enforcement is organization-wide only** — Based on stakeholder note about "admin-role users" but no mention of granular controls
2. **Recovery codes are single-use with auto-regeneration** — No specification in requirements, using industry standard approach  
3. **Session timeout causes immediate logout** — Requirements mention "configurable timeout" but not behavior when reached
4. **Rate limiting applies to all auth endpoints equally** — Requirements mention "auth endpoints" without distinction between login, MFA, SSO
5. **Account linking happens automatically by email** — No specification of how SSO assertions map to existing accounts
6. **SMS MFA has no international restrictions** — Requirements don't specify geographic limitations
7. **SSO configuration is self-service** — Requirements say "enterprise customers can configure" without specifying the process
8. **Audit logs include all auth events equally** — No distinction between high-value security events and routine activity logging
