# Clarifying Questions

## Critical (must answer before proceeding)

1. **Admin-role user definition for mandatory MFA**
   The security team requires MFA for all "admin-role users" by Q3, but what constitutes an admin-role user? Is this based on specific roles (like "Organization Admin"), permission levels, or access to sensitive features?
   - _Why it matters:_ Determines scope of mandatory MFA implementation and compliance timeline
   - _Default assumption if unanswered:_ Will apply MFA requirement to users with "Organization Admin" role only

2. **SSO provider outage fallback strategy**
   When an organization's SSO provider is down (Okta, Azure AD unavailable), can their users still access the application? Do organization admins get emergency bypass access?
   - _Why it matters:_ Affects SSO architecture design and determines if we need emergency auth flows
   - _Default assumption if unanswered:_ No fallback access during SSO outages (organization is locked out until provider recovers)

3. **Dual account conflict resolution**
   What happens if a user already has an email/password account and their organization later enables SSO with the same email address? Should accounts be automatically linked, require manual merge, or create separate identities?
   - _Why it matters:_ Affects user data integrity and migration complexity for existing organizations
   - _Default assumption if unanswered:_ Manual account linking required, initiated by user on first SSO login

4. **Active session handling during SSO migration**
   When an organization switches from email/password to SSO-only, what happens to users who are currently logged in with password-based sessions? Immediate logout or graceful transition period?
   - _Why it matters:_ Determines user experience during SSO rollout and technical complexity
   - _Default assumption if unanswered:_ Immediate logout of all password-based sessions when SSO-only is enabled

5. **Rate limiting scope and thresholds**
   Which specific endpoints need rate limiting (login, MFA verify, SSO callback), and what are the acceptable thresholds? Per-IP, per-user, or both? What happens when limits are hit?
   - _Why it matters:_ Core requirement after credential stuffing incident, affects API design
   - _Default assumption if unanswered:_ 5 attempts per IP per minute on auth endpoints, 429 response with exponential backoff

## Important (strongly recommended)

1. **User provisioning before SCIM**
   Before SCIM support is added, how do new users get created in SSO-enabled organizations? Admin invitation only, or can users self-register and get auto-assigned to their organization?
   - _Why it matters:_ Affects onboarding flow complexity and admin workload
   - _Default assumption if unanswered:_ Admin invitation required; no self-service registration for SSO organizations

2. **MFA recovery code specifications**
   How many recovery codes should be generated, when are they created (MFA setup vs on-demand), and do they expire? Can users regenerate them?
   - _Why it matters:_ Affects user experience and support burden for locked-out users
   - _Default assumption if unanswered:_ 10 single-use codes generated at MFA setup, no expiration, user can regenerate anytime

3. **Session timeout vs SSO provider sessions**
   Should our application session timeout be independent of the SSO provider's session, or synchronized? If a user's SSO session expires, should they be logged out of our app immediately?
   - _Why it matters:_ Affects SSO token refresh complexity and user experience
   - _Default assumption if unanswered:_ Independent session management; SSO expiration doesn't immediately log out of our app

4. **MFA method discovery and setup**
   How do users learn about MFA options and configure them? Self-service UI in account settings, admin-initiated setup, or both? Any guided onboarding flow?
   - _Why it matters:_ Affects user adoption and support requirements
   - _Default assumption if unanswered:_ Self-service setup via account settings with basic setup instructions

5. **Ultimate backup authentication**
   If a user loses their phone/authenticator AND all recovery codes, what's the recovery process? Admin reset only, or alternative verification methods?
   - _Why it matters:_ Affects support team workload and user lockout scenarios
   - _Default assumption if unanswered:_ Organization admin can reset user's MFA after identity verification

## Nice to Have (will use reasonable defaults)

1. **SMS MFA provider selection**
   Any preference for SMS delivery service (Twilio, AWS SNS) or specific requirements for international delivery?
   - _Why it matters:_ Affects vendor evaluation and international user support
   - _Default assumption if unanswered:_ Will use Twilio for SMS delivery

2. **Audit log retention period**
   How long should authentication events be stored in the audit log? Any compliance requirements driving retention policy?
   - _Why it matters:_ Affects storage planning and compliance posture
   - _Default assumption if unanswered:_ 2 years retention for all authentication events

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **SSO is organization-level** — All users in an organization use the same SSO provider (no mixed auth methods within orgs)
2. **JWT tokens remain the session mechanism** — Continuing with httpOnly cookies containing JWT, just adding SSO claims
3. **PostgreSQL schema changes are acceptable** — New tables for MFA secrets, policies, and audit logs are fine
4. **External SMS dependency is acceptable** — Organization is comfortable with third-party SMS service for MFA
5. **TOTP shared secrets will be encrypted at rest** — Database encryption for sensitive MFA data
6. **Phase-based rollout is preferred** — MFA foundation first, then SSO, rather than building everything simultaneously
