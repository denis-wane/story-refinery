# Clarifying Questions

## Critical (must answer before proceeding)

1. **Which sync engine will you use — CRDT or OT?**
   Your real-time sync, offline editing, conflict resolution, and snapshot format all depend on this choice. The leading options are Yjs (CRDT, framework-agnostic, mature offline support) and ShareDB (OT, server-authoritative, simpler conflict model).
   - _Why it matters:_ This is the foundational architectural decision. Stories for Real-Time Sync, Offline Editing, and Conflict Resolution cannot be written without it — the data model, server topology, and merge semantics are completely different between the two.
   - _Default assumption if unanswered:_ **Yjs (CRDT)** — mature, well-supported, handles offline natively without a coordination server.

2. **Can your existing backend handle persistent WebSocket connections, or does a new service need to be provisioned?**
   If your current stack is HTTP/REST only, adding sub-500ms presence and sync requires either a new WebSocket service, an SSE layer, or a managed solution (e.g., Liveblocks, PartyKit). This affects sprint scope, infra cost, and who owns the new service.
   - _Why it matters:_ Blocks the entire Real-Time Sync and Presence stories. If a new service is needed, that's a story in its own right before collaboration features start.
   - _Default assumption if unanswered:_ A new lightweight WebSocket service will be provisioned (adds ~1 story to Phase 2 scope).

3. **How does per-document permissioning compose with your existing access model?**
   The analysis has no visibility into whether your current model is workspace-level RBAC, org-level ACL, or something else. Per-document view/comment/edit tiers need to either extend it or override it — and the precedence rule for conflicts (e.g., workspace admin vs. document view-only) must be defined.
   - _Why it matters:_ The Permissions story cannot be written without knowing what it's integrating with. Getting this wrong risks a security gap where users gain access they shouldn't have.
   - _Default assumption if unanswered:_ Per-document ACL is additive and cannot grant access beyond what the workspace/org model allows (most restrictive wins).

4. **Which roles can export documents?**
   The spec lists export (PDF, DOCX, Markdown) as a feature but doesn't restrict it by role. Allowing viewers to export could be a data-leak vector in sensitive projects.
   - _Why it matters:_ Determines the Export story's acceptance criteria and the Permissions model's scope. A wrong default here is a security issue, not just a UX preference.
   - _Default assumption if unanswered:_ **Editors and above** can export; viewers cannot. Commenters cannot.

5. **What is the maximum document size you need to support?**
   Sync payload design, snapshot storage strategy, and export rendering all have different requirements at 100KB vs. 10MB vs. 50MB. A "no limit" answer is also a valid decision but requires explicit pagination and chunking stories.
   - _Why it matters:_ Without a size bound, the Version History, Offline Editing, and Export stories cannot include realistic acceptance criteria or performance targets.
   - _Default assumption if unanswered:_ **5MB rendered document size** (text + image references, not inline binary). Documents exceeding this will show a warning; hard cap enforcement is deferred.

---

## Important (strongly recommended)

1. **When restoring a version, does it overwrite HEAD or create a new snapshot?**
   "Browse history" is specified but restore behavior is not. The two common models are: (a) restore creates a new named snapshot at HEAD (non-destructive, Google Docs-style), or (b) restore replaces HEAD directly (destructive, requires confirmation).
   - _Why it matters:_ Determines the Version History story's data model and whether a confirmation/rollback flow is needed.
   - _Default assumption if unanswered:_ Restore creates a new named snapshot at HEAD — non-destructive, auditable.

2. **When offline edits conflict with server state on reconnect, is resolution automatic or does the user get a UI?**
   The spec states last-writer-wins for same-range conflicts in real-time, but an offline session can produce multi-range conflicts at scale. Automatic merge (CRDT handles it silently) vs. a diff/review UI are very different stories.
   - _Why it matters:_ The Offline Editing story acceptance criteria and the UX design differ substantially. A manual resolution UI is a significant additional surface.
   - _Default assumption if unanswered:_ Fully automatic merge via CRDT; no manual resolution UI. Merged result is immediately visible with a toast notification summarizing any conflicts resolved.

3. **Are template placeholders structured fields (typed, required, validated) or styled hint text?**
   Structured fields (like form inputs with types) require a schema, validation logic, and a fill-in flow before editing begins. Styled hint text (like Google Docs placeholder text) is purely cosmetic and collapses on first keystroke.
   - _Why it matters:_ The Document Templates story complexity differs by roughly 3x between these two models.
   - _Default assumption if unanswered:_ Styled hint text only — no structured field schema or validation.

4. **Are inline comments flat annotations or threaded replies?**
   The spec says "inline comments on text selections" without specifying threading. Flat (one comment per anchor) is simpler; threaded (reply chains per anchor, like Google Docs) is expected for a Google Docs-style experience but substantially more complex.
   - _Why it matters:_ Affects the Comments data model, API design, and UI surface area.
   - _Default assumption if unanswered:_ **Threaded replies** per comment anchor, consistent with the stated Google Docs-style goal.

5. **What is the accept/reject flow for suggestion mode (track changes)?**
   The spec mentions suggestion mode but doesn't describe how suggestions are accepted or rejected — by whom, with what granularity (character, word, block?), and whether accepting/rejecting is itself a real-time event other users see.
   - _Why it matters:_ Accept/reject is the core interaction of suggestion mode. Without it, the feature is half-built.
   - _Default assumption if unanswered:_ Document editors and owners can accept/reject suggestions one-by-one; bulk accept/reject is deferred. Accept/reject events sync in real time.

---

## Nice to Have (will use reasonable defaults)

1. **Should presence indicators appear outside the document (e.g., in the document list)?**
   In-document presence (cursors, user list) is well-defined. Whether "X people are editing this" appears in the document list or dashboard is a UX extension not addressed by the spec.
   - _Default assumption if unanswered:_ Presence is **document-scoped only** — visible only when the document is open.

2. **What is the exact snapshot trigger for automatic version history?**
   "Every 5 minutes of activity" is ambiguous — it could mean: (a) 5 minutes since last keystroke, (b) 5 minutes of continuous editing, or (c) a rolling 5-minute window.
   - _Default assumption if unanswered:_ Snapshot fires **5 minutes after the last edit keystroke** (debounced). No snapshot if no edits occurred in the window.

3. **Do comments and suggestions need sub-500ms real-time sync, or is eventual consistency acceptable?**
   The 500ms SLA is defined for document edits. Comments are lower-frequency but a lag of several seconds could feel broken during active review sessions.
   - _Default assumption if unanswered:_ Comments sync in real time but are **server-authoritative append-only** (not subject to CRDT merge) — a simpler, more reliable model that still feels near-instant.

---

## Assumptions Being Made
_These are interpretations the analysis has already locked in. Flag any that are wrong._

1. **Images use reference-based storage (not inline base64)** — Base64 in CRDT sync payloads would be impractical above ~100KB. A separate upload-then-reference approach is assumed. _(Basis: standard industry practice; inline base64 is a known performance anti-pattern for collaborative sync.)_
2. **Yjs (CRDT) is the default sync engine** — Chosen over OT because it handles offline-first natively and doesn't require a central coordination server. _(Basis: analysis gap G-1; no existing infra constraint identified.)_
3. **Version restore is non-destructive** — Restoring any version creates a new HEAD snapshot rather than overwriting history. _(Basis: analysis gap G-6; aligns with Google Docs behavior.)_
4. **Comment threading model matches Google Docs** — Threaded replies per anchor, not flat annotations. _(Basis: analysis gap G-7; "Google Docs-style" is the stated design target.)_
5. **Snapshot retention policy is undefined** — Automatic 5-minute snapshots with no pruning policy will be implemented as-is. Storage cost implications are deferred. _(Basis: spec is silent; a retention policy will be needed before production but is out of scope for initial stories.)_
