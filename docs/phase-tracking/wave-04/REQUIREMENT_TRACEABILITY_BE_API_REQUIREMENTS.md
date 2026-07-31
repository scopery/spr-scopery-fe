# Requirement Traceability — BE API Requirements

> **Status:** Proposed for BE implementation (FE handoff)  
> **Date:** 2026-07-30  
> **Owner:** FE (Scopery) → handoff to BE  
> **FE route (future):** `/workspace/{ws}/projects/{projectId}/traceability`  
> **Scope:** Full chain Coverage / Matrix / Gaps (+ Test Execution via legacy report)  
> **Out of scope for this doc:** FE UI implementation (ships after BE)

**Related contracts**

| Doc                                                                                                | Role                                                                           |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`TRACEABILITY_COVERAGE_BE_API_REQUIREMENTS.md`](./TRACEABILITY_COVERAGE_BE_API_REQUIREMENTS.md)   | **Test Execution** tab only — Req ↔ Test ↔ Result ↔ Defect (`coverage-matrix`) |
| [`WAVE4_API_CONTRACT.md`](./WAVE4_API_CONTRACT.md) §14.2                                           | Trace links + legacy coverage-matrix index                                     |
| [`APPLICATION_FUNCTIONAL_NFR_BE_REQUIREMENTS.md`](./APPLICATION_FUNCTIONAL_NFR_BE_REQUIREMENTS.md) | Function anchors, structure types, `COVERS` / `REALIZED_BY`                    |
| Use Case APIs (live FE)                                                                            | ` /api/projects/{projectId}/use-cases`, FR↔Req, UC↔Req                         |

**Path style:** Unversioned `/api/...` (matches FE `apiPath`). WAVE4 still lists `/api/v1/...` — treat as equivalent until BE unifies.

---

## 0. Product goal + UI tab map

### 0.1 Problem with current Traceability UI

Current page answers only:

> Which requirements have test cases, how did they run, and are there open defects?

It does **not** answer:

> Was the requirement analyzed into Functions? Do Functions have Use Cases? Is there Screen/API/Entity/Task evidence? Where exactly is the gap?

### 0.2 Target chain

```text
Requirement
  → Function
  → Use Case
  → Implementation Objects (Screen / API / Entity / Component / Task)
  → Test Case
  → Test Result
  → Defect
```

### 0.3 UI tabs → APIs

| Tab                    | Primary API                                              | Notes                               |
| ---------------------- | -------------------------------------------------------- | ----------------------------------- |
| **Coverage** (default) | `GET .../traceability/coverage-summary`                  | KPI cards, layer %, funnel, by type |
| **Matrix**             | `GET .../traceability/matrix` + detail on demand         | Aggregate rows; drawer uses detail  |
| **Gaps**               | `GET .../traceability/gaps`                              | Actionable work queue               |
| **Test Execution**     | `GET .../reports/coverage-matrix` (+ requirement detail) | Legacy vocabulary — see §4.5        |

```text
Requirement Traceability
├── Coverage
│   ├── Summary KPIs
│   ├── Coverage Funnel
│   └── Coverage by Requirement Type
├── Matrix
│   ├── Requirement | Functions | Use Cases | Implementation | Test Cases | Result | Gaps
│   └── Detail drawer (lazy)
├── Gaps
│   └── Gap list + recommended actions
└── Test Execution
    └── Current Req↔Test coverage UI
```

**Insight BE must enable:** not only “Missing tests”, but whether the gap is analysis, specification, implementation, or verification.

---

## 1. Glossary & enums

### 1.1 Object types

```text
REQUIREMENT
FUNCTIONAL_ITEM
USE_CASE
SCREEN
API_ENDPOINT
DATA_ENTITY
COMPONENT          # APP_COMPONENT in structure registry — normalize to COMPONENT in this API
TASK               # project work item
TEST_CASE
DEFECT
RELEASE
NON_FUNCTIONAL_ITEM
BUSINESS_RULE
```

Implementation evidence types (subset):

```text
SCREEN | API_ENDPOINT | DATA_ENTITY | COMPONENT | TASK
```

### 1.2 Relation kind

```text
DIRECT   # Trace link or FK with Requirement as an endpoint
DERIVED  # Inferred via Function / Use Case / intermediate hop
```

### 1.3 Link types (canonical hops)

Align with existing + Application Functional docs. Additive; do not break existing values.

| Hop                            | Typical direction                   | `linkType`                           |
| ------------------------------ | ----------------------------------- | ------------------------------------ |
| Requirement → Function         | `REQUIREMENT` → `FUNCTIONAL_ITEM`   | `COVERS` (or dedicated FR↔Req join)  |
| Requirement → Use Case         | `REQUIREMENT` ↔ `USE_CASE`          | Dedicated join and/or `SATISFIED_BY` |
| Function → Screen / API / …    | FR anchors / `REALIZED_BY` / `USES` | Prefer existing anchor APIs          |
| Requirement → Task / structure | `REQUIREMENT` → `TASK` / structure  | `IMPLEMENTED_BY`                     |
| Requirement → Test Case        | `REQUIREMENT` → `TEST_CASE`         | `TESTED_BY`                          |
| Test / Req → Defect            | as Quality module defines           | `VERIFIED_BY` / defect links         |

Every derived object in responses must include `derivedVia[]` with intermediate nodes and `linkType` when known.

### 1.4 Row-level coverage status (Matrix primary chip)

```text
COMPLETE
PARTIAL
NOT_APPLICABLE
```

- `COMPLETE` — all applicable layers satisfied and not failed/blocked.
- `PARTIAL` — at least one applicable layer missing or incomplete, or test failed/blocked while other layers exist.
- `NOT_APPLICABLE` — reserved for edge cases where the requirement is excluded from coverage scoring (document if used); normally NFR still scores as COMPLETE/PARTIAL without Use Case.

### 1.5 Gap codes (multi-value on a row)

A requirement may have **multiple** gaps at once. Primary chip stays `PARTIAL`; Gaps column shows chips from `gapCodes`.

```text
MISSING_FUNCTION
MISSING_USE_CASE
INCOMPLETE_USE_CASE
MISSING_IMPLEMENTATION
MISSING_TASK
MISSING_TEST
TEST_FAILED
BLOCKED
UNRESOLVED_MENTION
BROKEN_RELATION
```

**Note:** Gap codes are **not** the same vocabulary as Test Execution statuses (`COVERED`, `MISSING_TESTS`, `AT_RISK`, `NOT_EVALUATED`). Keep them separate.

### 1.6 Latest result (test execution layer)

```text
PASSED | FAILED | BLOCKED | NOT_RUN
```

### 1.7 Coverage path node status

```text
OK | PARTIAL | MISSING | NOT_APPLICABLE
```

### 1.8 `requiresUseCase`

Stored on Requirement:

```text
YES | NO | AUTO
```

Resolved for scoring:

```text
requiresUseCaseResolved: boolean
```

### 1.9 Recommended actions (Gaps / drawer CTAs)

```text
LINK_FUNCTION
CREATE_FUNCTION
LINK_USE_CASE
CREATE_USE_CASE
LINK_IMPLEMENTATION
CREATE_TEST_CASE
LINK_TEST_CASE
RESOLVE_REFERENCE
```

### 1.10 Funnel stages

```text
REQUIREMENTS
LINKED_TO_FUNCTIONS
COVERED_BY_USE_CASES
LINKED_TO_IMPLEMENTATION
VERIFIED_BY_TESTS
CURRENTLY_PASSING
```

### 1.11 Shared preview / trace object shape

```json
{
  "id": "<uuid>",
  "objectType": "FUNCTIONAL_ITEM",
  "code": "FN-LOGIN",
  "name": "User Login",
  "relationKind": "DIRECT",
  "derivedVia": [
    {
      "objectType": "FUNCTIONAL_ITEM",
      "id": "<uuid>",
      "name": "User Login",
      "linkType": "USES"
    }
  ]
}
```

- For `DIRECT`, `derivedVia` is `[]` or omitted.
- For `DERIVED`, `derivedVia` is required (ordered from Requirement outward).

---

## 2. Coverage computation rules (BE owns)

FE must **not** recompute `coverageStatus`, `gapCodes`, funnel counts, or layer percentages. Server is source of truth.

### 2.1 `requiresUseCase` resolution

| Stored | Resolved                      |
| ------ | ----------------------------- |
| `YES`  | `true`                        |
| `NO`   | `false`                       |
| `AUTO` | Derive from `requirementType` |

**AUTO defaults (proposed):**

| `requirementType` | `requiresUseCaseResolved` |
| ----------------- | ------------------------- |
| `FUNCTIONAL`      | `true`                    |
| `NON_FUNCTIONAL`  | `false`                   |
| `BUSINESS`        | `false`                   |
| `TECHNICAL`       | `false`                   |
| `CONSTRAINT`      | `false`                   |

Product may override defaults later; expose resolved boolean always.

### 2.2 Layer predicates

| Predicate                   | Meaning                                                                                                                                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hasFunction`               | ≥1 Function linked (direct FR↔Req join and/or `COVERS`)                                                                                                                                                                                              |
| `hasUseCase`                | ≥1 Use Case linked to the Requirement (direct), **or** (if product agrees) via linked Functions — **default for v1: count UC linked to Requirement OR UC whose `primaryFunctionId` is a linked Function** (document chosen rule; FE needs stability) |
| `hasCompleteUseCase`        | ≥1 applicable UC with `completenessStatus` ∈ {`READY_FOR_REVIEW`, `COMPLETE`}                                                                                                                                                                        |
| `hasImplementationEvidence` | ≥1 of SCREEN / API_ENDPOINT / DATA_ENTITY / COMPONENT / TASK (see §2.5)                                                                                                                                                                              |
| `hasTask`                   | ≥1 TASK (subset of implementation; used for `MISSING_TASK` when structure exists but no delivery task — optional gap)                                                                                                                                |
| `hasTestCase`               | ≥1 Test Case via `TESTED_BY` (or equivalent)                                                                                                                                                                                                         |
| `hasPassingLatest`          | Among linked TCs, latest relevant result is `PASSED` and no open blocking defect policy (align with Test Execution “covered”)                                                                                                                        |
| `latestFailed`              | Latest relevant result = `FAILED`                                                                                                                                                                                                                    |
| `latestBlocked`             | Latest relevant result = `BLOCKED`                                                                                                                                                                                                                   |

### 2.3 Incomplete Use Case

Emit `INCOMPLETE_USE_CASE` when:

- Use Case layer is applicable (`requiresUseCaseResolved === true`), and
- `hasUseCase === true`, and
- **no** linked UC meets `completenessStatus ∈ {READY_FOR_REVIEW, COMPLETE}`

Default: do **not** dig into main-flow/AC presence beyond `completenessStatus` (Use Case module already owns that).

### 2.4 Functional requirement — Complete

When `requiresUseCaseResolved === true`:

```text
COMPLETE iff
  hasFunction
  AND hasUseCase
  AND NOT INCOMPLETE_USE_CASE (i.e. hasCompleteUseCase)
  AND hasImplementationEvidence
  AND hasTestCase
  AND NOT latestFailed
  AND NOT latestBlocked
```

When `requiresUseCaseResolved === false`:

```text
COMPLETE iff
  hasFunction
  AND hasImplementationEvidence
  AND hasTestCase
  AND NOT latestFailed
  AND NOT latestBlocked
```

(Use Case layer marked `NOT_APPLICABLE` in coverage paths.)

### 2.5 Non-functional requirement — Complete

Default `requiresUseCaseResolved === false`.

```text
COMPLETE iff
  hasNfrSpecification
  AND hasVerificationTarget
  AND hasVerificationCase
  AND hasMeasuredResult
  AND NOT latestVerificationFailed
  AND NOT latestVerificationBlocked
```

The NFR pipeline is:

```text
Requirement
  → NFR Specification
  → Verification Target
  → Verification Case
  → Measured Result
  → Defect (when failed/blocked)
```

Do **not** use a Functional Test Case as a substitute for a Verification Case. Legacy Test Case links may remain readable during migration but must not satisfy NFR completion.

Function, Use Case, Functional Implementation, and Test Case path nodes are `NOT_APPLICABLE` for NFR scoring.

### 2.6 Gap emission matrix

Evaluate independently; collect all that apply:

| Condition                                                              | Emit                     |
| ---------------------------------------------------------------------- | ------------------------ |
| Applicable Function required and `!hasFunction`                        | `MISSING_FUNCTION`       |
| `requiresUseCaseResolved` and `!hasUseCase`                            | `MISSING_USE_CASE`       |
| `requiresUseCaseResolved` and incomplete UCs only                      | `INCOMPLETE_USE_CASE`    |
| `!hasImplementationEvidence`                                           | `MISSING_IMPLEMENTATION` |
| Optional: has structure evidence but no TASK, and policy requires task | `MISSING_TASK`           |
| `!hasTestCase`                                                         | `MISSING_TEST`           |
| `latestFailed`                                                         | `TEST_FAILED`            |
| `latestBlocked`                                                        | `BLOCKED`                |
| NFR and `!hasNfrSpecification`                                         | `MISSING_NFR_SPECIFICATION` |
| NFR and `!hasVerificationTarget`                                       | `MISSING_VERIFICATION_TARGET` |
| NFR and `!hasVerificationCase`                                         | `MISSING_VERIFICATION_CASE` |
| NFR and `!hasMeasuredResult`                                           | `MISSING_VERIFICATION_RESULT` |
| NFR latest measured result is `FAILED`                                 | `VERIFICATION_FAILED`    |
| NFR latest measured result is `BLOCKED`                                | `VERIFICATION_BLOCKED`   |
| Mentions pointing at deleted/archived objects                          | `UNRESOLVED_MENTION`     |
| Trace link target missing / archived unexpectedly                      | `BROKEN_RELATION`        |

Functional gap codes apply only to Functional requirements. NFR gap codes apply only to Non-functional requirements; never emit `MISSING_FUNCTION`, `MISSING_USE_CASE`, or `MISSING_TEST` solely because an NFR has no Functional artifacts.

### 2.7 Primary `coverageStatus` from gaps

```text
if no applicable gaps and Complete rules pass → COMPLETE
else if requirement excluded from scoring → NOT_APPLICABLE  (rare)
else → PARTIAL
```

### 2.8 Layer coverage percentages (summary)

Denominator = requirements included in scoring (exclude archived).

| Metric                    | Numerator                                                                 |
| ------------------------- | ------------------------------------------------------------------------- |
| `functionPct`             | Functional requirements with a Function                                   |
| `useCasePct`              | Functional requirements satisfying their Use Case rule                    |
| `implementationPct`       | Functional requirements with implementation evidence                      |
| `testPct`                 | Functional requirements with a Functional Test Case                       |
| `nfrSpecificationPct`     | NFRs with an NFR Specification                                             |
| `verificationTargetPct`   | NFRs with at least one Verification Target                                |
| `verificationCasePct`     | NFRs with at least one active Verification Case                           |
| `measuredResultPct`       | NFRs with at least one latest measured Verification Result                |

Document exact denominators in OpenAPI description; FE will display percentages as returned.

### 2.9 Funnel counts

Return separate monotonic funnels. Do not combine Functional and NFR stages into one sequence.

**Functional funnel**

1. `FUNCTIONAL_REQUIREMENTS`
2. `LINKED_TO_FUNCTIONS`
3. `COVERED_BY_USE_CASES`
4. `LINKED_TO_IMPLEMENTATION`
5. `VERIFIED_BY_TEST_CASES`
6. `FUNCTIONAL_CURRENTLY_PASSING`

**NFR funnel**

1. `NON_FUNCTIONAL_REQUIREMENTS`
2. `HAS_NFR_SPECIFICATION`
3. `HAS_VERIFICATION_TARGET`
4. `HAS_VERIFICATION_CASE`
5. `HAS_MEASURED_RESULT`
6. `NFR_CURRENTLY_PASSING`

---

## 3. Direct vs Derived

### 3.1 Definitions

- **Direct:** Requirement is an endpoint of the link/join (Req↔Function, Req↔UC, Req↔Test, Req↔Task, Req↔Screen, …).
- **Derived:** Reachable only through an intermediate (e.g. Req → Function → Screen via anchors).

### 3.2 Implementation evidence sources (precedence for display)

When building `implementationObjects`, union with relationKind; prefer showing Direct when both exist for the same target.

1. Direct Req → structure / TASK links
2. Via Function: anchors, function-screens, function-api-endpoints, `REALIZED_BY`
3. Via Use Case flow steps: `screenContextId`, `nextScreenId`
4. Via work items `IMPLEMENTED_BY` if not already counted

### 3.3 Matrix toggle `includeDerived`

- `includeDerived=true` (default): counts and previews include derived objects; mark `relationKind`.
- `includeDerived=false`: counts/previews **direct only**; coverage Complete rules still use BE’s configured evidence policy — **v1: Complete rules always allow derived evidence** (toggle is display/filter only). Document if BE chooses otherwise.

### 3.4 Hover / path explanation

Detail `coveragePaths` and `derivedVia` must support UI copy:

```text
REQ-AUTH-001
  → COVERS → User Login
  → USES → Login Screen
```

---

## 4. Endpoints

**Base:** `/api/projects/{projectId}/traceability`

### 4.1 Coverage summary

```http
GET /api/projects/{projectId}/traceability/coverage-summary
```

**Response**

```json
{
  "requirements": 120,
  "completeCoveragePct": 68,
  "completeCount": 82,
  "partialCount": 38,
  "missingFunctions": 8,
  "missingUseCases": 14,
  "missingImplementation": 11,
  "missingTests": 22,
  "failedTests": 4,
  "blocked": 2,
  "layerCoverage": {
    "functionPct": 94,
    "useCasePct": 82,
    "implementationPct": 79,
    "testPct": 68
  },
  "funnel": [
    { "stage": "REQUIREMENTS", "count": 120 },
    { "stage": "LINKED_TO_FUNCTIONS", "count": 113 },
    { "stage": "COVERED_BY_USE_CASES", "count": 98 },
    { "stage": "LINKED_TO_IMPLEMENTATION", "count": 91 },
    { "stage": "VERIFIED_BY_TESTS", "count": 82 },
    { "stage": "CURRENTLY_PASSING", "count": 76 }
  ],
  "byRequirementType": [
    {
      "requirementType": "FUNCTIONAL",
      "total": 90,
      "completeCount": 63,
      "completePct": 70,
      "gapCounts": {
        "MISSING_FUNCTION": 5,
        "MISSING_USE_CASE": 12,
        "MISSING_IMPLEMENTATION": 8,
        "MISSING_TEST": 15,
        "TEST_FAILED": 3,
        "BLOCKED": 1
      }
    },
    {
      "requirementType": "NON_FUNCTIONAL",
      "total": 30,
      "completeCount": 19,
      "completePct": 63,
      "gapCounts": {
        "MISSING_IMPLEMENTATION": 3,
        "MISSING_TEST": 7
      }
    }
  ],
  "generatedAt": "2026-07-30T02:00:00Z",
  "stale": false
}
```

**KPI field meanings**

| Field                   | Meaning                                        |
| ----------------------- | ---------------------------------------------- |
| `completeCoveragePct`   | `round(100 * completeCount / requirements)`    |
| `missingFunctions`      | Count of reqs with gap `MISSING_FUNCTION`      |
| `missingUseCases`       | Count with `MISSING_USE_CASE` (not incomplete) |
| `missingImplementation` | Count with `MISSING_IMPLEMENTATION`            |
| `missingTests`          | Count with `MISSING_TEST`                      |
| `failedTests`           | Count with `TEST_FAILED`                       |
| `missingNfrSpecifications` | NFR count with `MISSING_NFR_SPECIFICATION`  |
| `missingVerificationTargets` | NFR count with `MISSING_VERIFICATION_TARGET` |
| `missingVerificationCases` | NFR count with `MISSING_VERIFICATION_CASE`  |
| `missingVerificationResults` | NFR count with `MISSING_VERIFICATION_RESULT` |
| `failedVerifications`   | NFR count with `VERIFICATION_FAILED`           |
| `blocked`               | Count with `BLOCKED`                           |

A requirement can contribute to multiple missing\* counters.

---

### 4.2 Matrix list (aggregate only)

```http
GET /api/projects/{projectId}/traceability/matrix
  ?q=
  &coverageStatus=COMPLETE|PARTIAL|NOT_APPLICABLE
  &gapCode=MISSING_FUNCTION|MISSING_USE_CASE|MISSING_NFR_SPECIFICATION|...
  &requirementType=
  &module=
  &functionId=
  &useCaseId=
  &screenId=
  &apiEndpointId=
  &testCaseId=
  &verificationCaseId=
  &relationKind=DIRECT|DERIVED|ANY
  &requiresUseCase=YES|NO|AUTO
  &releaseId=
  &showGapsOnly=true|false
  &includeDerived=true|false
  &priority=
  &limit=50
  &offset=0
```

**Rules**

- One row per project requirement (including zero links).
- **Do not** embed full Function/Use Case/Implementation/Test Case/Verification Case lists.
- Functional rows use `previews.functions`, `previews.useCases`, `previews.implementation`, and `previews.testCases`.
- NFR rows use scalar aggregates plus `previews.verificationTargets` and `previews.verificationCases`.
- Each preview list contains at most **2** items; remainder is returned in the matching `previewMore.*` field.
- `showGapsOnly=true` ⇒ `coverageStatus !== COMPLETE`.
- Server-side filter/pagination required (do not force FE to load all reqs).

**Response**

```json
{
  "summary": {
    "requirements": 120,
    "completeCount": 82,
    "completeCoveragePct": 68,
    "partialCount": 38,
    "missingFunctions": 8,
    "missingUseCases": 14,
    "missingImplementation": 11,
    "missingTests": 22,
    "failedTests": 4,
    "missingNfrSpecifications": 3,
    "missingVerificationTargets": 4,
    "missingVerificationCases": 6,
    "missingVerificationResults": 8,
    "failedVerifications": 2,
    "blocked": 2
  },
  "items": [
    {
      "requirementId": "<uuid>",
      "code": "REQ-AUTH-001",
      "title": "Registered users must be able to access their accounts",
      "requirementType": "FUNCTIONAL",
      "priority": "HIGH",
      "moduleName": "Authentication",
      "applicationId": null,
      "requiresUseCase": "AUTO",
      "requiresUseCaseResolved": true,
      "coverageStatus": "COMPLETE",
      "gapCodes": [],
      "functionCount": 1,
      "useCaseCount": 1,
      "implementationCount": 2,
      "testCaseCount": 1,
      "latestResult": "PASSED",
      "latestResultAt": "2026-07-20T10:00:00Z",
      "openDefectCount": 0,
      "targetRelease": {
        "id": "<uuid>",
        "name": "Release 2.4",
        "status": "PLANNED"
      },
      "previews": {
        "functions": [
          {
            "id": "<uuid>",
            "objectType": "FUNCTIONAL_ITEM",
            "code": null,
            "name": "User Login",
            "relationKind": "DIRECT"
          }
        ],
        "useCases": [
          {
            "id": "<uuid>",
            "objectType": "USE_CASE",
            "code": "UC-LOGIN-01",
            "name": "Login with valid credentials",
            "relationKind": "DIRECT",
            "completenessStatus": "COMPLETE"
          }
        ],
        "implementation": [
          {
            "id": "<uuid>",
            "objectType": "SCREEN",
            "code": null,
            "name": "Login Screen",
            "relationKind": "DERIVED"
          },
          {
            "id": "<uuid>",
            "objectType": "API_ENDPOINT",
            "code": null,
            "name": "Login API",
            "relationKind": "DERIVED"
          }
        ],
        "testCases": [
          {
            "id": "<uuid>",
            "objectType": "TEST_CASE",
            "code": "TC-LOGIN-001",
            "name": "Valid login",
            "relationKind": "DIRECT",
            "latestResult": "PASSED"
          }
        ]
      },
      "previewMore": {
        "functions": 0,
        "useCases": 0,
        "implementation": 0,
        "testCases": 0
      }
    },
    {
      "requirementId": "<uuid>",
      "code": "REQ-AUTH-002",
      "title": "The system must reject invalid credentials",
      "requirementType": "FUNCTIONAL",
      "priority": "HIGH",
      "moduleName": "Authentication",
      "applicationId": null,
      "requiresUseCase": "AUTO",
      "requiresUseCaseResolved": true,
      "coverageStatus": "PARTIAL",
      "gapCodes": ["MISSING_USE_CASE", "MISSING_TEST"],
      "functionCount": 1,
      "useCaseCount": 0,
      "implementationCount": 1,
      "testCaseCount": 0,
      "latestResult": "NOT_RUN",
      "latestResultAt": null,
      "openDefectCount": 0,
      "targetRelease": null,
      "previews": {
        "functions": [
          {
            "id": "<uuid>",
            "objectType": "FUNCTIONAL_ITEM",
            "name": "User Login",
            "relationKind": "DIRECT"
          }
        ],
        "useCases": [],
        "implementation": [
          {
            "id": "<uuid>",
            "objectType": "API_ENDPOINT",
            "name": "Login API",
            "relationKind": "DERIVED"
          }
        ],
        "testCases": []
      },
      "previewMore": {
        "functions": 0,
        "useCases": 0,
        "implementation": 0,
        "testCases": 0
      }
    }
  ],
  "page": { "limit": 50, "offset": 0, "total": 120 },
  "generatedAt": "2026-07-30T02:00:00Z",
  "stale": false
}
```

**Required NFR matrix row**

```json
{
  "requirementId": "<uuid>",
  "code": "NFR-PERF-001",
  "title": "Checkout API p95 latency must remain below 300 ms",
  "requirementType": "NON_FUNCTIONAL",
  "priority": "HIGH",
  "requiresUseCase": "NO",
  "requiresUseCaseResolved": false,
  "coverageStatus": "PARTIAL",
  "gapCodes": ["MISSING_VERIFICATION_RESULT"],
  "nfrSpecificationConfigured": true,
  "verificationTargetCount": 2,
  "verificationCaseCount": 1,
  "verificationResultCount": 0,
  "latestVerificationResult": "NOT_RUN",
  "latestVerificationResultAt": null,
  "openDefectCount": 0,
  "previews": {
    "verificationTargets": [
      {
        "id": "<uuid>",
        "objectType": "API",
        "code": "POST /checkout",
        "name": "Checkout API"
      }
    ],
    "verificationCases": [
      {
        "id": "<uuid>",
        "objectType": "VERIFICATION_CASE",
        "code": "VC-PERF-001",
        "name": "Checkout p95 load test",
        "lifecycleStatus": "READY",
        "verificationMethod": "LOAD_TEST"
      }
    ]
  },
  "previewMore": {
    "verificationTargets": 1,
    "verificationCases": 0
  }
}
```

For NFR rows, Functional aggregate fields (`functionCount`, `useCaseCount`, `implementationCount`, `testCaseCount`) may remain present for backward compatibility but are not used for NFR scoring. They must not be used as aliases for the NFR fields above.

**Filter chip mapping (FE)**

```text
Functional: All | Complete | Partial | Missing Function | Missing Use Case |
Missing Implementation | Missing Test | Failed / Blocked

NFR: All | Complete | Partial | Missing Specification | Missing Target |
Missing Verification Case | Missing Result | Failed / Blocked
```

Map Failed/Blocked → `gapCode=TEST_FAILED` or `gapCode=BLOCKED` (or BE accepts multi `gapCode`).

---

### 4.3 Requirement traceability detail (lazy)

```http
GET /api/projects/{projectId}/traceability/requirements/{requirementId}
  ?includeDerived=true|false
```

Called when opening the right-side drawer or expanding a summary path. **Not** returned on matrix list.

**Response**

```json
{
  "requirement": {
    "id": "<uuid>",
    "code": "REQ-AUTH-002",
    "title": "The system must reject invalid credentials",
    "requirementType": "FUNCTIONAL",
    "priority": "HIGH",
    "moduleName": "Authentication",
    "description": null,
    "requiresUseCase": "AUTO",
    "requiresUseCaseResolved": true
  },
  "coverageStatus": "PARTIAL",
  "gapCodes": ["MISSING_USE_CASE", "MISSING_TEST"],
  "coverageScore": {
    "pct": 40,
    "layers": {
      "function": true,
      "useCase": false,
      "implementation": true,
      "test": false,
      "passing": false
    }
  },
  "functions": [
    {
      "id": "<uuid>",
      "objectType": "FUNCTIONAL_ITEM",
      "name": "User Login",
      "relationKind": "DIRECT",
      "linkId": "<uuid-or-null>"
    }
  ],
  "useCases": [],
  "implementationObjects": [
    {
      "id": "<uuid>",
      "objectType": "SCREEN",
      "name": "Login Screen",
      "relationKind": "DERIVED",
      "derivedVia": [
        {
          "objectType": "FUNCTIONAL_ITEM",
          "id": "<uuid>",
          "name": "User Login",
          "linkType": "USES"
        }
      ]
    },
    {
      "id": "<uuid>",
      "objectType": "API_ENDPOINT",
      "name": "Login API",
      "relationKind": "DERIVED",
      "derivedVia": [
        {
          "objectType": "FUNCTIONAL_ITEM",
          "id": "<uuid>",
          "name": "User Login",
          "linkType": "USES"
        }
      ]
    }
  ],
  "testCases": [],
  "latestResults": [],
  "defects": [],
  "coveragePaths": [
    {
      "nodes": [
        { "layer": "REQUIREMENT", "status": "OK", "object": null },
        {
          "layer": "FUNCTION",
          "status": "OK",
          "object": { "id": "<uuid>", "name": "User Login", "objectType": "FUNCTIONAL_ITEM" }
        },
        { "layer": "USE_CASE", "status": "MISSING", "object": null },
        {
          "layer": "IMPLEMENTATION",
          "status": "OK",
          "objects": [
            { "id": "<uuid>", "name": "Login Screen", "objectType": "SCREEN" },
            { "id": "<uuid>", "name": "Login API", "objectType": "API_ENDPOINT" }
          ]
        },
        { "layer": "TEST", "status": "MISSING", "object": null }
      ]
    }
  ],
  "gaps": [
    {
      "gapCode": "MISSING_USE_CASE",
      "priority": "MEDIUM",
      "message": "No use case describes how invalid credentials are handled.",
      "relatedObject": {
        "objectType": "FUNCTIONAL_ITEM",
        "id": "<uuid>",
        "name": "User Login"
      },
      "recommendedAction": "CREATE_USE_CASE",
      "actionPayloadHint": { "primaryFunctionId": "<uuid>" }
    },
    {
      "gapCode": "MISSING_TEST",
      "priority": "HIGH",
      "message": "No test case verifies rejection of invalid credentials.",
      "relatedObject": null,
      "recommendedAction": "LINK_TEST_CASE",
      "actionPayloadHint": {}
    }
  ],
  "history": [
    {
      "at": "2026-07-28T12:00:00Z",
      "actorUserId": "<uuid>",
      "action": "LINK_CREATED",
      "summary": "Linked function User Login"
    }
  ],
  "generatedAt": "2026-07-30T02:00:00Z"
}
```

**Drawer sections ↔ fields**

| UI section          | Fields                                        |
| ------------------- | --------------------------------------------- |
| Requirement Summary | `requirement`                                 |
| Coverage Score      | `coverageScore`, `coverageStatus`, `gapCodes` |
| Functions           | `functions`                                   |
| Use Cases           | `useCases`                                    |
| Implementation      | `implementationObjects`                       |
| Test Cases          | `testCases`                                   |
| Latest Results      | `latestResults`                               |
| Defects             | `defects`                                     |
| Gap Analysis        | `gaps` + `coveragePaths`                      |
| History             | `history`                                     |

**Test case item (when present)**

```json
{
  "id": "<uuid>",
  "objectType": "TEST_CASE",
  "code": "TC-LOGIN-001",
  "name": "Valid login",
  "relationKind": "DIRECT",
  "linkId": "<trace-link-uuid>",
  "latestResult": "PASSED",
  "latestResultAt": "2026-07-18T09:00:00Z"
}
```

**Defect item**

```json
{
  "id": "<uuid>",
  "code": "BUG-124",
  "title": "...",
  "status": "OPEN",
  "severity": "HIGH",
  "relationKind": "DIRECT"
}
```

---

### 4.4 Gaps list

```http
GET /api/projects/{projectId}/traceability/gaps
  ?gapCode=
  &priority=HIGH|MEDIUM|LOW
  &requirementId=
  &q=
  &limit=50
  &offset=0
```

**Response**

```json
{
  "summary": {
    "total": 42,
    "byGapCode": {
      "MISSING_FUNCTION": 8,
      "MISSING_USE_CASE": 14,
      "INCOMPLETE_USE_CASE": 3,
      "MISSING_IMPLEMENTATION": 11,
      "MISSING_TASK": 2,
      "MISSING_TEST": 22,
      "TEST_FAILED": 4,
      "BLOCKED": 2,
      "UNRESOLVED_MENTION": 1,
      "BROKEN_RELATION": 0
    }
  },
  "items": [
    {
      "id": "gap:req-<uuid>:MISSING_USE_CASE",
      "gapCode": "MISSING_USE_CASE",
      "priority": "MEDIUM",
      "requirement": {
        "id": "<uuid>",
        "code": "REQ-007",
        "title": "..."
      },
      "relatedObject": {
        "objectType": "FUNCTIONAL_ITEM",
        "id": "<uuid>",
        "name": "User Login"
      },
      "recommendedAction": "CREATE_USE_CASE",
      "actionPayloadHint": {
        "primaryFunctionId": "<uuid>"
      },
      "message": "Create a use case for this requirement under User Login."
    }
  ],
  "page": { "limit": 50, "offset": 0, "total": 42 },
  "generatedAt": "2026-07-30T02:00:00Z",
  "stale": false
}
```

**`id` stability:** Prefer deterministic ids (`gap:{requirementId}:{gapCode}` or include related object id) so FE can key rows and dismiss/resolve without flicker.

**Priority heuristic (proposed)**

| Gap                                                          | Default priority |
| ------------------------------------------------------------ | ---------------- |
| `TEST_FAILED`, `BLOCKED`, `BROKEN_RELATION`                  | HIGH             |
| `MISSING_TEST`, `MISSING_FUNCTION`, `MISSING_IMPLEMENTATION` | HIGH             |
| `MISSING_USE_CASE`, `INCOMPLETE_USE_CASE`, `MISSING_TASK`    | MEDIUM           |
| `UNRESOLVED_MENTION`                                         | MEDIUM           |

---

### 4.5 Test Execution (legacy — do not merge vocabularies)

Keep and complete:

| Method | Path                                                                             |
| ------ | -------------------------------------------------------------------------------- |
| `GET`  | `/api/projects/{projectId}/reports/coverage-matrix`                              |
| `GET`  | `/api/projects/{projectId}/reports/coverage-matrix/requirements/{requirementId}` |

Full schema, test-only `coverageStatus` (`COVERED` \| `MISSING_TESTS` \| `AT_RISK` \| `NOT_EVALUATED`), and FE workarounds:  
→ [`TRACEABILITY_COVERAGE_BE_API_REQUIREMENTS.md`](./TRACEABILITY_COVERAGE_BE_API_REQUIREMENTS.md)

**Hard rule:** Full-chain Matrix uses §1.4–1.5. Test Execution tab uses legacy enums only. FE will never mix chips from both models on the same tab.

---

### 4.6 Mutations, pickers, requirement field

#### 4.6.1 Requirement field — `requiresUseCase`

```http
PATCH /api/projects/{projectId}/requirements/{requirementId}
```

Body (additive):

```json
{
  "requiresUseCase": "YES"
}
```

Allowed: `YES` | `NO` | `AUTO`.  
Response must echo `requiresUseCase` + `requiresUseCaseResolved`.

Also include these fields on requirement list/get responses used elsewhere.

#### 4.6.2 Reuse existing link APIs (preferred)

| Action              | Existing API (FE already calls)                                                   |
| ------------------- | --------------------------------------------------------------------------------- |
| Link Req ↔ Function | `POST /api/projects/{projectId}/functional-items/{functionalItemId}/requirements` |
| Unlink              | `DELETE .../functional-items/{functionalItemId}/requirements/{requirementId}`     |
| Link UC ↔ Req       | `POST /api/projects/{projectId}/use-cases/{useCaseId}/requirements`               |
| Unlink              | `DELETE .../use-cases/{useCaseId}/requirements/{requirementId}`                   |
| Create Use Case     | `POST /api/projects/{projectId}/use-cases` (`primaryFunctionId`, …)               |
| FR ↔ Screen / API   | Function screens / api-endpoints / anchors APIs                                   |
| Link Test Cases     | `POST /api/projects/{projectId}/requirements/{requirementId}/test-case-links`     |
| Batch trace links   | `POST /api/projects/{projectId}/trace-links/batch`                                |
| Single trace link   | `POST /api/projects/{projectId}/trace-links`                                      |

After any successful mutation, matrix/summary/gaps must reflect change within freshness SLA (§5).

#### 4.6.3 Linkable pickers (new — recommended)

Avoid FE scanning entire catalogs when linking from the drawer.

```http
GET /api/projects/{projectId}/traceability/requirements/{requirementId}/linkable-functions
  ?q=&limit=20&offset=0

GET /api/projects/{projectId}/traceability/requirements/{requirementId}/linkable-use-cases
  ?q=&functionId=&limit=20&offset=0

GET /api/projects/{projectId}/traceability/requirements/{requirementId}/linkable-implementation
  ?objectType=SCREEN|API_ENDPOINT|DATA_ENTITY|COMPONENT|TASK
  &q=&limit=20&offset=0

GET /api/projects/{projectId}/traceability/requirements/{requirementId}/linkable-test-cases
  ?q=&limit=20&offset=0
```

(`linkable-test-cases` may alias existing `.../requirements/{id}/linkable-test-cases`.)

**Required Use Case scope and mutation validation**

- `linkable-use-cases` must return only Use Cases whose `primaryFunctionId` belongs to a
  Function already linked to the Requirement.
- If the Requirement has no linked Function, return an empty list.
- The link mutation must enforce the same rule and reject an unrelated Use Case even if a
  client submits its id directly. Frontend filtering is not a security or integrity boundary.
- Inline Use Case creation is not part of this picker flow; creation remains in the Use Case
  Catalog.

**List item**

```json
{
  "id": "<uuid>",
  "objectType": "FUNCTIONAL_ITEM",
  "code": null,
  "name": "User Login",
  "alreadyLinked": false,
  "subtitle": "Authentication"
}
```

#### 4.6.4 Optional unified link facade

```http
POST /api/projects/{projectId}/traceability/requirements/{requirementId}/links
```

```json
{
  "targetType": "FUNCTIONAL_ITEM",
  "targetId": "<uuid>",
  "linkType": "COVERS"
}
```

Optional convenience; if omitted, FE uses §4.6.2 dedicated endpoints. Prefer documenting one approach as canonical for Wave deliverable.

#### 4.6.5 Resolve broken mention / relation

```http
POST /api/projects/{projectId}/traceability/mentions/{mentionId}/resolve
```

```json
{
  "resolution": "RELINK" | "DISMISS",
  "newTargetType": "COMPONENT",
  "newTargetId": "<uuid>"
}
```

Only required if BE persists mention/broken-relation records for `UNRESOLVED_MENTION` / `BROKEN_RELATION`.

---

## 5. Performance, freshness, errors, empty states

### 5.1 Performance

| Endpoint            | Expectation                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `coverage-summary`  | O(project) aggregate; cacheable                                  |
| `matrix`            | Paginated aggregates + ≤2 previews/column; no nested full graphs |
| `requirements/{id}` | Full graph for one requirement                                   |
| `gaps`              | Paginated; server filter by `gapCode`                            |

**Do not** require FE to:

- Load all functions, use cases, screens, and tests to build the matrix
- N+1 fetch per row for expand

Default `limit=50`, max `limit=200`.

### 5.2 Freshness / invalidation

Document whether reports are **live** or **materialized**.

Invalidate (or recompute) when:

- Requirement created/updated/archived (`requiresUseCase` change)
- Function / UC / test / structure / task link created or archived
- Use Case `completenessStatus` changes
- Test execution result recorded
- Defect opened/closed against linked TC/Req
- Structure object archived (may create `BROKEN_RELATION`)

**SLA:** After link mutation, subsequent GET should reflect change within a few seconds, **or** return `"stale": true` with `generatedAt` so FE can poll/refetch.

### 5.3 Error codes

Use existing RFC 9457 / `ApiError` patterns.

| Situation                      | HTTP                  | Notes                                |
| ------------------------------ | --------------------- | ------------------------------------ |
| Unknown project                | 404                   |                                      |
| Requirement not in project     | 404                   | Detail / linkable                    |
| Invalid `gapCode` / enum query | 400                   | Validation errors array              |
| Link target already linked     | 409 or 200 idempotent | Prefer idempotent 200                |
| Link target archived           | 422                   | Business code e.g. `TARGET_ARCHIVED` |
| Forbidden                      | 403                   |                                      |

### 5.4 Empty states

| Case                          | Response                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Project has zero requirements | `summary.requirements=0`, empty `items`, funnel zeros                                                                           |
| Matrix filters match nothing  | `items=[]`, `page.total=0`, summary still project-wide **or** filtered — **v1: summary remains project-wide**; document clearly |
| Detail for req with no links  | Empty arrays, gaps populated, path nodes MISSING as applicable                                                                  |

---

## 6. Open questions for BE

1. **Live vs materialized** for summary/matrix/gaps? If materialized, what is the invalidation mechanism and max staleness?
2. **Use Case attribution:** Does `hasUseCase` require a **direct** Req↔UC link, or is UC under a linked Function enough? (Doc §2.2 proposes OR; confirm.)
3. **`MISSING_TASK`:** Always emit when no TASK, or only when policy “requires delivery task” is on?
4. **NFR Function:** Confirm v1 does **not** require Function for NFR Complete.
5. **Mention model:** Do `UNRESOLVED_MENTION` / resolve endpoint need a new table, or reuse structure-relation soft-delete signals only?
6. **History:** Is `history[]` on detail v1 or defer to audit log later?
7. **`coverageScore.pct` formula:** Equal weight per applicable layer? Confirm.
8. **Path versioning:** `/api` vs `/api/v1` — confirm FE `apiPath` unversioned remains correct.
9. **Batch link facade** vs only dedicated endpoints for Wave deliverable?
10. **OpenAPI:** Will these land in the BE OpenAPI package in the same PR as implementation?

---

## 7. FE acceptance checklist

### 7.1 Coverage tab

- [ ] KPI cards bind only to `coverage-summary` (no client recompute of %).
- [ ] Layer coverage bars match `layerCoverage.*`.
- [ ] Funnel stages and counts match `funnel[]` order/enum.
- [ ] `byRequirementType` renders without FE inventing gap totals.
- [ ] `generatedAt` / `stale` surfaced if stale.

### 7.2 Matrix tab

- [ ] Every requirement appears once, including zero-link rows.
- [ ] Columns show counts + ≤2 preview chips + “+N more”.
- [ ] Primary chip = `COMPLETE` | `PARTIAL` | `NOT_APPLICABLE`.
- [ ] Gaps column shows `gapCodes` chips.
- [ ] Derived objects labeled (badge or dashed style) via `relationKind`.
- [ ] Filters (`gapCode`, `showGapsOnly`, `includeDerived`, type, module, …) are server-side.
- [ ] Opening drawer calls detail endpoint once (not list payload).
- [ ] Direct vs derived copy available from `derivedVia`.

### 7.3 Gaps tab

- [ ] List driven by `GET .../gaps` only.
- [ ] Filter by `gapCode` / priority works.
- [ ] Each row exposes `recommendedAction` mappable to CTA.
- [ ] `actionPayloadHint` sufficient to open create/link flows (e.g. `primaryFunctionId`).

### 7.4 Test Execution tab

- [ ] Still uses legacy `coverage-matrix` + test-only statuses.
- [ ] No full-chain gap chips on this tab.

### 7.5 Mutations / field

- [ ] PATCH `requiresUseCase` updates resolved coverage on refetch.
- [ ] Link Function / UC / Implementation / Test from drawer refreshes matrix row + gaps.
- [ ] Linkable pickers exclude or mark `alreadyLinked`.

### 7.6 Performance

- [ ] Matrix first paint does not download full graphs for all requirements.
- [ ] Detail fetch only on drawer/expand.
- [ ] Page remains usable at ≥1k requirements with pagination.

### 7.7 Cross-rule samples

- [ ] REQ with Function + Screen(derived) + Test + UC → `COMPLETE`.
- [ ] REQ with Function + API, no UC, no Test → `PARTIAL` + `MISSING_USE_CASE` + `MISSING_TEST`.
- [ ] NFR with API + Test, no UC → `COMPLETE`, UC path `NOT_APPLICABLE`.
- [ ] UC present but `INCOMPLETE` only → `INCOMPLETE_USE_CASE`.
- [ ] Latest failed → `TEST_FAILED` (and `PARTIAL` unless other policy).

---

## 8. Migration / compatibility

| Artifact                                              | Action                                                          |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| `GET .../reports/coverage-matrix`                     | **Keep** — Test Execution + existing FE `useTraceabilityMatrix` |
| New `.../traceability/*`                              | **Add** — Coverage / Matrix / Gaps / detail                     |
| FE `CoverageStatus` (`covered` / `missing_tests` / …) | Remains for Test Execution model only                           |
| New FE models (post-BE)                               | `COMPLETE` / `PARTIAL` + `gapCodes` for Matrix                  |

**Deprecation:** Do not remove boolean legacy fields on coverage-matrix until Test Execution FE migrates fully to rich cells (see legacy doc).

**Nav copy (future FE):** Rename page framing from “Traceability = test coverage” to “Requirement Traceability” with four tabs; primary CTA becomes contextual Link Object, not only Link test case.

---

## 9. Priority for BE delivery

| Priority     | Deliverable                                         | Unlocks                  |
| ------------ | --------------------------------------------------- | ------------------------ |
| **P0**       | Coverage rules + `requiresUseCase` on Requirement   | Correct Complete/Partial |
| **P0**       | `GET .../traceability/matrix` aggregates + gapCodes | Matrix tab               |
| **P0**       | `GET .../traceability/requirements/{id}`            | Drawer / coverage path   |
| **P0**       | `GET .../traceability/coverage-summary`             | Coverage tab             |
| **P1**       | `GET .../traceability/gaps`                         | Gaps tab                 |
| **P1**       | Linkable picker endpoints                           | Fast drawer actions      |
| **P1**       | Direct/Derived + `derivedVia` on all objects        | Trustworthy matrix       |
| **P2**       | Mentions resolve + history                          | Broken relation UX       |
| **P2**       | Unified link facade                                 | Optional DX              |
| **Parallel** | Complete legacy coverage-matrix rich fields         | Test Execution accuracy  |

---

## 10. Example end-to-end (BE test fixture)

**REQ-AUTH-001** — Functional, AUTO→requires UC

Links: Function `User Login` (direct), UC `Login with valid credentials` (COMPLETE), Screen + API (derived via Function), TC `TC-LOGIN-001` PASSED.

Expect: `coverageStatus=COMPLETE`, `gapCodes=[]`.

**REQ-AUTH-002** — Functional

Links: Function `User Login`, API only (derived), no UC, no TC.

Expect: `PARTIAL`, `gapCodes=["MISSING_USE_CASE","MISSING_TEST"]`, coverage path UC+TEST = MISSING, Implementation = OK with `relationKind=DERIVED`.
