# Clarifying Questions

## Critical (must answer before proceeding)

1. **SSO Provider Configuration Process**
   When an enterprise customer wants to set up SSO (SAML/OIDC), do organization admins configure this themselves through a self-service UI, or do they contact support to have platform admins configure it for them?
   - _Why it matters:_ Self-service requires building provider configuration UI, certificate upload, metadata exchange flows. Admin-assisted means simpler UI but higher support overhead and slower customer onboarding.
   - _Default assumption if unanswered:_ Admin-assisted setup with support ticket workflow (simpler to build, delays self-service roadmap)

2. **Admin Role Definition for MFA Requirement**
   What specifically defines "admin-role users" who must have MFA enabled by Q3? Organization admins only, or does this include system admins, billing admins, or other permission levels?
   - _Why it matters:_ Affects scope of admin MFA enforcement story and compliance tracking requirements.
   - _Default assumption if unanswered:_ Organization admins only (users who can manage SSO/auth policies for their org)

3. **User-Organization Association Model**
   How are users currently associated with organizations, and can users belong to multiple organizations? This affects the data model for SSO enforcement and future SCIM compatibility.
   - _Why it matters:_ Multi-org users complicate SSO enforcement logic and session management. Single-org model is simpler but may not match enterprise reality.
   - _Default assumption if unanswered:_ Single organization per user with migration path for multi-org support later

4. **Existing User Migration to SSO**
   When an organization enables SSO enforcement, how do existing users with email/password accounts transition? Forced migration at next login, grace period, or admin-driven process?
   - _Why it matters:_ Missing user migration stories entirely. Could impact user experience and adoption if not handled smoothly.
   - _Default assumption if unanswered:_ Forced migration at next login with email notification to affected users

## Important (strongly recommended)

1. **MFA Device Recovery Procedures**
   When users lose access to their MFA device (lost phone, broken authenticator), what's the recovery process? Can organization admins override MFA requirements, and what verification is required?
   - _Why it matters:_ Incomplete MFA recovery stories could leave users permanently locked out without clear escalation path.
   - _Default assumption if unanswered:_ Organization admins can disable MFA for specific users after email verification

2. **SSO Provider Unavailability Fallback**
   When an organization's SSO provider is down or unreachable, can users still access the platform? Emergency access procedures for critical situations?
   - _Why it matters:_ Error handling and business continuity stories need to define acceptable fallback mechanisms.
   - _Default assumption if unanswered:_ No fallback for SSO-enforced organizations (users must wait for provider recovery)

3. **Rate Limiting Implementation Details**
   What are the specific rate limits for authentication endpoints? Attempts per minute, lockout duration, IP-based vs user-based, and escalation policies for repeated violations?
   - _Why it matters:_ Rate limiting stories need concrete thresholds to implement and test effectively.
   - _Default assumption if unanswered:_ 5 attempts per 5 minutes per IP address, 15-minute lockout, exponential backoff for repeat offenses

4. **Recovery Code Management Flow**
   How are backup recovery codes generated, displayed to users, stored securely, and used? One-time use or reusable? How many codes per user?
   - _Why it matters:_ MFA enrollment and recovery stories are incomplete without clear backup code workflow.
   - _Default assumption if unanswered:_ 10 single-use codes, generated during MFA setup, displayed once with download option

## Nice to Have (will use reasonable defaults)

1. **SMS Provider Selection**
   Which SMS service should be integrated for MFA (Twilio, AWS SNS, other)? International support requirements and cost considerations?
   - _Why it matters:_ Affects integration complexity and operational costs.
   - _Default assumption if unanswered:_ Twilio for US/Canada initially, international expansion later

2. **MFA Enrollment User Experience**
   What's the preferred flow for MFA setup? Mandatory during first login after org enforcement, optional self-service, or admin-initiated?
   - _Why it matters:_ Affects user adoption and support burden.
   - _Default assumption if unanswered:_ Self-service enrollment with org-wide prompts when enforcement is enabled

3. **Session Timeout Inheritance**
   For SSO users, should platform session timeouts inherit from the identity provider session or use organization-configured platform settings?
   - _Why it matters:_ Affects session management complexity and user experience consistency.
   - _Default assumption if unanswered:_ Platform settings override provider sessions for consistent experience

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **Manual user-organization assignment** — Current system requires manual association of users to organizations, with data model designed to be SCIM-compatible for future automated provisioning
2. **Platform session control** — Organization-configured session timeouts will override any SSO provider session settings for consistent policy enforcement
3. **Email/password fallback preservation** — Organizations without SSO enforcement will continue to allow email/password authentication alongside any configured SSO options
