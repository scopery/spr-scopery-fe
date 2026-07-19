# Wave 5 — Contract Lock (W5-A)

> Locked: 2026-07-19  
> Sources: `WAVE5_API_CONTRACT.md` + `SCOPERY_WAVE5_API_COVERAGE_REGISTER.csv`

## Reconciliation

| Source | Endpoint count |
|---|---:|
| `WAVE5_API_CONTRACT.md` (method/path table rows) | **102** |
| `SCOPERY_WAVE5_API_COVERAGE_REGISTER.csv` | **102** |
| Live OpenAPI `http://localhost:8080/v3/api-docs` | **unavailable** (connection refused at lock time) |

**Rule:** Wave 5 FE treats contract + CSV as SoT until a live OpenAPI snapshot is exported and hashed into this file.

When BE is up:

```bash
npm run wave5:openapi
# writes docs/phase-tracking/wave-05/openapi-wave5-snapshot.json
# then record sha256 below
```

| Field | Value |
|---|---|
| OpenAPI snapshot file | _(pending)_ `openapi-wave5-snapshot.json` |
| OpenAPI sha256 | _(pending)_ — last `npm run wave5:openapi` failed (connection refused / reset) |
| Contract path prefixes | AI Assistant `/api/v1/ai-assistant`, AI Agent `/api/ai-agent` |

## Prefix lock

- Do **not** rewrite `/api/ai-agent` → `/api/v1/ai-agent`.
- Do **not** drop required headers `X-Actor-Id` / `X-Workspace-Id` on AI Assistant.
- CSRF: `X-XSRF-TOKEN` from cookie `XSRF-TOKEN` on unsafe REST (already in `apiClient`).

## SSE transport decision (W5-GAP-01 / W5-GAP-02)

| Option | Verdict |
|---|---|
| Native `EventSource` | Rejected for Wave 5 primary path — cannot reliably set arbitrary `Last-Event-ID` + custom headers in all browsers |
| Fetch-based `shared/lib/sseClient` | **Adopted** — `credentials: 'include'`, inject AI Assistant headers, send `Last-Event-ID` on reconnect |

Spike status: client hardened in W5-A; live cookie/CORS validation remains required against running BE before W5-C gate closes.

## Service-orchestrated endpoints (browser must not call)

```text
POST  /api/ai-agent/execution-logs
PATCH /api/ai-agent/execution-logs/{id}/running
PATCH /api/ai-agent/execution-logs/{id}/succeeded
PATCH /api/ai-agent/execution-logs/{id}/failed
PATCH /api/ai-agent/execution-logs/{id}/cancel
```

## IAM permissions (W5-GAP-14 — provisional)

Catalog locked in FE as `WAVE5_AI_PERMISSIONS` / `PERMISSIONS` Wave 5 keys.
Exact BE strings may change when IAM catalog is confirmed — update both in one PR.
