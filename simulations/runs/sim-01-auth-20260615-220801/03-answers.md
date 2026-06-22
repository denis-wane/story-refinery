# Stakeholder Responses

## Critical Questions

### 1. Which roles qualify for the Q3 mandatory MFA mandate?
**Answer:** Both Org Admins and Platform Super Admins. If you have admin privileges on anything — your org or the platform — you're covered by the mandate. That's the security team's position and I'm not going to negotiate it down.

**Additional context:** Security also mentioned they want MFA required for any user with billing access, even if they don't have full admin rights. That came up in last week's sync. Worth folding in now rather than as a follow-on.

---

### 2. When an org enables SSO mid-session, are active user sessions terminated immediately or allowed to expire naturally?
**Answer:** Immediate invalidation. We don't want a window where someone is authenticated via password after their org has moved to SSO-only. The UX hit is acceptable — users will see a "your organization now requires SSO login" message and get redirected.

**Additional context:** Org Admins should get a confirmation dialog before they flip the switch — something like "This will log out all active users immediately. Proceed?" That way it's a deliberate action, not an accident.

---

### 3. When org-wide MFA enforcement is turned on, do existing users hit an immediate enrollment wall or get a grace period?
**Answer:** Grace period — 7 days. A hard block on next login for a 200-person org would be chaos. Users get a banner warning from day one, a more urgent warning on day 5, and then the wall on day 8.

**Additional context:** Org Admins need to be able to see who hasn't enrolled yet during the grace period. A simple list in the admin dashboard — "5 users have not set up MFA, grace period ends in 4 days" — is enough. No need to make it fancy.

---

### 4. What are the rate limiting thresholds?
**Answer:** 5 failed attempts, then a 15-minute lockout. No progressive backoff for now — keep it simple. CAPTCHA after 3 failures is fine. Both IP-level and account-level throttling, as you assumed.

**Additional context:** The security team specifically flagged that IP-level throttling alone wasn't enough in the stuffing incident — attackers were distributing across IPs. Account-level is the more important of the two. Make sure that's the priority if we have to cut scope.

---

### 5. Which SMS gateway for SMS OTP?
**Answer:** Twilio. We already have a Twilio account for transactional notifications — use that. Legal has already reviewed the DPA.

**Additional context:** We need SMS OTP to work in the EU and Canada at minimum — those are where our enterprise customers are. Twilio handles that fine. Don't park this one; it can run in parallel with TOTP.

---

## Important Questions

### 1. Where are audit logs surfaced, and how long are they retained?
**Answer:** UI for Org Admins, scoped to their org only. 1-year retention — we're pursuing SOC 2 Type II and that's the auditor's requirement. CSV export is needed in v1; the security team will ask for it during the audit.

**Additional context:** Org Admins don't need API access to logs in this phase, but please make sure the data model supports it — we'll need it when we build the SIEM integration next year.

---

### 2. Does the backend need a JWT / refresh token rearchitecture before 30-day sessions can ship?
**Answer:** Yes, treat it as a spike and land it before the session management story. The team shouldn't make assumptions here — if it turns out the current approach can stretch to 30 days cleanly, great, but I want that confirmed, not assumed. 3-day timebox sounds right.

---

### 3. Are break-glass or service account exemptions needed from forced SSO enforcement?
**Answer:** Yes, we need this. I should have called it out in the original spec — sorry. At least two of our enterprise prospects specifically asked about this. It's a dealbreaker for them if their IdP goes down and they're locked out entirely.

**Additional context:** Keep it minimal: one designated break-glass account per org, email/password only, flagged visibly in the admin UI. Platform Super Admins can create or revoke break-glass designation. Org Admins should not be able to set this themselves.

---

### 4. What happens when a user exhausts all MFA recovery codes?
**Answer:** Platform Super Admin resets it, Org Admin cannot. That's the right call for exactly the reason you flagged — social engineering risk. Include this in v1; it's not something we can punt on.

**Additional context:** We should send an email alert to the user when they've used their last recovery code, prompting them to regenerate codes while they still have device access. That self-service window matters.

---

### 5. Is standard SAML 2.0 / OIDC enough for Okta and Azure AD customers?
**Answer:** Yes, for launch. I've already validated this informally with both named customers — they're using standard Okta and Azure AD setups, nothing custom. Just make sure we test against real Okta and Azure AD tenants in QA, not just spec-compliance.

---

## Nice to Have

### 1. How does an Org Admin configure IdP metadata?
**Answer:** URL import as the primary path, XML upload as a fallback. Skip manual field entry for now — it's error-prone and the enterprise customers we're targeting all use Okta or Azure AD which give you a metadata URL in two clicks.

---

### 2. Should the MFA enrollment UI warn about SMS being weaker than TOTP?
**Answer:** Yes, show the warning. We'd rather nudge people toward TOTP. Keep it subtle — don't make it feel like we're blocking SMS, just inform.

---

### 3. Should Org Admins get notified when MFA enforcement policy changes?
**Answer:** Yes, in v1. An email notification to all Org Admins in the affected org when a policy change is made. Audit log alone isn't enough — the co-admin scenario (Admin A changes a policy, Admin B doesn't know) is a real support headache.

---

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | SCIM is fully out of scope for this phase | ✅ Correct | Confirmed. Design for it, don't build it. |
| 2 | Existing email/password auth remains for orgs without SSO | ✅ Correct | Exactly right. Don't touch password auth for non-SSO orgs. |
| 3 | TOTP clock skew tolerance is ±1 window (30 seconds) | ✅ Correct | Fine. Standard behavior, no opinion. |
| 4 | 8 single-use recovery codes, regeneratable after re-auth | ✅ Correct | 8 is good. Keep it. |
| 5 | SSO IdP metadata uses XML upload + manual field entry as primary paths | ⚠️ Partially | URL import should be the primary path, not secondary. See Nice to Have answer #1. Drop manual entry from v1. |
| 6 | Audit log isolation: Org Admins see only their org; Super Admins see all | ✅ Correct | Yes, strict isolation. Super Admins get a global view. |
| 7 | Rate limiting at both infrastructure and application layer | ✅ Correct | Both layers. Account-level is the priority per security team. |
| 8 | TOTP secrets encrypted at rest using KMS / envelope encryption | ❌ Wrong | We don't have a platform KMS in place yet. Use AES-256 encryption with keys stored in AWS Secrets Manager for now — that's what the infrastructure team has available. Flag this for the security team to review before launch. |
