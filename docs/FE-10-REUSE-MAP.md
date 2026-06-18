# FE-10 Attachments — Reuse Map

## Scan summary

- **Routing**: `app/items/[itemId]/page.tsx` — item detail with TABS including `attachments` (phase 10). Placeholder currently shows "Coming in Phase 10". `constants/routes.ts`: `itemDetail(itemId)`, `documentVersionOutline(documentId, versionId)`.
- **Outline**: `app/documents/[documentId]/versions/[versionId]/outline/page.tsx` — SectionEditor has Section title, key, parent, content, "Mapped items" block. No Attachments block yet.
- **Search**: `attachment|upload|signed` → only profile uploadAvatar, no attachment endpoints. `items/|itemId` → item page, endpoints, services.
- **Components**: `FileMediaLibrary` = folder preview card (onAdd, onShare), NOT dropzone. `Progress` atom exists. No dropzone/drag component. `Grep dropzone|drag|input.*file` → only profile page `input type="file"`.
- **Services**: `acceptanceCriteria.service.ts` — pattern: orgHeaders(orgId), apiClient.get/post with headers, parse res.ok/data/error. No attachments.service.
- **Constants**: `constants/endpoints.ts` — no ATTACHMENT_ENDPOINTS. `constants/index.ts` exports endpoints.
- **Types**: `types/auth.ts` has ApiResponse<T>. No attachment types.
- **API client**: `lib/apiClient.ts` — get/post/patch/delete, getAccessToken(), no x-org-id (services add via headers). Auth: Bearer + cookie.

## Reuse map

| Có sẵn | Path | Dùng cho |
|--------|------|----------|
| ApiResponse | types/auth.ts | Service response typing |
| apiClient | lib/apiClient.ts | All BE JSON calls; getAccessToken if needed |
| orgHeaders pattern | services/acceptanceCriteria.service.ts | attachments.service ctx + x-org-id |
| ROUTES.itemDetail, documentVersionOutline | constants/routes.ts | Links / routing |
| ITEM_ENDPOINTS, DOCUMENT_ENDPOINTS | constants/endpoints.ts | Same file — add ATTACHMENT_ENDPOINTS |
| Item page TABS + activeTab | app/items/[itemId]/page.tsx | Attachments tab content (replace placeholder) |
| SectionEditor | outline/page.tsx | Add Attachments block below Mapped items |
| Button, Input, Textarea, Select, Box, Stack, Typography, Progress, Spinner, Modal | components/ | Upload UI, list, progress per file, loading |
| toast | sonner (app already uses) | Success/error after attach |
| useAcceptanceCriteria / list+refetch pattern | hooks/useAcceptanceCriteria.ts | useItemAttachments pattern |

| Thiếu | Lý do |
|-------|--------|
| ATTACHMENT_ENDPOINTS | Chưa có trong endpoints.ts — thêm theo API contract |
| types/attachment.ts | Chưa có AttachmentRow, SignedUpload*, AttachPayload, UploadTaskState |
| services/attachments.service.ts | Chưa có — sign, upload to signed URL, attach to item/section, list |
| hooks/useItemAttachments.ts | Chưa có — GET list + refetch |
| hooks/useUploadAndAttachToItem.ts | Chưa có — queue sign→upload→attach |
| hooks/useUploadAndAttachToSection.ts | Chưa có — idem for section |
| UI: file input + drag area | FileMediaLibrary không phải dropzone — làm input[type=file] + drag area basic trong block Attachments |

## Endpoints to add (from API contract)

- POST `/attachments/signed-upload` (body: file_name, mime_type, size_bytes)
- POST `/items/:itemId/attachments` (body: attachment_id, note)
- GET `/items/:itemId/attachments`
- POST `/sections/:sectionId/attachments` (body: attachment_id, note)
- GET `/sections/:sectionId/attachments` — DETECT (if not present: section list = "Uploaded in this session" + banner)
- Signed-download — DETECT (if not present: disable download + tooltip)
