# Stakeholder Responses

## Critical Questions

### 1. Which specific user roles require MFA by Q3?
**Answer:** Organization admins and system admins must have MFA enabled by Q3. Also any user with billing permissions or support agent access.
**Additional context:** We define "admin-role" as: organization owners, organization admins, anyone who can modify billing/subscription settings, and our internal support team members who can access customer data. Regular users and read-only roles are exempt from the Q3 requirement.

### 2. How is your organization data currently structured?
**Answer:** Flat structure with simple org_id. Each user belongs to exactly one organization, no hierarchies or shared users.
**Additional context:** We kept it simple intentionally — tried multi-tenant stuff before and it was a nightmare. Each organization is completely isolated with their own subdomain (acme.ourapp.com).

### 3. What are your specific rate limiting requirements?
**Answer:** 5 failed attempts locks the user account for 15 minutes. 20 failed attempts from same IP gets that IP blocked for 1 hour.
**Additional context:** The credential stuffing hit us hard — attackers were trying 1000s of email/password combos. Also need progressive delays: first failure = immediate, second = 2 seconds, third = 4 seconds, etc.

### 4. How should SSO enforcement technically work?
**Answer:** Hard enforcement at the API level. When SSO is enabled, password authentication must return an error directing users to SSO login.
**Additional context:** We don't want any backdoors or "temporary" password access. Once SSO is on, it's on. Only exception is our support team emergency access for troubleshooting.

### 5. What emergency access is needed when MFA/SSO fails?
**Answer:** Support ticket workflow only. Users contact support, we verify identity, then generate a 24-hour bypass code.
**Additional context:** No automated bypasses — too risky. Our support team is small but responsive. Emergency codes should be single-use and expire automatically.

## Important Questions

### 1. Which SMS provider should we integrate with?
**Answer:** Twilio. We already use them for other notifications.
**Additional context:** We need US, Canada, and EU support minimum. Budget is $500/month for SMS — we're not expecting huge volume since most users will use authenticator apps.

### 2. How should recovery codes be managed?
**Answer:** 10 single-use codes, alphanumeric, shown once when generated with mandatory download.
**Additional context:** Users should be forced to acknowledge they've saved them before proceeding. No re-display option for security — if they lose them, they contact support for new ones.

### 3. Who manages SSO IdP configuration?
**Answer:** Organization admins self-configure through our UI. Support team available for assistance but not required.
**Additional context:** Most of our enterprise customers have technical admins who can handle SAML metadata. We should have clear documentation and maybe a setup wizard.

### 4. What triggers session revocation?
**Answer:** Password changes, MFA enrollment/changes, admin-initiated revocation, and when organization SSO settings change.

### 5. How should SSO provider outages be handled?
**Answer:** Error page with our support contact info. No automatic password bypass.
**Additional context:** We'll take the heat for their IdP being down rather than compromise security. Most outages are short anyway.

## Nice to Have

### 1. Any specific SAML IdP compatibility requirements beyond Okta/Azure AD?
**Answer:** Those two cover 80% of our enterprise prospects. Add OneLogin if it's easy.

### 2. Preferred audit log retention and export format?
**Answer:** 3 years retention for compliance. CSV export is fine — our compliance team uses Excel anyway.

### 3. Session timeout granularity preferences?
**Answer:** Hour-level is perfect. Options: 1h, 4h, 8h, 24h, 7 days, 30 days.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | SSO is organization-scoped | ✅ Correct | Each org configures independently |
| 2 | MFA is user-optional by default | ✅ Correct | Unless org admin enforces it |
| 3 | Backward compatibility required | ✅ Correct | Existing users can't be disrupted |
| 4 | JWT token structure can be modified | ✅ Correct | We own the token format |
| 5 | Organization admins exist as a role | ❌ Wrong | We call them "organization owners" — there are owners and regular users, no separate admin role |
