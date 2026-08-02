# Screen ↔ API — Legacy Inventory (Wave 1)

Status: **documented only** — no Screen–API join table or CRUD in this wave.

## Current model (what exists)

| Link | Table / API | Meaning |
|------|-------------|---------|
| Function ↔ Screen | `app_function_screen` · `.../functional-items/{id}/screens` | Screens in Function scope |
| Function ↔ API | `app_function_api` · `.../functional-items/{id}/api-endpoints` | APIs in Function scope |
| Screen ↔ Component | `app_screen_component` | Components on a Screen |
| Function → Module → Entity | Function.`module_id` + `app_registry_data_entity.module_id` | Entity mention scope |

There is **no** first-class `Screen ↔ API` association in the registry. Flow mentions can reference SCREEN / API independently within Function scope.

## Observed usage (derived, not stored)

APIs and Screens co-appear when:

1. Both are linked to the same Function, and/or
2. A Use Case flow step mentions both in TipTap JSON under that Function.

This is **observed usage**, not ownership. Do not invent a join for MVP.

## Deferred (later waves)

- Optional Screen–API design-time inventory if product needs explicit mapping
- Ranking / co-occurrence from flow mentions (Wave 3 polish)
- Developer export that groups Screen + linked APIs from Function scope

## Decision

Keep Screen and API as **siblings under Function**. Communication Spec follows the same pattern (`app_function_communication`).
