# Structure Relations — UI Behavior (legacy form reference)

> **Implemented UI (P0):** Node-centric Relation Builder — see  
> [`STRUCTURE_RELATIONS_NODE_CENTRIC_BUILDER.md`](./STRUCTURE_RELATIONS_NODE_CENTRIC_BUILDER.md)  
> Code: `StructureRelationsPanel` + `ArchitectureNodePalette` + `RelationDropWorkspace` + `RelationInspector`

The sections below describe the previous From / Type / To form for historical reference.

---

## Previous form (superseded)

> Application Workbench → **Relations** tab (old)  
> UI: former `StructureRelationsPanel` · Hook: `useStructureRelations`

Optional links between architecture catalog nodes (Module / Screen / API / Component / Entity). **Not ownership** — ownership/structure stays on Browse + Screen structure.

---

## Model

| Field | Notes |
| --- | --- |
| `fromNodeType` / `fromNodeId` | Source architecture node (anchor-mapped type) |
| `toNodeType` / `toNodeId` | Target architecture node |
| `relationType` | `RELATED` \| `USES` \| `IMPLEMENTS` |

Nodes come from the application architecture catalog. Relation endpoints are application-scoped.

---

## Layout

1. **Header** — title “Structure relations” + short description; live count of relations.
2. **Add relation** strip — From | Type | To | **Link**.
3. **Filter bar** — **All** chip + optional “Filtered · clear” + node dropdown.
4. **List** — scrollable table-like rows: From · Type · To · Remove.

Empty state: “No structure relations yet — Pick two architecture nodes above and click Link.”

---

## Behaviors

### Load

On mount (when Relations tab is active / panel mounts):

1. `GET …/applications/{applicationId}/structure-relations`
2. Show loading until first payload (if list empty).
3. Surface list-level `error` if fetch fails.

### Prefill from Browse

If opened with `focusNodeId` (selected catalog node):

- Prefill **From** = that node.
- Prefill **filter** = that node (list shows only edges touching it).

### Add (Link)

1. User picks **From**, **Type**, **To**.
2. **To** options exclude the current **From** (no self-pick in dropdown).
3. **Link** disabled when: missing From/To, From === To, or request in flight.
4. On success (`POST`):
   - Relation appears in list (refetch / append via hook).
   - **To** cleared; **From** and **Type** kept (fast multi-link from same source).
5. On failure:
   - **422** → “Invalid relation (self-loop or bad nodes).” (or BE message)
   - **409** → “This relation already exists.”
   - Other → show API message.

### Filter

| Action | Effect |
| --- | --- |
| **All** | Show every relation for the application |
| Dropdown → node | Show edges where From **or** To equals that node |
| Click **From** label on a row | Set filter to that From node |
| Click **To** label on a row | Set filter to that To node |
| **clear** (when Filtered) | Back to All |

Filter is client-side over the loaded list.

### Remove

1. User clicks **Remove** on a row.
2. `DELETE …/structure-relations/{id}`
3. List updates (edge gone).

---

## API (app-scoped)

```
GET    /workspaces/{workspaceId}/applications/{applicationId}/structure-relations
POST   /workspaces/{workspaceId}/applications/{applicationId}/structure-relations
DELETE /workspaces/{workspaceId}/applications/{applicationId}/structure-relations/{id}
```

**POST body (conceptual):**

```json
{
  "fromNodeType": "MODULE|SCREEN|API|COMPONENT|ENTITY",
  "fromNodeId": "<uuid>",
  "toNodeType": "MODULE|SCREEN|API|COMPONENT|ENTITY",
  "toNodeId": "<uuid>",
  "relationType": "RELATED|USES|IMPLEMENTS"
}
```

---

## Flow cheat sheet

1. Load all structure-relations for the application.
2. Add: From + Type + To → **Link** → POST; clear To; keep From.
3. List scrolls; click From/To → filter to that node; All / clear / dropdown reset filter.
4. Remove → DELETE that edge and refresh list.
5. Errors: self-loop / invalid → **422**; duplicate edge → **409**.

---

## Out of scope (this tab)

- Creating / editing architecture nodes (Browse tab).
- Screen fields / actions structure (Screen detail).
- FR ↔ node anchors (Functional / FR link surfaces — separate from structure relations).
