# Clarifying Questions

## Critical (must answer before proceeding)

1. **SSO Configuration Process**
   When an organization admin wants to configure SSO, will they use a self-service portal in the application, or will they submit a support ticket for assisted setup? This includes uploading SAML certificates, configuring assertion mappings, and testing the integration.
   - _Why it matters:_ Determines whether we need to build configuration UI, validation flows, and certificate management tools, or just internal admin tooling.
   - _Default assumption if unanswered:_ Self-service configuration portal with guided setup wizard and certificate upload.

2. **SMS MFA Scope and Cost Model**
   Should SMS MFA support international phone numbers? Who pays for SMS costs (company absorbs, per-org billing, user pays)? How should delivery failures be handled (retry logic, fallback methods)?
   - _Why it matters:_ Affects SMS service provider selection, billing integration, and error handling complexity.
   - _Default assumption if unanswered:_ US/Canada only, company absorbs SMS costs, failed SMS shows error with retry option.

3. **Emergency Access When SSO Fails**
   When an organization's SSO provider is down or misconfigured, how should users access the application? Should there be a super-admin bypass, temporary password reset, or complete lockout until SSO is restored?
   - _Why it matters:_ Critical for business continuity and affects the SSO enforcement architecture.
   - _Default assumption if unanswered:_ Super-admin accounts can temporarily disable SSO enforcement for an organization during outages.

4. **User Migration to SSO**
   When an organization enables SSO, what happens to existing users' password-based accounts? Should passwords be immediately disabled, preserved as backup, or phased out over time?
   - _Why it matters:_ Determines migration workflow, communication plan, and data retention strategy.
   - _Default assumption if unanswered:_ Existing users keep password access until their first successful SSO login, then passwords are disabled.

## Important (strongly recommended)

1. **Audit Log Retention and Access**
   How long should authentication audit logs be retained? Who can access them (organization admins, security team only, compliance exports)? Are there specific compliance requirements (SOC 2, GDPR data retention)?
   - _Why it matters:_ Affects storage strategy, access controls, and data governance implementation.
   - _Default assumption if unanswered:_ 2-year retention, accessible to organization admins and internal security team, with CSV export capability.

2. **Recovery Code Implementation**
   When users enable MFA, how many backup recovery codes should be generated? Are they single-use? How should they be delivered (displayed on screen, downloadable PDF, email)?
   - _Why it matters:_ Affects MFA setup UX and recovery code storage/security design.
   - _Default assumption if unanswered:_ 10 single-use alphanumeric codes displayed on screen with downloadable PDF option.

3. **Rate Limiting Behavior**
   What specific rate limits should apply to authentication endpoints (login attempts per minute, per IP, per user)? How should violations be handled (progressive delays, temporary blocks, CAPTCHA challenges)?
   - _Why it matters:_ Determines rate limiting algorithm and user experience during legitimate high-frequency access.
   - _Default assumption if unanswered:_ 5 attempts per minute per IP, progressive delays (1s, 5s, 15s), 15-minute block after 10 attempts.

4. **Session Timeout Granularity**
   When organization admins configure session timeouts, does this apply to all users in the organization uniformly, or can individual users within the org have different timeout preferences?
   - _Why it matters:_ Affects session management complexity and admin UI design.
   - _Default assumption if unanswered:_ Organization-wide setting that applies uniformly to all users in that organization.

## Nice to Have (will use reasonable defaults)

1. **Provider-Specific Integration Features**
   Beyond standard SAML/OIDC protocols, are there specific Okta or Azure AD features customers need (group mappings, conditional access integration, specific claim transformations)?
   - _Why it matters:_ May require provider-specific code beyond standard protocol implementation.
   - _Default assumption if unanswered:_ Standard SAML 2.0 and OIDC implementation with basic claim mapping.

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **SCIM Compatibility** — Current user schema is assumed compatible with future SCIM provisioning requirements
2. **Admin MFA Enforcement** — System admin users will be required to enable MFA by Q3, separate from organization-level enforcement policies  
3. **JWT Token Enhancement** — Existing JWT token system can be extended to handle variable session timeouts per organization
4. **Parallel Authentication** — Email/password and SSO will coexist, with SSO taking precedence when configured for an organization
5. **TOTP App Support** — Standard TOTP implementation will work with Google Authenticator, Authy, and similar RFC 6238 compliant apps
6. **Credential Stuffing Prevention** — Rate limiting implementation will be sufficient to address the previous credential stuffing incident without additional CAPTCHA or device fingerprinting
