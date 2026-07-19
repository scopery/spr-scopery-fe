# Wave 1 — API Contract Reference for Frontend

> **Mục đích:** Tài liệu này liệt kê đầy đủ tất cả API của Wave 1 (Foundation modules) để FE có thể implement integration mà không cần đọc backend code.
>
> **Phạm vi:** IAM (Auth + Users + Roles + Permissions + Rights + Role Assignments + Grants + Authorization) · Workspace (Organizations + Workspaces + Members + Teams) · External Party · Rate Card · Configuration
>
> **Cập nhật:** 2026-07-17

---

## Mục lục

1. [Conventions chung](#1-conventions-chung)
2. [Authentication](#2-authentication)
3. [IAM — User Management](#3-iam--user-management)
4. [IAM — Roles](#4-iam--roles)
5. [IAM — Permissions & Rights](#5-iam--permissions--rights)
6. [IAM — Role Assignments](#6-iam--role-assignments)
7. [IAM — Access Grants](#7-iam--access-grants)
8. [IAM — Authorization Check](#8-iam--authorization-check)
9. [IAM — Me / Current User](#9-iam--me--current-user)
10. [IAM — Audit Events](#10-iam--audit-events)
11. [Workspace — Organizations](#11-workspace--organizations)
12. [Workspace — Workspaces](#12-workspace--workspaces)
13. [Workspace — Members](#13-workspace--members)
14. [Workspace — Teams](#14-workspace--teams)
15. [External Party — Organizations](#15-external-party--organizations)
16. [External Party — Contacts](#16-external-party--contacts)
17. [Rate Card — Cost Roles](#17-rate-card--cost-roles)
18. [Rate Card — Inflation Policies](#18-rate-card--inflation-policies)
19. [Rate Card — Member Cost Roles](#19-rate-card--member-cost-roles)
20. [Rate Card — Cards](#20-rate-card--cards)
21. [Rate Card — Versions](#21-rate-card--versions)
22. [Rate Card — Lines](#22-rate-card--lines)
23. [Rate Card — Resolution](#23-rate-card--resolution)
24. [Configuration — Object Types](#24-configuration--object-types)
25. [Configuration — Custom Fields](#25-configuration--custom-fields)
26. [Configuration — Field Options](#26-configuration--field-options)
27. [Configuration — Field Values](#27-configuration--field-values)
28. [Configuration — Field Visibility](#28-configuration--field-visibility)
29. [Configuration — Forms & Versions](#29-configuration--forms--versions)
30. [Configuration — Form Sections & Fields](#30-configuration--form-sections--fields)
31. [Configuration — Form Submissions](#31-configuration--form-submissions)
32. [Configuration — Layouts](#32-configuration--layouts)
33. [Configuration — Status Sets](#33-configuration--status-sets)
34. [Configuration — Tags](#34-configuration--tags)
35. [Configuration — Taxonomies](#35-configuration--taxonomies)
36. [Configuration — Validation Rules](#36-configuration--validation-rules)

---

## 1. Conventions chung

### Base URL

```
http://localhost:8080
```

Tất cả path đều bắt đầu từ root (không có `/api/v1` prefix chung). Prefix theo từng module:

| Module | Prefix |
|---|---|
| IAM | `/api/v1/iam/` |
| Workspace / Organization | `/api/v1/` |
| External Party | `/api/v1/workspaces/{workspaceId}/` |
| Rate Card | `/api/rate-card/` |
| Configuration | `/api/workspaces/{workspaceId}/config/` hoặc `/api/config/` |

---

### Response format chung

> **Quy tắc đọc schema trong doc này:**
> - `"<uuid>"` → JSON string dạng `"550e8400-e29b-41d4-a716-446655440000"`
> - `"<instant>"` → JSON string ISO-8601 UTC: `"2026-07-17T03:00:00.000000Z"`
> - `"<date>"` → JSON string ISO-8601 date: `"2026-07-17"`
> - `"<number>"` → JSON number: `125.50`
> - `true / false` → JSON boolean
> - `null` → trường vắng mặt hoặc chưa có giá trị (field vẫn xuất hiện trong JSON, không bị bỏ qua)

**Thành công — object đơn:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "status": "ACTIVE",
    "createdAt": "2026-07-17T03:00:00.000000Z",
    "updatedAt": "2026-07-17T03:00:00.000000Z"
  },
  "timestamp": "2026-07-17T10:00:00.123456789+07:00"
}
```

> `timestamp` là `OffsetDateTime.now().toString()` phía server — có thể là UTC (`Z`) hoặc có offset (`+07:00`) tùy timezone server. FE chỉ nên dùng field này để debug, không dùng cho business logic.

**Thành công — danh sách phân trang:**
```json
{
  "success": true,
  "data": {
    "items": [ { "id": "...", ... } ],
    "page": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5,
    "first": true,
    "last": false
  },
  "timestamp": "2026-07-17T10:00:00.123456789+07:00"
}
```

**Thành công — void (không có data):**
```json
{
  "success": true,
  "data": null,
  "timestamp": "2026-07-17T10:00:00.123456789+07:00"
}
```

**Lỗi:**
```json
{
  "success": false,
  "status": 400,
  "error": "ValidationException",
  "errorCode": "VALIDATION_ERROR",
  "message": "Mô tả lỗi ngắn gọn",
  "details": ["username: must not be blank", "email: must be a well-formed email address"],
  "path": "/api/v1/iam/users",
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-07-17T10:00:00.123456789+07:00"
}
```

---

### HTTP Status codes

| Status | Khi nào |
|---|---|
| `200 OK` | Thành công (GET, PUT, PATCH, POST phần lớn) |
| `201 Created` | POST tạo mới (một số endpoint, xem ghi chú từng endpoint) |
| `202 Accepted` | Request được nhận nhưng xử lý async (vd: gửi email) |
| `204 No Content` | DELETE thành công |
| `400 Bad Request` | Validation lỗi, input sai format |
| `401 Unauthorized` | Chưa đăng nhập / token hết hạn |
| `403 Forbidden` | Đã đăng nhập nhưng không có quyền |
| `404 Not Found` | Resource không tồn tại |
| `409 Conflict` | Duplicate (code/email đã tồn tại) |
| `422 Unprocessable Entity` | Business rule vi phạm (sai trạng thái, entity bị deprecated) |
| `500 Internal Server Error` | Lỗi server không mong đợi |

---

### Error codes thường gặp

| errorCode | HTTP | Nghĩa |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Field bị thiếu hoặc sai format |
| `RESOURCE_NOT_FOUND` | 404 | Không tìm thấy resource theo ID |
| `RESOURCE_CONFLICT` | 409 | Code/email đã tồn tại |
| `BUSINESS_RULE_VIOLATION` | 422 | Vi phạm quy tắc nghiệp vụ |

---

### Authentication

**Cơ chế:** JWT Token lưu trong **HTTP-only Cookie** (không phải Bearer header).

FE không cần tự gắn header Authorization. Sau khi login, browser tự gửi cookie `access_token` trong mọi request tiếp theo.

| Cookie | Nội dung |
|---|---|
| `access_token` | JWT access token (short-lived) |
| `refresh_token` | Refresh token (long-lived, dùng để gia hạn) |

**Response header:** Mọi request đều có `X-Trace-Id` header — dùng để tra cứu log khi báo bug.

**Các endpoint không cần auth:**
- `POST /api/v1/iam/auth/login`
- `POST /api/v1/iam/auth/password/reset-request`
- `POST /api/v1/iam/auth/password/reset-confirm`

---

### Kiểu dữ liệu — JSON serialization

| Java type | JSON type | Ví dụ thực tế |
|---|---|---|
| `UUID` | `string` | `"550e8400-e29b-41d4-a716-446655440000"` |
| `Instant` | `string` (ISO-8601 UTC) | `"2026-07-17T03:00:00.000000Z"` |
| `LocalDate` | `string` (ISO-8601 date) | `"2026-07-17"` |
| `BigDecimal` | `number` | `125.50` |
| `int` / `long` | `number` | `1`, `100`, `204800` |
| `boolean` | `boolean` | `true`, `false` |
| `String` (Enum) | `string` (tên enum) | `"ACTIVE"`, `"INACTIVE"` |
| `null` field | `null` | `"deletedAt": null` |
| `List<T>` | `array` | `[{ ... }, { ... }]` |
| `List<UUID>` | `array of string` | `["uuid1", "uuid2"]` |

> **Lưu ý quan trọng:** Jackson KHÔNG bỏ qua (`@JsonInclude(NON_NULL)`) — mọi field `null` đều xuất hiện trong JSON với giá trị `null`. FE cần handle `null` thay vì assume field vắng mặt.

---

### Pagination

Query params mặc định cho mọi endpoint dạng danh sách có phân trang:

| Param | Type | Default | Mô tả |
|---|---|---|---|
| `page` | int | `0` | Trang hiện tại (zero-based) |
| `size` | int | `20` | Số item mỗi trang |

---

### WebSocket

Wave 1 **không có** WebSocket. Tất cả đều là REST HTTP.

---

## 2. Authentication

Base path: `/api/v1/iam/auth`

---

### POST `/api/v1/iam/auth/login`

Đăng nhập, nhận JWT token qua HTTP-only cookie.

**Auth required:** Không

**Request body:**
```json
{
  "username": "admin",     // required | string
  "password": "P@ssw0rd1" // required | string
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "admin",
    "email": "admin@example.com",
    "fullName": "Admin User"
  },
  "timestamp": "2026-07-17T10:00:00.123456789+07:00"
}
```

**Side effects:** Set cookies `access_token` và `refresh_token` (HTTP-only, Secure).

---

### POST `/api/v1/iam/auth/refresh`

Gia hạn access token. Browser tự gửi `refresh_token` cookie.

**Auth required:** Không (dùng refresh_token cookie)

**Request body:** Không có

**Response `200`:** Giống login — trả `LoginResponse`, rotate cả 2 cookies.

---

### POST `/api/v1/iam/auth/logout`

Đăng xuất, xóa cookies và revoke refresh session.

**Auth required:** Không (chỉ cần refresh_token cookie)

**Request body:** Không có

**Response `200`:**
```json
{ "success": true, "data": null }
```

---

### POST `/api/v1/iam/auth/password/change`

Đổi mật khẩu (user tự đổi khi đang đăng nhập). Revoke tất cả refresh session sau khi đổi.

**Auth required:** Có

**Request body:**
```json
{
  "currentPassword": "OldP@ssword1",  // required | string
  "newPassword": "NewP@ssword1"       // required | string | regex: ít nhất 1 chữ thường, 1 chữ hoa, 1 số, tối thiểu 12 ký tự, tối đa 128
}
```

**Response `200`:**
```json
{ "success": true, "data": null }
```

---

### POST `/api/v1/iam/auth/password/reset-request`

Yêu cầu gửi email reset mật khẩu. Không tiết lộ email có tồn tại hay không.

**Auth required:** Không

**Request body:**
```json
{
  "email": "user@example.com" // required | string | email format
}
```

**Response `202`:**
```json
{ "success": true, "data": null }
```

---

### POST `/api/v1/iam/auth/password/reset-confirm`

Xác nhận reset mật khẩu bằng token từ email.

**Auth required:** Không

**Request body:**
```json
{
  "token": "token-from-email", // required | string
  "newPassword": "NewP@ssword1" // required | string | cùng regex như change password
}
```

**Response `200`:**
```json
{ "success": true, "data": null }
```

---

### POST `/api/v1/iam/auth/sessions/revoke-all`

Thu hồi tất cả refresh session của user hiện tại (đăng xuất khỏi mọi thiết bị).

**Auth required:** Có

**Request body:** Không có

**Response `200`:**
```json
{ "success": true, "data": null }
```

---

## 3. IAM — User Management

Base path: `/api/v1/iam/users`

**IamUserResponse — schema dùng chung:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "status": "ACTIVE",
  "createdAt": "2026-07-17T03:00:00.000000Z",
  "updatedAt": "2026-07-17T03:00:00.000000Z"
}
```
> `status` enum: `ACTIVE` | `INACTIVE` | `SUSPENDED`

---

### POST `/api/v1/iam/users`

Tạo user mới.

**Auth required:** Có

**Request body:**
```json
{
  "username": "johndoe",           // required | string | 3–100 chars
  "email": "john@example.com",     // required | string | email format | max 255 chars
  "fullName": "John Doe",          // optional | string | max 255 chars
  "password": "P@ssw0rdSecure1"   // required | string | regex: >= 12 chars, >= 1 upper, 1 lower, 1 digit
}
```

**Response `200`:** `IamUserResponse`

---

### GET `/api/v1/iam/users`

Tìm kiếm danh sách users.

**Auth required:** Có

**Query params:**
| Param | Type | Required | Mô tả |
|---|---|---|---|
| `keyword` | string | optional | Tìm theo username hoặc email |
| `status` | string | optional | `ACTIVE` \| `INACTIVE` \| `SUSPENDED` |
| `page` | int | optional | Default: `0` |
| `size` | int | optional | Default: `20` |

**Response `200`:** `PageResponse<IamUserResponse>`

---

### GET `/api/v1/iam/users/{id}`

Lấy chi tiết user theo ID.

**Auth required:** Có

**Path variable:** `id` — UUID

**Response `200`:** `IamUserResponse`

---

### PUT `/api/v1/iam/users/{id}`

Cập nhật thông tin user.

**Auth required:** Có

**Path variable:** `id` — UUID

**Request body:**
```json
{
  "fullName": "John Updated" // optional | string | max 255 chars
}
```

**Response `200`:** `IamUserResponse`

---

### PATCH `/api/v1/iam/users/{id}/activate`

Kích hoạt user.

**Auth required:** Có · **Response `200`:** `IamUserResponse`

---

### PATCH `/api/v1/iam/users/{id}/deactivate`

Vô hiệu hóa user.

**Auth required:** Có · **Response `200`:** `IamUserResponse`

---

### PATCH `/api/v1/iam/users/{id}/suspend`

Tạm đình chỉ user.

**Auth required:** Có · **Response `200`:** `IamUserResponse`

---

## 4. IAM — Roles

Base path: `/api/v1/iam/roles`

**IamRoleResponse — schema dùng chung:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "ADMIN",
  "name": "Administrator",
  "description": "Full access role",
  "status": "ACTIVE",
  "roleScope": "SYSTEM",
  "roleSource": "MANUAL",
  "workspaceId": null,
  "parentRoleId": null,
  "isSystem": true,
  "deletedAt": null,
  "createdAt": "2026-07-17T03:00:00.000000Z",
  "updatedAt": "2026-07-17T03:00:00.000000Z"
}
```
> `status` enum: `ACTIVE` | `INACTIVE`

---

### POST `/api/v1/iam/roles/system`

Tạo system-scoped role.

**Auth required:** Có

**Request body:**
```json
{
  "code": "ADMIN",                     // required | string | 2–100 chars
  "name": "Administrator",             // required | string | max 255 chars
  "description": "Full access role",   // optional | string | max 2000 chars
  "roleScope": "SYSTEM",               // optional | string
  "roleSource": "MANUAL",              // optional | string
  "workspaceId": null,                 // optional | uuid
  "parentRoleId": null                 // optional | uuid
}
```

**Response `200`:** `IamRoleResponse`

---

### POST `/api/v1/iam/roles/workspace`

Tạo workspace-scoped role.

**Auth required:** Có

**Request body:** Giống `POST /system` — truyền thêm `workspaceId` nếu cần.

**Response `200`:** `IamRoleResponse`

---

### GET `/api/v1/iam/roles`

Tìm kiếm roles.

**Auth required:** Có

**Query params:**
| Param | Type | Required | Mô tả |
|---|---|---|---|
| `keyword` | string | optional | Tìm theo code hoặc name |
| `workspaceId` | uuid | optional | Lọc theo workspace |
| `roleScope` | string | optional | Lọc theo scope |
| `roleSource` | string | optional | Lọc theo source |
| `status` | string | optional | `ACTIVE` \| `INACTIVE` |
| `includeDeleted` | boolean | optional | Default: `false` |
| `page` | int | optional | Default: `0` |
| `size` | int | optional | Default: `20` |

**Response `200`:** `PageResponse<IamRoleResponse>`

---

### GET `/api/v1/iam/roles/{id}`

Lấy chi tiết role.

**Auth required:** Có · **Response `200`:** `IamRoleResponse`

---

### PUT `/api/v1/iam/roles/{id}`

Cập nhật role.

**Auth required:** Có

**Request body:**
```json
{
  "name": "Updated Name",          // required | string | max 255 chars
  "description": "New description" // optional | string | max 2000 chars
}
```

**Response `200`:** `IamRoleResponse`

---

### PATCH `/api/v1/iam/roles/{id}/activate`

Kích hoạt role. **Response `200`:** `IamRoleResponse`

### PATCH `/api/v1/iam/roles/{id}/deactivate`

Vô hiệu hóa role. **Response `200`:** `IamRoleResponse`

### PATCH `/api/v1/iam/roles/{id}/soft-delete`

Soft delete role. **Response `200`:** `IamRoleResponse`

---

## 5. IAM — Permissions & Rights

### Permissions

Base path: `/api/v1/iam/permissions`

**IamPermissionResponse:**
```json
{
  "id": "uuid",
  "code": "string",
  "moduleCode": "string",
  "name": "string",
  "description": "string | null",
  "resourceScopeLevel": "string",
  "dataAccessPolicy": "string",
  "permissionCategory": "string",
  "assignableSubjectTypes": ["USER", "TEAM"],
  "riskLevel": "string",
  "status": "string",
  "actions": [
    {
      "id": "uuid",
      "permissionId": "uuid",
      "code": "string",
      "name": "string",
      "description": "string | null"
    }
  ],
  "createdAt": "instant",
  "updatedAt": "instant"
}
```

---

#### GET `/api/v1/iam/permissions/matrix`

Lấy toàn bộ permission/action matrix (dùng để render permission UI).

**Auth required:** Có · **Response `200`:** `List<IamPermissionResponse>`

---

#### GET `/api/v1/iam/permissions`

Tìm kiếm permissions.

**Query params:**
| Param | Type | Required |
|---|---|---|
| `keyword` | string | optional |
| `moduleCode` | string | optional |
| `resourceScopeLevel` | string | optional |
| `dataAccessPolicy` | string | optional |
| `permissionCategory` | string | optional |
| `riskLevel` | string | optional |
| `assignableSubjectType` | string | optional |
| `status` | string | optional |
| `page` | int | optional |
| `size` | int | optional |

**Response `200`:** `PageResponse<IamPermissionResponse>`

---

#### GET `/api/v1/iam/permissions/{id}`

Lấy chi tiết permission. **Response `200`:** `IamPermissionResponse`

---

#### GET `/api/v1/iam/permissions/{id}/actions`

Lấy danh sách actions của một permission.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "permissionId": "uuid",
      "code": "string",
      "name": "string",
      "description": "string | null"
    }
  ]
}
```

---

### Rights

Base path: `/api/v1/iam/rights`

**IamRightResponse:**
```json
{
  "id": "uuid",
  "code": "string",
  "name": "string",
  "description": "string | null",
  "module": "string",
  "status": "string",
  "createdAt": "instant",
  "updatedAt": "instant"
}
```

---

#### GET `/api/v1/iam/rights`

Tìm kiếm rights.

**Query params:** `keyword`, `module`, `status`, `page`, `size` (default size: `50`)

**Response `200`:** `PageResponse<IamRightResponse>`

---

#### GET `/api/v1/iam/rights/{id}`

Lấy chi tiết right. **Response `200`:** `IamRightResponse`

---

## 6. IAM — Role Assignments

Base path: `/api/v1/iam/role-assignments`

**IamRoleAssignmentResponse:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "assigneeType": "USER",
  "assigneeId": "550e8400-e29b-41d4-a716-446655440001",
  "roleId": "550e8400-e29b-41d4-a716-446655440002",
  "workspaceId": null,
  "assignedBy": "550e8400-e29b-41d4-a716-446655440003",
  "assignedAt": "2026-07-17T03:00:00.000000Z",
  "status": "ACTIVE",
  "createdAt": "2026-07-17T03:00:00.000000Z",
  "updatedAt": "2026-07-17T03:00:00.000000Z"
}
```
> `assigneeType` enum: `USER` | `TEAM` · `status` enum: `ACTIVE` | `INACTIVE`

---

### POST `/api/v1/iam/role-assignments`

Gán role cho user hoặc team.

**Request body:**
```json
{
  "assigneeType": "USER",    // required | "USER" | "TEAM"
  "assigneeId": "uuid",      // required | uuid
  "roleId": "uuid",          // required | uuid
  "workspaceId": "uuid"      // optional | uuid (nếu workspace-scoped role)
}
```

**Response `200`:** `IamRoleAssignmentResponse`

---

### GET `/api/v1/iam/role-assignments`

Tìm kiếm role assignments.

**Query params:** `roleId`, `assigneeId`, `assigneeType`, `status`, `workspaceId`, `page`, `size`

**Response `200`:** `PageResponse<IamRoleAssignmentResponse>`

---

### GET `/api/v1/iam/role-assignments/{id}`

Lấy chi tiết. **Response `200`:** `IamRoleAssignmentResponse`

---

### PATCH `/api/v1/iam/role-assignments/{id}/activate`

Kích hoạt. **Response `200`:** `IamRoleAssignmentResponse`

### PATCH `/api/v1/iam/role-assignments/{id}/deactivate`

Vô hiệu hóa. **Response `200`:** `IamRoleAssignmentResponse`

---

## 7. IAM — Access Grants

Base path: `/api/v1/iam/grants`

**IamAccessGrantResponse:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "subjectType": "USER",
  "subjectId": "550e8400-e29b-41d4-a716-446655440001",
  "resourceId": "550e8400-e29b-41d4-a716-446655440002",
  "roleId": null,
  "effect": "ALLOW",
  "scopeType": null,
  "scopeRefId": null,
  "workspaceId": "550e8400-e29b-41d4-a716-446655440003",
  "kind": null,
  "sourcePolicyId": null,
  "canDelegate": false,
  "delegationDepth": 0,
  "expiresAt": null,
  "conditionJson": null,
  "reason": null,
  "status": "ACTIVE",
  "grantedBy": "550e8400-e29b-41d4-a716-446655440004",
  "grantedAt": "2026-07-17T03:00:00.000000Z",
  "version": 1,
  "createdAt": "2026-07-17T03:00:00.000000Z",
  "updatedAt": "2026-07-17T03:00:00.000000Z"
}
```
> `status` enum: `ACTIVE` | `REVOKED` | `EXPIRED` · `effect`: `ALLOW` | `DENY`

---

### POST `/api/v1/iam/grants`

Tạo access grant.

**Request body:**
```json
{
  "subjectType": "USER",  // required | string
  "subjectId": "uuid",    // required | uuid
  "resourceId": "uuid",   // required | uuid
  "roleId": "uuid",       // optional | uuid
  "effect": "ALLOW",      // optional | "ALLOW" | "DENY"
  "scopeType": "string",  // optional
  "scopeRefId": "uuid",   // optional
  "workspaceId": "uuid",  // optional
  "expiresAt": "instant"  // optional | must be future date
}
```

**Response `200`:** `IamAccessGrantResponse`

---

### POST `/api/v1/iam/grants:delegate`

Ủy quyền (delegate) permission actions.

**Request body:**
```json
{
  "subjectType": "USER",      // required | string
  "subjectId": "uuid",        // required | uuid
  "resourceType": "PROJECT",  // required | string
  "resourceRefId": "uuid",    // required | uuid
  "delegationDepth": 1,       // required | int >= 0
  "expiresAt": "instant",     // optional | must be future
  "condition": {},            // optional | JSON object
  "reason": "string",         // optional
  "actions": [
    {
      "permissionCode": "PROJECT_READ",  // required
      "actionCode": "VIEW"               // required
    }
  ]
}
```

**Response `200`:** `IamAccessGrantResponse`

---

### POST `/api/v1/iam/grants:revoke`

Thu hồi grant.

**Request body:**
```json
{
  "grantId": "uuid",   // required | uuid
  "reason": "string"   // optional
}
```

**Response `200`:** `IamAccessGrantResponse`

---

### GET `/api/v1/iam/grants`

Tìm kiếm grants.

**Query params:** `subjectId`, `resourceId`, `workspaceId`, `status`, `page`, `size`

**Response `200`:** `PageResponse<IamAccessGrantResponse>`

---

### GET `/api/v1/iam/grants/{id}`

Chi tiết grant. **Response `200`:** `IamAccessGrantResponse`

---

### PATCH `/api/v1/iam/grants/{id}/revoke`

Thu hồi grant bằng path variable. **Response `200`:** `IamAccessGrantResponse`

---

### GET `/api/v1/iam/grants/{id}/rights`

Danh sách rights của grant.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "grantId": "550e8400-e29b-41d4-a716-446655440000",
      "rightId": "550e8400-e29b-41d4-a716-446655440001",
      "createdAt": "2026-07-17T03:00:00.000000Z"
    }
  ],
  "timestamp": "2026-07-17T10:00:00.123456789+07:00"
}
```

---

### POST `/api/v1/iam/grants/{id}/rights`

Thêm right vào grant.

**Request body:**
```json
{ "rightId": "uuid" } // required
```

---

### DELETE `/api/v1/iam/grants/{id}/rights/{rightId}`

Xóa right khỏi grant. **Response `200`:** `null data`

---

### GET `/api/v1/iam/grants/{id}/actions`

Danh sách permission actions của grant.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "grantId": "550e8400-e29b-41d4-a716-446655440000",
      "resourceId": "550e8400-e29b-41d4-a716-446655440001",
      "workspaceId": null,
      "permissionActionId": "550e8400-e29b-41d4-a716-446655440002",
      "permissionId": "550e8400-e29b-41d4-a716-446655440003",
      "permissionCode": "PROJECT_READ",
      "actionCode": "VIEW",
      "rightId": null,
      "legacyRightCode": null,
      "createdAt": "2026-07-17T03:00:00.000000Z"
    }
  ],
  "timestamp": "2026-07-17T10:00:00.123456789+07:00"
}
```

---

### POST `/api/v1/iam/grants/{id}/actions`

Thêm permission action vào grant.

**Request body:**
```json
{
  "permissionActionId": "uuid",  // optional | uuid
  "permissionCode": "string",    // optional | max 100 chars
  "actionCode": "string"         // optional | max 100 chars
}
```

---

### DELETE `/api/v1/iam/grants/{id}/actions/{permissionActionId}`

Xóa permission action khỏi grant. **Response `200`:** `null data`

---

## 8. IAM — Authorization Check

Base path: `/api/v1/iam/authorization`

---

### POST `/api/v1/iam/authorization/check`

Kiểm tra quyền của user hiện tại trên một resource.

**Request body:**
```json
{
  "permissionCode": "PROJECT_READ",  // required | string
  "actionCode": "VIEW",              // required | string
  "resourceType": "PROJECT",         // required | string
  "resourceRefId": "uuid"            // optional | string (UUID)
}
```

**Response `200`:**
```json
{
  "data": {
    "permissionCode": "PROJECT_READ",
    "actionCode": "VIEW",
    "resourceType": "PROJECT",
    "resourceRefId": "uuid",
    "allowed": true,
    "reason": "string",
    "contributingGrantIds": ["uuid"],
    "explanation": "string"
  }
}
```

---

### POST `/api/v1/iam/authorization/check-batch`

Kiểm tra nhiều quyền cùng lúc (tối đa 100).

**Request body:**
```json
{
  "checks": [
    { "permissionCode": "P1", "actionCode": "A1", "resourceType": "T1", "resourceRefId": "uuid" },
    { "permissionCode": "P2", "actionCode": "A2", "resourceType": "T2" }
  ]
}
```

**Response `200`:** `List<AuthorizationExplanationResponse>` (cùng schema như check đơn)

---

### GET `/api/v1/iam/authorization/explain`

Giải thích chi tiết quyết định authorization.

**Query params:** `permissionCode` (required), `actionCode` (required), `resourceType` (required), `resourceRefId` (required)

**Response `200`:** `AuthorizationExplanationResponse`

---

### POST `/api/v1/iam/authorization/check-by-right`

Kiểm tra quyền theo right code (legacy).

**Request body:**
```json
{
  "userId": "uuid",       // required
  "resourceId": "uuid",   // required
  "rightCode": "string"   // required
}
```

**Response `200`:**
```json
{
  "data": {
    "userId": "uuid",
    "resourceId": "uuid",
    "rightCode": "string",
    "allowed": true
  }
}
```

---

## 9. IAM — Me / Current User

### GET `/api/v1/iam/me`

Lấy thông tin user đang đăng nhập.

**Auth required:** Có

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "status": "ACTIVE",
    "organizationMemberships": [
      {
        "organizationId": "550e8400-e29b-41d4-a716-446655440001",
        "organizationName": "Scopery Inc.",
        "membershipType": "OWNER",
        "status": "ACTIVE"
      }
    ],
    "securityState": {
      "mfaEnabled": false,
      "passwordChangeRequired": false
    },
    "createdAt": "2026-07-17T03:00:00.000000Z"
  },
  "timestamp": "2026-07-17T10:00:00.123456789+07:00"
}
```

---

## 10. IAM — Audit Events

### GET `/api/v1/iam/audit-events`

Tìm kiếm audit log.

**Auth required:** Có (admin)

**Query params:**
| Param | Type |
|---|---|
| `eventType` | string |
| `severity` | string |
| `actorId` | uuid |
| `resourceType` | string |
| `organizationId` | uuid |
| `workspaceId` | uuid |
| `page` | int (default: 0) |
| `size` | int (default: 50) |

**Response `200`:**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "eventType": "string",
        "severity": "string",
        "actorId": "uuid | null",
        "actorType": "string | null",
        "resourceType": "string | null",
        "resourceRefId": "uuid | null",
        "organizationId": "uuid | null",
        "workspaceId": "uuid | null",
        "beforeState": "json-string | null",
        "afterState": "json-string | null",
        "reason": "string | null",
        "traceId": "string",
        "occurredAt": "instant"
      }
    ],
    "page": 0,
    "size": 50,
    "totalElements": 100,
    "totalPages": 2
  }
}
```

---

## 11. Workspace — Organizations

Base path: `/api/v1/organizations`

**OrganizationResponse:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "SCOPERY",
  "name": "Scopery Inc.",
  "description": "Main organization",
  "ownerUserId": "550e8400-e29b-41d4-a716-446655440001",
  "status": "ACTIVE",
  "version": 1,
  "createdAt": "2026-07-17T03:00:00.000000Z",
  "updatedAt": "2026-07-17T03:00:00.000000Z"
}
```
> `status` enum: `ACTIVE` | `INACTIVE` | `ARCHIVED`

---

### POST `/api/v1/organizations`

Tạo organization mới.

**Request body:**
```json
{
  "name": "Scopery Inc.",    // required | string
  "code": "SCOPERY",         // required | string
  "description": "string"    // optional
}
```

**Response `200`:** `OrganizationResponse`

---

### GET `/api/v1/organizations`

Tìm kiếm organizations.

**Query params:** `keyword`, `ownerUserId`, `status`, `page`, `size`

**Response `200`:** `PageResponse<OrganizationResponse>`

---

### GET `/api/v1/organizations/{id}`

Chi tiết organization. **Response `200`:** `OrganizationResponse`

---

### PUT `/api/v1/organizations/{id}`

Cập nhật organization.

**Request body:**
```json
{
  "name": "New Name",        // required
  "description": "string"    // optional
}
```

**Response `200`:** `OrganizationResponse`

---

### PATCH `/api/v1/organizations/{id}/activate`

Kích hoạt. **Response `200`:** `OrganizationResponse`

### PATCH `/api/v1/organizations/{id}/archive`

Archive. **Response `200`:** `OrganizationResponse`

---

## 12. Workspace — Workspaces

Base path: `/api/v1/workspaces`

**WorkspaceDetailResponse:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "organizationId": "550e8400-e29b-41d4-a716-446655440001",
  "code": "ENG",
  "name": "Engineering",
  "description": "Engineering workspace",
  "ownerUserId": "550e8400-e29b-41d4-a716-446655440002",
  "defaultVisibility": "PRIVATE",
  "joinPolicy": "INVITE_ONLY",
  "status": "ACTIVE",
  "ownerMembershipCreated": true,
  "createdAt": "2026-07-17T03:00:00.000000Z",
  "updatedAt": "2026-07-17T03:00:00.000000Z"
}
```
> `status` enum: `ACTIVE` | `INACTIVE` | `ARCHIVED`

---

### POST `/api/v1/workspaces`

Tạo workspace mới.

**Request body:**
```json
{
  "organizationId": "uuid",    // required | uuid
  "name": "Engineering",       // required | string
  "code": "ENG",               // required | string
  "description": "string",     // optional
  "defaultVisibility": "PRIVATE", // optional | "PUBLIC" | "PRIVATE" | ...
  "joinPolicy": "INVITE_ONLY"  // optional
}
```

**Response `200`:** `WorkspaceDetailResponse`

---

### GET `/api/v1/workspaces`

Tìm kiếm workspaces.

**Query params:** `organizationId`, `ownerUserId`, `keyword`, `status`, `page`, `size`

**Response `200`:** `PageResponse<WorkspaceDetailResponse>`

---

### GET `/api/v1/workspaces/{id}`

Chi tiết workspace. **Response `200`:** `WorkspaceDetailResponse`

---

### PUT `/api/v1/workspaces/{id}`

Cập nhật workspace.

**Request body:**
```json
{
  "name": "Updated Name",      // required
  "description": "string",     // optional
  "defaultVisibility": "string", // optional
  "joinPolicy": "string"       // optional
}
```

**Response `200`:** `WorkspaceDetailResponse`

---

### PATCH `/api/v1/workspaces/{id}/activate`

Kích hoạt. **Response `200`:** `WorkspaceDetailResponse`

### PATCH `/api/v1/workspaces/{id}/archive`

Archive. **Response `200`:** `WorkspaceDetailResponse`

---

## 13. Workspace — Members

Base path: `/api/v1/workspaces/{workspaceId}/members`

**WorkspaceMemberResponse:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "workspaceId": "550e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440002",
  "status": "ACTIVE",
  "joinedAt": "2026-07-17T03:00:00.000000Z",
  "createdAt": "2026-07-17T03:00:00.000000Z",
  "updatedAt": "2026-07-17T03:00:00.000000Z"
}
```
> `status` enum: `ACTIVE` | `INACTIVE`

---

### POST `/api/v1/workspaces/{workspaceId}/members`

Thêm member vào workspace.

**Request body:**
```json
{ "userId": "uuid" } // required
```

**Response `200`:** `WorkspaceMemberResponse`

---

### GET `/api/v1/workspaces/{workspaceId}/members`

Danh sách members.

**Query params:** `userId`, `status`, `page`, `size`

**Response `200`:** `PageResponse<WorkspaceMemberResponse>`

---

### PATCH `/api/v1/workspaces/{workspaceId}/members/{memberId}/activate`

Kích hoạt member. **Response `200`:** `WorkspaceMemberResponse`

### PATCH `/api/v1/workspaces/{workspaceId}/members/{memberId}/deactivate`

Vô hiệu hóa member. **Response `200`:** `WorkspaceMemberResponse`

---

## 14. Workspace — Teams

Base path: `/api/v1/workspaces/{workspaceId}/teams`

> **Lưu ý:** API này đang bị đánh dấu DEPRECATED — ưu tiên dùng OrgTeam API khi có. Hiện tại vẫn còn dùng được.

**TeamResponse:**
```json
{
  "id": "uuid",
  "workspaceId": "uuid",
  "name": "string",
  "code": "string",
  "description": "string | null",
  "status": "ACTIVE | INACTIVE | ARCHIVED",
  "createdAt": "instant",
  "updatedAt": "instant"
}
```

---

### POST `/api/v1/workspaces/{workspaceId}/teams`

Tạo team.

**Request body:**
```json
{
  "name": "Backend Team",  // required
  "code": "BACKEND",       // required
  "description": "string"  // optional
}
```

**Response `200`:** `TeamResponse`

---

### GET `/api/v1/workspaces/{workspaceId}/teams`

Danh sách teams.

**Query params:** `status`, `page`, `size`

**Response `200`:** `PageResponse<TeamResponse>`

---

### GET `/api/v1/workspaces/{workspaceId}/teams/{teamId}`

Chi tiết team. **Response `200`:** `TeamResponse`

---

### PUT `/api/v1/workspaces/{workspaceId}/teams/{teamId}`

Cập nhật team.

**Request body:**
```json
{
  "name": "Updated Name",  // required
  "description": "string"  // optional
}
```

**Response `200`:** `TeamResponse`

---

### PATCH `/api/v1/workspaces/{workspaceId}/teams/{teamId}/activate`

Kích hoạt. **Response `200`:** `TeamResponse`

### PATCH `/api/v1/workspaces/{workspaceId}/teams/{teamId}/archive`

Archive. **Response `200`:** `TeamResponse`

---

### POST `/api/v1/workspaces/{workspaceId}/teams/{teamId}/members`

Thêm member vào team.

**Request body:**
```json
{ "userId": "uuid" } // required
```

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "teamId": "uuid",
    "userId": "uuid",
    "joinedAt": "instant"
  }
}
```

---

### GET `/api/v1/workspaces/{workspaceId}/teams/{teamId}/members`

Danh sách members trong team.

**Query params:** `page`, `size`

**Response `200`:** `PageResponse<TeamMemberResponse>`

---

### DELETE `/api/v1/workspaces/{workspaceId}/teams/{teamId}/members/{userId}`

Xóa member khỏi team. **Response `200`:** `null data`

---

## 15. External Party — Organizations

Base path: `/api/v1/workspaces/{workspaceId}/external-organizations`

**ExternalOrganizationResponse:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "workspaceId": "550e8400-e29b-41d4-a716-446655440001",
  "code": "CLIENT001",
  "name": "Acme Corp",
  "organizationType": "CLIENT",
  "status": "ACTIVE",
  "createdAt": "2026-07-17T03:00:00.000000Z"
}
```

> **Lưu ý:** Response KHÔNG có `taxId`, `website`, `notes`, `updatedAt`.

---

### POST `/api/v1/workspaces/{workspaceId}/external-organizations`

Tạo external organization (client/vendor).

**Request body:**
```json
{
  "code": "CLIENT001",          // required | string
  "name": "Acme Corp",          // required | string
  "organizationType": "CLIENT"  // optional | string (CLIENT, VENDOR, ...)
}
```

**Response `200`:** `ExternalOrganizationResponse`

---

### GET `/api/v1/workspaces/{workspaceId}/external-organizations`

Danh sách external organizations. **Response `200`:** `List<ExternalOrganizationResponse>`

---

### GET `/api/v1/workspaces/{workspaceId}/external-organizations/{organizationId}`

Chi tiết. **Response `200`:** `ExternalOrganizationResponse`

---

## 16. External Party — Contacts

Base path: `/api/v1/workspaces/{workspaceId}/external-contacts`

**ExternalContactResponse:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "workspaceId": "550e8400-e29b-41d4-a716-446655440001",
  "organizationId": "550e8400-e29b-41d4-a716-446655440002",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@acme.com",
  "status": "ACTIVE",
  "primaryFlag": true,
  "createdAt": "2026-07-17T03:00:00.000000Z"
}
```

> **Lưu ý:** Response KHÔNG có `phone`, `title`, `updatedAt`.

---

### POST `/api/v1/workspaces/{workspaceId}/external-contacts`

Tạo contact.

**Request body:**
```json
{
  "organizationId": "550e8400-e29b-41d4-a716-446655440000", // optional | uuid
  "firstName": "John",  // required | string
  "lastName": "Doe",    // required | string
  "email": "john@acme.com",  // optional | string
  "primaryFlag": true   // optional | boolean
}
```

**Response `200`:** `ExternalContactResponse`

---

### GET `/api/v1/workspaces/{workspaceId}/external-contacts`

Danh sách contacts. **Response `200`:** `List<ExternalContactResponse>`

---

### GET `/api/v1/workspaces/{workspaceId}/external-contacts/{contactId}`

Chi tiết contact. **Response `200`:** `ExternalContactResponse`

---

## 17. Rate Card — Cost Roles

Base path: `/api/rate-card/cost-roles`

**CostRoleResponse:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "SWE",
  "name": "Software Engineer",
  "description": null,
  "scope": "WORKSPACE",
  "organizationId": null,
  "workspaceId": "550e8400-e29b-41d4-a716-446655440001",
  "category": "TECH",
  "builtIn": false,
  "status": "ACTIVE",
  "archivedAt": null,
  "archivedBy": null,
  "version": 1,
  "createdAt": "2026-07-17T03:00:00.000000Z",
  "updatedAt": "2026-07-17T03:00:00.000000Z"
}
```
> `scope` enum: `SYSTEM` | `ORGANIZATION` | `WORKSPACE` · `status` enum: `ACTIVE` | `INACTIVE` | `ARCHIVED`

---

### POST `/api/rate-card/cost-roles`

Tạo cost role.

**Status `201`**

**Request body:**
```json
{
  "code": "SWE",              // required | string
  "name": "Software Engineer", // required | string
  "description": "string",    // optional
  "scope": "WORKSPACE",       // required | "SYSTEM" | "ORGANIZATION" | "WORKSPACE"
  "organizationId": "uuid",   // optional
  "workspaceId": "uuid",      // optional
  "category": "TECH"          // optional
}
```

**Response `201`:** `CostRoleResponse`

---

### GET `/api/rate-card/cost-roles`

Tìm kiếm cost roles.

**Query params:** `scope`, `organizationId`, `workspaceId`, `status`, `category`, `code`, `page`, `size`

**Response `200`:** `PageResponse<CostRoleResponse>`

---

### GET `/api/rate-card/cost-roles/{roleId}`

Chi tiết. **Response `200`:** `CostRoleResponse`

---

### PUT `/api/rate-card/cost-roles/{roleId}`

Cập nhật cost role.

**Request body:**
```json
{
  "name": "Senior SWE",   // required
  "description": "string", // optional
  "category": "string"     // optional
}
```

**Response `200`:** `CostRoleResponse`

---

### PATCH `/api/rate-card/cost-roles/{roleId}/activate`

Kích hoạt. **Response `200`:** `CostRoleResponse`

### PATCH `/api/rate-card/cost-roles/{roleId}/deactivate`

Vô hiệu hóa. **Response `200`:** `CostRoleResponse`

### PATCH `/api/rate-card/cost-roles/{roleId}/archive`

Archive. **Response `200`:** `CostRoleResponse`

---

## 18. Rate Card — Inflation Policies

Base path: `/api/rate-card/inflation-policies`

**InflationPolicyResponse:**
```json
{
  "id": "uuid",
  "code": "string",
  "name": "string",
  "description": "string | null",
  "scope": "SYSTEM | ORGANIZATION | WORKSPACE",
  "organizationId": "uuid | null",
  "workspaceId": "uuid | null",
  "inflationPercent": 3.5,
  "compoundFrequency": "ANNUAL | MONTHLY | NONE",
  "effectiveFrom": "2026-01-01",
  "effectiveTo": "2027-12-31",
  "status": "ACTIVE | INACTIVE | ARCHIVED",
  "archivedAt": "instant | null",
  "archivedBy": "uuid | null",
  "version": 1,
  "createdAt": "instant",
  "updatedAt": "instant"
}
```

---

### POST `/api/rate-card/inflation-policies`

Tạo inflation policy.

**Status `201`**

**Request body:**
```json
{
  "code": "INF2026",              // required | string
  "name": "2026 Annual Inflation", // required | string
  "description": "string",         // optional
  "scope": "ORGANIZATION",         // required | "SYSTEM" | "ORGANIZATION" | "WORKSPACE"
  "organizationId": "uuid",        // optional
  "workspaceId": "uuid",           // optional
  "inflationPercent": 3.5,         // required | BigDecimal
  "compoundFrequency": "ANNUAL",   // required | "ANNUAL" | "MONTHLY" | "NONE"
  "effectiveFrom": "2026-01-01",   // required | LocalDate
  "effectiveTo": "2027-12-31"      // optional | LocalDate
}
```

**Response `201`:** `InflationPolicyResponse`

---

### GET `/api/rate-card/inflation-policies`

Tìm kiếm. **Query params:** `scope`, `organizationId`, `workspaceId`, `status`, `code`, `page`, `size`

**Response `200`:** `PageResponse<InflationPolicyResponse>`

---

### GET `/api/rate-card/inflation-policies/{policyId}`

Chi tiết. **Response `200`:** `InflationPolicyResponse`

---

### PUT `/api/rate-card/inflation-policies/{policyId}`

Cập nhật.

**Request body:**
```json
{
  "name": "string",              // required
  "description": "string",        // optional
  "inflationPercent": 4.0,        // required
  "compoundFrequency": "ANNUAL",  // required
  "effectiveFrom": "2026-01-01",  // required
  "effectiveTo": null             // optional
}
```

**Response `200`:** `InflationPolicyResponse`

---

### PATCH `.../activate` · `.../deactivate` · `.../archive`

Cùng pattern, trả `InflationPolicyResponse`.

---

## 19. Rate Card — Member Cost Roles

Base path: `/api/rate-card/member-cost-roles`

**MemberCostRoleResponse:**
```json
{
  "id": "uuid",
  "workspaceId": "uuid",
  "workspaceMemberId": "uuid",
  "userId": "uuid | null",
  "costRoleId": "uuid",
  "isDefault": true,
  "effectiveFrom": "2026-01-01",
  "effectiveTo": "2026-12-31",
  "status": "ACTIVE | INACTIVE | ARCHIVED",
  "archivedAt": "instant | null",
  "archivedBy": "uuid | null",
  "version": 1,
  "createdAt": "instant",
  "updatedAt": "instant"
}
```

---

### POST `/api/rate-card/member-cost-roles`

Gán cost role cho workspace member.

**Status `201`**

**Request body:**
```json
{
  "workspaceId": "uuid",        // required
  "workspaceMemberId": "uuid",  // required
  "costRoleId": "uuid",         // required
  "isDefault": true,            // optional | boolean
  "effectiveFrom": "2026-01-01", // required | LocalDate
  "effectiveTo": "2026-12-31"   // optional | LocalDate
}
```

**Response `201`:** `MemberCostRoleResponse`

---

### GET `/api/rate-card/member-cost-roles`

Tìm kiếm. **`workspaceId` là required.**

**Query params:** `workspaceId` (required), `workspaceMemberId`, `userId`, `costRoleId`, `status`, `effectiveDate`, `page`, `size`

**Response `200`:** `PageResponse<MemberCostRoleResponse>`

---

### GET `/api/rate-card/member-cost-roles/{assignmentId}`

Chi tiết. **Response `200`:** `MemberCostRoleResponse`

---

### PUT `/api/rate-card/member-cost-roles/{assignmentId}`

Cập nhật.

**Request body:**
```json
{
  "costRoleId": "uuid",          // required
  "isDefault": false,            // optional
  "effectiveFrom": "2026-01-01", // required
  "effectiveTo": null            // optional
}
```

**Response `200`:** `MemberCostRoleResponse`

---

### PATCH `/api/rate-card/member-cost-roles/{assignmentId}/archive`

Archive. **Response `200`:** `MemberCostRoleResponse`

---

## 20. Rate Card — Cards

Base path: `/api/rate-card/cards`

**RateCardResponse:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "RC2026",
  "name": "Standard 2026",
  "description": null,
  "scope": "WORKSPACE",
  "organizationId": null,
  "workspaceId": "550e8400-e29b-41d4-a716-446655440001",
  "defaultCurrencyCode": "USD",
  "isDefault": false,
  "status": "DRAFT",
  "currentVersionId": null,
  "builtIn": false,
  "archivedAt": null,
  "archivedBy": null,
  "version": 1,
  "createdAt": "2026-07-17T03:00:00.000000Z",
  "updatedAt": "2026-07-17T03:00:00.000000Z"
}
```
> `status` enum: `DRAFT` | `ACTIVE` | `INACTIVE` | `ARCHIVED` · `scope` enum: `SYSTEM` | `ORGANIZATION` | `WORKSPACE` | `CLIENT` | `PROJECT`

---

### POST `/api/rate-card/cards`

Tạo rate card.

**Status `201`**

**Request body:**
```json
{
  "code": "RC2026",             // required | string
  "name": "Standard 2026",      // required | string
  "description": "string",      // optional
  "scope": "WORKSPACE",         // required | "SYSTEM" | "ORGANIZATION" | "WORKSPACE" | "CLIENT" | "PROJECT"
  "organizationId": "uuid",     // optional
  "workspaceId": "uuid",        // optional
  "clientId": "uuid",           // optional
  "projectId": "uuid",          // optional
  "defaultCurrencyCode": "USD", // required | string (ISO 4217)
  "isDefault": false            // optional | boolean
}
```

**Response `201`:** `RateCardResponse`

---

### GET `/api/rate-card/cards`

Tìm kiếm. **Query params:** `scope`, `organizationId`, `workspaceId`, `status`, `currency`, `code`, `page`, `size`

**Response `200`:** `PageResponse<RateCardResponse>`

---

### GET `/api/rate-card/cards/{rateCardId}`

Chi tiết. **Response `200`:** `RateCardResponse`

---

### PUT `/api/rate-card/cards/{rateCardId}`

Cập nhật.

**Request body:**
```json
{
  "name": "Updated Name",       // required
  "description": "string",       // optional
  "defaultCurrencyCode": "EUR"  // required
}
```

**Response `200`:** `RateCardResponse`

---

### PATCH `.../activate` · `.../deactivate` · `.../archive`

**Response `200`:** `RateCardResponse`

---

## 21. Rate Card — Versions

Base path: `/api/rate-card/cards/{rateCardId}/versions`

**RateCardVersionResponse:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "rateCardId": "550e8400-e29b-41d4-a716-446655440001",
  "versionNumber": 1,
  "name": "V1",
  "description": null,
  "effectiveFrom": "2026-01-01",
  "effectiveTo": "2026-12-31",
  "status": "DRAFT",
  "publishedAt": null,
  "publishedBy": null,
  "archivedAt": null,
  "archivedBy": null,
  "version": 1,
  "createdAt": "2026-07-17T03:00:00.000000Z",
  "updatedAt": "2026-07-17T03:00:00.000000Z"
}
```
> `status` enum: `DRAFT` | `PUBLISHED` | `ARCHIVED` · `effectiveFrom` / `effectiveTo` là date string `"YYYY-MM-DD"`

---

### POST `/api/rate-card/cards/{rateCardId}/versions`

Tạo version mới (bắt đầu ở DRAFT).

**Status `201`**

**Request body:**
```json
{
  "name": "V1",                  // optional
  "description": "string",        // optional
  "effectiveFrom": "2026-01-01",  // required | LocalDate
  "effectiveTo": "2026-12-31"     // optional | LocalDate
}
```

**Response `201`:** `RateCardVersionResponse`

---

### GET `/api/rate-card/cards/{rateCardId}/versions`

Danh sách versions. **Response `200`:** `List<RateCardVersionResponse>`

---

### GET `/api/rate-card/cards/{rateCardId}/versions/{versionId}`

Chi tiết version. **Response `200`:** `RateCardVersionResponse`

---

### PUT `/api/rate-card/cards/{rateCardId}/versions/{versionId}`

Cập nhật version (chỉ khi ở DRAFT).

**Request body:** Giống create nhưng tất cả optional trừ `effectiveFrom`.

---

### POST `/api/rate-card/cards/{rateCardId}/versions/{versionId}/publish`

Publish version (DRAFT → PUBLISHED). **Response `200`:** `RateCardVersionResponse`

---

### PATCH `/api/rate-card/cards/{rateCardId}/versions/{versionId}/archive`

Archive version. **Response `200`:** `RateCardVersionResponse`

---

### POST `/api/rate-card/cards/{rateCardId}/versions/{versionId}/duplicate`

Duplicate version (tạo DRAFT mới từ version hiện tại). **Response `200`:** `RateCardVersionResponse`

---

## 22. Rate Card — Lines

Base path: `/api/rate-card/cards/{rateCardId}/versions/{versionId}/lines`

**RateCardLineResponse:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "rateCardVersionId": "550e8400-e29b-41d4-a716-446655440001",
  "costRoleId": "550e8400-e29b-41d4-a716-446655440002",
  "seniorityLevel": "SENIOR",
  "locationCode": "VN",
  "currencyCode": "USD",
  "costRatePerHour": 80.00,
  "billingRatePerHour": 120.00,
  "notes": null,
  "version": 1,
  "createdAt": "2026-07-17T03:00:00.000000Z",
  "updatedAt": "2026-07-17T03:00:00.000000Z"
}
```

---

### POST `.../lines`

Thêm line vào version.

**Status `201`**

**Request body:**
```json
{
  "costRoleId": "uuid",           // required
  "seniorityLevel": "SENIOR",     // optional
  "locationCode": "VN",           // optional
  "currencyCode": "USD",          // required
  "costRatePerHour": 80.00,       // required | BigDecimal
  "billingRatePerHour": 120.00,   // optional | BigDecimal
  "notes": "string"               // optional
}
```

**Response `201`:** `RateCardLineResponse`

---

### GET `.../lines`

Danh sách lines. **Response `200`:** `List<RateCardLineResponse>`

---

### GET `.../lines/{lineId}`

Chi tiết. **Response `200`:** `RateCardLineResponse`

---

### PUT `.../lines/{lineId}`

Cập nhật line. **Request body:** Giống create. **Response `200`:** `RateCardLineResponse`

---

### DELETE `.../lines/{lineId}`

Xóa line. **Status `204`** · Không có response body.

---

## 23. Rate Card — Resolution

### POST `/api/rate-card/resolve`

Tìm rate snapshot phù hợp cho một context cụ thể (workspace/project/role/date).

**Request body:**
```json
{
  "workspaceId": "uuid",     // optional
  "organizationId": "uuid",  // optional
  "projectId": "uuid",       // optional
  "costRoleId": "uuid",      // optional (dùng ID hoặc code)
  "costRoleCode": "SWE",     // optional
  "targetDate": "2026-07-17", // required | LocalDate
  "currencyCode": "USD",     // optional
  "rateType": "COST"         // optional
}
```

**Response `200`:**
```json
{
  "data": {
    "rateCardId": "uuid",
    "rateCardVersionId": "uuid",
    "rateCardLineId": "uuid",
    "costRoleId": "uuid",
    "costRoleCode": "string",
    "baseCostRate": 80.00,
    "adjustedCostRate": 82.40,
    "baseBillingRate": 120.00,
    "adjustedBillingRate": 123.60,
    "currencyCode": "USD",
    "inflationPolicyId": "uuid | null",
    "inflationPercent": 3.0,
    "yearsForward": 0.5,
    "resolvedForDate": "2026-07-17",
    "resolvedAt": "instant"
  }
}
```

---

### POST `/api/rate-card/preview-task-rate`

Preview chi phí lao động ước tính cho một task.

**Request body:**
```json
{
  "taskId": "uuid",          // required
  "workspaceId": "uuid",     // optional
  "costRoleId": "uuid",      // optional
  "costRoleCode": "string",  // optional
  "targetDate": "2026-07-17", // optional | LocalDate
  "currencyCode": "USD"      // optional
}
```

**Response `200`:**
```json
{
  "data": {
    "taskId": "uuid",
    "estimateHours": 40.0,
    "rateSnapshot": { ... },       // RateSnapshotResponse — xem section trên
    "estimatedLaborCostPreview": 3296.00,
    "label": "string"
  }
}
```

---

## 24. Configuration — Object Types

### GET `/api/config/object-types`

Lấy danh sách object types có thể cấu hình custom fields/forms/tags.

**Auth required:** Có · **Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "PROJECT",
      "name": "Project",
      "customFieldsEnabled": true,
      "formsEnabled": true,
      "tagsEnabled": true,
      "customStatusEnabled": false,
      "enabled": true
    }
  ]
}
```

---

## 25. Configuration — Custom Fields

Base path: `/api/workspaces/{workspaceId}/config/custom-fields`

**CustomFieldDefinitionResponse:**
```json
{
  "id": "uuid",
  "objectTypeCode": "PROJECT",
  "fieldKey": "budget_owner",
  "label": "Budget Owner",
  "fieldType": "USER",
  "required": false,
  "sensitive": false,
  "clientVisible": false,
  "status": "DRAFT | ACTIVE | ARCHIVED"
}
```

**fieldType enum values:**
```
TEXT · LONG_TEXT · NUMBER · DECIMAL · CURRENCY · DATE · DATETIME ·
BOOLEAN · SELECT · MULTI_SELECT · USER · TEAM · EXTERNAL_CONTACT ·
EXTERNAL_ORGANIZATION · PROJECT · TASK · DOCUMENT · URL · EMAIL ·
PHONE · PERCENTAGE
```

---

### POST `/api/workspaces/{workspaceId}/config/custom-fields`

Tạo custom field.

**Request body:**
```json
{
  "objectTypeCode": "PROJECT",  // required | string (xem /api/config/object-types)
  "fieldKey": "budget_owner",   // required | string
  "label": "Budget Owner",      // required | string
  "fieldType": "USER",          // required | string (xem enum trên)
  "required": false,            // optional | boolean
  "sensitive": false,           // optional | boolean
  "clientVisible": false        // optional | boolean
}
```

**Response `200`:** `CustomFieldDefinitionResponse`

---

### GET `/api/workspaces/{workspaceId}/config/custom-fields`

Danh sách custom fields. **Response `200`:** `List<CustomFieldDefinitionResponse>`

---

### GET `/api/workspaces/{workspaceId}/config/custom-fields/{fieldId}`

Chi tiết. **Response `200`:** `CustomFieldDefinitionResponse`

---

## 26. Configuration — Field Options

Base path: `/api/workspaces/{workspaceId}/config/custom-fields/{fieldId}/options`

> Dùng cho field có `fieldType = SELECT` hoặc `MULTI_SELECT`.

**CustomFieldOptionResponse:**
```json
{
  "id": "uuid",
  "customFieldDefinitionId": "uuid",
  "optionCode": "OPEN",
  "label": "Open",
  "sortOrder": 1,
  "status": "ACTIVE | ARCHIVED"
}
```

---

### POST `.../options`

Thêm option.

**Request body:**
```json
{
  "optionCode": "OPEN",  // required | string
  "label": "Open",       // required | string
  "sortOrder": 1         // optional | int
}
```

**Response `200`:** `CustomFieldOptionResponse`

---

### GET `.../options`

Danh sách options. **Response `200`:** `List<CustomFieldOptionResponse>`

---

### PATCH `.../options/{optionId}/archive`

Archive option. **Response `200`:** `CustomFieldOptionResponse`

---

## 27. Configuration — Field Values

Base path: `/api/workspaces/{workspaceId}/config/custom-field-values`

**CustomFieldValueResponse:**
```json
{
  "id": "uuid",
  "customFieldDefinitionId": "uuid",
  "valueText": "string | null",
  "valueLongText": "string | null",
  "valueNumber": 42,
  "valueDecimal": 99.99,
  "valueBoolean": true,
  "valueDate": "2026-07-17",
  "valueDatetime": "instant | null",
  "valueJson": "json-string | null",
  "valueOptionIds": "uuid1,uuid2 | null"
}
```

---

### PUT `/api/workspaces/{workspaceId}/config/custom-field-values`

Upsert (tạo hoặc cập nhật) nhiều field values cho một object cùng lúc.

**Request body:**
```json
{
  "objectType": "PROJECT",  // required | string
  "targetId": "uuid",       // required | uuid (ID của object — project ID, task ID, ...)
  "values": [
    {
      "fieldId": "uuid",            // required
      "valueText": "Some text",     // optional (set field tương ứng với fieldType)
      "valueLongText": null,
      "valueNumber": null,
      "valueDecimal": null,
      "valueBoolean": null,
      "valueDate": null,
      "valueDatetime": null,
      "valueJson": null,
      "valueOptionIds": null        // comma-separated UUIDs cho multi-select
    }
  ]
}
```

**Response `200`:** `List<CustomFieldValueResponse>`

---

### GET `/api/workspaces/{workspaceId}/config/custom-field-values`

Lấy field values của một object.

**Query params:** `objectType` (required), `targetId` (required)

**Response `200`:** `List<CustomFieldValueResponse>`

---

### Shortcut: GET/PUT `/api/projects/{projectId}/custom-fields`

Cùng tính năng nhưng scoped theo project. Không cần truyền `workspaceId` hay `objectType`.

**GET:** `List<CustomFieldValueResponse>`

**PUT:** body giống Upsert ở trên → trả `List<CustomFieldValueResponse>`

---

### Shortcut: GET/PUT `/api/projects/{projectId}/custom-fields/by-target`

Dành cho nested object trong project (vd: task trong project).

**Query params (GET):** `objectType` (required), `targetId` (required)

---

## 28. Configuration — Field Visibility

Base path: `/api/workspaces/{workspaceId}/config/custom-fields/{fieldId}/visibility-policies`

**FieldVisibilityPolicyResponse:**
```json
{
  "id": "uuid",
  "workspaceId": "uuid",
  "customFieldDefinitionId": "uuid",
  "audienceType": "string",
  "visible": true,
  "createdAt": "instant",
  "updatedAt": "instant"
}
```

---

### PUT `.../visibility-policies`

Set visibility policy cho field theo audience type.

**Request body:**
```json
{
  "audienceType": "CLIENT",  // required | string (vd: "INTERNAL", "CLIENT")
  "visible": true            // required | boolean
}
```

**Response `200`:** `FieldVisibilityPolicyResponse`

---

### GET `.../visibility-policies`

Danh sách policies của field. **Response `200`:** `List<FieldVisibilityPolicyResponse>`

---

## 29. Configuration — Forms & Versions

Base path: `/api/workspaces/{workspaceId}/config/forms`

**CustomFormDefinitionResponse:**
```json
{
  "id": "uuid",
  "formCode": "string",
  "name": "string",
  "objectTypeCode": "string",
  "formType": "string | null",
  "status": "string",
  "currentVersionId": "uuid | null"
}
```

**CustomFormVersionResponse:**
```json
{
  "id": "uuid",
  "formDefinitionId": "uuid",
  "versionNumber": 1,
  "status": "DRAFT | PUBLISHED | ARCHIVED",
  "currentFlag": true,
  "publishedAt": "instant | null"
}
```

---

### POST `/api/workspaces/{workspaceId}/config/forms`

Tạo form.

**Request body:**
```json
{
  "formCode": "PROJECT_INTAKE",   // required
  "name": "Project Intake Form",  // required
  "objectTypeCode": "PROJECT",    // required
  "formType": "INTAKE",           // optional
  "projectId": "uuid"             // optional
}
```

**Response `200`:** `CustomFormDefinitionResponse`

---

### GET `/api/workspaces/{workspaceId}/config/forms`

Danh sách forms. **Response `200`:** `List<CustomFormDefinitionResponse>`

---

### GET `/api/workspaces/{workspaceId}/config/forms/{formId}`

Chi tiết form. **Response `200`:** `CustomFormDefinitionResponse`

---

### POST `/api/workspaces/{workspaceId}/config/forms/{formId}/versions`

Tạo version mới (DRAFT).

**Request body:** Không có

**Response `200`:** `CustomFormVersionResponse`

---

### GET `/api/workspaces/{workspaceId}/config/forms/{formId}/versions`

Danh sách versions. **Response `200`:** `List<CustomFormVersionResponse>`

---

### POST `/api/workspaces/{workspaceId}/config/forms/{formId}/versions/{versionId}/publish`

Publish version. **Response `200`:** `CustomFormVersionResponse`

---

## 30. Configuration — Form Sections & Fields

### Form Sections

Base path: `/api/workspaces/{workspaceId}/config/forms/{formId}/versions/{versionId}/sections`

**CustomFormSectionResponse:**
```json
{
  "id": "uuid",
  "formVersionId": "uuid",
  "title": "string",
  "sortOrder": 1
}
```

#### POST

**Request body:**
```json
{
  "title": "Project Details",  // required
  "sortOrder": 1               // optional
}
```

#### GET — `List<CustomFormSectionResponse>`

---

### Form Fields

Base path: `/api/workspaces/{workspaceId}/config/forms/{formId}/versions/{versionId}/fields`

**CustomFormFieldResponse:**
```json
{
  "id": "uuid",
  "formVersionId": "uuid",
  "sectionId": "uuid | null",
  "fieldSource": "CORE_FIELD | CUSTOM_FIELD | READONLY_DISPLAY | INSTRUCTION_TEXT | SEPARATOR",
  "customFieldDefinitionId": "uuid | null",
  "requiredOnForm": false,
  "sortOrder": 1
}
```

#### POST

**Request body:**
```json
{
  "fieldSource": "CUSTOM_FIELD",           // required
  "sectionId": "uuid",                      // optional
  "customFieldDefinitionId": "uuid",        // optional (nếu CUSTOM_FIELD)
  "coreFieldKey": "string",                 // optional (nếu CORE_FIELD)
  "requiredOnForm": false,                  // optional
  "readonlyFlag": false,                    // optional
  "sortOrder": 1                            // optional
}
```

#### GET — `List<CustomFormFieldResponse>`

---

## 31. Configuration — Form Submissions

Base path: `/api/workspaces/{workspaceId}/config/forms/{formId}/submit`

**FormSubmissionResponse:**
```json
{
  "id": "uuid",
  "formDefinitionId": "uuid",
  "formVersionId": "uuid",
  "validationStatus": "string",
  "status": "string"
}
```

---

### POST `/api/workspaces/{workspaceId}/config/forms/{formId}/submit`

Nộp form.

**Request body:**
```json
{
  "formVersionId": "uuid",     // required
  "objectTypeCode": "string",  // optional
  "targetId": "uuid",          // optional
  "projectId": "uuid",         // optional
  "payloadJson": "{...}"       // required | JSON string chứa các field values
}
```

**Response `200`:** `FormSubmissionResponse`

---

### GET `/api/workspaces/{workspaceId}/config/form-submissions`

Danh sách submissions. **Response `200`:** `List<FormSubmissionResponse>`

---

### GET `/api/workspaces/{workspaceId}/config/form-submissions/{submissionId}`

Chi tiết. **Response `200`:** `FormSubmissionResponse`

---

## 32. Configuration — Layouts

Base path: `/api/workspaces/{workspaceId}/config/layouts`

**LayoutDefinitionResponse:**
```json
{
  "id": "uuid",
  "objectTypeCode": "string",
  "layoutType": "DETAIL | CREATE_FORM | EDIT_FORM | PORTAL_DETAIL | LIST_COLUMNS | BOARD_CARD",
  "name": "string",
  "status": "DRAFT | PUBLISHED | ARCHIVED",
  "currentFlag": false
}
```

---

### POST

Tạo layout.

**Request body:**
```json
{
  "objectTypeCode": "PROJECT",  // required
  "layoutType": "LIST_COLUMNS", // required
  "name": "Default List View",  // required
  "layoutJson": "{...}"         // required | JSON string định nghĩa cấu trúc layout
}
```

**Response `200`:** `LayoutDefinitionResponse`

---

### GET

Danh sách layouts. **Response `200`:** `List<LayoutDefinitionResponse>`

---

### POST `/{layoutId}/publish`

Publish layout. **Response `200`:** `LayoutDefinitionResponse`

---

## 33. Configuration — Status Sets

Base path: `/api/workspaces/{workspaceId}/config/status-sets`

**StatusSetResponse:**
```json
{
  "id": "uuid",
  "objectTypeCode": "string",
  "setCode": "string",
  "name": "string",
  "status": "ACTIVE | ARCHIVED"
}
```

**StatusValueResponse:**
```json
{
  "id": "uuid",
  "statusSetId": "uuid",
  "valueCode": "string",
  "label": "string",
  "domainCategory": "string"
}
```

---

### POST `/api/workspaces/{workspaceId}/config/status-sets`

Tạo status set.

**Request body:**
```json
{
  "objectTypeCode": "TASK",      // required
  "setCode": "TASK_STATUS",      // required
  "name": "Task Status Workflow" // required
}
```

---

### GET

Danh sách. **Response `200`:** `List<StatusSetResponse>`

---

### POST `/{setId}/values`

Thêm status value vào set.

**Request body:**
```json
{
  "valueCode": "IN_PROGRESS",    // required
  "label": "In Progress",        // required
  "domainCategory": "ACTIVE",    // required (vd: PENDING, ACTIVE, DONE, CANCELLED)
  "sortOrder": 2                 // optional
}
```

**Response `200`:** `StatusValueResponse`

---

### GET `/{setId}/values`

Danh sách values. **Response `200`:** `List<StatusValueResponse>`

---

## 34. Configuration — Tags

Base path: `/api/workspaces/{workspaceId}/config/tags`

**TagDefinitionResponse:**
```json
{
  "id": "uuid",
  "tagCode": "string",
  "label": "string",
  "color": "#FF5733",
  "status": "ACTIVE | ARCHIVED"
}
```

---

### POST

Tạo tag.

**Request body:**
```json
{
  "tagCode": "URGENT",                  // required
  "label": "Urgent",                    // required
  "color": "#FF0000",                   // optional | hex color
  "allowedObjectTypesJson": "[\"PROJECT\",\"TASK\"]"  // optional | JSON array string
}
```

---

### GET — `List<TagDefinitionResponse>`

### GET `/{tagId}` — `TagDefinitionResponse`

---

### Tag Assignments

Base path: `/api/workspaces/{workspaceId}/config/tag-assignments`

**TagAssignmentResponse:**
```json
{
  "id": "uuid",
  "tagDefinitionId": "uuid",
  "objectTypeCode": "string",
  "targetId": "uuid"
}
```

#### POST — Gán tag

```json
{
  "tagDefinitionId": "uuid",   // required
  "objectTypeCode": "PROJECT", // required
  "targetId": "uuid"           // required
}
```

#### GET — `List<TagAssignmentResponse>`

#### DELETE `/{assignmentId}` — Xóa tag assignment · Status `200` · `null data`

---

## 35. Configuration — Taxonomies

Base path: `/api/workspaces/{workspaceId}/config/taxonomies`

**TaxonomyResponse:**
```json
{
  "id": "uuid",
  "taxonomyCode": "string",
  "name": "string",
  "status": "ACTIVE | ARCHIVED"
}
```

**TaxonomyTermResponse:**
```json
{
  "id": "uuid",
  "taxonomyId": "uuid",
  "parentTermId": "uuid | null",
  "termCode": "string",
  "label": "string"
}
```

---

### POST

Tạo taxonomy.

```json
{
  "taxonomyCode": "TECH_STACK",  // required
  "name": "Technology Stack"     // required
}
```

---

### GET — `List<TaxonomyResponse>`

---

### POST `/{taxonomyId}/terms`

Thêm term (hỗ trợ hierarchy qua `parentTermId`).

```json
{
  "termCode": "JAVA",         // required
  "label": "Java",            // required
  "parentTermId": "uuid"      // optional — null nếu là root term
}
```

---

### GET `/{taxonomyId}/terms` — `List<TaxonomyTermResponse>`

---

## 36. Configuration — Validation Rules

Base path: `/api/workspaces/{workspaceId}/config/custom-fields/{fieldId}/validation-rules`

**CustomFieldValidationRuleResponse:**
```json
{
  "id": "uuid",
  "customFieldDefinitionId": "uuid",
  "ruleType": "MIN_LENGTH | MAX_LENGTH | MIN_VALUE | MAX_VALUE | REGEX | REQUIRED | UNIQUE | ALLOWED_VALUES | DATE_RANGE",
  "ruleConfigJson": "{...}",
  "status": "string"
}
```

---

### POST

Thêm validation rule cho field.

**Request body:**
```json
{
  "ruleType": "MAX_LENGTH",             // required
  "ruleConfigJson": "{\"max\": 255}"    // optional | JSON string cấu hình rule
}
```

---

### GET — `List<CustomFieldValidationRuleResponse>`

---

### DELETE `/api/workspaces/{workspaceId}/config/custom-field-validation-rules/{ruleId}`

Xóa rule. **Response `200`:** `null data`

---

## Tổng kết nhanh

| Module | Số endpoint | Ghi chú |
|---|---|---|
| IAM Auth | 6 | Cookie-based JWT, không cần Bearer header |
| IAM Users | 7 | CRUD + lifecycle |
| IAM Roles | 7 | CRUD + lifecycle, system & workspace scope |
| IAM Permissions & Rights | 6 | Read-only từ FE perspective (seeded) |
| IAM Role Assignments | 5 | Gán role cho user/team |
| IAM Grants | 13 | Fine-grained access control |
| IAM Authorization | 4 | Check quyền real-time |
| IAM Me / Audit | 2 | Current user + audit log |
| Workspace Organizations | 6 | CRUD + lifecycle |
| Workspace Workspaces | 6 | CRUD + lifecycle |
| Workspace Members | 4 | Add/remove/status |
| Workspace Teams | 9 | CRUD + lifecycle + members (DEPRECATED nhưng vẫn dùng) |
| External Party | 6 | Organizations + Contacts |
| Rate Card Core | 7 | Cost roles |
| Rate Card Policies | 7 | Inflation policies |
| Rate Card Members | 4 | Member cost role assignments |
| Rate Card Cards | 7 | Rate card CRUD |
| Rate Card Versions | 6 | Version lifecycle |
| Rate Card Lines | 5 | Line items |
| Rate Card Resolve | 2 | Rate resolution + preview |
| Config Object Types | 1 | Lookup |
| Config Custom Fields | 3 | Field definition |
| Config Options | 3 | Dropdown options |
| Config Values | 4 | Field values (+ project shortcuts) |
| Config Visibility | 2 | Field visibility |
| Config Forms | 8 | Forms + versions |
| Config Form Structure | 4 | Sections + fields |
| Config Submissions | 3 | Form submissions |
| Config Layouts | 3 | UI layouts |
| Config Status Sets | 4 | Custom status workflows |
| Config Tags | 6 | Tags + assignments |
| Config Taxonomies | 4 | Hierarchical taxonomies |
| Config Validation Rules | 3 | Field validation |
| **TỔNG** | **~160** | |

**WebSocket:** Không có trong Wave 1. Tất cả là REST HTTP.
