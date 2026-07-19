# Wave 5 E2E matrix (Playwright)

Runnable specs: `e2e/wave5-ai-assistant-agent.spec.ts`  
Unit-backed security: `modules/ai-agent-admin/wave5-security.guard.test.ts`, `shared/lib/sseClient.test.ts`  
Coverage gate: `npm run gate:wave5` / `npm run gate:wave5:done`

## Commands

```bash
npx playwright install chromium
npm run dev
npm run test:e2e -- e2e/wave5-ai-assistant-agent.spec.ts
```

Live auth + workspace:

```bash
E2E_WORKSPACE_ID=... \
E2E_STORAGE_STATE=e2e/.auth/user.json \
npm run test:e2e -- e2e/wave5-ai-assistant-agent.spec.ts
```

OpenAPI snapshot (when BE is up):

```bash
npm run wave5:openapi
# then record sha256 in WAVE5_CONTRACT_LOCK.md
```

## Mandatory matrix (§38)

| ID | Scenario | Spec status |
|---|---|---|
| E2E-W5-001 | Create and open conversation | Live gated |
| E2E-W5-002 | Rename conversation | Live gated / Manual |
| E2E-W5-003 | Archive conversation | Live gated / Manual |
| E2E-W5-004 | Soft-delete conversation | Live gated / Manual |
| E2E-W5-005 | Send message + complete SSE | Live gated / Manual |
| E2E-W5-006 | SSE reconnect no duplicate tokens | Unit (`sseClient.test.ts`) + Manual live |
| E2E-W5-007 | Cancel message generation | Live gated / Manual |
| E2E-W5-008 | Tool call/result render | Live gated / Manual |
| E2E-W5-009 | Message failure / blocked | Live gated / Manual |
| E2E-W5-010 | Message feedback | Live gated / Manual |
| E2E-W5-011 | Suggested questions | Live gated / Manual |
| E2E-W5-012 | Explain page/field/disabled streams | Live gated / Manual |
| E2E-W5-013 | Provider CRUD/lifecycle | Live gated (admin chrome) / Manual CRUD |
| E2E-W5-014 | Provider secret no raw leak | Unit + Manual |
| E2E-W5-015 | Model CRUD/lifecycle | Live gated (admin chrome) / Manual |
| E2E-W5-016 | Deployment CRUD/default | Live gated / Manual |
| E2E-W5-017 | Parameter capability CRUD | Live gated / Manual |
| E2E-W5-018 | Agent CRUD/lifecycle | Live gated / Manual |
| E2E-W5-019 | Prompt template CRUD | Live gated / Manual |
| E2E-W5-020 | Prompt version draft/activate/archive | Live gated / Manual |
| E2E-W5-021 | Event config + resolve | Live gated / Manual |
| E2E-W5-022 | Usage policy CRUD | Live gated / Manual |
| E2E-W5-023 | Manual execution | Live gated / Manual |
| E2E-W5-024 | Execution log filters/detail | Live gated / Manual |
| E2E-W5-025 | Service lifecycle updates log | BE worker — Manual / integration |
| E2E-W5-026 | Playground options | Live gated / Manual |
| E2E-W5-027 | Playground event-config run | Live gated / Manual |
| E2E-W5-028 | Playground direct run | Live gated / Manual |
| E2E-W5-029 | Prompt preview / missing vars | Live gated / Manual |
| E2E-W5-030 | Tool CRUD/lifecycle | Live gated / Manual |
| E2E-W5-031 | Tool permission add/remove | Live gated / Manual |
| E2E-W5-032 | Tool agent bind/unbind | Live gated / Manual |
| E2E-W5-033 | Tool debug execute | Live gated / Manual |
| E2E-W5-034 | Every contract endpoint has evidence | Gate `gate:wave5` (ids present) |
| E2E-W5-035 | No raw provider secret in cache/log/UI | Unit automated |
| E2E-W5-036 | Browser never calls service-only transitions | Unit automated |

## Shell smoke (always / auth)

| Smoke | Status |
|---|---|
| Login page renders | Automated |
| Unauthenticated `/admin/ai-control` redirects to login | Automated |
| Authenticated AI Assistant shell | `E2E_STORAGE_STATE` + `E2E_WORKSPACE_ID` |
| Authenticated admin AI Control page titles | `E2E_STORAGE_STATE` |

## Status rule

Do **not** flip CSV `InitialStatus` to `UI_TESTED` / `UI_STREAM_TESTED` until the corresponding live scenario has network evidence. Unit-only rows (035/036/006 partial) may be noted in evidence but stream/user-facing still need live runs for Wave5Done.
