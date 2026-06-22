# Clarifying Questions

## Critical (must answer before proceeding)

1. **Admin Role Definition**
   Which specific user roles or permissions constitute "admin-role users" that must have MFA enabled by Q3? Does this include organization admins only, or also system administrators, billing contacts, or users with specific permissions?
   - _Why it matters:_ Affects the scope of mandatory MFA rollout and compliance measurement for Q3 deadline
   - _Default assumption if unanswered:_ Organization admins and system administrators only (exclude billing/support contacts)

2. **SSO Failure Emergency Access**
   When an organization has SSO-enforced (no password fallback) and their identity provider is down, how should users access the application? Should there be an emergency bypass procedure?
   - _Why it matters:_ Determines business continuity architecture and potential customer lockout scenarios
   - _Default assumption if unanswered:_ No emergency access - organizations accept downtime risk when enforcing SSO

3. **Existing User Migration Strategy**
   How do current email/password users transition when their organization enables SSO? Are they forced to link accounts immediately, or can they continue with passwords until next login?
   - _Why it matters:_ Affects user experience, support burden, and rollout complexity for enterprise customers
   - _Default assumption if unanswered:_ Users continue with existing auth until next login, then guided through account linking

4. **Rate Limiting Thresholds**
   What are the specific rate limits for authentication endpoints (attempts per IP, time windows, lockout duration)? Should limits differ between login, MFA, and SSO endpoints?
   - _Why it matters:_ Critical for preventing credential stuffing - too loose is ineffective, too strict blocks legitimate users
   - _Default assumption if unanswered:_ 5 attempts per IP per 15 minutes with exponential backoff, same limits across all auth endpoints

## Important (strongly recommended)

1. **SMS Provider and International Support**
   Which SMS provider should be used for MFA codes, and do you need international SMS support beyond the US? Any restrictions on SMS costs or delivery regions?
   - _Why it matters:_ Affects reliability, cost structure, and global customer accessibility
   - _Default assumption if unanswered:_ Twilio for US/Canada only, international support deferred to future phase

2. **Recovery Code Presentation**
   When should backup recovery codes be presented to users - immediately during MFA setup, after first successful challenge, or on-demand? Should downloading them be mandatory or optional?
   - _Why it matters:_ Affects MFA adoption rates and future support burden from locked-out users
   - _Default assumption if unanswered:_ Mandatory download during setup with regeneration option in user settings

3. **SSO Configuration User Experience**
   Should SSO configuration be a guided setup wizard for organization admins, or a technical form requiring metadata uploads? How much testing/validation should be built into the configuration flow?
   - _Why it matters:_ Affects enterprise customer adoption speed and support ticket volume
   - _Default assumption if unanswered:_ Technical form with metadata upload and basic connection testing

4. **Organization Admin Provisioning**
   How are organization admin roles initially assigned when SSO is enabled? Should the current admin automatically become the SSO admin, or is there a separate provisioning step?
   - _Why it matters:_ Affects SSO onboarding complexity and potential permission conflicts
   - _Default assumption if unanswered:_ Existing organization admins automatically gain SSO configuration permissions

## Nice to Have (will use reasonable defaults)

1. **SCIM Architecture Preparation**
   Are there any database schema or user model decisions needed now to simplify future SCIM provisioning integration? Any fields that should be reserved or structured differently?
   - _Why it matters:_ Prevents costly refactoring when SCIM is added later
   - _Default assumption if unanswered:_ Design for current requirements only, handle SCIM in future migration

2. **Audit Log Retention and Access**
   How long should authentication audit logs be retained, and who should have access to view/export them? Any specific compliance requirements (SOC2, GDPR)?
   - _Why it matters:_ Affects storage costs and compliance positioning
   - _Default assumption if unanswered:_ 1-year retention, organization admin access only, basic export capability

3. **Session Timeout Granularity**
   Should session timeout be configurable per user role within an organization, or just at the organization level? Any special timeout requirements for admin users?
   - _Why it matters:_ Determines configuration UI complexity and security policy flexibility
   - _Default assumption if unanswered:_ Organization-level only, no role-specific timeouts

## Assumptions Being Made

_These are interpretations the analysis has already made. Flag any that are wrong._

1. **Password auth remains available** — Organizations can choose between password-only, SSO-only, or hybrid auth modes (not forcing everyone to SSO immediately)
2. **MFA is per-user opt-in by default** — Individual users can enable MFA unless their organization admin enforces it organization-wide
3. **TOTP and SMS are equal options** — Users can choose either authenticator apps or SMS, not required to set up both
4. **JWT tokens continue to be used** — Extending existing JWT-based session management rather than replacing with SAML assertions or OIDC tokens
5. **Organization-scoped configuration** — SSO settings, MFA policies, and session timeouts are configured per organization, not globally or per-user
