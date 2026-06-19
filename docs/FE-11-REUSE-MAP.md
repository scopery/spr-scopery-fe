> **Out of date (2026):** This document references code removed during Safe Dead Code Cleanup (orphan hooks/services/components). See `CLAUDE.md` for current architecture.

# FE-11 Stakeholders — Reuse Map

## Scan summary (updated after implementation)

- **Routing**: `constants/routes.ts` has `ROUTES.org.settingsStakeholders(orgId, projectId?)`. `app/org/[orgId]/settings/stakeholders/page.tsx` exists (directory). Item detail `app/items/[itemId]/page.tsx` has tab `stakeholders` with full UI.
- **Constants**: `constants/endpoints.ts` — `STAKEHOLDER_ENDPOINTS` (project-scoped: list, create, update, remove), `ITEM_STAKEHOLDER_ENDPOINTS` (list, assign, remove).
- **Types**: `types/stakeholder.ts` — Stakeholder, ItemStakeholderAssignment, StakeholderRole, payloads, STAKEHOLDER_ROLE_OPTIONS.
- **Services**: `services/stakeholders.service.ts` (list/create/update/delete), `services/itemStakeholders.service.ts` (listAssignments/assign/remove). Both use apiClient + orgHeaders.
- **Hooks**: useStakeholdersDirectory, useCreateStakeholder, useUpdateStakeholder, useDeleteStakeholder, useItemStakeholders (with list/refetch when GET exists), useAssignStakeholder, useRemoveAssignment.
- **API**: No backend in repo; endpoints are conventional. On failure UI shows banners ("Not available yet", "Assigned in this session (API has no list endpoint)").

## Reuse map (current)

| Có sẵn                                                                                     | Path                                 | Dùng cho                                                             |
| ------------------------------------------------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------- |
| ApiResponse                                                                                | types/auth.ts                        | Service response typing                                              |
| apiClient                                                                                  | lib/apiClient.ts                     | All BE calls                                                         |
| STAKEHOLDER_ENDPOINTS, ITEM_STAKEHOLDER_ENDPOINTS                                          | constants/endpoints.ts               | Directory + item-stakeholder API                                     |
| ROUTES.org.settingsStakeholders                                                            | constants/routes.ts                  | Directory page link                                                  |
| types/stakeholder.ts                                                                       | types/stakeholder.ts                 | Stakeholder, Assignment, payloads, STAKEHOLDER_ROLE_OPTIONS          |
| stakeholders.service.ts                                                                    | services/stakeholders.service.ts     | list/create/update/delete (project-scoped)                           |
| itemStakeholders.service.ts                                                                | services/itemStakeholders.service.ts | listAssignments/assign/remove                                        |
| useStakeholdersDirectory, useCreateStakeholder, useUpdateStakeholder, useDeleteStakeholder | hooks/                               | Directory page                                                       |
| useItemStakeholders, useAssignStakeholder, useRemoveAssignment                             | hooks/useItemStakeholders.ts         | Item tab                                                             |
| app/org/[orgId]/settings/stakeholders/page.tsx                                             | app/                                 | Stakeholders directory (project selector, table, create/edit modals) |
| Item tab Stakeholders                                                                      | app/items/[itemId]/page.tsx          | Assign modal, list (API or session-only), role/note, remove          |
| Box, Stack, Typography, Button, Input, Select, Textarea, Badge, Modal, Spinner             | components/                          | Directory + item tab UI                                              |
| toast                                                                                      | sonner                               | Success/error                                                        |
| window.confirm                                                                             | —                                    | Delete/remove confirm                                                |

| Thiếu (optional / BE-gap)           | Ghi chú                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| GET list item-stakeholders          | Optional; when BE adds it, useItemStakeholders returns list + listAvailable=true; else session-only + banner. |
| PATCH assignment (change role/note) | Not in endpoints; "change role" action disabled.                                                              |

## Endpoint convention (no BE in repo)

- **Directory (project-scoped)**: GET/POST `/api/projects/:projectId/stakeholders`; PATCH/DELETE `/api/stakeholders/:id`.
- **Item assignments**: GET `/api/items/:itemId/stakeholders` (optional), POST `/api/items/:itemId/stakeholders`, DELETE `/api/items/:itemId/stakeholders/:stakeholderId`.
