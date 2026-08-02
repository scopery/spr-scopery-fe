# My Insights API — Contract (FE → BE)

> **Status:** FE live via **My Work composition** (no dedicated `/my-insights` BE yet)  
> **Route (FE):** `/workspace/{workspaceId}/my-insights`  
> **Nav label:** My Insights  
> **Path style:** Unversioned `/api/...`

---

## Current FE wiring

`getMyInsights()` calls existing My Work endpoints in parallel and maps to the Insights UI shape:

| Call | Window | Purpose |
|------|--------|---------|
| `GET .../my-work?window=ALL_OPEN` | open tasks | Current work, remaining, attention |
| `GET .../my-work?window=CUSTOM&dateFrom&dateTo&includeCompleted=true` | selected range | Completed count, heatmap/trend signals |
| `GET .../my-work?window=OVERDUE` | overdue | Overdue attention |
| `GET .../my-work?window=UPCOMING` | upcoming | Due soon |

Mapper: `modules/productivity/infrastructure/mappers/map-my-work-to-insights.ts`

### Derived / approximate (until dedicated BE)

- Heatmap intensity for **DONE** tasks from `completedAt` (UTC date); open-task light signal still uses `updatedAt`
- Planned vs completed weekly: planned from due/planned; completed hours from `completedAt`
- Work distribution from `estimateHours` by project
- Work health rates from open vs completed snapshot
- Consistency streaks from unique activity days (`completedAt` for DONE, else `updatedAt`)
- **AI review** hidden (`available: false`) until a real review API exists
- **Current workload** removed from UI (capacity API not wired)

---

## Future dedicated API (optional)

### `GET /api/workspaces/{workspaceId}/my-insights`

When BE ships this, switch `getMyInsights()` to call it directly and keep the same response shape in `domain/model/my-insights.ts`.

### Related

- My Work: [`MY_WORK_API_CONTRACT.md`](./MY_WORK_API_CONTRACT.md)
