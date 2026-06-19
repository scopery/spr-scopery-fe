# FE-2 Documents + Versions — Reuse Map

## Scan summary (before implementation)

### Routing (App Router)

- **Có:** `app/org/[orgId]/layout.tsx` (AuthGuard), `app/org/[orgId]/projects/page.tsx`, `app/org/[orgId]/projects/[projectId]/page.tsx`
- **Thêm:** `app/org/[orgId]/projects/[projectId]/documents/page.tsx` → `/org/:orgId/projects/:projectId/documents`
- **Thêm:** `app/documents/[documentId]/page.tsx` → `/documents/:documentId`

### Constants

- **Có:** `constants/endpoints.ts` (getBaseUrl, AUTH, ORG, PROFILE, ADMIN, PROJECT_ENDPOINTS), `constants/routes.ts` (ROUTES.org.projects, ROUTES.org.project)
- **Thêm:** DOCUMENT_ENDPOINTS trong endpoints.ts; ROUTES.org.documents(orgId, projectId), ROUTES.documentDetail(documentId) trong routes.ts

### Types

- **Có:** `types/auth.ts` (ApiResponse), `types/project.ts` (ProjectStatus, Paginated, PROJECT_STATUS_OPTIONS)
- **Thêm:** `types/document.ts` — DocType, DocumentStatus, Document, DocumentVersion, CreateDocumentPayload, CreateVersionPayload, SetCurrentVersionPayload, options (brd only enabled)

### Services

- **Có:** `lib/apiClient.ts` (get/post/patch, Bearer token from cookie), `services/projects.service.ts` (ctx {orgId}, orgHeaders(orgId), res.data/res.error throw)
- **Thêm:** `services/documents.service.ts` — createDocument, listVersions, createVersion, setCurrentVersion; listProjectDocuments only if endpoint exists (not in repo → skip list, graceful degrade)

### Hooks

- **Có:** `hooks/useProjects.ts` (useState + service calls, no react-query)
- **Thêm:** `hooks/useDocumentVersions.ts`, `hooks/useDocuments.ts` (createDocument only; no useProjectDocuments vì không có list endpoint)

### Components / UI

- **Có:** Button, Input, Typography, Stack, Modal, Badge, Spinner, Select, Textarea, Box, Link, Switch — `@/components`
- **Có:** Table pattern: `<table>` + thead/tbody (projects page) — reuse inline
- **Có:** Toast: `sonner` (toast.success, toast.error) — `app/Providers.tsx`
- **Có:** Empty state pattern: Box + Typography tone="muted" + Button CTA
- **Thiếu:** Không — không tạo component mới

### BE gap

- **GET /projects/:projectId/documents:** Không có trong repo/README → Documents list page: empty state + CTA Create + banner "Listing documents not available yet (missing endpoint)". Sau create redirect /documents/:documentId.
