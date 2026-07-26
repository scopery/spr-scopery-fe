# RPT-01 → Project Pulse — UI / API Mapping (P0)

> **Status:** FE implementing  
> **Date:** 2026-07-26  
> **Route:** `/workspace/:workspaceId/projects/:projectId/dashboard`  
> **Sidebar label:** Dashboard  
> **Page concept:** Project Pulse (decision-first)  
> **Related:** `WAVE4_API_CONTRACT.md` §6.1–6.3 · Wave 4 RPT-01

---

## 1. Product contract

Sidebar stays **Dashboard**. Page title is **Project Pulse**.

One continuous scroll. No tabs. No raw report cards.

Three questions the page answers:

1. Is the project healthy or in trouble?
2. What does the PM need to handle now?
3. How are plan, capacity, and cost drifting?

**Rule:** every insight answers “so what?” and offers a CTA to the correct workbench.

---

## 2. Health vocabulary (never show `UNKNOWN`)

| UI label | Internal codes accepted from BE |
|---|---|
| On track | `ON_TRACK`, `HEALTHY`, `GREEN` |
| Needs attention | `NEEDS_ATTENTION`, `WATCH`, `AMBER` |
| At risk | `AT_RISK`, `RISK`, `ORANGE` |
| Off track | `OFF_TRACK`, `CRITICAL`, `RED` |
| Insufficient data | `UNKNOWN`, `INSUFFICIENT_DATA`, missing/empty |

When Insufficient data, show **Project Setup Insights** checklist instead of fake zeros.

---

## 3. Widget ↔ API mapping

| Widget | Primary API | Report adapters (hidden) | CTA target |
|---|---|---|---|
| Executive Brief | `GET .../dashboard` + `.../dashboard/health` | — | Setup / baselines |
| Top metrics strip | `GET .../dashboard/kpis` (fallback: dashboard fields) | — | — |
| Needs Your Attention | `GET .../dashboard/attention` | `task-risk`, `capacity`, `change-impact`, `notifications` | Work / capacity / CR / RAID / traceability |
| Progress vs Plan | dashboard + `baseline-vs-current` | `schedule-risk`, `estimation` | Schedule / baselines |
| Schedule & Milestones | `schedule-risk` | — | Schedule / timeline |
| Team Capacity | `capacity` | — | Resources / capacity |
| Scope & Change | `change-impact` + dashboard CRs | `baseline-vs-current` | Change requests / functional catalog |
| Quality & Coverage | quality endpoints when available | — | Traceability / quality |
| Financial Outlook | `finance` + dashboard.finance | `quote` | Financials |
| Risks & Issues | `task-risk` + RAID when available | — | RAID |
| Recent Activity | `GET .../activity-feed` | — | Linked entity when resolvable |
| Setup empty state | derived from dashboard + reports | — | Overview / WBS / schedule / baselines |

Reports are **data sources**, not UI surfaces. Never render `N fields` / `No data` cards.

---

## 4. Typed FE shapes (P0)

```text
ProjectHealthStatus
ProjectPulseBrief
AttentionItem { id, severity, title, impact, href, actionLabel }
ProgressForecastInsight
ScheduleMilestoneInsight
CapacityInsight
ScopeChangeInsight
QualityCoverageInsight
FinancialOutlookInsight { permission: allowed | masked | unavailable }
RiskIssueInsight
ActivityTimelineItem
ProjectSetupChecklist
```

Adapters normalize untyped report `Map` payloads into these shapes. Missing fields → empty/insufficient state, not `0` masquerading as truth.

---

## 5. Permission masking

Finance:

- If `detailsRedacted` / `available === false` / HTTP 403 → widget shows permission copy.
- Do not show `$0`, blank widget, or fail the whole page.

---

## 6. P0 / P1 / P2

### P0 (this pass)

- Executive brief + health drivers (derived)
- Attention queue (API + synthesized fallback)
- Progress vs plan
- Schedule, capacity, scope/change, quality stub, finance, risks
- Meaningful activity timeline
- Setup empty state
- Finance permission mask
- Hide raw report catalog

### P1

- What changed since last visit
- Capacity heatmap / burnup charts
- Baseline vs current visual overlay
- AI Project Review + reviewable actions
- Dashboard filters (period / phase / baseline)

> **FE status (2026-07-26):** Implemented in Project Pulse UI. Heatmap/burnup/overlay adapt untyped report payloads with graceful fallbacks. “Since last visit” uses localStorage snapshot. AI review loads project recommendations when available and never auto-applies.

### P2

- Forecast confidence, scenarios, early-warning graph, shared digests

---

## 7. BE gaps (non-blocking for P0 shell)

| Gap | FE workaround | Ideal BE |
|---|---|---|
| `/health`, `/kpis`, `/attention` may be thin/untyped | Derive from `GET .../dashboard` + report adapters | Typed DTOs with drivers, narrative, severity, href hints |
| Activity feed is audit-ish | Format + group by day; hide UUID-only rows when possible | Business event feed with entity refs |
| Quality coverage not on dashboard | Show “waiting for data” until quality report wired | Dedicated coverage summary on dashboard or report |
| Attention items without CTA deep-links | FE maps severity/type → known routes | `action.href` / `entityType` + `entityId` |

---

## 8. Component tree (FE)

```text
ProjectDashboardView
├── ProjectPulseHeader
├── ProjectSetupState            (when insufficient data)
├── ProjectExecutiveBrief
├── ProjectAttentionQueue
├── ProjectProgressForecast
├── DashboardInsightGrid
│   ├── ScheduleMilestoneWidget
│   ├── CapacityWidget
│   ├── ScopeChangeWidget
│   ├── QualityCoverageWidget
│   ├── FinancialOutlookWidget
│   └── RiskIssueWidget
└── ProjectActivityTimeline
```
