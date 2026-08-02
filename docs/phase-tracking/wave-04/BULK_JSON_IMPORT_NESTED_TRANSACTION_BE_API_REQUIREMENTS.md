# Bulk / JSON Import — Nested Properties + Transaction + Failures (BE Ticket)

> **Status:** OPEN — FE handoff to BE  
> **Date:** 2026-08-01  
> **Priority:** P0 (blocks correct JSON Import / Bulk create; FE must not loop nested creates — rate-limit / consistency)  
> **Owner:** FE (Scopery) → BE  
> **Related:**  
> - [`BULK_JOB_ITEM_FAILURES_BE_API_REQUIREMENTS.md`](./BULK_JOB_ITEM_FAILURES_BE_API_REQUIREMENTS.md)  
> - [`FUNCTIONAL_ITEM_NESTED_BUSINESS_RULES_BE_API_REQUIREMENTS.md`](./FUNCTIONAL_ITEM_NESTED_BUSINESS_RULES_BE_API_REQUIREMENTS.md)  
> - [`FE_ASYNC_BULK_CREATE.md`](./FE_ASYNC_BULK_CREATE.md)  
> - BE `BULK_CREATE_FE_GUIDE.md`

---

## 0. One-line ask

**For every Import / Bulk create path:** BE must create the **shell + all related nested properties** in **one server-side transaction per item**. FE sends **one** `POST …/bulk` (or one nested-import call). On failure, return structured per-item failures (existing `BulkJobFailure` contract). FE must **not** call N create APIs after the job.

---

## 1. Problem (product + FE)

### 1.1 What users paste

JSON Import / bulk payloads often include **children** on the same item, e.g.:

| Parent | Nested fields users expect to be created together |
|--------|-----------------------------------------------------|
| **Use Case** | `flows[]` (+ `flows[].steps[]`), `conditions[]`, `businessRules[]`, `acceptanceCriteria[]`, optional `supportingFunctionIds[]` / supporting functions |
| **Functional Item (FR)** | `acceptanceCriteria[]`, `businessRules[]` |
| **Test Case** | `steps[]` (`action`, `expectedResult`, …) |
| Requirement / Phase / Module / Screen / API / Component / Data Entity / NFR | Shell only today — no nested on create (unless BE later adds) |

### 1.2 What must not happen

```text
FE: POST …/bulk  → shells only
FE: then for each created id → POST flow, POST step, POST condition, …  ← FORBIDDEN
```

That FE loop:

- Burns client rate limit (shared proxy IP)
- Leaves **partial** parents if mid-loop fails
- Makes import UX hang / 429

### 1.3 Observed gap

Product expectation: **BE tự xử lý** nested trên create/bulk.

Current gap to **verify / finish on BE** (FE already sends nested in bulk payload where applicable):

| Area | FE sends nested in bulk? | BE must confirm |
|------|--------------------------|-----------------|
| Use Case `POST …/use-cases/bulk` | Yes (`flows`, `conditions`, `businessRules`, `acceptanceCriteria`) | Persist nested in worker; **transaction per item**; failures in `failures[]` |
| Use Case detail nested import | Yes → `POST …/use-cases/{id}/nested-import` | Same nested apply + transaction |
| FR `POST …/functional-items/bulk` | Yes (`acceptanceCriteria`, `businessRules`) | Already documented as shipped — **re-verify** under this ticket |
| Test Case `POST …/test-cases/bulk` | Yes (`steps[]`) | Persist steps in worker; transaction per item |
| Shell-only entities | N/A | No nested; still return `failures[]` on item fail |

---

## 2. Scope — all Import / Bulk create surfaces

### 2.1 Async bulk (JSON Import + Bulk add grid + Excel → bulk)

| Job / endpoint | Nested required? |
|----------------|------------------|
| `POST /api/projects/{projectId}/use-cases/bulk` | **Yes** — UC nested |
| `POST /api/projects/{projectId}/functional-items/bulk` | **Yes** — FR nested |
| `POST /api/projects/{projectId}/test-cases/bulk` | **Yes** — TC steps |
| `POST /api/projects/{projectId}/requirements/bulk` | Shell only |
| `POST /api/projects/{projectId}/phases/bulk` | Shell only |
| `POST /api/projects/{projectId}/non-functional-items/bulk` | Shell only |
| `POST /api/workspaces/{ws}/applications/{app}/modules/bulk` | Shell only |
| `…/screens/bulk` | Shell only |
| `…/api-endpoints/bulk` | Shell only |
| `…/components/bulk` | Shell only |
| `…/data-entities/bulk` | Shell only |

### 2.2 Sync create (same nested rules when body includes nested)

| Endpoint | Nested |
|----------|--------|
| `POST …/use-cases` | Same as bulk item |
| `POST …/functional-items` | Same as bulk item |
| `POST …/test-cases` | Same as bulk item (`steps[]`) |

### 2.3 Existing-entity nested import (Use Case detail)

| Endpoint | Behavior |
|----------|----------|
| `POST /api/projects/{projectId}/use-cases/{useCaseId}/nested-import` | Apply nested onto **existing** UC in **one transaction**. Return `{ useCaseId, createdParts }` or problem+json. On any nested failure → **rollback entire import** (no half-applied flows). |

---

## 3. Contract — nested field shapes (canonical)

### 3.1 Use Case (create / bulk item)

```ts
interface CreateUseCaseItem {
  // shell
  key: string
  name: string
  goal?: string | null
  primaryActorName?: string | null
  triggerText?: string | null
  primaryFunctionId?: string | null

  // nested (optional)
  flows?: Array<{
    flowType: string // MAIN | ALTERNATIVE | EXCEPTION
    name?: string | null
    conditionText?: string | null
    steps?: Array<{
      stepType: string
      contentJson?: string | null
      content?: string | null // alias → treat as contentJson if contentJson omitted
      displayOrder?: number
    }>
  }>
  conditions?: Array<{
    conditionType: string
    content: string
    displayOrder?: number
  }>
  businessRules?: Array<{
    ruleCode: string
    description: string
    displayOrder?: number
  }>
  acceptanceCriteria?: Array<{
    title: string
    givenText?: string | null
    whenText?: string | null
    thenText?: string | null
    displayOrder?: number
  }>
}
```

**Business rules on BE:**

- At most **one** `MAIN` flow per use case (existing rule).
- Nested create order: flows (+ steps) → conditions → businessRules → acceptanceCriteria → supporting functions (if accepted).
- Unknown nested keys: ignore or 422 — pick one and document; prefer **422 VALIDATION** for unknown nested keys on import.

### 3.2 Functional Item (create / bulk item)

```ts
interface CreateFunctionalItemItem {
  code: string
  title: string
  priority: string
  type?: string
  description?: string | null
  acceptanceCriteria?: string[] | null
  businessRules?: Array<{
    code: string
    title: string
    severity: string
    description?: string | null
  }> | null
  workspaceId?: string // if required by current contract
}
```

Max nested BRs per FR: **50** (existing).

### 3.3 Test Case (create / bulk item)

```ts
interface CreateTestCaseItem {
  title: string
  code?: string | null
  description?: string | null
  type?: string
  priority?: string
  automationStatus?: string
  preconditions?: string | null
  expectedResult?: string | null
  useCaseId?: string | null
  testSuiteId?: string | null
  // nested
  steps?: Array<{
    action: string
    expectedResult?: string | null
    screenId?: string | null
    componentId?: string | null
  }>
}
```

---

## 4. Transaction rules (mandatory)

### 4.1 Per bulk **item** = one atomic unit

For each item in a bulk job:

```text
BEGIN
  create shell
  create all nested for that shell
COMMIT
```

If **any** nested part fails (validation, unique key, FK, business rule):

```text
ROLLBACK that item entirely
→ item counts as FAILED
→ record BulkJobFailure { index, identity, errorCode, message, item }
→ continue next items (job-level PARTIAL allowed)
```

**Do not** leave orphan shells without their nested parts when the request included nested data.

### 4.2 Job-level semantics (unchanged)

| Outcome | Meaning |
|---------|---------|
| `SUCCEEDED` | All items committed (shell + nested) |
| `PARTIAL` | Some items committed fully; some rolled back — see `failures[]` |
| `FAILED` | No item succeeded / job aborted |

Succeeded items **stay**; do not roll back the whole job because one item failed.

### 4.3 Nested-import on existing Use Case

Entire nested payload is **one transaction**. Any failure → full rollback of that request (no partial flows/steps left).

---

## 5. Failure response (mandatory)

Reuse [`BULK_JOB_ITEM_FAILURES_BE_API_REQUIREMENTS.md`](./BULK_JOB_ITEM_FAILURES_BE_API_REQUIREMENTS.md):

```ts
interface BulkJobFailure {
  index: number              // 0-based in request items
  identity: string | null    // key / code / title
  errorCode: string | null   // DUPLICATE_KEY | VALIDATION | NOT_FOUND | …
  message: string            // human-readable, truncated ~500
  item: Record<string, unknown> // **full original item including nested** — re-submittable
}
```

**Requirements:**

1. Failure on nested (e.g. invalid `flowType`, duplicate MAIN, blank step `action`) still returns the **whole original item** in `item` (including nested), so FE can “Retry failed” / “Copy failed JSON”.
2. `message` must say **which nested field** failed when possible  
   e.g. `flows[0].steps[2].stepType: invalid enum`.
3. Sync create (`POST` without bulk): return standard problem+json; **no** partial shell.

---

## 6. Acceptance criteria (BE checklist)

### 6.1 Use Case bulk

- [ ] Item with shell only → creates UC  
- [ ] Item with `flows` + steps → UC + flows + steps persisted  
- [ ] Item with conditions / businessRules / acceptanceCriteria → all persisted  
- [ ] Nested validation failure → **no** UC row for that item; `failures[]` entry; other items continue  
- [ ] Duplicate `key` → `DUPLICATE_KEY`; nested not partially created  
- [ ] Two MAIN flows on same item → fail item atomically  

### 6.2 Functional Item bulk

- [ ] `businessRules[]` + `acceptanceCriteria[]` created with FR  
- [ ] Duplicate BR code on same FR → fail item / rollback FR (existing behavior)  
- [ ] Re-verify under load with JSON Import sample  

### 6.3 Test Case bulk

- [ ] `steps[]` created with TC in same item transaction  
- [ ] Invalid step → TC not left without intended steps (rollback item)  
- [ ] `failures[].item` includes `steps` for retry  

### 6.4 Shell-only bulks

- [ ] Still emit `failures[]` with original item payload  
- [ ] No FE follow-up creates required  

### 6.5 Nested-import endpoint (UC detail)

- [ ] `POST …/use-cases/{id}/nested-import` applies nested in one TX  
- [ ] Failure → 4xx/5xx + no partial nested rows  
- [ ] Documented in OpenAPI  

### 6.6 Docs / OpenAPI

- [ ] Update OpenAPI schemas for create + bulk item types with nested fields  
- [ ] Update `BULK_CREATE_FE_GUIDE.md` — “nested is BE responsibility; FE must not loop”  
- [ ] Note max sizes (items 500; nested BR 50; document max steps/flows if limited)  

---

## 7. Non-goals

- FE retry loops / paced nested creates after bulk  
- Changing rate-limit RPM as a substitute for nested-on-BE  
- Auto-linking Trace Links / Requirement↔UC links inside UC/FR/TC JSON import (still separate APIs unless product asks later)

---

## 8. FE stance (after BE ships)

FE will:

1. Validate JSON client-side  
2. Submit **one** `POST …/bulk` with nested fields in each item  
3. Close paste UI on 202; poll `GET /api/bulk-jobs/{id}`  
4. Show `failures[]` / retry failed items only  

FE will **not**:

- Call create-flow / add-step / add-condition / create-business-rule / batch-create-steps in a loop after bulk accept  

---

## 9. Suggested BE implementation notes

- Reuse domain actions inside the bulk worker **in the same transaction** as shell create (do not HTTP self-call).  
- Prefer one `Apply*NestedParts` helper per aggregate (UC / FR / TC).  
- Ensure bulk worker security context can authorize nested creates.  
- Add integration tests: happy path + nested validation fail + duplicate key + PARTIAL job with mixed items.

---

## 10. Ticket title (copy for tracker)

```text
[P0] Bulk/JSON Import: BE creates nested properties (UC flows/rules/criteria, FR rules, TC steps) in per-item transactions + return BulkJobFailure with full item
```

### Description (short)

FE imports send nested children in the same bulk item. BE must create shell + nested atomically per item, continue other items on failure, and return `failures[]` with re-submittable payloads. No FE post-bulk nested create loops.

---

## 11. Sign-off

| Role | Action |
|------|--------|
| BE | Implement / verify §6; update OpenAPI + bulk guide |
| FE | Keep single-payload import; wire failures UI (already partially done) |
| QA | E2E: JSON Import UC/FR/TC with nested; force one bad nested field → PARTIAL + retry |
