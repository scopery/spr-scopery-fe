> **Out of date (2026):** This document references code removed during Safe Dead Code Cleanup (orphan hooks/services/components). See `CLAUDE.md` for current architecture.

# FE-12 History / Audit Trail — Reuse Map

## Scan summary

- **API (from user-provided list)**: Audit — GET /api/audit — Get audit log. No documented query params → filters and pagination are client-side where applicable.
- **Routing**: Item detail uses client-side tab state (`activeTab`); no separate route for history. Tab id `history` already in TABS (phase 12).
- **Repo**: No existing audit service, audit types, or audit hooks. No Accordion/Timeline component — use Box/Stack + button for expand, vertical list for timeline.
- **Pattern**: Services use apiClient + orgHeaders (x-org-id); hooks use useState/useEffect/useCallback + manual refetch (e.g. useAcceptanceCriteria, useSnapshotList).

## Reuse map

| Có sẵn                                                 | Path                                   | Dùng cho                           |
| ------------------------------------------------------ | -------------------------------------- | ---------------------------------- |
| apiClient                                              | lib/apiClient.ts                       | audit.service                      |
| ApiResponse / ok, data, error                          | types/auth.ts, apiClient               | Service response handling          |
| orgHeaders pattern                                     | services/acceptanceCriteria.service.ts | audit.service                      |
| ROUTES.itemDetail                                      | constants/routes.ts                    | Item context (tab is in-page)      |
| Item TABS + activeTab                                  | app/items/[itemId]/page.tsx            | History tab content block          |
| Box, Stack, Typography, Button, Badge, Spinner, Select | components/                            | History tab UI                     |
| useCallback, useEffect, useState, useMemo              | —                                      | useEntityAudit + item page filters |

| Tạo mới                             | Lý do                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| AUDIT_ENDPOINTS                     | constants/endpoints.ts — GET /api/audit (API docs)                                    |
| types/audit.ts                      | AuditEvent, AuditActor, AuditQuery, AuditListResult                                   |
| services/audit.service.ts           | listAuditEvents(ctx, query?) — no UI                                                  |
| hooks/useEntityAudit.ts             | Fetch audit, filter by entity_type/entity_id client-side                              |
| Item tab History content            | Event list, filters (action, actor), expand diff/payload, banner when !auditAvailable |
| Document page History block         | useEntityAudit(orgId, 'document', documentId) — same UI pattern                       |
| Version baseline page History block | useEntityAudit(orgId, 'version', versionId) — same UI pattern                         |
| docs/FE-12-REUSE-MAP.md             | This file                                                                             |

## BE contract (detected)

- **GET /api/audit** — Get audit log. Query params not documented; service sends optional limit/offset. Filter by entity_type/entity_id done client-side in useEntityAudit.
- Response: assume array or `{ data?: T[], meta?: { total?, limit?, offset? } }`; service normalizes.

## QA checklist

- [x] Reuse Map accurate; no duplicate constants/services/types
- [x] No fetch/axios in UI; all via audit.service + useEntityAudit
- [x] Endpoints in constants (AUDIT_ENDPOINTS.list)
- [x] Service uses apiClient + org headers; throws on !ok
- [x] History tab follows existing tab routing (activeTab === 'history')
- [x] Filters client-side only (action, actor); no invented query params
- [x] Banner "History not available yet" when endpoint fails / listAvailable false
- [x] No new dependencies
