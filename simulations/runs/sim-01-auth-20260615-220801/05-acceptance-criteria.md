<!-- STORY COUNT: 10 stories to process -->

# Acceptance Criteria: SPIKE-AUTH-01 — JWT / Refresh Token Architecture for 30-Day Sessions

## Refined Story Statement
As a backend engineer, I want a confirmed, time-boxed architectural design for refresh token rotation that supports configurable session durations up to 30 days, so that the session management feature (SESSION-01) can be implemented without mid-sprint architectural rework.

## Assumptions
- The current implementation uses short-lived JWTs stored in httpOnly cookies — **Confirmed** (per technical notes)
- The spike output is an ADR (Architecture Decision Record) plus a working proof-of-concept or documented API contract — **Unconfirmed** (format not specified)
- The ADR will be reviewed and approved by the platform architect and security team before SESSION-01 begins — **Unconfirmed**
- Token revocation must support immediate session invalidation (e.g., when org admin changes SSO policy mid-day) — **Confirmed** (G-7 dependency)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-7: Session invalidation on policy change (immediate vs. natural expiry) | Addressed — spike must evaluate and recommend a revocation strategy that supports immediate invalidation; the ADR must document the chosen approach | AC-1, AC-4 |
| G-11: JWT/refresh token strategy for 30-day sessions | Addressed — this spike directly resolves G-11; output is a binding ADR that unblocks SESSION-01 | AC-1, AC-2, AC-3 |

## Acceptance Criteria

### AC-1: Options Evaluation Covers All Required Strategies
**Given** the spike has been assigned and a backend engineer begins the timebox
**When** the engineer evaluates token strategies
**Then** the written analysis must cover at minimum: (a) sliding-window refresh token rotation, (b) absolute expiry with silent refresh, and (c) short-lived access token + long-lived refresh token with rotation; each option must include a security risk assessment, implementation complexity estimate, and compatibility assessment with the existing httpOnly-cookie architecture

**Category:** happy-path
**Priority:** must-have

### AC-2: ADR Produced with a Binding Recommendation
**Given** the options evaluation (AC-1) is complete
**When** the spike timebox ends (≤ 3 business days from start)
**Then** a single ADR document exists in the repository at `docs/architecture/decisions/ADR-NNN-jwt-session-strategy.md` containing: chosen strategy, rationale, rejected alternatives with reasons, security implications, and token revocation approach; the ADR status is set to "Proposed" pending review

**Category:** happy-path
**Priority:** must-have

### AC-3: ADR Addresses 30-Day Maximum Session Requirement
**Given** the ADR is drafted
**When** it is reviewed
**Then** the ADR explicitly states whether the recommended strategy supports session durations from 1 hour to 30 days without requiring a different architecture per duration; if it does not, it proposes a minimum and maximum supported duration with justification

**Category:** edge-case
**Priority:** must-have

### AC-4: ADR Addresses Immediate Token Revocation
**Given** the ADR is drafted
**When** it is reviewed
**Then** the ADR includes a section on token revocation that addresses: (a) how active sessions are invalidated within ≤ 60 seconds of a policy change (e.g., org SSO enforcement toggled), (b) whether a revocation list (blocklist) or short-lived token rotation achieves this, and (c) storage and performance implications of the chosen revocation approach at 50k concurrent users

**Category:** edge-case
**Priority:** must-have

### AC-5: ADR Reviewed and Approved Before SESSION-01 Starts
**Given** the ADR has been submitted ("Proposed")
**When** the platform architect and at least one security team member have reviewed it
**Then** the ADR status is updated to "Accepted" or "Rejected with revised proposal"; SESSION-01 must not enter sprint planning until the ADR is in "Accepted" state

**Category:** happy-path
**Priority:** must-have

### AC-6: Spike Does Not Produce Production Code
**Given** the spike is scoped to design only
**When** the timebox ends
**Then** no production code changes exist in the main branch as a result of this spike; any proof-of-concept code is in a throwaway branch or clearly labelled non-production; the acceptance of this story does not merge application code

**Category:** boundary
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to access the ADR document in the internal repository or any internal engineering documentation surface
**Then** the system returns 401 Unauthorized (enforced by the repository's access control, e.g., GitHub branch/repo permissions)

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without write access to the `docs/architecture/decisions/` path
**When** they attempt to create or modify the ADR document
**Then** the system returns 403 Forbidden; only backend engineers and architects with repo write permissions may create or update ADR documents

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Spike exceeds 3-day timebox without a recommendation | Engineering lead is notified; a partial ADR with documented blockers is submitted; SESSION-01 is not unblocked until the ADR is complete | must-have |
| ADR is rejected by security team | Spike is extended by 1 day maximum to revise; if still rejected, escalate to engineering director | should-have |

### Performance
- **Response time:** Not applicable (spike output is a document, not a service)
- **Scale:** The resulting architectural decision must account for 50k concurrent users with configurable sessions up to 30 days

### Security
- **Input validation:** Not applicable
- **Authorization:** ADR repository write access restricted to engineers with the correct GitHub team membership

### Accessibility
- Not applicable

## Open Questions
- What is the ADR template or format standard for this project? (Unconfirmed assumption on file path and format)
- Who is the designated approver on the security team for this ADR? Must be confirmed before timebox starts to avoid review delays.

---

# Acceptance Criteria: INFRA-AUTH-01 — Authentication Database Schema Migration

## Refined Story Statement
As a platform engineer, I want the new authentication database tables created and migrated safely on the production database with verified rollback capability, so that all auth feature stories have the schema they depend on without risk to the existing 50,000-user dataset.

## Assumptions
- Production database is PostgreSQL — **Unconfirmed** (not stated; assumed based on typical SaaS stack)
- Migrations are managed via an existing migration framework (e.g., Flyway, Liquibase, or a Node.js migration library) — **Unconfirmed**
- A staging environment with a copy of production data (anonymized) is available for dry-run testing — **Confirmed** (per scope: "rollback tested on a staging copy of prod data")
- The `break_glass_accounts` table is in scope despite SSO enforcement having no exemptions (G-2 default) — **Unconfirmed** (contradicts G-2 assumption; see Open Questions)
- `auth_audit_log` will be partitioned by `organization_id` and date — **Confirmed** (per scope)
- Retention target for `auth_audit_log` is 1 year — **Confirmed** (per scope)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Which admin roles qualify for MFA mandate | Addressed — `billing_access` role flag added to users table; `mfa_required` column on organizations; schema must accommodate enforcement at both user-role and org level | AC-3 |
| G-2: SSO enforcement exemptions | Out of Scope for schema — G-2 was resolved as "no exemptions"; however, `break_glass_accounts` table is in scope per story definition, which contradicts this. Flagged in Open Questions | Open Question |
| G-4: Recovery code behavior (8 single-use, bcrypt hashed) | Addressed — `recovery_codes` table schema enforces single-use via `used_at` timestamp column and stores bcrypt hash, not plaintext | AC-5 |
| G-5: TOTP clock skew tolerance | Out of Scope for schema — TOTP validation tolerance is application logic, not schema | Out of Scope |
| G-6: Audit log access surface and retention | Addressed — `auth_audit_log` partitioned by org and date with 1-year retention; index strategy documented | AC-6, AC-7 |
| G-7: Session invalidation on policy change | Addressed — `session_policies` table includes `invalidate_on_policy_change` boolean; `sessions` (if applicable) must include `revoked_at`; schema must support immediate revocation lookup | AC-8 |
| G-9: Rate limiting thresholds | Out of Scope for schema — thresholds are application config, not schema; Redis state for lockouts is not a DB migration | Out of Scope |
| G-10: MFA enforcement rollout for existing users | Addressed — `grace_period_ends_at` column added to organizations table; schema supports per-org enforcement timing | AC-3 |
| G-11: JWT strategy for 30-day sessions | Out of Scope for schema — token strategy is the output of SPIKE-AUTH-01; schema changes resulting from that decision are part of SESSION-01 | Out of Scope |
| G-12: SSO IdP metadata configuration UX | Addressed — `sso_configurations` table includes columns for XML metadata blob, metadata URL, and manual field entries (entity_id, sso_url, certificate) to support all three input methods | AC-4 |

## Acceptance Criteria

### AC-1: All Specified Tables Created
**Given** the migration runs successfully on a target database
**When** the migration completes
**Then** the following tables exist with correct column definitions: `sso_configurations`, `mfa_enrollments`, `recovery_codes`, `auth_audit_log`, `session_policies`, `break_glass_accounts`; and the following columns are added to existing tables: `mfa_required` (boolean, default false), `sso_enforced` (boolean, default false), `grace_period_ends_at` (nullable timestamp) on `organizations`; `billing_access` (boolean, default false) on `users`

**Category:** happy-path
**Priority:** must-have

### AC-2: Migration Is Reversible
**Given** the migration has been applied to a staging database
**When** the rollback migration is executed
**Then** all tables and columns created by the forward migration are removed; the database schema returns to its pre-migration state; no existing data in pre-existing tables is modified or lost during either the forward or rollback migration

**Category:** happy-path
**Priority:** must-have

### AC-3: SCIM-Compatible Columns Reserved in sso_configurations
**Given** the `sso_configurations` table is created
**When** inspecting its schema
**Then** the table includes nullable columns reserved for future SCIM use: `scim_endpoint` (varchar, nullable), `scim_token_hash` (varchar, nullable), `scim_enabled` (boolean, default false); these columns are not populated by any application code in this migration

**Category:** edge-case
**Priority:** must-have

### AC-4: sso_configurations Supports All Three Metadata Input Methods
**Given** the `sso_configurations` table is created
**When** inspecting its schema
**Then** the table contains columns for: `metadata_xml` (text, nullable) for XML upload, `metadata_url` (varchar, nullable) for URL import, `entity_id` (varchar, nullable), `sso_url` (varchar, nullable), `certificate` (text, nullable) for manual field entry; exactly one of these input methods may be used per configuration row (enforced by check constraint or application logic — document which)

**Category:** happy-path
**Priority:** must-have

### AC-5: recovery_codes Table Enforces Single-Use and Hashed Storage
**Given** the `recovery_codes` table is created
**When** inspecting its schema
**Then** the table contains: `id`, `user_id` (foreign key to users), `code_hash` (varchar, not null — bcrypt hash), `used_at` (nullable timestamp), `created_at`, `invalidated_at` (nullable timestamp for batch invalidation on regeneration); no column stores the plaintext recovery code

**Category:** security
**Priority:** must-have

### AC-6: auth_audit_log Is Partitioned
**Given** the `auth_audit_log` table is created
**When** inspecting its schema and partition structure
**Then** the table is range-partitioned by date (monthly partitions created for the next 13 months); composite indexes exist on `(organization_id, event_type, created_at)` and `(user_id, created_at)` within each partition; the query plan for `SELECT * FROM auth_audit_log WHERE organization_id = ? AND event_type = ? AND created_at > ?` uses partition pruning (verified via `EXPLAIN`)

**Category:** performance
**Priority:** must-have

### AC-7: auth_audit_log Has Retention Policy Configured
**Given** the `auth_audit_log` table is created
**When** the retention policy is configured
**Then** a scheduled job (or partition drop policy) is documented and configured to drop partitions older than 12 months; the first automated drop is scheduled and will not affect any data younger than 12 months; the configuration is version-controlled alongside the migration

**Category:** edge-case
**Priority:** must-have

### AC-8: session_policies Supports Immediate Revocation
**Given** the `session_policies` table is created
**When** inspecting its schema
**Then** the table contains: `organization_id` (foreign key, unique), `session_timeout_seconds` (integer, default 86400, max 2592000), `invalidate_sessions_on_policy_change` (boolean, default true), `updated_at` (timestamp); a separate `user_sessions` table (or equivalent revocation store schema) includes `revoked_at` (nullable timestamp) to support immediate session invalidation

**Category:** security
**Priority:** must-have

### AC-9: Migration Dry-Run Passes on Staging Copy of Production Data
**Given** a staging database seeded with an anonymized copy of the 50k-user production dataset
**When** the forward migration is executed
**Then** it completes without errors in under 10 minutes; zero rows in existing tables are modified; the rollback migration also completes without errors; both directions are documented as passing in the PR description

**Category:** edge-case
**Priority:** must-have

### AC-10: Multi-Tenancy Isolation Enforced at Schema Level
**Given** all new tables that store per-organization data
**When** inspecting their schema
**Then** every such table includes `organization_id` as a non-nullable foreign key with a NOT NULL constraint; no table stores cross-org data in a single row; the schema review checklist in the PR confirms this for each new table

**Category:** security
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to any endpoint that reads from or writes to the new authentication tables (e.g., migration status API, admin database tooling)
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without the `platform_engineer` or `database_admin` role
**When** they attempt to execute the migration or access migration status endpoints
**Then** the system returns 403 Forbidden; only authorized platform engineers may trigger schema migrations

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Migration fails partway through | Migration is automatically rolled back to the pre-migration state; no partial schema changes persist; the error is logged with the failed statement and line number | must-have |
| Rollback migration fails | Engineering on-call is paged; database is placed in read-only mode until manual intervention; runbook exists in `docs/runbooks/infra-auth-01-rollback.md` | must-have |
| Partition creation for future months fails | Alert fired; missing partition is created manually per runbook; existing data unaffected | should-have |

### Performance
- **Response time:** Migration must complete in under 10 minutes on the production database at 50k users
- **Scale:** `auth_audit_log` must support 1M+ rows per month without query degradation; partition pruning must be validated under load

### Security
- **Input validation:** Migration scripts are code-reviewed before execution; no user-supplied input is accepted in migration files
- **Authorization:** Only users with database admin credentials may execute migrations; credentials are rotated post-migration

### Accessibility
- Not applicable

## Open Questions
- The `break_glass_accounts` table is in scope per the story definition, but G-2 was resolved as "no exemptions — all org members must use SSO." This is a contradiction. Does `break_glass_accounts` represent a future exemption mechanism, or a platform super admin bypass? Stakeholder must confirm before schema is finalized.
- Is the production database PostgreSQL? The partition and index strategy in these ACs assumes PostgreSQL. If the database is different, AC-6 and AC-9 thresholds must be revisited.
- What migration framework is in use? The reversibility requirement (AC-2) must be validated against the specific tooling.

---

# Acceptance Criteria: RATE-01 — Application-Layer Rate Limiting on Auth Endpoints

## Refined Story Statement
As a security team member, I want account-level and IP-level throttling enforced at the application layer on login, MFA challenge, and password reset endpoints, so that credential stuffing and brute-force attacks are blocked even when traffic is distributed across multiple IPs.

## Assumptions
- Redis (or equivalent in-memory store) is available in the production infrastructure — **Unconfirmed** (assumed; story specifies "Redis or equivalent")
- CAPTCHA provider is already integrated or a specific provider has been chosen (e.g., reCAPTCHA v3, hCaptcha) — **Unconfirmed**
- The 15-minute lockout timer is absolute (not reset by additional failed attempts during lockout) — **Confirmed** (per scope: "automatic unlock after 15 minutes")
- Rate limiting applies to unauthenticated requests as well as authenticated requests (e.g., logged-in user triggering MFA challenge endpoint) — **Unconfirmed**
- The audit log table (`auth_audit_log`) is available — **Confirmed** (dependency: INFRA-AUTH-01)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-9: Rate limiting thresholds undefined | Addressed — story scope defines thresholds explicitly: 5 failed attempts → 15-minute lockout; 3 failures → CAPTCHA; these values are now binding in AC | AC-1, AC-2, AC-3, AC-4 |

## Acceptance Criteria

### AC-1: Account-Level Lockout After 5 Failed Attempts
**Given** a user account exists and no prior lockout is active
**When** 5 consecutive failed authentication attempts occur against that account's login endpoint within any rolling 15-minute window
**Then** the account is locked for exactly 15 minutes; subsequent login attempts during lockout return HTTP 429 with a response body indicating "Account temporarily locked. Try again after [UTC timestamp]" and a `Retry-After` header set to the remaining lockout seconds; the 15-minute window starts from the time of the 5th failed attempt, not reset by additional attempts during lockout

**Category:** happy-path
**Priority:** must-have

### AC-2: IP-Level Throttling as Secondary Control
**Given** requests originate from a single IP address
**When** 5 failed authentication attempts occur from that IP across any combination of accounts within any rolling 15-minute window
**Then** the IP is throttled for 15 minutes; subsequent requests from that IP to the three covered endpoints return HTTP 429 with `Retry-After` header; throttle state is stored in Redis keyed by IP address and expires automatically after 15 minutes

**Category:** happy-path
**Priority:** must-have

### AC-3: CAPTCHA Surfaced After 3 Failures (Pre-Lockout)
**Given** a user or IP has accumulated exactly 3 failed attempts (below the 5-attempt lockout threshold)
**When** they attempt authentication again
**Then** the login response includes a CAPTCHA challenge token/flag in its payload that the frontend uses to render a CAPTCHA; the 4th and 5th attempts require a valid CAPTCHA solution; failed CAPTCHA does not increment the failure counter; lockout is triggered only by 5 failed credential attempts (CAPTCHA failures do not count)

**Category:** edge-case
**Priority:** must-have

### AC-4: Rate Limiting Applied to All Three Endpoints
**Given** the rate limiting middleware is deployed
**When** the failure threshold is reached
**Then** rate limiting applies identically to: `POST /auth/login`, `POST /auth/mfa/challenge`, `POST /auth/password/reset`; no other endpoints are affected by this story's rate limiting logic

**Category:** boundary
**Priority:** must-have

### AC-5: Lockout Event Written to Audit Log
**Given** an account or IP reaches the lockout threshold
**When** the lockout is applied
**Then** a lockout event is written to `auth_audit_log` containing: `event_type = "account_lockout"` or `"ip_lockout"`, `user_id` (if account-level), `ip_address`, `attempt_count`, `locked_until` (UTC timestamp), `created_at`; this write is non-blocking to the user-facing response

**Category:** happy-path
**Priority:** must-have

### AC-6: Automatic Unlock After 15 Minutes
**Given** an account or IP is locked
**When** 15 minutes have elapsed since the lockout was applied
**Then** the next authentication attempt is processed normally (lockout is not extended by the passage of time); no admin action is required to unlock; the Redis key has a TTL of 900 seconds set at lockout time

**Category:** happy-path
**Priority:** must-have

### AC-7: Successful Login Resets Failure Counter
**Given** a user has 1–4 failed attempts recorded (below lockout threshold)
**When** the user successfully authenticates
**Then** their failed attempt counter is reset to 0; the IP-level counter for that IP is also decremented by the number of failed attempts attributed to that account/IP combination

**Category:** edge-case
**Priority:** must-have

### AC-8: Rate Limiting State Survives Application Restart
**Given** the application server is restarted or a new instance is deployed
**When** a locked account attempts to authenticate within its lockout window
**Then** the lockout is still enforced; lockout state must be stored in Redis (not in-process memory) and must not be lost on server restart

**Category:** edge-case
**Priority:** must-have

### AC-9: Rate Limiting Does Not Apply to Already-Authenticated Sessions
**Given** a user has an active authenticated session
**When** they access non-auth endpoints (e.g., product features)
**Then** the rate limiting middleware does not apply; only the three explicit auth endpoints are covered

**Category:** boundary
**Priority:** must-have

### AC-10: Account Lockout Communicates Lockout — Not Account Existence
**Given** an attacker submits 5 failed attempts for a non-existent email address
**When** the lockout threshold is reached
**Then** the response returns HTTP 429 with the same message as a real account lockout; the response does not indicate whether the email address corresponds to a real account (prevents user enumeration via lockout behavior)

**Category:** security
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the rate limiting configuration API or internal lockout status endpoints (if any exist)
**Then** the system returns 401 Unauthorized; the three public auth endpoints (`/auth/login`, `/auth/mfa/challenge`, `/auth/password/reset`) intentionally accept unauthenticated requests and are not subject to this AC

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without the `platform_operations` or `security_admin` role
**When** they attempt to query rate limiting status or Redis lockout state via any internal admin API
**Then** the system returns 403 Forbidden with a message identifying the missing permission

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Redis is unavailable | Rate limiting fails open (requests pass through) with an alert fired to on-call; the system does NOT block all auth traffic due to Redis outage; fallback behavior is logged | must-have |
| Audit log write fails | Lockout is still enforced; audit log failure is logged to application error log; user-facing behavior is unaffected | must-have |
| CAPTCHA provider unavailable | CAPTCHA challenge is skipped; attempts 4 and 5 are allowed without CAPTCHA; lockout at attempt 5 still applies; alert is fired | should-have |

### Performance
- **Response time:** Rate limiting check must add ≤ 10ms p99 latency to covered endpoints
- **Scale:** Redis key storage must support 50k accounts × 3 endpoints without memory pressure; each key TTL of 15 minutes bounds the active key count

### Security
- **Input validation:** IP addresses are extracted from `X-Forwarded-For` header with a trusted proxy allowlist; raw header values from untrusted sources are not used directly (prevents IP spoofing to bypass IP-level throttling)
- **Authorization:** Lockout state in Redis is read-only from the application layer; no endpoint allows arbitrary lockout reset (admin unlock is a separate story)

### Accessibility
- CAPTCHA implementation must include an audio alternative (WCAG 2.1 AA compliance)

## Open Questions
- Is a CAPTCHA provider already integrated in the platform? If not, which provider should be used? This must be decided before AC-3 can be implemented.
- Should failed CAPTCHA solutions be logged to the audit log? Not specified — recommend yes for security visibility, but requires stakeholder sign-off.

---

# Acceptance Criteria: RATE-02 — Infrastructure-Layer Rate Limiting

## Refined Story Statement
As a platform operations engineer, I want rate limiting enforced at the nginx / API gateway layer before requests reach the application, so that direct connections that bypass the application server cannot circumvent account-level throttling, as occurred in the credential stuffing incident.

## Assumptions
- nginx is the current reverse proxy / API gateway in use — **Unconfirmed** (story says "nginx / API gateway"; AC written for nginx but must be adapted if a different gateway is in use)
- nginx configuration is already managed as code (e.g., in a Git repository) — **Unconfirmed** (confirmed by scope: "configuration is code-reviewed and version-controlled")
- IP rate limiting thresholds at infrastructure layer match RATE-01: 5 requests per 15-minute window — **Confirmed** (per scope: "align thresholds with RATE-01")
- The infrastructure can be updated without downtime (rolling reload) — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-9: Rate limiting thresholds undefined | Addressed — thresholds are inherited from RATE-01 (5 attempts / 15 minutes); this story enforces the same thresholds at the infrastructure layer | AC-1, AC-2 |

## Acceptance Criteria

### AC-1: nginx Rate Limiting Configured on All Three Auth Endpoints
**Given** the nginx configuration is deployed
**When** a client sends requests to `POST /auth/login`, `POST /auth/mfa/challenge`, or `POST /auth/password/reset`
**Then** nginx enforces an IP-level rate limit of 5 requests per 15-minute window per IP address; requests exceeding this limit are rejected at the nginx layer with HTTP 429 before reaching the application server; a `Retry-After` header is included in the 429 response

**Category:** happy-path
**Priority:** must-have

### AC-2: Rate Limiting Config Is Version-Controlled
**Given** the nginx rate limiting rules are implemented
**When** the change is merged
**Then** the nginx configuration files containing rate limiting rules are committed to the version-controlled infrastructure repository; no rate limiting rule exists only as a manual edit on a running server; the PR includes a code review from at least one other engineer

**Category:** happy-path
**Priority:** must-have

### AC-3: 429 Response Includes Retry-After Header
**Given** nginx rejects a request due to rate limiting
**When** the client receives the response
**Then** the HTTP response is 429 Too Many Requests with a `Retry-After` header set to the number of seconds remaining until the rate limit window resets; the response body contains a human-readable message consistent with the application-layer 429 message from RATE-01

**Category:** happy-path
**Priority:** must-have

### AC-4: Non-Auth Endpoints Are Not Rate Limited by This Config
**Given** the nginx rate limiting configuration is deployed
**When** a client sends requests to any endpoint other than the three auth endpoints
**Then** nginx does not apply the auth-specific rate limits to those requests; existing nginx behavior for non-auth routes is unchanged

**Category:** boundary
**Priority:** must-have

### AC-5: Rate Limiting Survives nginx Reload
**Given** nginx is reloaded (e.g., during a configuration update or rolling deploy)
**When** a client is mid-lockout and nginx reloads
**Then** the rate limiting state (request counters, window timers) persists across the reload using a shared memory zone (`limit_req_zone`); lockout is not reset by nginx reloads

**Category:** edge-case
**Priority:** must-have

### AC-6: Infrastructure Rate Limit Cannot Be Bypassed via X-Forwarded-For Spoofing
**Given** the nginx configuration uses real client IP for rate limiting
**When** a client sends a request with a forged `X-Forwarded-For` header
**Then** nginx uses `$binary_remote_addr` (the TCP connection IP) — not the `X-Forwarded-For` header — as the rate limiting key; the forged header does not bypass the IP-based rate limit

**Category:** security
**Priority:** must-have

### AC-7: Configuration Change Is Deployed Without Downtime
**Given** the nginx rate limiting config is merged and ready to deploy
**When** it is applied to production
**Then** the deployment uses a graceful nginx reload (`nginx -s reload`) and does not cause request drops or connection interruptions; deployment procedure is documented in the PR description or a linked runbook

**Category:** edge-case
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to any internal nginx management API or status endpoint (e.g., `nginx_status`)
**Then** the endpoint returns 401 Unauthorized or is network-restricted to internal IPs only; it is not publicly accessible

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without the `platform_operations` role
**When** they attempt to modify nginx configuration files in the version-controlled infrastructure repository
**Then** the repository access control returns 403 Forbidden; only users with the appropriate infrastructure team permissions may merge changes to nginx configuration files

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| nginx configuration syntax error in rate limiting block | nginx reload fails; previous valid configuration remains active; CI pipeline catches syntax errors before merge via `nginx -t` test | must-have |
| Shared memory zone for rate limiting is exhausted | nginx logs a warning; oldest entries are evicted (LRU behavior); alert is fired to platform operations | should-have |

### Performance
- **Response time:** nginx rejection of rate-limited requests must occur in ≤ 1ms (before application processing); this adds no measurable latency to legitimate requests
- **Scale:** Shared memory zone must be sized to accommodate 50k unique IPs in concurrent rate limiting state (size the `limit_req_zone` accordingly — document the calculation)

### Security
- **Input validation:** Rate limiting key is `$binary_remote_addr` (not header-derived) to prevent spoofing (AC-6)
- **Authorization:** nginx config files are managed via the infrastructure repo with branch protection and required code review

### Accessibility
- Not applicable

## Open Questions
- Is nginx confirmed as the reverse proxy, or is a different API gateway (e.g., AWS API Gateway, Kong, Envoy) in use? If not nginx, this story's implementation details change significantly.
- Should the infrastructure-layer 429 response body exactly match the application-layer response from RATE-01? Consistent messaging is recommended for UX — confirm with the security team.

---

# Acceptance Criteria: MFA-01 — TOTP Enrollment for End Users

## Refined Story Statement
As an end user, I want to enroll my authenticator app (Google Authenticator, Authy, or equivalent) as an MFA method, so that I can secure my account with a time-based one-time password that I control.

## Assumptions
- AWS Secrets Manager is the key management system for TOTP secret encryption — **Confirmed** (per scope)
- AES-256 encryption is the algorithm for TOTP secrets at rest — **Confirmed** (per scope)
- A user can have only one active TOTP method at a time — **Confirmed** (per scope)
- Re-enrollment (replacing an existing TOTP secret) requires the user to re-authenticate first — **Confirmed** (per scope)
- TOTP enrollment is voluntary for users unless org-level enforcement is enabled (enforcement is out of scope for this story) — **Confirmed** (per scope)
- The `mfa_enrollments` table exists — **Confirmed** (dependency: INFRA-AUTH-01)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-5: TOTP clock skew tolerance not specified | Addressed — ±1 TOTP window (±30 seconds) is the standard and is binding in AC | AC-4 |
| G-10: MFA enforcement rollout for existing users | Out of Scope for MFA-01 — enrollment is voluntary here; enforcement is POLICY-01/POLICY-02 | Out of Scope |
| G-4: Recovery code behavior | Out of Scope for MFA-01 — recovery codes are generated in MFA-05 on first MFA method enrollment | Out of Scope |

## Acceptance Criteria

### AC-1: Enrollment Flow — QR Code and Plaintext Secret Displayed
**Given** an authenticated user navigates to "Security Settings > Set Up Authenticator App"
**When** they initiate TOTP enrollment
**Then** the system generates a cryptographically random TOTP secret, displays it as both a scannable QR code (conforming to the `otpauth://` URI scheme) and a plaintext string formatted for manual entry; the QR code renders correctly in Google Authenticator and Authy (validated); the plaintext secret is displayed in groups of 4 characters for readability

**Category:** happy-path
**Priority:** must-have

### AC-2: Enrollment Confirmed by Entering a Valid TOTP Code
**Given** the user has scanned the QR code or manually entered the secret into their authenticator app
**When** they submit a 6-digit TOTP code from their app to the enrollment confirmation field
**Then** the system validates the code against the generated secret with ±1 window tolerance; if the code is valid, the TOTP method is activated and persisted in `mfa_enrollments`; if the code is invalid, an error message "Incorrect code. Please check your authenticator app and try again." is displayed; the enrollment is not activated until a valid code is confirmed

**Category:** happy-path
**Priority:** must-have

### AC-3: TOTP Secret Encrypted at Rest
**Given** a TOTP enrollment is confirmed and persisted
**When** the TOTP secret is stored in `mfa_enrollments`
**Then** the secret is stored as ciphertext (AES-256 encrypted) — never in plaintext; the encryption key is stored in AWS Secrets Manager and not in the database or application configuration files; the application can decrypt the secret only at the time of TOTP validation

**Category:** security
**Priority:** must-have

### AC-4: Clock Skew Tolerance Is ±1 Window (±30 seconds)
**Given** a user's device clock is up to 30 seconds ahead or behind server time
**When** they submit a TOTP code valid for the adjacent window (previous or next 30-second window)
**Then** the code is accepted as valid; codes from windows more than 30 seconds outside the current window are rejected; this tolerance is documented in the security review checklist

**Category:** edge-case
**Priority:** must-have

### AC-5: Re-Enrollment Requires Re-Authentication and Replaces Previous Secret
**Given** a user already has an active TOTP enrollment
**When** they attempt to enroll a new TOTP device
**Then** the system requires the user to re-authenticate (enter their password) before displaying a new QR code; upon confirmation of the new TOTP code, the previous TOTP secret is deactivated and the new secret replaces it in `mfa_enrollments`; the previous secret is no longer accepted for authentication; enrollment event is written to audit log with `event_type = "mfa_reenrolled"`

**Category:** edge-case
**Priority:** must-have

### AC-6: Enrollment Event Written to Audit Log
**Given** a user successfully completes TOTP enrollment
**When** the enrollment is persisted
**Then** an event is written to `auth_audit_log` containing: `event_type = "mfa_enrolled"`, `user_id`, `organization_id`, `mfa_method = "totp"`, `created_at` (UTC); this write must not fail silently — if the audit write fails, the enrollment is still committed but an application error is logged

**Category:** happy-path
**Priority:** must-have

### AC-7: Incomplete Enrollment Does Not Activate MFA
**Given** a user initiates TOTP enrollment (QR code displayed) but closes the browser or navigates away before confirming a valid code
**When** they next log in
**Then** MFA is not enforced on their account (enrollment was not confirmed); the partially generated TOTP secret is discarded after 10 minutes of inactivity; the user can start a fresh enrollment at any time

**Category:** edge-case
**Priority:** must-have

### AC-8: Enrollment QR Code Is Not Logged or Cached
**Given** the TOTP enrollment QR code is generated
**When** it is served to the user
**Then** the QR code and plaintext secret are not written to any application log, access log, or browser cache; the enrollment page sets `Cache-Control: no-store` headers; the secret is not included in any API response after the enrollment confirmation step

**Category:** security
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to `POST /auth/mfa/totp/enroll` or any TOTP enrollment endpoint
**Then** the system returns 401 Unauthorized; the enrollment flow is not accessible without an active session

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user who belongs to an organization where MFA enrollment has been administratively disabled (if such a policy exists)
**When** they attempt to access the TOTP enrollment endpoint
**Then** the system returns 403 Forbidden with a message indicating "MFA enrollment is managed by your organization administrator"; note: this AC is conditional on a future org-level enrollment toggle — if no such toggle exists, write "403 is not applicable for voluntary enrollment; this AC activates when POLICY-01 is implemented"

**Category:** security
**Priority:** should-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| AWS Secrets Manager unavailable during enrollment | Enrollment fails with HTTP 503 "Service temporarily unavailable"; no partial secret is stored; user is prompted to try again | must-have |
| Database write fails after TOTP secret generation | Transaction is rolled back; generated secret is discarded; user sees a generic error and can retry | must-have |
| User submits enrollment confirmation code after 10-minute session expires | Enrollment is rejected; user must restart the enrollment flow from the beginning | must-have |

### Performance
- **Response time:** QR code generation and display must complete in ≤ 500ms p95
- **Scale:** Enrollment events must not degrade under concurrent enrollments during org-wide MFA enforcement rollout (up to 50k users potentially enrolling within a grace period)

### Security
- **Input validation:** TOTP confirmation code must be exactly 6 digits (numeric); any other input returns 400 Bad Request
- **Authorization:** Only the authenticated user may enroll their own TOTP; no endpoint allows enrolling TOTP on behalf of another user (Super Admin reset is MFA-06)
- **TOTP secret strength:** Generated secret must be at least 20 bytes (160 bits) of cryptographically random data

### Accessibility
- QR code must include an `alt` text description and the manual entry option must always be visible alongside the QR code (for screen reader users and accessibility compliance)

## Open Questions
- Should TOTP enrollment require the user to first acknowledge that they understand they will also need to save recovery codes? Recovery code generation is triggered in MFA-05, but the user journey connection between MFA-01 and MFA-05 must be defined.

---

# Acceptance Criteria: MFA-02 — TOTP Login Challenge Flow

## Refined Story Statement
As an end user who has enrolled TOTP, I want to be challenged for my TOTP code after entering my credentials, so that my account requires a second factor to authenticate even if my password is compromised.

## Assumptions
- The login flow is a two-step process: credentials first, then MFA challenge — **Confirmed** (per scope)
- The TOTP challenge is presented only after valid credentials are submitted — **Confirmed** (per scope: "post-credential-verification")
- Replay prevention is enforced by tracking used TOTP windows — **Confirmed** (per scope)
- The rate limiting from RATE-01 applies to the MFA challenge endpoint (`/auth/mfa/challenge`) — **Confirmed** (per RATE-01 scope)
- Recovery codes are accessible from the TOTP challenge screen — **Confirmed** (per scope)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-5: TOTP clock skew tolerance | Addressed — ±1 window tolerance applies to challenge validation, consistent with MFA-01 | AC-3 |
| G-9: Rate limiting thresholds | Addressed — RATE-01 thresholds (5 failures → 15-min lockout) apply to the MFA challenge endpoint; this story consumes that contract | AC-5 |
| G-10: MFA enforcement rollout for existing users | Out of Scope for MFA-02 — this story handles the challenge flow for already-enrolled users; enforcement policy is POLICY-01/02 | Out of Scope |

## Acceptance Criteria

### AC-1: TOTP Challenge Presented After Valid Credentials
**Given** a user with TOTP enrolled submits correct username and password
**When** credentials are verified
**Then** the system does not issue a session token yet; instead, it responds with a TOTP challenge state (e.g., `{ "mfa_required": true, "mfa_method": "totp", "challenge_token": "<short-lived token>" }`) and the UI renders the TOTP code entry screen; the challenge token is valid for 10 minutes

**Category:** happy-path
**Priority:** must-have

### AC-2: Successful TOTP Code Issues Session Token
**Given** the user is on the TOTP challenge screen with a valid challenge token
**When** they submit a correct 6-digit TOTP code
**Then** the session token is issued in an httpOnly cookie; the user is redirected to the post-login destination; an `mfa_challenge_success` event is written to `auth_audit_log` with `user_id`, `organization_id`, `mfa_method = "totp"`, `created_at`

**Category:** happy-path
**Priority:** must-have

### AC-3: Invalid TOTP Code Returns Error Without Session
**Given** the user is on the TOTP challenge screen
**When** they submit an incorrect 6-digit code
**Then** no session token is issued; the UI displays "Incorrect code. Please try again." with the remaining attempt count; the failure is counted against the RATE-01 lockout threshold for this account/IP; if rate limit is reached, the response is HTTP 429 per RATE-01 AC-1

**Category:** error-handling
**Priority:** must-have

### AC-4: TOTP Replay Prevention Within the Same Window
**Given** a user successfully submits a TOTP code for a specific 30-second window
**When** the same code is submitted again within the same 30-second window (before window expiry)
**Then** the second submission is rejected with "Code already used. Please wait for your app to show a new code."; the used window is tracked in the revocation store (Redis) keyed by `{user_id}:{totp_window_timestamp}`; the TTL of the Redis key is 90 seconds (3 windows — current plus adjacent tolerance windows)

**Category:** security
**Priority:** must-have

### AC-5: Rate Limiting Applies to MFA Challenge Failures
**Given** the MFA challenge endpoint is covered by RATE-01
**When** a user or IP accumulates 5 failed TOTP submissions
**Then** the account/IP is locked for 15 minutes per RATE-01 AC-1 and AC-2; the MFA challenge screen displays the lockout message and countdown; the `challenge_token` is invalidated immediately upon lockout

**Category:** security
**Priority:** must-have

### AC-6: Challenge Token Expires After 10 Minutes
**Given** a user receives a TOTP challenge token but does not complete the challenge
**When** 10 minutes elapse from challenge token issuance
**Then** the challenge token is expired; any subsequent TOTP submission with that token returns HTTP 401 with "Session expired. Please log in again."; the user must restart the login flow with credentials

**Category:** edge-case
**Priority:** must-have

### AC-7: Recovery Code Link Available on Challenge Screen
**Given** the user is on the TOTP challenge screen
**When** they cannot access their authenticator app
**Then** a "Use a recovery code instead" link is visible on the TOTP challenge screen; clicking it navigates to the recovery code entry flow (MFA-05 scope); the link is visible without scrolling on mobile viewports (375px width minimum)

**Category:** happy-path
**Priority:** must-have

### AC-8: MFA Challenge Logged Regardless of Outcome
**Given** a TOTP challenge is presented to a user
**When** the challenge succeeds or fails
**Then** an event is written to `auth_audit_log` for every attempt: success → `mfa_challenge_success`; failure → `mfa_challenge_failure`; both events include `user_id`, `organization_id`, `mfa_method = "totp"`, `ip_address`, `created_at`

**Category:** happy-path
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid challenge token is present (i.e., the user did not complete the credential step)
**When** a request is made directly to `POST /auth/mfa/challenge`
**Then** the system returns 401 Unauthorized; the challenge endpoint cannot be called without a valid short-lived challenge token issued by the credential verification step

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user (with an active session) attempts to submit a TOTP challenge
**When** their existing session does not correspond to a pending MFA challenge state
**Then** the system returns 403 Forbidden; submitting a TOTP code is only valid during an active MFA challenge flow, not as a general session upgrade endpoint

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| AWS Secrets Manager unavailable during TOTP validation (cannot decrypt secret) | Challenge returns HTTP 503 "Service temporarily unavailable"; challenge token remains valid; user can retry when the service recovers; alert fired to on-call | must-have |
| Redis unavailable (cannot check replay or apply rate limiting) | Challenge proceeds without replay check and without rate limiting; alert fired immediately to on-call; this is a degraded-security state that must be mitigated within 15 minutes | must-have |
| User submits TOTP code after their account is deleted mid-challenge | Challenge token validation returns 401; no session is issued | must-have |

### Performance
- **Response time:** TOTP challenge validation (including Redis check and Secrets Manager decrypt) must complete in ≤ 300ms p95
- **Scale:** Must support concurrent TOTP challenges for all 50k users without Redis or Secrets Manager becoming a bottleneck; benchmark under load before shipping POLICY-01 (enforcement rollout)

### Security
- **Input validation:** TOTP code must be exactly 6 digits (numeric); any other input returns 400 Bad Request without consuming an attempt
- **Authorization:** Challenge token is single-use — once a TOTP challenge is completed (success or lockout), the challenge token is invalidated

### Accessibility
- TOTP code entry field must be auto-focused on challenge screen load; screen reader must announce "Enter the 6-digit code from your authenticator app"

## Open Questions
- None — all gaps resolved for this story.

---

# Acceptance Criteria: MFA-03 — SMS OTP Enrollment via Twilio

## Refined Story Statement
As an end user, I want to enroll my phone number as an MFA method using SMS one-time passwords delivered via Twilio, so that I can use a second factor without requiring an authenticator app.

## Assumptions
- Twilio is the confirmed SMS provider — **Confirmed** (per scope: "Twilio integration using the existing account")
- EU and Canada phone numbers are supported via the existing Twilio account — **Confirmed** (per scope; must be validated)
- Phone numbers are stored in `mfa_enrollments`, not in a separate PII table — **Confirmed** (per scope)
- Phone numbers are not logged in plaintext in application or access logs — **Confirmed** (per scope)
- The TOTP nudge is informational only (does not block enrollment) — **Confirmed** (per scope)
- User can have only one active SMS method at a time — **Confirmed** (per scope)
- The `mfa_enrollments` table exists — **Confirmed** (dependency: INFRA-AUTH-01)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-3: SMS provider unspecified | Addressed — Twilio is now the confirmed provider per story scope; EU and Canada support must be validated against Twilio's supported regions | AC-1, AC-8 |
| G-10: MFA enforcement rollout for existing users | Out of Scope for MFA-03 — enrollment is voluntary here; enforcement is POLICY-01/POLICY-02 | Out of Scope |

## Acceptance Criteria

### AC-1: Enrollment Flow — Phone Number Entry and OTP Send
**Given** an authenticated user navigates to "Security Settings > Set Up SMS Authentication"
**When** they enter a phone number in international format (E.164) and submit
**Then** Twilio sends a 6-digit OTP to that number; the UI displays "A verification code has been sent to +XX XXXX XXXX" (partially masked); the OTP is valid for 10 minutes and is single-use; if the Twilio API returns an error, the UI displays "We couldn't send a code to that number. Please check the number and try again." without exposing the Twilio error details

**Category:** happy-path
**Priority:** must-have

### AC-2: OTP Confirmation Activates Enrollment
**Given** the user has received an SMS OTP
**When** they enter the correct 6-digit code in the confirmation field
**Then** the SMS MFA method is activated and persisted in `mfa_enrollments` with the phone number stored (not in plaintext logs); an `mfa_enrolled` event is written to `auth_audit_log` with `mfa_method = "sms"`; the user sees a success confirmation

**Category:** happy-path
**Priority:** must-have

### AC-3: Invalid OTP Returns Error Without Activating Enrollment
**Given** the user submits an incorrect 6-digit OTP
**When** the code is validated
**Then** enrollment is not activated; the UI displays "Incorrect code. Please try again." with remaining attempts; after 5 failed OTP attempts, the enrollment session is invalidated and the user must restart enrollment; failed attempts are counted against the RATE-01 account-level threshold

**Category:** error-handling
**Priority:** must-have

### AC-4: OTP Expires After 10 Minutes
**Given** an OTP has been sent to the user's phone
**When** the user submits the OTP more than 10 minutes after it was sent
**Then** the system rejects it with "This code has expired. Please request a new one."; the user can request a new OTP (subject to resend rate limiting — AC-5)

**Category:** edge-case
**Priority:** must-have

### AC-5: OTP Resend Rate Limited
**Given** the user is on the enrollment confirmation screen
**When** they request a new OTP
**Then** a new OTP can be sent a maximum of 3 times per enrollment session; on the 4th resend attempt, the UI displays "Too many attempts. Please start over." and the enrollment session is invalidated; a 60-second cooldown is enforced between resends (the resend button is disabled with a countdown timer)

**Category:** boundary
**Priority:** must-have

### AC-6: TOTP Security Nudge Displayed (Non-Blocking)
**Given** the user initiates SMS OTP enrollment
**When** the enrollment page loads (before they enter a phone number)
**Then** the page displays an informational banner: "For stronger security, consider using an authenticator app instead. SMS codes can be intercepted." with a link to TOTP enrollment; this banner does not block enrollment completion; it is dismissible

**Category:** happy-path
**Priority:** must-have

### AC-7: Re-Enrollment Requires Re-Authentication
**Given** a user already has an active SMS MFA enrollment
**When** they attempt to enroll a new phone number
**Then** the system requires the user to re-authenticate (enter their password) before proceeding; upon confirmation of the new OTP, the previous phone number is deactivated and replaced; the previous phone number is no longer accepted for authentication; an `mfa_reenrolled` event is written to `auth_audit_log`

**Category:** edge-case
**Priority:** must-have

### AC-8: EU and Canada Phone Numbers Supported
**Given** the Twilio integration is active
**When** a user with a phone number in the EU or Canada enrolls SMS OTP
**Then** the OTP is delivered successfully; the enrollment flow does not restrict phone number prefixes for EU or Canadian numbers; Twilio region support is validated in a staging environment before production deployment

**Category:** edge-case
**Priority:** must-have

### AC-9: Phone Number Not Logged in Plaintext
**Given** a user submits their phone number during enrollment
**When** the request is processed
**Then** the phone number does not appear in any application log, access log, Twilio request log (use Twilio's lookup without logging), or error message that could be read by an operator; the phone number stored in `mfa_enrollments` is masked in any admin UI to show only the last 4 digits

**Category:** security
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to `POST /auth/mfa/sms/enroll` or any SMS enrollment endpoint
**Then** the system returns 401 Unauthorized; the enrollment flow is not accessible without an active session

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user whose organization has disabled SMS MFA (e.g., org policy requires TOTP only — a future policy story)
**When** they attempt to access the SMS enrollment endpoint
**Then** the system returns 403 Forbidden with "SMS authentication is not permitted by your organization policy"; if no such org policy exists yet, this AC is deferred to the relevant POLICY story

**Category:** security
**Priority:** should-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Twilio API is unavailable | OTP send fails; UI displays "Unable to send code at this time. Please try again later or use an authenticator app."; Twilio error is logged internally (without PII); alert fired to on-call | must-have |
| Invalid phone number format submitted | The system returns 400 Bad Request with "Please enter a valid phone number in international format (+1XXXXXXXXXX)." before calling Twilio | must-have |
| Twilio rejects the number (unroutable) | UI displays "We couldn't send a code to that number. Please check the number is correct and try again." without exposing Twilio error codes | must-have |

### Performance
- **Response time:** OTP send (Twilio API call) must respond to the user within ≤ 3 seconds p95; if Twilio does not respond within 5 seconds, the request times out and the user sees the unavailable error
- **Scale:** SMS enrollment should not add significant infrastructure load; Twilio rate limits must be documented and monitored

### Security
- **Input validation:** Phone number must be validated against E.164 format (regex: `^\+[1-9]\d{1,14}$`) before any Twilio API call is made; OTP code must be exactly 6 digits (numeric)
- **Authorization:** A user may only enroll a phone number for their own account; no admin endpoint exists to enroll SMS on behalf of a user

### Accessibility
- Phone number input field must include a label "Phone number (international format, e.g. +1 555 000 1234)"; OTP entry field must be auto-focused and numeric keyboard should be shown on mobile (`inputmode="numeric"`)

## Open Questions
- Should the phone number stored in `mfa_enrollments` be encrypted at rest (similar to TOTP secrets)? Phone numbers are PII — recommend encrypting, but this must be confirmed with the security team.
- Does the existing Twilio account have verified support for all required EU country codes? Specific countries (e.g., Germany, France, Netherlands) must be tested before go-live.

---

# Acceptance Criteria: MFA-04 — SMS OTP Login Challenge Flow

## Refined Story Statement
As an end user who has enrolled SMS OTP, I want to receive a one-time password via text message when logging in, so that my account requires a second factor without requiring an authenticator app on my device.

## Assumptions
- OTP is 6 digits, valid for 10 minutes, single-use — **Confirmed** (per scope)
- Rate limiting from RATE-01 applies to the MFA challenge endpoint — **Confirmed** (per scope and RATE-01 scope)
- Recovery codes are accessible from the SMS challenge screen — **Confirmed** (per scope)
- The post-credential challenge flow mirrors MFA-02's structure (challenge token, 10-minute window) — **Confirmed** (per scope consistency)
- Twilio integration is active (from MFA-03) — **Confirmed** (dependency: MFA-03)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-3: SMS provider | Addressed — Twilio is confirmed; this story consumes the MFA-03 Twilio integration | AC-1 |
| G-9: Rate limiting thresholds | Addressed — RATE-01 thresholds (5 failures → 15-min lockout) apply to the SMS challenge endpoint | AC-4 |

## Acceptance Criteria

### AC-1: SMS OTP Sent Automatically on Challenge Presentation
**Given** a user with SMS OTP enrolled submits correct credentials
**When** credentials are verified
**Then** the system automatically triggers a Twilio SMS send with a 6-digit OTP to the user's enrolled phone number; the UI displays "A code has been sent to +XX XXXX XXXX" (partially masked — last 4 digits only visible); the OTP is valid for 10 minutes; if the Twilio send fails, the challenge screen displays "Unable to send a code. Please use a recovery code or try again." and does not issue a session

**Category:** happy-path
**Priority:** must-have

### AC-2: Correct OTP Issues Session Token
**Given** the user is on the SMS OTP challenge screen
**When** they enter the correct 6-digit OTP within 10 minutes of it being sent
**Then** a session token is issued in an httpOnly cookie; the user is redirected to the post-login destination; an `mfa_challenge_success` event is written to `auth_audit_log` with `mfa_method = "sms"`

**Category:** happy-path
**Priority:** must-have

### AC-3: OTP Is Single-Use
**Given** a user successfully logs in with an SMS OTP
**When** the same OTP code is submitted again (e.g., in a replay attack)
**Then** the second submission is rejected with "This code has already been used."; the used OTP state is tracked in Redis with a TTL matching the OTP's remaining validity window; this check applies even if the second submission occurs within the 10-minute validity window

**Category:** security
**Priority:** must-have

### AC-4: Rate Limiting Applies to SMS OTP Challenge Failures
**Given** the MFA challenge endpoint is covered by RATE-01
**When** a user or IP accumulates 5 failed OTP submissions
**Then** the account/IP is locked for 15 minutes per RATE-01 AC-1 and AC-2; the challenge screen displays the lockout message; the challenge token is invalidated immediately upon lockout; lockout event is written to `auth_audit_log`

**Category:** security
**Priority:** must-have

### AC-5: OTP Expires After 10 Minutes
**Given** an SMS OTP has been sent to the user
**When** they submit the OTP more than 10 minutes after it was issued
**Then** the system rejects it with "This code has expired."; the user sees a "Resend code" option subject to AC-6 resend rate limiting

**Category:** edge-case
**Priority:** must-have

### AC-6: OTP Resend Rate Limited on Challenge Screen
**Given** the user is on the SMS OTP challenge screen and the OTP has expired or was not received
**When** they request a new OTP
**Then** a new OTP is sent with a 60-second cooldown between resends; the resend button shows a countdown timer while on cooldown; after 3 resends, the challenge session is invalidated and the user must restart login from credentials; each resend generates a new OTP and invalidates the previous one

**Category:** edge-case
**Priority:** must-have

### AC-7: Recovery Code Link Available on Challenge Screen
**Given** the user is on the SMS OTP challenge screen
**When** they cannot receive the SMS
**Then** a "Use a recovery code instead" link is visible on the challenge screen without scrolling (375px viewport minimum); clicking it navigates to the recovery code entry flow

**Category:** happy-path
**Priority:** must-have

### AC-8: MFA Challenge Logged Regardless of Outcome
**Given** an SMS OTP challenge is presented
**When** the challenge succeeds, fails, or expires
**Then** an event is written to `auth_audit_log` for every attempt: `mfa_challenge_success` or `mfa_challenge_failure`; both include `user_id`, `organization_id`, `mfa_method = "sms"`, `ip_address`, `created_at`; phone number is not included in the log event

**Category:** happy-path
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid challenge token is present
**When** a request is made directly to the SMS OTP challenge validation endpoint
**Then** the system returns 401 Unauthorized; a valid short-lived challenge token (issued after credential verification) is required

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with an active session (no pending MFA challenge) attempts to submit an SMS OTP
**When** the request reaches the challenge endpoint
**Then** the system returns 403 Forbidden; the challenge endpoint is only valid during an active, unresolved MFA challenge flow

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Twilio unavailable when OTP send is triggered | Challenge screen displays "Unable to send a code. Please use a recovery code or contact support."; no session is issued; Twilio error is logged internally; alert fired to on-call | must-have |
| Redis unavailable (cannot track used OTPs or rate limiting) | Challenge proceeds in degraded mode (no replay prevention, no rate limiting); alert fired immediately; this is a critical security degradation requiring on-call response within 15 minutes | must-have |
| User's enrolled phone number is no longer reachable (wrong number) | OTP delivery failure handled per Twilio callback; user sees "Unable to send code" and is directed to recovery codes or support | should-have |

### Performance
- **Response time:** OTP send trigger plus challenge screen render must complete in ≤ 3 seconds p95 (Twilio API latency included)
- **Scale:** Under concurrent login load (all 50k users logging in within a short window, e.g., after a scheduled maintenance window), Twilio rate limits must not cause challenge failures; rate limit headroom must be documented

### Security
- **Input validation:** OTP input must be exactly 6 digits (numeric); non-numeric or non-6-digit input returns 400 Bad Request without consuming an attempt
- **Authorization:** The challenge token scope is single-use and tied to the authenticated user's pending MFA state; tokens cannot be transferred between users

### Accessibility
- OTP entry field must be auto-focused on challenge screen load; `inputmode="numeric"` must be set for mobile keyboard; screen reader must announce "Enter the 6-digit code sent to your phone"

## Open Questions
- None — all gaps resolved for this story.

---

# Acceptance Criteria: MFA-05 — MFA Backup Recovery Codes

## Refined Story Statement
As an end user enabling MFA, I want to generate and save backup recovery codes when I enroll my first MFA method, so that I can regain access to my account if I lose my authenticator device or phone number.

## Assumptions
- 8 single-use recovery codes are generated — **Confirmed** (per scope and G-4 resolution)
- Codes are stored as bcrypt hashes in `recovery_codes` — **Confirmed** (per scope)
- Codes are displayed once and can be copied or downloaded — **Confirmed** (per scope)
- Regeneration invalidates all existing codes — **Confirmed** (per scope)
- Regeneration requires re-authentication — **Confirmed** (per scope: "after re-authenticating")
- When the final code is used, an email alert is sent — **Confirmed** (per scope)
- The `recovery_codes` table exists — **Confirmed** (dependency: INFRA-AUTH-01)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-4: Recovery code count, single/multi-use, regeneration, exhaustion behavior | Addressed — 8 single-use codes, regeneratable after re-auth, email alert on last code used; all defaults from G-4 resolution are binding in AC | AC-1, AC-2, AC-5, AC-6 |

## Acceptance Criteria

### AC-1: 8 Recovery Codes Generated on First MFA Enrollment
**Given** a user successfully completes their first MFA method enrollment (TOTP via MFA-01 or SMS via MFA-03)
**When** enrollment is confirmed
**Then** the user is immediately prompted to generate recovery codes before leaving the enrollment flow; 8 cryptographically random codes are generated; each code is a minimum of 16 characters using a URL-safe character set (alphanumeric, no ambiguous characters like 0/O, 1/l); codes are displayed in a clear, readable format (4-character groups separated by hyphens, e.g., `ABCD-EFGH-IJKL-MNOP`)

**Category:** happy-path
**Priority:** must-have

### AC-2: Codes Are Stored as bcrypt Hashes
**Given** recovery codes are generated
**When** they are persisted to the `recovery_codes` table
**Then** each code is hashed using bcrypt (cost factor ≥ 12) before storage; the plaintext code is never written to the database, logs, or any persistent store; the `recovery_codes` table row for each code contains: `user_id`, `code_hash`, `created_at`, `used_at` (null until used), `invalidated_at` (null until regenerated)

**Category:** security
**Priority:** must-have

### AC-3: Codes Displayed Once with Copy and Download Options
**Given** recovery codes are generated
**When** they are displayed to the user
**Then** the UI displays all 8 codes on a single screen with: a "Copy all codes" button (copies to clipboard as plaintext, newline-separated), a "Download codes" button (downloads as a `.txt` file named `recovery-codes-[username]-[date].txt`); the page header reads "Save these codes somewhere safe — they won't be shown again"; the codes are rendered in a monospace font

**Category:** happy-path
**Priority:** must-have

### AC-4: Codes Cannot Be Re-Displayed After the Enrollment Screen Is Left
**Given** recovery codes were displayed during enrollment
**When** the user navigates away from the enrollment screen (confirmed or closes browser)
**Then** the plaintext codes are no longer retrievable from any endpoint; any subsequent request to view recovery codes returns only a count of remaining codes and their creation date, not the plaintext values; the page sets `Cache-Control: no-store` to prevent browser caching

**Category:** security
**Priority:** must-have

### AC-5: Each Code Is Single-Use
**Given** a user has 8 recovery codes
**When** they use one recovery code to authenticate
**Then** that code is marked as used (`used_at` timestamp set); it cannot be used again — subsequent submissions of the same code return "This code has already been used."; the remaining 7 codes remain valid; a `recovery_code_used` event is written to `auth_audit_log`

**Category:** happy-path
**Priority:** must-have

### AC-6: Email Alert When Final Recovery Code Is Used
**Given** a user has only 1 remaining valid recovery code
**When** that last code is used to authenticate
**Then** after the session is issued, the system sends an email to the user's registered email address with subject "Action required: regenerate your recovery codes" and body advising them to regenerate codes while they have an active session; the email is sent asynchronously (does not delay session issuance); the email is not sent for codes 7 through 2 — only when the last code is consumed

**Category:** edge-case
**Priority:** must-have

### AC-7: Codes Regeneratable After Re-Authentication
**Given** a user navigates to "Security Settings > Recovery Codes"
**When** they click "Regenerate codes" and re-authenticate (enter their password)
**Then** all existing unused recovery codes are immediately invalidated (`invalidated_at` timestamp set); 8 new codes are generated per AC-1 standards; they are displayed per AC-3; a `recovery_codes_regenerated` event is written to `auth_audit_log`; any previously used codes remain in the database for audit purposes (not deleted)

**Category:** happy-path
**Priority:** must-have

### AC-8: Recovery Code Link Available on All MFA Challenge Screens
**Given** a user is on any MFA challenge screen (TOTP, SMS OTP)
**When** they cannot complete the MFA challenge
**Then** a "Use a recovery code instead" link is visible on every MFA challenge screen; clicking it presents a recovery code entry field; this is consistent across MFA-02 and MFA-04 challenge screens

**Category:** happy-path
**Priority:** must-have

### AC-9: Recovery Code Submission Rate Limited
**Given** a user is on the recovery code entry screen
**When** they submit incorrect recovery codes
**Then** after 5 failed recovery code submissions, the account is locked per RATE-01 (15-minute lockout); failed submissions are counted against the same account-level lockout counter as login failures; a `recovery_code_failed` event is written to `auth_audit_log`

**Category:** security
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid challenge token is present
**When** a request is made to the recovery code redemption endpoint
**Then** the system returns 401 Unauthorized; recovery code submission requires a valid challenge token (same as TOTP and SMS challenge flows)

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user attempts to view another user's recovery code status or regenerate another user's codes
**When** the request reaches the recovery code endpoint
**Then** the system returns 403 Forbidden; a user may only manage their own recovery codes; platform super admin reset is a separate action (MFA-06)

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Database write fails during code generation | Transaction is rolled back; no codes are partially stored; user sees "Unable to generate codes. Please try again."; they are not locked out of their account | must-have |
| All 8 recovery codes are exhausted (all used or used + invalidated) | User cannot log in via MFA or recovery codes; MFA-06 (Super Admin reset) is the recovery path; the last-code-used email (AC-6) is the warning that this state is approaching | must-have |
| Email delivery fails for last-code alert | Session is still issued; email failure is logged; alert fired to on-call; manual follow-up is required | should-have |

### Performance
- **Response time:** Code generation and display must complete in ≤ 1 second p95 (bcrypt of 8 codes at cost 12 is the bottleneck — benchmark and adjust cost factor if needed)
- **Scale:** bcrypt cost factor must be evaluated at scale — if 50k users regenerate codes simultaneously (e.g., after a security incident), server load must be acceptable

### Security
- **Input validation:** Recovery code input is normalized (strip hyphens, case-insensitive) before bcrypt comparison; any non-alphanumeric input returns 400 Bad Request
- **Authorization:** Code generation and regeneration require an active session plus re-authentication; no unauthenticated code generation is possible
- **Code strength:** Each code must have at least 80 bits of entropy (16 alphanumeric characters from a 36-character set provides ~82.7 bits)

### Accessibility
- The "Save these codes" prompt must be announced by screen readers; the copy and download buttons must have descriptive `aria-label` attributes

## Open Questions
- Should the user be required to acknowledge they have saved the codes (checkbox) before leaving the enrollment screen? This reduces support cases where users claim they never saw the codes but adds friction. Recommend requiring acknowledgment — confirm with product owner.
- Should already-used recovery code rows be purged after a retention period, or retained indefinitely for audit purposes? Recommend retaining for audit; confirm with security team.

---

# Acceptance Criteria: MFA-06 — Platform Super Admin Recovery Code Reset

## Refined Story Statement
As a Platform Super Admin, I want to reset a locked-out user's recovery codes when all codes have been exhausted, so that the user can regain account access through a secure, auditable process that cannot be exploited by social engineering.

## Assumptions
- The reset sends a fresh set of 8 recovery codes directly to the user's registered email — **Confirmed** (per scope)
- Org Admins explicitly cannot perform this action — **Confirmed** (per scope)
- The new codes follow the same storage rules as MFA-05 (bcrypt hashed) — **Confirmed** (per scope)
- The reset action is audited with the Super Admin's identity — **Confirmed** (per scope)
- The user's registered email is their account email on file, not a separately specified address — **Confirmed** (implied by scope)
- There is no out-of-band identity verification step required before the Super Admin can trigger the reset — **Unconfirmed** (potential social engineering risk — see Open Questions)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Which admin roles qualify for MFA mandate | Addressed — this story clarifies the Platform Super Admin role is distinct from Org Admin; Org Admins are explicitly excluded from this action; role boundary is enforced in AC-AUTH-2 | AC-AUTH-2 |
| G-4: Recovery code behavior (8 codes, bcrypt, regeneratable) | Addressed — reset generates a fresh set of 8 codes following MFA-05 storage rules; existing codes invalidated on reset | AC-1, AC-2 |

## Acceptance Criteria

### AC-1: Super Admin Can Search for User and Trigger Reset
**Given** a Platform Super Admin is authenticated and on the Super Admin user management panel
**When** they search for a user by email address
**Then** the user's account is displayed with their MFA status, including how many recovery codes remain and whether all are exhausted; a "Reset recovery codes" action button is visible; the button is labeled "Reset Recovery Codes" with a confirmation dialog before execution

**Category:** happy-path
**Priority:** must-have

### AC-2: Reset Generates 8 New Codes Emailed to the User
**Given** the Super Admin confirms the recovery code reset action
**When** the reset is executed
**Then** 8 new cryptographically random recovery codes are generated per MFA-05 AC-1 standards; all existing recovery codes for that user are immediately invalidated (`invalidated_at` set on all un-used code rows); the new codes are sent to the user's registered email address with subject "Your account recovery codes have been reset" and the 8 codes in the body; the plaintext codes are never stored or logged by the system after email dispatch; the email is dispatched via the same transactional email system used for other account emails

**Category:** happy-path
**Priority:** must-have

### AC-3: New Codes Stored as bcrypt Hashes
**Given** new recovery codes are generated during the Super Admin reset
**When** they are persisted to `recovery_codes`
**Then** each code is bcrypt-hashed (cost factor ≥ 12) before storage; plaintext codes are not written to the database, any log, or any audit record; this is identical to MFA-05 AC-2

**Category:** security
**Priority:** must-have

### AC-4: Reset Action Written to Audit Log with Super Admin Identity
**Given** a Super Admin executes a recovery code reset
**When** the reset completes (or fails)
**Then** an event is written to `auth_audit_log` containing: `event_type = "recovery_codes_reset_by_admin"`, `target_user_id`, `target_organization_id`, `performed_by_user_id` (Super Admin's user ID), `performed_by_email` (Super Admin's email), `created_at`; this audit entry is not editable or deletable by the Super Admin

**Category:** happy-path
**Priority:** must-have

### AC-5: Org Admins Cannot Execute This Action
**Given** a user with the Org Admin role (but not Platform Super Admin) accesses the user management panel
**When** they attempt to reset recovery codes for a user in their organization
**Then** the "Reset recovery codes" action is not visible in the Org Admin UI; if an Org Admin constructs a direct API call to the reset endpoint, the system returns 403 Forbidden with "This action requires Platform Super Admin permissions."

**Category:** security
**Priority:** must-have

### AC-6: Reset Fails Safely If Email Delivery Fails
**Given** the Super Admin triggers a reset and new codes are generated
**When** the transactional email system returns a delivery failure for the user's email
**Then** the new codes that were generated are immediately invalidated (not stored in a recoverable state); the reset is rolled back; the Super Admin sees an error "We couldn't send the recovery codes to the user's email. The reset was not completed. Please verify the user's email address and try again."; no partial state is left in the database; the failed attempt is written to the audit log

**Category:** error-handling
**Priority:** must-have

### AC-7: Confirmation Dialog Before Execution
**Given** the Super Admin clicks "Reset Recovery Codes"
**When** the confirmation dialog appears
**Then** the dialog displays: the target user's email address, a warning "This will invalidate all existing recovery codes. New codes will be emailed directly to the user.", and two buttons: "Confirm Reset" and "Cancel"; the reset is not executed until "Confirm Reset" is clicked; clicking "Cancel" leaves all existing codes unchanged

**Category:** edge-case
**Priority:** must-have

### AC-8: Reset Does Not Remove Used Code Audit History
**Given** the user has previously used recovery codes (some rows in `recovery_codes` with `used_at` set)
**When** the Super Admin reset is executed
**Then** previously used code rows are NOT deleted — they remain in `recovery_codes` with their `used_at` timestamps intact for audit purposes; only unused codes have `invalidated_at` set; new codes are inserted as new rows

**Category:** edge-case
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the `POST /admin/users/:id/recovery-codes/reset` endpoint
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected — Org Admin and Below
**Given** an authenticated user with a role below Platform Super Admin (including Org Admin, End User, and Security Team member)
**When** they make a request to `POST /admin/users/:id/recovery-codes/reset`
**Then** the system returns 403 Forbidden with a body identifying the missing permission: "Requires: platform_super_admin role. Your role: [their role]"

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Target user does not exist (invalid user ID) | API returns 404 Not Found; no audit log entry is written for a non-existent user | must-have |
| Target user has no MFA enrolled (no recovery codes to reset) | The reset action is disabled in the UI (button grayed out with tooltip "This user has no MFA enrolled"); API returns 409 Conflict with "User has no MFA enrollment to reset." | must-have |
| Database write succeeds but email dispatch fails | Per AC-6 — codes are invalidated and reset is rolled back; no orphaned codes remain | must-have |

### Performance
- **Response time:** Reset action (code generation + email send + audit write) must complete in ≤ 5 seconds p95
- **Scale:** This is a low-frequency operation (expected < 10 resets per day); no special scaling requirements beyond normal transactional email delivery SLA

### Security
- **Input validation:** User ID in the reset endpoint must be validated as an existing user UUID; no SQL injection or path traversal possible via user ID parameter
- **Authorization:** Endpoint uses the authenticated Super Admin's session to authorize; the Super Admin cannot reset their own recovery codes via this endpoint (self-reset must go through the standard MFA-05 regeneration flow)
- **Social engineering mitigation:** The reset is only available to Platform Super Admins (not Org Admins or Support agents); this limits the blast radius of social engineering attacks against support staff; consider whether an additional approval step (second Super Admin confirmation) is warranted — see Open Questions

### Accessibility
- Confirmation dialog must be accessible via keyboard (Tab to buttons, Enter/Space to activate); dialog must trap focus while open; screen reader must announce the dialog heading and warning text

## Open Questions
- Is a single Super Admin's judgment sufficient to trigger a recovery code reset, or should a second Super Admin be required to approve it? Social engineering attacks often target support/admin staff — requiring a second approver reduces this risk. Recommend requiring a second approver, but this must be confirmed with the security team before implementation.
- Should the Super Admin be required to verify the user's identity through an out-of-band channel (e.g., video call, ID check) before triggering the reset? No guidance given. Recommend documenting this as an operational procedure in the Super Admin runbook even if the system cannot enforce it.

---

## Coverage Summary
| # | Story Slug | AC Count | Auth AC | Gap Rows | Status |
|---|-----------|----------|---------|----------|--------|
| 1 | SPIKE-AUTH-01 | 6 + 2 auth | Yes | 2 | Complete |
| 2 | INFRA-AUTH-01 | 10 + 2 auth | Yes | 12 | Complete |
| 3 | RATE-01 | 10 + 2 auth | Yes | 1 | Complete |
| 4 | RATE-02 | 7 + 2 auth | Yes | 1 | Complete |
| 5 | MFA-01 | 8 + 2 auth | Yes | 3 | Complete |
| 6 | MFA-02 | 8 + 2 auth | Yes | 3 | Complete |
| 7 | MFA-03 | 9 + 2 auth | Yes | 2 | Complete |
| 8 | MFA-04 | 8 + 2 auth | Yes | 2 | Complete |
| 9 | MFA-05 | 9 + 2 auth | Yes | 1 | Complete |
| 10 | MFA-06 | 8 + 2 auth | Yes | 2 | Complete |
| **Total** | **10 stories** | **83 AC + 20 auth AC = 103 total** | **All 10** | **29 gap rows** | **Complete** |


<!-- STORY COUNT: 13 stories to process -->

# Acceptance Criteria: POLICY-01 — Mandatory MFA Enforcement for Admin and Billing-Access Roles

## Refined Story Statement
As a security team member, I want MFA enforced automatically for all users with `org_admin`, `platform_super_admin`, or `billing_access` roles — regardless of org-level policy — so that privileged accounts cannot bypass MFA and the Q3 security mandate is met.

## Assumptions
- Role identifiers `org_admin`, `platform_super_admin`, and `billing_access` are the canonical RBAC roles in the platform's existing role model — **Confirmed** (resolved in story scope)
- "No grace period" for role-based mandate means the enrollment wall appears on the very next login with no deferral option — **Confirmed** (stated in scope)
- The one-time report of unenrolled privileged users is generated at deployment and stored/delivered to the security team (e.g., emailed to internal security distribution list or surfaced in Platform Super Admin UI) — **Unconfirmed**
- At least one MFA method (TOTP or SMS) must be live before this enforcement fires in production — **Confirmed** (dependency on MFA-02 or MFA-04)
- If a user holds multiple roles and at least one qualifies, they are subject to this mandate — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Which roles qualify as "admin" for MFA mandate | Addressed in AC — roles explicitly scoped to `org_admin`, `platform_super_admin`, `billing_access` per story scope | AC-1, AC-2 |
| G-2: SSO enforcement exemptions | Out of Scope — this story concerns role-based MFA, not SSO enforcement | N/A |
| G-3: SMS provider | Out of Scope — SMS OTP is a dependency from another batch; this story requires at least one method live, not a specific one | N/A |
| G-4: Recovery code behavior | Out of Scope — handled by MFA recovery code story in prior batch | N/A |
| G-5: TOTP clock skew | Out of Scope — handled by TOTP enrollment/validation story | N/A |
| G-6: Audit log access surface | Addressed in AC — enforcement events must be written to audit log | AC-8 |
| G-7: Session invalidation on policy change | Out of Scope — session invalidation on SSO/policy change is handled by SSO-04 and SESSION-01 | N/A |
| G-8: Okta/Azure AD specificity | Out of Scope — SSO library choice belongs to SSO-02 | N/A |
| G-9: Rate limiting thresholds | Out of Scope — RATE-01 handles rate limiting | N/A |
| G-10: MFA enforcement rollout grace period | Addressed — POLICY-01 explicitly has no grace period for privileged roles; grace period exists only in POLICY-02 | AC-3 |
| G-11: JWT/refresh token strategy | Out of Scope — SESSION-01 / SPIKE-AUTH-01 | N/A |
| G-12: SSO IdP metadata UX | Out of Scope — SSO-01 | N/A |

## Acceptance Criteria

### AC-1: Privileged Role Users Are Challenged for MFA at Login
**Given** a user whose role is `org_admin`, `platform_super_admin`, or `billing_access` has at least one MFA method enrolled
**When** they successfully authenticate with their primary credential (email/password or SSO)
**Then** the system presents an MFA challenge step before granting access to the application

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Unenrolled Privileged Role Users Hit Enrollment Wall at Login
**Given** a user whose role is `org_admin`, `platform_super_admin`, or `billing_access` has no MFA method enrolled
**When** they successfully authenticate with their primary credential
**Then** the system redirects them to an MFA enrollment flow with a message stating "MFA enrollment is required for your role before you can continue"
**And** the user cannot access any other part of the application until enrollment is complete
**And** no "skip" or "remind me later" option is presented

**Category:** happy-path
**Priority:** must-have

---

### AC-3: No Grace Period for Role-Based Mandate
**Given** the org's MFA enforcement policy is disabled (or has a grace period active for regular users)
**When** a user in an `org_admin`, `platform_super_admin`, or `billing_access` role logs in without MFA enrolled
**Then** the enrollment wall is shown immediately — the org-level grace period does not apply to these roles

**Category:** edge-case
**Priority:** must-have

---

### AC-4: Role Change Applies Enforcement on Next Login
**Given** a user is promoted to `org_admin`, `platform_super_admin`, or `billing_access`
**When** they next log in
**Then** MFA enforcement applies as of that login (challenge if enrolled, enrollment wall if not)
**And** any previously active session without MFA challenge is not retroactively invalidated during the current session (enforcement applies at next authentication)

**Category:** edge-case
**Priority:** must-have

---

### AC-5: User Who Completes Enrollment During Wall Accesses Application
**Given** a privileged role user has been redirected to the enrollment wall
**When** they successfully enroll in a valid MFA method and complete setup
**Then** the system immediately treats them as MFA-enrolled
**And** presents the MFA challenge for the current login session
**And** grants access to the application on successful challenge

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Enrollment Wall Cannot Be Bypassed via URL
**Given** a privileged role user with no MFA enrolled is on the enrollment wall
**When** they attempt to navigate directly to any other application URL (deep link, browser back, manual URL entry)
**Then** the system redirects them back to the enrollment wall

**Category:** security
**Priority:** must-have

---

### AC-7: One-Time Report of Unenrolled Privileged Users at Deployment
**Given** the enforcement feature is deployed to production
**When** deployment completes
**Then** a report is generated listing all users with `org_admin`, `platform_super_admin`, or `billing_access` roles who have no MFA method enrolled
**And** the report includes: user ID, display name, email, role(s), organization ID
**And** the report is delivered to the Platform Super Admin UI or security team email (mechanism confirmed via Open Questions)

**Category:** edge-case
**Priority:** must-have

---

### AC-8: MFA Challenge and Enrollment Events Written to Audit Log
**Given** a privileged role user is subject to MFA enforcement
**When** any of the following occurs: MFA challenge initiated, MFA challenge succeeded, MFA challenge failed, MFA enrollment completed via enforcement wall
**Then** an audit log entry is written with: event type, user ID, organization ID, timestamp, IP address, user agent, outcome, and a metadata field indicating `enforcement_context: role_mandate`

**Category:** happy-path
**Priority:** must-have

---

### AC-9: MFA Enforcement Does Not Affect Non-Privileged Users via This Story
**Given** a user with only a non-privileged role (e.g., `member`)
**When** they log in and the org does not have org-wide MFA enforcement enabled (POLICY-02)
**Then** they are not challenged for MFA and are not shown the enrollment wall by this feature

**Category:** boundary
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to any endpoint that checks or enforces role-based MFA status
**Then** the system returns `401 Unauthorized`

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without `platform_super_admin` role attempts to access privileged-role MFA enforcement configuration or the deployment report
**When** the request is made to those administrative endpoints
**Then** the system returns `403 Forbidden` with a message identifying the required permission

**Category:** security
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| MFA challenge backend is unavailable during enforcement check | Login is blocked; display "MFA service temporarily unavailable. Try again in a moment." Do not allow bypass. | must-have |
| User's TOTP app produces wrong code (wrong token) | Display "Invalid code. Please try again." Allow up to 5 attempts before triggering lockout (per RATE-01 policy) | must-have |
| Deployment report generation fails | Log error to system event log; alert on-call; do not silently succeed | must-have |

### Performance
- **Response time:** MFA challenge step must add no more than 200ms to login latency at p95 under 500 concurrent logins
- **Scale:** Enforcement check must handle all ~50k users (with privileged role subset of unknown size)

### Security
- **Input validation:** MFA enrollment inputs (TOTP code, phone number for SMS) validated per respective MFA stories
- **Authorization:** Only the system (not org admins) can determine which roles are subject to this mandate; role list is not configurable via org admin UI

### Accessibility
- Enrollment wall and MFA challenge screens must be keyboard navigable and screen-reader accessible (WCAG 2.1 AA)

## Open Questions
- Is the one-time deployment report delivered via Platform Super Admin UI, security team email, or both? Resolution determines AC-7 verification criteria.
- If a user holds multiple roles (e.g., `org_admin` + `billing_access`), is enforcement applied once or per-role? (Assumed: once — any qualifying role triggers enforcement, but must be confirmed.)

---

# Acceptance Criteria: POLICY-02 — Org-Wide MFA Enforcement with 7-Day Grace Period

## Refined Story Statement
As an Org Admin, I want to require all users in my organization to enroll in MFA within a 7-day grace period before login is blocked, so that I can improve org security without immediately locking out users who haven't set up MFA yet.

## Assumptions
- "Day 8 (first login after grace period end)" means enforcement triggers when `now() > grace_period_ends_at`, regardless of when the user last logged in — **Confirmed** (stated in scope)
- The grace period clock starts at the moment the Org Admin saves the enforcement policy, not at a scheduled future time — **Confirmed** (derived from "now + 7 days")
- Users who enroll in MFA during the grace period are immediately removed from the unenrolled list and the banner is lifted on their next page load — **Confirmed** (stated in scope)
- Users who join the org after enforcement is enabled with a grace period in progress receive their own `grace_period_ends_at` set to the original enforcement timestamp + 7 days (not their join date) — **Unconfirmed**
- The policy change email notification (POLICY-04) is triggered at the moment the Org Admin saves the enforcement policy — **Confirmed** (stated in scope: "policy change triggers email notification")
- POLICY-01 users (privileged roles) subject to immediate enrollment requirement are not subject to POLICY-02's grace period — **Confirmed** (POLICY-01 explicitly excludes grace period for those roles)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Which roles qualify as admin for MFA mandate | Addressed — POLICY-02 covers all users; POLICY-01 (no grace period) applies to privileged roles. Scoping is resolved by the two stories together. | AC-1, AC-9 |
| G-2: SSO enforcement exemptions | Out of Scope | N/A |
| G-3: SMS provider | Out of Scope | N/A |
| G-4: Recovery code behavior | Out of Scope | N/A |
| G-5: TOTP clock skew | Out of Scope | N/A |
| G-6: Audit log access surface | Out of Scope — AUDIT-01/02 | N/A |
| G-7: Session invalidation on policy change | Addressed — enforcement change does not immediately invalidate sessions; grace period banner is shown on next page load. Sessions remain valid. | AC-2 |
| G-8: Okta/Azure AD specificity | Out of Scope | N/A |
| G-9: Rate limiting thresholds | Out of Scope | N/A |
| G-10: MFA enforcement rollout for existing users | Addressed — grace period is 7 days; banner from day 1, escalated banner on day 5, enrollment wall on day 8 | AC-2, AC-3, AC-4, AC-5 |
| G-11: JWT/refresh token strategy | Out of Scope | N/A |
| G-12: SSO IdP metadata UX | Out of Scope | N/A |

## Acceptance Criteria

### AC-1: Org Admin Can Enable Org-Wide MFA Enforcement
**Given** an authenticated Org Admin in the policy settings UI
**When** they enable "Require MFA for all users" and save the setting
**Then** the system sets `mfa_enforcement_enabled = true` and `grace_period_ends_at = now() + 7 days` for the organization
**And** the policy change is written to the audit log
**And** a policy change email notification is sent to all Org Admins in the organization (per POLICY-04)
**And** the UI confirms the setting is active and displays the grace period end date

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Unenrolled Users See Persistent Banner from Day 1
**Given** org-wide MFA enforcement is active and the grace period has not expired
**And** the current user has no MFA method enrolled
**When** the user loads any page in the application
**Then** a persistent banner is displayed at the top of every page with: "MFA enrollment required by [grace_period_ends_at formatted date]. [Enroll now] link."
**And** the banner does not block navigation (user can still access the app)

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Banner Escalates to Urgent Style on Day 5
**Given** org-wide MFA enforcement is active
**And** `now() >= grace_period_ends_at - 2 days` (i.e., 2 or fewer days remain)
**And** the current user has no MFA method enrolled
**When** the user loads any page
**Then** the banner renders in an urgent/warning style (visually distinct from the day-1 style — e.g., red or amber background, stronger language such as "2 days left before your access is blocked")

**Category:** edge-case
**Priority:** must-have

---

### AC-4: Unenrolled Users Hit Enrollment Wall After Grace Period Expires
**Given** `now() > grace_period_ends_at` for the organization
**And** the current user has no MFA method enrolled
**When** the user attempts to log in or resumes a session
**Then** they are redirected to a mandatory MFA enrollment wall with the message "Your organization requires MFA. You must enroll before continuing."
**And** they cannot access any other part of the application until enrollment is complete
**And** no "skip" or "remind me later" option is presented

**Category:** happy-path
**Priority:** must-have

---

### AC-5: User Who Enrolls During Grace Period Has Wall Lifted Immediately
**Given** org-wide MFA enforcement is active and the grace period is in progress or has expired
**When** a previously unenrolled user successfully completes MFA enrollment
**Then** the persistent banner is removed on their next page load
**And** if they were on the enrollment wall (post-grace-period), they are granted access to the application upon completing enrollment
**And** the MFA enrollment event is written to the audit log

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Privileged Role Users Are Not Subject to Grace Period
**Given** org-wide MFA enforcement is enabled with a 7-day grace period
**And** a user with `org_admin`, `platform_super_admin`, or `billing_access` role has no MFA enrolled
**When** they log in
**Then** they are immediately shown the enrollment wall (per POLICY-01), not the grace period banner

**Category:** boundary
**Priority:** must-have

---

### AC-7: Org Admin Can Disable Org-Wide MFA Enforcement
**Given** org-wide MFA enforcement is currently active
**When** an Org Admin disables the setting and saves
**Then** `mfa_enforcement_enabled = false` and `grace_period_ends_at` is cleared for the organization
**And** unenrolled users no longer see the banner or enrollment wall (on next load/login)
**And** the policy change is written to the audit log
**And** a POLICY-04 email notification is sent to all Org Admins

**Category:** happy-path
**Priority:** must-have

---

### AC-8: Re-enabling Enforcement Resets Grace Period
**Given** org-wide MFA enforcement was previously enabled and then disabled
**When** an Org Admin re-enables it
**Then** a new `grace_period_ends_at = now() + 7 days` is set
**And** unenrolled users begin seeing the banner again

**Category:** edge-case
**Priority:** must-have

---

### AC-9: Already-Enrolled Users Are Not Affected by Enforcement
**Given** org-wide MFA enforcement is enabled (grace period active or expired)
**And** the current user has at least one MFA method enrolled
**When** they log in or navigate the application
**Then** they see no banner and no enrollment wall
**And** they are prompted for MFA challenge at login as normal

**Category:** boundary
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the org policy settings endpoint to enable or disable MFA enforcement
**Then** the system returns `401 Unauthorized`

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without `org_admin` or `platform_super_admin` role
**When** a request is made to the org policy settings endpoint to enable or disable MFA enforcement
**Then** the system returns `403 Forbidden` with a message identifying the required permission

**Category:** security
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Policy save fails (database error) | Display "Failed to save policy. Please try again." Do not partially apply the change. | must-have |
| POLICY-04 notification email fails to send | Log the failure; do not roll back the policy change; retry delivery asynchronously | should-have |
| User's `grace_period_ends_at` check fails during page load | Fail open: display the banner (conservative — never silently lift the requirement due to an error) | must-have |

### Performance
- **Response time:** Grace period status check on page load must complete within 100ms at p95
- **Scale:** Banner/wall enforcement logic must scale to all ~50k users loading pages concurrently

### Security
- **Input validation:** Policy enable/disable is a boolean toggle — no free-text input; validate that the Org Admin belongs to the org they are modifying
- **Authorization:** Org Admins can only modify their own org's policy; Platform Super Admins can modify any org

### Accessibility
- Persistent banner must be announced by screen readers (ARIA live region or `role="alert"`)
- Enrollment wall must be fully keyboard accessible (WCAG 2.1 AA)

## Open Questions
- Do users who join the org after enforcement is enabled receive a grace period ending at the original `grace_period_ends_at` or at `join_date + 7 days`? (This affects AC-4 verification for late joiners — must be confirmed.)

---

# Acceptance Criteria: POLICY-03 — MFA Grace Period Enrollment Tracking for Org Admins

## Refined Story Statement
As an Org Admin, I want to see a real-time list of users in my organization who have not yet enrolled in MFA during the active grace period, so that I can follow up with specific individuals before the deadline.

## Assumptions
- "Real time" means the list refreshes without a full page reload — polling or WebSocket updates are acceptable, but the maximum staleness should be specified — **Unconfirmed** (UI update latency not specified)
- The tracking dashboard is only visible when: (a) org-wide MFA enforcement is active AND (b) `now() < grace_period_ends_at` (grace period in progress). After expiry, it is hidden or replaced with a completion state — **Confirmed** (derived from scope: "visible only when org-wide MFA enforcement is active and grace period is in progress")
- "Name + email" refers to the user's display name and primary email in the platform — **Confirmed**
- The list is scoped to the Org Admin's own org — Org Admins cannot see other orgs — **Confirmed** (implied by "users in my organization")
- Platform Super Admins can also view this dashboard for any org — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Admin role scoping | Out of Scope — POLICY-01 resolves role scoping; this story only displays data | N/A |
| G-2: SSO enforcement exemptions | Out of Scope | N/A |
| G-3: SMS provider | Out of Scope | N/A |
| G-4: Recovery codes | Out of Scope | N/A |
| G-5: TOTP clock skew | Out of Scope | N/A |
| G-6: Audit log access surface | Out of Scope — AUDIT-02 handles audit log UI | N/A |
| G-7: Session invalidation on policy change | Out of Scope | N/A |
| G-8: Okta/Azure AD specificity | Out of Scope | N/A |
| G-9: Rate limiting thresholds | Out of Scope | N/A |
| G-10: MFA enforcement rollout | Addressed — this story provides visibility into rollout progress during the grace period defined in POLICY-02 | AC-1, AC-2, AC-3 |
| G-11: JWT/refresh token strategy | Out of Scope | N/A |
| G-12: SSO IdP metadata UX | Out of Scope | N/A |

## Acceptance Criteria

### AC-1: Dashboard Shows Unenrolled Count and User List During Grace Period
**Given** an Org Admin is authenticated
**And** org-wide MFA enforcement is active for their organization
**And** the grace period has not yet expired
**When** they navigate to the MFA enrollment tracking section of the admin dashboard
**Then** the system displays:
- Total count of users who have not enrolled in MFA
- A list of unenrolled users, each showing: display name and email address
- Days remaining until grace period expires (e.g., "3 days remaining — deadline: [date]")

**Category:** happy-path
**Priority:** must-have

---

### AC-2: List Updates Without Full Page Reload When a User Enrolls
**Given** the Org Admin is viewing the enrollment tracking dashboard
**When** a user in the organization completes MFA enrollment
**Then** that user is removed from the unenrolled list within 60 seconds without a full page reload
**And** the count of unenrolled users decrements accordingly

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Dashboard Is Hidden When Grace Period Has Expired
**Given** org-wide MFA enforcement is active
**And** `now() >= grace_period_ends_at`
**When** an Org Admin navigates to the enrollment tracking section
**Then** the tracking list is not shown (the enforcement wall is now active for unenrolled users; no tracking needed)
**And** an informational message is displayed: "The enrollment grace period has ended. Users without MFA are now blocked from accessing the application."

**Category:** edge-case
**Priority:** must-have

---

### AC-4: Dashboard Is Hidden When Enforcement Is Not Active
**Given** org-wide MFA enforcement is not enabled for the organization
**When** an Org Admin navigates to the enrollment tracking section
**Then** the tracking dashboard is not shown (or shows a message: "Enable MFA enforcement in policy settings to see enrollment tracking")

**Category:** edge-case
**Priority:** must-have

---

### AC-5: Dashboard Shows Empty State When All Users Are Enrolled
**Given** org-wide MFA enforcement is active and the grace period is in progress
**And** all users in the organization have enrolled in MFA
**When** the Org Admin views the tracking dashboard
**Then** the unenrolled count shows 0
**And** the user list is empty with a message: "All users have enrolled in MFA."

**Category:** edge-case
**Priority:** must-have

---

### AC-6: No Cross-Org Data Leakage
**Given** an Org Admin for Organization A is authenticated
**When** the enrollment tracking API endpoint is called
**Then** the response contains only users belonging to Organization A
**And** no users from other organizations are returned regardless of query parameters passed

**Category:** security
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the MFA enrollment tracking dashboard endpoint
**Then** the system returns `401 Unauthorized`

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without `org_admin` or `platform_super_admin` role
**When** a request is made to the MFA enrollment tracking dashboard endpoint
**Then** the system returns `403 Forbidden` with a message identifying the required permission

**Category:** security
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Database query for unenrolled users times out | Display "Unable to load enrollment status. Refresh to try again." Do not show a partial list. | must-have |
| Real-time update connection drops | Fall back to displaying the last loaded list with a "Last updated [time]" label and a manual refresh button | should-have |

### Performance
- **Response time:** Initial dashboard load must return the unenrolled user list within 500ms at p95 for orgs with up to 10,000 users
- **Scale:** Real-time update mechanism must handle concurrent updates from up to 1,000 users enrolling simultaneously without dropping events

### Security
- **Authorization:** Backend must validate `organization_id` from the admin's JWT — do not accept `organization_id` from query parameters for data scoping
- **Input validation:** No user-controlled filtering inputs in this version (display only)

### Accessibility
- User list must be navigable by keyboard and screen reader (WCAG 2.1 AA)
- Count badge must have accessible text alternative (not just a number in a visual badge)

## Open Questions
- What is the acceptable maximum staleness for "real time" updates — 30 seconds? 60 seconds? This determines whether polling or WebSocket is required.
- Can Platform Super Admins view this dashboard for any org, or is it limited to Org Admins viewing their own org?

---

# Acceptance Criteria: POLICY-04 — Policy Change Email Notifications to Org Admins

## Refined Story Statement
As an Org Admin, I want to receive an email notification when any authentication policy in my organization is changed by any admin (including co-admins and Platform Super Admins), so that I am not blindsided by security configuration changes.

## Assumptions
- "All Org Admins" means every user with `org_admin` role in the affected org receives the email — **Confirmed** (stated in scope)
- The actor (who made the change) is identified in the email by their display name and email — **Confirmed** (derived from "who changed it")
- If the actor is a Platform Super Admin changing a policy for an org they don't belong to, the notification still goes to all Org Admins of that org — **Confirmed** (stated in scope)
- The notification email is sent asynchronously (non-blocking to the policy save operation) — **Unconfirmed**
- Email delivery failures do not roll back the policy change — **Unconfirmed** (assumed: the policy change is authoritative; email is best-effort)
- The email is sent from a verified system email address (e.g., `no-reply@[platform-domain]`) — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Admin role scoping | Out of Scope for this story — recipients are all `org_admin` users, which is clear | N/A |
| G-2: SSO enforcement exemptions | Out of Scope | N/A |
| G-3: SMS provider | Out of Scope | N/A |
| G-4: Recovery codes | Out of Scope | N/A |
| G-5: TOTP clock skew | Out of Scope | N/A |
| G-6: Audit log access surface | Out of Scope — AUDIT-01/02 | N/A |
| G-7: Session invalidation on policy change | Out of Scope — SSO-04 handles session invalidation | N/A |
| G-8: Okta/Azure AD specificity | Out of Scope | N/A |
| G-9: Rate limiting thresholds | Out of Scope | N/A |
| G-10: MFA enforcement rollout | Addressed — enabling/disabling MFA enforcement is one of the trigger events | AC-1 |
| G-11: JWT/refresh token strategy | Out of Scope | N/A |
| G-12: SSO IdP metadata UX | Out of Scope | N/A |

## Acceptance Criteria

### AC-1: Email Sent When MFA Enforcement Is Enabled or Disabled
**Given** an Org Admin or Platform Super Admin changes `mfa_enforcement_enabled` for an organization
**When** the change is saved successfully
**Then** an email notification is sent to all Org Admins of the affected organization
**And** the email includes: the policy that changed ("MFA enforcement"), the new state ("enabled" or "disabled"), the actor's display name and email, and the UTC timestamp of the change
**And** the email is informational only (no action links required)

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Email Sent When SSO Is Enabled or Disabled
**Given** an Org Admin or Platform Super Admin changes `sso_enabled` for an organization
**When** the change is saved successfully
**Then** an email notification is sent to all Org Admins of the affected organization with the same fields as AC-1 (policy name: "SSO", new state, actor, timestamp)

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Email Sent When Session Timeout Is Updated
**Given** an Org Admin or Platform Super Admin changes `session_timeout` for an organization
**When** the change is saved successfully
**Then** an email notification is sent to all Org Admins with: policy name "Session timeout", previous value, new value, actor, and timestamp

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Platform Super Admin Changes Trigger Notifications to Org Admins
**Given** a Platform Super Admin modifies an authentication policy for an organization they do not belong to
**When** the change is saved
**Then** all Org Admins of the affected organization receive the notification email
**And** the email correctly identifies the Platform Super Admin as the actor

**Category:** edge-case
**Priority:** must-have

---

### AC-5: Notification Is Not Sent to the Actor
**Given** an Org Admin changes a policy in their own organization
**When** the change is saved
**Then** the notification email is sent to all other Org Admins in the organization
**And** the actor does not receive a notification email (they made the change — they know)

**Category:** edge-case
**Priority:** should-have

---

### AC-6: No Email Sent When Policy Is Read (No Change)
**Given** an Org Admin views the policy settings page without making any change
**When** they navigate away or explicitly cancel
**Then** no notification email is sent

**Category:** boundary
**Priority:** must-have

---

### AC-7: No Email Sent When Policy Is Saved With Identical Values
**Given** an Org Admin opens the policy settings and saves without changing any value
**When** the save is completed
**Then** no notification email is sent (no effective change occurred)

**Category:** boundary
**Priority:** must-have

---

### AC-8: Email Delivery Failure Does Not Roll Back Policy Change
**Given** a policy change is saved successfully
**When** the email delivery fails (SMTP error, invalid address, etc.)
**Then** the policy change remains in effect
**And** the delivery failure is logged to the system error log
**And** delivery is retried asynchronously (at least once)

**Category:** error-handling
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to trigger a policy change (which would generate a notification)
**Then** the system returns `401 Unauthorized` and no notification is sent

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without `org_admin` or `platform_super_admin` role
**When** a request is made to change an org policy
**Then** the system returns `403 Forbidden` and no notification is sent

**Category:** security
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Organization has no Org Admins (edge case) | Log a warning; do not throw an error; policy change completes normally | should-have |
| Email service is down at time of policy change | Queue the notification for retry; alert on-call if queue depth exceeds threshold | should-have |

### Performance
- **Response time:** Notification email dispatch must not add more than 200ms to the policy save API response (async dispatch)
- **Scale:** Notification system must handle burst of concurrent policy changes (e.g., Platform Super Admin batch-updating multiple orgs)

### Security
- **Input validation:** Email recipient list is derived from the platform's user/role table — not from user-supplied input; protects against email injection
- **Authorization:** The notification trigger is server-side only; no client-side call can generate a notification email directly

## Open Questions
- Should the actor receive a confirmation copy of their own change (separate from the notification to co-admins)? The story currently excludes the actor — confirm this is intentional.
- What is the "from" email address and display name for notification emails? (Affects deliverability and brand trust.)

---

# Acceptance Criteria: POLICY-05 — Org Session Timeout Configuration

## Refined Story Statement
As an Org Admin, I want to configure a session timeout for my organization within a range of 1 hour to 30 days, so that session lifetime reflects my organization's security posture.

## Assumptions
- "Change takes effect for new sessions immediately" means sessions created after the save use the new timeout; sessions created before the save expire at their original timeout — **Confirmed** (stated in scope)
- The default is 24 hours and is applied to new organizations at creation — **Confirmed** (stated in scope)
- The valid range is 1 hour to 30 days (inclusive at both bounds) — **Confirmed**
- The UI allows entry in human-readable units (hours/days), not raw seconds — **Unconfirmed**
- This story requires SPIKE-AUTH-01 to complete before the session timeout is technically implemented; this story defines the configuration UI and policy storage only — **Confirmed** (dependency stated)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Admin role scoping | Out of Scope | N/A |
| G-2: SSO enforcement exemptions | Out of Scope | N/A |
| G-3: SMS provider | Out of Scope | N/A |
| G-4: Recovery codes | Out of Scope | N/A |
| G-5: TOTP clock skew | Out of Scope | N/A |
| G-6: Audit log access surface | Out of Scope | N/A |
| G-7: Session invalidation on policy change | Addressed — existing sessions are NOT terminated when timeout changes; only new sessions use the new value | AC-3 |
| G-8: Okta/Azure AD specificity | Out of Scope | N/A |
| G-9: Rate limiting thresholds | Out of Scope | N/A |
| G-10: MFA enforcement rollout | Out of Scope | N/A |
| G-11: JWT/refresh token strategy | Open Question — SPIKE-AUTH-01 must confirm the architecture before SESSION-01 can implement the timeout; this story only stores the configuration | Open Questions |
| G-12: SSO IdP metadata UX | Out of Scope | N/A |

## Acceptance Criteria

### AC-1: Org Admin Can Configure Session Timeout Within Valid Range
**Given** an authenticated Org Admin in the policy settings UI
**When** they set a session timeout value between 1 hour and 30 days (inclusive) and save
**Then** the org's `session_timeout` is updated in the database
**And** the audit log records: event type `session_timeout_changed`, previous value, new value, actor, org ID, timestamp
**And** a POLICY-04 email notification is sent to all Org Admins of the org
**And** the UI confirms the new value is saved

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Timeout Below Minimum Is Rejected
**Given** an Org Admin enters a session timeout value less than 1 hour (e.g., 30 minutes)
**When** they attempt to save
**Then** the system rejects the input with a clear validation error: "Session timeout must be between 1 hour and 30 days."
**And** the current org `session_timeout` value is not changed

**Category:** boundary
**Priority:** must-have

---

### AC-3: Timeout Above Maximum Is Rejected
**Given** an Org Admin enters a session timeout value greater than 30 days (e.g., 31 days)
**When** they attempt to save
**Then** the system rejects the input with: "Session timeout must be between 1 hour and 30 days."
**And** the current org `session_timeout` value is not changed

**Category:** boundary
**Priority:** must-have

---

### AC-4: New Sessions Use the Updated Timeout After Save
**Given** an Org Admin has saved a new session timeout of X hours
**When** a user in the organization logs in after the save
**Then** their session expires at `login_time + X hours`

**Category:** happy-path
**Priority:** must-have

---

### AC-5: Existing Sessions Are Not Terminated When Timeout Changes
**Given** User A has an active session that was created with a 24-hour timeout
**When** an Org Admin changes the session timeout to 1 hour
**Then** User A's existing session continues to be valid until its original expiry (`session_created_at + 24 hours`)
**And** User A is not immediately logged out

**Category:** edge-case
**Priority:** must-have

---

### AC-6: Default Timeout Is 24 Hours for New Organizations
**Given** a new organization is created
**When** no Org Admin has yet configured a session timeout
**Then** the org's `session_timeout` defaults to 24 hours

**Category:** boundary
**Priority:** must-have

---

### AC-7: Platform Super Admin Can Configure Session Timeout for Any Org
**Given** an authenticated Platform Super Admin
**When** they configure the session timeout for any organization and save
**Then** the same behavior as AC-1 applies (audit log, notification, value stored)
**And** the POLICY-04 notification identifies the Platform Super Admin as the actor

**Category:** edge-case
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the session timeout configuration endpoint
**Then** the system returns `401 Unauthorized`

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without `org_admin` or `platform_super_admin` role
**When** a request is made to update the session timeout for an org
**Then** the system returns `403 Forbidden` with a message identifying the required permission

**Category:** security
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Database write fails when saving timeout | Return 500 with "Failed to save session timeout. Please try again." Do not partially apply. | must-have |
| Non-numeric input (e.g., "two days") | Client-side and server-side validation reject with clear error before save | must-have |

### Performance
- **Response time:** Session timeout configuration save completes within 300ms at p95

### Security
- **Input validation:** `session_timeout` must be validated as a positive integer (seconds or hours depending on storage unit — must be consistent with SESSION-01 implementation) within the 1 hour–30 day range; reject strings, floats, and negative values
- **Authorization:** Org Admin can only modify their own org's timeout; `organization_id` must be derived from the admin's JWT, not from the request body

## Open Questions
- SPIKE-AUTH-01 must confirm the JWT/refresh token architecture before SESSION-01 can honor this timeout. Until resolved, this story only stores the configuration value; it does not guarantee the session lifecycle honors it. Flag as implementation-incomplete until SPIKE-AUTH-01 closes.

---

# Acceptance Criteria: SSO-01 — SSO IdP Configuration UI for Org Admins

## Refined Story Statement
As an Org Admin, I want to configure my organization's Identity Provider using a metadata URL import or XML file upload, so that I can set up SSO for my organization without needing Platform Super Admin involvement.

## Assumptions
- The UI parses and displays extracted values (entity ID, SSO URL, signing certificate) for admin review before the configuration is saved — **Confirmed** (stated in scope)
- Manual field-by-field entry is explicitly excluded from v1 per stakeholder — **Confirmed**
- The `sso_configurations` table schema reserves SCIM columns at this phase (not populated) to avoid future migrations — **Confirmed**
- URL-based metadata import fetches the URL server-side (not client-side), to avoid SSRF risks — **Unconfirmed**
- An org can have at most one active SSO configuration at a time; configuring a second replaces the first — **Unconfirmed**
- Only Org Admins and Platform Super Admins can manage SSO configurations; regular users cannot — **Confirmed** (derived from scope)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Admin role scoping | Out of Scope | N/A |
| G-2: SSO enforcement exemptions | Out of Scope — SSO enforcement is SSO-04 | N/A |
| G-3: SMS provider | Out of Scope | N/A |
| G-4: Recovery codes | Out of Scope | N/A |
| G-5: TOTP clock skew | Out of Scope | N/A |
| G-6: Audit log access surface | Addressed — configuration change written to audit log | AC-5 |
| G-7: Session invalidation on policy change | Out of Scope — SSO-04 handles session invalidation on SSO enable | N/A |
| G-8: Okta/Azure AD specificity | Addressed — generic SAML 2.0 + OIDC satisfies requirement; no custom IdP-specific integration in this story | AC-1, AC-2 |
| G-9: Rate limiting thresholds | Out of Scope | N/A |
| G-10: MFA enforcement rollout | Out of Scope | N/A |
| G-11: JWT/refresh token strategy | Out of Scope | N/A |
| G-12: SSO IdP metadata UX | Addressed — two paths: metadata URL import and XML file upload; manual field entry excluded from v1 | AC-1, AC-2 |

## Acceptance Criteria

### AC-1: Org Admin Can Import IdP Metadata via URL
**Given** an authenticated Org Admin in the SSO configuration UI
**When** they enter a valid metadata URL and click "Import"
**Then** the system fetches the metadata XML from the URL server-side
**And** extracts and displays for review: Entity ID, SSO URL (redirect binding), signing certificate (common name and expiry)
**And** the admin can confirm and save the configuration
**And** on save, the configuration is stored in `sso_configurations` with the org's `organization_id`

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Org Admin Can Upload IdP Metadata via XML File
**Given** an authenticated Org Admin in the SSO configuration UI
**When** they upload a valid SAML metadata XML file
**Then** the system parses the file and extracts: Entity ID, SSO URL, signing certificate
**And** displays extracted values for admin review before saving
**And** on save, the configuration is stored in `sso_configurations`

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Invalid Metadata URL Returns Clear Error
**Given** an Org Admin enters a metadata URL that is unreachable or returns a non-XML response
**When** they click "Import"
**Then** the system displays a clear error: "Unable to fetch metadata from this URL. Check the URL and try again, or upload the XML file directly."
**And** no partial configuration is saved

**Category:** error-handling
**Priority:** must-have

---

### AC-4: Invalid XML File Returns Clear Error
**Given** an Org Admin uploads a file that is not valid SAML metadata XML (e.g., wrong format, missing required elements)
**When** the file is processed
**Then** the system displays a clear error: "The uploaded file is not valid SAML metadata. Please check the file and try again."
**And** no partial configuration is saved

**Category:** error-handling
**Priority:** must-have

---

### AC-5: Configuration Save Is Written to Audit Log
**Given** an Org Admin or Platform Super Admin saves an SSO configuration (create, update, or delete)
**When** the save completes successfully
**Then** an audit log entry is written with: event type (`sso_config_created`, `sso_config_updated`, or `sso_config_deleted`), actor, organization ID, timestamp, and metadata (Entity ID)
**And** a POLICY-04 notification email is sent to all Org Admins

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Org Admin Can Update Existing SSO Configuration
**Given** an org has an existing SSO configuration
**When** the Org Admin imports new metadata and saves
**Then** the existing configuration is replaced with the new one
**And** the audit log records `sso_config_updated`

**Category:** happy-path
**Priority:** must-have

---

### AC-7: Org Admin Can Remove SSO Configuration
**Given** an org has an existing SSO configuration
**When** the Org Admin clicks "Remove SSO configuration" and confirms
**Then** the configuration is deleted from `sso_configurations`
**And** the audit log records `sso_config_deleted`
**And** a POLICY-04 notification is sent

**Category:** happy-path
**Priority:** must-have

---

### AC-8: Platform Super Admin Can Manage SSO Configuration for Any Org
**Given** an authenticated Platform Super Admin
**When** they access the SSO configuration UI for any organization and make changes
**Then** the same behavior applies as for Org Admin (AC-1 through AC-7)
**And** the audit log identifies the Platform Super Admin as the actor

**Category:** edge-case
**Priority:** must-have

---

### AC-9: SCIM Columns Reserved in Schema Without Being Populated
**Given** an SSO configuration is saved
**When** the `sso_configurations` table row is created
**Then** SCIM provisioning columns (e.g., `scim_endpoint`, `scim_token`) are present in the schema as nullable/null — not populated and not exposed in the UI in this phase

**Category:** boundary
**Priority:** must-have

---

### AC-10: Metadata URL Fetch Is Performed Server-Side
**Given** an Org Admin enters a metadata URL
**When** the system fetches the metadata
**Then** the fetch is performed by the backend server, not the browser
**And** the backend validates that the URL resolves to a publicly routable address (reject private IP ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, ::1)

**Category:** security
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the SSO configuration endpoints (GET, POST, PUT, DELETE)
**Then** the system returns `401 Unauthorized`

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without `org_admin` or `platform_super_admin` role
**When** a request is made to create, update, or delete an SSO configuration
**Then** the system returns `403 Forbidden` with a message identifying the required permission

**Category:** security
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Metadata URL fetch times out (>10s) | Display "Metadata URL timed out. Try again or upload the XML directly." No partial save. | must-have |
| XML file exceeds size limit | Reject with "File too large. Maximum size is [X] KB." (size limit must be defined — see Open Questions) | must-have |
| Signing certificate in metadata is expired | Display a warning during review: "Warning: The signing certificate in this metadata expires on [date]." Allow admin to proceed. | should-have |

### Performance
- **Response time:** Metadata URL import (fetch + parse) completes within 5 seconds at p95 under normal IdP availability

### Security
- **Input validation:** Metadata URL must be a valid HTTPS URL; HTTP URLs rejected; private IP ranges blocked (SSRF protection per AC-10)
- **File upload:** Validate file MIME type and extension; parse in a sandboxed context; enforce a maximum file size
- **Authorization:** SSO config reads are scoped to the admin's own org; Platform Super Admins scope to requested org via explicit org selection

### Accessibility
- File upload button must be accessible (WCAG 2.1 AA); keyboard operable; upload status announced to screen readers

## Open Questions
- What is the maximum XML file size for upload? Must be defined to complete AC-4 variant.
- What happens if an org has SSO enforcement enabled (SSO-04) and the admin removes the SSO configuration? Should the system prevent deletion or automatically disable enforcement first?

---

# Acceptance Criteria: SSO-02 — SAML 2.0 SP-Initiated Login Flow

## Refined Story Statement
As an end user whose organization uses a SAML 2.0 IdP (e.g., Okta, Azure AD), I want to log in by clicking "Sign in with SSO" and being redirected to my company's identity provider, so that I authenticate through my organization's centralized identity system without managing a separate password.

## Assumptions
- Both redirect binding and POST binding for the SAML AuthnRequest and SAMLResponse are supported — **Confirmed** (stated in scope)
- IdP-initiated flow is out of scope for this phase — **Confirmed**
- The system creates a user session on successful SAML assertion — and creates the user account if it doesn't exist (just-in-time provisioning) — **Unconfirmed** (the scope says "create or update user session" which could mean JIT provisioning; must confirm)
- Library selection (node-saml vs passport-saml) is decided during implementation after CVE review; this story does not mandate a specific library — **Confirmed**
- Failed SAML validation shows a user-friendly error, not raw XML — **Confirmed**
- The SSO login entry point is a "Sign in with SSO" button on the login page that asks for the user's email to determine org — **Unconfirmed** (flow for email detection not specified)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Admin role scoping | Out of Scope | N/A |
| G-2: SSO enforcement exemptions | Out of Scope — SSO-04 handles forced SSO; this story handles voluntary SSO login | N/A |
| G-3: SMS provider | Out of Scope | N/A |
| G-4: Recovery codes | Out of Scope | N/A |
| G-5: TOTP clock skew | Out of Scope | N/A |
| G-6: Audit log access surface | Addressed — SSO assertion events written to audit log | AC-6 |
| G-7: Session invalidation on policy change | Out of Scope — SSO-04 handles session invalidation | N/A |
| G-8: Okta/Azure AD specificity | Addressed — tested against real Okta and Azure AD tenants; generic SAML 2.0 implementation satisfies requirement | AC-1, AC-3 |
| G-9: Rate limiting thresholds | Addressed — rate limiting on login endpoint per RATE-01 is a dependency; this story assumes RATE-01 is live | N/A |
| G-10: MFA enforcement rollout | Out of Scope | N/A |
| G-11: JWT/refresh token strategy | Out of Scope | N/A |
| G-12: SSO IdP metadata UX | Out of Scope — SSO-01 handles configuration | N/A |

## Acceptance Criteria

### AC-1: User Is Redirected to IdP on SP-Initiated SSO Login
**Given** a user enters their email address on the login page
**And** their organization has a SAML 2.0 SSO configuration
**When** they click "Sign in with SSO"
**Then** the system constructs a SAML AuthnRequest with: SP entity ID, ACS URL, RelayState, and a signed request
**And** the user is redirected to the IdP's SSO URL via redirect binding (or POST binding if configured)

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Successful SAMLResponse Creates a User Session
**Given** the IdP has authenticated the user and posts a SAMLResponse to the ACS endpoint
**When** the system receives the SAMLResponse
**Then** it validates: signature (against the configured signing certificate), audience restriction (SP entity ID matches), NotBefore and NotOnOrAfter conditions, and NameID presence
**And** on successful validation, creates or updates the user's session
**And** redirects the user to the original RelayState destination (or app home if no RelayState)

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Both Redirect and POST Bindings Are Supported
**Given** an org's SAML configuration specifies either redirect or POST binding for the AuthnRequest
**When** the SP-initiated flow is triggered
**Then** the AuthnRequest is sent using the configured binding type
**And** the SAMLResponse at the ACS endpoint is accepted via HTTP POST (standard for ACS)

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Invalid SAMLResponse Signature Returns User-Friendly Error
**Given** the IdP sends a SAMLResponse with an invalid or missing signature
**When** the system validates the response
**Then** the session is not created
**And** the user is shown: "Authentication failed. Your organization's SSO configuration may be incorrect. Contact your administrator."
**And** the raw XML or cryptographic error details are NOT exposed to the user
**And** the failure is logged server-side with the full technical detail

**Category:** error-handling
**Priority:** must-have

---

### AC-5: Expired SAML Assertion Is Rejected
**Given** the IdP sends a SAMLResponse where `NotOnOrAfter` has passed
**When** the system validates the assertion conditions
**Then** the session is not created
**And** the user is shown: "Authentication failed. The SSO response has expired. Please try again."

**Category:** error-handling
**Priority:** must-have

---

### AC-6: Successful SSO Assertion Is Written to Audit Log
**Given** a user successfully authenticates via SAML 2.0 SSO
**When** their session is created
**Then** an audit log entry is written with: event type `sso_login_success`, user ID, organization ID, IdP entity ID, NameID, timestamp, IP address, user agent

**Category:** happy-path
**Priority:** must-have

---

### AC-7: Failed SSO Assertion Is Written to Audit Log
**Given** a SAML assertion fails validation (signature, expiry, audience, etc.)
**When** the failure is detected
**Then** an audit log entry is written with: event type `sso_login_failed`, organization ID, failure reason (not the raw assertion), timestamp, IP address, user agent

**Category:** error-handling
**Priority:** must-have

---

### AC-8: User from Org Without SSO Config Cannot Use SSO Login Path
**Given** a user's organization has no SSO configuration
**When** they attempt to initiate an SSO login (e.g., by directly calling the SP-initiated endpoint)
**Then** the system returns an error: "SSO is not configured for your organization."
**And** no AuthnRequest is generated

**Category:** boundary
**Priority:** must-have

---

### AC-9: Flow Tested Against Real Okta Tenant
**Given** the SAML 2.0 implementation is deployed to a staging environment
**When** a test login is performed using a real Okta tenant configured as the IdP
**Then** the SP-initiated flow completes successfully and a valid user session is created
**And** the test result is documented as part of the acceptance sign-off

**Category:** happy-path
**Priority:** must-have

---

### AC-10: Flow Tested Against Real Azure AD Tenant
**Given** the SAML 2.0 implementation is deployed to a staging environment
**When** a test login is performed using a real Azure AD tenant configured as the IdP
**Then** the SP-initiated flow completes successfully and a valid user session is created
**And** the test result is documented as part of the acceptance sign-off

**Category:** happy-path
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to any authenticated-only resource after the SAML flow (i.e., before session establishment)
**Then** the system returns `401 Unauthorized` and redirects to login

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** a user authenticates via SAML but their account has been deactivated or lacks the required role to access a specific resource
**When** they attempt to access that resource post-login
**Then** the system returns `403 Forbidden` with a message identifying the missing permission

**Category:** security
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| IdP is unreachable (user never redirected back) | After 5 minutes, the RelayState becomes invalid; user must initiate login again; show "Login session expired. Please try again." | must-have |
| SAMLResponse replay attack (same assertion used twice) | Reject with `sso_login_failed` log entry; show generic "Authentication failed" error | must-have |
| NameID format not recognized | Log format; attempt to extract user identity from email attribute claim as fallback; if no email claim, reject with clear error | should-have |

### Performance
- **Response time:** ACS endpoint processes SAMLResponse and creates session within 300ms at p95
- **Scale:** Must handle concurrent SSO logins for up to 500 users/minute during peak (e.g., 9am login wave)

### Security
- **Input validation:** SAMLResponse XML is parsed in a hardened context; XML external entity (XXE) injection must be disabled in the parser configuration
- **Authorization:** ACS endpoint validates `organization_id` from the SP configuration — not from the SAMLResponse itself — to prevent cross-org assertion injection
- **Replay protection:** SAMLResponse assertion ID tracked in a short-lived cache (per SAML spec) to prevent replay attacks
- **TOTP clock skew equivalent:** `NotBefore`/`NotOnOrAfter` validation allows a tolerance of ±2 minutes for clock skew between SP and IdP

## Open Questions
- Does a successful SAML login for a user who doesn't yet exist in the platform trigger just-in-time (JIT) user provisioning, or must the user exist first? This affects AC-2 and has significant data model implications.

---

# Acceptance Criteria: SSO-03 — OIDC Login Flow

## Refined Story Statement
As an end user whose organization uses an OIDC-compatible IdP, I want to log in via the OpenID Connect Authorization Code Flow with PKCE, so that my organization's OIDC IdP handles my authentication.

## Assumptions
- The OIDC flow uses Authorization Code Flow with PKCE — **Confirmed** (stated in scope)
- `openid-client` is the selected library — **Confirmed** (stated in scope)
- Similar to SSO-02, just-in-time user provisioning may be required for users not yet in the platform — **Unconfirmed**
- The OIDC configuration (client ID, client secret, issuer URL, scopes) is stored as part of the org's SSO configuration from SSO-01 — **Unconfirmed** (SSO-01 scope describes SAML metadata; OIDC-specific fields need confirmation)
- The system validates the ID token's `iss`, `aud`, and `exp` claims as a minimum — **Confirmed** (stated in scope)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Admin role scoping | Out of Scope | N/A |
| G-2: SSO enforcement exemptions | Out of Scope — SSO-04 | N/A |
| G-3: SMS provider | Out of Scope | N/A |
| G-4: Recovery codes | Out of Scope | N/A |
| G-5: TOTP clock skew | Addressed — ID token `exp` validation with ±2 min tolerance for clock skew | AC-4 |
| G-6: Audit log access surface | Addressed — SSO assertion events written to audit log | AC-5 |
| G-7: Session invalidation on policy change | Out of Scope — SSO-04 | N/A |
| G-8: Okta/Azure AD specificity | Addressed — generic OIDC implementation satisfies requirement per assumption | AC-1 |
| G-9: Rate limiting thresholds | Out of Scope — RATE-01 dependency | N/A |
| G-10: MFA enforcement rollout | Out of Scope | N/A |
| G-11: JWT/refresh token strategy | Out of Scope — SESSION-01 | N/A |
| G-12: SSO IdP metadata UX | Out of Scope — SSO-01 | N/A |

## Acceptance Criteria

### AC-1: User Is Redirected to OIDC IdP via Authorization Code Flow with PKCE
**Given** a user enters their email and their org has an OIDC SSO configuration
**When** they initiate SSO login
**Then** the system generates a PKCE code verifier and code challenge
**And** redirects the user to the IdP's authorization endpoint with: `response_type=code`, `client_id`, `redirect_uri`, `scope` (at minimum `openid email`), `state`, and `code_challenge`

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Authorization Code Is Exchanged for Tokens
**Given** the IdP redirects the user back to the callback URI with an authorization code
**When** the system receives the callback
**Then** it validates the `state` parameter matches the original value (CSRF protection)
**And** exchanges the code for tokens using the `code_verifier`
**And** receives an ID token and access token from the IdP

**Category:** happy-path
**Priority:** must-have

---

### AC-3: ID Token Is Validated and User Session Created
**Given** the system has received an ID token from the token endpoint
**When** it validates the token
**Then** it verifies: signature (against IdP's JWKS), `iss` matches configured issuer, `aud` matches configured client ID, `exp` has not passed (with ±2 minute clock skew tolerance)
**And** extracts user identity from claims (at minimum: `sub`, `email`)
**And** creates or updates the user's session
**And** redirects the user to the app

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Expired ID Token Is Rejected
**Given** the IdP returns an ID token with an `exp` value in the past (beyond the ±2 minute tolerance)
**When** the system validates the token
**Then** the session is not created
**And** the user is shown: "Authentication failed. The SSO response has expired. Please try again."

**Category:** error-handling
**Priority:** must-have

---

### AC-5: Successful OIDC Login Is Written to Audit Log
**Given** a user successfully authenticates via OIDC
**When** their session is created
**Then** an audit log entry is written with: event type `sso_login_success`, user ID, organization ID, OIDC issuer, `sub` claim value, timestamp, IP address, user agent

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Failed OIDC Token Validation Is Written to Audit Log
**Given** the ID token fails validation (signature, issuer, audience, or expiry)
**When** the failure is detected
**Then** an audit log entry is written with: event type `sso_login_failed`, organization ID, failure reason (not the raw token), timestamp, IP address, user agent

**Category:** error-handling
**Priority:** must-have

---

### AC-7: Invalid State Parameter Is Rejected (CSRF Protection)
**Given** the callback arrives with a `state` parameter that doesn't match the original authorization request
**When** the system checks the state
**Then** the token exchange is aborted
**And** the user is shown: "Authentication failed. Please try again."
**And** the failure is logged

**Category:** security
**Priority:** must-have

---

### AC-8: User from Org Without OIDC Config Cannot Use OIDC Login Path
**Given** a user's organization has no OIDC SSO configuration
**When** they attempt to initiate an OIDC login
**Then** the system returns: "SSO is not configured for your organization."
**And** no authorization request is generated

**Category:** boundary
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to any protected resource before the OIDC flow completes
**Then** the system returns `401 Unauthorized` and redirects to login

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** a user authenticates via OIDC but lacks the required role for a specific resource
**When** they attempt to access that resource
**Then** the system returns `403 Forbidden` with a message identifying the missing permission

**Category:** security
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Token endpoint returns an error response | Log the OAuth error code; show user "Authentication failed. Contact your administrator if this persists." | must-have |
| IdP JWKS endpoint is unreachable during signature verification | Reject the login; display "Authentication failed." Log the JWKS fetch failure for ops investigation | must-have |

### Performance
- **Response time:** Token exchange and session creation must complete within 500ms at p95 (excluding IdP network latency)
- **Scale:** JWKS keys must be cached locally (with TTL aligned to IdP cache-control headers) to avoid a JWKS fetch on every login

### Security
- **Input validation:** `state` and `code` parameters from the callback URL are validated before use; reject oversized values
- **Authorization:** `redirect_uri` is pre-registered and validated server-side — not derived from request parameters (open redirect prevention)
- **Client secret:** Stored encrypted at rest; never exposed in client-side code or logs

## Open Questions
- Does a successful OIDC login for a user not yet in the platform trigger JIT user provisioning? Same question as SSO-02.
- Are OIDC-specific configuration fields (client ID, client secret, issuer URL, scopes) captured in the SSO-01 configuration UI, or does SSO-01 need to be extended for OIDC?

---

# Acceptance Criteria: SSO-04 — Forced SSO Enforcement with Immediate Session Invalidation

## Refined Story Statement
As an Org Admin, I want to require all users in my organization to authenticate exclusively via SSO once it is enabled, with immediate invalidation of all active sessions and a clear error for password-based login attempts, so that credentials cannot be used as a fallback once my IdP is the authoritative source.

## Assumptions
- The confirmation dialog is a modal shown before the save is committed — **Confirmed** (stated in scope)
- Session invalidation is immediate on confirmation — all active tokens are rejected on the next request — **Confirmed** (stated in scope)
- Break-glass accounts (SSO-05) are exempt from this enforcement — **Confirmed** (stated in scope)
- "All active sessions" means all sessions with `organization_id` matching the affected org — **Confirmed** (derived)
- Password-based login attempts for SSO-enforced org users are rejected at the login step, not after credential verification — **Unconfirmed** (should not verify password before rejecting — prevents timing oracle)
- Disabling SSO enforcement also writes to audit log and sends POLICY-04 notification — **Confirmed** (consistent with other policy changes in this scope)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Admin role scoping | Out of Scope | N/A |
| G-2: SSO enforcement exemptions | Addressed — no exemptions except break-glass accounts (SSO-05); all other org members must use SSO | AC-1, AC-4 |
| G-3: SMS provider | Out of Scope | N/A |
| G-4: Recovery codes | Out of Scope | N/A |
| G-5: TOTP clock skew | Out of Scope | N/A |
| G-6: Audit log access surface | Addressed — enforcement events written to audit log | AC-5 |
| G-7: Session invalidation on policy change | Addressed — immediate session invalidation on SSO enforcement enable; this is the definitive resolution | AC-2 |
| G-8: Okta/Azure AD specificity | Out of Scope | N/A |
| G-9: Rate limiting thresholds | Out of Scope | N/A |
| G-10: MFA enforcement rollout | Out of Scope | N/A |
| G-11: JWT/refresh token strategy | Addressed — SESSION-01 must provide the token revocation mechanism; this story depends on it | Open Questions |
| G-12: SSO IdP metadata UX | Out of Scope | N/A |

## Acceptance Criteria

### AC-1: Org Admin Is Shown Confirmation Dialog Before Enabling SSO Enforcement
**Given** an authenticated Org Admin in the policy settings UI
**When** they toggle "Require SSO for all users" and click save
**Then** a confirmation dialog appears with: "This will immediately log out all active users in your organization. Proceed? [Cancel] [Confirm]"
**And** the setting is NOT saved until the admin clicks "Confirm"

**Category:** happy-path
**Priority:** must-have

---

### AC-2: All Active Org Sessions Are Immediately Invalidated on Confirmation
**Given** the Org Admin clicks "Confirm" on the SSO enforcement dialog
**When** `sso_enforced = true` is saved for the organization
**Then** all active session tokens (access tokens and refresh tokens) for users in that organization are immediately invalidated
**And** on the next request by any previously active user, their token is rejected regardless of its original expiry
**And** break-glass account sessions (per SSO-05) are not invalidated

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Invalidated Users See SSO Redirect Message
**Given** a user had an active session that was invalidated by SSO enforcement
**When** they make their next request or page load
**Then** they are redirected to the login page and shown: "Your organization now requires SSO login."
**And** a "Sign in with SSO" button or flow is displayed

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Password-Based Login Is Rejected for SSO-Enforced Org Users
**Given** a user's organization has `sso_enforced = true`
**When** they attempt to log in via email/password (without going through SSO)
**Then** the system rejects the attempt without verifying the password
**And** displays: "Your organization requires SSO login. Use the SSO option to sign in."
**And** a link or button to the SSO login path is shown
**And** the rejection is logged as a `login_failed` event in the audit log with `reason: sso_enforced`

**Category:** error-handling
**Priority:** must-have

---

### AC-5: SSO Enforcement Events Written to Audit Log
**Given** an Org Admin enables or disables SSO enforcement
**When** the change is saved
**Then** an audit log entry is written: event type `sso_enforcement_enabled` or `sso_enforcement_disabled`, actor, organization ID, timestamp
**And** a POLICY-04 notification is sent to all Org Admins

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Org Admin Can Disable SSO Enforcement
**Given** `sso_enforced = true` for an organization
**When** an Org Admin disables SSO enforcement and saves
**Then** `sso_enforced = false` is set
**And** users can log in via email/password again
**And** no existing sessions are affected (no sessions to invalidate — users were already logged out)
**And** audit log records `sso_enforcement_disabled`

**Category:** happy-path
**Priority:** must-have

---

### AC-7: SSO Enforcement Cannot Be Enabled Without an Active SSO Configuration
**Given** an org has no SSO configuration (SSO-01)
**When** an Org Admin attempts to enable SSO enforcement
**Then** the system blocks the action with: "You must configure an SSO provider before enabling SSO enforcement. [Set up SSO]"

**Category:** boundary
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the SSO enforcement configuration endpoint
**Then** the system returns `401 Unauthorized`

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without `org_admin` or `platform_super_admin` role
**When** a request is made to enable or disable SSO enforcement
**Then** the system returns `403 Forbidden` with a message identifying the required permission

**Category:** security
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Session invalidation partially fails (some tokens not revoked) | Log affected tokens; treat as a security incident; alert on-call; do not report success to the admin until invalidation is confirmed complete | must-have |
| Database update for `sso_enforced` fails mid-operation | Roll back; do not leave org in a partial enforcement state; show admin "Failed to enable SSO enforcement. Try again." | must-have |

### Performance
- **Response time:** Session invalidation for all org users must complete within 5 seconds for orgs with up to 10,000 active sessions at p95
- **Scale:** Token revocation must be handled as a batch operation; do not revoke tokens one-by-one in a synchronous request

### Security
- **Input validation:** `organization_id` for enforcement scope derived from admin's JWT, not from request body
- **Authorization:** Org Admins can only enable/disable enforcement for their own org; Platform Super Admins can act on any org
- **Timing:** Password-based login for SSO-enforced orgs must not verify the password before rejecting (prevents username enumeration via timing)

## Open Questions
- SESSION-01 (and SPIKE-AUTH-01) must provide the token revocation mechanism before this story is fully implementation-ready. If refresh tokens are httpOnly cookies, what is the revocation strategy — database blocklist or short-lived tokens only?

---

# Acceptance Criteria: SSO-05 — Break-Glass Account Management

## Refined Story Statement
As a Platform Super Admin, I want to designate exactly one break-glass account per SSO-enforced organization that retains email/password access, so that customer organizations are not completely locked out if their IdP becomes unavailable.

## Assumptions
- Exactly one break-glass account per org — designating a new one replaces the existing one — **Confirmed** (stated in scope)
- Org Admins can see (read-only) that a break-glass account exists and who it is, but cannot change the designation — **Confirmed** (stated in scope)
- The break-glass account is exempt from SSO enforcement (can log in via email/password even when `sso_enforced = true`) — **Confirmed**
- The break-glass account is NOT exempt from MFA enforcement (POLICY-01) — **Unconfirmed** (this is a significant security question — if MFA is required for `org_admin` roles and the break-glass account is an `org_admin`, does MFA still apply?)
- Break-glass accounts are only meaningful for SSO-enforced orgs; the designation can exist for non-enforced orgs but has no functional effect — **Unconfirmed**
- A Platform Super Admin can designate themselves as a break-glass account — **Unconfirmed** (probably should be prevented)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Admin role scoping | Out of Scope | N/A |
| G-2: SSO enforcement exemptions | Addressed — break-glass is the explicitly designed exemption mechanism; no other exemptions exist | AC-1, AC-3 |
| G-3: SMS provider | Out of Scope | N/A |
| G-4: Recovery codes | Out of Scope | N/A |
| G-5: TOTP clock skew | Out of Scope | N/A |
| G-6: Audit log access surface | Addressed — designation and revocation events written to audit log | AC-5 |
| G-7: Session invalidation on policy change | Out of Scope for this story — SSO-04 handles that | N/A |
| G-8: Okta/Azure AD specificity | Out of Scope | N/A |
| G-9: Rate limiting thresholds | Out of Scope | N/A |
| G-10: MFA enforcement rollout | Open Question — does the break-glass account bypass MFA enforcement? | Open Questions |
| G-11: JWT/refresh token strategy | Out of Scope | N/A |
| G-12: SSO IdP metadata UX | Out of Scope | N/A |

## Acceptance Criteria

### AC-1: Platform Super Admin Can Designate a Break-Glass Account for an Org
**Given** an authenticated Platform Super Admin in the organization management UI
**When** they search for an organization, select a user, and designate them as the break-glass account
**Then** the designation is stored in the `break_glass_accounts` table with: `organization_id`, `user_id`, designated by (Platform Super Admin ID), designated at (timestamp)
**And** the designation event is written to the audit log
**And** the break-glass user can now log in via email/password even when `sso_enforced = true` for that org

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Designating a New Break-Glass Account Replaces the Existing One
**Given** an org already has a designated break-glass account (User A)
**When** a Platform Super Admin designates a different user (User B) as break-glass for the same org
**Then** User A's break-glass designation is revoked
**And** User B is now the designated break-glass account
**And** both the revocation of User A and designation of User B are written to the audit log as separate entries

**Category:** edge-case
**Priority:** must-have

---

### AC-3: Break-Glass Account Can Log In via Password in SSO-Enforced Org
**Given** an org has `sso_enforced = true`
**And** User A is the designated break-glass account for that org
**When** User A attempts to log in via email/password
**Then** the system allows the password-based authentication to proceed
**And** the normal SSO redirect/block does not apply to User A

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Non-Break-Glass Users Are Still Blocked by SSO Enforcement
**Given** an org has `sso_enforced = true` and a designated break-glass account
**When** any other user in the org attempts to log in via email/password
**Then** they are blocked and shown the SSO login message (per SSO-04 AC-4)
**And** the break-glass exemption does not bleed over to other users

**Category:** boundary
**Priority:** must-have

---

### AC-5: Designation and Revocation Events Written to Audit Log
**Given** a Platform Super Admin designates or revokes a break-glass account
**When** the action is saved
**Then** an audit log entry is written with: event type (`break_glass_designated` or `break_glass_revoked`), actor (Platform Super Admin ID), user affected, organization ID, timestamp

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Org Admin Can See (Read-Only) Who the Break-Glass Account Is
**Given** an Org Admin is viewing their organization's settings
**When** a break-glass account is designated for their org
**Then** a read-only section displays: the break-glass user's display name and email
**And** a label or note: "Managed by Platform Administrators"
**And** no create, change, or revoke controls are shown to the Org Admin

**Category:** happy-path
**Priority:** must-have

---

### AC-7: Org Admin Cannot Designate or Revoke Break-Glass Accounts
**Given** an authenticated Org Admin
**When** they attempt to call the break-glass designation or revocation API endpoint
**Then** the system returns `403 Forbidden`

**Category:** security
**Priority:** must-have

---

### AC-8: Platform Super Admin Can Revoke a Break-Glass Designation
**Given** an org has a designated break-glass account
**When** a Platform Super Admin revokes the designation
**Then** the `break_glass_accounts` record is marked inactive (or deleted)
**And** the previously designated user is now subject to SSO enforcement like all other org members
**And** the revocation is written to the audit log

**Category:** happy-path
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the break-glass designation endpoints (GET, POST, DELETE)
**Then** the system returns `401 Unauthorized`

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without `platform_super_admin` role
**When** a request is made to designate or revoke a break-glass account
**Then** the system returns `403 Forbidden` with a message identifying the required permission

**Category:** security
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Designated user does not belong to the org | Reject with: "The selected user is not a member of this organization." | must-have |
| Designated user's account is deactivated | Reject with: "Cannot designate a deactivated account as a break-glass account." | must-have |

### Performance
- **Response time:** Break-glass designation lookup during login must add no more than 10ms to the login flow (indexed query on `organization_id`)

### Security
- **Input validation:** `user_id` and `organization_id` validated against the platform's user and org tables; break-glass designation cannot be self-assigned by the requesting Platform Super Admin (prevent privilege escalation path)
- **Authorization:** Read-only access for Org Admins is strictly enforced at API level; the `GET` endpoint returns only the designated user's display name and email — not their credentials or internal ID

## Open Questions
- Does the break-glass account bypass MFA enforcement (POLICY-01)? If the break-glass user has `org_admin` role, POLICY-01 requires MFA. If their IdP is down, they may not be able to complete TOTP either. Clarify: is break-glass exempt from MFA, or should they use backup recovery codes as the break-glass path?

---

# Acceptance Criteria: SESSION-01 — Configurable Session Timeout Implementation

## Refined Story Statement
As a backend engineer, I want the session token lifecycle to honor the per-organization timeout configuration (1 hour to 30 days), using a refresh token rotation strategy defined in SPIKE-AUTH-01, so that session duration reflects each organization's security policy rather than a hardcoded default.

## Assumptions
- SPIKE-AUTH-01 confirms the architecture before this story is implemented — this AC is written assuming a sliding-window refresh token rotation strategy with httpOnly cookie; if the spike produces a different architecture, these AC must be revisited — **Unconfirmed** (pending spike)
- On logout, both the access token and refresh token are invalidated server-side — **Confirmed** (stated in scope)
- Existing sessions at the time of a timeout config change are not affected — they expire at their original timeout — **Confirmed** (stated in scope)
- Silent refresh happens client-side before access token expiry using the httpOnly refresh token — **Assumed** (pending spike)
- Token storage is httpOnly cookies (for XSS resistance) — **Assumed** (consistent with existing architecture description)

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Admin role scoping | Out of Scope | N/A |
| G-2: SSO enforcement exemptions | Out of Scope | N/A |
| G-3: SMS provider | Out of Scope | N/A |
| G-4: Recovery codes | Out of Scope | N/A |
| G-5: TOTP clock skew | Out of Scope | N/A |
| G-6: Audit log access surface | Out of Scope | N/A |
| G-7: Session invalidation on policy change | Addressed — existing sessions not invalidated on timeout change; SSO-04 handles invalidation on SSO enforcement change | AC-4 |
| G-8: Okta/Azure AD specificity | Out of Scope | N/A |
| G-9: Rate limiting thresholds | Out of Scope | N/A |
| G-10: MFA enforcement rollout | Out of Scope | N/A |
| G-11: JWT/refresh token strategy | Addressed — this story implements the strategy decided in SPIKE-AUTH-01; without the spike result, this AC has a conditional dependency | Open Questions |
| G-12: SSO IdP metadata UX | Out of Scope | N/A |

## Acceptance Criteria

### AC-1: Session Expiry Matches Org-Configured Timeout
**Given** an organization has a configured session timeout of T (where 1 hour ≤ T ≤ 30 days)
**When** a user in that org logs in successfully
**Then** their session (as represented by the access token + refresh token pair) expires at `login_time + T` if no activity occurs (absolute expiry for the refresh token)

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Access Token Is Short-Lived; Silent Refresh Extends Session
**Given** a user has an active session
**When** the access token is within [refresh threshold] of expiry and the user is active
**Then** the client silently requests a new access token using the httpOnly refresh token cookie
**And** a new access token is issued with a new short expiry
**And** the refresh token is rotated (new value issued, old value invalidated)
**And** the session's absolute expiry is not extended beyond `login_time + T`

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Expired Session Requires Re-Authentication
**Given** a user's session has expired (absolute expiry reached, `now() > login_time + T`)
**When** they make any request requiring authentication
**Then** the system rejects the request with `401 Unauthorized`
**And** the client redirects them to the login page

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Existing Sessions Use Their Original Timeout When Config Changes
**Given** User A has an active session created under a 24-hour timeout policy
**When** an Org Admin changes the session timeout to 1 hour
**Then** User A's existing session continues to expire at `session_created_at + 24 hours`
**And** User A is not logged out by the config change

**Category:** edge-case
**Priority:** must-have

---

### AC-5: New Sessions After Config Change Use New Timeout
**Given** an Org Admin has saved a new session timeout of X hours
**When** any user in the org logs in after the save
**Then** their new session expires at `login_time + X hours`

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Logout Invalidates Both Access Token and Refresh Token
**Given** a user has an active session
**When** they log out
**Then** both the access token and refresh token are invalidated server-side (added to revocation list or deleted from database)
**And** subsequent requests using the invalidated tokens are rejected with `401 Unauthorized`
**And** the tokens cannot be used to obtain new tokens

**Category:** happy-path
**Priority:** must-have

---

### AC-7: Default Session Timeout Is 24 Hours for Orgs Without Custom Configuration
**Given** an organization has no custom session timeout configured
**When** a user in that org logs in
**Then** their session expires after 24 hours

**Category:** boundary
**Priority:** must-have

---

### AC-8: Refresh Token Rotation Invalidates the Previous Token
**Given** a user's client silently refreshes the access token
**When** the new access + refresh token pair is issued
**Then** the previous refresh token value is immediately invalidated
**And** if the previous refresh token is used after rotation, it is rejected with `401 Unauthorized` (detects token theft)

**Category:** security
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid access token is present
**When** a request is made to any protected endpoint
**Then** the system returns `401 Unauthorized`

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user with a valid session but without the required role for a specific resource
**When** they request that resource
**Then** the system returns `403 Forbidden` with a message identifying the missing permission

**Category:** security
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Silent refresh fails (refresh token expired or network error) | Client catches the 401; user is redirected to login with message "Your session has expired. Please sign in again." | must-have |
| Refresh token theft detected (old rotated token presented) | Invalidate the entire session (all tokens for that session); log `session_compromise_detected` event to audit log; force re-authentication | must-have |

### Performance
- **Response time:** Token validation on every request must add no more than 5ms overhead at p95 (cache-backed revocation check)
- **Scale:** Refresh token rotation must handle 1,000 concurrent silent refresh requests without database bottleneck (consider read replica for validation, write primary for rotation)

### Security
- **Token storage:** Both access token and refresh token stored in httpOnly, Secure, SameSite=Strict cookies to prevent XSS and CSRF
- **Revocation:** Refresh token revocation backed by a fast-lookup store (Redis or database index) — must survive server restart
- **Entropy:** Refresh token values must be cryptographically random with at least 256 bits of entropy

## Open Questions
- SPIKE-AUTH-01 must resolve the refresh token rotation strategy (sliding window vs. absolute expiry + silent refresh) before this story can be implemented. The specific AC values (e.g., access token TTL, refresh threshold) depend on the spike outcome.

---

# Acceptance Criteria: AUDIT-01 — Authentication Event Capture

## Refined Story Statement
As a security team member, I want every significant authentication event written to a structured, immutable audit log, so that we have a reliable record for SOC 2 Type II compliance, incident investigation, and forensic review.

## Assumptions
- "Append-only" means no `UPDATE` or `DELETE` SQL path exists in application code for audit log rows — **Confirmed** (stated in scope)
- The table is partitioned by `organization_id` and month — **Confirmed** (stated in scope)
- "Relevant metadata" fields (e.g., IdP entity ID) are stored as a structured JSON column — **Confirmed** (stated in scope: "structured metadata JSON")
- The audit log write is synchronous (not async/fire-and-forget) — **Unconfirmed** — if async, a failure could silently drop audit events; must be confirmed with security team
- Retention period is 1 year — **Confirmed** (AUDIT-02 scope specifies 1-year retention with a scheduled deletion job)
- The audit log is not exposed directly to end users or Org Admins in this story — exposure is AUDIT-02 — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Admin role scoping | Out of Scope | N/A |
| G-2: SSO enforcement exemptions | Out of Scope | N/A |
| G-3: SMS provider | Out of Scope | N/A |
| G-4: Recovery codes | Out of Scope | N/A |
| G-5: TOTP clock skew | Out of Scope | N/A |
| G-6: Audit log access surface | Addressed — this story implements event capture only; UI/API access is AUDIT-02; retention is implemented in AUDIT-02's scheduled deletion job | AC-1, AC-2, Open Questions |
| G-7: Session invalidation on policy change | Out of Scope | N/A |
| G-8: Okta/Azure AD specificity | Out of Scope | N/A |
| G-9: Rate limiting thresholds | Out of Scope | N/A |
| G-10: MFA enforcement rollout | Out of Scope | N/A |
| G-11: JWT/refresh token strategy | Out of Scope | N/A |
| G-12: SSO IdP metadata UX | Out of Scope | N/A |

## Acceptance Criteria

### AC-1: Authentication Events Are Written to Audit Log with Required Fields
**Given** any of the following events occurs: successful login (password, SAML, OIDC), failed login attempt, logout, MFA challenge initiated, MFA challenge succeeded, MFA challenge failed, MFA enrolled (any method type), MFA unenrolled, recovery code used, recovery code exhausted, SSO configuration created/updated/deleted, SSO enforcement enabled/disabled, MFA policy enabled/disabled, session timeout changed, break-glass designation created/revoked
**When** the event is processed
**Then** an entry is written to `auth_audit_log` containing: `event_id` (UUID), `event_type` (enum), `timestamp` (UTC, microsecond precision), `user_id` (nullable for pre-auth failures), `organization_id`, `ip_address`, `user_agent`, `outcome` (`success` or `failure`), `metadata` (JSON with event-specific fields per AC-2)

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Event-Specific Metadata Is Captured
**Given** each event type has specific context
**When** the event is written
**Then** the `metadata` JSON column includes the event-specific fields as defined:
- Login/logout: `method` (password/saml/oidc)
- SAML events: `idp_entity_id`, `name_id`
- OIDC events: `oidc_issuer`, `sub`
- MFA events: `mfa_method` (totp/sms/recovery_code)
- Policy change events: `policy_field`, `previous_value`, `new_value`
- Break-glass events: `target_user_id`, `actor_type`

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Audit Log Entries Are Append-Only
**Given** an audit log entry has been written
**When** any application code attempts to update or delete that row
**Then** the operation is rejected — no `UPDATE` or `DELETE` code path exists in the application layer for `auth_audit_log`
**And** a database-level constraint or permission prevents modifications even from a database superuser path in the application

**Category:** security
**Priority:** must-have

---

### AC-4: Failed Login Attempts Are Captured With Appropriate Metadata
**Given** a user attempts to log in with invalid credentials
**When** the login fails
**Then** an audit log entry is written with: `event_type: login_failed`, `outcome: failure`, `user_id` (if email resolves to a known user — otherwise null), `organization_id` (if derivable from email), `ip_address`, `user_agent`, `metadata.failure_reason` (e.g., `invalid_password`, `sso_enforced`, `account_locked`)
**And** the stored `failure_reason` does not expose whether the email address exists (to prevent enumeration)

**Category:** security
**Priority:** must-have

---

### AC-5: Multi-Tenancy Isolation — Organization ID Always Set
**Given** any audit event is triggered
**When** the event is written
**Then** the `organization_id` field is always populated (never null) for events associated with an org
**And** queries can never return rows for a different org than the querying party is authorized to see

**Category:** security
**Priority:** must-have

---

### AC-6: Audit Log Write Does Not Block Request Completion on Failure
**Given** the audit log write fails (e.g., database error)
**When** the underlying authentication action has already succeeded
**Then** the authentication action is not reversed
**And** the write failure is logged to the system error log with the event details
**And** an alert is raised to on-call (audit write failures are high-priority — SOC 2 risk)

**Category:** error-handling
**Priority:** must-have

---

### AC-7: Table Is Partitioned by Organization and Month
**Given** the `auth_audit_log` table is created
**When** data is inserted
**Then** partitioning by `organization_id` and event month (`timestamp` truncated to month) is in effect
**And** partition pruning enables queries scoped to a single org and date range to scan only relevant partitions

**Category:** boundary
**Priority:** must-have

---

### AC-8: Schema Includes SIEM-Friendly Columns
**Given** the table is created per AC-7
**When** the schema is reviewed
**Then** the following columns exist and are populated: `event_id` (UUID, indexed), `metadata` (structured JSON, queryable), `organization_id` (indexed), `timestamp` (indexed)
**And** these columns are designed to support future SIEM export without schema migration (no UI-only shortcut columns)

**Category:** boundary
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to any audit log read endpoint (once AUDIT-02 is built)
**Then** the system returns `401 Unauthorized`

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without `org_admin` or `platform_super_admin` role
**When** a request is made to read audit log entries
**Then** the system returns `403 Forbidden` with a message identifying the required permission

**Category:** security
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Database partition unavailable for a specific month/org | Log error; alert on-call; authentication action proceeds; do not silently succeed audit write | must-have |
| Audit event with unknown `event_type` | Reject at write time with a schema validation error; do not write partial entries | must-have |

### Performance
- **Response time:** Audit log write must complete within 50ms at p95 to minimize impact on authentication latency
- **Scale:** Must sustain at least 1,000 audit log writes/second during peak load (e.g., mass login event for 50k users)
- **Storage:** Partitioning strategy must support 1-year retention across ~200 orgs without unbounded table growth

### Security
- **Immutability:** Application database role for `auth_audit_log` should have INSERT-only permissions (no UPDATE, DELETE, TRUNCATE)
- **Sensitive data:** Do not log passwords, TOTP codes, or recovery code values; log only outcomes and IDs
- **PII:** `ip_address` and `user_agent` are PII — ensure data retention policy (1 year per AUDIT-02) applies and is documented for privacy compliance

### Accessibility
- N/A — no UI in this story

## Open Questions
- Should audit log writes be synchronous (inline with the authentication operation) or asynchronous (via a queue)? Synchronous guarantees completeness but adds latency; async is faster but risks silent drops. Security team must decide — this choice affects AC-6 behavior significantly.

---

# Acceptance Criteria: AUDIT-02 — Org Admin Audit Log UI with CSV Export

## Refined Story Statement
As an Org Admin, I want to view and export the authentication audit log for my organization with filtering by event type, user, and date range, so that I can investigate suspicious activity and provide evidence for our SOC 2 audit.

## Assumptions
- "Scoped strictly to the admin's own organization" is enforced at the API level — not just in the UI — **Confirmed** (derived from security context)
- CSV export includes all fields for the filtered result set — **Confirmed** (stated in scope: "CSV export of filtered results with all fields")
- The 1-year retention deletion job runs on a schedule (e.g., nightly) and purges events with `timestamp < now() - 1 year` — **Confirmed** (stated in scope)
- Platform Super Admins see a global view with an org filter — **Confirmed** (stated in scope)
- The underlying query layer supports future API/SIEM access without restructuring — **Confirmed** (stated in scope)
- Export is not rate-limited by default, but this should be confirmed — **Unconfirmed**
- Pagination page size defaults to 50 rows — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-1: Admin role scoping | Out of Scope | N/A |
| G-2: SSO enforcement exemptions | Out of Scope | N/A |
| G-3: SMS provider | Out of Scope | N/A |
| G-4: Recovery codes | Out of Scope | N/A |
| G-5: TOTP clock skew | Out of Scope | N/A |
| G-6: Audit log access surface | Addressed — Org Admin UI view scoped to own org; CSV export; 1-year retention; Platform Super Admin cross-org view; no SIEM API in this phase | AC-1, AC-2, AC-3, AC-7, AC-8 |
| G-7: Session invalidation on policy change | Out of Scope | N/A |
| G-8: Okta/Azure AD specificity | Out of Scope | N/A |
| G-9: Rate limiting thresholds | Out of Scope | N/A |
| G-10: MFA enforcement rollout | Out of Scope | N/A |
| G-11: JWT/refresh token strategy | Out of Scope | N/A |
| G-12: SSO IdP metadata UX | Out of Scope | N/A |

## Acceptance Criteria

### AC-1: Org Admin Can View Audit Log for Their Own Organization
**Given** an authenticated Org Admin
**When** they navigate to the audit log section of the admin dashboard
**Then** they see a paginated table of audit log entries for their organization only
**And** each row displays: timestamp (in admin's local timezone), event type (human-readable label), user (display name or email), outcome (success/failure), IP address
**And** entries are sorted by timestamp descending (most recent first) by default

**Category:** happy-path
**Priority:** must-have

---

### AC-2: Audit Log Can Be Filtered by Event Type
**Given** an Org Admin is viewing the audit log
**When** they select one or more event types from a filter (e.g., "Failed login", "MFA challenge failed", "SSO login")
**Then** the table updates to show only entries matching the selected event types
**And** pagination resets to page 1

**Category:** happy-path
**Priority:** must-have

---

### AC-3: Audit Log Can Be Filtered by User
**Given** an Org Admin is viewing the audit log
**When** they filter by a specific user (by name or email)
**Then** the table updates to show only entries associated with that user
**And** pagination resets to page 1

**Category:** happy-path
**Priority:** must-have

---

### AC-4: Audit Log Can Be Filtered by Date Range
**Given** an Org Admin is viewing the audit log
**When** they set a start date and/or end date
**Then** the table updates to show only entries with timestamps within the specified range
**And** the range is inclusive of the start date (from midnight) and end date (through end of day) in the admin's local timezone

**Category:** happy-path
**Priority:** must-have

---

### AC-5: CSV Export Includes All Fields for Filtered Results
**Given** an Org Admin has applied one or more filters (or no filters for full export)
**When** they click "Export CSV"
**Then** a CSV file is downloaded containing all audit log entries matching the current filter (not just the current page)
**And** the CSV includes all fields: event_id, timestamp (ISO 8601 UTC), event_type, user_id, user_email, organization_id, ip_address, user_agent, outcome, metadata (JSON as a single column)

**Category:** happy-path
**Priority:** must-have

---

### AC-6: Org Admin Cannot See Other Organizations' Audit Logs
**Given** an Org Admin for Organization A
**When** they access the audit log (via UI or direct API call with a manipulated `organization_id`)
**Then** only events with `organization_id = A` are returned
**And** any attempt to access events for other organizations returns `403 Forbidden`

**Category:** security
**Priority:** must-have

---

### AC-7: Platform Super Admin Can View Audit Log Across All Orgs
**Given** an authenticated Platform Super Admin
**When** they navigate to the audit log with an org filter set to a specific organization
**Then** they see the same view as the Org Admin for that org
**When** no org filter is set
**Then** they see events across all organizations with the org name displayed as an additional column

**Category:** happy-path
**Priority:** must-have

---

### AC-8: 1-Year Retention Policy Is Enforced by Scheduled Deletion Job
**Given** a scheduled job runs nightly
**When** the job executes
**Then** all `auth_audit_log` entries with `timestamp < now() - 1 year` are deleted
**And** the job logs the count of deleted rows and completes successfully
**And** a failure in the deletion job alerts on-call but does not disrupt the application

**Category:** happy-path
**Priority:** must-have

---

### AC-9: Large Export Does Not Block the Application
**Given** an Org Admin requests a CSV export that matches a very large number of entries (e.g., 100,000 rows)
**When** they click "Export CSV"
**Then** the export is generated server-side (streamed or chunked) without timing out
**And** the user receives a complete CSV file
**And** the export does not degrade the application's API response times for other users

**Category:** performance
**Priority:** must-have

---

### AC-10: Underlying Query Layer Supports Future SIEM API Without Restructuring
**Given** the audit log UI query layer is implemented
**When** reviewed by a backend engineer
**Then** the query service is abstracted (e.g., a service function or query builder) such that a future REST or webhook-based SIEM integration can reuse it without modifying the underlying query logic
**And** no UI-specific hacks (e.g., hardcoded HTML-rendering logic) are embedded in the data retrieval layer

**Category:** boundary
**Priority:** must-have

---

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to the audit log view or export endpoints
**Then** the system returns `401 Unauthorized`

**Category:** security
**Priority:** must-have

---

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without `org_admin` or `platform_super_admin` role
**When** a request is made to the audit log endpoints
**Then** the system returns `403 Forbidden` with a message identifying the required permission

**Category:** security
**Priority:** must-have

---

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Date range filter with end date before start date | Reject with inline validation: "End date must be after start date." | must-have |
| CSV export fails mid-stream | Inform user: "Export failed. Try again or narrow your date range." Do not deliver a partial CSV. | must-have |
| Scheduled deletion job fails | Alert on-call; log the error; do not retry indefinitely (cap at 3 retries in 24h) | should-have |

### Performance
- **Response time:** Audit log first page load (no filters) must return within 500ms at p95 for orgs with up to 1 million events
- **Export time:** CSV export of up to 100,000 rows must complete within 30 seconds
- **Scale:** Date range and event type filters must use indexed columns; explain-plan must confirm partition pruning is active

### Security
- **Input validation:** Filter inputs (`event_type`, `user_id`, `start_date`, `end_date`) must be validated and parameterized — no raw SQL interpolation
- **Authorization:** `organization_id` for data scoping derived from the authenticated user's JWT — not from query parameters
- **Export sensitivity:** CSV contains PII (IP addresses, user agents, email addresses); the download link, if temporary, must expire within 5 minutes

### Accessibility
- Filter controls, table, and export button must be keyboard navigable (WCAG 2.1 AA)
- Table must have proper column headers (`<th>` elements or ARIA equivalents) for screen readers

## Open Questions
- Should CSV export be rate-limited per org (e.g., 5 exports per hour) to prevent abuse? Define limits before launch.
- What is the pagination page size default? Must be specified for consistent test verification.

---

## Coverage Summary
| # | Story Slug | AC Count | Auth AC | Gap Rows | Status |
|---|-----------|----------|---------|----------|--------|
| 1 | POLICY-01 | 9 (AC-1 to AC-9) | Yes (AC-AUTH-1, AC-AUTH-2) | 12 | Complete |
| 2 | POLICY-02 | 9 (AC-1 to AC-9) | Yes (AC-AUTH-1, AC-AUTH-2) | 12 | Complete |
| 3 | POLICY-03 | 6 (AC-1 to AC-6) | Yes (AC-AUTH-1, AC-AUTH-2) | 12 | Complete |
| 4 | POLICY-04 | 8 (AC-1 to AC-8) | Yes (AC-AUTH-1, AC-AUTH-2) | 12 | Complete |
| 5 | POLICY-05 | 7 (AC-1 to AC-7) | Yes (AC-AUTH-1, AC-AUTH-2) | 12 | Complete |
| 6 | SSO-01 | 10 (AC-1 to AC-10) | Yes (AC-AUTH-1, AC-AUTH-2) | 12 | Complete |
| 7 | SSO-02 | 10 (AC-1 to AC-10) | Yes (AC-AUTH-1, AC-AUTH-2) | 12 | Complete |
| 8 | SSO-03 | 8 (AC-1 to AC-8) | Yes (AC-AUTH-1, AC-AUTH-2) | 12 | Complete |
| 9 | SSO-04 | 7 (AC-1 to AC-7) | Yes (AC-AUTH-1, AC-AUTH-2) | 12 | Complete |
| 10 | SSO-05 | 8 (AC-1 to AC-8) | Yes (AC-AUTH-1, AC-AUTH-2) | 12 | Complete |
| 11 | SESSION-01 | 8 (AC-1 to AC-8) | Yes (AC-AUTH-1, AC-AUTH-2) | 12 | Complete |
| 12 | AUDIT-01 | 8 (AC-1 to AC-8) | Yes (AC-AUTH-1, AC-AUTH-2) | 12 | Complete |
| 13 | AUDIT-02 | 10 (AC-1 to AC-10) | Yes (AC-AUTH-1, AC-AUTH-2) | 12 | Complete |
| **Total** | **13 stories** | **108 functional AC + 26 auth AC = 134 total** | **All 13** | **156 gap rows** | **All complete** |


The input for batch 03 of 3 appears to have a rendering issue — the `## Stories (batch 03 of 3)` section is empty. No story definitions (i.e., `### STORY-ID` blocks) are present, and the task header shows `0\n0 stories` which looks like an unresolved template variable.

The gap analysis, dependency map, and implementation order are all present, but there's no story content to write AC against.

To proceed, please provide the actual story definitions for batch 03. Based on the implementation order in the input, this batch likely covers some subset of:

- `SPIKE-AUTH-01` — JWT architecture spike
- `SESSION-01` — configurable session timeout
- `SSO-04` — forced SSO enforcement
- `SSO-05` — break-glass account
- `POLICY-02` — org-wide MFA enforcement with grace period
- `POLICY-03` — grace period tracking dashboard
- `POLICY-05` — session timeout configuration UI
- `AUDIT-02` — Org Admin audit log UI + CSV export + retention job

If you can share the story definitions (the `### STORY-ID` blocks with their As a... / I want... / So that... statements and any notes), I'll produce the full AC document.


