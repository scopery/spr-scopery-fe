# Timeline Cell Buckets — BE API Requirements

> **Status:** Implemented (BE V193 + `modules/project/timeline`; FE prefers BE with local fallback)  
> **Date:** 2026-08-02  
> **Owner:** FE (Scopery) ↔ BE  
> **Scope:** Canonical day/week/month/quarter timeline buckets, daily allocation, progress snapshots  
> **Related:** existing `GET /api/projects/{projectId}/gantt`, task schedule move/resize

---

## Implementation notes (2026-08-02)

| Piece | Status |
| --- | --- |
| Flyway `V193` tables | Done |
| `GET /api/projects/{projectId}/timeline` | Done (`TimelineController`) |
| Progress snapshots list/create | Done (`ProgressSnapshotController`) |
| Daily allocations GET/PUT | Done (`TaskDailyAllocationController`) |
| FE clients | Prefer BE; localStorage fallback on 404/501 |

## 1. Problem

Gantt today returns schedule bars (`startDate` / `endDate`) without:

- `estimateMinutes` / `progressPercent` on gantt items
- per-day planned allocation
- progress history for Actual vs Planned variance
- aggregated buckets for Day / Week / Month / Quarter (same math for Timeline, Excel, reports)

FE Cell Timeline needs one canonical source so Planned % / Effort / Variance match exports and dashboards.

---

## 2. Metrics (do not collapse)

| Metric | Formula |
| --- | --- |
| Planned contribution (bucket) | `bucket.plannedMinutes / task.totalPlannedMinutes` |
| Cumulative planned | `sum(plannedMinutes from task start through bucket end) / total` |
| Actual | last `progress_snapshot` on/before bucket end (else null — never invent from dates) |
| Variance (pp) | `actual - cumulativePlanned` when actual present |
| Occupancy | `task planned minutes / member capacity` (later; needs capacity) |

Never derive Actual from Start/End alone.

---

## 3. Data model

### 3.1 Extend task / gantt item fields

Expose on timeline (and preferably gantt) payload:

```text
estimateMinutes
progressPercent   // current head
assigneeUserId
status
```

### 3.2 `task_daily_allocation`

```text
task_id
work_date          // date
planned_minutes    // int
source             // AUTO | MANUAL
```

MVP auto: split `estimateMinutes` evenly across **working days** in `[start, end]` (Mon–Fri; holidays later).

Store minutes, not percentages.

### 3.3 `task_progress_snapshot`

```text
task_id
snapshot_date
progress_percent
note?              // optional
time_spent_minutes? // optional
recorded_by
recorded_at
```

---

## 4. API

### 4.1 GET timeline buckets

```http
GET /api/projects/{projectId}/timeline
  ?from=YYYY-MM-DD
  &to=YYYY-MM-DD
  &granularity=DAY|WEEK|MONTH|QUARTER
```

Response (sketch):

```json
{
  "items": [
    {
      "taskId": "uuid",
      "ganttItemId": "…",
      "estimateMinutes": 4800,
      "progressPercent": 45,
      "startDate": "2026-08-11",
      "endDate": "2026-08-14",
      "buckets": [
        {
          "periodStart": "2026-08-10",
          "periodEnd": "2026-08-16",
          "plannedMinutes": 2400,
          "plannedContributionPercent": 50,
          "cumulativePlannedPercent": 50,
          "actualProgressPercent": 35,
          "variancePercent": -15
        }
      ]
    }
  ]
}
```

**Weekly actual:** last snapshot in week, else last before week end, else `null` → FE “No update”.

### 4.2 Progress snapshot

```http
POST /api/projects/{projectId}/tasks/{taskId}/progress-snapshots
{ "progressPercent": 65, "timeSpentMinutes": 240, "note": "…", "snapshotDate": "2026-08-02" }
```

### 4.3 Manual allocation (Phase 4)

```http
PUT /api/projects/{projectId}/tasks/{taskId}/daily-allocations
{ "items": [{ "workDate": "…", "plannedMinutes": 480 }] }
```

Validate sum ≈ estimate (tolerance TBD).

### 4.4 Existing mutations (keep)

- Move/resize via current gantt task endpoints (or task plannedStart/dueDate patch)
- Create task via existing task create

Batch Apply from FE may call move sequentially until a bulk schedule endpoint exists.

---

## 5. Edge cases

| Case | Behavior |
| --- | --- |
| No estimate | Buckets may omit contribution %; FE shows Schedule only |
| No snapshot | `actualProgressPercent: null` |
| Weekend / holiday | AUTO allocation skips non-working days |
| Estimate changes | Recompute AUTO rows; keep MANUAL until user rebalances |

---

## 6. FE interim (until this ships)

Client-side even split Mon–Fri from gantt start/end + task `estimateHours` for **Planned** metrics only. Actual stays null. Switch to this API when available.
