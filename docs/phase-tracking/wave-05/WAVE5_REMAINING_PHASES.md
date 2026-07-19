# Wave 5 — Phần còn thiếu (chia phase nhỏ)

> **Contract:** [WAVE5_API_CONTRACT.md](./WAVE5_API_CONTRACT.md) (102 endpoints)  
> **Spec:** [SCOPERY_WAVE5_AI_ASSISTANT_AGENT_UI_UX_API_IMPLEMENTATION_SPEC.md](./SCOPERY_WAVE5_AI_ASSISTANT_AGENT_UI_UX_API_IMPLEMENTATION_SPEC.md)  
> **Register:** [SCOPERY_WAVE5_API_COVERAGE_REGISTER.csv](./SCOPERY_WAVE5_API_COVERAGE_REGISTER.csv)  
> **Tracker:** [WAVE5_COVERAGE_TRACKER.md](./WAVE5_COVERAGE_TRACKER.md)

Scaffold hiện tại: `modules/ai-assistant` (chat partial) + legacy `ai-agent-control` / `admin/ai-*` (không đủ contract mới).  
Hầu hết register đang **`MAPPED`** — chưa = `UI_TESTED` / `UI_STREAM_TESTED` / `SERVICE_ORCHESTRATED_TESTED`.

Mục tiêu: đưa từng slice lên trạng thái cuối theo DoD §41 + Coverage Gate §0 / §43.

## Quy tắc mỗi phase

1. Endpoints của slice → domain / API / hook / View đầy đủ (CLAUDE.md layers)
2. Loading / empty / error / forbidden (403 ≠ empty)
3. Mutation → cache invalidation
4. Tests: happy path + 403 (+ SSE nếu áp dụng)
5. Cập nhật Coverage Tracker + CSV status
6. Không nhảy phase sau khi chưa đóng gate (trừ `CONTRACT_BLOCKED` có exception ID)

Mỗi **PR = 1 page ID hoặc 1 controller group** — không gom cả một phase lớn vào một PR.

### Kiến trúc FE (chốt)

| Bounded context | Module | Ghi chú |
|---|---|---|
| AI Assistant Chat | `modules/ai-assistant` | Expand scaffold hiện có |
| AI Agent Admin | `modules/ai-agent-admin` (mới) | Sub-modules theo contract E–R; không nhồi legacy `ai-agent-control` nếu schema lệch |
| Routes | `/workspace/.../ai`, `/admin/ai/...` | Spec `/w/...` + `/settings/ai/...` map sang shell hiện tại |
| SSE | `shared/lib/sseClient` | Harden reconnect / Last-Event-ID / cancel |

---

## Roadmap

| Phase | Scope | Endpoints | Ước lượng | Gate |
|---|---|---:|---|---|
| **W5-A** | Contract lock + client foundation | 0 (infra) | 2–3 ngày | OpenAPI = 102; headers CSRF + Actor/Workspace; SSE spike pass |
| **W5-B** | Assistant shell + conversations | 6 (#1–6) | ~1 tuần | AIA-01 list/create/rename/archive/delete + deep routes |
| **W5-C** | Chat workspace + SSE + cancel | 5 (#7–11) | 1–1.5 tuần | REST→SSE, reconnect, cancel, statuses, tool cards → `UI_STREAM_TESTED` |
| **W5-D** | Message feedback | 1 (#16) | 1–2 ngày | Create-once feedback; không invent update/delete |
| **W5-E** | Contextual guide | 4 (#12–15) | ~1 tuần | Suggested + explain page/field/disabled + guide drawer |
| **W5-F** | Admin shell + Overview | 0–lazy | 2–3 ngày | Nav AI & Automation; ADM-01 (GAP-09 aggregate) |
| **W5-G** | Providers + Secrets | 11 (#17–27) | ~1 tuần | CRUD/lifecycle; **không leak raw secret** |
| **W5-H** | Models + Deployments + Capabilities | 19 (#28–46) | 1–1.5 tuần | Set-default thật; capability matrix |
| **W5-I** | Agents + Prompt templates/versions | 18 (#47–64) | ~1 tuần | DRAFT editable / ACTIVE locked / activate archives |
| **W5-J** | Event configs + Usage policies | 13 (#65–77) | ~1 tuần | Resolve tester + policy CRUD |
| **W5-K** | Executions + Monitor/Detail | 4 UI + 5 service (#78–86) | ~1 tuần | Browser **không** gọi #80–84; service evidence |
| **W5-L** | Playground | 4 (#87–90) | 3–5 ngày | 3 modes + options + preview |
| **W5-M** | Tools registry + detail | 12 (#91–102) | ~1 tuần | Permissions / bindings / debug execute (stub label) |
| **W5-N** | Hardening + 100% coverage | all | 1–1.5 tuần | E2E-W5-001…036; evidence file; CI gate |

**Thứ tự bắt buộc:**  
- Assistant: W5-A → B → C → D → E  
- Admin: W5-A → F → G → H → I → (J ∥ L ∥ M sau I) → K → N  
- **W5-F** có thể song song sau W5-A khi B/C đang làm.  
- **Không nhảy W5-N** khi còn endpoint user-facing chưa test.

**Bắt đầu ngay:** W5-A → W5-B → W5-C.

---

## Dependency graph

```text
W5-A Foundation
 ├── W5-B Conversations → W5-C SSE Chat → W5-D Feedback
 │                                    └→ W5-E Guide ─────────┐
 └── W5-F Admin shell → W5-G Providers/Secrets → W5-H Models… → W5-I Agents/Prompts
                                                              ├── W5-J Events/Policies → W5-K Executions
                                                              ├── W5-L Playground
                                                              └── W5-M Tools
                                                                         └→ W5-N Hardening / DoD
```

---

## Chi tiết từng phase

### W5-A — Contract & client foundation

- Export OpenAPI snapshot; reconcile 102 paths với CSV + contract
- Typed endpoints / domain models cho cả hai context
- `apiClient`: unwrap `ApiResponse`, kiểm `success` (không chỉ HTTP 200)
- Inject `X-Actor-Id` + `X-Workspace-Id` từ session/workspace (user không sửa)
- CSRF + credentials cho unsafe methods
- SSE spike: cookie auth, reconnect / `Last-Event-ID` (fetch-SSE nếu EventSource không đủ — **W5-GAP-01/02**)
- Lock IAM permission codes (**W5-GAP-14**)
- Khởi tạo Coverage Tracker statuses

**Done when:** spike note + endpoint count lock + header helpers có unit test.

### W5-B — W5-AIA-01 Conversations (#1–6)

- Routes: `/workspace/[workspaceId]/ai`, `/ai/c/[conversationId]` (+ project variants nếu cần)
- Conversation list (paginated), New / Rename / Archive / Delete
- Active vs Archived UX (**W5-GAP-03** nếu BE thiếu filter → exception hoặc UX client-side tạm có ID)
- Clear AI Assistant cache khi switch workspace / logout

**Done when:** 6 endpoints → `UI_TESTED` (E2E-W5-API-001…006).

### W5-C — W5-AIA-02 Chat + SSE (#7–11) — critical path

- Composer, message history pagination, message statuses
- Flow: POST message → 202 → `streamUrl` → SSE
- State machine: IDLE → STARTING → CONNECTING → CONNECTED → RECONNECTING → CANCELLING → COMPLETED / FAILED / CANCELLED
- Token dedupe theo event ID; batch render; refetch message sau COMPLETED
- TOOL_CALL / TOOL_RESULT cards
- Stop → POST cancel; giữ SSE đến terminal event
- Unmount: close SSE; không auto-cancel trừ khi product rule yêu cầu

**Done when:** #7–11 → `UI_TESTED` / `UI_STREAM_TESTED` (E2E-W5-API-007…011 + E2E-W5-005…009).

### W5-D — Feedback (#16)

- Thumbs + FeedbackDialog
- Permission `AI_ASSISTANT_FEEDBACK_CREATE`
- Create-once only (**W5-GAP-05** — không invent update/delete)

**Done when:** #16 → `UI_TESTED` (E2E-W5-API-016).

### W5-E — W5-AIA-03 Contextual guide (#12–15)

- Suggested question chips theo `pageCode`
- Explain page / field / disabled-action (REST→SSE, reuse stream client từ W5-C)
- Guide drawer embedded — không tạo menu “AI Chat” / “AI Guide” riêng

**Done when:** #12–15 → `UI_TESTED` / stream-tested (E2E-W5-API-012…015).

### W5-F — Admin shell + Overview (ADM-01) ✅

- Nav: Overview → Providers → Secrets → Models → Deployments → Capabilities → Agents → Prompts → Event configs → Usage policies → Executions → Playground → Tools
- Routes under `/admin/ai-control/*` (not `/admin/ai` — reserved legacy developer tools)
- Overview: lazy aggregate từ list APIs size=1 (**W5-GAP-09**)
- Child list routes stubbed until W5-G…M

**Done when:** nav + overview route ship; permission-gated empty/forbidden đúng.

### W5-G — Providers + Secrets (#17–27) — ADM-02/03 ✅

- Provider CRUD + activate/deactivate
- Secret save / rotate / deactivate; detail chỉ masked
- Không persist raw secret vào cache/log/UI (**E2E-W5-035**)
- Permissions tách: `AI_PROVIDER_SECRET_*` vs `AI_AGENT_CONFIG_*`

**Done when:** #17–27 → `UI_TESTED`.

### W5-H — Models + Deployments + Capabilities (#28–46) — ADM-04/05/06 ✅

- Model catalog CRUD + lifecycle
- Deployment CRUD + set-default (invalidate server-side, không chỉ local UI)
- Parameter capability matrix + min/default/max validation

**Done when:** #28–46 → `UI_TESTED`.

### W5-I — Agents + Prompt templates/versions (#47–64) — ADM-07/08/09 ✅

- Agent registry CRUD + lifecycle
- Prompt template library
- Prompt Version Studio: DRAFT editable; ACTIVE không edit; activate archives previous ACTIVE; archive

**Done when:** #47–64 → `UI_TESTED` (E2E-W5-018…020).

### W5-J — Event configs + Usage policies (#65–77) — ADM-10/11 ✅

- Event config CRUD + activate/deactivate
- Resolve tester (`GET .../event-configs/resolve`)
- Usage policy CRUD + lifecycle + target behavior validation

**Done when:** #65–77 → `UI_TESTED`.

### W5-K — Executions + Monitor/Detail (#78–86) — ADM-12/13 ✅

- Manual event execution + run-by-event-config-id (UI)
- Execution log list/detail (GET only từ browser)
- **#80–84** (POST/PATCH execution-logs transitions): `SERVICE_ORCHESTRATED` — browser never calls; documented in `EXECUTION_LOG_SERVICE_ONLY_PATHS` (**W5-GAP-06/07**)
- Không expose user-facing cancel log

**Done when:** #78–79, #85–86 → `UI_TESTED`; #80–84 → `SERVICE_ORCHESTRATED_TESTED` (BE worker evidence).

### W5-L — Playground (#87–90) — ADM-14 ✅

- Options dropdowns from `GET /playground/options`
- Event-config run / Direct run / Prompt preview
- Missing variables UX; result panel; history via execution logs when linked (**W5-GAP-11**)
- Permission `AI_PLAYGROUND_USE` tách khỏi config view; feature flag when playground disabled

**Done when:** #87–90 → `UI_TESTED`.

### W5-M — Tools (#91–102) — ADM-15/16 ✅

- Tool registry CRUD + lifecycle
- Permissions add/remove; agent bind/list/unbind
- Execute = debug/stub label only (**W5-GAP-13**) — không present như production run
- Permission catalog cho binding: controlled code input (**W5-GAP-10**)

**Done when:** #91–102 → `UI_TESTED` (E2E-W5-030…033).

### W5-N — Hardening + Definition of Done ✅*

- Security: no raw provider secret; browser never calls #80–84 (unit + endpoint lock)
- SSE recovery unit tests + a11y/responsive deferred to E2E pass
- Coverage gate: `npm run gate:wave5` (implementation) / `npm run gate:wave5:done` (strict)
- Evidence: `docs/phase-complete/WAVE_5_AI_ASSISTANT_AGENT_UI_COMPLETE.md`
- **Wave5Done formula §0.4 = false** until register flips to `UI_TESTED` / `UI_STREAM_TESTED` / `SERVICE_ORCHESTRATED_TESTED`

**Done when (strict):** Wave5Done formula §0.4 = true after live E2E + worker evidence.

---

## Contract gaps (theo dõi trong phases)

| ID | Severity | Phase owner | Action |
|---|---|---|---|
| W5-GAP-01 | Critical | W5-A / C | Fetch-based SSE + Last-Event-ID |
| W5-GAP-02 | Critical | W5-A / C | Cookie/CORS SSE spike trước chat done |
| W5-GAP-03 | High | W5-B | Clarify archive filter hoặc UX + exception |
| W5-GAP-04 | High | W5-C | Không invent retry; tạo user turn mới |
| W5-GAP-05 | High | W5-D | Feedback create-once |
| W5-GAP-06 | High | W5-K | Keep service-orchestrated |
| W5-GAP-07 | High | W5-K | Không expose cancel log từ browser |
| W5-GAP-08 | High | W5-G/H | Confirm deactivate dependency errors |
| W5-GAP-09 | Medium | W5-F | Lazy aggregate hoặc BE summary |
| W5-GAP-10 | Medium | W5-M | IAM catalog / controlled input |
| W5-GAP-11 | Medium | W5-L | Execution logs as playground history |
| W5-GAP-12 | Medium | W5-I | Confirm admin agent filters |
| W5-GAP-13 | Medium | W5-M | Label tool execute debug-only |
| W5-GAP-14 | Medium | W5-A | Lock IAM action catalog |

---

## Không làm trong các phase này

- Đổi BE prefix `/api/ai-agent` → `/api/v1/ai-agent`
- Gọi execution-log transition APIs từ browser
- Invent retry/regenerate/feedback-update endpoints
- Đánh dấu Wave DONE khi còn endpoint user-facing chưa `UI_TESTED`
- Mock production data như đã complete
- Menu nav trùng: “AI Chat” / “AI Guide” / “Project AI” riêng (chỉ một mục AI Assistant)

---

## Next action

**Wave5Done = false.** E2E scaffold sẵn sàng.

1. Bật BE → `npm run wave5:openapi` → ghi sha256 vào `WAVE5_CONTRACT_LOCK.md`
2. Bật FE → `npm run test:e2e -- e2e/wave5-ai-assistant-agent.spec.ts` (thêm `E2E_STORAGE_STATE` / `E2E_WORKSPACE_ID` cho live chrome)
3. Chạy full matrix `e2e/WAVE5_E2E_MATRIX.md` → flip CSV → `npm run gate:wave5:done`
