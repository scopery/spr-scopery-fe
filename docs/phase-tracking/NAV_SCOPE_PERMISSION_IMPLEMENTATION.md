# Nav Scope + Permission Matrix — Implementation Spec & Checklist

> **Status:** LOCKED (product decisions 2026-07-28)  
> **Repos:** FE `docs/phase-tracking/NAV_SCOPE_PERMISSION_IMPLEMENTATION.md`  
> **BE mirror:** `spr-scopery-be/src/docs/security/NAV_CAPABILITY_MATRIX.md` (same content)  
> **Related:** `IAM_PERMISSION_COVERAGE.md`, `AppShell.tsx`, `EnsureWorkspaceMemberBaselineAccessAction`, `IamOwnerPolicyCatalogInitializer`

This document is the **single source of truth** to implement and verify Org / Workspace / Project directory separation and **hide-unauthorized-tabs** UX. Do not invent new permission codes unless a row below is marked `NEW`.

---

## 0. Product decisions (locked)

| ID | Decision |
|----|----------|
| D1 | Unauthorized tab → **hide** (never show-then-403 as primary UX) |
| D2 | Member **cannot** see Capacity, Clients, Commercial, Quality (and related) |
| D3 | Workspace **owner = full** CREATE/APPROVE on delivery + commercial + quality modules |
| D4 | **Organization** gets its **own sidebar section** with distinct labels |
| D5 | **Project directory** is required (re-enable members; not `notFound`) |
| D6 | Settings gear = **Personal only**; Workspace / Org settings = separate entries; **Admin Console = single entry** for platform admin |
| D7 | Capability **pack API** is nav contract; **check-batch** remains engine / fallback (same keys) |
| D8 | PROJECT-scoped IAM resource = **Phase C** (later); until then all project checks use **WORKSPACE** resource |
| D9 | Three directories are distinct: Org / Workspace / Project — never one shared “Directory” for all three |

### Role hierarchy (UX)

| Role | Nav / settings |
|------|----------------|
| Contributor (ws member) | Common + limited workspace/project tabs; Personal settings only |
| Workspace owner | Full workspace + project tabs; Workspace settings entry |
| Org owner | + Organization sidebar/directory/settings; Create workspace |
| Platform admin | **Only** via Admin Console button — not mixed into Personal settings |

---

## 1. Current pain (baseline before work)

| Issue | Evidence |
|-------|----------|
| Tabs always shown | `AppShell` workspace/project sidebars — feature flags only |
| `canViewProjects` unused | `useAppShellAuthorization` computes it; nav ignores it |
| Document Hub forced on | `canViewDocumentHub = true` in `AppShell` |
| Settings mixes Personal + Org + Admin | `buildSettingsNavSections.ts` |
| Org under Settings only | No Organization sidebar section |
| Project members disabled | `app/.../projects/[projectId]/members/page.tsx` → `notFound()` |
| Owner policy incomplete | Owner catalog lacks SCOPE/REQ/DOC_HUB/RAID/…; baseline has `REPORTING.VIEW` but dashboard needs `DASHBOARD_VIEW` |
| No nav capabilities API | Only `POST /api/iam/authorization/check-batch` (≤100) |

---

## 2. Target IA

```
COMMON (always above context sidebar)
  Search | Document Hub* | AI* | My Insights* | Work Inbox* | Notifications
  (* gated by capability and/or FEATURES)

WORKSPACE CONTEXT SIDEBAR
  Overview | Activity* | Projects | Capacity* | Clients* | Applications* | Support* | Forms*
  ── Workspace directory ──
    Members | Teams* | Invitations* | Join requests*
  ── Organization ──                    ← NEW SECTION (label must say Organization)
    Org members* | Org invitations* | Org teams* | (entry Create workspace*)

PROJECT CONTEXT SIDEBAR
  Overview | Plan… | Scope & Requirements… | Quality* | Commercial* | Control… | Collab… | Intelligence…
  ── Project directory ──               ← NEW (re-enable)
    Members | (Access later)

SETTINGS MODE (gear)
  Personal only: Profile | Preferences | My notifications
  Links (not admin dumps):
    → “Workspace settings” if canManageWorkspace
    → “Organization settings” if org owner
  Admin IAM / NAD / Phase defs / etc. → Admin Console ONLY

ADMIN CONSOLE
  Single entry from user menu (existing Admin Console)
```

### Route conventions (target)

| Surface | Route pattern |
|---------|---------------|
| Workspace directory | `/workspace/{wsId}/directory?tab=members\|teams\|invitations\|join-requests` |
| Organization directory | `/workspace/{wsId}/organization/directory?tab=members\|invitations\|teams` (legacy `/organization/members` + `/invitations` redirect here) |
| Organization settings | `/workspace/{wsId}/organization/settings` (or existing org settings routes) |
| Workspace settings | `/workspace/{wsId}/settings/...` |
| Project directory | `/workspace/{wsId}/projects/{projectId}/directory?tab=members` (alias `/members` OK) |
| Personal settings | `/account/...` + workspace notification prefs |

---

## 3. Capability packs — API contract

### 3.1 Endpoints

```http
GET /api/workspaces/{workspaceId}/capabilities?pack=NAV_WORKSPACE
GET /api/workspaces/{workspaceId}/capabilities?pack=NAV_PROJECT
GET /api/workspaces/{workspaceId}/capabilities?pack=NAV_SETTINGS
GET /api/organizations/{organizationId}/capabilities?pack=NAV_ORG
```

Auth: authenticated user; must be able to resolve the resource (org member / workspace member as applicable). Missing membership → 403/404 consistent with existing IAM patterns.

### 3.2 Response shape

```json
{
  "resourceType": "WORKSPACE",
  "resourceRefId": "uuid",
  "pack": "NAV_WORKSPACE",
  "capabilities": {
    "workspace.overview": true,
    "workspace.projects": true,
    "workspace.directory.teams": false
  }
}
```

Rules:

- Every key in the pack schema **must** appear (boolean, never omit).
- Evaluation reuses `AuthorizationDecisionService` / same path as check-batch.
- `resourceType` for NAV_ORG = `ORGANIZATION`; others = `WORKSPACE`.
- Project pack still evaluates on **workspace** resource (Phase A–B).

### 3.3 check-batch fallback

FE may build the same checks via `POST /api/iam/authorization/check-batch` using the mapping tables below. Pack keys stay identical so FE can swap transport without UI rewrite.

Batch limit: **100**. Prefer pack endpoint for full nav (≥40 keys).

---

## 4. Capability matrix (nav keys → authority → role)

Legend:

- **M** = workspace member (contributor baseline target)
- **WO** = workspace owner (owner policy + baseline)
- **OO** = org owner
- **PA** = platform admin (Admin Console only — not nav packs below)
- ✅ grant for that role · ❌ deny · FF = also requires FE `FEATURES.*`

Authority column = `IamAuthorities` constant. Permission/action codes are those constants’ underlying codes.

### 4.1 Pack `NAV_ORG` (resource = ORGANIZATION)

| Capability key | UI | Authority (VIEW gate) | M | OO |
|----------------|----|------------------------|---|----|
| `org.directory` | Organization section visible if any child true | derived | ❌ | ✅ |
| `org.directory.members` | Org members | `ORGANIZATION_MANAGE` | ❌ | ✅ |
| `org.directory.invitations` | Org invitations | `ORGANIZATION_MANAGE` | ❌ | ✅ |
| `org.directory.teams` | Org teams | `TEAM_VIEW` on ORGANIZATION | ❌ | ✅ |
| `org.create_workspace` | Create workspace CTA | `ORGANIZATION_CREATE_WORKSPACE` | ❌ | ✅ |
| `org.settings` | Organization settings entry | `ORGANIZATION_MANAGE` | ❌ | ✅ |

### 4.2 Pack `NAV_WORKSPACE` (resource = WORKSPACE)

| Capability key | UI tab / entry | Authority | M | WO |
|----------------|----------------|-----------|---|----|
| `workspace.overview` | Overview | `WORKSPACE_VIEW` | ✅ | ✅ |
| `workspace.activity` | Activity | `WORKSPACE_VIEW` *(confirm API; else add dedicated)* | ✅ | ✅ |
| `workspace.projects` | Projects | `PROJECT_VIEW` | ✅ | ✅ |
| `workspace.projects.create` | Create project button | `PROJECT_CREATE` | ❌ | ✅ |
| `workspace.capacity` | Capacity | `CAPACITY_VIEW` | ❌ | ✅ |
| `workspace.clients` | Clients & Contacts | `EXTERNAL_PARTY_VIEW` | ❌ | ✅ |
| `workspace.applications` | Applications | `REQUIREMENT_VIEW` + FF `requirementsTraceability` | ❌ | ✅ |
| `workspace.support` | Support | `WORKSPACE_VIEW` + FF `serviceSupport` *(audit API)* | ❌ | ✅ |
| `workspace.forms` | Forms | `WORKSPACE_VIEW` *(audit)* | ❌ | ✅ |
| `workspace.directory` | Directory entry if any child | derived | ✅ | ✅ |
| `workspace.directory.members` | Members | `WORKSPACE_MEMBER_VIEW` | ✅ | ✅ |
| `workspace.directory.teams` | Teams | `TEAM_VIEW` | ❌ | ✅ |
| `workspace.directory.invitations` | Invitations | `WORKSPACE_INVITE_MEMBER` | ❌ | ✅ |
| `workspace.directory.join_requests` | Join requests | `WORKSPACE_MANAGE_JOIN_REQUEST` | ❌ | ✅ |
| `workspace.settings` | Workspace settings entry | `WORKSPACE_MANAGE_SETTING` **or** `WORKSPACE_UPDATE` | ❌ | ✅ |
| `common.document_hub` | Document Hub | `DOCUMENT_HUB_VIEW` | ✅ | ✅ |
| `common.search` | Global search | `GLOBAL_SEARCH_USE` / productivity VIEW | ✅ | ✅ |
| `common.my_insights` | My Insights | `WORK_INBOX_VIEW` or productivity VIEW + FF `myWork` | ✅ | ✅ |
| `common.work_inbox` | Work Inbox | `WORK_INBOX_VIEW` + FF `workInbox` | ✅ | ✅ |
| `common.notifications` | Notifications | productivity VIEW *(or always if product)* | ✅ | ✅ |
| `common.ai_assistant` | AI Assistant | provisional: always or productivity VIEW | ✅ | ✅ |

### 4.3 Pack `NAV_PROJECT` (evaluated on WORKSPACE)

| Capability key | UI tab | Authority | M | WO | FF |
|----------------|--------|-----------|---|----|----|
| `project.overview` | Overview | `PROJECT_VIEW` | ✅ | ✅ | |
| `project.work` | Work Items | `PROJECT_TASK_VIEW` | ✅ | ✅ | |
| `project.wbs` | WBS | `PROJECT_WBS_VIEW` | ✅ | ✅ | |
| `project.timeline` | Timeline | `PROJECT_WBS_VIEW` *(or task VIEW — audit)* | ✅ | ✅ | |
| `project.schedule` | Schedule | `PROJECT_PHASE_VIEW` *(audit)* | ✅ | ✅ | |
| `project.resources` | Resources | `PROJECT_ALLOCATION_VIEW` | ❌ | ✅ | |
| `project.scope` | Scope | `SCOPE_VIEW` | ✅ | ✅ | |
| `project.deliverables` | Deliverables | `DELIVERABLE_VIEW` | ✅ | ✅ | |
| `project.requirements` | Requirement Evidence | `REQUIREMENT_VIEW` | ✅ | ✅ | `requirementsTraceability` |
| `project.functional_catalog` | Functional Catalog | `REQUIREMENT_VIEW` | ✅ | ✅ | same |
| `project.application_structure` | Application Structure | `REQUIREMENT_VIEW` | ✅ | ✅ | same |
| `project.traceability` | Traceability | `REQUIREMENT_VIEW` | ✅ | ✅ | same |
| `project.quality` | Quality | `QUALITY_VIEW` | ❌ | ✅ | `quality` |
| `project.test_plans` | Test plans | `TEST_VIEW` | ❌ | ✅ | `quality` |
| `project.defects` | Defects | `DEFECT_VIEW` | ❌ | ✅ | `quality` |
| `project.releases` | Releases | `RELEASE_VIEW` | ❌ | ✅ | `quality` |
| `project.estimation` | Estimation | `ESTIMATION_VIEW` | ❌ | ✅ | |
| `project.financials` | Financials | `PROJECT_FINANCE_VIEW` | ❌ | ✅ | |
| `project.profitability` | Profitability | `PROFITABILITY_SUMMARY_VIEW` | ❌ | ✅ | |
| `project.quotes` | Quotes | `QUOTE_VIEW` | ❌ | ✅ | |
| `project.raid` | RAID | `RAID_VIEW` | ✅ | ✅ | |
| `project.decisions` | Decisions | `DECISION_VIEW` | ✅ | ✅ | |
| `project.baselines` | Baselines | `PROJECT_BASELINE_VIEW` | ❌ | ✅ | |
| `project.change_requests` | Change Requests | `CHANGE_REQUEST_VIEW` | ❌ | ✅ | |
| `project.governance` | Governance | `OBJECT_GOVERNANCE` VIEW *(audit)* | ❌ | ✅ | `projectGovernance` |
| `project.meetings` | Meetings | collaboration VIEW | ✅ | ✅ | |
| `project.client_collaboration` | Client Collaboration | `CLIENT_PORTAL_VIEW` | ❌ | ✅ | `clientCollaboration` |
| `project.ai_planning` | AI Planning | `AI_PROJECT_PLANNING_VIEW` | ❌ | ✅ | `aiPlanning` |
| `project.recommendations` | Recommendations | `AI_PROJECT_PLANNING_VIEW` | ❌ | ✅ | `aiRecommendations` |
| `project.reports` | Reports | `REPORTING_REPORT_VIEW` | ✅* | ✅ | |
| `project.dashboard` | Dashboard | `REPORTING_DASHBOARD_VIEW` | ✅* | ✅ | `reporting` |
| `project.directory` | Project directory entry | `WORKSPACE_MEMBER_VIEW` *(interim)* | ✅ | ✅ | |
| `project.directory.members` | Project members | same / project-member API when exists | ✅ | ✅ | |

\*Member reporting: baseline must grant **`DASHBOARD_VIEW` / `REPORT_VIEW`**, not bare `REPORTING_MANAGEMENT.VIEW` if that action is unused by APIs.

### 4.4 Pack `NAV_SETTINGS` (Personal + entry points only)

| Capability key | UI | Authority | Who |
|----------------|----|-----------|-----|
| `settings.personal` | Profile / Preferences / My notifications | always authenticated | all |
| `settings.workspace_entry` | Link → Workspace settings | `WORKSPACE_MANAGE_SETTING` or UPDATE | WO |
| `settings.organization_entry` | Link → Organization settings | `ORGANIZATION_MANAGE` | OO |
| `settings.project_entry` | Link → Project settings (when in project) | `PROJECT_UPDATE` or MANAGE | WO |
| `settings.admin_console` | **Do not put in settings nav** — User menu only | any SYSTEM_* view | PA |

**Explicit removals from settings mode:** People & Access, Project Standards, Costs, Commercial admin, Notification Administration, Security (except personal sessions under account), Organization admin dumps that belong in Admin Console or Org sidebar.

---

## 5. Grant alignment (BE must match matrix)

### 5.1 Member baseline (`EnsureWorkspaceMemberBaselineAccessAction`) — target

Keep / ensure:

| Permission | Actions |
|------------|---------|
| `PRODUCTIVITY_MANAGEMENT` | VIEW, CREATE, MANAGE |
| `WORKSPACE_MANAGEMENT` | VIEW |
| `WORKSPACE_MEMBER_MANAGEMENT` | VIEW |
| `PROJECT_MANAGEMENT` | VIEW |
| `PROJECT_PHASE_MANAGEMENT` | VIEW, UPDATE |
| `PROJECT_WBS_MANAGEMENT` | VIEW, UPDATE |
| `PROJECT_TASK_MANAGEMENT` | VIEW, CREATE, UPDATE |
| `REQUIREMENT_MANAGEMENT` | VIEW |
| `SCOPE_MANAGEMENT` | VIEW |
| `DELIVERABLE_MANAGEMENT` | VIEW *(add if missing)* |
| `DOCUMENT_HUB_MANAGEMENT` | VIEW |
| `COLLABORATION_MANAGEMENT` | VIEW, CREATE |
| `COMMENT_MANAGEMENT` | VIEW, CREATE |
| `RAID_MANAGEMENT` | VIEW |
| `DECISION_MANAGEMENT` | VIEW |
| `REPORTING_MANAGEMENT` | **`DASHBOARD_VIEW`, `REPORT_VIEW`** (replace bare VIEW if unused) |

**Must NOT** be in member baseline: capacity, external party, estimation, finance, quote, profitability, quality/test/defect/release, baseline, change request, AI planning, invite/manage member, project CREATE/ARCHIVE, workspace MANAGE_SETTING.

### 5.2 Workspace owner policy (`IamOwnerPolicyCatalogInitializer`) — bump version

Add full action bundles for (at minimum VIEW+CREATE+UPDATE+APPROVE/MANAGE as catalog defines):

- SCOPE, DELIVERABLE, REQUIREMENT, DOCUMENT_HUB  
- RAID, DECISION, COLLABORATION, COMMENT  
- REPORTING (`DASHBOARD_VIEW`, `REPORT_VIEW`, RUN, EXPORT as applicable)  
- ESTIMATION, PROJECT_FINANCE, QUOTE, PROFITABILITY  
- QUALITY, TEST, DEFECT, RELEASE  
- PROJECT_BASELINE, CHANGE_REQUEST  
- EXTERNAL_PARTY, CLIENT_PORTAL  
- AI_PROJECT_PLANNING  
- CAPACITY_* / PROJECT_ALLOCATION (already partially present — verify)

Bump `WORKSPACE` owner policy `targetVersion` and re-apply on startup (existing owner policy applicator pattern).

### 5.3 Org owner

Org owner policy already has `ORGANIZATION_MANAGE`, `CREATE_WORKSPACE`, TEAM_* — verify org directory APIs use these.

---

## 6. Phases — detailed build + verify

### Phase A0 — Matrix audit doc & gaps list

**Goal:** Every capability key has a confirmed API `require*` call site.

**Work**

- [ ] Walk `AppShell` + `CommonNavigation` + `buildSettingsNavSections` → list tabs  
- [ ] For each tab, find primary list/get controller + `*AuthorizationService.require*`  
- [ ] Fill “audit” notes in §4 where marked *(audit)*  
- [ ] File mismatches (e.g. reporting VIEW vs DASHBOARD_VIEW) as checklist items in A2  

**Verify**

- [ ] Spreadsheet/table complete: key | authority | controller method | HTTP path  
- [ ] No nav key without a backend gate (or explicitly “UI-only / no API yet”)

**Exit:** A0 table merged into this doc (update in place).

---

### Phase A1 — Capabilities pack API

**BE files (suggested)**

```
modules/iam/authorization/.../NavCapabilityPack.java          (enum)
modules/iam/authorization/.../NavCapabilityDefinitions.java   (key → IamPermissionAction)
modules/iam/authorization/.../WorkspaceCapabilitiesQueryService.java
modules/iam/authorization/.../OrganizationCapabilitiesQueryService.java
modules/iam/.../http/controller/CapabilitiesController.java   (or extend existing)
```

**API**

- [ ] Implement 4 pack query params as §3  
- [ ] Response always includes full key set  
- [ ] 401 unauthenticated; 403 if cannot access resource  

**Tests**

- [ ] Unit: mapper maps each key to expected authority  
- [ ] Integration: user with member baseline → expected true/false for `NAV_WORKSPACE` + `NAV_PROJECT`  
- [ ] Integration: workspace owner after policy bump → commercial/quality true  
- [ ] Integration: org non-owner → `NAV_ORG` all false (except if any public)  
- [ ] Integration: org owner → org directory + create_workspace true  

**Verify**

```bash
# as member
curl -s "$API/workspaces/$WS/capabilities?pack=NAV_WORKSPACE" | jq '.capabilities["workspace.capacity"]'
# expect false

# as owner
# expect true
```

**Exit:** Pack endpoints green in CI; OpenAPI documented.

---

### Phase A2 — Baseline + owner policy align

**Work**

- [ ] Update `EnsureWorkspaceMemberBaselineAccessAction` per §5.1  
- [ ] Fix reporting actions (`DASHBOARD_VIEW`, `REPORT_VIEW`)  
- [ ] Add `DELIVERABLE_MANAGEMENT` VIEW if missing  
- [ ] Remove accidental grants that contradict D2  
- [ ] Bump owner policy version + add delivery/commercial/quality packs §5.2  
- [ ] Confirm backfill initializers run on `ApplicationReadyEvent`  

**Verify**

- [ ] Fresh member: pack matches §4.2/§4.3 M column  
- [ ] Existing member after restart backfill: same  
- [ ] Owner: CREATE scope / approve deliverable / view finance APIs return 200 (not 403)  
- [ ] Member: finance/quality list APIs return 403  

**Exit:** A2 verified with two seeded users (member + owner) on same workspace.

---

### Phase A3 — Route-level consistency audit

**Work**

- [ ] For each capability key with ✅ for M or WO, confirm list endpoint uses **same** authority as pack  
- [ ] Fix any list endpoint that is ungated while tab is gated (or vice versa)  

**Verify**

- [ ] Random sample 10 tabs: pack false ⇒ API 403; pack true ⇒ API 200 (with data or empty)  

**Exit:** No known “FE would hide but API open” or “FE show but always 403” for matrix rows.

---

### Phase B1 — FE hide tabs (workspace + common)

**FE files**

```
modules/auth/iam/hooks/useWorkspaceNavCapabilities.ts   (NEW)
modules/auth/iam/lib/nav-capability-keys.ts             (NEW — const keys)
modules/platform/layout/ui/AppShell.tsx
modules/platform/layout/ui/CommonNavigation.tsx
modules/auth/iam/lib/authorization-checks.ts            (optional pack-mirror)
```

**Work**

- [ ] Hook loads `NAV_WORKSPACE` (and org pack if orgId known)  
- [ ] Filter `workspaceSidebarSections` by capabilities  
- [ ] Directory entry only if ≥1 of members/teams/invitations/join true  
- [ ] `canViewDocumentHub` ← `common.document_hub` (remove hardcode `true`)  
- [ ] Projects tab ← `workspace.projects`; Create project ← `workspace.projects.create`  
- [ ] While loading capabilities: show skeleton / previous nav — **do not** flash all tabs then hide  

**Verify (manual)**

| Actor | Expect |
|-------|--------|
| Member | No Capacity, Clients; has Overview, Projects, Directory→Members |
| Owner | Capacity, Clients, full directory tabs |
| Member | Document Hub visible iff DOCUMENT_HUB_VIEW |
| Member | Create project control hidden |

**Exit:** Member screenshot ≠ Owner screenshot for workspace sidebar.

---

### Phase B2 — Organization sidebar section

**Work**

- [ ] Add sidebar section label **`Organization`** (not under Directory)  
- [ ] Items: Org members, Org invitations, Org teams (if cap), gated by `NAV_ORG`  
- [ ] Copy/labels must include “Organization …” to avoid confusion with Workspace directory  
- [ ] Remove Org members/invitations from Personal settings mode (move to this section / org settings)  

**Routes**

- [ ] Prefer `/workspace/{id}/organization/directory?tab=…` **or** keep existing org routes but link only from Organization section  

**Verify**

- [ ] Org owner sees Organization section  
- [ ] Pure ws member does **not** see Organization section  
- [ ] Workspace Directory never lists org invites  

**Exit:** Two distinct sidebar blocks labeled Workspace directory vs Organization.

---

### Phase B3 — Settings IA split

**Work**

- [ ] `buildSettingsNavSections`: **Personal only** (+ optional project personal prefs)  
- [ ] Add entries: “Workspace settings”, “Organization settings” as single links when caps allow  
- [ ] Remove Admin blocks (People & Access, Standards, Costs, NAD, …) from settings mode  
- [ ] Confirm User menu still has **Admin Console** as sole PA entry  

**Verify**

- [ ] Member settings: only personal items  
- [ ] Owner settings: personal + workspace settings link  
- [ ] Org owner: + organization settings link  
- [ ] Platform admin: Admin Console in user menu; settings mode has no IAM Users dump  

**Exit:** Settings mode has ≤1 screen of personal items; no admin IAM list.

---

### Phase B4 — Project nav hide + Project directory

**Work**

- [ ] Hook `useProjectNavCapabilities` → `NAV_PROJECT`  
- [ ] Filter `projectWorkbenchSections`  
- [ ] Re-enable `app/.../projects/[projectId]/members/page.tsx` (remove `notFound`)  
- [ ] Add **Project directory** sidebar item → members (and future access)  
- [ ] UI label: **Project directory** (not “Directory”)  
- [ ] Wire members list API + `WORKSPACE_MEMBER_VIEW` interim (document limitation: all ws members until Phase C)  

**Verify**

| Actor | Expect |
|-------|--------|
| Member | No Commercial, Quality, Baselines, CR, Resources, AI, Client collab |
| Member | Has Overview, Plan (work/wbs/…), Scope, Requirements (FF), RAID, Decisions, Meetings |
| Owner | Commercial + Quality visible (FF where applicable) |
| Both | Project directory → members page loads (not 404) |
| Member deep-link `/projects/{id}/financials` | redirect home (B5) or soft deny — not full workbench chrome with empty 403 toast loop |

**Exit:** Member cannot discover Commercial/Quality via sidebar; project members page works.

---

### Phase B5 — Deep-link guards

**Work**

- [ ] Shared helper `assertCapabilityOrRedirect(key, fallbackHref)` in views or thin layout  
- [ ] Apply to workspace + project pages for gated tabs  
- [ ] Prefer `router.replace(workspace home or project overview)` over sticky forbidden page  

**Verify**

- [ ] Paste URL of denied tab while logged in as member → redirect, no persistent “forbidden” primary UI  
- [ ] Direct API call still 403 (security unchanged)  

**Exit:** Manual deep-link matrix for top 10 denied tabs passes.

---

### Phase C — PROJECT IAM resource

- [x] New `IamResourceType.PROJECT`
- [x] Bootstrap PROJECT resource + owner grant on project create
- [x] Backfill existing projects (`ProjectIamBootstrapBackfillInitializer`)
- [x] Dual-check: PROJECT resource first, then WORKSPACE fallback (`requireProjectOrWorkspaceAccess`)
- [x] NAV_PROJECT evaluates with optional `projectId` (OR of project + workspace gates)
- [x] True per-project member grants / list projects filtered by grant
- [x] Project directory / NAV_PROJECT authorize on PROJECT resource when present (no workspace fallback)

---

## 7. FE implementation notes

### 7.1 Hook shape

```ts
// useWorkspaceNavCapabilities(workspaceId)
{
  loading: boolean
  error: string | null
  caps: Record<NavCapabilityKey, boolean>
  can: (key: NavCapabilityKey) => boolean
  refetch: () => Promise<void>
}
```

### 7.2 Filtering rule

```ts
section.items = section.items.filter((item) => can(item.capabilityKey))
sections = sections.filter((s) => s.items.length > 0)
```

Every sidebar item must declare `capabilityKey` (or derive from href map).

### 7.3 Feature flags

Final visibility = `FEATURES.x && caps[key]`.  
Never show on FEATURES alone for IAM-gated tabs.

### 7.4 Interim without pack

If A1 delayed: generate check-batch from `NavCapabilityDefinitions` mirror on FE (`authorization-checks.ts`). Same keys. Replace with pack GET when ready.

---

## 8. BE implementation notes

### 8.1 Do not duplicate decision logic

```
CapabilitiesQueryService
  → for each key: AuthorizationDecisionService.decide(actor, resource, authority)
  → map to boolean
```

### 8.2 Derived keys

`workspace.directory` / `org.directory` / `project.directory` = OR of children (computed in query service, not stored grants).

### 8.3 Owner policy versioning

Follow existing `IamOwnerPolicyCatalogInitializer` version bump + apply pattern so existing workspaces get new actions without manual SQL.

---

## 9. Verification matrix (acceptance)

Use two users on one org with one workspace containing ≥1 project:

| # | Check | Member | Owner | Org owner |
|---|-------|--------|-------|-----------|
| V1 | Workspace Capacity tab | hidden | visible | visible if also WO |
| V2 | Workspace Clients tab | hidden | visible | … |
| V3 | Projects tab | visible | visible | … |
| V4 | Create project | hidden | visible | … |
| V5 | Document Hub | visible | visible | … |
| V6 | Ws Directory → Teams | hidden | visible | … |
| V7 | Organization sidebar | hidden | hidden* | visible |
| V8 | Project Commercial | hidden | visible | … |
| V9 | Project Quality | hidden | visible | … |
| V10 | Project Scope | visible | visible | … |
| V11 | Project directory/members | page works | page works | … |
| V12 | Settings = personal only | pass | pass | pass |
| V13 | Admin pages only via Admin Console | n/a | n/a | PA only |
| V14 | Deep-link financials as member | redirect | 200 | … |
| V15 | Pack API matches UI | spot-check 10 keys | spot-check | NAV_ORG |

\*Workspace owner who is not org owner should **not** see Organization section.

---

## 10. File checklist (quick index)

### BE

- [ ] `NavCapabilityPack` + definitions  
- [ ] Capabilities controllers + query services + tests  
- [ ] `EnsureWorkspaceMemberBaselineAccessAction`  
- [ ] `IamOwnerPolicyCatalogInitializer` (version bump)  
- [ ] Backfill listeners  
- [ ] Optional: fix list-endpoint `require*` mismatches from A3  

### FE

- [ ] `nav-capability-keys.ts` + hooks  
- [ ] `AppShell.tsx` / `CommonNavigation.tsx` filter  
- [ ] Organization sidebar section  
- [ ] `buildSettingsNavSections.ts` personal-only  
- [ ] Project directory + re-enable members page  
- [ ] Create project / Document Hub gates  
- [ ] Deep-link guards  
- [ ] Remove org admin items from settings  

---

## 11. Order of execution

```text
A0 audit → A1 pack API + tests → A2 grants → A3 API consistency
    → B1 FE hide ws/common → B2 Org sidebar → B3 Settings split
    → B4 Project hide + project directory → B5 deep-links
    → C (later) PROJECT resource
```

Do **not** ship B1 without at least A1 interim (check-batch mirror) or A1 pack — otherwise FE has nothing truthful to hide on.

---

## 12. Open audit items (resolve in A0; then delete this section)

| Item | Question | Owner |
|------|----------|-------|
| Activity tab authority | Exact `require*` today? | BE |
| Forms / Support | Real permission or workspace VIEW only? | BE |
| Timeline / Schedule | WBS vs PHASE vs TASK view? | BE |
| Governance tab | Which authority? | BE |
| Project members API | Exists or only workspace members list? | BE+FE |
| Notifications common | Always on vs productivity VIEW? | Product |

---

## Changelog

| Date | Note |
|------|------|
| 2026-07-28 | Initial locked spec from product decisions (hide tabs, org sidebar, project directory, settings split, pack+batch) |
| 2026-07-28 | **Implemented A1–A2 + B1–B4 (partial B5):** pack API, baseline/owner sync, FE hide tabs, Org sidebar, settings personal-only, project members page re-enabled |
| 2026-07-28 | **B5 deep-link guard:** `resolveNavCapabilityForPath` + `useNavCapabilityDeepLinkGuard` in AppShell — denied URLs soft-redirect to projects / project overview |
