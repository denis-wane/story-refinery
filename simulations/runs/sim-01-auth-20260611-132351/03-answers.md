# Stakeholder Responses

## Critical Questions

### 1. SSO Provider Configuration Process
**Answer:** Self-service configuration by organization admins. We need to reduce support burden and speed up enterprise onboarding.
**Additional context:** Support will handle the initial 5-10 enterprise customers during beta, but after that it needs to be self-service. Our largest prospects specifically mentioned this as a requirement during their eval - they don't want to wait 2-3 days for support tickets just to connect their identity provider.

### 2. Admin Role Definition for MFA Requirement
**Answer:** Organization admins only for the Q3 requirement. This includes anyone with the "Org Admin" permission level who can manage billing, users, and org settings.
**Additional context:** Security team was specifically concerned about org admins because they have access to billing data and can provision new users. System/platform admins (our internal staff) already have MFA enforced.

### 3. User-Organization Association Model
**Answer:** Single organization per user for now. Multi-org support can come later if needed.
**Additional context:** Our current customer base doesn't really need users switching between orgs - most enterprise customers have dedicated instances anyway. The few consultants who work with multiple clients just create separate accounts.

### 4. Existing User Migration to SSO
**Answer:** Forced migration at next login with 1-week advance email notification.
**Additional context:** We'll give org admins a preview of affected users before they enable SSO enforcement, so they can communicate internally. Clean cutover is better than confusing dual-auth scenarios.

## Important Questions

### 1. MFA Device Recovery Procedures
**Answer:** Organization admins can temporarily disable MFA for specific users after email confirmation to their registered email address.
**Additional context:** This should log to the audit trail with admin details. Users will need to re-enable MFA within 72 hours or get locked out again.

### 2. SSO Provider Unavailability Fallback
**Answer:** No fallback access. If SSO is down, users wait for their IT team to fix it.
**Additional context:** We discussed emergency admin access, but security team nixed it - too much risk. Enterprise customers understand this trade-off.

### 3. Rate Limiting Implementation Details
**Answer:** 5 failed login attempts per email address in 10 minutes triggers a 30-minute lockout. IP-based limiting for extreme cases.
**Additional context:** Make sure legitimate users aren't blocked by office IP limits. The credential stuffing attack last quarter came from distributed IPs, so user-based limiting is more important.

### 4. Recovery Code Management Flow
**Answer:** 8 single-use backup codes generated during MFA enrollment, displayed once with download/print option.
**Additional context:** Users should be prompted to store them securely - maybe a modal warning about not saving them in browser downloads folder.

## Nice to Have

### 1. SMS Provider Selection
**Answer:** Start with Twilio for US/Canada. International can wait until we actually have international enterprise customers.
**Additional context:** Our current enterprise customers are all North America based anyway.

### 2. MFA Enrollment User Experience
**Answer:** Self-service enrollment with nagging prompts when org admin enables enforcement. Give users 2 weeks to set up before blocking access.
**Additional context:** Some users will procrastinate, but forced enrollment at login is too disruptive for enterprise environments.

### 3. Session Timeout Inheritance
**Answer:** Platform organization settings override SSO provider sessions. Enterprises want control over our platform specifically.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Manual user-organization assignment — Current system requires manual association of users to organizations, with data model designed to be SCIM-compatible for future automated provisioning | ✅ Correct | Yes, manual for now. SCIM is phase 2. |
| 2 | Platform session control — Organization-configured session timeouts will override any SSO provider session settings for consistent policy enforcement | ❌ Wrong | Actually, we should honor SSO provider sessions AND apply our timeout - whichever is shorter. Enterprises expect their AD session policies to work. |
| 3 | Email/password fallback preservation — Organizations without SSO enforcement will continue to allow email/password authentication alongside any configured SSO options | ⚠️ Partially | Correct, but once SSO is enforced for an org, email/password should be completely disabled for those users - no dual auth confusion. |
