# Clarifying Questions

## Critical (must answer before proceeding)

1. **Duplicate Email Handling Strategy**
   When an import contains an email that already exists in the CRM, should the system update the existing record with new data from the CSV, or reject the duplicate row as an error?
   - _Why it matters:_ This fundamentally changes the validation logic, database operations, and undo functionality. Update vs. reject requires completely different technical approaches.
   - _Default assumption if unanswered:_ Reject duplicates as validation errors (safer for data integrity)

2. **Undo Functionality Scope**
   When a user clicks "Undo Import," should it only remove newly created records, or also reverse any updates made to existing records during the import?
   - _Why it matters:_ Undoing updates requires storing previous values and complex rollback logic. Affects database design and implementation complexity significantly.
   - _Default assumption if unanswered:_ Undo only removes newly created records, does not reverse updates to existing records

3. **User Permission Model**
   Which user roles can perform imports, and are there restrictions on data types (contacts vs. companies vs. deals) or file sizes per role?
   - _Why it matters:_ Every import story needs permission checks. Different roles may need different UI flows and validation rules.
   - _Default assumption if unanswered:_ All authenticated users can import any data type up to the 50MB limit

## Important (strongly recommended)

1. **Custom Field Validation Rules**
   For custom dropdown/enum fields during column mapping, should invalid values be rejected with an error, or should the system offer to create new dropdown options dynamically?
   - _Why it matters:_ Affects both the mapping interface design and validation complexity. Auto-creation could corrupt data integrity if users make typos.
   - _Default assumption if unanswered:_ Reject invalid dropdown values as validation errors (require exact matches)

2. **Async Processing Notifications**
   How should users be notified when their background import completes—email, in-app notification, browser push notification, or just require them to check back manually?
   - _Why it matters:_ Affects user experience for large imports. Email requires email infrastructure; in-app requires real-time notification system.
   - _Default assumption if unanswered:_ In-app notification only (visible when user returns to the import history page)

3. **Column Mapping Template Persistence**
   Should users be able to save their column mappings as reusable templates for future imports of similar file structures?
   - _Why it matters:_ Significantly improves UX for regular imports, but requires additional data modeling and UI complexity.
   - _Default assumption if unanswered:_ No template saving—users must remap columns for each import

## Nice to Have (will use reasonable defaults)

1. **Async Processing Threshold Validation**
   The analysis assumes files with >1000 rows trigger background processing. Is this the right threshold, or should it be based on file size, processing time, or user preference?
   - _Why it matters:_ Wrong threshold could cause timeouts (too high) or unnecessary async overhead (too low).
   - _Default assumption if unanswered:_ Use 1000 rows as the threshold

2. **Error Report Format Validation**
   The analysis assumes error reports are CSV files with row numbers, field names, and error descriptions. Should they also include the original row data for easier correction?
   - _Why it matters:_ Including original data makes fixing errors easier but increases file size and potential data exposure.
   - _Default assumption if unanswered:_ Include row number, field name, error description, and original field value

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **Partial import requires user confirmation** — Analysis assumes a checkbox option with valid/invalid row summary before import
2. **Time estimation based on processing rate** — Progress bar shows ETA calculated from already-processed rows per second
3. **Import history stored indefinitely** — No mention of cleanup/retention policies for import audit data
4. **48-hour undo window applies to all imports** — No distinction between small vs. large import undo timeframes
5. **Same validation rules for all organizations** — No mention of configurable validation rules per tenant/organization
