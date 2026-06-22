# Stakeholder Responses

## Critical Questions

### 1. How do organization admins configure SSO providers?
**Answer:** Web UI with metadata file upload for SAML providers, plus manual entry of endpoint URLs and certificates as a fallback. For OpenID Connect, they enter the discovery URL and client credentials. We need attribute mapping for email, first name, last name, and department.
**Additional context:** Our larger customers prefer metadata upload since their IT teams are familiar with it. However, Azure AD sometimes requires manual certificate updates, so the manual option is crucial for ongoing maintenance.

### 2. What happens when existing email/password users try to log in after SSO is enforced?
**Answer:** Automatic redirect to the SSO provider with a one-time banner message explaining "Your organization now requires single sign-on authentication." No grace period - enforcement is immediate.
**Additional context:** We'll send organization-wide email notification 48 hours before enforcement goes live, so users aren't surprised by the change.

### 3. How are users assigned to organizations?
**Answer:** Users belong to exactly one organization. Organization admins invite users by email address, and new users are automatically assigned based on email domain matching for verified domains. System admins can reassign users between organizations if needed.
**Additional context:** About 60% of our customers use domain-based auto-assignment. The rest prefer manual invitation control.

### 4. How is "admin role" defined for MFA enforcement?
**Answer:** Database role field with three values: 'user', 'org_admin', 'super_admin'. Anyone with 'org_admin' or 'super_admin' role must have MFA enabled by Q3 deadline. Organization admins can also designate specific users as requiring MFA regardless of role.

### 5. What SMS provider should be integrated and what's the international scope?
**Answer:** Twilio for SMS. Start with US and Canada support only - about 85% of our customer base is North America. International support can be added later based on demand. Set SMS budget at $10/user/month with alerts when users approach the limit.
**Additional context:** We had one European customer ask about international SMS, but they were satisfied with TOTP-only for now.

## Important Questions

### 1. What's the migration strategy for existing users?
**Answer:** Automatic account linking based on email address matching when SSO is enabled. If linking fails (email mismatch), the user gets an error with instructions to contact their organization admin. No manual account linking UI needed for v1.
**Additional context:** Our customer success team will help with any edge cases during the rollout. Clean email matching should handle 95%+ of cases.

### 2. How should session timeouts behave?
**Answer:** Sliding timeout that extends with any page navigation or API call. Organization admins configure the timeout value, default 24 hours, maximum 30 days. Show a warning popup 5 minutes before expiration.

### 3. What are the audit log retention and format requirements?
**Answer:** 2-year retention minimum in the database as JSON records. Export capability to CSV for compliance audits. Include timestamp, user ID, organization ID, event type, IP address, and user agent.
**Additional context:** Our legal team specifically requested 2 years to match our data retention policy. Several customers have asked about audit exports for their compliance teams.

### 4. What happens when SSO provider is unavailable?
**Answer:** Users are locked out with clear error message: "Your organization's identity provider is currently unavailable. Please contact [org admin email] for assistance." No emergency bypass - security team was adamant about this.

## Nice to Have

### 1. Should MFA enrollment be self-service, admin-managed, or both?
**Answer:** Self-service enrollment by default. Organization admins can mandate MFA for specific users or roles, and can view enrollment status for all users in their org. Admins cannot disable MFA once a user has enabled it - only the user can remove it.

### 2. What rate limiting parameters should be applied?
**Answer:** 5 failed attempts per IP address per 5-minute window, then 15-minute lockout. 10 failed attempts per user account per hour, then 2-hour lockout. Progressive delays: 2 seconds after 3 attempts, 5 seconds after 4 attempts.
**Additional context:** Our security consultant recommended these specific parameters based on our previous incident analysis.

## Assumptions Review
| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Recovery codes will be 10 single-use codes per user | ✅ Correct | This matches what our users expect from other enterprise tools |
| 2 | Current JWT token approach will be extended rather than replaced | ✅ Correct | Engineering team confirmed this is the most feasible approach |
| 3 | Organization model will be single-organization per user | ✅ Correct | Matches our current data model and business logic |
| 4 | SCIM provisioning is explicitly out of scope for this phase | ✅ Correct | Q4 priority, not Q3 |
| 5 | Both Okta and Azure AD will be supported in initial SSO implementation | ⚠️ Partially | Start with just Okta for initial release. Azure AD can be added in a follow-up sprint once Okta is stable - this reduces initial complexity |
