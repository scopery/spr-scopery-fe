# Use Case Flow Scope & @Mentions — BE API Requirements

## Purpose

Support Function-scoped Use Case Flow editing:

- Screen Context picker limited to Screens linked to the UC primary Function
- `@mention` candidates limited to that Function’s Screens → Components (lazy), APIs, and Entities
- Preview out-of-scope mentions when changing primary Function (no auto-delete)

## Domain rules

1. Structured mentions require a primary Function (`USE_CASE_FUNCTION_REQUIRED` when Screen Context is set without one).
2. Mentions / Screen Context must stay within Function scope — no project-wide registry queries from these endpoints.
3. Components load lazily for the selected Screen Context (`screenId`).
4. Changing primary Function does not delete mentions; FE shows review when any would leave scope.

## Endpoints

### `GET /api/projects/{projectId}/use-cases/{useCaseId}/flow-scope`

Returns:

```json
{
  "useCaseId": "<uuid>",
  "function": { "id": "<uuid>", "code": "FN-01", "name": "Checkout" },
  "screens": [{ "id": "<uuid>", "code": "SCR-01", "name": "Cart", "componentCount": 3 }],
  "apis": [{ "id": "<uuid>", "name": "POST /cart" }],
  "entities": [{ "id": "<uuid>", "name": "Order" }]
}
```

`function` is `null` when the Use Case has no primary Function (empty lists).

### `GET /api/projects/{projectId}/use-cases/{useCaseId}/mention-options`

Query params:

| Param | Notes |
| ----- | ----- |
| `query` | Search string (mode `search` when non-empty) |
| `types` / `type` | CSV: `SCREEN,COMPONENT,API,ENTITY` |
| `screenId` | Required for useful `COMPONENT` browse/search |
| `mode` | `browse` \| `search` |
| `limit` | Default 20 |

Response: `{ items: MentionOption[], limit, mode }` where each option has `entityType`, `entityId`, `label`, optional `parentLabel` / `parentId` / `screenId`.

### `GET /api/projects/{projectId}/use-cases/{useCaseId}/primary-function-change-impact?newFunctionId=`

Returns mentions present in Flow step `contentJson` that are not in the target Function’s scope.

## Flow step writes

`POST/PATCH` flow steps: if `screenContextId` is set, primary Function must exist and the Screen must be linked via Function–Screen. Plain text / structured `contentJson` without Screen Context remains allowed for draft UCs.

## FE storage shape (`contentJson`)

```json
{
  "type": "doc",
  "content": [
    { "type": "text", "text": "User opens " },
    {
      "type": "mention",
      "attrs": {
        "entityType": "SCREEN",
        "entityId": "<uuid>",
        "label": "Cart",
        "screenId": null,
        "outOfScope": false
      }
    }
  ]
}
```

Legacy plain-string `contentJson` is still readable (treated as a single text node).
