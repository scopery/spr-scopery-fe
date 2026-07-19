# SCOPERY WAVE 5
# AI Assistant Chat · AI Agent Configuration
## UI/UX API Page Mapping & Frontend Implementation Specification

> **Loại tài liệu:** Frontend implementation specification và API coverage control.  
> **Nguồn contract:** `WAVE5_API_CONTRACT.md`.  
> **Tổng endpoint contract:** **102**.  
> **User-facing/UI endpoints:** **97**.  
> **SSE stream endpoints:** **1**.  
> **Service-orchestrated endpoints:** **5**.  
> **Completion rule:** Wave 5 không hoàn thành cho đến khi toàn bộ 102 endpoint có mapping, integration class, page/component binding, permission, error state và test evidence.

---

# 0. Non-negotiable 100% API Coverage Gate

## 0.1 Ý nghĩa của “ráp toàn bộ API lên giao diện”

Mỗi endpoint trong contract phải thuộc đúng một trong các trạng thái cuối:

```text
UI_TESTED
UI_STREAM_TESTED
SERVICE_ORCHESTRATED_TESTED
APPROVED_NON_UI_EXCEPTION
CONTRACT_BLOCKED
```

Không được còn:

```text
UNMAPPED
TODO
MOCK_ONLY
TEMPORARY_STATIC_DATA
IMPLEMENTED_WITHOUT_TEST
UNKNOWN_OWNER
```

## 0.2 User-facing endpoint

Endpoint user-facing phải:

1. Có route/page/workbench hoặc embedded UI surface.
2. Có component/action cụ thể.
3. Có typed request/response.
4. Có permission check.
5. Có loading/empty/error/forbidden state.
6. Có cache invalidation nếu là mutation.
7. Có unit/component/E2E hoặc network evidence.
8. Chuyển trạng thái cuối thành `UI_TESTED` hoặc `UI_STREAM_TESTED`.

## 0.3 Internal/service endpoint

Các API điều khiển execution log lifecycle:

```text
POST  /api/ai-agent/execution-logs
PATCH /api/ai-agent/execution-logs/{id}/running
PATCH /api/ai-agent/execution-logs/{id}/succeeded
PATCH /api/ai-agent/execution-logs/{id}/failed
PATCH /api/ai-agent/execution-logs/{id}/cancel
```

không được gọi trực tiếp từ browser nếu contract/backend coi chúng là internal worker APIs.

Chúng vẫn phải:

- Có row trong coverage register.
- Có service integration.
- Có execution status hiển thị trên UI.
- Có integration test.
- Có audit evidence.
- Chuyển trạng thái thành `SERVICE_ORCHESTRATED_TESTED`.

Không được xóa khỏi register để làm đẹp tỷ lệ coverage.

## 0.4 Wave completion formula

```text
Wave5Done =
  contractEndpointCount == coverageRegisterEndpointCount
  AND unmappedEndpointCount == 0
  AND userFacingUntestedCount == 0
  AND streamUntestedCount == 0
  AND serviceOrchestratedUntestedCount == 0
  AND unapprovedExceptionCount == 0
  AND requiredContractBlockerCount == 0
  AND criticalSecurityTestPassed == true
  AND SSERecoveryTestPassed == true
```

---

# 1. Source of Truth và Contract Lock

Thứ tự ưu tiên:

```text
1. OpenAPI JSON đang chạy
2. WAVE5_API_CONTRACT.md
3. File Wave 5 này
4. Existing generated API client
5. Existing implementation
```

Trước khi code:

- Export OpenAPI snapshot.
- So sánh đủ 102 endpoints.
- Kiểm tra method/path/protocol/status/schema.
- Xác nhận route prefix:
  - AI Assistant: `/api/v1/ai-assistant`
  - AI Agent: `/api/ai-agent`
- Không tự đổi `/api/ai-agent` thành `/api/v1/ai-agent`.
- Không tự bỏ `X-Actor-Id` hoặc `X-Workspace-Id`.
- Xác nhận `EventSource` có gửi cookie trong môi trường hiện tại.
- Xác nhận cơ chế `Last-Event-ID` thực tế của browser/backend.
- Generate typed API client từ OpenAPI hoặc tạo adapter được test.

---

# 2. App Shell và Navigation

Scopery giữ app shell đã chốt:

```text
Existing left sidebar
+
Main content
+
Optional right drawer
```

## 2.1 Common navigation

Thêm hoặc giữ một mục:

```text
AI Assistant
```

Không tạo nhiều mục:

```text
AI Chat
AI Guide
Project AI
General AI
```

AI Assistant tự nhận context theo workspace/project.

## 2.2 Settings navigation

Qua Avatar → Settings:

```text
AI & Automation
├── Overview
├── Providers
├── Provider Secrets
├── Models
├── Model Deployments
├── Parameter Capabilities
├── Agents
├── Prompt Templates
├── Event Configurations
├── Usage Policies
├── Execution Monitor
├── Playground
└── Tools
```

Provider Secrets cần permission riêng và không hiển thị raw secret.

---

# 3. Route Map

## AI Assistant

```text
/w/:workspaceId/ai
/w/:workspaceId/ai/c/:conversationId
/w/:workspaceId/p/:projectId/ai
/w/:workspaceId/p/:projectId/ai/c/:conversationId
```

## Admin AI Control Center

```text
/settings/ai
/settings/ai/providers
/settings/ai/providers/:providerId
/settings/ai/provider-secrets
/settings/ai/provider-secrets/:secretId
/settings/ai/models
/settings/ai/models/:modelId
/settings/ai/deployments
/settings/ai/deployments/:deploymentId
/settings/ai/parameter-capabilities
/settings/ai/agents
/settings/ai/agents/:agentId
/settings/ai/prompts
/settings/ai/prompts/:templateId
/settings/ai/prompts/:templateId/versions/:versionId
/settings/ai/event-configs
/settings/ai/event-configs/:eventConfigId
/settings/ai/usage-policies
/settings/ai/usage-policies/:policyId
/settings/ai/executions
/settings/ai/executions/:executionLogId
/settings/ai/playground
/settings/ai/tools
/settings/ai/tools/:toolId
```

---

# 4. Page Inventory

| ID | Page / Workbench | Scope |
|---|---|---|
| `W5-AIA-01` | AI Assistant Home & Conversation List | Workspace / Project |
| `W5-AIA-02` | AI Conversation Workspace | Workspace / Project |
| `W5-AIA-03` | Contextual Guide Surfaces | Embedded across app |
| `W5-AIA-04` | AI Feedback Dialog | Embedded |
| `W5-ADM-01` | AI Control Center Overview | Settings |
| `W5-ADM-02` | Provider Registry | Settings |
| `W5-ADM-03` | Provider Secret Vault | Restricted Settings |
| `W5-ADM-04` | AI Model Catalog | Settings |
| `W5-ADM-05` | Model Deployment Manager | Settings |
| `W5-ADM-06` | Parameter Capability Matrix | Settings |
| `W5-ADM-07` | Agent Registry | Settings |
| `W5-ADM-08` | Prompt Template Library | Settings |
| `W5-ADM-09` | Prompt Version Studio | Settings |
| `W5-ADM-10` | Event Configuration Manager | Settings |
| `W5-ADM-11` | Usage Policy Manager | Settings |
| `W5-ADM-12` | Execution Monitor | Settings |
| `W5-ADM-13` | Execution Detail & Logs | Settings |
| `W5-ADM-14` | AI Playground | Restricted Settings |
| `W5-ADM-15` | Tool Registry | Settings |
| `W5-ADM-16` | Tool Detail, Permissions & Bindings | Settings |

---

# 5. Global API Client Requirements

## 5.1 Authentication

REST requests:

```text
credentials: include
JWT from HttpOnly access_token cookie
X-XSRF-TOKEN from XSRF-TOKEN cookie for unsafe methods
```

AI Assistant requests also include:

```text
X-Actor-Id
X-Workspace-Id
```

Rules:

- Actor ID lấy từ authenticated session, không cho user sửa.
- Workspace ID lấy từ active workspace context.
- Project ID chỉ truyền trong body/query khi contract yêu cầu.
- Workspace switch phải clear AI Assistant cache.
- Logout phải close mọi SSE connection.

## 5.2 API wrapper

Handle:

```json
{
  "success": true,
  "data": {},
  "timestamp": "..."
}
```

Error:

```json
{
  "success": false,
  "errorCode": "...",
  "message": "...",
  "traceId": "..."
}
```

Không dùng HTTP 200 làm dấu hiệu duy nhất; phải kiểm tra `success`.

## 5.3 Pagination

Mọi page list phải dùng:

```text
page
size
totalElements
totalPages
first
last
```

Không tải tất cả dữ liệu rồi phân trang ở frontend.

---

# 6. W5-AIA-01 — AI Assistant Home & Conversation List

## Layout

```text
┌──────────────────────┬──────────────────────────────────────────────┐
│ Conversations        │ Welcome / Empty conversation                 │
│                      │                                              │
│ + New chat           │ Suggested questions                          │
│ Search local list    │ Recent context                               │
│ Active               │ Start general guide                          │
│ Archived             │ Start project assistant                      │
│                      │                                              │
└──────────────────────┴──────────────────────────────────────────────┘
```

## Conversation row

```text
Title
Conversation type
Capability level
Project badge
Last message time
Status
More menu
```

## New conversation dialog

Fields:

```text
Conversation type
Capability level
Project
Assistant agent
Title
```

Rules:

- `PROJECT_ASSISTANT` yêu cầu project context theo backend validation.
- Agent dropdown chỉ hiển thị active/authorized agents.
- Conversation được tạo xong phải mở đúng route.
- Không tạo conversation rỗng lặp lại do double-click.
- Dùng mutation pending state và idempotent UI lock.

## Actions

```text
Open
Rename
Archive
Delete
```

Delete là soft-delete và cần confirmation.

Archive không đồng nghĩa delete.

---

# 7. W5-AIA-02 — AI Conversation Workspace

## Layout

```text
Conversation header
├── Title
├── Context badge
├── Agent/model info
├── Rename
├── Archive
└── More

Message timeline
├── User messages
├── Assistant messages
├── Tool request/result cards
├── Error/blocked states
└── Load older messages

Composer
├── Context indicator
├── Textarea
├── Model override if allowed
├── Send
└── Stop generating
```

## Message roles

Render riêng:

```text
USER
ASSISTANT
SYSTEM
TOOL_REQUEST
TOOL_RESULT
```

Không render TOOL_RESULT như assistant prose.

## Message statuses

```text
RECEIVED
QUEUED
CONTEXTUALIZING
RETRIEVING
GENERATING
STREAMING
CANCEL_REQUESTED
COMPLETED
FAILED
CANCELLED
BLOCKED
```

Mỗi status cần badge/animation/message phù hợp.

## Composer rules

- Max 8.000 characters.
- Disable send khi rỗng.
- `Enter` gửi, `Shift+Enter` xuống dòng theo preference.
- Generate idempotency key trên client cho mỗi send attempt.
- Retry cùng request dùng cùng key.
- User edit rồi gửi lại dùng key mới.
- Không cho gửi hai message song song trong cùng conversation nếu backend không hỗ trợ concurrent turns.

---

# 8. REST → SSE Streaming Flow

## 8.1 Start

```text
POST message
→ 202
→ receive assistantMessageId + streamUrl
→ render optimistic user message only after 202 is accepted
→ connect SSE
```

## 8.2 SSE events

```text
STATUS_CHANGED
TOKEN
TOOL_CALL
TOOL_RESULT
COMPLETED
ERROR
heartbeat comment
```

## 8.3 Required frontend state

```text
IDLE
STARTING
CONNECTING
CONNECTED
RECONNECTING
CANCELLING
COMPLETED
FAILED
CANCELLED
```

## 8.4 Token handling

- Append token in event sequence order.
- Deduplicate by SSE event ID.
- Keep last sequence number.
- Batch visual updates to avoid render per character.
- Persist final content by refetching message after `COMPLETED`.
- Do not trust streamed buffer as final source of truth.

## 8.5 Reconnect

On disconnect before terminal event:

1. Set `RECONNECTING`.
2. Preserve rendered tokens.
3. Reconnect with last event ID supported by transport.
4. Deduplicate replayed events.
5. Stop after configured retry policy.
6. Offer `Retry connection`.
7. Refetch message detail before declaring failure.

## 8.6 Cancel

```text
Click Stop
→ POST cancel
→ status CANCEL_REQUESTED
→ keep SSE open until CANCELLED/COMPLETED/ERROR or timeout
```

Không đóng UI stream ngay trước server acknowledgement.

## 8.7 Unmount

On route change/logout:

- Close active EventSource.
- Do not cancel generation automatically unless product rule explicitly says.
- Conversation list/detail refetch on return.

---

# 9. Tool Call UI trong Chat

## TOOL_CALL

```text
Calling tool: knowledge.search
Input summary
Status: Running
```

## TOOL_RESULT

```text
Tool: knowledge.search
Result summary
Duration
Open details
```

Rules:

- Mask sensitive input/output.
- Không render raw secret.
- JSON viewer phải collapse.
- Tool requiring human approval phải có governed approval flow; không giả lập approve nếu API chưa có.
- Write tool phải hiển thị mutation warning.

---

# 10. Message Actions và Feedback

Assistant message actions:

```text
Copy
Retry as new turn
Thumbs up
Thumbs down
Open details
Show token usage
Show error
```

Feedback dialog:

```text
Rating
Reason code
Optional comment
Submit
```

Rules:

- Feedback gắn đúng conversation/message.
- Không optimistic-submit nếu audit cần server response.
- Sau success, disable duplicate same rating hoặc cho update only khi contract hỗ trợ.
- Contract hiện chỉ có create; không giả định update/delete feedback.

---

# 11. W5-AIA-03 — Contextual Guide Surfaces

## Suggested questions

Nhúng vào các page qua:

```text
Page help button
Empty state
AI drawer
Disabled action tooltip
Field help icon
```

## Explain page

```text
Help → Explain this page
```

## Explain field

Field có icon:

```text
?
```

Click mở streamed explanation.

## Explain disabled action

Disabled control phải vẫn có accessible explanation trigger:

```text
Why is this disabled?
```

Không dùng disabled native button làm phần tử duy nhất vì không nhận focus/click.

## Guide drawer

```text
Title
Context page/field/action
Streaming answer
Suggested follow-up
Copy
Open in AI Assistant
Close
```

---

# 12. W5-ADM-01 — AI Control Center Overview

Overview không có endpoint riêng trong contract; tổng hợp từ list endpoints có pagination size nhỏ.

Cards:

```text
Providers
Active models
Default deployments by environment
Active agents
Active prompt versions
Active event configs
Usage policies
Recent executions
Failed executions
Tools
```

Rules:

- Không gọi hàng chục endpoint mỗi render nếu không cần.
- Lazy-load cards.
- Không N+1.
- Nếu aggregate endpoint chưa có, ghi performance gap.
- Overview không được dùng mock counts.

---

# 13. W5-ADM-02 — Provider Registry

## List

Columns:

```text
Name
Code
Type
Status
API base URL
Description
Updated
Actions
```

Filters:

```text
keyword
type
status
page
size
```

Actions:

```text
Create
Edit
Open
Activate
Deactivate
Manage secrets
View models
```

Rules:

- Code unique.
- Deactivate confirmation phải cảnh báo dependent models/deployments nếu backend trả dependency summary; nếu chưa có, ghi gap.
- Không optimistic activate/deactivate.
- URL validation.
- Status badge: ACTIVE, INACTIVE, DEPRECATED.

---

# 14. W5-ADM-03 — Provider Secret Vault

## Security

- Chỉ masked value.
- Raw secret chỉ tồn tại trong input memory trong lúc submit.
- Không log.
- Không lưu localStorage/sessionStorage.
- Không đưa vào query cache.
- Clear form immediately after response.
- Browser password manager control theo policy.
- Copy masked value không có ý nghĩa; không thêm nút reveal.

## List

```text
Provider
Secret type
Masked value
Status
Key version
Created
Actions
```

Actions:

```text
Save/update secret
Rotate
Deactivate
View masked detail
```

Rotate dialog:

```text
New secret
Reason/description
Confirmation
```

Không có chức năng lấy lại raw secret.

---

# 15. W5-ADM-04 — AI Model Catalog

Columns:

```text
Provider
Name
Code
Provider model ID
Type
Status
Description
Actions
```

Filters:

```text
providerId
keyword
status
type
page
size
```

Actions:

```text
Create
Edit
Activate
Deactivate
Open deployments
Open capabilities
```

Model type controls downstream form behavior:

```text
CHAT
EMBEDDING
IMAGE
OCR
RERANKING
INTERNAL
```

Không cho chọn capability không phù hợp type nếu backend rejects.

---

# 16. W5-ADM-05 — Model Deployment Manager

Columns:

```text
Deployment
Model
Environment
Provider deployment ID
Endpoint
Default
Temperature
Max output tokens
Status
Actions
```

Filters:

```text
modelId
environment
keyword
status
isDefault
page
size
```

Actions:

```text
Create
Edit
Activate
Deactivate
Set default
```

Set default:

- Confirmation.
- Invalidate all deployments for same model+environment.
- UI must show exactly one default if backend invariant says so.
- Do not locally toggle only selected row.

---

# 17. W5-ADM-06 — Parameter Capability Matrix

## Matrix

Rows:

```text
parameterName
apiParameterKey
supportStatus
valueType
min
max
default
nullable
ifNullBehavior
status
```

Group by model.

Actions:

```text
Add
Edit
Activate
Deactivate
```

Validation:

- `min <= default <= max` for numeric values.
- `NO` support should not show editable runtime value.
- `CONDITIONAL` requires description/condition explanation.
- `DO_NOT_SEND_PARAMETER` and `USE_PROVIDER_DEFAULT` surfaced clearly.
- Playground form must consume this capability schema.

---

# 18. W5-ADM-07 — Agent Registry

Columns:

```text
Name
Code
Type
Status
Default deployment
Output format
Autonomy
Scope
Organization/workspace
Actions
```

Agent editor sections:

```text
Identity
Behavior
Default model deployment
Output format
Autonomy
Scope
Tools
Prompt templates
Usage policy summary
```

Rules:

- Scope field controls organization/workspace fields.
- `GLOBAL` cannot retain stale workspace ID.
- Active agent should have valid active deployment when required.
- Do not allow selecting inactive deployment unless backend supports draft reference.
- Tool bindings managed in Tool Detail or linked section.

---

# 19. W5-ADM-08 — Prompt Template Library

Columns:

```text
Agent
Name
Code
Status
Description
Active version
Draft versions
Updated
Actions
```

Actions:

```text
Create template
Edit metadata
Activate
Deactivate
Open versions
Create version
```

Template is identity/container; content lives in Prompt Version.

Do not add prompt content field to template form.

---

# 20. W5-ADM-09 — Prompt Version Studio

## Layout

```text
Template context
Version metadata
Prompt editor
Variable schema editor
Change note
Preview
Lifecycle actions
Version history
```

## Lifecycle

```text
DRAFT
→ ACTIVE
→ ARCHIVED
```

Rules:

- Only DRAFT editable.
- Activate archives previous ACTIVE version.
- After activate, refetch all versions for template.
- Archived version read-only.
- Prompt editor supports TEXT, MARKDOWN, JSON.
- JSON content must validate before submit.
- Variable schema is JSON string per contract; provide schema-aware editor.
- Preview rendered prompt through Playground preview endpoint.

---

# 21. W5-ADM-10 — Event Configuration Manager

Columns:

```text
Code
Name
Event definition
Environment
Trigger type
Agent
Prompt version
Deployment
Status
Actions
```

Filters:

```text
keyword
eventDefinitionId
environment
triggerType
status
agentId
page
size
```

Actions:

```text
Create
Edit
Activate
Deactivate
Resolve
Run in playground
View executions
```

## Resolve tester

Inputs:

```text
eventDefinitionId
OR sourceSystem + eventKey
environment
```

Must enforce one valid identification mode.

Condition expression:

- Treat as code.
- Syntax highlighting optional.
- Never evaluate in browser.
- Warn that it is server-side SpEL.
- Show security notice.

---

# 22. W5-ADM-11 — Usage Policy Manager

Columns:

```text
Code
Name
Target
Period
Requests
Tokens
Cost
Concurrency
Daily budget
Action
Priority
Status
Actions
```

Target:

```text
GLOBAL
EVENT_CONFIG
AGENT
MODEL_DEPLOYMENT
```

Rules:

- `GLOBAL` targetId should be null.
- Other target types require targetId.
- At least one limit should be configured.
- Cost/budget uses decimal-safe input.
- Priority integer.
- Action:
  - REJECT.
  - THROTTLE.
  - WARN.
- No frontend-only enforcement; backend is authoritative.

---

# 23. W5-ADM-12 — Execution Monitor

## Filters

```text
requestId
eventConfig
eventDefinition
agent
promptVersion
deployment
triggerSource
status
createdFrom
createdTo
page
size
```

## Columns

```text
Request ID
Trigger
Event config
Agent
Prompt version
Deployment
Status
Input tokens
Output tokens
Total tokens
Estimated cost
Duration
Created
Actions
```

## Status

```text
PENDING
RUNNING
SUCCEEDED
FAILED
CANCELLED
```

## Actions

```text
Open detail
Copy request ID
Open related config
Retry through execution API if permitted
Cancel only through user-facing execution cancel API when available
```

Contract execution-log cancel is classified service-orchestrated. Browser must not call it unless OpenAPI explicitly marks it admin/user-facing.

---

# 24. W5-ADM-13 — Execution Detail

Sections:

```text
Summary
Input variables
Rendered prompt metadata
Output
Error
Token usage
Cost
Duration
Related configuration
Lifecycle timeline
Tool calls
Audit
```

Sensitive data:

- Mask secrets.
- Classification-aware output.
- JSON viewers collapsed.
- Copy/download controlled by permission.
- Trace ID visible.

The page consumes GET detail and displays statuses produced by internal log lifecycle APIs.

---

# 25. W5-ADM-14 — AI Playground

## Modes

```text
Run Event Config
Direct Run
Prompt Preview
```

## Options

Load from `/playground/options`.

Do not separately fetch each dropdown unless needed.

## Event config run

Fields:

```text
Event config
Request ID
Input variables
Run
```

## Direct run

```text
Agent
Prompt version
Model deployment
Request ID
Input variables
Run
```

## Prompt preview

```text
Prompt version
Input variables
Rendered system prompt
Rendered user prompt
Variables
Missing variables
```

## Result

```text
Status
Output
Error
Input/output/total tokens
Estimated cost
Duration
Execution ID
Request ID
```

Feature gate:

```text
AIAGENT_PLAYGROUND_ENABLED
```

When disabled:

- Show unavailable state.
- Do not hide permission errors as feature-disabled.
- Do not call run endpoints.

---

# 26. W5-ADM-15 — Tool Registry

Columns:

```text
Code
Name
Category
Mutation type
Human approval
Status
Permission count
Agent binding count
Actions
```

Filters:

```text
category
status
q
page
size
```

Actions:

```text
Create
Edit
Activate
Deactivate
Open
Debug execute
```

Mutation types:

```text
READ_ONLY
WRITE
READ_WRITE
```

Write/read-write tools need stronger visual warning.

---

# 27. W5-ADM-16 — Tool Detail, Permissions & Bindings

Tabs:

```text
Overview
Permissions
Agent Bindings
Debug Execute
Audit
```

## Permissions

Actions:

```text
Add permission
Remove permission
```

Do not allow free-form invalid permission code if permission catalog search exists. Contract only shows string input; mark catalog picker as integration dependency.

## Bindings

```text
Bind agent
List bound agents
Unbind
```

Rules:

- Only active compatible agents in picker.
- Prevent duplicate binding.
- Unbind confirmation.
- Refetch tool detail/bindings after mutation.

## Execute

Contract says stub/no-op + log.

UI must label:

```text
Debug execution
```

Not production business execution.

Require confirmation for WRITE/READ_WRITE tools even if current endpoint is stub.

---

# 28. Status and Lifecycle UI

## Shared statuses

```text
ACTIVE
INACTIVE
DEPRECATED
```

Actions must be state-aware:

- Activate hidden/disabled when ACTIVE.
- Deactivate hidden/disabled when INACTIVE.
- Deprecated usually read-only unless backend supports transition.

## Prompt Version

```text
DRAFT
ACTIVE
ARCHIVED
```

## Conversation

```text
ACTIVE
ARCHIVED
DELETED
```

## Message

Full status enum must be mapped to UI.

## Execution

```text
PENDING
RUNNING
SUCCEEDED
FAILED
CANCELLED
```

No unknown status may silently render as success.

---

# 29. Permission Model

Minimum permission actions:

```text
AI_ASSISTANT_USE
AI_ASSISTANT_FEEDBACK_CREATE
AI_AGENT_CONFIG_VIEW
AI_AGENT_CONFIG_MANAGE
AI_PROVIDER_SECRET_VIEW
AI_PROVIDER_SECRET_MANAGE
AI_EXECUTION_RUN
AI_EXECUTION_LOG_VIEW
AI_PLAYGROUND_USE
AI_TOOL_VIEW
AI_TOOL_MANAGE
```

Rules:

- Provider Secret permissions are separate.
- Playground separate from config view.
- Tool execution separate from tool edit if IAM supports it.
- UI permission hides/disables actions, backend remains authoritative.
- 403 state must not masquerade as empty list.
- Workspace/project context validated per request.

---

# 30. Query Key Architecture

```text
aiAssistant.conversations(workspaceId, actorId, page, size)
aiAssistant.conversation(workspaceId, conversationId)
aiAssistant.messages(conversationId, page, size)
aiAssistant.message(messageId)
aiAssistant.guides(pageCode, entityType, locale)

aiAgent.providers(filters)
aiAgent.provider(id)
aiAgent.providerSecrets(filters)
aiAgent.providerSecret(id)
aiAgent.models(filters)
aiAgent.model(id)
aiAgent.deployments(filters)
aiAgent.deployment(id)
aiAgent.parameterCapabilities(filters)
aiAgent.parameterCapability(id)
aiAgent.agents(filters)
aiAgent.agent(id)
aiAgent.promptTemplates(filters)
aiAgent.promptTemplate(id)
aiAgent.promptVersions(filters)
aiAgent.promptVersion(id)
aiAgent.eventConfigs(filters)
aiAgent.eventConfig(id)
aiAgent.eventConfigResolve(params)
aiAgent.usagePolicies(filters)
aiAgent.usagePolicy(id)
aiAgent.executionLogs(filters)
aiAgent.executionLog(id)
aiAgent.playgroundOptions(flags)
aiAgent.tools(filters)
aiAgent.tool(id)
aiAgent.toolBindings(id)
```

Secret query data must not persist to disk.

---

# 31. Mutation Invalidation

## Conversations

```text
Create
→ conversation list

Rename
→ list + detail

Archive/delete
→ list + active route fallback
```

## Message

```text
Send
→ messages + conversation summary

Complete/cancel/error
→ message detail + history + conversation list
```

## Provider/model/deployment/config mutations

Invalidate:

```text
entity list
entity detail
dependent dropdown options
overview cards
playground options where relevant
```

## Prompt version activate

Invalidate:

```text
prompt versions
template detail
event config options
playground options
agent summary
```

## Tool binding/permission

Invalidate:

```text
tool detail
bindings
permission list
agent tool summary
```

Do not use blanket global refetch for every mutation.

---

# 32. Optimistic UI Rules

Allowed:

```text
Local composer text
Local filter/search controls
Local prompt editor draft
Local JSON input
Temporary streamed token buffer
Drawer/tab state
```

Not allowed:

```text
Activate/deactivate
Set default deployment
Rotate/deactivate secret
Prompt activate/archive
Event config activation
Usage policy activation
Agent/tool binding
Execution result
Feedback success
Conversation archive/delete
```

Conversation rename may use optimistic UI only with rollback and contract-tested uniqueness/length behavior.

---

# 33. Error Handling

Every error surface shows:

```text
User-readable message
errorCode
traceId
Retry when safe
Open details for support/admin
```

Special mappings:

| Condition | UI |
|---|---|
| SSE connection lost | Reconnecting state |
| SSE replay expired | Refetch final message and offer retry |
| Message BLOCKED | Policy block card |
| Cancel timeout | Still processing warning + refetch |
| Secret invalid | Clear raw input only after user acknowledges policy |
| Provider/model dependency conflict | Dependency dialog |
| Prompt draft edit denied | Read-only lifecycle banner |
| Playground disabled | Feature unavailable state |
| Usage policy reject | Budget/rate-limit error card |
| Tool permission denied | Permission explanation |
| CSRF failure | Refresh token/session guidance |
| 403 | Forbidden, not empty |
| 404 | Not found/deleted |
| 409 | Conflict dialog |
| 422 | Field-level validation |
| 429 | Rate limit with retry timing |
| 5xx | Trace-aware failure state |

---

# 34. Empty and Loading States

Required for every list:

```text
Initial loading skeleton
Empty first-use state
Empty filtered state
Forbidden state
Failed state
Pagination loading
Background refresh
```

Examples:

- No provider: Create first provider.
- No model: Create model after provider.
- No deployment: Configure runtime.
- No prompt version: Create draft version.
- No execution: Run through Playground or event.
- No conversation: Start a new chat.

---

# 35. Accessibility

Required:

- Chat timeline uses proper live-region behavior without reading every token character.
- Streaming update announcements are throttled.
- Stop generating keyboard accessible.
- Conversation sidebar keyboard navigation.
- Dialog focus trap.
- Tables have semantic headers.
- Status not color-only.
- Secret fields have clear labels and warnings.
- JSON editors have accessible fallback textarea.
- Disabled action explanation focusable.
- SSE reconnect state announced.
- Reduced motion for streaming/loading animation.

---

# 36. Responsive

## Desktop

- Conversation list + chat split layout.
- Admin list + drawer/detail.
- Playground two-column input/result.
- Execution detail panels.

## Tablet

- Conversation list as drawer.
- Admin forms full-width drawer.
- Playground stacked.

## Mobile

- AI chat full-screen.
- Conversation list route/sheet.
- Composer safe-area aware.
- Tool calls collapsed.
- Admin pages read-first; complex configuration may use full-screen form.
- Wide tables switch to cards or horizontal scroll.

---

# 37. Frontend Package Structure

```text
features/ai-assistant/
├── api/
├── sse/
├── pages/
├── components/
├── hooks/
├── queryKeys/
├── permissions/
├── state/
├── routes/
└── tests/

features/ai-agent-admin/
├── providers/
├── secrets/
├── models/
├── deployments/
├── capabilities/
├── agents/
├── prompts/
├── event-configs/
├── usage-policies/
├── executions/
├── playground/
├── tools/
├── shared/
└── tests/
```

SSE state should not be mixed into generic REST query cache.

---

# 38. Test Strategy

## Unit

```text
API wrapper parsing
CSRF header injection
AI Assistant header injection
SSE event parser
Sequence deduplication
Token buffer reducer
Reconnect state machine
Message status mapping
Prompt JSON validation
Usage policy validation
Capability min/default/max validation
Secret form cleanup
Permission guards
Query key factories
```

## Component

```text
Conversation create/rename/archive/delete
Composer max length
Stream token rendering
Tool call/result card
Cancel generating
Feedback dialog
Provider CRUD
Secret rotate/deactivate
Set default deployment
Prompt lifecycle
Event config resolve
Usage policy target behavior
Playground modes
Tool permission/binding
```

## Mandatory E2E

```text
E2E-W5-001 Create and open conversation
E2E-W5-002 Rename conversation
E2E-W5-003 Archive conversation
E2E-W5-004 Soft-delete conversation
E2E-W5-005 Send message and complete SSE stream
E2E-W5-006 SSE reconnect without duplicate tokens
E2E-W5-007 Cancel message generation
E2E-W5-008 Tool call/result render
E2E-W5-009 Message failure and blocked states
E2E-W5-010 Message feedback
E2E-W5-011 Suggested questions
E2E-W5-012 Explain page/field/disabled action streams
E2E-W5-013 Provider CRUD/lifecycle
E2E-W5-014 Provider secret save/rotate/deactivate without raw leak
E2E-W5-015 Model CRUD/lifecycle
E2E-W5-016 Deployment CRUD/default/lifecycle
E2E-W5-017 Parameter capability CRUD/lifecycle
E2E-W5-018 Agent CRUD/lifecycle
E2E-W5-019 Prompt template CRUD/lifecycle
E2E-W5-020 Prompt version draft/edit/activate/archive
E2E-W5-021 Event config CRUD/resolve/lifecycle
E2E-W5-022 Usage policy CRUD/lifecycle
E2E-W5-023 Manual execution
E2E-W5-024 Execution log filters/detail
E2E-W5-025 Service lifecycle endpoints update visible log state
E2E-W5-026 Playground options
E2E-W5-027 Playground event-config run
E2E-W5-028 Playground direct run
E2E-W5-029 Prompt preview/missing variables
E2E-W5-030 Tool CRUD/lifecycle
E2E-W5-031 Tool permission add/remove
E2E-W5-032 Tool agent bind/list/unbind
E2E-W5-033 Tool debug execute
E2E-W5-034 Every contract endpoint has evidence
E2E-W5-035 No raw provider secret appears in cache/log/UI
E2E-W5-036 Browser never calls service-only log transitions
```

Additionally, each endpoint has a unique API evidence ID in the register.

---

# 39. Implementation Order

## W5-P0 — Contract and client

```text
OpenAPI snapshot
Endpoint reconciliation
Typed client
Headers/cookies/CSRF
Permission codes
Coverage register
SSE spike
```

## W5-P1 — Assistant core

```text
Conversation list/create/detail
Rename/archive/delete
Message history
Composer
REST → SSE
Reconnect
Cancel
Status rendering
Feedback
```

## W5-P2 — Contextual guide

```text
Suggested questions
Explain page
Explain field
Explain disabled action
Guide drawer
```

## W5-P3 — Provider runtime setup

```text
Providers
Secrets
Models
Deployments
Parameter capabilities
```

## W5-P4 — Agent and prompt setup

```text
Agents
Prompt templates
Prompt versions
Lifecycle
Preview integration
```

## W5-P5 — Automation controls

```text
Event configurations
Resolve tester
Usage policies
Executions
Execution monitor/detail
```

## W5-P6 — Playground and tools

```text
Playground
Tools
Permissions
Bindings
Debug execute
```

## W5-P7 — Hardening

```text
Security
SSE recovery
Accessibility
Responsive
Performance
E2E
100% coverage reconciliation
Completion evidence
```

---

# 40. Contract Gaps and Clarifications

| ID | Severity | Gap | Required action |
|---|---|---|---|
| `W5-GAP-01` | Critical | Browser `EventSource` cannot set arbitrary `Last-Event-ID` header directly in all implementations | Verify native reconnect behavior or use fetch-based SSE client |
| `W5-GAP-02` | Critical | SSE CSRF/auth behavior must be verified with cookie and CORS settings | Integration spike before chat UI completion |
| `W5-GAP-03` | High | Conversation list contract has no archive/status filter | Clarify archived conversation retrieval UX |
| `W5-GAP-04` | High | No retry/regenerate message endpoint | Do not invent retry; create new user turn |
| `W5-GAP-05` | High | No feedback update/delete endpoint | Treat feedback as create-once |
| `W5-GAP-06` | High | Execution-log mutation APIs are described as internal | Keep service-orchestrated unless explicitly approved for admin browser |
| `W5-GAP-07` | High | No user-facing execution cancel endpoint separate from internal log cancel | Do not expose cancel unless contract changes |
| `W5-GAP-08` | High | Provider/model dependency impact APIs absent | Confirm deactivate behavior and error contract |
| `W5-GAP-09` | Medium | Overview aggregate endpoint absent | Lazy aggregate or add backend summary endpoint |
| `W5-GAP-10` | Medium | Permission catalog endpoint for tool binding absent | Integrate IAM catalog or controlled code input |
| `W5-GAP-11` | Medium | Playground result persistence/history not explicit | Use execution logs as history when linked |
| `W5-GAP-12` | Medium | Agent filters do not include scope/workspace | Confirm admin filtering needs |
| `W5-GAP-13` | Medium | Tool execute is stub/no-op | Label debug-only; do not present as production execution |
| `W5-GAP-14` | Medium | Exact permissions are not defined in contract | Lock IAM action catalog before completion |

---

# 41. Definition of Done

Wave 5 only completes when:

```text
contractEndpointCount = 102
coverageRegisterEndpointCount = 102
unmappedEndpointCount = 0
userFacingUntestedCount = 0
streamUntestedCount = 0
serviceOrchestratedUntestedCount = 0
unapprovedExceptionCount = 0
requiredBlockerCount = 0
```

Mandatory evidence file:

```text
docs/phase-complete/WAVE_5_AI_ASSISTANT_AGENT_UI_COMPLETE.md
```

It must include:

```text
OpenAPI snapshot hash
Contract endpoint count
Coverage register endpoint count
Pages/routes
Components
Hooks/API clients
Permissions
Query keys
Invalidations
SSE test evidence
Security evidence
Unit tests
Component tests
E2E tests
Network evidence
Service-orchestrated evidence
Approved exceptions
Contract gaps closed/deferred
Final status for every endpoint
```

Do not mark complete if:

- Any endpoint is absent from register.
- Any user-facing endpoint is not connected to real API.
- Any SSE endpoint lacks reconnect/cancel/error test.
- Any provider secret raw value appears in logs/cache/UI.
- Any internal lifecycle API is called from browser without approval.
- Any mutation lacks invalidation.
- Any list uses static/mock data.
- Any 403 is rendered as empty.
- Any prompt ACTIVE version remains editable.
- Any set-default action updates only local UI.
- Any tool binding/permission lacks refresh and error state.
- Any contract blocker required for main flow remains open.

---

# 42. API Coverage Register

The following register is the authoritative Wave 5 implementation checklist.

## 42.1 Endpoint count by contract module

| Module | Count |
|---|---:|
| A. AI Assistant — Conversations | 6 |
| B. AI Assistant — Messages | 5 |
| C. AI Assistant — Guide | 4 |
| D. AI Assistant — Feedback | 1 |
| E. AI Agent — Providers | 6 |
| F. AI Agent — Provider Secrets | 5 |
| G. AI Agent — AI Models | 6 |
| H. AI Agent — Model Deployments | 7 |
| I. AI Agent — Model Parameter Capabilities | 6 |
| J. AI Agent — Agents | 6 |
| K. AI Agent — Prompt Templates | 6 |
| L. AI Agent — Prompt Versions | 6 |
| M. AI Agent — Event Configurations | 7 |
| N. AI Agent — Usage Policies | 6 |
| O. AI Agent — Executions | 2 |
| P. AI Agent — Execution Logs | 7 |
| Q. AI Agent — Playground | 4 |
| R. AI Agent — Tools | 12 |


## 42.2 Integration class summary

```text
Total endpoints: 102
User-facing/UI or admin/debug endpoints: 97
SSE stream endpoints: 1
Service-orchestrated endpoints: 5
```

## 42.3 Full register

| No | Module | Area | Method | Path | Protocol | HTTP | Purpose | Page | UIBinding | IntegrationClass | HookOrClient | Permission | Invalidation | RequiredBeforeDone | TestEvidence | InitialStatus | GapOrException |
|---:|---|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|
| 1 | AI Assistant | Conversations | `POST` | `/api/v1/ai-assistant/conversations` | `REST` | 201 | Tạo conversation mới | W5-AIA-01 / W5-AIA-02 | NewConversationDialog | `UI_ACTION` | `useTOConversationMIMutation` | `AI_ASSISTANT_USE` | conversations list/detail | YES | `E2E-W5-API-001` | `MAPPED` | — |
| 2 | AI Assistant | Conversations | `GET` | `/api/v1/ai-assistant/conversations` | `REST` | 200 | Danh sách conversations của actor (paginated) | W5-AIA-01 / W5-AIA-02 | ConversationList | `UI_READ` | `useDanhSChConversationsCAQuery` | `AI_ASSISTANT_USE` | None | YES | `E2E-W5-API-002` | `MAPPED` | — |
| 3 | AI Assistant | Conversations | `GET` | `/api/v1/ai-assistant/conversations/{id}` | `REST` | 200 | Lấy chi tiết conversation | W5-AIA-01 / W5-AIA-02 | ConversationWorkspaceLoader | `UI_READ` | `useLYChiTiTConversationQuery` | `AI_ASSISTANT_USE` | None | YES | `E2E-W5-API-003` | `MAPPED` | — |
| 4 | AI Assistant | Conversations | `PATCH` | `/api/v1/ai-assistant/conversations/{id}/title` | `REST` | 200 | Đổi tên conversation | W5-AIA-01 / W5-AIA-02 | RenameConversationDialog | `UI_ACTION` | `useITNConversationMutation` | `AI_ASSISTANT_USE` | conversations list/detail | YES | `E2E-W5-API-004` | `MAPPED` | — |
| 5 | AI Assistant | Conversations | `DELETE` | `/api/v1/ai-assistant/conversations/{id}` | `REST` | 204 | Soft-delete conversation | W5-AIA-01 / W5-AIA-02 | DeleteConversationDialog | `UI_ACTION` | `useSoftDeleteConversationMutation` | `AI_ASSISTANT_USE` | conversations list/detail | YES | `E2E-W5-API-005` | `MAPPED` | — |
| 6 | AI Assistant | Conversations | `POST` | `/api/v1/ai-assistant/conversations/{id}/archive` | `REST` | 200 | Archive conversation | W5-AIA-01 / W5-AIA-02 | ArchiveConversationAction | `UI_ACTION` | `useArchiveConversationMutation` | `AI_ASSISTANT_USE` | conversations list/detail | YES | `E2E-W5-API-006` | `MAPPED` | — |
| 7 | AI Assistant | Messages & Streaming | `POST` | `/api/v1/ai-assistant/conversations/{conversationId}/messages` | `REST → SSE` | 202 | Gửi message, nhận `streamUrl` | W5-AIA-02 | ChatComposer / SendMessageController | `UI_ACTION` | `useGIMessageNhNStreamUrlMutation` | `AI_ASSISTANT_USE` | conversation messages, conversation summary | YES | `E2E-W5-API-007` | `MAPPED` | — |
| 8 | AI Assistant | Messages & Streaming | `GET` | `/api/v1/ai-assistant/messages/{messageId}/stream` | `SSE` | 200 | Stream token-by-token qua SSE | W5-AIA-02 | AiStreamController / StreamingAssistantMessage | `UI_STREAM` | `useAiMessageSseStream` | `AI_ASSISTANT_USE` | None | YES | `E2E-W5-API-008` | `MAPPED` | — |
| 9 | AI Assistant | Messages & Streaming | `GET` | `/api/v1/ai-assistant/conversations/{conversationId}/messages` | `REST` | 200 | Lịch sử messages (paginated) | W5-AIA-02 | ChatHistoryVirtualList | `UI_READ` | `useLChSMessagesPaginatedQuery` | `AI_ASSISTANT_USE` | None | YES | `E2E-W5-API-009` | `MAPPED` | — |
| 10 | AI Assistant | Messages & Streaming | `GET` | `/api/v1/ai-assistant/messages/{messageId}` | `REST` | 200 | Lấy chi tiết một message | W5-AIA-02 | MessageDetailInspector | `UI_READ` | `useLYChiTiTMQuery` | `AI_ASSISTANT_USE` | None | YES | `E2E-W5-API-010` | `MAPPED` | — |
| 11 | AI Assistant | Messages & Streaming | `POST` | `/api/v1/ai-assistant/messages/{messageId}/cancel` | `REST` | 200 | Yêu cầu cancel stream đang chạy | W5-AIA-02 | StopGeneratingButton | `UI_ACTION` | `useYUCUCancelStreamMutation` | `AI_ASSISTANT_USE` | conversation messages, conversation summary | YES | `E2E-W5-API-011` | `MAPPED` | — |
| 12 | AI Assistant | Contextual Guide | `GET` | `/api/v1/ai-assistant/guides/suggested-questions` | `REST` | 200 | Lấy danh sách suggested questions cho một page | W5-AIA-03 | SuggestedQuestionChips | `UI_READ` | `useLYDanhSChSuggestedQuery` | `AI_ASSISTANT_USE` | None | YES | `E2E-W5-API-012` | `MAPPED` | — |
| 13 | AI Assistant | Contextual Guide | `POST` | `/api/v1/ai-assistant/guides/explain-page` | `REST → SSE` | 202 | Giải thích page cho user → stream qua SSE | W5-AIA-03 | ExplainPageAction | `UI_ACTION` | `useGiIThChPageChoMutation` | `AI_ASSISTANT_USE` | guide stream state | YES | `E2E-W5-API-013` | `MAPPED` | — |
| 14 | AI Assistant | Contextual Guide | `POST` | `/api/v1/ai-assistant/guides/explain-field` | `REST → SSE` | 202 | Giải thích một field trong form → stream qua SSE | W5-AIA-03 | FieldHelpButton / ExplainFieldPopover | `UI_ACTION` | `useGiIThChMTMutation` | `AI_ASSISTANT_USE` | guide stream state | YES | `E2E-W5-API-014` | `MAPPED` | — |
| 15 | AI Assistant | Contextual Guide | `POST` | `/api/v1/ai-assistant/guides/explain-disabled-action` | `REST → SSE` | 202 | Giải thích tại sao một action bị disabled → stream qua SSE | W5-AIA-03 | DisabledActionExplanation | `UI_ACTION` | `useGiIThChTIMutation` | `AI_ASSISTANT_USE` | guide stream state | YES | `E2E-W5-API-015` | `MAPPED` | — |
| 16 | AI Assistant | Feedback | `POST` | `/api/v1/ai-assistant/feedbacks` | `REST` | 201 | Gửi feedback cho một message | W5-AIA-02 / W5-AIA-04 | MessageFeedbackActions / FeedbackDialog | `UI_ACTION` | `useGIFeedbackChoMTMutation` | `AI_ASSISTANT_FEEDBACK_CREATE` | message feedback state | YES | `E2E-W5-API-016` | `MAPPED` | — |
| 17 | AI Agent Admin | Providers | `POST` | `/api/ai-agent/providers` | `REST` | 201 | Tạo AI provider mới | W5-ADM-02 | ProviderListPage / ProviderDetailDrawer | `UI_ACTION` | `useTOAIProviderMIMutation` | `AI_AGENT_CONFIG_MANAGE` | providers list/detail, dependent options | YES | `E2E-W5-API-017` | `MAPPED` | — |
| 18 | AI Agent Admin | Providers | `PUT` | `/api/ai-agent/providers/{id}` | `REST` | 200 | Cập nhật provider | W5-ADM-02 | ProviderListPage / ProviderDetailDrawer | `UI_ACTION` | `useCPNhTProviderMutation` | `AI_AGENT_CONFIG_MANAGE` | providers list/detail, dependent options | YES | `E2E-W5-API-018` | `MAPPED` | — |
| 19 | AI Agent Admin | Providers | `GET` | `/api/ai-agent/providers/{id}` | `REST` | 200 | Lấy chi tiết provider | W5-ADM-02 | ProviderListPage / ProviderDetailDrawer | `UI_READ` | `useLYChiTiTProviderQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-019` | `MAPPED` | — |
| 20 | AI Agent Admin | Providers | `GET` | `/api/ai-agent/providers` | `REST` | 200 | Tìm kiếm / danh sách providers (paginated) | W5-ADM-02 | ProviderListPage / ProviderDetailDrawer | `UI_READ` | `useTMKiMDanhSQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-020` | `MAPPED` | — |
| 21 | AI Agent Admin | Providers | `PATCH` | `/api/ai-agent/providers/{id}/activate` | `REST` | 200 | Activate provider | W5-ADM-02 | ProviderListPage / ProviderDetailDrawer | `UI_ACTION` | `useActivateProviderMutation` | `AI_AGENT_CONFIG_MANAGE` | providers list/detail, dependent options | YES | `E2E-W5-API-021` | `MAPPED` | — |
| 22 | AI Agent Admin | Providers | `PATCH` | `/api/ai-agent/providers/{id}/deactivate` | `REST` | 200 | Deactivate provider | W5-ADM-02 | ProviderListPage / ProviderDetailDrawer | `UI_ACTION` | `useDeactivateProviderMutation` | `AI_AGENT_CONFIG_MANAGE` | providers list/detail, dependent options | YES | `E2E-W5-API-022` | `MAPPED` | — |
| 23 | AI Agent Admin | Provider Secrets | `POST` | `/api/ai-agent/provider-secrets` | `REST` | 200 | Lưu / cập nhật API key (deactivate key cũ tự động) | W5-ADM-03 | SaveProviderSecretDialog | `UI_ACTION` | `useLUCPNhTMutation` | `AI_PROVIDER_SECRET_MANAGE` | provider secrets list/detail | YES | `E2E-W5-API-023` | `MAPPED` | — |
| 24 | AI Agent Admin | Provider Secrets | `PUT` | `/api/ai-agent/provider-secrets/{id}/rotate` | `REST` | 200 | Rotate secret (tạo record mới, deactivate cũ) | W5-ADM-03 | RotateProviderSecretDialog | `UI_ACTION` | `useRotateSecretTORecordMMutation` | `AI_PROVIDER_SECRET_MANAGE` | provider secrets list/detail | YES | `E2E-W5-API-024` | `MAPPED` | — |
| 25 | AI Agent Admin | Provider Secrets | `PATCH` | `/api/ai-agent/provider-secrets/{id}/deactivate` | `REST` | 200 | Deactivate secret | W5-ADM-03 | DeactivateSecretDialog | `UI_ACTION` | `useDeactivateSecretMutation` | `AI_PROVIDER_SECRET_MANAGE` | provider secrets list/detail | YES | `E2E-W5-API-025` | `MAPPED` | — |
| 26 | AI Agent Admin | Provider Secrets | `GET` | `/api/ai-agent/provider-secrets/{id}` | `REST` | 200 | Lấy chi tiết (chỉ masked value) | W5-ADM-03 | ProviderSecretDetailDrawer | `UI_READ` | `useLYChiTiTChQuery` | `AI_PROVIDER_SECRET_VIEW` | None | YES | `E2E-W5-API-026` | `MAPPED` | — |
| 27 | AI Agent Admin | Provider Secrets | `GET` | `/api/ai-agent/provider-secrets` | `REST` | 200 | Tìm kiếm secrets (paginated) | W5-ADM-03 | ProviderSecretTable | `UI_READ` | `useTMKiMSecretsPaginatedQuery` | `AI_PROVIDER_SECRET_VIEW` | None | YES | `E2E-W5-API-027` | `MAPPED` | — |
| 28 | AI Agent Admin | Models | `POST` | `/api/ai-agent/models` | `REST` | 201 | Tạo AI model mới | W5-ADM-04 | ModelCatalogPage / ModelEditorDrawer | `UI_ACTION` | `useTOAIModelMIMutation` | `AI_AGENT_CONFIG_MANAGE` | models list/detail, deployment options | YES | `E2E-W5-API-028` | `MAPPED` | — |
| 29 | AI Agent Admin | Models | `PUT` | `/api/ai-agent/models/{id}` | `REST` | 200 | Cập nhật model | W5-ADM-04 | ModelCatalogPage / ModelEditorDrawer | `UI_ACTION` | `useCPNhTModelMutation` | `AI_AGENT_CONFIG_MANAGE` | models list/detail, deployment options | YES | `E2E-W5-API-029` | `MAPPED` | — |
| 30 | AI Agent Admin | Models | `GET` | `/api/ai-agent/models/{id}` | `REST` | 200 | Chi tiết model | W5-ADM-04 | ModelCatalogPage / ModelEditorDrawer | `UI_READ` | `useChiTiTModelQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-030` | `MAPPED` | — |
| 31 | AI Agent Admin | Models | `GET` | `/api/ai-agent/models` | `REST` | 200 | Tìm kiếm models (paginated) | W5-ADM-04 | ModelCatalogPage / ModelEditorDrawer | `UI_READ` | `useTMKiMModelsPaginatedQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-031` | `MAPPED` | — |
| 32 | AI Agent Admin | Models | `PATCH` | `/api/ai-agent/models/{id}/activate` | `REST` | 200 | Activate | W5-ADM-04 | ModelCatalogPage / ModelEditorDrawer | `UI_ACTION` | `useActivateMutation` | `AI_AGENT_CONFIG_MANAGE` | models list/detail, deployment options | YES | `E2E-W5-API-032` | `MAPPED` | — |
| 33 | AI Agent Admin | Models | `PATCH` | `/api/ai-agent/models/{id}/deactivate` | `REST` | 200 | Deactivate | W5-ADM-04 | ModelCatalogPage / ModelEditorDrawer | `UI_ACTION` | `useDeactivateMutation` | `AI_AGENT_CONFIG_MANAGE` | models list/detail, deployment options | YES | `E2E-W5-API-033` | `MAPPED` | — |
| 34 | AI Agent Admin | Model Deployments | `POST` | `/api/ai-agent/model-deployments` | `REST` | 201 | Tạo deployment | W5-ADM-05 | ModelDeploymentPage / DeploymentEditorDrawer | `UI_ACTION` | `useTODeploymentMutation` | `AI_AGENT_CONFIG_MANAGE` | deployments list/detail/defaults, agent options | YES | `E2E-W5-API-034` | `MAPPED` | — |
| 35 | AI Agent Admin | Model Deployments | `PUT` | `/api/ai-agent/model-deployments/{id}` | `REST` | 200 | Cập nhật deployment | W5-ADM-05 | ModelDeploymentPage / DeploymentEditorDrawer | `UI_ACTION` | `useCPNhTDeploymentMutation` | `AI_AGENT_CONFIG_MANAGE` | deployments list/detail/defaults, agent options | YES | `E2E-W5-API-035` | `MAPPED` | — |
| 36 | AI Agent Admin | Model Deployments | `GET` | `/api/ai-agent/model-deployments/{id}` | `REST` | 200 | Chi tiết deployment | W5-ADM-05 | ModelDeploymentPage / DeploymentEditorDrawer | `UI_READ` | `useChiTiTDeploymentQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-036` | `MAPPED` | — |
| 37 | AI Agent Admin | Model Deployments | `GET` | `/api/ai-agent/model-deployments` | `REST` | 200 | Tìm kiếm deployments (paginated) | W5-ADM-05 | ModelDeploymentPage / DeploymentEditorDrawer | `UI_READ` | `useTMKiMDeploymentsPaginatedQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-037` | `MAPPED` | — |
| 38 | AI Agent Admin | Model Deployments | `PATCH` | `/api/ai-agent/model-deployments/{id}/activate` | `REST` | 200 | Activate | W5-ADM-05 | ModelDeploymentPage / DeploymentEditorDrawer | `UI_ACTION` | `useActivateMutation` | `AI_AGENT_CONFIG_MANAGE` | deployments list/detail/defaults, agent options | YES | `E2E-W5-API-038` | `MAPPED` | — |
| 39 | AI Agent Admin | Model Deployments | `PATCH` | `/api/ai-agent/model-deployments/{id}/deactivate` | `REST` | 200 | Deactivate | W5-ADM-05 | ModelDeploymentPage / DeploymentEditorDrawer | `UI_ACTION` | `useDeactivateMutation` | `AI_AGENT_CONFIG_MANAGE` | deployments list/detail/defaults, agent options | YES | `E2E-W5-API-039` | `MAPPED` | — |
| 40 | AI Agent Admin | Model Deployments | `PATCH` | `/api/ai-agent/model-deployments/{id}/set-default` | `REST` | 200 | Đặt làm default cho model+environment | W5-ADM-05 | SetDefaultDeploymentDialog | `UI_ACTION` | `useTLMDefaultChoModelMutation` | `AI_AGENT_CONFIG_MANAGE` | deployments list/detail/defaults, agent options | YES | `E2E-W5-API-040` | `MAPPED` | — |
| 41 | AI Agent Admin | Parameter Capabilities | `POST` | `/api/ai-agent/model-parameter-capabilities` | `REST` | 201 | Thêm capability | W5-ADM-06 | ParameterCapabilityMatrix / CapabilityEditorDialog | `UI_ACTION` | `useThMCapabilityMutation` | `AI_AGENT_CONFIG_MANAGE` | parameter capabilities list/detail, model form schema | YES | `E2E-W5-API-041` | `MAPPED` | — |
| 42 | AI Agent Admin | Parameter Capabilities | `PUT` | `/api/ai-agent/model-parameter-capabilities/{id}` | `REST` | 200 | Cập nhật | W5-ADM-06 | ParameterCapabilityMatrix / CapabilityEditorDialog | `UI_ACTION` | `useCPNhTMutation` | `AI_AGENT_CONFIG_MANAGE` | parameter capabilities list/detail, model form schema | YES | `E2E-W5-API-042` | `MAPPED` | — |
| 43 | AI Agent Admin | Parameter Capabilities | `GET` | `/api/ai-agent/model-parameter-capabilities/{id}` | `REST` | 200 | Chi tiết | W5-ADM-06 | ParameterCapabilityMatrix / CapabilityEditorDialog | `UI_READ` | `useChiTiTQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-043` | `MAPPED` | — |
| 44 | AI Agent Admin | Parameter Capabilities | `GET` | `/api/ai-agent/model-parameter-capabilities` | `REST` | 200 | Tìm kiếm (paginated) | W5-ADM-06 | ParameterCapabilityMatrix / CapabilityEditorDialog | `UI_READ` | `useTMKiMPaginatedQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-044` | `MAPPED` | — |
| 45 | AI Agent Admin | Parameter Capabilities | `PATCH` | `/api/ai-agent/model-parameter-capabilities/{id}/activate` | `REST` | 200 | Activate | W5-ADM-06 | ParameterCapabilityMatrix / CapabilityEditorDialog | `UI_ACTION` | `useActivateMutation` | `AI_AGENT_CONFIG_MANAGE` | parameter capabilities list/detail, model form schema | YES | `E2E-W5-API-045` | `MAPPED` | — |
| 46 | AI Agent Admin | Parameter Capabilities | `PATCH` | `/api/ai-agent/model-parameter-capabilities/{id}/deactivate` | `REST` | 200 | Deactivate | W5-ADM-06 | ParameterCapabilityMatrix / CapabilityEditorDialog | `UI_ACTION` | `useDeactivateMutation` | `AI_AGENT_CONFIG_MANAGE` | parameter capabilities list/detail, model form schema | YES | `E2E-W5-API-046` | `MAPPED` | — |
| 47 | AI Agent Admin | Agents | `POST` | `/api/ai-agent/agents` | `REST` | 201 | Tạo agent | W5-ADM-07 | AgentRegistryPage / AgentEditorDrawer | `UI_ACTION` | `useTOAgentMutation` | `AI_AGENT_CONFIG_MANAGE` | agents list/detail, prompt/playground options | YES | `E2E-W5-API-047` | `MAPPED` | — |
| 48 | AI Agent Admin | Agents | `PUT` | `/api/ai-agent/agents/{id}` | `REST` | 200 | Cập nhật | W5-ADM-07 | AgentRegistryPage / AgentEditorDrawer | `UI_ACTION` | `useCPNhTMutation` | `AI_AGENT_CONFIG_MANAGE` | agents list/detail, prompt/playground options | YES | `E2E-W5-API-048` | `MAPPED` | — |
| 49 | AI Agent Admin | Agents | `GET` | `/api/ai-agent/agents/{id}` | `REST` | 200 | Chi tiết | W5-ADM-07 | AgentRegistryPage / AgentEditorDrawer | `UI_READ` | `useChiTiTQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-049` | `MAPPED` | — |
| 50 | AI Agent Admin | Agents | `GET` | `/api/ai-agent/agents` | `REST` | 200 | Tìm kiếm (paginated) | W5-ADM-07 | AgentRegistryPage / AgentEditorDrawer | `UI_READ` | `useTMKiMPaginatedQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-050` | `MAPPED` | — |
| 51 | AI Agent Admin | Agents | `PATCH` | `/api/ai-agent/agents/{id}/activate` | `REST` | 200 | Activate | W5-ADM-07 | AgentRegistryPage / AgentEditorDrawer | `UI_ACTION` | `useActivateMutation` | `AI_AGENT_CONFIG_MANAGE` | agents list/detail, prompt/playground options | YES | `E2E-W5-API-051` | `MAPPED` | — |
| 52 | AI Agent Admin | Agents | `PATCH` | `/api/ai-agent/agents/{id}/deactivate` | `REST` | 200 | Deactivate | W5-ADM-07 | AgentRegistryPage / AgentEditorDrawer | `UI_ACTION` | `useDeactivateMutation` | `AI_AGENT_CONFIG_MANAGE` | agents list/detail, prompt/playground options | YES | `E2E-W5-API-052` | `MAPPED` | — |
| 53 | AI Agent Admin | Prompt Templates | `POST` | `/api/ai-agent/prompt-templates` | `REST` | 201 | Tạo template | W5-ADM-08 | PromptTemplateLibrary / PromptTemplateDrawer | `UI_ACTION` | `useTOTemplateMutation` | `AI_AGENT_CONFIG_MANAGE` | prompt templates list/detail, prompt options | YES | `E2E-W5-API-053` | `MAPPED` | — |
| 54 | AI Agent Admin | Prompt Templates | `PUT` | `/api/ai-agent/prompt-templates/{id}` | `REST` | 200 | Cập nhật tên/mô tả | W5-ADM-08 | PromptTemplateLibrary / PromptTemplateDrawer | `UI_ACTION` | `useCPNhTTNMutation` | `AI_AGENT_CONFIG_MANAGE` | prompt templates list/detail, prompt options | YES | `E2E-W5-API-054` | `MAPPED` | — |
| 55 | AI Agent Admin | Prompt Templates | `GET` | `/api/ai-agent/prompt-templates/{id}` | `REST` | 200 | Chi tiết | W5-ADM-08 | PromptTemplateLibrary / PromptTemplateDrawer | `UI_READ` | `useChiTiTQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-055` | `MAPPED` | — |
| 56 | AI Agent Admin | Prompt Templates | `GET` | `/api/ai-agent/prompt-templates` | `REST` | 200 | Tìm kiếm (paginated) | W5-ADM-08 | PromptTemplateLibrary / PromptTemplateDrawer | `UI_READ` | `useTMKiMPaginatedQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-056` | `MAPPED` | — |
| 57 | AI Agent Admin | Prompt Templates | `PATCH` | `/api/ai-agent/prompt-templates/{id}/activate` | `REST` | 200 | Activate | W5-ADM-08 | PromptTemplateLibrary / PromptTemplateDrawer | `UI_ACTION` | `useActivateMutation` | `AI_AGENT_CONFIG_MANAGE` | prompt templates list/detail, prompt options | YES | `E2E-W5-API-057` | `MAPPED` | — |
| 58 | AI Agent Admin | Prompt Templates | `PATCH` | `/api/ai-agent/prompt-templates/{id}/deactivate` | `REST` | 200 | Deactivate | W5-ADM-08 | PromptTemplateLibrary / PromptTemplateDrawer | `UI_ACTION` | `useDeactivateMutation` | `AI_AGENT_CONFIG_MANAGE` | prompt templates list/detail, prompt options | YES | `E2E-W5-API-058` | `MAPPED` | — |
| 59 | AI Agent Admin | Prompt Versions | `POST` | `/api/ai-agent/prompt-versions` | `REST` | 201 | Tạo version mới (status = `DRAFT`) | W5-ADM-09 | CreatePromptVersionDialog | `UI_ACTION` | `useTOVersionMIStatusMutation` | `AI_AGENT_CONFIG_MANAGE` | prompt versions list/detail/active version, playground options | YES | `E2E-W5-API-059` | `MAPPED` | — |
| 60 | AI Agent Admin | Prompt Versions | `PUT` | `/api/ai-agent/prompt-versions/{id}` | `REST` | 200 | Cập nhật (chỉ khi đang `DRAFT`) | W5-ADM-09 | PromptVersionEditor | `UI_ACTION` | `useCPNhTChKhiMutation` | `AI_AGENT_CONFIG_MANAGE` | prompt versions list/detail/active version, playground options | YES | `E2E-W5-API-060` | `MAPPED` | — |
| 61 | AI Agent Admin | Prompt Versions | `GET` | `/api/ai-agent/prompt-versions/{id}` | `REST` | 200 | Chi tiết | W5-ADM-09 | PromptVersionViewer | `UI_READ` | `useChiTiTQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-061` | `MAPPED` | — |
| 62 | AI Agent Admin | Prompt Versions | `GET` | `/api/ai-agent/prompt-versions` | `REST` | 200 | Tìm kiếm (paginated) | W5-ADM-09 | PromptVersionHistory | `UI_READ` | `useTMKiMPaginatedQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-062` | `MAPPED` | — |
| 63 | AI Agent Admin | Prompt Versions | `PATCH` | `/api/ai-agent/prompt-versions/{id}/activate` | `REST` | 200 | Activate (archives version `ACTIVE` hiện tại) | W5-ADM-09 | ActivatePromptVersionDialog | `UI_ACTION` | `useActivateArchivesVersionACTIVEHiNMutation` | `AI_AGENT_CONFIG_MANAGE` | prompt versions list/detail/active version, playground options | YES | `E2E-W5-API-063` | `MAPPED` | — |
| 64 | AI Agent Admin | Prompt Versions | `PATCH` | `/api/ai-agent/prompt-versions/{id}/archive` | `REST` | 200 | Archive version | W5-ADM-09 | ArchivePromptVersionDialog | `UI_ACTION` | `useArchiveVersionMutation` | `AI_AGENT_CONFIG_MANAGE` | prompt versions list/detail/active version, playground options | YES | `E2E-W5-API-064` | `MAPPED` | — |
| 65 | AI Agent Admin | Event Configurations | `POST` | `/api/ai-agent/event-configs` | `REST` | 201 | Tạo event config | W5-ADM-10 | EventConfigurationPage / EventConfigEditor | `UI_ACTION` | `useTOEventConfigMutation` | `AI_AGENT_CONFIG_MANAGE` | event configs list/detail/resolve/options | YES | `E2E-W5-API-065` | `MAPPED` | — |
| 66 | AI Agent Admin | Event Configurations | `PUT` | `/api/ai-agent/event-configs/{id}` | `REST` | 200 | Cập nhật | W5-ADM-10 | EventConfigurationPage / EventConfigEditor | `UI_ACTION` | `useCPNhTMutation` | `AI_AGENT_CONFIG_MANAGE` | event configs list/detail/resolve/options | YES | `E2E-W5-API-066` | `MAPPED` | — |
| 67 | AI Agent Admin | Event Configurations | `GET` | `/api/ai-agent/event-configs/resolve` | `REST` | 200 | Resolve config đang active cho một event+environment | W5-ADM-10 | EventConfigResolveTester | `UI_READ` | `useResolveConfigAngActiveChoMQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-067` | `MAPPED` | — |
| 68 | AI Agent Admin | Event Configurations | `GET` | `/api/ai-agent/event-configs/{id}` | `REST` | 200 | Chi tiết | W5-ADM-10 | EventConfigurationPage / EventConfigEditor | `UI_READ` | `useChiTiTQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-068` | `MAPPED` | — |
| 69 | AI Agent Admin | Event Configurations | `GET` | `/api/ai-agent/event-configs` | `REST` | 200 | Tìm kiếm (paginated) | W5-ADM-10 | EventConfigurationPage / EventConfigEditor | `UI_READ` | `useTMKiMPaginatedQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-069` | `MAPPED` | — |
| 70 | AI Agent Admin | Event Configurations | `PATCH` | `/api/ai-agent/event-configs/{id}/activate` | `REST` | 200 | Activate | W5-ADM-10 | EventConfigurationPage / EventConfigEditor | `UI_ACTION` | `useActivateMutation` | `AI_AGENT_CONFIG_MANAGE` | event configs list/detail/resolve/options | YES | `E2E-W5-API-070` | `MAPPED` | — |
| 71 | AI Agent Admin | Event Configurations | `PATCH` | `/api/ai-agent/event-configs/{id}/deactivate` | `REST` | 200 | Deactivate | W5-ADM-10 | EventConfigurationPage / EventConfigEditor | `UI_ACTION` | `useDeactivateMutation` | `AI_AGENT_CONFIG_MANAGE` | event configs list/detail/resolve/options | YES | `E2E-W5-API-071` | `MAPPED` | — |
| 72 | AI Agent Admin | Usage Policies | `POST` | `/api/ai-agent/usage-policies` | `REST` | 201 | Tạo usage policy | W5-ADM-11 | UsagePolicyPage / UsagePolicyEditor | `UI_ACTION` | `useTOUsagePolicyMutation` | `AI_AGENT_CONFIG_MANAGE` | usage policies list/detail | YES | `E2E-W5-API-072` | `MAPPED` | — |
| 73 | AI Agent Admin | Usage Policies | `PUT` | `/api/ai-agent/usage-policies/{id}` | `REST` | 200 | Cập nhật | W5-ADM-11 | UsagePolicyPage / UsagePolicyEditor | `UI_ACTION` | `useCPNhTMutation` | `AI_AGENT_CONFIG_MANAGE` | usage policies list/detail | YES | `E2E-W5-API-073` | `MAPPED` | — |
| 74 | AI Agent Admin | Usage Policies | `GET` | `/api/ai-agent/usage-policies/{id}` | `REST` | 200 | Chi tiết | W5-ADM-11 | UsagePolicyPage / UsagePolicyEditor | `UI_READ` | `useChiTiTQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-074` | `MAPPED` | — |
| 75 | AI Agent Admin | Usage Policies | `GET` | `/api/ai-agent/usage-policies` | `REST` | 200 | Tìm kiếm (paginated) | W5-ADM-11 | UsagePolicyPage / UsagePolicyEditor | `UI_READ` | `useTMKiMPaginatedQuery` | `AI_AGENT_CONFIG_VIEW` | None | YES | `E2E-W5-API-075` | `MAPPED` | — |
| 76 | AI Agent Admin | Usage Policies | `PATCH` | `/api/ai-agent/usage-policies/{id}/activate` | `REST` | 200 | Activate | W5-ADM-11 | UsagePolicyPage / UsagePolicyEditor | `UI_ACTION` | `useActivateMutation` | `AI_AGENT_CONFIG_MANAGE` | usage policies list/detail | YES | `E2E-W5-API-076` | `MAPPED` | — |
| 77 | AI Agent Admin | Usage Policies | `PATCH` | `/api/ai-agent/usage-policies/{id}/deactivate` | `REST` | 200 | Deactivate | W5-ADM-11 | UsagePolicyPage / UsagePolicyEditor | `UI_ACTION` | `useDeactivateMutation` | `AI_AGENT_CONFIG_MANAGE` | usage policies list/detail | YES | `E2E-W5-API-077` | `MAPPED` | — |
| 78 | AI Agent Admin | Executions | `POST` | `/api/ai-agent/executions/event` | `REST` | 200 | Trigger bằng event (eventDefinitionId, eventCode, hoặc sourceSystem+eventKey) | W5-ADM-12 / W5-ADM-14 | ManualEventExecutionDialog | `UI_ACTION` | `useTriggerBNgEventEventDefinitionIdEventCodeMutation` | `AI_EXECUTION_RUN` | execution logs, execution result | YES | `E2E-W5-API-078` | `MAPPED` | — |
| 79 | AI Agent Admin | Executions | `POST` | `/api/ai-agent/executions/event-config/{eventConfigId}` | `REST` | 200 | Trigger bằng EventConfig ID trực tiếp | W5-ADM-12 / W5-ADM-14 | RunEventConfigDialog | `UI_ACTION` | `useTriggerBNgEventConfigIDTrMutation` | `AI_EXECUTION_RUN` | execution logs, execution result | YES | `E2E-W5-API-079` | `MAPPED` | — |
| 80 | AI Agent Admin | Execution Logs | `POST` | `/api/ai-agent/execution-logs` | `REST` | 201 | Tạo execution log (thường dùng internally) | W5-ADM-12 / W5-ADM-13 | ExecutionWorkerStatusProjection | `SERVICE_ORCHESTRATED` | `useTOExecutionLogThNgMutation` | `SERVICE_IDENTITY_ONLY` | execution logs/detail/status counters | YES | `E2E-W5-API-080` | `SERVICE_ORCHESTRATED — TEST REQUIRED` | Browser must not call internal execution-log transition endpoint. |
| 81 | AI Agent Admin | Execution Logs | `PATCH` | `/api/ai-agent/execution-logs/{id}/running` | `REST` | 200 | Mark as running | W5-ADM-12 / W5-ADM-13 | ExecutionWorkerStatusProjection | `SERVICE_ORCHESTRATED` | `useMarkAsRunningMutation` | `SERVICE_IDENTITY_ONLY` | execution logs/detail/status counters | YES | `E2E-W5-API-081` | `SERVICE_ORCHESTRATED — TEST REQUIRED` | Browser must not call internal execution-log transition endpoint. |
| 82 | AI Agent Admin | Execution Logs | `PATCH` | `/api/ai-agent/execution-logs/{id}/succeeded` | `REST` | 200 | Mark as succeeded (với token count + cost) | W5-ADM-12 / W5-ADM-13 | ExecutionWorkerStatusProjection | `SERVICE_ORCHESTRATED` | `useMarkAsSucceededVITokenMutation` | `SERVICE_IDENTITY_ONLY` | execution logs/detail/status counters | YES | `E2E-W5-API-082` | `SERVICE_ORCHESTRATED — TEST REQUIRED` | Browser must not call internal execution-log transition endpoint. |
| 83 | AI Agent Admin | Execution Logs | `PATCH` | `/api/ai-agent/execution-logs/{id}/failed` | `REST` | 200 | Mark as failed (với error info) | W5-ADM-12 / W5-ADM-13 | ExecutionWorkerStatusProjection | `SERVICE_ORCHESTRATED` | `useMarkAsFailedVIErrorMutation` | `SERVICE_IDENTITY_ONLY` | execution logs/detail/status counters | YES | `E2E-W5-API-083` | `SERVICE_ORCHESTRATED — TEST REQUIRED` | Browser must not call internal execution-log transition endpoint. |
| 84 | AI Agent Admin | Execution Logs | `PATCH` | `/api/ai-agent/execution-logs/{id}/cancel` | `REST` | 200 | Cancel | W5-ADM-12 / W5-ADM-13 | ExecutionWorkerStatusProjection | `SERVICE_ORCHESTRATED` | `useCancelMutation` | `SERVICE_IDENTITY_ONLY` | execution logs/detail/status counters | YES | `E2E-W5-API-084` | `SERVICE_ORCHESTRATED — TEST REQUIRED` | Browser must not call internal execution-log transition endpoint. |
| 85 | AI Agent Admin | Execution Logs | `GET` | `/api/ai-agent/execution-logs/{id}` | `REST` | 200 | Chi tiết log | W5-ADM-12 / W5-ADM-13 | ExecutionDetailPage | `UI_READ` | `useChiTiTLogQuery` | `AI_EXECUTION_LOG_VIEW` | None | YES | `E2E-W5-API-085` | `MAPPED` | — |
| 86 | AI Agent Admin | Execution Logs | `GET` | `/api/ai-agent/execution-logs` | `REST` | 200 | Tìm kiếm logs (paginated) | W5-ADM-12 / W5-ADM-13 | ExecutionLogTable | `UI_READ` | `useTMKiMLogsPaginatedQuery` | `AI_EXECUTION_LOG_VIEW` | None | YES | `E2E-W5-API-086` | `MAPPED` | — |
| 87 | AI Agent Admin | Playground | `POST` | `/api/ai-agent/playground/event-config/{eventConfigId}/run` | `REST` | 200 | Chạy thử một EventConfig với input variables | W5-ADM-14 | EventConfigPlaygroundRunner | `UI_ACTION` | `useChYThMTEventConfigMutation` | `AI_PLAYGROUND_USE` | playground result/history | YES | `E2E-W5-API-087` | `MAPPED` | — |
| 88 | AI Agent Admin | Playground | `POST` | `/api/ai-agent/playground/direct/run` | `REST` | 200 | Chạy thử trực tiếp (chọn agent + prompt version + deployment) | W5-ADM-14 | DirectPlaygroundRunner | `UI_ACTION` | `useChYThTrCTiMutation` | `AI_PLAYGROUND_USE` | playground result/history | YES | `E2E-W5-API-088` | `MAPPED` | — |
| 89 | AI Agent Admin | Playground | `POST` | `/api/ai-agent/playground/prompt/preview` | `REST` | 200 | Preview rendered prompt (không gọi AI) | W5-ADM-14 | PromptPreviewPanel | `UI_ACTION` | `usePreviewRenderedPromptKhNgGMutation` | `AI_PLAYGROUND_USE` | playground result/history | YES | `E2E-W5-API-089` | `MAPPED` | — |
| 90 | AI Agent Admin | Playground | `GET` | `/api/ai-agent/playground/options` | `REST` | 200 | Lấy options cho dropdowns (event configs, agents, prompts, deployments) | W5-ADM-14 | PlaygroundConfigurationForm | `UI_READ` | `useLYOptionsChoDropdownsEventQuery` | `AI_PLAYGROUND_USE` | None | YES | `E2E-W5-API-090` | `MAPPED` | — |
| 91 | AI Agent Admin | Tools | `POST` | `/api/ai-agent/tools` | `REST` | 201 | Đăng ký tool mới | W5-ADM-15 / W5-ADM-16 | ToolRegistryPage / ToolDetailPage | `UI_ACTION` | `useNgKToolMIMutation` | `AI_TOOL_MANAGE` | tools list/detail/permissions/bindings | YES | `E2E-W5-API-091` | `MAPPED` | — |
| 92 | AI Agent Admin | Tools | `PUT` | `/api/ai-agent/tools/{id}` | `REST` | 200 | Cập nhật tool | W5-ADM-15 / W5-ADM-16 | ToolRegistryPage / ToolDetailPage | `UI_ACTION` | `useCPNhTToolMutation` | `AI_TOOL_MANAGE` | tools list/detail/permissions/bindings | YES | `E2E-W5-API-092` | `MAPPED` | — |
| 93 | AI Agent Admin | Tools | `GET` | `/api/ai-agent/tools/{id}` | `REST` | 200 | Chi tiết tool | W5-ADM-15 / W5-ADM-16 | ToolDetailPage | `UI_READ` | `useChiTiTToolQuery` | `AI_TOOL_VIEW` | None | YES | `E2E-W5-API-093` | `MAPPED` | — |
| 94 | AI Agent Admin | Tools | `GET` | `/api/ai-agent/tools` | `REST` | 200 | Tìm kiếm tools (paginated) | W5-ADM-15 / W5-ADM-16 | ToolRegistryTable | `UI_READ` | `useTMKiMToolsPaginatedQuery` | `AI_TOOL_VIEW` | None | YES | `E2E-W5-API-094` | `MAPPED` | — |
| 95 | AI Agent Admin | Tools | `PATCH` | `/api/ai-agent/tools/{id}/activate` | `REST` | 200 | Activate tool | W5-ADM-15 / W5-ADM-16 | ToolRegistryPage / ToolDetailPage | `UI_ACTION` | `useActivateToolMutation` | `AI_TOOL_MANAGE` | tools list/detail/permissions/bindings | YES | `E2E-W5-API-095` | `MAPPED` | — |
| 96 | AI Agent Admin | Tools | `PATCH` | `/api/ai-agent/tools/{id}/deactivate` | `REST` | 200 | Deactivate tool | W5-ADM-15 / W5-ADM-16 | ToolRegistryPage / ToolDetailPage | `UI_ACTION` | `useDeactivateToolMutation` | `AI_TOOL_MANAGE` | tools list/detail/permissions/bindings | YES | `E2E-W5-API-096` | `MAPPED` | — |
| 97 | AI Agent Admin | Tools | `POST` | `/api/ai-agent/tools/{id}/permissions` | `REST` | 201 | Thêm permission yêu cầu cho tool | W5-ADM-15 / W5-ADM-16 | AddToolPermissionDialog | `UI_ACTION` | `useThMPermissionYUCMutation` | `AI_TOOL_MANAGE` | tools list/detail/permissions/bindings | YES | `E2E-W5-API-097` | `MAPPED` | — |
| 98 | AI Agent Admin | Tools | `DELETE` | `/api/ai-agent/tools/{id}/permissions/{permissionId}` | `REST` | 200 | Xoá permission binding | W5-ADM-15 / W5-ADM-16 | RemoveToolPermissionAction | `UI_ACTION` | `useXoPermissionBindingMutation` | `AI_TOOL_MANAGE` | tools list/detail/permissions/bindings | YES | `E2E-W5-API-098` | `MAPPED` | — |
| 99 | AI Agent Admin | Tools | `POST` | `/api/ai-agent/tools/{id}/bindings` | `REST` | 201 | Bind tool với agent | W5-ADM-15 / W5-ADM-16 | BindAgentDialog | `UI_ACTION` | `useBindToolVIAgentMutation` | `AI_TOOL_MANAGE` | tools list/detail/permissions/bindings | YES | `E2E-W5-API-099` | `MAPPED` | — |
| 100 | AI Agent Admin | Tools | `GET` | `/api/ai-agent/tools/{id}/bindings` | `REST` | 200 | Danh sách agents đang bind với tool | W5-ADM-15 / W5-ADM-16 | ToolAgentBindingsTable | `UI_READ` | `useDanhSChAgentsAngBindQuery` | `AI_TOOL_VIEW` | None | YES | `E2E-W5-API-100` | `MAPPED` | — |
| 101 | AI Agent Admin | Tools | `DELETE` | `/api/ai-agent/tools/{id}/bindings/{agentId}` | `REST` | 200 | Unbind agent khỏi tool | W5-ADM-15 / W5-ADM-16 | UnbindAgentAction | `UI_ACTION` | `useUnbindAgentKhIToolMutation` | `AI_TOOL_MANAGE` | tools list/detail/permissions/bindings | YES | `E2E-W5-API-101` | `MAPPED` | — |
| 102 | AI Agent Admin | Tools | `POST` | `/api/ai-agent/tools/{id}/execute` | `REST` | 200 | Execute tool (stub/no-op + ghi log) | W5-ADM-15 / W5-ADM-16 | ToolDebugExecutePanel | `ADMIN_DEBUG_ACTION` | `useExecuteToolStubNoOpGhiMutation` | `AI_TOOL_MANAGE` | tools list/detail/permissions/bindings | YES | `E2E-W5-API-102` | `MAPPED` | — |


---

# 43. CI Coverage Gate

CI must fail when:

```text
OpenAPI endpoint missing from coverage register
Coverage register endpoint missing from OpenAPI without approved legacy flag
InitialStatus/FinalStatus is UNMAPPED
User-facing endpoint final status is not UI_TESTED
SSE endpoint final status is not UI_STREAM_TESTED
Service endpoint final status is not SERVICE_ORCHESTRATED_TESTED
RequiredBeforeDone=YES and test evidence is empty
Mutation invalidation is empty
Permission is empty
Page/UIBinding is empty
Unapproved exception exists
```

Suggested machine-readable fields:

```text
method
path
protocol
module
pageId
component
integrationClass
permission
hook
invalidation
testEvidence
finalStatus
exceptionApproval
owner
```

---

# 44. Coding Agent Prompt

```text
Implement Scopery Wave 5 UI from WAVE5_API_CONTRACT.md and this specification.

Mandatory:
1. Read the live OpenAPI before coding.
2. Reconcile exactly all contract endpoints.
3. Do not remove any endpoint from the coverage register.
4. Implement all user-facing endpoints with real API calls.
5. Implement REST → SSE correctly with reconnect, event deduplication, cancel and final refetch.
6. Never expose raw provider secrets.
7. Keep execution-log lifecycle mutations service-orchestrated unless explicitly approved.
8. Implement all AI Agent configuration pages.
9. Add permission, loading, empty, forbidden, validation and error states.
10. Add cache invalidation for every mutation.
11. Add test evidence for every endpoint.
12. Update each endpoint final status.
13. Create WAVE_5_AI_ASSISTANT_AGENT_UI_COMPLETE.md.
14. Do not mark Wave 5 complete until all endpoints satisfy the coverage gate.
```
