# Wave 4 API Contract — DocumentHub · Knowledge · EventRegistry · Governance · Quality · Reporting · AI Assistant · AI Planning · AI Recommendation · ClientPortal · ProjectNotification · Productivity · IntegrationHub · Traceability · Trust · ServiceSupport

> **Mục đích:** Tài liệu tham chiếu đầy đủ cho FE ráp UI Wave 4.
> **Swagger live:** `http://localhost:8080/swagger-ui.html`
> **OpenAPI JSON:** `http://localhost:8080/v3/api-docs`

---

## Conventions

Conventions giống Wave 2 & 3 — mọi response bọc `ApiResponse<T>`. Xem [WAVE2_API_CONTRACT.md](WAVE2_API_CONTRACT.md) để biết chi tiết về wrapper, auth, ký hiệu schema.

**Lưu ý đặc biệt Wave 4:**
- `Knowledge` module dùng thêm request headers: `X-Workspace-Id`, `X-Actor-Id`, `X-Acl-Tokens`
- `AI Assistant` dùng SSE (Server-Sent Events) cho streaming — endpoint `/stream` trả về `text/event-stream`
- `ClientPortal` có 2 nhóm path: internal (`/api/v1/projects/...`) và portal-facing (`/api/v1/portal/...`)
- Mọi path đều có prefix `/api/v1/` — đã được đồng bộ

---

## Module Index

| # | Module | Base path chính | Controllers |
|---|---|---|---|
| [1](#1-documenthub) | DocumentHub | `/api/v1/projects/{projectId}/documents`, `/workspaces/{workspaceId}/document-templates` | 6 |
| [2](#2-knowledge) | Knowledge | `/api/v1/knowledge/...` | 7 |
| [3](#3-eventregistry) | EventRegistry | `/api/v1/event-definitions` | 1 |
| [4](#4-governance) | Governance | `/api/v1/projects/{projectId}/governance/...`, `/api/v1/governance/object-types` | 7 |
| [5](#5-quality) | Quality | `/api/v1/projects/{projectId}/...` | 15 |
| [6](#6-reporting) | Reporting | `/api/v1/projects/{projectId}/dashboard`, `/api/v1/reports/...` | 6 |
| [7](#7-ai-assistant) | AI Assistant | `/api/v1/ai-assistant/...` | 4 |
| [8](#8-ai-planning) | AI Planning | `/api/v1/projects/{projectId}/ai-planning/...` | 2 |
| [9](#9-ai-recommendation) | AI Recommendation | `/api/v1/ai-recommendations/...` | 4 |
| [10](#10-clientportal) | ClientPortal | `/api/v1/projects/{projectId}/...`, `/api/v1/portal/...` | 16 |
| [11](#11-projectnotification) | ProjectNotification | `/api/v1/projects/{projectId}/notification-...` | 4 |
| [12](#12-productivity) | Productivity | `/api/v1/search`, `/api/v1/workspaces/{workspaceId}/...` | 9 |
| [13](#13-integrationhub) | IntegrationHub | `/api/v1/workspaces/{workspaceId}/integrations/...` | 17 |
| [14](#14-traceability) | Traceability | `/api/v1/workspaces/{workspaceId}/...`, `/api/v1/projects/{projectId}/requirements` | 15 |
| [15](#15-trust--compliance) | Trust | `/api/v1/workspaces/{workspaceId}/trust/...` | 16 |
| [16](#16-servicesupport) | ServiceSupport | `/api/v1/workspaces/{workspaceId}/support/...` | 23 |

---

# 1. DocumentHub

## 1.1 Documents

**Base:** `/api/v1/projects/{projectId}/documents`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/projects/{projectId}/documents` | Tạo document |
| `GET` | `/api/v1/projects/{projectId}/documents` | Danh sách |
| `GET` | `/api/v1/projects/{projectId}/documents/search?q=` | Full-text search (trả masked snippets) |
| `GET` | `/api/v1/projects/{projectId}/documents/{documentId}` | Lấy theo ID |
| `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/masked` | Lấy với sensitive fields bị mask |
| `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/approve` | Phê duyệt |

**POST — Request body**
```json
{
  "title": "SRS v1.0",
  "code": "DOC-SRS-001",
  "description": "System Requirements Specification",
  "documentTypeCode": "SRS",
  "folderId": "<uuid>"
}
```

**DocumentResponse** — fields chính:

| Field | Type |
|---|---|
| `id` | UUID |
| `projectId` | UUID |
| `code` | String |
| `title` | String |
| `status` | String (`DRAFT` \| `APPROVED` \| `ARCHIVED`) |
| `currentVersionId` | UUID |
| `createdAt` | Instant |

---

## 1.2 Document Versions

**Base:** `/api/v1/projects/{projectId}/documents/{documentId}/versions`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../versions` | Upload trực tiếp (legacy — dùng storageKey) |
| `POST` | `.../versions/presigned-upload` | Lấy presigned URL để upload thẳng lên storage |
| `POST` | `.../versions/{versionId}/complete-upload` | Xác nhận upload hoàn tất |
| `POST` | `.../versions/{versionId}/presigned-download` | Lấy presigned URL để download |
| `GET` | `.../versions` | Danh sách versions |
| `GET` | `.../versions/{versionId}` | Lấy metadata theo ID |

**POST /presigned-upload — Request body**
```json
{
  "fileName": "SRS-v1.pdf",
  "contentType": "application/pdf",
  "changeNotes": "Initial upload"
}
```

**PresignedUploadResponse**
```json
{
  "versionId": "<uuid>",
  "uploadUrl": "https://storage.example.com/...",
  "objectKey": "documents/...",
  "storageProvider": "S3",
  "expiresAt": "<instant>"
}
```

**DocumentVersionResponse** — fields chính: `id`, `documentId`, `versionNumber`, `fileName`, `contentType`, `fileSizeBytes`, `status` (`PENDING` | `AVAILABLE` | `FAILED`), `uploadedAt`

---

## 1.3 Document Folders

**Base:** `/api/v1/projects/{projectId}/document-folders`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../document-folders` | Tạo folder |
| `GET` | `.../document-folders` | Danh sách |
| `GET` | `.../document-folders/{folderId}` | Lấy theo ID |
| `PATCH` | `.../document-folders/{folderId}/archive` | Lưu trữ |

**POST — Request body:** `{ "parentFolderId": null, "name": "Requirements", "description": null, "sortOrder": 1 }`

**DocumentFolderResponse** — fields: `id`, `projectId`, `parentFolderId`, `name`, `status`, `sortOrder`, `createdAt`

---

## 1.4 Document Shares

**Base:** `/api/v1/projects/{projectId}/documents/{documentId}/shares`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../shares` | Tạo share token/grant |
| `GET` | `.../shares` | Danh sách |
| `POST` | `.../shares/{shareId}/revoke` | Thu hồi |

**POST — Request body**
```json
{
  "shareType": "LINK",
  "granteeType": "PORTAL_ACCOUNT",
  "granteeId": "<uuid>",
  "expiresAt": "<instant>"
}
```

`shareType` values: `LINK` | `DIRECT_GRANT`

---

## 1.5 Document Templates

**Base:** `/api/v1/workspaces/{workspaceId}/document-templates`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../document-templates` | Tạo template |
| `GET` | `.../document-templates` | Danh sách |
| `GET` | `.../document-templates/{templateId}` | Lấy theo ID |

**POST — Request body:** `{ "code": "TMPL-SRS", "name": "SRS Template", "description": null, "category": "TECHNICAL" }`

---

## 1.6 Generated Document Jobs

**Base:** `/api/v1/projects/{projectId}/generated-documents`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../generated-documents` | Queue generation job |
| `GET` | `.../generated-documents` | Danh sách jobs |
| `GET` | `.../generated-documents/{jobId}` | Lấy theo ID |
| `POST` | `.../generated-documents/{jobId}/process` | Claim + render template + store (body: `variables: Map`) |
| `POST` | `.../generated-documents/{jobId}/complete` | Mark completed (body: `outputDocumentId`) |

**GeneratedDocumentJobResponse** — fields: `id`, `projectId`, `templateId`, `jobType`, `status` (`QUEUED` | `PROCESSING` | `COMPLETED` | `FAILED`), `outputDocumentId`, `createdAt`, `completedAt`

---

# 2. Knowledge

> **Headers đặc biệt:** `X-Workspace-Id: <uuid>` (required cho indexing/retrieval), `X-Actor-Id: <uuid>` (optional), `X-Acl-Tokens: token1,token2` (optional, cho access control)

## 2.1 Document Types

**Base:** `/api/v1/knowledge/document-types`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/knowledge/document-types` | Tạo document type |
| `POST` | `/api/v1/knowledge/document-types/system` | Tạo system-level document type |
| `POST` | `/api/v1/knowledge/document-types/workspace` | Tạo workspace-level document type |
| `GET` | `/api/v1/knowledge/document-types?keyword=&organizationId=&workspaceId=&documentScope=&status=&builtIn=&includeArchived=&page=&size=` | Tìm kiếm (paginated) |
| `GET` | `/api/v1/knowledge/document-types/{id}` | Lấy theo ID |
| `PUT` | `/api/v1/knowledge/document-types/{id}` | Cập nhật |
| `PATCH` | `/api/v1/knowledge/document-types/{id}/activate` | Kích hoạt |
| `PATCH` | `/api/v1/knowledge/document-types/{id}/deactivate` | Vô hiệu hoá |
| `PATCH` | `/api/v1/knowledge/document-types/{id}/archive` | Lưu trữ |
| `PATCH` | `/api/v1/knowledge/document-types/{id}/soft-delete` | Xoá mềm |

**POST — Request body**
```json
{
  "code": "SRS",
  "name": "System Requirements Specification",
  "description": null,
  "documentScope": "PROJECT",
  "organizationId": null,
  "workspaceId": "<uuid>",
  "category": "TECHNICAL",
  "defaultClassification": "INTERNAL",
  "defaultReviewCycleDays": 90,
  "defaultTemplateCode": "TMPL-SRS",
  "metadataSchemaJson": null
}
```

`documentScope` values: `GLOBAL` | `ORGANIZATION` | `WORKSPACE` | `PROJECT`

**DocumentTypeResponse** — fields chính: `id`, `code`, `name`, `documentScope`, `status`, `category`, `defaultClassification`, `builtIn`, `isSystem`, `createdAt`, `updatedAt`

---

## 2.2 Document Type Fields

**Base:** `/api/v1/knowledge/document-types/{documentTypeId}/fields`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../fields` | Thêm custom field |
| `GET` | `.../fields` | Danh sách |
| `GET` | `.../fields/{fieldId}` | Lấy theo ID |
| `PUT` | `.../fields/{fieldId}` | Cập nhật |
| `PUT` | `.../fields/reorder` | Sắp xếp lại (body: `orderedFieldIds: [uuid...]`) |
| `PATCH` | `.../fields/{fieldId}/activate` | Kích hoạt |
| `PATCH` | `.../fields/{fieldId}/deactivate` | Vô hiệu hoá |
| `PATCH` | `.../fields/{fieldId}/archive` | Lưu trữ |

**POST — Request body**
```json
{
  "fieldKey": "review_date",
  "label": "Review Date",
  "description": null,
  "dataType": "DATE",
  "required": false,
  "systemField": false,
  "optionsJson": null,
  "validationJson": null,
  "defaultValueJson": null,
  "displayOrder": 1
}
```

`dataType` values: `TEXT` | `NUMBER` | `DATE` | `BOOLEAN` | `SELECT` | `MULTISELECT` | `URL`

---

## 2.3 Document Classifications

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/knowledge/document-classifications` | Danh sách tất cả classifications |

**DocumentClassificationResponse** — fields: `code`, `name`

---

## 2.4 Knowledge Graph

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/knowledge/graph/nodes/{nodeId}/related?depth=1&limit=20` | Lấy related nodes (requires `X-Acl-Tokens` header) |

**GraphRelatedResponse**
```json
{
  "rootNodeId": "<uuid>",
  "nodes": [
    { "id": "<uuid>", "nodeType": "DOCUMENT", "sourceRefId": "<uuid>", "title": "SRS v1.0", "nodeStatus": "ACTIVE" }
  ],
  "edges": [
    { "id": "<uuid>", "fromNodeId": "<uuid>", "toNodeId": "<uuid>", "edgeType": "REFERENCES", "edgeStatus": "ACTIVE" }
  ]
}
```

---

## 2.5 Knowledge Sources

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/knowledge/sources/{sourceId}` | Lấy source metadata |
| `GET` | `/api/v1/knowledge/sources/{sourceId}/chunks?page=&size=` | Lấy chunks (paginated) |
| `POST` | `/api/v1/knowledge/sources/{sourceId}/reindex` | Reindex source (header: `X-Actor-Id`) |

**KnowledgeSourceResponse** — fields: `id`, `workspaceId`, `projectId`, `sourceType`, `sourceRefId`, `title`, `language`, `classification`, `status`, `lastIndexedAt`

---

## 2.6 Knowledge Indexing

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/knowledge/indexing/projects/{projectId}/reindex` | Reindex toàn project (header: `X-Workspace-Id`) |
| `POST` | `/api/v1/knowledge/indexing/workspaces/{workspaceId}/reindex` | Reindex toàn workspace |
| `GET` | `/api/v1/knowledge/indexing/jobs/{jobId}` | Lấy job status |

**IndexJobResponse** — fields: `jobId`, `workspaceId`, `projectId`, `jobType`, `jobStatus` (`QUEUED` | `RUNNING` | `COMPLETED` | `FAILED`), `processedCount`, `successCount`, `failureCount`, `queuedAt`

---

## 2.7 Knowledge Retrieval

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/knowledge/retrieval/search` | Semantic search (headers: `X-Workspace-Id`, `X-Actor-Id`, `X-Acl-Tokens`) |

**POST — Request body:** `{ "query": "authentication flow", "projectId": "<uuid>", "topK": 10 }`

**RetrievalResponse** — fields: `workspaceId`, `projectId`, `results: [{ sourceId, chunkId, score, plainText, headingPath }]`, `durationMs`

---

# 3. EventRegistry

**Base:** `/api/v1/event-definitions`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/event-definitions` | Tạo event definition |
| `PUT` | `/api/v1/event-definitions/{id}` | Cập nhật |
| `GET` | `/api/v1/event-definitions/{id}` | Lấy chi tiết |
| `GET` | `/api/v1/event-definitions?keyword=&sourceSystem=&eventKey=&status=&page=&size=` | Tìm kiếm |
| `PATCH` | `/api/v1/event-definitions/{id}/activate` | Kích hoạt |
| `PATCH` | `/api/v1/event-definitions/{id}/deactivate` | Vô hiệu hoá |
| `PATCH` | `/api/v1/event-definitions/{id}/deprecate` | Deprecated (body: `replacementEventDefinitionId`, `reason`) |
| `PUT` | `/api/v1/event-definitions/{id}/variables` | Upsert toàn bộ variables |
| `GET` | `/api/v1/event-definitions/{id}/variables` | Danh sách variables |

**POST — Request body**
```json
{
  "code": "PROJECT_TASK_COMPLETED",
  "name": "Task Completed",
  "sourceSystem": "SCOPERY",
  "eventKey": "project.task.completed",
  "description": null,
  "inputSchema": null,
  "outputSchema": null,
  "dataClassification": "INTERNAL",
  "ownerModule": "project"
}
```

**EventDefinitionDetailResponse** — fields chính: `id`, `code`, `name`, `sourceSystem`, `eventKey`, `status`, `eventVersion`, `inputSchema`, `outputSchema`, `dataClassification`, `deprecatedAt`, `replacementEventDefinitionId`, `variables: [{ variablePath, variableLabel, variableType, required, sensitive }]`

`status` values: `ACTIVE` | `INACTIVE` | `DEPRECATED`

---

# 4. Governance

## 4.1 Governed Object Types (catalog)

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/governance/object-types` | Danh sách loại object có thể govern |
| `GET` | `/api/v1/governance/object-types/{objectTypeCode}` | Lấy theo code |

**GovernedObjectTypeResponse** — fields: `objectTypeCode`, `ownershipSupported`, `versioningSupported`, `lockingSupported`, `restoreSupported`, `enabled`

---

## 4.2 Governance Policy (workspace-level)

**Base:** `/api/v1/workspaces/{workspaceId}/governance/policies`

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../governance/policies` | Danh sách policies |
| `PUT` | `.../governance/policies` | Upsert policy |

**PUT — Request body**
```json
{
  "objectTypeCode": "DOCUMENT",
  "versioningMode": "AUTO",
  "versionOnUpdate": true,
  "lockOnFinalize": true,
  "allowRestore": true,
  "allowOwnerGrant": false,
  "baselineGuardMode": "WARN",
  "auditLevel": "FULL"
}
```

`versioningMode` values: `AUTO` | `MANUAL` | `DISABLED`
`baselineGuardMode` values: `BLOCK` | `WARN` | `DISABLED`

---

## 4.3 Ownership

**Base:** `/api/v1/projects/{projectId}/governance/ownership`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../governance/ownership/assign` | Gán owner |
| `POST` | `.../governance/ownership/transfer` | Chuyển owner |
| `POST` | `.../governance/ownership/revoke` | Thu hồi (`?objectTypeCode=&targetId=`) |
| `GET` | `.../governance/ownership?objectTypeCode=&targetId=` | Lấy ownership hiện tại |
| `GET` | `.../governance/ownership/list` | Danh sách tất cả ownership trong project |

**Request body (assign/transfer)**
```json
{
  "objectTypeCode": "DOCUMENT",
  "targetId": "<uuid>",
  "ownerTargetType": "USER",
  "ownerTargetId": "<uuid>"
}
```

---

## 4.4 Locks & Finalization

**Base:** `/api/v1/projects/{projectId}/governance/locks`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../governance/locks` | Tạo lock thủ công |
| `POST` | `.../governance/locks/{lockId}/release` | Mở lock |
| `POST` | `.../governance/locks/{objectTypeCode}/{targetId}/finalize` | Finalize object (body: `reason`) |
| `POST` | `.../governance/locks/{objectTypeCode}/{targetId}/unfinalize` | Unfinalize |

---

## 4.5 Access Grants

**Base:** `/api/v1/projects/{projectId}/governance/access-grants`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../access-grants` | Cấp quyền truy cập object |
| `GET` | `.../access-grants?objectTypeCode=&targetId=` | Danh sách |
| `POST` | `.../access-grants/{grantId}/revoke` | Thu hồi |

**POST — Request body**
```json
{
  "objectTypeCode": "DOCUMENT",
  "targetId": "<uuid>",
  "granteeType": "USER",
  "granteeId": "<uuid>",
  "grantRole": "REVIEWER"
}
```

---

## 4.6 Versioning & Snapshots

**Base:** `/api/v1/projects/{projectId}/governance`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../governance/versions` | Tạo version snapshot |
| `GET` | `.../governance/versions?objectTypeCode=&targetId=` | Danh sách versions |
| `GET` | `.../governance/snapshots/{snapshotId}` | Lấy snapshot JSON |
| `GET` | `.../governance/snapshots/diff?leftSnapshotId=&rightSnapshotId=` | So sánh 2 snapshots |
| `POST` | `.../governance/restore` | Khôi phục từ version |
| `POST` | `.../governance/baseline-guard/check` | Kiểm tra có được phép thay đổi không |

---

## 4.7 Governance Reports

**Base:** `/api/v1/projects/{projectId}/governance/reports`

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../reports/pack` | Report tổng hợp (ownership + locks + access grants) |
| `GET` | `.../reports/ownership` | Ownership report |
| `GET` | `.../reports/access-grants` | Access grant report |
| `GET` | `.../reports/version-history` | Version history report |
| `GET` | `.../reports/locked-objects` | Locked objects report |
| `GET` | `.../reports/restore-activity` | Restore activity report |

---

# 5. Quality

## 5.1 Quality Plan

**Base:** `/api/v1/projects/{projectId}/quality-plans`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../quality-plans` | Tạo quality plan |
| `GET` | `.../quality-plans` | Danh sách |
| `GET` | `.../quality-plans/{qualityPlanId}` | Lấy theo ID |
| `PUT` | `.../quality-plans/{qualityPlanId}` | Cập nhật |
| `POST` | `.../quality-plans/{qualityPlanId}/approve` | Phê duyệt |
| `POST` | `.../quality-plans/{qualityPlanId}/mark-current` | Đặt làm current |
| `PATCH` | `.../quality-plans/{qualityPlanId}/archive` | Lưu trữ |

**POST — Request body:** `{ "code": "QP-001", "name": "Q3 Quality Plan", "description": null, "qualityObjectives": "...", "testStrategy": "...", "entryCriteria": "...", "exitCriteria": "..." }`

---

## 5.2 Test Plans & Suites

**Test Plans — Base:** `/api/v1/projects/{projectId}/test-plans`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../test-plans` | Tạo test plan |
| `GET` | `.../test-plans` | Danh sách |
| `GET` | `.../test-plans/{testPlanId}` | Lấy theo ID |
| `POST` | `.../test-plans/{testPlanId}/approve` | Phê duyệt |
| `PATCH` | `.../test-plans/{testPlanId}/archive` | Lưu trữ |

**POST — Request body:** `{ "code": "TP-001", "name": "Sprint 1 Test Plan", "testLevel": "INTEGRATION", "qualityPlanId": "<uuid>", "releasePackageId": "<uuid>" }`

**Test Suites — Base:** `/api/v1/projects/{projectId}/test-plans/{testPlanId}/suites`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../suites` | Tạo suite |
| `GET` | `.../suites` | Danh sách |
| `GET` | `.../suites/{suiteId}` | Lấy theo ID |
| `PATCH` | `.../suites/{suiteId}/archive` | Lưu trữ |

**POST — Request body:** `{ "name": "Auth Module", "description": null, "deliverableId": "<uuid>", "scopeItemId": "<uuid>", "sortOrder": 1 }`

---

## 5.3 Test Cases & Steps

**Test Cases — Base:** `/api/v1/projects/{projectId}/test-cases`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../test-cases` | Tạo test case |
| `GET` | `.../test-cases` | Danh sách |
| `GET` | `.../test-cases/{testCaseId}` | Lấy theo ID |
| `POST` | `.../test-cases/{testCaseId}/approve` | Phê duyệt |
| `PATCH` | `.../test-cases/{testCaseId}/archive` | Lưu trữ |

**POST — Request body:** `{ "testSuiteId": "<uuid>", "code": "TC-001", "title": "Login with valid credentials", "type": "FUNCTIONAL", "priority": "HIGH", "preconditions": "User exists", "expectedResult": "Redirect to dashboard" }`

`type` values: `FUNCTIONAL` | `REGRESSION` | `PERFORMANCE` | `SECURITY` | `UAT`

**Test Steps — Base:** `/api/v1/projects/{projectId}/test-cases/{testCaseId}/steps`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../steps` | Thêm step |
| `GET` | `.../steps` | Danh sách |
| `GET` | `.../steps/{stepId}` | Lấy theo ID |
| `PATCH` | `.../steps/{stepId}/archive` | Lưu trữ |

**POST — Request body:** `{ "stepOrder": 1, "actionText": "Enter username and password", "expectedResult": "Fields accept input", "dataNotes": null }`

**Test Coverage — Base:** `/api/v1/projects/{projectId}/test-cases/{testCaseId}/coverage`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../coverage` | Link test case tới requirement/scope item |
| `GET` | `.../coverage` | Danh sách |
| `PATCH` | `.../coverage/{coverageId}/archive` | Xoá link |

**POST — Request body:** `{ "targetType": "REQUIREMENT", "targetId": "<uuid>", "coverageType": "VERIFIES" }`

---

## 5.4 Test Runs

**Base:** `/api/v1/projects/{projectId}/test-runs`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../test-runs` | Tạo test run |
| `GET` | `.../test-runs` | Danh sách |
| `GET` | `.../test-runs/{testRunId}` | Lấy theo ID |
| `POST` | `.../test-runs/{testRunId}/start` | Bắt đầu |
| `POST` | `.../test-runs/{testRunId}/complete` | Hoàn thành |
| `POST` | `.../test-runs/{testRunId}/cancel` | Huỷ |
| `POST` | `.../test-runs/{testRunId}/case-results` | Ghi nhận kết quả test case |
| `GET` | `.../test-runs/{testRunId}/case-results` | Danh sách kết quả |

**POST /test-runs — Request body:** `{ "name": "Sprint 1 Regression", "runType": "REGRESSION", "testPlanId": "<uuid>", "testSuiteId": null, "releasePackageId": "<uuid>" }`

**POST /case-results — Request body:** `{ "testCaseId": "<uuid>", "resultStatus": "PASSED", "actualResult": "Redirected to dashboard successfully" }`

`resultStatus` values: `PASSED` | `FAILED` | `BLOCKED` | `SKIPPED` | `NOT_RUN`

---

## 5.5 Defects

**Base:** `/api/v1/projects/{projectId}/defects`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../defects` | Tạo defect |
| `GET` | `.../defects` | Danh sách |
| `GET` | `.../defects/{defectId}` | Lấy theo ID |
| `PUT` | `.../defects/{defectId}` | Cập nhật |
| `POST` | `.../defects/{defectId}/triage` | Triage |
| `POST` | `.../defects/{defectId}/assign` | Gán (body: `assignedToUserId`) |
| `POST` | `.../defects/{defectId}/mark-fixed` | Đánh dấu đã fix |
| `POST` | `.../defects/{defectId}/ready-for-retest` | Sẵn sàng retest |
| `POST` | `.../defects/{defectId}/verify` | Verify |
| `POST` | `.../defects/{defectId}/close` | Đóng (body: `resolutionType`, `resolutionNote`) |
| `POST` | `.../defects/{defectId}/reopen` | Reopen (body: `reason`) |
| `PATCH` | `.../defects/{defectId}/archive` | Lưu trữ |

**POST — Request body**
```json
{
  "title": "Login fails with correct credentials on Firefox",
  "code": "BUG-042",
  "category": "FUNCTIONAL",
  "severity": "HIGH",
  "priority": "P1",
  "reproductionSteps": "1. Open Firefox\n2. Enter valid credentials\n3. Click Login",
  "expectedResult": "Redirect to dashboard",
  "actualResult": "Error 500",
  "sourceTestCaseResultId": "<uuid>"
}
```

`severity` values: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`
`status` flow: `NEW` → `TRIAGED` → `IN_PROGRESS` → `FIXED` → `READY_FOR_RETEST` → `VERIFIED` → `CLOSED`

**Defect Links — Base:** `/api/v1/projects/{projectId}/defects/{defectId}/links`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../links` | Link defect tới task/requirement |
| `GET` | `.../links` | Danh sách |
| `PATCH` | `.../links/{linkId}/archive` | Xoá link |

---

## 5.6 Releases

**Release Packages — Base:** `/api/v1/projects/{projectId}/releases`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../releases` | Tạo release package |
| `GET` | `.../releases` | Danh sách |
| `GET` | `.../releases/{releasePackageId}` | Lấy theo ID |
| `POST` | `.../releases/{releasePackageId}/check-readiness` | Kiểm tra readiness |
| `POST` | `.../releases/{releasePackageId}/mark-ready` | Đánh dấu sẵn sàng |
| `POST` | `.../releases/{releasePackageId}/mark-released` | Đánh dấu đã release |
| `POST` | `.../releases/{releasePackageId}/mark-rolled-back` | Đánh dấu rollback |
| `PATCH` | `.../releases/{releasePackageId}/archive` | Lưu trữ |

**POST — Request body:** `{ "code": "REL-1.0.0", "versionLabel": "v1.0.0", "name": "Phase 1 Release", "releaseType": "MAJOR", "plannedReleaseDate": "2026-09-30" }`

**Release Items — Base:** `/api/v1/projects/{projectId}/releases/{releasePackageId}/items`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../items` | Thêm item vào release |
| `GET` | `.../items` | Danh sách |
| `PATCH` | `.../items/{itemId}/archive` | Xoá |

---

## 5.7 Deployment

**Deployment Environments — Base:** `/api/v1/projects/{projectId}/deployment-environments`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../deployment-environments` | Tạo environment |
| `GET` | `.../deployment-environments` | Danh sách |
| `GET` | `.../deployment-environments/{envId}` | Lấy theo ID |
| `PATCH` | `.../deployment-environments/{envId}/archive` | Lưu trữ |

**POST — Request body:** `{ "code": "PROD", "name": "Production", "environmentType": "PRODUCTION", "description": null }`

`environmentType` values: `DEV` | `QA` | `UAT` | `STAGING` | `PRODUCTION`

**Deployment Records — Base:** `/api/v1/projects/{projectId}/deployments`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../deployments` | Tạo deployment record |
| `GET` | `.../deployments` | Danh sách |
| `GET` | `.../deployments/{deploymentId}` | Lấy theo ID |
| `POST` | `.../deployments/{deploymentId}/start` | Bắt đầu deploy |
| `POST` | `.../deployments/{deploymentId}/succeed` | Đánh dấu thành công |
| `POST` | `.../deployments/{deploymentId}/fail` | Đánh dấu thất bại (body: `failureReason`) |
| `POST` | `.../deployments/{deploymentId}/rollback` | Rollback (body: `rollbackReason`) |

**Rollback Plans — Base:** `/api/v1/projects/{projectId}/rollback-plans`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../rollback-plans` | Tạo rollback plan |
| `GET` | `.../rollback-plans` | Danh sách |
| `GET` | `.../rollback-plans/{planId}` | Lấy theo ID |
| `POST` | `.../rollback-plans/{planId}/approve` | Phê duyệt |

---

## 5.8 Quality Reports

**Base:** `/api/v1/projects/{projectId}/reports`

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../reports/quality-dashboard` | Dashboard tổng hợp |
| `GET` | `.../reports/defects` | Defect metrics |
| `GET` | `.../reports/release-readiness` | Release readiness |
| `GET` | `.../reports/test-execution` | Test execution stats |
| `GET` | `.../reports/test-coverage` | Coverage stats |
| `GET` | `.../reports/defect-aging` | Defect aging analysis |
| `GET` | `.../reports/deployment-history` | Deployment history |

Tất cả trả `Map<String, Object>` — cấu trúc dynamic theo dữ liệu thực tế của project.

---

# 6. Reporting

## 6.1 Project Dashboard

**Base:** `/api/v1/projects/{projectId}/dashboard`

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../dashboard` | Dashboard tổng hợp |
| `GET` | `.../dashboard/health` | Health score của project |
| `GET` | `.../dashboard/kpis` | KPIs (key performance indicators) |
| `GET` | `.../dashboard/attention` | Các mục cần chú ý |

---

## 6.2 Project Reports (convenience)

**Base:** `/api/v1/projects/{projectId}/reports`

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../reports/task-risk` | Task risk report |
| `GET` | `.../reports/schedule-risk` | Schedule risk report |
| `GET` | `.../reports/capacity` | Capacity report |
| `GET` | `.../reports/estimation` | Estimation report |
| `GET` | `.../reports/finance` | Finance report |
| `GET` | `.../reports/quote` | Quote report |
| `GET` | `.../reports/baseline-vs-current` | Baseline vs current comparison |
| `GET` | `.../reports/change-impact` | Change impact report |
| `GET` | `.../reports/notifications` | Notifications report |
| `GET` | `.../reports/ai-planning` | AI planning suggestions report |

---

## 6.3 Activity Feed

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/projects/{projectId}/activity-feed?page=&size=` | Activity feed của project (paginated) |

---

## 6.4 Report Definitions & Runs

**Report Definitions**

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/reports/definitions` | Danh sách report definitions (catalog) |
| `GET` | `/api/v1/reports/definitions/{code}` | Lấy theo code |

**Report Runs**

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/reports/runs` | Tạo và chạy report |
| `GET` | `/api/v1/reports/runs/{reportRunId}` | Lấy run status |
| `GET` | `/api/v1/reports/runs/{reportRunId}/snapshot` | Lấy data snapshot |
| `POST` | `/api/v1/reports/runs/{reportRunId}/exports` | Export kết quả (body: `format`, `fileName`) |

**POST /runs — Request body**
```json
{
  "reportCode": "PROJECT_FINANCE_SUMMARY",
  "projectId": "<uuid>",
  "filters": { "dateFrom": "2026-01-01", "dateTo": "2026-12-31" },
  "selectedFields": ["totalRevenue", "grossMargin"]
}
```

**Report Exports**

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/reports/exports?projectId=` | Danh sách export jobs |
| `GET` | `/api/v1/reports/exports/{exportJobId}` | Lấy theo ID |
| `GET` | `/api/v1/reports/exports/{exportJobId}/download` | Download file (binary) |
| `POST` | `/api/v1/reports/exports/{exportJobId}/cancel` | Huỷ |

---

# 7. AI Assistant

> **Lưu ý:** SSE streaming dùng `text/event-stream`. Headers tùy chọn: `X-Actor-Id`, `X-Workspace-Id`.

## 7.1 Conversations

**Base:** `/api/v1/ai-assistant/conversations`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../conversations` | Tạo conversation mới |
| `GET` | `.../conversations?page=&size=` | Danh sách (paginated) |
| `GET` | `.../conversations/{id}` | Lấy theo ID |
| `PATCH` | `.../conversations/{id}/title` | Đổi tiêu đề |
| `DELETE` | `.../conversations/{id}` | Xoá (204) |
| `POST` | `.../conversations/{id}/archive` | Lưu trữ |

**POST — Request body**
```json
{
  "workspaceId": "<uuid>",
  "projectId": "<uuid>",
  "conversationType": "PROJECT_ASSISTANT",
  "capabilityLevel": "STANDARD",
  "assistantAgentId": "<uuid>",
  "title": "Help with sprint planning"
}
```

`conversationType` values: `PROJECT_ASSISTANT` | `GLOBAL_ASSISTANT` | `GUIDED`
`capabilityLevel` values: `STANDARD` | `ADVANCED`

**AiConversationResponse** — fields: `id`, `workspaceId`, `projectId`, `ownerUserId`, `conversationType`, `capabilityLevel`, `status`, `title`, `lastMessageAt`, `createdAt`

---

## 7.2 Messages

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/ai-assistant/conversations/{conversationId}/messages` | Gửi message (trả SSE start info) |
| `GET` | `/api/v1/ai-assistant/conversations/{conversationId}/messages?page=&size=` | Danh sách messages |
| `GET` | `/api/v1/ai-assistant/messages/{messageId}` | Lấy message theo ID |
| `GET` | `/api/v1/ai-assistant/messages/{messageId}/stream` | **SSE stream** (produces `text/event-stream`) |
| `POST` | `/api/v1/ai-assistant/messages/{messageId}/cancel` | Huỷ streaming |

**POST /messages — Request body**
```json
{
  "content": "Can you summarize the risks in this project?",
  "idempotencyKey": "msg-abc-123",
  "modelProvider": null,
  "modelName": null,
  "pageCode": "PROJECT_RISK",
  "entityType": "PROJECT",
  "entityId": "<uuid>"
}
```

**AiSseStartResponse** (trả về khi POST message thành công — 202)
```json
{
  "conversationId": "<uuid>",
  "userMessageId": "<uuid>",
  "assistantMessageId": "<uuid>",
  "turnId": "<uuid>",
  "streamUrl": "/api/v1/ai-assistant/messages/<uuid>/stream"
}
```

**AiMessageResponse** — fields: `id`, `conversationId`, `turnId`, `sequenceInConversation`, `role` (`USER` | `ASSISTANT`), `status` (`STREAMING` | `COMPLETED` | `CANCELLED` | `ERROR`), `content`, `inputTokenCount`, `outputTokenCount`, `createdAt`, `completedAt`

---

## 7.3 Guides

**Base:** `/api/v1/ai-assistant/guides`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../guides/explain-page` | Giải thích ngữ cảnh của trang hiện tại |
| `POST` | `.../guides/explain-field` | Giải thích ý nghĩa của một field |
| `POST` | `.../guides/explain-disabled-action` | Giải thích tại sao action bị disabled |
| `GET` | `.../guides/suggested-questions?pageCode=&entityType=&locale=` | Lấy suggested questions |

**POST /explain-page — Request body:** `{ "workspaceId": "<uuid>", "projectId": "<uuid>", "pageCode": "ESTIMATION_RUN", "locale": "vi" }`

Tất cả guide endpoints trả **202 Accepted** + `AiSseStartResponse` (stream async).

**AiSuggestedQuestionResponse** — fields: `id`, `code`, `pageCode`, `questionText`, `displayOrder`

---

## 7.4 Feedback

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/ai-assistant/feedbacks` | Gửi feedback (201) |

**POST — Request body**
```json
{
  "conversationId": "<uuid>",
  "messageId": "<uuid>",
  "rating": "THUMBS_UP",
  "reasonCode": null,
  "comment": "Very helpful response!"
}
```

`rating` values: `THUMBS_UP` | `THUMBS_DOWN` | `NEUTRAL`

---

# 8. AI Planning

## 8.1 Planning Runs

**Base:** `/api/v1/projects/{projectId}/ai-planning/runs`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../runs` | Tạo và chạy AI planning run |
| `GET` | `.../runs` | Danh sách |
| `GET` | `.../runs/{runId}` | Lấy theo ID |
| `POST` | `.../runs/{runId}/cancel` | Huỷ |

**POST — Request body**
```json
{
  "runType": "FULL_PLAN",
  "agentId": "<uuid>",
  "promptTemplateCode": "AI_PLANNING_V2",
  "input": { "focusArea": "resource_allocation" },
  "includeSections": ["SCOPE", "RESOURCE", "RISK"],
  "options": { "maxSuggestions": 20 }
}
```

`runType` values: `FULL_PLAN` | `INCREMENTAL` | `SCOPE_ONLY` | `RESOURCE_ONLY`

**AiPlanningRunResponse** — fields: `id`, `projectId`, `runType`, `status` (`PENDING` | `RUNNING` | `COMPLETED` | `FAILED` | `CANCELLED`), `agentId`, `startedAt`, `completedAt`, `errorCode`, `errorMessage`, `traceId`

---

## 8.2 Planning Suggestions

**Base:** `/api/v1/projects/{projectId}/ai-planning/suggestions`

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../suggestions` | Danh sách suggestions |
| `GET` | `.../suggestions/{suggestionId}` | Lấy theo ID |
| `POST` | `.../suggestions/{suggestionId}/start-review` | Bắt đầu review |
| `POST` | `.../suggestions/{suggestionId}/accept` | Chấp nhận toàn bộ |
| `POST` | `.../suggestions/{suggestionId}/reject` | Từ chối (body: `reason`) |
| `POST` | `.../suggestions/{suggestionId}/archive` | Lưu trữ |
| `POST` | `.../suggestions/{suggestionId}/apply` | Áp dụng |
| `GET` | `.../suggestions/{suggestionId}/items` | Danh sách suggestion items |
| `GET` | `.../suggestions/{suggestionId}/items/{itemId}` | Lấy item |
| `POST` | `.../suggestions/{suggestionId}/items/{itemId}/accept` | Chấp nhận từng item |
| `POST` | `.../suggestions/{suggestionId}/items/{itemId}/reject` | Từ chối từng item |

**POST /apply — Request body:** `{ "applyMode": "DIRECT", "requireChangeRequestIfBaselined": true, "idempotencyKey": "apply-001" }`

**ApplySuggestionResponse**
```json
{
  "suggestionId": "<uuid>",
  "changeRequestCreated": true,
  "changeRequestId": "<uuid>",
  "results": [
    { "suggestionItemId": "<uuid>", "status": "APPLIED", "domainAction": "CREATE_TASK", "targetType": "TASK", "targetId": "<uuid>" }
  ]
}
```

---

# 9. AI Recommendation

## 9.1 Recommendation Runs

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/ai-recommendations/projects/{projectId}/runs?workspaceId=` | Tạo run (202 Accepted) |
| `GET` | `/api/v1/ai-recommendations/runs/{runId}?workspaceId=` | Lấy run status |

**POST — Request body:** `{ "policyCode": "DEFAULT", "packCodes": ["RISK_PACK", "RESOURCE_PACK"], "triggerType": "MANUAL", "idempotencyKey": "run-001" }`

---

## 9.2 Suggestions

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/ai-recommendations/projects/{projectId}/suggestions?workspaceId=&status=&severity=&page=&size=` | Danh sách suggestions của project |
| `GET` | `/api/v1/ai-recommendations/entities/{entityType}/{entityId}/suggestions?workspaceId=&projectId=&page=&size=` | Suggestions cho entity cụ thể |
| `GET` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}?workspaceId=` | Chi tiết |
| `POST` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}/view` | Đánh dấu đã xem |
| `PATCH` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}/edit` | Chỉnh sửa payload |
| `POST` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}/accept` | Chấp nhận |
| `POST` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}/reject` | Từ chối (body: `reasonCode`, `comment`) |
| `POST` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}/suppress` | Tắt tạm thời (body: `scopeType`, `durationDays`) |
| `POST` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}/prepare-apply` | Chuẩn bị apply |
| `POST` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}/feedback` | Gửi feedback |

> Note: `suggestionRef` là string (không phải UUID) — format: `{sourceSystem}:{suggestionId}`

**SuggestionSummaryResponse** — fields chính: `suggestionRef`, `type`, `category`, `severity` (`HIGH` | `MEDIUM` | `LOW`), `status` (`NEW` | `VIEWED` | `ACCEPTED` | `REJECTED` | `SUPPRESSED`), `title`, `summary`, `riskLevel`, `createdAt`, `expiresAt`, `version`

---

## 9.3 Next Best Actions

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/ai-recommendations/projects/{projectId}/next-best-actions?workspaceId=&limit=10` | Danh sách next best actions |

**NextBestActionItemResponse**
```json
{
  "code": "ADD_MILESTONE",
  "label": "Define Q3 milestone",
  "actionKind": "NAVIGATION",
  "enabled": true,
  "riskLevel": "MEDIUM",
  "requiredAuthorityCode": "PROJECT_EDIT",
  "disabledReasonCode": null,
  "metadata": { "targetRoute": "/projects/.../milestones/new" }
}
```

---

# 10. ClientPortal

> **2 nhóm người dùng:**
> - **Internal** (project manager): dùng endpoints `/api/v1/projects/{projectId}/...` và `/api/v1/workspaces/{workspaceId}/...`
> - **Portal client** (external): dùng endpoints `/api/v1/portal/...` (auth riêng — JWT cookie `portal_access_token`)

## 10.1 Portal Auth (for clients)

**Base:** `/api/v1/portal/auth`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../portal/auth/accept-invite` | Kích hoạt account + set password |
| `POST` | `.../portal/auth/login` | Đăng nhập portal |
| `POST` | `.../portal/auth/logout` | Đăng xuất |
| `POST` | `.../portal/auth/refresh` | Refresh token |
| `GET` | `.../portal/auth/me` | Lấy thông tin account hiện tại |
| `POST` | `.../portal/auth/password` | Đổi mật khẩu |

**POST /login — Request body:** `{ "workspaceId": "<uuid>", "email": "client@acme.com", "password": "..." }`

**PortalAuthResult** — fields: `portalAccountId`, `email`, `displayName`, `accessToken`, `expiresInMs`

---

## 10.2 Portal Account Management (internal)

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/workspaces/{workspaceId}/portal-accounts/{accountId}` | Lấy portal account |
| `POST` | `/api/v1/workspaces/{workspaceId}/portal-accounts/{accountId}/suspend` | Suspend |
| `POST` | `/api/v1/workspaces/{workspaceId}/portal-accounts/{accountId}/deactivate` | Deactivate |

---

## 10.3 Portal Invites (internal)

**Base:** `/api/v1/projects/{projectId}/portal-invites`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../portal-invites` | Mời client (gửi email với invite token) |
| `GET` | `.../portal-invites` | Danh sách invites |

**POST — Request body:** `{ "email": "client@acme.com", "expiresInDays": 7 }`

---

## 10.4 Portal Access Grants (internal)

**Base:** `/api/v1/projects/{projectId}/portal-access-grants`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../portal-access-grants` | Cấp quyền cho portal account |
| `GET` | `.../portal-access-grants` | Danh sách |
| `POST` | `.../portal-access-grants/{grantId}/revoke` | Thu hồi |

**POST — Request body:** `{ "portalAccountId": "<uuid>", "permissionPolicyCode": "CLIENT_VIEW", "expiresAt": null }`

---

## 10.5 Portal Permission Policies (internal)

**Base:** `/api/v1/workspaces/{workspaceId}/portal-permission-policies`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../portal-permission-policies` | Tạo permission policy |
| `GET` | `.../portal-permission-policies` | Danh sách |
| `GET` | `.../portal-permission-policies/{policyId}` | Lấy theo ID |
| `PUT` | `.../portal-permission-policies/{policyId}` | Cập nhật |

---

## 10.6 Client Reviews (internal)

**Base:** `/api/v1/projects/{projectId}/client-reviews`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../client-reviews` | Tạo review request |
| `GET` | `.../client-reviews` | Danh sách |
| `GET` | `.../client-reviews/{reviewId}` | Lấy theo ID |
| `POST` | `.../client-reviews/{reviewId}/decide` | Quyết định (body: `decision`, `comment`) |

`decision` values: `APPROVED` | `REJECTED` | `REVISION_REQUESTED`

---

## 10.7 Client UAT Assignments (internal)

**Base:** `/api/v1/projects/{projectId}/client-uat-assignments`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../client-uat-assignments` | Gán test case cho client UAT |
| `GET` | `.../client-uat-assignments` | Danh sách |

---

## 10.8 Client Feedback & Comments (internal)

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/projects/{projectId}/client-feedback` | Tạo feedback (internal) |
| `GET` | `/api/v1/projects/{projectId}/client-feedback` | Danh sách |
| `GET` | `/api/v1/projects/{projectId}/client-comments` | Danh sách comments từ portal |
| `GET` | `/api/v1/projects/{projectId}/portal-audit-logs` | Audit log hoạt động của portal |

---

## 10.9 Portal Views (for clients)

**Base:** `/api/v1/portal/projects`

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../portal/projects` | Danh sách projects client có quyền xem |
| `GET` | `.../portal/projects/{projectId}/reviews` | Danh sách review requests |
| `GET` | `.../portal/projects/{projectId}/meetings` | Danh sách meetings |
| `GET` | `.../portal/projects/{projectId}/meetings/{meetingId}` | Chi tiết meeting |
| `GET` | `.../portal/projects/{projectId}/meetings/{meetingId}/minutes` | Meeting minutes |
| `GET` | `.../portal/projects/{projectId}/meetings/{meetingId}/comments` | Comments |
| `POST` | `.../portal/projects/{projectId}/meetings/{meetingId}/comments` | Thêm comment |
| `POST` | `.../portal/projects/{projectId}/comments` | Tạo comment |
| `GET` | `.../portal/projects/{projectId}/comments` | Danh sách comments |
| `POST` | `.../portal/projects/{projectId}/feedback` | Gửi feedback |
| `GET` | `.../portal/projects/{projectId}/feedback` | Danh sách feedback |
| `POST` | `.../portal/projects/{projectId}/support/cases` | Tạo support case |
| `GET` | `.../portal/projects/{projectId}/support/cases` | Danh sách support cases |
| `GET` | `.../portal/projects/{projectId}/forms` | Danh sách forms |
| `GET` | `.../portal/projects/{projectId}/forms/{formId}/published-version` | Form version đang publish |
| `POST` | `.../portal/projects/{projectId}/forms/{formId}/submit` | Submit form |

---

# 11. ProjectNotification

## 11.1 Project Subscriptions

**Base:** `/api/v1/projects/{projectId}/notification-subscriptions`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../notification-subscriptions` | Subscribe (201) |
| `GET` | `.../notification-subscriptions` | Danh sách |
| `GET` | `.../notification-subscriptions/me` | Subscriptions của tôi |
| `PATCH` | `.../notification-subscriptions/{subscriptionId}/mute` | Tắt thông báo |
| `PATCH` | `.../notification-subscriptions/{subscriptionId}/unmute` | Bật lại |
| `DELETE` | `.../notification-subscriptions/{subscriptionId}` | Unsubscribe (204) |

**POST — Request body:** `{ "subscriberUserId": "<uuid>", "subscriptionType": "WATCHER" }`

`subscriptionType` values: `ASSIGNEE` | `WATCHER` | `OWNER` | `REVIEWER`

---

## 11.2 Task Subscriptions

**Base:** `/api/v1/projects/{projectId}/tasks/{taskId}/notification-subscriptions`

Cùng endpoints với Project Subscriptions. Response field thêm `taskId`.

---

## 11.3 Notification Preferences

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/projects/{projectId}/notification-preferences/me` | Lấy preferences của tôi |
| `PUT` | `/api/v1/projects/{projectId}/notification-preferences/me` | Upsert preferences |
| `GET` | `/api/v1/projects/{projectId}/tasks/{taskId}/notification-preferences/me` | Preferences tại task level |
| `PUT` | `/api/v1/projects/{projectId}/tasks/{taskId}/notification-preferences/me` | Upsert task-level preferences |

**PUT — Request body**
```json
{
  "preferences": [
    { "eventCode": "TASK_STATUS_CHANGED", "channel": "IN_APP", "enabled": true, "muted": false },
    { "eventCode": "TASK_ASSIGNED", "channel": "EMAIL", "enabled": false, "muted": false }
  ]
}
```

---

## 11.4 Project Reminders

**Base:** `/api/v1/projects/notifications/reminders`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../reminders/run?workspaceId=` | Trigger reminder job |
| `GET` | `.../reminders/runs?workspaceId=` | Danh sách runs |
| `GET` | `.../reminders/runs/{runId}?workspaceId=` | Lấy theo ID |

---

# 12. Productivity

## 12.1 Global Search

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/search?workspaceId=&q=&page=&size=` | Tìm kiếm toàn cục |
| `GET` | `/api/v1/search/scopes?workspaceId=` | Danh sách scope có thể search |

---

## 12.2 Saved Searches & Views

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/workspaces/{workspaceId}/saved-searches` | Lưu search |
| `GET` | `/api/v1/workspaces/{workspaceId}/saved-searches` | Danh sách |
| `POST` | `/api/v1/workspaces/{workspaceId}/saved-views` | Lưu view config |
| `GET` | `/api/v1/workspaces/{workspaceId}/saved-views` | Danh sách |

---

## 12.3 Favorites & Pins

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/workspaces/{workspaceId}/favorites` | Thêm vào favorites |
| `GET` | `/api/v1/workspaces/{workspaceId}/favorites` | Danh sách |
| `DELETE` | `/api/v1/workspaces/{workspaceId}/favorites/{favoriteId}` | Xoá |
| `POST` | `/api/v1/workspaces/{workspaceId}/pins` | Ghim item |
| `GET` | `/api/v1/workspaces/{workspaceId}/pins` | Danh sách |

---

## 12.4 Recent Items

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/workspaces/{workspaceId}/recent-items` | Ghi nhận lần xem |
| `GET` | `/api/v1/workspaces/{workspaceId}/recent-items` | Danh sách gần đây |

---

## 12.5 Work Inbox

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/workspaces/{workspaceId}/work-inbox` | Danh sách inbox items |
| `GET` | `/api/v1/workspaces/{workspaceId}/work-inbox/counts` | Counts theo category |
| `POST` | `/api/v1/workspaces/{workspaceId}/work-inbox/{itemId}/mark-read` | Đánh dấu đã đọc |

---

## 12.6 Commands

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/workspaces/{workspaceId}/commands` | Danh sách command definitions |
| `GET` | `/api/v1/workspaces/{workspaceId}/commands/suggestions?q=` | Gợi ý lệnh theo query |

---

## 12.7 Navigation

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/workspaces/{workspaceId}/navigation` | Navigation menu |
| `GET` | `/api/v1/workspaces/{workspaceId}/navigation/preferences` | User nav preferences |
| `PUT` | `/api/v1/workspaces/{workspaceId}/navigation/preferences` | Cập nhật preferences |

---

# 13. IntegrationHub

**Base workspace:** `/api/v1/workspaces/{workspaceId}/integrations`
**Base platform:** `/api/v1/integrations`

## 13.1 Providers (platform-wide, read-only)

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/integrations/providers` | Danh sách providers |
| `GET` | `/api/v1/integrations/providers/{providerCode}` | Lấy theo code |
| `GET` | `/api/v1/integrations/providers/{providerCode}/capabilities` | Capabilities của provider |

---

## 13.2 Connections

**Base:** `/api/v1/workspaces/{workspaceId}/integrations/connections`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../connections` | Tạo connection |
| `GET` | `.../connections` | Danh sách |
| `GET` | `.../connections/{connectionId}` | Lấy theo ID |
| `POST` | `.../connections/{connectionId}/enable` | Enable |
| `POST` | `.../connections/{connectionId}/disable` | Disable |
| `PATCH` | `.../connections/{connectionId}/archive` | Lưu trữ |
| `POST` | `.../connections/{connectionId}/health-check` | Chạy health check |
| `GET` | `.../connections/{connectionId}/health-checks` | Lịch sử health checks |
| `POST` | `.../connections/{connectionId}/test-connection` | Test kết nối |
| `POST` | `.../connections/{connectionId}/sync-pull` | Pull data từ provider |

**POST — Request body:** `{ "providerCode": "JIRA", "name": "Jira Prod", "credentialReferenceId": "<uuid>" }`

---

## 13.3 Credentials

**Base:** `/api/v1/workspaces/{workspaceId}/integrations/credential-references`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../credential-references` | Tạo credential reference |
| `GET` | `.../credential-references` | Danh sách |
| `GET` | `.../credential-references/{credentialId}` | Lấy theo ID |
| `POST` | `.../credential-references/{credentialId}/rotate` | Rotate credential |
| `POST` | `.../credential-references/{credentialId}/revoke` | Thu hồi |

**POST — Request body:** `{ "providerCode": "JIRA", "credentialType": "API_KEY", "secretReference": "vault://jira-api-key" }`

---

## 13.4 Import

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../integrations/import-jobs` | Tạo import job |
| `GET` | `.../integrations/import-jobs` | Danh sách |
| `GET` | `.../integrations/import-jobs/{importJobId}` | Lấy theo ID |
| `POST` | `.../integrations/import-jobs/{importJobId}/validate` | Validate |
| `POST` | `.../integrations/import-jobs/{importJobId}/dry-run` | Dry run |
| `POST` | `.../integrations/import-jobs/{importJobId}/execute` | Thực thi |
| `POST` | `.../integrations/import-jobs/{importJobId}/cancel` | Huỷ |
| `GET` | `.../integrations/import-jobs/{importJobId}/rows` | Xem từng row kết quả |
| `GET` | `.../integrations/import-templates` | Danh sách templates |
| `GET` | `.../integrations/import-templates/{templateId}` | Lấy template |

---

## 13.5 Export

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../integrations/export-profiles` | Tạo export profile |
| `GET` | `.../integrations/export-profiles` | Danh sách |
| `GET` | `.../integrations/export-profiles/{exportProfileId}` | Lấy theo ID |
| `PUT` | `.../integrations/export-profiles/{exportProfileId}` | Cập nhật |
| `PATCH` | `.../integrations/export-profiles/{exportProfileId}/archive` | Lưu trữ |
| `POST` | `.../integrations/export-jobs` | Tạo export job |
| `GET` | `.../integrations/export-jobs` | Danh sách |
| `GET` | `.../integrations/export-jobs/{exportJobId}` | Lấy theo ID |
| `POST` | `.../integrations/export-jobs/{exportJobId}/cancel` | Huỷ |
| `GET` | `.../integrations/export-jobs/{exportJobId}/download` | Download file |

---

## 13.6 Sync Jobs

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../integrations/sync-jobs` | Tạo sync job |
| `GET` | `.../integrations/sync-jobs` | Danh sách |
| `GET` | `.../integrations/sync-jobs/{syncJobId}` | Lấy theo ID |
| `PUT` | `.../integrations/sync-jobs/{syncJobId}` | Cập nhật |
| `POST` | `.../integrations/sync-jobs/{syncJobId}/enable` | Enable |
| `POST` | `.../integrations/sync-jobs/{syncJobId}/disable` | Disable |
| `PATCH` | `.../integrations/sync-jobs/{syncJobId}/archive` | Lưu trữ |
| `POST` | `.../integrations/sync-jobs/{syncJobId}/run-now` | Chạy ngay |
| `GET` | `.../integrations/sync-runs` | Danh sách sync runs |
| `GET` | `.../integrations/sync-runs/{syncRunId}` | Lấy theo ID |

**POST — Request body:** `{ "connectionId": "<uuid>", "name": "Jira Daily Sync", "syncDirection": "INBOUND", "syncMode": "INCREMENTAL", "objectScope": "TASK", "conflictStrategy": "SOURCE_WINS" }`

`syncDirection` values: `INBOUND` | `OUTBOUND` | `BIDIRECTIONAL`
`conflictStrategy` values: `SOURCE_WINS` | `TARGET_WINS` | `MANUAL_REVIEW`

---

## 13.7 Sync Conflicts

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../integrations/sync-conflicts` | Danh sách conflicts |
| `POST` | `.../integrations/sync-conflicts/{conflictId}/resolve` | Resolve (body: `resolutionStrategy`, `resolutionNotes`) |
| `POST` | `.../integrations/sync-conflicts/{conflictId}/dismiss` | Dismiss |

---

## 13.8 Webhooks

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../integrations/webhooks/subscriptions` | Tạo webhook subscription |
| `GET` | `.../integrations/webhooks/subscriptions` | Danh sách |
| `GET` | `.../integrations/webhooks/subscriptions/{subscriptionId}` | Lấy theo ID |
| `PUT` | `.../integrations/webhooks/subscriptions/{subscriptionId}` | Cập nhật |
| `POST` | `.../integrations/webhooks/subscriptions/{subscriptionId}/enable` | Enable |
| `POST` | `.../integrations/webhooks/subscriptions/{subscriptionId}/disable` | Disable |
| `PATCH` | `.../integrations/webhooks/subscriptions/{subscriptionId}/archive` | Lưu trữ |
| `POST` | `.../integrations/webhooks/delivery-attempts` | Record delivery attempt |
| `GET` | `.../integrations/webhooks/delivery-attempts` | Danh sách |
| `POST` | `.../integrations/webhooks/delivery-attempts/{attemptId}/retry` | Retry |
| `POST` | `/api/v1/integrations/inbound/{endpointCode}` | **Inbound webhook** (public, no auth) |
| `POST` | `.../integrations/inbound-endpoints` | Tạo inbound endpoint config |
| `GET` | `.../integrations/inbound-endpoints` | Danh sách |
| `GET` | `.../integrations/inbound-events` | Lịch sử events nhận vào |

---

## 13.9 Mapping Profiles & Observability

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../integrations/mapping-profiles` | Tạo mapping profile |
| `GET` | `.../integrations/mapping-profiles` | Danh sách |
| `PUT` | `.../integrations/mapping-profiles/{mappingProfileId}` | Cập nhật |
| `PATCH` | `.../integrations/mapping-profiles/{mappingProfileId}/archive` | Lưu trữ |
| `GET` | `.../integrations/external-id-mappings` | Danh sách external ID mappings |
| `GET` | `.../integrations/rate-limits` | Trạng thái rate limits của providers |
| `GET` | `.../integrations/dead-letter-events` | Danh sách dead letter events |
| `POST` | `.../integrations/dead-letter-events/{deadLetterId}/retry` | Retry |
| `POST` | `.../integrations/dead-letter-events/{deadLetterId}/resolve` | Resolve |
| `GET` | `.../integrations/dashboard` | Integration observability dashboard |

---

# 14. Traceability

## 14.1 Requirements

**Base:** `/api/v1/projects/{projectId}/requirements`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../requirements` | Tạo requirement |
| `GET` | `.../requirements` | Danh sách |
| `GET` | `.../requirements/{requirementId}` | Lấy theo ID |
| `PATCH` | `.../requirements/{requirementId}` | Cập nhật |
| `POST` | `.../requirements/{requirementId}/approve` | Phê duyệt |
| `PATCH` | `.../requirements/{requirementId}/reject` | Từ chối |
| `PATCH` | `.../requirements/{requirementId}/defer` | Hoãn |
| `PATCH` | `.../requirements/{requirementId}/implement` | Đánh dấu đã implement |
| `PATCH` | `.../requirements/{requirementId}/archive` | Lưu trữ |

**POST — Request body**
```json
{
  "applicationId": "<uuid>",
  "code": "REQ-001",
  "title": "User authentication via SSO",
  "description": "...",
  "requirementType": "FUNCTIONAL",
  "priority": "HIGH"
}
```

`requirementType` values: `FUNCTIONAL` | `NON_FUNCTIONAL` | `BUSINESS` | `TECHNICAL` | `CONSTRAINT`
`status` flow: `DRAFT` → `APPROVED` | `REJECTED` | `DEFERRED` → `IMPLEMENTED`

**Requirement Versions — Base:** `.../requirements/{requirementId}/versions`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../versions` | Tạo version snapshot |
| `GET` | `.../versions` | Danh sách |
| `GET` | `.../versions/{versionId}` | Lấy theo ID |

**Requirement Sources — Base:** `.../requirements/{requirementId}/sources`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../sources` | Thêm nguồn yêu cầu |
| `GET` | `.../sources` | Danh sách |
| `GET` | `.../sources/{sourceId}` | Lấy theo ID |

**Acceptance Criteria — Base:** `.../requirements/{requirementId}/acceptance-criteria`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../acceptance-criteria` | Thêm tiêu chí |
| `GET` | `.../acceptance-criteria` | Danh sách |
| `GET` | `.../acceptance-criteria/{criteriaId}` | Lấy theo ID |

---

## 14.2 Trace Links

**Base:** `/api/v1/projects/{projectId}/trace-links`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../trace-links` | Tạo trace link |
| `GET` | `.../trace-links` | Danh sách |
| `GET` | `.../trace-links/{linkId}` | Lấy theo ID |
| `PATCH` | `.../trace-links/{linkId}/archive` | Xoá link |

**POST — Request body:** `{ "sourceType": "REQUIREMENT", "sourceId": "<uuid>", "targetType": "TASK", "targetId": "<uuid>", "linkType": "IMPLEMENTED_BY" }`

`linkType` values: `IMPLEMENTED_BY` | `TESTED_BY` | `DEPENDS_ON` | `BLOCKS` | `DERIVED_FROM`

**Traceability Reports**

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/projects/{projectId}/reports/coverage-matrix` | Coverage/gap matrix |

---

## 14.3 Application Registry

**Base:** `/api/v1/workspaces/{workspaceId}/applications`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../applications` | Đăng ký application |
| `GET` | `.../applications` | Danh sách |
| `GET` | `.../applications/{applicationId}` | Lấy theo ID |

**Sub-resources (3 endpoints mỗi loại: POST, GET list, GET by ID):**

| Resource | Base path |
|---|---|
| Modules | `.../applications/{applicationId}/modules` |
| Components | `.../applications/{applicationId}/components` |
| API Endpoints | `.../applications/{applicationId}/api-endpoints` |
| Data Entities | `.../applications/{applicationId}/data-entities` |
| Screens | `.../applications/{applicationId}/screens` |
| Screen Sections | `.../screens/{screenId}/sections` |
| Screen Fields | `.../screens/{screenId}/fields` |
| Screen Actions | `.../screens/{screenId}/actions` |

---

# 15. Trust / Compliance

**Base:** `/api/v1/workspaces/{workspaceId}/trust`

## 15.1 Dashboard & Policy

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../trust/dashboard` | Trust metrics dashboard |
| `GET` | `.../trust/classification-policy` | Data classification policy |
| `PUT` | `.../trust/classification-policy` | Upsert policy |

---

## 15.2 Sensitive Object & Field Registry

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../trust/sensitive-objects` | Đăng ký object type nhạy cảm |
| `GET` | `.../trust/sensitive-objects` | Danh sách |
| `GET` | `.../trust/sensitive-objects/{objectId}` | Lấy theo ID |
| `PATCH` | `.../trust/sensitive-objects/{objectId}` | Cập nhật |
| `POST` | `.../trust/sensitive-fields` | Đăng ký field nhạy cảm |
| `GET` | `.../trust/sensitive-fields` | Danh sách |
| `GET` | `.../trust/sensitive-fields/{fieldId}` | Lấy theo ID |
| `PATCH` | `.../trust/sensitive-fields/{fieldId}` | Cập nhật |

**POST /sensitive-fields — Request body:** `{ "objectTypeCode": "DOCUMENT", "fieldPath": "content.budget", "classification": "CONFIDENTIAL", "maskingStrategy": "PARTIAL" }`

`classification` values: `PUBLIC` | `INTERNAL` | `CONFIDENTIAL` | `RESTRICTED`
`maskingStrategy` values: `REDACT` | `PARTIAL` | `HASH` | `TOKENIZE`

---

## 15.3 Audit Logs

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../trust/sensitive-access-logs` | Ghi nhận truy cập sensitive field |
| `GET` | `.../trust/sensitive-access-logs` | Danh sách |
| `POST` | `.../trust/export-audit-logs` | Ghi nhận export audit |
| `GET` | `.../trust/export-audit-logs` | Danh sách |

---

## 15.4 Privacy & GDPR

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../trust/privacy-requests` | Tạo privacy request (DSR) |
| `GET` | `.../trust/privacy-requests` | Danh sách |
| `GET` | `.../trust/privacy-requests/{requestId}` | Lấy theo ID |
| `POST` | `.../trust/privacy-requests/{requestId}/triage` | Triage |
| `POST` | `.../trust/privacy-requests/{requestId}/mark-in-review` | Mark in review |
| `POST` | `.../trust/privacy-requests/{requestId}/complete` | Hoàn thành |
| `POST` | `.../trust/privacy-requests/{requestId}/reject` | Từ chối |
| `POST` | `.../trust/privacy-requests/{requestId}/cancel` | Huỷ |
| `POST` | `.../trust/privacy-export-packages` | Tạo export package cho DSR |
| `GET` | `.../trust/privacy-export-packages` | Danh sách |
| `POST` | `.../trust/data-subjects/rebuild-index` | Rebuild data subject index |
| `GET` | `.../trust/data-subjects` | Danh sách data subjects |
| `GET` | `.../trust/data-subjects/{subjectIndexId}` | Lấy theo ID |
| `POST` | `.../trust/consent-records` | Ghi nhận consent |
| `GET` | `.../trust/consent-records` | Danh sách |
| `POST` | `.../trust/consent-records/{consentId}/withdraw` | Thu hồi consent |
| `POST` | `.../trust/contact-suppressions` | Tạo suppression |
| `GET` | `.../trust/contact-suppressions` | Danh sách |
| `POST` | `.../trust/contact-suppressions/{suppressionId}/release` | Gỡ suppression |
| `POST` | `.../trust/anonymization-plans` | Tạo anonymization plan |
| `GET` | `.../trust/anonymization-plans` | Danh sách |
| `GET` | `.../trust/anonymization-plans/{planId}` | Lấy theo ID |
| `POST` | `.../trust/anonymization-plans/{planId}/dry-run` | Dry run |
| `POST` | `.../trust/anonymization-plans/{planId}/execute` | Thực thi |
| `POST` | `.../trust/anonymization-plans/{planId}/cancel` | Huỷ |

---

## 15.5 Retention & Legal Hold

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../trust/retention-policies` | Tạo retention policy |
| `GET` | `.../trust/retention-policies` | Danh sách |
| `GET` | `.../trust/retention-policies/{policyId}` | Lấy theo ID |
| `POST` | `.../trust/retention-policies/{policyId}/dry-run` | Dry run |
| `GET` | `.../trust/retention-jobs` | Danh sách retention jobs |
| `POST` | `.../trust/legal-holds` | Tạo legal hold |
| `GET` | `.../trust/legal-holds` | Danh sách |
| `GET` | `.../trust/legal-holds/{holdId}` | Lấy theo ID |
| `POST` | `.../trust/legal-holds/{holdId}/release` | Giải phóng |

**POST /retention-policies — Request body:** `{ "policyCode": "PROJ-DOCS-7Y", "name": "Project Documents 7 Years", "objectTypeCode": "DOCUMENT", "retentionPeriodDays": 2555, "retentionAction": "ARCHIVE" }`

`retentionAction` values: `ARCHIVE` | `DELETE` | `ANONYMIZE`

---

## 15.6 Access Review & Compliance Evidence

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../trust/access-review-campaigns` | Tạo access review campaign |
| `GET` | `.../trust/access-review-campaigns` | Danh sách |
| `GET` | `.../trust/access-review-campaigns/{campaignId}` | Lấy theo ID |
| `POST` | `.../trust/access-review-campaigns/{campaignId}/start` | Bắt đầu |
| `POST` | `.../trust/access-review-campaigns/{campaignId}/complete` | Hoàn thành |
| `POST` | `.../trust/access-review-campaigns/{campaignId}/cancel` | Huỷ |
| `POST` | `.../trust/access-review-campaigns/{campaignId}/findings` | Thêm finding |
| `GET` | `.../trust/permission-review-findings` | Danh sách findings |
| `POST` | `.../trust/permission-review-findings/{findingId}/resolve` | Resolve |
| `POST` | `.../trust/permission-review-findings/{findingId}/dismiss` | Dismiss |
| `POST` | `.../trust/evidence-records` | Tạo compliance evidence |
| `GET` | `.../trust/evidence-records` | Danh sách |
| `GET` | `.../trust/evidence-records/{evidenceId}` | Lấy theo ID |
| `POST` | `.../trust/evidence-records/{evidenceId}/finalize` | Finalize |

---

# 16. ServiceSupport

**Base:** `/api/v1/workspaces/{workspaceId}/support`

## 16.1 Support Cases

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../support/cases` | Tạo support case |
| `GET` | `.../support/cases` | Danh sách |
| `POST` | `.../support/cases/{caseId}/triage` | Triage (body: `ownerUserId`, `slaPolicyId`) |
| `POST` | `.../support/cases/{caseId}/resolve` | Resolve |
| `POST` | `.../support/cases/{caseId}/close` | Đóng |
| `GET` | `.../support/cases/{caseId}/comments` | Danh sách comments |
| `POST` | `.../support/cases/{caseId}/comments` | Thêm comment (body: `body`, `visibility`) |
| `GET` | `.../support/cases/{caseId}/assignments` | Danh sách assignments |
| `POST` | `.../support/cases/{caseId}/assignments` | Gán (body: `assigneeUserId`) |
| `GET` | `.../support/cases/{caseId}/efforts` | Effort records |
| `POST` | `.../support/cases/{caseId}/efforts` | Ghi nhận effort (body: `effortHours`, `effortDate`) |
| `GET` | `.../support/cases/{caseId}/status-history` | Lịch sử status |

**POST /cases — Request body**
```json
{
  "title": "Login button unresponsive after update",
  "requestTypeCode": "BUG",
  "priority": "HIGH",
  "projectId": "<uuid>",
  "source": "PORTAL",
  "portalVisible": true
}
```

---

## 16.2 SLA

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../support/sla-policies` | Tạo SLA policy |
| `GET` | `.../support/sla-policies` | Danh sách |
| `POST` | `.../support/sla-targets` | Tạo SLA target |
| `GET` | `.../support/sla-targets` | Danh sách |
| `GET` | `.../support/sla-clocks` | Active SLA clocks |
| `GET` | `.../support/sla-breaches` | SLA breaches |

**POST /sla-policies — Request body:** `{ "policyCode": "STANDARD", "name": "Standard SLA", "firstResponseMinutes": 240, "resolveMinutes": 2880 }`

---

## 16.3 Queues & Request Types

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../support/queues` | Tạo support queue |
| `GET` | `.../support/queues` | Danh sách |
| `POST` | `.../support/request-types` | Tạo request type |
| `GET` | `.../support/request-types` | Danh sách |
| `POST` | `.../support/request-types/{requestTypeId}/disable` | Disable |
| `POST` | `.../support/request-types/{requestTypeId}/enable` | Enable |

---

## 16.4 Incidents & Problems

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../support/incidents` | Tạo incident |
| `GET` | `.../support/incidents` | Danh sách |
| `POST` | `.../support/incidents/{incidentId}/acknowledge` | Acknowledge |
| `POST` | `.../support/incidents/{incidentId}/resolve` | Resolve |
| `POST` | `.../support/incidents/{incidentId}/close` | Đóng |
| `GET` | `.../support/incidents/{incidentId}/timeline` | Timeline |
| `POST` | `.../support/incidents/{incidentId}/timeline` | Thêm timeline entry |
| `POST` | `.../support/problems` | Tạo problem |
| `GET` | `.../support/problems` | Danh sách |
| `POST` | `.../support/problems/{problemId}/resolve` | Resolve |
| `POST` | `.../support/problems/{problemId}/close` | Đóng |

---

## 16.5 Maintenance

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../support/maintenance-plans` | Tạo maintenance plan |
| `GET` | `.../support/maintenance-plans` | Danh sách |
| `POST` | `.../support/maintenance-windows` | Tạo maintenance window |
| `GET` | `.../support/maintenance-windows` | Danh sách |
| `POST` | `.../support/maintenance-activities` | Tạo activity |
| `GET` | `.../support/maintenance-activities` | Danh sách |

---

## 16.6 Escalation & Warranty

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../support/escalation-rules` | Tạo escalation rule |
| `GET` | `.../support/escalation-rules` | Danh sách |
| `POST` | `.../support/escalation-rules/{ruleId}/enable` | Enable |
| `POST` | `.../support/escalation-rules/{ruleId}/disable` | Disable |
| `POST` | `.../support/warranties` | Tạo warranty coverage |
| `GET` | `.../support/warranties` | Danh sách |
| `POST` | `.../support/warranties/{warrantyId}/expire` | Expire |

---

## 16.7 Service Profile & Cost

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../support/service-profiles` | Tạo service profile |
| `GET` | `.../support/service-profiles` | Danh sách |
| `GET` | `.../support/cost-inputs` | Danh sách cost inputs |
| `POST` | `.../support/cost-inputs` | Tạo cost input |
| `POST` | `.../support/cost-inputs/{inputId}/approve` | Phê duyệt |
| `GET` | `.../support/efforts` | Tất cả effort records trong workspace |
| `POST` | `.../support/efforts/{effortId}/cancel` | Huỷ effort record |

---

## 16.8 Handover & Knowledge

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../support/handover-packages` | Tạo handover package |
| `GET` | `.../support/handover-packages` | Danh sách |
| `POST` | `.../support/handover-packages/{packageId}/finalize` | Finalize |
| `GET` | `.../support/handover-packages/{packageId}/items` | Danh sách items |
| `POST` | `.../support/handover-packages/{packageId}/items` | Thêm item |
| `POST` | `.../support/knowledge-links` | Link case với knowledge doc |
| `GET` | `.../support/knowledge-links` | Danh sách |
| `POST` | `.../support/work-links` | Link case với task/project |
| `GET` | `.../support/work-links` | Danh sách |

---

## 16.9 Dashboard & Metrics

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../support/dashboard` | Support dashboard summary |
| `GET` | `.../support/metric-snapshots` | Metric snapshots |

---

## Appendix — Endpoint Count

| Module | Controllers | Endpoints (approx.) |
|---|---|---|
| DocumentHub | 6 | 28 |
| Knowledge | 7 | 25 |
| EventRegistry | 1 | 9 |
| Governance | 7 | 30 |
| Quality | 15 | 70 |
| Reporting | 6 | 21 |
| AI Assistant | 4 | 17 |
| AI Planning | 2 | 15 |
| AI Recommendation | 4 | 13 |
| ClientPortal | 16 | 40 |
| ProjectNotification | 4 | 16 |
| Productivity | 9 | 20 |
| IntegrationHub | 17 | 75 |
| Traceability | 15 | 55 |
| Trust | 16 | 60 |
| ServiceSupport | 23 | 65 |
| **Grand total Wave 4** | **152** | **~559** |
