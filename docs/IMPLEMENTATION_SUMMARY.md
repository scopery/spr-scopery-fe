> **Out of date (2026):** This document references code removed during Safe Dead Code Cleanup (orphan hooks/services/components). See `CLAUDE.md` for current architecture.

# AI + Traceability + Admin AI Implementation Summary

**Date:** 2026-02-16  
**Status:** Phase 1 Complete (Infrastructure), Phase 2-4 In Progress

---

## ✅ Completed - Phase 1: Infrastructure

### 1. Environment Configuration

- ✅ Updated `.env.example` with AI guidelines (secrets are BE-only)

### 2. Type System

- ✅ **`types/api-enums.ts`** - Added all missing enums:
  - AI: `AiQuestionsGenerateEngine`, `AiEngineType`, `AiPurpose`, `AiRunStatus`
  - Traceability: `OrgNodeType`, `OrgNodeStatus`, `NodeLinkType`, `ScopeRole`, `ActorKind`, `RequirementType`, `TraceLinkType`, `TraceEntityType`

- ✅ **`types/ai.ts`** - Complete AI type definitions (365 lines):
  - Improve Answer types
  - QGen (Generate Questions) types
  - Clarity Assessment types
  - Impact Analysis types
  - Admin AI types (Config, Runs, Test Run)

- ✅ **`types/traceability.ts`** - Complete Traceability types (244 lines):
  - Org Nodes & Node Links
  - Project Scope
  - Org Actors
  - Requirements & Requirement mappings
  - Trace Links
  - Trace View (full context)

### 3. Service Layer (API Abstraction)

- ✅ **`services/ai.service.ts`** - AI Features Service (179 lines):
  - `improveAnswer()` - Generate AI suggestion for answer improvement
  - `commitImproveAnswer()` - Accept/reject AI suggestion
  - `generateQuestions()` - Generate clarifying questions via AI
  - `commitGeneratedQuestions()` - Commit selected questions
  - `assessClarityOne()` - Assess single answer clarity
  - `getClaritySummary()` - Get session readiness summary
  - `getIntakeUploadUrl()` - Get signed URL for note upload
  - `createIntake()` - Create intake from text or file
  - `runImpactAnalysis()` - Analyze impact of notes on baseline
  - `commitImpactAnalysis()` - Commit impact decisions

- ✅ **`services/admin-ai.service.ts`** - Admin AI Service (68 lines):
  - `listAiConfigs()` - List all AI configs
  - `updateAiConfig()` - Update config for a purpose
  - `testRunAiConfig()` - Test run without side effects
  - `listAiRuns()` - List runs with filters & pagination
  - `getAiRun()` - Get single run details

- ✅ **`services/traceability.service.ts`** - Traceability Service (306 lines):
  - **Org Nodes:** CRUD operations for landscape nodes
  - **Node Links:** CRUD operations for relationships between nodes
  - **Positions:** Batch update node positions (Phase 2.1 optional)
  - **Project Scope:** Get/replace scope mappings
  - **Org Actors:** List/create/update actors
  - **Requirements:** CRUD operations for requirements catalog
  - **Requirement Mappings:** Replace actors & modules for requirements
  - **Trace Links:** CRUD operations for traceability links
  - **Trace View:** Get full trace context (landscape + scope + catalog + links)

---

## ✅ Completed - Phase 2: UI Components

### AI Components

- ✅ **`components/shared/ImproveAnswerModal.tsx`** (274 lines):
  - Full modal UI for AI Improve Answer workflow
  - User instruction input (optional)
  - AI proposal display with confidence, rationale, diff summary
  - Editable final value before accepting
  - Accept/Reject actions
  - Error handling with Problem Details
  - Loading states

### Admin AI Pages

- ✅ **`app/admin/ai/page.tsx`** (227 lines):
  - List all AI configs with status badges
  - Display: purpose, engines, model, workflow_id, agent_entry, timeout
  - Edit/Test Run buttons for each config
  - Link to Audit Logs page
  - Empty state

- ✅ **`app/admin/ai/runs/page.tsx`** (268 lines):
  - Audit log table with all AI orchestrator runs
  - Filters: purpose, status
  - Pagination (50 per page)
  - Columns: time, purpose, engine, status, latency, error
  - View button → detailed run page
  - Status badges (success/fallback_success/failed)

---

## 📋 TODO - Phase 2: Remaining AI Pages

### AI Session Features (Session Screen)

- [ ] **Integrate ImproveAnswerModal into Session Detail Page**
  - Add "AI Improve" button next to each question (editor only, session in_progress)
  - On accept, refresh session answers
  - Handle SESSION_LOCKED (409) → show "Session locked/submitted"

- [ ] **Clarity Assessment UI (Session Screen)**
  - "Assess clarity" button for answered questions (editor only)
  - Modal/drawer to display assessment: clarity_score, label, tags, guidance
  - Handle AI_FEATURE_DISABLED (409)

- [ ] **Clarity Summary Tab (Session Screen)**
  - New tab "Readiness Summary" (viewer can access)
  - Display: overall_readiness, label, scores, top_blockers, suggested_fixes
  - Stats: total questions, required answered, missing assessments
  - Recommended next action

### Project AI Pages

- [ ] **`app/org/[orgId]/projects/[projectId]/ai/questions/page.tsx`**
  - Form: engine select, base_session_id, instruction, max_items
  - Call `generateQuestions()`
  - Render proposals with checkboxes + inline edit
  - Commit accepted questions
  - Handle AI_BATCH_EXPIRED, AI_WORKFLOW_ID_REQUIRED

- [ ] **`app/org/[orgId]/projects/[projectId]/ai/impact/page.tsx`**
  - Step 1: Intake creation (paste text or upload file)
  - Step 2: Select baseline (session_id or revision_id)
  - Step 3: Run impact analysis
  - Step 4: Display proposals (proposed_value, reason, reference_from_note)
  - Step 5: Accept/reject decisions + edit final_value
  - Commit decisions

---

## 📋 TODO - Phase 3: Admin AI Detail Pages

- [ ] **`app/admin/ai/configs/[purpose]/edit/page.tsx`**
  - Form to update config: enabled, engines, workflow_id, agent_entry, model, temperature, timeout, notes
  - Validation: workflow_api requires workflow_id, agents_sdk requires agent_entry
  - Save → PATCH `/admin/ai/configs/:purpose`

- [ ] **`app/admin/ai/configs/[purpose]/test/page.tsx`**
  - JSON editor for test input
  - Call `testRunAiConfig()` → display output + engine_used + run_id
  - No side effects (doesn't create batch_token or write to domain tables)

- [ ] **`app/admin/ai/runs/[runId]/page.tsx`**
  - Full run details: status, engine_used, latency_ms, error_code, error_detail
  - Payload redacted, output redacted (JSON viewers)
  - Metadata: purpose, org_id, project_id, session_id, user_id
  - Created at, request_id

---

## 📋 TODO - Phase 4: Traceability Pages

### Org Landscape

- [ ] **`app/org/[orgId]/landscape/page.tsx`**
  - Visual graph/tree view of org nodes (systems, subsystems, modules)
  - Node types: system, subsystem, module
  - Node links with link_type (integrates_with, shares_data_with, depends_on, relates_to)
  - CRUD: create/edit/archive nodes (owner only)
  - CRUD: create/edit/delete links (owner only)
  - Optional: drag & drop positions (Phase 2.1) with batch PUT `/nodes/positions`
  - Fallback: auto-layout if positions endpoint not available

### Project Scope

- [ ] **`app/org/[orgId]/projects/[projectId]/scope/page.tsx`**
  - Select nodes from org landscape
  - Set scope_role: primary, impacted, out_of_scope
  - PUT replace-all scope mapping
  - Permission: editor/owner

### Org Actors

- [ ] **`app/org/[orgId]/actors/page.tsx`**
  - List actors: actor_key, name, kind (persona/system/team/external)
  - CRUD: create/edit actors (owner only)
  - Filter by kind

### Requirements & Trace

- [ ] **`app/org/[orgId]/projects/[projectId]/requirements/page.tsx`**
  - List requirements by type: BO, BR, FR, NFR
  - Hierarchy: BO → BR → FR; NFR → BO/BR
  - CRUD: create/edit requirements (editor/owner)
  - PUT actors & modules mapping for each requirement
  - Validation: hierarchy rules, code uniqueness

- [ ] **`app/org/[orgId]/projects/[projectId]/trace/page.tsx`**
  - Full trace view (GET `/trace`)
  - Display: landscape, scope, requirements catalog, trace_links
  - CRUD trace_links: from (requirement/node) → to (requirement/node)
  - link_type: implements, satisfies, relates_to, traces_to
  - Visual graph or table view

---

## 🔧 Additional Tasks

### Permission Gating (All Pages)

- [ ] Check `profile.role` for admin pages (403 if not admin)
- [ ] Check `profile.status` for mutations (403 if suspended, show banner)
- [ ] Check org role (owner/member/partner) for org-level mutations
- [ ] Check project role (editor/viewer) for project-level mutations
- [ ] Hide mutation buttons for partner/viewer

### Error Handling

- [ ] All pages handle Problem Details errors properly
- [ ] Show `request_id` in error toasts/modals for debugging
- [ ] Branch on `code` for specific conflicts (AI_BATCH_EXPIRED, AI_FEATURE_DISABLED, etc.)
- [ ] Display field-level errors for 422 validation

### State Management

- [ ] All pages have loading, empty, error states
- [ ] Refresh data after mutations
- [ ] Optimistic updates where appropriate

### Routing & Navigation

- [ ] Add routes to sidebar/navigation
- [ ] Breadcrumbs for nested pages
- [ ] Back buttons where needed

---

## 📦 Deliverables Checklist

### Code Files Changed/Created

**Types (3 files):**

- ✅ `types/api-enums.ts` - Updated with AI & Traceability enums
- ✅ `types/ai.ts` - NEW: 365 lines
- ✅ `types/traceability.ts` - NEW: 244 lines

**Services (3 files):**

- ✅ `services/ai.service.ts` - NEW: 179 lines
- ✅ `services/admin-ai.service.ts` - NEW: 68 lines
- ✅ `services/traceability.service.ts` - NEW: 306 lines

**Components (1 file):**

- ✅ `components/shared/ImproveAnswerModal.tsx` - NEW: 274 lines

**Admin Pages (2 files):**

- ✅ `app/admin/ai/page.tsx` - NEW: 227 lines (AI Configs list)
- ✅ `app/admin/ai/runs/page.tsx` - NEW: 268 lines (AI Runs audit)

**TODO Pages (14 files):**

- [ ] `app/org/[orgId]/projects/[projectId]/sessions/[sessionId]/page.tsx` - Integrate ImproveAnswerModal
- [ ] `app/org/[orgId]/projects/[projectId]/ai/questions/page.tsx` - Generate Questions
- [ ] `app/org/[orgId]/projects/[projectId]/ai/impact/page.tsx` - Impact Analysis
- [ ] `app/admin/ai/configs/[purpose]/edit/page.tsx` - Edit Config
- [ ] `app/admin/ai/configs/[purpose]/test/page.tsx` - Test Run
- [ ] `app/admin/ai/runs/[runId]/page.tsx` - Run Details
- [ ] `app/org/[orgId]/landscape/page.tsx` - Org Landscape
- [ ] `app/org/[orgId]/actors/page.tsx` - Org Actors
- [ ] `app/org/[orgId]/projects/[projectId]/scope/page.tsx` - Project Scope
- [ ] `app/org/[orgId]/projects/[projectId]/requirements/page.tsx` - Requirements
- [ ] `app/org/[orgId]/projects/[projectId]/trace/page.tsx` - Trace View

**Config (1 file):**

- ✅ `.env.example` - Updated

---

## 🧪 Manual Testing Checklist (After Full Implementation)

### AI Features

- [ ] **Improve Answer**
  - [ ] Generate suggestion with/without user instruction
  - [ ] Accept suggestion → answer updated in session
  - [ ] Reject suggestion → no changes
  - [ ] SESSION_LOCKED (409) when session submitted
  - [ ] AI_BATCH_EXPIRED (409) when batch expires

- [ ] **Generate Questions**
  - [ ] engine=legacy → uses legacy_chat
  - [ ] engine=agentkit_v2_file → uses primary from config
  - [ ] base_session_id required for v2
  - [ ] Accept questions → added to project_questions
  - [ ] Edit question fields before commit
  - [ ] AI_WORKFLOW_ID_REQUIRED (409) if missing

- [ ] **Clarity Assessment**
  - [ ] Assess-one → display clarity_score, label, guidance
  - [ ] Summary → display readiness metrics, top_blockers, stats
  - [ ] AI_FEATURE_DISABLED (409) if feature off

- [ ] **Impact Analysis**
  - [ ] Create intake from text
  - [ ] Upload file → signed URL → create intake
  - [ ] Run analysis → display proposals with reasons
  - [ ] Accept/reject decisions → creates answer_revisions

### Admin AI

- [ ] **Configs**
  - [ ] List all configs with correct engines, models
  - [ ] Edit config → update works, validation enforced
  - [ ] Test run → output displayed, no side effects

- [ ] **Runs Audit**
  - [ ] List runs with pagination
  - [ ] Filter by purpose, status
  - [ ] View run details → full payload/output redacted

### Traceability

- [ ] **Org Landscape**
  - [ ] Create nodes (system/subsystem/module)
  - [ ] Create links (integrates_with, etc.)
  - [ ] Archive node → 409 if has children or in use
  - [ ] NODE_CODE_EXISTS (409) on duplicate

- [ ] **Project Scope**
  - [ ] Select nodes, set scope_role
  - [ ] Save → replaced all
  - [ ] SCOPE_NODE_WRONG_ORG (409) if node not in org

- [ ] **Actors**
  - [ ] Create actors (persona/system/team/external)
  - [ ] ACTOR_KEY_EXISTS (409) on duplicate

- [ ] **Requirements**
  - [ ] Create BO/BR/FR/NFR with correct hierarchy
  - [ ] Map actors & modules
  - [ ] REQ_CODE_EXISTS (409) on duplicate

- [ ] **Trace View**
  - [ ] Display full context: landscape, scope, catalog, links
  - [ ] Create trace link (requirement → node)
  - [ ] TRACE_LINK_EXISTS (409) on duplicate

---

## 🚀 Next Steps

1. **Continue Phase 2**: Create remaining AI pages (Questions, Impact, Clarity tabs)
2. **Complete Phase 3**: Admin AI detail pages (Edit Config, Test Run, Run Detail)
3. **Implement Phase 4**: All Traceability pages with visual components
4. **Testing**: Manual testing following checklist above
5. **Integration**: Add navigation links, permission guards, breadcrumbs
6. **Polish**: Loading skeletons, empty states, error boundaries

---

## 📚 References

- **Backend API Documentation:** `docs/API_DOCUMENTATION.md`
- **AI Orchestration Status:** `docs/AI_ORCHESTRATION_STATUS.md`
- **AI Orchestration Verification:** `docs/AI_ORCHESTRATION_VERIFICATION.md`
- **Cursor Rules:** `.cursorrules`

---

## Notes

- **Clean Architecture:** All API calls go through service layer, never direct fetch in components
- **Error Handling:** Always parse Problem Details, branch on `code`, show `request_id`
- **Type Safety:** All endpoints have proper TypeScript types, no `any` allowed
- **Permission Matrix:** FE disables UI, BE enforces permissions (403 if violated)
- **No Hardcoded URLs:** Always use `NEXT_PUBLIC_API_URL` from ENV
- **No AI Secrets in FE:** All OpenAI keys, workflow IDs are BE-only configuration
