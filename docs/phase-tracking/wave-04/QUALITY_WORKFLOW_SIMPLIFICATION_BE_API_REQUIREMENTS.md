# Quality Workflow Simplification — BE API Requirements

Status: **FE phased rollout with compatibility adapters**. Do not invent server aggregates on the client.

## Goal

Support the simplified Quality IA:

- Overview
- Cases (Functional | NFR tabs — separate BE entities)
- Runs (planning + execution, direct mixed membership)
- Defects (work queue)
- Releases (computed readiness / gates)

Hide Quality Plan / Test Plan / Test Suite from primary UX without deleting persistence in v1.

---

## Required contracts

### 1. Overview + Settings

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/projects/{projectId}/quality/overview` | Server-computed metrics, ≤5 Needs Attention actions with `targetRoute` + `filterParams`, recent runs, current release |
| GET | `/projects/{projectId}/quality-settings` | Coverage / NFR / defect threshold / release gate config |
| PATCH | `/projects/{projectId}/quality-settings` | Partial update |

Until available: FE maps latest Quality Plan → settings defaults and builds a **compat** overview from existing list endpoints (counts only; no fabricated attention items).

### 2. Cases (enriched catalogs)

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | existing test-case list | Enrich: useCase code/title, derived function/requirements, `latestResult` |
| GET | existing verification-case list | Enrich: NFR code/title, attribute, threshold, environment, `latestResult` |
| POST | verification-cases batch create | Parity with test-case batch |
| PATCH | verification-cases batch update | Parity with test-case batch |

### 3. Runs — lifecycle + membership

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | test-runs | Accept owner, release, environment, dates, scope, optional direct `caseIds[]` |
| PATCH | test-runs/{id} | Metadata + DRAFT/PLANNED status |
| POST | `.../plan`, `.../start`, `.../complete`, `.../cancel`, `.../reopen` | Lifecycle |
| GET | `.../completion-validation` | Counts + policy violations |
| POST | complete with `{ force, reason }` | Guarded complete-anyway |
| GET/PUT | `.../membership` | Direct mixed `{ caseKind, caseId }[]` — **no Suite required** |
| POST | `.../membership/copy` | `{ sourceRunId, replaceExisting? }` |

Until membership exists: Runs remain plan/suite-backed; FE hides add/remove/copy-from-run.

### 4. Defects

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | defects | Filters: status, severity, assignee, release, sourceRun, age |
| GET | defects/{id} | Source run/result/case, expected/actual, evidence |
| POST | status actions | start / resolve / retest / close / reject / reopen |

### 5. Releases

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | releases/{id}/readiness | Computed `AT_RISK` / `BLOCKED` / `READY`, gate list, decision history |
| POST | recalculate | Automatic gate recompute |
| POST | mark-ready | Blocked when gates fail |
| POST | override-readiness | Requires reason + approver; writes audit history |

---

## Migration expectations (BE)

1. Test Plans → Runs in `DRAFT` or `PLANNED`
2. Suite membership → direct Run membership; suite name → `sourceGroupName`
3. Existing Test Runs remain Runs
4. Quality Plan content → project Quality Settings

## FE compatibility

- Retain legacy plan/suite transport types as deprecated
- Mappers tolerate missing enriched fields
- Feature flag: `FEATURES.qualitySimplifiedWorkflow`

## Explicit non-goals for FE

- N+1 client aggregation presented as Overview truth
- Creating hidden Test Plans/Suites to fake direct membership
- Merging TestCase and VerificationCase into one BE entity
