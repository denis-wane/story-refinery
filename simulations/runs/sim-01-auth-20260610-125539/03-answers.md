# Stakeholder Responses

## Critical Questions

### 1. Admin-role user definition for mandatory MFA
**Answer:** Admin-role users are anyone with "Organization Admin" or "Super Admin" roles, plus any user who has access to billing information, user management, or security settings. This includes our internal support team when they access customer organizations.
**Additional context:** The security team was very specific about this after the incident. They want to expand it to include anyone who can invite users or modify organization settings by Q4, but let's start with the core admin roles first.

### 2. SSO provider outage fallback strategy  
**Answer:** No fallback access during SSO outages. If Okta or Azure AD is down, the organization is locked out until their provider recovers. This is actually what our enterprise customers expect - they don't want password backdoors that could bypass their security policies.
**Additional context:** We should build a status page integration so we can show "SSO Provider Unavailable" instead of generic error messages. Our enterprise customers are used to this model from other SaaS tools.

### 3. Dual account conflict resolution
**Answer:** Automatic account linking on first SSO login, but only after the user verifies they own both accounts by logging in with their password first, then completing the SSO flow. We can't do manual linking - that would create too much support overhead.
**Additional context:** This happened during our Slack rollout last year and automatic linking worked well. The key is preserving their existing data and project access.

### 4. Active session handling during SSO migration
**Answer:** 72-hour grace period. When an org enables SSO-only mode, existing password sessions remain valid for 3 days, then users get redirected to SSO login. This gives us time to communicate the change without disrupting active work.

### 5. Rate limiting scope and thresholds
**Answer:** 5 attempts per email address per 15-minute window on login and MFA verify endpoints. After that, account gets temporarily locked for 30 minutes. We also need 10 attempts per IP per minute as a secondary protection.
**Additional context:** The credential stuffing attack targeted specific customer email domains, so email-based limiting is more important than just IP-based. Also, our support team needs a way to unlock accounts without waiting.

## Important Questions

### 1. User provisioning before SCIM
**Answer:** Admin invitation only for SSO organizations. Once SSO is enabled, we disable self-registration for that domain. Admins can bulk-invite via CSV upload - this is essential for migration.

### 2. MFA recovery code specifications  
**Answer:** 10 single-use codes generated when MFA is first enabled. Users can view and regenerate them anytime from their account settings. No expiration, but we should warn them if they use their last 2 codes.

### 3. Session timeout vs SSO provider sessions
**Answer:** Independent session management. Our sessions should honor the timeout settings organizations configure (24h default), regardless of SSO provider session length. Simpler for users and admins to understand.

### 4. MFA method discovery and setup
**Answer:** Self-service setup through account settings with guided flow for first-time setup. When MFA becomes mandatory for someone, they get an interstitial screen on next login walking them through it. No admin involvement needed.

### 5. Ultimate backup authentication
**Answer:** Organization admins can reset a user's MFA after confirming identity through our existing support process. For admin accounts, require approval from another admin in the same org, or escalate to our support team with additional verification.

## Nice to Have

### 1. SMS MFA provider selection
**Answer:** Use Twilio - we already have a relationship with them for other notifications. Make sure it works internationally since we have customers in EU and APAC.

### 2. Audit log retention period  
**Answer:** 3 years for authentication events. Some of our enterprise customers have compliance requirements that go back that far, and storage is cheap compared to losing a customer audit.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | SSO is organization-level | ✅ Correct | All users in an org must use the same provider |
| 2 | JWT tokens remain the session mechanism | ✅ Correct | No need to change what's working |
| 3 | PostgreSQL schema changes are acceptable | ✅ Correct | We're already planning database changes for Q3 |
| 4 | External SMS dependency is acceptable | ✅ Correct | Standard practice, customers expect it |
| 5 | TOTP shared secrets will be encrypted at rest | ✅ Correct | Security team requirement |
| 6 | Phase-based rollout is preferred | ❌ Wrong | Build MFA and SSO together - customers want both. Phase the *rollout* to customers, but don't split development phases |
