# FE-5 Snapshot/Baseline + Diff — Reuse Map (Final)

## Scan summary

**Scope:** Route `/documents/:documentId/versions/:versionId/baseline` — Snapshot/Baseline block + Diff viewer.

---

## Reuse Map — Có sẵn → path → dùng cho

| Có sẵn                                                                     | Path                            | Dùng cho                                                    |
| -------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| **ROUTES.documentVersionBaseline**                                         | `constants/routes.ts`           | Link to baseline page; breadcrumb                           |
| **ROUTES.documentDetail**                                                  | `constants/routes.ts`           | Back link to document                                       |
| **VERSION_SNAPSHOT_ENDPOINTS.snapshot**                                    | `constants/endpoints.ts`        | POST create snapshot                                        |
| **VERSION_SNAPSHOT_ENDPOINTS.snapshots**                                   | `constants/endpoints.ts`        | GET list snapshots (optional; banner if 404)                |
| **ITEM_ENDPOINTS.diff**                                                    | `constants/endpoints.ts`        | GET item diff ?from=&to=                                    |
| **DOCUMENT_ENDPOINTS.versions**                                            | `constants/endpoints.ts`        | List versions (From/To select)                              |
| **ApiResponse&lt;T&gt;**                                                   | `types/auth.ts`                 | Service parse ok/data/error                                 |
| **SnapshotResult, ItemDiffResult, DiffField, DiffQuery, SnapshotListItem** | `types/snapshot.ts`             | Snapshot + diff types                                       |
| **Document, DocumentVersion**                                              | `types/document.ts`             | Document meta, version options                              |
| **OutlineSection**                                                         | `types/outline.ts`              | Outline context (items from outline when BE provides)       |
| **apiClient**                                                              | `lib/apiClient.ts`              | get/post; Bearer token                                      |
| **snapshot.service**                                                       | `services/snapshot.service.ts`  | createSnapshot, getItemDiff, listSnapshots                  |
| **documents.service**                                                      | `services/documents.service.ts` | getDocument, listVersions                                   |
| **outline.service**                                                        | `services/outline.service.ts`   | listOutlineSections (outline context)                       |
| **items.service**                                                          | `services/items.service.ts`     | listProjectItems (item options fallback)                    |
| **useDocumentVersions**                                                    | `hooks/useDocumentVersions.ts`  | From/To version select options                              |
| **useCreateSnapshot**                                                      | `hooks/useCreateSnapshot.ts`    | Create snapshot button + lastResult                         |
| **useSnapshotList**                                                        | `hooks/useSnapshotList.ts`      | Snapshot history or historyAvailable=false → banner         |
| **useItemDiff**                                                            | `hooks/useItemDiff.ts`          | Compare → fetchDiff, diff data/loading/error                |
| **useOutlineSections**                                                     | `hooks/useOutlineSections.ts`   | Item options from outline when BE returns items in sections |
| **useItemsList**                                                           | `hooks/useItemsList.ts`         | Item select options (project items) + fallback              |
| **getDefaultOrgId, setDefaultOrgId**                                       | `hooks/useOrganizations`        | orgId from query or default                                 |
| **Button, Typography, Stack, Box, Select, Input, Spinner, Link**           | `components/index.ts`           | Snapshot block, diff form, diff table                       |
| **toast**                                                                  | `sonner`                        | Success/error after create snapshot / diff                  |

---

## Thiếu / Đã tạo (trước Phase 5)

- **Constants:** `VERSION_SNAPSHOT_ENDPOINTS`, `ITEM_ENDPOINTS.diff` — đã có trong `constants/endpoints.ts`.
- **Types:** `types/snapshot.ts` — đã có.
- **Service:** `services/snapshot.service.ts` — đã có.
- **Hooks:** `useCreateSnapshot`, `useSnapshotList`, `useItemDiff` — đã có.
- **Page:** `app/documents/[documentId]/versions/[versionId]/baseline/page.tsx` — đã có và đủ spec.

---

## Item options (Diff viewer)

- **Ưu tiên:** List item từ outline (GET …/outline/sections). Hiện BE trả sections không kèm `item_ids`/items → không extract được list item từ outline.
- **Fallback:** `useItemsList(orgId, projectId)` (project items) + input manual Item ID. Đang dùng trong baseline page.

---

## QA checklist (đã đảm bảo)

- [x] Reuse Map đúng; không tạo trùng constants/service/types/components.
- [x] Không fetch/axios trong UI; mọi call qua service.
- [x] Endpoints trong constants (VERSION_SNAPSHOT_ENDPOINTS, ITEM_ENDPOINTS.diff).
- [x] Service dùng apiClient + org headers + parse {ok, data, error}.
- [x] Create snapshot: POST /versions/:versionId/snapshot.
- [x] Diff: GET /items/:itemId/diff?from=&to=.
- [x] Item select: project items + manual ID; outline items khi BE hỗ trợ.
- [x] List snapshots: dùng khi BE có; không có thì banner "Snapshot history is not available yet".
- [x] Không thêm dependency mới.
