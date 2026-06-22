# Clarifying Questions

## Critical (must answer before proceeding)

1. **Admin role definition for Q3 MFA mandate**
   For the "Security team requires MFA for all admin-role users by Q3" requirement, which specific roles qualify as "admin"? Does this include Organization Admins only, or also System Admins, or users with specific permissions?
   - _Why it matters:_ Changes scope of enforcement logic and rollout timeline
   - _Default assumption if unanswered:_ Organization Admins and System Admins (as defined in analysis) are subject to MFA mandate

2. **SSO transition workflow for existing users**
   When an organization enables SSO, how do existing users with email/password accounts transition? Must they re-authenticate immediately, or can they continue using passwords until their next natural login?
   - _Why it matters:_ Affects user experience and potential support burden during rollout
   - _Default assumption if unanswered:_ Users must re-authenticate via SSO on their next login attempt after SSO is enabled

3. **Cross-organization user policy precedence**
   How should the system handle users who belong to multiple organizations with different authentication policies (e.g., one requires MFA, another doesn't)?
   - _Why it matters:_ Could require significant architecture changes to support policy inheritance
   - _Default assumption if unanswered:_ Most restrictive policy across all user's organizations takes precedence

4. **SSO provider failure fallback strategy**
   When an organization's SSO provider is unavailable, should users be blocked completely, or fall back to email/password authentication?
   - _Why it matters:_ Determines system availability guarantees and implementation complexity
   - _Default assumption if unanswered:_ Complete lockout when SSO provider fails (no password fallback for SSO-enabled orgs)

5. **Rate limiting lockout impact on SSO**
   Should rate limiting apply to SSO authentication attempts, or only email/password? If SSO attempts are limited, how does this interact with identity provider redirects?
   - _Why it matters:_ Could accidentally block legitimate SSO flows or create security gaps
   - _Default assumption if unanswered:_ Rate limiting applies to all authentication endpoints equally

## Important (strongly recommended)

1. **Rate limiting threshold specifics**
   What are the exact failed attempt limits and lockout durations? The analysis suggests 5 attempts in 15 minutes = 1-hour lockout, but what granularity (per-IP, per-user, both)?
   - _Why it matters:_ Balances security vs usability, affects database design
   - _Default assumption if unanswered:_ 5 failed attempts per user OR per IP (whichever is lower) in 15 minutes = 1-hour lockout

2. **SMS provider and cost management**
   Which SMS service should be integrated (Twilio, AWS SNS, etc.), and are there monthly cost limits or per-message caps to implement?
   - _Why it matters:_ Affects integration complexity and operational costs
   - _Default assumption if unanswered:_ Twilio integration with $500/month org-level SMS budget cap

3. **Session timeout warning behavior**
   When a session approaches timeout, should users get a warning prompt to extend, or silent logout?
   - _Why it matters:_ Affects user experience and frontend implementation
   - _Default assumption if unanswered:_ 5-minute warning modal with option to extend session

4. **MFA backup codes specification**
   How many recovery codes per user, single-use or reusable, and when do they regenerate?
   - _Why it matters:_ Affects user experience during account recovery scenarios
   - _Default assumption if unanswered:_ 10 single-use codes, auto-regenerate when fewer than 3 remain

5. **Audit log retention and access**
   How long should authentication events be retained, and who can access them besides the Security Team?
   - _Why it matters:_ Affects storage costs and compliance requirements
   - _Default assumption if unanswered:_ 1-year retention, accessible by Security Team and Organization Admins (for their org only)

## Nice to Have (will use reasonable defaults)

1. **SCIM provisioning timeline expectations**
   While SCIM is noted as "future phase," do any current enterprise customers expect it within 6 months of SSO launch?
   - _Default assumption:_ No SCIM timeline commitments, will be separate initiative

2. **Performance requirements for auth flows**
   Are there specific latency targets for SSO vs MFA flows (e.g., under 2 seconds for SSO redirect)?
   - _Default assumption:_ Standard web performance targets (< 2s for auth flows)

3. **Identity provider priority order**
   Beyond Okta and Azure AD, are there other identity providers (Google Workspace, OneLogin) that should be prioritized?
   - _Default assumption:_ Focus on Okta and Azure AD initially, generic SAML/OIDC for others

## Assumptions Being Made

_These are interpretations the analysis has already made. Flag any that are wrong._

1. **Backward compatibility is absolute** — All existing email/password users can continue using that method indefinitely unless their organization specifically enables SSO — _Based on "must continue to work alongside SSO"_

2. **MFA is user-initiated by default** — Individual users can enable MFA voluntarily before any organization-level enforcement — _Based on "optional per-user by default"_

3. **Organization admins control SSO config** — Not individual users or system admins — _Based on "Enterprise customers can configure SSO for their organization"_

4. **Audit logging is comprehensive** — All authentication events are logged, not just successful logins — _Based on "Audit log all authentication events"_

5. **TOTP and SMS are equally supported** — No preference between authenticator apps vs SMS codes — _Based on requirement listing both methods equally_
