# Scopery API Documentation

Tài liệu API cho Frontend. Mọi endpoint dưới `/api/v2` trả về response trực tiếp (không envelope `{ ok, data }`). Lỗi dùng RFC 9457 Problem Details.

## Base URL

```
http://localhost:3000 (hoặc URL của server)
```

## Response Format

- **Success**: Trả về trực tiếp object (ví dụ `{ user, session }`, `{ items, page }`, ...). Không có envelope `{ ok, data }`.
- **Error**: Trả về `application/problem+json` (RFC 9457). Schema: `type`, `title`, `status`, `detail`, `instance` (path request), **`code`** (optional), `errors` (khi validation), `request_id`. Với **business conflict** (409) → luôn có `code` (vd. `ALREADY_SUBMITTED`, `TEMPLATE_NOT_DRAFT`).

Ví dụ lỗi validation (422):

```json
{
  "type": "https://api.scopery.local/problems/validation-error",
  "title": "Validation error",
  "status": 422,
  "detail": "Invalid request body.",
  "instance": "/api/v2/orgs/...",
  "errors": [{ "path": "email", "message": "Invalid email format" }],
  "request_id": "uuid"
}
```

Ví dụ conflict (409, có `code`):

```json
{
  "type": "https://api.scopery.local/problems/conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "Session already submitted.",
  "instance": "/api/v2/orgs/.../sessions/.../submit",
  "code": "ALREADY_SUBMITTED",
  "request_id": "uuid"
}
```

## Authentication

Các endpoint protected yêu cầu:

- **Header**: `Authorization: Bearer <JWT_TOKEN>`

### JWT (dành cho FE)

- **Token dùng trong header**: Luôn dùng **access_token** từ session (ví dụ `session.access_token`), **không** dùng `refresh_token`.
- **Thời hạn**: Supabase mặc định access_token hết hạn sau **1 giờ**. FE nên refresh session trước khi hết hạn, hoặc dùng Supabase client để tự refresh.
- **Sau khi login/Google callback**: Lưu `session.access_token`. Mọi request API gửi kèm `Authorization: Bearer <session.access_token>`.
- **401 "Invalid or expired token"**: Kiểm tra FE gửi đúng `access_token`, đúng header `Bearer <token>`, và token chưa hết hạn.

---

## Mục lục

1. [Health Check](#1-health-check)
2. [Authentication](#2-authentication)
3. [Profile](#3-profile)
4. [Organizations](#4-organizations)
5. [Templates](#5-templates)
6. [Projects](#6-projects)
7. [Sessions](#7-sessions)
8. [Admin (Phase 2)](#8-admin-phase-2)
9. [AI Features](#9-ai-features)
10. [Traceability (Landscape / Scope / Actors / Requirements / Trace)](#10-traceability)
11. [Permissions (matrix)](#11-permissions-matrix)
12. [Error codes & Problem Details](#12-error-codes--problem-details)
13. [Enums](#13-enums)

---

## 1. Health Check

### GET `/api/health`

Kiểm tra trạng thái server và database.

**Response 200:** (không envelope)

```json
{
  "db": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

- `db`: `"ok"` | `"fail"`
- `timestamp`: ISO 8601

---

## 2. Authentication

### POST `/api/v2/auth/login`

Đăng nhập với email/password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200:**

```json
{
  "user": { "id": "uuid", "email": "...", ... },
  "session": { "access_token": "...", "refresh_token": "...", ... }
}
```

### GET `/api/v2/auth/google`

Lấy Google OAuth URL để đăng nhập. Query: `?redirectTo=<url>` (tùy chọn).

**Response 200:**

```json
{
  "url": "https://accounts.google.com/oauth/..."
}
```

### POST `/api/v2/auth/logout`

Đăng xuất (revoke session). Yêu cầu authentication.

**Response 200:**

```json
{
  "message": "Logged out successfully"
}
```

### POST `/api/v2/auth/register`

Đăng ký user mới (email/password).

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```

- `password`: bắt buộc, tối thiểu 8 ký tự.
- `full_name`: bắt buộc, 1–255 ký tự (display name).

**Response 201:**

```json
{
  "user": { "id": "uuid", "email": "...", ... },
  "session": { "access_token": "...", ... },
  "profile": {
    "user_id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "avatar_url": null,
    "role": "user",
    "status": "active",
    "default_org_id": null,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

Profile schema (dùng cho register/login/me): `user_id` là định danh (FK auth.users.id); không trả `id` hay `is_active`. Chỉ `role` (admin | user) và `status` (active | suspended).

### GET `/api/v2/auth/me`

Lấy profile user hiện tại. Yêu cầu authentication.

**Response 200:** Object profile (xem Profile schema).

### PATCH `/api/v2/auth/me`

Cập nhật profile (display_name và/hoặc avatar_url). Yêu cầu authentication.

**Request Body:** Ít nhất một field:

```json
{
  "display_name": "John Doe",
  "avatar_url": "https://..."
}
```

**Response 200:** Object profile cập nhật.

---

## 3. Profile

### GET `/api/v2/profile`

Lấy profile hiện tại. Yêu cầu authentication. Tương đương `GET /api/v2/auth/me`.

**Response 200:**

```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "display_name": "John Doe",
  "avatar_url": "https://...",
  "role": "user",
  "status": "active",
  "default_org_id": null,
  "created_at": "...",
  "updated_at": "..."
}
```

- `user_id`: định danh chính (FK auth.users.id). Không trả field `id`; không trả `is_active`.
- `role`: platform role từ DB — `admin` | `user` (source of truth; không có trong JWT).
- `status`: `active` | `suspended`. Nếu `suspended` → mọi mutation trả 403.

### PATCH `/api/v2/profile`

Cập nhật profile. Yêu cầu authentication. Tương đương `PATCH /api/v2/auth/me`.

**Request Body:**

```json
{
  "display_name": "John Doe",
  "avatar_url": "https://..."
}
```

- Ít nhất một trong hai field phải được cung cấp.

**Response 200:** Object profile cập nhật.

### POST `/api/v2/profile/avatar`

Lấy signed upload URL để upload avatar. Yêu cầu authentication.

**Request Body:**

```json
{
  "file_name": "avatar.jpg",
  "mime_type": "image/jpeg"
}
```

**Response 201:**

```json
{
  "signed_url": "https://storage.supabase.co/...",
  "object_path": "userId/avatar-uuid.jpg",
  "expires_at": "2024-01-01T01:00:00.000Z",
  "public_url": "https://.../storage/v1/object/public/avatars/..."
}
```

Sau khi upload file lên `signed_url`, gọi `PATCH /api/v2/profile` với `avatar_url: public_url` để cập nhật avatar.

---

## 4. Organizations

### GET `/api/v2/orgs`

Liệt kê organizations của user. Yêu cầu authentication.

**Query (pagination):**

- `limit`: số phần tử mỗi trang (mặc định 20, tối đa 100).
- `offset`: vị trí bắt đầu (mặc định 0).

Ví dụ: `?limit=20&offset=0`

**Response 200:**

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "My Org",
      "status": "active",
      "my_role": "owner",
      "my_status": "active",
      "created_at": "..."
    }
  ],
  "page": { "limit": 20, "offset": 0, "total": 1 }
}
```

- `my_role`: quyền của user trong org — `owner` | `member` | `partner` (FE dùng để hiển thị UI).
- `my_status`: trạng thái membership — `active` | `removed`.

### POST `/api/v2/orgs`

Tạo organization mới. Yêu cầu authentication.

**Request Body:**

```json
{
  "name": "My Organization"
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "name": "My Organization",
  "status": "active",
  "created_at": "..."
}
```

### GET `/api/v2/orgs/:orgId`

Lấy chi tiết organization. Yêu cầu authentication và là thành viên của org.

**Response 200:** Object organization (gồm `id`, `name`, `status`, `created_at`, `my_role`, `my_status`).

### PUT `/api/v2/orgs/:orgId/default`

Đặt organization hiện tại làm default của user (`default_org_id` trong profile). Yêu cầu authentication và là thành viên của org.

**Response 200:**

```json
{
  "default_org_id": "uuid"
}
```

### GET `/api/v2/orgs/:orgId/members`

Liệt kê thành viên org. Yêu cầu authentication và là thành viên của org.

**Query:** `limit`, `offset` (mặc định 20, 0).

**Response 200:**

```json
{
  "items": [
    {
      "user_id": "uuid",
      "display_name": "John Doe",
      "email": "user@example.com",
      "role": "owner",
      "status": "active"
    }
  ],
  "page": { "limit": 20, "offset": 0, "total": 1 }
}
```

### Phase 2: Org Invites (owner-only)

#### POST `/api/v2/orgs/:orgId/invites`

Tạo invite. Chỉ **owner** của org.

**Request Body:**

```json
{
  "email": "user@example.com",
  "role": "member"
}
```

- `role`: `member` | `partner`
- Email được chuẩn hóa lowercase.

**Response 201:**

```json
{
  "id": "uuid",
  "org_id": "uuid",
  "email": "user@example.com",
  "role": "member",
  "status": "pending",
  "expires_at": "...",
  "created_at": "..."
}
```

- **Production:** response **không** trả token plaintext (tránh lộ logs/referrer). Gửi email với link hoặc token qua kênh an toàn.
- **Dev/test:** khi `NODE_ENV !== 'production'`:
  - Nếu cấu hình `INVITE_LINK_BASE_URL` (vd. `https://app.scopery.local`): trả thêm **`invite_link`** dạng `https://app.scopery.local/invites/<token>` (path, không dùng query).
  - Nếu không: trả thêm **`invite_token`** (chỉ trong dev) để test accept.
- **Token:** entropy cao, one-time use, có TTL (vd. 7 ngày). DB chỉ lưu **token_hash** (không lưu plaintext).
- Lỗi: `ALREADY_MEMBER`, `INVITE_ALREADY_PENDING` → 409.
- **Rate limit:** nên áp dụng cho POST create invite (chống spam).

#### GET `/api/v2/orgs/:orgId/invites`

Danh sách invites. Chỉ **owner**. Query: `limit`, `offset`.

**Response 200:** `{ "items": [ ... ], "page": { "limit", "offset", "total" } }`

#### POST `/api/v2/orgs/:orgId/invites/:inviteId/revoke`

Thu hồi invite. Chỉ **owner**, chỉ invite **pending**.

**Response 200:** Invite đã cập nhật (không trả token).

#### POST `/api/v2/org-invites/accept`

Chấp nhận invite (token trong body). User đã đăng nhập; email profile phải khớp invite.

**Request Body:**

```json
{
  "token": "plaintext-token"
}
```

**Response 200:**

```json
{
  "org_id": "uuid",
  "member": { "user_id": "uuid", "role": "member", "status": "active" }
}
```

- Lỗi: `INVITE_EXPIRED` (409), `INVITE_EMAIL_MISMATCH` (403), `ALREADY_ACCEPTED` (409).
- `INVITE_INVALID` (409) khi token không tồn tại hoặc invalid (dùng chung 409 để tránh leak thông tin).
- **Rate limit:** backend đã áp dụng (ví dụ 10 lần/5 phút) cho POST accept → 429 `TOO_MANY_REQUESTS`.

### Phase 2: Org Member management (owner-only)

#### PATCH `/api/v2/orgs/:orgId/members/:userId`

Cập nhật role hoặc status thành viên. Chỉ **owner**.

**Request Body:** (một hoặc cả hai)

```json
{ "role": "partner" }
```

hoặc

```json
{ "status": "removed" }
```

- Không được remove owner cuối cùng → 409 `LAST_OWNER`.

#### POST `/api/v2/orgs/:orgId/leave`

Rời org. Nếu là owner cuối cùng → 409 `LAST_OWNER`.

**Response 200:** Member row đã cập nhật (status=removed).

---

## 5. Templates

### GET `/api/v2/templates`

Liệt kê templates. Yêu cầu authentication.

**Query:**

- `status`: `published` | `draft` | `deprecated` (tùy chọn).
- `limit`, `offset`: **hiện tại chưa được backend sử dụng**; response luôn trả `page.limit = 100`, `offset = 0`, `total = items.length`.

**Response 200:**

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Scoping Elicitation",
      "version": "1.0",
      "status": "published",
      "created_at": "..."
    }
  ],
  "page": { "limit": 100, "offset": 0, "total": 1 }
}
```

### GET `/api/v2/templates/:templateId`

Lấy template kèm questions. Yêu cầu authentication.

**Response 200:**

```json
{
  "id": "uuid",
  "name": "...",
  "version": "...",
  "status": "published",
  "created_at": "...",
  "questions": [
    {
      "id": "uuid",
      "template_id": "uuid",
      "section": "overview",
      "tags": ["scope"],
      "q_type": "text",
      "prompt": "...",
      "help_text": null,
      "required": true,
      "answer_schema": {},
      "visibility_logic": null,
      "status": "active",
      "created_at": "..."
    }
  ]
}
```

---

## 6. Projects

Tất cả endpoints projects yêu cầu authentication và quyền truy cập project (qua org membership).

### GET `/api/v2/orgs/:orgId/projects`

Liệt kê projects trong organization.

**Query (pagination):**

- `limit`, `offset`: **hiện tại chưa được backend sử dụng**; response luôn trả `page.limit = 50`, `offset = 0`, `total = items.length`.

**Response 200:**

```json
{
  "items": [
    {
      "id": "uuid",
      "org_id": "uuid",
      "name": "Project A",
      "description": null,
      "status": "active",
      "created_by": "uuid",
      "created_at": "...",
      "my_role": "editor"
    }
  ],
  "page": { "limit": 50, "offset": 0, "total": 1 }
}
```

- `my_role`: quyền của user trong project — `editor` | `viewer` (FE dùng để hiển thị UI). **Org owner bypass:** nếu user là org owner, project list/detail (và mọi endpoint project/session trả payload có my_role) **luôn trả my_role = "editor"** kể cả không có row trong project_members; BE cần implement đúng cho tất cả endpoint liên quan.

### POST `/api/v2/orgs/:orgId/projects`

Tạo project từ template. **Quyền:** **owner** hoặc **member** được tạo; **partner** → 403. Khi tạo thành công: **auto add creator** vào project_members với role **editor** (org owner không cần row nhưng vẫn có effective role editor).

**Request Body:**

```json
{
  "name": "Project A",
  "description": "Optional description",
  "template_id": "uuid"
}
```

- `name`: bắt buộc.
- `template_id`: **bắt buộc** (Phase 1). Template không tồn tại → 404; template tồn tại nhưng `status != published` → 409 (type `template-not-published`).

**Response 201:** Object project.

### GET `/api/v2/orgs/:orgId/projects/:projectId`

Lấy chi tiết project.

**Response 200:** Object project, gồm thêm:

- `my_role`: `editor` | `viewer` (org owner không có row project_members vẫn trả `"editor"`)
- `latest_session_id`: id session mới nhất (null nếu chưa có)
- `active_session_id`: id session đang in_progress (null nếu không có)
- `questions_count`: số câu hỏi (project_questions, status active)
- `answered_count`: số câu **đã trả lời** (chỉ count `answer_status='answered'`, không count skipped/na). Session dùng để đếm: **nếu có `active_session_id`** → đếm theo session đó, **ngược lại** dùng `latest_session_id`. Nếu không có session thì 0.

### GET `/api/v2/orgs/:orgId/projects/:projectId/questions`

Lấy questions của project, nhóm theo section.

**Ordering (Phase 2):**

- **Sections:** sort theo `section` ASC.
- **Trong mỗi section:** sort theo `position` ASC, `created_at` ASC, `id` ASC.

**ProjectQuestion DTO** (mỗi phần tử trong từng section) gồm: `id`, `project_id`, `source`, `system_question_id`, `section`, `tags`, `q_type`, `prompt`, `help_text`, `required`, `answer_schema`, `visibility_logic`, `status`, **`position`** (number), `created_at`.

**Response 200:**

```json
{
  "overview": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "source": "template",
      "system_question_id": "uuid",
      "section": "overview",
      "tags": [],
      "q_type": "text",
      "prompt": "...",
      "help_text": null,
      "required": true,
      "answer_schema": {},
      "visibility_logic": null,
      "status": "active",
      "position": 1000,
      "created_at": "..."
    }
  ],
  "scope": [ ... ]
}
```

### Phase 2: Project members (owner hoặc project editor)

#### GET `/api/v2/orgs/:orgId/projects/:projectId/members`

Liệt kê thành viên project. Query: `limit`, `offset`.

**Response 200:** `{ "items": [ { "user_id", "display_name", "email", "role", "status" } ], "page": { "limit", "offset", "total" } }`

#### POST `/api/v2/orgs/:orgId/projects/:projectId/members`

Thêm thành viên project. Chỉ **org owner** hoặc **project editor**.

- User phải là **org member active** (status = active). Member đã **removed** không add vào project được (422).
- Nếu user đã là project member **active** → 409 **`ALREADY_PROJECT_MEMBER`**.
- Nếu user từng bị remove khỏi project → **re-activate**: cập nhật role + status = active → **200** + trả member updated.
- Tạo mới (chưa từng có row) → **201** + trả member.

**Request Body:** `{ "user_id": "uuid", "role": "editor" | "viewer" }`

**Response 201** (tạo mới): `{ "user_id", "role", "status": "active" }`

**Response 200** (re-activate): `{ "user_id", "role", "status": "active" }`

#### PATCH `/api/v2/orgs/:orgId/projects/:projectId/members/:userId`

Cập nhật role hoặc status. Body: `{ "role": "editor" | "viewer" }` hoặc `{ "status": "removed" }`.

### Phase 2: Project questions (manual; editor-only)

#### POST `/api/v2/orgs/:orgId/projects/:projectId/questions`

Tạo câu hỏi manual. Chỉ **editor**.

**Request Body:** `section`, `tags`, `q_type`, `prompt`, `help_text`, `required`, `answer_schema`, `visibility_logic` (optional).

**Response 201:** ProjectQuestion DTO (source=manual, system_question_id=null), gồm **`position`** (number). Ordering xem mục GET questions.

#### PATCH `/api/v2/orgs/:orgId/projects/:projectId/questions/:questionId`

Sửa câu hỏi. Chỉ **manual**; câu từ template → 409 `TEMPLATE_QUESTION_IMMUTABLE`.

#### POST `/api/v2/orgs/:orgId/projects/:projectId/questions/reorder`

Sắp xếp lại thứ tự **trong một section** (Option A).

**Request Body:** `{ "section": "overview", "ordered_ids": ["q1","q2","q3"] }`

- **section:** section cần reorder.
- **ordered_ids:** thứ tự mới; **tất cả id phải thuộc project và đúng section đó**, status active. Số phần tử phải bằng đúng số question trong section (không thiếu, không thừa).

#### DELETE `/api/v2/orgs/:orgId/projects/:projectId/questions/:questionId`

Archive câu hỏi (soft delete). Chỉ **editor**.

---

## 7. Sessions

Elicitation sessions và answers. Yêu cầu authentication và quyền truy cập project.

### GET `/api/v2/orgs/:orgId/projects/:projectId/sessions`

Liệt kê sessions của project (để FE làm dashboard, quay lại session cũ).

**Query (pagination):**

- `limit`: mặc định 20, tối đa 100.
- `offset`: mặc định 0.

**Response 200:**

```json
{
  "items": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "name": "Session 1",
      "status": "in_progress",
      "created_by": "uuid",
      "created_at": "...",
      "submitted_at": null
    }
  ],
  "page": { "limit": 20, "offset": 0, "total": 1 }
}
```

### POST `/api/v2/orgs/:orgId/projects/:projectId/sessions`

Tạo elicitation session. **Quyền:** **project editor** hoặc **org owner**; viewer/partner → 403. **Response:** luôn **201** (kể cả khi org owner tạo mà không có row project_members — BE không yêu cầu row).

**Request Body:**

```json
{
  "name": "Session 1"
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "project_id": "uuid",
  "name": "Session 1",
  "status": "in_progress",
  "created_by": "uuid",
  "created_at": "...",
  "submitted_at": null
}
```

### GET `/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId`

Lấy session kèm **questions** (ProjectQuestion DTO đầy đủ, gồm **position**) và **answers**. `answers[].question_id` map vào `questions[].id`.

**Ordering questions (đồng bộ với GET /questions):** section ASC, **position** ASC, created_at ASC, id ASC.

**Response 200:**

```json
{
  "id": "uuid",
  "project_id": "uuid",
  "name": "Session 1",
  "status": "in_progress",
  "created_by": "uuid",
  "created_at": "...",
  "submitted_at": null,
  "questions": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "source": "template",
      "system_question_id": "uuid",
      "section": "overview",
      "tags": [],
      "q_type": "text",
      "prompt": "...",
      "help_text": null,
      "required": true,
      "answer_schema": {},
      "visibility_logic": null,
      "status": "active",
      "position": 1000,
      "created_at": "..."
    }
  ],
  "answers": [
    {
      "session_id": "uuid",
      "question_id": "uuid",
      "answer_status": "answered",
      "value": { ... },
      "skip_reason": null,
      "answered_by": "uuid",
      "answered_at": "..."
    }
  ]
}
```

### PUT `/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/answers`

Cập nhật answers (upsert). Chỉ **editor** được gọi; **viewer** → 403. Session phải ở trạng thái `in_progress`; nếu submitted/locked → 409 `type: /problems/session-locked`. Response trả lại mảng `answers` vừa upsert.

**Request Body:**

```json
{
  "answers": [
    {
      "question_id": "uuid",
      "answer_status": "answered",
      "value": { "text": "My answer" },
      "skip_reason": null
    },
    {
      "question_id": "uuid",
      "answer_status": "skipped",
      "value": null,
      "skip_reason": "Not applicable"
    }
  ]
}
```

- `answer_status`: `answered` | `skipped` | `na`
- Khi `answer_status = answered`, `value` phải hợp với `answer_schema` của question.

**Response 200:** Trả về các answers đã upsert (để FE cập nhật state, không cần GET session lại):

```json
{
  "answers": [
    {
      "session_id": "uuid",
      "question_id": "uuid",
      "answer_status": "answered",
      "value": { "text": "My answer" },
      "skip_reason": null,
      "answered_by": "uuid",
      "answered_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST `/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/submit`

Nộp session (chuyển trạng thái sang `submitted`). Chỉ **editor** được gọi; **viewer** → 403. Không thể sửa answers sau khi submit. **Submit lần 2** → 409 `type: /problems/conflict`, `code: ALREADY_SUBMITTED`.

**Response 200:** Object session (status = `submitted`).

### Phase 2: Lock / Reopen / Progress

**Session state machine (chốt):**

| Từ trạng thái           | Hành động   | Sang trạng thái | Ai được gọi       |
| ----------------------- | ----------- | --------------- | ----------------- |
| `in_progress`           | POST submit | `submitted`     | editor            |
| `in_progress`           | POST lock   | `locked`        | editor hoặc owner |
| `submitted`             | POST lock   | `locked`        | editor hoặc owner |
| `locked` \| `submitted` | POST reopen | `in_progress`   | **chỉ org owner** |

- **PUT answers** chỉ cho phép khi session **in_progress**; nếu submitted/locked → 409 `session-locked`.

#### POST `/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/lock`

Khóa session. Chỉ **editor** hoặc **owner**. Cho phép gọi khi session `in_progress` hoặc `submitted`. **Response 200:** Session (status=locked).

#### POST `/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/reopen`

Mở lại session (submitted/locked → in_progress). Chỉ **org owner**.

#### GET `/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/progress`

**Response 200:** `{ "total", "answered", "skipped", "na", "required_missing" }`

- **required_missing** = số câu **required** (question.required = true) mà chưa được trả lời: `answer_status != 'answered'` (bao gồm: chưa có row answer, hoặc skipped/na).

- PUT answers khi session không in_progress → 409 type `session-locked`.

### AI Clarity (Phase: Assessment)

Workflow "Answer Clarity Assessment" được tạo trong OpenAI Agent Builder và export vào code; BE gọi qua workflow runner. Output contract được validate bằng Zod (schema cố định). Kết quả assessment lưu vào `session_answer_clarity` (dedup theo `session_id` + `input_hash`).

**Quyền:** Assess-one yêu cầu **project editor** (viewer → 403). Summary cho phép **viewer** (read-only).

**ENV:** `AI_WF_ANSWER_CLARITY_ENABLED=true|false` (feature flag). Nếu `false`, assess-one trả 409 `AI_FEATURE_DISABLED`.

#### POST `/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/ai/clarity/assess-one`

Đánh giá độ rõ của **một** cặp câu hỏi / câu trả lời. Chỉ **editor** được gọi.

**Request Body (422 nếu thiếu/sai):**

```json
{
  "question_order": 12,
  "section": "scope",
  "question_text": "Mục tiêu dự án là gì?",
  "answer_text": "Tự động hóa quy trình duyệt.",
  "q_type": "textarea",
  "required": true
}
```

- `section`: ví dụ `scope`, `process`, `data`, `integration`, `security`, `nfr`, …
- `q_type`: theo **QuestionType** — `text` | `textarea` | `number` | `boolean` | `date` | `single_select` | `multi_select` | `json` (nullable).
- `required`: boolean.

**Response 200:** (trả trực tiếp, không envelope)

```json
{
  "question_order": 12,
  "assessment": {
    "clarity_score": 0.75,
    "clarity_label": "clear",
    "ambiguity_tags": [],
    "missing_fields": [],
    "answer_guidance": [],
    "suggested_answer_template": null,
    "follow_up_questions": []
  }
}
```

**Lỗi:**

- **409** `AI_FEATURE_DISABLED` — Feature flag tắt.
- **502** `AI_OUTPUT_NOT_JSON` — Workflow trả output không phải JSON hợp lệ.
- **502** `AI_OUTPUT_SCHEMA_MISMATCH` — JSON không khớp schema (Zod).
- **502** `AI_PROVIDER_ERROR` — Lỗi provider (OpenAI); chi tiết bị mask ở production.

#### GET `/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/ai/clarity/summary`

Điểm độ rõ / readiness của toàn session (project readiness). **Viewer** có thể xem; không cần chạy AI.

**Response 200:**

```json
{
  "coverage_score": 0.88,
  "clarity_score": 0.71,
  "preparation_score": 0.76,
  "requirements_coverage": {
    "business": { "answered_required_ratio": 0.9, "avg_clarity": 0.72, "count": 10 },
    "stakeholder": { "answered_required_ratio": 1, "avg_clarity": 0.8, "count": 5 },
    "functional": { "answered_required_ratio": 0.85, "avg_clarity": 0.68, "count": 20 },
    "nfr": { "answered_required_ratio": 0.7, "avg_clarity": 0.65, "count": 15 },
    "transition": { "answered_required_ratio": 0.8, "avg_clarity": 0.7, "count": 10 }
  },
  "hidden_aspects_score": 0.55,
  "overall_readiness": 0.74,
  "readiness_label": "draft_ok_need_clarify",
  "top_blockers": [{ "section": "nfr", "reason": "missing_metrics", "question_orders": [41, 42] }],
  "suggested_fixes": [
    {
      "question_order": 41,
      "answer_guidance": ["Thêm metric cụ thể (vd. thời gian phản hồi < 200ms)."],
      "suggested_answer_template": null
    }
  ],
  "recommended_next_action": "run_assessments",
  "stats": {
    "total_questions": 120,
    "required_total": 60,
    "required_answered": 53,
    "assessed_count": 40,
    "missing_assessments": 13
  }
}
```

- `readiness_label`: `not_ready` (<0.60), `draft_ok_need_clarify` (0.60–0.80), `ready` (>0.80).
- Nếu thiếu assessment cho câu required đã trả lời → `recommended_next_action` có thể `"run_assessments"`.

### POST `/api/v2/orgs/:orgId/projects/:projectId/sessions/from-revision`

Tạo elicitation session mới từ một revision (sao chép answers từ revision vào session). **Quyền:** **editor** hoặc **owner**.

**Request Body:**

```json
{
  "name": "Session from import",
  "revision_id": "uuid"
}
```

**Response 201:**

```json
{
  "session": {
    "id": "uuid",
    "project_id": "uuid",
    "name": "Session from import",
    "status": "in_progress",
    "created_by": "uuid",
    "created_at": "...",
    "submitted_at": null
  },
  "prefilled_count": 42
}
```

- `prefilled_count`: số câu trả lời đã copy từ revision vào session.

---

## 8. Admin (Phase 2)

Tất cả endpoint dưới `/api/v2/admin` yêu cầu **profiles.role = admin** (403 nếu user thường). Template đã published không sửa trực tiếp; dùng duplicate để tạo bản mới.

| Method | Path                                            | Mô tả                            | Body                                                                                             | Response                                                       | Status |
| ------ | ----------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ------ |
| POST   | `/api/v2/admin/templates`                       | Tạo template draft               | `{ "name", "version?" }`                                                                         | Template object (id, name, version, status: draft, created_at) | 201    |
| PATCH  | `/api/v2/admin/templates/:templateId`           | Sửa draft (name, version)        | `{ "name?", "version?" }`                                                                        | Template object                                                | 200    |
| POST   | `/api/v2/admin/templates/:templateId/questions` | Thêm câu hỏi                     | section, tags, q_type, prompt, help_text?, required, answer_schema, visibility_logic?, position? | SystemQuestion object                                          | 201    |
| PATCH  | `/api/v2/admin/questions/:questionId`           | Sửa câu hỏi (chỉ template draft) | Các field cần sửa                                                                                | SystemQuestion object                                          | 200    |
| POST   | `/api/v2/admin/templates/:templateId/publish`   | Publish (cần ≥1 question active) | —                                                                                                | Template object (status: published)                            | 200    |
| POST   | `/api/v2/admin/templates/:templateId/duplicate` | Clone thành draft mới            | —                                                                                                | Template object (id mới, status: draft)                        | 201    |

- Lỗi **business state** (409): template không phải draft khi edit/publish → **409** (code `TEMPLATE_NOT_DRAFT`); publish khi chưa có question active → **409** (code `TEMPLATE_NO_ACTIVE_QUESTIONS`). User thường gọi bất kỳ endpoint admin → **403**. (422 chỉ dành cho validation format/body/query.)

---

## 9. AI Features

Tất cả endpoint AI dưới đây nằm trong scope **org/project**, yêu cầu authentication và quyền **editor** hoặc **owner** (project/org). Response thành công trả trực tiếp object (không envelope); lỗi dùng RFC 9457.

**AI Features error codes (chuẩn hoá — FE nên check `code`):**

| Status | Code                        | Ý nghĩa                                                                                 |
| ------ | --------------------------- | --------------------------------------------------------------------------------------- |
| 409    | `AI_BATCH_EXPIRED`          | Batch proposal (improve / questions / impact) đã hết hạn hoặc đã commit                 |
| 409    | `AI_FEATURE_DISABLED`       | Feature bị tắt (vd. QGen v2, Answer Clarity) — feature flag off                         |
| 409    | `AI_WORKFLOW_ID_REQUIRED`   | QGen v2 bật nhưng chưa cấu hình `AI_WF_QGEN_V2_WORKFLOW_ID` (workflow cho tạo question) |
| 413    | `PAYLOAD_TOO_LARGE`         | File QA pack vượt giới hạn (`AI_QGEN_FILE_MAX_BYTES`)                                   |
| 502    | `AI_BAD_OUTPUT`             | AI trả về output không hợp lệ (sau retry) — type `ai-bad-output`                        |
| 502    | `AI_OUTPUT_NOT_JSON`        | Workflow trả finalOutput không phải JSON hợp lệ                                         |
| 502    | `AI_OUTPUT_SCHEMA_MISMATCH` | JSON output không khớp schema Zod                                                       |
| 502    | `AI_PROVIDER_ERROR`         | Lỗi provider (OpenAI); chi tiết bị mask ở production                                    |

### 9.1. Improve Answer

Gợi ý cải thiện câu trả lời cho một question trong session. Session phải **in_progress**; nếu submitted/locked → 409 `SESSION_LOCKED`.

#### POST `/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/ai/improve`

**Request Body:**

```json
{
  "question_id": "uuid",
  "current_value": { "text": "..." },
  "user_instruction": "Make it more concise"
}
```

- `current_value`: bắt buộc (có thể null/empty object nếu chưa có answer).
- `user_instruction`: tùy chọn, tối đa 4000 ký tự.

**Response 200:** Trả về proposal (AI gợi ý) và **batch_token** để commit sau:

```json
{
  "batch_token": "string",
  "proposed_value": { ... },
  "run_id": "uuid"
}
```

- Client lưu `batch_token`; dùng cho commit trong thời gian TTL (Redis).

#### POST `/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/ai/improve/commit`

**Request Body:**

```json
{
  "batch_token": "string",
  "action": "accept",
  "final_value": { "text": "..." }
}
```

- `action`: `accept` | `reject`.
- `final_value`: bắt buộc khi `action = accept` (phải hợp với `answer_schema` của question). Có thể dùng giá trị từ improve response hoặc chỉnh sửa.

**Response 200:** Xác nhận đã commit (reject: xóa proposal; accept: ghi vào `elicitation_answers`, xóa proposal).

- Nếu `batch_token` hết hạn hoặc đã dùng → **409** `AI_BATCH_EXPIRED`.

---

### 9.2. Generate Clarifying Questions

AI sinh câu hỏi làm rõ (project_questions, source=ai). **Quyền:** editor/owner.

**→ Doc tích hợp chi tiết cho FE (URL, body, lỗi thường gặp, flow):** [FE_INTEGRATION_AI_QUESTIONS.md](./FE_INTEGRATION_AI_QUESTIONS.md)

#### POST `/api/v2/orgs/:orgId/projects/:projectId/ai/questions/generate`

**Request Body:**

```json
{
  "engine": "legacy",
  "base_session_id": "uuid",
  "base_revision_id": "uuid",
  "instruction": "Focus on scope and risks",
  "max_items": 30,
  "use_cached_digest": true
}
```

- **engine** (optional): xem enum **AiQuestionsGenerateEngine**. Default: nếu `AI_WF_QGEN_V2_ENABLED=true` thì `"agentkit_v2_file"`, ngược lại `"legacy"`.
- **base_session_id** (optional): session dùng làm context Q/A. **V2:** bắt buộc (BE build QA pack từ session). **Legacy:** tùy chọn (có thể dùng `base_revision_id` thay).
- **base_revision_id**: **legacy only** (v2 ignore).
- **instruction** (optional): tối đa 4000 ký tự.
- **max_items** (optional): giới hạn số câu hỏi sinh ra (cap bởi `AI_QGEN_MAX_ITEMS`).
- **use_cached_digest**: **v2 only** (legacy ignore). Optional, default `true`; khi bật, lần chạy sau có thể dùng digest cache (nếu có `session_context_digest`).

**Validation (422):**

- Nếu **engine = `agentkit_v2_file`**: bắt buộc có **base_session_id** (BE build QA pack từ session). Không có → **422** (errors path `base_session_id`).
- Nếu **engine = `legacy`**: cần ít nhất một trong **base_session_id** hoặc **base_revision_id**. Không có cả hai → **422** (errors path `base_session_id` / `base_revision_id`).

**QA pack (v2):** QA pack file được server build từ session và attach vào workflow run; **client/FE không upload file nào** trong endpoint này.

**Errors:**

- **409** `AI_FEATURE_DISABLED` — Khi `engine=agentkit_v2_file` nhưng feature tắt (`AI_WF_QGEN_V2_ENABLED=false`).
- **409** `AI_WORKFLOW_ID_REQUIRED` — QGen v2 bật nhưng env chưa có `AI_WF_QGEN_V2_WORKFLOW_ID` (workflow cho tạo question phải gọi đúng theo category).
- **413** `PAYLOAD_TOO_LARGE` — Kích thước QA pack vượt `AI_QGEN_FILE_MAX_BYTES` (sau khi đã truncate nếu có).
- **502** `AI_OUTPUT_NOT_JSON` / `AI_OUTPUT_SCHEMA_MISMATCH` / `AI_PROVIDER_ERROR` — Workflow trả về output không hợp lệ hoặc lỗi provider.

**Response 200:**

```json
{
  "batch_token": "string",
  "items": [
    {
      "temp_id": "uuid",
      "section": "overview",
      "tags": ["scope"],
      "q_type": "textarea",
      "prompt": "...",
      "help_text": null,
      "required": false,
      "answer_schema": {}
    }
  ],
  "payload_sent": { ... }
}
```

- Mỗi item có **temp_id** (UUID do server gán) dùng khi commit hoặc edit.
- **payload_sent** (tạm thời): object mà BE gửi cho workflow; dùng để debug. FE có thể bỏ qua khi render.

**Security note (v2 engine):** QA pack file gửi cho workflow chỉ dùng trong run, không lưu DB; không dùng vector store; không log raw QA hay token trong ai_runs (chỉ meta audit). QA pack file được server build từ session và attach vào workflow run; client/FE không upload file nào trong endpoint này.

#### POST `/api/v2/orgs/:orgId/projects/:projectId/ai/questions/commit`

**Request Body:**

```json
{
  "batch_token": "string",
  "accepted_temp_ids": ["uuid", "uuid"],
  "edits": [
    {
      "temp_id": "uuid",
      "patch": {
        "section": "scope",
        "prompt": "...",
        "required": true
      }
    }
  ]
}
```

- `accepted_temp_ids`: danh sách temp_id được chấp nhận (sẽ insert vào `project_questions`, source=ai).
- `edits`: tùy chọn; áp dụng patch lên item trước khi insert (chỉ với item nằm trong accepted_temp_ids).

**Response 200:** Xác nhận đã tạo questions (số lượng, ids, v.v. tùy implementation).

- Batch hết hạn hoặc đã commit → **409** `AI_BATCH_EXPIRED`.

---

### 9.3. Intake (Notes / Paste Text)

Dùng cho luồng impact analysis: tạo intake từ text dán hoặc file upload.

#### POST `/api/v2/orgs/:orgId/projects/:projectId/ai/intakes/upload-url`

Lấy signed URL để upload file (bucket notes). **Quyền:** editor/owner.

**Request Body:**

```json
{
  "file_name": "notes.txt",
  "mime_type": "text/plain"
}
```

**Response 201:**

```json
{
  "upload_url": "https://...",
  "file_id": "uuid",
  "expires_at": "..."
}
```

- Client PUT file lên `upload_url`, sau đó gọi POST intakes với `file_id`.

#### POST `/api/v2/orgs/:orgId/projects/:projectId/ai/intakes`

Tạo change intake (paste text hoặc từ file đã upload).

**Request Body:** Đúng một trong hai:

```json
{
  "raw_text": "Pasted text here..."
}
```

hoặc

```json
{
  "file_id": "uuid"
}
```

**Response 201:** Object intake (id, type: `paste_text` | `note_upload`, v.v.).

---

### 9.4. Impact Analysis

Phân tích tác động từ intake lên baseline (session hoặc revision). Tạo proposals; client commit với decisions (accept/reject từng question).

#### POST `/api/v2/orgs/:orgId/projects/:projectId/ai/impact-analysis`

**Request Body:**

```json
{
  "base": {
    "session_id": "uuid",
    "revision_id": "uuid"
  },
  "intake": {
    "intake_id": "uuid"
  }
}
```

- **base:** ít nhất một trong `session_id` hoặc `revision_id` (baseline answers).
- **intake:** `intake_id` (từ POST intakes hoặc upload).

**Response 200:**

```json
{
  "batch_token": "string",
  "note_summary": "string (optional)",
  "proposals": [
    {
      "question_id": "uuid",
      "proposed_value": { "text": "..." },
      "reason": "Lý do AI đưa ra...",
      "reference_from_note": "Đoạn trích từ note liên quan đến câu trả lời này."
    }
  ]
}
```

- **batch_token:** Lưu để gửi lên commit trong thời gian TTL (Redis).
- **proposals[].reason:** Lý do AI đưa ra cho đề xuất.
- **proposals[].reference_from_note:** Đoạn trích từ note (intake) liên quan trực tiếp đến câu trả lời đề xuất; có thể thiếu nếu AI không có excerpt phù hợp.
- Kích thước note (raw/file) bị giới hạn bởi env `AI_MAX_NOTE_BYTES`.
- Nếu AI trả output không hợp lệ → **502** `AI_BAD_OUTPUT`.

#### POST `/api/v2/orgs/:orgId/projects/:projectId/ai/impact-analysis/commit`

**Request Body:**

```json
{
  "batch_token": "string",
  "base": { "session_id": "uuid" },
  "intake_id": "uuid",
  "decisions": [
    {
      "question_id": "uuid",
      "action": "accept",
      "final_value": { ... }
    },
    {
      "question_id": "uuid",
      "action": "reject"
    }
  ]
}
```

- `decisions`: ít nhất một phần tử; `final_value` bắt buộc khi `action = accept`.
- Tạo **answer_revisions** (reason `note_import`), cập nhật **answer_revision_items** theo decisions, xóa batch.

- Batch hết hạn hoặc đã commit → **409** `AI_BATCH_EXPIRED`.

---

## 10. Traceability (Landscape / Scope / Actors / Requirements / Trace)

Các API traceability: org landscape (nodes, node-links), project scope, org actors, requirements (BO/BR/FR/NFR), requirement_actors, requirement_module_map, trace view. Yêu cầu auth; org owner mới tạo/sửa nodes, node-links, actors; project editor/owner mới tạo/sửa scope, requirements.

### 10.1 Org Landscape (org_nodes)

| Method | Path                                     | Mô tả                                                      |
| ------ | ---------------------------------------- | ---------------------------------------------------------- |
| GET    | `/api/v2/orgs/:orgId/nodes`              | List nodes (query: `type`, `status`)                       |
| POST   | `/api/v2/orgs/:orgId/nodes`              | Tạo node (owner only)                                      |
| PATCH  | `/api/v2/orgs/:orgId/nodes/:nodeId`      | Cập nhật node (owner only)                                 |
| DELETE | `/api/v2/orgs/:orgId/nodes/:nodeId`      | Archive node (owner only; 409 nếu có children hoặc in use) |
| GET    | `/api/v2/orgs/:orgId/node-links`         | List links giữa nodes                                      |
| POST   | `/api/v2/orgs/:orgId/node-links`         | Tạo link (owner only)                                      |
| PATCH  | `/api/v2/orgs/:orgId/node-links/:linkId` | Sửa link (owner only): `link_type?`, `note?`               |
| DELETE | `/api/v2/orgs/:orgId/node-links/:linkId` | Xóa link (owner only)                                      |

**Node types:** `system`, `subsystem`, `module`. **Status:** `active`, `archived`. **Link types:** `integrates_with`, `shares_data_with`, `depends_on`, `relates_to`.

**Node link (response / PATCH body):** Có thể có `note` (string | null). PATCH body: `{ "link_type"?: "integrates_with"|..., "note"?: string | null }`. Chỉ org owner được PATCH.

**409 codes:** `NODE_CODE_EXISTS`, `NODE_HAS_CHILDREN`, `NODE_IN_USE`, `LINK_EXISTS`, `FORBIDDEN_BY_POLICY`.

### 10.2 Project Scope (project_scopes)

| Method | Path                                            | Mô tả                            |
| ------ | ----------------------------------------------- | -------------------------------- |
| GET    | `/api/v2/orgs/:orgId/projects/:projectId/scope` | Lấy scope hiện tại               |
| PUT    | `/api/v2/orgs/:orgId/projects/:projectId/scope` | Replace-all scope (editor/owner) |

**Body (PUT):** `{ "items": [{ "org_node_id": "uuid", "scope_role": "primary" | "impacted" | "out_of_scope" }] }`.

**409:** `SCOPE_NODE_WRONG_ORG` — một số node không thuộc org của project.

### 10.3 Org Actors (org_actors)

| Method | Path                                  | Mô tả                                                 |
| ------ | ------------------------------------- | ----------------------------------------------------- |
| GET    | `/api/v2/orgs/:orgId/actors`          | List actors (query: `limit`, `offset`, `active_only`) |
| POST   | `/api/v2/orgs/:orgId/actors`          | Tạo actor (owner only)                                |
| PATCH  | `/api/v2/orgs/:orgId/actors/:actorId` | Cập nhật actor (owner only)                           |

**Actor kinds:** `persona`, `system`, `team`, `external`. **409:** `ACTOR_KEY_EXISTS`, `FORBIDDEN_BY_POLICY`.

### 10.4 Requirements

| Method | Path                                                                  | Mô tả                          |
| ------ | --------------------------------------------------------------------- | ------------------------------ |
| GET    | `/api/v2/orgs/:orgId/projects/:projectId/requirements`                | List requirements              |
| POST   | `/api/v2/orgs/:orgId/projects/:projectId/requirements`                | Tạo requirement (editor/owner) |
| PATCH  | `/api/v2/orgs/:orgId/projects/:projectId/requirements/:requirementId` | Cập nhật requirement           |
| PUT    | `.../requirements/:requirementId/actors`                              | Replace requirement_actors     |
| PUT    | `.../requirements/:requirementId/modules`                             | Replace requirement_module_map |

**Types:** `BO`, `BR`, `FR`, `NFR`. Hierarchy: BO (no parent) → BR → FR; NFR parent phải là BO hoặc BR.

**422:** hierarchy invalid (vd. `FR parent must be BR`). **409:** `REQ_CODE_EXISTS`.

### 10.5 Trace View

| Method | Path                                            | Mô tả               |
| ------ | ----------------------------------------------- | ------------------- |
| GET    | `/api/v2/orgs/:orgId/projects/:projectId/trace` | Lấy full trace view |

**Response:**

```json
{
  "landscape": { "nodes": [], "links": [] },
  "project_scope": [],
  "catalog": {
    "requirements": [],
    "actors": [],
    "requirement_actors": [],
    "requirement_modules": []
  },
  "trace_links": []
}
```

### 10.6 Trace Links (CRUD)

Liên kết trace giữa requirement và org_node (vd. requirement “implements” org_node). Editor/owner project được tạo/sửa/xóa.

| Method | Path                                                  | Mô tả                                          |
| ------ | ----------------------------------------------------- | ---------------------------------------------- |
| GET    | `/api/v2/orgs/:orgId/projects/:projectId/trace-links` | List trace links                               |
| POST   | `/api/v2/orgs/:orgId/projects/:projectId/trace-links` | Tạo trace link (editor/owner)                  |
| PATCH  | `.../trace-links/:linkId`                             | Sửa link (editor/owner): `link_type?`, `note?` |
| DELETE | `.../trace-links/:linkId`                             | Xóa link (editor/owner)                        |

**Create body:**

```json
{
  "from_type": "requirement",
  "from_id": "uuid",
  "to_type": "org_node",
  "to_id": "uuid",
  "link_type": "implements",
  "note": "optional",
  "project_id": null
}
```

- `from_type`, `to_type`: `requirement` | `org_node`.
- `from_id`, `to_id`: UUID tương ứng (requirement id hoặc org_node id).
- `link_type`: vd. `implements`, `satisfies`, `relates_to`, `traces_to`.
- `note`: optional. `project_id`: optional, null = org-level link.

**Patch body:** `{ "link_type"?: string, "note"?: string | null }`.

**409:** `TRACE_LINK_EXISTS` — link trùng (cùng from/to) đã tồn tại.

---

## 11. Permissions (matrix)

BE enforce đúng matrix dưới đây; FE nên disable nút/action theo role để UX rõ ràng.

**AI endpoints:** Chỉ **editor** hoặc **owner** (project/org) được gọi. Improve answer thêm ràng buộc session **in_progress** (submitted/locked → 409 SESSION_LOCKED).

**Org member**

| Role    | Quyền                                                                                                                                                                                         |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| owner   | **Super quyền trong org:** có thể manage mọi project/session trong org **không cần** có row trong project_members (vd. lock session, add project member). Invite/member management chỉ owner. |
| member  | Truy cập tài nguyên org; **được tạo project** (POST /orgs/:orgId/projects); khi tạo project được auto add vào project_members role editor; có thể tạo session nếu là project editor.          |
| partner | **Chỉ đọc org:** không được thực hiện mutation.                                                                                                                                               |

**Partner readonly — org role `partner` không được gọi:**

- POST `/orgs/:orgId/projects` (tạo project)
- POST `.../sessions` (tạo session)
- PUT `.../sessions/:sessionId/answers`
- POST `.../sessions/:sessionId/submit`, `/lock`, `/reopen`
- Mọi invite/member management (invites, PATCH member, leave)
- Thêm/sửa project members, questions (create/reorder/archive)

→ Gọi các endpoint trên với role partner → **403** Forbidden.

**Project member**

| Role   | Quyền                                                                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| viewer | Chỉ GET (readonly): list/chi tiết project, sessions, questions, answers. **Không** được PUT answers, **không** được POST submit/lock. |
| editor | GET + **PUT answers** + **POST submit** + **lock** (org owner có thể **reopen**).                                                     |

**Profile**

- Nếu `profile.status = 'suspended'` → mọi mutation trả **403** (BE đã enforce qua middleware).

**IDOR / cross-check (bắt buộc):**

- Mọi endpoint có nhiều id (orgId, projectId, sessionId) đều kiểm tra: `project.org_id === orgId`, `session.project_id === projectId`, user là member active của org. **Sai quan hệ → 404** (không trả 403 để tránh leak tồn tại).

**Error khi vi phạm**

- Viewer gọi PUT answers hoặc POST submit/lock → **403** Forbidden.
- Partner gọi bất kỳ mutation ở trên → **403** Forbidden.

---

## 12. Error codes & Problem Details

Tất cả lỗi trả `application/problem+json` với: `type`, `title`, `status`, `detail`, `instance`, **`code`** (optional), `request_id`; validation thêm `errors[]`. **Conflict (409)** luôn có `code` để FE phân biệt (vd. `ALREADY_SUBMITTED`, `TEMPLATE_NOT_DRAFT`). **Các case có type riêng** (session-locked, template-not-published, invite-expired, invite-invalid, …) vẫn luôn có `code`; **FE nên ưu tiên check `code`** để xử lý, `type` dùng cho logging/diagnostic.

**Status code rules:**

| Status | Ý nghĩa                                                                        |
| ------ | ------------------------------------------------------------------------------ |
| 401    | Thiếu / invalid / expired token                                                |
| 403    | Không đủ quyền (không là member, requireAdmin, account suspended…)             |
| 404    | Org / project / session / template không tồn tại (hoặc không thuộc org)        |
| 409    | Conflict business state (session locked, submit lần 2, template not published) |
| 413    | Payload too large (file QA pack vượt giới hạn)                                 |
| 429    | Rate limit (invite accept quá tần suất, v.v.)                                  |
| 422    | Validation body/query (kèm `errors[]`)                                         |
| 502    | AI / workflow output invalid hoặc provider error                               |

**Phase 2 error types / codes:**

- `https://api.scopery.local/problems/invite-expired` — code `INVITE_EXPIRED`
- `https://api.scopery.local/problems/invite-invalid` — **409**, code `INVITE_INVALID` (token không tồn tại hoặc invalid). Luôn dùng 409 để FE xử lý thống nhất; **không trả 404** (tránh leak thông tin tồn tại invite).
- `https://api.scopery.local/problems/invite-email-mismatch` — 403, code `INVITE_EMAIL_MISMATCH`
- `https://api.scopery.local/problems/already-member` — 409, code `ALREADY_MEMBER`
- `https://api.scopery.local/problems/last-owner` — 409, code `LAST_OWNER`
- `https://api.scopery.local/problems/template-question-immutable` — 409, code `TEMPLATE_QUESTION_IMMUTABLE`
- `https://api.scopery.local/problems/session-locked` — 409, code `SESSION_LOCKED`
- `https://api.scopery.local/problems/conflict` — code có thể: `ALREADY_ACCEPTED`, `INVITE_ALREADY_PENDING`, `ALREADY_SUBMITTED`, `ALREADY_PROJECT_MEMBER`, `TEMPLATE_NOT_DRAFT`, `TEMPLATE_NO_ACTIVE_QUESTIONS`, **`NODE_CODE_EXISTS`**, **`NODE_HAS_CHILDREN`**, **`NODE_IN_USE`**, **`SCOPE_NODE_WRONG_ORG`**, **`REQ_CODE_EXISTS`**, **`LINK_EXISTS`**, **`FORBIDDEN_BY_POLICY`**, **`ACTOR_KEY_EXISTS`**, **`TRACE_LINK_EXISTS`**
- `https://api.scopery.local/problems/too-many-requests` — 429, code `TOO_MANY_REQUESTS` (rate limit)

**AI (Phase 2):**

- **409** `AI_BATCH_EXPIRED` — Batch proposal (improve / generate questions / impact analysis) đã hết hạn hoặc đã commit. Client cần tạo batch mới.
- **409** `AI_FEATURE_DISABLED` — Answer clarity assessment bị tắt (feature flag `AI_WF_ANSWER_CLARITY_ENABLED=false`).
- **502** `AI_BAD_OUTPUT` — type `ai-bad-output` — AI trả về output không hợp lệ sau retry (validation answer_schema / generate_questions format).
- **502** `AI_OUTPUT_NOT_JSON` — type `ai-bad-output` — Workflow Answer Clarity trả finalOutput không phải JSON hợp lệ.
- **502** `AI_OUTPUT_SCHEMA_MISMATCH` — type `ai-bad-output` — JSON output không khớp schema Zod (single answer clarity).
- **502** `AI_PROVIDER_ERROR` — Lỗi provider (OpenAI); chi tiết bị mask ở production.

**Error type URIs (chuẩn hoá — luôn absolute):**

- `https://api.scopery.local/problems/validation-error`
- `https://api.scopery.local/problems/unauthorized`
- `https://api.scopery.local/problems/forbidden`
- `https://api.scopery.local/problems/not-found`
- `https://api.scopery.local/problems/conflict` — ví dụ: POST submit lần 2 (code `ALREADY_SUBMITTED`), add project member trùng (code `ALREADY_PROJECT_MEMBER`)
- `https://api.scopery.local/problems/session-locked` — PUT answers khi session đã submitted/locked
- `https://api.scopery.local/problems/template-not-published` — tạo project với template chưa published
- `https://api.scopery.local/problems/ai-bad-output` — 502, code `AI_BAD_OUTPUT` | `AI_OUTPUT_NOT_JSON` | `AI_OUTPUT_SCHEMA_MISMATCH`
- `https://api.scopery.local/problems/ai-provider-error` — 502, code `AI_PROVIDER_ERROR`
- `https://api.scopery.local/problems/payload-too-large` — 413, code `PAYLOAD_TOO_LARGE`

---

## 13. Enums

Danh sách enum dùng trong API (để FE generate types). Naming thống nhất theo Phase 1 + Phase 2.

| Enum                          | Values                                                                                                                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ProfileRole**               | `admin`, `user`                                                                                                                                                                                                              |
| **ProfileStatus**             | `active`, `suspended`                                                                                                                                                                                                        |
| **OrgStatus**                 | `active`, `deactivated`                                                                                                                                                                                                      |
| **OrgMemberRole**             | `owner`, `member`, `partner`                                                                                                                                                                                                 |
| **OrgMemberStatus**           | `active`, `removed`                                                                                                                                                                                                          |
| **ProjectRole**               | `editor`, `viewer`                                                                                                                                                                                                           |
| **ProjectStatus**             | `active`, `archived`                                                                                                                                                                                                         |
| **TemplateStatus**            | `draft`, `published`, `deprecated`                                                                                                                                                                                           |
| **QuestionStatus**            | `active`, `archived`                                                                                                                                                                                                         |
| **QuestionType**              | `text`, `textarea`, **`single_select`**, **`multi_select`**, `number`, `date`, `boolean`, `json` — naming thống nhất (không dùng `single_choice`); mọi example/template question dùng đúng giá trị này để FE generate types. |
| **AiQuestionsGenerateEngine** | `legacy`, `agentkit_v2_file` — engine cho POST .../ai/questions/generate; default theo env `AI_WF_QGEN_V2_ENABLED`.                                                                                                          |
| **ProjectQuestionSource**     | `template`, `manual`, `ai`                                                                                                                                                                                                   |
| **SessionStatus**             | `in_progress`, `submitted`, `locked`                                                                                                                                                                                         |
| **AnswerStatus**              | `answered`, `skipped`, `na`                                                                                                                                                                                                  |
