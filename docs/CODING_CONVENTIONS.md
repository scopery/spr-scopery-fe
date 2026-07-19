# Scopery FE — Coding Conventions

> **Status:** Living document — Architecture v2 (2026-06).
> **Audience:** All FE contributors, Cursor/Claude agents.
> **Related:** `CLAUDE.md` (architecture + call flows), `.cursorrules` (AI assistant), `.eslintrc.json` (enforced rules)
> **Last migration:** All admin, ai-agent-control, ai-document-intelligence modules fully migrated to domain/infrastructure/presentation (2026-06-28).

---

## 1. Principles

1. **Thin routes, fat modules** — `app/**` wires URLs; all business logic lives in `modules/`.
2. **Four clear layers** — domain / infrastructure / presentation / shared-ui. Each has one responsibility.
3. **Domain is pure** — `domain/` must never import React, apiClient, or any external dependency.
4. **Unidirectional data flow** — `Page → View → Hook → api.ts → apiClient`.
5. **Facade imports from routes** — `app/**` imports only `@/modules/{context}`.
6. **Design system is business-agnostic** — `shared/ui` never imports domain code.

---

## 2. Tech stack

| Layer         | Choice                                                 |
| ------------- | ------------------------------------------------------ |
| Framework     | Next.js 14 App Router, TypeScript strict               |
| Styling       | Tailwind CSS + design tokens (`shared/tokens/`)        |
| HTTP          | `shared/lib/apiClient.ts` via BFF `/api/proxy/*`       |
| State         | React Context (auth) + module hooks + local `useState` |
| Validation    | Zod (client-side where needed)                         |
| Lint / format | ESLint + Prettier (see §10)                            |

---

## 3. Module directory layout

```
modules/{bounded-context}/{sub-module}/
  domain/
    model/              ← Business objects (camelCase, match BE semantics)
    enums/              ← String literal const objects — NOT TypeScript enum keyword
    rules/              ← Pure business logic functions
    messages/           ← Business error/validation message constants

  infrastructure/
    api/
      endpoints.ts      ← DOMAIN_ENDPOINTS using apiPath()
      {domain}.api.ts   ← Typed apiClient calls
    schemas/            ← Raw API response shapes (snake_case, raw strings)
    mappers/            ← Schema ↔ domain model conversion

  presentation/
    hooks/              ← React orchestration (useState, useEffect, useCallback)
    view-models/        ← UI-specific derived shape from domain model
    ui/                 ← Components: *View.tsx, *Modal.tsx, *Panel.tsx, *Item.tsx

  index.ts              ← Sub-module public API
index.ts                ← Bounded-context facade (only entry for app/**)
```

### When to create each optional folder

| Folder                       | Create when                                                          |
| ---------------------------- | -------------------------------------------------------------------- |
| `domain/rules/`              | Any business decision logic (can user do X? is status Y valid?)      |
| `domain/messages/`           | Business error/validation string constants exist                     |
| `infrastructure/schemas/`    | BE returns snake_case or shape differs from domain model             |
| `infrastructure/mappers/`    | Schema ≠ domain model — always pair with `schemas/`                  |
| `presentation/view-models/`  | UI needs derived/formatted data not suitable in domain model         |

> **Never create** `lib/`, `services/`, `helpers/`, or `utils/` inside a module.
> Route logic to the specific folder above instead.

### Top-level app structure

```
app/                          Thin routes only (~5–15 lines per page.tsx)
shared/
  ui/                         Design system (atoms + molecules) — zero business imports
  lib/                        apiClient, api-types, errorHandling, api-paths, dataMode
  tokens/                     Design tokens
config/                       Feature flags (features.ts)
constants/                    Transitional barrel — re-exports from modules only
utils/                        Generic cross-cutting: cn, useDebounce, shims
```

### Removed — do not recreate

```
hooks/          (global barrel)
services/
types/
features/
shared/components/
app/**/_components/
```

---

## 4. Bounded contexts

| Context                    | Sub-modules                                                                                                                      | Facade import                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `admin`                    | ai-config, ai-agents, ai-budgets, ai-routing, ai-playground, ai-feedback, admin-templates, iam, organizations, workspaces, ...   | `@/modules/admin`                    |
| `ai-agent-control`         | agent-control, prompt-registry, runtime                                                                                          | `@/modules/ai-agent-control`         |
| `ai-document-intelligence` | document-ai, project-ai, related-documents                                                                                       | `@/modules/ai-document-intelligence` |
| `auth`                     | auth, profile, onboarding, workspace-context, iam                                                                                | `@/modules/auth`                     |
| `collaboration`            | core, panel, comments, suggestions, activity, sharing                                                                            | `@/modules/collaboration`            |
| `controlled-lists`         | lists, values                                                                                                                    | `@/modules/controlled-lists`         |
| `documents`                | document, document-templates, document-links, deliverables, document-hub, document-export, evidence-documents, project-sections  | `@/modules/documents`                |
| `governance`               | policy, simulator, preset-preview                                                                                                | `@/modules/governance`               |
| `landscape`                | landscape                                                                                                                        | `@/modules/landscape`                |
| `org`                      | org, invites, workspace, workspace-members, workspace-invitations                                                                | `@/modules/org`                      |
| `external-party`           | organizations, contacts                                                                                                          | `@/modules/external-party`           |
| `rate-card`                | cost-roles, inflation-policies, member-cost-roles, cards, resolution                                                             | `@/modules/rate-card`                |
| `configuration`            | object-types, custom-fields, forms, layouts, status-sets, tags, taxonomies                                                       | `@/modules/configuration`            |
| `permissions`              | access                                                                                                                           | `@/modules/permissions`              |
| `platform`                 | layout, guards                                                                                                                   | `@/modules/platform`                 |
| `projects`                 | project, questions, requirements, ai-impact, traceability                                                                        | `@/modules/projects`                 |
| `sessions`                 | session, clarity, ai-improve                                                                                                     | `@/modules/sessions`                 |

---

## 5. Layer responsibilities

### 5.1 `domain/` — Business truth

Must not import: React, Next.js, apiClient, shared/ui, or any other layer.

**`domain/model/`** — Business objects:
```ts
// domain/model/session.ts
import type { SessionStatus } from '../enums/session.enum'

export interface Session {
  id: string
  orgId: string
  projectId: string
  status: SessionStatus
  createdAt: string
}

export interface CreateSessionPayload {
  projectId: string
  name: string
}
```

**`domain/enums/`** — Fixed business values as `as const` objects:
```ts
// domain/enums/session.enum.ts
export const SessionStatus = {
  Draft: 'DRAFT',
  Locked: 'LOCKED',
  Submitted: 'SUBMITTED',
} as const
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus]
```

> Use `as const` object — **never** the TypeScript `enum` keyword.
> Types must match BE response shape exactly — do not invent fields.

**`domain/rules/`** — Pure business decisions:
```ts
// domain/rules/session.rules.ts
import type { Session } from '../model/session'
import { SessionStatus } from '../enums/session.enum'

export function isSessionLocked(session: Session): boolean {
  return session.status === SessionStatus.Locked
}

export function canSubmitSession(session: Session): boolean {
  return session.status === SessionStatus.Draft
}
```

> Rules must be pure: input → output. No API calls, no React, no side effects.

**`domain/messages/`** — Business error/validation strings:
```ts
// domain/messages/session-error.messages.ts
export const SessionErrorMessages = {
  ALREADY_SUBMITTED: 'This session has already been submitted.',
  SESSION_LOCKED: 'This session is locked and cannot be edited.',
} as const
```

### 5.2 `infrastructure/` — External implementation

Knows how to communicate with the backend. Can import from `domain/` but not from `presentation/`.

**`infrastructure/api/endpoints.ts`**:
```ts
import { apiPath } from '@/shared/lib/api-paths'

export const SESSION_ENDPOINTS = {
  list: (orgId: string) => apiPath(`/orgs/${orgId}/sessions`),
  get: (orgId: string, sessionId: string) => apiPath(`/orgs/${orgId}/sessions/${sessionId}`),
  create: (orgId: string) => apiPath(`/orgs/${orgId}/sessions`),
  lock: (orgId: string, sessionId: string) => apiPath(`/orgs/${orgId}/sessions/${sessionId}/lock`),
} as const
```

**`infrastructure/api/{domain}.api.ts`**:
```ts
import { apiClient } from '@/shared/lib/apiClient'
import { SESSION_ENDPOINTS } from './endpoints'
import type { Session, CreateSessionPayload } from '../../domain/model/session'

export async function listSessions(orgId: string): Promise<Session[]> {
  return apiClient.get<Session[]>(SESSION_ENDPOINTS.list(orgId))
}

export async function createSession(orgId: string, body: CreateSessionPayload): Promise<Session> {
  return apiClient.post<Session>(SESSION_ENDPOINTS.create(orgId), body)
}
```

> Never call `fetch()` — always `apiClient`.
> Never catch errors in the API layer — let `ApiError` bubble up.
> Never define domain types (interfaces, type aliases) inside `*.api.ts` — define them in `domain/model/` and import from there.

**`infrastructure/schemas/`** — Raw API response (only when different from domain model):
```ts
// infrastructure/schemas/session.schema.ts
export interface SessionSchema {
  id: string
  org_id: string       // snake_case
  project_id: string
  status: string
  created_at: string   // raw string
}
```

**`infrastructure/mappers/`** — Schema → domain conversion:
```ts
// infrastructure/mappers/session.mapper.ts
import type { Session } from '../../domain/model/session'
import type { SessionSchema } from '../schemas/session.schema'

export function mapSessionSchemaToDomain(schema: SessionSchema): Session {
  return {
    id: schema.id,
    orgId: schema.org_id,
    projectId: schema.project_id,
    status: schema.status as Session['status'],
    createdAt: schema.created_at,
  }
}
```

### 5.3 `presentation/` — React layer

Contains everything React-specific. Can import from `domain/` and `infrastructure/api/`.

**`presentation/hooks/`**:
```ts
// presentation/hooks/useSessions.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import * as sessionApi from '../../infrastructure/api/sessions.api'
import { canSubmitSession } from '../../domain/rules/session.rules'
import type { Session } from '../../domain/model/session'

export function useSessions(orgId: string | null) {
  const [items, setItems] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      setItems(await sessionApi.listSessions(orgId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { void load() }, [load])

  return {
    items,
    submittableItems: items.filter(canSubmitSession),  // ← rules applied here
    loading,
    error,
    refetch: load,
  }
}
```

> Always `'use client'` as first line.
> Apply domain rules in the hook, not in the component.
> Return shape: `{ data/items, loading, error, refetch, ...actions }`.
> Wrap fetch in `useCallback` — prevents `useEffect` infinite loops.

**`presentation/view-models/`** — UI-specific derived shape (only when needed):
```ts
// presentation/view-models/session-list-item.vm.ts
import type { Session } from '../../domain/model/session'
import { SessionStatus } from '../../domain/enums/session.enum'

export interface SessionListItemViewModel {
  id: string
  statusLabel: string
  statusColor: 'green' | 'yellow' | 'gray'
  canSubmit: boolean
}

export function mapSessionToListItemViewModel(session: Session): SessionListItemViewModel {
  const labels: Record<string, string> = {
    [SessionStatus.Draft]: 'Draft',
    [SessionStatus.Locked]: 'Locked',
    [SessionStatus.Submitted]: 'Submitted',
  }
  return {
    id: session.id,
    statusLabel: labels[session.status] ?? session.status,
    statusColor: session.status === SessionStatus.Draft ? 'yellow'
      : session.status === SessionStatus.Submitted ? 'green' : 'gray',
    canSubmit: session.status === SessionStatus.Draft,
  }
}
```

**`presentation/ui/`** — Components. PascalCase for ALL files:
```tsx
// presentation/ui/SessionsView.tsx
'use client'

import { useParams } from 'next/navigation'
import { ContentLoader, Stack } from '@/shared/ui'
import { useSessions } from '../hooks/useSessions'
import { mapSessionToListItemViewModel } from '../view-models/session-list-item.vm'
import { SessionListItem } from './SessionListItem'

export function SessionsView() {
  const { orgId } = useParams<{ orgId: string }>()
  const { items, loading, error } = useSessions(orgId)

  if (loading) return <ContentLoader />
  if (error) return <p>{error}</p>

  return (
    <Stack direction="vertical" spacing="md">
      {items.map(s => <SessionListItem key={s.id} vm={mapSessionToListItemViewModel(s)} />)}
    </Stack>
  )
}
```

> Components focus on rendering — no business logic, no API calls.
> Sub-components also PascalCase: `SessionListItem.tsx`, `SessionDetailHeader.tsx`.

### 5.4 Route — `app/**/page.tsx`

```tsx
'use client'

import { SessionsView } from '@/modules/sessions'

export default function SessionsPage() {
  return <SessionsView />
}
```

> Max ~15 lines. Import View from module facade only.

---

## 6. Import rules

### 6.1 Dependency direction

```
presentation  →  domain
presentation  →  infrastructure/api (via hook only)
infrastructure →  domain
infrastructure →  shared/lib/apiClient
domain        →  (nothing — pure TypeScript only)
```

### 6.2 Who may import what

| From → To                         | `app/**`  | `presentation` | `infrastructure` | `domain` | `shared/ui` |
| --------------------------------- | --------- | -------------- | ---------------- | -------- | ----------- |
| `@/modules/{context}` (facade)    | ✅        | ✅             | ❌               | ❌       | ❌          |
| `@/modules/{context}/{sub}`       | ❌        | ✅ cross-sub   | ❌               | ❌       | ❌          |
| `presentation/**` directly        | ❌        | ✅ relative    | ❌               | ❌       | ❌          |
| `infrastructure/api/*.api.ts`     | ❌        | ✅ hooks only  | ✅               | ❌       | ❌          |
| `domain/**`                       | ❌        | ✅             | ✅               | ✅ rel.  | ❌          |
| `@/shared/ui`                     | ✅        | ✅             | ❌               | ❌       | —           |
| `@/shared/lib/*`                  | ✅        | ✅             | ✅               | ❌       | ✅          |
| `@/utils/cn`, `@/utils/*`         | ✅        | ✅             | ❌               | ❌       | ✅          |

### 6.3 Forbidden — hard rules

| Rule | Why |
| ---- | --- |
| `domain/` must not import React, Next.js, apiClient, shared/ui | Domain must be pure and testable |
| `presentation/ui/` must not import `*.api.ts` directly | Always go through a hook |
| `shared/ui/` must not import `@/modules/*` | Design system is business-agnostic |
| `app/**/page.tsx` must not import deep module paths | Routes use facade only |
| No `fetch()` anywhere in modules | Always use `apiClient` |
| No TypeScript `enum` keyword | Use `as const` objects instead |
| No domain types defined inside `*.api.ts` | Types belong in `domain/model/`; infra imports from domain |
| No module-root `endpoints.ts` | Endpoints live in `infrastructure/api/endpoints.ts` per sub-module |
| No cross-sub-module deep path imports | Use sub-module facade `@/modules/{ctx}/{sub}` |

### 6.4 Import order (enforce in format pass)

```ts
// 1. 'use client' directive (if needed — must be first line)
// 2. React / Next.js
// 3. External packages
// 4. @/shared/*
// 5. @/modules/* (facade or sub-module index)
// 6. @/utils/*, @/config/*, @/constants/*
// 7. Relative imports (../../domain/model, ../hooks)
```

---

## 7. Naming conventions

| Artifact              | Pattern                                                     | Example                               |
| --------------------- | ----------------------------------------------------------- | ------------------------------------- |
| Route file            | `page.tsx`                                                  | `app/org/[orgId]/sessions/page.tsx`   |
| View                  | `{Feature}View.tsx`                                         | `SessionsView.tsx`                    |
| Modal                 | `{Feature}Modal.tsx`                                        | `CreateSessionModal.tsx`              |
| Panel                 | `{Feature}Panel.tsx`                                        | `SessionDetailPanel.tsx`              |
| Sub-component         | `{Feature}{Part}.tsx` — PascalCase, same folder as View     | `SessionListItem.tsx`                 |
| Hook                  | `use{Feature}.ts`                                           | `useSessions.ts`                      |
| API file              | `{domain}.api.ts`                                           | `sessions.api.ts`                     |
| Endpoints file        | `endpoints.ts`                                              | `infrastructure/api/endpoints.ts`     |
| Endpoint constant     | `{DOMAIN}_ENDPOINTS`                                        | `SESSION_ENDPOINTS`                   |
| Enum file             | `{domain}.enum.ts` inside `domain/enums/`                   | `domain/enums/session.enum.ts`        |
| Model file            | `{domain}.ts` inside `domain/model/`                        | `domain/model/session.ts`             |
| Rules file            | `{domain}.rules.ts` inside `domain/rules/`                  | `domain/rules/session.rules.ts`       |
| Messages file         | `{domain}-{type}.messages.ts`                               | `domain/messages/session-error.messages.ts` |
| Schema file           | `{domain}.schema.ts`                                        | `infrastructure/schemas/session.schema.ts`  |
| Mapper file           | `{domain}.mapper.ts`                                        | `infrastructure/mappers/session.mapper.ts`  |
| View model file       | `{domain}-{variant}.vm.ts`                                  | `presentation/view-models/session-list-item.vm.ts` |
| Sub-module folder     | kebab-case, singular concept                                | `document-templates/`                 |
| Component export      | PascalCase named export                                     | `export function CreateSessionModal`  |

---

## 8. TypeScript

- **Strict mode** — no `any` (ESLint error).
- Use `interface` for object shapes in `domain/model/` and `infrastructure/schemas/`.
- Use `as const` + derived `type` for string enums in `domain/enums/*.enum.ts`.
- **Never** use the TypeScript `enum` keyword — causes bundle issues and is not tree-shakeable.
- Import types from `domain/` barrel (`../domain/model/session`) — never deep paths inside schema/infra.
- Match BE response shapes exactly — do not invent fields in domain model.
- `ApiError` from `@/shared/lib/api-types` for error handling.

---

## 9. Styling

- Use `cn()` from `@/utils/cn` for className merging.
- Design tokens via Tailwind: `bg-primary`, `text-neutral-900`, `p-md`.
- No arbitrary values unless approved: ❌ `bg-[#3b82f6]` ✅ `bg-primary`.
- Prettier plugin sorts Tailwind classes automatically.

---

## 10. Formatting & lint

**Prettier** (`.prettierrc`):

| Option        | Value                       |
| ------------- | --------------------------- |
| semicolons    | `false`                     |
| quotes        | single                      |
| tabWidth      | 2                           |
| printWidth    | 100                         |
| trailingComma | es5                         |
| plugins       | prettier-plugin-tailwindcss |

**Commands:**

```bash
npm run format          # write
npm run format:check    # CI check
npm run lint            # ESLint
npx tsc --noEmit        # type check
NEXT_PUBLIC_DATA_MODE=mock npm run build
```

---

## 11. Error handling

### Global interceptor (automatic)

`ApiErrorProvider` in `app/Providers.tsx` shows a Sonner toast for all failed API calls unless:
- Status is 401 (handled by apiClient redirect)
- Request passes `{ skipErrorToast: true }`

**Do not** add `toast.error` for generic failures in hooks — the interceptor handles it.

### Hook-level (business-specific only)

```ts
try {
  await sessionApi.submitSession(orgId, sessionId)
  toast.success('Session submitted')
  refetch()
} catch (err) {
  if (err instanceof ApiError && err.code === 'ALREADY_SUBMITTED') {
    toast.error(SessionErrorMessages.ALREADY_SUBMITTED)
  }
}
```

### Autosave paths

Pass `{ skipGlobalLoading: true, skipErrorToast: true }` on debounced saves to avoid duplicate UX.

---

## 12. Adding a new feature (checklist)

1. **Pick bounded context** — extend existing or create `modules/{context}/`
2. **Domain** — `domain/model/`, `domain/enums/` (always required)
3. **Rules + messages** — `domain/rules/`, `domain/messages/` (when business logic exists)
4. **Endpoints** — `infrastructure/api/endpoints.ts`
5. **API functions** — `infrastructure/api/{domain}.api.ts`
6. **Schema + mapper** — `infrastructure/schemas/` + `infrastructure/mappers/` (when BE shape ≠ domain)
7. **Hook** — `presentation/hooks/use{Feature}.ts`
8. **View model** — `presentation/view-models/` (when UI needs derived shape)
9. **View + components** — `presentation/ui/` (PascalCase all files)
10. **Export** — sub-module `index.ts` → context facade `index.ts`
11. **Route** — thin `app/**/page.tsx` importing View from facade
12. **Route helper** — add to `modules/{context}/lib/routes.ts`
13. **Verify** — `tsc --noEmit`, `lint`, mock build

---

## 13. Middleware & environment

- Edge routing config: `config/middleware.ts` (matcher, public paths, auth redirects).
- Root `middleware.ts` is a thin re-export — do not add logic there.
- Admin role guard runs client-side in `app/admin/layout.tsx`.
- `.env.local` for local secrets (gitignored). `.env.example` documents required keys.
- Mock builds: `NEXT_PUBLIC_DATA_MODE=mock npm run build`.

---

## 14. Route helpers

Canonical route definitions in `modules/{context}/lib/routes.ts`. Composed `ROUTES` re-exported from `@/modules/platform` (preferred) and `@/constants/routes` (backward-compat barrel).

---

## 15. Transitional debt (do not expand)

| Item                                | Target state                                         |
| ----------------------------------- | ---------------------------------------------------- |
| `constants/endpoints.ts`            | Re-export barrel only — new endpoints in modules     |
| `constants/routes.ts`               | Backward-compat barrel — prefer `@/modules/platform` |
| `utils/permissions.ts`              | Shim → use `@/modules/permissions`                   |
| `utils/answerText.ts`               | Shim → use `modules/sessions/session/domain/rules/`  |
| Fat routes (>15 lines)              | Thin to `<XxxView />` pattern                        |

### Completed migrations (do not re-introduce old patterns)

| Module group                    | Migrated (2026-06-28)                                             |
| ------------------------------- | ----------------------------------------------------------------- |
| `admin/*` (8 sub-modules)       | ai-config, ai-agents, ai-budgets, ai-routing, ai-playground, ai-feedback, admin-templates, iam |
| `ai-agent-control/*`            | agent-control, prompt-registry, runtime                           |
| `ai-document-intelligence/*`    | document-ai, project-ai, related-documents                        |

All above modules now follow `domain/infrastructure/presentation` structure. The flat `api/`, `hooks/`, `model/`, `ui/` pattern at sub-module root is **retired**.

---

## 16. Git commit messages

Imperative mood, focus on **why**:

| Prefix     | When                                 |
| ---------- | ------------------------------------ |
| `feat`     | New user-facing capability           |
| `fix`      | Bug fix                              |
| `refactor` | Structure change, no behavior change |
| `chore`    | Tooling, deps, docs                  |
| `test`     | Tests only                           |

```
feat(sessions): add submit confirmation modal with governance check
fix(documents): prevent duplicate archive on rapid click
refactor(projects): migrate model to domain/enums + domain/model
```

---

## 17. PR template

```markdown
## Summary
- <!-- 1–3 bullets: what changed and why -->

## Module(s)
- <!-- e.g. modules/sessions/session/domain/rules -->

## Test plan
- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `NEXT_PUBLIC_DATA_MODE=mock npm run build`
- [ ] <!-- manual: route / flow tested -->

## Screenshots / recordings
<!-- UI changes only -->
```

---

## 18. PR review checklist

- [ ] No business rules inside `presentation/ui/` components
- [ ] `domain/` has no React, Next.js, or apiClient imports
- [ ] `presentation/ui/` never imports `*.api.ts` directly — always via hook
- [ ] `shared/ui/` has no business imports
- [ ] `app/**` imports only `@/modules/{context}` facade
- [ ] No TypeScript `enum` keyword — using `as const` instead
- [ ] No `lib/`, `services/`, `helpers/` folders created inside module
- [ ] Endpoints in `infrastructure/api/endpoints.ts` per sub-module — not at bounded-context root
- [ ] Enums in `domain/enums/*.enum.ts`, models in `domain/model/*.ts`
- [ ] No domain types defined inline in `*.api.ts` — always in `domain/model/`
- [ ] Cross-sub-module imports use `@/modules/{ctx}/{sub}` facade, not deep paths
- [ ] `'use client'` is first line when present
- [ ] `tsc --noEmit` passes
- [ ] No secrets in commits

---

## 19. Document map

| File                                               | Purpose                               |
| -------------------------------------------------- | ------------------------------------- |
| `CODING_CONVENTIONS.md`                            | **This file** — canonical conventions |
| `CLAUDE.md`                                        | Architecture, call flows, step-by-step how-to |
| `docs/API_SPECIFICATION.md`                        | v1 infrastructure API reference       |
| `.cursorrules`                                     | Cursor agent shorthand rules          |
| `../CLAUDE.md` (monorepo root)                     | Bounded context map vs BE             |

---

_Last updated: 2026-06-28 — Architecture v2: completed migration of admin/*, ai-agent-control/*, ai-document-intelligence/* to layered pattern; clarified API-layer type rule and endpoints placement._
