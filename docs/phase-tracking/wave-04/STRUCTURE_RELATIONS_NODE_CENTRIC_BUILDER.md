# Structure Relations — Node-centric Relation Builder (target UX)

> Application Workbench → **Relations** tab  
> Replaces the current From / Type / To form as the primary create UX.  
> Current behavior (legacy form): [`STRUCTURE_RELATIONS_BEHAVIOR.md`](./STRUCTURE_RELATIONS_BEHAVIOR.md)

**Product model (unchanged):** Module / Screen / API / Component / Entity remain independent catalog nodes. Structure relations are optional. Do **not** imply Module owns Screen.

**P0 lock-in:** Focused node + searchable palette + three drop lanes (`USES` / `IMPLEMENTS` / `RELATED`) + multi-select bulk link + incoming/outgoing lists. Free-form graph is **not** P0 — optional later as **Relation Map** (view-only / focus navigation).

---

## 1. Three-pane layout

```text
┌─────────────────────┬────────────────────────────────┬──────────────────────┐
│ Architecture nodes  │ Relation workspace             │ Relation inspector   │
│                     │                                │                      │
│ Search…             │ Selected / focus node          │ Relation type        │
│                     │                                │ From / To            │
│ Modules             │ Drop lanes + existing          │ [Remove relation]    │
│ Screens             │ incoming / outgoing            │                      │
│ APIs                │                                │                      │
│ Components          │                                │                      │
│ Entities            │                                │                      │
└─────────────────────┴────────────────────────────────┴──────────────────────┘
```

| Pane | Role |
| --- | --- |
| Left — **Architecture node palette** | Search, type filters, multi-select, drag source |
| Center — **Relation workspace** | Focus node, drop lanes, incoming/outgoing groups |
| Right — **Relation inspector** | Selected edge details + remove / actions |

Modes (secondary):

```text
[List Builder]  [Relation Map]
```

- **List Builder** (P0 default): create, remove, bulk link, search, filter, day-to-day management.
- **Relation Map** (later): overview, related-node analysis, click-to-focus. Not the primary create tool.

---

## 2. Primary flow

### Step 1 — Choose focus node

User picks a node from Browse or Relations. That node becomes `focusNode`.

If Relations opens with `focusNodeId` from Browse, auto-select that node.

```text
Login Page
SCREEN · SCR-LOGIN
```

### Step 2 — Relation type stays sticky

Segmented control (or drop lanes — see §8):

```text
[Uses] [Implements] [Related]
```

Type persists after each link so mapping Screen → many APIs does not require re-picking From / Type / To.

### Step 3 — Attach targets quickly

Users can:

- Drag from left palette into the center workspace / focus node / a type lane.
- Multi-select nodes then **Link N items**.
- Double-click a node to link with the active relation type (and current direction).

Conceptual result:

```text
Login Page
    │
    ├── USES → POST /api/auth/login
    ├── USES → Auth Form
    └── USES → User Entity
```

---

## 3. Drag-and-drop feedback

### Dragging card

```text
┌────────────────────────────┐
│ API                        │
│ POST /api/auth/login       │
│ Login Endpoint             │
└────────────────────────────┘
```

### Valid drop zone

```text
┌──────────────────────────────────────────┐
│ Drop here to link with Login Page        │
│ Relation: USES                           │
└──────────────────────────────────────────┘
```

### Invalid (prefer before drop when FE has enough data)

```text
Cannot link a node to itself
This USES relation already exists
```

Do not wait for the server round-trip when self-loop / duplicate can be detected client-side.

---

## 4. Why not a free graph as primary UI

A free canvas (`Module ─ Screen ─ API ─ Entity ─ Component`) gets noisy at scale. Graph is a **secondary** view for overview and analysis, not for creating every edge by drawing wires.

---

## 5. Node-centric workspace (incoming / outgoing)

With focus = `Login Page`:

```text
Login Page
SCREEN · SCR-LOGIN

Outgoing relations
USES
├── POST /api/auth/login
├── Auth Form
└── User Entity
IMPLEMENTS
└── Authentication Module
RELATED
└── Reset Password Page

Incoming relations
IMPLEMENTS
└── Auth Component
```

API stores directed `fromNode` / `toNode`. UI must split:

| Group | Meaning |
| --- | --- |
| **Outgoing** | `focusNode` is **From** |
| **Incoming** | `focusNode` is **To** |

Critical for `USES` and `IMPLEMENTS` semantics.

---

## 6. Bulk relation

### Multi-select + action bar

```text
3 selected
Relation: USES
Source: Login Page
[Link selected]
```

Result summary:

```text
3 linked · 0 skipped · 0 failed
```

### FE with current single-create API

1. Queue one `POST` per relation.
2. Cap concurrency (e.g. 3–5).
3. Aggregate results.
4. Treat **409** as **skipped**.
5. Surface other failures per item.

### Preferred BE addition

```http
POST /workspaces/{workspaceId}/applications/{applicationId}/structure-relations/batch
```

```json
{
  "relations": [
    {
      "fromNodeType": "SCREEN",
      "fromNodeId": "screen-id",
      "toNodeType": "API",
      "toNodeId": "api-1",
      "relationType": "USES"
    }
  ]
}
```

```json
{
  "created": 2,
  "skipped": 0,
  "failed": 0,
  "items": []
}
```

---

## 7. Direction

Relations are directed. UI must not infer direction from drag gesture alone.

**Default:** focus node is **source** (From).

```text
Login Page → USES → POST /api/auth/login
```

**Explicit direction control:**

```text
● Focus node uses target
○ Target uses focus node
```

Or a clear reverse control next to the preview edge.

### RELATED

May display as symmetric in UX:

```text
Login Page ↔ Reset Password Page
```

Backend still stores one `from` / `to` row. UI (+ BE if needed) must normalize so both of these are not allowed as duplicates:

```text
A RELATED B
B RELATED A
```

---

## 8. Drop lanes (faster type selection)

```text
┌──────────────────────────────────┐
│ USES                             │
│ Drop APIs, components or entities│
└──────────────────────────────────┘
┌──────────────────────────────────┐
│ IMPLEMENTS                       │
│ Drop architecture nodes          │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│ RELATED                          │
│ Drop any related node            │
└──────────────────────────────────┘
```

Lane sets relation type for that drop (no pre-select required).

Mobile / non-pointer still needs a menu:

```text
Link to Login Page
├── Uses
├── Implements
└── Related
```

---

## 9. Search and palette

Unified search:

```text
Search code, name, route, path or table…
```

Groups: Recent · Modules · Screens · API endpoints · Components · Data entities.

Filters:

```text
[All] [Module] [Screen] [API] [Component] [Entity]
[Unlinked only]
```

Already linked for current type:

```text
POST /api/auth/login             Linked · USES
```

(Show but disable for that type, or allow other types.)

---

## 10. Relation card

Prefer richer cards over plain text rows:

```text
┌──────────────────────────────────────────────────────────┐
│ Login Page                 USES       POST /api/auth/login│
│ SCREEN · SCR-LOGIN                    API · ACTIVE        │
│ Created by … · 5 minutes ago                          ••• │
└──────────────────────────────────────────────────────────┘
```

Menu: Open source · Open target · Reverse direction · Change relation type · Remove.

**Today:** no update API → reverse / change type = `DELETE` old + `POST` new.

**Preferred:**

```http
PUT /workspaces/.../structure-relations/{relationId}
```

---

## 11. Undo (explicit toast only)

After create:

```text
Linked Login Page to POST /api/auth/login  [Undo]
```

Undo → `DELETE` that id.

After remove:

```text
Relation removed  [Undo]
```

Undo → `POST` from snapshot. Toast ~5–8s.

Do **not** use global Ctrl/Cmd+Z for server mutations.

---

## 12. Bulk remove

In focus workspace, multi-select edges → **Remove relations**.

With current API: DELETE per id, show progress, aggregate succeeded/failed; do not optimistic-wipe UI before confirmation. Prefer batch delete when volume grows.

---

## 13. Focus chip and navigation

Keep All / Filtered / Clear semantics, surfaced as:

```text
Focused node
[SCREEN · Login Page ×]
```

Click a related node → that node becomes focus (full inbound/outbound for it).

Small history:

```text
← Login Page
```

---

## 14. Accessibility (DnD is not the only path)

Node menu:

```text
•••
├── Link to focused node → Uses / Implements / Related
├── Open details
└── Copy code
```

Keyboard (proposed):

| Key | Action |
| --- | --- |
| Space | Select node |
| Enter | Open node |
| Ctrl/Cmd+Enter | Link selected |
| Esc | Cancel drag / selection |
| Arrows | Navigate list |

Announce: “POST /api/auth/login linked to Login Page using USES.”

---

## 15. Mobile

No drag-first flow. Use:

```text
Focus node → Add relation → Search/select targets → Type → Link N
```

Drag is a desktop/tablet enhancement.

---

## 16. Component map (P0-oriented)

```text
StructureRelationsPanel
├── RelationWorkbenchHeader
├── FocusNodeSelector
├── RelationDirectionControl
├── RelationTypeSegmentedControl
├── ArchitectureNodePalette
│   ├── UnifiedNodeSearch
│   ├── NodeTypeFilters
│   ├── ArchitectureNodeCard
│   └── MultiSelectActionBar
├── RelationDropWorkspace
│   ├── UsesDropLane
│   ├── ImplementsDropLane
│   ├── RelatedDropLane
│   ├── DragOverlay
│   └── DropIndicator
├── FocusNodeRelations
│   ├── IncomingRelationGroup
│   ├── OutgoingRelationGroup
│   └── RelationCard
├── RelationInspector
├── LinkRelationDialog
├── BulkLinkProgressDialog
├── RemoveRelationDialog
└── RelationUndoToast
```

No graph library in P0.

---

## 17. Hook surface

```text
useStructureRelations
├── relations
├── isInitialLoading
├── error
├── focusNode / setFocusNode()
├── filteredRelations
├── incomingRelations / outgoingRelations
├── linkRelation() / linkRelations()
├── removeRelation() / removeRelations()
├── isLinking / isRemoving
└── refetch()
```

Local UI state: `selectedNodeIds`, `activeRelationType`, `direction`, `draggedNode`, `dropTarget`, `bulkProgress`.

---

## 18. Single drag create flow

```text
Choose focus (e.g. Login Page)
→ active type = USES (or drop into USES lane)
→ drag target into lane
→ FE guards: no self-loop, no duplicate, node in catalog
→ optional preview: Login Page → USES → target
→ POST
→ success: update cache, keep focus + type, Undo toast
→ error: 409 / 422, restore drag UI
```

Single drag may skip confirmation for speed. Sensitive types / project setting can require confirm.

---

## 19. Required test cases

- Prefill focus from Browse  
- Drop into USES / IMPLEMENTS / RELATED lanes  
- Prevent self-loop; prevent duplicate; RELATED reverse-duplicate  
- Direction switch  
- Single link success / 409 / 422  
- Bulk link mixed success / skipped / failed  
- Remove; Undo create; Undo remove  
- Click source/target changes focus  
- Filter All / Clear; search; type filter  
- Incoming / outgoing grouping  
- Keyboard link; SR announcement  
- Mobile non-drag flow  
- Network failure rollback; permission revoked mid-drag  

---

## API gaps (for BE)

| Need | Why |
| --- | --- |
| `POST …/structure-relations/batch` | Bulk link without N round-trips |
| Batch delete | Bulk remove at scale |
| `PUT/PATCH …/structure-relations/{id}` | Atomic reverse / change type |
| RELATED undirected uniqueness | Block `A↔B` + `B↔A` duplicates |

P0 FE can ship on existing single POST/DELETE with client-side queue + 409→skipped.

---

## Decision summary

| Do in P0 | Defer |
| --- | --- |
| Focus node workspace | Free graph create canvas |
| Palette + search + filters | Graph as primary tool |
| Three drop lanes | Heavy confirmation on every USES drag |
| Bulk multi-select link | Batch API (nice-to-have; queue first) |
| Incoming / outgoing lists | Full Relation Map mode |
| Undo toast | Global Ctrl+Z |
| Keyboard / mobile non-drag | DnD-only flows |
