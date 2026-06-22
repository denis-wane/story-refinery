# Clarifying Questions

## Critical (must answer before proceeding)

1. **CRDT vs. OT framework decision**
   Which conflict-resolution architecture will you adopt — a CRDT library (e.g., Yjs, Automerge) or an OT-based approach (e.g., ShareDB)? This is the single most consequential technical decision in the entire feature.
   - _Why it matters:_ Every story touching real-time sync, offline editing, and conflict resolution has a different acceptance criteria, infrastructure dependency, and complexity profile depending on this choice. Stories written before this decision may be invalidated.
   - _Default assumption if unanswered:_ **Yjs + Tiptap.** Most documented pairing for browser-based collab editors; strong offline support; large ecosystem.

2. **WebSocket infrastructure: new service or extend existing?**
   Does your existing backend infrastructure support sticky sessions and a pub/sub layer (e.g., Redis)? Or will collaborative editing require a dedicated WebSocket server?
   - _Why it matters:_ Determines whether there is a new deployment component (dedicated WS server, potentially managed like Liveblocks/PartyKit) or an extension of existing infra. Affects sprint scope, DevOps stories, and cost model.
   - _Default assumption if unanswered:_ **Dedicated WebSocket service** is assumed as the safer path. Flag for infra audit before implementation begins.

3. **Integration with the existing permissions model**
   Does your current permissions system have document-level ACLs (per-resource, per-user rules), or does it operate only at project/workspace level? Is there an existing roles hierarchy to inherit from?
   - _Why it matters:_ If document-level ACLs don't exist today, a schema migration is required before any permission stories can be implemented. Migration risk and scope must be understood upfront.
   - _Default assumption if unanswered:_ **A new `document_permissions` join table is required.** Stories will be written against this assumption and flagged for validation against the existing schema.

4. **Guest / external collaborator access (share links) — in or out of scope?**
   Are unauthenticated or external users (e.g., accessed via a share link, not logged into the app) in scope for v1?
   - _Why it matters:_ If in scope, the permissions model, presence system, and auth flows all change materially. Guest support is architecturally invasive — far easier to exclude from v1 than retrofit.
   - _Default assumption if unanswered:_ **Out of scope for v1.** All document access requires authentication.

5. **Concurrent editors scale target**
   What is the maximum number of simultaneous editors per document the system must support at launch — roughly 5, 25, or 50+?
   - _Why it matters:_ At ≤5, naive WebSocket broadcast is fine. At 25+, a pub/sub fan-out layer is required. At 50+, the CRDT state size and presence broadcast become performance bottlenecks. This gates the WebSocket and CRDT architecture decisions.
   - _Default assumption if unanswered:_ **≤25 concurrent editors per document for v1.**

---

## Important (strongly recommended)

1. **Version history retention policy**
   How many auto-snapshots should be retained per document, and for how long? Is there a difference between free and paid plan tiers?
   - _Why it matters:_ Snapshot storage grows linearly with document count. Without a retention cap, the storage cost model is undefined and the version history UI (pagination, search) may be scoped incorrectly.
   - _Default assumption if unanswered:_ **Retain last 50 auto-snapshots and all manually named versions indefinitely. No tier differentiation in v1.**

2. **Version restore: destructive overwrite or new version?**
   When a user restores a historical snapshot, does it overwrite the current document state, or does it create a new version ("Restored from [date]") and navigate to it?
   - _Why it matters:_ Destructive restore requires a confirmation gate and affects undo stack behavior. Non-destructive restore is safer but adds a named version to history on every restore.
   - _Default assumption if unanswered:_ **Non-destructive: restore creates a new named version and preserves current state in history.**

3. **Comment behavior when anchored text is deleted**
   If a user deletes a block of text that has inline comments attached, what should happen to those comments?
   - _Why it matters:_ Comment anchoring to CRDT positions is a known hard problem. The product behavior (orphan, delete, or warn-before-delete) determines the implementation approach and affects the comment rendering story significantly.
   - _Default assumption if unanswered:_ **Comments become "orphaned" — detached from their position, shown in the sidebar with the original quoted text preserved for context.**

4. **Export fidelity: full fidelity or best-effort?**
   For PDF and DOCX export, are custom fonts, merged table cells, and code block syntax highlighting expected to render correctly, or is best-effort fidelity acceptable with documented limitations?
   - _Why it matters:_ Full-fidelity DOCX/PDF requires a more complex rendering pipeline (headless browser for PDF; careful element mapping for DOCX). Best-effort can ship with a lighter-weight implementation and documented caveats.
   - _Default assumption if unanswered:_ **Best-effort fidelity. Known lossy elements are documented in release notes.**

5. **Mobile support — desktop-only or mobile-responsive?**
   Is the collaborative editor expected to work on mobile browsers (or native apps) at launch?
   - _Why it matters:_ Rich text editors with cursor overlays, inline comments, and real-time presence are notoriously difficult on mobile touch targets. If mobile is required, the editor framework choice and presence UI must account for it from day one.
   - _Default assumption if unanswered:_ **Desktop web only for v1. Mobile-responsive is a stretch goal.**

---

## Nice to Have (will use reasonable defaults)

1. **@mentions in comments — in scope for v1?**
   Should users be able to @mention teammates in comment threads, triggering a notification?
   - _Why it matters:_ Implies a notification system integration (email, in-app). If the host app already has notifications, the hook is simple. If not, it's a significant new dependency.
   - _Default assumption if unanswered:_ **Out of scope for v1. Comment story will include a placeholder hook for future @mention support.**

2. **Suggestion mode + real-time sync rendering**
   When User A is in suggestion mode and User B is in direct-edit mode on the same paragraph, how should tracked changes appear to User B?
   - _Why it matters:_ If tracked changes must render correctly for all user modes simultaneously, the suggestion mode story likely needs to be split into a design spike + implementation.
   - _Default assumption if unanswered:_ **Suggestion-mode edits appear as pending markup (tracked insertions/deletions) to all users regardless of their current mode. Acceptance or rejection is an explicit action.**

3. **Maximum document size**
   Is there a planned cap on document content size (text content, number of embedded images)?
   - _Why it matters:_ Sets the performance SLA context for the <500ms sync requirement, snapshot storage sizing, and export pipeline limits.
   - _Default assumption if unanswered:_ **2MB of text content, 50 embedded images per document. Flag for product review before GA.**

---

## Assumptions Being Made
_These are interpretations the analysis has already made. Flag any that are wrong._

1. **Images are stored by reference, not base64** — Inline base64 is the only alternative but is unworkable at scale (bloats CRDT state, snapshots, and OT ops). A file storage service with access control is assumed to exist or will be built.
2. **Embedded images inherit document permissions** — A viewer cannot access an image URL from a document they've been revoked from. Requires the file storage service to mirror document-level ACLs.
3. **Offline merge order is determined by server receive timestamp** — When multiple offline users reconnect simultaneously with conflicting edits to the same character range, the server's receive order resolves the conflict. This is a known CRDT/OT constraint and will be surfaced in undo history.
4. **Version history is browsable by editors only, not viewers** — Viewers can read the current document; accessing historical snapshots requires can-edit permission.
5. **The editor framework will be Tiptap (ProseMirror-based)** — This is the most mature pairing with Yjs and has the broadest plugin ecosystem for the required rich text features. An explicit framework decision record should be created as part of the foundation phase.
