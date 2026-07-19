# DocumentHub Coverage Register (§1)

> Endpoint-level status for Document Hub. Statuses follow WAVE4_COVERAGE_TRACKER legend.
> Update this file when wiring changes — do not invent `UI_TESTED` without Vitest.

| # | Method | Path | Surface | Status | Notes |
|---|---|---|---|---|---|
| 1 | POST | `/projects/{projectId}/documents` | DocumentWorkbenchView | `UI_IMPLEMENTED` | `createProjectDocument` |
| 2 | GET | `/projects/{projectId}/documents` | DocumentWorkbenchView | `UI_TESTED` | hook test `useProjectDocumentList` |
| 3 | GET | `/projects/{projectId}/documents/search` | DocumentWorkbenchView | `UI_IMPLEMENTED` | query-driven in hook |
| 4 | GET | `/projects/{projectId}/documents/{id}` | Inspector | `UI_IMPLEMENTED` | `useDocumentInspector` |
| 5 | GET | `/projects/{projectId}/documents/{id}/masked` | Inspector | `UI_IMPLEMENTED` | masked toggle |
| 6 | POST | `/projects/{projectId}/documents/{id}/approve` | Inspector | `UI_IMPLEMENTED` | PermissionAwareAction |
| 7 | POST | `.../versions` (legacy) | — | `APPROVED_NON_UI_EXCEPTION` | prefer presigned |
| 8 | POST | `.../versions/presigned-upload` | DocumentVersionUploadPanel | `UI_IMPLEMENTED` | DOC-03 |
| 9 | POST | `.../versions/{id}/complete-upload` | DocumentVersionUploadPanel | `UI_IMPLEMENTED` | DOC-03 |
| 10 | POST | `.../versions/{id}/presigned-download` | DocumentVersionUploadPanel | `UI_IMPLEMENTED` | Download button |
| 11 | GET | `.../versions` | DocumentVersionUploadPanel | `UI_IMPLEMENTED` | |
| 12 | GET | `.../versions/{id}` | — | `MAPPED` | metadata detail TBD |
| 13 | POST | `/document-folders` | DocumentWorkbenchView | `UI_IMPLEMENTED` | |
| 14 | GET | `/document-folders` | DocumentWorkbenchView | `UI_TESTED` | hook test |
| 15 | GET | `/document-folders/{id}` | — | `MAPPED` | list covers primary UX |
| 16 | PATCH | `/document-folders/{id}/archive` | DocumentWorkbenchView | `UI_IMPLEMENTED` | |
| 17 | POST | `.../shares` | Inspector | `UI_IMPLEMENTED` | LINK share |
| 18 | GET | `.../shares` | Inspector | `UI_IMPLEMENTED` | |
| 19 | POST | `.../shares/{id}/revoke` | Inspector | `UI_IMPLEMENTED` | |
| 20 | POST | `/workspaces/{id}/document-templates` | WorkspaceDocumentTemplatesView | `UI_IMPLEMENTED` | |
| 21 | GET | `/workspaces/{id}/document-templates` | WorkspaceDocumentTemplatesView | `UI_IMPLEMENTED` | |
| 22 | GET | `/workspaces/{id}/document-templates/{id}` | — | `MAPPED` | detail TBD |
| 23 | POST | `/generated-documents` | DocumentVersionUploadPanel | `UI_IMPLEMENTED` | Queue generation CTA |
| 24 | GET | `/generated-documents` | DocumentVersionUploadPanel | `UI_IMPLEMENTED` | |
| 25 | GET | `/generated-documents/{id}` | LongRunningJobPanel | `UI_IMPLEMENTED` | via list poll |
| 26 | POST | `/generated-documents/{id}/process` | API only | `MAPPED` | worker-oriented; API wired |
| 27 | POST | `/generated-documents/{id}/complete` | API only | `MAPPED` | worker-oriented; API wired |
| — | Org/workspace/personal scoped docs | Scope switcher | `CONTRACT_BLOCKED` | BE gap §21 — project scope only |

**Routes**

- `/workspace/{ws}/projects/{p}/documents/workbench` → `DocumentWorkbenchView`
- `/workspace/{ws}/settings/knowledge/templates` → `WorkspaceDocumentTemplatesView`
