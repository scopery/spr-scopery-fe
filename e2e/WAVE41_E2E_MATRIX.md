# Wave 4.1 E2E matrix (Playwright)

Runnable specs live in `e2e/wave41-native-editor.spec.ts`.

## Commands

```bash
npx playwright install chromium
npm run dev
npm run test:e2e
```

Live editor checks:

```bash
E2E_WORKSPACE_ID=... \
E2E_PROJECT_ID=... \
E2E_DOCUMENT_ID=... \
E2E_STORAGE_STATE=e2e/.auth/user.json \
npm run test:e2e
```

## Coverage map

| ID | Scenario | Spec status |
|---|---|---|
| E2E-W41-001 | Login shell renders | Automated |
| E2E-W41-010 | Open native editor | Live env gated |
| E2E-W41-011 | Side panels (Synced / Mentions / Templates / Smart) | Live env gated |
| E2E-W41-012 | Manual save control | Live env gated |
| E2E-W41-020 | Autosave + conflict banner | Manual |
| E2E-W41-021 | Attachments upload | Manual |
| E2E-W41-022 | Comments / suggestions / history | Manual |
| E2E-W41-023 | Synced block insert custom node | Manual |
| E2E-W41-024 | Mention ACCESS_REVOKED banner | Manual |
| E2E-W41-025 | Native template publish + instantiate | Manual (BE wired) |
| E2E-W41-026 | Smart blocks | Deferred — no BE API (`wave41SmartBlocks=false`) |
| E2E-W41-027 | Client visibility validate/enable | Manual |
| E2E-W41-028 | AI context resolve | Manual |
| E2E-W41-029 | Knowledge indexing reindex | Manual |
