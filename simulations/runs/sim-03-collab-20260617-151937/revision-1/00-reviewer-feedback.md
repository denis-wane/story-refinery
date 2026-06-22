# Quality Review

## Summary
- **Stories reviewed:** 29 (INFRA-001/002, RTE-001–006, SYNC-001/002, PRES-001/002, CONF-001/002, OFFLINE-001/002, VH-001–003, COMM-001/002, SUGG-001/002, PERM-001–003, TMPL-001–003, EXP-001–003)
- **Passed (80+):** 0
- **Needs revision:** 0
- **Blocked:** 29
- **Overall quality:** Pipeline failure. The upstream AC Writer and Test Generator both timed out on all attempts. Zero acceptance criteria and zero test specifications were produced. Stories and gap analysis are high quality but represent incomplete deliverables — no story package is implementable without AC, and none are verifiable without tests. Every story receives BLOCK under the Critical Blocker Override.

---

## Systemic Blocker — Applies to All 29 Stories

**BLOCK: AC Writer and Test Generator produced no output.**

The AC Coverage Digest explicitly states: *"The Full Acceptance Criteria section of the input contains only timeout errors — the AC Writer failed all 6 attempts across 3 retry batches and produced zero AC output."* The Test Coverage Digest confirms the same for the test generator.

This is not a quality gap that can be scored around. Under the Critical Blocker Override:
1. Verdict **MUST** be **BLOCK**
2. Score **MUST** be **below 50**
3. AC Completeness and Story Clarity scores are reduced to reflect that artifacts are provisional/unimplementable

Categories 3, 4, 5, and 6 (AC Completeness, AC Specificity, Test Coverage, Test Quality — 60 points total) score **0** uniformly. Traceability scores **1** (story→gap chain exists; AC→test chain does not). This caps the possible score at 40 before any per-story deductions.

---

## Per-Story Review

Because the blocker (missing AC + tests) is **identical across all 29 stories**, I score each story on the three evaluable dimensions — Story Clarity, Gap Analysis Quality, and Architecture Alignment — and record the forced-zero dimensions uniformly. Stories are grouped by feature for readability; any story-specific clarity or scope issues are called out individually.

---

### INFRA-001: Yjs Collaboration Service Bootstrapping

**Score: 34/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 13 | Role (platform engineer), capability, and benefit are clear. Scope in/out is explicit. Minor: "trusts existing app JWT" is an assumption, not a decision — should reference PERM-001. |
| 2 | Gap Analysis quality | 15 | 14 | G-1, G-2, G-5 all trace to this story with correct resolution status. All directly relevant gaps identified. |
| 3 | AC completeness | 20 | 0 | Not produced. |
| 4 | AC specificity | 10 | 0 | Not produced. |
| 5 | Test coverage | 20 | 0 | Not produced. |
| 6 | Test quality | 10 | 0 | Not produced. |
| 7 | Traceability | 5 | 1 | Story→gap chain visible. AC→test chain absent. |
| 8 | Architecture alignment | 5 | 5 | Node.js, `y-websocket`, JWT, health check — all architecturally grounded. No misalignment. |
| | **TOTAL** | **100** | **33** | |

**Strengths:** Scope boundary is unusually precise — explicitly excludes presence, persistence, and multi-instance scaling, which correctly stages the work. The "trusts existing JWT" assumption is flagged, not buried.

**Issues:**

### Critical (blocks implementation)
1. **No acceptance criteria produced** — Found in: AC — Without Given/When/Then scenarios, "room creation/teardown on connect/disconnect" and "JWT validation" have no testable specification. A developer cannot determine what "room teardown" means (does the state persist? is it garbage-collected immediately?).
2. **No test specifications produced** — Found in: tests — No verification strategy for the 500ms p95 target exists anywhere in this package.

### Major
1. **JWT validation scope ambiguity** — Found in: story — The story says "trusts existing app JWT" but doesn't specify: what claims are read, what constitutes a rejected token, or what the server sends on rejection. This is AC-level content that belongs in the story scope until AC is written.

---

### INFRA-002: Document Persistence and Yjs State Storage

**Score: 33/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 12 | Clear. "Debounced" change persistence is mentioned but no debounce interval specified — this is an AC-level decision missing from scope. |
| 2 | Gap Analysis quality | 15 | 14 | G-3 (media storage model) correctly assumed here. G-4 (max doc size) is acknowledged as deferred — appropriate. |
| 3 | AC completeness | 20 | 0 | Not produced. |
| 4 | AC specificity | 10 | 0 | Not produced. |
| 5 | Test coverage | 20 | 0 | Not produced. |
| 6 | Test quality | 10 | 0 | Not produced. |
| 7 | Traceability | 5 | 1 | |
| 8 | Architecture alignment | 5 | 5 | S3-compatible blob store, relational DB for metadata — architecturally appropriate and internally consistent. |
| | **TOTAL** | **100** | **32** | |

---

### RTE-001: Core Inline Formatting and Block Structure

**Score: 34/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | Excellent scope definition. The "H1–H4" heading range is specific. Shortcut keys named. Paste sanitization called out. |
| 2 | Gap Analysis quality | 15 | 13 | G-13 (browser support matrix) is referenced implicitly but not called out as a dependency — this story's scope is meaningless without knowing the target browser set. |
| 3 | AC completeness | 20 | 0 | Not produced. |
| 4 | AC specificity | 10 | 0 | Not produced. |
| 5 | Test coverage | 20 | 0 | Not produced. |
| 6 | Test quality | 10 | 0 | Not produced. |
| 7 | Traceability | 5 | 1 | |
| 8 | Architecture alignment | 5 | 5 | ProseMirror/Tiptap explicitly named. Cmd+B/Cmd+I/Cmd+U shortcuts are standard for the named stack. |
| | **TOTAL** | **100** | **33** | |

**Major issue:** G-13 (browser/device support matrix) is Deferred in the gap analysis but RTE-001 is P1. If Safari/iOS compatibility requirements differ, the ProseMirror integration approach may need to change. This dependency should be explicit in the story.

---

### RTE-002 through RTE-006 (Bulk — scope notes only)

**Score: 32–33/100 each** — **BLOCK**

All score identically on the evaluable dimensions (Story Clarity: 12–13, Gap Analysis: 13, Architecture Alignment: 5). Individual notes:

- **RTE-002 (Lists):** Clean. Tab/Shift+Tab nesting behavior should specify depth limit in AC (ProseMirror has a default; it should be explicit).
- **RTE-003 (Code blocks):** "Language selector (display-only — no syntax highlighting at launch)" is a good scope fence. The `inline code span is included` note in scope is easy to miss — should be a first-class scope item.
- **RTE-004 (Tables):** Cell merging exclusion is explicit. "Basic cell text content (inline formatting within cells)" — does this include images? Unclear. AC-level ambiguity.
- **RTE-005 (Images):** 10MB single-image limit is specific and good. Resize behavior needs AC (does resize update the stored asset or just display scaling?).
- **RTE-006 (Hyperlinks):** "Auto-linkify pasted URLs" needs AC specifying whether it fires immediately or on paste-confirm. Opinionated behavior that affects UX.

---

### SYNC-001: Two-Client Real-Time Edit Propagation

**Score: 35/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | 500ms p95 target is explicit. Technology choices (y-websocket, y-prosemirror) are specific. "Two-client smoke-test" acceptance criterion is visible in scope, which is good. |
| 2 | Gap Analysis quality | 15 | 14 | G-1 (CRDT/OT choice) resolved here as Yjs. G-4 (max doc size) deferred to SYNC-002 — appropriate phasing. |
| 3 | AC completeness | 20 | 0 | |
| 4 | AC specificity | 10 | 0 | |
| 5 | Test coverage | 20 | 0 | |
| 6 | Test quality | 10 | 0 | |
| 7 | Traceability | 5 | 1 | |
| 8 | Architecture alignment | 5 | 5 | |
| | **TOTAL** | **100** | **34** | |

**Major issue:** The 500ms p95 target is declared but G-4 (max document size) is still deferred. The SLA depends on document size. Without an upper bound, p95 cannot be validated. This should be called out as a hard blocker for SYNC-001, not just "deferred to SYNC-002."

---

### SYNC-002: Multi-Client Sync at Scale

**Score: 35/100** — **BLOCK**

Strongest story in the sync feature — 5MB document ceiling is specific, load-test harness is in scope, p95/p99 targets are dual-listed. Architecture alignment is excellent. Same mandatory zeros on AC and tests.

---

### PRES-001: Live Remote Cursors

**Score: 34/100** — **BLOCK**

50ms throttle interval is a specific, measurable implementation requirement — this belongs in AC but is correctly captured in story scope. Color derivation from user ID hash should specify the algorithm or delegate to AC.

---

### PRES-002: Active Viewers Panel

**Score: 33/100** — **BLOCK**

"Max 8 avatars with +N overflow" is well-specified. The "+N more" overflow behavior needs AC: does clicking "+N more" open a full list? What's the sort order of the 8 displayed?

---

### CONF-001: Automatic Merge of Non-Overlapping Edits

**Score: 34/100** — **BLOCK**

This story is correctly scoped as a test-coverage story (Yjs handles the behavior natively). The "≥ 5 concurrent-edit scenarios" is a concrete acceptance signal. It will be difficult to write AC for a story that is fundamentally a test specification — this may need to be restructured as a test story rather than an AC story.

---

### CONF-002: Last-Writer-Wins with Local Undo

**Score: 34/100** — **BLOCK**

"Undo history cleared on disconnect/reconnect (ephemeral)" is an important edge case — this needs explicit AC. Users expect undo to survive a brief network interruption (e.g., a 2-second blip). This policy should be confirmed with stakeholders before AC is written.

---

### OFFLINE-001: Local Edit Queue While Disconnected

**Score: 34/100** — **BLOCK**

`y-indexeddb` provider named explicitly. "Offline banner displayed in editor header" is a UI requirement that needs AC on dismissibility and recurrence.

---

### OFFLINE-002: Merge-on-Reconnect

**Score: 35/100** — **BLOCK**

Banner copy is specified directly in the story scope — "Your offline edits were merged. [N] changes may have been overwritten — view version history to recover." This is good pre-emption of an AC-level question. The "N = count of same-range LWW resolutions" calculation needs AC on what exactly counts as a "resolution" (every character or every contiguous range?).

---

### VH-001: Automatic 5-Minute Snapshots

**Score: 35/100** — **BLOCK**

90-day rolling window and 500-snapshot cap from G-9 are correctly baked in. "Named versions do not count toward the 500-snapshot cap" is an important nuance. Storage quota counting needs AC: is it counted against tenant quota at snapshot time or recalculated on read?

---

### VH-002: Named Manual Version Saves

**Score: 34/100** — **BLOCK**

"Named versions retained indefinitely until explicitly deleted by owner" is clear. Deletion permission rule (creator or document owner) is specific.

---

### VH-003: Version History Browser and Document Restore

**Score: 34/100** — **BLOCK**

"Restore creates a new auto-snapshot of the current state first" is excellent — this prevents data loss on restore. The L-size estimate is justified given the preview + restore workflow complexity.

---

### COMM-001: Inline Comments on Text Selections

**Score: 34/100** — **BLOCK**

Yjs relative positions for anchor movement is architecturally correct and specific. The `mentions` JSON field reservation for @mention follow-on is good forward-compatible design.

---

### COMM-002: Comment Threads, Resolution, and Archived View

**Score: 33/100** — **BLOCK**

"Flat thread, no nested replies" is an explicit scope fence. "Show resolved" toggle behavior needs AC: is the toggle per-session or persisted? Does it show inline or in a panel?

---

### SUGG-001: Suggestion Mode (Track Changes)

**Score: 33/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 11 | Green/red visual encoding is specified. "The underlying document content is not committed until a suggestion is accepted" is the key semantic rule — but what happens to the Yjs document state if the suggestion is never accepted and the author disconnects? This is an unresolved state management question. |
| 2 | Gap Analysis quality | 15 | 13 | G-8 (suggestion acceptance) resolved correctly. |
| 3–6 | AC + Test categories | 60 | 0 | |
| 7 | Traceability | 5 | 1 | |
| 8 | Architecture alignment | 5 | 4 | "Stored as Yjs marks with author metadata" — this is architecturally reasonable for Tiptap but needs validation. Yjs marks with custom attributes have documented limitations in y-prosemirror. |
| | **TOTAL** | **100** | **29** | |

**Critical issue:** Suggestion state persistence is undefined. If a user leaves suggestions and goes offline, then the document owner restores from a version snapshot — what happens to in-flight suggestions? This interaction between SUGG-001 and VH-003 is unaddressed.

---

### SUGG-002: Accept and Reject Suggestions

**Score: 33/100** — **BLOCK**

"Accepted/rejected suggestions logged to version history as a note on the next auto-snapshot" — this logging mechanism is informal and may be lost if no auto-snapshot fires in the next 5 minutes. If a user accepts 20 suggestions and the service restarts before the next snapshot, the accept/reject log is gone. Needs AC to define durability.

---

### PERM-001: Per-Document ACL Data Model

**Score: 35/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 14 | Schema is specified (`document_acl` table with exact column names and types). Role precedence rule ("most permissive explicit grant") is stated. |
| 2 | Gap Analysis quality | 15 | 14 | G-5 (permissions model integration) resolved here. Okta group resolution at request time is specified. |
| 3–6 | AC + Test categories | 60 | 0 | |
| 7 | Traceability | 5 | 1 | |
| 8 | Architecture alignment | 5 | 5 | |
| | **TOTAL** | **100** | **34** | |

**Major issue:** "Role precedence: most permissive explicit grant applies when multiple grants exist" — this means if a user is granted View via one Okta group and Edit via another, they get Edit. This may be a security decision, not an engineering default. It needs stakeholder sign-off and should be flagged as an assumption, not a design choice.

---

### PERM-002: Document Permission Management UI

**Score: 33/100** — **BLOCK**

"Document owner always retains edit access (cannot be revoked from the dialog)" is correctly specified. The "project-level inherited role shown as context" is good UX — needs AC on what happens if a user's effective role via project membership is higher than their explicit grant (does the dialog show both?).

---

### PERM-003: Permission Enforcement in Editor, API, and WebSocket

**Score: 34/100** — **BLOCK**

"WebSocket service rejects operation broadcasts from view-only clients with an error message" — what is the error message? What does the client do on receiving it? This is an AC-level question with security implications (silent rejection vs. visible error).

---

### TMPL-001 through TMPL-003 (Templates)

**Score: 32–33/100 each** — **BLOCK**

All are P3 and lower-complexity. Individual notes:
- **TMPL-001:** "Updating or unpublishing a template does not affect documents already created from it" — copy-at-instantiation model is correctly specified per G-11.
- **TMPL-002:** Correctly defers sharing and workspace-promotion flows.
- **TMPL-003:** "Template placeholder text is just regular editable content" — this is a simplification that will disappoint users. Deferred placeholder highlighting is correctly noted but should be a future story reference.

---

### EXP-001: Export to Markdown

**Score: 34/100** — **BLOCK**

`<u>` HTML tag for underline in Markdown is technically correct (underline has no Markdown equivalent) but may cause rendering issues in some Markdown parsers. This should be called out as a known fidelity limitation.

---

### EXP-002: Export to PDF

**Score: 34/100** — **BLOCK**

Headless Chromium via Puppeteer is architecturally sound. 60-second timeout with explicit error is good. A4 default is fine. Missing: AC for what happens to suggestion marks in PDF export (are they rendered as green/red text, or stripped?).

---

### EXP-003: Export to DOCX

**Score: 33/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 11 | Pandoc via Markdown intermediate is a pragmatic choice with known fidelity limitations. The warning note for stripped suggestions is good. However: table rendering fidelity in Pandoc→DOCX is notoriously lossy for complex tables. This risk is not called out. |
| 2 | Gap Analysis quality | 15 | 13 | No specific gap covers export fidelity — the technical considerations section does, but it wasn't surfaced as a numbered gap with a resolution status. |
| 3–6 | AC + Test categories | 60 | 0 | |
| 7 | Traceability | 5 | 1 | |
| 8 | Architecture alignment | 5 | 4 | Pandoc is appropriate but the Markdown→DOCX pipeline will not preserve RTE-005 image resize attributes. |
| | **TOTAL** | **100** | **29** | |

---

## Cross-Story Issues

1. **AC Writer timeout root cause not investigated.** The pipeline failure is reported as "batch too large" or "token limit." With 29 stories, batching is unavoidable — but the batch sizing strategy must be fixed before any review of AC quality is possible. Until resolved, all 29 stories are blocked.

2. **G-1 and G-2 (CRDT/OT framework and WebSocket infrastructure) are marked Deferred in the gap table but resolved by assumption in the stories.** INFRA-001 adopts Yjs and a dedicated WebSocket service. This is the right call, but the gap table status should be updated from "Deferred" to "Assumed: Yjs + dedicated service" to prevent confusion downstream.

3. **G-4 (max document size) is deferred but SYNC-001 is P1.** SYNC-001 cannot be accepted without knowing whether the 500ms p95 target is validated at what document size. This is a sequencing contradiction: SYNC-002 validates at scale, but SYNC-001's acceptance criteria are incomplete without a minimum size bound.

4. **G-5 (permissions model integration) is marked "Deferred: requires audit of existing permissions model" in the gap table, but PERM-001 specifies schema details (Okta groups, role precedence).** The Okta group assumption is architecturally significant — if the existing permissions model uses LDAP or a different directory service, PERM-001's schema is wrong. This assumption must be validated before PERM-001 is written.

5. **G-10 (offline conflict granularity for long-divergence) is Deferred, but OFFLINE-002 ships with a specific policy (silent LWW with banner).** This is the right pragmatic default, but the gap status should be updated to "Assumed" with the specific policy documented, not left as "Deferred."

6. **No story covers the collaboration service deployment and infrastructure.** INFRA-001 specifies the service behavior but not the deployment model (container, cloud service, managed solution like Liveblocks). This is an implicit assumption that will surface during sprint planning.

7. **Suggestion state + version history interaction is unresolved.** SUGG-001 and VH-003 both manipulate document state but their interaction on restore is not specified. If a restore happens while suggestions are in flight, the outcome is undefined.

---

## Recommendation

**Do not proceed to implementation. All 29 stories are BLOCKED.**

The blocking cause is a pipeline failure, not a design failure. The stories and gap analysis are genuinely high quality — well-scoped, architecturally grounded, and consistent with the requirements. The decomposer and analyst produced deliverables that would pass review if AC and tests were present.

**Required actions before re-review:**

1. **Fix the AC Writer timeout.** Process stories one at a time through the AC writer. Each story should be a separate call. The full 29-story batch is too large.

2. **Resolve gap table inconsistencies** (G-1, G-2, G-5, G-10): Update from "Deferred" to "Assumed" where stories have already committed to a design. Deferred gaps with P1 dependent stories (G-4, G-5, G-13) must be escalated to product and stakeholders before those stories can be estimated.

3. **Stakeholder validation required on assumptions** G-3, G-6, G-7, G-8, G-9, G-11, G-14 before development begins — the story quality is contingent on these holding.

4. **Address the PERM-001 Okta assumption explicitly.** Confirm the existing permissions infrastructure uses Okta before the ACL schema is designed against it.

**To Story Analyst:** Update the gap table to reflect that G-1, G-2 are now resolved by adoption (Yjs, dedicated WebSocket service) in INFRA-001. Flag G-5 as partially resolved — the schema is designed for Okta, but this is an assumption that must be confirmed. Add G-15: Collaboration service deployment model (container vs managed vs self-hosted) — not addressed anywhere in the package. Add G-16: Suggestion state behavior on version restore (SUGG-001 + VH-003 interaction).

**To AC Writer:** Process one story per call. Start with the P1 stories in dependency order: INFRA-001 → INFRA-002 → PERM-001 → RTE-001 → SYNC-001 → PERM-002 → PERM-003. Each call should produce complete Given/When/Then scenarios for one story before moving to the next. Do not batch.

**To Test Generator:** Same batching guidance. One story per call. Wait for AC to be complete for a story before generating tests for it. CONF-001 is a special case — it is already scoped as a test-coverage story and may need to be structured as a test specification directly rather than AC→test.
