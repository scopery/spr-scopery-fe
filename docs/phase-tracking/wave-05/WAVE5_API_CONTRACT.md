# Wave 5 API Contract — AI Assistant (Chat) + AI Agent Configuration

> **Mục đích:** Tài liệu tham chiếu đầy đủ cho FE ráp UI Wave 5 — toàn bộ tính năng AI Assistant Chat (conversation, messaging, SSE streaming, guide, feedback) và AI Agent Configuration (provider, model, deployment, capability, agent, prompt, event config, usage policy, provider secret, execution, playground, tools).
>
> **Swagger live:** `http://localhost:8080/swagger-ui.html`
> **OpenAPI JSON:** `http://localhost:8080/v3/api-docs`

---

## Conventions

| Item | Quy ước |
|---|---|
| Response wrapper | `ApiResponse<T>`: `{ "success": true, "data": {...}, "timestamp": "..." }` |
| Paginated list | `PageResponse<T>`: `{ "items": [], "page": 0, "size": 20, "totalElements": 0, "totalPages": 0, "first": true, "last": true }` |
| Error | `{ "success": false, "errorCode": "...", "message": "...", "traceId": "..." }` |
| Auth | JWT trong HttpOnly cookie `access_token` (set tự động qua `/api/iam/auth/login`) + CSRF: header `X-XSRF-TOKEN` = giá trị lấy từ cookie `XSRF-TOKEN` |
| AI Assistant headers | `X-Actor-Id: <uuid>` (user id), `X-Workspace-Id: <uuid>` (workspace id) |
| AI Agent base path | `/api/ai-agent` |
| AI Assistant base path | `/api/v1/ai-assistant` |

---

## Protocol Types

> **Mỗi endpoint được đánh dấu rõ protocol:**
>
> - `[REST]` — Standard HTTP JSON request/response
> - `[SSE]` — Server-Sent Events stream (`Accept: text/event-stream`)
> - `[REST → SSE]` — Gọi REST để nhận `streamUrl`, sau đó kết nối SSE tới `streamUrl` để nhận token-by-token stream

---

## Module Index

| # | Module | Base path |
|---|---|---|
| [A](#a-ai-assistant--conversations) | AI Assistant — Conversations | `/api/v1/ai-assistant/conversations` |
| [B](#b-ai-assistant--messages) | AI Assistant — Messages | `/api/v1/ai-assistant/messages` |
| [C](#c-ai-assistant--guide) | AI Assistant — Guide | `/api/v1/ai-assistant/guides` |
| [D](#d-ai-assistant--feedback) | AI Assistant — Feedback | `/api/v1/ai-assistant/feedbacks` |
| [E](#e-ai-agent--providers) | AI Agent — Providers | `/api/ai-agent/providers` |
| [F](#f-ai-agent--provider-secrets) | AI Agent — Provider Secrets | `/api/ai-agent/provider-secrets` |
| [G](#g-ai-agent--ai-models) | AI Agent — AI Models | `/api/ai-agent/models` |
| [H](#h-ai-agent--model-deployments) | AI Agent — Model Deployments | `/api/ai-agent/model-deployments` |
| [I](#i-ai-agent--model-parameter-capabilities) | AI Agent — Model Parameter Capabilities | `/api/ai-agent/model-parameter-capabilities` |
| [J](#j-ai-agent--agents) | AI Agent — Agents | `/api/ai-agent/agents` |
| [K](#k-ai-agent--prompt-templates) | AI Agent — Prompt Templates | `/api/ai-agent/prompt-templates` |
| [L](#l-ai-agent--prompt-versions) | AI Agent — Prompt Versions | `/api/ai-agent/prompt-versions` |
| [M](#m-ai-agent--event-configurations) | AI Agent — Event Configurations | `/api/ai-agent/event-configs` |
| [N](#n-ai-agent--usage-policies) | AI Agent — Usage Policies | `/api/ai-agent/usage-policies` |
| [O](#o-ai-agent--executions) | AI Agent — Executions | `/api/ai-agent/executions` |
| [P](#p-ai-agent--execution-logs) | AI Agent — Execution Logs | `/api/ai-agent/execution-logs` |
| [Q](#q-ai-agent--playground) | AI Agent — Playground | `/api/ai-agent/playground` |
| [R](#r-ai-agent--tools) | AI Agent — Tools | `/api/ai-agent/tools` |

---

# A. AI Assistant — Conversations

**Base:** `/api/v1/ai-assistant/conversations`

**Headers bắt buộc:** `X-Actor-Id`, `X-Workspace-Id`

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/conversations` | [REST] | 201 | Tạo conversation mới |
| `GET` | `/conversations` | [REST] | 200 | Danh sách conversations của actor (paginated) |
| `GET` | `/conversations/{id}` | [REST] | 200 | Lấy chi tiết conversation |
| `PATCH` | `/conversations/{id}/title` | [REST] | 200 | Đổi tên conversation |
| `DELETE` | `/conversations/{id}` | [REST] | 204 | Soft-delete conversation |
| `POST` | `/conversations/{id}/archive` | [REST] | 200 | Archive conversation |

---

### POST `/conversations` — Tạo conversation

**Request body:**
```json
{
  "workspaceId": "uuid",
  "projectId": "uuid | null",
  "conversationType": "GENERAL_GUIDE | PROJECT_ASSISTANT",
  "capabilityLevel": "GUIDE | CONTEXTUAL_ANSWER",
  "assistantAgentId": "uuid | null",
  "title": "string (max 200) | null"
}
```

**Response `data`:**
```json
{
  "id": "uuid",
  "workspaceId": "uuid",
  "projectId": "uuid | null",
  "ownerUserId": "uuid",
  "conversationType": "GENERAL_GUIDE",
  "capabilityLevel": "CONTEXTUAL_ANSWER",
  "status": "ACTIVE",
  "title": "string | null",
  "lastMessageAt": "ISO-8601 | null",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

---

### GET `/conversations` — Danh sách

**Query params:**
| Param | Type | Mô tả |
|---|---|---|
| `page` | int (default 0) | Trang |
| `size` | int (default 20) | Kích thước trang |

**Response `data`:** `PageResponse<AiConversationResponse>` (xem schema bên trên)

---

### PATCH `/conversations/{id}/title`

**Request body:**
```json
{ "title": "New title (max 200)" }
```

---

# B. AI Assistant — Messages

**Base:** `/api/v1/ai-assistant`

**Headers bắt buộc:** `X-Actor-Id`, `X-Workspace-Id`

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/conversations/{conversationId}/messages` | [REST → SSE] | 202 | Gửi message, nhận `streamUrl` |
| `GET` | `/messages/{messageId}/stream` | **[SSE]** | 200 | Stream token-by-token qua SSE |
| `GET` | `/conversations/{conversationId}/messages` | [REST] | 200 | Lịch sử messages (paginated) |
| `GET` | `/messages/{messageId}` | [REST] | 200 | Lấy chi tiết một message |
| `POST` | `/messages/{messageId}/cancel` | [REST] | 200 | Yêu cầu cancel stream đang chạy |

---

### POST `/conversations/{conversationId}/messages` — Gửi message

> **Flow 2 bước:** POST để tạo → nhận `streamUrl` → GET `streamUrl` với SSE để nhận stream.

**Request body:**
```json
{
  "content": "string (max 8000 ký tự, bắt buộc)",
  "idempotencyKey": "string (max 200) | null",
  "modelProvider": "string | null",
  "modelName": "string | null",
  "pageCode": "string | null",
  "entityType": "string | null",
  "entityId": "uuid | null"
}
```

**Response (202 Accepted) `data`:**
```json
{
  "conversationId": "uuid",
  "userMessageId": "uuid",
  "assistantMessageId": "uuid",
  "turnId": "uuid",
  "streamUrl": "/api/v1/ai-assistant/messages/{assistantMessageId}/stream"
}
```

> ⚠️ `streamUrl` là đường dẫn tương đối. Kết nối SSE tới URL này ngay sau khi nhận được 202.

---

### GET `/messages/{messageId}/stream` — SSE Stream

> **Protocol: SSE** — kết nối với header `Accept: text/event-stream`.

**Hỗ trợ reconnect:** Gửi header `Last-Event-ID: <sequenceNumber>` để replay các events bị bỏ lỡ (events được lưu trong Redis 24h).

**SSE Event format:**
```
id: {sequenceNumber}
event: {eventType}
data: {JSON payload}
```

**Các event types:**

| `event` | `data` | Mô tả |
|---|---|---|
| `STATUS_CHANGED` | `{ "status": "GENERATING" }` | Trạng thái message thay đổi |
| `TOKEN` | `{ "token": "Hello", "sequenceInMessage": 3 }` | Một token output từ LLM |
| `TOOL_CALL` | `{ "toolName": "...", "input": {...} }` | AI đang gọi tool |
| `TOOL_RESULT` | `{ "toolName": "...", "result": {...} }` | Kết quả tool trả về |
| `COMPLETED` | `{ "messageId": "uuid", "totalTokens": 123 }` | Stream hoàn tất |
| `ERROR` | `{ "errorCode": "...", "message": "..." }` | Lỗi trong quá trình stream |
| `comment: heartbeat` | _(không có data)_ | Heartbeat mỗi 15s để giữ kết nối |

**Ví dụ kết nối (JavaScript):**
```javascript
const source = new EventSource(
  `${BASE_URL}/api/v1/ai-assistant/messages/${assistantMessageId}/stream`,
  { withCredentials: true }
);

source.addEventListener('TOKEN', (e) => {
  const { token } = JSON.parse(e.data);
  appendToUI(token);
});

source.addEventListener('COMPLETED', (e) => {
  source.close();
});

source.addEventListener('ERROR', (e) => {
  console.error(JSON.parse(e.data));
  source.close();
});
```

---

### GET `/conversations/{conversationId}/messages` — Lịch sử

**Query params:** `page`, `size`

**Response `data`:** `PageResponse<AiMessageResponse>`

**`AiMessageResponse` schema:**
```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "turnId": "uuid",
  "sequenceInConversation": 5,
  "role": "USER | ASSISTANT | SYSTEM | TOOL_REQUEST | TOOL_RESULT",
  "status": "RECEIVED | QUEUED | CONTEXTUALIZING | RETRIEVING | GENERATING | STREAMING | CANCEL_REQUESTED | COMPLETED | FAILED | CANCELLED | BLOCKED",
  "content": "string | null",
  "responseMode": "STREAMING | BATCH",
  "inputTokenCount": 150,
  "outputTokenCount": 80,
  "errorCode": "string | null",
  "createdAt": "ISO-8601",
  "completedAt": "ISO-8601 | null"
}
```

---

### POST `/messages/{messageId}/cancel`

**Query param:** `conversationId` (bắt buộc)

**Response `data`:** `AiMessageResponse` với status `CANCEL_REQUESTED` hoặc `CANCELLED`

---

# C. AI Assistant — Guide

**Base:** `/api/v1/ai-assistant/guides`

**Header:** `X-Actor-Id` (optional)

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `GET` | `/guides/suggested-questions` | [REST] | 200 | Lấy danh sách suggested questions cho một page |
| `POST` | `/guides/explain-page` | [REST → SSE] | 202 | Giải thích page cho user → stream qua SSE |
| `POST` | `/guides/explain-field` | [REST → SSE] | 202 | Giải thích một field trong form → stream qua SSE |
| `POST` | `/guides/explain-disabled-action` | [REST → SSE] | 202 | Giải thích tại sao một action bị disabled → stream qua SSE |

---

### GET `/guides/suggested-questions`

**Query params:**
| Param | Required | Mô tả |
|---|---|---|
| `pageCode` | ✓ | Code định danh page (vd: `TASK_DETAIL`, `PROJECT_OVERVIEW`) |
| `entityType` | - | Loại entity đang hiển thị (vd: `TASK`, `DOCUMENT`) |
| `locale` | - (default `en-US`) | Ngôn ngữ trả về |

**Response `data`:** `List<AiSuggestedQuestionResponse>`
```json
[
  { "id": "uuid", "question": "Làm thế nào để tạo task mới?", "pageCode": "TASK_DETAIL", "locale": "en-US" }
]
```

---

### POST `/guides/explain-page`

**Request body:**
```json
{
  "workspaceId": "uuid (bắt buộc)",
  "projectId": "uuid | null",
  "pageCode": "string (bắt buộc)",
  "locale": "string | null (default: en-US)"
}
```

**Response (202) `data`:** `AiSseStartResponse` (xem [mục B](#b-ai-assistant--messages) — `streamUrl` để kết nối SSE)

---

### POST `/guides/explain-field`

**Request body:**
```json
{
  "workspaceId": "uuid (bắt buộc)",
  "projectId": "uuid | null",
  "pageCode": "string (bắt buộc)",
  "fieldCode": "string (bắt buộc)",
  "locale": "string | null"
}
```

**Response (202) `data`:** `AiSseStartResponse`

---

### POST `/guides/explain-disabled-action`

**Request body:**
```json
{
  "workspaceId": "uuid (bắt buộc)",
  "projectId": "uuid | null",
  "pageCode": "string (bắt buộc)",
  "actionCode": "string (bắt buộc)",
  "locale": "string | null"
}
```

**Response (202) `data`:** `AiSseStartResponse`

---

# D. AI Assistant — Feedback

**Base:** `/api/v1/ai-assistant/feedbacks`

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/feedbacks` | [REST] | 201 | Gửi feedback cho một message |

### POST `/feedbacks`

**Request body:**
```json
{
  "conversationId": "uuid (bắt buộc)",
  "messageId": "uuid (bắt buộc)",
  "rating": "THUMBS_UP | THUMBS_DOWN (bắt buộc)",
  "reasonCode": "string | null",
  "comment": "string (max 2000) | null"
}
```

**Response `data`:** feedback object với id và createdAt

---

# E. AI Agent — Providers

**Base:** `/api/ai-agent/providers`

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/providers` | [REST] | 201 | Tạo AI provider mới |
| `PUT` | `/providers/{id}` | [REST] | 200 | Cập nhật provider |
| `GET` | `/providers/{id}` | [REST] | 200 | Lấy chi tiết provider |
| `GET` | `/providers` | [REST] | 200 | Tìm kiếm / danh sách providers (paginated) |
| `PATCH` | `/providers/{id}/activate` | [REST] | 200 | Activate provider |
| `PATCH` | `/providers/{id}/deactivate` | [REST] | 200 | Deactivate provider |

### POST `/providers`

**Request body:**
```json
{
  "name": "string (bắt buộc)",
  "code": "string (bắt buộc, unique)",
  "type": "LLM | EMBEDDING | OCR | IMAGE | RERANKING (bắt buộc)",
  "apiBaseUrl": "string | null",
  "description": "string | null"
}
```

**Response `data`:**
```json
{
  "id": "uuid",
  "name": "string",
  "code": "string",
  "type": "LLM",
  "status": "INACTIVE",
  "apiBaseUrl": "string | null",
  "description": "string | null",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

### GET `/providers` — Query params

| Param | Mô tả |
|---|---|
| `keyword` | Tìm theo name hoặc code (partial) |
| `type` | Filter: `LLM`, `EMBEDDING`, `OCR`, `IMAGE`, `RERANKING` |
| `status` | Filter: `ACTIVE`, `INACTIVE`, `DEPRECATED` |
| `page`, `size` | Pagination |

---

# F. AI Agent — Provider Secrets

**Base:** `/api/ai-agent/provider-secrets`

> Quản lý API key của provider — giá trị được mã hóa AES-256, **không bao giờ trả về raw key**.

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/provider-secrets` | [REST] | 200 | Lưu / cập nhật API key (deactivate key cũ tự động) |
| `PUT` | `/provider-secrets/{id}/rotate` | [REST] | 200 | Rotate secret (tạo record mới, deactivate cũ) |
| `PATCH` | `/provider-secrets/{id}/deactivate` | [REST] | 200 | Deactivate secret |
| `GET` | `/provider-secrets/{id}` | [REST] | 200 | Lấy chi tiết (chỉ masked value) |
| `GET` | `/provider-secrets` | [REST] | 200 | Tìm kiếm secrets (paginated) |

### POST `/provider-secrets`

**Request body:**
```json
{
  "providerId": "uuid (bắt buộc)",
  "secretType": "API_KEY | OAUTH_CLIENT_SECRET | BEARER_TOKEN (bắt buộc)",
  "secretValue": "string (raw key, bắt buộc — sẽ được encrypt ngay lập tức)",
  "description": "string | null"
}
```

**Response `data`:**
```json
{
  "id": "uuid",
  "providerId": "uuid",
  "secretType": "API_KEY",
  "maskedValue": "sk-proj-****...****",
  "status": "ACTIVE",
  "keyVersion": "v1",
  "createdAt": "ISO-8601"
}
```

---

# G. AI Agent — AI Models

**Base:** `/api/ai-agent/models`

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/models` | [REST] | 201 | Tạo AI model mới |
| `PUT` | `/models/{id}` | [REST] | 200 | Cập nhật model |
| `GET` | `/models/{id}` | [REST] | 200 | Chi tiết model |
| `GET` | `/models` | [REST] | 200 | Tìm kiếm models (paginated) |
| `PATCH` | `/models/{id}/activate` | [REST] | 200 | Activate |
| `PATCH` | `/models/{id}/deactivate` | [REST] | 200 | Deactivate |

### POST `/models`

**Request body:**
```json
{
  "providerId": "uuid (bắt buộc)",
  "name": "string (bắt buộc)",
  "code": "string (bắt buộc, unique trong provider)",
  "providerModelId": "string | null (model ID theo provider, vd: gpt-4o)",
  "type": "CHAT | EMBEDDING | IMAGE | OCR | RERANKING | INTERNAL (bắt buộc)",
  "description": "string | null"
}
```

### GET `/models` — Query params

| Param | Mô tả |
|---|---|
| `providerId` | Filter theo provider |
| `keyword` | Tìm theo name, code, providerModelId |
| `status` | `ACTIVE`, `INACTIVE`, `DEPRECATED` |
| `type` | `CHAT`, `EMBEDDING`, `IMAGE`, `OCR`, `RERANKING`, `INTERNAL` |
| `page`, `size` | Pagination |

---

# H. AI Agent — Model Deployments

**Base:** `/api/ai-agent/model-deployments`

> Deployment = cấu hình runtime của một model trong một environment cụ thể.

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/model-deployments` | [REST] | 201 | Tạo deployment |
| `PUT` | `/model-deployments/{id}` | [REST] | 200 | Cập nhật deployment |
| `GET` | `/model-deployments/{id}` | [REST] | 200 | Chi tiết deployment |
| `GET` | `/model-deployments` | [REST] | 200 | Tìm kiếm deployments (paginated) |
| `PATCH` | `/model-deployments/{id}/activate` | [REST] | 200 | Activate |
| `PATCH` | `/model-deployments/{id}/deactivate` | [REST] | 200 | Deactivate |
| `PATCH` | `/model-deployments/{id}/set-default` | [REST] | 200 | Đặt làm default cho model+environment |

### POST `/model-deployments`

**Request body:**
```json
{
  "modelId": "uuid (bắt buộc)",
  "name": "string (bắt buộc)",
  "code": "string (bắt buộc, unique)",
  "environment": "DEV | UAT | PROD (bắt buộc)",
  "providerDeploymentId": "string | null",
  "endpointUrl": "string | null",
  "defaultTemperature": "number | null",
  "defaultMaxOutputTokens": "integer | null",
  "isDefault": "boolean | null",
  "description": "string | null"
}
```

### GET `/model-deployments` — Query params

| Param | Mô tả |
|---|---|
| `modelId` | Filter theo model |
| `environment` | `DEV`, `UAT`, `PROD` |
| `keyword` | Tìm theo name, code, providerDeploymentId |
| `status` | `ACTIVE`, `INACTIVE`, `DEPRECATED` |
| `isDefault` | `true` / `false` |
| `page`, `size` | Pagination |

---

# I. AI Agent — Model Parameter Capabilities

**Base:** `/api/ai-agent/model-parameter-capabilities`

> Định nghĩa tham số nào một model hỗ trợ (temperature, max_tokens, top_p, v.v.)

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/model-parameter-capabilities` | [REST] | 201 | Thêm capability |
| `PUT` | `/model-parameter-capabilities/{id}` | [REST] | 200 | Cập nhật |
| `GET` | `/model-parameter-capabilities/{id}` | [REST] | 200 | Chi tiết |
| `GET` | `/model-parameter-capabilities` | [REST] | 200 | Tìm kiếm (paginated) |
| `PATCH` | `/model-parameter-capabilities/{id}/activate` | [REST] | 200 | Activate |
| `PATCH` | `/model-parameter-capabilities/{id}/deactivate` | [REST] | 200 | Deactivate |

### POST `/model-parameter-capabilities`

**Request body:**
```json
{
  "modelId": "uuid (bắt buộc)",
  "parameterName": "string (bắt buộc, vd: temperature)",
  "apiParameterKey": "string | null",
  "supportStatus": "YES | NO | CONDITIONAL (bắt buộc)",
  "valueType": "NUMBER | INTEGER | STRING | BOOLEAN | null",
  "minValue": "string | null",
  "maxValue": "string | null",
  "defaultValue": "string | null",
  "nullable": "boolean | null",
  "ifNullBehavior": "DO_NOT_SEND_PARAMETER | USE_PROVIDER_DEFAULT | null",
  "description": "string | null"
}
```

### GET query params: `modelId`, `parameterName`, `supportStatus`, `valueType`, `status`, `page`, `size`

---

# J. AI Agent — Agents

**Base:** `/api/ai-agent/agents`

> Agent = profile AI business agent, định nghĩa behavior, scope, model mặc định.

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/agents` | [REST] | 201 | Tạo agent |
| `PUT` | `/agents/{id}` | [REST] | 200 | Cập nhật |
| `GET` | `/agents/{id}` | [REST] | 200 | Chi tiết |
| `GET` | `/agents` | [REST] | 200 | Tìm kiếm (paginated) |
| `PATCH` | `/agents/{id}/activate` | [REST] | 200 | Activate |
| `PATCH` | `/agents/{id}/deactivate` | [REST] | 200 | Deactivate |

### POST `/agents`

**Request body:**
```json
{
  "name": "string (bắt buộc)",
  "code": "string (bắt buộc, unique)",
  "type": "EXTRACTION | CLASSIFICATION | SUMMARIZATION | GENERATION | VALIDATION | RECOMMENDATION | OTHER (bắt buộc)",
  "description": "string | null",
  "defaultModelDeploymentId": "uuid | null",
  "outputFormat": "TEXT | JSON | MARKDOWN | HTML | TABLE | null",
  "autonomyLevel": "SUPERVISED | SEMI_AUTONOMOUS | AUTONOMOUS | null",
  "scope": "GLOBAL | ORGANIZATION | WORKSPACE | null",
  "organizationId": "uuid | null",
  "workspaceId": "uuid | null"
}
```

### GET `/agents` query params: `keyword`, `type`, `status`, `outputFormat`, `page`, `size`

---

# K. AI Agent — Prompt Templates

**Base:** `/api/ai-agent/prompt-templates`

> Template = container (identity) cho nhiều versions của một prompt.

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/prompt-templates` | [REST] | 201 | Tạo template |
| `PUT` | `/prompt-templates/{id}` | [REST] | 200 | Cập nhật tên/mô tả |
| `GET` | `/prompt-templates/{id}` | [REST] | 200 | Chi tiết |
| `GET` | `/prompt-templates` | [REST] | 200 | Tìm kiếm (paginated) |
| `PATCH` | `/prompt-templates/{id}/activate` | [REST] | 200 | Activate |
| `PATCH` | `/prompt-templates/{id}/deactivate` | [REST] | 200 | Deactivate |

### POST `/prompt-templates`

**Request body:**
```json
{
  "agentId": "uuid (bắt buộc)",
  "name": "string (bắt buộc)",
  "code": "string (bắt buộc, unique)",
  "description": "string | null"
}
```

### GET query params: `agentId`, `keyword`, `status`, `page`, `size`

---

# L. AI Agent — Prompt Versions

**Base:** `/api/ai-agent/prompt-versions`

> Version = nội dung prompt thực tế. Mỗi template có nhiều versions, chỉ 1 version `ACTIVE` tại một thời điểm.

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/prompt-versions` | [REST] | 201 | Tạo version mới (status = `DRAFT`) |
| `PUT` | `/prompt-versions/{id}` | [REST] | 200 | Cập nhật (chỉ khi đang `DRAFT`) |
| `GET` | `/prompt-versions/{id}` | [REST] | 200 | Chi tiết |
| `GET` | `/prompt-versions` | [REST] | 200 | Tìm kiếm (paginated) |
| `PATCH` | `/prompt-versions/{id}/activate` | [REST] | 200 | Activate (archives version `ACTIVE` hiện tại) |
| `PATCH` | `/prompt-versions/{id}/archive` | [REST] | 200 | Archive version |

### POST `/prompt-versions`

**Request body:**
```json
{
  "templateId": "uuid (bắt buộc)",
  "title": "string (bắt buộc)",
  "content": "string (nội dung prompt, bắt buộc)",
  "contentFormat": "TEXT | MARKDOWN | JSON (bắt buộc)",
  "variableSchema": "JSON string (mô tả biến trong prompt) | null",
  "changeNote": "string | null"
}
```

**Lifecycle:** `DRAFT → ACTIVE → ARCHIVED`

### GET query params: `templateId`, `status` (`DRAFT`, `ACTIVE`, `ARCHIVED`), `contentFormat`, `page`, `size`

---

# M. AI Agent — Event Configurations

**Base:** `/api/ai-agent/event-configs`

> EventConfig = liên kết giữa một business event và một AI agent+prompt+deployment cho một environment.

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/event-configs` | [REST] | 201 | Tạo event config |
| `PUT` | `/event-configs/{id}` | [REST] | 200 | Cập nhật |
| `GET` | `/event-configs/resolve` | [REST] | 200 | Resolve config đang active cho một event+environment |
| `GET` | `/event-configs/{id}` | [REST] | 200 | Chi tiết |
| `GET` | `/event-configs` | [REST] | 200 | Tìm kiếm (paginated) |
| `PATCH` | `/event-configs/{id}/activate` | [REST] | 200 | Activate |
| `PATCH` | `/event-configs/{id}/deactivate` | [REST] | 200 | Deactivate |

### POST `/event-configs`

**Request body:**
```json
{
  "code": "string (bắt buộc, unique)",
  "name": "string (bắt buộc)",
  "eventDefinitionId": "uuid (bắt buộc)",
  "environment": "DEV | UAT | PROD (bắt buộc)",
  "triggerType": "EVENT | MANUAL | SCHEDULED | API (bắt buộc)",
  "agentId": "uuid | null",
  "promptVersionId": "uuid | null",
  "modelDeploymentId": "uuid | null",
  "conditionExpression": "string (SpEL expression) | null",
  "description": "string | null"
}
```

### GET `/event-configs/resolve` — Query params

| Param | Mô tả |
|---|---|
| `eventDefinitionId` | UUID của event definition (dùng cái này **hoặc** `sourceSystem`+`eventKey`) |
| `sourceSystem` | Source system code |
| `eventKey` | Event key (dùng cùng với `sourceSystem`) |
| `environment` | `DEV`/`UAT`/`PROD` (mặc định: runtime environment) |

### GET query params: `keyword`, `eventDefinitionId`, `environment`, `triggerType`, `status`, `agentId`, `page`, `size`

---

# N. AI Agent — Usage Policies

**Base:** `/api/ai-agent/usage-policies`

> Rate limit và budget control cho AI executions.

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/usage-policies` | [REST] | 201 | Tạo usage policy |
| `PUT` | `/usage-policies/{id}` | [REST] | 200 | Cập nhật |
| `GET` | `/usage-policies/{id}` | [REST] | 200 | Chi tiết |
| `GET` | `/usage-policies` | [REST] | 200 | Tìm kiếm (paginated) |
| `PATCH` | `/usage-policies/{id}/activate` | [REST] | 200 | Activate |
| `PATCH` | `/usage-policies/{id}/deactivate` | [REST] | 200 | Deactivate |

### POST `/usage-policies`

**Request body:**
```json
{
  "code": "string (bắt buộc)",
  "name": "string (bắt buộc)",
  "targetType": "GLOBAL | EVENT_CONFIG | AGENT | MODEL_DEPLOYMENT (bắt buộc)",
  "targetId": "uuid | null",
  "maxRequestsPerPeriod": "integer | null",
  "maxTokensPerPeriod": "integer | null",
  "maxCostPerPeriod": "decimal | null",
  "maxConcurrentRequests": "integer | null",
  "dailyBudget": "decimal | null",
  "period": "MINUTE | HOUR | DAY | WEEK | MONTH | null",
  "action": "REJECT | THROTTLE | WARN | null",
  "priority": "integer | null",
  "description": "string | null"
}
```

### GET query params: `keyword`, `targetType`, `status`, `page`, `size`

---

# O. AI Agent — Executions

**Base:** `/api/ai-agent/executions`

> Trigger AI execution — gọi AI agent thực tế qua event hoặc event config ID.

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/executions/event` | [REST] | 200 | Trigger bằng event (eventDefinitionId, eventCode, hoặc sourceSystem+eventKey) |
| `POST` | `/executions/event-config/{eventConfigId}` | [REST] | 200 | Trigger bằng EventConfig ID trực tiếp |

### POST `/executions/event`

**Request body:**
```json
{
  "requestId": "string (idempotency key) | null",
  "eventDefinitionId": "uuid | null",
  "eventCode": "string | null",
  "sourceSystem": "string | null",
  "eventKey": "string | null",
  "environment": "DEV | UAT | PROD | null",
  "triggerSource": "EVENT | MANUAL | API | PLAYGROUND | SCHEDULED | null",
  "inputVariables": { "key": "value" }
}
```

> Cần cung cấp ít nhất một trong: `eventDefinitionId`, `eventCode`, hoặc cặp `sourceSystem`+`eventKey`.

**Response `data`:**
```json
{
  "executionId": "uuid",
  "requestId": "string",
  "eventConfigId": "uuid",
  "status": "SUCCEEDED | FAILED | PENDING",
  "output": "string | null",
  "errorCode": "string | null",
  "errorMessage": "string | null",
  "inputTokenCount": 120,
  "outputTokenCount": 80,
  "totalTokenCount": 200,
  "estimatedCost": "0.0025",
  "durationMs": 1450
}
```

---

# P. AI Agent — Execution Logs

**Base:** `/api/ai-agent/execution-logs`

> Audit log của mọi AI execution. Thường do internal calls tạo ra, nhưng FE dùng để hiển thị lịch sử.

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/execution-logs` | [REST] | 201 | Tạo execution log (thường dùng internally) |
| `PATCH` | `/execution-logs/{id}/running` | [REST] | 200 | Mark as running |
| `PATCH` | `/execution-logs/{id}/succeeded` | [REST] | 200 | Mark as succeeded (với token count + cost) |
| `PATCH` | `/execution-logs/{id}/failed` | [REST] | 200 | Mark as failed (với error info) |
| `PATCH` | `/execution-logs/{id}/cancel` | [REST] | 200 | Cancel |
| `GET` | `/execution-logs/{id}` | [REST] | 200 | Chi tiết log |
| `GET` | `/execution-logs` | [REST] | 200 | Tìm kiếm logs (paginated) |

### GET `/execution-logs` — Query params

| Param | Mô tả |
|---|---|
| `requestId` | Tìm theo requestId (partial) |
| `eventConfigId`, `eventDefinitionId`, `agentId`, `promptVersionId`, `modelDeploymentId` | UUID filters |
| `triggerSource` | `EVENT`, `MANUAL`, `API`, `PLAYGROUND`, `SCHEDULED` |
| `status` | `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELLED` |
| `createdFrom`, `createdTo` | ISO-8601 datetime range |
| `page`, `size` | Pagination |

---

# Q. AI Agent — Playground

**Base:** `/api/ai-agent/playground`

> Test AI agent / event config / prompt trong môi trường sandbox. Chỉ available khi `AIAGENT_PLAYGROUND_ENABLED=true`.

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/playground/event-config/{eventConfigId}/run` | [REST] | 200 | Chạy thử một EventConfig với input variables |
| `POST` | `/playground/direct/run` | [REST] | 200 | Chạy thử trực tiếp (chọn agent + prompt version + deployment) |
| `POST` | `/playground/prompt/preview` | [REST] | 200 | Preview rendered prompt (không gọi AI) |
| `GET` | `/playground/options` | [REST] | 200 | Lấy options cho dropdowns (event configs, agents, prompts, deployments) |

### POST `/playground/event-config/{eventConfigId}/run`

**Request body:**
```json
{
  "requestId": "string | null",
  "inputVariables": { "key": "value" }
}
```

**Response `data`:** `PlaygroundRunResponse` — xem schema tương tự như ExecutionRunResponse bên trên.

### POST `/playground/direct/run`

**Request body:**
```json
{
  "requestId": "string | null",
  "agentId": "uuid (bắt buộc)",
  "promptVersionId": "uuid (bắt buộc)",
  "modelDeploymentId": "uuid (bắt buộc)",
  "inputVariables": { "key": "value" }
}
```

### POST `/playground/prompt/preview`

**Request body:**
```json
{
  "promptVersionId": "uuid (bắt buộc)",
  "inputVariables": { "key": "value" }
}
```

**Response `data`:**
```json
{
  "renderedSystemPrompt": "string",
  "renderedUserPrompt": "string",
  "variables": ["var1", "var2"],
  "missingVariables": []
}
```

### GET `/playground/options` — Query params

| Param | Default | Mô tả |
|---|---|---|
| `includeEventConfigs` | `true` | Kèm danh sách active event configs |
| `includeAgents` | `true` | Kèm danh sách active agents |
| `includePromptVersions` | `true` | Kèm danh sách active prompt versions |
| `includeModelDeployments` | `true` | Kèm danh sách active model deployments |

---

# R. AI Agent — Tools

**Base:** `/api/ai-agent/tools`

> Registry cho governed AI tools (hàm mà AI agent có thể gọi), kèm permission binding và agent binding.

| Method | Path | Protocol | Status | Mô tả |
|---|---|---|---|---|
| `POST` | `/tools` | [REST] | 201 | Đăng ký tool mới |
| `PUT` | `/tools/{id}` | [REST] | 200 | Cập nhật tool |
| `GET` | `/tools/{id}` | [REST] | 200 | Chi tiết tool |
| `GET` | `/tools` | [REST] | 200 | Tìm kiếm tools (paginated) |
| `PATCH` | `/tools/{id}/activate` | [REST] | 200 | Activate tool |
| `PATCH` | `/tools/{id}/deactivate` | [REST] | 200 | Deactivate tool |
| `POST` | `/tools/{id}/permissions` | [REST] | 201 | Thêm permission yêu cầu cho tool |
| `DELETE` | `/tools/{id}/permissions/{permissionId}` | [REST] | 200 | Xoá permission binding |
| `POST` | `/tools/{id}/bindings` | [REST] | 201 | Bind tool với agent |
| `GET` | `/tools/{id}/bindings` | [REST] | 200 | Danh sách agents đang bind với tool |
| `DELETE` | `/tools/{id}/bindings/{agentId}` | [REST] | 200 | Unbind agent khỏi tool |
| `POST` | `/tools/{id}/execute` | [REST] | 200 | Execute tool (stub/no-op + ghi log) |

### POST `/tools`

**Request body:**
```json
{
  "code": "string (bắt buộc, unique)",
  "name": "string (bắt buộc)",
  "description": "string | null",
  "category": "string | null",
  "mutationType": "READ_ONLY | WRITE | READ_WRITE | null",
  "requiresHumanApproval": "boolean | null"
}
```

### GET `/tools` query params: `category`, `status`, `q` (keyword), `page`, `size`

### POST `/tools/{id}/permissions`

**Request body:**
```json
{
  "permissionCode": "string (bắt buộc)",
  "description": "string | null"
}
```

### POST `/tools/{id}/bindings`

**Request body:**
```json
{ "agentId": "uuid (bắt buộc)" }
```

---

## Phụ lục — SSE Flow toàn trình

```
[FE]                          [BE]
 |                              |
 |-- POST /conversations -----> |
 |<-- 201 {id: convId} -------- |
 |                              |
 |-- POST /conversations/{id}/messages (content: "...") --> |
 |<-- 202 { streamUrl: "/api/v1/ai-assistant/messages/{msgId}/stream" } ---|
 |                              |
 |-- GET {streamUrl}            |
 |   Accept: text/event-stream  |
 |<-- SSE connected             |
 |<-- event: STATUS_CHANGED --|  (status: GENERATING)
 |<-- event: TOKEN ----------|  (token: "Hello")
 |<-- event: TOKEN ----------|  (token: " world")
 |     ...                     |
 |<-- event: COMPLETED -------|  (totalTokens: 80)
 |-- SSE close                  |
```

**Reconnect sau mất kết nối:**
```javascript
// Browser EventSource tự động reconnect
// Đặt Last-Event-ID từ lần kết nối trước để replay:
const source = new EventSource(streamUrl, {
  withCredentials: true
});
// Browser tự gửi Last-Event-ID header nếu có
```

---

## Phụ lục — Status Enum Reference

### AiConversation.status
`ACTIVE | ARCHIVED | DELETED`

### AiConversation.conversationType
`GENERAL_GUIDE | PROJECT_ASSISTANT`

### AiConversation.capabilityLevel
`GUIDE | CONTEXTUAL_ANSWER`

### AiMessage.role
`USER | ASSISTANT | SYSTEM | TOOL_REQUEST | TOOL_RESULT`

### AiMessage.status
`RECEIVED | QUEUED | CONTEXTUALIZING | RETRIEVING | GENERATING | STREAMING | CANCEL_REQUESTED | COMPLETED | FAILED | CANCELLED | BLOCKED`

### Provider/Model/Deployment/Agent/Prompt.status
`ACTIVE | INACTIVE | DEPRECATED`

### PromptVersion.status
`DRAFT | ACTIVE | ARCHIVED`

### ModelDeployment.environment
`DEV | UAT | PROD`

### Execution.status
`PENDING | RUNNING | SUCCEEDED | FAILED | CANCELLED`
