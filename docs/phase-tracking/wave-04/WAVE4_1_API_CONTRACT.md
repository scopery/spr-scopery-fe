# Wave 4.1 API Contract — Native Document Editor (DocumentHub Extension · ResourceReference · AI Context)

> **Mục đích:** Tài liệu tham chiếu đầy đủ cho FE ráp UI Wave 4.1 — toàn bộ tính năng Native Document Editor (AST-based rich text), Comment Threads, Suggestion Mode, Attachments, Synced Blocks, Native Templates, Resource Mention, AI Context Resolution.
> **Swagger live:** `http://localhost:8080/swagger-ui.html`
> **OpenAPI JSON:** `http://localhost:8080/v3/api-docs`
> **Migrations áp dụng:** V101 → V112

---

## Conventions

- Mọi response bọc `ApiResponse<T>`: `{ "success": true, "data": {...}, "timestamp": "..." }`
- Mọi path có prefix `/api/v1/`
- Auth: JWT Bearer (header `Authorization: Bearer <token>`)
- Lỗi trả `{ "success": false, "errorCode": "...", "message": "...", "traceId": "..." }`
- Paginated list trả `PageResponse<T>`: `{ "items": [], "page": 0, "size": 20, "totalElements": 0, "totalPages": 0, "first": true, "last": true }`

---

## Module Index

| # | Module / Sub-module | Base path |
|---|---|---|
| [1](#1-documenthub--native-content) | DocumentHub — Native Content | `/api/v1/projects/{projectId}/documents/{documentId}/content` |
| [2](#2-documenthub--revisions) | DocumentHub — Revisions | `/api/v1/projects/{projectId}/documents/{documentId}/revisions` |
| [3](#3-documenthub--attachments) | DocumentHub — Attachments | `/api/v1/projects/{projectId}/documents/{documentId}/attachments` |
| [4](#4-documenthub--comment-threads) | DocumentHub — Comment Threads | `/api/v1/projects/{projectId}/documents/{documentId}/comment-threads` |
| [5](#5-documenthub--suggestions) | DocumentHub — Suggestions | `/api/v1/projects/{projectId}/documents/{documentId}/suggestions` |
| [6](#6-documenthub--synced-blocks) | DocumentHub — Synced Blocks | `/api/v1/workspaces/{workspaceId}/synced-blocks` |
| [7](#7-documenthub--native-templates) | DocumentHub — Native Templates | `/api/v1/workspaces/{workspaceId}/document-templates/{templateId}/native-versions` |
| [8](#8-documenthub--client-visibility) | DocumentHub — Client Visibility | `/api/v1/projects/{projectId}/documents/{documentId}/...` |
| [9](#9-resourcereference--resource-types) | ResourceReference — Resource Types | `/api/v1/resource-references/types` |
| [10](#10-resourcereference--batch-resolve) | ResourceReference — Batch Resolve | `/api/v1/resource-references/batch-resolve` |
| [11](#11-ai-context) | AI Context | `/api/v1/ai-context/...` |

---

# 1. DocumentHub — Native Content

**Base:** `/api/v1/projects/{projectId}/documents/{documentId}/content`

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../content` | Lấy nội dung AST hiện tại của document |
| `PUT` | `.../content` | Lưu nội dung AST mới (optimistic lock + no-op detection) |

### PUT — Request body

```json
{
  "ast": "{\"type\":\"doc\",\"content\":[...]}",
  "expectedBaseRevisionNo": 3,
  "schemaVersion": 1,
  "revisionType": "MANUAL"
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `ast` | String (JSON) | ✅ | Full AST của document (JSON string) |
| `expectedBaseRevisionNo` | long | ✅ | Revision hiện tại client đang dựa vào. Nếu không khớp server → 409 |
| `schemaVersion` | Integer | | Schema version của editor |
| `revisionType` | String | | `AUTOSAVE_CHECKPOINT` \| `MANUAL` \| `RESTORE` \| `AI_ACCEPT` \| `TEMPLATE_CREATE`. Default `MANUAL` |

> **No-op detection:** Nếu AST gửi lên có checksum trùng với checksum hiện tại, server trả về content hiện tại mà không tạo revision mới.

> **Optimistic lock conflict:** HTTP 409 với errorCode `CONTENT_OPTIMISTIC_LOCK_CONFLICT`

### DocumentContentResponse

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | |
| `documentId` | UUID | |
| `revisionNo` | long | Revision hiện tại sau khi save |
| `ast` | String | Full AST JSON |
| `plainText` | String | Plain text extracted từ AST |
| `wordCount` | int | |
| `characterCount` | int | |
| `checksum` | String | SHA-256 của AST |
| `schemaVersion` | Integer | |
| `lastSavedAt` | Instant | |
| `lastSavedBy` | UUID | |
| `createdAt` | Instant | |
| `updatedAt` | Instant | |

---

# 2. DocumentHub — Revisions

**Base:** `/api/v1/projects/{projectId}/documents/{documentId}/revisions`

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../revisions?page=0&size=20` | Danh sách revisions (không có AST, chỉ metadata) |
| `GET` | `.../revisions/{revisionNo}` | Lấy revision theo số, bao gồm AST |
| `POST` | `.../revisions/{revisionNo}/restore` | Restore về revision cũ (tạo revision mới với type `RESTORE`) |

### DocumentRevisionResponse (list — không có AST)

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | |
| `documentId` | UUID | |
| `revisionNo` | long | |
| `revisionType` | String | `AUTOSAVE_CHECKPOINT` \| `MANUAL` \| `RESTORE` \| `AI_ACCEPT` \| `TEMPLATE_CREATE` |
| `checksum` | String | |
| `wordCount` | int | |
| `characterCount` | int | |
| `schemaVersion` | Integer | |
| `createdAt` | Instant | |
| `createdBy` | UUID | |

### DocumentRevisionResponse (get by revisionNo — có AST)

Thêm field: `ast` (String — full AST JSON)

---

# 3. DocumentHub — Attachments

**Base:** `/api/v1/projects/{projectId}/documents/{documentId}/attachments`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../attachments` | Tạo attachment + lấy presigned upload URL |
| `POST` | `.../attachments/{attachmentId}/complete` | Xác nhận upload hoàn tất |
| `GET` | `.../attachments` | Danh sách attachments của document |
| `GET` | `.../attachments/{attachmentId}` | Lấy theo ID |

### POST /attachments — Request body

```json
{
  "fileName": "diagram.png",
  "contentType": "image/png",
  "fileSizeBytes": 204800
}
```

### POST /attachments — Response

```json
{
  "attachmentId": "<uuid>",
  "uploadUrl": "https://storage.example.com/...",
  "objectKey": "document-attachments/<uuid>/diagram.png",
  "expiresAt": "<instant>"
}
```

### POST /attachments/{attachmentId}/complete — Request body

```json
{
  "etag": "abc123"
}
```

### DocumentAttachmentResponse

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | |
| `documentId` | UUID | |
| `fileName` | String | |
| `contentType` | String | |
| `fileSizeBytes` | Long | |
| `objectKey` | String | |
| `storageStatus` | String | `PENDING_UPLOAD` \| `AVAILABLE` \| `FAILED` \| `PURGED` |
| `etag` | String | |
| `createdAt` | Instant | |
| `updatedAt` | Instant | |

---

# 4. DocumentHub — Comment Threads

**Base:** `/api/v1/projects/{projectId}/documents/{documentId}/comment-threads`

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../comment-threads` | Danh sách comment threads của document |
| `GET` | `.../comment-threads/{threadId}` | Lấy thread kèm toàn bộ comments |
| `POST` | `.../comment-threads` | Mở thread mới + comment đầu tiên (1 transaction) |
| `POST` | `.../comment-threads/{threadId}/comments` | Thêm comment vào thread |
| `POST` | `.../comment-threads/{threadId}/resolve` | Resolve thread |
| `DELETE` | `.../comment-threads/{threadId}/comments/{commentId}` | Soft-delete comment |

### POST /comment-threads — Request body

```json
{
  "blockId": "block-uuid-123",
  "anchorText": "đoạn văn được comment",
  "firstCommentBody": "Cần xem lại phần này."
}
```

### POST /{threadId}/comments — Request body

```json
{
  "body": "Đồng ý, sẽ sửa."
}
```

### CommentThreadResponse

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | |
| `documentId` | UUID | |
| `blockId` | String | Block bị anchor |
| `anchorText` | String | |
| `status` | String | `OPEN` \| `RESOLVED` \| `ARCHIVED` |
| `resolvedBy` | UUID | |
| `resolvedAt` | Instant | |
| `comments` | `List<CommentResponse>` | Danh sách comments trong thread |
| `createdAt` | Instant | |

### CommentResponse

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | |
| `threadId` | UUID | |
| `body` | String | Nội dung (null nếu đã bị xoá) |
| `deleted` | boolean | |
| `deletedAt` | Instant | |
| `createdAt` | Instant | |

---

# 5. DocumentHub — Suggestions

**Base:** `/api/v1/projects/{projectId}/documents/{documentId}/suggestions`

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../suggestions` | Danh sách suggestions của document |
| `GET` | `.../suggestions/{suggestionId}` | Lấy theo ID |
| `POST` | `.../suggestions` | Tạo suggestion kèm operations |
| `POST` | `.../suggestions/{suggestionId}/accept` | Chấp nhận suggestion (apply vào content, tạo revision AI_ACCEPT) |
| `POST` | `.../suggestions/{suggestionId}/reject` | Từ chối suggestion |

### POST /suggestions — Request body

```json
{
  "targetRevisionNo": 3,
  "description": "AI rewrite — rút gọn đoạn 2",
  "operations": [
    {
      "opType": "REPLACE",
      "blockId": "block-abc",
      "path": "content",
      "value": "{\"type\":\"paragraph\",\"content\":[...]}",
      "ordinal": 0
    }
  ]
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `targetRevisionNo` | long | ✅ | Revision số mà suggestion base vào. Phải khớp với current revision của document khi accept |
| `description` | String | | Mô tả ngắn về suggestion |
| `operations` | Array | ✅ | Danh sách operations (tối thiểu 1) |
| `operations[].opType` | String | ✅ | `INSERT` \| `REPLACE` \| `DELETE` |
| `operations[].blockId` | String | | Block ID bị tác động |
| `operations[].path` | String | | JSON path trong AST |
| `operations[].value` | String | | New AST value (dùng cho INSERT/REPLACE) |
| `operations[].ordinal` | int | | Thứ tự apply |

> **BR-NDE-033:** `POST .../accept` thất bại với 409 `SUGGESTION_BASE_REVISION_CONFLICT` nếu `targetRevisionNo` không còn khớp current revision (document đã được sửa sau khi suggestion được tạo).
>
> **BR-NDE-037:** AI rewrite phải tạo suggestion — không được ghi thẳng vào canonical content.

### SuggestionResponse

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | |
| `documentId` | UUID | |
| `targetRevisionNo` | long | |
| `description` | String | |
| `status` | String | `PENDING` \| `ACCEPTED` \| `REJECTED` \| `EXPIRED` |
| `acceptedBy` | UUID | |
| `acceptedAt` | Instant | |
| `acceptedRevisionNo` | Long | Revision mới được tạo khi accept |
| `rejectedBy` | UUID | |
| `rejectedAt` | Instant | |
| `createdAt` | Instant | |

---

# 6. DocumentHub — Synced Blocks

**Base:** `/api/v1/workspaces/{workspaceId}/synced-blocks`

Synced Block là content block có thể embed vào nhiều documents. Khi update synced block, tất cả documents đang embed sẽ nhận outbox event `SYNCED_BLOCK_UPDATED`.

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../synced-blocks` | Danh sách synced blocks trong workspace |
| `GET` | `.../synced-blocks/{syncedBlockId}` | Lấy theo ID |
| `POST` | `.../synced-blocks?projectId=<uuid>` | Tạo synced block mới (cần `projectId` để check quyền) |
| `PUT` | `.../synced-blocks/{syncedBlockId}` | Cập nhật AST của synced block (tạo revision mới, push event) |
| `POST` | `.../synced-blocks/{syncedBlockId}/archive` | Lưu trữ synced block |

### POST /synced-blocks — Request body

```json
{
  "title": "Footer chuẩn công ty",
  "ast": "{\"type\":\"doc\",\"content\":[...]}",
  "schemaVersion": 1
}
```

### PUT /{syncedBlockId} — Request body

```json
{
  "ast": "{\"type\":\"doc\",\"content\":[...]}",
  "schemaVersion": 1
}
```

### SyncedBlockResponse

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | |
| `workspaceId` | UUID | |
| `projectId` | UUID | |
| `title` | String | |
| `status` | String | `ACTIVE` \| `ARCHIVED` |
| `currentRevisionNo` | long | |
| `schemaVersion` | Integer | |
| `createdAt` | Instant | |
| `updatedAt` | Instant | |

> **Outbox event `SYNCED_BLOCK_UPDATED`** — payload: `{ "syncedBlockId": uuid, "documentId": uuid, "revisionNo": long }` — FE subscribe via WebSocket/SSE để tự reload synced block trong document.

> **BR-NDE-045:** Synced block không được reference chính nó (cycle detection depth ≤ 5 → 409 `SYNCED_BLOCK_CYCLE_DETECTED`).

---

# 7. DocumentHub — Native Templates

**Base:** `/api/v1/workspaces/{workspaceId}/document-templates`

Wave 4.1 mở rộng template để hỗ trợ `templateMode = NATIVE` với AST và variable substitution.

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../document-templates/{templateId}/native-versions` | Publish native template version kèm AST + variable definitions |
| `POST` | `.../document-templates/{templateId}/native-versions/{versionId}/instantiate` | Instantiate template vào document (server-side variable substitution) |

### POST /native-versions — Request body

```json
{
  "ast": "{\"type\":\"doc\",\"content\":[...]}",
  "variables": [
    {
      "variableKey": "PROJECT_NAME",
      "label": "Tên dự án",
      "variableType": "TEXT",
      "required": true,
      "defaultValue": null,
      "sensitive": false,
      "ordinal": 0
    },
    {
      "variableKey": "CONTRACT_VALUE",
      "label": "Giá trị hợp đồng",
      "variableType": "TEXT",
      "required": true,
      "defaultValue": null,
      "sensitive": true,
      "ordinal": 1
    }
  ]
}
```

> **BR-NDE-044:** Variable `sensitive: true` không được render vào client-visible template.

### POST /instantiate — Request body

```json
{
  "projectId": "<uuid>",
  "targetDocumentId": "<uuid>",
  "variables": {
    "PROJECT_NAME": "Scopery Phase 4",
    "CONTRACT_VALUE": "500,000,000 VND"
  }
}
```

Server substitute `{{VARIABLE_KEY}}` placeholders trong AST → lưu vào `targetDocumentId` với revision type `TEMPLATE_CREATE`.

**Response:** `DocumentContentResponse` (giống section 1)

---

# 8. DocumentHub — Client Visibility

**Base:** `/api/v1/projects/{projectId}/documents/{documentId}`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../client-visibility/enable` | Bật client visibility cho document |
| `POST` | `.../client-visibility/disable` | Tắt client visibility |
| `POST` | `.../validate-client-visibility` | Validate các vấn đề trước khi bật client visibility |

### POST /validate-client-visibility — Response

```json
{
  "valid": false,
  "issues": [
    {
      "issueType": "RESTRICTED_CLASSIFICATION",
      "message": "Document classification is RESTRICTED — not eligible for client visibility",
      "resourceId": null
    },
    {
      "issueType": "INTERNAL_MENTION",
      "message": "Document contains internal USER mention",
      "resourceId": "<uuid>"
    }
  ]
}
```

> **Guard:** Document có `classification = RESTRICTED` → không thể bật client visibility → 409 `CLIENT_VISIBILITY_NOT_ALLOWED`.

---

# 9. ResourceReference — Resource Types

**Base:** `/api/v1/resource-references/types`

Registry của tất cả resource types có thể được mention trong document (seeded 24 types khi app khởi động).

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/resource-references/types` | Danh sách tất cả resource types |
| `GET` | `/api/v1/resource-references/types/enabled` | Chỉ types đang enabled (dùng cho mention picker) |
| `GET` | `/api/v1/resource-references/types/{id}` | Lấy theo ID |
| `POST` | `/api/v1/resource-references/types` | Tạo custom resource type |
| `POST` | `/api/v1/resource-references/types/{id}/deprecate` | Deprecate resource type |

### POST — Request body

```json
{
  "typeCode": "CUSTOM_ASSET",
  "label": "Custom Asset",
  "description": "Tài sản tùy chỉnh",
  "system": false
}
```

### ResourceTypeResponse

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | |
| `typeCode` | String | VD: `USER`, `TEAM`, `TASK`, `DOCUMENT`, `REQUIREMENT`... |
| `label` | String | |
| `description` | String | |
| `enabled` | boolean | |
| `system` | boolean | Có phải system-seeded type |
| `createdAt` | Instant | |

**24 system resource types được seed sẵn (không thể delete):**
`USER`, `TEAM`, `PROJECT`, `TASK`, `DOCUMENT`, `REQUIREMENT`, `TEST_CASE`, `BUG`, `SPRINT`, `EPIC`, `MILESTONE`, `RISK`, `ISSUE`, `CHANGE_REQUEST`, `MEETING`, `DECISION`, `ACTION_ITEM`, `KNOWLEDGE_ARTICLE`, `CONTRACT`, `ASSET`, `PROCESS`, `ROLE`, `DEPARTMENT`, `WORKSPACE`

---

# 10. ResourceReference — Batch Resolve

**Base:** `/api/v1/resource-references/batch-resolve`

Resolve nhiều resource refs cùng lúc (max 200) — dùng cho mention display trong editor.

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/resource-references/batch-resolve` | Resolve batch refs |

### POST — Request body

```json
{
  "refs": [
    { "resourceType": "USER", "resourceId": "<uuid>" },
    { "resourceType": "TASK", "resourceId": "<uuid>" },
    { "resourceType": "DOCUMENT", "resourceId": "<uuid>" }
  ]
}
```

> Max 200 refs mỗi request. Vượt quá → 400.

### Response — `List<ResolvedResourceResponse>`

```json
[
  {
    "resourceType": "USER",
    "resourceId": "<uuid>",
    "displayName": "Nguyen Van A",
    "avatarUrl": null,
    "accessible": true
  },
  {
    "resourceType": "TASK",
    "resourceId": "<uuid>",
    "displayName": null,
    "avatarUrl": null,
    "accessible": false
  }
]
```

| Field | Type | Mô tả |
|---|---|---|
| `resourceType` | String | |
| `resourceId` | UUID | |
| `displayName` | String | null nếu không có quyền |
| `avatarUrl` | String | null nếu không có / không hỗ trợ |
| `accessible` | boolean | false = không có quyền đọc — hiển thị `[Access Revoked]` |

> **BR-NDE-021:** Mention không grant access — nếu user không có quyền xem resource, `accessible = false`.

---

# 11. AI Context

**Base:** `/api/v1/ai-context`

Module resolve context từ native document content để feed vào AI prompt.

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/ai-context/resolve` | Resolve AI context từ document |
| `POST` | `/api/v1/ai-context/policies` | Tạo resolution policy |
| `GET` | `/api/v1/ai-context/audit?documentId=<uuid>&page=0&size=20` | Lấy audit log resolution |

### POST /resolve — Request body

```json
{
  "policyId": "<uuid>",
  "projectId": "<uuid>",
  "documentId": "<uuid>"
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `policyId` | UUID | | Policy quy định maxTokens, includeRelated. Nếu null → dùng default (4000 tokens) |
| `projectId` | UUID | | Dùng để check authorization |
| `documentId` | UUID | | Document cần resolve context |

### POST /resolve — Response (`AiContextResolutionResult`)

```json
{
  "documentId": "<uuid>",
  "contextText": "Nội dung plain text được slice theo maxTokens...",
  "tokenCount": 1240,
  "blockCount": 8,
  "citations": [
    {
      "blockId": "block-abc",
      "documentId": "<uuid>",
      "documentTitle": "SRS v1.0",
      "headingPath": "3.2 Functional Requirements"
    }
  ],
  "auditId": "<uuid>"
}
```

> **BR-NDE-035:** AI dùng quyền của actor (người gọi), không có service account bypass.
> **BR-NDE-022:** `AI_READ` permission riêng — không dùng chung `DOCUMENT_HUB_VIEW`.

> Audit record được persist kể cả khi resolution bị partial failure.

### POST /policies — Request body

```json
{
  "workspaceId": "<uuid>",
  "policyCode": "STANDARD_CONTEXT",
  "label": "Standard 8k token context",
  "maxTokens": 8000,
  "includeRelated": false
}
```

### AiContextPolicyResponse

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | |
| `workspaceId` | UUID | |
| `policyCode` | String | |
| `label` | String | |
| `maxTokens` | int | |
| `includeRelated` | boolean | Có fetch related documents via relation links |
| `enabled` | boolean | |

### GET /audit — Response (`PageResponse<AiContextAuditEntry>`)

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | |
| `policyId` | UUID | |
| `documentId` | UUID | |
| `actorId` | UUID | |
| `tokenCount` | Integer | |
| `blockCount` | Integer | |
| `status` | String | `SUCCESS` \| `FAILED` |
| `errorMessage` | String | null nếu SUCCESS |

---

# Error Codes — Wave 4.1

| Error Code | HTTP | Khi nào |
|---|---|---|
| `CONTENT_NOT_FOUND` | 404 | Document chưa có native content |
| `CONTENT_NOT_SUPPORTED` | 422 | Document ở FILE mode, không hỗ trợ native content |
| `CONTENT_OPTIMISTIC_LOCK_CONFLICT` | 409 | `expectedBaseRevisionNo` không khớp server |
| `CONTENT_INVALID` | 400 | AST không hợp lệ |
| `CONTENT_TOO_LARGE` | 422 | AST vượt giới hạn size |
| `BLOCK_LIMIT_EXCEEDED` | 422 | Số blocks vượt giới hạn |
| `BLOCK_DEPTH_EXCEEDED` | 422 | Depth của block tree vượt giới hạn |
| `DUPLICATE_BLOCK_ID` | 400 | Hai blocks có cùng ID |
| `DOCUMENT_LOCKED_FOR_EDIT` | 409 | Document đang bị lock |
| `ATTACHMENT_NOT_FOUND` | 404 | |
| `ATTACHMENT_NOT_AVAILABLE` | 422 | Attachment chưa complete upload |
| `ATTACHMENT_SCOPE_MISMATCH` | 422 | Attachment thuộc document khác |
| `COMMENT_THREAD_NOT_FOUND` | 404 | |
| `COMMENT_NOT_FOUND` | 404 | |
| `COMMENT_ANCHOR_INVALID` | 422 | Block ID không tồn tại trong document |
| `SUGGESTION_NOT_FOUND` | 404 | |
| `SUGGESTION_BASE_REVISION_CONFLICT` | 409 | Revision không khớp khi accept |
| `SYNCED_BLOCK_NOT_FOUND` | 404 | |
| `SYNCED_BLOCK_CYCLE_DETECTED` | 409 | Synced block tự reference (cycle) |
| `TEMPLATE_VARIABLE_MISSING` | 422 | Thiếu required variable khi instantiate |
| `CLIENT_VISIBILITY_NOT_ALLOWED` | 409 | Document RESTRICTED không thể public |
| `AI_CONTEXT_POLICY_NOT_FOUND` | 404 | |
| `AI_CONTEXT_RESOLUTION_FAILED` | 422 | |
| `AI_CONTEXT_ACCESS_DENIED` | 403 | |
| `MENTION_TYPE_DISABLED` | 422 | Resource type bị disabled |

---

# Outbox Events — Wave 4.1

FE có thể subscribe qua WebSocket/SSE để nhận real-time updates:

| Event Code | Trigger | Payload fields |
|---|---|---|
| `DOCUMENT_CONTENT_SAVED` | Content save thành công | `documentId`, `revisionNo`, `projectId`, `checksum` |
| `DOCUMENT_MENTION_EXTRACTED` | Mention mới được extract | `documentId`, `workspaceId`, `mentionedIds` |
| `DOCUMENT_COMMENT_THREAD_OPENED` | Thread mới được mở | `documentId`, `threadId` |
| `DOCUMENT_COMMENT_THREAD_RESOLVED` | Thread được resolve | `documentId`, `threadId` |
| `DOCUMENT_SUGGESTION_CREATED` | Suggestion mới được tạo | `documentId`, `suggestionId` |
| `DOCUMENT_SUGGESTION_ACCEPTED` | Suggestion được accept | `documentId`, `suggestionId`, `resultRevisionNo` |
| `DOCUMENT_SUGGESTION_REJECTED` | Suggestion bị reject | `documentId`, `suggestionId` |
| `SYNCED_BLOCK_UPDATED` | Synced block được update | `syncedBlockId`, `documentId`, `revisionNo` |

---

# Migrations Summary

| Migration | Nội dung |
|---|---|
| V101 | Alter `documenthub_document` — thêm native editor columns (`content_mode`, `current_content_revision_no`, `content_checksum`, `client_visible`, ...) |
| V102 | Tạo `documenthub_content` (JSONB AST, optimistic lock `@Version`) + `documenthub_revision` (immutable) |
| V103 | Tạo `documenthub_attachment` |
| V104 | Tạo `documenthub_block_index` |
| V105 | Tạo `documenthub_mention` + `documenthub_relation` |
| V106 | Tạo `resourceref_resource_type` |
| V107 | Tạo `documenthub_comment_thread` + `documenthub_comment` + `documenthub_comment_reply` |
| V108 | Tạo `documenthub_suggestion` + `documenthub_suggestion_operation` |
| V109 | Tạo `documenthub_synced_block` + `documenthub_synced_block_revision` + `documenthub_synced_block_reference` |
| V110 | Alter `documenthub_template` (thêm `template_mode`) + `documenthub_template_version` (thêm `ast`) + tạo `documenthub_native_template_variable` |
| V111 | Tạo `aicontext_resolution_policy` + `aicontext_resolution_audit` |
| V112 | Thêm `NATIVE_DOCUMENT_CONTENT` vào knowledge source type CHECK constraint |
