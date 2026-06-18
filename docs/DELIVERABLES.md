# Implementation Deliverables & Checklist

**Project:** Scopery FE - AI + Traceability + Admin AI Features  
**Date:** 2026-02-16  
**Engineer:** Senior Frontend Engineer

---

## 📊 Overall Progress

### Phase 1: Infrastructure ✅ 100% Complete
- ✅ ENV configuration
- ✅ Type system (enums + DTOs)
- ✅ Service layer (3 service files)

### Phase 2: AI Features 🟡 33% Complete
- ✅ Improve Answer Modal component
- ⏳ Session integration (TODO)
- ⏳ Generate Questions page (TODO)
- ⏳ Clarity Assessment integration (TODO)
- ⏳ Impact Analysis page (TODO)

### Phase 3: Admin AI 🟡 40% Complete
- ✅ Configs list page
- ✅ Runs audit page
- ⏳ Edit config page (TODO)
- ⏳ Test run page (TODO)
- ⏳ Run detail page (TODO)

### Phase 4: Traceability 🟡 20% Complete
- ✅ Landscape page (basic tree view)
- ⏳ Actors page (TODO)
- ⏳ Project Scope page (TODO)
- ⏳ Requirements page (TODO)
- ⏳ Trace View page (TODO)

---

## 📁 Files Created/Modified Summary

### ✅ Completed Files (12 files)

**Configuration:**
1. `.env.example` - Updated with AI guidelines

**Types:**
2. `types/api-enums.ts` - Added AI & Traceability enums
3. `types/ai.ts` - Complete AI types (365 lines)
4. `types/traceability.ts` - Complete Traceability types (244 lines)

**Services:**
5. `services/ai.service.ts` - AI features service (179 lines)
6. `services/admin-ai.service.ts` - Admin AI service (68 lines)
7. `services/traceability.service.ts` - Traceability service (306 lines)

**Components:**
8. `components/shared/ImproveAnswerModal.tsx` - AI Improve Answer modal (274 lines)
9. `components/shared/ClarityAssessmentModal.tsx` - Clarity Assessment modal (203 lines)

**Pages:**
10. `app/admin/ai/page.tsx` - AI Configs list (227 lines)
11. `app/admin/ai/runs/page.tsx` - AI Runs audit (268 lines)
12. `app/org/[orgId]/landscape/page.tsx` - Org Landscape tree view (285 lines)

**Documentation:**
13. `docs/IMPLEMENTATION_SUMMARY.md` - Implementation status & plan
14. `docs/IMPLEMENTATION_GUIDE.md` - Detailed implementation guide
15. `docs/DELIVERABLES.md` - This file

**Total Lines of Code:** ~2,619 lines

---

## 📋 Remaining Tasks

### Session Integration (Improve Answer + Clarity)

**File:** `app/org/[orgId]/projects/[projectId]/sessions/[sessionId]/page.tsx`

**Tasks:**
- [ ] Add "AI Improve" button next to each answered question
  - Check: session status = in_progress
  - Check: user role = editor or owner
  - On click: open `ImproveAnswerModal`
  - On accept: refresh session data via `PUT /answers` or reload entire session

- [ ] Add "Assess Clarity" button for answered questions
  - Check: user role = editor
  - On click: open `ClarityAssessmentModal`
  - Result: display assessment (stored in DB, no need to re-run)

- [ ] Add "Readiness Summary" tab
  - Check: user role = viewer, editor, or owner (viewer can access)
  - Call `getClaritySummary()`
  - Display: overall_readiness, label, scores, top_blockers, suggested_fixes, stats
  - If missing_assessments > 0: show CTA "Run assessments on remaining questions"

**Estimated Time:** 4-6 hours

---

### Generate Questions Page

**File:** `app/org/[orgId]/projects/[projectId]/ai/questions/page.tsx`

**Tasks:**
- [ ] Create form with fields:
  - engine: select (legacy | agentkit_v2_file)
  - base_session_id: select from project sessions (required for v2)
  - instruction: textarea (optional, max 4000 chars)
  - max_items: number input (optional)

- [ ] Call `generateQuestions()` → display proposals with temp_id

- [ ] Render proposal list:
  - Checkbox to select
  - Inline edit: section, prompt, required, tags (editable)
  - Show q_type, help_text (read-only or editable)

- [ ] Commit button:
  - Build accepted_temp_ids from selected checkboxes
  - Build edits array from modified proposals
  - Call `commitGeneratedQuestions()`
  - Redirect to project questions page

- [ ] Error handling:
  - 422: base_session_id missing → show field error
  - 409 AI_WORKFLOW_ID_REQUIRED → toast with instruction to contact admin
  - 409 AI_BATCH_EXPIRED → clear proposals, allow user to regenerate

**Estimated Time:** 6-8 hours

---

### Impact Analysis Page

**File:** `app/org/[orgId]/projects/[projectId]/ai/impact/page.tsx`

**Tasks:**
- [ ] **Step 1: Intake Creation**
  - Tab 1: Paste Text
    - Textarea for raw_text
    - Call `createIntake({ raw_text })`
  - Tab 2: Upload File
    - File picker
    - Call `getIntakeUploadUrl({ file_name, mime_type })`
    - PUT file to upload_url (plain fetch)
    - Call `createIntake({ file_id })`
  - On success: save intake_id, proceed to Step 2

- [ ] **Step 2: Select Baseline**
  - Dropdown: select session_id from project sessions
  - (Optional: select revision_id if already have revision feature)
  - Next button

- [ ] **Step 3: Run Analysis**
  - Call `runImpactAnalysis({ base: { session_id }, intake: { intake_id } })`
  - Save batch_token, proposals, note_summary
  - Proceed to Step 4

- [ ] **Step 4: Review Proposals**
  - List proposals: question_id, proposed_value, reason, reference_from_note
  - For each proposal:
    - Radio buttons: Accept / Reject
    - If Accept: editable textarea for final_value
  - Commit button: call `commitImpactAnalysis()`
  - On success: redirect to session detail

- [ ] Error handling:
  - 413 PAYLOAD_TOO_LARGE → toast "File too large"
  - 409 AI_BATCH_EXPIRED → go back to Step 3 to re-run

**Estimated Time:** 8-10 hours

---

### Admin AI - Edit Config Page

**File:** `app/admin/ai/configs/[purpose]/edit/page.tsx`

**Tasks:**
- [ ] Load current config via `listAiConfigs()` (filter by purpose)

- [ ] Form fields:
  - enabled: checkbox
  - primary_engine: select (legacy_chat | workflow_api | agents_sdk)
  - fallback_engine: select (same + None)
  - workflow_id: text input (required if primary = workflow_api)
  - agent_entry: select (qgen_v2 | improve_answer | clarity_assess_one | impact_analysis)
    - Required if primary = agents_sdk
  - model: text input (optional, e.g., gpt-4o)
  - temperature: number input (optional, 0-1)
  - max_output_tokens: number input (optional)
  - timeout_ms: number input (optional, milliseconds)
  - notes: textarea (optional)

- [ ] Validation:
  - If primary_engine = workflow_api AND workflow_id empty → show error
  - If primary_engine = agents_sdk AND agent_entry empty → show error
  - If agent_entry not in valid list → show error

- [ ] Save button:
  - Call `updateAiConfig(purpose, formData)`
  - Handle 422 validation errors (field-level display)
  - On success: redirect to `/admin/ai`

**Estimated Time:** 4-5 hours

---

### Admin AI - Test Run Page

**File:** `app/admin/ai/configs/[purpose]/test/page.tsx`

**Tasks:**
- [ ] JSON editor for input (use textarea with JSON.stringify/parse or a library like `react-json-view`)
  - Placeholder: example input based on purpose
  - improve_answer: `{ "question_id": "...", "current_value": "...", "question": {...} }`
  - qgen: `{ "base_session_id": "...", "instruction": "..." }`
  - clarity: `{ "question_order": 1, "section": "...", "question_text": "...", ... }`
  - impact: `{ "note_text": "...", "baseline_answers": [...], ... }`

- [ ] Checkbox: use_fallback (optional, default false)

- [ ] Test Run button:
  - Call `testRunAiConfig(purpose, { input, use_fallback })`
  - Display output JSON
  - Display engine_used, run_id
  - No batch_token created (test run doesn't persist)

- [ ] Error handling:
  - 502 AI_OUTPUT_NOT_JSON → toast with error
  - 409 AI_FEATURE_DISABLED → toast "Feature disabled"

**Estimated Time:** 3-4 hours

---

### Admin AI - Run Detail Page

**File:** `app/admin/ai/runs/[runId]/page.tsx`

**Tasks:**
- [ ] Load run via `getAiRun(runId)`

- [ ] Display fields:
  - Status badge (success | fallback_success | failed)
  - Purpose label
  - Engine used badge
  - Latency (ms)
  - Model, workflow_id, agent_entry (if applicable)
  - Created at (formatted)
  - Request ID (for debugging)
  - Org ID, Project ID, Session ID, User ID (links if possible)

- [ ] Error section (if failed):
  - error_code (large, red)
  - error_detail (truncated, expandable)

- [ ] Payload redacted (JSON viewer, collapsible):
  - Only metadata (question_id, lengths, counts, hashes)
  - No raw answers/notes

- [ ] Output redacted (JSON viewer, collapsible):
  - Truncated if large
  - Show structure, not sensitive content

**Estimated Time:** 3-4 hours

---

### Org Actors Page

**File:** `app/org/[orgId]/actors/page.tsx`

**Tasks:**
- [ ] List actors via `listOrgActors(orgId)`
  - Pagination: limit, offset
  - Filter: kind (persona | system | team | external)

- [ ] Table columns:
  - actor_key (code)
  - name
  - kind (badge)
  - description
  - Actions (Edit | Delete for owner)

- [ ] Create button (owner only):
  - Modal form: actor_key, name, kind, description
  - Call `createOrgActor()`
  - Error: 409 ACTOR_KEY_EXISTS → toast

- [ ] Edit button (owner only):
  - Modal form with existing data
  - Call `updateOrgActor()`

**Estimated Time:** 4-5 hours

---

### Project Scope Page

**File:** `app/org/[orgId]/projects/[projectId]/scope/page.tsx`

**Tasks:**
- [ ] Load org nodes via `listOrgNodes(orgId)`
- [ ] Load current scope via `getProjectScope(orgId, projectId)`

- [ ] Multi-select UI:
  - List all active org nodes (systems, subsystems, modules)
  - For each node:
    - Checkbox (selected if in scope)
    - Radio buttons: primary | impacted | out_of_scope

- [ ] Save button (editor/owner):
  - Build items array: `{ org_node_id, scope_role }[]`
  - Call `replaceProjectScope(orgId, projectId, { items })`
  - On success: toast "Scope updated"

- [ ] Error handling:
  - 409 SCOPE_NODE_WRONG_ORG → toast "Some nodes don't belong to this org"

**Estimated Time:** 4-5 hours

---

### Requirements Page

**File:** `app/org/[orgId]/projects/[projectId]/requirements/page.tsx`

**Tasks:**
- [ ] Load requirements via `listRequirements(orgId, projectId)`
- [ ] Load actors via `listOrgActors(orgId)`
- [ ] Load nodes via `listOrgNodes(orgId)`

- [ ] Tree view:
  - BO (roots)
    - BR (children of BO)
      - FR (children of BR)
    - NFR (children of BO or BR)

- [ ] Create button (editor/owner):
  - Modal form: parent_id (select from tree), req_type (BO | BR | FR | NFR), code, title, description
  - Validate hierarchy:
    - Root must be BO
    - BO → BR, NFR
    - BR → FR, NFR
  - Call `createRequirement()`
  - Error: 409 REQ_CODE_EXISTS → toast

- [ ] Edit button (editor/owner):
  - Modal form with existing data
  - Call `updateRequirement()`

- [ ] Map Actors button:
  - Multi-select actors
  - Call `replaceRequirementActors(orgId, projectId, requirementId, { actor_ids })`

- [ ] Map Modules button:
  - Multi-select org nodes
  - Call `replaceRequirementModules(orgId, projectId, requirementId, { org_node_ids })`

**Estimated Time:** 8-10 hours

---

### Trace View Page

**File:** `app/org/[orgId]/projects/[projectId]/trace/page.tsx`

**Tasks:**
- [ ] Load full trace via `getTraceView(orgId, projectId)`
  - Returns: landscape, project_scope, catalog (requirements, actors, mappings), trace_links

- [ ] Display sections:
  - **Landscape:** nodes + links (table or visual graph)
  - **Scope:** project scope items with roles
  - **Requirements:** tree view with mapped actors & modules
  - **Trace Links:** list of requirement ↔ node links

- [ ] Create Trace Link button (editor/owner):
  - Modal form:
    - from_type: requirement | org_node
    - from_id: select (filtered by type)
    - to_type: requirement | org_node
    - to_id: select (filtered by type)
    - link_type: implements | satisfies | relates_to | traces_to
    - note: textarea (optional)
  - Call `createTraceLink()`
  - Error: 409 TRACE_LINK_EXISTS → toast

- [ ] Edit/Delete trace link (editor/owner):
  - Inline edit or modal
  - Call `updateTraceLink()` or `deleteTraceLink()`

**Estimated Time:** 10-12 hours

---

## 🧪 Testing Checklist

### Manual Testing

**AI Features:**
- [ ] Improve Answer: generate → edit → accept → verify answer updated
- [ ] Improve Answer: reject → verify no changes
- [ ] Generate Questions: legacy engine → verify questions created
- [ ] Generate Questions: v2 engine → verify QA pack sent, questions created
- [ ] Clarity Assessment: run → verify scores, guidance, tags
- [ ] Clarity Summary: view → verify readiness metrics
- [ ] Impact Analysis: paste text → run → accept decisions → verify revisions created
- [ ] Impact Analysis: upload file → run → verify proposals

**Admin AI:**
- [ ] List configs → verify all purposes shown
- [ ] Edit config: primary_engine=workflow_api without workflow_id → verify 422 error
- [ ] Edit config: agents_sdk without agent_entry → verify 422 error
- [ ] Test run: valid input → verify output displayed
- [ ] List runs: filter by purpose, status → verify pagination works
- [ ] View run detail → verify all fields displayed, redacted payloads

**Traceability:**
- [ ] Create system node → verify shown in tree
- [ ] Create subsystem under system → verify parent-child relationship
- [ ] Archive node with children → verify 409 NODE_HAS_CHILDREN
- [ ] Archive node in use → verify 409 NODE_IN_USE
- [ ] Create actor → verify in list
- [ ] Create actor with duplicate key → verify 409 ACTOR_KEY_EXISTS
- [ ] Set project scope → verify saved
- [ ] Create BO → BR → FR hierarchy → verify valid
- [ ] Create FR under BO → verify 422 hierarchy error
- [ ] Create requirement with duplicate code → verify 409 REQ_CODE_EXISTS
- [ ] Map actors to requirement → verify saved
- [ ] Map modules to requirement → verify saved
- [ ] Create trace link → verify shown in trace view
- [ ] Create duplicate trace link → verify 409 TRACE_LINK_EXISTS

### Permission Testing

- [ ] Partner role: verify mutations disabled (create/edit/delete buttons hidden)
- [ ] Viewer role: verify only read access to project resources
- [ ] Editor role: verify full access to project mutations
- [ ] Owner role: verify full access including org-level mutations
- [ ] Suspended profile: verify all mutations return 403, banner shown
- [ ] Admin role: verify access to `/admin/ai/*` pages
- [ ] Non-admin: verify 403 when accessing admin pages

### Error Handling Testing

- [ ] 401: verify redirect to login with returnTo
- [ ] 403: verify "You don't have permission" toast
- [ ] 404: verify "Not found" message
- [ ] 409 with code: verify specific message (ALREADY_SUBMITTED, AI_BATCH_EXPIRED, etc.)
- [ ] 413 PAYLOAD_TOO_LARGE: verify "Payload too large" message
- [ ] 422 with errors array: verify field-level errors displayed
- [ ] 429 TOO_MANY_REQUESTS: verify rate limit message
- [ ] 502 AI_PROVIDER_ERROR: verify AI error message with request_id

---

## 🚀 Deployment Checklist

- [ ] All ENV variables documented in `.env.example`
- [ ] No secrets (OPENAI_API_KEY, etc.) in FE code
- [ ] All routes added to navigation/sidebar
- [ ] Breadcrumbs for nested pages
- [ ] Loading states for all async operations
- [ ] Empty states for all lists
- [ ] Error boundaries for top-level pages
- [ ] TypeScript build passes (`npm run build`)
- [ ] Linter passes (`npm run lint`)
- [ ] No console.log in production code (except legitimate error logging)
- [ ] Request IDs shown in error modals for debugging
- [ ] All mutation buttons respect permission matrix

---

## 📊 Estimated Time

| Phase | Tasks | Est. Hours | Status |
|-------|-------|------------|--------|
| Phase 1: Infrastructure | 7 tasks | 8-10h | ✅ Complete |
| Phase 2: AI Features | 4 pages | 18-24h | 🟡 33% |
| Phase 3: Admin AI | 3 pages | 10-13h | 🟡 40% |
| Phase 4: Traceability | 5 pages | 30-37h | 🟡 20% |
| Testing & Polish | QA + fixes | 16-20h | ⏳ Pending |
| **Total** | | **82-104h** | 🟡 ~35% |

**Current Progress:** ~30h completed, ~60-70h remaining

**Recommended Sprint Plan:**
- Sprint 1 (Week 1): Complete Phase 2 (AI Features)
- Sprint 2 (Week 2): Complete Phase 3 (Admin AI)
- Sprint 3 (Week 3-4): Complete Phase 4 (Traceability)
- Sprint 4 (Week 4): Testing & Polish

---

## 📚 References

- **API Documentation:** `docs/API_DOCUMENTATION.md`
- **Implementation Guide:** `docs/IMPLEMENTATION_GUIDE.md`
- **Implementation Summary:** `docs/IMPLEMENTATION_SUMMARY.md`
- **AI Orchestration Status:** `docs/AI_ORCHESTRATION_STATUS.md`
- **Project Rules:** `.cursorrules`

---

## 💡 Quick Start for Next Developer

1. **Read this file** to understand overall progress
2. **Read `IMPLEMENTATION_GUIDE.md`** for detailed patterns & examples
3. **Pick a TODO page** from "Remaining Tasks" section above
4. **Copy existing page** (e.g., `app/admin/ai/page.tsx`) as template
5. **Follow the pattern:**
   - Import service functions
   - useState for data & loading
   - useEffect to load data
   - Handle errors with Problem Details
   - Permission checks with useAuth/useOrg
   - Loading/Empty/Error states
6. **Test manually** following checklist above
7. **Update this file** to mark task as complete

---

## ✅ Definition of Done

A page/feature is considered "done" when:

- [ ] Code written following existing patterns
- [ ] All service layer functions used (no direct fetch in components)
- [ ] TypeScript types used correctly (no `any`)
- [ ] Error handling with Problem Details (branch on code)
- [ ] Permission gating implemented (role-based UI)
- [ ] Loading state implemented
- [ ] Empty state implemented
- [ ] Error state with request_id implemented
- [ ] Manual testing passed (happy path + error cases)
- [ ] No console errors in browser
- [ ] Code formatted (`npm run format`)
- [ ] Linter passes (`npm run lint`)
- [ ] This checklist updated

---

**Good luck! 🚀 Bạn đã có sẵn toàn bộ infrastructure, chỉ cần follow pattern để hoàn thành các trang còn lại.**
