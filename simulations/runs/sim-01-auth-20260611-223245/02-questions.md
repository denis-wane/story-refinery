# Clarifying Questions

## Critical (must answer before proceeding)

1. **Admin MFA enforcement timing and rollout**
   When you say "MFA for all admin-role users by Q3," do you mean immediate enforcement once the feature launches, or a phased rollout with advance notice? How much lead time should admins get to set up their MFA before enforcement begins?
   - _Why it matters:_ Affects whether we build grace period logic, notification systems, and determines Q3 delivery scope
   - _Default assumption if unanswered:_ Immediate enforcement on feature launch with email notification 7 days prior

2. **SSO provider failure and emergency access**
   When an organization has SSO enforced but their identity provider (Okta, Azure AD) is unavailable, what should happen? Do we need an emergency bypass mechanism for critical situations?
   - _Why it matters:_ Determines if we build temporary password reset flows, admin override capabilities, or emergency access codes
   - _Default assumption if unanswered:_ Hard enforcement with no fallback - users cannot access the application during provider outages

3. **Existing user transition to SSO-enabled organizations**
   When an organization enables SSO, how do existing users with email/password accounts get linked to their SSO identities? Email matching? Manual verification? What if emails don't match?
   - _Why it matters:_ Core user experience and data integrity concern that affects SSO adoption stories
   - _Default assumption if unanswered:_ Automatic email-based linking with email verification step required

## Important (strongly recommended)

4. **SMS provider and international requirements**
   Which SMS provider should we use for MFA codes? Do we need international SMS support? What's the expected monthly SMS volume and budget constraints?
   - _Why it matters:_ Affects vendor selection timeline, integration complexity, and operational costs
   - _Default assumption if unanswered:_ Twilio for US/Canada only, $500/month budget cap, defer international until Phase 2

5. **SSO configuration experience**
   Should enterprise customers be able to configure their SSO settings themselves (upload metadata, configure attributes) or does this require support team assistance? What's the target admin user's technical skill level?
   - _Why it matters:_ Determines if we build self-service UI vs admin tooling, affects customer onboarding velocity
   - _Default assumption if unanswered:_ Self-service UI with metadata upload and guided setup wizard

6. **Audit log retention and compliance requirements**
   How long should authentication audit logs be retained? What export formats are needed? Are there specific compliance frameworks (SOC 2, HIPAA) we need to satisfy?
   - _Why it matters:_ Affects storage architecture, retention policies, and export functionality scope
   - _Default assumption if unanswered:_ 90-day retention, CSV export only, basic SOC 2 compliance

## Nice to Have (will use reasonable defaults)

7. **Authentication error handling specifics**
   After account lockout from failed login attempts, how should password reset work for SSO-enabled organizations? Should it disable SSO temporarily or maintain enforcement?
   - _Why it matters:_ Edge case handling that affects user experience during security incidents
   - _Default assumption if unanswered:_ Password reset disabled for SSO-enforced users, admin unlock required

8. **Testing SSO integrations during development**
   How will we test SAML/OIDC integrations without access to customer identity providers? Do we need a test identity provider or sandbox environment?
   - _Why it matters:_ Development and QA process, affects timeline for integration testing
   - _Default assumption if unanswered:_ Use free tier of Auth0 and Azure AD for testing, mock SAML responses for unit tests

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **Recovery codes:** 10 single-use backup codes generated per user, user can regenerate on demand — Based on industry standard practices
2. **Rate limiting:** 5 failed attempts per IP address per 15 minutes with exponential backoff — Based on "credential stuffing incident" priority
3. **Session timeout control:** Organization-level setting only, individual users cannot override their org's policy — Based on enterprise admin control requirements
4. **OIDC/SAML flows:** Authorization Code flow for OpenID Connect, HTTP-POST binding for SAML — Based on most common enterprise configurations
