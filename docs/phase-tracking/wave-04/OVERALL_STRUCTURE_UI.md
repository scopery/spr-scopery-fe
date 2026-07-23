# Overall Structure UI

Application Workbench **Structure** tab and Project **Application Structure** page share the same Overall Structure panel.

## Surfaces

| Surface | Route |
| --- | --- |
| Application Workbench → Structure | `/workspace/{wid}/applications/{aid}` (Structure tab) |
| Project Application Structure | `/workspace/{wid}/projects/{pid}/application-structure?applicationId=` |

Modes: **Structure** | **Canvas** | **Gaps**

## Layout (V2 §62)

```text
Structure / Canvas / Gaps area (~50%)
│
└── Contextual Assignment Dock (~50%)
    ├── Available candidates (~45%)
    └── Selected node + typed drop zones (~55%)
```

Available items sit next to drop zones. Drag does not cross the tree.

## APIs

| Concern | Endpoint family |
| --- | --- |
| Tree | `GET …/applications/{aid}/overall-structure` |
| Candidates | `GET …/overall-structure/candidates?focusType=&focusId=` |
| Function ↔ Screen / API | `…/functional-items/{fiId}/screens` / `api-endpoints` |
| Screen ↔ Component | `…/screens/{screenId}/components` |
| NFR scope | `…/non-functional-items/{nfrId}/scope-targets` |
| Module ownership | Function/Entity `moduleId` patch |

## Assign matrix

- Function → Module (move)
- Screen / API → Function (link)
- Component → Screen (link)
- Entity → Module (move)
- NFR ↔ Module / Function / Screen (scope)

Invalid pairs blocked client-side via `structure-assign.rules.ts`.

## Features in this pass

- Typed drop zones with preview labels
- Structure toolbar: search, collapse/expand, refresh
- Undo toast on assign/unlink
- Bulk select + preview assign
- Row Assign action (non-drag)
- Shared-by indicators
- Gaps unmapped tray derived from tree
- Minimal Canvas (`@xyflow`) pan/zoom/fit/minimap

## Deferred

- Semantic zoom detail levels
- Project↔Application link admin (selector lists all workspace apps)
- IAM permission split
- Functional Catalog redesign
- Display-order reorder
- NFR scope to API/Entity beyond current BE

## Legacy Relations

`StructureRelationsPanel` remains in repo but is not mounted on Workbench tabs.
