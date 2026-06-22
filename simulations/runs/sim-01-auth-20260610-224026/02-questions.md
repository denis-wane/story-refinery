# Clarifying Questions

## Critical (must answer before proceeding)

1. **SSO Migration Strategy for Existing Users**
   When an organization enables mandatory SSO, how should existing email/password users in that org be transitioned? Should they be immediately locked out until they complete SSO setup, or given a grace period to migrate?
   - _Why it matters:_ Wrong approach could lock out entire customer organizations or create security gaps
   - _Default assumption if unanswered:_ 7-day grace period where users can still use email/password but see SSO setup prompts, then mandatory cutover

2. **SSO Identity Matching Rules**
   How should incoming SSO assertions be matched to existing user accounts? By email address only, or does the SSO provider need to supply a specific unique identifier?
   - _Why it matters:_ Email-only matching risks account takeover if SSO email differs from platform email; unique ID matching risks creating duplicate accounts
   - _Default assumption if unanswered:_ Match by email address with manual admin resolution for conflicts

3. **MFA Recovery When Device Lost**
   When a user loses their MFA device and backup codes, what's the account recovery process? Admin-initiated reset, self-service with alternative verification, or support ticket?
   - _Why it matters:_ Defines support burden and security posture for locked-out users
   - _Default assumption if unanswered:_ Organization admins can reset MFA for their users; system admins handle org admin resets

4. **MFA Enrollment Timing**
   Is MFA setup required immediately at first login for users in MFA-enforced orgs, or can it be deferred with reminders?
   - _Why it matters:_ Immediate requirement could block user onboarding; deferred setup creates security gaps
   - _Default assumption if unanswered:_ Required within 7 days of first login with daily reminders, account restricted after deadline

## Important (strongly recommended)

1. **Rate Limiting Configuration**
   What are the specific rate limits for auth endpoints? Per-IP, per-user, or per-organization? What are the lockout thresholds and duration?
   - _Why it matters:_ Too strict blocks legitimate users; too loose allows continued attacks
   - _Default assumption if unanswered:_ 5 failed attempts per IP per 15-minute window, 10 attempts per user account per hour

2. **SMS Cost and Usage Limits**
   Who bears the cost of SMS MFA codes, and are there usage limits to prevent abuse? Should there be daily/monthly caps per user?
   - _Why it matters:_ Uncontrolled SMS usage could create significant operational costs
   - _Default assumption if unanswered:_ Platform absorbs SMS costs with 10 codes per user per day limit

3. **Audit Log Retention and Storage**
   How long should authentication audit logs be retained, and where should they be stored (main DB, separate service, external system)?
   - _Why it matters:_ Compliance requirements vary by industry; storage costs scale with retention
   - _Default assumption if unanswered:_ 2-year retention in separate audit database with monthly archival

4. **SSO Provider Validation Process**
   How will SAML/OIDC integrations be tested and validated before customers configure them? Staging environment, specific test scenarios, or customer-driven testing?
   - _Why it matters:_ Broken SSO configurations could lock out entire organizations
   - _Default assumption if unanswered:_ Internal test integration with Okta and Azure AD, plus customer-driven UAT in staging

## Nice to Have (will use reasonable defaults)

1. **Session Management Granularity**
   Should session timeout be configurable per user role within an organization, or just at the organization level?
   - _Why it matters:_ Role-based timeouts provide better security but add complexity
   - _Default assumption if unanswered:_ Organization-level timeout only, applied uniformly to all users

2. **Backup Code Format and Count**
   How many backup codes should be generated, in what format (numeric, alphanumeric), and should they be single-use or reusable?
   - _Why it matters:_ Affects user experience and security strength
   - _Default assumption if unanswered:_ 10 single-use 8-digit numeric codes

3. **Failed SSO Assertion Handling**
   When SSO provider returns an error or invalid assertion, should users see technical details or generic error messages?
   - _Why it matters:_ Technical details help troubleshooting but may confuse end users
   - _Default assumption if unanswered:_ Generic user message with detailed error logged for admin review

## Assumptions Being Made

_These are interpretations the analysis has already made. Flag any that are wrong._

1. **SCIM provisioning exclusion** — Assuming user provisioning/deprovisioning is handled outside this phase
2. **JWT token preservation** — Assuming existing JWT structure can be extended rather than replaced
3. **Organization-first SSO** — Assuming SSO configuration happens at organization level, not per-user
4. **PostgreSQL schema evolution** — Assuming new auth features can be added to existing database
5. **React SPA compatibility** — Assuming current frontend architecture supports SSO redirect flows
6. **Admin role MFA deadline** — Assuming Q3 MFA requirement for admins is a hard compliance deadline, not aspirational
