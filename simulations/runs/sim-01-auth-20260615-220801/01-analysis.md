# Input Analysis

## Summary
The product requires enterprise-grade authentication for a B2B SaaS platform serving ~50k users across ~200 organizations. The scope covers SSO (SAML 2.0 + OIDC), MFA (TOTP + SMS), organization-level policy enforcement, session management, and a comprehensive audit log — layered on top of an existing email/password system.

---

## Identified Features

1. **SSO Integration (SAML 2.0 / OIDC)**
   - Key capabilities: IdP configuration per organization, SAML assertion handling, OIDC token exchange, forced SSO policy (no password fallback when enabled)
   - User roles involved: Org Admin, End User, IT/IdP Administrator (external)

2. **Multi-Factor Authentication (TOTP + SMS)**
   - Key capabilities: TOTP enrollment (QR code + secret), SMS OTP delivery, MFA challenge flow during login, per-user opt-in, org-level enforcement, backup/recovery codes
   - User roles involved: Org Admin, End User

3. **Organization Authentication Policy Management**
   - Key capabilities: Enable/disable SSO per org, enforce MFA for all users or admin-only subset, configure session timeout
   - User roles involved: Org Admin, Platform Super Admin

4. **Session Management**
   - Key capabilities: Configurable timeout per org (24h default, 30d max), JWT lifecycle aligned to timeout, session invalidation on logout/policy change
   - User roles involved: Org Admin, End User

5. **Authentication Audit Logging**
   - Key capabilities: Log login, logout, MFA challenge, SSO assertion, failed attempts; queryable by org/user/event type; retention policy
   - User roles involved: Org Admin, Security Team, Platform Super Admin

6. **Rate Limiting & Brute-Force Protection**
   - Key capabilities: Rate limiting on login, MFA challenge, and password reset endpoints; lockout policy; IP-based and account-based throttling
   - User roles involved: Platform Operations, Security Team

---

## User Roles / Personas

| Role | Description | Key needs |
|------|-------------|-----------|
| End User | Employee of a customer org using the SaaS product | Smooth login via SSO or password, clear MFA enrollment UX, recovery when locked out |
| Org Admin | Customer-side administrator managing their organization | Configure SSO IdP, enforce MFA policy, set session timeout, view audit logs |
| Platform Super Admin | Internal operator of the SaaS platform | Override policies, manage SSO configs across orgs, access all audit logs |
| Security Team (internal) | Denis's internal security function | Enforce MFA for admins by Q3, review auth audit logs, validate rate limiting |
| IT / IdP Administrator | Customer-side Okta/Azure AD/other IdP owner | Configure SAML/OIDC app registration, provide metadata, manage SCIM (future) |

---

## Ambiguities & Missing Context

1. **Which admin roles are subject to mandatory MFA by Q3?** — "Admin-role users" is undefined. Does this mean Org Admins within the product, Platform Super Admins, or both? Determines scope of enforcement story. — *Suggested default: apply to all users with `role = admin` in the platform's RBAC model.*

2. **SSO enforcement granularity** — When an org enables SSO, can individual users be exempted (e.g., break-glass accounts, service accounts)? No mention of exceptions. — *Suggested default: no exemptions; all org members must use SSO once enabled.*

3. **SMS OTP provider** — No SMS gateway is specified. Twilio? AWS SNS? In-house? Affects infrastructure cost, international support, and delivery SLA. — *Must be decided before SMS story is implementation-ready.*

4. **MFA recovery code behavior** — How many backup codes are generated? Are they single-use? Can they be regenerated? What happens when all are consumed? — *Suggested default: 8 single-use codes, regeneratable by user after re-authentication.*

5. **TOTP clock skew tolerance** — Standard is ±1 window (±30s). No explicit requirement stated. — *Suggested default: ±1 TOTP window; document for security review.*

6. **Audit log access surface** — Are audit logs exposed in the product UI (to Org Admins)? Via API only? Export capability? Retention period? — *Suggested default: UI-accessible to Org Admins for their org; no cross-org visibility; retention TBD.*

7. **Session invalidation on policy change** — If an org admin enables SSO mid-day, are existing active sessions terminated immediately or allowed to expire naturally? — *High security impact; no guidance given.*

8. **Okta / Azure AD specificity** — Are these IdPs calling for custom integration work beyond standard SAML/OIDC, or is "support" satisfied by a generic SAML 2.0 / OIDC implementation? SCIM is deferred, but Okta's SCIM dependency may affect the SSO implementation shape. — *Suggested default: generic SAML 2.0 + OIDC is sufficient; validate with those customers.*

9. **Rate limiting specifics** — No thresholds defined: how many failed attempts before lockout? Lockout duration? Account lockout vs. CAPTCHA vs. progressive delay? — *Must be defined; security team flagged this as a priority.*

10. **MFA enrollment for existing users** — When org-level MFA enforcement is turned on, do existing sessions get a grace period or an immediate MFA enrollment wall? What's the enrollment grace period? — *Undefined; affects user experience design significantly.*

11. **JWT token strategy under extended sessions** — With configurable timeout up to 30 days, refresh token rotation strategy needs definition. Current short-lived JWTs in httpOnly cookies may need rearchitecting for long-lived sessions. — *Technical risk; needs backend architecture decision.*

12. **SSO metadata management** — How does an Org Admin upload/configure IdP metadata (XML upload? URL? manual field entry)? Is there a UI for this? — *UX gap; not described.*

---

## Gap Analysis

| # | Input Gap | What Was Unclear | Resolution | Impact on Stories |
|---|-----------|-----------------|------------|-------------------|
| G-1 | "MFA for all admin-role users by Q3" | Which roles qualify as "admin" — org admin, platform super admin, or both | **Asked:** Clarifier should confirm scope of admin MFA mandate | Admin MFA enforcement story cannot be finalized until resolved |
| G-2 | SSO enforcement: "users must use SSO (no password fallback)" | Whether break-glass or service account exemptions exist | **Assumed:** No exemptions; all org members must use SSO | SSO enforcement story written without exemptions; add exemption story if needed post-validation |
| G-3 | "SMS codes" — no SMS provider specified | Which SMS gateway to use; international support; cost | **Deferred:** Must be decided before SMS implementation story | SMS OTP story blocked until provider is chosen |
| G-4 | "backup recovery codes" — no behavioral spec | Count, single/multi-use, regeneration, exhaustion behavior | **Assumed:** 8 single-use codes, regeneratable after re-auth | Recovery code story uses these defaults; security team must validate |
| G-5 | TOTP clock skew | No tolerance window specified | **Assumed:** ±1 TOTP window (30s) — industry standard | TOTP validation story; security team should sign off |
| G-6 | Audit log access surface | UI vs API, org admin visibility, retention period | **Deferred:** Retention period and export format must be decided | Audit log stories will implement event capture; UI and retention scope split into separate stories pending decision |
| G-7 | Session invalidation on SSO/policy change | Immediate kill vs. natural expiry when policy changes mid-session | **Asked:** Clarifier should get security team ruling | Session management story has a branch point here; cannot finalize without answer |
| G-8 | Okta / Azure AD "support" | Whether standard SAML/OIDC suffices or custom integration needed | **Assumed:** Generic SAML 2.0 + OIDC satisfies requirement; to be validated with named customers | If assumption is wrong, additional integration stories needed |
| G-9 | Rate limiting thresholds | No numbers given for attempt limits, lockout duration, or strategy | **Deferred:** Security team must define thresholds before implementation | Rate limiting story cannot be acceptance-criteria-complete without these numbers |
| G-10 | MFA enforcement rollout for existing users | Grace period? Immediate enrollment wall? Duration? | **Asked:** Clarifier should get product owner ruling | MFA enforcement story UX and migration story depend on this decision |
| G-11 | JWT / refresh token strategy for 30-day sessions | Current short-lived JWT model may be architecturally incompatible with 30-day max | **Deferred:** Backend architect must decide before session management story is implemented | Session management story has a technical prerequisite; flag as spike candidate |
| G-12 | SSO IdP metadata configuration UX | How org admins input SAML/OIDC metadata — UI not described | **Assumed:** Web UI with XML upload + manual field entry; URL import as nice-to-have | SSO configuration story written with this UX assumption |

**Unresolved gaps:** 5 (G-1, G-3, G-6 partial, G-7, G-9, G-10, G-11 — must be resolved before stories are implementation-ready)
**Resolved by assumption:** 5 (G-2, G-4, G-5, G-8, G-12 — require stakeholder validation)

---

## Technical Considerations

- **JWT + httpOnly cookie + long sessions:** Current architecture uses short-lived JWTs in httpOnly cookies. Supporting 30-day sessions requires a refresh token rotation strategy (sliding window or absolute expiry with silent refresh). This is a non-trivial rearchitecting risk — recommend a spike story.
- **SAML 2.0 library choice:** Node.js has `node-saml` and `passport-saml`; evaluate maturity and CVE history. OIDC can use `openid-client`. Both need to handle IdP-initiated vs SP-initiated flows.
- **Database schema impact:** New tables needed for: `sso_configurations` (per org), `mfa_enrollments` (per user, per method), `recovery_codes`, `auth_audit_log`, `session_policies`. Migration plan required for 50k users.
- **SCIM future-proofing:** SCIM is explicitly out of scope, but the SSO configuration and user provisioning data model should be designed to accommodate it. Add a note to the SSO config story to avoid blocking future SCIM work.
- **SMS OTP security:** SMS is a known weak MFA method (SIM swapping, SS7 attacks). Consider whether to display a UI warning to users; security team should weigh in.
- **Rate limiting implementation:** Given the credential stuffing incident, rate limiting should be applied at the infrastructure layer (e.g., nginx, API gateway) in addition to application-layer logic to avoid bypass via direct connection.
- **Multi-tenancy isolation:** Audit logs, SSO configs, and MFA policies must be strictly scoped per `organization_id`. Any cross-org data leakage would be a critical security incident.
- **TOTP secret storage:** TOTP secrets must be encrypted at rest. Define key management strategy (KMS, envelope encryption).

---

## Suggested Feature Decomposition

**Priority 1 — Security foundation (unblocks Q3 mandate)**
1. Rate Limiting & Brute-Force Protection (unblocks all auth endpoints; addresses incident)
2. MFA Enrollment: TOTP (TOTP is lower risk than SMS; no external dependency)
3. MFA Enforcement: Admin Role Mandate (security team Q3 deadline)
4. MFA: Recovery Codes

**Priority 2 — SSO core (drives enterprise sales)**
5. SSO Configuration UI (org admin self-service IdP setup)
6. SSO: SAML 2.0 SP-initiated flow
7. SSO: OIDC flow
8. SSO: Forced SSO policy enforcement per org

**Priority 3 — MFA expansion & policy**
9. MFA: SMS OTP (blocked on provider decision)
10. MFA Enforcement: Org-wide policy (blocked on grace period decision)
11. Session Management: Configurable timeout per org (blocked on JWT strategy spike)

**Priority 4 — Observability & compliance**
12. Authentication Audit Log: Event capture
13. Authentication Audit Log: Org Admin UI / export

**Spike (before Priority 3)**
- JWT / refresh token strategy for extended sessions
