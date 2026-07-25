# Traceability Coverage Page — BE API Requirements

> **Status:** Proposed for BE implementation  
> **Date:** 2026-07-25  
> **Owner:** FE (Scopery) → handoff to BE  
> **FE context:** `/workspace/{ws}/projects/{projectId}/traceability` redesigned as **coverage-first** (Requirement rows → link tests → Pass/Fail/Defect). FE ships UI with workarounds; this doc lists API gaps to unlock accurate metrics and expand detail.  
> **Related contracts:**  
> - `docs/phase-tracking/wave-04/WAVE4_API_CONTRACT.md` §14.2 Trace Links + Coverage Matrix  
> - Requirements: `GET /api/.../requirements`  
> - Test cases / runs / defects (Quality module)

---

## 0. Why FE needs this

FE now builds the page as:

```text
Requirements (source of rows)
+ Trace links TESTED_BY
+ Coverage report booleans (optional)
→ Coverage table + summary strip
```

| Gap | FE workaround today | User pain |
|---|---|---|
| Coverage matrix only returns booleans (`hasTestCase`, `hasResult`, `hasDefect`, `gap`) | Guess `Passed` / `Failed` / `Blocked` / `Not run` | Latest result không đáng tin |
| Matrix may omit requirements with no links | FE builds rows from Requirements list | OK temporarily; report/summary still incomplete if BE omits orphans |
| No per–test-case result on a requirement | Expand row shows linked TC titles only | Không biết TC nào pass/fail |
| No open defect list on requirement | Show `Open` / `0` / `—` from `hasDefect` | Không thấy BUG code/title |
| No target release on row | `hasRelease` boolean only | Không biết Release nào |
| Trace link list is raw types + UUIDs | FE resolves names via parallel list APIs | N+1 / incomplete for DEFECT, RELEASE, etc. |
| No project coverage summary endpoint | FE aggregates client-side from guessed status | Summary strip can disagree with QA reality |
| Bulk link = N× `POST /trace-links` | Loop in FE | Slow; partial failure UX |
| No filter/search on coverage report | FE filters in memory after loading all requirements | Không scale |

**Product goal:** answer QA/PM questions without teaching `TESTED_BY` / coverage report jargon:

```text
Requirement nào chưa có test?
Đã test chưa? Latest pass hay fail?
Có defect mở không?
Bấm đâu để gắn Test Case?
```

---

## 1. Coverage matrix must be requirement-centric and rich

### 1.1 Problem

Current FE type (inferred from usage):

```ts
interface CoverageMatrixCell {
  requirementId: string
  requirementCode?: string
  requirementTitle?: string
  hasTestCase?: boolean
  hasResult?: boolean
  hasDefect?: boolean
  hasRelease?: boolean
  gap?: boolean
}
```

Contract today only documents:

```http
GET /api/projects/{projectId}/reports/coverage-matrix
```

with no response schema.

Booleans cannot support:

```text
4 tests · Failed · 1 open · At risk
```

### 1.2 Goals

1. **One row per project Requirement** (including zero links).  
2. Each row carries **counts + latest result + open defects + release + coverage status**.  
3. Optional nested **test case summary** for expand panel (or separate detail endpoint).  
4. Stable enums for FE chips/filters.

### 1.3 Proposed response

```http
GET /api/projects/{projectId}/reports/coverage-matrix
  ?q=
  &coverageStatus=MISSING_TESTS|COVERED|AT_RISK|NOT_EVALUATED
  &latestResult=PASSED|FAILED|BLOCKED|NOT_RUN
  &priority=
  &module=
  &releaseId=
  &hasOpenDefect=true|false
  &limit=50
  &offset=0
```

**Response**

```json
{
  "summary": {
    "requirements": 42,
    "covered": 31,
    "coveredPct": 74,
    "missingTests": 11,
    "failed": 4,
    "blocked": 2,
    "notEvaluated": 5,
    "atRisk": 6
  },
  "items": [
    {
      "requirementId": "<uuid>",
      "code": "FR-AUTH-01",
      "title": "User Login",
      "requirementType": "FR",
      "priority": "HIGH",
      "moduleName": "Authentication",
      "applicationId": null,
      "functionalItemId": null,

      "coverageStatus": "AT_RISK",
      "testCaseCount": 4,
      "executedCount": 3,
      "passedCount": 2,
      "failedCount": 1,
      "blockedCount": 0,
      "notRunCount": 1,

      "latestResult": "FAILED",
      "latestResultAt": "2026-07-20T10:00:00Z",
      "latestTestRunId": "<uuid>",
      "latestTestCaseId": "<uuid>",
      "latestTestCaseCode": "TC-AUTH-03",
      "latestTestCaseTitle": "Locked account",

      "openDefectCount": 1,
      "openDefects": [
        {
          "id": "<uuid>",
          "code": "BUG-124",
          "title": "Account lock does not reset",
          "status": "OPEN",
          "severity": "HIGH"
        }
      ],

      "targetRelease": {
        "id": "<uuid>",
        "name": "Release 2.4",
        "status": "PLANNED"
      },

      "testCases": [
        {
          "id": "<uuid>",
          "code": "TC-AUTH-01",
          "title": "Valid credentials",
          "linkId": "<trace-link-uuid>",
          "latestResult": "PASSED",
          "latestResultAt": "2026-07-18T09:00:00Z"
        },
        {
          "id": "<uuid>",
          "code": "TC-AUTH-03",
          "title": "Locked account",
          "linkId": "<trace-link-uuid>",
          "latestResult": "FAILED",
          "latestResultAt": "2026-07-20T10:00:00Z"
        }
      ]
    }
  ],
  "page": { "limit": 50, "offset": 0, "total": 42 }
}
```

### 1.4 `coverageStatus` rules (BE owns these)

| Status | Rule |
|---|---|
| `MISSING_TESTS` | No Test Case linked via `TESTED_BY` (or equivalent) |
| `NOT_EVALUATED` | ≥1 Test Case, none executed (no latest result) |
| `AT_RISK` | ≥1 Test Case AND (`latestResult` ∈ {`FAILED`,`BLOCKED`} OR `openDefectCount` > 0) |
| `COVERED` | ≥1 Test Case AND latest relevant result not fail/block AND `openDefectCount` = 0 |

**Notes for BE**

- “Latest relevant result” = most recent execution among linked test cases (define timezone + which run types count).  
- Prefer **server-computed** `coverageStatus` so FE summary strip and chips never diverge.  
- Keep boolean fields deprecated-but-compatible if needed: `hasTestCase`, `hasResult`, `hasDefect`, `hasRelease`, `gap` — FE will stop relying on them once rich fields ship.

### 1.5 Payload size option

If embedding full `testCases[]` + `openDefects[]` is heavy:

```http
GET .../reports/coverage-matrix          → summary + row aggregates (no nested lists)
GET .../reports/coverage-matrix/requirements/{requirementId}
  → full expand payload (testCases, defects, release, history)
```

FE expand panel calls the detail endpoint on row expand.

### 1.6 FE acceptance

- [ ] Every project requirement appears even with zero links.  
- [ ] Summary strip numbers match `summary` from the same response (not FE recompute).  
- [ ] Row shows `testCaseCount`, `latestResult`, `openDefectCount`, `coverageStatus`.  
- [ ] Expand shows per-TC result + open defect codes.

---

## 2. Coverage summary (standalone or embedded)

### 2.1 Problem

FE currently computes:

```text
Covered / Missing / Failed / Blocked
```

from guessed status. Wrong when matrix is empty/unavailable.

### 2.2 Proposed

Prefer **embedded `summary`** on coverage-matrix (see §1.3).

Optional dedicated endpoint for dashboard widgets:

```http
GET /api/projects/{projectId}/reports/coverage-summary
```

```json
{
  "requirements": 42,
  "covered": 31,
  "coveredPct": 74,
  "missingTests": 11,
  "failed": 4,
  "blocked": 2,
  "notEvaluated": 5,
  "atRisk": 6,
  "generatedAt": "2026-07-25T15:00:00Z"
}
```

Must use the **same rules** as matrix rows.

---

## 3. Trace links: display fields + audit + filters

### 3.1 Problem

```json
{
  "id": "<uuid>",
  "sourceType": "REQUIREMENT",
  "sourceId": "<uuid>",
  "targetType": "TEST_CASE",
  "targetId": "<uuid>",
  "linkType": "TESTED_BY"
}
```

Technical section needs:

```text
FR-AUTH-01 · User Login
tested by
TC-AUTH-01 · Valid credentials
Created by · date
```

FE today joins Requirements + TestCases lists; fails for DEFECT / RELEASE / TASK / FUNCTION.

### 3.2 Extend TraceLinkResponse

```json
{
  "id": "<uuid>",
  "sourceType": "REQUIREMENT",
  "sourceId": "<uuid>",
  "sourceCode": "FR-AUTH-01",
  "sourceTitle": "User Login",
  "targetType": "TEST_CASE",
  "targetId": "<uuid>",
  "targetCode": "TC-AUTH-01",
  "targetTitle": "Valid credentials",
  "linkType": "TESTED_BY",
  "status": "ACTIVE",
  "createdAt": "<instant>",
  "createdByUserId": "<uuid>",
  "createdByDisplayName": "Nguyễn Bảo",
  "updatedAt": "<instant>"
}
```

Snapshot `sourceCode/Title` + `targetCode/Title` at create time (still readable if target archived).

### 3.3 List filters

```http
GET /api/projects/{projectId}/trace-links
  ?linkType=TESTED_BY
  &sourceType=REQUIREMENT
  &sourceId=
  &targetType=TEST_CASE
  &q=
  &limit=&offset=
```

### 3.4 Batch create (primary FE flow)

Primary UX: link **many test cases** to **one requirement** in one action.

```http
POST /api/projects/{projectId}/trace-links:batch
```

```json
{
  "links": [
    {
      "sourceType": "REQUIREMENT",
      "sourceId": "<req-uuid>",
      "targetType": "TEST_CASE",
      "targetId": "<tc-uuid-1>",
      "linkType": "TESTED_BY"
    },
    {
      "sourceType": "REQUIREMENT",
      "sourceId": "<req-uuid>",
      "targetType": "TEST_CASE",
      "targetId": "<tc-uuid-2>",
      "linkType": "TESTED_BY"
    }
  ]
}
```

**Response**

```json
{
  "created": [ /* TraceLinkResponse */ ],
  "skipped": [
    { "targetId": "<uuid>", "reason": "ALREADY_EXISTS" }
  ],
  "failed": []
}
```

Idempotent on `(sourceType, sourceId, targetType, targetId, linkType)`.

**Convenience alias (optional, nicer for FE):**

```http
POST /api/projects/{projectId}/requirements/{requirementId}/test-case-links
```

```json
{ "testCaseIds": ["<uuid>", "<uuid>"] }
```

Always creates `TESTED_BY` (hide link type from end users).

### 3.5 Unlink

```http
DELETE /api/projects/{projectId}/trace-links/{linkId}
```

or keep `PATCH .../archive` but document 204 behavior. FE needs unlink from expand panel later.

---

## 4. Test case picker for a requirement

### 4.1 Problem

Drawer searches all project test cases client-side. Needs:

- Search by code/title  
- Exclude already linked  
- Scale beyond “load all TCs”

### 4.2 Proposed

Reuse / extend:

```http
GET /api/projects/{projectId}/test-cases?q=&limit=20&offset=0&status=ACTIVE
```

Plus optional:

```http
GET /api/projects/{projectId}/requirements/{requirementId}/linkable-test-cases?q=&limit=20
```

Returns test cases **not yet** linked with `TESTED_BY` to that requirement.

```json
{
  "items": [
    { "id": "<uuid>", "code": "TC-AUTH-08", "title": "Reset password by email", "status": "ACTIVE" }
  ],
  "page": { "limit": 20, "offset": 0, "total": 12 }
}
```

---

## 5. How “latest result” is defined

Document explicitly so FE/QA agree:

| Rule | Proposal |
|---|---|
| Scope | Executions of test cases linked to the requirement via `TESTED_BY` |
| Ordering | Max(`completedAt` / `executedAt`) across those executions |
| Status map | `PASSED` \| `FAILED` \| `BLOCKED` \| `NOT_RUN` \| `SKIPPED` (map into FE labels) |
| Blocked vs defect | `BLOCKED` from execution status; open defects counted separately (`openDefectCount`) |
| Which runs | Include only completed runs; exclude draft/cancelled |

If Quality domain already has result entities, wire coverage report to that source of truth — do not invent a parallel status store.

---

## 6. Defects & release linkage

### 6.1 Open defects on a requirement

Need a deterministic join path, e.g.:

```text
Requirement -TESTED_BY→ TestCase -found→ Defect
```

and/or

```text
Requirement -RELATED_TO→ Defect
```

Document which path(s) `openDefects` uses. Status filter: open / in progress (not closed/verified).

### 6.2 Target release

Prefer:

```text
Requirement → Release (trace link or requirement.releaseId)
```

or latest release that includes linked test runs.

Return `targetRelease: { id, name, status } | null`.

---

## 7. Graceful degradation (keep current FE behavior)

Today FE:

- Continues if coverage-matrix fails (shows requirements + links).  
- Shows “Retry coverage” banner.

BE should:

- Return `200` with `items: []` only when project truly has zero requirements — not on internal errors.  
- Prefer `503` / `500` with problem+json when report generation fails so FE can show retry (already does).  
- Avoid mixing “no data” and “error” as empty 200.

---

## 8. Priority / sequencing for BE

| Priority | Item | Unblocks FE |
|---|---|---|
| **P0** | §1 Rich coverage-matrix row + `coverageStatus` + counts + `latestResult` | Accurate chips & summary |
| **P0** | §1 Always include requirements with zero links | True “Missing tests” list |
| **P0** | §1 Embedded `summary` | Summary strip = BE truth |
| **P0** | §3.4 Batch link OR §3.4 convenience `test-case-links` | Faster Link drawer |
| **P1** | §1 Nested `testCases[]` results **or** detail endpoint | Expand panel Pass/Fail per TC |
| **P1** | §1 `openDefects[]` | Show BUG-124 in expand |
| **P1** | §3.2 Trace link display fields + createdAt/by | Technical section without UUID soup |
| **P1** | §4 Linkable test-case search | Scalable picker |
| **P2** | §1 Query filters on matrix (`coverageStatus`, `q`, …) | Server-side quick filters |
| **P2** | §3.5 Unlink / archive documented for UI | Manage links from expand |
| **P2** | §6 Target release object | Release column |

---

## 9. Out of scope (this request)

- Full graph / coverage map visualization.  
- Changing primary UX to show `TESTED_BY` enum to end users.  
- Application Registry structure relations (separate workbench).  
- Replacing Requirements / Test Case CRUD APIs.  
- AI suggesting which tests to link.

---

## 10. Open questions for BE

1. Is coverage-matrix a **live query** or a **materialized report**? If materialized, what invalidates it after new `TESTED_BY` / test execution / defect change? FE needs freshness ≤ few seconds after link create (or document `stale` + `generatedAt`).  
2. Canonical link direction for tests: `Requirement --TESTED_BY→ TestCase` (FE assumes this) vs reverse — confirm and keep stable.  
3. Do project **Requirements** and **Functional Catalog items** both appear, or only Requirements? FE currently lists **Requirements** only.  
4. For `AT_RISK`: does any open defect trump a Passed latest result? (FE proposal: **yes**.)  
5. Multi-link same TC to many requirements — allowed? (Assume yes.)

---

## 11. Minimal contract checklist for BE PR

- [ ] OpenAPI for `GET .../reports/coverage-matrix` with full schema  
- [ ] `summary` + paginated `items`  
- [ ] `coverageStatus`, `latestResult`, `testCaseCount`, `openDefectCount`  
- [ ] Rows for requirements with **zero** test links  
- [ ] Status derivation rules documented (§1.4)  
- [ ] `POST` batch link or `.../requirements/{id}/test-case-links`  
- [ ] TraceLinkResponse: `sourceCode/Title`, `targetCode/Title`, `createdAt`, `createdByDisplayName`  
- [ ] Example payloads in `WAVE4_API_CONTRACT.md` §14.2  
- [ ] Note on cache/invalidation after link or execution changes  

---

## 12. FE mapping after BE ships

| FE today | After BE |
|---|---|
| `buildRequirementCoverageRows()` from 4 APIs | Prefer single coverage-matrix as source of truth |
| Guessed `Passed`/`Failed`/`Blocked` | Use `latestResult` + `coverageStatus` |
| Summary client-side | Use `summary` |
| N× `createTraceLink` | Batch / convenience endpoint |
| Resolve link labels client-side | Use enriched TraceLinkResponse |

Until then, FE keeps graceful composition of Requirements + links + boolean matrix.
