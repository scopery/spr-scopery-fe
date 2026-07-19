# Wave 3 API Contract — ResourceCapacity · Profitability · Estimation · Quote · ProjectBaseline · ProjectFinance

> **Mục đích:** Tài liệu tham chiếu đầy đủ cho FE ráp UI Wave 3.
> **Swagger live:** `http://localhost:8080/swagger-ui.html`
> **OpenAPI JSON:** `http://localhost:8080/v3/api-docs`

---

## Conventions

### Response wrapper

Mọi response đều bọc trong `ApiResponse`:

```json
{ "success": true, "data": { ... }, "timestamp": "2026-07-18T13:00:00.000000+07:00" }
```

Flat list (không pagination): `"data": [...]`

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
  }
}
```

Error:
```json
{
  "success": false,
  "errorCode": "RESOURCE_NOT_FOUND",
  "message": "...",
  "details": [],
  "traceId": "aa231618-...",
  "timestamp": "2026-07-18T13:00:00Z"
}
```

### Auth

Cookie HTTP-only: `access_token` + `refresh_token`. Mọi endpoint đều yêu cầu auth.

### Ký hiệu schema

| Ký hiệu | Ví dụ thực tế |
|---|---|
| `"<uuid>"` | `"550e8400-e29b-41d4-a716-446655440000"` |
| `"<instant>"` | `"2026-07-18T06:00:00.000000Z"` |
| `"<date>"` | `"2026-07-18"` |
| `null` | xuất hiện trong JSON là `null`, không bị omit |

---

## Module Index

| # | Module | Base path chính | Số sub-controller |
|---|---|---|---|
| [1](#1-resourcecapacity) | ResourceCapacity | `/api/v1/capacity/...` | 17 |
| [2](#2-profitability) | Profitability | `/api/v1/projects/{projectId}/profitability/...` | 12 |
| [3](#3-estimation) | Estimation | `/api/v1/projects/{projectId}/estimation-runs`, `/estimation/current` | 3 |
| [4](#4-quote) | Quote | `/api/v1/projects/{projectId}/quotes` | 2 |
| [5](#5-projectbaseline) | ProjectBaseline | `/api/v1/projects/{projectId}/baselines`, `/change-requests` | 2 |
| [6](#6-projectfinance) | ProjectFinance | `/api/v1/projects/{projectId}/finance-scenarios`, `/finance/current` | 2 |

---

# 1. ResourceCapacity

## 1.1 Working Calendar

**Base:** `/api/v1/capacity/calendars`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/capacity/calendars?workspaceId=` | Tạo lịch làm việc |
| `GET` | `/api/v1/capacity/calendars/{id}` | Lấy theo ID |
| `GET` | `/api/v1/capacity/calendars?workspaceId=&status=&isDefault=&code=&page=&size=` | Tìm kiếm (paginated) |
| `PUT` | `/api/v1/capacity/calendars/{id}` | Cập nhật |
| `PATCH` | `/api/v1/capacity/calendars/{id}/activate` | Kích hoạt |
| `PATCH` | `/api/v1/capacity/calendars/{id}/deactivate` | Vô hiệu hoá |
| `PATCH` | `/api/v1/capacity/calendars/{id}/archive` | Lưu trữ |
| `PATCH` | `/api/v1/capacity/calendars/{id}/set-default` | Đặt làm mặc định |

**POST /api/v1/capacity/calendars — Request body**
```json
{
  "code": "WC-VN-STD",
  "name": "Vietnam Standard",
  "description": "Standard VN working calendar",
  "timezone": "Asia/Ho_Chi_Minh",
  "isDefault": false
}
```

**WorkingCalendarResponse**
```json
{
  "id": "<uuid>",
  "workspaceId": "<uuid>",
  "code": "WC-VN-STD",
  "name": "Vietnam Standard",
  "description": "Standard VN working calendar",
  "timezone": "Asia/Ho_Chi_Minh",
  "isDefault": false,
  "status": "ACTIVE",
  "archivedAt": null,
  "archivedBy": null,
  "version": 1,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

`status` values: `ACTIVE` | `INACTIVE` | `ARCHIVED`

---

## 1.2 Calendar Day Rules

**Base:** `/api/v1/capacity/calendars/{calendarId}/day-rules`

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/capacity/calendars/{calendarId}/day-rules` | Lấy toàn bộ day rules |
| `PUT` | `/api/v1/capacity/calendars/{calendarId}/day-rules` | Replace toàn bộ day rules |

**PUT — Request body**
```json
{
  "dayRules": [
    {
      "dayOfWeek": "MONDAY",
      "isWorkingDay": true,
      "startTime": "08:30",
      "endTime": "17:30",
      "workingHours": 8.0
    },
    {
      "dayOfWeek": "SATURDAY",
      "isWorkingDay": false,
      "startTime": null,
      "endTime": null,
      "workingHours": 0
    }
  ]
}
```

**CalendarDayRuleResponse** (mảng)
```json
[
  {
    "id": "<uuid>",
    "workingCalendarId": "<uuid>",
    "dayOfWeek": "MONDAY",
    "isWorkingDay": true,
    "startTime": "08:30",
    "endTime": "17:30",
    "workingHours": 8.0
  }
]
```

`dayOfWeek` values: `MONDAY` | `TUESDAY` | `WEDNESDAY` | `THURSDAY` | `FRIDAY` | `SATURDAY` | `SUNDAY`

---

## 1.3 Calendar Exceptions

**Base:** `/api/v1/capacity/calendars/{calendarId}/exceptions`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/capacity/calendars/{calendarId}/exceptions` | Tạo ngày ngoại lệ |
| `GET` | `/api/v1/capacity/calendars/{calendarId}/exceptions/{id}` | Lấy theo ID |
| `GET` | `/api/v1/capacity/calendars/{calendarId}/exceptions?from=&to=&page=&size=` | Tìm theo khoảng ngày |
| `PUT` | `/api/v1/capacity/calendars/{calendarId}/exceptions/{id}` | Cập nhật |
| `DELETE` | `/api/v1/capacity/calendars/{calendarId}/exceptions/{id}` | Xoá |

**POST — Request body**
```json
{
  "exceptionDate": "2026-09-02",
  "exceptionType": "HOLIDAY",
  "name": "Quốc khánh 2/9",
  "description": null,
  "isWorkingDay": false,
  "workingHours": 0
}
```

**CalendarExceptionResponse**
```json
{
  "id": "<uuid>",
  "workingCalendarId": "<uuid>",
  "exceptionDate": "2026-09-02",
  "exceptionType": "HOLIDAY",
  "name": "Quốc khánh 2/9",
  "description": null,
  "isWorkingDay": false,
  "workingHours": 0,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

`exceptionType` values: `HOLIDAY` | `CUSTOM_WORKING` | `CUSTOM_NON_WORKING`

---

## 1.4 Resource Profile

**Base:** `/api/v1/capacity/workspaces/{workspaceId}/resources`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/capacity/workspaces/{workspaceId}/resources` | Tạo resource profile |
| `GET` | `/api/v1/capacity/workspaces/{workspaceId}/resources` | Danh sách tất cả |
| `GET` | `/api/v1/capacity/workspaces/{workspaceId}/resources/{resourceId}` | Lấy theo ID |
| `PATCH` | `/api/v1/capacity/workspaces/{workspaceId}/resources/{resourceId}/archive` | Lưu trữ |
| `POST` | `/api/v1/capacity/workspaces/{workspaceId}/resources/sync-from-members` | Tạo profiles từ workspace members |

**POST — Request body**
```json
{
  "resourceType": "MEMBER",
  "displayName": "Nguyen Van A",
  "linkedUserId": "<uuid>",
  "linkedWorkspaceMemberId": "<uuid>",
  "primaryRoleId": "<uuid>"
}
```

**ResourceProfileResponse** — fields chính:

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | |
| `workspaceId` | UUID | |
| `resourceType` | String | `MEMBER` \| `EXTERNAL` \| `PLACEHOLDER` |
| `displayName` | String | |
| `linkedUserId` | UUID | null nếu external |
| `linkedWorkspaceMemberId` | UUID | null nếu external |
| `primaryRoleId` | UUID | |
| `status` | String | `ACTIVE` \| `ARCHIVED` |
| `createdAt` | Instant | |
| `updatedAt` | Instant | |

---

## 1.5 Resource Role

**Base:** `/api/v1/capacity/workspaces/{workspaceId}/resources/roles`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/capacity/workspaces/{workspaceId}/resources/roles` | Tạo role |
| `GET` | `/api/v1/capacity/workspaces/{workspaceId}/resources/roles` | Danh sách |

**ResourceRoleResponse** — fields chính: `id`, `workspaceId`, `name`, `description`, `createdAt`, `updatedAt`

---

## 1.6 Resource Skill

**Base:** `/api/v1/capacity/workspaces/{workspaceId}/resources/skills`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/capacity/workspaces/{workspaceId}/resources/skills` | Tạo skill |
| `GET` | `/api/v1/capacity/workspaces/{workspaceId}/resources/skills` | Danh sách |

**ResourceSkillResponse** — fields chính: `id`, `workspaceId`, `name`, `description`, `createdAt`, `updatedAt`

---

## 1.7 User Capacity Profile

**Base:** `/api/v1/capacity/user-profiles`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/capacity/user-profiles?workspaceId=` | Tạo capacity profile |
| `GET` | `/api/v1/capacity/user-profiles/{id}` | Lấy theo ID |
| `GET` | `/api/v1/capacity/user-profiles?workspaceId=&workspaceMemberId=&userId=&status=&page=&size=` | Tìm kiếm |
| `PUT` | `/api/v1/capacity/user-profiles/{id}` | Cập nhật |
| `PATCH` | `/api/v1/capacity/user-profiles/{id}/activate` | Kích hoạt |
| `PATCH` | `/api/v1/capacity/user-profiles/{id}/deactivate` | Vô hiệu hoá |
| `PATCH` | `/api/v1/capacity/user-profiles/{id}/archive` | Lưu trữ |

**POST — Request body**
```json
{
  "workspaceMemberId": "<uuid>",
  "workingCalendarId": "<uuid>",
  "defaultDailyHours": 8.0,
  "focusFactor": 0.85,
  "effectiveFrom": "2026-07-01",
  "effectiveTo": null
}
```

**UserCapacityProfileResponse** — fields chính:

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | |
| `workspaceId` | UUID | |
| `workspaceMemberId` | UUID | |
| `userId` | UUID | |
| `workingCalendarId` | UUID | |
| `defaultDailyHours` | BigDecimal | số giờ làm/ngày mặc định |
| `focusFactor` | BigDecimal | hệ số tập trung (0–1) |
| `effectiveFrom` | LocalDate | |
| `effectiveTo` | LocalDate | null = không giới hạn |
| `status` | String | `ACTIVE` \| `INACTIVE` \| `ARCHIVED` |
| `createdAt` | Instant | |
| `updatedAt` | Instant | |

---

## 1.8 Project Resource Allocation

**Base:** `/api/v1/capacity/project-allocations`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/capacity/project-allocations?workspaceId=` | Tạo allocation |
| `GET` | `/api/v1/capacity/project-allocations/{id}` | Lấy theo ID |
| `GET` | `/api/v1/capacity/project-allocations?workspaceId=&projectId=&workspaceMemberId=&userId=&status=&page=&size=` | Tìm kiếm |
| `PUT` | `/api/v1/capacity/project-allocations/{id}` | Cập nhật |
| `PATCH` | `/api/v1/capacity/project-allocations/{id}/activate` | Kích hoạt |
| `PATCH` | `/api/v1/capacity/project-allocations/{id}/deactivate` | Vô hiệu hoá |
| `PATCH` | `/api/v1/capacity/project-allocations/{id}/archive` | Lưu trữ |

**POST — Request body**
```json
{
  "projectId": "<uuid>",
  "workspaceMemberId": "<uuid>",
  "allocationPercent": 80,
  "allocationType": "FULL_TIME",
  "startDate": "2026-08-01",
  "endDate": "2026-12-31",
  "notes": null
}
```

**ProjectResourceAllocationResponse**
```json
{
  "id": "<uuid>",
  "workspaceId": "<uuid>",
  "projectId": "<uuid>",
  "workspaceMemberId": "<uuid>",
  "userId": "<uuid>",
  "allocationPercent": 80,
  "allocationType": "FULL_TIME",
  "status": "ACTIVE",
  "startDate": "2026-08-01",
  "endDate": "2026-12-31",
  "notes": null,
  "archivedAt": null,
  "archivedBy": null,
  "version": 1
}
```

`allocationType` values: `FULL_TIME` | `PART_TIME` | `ON_DEMAND`

---

## 1.9 Task Resource Assignment

**Base:** `/api/v1/projects/{projectId}/tasks/{taskId}/resource-assignments`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/projects/{projectId}/tasks/{taskId}/resource-assignments` | Gán resource vào task |
| `GET` | `/api/v1/projects/{projectId}/tasks/{taskId}/resource-assignments` | Danh sách assignments của task |
| `DELETE` | `/api/v1/projects/{projectId}/tasks/{taskId}/resource-assignments/{assignmentId}` | Xoá assignment |

**TaskResourceAssignmentResponse** — fields chính: `id`, `projectId`, `taskId`, `workspaceMemberId`, `userId`, `roleId`, `estimatedHours`, `actualHours`, `createdAt`, `updatedAt`

---

## 1.10 Effort Estimate

**Base:** `/api/v1/capacity/projects/{projectId}/resources/effort-estimates`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/capacity/projects/{projectId}/resources/effort-estimates` | Tạo ước tính effort |
| `GET` | `/api/v1/capacity/projects/{projectId}/resources/effort-estimates` | Danh sách |

**EffortEstimateResponse** — fields chính: `id`, `projectId`, `taskId`, `workspaceMemberId`, `estimatedHours`, `estimationMethod`, `createdAt`, `updatedAt`

---

## 1.11 Actual Effort

**Base:** `/api/v1/capacity/projects/{projectId}/resources/actual-effort-records`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/capacity/projects/{projectId}/resources/actual-effort-records` | Ghi nhận effort thực tế |
| `GET` | `/api/v1/capacity/projects/{projectId}/resources/actual-effort-records` | Danh sách |
| `POST` | `/api/v1/capacity/projects/{projectId}/resources/actual-effort-records/{recordId}/cancel` | Huỷ record |

**ActualEffortRecordResponse** — fields chính: `id`, `projectId`, `taskId`, `workspaceMemberId`, `effortHours`, `effortDate`, `status`, `cancelledAt`, `createdAt`, `updatedAt`

---

## 1.12 Utilization (Rebuild)

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/capacity/workspaces/{workspaceId}/resources/{resourceId}/utilization/rebuild` | Rebuild utilization snapshot |

**Optional request body:** `{ "effortHours": 120.0, "availableCapacityHours": 160.0 }`

**UtilizationSummaryResponse** — fields chính: `workspaceId`, `resourceId`, `periodStart`, `periodEnd`, `totalEffortHours`, `availableCapacityHours`, `utilizationPercent`, `status`

---

## 1.13 Workload Snapshot

**Base:** `/api/v1/capacity/projects/{projectId}/resources/workload-snapshots`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/capacity/projects/{projectId}/resources/workload-snapshots` | Tạo workload snapshot |
| `GET` | `/api/v1/capacity/projects/{projectId}/resources/workload-snapshots` | Danh sách snapshots |

**WorkloadSnapshotApiResponse** — fields chính: `id`, `projectId`, `snapshotDate`, `totalAllocatedHours`, `totalActualHours`, `utilizationPercent`, `memberBreakdown`, `createdAt`

---

## 1.14 Capacity Calculation

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/capacity/users/{userId}/availability?workspaceId=&fromDate=&toDate=` | Availability của user |
| `GET` | `/api/v1/capacity/workspaces/{workspaceId}/overview?fromDate=&toDate=` | Overview toàn workspace |
| `GET` | `/api/v1/capacity/projects/{projectId}/allocations/summary?fromDate=&toDate=` | Tóm tắt allocation của project |
| `GET` | `/api/v1/capacity/over-allocations?workspaceId=&fromDate=&toDate=` | Danh sách over-allocation |
| `POST` | `/api/v1/capacity/calculate?workspaceId=` | Tính capacity chi tiết |

**POST /api/v1/capacity/calculate — Request body**
```json
{
  "userId": "<uuid>",
  "projectId": "<uuid>",
  "fromDate": "2026-08-01",
  "toDate": "2026-08-31"
}
```

**CapacityCalculationResponse**
```json
{
  "workspaceId": "<uuid>",
  "userId": "<uuid>",
  "projectId": "<uuid>",
  "fromDate": "2026-08-01",
  "toDate": "2026-08-31",
  "dailyEntries": [
    { "date": "2026-08-03", "workingHours": 8.0, "focusedHours": 6.8, "allocatedHours": 6.0 }
  ],
  "totalWorkingHours": 176.0,
  "totalFocusedHours": 149.6,
  "totalProjectAllocatedHours": 132.0
}
```

---

## 1.15 Resource Planning

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/capacity/projects/{projectId}/resources/effort-forecasts/rebuild` | Rebuild effort forecast |
| `POST` | `/api/v1/capacity/projects/{projectId}/resources/capacity-summary/rebuild` | Rebuild capacity summary |
| `POST` | `/api/v1/capacity/projects/{projectId}/resources/cost-inputs/rebuild?includeSensitive=` | Rebuild cost inputs |
| `GET` | `/api/v1/capacity/projects/{projectId}/resources/cost-inputs?includeSensitive=` | Lấy cost inputs |
| `POST` | `/api/v1/capacity/projects/{projectId}/resources/risk-flags` | Tạo resource risk flag |
| `GET` | `/api/v1/capacity/projects/{projectId}/resources/risk-flags` | Danh sách risk flags |
| `POST` | `/api/v1/capacity/projects/{projectId}/resources/risk-flags/{riskFlagId}/mitigate` | Đánh dấu mitigate |
| `POST` | `/api/v1/capacity/projects/{projectId}/resources/risk-flags/{riskFlagId}/close` | Đóng risk flag |

**POST /risk-flags — Request body**
```json
{
  "resourceProfileId": "<uuid>",
  "riskReason": "OVER_ALLOCATED",
  "impactType": "SCHEDULE_DELAY",
  "description": "Resource assigned to 3 projects simultaneously"
}
```

**ResourceRiskFlagResponse** — fields chính: `id`, `projectId`, `resourceProfileId`, `riskReason`, `impactType`, `description`, `status`, `mitigatedAt`, `closedAt`, `createdAt`

`status` values: `OPEN` | `MITIGATED` | `CLOSED`

---

## 1.16 Assignment Conflict

**Base:** `/api/v1/capacity/projects/{projectId}/resources/assignment-conflicts`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../assignment-conflicts` | Phát hiện conflict |
| `GET` | `.../assignment-conflicts` | Danh sách conflicts |
| `POST` | `.../assignment-conflicts/{conflictId}/acknowledge` | Ghi nhận đã biết |
| `POST` | `.../conflicts/recalculate` | Tính lại tất cả conflicts |

**AssignmentConflictApiResponse** — fields chính: `id`, `projectId`, `conflictType`, `severity`, `resourceProfileId`, `taskId`, `description`, `status`, `acknowledgedAt`, `createdAt`

`status` values: `OPEN` | `ACKNOWLEDGED` | `RESOLVED`

---

## 1.17 Utilization Threshold Policy

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/capacity/workspaces/{workspaceId}/resources/utilization-threshold-policy` | Lấy policy của workspace |
| `PUT` | `/api/v1/capacity/workspaces/{workspaceId}/resources/utilization-threshold-policy` | Cập nhật policy workspace |
| `GET` | `/api/v1/capacity/projects/{projectId}/resources/utilization-threshold-policy` | Lấy policy của project |
| `PUT` | `/api/v1/capacity/projects/{projectId}/resources/utilization-threshold-policy` | Cập nhật policy project |

**PUT — Request body**
```json
{
  "underAllocatedPercent": 50,
  "healthyMinPercent": 50,
  "healthyMaxPercent": 80,
  "watchMaxPercent": 90,
  "overloadedPercent": 100,
  "criticalOverloadPercent": 120
}
```

**ThresholdPolicyResponse** — fields chính: `workspaceId`, `projectId`, `underAllocatedPercent`, `healthyMinPercent`, `healthyMaxPercent`, `watchMaxPercent`, `overloadedPercent`, `criticalOverloadPercent`, `updatedAt`

---

# 2. Profitability

## 2.1 Rate Cards (Workspace scope)

**Base:** `/api/v1/workspaces/{workspaceId}/profitability/rate-cards`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../rate-cards` | Tạo rate card cấp workspace |
| `GET` | `.../rate-cards` | Danh sách |
| `GET` | `.../rate-cards/{id}` | Lấy theo ID |
| `PUT` | `.../rate-cards/{id}` | Cập nhật |
| `POST` | `.../rate-cards/{id}/archive` | Lưu trữ |

**POST — Request body**
```json
{
  "rateCode": "RC-SE-USD",
  "name": "Senior Engineer - USD",
  "rateType": "ROLE_BASED",
  "roleName": "Senior Engineer",
  "teamId": null,
  "currency": "USD",
  "amountPerHour": 85.00,
  "amountPerDay": 680.00
}
```

**ProfitRateCardResponse**
```json
{
  "id": "<uuid>",
  "workspaceId": "<uuid>",
  "projectId": null,
  "rateCode": "RC-SE-USD",
  "name": "Senior Engineer - USD",
  "rateType": "ROLE_BASED",
  "roleName": "Senior Engineer",
  "teamId": null,
  "currency": "USD",
  "amountPerHour": 85.00,
  "amountPerDay": 680.00,
  "status": "ACTIVE"
}
```

`rateType` values: `ROLE_BASED` | `INDIVIDUAL` | `FLAT`

---

## 2.2 Rate Cards (Project scope)

**Base:** `/api/v1/projects/{projectId}/profitability/rate-cards`

Cùng endpoints và schema với workspace rate cards (`2.1`). `projectId` trong response sẽ có giá trị.

---

## 2.3 Profitability Profile & Summary

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/projects/{projectId}/profitability/profile` | Khởi tạo profitability profile |
| `GET` | `/api/v1/projects/{projectId}/profitability/profile` | Lấy profile |
| `GET` | `/api/v1/projects/{projectId}/profitability/summary` | Tóm tắt profitability |
| `GET` | `/api/v1/projects/{projectId}/profitability/summary/portal` | Tóm tắt dạng portal (rút gọn) |
| `POST` | `/api/v1/projects/{projectId}/profitability/summary/rebuild` | Tính lại summary |

**POST /profile — Request body:** `{ "currency": "USD" }`

**ProjectProfitabilityProfileResponse** — fields chính: `id`, `projectId`, `workspaceId`, `currency`, `status`, `createdAt`, `updatedAt`

**ProfitabilitySummaryResponse** — fields chính:

| Field | Type |
|---|---|
| `projectId` | UUID |
| `currency` | String |
| `totalRevenue` | BigDecimal |
| `totalCost` | BigDecimal |
| `grossMargin` | BigDecimal |
| `grossMarginPercent` | BigDecimal |
| `profitBeforeTax` | BigDecimal |
| `pbtPercent` | BigDecimal |
| `healthStatus` | String (`HEALTHY` \| `WATCH` \| `AT_RISK` \| `LOSS_RISK`) |
| `updatedAt` | Instant |

---

## 2.4 Cost Sources

**Base:** `/api/v1/projects/{projectId}/profitability/cost-sources`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../cost-sources` | Thêm cost source |
| `GET` | `.../cost-sources` | Danh sách |
| `GET` | `.../cost-sources/{sourceId}` | Lấy theo ID |
| `PUT` | `.../cost-sources/{sourceId}` | Cập nhật |
| `POST` | `.../cost-sources/{sourceId}/archive` | Lưu trữ |

**POST — Request body**
```json
{
  "sourceType": "LABOR",
  "sourceId": "<uuid>",
  "effortHours": 200.0,
  "rateAmount": 85.00,
  "amount": 17000.00,
  "currency": "USD",
  "includedInForecast": true
}
```

**ProfitCostSourceResponse**
```json
{
  "id": "<uuid>",
  "sourceType": "LABOR",
  "sourceId": "<uuid>",
  "effortHours": 200.0,
  "rateAmount": 85.00,
  "amount": 17000.00,
  "currency": "USD",
  "includedInForecast": true,
  "status": "ACTIVE"
}
```

`sourceType` values: `LABOR` | `VENDOR` | `OVERHEAD` | `CUSTOM`

---

## 2.5 Revenue Sources

**Base:** `/api/v1/projects/{projectId}/profitability/revenue-sources`

Cùng endpoints với cost sources (`2.4`). Request/response fields:

**POST — Request body**
```json
{
  "sourceType": "CONTRACT",
  "sourceId": "<uuid>",
  "amount": 50000.00,
  "currency": "USD",
  "includedInForecast": true,
  "confidence": 0.9
}
```

`sourceType` values: `CONTRACT` | `MILESTONE` | `CHANGE_ORDER` | `OTHER`

---

## 2.6 Cost Forecasts

**Base:** `/api/v1/projects/{projectId}/profitability/cost-forecasts`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../cost-forecasts` | Tạo cost forecast |
| `GET` | `.../cost-forecasts` | Danh sách |
| `GET` | `.../cost-forecasts/{forecastId}` | Lấy theo ID |
| `POST` | `.../cost-forecasts/{forecastId}/archive` | Lưu trữ |

**POST — Request body**
```json
{
  "forecastType": "LABOR",
  "currency": "USD",
  "forecastAmount": 85000.00,
  "confidencePercent": 90,
  "forecastDate": "2026-12-31",
  "assumptionNotes": "Based on current team allocation"
}
```

---

## 2.7 Revenue Forecasts

**Base:** `/api/v1/projects/{projectId}/profitability/revenue-forecasts`

Cùng endpoints với cost forecasts (`2.6`). `forecastType` values: `CONTRACT` | `MILESTONE` | `CHANGE_ORDER` | `ESTIMATE`

---

## 2.8 Profitability Plan

**Base:** `/api/v1/projects/{projectId}/profitability/plans`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../plans` | Tạo plan |
| `GET` | `.../plans` | Danh sách plans |
| `GET` | `.../plans/{planId}` | Lấy plan |
| `GET` | `.../plans/{planId}/versions` | Danh sách versions |
| `GET` | `.../plans/{planId}/versions/{versionId}` | Lấy version |
| `POST` | `.../plans/{planId}/versions/{versionId}/finalize` | Finalize version |

**POST — Request body**
```json
{
  "planCode": "PP-2026-Q3",
  "name": "Q3 2026 Plan",
  "planType": "BUDGET",
  "versionLabel": "v1.0",
  "currency": "USD",
  "plannedRevenue": 200000.00,
  "plannedCost": 140000.00,
  "plannedProfit": 60000.00,
  "plannedMarginPercent": 30.0,
  "baselineRevenue": null,
  "baselineCost": null,
  "baselineProfit": null,
  "baselineMarginPercent": null,
  "assumptionNotes": null
}
```

**ProfitabilityPlanResponse**
```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "planCode": "PP-2026-Q3",
  "name": "Q3 2026 Plan",
  "planType": "BUDGET",
  "status": "DRAFT",
  "currentVersionId": "<uuid>"
}
```

`planType` values: `BUDGET` | `FORECAST` | `ACTUALS` | `SCENARIO`

---

## 2.9 Adjustments

**Base:** `/api/v1/projects/{projectId}/profitability/adjustments`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../adjustments` | Tạo adjustment |
| `GET` | `.../adjustments` | Danh sách |
| `POST` | `.../adjustments/{adjustmentId}/apply` | Áp dụng adjustment |

**POST — Request body**
```json
{
  "adjustmentType": "COST_REDUCTION",
  "amount": 5000.00,
  "reason": "Negotiate vendor discount"
}
```

`adjustmentType` values: `COST_REDUCTION` | `REVENUE_UPLIFT` | `MARGIN_ADJUSTMENT`

---

## 2.10 Profitability Threshold Policy

**Base:** `/api/v1/projects/{projectId}/profitability/threshold-policy`

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../threshold-policy` | Lấy policy của project |
| `PUT` | `.../threshold-policy` | Tạo hoặc cập nhật policy |

**PUT — Request body**
```json
{
  "healthyMarginPercent": 20,
  "watchMarginPercent": 10,
  "atRiskMarginPercent": 5,
  "lossRiskMarginPercent": 0
}
```

---

## 2.11 Variance

**Base:** `/api/v1/projects/{projectId}/profitability/variance`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../variance` | Tính variance |
| `GET` | `.../variance` | Danh sách |
| `GET` | `.../variance/{varianceId}` | Lấy theo ID |

**POST — Request body**
```json
{
  "varianceType": "COST_OVERRUN",
  "fromAmount": 140000.00,
  "toAmount": 155000.00,
  "varianceAmount": 15000.00,
  "variancePercent": 10.71,
  "currency": "USD",
  "explanation": "Unexpected infrastructure cost",
  "sourceSnapshotId": null
}
```

`varianceType` values: `COST_OVERRUN` | `REVENUE_SHORTFALL` | `MARGIN_EROSION` | `SCHEDULE_IMPACT`

---

## 2.12 Risk Flags (Profitability)

**Base:** `/api/v1/projects/{projectId}/profitability/risk-flags`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../risk-flags` | Tạo risk flag |
| `GET` | `.../risk-flags` | Danh sách |
| `GET` | `.../risk-flags/{id}` | Lấy theo ID |
| `POST` | `.../risk-flags/{id}/mitigate` | Mitigate |
| `POST` | `.../risk-flags/{id}/close` | Đóng |

**POST — Request body**
```json
{
  "reason": "Labor cost exceeds forecast by 15%",
  "impactType": "MARGIN_EROSION",
  "amountAtRisk": 12000.00
}
```

`impactType` values: `MARGIN_EROSION` | `CASH_FLOW_RISK` | `REVENUE_AT_RISK` | `COST_OVERRUN`

---

# 3. Estimation

## 3.1 Estimation Runs

**Base:** `/api/v1/projects/{projectId}/estimation-runs`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/projects/{projectId}/estimation-runs` | Tạo và chạy estimation |
| `GET` | `/api/v1/projects/{projectId}/estimation-runs` | Danh sách |
| `GET` | `/api/v1/projects/{projectId}/estimation-runs/{estimationRunId}` | Lấy theo ID |
| `POST` | `/api/v1/projects/{projectId}/estimation-runs/{estimationRunId}/cancel` | Huỷ |
| `POST` | `/api/v1/projects/{projectId}/estimation-runs/{estimationRunId}/mark-current` | Đặt làm current |
| `GET` | `/api/v1/projects/{projectId}/estimation-runs/{estimationRunId}/tasks` | Snapshot từng task |
| `GET` | `/api/v1/projects/{projectId}/estimation-runs/{estimationRunId}/wbs-rollups` | Rollup theo WBS node |
| `GET` | `/api/v1/projects/{projectId}/estimation-runs/{estimationRunId}/phase-rollups` | Rollup theo phase |
| `GET` | `/api/v1/projects/{projectId}/estimation-runs/{estimationRunId}/summary` | Tóm tắt toàn run |

**POST — Request body**
```json
{
  "name": "Sprint 1 Estimate",
  "description": null,
  "scheduleRunId": "<uuid>",
  "calculationMode": "STANDARD",
  "rateTargetDateStrategy": "TASK_START_DATE",
  "currencyPolicy": "USD",
  "options": {
    "includeCompletedTasks": false,
    "includeCancelledTasks": false,
    "includeArchivedTasks": false,
    "useBillingPreview": true,
    "markAsCurrent": true
  }
}
```

`calculationMode` values: `STANDARD` | `BLENDED` | `ROLE_BASED`
`rateTargetDateStrategy` values: `TASK_START_DATE` | `PROJECT_START_DATE` | `RUN_DATE` | `FIXED_DATE`

**EstimationRunResponse**
```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "workspaceId": "<uuid>",
  "scheduleRunId": "<uuid>",
  "name": "Sprint 1 Estimate",
  "description": null,
  "status": "COMPLETED",
  "calculationMode": "STANDARD",
  "rateTargetDateStrategy": "TASK_START_DATE",
  "currencyPolicy": "USD",
  "assumptionsJson": null,
  "resultSummaryJson": null,
  "errorCode": null,
  "errorMessage": null,
  "startedAt": "<instant>",
  "completedAt": "<instant>",
  "actorUserId": "<uuid>",
  "traceId": "...",
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

`status` values: `PENDING` | `RUNNING` | `COMPLETED` | `FAILED` | `CANCELLED`

---

## 3.2 Current Estimation

**Base:** `/api/v1/projects/{projectId}/estimation/current`

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/projects/{projectId}/estimation/current` | Lấy current estimation run |
| `GET` | `/api/v1/projects/{projectId}/estimation/current/tasks` | Task snapshots của current run |
| `GET` | `/api/v1/projects/{projectId}/estimation/current/wbs-rollups` | WBS rollups |
| `GET` | `/api/v1/projects/{projectId}/estimation/current/phase-rollups` | Phase rollups |
| `GET` | `/api/v1/projects/{projectId}/estimation/current/summary` | Summary |

**TaskEstimateSnapshotResponse** — fields chính:

| Field | Type | Mô tả |
|---|---|---|
| `id` | UUID | |
| `estimationRunId` | UUID | |
| `taskId` | UUID | |
| `taskCode` | String | |
| `taskTitle` | String | |
| `costRoleCode` | String | |
| `estimateHours` | BigDecimal | |
| `baseCostRate` | BigDecimal | |
| `adjustedCostRate` | BigDecimal | |
| `estimatedLaborCost` | BigDecimal | |
| `estimatedBillingPreview` | BigDecimal | |
| `currencyCode` | String | |
| `inflationPercent` | BigDecimal | |
| `status` | String | `RESOLVED` \| `UNRESOLVED_ROLE` \| `UNRESOLVED_RATE` \| `EXCLUDED` |
| `issueCode` | String | null nếu OK |

**ProjectEstimateSummaryResponse** — fields chính:

| Field | Type |
|---|---|
| `totalTaskCount` | int |
| `includedTaskCount` | int |
| `excludedTaskCount` | int |
| `unestimatedTaskCount` | int |
| `unresolvedRoleTaskCount` | int |
| `unresolvedRateTaskCount` | int |
| `totalEstimateHours` | BigDecimal |
| `totalLaborCost` | BigDecimal |
| `totalBillingPreview` | BigDecimal |
| `averageCostRate` | BigDecimal |
| `averageBillingRate` | BigDecimal |
| `currencyCode` | String |
| `warningCount` | int |

---

## 3.3 Rate Impact Preview

**Base:** `/api/v1/projects/{projectId}/estimation/preview-rate-impact`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/projects/{projectId}/estimation/preview-rate-impact` | Preview tác động rate change lên task |

**POST — Request body**
```json
{
  "taskId": "<uuid>",
  "workspaceId": "<uuid>",
  "costRoleId": "<uuid>",
  "costRoleCode": "SENIOR_BE",
  "targetDate": "2026-09-01",
  "currencyCode": "USD"
}
```

**TaskRatePreviewResponse**
```json
{
  "taskId": "<uuid>",
  "estimateHours": 40.0,
  "rateSnapshot": {
    "rateCardId": "<uuid>",
    "rateCardVersionId": "<uuid>",
    "baseCostRate": 85.00,
    "adjustedCostRate": 89.25,
    "currencyCode": "USD"
  },
  "estimatedLaborCostPreview": 3570.00,
  "label": "Rate as of 2026-09-01 (with 5% inflation)"
}
```

---

# 4. Quote

## 4.1 Quote

**Base:** `/api/v1/projects/{projectId}/quotes`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/projects/{projectId}/quotes` | Tạo quote |
| `GET` | `/api/v1/projects/{projectId}/quotes` | Danh sách |
| `GET` | `/api/v1/projects/{projectId}/quotes/{quoteId}` | Lấy theo ID |
| `PUT` | `/api/v1/projects/{projectId}/quotes/{quoteId}` | Cập nhật metadata |
| `PATCH` | `/api/v1/projects/{projectId}/quotes/{quoteId}/archive` | Lưu trữ |

**POST — Request body**
```json
{
  "code": "QT-2026-001",
  "title": "Phase 1 Delivery Quote",
  "description": "Initial delivery proposal",
  "sourceFinanceScenarioId": "<uuid>",
  "clientName": "Acme Corp",
  "clientCompany": "Acme Corporation Ltd.",
  "clientEmail": "procurement@acme.com",
  "clientContactName": "John Smith",
  "clientReference": "PO-2026-789"
}
```

**QuoteResponse**
```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "workspaceId": "<uuid>",
  "sourceFinanceScenarioId": "<uuid>",
  "code": "QT-2026-001",
  "title": "Phase 1 Delivery Quote",
  "description": "Initial delivery proposal",
  "clientName": "Acme Corp",
  "clientCompany": "Acme Corporation Ltd.",
  "clientEmail": "procurement@acme.com",
  "clientContactName": "John Smith",
  "clientReference": "PO-2026-789",
  "status": "DRAFT",
  "currentVersionId": "<uuid>",
  "archivedAt": null,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

`status` values: `DRAFT` | `SUBMITTED` | `APPROVED` | `REJECTED` | `SENT` | `ACCEPTED` | `ARCHIVED`

---

## 4.2 Quote Versions

**Base:** `/api/v1/projects/{projectId}/quotes/{quoteId}/versions`

### Lifecycle endpoints

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../versions` | Tạo version mới |
| `GET` | `.../versions` | Danh sách versions |
| `GET` | `.../versions/{versionId}` | Lấy theo ID |
| `PUT` | `.../versions/{versionId}` | Cập nhật |
| `POST` | `.../versions/{versionId}/duplicate` | Nhân bản version |
| `PATCH` | `.../versions/{versionId}/archive` | Lưu trữ |
| `GET` | `.../versions/{versionId}/summary` | Tóm tắt tài chính |
| `POST` | `.../versions/{versionId}/recalculate` | Tính lại summary |
| `POST` | `.../versions/{versionId}/solve-target-margin` | Tính giá cần thiết để đạt margin |
| `POST` | `.../versions/{versionId}/submit` | Nộp duyệt |
| `POST` | `.../versions/{versionId}/approve` | Phê duyệt |
| `POST` | `.../versions/{versionId}/reject` | Từ chối (body: `reason`) |
| `POST` | `.../versions/{versionId}/send` | Gửi cho khách |
| `POST` | `.../versions/{versionId}/mark-accepted` | Đánh dấu khách chấp nhận |
| `POST` | `.../versions/{versionId}/mark-current` | Đặt làm current version |

**POST .../versions — Request body**
```json
{
  "financeScenarioId": "<uuid>",
  "pricingMethod": "COST_PLUS_MARGIN",
  "costBaseMethod": "TOTAL_COST",
  "targetMarginPercent": 30.0,
  "generateLinesFrom": "PHASES",
  "validUntil": "2026-10-31",
  "proposalTitle": "Scopery Platform — Phase 1",
  "proposalNotes": null,
  "discountMethod": "PERCENT",
  "discountPercent": 5.0,
  "discountAmount": null,
  "discountReason": "Early-bird partnership discount"
}
```

`pricingMethod` values: `COST_PLUS_MARGIN` | `FIXED_PRICE` | `TIME_AND_MATERIALS`
`costBaseMethod` values: `TOTAL_COST` | `LABOR_ONLY` | `DIRECT_COST`
`discountMethod` values: `PERCENT` | `FIXED_AMOUNT` | `NONE`

**QuoteVersionResponse** — fields chính:

| Field | Type |
|---|---|
| `id` | UUID |
| `quoteId` | UUID |
| `versionNumber` | int |
| `status` | String |
| `pricingMethod` | String |
| `targetMarginPercent` | BigDecimal |
| `discountMethod` | String |
| `discountPercent` | BigDecimal |
| `discountAmount` | BigDecimal |
| `validUntil` | LocalDate |
| `currentFlag` | boolean |
| `submittedAt` | Instant \| null |
| `approvedAt` | Instant \| null |
| `rejectedAt` | Instant \| null |
| `rejectionReason` | String \| null |
| `sentAt` | Instant \| null |
| `acceptedAt` | Instant \| null |
| `archivedAt` | Instant \| null |

**QuoteSummaryResponse**
```json
{
  "id": "<uuid>",
  "quoteVersionId": "<uuid>",
  "projectId": "<uuid>",
  "currencyCode": "USD",
  "costBase": 140000.00,
  "directCost": 120000.00,
  "overhead": 20000.00,
  "subtotalBeforeDiscount": 200000.00,
  "discountMethod": "PERCENT",
  "discountPercent": 5.0,
  "discountAmount": 10000.00,
  "subtotalAfterDiscount": 190000.00,
  "taxMode": "EXCLUSIVE",
  "taxAmount": 0.00,
  "totalQuotedAmount": 190000.00,
  "targetMarginPercent": 30.0,
  "requiredContractValue": 200000.00,
  "grossMargin": 50000.00,
  "grossMarginPercent": 26.32,
  "profitBeforeTax": 50000.00,
  "pbtPercent": 26.32,
  "formulaVersion": "v1"
}
```

**POST .../solve-target-margin — Request body**
```json
{
  "costBase": 140000.00,
  "targetMarginPercent": 30.0,
  "currencyCode": "USD"
}
```

**SolveTargetMarginResponse**
```json
{
  "costBase": 140000.00,
  "targetMarginPercent": 30.0,
  "requiredContractValue": 200000.00,
  "currencyCode": "USD"
}
```

---

### Quote Lines

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../versions/{versionId}/lines` | Thêm dòng |
| `GET` | `.../versions/{versionId}/lines` | Danh sách |
| `GET` | `.../versions/{versionId}/lines/{lineId}` | Lấy theo ID |
| `PUT` | `.../versions/{versionId}/lines/{lineId}` | Cập nhật |
| `DELETE` | `.../versions/{versionId}/lines/{lineId}` | Xoá |
| `PUT` | `.../versions/{versionId}/lines/reorder` | Sắp xếp lại (body: `lineIds: [uuid, ...]`) |

**POST — Request body**
```json
{
  "lineType": "PHASE",
  "name": "Phase 1: Discovery & Design",
  "description": null,
  "quantity": 1,
  "unitPrice": 50000.00,
  "displayOrder": 1,
  "clientVisible": true,
  "internalNote": null,
  "sourceProjectPhaseId": "<uuid>"
}
```

**QuoteLineResponse**
```json
{
  "id": "<uuid>",
  "quoteVersionId": "<uuid>",
  "projectId": "<uuid>",
  "sourceProjectPhaseId": "<uuid>",
  "lineType": "PHASE",
  "name": "Phase 1: Discovery & Design",
  "description": null,
  "quantity": 1,
  "unitPrice": 50000.00,
  "amount": 50000.00,
  "currencyCode": "USD",
  "displayOrder": 1,
  "clientVisible": true,
  "internalNote": null
}
```

`lineType` values: `PHASE` | `MILESTONE` | `LICENSE` | `CUSTOM` | `DISCOUNT`

---

### Quote Terms

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../versions/{versionId}/terms` | Thêm điều khoản |
| `GET` | `.../versions/{versionId}/terms` | Danh sách |
| `PUT` | `.../versions/{versionId}/terms/{termId}` | Cập nhật |
| `DELETE` | `.../versions/{versionId}/terms/{termId}` | Xoá |
| `PUT` | `.../versions/{versionId}/terms/reorder` | Sắp xếp lại (body: `termIds: [uuid, ...]`) |

**QuoteTermResponse**
```json
{
  "id": "<uuid>",
  "quoteVersionId": "<uuid>",
  "termType": "PAYMENT",
  "title": "Payment Terms",
  "content": "50% upfront, 50% on delivery",
  "displayOrder": 1,
  "clientVisible": true
}
```

`termType` values: `PAYMENT` | `WARRANTY` | `DELIVERY` | `SCOPE` | `LEGAL` | `CUSTOM`

---

# 5. ProjectBaseline

## 5.1 Baselines

**Base:** `/api/v1/projects/{projectId}/baselines`

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/projects/{projectId}/baselines` | Tạo baseline |
| `GET` | `/api/v1/projects/{projectId}/baselines` | Danh sách |
| `GET` | `/api/v1/projects/{projectId}/baseline/current` | Lấy current baseline |
| `GET` | `/api/v1/projects/{projectId}/baselines/{baselineId}` | Lấy theo ID |
| `PUT` | `/api/v1/projects/{projectId}/baselines/{baselineId}` | Cập nhật metadata |
| `POST` | `/api/v1/projects/{projectId}/baselines/{baselineId}/refresh-snapshot` | Refresh snapshot |
| `POST` | `/api/v1/projects/{projectId}/baselines/{baselineId}/validate` | Validate |
| `POST` | `/api/v1/projects/{projectId}/baselines/{baselineId}/approve` | Phê duyệt |
| `POST` | `/api/v1/projects/{projectId}/baselines/{baselineId}/mark-current` | Đặt làm current |
| `PATCH` | `/api/v1/projects/{projectId}/baselines/{baselineId}/archive` | Lưu trữ |

**POST — Request body**
```json
{
  "name": "Baseline v1 — Initial scope",
  "description": "First approved baseline after kickoff",
  "sourceScheduleRunId": "<uuid>",
  "sourceEstimationRunId": "<uuid>",
  "sourceFinanceScenarioId": "<uuid>",
  "sourceQuoteVersionId": "<uuid>"
}
```

**ProjectBaselineResponse**
```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "workspaceId": "<uuid>",
  "baselineNumber": 1,
  "name": "Baseline v1 — Initial scope",
  "description": "First approved baseline after kickoff",
  "status": "DRAFT",
  "currentFlag": false,
  "sourceScheduleRunId": "<uuid>",
  "sourceEstimationRunId": "<uuid>",
  "sourceFinanceScenarioId": "<uuid>",
  "sourceQuoteVersionId": "<uuid>",
  "snapshotJson": null,
  "summaryJson": null,
  "validationJson": null,
  "formulaVersion": "v1",
  "approvedAt": null,
  "approvedBy": null,
  "archivedAt": null,
  "archivedBy": null,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

`status` values: `DRAFT` | `VALIDATED` | `APPROVED` | `ARCHIVED`

---

## 5.2 Change Requests

**Base:** `/api/v1/projects/{projectId}/change-requests`

### Change Request lifecycle

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/projects/{projectId}/change-requests` | Tạo CR |
| `GET` | `/api/v1/projects/{projectId}/change-requests` | Danh sách |
| `GET` | `/api/v1/projects/{projectId}/change-requests/{changeRequestId}` | Lấy theo ID |
| `PUT` | `/api/v1/projects/{projectId}/change-requests/{changeRequestId}` | Cập nhật |
| `POST` | `/api/v1/projects/{projectId}/change-requests/{changeRequestId}/submit` | Nộp duyệt |
| `POST` | `/api/v1/projects/{projectId}/change-requests/{changeRequestId}/approve` | Phê duyệt |
| `POST` | `/api/v1/projects/{projectId}/change-requests/{changeRequestId}/reject` | Từ chối (body: `reason`) |
| `POST` | `/api/v1/projects/{projectId}/change-requests/{changeRequestId}/cancel` | Huỷ |
| `POST` | `/api/v1/projects/{projectId}/change-requests/{changeRequestId}/apply` | Áp dụng CR vào baseline |
| `PATCH` | `/api/v1/projects/{projectId}/change-requests/{changeRequestId}/archive` | Lưu trữ |

**POST — Request body**
```json
{
  "code": "CR-001",
  "title": "Add mobile feature scope",
  "description": "Client requested iOS/Android native app",
  "changeType": "SCOPE_ADDITION",
  "priority": "HIGH",
  "baselineId": "<uuid>",
  "reason": "New business requirement from client meeting 2026-07-10"
}
```

**ChangeRequestResponse**
```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "workspaceId": "<uuid>",
  "baselineId": "<uuid>",
  "code": "CR-001",
  "title": "Add mobile feature scope",
  "description": "Client requested iOS/Android native app",
  "changeType": "SCOPE_ADDITION",
  "priority": "HIGH",
  "status": "DRAFT",
  "reason": "New business requirement from client meeting 2026-07-10",
  "submittedAt": null,
  "submittedBy": null,
  "approvedAt": null,
  "approvedBy": null,
  "rejectedAt": null,
  "rejectedBy": null,
  "rejectionReason": null,
  "appliedAt": null,
  "appliedBy": null,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

`changeType` values: `SCOPE_ADDITION` | `SCOPE_REDUCTION` | `COST_CHANGE` | `SCHEDULE_CHANGE` | `RISK_ADJUSTMENT`
`priority` values: `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`
`status` values: `DRAFT` | `SUBMITTED` | `APPROVED` | `REJECTED` | `CANCELLED` | `APPLIED` | `ARCHIVED`

---

### Change Request Items

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../change-requests/{changeRequestId}/items` | Thêm item |
| `GET` | `.../change-requests/{changeRequestId}/items` | Danh sách |
| `GET` | `.../change-requests/{changeRequestId}/items/{itemId}` | Lấy theo ID |
| `PUT` | `.../change-requests/{changeRequestId}/items/{itemId}` | Cập nhật |
| `DELETE` | `.../change-requests/{changeRequestId}/items/{itemId}` | Xoá (204) |

**POST — Request body**
```json
{
  "targetType": "TASK",
  "targetId": "<uuid>",
  "operation": "ADD",
  "summary": "Add task: Mobile app wireframing",
  "beforeSnapshotJson": null,
  "afterSnapshotJson": "{\"estimatedHours\": 40}",
  "applyPayloadJson": null
}
```

**ChangeRequestItemResponse** — fields chính: `id`, `changeRequestId`, `targetType`, `targetId`, `operation`, `summary`, `beforeSnapshotJson`, `afterSnapshotJson`, `applyPayloadJson`, `status`, `createdAt`

`operation` values: `ADD` | `MODIFY` | `REMOVE`

---

### Change Impact

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../change-requests/{changeRequestId}/impact` | Lấy impact analysis |
| `PUT` | `.../change-requests/{changeRequestId}/impact` | Tạo hoặc cập nhật impact |
| `POST` | `.../change-requests/{changeRequestId}/impact/calculate` | Tính tự động |

**PUT — Request body**
```json
{
  "currencyCode": "USD",
  "scopeImpact": "INCREASE",
  "scheduleImpactDays": 14,
  "estimateHoursImpact": 200.0,
  "laborCostImpact": 17000.00,
  "directCostImpact": 17000.00,
  "overheadImpact": 3000.00,
  "revenueImpact": 25000.00,
  "grossMarginImpact": 5000.00,
  "pbtImpact": 5000.00,
  "quoteAmountImpact": 25000.00,
  "riskImpact": "MEDIUM",
  "impactSummaryJson": null
}
```

**ChangeImpactResponse** — fields chính: `id`, `changeRequestId`, `currencyCode`, `scopeImpact`, `scheduleImpactDays`, `estimateHoursImpact`, `laborCostImpact`, `revenueImpact`, `grossMarginImpact`, `riskImpact`

`scopeImpact` values: `INCREASE` | `DECREASE` | `NEUTRAL`
`riskImpact` values: `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`

---

### Change Orders

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../change-requests/{changeRequestId}/change-orders` | Tạo change order |
| `GET` | `.../change-requests/{changeRequestId}/change-orders` | Danh sách |
| `GET` | `/api/v1/projects/{projectId}/change-orders/{changeOrderId}` | Lấy theo ID |
| `PUT` | `/api/v1/projects/{projectId}/change-orders/{changeOrderId}` | Cập nhật |
| `POST` | `/api/v1/projects/{projectId}/change-orders/{changeOrderId}/approve` | Phê duyệt |
| `POST` | `/api/v1/projects/{projectId}/change-orders/{changeOrderId}/reject` | Từ chối (body: `reason`) |
| `PATCH` | `/api/v1/projects/{projectId}/change-orders/{changeOrderId}/archive` | Lưu trữ |

**POST — Request body**
```json
{
  "code": "CO-001",
  "title": "Change Order for Mobile Scope Addition",
  "description": "Commercial formalisation of CR-001",
  "commercialImpactJson": null,
  "sourceQuoteVersionId": "<uuid>"
}
```

**ChangeOrderResponse**
```json
{
  "id": "<uuid>",
  "changeRequestId": "<uuid>",
  "projectId": "<uuid>",
  "workspaceId": "<uuid>",
  "code": "CO-001",
  "title": "Change Order for Mobile Scope Addition",
  "description": "Commercial formalisation of CR-001",
  "status": "PENDING",
  "commercialImpactJson": null,
  "sourceQuoteVersionId": "<uuid>",
  "futureContractId": null,
  "approvedAt": null,
  "approvedBy": null,
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

`status` values: `PENDING` | `APPROVED` | `REJECTED` | `ARCHIVED`

---

# 6. ProjectFinance

## 6.1 Finance Scenarios

**Base:** `/api/v1/projects/{projectId}/finance-scenarios`

### Scenario lifecycle

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../finance-scenarios` | Tạo scenario |
| `GET` | `.../finance-scenarios` | Danh sách |
| `GET` | `.../finance-scenarios/{scenarioId}` | Lấy theo ID |
| `PUT` | `.../finance-scenarios/{scenarioId}` | Cập nhật |
| `GET` | `.../finance-scenarios/compare?leftScenarioId=&rightScenarioId=` | So sánh 2 scenarios |
| `POST` | `.../finance-scenarios/{scenarioId}/recalculate` | Tính lại |
| `POST` | `.../finance-scenarios/{scenarioId}/approve` | Phê duyệt |
| `POST` | `.../finance-scenarios/{scenarioId}/mark-current` | Đặt làm current |
| `PATCH` | `.../finance-scenarios/{scenarioId}/archive` | Lưu trữ |
| `POST` | `.../finance-scenarios/{scenarioId}/duplicate` | Nhân bản |

**POST — Request body**
```json
{
  "name": "Base Case Q3 2026",
  "description": null,
  "code": "FS-2026-Q3-BASE",
  "estimationRunId": "<uuid>",
  "currencyCode": "USD",
  "plannedRevenue": 200000.00,
  "revenueSplitMethod": "EQUAL_SPLIT",
  "contingency": {
    "method": "PERCENT",
    "percent": 10,
    "fixedAmount": null
  },
  "overhead": {
    "method": "PERCENT",
    "percent": 15,
    "fixedAmount": null
  },
  "targetMarginPercent": 30.0,
  "assumptionsJson": null,
  "markAsCurrent": true
}
```

`revenueSplitMethod` values: `EQUAL_SPLIT` | `EFFORT_BASED` | `MANUAL`
`contingency/overhead method` values: `PERCENT` | `FIXED_AMOUNT` | `NONE`

**FinanceScenarioResponse** — fields chính:

| Field | Type |
|---|---|
| `id` | UUID |
| `projectId` | UUID |
| `workspaceId` | UUID |
| `estimationRunId` | UUID |
| `code` | String |
| `name` | String |
| `scenarioVersion` | int |
| `status` | String |
| `currencyCode` | String |
| `plannedRevenue` | BigDecimal |
| `contingencyMethod` | String |
| `contingencyPercent` | BigDecimal |
| `overheadMethod` | String |
| `overheadPercent` | BigDecimal |
| `targetMarginPercent` | BigDecimal |
| `currentFlag` | boolean |
| `approvedAt` | Instant \| null |
| `formulaVersion` | String |

`status` values: `DRAFT` | `APPROVED` | `ARCHIVED`

---

### Phases

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../finance-scenarios/{scenarioId}/phases` | Danh sách phase financials |
| `GET` | `.../finance-scenarios/{scenarioId}/phases/{phaseFinanceId}` | Lấy theo ID |
| `PUT` | `.../finance-scenarios/{scenarioId}/phases/{phaseFinanceId}/revenue` | Cập nhật revenue cho phase |

**PUT /revenue — Request body:** `{ "plannedRevenue": 80000.00, "revenuePercent": 40.0 }`

**PhaseFinanceResponse** — fields chính:

| Field | Type |
|---|---|
| `id` | UUID |
| `financeScenarioId` | UUID |
| `projectPhaseId` | UUID |
| `phaseNameSnapshot` | String |
| `phaseOrder` | Integer |
| `estimateHours` | BigDecimal |
| `laborCost` | BigDecimal |
| `customCost` | BigDecimal |
| `vendorCost` | BigDecimal |
| `contingencyAmount` | BigDecimal |
| `directCost` | BigDecimal |
| `overheadAmount` | BigDecimal |
| `budgetOfCosts` | BigDecimal |
| `plannedRevenue` | BigDecimal |
| `revenuePercent` | BigDecimal |
| `grossMargin` | BigDecimal |
| `grossMarginPercent` | BigDecimal |
| `profitBeforeTax` | BigDecimal |
| `pbtPercent` | BigDecimal |

---

### Summary

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `.../finance-scenarios/{scenarioId}/summary` | Tóm tắt tài chính của scenario |

**FinanceSummaryResponse**
```json
{
  "id": "<uuid>",
  "financeScenarioId": "<uuid>",
  "projectId": "<uuid>",
  "currencyCode": "USD",
  "totalEstimateHours": 2400,
  "totalLaborCost": 204000.00,
  "totalCustomCost": 8000.00,
  "totalVendorCost": 12000.00,
  "totalContingency": 22400.00,
  "totalDirectCost": 224000.00,
  "totalOverhead": 33600.00,
  "budgetOfCosts": 257600.00,
  "plannedRevenue": 300000.00,
  "grossMargin": 75600.00,
  "grossMarginPercent": 25.2,
  "profitBeforeTax": 75600.00,
  "pbtPercent": 25.2,
  "averageCostRate": 85.0,
  "formulaVersion": "v1"
}
```

**Compare (GET /compare?leftScenarioId=&rightScenarioId=) — Response**
```json
{
  "projectId": "<uuid>",
  "leftScenarioId": "<uuid>",
  "rightScenarioId": "<uuid>",
  "leftScenario": { ... },
  "rightScenario": { ... },
  "leftSummary": { ... },
  "rightSummary": { ... },
  "delta": {
    "plannedRevenueDelta": 50000.00,
    "budgetOfCostsDelta": 20000.00,
    "grossMarginDelta": 30000.00,
    "grossMarginPercentDelta": 5.2,
    "profitBeforeTaxDelta": 30000.00,
    "totalEstimateHoursDelta": 200
  }
}
```

---

### Custom Costs

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../finance-scenarios/{scenarioId}/custom-costs` | Thêm custom cost |
| `GET` | `.../finance-scenarios/{scenarioId}/custom-costs` | Danh sách |
| `GET` | `.../finance-scenarios/{scenarioId}/custom-costs/{costId}` | Lấy theo ID |
| `PUT` | `.../finance-scenarios/{scenarioId}/custom-costs/{costId}` | Cập nhật |
| `PATCH` | `.../finance-scenarios/{scenarioId}/custom-costs/{costId}/archive` | Lưu trữ |

**POST — Request body**
```json
{
  "projectPhaseId": "<uuid>",
  "category": "TRAVEL",
  "name": "Client site visits Q3",
  "description": null,
  "amount": 3500.00,
  "currencyCode": "USD",
  "costDate": "2026-09-30"
}
```

**CustomCostResponse** — fields chính: `id`, `financeScenarioId`, `projectPhaseId`, `category`, `name`, `amount`, `currencyCode`, `costDate`, `status`

---

### Vendor Costs

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `.../finance-scenarios/{scenarioId}/vendor-costs` | Thêm vendor cost |
| `GET` | `.../finance-scenarios/{scenarioId}/vendor-costs` | Danh sách |
| `GET` | `.../finance-scenarios/{scenarioId}/vendor-costs/{costId}` | Lấy theo ID |
| `PUT` | `.../finance-scenarios/{scenarioId}/vendor-costs/{costId}` | Cập nhật |
| `PATCH` | `.../finance-scenarios/{scenarioId}/vendor-costs/{costId}/archive` | Lưu trữ |

**POST — Request body**
```json
{
  "projectPhaseId": "<uuid>",
  "vendorName": "AWS",
  "description": "Cloud infrastructure Q3",
  "amount": 4200.00,
  "currencyCode": "USD"
}
```

---

## 6.2 Current Finance

**Base:** `/api/v1/projects/{projectId}/finance/current`

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/v1/projects/{projectId}/finance/current` | Lấy current scenario |
| `GET` | `/api/v1/projects/{projectId}/finance/current/summary` | Summary của current scenario |
| `GET` | `/api/v1/projects/{projectId}/finance/current/phases` | Phase breakdowns của current |

Response schemas giống hệt `FinanceScenarioResponse`, `FinanceSummaryResponse`, và `List<PhaseFinanceResponse>` ở trên.

---

## Appendix — Endpoint Count

| Module | Controller | Endpoints |
|---|---|---|
| ResourceCapacity | WorkingCalendar | 8 |
| ResourceCapacity | CalendarDayRule | 2 |
| ResourceCapacity | CalendarException | 5 |
| ResourceCapacity | ResourceProfile | 5 |
| ResourceCapacity | ResourceRole | 2 |
| ResourceCapacity | ResourceSkill | 2 |
| ResourceCapacity | UserCapacityProfile | 7 |
| ResourceCapacity | ProjectResourceAllocation | 8 |
| ResourceCapacity | TaskResourceAssignment | 3 |
| ResourceCapacity | EffortEstimate | 2 |
| ResourceCapacity | ActualEffort | 3 |
| ResourceCapacity | Utilization | 1 |
| ResourceCapacity | WorkloadSnapshot | 2 |
| ResourceCapacity | CapacityCalculation | 5 |
| ResourceCapacity | ResourcePlanning | 8 |
| ResourceCapacity | AssignmentConflict | 4 |
| ResourceCapacity | UtilizationThresholdPolicy | 4 |
| **ResourceCapacity total** | | **71** |
| Profitability | WorkspaceRateCard | 5 |
| Profitability | ProjectRateCard | 5 |
| Profitability | Profile + Summary | 5 |
| Profitability | CostSource | 5 |
| Profitability | RevenueSource | 5 |
| Profitability | CostForecast | 4 |
| Profitability | RevenueForecast | 4 |
| Profitability | Plan + Versions | 6 |
| Profitability | Adjustment | 3 |
| Profitability | ThresholdPolicy | 2 |
| Profitability | Variance | 3 |
| Profitability | RiskFlag | 5 |
| **Profitability total** | | **52** |
| Estimation | EstimationRun | 9 |
| Estimation | CurrentEstimation | 5 |
| Estimation | RateImpactPreview | 1 |
| **Estimation total** | | **15** |
| Quote | Quote | 5 |
| Quote | QuoteVersion (incl. lines/terms) | 26 |
| **Quote total** | | **31** |
| ProjectBaseline | Baseline | 10 |
| ProjectBaseline | ChangeRequest (incl. items/impact/orders) | 25 |
| **ProjectBaseline total** | | **35** |
| ProjectFinance | FinanceScenario (incl. phases/costs/summary) | 24 |
| ProjectFinance | CurrentFinance | 3 |
| **ProjectFinance total** | | **27** |
| | **Grand total Wave 3** | **~231** |
