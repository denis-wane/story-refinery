# Clarifying Questions

## Critical (must answer before proceeding)

1. **SSO configuration workflow and approval process**
   When an organization wants to enable SSO, should organization admins be able to self-configure through the UI, or does this require system admin assistance/approval? This affects whether we build a self-service configuration interface or a request-based workflow.
   - _Why it matters:_ Changes the entire UI design and administrative workflow for SSO onboarding
   - _Default assumption if unanswered:_ Organization admins can self-configure SSO with immediate activation (no approval workflow)

2. **User account migration when SSO is enabled**
   When an organization enables SSO enforcement, how should existing users with email/password accounts transition? Should we automatically link accounts by matching email addresses, require manual account claiming, or use a different approach?
   - _Why it matters:_ Determines user migration stories and potential data loss/security risks
   - _Default assumption if unanswered:_ Automatic account linking by email address with email confirmation required

3. **SSO protocol implementation priority**
   Should we implement both SAML 2.0 and OpenID Connect in the first release, or start with one protocol? The requirements mention both but don't specify priority.
   - _Why it matters:_ Affects development timeline and whether we need two separate integration stories
   - _Default assumption if unanswered:_ Start with SAML 2.0 only, add OIDC in a subsequent release

4. **SMS provider selection and ownership**
   Which SMS service provider should we integrate with, and who owns the relationship/billing (us or the customer)? This affects integration complexity and cost model.
   - _Why it matters:_ Different providers have different APIs, pricing models, and reliability characteristics
   - _Default assumption if unanswered:_ Twilio integration with company-paid SMS costs (not passed to customers)

5. **Rate limiting specifications for credential attacks**
   What specific rate limits should we implement per endpoint? The analysis mentions this is a priority after the recent credential stuffing incident.
   - _Why it matters:_ Affects security story scope and potential impact on legitimate users
   - _Default assumption if unanswered:_ 5 failed login attempts per IP per minute, 10 failed attempts per user account per hour

## Important (strongly recommended)

1. **MFA enforcement timeline for admin users**
   The security team requires MFA for all admin-role users by Q3. Should this be enforced immediately upon deployment, or is there a grace period for existing admin users to set up MFA?
   - _Why it matters:_ Affects rollout strategy and potential admin user lockout risks
   - _Default assumption if unanswered:_ 30-day grace period after deployment for existing admin users to enable MFA

2. **Audit log retention and access controls**
   How long should authentication audit logs be retained, and who can access organization-level vs system-level audit data?
   - _Why it matters:_ Affects database storage requirements and admin UI permissions design
   - _Default assumption if unanswered:_ 2-year retention, org admins see their organization's logs only, system admins see all

3. **Recovery code specifications**
   How many backup recovery codes should users get, in what format, and how often can they regenerate them?
   - _Why it matters:_ Affects MFA user experience and security posture
   - _Default assumption if unanswered:_ 10 single-use alphanumeric codes, user can regenerate anytime (invalidates old set)

4. **Billing implications for SSO/MFA features**
   Do SSO and MFA capabilities affect pricing tiers or incur usage-based charges? This could influence feature availability and configuration.
   - _Why it matters:_ May require pricing tier checks and feature gating in the implementation
   - _Default assumption if unanswered:_ No pricing tier changes, features available to all existing customers

## Nice to Have (will use reasonable defaults)

1. **International SMS coverage requirements**
   Which countries/regions must SMS MFA support? Full global coverage or specific markets only?
   - _Why it matters:_ Affects SMS provider selection and may influence user experience for global customers
   - _Default assumption if unanswered:_ Support for US, Canada, EU, and major English-speaking markets initially

2. **Error message specificity for failed authentication**
   How detailed should error messages be for SSO failures, MFA setup issues, and rate limiting? Balance between user helpfulness and security information disclosure.
   - _Why it matters:_ Affects user experience quality and potential security information leakage
   - _Default assumption if unanswered:_ Generic error messages with detailed logging for admin troubleshooting

3. **Session management during SSO transition**
   When an organization enables SSO enforcement, what happens to users with active email/password sessions? Immediate logout or grace period?
   - _Why it matters:_ Affects user experience during SSO rollout
   - _Default assumption if unanswered:_ Allow existing sessions to complete naturally, enforce SSO on next login

## Assumptions Being Made

_These are interpretations the analysis has already made. Flag any that are wrong._

1. **Both TOTP and SMS MFA will be implemented simultaneously** — Based on requirements mentioning both methods, but this could be phased
2. **Organization-level SSO configuration rather than system-wide** — Assumption that each organization configures their own SSO settings independently  
3. **JWT token architecture will remain unchanged** — Current httpOnly cookie approach continues with additional auth flows layered on top
4. **SCIM provisioning is definitely out of scope for this phase** — Requirements explicitly defer this, but SSO design should accommodate future SCIM integration
5. **Rate limiting will be implemented at the application level** — Rather than relying on infrastructure/CDN-level protection
6. **Okta and Azure AD are the priority SSO providers** — Based on stakeholder notes, though solution should support other SAML/OIDC providers
