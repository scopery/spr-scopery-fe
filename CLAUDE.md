# Scopery-FE — Frontend Convention Guide

> Read `../CLAUDE.md` first to understand the bounded context map.

## Tech stack

- **Framework**: Next.js 14 App Router (TypeScript)
- **Styling**: Tailwind CSS + design tokens
- **API**: `shared/lib/apiClient.ts` — routes through `/api/proxy/*` BFF (HttpOnly cookie auth)
- **State**: React Context (`contexts/AuthContext.tsx`) + local useState/hooks
- **Validation**: Zod (client-side where needed)

---

## Directory structure

```
app/                      Next.js App Router pages and layouts
  api/proxy/[...path]/    BFF proxy — do not modify unless changing auth architecture
  api/auth/               Auth endpoints (Google OAuth, session management)
  <route>/
    _components/          Route-private components — used by exactly one route segment
shared/
  ui/                     Design system — atoms + molecules, ZERO business logic
    atoms/                Button, Input, Badge, Typography, Stack, Modal, ...
    molecules/            AISuggestion, EventCard, FileMediaLibrary, ...
    index.ts              Barrel — import as @/shared/ui
  components/             Cross-app layout, guards, common dialogs; legacy domain UI (migrating)
    layout/               AppShell, AdminShell, HelpGuideModal
    guards/               AuthGuard
    common/               ConfirmDialog
    documents/            Document UI (legacy — will move to modules/documents/ui)
    editor/               Plate.js rich text editor (legacy)
    governance/           Governance UI (legacy)
    ...                   Other domain folders — transitional until module migration
  lib/                    Core infrastructure
    apiClient.ts          HTTP client — never call fetch() directly
    dataMode.ts           Mock mode toggle (NEXT_PUBLIC_DATA_MODE=mock)
    errorHandling.ts      RFC 9457 error helpers
  tokens/                 Design tokens (colors, spacing, typography, radius, shadows)
  utils/                  Generic utilities only (cn, polymorphic)
modules/                  Long-term business module home (skeleton in place)
  documents/              ui/, hooks/, api/, model/
  projects/               ui/, hooks/, api/, model/
  sessions/               ui/, hooks/, api/, model/
  org/                    ui/, hooks/, api/, model/
  auth/                   ui/, hooks/, api/, model/
  governance/             ui/, hooks/, api/, model/
  ai-agent-control/       ui/, hooks/, api/, model/
mocks/                    Mock fixtures + resolver (keep during rebuild)
config/                   features.ts
constants/                Legacy — API endpoints and route helpers (transitional)
hooks/                    Legacy — data-fetching hooks (transitional)
services/                 Legacy — API services (transitional)
types/                    Legacy — domain types (transitional)
utils/                    Legacy — domain-specific utilities (transitional)
lib/template-variables/   Template variable parser (domain utility, not infrastructure)
contexts/
  AuthContext.tsx         Session, profile, and orgs state
```

### Import conventions (current standard)

| Import | Use for |
|---|---|
| `@/shared/ui` | Pure design system (Button, Input, Modal, …) |
| `@/shared/components/*` | Global layout, guards, common dialogs; legacy shared domain UI |
| `@/shared/lib/*` | apiClient, dataMode, errorHandling |
| `@/shared/tokens/*` | Design token values and types |
| `@/shared/utils/*` | Generic utilities (cn, polymorphic) |
| `@/modules/*` | **New** business module work |
| `@/hooks/*`, `@/services/*`, `@/types/*`, `@/constants/*` | Legacy transitional folders — do not add new domain code here |
| `app/.../_components/` | Route-private components |

### New module work pattern

For new features, prefer `modules/{module}/` with:

```
Container → Hook → Service/API → Mapper → Types/ViewModel
```

- **View** (`modules/{module}/ui/*View.tsx`) — presentational only; no service imports
- **Container** — wires hook to view
- **Hook** (`modules/{module}/hooks/`) — data orchestration
- **API** (`modules/{module}/api/`) — services, endpoints, API mappers
- **Model** (`modules/{module}/model/`) — domain types, view models, mock data

Do not put service calls inside presentational views.
Do not add new domain-specific components to `shared/components/` unless they are intentionally cross-app.

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
  get:    (orgId: string, fooId: string) => v2(`/orgs/${orgId}/foos/${fooId}`),
  create: (orgId: string)               => v2(`/orgs/${orgId}/foos`),
  patch:  (orgId: string, fooId: string) => v2(`/orgs/${orgId}/foos/${fooId}`),
  delete: (orgId: string, fooId: string) => v2(`/orgs/${orgId}/foos/${fooId}`),
} as const
```

- All URLs must go through the `v2()` helper — never hardcode the base URL.
- Naming convention: `DOMAIN_ENDPOINTS` (e.g. `FOO_ENDPOINTS`, `ORG_ENDPOINTS`).

### 2. Declare types in `types/`

```typescript
// types/foo.ts
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

### 3. Write a service in `services/`

```typescript
// services/foo.service.ts
import { FOO_ENDPOINTS } from '@/constants/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type { Foo, FooListResponse } from '@/types/foo'

export async function listFoos(
  orgId: string,
  params?: { limit?: number; offset?: number }
): Promise<FooListResponse> {
  return apiClient.get<FooListResponse>(FOO_ENDPOINTS.list(orgId, params))
}

export async function createFoo(orgId: string, body: { name: string }): Promise<Foo> {
  return apiClient.post<Foo>(FOO_ENDPOINTS.create(orgId), body)
}

export async function deleteFoo(orgId: string, fooId: string): Promise<void> {
  return apiClient.delete<void>(FOO_ENDPOINTS.delete(orgId, fooId), { parseJson: false })
}
```

- Service functions are `async` and return typed Promises.
- Never call `fetch()` directly — always use `apiClient`.
- Do not catch errors in the service — let `apiClient` throw `ApiError`; the UI handles it.
- One file per domain: `foo.service.ts` — never combine unrelated services.

### 4. Write a custom hook in `hooks/`

```typescript
// hooks/useFoos.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import * as fooService from '@/services/foo.service'
import type { Foo } from '@/types/foo'
import { ApiError } from '@/types/api'

export function useFoos(orgId: string | null) {
  const [items, setItems] = useState<Foo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fooService.listFoos(orgId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { load() }, [load])

  return { items, loading, error, refetch: load }
}
```

- Add `'use client'` at the top of every hook file.
- Return shape: `{ data/items, loading, error, refetch }` — stay consistent.
- Never fetch inside a component — always go through a hook.
- Wrap fetch in `useCallback` to prevent effect loops.

### 5. Write page/component in `app/`

```typescript
// app/org/[orgId]/foos/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { useFoos } from '@/hooks/useFoos'
import { ContentLoader, Stack } from '@/shared/ui'

export default function FoosPage() {
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
```

### 6. Add a route helper in `constants/routes.ts` (only if a new page is needed)

```typescript
export const ROUTES = {
  // ...existing
  org: {
    foos:      (orgId: string) => `/org/${orgId}/foos`,
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
import { ApiError } from '@/types/api'

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
// Design system atoms/molecules — import from @/shared/ui
import { Button, Stack, Typography, ContentLoader, Badge } from '@/shared/ui'

// Domain-aware reusable components — import from @/shared/components/<domain>
import { DocumentEditor } from '@/shared/components/editor/DocumentEditor'
import { GovernanceStatusBanner } from '@/shared/components/governance/GovernanceStatusBanner'
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog'
import { AppShell } from '@/shared/components/layout/AppShell'

// Infrastructure
import { apiClient } from '@/shared/lib/apiClient'
import { cn } from '@/shared/utils/cn'

// Route-private components — relative import from _components/
import { CreateProjectModal } from './_components/CreateProjectModal'
import { ClarityPanel } from './_components/ClarityPanel'
```

### Component placement rules

| Where | Rule |
|---|---|
| `shared/ui/` | Only if it receives primitive/generic props and does NOT import from `services/`, `types/`, `constants/`, `shared/lib/`, or business enums |
| `shared/components/<domain>/` | Reusable and used by 2+ distinct routes; may import services and types |
| `app/.../_components/` | Used by exactly one route segment; not reused elsewhere |

Check `shared/ui/` and `shared/components/` before creating a new component.

---

## Auth and session

```typescript
// In any component that needs user info
import { useAuth } from '@/hooks/useAuth'

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
- Use `any` — define a proper interface in `types/`.
- Fetch data inside `useEffect` without a `useCallback`-wrapped function — causes infinite loops.
- Import from `services/auth.service.ts` inside components — use `useAuth()` instead.
- Import design system components via deep path (`@/shared/ui/atoms/Button/Button`) — always use the barrel (`@/shared/ui`).
- Put a component in `shared/ui/` if it imports from `services/`, `types/`, or any business enum.
- Put a component in `app/.../_components/` if it is used by more than one route segment.
