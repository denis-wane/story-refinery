# Stakeholder Responses

## Critical Questions

### 1. What defines "admin-role users" for the Q3 MFA requirement?
**Answer:** Admin-role users are organization administrators who can manage users, billing, or security settings for their organization, plus our internal platform administrators. Specifically: org admins, billing admins, security officers, and anyone with "manage users" permission.
**Additional context:** Our compliance team is actually pushing for this because of SOC 2 requirements. We'll also need to enforce MFA for our own support staff who have elevated access to customer data.

### 2. How should existing password users migrate when their organization enables SSO mandate?
**Answer:** 14-day grace period where users can use either password or SSO, then password login is disabled. During the grace period, we'll email users daily reminders with setup instructions.
**Additional context:** Two weeks is tight but our enterprise customers are pressing for faster SSO rollouts. We'll provide white-glove migration support for organizations with 500+ users.

### 3. Can non-SSO users coexist in SSO-mandated organizations?
**Answer:** Yes, but only for service accounts and API-only integrations. All human users must use SSO once it's mandated. Service accounts will be clearly labeled and require separate approval from the org admin.
**Additional context:** We learned this the hard way from our pilot customer - their DevOps team had automated scripts that broke when we enforced SSO on everything.

### 4. What's the MFA recovery process when users lose both device and recovery codes?
**Answer:** Organization admins can reset a user's MFA after email verification to the user's registered address. For users without an org admin (freelancers, small teams), our support team handles it with identity verification.
**Additional context:** Support will require two forms of verification: security questions plus government ID upload for non-enterprise accounts.

### 5. What's the preferred SSO configuration UI approach?
**Answer:** Self-service wizard with provider presets for Okta, Azure AD, and Google Workspace. Include copy-paste fields for SAML metadata and OIDC discovery URLs, plus a "test connection" button.
**Additional context:** Our sales team promises 15-minute SSO setup in demos, so keep it simple. Provide downloadable setup guides with screenshots for each major provider.

## Important Questions

### 1. What are the specific rate limiting thresholds for authentication endpoints?
**Answer:** 5 failed login attempts per account in 15 minutes triggers a 1-hour lockout. 50 attempts per IP address in 15 minutes triggers a 4-hour IP block. Include CAPTCHA after 3 failed attempts.
**Additional context:** These numbers come from our security consultant's recommendations after the breach. We'll also implement progressive delays (2sec, 4sec, 8sec) for repeated failures.

### 2. Should session timeouts apply to API tokens or only web browser sessions?
**Answer:** Web browser sessions only. API tokens should have their own refresh mechanism with 7-day refresh tokens and 24-hour access tokens. Don't break existing API integrations.
**Additional context:** Our biggest customers have CI/CD pipelines that would break with short API timeouts. Keep API authentication separate from user session management.

### 3. What SMS provider should be integrated for MFA codes?
**Answer:** Twilio as primary provider. We already have an account with them for transactional emails, and they have good international coverage for our European customers.
**Additional context:** Budget is $500/month for SMS costs initially. If we hit that limit, we'll need to discuss pricing with Twilio or consider tiered MFA options.

## Nice to Have

### 1. How many MFA recovery codes should be generated and how should they expire?
**Answer:** 8 single-use recovery codes that don't expire but prompt users to regenerate when only 2 remain. Display a clear warning when they're down to their last code.
**Additional context:** 10 felt like too many to manage securely, but 5 felt too few for travel scenarios where users might need several codes.

### 2. Should audit logs integrate with existing security monitoring tools?
**Answer:** Not initially - just store in PostgreSQL with structured JSON. But design the schema so we can easily export to Splunk later when our security team gets budget approval.
**Additional context:** Include session ID, user agent, IP geolocation, and failure reason in the log structure. Security team specifically wants to track "impossible travel" scenarios.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | SAML 2.0 and OIDC are sufficient SSO protocols | ✅ Correct | These cover 95% of our enterprise customers |
| 2 | MFA enforcement is binary per-organization | ❌ Wrong | We need role-based enforcement - admins required, regular users optional per-org |
| 3 | Current JWT/cookie architecture can accommodate SSO tokens | ✅ Correct | Engineering confirmed this in tech review |
| 4 | SMS MFA is equally important to TOTP | ⚠️ Partially | TOTP is preferred but SMS is critical for international users without smartphones |
| 5 | Rate limiting is primarily about authentication endpoints | ⚠️ Partially | Also apply to password reset and MFA verification endpoints - same attack vectors |
