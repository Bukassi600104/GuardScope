# Contributing

GuardScope is in Chrome Web Store launch preparation. Keep changes focused, verified, and privacy-preserving.

## Local Setup

```powershell
npm ci --prefix backend
npm ci --prefix extension
```

## Verification

Run these before opening a PR:

```powershell
npm test --prefix backend
npm test --prefix extension
$env:SUPABASE_JWT_SECRET='local-build-only-secret'; npm run build --prefix backend
npm run build --prefix extension
```

## Launch Rules

- Do not store email bodies, full subjects, full URLs, or attachment contents.
- Do not add secrets to the extension.
- Keep public links on `https://guardscope.app`.
- Update `extension/PERMISSION_JUSTIFICATIONS.md` whenever `extension/manifest.json` changes.
- Update `docs/MANUAL_QA.md` when Gmail extraction or side panel behavior changes.

