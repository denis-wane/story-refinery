# Stakeholder Responses

## Critical Questions

### 1. Account linking strategy for SSO users
**Answer:** Auto-link by email address, but only if the email domain matches the organization's verified domain. If there's a mismatch, create a new account and require admin to manually merge if needed.
**Additional context:** We've had issues with email spoofing before, so domain verification is non-negotiable. Our enterprise customers specifically mentioned this as a security requirement during the sales process.

### 2. SSO transition strategy for existing users
**Answer:** 14-day grace period where both methods work, then hard cutover. Send email notifications at 14 days, 7 days, 3 days, and 1 day before cutover.
**Additional context:** 30 days is too long - our security team wants faster transitions after the credential stuffing incident. Two weeks gives users time to adapt without leaving us exposed.

### 3. SSO provider downtime fallback behavior
**Answer:** Complete lockout with clear error message and automatic admin notification via email and in-app alert. No password fallback once SSO is enforced.
**Additional context:** Our biggest enterprise customers would rather have temporary downtime than security gaps. They've explicitly told us "when in doubt, lock it down."

### 4. Rate limiting thresholds and escalation
**Answer:** 3 attempts per user per 10 minutes, 20 attempts per IP per hour. Use progressive delays: 1 second, 5 seconds, 30 seconds, then 5-minute lockout.
**Additional context:** Make the IP limit organization-aware - don't penalize Company A because Company B's users are having issues from the same office building.

### 5. SSO configuration interface and ownership
**Answer:** Self-service web interface with guided setup wizard. Include metadata file upload, manual field entry option, and test connection button before going live.
**Additional context:** Our support team is already overwhelmed, so this needs to be self-service. But provide good validation and testing tools - bad SSO config is our #1 support ticket source with competitors.

## Important Questions

### 1. Audit log retention and compliance requirements
**Answer:** 2-year retention minimum, SOC2 and GDPR compliance required. Provide JSON export via admin UI and API endpoint for security teams.
**Additional context:** Legal just updated our data retention policy. Some customers in healthcare are asking about HIPAA compliance too, but that's not a requirement for this phase.

### 2. SMS provider selection and cost constraints
**Answer:** Twilio integration. $200/month cap per organization for SMS costs. If they hit the cap, disable SMS MFA for new enrollments but keep existing users working.
**Additional context:** International coverage for US, Canada, UK, and Australia. Most of our enterprise customers have global teams in those regions.

### 3. MFA device loss recovery process
**Answer:** Self-service via recovery codes only. Organization admins can disable MFA for a user after email verification to both user and admin email addresses.
**Additional context:** Include a "I lost my device" link on the MFA screen that clearly explains the recovery code process. Users forget they have recovery codes.

### 4. MFA enforcement granularity validation
**Answer:** Start with organization-wide enforcement, but add role-based enforcement for this phase. At minimum: enforce for Admin and Owner roles always, configurable for other roles.
**Additional context:** Three customers specifically asked for "admins must use MFA but regular users optional" during the requirements gathering. It's table stakes for enterprise.

### 5. Admin notification requirements
**Answer:** Email notifications for: SSO config changes, 5+ failed authentication attempts from same user in 1 hour, MFA disabled by admin. Include webhook option for customers using SIEM tools.
**Additional context:** Don't spam admins with routine activity. Focus notifications on security-relevant events and configuration changes only.

## Nice to Have

### 1. Recovery code specifications validation
**Answer:** 8 single-use codes, auto-prompt to regenerate when 2 remain. No expiration dates - codes stay valid until used or manually regenerated.
**Additional context:** 10 codes feels like too many to manage. 8 is enough for safety but not overwhelming to print/store securely.

### 2. Session timeout behavior validation
**Answer:** Hard logout with 5-minute warning popup. Include "extend session" button in the warning that gives another full session period.
**Additional context:** Users hate losing work due to timeouts. The extend button prevents most complaints while still enforcing security policies.

### 3. SSO provider prioritization
**Answer:** Focus testing and docs on Okta, Azure AD, and Google Workspace. These cover 80% of our enterprise prospects.
**Additional context:** Okta and Azure AD are must-haves. Google Workspace is increasingly requested by smaller companies upgrading to enterprise plans.

### 4. Progressive MFA rollout timeline
**Answer:** Admin/Owner roles enforced by Q3 deadline. Then roll out organization-by-organization based on customer success team recommendations, targeting Q4 completion.
**Additional context:** Let Customer Success identify which organizations are ready vs. which need more hand-holding. We can't afford to churn customers over security changes.

### 5. Audit log export formats
**Answer:** JSON export via admin UI is sufficient for initial version. Add CSV option if customers request it after launch. No real-time streaming yet.
**Additional context:** Most enterprise security teams already have JSON parsing tools. Start simple and add complexity based on actual usage patterns.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | MFA enforcement is organization-wide only | ❌ Wrong | Need role-based enforcement, especially for admin roles |
| 2 | Recovery codes are single-use with auto-regeneration | ✅ Correct | 8 codes instead of 10, regenerate at 2 remaining instead of 3 |
| 3 | Session timeout causes immediate logout | ⚠️ Partially | Hard logout is correct, but add 5-minute warning with extend option |
| 4 | Rate limiting applies to all auth endpoints equally | ✅ Correct | Same limits across all auth endpoints |
| 5 | Account linking happens automatically by email | ⚠️ Partially | Auto-link by email, but only for verified organizational domains |
| 6 | SMS MFA has no international restrictions | ❌ Wrong | Limit to US, Canada, UK, Australia initially |
| 7 | SSO configuration is self-service | ✅ Correct | Self-service with good validation and testing tools |
| 8 | Audit logs include all auth events equally | ✅ Correct | Log everything, but notifications only for security-relevant events |
