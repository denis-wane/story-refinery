# Feature: Real-Time Collaborative Document Editing

## Overview
We're building a collaborative document editor into our project management tool. Multiple users should be able to edit the same document simultaneously, see each other's cursors and selections, and have changes merge automatically without conflicts. Think Google Docs-style experience but embedded in our existing app.

## Requirements
- Rich text editing: headings, bold/italic/underline, bullet lists, numbered lists, code blocks, tables, images, links
- Real-time sync: changes appear on other users' screens within 500ms
- Presence indicators: show who else is viewing/editing the document, with colored cursors and name labels
- Conflict resolution: concurrent edits to different parts of the document merge automatically; concurrent edits to the same character range use last-writer-wins with undo history preserved
- Offline support: users can edit while disconnected; changes sync and merge when reconnected
- Version history: automatic snapshots every 5 minutes of activity, plus manual "save version" with optional name
- Comments and suggestions: inline comments on text selections, suggestion mode (track changes style)
- Permissions: view-only, can-comment, can-edit per user per document
- Document templates: admins can create templates that pre-populate structure and placeholder content
- Export: PDF, DOCX, Markdown

## Open Questions
- What CRDT library or OT framework should we use?
- Do we need a dedicated WebSocket server or can we use our existing infrastructure?
- How do we handle documents with embedded content (images, files) — inline base64 or reference to file storage?
- What's the maximum document size we need to support?
- How does this interact with our existing permissions model?
