# Stakeholder Responses

## Critical Questions

### 1. SSO Configuration: Self-Service vs Assisted Setup
**Answer:** Support-assisted setup initially. Our larger enterprise customers (50+ users) expect white-glove onboarding anyway, and we don't want configuration mistakes causing authentication outages.
**Additional context:** Once we have 6 months of operational experience, we can build self-service UI for the standard configurations. Okta and Azure AD should have template configs to speed up support setup.

### 2. Existing User Account Migration Strategy  
**Answer:** Auto-link by email address, but require the user to verify ownership on their first SSO login by entering their current password. This gives us the security validation without forcing them to recreate everything.
**Additional context:** If email doesn't match exactly (like john@company.com vs john.doe@company.com), that'll be a manual support case. We expect maybe 5-10% of users to hit this.

### 3. Rate Limiting: Specific Thresholds and Lockout Behavior
**Answer:** 5 failed attempts per user account locks that account for 1 hour. 20 failed attempts from the same IP in 15 minutes blocks that IP for 1 hour. No admin bypass — the security team was very clear on this after our incident.
**Additional context:** We'll add monitoring alerts when rate limits trigger so we can spot attack patterns early.

### 4. MFA Enforcement: Rollout Timeline and User Experience
**Answer:** 7-day grace period with daily email reminders. After that, users can log in but get redirected to MFA setup and can't access the main app until it's configured.
**Additional context:** This gives us time to handle the support volume without totally blocking people. We learned from Slack's MFA rollout — too aggressive and your helpdesk drowns.

### 5. SMS Provider Selection and Coverage
**Answer:** AWS SNS. Start with US and Canada only — 90% of our current users are there anyway. We can add international later based on demand.
**Additional context:** Keep SMS as a backup option though. Most enterprise security teams prefer TOTP apps anyway.

## Important Questions

### 1. Session Timeout Scope: Local vs SSO Sessions
**Answer:** Our timeout settings only control our JWT sessions. If someone's Okta session expires, that's between them and Okta. We just honor whatever the SSO provider tells us.

### 2. SCIM Compatibility: Current Architecture Impact
**Answer:** Design the user identity model to work with email as the primary key, but make sure we can handle external user IDs when SCIM arrives. Don't over-engineer it now, but don't paint ourselves into a corner.

### 3. Identity Provider Testing: Validation Requirements
**Answer:** Okta and Azure AD are the priorities — 80% of our enterprise inquiries mention one of those. Standard SAML/OIDC should handle the rest. If a customer has something exotic, we'll evaluate case-by-case.

### 4. Organization Admin Capabilities: UI Feature Scope
**Answer:** Keep it simple: SSO on/off, MFA enforcement on/off, and a basic user status view (who's using SSO vs password, who has MFA enabled). Advanced audit log access can wait for v2.

### 5. MFA Device Loss: Recovery Process
**Answer:** Recovery codes first, then org admin reset as backup. Support tickets only for edge cases where both fail. We don't want to become a 24/7 helpdesk for lost phones.

## Nice to Have

### 1. Audit Log Integration: Retention and Format
**Answer:** 1-year retention is fine. JSON logs to our existing infrastructure. Security team wants to query authentication events, not build a new system.

### 2. Recovery Code Implementation: Generation and Usage
**Answer:** 10 single-use codes. Users can generate new ones anytime, which invalidates the old set. More than most services give you, but reduces support load.

### 3. Compliance Requirements: Standards and Certifications
**Answer:** No specific compliance requirements right now, but follow security best practices. We're exploring SOC2 next year, so don't do anything that would block that.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | JWT token enhancement — existing JWT structure can be enhanced with org context and auth method claims | ✅ Correct | This approach should work fine with our current architecture |
| 2 | Backward compatibility maintained — existing email/password authentication continues alongside SSO without major changes | ✅ Correct | Critical requirement — can't break existing users |
| 3 | Organization-scoped policies — authentication policies are set per organization, not globally or per-user | ❌ Wrong | MFA enforcement should also support role-based rules. All admin users must have MFA by Q3 regardless of org policy |
| 4 | Standard protocol compliance — SAML 2.0 and OIDC standard implementations without custom extensions | ✅ Correct | Keep it standard — custom stuff breaks with provider updates |
| 5 | Database schema extension — current user/org schema can be extended rather than requiring complete redesign | ⚠️ Partially | Mostly correct, but we'll need a new table for auth methods/devices, not just user table columns |
