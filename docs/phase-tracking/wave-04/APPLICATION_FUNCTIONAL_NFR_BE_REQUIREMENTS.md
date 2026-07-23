# Application Functional Items, NFR & Structure Links — BE Requirements

> **Status:** Proposed for BE implementation  
> **Date:** 2026-07-22  
> **Owner:** FE (Scopery) → handoff to BE  
> **Related BRD:** `docs/BUSINESS_REQUIREMENTS.md` §§15.4, 21 (`FR-APP-003`, `FR-APP-004`, `FR-APP-005`, `BR-APP-004`, `BR-APP-005`)  
> **Related contract:** `docs/phase-tracking/wave-04/WAVE4_API_CONTRACT.md` §14  
> **Swagger checked:** `http://localhost:8080/v3/api-docs` (2026-07-22)

---

## 1. Problem / gap

### Already implemented (OK)

Workspace Application Registry structure APIs exist and FE workbench consumes them:

- Applications, Modules, Screens, Screen Sections/Fields/Actions
- API Endpoints, Components, Data Entities

Base: `/api/workspaces/{workspaceId}/applications/...`

### Missing (this request)

BRD requires **long-lived functional / non-functional catalog under application structure nodes**, plus links to delivery artifacts. Today BE only has:

| Existing | Limitation |
|---|---|
| `POST/GET /api/projects/{projectId}/requirements` | Project-scoped; optional `applicationId` only — **no** `moduleId` / `screenId` / structure anchor |
| `requirementType` = `FUNCTIONAL` \| `NON_FUNCTIONAL` \| `BUSINESS` \| … | Types exist, but items are **not** first-class children of Application Registry |
| `POST/GET /api/projects/{projectId}/trace-links` | Can link arbitrary types as strings, but **no documented/enforced** app-structure entity types |

FE cannot build:

1. Functional Item under Module / Screen  
2. NFR scoped to Application / Module / Screen / Project  
3. Business Rule attached to a function or structure node  
4. Traceability from structure node → FR/NFR → work item / test / document  

---

## 2. Goals

1. Persist **Functional Items** as Application Registry catalog entities (workspace-scoped, long-lived).  
2. Persist **Non-functional Items (NFR)** with explicit scope (application / module / screen / project).  
3. Persist **Business Rules** attachable to functional items and/or structure nodes.  
4. Support **structure anchors** (which module/screen/API/… the item belongs to).  
5. Support **per-item custom properties** (FE “+” to add extra fields beyond fixed schema, unique per function).  
6. Extend **trace-links** (or dedicated link APIs) so FE can connect FR/NFR/rule ↔ structure ↔ project delivery artifacts.  
7. Keep compatibility with existing project `requirements` (delivery) — do **not** replace them; clarify relationship.

### Non-goals (this slice)

- Full AI generation of FR/NFR  
- Coverage matrix redesign  
- Changing existing module/screen/API CRUD contracts  

---

## 3. Domain model (proposed)

```text
Workspace
└─ Application                          (existing)
   ├─ Module / Screen / API / …         (existing structure)
   ├─ FunctionalItem                    (NEW — catalog)
   │    ├─ anchors → Module | Screen | API | Action | … (1..n)
   │    ├─ BusinessRule[]               (NEW — optional child or linked)
   │    └─ links → Project Requirement / Work Item / Test / Doc (via trace)
   └─ NonFunctionalItem                 (NEW — catalog)
        ├─ scopeType + scopeId
        └─ links → same via trace
```

### Relationship to Project Requirements

| Concept | Lifetime | Home | Purpose |
|---|---|---|---|
| **FunctionalItem / NFR / BusinessRule** | Long-lived with Application | Workspace Application Registry | Product capability map |
| **Requirement** (existing) | Delivery / project | Project | What this project commits to deliver |
| **Trace link** | Either | Project (existing) + optionally workspace | Connect catalog ↔ delivery |

**Recommended rule:** Project Requirement **may reference** a FunctionalItem / NFR via:

- `functionalItemId` / `nonFunctionalItemId` on create/update requirement, **or**
- trace-link `REQUIREMENT` → `FUNCTIONAL_ITEM` / `NON_FUNCTIONAL_ITEM`

Prefer adding optional FKs on Requirement **and** documenting trace entity types (both OK; FK is better for UI pickers).

---

## 4. Enums

### 4.1 Functional item

```text
FunctionalItemStatus: DRAFT | ACTIVE | DEPRECATED | ARCHIVED
FunctionalItemPriority: LOW | MEDIUM | HIGH | CRITICAL
```

### 4.2 NFR

```text
NonFunctionalCategory:
  PERFORMANCE | SECURITY | SCALABILITY | AVAILABILITY | ACCESSIBILITY
  | USABILITY | COMPLIANCE | AUDITABILITY | MAINTAINABILITY
  | OBSERVABILITY | DATA_RETENTION | BACKUP_RECOVERY | OTHER

NfrScopeType:
  APPLICATION | MODULE | SCREEN | API_ENDPOINT | PROJECT

NonFunctionalItemStatus: DRAFT | ACTIVE | DEPRECATED | ARCHIVED
```

### 4.3 Business rule

```text
BusinessRuleStatus: DRAFT | ACTIVE | DEPRECATED | ARCHIVED
BusinessRuleSeverity: INFO | WARNING | BLOCKING
```

### 4.4 Structure anchor (shared)

```text
AppStructureNodeType:
  APPLICATION | MODULE | SCREEN | SCREEN_SECTION | SCREEN_FIELD
  | SCREEN_ACTION | API_ENDPOINT | COMPONENT | DATA_ENTITY
```

### 4.5 Trace entity / link extensions (document + validate)

Extend allowed `sourceType` / `targetType` (or dedicated registry) with at least:

```text
FUNCTIONAL_ITEM | NON_FUNCTIONAL_ITEM | BUSINESS_RULE
| APPLICATION | APP_MODULE | SCREEN | API_ENDPOINT | DATA_ENTITY | APP_COMPONENT
| SCREEN_SECTION | SCREEN_FIELD | SCREEN_ACTION
```

Extend `linkType` (additive):

```text
REALIZED_BY          # FR → Screen / Action / API
CONSTRAINED_BY       # FR → BusinessRule | NFR → structure
COVERS               # Requirement → FunctionalItem / NFR
IMPLEMENTED_BY       # existing
TESTED_BY            # existing
DERIVED_FROM         # existing
DOCUMENTED_BY        # item → Document
```

---

## 5. API contract (proposed)

> Path style: match live BE (`/api/workspaces/...`, unversioned) — same as current Application Registry.  
> Envelope: existing `ApiResponse<T>` / list unwrap as today.

### 5.1 Functional Items

**Base:** `/api/workspaces/{workspaceId}/applications/{applicationId}/functional-items`

| Method | Path | Description |
|---|---|---|
| `POST` | `.../functional-items` | Create |
| `GET` | `.../functional-items` | List (filter below) |
| `GET` | `.../functional-items/{functionalItemId}` | Get |
| `PUT` | `.../functional-items/{functionalItemId}` | Update |
| `DELETE` | `.../functional-items/{functionalItemId}` | Soft-delete/archive preferred over hard delete if linked |

**Query filters (list):**

- `status`
- `priority`
- `q` (code/title)
- `anchorType` + `anchorId` (items attached to a node)
- `moduleId` / `screenId` convenience filters if implemented as columns

**POST body**

```json
{
  "code": "FR-CART-01",
  "title": "Add item to cart",
  "description": "Buyer can add an active SKU to the cart.",
  "actor": "Buyer",
  "businessValue": "Enable purchase funnel",
  "expectedBehavior": "Item appears in cart with qty=1 or incremented.",
  "acceptanceCriteria": [
    "Only ACTIVE SKUs can be added",
    "Cart line count cannot exceed 50"
  ],
  "customProperties": [
    {
      "key": "persona",
      "label": "Primary persona",
      "fieldType": "TEXT",
      "value": "Buyer"
    },
    {
      "key": "sla_minutes",
      "label": "Target SLA (minutes)",
      "fieldType": "NUMBER",
      "value": "5"
    }
  ],
  "priority": "HIGH",
  "ownerUserId": "<uuid|null>",
  "anchors": [
    { "nodeType": "MODULE", "nodeId": "<moduleUuid>" },
    { "nodeType": "SCREEN", "nodeId": "<screenUuid>" },
    { "nodeType": "SCREEN_ACTION", "nodeId": "<actionUuid>" },
    { "nodeType": "API_ENDPOINT", "nodeId": "<endpointUuid>" }
  ]
}
```

**Rules**

- `code` unique per application  
- At least **one** anchor required on create (recommend)  
- All `nodeId` must belong to the same `applicationId` / workspace  
- `acceptanceCriteria`: `string[]` OK for MVP; structured AC entities optional later  
- `customProperties`: see §5.1.1 — **per-item**, ad-hoc fields (FE “+” button), not limited to fixed schema  

**Response (core fields)**

```json
{
  "id": "<uuid>",
  "workspaceId": "<uuid>",
  "applicationId": "<uuid>",
  "code": "FR-CART-01",
  "title": "Add item to cart",
  "description": "...",
  "actor": "Buyer",
  "businessValue": "...",
  "expectedBehavior": "...",
  "acceptanceCriteria": ["..."],
  "customProperties": [
    {
      "id": "<uuid>",
      "key": "persona",
      "label": "Primary persona",
      "fieldType": "TEXT",
      "value": "Buyer",
      "displayOrder": 0
    }
  ],
  "priority": "HIGH",
  "status": "ACTIVE",
  "ownerUserId": null,
  "anchors": [
    { "nodeType": "SCREEN", "nodeId": "<uuid>", "nodeCode": "CART_VIEW", "nodeName": "Cart" }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Nested anchors management (optional if PUT replaces full anchors):**

| Method | Path |
|---|---|
| `PUT` | `.../functional-items/{id}/anchors` | Replace anchors set |
| `GET` | `.../functional-items/{id}/anchors` | List anchors |

#### 5.1.1 Custom properties (per functional item) — FE “+” fields

**Product intent**

Fixed fields (`title`, `actor`, `acceptanceCriteria`, …) are not enough. On the Functional Item detail UI, user can press **`+`** to add **extra properties unique to that function** (e.g. persona, SLA, source chapter, regulatory tag). Different FRs may have different custom fields.

This is **instance-level ad-hoc metadata**, not a global workspace field catalog (MVP).

**Shape**

```text
CustomProperty:
  id?: uuid                 # assigned by BE on create
  key: string               # stable machine key, unique within the item
  label: string             # UI label
  fieldType: TEXT | TEXTAREA | NUMBER | BOOLEAN | DATE | URL | SELECT
  value: string | null      # store as string; FE casts by fieldType
  options?: string[]        # required when fieldType=SELECT
  displayOrder?: number
```

**API options (pick one; A preferred for FE “+” UX)**

**Option A — embed on create/update (simplest)**

- Include `customProperties[]` on `POST` / `PUT` functional-item  
- `PUT` **replaces** the full list (or use merge semantics — document clearly)  
- Empty array clears all custom properties  

**Option B — nested CRUD (better for frequent edits without rewriting whole FR)**

**Base:** `.../functional-items/{functionalItemId}/custom-properties`

| Method | Path | Description |
|---|---|---|
| `GET` | `.../custom-properties` | List |
| `POST` | `.../custom-properties` | Add one property (FE “+”) |
| `PUT` | `.../custom-properties/{propertyId}` | Update label/type/value/order |
| `DELETE` | `.../custom-properties/{propertyId}` | Remove |

**POST one property**

```json
{
  "key": "regulatory_tag",
  "label": "Regulatory tag",
  "fieldType": "SELECT",
  "value": "PCI",
  "options": ["PCI", "GDPR", "NONE"],
  "displayOrder": 3
}
```

**Rules**

- `key` unique per functional item (case-insensitive recommend)  
- Reserved keys must not collide with core fields: `code`, `title`, `description`, `actor`, `priority`, `status`, `acceptanceCriteria`, …  
- `key` pattern: `^[a-z][a-z0-9_]{1,63}$`  
- Max properties per item: e.g. **50** (configurable)  
- Max `value` length: e.g. **4000** chars  
- Deleting FR cascades delete its custom properties  

**Same capability should apply to NFR and Business Rule (optional but recommended)** using the same `customProperties` shape / nested routes under those resources — FE will reuse the “+” control.

**Out of scope for this MVP**

- Shared field definitions across all FRs in the application (template library)  
- Reusing global Custom Field Definition service — can map later if desired  

---

### 5.2 Non-functional Items (NFR)

**Base:** `/api/workspaces/{workspaceId}/applications/{applicationId}/non-functional-items`

| Method | Path | Description |
|---|---|---|
| `POST` | `.../non-functional-items` | Create |
| `GET` | `.../non-functional-items` | List |
| `GET` | `.../non-functional-items/{nfrId}` | Get |
| `PUT` | `.../non-functional-items/{nfrId}` | Update |
| `DELETE` | `.../non-functional-items/{nfrId}` | Archive/delete |

**POST body**

```json
{
  "code": "NFR-PERF-01",
  "title": "Cart read latency",
  "description": "Cart GET must meet p95 latency target.",
  "category": "PERFORMANCE",
  "scopeType": "API_ENDPOINT",
  "scopeId": "<apiEndpointUuid>",
  "metric": "latency_p95_ms",
  "targetValue": "200",
  "priority": "HIGH"
}
```

**Rules**

- `code` unique per application  
- `scopeType` + `scopeId` required  
- If `scopeType=APPLICATION`, `scopeId` must equal `applicationId`  
- If `scopeType=PROJECT`, `scopeId` is a project UUID in the same workspace (cross-check membership)  
- Other scope types must resolve to structure nodes of this application  

---

### 5.3 Business Rules

**Option A (preferred for MVP):** nested under functional item  
**Option B:** top-level under application with optional `functionalItemId`

**Base (Option A):**  
`/api/workspaces/{workspaceId}/applications/{applicationId}/functional-items/{functionalItemId}/business-rules`

| Method | Path |
|---|---|
| `POST` | `.../business-rules` |
| `GET` | `.../business-rules` |
| `GET` | `.../business-rules/{ruleId}` |
| `PUT` | `.../business-rules/{ruleId}` |
| `DELETE` | `.../business-rules/{ruleId}` |

**POST body**

```json
{
  "code": "BR-CART-02",
  "title": "Max 50 lines per cart",
  "description": "Reject add-to-cart when cart already has 50 lines.",
  "severity": "BLOCKING",
  "expression": "cart.lineCount < 50"
}
```

`expression` optional free-text for MVP (not evaluated by engine).

**Also allow** optional direct anchors on the rule (when rule applies to API/screen without FR):

```json
{
  "code": "BR-IAM-01",
  "title": "Checkout requires authenticated buyer",
  "severity": "BLOCKING",
  "anchors": [{ "nodeType": "SCREEN", "nodeId": "<checkoutScreenId>" }]
}
```

If using Option A only, put cross-cutting rules as NFR `COMPLIANCE` / `SECURITY` or Option B top-level.

---

### 5.4 Convenience: list by structure node

FE workbench needs “open Screen X → show FRs/NFRs for this screen”.

```http
GET /api/workspaces/{workspaceId}/applications/{applicationId}/structure-links
  ?nodeType=SCREEN&nodeId={screenId}
```

**Response**

```json
{
  "functionalItems": [ /* summary */ ],
  "nonFunctionalItems": [ /* summary */ ],
  "businessRules": [ /* summary */ ]
}
```

Alternatively FE can filter list endpoints with `anchorType`/`anchorId` — dedicated endpoint is nicer for one round-trip.

---

### 5.5 Project Requirement extensions (additive)

Update existing:

`POST/PATCH /api/projects/{projectId}/requirements`

Add optional fields:

```json
{
  "applicationId": "<uuid>",
  "functionalItemId": "<uuid|null>",
  "nonFunctionalItemId": "<uuid|null>",
  "primaryAnchor": {
    "nodeType": "SCREEN",
    "nodeId": "<uuid>"
  }
}
```

Validation: if set, IDs must exist and application must be reachable from project workspace.

---

### 5.6 Trace Links — validation hardening

Existing: `/api/projects/{projectId}/trace-links`

Please:

1. Document allowed `sourceType` / `targetType` / `linkType` in OpenAPI enums (or shared const).  
2. Validate UUID existence for Application Registry types when used.  
3. Support examples:

```json
{
  "sourceType": "FUNCTIONAL_ITEM",
  "sourceId": "<frUuid>",
  "targetType": "SCREEN",
  "targetId": "<screenUuid>",
  "linkType": "REALIZED_BY"
}
```

```json
{
  "sourceType": "REQUIREMENT",
  "sourceId": "<reqUuid>",
  "targetType": "FUNCTIONAL_ITEM",
  "targetId": "<frUuid>",
  "linkType": "COVERS"
}
```

```json
{
  "sourceType": "FUNCTIONAL_ITEM",
  "sourceId": "<frUuid>",
  "targetType": "TASK",
  "targetId": "<taskUuid>",
  "linkType": "IMPLEMENTED_BY"
}
```

---

## 6. Permissions (suggested)

Align with BRD Application Owner Policy:

| Action | Suggested permission / capability |
|---|---|
| View catalog | `APPLICATION_VIEW` |
| Manage functional items | `APPLICATION_MANAGE_FUNCTIONAL_ITEM` |
| Manage NFR | `APPLICATION_MANAGE_NON_FUNCTIONAL_ITEM` |
| Manage business rules | `APPLICATION_MANAGE_BUSINESS_RULE` (or reuse functional manage) |
| Link / trace | existing project trace permissions + app view |

Return `403` with stable error code when missing grant.

---

## 7. Error cases

| Case | HTTP | Code (example) |
|---|---|---|
| Duplicate `code` in application | 409 | `APP_ITEM_CODE_CONFLICT` |
| Anchor node not in application | 422 | `APP_ANCHOR_INVALID` |
| Delete FR linked to requirements/work items | 409 | `APP_ITEM_IN_USE` (prefer archive) |
| Invalid `scopeType`/`scopeId` pair | 422 | `NFR_SCOPE_INVALID` |
| Duplicate custom property `key` on same item | 409 | `APP_CUSTOM_PROPERTY_KEY_CONFLICT` |
| Reserved / invalid custom property `key` | 422 | `APP_CUSTOM_PROPERTY_KEY_INVALID` |
| Too many custom properties | 422 | `APP_CUSTOM_PROPERTY_LIMIT` |
| Unknown enum | 400 | validation |

---

## 8. Acceptance criteria (BE)

```gherkin
Given an application with module CART and screen CART_VIEW
When client creates functional item FR-CART-01 anchored to SCREEN CART_VIEW and API POST /carts/{id}/items
Then item is returned on GET functional-items
And GET structure-links?nodeType=SCREEN&nodeId=CART_VIEW includes FR-CART-01

Given FR-CART-01 exists
When client creates business rule BR-CART-02 under FR-CART-01
Then rule is listed under that functional item

Given application SHOPHUB
When client creates NFR-PERF-01 with scopeType=API_ENDPOINT and valid endpoint id
Then NFR is listed and filterable by that endpoint

Given project P1 in same workspace
When client creates requirement with functionalItemId=FR-CART-01
Then requirement stores the reference
And/or trace-link REQUIREMENT --COVERS--> FUNCTIONAL_ITEM is accepted

Given FR-CART-01 exists
When client adds custom property key=persona label="Primary persona" fieldType=TEXT value="Buyer"
Then GET functional-item returns customProperties including persona
When client adds another property with the same key
Then API returns 409 APP_CUSTOM_PROPERTY_KEY_CONFLICT
When client deletes the persona property
Then it no longer appears on GET
```

OpenAPI (`/v3/api-docs`) must expose the new tags, e.g.:

- `Traceability - Functional Items`
- `Traceability - Non-functional Items`
- `Traceability - Business Rules`

---

## 9. Suggested implementation order

1. **Functional Items + anchors** (unblocks FE screen/module FR panel)  
2. **Custom properties** on Functional Item (FE “+” add field) — Option B nested CRUD preferred  
3. **NFR + scope** (+ same custom properties shape)  
4. **Business Rules** (nested under FR; + custom properties optional)  
5. **structure-links** convenience GET  
6. **Requirement FK fields** + **trace-link enum validation**  

---

## 10. FE follow-up (after BE ships)

1. Workbench tab / panel: Functional Items, NFR on application + per-screen Details.  
2. Picker: attach FR to Module/Screen/API/Action.  
3. FR detail: fixed fields + **`+` Add property** (customProperties).  
4. Project Requirements UI: select linked FunctionalItem / NFR.  
5. Traceability matrix: include FR/NFR coverage gaps.  

FE Application structure workbench is already live:

- `/workspace/{workspaceId}/applications`
- `/workspace/{workspaceId}/applications/{applicationId}`

---

## 11. Related documents

| Doc | Why |
|---|---|
| `docs/BUSINESS_REQUIREMENTS.md` §§15.4, 21 | Product rules FR-APP-003/004/005 |
| `docs/phase-tracking/wave-04/WAVE4_API_CONTRACT.md` §14 | Current Requirements / Trace / Application Registry contract |
| `docs/phase-tracking/wave-04/SCOPERY_WAVE4_UI_UX_API_PAGE_MAPPING_AND_IMPLEMENTATION_SPEC_V2.md` §14.4–14.5 | APP-01 / APP-02 UX |
| `docs/FE_BE_CONTRACT_MISMATCH_TRACKER.md` | Gap tracking entry APP-GAP-01 |
| This file | Authoritative BE build request for the gap |

---

## 12. Open questions for BE

1. Soft-delete vs archive status only? (FE prefers `ARCHIVED` status, no hard delete when linked.)  
2. Should Business Rules be nested-only, or also top-level under application?  
3. Do we need multi-application FR sharing? (Assume **no** for MVP — FR belongs to one application.)  
4. Should `acceptanceCriteria` stay `string[]` or reuse Requirement Criteria entities?  
5. Custom properties: prefer **Option B nested CRUD** (best for FE “+”) or embed-only on PUT?  
6. Should NFR / Business Rule get the same custom-properties API in MVP, or FR-only first?
