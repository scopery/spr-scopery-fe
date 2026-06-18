# Tích hợp FE: AI Generate Questions

Doc này dành cho Frontend tích hợp đúng flow **sinh câu hỏi làm rõ** (generate questions) và **commit** kết quả. Nếu FE gọi sai (thiếu body, sai engine, sai URL), sẽ dễ bị 422 / 409.

---

## Payload FE phải gửi (copy-paste)

### Generate questions (v2)

**Method:** `POST`  
**URL:** `{BASE_URL}/api/v2/orgs/{orgId}/projects/{projectId}/ai/questions/generate`  
**Headers:**
```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Body (JSON) — tối thiểu để xài được v2:**
```json
{
  "engine": "agentkit_v2_file",
  "base_session_id": "<UUID của session user chọn>"
}
```

**Body đầy đủ (có thể gửi thêm):**
```json
{
  "engine": "agentkit_v2_file",
  "base_session_id": "770e8400-e29b-41d4-a716-446655440002",
  "instruction": "Tập trung làm rõ scope, actors và NFR.",
  "max_items": 12,
  "use_cached_digest": true
}
```

- `engine`: bắt buộc phải là `"agentkit_v2_file"` nếu muốn dùng v2.
- `base_session_id`: **bắt buộc** khi engine = v2; là UUID session đang chọn (session có Q&A để AI đọc).
- `instruction`, `max_items`, `use_cached_digest`: tùy chọn.

**Lưu ý:** Không gửi qua URL session. URL đúng là theo **org + project**, không phải `.../sessions/:sessionId/ai/...`.

---

## 1. Base URL & Auth

- **Base:** `{BASE_URL}/api/v2` (vd. `http://localhost:3000/api/v2`).
- **Auth:** Mọi request cần header:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  ```
- **Quyền:** User phải là **editor hoặc owner** của project (member project).

---

## 2. Generate Questions — Gửi đúng request

### Endpoint

```http
POST /api/v2/orgs/:orgId/projects/:projectId/ai/questions/generate
```

- **URL phải có:** `orgId`, `projectId` (UUID) trong path. **Không** gửi generate questions qua URL session (vd. không phải `.../sessions/:sessionId/ai/...`).

**Ví dụ URL đúng:**

```
POST /api/v2/orgs/550e8400-e29b-41d4-a716-446655440000/projects/660e8400-e29b-41d4-a716-446655440001/ai/questions/generate
```

### Request body (JSON)

| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `engine` | `"legacy"` \| `"agentkit_v2_file"` | Không | Mặc định theo server. **Muốn dùng flow v2 (recommended)** thì gửi `"agentkit_v2_file"`. |
| `base_session_id` | UUID string | **Có** khi engine = v2 | Session dùng làm context (Q&A). **V2 bắt buộc phải gửi.** |
| `base_revision_id` | UUID string | Không (legacy) | Chỉ dùng khi `engine === "legacy"`. |
| `instruction` | string (max 4000) | Không | Gợi ý cho AI (vd. "Tập trung scope, NFR"). |
| `max_items` | number (1–100) | Không | Số câu hỏi tối đa; server vẫn cap theo env. |
| `use_cached_digest` | boolean | Không, default `true` | Chỉ v2: dùng cache digest (facts/unknowns) nếu có. |

### Quan trọng: Khi dùng engine v2

- **Luôn gửi `base_session_id`** = ID session mà user đang chọn (session có câu hỏi + câu trả lời để AI dựa vào sinh thêm câu hỏi).
- **Không** gửi generate questions mà không có `base_session_id` khi engine là v2 → server trả **422** (validation).

**Ví dụ body đúng (v2):**

```json
{
  "engine": "agentkit_v2_file",
  "base_session_id": "770e8400-e29b-41d4-a716-446655440002",
  "instruction": "Tập trung làm rõ scope, actors và NFR.",
  "max_items": 12,
  "use_cached_digest": true
}
```

**Ví dụ body sai (thiếu base_session_id cho v2):**

```json
{
  "engine": "agentkit_v2_file"
}
```

→ Server trả **422** với `errors[].path = "base_session_id"`.

### Response 200

```json
{
  "batch_token": "uuid-string",
  "items": [
    {
      "temp_id": "uuid",
      "section": "overview",
      "tags": ["scope"],
      "q_type": "textarea",
      "prompt": "Mục tiêu dự án là gì?",
      "help_text": null,
      "required": false,
      "answer_schema": {}
    }
  ],
  "payload_sent": { ... }
}
```

- **batch_token:** Dùng cho bước commit (có TTL, hết hạn phải gọi generate lại).
- **items:** Danh sách câu hỏi AI sinh ra; mỗi item có **temp_id** (dùng khi commit / edits).
- **payload_sent:** (Tạm thời) Object chính xác mà BE gửi cho workflow; dùng để debug. Có thể bỏ qua khi hiển thị UI; sau này BE có thể bỏ field này.

### Lỗi hay gặp

| Status | Code | Ý nghĩa | Cách xử lý FE |
|--------|------|--------|----------------|
| 422 | (validation) | Thiếu `base_session_id` khi engine = v2, hoặc legacy thiếu cả session + revision | Hiển thị lỗi từ `errors[]`; nhắc user chọn session (v2) hoặc session/revision (legacy). |
| 409 | `AI_FEATURE_DISABLED` | Server tắt QGen v2 | Thông báo feature chưa bật hoặc dùng engine legacy. |
| 409 | `AI_WORKFLOW_ID_REQUIRED` | Server chưa cấu hình workflow v2 | Thông báo lỗi cấu hình server. |
| 409 | `AI_BATCH_EXPIRED` | Batch cũ đã hết hạn / đã commit | Gọi lại generate để lấy batch_token mới. |
| 413 | `PAYLOAD_TOO_LARGE` | QA pack (session Q&A) quá lớn | Giảm nội dung session hoặc thông báo. |
| 502 | `AI_*` | Lỗi workflow / output AI | Thông báo lỗi tạm thời, cho user thử lại. |
| 404 | `AI_PROVIDER_ERROR` | Workflow API trả 404 (workflow không tồn tại / endpoint) | Thông báo: Admin kiểm tra workflow ID và cấu hình OpenAI. |

---

## 3. Commit questions — Sau khi user chọn/chỉnh sửa

Sau khi user xem danh sách `items`, chọn câu nào chấp nhận (và có thể chỉnh sửa), FE gọi commit để lưu vào project.

### Endpoint

```http
POST /api/v2/orgs/:orgId/projects/:projectId/ai/questions/commit
```

### Request body

```json
{
  "batch_token": "uuid-from-generate-response",
  "accepted_temp_ids": ["temp_id_1", "temp_id_2"],
  "edits": [
    {
      "temp_id": "temp_id_1",
      "patch": {
        "section": "scope",
        "prompt": "Câu hỏi đã sửa",
        "required": true
      }
    }
  ]
}
```

- **batch_token:** Bắt buộc; lấy từ response **generate** (cùng project + user).
- **accepted_temp_ids:** Mảng **không rỗng** các `temp_id` được chấp nhận → những câu hỏi này sẽ được thêm vào project.
- **edits:** Tùy chọn; chỉnh từng item trước khi insert. Chỉ áp dụng cho item có `temp_id` nằm trong `accepted_temp_ids`.  
  **patch** có thể có: `section`, `tags`, `q_type`, `prompt`, `help_text`, `required`, `answer_schema`.

**Lưu ý:** Nếu gửi `batch_token` sai hoặc đã hết hạn / đã commit → **409** `AI_BATCH_EXPIRED`. Khi đó cần gọi lại generate.

---

## 4. Flow gợi ý trên FE

1. **Trang project/session:** User chọn **một session** (đã có câu hỏi + câu trả lời).
2. **Gọi generate:**
   - `POST .../orgs/:orgId/projects/:projectId/ai/questions/generate`
   - Body: `{ "engine": "agentkit_v2_file", "base_session_id": "<session_id đã chọn>", "instruction": "...", "max_items": 12 }`.
3. **Nhận 200:** Lưu `batch_token`; hiển thị `items` (câu hỏi đề xuất). Có thể bỏ qua `payload_sent` khi render.
4. **User chọn/chỉnh:** User tick câu chấp nhận, có thể sửa prompt/section/required.
5. **Gọi commit:**
   - `POST .../orgs/:orgId/projects/:projectId/ai/questions/commit`
   - Body: `{ "batch_token": "<đã lưu>", "accepted_temp_ids": [...], "edits": [...] }`.
6. **Nhận 201:** Câu hỏi đã được thêm vào project; có thể refetch project questions hoặc điều hướng.

---

## 5. Checklist tích hợp

- [ ] URL đúng: `POST /api/v2/orgs/:orgId/projects/:projectId/ai/questions/generate` (không nhầm với session path).
- [ ] Khi dùng v2: body luôn có `base_session_id` (session user chọn).
- [ ] Header: `Authorization: Bearer <token>`, `Content-Type: application/json`.
- [ ] Generate trả 200: lưu `batch_token`, hiển thị `items`; không cần hiển thị `payload_sent` (trừ khi debug).
- [ ] Commit: gửi đúng `batch_token` và `accepted_temp_ids` (non-empty); `edits` tùy chọn.
- [ ] Xử lý 422 (validation): hiển thị `errors[].message`, nhắc chọn session khi thiếu `base_session_id`.
- [ ] Xử lý 409 `AI_BATCH_EXPIRED`: nhắc user tạo lại (gọi generate lại).

Nếu vẫn gặp lỗi, kiểm tra response body (422 có `errors`, 409 có `code`) và so với bảng lỗi ở mục 2.

---

## 6. Troubleshooting: "AI v2 is disabled. Used legacy engine."

**Nguyên nhân:** Trên **server (BE)** chưa bật QGen v2. Mặc định `AI_WF_QGEN_V2_ENABLED=false`.

**Cách xử lý (phía BE / DevOps):**

1. Mở file **`.env`** của backend.
2. Bật V2 và set workflow ID:
   ```env
   AI_WF_QGEN_V2_ENABLED=true
   AI_WF_QGEN_V2_WORKFLOW_ID=<workflow_id_từ_OpenAI_Agent_Builder>
   ```
3. Restart server (env được đọc lúc khởi động).

**Lưu ý:**

- Nếu chỉ set `AI_WF_QGEN_V2_ENABLED=true` mà không set `AI_WF_QGEN_V2_WORKFLOW_ID`, khi gọi v2 server sẽ trả **409** `AI_WORKFLOW_ID_REQUIRED`.
- Workflow ID lấy từ OpenAI Agent Builder (workflow dùng để generate questions). Không có ID đúng thì v2 không chạy được.

**FE:** Khi nhận 409 `AI_FEATURE_DISABLED` hoặc khi server luôn chạy legacy dù FE gửi `engine: "agentkit_v2_file"`, thông báo cho user: "Tính năng AI v2 chưa được bật trên server. Liên hệ admin để bật AI_WF_QGEN_V2_ENABLED và cấu hình workflow."

---

## 7. Troubleshooting: 404 Workflow API (AI_PROVIDER_ERROR)

**Triệu chứng:** Response 502 hoặc 404 với `code: "AI_PROVIDER_ERROR"`, `detail` có "Workflow API returned 404", kèm `workflow_id` trong body.

**Nguyên nhân:** Backend gọi `POST https://api.openai.com/v1/workflows/{workflow_id}/runs` nhưng OpenAI trả 404 — workflow không tìm thấy hoặc endpoint không khả dụng với tài khoản/region.

**Cách xử lý (phía BE / DevOps):**

1. **Lấy đúng Workflow ID**
   - Vào [OpenAI Agent Builder](https://platform.openai.com/agent-builder), mở workflow dùng để generate questions.
   - **Publish** workflow (tạo version) nếu chưa publish.
   - Lấy **Workflow ID** từ màn hình sau khi publish (hoặc mục Code / Export). ID thường dạng `wf_...`. Copy nguyên, không bỏ prefix.

2. **Kiểm tra OpenAI Project (nếu dùng)**
   - Trong `.env` có thể set `OPENAI_PROJECT_ID` = project trên Platform nơi workflow được tạo. Nếu workflow nằm trong một project cụ thể mà API key không thuộc project đó, có thể bị 404. Thử set đúng `OPENAI_PROJECT_ID` hoặc tạo workflow trong project mặc định.

3. **API key và quyền**
   - API key phải có quyền gọi Workflows / Agent Builder (nếu OpenAI tách quyền). Thử key khác hoặc tạo key mới trong cùng project với workflow.

4. **Endpoint có thể thay đổi**
   - Endpoint `/v1/workflows/{id}/runs` có thể là beta hoặc chỉ hỗ trợ một số region/tài khoản. Nếu 404 vẫn xảy ra sau khi kiểm tra trên:
   - Xem [OpenAI Agent Builder docs](https://platform.openai.com/docs/guides/agent-builder) và [Interact with workflow from API](https://community.openai.com/t/interact-with-an-agent-builder-workflow-from-the-api/1366676) để xác nhận cách gọi đúng (REST vs Agents SDK).
   - Một số tích hợp dùng **Agents SDK** (chạy workflow trong process) thay vì gọi REST. Khi đó BE cần đổi sang dùng SDK thay vì `POST .../workflows/.../runs`.

**FE:** Khi nhận 502 với `code: "AI_PROVIDER_ERROR"` và message có "404" / "Workflow API", thông báo: "Lỗi kết nối workflow AI (404). Admin kiểm tra workflow ID và cấu hình OpenAI (project, API key)."

**Cách tránh 404 (phía BE):** Bật chạy workflow qua **Agents SDK** thay vì REST. Trong `.env` set:
```env
AI_WF_QGEN_V2_USE_AGENTS_SDK=true
AI_QGEN_AGENTS_MODEL=gpt-4o
```
Khi đó BE không gọi `POST /v1/workflows/.../runs` nữa mà chạy agent trong process (không cần `AI_WF_QGEN_V2_WORKFLOW_ID`).
