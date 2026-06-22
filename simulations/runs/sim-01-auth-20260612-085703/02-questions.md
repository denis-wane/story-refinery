# Clarifying Questions

## Critical (must answer before proceeding)

1. **How do organization admins configure SSO providers?**
   When an enterprise customer wants to enable SSO, what interface do they use? Do they upload SAML metadata files through a web UI, enter endpoint URLs and certificates manually, or use some other method? Does this include mapping user attributes (email, name, groups)?
   - _Why it matters:_ SSO setup stories cannot be written without knowing the configuration workflow and required UI components
   - _Default assumption if unanswered:_ Web UI with metadata file upload and manual attribute mapping configuration

2. **What happens when existing email/password users try to log in after SSO is enforced?**
   If a user has been logging in with email/password but their organization admin just enabled SSO enforcement, what experience do they get? Automatic redirect to SSO provider? Error message with instructions? Grace period?
   - _Why it matters:_ Determines login flow logic and user communication strategy
   - _Default assumption if unanswered:_ Automatic redirect to SSO provider with informational message about the change

3. **How are users assigned to organizations?**
   Can users belong to multiple organizations? Who assigns users to organizations - the user themselves, organization admins, or system admins? Is this based on email domain or manual assignment?
   - _Why it matters:_ Fundamental to all organization-based policy enforcement stories
   - _Default assumption if unanswered:_ Users belong to one organization, assigned by organization admin or email domain matching

4. **How is "admin role" defined for MFA enforcement?**
   The security team requires MFA for "admin-role users" - how is this determined? Database role field? Permission-based (users with specific permissions)? Organization-specific admin designation?
   - _Why it matters:_ Cannot implement admin MFA enforcement without clear role identification logic
   - _Default assumption if unanswered:_ Database role field with values like 'admin', 'org_admin', 'user'

5. **What SMS provider should be integrated and what's the international scope?**
   Which SMS service (Twilio, AWS SNS, etc.) and do we need international SMS support? Any cost limits per user/organization? Phone number validation requirements?
   - _Why it matters:_ Affects technical integration complexity, operational costs, and global deployment capability
   - _Default assumption if unanswered:_ Twilio with US/Canada support only, $5/user/month SMS budget cap

## Important (strongly recommended)

1. **What's the migration strategy for existing users?**
   How do current email/password users transition when their organization enables SSO? Must they link accounts manually, or does this happen automatically based on email matching? What about users who can't access their corporate identity provider?
   - _Why it matters:_ Affects user experience during rollout and determines account linking complexity
   - _Default assumption if unanswered:_ Automatic account linking based on email address matching, with manual override option

2. **How should session timeouts behave?**
   Is the configurable session timeout a fixed expiration (absolute timeout) or does user activity extend the session (sliding timeout)? What actions count as "activity"?
   - _Why it matters:_ Affects security posture and user experience with session management
   - _Default assumption if unanswered:_ Sliding timeout that extends with any authenticated API request

3. **What are the audit log retention and format requirements?**
   How long must authentication logs be retained? What format (JSON, structured text, database records)? Where are they stored (database, separate log store, external service)?
   - _Why it matters:_ Affects infrastructure requirements and compliance implementation
   - _Default assumption if unanswered:_ 1-year retention in database as JSON records with external log shipping

4. **What happens when SSO provider is unavailable?**
   If an organization's identity provider is down, do their users get locked out completely? Is there an emergency access method? Error message guidance?
   - _Why it matters:_ Business continuity during SSO outages affects customer satisfaction
   - _Default assumption if unanswered:_ Users locked out with clear error message and support contact information

## Nice to Have (will use reasonable defaults)

1. **Should MFA enrollment be self-service, admin-managed, or both?**
   Can users enable MFA themselves, or must organization admins configure it? If both, what are the permission boundaries?
   - _Why it matters:_ Affects user onboarding flow complexity and admin workload
   - _Default assumption if unanswered:_ Self-service enrollment with admin ability to mandate or disable per user

2. **What rate limiting parameters should be applied?**
   How many authentication attempts per time period should be allowed? Should this be per-IP, per-user, or both? What kind of progressive delays?
   - _Why it matters:_ Security effectiveness depends on proper configuration
   - _Default assumption if unanswered:_ 5 attempts per minute per IP with progressive backoff, 10 attempts per hour per user

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **Recovery codes will be 10 single-use codes per user** — Based on industry standard practices
2. **Current JWT token approach will be extended rather than replaced** — Based on technical context provided
3. **Organization model will be single-organization per user** — Based on typical B2B SaaS patterns
4. **SCIM provisioning is explicitly out of scope for this phase** — Based on stakeholder notes
5. **Both Okta and Azure AD will be supported in initial SSO implementation** — Based on customer requests mentioned
