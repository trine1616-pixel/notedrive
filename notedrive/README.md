# NoteDrive (UpNote-style MD Editor)

## What this now supports
- UpNote-like 3-pane UI (folders / note list / editor).
- Markdown note editing with AI summarize.
- Real save/create to storage (not just local state).
- Storage provider switching:
  - `local`: save to local folder (good for IDE workflows).
  - `gdrive`: save directly to Google Drive folder via Drive API.

## 1) Local folder mode (default)
Set in `.env.local`:

```bash
NOTEDRIVE_STORAGE_PROVIDER=local
# Optional. If omitted, defaults to ../Obsidian_Vault
NOTEDRIVE_LOCAL_ROOT=../Obsidian_Vault
```

## 2) Google Drive folder mode
Set in `.env.local`:

```bash
NOTEDRIVE_STORAGE_PROVIDER=gdrive
GOOGLE_DRIVE_FOLDER_ID=your_target_folder_id

# Option A: fixed access token (quick test)
GOOGLE_DRIVE_ACCESS_TOKEN=ya29....

# Option B: long-running server mode with refresh token
GOOGLE_DRIVE_CLIENT_ID=...
GOOGLE_DRIVE_CLIENT_SECRET=...
GOOGLE_DRIVE_REFRESH_TOKEN=...
```

Required scope for token/refresh token:
- `https://www.googleapis.com/auth/drive.file` or `https://www.googleapis.com/auth/drive`

## Run
```bash
npm install
npm run dev
```
