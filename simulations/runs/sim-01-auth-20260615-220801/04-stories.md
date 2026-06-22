# Story Decomposition

---

## Spike

### SPIKE-AUTH-01: JWT / Refresh Token Architecture for 30-Day Sessions

**As a** backend engineer,
**I want** a confirmed, time-boxed design for refresh token rotation that supports sessions up to 30 days,
**so that** the session management story can be implemented without architectural rework mid-sprint.

**Scope:**
- In: Evaluate whether the current httpOnly-cookie JWT approach can support configurable timeouts up to 30 days; document options (sliding window refresh rotation, absolute expiry with silent refresh, etc.); produce an ADR with a recommendation; include token revocation approach (to support session invalidation on policy change)
- Out: Implementation of the chosen strategy (that is SESSION-01)

**Dependencies:** None — this is the prerequisite for SESSION-01
**Priority:** P1
**Size estimate:** S (3-day timebox; output is a document + ADR, not code)

---

## Infrastructure

### INFRA-AUTH-01: Authentication Database Schema Migration

**As a** platform engineer,
**I want** the new authentication tables created and migrated safely on the production database,
**so that** all auth feature stories have the schema they depend on without risk to the existing 50k-user dataset.

**Scope:**
- In: Create tables: `sso_configurations` (per org, SCIM-compatible columns reserved for future), `mfa_enrollments` (per user, per method), `recovery_codes` (single-use, hashed), `auth_audit_log` (partitioned by org and date for 1-year retention), `session_policies` (per org), `break_glass_accounts` (per org); add `mfa_required`, `sso_enforced`, `grace_period_ends_at` columns to organizations table; add `billing_access` role flag to users; write reversible migrations with rollback tested on a staging copy of prod data; document index strategy for audit log queries (org_id + event_type + timestamp)
- Out: Application code changes, backfilling data, changes to existing tables beyond the new columns listed above

**Dependencies:** None
**Priority:** P1
**Size estimate:** M

---

## Feature: Rate Limiting & Brute-Force Protection

### RATE-01: Application-Layer Rate Limiting on Auth Endpoints

**As a** security team member,
**I want** account-level and IP-level throttling enforced at the application layer on login, MFA challenge, and password reset endpoints,
**so that** credential stuffing and brute-force attacks are blocked even when traffic is distributed across multiple IPs.

**Scope:**
- In: 5 failed attempts per account → 15-minute lockout (account-level); IP-level throttling as a secondary control (same 5/15min thresholds); CAPTCHA challenge surfaced to the frontend after 3 failures (before lockout); lockout state stored in Redis (or equivalent fast store) keyed by account ID and IP; lockout events written to audit log; lockout applies to: `/auth/login`, `/auth/mfa/challenge`, `/auth/password/reset`; automatic unlock after 15 minutes (no manual admin action required for standard lockout)
- Out: Admin-triggered account unlock flow (that is a support/admin story), infrastructure-layer rate limiting (RATE-02), changes to other endpoints

**Dependencies:** INFRA-AUTH-01 (audit log table)
**Priority:** P1
**Size estimate:** M

---

### RATE-02: Infrastructure-Layer Rate Limiting

**As a** platform operations engineer,
**I want** rate limiting enforced at the nginx / API gateway layer before requests reach the application,
**so that** direct connections that bypass the application server cannot circumvent account-level throttling, as occurred in the credential stuffing incident.

**Scope:**
- In: Configure nginx (or API gateway) rate limiting rules on the same three auth endpoints covered by RATE-01; IP-level request rate cap (align thresholds with RATE-01); return 429 with `Retry-After` header; configuration is code-reviewed and version-controlled (not manual nginx edit)
- Out: Application-layer changes (RATE-01), changes to non-auth routes

**Dependencies:** RATE-01 (thresholds defined there, replicated here)
**Priority:** P1
**Size estimate:** S

---

## Feature: Multi-Factor Authentication (TOTP + SMS)

### MFA-01: TOTP Enrollment for End Users

**As an** end user,
**I want** to enroll my authenticator app (Google Authenticator, Authy) as an MFA method,
**so that** I can secure my account with a time-based one-time password.

**Scope:**
- In: Enrollment flow: generate TOTP secret, display QR code and plaintext secret, require user to enter one valid TOTP code to confirm enrollment before activation; TOTP secret encrypted at rest using AES-256 with key stored in AWS Secrets Manager; ±1 window clock skew tolerance (±30 seconds); enrollment state persisted in `mfa_enrollments` table; user can have only one TOTP method active at a time (re-enrollment replaces the previous secret after re-authentication); enrollment event written to audit log
- Out: MFA challenge at login (MFA-02), recovery codes (MFA-05), org-level enforcement (POLICY-01, POLICY-02)

**Dependencies:** INFRA-AUTH-01
**Priority:** P1
**Size estimate:** M

---

### MFA-02: TOTP Login Challenge Flow

**As an** end user who has enrolled TOTP,
**I want** to be challenged for my TOTP code after entering my credentials,
**so that** my account requires a second factor to authenticate.

**Scope:**
- In: Post-credential-verification step in the login flow: if user has TOTP enrolled (or MFA is enforced for their role/org), present TOTP challenge screen; validate TOTP code with ±1 window tolerance; mark used TOTP windows to prevent replay within the same window; on success, issue session token; on failure, apply rate limiting (RATE-01 thresholds); allow fallback to recovery codes from the TOTP challenge screen (link to recovery code flow); MFA challenge event written to audit log
- Out: MFA enrollment (MFA-01), SMS OTP challenge (MFA-04), enforcement policy (POLICY-01)

**Dependencies:** MFA-01, RATE-01, INFRA-AUTH-01
**Priority:** P1
**Size estimate:** S

---

### MFA-03: SMS OTP Enrollment via Twilio

**As an** end user,
**I want** to enroll my phone number as an MFA method using SMS one-time passwords,
**so that** I have an alternative to an authenticator app if I don't have one available.

**Scope:**
- In: Enrollment flow: user enters phone number, Twilio sends a 6-digit OTP, user confirms OTP to activate enrollment; Twilio integration using the existing account (EU and Canada phone numbers must work — validate against Twilio's supported regions); phone number stored in `mfa_enrollments`, not in plaintext in logs; enrollment UI displays a subtle warning that TOTP is more secure than SMS and nudges toward TOTP (not a blocker — informational only); enrollment event written to audit log; user can have one SMS method active at a time
- Out: SMS OTP login challenge (MFA-04), TOTP enrollment (MFA-01)

**Dependencies:** INFRA-AUTH-01; Twilio account credentials available in environment
**Priority:** P2
**Size estimate:** M

---

### MFA-04: SMS OTP Login Challenge Flow

**As an** end user who has enrolled SMS OTP,
**I want** to receive a one-time password via text message when logging in,
**so that** my account requires a second factor without needing an authenticator app.

**Scope:**
- In: Post-credential-verification MFA challenge: if user's enrolled MFA method is SMS, trigger Twilio SMS send; display code entry screen; OTP is 6 digits, valid for 10 minutes, single-use; on success, issue session; on failure, apply rate limiting; allow fallback to recovery codes from challenge screen; MFA challenge event written to audit log
- Out: SMS enrollment (MFA-03), TOTP challenge (MFA-02)

**Dependencies:** MFA-03, RATE-01, INFRA-AUTH-01
**Priority:** P2
**Size estimate:** S

---

### MFA-05: MFA Backup Recovery Codes

**As an** end user enabling MFA,
**I want** to generate backup recovery codes when I enroll my first MFA method,
**so that** I can regain access to my account if I lose my authenticator device or phone.

**Scope:**
- In: On first MFA method enrollment, prompt user to generate and save 8 recovery codes; codes are single-use, cryptographically random, stored as bcrypt hashes in `recovery_codes` table; display codes once with a copy/download option; codes can be regenerated by the user after re-authenticating (existing codes invalidated on regeneration); when user uses the final recovery code, send an email alert prompting them to regenerate codes while they still have session access; recovery code usage written to audit log; "use a recovery code" link available on every MFA challenge screen
- Out: Recovery code reset by Platform Super Admin (MFA-06), account-level lockout when all codes are exhausted (that state is handled by MFA-06)

**Dependencies:** MFA-01 or MFA-03 (recovery codes attach to first enrolled MFA method), INFRA-AUTH-01
**Priority:** P1
**Size estimate:** M

---

### MFA-06: Platform Super Admin Recovery Code Reset

**As a** Platform Super Admin,
**I want** to reset a user's recovery codes when they have exhausted all codes and cannot log in,
**so that** locked-out users can regain account access without creating a social engineering vulnerability.

**Scope:**
- In: Super Admin UI action: search for user by email, trigger recovery code reset (generates a fresh set of 8 codes emailed directly to the user's registered email address); Org Admins explicitly cannot perform this action; reset action written to audit log with Super Admin identity; new codes follow the same storage rules as MFA-05 (bcrypt hashed)
- Out: Recovery code enrollment (MFA-05), Org Admin account management UI

**Dependencies:** MFA-05, INFRA-AUTH-01
**Priority:** P1
**Size estimate:** S

---

## Feature: Organization Authentication Policy Management

### POLICY-01: Mandatory MFA Enforcement for Admin and Billing-Access Roles

**As a** security team member,
**I want** MFA enforced automatically for all Org Admins, Platform Super Admins, and users with billing access — regardless of org-level MFA policy,
**so that** the Q3 security mandate is met and privileged accounts cannot bypass MFA.

**Scope:**
- In: System-level enforcement (not configurable by Org Admin): if a user's role is `org_admin`, `platform_super_admin`, or `billing_access`, the MFA challenge step is mandatory at login regardless of org policy; if such a user has no MFA method enrolled, they are shown an enrollment wall on next login (no grace period — this is a role-based mandate, not org-wide rollout); applies to existing users: users in these roles who have no MFA method enrolled are flagged in a one-time report generated at deployment; enforcement event written to audit log
- Out: Org-wide MFA enforcement with grace period (POLICY-02), which covers all other users

**Dependencies:** MFA-02 or MFA-04 (at least one challenge flow must be live), INFRA-AUTH-01
**Priority:** P1 (Q3 deadline)
**Size estimate:** S

---

### POLICY-02: Org-Wide MFA Enforcement with 7-Day Grace Period

**As an** Org Admin,
**I want** to require all users in my organization to enroll in MFA, with a 7-day grace period before login is blocked,
**so that** I can improve org security without immediately locking out users who haven't set up MFA yet.

**Scope:**
- In: Org Admin enables org-wide MFA enforcement via policy settings UI; `grace_period_ends_at` set to now + 7 days for all users not yet enrolled; users who are not enrolled see a persistent banner on every page from day 1; banner escalates to a more urgent style on day 5; on day 8 (first login after grace period end), unenrolled users hit a mandatory MFA enrollment wall before accessing the app; users who enroll during grace period have the wall lifted immediately; policy change triggers email notification to all Org Admins in the organization (POLICY-04)
- Out: Admin/billing-role enforcement (POLICY-01, which has no grace period), grace period tracking dashboard (POLICY-03)

**Dependencies:** MFA-01 (users need somewhere to enroll), POLICY-01, INFRA-AUTH-01
**Priority:** P2
**Size estimate:** M

---

### POLICY-03: MFA Grace Period Enrollment Tracking for Org Admins

**As an** Org Admin,
**I want** to see which users in my organization have not yet enrolled in MFA during the enforcement grace period,
**so that** I can follow up with specific people before the enrollment deadline.

**Scope:**
- In: Admin dashboard section showing: count of unenrolled users, list of unenrolled users (name + email), days remaining in grace period; list updates in real time as users enroll; visible only when org-wide MFA enforcement is active and grace period is in progress; no bulk-action needed — display only
- Out: Detailed audit log view (AUDIT-02), policy configuration controls (POLICY-02)

**Dependencies:** POLICY-02
**Priority:** P2
**Size estimate:** S

---

### POLICY-04: Policy Change Email Notifications to Org Admins

**As an** Org Admin,
**I want** to receive an email when any authentication policy in my organization is changed by another admin,
**so that** I am not blindsided by security configuration changes made by a co-admin.

**Scope:**
- In: Email sent to all Org Admins of the affected org when any of the following change: MFA enforcement enabled/disabled, SSO enabled/disabled, session timeout updated; email includes: what changed, who changed it, timestamp; triggered for both org admin-initiated and Platform Super Admin-initiated changes; email is informational only (no action required)
- Out: Platform Super Admin notifications (they are the actors, not the audience here), audit log (that is AUDIT-01)

**Dependencies:** INFRA-AUTH-01, AUDIT-01 (event capture to know what changed)
**Priority:** P2
**Size estimate:** S

---

### POLICY-05: Org Session Timeout Configuration

**As an** Org Admin,
**I want** to configure a session timeout for my organization (between 1 hour and 30 days),
**so that** session lifetime reflects my organization's security posture.

**Scope:**
- In: Org Admin can set session timeout in org policy settings; valid range: 1 hour to 30 days; default: 24 hours; change takes effect for new sessions immediately; existing sessions are not terminated (they expire at their original timeout); policy change written to audit log; change triggers policy change notification (POLICY-04)
- Out: JWT/refresh token implementation (SESSION-01, which depends on SPIKE-AUTH-01), session invalidation on SSO enable (SSO-04)

**Dependencies:** SPIKE-AUTH-01 (must confirm architecture before this is implementation-ready), SESSION-01, INFRA-AUTH-01
**Priority:** P3
**Size estimate:** S

---

## Feature: SSO Integration (SAML 2.0 / OIDC)

### SSO-01: SSO IdP Configuration UI for Org Admins

**As an** Org Admin,
**I want** to configure my organization's Identity Provider (IdP) using a metadata URL or XML file upload,
**so that** I can set up SSO for my organization without needing Platform Super Admin involvement.

**Scope:**
- In: Configuration UI with two input paths: (1) metadata URL import — fetch and parse IdP metadata XML from URL, extract entity ID, SSO URL, signing certificate; (2) XML file upload — fallback path for IdPs that don't publish a metadata URL; parsed values displayed for admin review before saving; configuration saved to `sso_configurations` table; table schema reserves columns for SCIM provisioning (not populated in this phase) to avoid a future migration; Org Admin can update or remove the SSO configuration; Platform Super Admins can manage SSO config for any org; configuration change written to audit log; policy change notification sent to Org Admins (POLICY-04)
- Out: SSO login flow (SSO-02, SSO-03), manual field-by-field entry of IdP metadata (explicitly excluded from v1 per stakeholder)

**Dependencies:** INFRA-AUTH-01
**Priority:** P2
**Size estimate:** M

---

### SSO-02: SAML 2.0 SP-Initiated Login Flow

**As an** end user whose organization uses a SAML 2.0 IdP (e.g., Okta, Azure AD),
**I want** to log in by clicking "Sign in with SSO" and being redirected to my company's identity provider,
**so that** I authenticate through my organization's centralized identity system without managing a separate password.

**Scope:**
- In: SP-initiated SAML 2.0 flow: user enters email → system detects org has SSO configured → redirect to IdP with AuthnRequest; handle SAMLResponse: validate signature, validate audience, validate conditions (NotBefore, NotOnOrAfter), extract NameID and attributes; create or update user session on successful assertion; support both redirect and POST bindings; tested against real Okta and Azure AD tenants (not just spec compliance); SSO assertion event written to audit log; use `node-saml` or `passport-saml` (CVE history reviewed before selection); failed SAML validation returns clear error (not raw XML dump)
- Out: OIDC flow (SSO-03), IdP-initiated flow (not in scope for this phase), forced SSO policy (SSO-04)

**Dependencies:** SSO-01, INFRA-AUTH-01, RATE-01
**Priority:** P2
**Size estimate:** L

---

### SSO-03: OIDC Login Flow

**As an** end user whose organization uses an OIDC-compatible IdP,
**I want** to log in via the OpenID Connect flow,
**so that** my organization's OIDC IdP handles my authentication.

**Scope:**
- In: Authorization Code Flow with PKCE; token exchange and ID token validation (signature, issuer, audience, expiry); extract user identity from ID token claims; create or update user session; use `openid-client` library; SSO assertion event written to audit log
- Out: SAML 2.0 flow (SSO-02), forced SSO policy (SSO-04)

**Dependencies:** SSO-01, INFRA-AUTH-01, RATE-01
**Priority:** P2
**Size estimate:** M

---

### SSO-04: Forced SSO Enforcement with Immediate Session Invalidation

**As an** Org Admin,
**I want** to require all users in my organization to authenticate exclusively via SSO once it is enabled,
**so that** credentials cannot be used as a fallback once my IdP is the authoritative source.

**Scope:**
- In: Org Admin enables SSO enforcement in policy settings; before saving, system presents a confirmation dialog: "This will immediately log out all active users in your organization. Proceed? [Cancel] [Confirm]"; on confirmation: set `sso_enforced = true` on org, immediately invalidate all active sessions for org members (all existing tokens rejected on next request); users with invalidated sessions see: "Your organization now requires SSO login" with a redirect to the SSO login path; password-based login attempts by users in SSO-enforced orgs are rejected with a clear error message directing them to SSO; break-glass account (SSO-05) is exempted from this enforcement; policy change written to audit log; POLICY-04 notification sent
- Out: Break-glass account creation (SSO-05), SSO login flow itself (SSO-02, SSO-03)

**Dependencies:** SSO-02 or SSO-03 (at least one SSO flow must be live), SESSION-01 (for token revocation mechanism), INFRA-AUTH-01
**Priority:** P2
**Size estimate:** M

---

### SSO-05: Break-Glass Account Management

**As a** Platform Super Admin,
**I want** to designate one break-glass account per SSO-enforced organization that retains email/password access,
**so that** customer organizations are not completely locked out if their IdP becomes unavailable.

**Scope:**
- In: Platform Super Admin UI: search for org, designate exactly one user as the break-glass account (replaces existing designation if one exists); break-glass designation stored in `break_glass_accounts` table; designated account is exempt from SSO enforcement — email/password login works even when `sso_enforced = true`; break-glass account is visibly flagged in the Org Admin UI (read-only — Org Admins see it exists but cannot change it); Platform Super Admin can revoke designation; designation and revocation events written to audit log; Org Admins cannot create or revoke break-glass designation (explicitly excluded)
- Out: SSO enforcement logic (SSO-04), Org Admin policy settings

**Dependencies:** SSO-04, INFRA-AUTH-01
**Priority:** P2
**Size estimate:** S

---

## Feature: Session Management

### SESSION-01: Configurable Session Timeout Implementation

**As a** backend engineer,
**I want** the session token lifecycle to honor the per-organization timeout configuration (1 hour to 30 days),
**so that** session duration reflects each organization's security policy rather than a hardcoded default.

**Scope:**
- In: Implement the refresh token rotation strategy confirmed by SPIKE-AUTH-01; issue tokens with expiry derived from the org's configured `session_timeout`; silent refresh before expiry using the strategy defined in the spike (likely sliding window with httpOnly refresh token cookie); on logout, invalidate both access and refresh tokens; on org session timeout config change, new sessions use the new timeout (existing sessions unaffected — they expire at their original timeout); default org timeout: 24 hours; minimum: 1 hour; maximum: 30 days
- Out: Session invalidation on SSO policy change (SSO-04 covers that), session timeout configuration UI (POLICY-05)

**Dependencies:** SPIKE-AUTH-01 (architecture decision required), INFRA-AUTH-01
**Priority:** P3
**Size estimate:** L

---

## Feature: Authentication Audit Logging

### AUDIT-01: Authentication Event Capture

**As a** security team member,
**I want** every significant authentication event written to a structured, immutable audit log,
**so that** we have a reliable record for SOC 2 Type II compliance, incident investigation, and forensic review.

**Scope:**
- In: Write an audit log entry for each of the following events: successful login (password, SAML, OIDC), failed login attempt, logout, MFA challenge initiated, MFA challenge succeeded, MFA challenge failed, MFA enrolled (method type), MFA unenrolled, recovery code used, recovery code exhausted, SSO configuration created/updated/deleted, SSO enforcement enabled/disabled, MFA policy enabled/disabled, session timeout changed, break-glass designation created/revoked; each entry records: event type, timestamp, user ID, organization ID, IP address, user agent, outcome (success/failure), relevant metadata (e.g., IdP entity ID for SSO events); entries are append-only (no update/delete path in application code); stored in `auth_audit_log` table with partitioning by org and month to support 1-year retention queries; data model includes columns reserved for API access (event ID, structured metadata JSON) to support future SIEM integration without schema migration
- Out: Audit log UI (AUDIT-02), retention enforcement job (included in AUDIT-02)

**Dependencies:** INFRA-AUTH-01; this story is a dependency for almost every other story — implement the write path early and call it from each feature story
**Priority:** P1 (foundational — wire in from the start)
**Size estimate:** M

---

### AUDIT-02: Org Admin Audit Log UI with CSV Export

**As an** Org Admin,
**I want** to view and export the authentication audit log for my organization,
**so that** I can investigate suspicious activity and provide evidence for our SOC 2 audit.

**Scope:**
- In: Audit log view in the Org Admin dashboard: scoped strictly to the admin's own organization (no cross-org visibility); filterable by: event type, user, date range; paginated; CSV export of filtered results with all fields; Platform Super Admins see a global view across all orgs with an additional org filter; 1-year data retention enforced via a scheduled deletion job (events older than 1 year purged); UI does not expose audit log API in this phase, but the underlying query layer is structured to support it (no UI-only hacks)
- Out: SIEM API integration (future phase), real-time alerting on audit events (future)

**Dependencies:** AUDIT-01
**Priority:** P3
**Size estimate:** M

---

## Dependency Map

- **INFRA-AUTH-01** is a prerequisite for every feature story.
- **SPIKE-AUTH-01** is a prerequisite for SESSION-01 and POLICY-05.
- **AUDIT-01** should be implemented alongside the first auth story that fires events (RATE-01) and extended with each subsequent story.
- **RATE-01** is a prerequisite for MFA-02, MFA-04, SSO-02, SSO-03.
- **MFA-01** is a prerequisite for MFA-02, MFA-05, POLICY-01, POLICY-02.
- **MFA-03** is a prerequisite for MFA-04.
- **MFA-05** is a prerequisite for MFA-06.
- **POLICY-01** is a prerequisite for POLICY-02 (mandate must be live before org-wide rollout adds more users).
- **POLICY-02** is a prerequisite for POLICY-03.
- **SSO-01** is a prerequisite for SSO-02, SSO-03.
- **SSO-02 or SSO-03** must be live before SSO-04.
- **SSO-04** is a prerequisite for SSO-05.
- **SESSION-01** is required by SSO-04 (for token revocation) and POLICY-05.
- **POLICY-04** is invoked by SSO-01, SSO-04, POLICY-02, POLICY-05 — implement early, call from each.

---

## Suggested Implementation Order

1. **INFRA-AUTH-01** — schema foundation; everything else depends on it
2. **AUDIT-01** — event capture wired in from the start; avoids retrofitting
3. **RATE-01** — addresses the active security incident; prerequisite for all login flows
4. **RATE-02** — pairs with RATE-01; infrastructure config, low effort
5. **MFA-01** — TOTP enrollment; TOTP has no external dependency unlike SMS
6. **MFA-02** — TOTP login challenge; completes the TOTP loop
7. **MFA-05** — recovery codes; required alongside first MFA method
8. **MFA-06** — Super Admin recovery reset; small, high priority
9. **POLICY-01** — admin/billing MFA mandate; Q3 deadline drives this high
10. **POLICY-04** — policy change notifications; small, needed before any policy stories ship
11. **MFA-03** — SMS OTP enrollment via Twilio; can run in parallel with SSO stories
12. **MFA-04** — SMS OTP challenge flow; follows MFA-03
13. **SSO-01** — IdP config UI; prerequisite for SAML + OIDC flows
14. **SSO-02** — SAML 2.0 SP-initiated flow; primary enterprise SSO path
15. **SSO-03** — OIDC flow; pairs with SSO-02
16. **SPIKE-AUTH-01** — JWT architecture spike; timebox before starting SESSION-01
17. **SESSION-01** — configurable session timeout; needs spike output
18. **SSO-04** — forced SSO enforcement; needs SESSION-01 for token revocation
19. **SSO-05** — break-glass account; needs SSO-04
20. **POLICY-02** — org-wide MFA enforcement with grace period
21. **POLICY-03** — grace period tracking dashboard; follows POLICY-02
22. **POLICY-05** — session timeout configuration UI; needs SESSION-01
23. **AUDIT-02** — Org Admin audit log UI + CSV export + retention job

---

## Potential Additions (Not in Scope, Not Silently Included)

- **SCIM provisioning:** Explicitly deferred. SSO-01 and INFRA-AUTH-01 include SCIM-compatible schema to avoid a future migration.
- **IdP-initiated SAML flow:** Not mentioned in requirements. Common customer request — flag for next phase.
- **Admin-triggered account unlock:** RATE-01 covers auto-unlock after 15 minutes, but there is no story for a support admin to manually unlock before the window expires. Flag for consideration.
- **MFA method management UI:** Users can enroll TOTP and SMS, but there is no story for viewing enrolled methods, removing a method, or switching from SMS to TOTP without going through re-enrollment. Flag as a UX gap.
- **SIEM / API access to audit logs:** Explicitly deferred; data model in AUDIT-01 accommodates it.

---

## Coverage Check

| Feature from Analysis | Stories | Status |
|---|---|---|
| SSO Integration (SAML 2.0 / OIDC) | SSO-01, SSO-02, SSO-03, SSO-04, SSO-05 | Covered |
| Multi-Factor Authentication (TOTP + SMS) | MFA-01, MFA-02, MFA-03, MFA-04, MFA-05, MFA-06 | Covered |
| Organization Authentication Policy Management | POLICY-01, POLICY-02, POLICY-03, POLICY-04, POLICY-05 | Covered |
| Session Management | SPIKE-AUTH-01, SESSION-01 | Covered (spike + implementation) |
| Authentication Audit Logging | AUDIT-01, AUDIT-02 | Covered |
| Rate Limiting & Brute-Force Protection | RATE-01, RATE-02 | Covered |
