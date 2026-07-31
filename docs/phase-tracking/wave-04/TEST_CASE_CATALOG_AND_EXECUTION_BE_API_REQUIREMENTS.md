# Test Case Catalog and Test Execution — Backend API Requirements

> Scope: APIs required for the spreadsheet-style **Quality → Test Cases** catalog and
> **Quality → Test Runs** execution workspace.
>
> Requirement-level test insight remains in **Requirement Traceability → Test Coverage**.
>
> **Deployment status (2026-07-30):** V176/V177/V178 and the Test Case, Test Step,
> Traceability, and Test Run Result APIs are deployed. Contract verification below is based
> on live OpenAPI at `http://localhost:8080/v3/api-docs`.

## 1. Domain boundaries

The product has three separate concerns:

1. **Test Case lifecycle** — authoring and maintaining reusable Test Case definitions.
2. **Test execution** — recording results inside a Test Run.
3. **Requirement test coverage** — aggregated Requirement-level insight.

The backend must not use one status field for all three.

### 1.1 Test Case lifecycle status

```text
DRAFT
READY
DEPRECATED
ARCHIVED
```

`PASSED`, `FAILED`, `BLOCKED`, `NOT_RUN`, and `SKIPPED` are invalid Test Case lifecycle
statuses.

### 1.2 Execution result

```text
NOT_RUN
PASSED
FAILED
BLOCKED
SKIPPED
```

An execution result belongs to a Test Case Result within a Test Run. `latestResult` is a
read-only aggregate, not an editable Test Case field.

### 1.3 Automation status

```text
MANUAL
PLANNED
AUTOMATED
```

## 2. Live implementation

### 2.1 Confirmed deployed

- Test Case partial update with optimistic locking.
- Test Case batch update and bulk create.
- Server-side Test Case search, filter, sort, and page-based pagination.
- `assigneeId` and `automationStatus`.
- Test Case detail with aggregate counts and Steps.
- Test Step CRUD, reorder, duplicate, archive, and batch create.
- Test Case Requirement and Use Case full-replace links.
- Test Case traceability detail.
- Test Run progress counts.
- Paged Test Run Result list.
- Single and batch Test Run Result updates with optimistic locking.
- Test Case list assignee metadata and `hasOpenDefect` filtering.
- Test Run Result nested Test Case summaries plus `assigneeId` and `hasDefect` filters.
- Test Run release package and deployment environment display metadata.
- Derived Screen, API, and Component traceability arrays.
- Concrete OpenAPI allowable values for enum string request fields.

## 3. Test Case Catalog

### 3.1 List Test Cases

```http
GET /api/projects/{projectId}/test-cases
    ?q=
    &type=
    &priority=
    &status=
    &assigneeId=
    &automationStatus=
    &requirementId=
    &useCaseId=
    &latestResult=
    &hasOpenDefect=
    &sort=updatedAt,desc
    &page=0
    &size=50
```

Response:

```json
{
  "items": [
    {
      "id": "tc-id",
      "projectId": "project-id",
      "code": "TC-001",
      "title": "Login with valid credentials",
      "description": null,
      "type": "FUNCTIONAL",
      "priority": "HIGH",
      "status": "READY",
      "assigneeId": "user-id",
      "assignee": {
        "id": "user-id",
        "displayName": "Jane Doe"
      },
      "automationStatus": "MANUAL",
      "stepCount": 3,
      "requirementCount": 1,
      "useCaseCount": 1,
      "latestResult": "FAILED",
      "latestResultAt": "2026-07-30T03:00:00Z",
      "openDefectCount": 1,
      "createdAt": "2026-07-01T03:00:00Z",
      "updatedAt": "2026-07-30T03:00:00Z",
      "version": 7
    }
  ],
  "page": 0,
  "size": 50,
  "totalElements": 143,
  "totalPages": 3,
  "first": true,
  "last": false
}
```

List rows include the required numeric aggregates and assignee display metadata. The list supports
`hasOpenDefect=true|false` without FE-side filtering or N+1 requests.

### 3.2 Quick draft creation

```http
POST /api/projects/{projectId}/test-cases
```

Minimum body:

```json
{
  "title": "Login with valid credentials"
}
```

Defaults:

```text
status = DRAFT
priority = MEDIUM
type = FUNCTIONAL
automationStatus = MANUAL
```

The response returns the complete Test Case row.

### 3.3 Test Case detail

```http
GET /api/projects/{projectId}/test-cases/{testCaseId}
```

The response includes Overview fields, Preconditions, Steps, traceability links, latest
execution summary, open Defects, and `version`.

### 3.4 Partial update

```http
PATCH /api/projects/{projectId}/test-cases/{testCaseId}
```

Example:

```json
{
  "title": "Login with valid credentials",
  "type": "FUNCTIONAL",
  "priority": "HIGH",
  "status": "READY",
  "assigneeId": "user-id",
  "automationStatus": "PLANNED",
  "version": 7
}
```

Rules:

- Omitted fields remain unchanged.
- Return the full updated row.
- Reject execution result fields.
- Return `409` with the latest representation when `version` is stale.
- Validate lifecycle transitions.

### 3.5 Batch update

```http
PATCH /api/projects/{projectId}/test-cases/batch
```

```json
{
  "testCaseIds": ["tc-1", "tc-2"],
  "changes": {
    "priority": "HIGH",
    "status": "READY",
    "assigneeId": "user-id"
  }
}
```

Response:

```json
{
  "updated": ["tc-1", "tc-2"],
  "failed": []
}
```

Batch actions required:

- Change status.
- Change priority.
- Assign user.
- Set automation status.
- Archive.
- Add to Test Run.

### 3.6 Bulk create from pasted rows

```http
POST /api/projects/{projectId}/test-cases/batch
```

```json
{
  "items": [
    {
      "title": "Valid login",
      "type": "FUNCTIONAL",
      "priority": "HIGH",
      "automationStatus": "MANUAL"
    },
    {
      "title": "Invalid password",
      "type": "FUNCTIONAL",
      "priority": "HIGH",
      "automationStatus": "PLANNED"
    }
  ]
}
```

The deployed create-item schema does not accept lifecycle `status`. FE creates rows with the
default `DRAFT` status, then uses the batch-update endpoint for pasted rows requesting another
status. The response preserves input order and reports validation errors by row index.

## 4. Test Steps

Base:

```http
/api/projects/{projectId}/test-cases/{testCaseId}/steps
```

Required operations:

```http
GET    .../steps
POST   .../steps
GET    .../steps/{stepId}
PATCH  .../steps/{stepId}
PATCH  .../steps/reorder
POST   .../steps/batch
POST   .../steps/{stepId}/duplicate
PATCH  .../steps/{stepId}/archive
```

Step shape:

```json
{
  "id": "step-id",
  "sortOrder": 1,
  "action": "Open Login Screen",
  "expectedResult": "Login Screen is displayed",
  "screenId": null,
  "componentId": null,
  "archivedAt": null,
  "version": 2
}
```

Reorder uses `{ "orderedStepIds": ["step-1", "step-2"] }`. Batch paste accepts
`action`, `expectedResult`, `screenId`, and `componentId`, then returns `created` and
row-indexed `errors`.

## 5. Traceability

### 5.1 Test Case traceability detail

```http
GET /api/projects/{projectId}/test-cases/{testCaseId}/traceability
```

The deployed response returns directly linked `requirements`, directly linked `useCases`,
`derivedFunctions`, `derivedScreens`, `derivedApis`, and `derivedComponents`. Every item uses:

```json
{
  "id": "object-id",
  "objectType": "REQUIREMENT",
  "code": "REQ-001",
  "name": "User can log in",
  "derived": false
}
```

Derived relationships are read-only. Screen, API, and Component arrays are currently empty until
their relation data sources are available.

### 5.2 Link Requirements and Use Cases

Use existing relation conventions or expose:

```http
PUT /api/projects/{projectId}/test-cases/{testCaseId}/requirement-links
PUT /api/projects/{projectId}/test-cases/{testCaseId}/use-case-links
```

Bodies contain the complete desired id set. Mutations return the updated traceability summary.

## 6. Test Runs

### 6.1 List Test Runs

```http
GET /api/projects/{projectId}/test-runs
    ?q=
    &status=
    &page=0
    &size=50
```

Each row returns:

```json
{
  "id": "run-id",
  "name": "Regression 2026.07",
  "runType": "REGRESSION",
  "status": "IN_PROGRESS",
  "total": 100,
  "executed": 72,
  "passed": 60,
  "failed": 8,
  "blocked": 4,
  "skipped": 0,
  "releasePackageName": "Release 2026.07",
  "deploymentEnvironmentName": "Staging",
  "startedAt": "2026-07-30T01:00:00Z",
  "completedAt": null
}
```

### 6.2 Test Run Results

```http
GET /api/projects/{projectId}/test-runs/{testRunId}/results
    ?q=
    &result=
    &assigneeId=
    &hasDefect=
    &page=0
    &size=100
```

Result shape:

```json
{
  "id": "result-id",
  "testRunId": "run-id",
  "testCaseId": "tc-id",
  "testCase": {
    "id": "tc-id",
    "code": "TC-001",
    "title": "Login with valid credentials"
  },
  "assigneeId": null,
  "resultStatus": "NOT_RUN",
  "comment": null,
  "defectId": null,
  "executedAt": null,
  "version": 1
}
```

### 6.3 Update execution result

```http
PATCH /api/projects/{projectId}/test-runs/{testRunId}/results/{resultId}
```

```json
{
  "result": "FAILED",
  "comment": "Error message incorrect",
  "version": 1
}
```

This is the only place where users directly set `PASSED`, `FAILED`, `BLOCKED`, or `SKIPPED`.

### 6.4 Batch execution update

```http
PATCH /api/projects/{projectId}/test-runs/{testRunId}/results/batch
```

```json
{
  "resultIds": ["result-1", "result-2"],
  "changes": {
    "result": "PASSED",
    "assigneeId": "user-id"
  }
}
```

Required bulk actions:

- Mark Passed / Failed / Blocked / Skipped.
- Assign tester.
- Retest.
- Create or link Defect for failed results.

## 7. Requirement Test Coverage

The existing Requirement coverage matrix remains read-only aggregate data.

Required row fields:

```json
{
  "requirementId": "req-id",
  "code": "REQ-001",
  "title": "User Login",
  "priority": "HIGH",
  "testCaseCount": 3,
  "latestResult": "FAILED",
  "latestResultAt": "2026-07-30T03:00:00Z",
  "openDefectCount": 1,
  "coverageStatus": "PARTIAL"
}
```

Coverage statuses:

```text
COVERED
PARTIAL
MISSING_TESTS
NOT_EVALUATED
```

Execution results remain separate.

## 8. Integrity and audit requirements

- Every lifecycle, assignment, step, traceability, and execution mutation writes audit history.
- Archived Test Cases cannot be added to new Test Runs.
- Deprecated Test Cases remain visible in historical runs.
- Completing a Test Run freezes execution timestamps but does not overwrite Test Case status.
- `latestResult` is recalculated from the latest applicable execution, never manually patched.
- Defects linked to a result must belong to the same project.
- All list APIs enforce project scope and permissions.

## 9. Acceptance criteria

Confirmed from live OpenAPI:

1. Test Case lifecycle status and execution result are separate fields.
2. Test Case list supports server-side query, implemented filters, sort, and pagination.
3. Quick draft creation accepts title only.
4. Single Test Case and Test Run Result updates accept optimistic-lock versions.
5. Batch update and batch create return per-item failures.
6. Test Steps support add, edit, reorder, duplicate, archive, and batch paste.
7. Test Case detail returns execution aggregates and Steps without N+1 requests.
8. Test Run list returns progress/result counts.
9. Test Run Results support single and bulk result updates.
10. Requirement and Use Case links use full-replace mutations.
11. Test Case rows include assignee display metadata and open-defect filtering.
12. Test Run Results include Test Case summaries and assignee/defect filtering.
13. Test Runs include Release package and deployment environment names.
14. Traceability includes derived Screen/API/Component arrays.
15. OpenAPI declares allowable values for enum string request fields.
