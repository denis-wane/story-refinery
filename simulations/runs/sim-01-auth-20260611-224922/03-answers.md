# Stakeholder Responses

## Critical Questions

### 1. SSO Configuration Process
**Answer:** Self-service portal. Our enterprise customers expect to be able to configure SSO themselves without waiting for support tickets. We need a guided setup wizard that walks them through certificate upload, metadata configuration, and test authentication.
**Additional context:** Our biggest customers (500+ users) have their own IT teams that prefer self-service. We should include a "Request Assistance" button for smaller orgs that need help, but the primary flow must be self-service.

### 2. SMS MFA Scope and Cost Model
**Answer:** Start with US and Canada only. Company absorbs SMS costs for now. Failed SMS should show an error with a retry button and suggest TOTP as the primary method.
**Additional context:** We'll monitor SMS costs in the first quarter and can add per-organization billing later if needed. Most of our enterprise customers prefer TOTP anyway for security reasons.

### 3. Emergency Access When SSO Fails
**Answer:** Super-admin bypass capability. Our internal admin team should be able to temporarily disable SSO enforcement for an organization during provider outages. This requires manager approval and should auto-expire after 4 hours.
**Additional context:** We learned this lesson from Slack's SSO outage last year. Customers can't be completely locked out when their identity provider has issues.

### 4. User Migration to SSO
**Answer:** Passwords stay active until the user successfully logs in via SSO for the first time, then we disable the password. Give users a 30-day grace period with email notifications before SSO becomes mandatory.
**Additional context:** We need to coordinate with customer success to ensure smooth rollouts. Some users may be on vacation when SSO is enabled.

## Important Questions

### 1. Audit Log Retention and Access
**Answer:** 3-year retention to match our compliance requirements. Organization admins can view their own audit logs, and our security team has full access. Must include CSV export for customer compliance reports.
**Additional context:** Some customers have asked specifically about SOC 2 audit support, so this is important for sales.

### 2. Recovery Code Implementation
**Answer:** 8 single-use alphanumeric codes. Display on screen during setup with a clear "Download and Save" option as PDF. Users must confirm they've saved them before proceeding.
**Additional context:** Make the codes human-readable (no confusing characters like 0/O or 1/l). Security team suggested 8 codes as the sweet spot between usability and security.

### 3. Rate Limiting Behavior
**Answer:** 5 failed attempts per user account triggers a 15-minute lockout. No IP-based limiting since enterprise customers often share NAT IPs. Send email notification to the user when their account is locked.
**Additional context:** The credential stuffing attack hit specific high-value accounts, so user-based limiting is more important than IP-based for our threat model.

### 4. Session Timeout Granularity
**Answer:** Organization-wide setting that applies to all users uniformly. Individual user preferences would be too complex for admins to manage.

## Nice to Have

### 1. Provider-Specific Integration Features
**Answer:** Focus on standard SAML 2.0 and OIDC for the MVP. We can add Okta group mappings in phase 2 if customers specifically request it.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | SCIM Compatibility | ✅ Correct | Our user schema should work fine with SCIM |
| 2 | Admin MFA Enforcement | ⚠️ Partially | Need to clarify: this means all users with admin roles in any organization, not just our internal admins |
| 3 | JWT Token Enhancement | ✅ Correct | Our current JWT system can handle variable timeouts |
| 4 | Parallel Authentication | ✅ Correct | Exactly right - SSO takes precedence when configured |
| 5 | TOTP App Support | ✅ Correct | Standard implementation should work with all major apps |
| 6 | Credential Stuffing Prevention | ❌ Wrong | Rate limiting alone isn't enough - we also need account lockout notifications and potentially device fingerprinting for repeat offenders |
