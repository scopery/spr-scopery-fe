# Baseline Time Capsule — BE API Requirements

> **Status:** P0 implemented on BE (2026-07-26) — FE wired to typed DTOs + `compare-current`  
> **Date:** 2026-07-26  
> **Owner:** FE (Scopery) ↔ BE  
> **FE context:** Baseline Detail = **Baseline Review / Project Time Capsule** (Baseline · Current · Difference + Health rail). FE **không** diff snapshot blobs trên client.  
> **BE delivered (P0):** `BaselineSummaryDto`, `BaselineTreeNodeDto`, `BaselineHealthDto`, `BaselineProvenanceDto`, `BaselineCompareResponse`; `BaselineSnapshotParser`; `BaselineCompareService`; `ProjectBaselineResponse` without raw JSON; refresh immutable for APPROVED (422); `GET .../baselines/{id}/compare-current`.  
> **Related:**  
> - `docs/phase-tracking/wave-03/WAVE3_API_CONTRACT.md` §5.1 ProjectBaseline  
> - FE paths: `/api/projects/{projectId}/baselines/...`

---

## 0. Why FE needs this

| Gap | FE hôm nay | User pain |
|---|---|---|
| `summaryJson` free-form | Probe vài key số | Metrics strip trống / không ổn định |
| `snapshotJson` opaque | Raw JSON trong Developer tools | Không có Project map (Phases → WBS → Tasks) |
| `validationJson` loose | Pass/Fail list ad-hoc | Không có Baseline Health chuẩn |
| Không có compare API | Tab Current / Difference gated | Không trả lời “Project đã đổi ra sao?” |
| Source chỉ UUID | Drawer hiện id | Không thấy tên run / scenario / quote |
| Approve = bare POST | Review sheet FE-only | Không lưu note; không approve+mark-active atomic |

**Nguyên tắc cứng**

1. FE **không** tự so sánh hai snapshot lớn. Diff phải do BE tính.  
2. Approved baseline là **mốc lịch sử bất biến** — không cho `refresh-snapshot` ghi đè. User tạo baseline mới.  
3. Response nên **typed DTO** (camelCase), không chỉ blob JSON. Có thể giữ raw JSON cho admin/debug.

---

## 1. Product rules BE phải enforce

| Rule | Behavior |
|---|---|
| Capture / refresh snapshot | Chỉ `DRAFT` (và chưa archive) |
| Approved / Validated snapshot | **Immutable** — `POST .../refresh-snapshot` → `409` (hoặc `422`) với message rõ |
| Tạo mốc mới từ plan hiện tại | `POST .../baselines` (create) — FE gọi “Create updated baseline” |
| Mark current | Chỉ `APPROVED` và `currentFlag=false` |
| Validate | Chỉ `DRAFT` (hoặc cho phép re-check Draft/Validated — FE hiện chỉ Draft) |

---

## 2. Priority cho BE

### P0 — FE Time Capsule V1 “đầy đủ data”

1. **Typed `summary`** trên get / refresh / validate / approve response  
2. **Typed `projectTree`** (hoặc `snapshot.tree`) cho Project map  
3. **Typed `validation` / `health`** cho Baseline Health rail  
4. **Provenance enrichment** (label + capturedAt cho 4 sources)  
5. **`GET .../baselines/{id}/compare-current`** — summary deltas + counts (chưa cần task-level full diff)

### P1 — Difference sâu + approve polish

6. Task/WBS-level diff items (added / removed / changed)  
7. `GET .../baselines/{left}/compare/{right}`  
8. Approve body: `approvalNote`, `markAsCurrent`  
9. Timeline list enrichment (optional fields trên list)

### P2 — Visual / AI (sau)

10. Schedule bar overlay payload (baseline vs current dates per task)  
11. AI “Baseline story” — có thể FE ghép từ compare summary; BE optional narrative endpoint

---

## 3. Enrich `ProjectBaselineResponse` (P0)

Giữ lifecycle fields hiện có. **Thêm** các object typed (khuyến nghị top-level, không chỉ nhét trong `*Json`).

### 3.1 Response shape (get / create / refresh / validate / approve / mark-current)

```json
{
  "id": "<uuid>",
  "projectId": "<uuid>",
  "workspaceId": "<uuid>",
  "baselineNumber": 1,
  "name": "Test Baseline",
  "description": "Captured from Demo Project Document Hub",
  "status": "DRAFT",
  "currentFlag": false,

  "sourceScheduleRunId": "<uuid>",
  "sourceEstimationRunId": "<uuid>",
  "sourceFinanceScenarioId": "<uuid>",
  "sourceQuoteVersionId": "<uuid>",

  "provenance": {
    "schedule": {
      "id": "<uuid>",
      "label": "Schedule run #24",
      "status": "COMPLETED",
      "capturedAt": "<instant>"
    },
    "estimation": {
      "id": "<uuid>",
      "label": "Project estimate v3",
      "status": "COMPLETED",
      "capturedAt": "<instant>"
    },
    "finance": {
      "id": "<uuid>",
      "label": "Base case scenario",
      "status": "ACTIVE",
      "capturedAt": "<instant>"
    },
    "quote": null
  },

  "summary": {
    "phaseCount": 3,
    "wbsCount": 24,
    "taskCount": 168,
    "scheduleStart": "2026-08-01",
    "scheduleEnd": "2026-11-30",
    "workingDays": 87,
    "estimateHours": 2480,
    "currencyCode": "USD",
    "totalCost": 320000,
    "plannedRevenue": 420000,
    "grossMarginPercent": 30.4,
    "quoteAmount": null,
    "formulaVersion": "Baseline V1"
  },

  "projectTree": {
    "nodes": [
      {
        "id": "<uuid>",
        "type": "PHASE",
        "code": null,
        "name": "Discovery",
        "meta": "5 Tasks",
        "scheduleStart": "2026-08-01",
        "scheduleEnd": "2026-08-20",
        "estimateHours": 120,
        "children": [
          {
            "id": "<uuid>",
            "type": "WBS",
            "code": "WBS-01",
            "name": "Requirements",
            "meta": "5 Tasks",
            "scheduleStart": "2026-08-01",
            "scheduleEnd": "2026-08-15",
            "estimateHours": 80,
            "children": [
              {
                "id": "<uuid>",
                "type": "TASK",
                "code": "T-012",
                "name": "Login API",
                "meta": null,
                "scheduleStart": "2026-08-01",
                "scheduleEnd": "2026-08-05",
                "estimateHours": 16,
                "children": []
              }
            ]
          }
        ]
      }
    ]
  },

  "health": {
    "snapshotStatus": "READY",
    "checksPassed": 18,
    "checksWarning": 2,
    "checksBlocking": 0,
    "sourcesStatus": "PARTIAL",
    "sourcesPresent": 3,
    "sourcesTotal": 4,
    "approvalStatus": "PENDING",
    "nextStep": "Review 2 warnings",
    "issues": [
      {
        "id": "TASK_DATES_AFTER_PROJECT_END",
        "severity": "WARNING",
        "code": "TASK_DATES_AFTER_PROJECT_END",
        "title": "Task dates",
        "message": "3 Tasks finish after Project end.",
        "affectedCount": 3
      },
      {
        "id": "MISSING_ESTIMATES",
        "severity": "WARNING",
        "code": "MISSING_ESTIMATES",
        "title": "Missing estimates",
        "message": "2 Tasks have no estimate.",
        "affectedCount": 2
      }
    ]
  },

  "formulaVersion": "Baseline V1",
  "approvedAt": null,
  "approvedBy": null,
  "approvalNote": null,
  "archivedAt": null,
  "archivedBy": null,
  "createdAt": "<instant>",
  "updatedAt": "<instant>",

  "snapshotJson": { "...": "optional raw for developer tools" },
  "summaryJson": { "...": "deprecated mirror of summary — optional during migration" },
  "validationJson": { "...": "deprecated mirror of health — optional during migration" }
}
```

### 3.2 Field contracts

#### `summary` (required after successful capture; null before capture)

| Field | Type | Notes |
|---|---|---|
| `phaseCount` | `number` | Số Phase trong snapshot |
| `wbsCount` | `number` | Số WBS / work package |
| `taskCount` | `number` | Số Task |
| `scheduleStart` | `date \| null` | `YYYY-MM-DD` |
| `scheduleEnd` | `date \| null` | |
| `workingDays` | `number \| null` | Working days theo calendar project |
| `estimateHours` | `number \| null` | Tổng giờ ước tính |
| `currencyCode` | `string \| null` | ISO 4217, e.g. `USD` |
| `totalCost` | `number \| null` | Cost kế hoạch |
| `plannedRevenue` | `number \| null` | |
| `grossMarginPercent` | `number \| null` | 0–100 scale (30.4 = 30.4%) |
| `quoteAmount` | `number \| null` | Nếu có quote source |
| `formulaVersion` | `string \| null` | Có thể trùng `formulaVersion` root |

**Cách lấy data (BE)**

- Aggregate từ **snapshot đã capture**, không live-query plan hiện tại trên get baseline (trừ endpoint compare-current).  
- Sources khi capture: schedule run → dates/duration; estimation run → hours/task counts; finance scenario → cost/revenue/margin; quote version → quoteAmount.  
- Nếu source thiếu → field `null`, không bịa số.

#### `projectTree` (required after capture; `nodes: []` nếu chưa có hierarchy)

| Field | Type | Notes |
|---|---|---|
| `nodes[].id` | `uuid \| string` | Stable id trong snapshot |
| `nodes[].type` | `PHASE \| WBS \| TASK \| GROUP` | FE render tree theo type |
| `nodes[].code` | `string \| null` | |
| `nodes[].name` | `string` | Display label |
| `nodes[].meta` | `string \| null` | Short subtitle, e.g. `"5 Tasks"` |
| `nodes[].scheduleStart` | `date \| null` | Optional P1 overlay |
| `nodes[].scheduleEnd` | `date \| null` | |
| `nodes[].estimateHours` | `number \| null` | |
| `nodes[].children` | `array` | Nested cùng shape |

**Cách lấy data**

- Build tree lúc `refresh-snapshot` / create-with-capture từ schedule + WBS/tasks của project tại thời điểm capture.  
- Persist trong snapshot store; get baseline đọc lại — **không** rebuild từ live project (tránh “time capsule” bị lệch).

**Depth gợi ý P0:** Phase → WBS → Task (3 cấp). Có thể flatten nếu project không có Phase.

#### `health` (sau validate; trước validate vẫn trả được phần snapshot/sources)

| Field | Type | Notes |
|---|---|---|
| `snapshotStatus` | `MISSING \| READY \| STALE` | `STALE` nếu Draft và source đã đổi sau capture (optional P1) |
| `checksPassed` | `number` | |
| `checksWarning` | `number` | |
| `checksBlocking` | `number` | Block approve nếu > 0 |
| `sourcesStatus` | `NONE \| PARTIAL \| COMPLETE` | |
| `sourcesPresent` | `number` | 0–4 |
| `sourcesTotal` | `number` | luôn 4 |
| `approvalStatus` | `PENDING \| VALIDATED \| APPROVED \| ACTIVE \| ARCHIVED` | Derived từ status + currentFlag |
| `nextStep` | `string` | Human hint ngắn |
| `issues[]` | array | Chỉ non-pass checks |

**`issues[]` item**

| Field | Type |
|---|---|
| `id` | `string` |
| `severity` | `INFO \| WARNING \| BLOCKING` |
| `code` | `string` stable machine code |
| `title` | `string` |
| `message` | `string` |
| `affectedCount` | `number \| null` |

**Checks gợi ý (tối thiểu)**

| code | severity | Điều kiện |
|---|---|---|
| `SOURCE_SCHEDULE_MISSING` | BLOCKING hoặc WARNING | Không có schedule source |
| `SOURCE_ESTIMATION_MISSING` | WARNING | |
| `SOURCE_FINANCE_MISSING` | WARNING | |
| `SOURCE_QUOTE_MISSING` | INFO | Optional |
| `CURRENCY_INCONSISTENT` | BLOCKING | |
| `MISSING_ESTIMATES` | WARNING | Tasks không có estimate |
| `TASK_DATES_AFTER_PROJECT_END` | WARNING | |
| `SNAPSHOT_MISSING` | BLOCKING | Chưa capture |
| `UNRESOLVED_RATES` | BLOCKING | Role/rate thiếu |

#### `provenance`

Mỗi key `schedule | estimation | finance | quote`: object hoặc `null`.

| Field | Type |
|---|---|
| `id` | `uuid` |
| `label` | `string` human-readable |
| `status` | `string \| null` |
| `capturedAt` | `instant \| null` | Thời điểm gắn vào baseline / thời điểm source cập nhật lúc capture |

---

## 4. Capture / refresh behavior (P0)

### Existing

```http
POST /api/projects/{projectId}/baselines/{baselineId}/refresh-snapshot
```

### BE phải làm

1. Chỉ cho `DRAFT`.  
2. Đọc current sources (hoặc source IDs đã gắn):
   - Schedule run → phases/WBS/tasks + dates  
   - Estimation run → hours / task estimates  
   - Finance scenario → cost / revenue / margin  
   - Quote version → amount (optional)  
3. Persist:
   - raw snapshot (nếu cần audit)  
   - **typed** `summary`, `projectTree`  
4. Reset hoặc giữ `validation`/`health` theo rule: nên đánh dấu checks cũ **stale** và yêu cầu validate lại (FE: “Check baseline”).  
5. Return full enriched `ProjectBaselineResponse`.

**Create baseline** (`POST .../baselines`): nếu có source IDs, nên capture ngay trong cùng request (hoặc FE gọi refresh ngay sau create — BE nên document rõ).

---

## 5. Validate → fill `health` (P0)

```http
POST /api/projects/{projectId}/baselines/{baselineId}/validate
```

**Response:** full baseline với `health` + (optional) `status=VALIDATED` nếu không có blocking.

| Outcome | `status` | `health.checksBlocking` |
|---|---|---|
| Pass (0 blocking) | `VALIDATED` (hoặc giữ `DRAFT` nếu product chọn soft-validate) | `0` |
| Warnings only | `VALIDATED` ok | `0`, `checksWarning > 0` |
| Blocking | giữ `DRAFT` | `> 0` |

FE hiện cho approve cả `DRAFT` và `VALIDATED`. BE nên **chặn approve** nếu `checksBlocking > 0`.

---

## 6. Compare current plan (P0 — quan trọng nhất cho Difference)

FE **không** tự diff. Cần endpoint:

```http
GET /api/projects/{projectId}/baselines/{baselineId}/compare-current
```

### 6.1 Response

```json
{
  "left": {
    "kind": "BASELINE",
    "baselineId": "<uuid>",
    "baselineNumber": 1,
    "name": "Test Baseline",
    "capturedAt": "<instant>",
    "summary": { "...same shape as baseline.summary..." }
  },
  "right": {
    "kind": "CURRENT_PLAN",
    "asOf": "<instant>",
    "summary": { "...aggregated from live project sources..." }
  },
  "deltas": {
    "phaseCount": 0,
    "wbsCount": 2,
    "taskCount": 8,
    "workingDays": 8,
    "estimateHours": 240,
    "totalCost": 28000,
    "plannedRevenue": 0,
    "grossMarginPercent": -1.2,
    "scheduleStartDays": 1,
    "scheduleEndDays": 8
  },
  "changeCounts": {
    "tasksAdded": 12,
    "tasksRemoved": 4,
    "tasksChanged": 18,
    "wbsAdded": 1,
    "wbsRemoved": 0,
    "wbsChanged": 3,
    "phasesAdded": 0,
    "phasesRemoved": 0,
    "phasesChanged": 1
  },
  "highlights": [
    {
      "code": "SCHEDULE_SLIP",
      "title": "Project finish moved",
      "message": "Finish moved from 2026-11-30 to 2026-12-08 (+8 working days)."
    },
    {
      "code": "EFFORT_UP",
      "title": "Estimate increased",
      "message": "Development effort increased by 240 hours."
    }
  ],
  "items": []
}
```

### 6.2 Delta semantics

- Mọi số trong `deltas` = **right − left** (current − baseline).  
- Dương = tăng so với baseline.  
- `scheduleStartDays` / `scheduleEndDays`: số **calendar hoặc working days** lệch (document rõ; ưu tiên working days).  
- `highlights`: 3–8 câu ngắn FE dùng cho “What changed” / Baseline story (không AI bắt buộc).

### 6.3 `items` (P1 — task-level diff)

```json
{
  "items": [
    {
      "id": "<uuid-or-stable-key>",
      "entityType": "TASK",
      "operation": "ADDED | REMOVED | CHANGED | UNCHANGED",
      "code": "T-012",
      "name": "Login API",
      "parentName": "Requirements",
      "changes": [
        {
          "field": "scheduleEnd",
          "before": "2026-08-05",
          "after": "2026-08-09"
        },
        {
          "field": "estimateHours",
          "before": 16,
          "after": 24
        }
      ]
    }
  ],
  "page": { "limit": 50, "offset": 0, "total": 34 }
}
```

**P0:** `items` có thể `[]` + query `includeItems=false` (default).  
**P1:** `?includeItems=true&entityType=TASK&operation=CHANGED&limit=&offset=`.

### 6.4 Cách BE lấy “current plan”

Aggregate **live** (không phải baseline khác):

| Area | Source gợi ý |
|---|---|
| Schedule / tree / dates | Current schedule run của project |
| Effort / task hours | Current estimation run |
| Cost / revenue / margin | Current finance scenario |
| Quote | Current quote version (nếu có) |

Nếu thiếu source → field null trong `right.summary`; vẫn trả deltas cho phần có data.

---

## 7. Compare baseline ↔ baseline (P1)

```http
GET /api/projects/{projectId}/baselines/{leftBaselineId}/compare/{rightBaselineId}
```

Cùng response shape với §6, nhưng:

```json
"right": {
  "kind": "BASELINE",
  "baselineId": "<uuid>",
  "baselineNumber": 2,
  "name": "Baseline #2",
  "capturedAt": "<instant>",
  "summary": { }
}
```

Dùng cho timeline “kéo giữa hai mốc”.

---

## 8. Approve + optional mark current (P1, nhỏ)

### Hiện tại

```http
POST /api/projects/{projectId}/baselines/{baselineId}/approve
body: {}
```

### Đề xuất

```http
POST /api/projects/{projectId}/baselines/{baselineId}/approve
```

```json
{
  "approvalNote": "Approved after reviewing 2 schedule warnings.",
  "markAsCurrent": true
}
```

| Field | Required | Notes |
|---|---|---|
| `approvalNote` | no | Persist `approvalNote` trên baseline |
| `markAsCurrent` | no, default `false` | Nếu `true`: approve + mark-current **atomic** (unset `currentFlag` baseline cũ) |

**Rules**

- Reject nếu `health.checksBlocking > 0`.  
- Warnings không block trừ khi product rule khác.  
- Body `{}` vẫn hợp lệ (backward compatible).

---

## 9. List / timeline enrichment (P1)

`GET /api/projects/{projectId}/baselines` — mỗi item nên có đủ để vẽ timeline nhẹ:

| Field | Type |
|---|---|
| (existing) `id`, `baselineNumber`, `name`, `status`, `currentFlag`, `approvedAt`, `createdAt`, `updatedAt` | |
| `summary.scheduleStart` | optional compact |
| `summary.scheduleEnd` | optional |
| `summary.taskCount` | optional |
| `health.checksWarning` | optional |
| `health.checksBlocking` | optional |

Không cần full `projectTree` trên list.

---

## 10. Endpoints summary

| Priority | Method | Path | Purpose |
|---|---|---|---|
| Exists | CRUD + refresh/validate/approve/mark-current/archive | § WAVE3 §5.1 | Giữ |
| P0 | Enrich responses | same get/refresh/validate | `summary`, `projectTree`, `health`, `provenance` |
| P0 | `GET` | `/baselines/{baselineId}/compare-current` | Difference vs live plan |
| P1 | `GET` | `/baselines/{leftId}/compare/{rightId}` | Baseline vs baseline |
| P1 | Extend | `POST .../approve` body | note + markAsCurrent |
| P1 | Enforce | refresh only DRAFT | 409 nếu approved |

---

## 11. Error codes gợi ý

| Code | When |
|---|---|
| `BASELINE_SNAPSHOT_IMMUTABLE` | Refresh trên APPROVED/VALIDATED/ARCHIVED |
| `BASELINE_VALIDATION_BLOCKED` | Approve khi còn blocking checks |
| `BASELINE_COMPARE_SOURCE_MISSING` | Compare-current thiếu schedule/estimation tối thiểu |
| `BASELINE_NOT_APPROVED` | Mark-current khi chưa APPROVED |

---

## 12. FE mapping (để BE biết UI dùng field nào)

| UI block | Fields |
|---|---|
| Header | `name`, `status`, `baselineNumber`, `createdAt`, `formulaVersion`, `currentFlag` |
| Time Capsule metrics | `summary.*` |
| Project map | `projectTree.nodes` |
| Baseline Health rail | `health.*` |
| Captured from / Provenance drawer | `provenance.*` |
| What changed | `compare-current.deltas`, `changeCounts`, `highlights` |
| Difference / Current modes | `compare-current.left/right.summary` (+ `items` P1) |
| Approve sheet | `summary` counts + `health` + approve body |
| Developer tools | `snapshotJson` / raw (optional) |

---

## 13. Out of scope (đừng làm trong P0)

- FE-side snapshot diff  
- Gantt overlay geometry (P2)  
- AI narrative generation (P2; FE có thể ghép từ `highlights`)  
- Đổi tên module “Baselines” trên sidebar  

---

## 14. Acceptance checklist cho BE

- [ ] Get baseline sau capture trả `summary` đủ field §3.2 (không phụ thuộc FE đoán key)  
- [ ] `projectTree.nodes` render được Phase → WBS → Task  
- [ ] `health` có counts + `issues[]` sau validate  
- [ ] `provenance` có label (không chỉ UUID)  
- [ ] `compare-current` trả deltas + changeCounts + highlights  
- [ ] Refresh snapshot trên APPROVED bị từ chối  
- [ ] Approve bị từ chối nếu `checksBlocking > 0`  
- [ ] OpenAPI/Swagger cập nhật; FE sẽ bật `wave3BaselineCompare` khi compare-current live  

---

## 15. Migration note

Trong giai đoạn chuyển tiếp, BE có thể:

1. Vẫn fill `summaryJson` / `validationJson` **mirror** typed objects, **và**  
2. Trả typed `summary` / `health` / `projectTree` top-level.

FE sẽ ưu tiên typed fields; fallback probe JSON chỉ là tạm thời.
