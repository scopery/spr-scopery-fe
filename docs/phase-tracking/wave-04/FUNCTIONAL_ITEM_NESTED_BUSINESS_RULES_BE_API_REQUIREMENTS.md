# Functional Item — Nested Business Rules on Create/Bulk (BE API Requirements)

> **Status:** Implemented (BE verified 2026-08-01)  
> **Date:** 2026-08-01  
> **Owner:** FE (Scopery) ↔ BE  
> **Scope:** Nested `businessRules[]` on FR create / bulk so JSON Import can paste FR + rules together  
> **Related:** `CreateFunctionalItemRequest`, `CreateBusinessRuleRequest`, `POST /api/projects/{projectId}/functional-items/bulk`

---

## 1. Problem (resolved)

FR JSON Import / bulk create already supported **acceptance criteria** on the FR:

```text
CreateFunctionalItemRequest.acceptanceCriteria: string[]
```

Business rules previously only existed as a nested resource **after** FR create:

```text
POST /api/projects/{projectId}/functional-items/{functionalItemId}/business-rules
```

Product expectation: one paste → FR + acceptance + rules.

---

## 2. Solution (P0) — nested on create / bulk — **SHIPPED**

`CreateFunctionalItemRequest` (and each bulk item) accepts optional nested rules:

```ts
interface CreateFunctionalItemRequest {
  // …existing fields…
  acceptanceCriteria?: string[]
  businessRules?: CreateBusinessRuleRequest[]  // optional
}

interface CreateBusinessRuleRequest {
  code: string
  title: string
  severity: string // LOW | MEDIUM | HIGH | CRITICAL
  description?: string | null
}
```

### Verified behavior (BE E2E)

| Case | Result |
|------|--------|
| Single create with `businessRules[]` | FR created; nested BRs persisted atomically |
| Duplicate BR `code` on same FR | `BUSINESS_RULE_CODE_ALREADY_EXISTS`; FR **not** created (rollback) |
| Bulk create with nested rules | Job `SUCCEEDED`; each FR has its correct nested BRs |
| Omit `businessRules` | Unchanged — existing FR payloads work |

Max nested rules per FR item: **50**.

### Example payload (JSON Import)

```json
{
  "items": [
    {
      "code": "FR-LOGIN-01",
      "title": "User login",
      "priority": "HIGH",
      "type": "FUNCTIONAL",
      "acceptanceCriteria": [
        "Valid credentials open the home workspace",
        "Invalid credentials show an error"
      ],
      "businessRules": [
        {
          "code": "BR-LOGIN-LOCKOUT",
          "title": "Lock account after 5 failed attempts",
          "severity": "HIGH",
          "description": "Reset lock after 15 minutes or admin unlock"
        },
        {
          "code": "BR-LOGIN-SESSION",
          "title": "Session expires after 8 hours idle",
          "severity": "MEDIUM"
        }
      ]
    }
  ]
}
```

---

## 3. Alternative (P1) — bulk rules on existing FR

Still optional for FR detail → Rules JSON import:

```text
POST /api/projects/{projectId}/functional-items/{functionalItemId}/business-rules/bulk
```

Not required for one-paste FR+rules create (P0 covers that).

---

## 4. Out of scope

- Changing Use Case business-rules API
- Importing rules without an FR
- Updating/deleting rules via FR bulk create
- Custom properties on FR

---

## 5. FE acceptance

| # | Check | Status |
|---|--------|--------|
| 1 | OpenAPI / create+bulk accept `businessRules` | Done (BE) |
| 2 | Bulk with nested rules persists; Rules tab lists them | Done (BE verified) |
| 3 | FR create without `businessRules` unchanged | Done |
| 4 | Duplicate rule `code` fails with clear error / rollback | Done (`BUSINESS_RULE_CODE_ALREADY_EXISTS`) |
| 5 | FE JSON Import guide + validator allow `businessRules[]` | Done (this FE update) |

---

## 6. Priority

| Priority | Deliverable | Status |
|----------|-------------|--------|
| **P0** | Nested `businessRules?: CreateBusinessRuleRequest[]` on FR create + bulk | **Implemented** |
| **P1** | `POST …/business-rules/bulk` for detail-tab import only | Optional / later |
