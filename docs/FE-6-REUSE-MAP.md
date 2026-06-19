> **Out of date (2026):** This document references code removed during Safe Dead Code Cleanup (orphan hooks/services/components). See `CLAUDE.md` for current architecture.

# FE-6 Traceability — Reuse Map

## Repo Scan Summary

**Scope:** Project Trace page `/org/:orgId/projects/:projectId/trace`, Item Detail Trace tab; derive trace from Items + Outline (no mock; no invented endpoints).

---

## Reuse Map — Có sẵn → path → dùng cho

| Có sẵn                                                                           | Path                            | Dùng cho                                                              |
| -------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **ROUTES.org.project, .documents, .items, .documentVersionOutline, .itemDetail** | `constants/routes.ts`           | Nav, back links, Go to Section                                        |
| **DOCUMENT_ENDPOINTS.outlineSections, outlineMapItem, outlineUnmapItem**         | `constants/endpoints.ts`        | List sections, map/unmap item (no new endpoints)                      |
| **ITEM_ENDPOINTS.listInProject**                                                 | `constants/endpoints.ts`        | Items list for trace                                                  |
| **OutlineSection, SectionItemMapping**                                           | `types/outline.ts`              | Outline types; extend for section with optional items in API response |
| **Item, ListItemsParams, ITEM\_\*\_OPTIONS**                                     | `types/item.ts`                 | Items table, filters                                                  |
| **Document, DocumentVersion**                                                    | `types/document.ts`             | Version selector (document + version)                                 |
| **apiClient**                                                                    | `lib/apiClient.ts`              | All API calls (Bearer + x-org-id in services)                         |
| **outline.service**                                                              | `services/outline.service.ts`   | listOutlineSections, mapItemToSection, unmapItemFromSection           |
| **items.service**                                                                | `services/items.service.ts`     | listProjectItems                                                      |
| **documents.service**                                                            | `services/documents.service.ts` | listProjectDocuments, listVersions, getDocument                       |
| **useOutlineSections**                                                           | `hooks/useOutlineSections.ts`   | Outline tree for selected document/version                            |
| **useItemsList**                                                                 | `hooks/useItemsList.ts`         | Project items (with refetch)                                          |
| **useDocumentVersions**                                                          | `hooks/useDocumentVersions.ts`  | Version dropdown options                                              |
| **useDocumentsList**                                                             | `hooks/useDocumentsList.ts`     | Documents in project (for doc selector)                               |
| **getDefaultOrgId, setDefaultOrgId**                                             | `hooks/useOrganizations`        | orgId                                                                 |
| **Button, Typography, Stack, Box, Select, Input, Spinner, Link, Modal, Badge**   | `@/components`                  | Trace UI                                                              |
| **toast**                                                                        | `sonner`                        | Success/error after map/unmap                                         |

---

## Thiếu → tạo mới + lý do

| Thiếu                      | Tạo mới                                                          | Lý do                                                                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Route trace**            | `ROUTES.org.trace(orgId, projectId)` trong `constants/routes.ts` | Spec: `/org/:orgId/projects/:projectId/trace`                                                                                                                         |
| **Trace types**            | `types/trace.ts`                                                 | TraceSectionRef, ItemTrace, TraceSummary, TraceFilters (spec); OutlineSectionWithItems for API response shape when BE returns section items                           |
| **Trace service**          | `services/trace.service.ts`                                      | getProjectTraceDerived (items + outline → byItem, bySection, summary); mapItemToSection / unmap delegate to outline.service (need documentId, versionId from context) |
| **useProjectTrace**        | `hooks/useProjectTrace.ts`                                       | Data: items + outline for selected doc/version, derive summary + byItem/bySection; filters client-side                                                                |
| **Trace page**             | `app/org/[orgId]/projects/[projectId]/trace/page.tsx`            | Version selector, summary cards, filters, Items table + Mapped sections panel, Go to Section, Map to Section, Unmap                                                   |
| **Item Trace tab content** | Trong `app/items/[itemId]/page.tsx`                              | Tab "Trace": version selector, list mapped sections, Map to section action                                                                                            |
| **Map-to-section modal**   | Component inline trong trace page (reuse Modal + tree select)    | Chọn section (tree) + confirm → mapItemToSection                                                                                                                      |

---

## Data derivation (no trace endpoint)

- **Nguồn:** GET project items + GET outline sections (document + version). BE hiện không trả `items` trong từng section (FE-5); khi BE thêm, response có thể là `section.items: { item_id: string }[]`.
- **Logic:** `getProjectTraceDerived(ctx, projectId, documentId, versionId)`: gọi listProjectItems + listOutlineSections; type sections as optional `items`; build section path từ tree (parent_id); build `itemId -> TraceSectionRef[]` và `sectionId -> itemId[]`; summary = total_items, mapped = unique itemIds có refs, coverage_pct.
- **Unmap:** BE đã có DELETE …/sections/:sectionId/items/:itemId → enable Unmap, gọi outline.service.unmapItemFromSection (cần documentId, versionId).

---

## QA checklist (sẽ đảm bảo)

- [ ] Reuse Map đúng; không tạo trùng constants/service/types.
- [ ] Không fetch/axios trong UI; mọi call qua service.
- [ ] Endpoints trong constants; không bịa trace endpoint.
- [ ] Trace derive từ items + outline thật; không mock.
- [ ] Map/Unmap qua outline.service; Unmap enable vì BE có endpoint.
- [ ] Go to Section → ROUTES.documentVersionOutline(…)?sectionId=…
- [ ] Coverage summary + filters (client-side) hoạt động.
