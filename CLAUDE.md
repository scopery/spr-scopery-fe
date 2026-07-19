# Scopery-FE — Frontend Architecture Guide

> **Canonical conventions:** [`CODING_CONVENTIONS.md`](./CODING_CONVENTIONS.md) — naming, lint, PR checklist.
> **Bounded context map (BE):** read `../CLAUDE.md` at monorepo root.

---

## Tech stack

| Layer      | Choice                                                                  |
| ---------- | ----------------------------------------------------------------------- |
| Framework  | Next.js 14 App Router, TypeScript strict                                |
| Styling    | Tailwind CSS + design tokens (`shared/tokens/`)                         |
| HTTP       | `shared/lib/apiClient.ts` → BFF `/api/proxy/*` (HttpOnly cookie auth)  |
| State      | React Context (auth) + module hooks + local `useState`                  |
| Validation | Zod (client-side where needed)                                          |

---

## Top-level directory

```
app/                      Next.js App Router — thin routes only (~5–15 lines per page.tsx)
  api/proxy/[...path]/    BFF proxy — do not modify unless changing auth architecture
  api/auth/               Auth endpoints (Google OAuth, session)
shared/
  ui/                     Design system — atoms + molecules, ZERO business logic
  lib/                    apiClient, api-types, errorHandling, api-paths, dataMode
  tokens/                 Design tokens (colors, spacing, typography, radius, shadows)
modules/                  All business logic — one folder per bounded context
config/                   Feature flags (features.ts)
constants/                Transitional barrel — re-exports from modules (do not add new endpoints here)
utils/                    Generic cross-cutting utils: cn, useDebounce, inviteToken shims
```

---

## Module structure

Every sub-module follows this layout:

```
modules/{bounded-context}/{sub-module}/
  domain/
    model/              ← Business objects (match BE shape but camelCase)
    enums/              ← String literal const objects — NOT TypeScript enum keyword
    rules/              ← Pure business logic functions (no React, no apiClient)
    messages/           ← Business error/validation message constants

  infrastructure/
    api/
      endpoints.ts      ← DOMAIN_ENDPOINTS constant, uses apiPath()
      {domain}.api.ts   ← Typed apiClient calls — never fetch()
    schemas/            ← Raw API response shapes (snake_case, raw strings)
                           Only needed when schema ≠ domain model
    mappers/            ← Schema → domain model transformation
                           Only needed when schema ≠ domain model

  presentation/
    hooks/              ← React orchestration (useState, useEffect, useCallback)
    view-models/        ← UI-specific shape derived from domain model
                           Only needed when UI shape ≠ domain model
    ui/                 ← Components: *View.tsx, *Modal.tsx, *Panel.tsx, *Item.tsx

  index.ts              ← Sub-module public API
index.ts                ← Bounded-context facade — only entry for app/**
```

### When to create each folder

| Folder                       | Create when                                                           |
| ---------------------------- | --------------------------------------------------------------------- |
| `domain/rules/`              | Any business decision logic exists (can user do X? is Y valid?)       |
| `domain/messages/`           | Business error/validation strings exist                               |
| `infrastructure/schemas/`    | BE returns snake_case or shape differs from domain model              |
| `infrastructure/mappers/`    | Schema ≠ domain model (always paired with schemas/)                   |
| `presentation/view-models/`  | UI needs derived/formatted data that doesn't belong in domain model   |

> **Do not** create `lib/`, `services/`, `helpers/`, or `utils/` inside modules.
> These become mixed-responsibility over time. Use the specific folders above instead.

---

## Call flows

### Simple CRUD (list / get / create)

```
app/**/page.tsx
  └─ <FoosView />                         ← presentation/ui/
       └─ useFoos(orgId)                   ← presentation/hooks/
            └─ fooApi.listFoos(orgId)      ← infrastructure/api/foo.api.ts
                 └─ apiClient.get(url)     ← shared/lib/apiClient.ts
                      └─ /api/proxy/*      ← BFF adds Authorization header
```

### With business rules (permission check, status guard)

```
app/**/page.tsx
  └─ <SessionDetailView />
       └─ useSessionDetail(sessionId)
            ├─ sessionApi.getSession()     ← infrastructure/api/
            └─ canSubmitSession(session)   ← domain/rules/session.rules.ts
                 └─ pure boolean, no side effects
```

### With schema mapping (BE shape ≠ domain model)

```
apiClient.get(url)
  └─ WorkspaceSchema (snake_case, string dates)   ← infrastructure/schemas/
       └─ mapWorkspaceSchemaToDomain(schema)       ← infrastructure/mappers/
            └─ Workspace (camelCase, Date objects) ← domain/model/
                 └─ hook stores domain model
                      └─ mapWorkspaceToViewModel() ← presentation/view-models/ (optional)
                           └─ WorkspaceDetailView  ← presentation/ui/
```

### With view model (UI needs derived/formatted data)

```
domain model: { status: 'ACTIVE', createdAt: Date }
  └─ mapWorkspaceToDetailViewModel(workspace)
       └─ { statusLabel: 'Active', createdAtText: '01/01/2026', canArchive: true }
            └─ WorkspaceDetailView receives view model, renders directly
```

### Mutation flow (create / update / delete)

```
<CreateFooModal onSubmit={handleSubmit} />
  └─ handleSubmit(formValues)
       ├─ validateFooPayload(formValues)        ← domain/rules/ (optional)
       ├─ fooApi.createFoo(orgId, formValues)   ← infrastructure/api/
       ├─ toast.success(...)                    ← presentation layer
       └─ refetch()                             ← invalidate hook state
```

---

## Layer constraints

### Allowed dependencies

```
presentation  → domain (model, enums, rules, messages)
presentation  → infrastructure/api (only via hook, never directly in component)

infrastructure → domain (model, enums)
infrastructure → shared/lib/apiClient

domain        → nothing (pure TypeScript only)
```

### Forbidden — hard rules

| From          | Cannot import                                     | Reason                            |
| ------------- | ------------------------------------------------- | --------------------------------- |
| `domain/`     | React, Next.js, apiClient, shared/ui              | Domain must be pure               |
| `domain/`     | Any other layer (infra, presentation)             | Domain has no outward deps        |
| `infrastructure/api/` | React hooks, JSX, shared/ui              | Infra is not UI                   |
| `presentation/ui/` | `infrastructure/api/*.api.ts` directly      | Always go through a hook          |
| `shared/ui/`  | `@/modules/*`, business enums, domain types       | Design system is business-agnostic |
| `app/**/page.tsx` | Deep module paths `@/modules/{ctx}/{sub}/*`  | Routes use facade only            |

### Import path rules

| Caller               | Import                              |
| -------------------- | ----------------------------------- |
| `app/**/page.tsx`    | `@/modules/{context}` facade only   |
| Cross sub-module     | `@/modules/{context}/{sub-module}`  |
| Within sub-module    | Relative `../model`, `../hooks`     |
| Design system        | `@/shared/ui`                       |
| HTTP client          | `@/shared/lib/apiClient`            |
| Error types          | `@/shared/lib/api-types`            |
| Generic utils        | `@/utils/cn`, `@/utils/useDebounce` |

---

## Adding a new feature — step by step

### 1. Domain model + enums

```typescript
// domain/enums/foo.enum.ts
export const FooStatus = {
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
} as const
export type FooStatus = (typeof FooStatus)[keyof typeof FooStatus]
```

```typescript
// domain/model/foo.ts
import type { FooStatus } from '../enums/foo.enum'

export interface Foo {
  id: string
  orgId: string
  name: string
  status: FooStatus
  createdAt: string
}
```

> Use `as const` object — **never** the TypeScript `enum` keyword.
> Types must match BE response shape exactly — do not invent extra fields.

### 2. Business rules (if any)

```typescript
// domain/rules/foo.rules.ts
import type { Foo } from '../model/foo'
import { FooStatus } from '../enums/foo.enum'

export function isFooArchived(foo: Foo): boolean {
  return foo.status === FooStatus.Archived
}

export function canEditFoo(foo: Foo): boolean {
  return !isFooArchived(foo)
}
```

> Rules must be pure: input → output, no side effects, no React, no apiClient.

### 3. Endpoints + API functions

```typescript
// infrastructure/api/endpoints.ts
import { apiPath } from '@/shared/lib/api-paths'

export const FOO_ENDPOINTS = {
  list: (orgId: string) => apiPath(`/orgs/${orgId}/foos`),
  get: (orgId: string, fooId: string) => apiPath(`/orgs/${orgId}/foos/${fooId}`),
  create: (orgId: string) => apiPath(`/orgs/${orgId}/foos`),
  patch: (orgId: string, fooId: string) => apiPath(`/orgs/${orgId}/foos/${fooId}`),
  delete: (orgId: string, fooId: string) => apiPath(`/orgs/${orgId}/foos/${fooId}`),
} as const
```

```typescript
// infrastructure/api/foo.api.ts
import { apiClient } from '@/shared/lib/apiClient'
import { FOO_ENDPOINTS } from './endpoints'
import type { Foo } from '../../domain/model/foo'

export interface FooListResponse {
  items: Foo[]
  page: { limit: number; offset: number; total: number }
}

export async function listFoos(orgId: string): Promise<FooListResponse> {
  return apiClient.get<FooListResponse>(FOO_ENDPOINTS.list(orgId))
}

export async function createFoo(orgId: string, body: { name: string }): Promise<Foo> {
  return apiClient.post<Foo>(FOO_ENDPOINTS.create(orgId), body)
}

export async function deleteFoo(orgId: string, fooId: string): Promise<void> {
  await apiClient.delete<void>(FOO_ENDPOINTS.delete(orgId, fooId), { parseJson: false })
}
```

> Never call `fetch()` — always `apiClient`.
> Never catch errors in API layer — let `ApiError` bubble to the hook/UI.

### 4. Schema + mapper (only when BE shape ≠ domain model)

```typescript
// infrastructure/schemas/foo.schema.ts
export interface FooSchema {
  id: string
  org_id: string           // snake_case from BE
  name: string
  status: 'ACTIVE' | 'ARCHIVED'
  created_at: string       // raw string date
}
```

```typescript
// infrastructure/mappers/foo.mapper.ts
import type { Foo } from '../../domain/model/foo'
import type { FooSchema } from '../schemas/foo.schema'

export function mapFooSchemaToDomain(schema: FooSchema): Foo {
  return {
    id: schema.id,
    orgId: schema.org_id,
    name: schema.name,
    status: schema.status,
    createdAt: schema.created_at,
  }
}
```

### 5. Hook

```typescript
// presentation/hooks/useFoos.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import * as fooApi from '../../infrastructure/api/foo.api'
import { canEditFoo } from '../../domain/rules/foo.rules'
import type { Foo } from '../../domain/model/foo'

export function useFoos(orgId: string | null) {
  const [items, setItems] = useState<Foo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fooApi.listFoos(orgId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void load()
  }, [load])

  // Domain rules applied here, not in UI
  const editableFoos = items.filter(canEditFoo)

  return { items, editableFoos, loading, error, refetch: load }
}
```

> Always `'use client'` as first line.
> Wrap fetch in `useCallback` — prevents infinite loops.
> Apply domain rules in the hook, not in the component.
> Return shape: `{ data/items, loading, error, refetch, ...actions }`.

### 6. View model (only when UI needs derived/formatted data)

```typescript
// presentation/view-models/foo-list-item.vm.ts
import type { Foo } from '../../domain/model/foo'
import { FooStatus } from '../../domain/enums/foo.enum'

export interface FooListItemViewModel {
  id: string
  name: string
  statusLabel: string
  statusColor: 'green' | 'gray'
  canEdit: boolean
}

export function mapFooToListItemViewModel(foo: Foo): FooListItemViewModel {
  return {
    id: foo.id,
    name: foo.name,
    statusLabel: foo.status === FooStatus.Active ? 'Active' : 'Archived',
    statusColor: foo.status === FooStatus.Active ? 'green' : 'gray',
    canEdit: foo.status === FooStatus.Active,
  }
}
```

### 7. View + sub-components

```tsx
// presentation/ui/FoosView.tsx
'use client'

import { useParams } from 'next/navigation'
import { useFoos } from '../hooks/useFoos'
import { mapFooToListItemViewModel } from '../view-models/foo-list-item.vm'
import { ContentLoader, Stack } from '@/shared/ui'
import { FooListItem } from './FooListItem'

export function FoosView() {
  const { orgId } = useParams<{ orgId: string }>()
  const { items, loading, error } = useFoos(orgId)

  if (loading) return <ContentLoader />
  if (error) return <p>{error}</p>

  return (
    <Stack direction="vertical" spacing="md">
      {items.map(foo => (
        <FooListItem key={foo.id} vm={mapFooToListItemViewModel(foo)} />
      ))}
    </Stack>
  )
}
```

```tsx
// presentation/ui/FooListItem.tsx  ← sub-component, PascalCase
import type { FooListItemViewModel } from '../view-models/foo-list-item.vm'

export function FooListItem({ vm }: { vm: FooListItemViewModel }) {
  return <div>{vm.name}</div>
}
```

> All component files use PascalCase: `FoosView.tsx`, `FooListItem.tsx`, `CreateFooModal.tsx`.
> Components receive view models or domain models — they do NOT contain business logic.

### 8. Thin route in `app/`

```tsx
// app/org/[orgId]/foos/page.tsx
'use client'

import { FoosView } from '@/modules/foo'

export default function FoosPage() {
  return <FoosView />
}
```

### 9. Export from index files

```typescript
// presentation/ui → sub-module index.ts
export { FoosView } from './presentation/ui/FoosView'
export { useFoos } from './presentation/hooks/useFoos'
export * as fooApi from './infrastructure/api/foo.api'
export type { Foo } from './domain/model/foo'
export type { FooStatus } from './domain/enums/foo.enum'

// sub-module index.ts → bounded-context index.ts (facade)
export * from './foo'
```

### 10. Route helper (only if new page)

```typescript
// modules/{context}/lib/routes.ts
export const FOO_ROUTES = {
  list: (orgId: string) => `/org/${orgId}/foos`,
  detail: (orgId: string, fooId: string) => `/org/${orgId}/foos/${fooId}`,
}
```

---

## apiClient usage

```typescript
import { apiClient } from '@/shared/lib/apiClient'

const data    = await apiClient.get<ResponseType>(url)
const created = await apiClient.post<ResponseType>(url, body)
const updated = await apiClient.patch<ResponseType>(url, body)
await apiClient.delete<void>(url, { parseJson: false })
```

`apiClient` automatically:
- Routes through `/api/proxy/*` — BFF adds Authorization header from HttpOnly cookie.
- Throws `ApiError` on non-ok responses.
- Redirects to login on 401.

`apiPath(path)` from `@/shared/lib/api-paths`:
- Builds unversioned URLs under `/api` (matches BE `ApiPaths.BASE_PATH`)
- Example: `apiPath('/workspaces/...')` → `/api/workspaces/...`
- Example: `apiPath('/iam/users')` → `/api/iam/users`

---

## Error handling

### Global interceptor (automatic)

`ApiErrorProvider` in `app/Providers.tsx` shows a Sonner toast for failed API calls unless:
- Status is 401 (handled by redirect)
- Status is 400 or 422 (validation — hooks/forms own field/inline UX)
- Request passes `{ skipErrorToast: true }`
- URL matches suppressed legacy/dead routes

Do **not** duplicate toast.error in hooks for generic failures — the interceptor handles it.

### Hook-level errors (business-specific only)

```typescript
try {
  await fooApi.createFoo(orgId, body)
  toast.success('Created successfully')
  refetch()
} catch (err) {
  if (err instanceof ApiError && err.code === 'ALREADY_EXISTS') {
    setFieldError('name', 'This name is already taken')
  }
  // generic errors: global interceptor shows toast automatically
}
```

### Domain error messages

```typescript
// domain/messages/foo-error.messages.ts
export const FooErrorMessages = {
  ARCHIVED: 'This item is archived and cannot be edited.',
  MISSING_PERMISSION: 'You do not have permission to perform this action.',
} as const
```

---

## Auth and session

```typescript
import { useAuth } from '@/modules/auth'

const { session, profile, currentOrgId, orgs } = useAuth()
```

- Token is HttpOnly cookie — never read `document.cookie`.
- `profile.role` = platform role (`'admin' | 'user'`).
- `session.user` = minimal JWT payload.

---

## Do not

- Call `fetch()` directly — always `apiClient`.
- Hardcode API URLs in components, hooks, or api files — always `endpoints.ts`.
- Use TypeScript `enum` keyword — use `as const` objects instead.
- Put business logic in UI components — use `domain/rules/` and apply in hooks.
- Put React/apiClient imports in `domain/` layer.
- Import `infrastructure/api/*.api.ts` directly in UI components — always via hook.
- Import `@/shared/ui` components inside `domain/` or `infrastructure/`.
- Use `any` — define proper interfaces in `domain/model/`.
- Create `lib/`, `helpers/`, `services/`, `utils/` folders inside modules.
- Put domain UI in `app/**/_components/` — use `presentation/ui/` instead.
- Import deep module paths from `app/**` — only `@/modules/{context}` facade.
- Fetch data inside `useEffect` without a `useCallback`-wrapped function — causes infinite loops.

---

## See also

| Document                                           | Purpose                                       |
| -------------------------------------------------- | --------------------------------------------- |
| [`CODING_CONVENTIONS.md`](./CODING_CONVENTIONS.md) | Naming, lint rules, commit/PR standards       |
| [`.cursorrules`](./.cursorrules)                   | Cursor agent shorthand rules                  |
| [`docs/API_SPECIFICATION.md`](./docs/API_SPECIFICATION.md) | v1 infrastructure API reference       |
| [`../CLAUDE.md`](../CLAUDE.md)                     | Monorepo bounded context map (BE alignment)   |
