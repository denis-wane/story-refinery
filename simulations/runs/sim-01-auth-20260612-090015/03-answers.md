# Stakeholder Responses

## Critical Questions

### 1. How do existing email/password users transition when SSO is enabled for their organization?
**Answer:** Automatic account linking by email address. When SSO is enabled with enforcement, existing users get an email notification with a 7-day grace period to log in via SSO at least once. After that, password auth is disabled for their accounts.
**Additional context:** We've learned from other enterprise features that forced cutover without transition period generates too many support tickets. The 7-day window gives users time to coordinate with their IT departments.

### 2. What's the user experience when MFA is newly enforced but not yet set up?
**Answer:** 14-day grace period starting from enforcement date. Users get in-app banners and email reminders every 3 days. During grace period, they can log in normally but must set up MFA before the deadline. After deadline, they're blocked at login and required to complete MFA setup.
**Additional context:** We need this to go smoothly for the Q3 admin MFA requirement. Security team agreed to the 14-day window as long as we have clear warning communications.

### 3. How do organization admins configure SSO settings?
**Answer:** Self-service through our admin dashboard. Guided wizard that walks through metadata upload, endpoint configuration, and test authentication. Live validation of SAML certificates and endpoint connectivity before activation.
**Additional context:** Our enterprise sales team promises "no IT tickets required" for SSO setup. We need to deliver on that or they'll stop using it as a selling point.

### 4. What's the recovery process when users lose their MFA device?
**Answer:** Users can self-recover using backup codes. Organization admins can reset MFA for any user in their org. Only our customer success team can reset MFA for organization admins (with identity verification via phone).
**Additional context:** Customer success already handles sensitive account operations, so this fits their existing workflow.

### 5. How should the system handle SSO provider downtime?
**Answer:** Hard failure with clear error messaging. No password fallback — we need to maintain the security promise to enterprise customers. Error page should include their IT contact info and suggest checking provider status.
**Additional context:** Enterprise customers specifically chose us for strict SSO enforcement. Any fallback option would undermine that value proposition.

## Important Questions

### 1. What are the specific rate limiting thresholds for authentication endpoints?
**Answer:** 5 failed attempts per 10-minute sliding window triggers a 15-minute lockout. Escalating lockout: 15 min, 30 min, 1 hour, 4 hours. Reset counter after 24 hours of no failed attempts.
**Additional context:** These numbers come from our security consultant's recommendations after the credential stuffing incident.

### 2. What SMS coverage and delivery requirements exist?
**Answer:** Must support US, Canada, UK, Australia, and Germany. 95% delivery success rate is acceptable. Use Twilio as primary provider with Telnyx as backup for failed deliveries.
**Additional context:** Those five countries cover 90% of our current user base. We can expand coverage later based on demand.

### 3. What audit log format and retention policy should be implemented?
**Answer:** JSON format with user ID, organization ID, IP address, user agent, timestamp, event type, success/failure, and MFA method used. 3-year retention for compliance. Export capability for organization admins to download their org's logs.
**Additional context:** Legal team requires 3 years for potential litigation support. The export feature is specifically requested by two of our largest enterprise customers.

### 4. What are the session timeout boundaries for organizations?
**Answer:** Minimum 2 hours, maximum 30 days, default 24 hours. Organization admins can configure in 1-hour increments.
**Additional context:** Some of our financial services customers need very short sessions, but 1 hour was too disruptive in beta testing.

### 5. How should account lockouts work across authentication methods?
**Answer:** Separate lockout counters for password vs. SSO attempts. Same thresholds apply (5 attempts = lockout). Organization admins can unlock users in their org. Account lockouts reset automatically after 4 hours.
**Additional context:** Shared counters created too many false positives during testing — users would get locked out of SSO due to old password attempts.

## Nice to Have

### 1. How many backup recovery codes should users receive?
**Answer:** 8 single-use codes, downloadable as a text file with clear usage instructions.

### 2. Should password complexity rules apply when SSO coexists?
**Answer:** Yes, keep existing password rules unchanged for non-SSO organizations and during transition periods.

### 3. What level of MFA enrollment guidance should be provided?
**Answer:** In-app wizard with QR codes for authenticator apps, step-by-step SMS verification, and video tutorials linked from the help center.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | JWT tokens will include MFA and SSO status claims | ✅ Correct | Need this for frontend authorization checks |
| 2 | PostgreSQL schema extensions will handle SSO metadata and MFA secrets | ✅ Correct | Keep using existing database architecture |
| 3 | Redis will be used for rate limiting counters | ✅ Correct | Already using Redis for other features |
| 4 | SAML 2.0 takes priority over OpenID Connect | ❌ Wrong | Actually prioritize OpenID Connect — Okta and Azure AD both work better with OIDC. Only fall back to SAML for legacy providers |
| 5 | Organization admins get full control over their org's auth policies | ✅ Correct | This is essential for enterprise sales |
| 6 | System admins have elevated privileges beyond organization admins | ⚠️ Partially | Our customer success team handles escalated support, not "system admins." Keep the hierarchy simple: users → org admins → customer success team |
