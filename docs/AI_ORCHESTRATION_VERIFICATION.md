# AI Orchestration Layer — Verification Checklist

Quick verification steps to confirm the AI Orchestration Layer is working correctly.

## Pre-requisites

1. Database migration applied:

   ```bash
   # Check if tables exist
   SELECT tablename FROM pg_tables WHERE schemaname = 'public'
   AND tablename IN ('ai_configs', 'ai_orchestrator_runs');

   # Verify seed data
   SELECT purpose, enabled, primary_engine FROM ai_configs;
   ```

2. ENV variables configured (`.env`):
   ```bash
   OPENAI_API_KEY=sk-...
   AI_REDIS_URL=redis://localhost:6379  # if using Redis for batches
   ```

## Verification Tests

### 1. Admin APIs (Manual)

#### List Configs

```bash
curl -X GET http://localhost:3000/api/v2/admin/ai/configs \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected:** 200, `{ items: [ ... ] }` with 4 purposes

#### Update Config

```bash
curl -X PATCH http://localhost:3000/api/v2/admin/ai/configs/improve_answer \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "model": "gpt-4o", "notes": "Upgraded model" }'
```

**Expected:** 200, updated config row

#### Test Run

```bash
curl -X POST http://localhost:3000/api/v2/admin/ai/configs/improve_answer/test-run \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "question_id": "00000000-0000-0000-0000-000000000001",
      "current_value": "Test answer",
      "question": {
        "id": "00000000-0000-0000-0000-000000000001",
        "prompt": "What is X?",
        "section": "overview",
        "q_type": "text",
        "required": false,
        "answer_schema": { "type": "string" }
      }
    }
  }'
```

**Expected:** 200, `{ run_id, engine_used, output: { proposed_value, ... } }`

#### List Runs

```bash
curl -X GET http://localhost:3000/api/v2/admin/ai/runs?limit=10 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected:** 200, `{ items: [...], page: { limit, offset, total } }`

### 2. Automated Tests

```bash
npm test aiOrchestrator.test.ts
```

**Expected:** All tests pass

- Admin permission checks (403 for non-admin)
- Config validation (422 for workflow_api without workflow_id)
- Response contracts (batch_token, proposal, run_id)

### 3. Integration Tests

#### Improve Answer (via Orchestrator)

```bash
# 1. Create org, project, session (omitted for brevity)
# 2. Call improve answer
curl -X POST http://localhost:3000/api/v2/orgs/:orgId/projects/:projectId/sessions/:sessionId/ai/improve \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "question_id": "QUESTION_UUID",
    "current_value": "Original answer"
  }'
```

**Expected:**

- 200 response
- Body has: `batch_token`, `proposed_value`, `proposal`, `run_id`
- `proposal` has: `question_id`, `proposed_value`, `diff_summary`, `rationale`, `confidence`

**DB Check:**

```sql
SELECT purpose, engine_used, status, latency_ms
FROM ai_orchestrator_runs
WHERE purpose = 'improve_answer'
ORDER BY created_at DESC LIMIT 1;
```

**Expected:** 1 row, status = 'success' or 'fallback_success'

#### QGen Generate (Engine Param)

```bash
# Force legacy engine
curl -X POST .../ai/questions/generate \
  -d '{ "engine": "legacy", "base_session_id": "..." }'
```

**Expected:** Uses legacy_chat (check `ai_orchestrator_runs.engine_used`)

```bash
# Use config primary (agents_sdk or workflow_api)
curl -X POST .../ai/questions/generate \
  -d '{ "engine": "agentkit_v2_file", "base_session_id": "..." }'
```

**Expected:** Uses agents_sdk or workflow_api per ai_configs

#### Clarity Assess-One

```bash
curl -X POST .../sessions/:sessionId/ai/clarity/assess-one \
  -d '{
    "question_order": 1,
    "section": "overview",
    "question_text": "What is the project goal?",
    "answer_text": "Build a system",
    "q_type": "text",
    "required": true
  }'
```

**Expected:**

- 200, `{ question_order, assessment: { clarity_score, ... } }`
- OR 409 AI_FEATURE_DISABLED if disabled in ai_configs

#### Impact Analysis

```bash
curl -X POST .../projects/:projectId/ai/impact-analysis \
  -d '{
    "base": { "session_id": "..." },
    "intake": { "intake_id": "..." }
  }'
```

**Expected:**

- 200, `{ batch_token, proposals: [...] }`
- Run logged with purpose='impact_analysis'

## Validation Checks

### Config Validation

#### Missing workflow_id for workflow_api

```bash
curl -X PATCH .../admin/ai/configs/clarity_assess_one \
  -d '{ "primary_engine": "workflow_api", "workflow_id": null }'
```

**Expected:** 422 VALIDATION_ERROR, errors array mentions workflow_id

#### Invalid agent_entry

```bash
curl -X PATCH .../admin/ai/configs/improve_answer \
  -d '{ "primary_engine": "agents_sdk", "agent_entry": "invalid_key" }'
```

**Expected:** 422 VALIDATION_ERROR (agent_entry must be in registry)

### Feature Disabled Check

```sql
-- Disable clarity
UPDATE ai_configs SET enabled = false WHERE purpose = 'clarity_assess_one';
```

```bash
curl -X POST .../ai/clarity/assess-one -d '{ ... }'
```

**Expected:** 409 AI_FEATURE_DISABLED

### Fallback Test

```sql
-- Set fallback for improve_answer
UPDATE ai_configs
SET primary_engine = 'workflow_api',
    workflow_id = 'invalid_workflow_id',
    fallback_engine = 'legacy_chat'
WHERE purpose = 'improve_answer';
```

```bash
curl -X POST .../ai/improve -d '{ ... }'
```

**Expected:**

- 200 (fallback to legacy_chat works)
- `ai_orchestrator_runs.status = 'fallback_success'`
- `ai_orchestrator_runs.engine_used = 'legacy_chat'`

## Error Handling Verification

### 502 AI_OUTPUT_NOT_JSON

Use invalid workflow_id (returns non-JSON):

```sql
UPDATE ai_configs
SET primary_engine = 'workflow_api',
    workflow_id = 'wf_invalid',
    fallback_engine = null
WHERE purpose = 'improve_answer';
```

```bash
curl -X POST .../ai/improve -d '{ ... }'
```

**Expected:** 502, type contains `ai-bad-output`, code = `AI_OUTPUT_NOT_JSON` or `AI_PROVIDER_ERROR`

### 409 AI_WORKFLOW_ID_REQUIRED

Runtime check:

```sql
UPDATE ai_configs
SET primary_engine = 'workflow_api',
    workflow_id = ''
WHERE purpose = 'improve_answer';
```

```bash
curl -X POST .../ai/improve -d '{ ... }'
```

**Expected:** 409, code = `AI_WORKFLOW_ID_REQUIRED`

## Redaction Verification

```sql
SELECT
  payload_redacted,
  output_redacted
FROM ai_orchestrator_runs
ORDER BY created_at DESC LIMIT 1;
```

**Expected:**

- No raw answer text in `payload_redacted`
- Only metadata: `{ question_id: "...", current_value: { _len: 123 } }`
- No full note text
- UUIDs preserved (question_id, session_id, etc.)

## Performance Check

```sql
-- Check run latency
SELECT
  purpose,
  engine_used,
  AVG(latency_ms) as avg_ms,
  MAX(latency_ms) as max_ms,
  COUNT(*) as runs
FROM ai_orchestrator_runs
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY purpose, engine_used;
```

**Expected:**

- legacy_chat: 2-10s avg
- workflow_api: 5-20s avg (depends on workflow)
- agents_sdk: 5-30s avg (QGen v2 reasoning)

## Monitoring Queries

### Error Rate

```sql
SELECT
  purpose,
  status,
  COUNT(*) as count
FROM ai_orchestrator_runs
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY purpose, status
ORDER BY purpose, status;
```

### Fallback Usage

```sql
SELECT
  purpose,
  COUNT(*) as fallback_count
FROM ai_orchestrator_runs
WHERE status = 'fallback_success'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY purpose;
```

**Interpretation:** High fallback_count → primary engine unreliable

### Recent Failures

```sql
SELECT
  id,
  purpose,
  engine_used,
  error_code,
  error_detail,
  created_at
FROM ai_orchestrator_runs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;
```

## Conclusion

All checks passing → AI Orchestration Layer is operational.

**Common Issues:**

1. **OPENAI_API_KEY not set** → 502 AI_PROVIDER_ERROR (401 upstream)
2. **Redis not running** → Batch commit fails (improve/qgen/impact)
3. **Migration not applied** → Table not found errors
4. **workflow_id invalid** → 502 AI_PROVIDER_ERROR (404 upstream)
5. **Agents SDK not installed** → Import error (agents_sdk engine fails)

**Debug Steps:**

1. Check `ai_orchestrator_runs` for error_code and error_detail
2. Enable `AI_LOG_PROMPT=true` (dev only) for full prompt logging
3. Verify ai_configs row exists and enabled=true
4. Check admin `/runs` endpoint for recent failures
