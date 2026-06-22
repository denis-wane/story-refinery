# Stakeholder Responses

## Critical Questions

### 1. Admin MFA enforcement timing and rollout
**Answer:** Phased rollout with 30-day advance notice. We'll notify all admin users when the feature launches, give them 30 days to set up MFA, then enforce it. No exceptions after that.
**Additional context:** We learned from the credential stuffing incident that we need to be firm on security deadlines. The security team is breathing down our necks on this Q3 commitment, and our board wants to see concrete progress after that breach.

### 2. SSO provider failure and emergency access
**Answer:** No fallback during provider outages. Hard enforcement with no emergency bypass.
**Additional context:** This was a tough call, but our enterprise customers actually prefer this approach. They'd rather have their team unable to access the app than have a potential security hole. We'll document this clearly in our SLAs and suggest customers have backup admin access through a different provider if needed.

### 3. Existing user transition to SSO-enabled organizations
**Answer:** Automatic email-based linking, but require the user to verify ownership of their corporate email during their first SSO login. If emails don't match exactly, we'll provide a one-time manual linking process through customer support.
**Additional context:** We've seen this pain point with other enterprise features. Most of our customers use corporate email domains, so exact matching should work for 95% of cases.

## Important Questions

### 4. SMS provider and international requirements
**Answer:** Go with Twilio, US/Canada only for now. Budget cap at $800/month for the first year.
**Additional context:** About 80% of our enterprise users are North America-based. We can add international support in Q1 2027 once we see actual usage patterns and have a better sense of costs.

### 5. SSO configuration experience
**Answer:** Self-service with a guided setup wizard, but include an "assisted setup" option that creates a support ticket for customers who need help.
**Additional context:** Our enterprise customers have varying technical skill levels. Some have dedicated IT teams, others just have one person handling everything. The wizard should be simple enough for the latter group.

### 6. Audit log retention and compliance requirements
**Answer:** 2-year retention for authentication events, CSV and JSON export options. We need SOC 2 Type II compliance.
**Additional context:** We're planning our SOC 2 audit for next spring, and auth logs are a key control. Some of our healthcare customers have also asked about longer retention, so 2 years covers both needs.

## Nice to Have

### 7. Authentication error handling specifics
**Answer:** For SSO-enabled organizations, disable password reset entirely. Account lockouts must be resolved through the organization admin or our support team.
**Additional context:** Consistency is key here. If an org has chosen SSO enforcement, we shouldn't provide backdoors that could confuse users or create security gaps.

### 8. Testing SSO integrations during development
**Answer:** Use Auth0's free tier for OIDC testing and set up a basic SAML test environment. Don't over-engineer this.
**Additional context:** Our engineering team tends to overthink testing infrastructure. Keep it simple—we just need to verify the happy path works and can handle basic error scenarios.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Recovery codes: 10 single-use backup codes generated per user, user can regenerate on demand | ✅ Correct | Standard approach, no issues here |
| 2 | Rate limiting: 5 failed attempts per IP address per 15 minutes with exponential backoff | ❌ Wrong | Make it 3 attempts per 10 minutes. We need to be more aggressive after last quarter's incident |
| 3 | Session timeout control: Organization-level setting only, individual users cannot override their org's policy | ✅ Correct | This is exactly what enterprise customers expect |
| 4 | OIDC/SAML flows: Authorization Code flow for OpenID Connect, HTTP-POST binding for SAML | ⚠️ Partially | Authorization Code is correct, but also support HTTP-Redirect binding for SAML. Some of our Okta customers prefer it |
