# Wave 4 Coverage Register

> Auto-generated 2026-07-18T17:54:32.021Z from `WAVE4_API_CONTRACT.md`.
> Re-run: `node scripts/generate-wave4-coverage-register.mjs`
> Exceptions: [WAVE4_CONTRACT_EXCEPTIONS.md](./WAVE4_CONTRACT_EXCEPTIONS.md)

**Total endpoints:** 552

## Status rollup

| Status | Count |
|---|---|
| `UI_IMPLEMENTED` | 548 |
| `MAPPED` | 2 |
| `CONTRACT_BLOCKED` | 2 |

## By module

| Module | Total | UI_IMPLEMENTED | CONTRACT_BLOCKED | MAPPED |
|---|---|---|---|---|
| DocumentHub | 27 | 25 | 0 | 2 |
| Knowledge | 27 | 27 | 0 | 0 |
| EventRegistry | 9 | 9 | 0 | 0 |
| Governance | 28 | 28 | 0 | 0 |
| Quality | 84 | 84 | 0 | 0 |
| Reporting | 25 | 25 | 0 | 0 |
| AI Assistant | 16 | 16 | 0 | 0 |
| AI Planning | 15 | 15 | 0 | 0 |
| AI Recommendation | 13 | 13 | 0 | 0 |
| ClientPortal | 44 | 42 | 2 | 0 |
| ProjectNotification | 13 | 13 | 0 | 0 |
| Productivity | 21 | 21 | 0 | 0 |
| IntegrationHub | 75 | 75 | 0 | 0 |
| Traceability | 26 | 26 | 0 | 0 |
| Trust / Compliance | 63 | 63 | 0 | 0 |
| ServiceSupport | 66 | 66 | 0 | 0 |

## CONTRACT_BLOCKED rows

| # | Module | Method | Path | Exception |
|---|---|---|---|---|
| 267 | ClientPortal | POST | `/api/v1/projects/{projectId}/client-uat-assignments` | W4-EX-PORTAL-UAT |
| 268 | ClientPortal | GET | `/api/v1/projects/{projectId}/client-uat-assignments` | W4-EX-PORTAL-UAT |

## Honest reading

- `UI_IMPLEMENTED` here means FE has a wired surface for that path family — **not** every mutation is tested.
- Hook Vitest exists for Document Hub, Productivity inbox, Governance, Reporting, Knowledge indexing, Quality, Traceability, Portal login/reviews, Trust privacy, Support cases.
- Remaining `MAPPED` rows need dedicated UI or an approved non-UI exception.
