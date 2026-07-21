# AI Chat Setup Flow — Hướng dẫn cấu hình & tích hợp cho FE

> **Mục đích:** Tài liệu này giải thích **toàn bộ luồng** từ bước cấu hình admin ban đầu cho đến khi user có thể chat được với AI. Dùng khi team FE cần hiểu: setup cái gì, theo thứ tự nào, và gọi API nào để chat hoạt động.
>
> Ref đầy đủ từng endpoint: [WAVE5_API_CONTRACT.md](./WAVE5_API_CONTRACT.md)

---

## Tổng quan kiến trúc

```
Provider  ──owns──►  AI Model  ──has──►  Model Deployment
                                               │
Provider Secret (API Key)                      │
   └──► gắn vào Provider                       │
                                               │
Agent  ──has──►  Prompt Template               │
                     └──►  Prompt Version      │
                                   │           │
                                   └──────┬────┘
                                     Event Config
                                          │
                                     Execution / Chat
```

**Nguyên tắc cơ bản:**
- **Provider** = nhà cung cấp AI (OpenAI, Anthropic, Azure, …)
- **AI Model** = một model cụ thể của provider (GPT-4o, Claude 3.5, …)
- **Model Deployment** = cấu hình runtime của model trong một môi trường (DEV/UAT/PROD), có thể ghi đè tham số như temperature, max_tokens
- **Provider Secret** = API key để gọi provider — được mã hóa AES-256, không bao giờ trả ra raw
- **Agent** = "nhân vật AI" định nghĩa role, scope, output format
- **Prompt Template + Version** = nội dung system prompt (có biến động `{{variableName}}`)
- **Event Config** = liên kết Agent + Prompt Version + Model Deployment với một business event cụ thể
- **Execution** = 1 lần gọi AI thực tế — input variables → rendered prompt → LLM → output

---

## Phần 1 — Admin Setup (làm một lần)

> Các bước này do admin/ops thực hiện. Sau khi xong, FE chat UI chỉ cần gọi Execution API hoặc Conversation API.

### Bước 1 — Tạo Provider

```http
POST /api/ai-agent/providers
```

```json
{
  "name": "OpenAI",
  "code": "OPENAI",
  "type": "LLM",
  "apiBaseUrl": "https://api.openai.com/v1",
  "description": "OpenAI GPT models"
}
```

**Response quan trọng:** lấy `id` của provider vừa tạo.

> **Lưu ý:** Provider mới tạo có status `INACTIVE`. Phải activate sau khi đã gắn secret.

---

### Bước 2 — Gắn API Key cho Provider

```http
POST /api/ai-agent/provider-secrets
```

```json
{
  "providerId": "<provider-id>",
  "secretType": "API_KEY",
  "secretValue": "sk-proj-xxxxxxxxxxxx",
  "description": "OpenAI production key"
}
```

**Response quan trọng:** `maskedValue` (dạng `sk-proj-****...****`) để hiển thị UI. Raw key **không bao giờ** được trả lại.

> ⚠️ `secretValue` chỉ gửi 1 lần khi create. Sau đó nếu muốn thay key, dùng `PUT /provider-secrets/{id}/rotate`.

---

### Bước 3 — Activate Provider

```http
PATCH /api/ai-agent/providers/{id}/activate
```

> Provider phải ở trạng thái `ACTIVE` thì các Model/Deployment của nó mới có thể hoạt động.

---

### Bước 4 — Tạo AI Model

```http
POST /api/ai-agent/models
```

```json
{
  "providerId": "<provider-id>",
  "name": "GPT-4o",
  "code": "GPT4O",
  "providerModelId": "gpt-4o",
  "type": "CHAT",
  "description": "OpenAI GPT-4o cho chat"
}
```

**Field quan trọng:** `providerModelId` — đây là model ID theo provider, BE sẽ dùng field này khi gọi API thực tế.

Sau khi tạo, activate:
```http
PATCH /api/ai-agent/models/{id}/activate
```

---

### Bước 5 — Tạo Model Deployment

```http
POST /api/ai-agent/model-deployments
```

```json
{
  "modelId": "<model-id>",
  "name": "GPT-4o DEV",
  "code": "GPT4O_DEV",
  "environment": "DEV",
  "defaultTemperature": 0.7,
  "defaultMaxOutputTokens": 2048,
  "isDefault": true,
  "description": "GPT-4o deployment cho môi trường DEV"
}
```

**Field quan trọng:**
- `environment`: `DEV | UAT | PROD` — Event Config sẽ chọn Deployment theo environment này
- `isDefault`: `true` để BE tự resolve deployment khi không chỉ định explicit
- `defaultTemperature`, `defaultMaxOutputTokens`: ghi đè tham số của model

Sau khi tạo, activate:
```http
PATCH /api/ai-agent/model-deployments/{id}/activate
```

> Nếu muốn set default sau: `PATCH /api/ai-agent/model-deployments/{id}/set-default`

---

### Bước 6 — Tạo Agent

```http
POST /api/ai-agent/agents
```

```json
{
  "name": "Scopery Assistant",
  "code": "SCOPERY_ASSISTANT",
  "type": "GENERATION",
  "description": "AI assistant chính của Scopery",
  "defaultModelDeploymentId": "<deployment-id>",
  "outputFormat": "MARKDOWN",
  "autonomyLevel": "SUPERVISED",
  "scope": "GLOBAL"
}
```

**Field quan trọng:**
- `defaultModelDeploymentId`: deployment mặc định khi Event Config không ghi đè
- `outputFormat`: `TEXT | JSON | MARKDOWN | HTML | TABLE`
- `scope`: `GLOBAL | ORGANIZATION | WORKSPACE`

Activate:
```http
PATCH /api/ai-agent/agents/{id}/activate
```

---

### Bước 7 — Tạo Prompt Template

```http
POST /api/ai-agent/prompt-templates
```

```json
{
  "agentId": "<agent-id>",
  "name": "Chat General Template",
  "code": "CHAT_GENERAL",
  "description": "Prompt cho luồng chat tổng quát"
}
```

Activate:
```http
PATCH /api/ai-agent/prompt-templates/{id}/activate
```

> Template là container — chưa có nội dung. Nội dung thực nằm ở Prompt Version (Bước 8).

---

### Bước 8 — Tạo Prompt Version và Activate

#### 8a. Tạo version (status = DRAFT)

```http
POST /api/ai-agent/prompt-versions
```

```json
{
  "templateId": "<template-id>",
  "title": "v1 — Chat General",
  "content": "You are Scopery Assistant, a helpful AI for project management.\n\nUser question: {{userMessage}}\n\nContext: {{context}}",
  "contentFormat": "TEXT",
  "variableSchema": "{\"userMessage\": \"string\", \"context\": \"string | null\"}",
  "changeNote": "Initial version"
}
```

**Field quan trọng:**
- `content`: nội dung prompt, dùng `{{variableName}}` để đánh dấu biến động
- `variableSchema`: mô tả kiểu dữ liệu của từng biến (JSON string)
- `contentFormat`: `TEXT | MARKDOWN | JSON`

#### 8b. Activate version

```http
PATCH /api/ai-agent/prompt-versions/{id}/activate
```

> Activate sẽ tự động **archive** version đang ACTIVE hiện tại (nếu có). Chỉ 1 version ACTIVE tại một thời điểm trên mỗi template.

**Lifecycle:** `DRAFT → ACTIVE → ARCHIVED`

---

### Bước 9 — Tạo Event Config

> Đây là bước quan trọng nhất — nối Agent + Prompt Version + Model Deployment với một business event.

```http
POST /api/ai-agent/event-configs
```

```json
{
  "code": "CHAT_GENERAL_DEV",
  "name": "Chat General — DEV",
  "eventDefinitionId": "<event-definition-id>",
  "environment": "DEV",
  "triggerType": "API",
  "agentId": "<agent-id>",
  "promptVersionId": "<prompt-version-id>",
  "modelDeploymentId": "<deployment-id>",
  "description": "Config cho luồng chat tổng quát ở DEV"
}
```

**Field quan trọng:**
- `eventDefinitionId`: ID của event định nghĩa (lấy từ Event Registry module)
- `triggerType`: `EVENT | MANUAL | SCHEDULED | API` — dùng `API` cho chat flow
- `environment`: phải khớp với environment của Model Deployment

Activate:
```http
PATCH /api/ai-agent/event-configs/{id}/activate
```

> Sau bước này, AI đã sẵn sàng để nhận request chat thực tế.

---

### (Optional) Bước 10 — Tạo Usage Policy

> Chỉ cần nếu muốn rate limit / budget control.

```http
POST /api/ai-agent/usage-policies
```

```json
{
  "code": "CHAT_RATE_LIMIT",
  "name": "Chat Rate Limit",
  "targetType": "EVENT_CONFIG",
  "targetId": "<event-config-id>",
  "maxRequestsPerPeriod": 100,
  "maxTokensPerPeriod": 500000,
  "period": "DAY",
  "action": "REJECT"
}
```

Activate:
```http
PATCH /api/ai-agent/usage-policies/{id}/activate
```

---

## Phần 2 — Sơ đồ dependency

```
Provider (ACTIVE)
  └── AI Model (ACTIVE)
        └── Model Deployment (ACTIVE, environment=DEV)
              │
Provider Secret (ACTIVE, gắn vào Provider)
              │
Agent (ACTIVE)
  └── Prompt Template (ACTIVE)
        └── Prompt Version (ACTIVE)
              │
              ▼
        Event Config (ACTIVE, environment=DEV)
              │
              ▼
        Execution / Chat
```

**Nếu bất kỳ node nào trong chain bị INACTIVE hoặc DEPRECATED, BE sẽ từ chối execution.**

---

## Phần 3 — Chat Flow (FE UI)

> Sau khi admin đã setup xong Phần 1, đây là flow FE dùng cho user chat.

### Option A: AI Assistant Conversation (Luồng đầy đủ có lịch sử)

Dùng khi cần lưu lịch sử hội thoại, context nhiều turn.

```
1. Tạo Conversation
2. Gửi Message → nhận streamUrl
3. Kết nối SSE để nhận token streaming
```

#### Bước A1 — Tạo Conversation

```http
POST /api/v1/ai-assistant/conversations
X-Actor-Id: <user-uuid>
X-Workspace-Id: <workspace-uuid>
```

```json
{
  "workspaceId": "<workspace-uuid>",
  "conversationType": "GENERAL_GUIDE",
  "capabilityLevel": "CONTEXTUAL_ANSWER",
  "assistantAgentId": "<agent-id>"
}
```

**Response:** lưu lại `id` (conversationId).

#### Bước A2 — Gửi Message

```http
POST /api/v1/ai-assistant/conversations/{conversationId}/messages
X-Actor-Id: <user-uuid>
X-Workspace-Id: <workspace-uuid>
```

```json
{
  "content": "Làm thế nào để tạo task mới?",
  "idempotencyKey": "msg-<uuid>"
}
```

**Response (202):**
```json
{
  "conversationId": "...",
  "userMessageId": "...",
  "assistantMessageId": "...",
  "turnId": "...",
  "streamUrl": "/api/v1/ai-assistant/messages/{assistantMessageId}/stream"
}
```

#### Bước A3 — Kết nối SSE Stream

```javascript
const source = new EventSource(
  `${BASE_URL}${streamUrl}`,
  { withCredentials: true }
);

source.addEventListener('TOKEN', (e) => {
  const { token } = JSON.parse(e.data);
  appendToUI(token);  // render từng token
});

source.addEventListener('COMPLETED', (e) => {
  source.close();
});

source.addEventListener('ERROR', (e) => {
  console.error(JSON.parse(e.data));
  source.close();
});
```

**Các SSE event:**

| Event | Data | Khi nào |
|---|---|---|
| `STATUS_CHANGED` | `{ "status": "GENERATING" }` | AI bắt đầu generate |
| `TOKEN` | `{ "token": "Hello", "sequenceInMessage": 3 }` | Mỗi token output |
| `TOOL_CALL` | `{ "toolName": "...", "input": {...} }` | AI gọi tool |
| `TOOL_RESULT` | `{ "toolName": "...", "result": {...} }` | Tool trả kết quả |
| `COMPLETED` | `{ "messageId": "uuid", "totalTokens": 123 }` | Xong |
| `ERROR` | `{ "errorCode": "...", "message": "..." }` | Lỗi |
| `comment: heartbeat` | — | Mỗi 15s để giữ kết nối |

---

### Option B: Direct Execution (Không cần lịch sử)

Dùng khi chỉ cần gọi AI một lần, không cần lưu conversation.

```http
POST /api/ai-agent/executions/event-config/{eventConfigId}
```

```json
{
  "requestId": "req-<uuid>",
  "inputVariables": {
    "userMessage": "Tóm tắt dự án này cho tôi",
    "context": "Project XYZ - Sprint 3 - In progress"
  }
}
```

**Response:**
```json
{
  "executionId": "uuid",
  "status": "SUCCEEDED",
  "output": "Dự án XYZ hiện đang ở Sprint 3...",
  "inputTokenCount": 120,
  "outputTokenCount": 80,
  "totalTokenCount": 200,
  "estimatedCost": "0.0025",
  "durationMs": 1450
}
```

> **Lưu ý:** Option B là synchronous — gọi xong nhận kết quả luôn. Option A là async với SSE streaming.

---

### Option C: Playground (Test/Dev)

Dùng để test prompt và config trước khi đưa vào production.

#### Chạy thử trực tiếp không qua Event Config

```http
POST /api/ai-agent/playground/direct/run
```

```json
{
  "agentId": "<agent-id>",
  "promptVersionId": "<prompt-version-id>",
  "modelDeploymentId": "<deployment-id>",
  "inputVariables": {
    "userMessage": "Hello world"
  }
}
```

#### Preview prompt đã render (không gọi AI)

```http
POST /api/ai-agent/playground/prompt/preview
```

```json
{
  "promptVersionId": "<prompt-version-id>",
  "inputVariables": {
    "userMessage": "Hello",
    "context": "test context"
  }
}
```

**Response:**
```json
{
  "renderedSystemPrompt": "You are Scopery Assistant...\n\nUser question: Hello\n\nContext: test context",
  "renderedUserPrompt": "...",
  "variables": ["userMessage", "context"],
  "missingVariables": []
}
```

> `missingVariables` không rỗng → prompt sẽ bị lỗi khi execution thực tế.

---

## Phần 4 — Checklist nhanh

### Admin setup checklist

- [ ] Tạo Provider → Activate
- [ ] Gắn Provider Secret (API Key)
- [ ] Tạo AI Model → Activate
- [ ] Tạo Model Deployment (đúng environment) → Activate → Set Default
- [ ] Tạo Agent → Activate
- [ ] Tạo Prompt Template → Activate
- [ ] Tạo Prompt Version → Activate
- [ ] Tạo Event Config (link Agent + PromptVersion + Deployment) → Activate
- [ ] (Optional) Tạo Usage Policy → Activate

### FE debug checklist khi chat không hoạt động

- [ ] Provider có status `ACTIVE` không?
- [ ] Provider Secret có `ACTIVE` không?
- [ ] Model có `ACTIVE` không?
- [ ] Model Deployment có `ACTIVE` và đúng `environment` không?
- [ ] Agent có `ACTIVE` không?
- [ ] Prompt Version có status `ACTIVE` (không phải `DRAFT` hay `ARCHIVED`) không?
- [ ] Event Config có `ACTIVE` và đúng `environment` không?
- [ ] `inputVariables` truyền vào có đủ các biến trong prompt không? (dùng `/playground/prompt/preview` để kiểm tra)

---

## Phần 5 — Resolve Event Config tự động

> FE không cần hard-code `eventConfigId`. Có thể resolve theo event key:

```http
GET /api/ai-agent/event-configs/resolve?sourceSystem=SCOPERY&eventKey=CHAT_GENERAL&environment=DEV
```

**Response:** trả về Event Config đang ACTIVE phù hợp → lấy `id` để dùng cho Execution.

---

## Phần 6 — Error Reference

| errorCode | HTTP | Nguyên nhân |
|---|---|---|
| `PROVIDER_NOT_FOUND` | 404 | Provider ID không tồn tại |
| `PROVIDER_NOT_ACTIVE` | 422 | Provider chưa được activate |
| `MODEL_NOT_FOUND` | 404 | Model ID không tồn tại |
| `MODEL_DEPLOYMENT_NOT_FOUND` | 404 | Deployment ID không tồn tại |
| `NO_DEFAULT_DEPLOYMENT_FOUND` | 404 | Không tìm thấy default deployment cho model+environment |
| `AGENT_NOT_FOUND` | 404 | Agent ID không tồn tại |
| `PROMPT_VERSION_NOT_ACTIVE` | 422 | Prompt Version không ở trạng thái ACTIVE |
| `EVENT_CONFIG_NOT_FOUND` | 404 | Event Config ID không tồn tại hoặc không có config active cho event+environment |
| `PROVIDER_SECRET_NOT_FOUND` | 404 | Không tìm thấy API key active cho provider |
| `USAGE_POLICY_EXCEEDED` | 422 | Vượt giới hạn rate limit / budget |
| `MISSING_REQUIRED_VARIABLE` | 400 | `inputVariables` thiếu biến cần thiết trong prompt |

---

## Phần 7 — Auth Headers

| Header | Mô tả |
|---|---|
| Cookie `access_token` | JWT — HttpOnly, set tự động qua `POST /api/iam/auth/login` |
| Header `X-XSRF-TOKEN` | CSRF token — lấy từ cookie `XSRF-TOKEN`, gửi với mọi POST/PATCH/PUT/DELETE |
| Header `X-Actor-Id` | UUID của user đang chat (bắt buộc với AI Assistant endpoints) |
| Header `X-Workspace-Id` | UUID của workspace hiện tại (bắt buộc với AI Assistant endpoints) |

> ⚠️ AI Agent admin endpoints (`/api/ai-agent/...`) yêu cầu JWT + XSRF. AI Assistant chat endpoints (`/api/v1/ai-assistant/...`) yêu cầu thêm `X-Actor-Id` và `X-Workspace-Id`.
