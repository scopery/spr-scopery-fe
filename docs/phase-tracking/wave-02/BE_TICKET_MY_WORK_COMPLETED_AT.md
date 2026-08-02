# BE Ticket: My Work — expose `completedAt` for Activity heatmap

**Status:** Done  
**Priority:** High  
**Area:** Project / My Work · My Insights (Activity heatmap)  
**Related FE:** Heatmap now buckets DONE tasks by `completedAt`  
**Consumer call:** `GET /api/workspaces/{workspaceId}/my-work?window=CUSTOM&dateFrom&dateTo&includeCompleted=true`

---

## Shipped (BE)

### Response (`MyWorkTaskItem`)

Added nullable fields (no migration — columns already on `project_task`):

| Field | Type |
|-------|------|
| `completedAt` | `Instant` \| null |
| `completedBy` | `UUID` \| null |

Mapped in `MyWorkQueryService#toItem` from `t.completedAt()` / `t.completedBy()`.

### Window match (`JpaTaskRepository#buildUserSpec`)

When date range is active and `!excludeTerminal` (`includeCompleted=true`, non-OVERDUE):

fourth OR arm:

```text
completedAt IS NOT NULL
AND completedAt >= dateFrom 00:00 UTC
AND completedAt < (dateTo + 1) 00:00 UTC
```

`OVERDUE` keeps `excludeTerminal=true` / `dueDateOnly=true` — never hits this branch.

---

## FE (done after BE)

- [x] `MyWorkTaskItem` includes `completedAt` / `completedBy`
- [x] Heatmap DONE buckets use `completedAt` (not due / updated)
- [x] Planned vs completed weekly + consistency prefer `completedAt` for DONE

---

## Expect sample (DONE)

```json
{
  "status": "DONE",
  "dueDate": "2026-07-20",
  "updatedAt": "2026-07-28T10:00:00Z",
  "completedAt": "2026-07-25T09:15:00Z",
  "completedBy": "<uuid>"
}
```

Heatmap day drawer for `2026-07-25` lists this task; not `2026-07-20` (due) or `2026-07-28` (updated).
