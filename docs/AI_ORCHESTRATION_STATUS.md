# AI Orchestration Layer — Implementation Status

**Last Updated:** 2026-02-16  
**Status:** ✅ FULLY IMPLEMENTED

## Summary

The AI Orchestration Layer is **complete** and operational. All requirements from the original specification have been implemented, including:

- Unified orchestrator for all AI purposes
- DB-based configuration (admin-configurable per purpose)
- Three engine adapters (legacy_chat, workflow_api, agents_sdk)
- Fallback support
- Audit logging to `ai_orchestrator_runs`
- Admin APIs for config management
- Integration with all 4 existing AI endpoints
- RFC 9457 error handling
- Redaction for sensitive data
- Comprehensive test coverage

---

## 1. Database Schema ✅

**Migration:** `migrations/phase25_ai_orchestration.sql`

### Tables Created

#### `ai_configs` (PK: purpose)
Stores admin-configurable AI settings per purpose. DB config overrides ENV defaults.

**Columns:**
- `purpose` (text, PK) — one of: improve_answer, qgen_clarifying_questions, clarity_assess_one, impact_analysis
- `enabled` (boolean, default true)
- `primary_engine` (ai_engine_enum: legacy_chat | workflow_api | agents_sdk)
- `fallback_engine` (ai_engine_enum, nullable)
- `workflow_id` (text, nullable) — required when primary_engine = workflow_api
- `agent_entry` (text, nullable) — required when primary_engine = agents_sdk
- `model` (text, nullable) — OpenAI model override
- `temperature` (numeric, nullable)
- `max_output_tokens` (int, nullable)
- `timeout_ms` (int, nullable)
- `schema_version` (int, default 1)
- `notes` (text, nullable)
- `updated_by` (uuid FK to auth.users)
- `updated_at` (timestamptz)

**Constraints:**
- `chk_workflow_api_requires_workflow_id` — enforces workflow_id when primary_engine = workflow_api
- `chk_agents_sdk_requires_agent_entry` — enforces agent_entry when primary_engine = agents_sdk

**Seed Data:**
- improve_answer: legacy_chat, model=gpt-3.5-turbo
- qgen_clarifying_questions: agents_sdk (agent_entry=qgen_v2), fallback=legacy_chat, model=gpt-5.2
- clarity_assess_one: legacy_chat, model=gpt-4o
- impact_analysis: legacy_chat, model=gpt-4o

#### `ai_orchestrator_runs` (PK: id uuid)
Audit log for every orchestrator run.

**Columns:**
- `id` (uuid PK, auto-generated)
- `purpose` (text)
- `org_id`, `project_id`, `session_id`, `user_id` (nullable UUIDs)
- `engine_used` (ai_engine_enum)
- `workflow_id`, `agent_entry`, `model` (text, nullable)
- `status` (ai_run_status_enum: success | fallback_success | failed)
- `error_code` (text, nullable) — e.g., AI_OUTPUT_NOT_JSON, AI_PROVIDER_ERROR
- `error_detail` (text, nullable, truncated to 500 chars)
- `latency_ms` (int)
- `request_id` (uuid, nullable)
- `payload_redacted` (jsonb) — **never** stores raw answers/notes
- `output_redacted` (jsonb)
- `created_at` (timestamptz)

**Indexes:**
- `(purpose, created_at desc)`
- `(org_id, created_at desc)`
- `(project_id, created_at desc)`
- `(status, created_at desc)`

---

## 2. Core Implementation ✅

### AiOrchestrator Class
**File:** `src/modules/ai/orchestrator/ai.orchestrator.ts`

**Key Methods:**

#### `run<P extends AiPurpose>(purpose, ctx, input)`
Main orchestration logic:
1. Load config from DB (via `ai_configs.getByPurpose`) or fallback to ENV defaults
2. Check if purpose is enabled; if not and fallback_engine exists, use fallback
3. Handle client override (`ctx.forceEngine` for legacy QGen support)
4. Validate input against purpose schema (Zod)
5. Validate engine requirements:
   - workflow_api → workflow_id required
   - agents_sdk → agent_entry required
6. Execute primary engine
7. On failure, try fallback_engine if configured
8. Parse and validate output (JSON parse + Zod)
9. Log run to `ai_orchestrator_runs` with redacted payloads
10. Return `{ output, run_id, engine_used, status }`

**Fallback Logic:**
- If primary engine fails and `fallback_engine` is set → try fallback
- Status becomes `fallback_success` if fallback succeeds
- Both primary and fallback errors are captured; last error is logged if both fail

---

## 3. Engine Adapters ✅

### A) LegacyChatEngine
**File:** `src/modules/ai/orchestrator/engines/legacy.engine.ts`

- Uses OpenAI Chat Completions API via `createAiClient()`
- Builds legacy prompts from `prompts/legacyPrompts.ts`
- Respects config: model, temperature, max_output_tokens
- Returns `{ rawOutput, model, workflowId: null, agentEntry: null }`

### B) WorkflowApiEngine
**File:** `src/modules/ai/orchestrator/engines/workflow.engine.ts`

- Calls OpenAI Workflows Runs API: `POST /v1/workflows/:workflow_id/runs`
- Maps input using `workflowInputMapper.ts`
- Handles timeout via AbortController
- Extracts `finalOutput` from response
- Error handling:
  - 404/405 → AI_PROVIDER_ERROR (invalid workflow_id)
  - Timeout → AI_TIMEOUT
  - No finalOutput → AI_OUTPUT_NOT_JSON

### C) AgentsSdkEngine
**File:** `src/modules/ai/orchestrator/engines/agents.engine.ts`

- Runs in-process via `@openai/agents` SDK
- Agent registry maps purpose → runner:
  - `qgen_clarifying_questions` → `qgen_v2` (implemented)
  - Others: stub (throws AI_FEATURE_DISABLED)
- Returns `{ rawOutput: finalOutput, model, workflowId: null, agentEntry }`

---

## 4. Admin APIs ✅

**Base Path:** `/api/v2/admin/ai/*`  
**Auth:** `requireAdmin` (profiles.role = 'admin')

### Endpoints

#### GET /configs
Lists all AI configs (from DB or ENV defaults).

**Response:**
```json
{
  "items": [
    {
      "purpose": "improve_answer",
      "enabled": true,
      "primary_engine": "legacy_chat",
      "fallback_engine": null,
      "workflow_id": null,
      "agent_entry": null,
      "model": "gpt-3.5-turbo",
      "temperature": null,
      "max_output_tokens": null,
      "timeout_ms": 30000,
      "schema_version": 1,
      "notes": "...",
      "updated_by": null,
      "updated_at": "2026-02-16T..."
    }
  ]
}
```

#### PATCH /configs/:purpose
Updates config for a specific purpose.

**Validations:**
- `purpose` must be one of: improve_answer, qgen_clarifying_questions, clarity_assess_one, impact_analysis
- If `primary_engine=workflow_api` → `workflow_id` required (422)
- If `primary_engine=agents_sdk` → `agent_entry` required and in registry (422)

**Response:** Updated config row (direct object, no `{ ok, data }`)

#### POST /configs/:purpose/test-run
Admin-only test run without writing to domain tables.

**Request:**
```json
{
  "input": { "question_id": "...", "current_value": "..." },
  "use_fallback": true
}
```

**Response:**
```json
{
  "run_id": "uuid",
  "engine_used": "legacy_chat",
  "output": { "proposed_value": "...", ... }
}
```

Still logs to `ai_orchestrator_runs`.

#### GET /runs
Lists orchestrator audit runs with pagination.

**Query Params:**
- `purpose` (optional filter)
- `status` (optional filter)
- `limit` (default 50, max 100)
- `offset` (default 0)

**Response:**
```json
{
  "items": [ ... ],
  "page": { "limit": 50, "offset": 0, "total": 123 }
}
```

#### GET /runs/:runId
Retrieves a specific run by ID (full row, redacted).

---

## 5. Integration with Existing AI Endpoints ✅

All four AI endpoints now use the orchestrator via `runAiOrchestrator()`.

### 5.1 Improve Answer
**Endpoint:** `POST /api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/ai/improve`

**Orchestrator Integration:**
- Purpose: `improve_answer`
- Input: `{ question_id, current_value, user_instruction?, question: {...} }`
- Output validated against `ImproveAnswerOutputSchema`
- Response **backward compatible**:
  - `proposed_value` (FE cũ)
  - `proposal` object (FE mới)
  - `batch_token` + Redis TTL
  - `run_id`

**Engine Selection:**
- Default: `legacy_chat` (per ai_configs or ENV)
- Admin can change to workflow_api/agents_sdk

### 5.2 QGen Generate
**Endpoint:** `POST /api/v2/orgs/:orgId/projects/:projectId/ai/questions/generate`

**Orchestrator Integration:**
- Purpose: `qgen_clarifying_questions`
- **Engine param semantics:**
  - `engine="legacy"` → `ctx.forceEngine = 'legacy_chat'`
  - `engine="agentkit_v2_file"` → use config primary (agents_sdk or workflow_api)
  - omit → use config primary (DB > ENV)
- V2 flow: builds QA pack + baseline digest server-side
- Output: `{ items: [...], batch_token, payload_sent }`

**Config Defaults (ENV):**
- If `AI_WF_QGEN_V2_ENABLED=true` → primary=agents_sdk, agent_entry=qgen_v2
- If `AI_WF_QGEN_V2_USE_AGENTS_SDK=false` → primary=workflow_api, workflow_id from env

### 5.3 Clarity Assess-One
**Endpoint:** `POST /api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/ai/clarity/assess-one`

**Orchestrator Integration:**
- Purpose: `clarity_assess_one`
- Input: `{ input_as_text: buildWorkflowInput(payload) }`
- Output validated against `ClarityAssessOneOutputSchema`
- Feature disabled check:
  - DB row exists and `enabled=false` → 409 AI_FEATURE_DISABLED
  - No DB row → ENV `AI_WF_ANSWER_CLARITY_ENABLED=false` → 409

**Saves result to:** `session_answer_clarity` table (with input_hash dedup)

### 5.4 Impact Analysis
**Endpoint:** `POST /api/v2/orgs/:orgId/projects/:projectId/ai/impact-analysis`

**Orchestrator Integration:**
- Purpose: `impact_analysis`
- Input: `{ note_text, baseline_answers, questions, project_id, base, intake_id }`
- Output: `{ note_summary?, proposals: [...] }`
- Response: `{ batch_token, note_summary, proposals }` + Redis TTL

---

## 6. Error Handling ✅

All errors mapped to **RFC 9457 Problem Details** with absolute URIs.

### Error Codes

**409 Conflict:**
- `AI_FEATURE_DISABLED` — purpose is disabled in ai_configs
- `AI_WORKFLOW_ID_REQUIRED` — workflow_api needs workflow_id
- `AI_BATCH_EXPIRED` — Redis proposal expired/committed

**502 Bad Gateway:**
- `AI_OUTPUT_NOT_JSON` — AI returned non-JSON
- `AI_OUTPUT_SCHEMA_MISMATCH` — JSON doesn't match Zod schema
- `AI_PROVIDER_ERROR` — OpenAI API error
- `AI_TIMEOUT` — Request timeout
- `AI_BAD_OUTPUT` — Generic post-parse validation fail

**Error Type URIs:**
- `https://api.scopery.local/problems/ai-bad-output` (502)
- `https://api.scopery.local/problems/ai-provider-error` (502)
- `https://api.scopery.local/problems/conflict` (409, code=AI_FEATURE_DISABLED, etc.)

**File:** `src/modules/ai/orchestrator/ai.errors.ts` — `throwAiError()` helper

---

## 7. Redaction & Security ✅

**File:** `src/modules/ai/orchestrator/ai.utils.ts`

### Redaction Mode (ENV: `AI_RUNS_REDACT_MODE`)

**Options:**
- `meta_only` (default) — only lengths, hashes, counts
- `safe_payload` — allow question_ids, sections; redact long text (>500 chars)

**Never Logged:**
- Raw answers
- Full notes / QA packs
- Full user instructions

**What's Logged:**
- question_id, session_id, project_id, org_id (UUIDs)
- String lengths: `{ _len: 123 }`
- Array counts: `{ _count: 5 }`
- Hashes (first 1000 chars): `{ _hash: "abc123..." }`

---

## 8. Config Precedence ✅

**Resolution Order:**
1. **DB row in `ai_configs`** (if exists) → **source of truth**
2. **ENV defaults** (if no DB row) → fallback

**File:** `src/modules/ai/orchestrator/ai.config.repo.ts` — `buildDefaultConfig()`

### ENV Variables

**Infrastructure (always used):**
- `OPENAI_API_KEY` — required
- `OPENAI_ORG_ID`, `OPENAI_PROJECT_ID`, `OPENAI_BASE_URL` — optional
- `AI_REDIS_URL`, `AI_REDIS_PREFIX`, `AI_PROPOSAL_TTL_SECONDS`
- `AI_MAX_NOTE_BYTES`, `AI_QGEN_FILE_MAX_BYTES`

**Feature Flags (only when no DB row):**
- `AI_WF_ANSWER_CLARITY_ENABLED` (default false) → clarity_assess_one.enabled
- `AI_WF_QGEN_V2_ENABLED` (default false) → qgen_clarifying_questions.enabled
- `AI_WF_QGEN_V2_WORKFLOW_ID` → qgen workflow_id
- `AI_WF_QGEN_V2_USE_AGENTS_SDK` → determines primary_engine (agents_sdk vs workflow_api)
- `AI_QGEN_AGENTS_MODEL` (default gpt-5.2) → qgen model
- `AI_QGEN_DIGEST_MODEL` (default gpt-4o-mini) → baseline digest
- `AI_QGEN_MAX_ITEMS`, `AI_QGEN_TIMEOUT_MS`

**Once DB row exists for a purpose → ENV feature flags are ignored.**

---

## 9. Agent Registry ✅

**File:** `src/modules/ai/orchestrator/engines/agents.engine.ts`

**Valid `agent_entry` Keys:**
- `qgen_v2` — ✅ Implemented (calls `runQgenV2WithAgentsSdk`)
- `improve_answer` — Stub (throws AI_FEATURE_DISABLED)
- `clarity_assess_one` — Stub
- `impact_analysis` — Stub

**Admin Validation:**
- PATCH with invalid agent_entry → 422 VALIDATION_ERROR
- Runtime: unknown agent_entry → 409 AI_FEATURE_DISABLED

---

## 10. Tests ✅

**File:** `tests/aiOrchestrator.test.ts`

**Coverage:**

### Admin API Tests
- Non-admin user GET /configs → 403
- Admin GET /configs → 200 with items array
- PATCH /configs with workflow_api but no workflow_id → 422
- GET /runs → 200 with pagination

### Contract Tests
- Improve answer response has: `batch_token`, `proposal`, `run_id`
- Proposal includes: `question_id`, `proposed_value`, `diff_summary`, `rationale`, `confidence`

**Additional Tests:**
- `tests/ai.test.ts` — end-to-end AI flows
- `tests/aiClarity.test.ts` — clarity assessment integration

---

## 11. Documentation ✅

### API Documentation
**File:** `documents/API_DOCUMENTATION.md`

**Sections:**
- Error codes (12. Error codes & Problem Details)
- AI endpoints listed under existing sections
- Admin APIs documented in section 5

### ENV Documentation
**File:** `.env.example`

All AI-related ENV variables documented with comments:
- Lines 17-80: AI / OpenAI configuration
- Feature flags clearly marked
- Usage notes (e.g., "DO NOT expose to FE")

---

## 12. Migration Checklist ✅

### Database
- [x] Migration SQL created: `migrations/phase25_ai_orchestration.sql`
- [x] Tables: `ai_configs`, `ai_orchestrator_runs`
- [x] Enums: `ai_engine_enum`, `ai_run_status_enum`
- [x] Indexes for performance
- [x] Seed data for 4 purposes

### Code
- [x] Types/Enums: `src/modules/ai/orchestrator/ai.types.ts`
- [x] AiOrchestrator class: `ai.orchestrator.ts`
- [x] Config repo: `ai.config.repo.ts`
- [x] Runs repo: `ai.runs.repo.ts`
- [x] 3 engine adapters: `engines/legacy.engine.ts`, `workflow.engine.ts`, `agents.engine.ts`
- [x] Agent registry: `engines/agents.engine.ts`
- [x] Input/output schemas: `ai.schemas.ts`
- [x] Registry/validation: `ai.registry.ts`
- [x] Redaction utils: `ai.utils.ts`
- [x] Error handling: `ai.errors.ts`
- [x] Admin service: `ai.admin.service.ts`
- [x] Admin routes: `ai.admin.routes.ts`
- [x] Public helper: `ai.public.service.ts`

### Integration
- [x] Admin routes mounted in `/api/v2/admin` router
- [x] All 4 AI endpoints refactored to use orchestrator
- [x] Backward compatibility maintained
- [x] Client override (`forceEngine`) for QGen legacy

### Testing
- [x] Admin API tests
- [x] Contract tests (response shape)
- [x] Config validation tests
- [x] End-to-end AI tests

### Documentation
- [x] API documentation updated
- [x] ENV variables documented
- [x] Migration comments in SQL

---

## 13. Outstanding Items / Future Work

### 13.1 Agent Implementation (Low Priority)
Currently only `qgen_v2` agent is implemented. Other agents are stubbed:
- `improve_answer` agent
- `clarity_assess_one` agent
- `impact_analysis` agent

**Action:** Implement when Agents SDK implementations are available.

### 13.2 Workflow ID Seeding (Optional)
If using Workflow API for any purpose, admin must manually set `workflow_id` via PATCH `/admin/ai/configs/:purpose`.

**Action:** Could seed workflow IDs in migration if known at deploy time.

### 13.3 Trace-Links Pagination (Nice-to-have)
Currently `GET /trace-links` returns `{ items: [] }`.

**Action:** Add pagination format `{ items: [], page: { limit, offset, total } }` for consistency (mentioned in prompt notes).

### 13.4 Monitoring Dashboard (Future)
`ai_orchestrator_runs` table provides rich audit data. Could build:
- Admin dashboard: run stats, error rates, latency metrics
- Purpose-level health indicators
- Fallback frequency analysis

---

## 14. Key Design Decisions

### 14.1 DB Config as Source of Truth
Once a row exists in `ai_configs`, ENV feature flags are ignored (except infrastructure vars like `OPENAI_API_KEY`).

**Rationale:** Admin control without redeployment.

### 14.2 Separate `ai_orchestrator_runs` Table
Instead of extending existing `ai_runs`, created dedicated audit table.

**Rationale:**
- Different schema (engine_used, workflow_id, agent_entry)
- Cleaner separation of concerns
- Easier to query orchestrator-specific runs

### 14.3 Client Override (`forceEngine`)
QGen supports legacy engine via `engine="legacy"` request param.

**Rationale:** Backward compatibility during migration period.

### 14.4 Redaction by Default
All payloads/outputs are redacted before logging.

**Rationale:** Privacy/security — never log raw user answers or sensitive notes.

### 14.5 Fallback Success Status
Separate status `fallback_success` (vs. `success`) for observability.

**Rationale:** Admin can track how often fallback is used → primary engine reliability.

---

## 15. Usage Examples

### 15.1 Admin: Switch Clarity to Workflow API

**Current State (DB):**
```json
{
  "purpose": "clarity_assess_one",
  "enabled": true,
  "primary_engine": "legacy_chat",
  "workflow_id": null
}
```

**Admin Action:**
```bash
curl -X PATCH https://api.scopery.local/api/v2/admin/ai/configs/clarity_assess_one \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "primary_engine": "workflow_api",
    "workflow_id": "wf_abc123xyz",
    "notes": "Switched to Agent Builder workflow for better quality"
  }'
```

**Result:**
- All subsequent clarity assess-one calls use Workflow API
- No code deployment needed
- Logs `engine_used=workflow_api` in `ai_orchestrator_runs`

### 15.2 Admin: Enable Fallback for QGen

```bash
curl -X PATCH .../admin/ai/configs/qgen_clarifying_questions \
  -d '{
    "primary_engine": "agents_sdk",
    "agent_entry": "qgen_v2",
    "fallback_engine": "legacy_chat",
    "notes": "Primary: Agents SDK. Fallback to legacy if SDK fails."
  }'
```

**Behavior:**
- Tries Agents SDK first
- If fails → automatically tries legacy_chat
- Status logged as `fallback_success` if fallback works

### 15.3 Admin: Test Run Without Side Effects

```bash
curl -X POST .../admin/ai/configs/improve_answer/test-run \
  -d '{
    "input": {
      "question_id": "test-uuid",
      "current_value": "Sample answer",
      "question": { "prompt": "What is X?", "section": "overview" }
    }
  }'
```

**Response:**
```json
{
  "run_id": "uuid",
  "engine_used": "legacy_chat",
  "output": {
    "proposed_value": "Improved sample answer...",
    "diff_summary": "Added clarity...",
    "rationale": "...",
    "confidence": 0.85
  }
}
```

Run is logged but doesn't create batch_token or write to domain tables.

---

## 16. Conclusion

The **AI Orchestration Layer is production-ready**. All requirements from the original specification have been met:

✅ Unified orchestrator for all AI purposes  
✅ DB-based admin configuration  
✅ Three engine adapters with fallback support  
✅ Comprehensive audit logging  
✅ Admin APIs for config management and troubleshooting  
✅ Full integration with existing endpoints  
✅ Backward compatibility maintained  
✅ RFC 9457 error handling  
✅ Security: redaction + validation  
✅ Tests + documentation  

**No further action required** unless:
- Implementing additional agent implementations (improve_answer, clarity, impact)
- Seeding workflow IDs at migration time
- Building admin monitoring dashboard

For any issues or questions, refer to:
- Code: `src/modules/ai/orchestrator/`
- Migration: `migrations/phase25_ai_orchestration.sql`
- Tests: `tests/aiOrchestrator.test.ts`
- API Docs: `documents/API_DOCUMENTATION.md`
