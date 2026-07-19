# Wave 4 Coverage Tracker

> Endpoint inventory: [WAVE4_COVERAGE_REGISTER.md](./WAVE4_COVERAGE_REGISTER.md) · [`.json`](./WAVE4_COVERAGE_REGISTER.json)  
> Exceptions: [WAVE4_CONTRACT_EXCEPTIONS.md](./WAVE4_CONTRACT_EXCEPTIONS.md)  
> Document Hub: [DOCUMENT_HUB_COVERAGE.md](./DOCUMENT_HUB_COVERAGE.md)

Re-run register: `node scripts/generate-wave4-coverage-register.mjs`

## Register rollup

| Status | Count |
|---|---|
| `UI_IMPLEMENTED` | **548** |
| `MAPPED` | **2** (gen-doc worker `process` / `complete` — intentional non-UI) |
| `CONTRACT_BLOCKED` | **2** (+ documented exceptions) |
| **Total** | **552** |

## Hardening (this session)

| Item | Status |
|---|---|
| `FEATURES.clientPortal` | **enabled** — layout gated; UAT still blocked (`W4-EX-PORTAL-UAT`) |
| Vitest — Client collaboration | invite + 403 decide |
| Vitest — Integration dry-run gate | execute blocked until dry-run |
| Vitest — Deployments 403 | start forbidden |
| Vitest — Trust retention | legal-hold dry-run block |
| Vitest — Support ops 403 | incident acknowledge |

## Wave Complete checklist

1. ✅ Path coverage at register level (548 / 552 UI surfaces; 2 worker MAPPED; 2 CONTRACT_BLOCKED)
2. ✅ Enable `clientPortal` (login + project views; UAT remains exception-gated)
3. ✅ Broader hook Vitest for new surfaces (collaboration / dry-run / deploy / trust / support)
4. ⬜ Product UAT against live BE for dangerous flows (anonymize, retention, deploy rollback)
