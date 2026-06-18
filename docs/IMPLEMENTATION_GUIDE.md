# Implementation Guide for Remaining Features

Hướng dẫn chi tiết để implement các trang còn lại theo đúng pattern đã có.

---

## 🎯 General Pattern

### Page Structure Template

```typescript
'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Typography } from '@/components/atoms/Typography/Typography'
import { Button } from '@/components/atoms/Button/Button'
import * as service from '@/services/xxx.service'
import { getProblemToastMessage, getProblemRequestId } from '@/lib/errorHandling'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'

export default function MyPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [data, setData] = useState<MyType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const response = await service.getData(params.orgId as string)
      setData(response.items)
    } catch (err) {
      const message = getProblemToastMessage(err)
      const requestId = getProblemRequestId(err)
      toast.error(message, {
        description: requestId ? `Request ID: ${requestId}` : undefined,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (id: string) => {
    try {
      await service.doAction(id)
      toast.success('Action completed')
      loadData() // Refresh
    } catch (err) {
      const message = getProblemToastMessage(err)
      toast.error(message)
    }
  }

  // Permission guard (if needed)
  if (profile && profile.status === 'suspended') {
    return (
      <div className="container mx-auto p-8">
        <Typography variant="lg" className="text-error-600">
          Your account is suspended. Please contact support.
        </Typography>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <Typography variant="base" className="text-neutral-500">
          Loading...
        </Typography>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <Typography variant="2xl" className="mb-6 font-semibold">
        My Page Title
      </Typography>
      
      {/* Content */}
      {data.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
          <Typography variant="base" className="text-neutral-600">
            No data found
          </Typography>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <Typography variant="base">{item.name}</Typography>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 🔧 Quick Implementation Guides

### 1. Generate Questions Page

**Path:** `app/org/[orgId]/projects/[projectId]/ai/questions/page.tsx`

**Key Points:**
- Form with: `engine` select, `base_session_id` (required for v2), `instruction`, `max_items`
- Call `generateQuestions()` → display proposals with temp_id
- Checkboxes to select accepted questions
- Inline edit: section, prompt, required, tags
- Commit button → `commitGeneratedQuestions()`

**Error Handling:**
```typescript
// 422: base_session_id missing for v2
if (isProblem(err) && err.status === 422) {
  const fieldErrors = getFieldErrors(err)
  if (fieldErrors.base_session_id) {
    toast.error('Base session is required for v2 engine')
  }
}

// 409: AI_WORKFLOW_ID_REQUIRED
if (isConflictCode(err, 'AI_WORKFLOW_ID_REQUIRED')) {
  toast.error('Server chưa cấu hình workflow v2. Liên hệ admin.')
}

// 409: AI_BATCH_EXPIRED
if (isConflictCode(err, 'AI_BATCH_EXPIRED')) {
  toast.error('Batch đã hết hạn. Gọi lại Generate để lấy batch mới.')
  // Clear proposals, allow user to generate again
}
```

**State Management:**
```typescript
const [proposals, setProposals] = useState<QGenQuestionProposal[]>([])
const [batchToken, setBatchToken] = useState<string | null>(null)
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
const [edits, setEdits] = useState<Map<string, Partial<QGenQuestionProposal>>>(new Map())
```

---

### 2. Impact Analysis Page

**Path:** `app/org/[orgId]/projects/[projectId]/ai/impact/page.tsx`

**Steps:**

**Step 1: Intake**
```typescript
// Option 1: Paste text
const [rawText, setRawText] = useState('')
const handlePasteText = async () => {
  const intake = await createIntake(orgId, projectId, { raw_text: rawText })
  setIntakeId(intake.id)
  setStep(2)
}

// Option 2: Upload file
const handleUploadFile = async (file: File) => {
  // Get signed URL
  const { upload_url, file_id } = await getIntakeUploadUrl(orgId, projectId, {
    file_name: file.name,
    mime_type: file.type,
  })
  
  // PUT file to upload_url (plain fetch, not apiFetch)
  await fetch(upload_url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  
  // Create intake with file_id
  const intake = await createIntake(orgId, projectId, { file_id })
  setIntakeId(intake.id)
  setStep(2)
}
```

**Step 2: Select Baseline**
```typescript
const [baseSessionId, setBaseSessionId] = useState<string | null>(null)
// Show dropdown of sessions, user selects one
```

**Step 3: Run Analysis**
```typescript
const handleRunAnalysis = async () => {
  const response = await runImpactAnalysis(orgId, projectId, {
    base: { session_id: baseSessionId },
    intake: { intake_id: intakeId },
  })
  setProposals(response.proposals)
  setBatchToken(response.batch_token)
  setNoteSummary(response.note_summary)
}
```

**Step 4: Review & Commit**
```typescript
// Each proposal: question_id, proposed_value, reason, reference_from_note
// User can accept/reject + edit final_value if accept

const [decisions, setDecisions] = useState<Map<string, 'accept' | 'reject'>>(new Map())
const [finalValues, setFinalValues] = useState<Map<string, unknown>>(new Map())

const handleCommit = async () => {
  const decisionsArray = Array.from(decisions.entries()).map(([qid, action]) => ({
    question_id: qid,
    action,
    final_value: action === 'accept' ? finalValues.get(qid) : undefined,
  }))

  await commitImpactAnalysis(orgId, projectId, {
    batch_token: batchToken,
    base: { session_id: baseSessionId },
    intake_id: intakeId,
    decisions: decisionsArray,
  })

  toast.success('Impact analysis committed')
  router.push(`/org/${orgId}/projects/${projectId}/sessions/${baseSessionId}`)
}
```

---

### 3. Edit AI Config Page

**Path:** `app/admin/ai/configs/[purpose]/edit/page.tsx`

**Form Fields:**
- `enabled`: checkbox
- `primary_engine`: select (legacy_chat, workflow_api, agents_sdk)
- `fallback_engine`: select (same + None option)
- `workflow_id`: text input (required if primary_engine = workflow_api)
- `agent_entry`: text input (required if primary_engine = agents_sdk)
  - Valid values: `qgen_v2`, `improve_answer`, `clarity_assess_one`, `impact_analysis`
- `model`: text input (optional)
- `temperature`: number input (optional)
- `max_output_tokens`: number input (optional)
- `timeout_ms`: number input (optional)
- `notes`: textarea (optional)

**Validation:**
```typescript
const validate = () => {
  const errors: string[] = []
  
  if (formData.primary_engine === 'workflow_api' && !formData.workflow_id) {
    errors.push('Workflow ID is required when using Workflow API engine')
  }
  
  if (formData.primary_engine === 'agents_sdk' && !formData.agent_entry) {
    errors.push('Agent Entry is required when using Agents SDK engine')
  }
  
  if (formData.agent_entry && 
      !['qgen_v2', 'improve_answer', 'clarity_assess_one', 'impact_analysis'].includes(formData.agent_entry)) {
    errors.push('Invalid agent entry. Must be one of: qgen_v2, improve_answer, clarity_assess_one, impact_analysis')
  }
  
  return errors
}
```

**Save:**
```typescript
const handleSave = async () => {
  const errors = validate()
  if (errors.length > 0) {
    toast.error(errors.join(', '))
    return
  }

  try {
    await updateAiConfig(params.purpose as AiPurpose, formData)
    toast.success('Config updated successfully')
    router.push('/admin/ai')
  } catch (err) {
    // Handle 422 validation from BE
    const message = getProblemToastMessage(err)
    toast.error(message)
  }
}
```

---

### 4. Org Landscape Page

**Path:** `app/org/[orgId]/landscape/page.tsx`

**UI Options:**

**Option A: Tree/List View (Simpler)**
```typescript
// Hierarchical list of nodes
// - System 1
//   - Subsystem 1.1
//     - Module 1.1.1
//     - Module 1.1.2
//   - Subsystem 1.2
// - System 2

const [nodes, setNodes] = useState<OrgNode[]>([])
const [links, setLinks] = useState<NodeLink[]>([])

// Build tree structure
const buildTree = (nodes: OrgNode[]) => {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const roots: OrgNode[] = []
  const children = new Map<string, OrgNode[]>()

  nodes.forEach(node => {
    if (!node.parent_id) {
      roots.push(node)
    } else {
      if (!children.has(node.parent_id)) {
        children.set(node.parent_id, [])
      }
      children.get(node.parent_id)!.push(node)
    }
  })

  return { roots, children }
}
```

**Option B: Visual Graph (Advanced, use @xyflow/react)**
```typescript
import { ReactFlow, Node, Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Convert OrgNode[] to ReactFlow nodes
const flowNodes: Node[] = nodes.map(node => ({
  id: node.id,
  type: 'default',
  data: { label: node.name, code: node.code },
  position: { x: node.position_x || 0, y: node.position_y || 0 },
}))

// Convert NodeLink[] to ReactFlow edges
const flowEdges: Edge[] = links.map((link, idx) => ({
  id: `${link.from_node_id}-${link.to_node_id}-${idx}`,
  source: link.from_node_id,
  target: link.to_node_id,
  label: link.link_type,
}))

// On drag end, update positions
const handleNodeDragStop = async (event: any, node: Node) => {
  // Batch update positions (optional Phase 2.1)
  await updateNodesPositions(orgId, {
    positions: [{ node_id: node.id, position_x: node.position.x, position_y: node.position.y }]
  })
}
```

**CRUD:**
```typescript
// Create node
const handleCreateNode = async (data: OrgNodeCreateRequest) => {
  try {
    await createOrgNode(orgId, data)
    toast.success('Node created')
    loadNodes()
  } catch (err) {
    if (isConflictCode(err, 'NODE_CODE_EXISTS')) {
      toast.error('Mã node đã tồn tại trong org.')
    } else {
      toast.error(getProblemToastMessage(err))
    }
  }
}

// Delete node
const handleDeleteNode = async (nodeId: string) => {
  try {
    await deleteOrgNode(orgId, nodeId)
    toast.success('Node archived')
    loadNodes()
  } catch (err) {
    if (isConflictCode(err, 'NODE_HAS_CHILDREN')) {
      toast.error('Node còn module con, hãy archive con trước.')
    } else if (isConflictCode(err, 'NODE_IN_USE')) {
      toast.error('Node đang được dùng trong Project Scope hoặc Requirement mapping.')
    } else {
      toast.error(getProblemToastMessage(err))
    }
  }
}
```

---

### 5. Requirements Page

**Path:** `app/org/[orgId]/projects/[projectId]/requirements/page.tsx`

**Layout:**
```
+-- Business Objectives (BO)
    +-- Business Requirements (BR)
        +-- Functional Requirements (FR)
    +-- Non-Functional Requirements (NFR) (can link to BO or BR)
```

**Tree Structure:**
```typescript
const buildRequirementTree = (requirements: Requirement[]) => {
  const reqMap = new Map(requirements.map(r => [r.id, r]))
  const rootBOs = requirements.filter(r => r.req_type === 'BO' && !r.parent_id)
  
  const getChildren = (parentId: string): Requirement[] => {
    return requirements.filter(r => r.parent_id === parentId)
  }

  return { rootBOs, getChildren }
}
```

**Create Requirement:**
```typescript
// Validation: hierarchy rules
const canCreateUnder = (parentType: RequirementType | null, childType: RequirementType): boolean => {
  if (!parentType) return childType === 'BO' // Root must be BO
  if (parentType === 'BO' && (childType === 'BR' || childType === 'NFR')) return true
  if (parentType === 'BR' && (childType === 'FR' || childType === 'NFR')) return true
  return false
}

const handleCreate = async (data: RequirementCreateRequest) => {
  try {
    await createRequirement(orgId, projectId, data)
    toast.success('Requirement created')
    loadRequirements()
  } catch (err) {
    if (isConflictCode(err, 'REQ_CODE_EXISTS')) {
      toast.error('Mã requirement đã tồn tại trong project.')
    } else if (err.status === 422) {
      // Hierarchy validation error
      toast.error(getProblemToastMessage(err))
    } else {
      toast.error(getProblemToastMessage(err))
    }
  }
}
```

**Map Actors & Modules:**
```typescript
// For each requirement, show:
// - Actors: multi-select from org actors
// - Modules: multi-select from org nodes

const handleSaveActors = async (requirementId: string, actorIds: string[]) => {
  await replaceRequirementActors(orgId, projectId, requirementId, { actor_ids: actorIds })
  toast.success('Actors updated')
}

const handleSaveModules = async (requirementId: string, nodeIds: string[]) => {
  await replaceRequirementModules(orgId, projectId, requirementId, { org_node_ids: nodeIds })
  toast.success('Modules updated')
}
```

---

## 🛡️ Permission Checks

### Org Role Check
```typescript
import { useOrg } from '@/contexts/OrgContext'

const { currentOrg, myRole } = useOrg()

// owner only
if (myRole !== 'owner') {
  return <div>You don't have permission</div>
}

// member or owner (partner can't mutate)
if (myRole === 'partner') {
  // Hide create/edit buttons
}
```

### Project Role Check
```typescript
// Get project from API, includes my_role
const [project, setProject] = useState<ProjectDetail | null>(null)

if (project?.my_role === 'viewer') {
  // Hide edit buttons, only show read-only view
}
```

### Profile Status Check
```typescript
import { useAuth } from '@/contexts/AuthContext'

const { profile } = useAuth()

if (profile?.status === 'suspended') {
  return (
    <div className="container mx-auto p-8">
      <div className="rounded-lg border border-error-200 bg-error-50 p-6">
        <Typography variant="lg" className="font-semibold text-error-900">
          Account Suspended
        </Typography>
        <Typography variant="base" className="mt-2 text-error-700">
          Your account is suspended. All mutations are disabled. Please contact support.
        </Typography>
      </div>
    </div>
  )
}
```

---

## 🎨 UI Components Available

### Atoms (from design system)
- `Button` - variants: primary, secondary, outline, ghost, link; sizes: sm, base, lg
- `Typography` - variants: xs, sm, base, lg, xl, 2xl
- `Badge` - variants: success, warning, error, info, neutral; sizes: sm, base, lg
- `Input` - text input
- `Textarea` - multiline input
- `Select` - dropdown
- `Checkbox` - checkbox
- `Radio` - radio button
- `Switch` - toggle switch

### Molecules
- `Modal` - dialog modal
- `TodoList` - todo list (if needed)
- `EventCard`, `NotificationCard`, etc.

### Usage
```typescript
import { Button } from '@/components/atoms/Button/Button'
import { Typography } from '@/components/atoms/Typography/Typography'
import { Badge } from '@/components/atoms/Badge/Badge'
import { Modal } from '@/components/molecules/Modal/Modal'

<Button variant="primary" size="base" onClick={handleClick}>
  Click Me
</Button>

<Badge variant="success" size="sm">Active</Badge>

<Modal open={isOpen} onClose={handleClose} title="My Modal">
  <p>Content here</p>
</Modal>
```

---

## 🔥 Pro Tips

1. **Always use services, never direct fetch in components**
   ```typescript
   // ❌ Bad
   const res = await fetch(`${API_URL}/orgs/${orgId}`)
   
   // ✅ Good
   import * as orgService from '@/services/org.service'
   const org = await orgService.getOrg(orgId)
   ```

2. **Handle errors properly with Problem Details**
   ```typescript
   try {
     await service.action()
   } catch (err) {
     const message = getProblemToastMessage(err)
     const requestId = getProblemRequestId(err)
     toast.error(message, {
       description: requestId ? `Request ID: ${requestId}` : undefined,
     })
   }
   ```

3. **Branch on error code for specific cases**
   ```typescript
   import { isConflictCode } from '@/lib/errorHandling'
   
   if (isConflictCode(err, 'ALREADY_SUBMITTED')) {
     toast.error('Session already submitted.')
     return
   }
   ```

4. **Use loading states everywhere**
   ```typescript
   const [isLoading, setIsLoading] = useState(false)
   const [isSaving, setIsSaving] = useState(false)
   
   <Button onClick={handleSave} isLoading={isSaving}>
     Save
   </Button>
   ```

5. **Empty states are important**
   ```typescript
   {items.length === 0 && (
     <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
       <Typography variant="base" className="text-neutral-600">
         No items found
       </Typography>
     </div>
   )}
   ```

6. **Refresh data after mutations**
   ```typescript
   const handleCreate = async () => {
     await service.create(data)
     toast.success('Created')
     loadData() // Refresh list
   }
   ```

---

## 📚 Reference Examples

- **API Client Pattern:** `lib/apiClient.ts`
- **Service Pattern:** `services/ai.service.ts`, `services/traceability.service.ts`
- **Page Pattern:** `app/admin/ai/page.tsx`, `app/admin/ai/runs/page.tsx`
- **Modal Pattern:** `components/shared/ImproveAnswerModal.tsx`
- **Error Handling:** `lib/errorHandling.ts`
- **Types:** `types/ai.ts`, `types/traceability.ts`
