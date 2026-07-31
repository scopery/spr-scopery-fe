# BE Ticket: Defect source linkage (Run + Test Case / NFR)

**Status:** Done (Migration V188 deployed)  
**Priority:** High  
**Area:** Quality / Defects  
**Related FE:** Create defect from Runs + Defects Source column / drawer (this FE)

---

## Shipped (BE)

Migration V188 — nullable columns on `quality_defect`:

- `source_verification_result_id`
- `source_test_run_id`
- `source_test_case_id`
- `source_verification_case_id`

### Create

`POST /api/projects/{projectId}/defects` accepts:

- `sourceTestCaseResultId` (functional)
- `sourceVerificationResultId` (NFR)

BE validates the result belongs to the project, resolves run + case ids server-side, persists them, and back-links `defectId` on the source result.

### Read

`GET .../defects` and `GET .../defects/{defectId}` return nested `source`:

```json
{
  "kind": "FUNCTIONAL_RESULT",
  "testRunId": "<uuid>",
  "testRunName": "...",
  "resultId": "<uuid>",
  "resultStatus": "FAILED",
  "caseKind": "FUNCTIONAL",
  "caseId": "<uuid>",
  "caseCode": "TC-001",
  "caseTitle": "...",
  "resultComment": "..."
}
```

`source: null` when manually created. Lifecycle action responses may omit enrichment (`source: null`) — use GET for UI.

---

## FE (done after V188)

- [x] Types: `Defect.source` + `CreateDefectPayload.sourceVerificationResultId`
- [x] Create-from-result sends functional / NFR source id
- [x] Defects table **Source** column
- [x] Defect drawer: Source block + deep links to Runs (`?runId=`) and Cases (`?selected=`)
- [x] WAVE4 contract note updated

## Optional (not shipped)

| Endpoint | Purpose |
| -------- | ------- |
| `POST .../defects/{id}/link-result` | Attach source after manual create |
| Filter `sourceRunId=` / `sourceCaseId=` | Defects for one run/case |
