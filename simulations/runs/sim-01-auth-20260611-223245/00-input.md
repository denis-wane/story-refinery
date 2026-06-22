# Feature: User Authentication with SSO and MFA

## Overview
We need to add enterprise authentication to our B2B SaaS application. Currently users authenticate with email/password only. We need to support Single Sign-On (SSO) via SAML 2.0 and OpenID Connect, plus Multi-Factor Authentication (MFA) using TOTP authenticator apps and SMS codes.

## Requirements
- Existing email/password auth must continue to work alongside SSO
- Enterprise customers can configure SSO for their organization — once enabled, their users must use SSO (no password fallback)
- MFA should be optional per-user by default, but organization admins can enforce it for all users
- Support TOTP (Google Authenticator, Authy) and SMS as MFA methods
- Users should be able to add backup recovery codes when enabling MFA
- Session management: configurable session timeout per organization (default 24h, max 30 days)
- Audit log all authentication events (login, logout, MFA challenge, SSO assertion, failed attempts)

## Technical Context
- Backend is Node.js/Express with PostgreSQL
- Frontend is React SPA
- Currently using JWT tokens stored in httpOnly cookies
- We have ~50k users across ~200 organizations
- Must support SCIM provisioning for SSO organizations in a future phase (not this one)

## Stakeholder Notes
- Security team requires MFA for all admin-role users by Q3
- Some enterprise customers have specifically asked for Okta and Azure AD integration
- We had a credential stuffing incident last quarter — rate limiting on auth endpoints is a priority
