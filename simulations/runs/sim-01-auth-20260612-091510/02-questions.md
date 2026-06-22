# Clarifying Questions

## Critical (must answer before proceeding)

1. **SSO Protocol Requirements**
   When you mention "support SAML 2.0 and OpenID Connect" — can organizations choose which protocol to use, or must the platform support both protocols simultaneously for each organization?
   - _Why it matters:_ Affects architecture complexity, development timeline, and testing scope significantly
   - _Default assumption if unanswered:_ Organizations can choose either SAML 2.0 OR OpenID Connect, not both simultaneously

2. **Existing User Migration Strategy**
   How should the 50,000 existing users transition to the new authentication options without service disruption? Should they be required to set up MFA immediately, or is there a grace period?
   - _Why it matters:_ Determines rollout strategy, user communication plan, and potential user churn
   - _Default assumption if unanswered:_ Phased rollout with 60-day grace period for existing users to adopt new auth requirements

3. **SSO Failure Handling Policy**
   When SSO is enabled and "no password fallback" is enforced, what happens if the organization's identity provider is unavailable or SSO authentication fails?
   - _Why it matters:_ Affects business continuity and emergency access procedures
   - _Default assumption if unanswered:_ Temporary password reset available to organization admins during SSO outages

4. **Rate Limiting Specifications**
   What are the acceptable rate limits for authentication endpoints? How many failed attempts before blocking, what's the block duration, and should this be per-IP, per-user, or both?
   - _Why it matters:_ Balances security against legitimate user access; affects user experience
   - _Default assumption if unanswered:_ 5 failed attempts per user per 15 minutes, 15 failed attempts per IP per hour, with exponential backoff

## Important (strongly recommended)

1. **Supported Identity Provider Scope**
   Are Okta and Azure AD the only identity providers that must be supported, or are they examples of a broader set? Do you need generic SAML/OIDC support?
   - _Why it matters:_ Determines development scope and testing matrix
   - _Default assumption if unanswered:_ Start with Okta and Azure AD specifically, generic SAML/OIDC support in future phase

2. **MFA Enforcement Timeline Validation**
   You mentioned "Security team requires MFA for all admin-role users by Q3" — does this override the per-organization MFA policies, and how does it affect the rollout timeline?
   - _Why it matters:_ Could create conflicting requirements and compliance deadlines
   - _Default assumption if unanswered:_ Admin users must enable MFA by Q3 regardless of organization policy

## Nice to Have (will use reasonable defaults)

1. **SMS Geographic Coverage**
   Which countries/regions must be supported for SMS MFA delivery? Is this US/Canada initially, or broader international coverage required?
   - _Why it matters:_ Affects SMS provider selection and compliance requirements
   - _Default assumption if unanswered:_ US and Canada initially, international expansion based on customer demand

2. **Recovery Code Security Requirements**
   Are there specific requirements for MFA recovery codes (number of codes, one-time use, encrypted storage, regeneration frequency)?
   - _Why it matters:_ Affects security implementation and user experience
   - _Default assumption if unanswered:_ 10 one-time use codes, encrypted storage, user-initiated regeneration

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **SSO Configuration Permissions** — Organization admin role with explicit SSO configuration permission can manage SSO settings
2. **Session Timeout Configuration** — Organization admins configure session timeouts via admin panel settings
3. **SSO Metadata Management** — Organizations provide IdP configuration via manual admin UI with metadata upload/URL input  
4. **MFA Enforcement Grace Period** — Existing users get a grace period when MFA is enforced, with admin-controlled deadline
5. **Geographic SMS Coverage** — Initial SMS support for US/Canada, international expansion to be determined later
6. **Recovery Code Policy** — 10 recovery codes per user, one-time use, encrypted storage with user-initiated regeneration
