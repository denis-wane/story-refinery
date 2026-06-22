# Feature: Bulk CSV Import with Validation and Progress Tracking

## Overview
Our CRM application needs a bulk data import feature. Users should be able to upload CSV files containing contacts, companies, or deals, have the data validated against our schema, preview the results, and then commit the import. Large files (100k+ rows) are common for enterprise customers migrating from other CRMs.

## Requirements
- Support CSV and Excel (.xlsx) file uploads
- File size limit: 50MB
- Column mapping UI: user maps CSV columns to our data fields (name, email, phone, company, custom fields)
- Validation rules: email format, phone format, required fields, unique constraints (no duplicate emails within an import or against existing records), custom field type validation
- Preview screen showing first 20 rows with validation status per row
- For large files, process asynchronously with a progress bar (percentage + estimated time remaining)
- On validation failure: show error summary (count by error type) and allow user to download an error report CSV with row numbers and error descriptions
- Partial import option: allow importing valid rows while skipping invalid ones
- Import history: show past imports with date, file name, row counts (total, imported, skipped, failed)
- Undo import: ability to reverse an import within 48 hours (soft-delete the imported records)

## Technical Context
- Backend: Python/Django with Celery for async tasks
- Database: PostgreSQL with ~2M existing contact records
- File storage: AWS S3 for uploaded files
- Frontend: React with drag-and-drop file upload
- Current max API payload: 10MB (uploads go direct to S3 with presigned URLs)

## Known Edge Cases
- CSV files with different encodings (UTF-8, Latin-1, Windows-1252)
- Files with BOM markers
- Inconsistent date formats across rows
- Phone numbers in international formats
- Custom fields with dropdown/enum values — imports need to match existing options or fail
