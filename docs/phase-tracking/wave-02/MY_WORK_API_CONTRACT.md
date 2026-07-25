# My Work API — Contract (FE → BE)

> **Status:** Proposed (not implemented)  
> **Source:** Wave 2 gap — `GET /workspaces/{workspaceId}/my-work`  
> **Consumers:** Workspace **My Work** page; optional chips on project Work Items  
> **Path style:** Unversioned `/api/...` (matches FE `apiPath()`, not `/api/v1`)

---

## 1. Mục tiêu UI

Trang workspace **My Work** để user xem / quản lý **task được gán cho mình** (`inChargeUserId`), đặc biệt **tuần này**, với deep-link:

```text
/workspace/{workspaceId}/projects/{projectId}/work/{taskId}
```

**Auth:** BE resolve user từ principal (HttpOnly cookie session). **Không** truyền `userId` trên query. Chỉ trả task với `inChargeUserId === currentUser`.

```text
My Work page
  → GET /api/workspaces/{workspaceId}/my-work
  → items[] (MyWorkTask)
  → deep-link Work Items drawer
```

---

## 2. Primary API (bắt buộc)

### `GET /api/workspaces/{workspaceId}/my-work`

| | |
|---|---|
| **Auth** | Authenticated workspace member |
| **Permission** | Read tasks where the caller is assignee |
| **Envelope** | `{ "success": true, "data": MyWorkResponse, "timestamp": "..." }` |

### Query params

| Param | Type | Default | Mô tả |
|-------|------|---------|--------|
| `window` | enum | `THIS_WEEK` | Preset thời gian (xem bảng dưới) |
| `dateFrom` | `YYYY-MM-DD` | — | Bắt buộc khi `window=CUSTOM` |
| `dateTo` | `YYYY-MM-DD` | — | Bắt buộc khi `window=CUSTOM` |
| `status` | string \| string[] | — | Filter status (`TODO`, `IN_PROGRESS`, …). Multi: repeated param hoặc CSV |
| `projectId` | UUID | — | Giới hạn 1 project |
| `includeCompleted` | boolean | `false` | Có trả `COMPLETED` không |
| `page` | int | `0` | 0-based |
| `size` | int | `50` | Max **100** |

### `window` values

| Value | Semantics |
|-------|-----------|
| `THIS_WEEK` | Tuần hiện tại (Mon–Sun **hoặc** locale week) chứa “today” |
| `OVERDUE` | `dueDate < today` và status chưa complete / cancel / archive |
| `UPCOMING` | `dueDate` (hoặc `plannedStartDate`) trong **N = 14** ngày tới |
| `ALL_OPEN` | Mọi task open của user — **không** áp date window |
| `CUSTOM` | Dùng `dateFrom` / `dateTo` |

**Timezone:** BE phải chốt và document (đề xuất: workspace timezone, fallback UTC date). Response luôn echo `dateFrom` / `dateTo` đã resolve để FE hiển thị.

### Rule match “trong window”

Task thuộc window nếu **bất kỳ** điều kiện sau đúng:

1. `dueDate` ∈ `[dateFrom, dateTo]`, hoặc  
2. `plannedStartDate` ∈ `[dateFrom, dateTo]`, hoặc  
3. Khoảng `[plannedStartDate, dueDate]` **overlap** `[dateFrom, dateTo]`

Task **không có** cả `dueDate` lẫn `plannedStartDate`:

| Window | Behavior |
|--------|----------|
| `THIS_WEEK` / `CUSTOM` / `UPCOMING` | **Loại trừ** khỏi `items` (vẫn có thể đếm trong `summary.undated` nếu BE muốn surface) |
| `ALL_OPEN` | **Bao gồm** |
| `OVERDUE` | Loại trừ (không due → không overdue) |

### Default sort

1. `isOverdue` DESC  
2. `dueDate` ASC NULLS LAST  
3. `priority` (CRITICAL → LOW)  
4. `updatedAt` DESC  

---

## 3. Response schema

### `MyWorkResponse`

```json
{
  "workspaceId": "<uuid>",
  "userId": "<uuid>",
  "window": "THIS_WEEK",
  "dateFrom": "2026-07-20",
  "dateTo": "2026-07-26",
  "summary": {
    "total": 12,
    "overdue": 2,
    "dueThisWindow": 7,
    "inProgress": 4,
    "todo": 5,
    "blocked": 1,
    "undated": 2
  },
  "items": [
    {
      "taskId": "<uuid>",
      "projectId": "<uuid>",
      "projectCode": "PRJ-01",
      "projectName": "Scopery V2",
      "code": "TASK-012",
      "title": "Finalize API contract",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "inChargeUserId": "<uuid>",
      "plannedStartDate": "2026-07-21",
      "dueDate": "2026-07-24",
      "estimateHours": 8.0,
      "projectPhaseId": "<uuid>",
      "projectPhaseName": "Build",
      "wbsNodeId": null,
      "scheduleStatus": "SCHEDULED",
      "estimatedStartDate": "2026-07-21",
      "estimatedFinishDate": "2026-07-23",
      "isOverdue": false,
      "updatedAt": "2026-07-22T04:12:00Z"
    }
  ],
  "page": {
    "page": 0,
    "size": 50,
    "totalElements": 12,
    "totalPages": 1
  }
}
```

### Field requirements

| Field | Required | UI use |
|-------|----------|--------|
| `workspaceId`, `userId` | yes | Context / debug |
| `window`, `dateFrom`, `dateTo` | yes | Header + chips |
| `summary.*` | yes | Stat chips |
| `items[].taskId`, `projectId`, `code`, `title`, `status`, `priority` | yes | List row |
| `items[].projectCode`, `projectName` | yes | Group / badge (tránh N+1) |
| `items[].plannedStartDate`, `dueDate` | nullable | Date columns |
| `items[].isOverdue` | yes | Overdue badge |
| `items[].projectPhaseId`, `projectPhaseName` | nullable | Phase context |
| `items[].wbsNodeId` | nullable | Optional link |
| `items[].estimateHours` | nullable | Effort |
| `items[].scheduleStatus`, `estimatedStartDate`, `estimatedFinishDate` | optional | Timeline hint; omit/null OK nếu không có schedule run |
| `items[].inChargeUserId` | yes | Always current user for this API |
| `items[].updatedAt` | yes | Sort / freshness |
| `page` | yes | Pagination |

### TypeScript shapes (FE target)

```typescript
export type MyWorkWindow =
  | 'THIS_WEEK'
  | 'OVERDUE'
  | 'UPCOMING'
  | 'ALL_OPEN'
  | 'CUSTOM'

export interface MyWorkSummary {
  total: number
  overdue: number
  dueThisWindow: number
  inProgress: number
  todo: number
  blocked: number
  undated: number
}

export interface MyWorkTaskItem {
  taskId: string
  projectId: string
  projectCode: string
  projectName: string
  code: string
  title: string
  status: string
  priority: string
  inChargeUserId: string
  plannedStartDate: string | null
  dueDate: string | null
  estimateHours: number | null
  projectPhaseId: string | null
  projectPhaseName: string | null
  wbsNodeId: string | null
  scheduleStatus?: string | null
  estimatedStartDate?: string | null
  estimatedFinishDate?: string | null
  isOverdue: boolean
  updatedAt: string
}

export interface MyWorkResponse {
  workspaceId: string
  userId: string
  window: MyWorkWindow
  dateFrom: string
  dateTo: string
  summary: MyWorkSummary
  items: MyWorkTaskItem[]
  page: {
    page: number
    size: number
    totalElements: number
    totalPages: number
  }
}
```

---

## 4. API phụ (nên có — không block MVP My Work page)

### Extend `GET /api/projects/{projectId}/tasks`

Thêm query params:

| Param | Type | Mô tả |
|-------|------|--------|
| `inChargeUserId` | UUID | Filter assignee |
| `dueFrom` | `YYYY-MM-DD` | Inclusive |
| `dueTo` | `YYYY-MM-DD` | Inclusive |
| `plannedStartFrom` | `YYYY-MM-DD` | Optional |
| `plannedStartTo` | `YYYY-MM-DD` | Optional |

**Use case FE:** chips **Mine** + **This week** trên project Work Items (`ProjectWorkItemsView`) mà không cần aggregate workspace.

Response shape giữ `TaskResponse` / page hiện tại — chỉ thêm filter server-side.

---

## 5. Errors

| Status | Khi nào |
|--------|---------|
| `401` | Chưa auth |
| `403` | Không phải member workspace |
| `400` | `window=CUSTOM` thiếu `dateFrom`/`dateTo`; `dateTo < dateFrom`; `window` invalid; `size > 100` |
| `404` | Workspace không tồn tại |

Error body: cùng convention hiện tại (problem details / `{ success: false, ... }`).

---

## 6. Out of scope (MVP)

- Mutation trên My Work (start / complete / update) — tái sử dụng task APIs theo `projectId` + `taskId`
- Realtime / SSE
- Cross-workspace aggregate
- Group-by-day payload riêng (FE group từ `items` + `dueDate`)

---

## 7. FE plan khi API sẵn sàng

| Piece | Detail |
|-------|--------|
| Route | `/workspace/{workspaceId}/my-work` (cạnh Work Inbox) |
| Hook | `useMyWork(workspaceId, { window, status, projectId, page, size })` |
| UI | Summary chips + list (group by project hoặc by day) |
| Navigation | Click row → `ROUTES.workspace.projectWorkTask(workspaceId, projectId, taskId)` |

**Hiện tại:** FE **chưa** implement UI — đợi BE ship endpoint (hoặc mock đúng shape trên).

---

## 8. Acceptance checklist (BE)

- [ ] `GET /api/workspaces/{workspaceId}/my-work` returns envelope + `MyWorkResponse`
- [ ] Default `window=THIS_WEEK` resolves and echoes `dateFrom` / `dateTo`
- [ ] Only tasks with `inChargeUserId = currentUser`
- [ ] `includeCompleted=false` excludes completed (and cancel/archive as agreed)
- [ ] `OVERDUE` / `UPCOMING` / `ALL_OPEN` / `CUSTOM` behave as specified
- [ ] `projectCode` + `projectName` present on every item
- [ ] Pagination `page` / `size` / `totalElements` / `totalPages` correct
- [ ] (Optional) Task list filters: `inChargeUserId`, `dueFrom`, `dueTo`

---

## 9. Related docs

- Gap note: [`SCOPERY_WAVE2_UI_UX_IMPLEMENTATION_SPEC.md`](./SCOPERY_WAVE2_UI_UX_IMPLEMENTATION_SPEC.md) §18–19  
- Task list today: [`WAVE2_API_CONTRACT.md`](./WAVE2_API_CONTRACT.md) §1.4 (missing assignee/date filters)
