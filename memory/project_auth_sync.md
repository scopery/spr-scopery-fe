---
name: Auth mechanism sync — planned future work
description: Current auth is inconsistent across three parallel flows due to mid-migration; needs consolidation
type: project
---

Auth system currently runs three parallel flows because BE changed its contract mid-development (from `v2/auth/login` returning token in JSON body → `iam/auth/login` using Set-Cookie only). FE migrated API calls but left BFF proxy unupdated.

**Why:** App still works via rewrite path + access_token cookie, but BFF proxy was broken (scopery_token never set). Knowledge base headers require BFF. Long-term risk: new features that use proxy path will silently fail auth.

**How to apply:** When user mentions auth, refresh, login flow, or adding endpoints that need custom headers — suggest consolidating to BFF proxy (Option 1).

Recommended direction — **All through BFF proxy**:
1. Login: change `auth.api.ts` to use `/api/proxy/iam/auth/login`; BFF reads `access_token` from BE's Set-Cookie → saves as `scopery_token`
2. All authenticated API calls: migrate from `apiPath('/...')` to `/api/proxy/...`
3. Remove dead code: `v2/auth/login` BFF handler, `/api/auth/session` DELETE route
4. Fix `/api/auth/session` DELETE: also clear `access_token` cookie
5. Google OAuth: implement properly or remove `/api/auth/google/*` routes entirely

Partial fix already applied (2026-08-27):
- BFF proxy now reads `access_token` as fallback → proxy calls work
- Refresh routed through `/api/proxy/iam/auth/refresh` → BFF updates cookies after refresh
