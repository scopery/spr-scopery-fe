# Traceability — FE trang & API đang dùng

Tóm tắt các trang Traceability và service/endpoint FE đã implement. Chi tiết contract API xem **docs/API_DOCUMENTATION.md** (mục 10) và **docs/TRACEABILITY_API_BE.md**.

---

## Trang & Route

| Trang | Route | File |
|-------|--------|------|
| Landscape (Nodes + Links) | `/org/[orgId]/landscape` | `app/org/[orgId]/landscape/page.tsx` |
| Project Scope | `/org/[orgId]/projects/[projectId]/scope` | `app/org/[orgId]/projects/[projectId]/scope/page.tsx` |
| Org Actors | `/org/[orgId]/actors` | `app/org/[orgId]/actors/page.tsx` |
| Requirements | `/org/[orgId]/projects/[projectId]/requirements` | `app/org/[orgId]/projects/[projectId]/requirements/page.tsx` |
| Trace (view + trace links) | `/org/[orgId]/projects/[projectId]/trace` | `app/org/[orgId]/projects/[projectId]/trace/page.tsx` |

Route helpers: `constants/routes.ts` — `ROUTES.org.landscape`, `scope`, `actors`, `requirements`, `trace`.

---

## Service → Endpoint

### Landscape (nodes, node-links)

**Service:** `services/landscape.service.ts`  
**Endpoints:** `constants/endpoints.ts` → `LANDSCAPE_ENDPOINTS`

| Hàm | Method | Endpoint |
|-----|--------|----------|
| listOrgNodes | GET | `/api/v2/orgs/:orgId/nodes?type=&status=` |
| createOrgNode | POST | `/api/v2/orgs/:orgId/nodes` |
| patchOrgNode | PATCH | `/api/v2/orgs/:orgId/nodes/:nodeId` |
| archiveOrgNode | DELETE | `/api/v2/orgs/:orgId/nodes/:nodeId` |
| listOrgNodeLinks | GET | `/api/v2/orgs/:orgId/node-links` |
| createOrgNodeLink | POST | `/api/v2/orgs/:orgId/node-links` |
| patchNodeLink | PATCH | `/api/v2/orgs/:orgId/node-links/:linkId` |
| deleteOrgNodeLink | DELETE | `/api/v2/orgs/:orgId/node-links/:linkId` |

### Org Actors

**Service:** `services/actors.service.ts`  
**Endpoints:** `ACTORS_ENDPOINTS`

| Hàm | Method | Endpoint |
|-----|--------|----------|
| listOrgActors | GET | `/api/v2/orgs/:orgId/actors` |
| createOrgActor | POST | `/api/v2/orgs/:orgId/actors` |
| patchOrgActor | PATCH | `/api/v2/orgs/:orgId/actors/:actorId` |

### Project (scope, requirements, trace, trace-links)

**Service:** `services/project.service.ts`  
**Endpoints:** `PROJECT_ENDPOINTS`

| Hàm | Method | Endpoint |
|-----|--------|----------|
| getProjectScope | GET | `.../scope` |
| putProjectScope | PUT | `.../scope` |
| getTraceView | GET | `.../trace` |
| listRequirements | GET | `.../requirements` |
| createRequirement | POST | `.../requirements` |
| patchRequirement | PATCH | `.../requirements/:requirementId` |
| putRequirementActors | PUT | `.../requirements/:requirementId/actors` |
| putRequirementModules | PUT | `.../requirements/:requirementId/modules` |
| listTraceLinks | GET | `.../trace-links` |
| createTraceLink | POST | `.../trace-links` |
| patchTraceLink | PATCH | `.../trace-links/:linkId` |
| deleteTraceLink | DELETE | `.../trace-links/:linkId` |

---

## Error handling

**File:** `lib/errorHandling.ts`  
FE map các `code` 409/422 từ BE sang message toast, gồm: `NODE_*`, `LINK_EXISTS`, `SCOPE_NODE_WRONG_ORG`, `ACTOR_KEY_EXISTS`, `REQ_CODE_EXISTS`, `TRACE_LINK_EXISTS`.

---

## Trạng thái FE

- **Landscape:** Nodes (tree, filter, Create/Edit/Archive) + Links (bảng, Create/Edit/Delete; Edit = PATCH link_type + note).
- **Scope:** 3 bucket (primary / impacted / out_of_scope), PUT replace-all.
- **Actors:** List, Create, Edit (PATCH).
- **Requirements:** List, Create, Edit, Assign actors & modules (PUT actors, PUT modules).
- **Trace:** Full trace view (GET trace) + Manage trace links (list, Create, Edit, Delete; 409 TRACE_LINK_EXISTS khi trùng).

Nếu BE chưa có endpoint tương ứng, FE sẽ nhận 404/501 và hiển thị lỗi từ `lib/errorHandling`.
