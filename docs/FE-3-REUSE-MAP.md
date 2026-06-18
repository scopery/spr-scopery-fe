# FE-3 Items Library + Item Detail — Reuse Map

## Scan summary (before implementation)

### Routing (App Router)
- **Có:** `app/org/[orgId]/layout.tsx` (AuthGuard), `app/org/[orgId]/projects/[projectId]/page.tsx` (tabs: Documents, Items, Trace, Settings)
- **Thêm:** `app/org/[orgId]/projects/[projectId]/items/page.tsx` → `/org/:orgId/projects/:projectId/items`
- **Thêm:** `app/items/[itemId]/page.tsx` → `/items/:itemId`

### Constants
- **Có:** `constants/endpoints.ts` (DOCUMENT_ENDPOINTS, PROJECT_ENDPOINTS), `constants/routes.ts` (ROUTES.org.documents, ROUTES.documentDetail)
- **Thêm:** ITEM_ENDPOINTS (listInProject, createInProject, update); ROUTES.org.items(orgId, projectId), ROUTES.itemDetail(itemId)

### Types
- **Có:** `types/auth.ts` (ApiResponse), `types/document.ts` (Document, CreateDocumentPayload, status/type options)
- **Thêm:** `types/item.ts` — Item, ItemPriority, ItemStatus, ItemType, ListItemsParams, CreateItemPayload, UpdateItemPatch, ITEM_PRIORITY_OPTIONS, ITEM_STATUS_OPTIONS, ITEM_TYPE_OPTIONS

### Services
- **Có:** `lib/apiClient.ts` (get/post/patch, Bearer token), `services/documents.service.ts` (orgHeaders(orgId), DOCUMENT_ENDPOINTS, res.data/res.error throw)
- **Thêm:** `services/items.service.ts` — listProjectItems, createItem, updateItem; getItem only if BE has GET /items/:id (else use list + find in hook/page)

### Hooks
- **Có:** `hooks/useDocumentVersions.ts` (useEffect + refetch + state), `hooks/useProjects.ts` (listProjects + state, createProject, refetch), `getDefaultOrgId` from useOrganizations
- **Thêm:** `hooks/useItemsList.ts`, `hooks/useCreateItem.ts`, `hooks/useUpdateItem.ts` (or useItems combining list/create/update)

### Components / UI
- **Có:** Button, Input, Typography, Stack, Modal, Badge, Spinner, Select, Textarea, Box, Link, Tag — `@/components`
- **Có:** Table: raw `<table>` (document detail, project overview) — reuse
- **Có:** Toast: `sonner` (toast.success, toast.error)
- **Có:** Empty state: Box + Typography tone="muted" + Button CTA
- **Có:** Tabs: inline state + buttons/Link (project overview) — reuse for item detail tabs
- **Có:** Copy: `lucide-react` Copy icon (EventCard) — reuse for business_id copy button
- **Thiếu:** No Tabs atom — use inline tab buttons. No Confirm dialog — use Modal with two actions for dirty leave.

### BE gap handling
- No GET /items/:itemId: item detail loads via listProjectItems then find by itemId (projectId from first load or from item in list); or pass projectId in query if we have it.
- Search/domain/priority not in API: filter client-side on fetched list; do not add unsupported query params.
