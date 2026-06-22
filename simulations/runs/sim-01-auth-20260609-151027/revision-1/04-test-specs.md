I'll generate comprehensive test specifications for the authentication security package. Since no prior memory context exists, I'll proceed directly with creating test specifications that map to all provided acceptance criteria.

# Test Specifications: Authentication Security Package

## Coverage Matrix

| Story | AC | Test(s) | Category |
|-------|----|---------| ---------|
| AUTH-RATE-001 | AC-1 | T-1.1, T-1.2 | happy-path, boundary |
| AUTH-RATE-001 | AC-2 | T-1.3 | happy-path |
| AUTH-RATE-001 | AC-3 | T-1.4 | boundary |
| AUTH-RATE-001 | AC-4 | T-1.5 | boundary |
| AUTH-RATE-001 | AC-5 | T-1.6 | error-handling |
| AUTH-RATE-001 | N/A | T-1.7, T-1.8 | authorization |
| SESSION-TIMEOUT-001 | AC-1 | T-2.1 | happy-path |
| SESSION-TIMEOUT-001 | AC-2 | T-2.2, T-2.3 | happy-path, edge-case |
| SESSION-TIMEOUT-001 | AC-3 | T-2.4 | happy-path |
| SESSION-TIMEOUT-001 | AC-4 | T-2.5 | boundary |
| SESSION-TIMEOUT-001 | AC-5 | T-2.6 | edge-case |
| SESSION-TIMEOUT-001 | N/A | T-2.7, T-2.8 | authorization |
| SSO-SAML-001 | AC-1 | T-3.1 | happy-path |
| SSO-SAML-001 | AC-2 | T-3.2, T-3.3 | happy-path, error-handling |
| SSO-SAML-001 | AC-3 | T-3.4 | happy-path |
| SSO-SAML-001 | AC-4 | T-3.5 | error-handling |
| SSO-SAML-001 | AC-5 | T-3.6 | security |
| SSO-SAML-001 | N/A | T-3.7, T-3.8 | authorization |
| MFA-TOTP-001 | AC-1 | T-4.1, T-4.2 | happy-path, edge-case |
| MFA-TOTP-001 | AC-2 | T-4.3 | happy-path |
| MFA-TOTP-001 | AC-3 | T-4.4 | happy-path |
| MFA-TOTP-001 | AC-4 | T-4.5 | boundary |
| MFA-TOTP-001 | AC-5 | T-4.6, T-4.7 | error-handling |
| MFA-TOTP-001 | N/A | T-4.8, T-4.9 | authorization |

## Test Cases

### AUTH-RATE-001: Basic Rate Limiting

#### T-1.1: IP-based rate limit enforcement - normal operation
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Authentication Rate Limiting

  Scenario: IP rate limit blocks excessive requests
    Given Redis is available and configured
    And an IP address "192.168.1.100" has made 0 requests in the current minute
    When the IP makes 101 requests to "/api/auth/login" within 1 minute
    Then the first 100 requests return HTTP 200
    And the 101st request returns HTTP 429 with header "Retry-After: 60"
    And the response body contains "Too Many Requests"
```

**Test Data:**
- IP address: `192.168.1.100`
- Endpoint: `/api/auth/login`
- Request payload: `{"username": "testuser", "password": "password123"}`

**Preconditions:**
- Redis server is running and accessible
- Rate limiting middleware is enabled
- System clock is synchronized

#### T-1.2: Rate limit applies per IP address
**Maps to:** AC-1
**Category:** boundary

```gherkin
  Scenario: Different IP addresses have independent rate limits
    Given IP address "192.168.1.100" has made 100 requests in the current minute
    And IP address "192.168.1.101" has made 0 requests
    When "192.168.1.101" makes a request to "/api/auth/login"
    Then the request returns HTTP 200
    And the rate limit counter for "192.168.1.101" is incremented
```

#### T-1.3: Rate limit counter consistency across instances
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Rate limit counters synchronized across application instances
    Given multiple application instances are running
    And Redis is configured as shared storage
    When IP "192.168.1.100" makes 50 requests to instance A
    And the same IP makes 51 requests to instance B within the same minute
    Then the 101st total request returns HTTP 429
    And the Redis counter for "192.168.1.100" shows 101 attempts
```

#### T-1.4: Rate limit reset after time window
**Maps to:** AC-3
**Category:** boundary

```gherkin
  Scenario: Rate limit resets after 1-minute window expires
    Given IP "192.168.1.100" has hit the rate limit (100 requests)
    When 61 seconds pass from the first request in the window
    And the IP makes a new request to "/api/auth/login"
    Then the request returns HTTP 200
    And the rate limit counter is reset to 1
```

#### T-1.5: Exactly at rate limit boundary
**Maps to:** AC-4
**Category:** boundary

```gherkin
  Scenario: Request exactly at rate limit succeeds
    Given IP "192.168.1.100" has made 99 requests in the current minute
    When the IP makes the 100th request
    Then the request returns HTTP 200
    When the IP immediately makes the 101st request
    Then the request returns HTTP 429
```

#### T-1.6: Redis unavailability fallback
**Maps to:** AC-5
**Category:** error-handling

```gherkin
  Scenario: Authentication proceeds when Redis is unavailable
    Given Redis is unavailable or unreachable
    When IP "192.168.1.100" makes a request to "/api/auth/login"
    Then the request proceeds without rate limiting
    And the request returns HTTP 200 or normal authentication response
    And an error is logged: "Redis unavailable - rate limiting bypassed"
```

#### T-1.7: Unauthenticated rate limit check (mandatory authorization test)
**Maps to:** N/A (mandatory)
**Category:** authorization

```gherkin
  Scenario: Rate limiting applies before authentication
    Given an unauthenticated user at IP "192.168.1.100"
    When they make 101 requests to "/api/auth/login" within 1 minute
    Then the first 100 requests are processed normally
    And the 101st request returns HTTP 429
    And no authentication is attempted for the rate-limited request
```

#### T-1.8: Rate limiting bypassed for admin endpoints (negative auth test)
**Maps to:** N/A (mandatory)
**Category:** authorization

```gherkin
  Scenario: Admin bypass attempts are rejected
    Given a user with role "admin" attempts to bypass rate limiting
    When they include header "X-Admin-Bypass: true" in requests
    Then rate limiting is still enforced normally
    And no special treatment is given to admin requests
```

### SESSION-TIMEOUT-001: Idle Session Enforcement

#### T-2.1: Activity tracking updates session timestamp
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Session Idle Timeout Management

  Scenario: User activity updates session timestamp
    Given a user has an active session with ID "sess_abc123"
    And the last activity time is "2026-06-09T10:00:00Z"
    When the user clicks a button at "2026-06-09T10:05:00Z"
    Then the session last activity time is updated to "2026-06-09T10:05:00Z"
    And the session remains valid
```

**Test Data:**
- Session ID: `sess_abc123`
- User ID: `user_456`
- Organization timeout: `1800` seconds (30 minutes)
- Activity types: `["click", "keypress", "api_call"]`

**Preconditions:**
- User is authenticated with valid session
- Redis session store is available
- Client-side activity tracking is enabled

#### T-2.2: Five-minute warning modal appears
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Warning modal appears 5 minutes before timeout
    Given a user has been idle for 25 minutes (timeout is 30 minutes)
    When they return to the application or perform any activity
    Then a modal appears with text "Your session will expire in 5 minutes due to inactivity. Extend session?"
    And the modal contains "Extend session" and "Logout now" buttons
```

#### T-2.3: Warning countdown updates in real-time
**Maps to:** AC-2
**Category:** edge-case

```gherkin
  Scenario: Warning modal shows live countdown
    Given the session warning modal is displayed
    When 1 minute passes without user action
    Then the modal text updates to "Your session will expire in 4 minutes due to inactivity"
    And the countdown continues updating every minute
```

#### T-2.4: Session extension resets timeout
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: User extends session successfully
    Given a session warning modal is displayed
    When the user clicks "Extend session"
    Then the session timeout is reset to the full 30-minute duration
    And the warning modal disappears
    And the session last activity time is updated to current time
```

#### T-2.5: Automatic logout after timeout
**Maps to:** AC-4
**Category:** boundary

```gherkin
  Scenario: Session expires and user is logged out
    Given a user's session has been idle for exactly 30 minutes
    When the timeout period expires
    Then the user is automatically redirected to the login page
    And the page displays message "Your session expired due to inactivity"
    And the session is invalidated in Redis
```

#### T-2.6: Background tab session warning
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: Warning appears when returning to background tab
    Given a user has the application open in a background tab
    And their session is approaching expiration (2 minutes remaining)
    When they switch back to the application tab
    Then the warning modal immediately appears
    And shows the correct remaining time
```

#### T-2.7: Unauthenticated session timeout check (mandatory authorization test)
**Maps to:** N/A (mandatory)
**Category:** authorization

```gherkin
  Scenario: Unauthenticated users cannot access session endpoints
    Given an unauthenticated user
    When they attempt to call "/api/session/extend"
    Then the request returns HTTP 401
    And the response body contains "Authentication required"
```

#### T-2.8: Cross-session timeout manipulation (mandatory authorization test)
**Maps to:** N/A (mandatory)
**Category:** authorization

```gherkin
  Scenario: Users cannot extend other users' sessions
    Given user A has session "sess_123" 
    And user B has session "sess_456"
    When user B attempts to extend session "sess_123"
    Then the request returns HTTP 403
    And session "sess_123" timeout is not modified
```

### SSO-SAML-001: Basic SAML 2.0 Authentication

#### T-3.1: Valid SAML AuthnRequest generation
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: SAML 2.0 Single Sign-On

  Scenario: Generate proper SAML AuthnRequest
    Given an organization has SAML SSO configured with IdP "https://idp.example.com"
    When a user clicks "Login with SSO" for the organization
    Then a SAML AuthnRequest is generated with unique request ID
    And the request includes current timestamp
    And the request destination is "https://idp.example.com/sso"
    And the user is redirected to the IdP with the signed request
```

**Test Data:**
- Organization: `org_saml_test`
- IdP endpoint: `https://idp.example.com/sso`
- SP entity ID: `https://app.example.com/saml`
- Certificate: Valid X.509 certificate for signature verification

**Preconditions:**
- Organization has SAML configuration enabled
- IdP metadata is loaded and valid
- SSL certificates are available

#### T-3.2: Valid SAML Response processing
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Successfully process valid SAML response
    Given a SAML AuthnRequest has been sent with request ID "req_123"
    When the IdP returns a signed SAML response
    And the response signature is valid
    And the assertion timestamps are current
    Then the response is accepted as valid
    And user attributes are extracted for account creation/login
```

#### T-3.3: SAML signature validation failure
**Maps to:** AC-2
**Category:** error-handling

```gherkin
  Scenario: Reject SAML response with invalid signature
    Given a SAML response is received from the IdP
    When the response signature validation fails
    Then authentication fails immediately
    And error is logged: "SAML signature validation failed for org org_saml_test"
    And user sees message: "SSO authentication failed. Please try again or contact support."
```

#### T-3.4: User attribute extraction from SAML
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Extract user details from SAML assertions
    Given a valid SAML response with user assertions
    When the response contains NameID "john.doe@example.com"
    And assertion includes attribute "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": "john.doe@example.com"
    And assertion includes attribute "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": "John Doe"
    Then email address "john.doe@example.com" is extracted
    And display name "John Doe" is extracted
    And user account is created or updated with these attributes
```

#### T-3.5: Invalid signature handling with security logging
**Maps to:** AC-4
**Category:** error-handling

```gherkin
  Scenario: Security alert for invalid SAML signature
    Given a SAML response with invalid signature is received
    When signature validation is performed
    Then authentication fails with HTTP 403
    And security alert is logged with IP address and organization
    And user receives generic error message
    And no sensitive signature details are exposed
```

#### T-3.6: SAML replay attack prevention
**Maps to:** AC-5
**Category:** security

```gherkin
  Scenario: Prevent SAML response replay attacks
    Given a valid SAML response with request ID "req_123" has been processed
    When the same SAML response is submitted again
    Then authentication fails immediately
    And security alert is logged: "Potential SAML replay attack detected for org org_saml_test"
    And the request ID "req_123" is marked as used in Redis
```

#### T-3.7: Unauthenticated SAML callback (mandatory authorization test)
**Maps to:** N/A (mandatory)
**Category:** authorization

```gherkin
  Scenario: SAML callback requires proper request context
    Given no active SAML authentication request exists
    When a SAML response is posted to "/api/auth/saml/callback"
    Then the request returns HTTP 400
    And error message indicates "No matching SAML request found"
```

#### T-3.8: Cross-organization SAML response (mandatory authorization test)
**Maps to:** N/A (mandatory)
**Category:** authorization

```gherkin
  Scenario: SAML response restricted to correct organization
    Given organization A has initiated SAML authentication
    When a SAML response for organization B is received
    Then authentication fails with HTTP 403
    And error is logged: "SAML organization mismatch detected"
```

### MFA-TOTP-001: TOTP Setup and Validation

#### T-4.1: TOTP secret generation and QR code display
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Time-based One-Time Password (TOTP) Authentication

  Scenario: Generate TOTP secret and display setup options
    Given an authenticated user accesses MFA configuration
    When they select "Set up authenticator app"
    Then a unique 32-character base32 TOTP secret is generated
    And a QR code is displayed containing the secret
    And manual entry instructions show the secret key
    And setup instructions for common apps (Google Authenticator, Authy) are displayed
```

**Test Data:**
- User ID: `user_789`
- TOTP issuer: `MyApp`
- Account name: `user@example.com`
- Secret length: 32 characters (160 bits)
- QR code format: `otpauth://totp/MyApp:user@example.com?secret={SECRET}&issuer=MyApp`

**Preconditions:**
- User is authenticated
- User does not have TOTP already configured
- QR code generation library is available

#### T-4.2: QR code generation failure fallback
**Maps to:** AC-1
**Category:** edge-case

```gherkin
  Scenario: Provide manual entry when QR generation fails
    Given TOTP setup is initiated
    When QR code generation fails due to library error
    Then the manual entry key is still displayed
    And user sees message: "QR code temporarily unavailable. Please use manual entry."
    And setup can proceed with manual key entry
```

#### T-4.3: TOTP setup verification with authenticator app
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Verify TOTP setup with valid code
    Given a user has scanned the TOTP QR code
    And their authenticator app generates a 6-digit code
    When they enter the current TOTP code during setup
    Then the code is validated against the generated secret
    And TOTP setup completes successfully
    And the secret is encrypted and stored
    And backup codes are generated and displayed
```

#### T-4.4: TOTP code required for login
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: TOTP required after primary authentication
    Given a user has TOTP enabled
    When they complete username/password authentication
    Then they are prompted for a 6-digit TOTP code
    And login cannot complete without valid TOTP code
    When they enter a valid TOTP code
    Then authentication completes and they access the application
```

#### T-4.5: TOTP time window tolerance
**Maps to:** AC-4
**Category:** boundary

```gherkin
  Scenario: TOTP codes accepted within time window
    Given current time is "2026-06-09T10:00:00Z"
    When a user generates TOTP codes for times:
      | Time | Code |
      | 10:00:00 | 123456 |
      | 09:59:30 | 654321 |
      | 10:00:30 | 789012 |
    Then all three codes are accepted within the 30-second window
    And codes from earlier periods are rejected
```

#### T-4.6: Invalid TOTP code handling
**Maps to:** AC-5
**Category:** error-handling

```gherkin
  Scenario: Handle incorrect TOTP codes gracefully
    Given a user is at the TOTP prompt
    When they enter an invalid code "000000"
    Then they see message "Invalid authentication code. Please try again."
    And they can retry with a new code
    And failed attempt is logged for rate limiting
```

#### T-4.7: TOTP rate limiting after multiple failures
**Maps to:** AC-5
**Category:** error-handling

```gherkin
  Scenario: Rate limit TOTP attempts after repeated failures
    Given a user has failed TOTP validation 5 times in 5 minutes
    When they attempt another TOTP code
    Then they are temporarily blocked for 15 minutes
    And message displays "Too many failed attempts. Please try again in 15 minutes."
    And security alert is logged for potential brute force attack
```

#### T-4.8: Unauthenticated TOTP setup (mandatory authorization test)
**Maps to:** N/A (mandatory)
**Category:** authorization

```gherkin
  Scenario: TOTP setup requires authentication
    Given an unauthenticated user
    When they attempt to access "/api/mfa/totp/setup"
    Then the request returns HTTP 401
    And error message states "Authentication required to configure MFA"
```

#### T-4.9: Cross-user TOTP configuration (mandatory authorization test)
**Maps to:** N/A (mandatory)
**Category:** authorization

```gherkin
  Scenario: Users cannot configure TOTP for other accounts
    Given user A is authenticated
    When they attempt to configure TOTP for user B's account
    Then the request returns HTTP 403
    And error message states "Cannot configure MFA for another user"
    And no TOTP changes are made to user B's account
```

## Negative Tests

### Rate Limiting Edge Cases

#### T-1.9: Malformed IP address handling
**Category:** error-handling

```gherkin
  Scenario: Handle malformed IP addresses gracefully
    Given a request has malformed IP address in headers
    When rate limit checking occurs
    Then fallback IP extraction is used
    And warning is logged: "Malformed IP address detected"
    And rate limiting proceeds with fallback IP
```

### Session Management Edge Cases

#### T-2.9: Network failure during session extension
**Category:** error-handling

```gherkin
  Scenario: Handle network failures during session extension
    Given a user clicks "Extend session"
    When the extension API call fails due to network error
    Then the system retries the extension call
    And if retry fails, shows "Network error extending session. Please try again."
    And user can retry manually
```

### SAML Security Edge Cases

#### T-3.9: Malformed SAML XML handling
**Category:** error-handling

```gherkin
  Scenario: Process malformed SAML XML securely
    Given a malformed SAML XML response is received
    When XML parsing is attempted
    Then parsing fails safely without exposing system details
    And error is logged: "SAML XML parsing failed"
    And user sees generic "Authentication failed" message
```

### TOTP Security Edge Cases

#### T-4.10: TOTP secret encryption verification
**Category:** security

```gherkin
  Scenario: Verify TOTP secrets are encrypted at rest
    Given a TOTP secret is stored in the database
    When the raw database value is examined
    Then the secret is encrypted and not readable as plaintext
    And decryption is only possible with application keys
```

## Boundary Tests

### Cross-Feature Integration

#### T-5.1: Rate limiting with SAML authentication
**Category:** integration

```gherkin
  Scenario: Rate limiting applies to SAML endpoints
    Given SAML SSO is configured for an organization
    When an IP makes 101 requests to "/api/auth/saml/login" within 1 minute
    Then the first 100 requests proceed to SAML processing
    And the 101st request returns HTTP 429 before SAML processing
```

#### T-5.2: Session timeout with TOTP authentication
**Category:** integration

```gherkin
  Scenario: TOTP prompt respects session timeout
    Given a user completes primary authentication
    And they are prompted for TOTP code
    When they wait 30 minutes without entering TOTP
    Then their session expires
    And they are redirected to login with "session expired" message
    And must restart the entire authentication flow
```

This comprehensive test specification provides complete coverage of all acceptance criteria while ensuring security, performance, and error handling are thoroughly tested.
