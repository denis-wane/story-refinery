# Stakeholder Responses

## Critical Questions

### 1. SSO Migration Strategy for Existing Users
**Answer:** 7-day grace period with prominent SSO setup prompts, then hard cutover. No exceptions.
**Additional context:** We learned from the Slack migration last year that grace periods work well if they're short and visible. Our customer success team can handle the handful of stragglers, but anything longer than a week just delays the inevitable complaints.

### 2. SSO Identity Matching Rules
**Answer:** Match by email address with admin override capability for conflicts.
**Additional context:** Our enterprise customers change email domains occasionally (M&A, rebranding), so we need the flexibility. The security team is okay with email matching as long as we log all the override actions.

### 3. MFA Recovery When Device Lost
**Answer:** Organization admins can reset MFA for their users through the admin dashboard. For org admin recovery, they submit a support ticket with identity verification.
**Additional context:** This keeps our support burden manageable while giving customers control. We should add a "reset MFA" button right in the user management section where admins already go to manage roles.

### 4. MFA Enrollment Timing
**Answer:** Required within 3 days of first login, not 7. Account gets read-only access after deadline until MFA is set up.
**Additional context:** The compliance team pushed back on 7 days after reviewing our incident response times. Read-only is better than full lockout because users can still access critical data while setting up MFA.

## Important Questions

### 1. Rate Limiting Configuration
**Answer:** 5 failed attempts per IP per 15 minutes, 3 failed attempts per user account per hour. IP lockout for 15 minutes, account lockout for 1 hour.
**Additional context:** Make the account lockout stricter than IP because credential stuffing often targets specific high-value accounts. We should also add CAPTCHA after 2 failed attempts per IP.

### 2. SMS Cost and Usage Limits
**Answer:** We'll absorb SMS costs but cap at 5 codes per user per day. After that, they must use TOTP or recovery codes.
**Additional context:** Finance approved up to $2K/month for SMS costs. If we hit that limit, we'll revisit the daily caps or start charging enterprise customers for overage.

### 3. Audit Log Retention and Storage
**Answer:** 3-year retention minimum for compliance. Store in the main database for the first 90 days, then archive to cold storage.
**Additional context:** Legal says 3 years covers most industry requirements, and some enterprise contracts specifically require it. We can optimize storage costs by archiving older logs.

### 4. SSO Provider Validation Process
**Answer:** Internal testing with Okta and Azure AD only. Customers are responsible for testing other providers in their staging environment before going live.
**Additional context:** We don't have bandwidth to test every possible SSO provider. Let's document the standard SAML/OIDC requirements clearly and provide a testing checklist for customers.

## Nice to Have

### 1. Session Management Granularity
**Answer:** Organization-level only for now. We can add role-based timeouts later if customers ask for it.

### 2. Backup Code Format and Count
**Answer:** 10 single-use codes, 8 digits each, numeric only for simplicity.

### 3. Failed SSO Assertion Handling
**Answer:** Generic error message for users, detailed logs for admins. Include a support ticket reference number in the user message.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | SCIM provisioning exclusion | ✅ Correct | Phase 2 feature, not this release |
| 2 | JWT token preservation | ✅ Correct | No need to rebuild what works |
| 3 | Organization-first SSO | ✅ Correct | Individual SSO config would be chaos |
| 4 | PostgreSQL schema evolution | ⚠️ Partially | Fine for now, but we're hitting performance issues. Consider separate auth service for Phase 2 |
| 5 | React SPA compatibility | ✅ Correct | Frontend team confirmed redirect flows work |
| 6 | Admin role MFA deadline | ❌ Wrong | Q3 is when enforcement starts. All admin MFA must be configured by end of Q2 for testing |
