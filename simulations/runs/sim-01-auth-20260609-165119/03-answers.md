# Stakeholder Responses

## Critical Questions

### 1. Admin role definition for Q3 MFA mandate
**Answer:** Organization Admins and System Admins must have MFA enabled. Organization Admins are users who can manage their company's settings, users, and billing. System Admins are our internal staff who have cross-organization access.
**Additional context:** We also have "Team Leads" who can manage user permissions within their team, but they're not considered admins for this requirement. The security team was very specific about this after the incident last quarter.

### 2. SSO transition workflow for existing users  
**Answer:** Existing users must re-authenticate via SSO immediately when their organization enables it. No grace period.
**Additional context:** Our enterprise customers specifically requested this behavior. They want immediate enforcement to ensure compliance with their security policies, even if it means some short-term friction during rollout.

### 3. Cross-organization user policy precedence
**Answer:** Most restrictive policy wins across all organizations. If a user belongs to any organization requiring MFA, they must use MFA everywhere.
**Additional context:** This came up during our Acme Corp deal - their employees also consult for smaller companies that don't require MFA, but Acme's security team insisted their users always use MFA regardless of context.

### 4. SSO provider failure fallback strategy
**Answer:** Complete lockout when SSO provider fails. No password fallback for SSO-enabled organizations.
**Additional context:** Security team was adamant about this. They said password fallback defeats the purpose of SSO and creates a persistent attack vector. Better to have downtime than compromised security.

### 5. Rate limiting lockout impact on SSO
**Answer:** Rate limiting should apply to all authentication attempts, including SSO flows, but use a higher threshold for SSO (10 attempts vs 5 for password auth).
**Additional context:** Our Okta integration partner mentioned that some legitimate SSO flows can involve multiple redirects if users have complex identity provider setups.

## Important Questions

### 1. Rate limiting threshold specifics
**Answer:** 5 failed attempts per user in 15 minutes = 1-hour lockout for password auth. 10 attempts for SSO flows. Track both per-user and per-IP, block whichever hits the limit first.
**Additional context:** We had IP-based attacks during the credential stuffing incident, but also need to prevent account enumeration, so both limits are necessary.

### 2. SMS provider and cost management  
**Answer:** Use Twilio. Set a $200 monthly budget per organization, with admins getting alerts at 80% usage.
**Additional context:** Finance pushed back on the $500 number - they want tighter controls since SMS costs can spiral quickly if we get hit with SMS bombing attacks.

### 3. Session timeout warning behavior
**Answer:** Show a 5-minute warning modal with option to extend session. If they don't respond, silent logout.
**Additional context:** Make sure the warning doesn't interrupt critical workflows - no modal during active form submission or file uploads.

### 4. MFA backup codes specification
**Answer:** 8 single-use codes per user. Auto-regenerate new set when only 2 codes remain, and email the user when regeneration happens.
**Additional context:** Customer Success mentioned that 10 codes felt overwhelming to users during beta testing, and users often lose track of how many they've used.

### 5. Audit log retention and access
**Answer:** 2-year retention for compliance. Security Team and Organization Admins can access logs (admins see only their organization). Also give read access to our SOC 2 auditors.
**Additional context:** Legal advised 2 years minimum due to some customer contracts requiring extended audit trails for security incidents.

## Nice to Have

### 1. SCIM provisioning timeline expectations  
**Answer:** No specific timeline commitments, but Enterprise Sales has 3 prospects asking about it for Q4 deals.
**Additional context:** Don't block the current SSO work for SCIM, but keep it on the roadmap for early next year.

### 2. Performance requirements for auth flows
**Answer:** SSO redirect under 3 seconds, MFA challenge under 2 seconds. These are our standard SLA targets.

### 3. Identity provider priority order
**Answer:** Okta and Azure AD first, then Google Workspace (we have several mid-market customers using it).
**Additional context:** OneLogin is lower priority - only one customer has asked for it in the past year.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Backward compatibility is absolute — All existing email/password users can continue using that method indefinitely unless their organization specifically enables SSO | ✅ Correct | This is a hard requirement from existing customers |
| 2 | MFA is user-initiated by default — Individual users can enable MFA voluntarily before any organization-level enforcement | ✅ Correct | Users should be able to opt-in early for better security |
| 3 | Organization admins control SSO config — Not individual users or system admins | ⚠️ Partially | Organization admins configure SSO, but System Admins need override ability for support scenarios |
| 4 | Audit logging is comprehensive — All authentication events are logged, not just successful logins | ✅ Correct | Security team specifically requested failed attempts and MFA challenges be logged |
| 5 | TOTP and SMS are equally supported — No preference between authenticator apps vs SMS codes | ❌ Wrong | We want to encourage TOTP over SMS due to SIM swapping risks. Make TOTP the default option in UI |
