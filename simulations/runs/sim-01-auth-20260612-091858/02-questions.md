# Clarifying Questions

## Critical (must answer before proceeding)

1. **SSO Provider Support Beyond Okta/Azure AD**
   Which additional SSO providers need to be supported in the initial release? The input mentions "Okta and Azure AD integration" but doesn't specify if others like OneLogin, PingIdentity, or Google Workspace are required.
   - _Why it matters:_ Each provider requires different integration patterns and configuration UIs, significantly affecting development scope
   - _Default assumption if unanswered:_ Support only Okta and Azure AD initially, with extensible architecture for future providers

2. **MFA Recovery Process for Lost Devices**
   What happens when a user loses their authenticator device or phone? Should organization admins be able to reset MFA, should there be a self-service recovery flow, or should it require support ticket intervention?
   - _Why it matters:_ Recovery workflow affects admin UI requirements, support processes, and user experience design
   - _Default assumption if unanswered:_ Admin-assisted reset only (org admins can disable MFA for users, forcing re-enrollment)

3. **SSO Failure Fallback Behavior**
   When an SSO provider is unavailable or returns errors, should users see a specific error message, be offered email/password fallback (if available), or be completely blocked from accessing the system?
   - _Why it matters:_ Error handling strategy affects reliability architecture and user experience during outages
   - _Default assumption if unanswered:_ Show provider-specific error message with retry option, no password fallback for SSO-enforced organizations

4. **Admin Interface Integration**
   Where should organization-level policy configuration (SSO setup, MFA enforcement, session timeouts) live? In the main application, a separate admin portal, or integrated into existing organization settings?
   - _Why it matters:_ Interface location affects navigation design, permission models, and development approach
   - _Default assumption if unanswered:_ Integrate into existing organization settings page within main application

5. **MFA Enforcement Rollout Timing**
   When organization admins enable "MFA required for all users," does enforcement happen immediately (blocking current sessions) or at next login? Is there a grace period for user enrollment?
   - _Why it matters:_ Enforcement timing affects rollout UX, admin communication needs, and technical implementation
   - _Default assumption if unanswered:_ Enforce at next login with 7-day grace period for enrollment

## Important (strongly recommended)

1. **Rate Limiting Thresholds**
   What are the specific failure thresholds and lockout periods for authentication endpoints? Should there be different limits for different auth methods (password vs SSO vs MFA)?
   - _Why it matters:_ Affects security configuration and user experience for legitimate users who make mistakes
   - _Default assumption if unanswered:_ 5 failures = 15-minute lockout for password auth, 3 failures = 5-minute lockout for MFA, no limits on SSO redirects

2. **Browser and Device Compatibility Requirements**
   What browsers, mobile devices, and accessibility standards must be supported for the new authentication flows?
   - _Why it matters:_ Affects development approach, testing scope, and user support strategy
   - _Default assumption if unanswered:_ Modern browsers only (Chrome 90+, Firefox 88+, Safari 14+), mobile responsive design, WCAG 2.1 AA compliance

3. **MFA Enrollment User Experience**
   What's the preferred enrollment flow for TOTP? QR code only, manual entry option, in-app guidance, or email instructions? Should enrollment be mandatory on first login after MFA is enabled?
   - _Why it matters:_ Affects user onboarding experience and support burden
   - _Default assumption if unanswered:_ QR code with manual entry fallback, optional setup wizard, mandatory enrollment for MFA-enforced users

4. **Session Invalidation Triggers**
   Beyond timeout, what events should immediately invalidate user sessions? Password changes, MFA policy changes, admin-initiated logout, or suspicious activity detection?
   - _Why it matters:_ Affects security posture and user experience during policy changes
   - _Default assumption if unanswered:_ Invalidate on password change, MFA policy change, and admin-initiated logout only

## Nice to Have (will use reasonable defaults)

1. **Audit Log Retention and Access**
   How long should authentication events be retained, and who besides organization admins should have read access? Does the security team need special reporting capabilities?
   - _Why it matters:_ Affects storage requirements and compliance capabilities
   - _Default assumption if unanswered:_ 90-day retention, organization admin read access only, CSV export capability

2. **SSO Configuration Ownership Model**
   Should organization admins configure SSO themselves through a self-service interface, or should it require assistance from customer success/support teams?
   - _Why it matters:_ Affects UI complexity and support process design
   - _Default assumption if unanswered:_ Self-service configuration with guided setup wizard and support fallback

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **JWT enhancement acceptable** — Current JWT token structure can be extended to include SSO assertions and MFA claims without breaking existing integrations
2. **Database schema changes approved** — New tables for SSO configurations, MFA devices, and audit logs are acceptable additions
3. **Standard TOTP implementation** — Google Authenticator-compatible TOTP (30-second intervals, 6-digit codes) is sufficient
4. **Organization-scoped policies** — All authentication policies are set per-organization, not globally or per-user
5. **Existing user migration** — Current email/password users can gradually migrate to MFA without forced enrollment
6. **Security team admin access** — Security team will have organization-level admin access for compliance monitoring
