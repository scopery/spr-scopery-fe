# Wave 5 — AI Assistant + AI Agent Admin UI — Status

Date: 2026-07-19  
Modules: `modules/ai-assistant/`, `modules/ai-agent-admin/`  
Routes: `/workspace/{workspaceId}/ai`, `/admin/ai-control/*`  
Contract: `docs/phase-tracking/wave-05/WAVE5_API_CONTRACT.md` (102 endpoints)  
Register: `docs/phase-tracking/wave-05/SCOPERY_WAVE5_API_COVERAGE_REGISTER.csv`

## Wave5Done formula (§0.4)

| Check | Status |
|---|---|
| `contractEndpointCount == 102` | ✅ |
| `coverageRegisterEndpointCount == 102` | ✅ |
| `unmappedEndpointCount == 0` | ✅ (`npm run gate:wave5`) |
| `userFacingUntestedCount == 0` | ⬜ pending live E2E → `UI_TESTED` |
| `streamUntestedCount == 0` | ⬜ pending SSE E2E → `UI_STREAM_TESTED` |
| `serviceOrchestratedUntestedCount == 0` | ⬜ pending BE worker evidence |
| `unapprovedExceptionCount == 0` | ✅ |
| `criticalSecurityTestPassed` | ✅ unit (secrets + service-only lock) |
| `SSERecoveryTestPassed` | ✅ unit (`shared/lib/sseClient.test.ts` Last-Event-ID) |

**Verdict: Wave5Done = false.** FE implementation + mapping + security locks are complete; register statuses remain `MAPPED` until E2E/network evidence is attached. Do not flip to DONE via mock data.

Strict CI (fails until E2E): `npm run gate:wave5:done`

## Phases delivered

| Phase | Status | Notes |
|---|---|---|
| W5-A Foundation | ✅ | Contract lock; headers; fetch SSE; endpoints scaffold |
| W5-B Conversations | ✅ | List/deep route; rename/archive/delete |
| W5-C Chat + SSE | ✅ | Stream SM; Last-Event-ID; cancel; tool cards |
| W5-D Feedback | ✅ | Create-once dialog |
| W5-E Guide | ✅ | Suggested + explain streams |
| W5-F Admin shell | ✅ | `/admin/ai-control/*` + lazy overview |
| W5-G Providers + Secrets | ✅ | Masked-only; clear raw after submit |
| W5-H Models + Deploy + Caps | ✅ | Set-default; capability matrix |
| W5-I Agents + Prompts | ✅ | Version studio DRAFT→ACTIVE→ARCHIVED |
| W5-J Events + Policies | ✅ | Resolve tester; usage limits |
| W5-K Executions | ✅ | Triggers + GET logs; #80–84 not exported |
| W5-L Playground | ✅ | Options + 3 modes; feature gate |
| W5-M Tools | ✅ | Registry + bind/perm + debug stub label |
| W5-N Hardening | ✅* | Gate script + security/SSE unit evidence; E2E still open |

## OpenAPI snapshot

| Field | Value |
|---|---|
| Snapshot file | _(pending)_ `docs/phase-tracking/wave-05/openapi-wave5-snapshot.json` |
| sha256 | _(pending)_ — BE unavailable at contract lock |
| SoT until snapshot | `WAVE5_API_CONTRACT.md` + CSV |

## Routes / pages

### AI Assistant
- `/workspace/[workspaceId]/ai`
- `/workspace/[workspaceId]/ai/c/[conversationId]`

### AI Agent Admin (`/admin/ai-control`)
- overview, providers, provider-secrets, models, deployments, parameter-capabilities
- agents, prompts (+ version studio), event-configs, usage-policies
- executions (+ detail), playground, tools (+ detail)

## Security evidence

| Control | Evidence |
|---|---|
| No raw provider secret in list/detail UI | `MaskedValue`; domain model omits `secretValue` |
| Clear raw after submit/error | `SaveProviderSecretDialog` / `RotateProviderSecretDialog` `clearSensitive()` |
| Browser never calls #80–84 | Not on `AI_AGENT_ADMIN_ENDPOINTS`; `EXECUTION_LOG_SERVICE_ONLY_PATHS`; `wave5-security.guard.test.ts` |
| Prefix lock `/api/ai-agent` | Gate + unit assert; comment forbids `/api/v1/ai-agent` rewrite |
| Tool execute labeled debug-only | W5-GAP-13 UI copy + confirm |

## SSE evidence (unit)

- `shared/lib/sseClient.test.ts`: parse TOKEN/COMPLETED; reconnect sends `Last-Event-ID`; seed `initialLastEventId`
- Transport: fetch-based `openSseStream` with `credentials: 'include'` (W5-GAP-01/02)

## Coverage gate

```bash
npm run gate:wave5          # implementation: unmapped==0 + security locks
npm run gate:wave5:done     # Wave5Done strict: requires UI_TESTED / UI_STREAM_TESTED / SERVICE_ORCHESTRATED_TESTED
```

## Contract gaps (deferred / mitigated)

| ID | FE mitigation | Remaining |
|---|---|---|
| W5-GAP-01/02 | Fetch SSE + Last-Event-ID | Live cookie/CORS against BE |
| W5-GAP-06/07 | #80–84 not exported | Worker `SERVICE_ORCHESTRATED_TESTED` |
| W5-GAP-09 | Lazy overview counts | Optional BE summary |
| W5-GAP-10 | Controlled permission code input | IAM catalog picker |
| W5-GAP-11 | Link playground → execution logs | — |
| W5-GAP-13 | Debug execute labeling | — |
| W5-GAP-14 | Provisional `WAVE5_AI_PERMISSIONS` | Lock with IAM |

## Next (to reach Wave5Done)

1. Start BE → `npm run wave5:openapi` → paste sha256 into `WAVE5_CONTRACT_LOCK.md`
2. Start FE (`npm run dev`) + auth storage → run `e2e/wave5-ai-assistant-agent.spec.ts` chrome smoke
3. Execute mandatory matrix in `e2e/WAVE5_E2E_MATRIX.md` (E2E-W5-001…036) against live BE
4. Update CSV `InitialStatus` → `UI_TESTED` / `UI_STREAM_TESTED` / `SERVICE_ORCHESTRATED_TESTED`
5. Attach BE worker evidence for #80–84
6. `npm run gate:wave5:done` must pass

## E2E scaffold (2026-07-19)

| Artifact | Status |
|---|---|
| `e2e/WAVE5_E2E_MATRIX.md` | ✅ |
| `e2e/wave5-ai-assistant-agent.spec.ts` | ✅ shell + gated admin chrome |
| `npm run wave5:openapi` | ✅ script; BE was down at run (no fake snapshot) |
| Live Playwright smoke | ⬜ needs `npm run dev` + optional `E2E_STORAGE_STATE` |
