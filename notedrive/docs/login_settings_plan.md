# Login & Settings Plan

## Goal
Provide account-level sync controls, profile access, and workspace preferences without breaking local-first note editing.

## Phase 1 (Now)
- Local profile shell in sidebar footer
- Settings dialog with theme mode (light / dark / system)
- Storage status display (local vs Google Drive)

## Phase 2 (Auth)
- Google OAuth sign-in
- Session storage and refresh handling
- User-scoped Drive root selection
- First-run permission diagnostics

## Phase 3 (Collaboration)
- Shared notebooks
- Role permissions (owner/editor/viewer)
- Activity history and conflict UI

## Technical Notes
- Keep auth provider abstraction behind a single service layer
- Keep note operations idempotent and path-safe
- Add telemetry for failed sync/auth actions
