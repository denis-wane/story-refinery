# Clarifying Questions

## Critical (must answer before proceeding)

1. **What defines "admin-role users" for the Q3 MFA requirement?**
   The security team requires MFA for all admin-role users by Q3, but the current system's role hierarchy isn't specified. Which specific permissions or role names constitute "admin" status?
   - _Why it matters:_ Determines scope of MFA enforcement rules and user identification logic
   - _Default assumption if unanswered:_ Users with organization admin permissions + any user who can modify billing/security settings

2. **How should existing password users migrate when their organization enables SSO mandate?**
   When an org admin enables "SSO required," what happens to users who currently have password-based accounts? Immediate lockout, grace period, or forced migration flow?
   - _Why it matters:_ Affects user experience design and migration story complexity
   - _Default assumption if unanswered:_ 30-day grace period where users can use either method, then password login disabled with clear migration messaging

3. **Can non-SSO users coexist in SSO-mandated organizations?**
   When SSO is required for an organization, should service accounts, API-only users, or contractor accounts still be allowed to use password authentication?
   - _Why it matters:_ Determines exception handling logic and user type classification
   - _Default assumption if unanswered:_ API-only service accounts exempt from SSO requirement; all interactive users must use SSO

4. **What's the MFA recovery process when users lose both device and recovery codes?**
   How should organization admins or support handle users who lose their TOTP device and exhaust their backup recovery codes?
   - _Why it matters:_ Defines admin override capabilities and support workflow requirements
   - _Default assumption if unanswered:_ Organization admins can reset MFA for their users; requires email confirmation to user's registered address

5. **What's the preferred SSO configuration UI approach?**
   Should organization admins configure SAML/OIDC through a self-service wizard, guided setup, or require support assistance? What level of technical complexity can we expect from typical org admins?
   - _Why it matters:_ Determines UI complexity and support story scope
   - _Default assumption if unanswered:_ Self-service wizard with copy-paste configuration (metadata XML/JSON) plus common provider presets (Okta, Azure AD, Google)

## Important (strongly recommended)

1. **What are the specific rate limiting thresholds for authentication endpoints?**
   Following the credential stuffing incident, what limits should be set for failed login attempts, both per-IP and per-account?
   - _Why it matters:_ Balances security vs. user experience for legitimate users
   - _Default assumption if unanswered:_ 5 attempts per account per 15 minutes, 20 attempts per IP per 15 minutes, 1-hour account lockout after limit exceeded

2. **Should session timeouts apply to API tokens or only web browser sessions?**
   The configurable session timeout feature needs clarity on scope — does this affect API authentication tokens or just web session cookies?
   - _Why it matters:_ Determines technical implementation and API client impact
   - _Default assumption if unanswered:_ Web sessions only; API tokens have separate, longer-lived refresh cycles

3. **What SMS provider should be integrated for MFA codes?**
   Which SMS service should handle MFA code delivery, considering reliability, global coverage, and cost?
   - _Why it matters:_ Affects third-party integration complexity and ongoing operational costs
   - _Default assumption if unanswered:_ Twilio with AWS SNS as failover; supports international delivery

## Nice to Have (will use reasonable defaults)

1. **How many MFA recovery codes should be generated and how should they expire?**
   What's the optimal number of backup codes, should they be single-use, and when should users be prompted to regenerate them?
   - _Why it matters:_ Affects security vs. usability balance for recovery scenarios
   - _Default assumption if unanswered:_ 10 single-use codes, prompt to regenerate when 3 remain

2. **Should audit logs integrate with existing security monitoring tools?**
   Does the platform already use SIEM or security monitoring systems that should receive authentication events in real-time?
   - _Why it matters:_ Determines log format and integration requirements beyond basic storage
   - _Default assumption if unanswered:_ Store in application database with JSON export capability for future SIEM integration

## Assumptions Being Made

_These are interpretations the analysis has already made. Flag any that are wrong._

1. **SAML 2.0 and OIDC are sufficient SSO protocols** — Based on "Okta and Azure AD integration" stakeholder request, but doesn't explicitly rule out other protocols
2. **MFA enforcement is binary per-organization** — Analysis assumes org-wide "all users" or "optional per-user" without considering role-based enforcement levels
3. **Current JWT/cookie architecture can accommodate SSO tokens** — Assumes existing session management compatible with SSO assertion handling
4. **SMS MFA is equally important to TOTP** — Both mentioned as requirements but TOTP typically preferred for enterprise security
5. **Rate limiting is primarily about authentication endpoints** — Could also apply to MFA verification, password reset, or other auth-adjacent endpoints
