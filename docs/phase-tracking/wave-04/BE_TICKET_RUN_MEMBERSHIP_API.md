# BE Ticket: Run direct membership API (Quality simplified workflow)

**Status:** ✅ Done (V187 migration applied; endpoints auth-gated 401, not 404)  
**Type:** Story / API  
**Priority:** High  
**Area:** Quality / Test Runs  
**Related FE:** `QUALITY_WORKFLOW_SIMPLIFICATION_BE_API_REQUIREMENTS.md` §3  
**FE status:** Membership drawer live; Plan/Suite optional on create — primary path is Add cases

---

## Summary

Enable **direct mixed case membership** on a Test Run so FE can add/remove Functional Test Cases and NFR Verification Cases **without requiring Test Plan / Test Suite**.

Today FE can only create suite-backed runs (`testPlanId` + `testSuiteId`). Primary product UX needs:

> New run → Add cases → Start → execute → Complete

---

## Problem

| What FE calls | Observed |
| ------------- | -------- |
| `GET /api/projects/{projectId}/test-runs/{runId}/membership` | Missing contract (404/501) |
| `PUT /api/projects/{projectId}/test-runs/{runId}/membership` | Missing contract (404/501) |
| `POST /api/projects/{projectId}/test-runs/{runId}/membership/copy` | Missing contract (404/501) |

Without these, users cannot put cases into a run from the simplified Runs page except via legacy Suite.

---

## Scope (must-have)

### 1. List membership

`GET /api/projects/{projectId}/test-runs/{runId}/membership`

**Response:**

```json
{
  "runId": "<uuid>",
  "items": [
    {
      "caseKind": "FUNCTIONAL",
      "caseId": "<uuid>",
      "caseCode": "TC-001",
      "caseTitle": "Login success",
      "sourceGroupName": null,
      "displayOrder": 0
    },
    {
      "caseKind": "NFR",
      "caseId": "<uuid>",
      "caseCode": "VC-01",
      "caseTitle": "Latency under 200ms",
      "sourceGroupName": null,
      "displayOrder": 1
    }
  ]
}
```

- `caseKind`: `"FUNCTIONAL"` | `"NFR"`
- Enrich `caseCode` / `caseTitle` when possible
- Empty run → `{ "runId", "items": [] }` (not 404)

### 2. Add / remove membership

`PUT /api/projects/{projectId}/test-runs/{runId}/membership`

**Request:**

```json
{
  "add": [
    { "caseKind": "FUNCTIONAL", "caseId": "<uuid>" },
    { "caseKind": "NFR", "caseId": "<uuid>" }
  ],
  "remove": [
    { "caseKind": "FUNCTIONAL", "caseId": "<uuid>" }
  ]
}
```

**Rules:**

- Idempotent add (already present → no-op)
- Remove unknown → no-op or 404 with clear code (prefer no-op)
- Reject add when run status is `COMPLETED` / `CANCELLED` (or document allowed statuses)
- Validate case belongs to same `projectId`
- Respect run `runScope`:
  - `FUNCTIONAL` → only FUNCTIONAL cases
  - `NON_FUNCTIONAL` → only NFR
  - `MIXED` → both
- **Response:** same shape as GET (updated membership)

### 3. Materialize results on Start

When `POST .../test-runs/{runId}/start`:

- Create execution result rows for **all membership items** (functional + NFR as applicable)
- Existing suite-backed behavior must keep working for runs that still have `testSuiteId`

### 4. Optional but recommended (same ticket or follow-up)

`POST /api/projects/{projectId}/test-runs/{runId}/membership/copy`

```json
{
  "sourceRunId": "<uuid>",
  "replaceExisting": false
}
```

`POST /api/projects/{projectId}/test-runs` also accept:

```json
{
  "name": "Sprint 12 regression",
  "runType": "MANUAL",
  "runScope": "FUNCTIONAL",
  "caseIds": [
    { "caseKind": "FUNCTIONAL", "caseId": "<uuid>" }
  ]
}
```

---

## Out of scope

- Deleting Test Plan / Suite persistence  
- Merging TestCase + VerificationCase entities  
- FE inventing membership by creating hidden suites  

---

## Acceptance criteria

- [ ] `GET .../membership` returns 200 with `items[]` (empty OK)
- [ ] `PUT .../membership` add/remove works for FUNCTIONAL and NFR
- [ ] After Start, result list includes every membership case
- [ ] Suite-backed runs still Start correctly (compat)
- [ ] Wrong project / wrong scope → 4xx with problem+json (`code`, `detail`)
- [ ] Contract documented (OpenAPI / WAVE4 note)

---

## FE already ready

- UI: **Add cases** drawer on Quality → Runs  
- Calls: `getRunMembership`, `manageRunMembership`, `copyRunMembership`  
- Fallback today: New run requires Plan + Suite until this ships  

**Unblock:** ship GET + PUT membership (+ Start materializes from membership).
