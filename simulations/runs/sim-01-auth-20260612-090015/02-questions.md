# Clarifying Questions

## Critical (must answer before proceeding)

1. **How do existing email/password users transition when SSO is enabled for their organization?**
   When an organization admin enables SSO with "must use SSO" enforcement, what happens to users who currently have password-based accounts? Do they automatically get linked to SSO identities based on email matching, or is there a manual migration process?
   - _Why it matters:_ Determines data migration stories, user experience during transition, and potential account linking conflicts
   - _Default assumption if unanswered:_ Automatic account linking by email address with fallback to password auth if SSO assertion fails

2. **What's the user experience when MFA is newly enforced but not yet set up?**
   When organization admins enable MFA enforcement, how long do users have to set it up? What happens when a user without MFA tries to log in after enforcement begins?
   - _Why it matters:_ Affects onboarding flows, grace period implementation, and user support volume
   - _Default assumption if unanswered:_ 14-day grace period with in-app prompts, soft enforcement (warnings) for first 7 days

3. **How do organization admins configure SSO settings?**
   Is SSO configuration self-service through a UI, API-driven, or requires support team assistance? What technical validation happens during setup (certificate upload, endpoint testing, etc.)?
   - _Why it matters:_ Determines admin interface requirements, support workflow integration, and technical complexity of configuration stories
   - _Default assumption if unanswered:_ Self-service UI with guided wizard, certificate file upload, and automated endpoint validation

4. **What's the recovery process when users lose their MFA device?**
   Can users self-recover using backup codes only, or is there an admin override process? What role does customer support play in MFA recovery?
   - _Why it matters:_ Affects admin tooling requirements, support workflow integration, and security vs. usability balance
   - _Default assumption if unanswered:_ Users self-recover with backup codes; organization admins can reset MFA for their users; support escalation for admin MFA resets

5. **How should the system handle SSO provider downtime?**
   When the organization's identity provider is unavailable, should there be a password fallback, temporary access codes, or hard failure until provider returns?
   - _Why it matters:_ Determines disaster recovery implementation, user communication strategy, and business continuity features
   - _Default assumption if unanswered:_ Hard failure with clear error messaging; no password fallback to maintain security policy

## Important (strongly recommended)

1. **What are the specific rate limiting thresholds for authentication endpoints?**
   How many failed attempts before rate limiting kicks in, over what time window, and what's the lockout duration/progression?
   - _Why it matters:_ Critical for preventing credential stuffing attacks (mentioned as priority after last incident)
   - _Default assumption if unanswered:_ 5 failed attempts per 5-minute window, progressive backoff starting at 1 minute

2. **What SMS coverage and delivery requirements exist?**
   Which countries must be supported for SMS MFA, and what's the expected delivery success rate? Any specific carrier requirements?
   - _Why it matters:_ Affects vendor selection, delivery reliability features, and international user support
   - _Default assumption if unanswered:_ Major English-speaking countries, 95% delivery success, single SMS provider with basic retry logic

3. **What audit log format and retention policy should be implemented?**
   What specific fields must be logged for authentication events, how long should logs be retained, and who needs access?
   - _Why it matters:_ Compliance requirements and storage costs vary significantly based on retention and detail level
   - _Default assumption if unanswered:_ 2-year retention, JSON format with user ID, IP, timestamp, event type, and organization ID

4. **What are the session timeout boundaries for organizations?**
   While 24h default and 30d maximum are specified, what's the minimum allowed session timeout?
   - _Why it matters:_ Security-conscious organizations may require very short sessions
   - _Default assumption if unanswered:_ 1-hour minimum session timeout

5. **How should account lockouts work across authentication methods?**
   Should failed SSO attempts count toward the same lockout threshold as password attempts? How long should lockouts last?
   - _Why it matters:_ Affects user experience and security effectiveness across different auth methods
   - _Default assumption if unanswered:_ Separate counters for each auth method, 5 failed attempts trigger 30-minute lockout, admins can unlock

## Nice to Have (will use reasonable defaults)

1. **How many backup recovery codes should users receive?**
   Standard practice varies from 8-16 codes. Any preference on quantity and format?
   - _Default assumption if unanswered:_ 10 single-use recovery codes, downloadable as text file

2. **Should password complexity rules apply when SSO coexists?**
   For users who can still use passwords (non-SSO organizations), do existing password rules remain?
   - _Default assumption if unanswered:_ Existing password complexity rules remain unchanged

3. **What level of MFA enrollment guidance should be provided?**
   Should there be step-by-step setup wizards, video tutorials, or basic text instructions?
   - _Default assumption if unanswered:_ Step-by-step wizard with QR codes for TOTP setup and SMS verification

## Assumptions Being Made

_These are interpretations the analysis has already made. Flag any that are wrong._

1. **JWT tokens will include MFA and SSO status claims** — Based on current JWT architecture and need to track authentication context
2. **PostgreSQL schema extensions will handle SSO metadata and MFA secrets** — Based on existing database architecture
3. **Redis will be used for rate limiting counters** — Based on need for distributed rate limiting and typical Node.js patterns
4. **SAML 2.0 takes priority over OpenID Connect** — Based on "enterprise customers" focus and SAML being listed first
5. **Organization admins get full control over their org's auth policies** — Based on "enterprise customers can configure" requirement
6. **System admins have elevated privileges beyond organization admins** — Based on security team requirements and role hierarchy implications
