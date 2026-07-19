# Wave 4.1 — Document Hub Content UI — Status

Date: 2026-07-19  
Module: `modules/documents/native-content/`  
Route: `/workspace/{workspaceId}/projects/{projectId}/documents/{documentId}/edit`  
Flag: `FEATURES.wave41NativeEditor`

## Delivered

| Phase | Status | Notes |
|---|---|---|
| P0 Contract / gateway | Done | `DocumentContentGateway`, `/content` + `/revisions` |
| P1 Native editor | Done | Plate editor, autosave, 409 conflict, Create NATIVE |
| P2 Assets | Done | Attachments upload/complete; sub-pages gated (`wave41DocumentSubpages`) |
| P3 Collaboration | Done | Comments, suggestions, revision history panels |
| P4 Reusable | Done* | Synced LIVE; native templates ON (`wave41NativeTemplates`); Smart Blocks still gated |
| P5 Intelligence | Done | Mentions + AI context + client visibility |
| P6 Hardening | Done* | Approve, indexing, ACCESS_REVOKED banner, Plate custom nodes, Playwright scaffold. Full live E2E needs env IDs |

## Feature flags

| Flag | Default | Purpose |
|---|---|---|
| `wave41NativeEditor` | `true` | Native `/edit` surface |
| `wave41DocumentSubpages` | `false` | No Subpage controller on BE |
| `wave41NativeTemplates` | `true` | BE `/native-versions` wired on DocumentTemplateController |
| `wave41SmartBlocks` | `false` | No `/smart-blocks/*` typed APIs (GAP-09) |

## Known BE gaps (do not invent FE workarounds)

1. Native template HTTP (`POST .../native-versions`, instantiate) — actions exist, controller missing  
2. Sub-pages controller — path constant only  
3. Smart Blocks resolve/preview/types APIs  
4. Mention search (`/resource-references/mentions/search`) — path only  
5. Content-version submit-review / approve / reject / publish — not in WAVE4_1_API_CONTRACT (use document-level `POST .../approve`)  
6. `DocumentResponse` omits `clientVisible` — UI tracks local state after toggle  
7. Workspace indexing-jobs list path may be missing on BE — editor panel tracks job from reindex response + poll `GET /indexing/jobs/{id}`

## Manual smoke checklist

- [ ] Open NATIVE doc → `/edit` loads Plate content  
- [ ] Edit → autosave → refresh keeps content  
- [ ] Concurrent save → conflict banner keep/load  
- [ ] Attachments: upload → list → download  
- [ ] Comments / suggestions / history panels  
- [ ] Synced: create → insert reference token → archive  
- [ ] Mentions: list types → resolve UUID → insert → revoked banner when ACCESS_REVOKED  
- [ ] Client: validate → enable/disable  
- [ ] AI ctx: resolve → show tokens/citations → audit  
- [ ] Index: project reindex → job status polls  
- [ ] Approve toolbar action  

## Next (optional)

1. BE: wire native-versions on `DocumentTemplateController` → flip `wave41NativeTemplates`  
2. BE: Smart Blocks typed DTOs → flip `wave41SmartBlocks`  
3. FE: Plate mention/synced custom nodes (replace text tokens)  
4. E2E Playwright matrix  
