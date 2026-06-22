# Stakeholder Responses

## Critical Questions

### 1. Duplicate Email Handling Strategy
**Answer:** Update existing records with new data from the CSV
**Additional context:** Our sales team frequently gets updated contact info from trade shows and partners. When they import those lists, they want to refresh our existing contacts with new phone numbers, job titles, company changes, etc. Rejecting duplicates would force them to manually merge data, which defeats the purpose of bulk import. However, we should show a clear summary of how many existing records will be updated vs. new records created.

### 2. Undo Functionality Scope
**Answer:** Undo should reverse both newly created records AND any updates made to existing records
**Additional context:** If someone accidentally imports test data or the wrong file and it overwrites good contact info, they need to be able to fully roll back. Our sales team would be furious if they lost updated contact details because of a bad import. Store the previous values so we can restore them.

### 3. User Permission Model
**Answer:** Standard users can import contacts and companies up to 50MB. Only Admin and Sales Manager roles can import deals. 
**Additional context:** Deals contain sensitive revenue data, so we restrict that. Also, we might want to consider a smaller file size limit (maybe 25MB) for standard users to prevent them from accidentally overwhelming the system during business hours.

## Important Questions

### 1. Custom Field Validation Rules
**Answer:** Reject invalid dropdown values as validation errors, but show users what the valid options are
**Additional context:** We learned this the hard way when someone imported "CA" for California but our system expected "California" and it created a mess. The error report should list the valid dropdown options so users can fix their CSV. Don't auto-create new options—that would pollute our carefully curated field values.

### 2. Async Processing Notifications
**Answer:** Send email notification when processing completes, plus show status in the import history page
**Additional context:** Large imports often happen overnight or when people are in meetings. Email notification ensures they know it's done. Include summary stats in the email: how many imported successfully, how many failed, and a link back to the detailed results.

### 3. Column Mapping Template Persistence
**Answer:** Yes, definitely save column mapping templates
**Additional context:** Our biggest customers do monthly imports from the same external systems. Having to remap 20+ columns every time is a major pain point. Let users name and save templates, and auto-suggest templates when they upload files with similar headers.

## Nice to Have

### 1. Async Processing Threshold Validation
**Answer:** Use 5,000 rows as the threshold, not 1,000
**Additional context:** 1,000 rows usually processes in under 30 seconds, so users expect it to be immediate. 5,000+ is when it starts taking 2-3 minutes and people get impatient. Also consider offering a "process in background" option for any file size if users prefer to queue it up.

### 2. Error Report Format Validation
**Answer:** Include the original row data, but only for the fields that had errors
**Additional context:** Users need to see what they originally entered to fix it, but don't include the entire row—that creates huge files. Just show the problematic fields plus maybe a row identifier like name or email.

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Partial import requires user confirmation | ✅ Correct | Yes, show clear "Import X valid rows, skip Y invalid rows" confirmation |
| 2 | Time estimation based on processing rate | ✅ Correct | Good approach, but add buffer time so estimates are conservative |
| 3 | Import history stored indefinitely | ❌ Wrong | Keep for 1 year max. Longer term storage gets expensive and most users don't need ancient history |
| 4 | 48-hour undo window applies to all imports | ⚠️ Partially | 48 hours for standard users, but give admins 7 days since they handle larger, more complex imports |
| 5 | Same validation rules for all organizations | ✅ Correct | Keep it simple for v1. Custom validation per tenant can come later if needed |
