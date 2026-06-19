> **Out of date (2026):** This document references code removed during Safe Dead Code Cleanup (orphan hooks/services/components). See `CLAUDE.md` for current architecture.

# 🚀 Quick Reference Card - AI + Traceability Implementation

**Status:** ✅ **100% COMPLETE**  
**Ready for:** Manual Testing & Integration

---

## 📁 New Files Created (23 files total)

### Types (3)

```
types/
├── api-enums.ts         [UPDATED] - 15+ new enums
├── ai.ts                [NEW] 365 lines - All AI types
└── traceability.ts      [NEW] 244 lines - All Traceability types
```

### Services (3)

```
services/
├── ai.service.ts             [NEW] 179 lines - 10 AI functions
├── admin-ai.service.ts       [NEW] 68 lines - 5 admin functions
└── traceability.service.ts   [NEW] 306 lines - 17 trace functions
```

### Components (2)

```
components/shared/
├── ImproveAnswerModal.tsx       [NEW] 274 lines
└── ClarityAssessmentModal.tsx   [NEW] 203 lines
```

### Admin AI Pages (5)

```
app/admin/ai/
├── page.tsx                              [NEW] 227 lines - List configs
├── runs/page.tsx                         [NEW] 268 lines - Audit log
├── configs/[purpose]/edit/page.tsx       [NEW] 238 lines - Edit config
├── configs/[purpose]/test/page.tsx       [NEW] 252 lines - Test run
└── runs/[runId]/page.tsx                 [NEW] 239 lines - Run detail
```

### AI Features (1 new)

```
app/org/[orgId]/projects/[projectId]/
└── ai/questions/page.tsx                 [NEW] 180 lines - Generate questions
```

### Traceability Pages (5)

```
app/org/[orgId]/
├── landscape/page.tsx                    [NEW] 285 lines - Org nodes tree
├── actors/page.tsx                       [NEW] 257 lines - Actors CRUD
└── projects/[projectId]/
    ├── scope/page.tsx                    [NEW] 220 lines - Project scope
    ├── requirements/page.tsx             [NEW] 238 lines - Requirements tree
    └── trace/page.tsx                    [NEW] 289 lines - Trace view
```

---

## 🎯 Routes to Test

### Admin Routes (Admin only)

```
/admin/ai                                  List AI configs
/admin/ai/runs                             Audit logs
/admin/ai/configs/improve_answer/edit      Edit config
/admin/ai/configs/improve_answer/test      Test run
/admin/ai/runs/[runId]                     Run detail
```

### AI Features (Editor/Owner)

```
/org/[orgId]/projects/[projectId]/ai/questions     Generate questions
/org/[orgId]/projects/[projectId]/impact           Impact analysis ✅ existing
/org/[orgId]/projects/[projectId]/sessions/[sessionId]
    → "AI Improve" button (each question)
    → "Assess Clarity" button
    → "Readiness Summary" tab
```

### Traceability (Per permissions)

```
/org/[orgId]/landscape                     Org nodes (owner CRUD)
/org/[orgId]/actors                        Org actors (owner CRUD)
/org/[orgId]/projects/[projectId]/scope    Project scope (editor)
/org/[orgId]/projects/[projectId]/requirements  Requirements (editor)
/org/[orgId]/projects/[projectId]/trace    Trace view (viewer can see)
```

---

## 🧪 Quick Test Flow

### 1️⃣ Admin AI (5 min)

```bash
# As admin user
1. Go to /admin/ai
2. Click "Edit" on any config
3. Change model → Save
4. Click "Test Run" → Enter JSON → Run
5. Go to /admin/ai/runs → View any run detail
```

### 2️⃣ Generate Questions (10 min)

```bash
# As project editor
1. Go to /org/[orgId]/projects/[projectId]/ai/questions
2. Select engine: "Agent Builder v2"
3. Select base session (one with answers)
4. Add instruction (optional)
5. Click "Generate Questions"
6. Select some questions, edit if needed
7. Click "Add X Questions"
8. Verify questions appear in project
```

### 3️⃣ Improve Answer (5 min)

```bash
# In session detail page
1. Find answered question
2. Click "AI Improve" button
3. Add optional instruction
4. Click "Generate AI Suggestion"
5. Edit final value if needed
6. Click "Accept & Apply"
7. Verify answer updated
```

### 4️⃣ Traceability Full Flow (15 min)

```bash
# As org owner
1. /org/[orgId]/landscape
   → Create System "SYS-001"
   → Create Subsystem "SUB-001" under it
   → Create Module "MOD-001" under subsystem

2. /org/[orgId]/actors
   → Create Actor "USR-001" kind=persona

3. /org/[orgId]/projects/[projectId]/scope
   → Select modules, set roles
   → Save

4. /org/[orgId]/projects/[projectId]/requirements
   → Create BO "BO-001"
   → Add BR "BR-001" under BO
   → Add FR "FR-001" under BR

5. /org/[orgId]/projects/[projectId]/trace
   → Create trace link: FR-001 → MOD-001 (implements)
   → View full trace matrix
```

---

## 🛡️ Permission Quick Check

| Role        | Admin AI | AI Features                    | Landscape/Actors | Scope/Requirements        | Trace View        |
| ----------- | -------- | ------------------------------ | ---------------- | ------------------------- | ----------------- |
| **Admin**   | ✅ Full  | ✅ Yes                         | ✅ Yes           | ✅ Yes                    | ✅ Yes            |
| **Owner**   | ❌ No    | ✅ Yes                         | ✅ Full CRUD     | ✅ Full CRUD              | ✅ Full CRUD      |
| **Member**  | ❌ No    | ✅ Yes                         | ❌ Read only     | ✅ Edit if project editor | ✅ Edit if editor |
| **Partner** | ❌ No    | ❌ No                          | ❌ Read only     | ❌ Read only              | ❌ Read only      |
| **Viewer**  | ❌ No    | ❌ No (except clarity summary) | ❌ Read only     | ❌ Read only              | ✅ Read only      |

---

## 🔥 Error Codes Reference

### AI Errors (409/502)

| Code                      | Status | Message             | Fix                       |
| ------------------------- | ------ | ------------------- | ------------------------- |
| `AI_FEATURE_DISABLED`     | 409    | Feature tắt         | Admin enable trong config |
| `AI_WORKFLOW_ID_REQUIRED` | 409    | Missing workflow_id | Admin set trong config    |
| `AI_BATCH_EXPIRED`        | 409    | Batch hết hạn       | Regenerate batch mới      |
| `AI_PROVIDER_ERROR`       | 502    | OpenAI error        | Check BE logs, API key    |
| `AI_OUTPUT_NOT_JSON`      | 502    | Invalid output      | Retry hoặc check workflow |

### Traceability Errors (409)

| Code                   | Message              | Fix                            |
| ---------------------- | -------------------- | ------------------------------ |
| `NODE_CODE_EXISTS`     | Mã node trùng        | Use different code             |
| `NODE_HAS_CHILDREN`    | Node có children     | Archive children first         |
| `NODE_IN_USE`          | Node đang dùng       | Remove from scope/requirements |
| `ACTOR_KEY_EXISTS`     | Mã actor trùng       | Use different key              |
| `REQ_CODE_EXISTS`      | Mã requirement trùng | Use different code             |
| `TRACE_LINK_EXISTS`    | Link trùng           | Existing link already created  |
| `SCOPE_NODE_WRONG_ORG` | Node wrong org       | Reload page                    |

---

## 💡 Common Workflows

### Workflow 1: AI-Assisted Question Creation

```
1. Create project from template
2. Create session, answer some questions
3. Go to Project > AI > Generate Questions
4. Select session as baseline
5. Generate → Review → Commit
6. New questions appear in project
7. Answer new questions in session
```

### Workflow 2: Improve All Answers

```
1. Open session with answers
2. For each question:
   a. Click "AI Improve"
   b. Review suggestion
   c. Accept or edit
3. Assess clarity for key questions
4. View Readiness Summary tab
5. Fix any blockers highlighted
```

### Workflow 3: Complete Traceability

```
1. Admin: Setup org landscape (systems, subsystems, modules)
2. Admin: Create org actors (personas, systems, teams)
3. PM: Define project scope (select modules, set roles)
4. PM: Create requirements hierarchy (BO → BR → FR, NFR)
5. PM: Map actors & modules to requirements
6. PM: Create trace links (requirements → modules)
7. Team: View trace matrix for full visibility
```

---

## 📊 API Endpoints Summary

### AI Features (10 endpoints)

```
POST   /orgs/:orgId/projects/:projectId/sessions/:sessionId/ai/improve
POST   /orgs/:orgId/projects/:projectId/sessions/:sessionId/ai/improve/commit
POST   /orgs/:orgId/projects/:projectId/ai/questions/generate
POST   /orgs/:orgId/projects/:projectId/ai/questions/commit
POST   /orgs/:orgId/projects/:projectId/sessions/:sessionId/ai/clarity/assess-one
GET    /orgs/:orgId/projects/:projectId/sessions/:sessionId/ai/clarity/summary
POST   /orgs/:orgId/projects/:projectId/ai/intakes/upload-url
POST   /orgs/:orgId/projects/:projectId/ai/intakes
POST   /orgs/:orgId/projects/:projectId/ai/impact-analysis
POST   /orgs/:orgId/projects/:projectId/ai/impact-analysis/commit
```

### Admin AI (5 endpoints)

```
GET    /admin/ai/configs
PATCH  /admin/ai/configs/:purpose
POST   /admin/ai/configs/:purpose/test-run
GET    /admin/ai/runs
GET    /admin/ai/runs/:runId
```

### Traceability (17 endpoints)

```
# Org Nodes
GET    /orgs/:orgId/nodes
POST   /orgs/:orgId/nodes
PATCH  /orgs/:orgId/nodes/:nodeId
DELETE /orgs/:orgId/nodes/:nodeId
GET    /orgs/:orgId/node-links
POST   /orgs/:orgId/node-links
PATCH  /orgs/:orgId/node-links/:linkId
DELETE /orgs/:orgId/node-links/:linkId

# Project Scope
GET    /orgs/:orgId/projects/:projectId/scope
PUT    /orgs/:orgId/projects/:projectId/scope

# Org Actors
GET    /orgs/:orgId/actors
POST   /orgs/:orgId/actors
PATCH  /orgs/:orgId/actors/:actorId

# Requirements
GET    /orgs/:orgId/projects/:projectId/requirements
POST   /orgs/:orgId/projects/:projectId/requirements
PATCH  /orgs/:orgId/projects/:projectId/requirements/:requirementId

# Trace
GET    /orgs/:orgId/projects/:projectId/trace
GET    /orgs/:orgId/projects/:projectId/trace-links
POST   /orgs/:orgId/projects/:projectId/trace-links
PATCH  /orgs/:orgId/projects/:projectId/trace-links/:linkId
DELETE /orgs/:orgId/projects/:projectId/trace-links/:linkId
```

---

## 🎨 Component Usage Examples

### Import Pattern

```typescript
import { Button } from '@/components/atoms/Button/Button'
import { Typography } from '@/components/atoms/Typography/Typography'
import { Badge } from '@/components/atoms/Badge/Badge'
import { Modal } from '@/components/molecules/Modal/Modal'
import * as aiService from '@/services/ai.service'
import { getProblemToastMessage, isConflictCode } from '@/lib/errorHandling'
```

### Service Call Pattern

```typescript
try {
  const result = await aiService.improveAnswer(orgId, projectId, sessionId, payload)
  toast.success('Success!')
  handleRefresh()
} catch (err) {
  if (isConflictCode(err, 'AI_BATCH_EXPIRED')) {
    toast.error('Batch expired. Regenerate.')
  } else {
    const message = getProblemToastMessage(err)
    const requestId = getProblemRequestId(err)
    toast.error(message, {
      description: requestId ? `Request ID: ${requestId}` : undefined,
    })
  }
}
```

---

## ⚡ Commands

```bash
# Start dev server
npm run dev

# Run tests (if any added)
npm test

# Build for production
npm run build

# Lint
npm run lint

# Format code
npm run format
```

---

## 📞 Troubleshooting

### Page không load (blank/error)

1. Check console errors
2. Verify route params (orgId, projectId, sessionId)
3. Check auth context (useAuth, useOrg)
4. Verify API URL trong .env

### API calls fail

1. Check Network tab trong DevTools
2. Verify Authorization header có access_token
3. Check response body (Problem Details)
4. Note down request_id

### Permission errors (403)

1. Check profile.role (admin/user)
2. Check org role (owner/member/partner)
3. Check project role (editor/viewer)
4. Check profile.status (active/suspended)

### AI errors (502)

1. Check BE logs cho error_detail
2. Verify OPENAI_API_KEY configured trên BE
3. Check workflow_id valid (nếu dùng workflow_api)
4. Check agent_entry valid (nếu dùng agents_sdk)

---

## ✅ Ready Checklist

- ✅ All files created (23 files)
- ✅ All types defined
- ✅ All services implemented
- ✅ All pages created
- ✅ Error handling complete
- ✅ Permission gating ready
- ✅ Documentation complete

### TODO (Post-Implementation)

- [ ] Add routes to navigation/sidebar
- [ ] Manual testing (8-10h)
- [ ] Bug fixes from testing (4-6h)
- [ ] Optional: Add React Query for caching
- [ ] Optional: Add breadcrumbs
- [ ] Optional: Add loading skeletons

---

## 🎊 You're Done!

**All code implemented. Chỉ cần:**

1. Test manually theo checklist trong `docs/DELIVERABLES.md`
2. Fix bugs nếu có
3. Add navigation links
4. Deploy! 🚀

**For detailed guides:**

- Implementation status: `docs/IMPLEMENTATION_COMPLETE.md`
- Code patterns: `docs/IMPLEMENTATION_GUIDE.md`
- Testing checklist: `docs/DELIVERABLES.md`
