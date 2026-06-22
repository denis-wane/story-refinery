# Stakeholder Responses

## Critical Questions

### 1. SSO Protocol Requirements
**Answer:** Organizations can choose either SAML 2.0 OR OpenID Connect - not both simultaneously. Most of our enterprise prospects are asking for SAML 2.0 specifically, but some prefer OIDC for simpler setup.
**Additional context:** Our sales team says about 70% of enterprise deals involve SAML requirements, so let's prioritize that in the UI flow. Also, we should probably document which protocol we recommend for different IdP setups.

### 2. Existing User Migration Strategy  
**Answer:** Phased rollout with a 90-day grace period for existing users. We'll start with new organizations only, then gradually migrate existing ones with plenty of advance notice.
**Additional context:** Customer Success wants at least 2 weeks notice before any auth changes hit existing paying customers. We learned that lesson during the billing system migration last year.

### 3. SSO Failure Handling Policy
**Answer:** Organization super-admins get emergency password reset capability during SSO outages. This should be a special admin role separate from regular org admins, and we'll audit these emergency accesses heavily.
**Additional context:** Legal wants a clear audit trail for emergency access - every use should trigger an email to the organization's designated contact and our internal security team.

### 4. Rate Limiting Specifications
**Answer:** 3 failed attempts per user per 10 minutes, 20 failed attempts per IP per hour. After user lockout, require either MFA challenge (if enabled) or email verification to unlock.
**Additional context:** Make the lockout messaging very clear - we got complaints during the last security incident because users didn't understand why they were blocked.

## Important Questions

### 1. Supported Identity Provider Scope
**Answer:** Start with Okta and Azure AD with full testing and documentation. Build generic SAML/OIDC support but only test against those two initially. 
**Additional context:** Three specific customers (TechCorp, DataSystems, and MegaBank) are waiting on Okta integration for deals worth $400k ARR combined. Azure AD covers most of our Microsoft-heavy prospects.

### 2. MFA Enforcement Timeline Validation
**Answer:** Yes, the security team requirement overrides organization policies for admin users. All users with admin roles must have MFA enabled by July 15th, regardless of their organization's MFA policy.
**Additional context:** This is non-negotiable from the security team after the audit findings. We need to build in compliance reporting so we can prove to auditors that all admins have MFA.

## Nice to Have

### 1. SMS Geographic Coverage
**Answer:** US, Canada, and UK initially. That covers 85% of our current customer base.
**Additional context:** Customer Success says we have three UK enterprise customers asking about MFA, so let's include them in the initial launch rather than making them wait.

### 2. Recovery Code Security Requirements
**Answer:** 8 one-time use codes, encrypted storage, user can regenerate anytime. Codes should be downloadable as a text file when generated.
**Additional context:** Support gets questions about recovery codes pretty frequently with other tools - let's make sure the download/print experience is foolproof.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Organization admin role with explicit SSO configuration permission can manage SSO settings | ✅ Correct | This matches our existing admin permission structure |
| 2 | Organization admins configure session timeouts via admin panel settings | ✅ Correct | Should be in the same place as other org security settings |
| 3 | SSO Metadata Management — Organizations provide IdP configuration via manual admin UI with metadata upload/URL input | ❌ Wrong | We need both metadata upload AND guided setup wizards for Okta/Azure AD. Most admins struggle with raw metadata files |
| 4 | MFA Enforcement Grace Period — Existing users get a grace period when MFA is enforced, with admin-controlled deadline | ⚠️ Partially | Admin-controlled deadline is correct, but we need system-wide minimums. Admins can't set deadlines longer than 90 days for security compliance |
| 5 | Geographic SMS Coverage — Initial SMS support for US/Canada, international expansion to be determined later | ⚠️ Partially | As noted above, we need UK included in initial launch |
| 6 | Recovery Code Policy — 10 recovery codes per user, one-time use, encrypted storage with user-initiated regeneration | ✅ Correct | Though I prefer 8 codes as noted above - 10 feels like overkill |
