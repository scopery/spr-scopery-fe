# Scopery-FE — Frontend Convention Guide

> **Canonical conventions:** [`CODING_CONVENTIONS.md`](./CODING_CONVENTIONS.md) — naming, imports, layers, PR checklist.  
> **Bounded context map (BE):** read `../CLAUDE.md` at monorepo root.

## Tech stack

- **Framework**: Next.js 14 App Router (TypeScript)
- **Styling**: Tailwind CSS + design tokens
- **API**: `shared/lib/apiClient.ts` — routes through `/api/proxy/*` BFF (HttpOnly cookie auth)
- **State**: React Context (`modules/auth/auth/context/AuthContext.tsx`) + local useState/hooks
- **Validation**: Zod (client-side where needed)

---

## Directory structure

```
app/                      Next.js App Router — thin routes only (~5–15 lines per page.tsx)
  api/proxy/[...path]/    BFF proxy — do not modify unless changing auth architecture
  api/auth/               Auth endpoints (Google OAuth, session management)
shared/
  ui/                     Design system — atoms + molecules, ZERO business logic
    atoms/                Button, Input, Badge, Typography, Stack, Modal, ...
    molecules/            AISuggestion, EventCard, FileMediaLibrary, ...
    index.ts              Barrel — import as @/shared/ui
  lib/                    Core infrastructure
    apiClient.ts          HTTP client — never call fetch() directly
    api-types.ts          ApiError, RFC 9457 helpers
    dataMode.ts           Mock mode toggle (NEXT_PUBLIC_DATA_MODE=mock)
    errorHandling.ts      Toast and field-error helpers
  tokens/                 Design tokens (colors, spacing, typography, radius, shadows)
modules/                  Business logic — nested sub-modules per bounded context
  documents/              document/, document-templates/, project-sections/, ...
  projects/               project/, questions/, requirements/, ai-impact/, ...
  sessions/               session/, clarity/, ai-improve/
  org/                    org/, invites/
  admin/                  ai-config/, ai-agents/, admin-templates/, ...
  ...                     See bounded-context map in ../CLAUDE.md
  {context}/
    {sub-module}/
      api/                API calls via apiClient
      hooks/              Data orchestration
      model/              Domain types, view models
      ui/                 Views (*View.tsx), modals, panels
      index.ts            Sub-module exports
    index.ts              Public facade — app imports only from here
mocks/                    Mock fixtures + resolver (keep during rebuild)
config/                   features.ts
constants/                Transitional — endpoints and route helpers (colocate per module over time)
utils/                    Domain utilities (permissions, inviteToken, cn, …)
scripts/archive/          One-time migration scripts (historical)
```

> **Full conventions:** [`CODING_CONVENTIONS.md`](./CODING_CONVENTIONS.md) — naming, imports, commit/PR standards.

### Import conventions (current standard)

| Import                             | Use for                                                  |
| ---------------------------------- | -------------------------------------------------------- |
| `@/shared/ui`                      | Pure design system (Button, Input, Modal, …)             |
| `@/shared/lib/*`                   | apiClient, dataMode, errorHandling, api-types            |
| `@/modules/{context}`              | **All** business module work from `app/**` (facade only) |
| `@/modules/{context}/{sub-module}` | Cross sub-module imports within modules                  |
| `@/utils/*`                        | Domain utilities (permissions, cn, inviteToken, …)       |
| `@/constants/*`                    | Endpoints and routes (transitional)                      |
| `@/config/*`                       | Feature flags                                            |

### Module structure (nested sub-modules)

```
modules/{bounded-context}/
  {sub-module}/
    api/ hooks/ model/ ui/ index.ts
  index.ts   ← public facade for app/**
```

Pattern: **Page → View → Hook → API → apiClient**

- **Route** (`app/**/page.tsx`) — thin wrapper rendering `<XxxView />`
- **View** (`modules/*/ui/*View.tsx`) — page body and UI composition
- **Hook** (`modules/*/hooks/`) — data orchestration
- **API** (`modules/*/api/`) — typed apiClient calls
- **Model** (`modules/*/model/`) — domain types and view models

Do not add new domain code to removed global folders (`hooks/`, `services/`, `types/`).
Do not use `app/**/_components/` — put UI in `modules/*/ui/`.

---

## Adding a new feature — step by step

### 1. Declare endpoints in `constants/endpoints.ts`

```typescript
export const FOO_ENDPOINTS = {
  list: (orgId: string, params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/foos`) + (q ? `?${q}` : '')
  },
  get: (orgId: string, fooId: string) => v2(`/orgs/${orgId}/foos/${fooId}`),
  create: (orgId: string) => v2(`/orgs/${orgId}/foos`),
  patch: (orgId: string, fooId: string) => v2(`/orgs/${orgId}/foos/${fooId}`),
  delete: (orgId: string, fooId: string) => v2(`/orgs/${orgId}/foos/${fooId}`),
} as const
```

- All URLs must go through the `v2()` helper — never hardcode the base URL.
- Naming convention: `DOMAIN_ENDPOINTS` (e.g. `FOO_ENDPOINTS`, `ORG_ENDPOINTS`).

### 2. Declare types in `modules/{context}/{sub-module}/model/`

```typescript
// modules/foo/bar/model/foo.ts
export interface Foo {
  id: string
  org_id: string
  name: string
  created_at: string
}

export interface FooListResponse {
  items: Foo[]
  page: { limit: number; offset: number; total: number }
}
```

- Types must match the BE response shape exactly — do not invent extra fields.
- Use `interface` for object shapes; `type` only for unions and aliases.

### 3. Write API functions in `modules/{context}/{sub-module}/api/`

```typescript
// modules/foo/bar/api/foo.api.ts
import { FOO_ENDPOINTS } from '@/constants/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type { Foo, FooListResponse } from '../model/foo'

export async function listFoos(
  orgId: string,
  params?: { limit?: number; offset?: number }
): Promise<FooListResponse> {
  return apiClient.get<FooListResponse>(FOO_ENDPOINTS.list(orgId, params))
}

export async function createFoo(orgId: string, body: { name: string }): Promise<Foo> {
  return apiClient.post<Foo>(FOO_ENDPOINTS.create(orgId), body)
}
```

- API functions are `async` and return typed Promises.
- Never call `fetch()` directly — always use `apiClient`.
- Do not catch errors in the API layer — let `apiClient` throw `ApiError`; the UI handles it.
- Export from sub-module `index.ts` and root facade.

### 4. Write a custom hook in `modules/{context}/{sub-module}/hooks/`

```typescript
// modules/foo/bar/hooks/useFoos.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import * as fooApi from '../api/foo.api'
import type { Foo } from '../model/foo'
import { ApiError } from '@/shared/lib/api-types'

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
      setError(err instanceof ApiError ? err.detail : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    load()
  }, [load])

  return { items, loading, error, refetch: load }
}
```

- Add `'use client'` at the top of every hook file.
- Return shape: `{ data/items, loading, error, refetch }` — stay consistent.
- Never fetch inside a component — always go through a hook.
- Wrap fetch in `useCallback` to prevent effect loops.

### 5. Write View in `modules/` and thin route in `app/`

```typescript
// modules/foo/bar/ui/FoosView.tsx
'use client'

import { useParams } from 'next/navigation'
import { useFoos } from '../hooks/useFoos'
import { ContentLoader, Stack } from '@/shared/ui'

export function FoosView() {
  const { orgId } = useParams<{ orgId: string }>()
  const { items, loading, error } = useFoos(orgId)

  if (loading) return <ContentLoader />
  if (error) return <p>{error}</p>

  return (
    <Stack direction="vertical" spacing="md">
      {items.map(foo => <FooCard key={foo.id} foo={foo} />)}
    </Stack>
  )
}

// app/org/[orgId]/foos/page.tsx
'use client'

import { FoosView } from '@/modules/foo'

export default function FoosPage() {
  return <FoosView />
}
```

### 6. Add a route helper in `constants/routes.ts` (only if a new page is needed)

```typescript
export const ROUTES = {
  // ...existing
  org: {
    foos: (orgId: string) => `/org/${orgId}/foos`,
    fooDetail: (orgId: string, fooId: string) => `/org/${orgId}/foos/${fooId}`,
  },
}
```

---

## apiClient usage

```typescript
import { apiClient } from '@/shared/lib/apiClient'

// GET
const data = await apiClient.get<ResponseType>(url)

// POST with body
const created = await apiClient.post<ResponseType>(url, { field: value })

// PATCH
const updated = await apiClient.patch<ResponseType>(url, body)

// DELETE (no response body)
await apiClient.delete<void>(url, { parseJson: false })
```

`apiClient` automatically:

- Routes through `/api/proxy/*` (BFF) so the server adds the Authorization header from the HttpOnly cookie.
- Throws `ApiError` when the response is not ok.
- Redirects to login on 401.

---

## Error handling in UI

```typescript
import { ApiError } from '@/shared/lib/api-types'

try {
  await fooService.createFoo(orgId, body)
} catch (err) {
  if (err instanceof ApiError) {
    // err.status  — HTTP status code
    // err.detail  — human-readable message
    // err.code    — business error code (e.g. ALREADY_SUBMITTED)
    // err.errors  — validation errors [{ path, message }]
    setError(err.detail)
  }
}
```

---

## Components — import conventions

```typescript
// Design system
import { Button, Stack, Typography, ContentLoader, Badge } from '@/shared/ui'

// Business modules — app routes use facade only
import { ProjectDocumentsView, CreateDocumentModal } from '@/modules/documents'
import { CreateProjectModal, ProjectQuestionsView } from '@/modules/projects'
import { AppShell, AuthGuard } from '@/modules/platform'

// Infrastructure
import { apiClient } from '@/shared/lib/apiClient'
import { cn } from '@/utils/cn'
```

### Component placement rules

| Where                                | Rule                                                      |
| ------------------------------------ | --------------------------------------------------------- |
| `shared/ui/`                         | Only primitive/generic props; no business imports         |
| `modules/{context}/{sub-module}/ui/` | All domain UI — views, modals, panels                     |
| `app/**/page.tsx`                    | Thin route only — render `<XxxView />` from module facade |

Check `shared/ui/` and existing module `ui/` folders before creating a new component.

---

## Auth and session

```typescript
// In any component that needs user info
import { useAuth } from '@/modules/auth'

const { session, profile, currentOrgId, orgs } = useAuth()
```

- The session token is an HttpOnly cookie — it cannot be read by JavaScript.
- Read user info through `useAuth()` — never read `document.cookie` directly.
- `profile` = full profile data from the BE; `session.user` = minimal info decoded from the JWT payload.

---

## Do not

- Call `fetch()` directly — always use `apiClient`.
- Hardcode API URLs in components or hooks — declare them in `constants/endpoints.ts`.
- Read `document.cookie` to get the token — the token is HttpOnly; use hooks instead.
- Define endpoint constants inline inside a service file.
- Use `any` — define a proper interface in `modules/*/model/`.
- Fetch data inside `useEffect` without a `useCallback`-wrapped function — causes infinite loops.
- Import from auth API inside components — use `useAuth()` from `@/modules/auth` instead.
- Import design system components via deep path (`@/shared/ui/atoms/Button/Button`) — always use the barrel (`@/shared/ui`).
- Put a component in `shared/ui/` if it imports from `services/`, `types/`, or any business enum.
- Put domain UI in `app/**/_components/` — use `modules/*/ui/` instead.

---

## See also

| Document                                           | Purpose                                                     |
| -------------------------------------------------- | ----------------------------------------------------------- |
| [`CODING_CONVENTIONS.md`](./CODING_CONVENTIONS.md) | Canonical conventions, commit/PR template, review checklist |
| [`.cursorrules`](./.cursorrules)                   | Cursor agent rules                                          |
| [`../CLAUDE.md`](../CLAUDE.md)                     | Monorepo bounded context map (BE alignment)                 |
