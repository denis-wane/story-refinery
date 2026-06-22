# Clarifying Questions

## Critical (must answer before proceeding)

1. **CRDT vs OT framework selection**
   Has your team made — or do you have a strong preference on — the choice between a CRDT library (e.g., Yjs, Automerge) and an OT framework (e.g., ShareDB)? If not, who owns this architectural decision and by when?
   - _Why it matters:_ This is the single decision that determines sync server topology, offline merge behavior, conflict resolution guarantees, and which client libraries are viable. Every sync-related story is unestimatable until it's resolved.
   - _Default assumption if unanswered:_ Yjs (CRDT) — offline-first, no central sequencer required, active ecosystem.

2. **Existing permissions model compatibility**
   Describe your current permissions system: is it purely role-based at the workspace/project level, or does it already support per-resource ACLs? Can a user have a different role on one document than another within the same project?
   - _Why it matters:_ Per-user per-document permissions may require a new ACL table, schema changes, and auth middleware — it's potentially a multi-sprint infrastructure piece, not a UI feature. If the existing system can't support it, the Permissions story is significantly larger.
   - _Default assumption if unanswered:_ Existing system is role-based at project level; a new per-document ACL layer will be required.

3. **WebSocket infrastructure**
   Does your existing backend infrastructure support persistent WebSocket connections at production load? Approximately how many concurrent document sessions do you need to support at launch?
   - _Why it matters:_ If existing infrastructure can't handle stateful collab traffic, a dedicated service must be scoped, architected, and deployed — that's a separate infrastructure story that gates everything else.
   - _Default assumption if unanswered:_ A dedicated collaboration service will be required; existing infra will not be extended for collab traffic.

4. **Maximum document size and concurrent editor scale**
   What are the expected upper bounds for: (a) document size in KB/MB, (b) number of concurrent editors on one document, and (c) total documents in the system at steady state?
   - _Why it matters:_ The 500ms sync SLA, storage architecture, snapshot strategy, and presence broadcast design all require concrete scale targets. Without them, stories cannot be scoped or acceptance-tested.
   - _Default assumption if unanswered:_ 2MB max document, 25 concurrent editors, no retention limit on total documents — but these will need validation before performance testing.

5. **Offline conflict UX for long-divergence scenarios**
   When a user reconnects after hours offline with substantial edits, should the system: (a) silently merge using the same LWW-for-same-range policy, (b) show a diff/preview before merging, or (c) surface a manual merge UI for conflicts?
   - _Why it matters:_ Silent merge (option a) is technically simpler but can surprise users with lost work after long offline periods. Options b/c require a dedicated merge UI component. This is a scope decision, not an implementation detail.
   - _Default assumption if unanswered:_ Silent merge with a post-reconnect notification ("X edits were merged; Y were overwritten") and a link to version history for recovery.

---

## Important (strongly recommended)

1. **Browser and device support matrix**
   What browsers and devices must be supported at launch? Specifically: Safari on iOS, Safari on macOS, Chrome on Android — and what minimum OS/browser versions?
   - _Why it matters:_ WebSocket behavior, IndexedDB for offline queue, and CRDT library compatibility differ significantly across these platforms. Frontend story estimates are unreliable without a target matrix.
   - _Default assumption if unanswered:_ Chrome/Firefox/Edge (latest 2 versions) on desktop; Safari iOS 16+ and Chrome Android on mobile — with offline limited to desktop at launch.

2. **Suggestion mode acceptance ownership**
   Who can accept or reject tracked changes: any editor, only the document owner, or a configurable policy?
   - _Why it matters:_ Determines whether suggestion acceptance requires a permission check, which affects the Comments & Suggestions story's auth model.
   - _Default assumption if unanswered:_ Any user with can-edit permission can accept or reject suggestions.

3. **Comment resolution ownership**
   Who can mark a comment thread as resolved: the comment author, any editor, or the document owner only? Are resolved comments hidden or archived and viewable?
   - _Why it matters:_ Drives both the UI (who sees the "Resolve" button) and the data model (soft-delete vs. archive state).
   - _Default assumption if unanswered:_ Any can-edit user or the comment author can resolve; resolved comments are archived and accessible via a "Show resolved" toggle.

4. **Version history retention policy**
   How long should automatic snapshots be retained? Is there a cap on number of snapshots per document? Who bears the cost (tenant/user storage quota vs. platform infrastructure)?
   - _Why it matters:_ Unbounded snapshot retention at 5-minute intervals is a significant and growing storage cost. Without a policy, the Version History story has no acceptance criteria for the retention behavior.
   - _Default assumption if unanswered:_ 90-day rolling window, capped at 500 snapshots per document; oldest auto-snapshots are pruned first (named saves are exempt from pruning).

5. **Export access by role**
   Can view-only users export a document? Can commenters? Is export a per-document toggle or a global policy?
   - _Why it matters:_ Export is a data-exfiltration vector — if documents contain sensitive content, view-only export may be intentionally restricted. The Export and Permissions stories both need a clear policy.
   - _Default assumption if unanswered:_ Export is allowed at view-only permission level; no per-document toggle at launch.

---

## Nice to Have (will use reasonable defaults)

1. **@mention and notification in comments**
   Should users be able to @mention teammates in comments to trigger a notification? If so, does this integrate with your existing notification system or require a new one?
   - _Why it matters:_ @mention is a common expectation in collaborative editors. If deferred, the Comments story should note it as a known follow-on to avoid scope creep mid-sprint.
   - _Default assumption if unanswered:_ Deferred to a follow-on story; a `// TODO: @mention` note will be added to the Comments story.

2. **Template instantiation model**
   When a user creates a document from a template, should the template content be copied (snapshot at creation time) or linked (live — template updates propagate to documents)?
   - _Why it matters:_ Live-linking is substantially more complex and can produce surprising behavior for users who don't expect their document to change after creation.
   - _Default assumption if unanswered:_ Copy (snapshot) at instantiation. Templates are a starting point, not a live connection.

3. **Undo/redo scope in collaboration**
   Should undo revert only the current user's edits (local undo) or anyone's edits in the session (global undo)?
   - _Why it matters:_ Global undo in a multi-user context is both technically complex and often surprising — undoing a collaborator's edit without their knowledge.
   - _Default assumption if unanswered:_ Local undo only (standard CRDT behavior).

---

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **Embedded images use reference-based storage, not inline base64** — Base64 was eliminated as not viable at scale; presigned URLs to a file store are assumed. Flag if your infrastructure doesn't have a file/blob store already.
2. **500ms sync is a 95th-percentile target, not p99 or mean** — The requirement says "within 500ms" without a percentile. The analysis assumed p95 as the SLA. Confirm if a stricter p99 is intended.
3. **Presence (cursors, labels) is broadcast-only and not persisted** — Cursor positions are ephemeral; they will not be written to the document operation log or stored server-side beyond the active session.
4. **Admins create templates; editors consume them** — No self-service template creation by non-admins is assumed. Flag if editors should be able to create personal or shared templates.
5. **"Our existing app" shares authentication** — The collaborative editor will reuse the existing session/auth system for identity in presence indicators and permissions. No separate auth flow is assumed.
