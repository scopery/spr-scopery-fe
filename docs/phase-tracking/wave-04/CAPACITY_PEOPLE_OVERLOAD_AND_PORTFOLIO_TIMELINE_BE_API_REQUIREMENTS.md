# Capacity People Overload + Portfolio Timeline — BE/FE API Requirements

> **Status:** OPEN — FE handoff to BE  
> **Date:** 2026-08-02  
> **Priority:** P1 (blocks truthful overload; Occupancy on Project Timeline stays approximate without this)  
> **Owner:** FE (Scopery) ↔ BE  
> **Related:**  
> - [`TIMELINE_CELL_BUCKETS_BE_API_REQUIREMENTS.md`](./TIMELINE_CELL_BUCKETS_BE_API_REQUIREMENTS.md) — daily allocation / progress (project task layer)  
> - Wave 3 [`WAVE3_API_CONTRACT.md`](../wave-03/WAVE3_API_CONTRACT.md) § ResourceCapacity — calendars, day-rules, exceptions, user-profiles, project-allocations  
> - Existing FE: `modules/capacity/*`, Cell Timeline (`modules/projects/gantt`)

---

## 0. One-line ask

Ship a **truthful occupancy pipeline**:

```text
Working Calendar ∩ Member Capacity Profile − Exceptions
= Available Capacity

Remaining Effort + Task Dates + Assignee + Allocation Policy
= Planned Load (daily minutes)

Planned / Available = Occupancy → Capacity grid + Timeline warnings
```

Do **not** derive overload from task date range alone or by dumping full estimate onto start day.

Separate **three UIs** that share a time-grid foundation but different row models (do not force all into Project Timeline).

---

## 1. Product split — three screens

| Screen | Scope | Rows | Answers |
|--------|-------|------|---------|
| **Project Timeline** | One project | Phase → Task | What / when in this project? Late / conflict tasks? |
| **Portfolio Timeline** | Workspace | Project → Phase → Milestone (MVP) | Which projects run when? Overlaps? |
| **People Capacity** | Workspace | Team / Member | Who is overloaded? From which projects/tasks? |

```text
PROJECT
└── Timeline                    ← exists (Cell Timeline)

WORKSPACE / PORTFOLIO
├── Portfolio Timeline          ← new (MVP summary)
└── Capacity (People)           ← extend Wave 3 capacity
```

Shared foundation: day/week(/month) buckets, sticky “current period” column, zoom.  
**Different row models** — do not mix Member rows into Project Timeline hierarchy.

---

## 2. Gap vs what already exists

### 2.1 Already in Wave 3 (reuse / extend)

| Piece | Status | Gap for this plan |
|-------|--------|-------------------|
| Working calendars + day-rules + calendar exceptions | Exists | Confirm minutes-per-day on day-rules; holiday → 0 available |
| User capacity profiles (`defaultDailyHours`, `effectiveFrom`/`To`, calendar link) | Exists | **Insufficient** if only one `defaultDailyHours` — need **per weekday** pattern |
| Project resource allocation % | Exists | Phase 6 (advanced); not MVP overload truth |
| Over-allocation lists / rebuild summaries | Partial FE | Need member×day grid + contributions |

### 2.2 Already in Wave 4 Timeline buckets

| Piece | Status | Gap |
|-------|--------|-----|
| `task_daily_allocation` (task_id, work_date, planned_minutes, AUTO\|MANUAL) | Spec / shipping | Must key by **member_id** when multi-assignee; MVP may use primary assignee only |
| Progress snapshots | Spec / shipping | Feeds **remaining effort** |
| Occupancy on timeline buckets | Deferred | “needs capacity” — this ticket |

### 2.3 Missing (this ticket)

1. **Member weekly pattern** (Mon 4h, Tue off, …) — not FULL_TIME / PART_TIME enums alone  
2. **Member capacity exceptions** (leave, half-day, overtime)  
3. **Allocation engine** (remaining effort → daily planned minutes respecting available days)  
4. **Workspace capacity grid API** (member × day/week + contributions + permission-safe labels)  
5. **Drill-down breakdown** for one member/day  
6. **Project Timeline overload overlay** (badge / cell warning + deep-link)  
7. **Portfolio Timeline summary API** (projects/phases/milestones — not full task tree)

---

## 3. Core formulas (normative)

### 3.1 Available capacity (member, date)

```text
availableMinutes(member, date)
  = resolveProfileWeekdayMinutes(member, date)   // profile weekly pattern for that weekday
  ∩ calendarAllowsWork(date)                     // org/project calendar; holiday → 0
  then apply member_capacity_exception(date)     // override final minutes if present
```

Profile without exception still yields 0 if calendar marks non-working.

### 3.2 Planned load (member, date)

```text
plannedMinutes(member, date)
  = sum(task_daily_allocation.planned_minutes
        where member_id = member and work_date = date
        and task not DONE/CANCELLED)
```

### 3.3 Occupancy

```text
occupancyPercent = plannedMinutes / availableMinutes × 100
  // if availableMinutes = 0:
  //   planned > 0 → treat as Severely Overallocated (or dedicated “No Capacity” state)
  //   planned = 0 → empty / hatched (non-working)
```

Store **minutes** in DB. Never persist occupancy % as source of truth.

### 3.4 Remaining effort (for AUTO allocation)

Prefer:

```text
remainingMinutes = task.remainingEstimateMinutes
```

Fallback:

```text
remainingMinutes = estimateMinutes × (1 − progressPercent/100)
```

`DONE` / `CANCELLED` → no future planned load.  
Changing dates / estimate / progress / assignee → **recompute AUTO** rows; keep MANUAL until user rebalances.

### 3.5 Auto allocation policy (MVP)

- One **primary assignee** per task (MVP).  
- Split `remainingMinutes` evenly across **available working days** of that assignee in `[startDate, endDate]` (profile ∩ calendar ∩ exceptions).  
- Skip days with `availableMinutes = 0`.  
- If zero available days in range → create **issue** (cannot allocate); do not invent weekend load.

### 3.6 Multi-assignee (post-MVP, schema-ready)

```text
task_assignment(task_id, member_id, allocated_minutes)
```

Daily allocation must not double-count full estimate for each assignee.  
If estimate not fully allocated across assignees → warning: `estimate_not_fully_assigned`.

---

## 4. Data model

### 4.1 Working calendar (exists — confirm shape)

```text
working_calendar
  id, workspace_id, name, timezone, …

working_calendar_week_pattern / day-rules
  calendar_id, day_of_week, working, available_minutes

working_calendar_exception
  calendar_id, date, available_minutes, reason
```

### 4.2 Member capacity profile (extend Wave 3 user-profiles)

Keep versioning via **effective windows** (do not mutate history in place for past reports):

```text
member_capacity_profile
  id
  workspace_id
  workspace_member_id / user_id
  working_calendar_id
  effective_from
  effective_to          // null = open-ended
  status
  focus_factor?         // optional; apply after minutes if product wants
```

**Replace sole `defaultDailyHours`** with weekly pattern (or add child table):

```text
member_capacity_week_pattern
  profile_id
  day_of_week           // MON..SUN
  working               // bool
  available_minutes     // 0 if not working
```

Example: Mon 240, Tue 0, Wed 360, Thu 0, Fri 240 → weekly 840 minutes.

Creating a new effective period = **new profile row** (or new version), not overwrite of old `effective_from` range.

### 4.3 Member exceptions

```text
member_capacity_exception
  id
  workspace_member_id
  date
  available_minutes     // final for that day (0 leave, 240 half-day, 600 overtime)
  reason                // LEAVE | SICK | TRAINING | HALF_DAY | OVERTIME | CUSTOM | …
```

### 4.4 Task assignment (schema now; MVP may use single inChargeUserId)

```text
task_assignment
  task_id
  member_id / user_id
  allocated_minutes     // share of remaining/estimate
```

MVP: map `task.inChargeUserId` → single assignment = 100% remaining.

### 4.5 Daily allocation (extend Timeline buckets model)

```text
task_daily_allocation
  task_id
  member_id             // REQUIRED for cross-project rollup
  work_date
  planned_minutes
  source                // AUTO | MANUAL
```

Unique `(task_id, member_id, work_date)`.

### 4.6 Workspace occupancy thresholds (settings)

```text
workspace_capacity_settings
  workspace_id
  near_capacity_min_percent      // default 80
  fully_allocated_percent        // default 100
  overallocated_max_percent      // default 120  (101–120 over; >120 severe)
```

| Occupancy | Status | UI hint |
|----------:|--------|---------|
| 0–79 | AVAILABLE | Neutral |
| 80–99 | NEAR_CAPACITY | Light warning |
| 100 | FULLY_ALLOCATED | Strong fill |
| 101–120 | OVERALLOCATED | Red |
| >120 | SEVERELY_OVERALLOCATED | Dark red |
| available=0 & planned=0 | NO_CAPACITY | Hatched / disabled |
| available=0 & planned>0 | SEVERELY_OVERALLOCATED (or NO_CAPACITY_WITH_LOAD) | Dark red + hatched |

### 4.7 Out of MVP (schema-friendly later)

```text
member_project_allocation
  member_id, project_id, allocation_percent, effective_from, effective_to
```

---

## 5. APIs

Paths below use unversioned `/api/...` (current Scopery FE `apiPath`). Align names with Wave 3 `/api/capacity/...` where already shipped.

### 5.1 Capacity profiles — weekly pattern

Extend existing user-profile create/update:

```http
POST /api/capacity/user-profiles?workspaceId={workspaceId}
PUT  /api/capacity/user-profiles/{id}
```

Body addition:

```json
{
  "workspaceMemberId": "uuid",
  "workingCalendarId": "uuid",
  "effectiveFrom": "2026-01-01",
  "effectiveTo": "2026-08-31",
  "focusFactor": 0.85,
  "weekPattern": [
    { "dayOfWeek": "MONDAY", "working": true, "availableMinutes": 240 },
    { "dayOfWeek": "TUESDAY", "working": false, "availableMinutes": 0 },
    { "dayOfWeek": "WEDNESDAY", "working": true, "availableMinutes": 360 },
    { "dayOfWeek": "THURSDAY", "working": false, "availableMinutes": 0 },
    { "dayOfWeek": "FRIDAY", "working": true, "availableMinutes": 240 },
    { "dayOfWeek": "SATURDAY", "working": false, "availableMinutes": 0 },
    { "dayOfWeek": "SUNDAY", "working": false, "availableMinutes": 0 }
  ]
}
```

**Deprecate reliance on `defaultDailyHours` alone** for occupancy (keep as fallback seed when `weekPattern` omitted during migration).

Overlap rule: two ACTIVE profiles for same member must not overlap `[effectiveFrom, effectiveTo]`.

### 5.2 Member capacity exceptions

```http
GET    /api/workspaces/{workspaceId}/members/{memberId}/capacity-exceptions?from=&to=
POST   /api/workspaces/{workspaceId}/members/{memberId}/capacity-exceptions
PUT    /api/workspaces/{workspaceId}/members/{memberId}/capacity-exceptions/{id}
DELETE /api/workspaces/{workspaceId}/members/{memberId}/capacity-exceptions/{id}
```

```json
{
  "date": "2026-08-10",
  "availableMinutes": 0,
  "reason": "LEAVE"
}
```

### 5.3 Allocation engine — recompute

Triggered by BE on:

- task create/update dates, estimate, remaining, progress, status, primary assignee  
- profile / calendar / exception changes affecting member  
- explicit admin rebuild

```http
POST /api/projects/{projectId}/tasks/{taskId}/allocations/recalculate
POST /api/workspaces/{workspaceId}/capacity/recalculate
  { "from": "2026-08-01", "to": "2026-08-31", "memberIds": ["…"]? }
```

Idempotent: replace AUTO rows in range; leave MANUAL.

Also expose on existing daily allocation GET/PUT (Timeline buckets) with `memberId` in items.

### 5.4 Capacity grid (People view)

```http
GET /api/workspaces/{workspaceId}/capacity
  ?from=2026-08-01
  &to=2026-08-31
  &granularity=DAY|WEEK
  &groupBy=MEMBER
  &memberIds=…          // optional filter
  &teamId=…             // optional
```

Response sketch:

```json
{
  "granularity": "DAY",
  "from": "2026-08-01",
  "to": "2026-08-31",
  "thresholds": {
    "nearCapacityMinPercent": 80,
    "fullyAllocatedPercent": 100,
    "overallocatedMaxPercent": 120
  },
  "members": [
    {
      "memberId": "uuid",
      "userId": "uuid",
      "displayName": "Nguyễn Quốc Bảo",
      "buckets": [
        {
          "periodStart": "2026-08-10",
          "periodEnd": "2026-08-10",
          "availableMinutes": 480,
          "plannedMinutes": 600,
          "occupancyPercent": 125,
          "overallocatedMinutes": 120,
          "status": "OVERALLOCATED",
          "hasOverloadedDay": false,
          "contributionCount": 3
        }
      ]
    }
  ]
}
```

**Week granularity**

- Aggregate available/planned minutes for the week.  
- Set `hasOverloadedDay: true` if any day in week is OVERALLOCATED or worse (even if weekly % = 100).  
- FE may show `100%` + `⚠ 1 overloaded day`.

### 5.5 Capacity breakdown (drill-down)

```http
GET /api/workspaces/{workspaceId}/members/{memberId}/capacity-breakdown
  ?date=2026-08-10
  // or ?from=&to= for week
```

```json
{
  "memberId": "uuid",
  "date": "2026-08-10",
  "availableMinutes": 480,
  "plannedMinutes": 600,
  "overallocatedMinutes": 120,
  "occupancyPercent": 125,
  "status": "OVERALLOCATED",
  "contributions": [
    {
      "projectId": "uuid",
      "projectName": "Scopery",
      "taskId": "uuid",
      "taskTitle": "Build API",
      "plannedMinutes": 300,
      "visibility": "FULL"
    },
    {
      "projectId": "uuid",
      "projectName": null,
      "taskId": null,
      "taskTitle": null,
      "plannedMinutes": 180,
      "visibility": "RESTRICTED_PROJECT",
      "label": "Another project"
    },
    {
      "plannedMinutes": 120,
      "visibility": "RESTRICTED",
      "label": "Restricted work"
    }
  ]
}
```

### 5.6 Permission levels for contributions

| Visibility | When | Payload |
|------------|------|---------|
| `FULL` | Caller can read that project + task | projectName, taskId, taskTitle, minutes |
| `RESTRICTED_PROJECT` | Capacity scope but not task detail | minutes + generic “Another project” (no task title) |
| `RESTRICTED` | No project access | minutes + “Restricted work” only |

Never leak restricted project/task names.

### 5.7 Project Timeline overlay

```http
GET /api/projects/{projectId}/timeline/workload-warnings
  ?from=&to=
```

Or embed on existing timeline/gantt items:

```json
{
  "taskId": "uuid",
  "assigneeUserId": "uuid",
  "overloadDays": [
    { "date": "2026-08-10", "occupancyPercent": 125, "status": "OVERALLOCATED" }
  ]
}
```

FE: View Settings `Show assignee workload` → badge `Bảo · 125% on 10 Aug` → open breakdown → deep-link:

```text
/workspace/{id}/capacity?memberId=&date=
/workspace/{id}/projects/{projectId}/…/timeline?taskId=
```

### 5.8 Portfolio Timeline (MVP summary)

```http
GET /api/workspaces/{workspaceId}/portfolio-timeline
  ?from=&to=
  &granularity=WEEK|MONTH|QUARTER
```

MVP rows: **Project** (+ optional current phase, next milestone).  
Fields: progress, health, plannedStart/End, currentPhaseName, nextMilestoneDate.

**Not in MVP:** expand all tasks of all projects (virtualization + ACL + cross-project deps → Phase 5+ with collapse + lazy task fetch).

```http
GET /api/workspaces/{workspaceId}/portfolio-timeline/projects/{projectId}/tasks
  ?from=&to=
```

Lazy when user expands a project (post-MVP).

### 5.8.1 FE interim — Team schedule (resource timeline)

FE ships `/workspace/{workspaceId}/resource-timeline` (**Team schedule**) before the portfolio/resource APIs land:

- Fan-out `GET /api/projects/{projectId}/gantt` for up to **20** active projects (concurrency-limited).
- Client filter: tasks for one `assigneeUserId` + optional unassigned leaves; prune empty Phase/WBS.
- Collapse modes reused from Cell Timeline (`EXPAND` / `STRUCTURE` / `PROJECT`).

**BE follow-up (replace fan-out):** prefer a single resource-aware schedule API, e.g.:

```http
GET /api/workspaces/{workspaceId}/resource-schedule
  ?assigneeUserId=
  &includeUnassigned=true|false
  &from=&to=
  &projectLimit=20
```

Response shape should return a pruned Project → Phase → WBS → Task forest (or flat items + parent ids) so FE can drop the per-project gantt fan-out. Occupancy/overload minutes stay out of scope until Capacity grid APIs (§5.x) land; then wire Occupancy overlay on the same page.

---

## 6. FE surfaces (when APIs land)

| FE | Behavior |
|----|----------|
| Capacity People grid | Member × Day/Week; color by `status`; click → breakdown drawer |
| Project Timeline | Optional workload badges; deep-link to Capacity |
| Portfolio Timeline | New workspace page; summary bars only |
| Capacity setup | Week pattern editor on profile; exceptions CRUD; deprecate FULL_TIME-only UX |

Reuse Cell Timeline zoom/today styling where practical; **do not** reuse Phase/Task row model for members.

---

## 7. Cross-project overload (primary value)

Example member Monday: 5h + 3h + 2h = 10h vs 8h capacity → 125%.  
Capacity cell red → breakdown lists three projects (permission-filtered) → **Open Project Timeline** highlights task → move / reassign / resize / exception.

---

## 8. Rollout phases

| Phase | Deliverable |
|-------|-------------|
| **1 — Calendar foundation** | Week pattern on profile, effective dates, member exceptions; calendar ∩ profile |
| **2 — Allocation engine** | Remaining effort → AUTO daily minutes per member; recalc triggers; DONE excluded |
| **3 — Capacity view** | Grid API + thresholds + breakdown + FE People view |
| **4 — Project Timeline integration** | Workload warnings + deep-link |
| **5 — Portfolio Timeline** | Summary API + FE; lazy tasks later |
| **6 — Advanced** | Multi-assignee split, manual daily alloc UI, project %, scenarios, skills |

**Critical:** Phase 2 before trusting Phase 3 colors.

---

## 9. MVP scope lock

**In**

- Weekly working pattern per member  
- Calendar + member exceptions  
- One primary assignee  
- Estimate + remaining (or progress fallback)  
- Start/end dates  
- Auto distribute remaining across available days  
- Day + Week Capacity grid  
- Configurable thresholds  
- Permission-safe drill-down  
- Timeline warning badge  

**Out**

- Multi-assignee effort split (schema-ready only)  
- Manual daily allocation UI (API may exist; polish later)  
- Skills / role matching  
- Project allocation % targets as overload source  
- Scenario / what-if  
- HR sync  

---

## 10. Acceptance criteria (BE)

1. Occupancy for a day uses **sum of daily planned minutes**, not estimate dumped on start date.  
2. Non-working profile day or holiday → 0 available; AUTO skips.  
3. Profile change with new `effectiveFrom` does not rewrite historical available minutes for prior dates.  
4. Week bucket with balanced weekly % still flags `hasOverloadedDay` when any day over.  
5. Breakdown never returns restricted task/project titles.  
6. Recalculate after date/estimate/progress/assignee change updates AUTO allocations only.  
7. Portfolio MVP does not require loading all workspace tasks.

---

## 11. Open questions for BE

1. Prefer extending `/api/capacity/user-profiles` vs new `/member-capacity-profiles` resource?  
2. Is `task_daily_allocation` already member-scoped in V193, or task-only today?  
3. Workspace settings home for occupancy thresholds?  
4. Should portfolio timeline live under `/api/workspaces/...` or `/api/capacity/...`?

---

## 12. Summary for BE ticket title

**Capacity: weekly member patterns + allocation engine + workspace occupancy grid (permission-safe) + timeline warnings; Portfolio timeline summary MVP.**
