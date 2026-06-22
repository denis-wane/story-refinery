# Test Specifications: SPIKE-AUTH-01 — JWT / Refresh Token Architecture for 30-Day Sessions

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, boundary |
| AC-2 | T-2.1, T-2.2 | happy-path, edge-case |
| AC-3 | T-3.1, T-3.2 | happy-path, edge-case |
| AC-4 | T-4.1, T-4.2 | happy-path, edge-case |
| AC-5 | T-5.1, T-5.2 | happy-path, error-handling |
| AC-6 | T-6.1, T-6.2 | boundary, error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Options evaluation covers all three required token strategies
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Spike Options Evaluation Completeness

  Scenario: Written analysis covers all three required token strategies
    Given the spike has been assigned to backend engineer "eng-jwt-spike@example.com"
    And the timebox has started on day 1 of 3
    When the engineer submits the written analysis document
    Then the document contains a section titled "Strategy A: Sliding-Window Refresh Token Rotation"
    And the document contains a section titled "Strategy B: Absolute Expiry with Silent Refresh"
    And the document contains a section titled "Strategy C: Short-Lived Access Token + Long-Lived Refresh Token with Rotation"
    And each strategy section contains a "Security Risk Assessment" subsection
    And each strategy section contains an "Implementation Complexity Estimate" subsection
    And each strategy section contains a "Compatibility with httpOnly Cookie Architecture" subsection
```

**Test Data:**
- Engineer: `{ email: "eng-jwt-spike@example.com", role: "backend_engineer", team: "platform" }`
- Timebox start date: T+0 business days
- Expected strategies: `["sliding-window-rotation", "absolute-expiry-silent-refresh", "short-lived-access-long-lived-refresh"]`
- Required subsections per strategy: `["security_risk_assessment", "implementation_complexity", "httponly_cookie_compatibility"]`

**Preconditions:**
- Spike ticket SPIKE-AUTH-01 is in "In Progress" state
- Engineer is assigned to the spike
- `docs/architecture/decisions/` path exists in the repository

---

### T-1.2: Analysis omits one or more required strategies
**Maps to:** AC-1
**Category:** boundary

```gherkin
Feature: Spike Options Evaluation Completeness

  Scenario: Written analysis missing "Absolute Expiry with Silent Refresh" strategy is rejected
    Given the spike has been assigned to backend engineer "eng-jwt-spike@example.com"
    When the engineer submits a written analysis that covers only Strategy A and Strategy C
    And the document does not contain any section for "absolute expiry with silent refresh"
    Then the analysis does not satisfy AC-1
    And the spike must not be accepted until all three strategies are documented
    And the PR reviewer must leave a blocking review comment citing the missing strategy
```

**Test Data:**
- Missing strategy: `"absolute-expiry-silent-refresh"`
- Submitted strategies: `["sliding-window-rotation", "short-lived-access-long-lived-refresh"]`
- Expected review outcome: `"CHANGES_REQUESTED"`

**Preconditions:**
- PR for the ADR has been opened against the main branch
- PR review checklist includes the three required strategies

---

### T-2.1: ADR produced at correct path within timebox
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: ADR Production and Repository Placement

  Scenario: ADR exists at the specified path with all required sections within 3 business days
    Given the options evaluation is complete (AC-1 satisfied)
    And the spike timebox started on business day 1
    When 3 business days have elapsed
    Then a file exists at "docs/architecture/decisions/ADR-NNN-jwt-session-strategy.md" where NNN is a valid sequential ADR number
    And the file contains a "Chosen Strategy" section
    And the file contains a "Rationale" section
    And the file contains a "Rejected Alternatives" section with reasons for each rejected option
    And the file contains a "Security Implications" section
    And the file contains a "Token Revocation Approach" section
    And the ADR status field is set to "Proposed"
    And the ADR was committed before or on business day 3 (verified via git commit timestamp)
```

**Test Data:**
- ADR file path: `docs/architecture/decisions/ADR-NNN-jwt-session-strategy.md`
- ADR status value: `"Proposed"`
- Timebox deadline: T+3 business days from spike start
- Required sections: `["Chosen Strategy", "Rationale", "Rejected Alternatives", "Security Implications", "Token Revocation Approach"]`

**Preconditions:**
- `docs/architecture/decisions/` directory exists in the repository
- Existing ADR sequence number is known so NNN can be assigned correctly
- Spike started on a confirmed business day (no holidays)

---

### T-2.2: Spike exceeds 3-day timebox without a complete ADR
**Maps to:** AC-2
**Category:** edge-case

```gherkin
Feature: ADR Production and Repository Placement

  Scenario: Engineering lead is notified when timebox expires without a complete ADR
    Given the options evaluation began on business day 1
    When business day 4 begins and no ADR has been merged at the required path
    Then engineering lead "lead-platform@example.com" receives a notification via the agreed channel (e.g., Slack #platform-alerts)
    And a partial ADR draft is submitted containing documented blockers
    And SESSION-01 remains in backlog and is not moved to sprint planning
    And the partial ADR status is set to "Draft" not "Proposed"
```

**Test Data:**
- Engineering lead: `{ email: "lead-platform@example.com", notification_channel: "#platform-alerts" }`
- Expected ADR status on partial submission: `"Draft"`
- SESSION-01 state: must remain `"Backlog"` not `"Ready for Sprint"`

**Preconditions:**
- Automated timebox monitoring exists or is simulated
- SESSION-01 ticket status is tracked in the same project management tool

---

### T-3.1: ADR explicitly addresses session duration range 1 hour to 30 days
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: ADR Session Duration Coverage

  Scenario: ADR confirms recommended strategy supports full 1-hour to 30-day session range
    Given the ADR has been drafted with a chosen strategy
    When a reviewer reads the session duration section
    Then the ADR explicitly states that session durations between 1 hour (3600 seconds) and 30 days (2592000 seconds) are supported
    And the same architectural approach applies across the entire range without requiring a different token strategy per duration
    And the duration range statement is present as a named subsection or table in the ADR
```

**Test Data:**
- Minimum session duration: `3600` seconds (1 hour)
- Maximum session duration: `2592000` seconds (30 days)
- Expected statement: explicit support claim covering both bounds

**Preconditions:**
- ADR draft exists at `docs/architecture/decisions/ADR-NNN-jwt-session-strategy.md`
- ADR is in "Proposed" state

---

### T-3.2: ADR specifies minimum/maximum when full range is not supported
**Maps to:** AC-3
**Category:** edge-case

```gherkin
Feature: ADR Session Duration Coverage

  Scenario: ADR proposes constrained duration range when full range is architecturally unsupportable
    Given the ADR has been drafted with a chosen strategy that cannot support the full 1h–30d range
    When a reviewer reads the session duration section
    Then the ADR explicitly states the minimum supported session duration (e.g., 15 minutes)
    And the ADR explicitly states the maximum supported session duration (e.g., 7 days)
    And the ADR provides a technical justification for why durations outside this range are not supported
    And the ADR does not claim to support the full 1h–30d range without qualification
```

**Test Data:**
- Hypothetical constrained minimum: `900` seconds (15 minutes)
- Hypothetical constrained maximum: `604800` seconds (7 days)
- Required content: explicit duration bounds + written justification

**Preconditions:**
- ADR draft exists
- The chosen strategy has a documented architectural constraint on session duration

---

### T-4.1: ADR revocation section covers all three required sub-topics
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: ADR Token Revocation Coverage

  Scenario: ADR includes complete token revocation section addressing all required sub-topics
    Given the ADR has been drafted
    When a reviewer reads the "Token Revocation" section
    Then the section explains how active sessions are invalidated within 60 seconds of a policy change (e.g., SSO enforcement toggled by org admin)
    And the section specifies whether a revocation blocklist or short-lived token rotation achieves sub-60-second invalidation
    And the section documents the storage mechanism for revocation state (e.g., Redis key-value, database table)
    And the section documents performance implications at 50,000 concurrent users including estimated storage size and lookup latency
```

**Test Data:**
- Maximum invalidation latency: `60` seconds
- Scale target: `50000` concurrent users
- Required sub-topics: `["invalidation_within_60s", "blocklist_vs_rotation_decision", "storage_mechanism", "performance_at_50k_users"]`

**Preconditions:**
- ADR draft exists at `docs/architecture/decisions/ADR-NNN-jwt-session-strategy.md`
- G-7 gap is referenced in the ADR's context section

---

### T-4.2: ADR revocation section is missing the 60-second SLA guarantee
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: ADR Token Revocation Coverage

  Scenario: ADR is rejected at review when revocation latency SLA is not addressed
    Given the ADR has been drafted
    And the "Token Revocation" section does not include any statement about invalidation within 60 seconds of a policy change
    When the platform architect reviews the ADR
    Then the reviewer marks the ADR review as "CHANGES_REQUESTED"
    And the review comment explicitly references the missing 60-second invalidation SLA
    And the ADR status remains "Proposed" (not "Accepted") until the section is updated
```

**Test Data:**
- Missing requirement: `"invalidation_within_60_seconds_of_policy_change"`
- Expected review outcome: `"CHANGES_REQUESTED"`
- Expected ADR status after rejected review: `"Proposed"`

**Preconditions:**
- ADR draft exists
- Platform architect has repository write access and pending review assignment

---

### T-5.1: ADR moves to "Accepted" after required approvals
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: ADR Review and Approval Gate

  Scenario: ADR status updated to Accepted after platform architect and security team approval
    Given the ADR is in "Proposed" state at "docs/architecture/decisions/ADR-NNN-jwt-session-strategy.md"
    And "architect-platform@example.com" has been assigned as reviewer
    And "sec-reviewer@example.com" from the security team has been assigned as reviewer
    When both reviewers approve the ADR via the repository PR review mechanism
    Then the ADR status field is updated to "Accepted"
    And SESSION-01 is eligible to enter sprint planning
    And the update commit is authored after both approvals (verified via git log)
```

**Test Data:**
- Platform architect: `{ email: "architect-platform@example.com", role: "platform_architect" }`
- Security reviewer: `{ email: "sec-reviewer@example.com", role: "security_team" }`
- Required approval count: `2` (one from each role)
- ADR target status: `"Accepted"`

**Preconditions:**
- ADR PR is open and in "Proposed" state
- Both reviewers have been added to the PR as required reviewers
- Branch protection rule requires 2 approvals before merge

---

### T-5.2: SESSION-01 blocked from sprint planning while ADR is not "Accepted"
**Maps to:** AC-5
**Category:** error-handling

```gherkin
Feature: ADR Review and Approval Gate

  Scenario: SESSION-01 cannot enter sprint planning while ADR is "Proposed"
    Given the ADR is in "Proposed" state
    And only the platform architect has approved (security team review is pending)
    When a sprint planner attempts to move SESSION-01 from backlog to sprint planning
    Then the attempt is blocked (via project management tool constraint or documented process gate)
    And a notification or warning indicates that SPIKE-AUTH-01 ADR must be "Accepted" before SESSION-01 can proceed
```

**Test Data:**
- ADR current status: `"Proposed"`
- Approvals received: `1` (architect only)
- Approvals required: `2`
- SESSION-01 expected state: `"Backlog"` (blocked)

**Preconditions:**
- SESSION-01 ticket has a documented dependency link to SPIKE-AUTH-01
- Sprint planning process gate is enforced (manual or automated)

---

### T-6.1: Spike ends with no production code in main branch
**Maps to:** AC-6
**Category:** boundary

```gherkin
Feature: Spike Scope Containment — No Production Code

  Scenario: No production code changes are merged to main as a result of the spike
    Given the spike timebox has ended
    And the ADR has been merged to main
    When a reviewer checks the git diff between the pre-spike main SHA and the post-spike main SHA
    Then the only files changed in main are within "docs/architecture/decisions/"
    And no files in "src/", "lib/", "app/", "services/", "migrations/", or any application code path are modified
    And no package dependency files (package.json, package-lock.json, go.mod, etc.) are modified
```

**Test Data:**
- Expected changed paths: `["docs/architecture/decisions/ADR-NNN-jwt-session-strategy.md"]`
- Prohibited changed path prefixes: `["src/", "lib/", "app/", "services/", "migrations/", "package.json", "package-lock.json"]`
- Verification command: `git diff <pre-spike-sha> <post-spike-sha> --name-only`

**Preconditions:**
- Pre-spike main branch SHA is recorded at spike start
- Any proof-of-concept code is on a separate named branch (e.g., `spike/jwt-poc`)

---

### T-6.2: Proof-of-concept code is clearly labelled non-production and not merged to main
**Maps to:** AC-6
**Category:** error-handling

```gherkin
Feature: Spike Scope Containment — No Production Code

  Scenario: Proof-of-concept code exists only on a throwaway branch and is not in main
    Given the engineer produced a proof-of-concept implementation during the spike
    When the spike story is accepted
    Then the PoC code exists only on branch "spike/jwt-poc" (or equivalent throwaway branch)
    And the PoC branch has NOT been merged into main
    And any PoC files contain a top-of-file comment: "NON-PRODUCTION: Spike proof-of-concept only. Do not use in production."
    And the ADR explicitly references the PoC branch name for reference purposes
```

**Test Data:**
- PoC branch name pattern: `"spike/*"` or `"poc/*"`
- Required file header comment: `"NON-PRODUCTION: Spike proof-of-concept only. Do not use in production."`
- Merge check: `git branch --merged main | grep spike` must return empty

**Preconditions:**
- PoC branch has been created from main during the spike timebox
- Branch naming convention is agreed before spike starts

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated access to internal ADR repository is rejected
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Repository Access Control — Unauthenticated

  Scenario: Unauthenticated user cannot read the ADR document
    Given no valid GitHub authentication token is present in the request
    When an unauthenticated HTTP GET is made to the raw file URL for "docs/architecture/decisions/ADR-NNN-jwt-session-strategy.md" in the private repository
    Then the response status is 401 Unauthorized
    And no file content is returned in the response body
    And the response body or headers indicate authentication is required
```

**Test Data:**
- Request: `GET https://api.github.com/repos/<org>/<repo>/contents/docs/architecture/decisions/ADR-NNN-jwt-session-strategy.md`
- Auth header: absent
- Expected status: `401`

**Preconditions:**
- Repository is set to private visibility
- GitHub repository access controls are configured
- Test is run against the actual repository API (not a local clone)

---

### T-AUTH-2.1: Authenticated user without write permission cannot create or modify the ADR
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Repository Access Control — Insufficient Permissions

  Scenario: Read-only team member cannot push changes to the ADR file path
    Given authenticated user "readonly-dev@example.com" has "read" access to the repository but not "write"
    When the user attempts to create a new file at "docs/architecture/decisions/ADR-NNN-jwt-session-strategy.md" via the GitHub API
    Then the response status is 403 Forbidden
    And the response body indicates the user lacks write permission
    And no file is created or modified in the repository

  Scenario: Read-only team member cannot merge a PR modifying the ADR path
    Given authenticated user "readonly-dev@example.com" is a "read" collaborator
    And a PR exists that modifies "docs/architecture/decisions/ADR-NNN-jwt-session-strategy.md"
    When the user attempts to merge the PR via the GitHub API
    Then the response status is 403 Forbidden
    And the PR remains open and unmerged
```

**Test Data:**
- Unauthorized user: `{ email: "readonly-dev@example.com", repo_role: "read" }`
- Authorized roles: `["backend_engineer_with_write", "platform_architect"]`
- Prohibited API call: `PUT /repos/<org>/<repo>/contents/docs/architecture/decisions/ADR-NNN-jwt-session-strategy.md`
- Expected status: `403`

**Preconditions:**
- Repository has branch protection rules requiring specific team membership for merges
- Test user `readonly-dev@example.com` is a repository collaborator with "read" role only
- A test PR targeting `docs/architecture/decisions/` exists in draft state

---

---

# Test Specifications: INFRA-AUTH-01 — Authentication Database Schema Migration

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2, T-1.3 | happy-path, boundary |
| AC-2 | T-2.1, T-2.2 | happy-path, error-handling |
| AC-3 | T-3.1 | edge-case |
| AC-4 | T-4.1, T-4.2 | happy-path, edge-case |
| AC-5 | T-5.1, T-5.2 | security, boundary |
| AC-6 | T-6.1, T-6.2 | performance, happy-path |
| AC-7 | T-7.1, T-7.2 | happy-path, edge-case |
| AC-8 | T-8.1, T-8.2 | security, happy-path |
| AC-9 | T-9.1, T-9.2 | edge-case, performance |
| AC-10 | T-10.1 | security |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: All required new tables are created by forward migration
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Schema Migration — Table Creation

  Scenario: Forward migration creates all six required new tables
    Given a clean PostgreSQL database instance with the pre-migration schema applied
    And the pre-migration schema does NOT contain "sso_configurations", "mfa_enrollments", "recovery_codes", "auth_audit_log", "session_policies", or "break_glass_accounts"
    When the forward migration is executed
    Then the table "sso_configurations" exists with correct columns
    And the table "mfa_enrollments" exists with correct columns
    And the table "recovery_codes" exists with correct columns
    And the table "auth_audit_log" exists with correct columns
    And the table "session_policies" exists with correct columns
    And the table "break_glass_accounts" exists with correct columns
```

**Test Data:**
- Database: PostgreSQL (version matching production)
- Pre-migration state: schema snapshot from `git show <pre-migration-sha>:schema.sql`
- Expected new tables: `["sso_configurations", "mfa_enrollments", "recovery_codes", "auth_audit_log", "session_policies", "break_glass_accounts"]`

**Preconditions:**
- PostgreSQL instance is available in the test environment
- Migration framework (Flyway / Liquibase / equivalent) is configured and pointing at the test database
- Pre-migration schema is cleanly applied before the test

---

### T-1.2: Required columns added to existing organizations table
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Schema Migration — Column Addition to Existing Tables

  Scenario: Forward migration adds three required columns to the organizations table
    Given the "organizations" table exists with its pre-migration column set
    When the forward migration is executed
    Then the "organizations" table has a column "mfa_required" of type boolean with a default value of false
    And the "organizations" table has a column "sso_enforced" of type boolean with a default value of false
    And the "organizations" table has a column "grace_period_ends_at" of type timestamp that is nullable
    And no existing rows in "organizations" have their other column values modified
```

**Test Data:**
- Pre-migration organizations table seed: `[{ id: "org-001", name: "Acme Corp", created_at: "2024-01-01T00:00:00Z" }, { id: "org-002", name: "Beta Inc", created_at: "2024-03-15T00:00:00Z" }]`
- Expected post-migration column defaults: `{ mfa_required: false, sso_enforced: false, grace_period_ends_at: null }`
- Existing column values must be unchanged: verified by full row comparison pre/post migration

**Preconditions:**
- "organizations" table contains at least 2 seed rows before migration
- Pre-migration column names are documented

---

### T-1.3: Required column added to existing users table
**Maps to:** AC-1
**Category:** boundary

```gherkin
Feature: Schema Migration — Column Addition to Existing Tables

  Scenario: Forward migration adds billing_access column to the users table
    Given the "users" table exists with its pre-migration column set
    And "users" contains at least 1000 seed rows
    When the forward migration is executed
    Then the "users" table has a column "billing_access" of type boolean with a default value of false
    And all 1000+ existing rows have "billing_access" set to false
    And no other column values in "users" are modified
```

**Test Data:**
- Seed user count: `1000`
- New column: `{ name: "billing_access", type: "boolean", default: false, nullable: false }`
- Post-migration verification: `SELECT COUNT(*) FROM users WHERE billing_access IS NULL` must return `0`

**Preconditions:**
- "users" table is seeded with 1000+ rows before migration

---

### T-2.1: Rollback migration returns schema to pre-migration state
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Schema Migration — Rollback

  Scenario: Rollback migration removes all tables and columns added by the forward migration
    Given the forward migration has been applied successfully to a staging database
    And the staging database contains pre-existing data in "organizations" and "users"
    When the rollback migration is executed
    Then the tables "sso_configurations", "mfa_enrollments", "recovery_codes", "auth_audit_log", "session_policies", "break_glass_accounts" no longer exist
    And the "organizations" table does not contain columns "mfa_required", "sso_enforced", or "grace_period_ends_at"
    And the "users" table does not contain column "billing_access"
    And all pre-existing rows in "organizations" and "users" are present with identical data as before the forward migration
    And the migration framework reports the schema version as the pre-migration version
```

**Test Data:**
- Pre-migration snapshot: `{ organizations: [{ id: "org-001", name: "Acme Corp" }], users: [{ id: "user-001", email: "alice@example.com" }] }`
- Post-rollback verification: full row-level comparison against pre-migration snapshot
- Migration version: must revert to version `N-1` where `N` is the forward migration version

**Preconditions:**
- Forward migration has been successfully applied
- Pre-migration snapshot is captured before the forward migration runs (used for row comparison)

---

### T-2.2: Rollback migration fails — on-call is paged and database enters read-only mode
**Maps to:** AC-2
**Category:** error-handling

```gherkin
Feature: Schema Migration — Rollback Failure Handling

  Scenario: Rollback migration failure triggers on-call page and read-only mode
    Given the forward migration has been applied to staging
    And the rollback migration script contains a deliberate syntax error for testing purposes
    When the rollback migration is executed and fails
    Then the on-call engineer receives a page via the alerting system within 5 minutes
    And the database is placed in read-only mode (verified by attempting a write — it must fail)
    And the runbook at "docs/runbooks/infra-auth-01-rollback.md" is accessible for manual intervention
    And no partial schema changes remain in an inconsistent state
```

**Test Data:**
- Simulated failure: injected syntax error in rollback migration step 2 of N
- Alert recipient: `{ oncall_rotation: "platform-db-oncall", channel: "#db-incidents" }`
- Read-only mode check: `INSERT INTO organizations (id, name) VALUES ('test', 'test')` must return an error
- Runbook path: `docs/runbooks/infra-auth-01-rollback.md`

**Preconditions:**
- Test environment has alerting system integration (PagerDuty/OpsGenie mock)
- Runbook file exists at the specified path
- Database supports setting read-only mode (PostgreSQL: `ALTER DATABASE <db> SET default_transaction_read_only = on`)

---

### T-3.1: sso_configurations table contains SCIM-reserved nullable columns
**Maps to:** AC-3
**Category:** edge-case

```gherkin
Feature: Schema Migration — SCIM Column Reservation

  Scenario: sso_configurations table includes SCIM nullable columns not populated by migration
    Given the forward migration has been applied
    When the "sso_configurations" table schema is inspected via information_schema
    Then the column "scim_endpoint" exists with type varchar and is nullable
    And the column "scim_token_hash" exists with type varchar and is nullable
    And the column "scim_enabled" exists with type boolean with a default value of false
    And a SELECT of all rows in "sso_configurations" shows NULL for "scim_endpoint" and "scim_token_hash" and false for "scim_enabled" (no application code populates them during migration)
```

**Test Data:**
- Expected column specs: `[{ name: "scim_endpoint", type: "varchar", nullable: true }, { name: "scim_token_hash", type: "varchar", nullable: true }, { name: "scim_enabled", type: "boolean", nullable: false, default: false }]`
- Post-migration query: `SELECT scim_endpoint, scim_token_hash, scim_enabled FROM sso_configurations` must return zero rows or all-null/false values

**Preconditions:**
- Forward migration has been applied
- No application code seeding sso_configurations has run

---

### T-4.1: sso_configurations supports all three metadata input methods
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Schema Migration — SSO Metadata Input Methods

  Scenario: sso_configurations table contains columns for all three metadata input methods
    Given the forward migration has been applied
    When the "sso_configurations" table schema is inspected
    Then the column "metadata_xml" exists with type text and is nullable
    And the column "metadata_url" exists with type varchar and is nullable
    And the column "entity_id" exists with type varchar and is nullable
    And the column "sso_url" exists with type varchar and is nullable
    And the column "certificate" exists with type text and is nullable
```

**Test Data:**
- Expected columns: `["metadata_xml (text, nullable)", "metadata_url (varchar, nullable)", "entity_id (varchar, nullable)", "sso_url (varchar, nullable)", "certificate (text, nullable)"]`
- Verification query: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'sso_configurations'`

**Preconditions:**
- Forward migration has been applied to a test PostgreSQL database

---

### T-4.2: Only one metadata input method per sso_configurations row
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Schema Migration — SSO Metadata Mutual Exclusivity

  Scenario: sso_configurations row with multiple metadata methods populated is rejected or flagged
    Given the forward migration has been applied
    And the mutual exclusivity enforcement method is documented (check constraint or application logic)
    When an INSERT is attempted on "sso_configurations" with both "metadata_xml" and "metadata_url" populated
    Then if enforced by check constraint: the database returns an error and the row is not inserted
    And if enforced by application logic: the application layer returns a 422 Unprocessable Entity and documents the constraint in the OpenAPI spec
    And the PR description explicitly states which enforcement method is in use
```

**Test Data:**
- Invalid INSERT: `{ organization_id: "org-001", metadata_xml: "<EntityDescriptor>...</EntityDescriptor>", metadata_url: "https://idp.example.com/metadata.xml" }`
- Expected outcome (check constraint): PostgreSQL error `ERROR: new row violates check constraint`
- Expected outcome (application logic): HTTP 422 with body `{ error: "Only one SSO metadata input method may be provided" }`

**Preconditions:**
- Forward migration has been applied
- The enforcement mechanism (check constraint vs application logic) is declared in the ADR or PR description

---

### T-5.1: recovery_codes table stores hashed codes and supports single-use tracking
**Maps to:** AC-5
**Category:** security

```gherkin
Feature: Schema Migration — Recovery Codes Security

  Scenario: recovery_codes table schema enforces hashed storage and single-use semantics
    Given the forward migration has been applied
    When the "recovery_codes" table schema is inspected
    Then the column "code_hash" exists with type varchar and is NOT NULL
    And no column named "code", "plaintext_code", "raw_code", or any variant storing plaintext exists
    And the column "used_at" exists with type timestamp and is nullable
    And the column "invalidated_at" exists with type timestamp and is nullable
    And the column "user_id" exists as a foreign key referencing the "users" table
    And the column "created_at" exists with type timestamp and is NOT NULL
```

**Test Data:**
- Prohibited column names: `["code", "plaintext_code", "raw_code", "recovery_code", "token"]`
- Required columns: `[{ name: "code_hash", type: "varchar", nullable: false }, { name: "used_at", type: "timestamp", nullable: true }, { name: "invalidated_at", type: "timestamp", nullable: true }, { name: "user_id", type: "integer/uuid", fk: "users.id" }]`
- Verification: `SELECT column_name FROM information_schema.columns WHERE table_name = 'recovery_codes'`

**Preconditions:**
- Forward migration has been applied

---

### T-5.2: No plaintext recovery code can be inserted into recovery_codes
**Maps to:** AC-5
**Category:** boundary

```gherkin
Feature: Schema Migration — Recovery Codes Security

  Scenario: Application layer inserts only bcrypt hashes into code_hash column
    Given the recovery codes service prepares 8 recovery codes for a user
    When the service inserts codes into "recovery_codes"
    Then all 8 inserted "code_hash" values begin with "$2b$" (bcrypt hash prefix)
    And the plaintext codes are returned to the user exactly once and never stored
    And a subsequent SELECT of all "code_hash" values for the user returns bcrypt-prefixed strings only
```

**Test Data:**
- User: `{ id: "user-001", email: "alice@example.com" }`
- Expected insert count: `8` rows
- Expected `code_hash` format: all values match regex `^\$2[aby]\$\d{2}\$`
- Post-insert SELECT must not return any value matching `^[A-Z0-9]{8}$` (plaintext pattern)

**Preconditions:**
- Forward migration has been applied
- Recovery code generation service is deployed in test environment

---

### T-6.1: auth_audit_log is range-partitioned by date with correct indexes
**Maps to:** AC-6
**Category:** performance

```gherkin
Feature: Schema Migration — Audit Log Partitioning

  Scenario: auth_audit_log is range-partitioned monthly with composite indexes on each partition
    Given the forward migration has been applied
    When the partition structure of "auth_audit_log" is inspected
    Then 13 monthly partitions exist covering the current month through 12 months ahead
    And each partition has a composite index on "(organization_id, event_type, created_at)"
    And each partition has a composite index on "(user_id, created_at)"
    And an EXPLAIN of "SELECT * FROM auth_audit_log WHERE organization_id = 'org-001' AND event_type = 'login_failure' AND created_at > NOW() - INTERVAL '30 days'" shows "Partition Pruning" in the query plan
```

**Test Data:**
- Partition count: `13` (current month + 12 future months)
- Partition naming pattern: `auth_audit_log_YYYY_MM`
- Test query: `SELECT * FROM auth_audit_log WHERE organization_id = 'org-001' AND event_type = 'login_failure' AND created_at > NOW() - INTERVAL '30 days'`
- Expected EXPLAIN output: must include `"Partition pruning: enabled"` and exclude full partition scans on non-matching partitions

**Preconditions:**
- Forward migration has been applied
- Test database is PostgreSQL 11+ (declarative partitioning with pruning)
- At least one row per partition exists to verify index usage

---

### T-6.2: Partitioned query uses partition pruning
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: Schema Migration — Audit Log Query Performance

  Scenario: Query on auth_audit_log with date range uses partition pruning
    Given the forward migration has been applied
    And "auth_audit_log" contains 10,000 seeded rows spread across 3 monthly partitions
    When EXPLAIN ANALYZE is run on the query for organization "org-001" with event_type "mfa_challenge" in the last 30 days
    Then the query plan accesses at most 2 partitions (current month + previous month)
    And the other 11 partitions are excluded from the scan
    And the query completes in under 100ms
```

**Test Data:**
- Seed rows: `10000` distributed across months `M-1`, `M`, and `M+1`
- Test org: `{ organization_id: "org-001" }`
- Test event_type: `"mfa_challenge"`
- Max query duration: `100ms`
- Expected partitions scanned: `≤ 2`

**Preconditions:**
- Forward migration applied
- 10,000 rows seeded across multiple partitions

---

### T-7.1: Retention policy is configured and version-controlled
**Maps to:** AC-7
**Category:** happy-path

```gherkin
Feature: Schema Migration — Audit Log Retention Policy

  Scenario: Retention policy drops partitions older than 12 months and is version-controlled
    Given the forward migration has been applied
    And the retention job configuration is committed to the repository
    When the retention job configuration is inspected
    Then a scheduled job (cron, pg_cron, or partition management tool) is configured to drop partitions older than 12 calendar months
    And the first scheduled drop will NOT affect any partition with data younger than 12 months from the migration date
    And the retention job configuration file is present in the repository alongside the migration files
    And the retention policy is documented in the PR description
```

**Test Data:**
- Retention window: `12` months
- Expected job schedule: monthly execution
- First safe drop target: partition for month `M-12` or earlier (where `M` is the migration month)
- Configuration file location: alongside migration files (e.g., `migrations/retention/auth_audit_log_retention.sql`)

**Preconditions:**
- Forward migration has been applied
- Repository has the migration directory committed
- pg_cron or equivalent is available in the test environment

---

### T-7.2: Retention job does not drop data younger than 12 months
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Schema Migration — Audit Log Retention Safety

  Scenario: Retention job dry-run identifies only partitions older than 12 months for deletion
    Given the forward migration has been applied
    And auth_audit_log partitions exist for months M-13, M-12, M-6, and M (current month)
    When the retention job is executed in dry-run mode
    Then only the partition for month M-13 is identified for deletion
    And the partition for M-12 is NOT marked for deletion (it is exactly at the boundary — 12 months old)
    And partitions for M-6 and M are NOT marked for deletion
```

**Test Data:**
- Partition ages: `{ "M-13": "13 months ago", "M-12": "12 months ago", "M-6": "6 months ago", "M": "current month" }`
- Expected deletions: `["auth_audit_log_M-13"]`
- Expected retained partitions: `["auth_audit_log_M-12", "auth_audit_log_M-6", "auth_audit_log_M"]`

**Preconditions:**
- Forward migration applied with test partitions for all four months
- Retention job supports a dry-run mode

---

### T-8.1: session_policies table supports immediate revocation flag and user_sessions revoked_at column
**Maps to:** AC-8
**Category:** security

```gherkin
Feature: Schema Migration — Session Revocation Schema

  Scenario: session_policies table contains all required columns for immediate revocation
    Given the forward migration has been applied
    When the "session_policies" table schema is inspected
    Then the column "organization_id" exists as a unique foreign key referencing "organizations"
    And the column "session_timeout_seconds" exists as integer with default 86400 and maximum constraint of 2592000
    And the column "invalidate_sessions_on_policy_change" exists as boolean with default true
    And the column "updated_at" exists as timestamp
    And a "user_sessions" table (or equivalent revocation store) exists with a "revoked_at" nullable timestamp column
```

**Test Data:**
- `session_timeout_seconds` default: `86400` (24 hours)
- `session_timeout_seconds` max: `2592000` (30 days)
- `invalidate_sessions_on_policy_change` default: `true`
- Revocation store table: `user_sessions` (or documented equivalent)
- `revoked_at` column: `{ type: "timestamp", nullable: true }`

**Preconditions:**
- Forward migration has been applied
- Schema inspection via `information_schema.columns` and `information_schema.table_constraints`

---

### T-8.2: session_timeout_seconds constraint rejects values above 2592000
**Maps to:** AC-8
**Category:** happy-path

```gherkin
Feature: Schema Migration — Session Timeout Constraint

  Scenario: Inserting a session policy with timeout above 30 days is rejected
    Given the forward migration has been applied
    When an INSERT into "session_policies" is attempted with session_timeout_seconds = 2592001
    Then the database returns a constraint violation error
    And no row is inserted into "session_policies"

  Scenario: Inserting a session policy with timeout of exactly 30 days is accepted
    Given the forward migration has been applied
    When an INSERT into "session_policies" is attempted with session_timeout_seconds = 2592000
    Then the INSERT succeeds
    And the inserted row has session_timeout_seconds = 2592000
```

**Test Data:**
- Invalid timeout: `2592001` seconds (30 days + 1 second)
- Valid maximum timeout: `2592000` seconds (exactly 30 days)
- Valid minimum timeout: `1` second

**Preconditions:**
- Forward migration has been applied
- CHECK constraint on `session_timeout_seconds` is part of the migration (or documented as application-enforced)

---

### T-9.1: Forward migration completes in under 10 minutes on staging with 50k users
**Maps to:** AC-9
**Category:** edge-case

```gherkin
Feature: Schema Migration — Performance on Production-Scale Data

  Scenario: Forward migration completes within 10 minutes on anonymized 50k-user staging dataset
    Given a staging PostgreSQL database seeded with an anonymized copy of the production dataset containing 50,000 user rows
    And the staging database has the same hardware specifications as production
    When the forward migration is executed
    Then the migration completes without errors in under 600 seconds (10 minutes)
    And zero rows in "users", "organizations", or any pre-existing table have their data modified
    And the migration log contains a start timestamp and end timestamp confirming sub-10-minute execution
```

**Test Data:**
- Staging dataset: `{ users: 50000, organizations: "<production count, anonymized>" }`
- Time limit: `600` seconds
- Zero-modification check: `SELECT COUNT(*) FROM users` pre vs post must be identical; row checksums must match

**Preconditions:**
- Staging database has anonymized production data (PII replaced with synthetic values)
- Staging hardware matches production specs
- Migration timer is started before and stopped after migration framework reports completion

---

### T-9.2: Rollback migration also completes without errors on staging
**Maps to:** AC-9
**Category:** performance

```gherkin
Feature: Schema Migration — Rollback Performance on Staging

  Scenario: Rollback migration completes successfully on the 50k-user staging dataset
    Given the forward migration has been applied successfully to the 50k-user staging database
    When the rollback migration is executed
    Then it completes without errors
    And all tables and columns added by the forward migration are removed
    And all pre-existing data is intact (verified by row count and spot-check comparison)
    And both direction results are documented as "PASS" in the PR description
```

**Test Data:**
- Same staging dataset as T-9.1
- PR description must contain: `{ forward_migration: "PASS", rollback_migration: "PASS", staging_dataset: "50k-user anonymized copy", execution_dates: "<timestamps>" }`

**Preconditions:**
- T-9.1 has passed (forward migration succeeded)
- Rollback is executed immediately after T-9.1 in the same staging session

---

### T-10.1: All per-organization tables include non-nullable organization_id foreign key
**Maps to:** AC-10
**Category:** security

```gherkin
Feature: Schema Migration — Multi-Tenancy Isolation

  Scenario: Every new table storing per-org data has a non-nullable organization_id FK
    Given the forward migration has been applied
    When the schema of all new tables is inspected
    Then "sso_configurations" has column "organization_id" as NOT NULL with a foreign key to "organizations.id"
    And "mfa_enrollments" has column "organization_id" as NOT NULL with a foreign key to "organizations.id"
    And "session_policies" has column "organization_id" as NOT NULL with a foreign key to "organizations.id"
    And "auth_audit_log" has column "organization_id" as NOT NULL with a foreign key to "organizations.id"
    And "break_glass_accounts" has column "organization_id" as NOT NULL with a foreign key to "organizations.id"
    And no new table contains a row that could store data belonging to more than one organization

  Scenario: INSERT with NULL organization_id is rejected by NOT NULL constraint
    Given the forward migration has been applied
    When an INSERT into "sso_configurations" is attempted with organization_id = NULL
    Then the database returns "ERROR: null value in column organization_id violates not-null constraint"
    And no row is inserted
```

**Test Data:**
- Tables requiring `organization_id NOT NULL FK`: `["sso_configurations", "mfa_enrollments", "session_policies", "auth_audit_log", "break_glass_accounts"]`
- Test INSERT: `{ table: "sso_configurations", organization_id: null, ... }` → must fail
- Verification query: `SELECT table_name, column_name, is_nullable FROM information_schema.columns WHERE column_name = 'organization_id' AND table_name IN ('sso_configurations', 'mfa_enrollments', 'session_policies', 'auth_audit_log', 'break_glass_accounts')`

**Preconditions:**
- Forward migration has been applied
- "organizations" table contains at least one row with `id = "org-001"` for FK validation

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to migration status endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Migration API Access Control — Unauthenticated

  Scenario: Unauthenticated request to migration status API is rejected
    Given no authentication token is present in the request headers
    When an HTTP GET is made to "/internal/migrations/status"
    Then the response status is 401 Unauthorized
    And the response body contains a message indicating authentication is required
    And no migration status data is returned

  Scenario: Unauthenticated request to admin database tooling endpoint is rejected
    Given no authentication token is present
    When an HTTP POST is made to "/internal/migrations/run"
    Then the response status is 401 Unauthorized
    And no migration is triggered
```

**Test Data:**
- Endpoints under test: `["/internal/migrations/status", "/internal/migrations/run"]`
- Auth header: absent
- Expected status: `401`
- Expected response body: `{ "error": "Unauthorized", "message": "Authentication required" }`

**Preconditions:**
- Internal migration API is deployed in test environment
- No session cookie or Authorization header is set in the test request

---

### T-AUTH-2.1: Authenticated user without platform_engineer role cannot trigger migrations
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Migration API Access Control — Insufficient Permissions

  Scenario: Developer without platform_engineer role is denied migration execution
    Given authenticated user "developer@example.com" has role "developer" (not "platform_engineer" or "database_admin")
    And a valid JWT for "developer@example.com" is included in the Authorization header
    When the user sends a POST to "/internal/migrations/run"
    Then the response status is 403 Forbidden
    And the response body contains a message identifying the missing role
    And no migration is executed

  Scenario: Non-privileged user cannot read migration status endpoint
    Given authenticated user "developer@example.com" has role "developer"
    When the user sends a GET to "/internal/migrations/status"
    Then the response status is 403 Forbidden
```

**Test Data:**
- Unauthorized user: `{ email: "developer@example.com", role: "developer", jwt: "<valid-token-for-developer>" }`
- Authorized roles: `["platform_engineer", "database_admin"]`
- Expected status: `403`
- Expected body: `{ "error": "Forbidden", "message": "Role 'platform_engineer' or 'database_admin' required" }`

**Preconditions:**
- Test user `developer@example.com` exists with a valid JWT but lacks the required role
- Authorization middleware is deployed and enforcing role-based access

---

---

# Test Specifications: RATE-01 — Application-Layer Rate Limiting on Auth Endpoints

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2, T-1.3 | happy-path, edge-case, boundary |
| AC-2 | T-2.1, T-2.2 | happy-path, edge-case |
| AC-3 | T-3.1, T-3.2, T-3.3 | edge-case, boundary |
| AC-4 | T-4.1, T-4.2 | happy-path, boundary |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1 | happy-path |
| AC-7 | T-7.1 | edge-case |
| AC-8 | T-8.1 | edge-case |
| AC-9 | T-9.1 | boundary |
| AC-10 | T-10.1 | security |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Account locked after 5 consecutive failed attempts with correct 429 response
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Account-Level Rate Limiting

  Scenario: Account is locked after 5 consecutive failed login attempts
    Given user "alice@example.com" exists with status "active"
    And no prior lockout is active for "alice@example.com"
    And Redis is available and contains no lockout key for "alice@example.com"
    When 5 consecutive POST requests are made to "/auth/login" with body { "email": "alice@example.com", "password": "wrong-password-1" } through "wrong-password-5"
    Then each of the first 4 responses has status 401 Unauthorized
    And the 5th response has status 429 Too Many Requests
    And the 5th response body contains "Account temporarily locked. Try again after [UTC timestamp]"
    And the 5th response includes header "Retry-After" with value between 899 and 900 (seconds)
    And a Redis key for the account lockout exists with TTL of 900 seconds
```

**Test Data:**
- User: `{ email: "alice@example.com", password_hash: "<bcrypt of 'correct-password'>", status: "active", role: "user" }`
- Invalid passwords: `["wrong-password-1", "wrong-password-2", "wrong-password-3", "wrong-password-4", "wrong-password-5"]`
- Redis lockout key pattern: `"account:lockout:alice@example.com"`
- Expected Retry-After: `900` seconds
- Expected response body pattern: `"Account temporarily locked. Try again after 2024-01-15T12:15:00Z"`

**Preconditions:**
- Redis is running and accessible to the application
- `auth_audit_log` table exists (INFRA-AUTH-01 applied)
- No existing lockout state for "alice@example.com" in Redis

---

### T-1.2: Lockout window is from the 5th failed attempt — not reset by additional attempts
**Maps to:** AC-1
**Category:** edge-case

```gherkin
Feature: Account-Level Rate Limiting

  Scenario: Additional failed attempts during lockout do not extend the lockout window
    Given "alice@example.com" has just been locked out (5 failed attempts at T+0)
    And the Redis key TTL for the lockout is 900 seconds at T+0
    When 3 additional failed login attempts are made at T+60 (1 minute into lockout)
    Then each response has status 429 Too Many Requests
    And the Redis key TTL has not been reset — it is approximately 840 seconds (900 - 60)
    And the Retry-After header reflects the original TTL (not a reset value)
```

**Test Data:**
- Lockout start: `T+0`
- Additional attempts: at `T+60s` (3 attempts)
- Expected Redis TTL at T+60: `~840` seconds (within ±5 seconds tolerance)
- Expected Retry-After: `~840` seconds (not `900`)

**Preconditions:**
- Account lockout is active from T-1.1 or equivalent setup
- System clock is controlled/mocked or test uses real-time with time measurement

---

### T-1.3: Locked account returns 429 on next attempt; unlocks after 15 minutes
**Maps to:** AC-1, AC-6
**Category:** boundary

```gherkin
Feature: Account-Level Rate Limiting — Automatic Unlock

  Scenario: Account automatically unlocks after 15 minutes without admin intervention
    Given "alice@example.com" has been locked out at T+0
    When 900 seconds (15 minutes) elapse (Redis TTL expires)
    And a new login attempt is made with the correct password
    Then the response status is 200 OK
    And the Redis lockout key for "alice@example.com" no longer exists
    And no admin action was required to unlock the account
```

**Test Data:**
- User: `{ email: "alice@example.com", password: "correct-password" }`
- Lockout TTL: `900` seconds
- Post-expiry login: valid credentials
- Expected status after expiry: `200 OK`

**Preconditions:**
- Account was locked using 5 failed attempts
- Test environment supports time advancement or waits 900 seconds (integration test)
- Redis TTL expiry is verified via `TTL <lockout-key>` returning `-2` (key does not exist)

---

### T-2.1: IP throttled after 5 failures across any accounts within 15-minute window
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: IP-Level Rate Limiting

  Scenario: IP address is throttled after 5 failed attempts across different accounts
    Given IP address "203.0.113.42" has made 0 prior failed attempts
    And Redis contains no throttle key for "203.0.113.42"
    When POST /auth/login is called with wrong credentials for "user1@example.com" from IP "203.0.113.42"
    And POST /auth/login is called with wrong credentials for "user2@example.com" from IP "203.0.113.42"
    And POST /auth/login is called with wrong credentials for "user3@example.com" from IP "203.0.113.42"
    And POST /auth/login is called with wrong credentials for "user4@example.com" from IP "203.0.113.42"
    And POST /auth/login is called with wrong credentials for "user5@example.com" from IP "203.0.113.42"
    Then the response to the 5th attempt has status 429 Too Many Requests
    And a Retry-After header is present with value approximately 900 seconds
    And the Redis key "ip:throttle:203.0.113.42" exists with TTL of 900 seconds
    And subsequent requests from "203.0.113.42" to /auth/login, /auth/mfa/challenge, and /auth/password/reset return 429
```

**Test Data:**
- Source IP: `"203.0.113.42"` (TEST-NET-3, safe for tests)
- Test accounts: `["user1@example.com", "user2@example.com", "user3@example.com", "user4@example.com", "user5@example.com"]`
- Redis key pattern: `"ip:throttle:203.0.113.42"`
- Expected TTL: `900` seconds

**Preconditions:**
- All 5 test user accounts exist with status "active"
- Redis is running with no prior state for this IP
- Application reads the client IP from a trusted source (not raw `X-Forwarded-For`)

---

### T-2.2: IP throttle is stored in Redis and survives application instance boundaries
**Maps to:** AC-2, AC-8
**Category:** edge-case

```gherkin
Feature: IP-Level Rate Limiting — Redis Persistence

  Scenario: IP throttle state in Redis persists across application restarts
    Given IP "203.0.113.42" has been throttled (Redis key exists with TTL = 700 seconds)
    When the application server is restarted (new process, same Redis instance)
    And a request is made from "203.0.113.42" to POST /auth/login within the lockout window
    Then the response has status 429 Too Many Requests
    And the Retry-After header reflects the remaining TTL (~700 seconds)
    And in-process memory of the throttle was not the source of the enforcement
```

**Test Data:**
- Source IP: `"203.0.113.42"`
- Redis TTL at restart: `700` seconds
- Expected Retry-After after restart: `~700` seconds (±10 seconds)

**Preconditions:**
- Redis contains the throttle key from a prior test or setup fixture
- Application server has been restarted (process kill + restart, not just hot reload)
- New application instance connects to the same Redis

---

### T-3.1: CAPTCHA challenge is included in response after 3 failures (pre-lockout)
**Maps to:** AC-3
**Category:** edge-case

```gherkin
Feature: CAPTCHA Challenge After 3 Failures

  Scenario: CAPTCHA flag is returned in login response after exactly 3 failed attempts
    Given "bob@example.com" has made exactly 0 prior failed attempts
    When 3 consecutive failed login attempts are made with wrong credentials for "bob@example.com"
    Then the 1st and 2nd responses have status 401 and no CAPTCHA flag
    And the 3rd response has status 401 and the response payload includes a CAPTCHA challenge field (e.g., { "require_captcha": true, "captcha_site_key": "6Le..." })
    And the account is NOT yet locked (failure count is 3, lockout threshold is 5)
```

**Test Data:**
- User: `{ email: "bob@example.com", status: "active" }`
- Failure count at CAPTCHA trigger: `3`
- Lockout threshold: `5`
- Expected CAPTCHA field: `{ "require_captcha": true, "captcha_site_key": "<site_key>" }`

**Preconditions:**
- CAPTCHA provider is configured in test environment (or mocked)
- Bob's account has zero prior failed attempts
- Redis counter for `bob@example.com` is zero

---

### T-3.2: Failed CAPTCHA does not increment failure counter
**Maps to:** AC-3
**Category:** boundary

```gherkin
Feature: CAPTCHA Challenge — Counter Isolation

  Scenario: CAPTCHA solution failure does not count toward the 5-attempt lockout threshold
    Given "bob@example.com" has 3 failed login attempts (CAPTCHA is being shown)
    When the user submits attempt 4 with wrong credentials and an invalid CAPTCHA token
    Then the response has status 400 Bad Request (or equivalent CAPTCHA rejection)
    And the failure counter for "bob@example.com" remains at 3 (not incremented to 4)
    And the Redis failure counter value is 3
```

**Test Data:**
- User: `{ email: "bob@example.com", failure_count: 3 }`
- CAPTCHA token: `"invalid-captcha-token-abc123"`
- Expected response status: `400` (CAPTCHA invalid) or platform-specific rejection
- Expected Redis counter post-attempt: `3` (unchanged)

**Preconditions:**
- Bob has 3 prior failed attempts
- CAPTCHA validation is set to reject the test token
- Redis counter key exists with value `3`

---

### T-3.3: Lockout triggered only by 5 failed credential attempts, not CAPTCHA failures
**Maps to:** AC-3
**Category:** boundary

```gherkin
Feature: CAPTCHA Challenge — Lockout Threshold Isolation

  Scenario: Account lockout requires 5 credential failures; CAPTCHA failures do not contribute
    Given "bob@example.com" has 3 failed credential attempts
    And attempts 4 and 5 are submitted with valid CAPTCHA but wrong passwords
    When the 5th attempt (wrong password + valid CAPTCHA) is submitted
    Then the response status is 429 Too Many Requests (account locked)
    And the lockout was triggered by 5 credential failures (CAPTCHA failures were zero or ignored in the count)
    And a test with 3 credential failures + 10 CAPTCHA failures does NOT trigger lockout
```

**Test Data:**
- Credential failure count required for lockout: `5`
- Scenario A: `3 credential failures + 2 (credential failure + valid captcha) = 5 → lockout`
- Scenario B: `3 credential failures + 10 CAPTCHA failures = no lockout` (counter stays at 3)

**Preconditions:**
- CAPTCHA provider is configured to accept a test token as valid
- Redis counters for credential failures and CAPTCHA failures are separately tracked or combined per spec

---

### T-4.1: Rate limiting applies identically to all three auth endpoints
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Rate Limiting Endpoint Coverage

  Scenario Outline: Rate limiting enforces lockout on each of the three auth endpoints
    Given user "<email>" exists and no lockout is active
    When 5 consecutive failed requests are sent to "<endpoint>" with invalid credentials
    Then the 5th response has status 429 Too Many Requests
    And the Retry-After header is present

    Examples:
      | email                   | endpoint                   |
      | alice@example.com       | POST /auth/login           |
      | bob@example.com         | POST /auth/mfa/challenge   |
      | carol@example.com       | POST /auth/password/reset  |
```

**Test Data:**
- Per endpoint test users: `[alice@example.com, bob@example.com, carol@example.com]`
- Invalid payloads per endpoint:
  - `/auth/login`: `{ "email": "<email>", "password": "wrong" }`
  - `/auth/mfa/challenge`: `{ "user_id": "<id>", "totp_code": "000000" }`
  - `/auth/password/reset`: `{ "email": "<email>", "reset_token": "invalid-token" }`

**Preconditions:**
- All three users exist with status "active"
- Redis is available with no prior lockout state per user
- Rate limiting middleware is applied to all three endpoints

---

### T-4.2: Rate limiting is NOT applied to endpoints outside the three covered endpoints
**Maps to:** AC-4
**Category:** boundary

```gherkin
Feature: Rate Limiting Endpoint Scope

  Scenario: 100 rapid requests to a non-auth endpoint are not rate limited by auth middleware
    Given a user with a valid session token
    When 100 rapid GET requests are sent to "/api/profile" (a non-auth endpoint)
    Then all 100 responses have status 200 OK (or whatever the normal response would be)
    And no 429 response is returned due to auth rate limiting middleware
    And Redis contains no lockout key created by these requests
```

**Test Data:**
- Non-auth endpoint: `GET /api/profile`
- Request count: `100`
- Auth middleware lockout check: `KEYS "account:lockout:*"` must return empty after these requests

**Preconditions:**
- Rate limiting middleware is scoped to only the three auth endpoints
- Test user has a valid session (so 401 doesn't confuse results)

---

### T-5.1: Lockout event is written to auth_audit_log with correct fields
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: Rate Limiting Audit Logging

  Scenario: Account lockout event is written to auth_audit_log when threshold is reached
    Given "alice@example.com" (user_id: "user-001") is not locked out
    And the source IP is "203.0.113.42"
    When 5 failed login attempts are submitted for "alice@example.com" from "203.0.113.42"
    Then a row is inserted into "auth_audit_log" with:
      | Field          | Value                              |
      | event_type     | "account_lockout"                  |
      | user_id        | "user-001"                         |
      | ip_address     | "203.0.113.42"                     |
      | attempt_count  | 5                                  |
      | locked_until   | [UTC timestamp ~15 minutes ahead]  |
      | created_at     | [current UTC timestamp]            |
    And the lockout response to the user is returned within 10ms of the audit write (non-blocking)
```

**Test Data:**
- User: `{ id: "user-001", email: "alice@example.com" }`
- IP: `"203.0.113.42"`
- Expected audit row: `{ event_type: "account_lockout", user_id: "user-001", ip_address: "203.0.113.42", attempt_count: 5, locked_until: T+900s, created_at: T+0 }`

**Preconditions:**
- `auth_audit_log` table exists (INFRA-AUTH-01 applied)
- Audit write is non-blocking (fire-and-forget or async queue)

---

### T-6.1: Account auto-unlocks after 15-minute TTL expiry
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: Automatic Account Unlock

  Scenario: Locked account accepts login after 15-minute TTL expires
    Given "alice@example.com" was locked at T+0 with a Redis TTL of 900 seconds
    When the Redis TTL for the lockout key expires at T+900
    And a login attempt is made with correct credentials at T+901
    Then the response status is 200 OK
    And the Redis lockout key does not exist (TTL is -2)
    And no admin unlock action was taken between T+0 and T+901
```

**Test Data:**
- Lockout key: `"account:lockout:alice@example.com"` with TTL `900`
- Valid credentials: `{ email: "alice@example.com", password: "correct-password" }`
- Post-TTL expiry check: `TTL "account:lockout:alice@example.com"` returns `-2`

**Preconditions:**
- Account was locked in a prior step or test fixture
- Test environment supports waiting 900s or advancing the Redis clock (e.g., via Redis DEBUG SLEEP or test infrastructure)

---

### T-7.1: Successful login resets failure counter to zero
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: Failure Counter Reset on Successful Login

  Scenario: Failure counter is reset after successful authentication
    Given "alice@example.com" has 3 failed attempts recorded in Redis
    And the Redis counter key for "alice@example.com" has value 3
    When "alice@example.com" successfully authenticates with correct credentials
    Then the Redis failure counter key for "alice@example.com" is deleted or set to 0
    And a subsequent wrong-password attempt starts a new failure count from 1
```

**Test Data:**
- User: `{ email: "alice@example.com", password: "correct-password" }`
- Redis counter key: `"account:failures:alice@example.com"` with value `3`
- Post-login Redis state: key deleted or value `0`

**Preconditions:**
- Alice has 3 prior failed attempts
- Redis counter key exists with value 3

---

### T-8.1: Lockout state persists across application restart (Redis-backed)
**Maps to:** AC-8
**Category:** edge-case

```gherkin
Feature: Rate Limiting State Persistence

  Scenario: In-flight lockout is maintained after application server restart
    Given "alice@example.com" is locked out with Redis key TTL = 800 seconds
    When the application server process is stopped and restarted
    And a login attempt is made for "alice@example.com" 10 seconds after restart
    Then the response status is 429 Too Many Requests
    And the Retry-After header value is approximately 790 seconds (800 - 10, ±5s)
    And the lockout state was read from Redis (verified by Redis key existing)
```

**Test Data:**
- Lockout TTL at restart: `800` seconds
- Time elapsed between restart and request: `10` seconds
- Expected Retry-After: `~790` seconds

**Preconditions:**
- Redis is external to the application process (not in-memory)
- Application restart procedure is defined (stop process, start process, same Redis connection)

---

### T-9.1: Rate limiting middleware does not apply to authenticated non-auth endpoint requests
**Maps to:** AC-9
**Category:** boundary

```gherkin
Feature: Rate Limiting Scope Isolation

  Scenario: Authenticated session requests to product features bypass auth rate limiting
    Given "alice@example.com" has an active authenticated session with JWT "valid-jwt-token-abc"
    When 50 rapid requests are sent to "/api/dashboard" with the Authorization header set
    Then all 50 responses are 200 OK (rate limiting middleware does not intercept)
    And no Redis lockout or counter key is created for this activity
    And the rate limiting middleware is confirmed inactive on non-auth routes via application logs
```

**Test Data:**
- Authenticated user: `{ email: "alice@example.com", jwt: "valid-jwt-token-abc" }`
- Non-auth endpoint: `GET /api/dashboard`
- Request count: `50`
- Redis check: `KEYS "account:lockout:*"` must return empty after requests

**Preconditions:**
- Alice has a valid, non-expired JWT
- Rate limiting middleware is configured with explicit route inclusion, not global exclusion

---

## Negative Tests

### T-10.1: Non-existent email lockout response identical to real account lockout response
**Maps to:** AC-10
**Category:** security

```gherkin
Feature: Account Enumeration Prevention

  Scenario: Non-existent email reaches lockout threshold with identical response to real account
    Given "notareal@example.com" does not exist in the users table
    When 5 failed POST requests are made to "/auth/login" with body { "email": "notareal@example.com", "password": "any-password" }
    Then the 5th response has status 429 Too Many Requests
    And the response body is identical to the 429 response for a real locked account
    And the response does NOT contain any indication that the email address is invalid or unregistered
    And the response body and headers are byte-for-byte identical to the real-account lockout response (excluding timestamp values)
```

**Test Data:**
- Non-existent email: `"notareal@example.com"`
- Real locked account email: `"alice@example.com"` (locked via separate test setup)
- Expected comparison: response body structure and status must match exactly; only timestamp values may differ

**Preconditions:**
- `"notareal@example.com"` does not exist in the database (verified before test)
- `"alice@example.com"` exists and has been independently locked for comparison
- Response comparison excludes dynamic timestamp fields

---

## Authorization Tests

### T-AUTH-1.1: Rate limiting config API rejects unauthenticated requests
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Rate Limiting Admin API — Unauthenticated

  Scenario: Unauthenticated request to rate limiting status endpoint returns 401
    Given no authentication token is present in the request
    When an HTTP GET is made to "/internal/rate-limit/status"
    Then the response status is 401 Unauthorized
    And no rate limiting state data is returned

  Scenario: Public auth endpoints accept unauthenticated requests by design
    Given no authentication token is present
    When a POST is made to "/auth/login" with body { "email": "alice@example.com", "password": "wrong" }
    Then the response status is 401 Unauthorized (invalid credentials, not rate limit)
    And this is NOT an error — public auth endpoints are intentionally accessible without prior auth
```

**Test Data:**
- Internal endpoint: `GET /internal/rate-limit/status`
- Public endpoint (intentionally unauthenticated): `POST /auth/login`
- Expected status (internal): `401`
- Expected status (public, bad creds): `401` (for different reason — invalid credentials, not access control)

**Preconditions:**
- Internal rate limiting status API exists
- Auth middleware distinguishes public endpoints from protected internal endpoints

---

### T-AUTH-2.1: Authenticated user without security_admin role cannot access lockout status API
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Rate Limiting Admin API — Insufficient Permissions

  Scenario: Developer role cannot query rate limiting state via admin API
    Given authenticated user "developer@example.com" has role "developer" (not "platform_operations" or "security_admin")
    And a valid JWT is included in the Authorization header
    When the user sends GET to "/internal/rate-limit/status"
    Then the response status is 403 Forbidden
    And the response body contains a message identifying the missing permission (e.g., "platform_operations or security_admin role required")
    And no rate limiting state is returned

  Scenario: Developer role cannot view Redis lockout state via any admin API
    Given authenticated user "developer@example.com" has role "developer"
    When the user sends GET to "/internal/rate-limit/accounts/alice@example.com"
    Then the response status is 403 Forbidden
```

**Test Data:**
- Unauthorized user: `{ email: "developer@example.com", role: "developer", jwt: "<valid-token>" }`
- Authorized roles: `["platform_operations", "security_admin"]`
- Expected status: `403`
- Expected body: `{ "error": "Forbidden", "required_roles": ["platform_operations", "security_admin"] }`

**Preconditions:**
- `developer@example.com` exists with a valid JWT but role `"developer"` only
- Role-based access control middleware is active on internal endpoints

---

---

# Test Specifications: RATE-02 — Infrastructure-Layer Rate Limiting

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, edge-case |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1 | boundary |
| AC-5 | T-5.1 | edge-case |
| AC-6 | T-6.1, T-6.2 | security |
| AC-7 | T-7.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: nginx rejects requests exceeding 5 per 15-minute window with 429 and Retry-After
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: nginx Infrastructure Rate Limiting

  Scenario Outline: nginx enforces 5-request-per-15-minute limit on each auth endpoint
    Given nginx is configured with a rate limiting zone for auth endpoints
    And the shared memory zone "auth_rate_limit" is initialized with the correct size
    And client IP "198.51.100.10" has made 0 prior requests in the current window
    When 6 rapid POST requests are sent from "198.51.100.10" to "<endpoint>"
    Then the first 5 responses have status 200 OK (or 401 if credentials are wrong — not 429)
    And the 6th response has status 429 Too Many Requests
    And the 6th response includes a "Retry-After" header
    And the 6th response does NOT reach the application server (rejected at nginx layer)

    Examples:
      | endpoint                   |
      | /auth/login                |
      | /auth/mfa/challenge        |
      | /auth/password/reset       |
```

**Test Data:**
- Source IP: `"198.51.100.10"` (TEST-NET-2, safe for tests)
- Request count: `6` (5 allowed + 1 rejected)
- nginx zone name: `"auth_rate_limit"`
- Rate limit: `5 requests per 900 seconds per IP`
- Confirmation that rejection is at nginx: application access log must NOT contain the 6th request

**Preconditions:**
- nginx is running with the rate limiting configuration deployed
- nginx access log and application access log are both available for comparison
- `limit_req_zone` is defined in the nginx configuration with the auth endpoints scoped

---

### T-1.2: nginx 429 response is returned before the request reaches the application
**Maps to:** AC-1
**Category:** edge-case

```gherkin
Feature: nginx Infrastructure Rate Limiting — Layer Enforcement

  Scenario: Rate-limited request is rejected at nginx layer without reaching application
    Given IP "198.51.100.10" has already sent 5 requests to "/auth/login" in the current window
    When a 6th request is sent from "198.51.100.10" to "/auth/login"
    Then the nginx error log records the rate-limited request
    And the application server access log does NOT record a request for this IP at this timestamp
    And the response is received in under 2ms (nginx rejection latency, not application latency)
```

**Test Data:**
- Source IP: `"198.51.100.10"`
- Window state: 5 prior requests in the last 900 seconds
- Expected nginx log entry: `limiting requests, excess: X by zone "auth_rate_limit"`
- Application log check: zero entries matching `"198.51.100.10"` for the 6th request timestamp

**Preconditions:**
- nginx access log and application server access log (e.g., Node.js, Express) are tailed separately
- Log timestamps have millisecond precision to distinguish nginx vs app layer

---

### T-2.1: nginx rate limiting configuration is version-controlled and code-reviewed
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: nginx Configuration Version Control

  Scenario: Rate limiting nginx configuration exists in the infrastructure repository with review evidence
    Given the nginx rate limiting configuration has been implemented
    When the infrastructure repository is inspected
    Then the file "nginx/conf.d/auth-rate-limit.conf" (or equivalent path) exists and is committed
    And the file contains the "limit_req_zone" directive for auth endpoints
    And the file contains the "limit_req" directives for each of the three auth location blocks
    And the git log for this file shows at least 2 unique author emails (author + reviewer approval)
    And no running nginx instance has rate limiting rules that do not exist in the repository
```

**Test Data:**
- Expected nginx config path: `nginx/conf.d/auth-rate-limit.conf` (or documented equivalent)
- Required directives: `["limit_req_zone", "limit_req zone=auth_rate_limit", "limit_req_status 429"]`
- PR review requirement: at least 1 reviewer approval in git/GitHub history
- Diff check: `nginx -T | grep limit_req` output must match what is in the repository

**Preconditions:**
- Infrastructure repository is accessible
- nginx is running on the target environment
- `nginx -T` (dump full config) is runnable to compare against repo

---

### T-3.1: 429 response includes Retry-After header and human-readable body
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: nginx 429 Response Format

  Scenario: nginx 429 response contains Retry-After header and consistent body
    Given IP "198.51.100.10" has exceeded the rate limit on "/auth/login"
    When the rate-limited request is received by nginx
    Then the HTTP response status is 429 Too Many Requests
    And the "Retry-After" header is present with a positive integer value representing seconds until window reset
    And the response body contains a human-readable message consistent with the RATE-01 application-layer message (e.g., "Too many requests. Try again after [timestamp].")
    And the Content-Type header is "application/json" (matching application-layer format)
```

**Test Data:**
- Source IP: `"198.51.100.10"` (rate limited)
- Expected headers: `{ "Retry-After": "<positive integer>", "Content-Type": "application/json" }`
- Expected body: `{ "error": "Too many requests", "message": "Too many requests. Try again after [UTC timestamp]." }`
- Consistency check: body format must match the application-layer 429 from RATE-01 (agreed per open question resolution)

**Preconditions:**
- nginx is configured with a custom 429 error page or proxy response
- The 429 message format has been agreed with the security team (open question resolved before implementation)

---

### T-4.1: Non-auth endpoints are not affected by auth rate limiting configuration
**Maps to:** AC-4
**Category:** boundary

```gherkin
Feature: nginx Rate Limiting Scope

  Scenario: Non-auth endpoint is not rate limited by auth nginx configuration
    Given IP "198.51.100.10" has already exhausted the auth rate limit (5 requests in window)
    When 20 rapid GET requests are sent from "198.51.100.10" to "/api/products"
    Then all 20 responses have status 200 OK (or whatever the normal product response is)
    And none of the 20 responses have status 429 from the auth rate limiting zone
    And nginx error log does not show "auth_rate_limit" limiting any "/api/products" request

  Scenario: Existing nginx behavior for non-auth routes is unchanged after config deployment
    Given the nginx config has been deployed with auth rate limiting
    When a GET request is sent to "/health" (health check endpoint)
    Then the response status is 200 OK
    And the response time is within the pre-deployment baseline (no added latency from auth rate limit zone)
```

**Test Data:**
- Rate-limited IP: `"198.51.100.10"` (exhausted auth limit)
- Non-auth endpoints: `["/api/products", "/health", "/api/users"]`
- Request count to non-auth: `20`
- Expected status for non-auth: `200 OK` for all 20

**Preconditions:**
- The auth rate limiting `limit_req` directive is ONLY present in the three auth location blocks
- Non-auth location blocks in nginx config do not reference the `auth_rate_limit` zone

---

### T-5.1: Rate limiting state persists across nginx graceful reload
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: nginx Rate Limiting State — Reload Persistence

  Scenario: Rate limiting counters survive nginx graceful reload
    Given IP "198.51.100.10" has sent 4 requests to "/auth/login" in the current 15-minute window (1 below threshold)
    And the shared memory zone "auth_rate_limit" is populated with this IP's counter
    When nginx is gracefully reloaded via "nginx -s reload"
    And a 5th request is sent from "198.51.100.10" immediately after reload completes
    And a 6th request is sent from "198.51.100.10"
    Then the 5th request receives 200 OK (or 401 for bad creds — not 429)
    And the 6th request receives 429 Too Many Requests
    And the counter was NOT reset by the reload (the shared memory zone persisted)
```

**Test Data:**
- Source IP: `"198.51.100.10"`
- Pre-reload counter: `4` requests in window
- nginx reload command: `nginx -s reload`
- Post-reload 6th request: must receive `429`
- nginx config directive: `limit_req_zone $binary_remote_addr zone=auth_rate_limit:10m rate=5r/15m`

**Preconditions:**
- nginx shared memory zone is configured with the `limit_req_zone` directive
- nginx is running with the auth rate limiting config active
- Test can measure the window reset time to ensure the 5th and 6th requests are within the same 15-minute window

---

## Negative / Security Tests

### T-6.1: X-Forwarded-For spoofing does not bypass nginx IP rate limiting
**Maps to:** AC-6
**Category:** security

```gherkin
Feature: nginx Rate Limiting — IP Spoofing Resistance

  Scenario: Forged X-Forwarded-For header does not change the rate limiting key
    Given IP "198.51.100.10" has exhausted the rate limit (5 requests in window)
    When a 6th request is sent from "198.51.100.10" with header "X-Forwarded-For: 10.0.0.1"
    Then the response status is 429 Too Many Requests
    And nginx used "$binary_remote_addr" (the TCP connection IP "198.51.100.10") as the rate limiting key
    And the rate limit for IP "10.0.0.1" is unaffected by this request
```

**Test Data:**
- Real TCP source IP (binary_remote_addr): `"198.51.100.10"` (rate-limited)
- Spoofed XFF header: `"X-Forwarded-For: 10.0.0.1"`
- Expected rate limiting key used: `"198.51.100.10"` (binary_remote_addr)
- Verification: nginx rate limit zone key is confirmed via nginx debug log or shared memory inspection

**Preconditions:**
- nginx is configured with `limit_req_zone $binary_remote_addr zone=auth_rate_limit:...` (NOT `$http_x_forwarded_for`)
- Test setup can inspect nginx shared memory zone contents or confirm via differential behavior

---

### T-6.2: Trusted proxy X-Forwarded-For is NOT used as rate limiting key
**Maps to:** AC-6
**Category:** security

```gherkin
Feature: nginx Rate Limiting — IP Source Key Validation

  Scenario: Rate limit key is always $binary_remote_addr regardless of proxy headers
    Given nginx is deployed behind a trusted load balancer at "10.0.0.2" that sets X-Forwarded-For
    And the load balancer sets "X-Forwarded-For: 203.0.113.99" for a real client request
    When 6 requests arrive from TCP source "10.0.0.2" with "X-Forwarded-For: 203.0.113.99"
    Then the rate limiting is tracked against "10.0.0.2" (binary_remote_addr), not "203.0.113.99"
    And if $binary_remote_addr is the load balancer IP, a note in the PR documents how the LB-to-app hop is handled (e.g., per-real-IP tracking at LB layer)
```

**Test Data:**
- Load balancer IP (binary_remote_addr): `"10.0.0.2"`
- Real client IP in XFF: `"203.0.113.99"`
- nginx zone key: must be `"10.0.0.2"` (not `"203.0.113.99"`)

**Preconditions:**
- Test environment simulates a load balancer sending XFF headers
- nginx config uses `$binary_remote_addr` exclusively for `limit_req_zone`
- PR documents the expected behavior when a trusted LB is in the path

---

### T-7.1: nginx reload using graceful reload command does not drop requests
**Maps to:** AC-7
**Category:** edge-case

```gherkin
Feature: nginx Configuration Deployment — Zero-Downtime

  Scenario: Applying new rate limiting config via graceful reload does not interrupt requests
    Given nginx is serving traffic normally with 100 requests/second to /api/products
    When "nginx -s reload" is executed to apply the rate limiting configuration
    Then all in-flight requests complete normally (no connection resets)
    And new requests received during and after reload are served correctly
    And no HTTP 502 or HTTP 503 responses appear in the error log during the reload
    And the reload procedure is documented in the PR description or a linked runbook
```

**Test Data:**
- Traffic during reload: `100 req/s` to `/api/products` (load test tool: k6 or wrk)
- Acceptable error rate during reload: `0%` (zero dropped requests)
- nginx reload command: `nginx -s reload` (NOT `nginx stop && nginx start`)
- Monitoring window: 5 seconds before + 5 seconds after reload

**Preconditions:**
- Load testing tool is running against a staging environment
- nginx version supports graceful reload (all nginx >= 0.7.53)
- Staging environment matches production nginx version

---

## Authorization Tests

### T-AUTH-1.1: nginx management/status endpoints are network-restricted or return 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: nginx Management API — Unauthenticated Access

  Scenario: nginx stub_status endpoint is not publicly accessible
    Given no authentication is provided
    When an HTTP GET is made to "/nginx_status" from a public IP address
    Then the response is either 401 Unauthorized or a TCP connection refusal (if network-restricted)
    And no nginx status metrics are returned to the public client

  Scenario: nginx stub_status is accessible from internal IPs only
    Given a request originates from internal IP "10.0.0.5"
    When an HTTP GET is made to "/nginx_status"
    Then the response returns nginx status information (200 OK)
    And the response is only accessible from the internal network range "10.0.0.0/8"
```

**Test Data:**
- Public test IP: `"198.51.100.10"` (external, should be blocked)
- Internal test IP: `"10.0.0.5"` (internal, should be allowed)
- nginx status endpoint: `/nginx_status` (or equivalent stub_status path)
- Expected public response: `401` or TCP refused
- Expected internal response: `200 OK` with `Active connections: N` content

**Preconditions:**
- nginx `stub_status` module is enabled (if status endpoint is in use)
- nginx `allow`/`deny` directives restrict `/nginx_status` to internal CIDR
- Test environment has a way to simulate both public and internal IP requests

---

### T-AUTH-2.1: Non-infrastructure-team members cannot merge nginx configuration changes
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: nginx Infrastructure Repository — Access Control

  Scenario: Developer without infrastructure team role cannot merge nginx config changes
    Given authenticated GitHub user "developer@example.com" is a collaborator with "write" access to the application repository
    And "developer@example.com" is NOT a member of the "infrastructure-team" GitHub team
    And a PR exists that modifies "nginx/conf.d/auth-rate-limit.conf"
    When "developer@example.com" attempts to approve the PR via the GitHub API
    Then the approval is recorded but the PR cannot be merged due to CODEOWNERS rules
    And the GitHub CODEOWNERS file specifies that "nginx/conf.d/*" requires review from "@org/infrastructure-team"
    And the GitHub branch protection rule requires at least 1 approval from CODEOWNERS

  Scenario: Developer without infrastructure team role cannot directly push to nginx config path
    Given "developer@example.com" has repository write access but is not in "infrastructure-team"
    When "developer@example.com" attempts to push a commit modifying "nginx/conf.d/auth-rate-limit.conf" directly to the main branch
    Then the push is rejected by branch protection rules
    And the error message indicates that the protected branch requires a PR with CODEOWNERS approval
```

**Test Data:**
- Unauthorized user: `{ github_username: "developer", teams: ["application-team"], NOT: ["infrastructure-team"] }`
- Authorized team: `"infrastructure-team"`
- Protected file path: `nginx/conf.d/auth-rate-limit.conf`
- CODEOWNERS entry: `nginx/conf.d/* @org/infrastructure-team`
- Expected push result: `"remote: error: GH006: Protected branch update failed"`

**Preconditions:**
- Infrastructure repository has branch protection enabled on `main`
- CODEOWNERS file exists and specifies `nginx/conf.d/*` ownership
- GitHub team `"infrastructure-team"` exists with defined membership
- `"developer@example.com"` is NOT a member of `"infrastructure-team"`

---


# Test Specifications: Batch 02 of 6 — MFA-01 through MFA-04

---

# Test Specifications: MFA-01 — TOTP Enrollment for End Users

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2, T-2.3 | happy-path, error-handling |
| AC-3 | T-3.1, T-3.2 | security |
| AC-4 | T-4.1, T-4.2, T-4.3 | edge-case |
| AC-5 | T-5.1, T-5.2, T-5.3 | edge-case |
| AC-6 | T-6.1, T-6.2 | happy-path |
| AC-7 | T-7.1, T-7.2 | edge-case |
| AC-8 | T-8.1, T-8.2 | security |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |
| NFR: Input validation | T-NFR-1.1, T-NFR-1.2 | boundary |
| NFR: AWS SM unavailable | T-NFR-2.1 | error-handling |
| NFR: DB write failure | T-NFR-3.1 | error-handling |
| NFR: Session expiry during confirm | T-NFR-4.1 | edge-case |

---

## Test Cases

### T-1.1: Enrollment page displays QR code and plaintext secret
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: TOTP Enrollment for End Users

  Background:
    Given the following user exists in the system:
      | field           | value                          |
      | user_id         | usr_abc123                     |
      | email           | alice@example.com              |
      | status          | active                         |
      | totp_enrolled   | false                          |
    And the user is authenticated with a valid session token

  Scenario: QR code and plaintext secret are displayed on enrollment initiation
    Given the authenticated user navigates to "Security Settings > Set Up Authenticator App"
    When they initiate TOTP enrollment by clicking "Set Up"
    Then the system generates a TOTP secret of at least 20 bytes (160 bits) of cryptographically random data
    And a QR code is displayed conforming to the otpauth:// URI scheme
    And the QR code URI has the format "otpauth://totp/{issuer}:{alice@example.com}?secret={BASE32_SECRET}&issuer={issuer}"
    And the plaintext TOTP secret is displayed in groups of 4 characters (e.g., "ABCD EFGH IJKL MNOP QRST")
    And the QR code is scannable by Google Authenticator
    And the QR code is scannable by Authy
    And the HTTP response header "Cache-Control" equals "no-store"
```

**Test Data:**
- `user_id`: `usr_abc123`
- `email`: `alice@example.com`
- Authenticator apps for validation: Google Authenticator v5+, Authy v3+
- Expected secret format: BASE32-encoded string, displayed in groups of 4 with spaces

**Preconditions:**
- User `usr_abc123` exists with `totp_enrolled = false`
- User has an active authenticated session (`session_token = "tok_valid_alice"`)
- AWS Secrets Manager is available and responding
- `mfa_enrollments` table exists (INFRA-AUTH-01 satisfied)

---

### T-1.2: Enrollment page sets no-store cache control header
**Maps to:** AC-1
**Category:** security

```gherkin
  Scenario: Enrollment page sets Cache-Control no-store header
    Given the authenticated user navigates to "Security Settings > Set Up Authenticator App"
    When they initiate TOTP enrollment
    Then the HTTP response header "Cache-Control" equals "no-store"
    And the HTTP response header does not contain "public" or "max-age"
    And the QR code and plaintext secret are not present in any access log entry
```

**Test Data:**
- Same as T-1.1
- HTTP response header inspection via proxy or test HTTP client

**Preconditions:**
- Same as T-1.1

---

### T-2.1: Valid TOTP code confirms enrollment
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: User submits valid TOTP code and enrollment is activated
    Given the authenticated user has initiated TOTP enrollment
    And the system has generated and displayed a TOTP secret with value "JBSWY3DPEHPK3PXP" (test secret)
    And the user has added the secret to their authenticator app
    When the user submits the current valid 6-digit TOTP code "123456" generated by the authenticator for the current 30-second window
    Then the system returns HTTP 200
    And a record is inserted into "mfa_enrollments" with:
      | field       | value         |
      | user_id     | usr_abc123    |
      | method      | totp          |
      | status      | active        |
    And the stored secret in "mfa_enrollments" is ciphertext (not equal to "JBSWY3DPEHPK3PXP")
    And the UI displays a success confirmation message
```

**Test Data:**
- `user_id`: `usr_abc123`
- TOTP secret (test): `JBSWY3DPEHPK3PXP` (known test vector)
- Valid TOTP code: generated at test runtime using the test secret and current Unix epoch
- Enrollment confirmation endpoint: `POST /auth/mfa/totp/confirm`
- Request body: `{ "code": "123456", "enrollment_session_id": "enroll_sess_abc" }`

**Preconditions:**
- User has an active session
- Enrollment has been initiated; `enrollment_session_id` is active
- The TOTP secret has been generated but not yet persisted as active

---

### T-2.2: Invalid TOTP code returns error without activating enrollment
**Maps to:** AC-2
**Category:** error-handling

```gherkin
  Scenario: User submits wrong TOTP code — enrollment is not activated
    Given the authenticated user has initiated TOTP enrollment
    And the system has generated a TOTP secret
    When the user submits an incorrect 6-digit TOTP code "000000"
    Then the system returns HTTP 422 (or HTTP 400 per implementation)
    And the response body contains "Incorrect code. Please check your authenticator app and try again."
    And no record is inserted into "mfa_enrollments" with status "active" for user "usr_abc123"
    And the user is still on the enrollment confirmation screen
```

**Test Data:**
- Incorrect TOTP code: `000000` (guaranteed invalid for test secret `JBSWY3DPEHPK3PXP` at known test time)
- Request body: `{ "code": "000000", "enrollment_session_id": "enroll_sess_abc" }`

**Preconditions:**
- Same as T-2.1

---

### T-2.3: TOTP code from a window more than 30 seconds outside current window is rejected
**Maps to:** AC-2, AC-4
**Category:** edge-case

```gherkin
  Scenario: TOTP code from 2 windows ago is rejected
    Given the authenticated user has initiated TOTP enrollment
    And the system has generated a TOTP secret
    When the user submits a valid TOTP code generated 2 windows (60 seconds) in the past
    Then the system returns an error response
    And the response body contains "Incorrect code. Please check your authenticator app and try again."
    And enrollment is not activated
```

**Test Data:**
- Stale TOTP code: generated using test secret at `current_unix_epoch - 60` seconds
- This code is outside the ±1 window tolerance

**Preconditions:**
- Same as T-2.1

---

### T-3.1: TOTP secret is stored encrypted, not in plaintext
**Maps to:** AC-3
**Category:** security

```gherkin
  Scenario: Stored TOTP secret in mfa_enrollments is ciphertext
    Given a user with id "usr_abc123" has completed TOTP enrollment with known secret "JBSWY3DPEHPK3PXP"
    When the "mfa_enrollments" table is queried directly for user "usr_abc123"
    Then the "totp_secret" column value does not equal "JBSWY3DPEHPK3PXP"
    And the "totp_secret" column value is not the BASE32 representation of the raw secret
    And the "totp_secret" column value is ciphertext (AES-256 encrypted)
    And the encryption key is not present in the "mfa_enrollments" table
    And the encryption key is not present in any application configuration file on disk
```

**Test Data:**
- `user_id`: `usr_abc123`
- Raw secret: `JBSWY3DPEHPK3PXP`
- Expected: `totp_secret` column ≠ `JBSWY3DPEHPK3PXP` and ≠ any plaintext variant

**Preconditions:**
- Enrollment completed successfully for `usr_abc123`
- Direct database read access available in test environment

---

### T-3.2: TOTP secret encryption key is stored in AWS Secrets Manager only
**Maps to:** AC-3
**Category:** security

```gherkin
  Scenario: Encryption key for TOTP secrets is only in AWS Secrets Manager
    Given a TOTP enrollment has been persisted for user "usr_abc123"
    When the application configuration files, environment variables, and database schema are inspected
    Then no AES-256 encryption key material appears in:
      | location                       |
      | .env files                     |
      | application config YAML/JSON   |
      | mfa_enrollments table columns  |
      | any other database table       |
    And the encryption key is retrievable only via the AWS Secrets Manager ARN configured for TOTP key storage
```

**Test Data:**
- Environment: test/staging with real AWS Secrets Manager integration
- AWS Secrets Manager secret ARN: configured in test environment

**Preconditions:**
- AWS Secrets Manager contains the TOTP encryption key
- Application deployed with Secrets Manager integration enabled

---

### T-4.1: TOTP code from previous window (−30 seconds) is accepted
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: TOTP code from the immediately preceding 30-second window is accepted
    Given a user with id "usr_abc123" has an active TOTP enrollment with secret "JBSWY3DPEHPK3PXP"
    And the server clock is synchronized
    When the user submits a TOTP code generated for the window at "current_unix_epoch - 30" seconds
    Then the system returns HTTP 200 (success)
    And authentication proceeds as if the current-window code was used
```

**Test Data:**
- TOTP code: generated at `floor(current_unix_epoch / 30) * 30 - 30` (previous window)
- This represents a device clock that is up to 30 seconds behind

**Preconditions:**
- `usr_abc123` has an active TOTP enrollment
- Server clock is accurate (NTP synchronized)

---

### T-4.2: TOTP code from next window (+30 seconds) is accepted
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: TOTP code from the immediately following 30-second window is accepted
    Given a user with id "usr_abc123" has an active TOTP enrollment with secret "JBSWY3DPEHPK3PXP"
    When the user submits a TOTP code generated for the window at "current_unix_epoch + 30" seconds
    Then the system returns HTTP 200 (success)
    And authentication proceeds normally
```

**Test Data:**
- TOTP code: generated at `floor(current_unix_epoch / 30) * 30 + 30` (next window)
- This represents a device clock that is up to 30 seconds ahead

**Preconditions:**
- Same as T-4.1

---

### T-4.3: TOTP code from 2 windows outside current is rejected
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: TOTP code from a window 60 seconds in the past is rejected
    Given a user with id "usr_abc123" has an active TOTP enrollment
    When the user submits a TOTP code generated for the window at "current_unix_epoch - 60" seconds
    Then the system returns an error
    And no session token is issued
    And the error message is "Incorrect code. Please check your authenticator app and try again."
```

**Test Data:**
- TOTP code generated at `floor(current_unix_epoch / 30) * 30 - 60`

**Preconditions:**
- Same as T-4.1

---

### T-5.1: Re-enrollment requires re-authentication (password prompt shown)
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: User with active TOTP tries to enroll a new device — password required
    Given a user with id "usr_abc123" has an active TOTP enrollment
    When they navigate to "Security Settings > Set Up Authenticator App"
    Then the system does not immediately show a new QR code
    And the system presents a password re-authentication prompt
    And no new TOTP secret is generated until re-authentication succeeds
```

**Test Data:**
- `user_id`: `usr_abc123`
- Existing `mfa_enrollments` record: `{ method: "totp", status: "active" }`

**Preconditions:**
- `usr_abc123` has `totp_enrolled = true` with an active `mfa_enrollments` row
- User has an active authenticated session

---

### T-5.2: Re-enrollment with correct password replaces old TOTP secret
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: Successful re-enrollment deactivates old secret and activates new one
    Given a user with id "usr_abc123" has an active TOTP enrollment with secret "OLDSECRET1111111"
    And the user has re-authenticated successfully with password "CorrectPassword123!"
    And a new QR code has been displayed with secret "NEWSECRET2222222"
    When the user confirms the new enrollment by submitting a valid TOTP code for "NEWSECRET2222222"
    Then the old enrollment record for "OLDSECRET1111111" has status "inactive"
    And a new enrollment record exists with status "active" for the new secret
    And submitting a TOTP code valid for "OLDSECRET1111111" is rejected
    And an event is written to "auth_audit_log" with:
      | field        | value            |
      | event_type   | mfa_reenrolled   |
      | user_id      | usr_abc123       |
      | mfa_method   | totp             |
```

**Test Data:**
- Old secret: `OLDSECRET1111111` (test vector)
- New secret: `NEWSECRET2222222` (test vector)
- Password: `CorrectPassword123!`

**Preconditions:**
- `usr_abc123` has existing active TOTP enrollment
- Re-authentication step has been passed

---

### T-5.3: Re-enrollment with wrong password is blocked
**Maps to:** AC-5
**Category:** error-handling

```gherkin
  Scenario: Wrong password during re-enrollment rejects re-auth and no new QR is shown
    Given a user with id "usr_abc123" has an active TOTP enrollment
    When they attempt re-authentication with password "WrongPassword!"
    Then re-authentication fails with "Incorrect password."
    And no new TOTP secret is generated
    And the existing enrollment remains active
```

**Test Data:**
- Incorrect password: `WrongPassword!`

**Preconditions:**
- `usr_abc123` has existing active TOTP enrollment

---

### T-6.1: Successful enrollment writes audit log event
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Audit log entry created on successful TOTP enrollment
    Given a user with id "usr_abc123" has initiated TOTP enrollment
    When they confirm enrollment with a valid TOTP code
    Then a record is written to "auth_audit_log" containing:
      | field           | value          |
      | event_type      | mfa_enrolled   |
      | user_id         | usr_abc123     |
      | organization_id | org_xyz789     |
      | mfa_method      | totp           |
    And the "created_at" field is a valid UTC timestamp within 5 seconds of now
```

**Test Data:**
- `user_id`: `usr_abc123`
- `organization_id`: `org_xyz789`

**Preconditions:**
- `usr_abc123` belongs to org `org_xyz789`
- `auth_audit_log` table exists and is writable

---

### T-6.2: Audit log write failure does not roll back enrollment
**Maps to:** AC-6
**Category:** error-handling

```gherkin
  Scenario: Enrollment commits even if audit log write fails
    Given a user with id "usr_abc123" has confirmed a valid TOTP enrollment
    And the "auth_audit_log" write is configured to fail (simulated via fault injection)
    When enrollment is processed
    Then the enrollment record is committed to "mfa_enrollments" with status "active"
    And an application error is written to the internal error log (not the audit log)
    And the user sees a successful enrollment confirmation (not a failure)
```

**Test Data:**
- Fault injection: `auth_audit_log` write returns an error
- Test method: mock or DB trigger to force write failure

**Preconditions:**
- Fault injection capability available in test environment

---

### T-7.1: Incomplete enrollment (browser closed) does not activate MFA
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: User navigates away before confirming TOTP — MFA is not enforced
    Given a user with id "usr_abc123" has initiated TOTP enrollment (QR code displayed)
    When the user closes the browser tab without submitting a confirmation code
    And 10 minutes elapse
    Then logging in as "usr_abc123" does not trigger a TOTP challenge
    And no active record exists in "mfa_enrollments" for "usr_abc123" with method "totp"
    And the partial TOTP secret is not recoverable from the system
```

**Test Data:**
- `user_id`: `usr_abc123`
- Elapsed time: 10 minutes (simulated via test clock or environment variable)

**Preconditions:**
- `usr_abc123` has no existing active TOTP enrollment

---

### T-7.2: Fresh enrollment can be started after incomplete enrollment expires
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: User can start a new enrollment after a previous incomplete attempt expired
    Given a user with id "usr_abc123" had an incomplete TOTP enrollment that expired 15 minutes ago
    When they navigate to "Security Settings > Set Up Authenticator App" and initiate enrollment again
    Then the system generates a new TOTP secret
    And a new QR code is displayed
    And the enrollment flow proceeds normally
```

**Test Data:**
- `user_id`: `usr_abc123`
- Previous incomplete enrollment: created > 10 minutes ago, never confirmed

**Preconditions:**
- No active or pending unexpired enrollment session exists

---

### T-8.1: QR code and secret are not written to any log
**Maps to:** AC-8
**Category:** security

```gherkin
  Scenario: TOTP secret is absent from application logs and access logs
    Given a user initiates TOTP enrollment
    When the QR code and plaintext secret are served to the user
    Then the application log files do not contain the plaintext TOTP secret value
    And the web server access log does not contain the TOTP secret value
    And the TOTP secret is not present in any HTTP response body after the enrollment confirmation step
```

**Test Data:**
- Log file paths: application log at configured path, access log at configured path
- Secret value: captured during test setup for assertion

**Preconditions:**
- Log inspection access in test environment
- Enrollment flow executed with log capture enabled

---

### T-8.2: Secret is absent from API responses after confirmation
**Maps to:** AC-8
**Category:** security

```gherkin
  Scenario: TOTP secret is not returned in any API response after enrollment confirmation
    Given a user has successfully confirmed TOTP enrollment
    When the user calls "GET /auth/mfa/status" or any related authenticated endpoint
    Then the response body does not contain the TOTP secret value
    And the response body does not contain any QR code data URL that would expose the secret
```

**Test Data:**
- Endpoint: `GET /auth/mfa/status`
- Secret value: captured during enrollment for assertion

**Preconditions:**
- `usr_abc123` has completed enrollment

---

## Negative / Authorization Tests

### T-AUTH-1.1: Unauthenticated request to enroll endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security (P0)

```gherkin
  Scenario: No session token — enrollment endpoint returns 401
    Given no authentication token is present in the request
    When a POST request is made to "/auth/mfa/totp/enroll" with body:
      """
      {}
      """
    Then the system returns HTTP 401 Unauthorized
    And the response body contains "Unauthorized" or "Authentication required"
    And no TOTP secret is generated
    And no enrollment session is created
```

**Test Data:**
- Request: `POST /auth/mfa/totp/enroll` with no `Authorization` header and no session cookie

**Preconditions:**
- No active session

---

### T-AUTH-2.1: Organization-disabled MFA enrollment returns 403
**Maps to:** AC-AUTH-2
**Category:** security (P0)

```gherkin
  Scenario: User in org with MFA enrollment disabled receives 403
    Given a user with id "usr_def456" belongs to organization "org_noenroll"
    And organization "org_noenroll" has MFA enrollment administratively disabled via an org policy flag
    And the user is authenticated with a valid session
    When they make a POST request to "/auth/mfa/totp/enroll"
    Then the system returns HTTP 403 Forbidden
    And the response body contains "MFA enrollment is managed by your organization administrator"
    And no TOTP secret is generated
```

**Test Data:**
- `user_id`: `usr_def456`
- `organization_id`: `org_noenroll`
- Org policy: `{ mfa_enrollment_disabled: true }`

**Preconditions:**
- Org-level enrollment toggle exists (POLICY-01 implemented); if not, mark this test as deferred per AC-AUTH-2 note

---

### T-AUTH-2.2: Voluntary enrollment org (no policy restriction) — 403 not triggered
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: User in org without enrollment restriction can proceed to enroll
    Given a user with id "usr_abc123" belongs to organization "org_voluntary"
    And organization "org_voluntary" has no MFA enrollment restriction
    And the user is authenticated
    When they make a POST request to "/auth/mfa/totp/enroll"
    Then the system returns HTTP 200 (or initiates the enrollment flow)
    And the enrollment page is rendered with a QR code
```

**Test Data:**
- `user_id`: `usr_abc123`
- `organization_id`: `org_voluntary`
- Org policy: no `mfa_enrollment_disabled` flag set

**Preconditions:**
- `org_voluntary` has no enrollment restriction policy

---

## Boundary Tests

### T-NFR-1.1: TOTP confirmation code must be exactly 6 digits
**Maps to:** NFR Input validation
**Category:** boundary

```gherkin
  Scenario Outline: Non-6-digit or non-numeric confirmation codes are rejected with 400
    Given a user has initiated TOTP enrollment
    When they submit "<code>" as the confirmation code
    Then the system returns HTTP 400 Bad Request
    And the error message indicates invalid input format
    And no enrollment attempt is counted against rate limits

    Examples:
      | code        | reason                  |
      | 12345       | 5 digits                |
      | 1234567     | 7 digits                |
      | 12345A      | contains a letter       |
      | 123 456     | contains a space        |
      |             | empty string            |
      | 123456.7    | contains decimal        |
```

**Test Data:**
- Enrollment session: active

**Preconditions:**
- Active enrollment session exists

---

### T-NFR-1.2: TOTP secret must be at least 20 bytes (160 bits)
**Maps to:** NFR Security — TOTP secret strength
**Category:** boundary

```gherkin
  Scenario: Generated TOTP secret meets minimum entropy requirement
    Given a user initiates TOTP enrollment
    When the system generates a TOTP secret
    Then the raw secret is at least 20 bytes (160 bits) in length
    And the secret is generated using a cryptographically secure random number generator
    And the BASE32-encoded representation has at least 32 characters (ceiling of 160/5)
```

**Test Data:**
- Verified via introspection of generated secret length before display

**Preconditions:**
- Test environment allows inspection of generated secret length

---

### T-NFR-2.1: AWS Secrets Manager unavailable during enrollment returns 503
**Maps to:** NFR Error handling
**Category:** error-handling

```gherkin
  Scenario: Enrollment fails gracefully when AWS Secrets Manager is unavailable
    Given the AWS Secrets Manager endpoint is unreachable (simulated via network fault injection)
    And a user with id "usr_abc123" initiates TOTP enrollment
    When the system attempts to retrieve the encryption key
    Then the system returns HTTP 503 Service Unavailable
    And the response body contains "Service temporarily unavailable"
    And no partial TOTP secret is stored in "mfa_enrollments"
    And the user is prompted to try again
```

**Test Data:**
- Fault injection: block outbound traffic to AWS Secrets Manager endpoint

**Preconditions:**
- Network fault injection capability in test environment

---

### T-NFR-3.1: Database write failure rolls back enrollment transaction
**Maps to:** NFR Error handling
**Category:** error-handling

```gherkin
  Scenario: DB write failure during enrollment triggers rollback
    Given a user with id "usr_abc123" has confirmed a valid TOTP enrollment code
    And the database write to "mfa_enrollments" is configured to fail after secret generation
    When the enrollment transaction is processed
    Then the transaction is rolled back
    And no partial enrollment record exists in "mfa_enrollments" for "usr_abc123"
    And the generated TOTP secret is discarded
    And the user sees a generic error message
    And the user can retry enrollment
```

**Test Data:**
- Fault injection: force DB write failure for `mfa_enrollments` insert

**Preconditions:**
- Fault injection capability for DB writes in test environment

---

### T-NFR-4.1: Submitting confirmation after 10-minute session expiry fails
**Maps to:** NFR Error handling
**Category:** edge-case

```gherkin
  Scenario: Enrollment confirmation code rejected after enrollment session expires
    Given a user with id "usr_abc123" has initiated TOTP enrollment 11 minutes ago
    And the enrollment session has expired
    When the user submits any TOTP code as a confirmation
    Then the system returns an error response
    And the response body contains "Session expired" or equivalent
    And the user must restart the enrollment flow from the beginning
    And no enrollment is activated
```

**Test Data:**
- Elapsed time: 11 minutes past enrollment initiation (simulated via clock manipulation)

**Preconditions:**
- Test environment supports time manipulation or short session TTL override

---

---

# Test Specifications: MFA-02 — TOTP Login Challenge Flow

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1, T-3.2 | error-handling |
| AC-4 | T-4.1, T-4.2 | security |
| AC-5 | T-5.1, T-5.2 | security |
| AC-6 | T-6.1 | edge-case |
| AC-7 | T-7.1 | happy-path |
| AC-8 | T-8.1, T-8.2 | happy-path |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |
| NFR: AWS SM unavailable | T-NFR-1.1 | error-handling |
| NFR: Redis unavailable | T-NFR-2.1 | error-handling |
| NFR: Account deleted mid-challenge | T-NFR-3.1 | error-handling |
| NFR: Input validation | T-NFR-4.1 | boundary |
| NFR: Challenge token single-use | T-NFR-5.1 | security |

---

## Test Cases

### T-1.1: TOTP challenge presented after valid credentials
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: TOTP Login Challenge Flow

  Background:
    Given the following user exists:
      | field           | value                    |
      | user_id         | usr_mfa_totp_01          |
      | email           | bob@example.com          |
      | password_hash   | bcrypt("Password456!")   |
      | totp_enrolled   | true                     |
      | organization_id | org_xyz789               |
    And the user has an active TOTP enrollment with secret "JBSWY3DPEHPK3PXP"

  Scenario: Valid credentials trigger TOTP challenge — no session issued yet
    Given no active session exists for user "usr_mfa_totp_01"
    When a POST request is made to "/auth/login" with body:
      """
      { "email": "bob@example.com", "password": "Password456!" }
      """
    Then the system returns HTTP 200 with body:
      """
      {
        "mfa_required": true,
        "mfa_method": "totp",
        "challenge_token": "<non-null short-lived token>"
      }
      """
    And no session token or httpOnly cookie is issued in this response
    And the challenge_token is valid for exactly 10 minutes
    And the UI renders the TOTP code entry screen
```

**Test Data:**
- `email`: `bob@example.com`
- `password`: `Password456!`
- Login endpoint: `POST /auth/login`

**Preconditions:**
- `usr_mfa_totp_01` has active TOTP enrollment
- No active session for this user

---

### T-1.2: Incorrect credentials do not trigger MFA challenge
**Maps to:** AC-1
**Category:** error-handling

```gherkin
  Scenario: Wrong password — TOTP challenge is not presented
    Given no active session exists for user "usr_mfa_totp_01"
    When a POST request is made to "/auth/login" with body:
      """
      { "email": "bob@example.com", "password": "WrongPassword!" }
      """
    Then the system returns HTTP 401 Unauthorized
    And no "mfa_required" field is present in the response
    And no challenge_token is issued
```

**Test Data:**
- `password`: `WrongPassword!`

**Preconditions:**
- Same as T-1.1

---

### T-2.1: Correct TOTP code issues session token and logs success
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: User submits correct TOTP code — session issued and audit logged
    Given the user "usr_mfa_totp_01" has received a valid challenge_token "ch_tok_abc123"
    And the challenge_token was issued 2 minutes ago (within validity window)
    When a POST request is made to "/auth/mfa/challenge" with body:
      """
      {
        "challenge_token": "ch_tok_abc123",
        "code": "<valid_current_window_totp_code>"
      }
      """
    Then the system returns HTTP 200
    And a session token is set in an httpOnly cookie named "session"
    And the user is redirected to the post-login destination URL
    And a record is written to "auth_audit_log" with:
      | field           | value                  |
      | event_type      | mfa_challenge_success  |
      | user_id         | usr_mfa_totp_01        |
      | organization_id | org_xyz789             |
      | mfa_method      | totp                   |
    And the "created_at" field is a valid UTC timestamp
```

**Test Data:**
- `challenge_token`: `ch_tok_abc123`
- TOTP code: generated at test runtime from secret `JBSWY3DPEHPK3PXP`
- MFA challenge endpoint: `POST /auth/mfa/challenge`

**Preconditions:**
- `ch_tok_abc123` is a valid, unexpired challenge token for `usr_mfa_totp_01`
- Redis is available for replay tracking

---

### T-3.1: Invalid TOTP code returns error without session
**Maps to:** AC-3
**Category:** error-handling

```gherkin
  Scenario: Wrong TOTP code — error shown, no session, failure counted
    Given the user "usr_mfa_totp_01" has a valid challenge_token "ch_tok_abc123"
    And no prior failed attempts exist for this account/IP
    When a POST request is made to "/auth/mfa/challenge" with body:
      """
      { "challenge_token": "ch_tok_abc123", "code": "000000" }
      """
    Then the system returns HTTP 422 (or 400 per implementation)
    And the response body contains "Incorrect code. Please try again."
    And the response body contains the remaining attempt count (e.g., "4 attempts remaining")
    And no session token or httpOnly cookie is issued
    And the failure count for "usr_mfa_totp_01" increments by 1 in the rate limit store
```

**Test Data:**
- Incorrect TOTP code: `000000`
- Rate limit store: Redis key pattern `rate:mfa:{user_id}` or `rate:mfa:{ip}`

**Preconditions:**
- Challenge token is valid
- Failure count for `usr_mfa_totp_01` is 0

---

### T-3.2: Fifth failed TOTP attempt triggers rate limit lockout
**Maps to:** AC-3, AC-5
**Category:** error-handling

```gherkin
  Scenario: 5th consecutive failed TOTP attempt triggers lockout per RATE-01
    Given the user "usr_mfa_totp_01" has 4 prior failed TOTP challenge attempts
    And a valid challenge_token "ch_tok_abc123" exists
    When a POST request is made to "/auth/mfa/challenge" with body:
      """
      { "challenge_token": "ch_tok_abc123", "code": "000000" }
      """
    Then the system returns HTTP 429 Too Many Requests
    And the response body contains the lockout message and 15-minute countdown
    And the challenge_token "ch_tok_abc123" is invalidated immediately
    And no session is issued
    And an event is written to "auth_audit_log" with event_type "mfa_challenge_failure"
```

**Test Data:**
- Prior failure count: 4 (seeded in Redis before test)
- Incorrect code: `000000`
- Expected lockout duration: 15 minutes

**Preconditions:**
- Redis contains 4 prior failures for `usr_mfa_totp_01`
- Challenge token is still valid

---

### T-4.1: TOTP code replay within same window is rejected
**Maps to:** AC-4
**Category:** security

```gherkin
  Scenario: Same TOTP code submitted twice in one window — second is rejected
    Given the user "usr_mfa_totp_01" has successfully submitted a TOTP code "654321" for window T
    And the challenge was completed (session issued)
    And 5 seconds have elapsed (still within window T)
    When the code "654321" is submitted again via a new challenge flow for any user session
    Then the system returns an error
    And the response body contains "Code already used. Please wait for your app to show a new code."
    And no second session is issued
    And the Redis key "{usr_mfa_totp_01}:{window_T_timestamp}" exists with TTL ≤ 90 seconds
```

**Test Data:**
- Code: `654321` (captured from first submission)
- Window timestamp: `floor(current_unix_epoch / 30) * 30`
- Redis key TTL: 90 seconds

**Preconditions:**
- First submission successfully completed; code `654321` is now in the replay store
- Redis is available

---

### T-4.2: Redis key for replay prevention has correct TTL (90 seconds)
**Maps to:** AC-4
**Category:** security

```gherkin
  Scenario: Redis TTL for used TOTP window is exactly 90 seconds
    Given a user "usr_mfa_totp_01" has just submitted a valid TOTP code for window timestamp "1718000000"
    When the Redis key "{usr_mfa_totp_01}:1718000000" is inspected
    Then the TTL of the key is between 85 and 90 seconds (allowing for processing time)
    And the key exists for both the current window and adjacent tolerance windows
```

**Test Data:**
- Redis key pattern: `{user_id}:{totp_window_timestamp}`
- Window timestamp: deterministic based on `floor(unix_epoch / 30) * 30`

**Preconditions:**
- Redis available with inspection access in test environment

---

### T-5.1: Lockout after 5 failures — account locked for 15 minutes
**Maps to:** AC-5
**Category:** security

```gherkin
  Scenario: After lockout, all TOTP submissions return 429 for 15 minutes
    Given the user "usr_mfa_totp_01" is locked out due to 5 failed attempts
    When any TOTP code is submitted during the 15-minute lockout window
    Then the system returns HTTP 429
    And the response body contains the lockout end time or remaining lockout duration
    And the challenge_token is not valid for further submissions
```

**Test Data:**
- Lockout state: seeded via 5 failed attempts in Redis

**Preconditions:**
- Redis contains lockout record for `usr_mfa_totp_01`

---

### T-5.2: Challenge token invalidated immediately upon lockout
**Maps to:** AC-5
**Category:** security

```gherkin
  Scenario: Challenge token is invalidated on rate limit lockout trigger
    Given the user "usr_mfa_totp_01" has 4 prior failures and challenge_token "ch_tok_abc123"
    When the 5th failed attempt triggers lockout
    Then attempting to use "ch_tok_abc123" for any subsequent submission
    Returns HTTP 401 (token expired/invalid)
    And the lockout message is displayed regardless of the code submitted
```

**Test Data:**
- `challenge_token`: `ch_tok_abc123`

**Preconditions:**
- 4 prior failures seeded; token is still technically within its 10-minute window

---

### T-6.1: Expired challenge token returns 401
**Maps to:** AC-6
**Category:** edge-case

```gherkin
  Scenario: TOTP submission with an expired challenge token returns 401
    Given the user "usr_mfa_totp_01" was issued challenge_token "ch_tok_expired" 11 minutes ago
    And the token has expired
    When a POST request is made to "/auth/mfa/challenge" with body:
      """
      {
        "challenge_token": "ch_tok_expired",
        "code": "<valid_totp_code>"
      }
      """
    Then the system returns HTTP 401 Unauthorized
    And the response body contains "Session expired. Please log in again."
    And no session is issued
    And the user must restart the login flow
```

**Test Data:**
- `challenge_token`: `ch_tok_expired` (issued 11 minutes ago, TTL = 10 minutes)
- TOTP code: genuinely valid for current window (to confirm token expiry — not code validity — is causing the rejection)

**Preconditions:**
- Token has elapsed past 10-minute TTL

---

### T-7.1: Recovery code link visible on TOTP challenge screen
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: Recovery code link is visible on TOTP challenge screen without scrolling
    Given the user "usr_mfa_totp_01" is on the TOTP challenge screen
    When the page is rendered at viewport width 375px
    Then a link labeled "Use a recovery code instead" is visible without scrolling
    And clicking the link navigates to the recovery code entry flow
    And the link is accessible to screen readers (has descriptive aria-label or text content)
```

**Test Data:**
- Viewport: 375px × 667px (iPhone SE)
- Accessibility tool: axe-core or equivalent

**Preconditions:**
- TOTP challenge screen is rendered (challenge_token is valid)

---

### T-8.1: Successful TOTP challenge is written to audit log
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: Successful TOTP challenge event is logged with all required fields
    Given the user "usr_mfa_totp_01" has submitted a correct TOTP code
    When the challenge succeeds and session is issued
    Then a record exists in "auth_audit_log" with:
      | field           | value                  |
      | event_type      | mfa_challenge_success  |
      | user_id         | usr_mfa_totp_01        |
      | organization_id | org_xyz789             |
      | mfa_method      | totp                   |
      | ip_address      | 203.0.113.42           |
    And the "created_at" field is in UTC format
```

**Test Data:**
- Simulated IP: `203.0.113.42` (TEST-NET-3 documentation range)

**Preconditions:**
- Audit log table is writable

---

### T-8.2: Failed TOTP challenge is written to audit log
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: Failed TOTP challenge event is logged with all required fields
    Given the user "usr_mfa_totp_01" has submitted an incorrect TOTP code
    When the challenge fails
    Then a record exists in "auth_audit_log" with:
      | field           | value                    |
      | event_type      | mfa_challenge_failure    |
      | user_id         | usr_mfa_totp_01          |
      | organization_id | org_xyz789               |
      | mfa_method      | totp                     |
      | ip_address      | 203.0.113.42             |
    And the "created_at" field is in UTC format
```

**Test Data:**
- Same as T-8.1

**Preconditions:**
- Audit log table is writable

---

## Negative / Authorization Tests

### T-AUTH-1.1: No challenge token — challenge endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security (P0)

```gherkin
  Scenario: Direct POST to MFA challenge endpoint without a challenge token returns 401
    Given no challenge_token is provided
    When a POST request is made to "/auth/mfa/challenge" with body:
      """
      { "code": "123456" }
      """
    Then the system returns HTTP 401 Unauthorized
    And the response body does not contain any session token
    And no audit log entry is created for this request (or it is logged as unauthorized attempt)
```

**Test Data:**
- Request: `POST /auth/mfa/challenge` with no `challenge_token` field
- Code: `123456` (valid format, but no token context)

**Preconditions:**
- No active session or challenge token

---

### T-AUTH-2.1: Authenticated user with active session submitting TOTP returns 403
**Maps to:** AC-AUTH-2
**Category:** security (P0)

```gherkin
  Scenario: Fully authenticated user cannot submit TOTP code outside of active challenge
    Given the user "usr_mfa_totp_01" has a fully authenticated session (MFA already completed)
    When a POST request is made to "/auth/mfa/challenge" with body:
      """
      { "code": "654321" }
      """
    And the request includes the user's active session cookie
    Then the system returns HTTP 403 Forbidden
    And the response body indicates "No active MFA challenge" or similar
    And the existing session is not modified
```

**Test Data:**
- Active session cookie: `session=valid_full_session_tok`
- Code: `654321`

**Preconditions:**
- `usr_mfa_totp_01` has a fully authenticated session (both credential and MFA steps complete)

---

## Boundary / Error Handling Tests

### T-NFR-1.1: AWS Secrets Manager unavailable during TOTP validation returns 503
**Maps to:** NFR Error handling
**Category:** error-handling

```gherkin
  Scenario: Secrets Manager outage causes challenge to return 503, token remains valid
    Given the user "usr_mfa_totp_01" has a valid challenge_token "ch_tok_abc123"
    And AWS Secrets Manager is unreachable (network fault injected)
    When a POST request is made to "/auth/mfa/challenge" with a valid TOTP code
    Then the system returns HTTP 503 Service Unavailable
    And the response body contains "Service temporarily unavailable"
    And the challenge_token "ch_tok_abc123" is still valid (not consumed or invalidated)
    And the user can retry when the service recovers
    And an alert is fired to on-call systems
```

**Test Data:**
- Fault injection: block outbound traffic to AWS Secrets Manager ARN

**Preconditions:**
- Fault injection capability in test environment

---

### T-NFR-2.1: Redis unavailable — challenge proceeds in degraded mode with alert
**Maps to:** NFR Error handling
**Category:** error-handling

```gherkin
  Scenario: Redis outage causes degraded-mode challenge (no replay or rate limit check)
    Given the user "usr_mfa_totp_01" has a valid challenge_token
    And Redis is unavailable (network fault injected)
    When a POST request is made to "/auth/mfa/challenge" with a valid TOTP code
    Then the system proceeds with TOTP validation (challenge is not blocked)
    And a session token is issued if the TOTP code is correct
    And an alert is fired immediately to on-call indicating degraded security mode
    And the alert priority is "critical" or "P1"
```

**Test Data:**
- Fault injection: block outbound traffic to Redis

**Preconditions:**
- Fault injection capability; application configured to degrade gracefully

---

### T-NFR-3.1: Account deleted mid-challenge returns 401
**Maps to:** NFR Error handling
**Category:** error-handling

```gherkin
  Scenario: User account is deleted between credential verification and TOTP challenge
    Given the user "usr_deleted_01" was issued challenge_token "ch_tok_deleted" after credential verification
    And the user account "usr_deleted_01" is deleted before the TOTP challenge is submitted
    When a POST request is made to "/auth/mfa/challenge" with:
      """
      { "challenge_token": "ch_tok_deleted", "code": "123456" }
      """
    Then the system returns HTTP 401 Unauthorized
    And no session is issued
```

**Test Data:**
- `user_id`: `usr_deleted_01`
- Deleted after login but before MFA challenge submission

**Preconditions:**
- Test environment can delete user accounts atomically during challenge window

---

### T-NFR-4.1: Non-numeric or non-6-digit TOTP challenge input returns 400
**Maps to:** NFR Input validation
**Category:** boundary

```gherkin
  Scenario Outline: Invalid TOTP code format returns 400 without consuming an attempt
    Given the user "usr_mfa_totp_01" has a valid challenge_token "ch_tok_abc123"
    And the failure count is 0
    When a POST request is made to "/auth/mfa/challenge" with code "<code>"
    Then the system returns HTTP 400 Bad Request
    And the failure count remains 0 (attempt not consumed)

    Examples:
      | code      | reason              |
      | 12345     | 5 digits            |
      | 1234567   | 7 digits            |
      | 12345A    | contains letter     |
      | 123 456   | contains space      |
      |           | empty string        |
```

**Test Data:**
- Challenge token: `ch_tok_abc123` (valid)
- Rate limit counter: seeded at 0

**Preconditions:**
- Valid challenge token is active

---

### T-NFR-5.1: Challenge token is single-use — cannot be used after completion
**Maps to:** NFR Security — single-use token
**Category:** security

```gherkin
  Scenario: Challenge token cannot be reused after successful MFA challenge
    Given the user "usr_mfa_totp_01" has used challenge_token "ch_tok_abc123" to successfully complete MFA
    And a session token has been issued
    When the user attempts to POST to "/auth/mfa/challenge" again with "ch_tok_abc123"
    Then the system returns HTTP 401 Unauthorized
    And no second session is issued
    And the response body indicates the token is expired or already used
```

**Test Data:**
- `challenge_token`: `ch_tok_abc123` (already consumed)

**Preconditions:**
- MFA challenge was successfully completed using this token

---

---

# Test Specifications: MFA-03 — SMS OTP Enrollment via Twilio

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2, T-1.3 | happy-path, error-handling |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1, T-3.2 | error-handling |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1, T-5.2 | boundary |
| AC-6 | T-6.1, T-6.2 | happy-path |
| AC-7 | T-7.1, T-7.2 | edge-case |
| AC-8 | T-8.1 | edge-case |
| AC-9 | T-9.1, T-9.2 | security |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |
| NFR: Twilio unavailable | T-NFR-1.1 | error-handling |
| NFR: Invalid phone format | T-NFR-2.1 | boundary |
| NFR: Twilio rejects number | T-NFR-3.1 | error-handling |
| NFR: Input validation — OTP | T-NFR-4.1 | boundary |

---

## Test Cases

### T-1.1: Valid phone number triggers OTP send and masked confirmation
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: SMS OTP Enrollment via Twilio

  Background:
    Given the following user exists:
      | field           | value               |
      | user_id         | usr_sms_enroll_01   |
      | email           | carol@example.com   |
      | status          | active              |
      | sms_enrolled    | false               |
      | organization_id | org_xyz789          |
    And the user is authenticated with a valid session token
    And the Twilio API is available and configured for test environment

  Scenario: User submits a valid E.164 phone number and receives OTP
    Given the authenticated user navigates to "Security Settings > Set Up SMS Authentication"
    When they submit phone number "+15555550100" via POST to "/auth/mfa/sms/enroll/send"
    Then the Twilio API is called with recipient "+15555550100"
    And the response body contains "A verification code has been sent to +1 XXXX XXX0100"
    And the UI displays the partially masked phone number (only last 4 digits visible: "0100")
    And an OTP is valid for 10 minutes
    And the OTP is single-use
```

**Test Data:**
- `phone_number`: `+15555550100` (TEST-NET equivalent for phone; use Twilio test credentials)
- Twilio credentials: use Twilio magic numbers for test environment (`+15005550006` for success)
- Enrollment endpoint: `POST /auth/mfa/sms/enroll/send`
- Request body: `{ "phone_number": "+15555550100" }`

**Preconditions:**
- `usr_sms_enroll_01` is authenticated, no active SMS enrollment
- Twilio test account configured (magic number to avoid real SMS)

---

### T-1.2: Twilio API error shows user-friendly message without exposing details
**Maps to:** AC-1
**Category:** error-handling

```gherkin
  Scenario: Twilio returns an error — user sees friendly message, internal error is hidden
    Given the Twilio API is configured to return an error for "+15005550001" (invalid number magic)
    When the user submits phone number "+15005550001"
    Then the system returns HTTP 400 or 422
    And the response body contains "We couldn't send a code to that number. Please check the number and try again."
    And the response body does not contain any Twilio error code or error message
    And the enrollment is not activated
```

**Test Data:**
- `phone_number`: `+15005550001` (Twilio magic number for "cannot route to this number")

**Preconditions:**
- Twilio test account configured with magic numbers

---

### T-1.3: Enrollment page loads with TOTP security nudge banner
**Maps to:** AC-1, AC-6
**Category:** happy-path

```gherkin
  Scenario: Security nudge banner appears before phone number entry
    Given the authenticated user navigates to the SMS enrollment page
    When the page loads (before they enter any phone number)
    Then an informational banner is visible containing:
      | text fragment                                                    |
      | "For stronger security, consider using an authenticator app"     |
      | "SMS codes can be intercepted"                                   |
    And a link to TOTP enrollment is present in the banner
    And the banner does not block the phone number input form
    And the banner is dismissible
```

**Test Data:**
- No phone number submitted yet

**Preconditions:**
- `usr_sms_enroll_01` is authenticated

---

### T-2.1: Correct OTP confirms enrollment and writes audit log
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: User submits correct OTP — SMS MFA enrollment activated and logged
    Given the user "usr_sms_enroll_01" has requested an OTP for "+15555550100"
    And the OTP "987654" was sent via Twilio
    When the user submits "987654" via POST to "/auth/mfa/sms/enroll/confirm"
    Then the system returns HTTP 200
    And a record is inserted into "mfa_enrollments" with:
      | field       | value              |
      | user_id     | usr_sms_enroll_01  |
      | method      | sms                |
      | status      | active             |
    And the phone number in "mfa_enrollments" is not stored in any plaintext log
    And a record is written to "auth_audit_log" with:
      | field       | value              |
      | event_type  | mfa_enrolled       |
      | user_id     | usr_sms_enroll_01  |
      | mfa_method  | sms                |
    And the user sees a success confirmation on screen
```

**Test Data:**
- `phone_number`: `+15555550100`
- OTP: `987654` (seeded in test state)
- Confirm endpoint: `POST /auth/mfa/sms/enroll/confirm`
- Request body: `{ "otp": "987654", "enrollment_session_id": "sms_enroll_sess_001" }`

**Preconditions:**
- OTP has been sent and is active in the enrollment session
- `auth_audit_log` table is writable

---

### T-3.1: Incorrect OTP returns error without activating enrollment
**Maps to:** AC-3
**Category:** error-handling

```gherkin
  Scenario: Wrong OTP does not activate enrollment and shows remaining attempts
    Given the user "usr_sms_enroll_01" has a pending enrollment session with OTP "987654"
    And 0 prior failed attempts exist for this session
    When the user submits OTP "000000"
    Then the system returns HTTP 422
    And the response body contains "Incorrect code. Please try again."
    And the response body contains the remaining attempt count
    And no "mfa_enrollments" record is created with status "active" for "usr_sms_enroll_01"
    And the failed attempt count increments by 1
```

**Test Data:**
- Incorrect OTP: `000000`
- Correct OTP: `987654` (should not match)

**Preconditions:**
- Active enrollment session exists

---

### T-3.2: Fifth failed OTP attempt invalidates enrollment session
**Maps to:** AC-3
**Category:** error-handling

```gherkin
  Scenario: 5th incorrect OTP invalidates the enrollment session
    Given the user "usr_sms_enroll_01" has 4 prior failed OTP attempts in this session
    When the user submits incorrect OTP "000000" for the 5th time
    Then the enrollment session is invalidated
    And the system returns an error indicating the session is now invalid
    And the user must restart the enrollment process
    And no enrollment is activated
```

**Test Data:**
- Prior failure count: 4 (seeded)
- Incorrect OTP: `000000`

**Preconditions:**
- Enrollment session with 4 prior failures

---

### T-4.1: OTP submitted after 10-minute expiry is rejected
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: Expired OTP is rejected and user is prompted to request a new one
    Given the user "usr_sms_enroll_01" received OTP "987654" 11 minutes ago
    And the OTP has expired
    When the user submits "987654"
    Then the system returns HTTP 422
    And the response body contains "This code has expired. Please request a new one."
    And the enrollment is not activated
    And a "Request new code" option is visible to the user
```

**Test Data:**
- OTP: `987654` (expired — issued > 10 minutes ago via time manipulation)

**Preconditions:**
- Test environment supports OTP TTL override or time manipulation

---

### T-5.1: OTP resend enforces 60-second cooldown
**Maps to:** AC-5
**Category:** boundary

```gherkin
  Scenario: Resend button is disabled with countdown during 60-second cooldown
    Given the user "usr_sms_enroll_01" is on the enrollment confirmation screen
    And an OTP was sent 10 seconds ago
    When the user attempts to click "Resend code"
    Then the resend button is disabled
    And a countdown timer shows the remaining cooldown (approximately 50 seconds)
    And no new OTP is sent
```

**Test Data:**
- Time since last OTP send: 10 seconds (within 60-second cooldown)

**Preconditions:**
- Active enrollment session; initial OTP sent

---

### T-5.2: Fourth resend attempt invalidates enrollment session
**Maps to:** AC-5
**Category:** boundary

```gherkin
  Scenario: After 3 resends, 4th resend attempt invalidates session
    Given the user "usr_sms_enroll_01" has requested 3 OTP resends in this session
    And 60 seconds have elapsed since the last resend (cooldown expired)
    When the user requests a 4th resend
    Then the system returns an error
    And the response body contains "Too many attempts. Please start over."
    And the enrollment session is invalidated
    And the user is redirected to the start of the SMS enrollment flow
```

**Test Data:**
- Resend count: 3 (seeded in session state)
- Elapsed time since last resend: 61 seconds

**Preconditions:**
- Enrollment session with 3 prior resends

---

### T-6.1: TOTP nudge banner is dismissible
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: User dismisses TOTP nudge banner and can still proceed with SMS enrollment
    Given the TOTP nudge banner is visible on the SMS enrollment page
    When the user clicks the dismiss button on the banner
    Then the banner is no longer visible
    And the phone number input form is still accessible and functional
    And the enrollment can proceed without the banner
```

**Test Data:**
- UI interaction: click dismiss/close on banner

**Preconditions:**
- `usr_sms_enroll_01` is on the SMS enrollment page

---

### T-6.2: TOTP nudge banner link navigates to TOTP enrollment
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: TOTP enrollment link in nudge banner navigates correctly
    Given the TOTP nudge banner is displayed on the SMS enrollment page
    When the user clicks the link to TOTP enrollment within the banner
    Then the user is navigated to the TOTP enrollment setup page
    And the TOTP enrollment flow can be initiated
```

**Test Data:**
- Expected navigation destination: TOTP enrollment page (URL: `/security/mfa/totp/enroll`)

**Preconditions:**
- TOTP enrollment page is accessible

---

### T-7.1: Re-enrollment requires re-authentication
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: User with active SMS enrollment must re-authenticate to change phone number
    Given the user "usr_sms_enroll_01" has an active SMS enrollment for "+15555550100"
    When they navigate to "Security Settings > Set Up SMS Authentication"
    Then the system presents a password re-authentication prompt
    And no OTP is sent until re-authentication succeeds
    And the current SMS enrollment remains active during re-authentication
```

**Test Data:**
- Existing `mfa_enrollments` record: `{ method: "sms", status: "active", phone_number_masked: "+1XXXXXXX0100" }`

**Preconditions:**
- `usr_sms_enroll_01` has existing active SMS enrollment

---

### T-7.2: Successful re-enrollment replaces old phone number
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: Re-enrollment deactivates old number and activates new one
    Given the user "usr_sms_enroll_01" has an active SMS enrollment for "+15555550100"
    And the user has re-authenticated with password "Password456!"
    When the user enrolls a new phone number "+15555550200" with a valid OTP
    Then the old enrollment for "+15555550100" has status "inactive"
    And the new enrollment for "+15555550200" has status "active"
    And an SMS to "+15555550100" is no longer accepted for authentication
    And an event is written to "auth_audit_log" with:
      | field       | value            |
      | event_type  | mfa_reenrolled   |
      | user_id     | usr_sms_enroll_01|
      | mfa_method  | sms              |
    And the phone number is not present in the audit log event
```

**Test Data:**
- Old phone: `+15555550100`
- New phone: `+15555550200`
- Password: `Password456!`

**Preconditions:**
- Re-authentication step completed successfully

---

### T-8.1: EU and Canadian phone numbers are accepted and OTP delivered
**Maps to:** AC-8
**Category:** edge-case

```gherkin
  Scenario Outline: OTP is delivered to EU and Canadian phone numbers via Twilio
    Given the authenticated user "usr_sms_enroll_01" is on the SMS enrollment page
    When they submit phone number "<phone_number>"
    Then the Twilio API is called with recipient "<phone_number>"
    And the response body indicates an OTP was sent (masked confirmation displayed)
    And no error is returned indicating the region is unsupported

    Examples:
      | phone_number    | region            |
      | +4915123456789  | Germany (DE)      |
      | +33612345678    | France (FR)       |
      | +31612345678    | Netherlands (NL)  |
      | +16135550100    | Canada (Ottawa)   |
      | +14165550100    | Canada (Toronto)  |
```

**Test Data:**
- Use Twilio staging environment with international number support
- Validate each region's Twilio routing in staging before production

**Preconditions:**
- Twilio account has been validated for EU and Canadian sending (confirmed per scope)
- Staging environment has international SMS enabled

---

### T-9.1: Phone number is not present in any application log
**Maps to:** AC-9
**Category:** security

```gherkin
  Scenario: Phone number submitted during enrollment does not appear in logs
    Given the user "usr_sms_enroll_01" submits phone number "+15555550100" during enrollment
    When all application log entries are inspected for the request
    Then the application log does not contain "+15555550100"
    And the access log does not contain "+15555550100"
    And any Twilio request log entry captured internally does not contain "+15555550100" in plaintext
```

**Test Data:**
- `phone_number`: `+15555550100`
- Log inspection covers: application log, access/nginx log, internal error log

**Preconditions:**
- Log capture enabled in test environment

---

### T-9.2: Admin UI shows only last 4 digits of enrolled phone number
**Maps to:** AC-9
**Category:** security

```gherkin
  Scenario: Admin UI displays masked phone number with last 4 digits only
    Given the user "usr_sms_enroll_01" has an active SMS enrollment for "+15555550100"
    When an administrator views the user's MFA settings in the admin UI
    Then the phone number is displayed as "+X XXXX XXX0100" or equivalent masked format
    And the full phone number "+15555550100" is not visible in the admin UI
    And the full phone number is not present in the admin UI's HTML source
```

**Test Data:**
- `phone_number`: `+15555550100`
- Expected masked display: shows only last 4 digits `0100`

**Preconditions:**
- Admin session with appropriate permissions to view user MFA settings

---

## Negative / Authorization Tests

### T-AUTH-1.1: Unauthenticated request to SMS enrollment endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security (P0)

```gherkin
  Scenario: No session token — SMS enrollment endpoint returns 401
    Given no authentication token or session cookie is present
    When a POST request is made to "/auth/mfa/sms/enroll/send" with body:
      """
      { "phone_number": "+15555550100" }
      """
    Then the system returns HTTP 401 Unauthorized
    And no Twilio API call is made
    And no OTP is generated or sent
    And no enrollment session is created
```

**Test Data:**
- Request: `POST /auth/mfa/sms/enroll/send` with no `Authorization` header and no session cookie

**Preconditions:**
- No active session

---

### T-AUTH-2.1: Organization SMS MFA restriction returns 403
**Maps to:** AC-AUTH-2
**Category:** security (P0)

```gherkin
  Scenario: User in org with SMS enrollment disabled receives 403
    Given the user "usr_sms_enroll_02" is authenticated and belongs to "org_totp_only"
    And organization "org_totp_only" has an org policy: "sms_enrollment_disabled = true"
    When a POST request is made to "/auth/mfa/sms/enroll/send" with body:
      """
      { "phone_number": "+15555550100" }
      """
    Then the system returns HTTP 403 Forbidden
    And the response body contains "SMS authentication is not permitted by your organization policy"
    And no Twilio API call is made
```

**Test Data:**
- `user_id`: `usr_sms_enroll_02`
- `organization_id`: `org_totp_only`
- Org policy: `{ sms_enrollment_disabled: true }`

**Preconditions:**
- POLICY story implemented; org policy toggle exists (deferred if not yet implemented, per AC-AUTH-2 note)

---

## Boundary / Error Handling Tests

### T-NFR-1.1: Twilio API unavailable during enrollment — user-friendly error returned
**Maps to:** NFR Error handling
**Category:** error-handling

```gherkin
  Scenario: Twilio API unavailable — enrollment fails with user-friendly message
    Given the Twilio API is unreachable (network fault injected)
    And the user "usr_sms_enroll_01" submits phone number "+15555550100"
    When the system attempts to call the Twilio API
    Then the system returns HTTP 503 or 502
    And the response body contains "Unable to send code at this time. Please try again later or use an authenticator app."
    And the Twilio error details are written to the internal error log (not the user-visible response)
    And the internal error log entry does not contain the phone number in plaintext
    And an alert is fired to on-call
```

**Test Data:**
- Fault injection: block outbound HTTPS to `api.twilio.com`

**Preconditions:**
- Fault injection capability in test environment

---

### T-NFR-2.1: Invalid E.164 phone format returns 400 before calling Twilio
**Maps to:** NFR Input validation
**Category:** boundary

```gherkin
  Scenario Outline: Invalid phone number format returns 400 without calling Twilio
    Given the user "usr_sms_enroll_01" is authenticated
    When they submit phone number "<phone_number>"
    Then the system returns HTTP 400 Bad Request
    And the response body contains "Please enter a valid phone number in international format (+1XXXXXXXXXX)."
    And no Twilio API call is made

    Examples:
      | phone_number     | reason                     |
      | 5555550100       | missing + prefix           |
      | +1555           | too short                   |
      | +155555501001234 | too long (>15 digits total) |
      | +0555550100      | leading zero after +        |
      | +1abc5550100     | contains letters            |
      |                  | empty string                |
```

**Test Data:**
- Invalid phone number variants as shown in examples

**Preconditions:**
- `usr_sms_enroll_01` is authenticated

---

### T-NFR-3.1: Twilio rejects unroutable number — user-friendly error without Twilio details
**Maps to:** NFR Error handling
**Category:** error-handling

```gherkin
  Scenario: Twilio returns unroutable error — user sees generic message
    Given the Twilio API returns error code 21211 ("Invalid 'To' Phone Number") for "+15005550001"
    When the user submits phone number "+15005550001"
    Then the system returns HTTP 400 or 422
    And the response body contains "We couldn't send a code to that number. Please check the number is correct and try again."
    And the response body does not contain "21211" or any Twilio error code
    And the enrollment is not activated
```

**Test Data:**
- `phone_number`: `+15005550001` (Twilio magic number for invalid/unroutable)

**Preconditions:**
- Twilio test account with magic numbers configured

---

### T-NFR-4.1: Non-6-digit or non-numeric OTP confirmation code returns 400
**Maps to:** NFR Input validation
**Category:** boundary

```gherkin
  Scenario Outline: OTP confirmation code with invalid format returns 400
    Given the user "usr_sms_enroll_01" has an active enrollment session
    When they submit OTP "<otp_code>" as confirmation
    Then the system returns HTTP 400 Bad Request
    And no attempt is counted against the failure limit

    Examples:
      | otp_code  | reason           |
      | 12345     | 5 digits         |
      | 1234567   | 7 digits         |
      | 12345A    | contains letter  |
      | 123 456   | contains space   |
      |           | empty            |
```

**Test Data:**
- Active enrollment session with a pending OTP

**Preconditions:**
- Active enrollment session exists

---

---

# Test Specifications: MFA-04 — SMS OTP Login Challenge Flow

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2, T-1.3 | happy-path, error-handling |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1, T-3.2 | security |
| AC-4 | T-4.1, T-4.2 | security |
| AC-5 | T-5.1 | edge-case |
| AC-6 | T-6.1, T-6.2 | edge-case |
| AC-7 | T-7.1 | happy-path |
| AC-8 | T-8.1, T-8.2 | happy-path |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |
| NFR: Twilio unavailable | T-NFR-1.1 | error-handling |
| NFR: Redis unavailable | T-NFR-2.1 | error-handling |
| NFR: Input validation | T-NFR-3.1 | boundary |
| NFR: Challenge token single-use | T-NFR-4.1 | security |

---

## Test Cases

### T-1.1: Correct credentials trigger automatic SMS OTP send and masked display
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: SMS OTP Login Challenge Flow

  Background:
    Given the following user exists:
      | field           | value               |
      | user_id         | usr_sms_login_01    |
      | email           | dave@example.com    |
      | password_hash   | bcrypt("Pass789!")  |
      | sms_enrolled    | true                |
      | phone_number    | +15555550300        |
      | organization_id | org_xyz789          |
    And the user has an active SMS enrollment for "+15555550300"
    And the Twilio API is available

  Scenario: Valid credentials trigger automatic SMS OTP and masked phone display
    Given no active session exists for user "usr_sms_login_01"
    When a POST request is made to "/auth/login" with body:
      """
      { "email": "dave@example.com", "password": "Pass789!" }
      """
    Then the system automatically triggers a Twilio SMS send to "+15555550300"
    And the response body contains:
      | field          | value                                  |
      | mfa_required   | true                                   |
      | mfa_method     | sms                                    |
      | challenge_token| <non-null short-lived token>           |
    And the UI displays "A code has been sent to +1 XXXX XXX0300"
    And only the last 4 digits "0300" are visible in the message
    And the OTP sent via Twilio is valid for 10 minutes
    And no session token or httpOnly cookie is issued in this response
```

**Test Data:**
- `email`: `dave@example.com`
- `password`: `Pass789!`
- Enrolled phone: `+15555550300` (Twilio test credential)
- Login endpoint: `POST /auth/login`

**Preconditions:**
- `usr_sms_login_01` has active SMS enrollment
- Twilio configured with test credentials (magic numbers)

---

### T-1.2: Twilio send failure on challenge presentation — session not issued
**Maps to:** AC-1
**Category:** error-handling

```gherkin
  Scenario: Twilio SMS fails during challenge setup — no session issued, error message shown
    Given the Twilio API returns an error when sending to "+15555550300"
    When valid credentials for "usr_sms_login_01" are submitted
    Then the credentials are verified successfully
    And the system attempts to send an SMS OTP
    And the SMS send fails
    And no session token is issued
    And the challenge screen displays "Unable to send a code. Please use a recovery code or try again."
    And a "Use a recovery code" link is visible
```

**Test Data:**
- Twilio fault: configured to fail for `+15555550300` via test magic number

**Preconditions:**
- Twilio configured to return an error for the test number

---

### T-1.3: Incorrect credentials do not trigger SMS OTP send
**Maps to:** AC-1
**Category:** error-handling

```gherkin
  Scenario: Wrong password — no SMS OTP is sent
    Given no active session for "usr_sms_login_01"
    When a POST request is made to "/auth/login" with:
      """
      { "email": "dave@example.com", "password": "WrongPassword!" }
      """
    Then the system returns HTTP 401 Unauthorized
    And no Twilio API call is made
    And no challenge_token is issued
```

**Test Data:**
- `password`: `WrongPassword!`

**Preconditions:**
- No active session

---

### T-2.1: Correct SMS OTP issues session token and writes audit log
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: User submits correct SMS OTP — session issued and audit logged
    Given the user "usr_sms_login_01" has a valid challenge_token "sms_ch_tok_001"
    And the OTP "246813" was sent to "+15555550300" via Twilio
    And the OTP is within its 10-minute validity window
    When a POST request is made to "/auth/mfa/challenge" with body:
      """
      {
        "challenge_token": "sms_ch_tok_001",
        "code": "246813"
      }
      """
    Then the system returns HTTP 200
    And a session token is set in an httpOnly cookie named "session"
    And the user is redirected to the post-login destination
    And a record is written to "auth_audit_log" with:
      | field           | value                  |
      | event_type      | mfa_challenge_success  |
      | user_id         | usr_sms_login_01       |
      | organization_id | org_xyz789             |
      | mfa_method      | sms                    |
    And the phone number is NOT present in the audit log event
```

**Test Data:**
- `challenge_token`: `sms_ch_tok_001`
- OTP: `246813` (seeded in test state)
- MFA challenge endpoint: `POST /auth/mfa/challenge`

**Preconditions:**
- `sms_ch_tok_001` is a valid, unexpired challenge token
- OTP `246813` is active in Redis with TTL within 10 minutes
- Redis available for OTP state tracking

---

### T-3.1: SMS OTP is single-use — second submission is rejected
**Maps to:** AC-3
**Category:** security

```gherkin
  Scenario: Used OTP cannot be submitted again within its validity window
    Given the user "usr_sms_login_01" successfully logged in using OTP "246813"
    And the OTP "246813" is still within its 10-minute validity window (5 minutes remaining)
    When the OTP "246813" is submitted again (simulating replay attack)
    Then the system returns an error response
    And the response body contains "This code has already been used."
    And no second session is issued
    And the used OTP state is tracked in Redis with a TTL matching the OTP's remaining validity
```

**Test Data:**
- OTP: `246813`
- Redis key: `used_otp:{user_id}:{otp_value}` or equivalent
- TTL: remaining validity (e.g., if issued 5 minutes ago, TTL ≤ 5 minutes)

**Preconditions:**
- OTP `246813` was used in a successful challenge 30 seconds ago

---

### T-3.2: Used OTP state persists in Redis until expiry
**Maps to:** AC-3
**Category:** security

```gherkin
  Scenario: Redis TTL for a used SMS OTP matches the remaining OTP validity period
    Given the user "usr_sms_login_01" used OTP "246813" 2 minutes after it was issued
    When the Redis key for the used OTP is inspected
    Then the Redis TTL for the used OTP key is approximately 8 minutes (10 min validity − 2 min elapsed)
    And the key has not expired before the OTP's natural expiry
```

**Test Data:**
- OTP issued at T; used at T+2min; Redis TTL should be ~8min

**Preconditions:**
- Redis available with inspection access in test environment

---

### T-4.1: Five failed SMS OTP attempts trigger rate limit lockout
**Maps to:** AC-4
**Category:** security

```gherkin
  Scenario: 5 failed SMS OTP submissions trigger RATE-01 lockout
    Given the user "usr_sms_login_01" has 4 prior failed OTP submissions
    And a valid challenge_token "sms_ch_tok_001" exists
    When a POST request is made to "/auth/mfa/challenge" with incorrect OTP "000000"
    Then the system returns HTTP 429 Too Many Requests
    And the challenge screen displays the lockout message and 15-minute countdown
    And the challenge_token "sms_ch_tok_001" is invalidated immediately
    And no session is issued
    And an event is written to "auth_audit_log" with event_type "mfa_challenge_failure"
    And the lockout applies to this account/IP combination
```

**Test Data:**
- Prior failure count: 4 (seeded in Redis)
- Incorrect OTP: `000000`
- Expected lockout duration: 15 minutes

**Preconditions:**
- Redis contains 4 prior failures for `usr_sms_login_01` / test IP
- Challenge token is still within its 10-minute window

---

### T-4.2: Lockout event invalidates challenge token immediately
**Maps to:** AC-4
**Category:** security

```gherkin
  Scenario: Challenge token is invalid after lockout is triggered
    Given the user "usr_sms_login_01" has been locked out due to 5 failed attempts
    And challenge_token "sms_ch_tok_001" is still technically within its 10-minute window
    When any OTP code is submitted with "sms_ch_tok_001"
    Then the system returns HTTP 429 (lockout) or HTTP 401 (token invalid)
    And no session is issued regardless of the OTP value
```

**Test Data:**
- `challenge_token`: `sms_ch_tok_001` (within time window but lockout triggered)

**Preconditions:**
- Lockout state seeded in Redis for `usr_sms_login_01`

---

### T-5.1: Expired OTP is rejected with option to resend
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: OTP submitted after 10-minute expiry is rejected
    Given the user "usr_sms_login_01" received OTP "246813" 11 minutes ago
    And the OTP has expired
    When they submit "246813" via the challenge screen
    Then the system returns an error response
    And the response body contains "This code has expired."
    And a "Resend code" option is presented
    And no session is issued
```

**Test Data:**
- OTP issued at `T - 11 minutes` (expired)

**Preconditions:**
- OTP expiry controlled via Redis TTL or test time manipulation

---

### T-6.1: OTP resend enforces 60-second cooldown with countdown timer
**Maps to:** AC-6
**Category:** edge-case

```gherkin
  Scenario: Resend button disabled with countdown during 60-second cooldown
    Given the user "usr_sms_login_01" is on the SMS OTP challenge screen
    And the initial OTP was sent 15 seconds ago
    When the user attempts to click "Resend code"
    Then the resend button is disabled
    And a countdown timer shows approximately 45 seconds remaining
    And no new Twilio SMS is triggered
    And the existing OTP remains valid until the resend is allowed
```

**Test Data:**
- Time since last OTP send: 15 seconds

**Preconditions:**
- Challenge session active; initial OTP sent

---

### T-6.2: Third resend exhausted — challenge session invalidated, user must restart login
**Maps to:** AC-6
**Category:** edge-case

```gherkin
  Scenario: After 3 OTP resends, challenge session is invalidated
    Given the user "usr_sms_login_01" has requested 3 OTP resends during this challenge session
    And 61 seconds have elapsed since the last resend
    When the user requests a 4th OTP resend
    Then the challenge session is invalidated
    And the system returns an error
    And the user must restart the login flow from the credential entry step
    And any previously issued OTPs are invalidated
```

**Test Data:**
- Resend count: 3 (seeded in session state)

**Preconditions:**
- Challenge session with 3 prior resends recorded

---

### T-7.1: Recovery code link visible on SMS challenge screen at 375px viewport
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: Recovery code link is visible without scrolling on mobile viewport
    Given the user "usr_sms_login_01" is on the SMS OTP challenge screen
    When the page is rendered at viewport width 375px
    Then a link labeled "Use a recovery code instead" is visible without scrolling
    And clicking the link navigates to the recovery code entry flow
    And the link is keyboard-accessible and announced correctly by a screen reader
```

**Test Data:**
- Viewport: 375px × 667px (iPhone SE)

**Preconditions:**
- Challenge screen rendered with valid challenge_token

---

### T-8.1: Successful SMS OTP challenge writes audit log entry
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: Successful SMS OTP challenge is written to audit log without phone number
    Given the user "usr_sms_login_01" has submitted a correct SMS OTP
    When the challenge succeeds and session is issued
    Then a record exists in "auth_audit_log" with:
      | field           | value                  |
      | event_type      | mfa_challenge_success  |
      | user_id         | usr_sms_login_01       |
      | organization_id | org_xyz789             |
      | mfa_method      | sms                    |
      | ip_address      | 203.0.113.55           |
    And the "created_at" field is a valid UTC timestamp
    And the column "phone_number" is NOT present in this audit log entry
```

**Test Data:**
- Simulated IP: `203.0.113.55`
- Verify audit log schema does not include `phone_number` field

**Preconditions:**
- `auth_audit_log` table is writable

---

### T-8.2: Failed SMS OTP challenge writes audit log entry
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: Failed SMS OTP challenge is written to audit log without phone number
    Given the user "usr_sms_login_01" has submitted an incorrect SMS OTP
    When the challenge fails
    Then a record exists in "auth_audit_log" with:
      | field           | value                    |
      | event_type      | mfa_challenge_failure    |
      | user_id         | usr_sms_login_01         |
      | organization_id | org_xyz789               |
      | mfa_method      | sms                      |
      | ip_address      | 203.0.113.55             |
    And "phone_number" is NOT present in this audit log entry
```

**Test Data:**
- Same as T-8.1

**Preconditions:**
- `auth_audit_log` table is writable

---

## Negative / Authorization Tests

### T-AUTH-1.1: No challenge token — SMS challenge endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security (P0)

```gherkin
  Scenario: Direct access to SMS OTP challenge endpoint without challenge token returns 401
    Given no challenge_token is present in the request
    When a POST request is made to "/auth/mfa/challenge" with body:
      """
      { "code": "246813" }
      """
    Then the system returns HTTP 401 Unauthorized
    And no session token is issued
    And no Twilio API call is triggered
```

**Test Data:**
- Request: `POST /auth/mfa/challenge` with no `challenge_token`

**Preconditions:**
- No session or challenge token

---

### T-AUTH-2.1: Fully authenticated user submitting SMS OTP outside challenge returns 403
**Maps to:** AC-AUTH-2
**Category:** security (P0)

```gherkin
  Scenario: Already-authenticated user attempts to use SMS challenge endpoint — 403 returned
    Given the user "usr_sms_login_01" has a fully authenticated session (no pending MFA challenge)
    When a POST request is made to "/auth/mfa/challenge" with:
      """
      { "code": "246813" }
      """
    And the request includes the active session cookie
    Then the system returns HTTP 403 Forbidden
    And the response body indicates no active MFA challenge exists
    And the existing session is not modified or escalated
```

**Test Data:**
- Session cookie: `session=valid_full_session_tok_sms`

**Preconditions:**
- `usr_sms_login_01` is fully authenticated (both credential and MFA steps previously completed)

---

## Boundary / Error Handling Tests

### T-NFR-1.1: Twilio unavailable during login challenge — no session issued, alert fired
**Maps to:** NFR Error handling
**Category:** error-handling

```gherkin
  Scenario: Twilio unavailable when credentials are verified — challenge screen shows error
    Given the Twilio API is unreachable (network fault injected)
    When valid credentials for "usr_sms_login_01" are submitted
    Then the system attempts to trigger an SMS OTP send
    And the Twilio send fails
    And the challenge screen displays "Unable to send a code. Please use a recovery code or contact support."
    And no session token is issued
    And the Twilio error is written to the internal error log (not visible in API response)
    And an alert is fired to on-call
```

**Test Data:**
- Fault injection: block outbound HTTPS to `api.twilio.com`

**Preconditions:**
- Fault injection capability in test environment

---

### T-NFR-2.1: Redis unavailable — challenge proceeds in degraded mode with critical alert
**Maps to:** NFR Error handling
**Category:** error-handling

```gherkin
  Scenario: Redis outage causes challenge to proceed without replay prevention or rate limiting
    Given Redis is unavailable (network fault injected)
    And the user "usr_sms_login_01" has a valid challenge_token "sms_ch_tok_001"
    When the user submits a correct SMS OTP
    Then the system proceeds with OTP validation (challenge is not blocked by Redis failure)
    And a session is issued if the OTP is correct
    And a "critical" or "P1" alert is fired immediately to on-call
    And the alert message indicates degraded security mode (no replay prevention or rate limiting)
```

**Test Data:**
- Fault injection: block outbound traffic to Redis port (6379 or configured port)

**Preconditions:**
- Redis fault injection capability; application configured to degrade gracefully without Redis

---

### T-NFR-3.1: Non-6-digit or non-numeric OTP on challenge screen returns 400 without consuming attempt
**Maps to:** NFR Input validation
**Category:** boundary

```gherkin
  Scenario Outline: Invalid OTP format on challenge screen returns 400 without consuming attempt
    Given the user "usr_sms_login_01" has a valid challenge_token "sms_ch_tok_001"
    And the failure count is 0
    When they submit OTP "<code>" via the challenge screen
    Then the system returns HTTP 400 Bad Request
    And the failure count remains 0 (no attempt consumed)
    And the challenge_token remains valid

    Examples:
      | code      | reason              |
      | 12345     | 5 digits            |
      | 1234567   | 7 digits            |
      | 12345A    | contains letter     |
      | 123 456   | contains space      |
      |           | empty string        |
```

**Test Data:**
- Challenge token: `sms_ch_tok_001` (valid)
- Failure count: 0 (seeded)

**Preconditions:**
- Valid challenge token is active

---

### T-NFR-4.1: Challenge token is single-use — cannot be reused after completion
**Maps to:** NFR Security — single-use token
**Category:** security

```gherkin
  Scenario: Completed SMS OTP challenge token cannot be reused
    Given the user "usr_sms_login_01" successfully completed an SMS OTP challenge with token "sms_ch_tok_001"
    And a session was issued
    When "sms_ch_tok_001" is submitted again to "/auth/mfa/challenge"
    Then the system returns HTTP 401 Unauthorized
    And no second session is issued
    And the response body indicates the token has already been used or expired
```

**Test Data:**
- `challenge_token`: `sms_ch_tok_001` (already consumed by successful challenge)

**Preconditions:**
- Prior successful challenge completed using this token

---

*End of batch 02 of 6 — MFA-01 through MFA-04 test specifications complete.*


# Test Specifications: Batch 03 of 6

---

# Test Specifications: MFA-05 — MFA Backup Recovery Codes

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2, T-1.3 | happy-path, edge-case |
| AC-2 | T-2.1, T-2.2 | security |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1, T-4.2 | security |
| AC-5 | T-5.1, T-5.2, T-5.3 | happy-path, error-handling |
| AC-6 | T-6.1, T-6.2 | edge-case |
| AC-7 | T-7.1, T-7.2 | happy-path, security |
| AC-8 | T-8.1, T-8.2 | happy-path |
| AC-9 | T-9.1, T-9.2 | security |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Recovery codes are generated immediately after first TOTP enrollment
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: MFA Backup Recovery Code Generation

  Scenario: User is prompted to generate recovery codes after completing first TOTP enrollment
    Given a user with email "alice@example.com" and status "active" has no MFA methods enrolled
    And the user has authenticated with their password
    When the user completes TOTP enrollment via MFA-01 flow with a valid TOTP code "123456"
    Then the system presents the recovery code generation prompt before leaving the enrollment flow
    And the prompt displays exactly 8 recovery codes
    And each code matches the format "XXXX-XXXX-XXXX-XXXX" using only alphanumeric characters
    And no code contains the characters "0", "O", "1", or "l"
    And each code is at least 16 characters (excluding hyphens)
    And the page header reads "Save these codes somewhere safe — they won't be shown again"
    And the codes are rendered in a monospace font
```

**Test Data:**
- User: `{ email: "alice@example.com", role: "member", status: "active", mfa_methods: [] }`
- TOTP secret: provisioned during enrollment; valid code computed from secret at test time
- Expected code format regex: `^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$`

**Preconditions:**
- User exists in the database with no MFA methods
- TOTP enrollment flow is active (user has scanned QR code and entered valid code)
- `recovery_codes` table exists (INFRA-AUTH-01 deployed)

---

### T-1.2: Recovery codes are generated immediately after first SMS enrollment
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: User is prompted to generate recovery codes after completing first SMS enrollment
    Given a user with email "bob@example.com" has no MFA methods enrolled
    And the user has authenticated with their password
    When the user completes SMS OTP enrollment via MFA-03 flow
    Then the system presents the recovery code generation prompt before leaving the enrollment flow
    And exactly 8 recovery codes are displayed
    And each code is formatted as "XXXX-XXXX-XXXX-XXXX"
    And no code contains ambiguous characters "0", "O", "1", or "l"
```

**Test Data:**
- User: `{ email: "bob@example.com", role: "member", status: "active", mfa_methods: [] }`
- Phone: `+15550001234` (verified during SMS enrollment)

**Preconditions:**
- User has no MFA methods enrolled
- SMS OTP enrollment (MFA-03) completed successfully with valid OTP

---

### T-1.3: Recovery code generation is not triggered for a second MFA method enrollment
**Maps to:** AC-1
**Category:** edge-case

```gherkin
  Scenario: No recovery code prompt when user enrolls an additional MFA method
    Given a user with email "carol@example.com" already has TOTP enrolled as their first MFA method
    And the user already has 8 recovery codes generated from initial TOTP enrollment
    When the user enrolls an SMS OTP method as a second MFA method
    Then the system does NOT present the recovery code generation prompt again
    And the existing recovery codes remain unchanged
```

**Test Data:**
- User: `{ email: "carol@example.com", mfa_methods: ["totp"], recovery_codes_count: 8 }`

**Preconditions:**
- User has exactly one MFA method already enrolled
- Existing recovery codes exist in `recovery_codes` table

---

### T-2.1: Recovery codes are stored as bcrypt hashes with required schema fields
**Maps to:** AC-2
**Category:** security

```gherkin
  Scenario: Generated recovery codes are stored as bcrypt hashes with no plaintext
    Given a user with email "dave@example.com" has completed their first MFA enrollment
    When the system generates and stores 8 recovery codes
    Then the `recovery_codes` table contains exactly 8 rows for this user
    And each row has a non-null `code_hash` field starting with the bcrypt prefix "$2b$"
    And the bcrypt cost factor is at least 12 (verifiable from hash prefix "$2b$12$")
    And each row contains `user_id`, `code_hash`, `created_at`, `used_at` (null), `invalidated_at` (null)
    And no application log entry contains the plaintext recovery code values
    And no database column stores the plaintext recovery code values
```

**Test Data:**
- User: `{ id: "user-uuid-001", email: "dave@example.com" }`
- bcrypt prefix expected: `$2b$12$` (cost factor 12 minimum)

**Preconditions:**
- User has completed first MFA enrollment
- Database and application log access available for assertion

---

### T-2.2: Partial storage failure rolls back all codes — no partial state
**Maps to:** AC-2
**Category:** security / error-handling

```gherkin
  Scenario: Database transaction rolls back completely if code storage fails partway through
    Given a user with email "eve@example.com" has completed their first MFA enrollment
    And the database is configured to fail on the 5th insert into `recovery_codes`
    When the system attempts to generate and store 8 recovery codes
    Then the `recovery_codes` table contains 0 rows for this user (not 4)
    And the user sees the error "Unable to generate codes. Please try again."
    And the user is not locked out of their account
    And the enrollment itself remains valid (MFA method is still enrolled)
```

**Test Data:**
- User: `{ email: "eve@example.com" }`
- Database fault injection: simulate constraint failure on 5th INSERT

**Preconditions:**
- Fault injection or test double configured to fail mid-transaction
- User has just completed first MFA enrollment in the same session

---

### T-3.1: All 8 codes displayed with copy-all and download buttons
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Recovery code display screen shows copy and download actions
    Given a user with email "frank@example.com" has just completed MFA enrollment
    When the recovery codes screen is displayed
    Then the screen shows exactly 8 codes
    And a "Copy all codes" button is visible and enabled
    And a "Download codes" button is visible and enabled
    And clicking "Copy all codes" copies all 8 codes to clipboard as plaintext, newline-separated
    And clicking "Download codes" triggers a download of a file named "recovery-codes-frank-2026-06-15.txt"
    And the downloaded file contains all 8 codes, one per line, in plaintext
```

**Test Data:**
- User: `{ email: "frank@example.com", username: "frank" }`
- Expected download filename pattern: `recovery-codes-{username}-{YYYY-MM-DD}.txt`
- Current date: `2026-06-15`

**Preconditions:**
- Recovery codes generated and stored
- User is on the recovery codes display screen immediately after enrollment

---

### T-3.2: Copy clipboard content contains all 8 codes separated by newlines
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Clipboard content from copy action is newline-separated plaintext codes
    Given the recovery codes screen displays 8 codes for user "grace@example.com"
    When the user clicks "Copy all codes"
    Then the clipboard content is a string of exactly 8 codes
    And each code is on its own line (separated by "\n")
    And the content does not contain any HTML markup or additional text
```

**Test Data:**
- Expected clipboard format: `"CODE1\nCODE2\nCODE3\nCODE4\nCODE5\nCODE6\nCODE7\nCODE8"`

**Preconditions:**
- Browser clipboard API accessible in test environment
- User is on the recovery codes display screen

---

### T-4.1: Plaintext codes unavailable after navigating away from enrollment screen
**Maps to:** AC-4
**Category:** security

```gherkin
  Scenario: Recovery codes endpoint returns only count and creation date after codes are displayed
    Given a user with email "henry@example.com" generated recovery codes during enrollment
    And the user has navigated away from the enrollment screen
    When a GET request is made to "/users/me/recovery-codes"
    Then the response status is 200
    And the response body contains `remaining_count: 8` and `created_at: "2026-06-15T..."`
    And the response body does NOT contain any plaintext code values
    And the response body does NOT contain any `code_hash` values
```

**Test Data:**
- User: `{ email: "henry@example.com" }`
- Request: `GET /users/me/recovery-codes` with valid session token

**Preconditions:**
- Recovery codes have been generated and displayed
- User session has navigated away (simulated by calling endpoint directly in a new request)

---

### T-4.2: Recovery codes response includes Cache-Control: no-store header
**Maps to:** AC-4
**Category:** security

```gherkin
  Scenario: Recovery code display page sets Cache-Control: no-store header
    Given a user with email "iris@example.com" is on the recovery codes display screen
    When the page response headers are inspected
    Then the response includes the header "Cache-Control: no-store"
    And the page content is not served from browser cache on back-navigation
```

**Test Data:**
- User: `{ email: "iris@example.com" }`

**Preconditions:**
- User is in the enrollment flow at the recovery codes display step

---

### T-5.1: A used recovery code grants access and is marked used
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Valid recovery code grants authentication and is marked single-use
    Given a user with email "jack@example.com" has 8 recovery codes and is on the recovery code challenge screen
    When the user submits a valid recovery code "ABCD-EFGH-IJKL-MNOP"
    Then the authentication succeeds and a session is issued
    And the submitted code's row in `recovery_codes` has a non-null `used_at` timestamp
    And the remaining 7 codes still have `used_at = null`
    And an event `recovery_code_used` is written to `auth_audit_log` with `user_id` and timestamp
```

**Test Data:**
- User: `{ email: "jack@example.com", id: "user-uuid-jack" }`
- Recovery codes: 8 pre-seeded plaintext codes with known bcrypt hashes in `recovery_codes`
- Code under test: `"ABCD-EFGH-IJKL-MNOP"` (seeded with known hash)
- Audit event: `{ event_type: "recovery_code_used", user_id: "user-uuid-jack" }`

**Preconditions:**
- User has 8 unused recovery codes seeded in `recovery_codes` table with bcrypt hashes
- User is on the MFA challenge flow at the recovery code entry step (valid challenge token present)

---

### T-5.2: A previously used recovery code cannot be reused
**Maps to:** AC-5
**Category:** error-handling

```gherkin
  Scenario: Already-used recovery code is rejected on resubmission
    Given a user with email "kate@example.com" has previously used recovery code "ABCD-EFGH-IJKL-MNOP"
    And the code's `used_at` is set to "2026-06-10T10:00:00Z"
    When the user submits the same code "ABCD-EFGH-IJKL-MNOP" again
    Then the authentication fails
    And the error message reads "This code has already been used."
    And the session is not issued
    And the `used_at` timestamp on the code row is not updated
```

**Test Data:**
- User: `{ email: "kate@example.com" }`
- Code: `"ABCD-EFGH-IJKL-MNOP"` with `used_at: "2026-06-10T10:00:00Z"` in database

**Preconditions:**
- Recovery code row exists with `used_at` set (already consumed)

---

### T-5.3: Invalid recovery code returns generic error — no enumeration
**Maps to:** AC-5
**Category:** security

```gherkin
  Scenario: Submitting a completely invalid recovery code returns an error without revealing code existence
    Given a user with email "leo@example.com" is on the recovery code entry screen
    When the user submits a recovery code "ZZZZ-ZZZZ-ZZZZ-ZZZZ" that does not match any stored code
    Then the authentication fails
    And the error message is generic (e.g., "Invalid recovery code.")
    And the response does not reveal whether any codes exist for the account
    And the failed attempt increments the account-level failed attempt counter
```

**Test Data:**
- Code: `"ZZZZ-ZZZZ-ZZZZ-ZZZZ"` (no matching hash in database)

**Preconditions:**
- Valid challenge token present
- User has valid recovery codes in database (to confirm no enumeration leaks)

---

### T-6.1: Email alert is sent only when the last (8th) recovery code is used
**Maps to:** AC-6
**Category:** edge-case

```gherkin
  Scenario: Email alert sent when final recovery code is consumed
    Given a user with email "mia@example.com" has exactly 1 remaining valid recovery code "WXYZ-WXYZ-WXYZ-WXYZ"
    And 7 previous codes have `used_at` set
    When the user submits the final recovery code "WXYZ-WXYZ-WXYZ-WXYZ"
    Then the authentication succeeds and a session is issued
    And an email is sent to "mia@example.com" with subject "Action required: regenerate your recovery codes"
    And the email body advises the user to regenerate codes while they have an active session
    And the session issuance is not delayed by the email send
    And no email was sent when codes 2 through 7 were used
```

**Test Data:**
- User: `{ email: "mia@example.com" }`
- State: 7 codes with `used_at` set, 1 code with `used_at = null`
- Final code plaintext: `"WXYZ-WXYZ-WXYZ-WXYZ"` (seeded with known hash)
- Expected email subject: `"Action required: regenerate your recovery codes"`

**Preconditions:**
- Exactly 7 of 8 recovery codes have been consumed (rows with `used_at` set)
- Email delivery is instrumented/captured in test environment

---

### T-6.2: No email alert sent when second-to-last code is used
**Maps to:** AC-6
**Category:** edge-case

```gherkin
  Scenario: No email alert when non-final recovery code is used
    Given a user with email "noah@example.com" has exactly 2 remaining valid recovery codes
    When the user submits one of the two remaining valid codes
    Then the authentication succeeds
    And NO email is sent to "noah@example.com"
    And the used code's `used_at` is set
    And the remaining 1 code still has `used_at = null`
```

**Test Data:**
- User: `{ email: "noah@example.com" }`
- State: 6 codes with `used_at` set, 2 codes with `used_at = null`

**Preconditions:**
- Exactly 2 recovery codes remain unused
- Email capture instrumented to verify no email is sent

---

### T-7.1: Regenerating codes invalidates existing codes and generates 8 new ones
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: Regenerate recovery codes invalidates old codes and issues 8 new ones
    Given a user with email "olivia@example.com" is on "Security Settings > Recovery Codes"
    And the user has 6 remaining unused recovery codes (2 have been used previously)
    When the user clicks "Regenerate codes" and re-authenticates with password "SecureP@ss123"
    Then all 6 unused existing code rows have `invalidated_at` set to the current timestamp
    And 8 new recovery codes are generated and displayed per AC-1 and AC-3 standards
    And the 2 previously used code rows remain in `recovery_codes` with their `used_at` values intact
    And an event `recovery_codes_regenerated` is written to `auth_audit_log`
    And the new codes can be downloaded and copied per AC-3
```

**Test Data:**
- User: `{ email: "olivia@example.com", password: "SecureP@ss123" }`
- Pre-state: 8 rows in `recovery_codes`; 2 with `used_at` set; 6 with `used_at = null`
- Expected audit event: `{ event_type: "recovery_codes_regenerated", user_id: "olivia-uuid" }`

**Preconditions:**
- User has active MFA-enrolled session
- User is on the Security Settings > Recovery Codes page
- `recovery_codes` table contains 8 rows for this user (2 used, 6 unused)

---

### T-7.2: Regeneration requires successful re-authentication — wrong password rejected
**Maps to:** AC-7
**Category:** security

```gherkin
  Scenario: Recovery code regeneration is blocked if re-authentication fails
    Given a user with email "peter@example.com" is on "Security Settings > Recovery Codes"
    When the user clicks "Regenerate codes" and enters incorrect password "WrongPassword!"
    Then re-authentication fails
    And the existing recovery codes are NOT invalidated
    And no new codes are generated
    And the error message reads "Incorrect password. Please try again."
```

**Test Data:**
- User: `{ email: "peter@example.com", actual_password: "CorrectPass!99" }`
- Submitted password: `"WrongPassword!"`

**Preconditions:**
- User has active session on the Security Settings page
- Existing recovery codes remain unchanged after test

---

### T-8.1: "Use a recovery code instead" link appears on TOTP challenge screen
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: Recovery code fallback link is visible on TOTP MFA challenge screen
    Given a user with email "quinn@example.com" has TOTP enrolled and valid recovery codes
    When the user reaches the TOTP MFA challenge screen during login (MFA-02)
    Then a link labeled "Use a recovery code instead" is visible on the challenge screen
    And clicking the link presents a recovery code entry field
    And the user can submit a valid recovery code "ABCD-EFGH-IJKL-MNOP" to authenticate
```

**Test Data:**
- User: `{ email: "quinn@example.com", mfa_methods: ["totp"], recovery_codes_count: 8 }`
- Recovery code: `"ABCD-EFGH-IJKL-MNOP"` (seeded with known hash)

**Preconditions:**
- User has valid session challenge token from primary credential authentication
- User has unused recovery codes in `recovery_codes` table

---

### T-8.2: "Use a recovery code instead" link appears on SMS OTP challenge screen
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: Recovery code fallback link is visible on SMS OTP MFA challenge screen
    Given a user with email "rosa@example.com" has SMS OTP enrolled and valid recovery codes
    When the user reaches the SMS OTP MFA challenge screen during login (MFA-04)
    Then a link labeled "Use a recovery code instead" is visible on the challenge screen
    And clicking the link presents a recovery code entry field
    And the entry field accepts the recovery code format "XXXX-XXXX-XXXX-XXXX"
```

**Test Data:**
- User: `{ email: "rosa@example.com", mfa_methods: ["sms"], recovery_codes_count: 8 }`

**Preconditions:**
- User has valid session challenge token
- User has unused recovery codes

---

### T-9.1: Account lockout triggered after 5 failed recovery code submissions
**Maps to:** AC-9
**Category:** security

```gherkin
  Scenario: Account is locked out after 5 failed recovery code submissions
    Given a user with email "sam@example.com" is on the recovery code entry screen
    And the user has not yet failed any submissions
    When the user submits an invalid recovery code "XXXX-XXXX-XXXX-XXXX" five times consecutively
    Then after the 5th failure the account is locked for 15 minutes per RATE-01
    And the response indicates the account is temporarily locked
    And each failed attempt writes a `recovery_code_failed` event to `auth_audit_log`
    And the failed submission count is tracked against the same account-level counter as login failures
```

**Test Data:**
- User: `{ email: "sam@example.com", id: "user-uuid-sam" }`
- Invalid code (repeated): `"XXXX-XXXX-XXXX-XXXX"`
- Expected lockout duration: 15 minutes
- Expected audit events: 5 × `{ event_type: "recovery_code_failed", user_id: "user-uuid-sam" }`

**Preconditions:**
- User has valid challenge token (primary authentication passed)
- Account-level failed attempt counter starts at 0

---

### T-9.2: Failed login attempts and failed recovery code attempts share the same lockout counter
**Maps to:** AC-9
**Category:** security

```gherkin
  Scenario: Combined login failures and recovery code failures trigger lockout at 5 total
    Given a user with email "tara@example.com" has already failed 3 primary login attempts
    And the user's account-level failed attempt counter is at 3
    When the user submits an invalid recovery code twice on the recovery code entry screen
    Then after the 2nd failed recovery code submission the account is locked (total = 5)
    And the lockout applies to both login and recovery code entry
```

**Test Data:**
- User: `{ email: "tara@example.com" }`
- Pre-state: failed attempt counter = 3
- Invalid recovery code: `"YYYY-YYYY-YYYY-YYYY"`

**Preconditions:**
- Account-level counter is seeded at 3 in test database
- User has valid challenge token for recovery code entry

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated recovery code submission is rejected with 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Recovery code redemption endpoint requires a valid challenge token
    Given no valid challenge token is present in the request
    When a POST request is made to "/auth/mfa/recovery-code" with body `{ "code": "ABCD-EFGH-IJKL-MNOP" }`
    Then the response status is 401 Unauthorized
    And the response body contains an error indicating authentication is required
    And no code lookup is performed
    And no audit event is written
```

**Test Data:**
- Request: `POST /auth/mfa/recovery-code` with no Authorization header and no session cookie
- Payload: `{ "code": "ABCD-EFGH-IJKL-MNOP" }`

**Preconditions:**
- No session or challenge token in request context

---

### T-AUTH-2.1: Cross-user recovery code access returns 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated user cannot view or regenerate another user's recovery codes
    Given user "uma@example.com" is authenticated with a valid session token
    When they make a GET request to "/users/target-user-uuid-456/recovery-codes"
    And they make a POST request to "/users/target-user-uuid-456/recovery-codes/regenerate"
    Then both responses return 403 Forbidden
    And the response body does not contain recovery code data for the target user
    And the requesting user's own codes are not affected
```

**Test Data:**
- Requesting user: `{ email: "uma@example.com", id: "user-uuid-uma" }`
- Target user: `{ id: "target-user-uuid-456" }` (different user)

**Preconditions:**
- Requesting user is authenticated with valid session
- Target user exists and has recovery codes in database

---

---

# Test Specifications: MFA-06 — Platform Super Admin Recovery Code Reset

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, edge-case |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1 | security |
| AC-4 | T-4.1, T-4.2 | happy-path |
| AC-5 | T-5.1, T-5.2 | security |
| AC-6 | T-6.1 | error-handling |
| AC-7 | T-7.1, T-7.2 | edge-case |
| AC-8 | T-8.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Super Admin can search for a user and sees recovery code status
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Platform Super Admin Recovery Code Reset

  Scenario: Super Admin searches for a user and views their MFA and recovery code status
    Given a Platform Super Admin with email "admin@platform.com" is authenticated
    And a user "victim@example.com" exists with all 8 recovery codes exhausted
    When the Super Admin searches for "victim@example.com" in the Super Admin user management panel
    Then the user's account is displayed
    And the MFA status section shows that all recovery codes are exhausted
    And the "Reset Recovery Codes" button is visible
    And the button is enabled (not grayed out)
```

**Test Data:**
- Super Admin: `{ email: "admin@platform.com", role: "platform_super_admin" }`
- Target user: `{ email: "victim@example.com", recovery_codes_remaining: 0, mfa_enrolled: true }`

**Preconditions:**
- Super Admin is authenticated with valid session
- Target user exists with all recovery codes exhausted (all rows in `recovery_codes` have `used_at` set)

---

### T-1.2: "Reset Recovery Codes" button is greyed out for users with no MFA enrolled
**Maps to:** AC-1, NFR error handling
**Category:** edge-case

```gherkin
  Scenario: Reset action is disabled for a user with no MFA enrollment
    Given a Platform Super Admin "admin@platform.com" is authenticated
    And a user "noenroll@example.com" exists with no MFA methods enrolled and no recovery codes
    When the Super Admin views the user's account in the management panel
    Then the "Reset Recovery Codes" button is visible but disabled (grayed out)
    And a tooltip on the button reads "This user has no MFA enrolled"
```

**Test Data:**
- Target user: `{ email: "noenroll@example.com", mfa_enrolled: false, recovery_codes: [] }`

**Preconditions:**
- Target user exists with no MFA enrollment records

---

### T-2.1: Reset generates 8 new codes emailed to user and invalidates existing codes
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Confirmed reset generates new codes, invalidates old ones, and emails user
    Given a Platform Super Admin "admin@platform.com" has confirmed the reset for user "victim@example.com"
    And the user has 3 unused recovery code rows in `recovery_codes`
    When the reset is executed
    Then all 3 existing unused code rows have `invalidated_at` set to the current timestamp
    And 8 new recovery codes are generated per MFA-05 AC-1 standards (format, entropy, character set)
    And an email is sent to "victim@example.com" with subject "Your account recovery codes have been reset"
    And the email body contains all 8 new recovery codes in plaintext
    And no plaintext code is written to the database, logs, or audit records
    And the 8 new code rows appear in `recovery_codes` with `used_at = null` and `invalidated_at = null`
```

**Test Data:**
- Super Admin: `{ email: "admin@platform.com", id: "admin-uuid-001" }`
- Target user: `{ email: "victim@example.com", id: "user-uuid-victim" }`
- Pre-state: 3 unused rows in `recovery_codes` for target user
- Expected email subject: `"Your account recovery codes have been reset"`

**Preconditions:**
- Super Admin has clicked "Confirm Reset" in confirmation dialog
- Email delivery is instrumented to capture sent messages in test environment

---

### T-2.2: New codes sent in email match bcrypt hashes stored in database
**Maps to:** AC-2, AC-3
**Category:** security

```gherkin
  Scenario: New codes emailed to user are verifiable against stored bcrypt hashes
    Given a reset has been completed for user "verify@example.com"
    And the email capture contains 8 plaintext codes from the reset email
    When each plaintext code from the email is tested against the corresponding `code_hash` in `recovery_codes`
    Then all 8 bcrypt hash comparisons return true
    And no extra rows were inserted (exactly 8 new rows exist with `invalidated_at = null`)
```

**Test Data:**
- 8 captured plaintext codes from email
- 8 `code_hash` values from `recovery_codes` table (newest 8 rows for target user)
- bcrypt verification: `bcrypt.check(plaintext_code, code_hash)` for each pair

**Preconditions:**
- Reset completed successfully
- Email captured with all 8 codes
- Database accessible for direct comparison

---

### T-3.1: New codes are bcrypt-hashed with cost factor ≥ 12 before storage
**Maps to:** AC-3
**Category:** security

```gherkin
  Scenario: Recovery codes inserted during admin reset are stored as bcrypt hashes with cost >= 12
    Given a Super Admin "admin@platform.com" has just executed a reset for "hashed@example.com"
    When the 8 new rows in `recovery_codes` are inspected
    Then each `code_hash` starts with "$2b$12$" (bcrypt, cost factor 12 minimum)
    And no column in the row contains a plaintext code value
    And the application logs do not contain any of the 8 plaintext code values
```

**Test Data:**
- Expected hash prefix: `$2b$12$`
- Log search pattern: none of the 8 emailed code values should appear in logs

**Preconditions:**
- Reset completed within the test run (fresh rows available)
- Log capture available for assertion

---

### T-4.1: Audit log entry contains all required fields after successful reset
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Successful reset writes a complete audit log entry identifying the Super Admin
    Given Super Admin "admin@platform.com" (id: "admin-uuid-001") has reset recovery codes for "victim@example.com" (id: "user-uuid-victim", org: "org-uuid-abc")
    When the reset completes successfully
    Then an event is written to `auth_audit_log` with:
      | field                  | value                               |
      | event_type             | "recovery_codes_reset_by_admin"     |
      | target_user_id         | "user-uuid-victim"                  |
      | target_organization_id | "org-uuid-abc"                      |
      | performed_by_user_id   | "admin-uuid-001"                    |
      | performed_by_email     | "admin@platform.com"                |
      | created_at             | (non-null timestamp)                |
```

**Test Data:**
- Super Admin: `{ id: "admin-uuid-001", email: "admin@platform.com" }`
- Target user: `{ id: "user-uuid-victim", organization_id: "org-uuid-abc" }`

**Preconditions:**
- Reset completed successfully
- `auth_audit_log` table accessible for assertion

---

### T-4.2: Failed reset attempt is also written to audit log
**Maps to:** AC-4
**Category:** error-handling

```gherkin
  Scenario: Failed reset (email delivery failure) still writes an audit log entry
    Given Super Admin "admin@platform.com" has confirmed a reset for "failmail@example.com"
    And the email delivery system is configured to return a delivery failure
    When the reset is attempted
    Then an event is written to `auth_audit_log` with `event_type = "recovery_codes_reset_by_admin"` and `outcome = "failed"`
    And the audit entry contains the Super Admin's identity fields
```

**Test Data:**
- Email delivery: simulated failure (SMTP timeout or rejection)

**Preconditions:**
- Email delivery is fault-injected to fail
- Audit log is writable

---

### T-5.1: Org Admin cannot see the "Reset Recovery Codes" action in the UI
**Maps to:** AC-5
**Category:** security

```gherkin
  Scenario: Org Admin UI does not show the reset recovery codes action
    Given an authenticated Org Admin "orgadmin@example.com" with role "org_admin"
    And a user "member@example.com" exists in the same organization with exhausted recovery codes
    When the Org Admin views the user's profile in their user management panel
    Then the "Reset Recovery Codes" button is NOT present in the UI
    And no reset action is accessible via the Org Admin interface
```

**Test Data:**
- Org Admin: `{ email: "orgadmin@example.com", role: "org_admin" }`
- Target user: `{ email: "member@example.com", same_org: true }`

**Preconditions:**
- Org Admin is authenticated with valid session
- Target user exists in the same org

---

### T-5.2: Direct API call to reset endpoint by Org Admin returns 403
**Maps to:** AC-5
**Category:** security

```gherkin
  Scenario: Org Admin making a direct API call to the reset endpoint receives 403
    Given an authenticated Org Admin "orgadmin@example.com" with a valid session token
    When they make a POST request to "/admin/users/user-uuid-member/recovery-codes/reset"
    Then the response status is 403 Forbidden
    And the response body contains "This action requires Platform Super Admin permissions."
    And no codes are generated or invalidated
```

**Test Data:**
- Requesting user: `{ email: "orgadmin@example.com", role: "org_admin" }`
- Endpoint: `POST /admin/users/user-uuid-member/recovery-codes/reset`

**Preconditions:**
- Org Admin session token is valid
- Target user exists and has recovery codes

---

### T-6.1: Reset is rolled back and no orphaned codes remain when email delivery fails
**Maps to:** AC-6
**Category:** error-handling

```gherkin
  Scenario: Email delivery failure causes complete rollback — no orphaned codes remain
    Given Super Admin "admin@platform.com" has confirmed a reset for "rollback@example.com"
    And the user has 3 existing unused recovery code rows
    And the email delivery system returns a delivery failure after codes are generated
    When the reset is attempted
    Then the 3 previously-existing unused code rows are NOT invalidated (remain with `invalidated_at = null`)
    And no new code rows were added to `recovery_codes`
    And the Super Admin sees the error "We couldn't send the recovery codes to the user's email. The reset was not completed. Please verify the user's email address and try again."
    And the failed attempt is written to `auth_audit_log`
```

**Test Data:**
- Target user: `{ email: "rollback@example.com" }` with 3 unused recovery codes
- Email outcome: delivery failure (fault-injected after code generation)

**Preconditions:**
- Fault injection configured to fail email send after code generation completes
- Pre-state: 3 unused code rows exist in database

---

### T-7.1: Confirmation dialog displays user email and warning before reset executes
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: Confirmation dialog shows correct user email and warning text before reset
    Given Super Admin "admin@platform.com" is viewing "target@example.com"'s account
    When the Super Admin clicks "Reset Recovery Codes"
    Then a confirmation dialog appears containing the text "target@example.com"
    And the dialog contains the warning "This will invalidate all existing recovery codes. New codes will be emailed directly to the user."
    And the dialog has two buttons: "Confirm Reset" and "Cancel"
    And the reset is NOT executed yet (no codes generated, no email sent)
```

**Test Data:**
- Target user email: `"target@example.com"`

**Preconditions:**
- Super Admin has navigated to the target user's account page
- Email capture confirms no email was sent before "Confirm Reset" is clicked

---

### T-7.2: Clicking "Cancel" in confirmation dialog leaves all codes unchanged
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: Canceling the confirmation dialog does not modify any recovery codes
    Given Super Admin "admin@platform.com" has triggered the confirmation dialog for "cancel@example.com"
    And the user has 5 existing unused recovery codes
    When the Super Admin clicks "Cancel" in the confirmation dialog
    Then the dialog is dismissed
    And the 5 unused recovery code rows remain with `invalidated_at = null`
    And no new code rows are added
    And no email is sent to "cancel@example.com"
```

**Test Data:**
- Target user: `{ email: "cancel@example.com" }` with 5 unused codes

**Preconditions:**
- Confirmation dialog is open
- Email capture confirms no email sent

---

### T-8.1: Used code rows are preserved after admin reset
**Maps to:** AC-8
**Category:** edge-case

```gherkin
  Scenario: Admin reset preserves previously used code rows in the database
    Given user "history@example.com" has 2 codes with `used_at` set (used on "2026-06-01" and "2026-06-05") and 6 unused codes
    When a Super Admin executes a successful reset
    Then the 2 previously used rows remain in `recovery_codes` with their original `used_at` timestamps ("2026-06-01" and "2026-06-05")
    And those rows do NOT have `invalidated_at` set
    And the 6 unused rows now have `invalidated_at` set
    And 8 new rows are inserted with `used_at = null` and `invalidated_at = null`
    And the total row count for the user is 16 (2 used + 6 invalidated + 8 new)
```

**Test Data:**
- User: `{ email: "history@example.com" }`
- Pre-state: 2 rows with `used_at` set; 6 rows with `used_at = null`
- Expected post-state: 16 total rows (2 used, 6 invalidated, 8 new active)

**Preconditions:**
- Database seeded with 8 rows: 2 with `used_at` set, 6 without

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to reset endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Reset endpoint rejects requests with no authentication token
    Given no valid authentication token is present in the request
    When a POST request is made to "/admin/users/user-uuid-victim/recovery-codes/reset"
    Then the response status is 401 Unauthorized
    And no codes are generated or invalidated
    And no audit log entry is written
```

**Test Data:**
- Request: `POST /admin/users/user-uuid-victim/recovery-codes/reset` with no Authorization header and no session cookie

**Preconditions:**
- No session active for the request

---

### T-AUTH-2.1: End user attempting reset endpoint receives 403 with role identified
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Regular end user is rejected from reset endpoint with 403 and role info
    Given an authenticated user "enduser@example.com" with role "member"
    When they POST to "/admin/users/other-user-uuid/recovery-codes/reset"
    Then the response status is 403 Forbidden
    And the response body contains "Requires: platform_super_admin role. Your role: member"
    And no codes are modified
```

**Test Data:**
- Requesting user: `{ email: "enduser@example.com", role: "member" }`

**Preconditions:**
- Valid session token present in request

---

### T-AUTH-2.2: Security Team member is rejected from reset endpoint with 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Security Team role is also rejected from the reset endpoint
    Given an authenticated user "security@example.com" with role "security_team"
    When they POST to "/admin/users/some-user-uuid/recovery-codes/reset"
    Then the response status is 403 Forbidden
    And the response body contains "Requires: platform_super_admin role. Your role: security_team"
```

**Test Data:**
- Requesting user: `{ email: "security@example.com", role: "security_team" }`

**Preconditions:**
- Valid session token for security_team user

---

---

# Test Specifications: POLICY-01 — Mandatory MFA Enforcement for Admin and Billing-Access Roles

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1 | edge-case |
| AC-4 | T-4.1, T-4.2 | edge-case |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1, T-6.2 | security |
| AC-7 | T-7.1, T-7.2 | edge-case |
| AC-8 | T-8.1, T-8.2 | happy-path |
| AC-9 | T-9.1 | boundary |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: org_admin user with MFA enrolled is challenged at login
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Mandatory MFA Enforcement for Privileged Roles

  Scenario: Org Admin with MFA enrolled receives MFA challenge after password authentication
    Given a user "admin@company.com" with role "org_admin" has TOTP enrolled
    When the user successfully authenticates with email "admin@company.com" and password "AdminP@ss2026!"
    Then the system presents an MFA challenge screen before granting access
    And the user is NOT redirected to the application dashboard until the MFA challenge is passed
    And passing the TOTP challenge with a valid code grants access to the application
```

**Test Data:**
- User: `{ email: "admin@company.com", role: "org_admin", mfa_enrolled: true, mfa_method: "totp" }`
- Password: `"AdminP@ss2026!"`

**Preconditions:**
- User exists with `org_admin` role
- TOTP is enrolled and active
- MFA enforcement feature flag is active

---

### T-1.2: platform_super_admin and billing_access users are also challenged
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario Outline: All three privileged roles receive MFA challenge after login
    Given a user "<email>" with role "<role>" has an MFA method enrolled
    When the user authenticates with their primary credentials
    Then the system presents an MFA challenge before granting access

    Examples:
      | email                        | role                   |
      | superadmin@platform.com      | platform_super_admin   |
      | billing@company.com          | billing_access         |
      | orgadmin2@company.com        | org_admin              |
```

**Test Data:**
- All three users have TOTP enrolled
- Passwords: each set to `"ValidPass!2026"`

**Preconditions:**
- All three users exist in the database with the specified roles
- All three have TOTP enrolled

---

### T-2.1: org_admin with no MFA hits enrollment wall immediately at login
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Org Admin with no MFA enrolled hits enrollment wall after password auth
    Given a user "newadmin@company.com" with role "org_admin" has no MFA method enrolled
    When the user authenticates with email "newadmin@company.com" and password "NewAdmin!2026"
    Then the system redirects to the MFA enrollment wall
    And the enrollment wall displays "MFA enrollment is required for your role before you can continue"
    And no "skip" button is present
    And no "remind me later" option is present
    And the user cannot navigate to any other application page
```

**Test Data:**
- User: `{ email: "newadmin@company.com", role: "org_admin", mfa_enrolled: false }`
- Password: `"NewAdmin!2026"`

**Preconditions:**
- User exists with `org_admin` role
- No MFA methods in `mfa_enrollments` table for this user

---

### T-2.2: billing_access user with no MFA enrolled hits enrollment wall
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Billing access user with no MFA enrolled hits enrollment wall
    Given a user "billing@company.com" with role "billing_access" has no MFA enrolled
    When the user authenticates with their primary credentials
    Then the system displays the MFA enrollment wall with required enrollment message
    And the user cannot proceed without completing MFA enrollment
```

**Test Data:**
- User: `{ email: "billing@company.com", role: "billing_access", mfa_enrolled: false }`

**Preconditions:**
- User exists with `billing_access` role and no MFA enrollment

---

### T-3.1: Org-level grace period does not apply to privileged role users
**Maps to:** AC-3
**Category:** edge-case

```gherkin
  Scenario: Privileged role user hits enrollment wall even when org grace period is active
    Given the organization "company.com" has MFA enforcement enabled with a 7-day grace period (grace period not expired)
    And the current date is within the grace period (e.g., day 3 of 7)
    And a user "privileged@company.com" with role "org_admin" has no MFA enrolled
    When the user logs in
    Then the system shows the enrollment wall immediately
    And does NOT show the grace period banner ("MFA enrollment required by [date]")
    And no "skip" or grace period deferral option is available
```

**Test Data:**
- Org: `{ mfa_enforcement_enabled: true, grace_period_ends_at: "2026-06-20T00:00:00Z" }` (current date: `2026-06-15`, within grace period)
- User: `{ email: "privileged@company.com", role: "org_admin", mfa_enrolled: false }`

**Preconditions:**
- Org has POLICY-02 grace period active
- User has a privileged role with no MFA enrolled

---

### T-4.1: User promoted to org_admin faces enforcement on their very next login
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: Newly promoted org_admin faces MFA enforcement on next login
    Given a user "promoted@company.com" previously had role "member" with no MFA required
    And the user's role was changed to "org_admin" at "2026-06-15T08:00:00Z"
    And the user has no MFA enrolled
    When the user logs in at "2026-06-15T09:00:00Z" (after role change)
    Then the system shows the MFA enrollment wall
    And the user cannot access the application without enrolling in MFA
```

**Test Data:**
- User: `{ email: "promoted@company.com", role: "org_admin", mfa_enrolled: false, role_assigned_at: "2026-06-15T08:00:00Z" }`
- Login attempt at: `2026-06-15T09:00:00Z`

**Preconditions:**
- Role change has been persisted in the database before the login attempt

---

### T-4.2: Previously active session without MFA is not retroactively invalidated at time of role change
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: Existing session remains valid during the session it was created in despite role promotion
    Given a user "active@company.com" is logged in with an active session as a "member" (no MFA required at login time)
    And the user's role is changed to "org_admin" while they are logged in
    When the user continues browsing the application in the same session
    Then their current session remains valid for the duration of that session
    And enforcement applies only when the user logs in again (next authentication)
```

**Test Data:**
- User: `{ email: "active@company.com", role_at_login: "member", current_role: "org_admin" }`

**Preconditions:**
- Active session token exists from login before role promotion
- Role change occurs mid-session

---

### T-5.1: User completing enrollment on the wall immediately gets MFA challenge and access
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: User who enrolls during the enforcement wall gets MFA challenged and granted access
    Given a user "wallenroll@company.com" with role "org_admin" has no MFA enrolled
    And the user has been redirected to the enrollment wall
    When the user successfully enrolls in TOTP via the enrollment wall flow
    Then the system immediately treats the user as MFA-enrolled
    And presents the MFA challenge for the current login session (prompts for TOTP code)
    And upon passing the TOTP challenge, grants access to the application dashboard
```

**Test Data:**
- User: `{ email: "wallenroll@company.com", role: "org_admin", mfa_enrolled: false }`
- TOTP enrollment: completed with valid TOTP code during wall flow

**Preconditions:**
- User is on the enrollment wall (intercepted after primary credential auth)

---

### T-6.1: Direct URL navigation is blocked for unenrolled privileged user on enrollment wall
**Maps to:** AC-6
**Category:** security

```gherkin
  Scenario: Unenrolled privileged user cannot bypass enrollment wall via direct URL
    Given a user "bypass@company.com" with role "org_admin" has no MFA enrolled
    And the user is currently intercepted on the enrollment wall
    When the user attempts to navigate directly to "/dashboard" by entering the URL in the browser
    Then the system redirects them back to the enrollment wall
    And the dashboard is not rendered or accessible
```

**Test Data:**
- User: `{ email: "bypass@company.com", role: "org_admin", mfa_enrolled: false }`
- Attempted URL: `"/dashboard"`

**Preconditions:**
- User has a valid session token (primary credential passed) but no MFA challenge completed
- User is on the enrollment wall page

---

### T-6.2: Deep-link navigation and browser back button are both blocked
**Maps to:** AC-6
**Category:** security

```gherkin
  Scenario Outline: Unenrolled privileged user is redirected from any deep link back to enrollment wall
    Given a user "bypass2@company.com" with role "org_admin" has no MFA enrolled and is on the enrollment wall
    When the user attempts to navigate to "<target_url>"
    Then the system redirects to the enrollment wall
    And the target page content is not returned

    Examples:
      | target_url          |
      | /settings/billing   |
      | /admin/users        |
      | /reports            |
      | /api/org/members    |
```

**Test Data:**
- User: `{ email: "bypass2@company.com", role: "org_admin", mfa_enrolled: false }`

**Preconditions:**
- User's session reflects post-primary-auth state (not yet MFA-challenged or enrolled)

---

### T-7.1: Deployment report lists all unenrolled privileged users with required fields
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: Deployment report is generated with all unenrolled privileged users
    Given the POLICY-01 enforcement feature is deployed to production
    And 3 users with privileged roles ("admin1@co.com" org_admin, "admin2@co.com" platform_super_admin, "billing1@co.com" billing_access) have no MFA enrolled
    And 2 other privileged users ("admin3@co.com" org_admin, "admin4@co.com" billing_access) already have MFA enrolled
    When the deployment completes
    Then a report is generated containing entries for "admin1@co.com", "admin2@co.com", and "billing1@co.com"
    And each entry includes: user ID, display name, email, role(s), organization ID
    And enrolled users "admin3@co.com" and "admin4@co.com" are NOT in the report
    And the report is delivered to the configured destination (Super Admin UI or security team email)
```

**Test Data:**
- Unenrolled privileged users:
  - `{ id: "u1", name: "Admin One", email: "admin1@co.com", role: "org_admin", org_id: "org-001" }`
  - `{ id: "u2", name: "Admin Two", email: "admin2@co.com", role: "platform_super_admin", org_id: "org-002" }`
  - `{ id: "u3", name: "Billing One", email: "billing1@co.com", role: "billing_access", org_id: "org-001" }`
- Enrolled privileged users: `admin3@co.com`, `admin4@co.com`

**Preconditions:**
- Deployment script or migration runner is instrumented to trigger report generation
- Database seeded with the above users and their enrollment states

---

### T-7.2: Deployment report generation failure is alerted — no silent success
**Maps to:** AC-7, NFR error handling
**Category:** edge-case

```gherkin
  Scenario: Deployment report generation failure triggers alert and does not silently succeed
    Given the reporting mechanism is configured to fail (database read error)
    When the deployment completes and report generation is triggered
    Then the error is written to the system event log
    And an on-call alert is fired
    And the deployment process does not report the report generation as a success
```

**Test Data:**
- Fault injection: database read failure during report generation query

**Preconditions:**
- Fault injection configured to simulate database read timeout

---

### T-8.1: MFA challenge events are written to audit log with enforcement_context
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: MFA challenge success for privileged user is logged with role_mandate context
    Given a user "auditme@company.com" with role "org_admin" has TOTP enrolled
    When the user authenticates and passes the MFA challenge
    Then an audit log entry is written for the MFA challenge initiated event
    And an audit log entry is written for the MFA challenge succeeded event
    And each audit entry contains:
      | field                | value                              |
      | event_type           | "mfa_challenge_initiated" / "mfa_challenge_succeeded" |
      | user_id              | (auditme user's ID)               |
      | organization_id      | (auditme user's org ID)           |
      | timestamp            | (current timestamp)               |
      | ip_address           | "192.168.1.100"                   |
      | user_agent           | "Mozilla/5.0 ..."                 |
      | outcome              | "success"                         |
      | enforcement_context  | "role_mandate"                    |
```

**Test Data:**
- User: `{ email: "auditme@company.com", role: "org_admin", id: "user-audit-uuid" }`
- Request IP: `192.168.1.100`
- User-Agent: `"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"`

**Preconditions:**
- User is authenticated via primary credential
- Valid TOTP code submitted for challenge

---

### T-8.2: MFA enrollment completed via enforcement wall is logged with enforcement_context
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: MFA enrollment on enforcement wall is logged with role_mandate context
    Given a user "wallenroll2@company.com" with role "billing_access" has no MFA enrolled
    When the user completes MFA enrollment via the enforcement wall
    Then an audit log entry is written with:
      | field               | value                          |
      | event_type          | "mfa_enrollment_completed"     |
      | user_id             | (wallenroll2 user's ID)        |
      | outcome             | "success"                      |
      | enforcement_context | "role_mandate"                 |
```

**Test Data:**
- User: `{ email: "wallenroll2@company.com", role: "billing_access", mfa_enrolled: false }`

**Preconditions:**
- User is on the enrollment wall (intercepted after primary auth)

---

### T-9.1: Non-privileged member user is not challenged or blocked when org has no MFA policy
**Maps to:** AC-9
**Category:** boundary

```gherkin
  Scenario: Regular member user is not blocked by POLICY-01 when org MFA enforcement is not active
    Given a user "member@company.com" with role "member" has no MFA enrolled
    And the organization has no org-wide MFA enforcement enabled (POLICY-02 not active)
    When the user logs in with valid credentials
    Then the user is granted access to the application immediately
    And no MFA challenge is presented
    And no enrollment wall is shown
    And the login audit event has no `enforcement_context` field set to "role_mandate"
```

**Test Data:**
- User: `{ email: "member@company.com", role: "member", mfa_enrolled: false }`
- Org: `{ mfa_enforcement_enabled: false }`

**Preconditions:**
- POLICY-02 org-wide enforcement is not enabled for this organization
- POLICY-01 enforcement is active (to confirm non-privileged users are excluded)

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to MFA enforcement configuration endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Enforcement check endpoint rejects unauthenticated requests with 401
    Given no valid authentication token is present
    When a GET request is made to "/admin/enforcement/role-mfa-status"
    Then the response status is 401 Unauthorized
    And no enforcement data is returned
```

**Test Data:**
- Request: `GET /admin/enforcement/role-mfa-status` with no Authorization header

**Preconditions:**
- No session or token in request

---

### T-AUTH-2.1: Org Admin cannot access privileged role MFA enforcement configuration
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Org Admin is rejected from POLICY-01 configuration endpoints with 403
    Given an authenticated Org Admin "orgadmin@company.com" with role "org_admin"
    When they GET "/admin/enforcement/role-mfa-config"
    And they GET "/admin/enforcement/unenrolled-report"
    Then both responses return 403 Forbidden
    And each response body contains the required permission identifier
```

**Test Data:**
- Requesting user: `{ email: "orgadmin@company.com", role: "org_admin" }`

**Preconditions:**
- Valid session token for org_admin user

---

---

# Test Specifications: POLICY-02 — Org-Wide MFA Enforcement with 7-Day Grace Period

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path, edge-case |
| AC-3 | T-3.1 | edge-case |
| AC-4 | T-4.1, T-4.2 | happy-path, error-handling |
| AC-5 | T-5.1, T-5.2 | happy-path |
| AC-6 | T-6.1 | boundary |
| AC-7 | T-7.1, T-7.2 | happy-path |
| AC-8 | T-8.1 | edge-case |
| AC-9 | T-9.1 | boundary |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Org Admin enables org-wide MFA enforcement and grace period is set
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Org-Wide MFA Enforcement with 7-Day Grace Period

  Scenario: Org Admin enables MFA enforcement and system sets correct grace period
    Given an authenticated Org Admin "admin@myorg.com" on the policy settings UI for organization "myorg"
    When the Org Admin enables "Require MFA for all users" and saves the setting at "2026-06-15T10:00:00Z"
    Then the organization record has `mfa_enforcement_enabled = true`
    And `grace_period_ends_at` is set to "2026-06-22T10:00:00Z" (exactly 7 days from save)
    And an audit log entry is written with event_type "org_mfa_enforcement_enabled"
    And a POLICY-04 email notification is sent to all Org Admins in "myorg"
    And the settings UI confirms the setting is active and displays "MFA enrollment required by June 22, 2026"
```

**Test Data:**
- Org Admin: `{ email: "admin@myorg.com", role: "org_admin", org_id: "myorg-uuid" }`
- Save timestamp: `"2026-06-15T10:00:00Z"`
- Expected `grace_period_ends_at`: `"2026-06-22T10:00:00Z"`
- POLICY-04 recipients: all `org_admin` role users in "myorg"

**Preconditions:**
- Org Admin authenticated with valid session
- Organization exists and is accessible to the Org Admin
- POLICY-04 email service is instrumented to capture sent messages

---

### T-1.2: Policy save fails gracefully if database write fails
**Maps to:** AC-1, NFR error handling
**Category:** error-handling

```gherkin
  Scenario: Failed database write on policy save shows error without partial state
    Given an authenticated Org Admin "admin@myorg.com" on the policy settings UI
    And the database is configured to fail on the policy update write
    When the Org Admin enables "Require MFA for all users" and saves
    Then the response shows "Failed to save policy. Please try again."
    And `mfa_enforcement_enabled` remains unchanged (false)
    And `grace_period_ends_at` is not set
    And no POLICY-04 notification email is sent
```

**Test Data:**
- Fault injection: database write timeout on org policy UPDATE

**Preconditions:**
- Fault injection configured before the test
- Org Admin is authenticated

---

### T-2.1: Unenrolled user sees persistent banner from day 1 of grace period
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Unenrolled user sees banner during active grace period from day 1
    Given org "myorg" has `mfa_enforcement_enabled = true` and `grace_period_ends_at = "2026-06-22T10:00:00Z"`
    And the current timestamp is "2026-06-15T12:00:00Z" (day 1 of 7)
    And user "member@myorg.com" with role "member" has no MFA enrolled
    When the user loads any page in the application (e.g., "/dashboard")
    Then a persistent banner is displayed at the top of the page
    And the banner text includes "MFA enrollment required by June 22, 2026"
    And the banner contains an "[Enroll now]" link pointing to the MFA enrollment flow
    And the user can still navigate to other pages (banner does not block navigation)
```

**Test Data:**
- Org: `{ mfa_enforcement_enabled: true, grace_period_ends_at: "2026-06-22T10:00:00Z" }`
- Current time: `"2026-06-15T12:00:00Z"`
- User: `{ email: "member@myorg.com", role: "member", mfa_enrolled: false }`

**Preconditions:**
- Org policy is active
- User is authenticated with valid session
- Current time is mocked to a value within the grace period (day 1)

---

### T-2.2: Banner is not shown to unenrolled user from a different org
**Maps to:** AC-2
**Category:** edge-case

```gherkin
  Scenario: Enforcement banner from org A does not appear for user in org B
    Given org "orgA" has MFA enforcement active with grace period
    And org "orgB" has no MFA enforcement enabled
    And user "member@orgB.com" belongs to "orgB" with no MFA enrolled
    When the user "member@orgB.com" loads any page
    Then NO enforcement banner is displayed
    And the user navigates the application normally without MFA enforcement
```

**Test Data:**
- Org A: `{ mfa_enforcement_enabled: true }`, Org B: `{ mfa_enforcement_enabled: false }`
- User: `{ email: "member@orgB.com", org: "orgB", mfa_enrolled: false }`

**Preconditions:**
- Two organizations exist with different enforcement states
- User is authenticated in org B's context

---

### T-3.1: Banner escalates to urgent style when 2 or fewer days remain
**Maps to:** AC-3
**Category:** edge-case

```gherkin
  Scenario: Banner renders in urgent style when grace period has 2 days remaining
    Given org "myorg" has `grace_period_ends_at = "2026-06-22T10:00:00Z"`
    And the current timestamp is "2026-06-20T11:00:00Z" (approximately 2 days before expiry)
    And user "member@myorg.com" has no MFA enrolled
    When the user loads any page
    Then the banner is rendered in urgent/warning style (visually distinct — e.g., red or amber background)
    And the banner text includes language referencing the imminent deadline (e.g., "2 days left before your access is blocked")
    And the banner is still non-blocking (user can navigate)
```

**Test Data:**
- `grace_period_ends_at`: `"2026-06-22T10:00:00Z"`
- Current time mock: `"2026-06-20T11:00:00Z"` (about 46.8 hours before expiry, within the ≤ 2-day threshold)

**Preconditions:**
- Time is mocked to be within the 2-day threshold
- User is unenrolled and authenticated

---

### T-3.2: Banner is standard style at exactly day 5 boundary (3 days remaining)
**Maps to:** AC-3
**Category:** edge-case

```gherkin
  Scenario: Banner remains in standard (non-urgent) style when exactly 3 days remain
    Given org "myorg" has `grace_period_ends_at = "2026-06-22T10:00:00Z"`
    And the current timestamp is "2026-06-19T09:00:00Z" (approximately 3 days before expiry)
    And user "member@myorg.com" has no MFA enrolled
    When the user loads any page
    Then the banner is rendered in standard (non-urgent) style
    And the banner text does NOT use urgent language like "your access is blocked"
```

**Test Data:**
- `grace_period_ends_at`: `"2026-06-22T10:00:00Z"`
- Current time mock: `"2026-06-19T09:00:00Z"` (about 73 hours remaining, above the ≤ 2-day threshold)

**Preconditions:**
- Time is mocked to exactly 3 days before grace period end

---

### T-4.1: Unenrolled user hits enrollment wall after grace period expires
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Unenrolled user cannot log in after grace period ends
    Given org "myorg" has `grace_period_ends_at = "2026-06-22T10:00:00Z"`
    And the current timestamp is "2026-06-23T00:00:00Z" (after expiry)
    And user "blocked@myorg.com" with role "member" has no MFA enrolled
    When the user attempts to log in
    Then the system redirects to the mandatory MFA enrollment wall
    And the enrollment wall displays "Your organization requires MFA. You must enroll before continuing."
    And no "skip" or "remind me later" option is presented
    And the user cannot access any application page until enrollment is complete
```

**Test Data:**
- Org: `{ grace_period_ends_at: "2026-06-22T10:00:00Z" }`
- Current time mock: `"2026-06-23T00:00:00Z"` (after expiry)
- User: `{ email: "blocked@myorg.com", role: "member", mfa_enrolled: false }`

**Preconditions:**
- Grace period is expired (now > grace_period_ends_at)
- User has no MFA enrolled

---

### T-4.2: Grace period check failure defaults to showing banner (fail open conservatively)
**Maps to:** AC-4, NFR error handling
**Category:** error-handling

```gherkin
  Scenario: Grace period check failure causes banner to appear (never silently lifts enforcement)
    Given user "uncertain@myorg.com" with no MFA enrolled loads a page
    And the grace period check mechanism throws an exception during evaluation
    When the page load handler catches the error
    Then the persistent banner is displayed (enforcement applied conservatively)
    And the error is logged internally
    And the application does not silently treat the user as exempt from enforcement
```

**Test Data:**
- Fault injection: exception thrown during `grace_period_ends_at` check

**Preconditions:**
- Fault injection configured to simulate exception in grace period evaluation

---

### T-5.1: User enrolling during grace period has banner removed on next page load
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: User who enrolls during grace period sees banner removed on next page load
    Given org "myorg" has active enforcement with grace period in progress
    And user "enrollme@myorg.com" has no MFA enrolled and sees the persistent banner
    When the user navigates to the enrollment link and successfully completes TOTP enrollment
    And the user returns to the application (next page load)
    Then the persistent banner is no longer displayed
    And the MFA enrollment event is written to `auth_audit_log`
```

**Test Data:**
- User: `{ email: "enrollme@myorg.com", mfa_enrolled: false }` → after test: `mfa_enrolled: true`
- Expected audit event: `{ event_type: "mfa_enrollment_completed", user_id: "enrollme-uuid" }`

**Preconditions:**
- Grace period is active (not expired)
- User is authenticated and on a page showing the enforcement banner

---

### T-5.2: User enrolling after grace period expires gets access to application immediately
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: User on the enrollment wall (post-grace-period) gains access after completing enrollment
    Given the grace period has expired and user "lateenroll@myorg.com" is on the enrollment wall
    When the user completes MFA enrollment via the wall flow
    Then the user is granted access to the application dashboard
    And the enrollment wall is no longer shown
    And an audit log entry for enrollment completion is written with the org enforcement context
```

**Test Data:**
- User: `{ email: "lateenroll@myorg.com", mfa_enrolled: false }`
- Org: `{ grace_period_ends_at: "2026-06-14T00:00:00Z" }` (expired before current date of 2026-06-15)

**Preconditions:**
- Grace period is expired (enforced)
- User has just successfully completed enrollment on the enrollment wall

---

### T-6.1: Privileged role user (org_admin) hits POLICY-01 wall, not POLICY-02 grace period banner
**Maps to:** AC-6
**Category:** boundary

```gherkin
  Scenario: Org Admin user is subject to POLICY-01 immediate wall, not POLICY-02 grace period
    Given org "myorg" has MFA enforcement enabled with active grace period (day 3 of 7)
    And user "admin@myorg.com" with role "org_admin" has no MFA enrolled
    When the user logs in
    Then the enrollment wall is shown immediately (POLICY-01 behavior)
    And the grace period banner ("MFA enrollment required by [date]") is NOT shown
    And no "skip" or deferral option is available
```

**Test Data:**
- Org: `{ mfa_enforcement_enabled: true, grace_period_ends_at: "2026-06-22T10:00:00Z" }`
- Current time: `"2026-06-18T10:00:00Z"` (day 3 of 7 — within grace period)
- User: `{ email: "admin@myorg.com", role: "org_admin", mfa_enrolled: false }`

**Preconditions:**
- Both POLICY-01 and POLICY-02 enforcement logic is active
- User has `org_admin` role

---

### T-7.1: Org Admin disabling enforcement clears grace period and lifts restrictions
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: Org Admin disables enforcement and unenrolled users are no longer blocked
    Given org "myorg" has `mfa_enforcement_enabled = true` and `grace_period_ends_at = "2026-06-22T10:00:00Z"`
    And user "freed@myorg.com" has no MFA enrolled and currently sees the banner
    When the Org Admin "admin@myorg.com" disables "Require MFA for all users" and saves at "2026-06-16T09:00:00Z"
    Then `mfa_enforcement_enabled = false` for the organization
    And `grace_period_ends_at` is cleared (null)
    And user "freed@myorg.com" no longer sees the banner on their next page load
    And if "freed@myorg.com" is on the enrollment wall, they gain access without enrolling
    And an audit log entry is written with event_type "org_mfa_enforcement_disabled"
    And a POLICY-04 email notification is sent to all Org Admins
```

**Test Data:**
- Org Admin: `{ email: "admin@myorg.com", role: "org_admin" }`
- Org pre-state: `{ mfa_enforcement_enabled: true, grace_period_ends_at: "2026-06-22T10:00:00Z" }`
- Org post-state: `{ mfa_enforcement_enabled: false, grace_period_ends_at: null }`
- Save timestamp: `"2026-06-16T09:00:00Z"`

**Preconditions:**
- Org has enforcement active
- Multiple org admins exist for POLICY-04 notification test

---

### T-7.2: POLICY-04 notification email failure does not roll back the disable action
**Maps to:** AC-7, NFR error handling
**Category:** error-handling

```gherkin
  Scenario: Policy disable succeeds even if POLICY-04 notification email fails to send
    Given Org Admin "admin@myorg.com" disables org-wide MFA enforcement
    And the POLICY-04 email delivery fails after the policy is saved
    When the operation completes
    Then `mfa_enforcement_enabled` is set to false (policy change is persisted)
    And the email failure is logged for retry
    And the Org Admin's UI reflects the policy change as successful
    And a retry is queued for the notification email
```

**Test Data:**
- Email delivery: fault-injected to fail after database commit
- Expected behavior: database change committed, email logged for retry

**Preconditions:**
- Email delivery fault injection configured after database write succeeds

---

### T-8.1: Re-enabling enforcement after disable starts a fresh 7-day grace period
**Maps to:** AC-8
**Category:** edge-case

```gherkin
  Scenario: Re-enabling MFA enforcement resets grace period to now + 7 days
    Given org "myorg" had enforcement enabled at "2026-06-01T10:00:00Z" with grace period ending "2026-06-08T10:00:00Z"
    And enforcement was then disabled at "2026-06-10T10:00:00Z" (grace period had expired)
    When the Org Admin re-enables enforcement at "2026-06-15T10:00:00Z"
    Then `mfa_enforcement_enabled = true`
    And `grace_period_ends_at = "2026-06-22T10:00:00Z"` (new: now + 7 days)
    And unenrolled user "member@myorg.com" sees the banner again on next page load
    And the banner displays the new end date "June 22, 2026"
```

**Test Data:**
- Re-enable timestamp: `"2026-06-15T10:00:00Z"`
- Expected new `grace_period_ends_at`: `"2026-06-22T10:00:00Z"`
- User: `{ email: "member@myorg.com", mfa_enrolled: false }`

**Preconditions:**
- Org previously had enforcement enabled, then disabled
- Re-enable triggered at `"2026-06-15T10:00:00Z"` with time mocked

---

### T-9.1: Already-enrolled user sees no banner and experiences no disruption
**Maps to:** AC-9
**Category:** boundary

```gherkin
  Scenario: Enrolled user is unaffected by org-wide enforcement (grace period or expired)
    Given org "myorg" has active MFA enforcement (grace period active or expired)
    And user "enrolled@myorg.com" with role "member" has TOTP enrolled
    When the user logs in and navigates the application
    Then no enforcement banner is displayed
    And no enrollment wall appears
    And the user is prompted for MFA challenge at login as per normal TOTP flow
    And the application is accessible after passing the TOTP challenge
```

**Test Data:**
- Org: `{ mfa_enforcement_enabled: true }` (with or without expired grace period)
- User: `{ email: "enrolled@myorg.com", role: "member", mfa_enrolled: true, mfa_method: "totp" }`

**Preconditions:**
- Org has enforcement active
- User has at least one MFA method enrolled

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to org policy settings endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Policy settings endpoint rejects unauthenticated requests with 401
    Given no valid authentication token is present
    When a POST request is made to "/orgs/myorg-uuid/policy/mfa-enforcement" with body `{ "enabled": true }`
    Then the response status is 401 Unauthorized
    And the policy is not modified
    And no audit log entry is written
```

**Test Data:**
- Request: `POST /orgs/myorg-uuid/policy/mfa-enforcement` with no Authorization header
- Payload: `{ "enabled": true }`

**Preconditions:**
- No session or token in request
- Org exists in database

---

### T-AUTH-2.1: Regular member cannot enable or disable org-wide MFA enforcement
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Member role is rejected from org policy settings endpoint with 403
    Given an authenticated user "member@myorg.com" with role "member"
    When they POST to "/orgs/myorg-uuid/policy/mfa-enforcement" with body `{ "enabled": true }`
    And they DELETE to "/orgs/myorg-uuid/policy/mfa-enforcement"
    Then both responses return 403 Forbidden
    And each response body contains the required permission (e.g., "Requires: org_admin or platform_super_admin role. Your role: member")
    And the org policy is not modified in either case
```

**Test Data:**
- Requesting user: `{ email: "member@myorg.com", role: "member" }`
- Org: `{ id: "myorg-uuid" }`

**Preconditions:**
- Valid session token for member-role user
- Org policy state remains unchanged after both requests

---

## Boundary Tests

### T-BOUNDARY-POLICY02-1: Enforcement banner check fails open (never silently exempts)
**Maps to:** AC-4, NFR error handling
**Category:** boundary

```gherkin
  Scenario: Enforcement evaluation error resolves to showing the banner, not hiding it
    Given enforcement is active for org "myorg"
    And user "ambiguous@myorg.com" has no MFA enrolled
    And the grace_period_ends_at database read throws a transient error during page load
    When the error is caught in the page load handler
    Then the persistent banner is shown (enforcement applied conservatively)
    And the user is NOT silently treated as exempt
    And the error is logged to the application error log
```

**Test Data:**
- Fault injection: transient timeout on `grace_period_ends_at` DB read
- Expected behavior: banner displayed (fail-safe, never fail-open toward exemption)

**Preconditions:**
- Fault injection configured for the grace period check query

---


# Test Specifications: POLICY-03 — MFA Grace Period Enrollment Tracking for Org Admins

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | edge-case |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1 | edge-case |
| AC-6 | T-6.1, T-6.2 | security |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Dashboard displays unenrolled count and user list during active grace period
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: MFA Grace Period Enrollment Tracking Dashboard

  Background:
    Given the organization "Acme Corp" (org_id: "org-abc-001") has MFA enforcement active
    And the grace period end date is "2026-07-01T23:59:59Z"
    And the current time is "2026-06-15T10:00:00Z" (grace period is in progress)
    And the following users exist in the organization and have NOT enrolled in MFA:
      | display_name   | email                     |
      | Alice Johnson  | alice@acme-corp.example   |
      | Bob Martinez   | bob@acme-corp.example     |
      | Carol Lee      | carol@acme-corp.example   |
    And the following users exist in the organization and HAVE enrolled in MFA:
      | display_name   | email                       |
      | Dave Singh     | dave@acme-corp.example      |

  Scenario: Org Admin views enrollment tracking dashboard during active grace period
    Given I am authenticated as "org_admin" with email "admin@acme-corp.example" for org "org-abc-001"
    When I navigate to "/admin/mfa/enrollment-tracking"
    Then the HTTP response status is 200
    And the dashboard displays unenrolled count "3"
    And the dashboard shows the following unenrolled users:
      | display_name   | email                     |
      | Alice Johnson  | alice@acme-corp.example   |
      | Bob Martinez   | bob@acme-corp.example     |
      | Carol Lee      | carol@acme-corp.example   |
    And the dashboard does not show "Dave Singh" in the unenrolled list
    And the dashboard displays "16 days remaining — deadline: 2026-07-01"
```

**Test Data:**
- Org: `{ org_id: "org-abc-001", name: "Acme Corp", mfa_enforcement_enabled: true, grace_period_ends_at: "2026-07-01T23:59:59Z" }`
- Admin: `{ user_id: "user-admin-001", email: "admin@acme-corp.example", role: "org_admin", org_id: "org-abc-001" }`
- Unenrolled users: 3 users with `mfa_enrolled: false`
- Enrolled users: 1 user with `mfa_enrolled: true`
- System clock mocked to: `2026-06-15T10:00:00Z`

**Preconditions:**
- Org has `mfa_enforcement_enabled: true`
- `grace_period_ends_at` is set to a future date
- Admin JWT is valid and encodes `org_id: "org-abc-001"` and `role: "org_admin"`

---

### T-1.2: API response includes only required fields per user
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Unenrolled user list contains display name and email — no extra PII
    Given I am authenticated as "org_admin" for org "org-abc-001"
    And the grace period is active
    When I call GET "/api/v1/admin/mfa/enrollment-tracking"
    Then the HTTP response status is 200
    And each item in "unenrolled_users" contains exactly the fields: "display_name", "email"
    And no item contains "password_hash", "phone_number", "internal_id", or "mfa_secret"
    And the response body contains:
      """json
      {
        "unenrolled_count": 3,
        "grace_period_ends_at": "2026-07-01T23:59:59Z",
        "days_remaining": 16,
        "unenrolled_users": [
          { "display_name": "Alice Johnson", "email": "alice@acme-corp.example" },
          { "display_name": "Bob Martinez",  "email": "bob@acme-corp.example" },
          { "display_name": "Carol Lee",     "email": "carol@acme-corp.example" }
        ]
      }
      """
```

**Test Data:**
- Same as T-1.1
- Response schema validated against OpenAPI spec

**Preconditions:**
- Same as T-1.1

---

### T-2.1: Unenrolled list updates within 60 seconds after a user enrolls
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: User who completes MFA enrollment is removed from the unenrolled list within 60 seconds
    Given I am authenticated as "org_admin" for org "org-abc-001"
    And the grace period is active
    And I am viewing the enrollment tracking dashboard
    And the dashboard shows "Alice Johnson" in the unenrolled list with count "3"
    When user "alice@acme-corp.example" (user_id: "user-alice-001") successfully completes MFA enrollment at time T
    Then within 60 seconds of time T, the dashboard no longer shows "Alice Johnson" in the unenrolled list
    And the unenrolled count displayed is "2"
    And no full page reload occurred (verified via absence of navigation events)
```

**Test Data:**
- Alice completes enrollment: `{ user_id: "user-alice-001", mfa_enrolled: true, enrolled_at: T }`
- Max allowed latency: 60 seconds from enrollment event to UI update

**Preconditions:**
- Dashboard is open and displaying the unenrolled list
- Real-time update mechanism (polling or WebSocket) is active
- Alice has not previously enrolled

---

### T-2.2: Count decrements correctly for each successive enrollment
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Multiple users enrolling in sequence each decrement the count correctly
    Given I am authenticated as "org_admin" for org "org-abc-001"
    And the dashboard is showing unenrolled count "3"
    When user "alice@acme-corp.example" enrolls in MFA
    Then the dashboard shows count "2" within 60 seconds
    When user "bob@acme-corp.example" enrolls in MFA
    Then the dashboard shows count "1" within 60 seconds
    When user "carol@acme-corp.example" enrolls in MFA
    Then the dashboard shows count "0" within 60 seconds
    And the dashboard shows the empty state message "All users have enrolled in MFA."
```

**Test Data:**
- 3 unenrolled users enrolling sequentially; each enrollment triggers a real-time update

**Preconditions:**
- Same as T-2.1

---

### T-3.1: Dashboard is hidden after grace period expires
**Maps to:** AC-3
**Category:** edge-case

```gherkin
  Scenario: Org Admin navigates to dashboard after grace period has expired
    Given the organization "org-abc-001" has MFA enforcement active
    And the grace period end date is "2026-06-14T23:59:59Z"
    And the current time is "2026-06-15T10:00:00Z" (grace period expired)
    And I am authenticated as "org_admin" for org "org-abc-001"
    When I navigate to "/admin/mfa/enrollment-tracking"
    Then the unenrolled user list is NOT displayed
    And the dashboard displays the message: "The enrollment grace period has ended. Users without MFA are now blocked from accessing the application."
    And the HTTP response status is 200
```

**Test Data:**
- `grace_period_ends_at: "2026-06-14T23:59:59Z"`, system clock: `2026-06-15T10:00:00Z`

**Preconditions:**
- `now() >= grace_period_ends_at` (strictly after expiry)
- `mfa_enforcement_enabled: true`

---

### T-3.2: Dashboard transitions to expired state exactly at grace period boundary
**Maps to:** AC-3
**Category:** edge-case

```gherkin
  Scenario: Dashboard transitions from active to expired exactly at grace_period_ends_at
    Given the grace period end date is "2026-06-15T12:00:00Z"
    And I am authenticated as "org_admin" for org "org-abc-001"
    And at time "2026-06-15T11:59:59Z" the dashboard shows the unenrolled list
    When the system clock reaches "2026-06-15T12:00:00Z"
    Then within the next page render cycle, the unenrolled list is no longer displayed
    And the expired-period message is shown
```

**Test Data:**
- System clock advanced to boundary second via test harness mock
- `grace_period_ends_at: "2026-06-15T12:00:00Z"`

**Preconditions:**
- Clock mock available in test environment

---

### T-4.1: Dashboard is hidden when MFA enforcement is not enabled
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: Org Admin navigates to enrollment tracking when MFA enforcement is disabled
    Given the organization "org-abc-001" has MFA enforcement disabled ("mfa_enforcement_enabled": false)
    And I am authenticated as "org_admin" for org "org-abc-001"
    When I navigate to "/admin/mfa/enrollment-tracking"
    Then the enrollment tracking dashboard is not shown
    And a message is displayed: "Enable MFA enforcement in policy settings to see enrollment tracking"
    And the HTTP response status is 200
```

**Test Data:**
- Org: `{ org_id: "org-abc-001", mfa_enforcement_enabled: false, grace_period_ends_at: null }`

**Preconditions:**
- Org has enforcement disabled
- Admin JWT is valid

---

### T-5.1: Empty state shown when all users have enrolled
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: All users in the org have enrolled — dashboard shows empty state
    Given the organization "org-abc-001" has MFA enforcement active and grace period is in progress
    And all users in the organization have "mfa_enrolled": true
    And I am authenticated as "org_admin" for org "org-abc-001"
    When I navigate to "/admin/mfa/enrollment-tracking"
    Then the unenrolled count displayed is "0"
    And the user list is empty
    And the message "All users have enrolled in MFA." is displayed
```

**Test Data:**
- All org users: `{ mfa_enrolled: true }`
- `mfa_enforcement_enabled: true`, `grace_period_ends_at` is a future date

**Preconditions:**
- No users with `mfa_enrolled: false` in the org

---

## Security Tests

### T-6.1: Enrollment tracking API scopes response to admin's own org only
**Maps to:** AC-6
**Category:** security

```gherkin
  Scenario: Org Admin for Org A cannot see users from Org B in the enrollment tracking API
    Given user "admin-a@acme-corp.example" is authenticated as "org_admin" for org "org-abc-001"
    And org "org-abc-001" has 3 unenrolled users
    And org "org-xyz-002" has 5 unenrolled users including "eve@other-corp.example"
    When I call GET "/api/v1/admin/mfa/enrollment-tracking"
    Then the response contains exactly 3 unenrolled users
    And "eve@other-corp.example" does not appear in "unenrolled_users"
    And no user with "org_id": "org-xyz-002" appears in the response
```

**Test Data:**
- Org A: `{ org_id: "org-abc-001", unenrolled_count: 3 }`
- Org B: `{ org_id: "org-xyz-002", unenrolled_count: 5 }`, includes `eve@other-corp.example`
- Admin A JWT: `{ org_id: "org-abc-001", role: "org_admin" }`

**Preconditions:**
- Two orgs exist with unenrolled users
- Admin A is only associated with Org A

---

### T-6.2: Passing a different org_id as query parameter does not leak cross-org data
**Maps to:** AC-6
**Category:** security

```gherkin
  Scenario: Passing org_id query parameter for another org is ignored — scoping comes from JWT
    Given I am authenticated as "org_admin" for org "org-abc-001"
    When I call GET "/api/v1/admin/mfa/enrollment-tracking?org_id=org-xyz-002"
    Then the response contains only users from org "org-abc-001"
    And no user from org "org-xyz-002" is returned
    And the HTTP response status is 200 (not 400 — the param is silently ignored or rejected)
```

**Test Data:**
- Same as T-6.1
- Attacker-supplied `?org_id=org-xyz-002` in query string

**Preconditions:**
- Same as T-6.1

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Request with no auth token is rejected with 401
    Given no authentication token is present in the request
    When I call GET "/api/v1/admin/mfa/enrollment-tracking"
    Then the HTTP response status is 401
    And the response body contains a message indicating authentication is required
    And no enrollment data is returned
```

**Test Data:**
- Request headers: no `Authorization` header, no session cookie

**Preconditions:**
- Endpoint requires authentication

---

### T-AUTH-2.1: Regular user (no admin role) receives 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated user with role "member" is rejected with 403
    Given I am authenticated as a user with role "member" (not org_admin or platform_super_admin)
    And my JWT encodes: { "user_id": "user-member-001", "role": "member", "org_id": "org-abc-001" }
    When I call GET "/api/v1/admin/mfa/enrollment-tracking"
    Then the HTTP response status is 403
    And the response body identifies the required permission: "org_admin or platform_super_admin"
    And no enrollment data is returned
```

**Test Data:**
- User: `{ user_id: "user-member-001", role: "member", org_id: "org-abc-001" }`

**Preconditions:**
- Valid JWT exists but role is `member`

---

### T-AUTH-2.2: Admin of a different org receives 403 on cross-org access attempt
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Org Admin of Org B cannot access tracking for Org A even with valid admin token
    Given I am authenticated as "org_admin" for org "org-xyz-002"
    When I call GET "/api/v1/admin/mfa/enrollment-tracking?org_id=org-abc-001"
    Then the HTTP response status is 403
    And no users from org "org-abc-001" are returned
```

**Test Data:**
- Attacker JWT: `{ role: "org_admin", org_id: "org-xyz-002" }`

**Preconditions:**
- Admin is legitimately an org_admin, but for a different org

---

## Negative / Error Tests

### T-ERR-1.1: Database timeout returns error message without partial data
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Dashboard displays error when database query times out
    Given I am authenticated as "org_admin" for org "org-abc-001"
    And the database query for unenrolled users is configured to time out
    When I navigate to "/admin/mfa/enrollment-tracking"
    Then the dashboard displays: "Unable to load enrollment status. Refresh to try again."
    And no partial user list is shown
    And the HTTP response status is 503 or 200 with an error state in the body
```

**Test Data:**
- DB timeout injected via test hook (query delay > configured timeout threshold)

**Preconditions:**
- DB timeout simulation available in test environment

---

### T-ERR-1.2: Real-time connection drop falls back to last-known list with timestamp
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Real-time update connection drops — dashboard shows stale list with last-updated label
    Given I am authenticated as "org_admin" for org "org-abc-001"
    And I am viewing the enrollment tracking dashboard showing 3 unenrolled users
    And the dashboard last loaded at "2026-06-15T10:00:00Z"
    When the real-time update connection is terminated (WebSocket closed / polling fails)
    Then the dashboard continues to show the previously loaded list of 3 unenrolled users
    And a label is displayed: "Last updated 2026-06-15T10:00:00Z"
    And a "Refresh" button is displayed
    When I click "Refresh"
    Then the dashboard reloads the current list from the server
```

**Test Data:**
- WebSocket/polling connection terminated by network failure simulation

**Preconditions:**
- Real-time mechanism is active and has received at least one payload

---

---

# Test Specifications: POLICY-04 — Policy Change Email Notifications to Org Admins

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1 | edge-case |
| AC-5 | T-5.1 | edge-case |
| AC-6 | T-6.1 | boundary |
| AC-7 | T-7.1 | boundary |
| AC-8 | T-8.1, T-8.2 | error-handling |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Email sent to all Org Admins when MFA enforcement is enabled
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Policy Change Email Notifications

  Background:
    Given the organization "Acme Corp" (org_id: "org-abc-001") exists
    And the following Org Admins exist for the organization:
      | display_name    | email                       | user_id          |
      | Admin Alice     | admin-a@acme-corp.example   | user-admin-001   |
      | Admin Bob       | admin-b@acme-corp.example   | user-admin-002   |
    And the email notification service is available
    And the change actor is "Admin Alice" (user_id: "user-admin-001")

  Scenario: Email is sent to all Org Admins when MFA enforcement is enabled
    Given org "org-abc-001" currently has "mfa_enforcement_enabled": false
    And I am authenticated as "org_admin" "Admin Alice" for org "org-abc-001"
    When I submit a PATCH to "/api/v1/orgs/org-abc-001/policy" with body:
      """json
      { "mfa_enforcement_enabled": true }
      """
    Then the HTTP response status is 200
    And within 200ms of the response, 2 emails are dispatched
    And an email is sent to "admin-b@acme-corp.example" with:
      | field        | value                                        |
      | subject      | contains "Policy changed: MFA enforcement"   |
      | body.policy  | "MFA enforcement"                            |
      | body.state   | "enabled"                                    |
      | body.actor   | "Admin Alice (admin-a@acme-corp.example)"    |
      | body.time    | UTC timestamp matching save completion time  |
    And the email to "admin-b@acme-corp.example" does NOT contain action links
```

**Test Data:**
- Policy change: `{ mfa_enforcement_enabled: true }` (was `false`)
- Actor JWT: `{ user_id: "user-admin-001", role: "org_admin", org_id: "org-abc-001" }`
- Recipients: 2 org_admins; actor excluded — net recipient count = 1 (AC-5 interaction)
- Note: AC-5 specifies actor exclusion; T-1.1 focuses on email content; T-5.1 covers actor exclusion explicitly

**Preconditions:**
- Org has 2 org_admins
- Email service is mocked/stubbed to capture outbound messages in test
- Actor JWT is valid

---

### T-1.2: Email sent to all Org Admins when MFA enforcement is disabled
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Email is sent when MFA enforcement is disabled
    Given org "org-abc-001" currently has "mfa_enforcement_enabled": true
    And I am authenticated as "org_admin" "Admin Alice" for org "org-abc-001"
    When I submit a PATCH to "/api/v1/orgs/org-abc-001/policy" with body:
      """json
      { "mfa_enforcement_enabled": false }
      """
    Then the HTTP response status is 200
    And an email is sent to "admin-b@acme-corp.example" with body.state "disabled"
    And an email is sent to "admin-a@acme-corp.example" is NOT in the recipient list
```

**Test Data:**
- Same org setup as T-1.1; initial state `mfa_enforcement_enabled: true`

**Preconditions:**
- Same as T-1.1

---

### T-2.1: Email sent when SSO is enabled or disabled
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Email is sent when SSO is enabled
    Given org "org-abc-001" currently has "sso_enabled": false
    And I am authenticated as "org_admin" "Admin Alice" for org "org-abc-001"
    When I submit a PATCH to "/api/v1/orgs/org-abc-001/policy" with body:
      """json
      { "sso_enabled": true }
      """
    Then the HTTP response status is 200
    And an email is sent to "admin-b@acme-corp.example" with:
      | field        | value                                        |
      | body.policy  | "SSO"                                        |
      | body.state   | "enabled"                                    |
      | body.actor   | "Admin Alice (admin-a@acme-corp.example)"    |

  Scenario: Email is sent when SSO is disabled
    Given org "org-abc-001" currently has "sso_enabled": true
    And I am authenticated as "org_admin" "Admin Alice" for org "org-abc-001"
    When I submit a PATCH to "/api/v1/orgs/org-abc-001/policy" with body:
      """json
      { "sso_enabled": false }
      """
    Then an email is sent to "admin-b@acme-corp.example" with body.policy "SSO" and body.state "disabled"
```

**Test Data:**
- `{ sso_enabled: false }` → `{ sso_enabled: true }` and vice versa

**Preconditions:**
- Same org and admin setup

---

### T-3.1: Email sent when session timeout is updated, including previous and new values
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Email includes previous and new session timeout values when timeout is changed
    Given org "org-abc-001" currently has "session_timeout": 86400 (24 hours in seconds)
    And I am authenticated as "org_admin" "Admin Alice" for org "org-abc-001"
    When I submit a PATCH to "/api/v1/orgs/org-abc-001/policy" with body:
      """json
      { "session_timeout": 3600 }
      """
    Then the HTTP response status is 200
    And an email is sent to "admin-b@acme-corp.example" with:
      | field             | value                                          |
      | body.policy       | "Session timeout"                              |
      | body.previous     | "24 hours" or "86400 seconds"                  |
      | body.new_value    | "1 hour" or "3600 seconds"                     |
      | body.actor        | "Admin Alice (admin-a@acme-corp.example)"       |
      | body.timestamp    | UTC timestamp of the save                      |
```

**Test Data:**
- Previous: `session_timeout: 86400`, New: `session_timeout: 3600`
- Email must include BOTH previous and new values (distinct from AC-1 which is enable/disable)

**Preconditions:**
- Same org setup

---

### T-4.1: Platform Super Admin change triggers notification to org's Org Admins
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: Platform Super Admin enabling MFA for an org triggers email to that org's admins
    Given "Super Admin Sam" (user_id: "user-super-001", role: "platform_super_admin") is authenticated
    And org "org-abc-001" has 2 Org Admins: "admin-a@acme-corp.example" and "admin-b@acme-corp.example"
    And "Super Admin Sam" does NOT have "org_id": "org-abc-001" in their JWT
    When "Super Admin Sam" submits PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "mfa_enforcement_enabled": true }
      """
    Then the HTTP response status is 200
    And an email is sent to "admin-a@acme-corp.example" identifying the actor as "Super Admin Sam (superadmin@platform.example)"
    And an email is sent to "admin-b@acme-corp.example" identifying the actor as "Super Admin Sam (superadmin@platform.example)"
```

**Test Data:**
- Super Admin: `{ user_id: "user-super-001", role: "platform_super_admin", email: "superadmin@platform.example" }`
- Org Admins do not include the Super Admin

**Preconditions:**
- Super Admin JWT is valid with `platform_super_admin` role
- Neither org admin has changed the policy

---

### T-5.1: Actor does not receive notification for their own policy change
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: The admin who made the change is excluded from the notification recipient list
    Given org "org-abc-001" has 3 Org Admins:
      | display_name  | email                       | user_id         |
      | Admin Alice   | admin-a@acme-corp.example   | user-admin-001  |
      | Admin Bob     | admin-b@acme-corp.example   | user-admin-002  |
      | Admin Carol   | admin-c@acme-corp.example   | user-admin-003  |
    And I am authenticated as "Admin Alice" (user-admin-001)
    When I change "mfa_enforcement_enabled" to true for org "org-abc-001"
    Then exactly 2 emails are dispatched
    And "admin-b@acme-corp.example" receives a notification email
    And "admin-c@acme-corp.example" receives a notification email
    And "admin-a@acme-corp.example" does NOT receive a notification email
```

**Test Data:**
- 3 org admins; actor is `user-admin-001`
- Expected recipient count: 2 (all admins minus the actor)

**Preconditions:**
- 3 org admins exist in the org

---

### T-6.1: No email sent when admin views policy page without saving
**Maps to:** AC-6
**Category:** boundary

```gherkin
  Scenario: Navigating to policy settings and leaving without saving does not trigger email
    Given I am authenticated as "Admin Alice" for org "org-abc-001"
    When I navigate to "/admin/policy/settings"
    And I view the current policy values (GET request only)
    And I navigate away without submitting any changes
    Then no notification email is dispatched
    And the email service outbox contains 0 new messages
```

**Test Data:**
- HTTP method: GET (no POST/PATCH)
- Email service outbox monitored for 5 seconds after navigation

**Preconditions:**
- Email service test outbox is empty at test start

---

### T-7.1: No email sent when policy is saved with identical values (no effective change)
**Maps to:** AC-7
**Category:** boundary

```gherkin
  Scenario: Saving policy with unchanged values does not trigger email notification
    Given org "org-abc-001" has "mfa_enforcement_enabled": true and "session_timeout": 86400
    And I am authenticated as "Admin Alice" for org "org-abc-001"
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "mfa_enforcement_enabled": true, "session_timeout": 86400 }
      """
    Then the HTTP response status is 200 (or 204)
    And no notification email is dispatched
    And the email service outbox contains 0 new messages

  Scenario: Saving only one policy field with unchanged value does not trigger email
    Given org "org-abc-001" has "session_timeout": 3600
    And I am authenticated as "Admin Alice" for org "org-abc-001"
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "session_timeout": 3600 }
      """
    Then no notification email is dispatched
```

**Test Data:**
- Submitted values: identical to current stored values
- System must detect "no effective diff" server-side

**Preconditions:**
- Org policy values are pre-seeded to known state

---

## Error Handling Tests

### T-8.1: Email delivery failure does not roll back policy change
**Maps to:** AC-8
**Category:** error-handling

```gherkin
  Scenario: SMTP failure after successful policy save does not revert the policy
    Given org "org-abc-001" has "mfa_enforcement_enabled": false
    And I am authenticated as "Admin Alice" for org "org-abc-001"
    And the email service is configured to return an SMTP error for all sends
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "mfa_enforcement_enabled": true }
      """
    Then the HTTP response status is 200
    And org "org-abc-001" now has "mfa_enforcement_enabled": true in the database
    And the system error log contains an entry for the email delivery failure
    And a retry task is queued for the failed notification
```

**Test Data:**
- Email service: `{ smtp_response: 500, error: "Connection refused" }`

**Preconditions:**
- Email service failure injected via test double/stub

---

### T-8.2: Notification delivery is retried at least once after failure
**Maps to:** AC-8
**Category:** error-handling

```gherkin
  Scenario: System retries email notification after initial delivery failure
    Given an email notification for a policy change failed on the first attempt
    And a retry task is queued in the background job system
    When the retry task executes
    And the email service is now available
    Then the notification email is delivered to all Org Admin recipients
    And the retry is marked as succeeded in the job queue
```

**Test Data:**
- Background job: `{ type: "send_policy_notification", status: "failed", attempts: 1 }`

**Preconditions:**
- Background job runner is available in test environment

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to change policy returns 401 and no email sent
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Request with no auth token is rejected and no notification is triggered
    Given no authentication token is present in the request
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "mfa_enforcement_enabled": true }
      """
    Then the HTTP response status is 401
    And no notification email is dispatched
    And the policy value in the database is unchanged
```

**Test Data:**
- No `Authorization` header; no session cookie

**Preconditions:**
- Email service outbox is empty at test start

---

### T-AUTH-2.1: Non-admin user cannot change policy and no notification is sent
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated user with role "member" cannot change policy — no notification sent
    Given I am authenticated as a user with role "member" for org "org-abc-001"
    And my JWT: { "user_id": "user-member-001", "role": "member", "org_id": "org-abc-001" }
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "mfa_enforcement_enabled": true }
      """
    Then the HTTP response status is 403
    And the response identifies the required permission: "org_admin or platform_super_admin"
    And no notification email is dispatched
    And the database policy value is unchanged
```

**Test Data:**
- User: `{ user_id: "user-member-001", role: "member", org_id: "org-abc-001" }`

**Preconditions:**
- Valid JWT with `role: "member"`

---

---

# Test Specifications: POLICY-05 — Org Session Timeout Configuration

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1 | boundary |
| AC-3 | T-3.1 | boundary |
| AC-4 | T-4.1 | happy-path |
| AC-5 | T-5.1 | edge-case |
| AC-6 | T-6.1 | boundary |
| AC-7 | T-7.1 | edge-case |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Org Admin saves valid session timeout — stored, audit-logged, notification sent
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Org Session Timeout Configuration

  Background:
    Given the organization "Acme Corp" (org_id: "org-abc-001") exists with "session_timeout": 86400
    And 2 Org Admins exist:
      | display_name  | email                       | user_id         |
      | Admin Alice   | admin-a@acme-corp.example   | user-admin-001  |
      | Admin Bob     | admin-b@acme-corp.example   | user-admin-002  |
    And I am authenticated as "Admin Alice" (user-admin-001) for org "org-abc-001"

  Scenario: Org Admin sets session timeout to a valid value within range
    Given the current session timeout is 86400 (24 hours)
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "session_timeout": 7200 }
      """
    Then the HTTP response status is 200
    And the org's "session_timeout" in the database is 7200
    And the UI confirms: "Session timeout updated to 2 hours."
    And an audit log entry is written with:
      | field           | value                          |
      | event_type      | "session_timeout_changed"      |
      | previous_value  | 86400                          |
      | new_value       | 7200                           |
      | actor_id        | "user-admin-001"               |
      | org_id          | "org-abc-001"                  |
      | timestamp       | (UTC timestamp of save)        |
    And a POLICY-04 notification email is dispatched to all Org Admins (excluding actor)
```

**Test Data:**
- Previous value: `session_timeout: 86400` (24 hours)
- New value: `session_timeout: 7200` (2 hours)
- Valid range: 3600 (1 hour) to 2592000 (30 days), inclusive

**Preconditions:**
- Admin JWT is valid with `role: "org_admin"`, `org_id: "org-abc-001"`
- Audit log service is available
- Email service is available

---

### T-1.2: Session timeout at minimum boundary (1 hour) is accepted
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Setting session timeout to exactly 1 hour (3600 seconds) is accepted
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "session_timeout": 3600 }
      """
    Then the HTTP response status is 200
    And the org's "session_timeout" in the database is 3600
```

**Test Data:**
- `session_timeout: 3600` (exactly 1 hour — lower bound, inclusive)

**Preconditions:**
- Admin JWT valid

---

### T-2.1: Timeout below minimum is rejected with validation error
**Maps to:** AC-2
**Category:** boundary

```gherkin
  Scenario: Session timeout below 1 hour is rejected
    Given the current session timeout is 86400
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "session_timeout": 1800 }
      """
    Then the HTTP response status is 422 (Unprocessable Entity) or 400
    And the response body contains: "Session timeout must be between 1 hour and 30 days."
    And the org's "session_timeout" in the database remains 86400

  Scenario: Session timeout of 0 is rejected
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "session_timeout": 0 }
      """
    Then the HTTP response status is 422 or 400
    And the response body contains: "Session timeout must be between 1 hour and 30 days."

  Scenario: Negative session timeout is rejected
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "session_timeout": -3600 }
      """
    Then the HTTP response status is 422 or 400
    And the org's "session_timeout" is not changed
```

**Test Data:**
- Invalid values: `1800` (30 min), `0`, `-3600`
- All must preserve existing value in DB

**Preconditions:**
- Admin JWT valid; current timeout is 86400

---

### T-3.1: Timeout above maximum is rejected with validation error
**Maps to:** AC-3
**Category:** boundary

```gherkin
  Scenario: Session timeout above 30 days is rejected
    Given the current session timeout is 86400
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "session_timeout": 2592001 }
      """
    Then the HTTP response status is 422 or 400
    And the response body contains: "Session timeout must be between 1 hour and 30 days."
    And the org's "session_timeout" in the database remains 86400

  Scenario: Session timeout of exactly 30 days (2592000 seconds) is accepted
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "session_timeout": 2592000 }
      """
    Then the HTTP response status is 200
    And the org's "session_timeout" in the database is 2592000
```

**Test Data:**
- Upper bound inclusive: `2592000` (30 days = 30 × 86400)
- Rejected above bound: `2592001`

**Preconditions:**
- Same as T-2.1

---

### T-4.1: New sessions use the updated timeout after save
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Session created after timeout change uses the new timeout value
    Given the session timeout for org "org-abc-001" is set to 3600 (1 hour)
    And user "user@acme-corp.example" (user_id: "user-member-001") is in org "org-abc-001"
    When "user@acme-corp.example" logs in at time "2026-06-15T10:00:00Z"
    Then a new session is created with:
      | field          | value                    |
      | session_start  | 2026-06-15T10:00:00Z     |
      | session_expiry | 2026-06-15T11:00:00Z     |
    And a request made at "2026-06-15T10:59:59Z" succeeds (session valid)
    And a request made at "2026-06-15T11:00:01Z" returns 401 (session expired)
```

**Test Data:**
- `session_timeout: 3600`; login at `2026-06-15T10:00:00Z`; expiry: `2026-06-15T11:00:00Z`

**Preconditions:**
- Session timeout was updated to 3600 before user login
- Clock mock available in test environment

---

### T-5.1: Existing sessions are not terminated when timeout changes
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: Active session created under old timeout is not invalidated when timeout decreases
    Given user "user@acme-corp.example" logged in at "2026-06-15T08:00:00Z"
    And at login time the session timeout was 86400 (24 hours)
    And the user's session expiry is "2026-06-16T08:00:00Z"
    When an Org Admin changes the session timeout to 3600 (1 hour) at "2026-06-15T09:00:00Z"
    Then the user's existing session remains valid
    And a request made by "user@acme-corp.example" at "2026-06-15T10:00:00Z" returns 200 (session still valid — only 2h since login)
    And the user's session expires at its original time "2026-06-16T08:00:00Z" not at "2026-06-15T10:00:00Z"
    And "user@acme-corp.example" is NOT logged out as a result of the timeout change
```

**Test Data:**
- Session created at `2026-06-15T08:00:00Z` with 86400s timeout → expiry `2026-06-16T08:00:00Z`
- Timeout changed to 3600 at `2026-06-15T09:00:00Z`
- Request at `2026-06-15T10:00:00Z` → within old expiry, must succeed

**Preconditions:**
- User has active session stored in the session store
- Clock mock available

---

### T-6.1: Default timeout for new organization is 24 hours
**Maps to:** AC-6
**Category:** boundary

```gherkin
  Scenario: Newly created organization has session_timeout defaulting to 86400 seconds
    When a new organization "New Org" (org_id: "org-new-001") is created via the provisioning API
    Then the org's "session_timeout" in the database is 86400
    And no Org Admin action is required to set this default
```

**Test Data:**
- New org: `{ org_id: "org-new-001", name: "New Org" }` — no explicit session_timeout provided
- Expected DB value after creation: `session_timeout: 86400`

**Preconditions:**
- Org creation API or provisioning flow is available

---

### T-7.1: Platform Super Admin can set session timeout for any org
**Maps to:** AC-7
**Category:** edge-case

```gherkin
  Scenario: Platform Super Admin sets session timeout for an org they don't belong to
    Given "Super Admin Sam" (user_id: "user-super-001", role: "platform_super_admin") is authenticated
    And org "org-abc-001" has "session_timeout": 86400
    When "Super Admin Sam" submits PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "session_timeout": 14400 }
      """
    Then the HTTP response status is 200
    And the org's "session_timeout" in the database is 14400
    And an audit log entry is written identifying "Super Admin Sam" as the actor
    And a POLICY-04 notification email is sent to all Org Admins of "org-abc-001"
    And the email identifies "Super Admin Sam" as the actor
```

**Test Data:**
- Super Admin JWT: `{ user_id: "user-super-001", role: "platform_super_admin" }`
- New value: `session_timeout: 14400` (4 hours)

**Preconditions:**
- Super Admin JWT valid
- Org has 2 Org Admins to receive notifications

---

## Security Tests

### T-SEC-1.1: org_id from request body is ignored — JWT is authoritative
**Maps to:** Security NFR
**Category:** security

```gherkin
  Scenario: Passing a different org_id in request body does not change another org's timeout
    Given I am authenticated as "org_admin" for org "org-abc-001"
    And org "org-xyz-002" has "session_timeout": 86400
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "org_id": "org-xyz-002", "session_timeout": 100 }
      """
    Then the HTTP response status is 200 or 400
    And the "session_timeout" for org "org-abc-001" may be updated
    And the "session_timeout" for org "org-xyz-002" remains 86400 (not changed)
```

**Test Data:**
- Attacker's JWT: `{ org_id: "org-abc-001" }`; injected body `org_id: "org-xyz-002"`

**Preconditions:**
- Two orgs exist

---

### T-SEC-1.2: Non-numeric session_timeout value is rejected server-side
**Maps to:** Security NFR
**Category:** security

```gherkin
  Scenario: String value for session_timeout is rejected by server-side validation
    Given I am authenticated as "org_admin" for org "org-abc-001"
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "session_timeout": "two days" }
      """
    Then the HTTP response status is 422 or 400
    And the response indicates a type validation error
    And the org's "session_timeout" is not changed

  Scenario: Float value for session_timeout is rejected
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "session_timeout": 3600.5 }
      """
    Then the HTTP response status is 422 or 400
    And the org's "session_timeout" is not changed
```

**Test Data:**
- Invalid types: `"two days"` (string), `3600.5` (float), `true` (boolean), `null`

**Preconditions:**
- Admin JWT valid

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Request with no auth token to session timeout endpoint returns 401
    Given no authentication token is present
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with body:
      """json
      { "session_timeout": 3600 }
      """
    Then the HTTP response status is 401
    And the org's "session_timeout" is unchanged
```

**Test Data:**
- No `Authorization` header

**Preconditions:**
- Endpoint requires authentication

---

### T-AUTH-2.1: Member-role user cannot update session timeout
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Authenticated user with role "member" receives 403 when attempting to change session timeout
    Given I am authenticated with JWT: { "user_id": "user-member-001", "role": "member", "org_id": "org-abc-001" }
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "session_timeout": 3600 }
      """
    Then the HTTP response status is 403
    And the response body identifies the required permission: "org_admin or platform_super_admin"
    And the org's "session_timeout" is unchanged
```

**Test Data:**
- JWT: `{ role: "member" }`

---

### T-AUTH-2.2: Org Admin cannot update session timeout for a different org
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Org Admin for Org A cannot update session timeout for Org B
    Given I am authenticated as "org_admin" for org "org-abc-001"
    When I submit PATCH "/api/v1/orgs/org-xyz-002/policy" with:
      """json
      { "session_timeout": 3600 }
      """
    Then the HTTP response status is 403
    And the "session_timeout" for org "org-xyz-002" is unchanged
```

**Test Data:**
- JWT: `{ role: "org_admin", org_id: "org-abc-001" }`; path param: `org-xyz-002`

---

## Error Handling Tests

### T-ERR-1.1: Database write failure returns 500 without partial apply
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Database write failure is surfaced as 500 — value is not partially changed
    Given I am authenticated as "org_admin" for org "org-abc-001"
    And the database write for "session_timeout" is configured to fail
    When I submit PATCH "/api/v1/orgs/org-abc-001/policy" with:
      """json
      { "session_timeout": 7200 }
      """
    Then the HTTP response status is 500
    And the response body contains: "Failed to save session timeout. Please try again."
    And the org's "session_timeout" in the database remains at its original value
```

**Test Data:**
- DB write failure injected via test hook

**Preconditions:**
- DB failure simulation available

---

---

# Test Specifications: SSO-01 — SSO IdP Configuration UI for Org Admins

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | error-handling |
| AC-4 | T-4.1, T-4.2 | error-handling |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1 | happy-path |
| AC-7 | T-7.1 | happy-path |
| AC-8 | T-8.1 | edge-case |
| AC-9 | T-9.1 | boundary |
| AC-10 | T-10.1, T-10.2, T-10.3 | security |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Org Admin imports IdP metadata via valid URL — extracted fields displayed for review
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: SSO IdP Configuration UI

  Background:
    Given the organization "Acme Corp" (org_id: "org-abc-001") exists
    And I am authenticated as "org_admin" "Admin Alice" (user-admin-001) for org "org-abc-001"
    And a valid SAML 2.0 metadata XML is served at "https://idp.acme-corp.example/saml/metadata"
    And the metadata contains:
      | field            | value                                           |
      | entity_id        | "https://idp.acme-corp.example"                 |
      | sso_url          | "https://idp.acme-corp.example/sso/saml"        |
      | cert_common_name | "Acme IDP Signing Cert"                         |
      | cert_expiry      | "2027-12-31"                                    |

  Scenario: Org Admin imports metadata via URL and reviews extracted values before saving
    Given I am on the SSO configuration page
    When I enter the metadata URL "https://idp.acme-corp.example/saml/metadata" and click "Import"
    Then the system fetches the metadata server-side (not via browser fetch)
    And the following extracted values are displayed for my review:
      | field              | displayed value                          |
      | Entity ID          | "https://idp.acme-corp.example"          |
      | SSO URL            | "https://idp.acme-corp.example/sso/saml" |
      | Certificate CN     | "Acme IDP Signing Cert"                  |
      | Certificate Expiry | "2027-12-31"                             |
    And no configuration has been saved yet
    When I click "Save Configuration"
    Then the HTTP response status is 200
    And a row is created in "sso_configurations" with:
      | field            | value                                           |
      | org_id           | "org-abc-001"                                   |
      | entity_id        | "https://idp.acme-corp.example"                 |
      | sso_url          | "https://idp.acme-corp.example/sso/saml"        |
      | signing_cert_cn  | "Acme IDP Signing Cert"                         |
      | signing_cert_expiry | "2027-12-31"                                 |
```

**Test Data:**
- Metadata URL: `https://idp.acme-corp.example/saml/metadata` (served by test HTTP stub)
- Metadata XML includes: EntityDescriptor with EntityID, SingleSignOnService location (redirect binding), X509Certificate
- Admin JWT: `{ user_id: "user-admin-001", role: "org_admin", org_id: "org-abc-001" }`

**Preconditions:**
- Test HTTP stub serves valid SAML metadata at the URL
- No existing SSO config for the org
- Admin JWT is valid

---

### T-1.2: URL import uses server-side fetch — no browser request to IdP URL
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Import via URL performs the HTTP fetch from the backend, not the browser
    Given I am on the SSO configuration page
    When I enter metadata URL "https://idp.acme-corp.example/saml/metadata" and click "Import"
    Then the browser does not make a direct HTTP request to "https://idp.acme-corp.example/saml/metadata"
    And the backend server logs show an outbound GET request to "https://idp.acme-corp.example/saml/metadata"
    And the browser receives only the parsed/extracted metadata values from the backend API response
```

**Test Data:**
- Browser network monitor: no direct request to the IdP URL
- Backend access log: entry for outbound GET to IdP URL

**Preconditions:**
- Test environment captures both browser network requests and backend outbound requests

---

### T-2.1: Org Admin uploads valid SAML metadata XML file — extracted fields displayed for review
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Org Admin uploads a valid SAML metadata XML file and reviews before saving
    Given I am on the SSO configuration page
    And I have a valid SAML metadata XML file "okta-metadata.xml" with:
      | field        | value                                         |
      | entity_id    | "http://www.okta.com/exk1234567890"           |
      | sso_url      | "https://acme.okta.com/app/saml/sso/saml"    |
      | cert_cn      | "Okta Signing Certificate"                    |
      | cert_expiry  | "2028-06-01"                                  |
    When I upload "okta-metadata.xml" via the file upload input
    Then the system parses the file and displays for review:
      | field              | displayed value                               |
      | Entity ID          | "http://www.okta.com/exk1234567890"           |
      | SSO URL            | "https://acme.okta.com/app/saml/sso/saml"    |
      | Certificate CN     | "Okta Signing Certificate"                    |
      | Certificate Expiry | "2028-06-01"                                  |
    And no configuration is saved until I click "Save Configuration"
    When I click "Save Configuration"
    Then the configuration is stored in "sso_configurations" with the extracted values
```

**Test Data:**
- File: `okta-metadata.xml` — a valid SAML 2.0 EntityDescriptor XML document
- File size: 8KB (within expected limit)
- Content-Type: `application/xml` or `text/xml`

**Preconditions:**
- No existing SSO config for the org
- File upload endpoint is available

---

### T-2.2: File upload — MIME type validation is enforced
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Uploading a non-XML file type is rejected
    Given I am on the SSO configuration page
    When I attempt to upload "resume.pdf" (Content-Type: application/pdf) via the file upload input
    Then the system rejects the upload with an error about file type
    And no configuration is saved
```

**Test Data:**
- File: `resume.pdf`; Content-Type: `application/pdf`

**Preconditions:**
- File upload MIME validation is enabled server-side

---

### T-3.1: Invalid metadata URL returns clear error — no partial save
**Maps to:** AC-3
**Category:** error-handling

```gherkin
  Scenario: Metadata URL is unreachable — system returns clear error
    Given the URL "https://unreachable.idp.example/saml/metadata" returns a connection error (timeout or DNS failure)
    And I am on the SSO configuration page
    When I enter "https://unreachable.idp.example/saml/metadata" and click "Import"
    Then the system displays: "Unable to fetch metadata from this URL. Check the URL and try again, or upload the XML file directly."
    And no partial configuration is saved to "sso_configurations"
    And the HTTP response status of the import API call is 422 or 502

  Scenario: Metadata URL returns a non-XML response (e.g., HTML 404 page)
    Given the URL "https://idp.acme-corp.example/wrong-path" returns an HTML response with status 404
    When I enter "https://idp.acme-corp.example/wrong-path" and click "Import"
    Then the system displays: "Unable to fetch metadata from this URL. Check the URL and try again, or upload the XML file directly."
    And no partial configuration is saved
```

**Test Data:**
- Unreachable URL: DNS resolution failure simulated
- Wrong content-type URL: returns `text/html` with body `<html>404 Not Found</html>`

**Preconditions:**
- Test HTTP stubs simulate both failure scenarios

---

### T-3.2: Metadata URL fetch timeout returns clear error
**Maps to:** AC-3 / NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Metadata URL fetch times out after 10 seconds
    Given the URL "https://slow.idp.example/saml/metadata" takes more than 10 seconds to respond
    When I enter "https://slow.idp.example/saml/metadata" and click "Import"
    Then the backend times out the request after 10 seconds
    And the system displays: "Metadata URL timed out. Try again or upload the XML directly."
    And no partial configuration is saved
```

**Test Data:**
- Slow URL: response delayed >10s via test stub

**Preconditions:**
- Backend fetch timeout is configured to 10 seconds

---

### T-4.1: Invalid XML file upload returns clear error — no partial save
**Maps to:** AC-4
**Category:** error-handling

```gherkin
  Scenario: Uploaded file is valid XML but not valid SAML metadata
    Given I upload a file "config.xml" containing valid XML but no SAML EntityDescriptor element
    When the file is processed
    Then the system displays: "The uploaded file is not valid SAML metadata. Please check the file and try again."
    And no partial configuration is saved

  Scenario: Uploaded file is not valid XML (binary file renamed to .xml)
    Given I upload a file "image.xml" containing binary JPEG data
    When the file is processed
    Then the system displays: "The uploaded file is not valid SAML metadata. Please check the file and try again."
    And no partial configuration is saved
```

**Test Data:**
- Invalid XML: a valid XML file missing `EntityDescriptor` and required SAML elements
- Non-XML: binary file with `.xml` extension

**Preconditions:**
- Server-side XML parser and SAML schema validator are active

---

### T-4.2: XML file missing required SAML fields returns clear error
**Maps to:** AC-4
**Category:** error-handling

```gherkin
  Scenario: Uploaded XML has EntityDescriptor but is missing SSO URL (SingleSignOnService element)
    Given I upload "partial-metadata.xml" containing:
      - EntityDescriptor with entityID
      - NO SingleSignOnService element
    When the file is processed
    Then the system displays: "The uploaded file is not valid SAML metadata. Please check the file and try again."
    And no partial configuration is saved
```

**Test Data:**
- `partial-metadata.xml`: valid SAML EntityDescriptor but missing `SingleSignOnService` binding element

---

### T-5.1: SSO config save is written to audit log and triggers POLICY-04 notification
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Audit log entry is written and notification is sent when SSO config is created
    Given I am authenticated as "org_admin" "Admin Alice" for org "org-abc-001"
    And no existing SSO configuration exists for the org
    When I import metadata via URL and click "Save Configuration"
    Then an audit log entry is written with:
      | field         | value                                    |
      | event_type    | "sso_config_created"                     |
      | actor_id      | "user-admin-001"                         |
      | org_id        | "org-abc-001"                            |
      | timestamp     | UTC timestamp of save                    |
      | metadata      | entity_id of the imported configuration  |
    And a POLICY-04 notification email is sent to all Org Admins (excluding actor)
```

**Test Data:**
- Entity ID: `"https://idp.acme-corp.example"` captured in audit metadata

**Preconditions:**
- Audit log service is available
- At least one other Org Admin exists to receive notification

---

### T-6.1: Existing SSO configuration is replaced on re-import and audit logs update event
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Importing new metadata replaces the existing SSO configuration
    Given org "org-abc-001" has an existing SSO configuration with entity_id "https://old-idp.example"
    And I am authenticated as "org_admin" for org "org-abc-001"
    When I import new metadata with entity_id "https://new-idp.example" and save
    Then the "sso_configurations" table has exactly 1 row for org "org-abc-001"
    And that row has entity_id "https://new-idp.example"
    And the old entity_id "https://old-idp.example" is no longer stored
    And the audit log contains an entry with event_type "sso_config_updated"
```

**Test Data:**
- Old config: `{ entity_id: "https://old-idp.example", org_id: "org-abc-001" }`
- New config: `{ entity_id: "https://new-idp.example" }`

**Preconditions:**
- One existing SSO config row for the org

---

### T-7.1: Org Admin can remove SSO configuration — audit log and notification sent
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: Org Admin removes the SSO configuration
    Given org "org-abc-001" has an existing SSO configuration with entity_id "https://idp.acme-corp.example"
    And I am authenticated as "org_admin" "Admin Alice" for org "org-abc-001"
    When I click "Remove SSO configuration" and confirm the action
    Then the SSO configuration is deleted from "sso_configurations" for org "org-abc-001"
    And the audit log contains an entry with:
      | field         | value                              |
      | event_type    | "sso_config_deleted"               |
      | actor_id      | "user-admin-001"                   |
      | org_id        | "org-abc-001"                      |
    And a POLICY-04 notification email is sent to all Org Admins (excluding actor)
```

**Test Data:**
- Existing config: `{ entity_id: "https://idp.acme-corp.example", org_id: "org-abc-001" }`

**Preconditions:**
- SSO config exists for the org
- Admin JWT valid

---

### T-8.1: Platform Super Admin can manage SSO configuration for any org
**Maps to:** AC-8
**Category:** edge-case

```gherkin
  Scenario: Platform Super Admin imports metadata for an org they do not belong to
    Given "Super Admin Sam" (user_id: "user-super-001", role: "platform_super_admin") is authenticated
    And org "org-abc-001" has no SSO configuration
    When "Super Admin Sam" imports metadata via URL for org "org-abc-001" and saves
    Then the configuration is stored in "sso_configurations" for org "org-abc-001"
    And the audit log entry identifies "user-super-001" as the actor
    And a POLICY-04 notification email is sent to all Org Admins of "org-abc-001"
    And the email identifies "Super Admin Sam" as the actor

  Scenario: Platform Super Admin can update and delete SSO config for any org
    Given org "org-abc-001" has an existing SSO configuration
    When "Super Admin Sam" removes the SSO configuration for org "org-abc-001"
    Then the config is deleted
    And the audit log event_type is "sso_config_deleted" with actor "user-super-001"
```

**Test Data:**
- Super Admin JWT: `{ role: "platform_super_admin", user_id: "user-super-001" }`

**Preconditions:**
- Super Admin is not a member of org "org-abc-001"

---

### T-9.1: SCIM columns are present in schema as null after SSO config creation
**Maps to:** AC-9
**Category:** boundary

```gherkin
  Scenario: SCIM columns exist but are null after SSO configuration is saved
    Given org "org-abc-001" has no SSO configuration
    And I am authenticated as "org_admin" for org "org-abc-001"
    When I import metadata via URL and save
    Then a row is created in "sso_configurations"
    And the row has the following columns present with null values:
      | column          | value |
      | scim_endpoint   | null  |
      | scim_token      | null  |
    And the SSO configuration API response does NOT include "scim_endpoint" or "scim_token" fields
    And the SSO configuration UI does NOT display SCIM fields
```

**Test Data:**
- `sso_configurations` schema: includes `scim_endpoint` and `scim_token` as nullable columns

**Preconditions:**
- Database schema has SCIM columns defined

---

## Security Tests

### T-10.1: Metadata URL fetch is blocked for private IP ranges (SSRF protection)
**Maps to:** AC-10
**Category:** security

```gherkin
  Scenario Outline: Metadata URL resolving to a private IP range is rejected
    Given I am authenticated as "org_admin" for org "org-abc-001"
    When I enter metadata URL "<url>" and click "Import"
    Then the system rejects the request before making an outbound HTTP call
    And the error message is: "Unable to fetch metadata from this URL. Check the URL and try again, or upload the XML file directly."
    And no outbound HTTP request is made to the resolved IP

    Examples:
      | url                                              | notes                        |
      | https://internal.example.com/metadata            | resolves to 10.0.1.5         |
      | https://192.168.1.1/saml/metadata                | RFC 1918 private range       |
      | https://172.20.0.1/saml/metadata                 | RFC 1918 172.16.0.0/12       |
      | https://localhost/saml/metadata                  | loopback 127.0.0.1           |
      | http://[::1]/saml/metadata                       | IPv6 loopback                |
      | http://metadata.internal/latest/meta-data/       | EC2 metadata endpoint style  |
```

**Test Data:**
- URLs resolving to: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `::1`
- DNS resolution is mocked in test environment to return controlled IPs

**Preconditions:**
- SSRF protection is implemented in backend URL fetch logic
- DNS resolution mock available

---

### T-10.2: HTTP (non-HTTPS) metadata URLs are rejected
**Maps to:** AC-10 / Security NFR
**Category:** security

```gherkin
  Scenario: HTTP metadata URL is rejected — only HTTPS is accepted
    Given I am authenticated as "org_admin" for org "org-abc-001"
    When I enter metadata URL "http://idp.acme-corp.example/saml/metadata" and click "Import"
    Then the system rejects the URL before making any outbound request
    And an error is displayed: "Unable to fetch metadata from this URL. Check the URL and try again, or upload the XML file directly."
```

**Test Data:**
- Rejected URL scheme: `http://`
- Accepted URL scheme: `https://`

---

### T-10.3: SSO configuration reads are scoped to the admin's own org
**Maps to:** Security NFR
**Category:** security

```gherkin
  Scenario: Org Admin for Org A cannot read SSO configuration for Org B
    Given org "org-abc-001" has an SSO config with entity_id "https://idp-a.example"
    And org "org-xyz-002" has an SSO config with entity_id "https://idp-b.example"
    And I am authenticated as "org_admin" for org "org-abc-001"
    When I call GET "/api/v1/orgs/org-xyz-002/sso-config"
    Then the HTTP response status is 403
    And the response does not contain "https://idp-b.example"
```

**Test Data:**
- Two orgs with distinct SSO configs
- Admin JWT: `{ org_id: "org-abc-001" }` attempting cross-org read

---

## Authorization Tests

### T-AUTH-1.1: All SSO configuration endpoints require authentication
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario Outline: Unauthenticated request to SSO config endpoint returns 401
    Given no authentication token is present
    When I make a <method> request to "<path>"
    Then the HTTP response status is 401
    And no SSO configuration data is returned

    Examples:
      | method | path                                   |
      | GET    | /api/v1/orgs/org-abc-001/sso-config    |
      | POST   | /api/v1/orgs/org-abc-001/sso-config    |
      | PUT    | /api/v1/orgs/org-abc-001/sso-config    |
      | DELETE | /api/v1/orgs/org-abc-001/sso-config    |
```

**Test Data:**
- No `Authorization` header for any request

**Preconditions:**
- All endpoints enforce authentication

---

### T-AUTH-2.1: Non-admin user cannot create, update, or delete SSO configurations
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario Outline: Authenticated member-role user receives 403 on write operations
    Given I am authenticated with JWT: { "role": "member", "org_id": "org-abc-001" }
    When I make a <method> request to "<path>" with a valid request body
    Then the HTTP response status is 403
    And the response body identifies the required permission: "org_admin or platform_super_admin"
    And no SSO configuration is created, updated, or deleted

    Examples:
      | method | path                                   |
      | POST   | /api/v1/orgs/org-abc-001/sso-config    |
      | PUT    | /api/v1/orgs/org-abc-001/sso-config    |
      | DELETE | /api/v1/orgs/org-abc-001/sso-config    |
```

**Test Data:**
- JWT: `{ user_id: "user-member-001", role: "member", org_id: "org-abc-001" }`

---

## Additional Negative Tests

### T-NEG-1.1: Expired signing certificate in metadata triggers a warning but allows save
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Metadata contains an expired signing certificate — admin sees warning but can proceed
    Given the metadata at "https://idp.acme-corp.example/saml/metadata" contains a signing certificate that expired on "2024-01-01"
    And I am authenticated as "org_admin" for org "org-abc-001"
    When I import the metadata URL and view extracted values
    Then the review screen displays a warning: "Warning: The signing certificate in this metadata expires on 2024-01-01."
    And a "Save Configuration" button is still available (admin can proceed)
    When I click "Save Configuration"
    Then the configuration is saved with the expired certificate
    And the audit log records the save including certificate expiry date
```

**Test Data:**
- Metadata: valid SAML XML with `<X509Certificate>` encoded cert, CN="Expired Cert", notAfter="2024-01-01"

---

### T-NEG-1.2: File size exceeding limit is rejected
**Maps to:** NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: XML file exceeding the maximum allowed size is rejected at upload
    Given the maximum file size limit for SSO metadata uploads is defined (e.g., 512KB)
    And I attempt to upload a valid XML file of size 600KB
    When I submit the file
    Then the system rejects the upload with: "File too large. Maximum size is 512 KB."
    And no configuration is saved
```

**Test Data:**
- File: 600KB XML file (above assumed 512KB limit — actual limit to be defined per open question)

**Preconditions:**
- File size limit is configured server-side


# Test Specifications: Batch 05 — SSO-02, SSO-03, SSO-04, SSO-05

---

# Test Specifications: SSO-02 — SAML 2.0 SP-Initiated Login Flow

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2, T-1.3 | happy-path, boundary |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1, T-4.2, T-4.3 | error-handling |
| AC-5 | T-5.1, T-5.2 | error-handling |
| AC-6 | T-6.1 | happy-path |
| AC-7 | T-7.1, T-7.2 | error-handling |
| AC-8 | T-8.1, T-8.2 | boundary |
| AC-9 | T-9.1 | happy-path (manual/staging) |
| AC-10 | T-10.1 | happy-path (manual/staging) |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: SP-initiated SSO redirects user to IdP via redirect binding
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: SAML 2.0 SP-Initiated Login

  Background:
    Given the following org SSO configuration exists:
      | organization_id | idp_entity_id                                | sso_url                                           | acs_url                                                  | sp_entity_id                          | binding_type |
      | org_acme_001    | https://idp.okta.example.com/saml/metadata   | https://idp.okta.example.com/app/sso/saml/login   | https://app.example.com/auth/saml/acs                    | https://app.example.com/saml/metadata | redirect     |
    And the user "alice@acme.com" is associated with "org_acme_001"

  Scenario: User enters SSO-enabled email and is redirected to IdP with signed AuthnRequest
    Given the user is on the login page
    When they enter "alice@acme.com" in the email field
    And they click "Sign in with SSO"
    Then the system constructs a SAML AuthnRequest containing:
      | field       | expected_value                                        |
      | SP EntityID | https://app.example.com/saml/metadata                 |
      | ACS URL     | https://app.example.com/auth/saml/acs                 |
      | Destination | https://idp.okta.example.com/app/sso/saml/login       |
      | ID          | a non-empty unique identifier (UUID format)           |
      | IssueInstant| within 5 seconds of current UTC time                 |
    And the AuthnRequest is signed with the SP's private key
    And the user is HTTP 302 redirected to "https://idp.okta.example.com/app/sso/saml/login"
    And the redirect URL includes a "SAMLRequest" query parameter (base64-encoded)
    And the redirect URL includes a "RelayState" query parameter
    And the redirect URL includes a "SigAlg" query parameter
    And the redirect URL includes a "Signature" query parameter
```

**Test Data:**
- `organization_id`: `org_acme_001`
- `user_email`: `alice@acme.com`
- `idp_entity_id`: `https://idp.okta.example.com/saml/metadata`
- `sso_url`: `https://idp.okta.example.com/app/sso/saml/login`
- `acs_url`: `https://app.example.com/auth/saml/acs`
- `sp_entity_id`: `https://app.example.com/saml/metadata`

**Preconditions:**
- Org `org_acme_001` has a valid SAML SSO configuration with `sso_enforced = false`
- SP's signing key pair is configured and accessible
- User `alice@acme.com` is a member of `org_acme_001`

---

### T-1.2: RelayState carries original destination URL
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: RelayState encodes the originally requested destination
    Given the user is attempting to access "https://app.example.com/dashboard/reports"
    And they are redirected to the login page
    When they enter "alice@acme.com" and click "Sign in with SSO"
    Then the SAMLRequest's RelayState parameter encodes the original destination "https://app.example.com/dashboard/reports"
    And RelayState is not empty
    And RelayState is URL-safe encoded (no raw special characters in the query string)
```

**Test Data:**
- `original_destination`: `https://app.example.com/dashboard/reports`
- `user_email`: `alice@acme.com`

**Preconditions:**
- Org `org_acme_001` has SAML SSO configured
- User is unauthenticated and was redirected from a protected route

---

### T-1.3: Email domain lookup fails when org has no SSO config — SSO initiation blocked
**Maps to:** AC-1, AC-8
**Category:** boundary

```gherkin
  Scenario: Email domain for org without SSO config produces no AuthnRequest
    Given no SSO configuration exists for the org associated with "bob@nossodomain.com"
    When the user enters "bob@nossodomain.com" and clicks "Sign in with SSO"
    Then no SAML AuthnRequest is generated
    And the user sees: "SSO is not configured for your organization."
    And no redirect to an IdP occurs
```

**Test Data:**
- `user_email`: `bob@nossodomain.com`
- `organization`: org with no SSO config

**Preconditions:**
- Org exists in the system with no SSO configuration row

---

### T-2.1: Valid SAMLResponse at ACS endpoint creates user session and redirects to RelayState
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: SAML ACS Endpoint — Response Validation

  Scenario: Valid signed SAMLResponse creates session and redirects to original destination
    Given a valid SAMLResponse is prepared by a test SAML IdP with:
      | field              | value                                                       |
      | Issuer             | https://idp.okta.example.com/saml/metadata                  |
      | Audience           | https://app.example.com/saml/metadata                       |
      | Recipient (ACS)    | https://app.example.com/auth/saml/acs                       |
      | NameID             | alice@acme.com                                              |
      | NotBefore          | 2 minutes ago (UTC)                                         |
      | NotOnOrAfter       | 30 minutes from now (UTC)                                   |
      | Signature          | signed with the test IdP's private key (matching configured cert) |
      | InResponseTo       | a valid outstanding AuthnRequest ID                         |
    And the RelayState is "https://app.example.com/dashboard"
    When the SAMLResponse is HTTP POSTed to "https://app.example.com/auth/saml/acs"
    Then the system validates the signature against the configured IdP certificate
    And validates the Audience restriction matches the SP entity ID
    And validates NotBefore and NotOnOrAfter conditions
    And validates NameID is present and non-empty
    And a user session is created for "alice@acme.com" in org "org_acme_001"
    And the response is an HTTP 302 redirect to "https://app.example.com/dashboard"
    And the session cookie is set with Secure, HttpOnly, SameSite=Strict flags
```

**Test Data:**
- `saml_response`: signed XML from test SAML IdP with above attributes
- `relay_state`: `https://app.example.com/dashboard`
- `idp_signing_cert`: test certificate matching the private key used to sign the response

**Preconditions:**
- Org `org_acme_001` has SAML SSO configured with the test IdP's signing certificate
- Outstanding AuthnRequest ID exists in the system (was generated in the SP-initiation step)

---

### T-2.2: Redirect to app home when no RelayState present
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: SAMLResponse with no RelayState redirects to app home
    Given a valid SAMLResponse is prepared with no RelayState
    When the SAMLResponse is HTTP POSTed to the ACS endpoint
    Then the session is created successfully
    And the user is redirected to the application home page (e.g. "/dashboard" or "/")
    And no error is shown
```

**Test Data:**
- `relay_state`: absent (empty string or not included)

**Preconditions:**
- Same as T-2.1 except no RelayState

---

### T-3.1: POST binding sends AuthnRequest via form POST
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: SAML Binding Support

  Scenario: AuthnRequest delivered via HTTP POST binding when configured
    Given the org SSO configuration specifies binding_type = "post"
    When the user clicks "Sign in with SSO" for that org
    Then the system renders an auto-submitting HTML form targeting the IdP SSO URL
    And the form includes a hidden field "SAMLRequest" with the base64-encoded AuthnRequest
    And the form includes a hidden field "RelayState"
    And the form method is "POST"
    And the user's browser submits the form to the IdP SSO URL
```

**Test Data:**
- `binding_type`: `post`
- `idp_sso_url`: `https://idp.okta.example.com/app/sso/saml/login`

**Preconditions:**
- Org SSO config has `binding_type = "post"`

---

### T-3.2: ACS endpoint accepts SAMLResponse via HTTP POST regardless of AuthnRequest binding
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: ACS endpoint accepts SAMLResponse via HTTP POST (standard ACS binding)
    Given the org uses redirect binding for AuthnRequest
    When the IdP posts a SAMLResponse to the ACS endpoint via HTTP POST
    Then the ACS endpoint accepts the POST request
    And processes the SAMLResponse normally (validation and session creation per T-2.1)
```

**Test Data:**
- `acs_http_method`: `POST`

**Preconditions:**
- Org has redirect binding for AuthnRequest
- ACS URL is registered as a POST endpoint

---

### T-4.1: SAMLResponse with invalid signature — session not created, user-friendly error shown
**Maps to:** AC-4
**Category:** error-handling

```gherkin
Feature: SAML Assertion Validation — Signature Errors

  Scenario: SAMLResponse with invalid signature is rejected
    Given a SAMLResponse is constructed that is signed with an UNKNOWN private key
    And the configured IdP certificate does NOT correspond to this key
    When the SAMLResponse is POSTed to the ACS endpoint
    Then the system rejects the response
    And no user session is created
    And the user is shown: "Authentication failed. Your organization's SSO configuration may be incorrect. Contact your administrator."
    And the response does NOT include raw XML or cryptographic error detail in the page body
    And the server logs contain the full technical error (invalid signature, cert mismatch detail)
```

**Test Data:**
- `saml_response`: valid XML structure, but signed with a different (wrong) private key
- `configured_cert`: the correct IdP cert (does not match the signing key used)

**Preconditions:**
- Org SSO config exists with correct ACS URL
- Test SAML generator can produce responses signed with arbitrary keys

---

### T-4.2: SAMLResponse with missing signature — rejected
**Maps to:** AC-4
**Category:** error-handling

```gherkin
  Scenario: SAMLResponse with no signature element is rejected
    Given a SAMLResponse is constructed with the Signature element removed
    When the SAMLResponse is POSTed to the ACS endpoint
    Then the system rejects the response
    And no user session is created
    And the user is shown the same generic authentication error message
    And the server log records the failure reason as "missing signature"
```

**Test Data:**
- `saml_response`: valid SAML XML with `<ds:Signature>` element stripped out

**Preconditions:**
- Same as T-4.1

---

### T-4.3: Signature validation failure does not expose raw XML to user
**Maps to:** AC-4
**Category:** security / error-handling

```gherkin
  Scenario: Error page for invalid SAMLResponse contains no raw XML content
    Given a SAMLResponse with an invalid signature is submitted
    When the ACS endpoint rejects it
    Then the HTTP response body does NOT contain any substring matching "<saml" (case-insensitive)
    And the HTTP response body does NOT contain any substring matching "BEGIN CERTIFICATE"
    And the HTTP response body does NOT contain the raw base64 SAMLResponse value
```

**Test Data:**
- `saml_response`: tampered response that will fail signature validation

**Preconditions:**
- Same as T-4.1

---

### T-5.1: SAMLResponse with expired NotOnOrAfter — session not created
**Maps to:** AC-5
**Category:** error-handling

```gherkin
Feature: SAML Assertion Validation — Time Conditions

  Scenario: Expired SAML assertion is rejected
    Given a SAMLResponse is prepared with:
      | NotBefore    | 60 minutes ago (UTC)  |
      | NotOnOrAfter | 30 minutes ago (UTC)  |
    And the assertion is otherwise valid and correctly signed
    When the SAMLResponse is POSTed to the ACS endpoint
    Then the system rejects the assertion due to expiry
    And no user session is created
    And the user is shown: "Authentication failed. The SSO response has expired. Please try again."
```

**Test Data:**
- `NotBefore`: current UTC - 60 minutes
- `NotOnOrAfter`: current UTC - 30 minutes (past)

**Preconditions:**
- System clock is synchronized (or test can control the validation time)
- Org SAML config is valid

---

### T-5.2: SAMLResponse within ±2 minute clock skew tolerance is accepted
**Maps to:** AC-5 (boundary of tolerance)
**Category:** boundary

```gherkin
  Scenario: SAMLResponse with NotBefore 90 seconds in the future is accepted (within clock skew)
    Given a SAMLResponse is prepared with:
      | NotBefore    | current UTC + 90 seconds   |
      | NotOnOrAfter | current UTC + 30 minutes   |
    And the assertion is otherwise valid
    When the SAMLResponse is POSTed to the ACS endpoint
    Then the session IS created (within ±2 minute tolerance)
    And the user is redirected normally

  Scenario: SAMLResponse with NotBefore 3 minutes in the future is rejected (exceeds clock skew)
    Given a SAMLResponse is prepared with:
      | NotBefore    | current UTC + 180 seconds  |
      | NotOnOrAfter | current UTC + 30 minutes   |
    And the assertion is otherwise valid
    When the SAMLResponse is POSTed to the ACS endpoint
    Then the session is NOT created (NotBefore is beyond the ±2 minute tolerance)
    And the user is shown the expiry error message
```

**Test Data:**
- Parameterized time offsets: +90s (should pass), +180s (should fail)

**Preconditions:**
- Clock skew tolerance configured at ±120 seconds

---

### T-6.1: Successful SSO login writes complete audit log entry
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: SAML SSO Audit Logging

  Scenario: Successful SAML login produces a complete audit log record
    Given "alice@acme.com" completes a successful SAML 2.0 SSO login
    When the session is created
    Then an audit log entry exists with ALL of the following fields populated:
      | field         | expected                                  |
      | event_type    | sso_login_success                         |
      | user_id       | the user's platform user ID (non-empty)   |
      | organization_id | org_acme_001                            |
      | idp_entity_id | https://idp.okta.example.com/saml/metadata |
      | name_id       | alice@acme.com                            |
      | timestamp     | within 5 seconds of login completion time |
      | ip_address    | the client IP from the ACS request        |
      | user_agent    | the client UA from the ACS request        |
    And no field is null or empty
```

**Test Data:**
- `client_ip`: `192.168.1.50`
- `user_agent`: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36`

**Preconditions:**
- Valid SAML login flow completed (as per T-2.1)
- Audit log store is accessible and queryable in the test environment

---

### T-7.1: Failed SAML assertion writes audit log entry
**Maps to:** AC-7
**Category:** error-handling

```gherkin
  Scenario: Invalid signature failure writes sso_login_failed audit log entry
    Given a SAMLResponse with an invalid signature is submitted for org "org_acme_001"
    When the ACS endpoint rejects it
    Then an audit log entry exists with:
      | field          | expected                            |
      | event_type     | sso_login_failed                    |
      | organization_id | org_acme_001                       |
      | failure_reason | a human-readable reason (e.g. "signature_invalid") |
      | timestamp      | within 5 seconds of the rejection   |
      | ip_address     | the client IP from the request       |
      | user_agent     | the client UA from the request       |
    And the audit log entry does NOT include the raw SAMLResponse XML
    And the audit log entry does NOT include the full certificate or key material
```

**Test Data:**
- `failure_reason` should be one of: `signature_invalid`, `assertion_expired`, `audience_mismatch`, `missing_name_id`

**Preconditions:**
- Org SAML config exists
- Audit log is queryable

---

### T-7.2: Expired assertion failure also writes audit log
**Maps to:** AC-7
**Category:** error-handling

```gherkin
  Scenario: Expired assertion failure writes sso_login_failed audit log entry
    Given a SAMLResponse with NotOnOrAfter in the past is submitted
    When the ACS endpoint rejects it
    Then an audit log entry exists with event_type "sso_login_failed" and failure_reason "assertion_expired"
```

**Test Data:**
- Same as T-5.1

**Preconditions:**
- Same as T-5.1

---

### T-8.1: User's org has no SSO config — SSO initiation returns error
**Maps to:** AC-8
**Category:** boundary

```gherkin
Feature: SSO Login — No Configuration Guard

  Scenario: Org without SSO config blocks SSO login initiation
    Given the org for "charlie@nosso.com" has no SAML SSO configuration row
    When a POST request is made to the SSO initiation endpoint with email "charlie@nosso.com"
    Then the HTTP response status is 400 or 422
    And the response body contains: "SSO is not configured for your organization."
    And no SAMLRequest is constructed
    And no redirect to any IdP URL occurs
```

**Test Data:**
- `user_email`: `charlie@nosso.com`
- `organization`: exists in DB, `sso_config` row absent

**Preconditions:**
- User and org exist but no SSO config

---

### T-8.2: Direct ACS endpoint POST for org with no SSO config is rejected
**Maps to:** AC-8
**Category:** boundary

```gherkin
  Scenario: ACS endpoint rejects SAMLResponse for org with no SSO config
    Given no SAML SSO configuration exists for org "org_nosso_002"
    When a SAMLResponse is POSTed to the ACS endpoint claiming to be for "org_nosso_002"
    Then the system rejects the response
    And no session is created
    And the response body contains the no-SSO-config error message
```

**Test Data:**
- `organization_id` embedded in SAMLResponse: `org_nosso_002`

**Preconditions:**
- `org_nosso_002` exists but has no SSO config

---

### T-9.1: End-to-end SP-initiated flow with real Okta tenant (staging, manual)
**Maps to:** AC-9
**Category:** happy-path (manual / staging integration test)

```gherkin
  Scenario: Full SP-initiated login with Okta tenant completes successfully
    Given the staging environment has a SAML SSO config for "okta-test-org" pointing to a real Okta application
    And a test user "sso-tester@okta-test-org.example.com" exists in both the Okta directory and the platform
    When the test user initiates SSO login from the staging login page
    And is redirected to Okta and authenticates with valid Okta credentials
    And Okta posts a SAMLResponse to the staging ACS endpoint
    Then a valid user session is created for the test user
    And the user lands on the application dashboard
    And the audit log contains a sso_login_success entry for this event
    And this test result is documented in the acceptance sign-off record
```

**Test Data:**
- Okta tenant: configured real Okta app (test account)
- Test user: `sso-tester@okta-test-org.example.com` in Okta directory

**Preconditions:**
- Staging environment deployed and ACS URL registered in Okta
- Okta test app configured with SP entity ID and ACS URL

---

### T-10.1: End-to-end SP-initiated flow with real Azure AD tenant (staging, manual)
**Maps to:** AC-10
**Category:** happy-path (manual / staging integration test)

```gherkin
  Scenario: Full SP-initiated login with Azure AD tenant completes successfully
    Given the staging environment has a SAML SSO config for "azuread-test-org" pointing to a real Azure AD enterprise application
    And a test user "sso-tester@azuread-test-org.onmicrosoft.com" exists in Azure AD and the platform
    When the test user initiates SSO login from the staging login page
    And is redirected to Azure AD and authenticates with valid credentials
    And Azure AD posts a SAMLResponse to the staging ACS endpoint
    Then a valid user session is created for the test user
    And the user lands on the application dashboard
    And the audit log contains a sso_login_success entry for this event
    And this test result is documented in the acceptance sign-off record
```

**Test Data:**
- Azure AD tenant: real enterprise application registered in test Azure AD tenant
- Test user: `sso-tester@azuread-test-org.onmicrosoft.com`

**Preconditions:**
- Staging environment deployed and ACS URL registered in Azure AD
- Azure AD enterprise app configured with SP entity ID and Reply URL (ACS)

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated access to protected resource after SAML flow (before session) returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: SAML SSO — Authorization Enforcement

  Scenario: Request to protected resource with no session token returns 401
    Given no session cookie or Authorization header is present in the request
    When a GET request is made to "https://app.example.com/dashboard"
    Then the HTTP response status is 401
    And the response redirects to the login page
    And no resource data is returned
```

**Test Data:**
- `request_headers`: no `Cookie`, no `Authorization`
- `target_url`: `https://app.example.com/dashboard`

**Preconditions:**
- Protected route exists and requires authentication

---

### T-AUTH-2.1: Deactivated user who authenticates via SAML cannot access protected resource — 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Deactivated user account completing SAML flow is denied access with 403
    Given user "deactivated@acme.com" has `account_status = "deactivated"` in the platform
    And a valid SAMLResponse is submitted for "deactivated@acme.com"
    When the ACS endpoint processes the response
    Then the system creates or acknowledges the user identity
    But the subsequent request to any protected resource returns 403 Forbidden
    And the response body identifies the reason as "Account deactivated"
```

**Test Data:**
- `user_email`: `deactivated@acme.com`
- `account_status`: `deactivated`

**Preconditions:**
- User exists in DB with `account_status = "deactivated"`
- Valid SAML assertion for that user

---

### T-AUTH-2.2: Wrong-role user authenticated via SAML cannot access role-restricted resource — 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: User with insufficient role accesses role-restricted resource and receives 403
    Given user "viewer@acme.com" has role "viewer" (not "admin")
    And a valid SAMLResponse completes SSO login for "viewer@acme.com"
    When the user's session token is used to GET "/admin/settings"
    Then the HTTP response status is 403 Forbidden
    And the response body identifies the missing permission (e.g. "Requires role: admin")
    And no admin settings data is returned
```

**Test Data:**
- `user_email`: `viewer@acme.com`
- `user_role`: `viewer`
- `restricted_endpoint`: `GET /admin/settings` (requires `admin` role)

**Preconditions:**
- User exists with `viewer` role
- Admin settings endpoint enforces role check

---

## Negative Tests

### T-NEG-1: Replay attack — same SAMLResponse assertion ID rejected on second use
**Maps to:** NFR (Security — Replay Protection)
**Category:** security

```gherkin
  Scenario: Same SAMLResponse submitted twice — second submission rejected as replay
    Given a valid SAMLResponse is submitted and results in a successful login (T-2.1)
    When the identical SAMLResponse (same assertion ID) is submitted again to the ACS endpoint
    Then the second submission is rejected
    And no new session is created
    And a "sso_login_failed" audit log entry is written with reason "replay_detected"
    And the user sees: "Authentication failed."
```

**Test Data:**
- Reuse the exact same SAMLResponse bytes from T-2.1

**Preconditions:**
- Assertion ID tracking cache is active

---

### T-NEG-2: SAMLResponse with wrong Audience — session not created
**Maps to:** AC-2 (audience validation)
**Category:** error-handling

```gherkin
  Scenario: SAMLResponse with incorrect Audience restriction is rejected
    Given a SAMLResponse is prepared with Audience = "https://attacker.example.com/saml/metadata"
    And the SP entity ID is "https://app.example.com/saml/metadata"
    When the SAMLResponse is POSTed to the ACS endpoint
    Then the session is NOT created
    And the failure is logged as "audience_mismatch"
    And the user sees the generic authentication error
```

**Test Data:**
- `audience_in_response`: `https://attacker.example.com/saml/metadata`
- `configured_sp_entity_id`: `https://app.example.com/saml/metadata`

**Preconditions:**
- Org SAML config exists with correct SP entity ID

---

---

# Test Specifications: SSO-03 — OIDC Login Flow

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path, security |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1, T-4.2 | error-handling |
| AC-5 | T-5.1 | happy-path |
| AC-6 | T-6.1 | error-handling |
| AC-7 | T-7.1, T-7.2 | security |
| AC-8 | T-8.1 | boundary |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: OIDC login redirects user to IdP authorization endpoint with PKCE parameters
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: OIDC SP-Initiated Login — Authorization Request

  Background:
    Given the following OIDC SSO configuration exists for org "org_oidc_001":
      | field           | value                                                        |
      | issuer_url      | https://accounts.google.com                                  |
      | client_id       | client_abc123                                                |
      | client_secret   | [encrypted at rest — not exposed in tests]                  |
      | redirect_uri    | https://app.example.com/auth/oidc/callback                  |
      | scopes          | openid email profile                                         |
      | auth_endpoint   | https://accounts.google.com/o/oauth2/v2/auth                |
      | token_endpoint  | https://oauth2.googleapis.com/token                          |
      | jwks_uri        | https://www.googleapis.com/oauth2/v3/certs                  |
    And user "diana@org-oidc.com" is associated with "org_oidc_001"

  Scenario: OIDC login initiation generates valid PKCE authorization request
    Given the user enters "diana@org-oidc.com" and initiates SSO login
    When the system generates the authorization redirect
    Then the user is redirected to "https://accounts.google.com/o/oauth2/v2/auth"
    And the redirect URL includes the following query parameters:
      | parameter      | expected                                                  |
      | response_type  | code                                                      |
      | client_id      | client_abc123                                             |
      | redirect_uri   | https://app.example.com/auth/oidc/callback                |
      | scope          | contains "openid" and "email"                             |
      | state          | a non-empty opaque value (stored server-side for CSRF check) |
      | code_challenge | a non-empty base64url-encoded S256 hash of the code_verifier |
      | code_challenge_method | S256                                               |
    And the code_verifier is stored server-side (session or short-lived cache) for use in the token exchange
```

**Test Data:**
- `user_email`: `diana@org-oidc.com`
- `org_id`: `org_oidc_001`
- `client_id`: `client_abc123`

**Preconditions:**
- OIDC SSO config for `org_oidc_001` exists and is active
- SP can generate PKCE verifier/challenge pairs

---

### T-1.2: Org without OIDC config — OIDC login blocked
**Maps to:** AC-1, AC-8
**Category:** boundary

```gherkin
  Scenario: OIDC login initiation for org without OIDC config returns error
    Given the org associated with "eve@nooidc.com" has no OIDC SSO configuration
    When "eve@nooidc.com" initiates an OIDC SSO login
    Then no authorization redirect is generated
    And the user sees: "SSO is not configured for your organization."
    And no HTTP redirect to any IdP occurs
```

**Test Data:**
- `user_email`: `eve@nooidc.com`
- Org has no OIDC config

**Preconditions:**
- User's org exists with no OIDC SSO configuration row

---

### T-2.1: Callback with valid authorization code and matching state — token exchange proceeds
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: OIDC Callback — Token Exchange

  Scenario: Valid callback with matching state triggers successful token exchange
    Given an OIDC authorization request was initiated (T-1.1) and a state value "stateABC789" was generated and stored
    And the IdP redirects to "https://app.example.com/auth/oidc/callback?code=authcode123&state=stateABC789"
    When the callback endpoint receives the request
    Then the system validates that "stateABC789" matches the stored state
    And the system exchanges "authcode123" for tokens using:
      | parameter      | value                                    |
      | grant_type     | authorization_code                       |
      | code           | authcode123                              |
      | redirect_uri   | https://app.example.com/auth/oidc/callback |
      | client_id      | client_abc123                            |
      | code_verifier  | the original PKCE verifier               |
    And the token endpoint returns an ID token and access token
```

**Test Data:**
- `state`: `stateABC789` (stored server-side during auth initiation)
- `authorization_code`: `authcode123`
- `code_verifier`: value generated during T-1.1

**Preconditions:**
- Prior authorization request with matching state exists in server-side store
- Token endpoint is stubbed or available (staging)

---

### T-2.2: Mismatched state parameter — token exchange aborted (CSRF protection)
**Maps to:** AC-2, AC-7
**Category:** security

```gherkin
  Scenario: Callback with mismatched state is rejected before token exchange
    Given an OIDC authorization request was initiated and state "stateABC789" was stored
    And the callback arrives with "?code=authcode123&state=TAMPERED_STATE"
    When the callback endpoint receives the request
    Then the state validation FAILS
    And no token exchange request is made to the token endpoint
    And the user is shown: "Authentication failed. Please try again."
    And the failure is logged as "state_mismatch"
    And the stored state is invalidated (cannot be reused)
```

**Test Data:**
- `stored_state`: `stateABC789`
- `received_state`: `TAMPERED_STATE`

**Preconditions:**
- Valid prior auth initiation with `stateABC789` in server-side store

---

### T-3.1: Valid ID token is validated and user session is created
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: OIDC Token Validation and Session Creation

  Scenario: Valid ID token passes all validation checks and creates a session
    Given the token exchange (T-2.1) returned an ID token with:
      | claim  | value                                    |
      | iss    | https://accounts.google.com              |
      | aud    | client_abc123                            |
      | sub    | 1234567890abcdef                         |
      | email  | diana@org-oidc.com                       |
      | exp    | current UTC + 60 minutes                 |
      | iat    | current UTC - 5 seconds                  |
    And the ID token is signed with a key from "https://www.googleapis.com/oauth2/v3/certs"
    When the system validates the ID token
    Then the signature is verified against the IdP's JWKS
    And "iss" matches the configured issuer "https://accounts.google.com"
    And "aud" matches the configured client ID "client_abc123"
    And "exp" has not passed (within ±2 minute tolerance)
    And user identity is extracted: sub="1234567890abcdef", email="diana@org-oidc.com"
    And a user session is created for "diana@org-oidc.com" in org "org_oidc_001"
    And the user is redirected to the application
```

**Test Data:**
- ID token claims as above
- JWKS signing key: test RS256 key pair

**Preconditions:**
- OIDC config for `org_oidc_001` with correct `issuer`, `client_id`, `jwks_uri`
- JWKS endpoint returns the correct public key (stubbed or real in staging)

---

### T-3.2: ID token with wrong issuer is rejected
**Maps to:** AC-3
**Category:** error-handling

```gherkin
  Scenario: ID token with mismatched issuer is rejected
    Given an ID token with iss="https://malicious-idp.example.com"
    And the configured issuer is "https://accounts.google.com"
    When the system validates the ID token
    Then validation fails with reason "issuer_mismatch"
    And no session is created
    And the user sees the generic authentication failed message
```

**Test Data:**
- `id_token_iss`: `https://malicious-idp.example.com`
- `configured_issuer`: `https://accounts.google.com`

**Preconditions:**
- Same OIDC config as T-3.1

---

### T-4.1: Expired ID token rejected (beyond ±2 minute tolerance)
**Maps to:** AC-4
**Category:** error-handling

```gherkin
Feature: OIDC Token Validation — Expiry

  Scenario: ID token with exp 5 minutes in the past is rejected
    Given an ID token with:
      | claim | value                          |
      | exp   | current UTC - 300 seconds      |
      | iss   | https://accounts.google.com    |
      | aud   | client_abc123                  |
    And the token is otherwise valid and correctly signed
    When the system validates the token
    Then the validation fails with reason "token_expired"
    And no session is created
    And the user is shown: "Authentication failed. The SSO response has expired. Please try again."
```

**Test Data:**
- `exp`: current UTC - 300 seconds (5 min ago, beyond 2 min tolerance)

**Preconditions:**
- Clock skew tolerance is ±120 seconds

---

### T-4.2: ID token within ±2 minute clock skew tolerance is accepted
**Maps to:** AC-4 (boundary of tolerance)
**Category:** boundary

```gherkin
  Scenario: ID token with exp 90 seconds in the past is accepted (within clock skew)
    Given an ID token with exp = current UTC - 90 seconds
    And the token is otherwise valid
    When the system validates the token
    Then the session IS created (within the ±2 min tolerance)

  Scenario: ID token with exp 3 minutes in the past is rejected (exceeds clock skew)
    Given an ID token with exp = current UTC - 180 seconds
    And the token is otherwise valid
    When the system validates the token
    Then the session is NOT created
    And the expiry error is shown
```

**Test Data:**
- Parameterized: -90s (should pass), -180s (should fail)

**Preconditions:**
- Same as T-4.1

---

### T-5.1: Successful OIDC login writes complete audit log entry
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: OIDC Audit Logging

  Scenario: Successful OIDC login produces complete audit log record
    Given "diana@org-oidc.com" completes a successful OIDC login (per T-3.1)
    When the session is created
    Then an audit log entry exists with ALL of the following fields populated:
      | field          | expected                                   |
      | event_type     | sso_login_success                          |
      | user_id        | the user's platform user ID (non-empty)    |
      | organization_id | org_oidc_001                              |
      | oidc_issuer    | https://accounts.google.com               |
      | sub_claim      | 1234567890abcdef                           |
      | timestamp      | within 5 seconds of login completion       |
      | ip_address     | client IP from the callback request        |
      | user_agent     | client UA from the callback request        |
    And the audit log does NOT include the raw ID token or client secret
```

**Test Data:**
- `client_ip`: `10.0.1.25`
- `user_agent`: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36`

**Preconditions:**
- Successful OIDC login flow completed
- Audit log store is queryable

---

### T-6.1: Failed OIDC token validation writes audit log entry
**Maps to:** AC-6
**Category:** error-handling

```gherkin
  Scenario: ID token validation failure writes sso_login_failed audit log entry
    Given a token validation failure occurs (e.g. invalid signature as in T-3.2)
    When the callback endpoint detects the failure
    Then an audit log entry exists with:
      | field           | expected                            |
      | event_type      | sso_login_failed                    |
      | organization_id | org_oidc_001                        |
      | failure_reason  | a human-readable reason (not the raw token) |
      | timestamp       | within 5 seconds of the failure      |
      | ip_address      | the client IP from the request       |
      | user_agent      | the client UA from the request       |
    And the raw ID token is NOT stored in the audit log
```

**Test Data:**
- Same as T-3.2

**Preconditions:**
- OIDC config for `org_oidc_001` exists

---

### T-7.1: Invalid state parameter — CSRF protection
**Maps to:** AC-7
**Category:** security

See T-2.2 above — this test covers AC-7 directly.

```gherkin
  Scenario: Callback with missing state parameter is rejected
    Given an OIDC authorization request was initiated
    And the callback arrives with "?code=authcode123" (no state parameter)
    When the callback endpoint receives the request
    Then the system rejects the request
    And no token exchange occurs
    And the user sees: "Authentication failed. Please try again."
    And the failure is logged
```

**Test Data:**
- `callback_url`: `https://app.example.com/auth/oidc/callback?code=authcode123`
- No `state` parameter present

**Preconditions:**
- Prior authorization request was initiated

---

### T-7.2: State parameter replay — used state is rejected
**Maps to:** AC-7
**Category:** security

```gherkin
  Scenario: State value from a completed flow cannot be reused
    Given a complete OIDC login flow succeeded using state "stateABC789"
    When a second callback arrives with the same "state=stateABC789"
    Then the system rejects the request (state has been consumed/invalidated)
    And no new session is created
    And the failure is logged
```

**Test Data:**
- `state`: `stateABC789` (previously consumed)

**Preconditions:**
- State values are single-use and invalidated after first use

---

### T-8.1: Org without OIDC config — OIDC login path blocked
**Maps to:** AC-8
**Category:** boundary

```gherkin
Feature: OIDC Login — No Configuration Guard

  Scenario: OIDC login for org without config is rejected
    Given the org for "frank@nooidc.com" has no OIDC SSO configuration
    When a POST request is made to the OIDC login initiation endpoint with email "frank@nooidc.com"
    Then the HTTP response status is 400 or 422
    And the response body contains: "SSO is not configured for your organization."
    And no authorization redirect is generated
```

**Test Data:**
- `user_email`: `frank@nooidc.com`

**Preconditions:**
- User's org has no OIDC config row

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to protected resource returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: OIDC — Authorization Enforcement

  Scenario: Request to protected resource before OIDC session is established returns 401
    Given no session cookie or Authorization header is present
    When a GET request is made to "https://app.example.com/projects"
    Then the HTTP response status is 401 Unauthorized
    And the user is redirected to the login page
    And no project data is returned
```

**Test Data:**
- `target_url`: `https://app.example.com/projects`
- No auth headers

**Preconditions:**
- `/projects` route is a protected resource

---

### T-AUTH-2.1: User without required role after OIDC login receives 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: User with 'viewer' role cannot access admin-only endpoint after OIDC login
    Given "viewer@org-oidc.com" has role "viewer" and completes OIDC login
    When they use their session token to GET "/admin/users"
    Then the HTTP response status is 403 Forbidden
    And the response identifies the missing permission (e.g. "Requires role: admin")
    And no user data from the admin endpoint is returned
```

**Test Data:**
- `user_email`: `viewer@org-oidc.com`
- `user_role`: `viewer`
- `restricted_endpoint`: `GET /admin/users`

**Preconditions:**
- User exists with `viewer` role
- Admin endpoint enforces role check

---

### T-AUTH-2.2: Deactivated user account after OIDC login receives 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Deactivated user who completes OIDC token flow cannot access protected resources
    Given "deactivated@org-oidc.com" has account_status = "deactivated"
    And a valid OIDC ID token is received for this user
    When the callback endpoint processes the token
    Then a session may or may not be created, but access to any protected resource returns 403
    And the response identifies the reason as "Account deactivated" or equivalent
```

**Test Data:**
- `user_email`: `deactivated@org-oidc.com`
- `account_status`: `deactivated`

**Preconditions:**
- User exists in DB with `account_status = "deactivated"`

---

## Negative Tests

### T-NEG-1: Token endpoint returns OAuth error — login fails gracefully
**Maps to:** NFR (Error Handling)
**Category:** error-handling

```gherkin
  Scenario: Token endpoint returns error response — user sees friendly message
    Given the token endpoint is stubbed to return:
      | HTTP Status | 400                                     |
      | Body        | {"error": "invalid_grant", "error_description": "Code expired"} |
    When the callback triggers a token exchange
    Then no session is created
    And the OAuth error code "invalid_grant" is logged server-side (not shown to user)
    And the user is shown: "Authentication failed. Contact your administrator if this persists."
```

**Test Data:**
- Stubbed token endpoint response: `400 {"error":"invalid_grant"}`

**Preconditions:**
- Token endpoint mock/stub is configurable in test environment

---

### T-NEG-2: JWKS endpoint unreachable — login rejected
**Maps to:** NFR (Error Handling)
**Category:** error-handling

```gherkin
  Scenario: JWKS endpoint returns connection timeout during signature verification
    Given the JWKS endpoint "https://www.googleapis.com/oauth2/v3/certs" is unreachable (timeout)
    And no cached JWKS is available
    When the system attempts to verify the ID token signature
    Then signature verification fails
    And no session is created
    And the user is shown: "Authentication failed."
    And the server log records a JWKS fetch failure with the endpoint URL and error detail
```

**Test Data:**
- JWKS URI configured but endpoint returns connection timeout

**Preconditions:**
- JWKS caching is empty or expired
- Network-level stub blocks JWKS endpoint

---

---

# Test Specifications: SSO-04 — Forced SSO Enforcement with Immediate Session Invalidation

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2, T-2.3 | happy-path, boundary |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1, T-4.2 | error-handling |
| AC-5 | T-5.1, T-5.2 | happy-path |
| AC-6 | T-6.1, T-6.2 | happy-path |
| AC-7 | T-7.1 | boundary |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Confirmation dialog appears before SSO enforcement is saved
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: SSO Enforcement — Enable Flow

  Background:
    Given an authenticated Org Admin "admin@acme.com" with role "org_admin" for org "org_acme_001"
    And org "org_acme_001" has an active SAML SSO configuration
    And `sso_enforced = false` for "org_acme_001"

  Scenario: Toggling SSO enforcement shows confirmation dialog before saving
    Given the Org Admin is on the organization policy settings page
    When they toggle "Require SSO for all users" to ON and click "Save"
    Then a modal confirmation dialog appears with the text:
      "This will immediately log out all active users in your organization. Proceed?"
    And the dialog contains a "Cancel" button and a "Confirm" button
    And `sso_enforced` has NOT been updated in the database (change is pending confirmation)
```

**Test Data:**
- `org_id`: `org_acme_001`
- `admin_user`: `admin@acme.com`, role `org_admin`

**Preconditions:**
- Org admin is authenticated with a valid session
- Org has an active SSO configuration

---

### T-1.2: Clicking Cancel on confirmation dialog does not save the enforcement setting
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Admin clicks Cancel — SSO enforcement setting is not changed
    Given the confirmation dialog is shown
    When the Org Admin clicks "Cancel"
    Then the dialog closes
    And `sso_enforced` remains `false` for org "org_acme_001"
    And no sessions are invalidated
    And no audit log entry is written for this interaction
```

**Test Data:**
- Same as T-1.1

**Preconditions:**
- Same as T-1.1

---

### T-2.1: Clicking Confirm invalidates all active org sessions immediately
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: SSO Enforcement — Session Invalidation

  Scenario: Confirming SSO enforcement invalidates all active org user sessions
    Given the following active sessions exist for org "org_acme_001" users:
      | user_id      | session_token | expires_at          |
      | user_001     | tok_aaa111    | 2026-06-16T12:00:00Z |
      | user_002     | tok_bbb222    | 2026-06-17T09:00:00Z |
      | user_003     | tok_ccc333    | 2026-06-15T23:00:00Z |
    And none of these users are designated break-glass accounts
    When the Org Admin clicks "Confirm" on the SSO enforcement dialog
    Then `sso_enforced = true` is saved for org "org_acme_001"
    And all three tokens (tok_aaa111, tok_bbb222, tok_ccc333) are immediately invalidated
    And a subsequent API request using "tok_aaa111" returns 401 Unauthorized
    And a subsequent API request using "tok_bbb222" returns 401 Unauthorized
    And a subsequent API request using "tok_ccc333" returns 401 Unauthorized
```

**Test Data:**
- `org_id`: `org_acme_001`
- Active sessions: as listed above
- `break_glass_accounts` table: empty for this org

**Preconditions:**
- Three users with active sessions in the org
- No break-glass designation for this org

---

### T-2.2: Break-glass account session is NOT invalidated during SSO enforcement
**Maps to:** AC-2
**Category:** boundary

```gherkin
  Scenario: Break-glass account session survives SSO enforcement activation
    Given user "breakglass@acme.com" (user_id: user_bg_001) is the designated break-glass account for "org_acme_001"
    And "breakglass@acme.com" has an active session token "tok_bg_active"
    And other org users have active sessions (tok_aaa111, tok_bbb222)
    When the Org Admin confirms SSO enforcement
    Then "tok_aaa111" and "tok_bbb222" are invalidated
    And "tok_bg_active" remains valid
    And a subsequent API request using "tok_bg_active" returns 200 (not 401)
```

**Test Data:**
- `break_glass_user_id`: `user_bg_001`
- `break_glass_session_token`: `tok_bg_active`

**Preconditions:**
- Break-glass designation exists for user_bg_001 in org_acme_001

---

### T-2.3: Session invalidation handles orgs with no active sessions gracefully
**Maps to:** AC-2
**Category:** boundary

```gherkin
  Scenario: SSO enforcement enabled for org with zero active sessions — no error
    Given org "org_empty_sessions" has no active user sessions
    And the Org Admin confirms SSO enforcement
    Then `sso_enforced = true` is saved successfully
    And no error is returned
    And an audit log entry is written normally
```

**Test Data:**
- `org_id`: `org_empty_sessions`
- Active sessions: 0

**Preconditions:**
- Org exists with valid SSO config but no active sessions

---

### T-3.1: Invalidated user is redirected to login with SSO message on next request
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: SSO Enforcement — User Redirect After Invalidation

  Scenario: User whose session was invalidated by SSO enforcement sees redirect message
    Given user "user_001" had session "tok_aaa111" that was invalidated (per T-2.1)
    When user_001 makes a request using "tok_aaa111"
    Then the HTTP response is a redirect to the login page
    And the login page displays: "Your organization now requires SSO login."
    And a "Sign in with SSO" button or equivalent SSO login flow is visible
```

**Test Data:**
- `session_token`: `tok_aaa111` (invalidated)

**Preconditions:**
- SSO enforcement was activated for the user's org (T-2.1 completed)

---

### T-4.1: Password-based login rejected for SSO-enforced org without password check
**Maps to:** AC-4
**Category:** error-handling

```gherkin
Feature: SSO Enforcement — Password Login Block

  Scenario: User of SSO-enforced org cannot login via email/password
    Given org "org_acme_001" has `sso_enforced = true`
    And "alice@acme.com" is a regular member of "org_acme_001" (not break-glass)
    When a POST request is made to "/auth/login" with:
      | field    | value                          |
      | email    | alice@acme.com                 |
      | password | any_password_including_correct |
    Then the response status is 403
    And the response contains: "Your organization requires SSO login. Use the SSO option to sign in."
    And a "Sign in with SSO" link or button is included in the response
    And the password is NOT verified (no credential lookup occurs)
    And an audit log entry is written: event_type="login_failed", reason="sso_enforced"
```

**Test Data:**
- `email`: `alice@acme.com`
- `password`: `CorrectHorseBatteryStaple123!` (correct password — should NOT be checked)
- `sso_enforced`: `true`

**Preconditions:**
- `sso_enforced = true` for org_acme_001
- alice@acme.com has a valid password set in the system (but it should not be checked)

---

### T-4.2: Password login timing does not reveal whether org uses SSO — no timing oracle
**Maps to:** AC-4, NFR (Security — Timing)
**Category:** security

```gherkin
  Scenario: Response time for SSO-blocked login is not measurably faster than normal password check
    Given org "org_acme_001" has `sso_enforced = true`
    And a control org "org_normal" has `sso_enforced = false`
    When 50 login attempts with invalid passwords are made to org_acme_001 (SSO-blocked)
    And 50 login attempts with invalid passwords are made to org_normal (password-checked)
    Then the median response time difference between SSO-blocked and password-checked attempts is < 20ms
```

**Test Data:**
- Two orgs: one SSO-enforced, one not
- 50 samples each

**Preconditions:**
- Timing test runs in a consistent environment (isolated test infra)

---

### T-5.1: SSO enforcement activation writes audit log and sends POLICY-04 notification
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: SSO Enforcement — Audit Logging

  Scenario: Enabling SSO enforcement produces audit log and admin notification
    Given an Org Admin enables SSO enforcement for org "org_acme_001"
    When the save is confirmed
    Then an audit log entry exists with:
      | field          | expected                          |
      | event_type     | sso_enforcement_enabled           |
      | actor_id       | the Org Admin's user ID           |
      | organization_id | org_acme_001                     |
      | timestamp      | within 5 seconds of the save       |
    And a POLICY-04 notification is sent to all Org Admins of "org_acme_001"
```

**Test Data:**
- `actor_id`: admin user ID
- `org_id`: `org_acme_001`
- POLICY-04 notification recipients: all `org_admin` role users in the org

**Preconditions:**
- Multiple Org Admins exist for the org to verify broadcast
- Notification system (POLICY-04) is testable in staging

---

### T-5.2: Disabling SSO enforcement also writes audit log
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Disabling SSO enforcement produces sso_enforcement_disabled audit log entry
    Given org "org_acme_001" has `sso_enforced = true`
    When the Org Admin disables SSO enforcement and saves (with confirmation if applicable)
    Then an audit log entry exists with event_type "sso_enforcement_disabled" and the Org Admin's actor ID
    And a POLICY-04 notification is sent to all Org Admins
```

**Test Data:**
- Same as T-5.1

**Preconditions:**
- SSO is currently enforced for the org

---

### T-6.1: Disabling SSO enforcement allows password login again
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: SSO Enforcement — Disable Flow

  Scenario: After SSO enforcement is disabled, users can login via email/password
    Given org "org_acme_001" had `sso_enforced = true` and is now set to `sso_enforced = false`
    When "alice@acme.com" attempts to log in via email/password with correct credentials
    Then the login succeeds
    And a new session is created
    And the user is not shown the SSO enforcement error
```

**Test Data:**
- `email`: `alice@acme.com`
- `password`: `CorrectHorseBatteryStaple123!`
- `sso_enforced`: `false` (just disabled)

**Preconditions:**
- SSO enforcement was just disabled
- alice@acme.com has a valid password

---

### T-6.2: Disabling SSO enforcement does not affect existing sessions (none to invalidate)
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Disabling SSO enforcement does not invalidate any sessions
    Given org "org_acme_001" has sso_enforced = true
    And users were logged out when enforcement was enabled (no active sessions)
    When the Org Admin disables SSO enforcement
    Then no session invalidation operation runs
    And `sso_enforced = false` is saved
    And no error occurs
```

**Preconditions:**
- No active sessions (expected state after SSO enforcement was enabled)

---

### T-7.1: Cannot enable SSO enforcement without an active SSO configuration
**Maps to:** AC-7
**Category:** boundary

```gherkin
Feature: SSO Enforcement — Configuration Guard

  Scenario: SSO enforcement blocked when org has no SSO config
    Given org "org_no_sso_config" has no SAML or OIDC SSO configuration
    And an Org Admin is authenticated for "org_no_sso_config"
    When they attempt to enable SSO enforcement via the API or UI
    Then the system rejects the action
    And the response or UI message states: "You must configure an SSO provider before enabling SSO enforcement. [Set up SSO]"
    And `sso_enforced` remains false
    And no audit log entry is written (action was blocked, not completed)
```

**Test Data:**
- `org_id`: `org_no_sso_config`
- No SAML or OIDC config rows exist for this org

**Preconditions:**
- Org exists with no SSO configuration

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to SSO enforcement endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: SSO Enforcement — Authorization

  Scenario: Unauthenticated request to enable SSO enforcement is rejected with 401
    Given no session token or Authorization header is present
    When a POST request is made to "/api/orgs/org_acme_001/settings/sso-enforcement"
      with body: {"sso_enforced": true}
    Then the HTTP response status is 401 Unauthorized
    And `sso_enforced` is not changed
    And no audit log entry is written
```

**Test Data:**
- `endpoint`: `POST /api/orgs/org_acme_001/settings/sso-enforcement`
- Request body: `{"sso_enforced": true}`
- No auth headers

**Preconditions:**
- Org exists

---

### T-AUTH-2.1: Non-admin user cannot enable SSO enforcement — 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: User with 'member' role cannot enable SSO enforcement
    Given "member@acme.com" has role "member" (not "org_admin" or "platform_super_admin")
    And they have a valid session token
    When they POST to "/api/orgs/org_acme_001/settings/sso-enforcement" with {"sso_enforced": true}
    Then the HTTP response status is 403 Forbidden
    And the response identifies the required permission (e.g. "Requires role: org_admin")
    And `sso_enforced` is not changed
```

**Test Data:**
- `user_email`: `member@acme.com`
- `user_role`: `member`

**Preconditions:**
- User has valid session but insufficient role

---

### T-AUTH-2.2: Org Admin of org A cannot enable SSO enforcement for org B — 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Org Admin cannot modify SSO enforcement for a different organization
    Given "admin@org-a.com" is an org_admin for "org_a" only
    When they POST to "/api/orgs/org_b/settings/sso-enforcement" with {"sso_enforced": true}
    Then the HTTP response status is 403 Forbidden
    And `sso_enforced` for "org_b" is not changed
```

**Test Data:**
- `actor`: `admin@org-a.com`, org_admin for `org_a`
- `target_org`: `org_b`

**Preconditions:**
- Actor has a valid session for `org_a` but no role in `org_b`

---

## Negative Tests

### T-NEG-1: Partial session invalidation failure triggers security alert
**Maps to:** NFR (Error Handling)
**Category:** error-handling

```gherkin
  Scenario: Partial token revocation failure is treated as a security incident
    Given 3 sessions exist for org "org_acme_001"
    And the token revocation store fails to revoke "tok_bbb222" (simulated error)
    When the Org Admin confirms SSO enforcement
    Then the system detects the partial failure
    And does NOT report success to the Org Admin
    And the admin sees: "Failed to enable SSO enforcement. Try again."
    And `sso_enforced` is NOT set to true (rolled back)
    And an on-call alert is triggered
    And the affected token "tok_bbb222" is logged for investigation
```

**Test Data:**
- Simulate token store failure for one specific token

**Preconditions:**
- Token revocation mechanism can be partially stubbed to fail on one token

---

### T-NEG-2: Database failure during sso_enforced update rolls back
**Maps to:** NFR (Error Handling)
**Category:** error-handling

```gherkin
  Scenario: DB failure while writing sso_enforced rolls back to avoid partial state
    Given the database UPDATE for `sso_enforced = true` fails (simulated DB error)
    When the Org Admin confirms SSO enforcement
    Then `sso_enforced` remains false
    And the admin sees: "Failed to enable SSO enforcement. Try again."
    And the org is not in a partial enforcement state
```

**Test Data:**
- Simulated DB write failure

**Preconditions:**
- DB failure injection is available in test environment

---

---

# Test Specifications: SSO-05 — Break-Glass Account Management

## Coverage Matrix

| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | edge-case |
| AC-3 | T-3.1 | happy-path |
| AC-4 | T-4.1 | boundary |
| AC-5 | T-5.1, T-5.2 | happy-path |
| AC-6 | T-6.1, T-6.2 | happy-path |
| AC-7 | T-7.1 | security |
| AC-8 | T-8.1, T-8.2 | happy-path |
| AC-AUTH-1 | T-AUTH-1.1, T-AUTH-1.2, T-AUTH-1.3 | security |
| AC-AUTH-2 | T-AUTH-2.1, T-AUTH-2.2 | security |

---

## Test Cases

### T-1.1: Platform Super Admin designates a break-glass account
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Break-Glass Account Management — Designation

  Background:
    Given an authenticated Platform Super Admin "superadmin@platform.example.com"
    And org "org_acme_001" has `sso_enforced = true`
    And user "breakglass@acme.com" (user_id: user_bg_001) is an active member of "org_acme_001"
    And no break-glass designation exists for "org_acme_001"

  Scenario: Platform Super Admin successfully designates a break-glass account
    Given the super admin is on the organization management UI for "org_acme_001"
    When they search for and select "breakglass@acme.com" and click "Designate as Break-Glass"
    Then a record is created in the `break_glass_accounts` table with:
      | field              | expected                                      |
      | organization_id    | org_acme_001                                  |
      | user_id            | user_bg_001                                   |
      | designated_by      | the Platform Super Admin's user ID            |
      | designated_at      | within 5 seconds of the action                |
      | status             | active                                        |
    And an audit log entry is written (per AC-5)
    And "breakglass@acme.com" can now log in via email/password even with `sso_enforced = true`
```

**Test Data:**
- `org_id`: `org_acme_001`
- `target_user_id`: `user_bg_001`
- `target_user_email`: `breakglass@acme.com`
- `actor`: Platform Super Admin user ID

**Preconditions:**
- `org_acme_001` has `sso_enforced = true`
- No existing break-glass designation
- `breakglass@acme.com` is an active member of the org

---

### T-1.2: Designating a user not in the org is rejected
**Maps to:** AC-1, NFR (Error Handling)
**Category:** error-handling

```gherkin
  Scenario: Cannot designate a user who is not a member of the org as break-glass
    Given user "outsider@other-org.com" is NOT a member of "org_acme_001"
    When the Platform Super Admin attempts to designate "outsider@other-org.com" as break-glass for "org_acme_001"
    Then the system rejects the request
    And the response contains: "The selected user is not a member of this organization."
    And no break-glass record is created
    And no audit log entry is written
```

**Test Data:**
- `target_user_email`: `outsider@other-org.com`
- This user's org membership does not include `org_acme_001`

**Preconditions:**
- User exists in the platform but is not in `org_acme_001`

---

### T-2.1: Designating a new break-glass account revokes the previous one
**Maps to:** AC-2
**Category:** edge-case

```gherkin
Feature: Break-Glass Account Management — Replacement

  Scenario: New break-glass designation replaces the existing one atomically
    Given "breakglass_a@acme.com" (user_id: user_bg_a) is the current break-glass account for "org_acme_001"
    And "breakglass_b@acme.com" (user_id: user_bg_b) is an active member of "org_acme_001"
    When the Platform Super Admin designates "breakglass_b@acme.com" as the new break-glass account
    Then the break-glass designation for user_bg_a is revoked (marked inactive or deleted)
    And user_bg_b is now the active break-glass account for "org_acme_001"
    And only one active break-glass record exists for "org_acme_001" after the operation
```

**Test Data:**
- `previous_break_glass_user`: `user_bg_a` / `breakglass_a@acme.com`
- `new_break_glass_user`: `user_bg_b` / `breakglass_b@acme.com`

**Preconditions:**
- `user_bg_a` has active break-glass designation
- `user_bg_b` is an active org member

---

### T-2.2: Both revocation and designation appear as separate audit log entries
**Maps to:** AC-2, AC-5
**Category:** edge-case

```gherkin
  Scenario: Replacing break-glass generates two distinct audit log entries
    Given the scenario from T-2.1 is completed
    When the audit log is queried for org "org_acme_001" around the time of the replacement
    Then exactly two audit log entries exist for this operation:
      | entry | event_type             | affected_user |
      | 1     | break_glass_revoked    | user_bg_a     |
      | 2     | break_glass_designated | user_bg_b     |
    And both entries reference the Platform Super Admin as actor
    And both entries have timestamps within 2 seconds of each other
```

**Test Data:**
- Same as T-2.1

**Preconditions:**
- T-2.1 completed

---

### T-3.1: Break-glass account can log in via password when org has SSO enforcement
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Break-Glass — SSO Enforcement Exemption

  Scenario: Break-glass user successfully logs in via email/password in SSO-enforced org
    Given org "org_acme_001" has `sso_enforced = true`
    And "breakglass@acme.com" is the designated break-glass account
    When "breakglass@acme.com" POSTs to "/auth/login" with:
      | field    | value                     |
      | email    | breakglass@acme.com       |
      | password | SecureB3eakGl@ss2026!     |
    Then the login succeeds
    And a session is created for "breakglass@acme.com"
    And the response status is 200
    And the break-glass login is logged to the audit log
    And the user is NOT redirected to the SSO flow
```

**Test Data:**
- `email`: `breakglass@acme.com`
- `password`: `SecureB3eakGl@ss2026!`
- `sso_enforced`: `true`
- Break-glass designation: active for this user/org pair

**Preconditions:**
- SSO is enforced for `org_acme_001`
- Break-glass designation is active
- User has a valid password set

---

### T-4.1: Non-break-glass users remain blocked by SSO enforcement
**Maps to:** AC-4
**Category:** boundary

```gherkin
Feature: Break-Glass — SSO Exemption Isolation

  Scenario: Break-glass exemption does not bleed over to other org users
    Given org "org_acme_001" has `sso_enforced = true`
    And "breakglass@acme.com" is the designated break-glass account
    And "alice@acme.com" is a regular (non-break-glass) org member
    When "alice@acme.com" attempts to log in via email/password
    Then the login is rejected with 403
    And the response contains: "Your organization requires SSO login. Use the SSO option to sign in."
    And alice is NOT granted break-glass access
    And no session is created for alice
```

**Test Data:**
- `non_break_glass_email`: `alice@acme.com`
- `sso_enforced`: `true`
- Break-glass designation: only for `breakglass@acme.com`

**Preconditions:**
- SSO enforced, break-glass designated for a different user

---

### T-5.1: Break-glass designation event written to audit log
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: Break-Glass — Audit Logging

  Scenario: Designating a break-glass account produces complete audit log entry
    Given a Platform Super Admin designates "breakglass@acme.com" as break-glass for "org_acme_001"
    When the designation is saved
    Then an audit log entry exists with ALL of the following fields:
      | field          | expected                                         |
      | event_type     | break_glass_designated                           |
      | actor_id       | the Platform Super Admin's user ID               |
      | affected_user_id | user_bg_001 (the designated user)              |
      | organization_id | org_acme_001                                   |
      | timestamp      | within 5 seconds of the designation action       |
```

**Test Data:**
- Same as T-1.1

**Preconditions:**
- T-1.1 completed

---

### T-5.2: Break-glass revocation event written to audit log
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: Revoking a break-glass designation produces complete audit log entry
    Given "breakglass@acme.com" is the designated break-glass account for "org_acme_001"
    When a Platform Super Admin revokes the designation (per AC-8)
    Then an audit log entry exists with:
      | field           | expected                       |
      | event_type      | break_glass_revoked            |
      | actor_id        | the Platform Super Admin's ID  |
      | affected_user_id | user_bg_001                   |
      | organization_id | org_acme_001                  |
      | timestamp       | within 5 seconds of revocation |
```

**Test Data:**
- Same as T-1.1

**Preconditions:**
- Active break-glass designation exists

---

### T-6.1: Org Admin can view break-glass account in read-only settings section
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: Break-Glass — Org Admin Read-Only View

  Background:
    Given "orgadmin@acme.com" has role "org_admin" for "org_acme_001"
    And "breakglass@acme.com" is the designated break-glass account for "org_acme_001"

  Scenario: Org Admin sees break-glass designation in organization settings (read-only)
    Given the Org Admin navigates to the organization settings page
    When the break-glass section is rendered
    Then the section displays:
      | field          | value                                  |
      | display_name   | "Break-Glass User" (or full name)      |
      | email          | breakglass@acme.com                    |
      | label/note     | "Managed by Platform Administrators"   |
    And no "Designate", "Change", or "Revoke" buttons are rendered
    And no user credentials or internal user IDs are shown
```

**Test Data:**
- `org_admin_email`: `orgadmin@acme.com`
- `break_glass_display_name`: `Break-Glass User`
- `break_glass_email`: `breakglass@acme.com`

**Preconditions:**
- Org Admin has valid session
- Break-glass designation is active

---

### T-6.2: Org Admin's GET endpoint response contains only display name and email — no sensitive fields
**Maps to:** AC-6
**Category:** security

```gherkin
  Scenario: API response for Org Admin viewing break-glass contains only safe fields
    Given the Org Admin calls GET "/api/orgs/org_acme_001/break-glass"
    Then the HTTP response status is 200
    And the response body contains: display_name and email
    And the response body does NOT contain: password_hash, internal_user_id, credentials, session_tokens, or any other sensitive field
```

**Test Data:**
- `endpoint`: `GET /api/orgs/org_acme_001/break-glass`
- Caller: `orgadmin@acme.com` (org_admin role)

**Preconditions:**
- Active break-glass designation
- Org Admin session is valid

---

### T-7.1: Org Admin cannot designate or revoke break-glass accounts via API — 403
**Maps to:** AC-7
**Category:** security

```gherkin
Feature: Break-Glass — Org Admin Write Restriction

  Scenario: Org Admin POST to break-glass designation endpoint returns 403
    Given "orgadmin@acme.com" has role "org_admin" and a valid session
    When they POST to "/api/orgs/org_acme_001/break-glass" with body {"user_id": "user_bg_new"}
    Then the HTTP response status is 403 Forbidden
    And no break-glass record is created or modified

  Scenario: Org Admin DELETE to break-glass revocation endpoint returns 403
    Given "orgadmin@acme.com" has role "org_admin" and a valid session
    When they DELETE "/api/orgs/org_acme_001/break-glass/user_bg_001"
    Then the HTTP response status is 403 Forbidden
    And the existing break-glass designation is not revoked
```

**Test Data:**
- `actor_email`: `orgadmin@acme.com`
- `actor_role`: `org_admin`
- Endpoints: `POST /api/orgs/org_acme_001/break-glass`, `DELETE /api/orgs/org_acme_001/break-glass/user_bg_001`

**Preconditions:**
- Org Admin has valid session
- Active break-glass designation exists (for DELETE test)

---

### T-8.1: Platform Super Admin successfully revokes a break-glass designation
**Maps to:** AC-8
**Category:** happy-path

```gherkin
Feature: Break-Glass — Revocation

  Scenario: Revoking break-glass returns previously designated user to normal SSO enforcement
    Given "breakglass@acme.com" is the active break-glass account for "org_acme_001" (sso_enforced = true)
    When the Platform Super Admin calls DELETE "/api/orgs/org_acme_001/break-glass/user_bg_001"
    Then the response status is 200
    And the `break_glass_accounts` record for user_bg_001 is marked inactive (or deleted)
    And a subsequent password login attempt by "breakglass@acme.com" is rejected with 403 (SSO enforcement now applies)
    And an audit log entry is written with event_type "break_glass_revoked"
```

**Test Data:**
- `org_id`: `org_acme_001`
- `break_glass_user_id`: `user_bg_001`
- `break_glass_email`: `breakglass@acme.com`

**Preconditions:**
- SSO is enforced for the org
- Active break-glass designation exists

---

### T-8.2: Designating a deactivated account as break-glass is rejected
**Maps to:** AC-8, NFR (Error Handling)
**Category:** error-handling

```gherkin
  Scenario: Cannot designate a deactivated account as break-glass
    Given user "deactivated@acme.com" has account_status = "deactivated"
    When the Platform Super Admin attempts to designate "deactivated@acme.com" as break-glass
    Then the system rejects the request
    And the response contains: "Cannot designate a deactivated account as a break-glass account."
    And no break-glass record is created
```

**Test Data:**
- `target_user_email`: `deactivated@acme.com`
- `account_status`: `deactivated`

**Preconditions:**
- User exists in the DB with `account_status = "deactivated"`

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated GET request to break-glass endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Break-Glass — Authorization Enforcement

  Scenario: Unauthenticated GET to break-glass endpoint returns 401
    Given no session token or Authorization header is present
    When a GET request is made to "/api/orgs/org_acme_001/break-glass"
    Then the HTTP response status is 401 Unauthorized
    And no break-glass information is returned
```

**Test Data:**
- `endpoint`: `GET /api/orgs/org_acme_001/break-glass`
- No auth headers

**Preconditions:**
- Active break-glass designation exists (to confirm the data would otherwise exist)

---

### T-AUTH-1.2: Unauthenticated POST to break-glass designation endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated POST to break-glass designation endpoint returns 401
    Given no session token or Authorization header is present
    When a POST request is made to "/api/orgs/org_acme_001/break-glass" with body {"user_id": "user_bg_001"}
    Then the HTTP response status is 401 Unauthorized
    And no break-glass record is created
```

**Test Data:**
- `endpoint`: `POST /api/orgs/org_acme_001/break-glass`
- No auth headers

**Preconditions:**
- None required

---

### T-AUTH-1.3: Unauthenticated DELETE to break-glass revocation endpoint returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated DELETE to break-glass revocation endpoint returns 401
    Given no session token or Authorization header is present
    When a DELETE request is made to "/api/orgs/org_acme_001/break-glass/user_bg_001"
    Then the HTTP response status is 401 Unauthorized
    And no break-glass designation is modified
```

**Test Data:**
- `endpoint`: `DELETE /api/orgs/org_acme_001/break-glass/user_bg_001`
- No auth headers

**Preconditions:**
- Active break-glass designation exists

---

### T-AUTH-2.1: Non-super-admin user cannot designate break-glass account — 403
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: User with 'org_admin' role cannot designate a break-glass account
    Given "orgadmin@acme.com" has role "org_admin" and a valid session
    When they POST to "/api/orgs/org_acme_001/break-glass" with body {"user_id": "user_bg_001"}
    Then the HTTP response status is 403 Forbidden
    And the response identifies the required permission: "Requires role: platform_super_admin"
    And no break-glass record is created
```

**Test Data:**
- `actor_email`: `orgadmin@acme.com`
- `actor_role`: `org_admin`

**Preconditions:**
- Actor has valid org_admin session

---

### T-AUTH-2.2: Platform Super Admin cannot designate break-glass for an org using their own user ID
**Maps to:** AC-AUTH-2 (self-assignment prevention)
**Category:** security

```gherkin
  Scenario: Platform Super Admin cannot self-assign as break-glass account (prevent privilege escalation)
    Given "superadmin@platform.example.com" (user_id: user_sa_001) is a Platform Super Admin
    When they POST to "/api/orgs/org_acme_001/break-glass" with body {"user_id": "user_sa_001"}
    Then the HTTP response status is 400 or 403
    And the response contains an error indicating self-assignment is not permitted
    And no break-glass record is created for user_sa_001
```

**Test Data:**
- `actor_user_id`: `user_sa_001`
- `requested_designation_user_id`: `user_sa_001` (same as actor)

**Preconditions:**
- Platform Super Admin has valid session

---

## Negative Tests

### T-NEG-1: Break-glass login attempt from a different org is not granted
**Maps to:** AC-3, AC-4
**Category:** security

```gherkin
  Scenario: User with break-glass designation in org A cannot use it to bypass SSO in org B
    Given "breakglass@acme.com" (user_bg_001) is the break-glass account for "org_acme_001"
    And "breakglass@acme.com" is also a member of "org_beta_002" (which also has sso_enforced = true)
    And "breakglass@acme.com" does NOT have a break-glass designation for "org_beta_002"
    When "breakglass@acme.com" attempts to log in via email/password and the auth system checks org "org_beta_002"
    Then the login is rejected with 403 (SSO enforcement applies — no break-glass exemption for org_beta_002)
    And the SSO enforcement error is shown
```

**Test Data:**
- `user_email`: `breakglass@acme.com`
- `break_glass_org`: `org_acme_001`
- `sso_enforced_org`: `org_beta_002` (no break-glass designation for this user)

**Preconditions:**
- User is a member of both orgs
- Break-glass designation is only in `org_acme_001`

---


# Test Specifications: SESSION-01 — Configurable Session Timeout Implementation

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2, T-1.3 | happy-path, boundary |
| AC-2 | T-2.1, T-2.2, T-2.3 | happy-path, edge-case |
| AC-3 | T-3.1, T-3.2 | happy-path, error-handling |
| AC-4 | T-4.1, T-4.2 | edge-case |
| AC-5 | T-5.1, T-5.2 | happy-path |
| AC-6 | T-6.1, T-6.2, T-6.3 | happy-path, security |
| AC-7 | T-7.1, T-7.2 | boundary |
| AC-8 | T-8.1, T-8.2 | security |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Session expires at login_time + T for minimum configured timeout (1 hour)
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Configurable Session Timeout

  Scenario: Session expires at login_time + T with 1-hour org timeout
    Given organization "org-alpha" has session_timeout_seconds set to 3600
    And user "alice@org-alpha.com" (user_id: "usr-001", role: "member") exists in "org-alpha"
    When Alice logs in successfully at 2026-06-15T10:00:00Z with valid credentials
    Then a refresh token is issued and stored server-side with absolute_expiry = 2026-06-15T11:00:00Z
    And the access token issued has a short TTL (e.g., 15 minutes)
    And a valid request made at 2026-06-15T10:59:59Z succeeds with HTTP 200
    And a request made at 2026-06-15T11:00:01Z (after absolute expiry) is rejected with HTTP 401
```

**Test Data:**
- `organization_id`: "org-alpha"
- `session_timeout_seconds`: 3600 (1 hour minimum boundary)
- `user_id`: "usr-001", `email`: "alice@org-alpha.com", `role`: "member", `status`: "active"
- `login_time`: 2026-06-15T10:00:00Z
- `expected_absolute_expiry`: 2026-06-15T11:00:00Z

**Preconditions:**
- Organization "org-alpha" exists with `session_timeout_seconds = 3600`
- User "usr-001" is active with password authentication enabled
- Token revocation store (Redis) is available

---

### T-1.2: Session expires at login_time + T for maximum configured timeout (30 days)
**Maps to:** AC-1
**Category:** boundary

```gherkin
  Scenario: Session expires at login_time + T with 30-day org timeout
    Given organization "org-beta" has session_timeout_seconds set to 2592000
    And user "bob@org-beta.com" (user_id: "usr-002") exists in "org-beta"
    When Bob logs in successfully at 2026-06-15T00:00:00Z
    Then a refresh token is issued with absolute_expiry = 2026-07-15T00:00:00Z
    And Bob's session remains valid on 2026-07-14T23:59:59Z
    And Bob's session is rejected on 2026-07-15T00:00:01Z with HTTP 401
```

**Test Data:**
- `organization_id`: "org-beta"
- `session_timeout_seconds`: 2592000 (30 days)
- `user_id`: "usr-002", `email`: "bob@org-beta.com"
- `login_time`: 2026-06-15T00:00:00Z
- `expected_absolute_expiry`: 2026-07-15T00:00:00Z

**Preconditions:**
- Organization "org-beta" configured with 30-day timeout
- Clock manipulation capability available in test environment

---

### T-1.3: Session timeout config rejects values outside 1 hour to 30 days
**Maps to:** AC-1
**Category:** boundary

```gherkin
  Scenario Outline: Reject invalid session timeout values
    Given an Org Admin for "org-gamma" is authenticated
    When they attempt to set session_timeout_seconds to <value>
    Then the API returns HTTP 422 Unprocessable Entity
    And the error message states "Session timeout must be between 3600 and 2592000 seconds"

    Examples:
      | value   | reason              |
      | 3599    | below 1-hour minimum |
      | 2592001 | above 30-day maximum |
      | 0       | zero                 |
      | -1      | negative             |
```

**Test Data:**
- Invalid values: 3599, 2592001, 0, -1

**Preconditions:**
- Org Admin is authenticated with valid session

---

### T-2.1: Silent refresh issues new access token before expiry
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Silent Token Refresh

  Scenario: Client silently refreshes access token when within refresh threshold
    Given user "charlie@org-alpha.com" (user_id: "usr-003") has an active session
    And the access token expires at 2026-06-15T10:15:00Z (issued with 15-minute TTL)
    And the refresh threshold is 2 minutes before access token expiry
    And the absolute session expiry is 2026-06-15T11:00:00Z
    When the client detects the access token expires in < 2 minutes at 2026-06-15T10:13:30Z
    And the client sends a silent refresh request using the httpOnly refresh token cookie
    Then the server issues a new access token with a new 15-minute TTL (expires 2026-06-15T10:28:30Z)
    And the server issues a new refresh token (rotated)
    And the old refresh token is invalidated
    And the new session's absolute_expiry remains 2026-06-15T11:00:00Z (not extended)
```

**Test Data:**
- `user_id`: "usr-003", `email`: "charlie@org-alpha.com"
- `access_token_ttl_seconds`: 900 (15 minutes)
- `refresh_threshold_seconds`: 120 (2 minutes)
- `absolute_expiry`: 2026-06-15T11:00:00Z
- Initial access token issued at: 2026-06-15T10:00:00Z, expires: 2026-06-15T10:15:00Z

**Preconditions:**
- User has active session; access token close to expiry
- httpOnly Secure SameSite=Strict refresh token cookie is present
- Token rotation store is writable

---

### T-2.2: Silent refresh cannot extend session past absolute expiry
**Maps to:** AC-2
**Category:** edge-case

```gherkin
  Scenario: Silent refresh rejected when absolute session expiry has passed
    Given user "diana@org-alpha.com" (user_id: "usr-004") has a session with absolute_expiry = 2026-06-15T11:00:00Z
    And the current time is 2026-06-15T11:00:01Z (absolute expiry exceeded)
    When the client attempts a silent refresh using the refresh token cookie
    Then the server returns HTTP 401 Unauthorized
    And the response body contains { "error": "session_expired", "message": "Your session has expired. Please sign in again." }
    And no new tokens are issued
```

**Test Data:**
- `user_id`: "usr-004"
- `absolute_expiry`: 2026-06-15T11:00:00Z
- `request_time`: 2026-06-15T11:00:01Z

**Preconditions:**
- Refresh token is technically valid (not separately revoked) but session absolute expiry has passed

---

### T-2.3: Silent refresh fails gracefully on network error
**Maps to:** AC-2
**Category:** error-handling

```gherkin
  Scenario: Client handles silent refresh network failure gracefully
    Given user "eve@org-alpha.com" has an active session with access token expiring in 1 minute
    When the silent refresh request fails with a network timeout (no HTTP response)
    Then the client does not crash or log the user out immediately
    And the client retries the silent refresh after a brief backoff
    And if the retry also fails and the access token expires, the client redirects to login with message "Your session has expired. Please sign in again."
```

**Test Data:**
- Network failure simulation: timeout after 5000ms

**Preconditions:**
- Client-side refresh logic is under test (or mocked backend returns no response)

---

### T-3.1: Expired session returns 401 on protected endpoint
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Expired Session Re-Authentication

  Scenario: Request to protected endpoint after session expiry returns 401
    Given user "frank@org-alpha.com" (user_id: "usr-005") had a session that expired at 2026-06-15T11:00:00Z
    And the current time is 2026-06-15T11:05:00Z
    When Frank sends a GET request to /api/protected-resource with the expired access token
    Then the server returns HTTP 401 Unauthorized
    And the response body contains { "error": "token_expired" }
    And the server does not return any resource data
```

**Test Data:**
- `user_id`: "usr-005"
- `expired_access_token`: valid JWT structure but past exp claim
- `request_time`: 2026-06-15T11:05:00Z

**Preconditions:**
- Access token exp claim is in the past
- No valid refresh token available to auto-renew

---

### T-3.2: Client redirects to login on 401 from expired session
**Maps to:** AC-3
**Category:** error-handling

```gherkin
  Scenario: Client redirects to login page after receiving 401 on expired session
    Given the user's session has expired and the server returns HTTP 401
    When the client receives the 401 response
    Then the client clears any local token references
    And the client redirects the browser to /login
    And the login page is rendered with no error message about unauthorized access (session expiry is the reason, not bad credentials)
```

**Test Data:**
- `redirect_url`: "/login"

**Preconditions:**
- Client-side auth middleware/interceptor is active
- No stored valid refresh token

---

### T-4.1: Existing session retains original expiry after admin increases timeout
**Maps to:** AC-4
**Category:** edge-case

```gherkin
Feature: Session Timeout Config Change Isolation

  Scenario: Active session keeps original expiry when org admin increases timeout
    Given user "grace@org-delta.com" (user_id: "usr-006") logged in at 2026-06-15T08:00:00Z
    And the org timeout at login time was 24 hours (86400s)
    And Grace's session absolute_expiry is stored as 2026-06-16T08:00:00Z
    When an Org Admin changes the org timeout to 7 days (604800s) at 2026-06-15T09:00:00Z
    Then Grace's session absolute_expiry is still 2026-06-16T08:00:00Z
    And Grace is not logged out by the config change
    And Grace's session is valid at 2026-06-16T07:59:59Z
    And Grace's session is rejected at 2026-06-16T08:00:01Z with HTTP 401
```

**Test Data:**
- `user_id`: "usr-006", `email`: "grace@org-delta.com"
- `login_time`: 2026-06-15T08:00:00Z
- `original_timeout_seconds`: 86400
- `stored_absolute_expiry`: 2026-06-16T08:00:00Z
- `config_change_time`: 2026-06-15T09:00:00Z
- `new_timeout_seconds`: 604800

**Preconditions:**
- Session absolute expiry is stored on the token/server-side at login time (not derived dynamically from current org config)
- Org Admin has permission to change session timeout

---

### T-4.2: Existing session retains original expiry when admin decreases timeout
**Maps to:** AC-4
**Category:** edge-case

```gherkin
  Scenario: Active session keeps original expiry when org admin decreases timeout
    Given user "henry@org-delta.com" (user_id: "usr-007") logged in at 2026-06-15T08:00:00Z
    And the org timeout at login was 24 hours
    And Henry's session absolute_expiry is 2026-06-16T08:00:00Z
    When an Org Admin changes the org timeout to 1 hour (3600s) at 2026-06-15T09:00:00Z
    Then Henry's session absolute_expiry remains 2026-06-16T08:00:00Z
    And Henry is not immediately logged out
    And new users logging in after the change receive sessions expiring at login_time + 1 hour
```

**Test Data:**
- `user_id`: "usr-007"
- `login_time`: 2026-06-15T08:00:00Z
- `original_absolute_expiry`: 2026-06-16T08:00:00Z
- `new_timeout_seconds`: 3600

**Preconditions:**
- Henry has active session from before the config change

---

### T-5.1: New login after config change uses new timeout
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: New Sessions Adopt Updated Timeout

  Scenario: User logging in after timeout config change receives session with new timeout
    Given org "org-delta" had session_timeout_seconds = 86400 (24 hours)
    And an Org Admin changed session_timeout_seconds to 7200 (2 hours) at 2026-06-15T09:00:00Z
    When user "iris@org-delta.com" (user_id: "usr-008") logs in at 2026-06-15T10:00:00Z
    Then the refresh token absolute_expiry is set to 2026-06-15T12:00:00Z (login_time + 2 hours)
    And Iris's session is valid at 2026-06-15T11:59:59Z
    And Iris's session is rejected at 2026-06-15T12:00:01Z with HTTP 401
```

**Test Data:**
- `user_id`: "usr-008", `email`: "iris@org-delta.com"
- `config_change_time`: 2026-06-15T09:00:00Z
- `new_timeout_seconds`: 7200
- `login_time`: 2026-06-15T10:00:00Z
- `expected_absolute_expiry`: 2026-06-15T12:00:00Z

**Preconditions:**
- Org timeout config has been updated before Iris logs in

---

### T-5.2: Login immediately after config change uses new timeout (no caching delay)
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: Timeout config is applied immediately with no caching delay
    Given org "org-delta" updated session_timeout_seconds to 3600 at 2026-06-15T09:00:00.000Z
    When user "jack@org-delta.com" logs in at 2026-06-15T09:00:00.100Z (100ms after change)
    Then the refresh token absolute_expiry reflects the new 1-hour timeout
    And the old 24-hour timeout is not applied
```

**Test Data:**
- Config change timestamp: 2026-06-15T09:00:00.000Z
- Login timestamp: 2026-06-15T09:00:00.100Z (100ms after change)

**Preconditions:**
- No configuration caching layer that could serve stale timeout value

---

### T-6.1: Logout invalidates both access token and refresh token
**Maps to:** AC-6
**Category:** happy-path

```gherkin
Feature: Logout Token Invalidation

  Scenario: Logout adds both tokens to revocation list
    Given user "kate@org-alpha.com" (user_id: "usr-009") has an active session
    And the access token (jti: "at-001") and refresh token (id: "rt-001") are stored
    When Kate sends POST /api/auth/logout with her valid access token
    Then the server responds with HTTP 200 OK
    And "at-001" is added to the token revocation store
    And "rt-001" is deleted from/marked revoked in the refresh token store
    And a subsequent GET /api/protected with "at-001" returns HTTP 401 Unauthorized
    And a subsequent POST /api/auth/refresh with "rt-001" returns HTTP 401 Unauthorized
```

**Test Data:**
- `user_id`: "usr-009"
- `access_token_jti`: "at-001"
- `refresh_token_id`: "rt-001"

**Preconditions:**
- User has active session with both tokens valid
- Revocation store (Redis/DB) is available and writable

---

### T-6.2: Revoked access token cannot be used after logout
**Maps to:** AC-6
**Category:** security

```gherkin
  Scenario: Revoked access token rejected on all endpoints after logout
    Given user "liam@org-alpha.com" (user_id: "usr-010") just logged out
    And the access token (jti: "at-002") was valid at logout time (not yet expired by TTL)
    When a request is made to GET /api/user/profile using "at-002"
    Then the server checks the revocation store
    And returns HTTP 401 Unauthorized
    And the response body contains { "error": "token_revoked" }
```

**Test Data:**
- `access_token_jti`: "at-002"
- `token_expiry_at_logout`: still 8 minutes remaining (would have been valid by TTL alone)

**Preconditions:**
- Token is in revocation store after logout
- Revocation check precedes TTL validation in middleware

---

### T-6.3: Revoked refresh token cannot obtain new access token
**Maps to:** AC-6
**Category:** security

```gherkin
  Scenario: Revoked refresh token cannot generate new access token after logout
    Given user "mia@org-alpha.com" (user_id: "usr-011") logged out at 2026-06-15T10:00:00Z
    And the refresh token (id: "rt-003") was revoked at logout
    When the client sends POST /api/auth/refresh with the refresh token cookie containing "rt-003"
    Then the server returns HTTP 401 Unauthorized
    And the response body contains { "error": "refresh_token_revoked" }
    And no new access token is issued
```

**Test Data:**
- `refresh_token_id`: "rt-003"
- `logout_time`: 2026-06-15T10:00:00Z

**Preconditions:**
- Refresh token revoked in store at logout time

---

### T-7.1: Default 24-hour session for org with no custom timeout
**Maps to:** AC-7
**Category:** boundary

```gherkin
Feature: Default Session Timeout

  Scenario: User in org with no custom timeout gets 24-hour session
    Given organization "org-epsilon" has no session_timeout_seconds configured (NULL or default)
    And user "noah@org-epsilon.com" (user_id: "usr-012") exists in "org-epsilon"
    When Noah logs in at 2026-06-15T12:00:00Z
    Then the refresh token absolute_expiry is 2026-06-16T12:00:00Z (24 hours after login)
    And the access token is issued with a short TTL
    And Noah's session is valid at 2026-06-16T11:59:59Z
    And Noah's session is rejected at 2026-06-16T12:00:01Z with HTTP 401
```

**Test Data:**
- `organization_id`: "org-epsilon"
- `session_timeout_configured`: NULL (no custom value)
- `default_timeout_seconds`: 86400 (24 hours)
- `user_id`: "usr-012"
- `login_time`: 2026-06-15T12:00:00Z
- `expected_absolute_expiry`: 2026-06-16T12:00:00Z

**Preconditions:**
- Org "org-epsilon" exists with no `session_timeout_seconds` row/value
- System default fallback is 86400s

---

### T-7.2: Default applies consistently across multiple users in org without custom config
**Maps to:** AC-7
**Category:** boundary

```gherkin
  Scenario: Multiple users in default-timeout org all receive 24-hour sessions
    Given organization "org-epsilon" has no custom session timeout
    When user "olivia@org-epsilon.com" logs in at 2026-06-15T08:00:00Z
    And user "peter@org-epsilon.com" logs in at 2026-06-15T10:00:00Z
    Then Olivia's refresh token absolute_expiry is 2026-06-16T08:00:00Z
    And Peter's refresh token absolute_expiry is 2026-06-16T10:00:00Z
    And both sessions expire exactly 24 hours after their respective login times
```

**Test Data:**
- Olivia: `login_time` 2026-06-15T08:00:00Z, expected expiry 2026-06-16T08:00:00Z
- Peter: `login_time` 2026-06-15T10:00:00Z, expected expiry 2026-06-16T10:00:00Z

**Preconditions:**
- Both users belong to "org-epsilon" with no custom timeout

---

### T-8.1: Rotated refresh token is immediately invalidated
**Maps to:** AC-8
**Category:** security

```gherkin
Feature: Refresh Token Rotation Security

  Scenario: Previous refresh token rejected after rotation
    Given user "quinn@org-alpha.com" (user_id: "usr-013") has an active session
    And the current refresh token value is "rt-old-abc123" (id: "rt-004")
    When the client performs a silent refresh using "rt-old-abc123"
    Then the server issues a new access token and new refresh token "rt-new-xyz789" (id: "rt-005")
    And "rt-old-abc123" ("rt-004") is immediately marked as revoked/deleted
    And if the client attempts to use "rt-old-abc123" again, the server returns HTTP 401 Unauthorized
    And the response body contains { "error": "refresh_token_reuse_detected" }
```

**Test Data:**
- `user_id`: "usr-013"
- `old_refresh_token`: "rt-old-abc123", id: "rt-004"
- `new_refresh_token`: "rt-new-xyz789", id: "rt-005"

**Preconditions:**
- Active session; silent refresh endpoint available
- Revocation store is writable and checked synchronously

---

### T-8.2: Reuse of rotated refresh token triggers full session invalidation (token theft detection)
**Maps to:** AC-8
**Category:** security

```gherkin
  Scenario: Reuse of a rotated refresh token invalidates the entire session
    Given user "rachel@org-alpha.com" (user_id: "usr-014") performed a silent refresh
    And the old token "rt-old-def456" was rotated and replaced by "rt-new-ghi789"
    And an attacker captured "rt-old-def456" before rotation
    When the attacker presents "rt-old-def456" to POST /api/auth/refresh
    Then the server detects reuse of a rotated token (theft indicator)
    And the server invalidates ALL refresh tokens for user "usr-014" in the current session
    And the server writes event "session_compromise_detected" to the audit log with user_id "usr-014"
    And all subsequent requests by Rachel (using "rt-new-ghi789") are also rejected with HTTP 401
    And Rachel must re-authenticate to get a new session
```

**Test Data:**
- `user_id`: "usr-014"
- `old_refresh_token`: "rt-old-def456" (rotated, should be invalid)
- `new_refresh_token`: "rt-new-ghi789" (legitimate, but revoked due to compromise)

**Preconditions:**
- Silent refresh has occurred and old token is in revoked state
- Audit log is writable

---

## Negative Tests

### T-AUTH-1.1: Unauthenticated request rejected on protected session endpoints
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Authentication Enforcement

  Scenario Outline: Unauthenticated requests to protected endpoints return 401
    Given no access token or session cookie is present in the request
    When a <method> request is made to <endpoint>
    Then the server returns HTTP 401 Unauthorized
    And the response body contains { "error": "unauthenticated" }
    And no resource data is returned

    Examples:
      | method | endpoint                    |
      | GET    | /api/user/profile           |
      | POST   | /api/auth/logout            |
      | POST   | /api/auth/refresh           |
      | GET    | /api/org/session-timeout    |
```

**Test Data:**
- No Authorization header
- No session cookie
- No refresh token cookie

**Preconditions:**
- Auth middleware is active on all listed endpoints

---

## Boundary Tests

### T-AUTH-2.1: Wrong-role user cannot modify session timeout config
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Authorization Enforcement

  Scenario: Regular member cannot modify org session timeout
    Given user "sam@org-alpha.com" (user_id: "usr-015") is authenticated with role "member"
    And user "sam@org-alpha.com" has a valid active session
    When they send PUT /api/org/org-alpha/session-timeout with body { "timeout_seconds": 3600 }
    Then the server returns HTTP 403 Forbidden
    And the response body contains { "error": "insufficient_permissions", "required": "org_admin" }
    And the session timeout for "org-alpha" is not changed

  Scenario: Non-admin viewer cannot access session configuration
    Given user "tom@org-alpha.com" (user_id: "usr-016") is authenticated with role "viewer"
    When they send GET /api/org/org-alpha/session-timeout
    Then the server returns HTTP 403 Forbidden
```

**Test Data:**
- `user_id`: "usr-015", `role`: "member", `organization_id`: "org-alpha"
- `user_id`: "usr-016", `role`: "viewer", `organization_id`: "org-alpha"

**Preconditions:**
- Both users are authenticated (valid, non-expired sessions)
- Neither has `org_admin` or `platform_super_admin` role

---

---

# Test Specifications: AUDIT-01 — Authentication Event Capture

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2, T-1.3 | happy-path |
| AC-2 | T-2.1, T-2.2, T-2.3 | happy-path |
| AC-3 | T-3.1, T-3.2 | security |
| AC-4 | T-4.1, T-4.2, T-4.3 | security |
| AC-5 | T-5.1, T-5.2 | security |
| AC-6 | T-6.1, T-6.2 | error-handling |
| AC-7 | T-7.1, T-7.2 | boundary |
| AC-8 | T-8.1 | boundary |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Successful password login writes complete audit log entry
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Authentication Event Audit Logging

  Scenario: Successful password login produces a well-formed audit log entry
    Given user "alice@org-alpha.com" (user_id: "usr-001") exists in organization "org-alpha" (org_id: "org-001")
    And the request originates from IP "203.0.113.45" with user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    When Alice successfully logs in with password at 2026-06-15T10:00:00.000123Z
    Then exactly one row is written to auth_audit_log
    And the row contains:
      | field           | expected value                                         |
      | event_id        | a valid UUID v4                                        |
      | event_type      | login_succeeded                                        |
      | timestamp       | 2026-06-15T10:00:00.000123Z (microsecond precision)    |
      | user_id         | usr-001                                                |
      | organization_id | org-001                                                |
      | ip_address      | 203.0.113.45                                           |
      | user_agent      | Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)        |
      | outcome         | success                                                |
      | metadata        | JSON object (validated in T-2.1)                       |
```

**Test Data:**
- `user_id`: "usr-001", `email`: "alice@org-alpha.com"
- `organization_id`: "org-001"
- `ip_address`: "203.0.113.45"
- `user_agent`: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
- `login_method`: "password"
- `event_time`: 2026-06-15T10:00:00.000123Z

**Preconditions:**
- `auth_audit_log` table exists with correct schema
- Audit log write is synchronous with authentication action
- User and org exist in the database

---

### T-1.2: All required event types produce audit log entries
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario Outline: Each authentication event type writes an audit log entry
    Given a user or admin triggers the event <event_type>
    When the event is processed by the system
    Then one row is written to auth_audit_log with event_type = "<event_type>"
    And all required fields (event_id, timestamp, organization_id, ip_address, user_agent, outcome) are non-null

    Examples:
      | event_type                    |
      | login_succeeded               |
      | login_failed                  |
      | logout                        |
      | mfa_challenge_initiated       |
      | mfa_challenge_succeeded       |
      | mfa_challenge_failed          |
      | mfa_enrolled                  |
      | mfa_unenrolled                |
      | recovery_code_used            |
      | recovery_code_exhausted       |
      | sso_config_created            |
      | sso_config_updated            |
      | sso_config_deleted            |
      | sso_enforcement_enabled       |
      | sso_enforcement_disabled      |
      | mfa_policy_enabled            |
      | mfa_policy_disabled           |
      | session_timeout_changed       |
      | break_glass_designated        |
      | break_glass_revoked           |
```

**Test Data:**
- Test user/org for each event type trigger
- Each event can be triggered via integration test setup scripts

**Preconditions:**
- Full stack is running; all event emission points are instrumented

---

### T-1.3: Logout event writes audit log entry with correct fields
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Logout event is recorded in audit log
    Given user "bob@org-alpha.com" (user_id: "usr-002", org_id: "org-001") has an active session
    And the request comes from IP "198.51.100.10"
    When Bob logs out via POST /api/auth/logout
    Then one row is written to auth_audit_log with event_type = "logout"
    And outcome = "success"
    And user_id = "usr-002"
    And organization_id = "org-001"
    And ip_address = "198.51.100.10"
```

**Test Data:**
- `user_id`: "usr-002", `email`: "bob@org-alpha.com"
- `organization_id`: "org-001"
- `ip_address`: "198.51.100.10"

**Preconditions:**
- Bob is authenticated with a valid session

---

### T-2.1: Login event metadata includes auth method
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Audit Event Metadata Completeness

  Scenario: Password login metadata contains method field
    Given user "carol@org-alpha.com" logs in via password
    When the login_succeeded event is written
    Then the metadata JSON column contains { "method": "password" }
    And no other login-specific fields are required for password auth
```

**Test Data:**
- `auth_method`: "password"
- Expected metadata: `{ "method": "password" }`

**Preconditions:**
- User logged in via standard password flow

---

### T-2.2: SAML login metadata includes IdP entity ID and name ID
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: SAML login metadata contains idp_entity_id and name_id
    Given organization "org-saml" has an SSO configuration with IdP entity ID "https://idp.example.com/saml"
    And user "dave@org-saml.com" authenticates via SAML
    When the login_succeeded event is written
    Then the metadata JSON contains:
      | field          | value                                |
      | method         | saml                                 |
      | idp_entity_id  | https://idp.example.com/saml         |
      | name_id        | dave@org-saml.com                    |
```

**Test Data:**
- `idp_entity_id`: "https://idp.example.com/saml"
- `name_id`: "dave@org-saml.com"
- `auth_method`: "saml"

**Preconditions:**
- SSO SAML configuration exists for "org-saml"

---

### T-2.3: Policy change event metadata includes previous and new values
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Session timeout policy change event captures before and after values
    Given an Org Admin for "org-alpha" changes session_timeout_seconds from 86400 to 3600
    When the session_timeout_changed event is written
    Then the metadata JSON contains:
      | field          | value                    |
      | policy_field   | session_timeout_seconds  |
      | previous_value | 86400                    |
      | new_value      | 3600                     |

  Scenario: MFA policy change metadata captured
    Given an Org Admin enables MFA enforcement for "org-alpha"
    When the mfa_policy_enabled event is written
    Then the metadata JSON contains:
      | field          | value              |
      | policy_field   | mfa_enforcement    |
      | previous_value | disabled           |
      | new_value      | enabled            |

  Scenario: Break-glass event metadata contains target_user_id and actor_type
    Given a Platform Super Admin designates user "usr-020" as break-glass
    When the break_glass_designated event is written
    Then the metadata JSON contains:
      | field          | value                   |
      | target_user_id | usr-020                 |
      | actor_type     | platform_super_admin    |
```

**Test Data:**
- Session timeout change: `previous_value: 86400`, `new_value: 3600`
- MFA policy change: `previous_value: "disabled"`, `new_value: "enabled"`
- Break-glass: `target_user_id: "usr-020"`, `actor_type: "platform_super_admin"`

**Preconditions:**
- Org Admin has `org_admin` role; Platform Super Admin has `platform_super_admin` role

---

## Negative Tests

### T-3.1: No UPDATE or DELETE SQL path exists for audit log rows in application code
**Maps to:** AC-3
**Category:** security

```gherkin
Feature: Audit Log Immutability

  Scenario: Application code has no UPDATE path for auth_audit_log
    Given audit log row with event_id "evt-001" exists
    When the codebase is scanned for SQL UPDATE statements targeting auth_audit_log
    Then no UPDATE statement targeting auth_audit_log is found in application code
    And no ORM update/save calls targeting the audit log model are found

  Scenario: Application code has no DELETE path for auth_audit_log
    Given audit log row with event_id "evt-001" exists
    When the codebase is scanned for SQL DELETE statements targeting auth_audit_log
    Then no DELETE statement targeting auth_audit_log is found in application code
    And no ORM destroy/delete calls targeting the audit log model are found
    (Note: AUDIT-02 retention job deletes old rows via a separate scheduled process — this is explicitly permitted; application request-handling code must not delete rows)
```

**Test Data:**
- Static analysis target: all application source files
- Permitted exception: AUDIT-02 retention deletion job (scheduled, not request-path)

**Preconditions:**
- Codebase is accessible for static analysis
- ORM model class for `auth_audit_log` is identified

---

### T-3.2: Database role for audit log has INSERT-only permissions
**Maps to:** AC-3
**Category:** security

```gherkin
  Scenario: Application DB role cannot UPDATE auth_audit_log
    Given the application database role "app_user" is the runtime role used by the application
    When a direct UPDATE is attempted: UPDATE auth_audit_log SET outcome = 'success' WHERE event_id = 'evt-001'
    Then the database returns a permission denied error
    And the row is not modified

  Scenario: Application DB role cannot DELETE auth_audit_log rows
    Given the application database role "app_user"
    When a direct DELETE is attempted: DELETE FROM auth_audit_log WHERE event_id = 'evt-001'
    Then the database returns a permission denied error
    And the row is not removed
```

**Test Data:**
- `db_role`: "app_user"
- `test_row_event_id`: "evt-001"

**Preconditions:**
- Database role permissions are provisioned via migration
- Test runs with the application's runtime DB credentials (not superuser)

---

### T-4.1: Failed login with known email writes audit entry with failure_reason
**Maps to:** AC-4
**Category:** security

```gherkin
Feature: Failed Login Event Capture

  Scenario: Failed password login for known user writes audit entry with correct fields
    Given user "eve@org-alpha.com" (user_id: "usr-005", org_id: "org-001") exists
    And the request comes from IP "192.0.2.100"
    When Eve submits login with correct email but wrong password
    Then an audit log entry is written with:
      | field              | expected value         |
      | event_type         | login_failed           |
      | outcome            | failure                |
      | user_id            | usr-005                |
      | organization_id    | org-001                |
      | ip_address         | 192.0.2.100            |
      | metadata.failure_reason | invalid_password  |
```

**Test Data:**
- `user_id`: "usr-005", `email`: "eve@org-alpha.com"
- `organization_id`: "org-001"
- `ip_address`: "192.0.2.100"
- `submitted_password`: "wrong-password-123"
- `expected_failure_reason`: "invalid_password"

**Preconditions:**
- User exists in the database
- Correct password is "correct-password-XYZ" (not submitted)

---

### T-4.2: Failed login with unknown email writes audit entry with null user_id
**Maps to:** AC-4
**Category:** security

```gherkin
  Scenario: Failed login with unrecognized email writes entry with null user_id
    Given no user exists with email "unknown-attacker@org-alpha.com"
    When a login attempt is made with that email from IP "10.0.0.1"
    Then an audit log entry is written with:
      | field           | expected value   |
      | event_type      | login_failed     |
      | outcome         | failure          |
      | user_id         | NULL             |
      | organization_id | org-001 (if derivable from email domain) or NULL |
      | ip_address      | 10.0.0.1         |
```

**Test Data:**
- `email`: "unknown-attacker@org-alpha.com" (not in database)
- `ip_address`: "10.0.0.1"
- `user_id`: NULL (expected)

**Preconditions:**
- No user with that email exists in any organization

---

### T-4.3: Failure reason does not reveal whether email exists (anti-enumeration)
**Maps to:** AC-4
**Category:** security

```gherkin
  Scenario: Login failure message is identical regardless of whether email exists
    Given user "frank@org-alpha.com" exists in the database
    And "ghost@org-alpha.com" does NOT exist in the database
    When a login attempt fails for "frank@org-alpha.com" (wrong password)
    And a login attempt fails for "ghost@org-alpha.com" (non-existent)
    Then the HTTP response body for both failures is identical
    And neither response body indicates whether the email exists
    And the audit log failure_reason for "frank" is "invalid_password"
    And the audit log failure_reason for "ghost" does NOT use a value that distinguishes email non-existence (e.g., must not be "user_not_found" if visible externally)
```

**Test Data:**
- Existing user: "frank@org-alpha.com"
- Non-existing email: "ghost@org-alpha.com"

**Preconditions:**
- Both requests made from same IP with same user-agent

---

### T-5.1: Every audit event for an org always has organization_id set
**Maps to:** AC-5
**Category:** security

```gherkin
Feature: Multi-Tenancy Audit Isolation

  Scenario: Audit event for org action always has organization_id populated
    Given any audit event is triggered in the context of organization "org-001"
    When the event is written to auth_audit_log
    Then the organization_id column is "org-001" (never NULL)
    And querying auth_audit_log WHERE organization_id = 'org-001' returns the event
    And the event does not appear when querying WHERE organization_id = 'org-002'
```

**Test Data:**
- `organization_id` for org A: "org-001"
- `organization_id` for org B: "org-002"

**Preconditions:**
- Multi-tenant application context propagates org ID to audit log writer

---

### T-5.2: Cross-org query is impossible at the data access layer
**Maps to:** AC-5
**Category:** security

```gherkin
  Scenario: Query for org A events cannot return org B events
    Given audit log entries exist for org-001 (event_id: "evt-100") and org-002 (event_id: "evt-200")
    And the query service is called with organization_id = "org-001"
    When the query executes
    Then only rows with organization_id = "org-001" are returned
    And event_id "evt-200" (org-002) is NOT in the result set
    And no SQL injection or parameter manipulation can bypass the org filter
```

**Test Data:**
- `org-001` event: event_id "evt-100"
- `org-002` event: event_id "evt-200"

**Preconditions:**
- Both orgs have audit events; query service is the only data access path

---

## Error Handling Tests

### T-6.1: Audit log write failure does not reverse successful authentication
**Maps to:** AC-6
**Category:** error-handling

```gherkin
Feature: Audit Write Failure Resilience

  Scenario: Database error during audit write does not reverse login
    Given the auth_audit_log table is temporarily unavailable (simulated DB error)
    When user "grace@org-alpha.com" (user_id: "usr-006") successfully authenticates
    Then the login succeeds and a session is established (tokens issued)
    And the audit write failure is logged to the system error log with event details
    And an alert is raised to on-call monitoring
    And Grace's login is not rejected
```

**Test Data:**
- `user_id`: "usr-006"
- Simulated DB error: connection timeout on audit table

**Preconditions:**
- Authentication succeeds before audit write
- System error logger and alerting are configured

---

### T-6.2: Audit log write failure is captured in system error log with full event details
**Maps to:** AC-6
**Category:** error-handling

```gherkin
  Scenario: System error log contains event details when audit write fails
    Given the audit log database is unavailable
    When a login_succeeded event occurs for user "henry@org-alpha.com"
    Then the system error log contains an entry with:
      | field        | expected                                      |
      | level        | ERROR                                         |
      | message      | "audit_write_failed"                          |
      | user_id      | usr-007                                       |
      | event_type   | login_succeeded                               |
      | timestamp    | the event timestamp                           |
      | error_detail | the database error message                    |
```

**Test Data:**
- `user_id`: "usr-007"
- `event_type`: "login_succeeded"
- DB error: "connection refused"

**Preconditions:**
- Structured logging is configured; error log is accessible

---

## Boundary Tests

### T-7.1: Partition pruning is active for org + month scoped queries
**Maps to:** AC-7
**Category:** boundary

```gherkin
Feature: Table Partitioning

  Scenario: Query scoped to org and date range uses partition pruning
    Given the auth_audit_log table is partitioned by organization_id and month
    And events exist across multiple orgs and months
    When a query is executed: SELECT * FROM auth_audit_log WHERE organization_id = 'org-001' AND timestamp BETWEEN '2026-06-01' AND '2026-06-30'
    Then the query plan shows only the partition for org-001 / June 2026 is scanned
    And partitions for other orgs or months are not accessed
```

**Test Data:**
- Partitions: org-001/June-2026, org-001/May-2026, org-002/June-2026 (each with seed data)

**Preconditions:**
- Table partitioning DDL migration has been applied
- EXPLAIN ANALYZE is available for query plan inspection

---

### T-7.2: Insert routes to correct partition based on org and timestamp
**Maps to:** AC-7
**Category:** boundary

```gherkin
  Scenario: Audit event insert goes to the correct partition
    Given a login event occurs for org-001 on 2026-06-15
    When the row is inserted into auth_audit_log
    Then the row is stored in the partition for organization_id = 'org-001' AND month = '2026-06'
    And the row is not present in any other partition
```

**Test Data:**
- `organization_id`: "org-001"
- `timestamp`: 2026-06-15T10:00:00Z
- Expected partition: org-001 / 2026-06

**Preconditions:**
- Partition for org-001 / June 2026 has been created

---

### T-8.1: Schema includes SIEM-required indexed columns
**Maps to:** AC-8
**Category:** boundary

```gherkin
Feature: SIEM-Friendly Schema

  Scenario: All required SIEM columns exist and are properly indexed
    Given the auth_audit_log table has been created
    When the database schema is inspected
    Then the following columns exist:
      | column          | type              | indexed |
      | event_id        | UUID              | yes     |
      | metadata        | JSON/JSONB        | queryable (GIN or equivalent) |
      | organization_id | VARCHAR/UUID      | yes     |
      | timestamp       | TIMESTAMPTZ(6)    | yes     |
    And no column that would require a schema migration to support SIEM export exists in the schema
    And the schema can be queried as-is by an external SIEM integration with standard SQL
```

**Test Data:**
- Schema introspection via `information_schema.columns` and `pg_indexes`

**Preconditions:**
- All schema migrations have been applied to the test database

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated request to audit log endpoints returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Audit Log Authorization

  Scenario Outline: Unauthenticated access to audit log endpoints returns 401
    Given no valid authentication token or session is present
    When a <method> request is made to <endpoint>
    Then the server returns HTTP 401 Unauthorized
    And no audit log data is returned

    Examples:
      | method | endpoint                              |
      | GET    | /api/audit-log                        |
      | GET    | /api/audit-log?org_id=org-001         |
      | GET    | /api/audit-log/export/csv             |
```

**Test Data:**
- No Authorization header
- No session cookie

**Preconditions:**
- Auth middleware is active on all audit log endpoints

---

### T-AUTH-2.1: Non-admin role cannot access audit log endpoints
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario Outline: Authenticated non-admin user cannot access audit log
    Given user "iris@org-alpha.com" (user_id: "usr-008") is authenticated with role "<role>"
    When they send a GET request to /api/audit-log
    Then the server returns HTTP 403 Forbidden
    And the response body contains { "error": "insufficient_permissions", "required": "org_admin" }

    Examples:
      | role    |
      | member  |
      | viewer  |
      | support |
```

**Test Data:**
- `user_id`: "usr-008", roles tested: "member", "viewer", "support"

**Preconditions:**
- User is authenticated (valid session); role is not `org_admin` or `platform_super_admin`

---

---

# Test Specifications: AUDIT-02 — Org Admin Audit Log UI with CSV Export

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2, T-1.3 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1, T-4.2, T-4.3 | happy-path, error-handling |
| AC-5 | T-5.1, T-5.2, T-5.3 | happy-path |
| AC-6 | T-6.1, T-6.2, T-6.3 | security |
| AC-7 | T-7.1, T-7.2 | happy-path |
| AC-8 | T-8.1, T-8.2, T-8.3 | happy-path, error-handling |
| AC-9 | T-9.1, T-9.2 | performance |
| AC-10 | T-10.1 | boundary |
| AC-AUTH-1 | T-AUTH-1.1 | security |
| AC-AUTH-2 | T-AUTH-2.1 | security |

---

## Test Cases

### T-1.1: Org Admin sees paginated audit log for their org only
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Org Admin Audit Log View

  Scenario: Org Admin loads audit log and sees own org's events in descending order
    Given user "alice@org-alpha.com" (user_id: "usr-001") is an Org Admin for "org-001"
    And "org-001" has 75 audit log entries across various event types
    And Alice's local timezone is "America/New_York" (UTC-4 in summer)
    When Alice navigates to /admin/audit-log
    Then the page loads successfully
    And the table displays the first page of results (up to the configured page size)
    And entries are sorted by timestamp descending (most recent first)
    And each row displays:
      | column     | example value                              |
      | timestamp  | "Jun 15, 2026, 6:00:00 AM" (local tz)    |
      | event_type | "Login succeeded"                          |
      | user       | "Alice Smith (alice@org-alpha.com)"        |
      | outcome    | "Success"                                  |
      | ip_address | "203.0.113.45"                             |
    And no events from other organizations are visible
```

**Test Data:**
- `user_id`: "usr-001", `email`: "alice@org-alpha.com", `role`: "org_admin"
- `organization_id`: "org-001"
- Total events in org: 75
- Alice's timezone: "America/New_York" (UTC-4)
- UTC event timestamp: 2026-06-15T10:00:00Z → displayed as "Jun 15, 2026, 6:00:00 AM EDT"

**Preconditions:**
- 75 audit log entries seeded for org-001
- Events from org-002 also seeded (to verify isolation)
- Alice is authenticated with valid org_admin session

---

### T-1.2: Pagination shows correct page count and navigates correctly
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Pagination allows navigation through all audit log pages
    Given "org-001" has 75 audit log entries
    And the page size is 50 (default)
    When Alice views page 1
    Then she sees 50 entries
    When she navigates to page 2
    Then she sees the remaining 25 entries
    And the entries on page 2 are older than those on page 1
    And no entry appears on both pages
```

**Test Data:**
- Total entries: 75
- Page size: 50 (default, must be agreed upon — assumption per AC text)
- Page 1: entries 1–50 (most recent)
- Page 2: entries 51–75 (oldest)

**Preconditions:**
- 75 entries seeded with distinct timestamps

---

### T-1.3: Audit log shows human-readable event type labels
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Event type enum values are displayed as human-readable labels
    Given "org-001" has audit events of various types
    When Alice views the audit log table
    Then enum values are rendered as human-readable labels:
      | enum value              | display label          |
      | login_succeeded         | Login succeeded        |
      | login_failed            | Login failed           |
      | logout                  | Logout                 |
      | mfa_challenge_initiated | MFA challenge started  |
      | mfa_challenge_succeeded | MFA challenge passed   |
      | mfa_challenge_failed    | MFA challenge failed   |
      | mfa_enrolled            | MFA enrolled           |
      | sso_enforcement_enabled | SSO enforcement on     |
      | session_timeout_changed | Session timeout changed|
      | break_glass_designated  | Break-glass designated |
```

**Test Data:**
- Seed one event of each type listed above

**Preconditions:**
- Event type label mapping is configured in the UI layer

---

### T-2.1: Filtering by event type updates table and resets to page 1
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: Audit Log Event Type Filter

  Scenario: Org Admin filters by event type and sees only matching entries
    Given "org-001" has 30 "login_failed" events, 20 "mfa_challenge_failed" events, and 50 events of other types
    And Alice is on page 2 of the unfiltered audit log
    When Alice selects "Login failed" from the event type filter
    Then the table updates to show only "login_failed" events (30 total)
    And pagination resets to page 1
    And no events of other types are visible
```

**Test Data:**
- `login_failed` count: 30
- `mfa_challenge_failed` count: 20
- Other event types total: 50

**Preconditions:**
- Filter dropdown includes all event type options
- Alice is authenticated with org_admin role

---

### T-2.2: Multiple event type filters can be selected simultaneously
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Selecting multiple event types shows union of results
    Given "org-001" has 30 "login_failed" and 20 "mfa_challenge_failed" events
    When Alice selects both "Login failed" and "MFA challenge failed" from the filter
    Then the table shows 50 events total (30 + 20)
    And events of other types are not visible
    And pagination resets to page 1
```

**Test Data:**
- Selected filters: "login_failed", "mfa_challenge_failed"
- Expected total: 50

**Preconditions:**
- Multi-select filter is implemented in UI

---

### T-3.1: Filtering by user shows only that user's events
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: Audit Log User Filter

  Scenario: Org Admin filters by user and sees only that user's events
    Given "org-001" has audit events from users "alice@org-alpha.com" (usr-001) and "bob@org-alpha.com" (usr-002)
    And Alice has 25 events and Bob has 40 events
    When Alice types "bob" in the user filter field
    And the filter applies (e.g., on submit or autocomplete selection)
    Then the table shows only the 40 events associated with "bob@org-alpha.com"
    And no events for other users are visible
    And pagination resets to page 1
```

**Test Data:**
- `usr-001`: "alice@org-alpha.com", 25 events
- `usr-002`: "bob@org-alpha.com", 40 events
- Filter input: "bob"

**Preconditions:**
- User filter supports search by name and email

---

### T-3.2: User filter by email address matches exactly
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: User filter by full email returns exact match only
    Given org "org-001" has users "bob@org-alpha.com" and "bobby@org-alpha.com"
    When Alice filters by user "bob@org-alpha.com" (exact email)
    Then only events for "bob@org-alpha.com" are shown
    And events for "bobby@org-alpha.com" are not included
```

**Test Data:**
- `usr-bob`: email "bob@org-alpha.com"
- `usr-bobby`: email "bobby@org-alpha.com"
- Filter: "bob@org-alpha.com" (exact email)

**Preconditions:**
- Both users exist in org-001

---

### T-4.1: Date range filter shows only events within range (inclusive)
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: Audit Log Date Range Filter

  Scenario: Filtering by date range returns events within range inclusive of boundary timestamps
    Given "org-001" has events on:
      - 2026-06-13T23:00:00Z (June 13 in UTC, but June 14 00:00 in America/New_York UTC-4? actually 19:00 EDT, so June 13 in local)
      - 2026-06-14T10:00:00Z (June 14 in Alice's EDT timezone)
      - 2026-06-15T20:00:00Z (June 15 in EDT)
      - 2026-06-16T04:00:00Z (June 15 23:00 EDT — still June 15 in local)
      - 2026-06-17T00:00:00Z (June 16 20:00 EDT)
    And Alice's timezone is "America/New_York" (UTC-4 in summer)
    When Alice sets start date = "2026-06-14" and end date = "2026-06-15" in local date picker
    Then the filter converts start to 2026-06-14T04:00:00Z (midnight EDT) and end to 2026-06-16T03:59:59Z (end of day EDT)
    And the table shows only events within that UTC range
    And events before 2026-06-14 midnight EDT and after 2026-06-15 end-of-day EDT are excluded
```

**Test Data:**
- Alice timezone: "America/New_York" (UTC-4 = EDT)
- Filter start: 2026-06-14 (local), converted to 2026-06-14T04:00:00Z
- Filter end: 2026-06-15 (local), converted to 2026-06-16T03:59:59Z
- Events: distributed across multiple days

**Preconditions:**
- Date picker is timezone-aware
- Server-side conversion uses Alice's stated/detected timezone

---

### T-4.2: Filters combine correctly (event type + user + date range)
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Combined filters apply AND logic
    Given "org-001" has:
      - 10 login_failed events for "bob@org-alpha.com" on 2026-06-14
      - 5 login_failed events for "carol@org-alpha.com" on 2026-06-14
      - 8 login_failed events for "bob@org-alpha.com" on 2026-06-10
    When Alice filters by: event_type = "login_failed", user = "bob@org-alpha.com", date = "2026-06-14"
    Then the table shows exactly 10 events
    And all 10 are login_failed events for Bob on June 14
```

**Test Data:**
- Combined filter: event_type="login_failed", user="bob@org-alpha.com", date="2026-06-14"
- Expected result count: 10

**Preconditions:**
- All filter types are simultaneously applicable

---

### T-4.3: Date range with end before start is rejected with inline validation
**Maps to:** AC-4
**Category:** error-handling

```gherkin
  Scenario: End date before start date shows inline validation error
    Given Alice is viewing the audit log filter form
    When she sets start date = "2026-06-15" and end date = "2026-06-10" (end before start)
    Then the form shows an inline validation error: "End date must be after start date."
    And no API request is made
    And the table is not updated
```

**Test Data:**
- Start date: 2026-06-15
- End date: 2026-06-10 (invalid — before start)
- Expected error: "End date must be after start date."

**Preconditions:**
- Date range validation is client-side (and mirrored server-side)

---

### T-5.1: CSV export contains all fields for current filter
**Maps to:** AC-5
**Category:** happy-path

```gherkin
Feature: CSV Export

  Scenario: CSV export downloads all filtered records with all required columns
    Given "org-001" has 200 login_failed events in the last 30 days
    And Alice has filtered by event_type = "login_failed"
    When Alice clicks "Export CSV"
    Then a CSV file is downloaded named "audit-log-org-001-[date].csv" (or similar)
    And the file contains all 200 matching rows (not just the current page of 50)
    And the CSV headers are: event_id, timestamp, event_type, user_id, user_email, organization_id, ip_address, user_agent, outcome, metadata
    And the timestamp column values are in ISO 8601 UTC format (e.g., "2026-06-15T10:00:00.000123Z")
    And the metadata column contains the full JSON for each event
```

**Test Data:**
- Filter: event_type = "login_failed"
- Total matching rows: 200
- Required CSV columns: event_id, timestamp, event_type, user_id, user_email, organization_id, ip_address, user_agent, outcome, metadata
- Timestamp format: ISO 8601 UTC

**Preconditions:**
- 200 login_failed events seeded
- Current page size = 50 (to verify export exceeds page)

---

### T-5.2: CSV export with no filters includes all org events
**Maps to:** AC-5
**Category:** happy-path

```gherkin
  Scenario: CSV export with no filters exports all events for the org
    Given "org-001" has 1,000 total audit events
    And Alice has applied no filters
    When she clicks "Export CSV"
    Then the downloaded CSV contains all 1,000 rows for org-001
    And no rows for other organizations are present
```

**Test Data:**
- Total org events: 1,000
- Expected CSV row count: 1,000 (+ 1 header row)

**Preconditions:**
- 1,000 events seeded for org-001; org-002 events also exist (for isolation verification)

---

### T-5.3: CSV export fails gracefully mid-stream without delivering partial file
**Maps to:** AC-5
**Category:** error-handling

```gherkin
  Scenario: Failed CSV export mid-stream shows user-facing error without partial file
    Given "org-001" has a large number of audit events
    And the export encounters a server error after generating half the records
    When the export fails
    Then the user sees the error message: "Export failed. Try again or narrow your date range."
    And no partial CSV file is delivered to the browser
    And the original audit log table view remains intact
```

**Test Data:**
- Simulated server error: connection drop after 50% of rows streamed

**Preconditions:**
- Error injection available in test environment

---

## Security Tests

### T-6.1: Org Admin cannot see other org's events via direct API call
**Maps to:** AC-6
**Category:** security

```gherkin
Feature: Cross-Org Data Isolation

  Scenario: Org Admin cannot access events from a different organization
    Given "alice@org-alpha.com" (usr-001) is Org Admin for "org-001"
    And "org-002" has audit events including event_id "evt-org002-001"
    When Alice sends GET /api/audit-log?org_id=org-002 with her valid token
    Then the server returns HTTP 403 Forbidden
    And the response body does not contain any events from "org-002"
    And "evt-org002-001" is not visible in any response
```

**Test Data:**
- Alice's `organization_id`: "org-001"
- Target org: "org-002"
- `org-002` event: event_id "evt-org002-001"

**Preconditions:**
- Alice authenticated as org_admin for org-001 only

---

### T-6.2: JWT-derived org_id used for scoping, not query parameter
**Maps to:** AC-6
**Category:** security

```gherkin
  Scenario: organization_id used for query scoping comes from JWT, not request params
    Given Alice is Org Admin for "org-001" and her JWT contains organization_id = "org-001"
    When Alice sends GET /api/audit-log with body or query param organization_id = "org-002"
    Then the server uses "org-001" from the JWT for data scoping (not "org-002" from the request)
    And the response contains only "org-001" events
    And the response does not expose a scoping override mechanism
```

**Test Data:**
- JWT `organization_id`: "org-001"
- Request param `organization_id`: "org-002" (attacker-controlled)
- Expected scoped org: "org-001" (from JWT)

**Preconditions:**
- Auth middleware extracts org_id from JWT before controller logic

---

### T-6.3: Manipulated organization_id in API request is rejected
**Maps to:** AC-6
**Category:** security

```gherkin
  Scenario: Direct API manipulation of organization_id header returns 403
    Given Alice is Org Admin for "org-001"
    When she sends a request with a manually crafted header or body: { "organization_id": "org-002" }
    Then the server returns HTTP 403 Forbidden
    And the error message indicates the org is not accessible
```

**Test Data:**
- Alice's JWT org: "org-001"
- Manipulated request org: "org-002"

**Preconditions:**
- Server does not accept org_id overrides from client

---

### T-7.1: Platform Super Admin can view all orgs' audit logs
**Maps to:** AC-7
**Category:** happy-path

```gherkin
Feature: Platform Super Admin Cross-Org View

  Scenario: Platform Super Admin views audit log for a specific org
    Given "superadmin@platform.com" (usr-super-001) has role "platform_super_admin"
    And both "org-001" and "org-002" have audit events
    When the super admin navigates to /admin/audit-log?org_id=org-001
    Then the table shows only events for "org-001"
    And an "Organization" column header is visible
    And the displayed events match an Org Admin of org-001 viewing the same log
```

**Test Data:**
- `user_id`: "usr-super-001", `role`: "platform_super_admin"
- `org_id` filter: "org-001"

**Preconditions:**
- Super admin is authenticated; events exist in both orgs

---

### T-7.2: Platform Super Admin sees org name column when viewing all orgs
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: Platform Super Admin with no org filter sees events across all orgs with org name
    Given the super admin navigates to /admin/audit-log (no org filter)
    When the page loads
    Then the table includes events from "org-001" and "org-002"
    And an additional "Organization" column shows the org name for each event
    And the super admin can see "Alpha Corp" for org-001 events and "Beta LLC" for org-002 events
```

**Test Data:**
- org-001 display name: "Alpha Corp"
- org-002 display name: "Beta LLC"

**Preconditions:**
- Super admin is authenticated; org display names are configured

---

### T-8.1: Scheduled deletion job removes entries older than 1 year
**Maps to:** AC-8
**Category:** happy-path

```gherkin
Feature: 1-Year Retention Enforcement

  Scenario: Nightly deletion job removes events older than 1 year
    Given audit_audit_log contains:
      - 50 events with timestamp = 2025-06-14T12:00:00Z (older than 1 year from 2026-06-15)
      - 100 events with timestamp = 2025-06-16T12:00:00Z (within 1 year)
    When the scheduled deletion job runs at 2026-06-15T02:00:00Z
    Then all 50 events with timestamp < 2025-06-15T02:00:00Z are deleted
    And the 100 recent events remain in the table
    And the job logs: "Deleted 50 audit log entries older than 1 year"
    And the job completes with exit code 0
```

**Test Data:**
- Old events (to delete): 50 rows with timestamp 2025-06-14T12:00:00Z
- Recent events (to retain): 100 rows with timestamp 2025-06-16T12:00:00Z
- Job run time: 2026-06-15T02:00:00Z
- Retention threshold: `now() - 365 days`

**Preconditions:**
- Deletion job is schedulable and runnable in test environment
- Database is seeded with both old and recent events

---

### T-8.2: Deletion job failure alerts on-call and does not retry indefinitely
**Maps to:** AC-8
**Category:** error-handling

```gherkin
  Scenario: Deletion job failure triggers alert and caps retries at 3
    Given the deletion job encounters a database error during execution
    When the error occurs
    Then the job logs the error with details
    And an on-call alert is triggered
    And the job retries up to 3 times within 24 hours
    And after 3 failed retries, no further automatic retries occur
    And the application continues to operate normally (no disruption to auth)
```

**Test Data:**
- Simulated DB error: connection reset
- Max retries: 3
- Retry window: 24 hours

**Preconditions:**
- On-call alerting is configured
- Retry logic is implemented in the job runner

---

### T-8.3: Deletion job does not disrupt application during execution
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: Deletion job runs without impacting read/write performance for application
    Given the deletion job is processing 10,000 old rows for deletion
    When the job is running
    Then audit log reads (for the UI) complete within the p95 SLA of 500ms
    And new audit events continue to be written successfully
    And login/auth flows are unaffected
```

**Test Data:**
- Deletion batch size: 10,000 rows
- Concurrent read requests: 50 simultaneous

**Preconditions:**
- Load test environment available; job uses row-level locking or batching to avoid table lock

---

## Performance Tests

### T-9.1: CSV export of 100,000 rows completes within 30 seconds
**Maps to:** AC-9
**Category:** performance

```gherkin
Feature: Large Export Performance

  Scenario: CSV export of 100,000 rows completes without timeout
    Given "org-001" has 100,000 audit events within a date range
    And Alice applies no filters
    When she clicks "Export CSV"
    Then the server begins streaming the CSV response
    And the complete CSV file (100,000 rows) is delivered to Alice within 30 seconds
    And the file is complete and not truncated
    And the server does not return HTTP 504 Gateway Timeout
```

**Test Data:**
- Total matching rows: 100,000
- Export size limit test: must succeed within 30 seconds

**Preconditions:**
- 100,000 events seeded for org-001
- Export is server-side streamed (not buffered in memory)

---

### T-9.2: Large export does not degrade API response times for other users
**Maps to:** AC-9
**Category:** performance

```gherkin
  Scenario: Concurrent large export does not block other users' API requests
    Given "org-001"'s Org Admin is running a 100,000-row CSV export
    And 10 other users are simultaneously making auth requests
    When the export runs concurrently with normal auth traffic
    Then the other users' API requests complete within their normal p95 SLAs
    And no request returns HTTP 503 or times out due to the export
```

**Test Data:**
- Export size: 100,000 rows
- Concurrent user requests: 10 users making auth requests

**Preconditions:**
- Export is handled on a separate worker pool or streaming thread to avoid blocking
- Performance test environment available

---

## Boundary Tests

### T-10.1: Audit log query service is abstracted for SIEM reuse
**Maps to:** AC-10
**Category:** boundary

```gherkin
Feature: SIEM-Ready Query Layer

  Scenario: Audit log query service has no UI-specific logic in the data retrieval layer
    Given the audit log query service (function/class) is implemented
    When the service is reviewed
    Then the service accepts parameters: organization_id, event_types[], user_id, start_date, end_date, pagination
    And the service returns structured data objects (not HTML, not pre-formatted strings)
    And no HTML rendering logic, CSS class names, or UI-specific formatting exists in the service function
    And the same service function is called by both the UI endpoint and (when built) a SIEM REST endpoint
    And the service does not depend on HTTP request objects (accepts plain parameters only)
```

**Test Data:**
- Service function signature: `queryAuditLog({ org_id, event_types, user_id, start_date, end_date, page, page_size })`
- Returns: `{ events: AuditEvent[], total_count: number, page: number }`

**Preconditions:**
- Code review / automated architecture test confirms no UI coupling in query layer
- Service is unit-testable without HTTP context

---

## Authorization Tests

### T-AUTH-1.1: Unauthenticated access to audit log view and export returns 401
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Audit Log UI Authorization

  Scenario Outline: Unauthenticated requests to audit log endpoints return 401
    Given no valid session or auth token is present
    When a <method> request is made to <endpoint>
    Then the server returns HTTP 401 Unauthorized
    And no audit log data or CSV content is returned

    Examples:
      | method | endpoint                              |
      | GET    | /api/audit-log                        |
      | GET    | /api/audit-log?page=1                 |
      | GET    | /api/audit-log/export/csv             |
      | GET    | /api/audit-log?org_id=org-001         |
```

**Test Data:**
- No Authorization header; no session cookie

**Preconditions:**
- Auth middleware active on all audit log routes

---

### T-AUTH-2.1: Non-admin authenticated user cannot access audit log
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario Outline: Authenticated non-admin users receive 403 on audit log endpoints
    Given user "jane@org-alpha.com" (user_id: "usr-020") is authenticated with role "<role>"
    When they send a GET request to /api/audit-log
    Then the server returns HTTP 403 Forbidden
    And the response body contains { "error": "insufficient_permissions", "required_role": "org_admin" }
    And no audit log entries are returned

    Examples:
      | role             |
      | member           |
      | viewer           |
      | support_agent    |
      | billing_admin    |

  Scenario: org_admin can access their own org's audit log (positive check)
    Given user "kate@org-alpha.com" (user_id: "usr-021") is authenticated with role "org_admin"
    When they send GET /api/audit-log
    Then the server returns HTTP 200 OK
    And the response contains audit log entries for "org-alpha"
```

**Test Data:**
- `user_id`: "usr-020", roles tested: "member", "viewer", "support_agent", "billing_admin"
- `user_id`: "usr-021", role: "org_admin" (positive test)
- `organization_id`: "org-001"

**Preconditions:**
- All test users are authenticated with valid sessions
- Roles are correctly assigned in the database


