# Clarifying Questions

## Critical (must answer before proceeding)

1. **SSO Provider Downtime Strategy**
   When a configured SSO provider (Okta, Azure AD) is unavailable or returning errors, what should happen to users in SSO-enforced organizations? Should there be an emergency admin bypass, temporary password fallback, or should the organization be completely locked out?
   - _Why it matters:_ This determines whether we need emergency bypass flows, fallback authentication stories, and admin override capabilities
   - _Default assumption if unanswered:_ Hard lockout with no bypass (users cannot log in until SSO provider is restored)

2. **Audit Log Retention and Access Requirements**
   How long must authentication audit logs be retained, and who needs access to them? Are there specific compliance requirements (SOX, GDPR, HIPAA) that dictate log structure, retention periods, or access controls?
   - _Why it matters:_ Affects database design, storage costs, admin interface scope, and compliance reporting features
   - _Default assumption if unanswered:_ 90-day retention, accessible only to system admins, stored in application database

3. **SMS Provider and Cost Model**
   Which SMS service provider should be integrated, what's the expected cost model (pay-per-message vs pre-paid credits), and are there geographical restrictions or requirements for international SMS delivery?
   - _Why it matters:_ Determines integration complexity, cost management features, and whether SMS MFA is globally available
   - _Default assumption if unanswered:_ Twilio integration, pay-per-message billing passed to customers, US/Canada only initially

## Important (strongly recommended)

1. **MFA Recovery Code User Experience**
   When users generate backup recovery codes, how should the setup flow work? Should codes be downloadable, printable, or displayed once? How many codes should be generated, and what happens when they run out?
   - _Why it matters:_ Affects MFA enrollment user experience and recovery flow design
   - _Default assumption if unanswered:_ 10 single-use codes, displayed once during setup, user responsible for saving them

2. **Rate Limiting Lockout Bypass**
   When users hit rate limits (5 failed login attempts), should organization admins or system admins be able to unlock accounts immediately, or must users wait the full lockout period?
   - _Why it matters:_ Determines admin interface requirements and support escalation procedures  
   - _Default assumption if unanswered:_ Organization admins can unlock users in their org, system admins can unlock any user

3. **SSO Configuration Admin Interface**
   What level of SSO configuration should organization admins handle themselves vs requiring support tickets? Should they upload SAML metadata files, enter OIDC endpoints manually, or use pre-configured templates for common providers?
   - _Why it matters:_ Affects self-service capabilities and admin interface complexity
   - _Default assumption if unanswered:_ Basic provider selection (Okta, Azure AD, custom SAML) with guided setup wizard, metadata file upload for custom providers

4. **Session Timeout Inheritance and Overrides**
   When organization admins set session timeouts, can individual users choose shorter timeouts for their own accounts? Should there be different timeout rules for different user roles (admins vs regular users)?
   - _Why it matters:_ Affects session management complexity and user preference features
   - _Default assumption if unanswered:_ Organization setting is maximum, users can choose shorter, no role-based differentiation

5. **Existing User Migration Timeline**
   Should existing users be prompted to enable MFA immediately, gradually over time, or only when their organization admin enforces it? How should we communicate the new authentication options?
   - _Why it matters:_ Determines rollout strategy, user communication plan, and migration user experience
   - _Default assumption if unanswered:_ Opt-in MFA promotion on login, SSO enforcement only when org admin enables it, in-app notifications for new features

## Nice to Have (will use reasonable defaults)

1. **TOTP Time Synchronization Tolerance**
   How forgiving should TOTP validation be for users with slightly out-of-sync device clocks? Should we accept codes from the previous/next 30-second window?
   - _Why it matters:_ Affects user experience vs security trade-offs
   - _Default assumption if unanswered:_ ±1 time step tolerance (90-second window total)

2. **Failed Authentication Error Messages**
   How specific should error messages be for different failure scenarios (wrong password vs account locked vs SSO error vs MFA failure)? Should we be vague for security or helpful for user experience?
   - _Why it matters:_ Affects user experience and security posture
   - _Default assumption if unanswered:_ Generic "authentication failed" messages to users, detailed errors logged for admins

3. **Performance Benchmarks for New Auth Flows**
   What are the acceptable latency targets for SSO login flows and MFA challenges compared to current email/password authentication?
   - _Why it matters:_ Determines caching strategy and performance optimization requirements
   - _Default assumption if unanswered:_ SSO login should complete within 3 seconds, MFA validation within 1 second

## Assumptions Being Made

_These are interpretations the analysis has already made. Flag any that are wrong._

1. **MFA is optional by default** — Users can choose to enable MFA unless their organization enforces it
2. **SSO enforcement is all-or-nothing** — When org admin enables SSO, ALL users in that org must use SSO (no mixed authentication)
3. **Current JWT token structure** — Existing JWT implementation can be extended to include SSO claims and MFA status
4. **SCIM provisioning exclusion** — User provisioning/deprovisioning is explicitly out of scope for this phase
5. **Admin role MFA deadline** — Q3 security team requirement applies to users with admin roles in any organization
6. **Organization isolation** — SSO and MFA policies are configured per organization with no cross-org inheritance
