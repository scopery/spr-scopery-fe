# Scopery FE — Integration Notes (Phase / API v2)

## Environment variables

- **NEXT_PUBLIC_API_URL** (or **NEXT_PUBLIC_API_BASE_URL**) — Backend API base URL, no trailing slash. Example: `http://localhost:3000`.
- **NEXT_PUBLIC_SUPABASE_URL**, **NEXT_PUBLIC_SUPABASE_ANON_KEY** — Used when FE uses Supabase client (e.g. Google OAuth). Optional if using custom auth only.
- **NEXT_PUBLIC_AI_MAX_NOTE_BYTES** (optional) — Client-side hint for max intake text size; backend still enforces limit.

See `.env.example` for a template.

## Running FE locally

```bash
npm install
npm run dev
```

Default: Next.js dev server (e.g. `http://localhost:3001`). FE calls BE at `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:3000`). No AI feature flags needed on FE; handle `409 AI_FEATURE_DISABLED` from server when AI is disabled.

## Main route mapping

| Route | Screen |
|-------|--------|
| `/auth/login`, `/auth/register` | Login / Register (email/password + Google OAuth URL) |
| `/auth/callback` | OAuth callback |
| `/onboarding`, `/onboarding/profile` | Onboarding + profile view/edit (display_name, avatar signed URL) |
| `/org` (list) | Org list + create org |
| `/org/[orgId]` | Org detail |
| `/org/[orgId]/members` | Org members list |
| `/org/[orgId]/invites` (owner-only) | Invites: create/list/revoke; accept flow via `/invites/[token]` |
| `/org/[orgId]/projects` | Projects list + create project from template |
| `/org/[orgId]/projects/[projectId]` | Project detail (my_role, counts, active/latest session) |
| `/org/[orgId]/projects/[projectId]/questions` | Project questions (group by section, position); AI Generate Questions modal |
| `/org/[orgId]/projects/[projectId]/sessions` | Sessions list + create session |
| `/org/[orgId]/projects/[projectId]/sessions/[sessionId]` | Session detail: questions + answers, save/submit/lock/reopen, progress; AI Improve + Clarity assess/summary |
| `/org/[orgId]/projects/[projectId]/impact` | Impact analysis: intake (paste/upload) → baseline → review proposals → commit |

## API client layer

- **Base path**: All v2 calls use `/api/v2/...` (built in `constants/endpoints.ts` with `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_API_BASE_URL`).
- **Unified fetch**: `apiFetch<T>(pathOrUrl, { method, body, token })` in `lib/apiClient.ts`. Success returns parsed JSON (no envelope). Errors throw `ApiError` with RFC 9457 `ProblemDetails`.
- **Helpers**: `isProblemDetails(e)`, `getErrorCode(e)`, `getProblemRequestId(e)` in `types/api.ts`. Use `getProblemForModal(err)` in `lib/errorHandling.ts` to show message + `request_id` in error modals.

## Error handling (RFC 9457)

- Parse `application/problem+json` → `ProblemDetails` (`type`, `title`, `status`, `detail`, `instance`, `code`, `errors`, `request_id`).
- **422**: Show `errors[]` by field path.
- **409**: Branch by `code` (e.g. `ALREADY_SUBMITTED`, `SESSION_LOCKED`, `AI_BATCH_EXPIRED`, `AI_FEATURE_DISABLED`). Messages in `lib/errorHandling.ts`.
- **413 / PAYLOAD_TOO_LARGE**: “Payload too large. Reduce scope or try a smaller input.”
- **429**: “Too many requests. Please try again later.”
- **502** (AI): “AI failed to generate valid output. Try again.”
- Always show `request_id` in error modals for debug.

## Permission gating

- **Org**: `owner` | `member` | `partner` (partner read-only). Disable mutations for partner.
- **Project**: `editor` | `viewer` (viewer read-only). Disable PUT answers, submit, lock, AI mutations for viewer.
- Handle 403 from BE; do not log tokens or sensitive payloads.

## Patch plan (files changed in this phase)

- **types/api.ts** — Added `isProblemDetails`, `getErrorCode`, `getProblemRequestId`.
- **types/api-enums.ts** — Added `TemplateStatus.deprecated`, `ProjectQuestionSource`, `OrgStatus`.
- **lib/apiClient.ts** — Added `apiFetch()`, `getApiBaseUrl()`, `ApiFetchOptions`.
- **constants/endpoints.ts** — Base URL supports `NEXT_PUBLIC_API_BASE_URL` fallback.
- **lib/errorHandling.ts** — 413/PAYLOAD_TOO_LARGE message, `getProblemForModal()`, 502 message aligned to spec.
- **features/ai/api.ts** — `getIntakesUploadUrl(orgId, projectId, body)` with `file_name`, `mime_type`; exported `IntakesUploadUrlBody`.
- **features/ai/schemas.ts** — `QuestionsGenerateBody`: `base_session_id`, `base_revision_id`, `instruction`, `max_items`.
- **features/ai/hooks.ts** — `useIntakesUploadUrl` accepts body `{ file_name, mime_type }`.
- **app/org/.../impact/page.tsx** — Pass `file_name` and `mime_type` when calling upload URL.
- **app/org/.../questions/AIGenerateQuestionsModal.tsx** — Send `base_session_id` in generate body.
- **docs/INTEGRATION_NOTES.md** — This file.

Existing as-is and reused: auth, profile, org/project/session services, session detail (Improve + Clarity), impact flow, QGen modal, error toasts, permission utils.
