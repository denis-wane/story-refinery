Looking at this bulk CSV import feature, let me provide my responses as the product owner:

# Stakeholder Responses

## Critical Questions

### 1. Custom field validation and dropdown matching
**Answer:** Create new dropdown options automatically, but flag them for admin review. We don't want to block imports just because someone typed "Webinar" instead of "Web Event" in the Lead Source field.
**Additional context:** Our sales team frequently encounters slight variations in terminology from imported data. We'd rather have the data imported and clean it up later than lose leads due to strict validation. However, admins should get a weekly digest of new dropdown values that were auto-created so they can merge duplicates.

### 2. Duplicate detection performance strategy  
**Answer:** Batch processing approach sounds good. Check duplicates in chunks of 1000 rows - that should keep things responsive.
**Additional context:** We've had issues before where large operations lock up the system. Our enterprise customers often import 50k+ records, so this has to be rock solid.

### 3. Partial import relationship handling
**Answer:** Link orphaned contacts to a default "Unknown Company" placeholder rather than rejecting them. We can't afford to lose contact data just because company names don't match perfectly.
**Additional context:** Our sales reps spend way too much time re-entering contact data. If there's a way to import the contact even with a messy company reference, do it. They can fix the company association later.

### 4. Undo scope for related records  
**Answer:** Only revert unmodified records and show a clear warning about which records were left untouched. This is about safety - we can't accidentally undo work that happened after the import.

### 5. Import permission model
**Answer:** Regular users can import contacts and companies (they need both for their territory management), but only admins can import deals. No approval workflows - that would slow down our sales process too much.
**Additional context:** Deals have financial implications and complex validation rules around revenue recognition. But contacts and companies are pretty safe - worst case we have duplicate data to clean up.

## Important Questions

### 1. File retention and cleanup policy
**Answer:** Keep files for 90 days instead of 30. Our compliance team requires at least 60 days for audit trails, and the extra 30 days gives us breathing room for debugging issues.
**Additional context:** We're in healthcare adjacent space, so data retention is more strict than typical SaaS. Storage costs aren't a major concern compared to compliance headaches.

### 2. Async processing failure recovery  
**Answer:** Task restart is fine for now. Resume functionality would be nice but adds complexity we don't need in v1.

### 3. Date format ambiguity resolution
**Answer:** Default to MM/DD/YYYY but add a format picker in the column mapping UI. Let users specify "this column is DD/MM/YYYY" during the mapping step.
**Additional context:** We have customers in both US and European markets, so this comes up regularly. The format picker approach lets users fix it upfront rather than dealing with wrong dates later.

### 4. International phone number validation scope
**Answer:** Support US, Canada, UK, Australia, and Germany to start. That covers 90% of our customer base. Make the default country configurable by admin.

### 5. Encoding detection fallback behavior  
**Answer:** Try the common encodings automatically, then show a dropdown if they all fail. Don't make users think about encoding unless we absolutely have to.

## Nice to Have  
_All defaults look reasonable - no strong opinions on these implementation details._

## Assumptions Review

| # | Assumption | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Role-based import history access | ✅ Correct | Privacy is important, users should only see their own import history |
| 2 | UTF-8 encoding preference | ✅ Correct | Most modern files are UTF-8, good default choice |
| 3 | Strict email uniqueness | ❌ Wrong | Allow duplicate emails but flag them with warnings. Sometimes legitimate duplicates exist (shared emails, family businesses) |
| 4 | Soft-delete undo mechanism | ✅ Correct | Hard deletes are too risky, soft-delete gives us recovery options |
| 5 | S3 direct upload approach | ✅ Correct | Keeps server load down and uploads are faster |
| 6 | Celery-based async processing | ✅ Correct | We already have this infrastructure, makes sense to use it |
