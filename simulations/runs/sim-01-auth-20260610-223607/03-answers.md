# Stakeholder Responses

## Critical Questions

### 1. Admin Role Definition
**Answer:** "Admin-role users" means organization admins, system administrators, and any user with billing or user management permissions within their organization. Basically anyone who can modify settings, add/remove users, or access billing information.
**Additional context:** Our security team was very clear after the credential stuffing incident - anyone with elevated permissions is a target. We'd rather be overly inclusive here since enterprise customers are asking about this anyway.

### 2. SSO Failure Emergency Access
**Answer:** We need a time-limited emergency bypass that organization admins can enable when their IdP is down. Something like a 4-hour window that requires approval from our support team via a verified phone call.
**Additional context:** Two of our largest customers (Fortune 500 accounts) specifically mentioned this as a dealbreaker. They need SSO for compliance but can't risk complete lockouts during outages. The support verification adds enough friction to prevent abuse.

### 3. Existing User Migration Strategy
**Answer:** Current users should continue with password auth until their next login after SSO is enabled, then get guided through a one-time account linking flow. No forced immediate migration.
**Additional context:** Our customer success team pushed hard for this approach. Forced immediate migrations always spike support tickets, and we're already stretched thin with the Q3 deadline.

### 4. Rate Limiting Thresholds
**Answer:** Start conservative - we can't afford another security incident. I'd rather have a few legitimate users temporarily blocked than deal with another breach. Lock out IPs that hit us too aggressively, but make sure VPN/office networks don't get caught.
**Additional context:** Legal is still dealing with fallout from last quarter. The sales team will complain about friction, but security comes first right now.

## Important Questions

### 1. SMS Provider and International Support
**Answer:** Use Twilio for North America and Europe only for now. Our biggest enterprise prospects are US and EU-based. International expansion can wait until we nail the core functionality.
**Additional context:** Finance already has a Twilio contract for other services, so procurement should be straightforward.

### 2. Recovery Code Presentation
**Answer:** Force users to download recovery codes during MFA setup before they can proceed. Display them once, require confirmation they've saved them, then hide them unless regenerated.
**Additional context:** Support is already overwhelmed. We can't have users enable MFA then immediately lock themselves out because they didn't save codes.

### 3. SSO Configuration User Experience  
**Answer:** Start with a technical metadata upload form. Our enterprise customers have technical teams handling this anyway, and a wizard will just slow them down. Add basic connection testing to catch obvious mistakes.
**Additional context:** The Okta and Azure AD customers who requested this are sophisticated - they want control and speed over hand-holding.

### 4. Organization Admin Provisioning
**Answer:** Existing organization admins automatically get SSO configuration rights. No separate provisioning step - that adds unnecessary complexity to the rollout.

## Nice to Have

### 1. SCIM Architecture Preparation
**Answer:** Don't over-engineer for SCIM now. Focus on getting authentication right first. We can handle schema changes when SCIM becomes a priority.

### 2. Audit Log Retention and Access
**Answer:** One year retention, organization admins can view their own org's logs. Basic CSV export is fine for now. We're not SOC2 yet but will be by end of year.

### 3. Session Timeout Granularity
**Answer:** Organization-level configuration only. Role-specific timeouts sound like feature creep that'll complicate the admin UI.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Password auth remains available | ✅ Correct | Organizations need flexibility during transition periods |
| 2 | MFA is per-user opt-in by default | ❌ Wrong | MFA should be opt-out for all users, with org admins able to enforce mandatory. Security team wants higher adoption rates |
| 3 | TOTP and SMS are equal options | ✅ Correct | Let users pick what works for them |
| 4 | JWT tokens continue to be used | ✅ Correct | Don't change what's working |
| 5 | Organization-scoped configuration | ⚠️ Partially | Mostly correct, but session timeouts should have role-based minimums (admins can't exceed 8 hours regardless of org settings) |
