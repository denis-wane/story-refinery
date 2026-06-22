# Clarifying Questions

## Critical (must answer before proceeding)

1. **Which specific user roles require MFA by Q3?**
   You mentioned "admin-role users" must use MFA by Q3 for security compliance. Which exact roles/permissions in your system qualify as "admin-role"? (e.g., organization admins, system admins, billing admins, support agents with elevated access?)
   - _Why it matters:_ Determines scope of forced MFA rollout and compliance timeline
   - _Default assumption if unanswered:_ Will assume organization admins + system admins only

2. **How is your organization data currently structured?**
   How do you identify and scope organizations today? Is it a simple org_id foreign key, or do you have hierarchical organizations, sub-tenants, or shared users across orgs?
   - _Why it matters:_ SSO configuration and enforcement happens at organization level — need to understand the boundary
   - _Default assumption if unanswered:_ Will assume flat org structure with simple org_id mapping

3. **What are your specific rate limiting requirements?**
   Given the credential stuffing incident, what rate limits do you want on authentication endpoints? (attempts per IP, per user account, time windows, lockout duration)
   - _Why it matters:_ Core security control that affects authentication flow design
   - _Default assumption if unanswered:_ Will implement 5 attempts per user per 15 minutes, 20 attempts per IP per hour, with exponential backoff

4. **How should SSO enforcement technically work?**
   When SSO is enabled for an organization, how do you want to disable password auth? Database flag check, middleware interception, UI-only hiding, or something else?
   - _Why it matters:_ Determines security model and backward compatibility approach
   - _Default assumption if unanswered:_ Will use database flag with middleware enforcement, allowing password auth bypass only for emergency recovery

5. **What emergency access is needed when MFA/SSO fails?**
   When users are locked out (lost MFA device, SSO provider down, expired recovery codes), what's the approved recovery process? Support ticket workflow, emergency bypass codes, admin override?
   - _Why it matters:_ Business continuity vs security trade-off that affects system design
   - _Default assumption if unanswered:_ Will implement support-initiated temporary bypass with audit trail

## Important (strongly recommended)

1. **Which SMS provider should we integrate with?**
   Any preference for SMS vendor (Twilio, AWS SNS, etc.)? Do you need international SMS support, and what's the expected volume/cost tolerance?
   - _Why it matters:_ Affects cost model and international user experience
   - _Default assumption if unanswered:_ Will use Twilio with US/Canada support initially

2. **How should recovery codes be managed?**
   How many backup codes per user, what format (length, character set), and how should users download/view them? One-time display vs re-downloadable?
   - _Why it matters:_ User experience and security balance for account recovery
   - _Default assumption if unanswered:_ Will generate 8 single-use codes, secure one-time display with download option

3. **Who manages SSO IdP configuration?**
   Should organization admins self-configure SAML metadata upload, or does this go through your support team? What's the onboarding process?
   - _Why it matters:_ Determines UI complexity and support overhead
   - _Default assumption if unanswered:_ Will build self-service UI for org admins with support fallback

4. **What triggers session revocation?**
   Besides logout, what should invalidate existing sessions? Password changes, MFA policy changes, SSO config updates, admin action?
   - _Why it matters:_ Security model for policy enforcement and incident response
   - _Default assumption if unanswered:_ Will revoke on password change, MFA policy enforcement, and admin-triggered revocation

5. **How should SSO provider outages be handled?**
   When customer's IdP is unavailable, should there be an emergency password bypass, temporary lockout, or redirect to error page?
   - _Why it matters:_ Business continuity vs maintaining SSO security model
   - _Default assumption if unanswered:_ Will show error page with support contact, no automatic password bypass

## Nice to Have (will use reasonable defaults)

1. **Any specific SAML IdP compatibility requirements beyond Okta/Azure AD?**
   Other identity providers you need to support immediately, or should we focus on the two mentioned?
   - _Default assumption:_ Will test with Okta and Azure AD, design for SAML 2.0 standard compliance

2. **Preferred audit log retention and export format?**
   How long should authentication events be stored, and do you need specific export formats for compliance?
   - _Default assumption:_ Will retain for 2 years with JSON export capability

3. **Session timeout granularity preferences?**
   Should timeout be configurable in hours/days, or do you need minute-level precision?
   - _Default assumption:_ Will use hour-level granularity (1h, 2h, 4h, 8h, 12h, 24h options)

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **SSO is organization-scoped** — Assuming each organization can independently configure their SSO provider, not shared across orgs
2. **MFA is user-optional by default** — Assuming individual users can opt into MFA unless their organization enforces it
3. **Backward compatibility required** — Assuming existing password users must continue working without disruption during rollout
4. **JWT token structure can be modified** — Assuming current JWT implementation can accommodate additional claims for SSO/MFA status
5. **Organization admins exist as a role** — Assuming your system already has organization-level admin users who can configure policies
