# Stakeholder Responses

## Critical Questions
### 1. SSO Provider Downtime Strategy
**Answer:** We need an emergency admin bypass. Complete lockout is too risky - if Okta goes down and we lock out a customer's entire team, we'll lose the account. System admins should have the ability to temporarily disable SSO enforcement for an organization and send users temporary password reset links.
**Additional context:** We should auto-restore SSO enforcement once the provider is back online, and log all bypass usage for security review. Our SLA promises 99.9% uptime, so we can't be dependent on third-party provider availability.

### 2. Audit Log Retention and Access Requirements
**Answer:** 2-year retention minimum for SOX compliance (we have several public company customers). Organization admins need read-only access to their own org's auth events, system admins get full access. We need CSV export capability for compliance reporting.
**Additional context:** Our compliance team specifically requested separation between authentication logs and application logs for auditor access. Some customers are HIPAA-covered entities, so we'll need role-based access controls on the audit interface.

### 3. SMS Provider and Cost Model
**Answer:** Use Twilio - we already have an account for order confirmations. Pay-per-message model where customers get 100 free SMS/month per user, then $0.0075 per message. Global delivery required - we have customers in EU, APAC, and LATAM.
**Additional context:** Finance approved up to $2k/month SMS spend for the first 6 months while usage stabilizes. We should add SMS cost tracking to organization billing dashboards so admins can monitor usage.

## Important Questions
### 1. MFA Recovery Code User Experience
**Answer:** 8 single-use codes displayed during setup with mandatory download as PDF. When down to 2 codes remaining, prompt user to generate new set. Codes should work alongside regular MFA methods, not replace them.
**Additional context:** Support gets daily tickets about locked-out MFA users. Making the codes downloadable reduces support load and gives users something tangible to store securely.

### 2. Rate Limiting Lockout Bypass
**Answer:** Organization admins can unlock users in their org immediately. System admins can unlock anyone. Both actions require reason codes and get audit logged. 15-minute lockout period if no admin intervention.
**Additional context:** Current lockout is 30 minutes with no bypass - customer success escalates these weekly. The 15-minute reduction balances security with user productivity.

### 3. SSO Configuration Admin Interface
**Answer:** Self-service for Okta, Azure AD, and Google Workspace using guided setup wizards. For other SAML providers, customers upload metadata XML files. Include test connection functionality before going live.
**Additional context:** 80% of our enterprise deals are with Okta or Azure AD shops. The remaining 20% have custom SAML setups that our current support team can handle via metadata upload.

### 4. Session Timeout Inheritance and Overrides
**Answer:** Organization setting is the maximum allowed. Users can set shorter timeouts for themselves. Admin and billing role users get separate timeout controls with 8-hour maximum regardless of org setting.
**Additional context:** Our CISO insisted on the admin timeout restriction after the credential stuffing incident. Regular users complained about the blanket 4-hour timeout we implemented as a hotfix.

### 5. Existing User Migration Timeline
**Answer:** Phased rollout over 8 weeks. SSO-eligible orgs get migrated first (weeks 1-4), then MFA promotion to all users (weeks 5-8). In-app banners, email sequence, and optional lunch-and-learn webinars for enterprise customers.
**Additional context:** Customer success wants the webinars to help with enterprise renewals - they can position this as added security value. We should track adoption metrics by organization size and industry.

## Nice to Have
### 1. TOTP Time Synchronization Tolerance
**Answer:** Accept codes from previous and next 30-second windows (3-minute total window). Better to be slightly less secure than lock out users with slow phones.

### 2. Failed Authentication Error Messages
**Answer:** Generic "Invalid login credentials" for password failures, but specific messages for MFA ("Invalid verification code") and SSO ("Contact your IT administrator") to reduce support tickets.

### 3. Performance Benchmarks for New Auth Flows
**Answer:** SSO login must complete within 5 seconds end-to-end. MFA challenges should validate within 2 seconds. These need to work on mobile connections in rural areas where some field users operate.

## Assumptions Review
| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | MFA is optional by default | ✅ Correct | Users can choose to enable unless org enforces |
| 2 | SSO enforcement is all-or-nothing | ⚠️ Partially | We need emergency password fallback during SSO provider outages |
| 3 | Current JWT token structure can be extended | ✅ Correct | Our auth tokens already include org and role claims |
| 4 | SCIM provisioning exclusion | ✅ Correct | That's phase 2, targeting Q1 next year |
| 5 | Admin role MFA deadline applies to users with admin roles in any organization | ❌ Wrong | Security team requirement is specifically for our internal admin users (system admins), not customer org admins |
| 6 | Organization isolation for SSO/MFA policies | ✅ Correct | Each org manages their own auth policies independently |
