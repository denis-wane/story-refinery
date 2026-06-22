# Stakeholder Responses

## Critical Questions

### 1. SMS Provider Selection and Budget
**Answer:** Use Twilio for SMS. We'll absorb the cost for now since it's a competitive differentiator, but we'll track usage by organization to potentially introduce per-message billing later if costs get out of hand.
**Additional context:** Our finance team approved up to $2,000/month for SMS costs in the initial rollout. If we hit that limit, we'll need to cap SMS attempts or introduce billing.

### 2. Rate Limiting Thresholds  
**Answer:** 5 failed attempts per IP per 15 minutes, 8 failed attempts per account per hour with 30-minute lockout. After 3 lockouts in 24 hours, require admin intervention.
**Additional context:** We learned from the credential stuffing incident that attackers were cycling through IPs, so the account-level limits are more important than IP-based ones.

### 3. Cross-Organization User Policy Resolution
**Answer:** Most restrictive policy wins. If any organization requires SSO, that user must use SSO for all their organizations. Same for MFA enforcement.
**Additional context:** This came up with our consulting customers who work with multiple clients. Legal confirmed this approach reduces our liability exposure.

### 4. Audit Log Retention and Access
**Answer:** 3-year retention for compliance. Organization admins see their org only with CSV export. System admins see everything. Need real-time alerts for suspicious activity.
**Additional context:** Our enterprise customers in healthcare and finance specifically requested 3+ year retention for SOX compliance.

### 5. SSO Configuration Ownership
**Answer:** Organization admins handle it through self-service UI. We'll provide templates for common providers like Okta and Azure AD to reduce support tickets.
**Additional context:** Customer success is drowning in SSO setup requests. Self-service will reduce their workload and improve time-to-value for new enterprise customers.

## Important Questions

### 1. SSO Migration Strategy
**Answer:** 14-day advance notice via email and in-app banners, then immediate enforcement. System admin emergency bypass available for 72 hours to handle transition issues.
**Additional context:** Two weeks gives enough time for users to test SSO login before the cutover. We've seen too many issues with gradual rollouts where users ignore the warnings.

### 2. MFA Enforcement Timeline
**Answer:** 21-day grace period with escalating notifications (21, 14, 7, 3, 1 day warnings). After that, users can't log in until they set up MFA.
**Additional context:** Our customer success team recommended 21 days instead of 30 because users procrastinate until the last minute anyway.

### 3. Session Timeout Behavior
**Answer:** 10-minute warning with extend option, then hard logout. Auto-save drafts in progress before logout.
**Additional context:** We lose too much customer goodwill when people lose work due to unexpected logouts. The auto-save is non-negotiable.

### 4. SSO Provider Downtime Handling  
**Answer:** Fail-closed with clear error message showing provider status. No password fallback - that defeats the security purpose of SSO enforcement.
**Additional context:** Security team was adamant about this after seeing competitors get breached through "temporary" password fallbacks that never got disabled.

### 5. Recovery Code Management
**Answer:** 8 single-use codes, users can regenerate once per 24 hours (invalidates old codes), no expiration. Show clear warnings about downloading/printing them.
**Additional context:** Support sees too many tickets from users who generated codes but never saved them. The 24-hour limit prevents abuse while allowing legitimate use.

## Nice to Have

### 1. Admin Privilege Separation
**Answer:** System admins can bypass for 48 hours maximum with mandatory incident ticket and audit trail.

### 2. MFA Device Loss Recovery Process
**Answer:** Recovery codes first, then org admins can reset MFA with 24-hour temporary access and required re-enrollment.

### 3. International SMS Support
**Answer:** Start with US/Canada/UK. Add EU countries in phase 2 based on customer demand.

### 4. Concurrent Session Limits
**Answer:** Max 5 concurrent sessions. New logins beyond limit invalidate oldest session with notification.

### 5. SCIM Compatibility Preparation
**Answer:** Standard SCIM 2.0 attributes only. Don't add custom fields that will complicate future SCIM integration.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Immediate SSO enforcement — Once enabled, SSO is required immediately with no password fallback for that org | ✅ Correct | This is exactly what we need for security compliance |
| 2 | System admin emergency access — System admins can temporarily bypass customer auth policies for support scenarios | ✅ Correct | Critical for operational support, but needs audit trail |
| 3 | Fail-closed security posture — When external dependencies fail, users get locked out rather than degraded auth | ✅ Correct | Security over convenience - learned this from competitor breaches |
| 4 | Organization-scoped audit logs — Org admins only see authentication events for their own organization | ✅ Correct | Multi-tenant isolation is required for enterprise customers |
| 5 | Hard session timeouts — When timeout is reached, users are immediately logged out rather than session extension prompts | ⚠️ Partially | Too harsh - need the 10-minute warning with extend option to prevent data loss |
