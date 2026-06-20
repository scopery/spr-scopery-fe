# Scopery FE — Coding Conventions

> **Status:** Living document — post modularization migration (2026-06).  
> **Audience:** All FE contributors. Cursor/Claude rules mirror this file.  
> **Related:** `CLAUDE.md` (how-to), `.cursorrules` (AI assistant), `.eslintrc.json` (enforced rules)

---

## 1. Principles

1. **Thin routes, fat modules** — `app/**` wires URLs; business logic lives in `modules/`.
2. **One bounded context, many sub-modules** — mirror BE domain boundaries.
3. **Unidirectional data flow** — `Page → View → Hook → API → apiClient`.
4. **Facade imports from routes** — `app/**` imports only `@/modules/{context}`.
5. **Design system is business-agnostic** — `shared/ui` never imports domain code.
6. **Types colocated with domain** — no global `types/`, `services/`, `hooks/`.

---

## 2. Tech stack

| Layer         | Choice                                                 |
| ------------- | ------------------------------------------------------ |
| Framework     | Next.js 14 App Router, TypeScript strict               |
| Styling       | Tailwind CSS + design tokens (`shared/tokens/`)        |
| HTTP          | `shared/lib/apiClient.ts` via BFF `/api/proxy/*`       |
| State         | React Context (auth) + module hooks + local `useState` |
| Tests         | Vitest (design system), Storybook                      |
| Lint / format | ESLint + Prettier (see §10)                            |

---

## 3. Directory layout

```
app/                          # Thin routes only (~5–15 lines per page.tsx)
shared/
  ui/                         # Design system (atoms + molecules)
  lib/                        # apiClient, api-types, errorHandling, api-paths
  tokens/                     # Color, spacing, typography tokens
modules/                      # All business logic
  {bounded-context}/
    {sub-module}/
      api/                    # *.api.ts + endpoints.ts
      hooks/                  # use*.ts
      model/                  # Types, view models, constants
      ui/                     # *View.tsx, modals, panels
      lib/                    # Pure helpers (permissions, mappers)
      index.ts                # Sub-module public API
    index.ts                  # Facade — only entry for app/**
config/                       # Feature flags (features.ts)
constants/                    # Transitional: routes.ts, re-export endpoints
utils/                        # Generic + transitional shims (cn, inviteToken, …)
mocks/                        # Mock fixtures (NEXT_PUBLIC_DATA_MODE=mock)
```

### Removed (do not recreate)

- `hooks/` (global barrel)
- `services/`
- `types/`
- `features/`
- `shared/components/` (migrated to modules)
- `app/**/_components/` (use `modules/*/ui/`)

---

## 4. Bounded contexts & sub-modules

| Context                    | Sub-modules                                                                                                                     | Facade import                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `admin`                    | ai-config, ai-agents, ai-budgets, ai-routing, ai-playground, ai-feedback, admin-templates                                       | `@/modules/admin`                    |
| `ai-agent-control`         | agent-control, prompt-registry, runtime                                                                                         | `@/modules/ai-agent-control`         |
| `ai-document-intelligence` | document-ai, project-ai, related-documents                                                                                      | `@/modules/ai-document-intelligence` |
| `auth`                     | auth, profile                                                                                                                   | `@/modules/auth`                     |
| `collaboration`            | core, panel, comments, suggestions, activity, sharing                                                                           | `@/modules/collaboration`            |
| `controlled-lists`         | lists, values                                                                                                                   | `@/modules/controlled-lists`         |
| `documents`                | document, document-templates, document-links, deliverables, document-hub, document-export, evidence-documents, project-sections | `@/modules/documents`                |
| `governance`               | policy, simulator, preset-preview                                                                                               | `@/modules/governance`               |
| `landscape`                | landscape                                                                                                                       | `@/modules/landscape`                |
| `org`                      | org, invites                                                                                                                    | `@/modules/org`                      |
| `permissions`              | access                                                                                                                          | `@/modules/permissions`              |
| `platform`                 | layout, guards                                                                                                                  | `@/modules/platform`                 |
| `projects`                 | project, questions, requirements, ai-impact, traceability                                                                       | `@/modules/projects`                 |
| `sessions`                 | session, clarity, ai-improve                                                                                                    | `@/modules/sessions`                 |

---

## 5. Layer responsibilities

### 5.1 Route — `app/**/page.tsx`

- **Max ~15 lines** (target; legacy routes being thinned)
- `'use client'` when rendering client Views
- Import View from module facade only
- May read `params` / `searchParams` and pass as props (optional)

```tsx
'use client'

import { SessionDetailView } from '@/modules/sessions'

export default function SessionDetailPage() {
  return <SessionDetailView />
}
```

### 5.2 View — `modules/*/ui/*View.tsx`

- Page body, layout composition, event wiring
- May call hooks from same or imported sub-modules
- **Must not** call `apiClient` directly — go through hooks or API layer
- Naming: `{Feature}View`, `{Entity}DetailView`, `{Action}Modal`

### 5.3 Hook — `modules/*/hooks/use*.ts`

- Always `'use client'`
- Data fetching, mutations, derived state
- Calls `../api/*.api.ts` functions
- Return shape: `{ data/items, loading, error, refetch, ...actions }`
- Wrap fetch in `useCallback`; depend correctly in `useEffect`

### 5.4 API — `modules/*/api/*.api.ts`

- Typed functions wrapping `apiClient.get/post/patch/delete`
- Import URLs from `./endpoints.ts` (same folder) or sibling sub-module endpoints
- **Do not** catch errors — let `ApiError` bubble to UI
- Export as namespace from sub-module index: `export * as fooApi from './api/foo.api'`

### 5.5 Endpoints — `modules/*/api/endpoints.ts`

- Use `v2()` from `@/shared/lib/api-paths`
- One `*_ENDPOINTS` object per file (or related group)
- `constants/endpoints.ts` re-exports for backward compat — **new endpoints go in modules**

### 5.6 Model — `modules/*/model/*.ts`

- Domain types matching BE response shapes
- View models, enums, label maps
- No React imports

### 5.7 Design system — `shared/ui/`

- Atoms/molecules with **zero** business imports
- Token-based styling, polymorphic `as`, variants, ARIA, forwardRef
- Tests + Storybook for new atoms

---

## 6. Import rules

### 6.1 Who may import what

| From → To                       | `app/**` | `modules/**`        | `shared/ui` |
| ------------------------------- | -------- | ------------------- | ----------- |
| `@/modules/{context}` (facade)  | ✅       | ✅                  | ❌          |
| `@/modules/{context}/{sub}`     | ❌       | ✅ cross sub-module | ❌          |
| `@/modules/.../api/*` deep path | ❌       | ⚠️ api layer only   | ❌          |
| Relative within sub-module      | —        | ✅ preferred        | —           |
| `@/shared/ui`                   | ✅       | ✅                  | —           |
| `@/shared/lib/*`                | ✅       | ✅                  | ✅          |
| `@/utils/cn`                    | ✅       | ✅                  | ✅          |
| `@/constants/routes`            | ✅       | ✅                  | ❌          |

ESLint enforces the above (see `.eslintrc.json`).

### 6.2 Import order (recommended — enforce in format pass)

```tsx
// 1. 'use client' (if needed)
// 2. React / Next.js
// 3. External packages
// 4. @/shared/*
// 5. @/modules/* (facade or sub-module index)
// 6. @/utils/*, @/config/*, @/constants/*
// 7. Relative imports (../model, ../hooks)
// 8. Types (if type-only block preferred)
```

### 6.3 `'use client'` placement

Always **first line** of the file (before any import).

---

## 7. Naming conventions

| Artifact          | Pattern                              | Example                              |
| ----------------- | ------------------------------------ | ------------------------------------ |
| Route file        | `page.tsx`                           | `app/org/[orgId]/projects/page.tsx`  |
| Page View         | `{Name}View.tsx`                     | `ProjectDocumentsView.tsx`           |
| Modal / Panel     | `{Name}Modal.tsx`, `{Name}Panel.tsx` | `CreateProjectModal.tsx`             |
| Hook              | `use{Feature}.ts`                    | `useProjectDocuments.ts`             |
| API file          | `{domain}.api.ts`                    | `sessions.api.ts`                    |
| Endpoints         | `{DOMAIN}_ENDPOINTS`                 | `SESSION_ENDPOINTS`                  |
| Model file        | `{entity}.ts` or `{feature}.ts`      | `session.ts`, `ai-questions.ts`      |
| Sub-module folder | kebab-case, singular concept         | `document-templates/`                |
| Component export  | PascalCase                           | `export function CreateSessionModal` |

### TODO (team to finalize before format)

- [ ] File naming: `*.types.ts` vs inline types in model
- [ ] Test file suffix: `*.test.tsx` vs `*.spec.tsx`
- [ ] Index barrel: always `index.ts` vs direct file imports within sub-module

---

## 8. TypeScript

- **Strict mode** — no `any` (ESLint error)
- Domain types in `modules/*/model/` — not global
- Use `interface` for object shapes; `type` for unions/aliases
- Match BE response shapes exactly — do not invent fields
- API errors: `ApiError` from `@/shared/lib/api-types`
- Export public types from sub-module `index.ts`

---

## 9. Styling

- Use `cn()` from `@/utils/cn` for className merging
- Design tokens via Tailwind: `bg-primary`, `text-neutral-900`, `p-md`
- **No arbitrary values** unless approved: ❌ `bg-[#3b82f6]` ✅ `bg-primary`
- Prettier plugin sorts Tailwind classes automatically

---

## 10. Formatting & lint (current config)

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
npm run format        # write
npm run format:check  # CI check
npm run lint          # ESLint
npx tsc --noEmit      # type check
NEXT_PUBLIC_DATA_MODE=mock npm run build
```

### TODO (team to finalize)

- [ ] Add `import/order` ESLint rule matching §6.2
- [ ] Add `lint-staged` + pre-commit hook
- [ ] CI gate: `format:check` + `tsc` + `build`

---

## 11. Error handling

```tsx
import { ApiError } from '@/shared/lib/api-types'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { toast } from 'sonner'

try {
  await fooApi.create(orgId, body)
} catch (err) {
  toast.error(getProblemToastMessage(err))
}
```

- Never call `fetch()` — use `apiClient`
- Never read `document.cookie` for auth — use `useAuth()` from `@/modules/auth`
- Governance blocked errors: `getGovernanceBlockedMessage()` from `@/utils/governanceError`

---

## 12. Adding a new feature (checklist)

1. **Pick bounded context** — extend existing or create new top-level `modules/{context}/`
2. **Create sub-module** — `api/`, `hooks/`, `model/`, `ui/`, `index.ts`
3. **Endpoints** — `modules/{context}/{sub}/api/endpoints.ts` using `v2()`
4. **API functions** — `*.api.ts` with typed `apiClient` calls
5. **Hook** — orchestrate load/mutate/error state
6. **View** — compose UI from `@/shared/ui` + module components
7. **Export** — sub-module `index.ts` → context facade `index.ts`
8. **Route** — thin `app/**/page.tsx` importing View from facade
9. **Route helper** — add to `constants/routes.ts` if new URL
10. **Verify** — `tsc`, `lint`, mock build

---

## 13. Transitional debt (known — do not expand)

| Item                                | Target state                               |
| ----------------------------------- | ------------------------------------------ |
| `constants/endpoints.ts`            | Re-export only; new endpoints in modules   |
| `constants/routes.ts`               | Colocate or keep global (TBD)              |
| `constants/governance.constants.ts` | Move to `modules/governance/policy/model/` |
| `utils/permissions.ts`              | Shim → use `@/modules/permissions`         |
| `utils/template-permissions.ts`     | Shim → use `@/modules/documents`           |
| Fat routes (~145–240 lines)         | Thin to `<XxxView />` pattern              |

---

## 14. Git commit messages

Use imperative mood, focus on **why** (1–2 sentences). Prefix optional:

| Prefix     | When                                 |
| ---------- | ------------------------------------ |
| `feat`     | New user-facing capability           |
| `fix`      | Bug fix                              |
| `refactor` | Structure change, no behavior change |
| `chore`    | Tooling, deps, docs                  |
| `test`     | Tests only                           |

**Examples:**

```
feat(projects): add AI question generation modal to questions view

fix(sessions): prevent duplicate submit when session is locked

refactor(documents): colocate endpoints in project-sections api layer
```

**Do not** commit `.env`, credentials, or large unrelated refactors mixed with feature work.

---

## 15. Pull request template

```markdown
## Summary

- <!-- 1–3 bullets: what changed and why -->

## Module(s)

- <!-- e.g. modules/projects/questions, modules/sessions -->

## Test plan

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `NEXT_PUBLIC_DATA_MODE=mock npm run build`
- [ ] <!-- manual: route / flow tested -->

## Screenshots / recordings

<!-- UI changes only -->
```

Keep PRs scoped to one bounded context or one vertical slice when possible.

---

## 16. PR review checklist

- [ ] No new code in removed global folders
- [ ] `app/**` imports only from `@/modules/{context}` facade
- [ ] No `apiClient` in View components
- [ ] No business imports in `shared/ui/`
- [ ] Endpoints in module `api/endpoints.ts`, not inline URLs
- [ ] Types in `model/`, matching BE shape
- [ ] `'use client'` first line when present
- [ ] `tsc --noEmit` passes
- [ ] No secrets in commits (`.env`, keys)

---

## 17. Document map

| File                           | Purpose                               |
| ------------------------------ | ------------------------------------- |
| `CODING_CONVENTIONS.md`        | **This file** — canonical conventions |
| `CLAUDE.md`                    | Step-by-step how-to for AI / new devs |
| `.cursorrules`                 | Cursor agent shorthand rules          |
| `.eslintrc.json`               | Enforced import boundaries            |
| `../CLAUDE.md` (monorepo root) | Bounded context map vs BE             |

---

_Last updated: 2026-06-19 — after Phase F/G/H modularization migration._
