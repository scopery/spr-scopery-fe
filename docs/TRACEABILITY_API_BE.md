# Traceability API — Contract cho Backend

FE đã gọi đầy đủ các endpoint Traceability. Backend cần implement đúng contract dưới đây để **tạo node** và **tạo link** hoạt động.

**Base URL:** `NEXT_PUBLIC_API_URL` (vd. `http://localhost:3000`)  
**Prefix:** Tất cả dưới `/api/v2`  
**Auth:** `Authorization: Bearer <access_token>`

---

## 1. Tạo Node (Landscape — tab Nodes)

**Method:** `POST`  
**URL:** `{BASE}/api/v2/orgs/{orgId}/nodes`  
**Body (JSON):**

```json
{
  "parent_id": null,
  "node_type": "module",
  "code": "MOD-A",
  "name": "Module A",
  "description": "Optional description"
}
```

- `parent_id`: `null` (root) hoặc UUID của node cha.
- `node_type`: `system` | `subsystem` | `module`
- `code`: bắt buộc, unique trong org.
- `name`: bắt buộc.
- `description`: optional.

**Response 201:** Object node (vd. `id`, `org_id`, `parent_id`, `node_type`, `code`, `name`, `description`, `status`, `created_at`).

**Lỗi FE xử lý:**
- **422** + `errors[]`: map vào field (vd. `path: "code"`).
- **409** + `code: "NODE_CODE_EXISTS"`: highlight field `code`.

**Quyền:** Chỉ org **owner** được gọi (403 nếu member/partner).

---

## 2. Tạo Node Link (Landscape — tab Links)

**Method:** `POST`  
**URL:** `{BASE}/api/v2/orgs/{orgId}/node-links`  
**Body (JSON):**

```json
{
  "from_node_id": "uuid",
  "to_node_id": "uuid",
  "link_type": "depends_on"
}
```

- `from_node_id`, `to_node_id`: UUID của org_node (phải khác nhau, thuộc cùng org).
- `link_type`: `integrates_with` | `shares_data_with` | `depends_on` | `relates_to`

**Response 201:** Object link (vd. `id`, `org_id`, `from_node_id`, `to_node_id`, `link_type`, `created_at`).

**Lỗi FE xử lý:**
- **409** + `code: "LINK_EXISTS"`: toast "Liên kết giữa hai node này đã tồn tại."

**Quyền:** Chỉ org **owner**.

---

## 3. Sửa Node Link (Landscape — tab Links)

**Method:** `PATCH`  
**URL:** `{BASE}/api/v2/orgs/{orgId}/node-links/{linkId}`  
**Body (JSON):**

```json
{
  "link_type": "depends_on",
  "note": "Optional note or null"
}
```

- `link_type`: optional — `integrates_with` | `shares_data_with` | `depends_on` | `relates_to`.
- `note`: optional — string hoặc null.

**Response 200:** Object link cập nhật (vd. `id`, `from_node_id`, `to_node_id`, `link_type`, `note`, `created_at`).

**Quyền:** Chỉ org **owner**.

---

## 4. Trace Links (trang Trace — Manage trace links)

FE gọi đủ CRUD trace links. BE cần implement các endpoint sau.

### 4.1 List trace links

**Method:** `GET`  
**URL:** `{BASE}/api/v2/orgs/{orgId}/projects/{projectId}/trace-links`

**Response 200:** Mảng trace link (vd. `id`, `from_type`, `from_id`, `to_type`, `to_id`, `link_type`, `note`, `project_id`, `created_at`).

### 4.2 Tạo trace link

**Method:** `POST`  
**URL:** `{BASE}/api/v2/orgs/{orgId}/projects/{projectId}/trace-links`  
**Body (JSON):**

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
- `from_id`, `to_id`: UUID (requirement id hoặc org_node id).
- `link_type`: vd. `implements`, `satisfies`, `relates_to`, `traces_to`.
- `note`: optional. `project_id`: optional (null = org-level).

**Response 201:** Object trace link.

**Lỗi FE xử lý:** **409** + `code: "TRACE_LINK_EXISTS"` — link trùng (cùng from/to) đã tồn tại.

### 4.3 Sửa trace link

**Method:** `PATCH`  
**URL:** `{BASE}/api/v2/orgs/{orgId}/projects/{projectId}/trace-links/{linkId}`  
**Body (JSON):**

```json
{
  "link_type": "satisfies",
  "note": "Updated note or null"
}
```

- `link_type`, `note`: optional.

**Response 200:** Object trace link cập nhật.

### 4.4 Xóa trace link

**Method:** `DELETE`  
**URL:** `{BASE}/api/v2/orgs/{orgId}/projects/{projectId}/trace-links/{linkId}`

**Response 204:** No content.

**Quyền trace links:** Chỉ **editor** hoặc **owner** của project.

---

## 5. Các endpoint khác FE đang dùng

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/v2/orgs/:orgId/nodes?type=&status=` | List nodes (filter type, status) |
| PATCH | `/api/v2/orgs/:orgId/nodes/:nodeId` | Cập nhật node (name, description, status) |
| DELETE | `/api/v2/orgs/:orgId/nodes/:nodeId` | Archive node (409 NODE_HAS_CHILDREN, NODE_IN_USE) |
| GET | `/api/v2/orgs/:orgId/node-links` | List links |
| **PATCH** | **`/api/v2/orgs/:orgId/node-links/:linkId`** | **Sửa link (link_type, note)** |
| DELETE | `/api/v2/orgs/:orgId/node-links/:linkId` | Xóa link |
| GET | `/api/v2/orgs/:orgId/projects/:projectId/scope` | Lấy project scope |
| PUT | `/api/v2/orgs/:orgId/projects/:projectId/scope` | Replace-all scope |
| GET | `/api/v2/orgs/:orgId/projects/:projectId/trace` | Full trace view |
| **GET** | **`.../trace-links`** | **List trace links** |
| **POST** | **`.../trace-links`** | **Tạo trace link (409 TRACE_LINK_EXISTS)** |
| **PATCH** | **`.../trace-links/:linkId`** | **Sửa trace link** |
| **DELETE** | **`.../trace-links/:linkId`** | **Xóa trace link** |

---

## 6. Kiểm tra nhanh

- **Env:** `.env` có `NEXT_PUBLIC_API_URL` trỏ đúng server BE (vd. `http://localhost:3000`).
- **BE:** Có route `POST /api/v2/orgs/:orgId/nodes`, `POST /api/v2/orgs/:orgId/node-links`, **PATCH node-links/:linkId**, và **trace-links** (GET/POST/PATCH/DELETE) trả đúng status + body.
- **Auth:** Request gửi header `Authorization: Bearer <token>` (FE lấy từ session cookie).

Nếu BE chưa có các route trên, FE sẽ nhận 404 hoặc 501 khi thao tác Create/Edit node, Create/Edit/Delete link, hoặc Manage trace links.
