# Screen Design Spec — API Reference & Workflow

> **Scope:** V231 — Dynamic Schema Extension (screen modes, field mode configs, field validations, component options, data entity fields, screen spec documents, process/event items, function-screen link upgrade).
>
> **Base URL:** `http://localhost:8080`
> All endpoints require authentication via `Cookie: access_token=<jwt>` + `X-XSRF-TOKEN: <token>` header.

---

## Table of Contents

1. [Domain Overview](#1-domain-overview)
2. [Entity Relationships](#2-entity-relationships)
3. [Workflow](#3-workflow)
4. [API Groups](#4-api-groups)
   - 4.1 [Application Components](#41-application-components)
   - 4.2 [Component Options](#42-component-options)
   - 4.3 [Data Entity Fields](#43-data-entity-fields)
   - 4.4 [Validation Rule Types](#44-validation-rule-types)
   - 4.5 [Screen Modes](#45-screen-modes)
   - 4.6 [Screen Fields](#46-screen-fields)
   - 4.7 [Screen Field Mode Configs](#47-screen-field-mode-configs)
   - 4.8 [Screen Field Validations](#48-screen-field-validations)
   - 4.9 [Screen Process Items](#49-screen-process-items)
   - 4.10 [Screen Event Items](#410-screen-event-items)
   - 4.11 [Screen Full Spec](#411-screen-full-spec)
   - 4.12 [Screen Spec Documents](#412-screen-spec-documents)
   - 4.13 [Spec Doc Revisions](#413-spec-doc-revisions)
   - 4.14 [Spec Doc Full Spec](#414-spec-doc-full-spec)
   - 4.15 [Function-Screen Link](#415-function-screen-link)
5. [Error Catalog](#5-error-catalog)
6. [Business Rules Summary](#6-business-rules-summary)

---

## 1. Domain Overview

Screen Design Spec là tập hợp các API phục vụ việc mô tả chi tiết màn hình (screen) trong một hệ thống phần mềm, phục vụ export ra Excel workbook có cấu trúc chuẩn:

| Excel Sheet     | Entity                                               |
|-----------------|------------------------------------------------------|
| Defines         | ScreenField + FieldModeConfig + Component + DataEntityField |
| Validation      | ScreenFieldValidation + ValidationRuleType           |
| Processes       | ScreenProcessItem                                    |
| Event           | ScreenEventItem                                      |
| Change History  | SpecDocRevision                                      |

Một **Screen Spec Document** là file export chứa nhiều screen. Nhiều screen có thể thuộc một document. Screen thuộc nhiều Function (many-to-many, với role metadata).

---

## 2. Entity Relationships

```
Application
├── Component (optionSourceType: STATIC | DYNAMIC | NONE)
│   └── ComponentOption[]         (only when STATIC)
├── DataEntity
│   └── DataEntityField[]
└── Screen (linked via app_registry_screen.application_id)
    ├── ScreenMode[]              (CREATE | VIEW | EDIT | SEARCH | DIALOG)
    ├── ScreenSection[]
    ├── ScreenField[]
    │   ├── component_id → Component
    │   ├── data_entity_field_id → DataEntityField
    │   ├── ScreenFieldModeConfig[]  (one per mode — replace semantics)
    │   └── ScreenFieldValidation[]  (rule_type_id → ValidationRuleType)
    ├── ScreenProcessItem[]
    └── ScreenEventItem[]

ScreenSpecDocument (project-scoped)
├── SpecDocScreen[] → Screen[]   (junction, display_order)
└── SpecDocRevision[]            (change history)

FunctionalItem ←→ Screen        (app_function_screen: role, mode_code, display_order)
```

---

## 3. Workflow

### 3.1 Setup một-lần (workspace-level catalog)

```
1. Tạo Application          POST /api/workspaces/{wid}/applications
2. Tạo DataEntity           POST /api/workspaces/{wid}/applications/{appId}/data-entities
3. Tạo DataEntityField      POST /api/workspaces/{wid}/data-entities/{entityId}/fields
4. Tạo Component (STATIC)   POST /api/workspaces/{wid}/applications/{appId}/components
5. Tạo ComponentOption      POST /api/workspaces/{wid}/application-components/{componentId}/options
6. Tạo Component (DYNAMIC)  POST /api/workspaces/{wid}/applications/{appId}/components
   └── sourceEntityId, sourceValueColumn, sourceLabelColumn required
7. Xem ValidationRuleTypes  GET  /api/workspaces/{wid}/validation-rule-types
   └── System seeds (REGEX, MAX_LENGTH, REQUIRED, …) đã có sẵn
```

### 3.2 Định nghĩa Screen

```
1. Tạo Screen               POST /api/workspaces/{wid}/applications/{appId}/screens
2. Tạo ScreenMode           POST /api/workspaces/{wid}/screens/{screenId}/modes
   └── modeCode: CREATE | VIEW | EDIT | SEARCH | DIALOG
3. Tạo ScreenSection        POST /api/workspaces/{wid}/screens/{screenId}/sections
4. Tạo ScreenField          POST /api/workspaces/{wid}/screens/{screenId}/fields
   └── Optionally set componentId, dataEntityFieldId
5. Replace FieldModeConfig  PUT  /api/workspaces/{wid}/screens/{screenId}/fields/{fieldId}/mode-configs
   └── Replace toàn bộ — payload = complete set cho field này
6. Tạo FieldValidation      POST /api/workspaces/{wid}/screens/{screenId}/fields/{fieldId}/validations
7. Tạo ProcessItem          POST /api/workspaces/{wid}/screens/{screenId}/process-items
8. Tạo EventItem            POST /api/workspaces/{wid}/screens/{screenId}/event-items
```

### 3.3 Link Function ↔ Screen

```
POST /api/projects/{projectId}/functional-items/{functionalItemId}/screens
Body: { screenId, role, modeCode, displayOrder }

Roles: ENTRY | MAIN | SUB | RESULT | DIALOG | ERROR | RELATED
```

### 3.4 Export Screen Spec

```
# Export 1 screen:
GET /api/workspaces/{wid}/screens/{screenId}/full-spec

# Tạo Spec Document (nhiều screens):
POST /api/workspaces/{wid}/screen-spec-docs
PUT  /api/workspaces/{wid}/screen-spec-docs/{docId}/screens         (add screen)
DELETE /api/workspaces/{wid}/screen-spec-docs/{docId}/screens/{screenId}  (remove screen)
POST /api/workspaces/{wid}/screen-spec-docs/{docId}/revisions       (add change history)

# Export full document:
GET  /api/workspaces/{wid}/screen-spec-docs/{docId}/full-spec
```

---

## 4. API Groups

### 4.1 Application Components

**Base path:** `/api/workspaces/{workspaceId}/applications/{applicationId}/components`
**Item path:** `/api/workspaces/{workspaceId}/application-components/{componentId}`

| Method | Path            | Description                  |
|--------|-----------------|------------------------------|
| POST   | `/`             | Create component             |
| GET    | `/`             | List components (paginated)  |
| GET    | `/{componentId}`| Get by ID                    |
| PUT    | `/{componentId}`| Update component             |
| DELETE | `/{componentId}`| Delete component             |

**Create/Update request:**
```json
{
  "code": "DD-STATUS",
  "name": "Status Dropdown",
  "description": "optional",
  "componentType": "DROPDOWN",
  "optionSourceType": "STATIC | DYNAMIC | NONE",

  // Only when optionSourceType = DYNAMIC:
  "sourceEntityId": "uuid",
  "sourceValueColumn": "id",
  "sourceLabelColumn": "name",

  // Optional filter (DYNAMIC only, backend validates structure only — not executed):
  "sourceFilterJson": "[{\"op\":\"EQUALS\",\"field\":\"status\",\"value\":\"ACTIVE\"}]"
}
```

**Supported `sourceFilterJson` ops:**

| op       | Required keys         |
|----------|-----------------------|
| IS_NULL  | field                 |
| EQUALS   | field, value          |
| IN       | field, values (array) |

**Business rules:**
- `DYNAMIC`: `sourceEntityId` must exist, be ACTIVE, and `sourceValueColumn`/`sourceLabelColumn` must be valid column names in that entity's fields.
- `sourceFilterJson` filter fields must exist as column names in the source entity.
- Cannot set static options on a `NONE` or `DYNAMIC` component.

---

### 4.2 Component Options

**Base path:** `/api/workspaces/{workspaceId}/application-components/{componentId}/options`

| Method | Path           | Description         |
|--------|----------------|---------------------|
| POST   | `/`            | Add static option   |
| GET    | `/`            | List options        |
| PUT    | `/{optionId}`  | Update option       |
| DELETE | `/{optionId}`  | Delete option       |

**Request:**
```json
{
  "optionValue": "active",
  "optionLabel": "Active",
  "displayOrder": 1
}
```

**Business rule:** Rejects with `422 COMPONENT_SOURCE_TYPE_NOT_STATIC` if component's `optionSourceType != STATIC`.

---

### 4.3 Data Entity Fields

**Base path:** `/api/workspaces/{workspaceId}/data-entities/{entityId}/fields`

| Method | Path          | Description          |
|--------|---------------|----------------------|
| POST   | `/`           | Add column to entity |
| GET    | `/`           | List fields          |
| PUT    | `/{fieldId}`  | Update field         |
| DELETE | `/{fieldId}`  | Delete field         |

**Request:**
```json
{
  "columnName": "email",
  "dataType": "VARCHAR",
  "maxLength": 255,
  "isNullable": true,
  "isUnique": false,
  "remark": "optional",
  "displayOrder": 1
}
```

**Allowed `dataType` values:** `VARCHAR`, `INTEGER`, `BOOLEAN`, `DATE`, `TIMESTAMP`, `TEXT`, `UUID`, `DECIMAL`

**Business rule:** `columnName` must be unique within the entity (409 `DATA_ENTITY_FIELD_COLUMN_ALREADY_EXISTS`).

---

### 4.4 Validation Rule Types

**Base path:** `/api/workspaces/{workspaceId}/validation-rule-types`

| Method | Path             | Description              |
|--------|------------------|--------------------------|
| GET    | `/`              | List all accessible types|
| GET    | `/{ruleTypeId}`  | Get by ID                |
| POST   | `/`              | Create workspace-custom type |
| PUT    | `/{ruleTypeId}`  | Update (workspace-owned only) |
| DELETE | `/{ruleTypeId}`  | Delete (workspace-owned only) |

**System-seeded types (is_system=true, always available):**

| code           | category    | param_schema_json                                           |
|----------------|-------------|-------------------------------------------------------------|
| REGEX          | FORMAT      | `{"pattern": "string"}`                                     |
| MAX_LENGTH     | RANGE       | `{"maxLength": "integer"}`                                  |
| IN_LIST        | REFERENCE   | `{"values": ["string"]}`                                    |
| FILE_SIZE      | RANGE       | `{"maxBytes": "integer"}`                                   |
| FILE_TYPE      | FORMAT      | `{"mimeTypes": ["string"]}`                                 |
| DATE_FORMAT    | FORMAT      | `{"format": "string"}`                                      |
| URL            | FORMAT      | *(no params)*                                               |
| HALF_WIDTH     | FORMAT      | *(no params)*                                               |
| EMAIL_FORMAT   | FORMAT      | *(no params)*                                               |
| POSTAL_CODE_JP | FORMAT      | *(no params)*                                               |
| PHONE_NUMBER_JP| FORMAT      | *(no params)*                                               |
| MATCHING       | REFERENCE   | `{"targetFieldKey": "string"}`                              |
| REQUIRED       | CONDITIONAL | `{"condition": {"fieldKey": "string", "op": "string"}}`     |
| UNIQUE         | REFERENCE   | *(no params)*                                               |

**Custom type request:**
```json
{
  "code": "CUSTOM_RULE",
  "name": "Custom Rule",
  "category": "FORMAT",
  "paramSchemaJson": "{\"minValue\": \"integer\"}",
  "defaultMessage": "Value out of range",
  "description": "optional",
  "displayOrder": 0
}
```

**Note:** `paramSchemaJson` defines the expected keys and types for `rule_param_json` when creating a validation with this rule type. Backend validates against this schema on validation create/update.

---

### 4.5 Screen Modes

**Base path:** `/api/workspaces/{workspaceId}/screens/{screenId}/modes`

| Method | Path         | Description   |
|--------|--------------|---------------|
| POST   | `/`          | Create mode   |
| GET    | `/`          | List modes    |
| GET    | `/{modeId}`  | Get by ID     |
| PUT    | `/{modeId}`  | Update mode   |
| DELETE | `/{modeId}`  | Delete mode   |

**Request:**
```json
{
  "modeCode": "CREATE",
  "name": "Create Mode",
  "displayOrder": 1
}
```

**Allowed `modeCode` values:** `CREATE`, `VIEW`, `EDIT`, `SEARCH`, `DIALOG`

**Business rules:**
- `modeCode` is validated at app layer — any other value → `400 VALIDATION_ERROR`.
- `modeCode` must be unique per screen → `409 SCREEN_MODE_CODE_ALREADY_EXISTS`.
- Deactivating a mode preserves all mode_config rows (archival). Deactivated modes are excluded from `full-spec` responses.

---

### 4.6 Screen Fields

**Base path:** `/api/workspaces/{workspaceId}/screens/{screenId}/fields`

| Method | Path          | Description              |
|--------|---------------|--------------------------|
| POST   | `/`           | Create field             |
| GET    | `/`           | List fields (lightweight)|
| GET    | `/{fieldId}`  | Get field (full detail)  |
| PUT    | `/{fieldId}`  | Update field             |
| DELETE | `/{fieldId}`  | Delete field             |

**Create/Update request:**
```json
{
  "fieldKey": "email",
  "fieldLabel": "Email Address",
  "fieldType": "INPUT",
  "required": false,
  "displayOrder": 1,
  "maxLength": 255,
  "remark": "Used for login",

  // Link to a component (optional):
  "componentId": "uuid",

  // Link to a data entity field (optional):
  "dataEntityFieldId": "uuid"
}
```

**GET `/{fieldId}` (full)** includes:
- `modeConfigs[]` — all mode configs for the field
- `validations[]` — all validation rules

---

### 4.7 Screen Field Mode Configs

**Base path:** `/api/workspaces/{workspaceId}/screens/{screenId}/fields/{fieldId}/mode-configs`

| Method | Path | Description                              |
|--------|------|------------------------------------------|
| PUT    | `/`  | Replace all mode configs for this field  |
| GET    | `/`  | List current mode configs                |

> **This is a replace operation.** The payload represents the complete set of mode configs. Active mode configs not included in the payload are deleted. Configs for ARCHIVED modes are preserved regardless.

**Request:**
```json
{
  "modeConfigs": [
    {
      "modeId": "uuid",
      "isVisible": true,
      "isRequired": false,
      "isReadonly": false,
      "defaultValue": null,
      "displayOrder": null
    },
    {
      "modeId": "uuid",
      "isVisible": false,
      "isRequired": false,
      "isReadonly": false,
      "defaultValue": null,
      "displayOrder": null
    }
  ]
}
```

**`displayOrder` semantics:** `null` = inherit from `field.display_order`; non-null = override per this mode.

**`is_required` fallback logic:**

| State                            | Behavior                         |
|----------------------------------|----------------------------------|
| No row `(field_id, mode_id)`    | Use `field.required`             |
| Row exists, `isRequired = false` | Explicitly not required (no fallback) |
| Row exists, `isRequired = true`  | Required in this mode            |

**Business rules:**
- Payload must not be empty → `400 MODE_CONFIG_PAYLOAD_EMPTY`.
- Each `modeId` must belong to the same screen and workspace → `422 SCREEN_MODE_WRONG_SCREEN`.
- Each `modeId` must be ACTIVE → `422 SCREEN_MODE_INACTIVE`.
- Uses pessimistic lock (`SELECT FOR UPDATE`) on the field row to prevent concurrent replace races.

---

### 4.8 Screen Field Validations

**Base path:** `/api/workspaces/{workspaceId}/screens/{screenId}/fields/{fieldId}/validations`

| Method | Path               | Description      |
|--------|--------------------|------------------|
| POST   | `/`                | Add validation   |
| GET    | `/`                | List validations |
| GET    | `/{validationId}`  | Get by ID        |
| PUT    | `/{validationId}`  | Update           |
| DELETE | `/{validationId}`  | Delete           |

**Request:**
```json
{
  "ruleTypeId": "uuid",
  "modeId": "uuid (optional — null = applies to all modes)",
  "ruleParamJson": { "maxLength": 255 },
  "conditionJson": { "fieldKey": "status", "op": "EQUALS", "value": "ACTIVE" },
  "errorMessage": "Cannot exceed 255 characters",
  "remark": "optional",
  "displayOrder": 1
}
```

**`ruleParamJson` examples by rule type:**

| Rule type   | ruleParamJson                                         |
|-------------|-------------------------------------------------------|
| REGEX       | `{"pattern": "^[0-9]+$"}`                            |
| MAX_LENGTH  | `{"maxLength": 255}`                                  |
| IN_LIST     | `{"values": ["0", "1", "2"]}`                        |
| FILE_SIZE   | `{"maxBytes": 5242880}`                               |
| FILE_TYPE   | `{"mimeTypes": ["image/png", "image/jpeg"]}`          |
| DATE_FORMAT | `{"format": "yyyy-MM-dd"}`                            |
| MATCHING    | `{"targetFieldKey": "password_confirm"}`              |
| REQUIRED    | `{"condition": {"fieldKey": "type", "op": "EQUALS"}}` |
| URL, EMAIL_FORMAT, HALF_WIDTH, UNIQUE, REQUIRED (simple) | *(no params)* |

**`conditionJson`** — khi nào validation này được áp dụng (FE logic):
```json
{ "fieldKey": "agree_terms", "op": "IS_NOT_EMPTY" }
```

**Backend validation rules for `ruleParamJson`:**
- Schema (`param_schema_json`) null → `ruleParamJson` must be null/empty.
- Schema non-null → `ruleParamJson` must contain all keys defined in schema.
- Keys typed `"integer"` → value must be a JSON integer.
- Keys typed `"string"` → value must be a JSON string.
- REGEX rule: `pattern` value must be a valid Java regex (compiled and checked at save time).

---

### 4.9 Screen Process Items

**Base path:** `/api/workspaces/{workspaceId}/screens/{screenId}/process-items`

| Method | Path             | Description   |
|--------|------------------|---------------|
| POST   | `/`              | Add item      |
| GET    | `/`              | List items    |
| GET    | `/{itemId}`      | Get by ID     |
| PUT    | `/{itemId}`      | Update        |
| DELETE | `/{itemId}`      | Delete        |

**Request:**
```json
{
  "modeId": "uuid (optional — which screen mode this process applies to)",
  "targetFieldId": "uuid (optional — which field this process is about)",
  "title": "1. Data Load",
  "content": "Fetch user profile from USER_MASTER table on screen open",
  "sourceTable": "USER_MASTER",
  "conditionNote": "Only when session is active",
  "displayOrder": 1
}
```

**Corresponds to:** "Processes" sheet in the Excel spec. Each row describes one processing step, optionally tied to a specific screen mode and/or field.

---

### 4.10 Screen Event Items

**Base path:** `/api/workspaces/{workspaceId}/screens/{screenId}/event-items`

| Method | Path        | Description |
|--------|-------------|-------------|
| POST   | `/`         | Add item    |
| GET    | `/`         | List items  |
| GET    | `/{itemId}` | Get by ID   |
| PUT    | `/{itemId}` | Update      |
| DELETE | `/{itemId}` | Delete      |

**Request:**
```json
{
  "modeId": "uuid (optional)",
  "triggerFieldId": "uuid (optional — which field triggers this event)",
  "triggerActionCode": "CLICK",
  "title": "Submit button click",
  "content": "Validate form → call POST /api/users → navigate to confirmation screen",
  "conditionNote": "Only when form is dirty",
  "targetScreenId": "uuid (optional — navigation target)",
  "targetModeCode": "VIEW",
  "displayOrder": 1
}
```

**Corresponds to:** "Event" sheet in the Excel spec. Each row describes one UI event and its handler behavior.

---

### 4.11 Screen Full Spec

**Path:** `GET /api/workspaces/{workspaceId}/screens/{screenId}/full-spec`

Returns a complete, flat-loaded spec payload for a single screen. Used as the source for exporting a single screen's design spec.

**Response structure:**
```json
{
  "id": "uuid",
  "code": "LOGIN",
  "name": "Login Screen",
  "routePath": "/login",
  "status": "ACTIVE",

  "modes": [
    { "id": "uuid", "modeCode": "CREATE", "name": "Create", "displayOrder": 0, "status": "ACTIVE" }
  ],

  "sections": [
    { "id": "uuid", "name": "Main", "description": null, "displayOrder": 0, "status": "ACTIVE" }
  ],

  "fields": [
    {
      "id": "uuid",
      "sectionId": "uuid or null",
      "fieldKey": "email",
      "label": "Email Address",
      "fieldType": "INPUT",
      "description": null,
      "required": false,
      "displayOrder": 1,
      "maxLength": 255,
      "remark": null,

      // Component summary (null if not linked)
      "component": {
        "id": "uuid",
        "code": "TXT-EMAIL",
        "name": "Email Input",
        "componentType": "INPUT",
        "optionSourceType": "NONE",
        "sourceEntityId": null,
        "sourceValueColumn": null,
        "sourceLabelColumn": null,
        "sourceFilterJson": null,
        "options": null    // null for NONE/DYNAMIC; [...] for STATIC
      },

      // Data entity field summary (null if not linked)
      "dataField": {
        "id": "uuid",
        "columnName": "email",
        "dataType": "VARCHAR",
        "maxLength": 255,
        "isNullable": true,
        "isUnique": true
      },

      "modeConfigs": [
        {
          "modeId": "uuid",
          "modeCode": "CREATE",
          "isVisible": true,
          "isRequired": true,
          "isReadonly": false,
          "defaultValue": null,
          "displayOrder": null
        }
      ],

      "validations": [
        {
          "id": "uuid",
          "modeId": null,
          "modeCode": null,
          "ruleTypeCode": "MAX_LENGTH",
          "ruleParamJson": "{\"maxLength\":255}",
          "conditionJson": null,
          "errorMessage": "Cannot exceed 255 characters",
          "remark": null,
          "displayOrder": 1
        }
      ]
    }
  ],

  "processItems": [
    {
      "id": "uuid",
      "modeId": null,
      "modeCode": null,
      "targetFieldId": null,
      "title": "1. Init",
      "content": "Load dropdown options from API",
      "sourceTable": null,
      "conditionNote": null,
      "displayOrder": 1
    }
  ],

  "eventItems": [
    {
      "id": "uuid",
      "modeId": null,
      "modeCode": null,
      "triggerFieldId": null,
      "triggerActionCode": "CLICK",
      "title": "Submit",
      "content": "POST /api/login → redirect to dashboard",
      "conditionNote": null,
      "targetScreenId": null,
      "targetModeCode": null,
      "displayOrder": 1
    }
  ]
}
```

**Performance note:** Implemented as 11 flat queries (no N+1). Only ACTIVE modes, fields, and items are returned. ARCHIVED modes and their mode_configs are excluded.

---

### 4.12 Screen Spec Documents

**Base path:** `/api/workspaces/{workspaceId}/screen-spec-docs`

| Method | Path                                  | Description                    |
|--------|---------------------------------------|--------------------------------|
| POST   | `/`                                   | Create document                |
| GET    | `/`                                   | List documents (paginated)     |
| GET    | `/{docId}`                            | Get document detail            |
| PUT    | `/{docId}`                            | Update document metadata       |
| DELETE | `/{docId}`                            | Delete document                |
| PUT    | `/{docId}/screens`                    | Add screen to document         |
| DELETE | `/{docId}/screens/{screenId}`         | Remove screen from document    |

**Create/Update document request:**
```json
{
  "documentCode": "SPEC-001",
  "documentName": "Startupper — Register & View & Edit",
  "projectName": "Startupper",
  "systemName": "Web App",
  "phaseName": "Phase 1",
  "language": "EN",
  "overview": "This document covers the user registration and profile management screens.",
  "figmaUrl": "https://figma.com/file/xxx"
}
```

**Add screen to document request:**
```json
{
  "screenId": "uuid",
  "displayOrder": 1,
  "note": "optional"
}
```

**Business rules:**
- `documentCode` must be unique per project → `409 SCREEN_SPEC_DOC_CODE_ALREADY_EXISTS`.
- Adding the same screen twice → `409 SPEC_DOC_SCREEN_DUPLICATE`.

---

### 4.13 Spec Doc Revisions

**Base path:** `/api/workspaces/{workspaceId}/screen-spec-docs/{documentId}/revisions`

| Method | Path             | Description       |
|--------|------------------|-------------------|
| POST   | `/`              | Add revision entry|
| GET    | `/`              | List revisions    |
| GET    | `/{revisionId}`  | Get by ID         |
| PUT    | `/{revisionId}`  | Update revision   |
| DELETE | `/{revisionId}`  | Delete revision   |

**Request:**
```json
{
  "revisionNo": "1.0",
  "targetSheetName": "Defines",
  "details": "Added email field validation, updated component type",
  "personInCharge": "Nhi",
  "color": "#FFFF00",
  "changedAt": "2026-08-14",
  "displayOrder": 1
}
```

**Corresponds to:** "Change History" sheet in the Excel spec.

---

### 4.14 Spec Doc Full Spec

**Path:** `GET /api/workspaces/{workspaceId}/screen-spec-docs/{documentId}/full-spec`

Returns the full spec payload for an entire document — document metadata + all screens (each with their full spec). Used as the source for generating the complete Excel workbook.

**Response structure:**
```json
{
  "id": "uuid",
  "documentCode": "SPEC-001",
  "documentName": "Startupper — Register & View & Edit",
  "projectName": "Startupper",
  "systemName": "Web App",
  "phaseName": "Phase 1",
  "language": "EN",
  "overview": "...",
  "figmaUrl": "...",
  "status": "ACTIVE",

  "revisions": [
    {
      "id": "uuid",
      "revisionNo": "1.0",
      "targetSheetName": "Defines",
      "details": "Initial version",
      "personInCharge": "Nhi",
      "color": "#FFFF00",
      "changedAt": "2026-08-14",
      "displayOrder": 1
    }
  ],

  "screens": [
    {
      "displayOrder": 1,
      "note": null,
      "screen": {
        // Same structure as Screen Full Spec (section 4.11)
      }
    }
  ]
}
```

---

### 4.15 Function-Screen Link

**Base path:** `/api/projects/{projectId}/functional-items/{functionalItemId}/screens`

| Method | Path           | Description           |
|--------|----------------|-----------------------|
| POST   | `/`            | Link screen to function |
| GET    | `/`            | List linked screens   |
| PUT    | `/{screenId}`  | Update link metadata  |
| DELETE | `/{screenId}`  | Unlink screen         |

**Request:**
```json
{
  "screenId": "uuid",
  "role": "MAIN",
  "modeCode": "CREATE",
  "note": "optional",
  "displayOrder": 1
}
```

**`role` values and semantics:**

| role    | Meaning                                        |
|---------|------------------------------------------------|
| ENTRY   | User lands here to start the function          |
| MAIN    | Primary screen of the function                 |
| SUB     | Secondary detail or lookup screen              |
| RESULT  | Screen shown after action completes            |
| DIALOG  | Modal/dialog triggered within function         |
| ERROR   | Error state screen                             |
| RELATED | Referenced but not navigated directly          |

**Business rules:**
- One screen can be linked to multiple functions (each with different roles).
- One function cannot link the same screen twice → `409 FUNCTION_SCREEN_DUPLICATE`.
- Invalid `role` value → `400 INVALID_FUNCTION_SCREEN_ROLE`.

---

## 5. Error Catalog

| errorCode                              | HTTP | Description                                        |
|----------------------------------------|------|----------------------------------------------------|
| `SCREEN_MODE_NOT_FOUND`               | 404  | Screen mode not found                              |
| `SCREEN_MODE_CODE_ALREADY_EXISTS`     | 409  | Duplicate modeCode for this screen                 |
| `SCREEN_MODE_WRONG_SCREEN`            | 422  | Mode does not belong to the specified screen       |
| `SCREEN_MODE_INACTIVE`               | 422  | Mode is not ACTIVE                                 |
| `DATA_ENTITY_NOT_FOUND`              | 404  | Data entity not found                              |
| `DATA_ENTITY_NOT_ACTIVE`             | 422  | Source data entity is not ACTIVE                   |
| `DATA_ENTITY_FIELD_NOT_FOUND`        | 404  | Data entity field not found                        |
| `DATA_ENTITY_FIELD_COLUMN_ALREADY_EXISTS` | 409 | Column name already exists for this entity      |
| `DATA_ENTITY_FIELD_COLUMN_NOT_FOUND` | 422  | Column name not found in entity fields             |
| `FILTER_FIELD_NOT_IN_ENTITY`         | 422  | sourceFilterJson references a non-existent column  |
| `COMPONENT_OPTION_NOT_FOUND`         | 404  | Component option not found                         |
| `COMPONENT_OPTION_VALUE_ALREADY_EXISTS` | 409 | Option value already exists for this component   |
| `COMPONENT_SOURCE_TYPE_NOT_STATIC`   | 422  | Cannot add static options to NONE/DYNAMIC component|
| `COMPONENT_DIFFERENT_APPLICATION`    | 422  | Component belongs to a different application       |
| `DATA_ENTITY_FIELD_DIFFERENT_APPLICATION` | 422 | Data entity field belongs to a different app   |
| `VALIDATION_RULE_TYPE_NOT_FOUND`     | 404  | Validation rule type not found                     |
| `VALIDATION_RULE_TYPE_CODE_ALREADY_EXISTS` | 409 | Rule type code already exists                 |
| `FIELD_VALIDATION_NOT_FOUND`         | 404  | Field validation not found                         |
| `FIELD_VALIDATION_RULE_PARAM_INVALID`| 422  | rule_param_json does not match the rule type schema|
| `FIELD_MODE_CONFIG_NOT_FOUND`        | 404  | Field mode config not found                        |
| `MODE_CONFIG_PAYLOAD_EMPTY`          | 400  | Replace payload must not be empty                  |
| `SCREEN_SPEC_DOC_NOT_FOUND`          | 404  | Screen spec document not found                     |
| `SCREEN_SPEC_DOC_CODE_ALREADY_EXISTS`| 409  | Document code already exists in this project       |
| `SPEC_DOC_SCREEN_DUPLICATE`          | 409  | Screen already added to this document              |
| `SPEC_DOC_SCREEN_NOT_FOUND`          | 409  | Screen not found in this document                  |
| `SPEC_DOC_REVISION_NOT_FOUND`        | 404  | Spec doc revision not found                        |
| `SCREEN_PROCESS_ITEM_NOT_FOUND`      | 404  | Screen process item not found                      |
| `SCREEN_EVENT_ITEM_NOT_FOUND`        | 404  | Screen event item not found                        |
| `FUNCTION_SCREEN_DUPLICATE`          | 409  | Screen already linked to this function             |
| `FUNCTION_SCREEN_NOT_FOUND`          | 404  | Function-screen link not found                     |
| `INVALID_FUNCTION_SCREEN_ROLE`       | 400  | Invalid function-screen role value                 |

---

## 6. Business Rules Summary

| # | Rule |
|---|------|
| BR-1 | Workspace consistency: mọi FK reference được verify `workspaceId` match — tránh IDOR |
| BR-2 | `is_required` fallback: không có row `(field_id, mode_id)` → dùng `field.required`; row tồn tại thì dùng row value hoàn toàn (kể cả `false`) |
| BR-3 | `is_visible = false` → bỏ qua required validation (FE responsibility) |
| BR-4 | Full spec chỉ trả ACTIVE records — ARCHIVED modes/items bị exclude |
| BR-5 | DYNAMIC component: source entity phải ACTIVE, value/label column phải tồn tại trong entity fields |
| BR-6 | `sourceFilterJson`: backend chỉ validate structure (op whitelist + column existence) — không resolve options, không execute trong SQL |
| BR-7 | Cannot create `field_mode_config` hoặc `field_validation` với mode không ACTIVE → 422 |
| BR-8 | Replace mode configs: payload = complete set; ACTIVE modes không trong payload bị delete; ARCHIVED modes được preserve |
| BR-9 | `rule_param_json` được validate theo `param_schema_json` của rule type — schema-driven type checking tại app layer |
| BR-10 | Một screen có thể link với nhiều function với role khác nhau; một function không link cùng screen 2 lần |
