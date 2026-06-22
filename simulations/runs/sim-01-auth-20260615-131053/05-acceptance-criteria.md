<!-- STORY COUNT: 4 stories to process -->

# Acceptance Criteria: AUTH-SSO-001 — SAML Provider Configuration

## Refined Story Statement
As an organization admin, I want to configure SAML 2.0 SSO for major providers (Okta, Azure AD, Google Workspace) through a guided setup wizard, so that my users can authenticate using our corporate identity provider.

## Assumptions
- Organization admin has appropriate permissions to modify SSO settings — **Unconfirmed**
- SAML metadata endpoints are accessible from our application servers — **Confirmed**
- Major providers (Okta, Azure AD, Google Workspace) follow standard SAML 2.0 specifications — **Confirmed**
- SSL/TLS certificates for SAML assertions can be validated — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-3: Admin UI workflow, provider metadata input, and validation process not detailed | Addressed in AC | AC-1, AC-2, AC-3, AC-4 |
| G-10: Error messaging for auth failures not defined | Addressed in AC | AC-5, AC-6, NFR Error Handling |

## Acceptance Criteria

### AC-1: Guided Wizard for Okta Configuration
**Given** I am an organization admin accessing the SSO configuration page
**When** I select "Okta" as the provider type
**Then** the system displays a guided wizard with fields for: Okta domain URL, Entity ID, SSO URL, and certificate upload option

**Category:** happy-path
**Priority:** must-have

### AC-2: SAML Metadata Validation
**Given** I am configuring a SAML provider through the guided wizard
**When** I provide the required SAML metadata (entity ID, SSO URL, certificate)
**Then** the system validates the metadata format, certificate validity, and endpoint accessibility before saving

**Category:** happy-path
**Priority:** must-have

### AC-3: Test Connection Capability
**Given** I have entered valid SAML configuration details
**When** I click the "Test Connection" button
**Then** the system performs a test SAML authentication request and displays success/failure status with specific error details if failed

**Category:** happy-path
**Priority:** must-have

### AC-4: Azure AD and Google Workspace Wizards
**Given** I am an organization admin accessing the SSO configuration page
**When** I select "Azure AD" or "Google Workspace" as the provider type
**Then** the system displays provider-specific guided wizards with appropriate field labels and help text for each provider's terminology

**Category:** happy-path
**Priority:** must-have

### AC-5: Invalid Metadata Handling
**Given** I am configuring a SAML provider
**When** I provide invalid SAML metadata (malformed XML, expired certificate, unreachable endpoints)
**Then** the system displays specific error messages indicating which validation failed and provides guidance for resolution

**Category:** error-handling
**Priority:** must-have

### AC-6: Configuration Save and Activation
**Given** I have successfully validated SAML provider configuration
**When** I save the configuration
**Then** the system stores the settings and displays a confirmation message with next steps for user testing

**Category:** happy-path
**Priority:** must-have

### AC-7: Provider Selection Validation
**Given** I attempt to configure SSO
**When** my organization already has an active SSO provider configured
**Then** the system displays a warning that changing providers will affect all users and requires confirmation to proceed

**Category:** boundary
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to SSO configuration endpoints
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without organization admin role
**When** a request is made to SSO configuration endpoints
**Then** the system returns 403 Forbidden with a message identifying the missing organization admin permission

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Certificate validation failure | Display "Invalid certificate: [specific reason]" with link to certificate requirements documentation | must-have |
| Unreachable SSO endpoint | Display "Cannot connect to provider endpoint. Check URL and firewall settings." | must-have |
| Malformed metadata XML | Display "Invalid metadata format at line [X]: [specific error]" | must-have |

### Performance
- **Response time:** < 2 seconds for metadata validation, < 5 seconds for test connection
- **Scale:** Support 1000+ organizations with SSO configuration

### Security
- **Input validation:** Validate all URLs are HTTPS, certificates are valid and not expired, metadata XML is well-formed
- **Authorization:** Organization admin role required for all SSO configuration operations

### Accessibility
- Form fields include proper labels and ARIA descriptions
- Error messages are announced to screen readers

## Open Questions
- Should organization admins be able to configure multiple SSO providers simultaneously or only one active provider?

---

# Acceptance Criteria: AUTH-SSO-002 — Custom SAML Provider Setup

## Refined Story Statement
As an organization admin, I want to upload SAML metadata XML files for custom identity providers, so that we can integrate with enterprise SAML solutions not covered by guided wizards.

## Assumptions
- Custom SAML providers follow standard SAML 2.0 specifications — **Confirmed**
- Metadata XML files are properly formatted according to SAML 2.0 standards — **Unconfirmed**
- File uploads are limited to reasonable size constraints — **Unconfirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-3: Admin UI workflow, provider metadata input, and validation process not detailed | Addressed in AC | AC-1, AC-2, AC-3 |
| G-10: Error messaging for auth failures not defined | Addressed in AC | AC-4, AC-5, NFR Error Handling |

## Acceptance Criteria

### AC-1: Metadata XML File Upload
**Given** I am an organization admin accessing custom SAML provider configuration
**When** I upload a SAML metadata XML file (max 2MB, .xml extension)
**Then** the system accepts the file and displays a preview of extracted provider details (entity ID, SSO URL, certificate fingerprint)

**Category:** happy-path
**Priority:** must-have

### AC-2: Manual Configuration Fields
**Given** I have uploaded a metadata XML file or am configuring manually
**When** I view the custom SAML configuration form
**Then** the system displays manual input fields for: Entity ID, SSO URL, SLO URL (optional), certificate text area, and attribute mapping settings

**Category:** happy-path
**Priority:** must-have

### AC-3: XML Metadata Parsing and Validation
**Given** I upload a SAML metadata XML file
**When** the system processes the file
**Then** it parses the XML, validates SAML 2.0 compliance, extracts configuration parameters, and auto-populates manual fields with parsed values

**Category:** happy-path
**Priority:** must-have

### AC-4: Invalid XML File Handling
**Given** I upload a file that is not valid XML or SAML metadata
**When** the system processes the upload
**Then** it displays specific error messages: "Invalid XML format at line [X]", "Not a valid SAML metadata file", or "Required SAML elements missing: [list]"

**Category:** error-handling
**Priority:** must-have

### AC-5: File Size and Type Restrictions
**Given** I attempt to upload a metadata file
**When** the file exceeds 2MB or is not a .xml file
**Then** the system rejects the upload and displays "File must be .xml format and under 2MB size limit"

**Category:** boundary
**Priority:** must-have

### AC-6: Provider Name and Description
**Given** I am configuring a custom SAML provider
**When** I complete the configuration form
**Then** I can specify a custom provider name and description that will be displayed to end users during authentication

**Category:** happy-path
**Priority:** must-have

### AC-7: Configuration Preview Before Save
**Given** I have completed custom SAML configuration (via upload or manual entry)
**When** I click "Preview Configuration"
**Then** the system displays a summary of all settings and allows me to test the connection before final save

**Category:** happy-path
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to custom SAML configuration endpoints
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without organization admin role
**When** a request is made to custom SAML configuration endpoints
**Then** the system returns 403 Forbidden with a message identifying the missing organization admin permission

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Malformed XML upload | Display "XML parsing error at line [X]: [specific error message]" | must-have |
| Missing required SAML elements | Display "Required SAML elements missing: EntityDescriptor, SingleSignOnService" | must-have |
| File upload timeout | Display "Upload failed due to timeout. Please try again with a smaller file." | must-have |

### Performance
- **Response time:** < 3 seconds for XML processing and validation, < 1 second for file upload
- **Scale:** Support XML files up to 2MB, handle 50 concurrent uploads

### Security
- **Input validation:** Scan uploaded XML for malicious content, validate all URLs are HTTPS, sanitize all text inputs
- **Authorization:** Organization admin role required for all custom SAML operations

### Accessibility
- File upload area is keyboard accessible and announces upload status to screen readers
- Progress indicators for file processing operations

## Open Questions
- What attribute mappings should be supported by default for custom providers (email, first name, last name, groups)?

---

# Acceptance Criteria: AUTH-SSO-003 — SSO Enforcement Policy

## Refined Story Statement
As an organization admin, I want to enforce SSO-only authentication for all users in my organization, so that we comply with corporate security policies requiring centralized authentication.

## Assumptions
- Users currently authenticating via email/password can be migrated to SSO — **Unconfirmed**
- SSO provider is configured and tested before enforcement is enabled — **Confirmed**
- Organization has at least one active SSO provider configured — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-6: No SSO provider downtime handling mentioned | Addressed in AC | AC-6, Open Questions |
| G-8: Migration path for existing users not addressed | Addressed in AC | AC-4, AC-5, Open Questions |
| G-10: Error messaging for auth failures not defined | Addressed in AC | AC-7, NFR Error Handling |

## Acceptance Criteria

### AC-1: SSO Enforcement Toggle
**Given** I am an organization admin with an active SSO provider configured
**When** I navigate to the SSO enforcement settings
**Then** I can toggle SSO enforcement on/off with a clear warning about blocking password authentication for all organization users

**Category:** happy-path
**Priority:** must-have

### AC-2: Enforcement Confirmation Dialog
**Given** I attempt to enable SSO enforcement
**When** I toggle the enforcement setting to "enabled"
**Then** the system displays a confirmation dialog listing affected users count and requiring typed confirmation "ENABLE SSO" before proceeding

**Category:** happy-path
**Priority:** must-have

### AC-3: Password Authentication Blocking
**Given** SSO enforcement is enabled for my organization
**When** any user from my organization attempts to log in with email/password
**Then** the system blocks the attempt and redirects to SSO authentication with message "Your organization requires SSO authentication"

**Category:** happy-path
**Priority:** must-have

### AC-4: Existing User Migration Notice
**Given** SSO enforcement is newly enabled
**When** existing email/password users first encounter the enforcement
**Then** they receive an email notification explaining the change and providing SSO login instructions

**Category:** happy-path
**Priority:** must-have

### AC-5: Grace Period for User Transition
**Given** SSO enforcement is enabled with a grace period setting
**When** existing users attempt password authentication during the grace period
**Then** they can still authenticate but receive a warning banner about the upcoming enforcement deadline

**Category:** edge-case
**Priority:** should-have

### AC-6: SSO Provider Availability Check
**Given** SSO enforcement is enabled
**When** a user attempts to authenticate and the SSO provider is unreachable
**Then** the system displays "SSO provider temporarily unavailable. Contact your administrator for assistance" and logs the failure for admin visibility

**Category:** error-handling
**Priority:** must-have

### AC-7: Enforcement Status Display
**Given** I am an organization admin
**When** I view the SSO settings page
**Then** I can see the current enforcement status, affected user count, and last enforcement change timestamp

**Category:** happy-path
**Priority:** must-have

### AC-8: Enforcement Disabling
**Given** SSO enforcement is currently enabled
**When** I disable SSO enforcement
**Then** the system immediately allows password authentication again and sends notification emails to affected users about the restored login option

**Category:** happy-path
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to SSO enforcement configuration endpoints
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without organization admin role
**When** a request is made to SSO enforcement configuration endpoints
**Then** the system returns 403 Forbidden with a message identifying the missing organization admin permission

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| No SSO provider configured | Display "Cannot enable SSO enforcement without an active SSO provider. Configure SSO first." | must-have |
| SSO provider test failure | Display "SSO provider test failed. Verify configuration before enabling enforcement." | must-have |
| Email notification delivery failure | Log failure and display warning to admin about notification delivery issues | should-have |

### Performance
- **Response time:** < 1 second for enforcement toggle, < 30 seconds for user notification emails
- **Scale:** Handle enforcement changes for organizations with 10,000+ users

### Security
- **Input validation:** Validate confirmation text exactly matches required phrase
- **Authorization:** Only organization admin can modify enforcement settings

### Accessibility
- Confirmation dialogs are keyboard accessible and properly announced to screen readers
- Warning messages use appropriate color contrast and don't rely solely on color

## Open Questions
- Should there be an emergency bypass mechanism available to system admins when SSO providers are down?
- What should be the default grace period duration for existing users to transition to SSO?

---

# Acceptance Criteria: AUTH-SSO-004 — Emergency SSO Bypass

## Refined Story Statement
As a system admin, I want to temporarily disable SSO enforcement for an organization during provider outages, so that users can access the system using password reset links when their identity provider is unavailable.

## Assumptions
- System admins have global administrative privileges — **Confirmed**
- Password reset functionality is available for all users — **Confirmed**
- Bypass is temporary and auto-restores when provider returns — **Unconfirmed**
- Audit logging captures all bypass activities — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-6: SSO provider downtime handling (directly addresses this gap) | Addressed in AC | AC-1, AC-2, AC-3, AC-4 |
| G-1: Rate limiting (if bypass attempts need rate limiting) | Out of Scope | Emergency admin actions exempt from rate limiting |
| G-10: Error messaging for auth failures | Addressed in AC | AC-5, NFR Error Handling |

## Acceptance Criteria

### AC-1: Emergency Bypass Activation
**Given** I am a system admin and an organization's SSO provider is experiencing downtime
**When** I access the emergency SSO bypass controls
**Then** I can immediately disable SSO enforcement for the affected organization with reason and duration fields required

**Category:** happy-path
**Priority:** must-have

### AC-2: Temporary Password Reset Generation
**Given** emergency SSO bypass is activated for an organization
**When** affected users request access during the outage
**Then** they can use the "Forgot Password" flow to receive temporary password reset links valid only during the bypass period

**Category:** happy-path
**Priority:** must-have

### AC-3: Automatic Provider Health Monitoring
**Given** emergency SSO bypass is activated
**When** the system detects the SSO provider is responding normally again
**Then** it automatically restores SSO enforcement after a 15-minute stabilization period and notifies the system admin

**Category:** happy-path
**Priority:** must-have

### AC-4: Bypass Duration Limits
**Given** I am activating emergency SSO bypass
**When** I set the bypass duration
**Then** the system enforces a maximum 72-hour limit and automatically restores SSO enforcement when the duration expires

**Category:** boundary
**Priority:** must-have

### AC-5: Manual Bypass Termination
**Given** emergency SSO bypass is currently active
**When** I choose to manually terminate the bypass
**Then** SSO enforcement is immediately restored and all temporary password sessions are invalidated within 5 minutes

**Category:** happy-path
**Priority:** must-have

### AC-6: Organization Admin Notification
**Given** emergency SSO bypass is activated or terminated
**When** the bypass status changes
**Then** the affected organization's admins receive email notifications explaining the temporary change and expected restoration time

**Category:** happy-path
**Priority:** must-have

### AC-7: Bypass Status Dashboard
**Given** I am a system admin
**When** I view the emergency bypass dashboard
**Then** I can see all active bypasses with organization name, start time, duration, reason, and current provider status

**Category:** happy-path
**Priority:** must-have

### AC-8: Comprehensive Audit Logging
**Given** any emergency bypass action is performed
**When** the action occurs (activation, termination, auto-restoration)
**Then** the system logs the event with system admin identity, organization affected, action taken, timestamp, and justification reason

**Category:** happy-path
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to emergency SSO bypass endpoints
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without system admin role
**When** a request is made to emergency SSO bypass endpoints
**Then** the system returns 403 Forbidden with a message identifying the missing system admin permission

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Provider health check failure during monitoring | Continue bypass and log health check failure for investigation | must-have |
| Email notification delivery failure | Log failure but continue bypass operation; display warning to system admin | should-have |
| Temporary password reset delivery failure | Retry 3 times then log failure and notify system admin | must-have |

### Performance
- **Response time:** < 2 seconds for bypass activation, < 5 minutes for temporary password session invalidation
- **Scale:** Handle bypasses for multiple organizations simultaneously

### Security
- **Input validation:** Require justification reason (min 10 characters), validate duration within 1-72 hour range
- **Authorization:** System admin role required for all emergency bypass operations
- **Audit:** All bypass actions logged to immutable audit store

### Accessibility
- Emergency bypass controls use high contrast colors to indicate urgency
- Screen readers announce bypass status changes clearly

## Open Questions
- Should there be an escalation process requiring multiple system admin approvals for bypasses longer than 24 hours?

---

## Coverage Summary
| # | Story Slug | AC Count | Auth AC | Gap Rows | Status |
|---|-----------|----------|---------|----------|--------|
| 1 | AUTH-SSO-001 | 7 | Yes | 2 | Complete |
| 2 | AUTH-SSO-002 | 7 | Yes | 2 | Complete |
| 3 | AUTH-SSO-003 | 8 | Yes | 3 | Complete |
| 4 | AUTH-SSO-004 | 8 | Yes | 3 | Complete |
| **Total** | **4 stories** | **30** | **4** | **10** | **Complete** |


Based on the context and implementation order, I can see that batch 03 contains the foundational infrastructure stories that need to be completed first. Let me write acceptance criteria for the 2 infrastructure stories in this batch.

<!-- STORY COUNT: 2 stories to process -->

# Acceptance Criteria: AUTH-INFRA-002 — Database Schema Migration

## Refined Story Statement
As a system admin, I want database tables created for SSO providers, MFA methods, and audit logs, so that the authentication system has proper data storage foundations.

## Assumptions
- Database migration tooling is available and functional — **Confirmed**
- Current database user has CREATE TABLE and ALTER TABLE permissions — **Confirmed**
- Existing authentication tables remain unchanged during migration — **Confirmed**
- Database supports encrypted storage for sensitive fields — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-5: Audit log retention period, storage location, and access controls undefined | Addressed in AC | AC-3, AC-8, NFR Security |
| G-9: QR code generation, shared secret management, time sync tolerance not specified | Addressed in AC | AC-4, AC-5 |
| G-2: Recovery code count, format, usage flow, and storage encryption undefined | Addressed in AC | AC-6 |
| G-1: No thresholds, lockout duration, or bypass rules specified | Out of Scope | Addressed in AUTH-INFRA-001 story |
| G-4: Min/max bounds, inheritance rules, and override permissions not specified | Addressed in AC | AC-7 |

## Acceptance Criteria

### AC-1: SSO Provider Configuration Table Creation
**Given** the database migration script is executed
**When** the SSO provider table is created
**Then** the system creates a table with fields for: provider_type (SAML/OIDC), organization_id, entity_id, sso_url, certificate_data (encrypted), metadata_xml (encrypted), is_active, created_at, updated_at

**Category:** happy-path
**Priority:** must-have

### AC-2: Organization SSO Settings Table
**Given** the database migration script is executed
**When** the organization SSO settings table is created
**Then** the system creates a table with fields for: organization_id, sso_enabled, sso_enforced, emergency_bypass_enabled, created_at, updated_at

**Category:** happy-path
**Priority:** must-have

### AC-3: Authentication Audit Log Table Creation
**Given** the database migration script is executed
**When** the audit log table is created
**Then** the system creates a table with fields for: event_id (UUID), user_id, organization_id, event_type, event_outcome, ip_address, user_agent, session_id, timestamp, additional_data (JSON), retention_date

**Category:** happy-path
**Priority:** must-have

### AC-4: MFA Methods Table Creation
**Given** the database migration script is executed
**When** the MFA methods table is created
**Then** the system creates a table with fields for: user_id, method_type (TOTP/SMS), shared_secret (encrypted), phone_number (encrypted), backup_codes (encrypted JSON), is_enabled, created_at, last_used_at

**Category:** happy-path
**Priority:** must-have

### AC-5: MFA Recovery Codes Table Creation
**Given** the database migration script is executed
**When** the MFA recovery codes table is created
**Then** the system creates a table with fields for: code_id (UUID), user_id, code_hash, is_used, created_at, used_at

**Category:** happy-path
**Priority:** must-have

### AC-6: Session Metadata Table Creation
**Given** the database migration script is executed
**When** the session metadata table is created
**Then** the system creates a table with fields for: session_id, user_id, organization_id, timeout_minutes, mfa_verified, sso_session_id, created_at, expires_at, last_activity_at

**Category:** happy-path
**Priority:** must-have

### AC-7: Organization Session Policy Table
**Given** the database migration script is executed
**When** the organization session policy table is created
**Then** the system creates a table with fields for: organization_id, default_timeout_minutes, min_timeout_minutes, max_timeout_minutes, admin_max_timeout_minutes, created_at, updated_at

**Category:** happy-path
**Priority:** must-have

### AC-8: Rollback Capability for Failed Migration
**Given** the database migration encounters an error during execution
**When** any table creation fails
**Then** the system rolls back all changes made during this migration and logs the specific failure reason

**Category:** error-handling
**Priority:** must-have

### AC-9: Migration Idempotency
**Given** the database migration script is run multiple times
**When** tables already exist from a previous successful migration
**Then** the system skips table creation without errors and reports "Migration already applied"

**Category:** edge-case
**Priority:** must-have

### AC-10: Index Creation for Performance
**Given** all tables are successfully created
**When** the migration script completes
**Then** the system creates indexes on: audit_log.user_id, audit_log.organization_id, audit_log.timestamp, session_metadata.expires_at, mfa_methods.user_id

**Category:** performance
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to database migration endpoints
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without system admin role
**When** a request is made to execute database migrations
**Then** the system returns 403 Forbidden with a message identifying the missing system admin permission

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Database connection failure during migration | Log error details, maintain existing schema, return specific connection error | must-have |
| Insufficient disk space for new tables | Fail gracefully with disk space error, no partial table creation | must-have |
| Foreign key constraint violations | Log constraint details, rollback transaction, provide clear error message | must-have |

### Performance
- **Migration time:** Complete within 30 seconds for databases up to 1M existing users
- **Scale:** Support table creation for organizations with up to 100K users per org

### Security
- **Encryption:** All sensitive fields (secrets, certificates, phone numbers) encrypted at rest using AES-256
- **Access controls:** Migration execution requires system admin role verification

### Accessibility
- Not applicable for database schema migration

## Open Questions
- None — all gaps resolved.

---

# Acceptance Criteria: AUTH-INFRA-003 — JWT Token Enhancement

## Refined Story Statement
As a system admin, I want JWT tokens extended to include SSO claims and MFA status, so that the application can make authorization decisions based on authentication context.

## Assumptions
- Current JWT implementation supports claim extension without breaking changes — **Confirmed**
- Token signing keys are properly managed and rotated — **Confirmed**
- Client applications can handle extended token structure — **Unconfirmed**
- Token size increase is acceptable for network performance — **Confirmed**

## Gap Traceability

| Gap | Resolution | Reference |
|-----|-----------|-----------|
| G-9: QR code generation, shared secret management, time sync tolerance not specified | Out of Scope | Technical implementation details for TOTP |
| G-4: Min/max bounds, inheritance rules, and override permissions not specified | Addressed in AC | AC-3, AC-6 |
| G-8: How existing users transition to new auth methods not planned | Addressed in AC | AC-7, AC-8 |
| G-10: Error messaging for auth failures not defined | Addressed in AC | AC-9, NFR Error Handling |

## Acceptance Criteria

### AC-1: SSO Claims Addition to JWT
**Given** a user authenticates via SSO
**When** a JWT token is generated
**Then** the token includes claims for: sso_provider (string), sso_session_id (string), sso_organization_id (string), sso_authenticated_at (timestamp)

**Category:** happy-path
**Priority:** must-have

### AC-2: MFA Status Claims Addition
**Given** a user has completed MFA verification
**When** a JWT token is generated
**Then** the token includes claims for: mfa_verified (boolean), mfa_methods (array), mfa_verified_at (timestamp), mfa_required (boolean)

**Category:** happy-path
**Priority:** must-have

### AC-3: Session Metadata Claims
**Given** a user authentication session is established
**When** a JWT token is generated
**Then** the token includes claims for: session_timeout_minutes (integer), session_org_policy (boolean), session_admin_restricted (boolean)

**Category:** happy-path
**Priority:** must-have

### AC-4: Backward Compatibility for Existing Tokens
**Given** an existing JWT token without new claims is presented
**When** the token is validated
**Then** the system accepts the token and treats missing claims as: sso_provider=null, mfa_verified=false, session_timeout_minutes=default

**Category:** edge-case
**Priority:** must-have

### AC-5: Token Size Validation
**Given** all new claims are added to a JWT token
**When** the token is generated
**Then** the total token size remains under 8KB to ensure compatibility with HTTP headers

**Category:** boundary
**Priority:** must-have

### AC-6: Organization-Specific Claim Validation
**Given** an organization has specific SSO or MFA requirements
**When** a JWT token is validated for that organization
**Then** the system verifies required claims match organization policy (sso_provider not null if SSO enforced, mfa_verified=true if MFA required)

**Category:** happy-path
**Priority:** must-have

### AC-7: Legacy User Token Handling
**Given** a user who has not yet enrolled in SSO or MFA
**When** their existing session token is refreshed
**Then** the system generates a new token with default values: sso_provider=null, mfa_verified=false, mfa_required=false, session_timeout_minutes=organization_default

**Category:** edge-case
**Priority:** must-have

### AC-8: Token Refresh with Updated Claims
**Given** a user's MFA status or SSO configuration changes during an active session
**When** the token is refreshed
**Then** the new token reflects the current authentication state with updated claim values

**Category:** happy-path
**Priority:** must-have

### AC-9: Invalid Claim Value Handling
**Given** a JWT token contains invalid or malformed authentication claims
**When** the token is validated
**Then** the system logs the specific claim validation failure and returns 401 Unauthorized with message "Invalid authentication claims"

**Category:** error-handling
**Priority:** must-have

### AC-10: Claim-Based Authorization Decisions
**Given** an API endpoint requires MFA verification
**When** a request is made with a JWT containing mfa_verified=false
**Then** the system returns 403 Forbidden with message "Multi-factor authentication required"

**Category:** security
**Priority:** must-have

### AC-AUTH-1: Unauthenticated Access Rejected
**Given** no valid authentication token is present
**When** a request is made to JWT token generation endpoints
**Then** the system returns 401 Unauthorized

**Category:** security
**Priority:** must-have

### AC-AUTH-2: Insufficient Permissions Rejected
**Given** an authenticated user without appropriate role permissions
**When** a request is made to modify JWT token structure
**Then** the system returns 403 Forbidden with a message identifying the missing permission

**Category:** security
**Priority:** must-have

## Non-Functional Requirements

### Error Handling
| Scenario | Expected Behavior | Priority |
|----------|------------------|----------|
| Token signing failure | Log error details, return 500 Internal Server Error, do not expose key details | must-have |
| Claim serialization failure | Log specific claim causing failure, return 500 with generic message | must-have |
| Token size exceeds limits | Log token size details, return 400 Bad Request with size violation message | must-have |

### Performance
- **Token generation:** Complete within 50ms p95 under normal load
- **Token validation:** Complete within 10ms p95 for claim verification

### Security
- **Claim integrity:** All claims digitally signed and tamper-evident
- **Sensitive data:** No sensitive data (passwords, secrets) included in JWT claims
- **Token expiration:** Maintain existing token expiration policies

### Accessibility
- Not applicable for JWT token enhancement

## Open Questions
- Client applications can handle extended token structure — needs validation with frontend team

---
## Coverage Summary
| # | Story Slug | AC Count | Auth AC | Gap Rows | Status |
|---|-----------|----------|---------|----------|--------|
| 1 | AUTH-INFRA-002 | 10 | Yes | 5 | Complete |
| 2 | AUTH-INFRA-003 | 10 | Yes | 4 | Complete |
| **Total** | **2 stories** | | | | |


