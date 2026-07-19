# Wave 5 Coverage Tracker

> Phases: [WAVE5_REMAINING_PHASES.md](./WAVE5_REMAINING_PHASES.md)  
> Register: [SCOPERY_WAVE5_API_COVERAGE_REGISTER.csv](./SCOPERY_WAVE5_API_COVERAGE_REGISTER.csv)  
> Contract: [WAVE5_API_CONTRACT.md](./WAVE5_API_CONTRACT.md)  
> Spec: [SCOPERY_WAVE5_AI_ASSISTANT_AGENT_UI_UX_API_IMPLEMENTATION_SPEC.md](./SCOPERY_WAVE5_AI_ASSISTANT_AGENT_UI_UX_API_IMPLEMENTATION_SPEC.md)

## Register rollup

| Status | Count |
|---|---|
| `MAPPED` (not yet tested) | **102** |
| `UI_TESTED` | **0** |
| `UI_STREAM_TESTED` | **0** |
| `SERVICE_ORCHESTRATED_TESTED` | **0** |
| `CONTRACT_BLOCKED` | **0** |
| `APPROVED_NON_UI_EXCEPTION` | **0** |
| **Total** | **102** |

Target end states:

```text
97 user-facing → UI_TESTED (hoặc UI_STREAM_TESTED cho SSE)
1 SSE stream   → UI_STREAM_TESTED
5 service-only → SERVICE_ORCHESTRATED_TESTED
```

## Phase progress

| Phase | Status | Notes |
|---|---|---|
| W5-A Foundation | ✅ done | Contract lock 102=102; AI headers; SSE Last-Event-ID; endpoints scaffold; provisional IAM |
| W5-B Conversations (#1–6) | ✅ done | Deep route `/ai/c/[id]`; New/Rename/Archive/Delete; Active/Archived tabs; workspace-switch clear |
| W5-C Chat + SSE (#7–11) | ✅ done | Stream state machine; Last-Event-ID dedupe; cancel keep-alive; tool cards; optimistic user msg |
| W5-D Feedback (#16) | ✅ done | FeedbackDialog create-once; reason/comment; permission soft-gate |
| W5-E Guide (#12–15) | ✅ done | Suggested chips; explain page/field/disabled; GuideDrawer stream |
| W5-F Admin shell | ✅ done | `/admin/ai-control/*`; lazy overview counts (GAP-09); child stubs |
| W5-G Providers + Secrets (#17–27) | ✅ done | Provider CRUD + lifecycle; secret vault masked-only; no raw cache |
| W5-H Models + Deploy + Caps (#28–46) | ✅ done | Catalog + deployments set-default + capability matrix |
| W5-I Agents + Prompts (#47–64) | ✅ done | Agent registry; template library; version studio DRAFT→ACTIVE→ARCHIVED |
| W5-J Events + Policies (#65–77) | ✅ done | Event config + resolve tester; usage policy limits/target rules |
| W5-K Executions (#78–86) | ✅ done | Triggers #78–79 + GET logs #85–86; #80–84 not exported (service-only) |
| W5-L Playground (#87–90) | ✅ done | Options + event-config/direct/preview; feature + `AI_PLAYGROUND_USE` gates |
| W5-M Tools (#91–102) | ✅ done | Registry + detail tabs; perm/bind; debug execute labeled stub |
| W5-N Hardening / DoD | ✅ done* | Gate + security/SSE unit evidence; **Wave5Done=false** until E2E |

## W5-N evidence

| Item | Status |
|---|---|
| Implementation coverage gate `npm run gate:wave5` (unmapped==0, 102 rows, security locks) | ✅ |
| Strict Wave5Done gate `npm run gate:wave5:done` | ⬜ blocked on E2E status flips |
| No raw secret + clear after submit | ✅ unit + UI |
| Browser never calls #80–84 | ✅ endpoints + unit guard |
| SSE Last-Event-ID reconnect unit tests | ✅ |
| Evidence file `docs/phase-complete/WAVE_5_AI_ASSISTANT_AGENT_UI_COMPLETE.md` | ✅ (honest: Wave5Done false) |
| Live E2E E2E-W5-001…036 / API-xxx | ⬜ scaffold in `e2e/WAVE5_E2E_MATRIX.md` + `wave5-ai-assistant-agent.spec.ts` |
| OpenAPI snapshot hash | ⬜ `npm run wave5:openapi` (BE down at last attempt) |

## W5-M evidence

| Item | Status |
|---|---|
| Tool registry CRUD + activate/deactivate (#91–96) | ✅ |
| Permissions add/remove (#97–98); controlled code input (GAP-10) | ✅ |
| Agent bind / list / unbind (#99–101); duplicate prevented in picker | ✅ |
| Execute labeled **Debug execution** stub only (GAP-13) | ✅ |
| WRITE/READ_WRITE confirm on debug | ✅ |
| Soft gates `AI_TOOL_VIEW` / `AI_TOOL_MANAGE` | ✅ |

## W5-L evidence

| Item | Status |
|---|---|
| Options from `GET /playground/options` (#90) | ✅ |
| Event-config run (#87) / Direct run (#88) / Prompt preview (#89) | ✅ |
| Feature gate `FEATURES.aiAgentPlayground` — no run calls when disabled | ✅ |
| Soft gate `AI_PLAYGROUND_USE` | ✅ |
| Missing variables UX on preview | ✅ |
| Result panel + link to execution logs (GAP-11) | ✅ |

## W5-K evidence

| Item | Status |
|---|---|
| Manual run by event (#78) + by event-config (#79) | ✅ |
| Execution log list/detail GET only (#85–86) | ✅ |
| No cancel / running / succeeded / failed / create log from browser | ✅ |
| `EXECUTION_LOG_SERVICE_ONLY_PATHS` documents #80–84 | ✅ |
| Soft gates `AI_EXECUTION_RUN` / `AI_EXECUTION_LOG_VIEW` | ✅ |
| #80–84 SERVICE_ORCHESTRATED evidence | ⬜ worker/integration (BE) — FE lock complete |

## W5-J evidence

| Item | Status |
|---|---|
| Event config CRUD + activate/deactivate | ✅ |
| Resolve tester (definition XOR source+key) | ✅ |
| SpEL condition shown as code; browser never evaluates | ✅ |
| Usage policy CRUD; GLOBAL null targetId; ≥1 limit | ✅ |
| Endpoints #65–77 wired | ✅ |

## W5-I evidence

| Item | Status |
|---|---|
| Agent registry CRUD + scope sanitization (GLOBAL clears IDs) | ✅ |
| Prompt template library (metadata only, no content field) | ✅ |
| Version studio: DRAFT editable; ACTIVE/ARCHIVED read-only | ✅ |
| Activate archives previous ACTIVE; archive action | ✅ |
| JSON content + variableSchema validation | ✅ |
| Endpoints #47–64 wired | ✅ |

## W5-H evidence

| Item | Status |
|---|---|
| Model catalog filters + CRUD + activate/deactivate | ✅ |
| Model detail + links to deployments/capabilities | ✅ |
| Deployment CRUD + set-default confirm (server invalidate) | ✅ |
| Capability matrix + min≤default≤max; CONDITIONAL desc; NO hides values | ✅ |
| Endpoints #28–46 wired | ✅ |

## W5-G evidence

| Item | Status |
|---|---|
| Provider list filters (keyword/type/status) + pagination | ✅ |
| Create / Edit / Activate / Deactivate (no optimistic) | ✅ |
| Provider detail + manage secrets link | ✅ |
| Secret list masked-only (`MaskedValue`, no reveal) | ✅ |
| Save / Rotate / Deactivate; clear raw after submit | ✅ |
| Soft permission gates CONFIG vs PROVIDER_SECRET | ✅ |
| Endpoints #17–27 wired via `providers.api` / `provider-secrets.api` | ✅ |

## W5-F evidence

| Item | Status |
|---|---|
| Admin nav “AI & Automation” → `/admin/ai-control` | ✅ |
| Sidebar layout (Overview → … → Tools) | ✅ `AiControlAdminLayout` |
| Overview lazy counts via list `size=1` (GAP-09) | ✅ `fetchAiControlOverviewCounts` |
| Child route stubs (no mock counts) | ✅ |
| Facade exports from `@/modules/ai-agent-admin` | ✅ |

## W5-E evidence

| Item | Status |
|---|---|
| Suggested questions by pageCode | ✅ `useContextualGuide` |
| Explain page / field / disabled-action → SSE | ✅ |
| Guide drawer (`DetailDrawer`) | ✅ |
| Field help icon + “Why disabled?” accessible trigger | ✅ |

## W5-D evidence

| Item | Status |
|---|---|
| Feedback dialog (rating / reason / comment) | ✅ |
| Create-once client lock (GAP-05) | ✅ |
| Soft permission gate `AI_ASSISTANT_FEEDBACK_CREATE` | ✅ |

## W5-C evidence

| Item | Status |
|---|---|
| Stream UI state machine IDLE→…→COMPLETED/FAILED/CANCELLED | ✅ `useAiMessageStream` |
| Token batching + event-id dedupe | ✅ |
| TOOL_CALL / TOOL_RESULT cards (masked secrets) | ✅ |
| Cancel: POST then keep SSE until terminal/timeout | ✅ |
| Unmount closes transport only (no auto-cancel) | ✅ |
| Retry connection after reconnect exhaustion | ✅ |
| Optimistic user message after 202 | ✅ |
| Composer disabled while streaming; max 8000 | ✅ |

## W5-B evidence

| Item | Status |
|---|---|
| Route `/workspace/:id/ai/c/:conversationId` | ✅ |
| `ROUTES.workspace.aiAssistantConversation` | ✅ |
| New conversation dialog (type/capability/project/title) | ✅ |
| Rename / Archive / Soft-delete + confirm | ✅ |
| Active / Archived tabs (client filter — GAP-03) | ✅ |
| Clear state on workspace switch | ✅ |
| Create navigates to conversation route | ✅ |

## W5-A evidence

| Item | Status |
|---|---|
| Contract ↔ CSV count = 102 | ✅ [WAVE5_CONTRACT_LOCK.md](./WAVE5_CONTRACT_LOCK.md) |
| Live OpenAPI snapshot | ⬜ BE down at lock time — re-export when available |
| `aiAssistantHeaders` + interceptor | ✅ |
| SSE fetch + `Last-Event-ID` reconnect | ✅ unit tests |
| `AI_ASSISTANT_ENDPOINTS` complete for A–D | ✅ |
| `AI_AGENT_ADMIN_ENDPOINTS` scaffold E–R | ✅ (no service-only mutation exports) |
| `WAVE5_AI_PERMISSIONS` / `PERMISSIONS` | ✅ provisional (GAP-14) |

## Endpoint count by module

| Module | Count | Phase |
|---|---:|---|
| A. Conversations | 6 | W5-B |
| B. Messages | 5 | W5-C |
| C. Guide | 4 | W5-E |
| D. Feedback | 1 | W5-D |
| E. Providers | 6 | W5-G |
| F. Provider Secrets | 5 | W5-G |
| G. Models | 6 | W5-H |
| H. Model Deployments | 7 | W5-H |
| I. Parameter Capabilities | 6 | W5-H |
| J. Agents | 6 | W5-I |
| K. Prompt Templates | 6 | W5-I |
| L. Prompt Versions | 6 | W5-I |
| M. Event Configurations | 7 | W5-J |
| N. Usage Policies | 6 | W5-J |
| O. Executions | 2 | W5-K |
| P. Execution Logs | 7 | W5-K (5 service + 2 UI) |
| Q. Playground | 4 | W5-L |
| R. Tools | 12 | W5-M |

## Wave Complete checklist

1. ✅ `contractEndpointCount == coverageRegisterEndpointCount == 102`
2. ✅ `unmappedEndpointCount == 0` (`gate:wave5`)
3. ⬜ `userFacingUntestedCount == 0` (still MAPPED — need E2E)
4. ⬜ `streamUntestedCount == 0`
5. ⬜ `serviceOrchestratedUntestedCount == 0`
6. ✅ `unapprovedExceptionCount == 0`
7. ✅ Critical SSE recovery **unit** test passed (live E2E still open)
8. ✅ No raw provider secret in cache/log/UI (unit + UI controls)
9. ✅ Browser never calls execution-log transition APIs (#80–84) — not exported from FE endpoints
10. ✅ Evidence file: `docs/phase-complete/WAVE_5_AI_ASSISTANT_AGENT_UI_COMPLETE.md` (documents Wave5Done=false)
