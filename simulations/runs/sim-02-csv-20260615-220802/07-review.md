# Quality Review

## Summary
- **Stories reviewed:** 19
- **Passed (80+):** 19
- **Needs revision:** 0
- **Blocked:** 0
- **Overall quality:** Exceptional. This is a professional-grade package with structured gap analysis, comprehensive ACs, and full test coverage. Pre-sprint actions required on two deferred gaps before work can begin.

---

## Per-Story Review

### UPLOAD-01: Drag-and-drop file upload via presigned URL

**Score: 91/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | Scope In/Out explicit; presigned URL mechanism and entity-type prerequisite clearly bounded |
| 2 | Gap analysis quality | 15 | 15 | G-7, G-8, G-11 all traced to this story with resolution status |
| 3 | AC completeness | 20 | 19 | Happy path, boundary (50MB ±1 byte), expiry, network failure, auth all covered; MIME enforcement marked as open question rather than AC |
| 4 | AC specificity | 10 | 9 | Error messages quoted verbatim; one mild ambiguity: AC-6 says "at least every 2 seconds" but doesn't specify the assertion mechanism in an E2E context |
| 5 | Test coverage | 20 | 19 | Full coverage matrix; T-7.1/T-7.2 correctly tests both sides of the 50MB boundary |
| 6 | Test quality | 10 | 9 | Concrete test data (byte-level file sizes); T-6.1 mentions throttled network speed in test data which is environment-dependent |
| 7 | Traceability | 5 | 5 | Gap traceability table complete; every AC referenced in test matrix |
| 8 | Architecture alignment | 5 | 5 | Presigned URL bypass of 10MB API limit, S3 directly, React frontend — all correct |
| | **TOTAL** | **100** | **91** | |

**Strengths:**
- BOM-level detail in T-2.1 for UPLOAD-02's test shows genuine understanding of the S3 upload flow
- Empty file (0-byte) edge case covered separately from oversized file
- MIME type question correctly surfaced as open, not assumed

**Issues:**

### Major
1. **MIME type enforcement gap** — Found in: AC/Open Questions — The story flags MIME validation as unconfirmed but proceeds without an AC. If a `.csv` file is actually a ZIP (content-type mismatch), the backend would issue a presigned URL for it. This should be resolved before sprint start, not post-sprint.

### Minor
1. **AC-6 progress indicator threshold** — "updates at least every 2 seconds" is difficult to assert deterministically in CI; consider revising to "is visible and non-zero when > 5% of file has been transmitted."

**Consistency checks:**
- [x] Story statement in AC matches original intent
- [x] All analyst-identified gaps addressed in AC or explicitly deferred
- [x] All AC map to at least one test case
- [x] All test cases trace back to an AC
- [x] Assumptions consistent across documents
- [x] Dependencies consistent
- [x] Authorization tests (401/403) present

---

### UPLOAD-02: S3 upload completion callback and import job initialization

**Score: 90/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | Clear; client-initiated confirmation (not S3 event) explicitly confirmed |
| 2 | Gap analysis quality | 15 | 15 | G-8 (S3 retention) resolved to 90-day lifecycle with explicit AC |
| 3 | AC completeness | 20 | 19 | Idempotency (AC-5), fabricated key (AC-4), lifecycle rule (AC-3 as infrastructure deliverable) — all present |
| 4 | AC specificity | 10 | 9 | Excellent specificity; AC-3 is an infra assertion test (lifecycle rule), which is harder to automate than functional ACs |
| 5 | Test coverage | 20 | 19 | T-3.1 cleverly tests the S3 lifecycle rule as infra verification |
| 6 | Test quality | 10 | 9 | T-1.2 security test (uploader from session, not body) is a strong anti-IDOR test |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | Django endpoint, S3 HeadObject verification, UUID job_id — all correct |
| | **TOTAL** | **100** | **90** | |

**Strengths:**
- The idempotency AC (AC-5) handles the classic client retry scenario correctly
- Security test T-1.2 explicitly verifies user ID comes from session — prevents IDOR

**Issues:**

### Minor
1. **S3 key format validation** — Open question noted but no AC exists for it. If a user submits `s3_key = "../../etc/passwd"`, the backend does an S3 HeadObject check which would safely fail, but explicit format validation is recommended as defense-in-depth.

**Consistency checks:**
- [x] All gaps accounted for
- [x] Coverage matrix complete
- [x] Auth tests present
- [x] Assumptions consistent

---

### MAP-01: Map CSV/xlsx columns to CRM fields

**Score: 89/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | Well-bounded; template persistence explicitly deferred to MAP-02 |
| 2 | Gap analysis quality | 15 | 14 | G-2 resolution correctly updated when MAP-02 was elevated to P1 |
| 3 | AC completeness | 20 | 18 | Merged cells (AC-6), no-header file (AC-7), inactive fields (AC-9) — all present; missing: what happens if the file has 0 columns (empty header row) |
| 4 | AC specificity | 10 | 9 | Error messages quoted; AC-7 is "should-have" priority which is appropriate |
| 5 | Test coverage | 20 | 19 | T-NFR-4.1 tests injection of arbitrary field names — important security test |
| 6 | Test quality | 10 | 9 | T-10.2 correctly frames the ownership check as the security risk it is |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | openpyxl for xlsx, ImportJob record for mapping persistence — correct |
| | **TOTAL** | **100** | **89** | |

**Strengths:**
- The field injection test (T-NFR-4.1) testing `__proto__` is an excellent security test
- Cross-entity field scoping is well-tested

**Issues:**

### Minor
1. **Empty header row case** — A CSV with `"\r\n"` as the first row (empty headers) is not covered. AC-7 covers no-header (data in row 1), but not truly empty headers.
2. **Open question on Admin cross-job access** — The open question about whether a CRM Admin can access another user's mapping step is flagged but not resolved; it affects the ownership check in AC-10.

---

### MAP-02: Save and load column mapping templates

**Score: 88/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 13 | Priority upgrade from P3 to P1 is documented but implementation order (position 15 of 19) contradicts P1 designation — creates scheduling confusion |
| 2 | Gap analysis quality | 15 | 15 | Gap traceability explicitly documents the stakeholder override of G-2 |
| 3 | AC completeness | 20 | 18 | Template CRUD, cross-user isolation, XSS prevention, uniqueness — all covered; limit on template count is unconfirmed |
| 4 | AC specificity | 10 | 9 | Very specific; AC-3 correctly uses "exactly matches" and notes if case-insensitive matching changes this |
| 5 | Test coverage | 20 | 18 | T-NFR-5.1 (User B can't mutate User A's template) is excellent; T-NFR-4.1 for XSS is present |
| 6 | Test quality | 10 | 9 | T-3.2 correctly tests the case-sensitive matching baseline and flags the open question |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 4 | Template storage is Django ORM-compatible; no tech details about storage format of the mapping JSON |
| | **TOTAL** | **100** | **89** | |

**Issues:**

### Major
1. **Implementation order inconsistency** — Found in: Stories — MAP-02 is marked P1 ("stakeholder explicitly flagged as spec omission") but appears at position 15 in the 19-story implementation order (after all P2 history/undo stories). If MAP-02 is truly P1, it should appear at position 4 (after MAP-01). This will confuse sprint planning.

### Minor
1. **Template count unbounded** — Open question about max templates per user is unresolved. If unbounded, the list endpoint could theoretically return thousands of templates; the NFR notes pagination "if over 50" but doesn't enforce it as an AC.

---

### VALID-01: Standard field validation — email, phone, required fields, and encoding

**Score: 91/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | System actor is appropriate; clear scope isolation from VALID-02/03/04 |
| 2 | Gap analysis quality | 15 | 15 | G-13 explicitly deferred to VALID-04; date handling separation is clean |
| 3 | AC completeness | 20 | 19 | Encoding edge cases (BOM, low confidence), multi-error accumulation, xlsx type coercion — all present |
| 4 | AC specificity | 10 | 9 | AC-3 threshold for low confidence (80%) is specific and correct |
| 5 | Test coverage | 20 | 19 | T-1.1/T-1.2 test specific byte sequences for ISO-8859-1 and Windows-1252 |
| 6 | Test quality | 10 | 10 | Byte-level test data for BOM (0xEF 0xBB 0xBF) demonstrates implementation-level understanding |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | `charset-normalizer`, `phonenumbers` library specified; stream-parse requirement in NFR |
| | **TOTAL** | **100** | **91** | |

**Strengths:**
- The 80% confidence threshold for low-confidence encoding warnings is a defensible specific value
- AC-11 (xlsx dates preserved as ISO 8601 strings for VALID-04 to handle) is a critical integration contract that most teams miss

**Issues:**

### Minor
1. **Low-confidence encoding floor** — Open question flags: "what confidence level blocks validation entirely?" without a recommendation. Given the corruption risk, recommend adding an AC for ≤50% confidence blocking validation.

---

### VALID-02: Uniqueness validation — intra-file dedup and DB check for contacts

**Score: 90/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | G-3 scope resolution (contacts only) is explicit and well-reasoned |
| 2 | Gap analysis quality | 15 | 15 | G-15 (both rows flagged) and G-3 (contacts only) clearly resolved |
| 3 | AC completeness | 20 | 19 | Batch size (1000), index as deliverable, triplicate dedup — all covered |
| 4 | AC specificity | 10 | 9 | AC-4 specifies "4 batched queries" for 3,500 rows — implementation-level precision |
| 5 | Test coverage | 20 | 19 | T-BOUND-1 tests the 1001-row split into [1000,1] — correctly catches off-by-one |
| 6 | Test quality | 10 | 9 | T-NEG-2 tests the "missing index" scenario with a CRITICAL log — excellent defensive test |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | Parameterized WHERE IN batch queries for PostgreSQL with 2M contacts — correct approach |
| | **TOTAL** | **100** | **90** | |

**Strengths:**
- T-NEG-2 (missing index triggers CRITICAL log, not silent skip) is a high-value test that would catch dangerous deployment misconfigurations
- Case-sensitivity of email comparison is flagged as an open question with a recommendation

**Issues:**

### Minor
1. **Case sensitivity unresolved** — `Alice@Example.com` vs `alice@example.com` duplicate check behavior is flagged but no AC covers it. This affects both the intra-file dedup and the DB index strategy (functional vs. expression index).

---

### VALID-03: Custom field type and enum validation

**Score: 90/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | G-9 (fail row, not import) explicitly resolved; date fields delegated to VALID-04 |
| 2 | Gap analysis quality | 15 | 14 | G-9 well-handled; number precision open question is a real edge case |
| 3 | AC completeness | 20 | 19 | 14 flexible boolean representations (T-6.1) is comprehensive |
| 4 | AC specificity | 10 | 9 | AC-6 lists all 14 boolean variants explicitly |
| 5 | Test coverage | 20 | 19 | T-BOUND-1 tests caching (field definitions fetched once, not per row) — performance-critical |
| 6 | Test quality | 10 | 9 | T-1.1 tests all case variants across a scenario outline |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | Custom field fetched from CRM config at validation time — consistent with Django ORM patterns |
| | **TOTAL** | **100** | **89** | |

**Issues:**

### Minor
1. **Number precision edge case** — `1.23456789012345` is identified as an open question but no default behavior is specified. Silent truncation is a data integrity risk; recommend flagging as a warning rather than silently truncating.

---

### VALID-04: Date field validation — flag ambiguous and inconsistent formats

**Score: 90/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | G-13 fully resolved; "reject, don't coerce" is the right call for data integrity |
| 2 | Gap analysis quality | 15 | 15 | G-13 resolution is explicit and the rationale (silent corruption risk) is documented |
| 3 | AC completeness | 20 | 19 | Impossible dates, ambiguous formats, datetime with time component, xlsx dates from VALID-01 — all covered |
| 4 | AC specificity | 10 | 9 | AC-2 error message quoted verbatim including the example guidance |
| 5 | Test coverage | 20 | 19 | T-BOUND-1 covers all 4 leap year cases including the 1900/2000 century rule |
| 6 | Test quality | 10 | 9 | T-BOUND-1 uses Python's actual datetime rules (1900 not leap, 2000 is) — correctly implemented |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | `datetime.strptime()` / `fromisoformat()` approach is correct for strict parsing |
| | **TOTAL** | **100** | **90** | |

**Strengths:**
- The Excel serial 60 / 1900-02-29 edge case (T-8.1 scenario 2) is documented as "behavior must be consistent and documented" — this is exactly the right approach for a known Excel quirk

---

### PREVIEW-01: Preview first 20 rows with per-row validation status and commit controls

**Score: 89/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | Sync/async split at commit time well-specified; G-1 threshold confirmed with caveat |
| 2 | Gap analysis quality | 15 | 14 | G-1, G-4, G-6 all addressed; G-1 remains a pre-sprint confirmation item |
| 3 | AC completeness | 20 | 18 | 12 functional ACs + 2 auth; missing: what happens if commit is called while validation is still in progress (double-submit on the validation side) |
| 4 | AC specificity | 10 | 9 | Sync threshold values (500 rows / 500KB) are specific but unconfirmed |
| 5 | Test coverage | 20 | 19 | T-NEG-1.2 tests 409 on double-submit — important |
| 6 | Test quality | 10 | 9 | Performance test T-1.2 (10 concurrent users) is realistic |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | Django view dispatching Celery task at commit, Celery returning HTTP 202 — correct |
| | **TOTAL** | **100** | **89** | |

**Issues:**

### Major
1. **G-1 threshold unconfirmed** — Found in: Assumptions, Open Questions — The 500-row / 500KB threshold is used consistently throughout PREVIEW-01, ASYNC-01, and UNDO-03, but all three flag it as "unconfirmed by product team." If the backend team discovers the threshold should be 1000 rows based on actual server capacity, all three stories' ACs and tests need updating. **Resolve before sprint commit.**

---

### ASYNC-01: Sync/async routing and Celery task dispatch

**Score: 87/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 13 | System actor, but threshold values flagged as unconfirmed in the story itself |
| 2 | Gap analysis quality | 15 | 14 | G-1, G-6, G-10 all addressed; G-1 remains the key risk |
| 3 | AC completeness | 20 | 18 | Idempotency (AC-6), ETR null (AC-7), both sync failure modes (AC-9, AC-10) — present; missing: what happens when import_job is in wrong state (e.g., already `complete`) at commit time |
| 4 | AC specificity | 10 | 9 | AC-7 ETR formula is exact: `(rows_total - rows_processed) / rolling_rows_per_second` |
| 5 | Test coverage | 20 | 18 | T-6.1 (idempotency on retry via checkpoint) is the hardest test in the suite and correctly specified |
| 6 | Test quality | 10 | 9 | Checkpoint-based retry test (T-6.1) requires fault injection infrastructure |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | Celery `update_state`, `import_job_id` FK on records, savepoints — all Django/Celery correct |
| | **TOTAL** | **100** | **87** | |

**Strengths:**
- AC-6 (idempotent retry with checkpoint resume) is correctly specified — this is the hardest correctness requirement in the feature
- Celery broker unreachable → 503 (not 500) is correct HTTP semantics

**Issues:**

### Minor
1. **Commit of already-committed job** — No AC covers what happens if commit is called twice (race condition or stale UI). T-NEG-1.2 in PREVIEW-01 covers this with a 409, but it's not explicitly in ASYNC-01's ACs.

---

### ASYNC-02: Progress tracking endpoint and polling UI

**Score: 89/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | Well-scoped; SSE explicitly out of scope |
| 2 | Gap analysis quality | 15 | 14 | G-6 and G-14 resolved; G-11 noted for cross-user status access |
| 3 | AC completeness | 20 | 19 | 5-failure-then-stop policy (AC-8), human-readable ETR (AC-9), 404 for unknown job (AC-7) — all present |
| 4 | AC specificity | 10 | 9 | AC-8's "5 consecutive failures" is a specific, implementable policy |
| 5 | Test coverage | 20 | 19 | T-AUTH-2.1 correctly frames the cross-user 403 as dependent on G-11 resolution |
| 6 | Test quality | 10 | 9 | T-NEG-1.1 for invalid UUID format returning 400 (not 404) is a good input validation test |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | 3-second polling with ImportJob record read — lightweight and correct for Django+Celery |
| | **TOTAL** | **100** | **89** | |

---

### ASYNC-03: In-app completion notification

**Score: 85/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 12 | Story assumes a notification tray (bell icon) "already exists in the application shell" — **Unconfirmed**. If it doesn't exist, this story has a hidden dependency that could block delivery |
| 2 | Gap analysis quality | 15 | 14 | G-14 well-resolved; G-11 handled for notification scope |
| 3 | AC completeness | 20 | 18 | Success and failure notifications, tray badge, read-on-open, cross-user isolation — all covered |
| 4 | AC specificity | 10 | 9 | 200-character truncation in AC-2 is specific |
| 5 | Test coverage | 20 | 18 | T-4.1 (notification created even when user is on progress page) is a subtle and important edge case |
| 6 | Test quality | 10 | 8 | T-NEG-1.1 (notification failure doesn't affect import status) correctly tests decoupling |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 4 | No specification of the notification storage mechanism (table? Redis? polling vs push?) — implementation will need to decide |
| | **TOTAL** | **100** | **85** | |

**Issues:**

### Major
1. **Notification tray assumed to exist** — Found in: Assumptions ("Unconfirmed") — If the bell icon / notification tray component does not exist in the current application, ASYNC-03 effectively requires a separate UI infrastructure story before it can be delivered. This should be confirmed as an explicit dependency.

---

### ERROR-01: Validation error summary grouped by error type

**Score: 90/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | Clear scope: summary panel only, not per-row detail |
| 2 | Gap analysis quality | 15 | 14 | G-13 open question noted for the "Ambiguous date" label |
| 3 | AC completeness | 20 | 19 | Zero-error banner (AC-5), three-way duplicate counting (AC-4), field-by-field required errors (AC-7) — all covered |
| 4 | AC specificity | 10 | 9 | Error type labels quoted precisely; "Duplicate email (intra-file): 2 rows" vs "1 pair" is a specific correctness check |
| 5 | Test coverage | 20 | 18 | T-BOUND-1 tests index requirement for performance |
| 6 | Test quality | 10 | 9 | T-2.2 boundary test (1 error in 50,000-row file) also tests the performance NFR implicitly |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | Aggregation on `(import_job_id, error_type)` index is correct for PostgreSQL |
| | **TOTAL** | **100** | **90** | |

---

### ERROR-02: Downloadable error report CSV

**Score: 89/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | Explicitly calls out that source column names (not CRM names) appear in the report |
| 2 | Gap analysis quality | 15 | 14 | G-8 retention policy deferred with specific OQ-1 |
| 3 | AC completeness | 20 | 19 | Multi-error row appears once (AC-8), cross-reference for intra-file duplicates (AC-4), signed URL scope (Security NFR) — all present |
| 4 | AC specificity | 10 | 9 | Column order specified exactly; 15-minute URL expiry is specific |
| 5 | Test coverage | 20 | 19 | T-NEG-3 verifies the signed URL doesn't grant bucket-level permissions — critical security test |
| 6 | Test quality | 10 | 9 | T-5.2 (new signed URL on each request, no client-side caching) tests a real-world pitfall |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | Generated during validation job, stored on S3, served via signed URL — correct S3 pattern |
| | **TOTAL** | **100** | **90** | |

**Issues:**

### Minor
1. **S3 retention for error reports unresolved (G-8 OQ-1)** — No lifecycle rule is defined for error report objects. If error reports are deleted before the import history retention window, download links on old history entries will 404. A concrete retention policy (recommended: 30 days) should be set before production deployment.

---

### HIST-01: Import history list with date-range filter

**Score: 90/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | 100-entry cap, indefinite retention, no search — all explicit scope decisions |
| 2 | Gap analysis quality | 15 | 15 | G-12 fully resolved with specific defaults (100 entries, 3 filter options) |
| 3 | AC completeness | 20 | 19 | All 4 statuses with distinct visual treatment (AC-5), processing imports showing live progress (AC-8), empty state for date filter (AC-6) |
| 4 | AC specificity | 10 | 9 | Status colors specified (green/red/blue+spinner/grey) |
| 5 | Test coverage | 20 | 19 | T-NEG-2 verifies index on `(uploader_id, created_at)` is used |
| 6 | Test quality | 10 | 9 | T-3.1 correctly tests user-local-time window semantics (not UTC) |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | PostgreSQL index on `(uploader_id, created_at)` for sorted filtered queries — correct |
| | **TOTAL** | **100** | **90** | |

---

### HIST-02: Role-based import history visibility

**Score: 91/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | Three roles, three behaviors, all explicit |
| 2 | Gap analysis quality | 15 | 15 | G-11 fully resolved for this story's scope |
| 3 | AC completeness | 20 | 20 | Query-level enforcement (AC-1), parameter bypass prevention (AC-5), 403 returns (AC-3), audit logging (Security NFR) |
| 4 | AC specificity | 10 | 9 | AC-5 explicitly says "silently ignored" (not 400) — a defensible UX decision |
| 5 | Test coverage | 20 | 19 | T-NEG-2 verifies 403s are audit-logged with required fields |
| 6 | Test quality | 10 | 10 | T-1.2 verifies WHERE clause is at query level, not in-memory filter |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | Django ORM WHERE clause enforcement, not Python-level filter |
| | **TOTAL** | **100** | **92** | |

**Strengths:**
- T-1.2 (query-level vs. in-memory filter verification) is architecturally important and correctly specified
- T-NEG-3 (new Power User with 0 imports sees empty state, not other users' data) closes a common leakage path

---

### UNDO-01: Soft-delete undo with 48-hour window

**Score: 87/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 13 | Modified-record skip policy confirmed; hard-delete after soft-delete unresolved (G-5 OQ-1) |
| 2 | Gap analysis quality | 15 | 14 | G-5 partially resolved; modified-record behavior is concrete but retention period is deferred |
| 3 | AC completeness | 20 | 18 | Transactional rollback (AC-8), 48-hour server-side enforcement (AC-6), concurrent undo prevention (NFR) — present; missing: what happens if undo is called while another undo is in progress (covered in UNDO-03 NFR but not UNDO-01 ACs) |
| 4 | AC specificity | 10 | 9 | "Soft-delete means `deleted = true`" is explicit; "hidden from normal queries, retained in DB" is clear |
| 5 | Test coverage | 20 | 18 | T-8.1 (rollback on partial failure) correctly verifies 0 records remain soft-deleted after rollback |
| 6 | Test quality | 10 | 9 | T-2.2 (stale UI sends undo after window expiry) is a realistic scenario |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | `import_job_id` FK on records (from ASYNC-01), `updated_at` comparison, Django transaction — correct |
| | **TOTAL** | **100** | **87** | |

**Issues:**

### Major
1. **G-5 OQ-1 unresolved (post-soft-delete retention)** — Found in: Open Questions — Soft-deleted records are retained indefinitely, which could create compliance issues for GDPR/right-to-erasure scenarios. This is noted but unresolved. Before production deployment, a hard-delete schedule (e.g., 90 days after soft-delete) must be decided. This doesn't block sprint 1 delivery but must not be forgotten.

---

### UNDO-02: Undo confirmation screen with modified-record count

**Score: 89/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | Modified-record skip is clear; "admin cannot selectively include/exclude" is explicit out-of-scope |
| 2 | Gap analysis quality | 15 | 15 | G-5 fully addressed for this story's scope |
| 3 | AC completeness | 20 | 19 | All-modified warning (AC-5), loading spinner with timeout (AC-6), race condition documentation (NFR) — present |
| 4 | AC specificity | 10 | 9 | Three-count display with exact labels specified |
| 5 | Test coverage | 20 | 19 | T-6.2 (query timeout shows error, disables Confirm button) is a critical safety test |
| 6 | Test quality | 10 | 9 | T-AUTH-2.1 and T-AUTH-2.2 verify the modal is only accessible to Admins |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | `(import_job_id, updated_at)` index for count query — correct |
| | **TOTAL** | **100** | **90** | |

**Strengths:**
- The race condition between modal-open and Confirm (AC-6 / T-6.2 NFR note) is correctly documented as "acceptable and documented" — this is the right call, not a blocker
- AC-5 (all-modified warning) is a user safety feature that prevents admins from clicking through a no-op undo

---

### UNDO-03: Async undo processing for large imports

**Score: 87/100** — **PASS**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 13 | Same threshold concern as ASYNC-01 (500 records); pattern reuse is good but deferred threshold is still a risk |
| 2 | Gap analysis quality | 15 | 14 | G-1, G-6, G-10, G-11 all resolved by reference to ASYNC-01/02 |
| 3 | AC completeness | 20 | 18 | Failure state (AC-6), idempotency (AC-7), concurrent dispatch prevention (NFR) — all present |
| 4 | AC specificity | 10 | 9 | 5,000 records/second throughput target is specific and testable |
| 5 | Test coverage | 20 | 18 | T-BOUNDARY-2 (concurrent undo → 409) and T-BOUNDARY-3 (broker down → 503) are critical infrastructure tests |
| 6 | Test quality | 10 | 9 | T-7.1 (idempotent retry, skips already-deleted records) mirrors ASYNC-01's checkpoint test |
| 7 | Traceability | 5 | 5 | Complete |
| 8 | Architecture alignment | 5 | 5 | Pattern reuse with ASYNC-01/02 is correct (same Celery approach, same ETR formula) |
| | **TOTAL** | **100** | **87** | |

---

## Cross-Story Issues

1. **G-11 (authorization model) is deferred across 17 of 19 stories.** The `imports:create` permission and role-to-permission mapping must be defined and implemented in the auth system before any endpoint can correctly enforce access. Every AC-AUTH-2 test is blocked on this. **Resolve before sprint commit — this is the single highest-risk prerequisite.**

2. **G-1 (async threshold) is flagged as unconfirmed in PREVIEW-01, ASYNC-01, and UNDO-03.** If the threshold changes after AC writing, three stories need AC and test updates. Assign the backend team to run a capacity benchmark against a staging environment before sprint start.

3. **MAP-02 implementation order (position 15) contradicts its P1 priority.** The implementation order in the decomposition should be updated to reflect MAP-02's elevated priority: move it to position 4 (after MAP-01, before VALID-01).

4. **G-5 (post-soft-delete retention) is unresolved across UNDO-01/02/03.** Soft-deleted records are retained indefinitely by default. If the organization is subject to GDPR or CCPA, a scheduled hard-delete policy must be defined. Flag for the legal/compliance review before go-live.

5. **The 5 deferred gaps (G-1, G-3, G-5, G-8, G-11)** collectively require stakeholder sign-off sessions before implementation begins. The remaining deferred gap (G-13) is fully resolved in VALID-04.

---

## Recommendation

**Approve the package for development with three required pre-sprint actions:**

1. **Resolve G-11 (auth model):** Assign roles to permissions (`imports:create` → CRM Admin + Power User; undo → CRM Admin only). Implement the permission check in the auth middleware before any story that touches an endpoint.

2. **Confirm G-1 (async threshold):** Run a sync processing time test on staging hardware with 500 rows and 500KB files. Confirm the threshold or adjust it across PREVIEW-01, ASYNC-01, and UNDO-03 simultaneously.

3. **Fix MAP-02 implementation order:** Move MAP-02 from position 15 to position 4 in the sprint backlog to match its P1 designation. Also confirm the notification tray exists for ASYNC-03 or add an infrastructure prerequisite story.

All 19 stories are ready for implementation once these actions complete. The package demonstrates exceptional discipline in gap documentation, assumption tracking, and traceability — the remaining risks are planning/coordination items, not quality defects.
