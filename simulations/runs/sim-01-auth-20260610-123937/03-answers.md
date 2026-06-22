# Stakeholder Responses

## Critical Questions

### 1. SSO configuration workflow and approval process
**Answer:** Organization admins should be able to self-configure SSO through the UI with immediate activation. No approval workflow needed.
**Additional context:** We want to reduce friction for enterprise customers and minimize support tickets. However, we should require email verification of the SSO configuration before it goes live, and send a notification to all org admins when SSO is enabled.

### 2. User account migration when SSO is enabled
**Answer:** Automatic account linking by email address, but require users to verify the link via email confirmation on their first SSO login.
**Additional context:** This gives us the smoothest user experience while maintaining security. If email verification fails or if there's no matching email, users should be able to manually link their accounts through a support process.

### 3. SSO protocol implementation priority
**Answer:** Start with SAML 2.0 only. Add OpenID Connect in the next release cycle.
**Additional context:** Our enterprise customers specifically mentioned Okta and Azure AD, and both have excellent SAML support. OIDC can wait until Q4 - it's more important to get SAML rock-solid first.

### 4. SMS provider selection and ownership
**Answer:** Use Twilio, company-paid. Don't pass SMS costs to customers.
**Additional context:** SMS costs are minimal compared to our subscription revenue, and making customers set up their own SMS provider creates unnecessary friction. Twilio has the best international coverage and reliability in my experience.

### 5. Rate limiting specifications for credential attacks
**Answer:** 3 failed login attempts per IP per minute, 5 failed attempts per user account per hour, with exponential backoff.
**Additional context:** Make it more aggressive than the default assumption. After that credential stuffing attack, security is our top priority. Legitimate users rarely fail login 3+ times in a minute.

## Important Questions

### 1. MFA enforcement timeline for admin users
**Answer:** 14-day grace period after deployment for existing admin users to enable MFA, then enforce strictly.
**Additional context:** Two weeks is enough time for admins to set up MFA but not so long that we miss the Q3 security deadline. Send email reminders at 14, 7, 3, and 1 day before enforcement begins.

### 2. Audit log retention and access controls
**Answer:** 3-year retention for audit logs. Organization admins see their org's authentication events only. System admins see everything.
**Additional context:** Some of our larger enterprise customers have compliance requirements that go beyond 2 years. Storage cost difference between 2 and 3 years is minimal for log data.

### 3. Recovery code specifications
**Answer:** 8 single-use codes in "XXXX-XXXX" format. Users can regenerate once per 24-hour period.
**Additional context:** The 24-hour regeneration limit prevents abuse while still allowing users to refresh codes if they lose them. Make sure the UI clearly warns that old codes become invalid when regenerating.

### 4. Billing implications for SSO/MFA features
**Answer:** No pricing changes. These are security features that should be available to all customers.
**Additional context:** This is a competitive necessity, not a revenue opportunity. Our competitors offer SSO as standard, and the recent security incident makes MFA a must-have for customer trust.

## Nice to Have

### 1. International SMS coverage requirements
**Answer:** Start with US, Canada, UK, Australia, and EU. Expand based on customer requests.
**Additional context:** This covers 95% of our current customer base. We can add other regions in future releases if customers specifically request them.

### 2. Error message specificity for failed authentication
**Answer:** Generic error messages for end users ("Authentication failed, please try again"), but detailed error codes in logs for admin troubleshooting.
**Additional context:** Include a link to help documentation in error messages. Users should be able to self-serve common issues like expired passwords or MFA setup problems.

### 3. Session management during SSO transition
**Answer:** Allow existing sessions to run for up to 7 days after SSO enforcement is enabled, then require SSO login.
**Additional context:** This gives users a reasonable window to complete their current work without disruption while still enforcing the new security policy quickly.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Both TOTP and SMS MFA will be implemented simultaneously | ✅ Correct | Yes, we need both options to accommodate different user preferences |
| 2 | Organization-level SSO configuration rather than system-wide | ✅ Correct | Each customer needs to configure their own identity provider |
| 3 | JWT token architecture will remain unchanged | ✅ Correct | No reason to change what's working |
| 4 | SCIM provisioning is definitely out of scope for this phase | ⚠️ Partially | Out of scope for implementation, but make sure SSO design can accommodate SCIM later |
| 5 | Rate limiting will be implemented at the application level | ❌ Wrong | Use both application-level AND infrastructure-level protection. We need defense in depth after the security incident |
| 6 | Okta and Azure AD are the priority SSO providers | ✅ Correct | These are what our enterprise customers specifically requested |
