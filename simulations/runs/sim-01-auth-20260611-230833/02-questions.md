# Clarifying Questions

## Critical (must answer before proceeding)

1. **SSO Configuration: Self-Service vs Assisted Setup**
   When an organization wants to enable SSO, do they configure it themselves through a UI, or do they contact support for assisted setup? What specific settings do they control (entity ID, certificate upload, attribute mapping, etc.)?
   - _Why it matters:_ Determines whether we need to build admin UI for SSO configuration or just internal tools for support team
   - _Default assumption if unanswered:_ Support-assisted setup initially, with basic org admin UI for enabling/disabling SSO only

2. **Existing User Account Migration Strategy**
   When an organization enables SSO, what happens to users who already have email/password accounts? Auto-link by email? Require manual account claiming? Force new SSO-only accounts?
   - _Why it matters:_ Affects user model design, migration workflows, and potential data loss scenarios
   - _Default assumption if unanswered:_ Auto-link accounts by email address with manual verification step for first SSO login

3. **Rate Limiting: Specific Thresholds and Lockout Behavior**
   What are the exact rate limits for authentication endpoints? How long are accounts/IPs locked out? Are there bypass mechanisms for legitimate traffic spikes or admin access?
   - _Why it matters:_ Determines security implementation approach and potential user experience friction
   - _Default assumption if unanswered:_ 5 failed attempts per user per 15 minutes, 1-hour lockout, IP-based limiting at 50 attempts per hour

4. **MFA Enforcement: Rollout Timeline and User Experience**
   When an org admin enforces MFA for all users, is it immediate (users locked out until they set up MFA) or gradual (grace period with reminders)? How are affected users notified?
   - _Why it matters:_ Affects enforcement workflow design and support burden during rollout
   - _Default assumption if unanswered:_ 7-day grace period with email reminders, then soft lockout requiring MFA setup before next login

5. **SMS Provider Selection and Coverage**
   Which SMS service should we integrate with? Does it need to support international numbers immediately, or can we start with US/Canada and expand later?
   - _Why it matters:_ Affects integration complexity, costs, and which users can use SMS MFA
   - _Default assumption if unanswered:_ AWS SNS for SMS delivery, US/Canada phone numbers only in initial release

## Important (strongly recommended)

1. **Session Timeout Scope: Local vs SSO Sessions**
   Does the configurable session timeout apply to local JWT sessions, SSO provider sessions, or both? How does SSO session timeout interact with org-level settings?
   - _Why it matters:_ Determines technical implementation approach and user experience consistency
   - _Default assumption if unanswered:_ Org timeout applies only to local JWT sessions, SSO session timeout managed by identity provider

2. **SCIM Compatibility: Current Architecture Impact**
   Since SCIM provisioning is planned for a future phase, are there specific user model or authentication flow decisions we should make now to avoid rework later?
   - _Why it matters:_ May affect current database schema design and user identity approach
   - _Default assumption if unanswered:_ Design for email-based user identity with org association, defer SCIM-specific schema until future phase

3. **Identity Provider Testing: Validation Requirements**
   Beyond Okta and Azure AD, which other providers need testing? Do we need provider-specific configuration templates or is standard SAML/OIDC compliance sufficient?
   - _Why it matters:_ Affects integration testing scope and provider onboarding process
   - _Default assumption if unanswered:_ Focus on Okta and Azure AD initially, standard SAML 2.0/OIDC for others

4. **Organization Admin Capabilities: UI Feature Scope**
   What authentication management features do org admins need beyond SSO enable/disable and MFA enforcement? User role management? Session monitoring? Audit log access?
   - _Why it matters:_ Determines admin UI development scope and complexity
   - _Default assumption if unanswered:_ Basic controls only: SSO toggle, MFA enforcement toggle, view user authentication status

5. **MFA Device Loss: Recovery Process**
   When users lose their authenticator device or phone, what's the recovery process? Admin reset? Support ticket? Self-service with recovery codes only?
   - _Why it matters:_ Affects support burden and security vs usability trade-offs
   - _Default assumption if unanswered:_ Recovery codes as primary method, org admin can reset as backup, support ticket for edge cases

## Nice to Have (will use reasonable defaults)

1. **Audit Log Integration: Retention and Format**
   How long should authentication audit logs be retained? Do they need to integrate with existing monitoring systems or compliance tools?
   - _Default assumption:_ 1-year retention, structured JSON logs to current logging infrastructure

2. **Recovery Code Implementation: Generation and Usage**
   How many recovery codes should be generated? One-time use or reusable? What's the regeneration process?
   - _Default assumption:_ 8 single-use recovery codes, user can regenerate new set anytime, old codes invalidated

3. **Compliance Requirements: Standards and Certifications**
   Are there specific compliance standards (SOC2, HIPAA, GDPR) that affect authentication implementation? Any required security certifications?
   - _Default assumption:_ General security best practices, no specific compliance requirements initially

## Assumptions Being Made

_These are interpretations the analysis has already made. Flag any that are wrong._

1. **JWT token enhancement** — Analysis assumes existing JWT structure can be enhanced with org context and auth method claims
2. **Backward compatibility maintained** — Analysis assumes existing email/password authentication continues alongside SSO without major changes
3. **Organization-scoped policies** — Analysis assumes authentication policies are set per organization, not globally or per-user
4. **Standard protocol compliance** — Analysis assumes SAML 2.0 and OIDC standard implementations without custom extensions
5. **Database schema extension** — Analysis assumes current user/org schema can be extended rather than requiring complete redesign
