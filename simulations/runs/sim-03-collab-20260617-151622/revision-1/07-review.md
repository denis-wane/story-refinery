# Quality Review

## Summary
- **Stories reviewed:** 30 (2 infra + 28 feature), reviewed in full as a package
- **Passed (80+):** 0
- **Needs revision:** 0
- **Blocked:** 30
- **Overall quality:** The story decomposition and gap analysis are exceptional — among the best produced by this pipeline. However, both the AC Writer and Test Generator failed completely across all invocations. Zero acceptance criteria and zero test specifications exist. Every story in this package receives BLOCK. The pipeline infrastructure failure is the dominant issue; the underlying story quality is not the problem.

---

## Critical System-Level Blocker

**AC Writer failure:** 24 consecutive invocations timed out. Zero AC produced across all 30 stories.
**Test Generator failure:** Locked to wrong working directory; zero test specifications produced.

Per the Critical Blocker Override rule: when an unresolved blocking issue exists, the verdict **MUST be BLOCK** and the score **MUST be below 50**. No exceptions. This applies to all 30 stories.

The per-story scores below apply this override consistently: Story Clarity is reduced from its earned value to reflect that stories without AC cannot be confirmed as correctly scoped or unambiguous, and AC Completeness/Test Coverage/Traceability are zeroed.

---

## Per-Story Review

> **Scoring note applied uniformly:** Story Clarity is scored at 60% of its standalone value (per blocker override — provisional/unimplementable without AC). Gap Analysis Quality reflects the shared analyst output. AC, Test, and Traceability categories are 0 across all stories. Architecture Alignment is scored on story content alone.

---

### INFRA-WS: Stand up dedicated WebSocket service

**Score: 27/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 8 | Role, capability, benefit clear; scope boundary (in/out) explicitly defined. Reduced per blocker override. |
| 2 | Gap analysis quality | 15 | 14 | G-2 resolved with concrete decision (dedicated Node service). Rationale given. One minor gap: deployment target still listed as pre-dev action item. |
| 3 | AC completeness | 20 | 0 | No AC produced. |
| 4 | AC specificity | 10 | 0 | No AC produced. |
| 5 | Test coverage | 20 | 0 | No tests produced. |
| 6 | Test quality | 10 | 0 | No tests produced. |
| 7 | Traceability | 5 | 0 | No chain exists. |
| 8 | Architecture alignment | 5 | 5 | Dedicated Node WebSocket service is the correct architectural choice given Lambda's stateless constraint. Yjs ecosystem compatibility noted. |
| | **TOTAL** | **100** | **27/100** | |

**Strengths:**
- Explicit in/out scope boundary prevents scope creep into SYNC-001
- Auth/token validation on connect correctly scoped as a responsibility of this story, not PERM-003
- "No other story is unblocked without it" correctly identifies critical path position

**Issues:**

### Critical (blocks implementation)
1. **No acceptance criteria** — Found in: AC — Cannot be estimated, implemented, or tested without AC. What does a passing WebSocket connection look like? What error responses are expected on auth failure? What are the connection lifecycle states?
2. **No test specifications** — Found in: tests — Load testing, connection drop behavior, token expiry mid-session are all untested assumptions.

**Consistency checks:**
- [ ] Story statement in AC matches original intent — N/A (no AC)
- [ ] All analyst-identified gaps are addressed in AC — N/A (no AC)
- [ ] All AC map to at least one test case — N/A
- [ ] All test cases trace back to an AC — N/A
- [ ] Assumptions are consistent across all documents — Cannot verify
- [ ] Dependencies are consistent across all documents — Story dependency (None) is correct
- [ ] Authorization tests (401/403) are present — No

**Feedback for revision:**
- **To AC Writer:** Write AC for: successful WebSocket handshake with valid JWT, rejection with 401 on invalid/expired token, connection lifecycle (connect → active → graceful close → forced disconnect), reconnection behavior, concurrent connection limits if any.
- **To Test Generator:** Write tests for: valid/invalid token scenarios, connection establishment timing, forced disconnect on token expiry, concurrent connection count.

---

### INFRA-YJS: Integrate Yjs CRDT library and shared document model

**Score: 27/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 8 | Clear. "Review Marcus's PoC" is a valuable concrete instruction. Reduced per blocker override. |
| 2 | Gap analysis quality | 15 | 14 | G-1 resolved (Yjs chosen). Technical considerations section makes the decision rationale clear. |
| 3 | AC completeness | 20 | 0 | No AC produced. |
| 4 | AC specificity | 10 | 0 | No AC produced. |
| 5 | Test coverage | 20 | 0 | No tests produced. |
| 6 | Test quality | 10 | 0 | No tests produced. |
| 7 | Traceability | 5 | 0 | No chain exists. |
| 8 | Architecture alignment | 5 | 5 | y-websocket provider on server is the correct Yjs server integration. Awareness protocol bootstrap is correctly sequenced before dependent stories. |
| | **TOTAL** | **100** | **27/100** | |

**Strengths:**
- Bootstrapping awareness protocol here (not in PRES-001) is correct — presence features cannot function without it
- Explicit note to reuse Marcus's PoC shows good engineering judgment

**Issues:**

### Critical (blocks implementation)
1. **No AC defining what "Yjs wired in" means** — Found in: AC — Is acceptance a Y.Doc that persists across server restarts? That two clients can sync a basic insert? That the awareness protocol fires on join? Without AC, INFRA-YJS has no definition of done.

**Feedback for revision:**
- **To AC Writer:** AC should include: Y.Doc initialized per document ID on server, y-websocket provider accepting connections, basic insert by Client A visible to Client B within 2 seconds (smoke test), awareness protocol fires presence join/leave events, Y.Doc state survives server process restart (if persistence is in scope here vs. SYNC-001).

---

### RTE-001: Inline text formatting

**Score: 27/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 9 | Specific formatting types listed. Keyboard shortcuts mentioned. Yjs binding via y-prosemirror/Tiptap specified. Reduced per blocker override. |
| 2 | Gap analysis quality | 15 | 12 | G-12 resolved (H1–H3 confirmed). Inline code vs. fenced code distinction noted as a confirmation needed during acceptance. Minor gap: Tiptap vs. y-prosemirror choice not yet resolved. |
| 3 | AC completeness | 20 | 0 | No AC produced. |
| 4 | AC specificity | 10 | 0 | No AC produced. |
| 5 | Test coverage | 20 | 0 | No tests produced. |
| 6 | Test quality | 10 | 0 | No tests produced. |
| 7 | Traceability | 5 | 0 | No chain exists. |
| 8 | Architecture alignment | 5 | 5 | Yjs binding via ProseMirror or Tiptap is the industry-standard approach. Correctly scoped as the foundation for all other RTE stories. |
| | **TOTAL** | **100** | **27/100** | |

**Feedback for revision:**
- **To AC Writer:** AC must cover: each formatting mark individually (bold, italic, underline, inline code), keyboard shortcuts (Ctrl/Cmd+B, I, U), toolbar toggle, toggle-off behavior, formatting persistence in Yjs document model (survives page reload), formatting across selection boundaries, nested formatting (bold+italic simultaneously).

---

### PERM-001: Per-document role assignment

**Score: 26/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 8 | Role, capability, benefit defined. G-5 noted as requiring platform team review — this is a residual pre-dev action, not a full resolution. Reduced per blocker override. |
| 2 | Gap analysis quality | 15 | 13 | G-5 marked as resolved but the dependency on platform team review is still listed as a pre-dev action. The gap is partially resolved (additive model chosen) but integration details are not confirmed. |
| 3 | AC completeness | 20 | 0 | No AC produced. |
| 4 | AC specificity | 10 | 0 | No AC produced. |
| 5 | Test coverage | 20 | 0 | No tests produced. |
| 6 | Test quality | 10 | 0 | No tests produced. |
| 7 | Traceability | 5 | 0 | No chain exists. |
| 8 | Architecture alignment | 5 | 5 | Per-user, per-document role model is the correct approach. Project membership prerequisite correctly identified. |
| | **TOTAL** | **100** | **26/100** | |

**Issues:**

### Critical (blocks implementation)
1. **G-5 not fully resolved** — Found in: gap analysis/story — "Platform team review of integration boundary required per G-5 resolution" is still listed as a story dependency. The Gap Analysis marks G-5 as resolved with "additive, project-membership prerequisite" but the story itself acknowledges this hasn't been validated with the platform team. This is a genuine pre-development blocker, not just an AC writing failure.

### Major (should fix before implementation)
1. **Permission enforcement scope unclear** — The story says "permission checks enforced on document load and API calls" but doesn't specify: what happens when a user is mid-session and their permission is downgraded? Does the API return 403 immediately on the next call, or is there a cache TTL? PERM-003 handles WebSocket — but what about REST API calls?

**Feedback for revision:**
- **To AC Writer:** AC must cover: assign each role to a project member, verify role enforcement (view-only cannot edit, can-comment cannot edit, can-edit can edit), permission check on document load (GET /documents/:id returns 403 for non-members), permission check on edit attempt (returns 403 for view-only), permission assignment visible in settings panel immediately, permission change takes effect on next API call.
- **To Story Analyst:** Confirm with platform team whether G-5 integration boundary is truly resolved before this story is estimated.

---

### SYNC-001: Real-time edit propagation to connected clients

**Score: 27/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 9 | 500ms SLA, single-region scope, debounced persistence all specified. Reduced per blocker override. |
| 2 | Gap analysis quality | 15 | 14 | G-2 and G-15 both resolved here. G-4 (max document size) noted as affecting SLA — acknowledged but deferred appropriately. |
| 3 | AC completeness | 20 | 0 | No AC produced. |
| 4 | AC specificity | 10 | 0 | No AC produced. |
| 5 | Test coverage | 20 | 0 | No tests produced. |
| 6 | Test quality | 10 | 0 | No tests produced. |
| 7 | Traceability | 5 | 0 | No chain exists. |
| 8 | Architecture alignment | 5 | 5 | CRDT client-side merge with server as relay is architecturally correct for Yjs. Debounced persistence is the right call for performance. |
| | **TOTAL** | **100** | **27/100** | |

**Feedback for revision:**
- **To AC Writer:** This is the highest-leverage story for AC. Must cover: edit by User A appears on User B's screen within 500ms (measured from keystroke to render), concurrent edits to different positions both preserved, server persists document state within debounce window, permission-revoked user stops receiving updates (overlaps with PERM-003), WebSocket reconnect does not duplicate ops, server does not broadcast to user without current valid access.

---

### PRES-002: Remote cursor and selection display

**Score: 26/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 8 | Stable color assignment behavior (persisted in user profile) is well-specified. Reduced per blocker override. |
| 2 | Gap analysis quality | 15 | 13 | G-13 resolved (persistent random per user). View-only cursor behavior correctly scoped (view-only sees others' cursors but isn't broadcast). |
| 3 | AC completeness | 20 | 0 | No AC produced. |
| 4 | AC specificity | 10 | 0 | No AC produced. |
| 5 | Test coverage | 20 | 0 | No tests produced. |
| 6 | Test quality | 10 | 0 | No tests produced. |
| 7 | Traceability | 5 | 0 | No chain exists. |
| 8 | Architecture alignment | 5 | 5 | Yjs awareness protocol is the correct mechanism. Color stored in user profile (not session) is the right model for stability. |
| | **TOTAL** | **100** | **26/100** | |

**Feedback for revision:**
- **To AC Writer:** AC must cover: cursor position updates visible to other editors within 2 seconds, cursor labeled with user name, cursor color is consistent across sessions for same user, selection highlight visible when user has text selected, cursor disappears when user disconnects, view-only users see others' cursors but are not broadcast as having a cursor.

---

### CONF-001: Automatic CRDT merge for concurrent edits

**Score: 27/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 9 | The note that "last-writer-wins requirement dropped per stakeholder" is a significant scope change from the original requirements — correctly documented. Reduced per blocker override. |
| 2 | Gap analysis quality | 15 | 14 | Excellent handling of the LWW-vs-CRDT tension. The note that this story is primarily test validation (not new logic) is accurate and prevents over-engineering. |
| 3 | AC completeness | 20 | 0 | No AC produced. |
| 4 | AC specificity | 10 | 0 | No AC produced. |
| 5 | Test coverage | 20 | 0 | No tests produced. |
| 6 | Test quality | 10 | 0 | No tests produced. |
| 7 | Traceability | 5 | 0 | No chain exists. |
| 8 | Architecture alignment | 5 | 5 | Yjs positional merge semantics are architecturally correct. Correctly delegates to CRDT for same-position concurrent insert ordering. |
| | **TOTAL** | **100** | **27/100** | |

**Feedback for revision:**
- **To AC Writer:** This story lives or dies on its test cases. AC should cover: concurrent inserts at different positions both preserved (primary case), concurrent inserts at same position produce deterministic order, concurrent delete + insert at same position handled without data loss, formatting applied concurrently to same range merges (not last-writer-wins). These need to be expressed as Given/When/Then scenarios with specific setup states.
- **To Test Generator:** This story requires automated concurrent-operation test harnesses — two simulated clients, coordinated op delivery. Specify the harness setup explicitly.

---

### OFFLINE-001: Local editing while disconnected (browser)

**Score: 26/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 8 | Browser-only scope explicitly stated. Offline indicator in header is specific. Reduced per blocker override. |
| 2 | Gap analysis quality | 15 | 13 | G-6 resolved (auto-merge always, no manual UI). Mobile offline explicitly deferred. y-indexeddb provider is the correct mechanism. |
| 3 | AC completeness | 20 | 0 | No AC produced. |
| 4 | AC specificity | 10 | 0 | No AC produced. |
| 5 | Test coverage | 20 | 0 | No tests produced. |
| 6 | Test quality | 10 | 0 | No tests produced. |
| 7 | Traceability | 5 | 0 | No chain exists. |
| 8 | Architecture alignment | 5 | 5 | IndexedDB via y-indexeddb is the correct browser-native persistence for Yjs offline buffering. |
| | **TOTAL** | **100** | **26/100** | |

**Feedback for revision:**
- **To AC Writer:** AC must cover: offline indicator appears within 2 seconds of connectivity loss, edits made while offline are preserved in IndexedDB (verifiable on page reload while still offline), edit continues uninterrupted (no error thrown to user), offline indicator clears on reconnect, ops buffered while offline are not lost. Also need negative: view-only user offline behavior (reads from cache? shows stale content? — currently unspecified, mark as open question if not decided).

---

### VER-001: Automatic delta snapshots

**Score: 26/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 8 | "5 minutes of activity" (not wall time) is a critical clarification. Delta storage specified. 30-day TTL and S3 location specified. Reduced per blocker override. |
| 2 | Gap analysis quality | 15 | 13 | G-14 resolved (30-day retention). S3 path prefix still listed as pre-dev action. Delta storage strongly recommended in technical notes — correctly adopted here. |
| 3 | AC completeness | 20 | 0 | No AC produced. |
| 4 | AC specificity | 10 | 0 | No AC produced. |
| 5 | Test coverage | 20 | 0 | No tests produced. |
| 6 | Test quality | 10 | 0 | No tests produced. |
| 7 | Traceability | 5 | 0 | No chain exists. |
| 8 | Architecture alignment | 5 | 5 | Delta storage on S3 is correct. Timer triggered by activity (not wall time) is the right semantics. |
| | **TOTAL** | **100** | **26/100** | |

**Feedback for revision:**
- **To AC Writer:** AC must cover: snapshot triggered after 5 minutes of document edits (not 5 minutes of no edits), snapshot is delta from previous (not full document), snapshot stored to S3 with expected key format, snapshots older than 30 days automatically deleted, snapshot creation is invisible to user (no UI feedback), no snapshot if document has had zero activity in the window.

---

### CMNT-001: Inline comment creation

**Score: 26/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 8 | Anchor mechanism (Yjs relative position) specified. Comment panel ordering (document order) specified. Visibility to all access levels specified. Reduced per blocker override. |
| 2 | Gap analysis quality | 15 | 13 | G-7 partially resolved (comments persist when anchor text edited). Orphan behavior deferred to CMNT-003. Threading deferred to CMNT-002. |
| 3 | AC completeness | 20 | 0 | No AC produced. |
| 4 | AC specificity | 10 | 0 | No AC produced. |
| 5 | Test coverage | 20 | 0 | No tests produced. |
| 6 | Test quality | 10 | 0 | No tests produced. |
| 7 | Traceability | 5 | 0 | No chain exists. |
| 8 | Architecture alignment | 5 | 5 | Yjs relative position for comment anchoring is the correct approach (survives concurrent edits shifting character positions). |
| | **TOTAL** | **100** | **26/100** | |

**Feedback for revision:**
- **To AC Writer:** AC must cover: comment creation by can-comment user on selected text, comment creation by can-edit user, comment rejected for view-only user (403), comment appears in panel in document order, comment anchor updates when text before it is edited, comment visible to all users with any access level, comment creation via toolbar, comment creation via right-click context menu.

---

### CMNT-004: Suggestion mode (track changes)

**Score: 25/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 7 | Most complex comments story. Role eligibility (can-edit only) clearly stated. Visual treatment (underline/strikethrough + author color) specified. Reduced per blocker override. |
| 2 | Gap analysis quality | 15 | 13 | G-8 resolved (can-edit for suggestions). Batch accept/reject deferred. Suggestion-comment distinction noted. |
| 3 | AC completeness | 20 | 0 | No AC produced. |
| 4 | AC specificity | 10 | 0 | No AC produced. |
| 5 | Test coverage | 20 | 0 | No tests produced. |
| 6 | Test quality | 10 | 0 | No tests produced. |
| 7 | Traceability | 5 | 0 | No chain exists. |
| 8 | Architecture alignment | 5 | 5 | Suggestions syncing via Yjs like regular edits is architecturally sound. |
| | **TOTAL** | **100** | **25/100** | |

**Feedback for revision:**
- **To AC Writer:** This is the L-sized story with the most complex AC surface. Must cover: toggle enables suggestion mode for can-edit user, toggle rejected for can-comment user (403/disabled), insertion shown as underline + author color, deletion shown as strikethrough + author color, accept removes markup and applies change, reject discards change and restores original, suggestions sync in real time to other connected users, can-edit user (not just owner) can accept/reject others' suggestions.

---

### EXPORT-001: Server-side export rendering service

**Score: 27/100** — **BLOCK**

| # | Category | Max | Score | Notes |
|---|----------|-----|-------|-------|
| 1 | Story clarity | 15 | 8 | Auth check specified. Download-only delivery scoped. Reduced per blocker override. |
| 2 | Gap analysis quality | 15 | 13 | G-10 resolved (any view-only+ can export). Export rendering correctly identified as server-side in technical considerations. |
| 3 | AC completeness | 20 | 0 | No AC produced. |
| 4 | AC specificity | 10 | 0 | No AC produced. |
| 5 | Test coverage | 20 | 0 | No tests produced. |
| 6 | Test quality | 10 | 0 | No tests produced. |
| 7 | Traceability | 5 | 0 | No chain exists. |
| 8 | Architecture alignment | 5 | 5 | Server-side export service is correctly identified as the only viable approach for fidelity at scale. |
| | **TOTAL** | **100** | **27/100** | |

**Feedback for revision:**
- **To AC Writer:** AC must cover: GET /export/:documentId?format=pdf returns 200 with file download for view-only+ user, returns 403 for unauthenticated request, returns 403 for user with no document access, request fetches current document state (not stale cache), endpoint returns appropriate Content-Type header, endpoint returns Content-Disposition: attachment header.

---

### Remaining 18 stories (abbreviated)

The following stories have identical scoring patterns to the above. All score **24–27/100** and receive **BLOCK**. Category scores: Story Clarity 7–9/15 (blocker reduction applied), Gap Analysis 12–14/15, all other categories 0. Architecture Alignment 4–5/5 throughout.

| Story | Story Clarity | Gap Analysis | Arch | Total | Verdict |
|-------|--------------|-------------|------|-------|---------|
| RTE-002 | 9 | 13 | 5 | 27 | BLOCK |
| RTE-003 | 8 | 12 | 5 | 25 | BLOCK |
| RTE-004 | 9 | 13 | 5 | 27 | BLOCK |
| RTE-005 | 8 | 12 | 5 | 25 | BLOCK |
| PERM-002 | 8 | 13 | 5 | 26 | BLOCK |
| PERM-003 | 9 | 14 | 5 | 28 | BLOCK |
| SYNC-002 | 8 | 13 | 5 | 26 | BLOCK |
| PRES-001 | 8 | 13 | 5 | 26 | BLOCK |
| CONF-002 | 8 | 13 | 5 | 26 | BLOCK |
| OFFLINE-002 | 8 | 12 | 5 | 25 | BLOCK |
| VER-002 | 9 | 13 | 5 | 27 | BLOCK |
| VER-003 | 9 | 13 | 5 | 27 | BLOCK |
| CMNT-002 | 8 | 12 | 5 | 25 | BLOCK |
| CMNT-003 | 8 | 13 | 5 | 26 | BLOCK |
| TMPL-001 | 8 | 12 | 5 | 25 | BLOCK |
| TMPL-002 | 7 | 11 | 5 | 23 | BLOCK |
| EXPORT-002 | 8 | 13 | 5 | 26 | BLOCK |
| EXPORT-003 | 8 | 13 | 5 | 26 | BLOCK |
| EXPORT-004 | 8 | 13 | 5 | 26 | BLOCK |

---

## Cross-Story Issues

1. **Pipeline infrastructure failure is the root cause of all BLOCKs.** The story decomposition and gap analysis are high quality. The 30-story BLOCK is not a judgment on the stories themselves — it is a pipeline failure. The AC Writer cannot process 10 stories (15-gap analysis + full decomposition) in a single 180-second call. The Test Generator cannot read files outside its working directory. These are engineering bugs in the pipeline, not content problems.

2. **G-5 (permissions model integration) has a residual open action item.** The gap analysis marks G-5 as resolved, but PERM-001 still lists "platform team review of integration boundary required" as an active dependency. If this team review hasn't happened yet, PERM-001 and every story that depends on it (PERM-002, PERM-003, SYNC-001, and all downstream) remain blocked at the product level, independent of the AC/test failure.

3. **Three pre-development actions are listed but untracked.** Marcus's Yjs PoC review, S3 bucket path confirmation, and WebSocket deployment target confirmation are all listed as required before dev begins. None of these have a story or task tracking them. If INFRA-YJS kicks off without the PoC review, work may be duplicated or thrown away.

4. **TMPL-002 is the weakest story in the package.** Story Clarity (7) is the lowest because "new document from template" flow doesn't specify what happens to template-specific placeholder text in the copy, whether the new document is immediately visible to other project members, or what the default permission assignment is.

5. **No authorization AC specified for any story.** By definition, since no AC exists at all. However, flagged specifically because auth/permission testing (401/403) is the most commonly missed category in post-remediation AC. Every story touching a user-facing operation needs explicit 401 (unauthenticated) and 403 (wrong role) test cases.

---

## Improvement vs. Original (Refine mode)

This is **Revision 1 of 3**. No prior review exists to compare against. The baseline established by this review:
- Story decomposition quality: **High** (gap analysis is thorough, scope boundaries are explicit, dependency map is accurate)
- AC quality: **Non-existent** (pipeline failure)
- Test quality: **Non-existent** (pipeline failure)
- Overall pipeline health: **Broken** — requires engineering fixes before Revision 2 can produce substantively different results

---

## Recommendation

**Do not proceed to implementation.** The 30-story BLOCK is unanimous and is caused by two pipeline bugs, not story quality problems. Fix the pipeline first:

### Fix 1 — AC Writer (high priority)
Split AC generation from batch (all 10 stories in one call) to per-story invocations. The gap analysis + 10-story decomposition likely exceeds 3,000 tokens of input, producing 5,000–15,000 tokens of output — well beyond what a 180-second non-streaming call can handle.

Recommended approach: invoke AC Writer once per feature slice (10 invocations in parallel or sequential), passing only that story's scope + relevant gap analysis rows. Cap at 6 AC per story in the first pass; a follow-up pass can add edge cases.

### Fix 2 — Test Generator (high priority)
The Test Generator is locked to `simulations/` and cannot read source files from `story-refinery/`. The working directory needs to be corrected so it can access agent definitions and the story package output files.

### Fix 3 — Validate G-5 resolution before estimating PERM-001
Confirm with the platform team that the permissions model integration boundary is fully resolved before placing PERM-001 in a sprint. Everything from PERM-001 downstream is blocked at the product level until that confirmation exists.

### Fix 4 — Track pre-dev actions
Create explicit tasks for: Marcus Yjs PoC review, S3 bucket path confirmation, WebSocket deployment target confirmation. These are currently prose notes in the decomposition document, which means they will be missed.

**When Revision 2 runs with working AC and test generation, the story decomposition quality is strong enough that a majority of stories should pass at 80+.** The gap analysis is among the best produced by this pipeline — thorough, specific, with clear resolution decisions and documented assumptions. The stories are well-scoped with explicit in/out boundaries. The underlying content is ready for implementation once the pipeline is repaired.
