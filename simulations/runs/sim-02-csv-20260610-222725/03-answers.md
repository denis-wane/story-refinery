# Stakeholder Responses

## Critical Questions

### 1. Duplicate Email Handling Against Existing Records
**Answer:** Flag duplicates as validation errors and skip them during import. We cannot have duplicate emails in our CRM - it breaks our email marketing automation and customer communication workflows.
**Additional context:** Our sales team relies on unique email identification for lead scoring. However, provide a clear report of which emails were skipped so users can manually review if they're legitimate updates to existing contacts.

### 2. Custom Field Enum Value Mismatch Behavior
**Answer:** Reject rows with invalid enum values and include them in the error report. Do not auto-create new dropdown options.
**Additional context:** Our custom fields are carefully curated by our admin team for reporting consistency. Auto-creating values would mess up our dashboards and filters. If users need new dropdown values, they should request them through our normal admin process first.

### 3. Undo Operation Granularity
**Answer:** Undo the entire import as one atomic operation. All records from that import session get soft-deleted together.
**Additional context:** Selective undo would be too complex for our users to manage safely. We've seen too many data integrity issues when people try to cherry-pick changes. All-or-nothing is cleaner and less error-prone.

### 4. Import Permission Model
**Answer:** Any user with "Edit Contacts" permission can import contacts. Only Admin and Manager roles can view full import history and undo any user's import. Users can only see their own import history and undo their own imports.
**Additional context:** This aligns with our existing CRM permissions. We need managers to have oversight capability for compliance audits, but regular users shouldn't be able to mess with each other's work.

### 5. Async Processing Failure Recovery
**Answer:** Fully roll back failed imports. Users restart the entire process if something goes wrong.
**Additional context:** Data consistency is more important than convenience for our enterprise customers. They'd rather re-run a reliable process than wonder if their data is in a weird partial state.

## Important Questions

### 1. Concurrent Import Limitations
**Answer:** Allow up to 3 concurrent imports system-wide. Queue additional requests with estimated wait time.
**Additional context:** Our database performance team says more than 3 simultaneous large imports impacts other users. Better to queue with transparency than slow down the whole system.

### 2. Error Report Delivery Method
**Answer:** Downloadable from import history page for 30 days, then auto-deleted. No email delivery.
**Additional context:** Our file storage costs are already high, but 30 days gives people time to download during business travel. Email attachments get blocked by some customer firewalls.

### 3. Data Transformation Scope
**Answer:** Perform basic cleanup - trim whitespace, standardize phone number format to E.164, and title case for names. No other transformations.
**Additional context:** Our customer success team spends too much time cleaning up messy imports. Standard phone formatting will help with our calling integrations.

## Nice to Have

### 1. Progress Estimation Accuracy
**Answer:** Use rows-per-second calculation updated every 10 seconds. Show both percentage complete and estimated time remaining.

### 2. File Encoding Detection Priority
**Answer:** Auto-detect with UTF-8 preference. If confidence is below 90%, show encoding dropdown for user selection.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | 48-hour undo window is fixed | ⚠️ Partially | Should be configurable by admin - some customers want 7 days, others want 24 hours |
| 2 | Preview limited to first 20 rows | ✅ Correct | 20 is perfect for validation without overwhelming the screen |
| 3 | Partial imports are always user-choice | ✅ Correct | Users need control over this decision for their business process |
| 4 | Column mapping is required | ❌ Wrong | Auto-map by column name first, then let users adjust. Most CSVs have standard headers |
| 5 | Single entity type per import | ✅ Correct | Mixed imports would be too complex for v1. Keep it simple |
