# Wave 2 API Contract — Project · Scope · RAID · Collaboration · Notification

> **Mục đích:** Tài liệu tham chiếu đầy đủ cho FE ráp UI Wave 2.
> **Swagger live:** `http://localhost:8080/swagger-ui.html`
> **OpenAPI JSON:** `http://localhost:8080/v3/api-docs`

---

## Conventions

### Response wrapper

Mọi response đều bọc trong `ApiResponse`:

```json
{ "success": true, "data": { ... }, "timestamp": "2026-07-17T13:00:00.000000+07:00" }
```

Paginated list:
```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 0,
    "size": 20,
    "totalElements": 0,
    "totalPages": 0,
    "first": true,
    "last": true
  },
  "timestamp": "2026-07-17T13:00:00.000000+07:00"
}
```

Flat list (không pagination): `"data": [...]`

Error:
```json
{
  "success": false,
  "errorCode": "RESOURCE_NOT_FOUND",
  "message": "...",
  "details": [],
  "traceId": "aa231618-...",
  "timestamp": "2026-07-17T13:00:00Z"
}
```

### Quy tắc đọc schema

| Ký hiệu | Ví dụ thực tế |
|---|---|
| `"<uuid>"` | `"550e8400-e29b-41d4-a716-446655440000"` |
| `"<instant>"` | `"2026-07-17T06:00:00.000000Z"` |
| `"<date>"` | `"2026-07-17"` |
| `null` | xuất hiện trong JSON là `null`, không bị omit |
| `timestamp` trong ApiResponse | dùng `OffsetDateTime`, có offset `+07:00` hoặc `Z` |

### Auth

Cookie HTTP-only: `access_token` + `refresh_token`. Mọi endpoint đều yêu cầu auth trừ khi ghi rõ Public.

---

## Module Index

| Module | Base path | Số endpoint |
|---|---|---|
| [Project](#1-project) | `/api/v1/projects` | ~80 |
| [Scope](#2-scope) | `/api/v1/projects/{projectId}/...` | ~33 |
| [RAID](#3-raid) | `/api/v1/projects/{projectId}/...` | ~42 |
| [Collaboration](#4-collaboration) | `/api/v1/projects/{projectId}/...` | ~66 |
| [Notification](#5-notification) | `/api/v1/notifications`, `/api/v1/notification/...`, `/api/v1/workspaces/{workspaceId}/notifications/...` | ~63 |

---

# 1. Project

## 1.1 Project

**Base:** `/api/v1/projects`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `/api/v1/projects` | Tạo project | `CreateProjectRequest` |
| GET | `/api/v1/projects/{id}` | Lấy project | — |
| GET | `/api/v1/projects` | Tìm kiếm projects | query params |
| PUT | `/api/v1/projects/{id}` | Cập nhật project | `UpdateProjectRequest` |
| PATCH | `/api/v1/projects/{id}/activate` | Kích hoạt | — |
| PATCH | `/api/v1/projects/{id}/hold` | Tạm dừng | — |
| PATCH | `/api/v1/projects/{id}/complete` | Hoàn thành | — |
| PATCH | `/api/v1/projects/{id}/archive` | Lưu trữ | — |

**GET /api/v1/projects — Query params:**

| Param | Type | Required |
|---|---|---|
| workspaceId | UUID | ✅ |
| keyword | String | — |
| status | String | — |
| page | int (default 0) | — |
| size | int (default 20) | — |

**CreateProjectRequest:**
```json
{
  "workspaceId": "<uuid>",
  "code": "PRJ-001",
  "name": "Digital Transformation 2026",
  "description": "...",
  "ownerUserId": "<uuid>",
  "defaultCurrency": "VND",
  "plannedStartDate": "<date>",
  "plannedEndDate": "<date>"
}
```

**UpdateProjectRequest:**
```json
{
  "name": "Digital Transformation 2026",
  "description": "...",
  "ownerUserId": "<uuid>",
  "defaultCurrency": "VND",
  "plannedStartDate": "<date>",
  "plannedEndDate": "<date>"
}
```

**ProjectResponse:**
```json
{
  "id": "<uuid>",
  "workspaceId": "<uuid>",
  "organizationId": "<uuid>",
  "code": "PRJ-001",
  "name": "Digital Transformation 2026",
  "description": null,
  "ownerUserId": "<uuid>",
  "defaultCurrency": "VND",
  "plannedStartDate": "<date>",
  "plannedEndDate": "<date>",
  "status": "DRAFT",
  "activatedAt": null,
  "activatedBy": null,
  "archivedAt": null,
  "archivedBy": null,
  "sourceTemplateId": null,
  "sourceTemplateVersionId": null,
  "sourceTemplateAppliedAt": null,
  "version": 1,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

> **status values:** `DRAFT` | `ACTIVE` | `ON_HOLD` | `COMPLETED` | `ARCHIVED`

---

## 1.2 Project Phase

**Base:** `/api/v1/projects/{projectId}/phases`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../phases` | Tạo phase | `CreateProjectPhaseRequest` |
| POST | `.../phases/from-definition` | Tạo phase từ phase definition | `CreateProjectPhaseFromDefinitionRequest` |
| GET | `.../phases/{id}` | Lấy phase | — |
| GET | `.../phases` | Tìm kiếm phases | `status`, `page`, `size` |
| PUT | `.../phases/{id}` | Cập nhật | `UpdateProjectPhaseRequest` |
| PATCH | `.../phases/{id}/activate` | Kích hoạt | — |
| PATCH | `.../phases/{id}/complete` | Hoàn thành | — |
| PATCH | `.../phases/{id}/archive` | Lưu trữ | — |

**CreateProjectPhaseRequest:**
```json
{
  "code": "PHASE-01",
  "name": "Initiation",
  "description": null,
  "displayOrder": 1,
  "plannedStartDate": "<date>",
  "plannedEndDate": "<date>"
}
```

**CreateProjectPhaseFromDefinitionRequest:**
```json
{
  "phaseDefinitionId": "<uuid>",
  "displayOrder": 1,
  "plannedStartDate": "<date>",
  "plannedEndDate": "<date>"
}
```

**UpdateProjectPhaseRequest:**
```json
{
  "name": "Initiation",
  "description": null,
  "displayOrder": 1,
  "plannedStartDate": "<date>",
  "plannedEndDate": "<date>"
}
```

**ProjectPhaseResponse:**
```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "phaseDefinitionId": null,
  "code": "PHASE-01",
  "name": "Initiation",
  "description": null,
  "displayOrder": 1,
  "plannedStartDate": "<date>",
  "plannedEndDate": "<date>",
  "status": "DRAFT",
  "startedAt": null,
  "completedAt": null,
  "archivedAt": null,
  "version": 1,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

---

## 1.3 Phase Definition

**Base:** `/api/v1/phase-definitions`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../system` | Tạo system-scoped definition | `CreateSystemPhaseDefinitionRequest` |
| POST | `.../organization` | Tạo org-scoped definition | `CreateOrganizationPhaseDefinitionRequest` + `organizationId` query |
| POST | `/api/v1/phase-definitions` | Tạo workspace-scoped definition | `CreateWorkspacePhaseDefinitionRequest` + `workspaceId` query |
| GET | `.../{id}` | Lấy definition | — |
| GET | `/api/v1/phase-definitions` | Tìm kiếm | `scope`, `organizationId`, `workspaceId`, `keyword`, `status`, `page`, `size` |
| PUT | `.../{id}` | Cập nhật | `UpdatePhaseDefinitionRequest` |
| PATCH | `.../{id}/activate` | Kích hoạt | — |
| PATCH | `.../{id}/deactivate` | Vô hiệu hóa | — |
| PATCH | `.../{id}/archive` | Lưu trữ | — |

**PhaseDefinitionResponse:**
```json
{
  "id": "<uuid>",
  "scope": "WORKSPACE",
  "organizationId": null,
  "workspaceId": "<uuid>",
  "code": "INIT",
  "name": "Initiation",
  "description": null,
  "displayOrder": 1,
  "isSystemDefault": false,
  "status": "ACTIVE",
  "version": 1,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

> **scope values:** `SYSTEM` | `ORGANIZATION` | `WORKSPACE`

---

## 1.4 Task

**Base:** `/api/v1/projects/{projectId}/tasks`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../tasks` | Tạo task | `CreateTaskRequest` |
| GET | `.../tasks/{id}` | Lấy task | — |
| GET | `.../tasks` | Tìm kiếm tasks | query params |
| PUT | `.../tasks/{id}` | Cập nhật | `UpdateTaskRequest` |
| PATCH | `.../tasks/{id}/start` | Bắt đầu | — |
| PATCH | `.../tasks/{id}/block` | Tạm chặn | — |
| PATCH | `.../tasks/{id}/complete` | Hoàn thành | — |
| PATCH | `.../tasks/{id}/cancel` | Huỷ | — |
| PATCH | `.../tasks/{id}/archive` | Lưu trữ | — |

**GET .../tasks — Query params:**

| Param | Type |
|---|---|
| projectPhaseId | UUID |
| wbsNodeId | UUID |
| status | String |
| priority | String |
| keyword | String |
| page | int (default 0) |
| size | int (default 20) |

**CreateTaskRequest:**
```json
{
  "projectPhaseId": "<uuid>",
  "wbsNodeId": null,
  "code": "TASK-001",
  "title": "Gather requirements",
  "description": null,
  "inChargeUserId": "<uuid>",
  "plannedRoleCode": "BA",
  "plannedRoleName": "Business Analyst",
  "estimateHours": 8.0,
  "plannedStartDate": "<date>",
  "dueDate": "<date>",
  "priority": "HIGH"
}
```

**TaskResponse:**
```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "projectPhaseId": "<uuid>",
  "wbsNodeId": null,
  "code": "TASK-001",
  "title": "Gather requirements",
  "description": null,
  "inChargeUserId": "<uuid>",
  "plannedRoleCode": "BA",
  "plannedRoleName": "Business Analyst",
  "estimateHours": 8.0,
  "plannedStartDate": "<date>",
  "dueDate": "<date>",
  "priority": "HIGH",
  "status": "TODO",
  "startedAt": null,
  "startedBy": null,
  "blockedAt": null,
  "completedAt": null,
  "completedBy": null,
  "cancelledAt": null,
  "cancelledBy": null,
  "archivedAt": null,
  "archivedBy": null,
  "version": 1,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

> **status values:** `TODO` | `IN_PROGRESS` | `BLOCKED` | `COMPLETED` | `CANCELLED` | `ARCHIVED`
> **priority values:** `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`

---

## 1.5 Task Dependency

**Base:** `/api/v1/projects/{projectId}/task-dependencies`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../task-dependencies` | Tạo dependency | `CreateTaskDependencyRequest` |
| GET | `.../task-dependencies/{id}` | Lấy dependency | — |
| GET | `.../task-dependencies` | Tìm kiếm | `taskId`, `status`, `page`, `size` |
| DELETE | `.../task-dependencies/{id}` | Xoá dependency | — |

**CreateTaskDependencyRequest:**
```json
{
  "predecessorTaskId": "<uuid>",
  "successorTaskId": "<uuid>",
  "dependencyType": "FINISH_TO_START",
  "lagDays": 0
}
```

**TaskDependencyResponse:**
```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "predecessorTaskId": "<uuid>",
  "successorTaskId": "<uuid>",
  "dependencyType": "FINISH_TO_START",
  "lagDays": 0,
  "status": "ACTIVE",
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

> **dependencyType values:** `FINISH_TO_START` | `START_TO_START` | `FINISH_TO_FINISH` | `START_TO_FINISH`

---

## 1.6 Milestone

**Base:** `/api/v1/projects/{projectId}/milestones`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../milestones` | Tạo milestone | `CreateProjectMilestoneRequest` |
| GET | `.../milestones` | Danh sách | — |
| GET | `.../milestones/{milestoneId}` | Lấy milestone | — |
| PUT | `.../milestones/{milestoneId}` | Cập nhật | `UpdateProjectMilestoneRequest` |
| PATCH | `.../milestones/{milestoneId}/achieve` | Đạt milestone | — |
| PATCH | `.../milestones/{milestoneId}/archive` | Lưu trữ | — |

**CreateProjectMilestoneRequest:**
```json
{
  "projectPhaseId": "<uuid>",
  "wbsNodeId": null,
  "code": "MS-01",
  "name": "Project Kickoff",
  "description": null,
  "milestoneDate": "<date>",
  "sortOrder": 1
}
```

**MilestoneResponse:**
```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "projectPhaseId": "<uuid>",
  "wbsNodeId": null,
  "code": "MS-01",
  "name": "Project Kickoff",
  "description": null,
  "milestoneDate": "<date>",
  "status": "PENDING",
  "sortOrder": 1,
  "achievedAt": null,
  "achievedBy": null,
  "archivedAt": null,
  "archivedBy": null,
  "version": 1,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

---

## 1.7 WBS Node

**Base:** `/api/v1/projects/{projectId}/wbs-nodes`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../wbs-nodes` | Tạo node | `CreateWbsNodeRequest` |
| GET | `.../wbs-nodes/{id}` | Lấy node | — |
| GET | `.../wbs-nodes` | Tìm kiếm | `phaseId`, `parentId`, `status`, `page`, `size` |
| GET | `.../wbs-nodes/tree` | Cây WBS đầy đủ | `phaseId` (optional) |
| PUT | `.../wbs-nodes/{id}` | Cập nhật | `UpdateWbsNodeRequest` |
| PATCH | `.../wbs-nodes/{id}/move` | Di chuyển node | `MoveWbsNodeRequest` |
| PATCH | `.../wbs-nodes/{id}/archive` | Lưu trữ | — |

**CreateWbsNodeRequest:**
```json
{
  "code": "1.1",
  "title": "Planning",
  "description": null,
  "phaseId": "<uuid>",
  "parentId": null,
  "nodeType": "DELIVERABLE",
  "sortOrder": 1
}
```

**MoveWbsNodeRequest:**
```json
{
  "newParentId": "<uuid>",
  "newSortOrder": 2
}
```

**WbsNodeResponse:**
```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "projectPhaseId": "<uuid>",
  "parentId": null,
  "code": "1.1",
  "title": "Planning",
  "description": null,
  "nodeType": "DELIVERABLE",
  "level": 1,
  "path": "1.1",
  "sortOrder": 1,
  "status": "ACTIVE",
  "version": 1,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

---

## 1.8 Gantt

**Base:** `/api/v1/projects/{projectId}/gantt`

| Method | Path | Mô tả | Body / Params |
|---|---|---|---|
| GET | `.../gantt` | Lấy toàn bộ Gantt view | `scheduleRunId`, `dateFrom`, `dateTo`, `includeUnscheduled` (default true), `includeArchived` (default false), `groupBy` (default PHASE) |
| GET | `.../gantt/items` | Gantt items slice | same params |
| GET | `.../gantt/dependencies` | Gantt dependencies | `scheduleRunId` |
| GET | `.../gantt/issues` | Gantt issues | `scheduleRunId` |
| GET | `.../gantt/critical-path` | Critical path (CPM) | `scheduleRunId` |
| GET | `.../gantt/export` | Export CSV/JSON | `format` (default CSV), `scheduleRunId` |
| POST | `.../gantt/recalculate` | Tính lại lịch | `RecalculateGanttRequest` |
| POST | `.../gantt/tasks/{taskId}/move` | Di chuyển task bar | `MoveGanttTaskRequest` |
| POST | `.../gantt/tasks/{taskId}/resize` | Resize task bar | `ResizeGanttTaskRequest` |
| POST | `.../gantt/tasks/{taskId}/clear-override` | Xoá override | `recalculate` (default true) |
| POST | `.../gantt/dependencies` | Tạo dependency từ Gantt | `CreateGanttDependencyRequest` |
| DELETE | `.../gantt/dependencies/{dependencyId}` | Xoá dependency từ Gantt | `recalculate` (default true) |

**RecalculateGanttRequest:**
```json
{
  "planningStartDate": "<date>",
  "planningEndDate": "<date>",
  "includeCompletedTasks": false,
  "markAsCurrent": true
}
```

**MoveGanttTaskRequest:**
```json
{
  "manualStartDate": "<date>",
  "manualFinishDate": "<date>",
  "reason": "Client requested shift",
  "recalculate": true
}
```

**GanttViewResponse:**
```json
{
  "project": { "...": "ProjectResponse" },
  "scheduleRun": { "...": "ScheduleRunResponse" },
  "items": [
    {
      "id": "task-<uuid>",
      "itemType": "TASK",
      "sourceEntityType": "TASK",
      "sourceEntityId": "<uuid>",
      "parentItemId": "phase-<uuid>",
      "title": "Gather requirements",
      "startDate": "<date>",
      "endDate": "<date>",
      "scheduleStatus": "SCHEDULED",
      "assigneeUserId": "<uuid>",
      "phaseId": "<uuid>",
      "wbsNodeId": null,
      "sortOrder": 1,
      "zeroDuration": false,
      "metadata": {}
    }
  ],
  "dependencies": [],
  "issues": [],
  "summary": {
    "itemCount": 10,
    "taskCount": 8,
    "scheduledTaskCount": 6,
    "unscheduledTaskCount": 2,
    "milestoneCount": 2,
    "dependencyCount": 3,
    "issueCount": 1
  }
}
```

---

## 1.9 Schedule Run

**Base:** `/api/v1/projects/{projectId}/schedule-runs`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../schedule-runs` | Tạo và chạy schedule | `CreateScheduleRunRequest` |
| GET | `.../schedule-runs` | Danh sách runs | — |
| GET | `.../schedule-runs/{scheduleRunId}` | Lấy run | — |
| POST | `.../schedule-runs/{scheduleRunId}/cancel` | Huỷ run | — |

**CreateScheduleRunRequest:**
```json
{
  "planningStartDate": "<date>",
  "planningEndDate": "<date>",
  "options": {
    "includeCompletedTasks": false,
    "useProjectAllocationsOnly": false,
    "markAsCurrent": true
  }
}
```

**ScheduleRunResponse:**
```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "status": "COMPLETED",
  "algorithmVersion": "v1",
  "planningStartDate": "<date>",
  "planningEndDate": "<date>",
  "resultSummaryJson": null,
  "errorCode": null,
  "errorMessage": null,
  "startedAt": "<instant>",
  "completedAt": "<instant>",
  "createdAt": "<instant>"
}
```

---

## 1.10 Current Schedule

**Base:** `/api/v1/projects/{projectId}/schedule/current`

| Method | Path | Mô tả | Params |
|---|---|---|---|
| GET | `.../current` | Schedule run hiện tại | — |
| GET | `.../current/tasks` | Task schedules | `taskId`, `assigneeUserId`, `riskStatus`, `scheduleStatus` |
| GET | `.../current/daily-work` | Daily work | `taskId`, `assigneeUserId`, `dateFrom`, `dateTo` |
| GET | `.../current/issues` | Scheduling issues | `taskId`, `issueType`, `severity` |

**TaskScheduleResponse:**
```json
{
  "id": "<uuid>",
  "scheduleRunId": "<uuid>",
  "taskId": "<uuid>",
  "assigneeUserId": "<uuid>",
  "estimatedStartDate": "<date>",
  "estimatedFinishDate": "<date>",
  "scheduledHours": 8.0,
  "unscheduledHours": 0.0,
  "dueDate": "<date>",
  "dueDateCapacityGapHours": 0.0,
  "riskStatus": "ON_TRACK",
  "scheduleStatus": "SCHEDULED"
}
```

---

## 1.11 Task Schedule History

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/v1/projects/{projectId}/tasks/{taskId}/schedule` | Schedule hiện tại của task |
| GET | `/api/v1/projects/{projectId}/tasks/{taskId}/schedule/history` | Lịch sử schedules của task |

---

## 1.12 Project Template

**Base:** `/api/v1/project/templates`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../templates` | Tạo template | `CreateProjectTemplateRequest` |
| GET | `.../templates/{templateId}` | Lấy template | — |
| GET | `.../templates` | Tìm kiếm | `scope`, `workspaceId`, `organizationId`, `status`, `category`, `keyword`, `page`, `size` |
| PUT | `.../templates/{templateId}` | Cập nhật | `UpdateProjectTemplateRequest` |
| PATCH | `.../templates/{templateId}/activate` | Kích hoạt | — |
| PATCH | `.../templates/{templateId}/deactivate` | Vô hiệu hóa | — |
| PATCH | `.../templates/{templateId}/archive` | Lưu trữ | — |

**CreateProjectTemplateRequest:**
```json
{
  "code": "TMPL-AGILE",
  "name": "Agile Sprint Template",
  "description": null,
  "scope": "WORKSPACE",
  "organizationId": null,
  "workspaceId": "<uuid>",
  "category": "SOFTWARE",
  "visibility": "INTERNAL",
  "builtIn": false
}
```

**ProjectTemplateResponse:**
```json
{
  "id": "<uuid>",
  "code": "TMPL-AGILE",
  "name": "Agile Sprint Template",
  "description": null,
  "scope": "WORKSPACE",
  "organizationId": null,
  "workspaceId": "<uuid>",
  "category": "SOFTWARE",
  "visibility": "INTERNAL",
  "status": "DRAFT",
  "currentVersionId": null,
  "builtIn": false,
  "archivedAt": null,
  "archivedBy": null,
  "version": 1,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

---

## 1.13 Template Version

**Base:** `/api/v1/project/templates/{templateId}/versions`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../versions` | Tạo version | `CreateProjectTemplateVersionRequest` |
| GET | `.../versions` | Danh sách versions | — |
| GET | `.../versions/{versionId}` | Lấy version | — |
| PUT | `.../versions/{versionId}` | Cập nhật draft | `UpdateProjectTemplateVersionRequest` |
| PATCH | `.../versions/{versionId}/publish` | Publish | — |
| PATCH | `.../versions/{versionId}/archive` | Lưu trữ | — |
| POST | `.../versions/{versionId}/duplicate` | Nhân bản thành draft mới | — |
| POST | `.../versions/{versionId}/apply` | Áp dụng tạo project | `ApplyProjectTemplateRequest` |

**ApplyProjectTemplateRequest:**
```json
{
  "workspaceId": "<uuid>",
  "projectCode": "PRJ-002",
  "projectName": "New Project",
  "projectDescription": null,
  "ownerUserId": "<uuid>",
  "defaultCurrency": "VND",
  "plannedStartDate": "<date>",
  "plannedEndDate": "<date>",
  "includeTemplateTasks": true,
  "includeTemplateDependencies": true,
  "copyEstimateHours": true
}
```

**ProjectTemplateVersionResponse:**
```json
{
  "id": "<uuid>",
  "projectTemplateId": "<uuid>",
  "versionNumber": 1,
  "name": "v1.0",
  "description": null,
  "status": "DRAFT",
  "publishedAt": null,
  "publishedBy": null,
  "archivedAt": null,
  "archivedBy": null,
  "version": 1,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

---

## 1.14 Template Phase / Task / Task Dependency / WBS Node

Tất cả hoạt động trên DRAFT version. Chỉ trả về lỗi nếu version đã PUBLISHED.

**Base:** `/api/v1/project/templates/{templateId}/versions/{versionId}/`

| Sub-resource | Methods | Ghi chú |
|---|---|---|
| `phases` | POST, GET list, GET one, PUT, DELETE, PUT reorder | `cascade=true` để xoá tasks theo phase |
| `tasks` | POST, GET list, GET one, PUT, DELETE | |
| `task-dependencies` | POST, GET list, DELETE | |
| `wbs-nodes` | POST, GET list, GET one, PUT, PATCH move, DELETE, GET tree | `cascade=true` để xoá con |

**ProjectTemplatePhaseResponse:**
```json
{
  "id": "<uuid>",
  "templateVersionId": "<uuid>",
  "phaseDefinitionId": null,
  "code": "PHASE-01",
  "name": "Discovery",
  "description": null,
  "displayOrder": 1,
  "defaultDurationDays": 14,
  "startOffsetDays": 0,
  "deliverableDocumentTypeId": null,
  "version": 1,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

**ProjectTemplateTaskResponse:**
```json
{
  "id": "<uuid>",
  "templateVersionId": "<uuid>",
  "templatePhaseId": "<uuid>",
  "templateWbsNodeId": null,
  "code": "T-001",
  "title": "Kickoff meeting",
  "description": null,
  "defaultPriority": "HIGH",
  "estimateHours": 2.0,
  "dueOffsetDays": 2,
  "startOffsetDays": 0,
  "defaultAssigneeRoleCode": "PM",
  "deliverableDocumentTypeId": null,
  "version": 1,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

---

# 2. Scope

## 2.1 Scope Package

**Base:** `/api/v1/projects/{projectId}/scope-packages`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../scope-packages` | Tạo package | `CreateScopePackageRequest` |
| POST | `.../scope-packages/import-from-quote` | Import từ quote version | `ImportScopePackageFromQuoteRequest` |
| GET | `.../scope-packages` | Danh sách | — |
| GET | `.../scope-packages/{packageId}` | Lấy package | — |
| POST | `.../scope-packages/{packageId}/approve` | Approve | — |
| POST | `.../scope-packages/{packageId}/mark-current` | Đánh dấu current | — |
| PATCH | `.../scope-packages/{packageId}/archive` | Lưu trữ | — |

**CreateScopePackageRequest:**
```json
{
  "code": "SP-001",
  "name": "Phase 1 Scope",
  "description": null
}
```

**ImportScopePackageFromQuoteRequest:**
```json
{
  "quoteVersionId": "<uuid>",
  "code": "SP-002",
  "name": "Scope from Quote"
}
```

**ScopePackageResponse:**
```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "code": "SP-001",
  "name": "Phase 1 Scope",
  "description": null,
  "status": "DRAFT",
  "currentFlag": false,
  "approvedAt": null,
  "approvedBy": null,
  "createdAt": "<instant>"
}
```

> **status values:** `DRAFT` | `APPROVED` | `ARCHIVED`

---

## 2.2 Scope Item

**Base:** `/api/v1/projects/{projectId}/scope-packages/{packageId}/items`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../items` | Tạo scope item | `CreateScopeItemRequest` |
| GET | `.../items` | Danh sách items trong package | — |
| GET | `/api/v1/projects/{projectId}/scope-items/{scopeItemId}` | Lấy item | — |
| PUT | `/api/v1/projects/{projectId}/scope-items/{scopeItemId}` | Cập nhật | `UpdateScopeItemRequest` |
| PATCH | `/api/v1/projects/{projectId}/scope-items/{scopeItemId}/archive` | Lưu trữ | — |

**CreateScopeItemRequest:**
```json
{
  "type": "FUNCTIONAL",
  "code": "SI-001",
  "title": "User login with SSO",
  "description": null,
  "inScope": true,
  "outOfScope": false,
  "priority": "HIGH",
  "acceptanceRequired": true,
  "sortOrder": 1
}
```

**ScopeItemResponse:**
```json
{
  "id": "<uuid>",
  "scopePackageId": "<uuid>",
  "projectId": "<uuid>",
  "type": "FUNCTIONAL",
  "code": "SI-001",
  "title": "User login with SSO",
  "description": null,
  "inScope": true,
  "outOfScope": false,
  "priority": "HIGH",
  "acceptanceRequired": true,
  "status": "ACTIVE",
  "sortOrder": 1,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

---

## 2.3 Deliverable

**Base:** `/api/v1/projects/{projectId}/deliverables`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../deliverables` | Tạo deliverable | `CreateDeliverableRequest` |
| GET | `.../deliverables` | Danh sách | — |
| GET | `.../deliverables/{deliverableId}` | Lấy deliverable | — |
| PUT | `.../deliverables/{deliverableId}` | Cập nhật | `UpdateDeliverableRequest` |
| PATCH | `.../deliverables/{deliverableId}/status` | Đổi status | `ChangeDeliverableStatusRequest` |
| PATCH | `.../deliverables/{deliverableId}/archive` | Lưu trữ | — |
| POST | `.../deliverables/{deliverableId}/accept` | Chấp nhận chính thức | — |
| POST | `.../deliverables/{deliverableId}/reopen` | Mở lại | `ReopenDeliverableRequest` |

**CreateDeliverableRequest:**
```json
{
  "type": "DOCUMENT",
  "code": "DLV-001",
  "title": "Requirements Specification",
  "description": null,
  "acceptanceRequired": true
}
```

**DeliverableResponse:**
```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "type": "DOCUMENT",
  "code": "DLV-001",
  "title": "Requirements Specification",
  "status": "DRAFT",
  "acceptanceRequired": true,
  "acceptedAt": null,
  "acceptedBy": null,
  "createdAt": "<instant>"
}
```

---

## 2.4 Acceptance Criteria

**Base:** `/api/v1/projects/{projectId}/deliverables/{deliverableId}/acceptance-criteria`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../acceptance-criteria` | Tạo criteria | `CreateAcceptanceCriteriaRequest` |
| GET | `.../acceptance-criteria` | Danh sách | — |
| GET | `/api/v1/projects/{projectId}/acceptance-criteria/{criteriaId}` | Lấy criteria | — |
| PATCH | `/api/v1/projects/{projectId}/acceptance-criteria/{criteriaId}/satisfy` | Đánh dấu thỏa mãn | — |
| PATCH | `/api/v1/projects/{projectId}/acceptance-criteria/{criteriaId}/waive` | Waive | `WaiveCriteriaRequest` |

**CreateAcceptanceCriteriaRequest:**
```json
{
  "title": "System handles 1000 concurrent users",
  "type": "PERFORMANCE",
  "description": null,
  "mandatory": true
}
```

**AcceptanceCriteriaResponse:**
```json
{
  "id": "<uuid>",
  "deliverableId": "<uuid>",
  "projectId": "<uuid>",
  "type": "PERFORMANCE",
  "title": "System handles 1000 concurrent users",
  "description": null,
  "mandatory": true,
  "status": "OPEN",
  "createdAt": "<instant>"
}
```

> **status values:** `OPEN` | `SATISFIED` | `WAIVED`

---

## 2.5 Acceptance Evidence

**Base:** `/api/v1/projects/{projectId}/deliverables/{deliverableId}/evidence`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../evidence` | Thêm evidence | `CreateAcceptanceEvidenceRequest` |
| GET | `.../evidence` | Danh sách | — |
| GET | `/api/v1/projects/{projectId}/evidence/{evidenceId}` | Lấy evidence | — |

**CreateAcceptanceEvidenceRequest:**
```json
{
  "evidenceType": "TEST_RESULT",
  "acceptanceCriteriaId": "<uuid>",
  "title": "Load test report",
  "contentText": null,
  "linkUrl": "https://...",
  "referenceId": null
}
```

**AcceptanceEvidenceResponse:**
```json
{
  "id": "<uuid>",
  "deliverableId": "<uuid>",
  "acceptanceCriteriaId": "<uuid>",
  "projectId": "<uuid>",
  "evidenceType": "TEST_RESULT",
  "title": "Load test report",
  "contentText": null,
  "linkUrl": "https://...",
  "referenceId": null,
  "createdAt": "<instant>"
}
```

---

## 2.6 Scope — Deliverable Review

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `/api/v1/projects/{projectId}/deliverables/{deliverableId}/submit-review` | Submit để review | — |
| POST | `/api/v1/projects/{projectId}/reviews/{reviewId}/approve` | Approve | `ReviewDecisionRequest` (optional) |
| POST | `/api/v1/projects/{projectId}/reviews/{reviewId}/reject` | Reject | `ReviewReasonRequest` (optional) |
| POST | `/api/v1/projects/{projectId}/reviews/{reviewId}/request-rework` | Yêu cầu làm lại | `ReviewReasonRequest` (optional) |

**DeliverableReviewResponse:**
```json
{
  "id": "<uuid>",
  "deliverableId": "<uuid>",
  "projectId": "<uuid>",
  "status": "PENDING",
  "decision": null,
  "reviewerUserId": "<uuid>",
  "reason": null,
  "decidedAt": null,
  "createdAt": "<instant>"
}
```

---

## 2.7 Scope — Mappings

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `/api/v1/projects/{projectId}/scope-items/{scopeItemId}/wbs-mappings` | Map scope item → WBS node | `CreateWbsMappingRequest` |
| GET | `/api/v1/projects/{projectId}/scope-items/{scopeItemId}/wbs-mappings` | Danh sách mappings | — |
| DELETE | `/api/v1/projects/{projectId}/scope-items/wbs-mappings/{mappingId}` | Xoá mapping | — |
| POST | `/api/v1/projects/{projectId}/deliverables/{deliverableId}/task-mappings` | Map deliverable → task | `CreateTaskMappingRequest` |
| GET | `/api/v1/projects/{projectId}/deliverables/{deliverableId}/task-mappings` | Danh sách mappings | — |
| DELETE | `/api/v1/projects/{projectId}/deliverables/task-mappings/{mappingId}` | Xoá mapping | — |

**ScopeItemWbsMappingResponse:**
```json
{
  "id": "<uuid>",
  "scopeItemId": "<uuid>",
  "projectId": "<uuid>",
  "wbsNodeId": "<uuid>",
  "mappingType": "IMPLEMENTS",
  "archivedAt": null,
  "createdAt": "<instant>"
}
```

---

## 2.8 Scope Reports

**Base:** `/api/v1/projects/{projectId}/reports`

| Method | Path | Mô tả |
|---|---|---|
| GET | `.../scope-coverage` | Tổng hợp scope coverage |
| GET | `.../deliverable-status` | Thống kê status deliverable |
| GET | `.../acceptance-criteria` | Thống kê acceptance criteria |
| GET | `.../acceptance-evidence` | Tổng hợp evidence |

**ScopeCoverageReportResponse:**
```json
{
  "packageCount": 2,
  "itemCount": 15,
  "inScopeCount": 12,
  "outOfScopeCount": 3,
  "activeWbsMappingCount": 8
}
```

**DeliverableStatusReportResponse:**
```json
{
  "statusCounts": {
    "DRAFT": 3,
    "IN_REVIEW": 1,
    "ACCEPTED": 2
  }
}
```

---

# 3. RAID

## 3.1 RAID Items

**Base:** `/api/v1/projects/{projectId}/raid-items`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../raid-items` | Tạo RAID item | `CreateRaidItemRequest` |
| GET | `.../raid-items` | Danh sách | `type` (query, optional) |
| GET | `.../raid-items/{raidItemId}` | Lấy item | — |
| PUT | `.../raid-items/{raidItemId}` | Cập nhật | `UpdateRaidItemRequest` |
| PATCH | `.../raid-items/{raidItemId}/status` | Đổi status | `ChangeRaidItemStatusRequest` |
| POST | `.../raid-items/{raidItemId}/resolve` | Giải quyết | `ResolveRaidItemRequest` |
| POST | `.../raid-items/{raidItemId}/close` | Đóng | — |
| POST | `.../raid-items/{raidItemId}/reopen` | Mở lại | — |
| POST | `.../raid-items/{raidItemId}/escalate` | Escalate | `EscalateRaidItemRequest` |
| PATCH | `.../raid-items/{raidItemId}/archive` | Lưu trữ | — |
| POST | `.../raid-items/{raidItemId}/convert-risk-to-issue` | Chuyển risk → issue | — |
| POST | `.../raid-items/{raidItemId}/create-change-request-draft` | Tạo CR draft từ RAID | — |

**CreateRaidItemRequest:**
```json
{
  "type": "RISK",
  "title": "Key developer resignation",
  "code": "RISK-001",
  "description": "Senior developer may leave before go-live",
  "ownerUserId": "<uuid>",
  "probability": "MEDIUM",
  "impact": "HIGH",
  "riskResponseStrategy": "MITIGATE",
  "riskTrigger": "Resignation letter received",
  "severity": null,
  "issueCategory": null,
  "impactSummary": null,
  "rootCause": null,
  "resolutionPlan": null,
  "assumptionStatement": null,
  "validationStatus": null,
  "dependencyType": null
}
```

**RaidItemResponse:**
```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "type": "RISK",
  "code": "RISK-001",
  "title": "Key developer resignation",
  "description": "Senior developer may leave before go-live",
  "status": "OPEN",
  "ownerUserId": "<uuid>",
  "severity": null,
  "probability": "MEDIUM",
  "impact": "HIGH",
  "riskScore": 6,
  "riskScoreFormulaVersion": "v1",
  "riskResponseStrategy": "MITIGATE",
  "escalationLevel": null,
  "linkedChangeRequestId": null,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

> **type values:** `RISK` | `ASSUMPTION` | `ISSUE` | `DEPENDENCY`
> **status values:** `OPEN` | `IN_PROGRESS` | `RESOLVED` | `CLOSED` | `ESCALATED` | `ARCHIVED`

---

## 3.2 RAID Actions (nested under RAID Item)

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `/api/v1/projects/{projectId}/raid-items/{raidItemId}/actions` | Tạo action | `CreateRaidActionRequest` |
| GET | `/api/v1/projects/{projectId}/raid-items/{raidItemId}/actions` | Danh sách | — |

**CreateRaidActionRequest:**
```json
{
  "title": "Identify backup developer",
  "description": null,
  "ownerUserId": "<uuid>",
  "dueDate": "<date>"
}
```

**RaidActionResponse:**
```json
{
  "id": "<uuid>",
  "raidItemId": "<uuid>",
  "projectId": "<uuid>",
  "title": "Identify backup developer",
  "status": "PENDING",
  "ownerUserId": "<uuid>",
  "dueDate": "<date>",
  "linkedTaskId": null,
  "completedAt": null
}
```

---

## 3.3 RAID Actions (standalone)

**Base:** `/api/v1/projects/{projectId}/raid-actions`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| GET | `.../raid-actions/{raidActionId}` | Lấy action | — |
| PUT | `.../raid-actions/{raidActionId}` | Cập nhật | `UpdateRaidActionRequest` |
| POST | `.../raid-actions/{raidActionId}/cancel` | Huỷ | — |
| POST | `.../raid-actions/{raidActionId}/complete` | Hoàn thành | `CompleteRaidActionRequest` (optional) |
| POST | `.../raid-actions/{raidActionId}/create-linked-task` | Tạo task liên kết | `CreateLinkedTaskFromRaidActionRequest` (optional) |

**CreateLinkedTaskFromRaidActionRequest:**
```json
{
  "phaseId": "<uuid>",
  "wbsNodeId": null,
  "estimateHours": 4.0
}
```

---

## 3.4 RAID Links

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `/api/v1/projects/{projectId}/raid-items/{raidItemId}/links` | Tạo link | `CreateRaidLinkRequest` |
| GET | `/api/v1/projects/{projectId}/raid-items/{raidItemId}/links` | Danh sách | — |
| DELETE | `/api/v1/projects/{projectId}/raid-items/{raidItemId}/links/{linkId}` | Xoá | — |

**CreateRaidLinkRequest:**
```json
{
  "linkType": "RELATED_TO",
  "targetType": "TASK",
  "targetId": "<uuid>"
}
```

**RaidLinkResponse:**
```json
{
  "id": "<uuid>",
  "raidItemId": "<uuid>",
  "projectId": "<uuid>",
  "linkType": "RELATED_TO",
  "targetType": "TASK",
  "targetId": "<uuid>",
  "createdAt": "<instant>"
}
```

---

## 3.5 Decision Record

**Base:** `/api/v1/projects/{projectId}/decisions`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../decisions` | Tạo decision | `CreateDecisionRequest` |
| GET | `.../decisions` | Danh sách | — |
| GET | `.../decisions/{decisionId}` | Lấy decision | — |
| PUT | `.../decisions/{decisionId}` | Cập nhật | `UpdateDecisionRequest` |
| POST | `.../decisions/{decisionId}/supersede` | Supersede | `SupersedeDecisionRequest` (optional) |
| POST | `.../decisions/{decisionId}/decide` | Quyết định | `DecideDecisionRequest` |
| POST | `.../decisions/{decisionId}/reject` | Từ chối | `RejectDecisionRequest` |
| PATCH | `.../decisions/{decisionId}/archive` | Lưu trữ | — |

**CreateDecisionRequest:**
```json
{
  "title": "Choose cloud provider",
  "rationale": "Need to evaluate AWS vs Azure for project hosting",
  "category": "TECHNICAL",
  "code": "DEC-001"
}
```

**DecisionRecordResponse:**
```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "code": "DEC-001",
  "title": "Choose cloud provider",
  "category": "TECHNICAL",
  "status": "PENDING",
  "rationale": "Need to evaluate AWS vs Azure for project hosting",
  "outcome": null,
  "decidedAt": null,
  "decidedBy": null,
  "createdAt": "<instant>"
}
```

> **status values:** `PENDING` | `DECIDED` | `REJECTED` | `SUPERSEDED` | `ARCHIVED`

---

## 3.6 Decision Options

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `/api/v1/projects/{projectId}/decisions/{decisionId}/options` | Thêm option | `CreateDecisionOptionRequest` |
| GET | `/api/v1/projects/{projectId}/decisions/{decisionId}/options` | Danh sách | — |
| PUT | `/api/v1/projects/{projectId}/decisions/{decisionId}/options/{optionId}` | Cập nhật | `UpdateDecisionOptionRequest` |
| DELETE | `/api/v1/projects/{projectId}/decisions/{decisionId}/options/{optionId}` | Xoá | — |

**CreateDecisionOptionRequest:**
```json
{
  "optionTitle": "AWS",
  "optionDescription": "Amazon Web Services",
  "pros": "Mature ecosystem, better support",
  "cons": "Higher cost",
  "estimatedImpact": "Budget +15%"
}
```

**DecisionOptionResponse:**
```json
{
  "id": "<uuid>",
  "decisionId": "<uuid>",
  "optionTitle": "AWS",
  "optionDescription": "Amazon Web Services",
  "pros": "Mature ecosystem, better support",
  "cons": "Higher cost",
  "estimatedImpact": "Budget +15%",
  "selectedFlag": false
}
```

---

## 3.7 Decision Impact

| Method | Path | Mô tả | Body |
|---|---|---|---|
| GET | `/api/v1/projects/{projectId}/decisions/{decisionId}/impact` | Lấy impact | — |
| PUT | `/api/v1/projects/{projectId}/decisions/{decisionId}/impact` | Tạo/cập nhật impact | `UpsertDecisionImpactRequest` |

**UpsertDecisionImpactRequest:**
```json
{
  "scopeImpact": "Adds 2 new integrations",
  "scheduleImpactDays": 5,
  "estimateHoursImpact": 40.0,
  "costImpact": 5000.00,
  "revenueImpact": null,
  "marginImpact": null,
  "riskImpact": "Low",
  "deliverableImpact": null,
  "acceptanceImpact": null
}
```

**DecisionImpactResponse:**
```json
{
  "id": "<uuid>",
  "decisionId": "<uuid>",
  "scopeImpact": "Adds 2 new integrations",
  "scheduleImpactDays": 5,
  "estimateHoursImpact": 40.0,
  "costImpact": 5000.00,
  "revenueImpact": null,
  "marginImpact": null,
  "riskImpact": "Low",
  "deliverableImpact": null,
  "acceptanceImpact": null,
  "financeMasked": null
}
```

---

## 3.8 Decision Links

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `/api/v1/projects/{projectId}/decisions/{decisionId}/links` | Tạo link | `CreateDecisionLinkRequest` |
| GET | `/api/v1/projects/{projectId}/decisions/{decisionId}/links` | Danh sách | — |
| DELETE | `/api/v1/projects/{projectId}/decisions/{decisionId}/links/{linkId}` | Xoá | — |

---

## 3.9 RAID Reports

**Base:** `/api/v1/projects/{projectId}/reports`

| Method | Path | Mô tả |
|---|---|---|
| GET | `.../raid-summary` | RAID summary tổng hợp |
| GET | `.../risk-register` | Risk register |
| GET | `.../issue-log` | Issue log |
| GET | `.../assumption-log` | Assumption log |
| GET | `.../dependency-log` | Dependency log |
| GET | `.../raid-actions` | RAID actions report |
| GET | `.../decision-log` | Decision log |

> Reports trả về `List<RaidItemResponse>` hoặc `Map<String, Object>` tùy endpoint.

---

# 4. Collaboration

## 4.1 Meeting

**Base:** `/api/v1/projects/{projectId}/meetings`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../meetings` | Tạo meeting | `CreateMeetingRequest` |
| GET | `.../meetings` | Danh sách | — |
| GET | `.../meetings/{meetingId}` | Lấy meeting | — |
| PUT | `.../meetings/{meetingId}` | Cập nhật | `UpdateMeetingRequest` |
| POST | `.../meetings/{meetingId}/start` | Bắt đầu | — |
| POST | `.../meetings/{meetingId}/complete` | Kết thúc | — |
| POST | `.../meetings/{meetingId}/cancel` | Huỷ | `CancelMeetingRequest` (optional) |
| PATCH | `.../meetings/{meetingId}/archive` | Lưu trữ | — |

**CreateMeetingRequest:**
```json
{
  "meetingSeriesId": null,
  "title": "Sprint Planning #3",
  "description": null,
  "meetingType": "SPRINT_PLANNING",
  "startAt": "<instant>",
  "endAt": "<instant>",
  "timezone": "Asia/Ho_Chi_Minh",
  "location": "Zoom",
  "meetingUrl": "https://zoom.us/j/...",
  "organizerUserId": "<uuid>",
  "clientVisible": false
}
```

**MeetingResponse:**
```json
{
  "id": "<uuid>",
  "workspaceId": "<uuid>",
  "projectId": "<uuid>",
  "meetingSeriesId": null,
  "title": "Sprint Planning #3",
  "description": null,
  "meetingType": "SPRINT_PLANNING",
  "status": "SCHEDULED",
  "startAt": "<instant>",
  "endAt": "<instant>",
  "timezone": "Asia/Ho_Chi_Minh",
  "location": "Zoom",
  "meetingUrl": "https://zoom.us/j/...",
  "organizerUserId": "<uuid>",
  "clientVisible": false,
  "internalOnly": true,
  "cancelledAt": null,
  "cancelReason": null,
  "archivedAt": null,
  "createdAt": "<instant>",
  "updatedAt": "<instant>",
  "version": 1
}
```

> **status values:** `SCHEDULED` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED` | `ARCHIVED`

---

## 4.2 Meeting Series

**Base:** `/api/v1/projects/{projectId}/meeting-series`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../meeting-series` | Tạo series | `CreateMeetingSeriesRequest` |
| GET | `.../meeting-series` | Danh sách | — |
| GET | `.../meeting-series/{seriesId}` | Lấy series | — |
| PUT | `.../meeting-series/{seriesId}` | Cập nhật | `UpdateMeetingSeriesRequest` |
| PATCH | `.../meeting-series/{seriesId}/pause` | Tạm dừng | — |
| PATCH | `.../meeting-series/{seriesId}/archive` | Lưu trữ | — |

**CreateMeetingSeriesRequest:**
```json
{
  "code": "WEEKLY-SYNC",
  "title": "Weekly Sync",
  "description": null,
  "cadence": "WEEKLY",
  "ownerUserId": "<uuid>",
  "clientVisible": false
}
```

**MeetingSeriesResponse:**
```json
{
  "id": "<uuid>",
  "workspaceId": "<uuid>",
  "projectId": "<uuid>",
  "code": "WEEKLY-SYNC",
  "title": "Weekly Sync",
  "description": null,
  "cadence": "WEEKLY",
  "ownerUserId": "<uuid>",
  "status": "ACTIVE",
  "clientVisible": false,
  "archivedAt": null,
  "createdAt": "<instant>",
  "updatedAt": "<instant>",
  "version": 1
}
```

---

## 4.3 Agenda Item

**Base:** `/api/v1/projects/{projectId}/meetings/{meetingId}/agenda-items`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../agenda-items` | Thêm agenda item | `CreateAgendaItemRequest` |
| GET | `.../agenda-items` | Danh sách | — |
| PUT | `.../agenda-items/{agendaItemId}` | Cập nhật | `UpdateAgendaItemRequest` |
| DELETE | `.../agenda-items/{agendaItemId}` | Xoá | — |
| PUT | `.../agenda-items/reorder` | Sắp xếp lại | `ReorderAgendaItemsRequest` |

**CreateAgendaItemRequest:**
```json
{
  "title": "Sprint review",
  "description": null,
  "ownerUserId": "<uuid>",
  "sortOrder": 1,
  "timeboxMinutes": 30,
  "clientVisible": false
}
```

**MeetingAgendaItemResponse:**
```json
{
  "id": "<uuid>",
  "meetingId": "<uuid>",
  "title": "Sprint review",
  "description": null,
  "ownerUserId": "<uuid>",
  "status": "PENDING",
  "sortOrder": 1,
  "timeboxMinutes": 30,
  "clientVisible": false
}
```

---

## 4.4 Participant

**Base:** `/api/v1/projects/{projectId}/meetings/{meetingId}/participants`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../participants` | Thêm participant | `AddParticipantRequest` |
| GET | `.../participants` | Danh sách | — |
| PUT | `.../participants/{participantId}` | Cập nhật | `UpdateParticipantRequest` |
| DELETE | `.../participants/{participantId}` | Xoá | — |
| POST | `.../participants/{participantId}/mark-attended` | Đánh dấu đã tham dự | — |

**AddParticipantRequest:**
```json
{
  "targetType": "USER",
  "targetId": "<uuid>",
  "displayName": null,
  "email": null,
  "participantRole": "ATTENDEE",
  "clientVisible": false
}
```

**MeetingParticipantResponse:**
```json
{
  "id": "<uuid>",
  "meetingId": "<uuid>",
  "targetType": "USER",
  "targetId": "<uuid>",
  "displayNameSnapshot": "Nguyen Van A",
  "emailSnapshot": "a@scopery.dev",
  "participantRole": "ATTENDEE",
  "attendanceStatus": "INVITED",
  "clientVisible": false,
  "createdAt": "<instant>"
}
```

> **participantRole values:** `ORGANIZER` | `ATTENDEE` | `OPTIONAL` | `PRESENTER`
> **attendanceStatus values:** `INVITED` | `ACCEPTED` | `DECLINED` | `ATTENDED` | `ABSENT`

---

## 4.5 Meeting Minutes

**Base:** `/api/v1/projects/{projectId}/meetings/{meetingId}/minutes`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../minutes` | Tạo minutes | `CreateMinutesRequest` |
| GET | `.../minutes` | Danh sách | — |
| PUT | `.../minutes/{minutesId}` | Cập nhật | `UpdateMinutesRequest` |
| POST | `.../minutes/{minutesId}/submit-review` | Submit review | — |
| POST | `.../minutes/{minutesId}/approve` | Approve | — |
| POST | `.../minutes/{minutesId}/reject` | Reject | `RejectMinutesRequest` (optional) |
| POST | `.../minutes/{minutesId}/generate-document` | Tạo document từ minutes | `GenerateMinutesDocumentRequest` (optional) |

**CreateMinutesRequest:**
```json
{
  "summary": "Team discussed sprint scope and agreed on 5 features",
  "decisionsSummary": "Decided to use REST over GraphQL",
  "actionsSummary": "John to provide API spec by Friday",
  "clientVisibleSummary": null
}
```

**MeetingMinutesResponse:**
```json
{
  "id": "<uuid>",
  "meetingId": "<uuid>",
  "status": "DRAFT",
  "summary": "Team discussed sprint scope...",
  "decisionsSummary": "Decided to use REST over GraphQL",
  "actionsSummary": "John to provide API spec by Friday",
  "clientVisibleSummary": null,
  "documentId": null,
  "documentVersionId": null,
  "submittedAt": null,
  "approvedAt": null,
  "rejectedAt": null,
  "rejectionReason": null,
  "createdAt": "<instant>"
}
```

---

## 4.6 Meeting Action Item

**Nested (tạo + list):** `/api/v1/projects/{projectId}/meetings/{meetingId}/action-items`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../action-items` | Tạo action item | `CreateActionItemRequest` |
| GET | `.../action-items` | Danh sách của meeting | — |

**Standalone (đọc + cập nhật):** `/api/v1/projects/{projectId}/meeting-action-items`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| GET | `.../meeting-action-items/{actionItemId}` | Lấy action item | — |
| PUT | `.../meeting-action-items/{actionItemId}` | Cập nhật | `UpdateActionItemRequest` |
| POST | `.../meeting-action-items/{actionItemId}/complete` | Hoàn thành | `CompleteActionItemRequest` (optional) |
| POST | `.../meeting-action-items/{actionItemId}/create-linked-task` | Link task | `LinkTaskRequest` |
| PATCH | `.../meeting-action-items/{actionItemId}/archive` | Lưu trữ | — |

**CreateActionItemRequest:**
```json
{
  "agendaItemId": "<uuid>",
  "title": "Prepare API spec document",
  "description": null,
  "ownerTargetType": "USER",
  "ownerTargetId": "<uuid>",
  "dueDate": "<date>",
  "clientVisible": false
}
```

**MeetingActionItemResponse:**
```json
{
  "id": "<uuid>",
  "meetingId": "<uuid>",
  "title": "Prepare API spec document",
  "description": null,
  "ownerTargetType": "USER",
  "ownerTargetId": "<uuid>",
  "dueDate": "<date>",
  "status": "OPEN",
  "linkedTaskId": null,
  "completedAt": null,
  "clientVisible": false
}
```

---

## 4.7 Meeting Note

**Base:** `/api/v1/projects/{projectId}/meetings/{meetingId}/notes`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../notes` | Tạo note | `CreateNoteRequest` |
| GET | `.../notes` | Danh sách | — |
| PUT | `.../notes/{noteId}` | Cập nhật | `UpdateNoteRequest` |
| PATCH | `.../notes/{noteId}/archive` | Lưu trữ | — |
| POST | `.../notes/{noteId}/create-decision` | Tạo Decision từ note | `CreateDecisionFromNoteRequest` (optional) |
| POST | `.../notes/{noteId}/create-raid-item` | Tạo RAID item từ note | `CreateRaidItemFromNoteRequest` (optional) |
| POST | `.../notes/{noteId}/create-requirement` | Tạo Requirement từ note | `CreateRequirementFromNoteRequest` (optional) |
| POST | `.../notes/{noteId}/create-change-request-draft` | Tạo CR draft từ note | `CreateChangeRequestFromNoteRequest` |

**CreateNoteRequest:**
```json
{
  "agendaItemId": null,
  "noteType": "DECISION",
  "body": "We decided to use microservices architecture",
  "clientVisible": false
}
```

**MeetingNoteResponse:**
```json
{
  "id": "<uuid>",
  "meetingId": "<uuid>",
  "agendaItemId": null,
  "noteType": "DECISION",
  "body": "We decided to use microservices architecture",
  "internalOnly": true,
  "clientVisible": false
}
```

**NoteConversionResponse:**
```json
{
  "noteId": "<uuid>",
  "meetingId": "<uuid>",
  "targetType": "DECISION",
  "targetId": "<uuid>",
  "artifactLinkId": "<uuid>"
}
```

> **noteType values:** `DECISION` | `ACTION` | `RISK` | `ISSUE` | `ASSUMPTION` | `GENERAL` | `REQUIREMENT`

---

## 4.8 Comment Thread + Comment

### Comment Thread

**Base:** `/api/v1/projects/{projectId}/comments/threads`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../threads` | Tạo thread | `CreateCommentThreadRequest` |
| GET | `.../threads` | Danh sách | — |
| GET | `.../threads/{threadId}` | Lấy thread | — |
| POST | `.../threads/{threadId}/resolve` | Resolve thread | — |
| PATCH | `.../threads/{threadId}/archive` | Lưu trữ | — |
| GET | `/api/v1/projects/{projectId}/comments/by-target` | Threads theo target | `targetType`, `targetId` (query) |

**CreateCommentThreadRequest:**
```json
{
  "targetType": "TASK",
  "targetId": "<uuid>",
  "title": null,
  "clientVisible": false
}
```

**CommentThreadResponse:**
```json
{
  "id": "<uuid>",
  "targetType": "TASK",
  "targetId": "<uuid>",
  "title": null,
  "status": "OPEN",
  "internalOnly": true,
  "clientVisible": false,
  "resolvedAt": null
}
```

### Comment (nested trong thread)

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `/api/v1/projects/{projectId}/comments/threads/{threadId}/comments` | Tạo comment | `CreateCommentRequest` |
| GET | `/api/v1/projects/{projectId}/comments/threads/{threadId}/comments` | Danh sách | — |
| PUT | `/api/v1/projects/{projectId}/comments/{commentId}` | Cập nhật | `UpdateCommentRequest` |
| POST | `/api/v1/projects/{projectId}/comments/{commentId}/delete` | Soft delete | — |

**CreateCommentRequest:**
```json
{
  "parentCommentId": null,
  "body": "This task needs to be prioritized",
  "clientVisible": false,
  "mentionUserIds": ["<uuid>"]
}
```

**CommentResponse:**
```json
{
  "id": "<uuid>",
  "threadId": "<uuid>",
  "parentCommentId": null,
  "authorType": "USER",
  "authorId": "<uuid>",
  "body": "This task needs to be prioritized",
  "status": "ACTIVE",
  "createdAt": "<instant>"
}
```

---

## 4.9 Meeting Artifact Link

**Base:** `/api/v1/projects/{projectId}/meetings/{meetingId}/artifact-links`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../artifact-links` | Tạo link | `CreateArtifactLinkRequest` |
| GET | `.../artifact-links` | Danh sách | — |
| DELETE | `.../artifact-links/{linkId}` | Xoá | — |

**CreateArtifactLinkRequest:**
```json
{
  "agendaItemId": null,
  "noteId": "<uuid>",
  "actionItemId": null,
  "targetType": "TASK",
  "targetId": "<uuid>",
  "linkType": "CREATED_FROM"
}
```

**MeetingArtifactLinkResponse:**
```json
{
  "id": "<uuid>",
  "meetingId": "<uuid>",
  "targetType": "TASK",
  "targetId": "<uuid>",
  "linkType": "CREATED_FROM"
}
```

---

## 4.10 Collaboration Reports

**Base:** `/api/v1/projects/{projectId}/reports`

| Method | Path | Mô tả |
|---|---|---|
| GET | `.../meetings` | Meeting register report |
| GET | `.../meeting-actions` | Meeting action items report |
| GET | `.../overdue-meeting-actions` | Overdue action items |
| GET | `.../meeting-minutes-status` | Minutes status report |
| GET | `.../comment-activity` | Comment activity report |

---

# 5. Notification

Notification có **3 base path khác nhau:**

| Base | Dùng cho |
|---|---|
| `/api/v1/notifications` | In-app notifications của user hiện tại |
| `/api/v1/notification/...` | Admin: email rules, templates, deliveries, outbox |
| `/api/v1/workspaces/{workspaceId}/notifications/...` | Per-workspace: subscriptions, preferences, reminders, alerts, digests |

---

## 5.1 In-app Notifications (user)

**Base:** `/api/v1/notifications`

| Method | Path | Mô tả | Params |
|---|---|---|---|
| GET | `/api/v1/notifications` | Danh sách notifications của tôi | `page`, `size`, `includeDismissed` (default false) |
| GET | `/api/v1/notifications/unread-count` | Số chưa đọc | — |
| PATCH | `/api/v1/notifications/{id}/read` | Đánh dấu đã đọc | — |
| PATCH | `/api/v1/notifications/read-all` | Đánh dấu tất cả đã đọc | — |
| PATCH | `/api/v1/notifications/{id}/dismiss` | Dismiss | — |

**NotificationItemResponse:**
```json
{
  "id": "<uuid>",
  "recipientUserId": "<uuid>",
  "eventDefinitionId": "<uuid>",
  "sourceSystem": "PROJECT",
  "title": "Task overdue: Gather requirements",
  "bodyPreview": "Task TASK-001 was due yesterday",
  "severity": "WARNING",
  "priority": "HIGH",
  "actionType": "NAVIGATE",
  "actionUrl": "/projects/<uuid>/tasks/<uuid>",
  "mandatory": false,
  "status": "UNREAD",
  "readAt": null,
  "dismissedAt": null,
  "workspaceId": "<uuid>",
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

**UnreadCountResponse:**
```json
{ "unreadCount": 5 }
```

---

## 5.2 Notification Subscription

**Base:** `/api/v1/workspaces/{workspaceId}/notifications/subscriptions`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../subscriptions` | Subscribe | `CreateSubscriptionRequest` |
| GET | `.../subscriptions` | Danh sách subscriptions của tôi | — |
| DELETE | `.../subscriptions/{subscriptionId}` | Unsubscribe | — |

**CreateSubscriptionRequest:**
```json
{
  "targetType": "PROJECT",
  "targetId": "<uuid>",
  "subscriptionLevel": "ALL"
}
```

**NotificationSubscriptionResponse:**
```json
{
  "id": "<uuid>",
  "targetType": "PROJECT",
  "targetId": "<uuid>",
  "subscriptionLevel": "ALL",
  "status": "ACTIVE"
}
```

---

## 5.3 Notification Preferences (per user per workspace)

**Base:** `/api/v1/workspaces/{workspaceId}/notifications/preferences/me`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| GET | `.../preferences/me` | Lấy preferences của tôi | — |
| PUT | `.../preferences/me` | Cập nhật | `UpdatePreferenceRequest` |

**UpdatePreferenceRequest:**
```json
{
  "timezone": "Asia/Ho_Chi_Minh",
  "defaultMode": "IMMEDIATE",
  "digestEnabled": false,
  "quietHoursEnabled": true,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00"
}
```

**NotificationPreferenceProfileResponse:**
```json
{
  "timezone": "Asia/Ho_Chi_Minh",
  "defaultMode": "IMMEDIATE",
  "digestEnabled": false,
  "quietHoursEnabled": true,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00"
}
```

---

## 5.4 Channel Preferences

**Base:** `/api/v1/workspaces/{workspaceId}/notifications/channel-preferences/me`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| GET | `.../channel-preferences/me` | Lấy channel preferences | — |
| PUT | `.../channel-preferences/me` | Tạo/cập nhật | `UpsertChannelPreferenceRequest` |

**UpsertChannelPreferenceRequest:**
```json
{
  "categoryCode": "TASK_UPDATE",
  "channelCode": "EMAIL",
  "enabled": true
}
```

**NotificationChannelPreferenceResponse:**
```json
{
  "id": "<uuid>",
  "categoryCode": "TASK_UPDATE",
  "channelCode": "EMAIL",
  "enabled": true
}
```

---

## 5.5 Reminder Instances

**Base:** `/api/v1/workspaces/{workspaceId}/notifications/reminder-instances`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| GET | `.../reminder-instances` | Danh sách reminders của tôi | — |
| POST | `.../reminder-instances/{reminderInstanceId}/snooze` | Snooze | `SnoozeReminderRequest` |
| POST | `.../reminder-instances/{reminderInstanceId}/dismiss` | Dismiss | — |

**SnoozeReminderRequest:**
```json
{ "snoozedUntil": "<instant>" }
```

**ReminderInstanceResponse:**
```json
{
  "id": "<uuid>",
  "workspaceId": "<uuid>",
  "reminderRuleId": "<uuid>",
  "sourceType": "TASK",
  "sourceId": "<uuid>",
  "recipientUserId": "<uuid>",
  "remindAt": "<instant>",
  "status": "PENDING",
  "dedupKey": "task-<uuid>-due",
  "snoozedUntil": null,
  "dismissedAt": null,
  "createdAt": "<instant>"
}
```

---

## 5.6 Alert Events

**Base:** `/api/v1/workspaces/{workspaceId}/notifications/alert-events`

| Method | Path | Mô tả |
|---|---|---|
| GET | `.../alert-events` | Danh sách alert events |
| POST | `.../alert-events/{alertEventId}/acknowledge` | Acknowledge |
| POST | `.../alert-events/{alertEventId}/dismiss` | Dismiss |

**AlertEventResponse:**
```json
{
  "id": "<uuid>",
  "workspaceId": "<uuid>",
  "alertRuleId": "<uuid>",
  "sourceType": "PROJECT",
  "sourceId": "<uuid>",
  "severity": "CRITICAL",
  "title": "Project deadline at risk",
  "status": "ACTIVE",
  "dedupKey": "project-<uuid>-deadline",
  "acknowledgedAt": null,
  "dismissedAt": null,
  "createdAt": "<instant>"
}
```

---

## 5.7 Suppressions

**Base:** `/api/v1/workspaces/{workspaceId}/notifications/suppressions`

| Method | Path | Mô tả |
|---|---|---|
| GET | `.../suppressions` | Danh sách suppressions của workspace |

**NotificationSuppressionResponse:**
```json
{
  "id": "<uuid>",
  "workspaceId": "<uuid>",
  "projectId": "<uuid>",
  "userId": "<uuid>",
  "categoryCode": "TASK_UPDATE",
  "channelCode": "EMAIL",
  "reasonCode": "QUIET_HOURS",
  "sourceType": "SYSTEM",
  "sourceId": null,
  "suppressedAt": "<instant>",
  "expiresAt": "<instant>",
  "createdAt": "<instant>"
}
```

---

## 5.8 Admin — Email Template

**Base:** `/api/v1/notification/email-templates`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../email-templates` | Tạo template | `CreateEmailTemplateRequest` |
| GET | `.../email-templates/{id}` | Lấy template | — |
| GET | `.../email-templates` | Tìm kiếm | `keyword`, `scope`, `status`, `workspaceId`, `eventDefinitionId`, `page`, `size` |
| PUT | `.../email-templates/{id}` | Cập nhật | `UpdateEmailTemplateRequest` |
| PATCH | `.../email-templates/{id}/activate` | Kích hoạt | — |
| PATCH | `.../email-templates/{id}/deactivate` | Vô hiệu hóa | — |
| DELETE | `.../email-templates/{id}` | Xoá | — |
| POST | `.../email-templates/{id}/versions` | Tạo draft version | `CreateEmailTemplateVersionRequest` |
| PATCH | `.../email-templates/{id}/versions/{versionId}/publish` | Publish version | `allowSensitiveVariables` (query, default false) |
| GET | `.../email-templates/{id}/versions` | Danh sách versions | — |
| POST | `.../email-templates/preview` | Preview template | `PreviewEmailTemplateRequest` |

**CreateEmailTemplateRequest:**
```json
{
  "code": "TASK_OVERDUE_NOTICE",
  "name": "Task Overdue Notification",
  "description": null,
  "scope": "SYSTEM",
  "workspaceId": null,
  "eventDefinitionId": "<uuid>"
}
```

**CreateEmailTemplateVersionRequest:**
```json
{
  "subjectTemplate": "Task overdue: {{task.title}}",
  "htmlBodyTemplate": "<p>Dear {{user.name}},</p>...",
  "textBodyTemplate": "Dear {{user.name}},..."
}
```

**EmailTemplateVersionResponse:**
```json
{
  "id": "<uuid>",
  "templateId": "<uuid>",
  "versionNumber": 1,
  "subjectTemplate": "Task overdue: {{task.title}}",
  "htmlBodyTemplate": "<p>Dear {{user.name}},</p>...",
  "textBodyTemplate": "Dear {{user.name}},...",
  "status": "DRAFT",
  "publishedAt": null,
  "publishedBy": null,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

**PreviewEmailTemplateRequest:**
```json
{
  "versionId": "<uuid>",
  "samplePayload": {
    "task.title": "Gather requirements",
    "user.name": "Nguyen Van A"
  }
}
```

---

## 5.9 Admin — Email Rule

**Base:** `/api/v1/notification/email-rules`

| Method | Path | Mô tả | Body |
|---|---|---|---|
| POST | `.../email-rules` | Tạo rule | `CreateEmailRuleRequest` |
| GET | `.../email-rules/{id}` | Lấy rule | — |
| GET | `.../email-rules` | Tìm kiếm | `keyword`, `scope`, `status`, `workspaceId`, `eventDefinitionId`, `templateId`, `page`, `size` |
| PUT | `.../email-rules/{id}` | Cập nhật | `UpdateEmailRuleRequest` |
| PATCH | `.../email-rules/{id}/activate` | Kích hoạt | — |
| PATCH | `.../email-rules/{id}/deactivate` | Vô hiệu | — |
| PATCH | `.../email-rules/{id}/enable` | Bật | — |
| PATCH | `.../email-rules/{id}/disable` | Tắt | — |
| DELETE | `.../email-rules/{id}` | Xoá | — |

**EmailRuleResponse:**
```json
{
  "id": "<uuid>",
  "code": "TASK_OVERDUE_EMAIL",
  "name": "Task Overdue Email",
  "description": null,
  "scope": "SYSTEM",
  "workspaceId": null,
  "eventDefinitionId": "<uuid>",
  "templateId": "<uuid>",
  "recipientStrategy": "TASK_ASSIGNEE",
  "recipientConfigJson": null,
  "priority": 10,
  "enabled": true,
  "mandatory": false,
  "allowSensitiveVariables": false,
  "status": "ACTIVE",
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

---

## 5.10 Admin — Email Delivery & Outbox

### Email Delivery

**Base:** `/api/v1/notification/email-deliveries`

| Method | Path | Mô tả | Params |
|---|---|---|---|
| GET | `.../email-deliveries/{id}` | Lấy delivery | — |
| GET | `.../email-deliveries` | Tìm kiếm | `ruleId`, `templateId`, `eventDefinitionId`, `workspaceId`, `status`, `page`, `size` |

**EmailDeliveryResponse:**
```json
{
  "id": "<uuid>",
  "ruleId": "<uuid>",
  "templateId": "<uuid>",
  "templateVersionId": "<uuid>",
  "eventDefinitionId": "<uuid>",
  "workspaceId": "<uuid>",
  "toEmail": "user@example.com",
  "renderedSubject": "Task overdue: Gather requirements",
  "status": "SENT",
  "failureReason": null,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

### Email Outbox

**Base:** `/api/v1/notification/email-outbox`

| Method | Path | Mô tả |
|---|---|---|
| GET | `.../email-outbox/{id}` | Lấy outbox record |
| GET | `.../email-outbox` | Tìm kiếm (`deliveryId`, `status`, `providerType`, `page`, `size`) |
| POST | `.../email-outbox/{id}/retry` | Retry thủ công |
| POST | `.../email-outbox/{id}/cancel` | Huỷ |

---

## 5.11 Admin — Reminder Rules & Alert Rules & Digest

| Controller | Path | CRUD |
|---|---|---|
| Reminder Rules | `/api/v1/workspaces/{workspaceId}/notifications/reminder-rules` | POST create, GET list |
| Alert Rules | `/api/v1/workspaces/{workspaceId}/notifications/alert-rules` | POST create, GET list |
| Digest Rules | `/api/v1/workspaces/{workspaceId}/notifications/digest-rules` | POST create, GET list |
| Digest Runs | `/api/v1/workspaces/{workspaceId}/notifications/digest-runs` | GET list (all), GET list (me) |

---

## Phụ lục — Common Status Values

| Entity | Status values |
|---|---|
| Project | `DRAFT` · `ACTIVE` · `ON_HOLD` · `COMPLETED` · `ARCHIVED` |
| Project Phase | `DRAFT` · `ACTIVE` · `COMPLETED` · `ARCHIVED` |
| Task | `TODO` · `IN_PROGRESS` · `BLOCKED` · `COMPLETED` · `CANCELLED` · `ARCHIVED` |
| Milestone | `PENDING` · `ACHIEVED` · `ARCHIVED` |
| WBS Node | `ACTIVE` · `ARCHIVED` |
| Schedule Run | `PENDING` · `RUNNING` · `COMPLETED` · `FAILED` · `CANCELLED` |
| Scope Package | `DRAFT` · `APPROVED` · `ARCHIVED` |
| Scope Item | `ACTIVE` · `ARCHIVED` |
| Deliverable | `DRAFT` · `IN_REVIEW` · `ACCEPTED` · `ARCHIVED` |
| Acceptance Criteria | `OPEN` · `SATISFIED` · `WAIVED` |
| RAID Item | `OPEN` · `IN_PROGRESS` · `RESOLVED` · `CLOSED` · `ESCALATED` · `ARCHIVED` |
| Decision | `PENDING` · `DECIDED` · `REJECTED` · `SUPERSEDED` · `ARCHIVED` |
| Meeting | `SCHEDULED` · `IN_PROGRESS` · `COMPLETED` · `CANCELLED` · `ARCHIVED` |
| Meeting Series | `ACTIVE` · `PAUSED` · `ARCHIVED` |
| Meeting Minutes | `DRAFT` · `IN_REVIEW` · `APPROVED` · `REJECTED` |
| Email Template | `DRAFT` · `ACTIVE` · `ARCHIVED` |
| Email Rule | `ACTIVE` · `INACTIVE` |
| Notification Item | `UNREAD` · `READ` · `DISMISSED` |
