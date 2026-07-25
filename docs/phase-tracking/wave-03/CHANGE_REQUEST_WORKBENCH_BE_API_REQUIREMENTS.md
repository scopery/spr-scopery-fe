# Change Request Workbench Gaps — BE API Requirements

> **Status:** Proposed for BE implementation  
> **Date:** 2026-07-25  
> **Owner:** FE (Scopery) → handoff to BE  
> **FE context:** CR workbench redesigned as continuous workflow (Request → Changes → Impact → Review). UI is blocked on three API gaps below.  
> **Related contracts:**  
> - `docs/phase-tracking/wave-03/WAVE3_API_CONTRACT.md` §5.2 Change Requests  
> - `docs/phase-tracking/wave-02/WAVE2_API_CONTRACT.md` RAID `create-change-request-draft`  
> - Existing task APIs: `/api/projects/{projectId}/tasks`  
> - Existing functional catalog: `/api/projects/{projectId}/functional-items`

---

## 0. Why FE needs this

Current FE can only:

| Gap | FE workaround today | User pain |
|---|---|---|
| No Function/Task picker | Free-text summary + optional raw UUID | User không biết chọn Function/Task nào |
| Impact = aggregate KPIs only | Checkbox review trên proposed change items | Không review được Task create/update/rework gợi ý |
| No source RAID on CR | Show `changeType` as “Source” | Không thấy “Created from Risk: …” / Open risk |

---

## 1. Function / Task picker for Proposed Changes

### 1.1 Problem

`POST .../change-requests/{id}/items` accepts:

```json
{
  "targetType": "TASK",
  "targetId": "<uuid>",
  "operation": "ADD|MODIFY|REMOVE",
  "summary": "..."
}
```

FE has no dedicated **search/picker** contract for CR drafting:

- User must paste UUID or leave `targetId` null.
- Item response does not return human-readable target code/title/version for list rows.

### 1.2 Goals

1. FE drawer can search and select **existing Functions** and **existing Tasks** in the project.  
2. Creating a proposed change stores a **resolved target reference** (id + display fields).  
3. List/get item returns enough fields to render rows like:

```text
MODIFY FUNCTION
FR-AUTH-01 · User Login
Add MFA verification…
```

### 1.3 Proposed APIs (prefer reuse + thin CR enrichment)

#### A. Picker search (reuse or thin wrapper)

**Option A1 — reuse existing list endpoints (acceptable if search works)**

| Resource | Existing | FE need |
|---|---|---|
| Tasks | `GET /api/projects/{projectId}/tasks?q=&limit=&offset=` | Search by code/title; return `id`, `code`, `title`, `status`, `phaseName?` |
| Functional items | `GET /api/projects/{projectId}/functional-items?q=&limit=&offset=` | Search by code/title; return `id`, `code`, `title`, `version?`, `moduleName?`, `status?` |

**BE must confirm / add:**

- Query param `q` (case-insensitive contains on code + title).  
- Pagination: `limit`, `offset`, `total`.  
- Stable sort: code ASC.  
- Only active / non-archived by default (`includeArchived=false`).

**Option A2 — dedicated CR picker (if reuse is insufficient)**

```http
GET /api/projects/{projectId}/change-request-targets?type=FUNCTION|TASK&q=&limit=20&offset=0
```

**Response**

```json
{
  "items": [
    {
      "targetType": "FUNCTION",
      "targetId": "<uuid>",
      "code": "FR-AUTH-01",
      "title": "User Login",
      "status": "RELEASED",
      "versionLabel": "v1",
      "subtitle": "Authentication"
    }
  ],
  "page": { "limit": 20, "offset": 0, "total": 1 }
}
```

#### B. Enrich ChangeRequestItem response

Extend **ChangeRequestItemResponse** (and create/update responses):

```json
{
  "id": "<uuid>",
  "changeRequestId": "<uuid>",
  "targetType": "FUNCTION",
  "targetId": "<uuid>",
  "targetCode": "FR-AUTH-01",
  "targetTitle": "User Login",
  "targetVersionLabel": "v1",
  "operation": "MODIFY",
  "summary": "Add MFA verification and update session flow",
  "affectedAreas": ["ACCEPTANCE_CRITERIA", "BUSINESS_RULES", "API"],
  "beforeSnapshotJson": null,
  "afterSnapshotJson": null,
  "applyPayloadJson": null,
  "status": "DRAFT",
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

**Validation rules**

| Operation | targetType | targetId |
|---|---|---|
| `MODIFY` / `REMOVE` | `FUNCTION` \| `TASK` | **Required**, must exist in project |
| `ADD` | `FUNCTION` \| `TASK` | Optional (null = new entity to be created on apply) |
| `MODIFY` | `SCHEDULE` \| `STAFFING` | Optional / project-level |

**Create/Update body additions (optional but preferred)**

```json
{
  "targetType": "FUNCTION",
  "targetId": "<uuid>",
  "operation": "MODIFY",
  "summary": "Add MFA verification…",
  "affectedAreas": ["ACCEPTANCE_CRITERIA", "BUSINESS_RULES", "SCREENS", "API"]
}
```

`affectedAreas` enum (suggested):  
`ACCEPTANCE_CRITERIA` | `BUSINESS_RULES` | `SCREENS` | `API` | `DATA` | `ESTIMATE` | `DATES` | `ASSIGNMENT`

### 1.4 FE acceptance criteria

- [ ] Drawer: search Function/Task by code or title, select one, submit item with resolved `targetId`.  
- [ ] Proposed change row shows `operation + targetType + code + title`, not UUID.  
- [ ] `MODIFY`/`REMOVE` without `targetId` returns `400` with field error on `targetId`.

---

## 2. Impact analysis — task-level (and function-level) suggestions

### 2.1 Problem

Today:

```http
POST /api/projects/{projectId}/change-requests/{changeRequestId}/impact/calculate
```

Returns aggregate only:

- `scopeImpact`, `scheduleImpactDays`, `estimateHoursImpact`, costs, `riskImpact`, optional `impactSummaryJson`

FE cannot render:

```text
☑ UPDATE  Implement authentication API   3d → 5d
☑ CREATE  MFA verification screen         3d
☐ CREATE REWORK  Regression test Login    2d
```

Nor persist which suggestions the user kept.

### 2.2 Goals

1. `calculate` produces **structured suggestion rows** (not only KPIs).  
2. User can **select/deselect** suggestions before submit/apply.  
3. Recalculate after proposed changes change (invalidate or version stamp).  
4. Keep existing aggregate fields for summary rail / finance.

### 2.3 Proposed response shape

Extend **ChangeImpactResponse**:

```json
{
  "id": "<uuid>",
  "changeRequestId": "<uuid>",
  "currencyCode": "USD",
  "scopeImpact": "INCREASE",
  "scheduleImpactDays": 6,
  "estimateHoursImpact": 64,
  "laborCostImpact": 8500,
  "revenueImpact": null,
  "grossMarginImpact": null,
  "riskImpact": "MEDIUM",
  "calculatedAt": "<instant>",
  "stale": false,
  "calculationVersion": 3,

  "summary": {
    "functionsAffected": 2,
    "functionsNewVersion": 1,
    "functionsNew": 1,
    "tasksUpdate": 4,
    "tasksCreate": 3,
    "tasksRework": 2,
    "phaseEndBefore": "2026-08-18",
    "phaseEndAfter": "2026-08-24",
    "projectEndBefore": "2026-08-30",
    "projectEndAfter": "2026-09-05",
    "scheduleDeltaWorkingDays": 6
  },

  "suggestions": [
    {
      "id": "<suggestion-uuid>",
      "kind": "UPDATE_TASK",
      "selected": true,
      "sourceChangeItemId": "<cr-item-uuid>",
      "targetType": "TASK",
      "targetId": "<existing-task-uuid>",
      "code": "TASK-012",
      "title": "Implement authentication API",
      "phaseName": "Development",
      "estimateBeforeDays": 3,
      "estimateAfterDays": 5,
      "dueDateBefore": "2026-08-12",
      "dueDateAfter": "2026-08-15",
      "contentSummary": "Add MFA validation and update session flow",
      "reason": null,
      "dependsOnSuggestionIds": []
    },
    {
      "id": "<suggestion-uuid>",
      "kind": "CREATE_TASK",
      "selected": true,
      "sourceChangeItemId": "<cr-item-uuid>",
      "targetType": "TASK",
      "targetId": null,
      "code": null,
      "title": "Implement MFA verification screen",
      "phaseName": "Frontend Development",
      "estimateBeforeDays": null,
      "estimateAfterDays": 3,
      "dueDateBefore": null,
      "dueDateAfter": null,
      "contentSummary": "Build OTP entry, resend and error states",
      "reason": null,
      "dependsOnSuggestionIds": ["<other-suggestion-uuid>"]
    },
    {
      "id": "<suggestion-uuid>",
      "kind": "CREATE_REWORK_TASK",
      "selected": false,
      "sourceChangeItemId": "<cr-item-uuid>",
      "targetType": "TASK",
      "targetId": null,
      "code": null,
      "title": "Regression test Login + MFA",
      "phaseName": "Testing",
      "estimateBeforeDays": null,
      "estimateAfterDays": 2,
      "dueDateBefore": null,
      "dueDateAfter": null,
      "contentSummary": null,
      "reason": "Previous test was completed against Function v1",
      "dependsOnSuggestionIds": []
    },
    {
      "id": "<suggestion-uuid>",
      "kind": "NEW_FUNCTION_VERSION",
      "selected": true,
      "sourceChangeItemId": "<cr-item-uuid>",
      "targetType": "FUNCTION",
      "targetId": "<function-uuid>",
      "code": "FR-AUTH-01",
      "title": "User Login",
      "phaseName": null,
      "estimateBeforeDays": null,
      "estimateAfterDays": null,
      "dueDateBefore": null,
      "dueDateAfter": null,
      "contentSummary": "v1 → proposed v2",
      "reason": null,
      "dependsOnSuggestionIds": []
    }
  ],

  "impactSummaryJson": null
}
```

**`kind` enum (minimum)**

| kind | Meaning |
|---|---|
| `UPDATE_TASK` | Change estimate/dates/content of existing task |
| `CREATE_TASK` | New task from proposed change |
| `CREATE_REWORK_TASK` | Rework because completed work tied to old function version |
| `REMOVE_TASK` / `CANCEL_TASK` | Optional |
| `NEW_FUNCTION_VERSION` | Function version bump proposal |
| `CREATE_FUNCTION` | New function |
| `UPDATE_SCHEDULE` | Phase / project end shift (may also live only in `summary`) |

### 2.4 Persist selection

```http
PATCH /api/projects/{projectId}/change-requests/{changeRequestId}/impact/suggestions
```

```json
{
  "selections": [
    { "suggestionId": "<uuid>", "selected": true },
    { "suggestionId": "<uuid>", "selected": false }
  ]
}
```

**Response:** full updated `ChangeImpactResponse` (recompute aggregates from selected set if applicable).

**Alternative (also OK):**  
`PUT .../impact` with `selectedSuggestionIds: string[]` — but dedicated PATCH is clearer for FE sticky bar “6 of 7 selected”.

### 2.5 Stale / recalculate rules

- When any CR item is added/updated/deleted after `calculatedAt` → `stale: true`.  
- FE shows “Impact is outdated — recalculate”.  
- `POST .../impact/calculate` replaces suggestions; **preserve previous `selected` by matching** `(kind, targetId|title, sourceChangeItemId)` when possible; otherwise default `selected: true` for non-rework, `selected: false` for rework optional.

### 2.6 Progressive analysis (optional but useful)

If calculate is slow (>2s), either:

1. Sync calculate with server-side steps reflected in response (OK for MVP), or  
2. Async job:

```http
POST .../impact/calculate → 202 { "jobId": "..." }
GET  .../impact/calculate/jobs/{jobId} → { "status": "RUNNING|DONE|FAILED", "steps": [...], "result": ChangeImpactResponse|null }
```

FE already has a progressive loading UI; job steps can map 1:1.

### 2.7 FE acceptance criteria

- [ ] After Analyze impact, FE shows KPI summary + suggestion list with checkboxes.  
- [ ] Toggling checkbox persists via PATCH and updates “N of M selected”.  
- [ ] Submit readiness can require `impact != null && !stale` (and optionally ≥1 selected suggestion).  
- [ ] Apply uses **selected** suggestions only (document this in apply contract).

---

## 3. Source origin on Change Request (RAID / Meeting / Manual)

### 3.1 Problem

- RAID: `POST .../raid-items/{raidItemId}/create-change-request-draft` returns `{ changeRequestId }` only.  
- CR get/list response has **no** `sourceType` / `sourceId` / display fields.  
- FE cannot show:

```text
Created from Risk: Senior Developer Quit
[Open risk]
```

and currently falls back to `changeType` (e.g. Risk adjustment), which is not the same as origin.

Same gap likely for Meeting note → CR draft.

### 3.2 Goals

1. Persist **provenance** on the CR when created from RAID / Meeting / Decision / Manual.  
2. Return enough display fields on get/list so FE does not need a second round-trip for the common case.  
3. Provide deep-link ids for “Open risk”.

### 3.3 Proposed ChangeRequestResponse additions

```json
{
  "id": "<uuid>",
  "code": "RAID-CR-5189682F",
  "title": "Senior Developer Quit",
  "changeType": "RISK_ADJUSTMENT",
  "priority": "MEDIUM",
  "status": "DRAFT",

  "source": {
    "type": "RAID_ITEM",
    "id": "<raid-item-uuid>",
    "subtype": "RISK",
    "code": "RAID-5189682F",
    "title": "Senior Developer Quit",
    "hrefHint": null
  },

  "requestedByUserId": "<uuid>",
  "requestedByDisplayName": "Nguyễn Bảo",

  "targetReleaseLabel": null,
  "desiredEffectiveDate": null,

  "baselineId": "<uuid>",
  "reason": "...",
  "description": "..."
}
```

**`source.type` enum**

| type | When |
|---|---|
| `MANUAL` | Created via CR register / API create |
| `RAID_ITEM` | From `create-change-request-draft` on RAID |
| `MEETING_NOTE` | From meeting note draft |
| `DECISION` | If/when supported |
| `OTHER` | Extension point |

`source` may be `null` only for legacy rows; prefer always present with `type: MANUAL`.

### 3.4 Create CR draft from RAID — response enrichment

```http
POST /api/projects/{projectId}/raid-items/{raidItemId}/create-change-request-draft
```

**Response (extend)**

```json
{
  "changeRequestId": "<uuid>",
  "changeRequest": {
    "id": "<uuid>",
    "code": "CR-...",
    "title": "Senior Developer Quit",
    "status": "DRAFT",
    "source": {
      "type": "RAID_ITEM",
      "id": "<raid-item-uuid>",
      "subtype": "RISK",
      "code": "RISK-001",
      "title": "Senior Developer Quit"
    }
  }
}
```

**Persistence rules**

- On draft create from RAID: copy title/reason defaults from RAID item; set `source` immutable (or only clearable by admin).  
- Deleting/archiving RAID item must **not** delete CR; `source.title/code` should be **snapshot** fields so CR remains readable if RAID is gone. Keep `source.id` for link when still available; FE handles 404 on open.

### 3.5 Optional request fields on manual create

```json
{
  "code": "CR-001",
  "title": "...",
  "changeType": "SCOPE_ADDITION",
  "priority": "MEDIUM",
  "baselineId": "<uuid>",
  "reason": "...",
  "sourceType": "MANUAL",
  "targetReleaseLabel": "Phase 2 Delivery",
  "desiredEffectiveDate": "2026-08-15"
}
```

### 3.6 FE acceptance criteria

- [ ] CR header shows `Created from {Risk|Issue|…}: {title}`.  
- [ ] `Open risk` navigates to RAID item when `source.type=RAID_ITEM` and item still exists.  
- [ ] List/register can filter later by `source.type` (nice-to-have query param).  
- [ ] UUID of RAID/baseline not shown as primary “Source” label.

---

## 4. Priority / sequencing for BE

| Priority | Item | Unblocks FE |
|---|---|---|
| **P0** | §3 Source on CR (+ RAID draft sets it) | Correct provenance UX |
| **P0** | §1.3B Enrich item with `targetCode` / `targetTitle` | Readable proposed change rows |
| **P0** | §1.3A Search `q` on tasks + functional-items (or picker endpoint) | Real picker in Add change drawer |
| **P1** | §2 Structured `suggestions[]` on calculate | Task impact review with checkboxes |
| **P1** | §2.4 PATCH suggestion selections | Persist keep/discard |
| **P2** | Async calculate job + steps | Better progressive loading |
| **P2** | `targetReleaseLabel` / `desiredEffectiveDate` / requester display | Full Request details form |

---

## 5. Out of scope (this request)

- Full apply atomicity / `wave3CrApply` gate (separate contract).  
- Auto-generating Implementation Plan / Change Orders (post-approve) — separate follow-up.  
- AI streaming copy for impact narrative.  
- Replacing aggregate finance KPIs.

---

## 6. Open questions for BE

1. Canonical target for “Function” in CR items: project `functional-items` vs workspace application functional catalog? FE currently assumes **project functional items** for delivery CRs.  
2. Should `calculate` be deterministic from items only, or also read current schedule/estimation runs? (FE needs `calculatedAt` + `stale` regardless.)  
3. On apply: are deselected suggestions ignored entirely, or stored as rejected for audit?  
4. Is `source` a single origin only, or can a CR link multiple RAID items? (FE designs for **one primary source** + optional links later.)

---

## 7. Minimal contract checklist for BE PR

- [ ] `ChangeRequestResponse.source` (+ snapshot code/title)  
- [ ] RAID `create-change-request-draft` sets `source`  
- [ ] Task + Functional Item list support `q` (or dedicated picker)  
- [ ] `ChangeRequestItemResponse.targetCode` / `targetTitle` (/ `targetVersionLabel`)  
- [ ] `ChangeImpactResponse.suggestions[]` + `summary` + `stale` + `calculatedAt`  
- [ ] `PATCH .../impact/suggestions` for selection  
- [ ] Swagger / OpenAPI updated; example payloads in WAVE3 contract
