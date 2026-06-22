# Clarifying Questions

## Critical (must answer before proceeding)

1. **SMS Provider Selection and Budget**
   Which SMS provider should we integrate with (Twilio, AWS SNS, etc.) and what's the budget for SMS costs? Will customers pay per message or will we absorb the cost?
   - _Why it matters:_ SMS MFA implementation is completely different depending on provider choice, and cost model affects UI flows and rate limiting
   - _Default assumption if unanswered:_ Twilio integration with customer-pays model (SMS costs billed to their org)

2. **Rate Limiting Thresholds**
   What specific limits do you want for authentication attempts? (e.g., 5 failed logins per IP per 15 minutes, 10 failed logins per account per hour)
   - _Why it matters:_ Rate limiting stories need concrete numbers to implement, and wrong thresholds either block legitimate users or fail to stop attacks
   - _Default assumption if unanswered:_ 5 attempts per IP per 15 minutes, 10 attempts per account per hour, 1-hour account lockout

3. **Cross-Organization User Policy Resolution**
   When a user belongs to multiple organizations with different auth policies (one requires SSO, another allows passwords), which policy wins?
   - _Why it matters:_ This scenario will happen with consultant/contractor users and needs clear business rules built into the authentication logic
   - _Default assumption if unanswered:_ Most restrictive policy wins (if any org requires SSO, user must use SSO for all orgs)

4. **Audit Log Retention and Access**
   How long should authentication logs be retained, who can access them (org admins vs system admins), and do you need export capabilities for compliance?
   - _Why it matters:_ Affects database storage architecture, access control design, and compliance feature scope
   - _Default assumption if unanswered:_ 2-year retention, org admins see their org only, system admins see all, CSV export for both

5. **SSO Configuration Ownership**
   Who uploads SAML metadata and manages SSO certificates - organization admins through self-service UI or system admins through support tickets?
   - _Why it matters:_ Determines entire SSO configuration workflow and UI complexity
   - _Default assumption if unanswered:_ Organization admins self-service through guided UI with metadata upload and certificate management

## Important (strongly recommended)

1. **SSO Migration Strategy**
   When an organization enables SSO enforcement, do existing password users get a grace period to transition, or immediate enforcement with admin emergency bypass?
   - _Why it matters:_ Changes user communication workflow and admin tooling requirements
   - _Default assumption if unanswered:_ Immediate enforcement with 7-day advance notice, system admin emergency bypass for transition issues

2. **MFA Enforcement Timeline**
   When org admins enable MFA enforcement, how long do users have to set it up before lockout, and what communication happens?
   - _Why it matters:_ Affects user onboarding flow and support burden during rollout
   - _Default assumption if unanswered:_ 30-day grace period with email reminders at 30, 7, and 1 day before enforcement

3. **Session Timeout Behavior**
   When a session times out, hard logout or warning with grace period? How much advance notice?
   - _Why it matters:_ Affects UX design and prevents data loss during form completion
   - _Default assumption if unanswered:_ 5-minute warning with option to extend, then hard logout to login page

4. **SSO Provider Downtime Handling**
   When Okta/Azure AD is down, do SSO-enforced users see "try again later" or get temporary password fallback?
   - _Why it matters:_ Critical business continuity decision that affects reliability architecture
   - _Default assumption if unanswered:_ Fail-closed with clear error message and estimated resolution time, no password fallback

5. **Recovery Code Management**
   How many recovery codes per user, can they regenerate them at will, and do they expire?
   - _Why it matters:_ Security vs usability tradeoff that affects MFA enrollment UI and storage requirements
   - _Default assumption if unanswered:_ 10 single-use codes, user can regenerate anytime (invalidates old codes), no expiration

## Nice to Have (will use reasonable defaults)

1. **Admin Privilege Separation**
   Can system admins bypass customer MFA/SSO policies for troubleshooting, or are they bound by the same rules?
   - _Default assumption:_ System admins have emergency bypass capability with audit trail

2. **MFA Device Loss Recovery Process** 
   When users lose their phone/authenticator, is recovery purely self-service via recovery codes or can admins provide temporary bypass?
   - _Default assumption:_ Recovery codes primary method, org admins can disable MFA for 24 hours with audit trail

3. **International SMS Support**
   Do you need SMS delivery to international numbers, and are there specific country restrictions?
   - _Default assumption:_ US/Canada only initially, international support in future phase

4. **Concurrent Session Limits**
   Should users be limited to one active session, or can they be logged in from multiple devices?
   - _Default assumption:_ Unlimited concurrent sessions, new login doesn't invalidate old ones

5. **SCIM Compatibility Preparation**
   Any specific SCIM requirements to keep in mind for the current user model design?
   - _Default assumption:_ Standard SCIM 2.0 attributes, no custom attribute mapping needed

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **Immediate SSO enforcement** — Once enabled, SSO is required immediately with no password fallback for that org
2. **System admin emergency access** — System admins can temporarily bypass customer auth policies for support scenarios  
3. **Fail-closed security posture** — When external dependencies fail, users get locked out rather than degraded auth
4. **Organization-scoped audit logs** — Org admins only see authentication events for their own organization
5. **Hard session timeouts** — When timeout is reached, users are immediately logged out rather than session extension prompts
