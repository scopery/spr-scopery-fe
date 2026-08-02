# FE Async Bulk Create Pattern

> Aligns with BE guide: `spr-scopery-be/src/docs/api/BULK_CREATE_FE_GUIDE.md`  
> Wave: Submit → Poll → Display. No long-blocking requests.

## Pattern

```
UI → POST .../bulk → 202 + jobId
   → poll GET /api/bulk-jobs/{jobId} every 2.5s (max 10 min)
   → SUCCEEDED | PARTIAL | FAILED → toast + refresh
```

Shared infrastructure:

| Piece | Path |
|-------|------|
| Poller + helpers | `shared/lib/bulkJobs.ts` |
| React hook | `shared/lib/useBulkJobPoller.ts` |
| Progress UI | `shared/ui/molecules/BulkJobProgressPanel` |

Rules:

- API `submit*Bulk` returns `BulkJobResponse` only — do **not** auto-poll in the API layer.
- Client rejects `> 500` items before POST (`BULK_MAX_ITEMS` / `assertBulkItemCount`).
- Retry always creates a **new** job (never reuse `jobId`).
- Persist `jobId` in component state for the session only (resume poll on network blip).
- **Non-blocking UX (all bulk UIs):** after `202 Accepted`, clear submit spinner immediately, toast “Job accepted”, seed poller with the job body, and show `BulkJobProgressPanel` while polling. Do **not** keep the primary button in `loading` for the whole poll. Poll `GET /bulk-jobs/{id}` with `{ skipGlobalLoading: true }`.

Terminal UX:

| Status | UI |
|--------|----|
| `SUCCEEDED` | Success toast + refetch + close modal when appropriate |
| `PARTIAL` | Warning with counts + refetch (succeeded rows already saved) |
| `FAILED` | Error + Retry (new submit) |

## Wired endpoints (wave 1)

| Entity | Submit | UI |
|--------|--------|----|
| Requirement | `POST /projects/{id}/requirements/bulk` | `RequirementBulkAddModal` |
| Functional Item | `POST /projects/{id}/functional-items/bulk` | `FunctionalCatalogBulkAddModal` (FR) |
| Non-Functional Item | `POST /projects/{id}/non-functional-items/bulk` | `FunctionalCatalogBulkAddModal` (NFR) |
| Use Case | `POST /projects/{id}/use-cases/bulk` | `UseCaseBulkAddModal` |
| App Module / Screen / API / Component / Data Entity | `POST /workspaces/{ws}/applications/{app}/…/bulk` | `CatalogBulkAddModal` |
| Project Phase | `POST /projects/{id}/phases/bulk` | `PhaseBulkAddModal` |
| Test Case | `POST /projects/{id}/test-cases/bulk` | `QualityBulkAddModal` (TEST_CASE); CaseImport + catalog paste when `≥ 50` |

Test Case small batches (`< 50`) keep sync `POST .../test-cases/batch`.

## API stubs only (no bulk UI yet)

- `POST /projects/{id}/tasks/bulk` — `submitTasksBulk`
- `POST /projects/{id}/wbs-nodes/bulk` — `submitWbsNodesBulk`

## Out of scope (wave 1)

- Tasks / WBS bulk modals
- Document-links / evidence / structure-relation bulk job migration
- ~~Row-level failed-item IDs~~ → **shipped:** [`BULK_JOB_ITEM_FAILURES_BE_API_REQUIREMENTS.md`](./BULK_JOB_ITEM_FAILURES_BE_API_REQUIREMENTS.md) (`failures[]` on `BulkJobResponse`; FE panel shows table + copy failed JSON + retry failed only)
