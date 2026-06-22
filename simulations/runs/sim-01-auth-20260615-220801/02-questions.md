# Clarifying Questions

## Critical (must answer before proceeding)

1. **Which roles qualify for the Q3 mandatory MFA mandate?**
   The security team requires MFA for "admin-role users by Q3," but the platform has at least two distinct admin types: Org Admins (customer-side) and Platform Super Admins (internal operators). Does the mandate cover one, the other, or both?
   - _Why it matters:_ The MFA enforcement story's acceptance criteria, scope, and Q3 deadline risk depend entirely on this. A wrong assumption here causes a missed compliance deadline.
   - _Default assumption if unanswered:_ Mandate applies to both Org Admins and Platform Super Admins — any user with `role = admin` in the RBAC model.

2. **When an org enables SSO mid-session, are active user sessions terminated immediately or allowed to expire naturally?**
   An Org Admin turning on forced SSO mid-day would leave existing password-authenticated sessions alive unless they are explicitly killed. Immediate kill is more secure but will log out users without warning.
   - _Why it matters:_ The session management story has a hard branch point here. "Immediate invalidation" and "natural expiry" require different implementation paths and different UX (logout notification vs. none).
   - _Default assumption if unanswered:_ Sessions are invalidated immediately on SSO policy change; users are redirected to login with a clear message.

3. **When org-wide MFA enforcement is turned on, do existing users hit an immediate enrollment wall or get a grace period?**
   Org Admins can enforce MFA for all users. If a 200-person org enables MFA enforcement today, users without MFA set up need a path forward. Is there a grace period (e.g., 7 days), a hard block on next login, or an admin-controlled deadline?
   - _Why it matters:_ Determines the shape of the MFA enforcement UX, the migration story, and whether a "grace period tracking" data model is needed.
   - _Default assumption if unanswered:_ Users without MFA see an enrollment wall on next login (no grace period); Org Admins are warned before enabling enforcement.

4. **What are the rate limiting thresholds: attempt count, lockout duration, and lockout strategy?**
   Given the recent credential stuffing incident, this is marked high priority by the security team — but no numbers are specified. Specifically: (a) how many failed login attempts before lockout? (b) how long is the lockout? (c) is it account lockout, CAPTCHA challenge, or progressive delay?
   - _Why it matters:_ Acceptance criteria for the rate limiting story cannot be written without these numbers. The security team flagged this; they likely have a position.
   - _Default assumption if unanswered:_ 5 failed attempts triggers a 15-minute progressive lockout (exponential backoff); CAPTCHA presented after 3 failures; both IP-level and account-level throttling applied.

5. **Which SMS gateway will be used for SMS OTP?**
   No provider is specified. Options include Twilio, AWS SNS, Vonage, and others — each with different cost structures, international delivery guarantees, and integration effort.
   - _Why it matters:_ The SMS OTP story is blocked until this is decided. International number formatting, delivery SLA, and fallback behavior all depend on the provider.
   - _Default assumption if unanswered:_ SMS OTP story is parked until provider is selected; TOTP proceeds first with SMS as a follow-on.

---

## Important (strongly recommended)

1. **Where are audit logs surfaced, and how long are they retained?**
   The analysis assumes Org Admins get a UI view of their org's logs, but it's unclear whether export (CSV, JSON) is required, whether API access is needed, and what the retention window is (30 days? 1 year? SOC 2 mandated?).
   - _Why it matters:_ Determines whether the audit log story is a single backend-capture story or multiple stories (capture + UI + export + API). Retention period affects storage cost and schema design.
   - _Default assumption if unanswered:_ UI-accessible to Org Admins (org-scoped only); 90-day retention; no export in v1.

2. **Does the backend need a JWT / refresh token rearchitecture before 30-day sessions can ship?**
   The current short-lived JWT model in httpOnly cookies is likely incompatible with 30-day configurable session timeouts without a refresh token rotation strategy. This is a spike candidate — but it needs an architectural decision (sliding window? absolute expiry + silent refresh?) before the session management story can be implementation-ready.
   - _Why it matters:_ If yes, the spike must land before the session management story. If the team already has a plan, the spike can be skipped.
   - _Default assumption if unanswered:_ Treat as a spike story, timebox to 3 days, decide before session management story enters sprint.

3. **Are break-glass or service account exemptions needed from forced SSO enforcement?**
   When an org enables forced SSO, the analysis assumes all org members must use SSO with no exceptions. Some orgs maintain break-glass admin accounts that bypass SSO for emergency access when the IdP is down.
   - _Why it matters:_ If exemptions are needed, the SSO enforcement story requires an exemption management UI and a separate auth path. If not, the story is simpler.
   - _Default assumption if unanswered:_ No exemptions — all org members must use SSO once enforced. Break-glass access is an explicit future story if needed.

4. **What happens when a user exhausts all MFA recovery codes?**
   The analysis assumes 8 single-use codes regeneratable after re-authentication — but if a user has lost their authenticator device AND all recovery codes, they are locked out with no self-service path.
   - _Why it matters:_ Determines whether an admin-assisted account recovery flow (Org Admin or Platform Super Admin unlock) must be part of the MFA stories or deferred.
   - _Default assumption if unanswered:_ Platform Super Admin can manually reset MFA for a user; Org Admin cannot (to prevent social engineering). Recovery flow is in-scope for v1.

5. **Is "Okta and Azure AD support" satisfied by a standard SAML 2.0 / OIDC implementation, or do those customers need custom integration work?**
   SCIM is explicitly deferred, but if the named enterprise customers have non-standard requirements (e.g., Okta's proprietary attribute mappings, Azure AD conditional access policy passthrough), generic SAML/OIDC may not satisfy them.
   - _Why it matters:_ If standard SAML/OIDC suffices, no extra stories are needed. If custom integration is expected, 2–3 additional stories per provider may be required.
   - _Default assumption if unanswered:_ Generic SAML 2.0 + OIDC satisfies the requirement; validate with named customers before sprint planning.

---

## Nice to Have (will use reasonable defaults)

1. **How does an Org Admin configure IdP metadata — XML upload, metadata URL, or manual field entry?**
   The SSO configuration UI story needs a UX approach. Options: paste a metadata URL (easiest for Okta/Azure AD), upload an XML file, or enter fields manually (entity ID, SSO URL, certificate).
   - _Default assumption if unanswered:_ Support all three paths — URL import (primary), XML upload (secondary), manual fields (fallback).

2. **Should the MFA enrollment UI display a security warning about SMS being weaker than TOTP?**
   SMS OTP is susceptible to SIM swapping and SS7 attacks. Many platforms now warn users when choosing SMS over TOTP.
   - _Default assumption if unanswered:_ Display a brief inline warning ("Authenticator apps are more secure than SMS") when the user selects SMS, without blocking the choice.

3. **Should Org Admins receive a notification when MFA enforcement policy is changed in their org?**
   Policy changes (SSO enable, MFA enforce) have immediate user impact. An audit entry is captured, but an email or in-app notification to the Org Admin who made the change (and perhaps co-admins) may be expected.
   - _Default assumption if unanswered:_ Audit log entry only in v1; notification story deferred.

---

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **SCIM is fully out of scope for this phase** — Basis: explicitly stated in requirements. The data model will be designed to accommodate it, but no SCIM API stories will be written.
2. **Existing email/password auth remains available for orgs that have not enabled SSO** — Basis: "Existing email/password auth must continue to work alongside SSO."
3. **TOTP clock skew tolerance is ±1 window (30 seconds)** — Basis: industry standard; no alternative specified.
4. **8 single-use recovery codes, regeneratable after re-authentication** — Basis: reasonable default; no behavioral spec provided.
5. **SSO IdP metadata configuration uses a web UI with XML upload + manual field entry as the primary paths** — Basis: inferred from "org admin self-service" framing; URL import as nice-to-have.
6. **Multi-tenancy audit log isolation is strict: Org Admins see only their org; Platform Super Admins see all** — Basis: only logical split given the role definitions; no cross-org visibility for customer admins.
7. **Rate limiting applies at both the infrastructure layer (nginx/API gateway) and application layer** — Basis: security recommendation given credential stuffing history.
8. **TOTP secrets will be encrypted at rest using platform KMS / envelope encryption** — Basis: security best practice; no key management strategy specified but assumed required.
