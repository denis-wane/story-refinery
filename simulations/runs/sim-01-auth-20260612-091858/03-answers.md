# Stakeholder Responses

## Critical Questions

### 1. SSO Provider Support Beyond Okta/Azure AD
**Answer:** Start with Okta and Azure AD only for the initial release. These cover 80% of our enterprise prospects based on sales feedback.
**Additional context:** We can add Google Workspace and OneLogin in Q4 if needed, but let's validate the architecture first. The sales team has three deals worth $400k ARR waiting specifically on Okta integration, so that's the priority.

### 2. MFA Recovery Process for Lost Devices
**Answer:** Organization admins should be able to reset MFA for their users, forcing re-enrollment. No self-service recovery initially.
**Additional context:** Our support team is already overwhelmed, and most enterprise customers prefer admin-controlled recovery for security reasons. We can add backup codes as a secondary recovery method, but admin reset is the primary path.

### 3. SSO Failure Fallback Behavior
**Answer:** Show a clear error message with retry option. For SSO-enforced organizations, users should be completely blocked from password fallback.
**Additional context:** The security team was very clear on this — if an organization enforces SSO, we cannot allow password bypass even during provider outages. Better to have a brief outage than compromise the security model.

### 4. Admin Interface Integration
**Answer:** Integrate into existing organization settings page within the main application. Add a new "Authentication & Security" section.
**Additional context:** Don't create a separate admin portal — our customers already complain about too many interfaces to manage. Keep it simple and in the main app where they're already doing user management.

### 5. MFA Enforcement Rollout Timing
**Answer:** Enforce at next login with a 14-day grace period for enrollment, not 7 days.
**Additional context:** Our customer success team requested longer grace period based on feedback from the email verification rollout last year. Users need time to download authenticator apps and coordinate with IT departments.

## Important Questions

### 1. Rate Limiting Thresholds
**Answer:** 5 failed password attempts = 30-minute lockout. 3 failed MFA attempts = 10-minute lockout. No limits on SSO redirects.
**Additional context:** Make sure legitimate users aren't locked out too easily, but the security team wants stronger protection after our credential stuffing incident. The 30-minute lockout should deter automated attacks without being too punitive.

### 2. Browser and Device Compatibility Requirements
**Answer:** Support Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. Mobile responsive design required. WCAG 2.1 AA compliance is mandatory.
**Additional context:** We've had enterprise customers specifically ask about accessibility compliance for government contracts. Don't support Internet Explorer — we officially deprecated it last quarter.

### 3. MFA Enrollment User Experience
**Answer:** QR code with manual entry fallback. Show an in-app enrollment wizard. Mandatory enrollment for users in MFA-enforced organizations at next login.
**Additional context:** Include clear instructions for downloading authenticator apps. Our user research showed QR codes work well, but older users sometimes prefer manual entry. Keep the wizard simple — 3 steps maximum.

### 4. Session Invalidation Triggers
**Answer:** Invalidate sessions on password changes, MFA policy changes, and admin-initiated logout. Also add organization-wide logout for security incidents.
**Additional context:** The security team needs the ability to kill all sessions for an organization if they detect a breach. This should be a separate admin action from normal policy changes.

## Nice to Have

### 1. Audit Log Retention and Access
**Answer:** 12-month retention, not 90 days. Organization admins get read access plus CSV export. Security team gets cross-organization reporting dashboard.
**Additional context:** Legal department requires longer retention for compliance audits. The security team also needs to see patterns across organizations to detect credential stuffing attacks.

### 2. SSO Configuration Ownership Model
**Answer:** Self-service configuration with a guided setup wizard. Provide clear documentation and video tutorials.
**Additional context:** Customer success can assist if needed, but most enterprise IT teams prefer to configure this themselves. Build good validation and error messages so they don't need to contact support.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | JWT enhancement acceptable | ✅ Correct | Our mobile apps and API integrations already handle JWT changes gracefully |
| 2 | Database schema changes approved | ✅ Correct | Infrastructure team has capacity and migration tools ready |
| 3 | Standard TOTP implementation | ✅ Correct | Google Authenticator compatibility is a hard requirement from customers |
| 4 | Organization-scoped policies | ❌ Wrong | We need global admin override policies for the security team to enforce MFA on all admin users regardless of organization settings |
| 5 | Existing user migration | ✅ Correct | Gradual migration is important — can't force all users to enroll immediately |
| 6 | Security team admin access | ⚠️ Partially | Security team needs cross-organization visibility but not admin rights to individual organizations — separate read-only security dashboard instead |
