# Bulk Job Item Failures — BE API Requirements

> **Status:** Implemented on BE (2026-08-01) — verified against live OpenAPI `BulkJobFailure` / `BulkJobResponse.failures`  
> **Date:** 2026-08-01  
> **Owner:** FE (Scopery) → handoff to BE  
> **Applies to:** All async `POST …/bulk` jobs polled via `GET /api/bulk-jobs/{id}`  
> **Related:** `spr-scopery-be/src/docs/api/BULK_CREATE_FE_GUIDE.md`, [`FE_ASYNC_BULK_CREATE.md`](./FE_ASYNC_BULK_CREATE.md)

---

## 1. Problem

Today `BulkJobResponse` only returns aggregate counts:

```text
succeededItems / failedItems / resultSummary / errorMessage
```

FE can show “47 created, 3 failed” but **cannot**:

1. List which items failed  
2. Show why each failed  
3. Let the user **copy only the failed items** (JSON) → send to a 3rd-party agent to fix → paste back into JSON Import → re-submit as a **new** bulk job

Worker already catches per-item exceptions (`AbstractBulkCreateJobHandler`) but only logs them — nothing is persisted or returned to FE.

---

## 2. Product UX (what FE will build after BE ships)

```text
PARTIAL / FAILED
  ├── Progress: N succeeded · M failed · remaining
  ├── Failure table
  │     index | identity (key/code) | errorCode | message
  ├── Actions
  │     [Copy failed items JSON]  ← only failed payloads, ready for agent / re-import
  │     [Copy failures report]    ← human-readable index + reason (optional)
  │     [Retry failed batch]      ← POST …/bulk with copied items (new jobId)
  └── Note: succeeded items stay saved; do not roll back
```

**Agent loop (intended):**

1. User imports JSON (or bulk grid)  
2. Job ends `PARTIAL` / `FAILED`  
3. User clicks **Copy failed items JSON** → clipboard = `{ "items": [ …only failed… ] }`  
4. User pastes into ChatGPT / Cursor / etc. → “fix these create errors”  
5. Agent returns fixed JSON → user pastes into JSON Import → Import again  

---

## 3. Contract change — extend `BulkJobResponse`

### 3.1 Backward compatible

Keep all existing fields. **Add** `failures` (and optionally `failedItemsPayload` as convenience — see §3.3).

Swagger / OpenAPI must update schema `BulkJobResponse`.

### 3.2 New fields

```ts
interface BulkJobFailureItem {
  /** 0-based index in the original request `items` array. Required. */
  index: number

  /**
   * Best-effort business identity for UI (key/code/title).
   * Prefer domain natural key when present:
   * - Use Case → key
   * - Requirement → code (or title if code null)
   * - Functional / NFR / Phase / Catalog → code
   * - Test Case → code (or title)
   * Null if not extractable.
   */
  identity: string | null

  /**
   * Stable machine code when available, e.g.
   * DUPLICATE_KEY | VALIDATION | NOT_FOUND | CONFLICT | UNKNOWN
   */
  errorCode: string | null

  /** Human-readable reason (exception message / business detail). Max ~500 chars. */
  message: string

  /**
   * Original item object from the submitted payload (same shape as create body).
   * REQUIRED for FE “Copy failed items JSON” / agent fix loop.
   * Must be JSON-serializable and re-submittable to the same POST …/bulk endpoint.
   */
  item: object
}

interface BulkJobResponse {
  id: string // uuid
  jobType: string
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'PARTIAL' | 'FAILED'
  totalItems: number
  succeededItems: number
  failedItems: number
  resultSummary: string | null
  errorMessage: string | null
  createdAt: string // date-time
  updatedAt: string // date-time

  /**
   * Per-item failures. Empty array when succeededItems path with no failures.
   * Populated incrementally while RUNNING (optional but preferred) and
   * complete when status is PARTIAL or FAILED (item-level path).
   * System-level FAILED (payload parse / no handler) → failures = [] and errorMessage set.
   */
  failures: BulkJobFailureItem[]
}
```

### 3.3 Optional convenience (nice-to-have, not required if `failures[].item` exists)

```ts
/** Same as failures.map(f => f.item) — FE can derive this client-side. */
failedItemsPayload?: object[]
```

Prefer **not** duplicating unless BE wants a dedicated export endpoint (see §5).

---

## 4. Persistence & worker behavior

### 4.1 Storage

Persist failures with the job (recommended: JSON column on `app_bulk_job`, e.g. `failures_json text`).

| Constraint | Rule |
|------------|------|
| Max items | Same as bulk max (500) |
| Max message length | Truncate to 500 chars per failure |
| Max identity length | Truncate to 200 chars |
| Payload size | Cap total `failures_json` size (e.g. 2 MB); if exceeded, keep first N failures + set `resultSummary` note that list is truncated |

### 4.2 Worker (`AbstractBulkCreateJobHandler`)

On each item failure, append:

```text
{ index, identity, errorCode, message, item }
```

Then `updateProgress(jobId, succeeded, failed)` **and** persist the growing failures list (or flush at end — live list during RUNNING is preferred for FE progress UX).

Map exceptions:

| Exception / situation | `errorCode` | `message` |
|-----------------------|-------------|-----------|
| Duplicate key / unique constraint / 409 | `DUPLICATE_KEY` | Existing detail or “Key already exists” |
| Bean validation / 400 / 422 | `VALIDATION` | Field-level detail if available |
| Referenced entity missing | `NOT_FOUND` | e.g. “primaryFunctionId not found” |
| AuthZ | `FORBIDDEN` | Short reason |
| Other | `UNKNOWN` | `e.getMessage()` truncated |

`identity` extraction: handler-specific helper (or shared interface `BulkItemIdentity.extract(item)`). If unknown → `null` (FE still shows `index` + `item`).

### 4.3 Terminal status rules (unchanged)

| Condition | Status |
|-----------|--------|
| `failed == 0` | `SUCCEEDED` — `failures: []` |
| `succeeded > 0 && failed > 0` | `PARTIAL` — `failures.length == failedItems` |
| `succeeded == 0 && failed > 0` (all items) | `FAILED` — `failures` populated |
| System error before/during parse | `FAILED` — `failures: []`, `errorMessage` set |

Invariant: when item-level processing finished with failures,

```text
failures.length === failedItems
```

(unless truncated — then `failures.length <= failedItems` and `resultSummary` must say truncated).

### 4.4 Security

- `GET /api/bulk-jobs/{id}` already auth-gated — keep it.  
- Do **not** expose other users’ jobs.  
- `item` may contain PII-ish fields user themselves submitted — OK to return to same actor.  
- Do **not** put secrets in failure messages.

---

## 5. API surface

### 5.1 Primary (required)

`GET /api/bulk-jobs/{id}` → `ApiResponse<BulkJobResponse>` including `failures`.

No new endpoint required for MVP.

### 5.2 Optional export (nice-to-have)

```http
GET /api/bulk-jobs/{id}/failed-items
```

Response:

```json
{
  "success": true,
  "data": {
    "jobId": "...",
    "jobType": "BULK_CREATE_USE_CASE",
    "items": [ /* only failed item bodies */ ]
  }
}
```

Shape of `items` **must** match the original bulk create request body items so FE/agent can wrap as `{ "items": [...] }` and POST to the same `…/bulk` URL.

Skip this endpoint if `failures[].item` is always present — FE builds the clipboard payload client-side.

---

## 6. Example responses

### 6.1 RUNNING (live)

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "jobType": "BULK_CREATE_USE_CASE",
  "status": "RUNNING",
  "totalItems": 100,
  "succeededItems": 37,
  "failedItems": 2,
  "resultSummary": null,
  "errorMessage": null,
  "failures": [
    {
      "index": 4,
      "identity": "UC-LOGIN-01",
      "errorCode": "DUPLICATE_KEY",
      "message": "Use case key already exists in this project",
      "item": {
        "key": "UC-LOGIN-01",
        "name": "User logs in",
        "primaryActorName": "End User"
      }
    },
    {
      "index": 18,
      "identity": "UC-BAD",
      "errorCode": "VALIDATION",
      "message": "name must not be blank",
      "item": {
        "key": "UC-BAD",
        "name": ""
      }
    }
  ],
  "createdAt": "2026-08-01T10:00:00Z",
  "updatedAt": "2026-08-01T10:00:12Z"
}
```

### 6.2 PARTIAL (terminal)

```json
{
  "status": "PARTIAL",
  "totalItems": 50,
  "succeededItems": 47,
  "failedItems": 3,
  "resultSummary": "47 created, 3 failed",
  "errorMessage": null,
  "failures": [
    {
      "index": 12,
      "identity": "UC-X",
      "errorCode": "DUPLICATE_KEY",
      "message": "Use case key already exists in this project",
      "item": { "key": "UC-X", "name": "…" }
    }
  ]
}
```

### 6.3 Clipboard payload FE will build (no BE change)

```json
{
  "items": [
    { "key": "UC-X", "name": "…" },
    { "key": "UC-Y", "name": "…" }
  ]
}
```

User/agent fixes → paste into JSON Import → `POST …/bulk` → **new** `jobId` (never reuse).

---

## 7. OpenAPI / Swagger checklist

- [ ] Add schema `BulkJobFailureItem`  
- [ ] Add `failures` array to `BulkJobResponse`  
- [ ] Document truncation behavior in description  
- [ ] Confirm `CreateUseCaseRequest` (and other create bodies) remain the shape of `failures[].item`  
- [ ] Update `BULK_CREATE_FE_GUIDE.md` Step 3 with failure list + copy/retry guidance  

---

## 8. FE acceptance (after BE)

| # | Check |
|---|--------|
| 1 | Poll while `RUNNING` can show growing failure rows (if BE streams them) |
| 2 | On `PARTIAL` / `FAILED`, modal stays open with failure table |
| 3 | Each row shows identity (or `#index`), errorCode, message |
| 4 | **Copy failed items JSON** copies `{ items: failures.map(f => f.item) }` only |
| 5 | Copied JSON validates in existing JSON Import client validators |
| 6 | Re-import creates a **new** job; previously succeeded rows are not deleted |
| 7 | System-level `FAILED` with empty `failures` still shows `errorMessage` |

---

## 9. Out of scope

- Server-side “retry failed only” endpoint (FE re-POSTs copied items)  
- Auto-fix / AI fix on BE  
- Row-level success list (only failures required)  
- Changing sync `/batch` Test Case API  

---

## 10. Priority

| Priority | Scope |
|----------|--------|
| **P0** | Persist + return `failures[]` with `index`, `message`, `item` on terminal `PARTIAL`/`FAILED` |
| **P1** | `identity`, `errorCode`, live `failures` during `RUNNING` |
| **P2** | Optional `GET …/failed-items` export endpoint |

**FE blocked on P0** for the agent copy/fix loop. Counts-only UX remains until then.
