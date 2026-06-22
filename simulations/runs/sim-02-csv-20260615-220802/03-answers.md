# Stakeholder Responses

## Critical Questions

### 1. Undo behavior for mutated records
**Answer:** Option (b) — skip records that were modified after import, and report them clearly.
**Additional context:** We considered a full revert but legal flagged it as risky — if a rep updates a contact's phone number, silently overwriting that is a support nightmare. The undo confirmation screen should show a count of "X records will be skipped because they were edited." That's enough for our customers.

### 2. Authorization model for import and undo
**Answer:** Both CRM Admin and Power User can run imports. Undo is CRM Admin only. Power Users see only their own import history; Admins see everyone's.
**Additional context:** FYI, we already have a third role — "Read Only" — that obviously gets none of this. Just flagging so you don't design a two-role system.

### 3. Date format handling behavior
**Answer:** Option (c) — flag inconsistent or ambiguous date cells as row-level validation errors. Do not auto-coerce.
**Additional context:** We had a bad experience with a previous vendor silently converting dates and flipping month/day on European-format files. Our customers noticed months later. Never again.

### 4. Async processing threshold
**Answer:** Switch to async at 500 rows or 500KB, whichever comes first.
**Additional context:** Our typical enterprise migration file is 50k–150k rows. We'd rather set the async threshold low and give a consistent experience than have users occasionally hit a 30-second spinner on a "medium" file.

### 5. Uniqueness constraint scope beyond contacts
**Answer:** Contacts only for the email uniqueness check. Companies and deals don't have a reliable natural key in v1.
**Additional context:** Down the road we'll probably use company domain as a fuzzy-match key for companies, but that's not this release. Skip it for now.

---

## Important Questions

### 1. S3 file retention window
**Answer:** Retain uploaded files for 90 days, not 30. Our enterprise customers sometimes run audits weeks after an import and want the original file available for support cases.
**Additional context:** Our legal team confirmed CSV files count as business records under our data policy, so 90 days is the minimum we're comfortable with. Undo itself should use stored record IDs — don't rebuild from the file.

### 2. Partial import: opt-in or always-on
**Answer:** Opt-in checkbox on the commit screen, defaulting to **on** (not off).
**Additional context:** This is the opposite of your default assumption — defaulting to "fail entire import" will frustrate enterprise users migrating 100k rows who hit 3 bad rows. Our sales team specifically committed to partial import as a selling point. Default it on.

### 3. Async completion notification
**Answer:** In-app only for v1. No email.
**Additional context:** We have a notification service (Courier) but it's not wired into the CRM backend yet. That's a separate workstream. Don't block on it.

### 4. Column mapping template persistence
**Answer:** Yes, we need mapping templates. This was supposed to be in the spec — sorry it got dropped. Enterprise customers running weekly Salesforce syncs will complain loudly without it.
**Additional context:** Basic CRUD is fine: save a template with a name, load it at the mapping step. No sharing between users in v1 — each template is owned by the user who created it.

### 5. Import history scope and retention
**Answer:** Show last 100 imports, reverse-chronological. Simple date-range filter (last 7 days / 30 days / all). No expiry — retain indefinitely.
**Additional context:** Admins sometimes need to audit imports from months ago for compliance. The "last 50, no filter" default would require a support ticket every time. Keep it simple but filterable.

---

## Nice to Have

### 1. Progress bar delivery mechanism
**Answer:** HTTP polling every 3 seconds is fine for v1.

### 2. Intra-file duplicate row resolution
**Answer:** Flag both rows as errors, import neither. Include both row numbers in the error CSV.

### 3. Custom field enum mismatch severity
**Answer:** Fail the row only — consistent with how we handle other validation errors.

---

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | One entity type per import | ✅ Correct | Mixed-type files are not a use case we've heard from customers. Keep it simple. |
| 2 | Progress delivery is polling | ✅ Correct | Confirmed above — polling every 3s is fine. |
| 3 | Full-file validation before preview | ✅ Correct | Users need to see the total error count before deciding whether to do a partial import. |
| 4 | ETR uses rolling rows/sec average | ✅ Correct | Good enough. Don't overthink the ETA math. |
| 5 | In-app notification only | ✅ Correct | Confirmed — no email in v1. |
| 6 | History shows last 50 imports, no search | ❌ Wrong | We need 100 imports and a basic date-range filter. See answer above. |
| 7 | Undo is also async for large imports | ✅ Correct | Absolutely — don't try to soft-delete 100k rows synchronously. |
| 8 | S3 completion requires client confirmation | ⚠️ Partially | Mechanism is correct (client POST after upload), but make sure the presigned URL expiry is set to at least 15 minutes — our enterprise files are large and upload speed varies. We've had timeouts on the current 5-minute expiry. |
