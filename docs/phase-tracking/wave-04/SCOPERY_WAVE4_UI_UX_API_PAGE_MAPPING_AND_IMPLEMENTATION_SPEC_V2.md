# SCOPERY WAVE 4 — UI/UX API PAGE MAPPING & IMPLEMENTATION SPEC

> **Wave:** Document Hub · Knowledge · Event Registry · Governance · Quality · Reporting · AI Assistant · AI Planning · AI Recommendation · Client Portal · Project Notification · Productivity · Integration Hub · Traceability · Trust & Compliance · Service Support  
> **Nguồn contract:** `WAVE4_API_CONTRACT.md`  
> **Quy mô:** khoảng 559 REST endpoints, 152 controllers.
>
> **Mục tiêu:** Chuyển toàn bộ API Wave 4 thành kiến trúc giao diện có thể triển khai; không biến mỗi controller thành một mục sidebar hoặc một trang CRUD độc lập.
>
> **App Shell nội bộ:**
>
> ```text
> Logo Icon + Workspace/Project Switcher + Collapse
> Common Navigation
> Workspace hoặc Project Navigation
> Avatar + Organization Menu
> ```
>
> **Settings:** mở từ Avatar Menu và thay phần navigation giữa sidebar bằng Settings Navigation.  
> **Client Portal:** là một application shell riêng dành cho người dùng bên ngoài; không tái sử dụng nguyên sidebar nội bộ.

---

# 0. Executive Summary

## 0.1 Wave 4 bổ sung những năng lực nào?

```text
CONTENT & KNOWLEDGE
├── Document Hub
├── Document versioning
├── Folders and sharing
├── Document templates
├── Generated documents
├── Knowledge indexing
├── Semantic retrieval
└── Knowledge graph

PROJECT GOVERNANCE
├── Ownership
├── Locks and finalization
├── Object access grants
├── Version snapshots
├── Restore
├── Baseline guard
└── Governance reports

QUALITY & DELIVERY
├── Quality plans
├── Test plans and suites
├── Test cases and steps
├── Test execution
├── Defects
├── Release packages
├── Deployment
└── Rollback

REPORTING & PRODUCTIVITY
├── Project dashboard
├── Report catalog and runs
├── Export jobs
├── Activity feed
├── Global search
├── Saved searches/views
├── Favorites and pins
├── Recent items
├── Work inbox
└── Command palette

AI
├── Context-aware assistant
├── SSE streaming
├── Page and field guides
├── AI planning runs
├── Planning suggestions
├── AI recommendations
└── Next best actions

CLIENT COLLABORATION
├── Portal authentication
├── Portal accounts and invitations
├── Access grants and policies
├── Client reviews
├── UAT assignments
├── Comments and feedback
├── Portal forms
└── Client support cases

ENTERPRISE ADMINISTRATION
├── Event registry
├── Integration Hub
├── Requirements and traceability
├── Application registry
├── Trust and compliance
├── Privacy/GDPR
├── Retention and legal hold
├── Access reviews
└── Service Support
```

## 0.2 Kiến trúc UI được chọn

```text
COMMON MODULES
├── Global Search / Command Palette
├── Document Hub
├── AI Assistant
├── Notifications
└── Work Inbox

WORKSPACE
├── Application Registry
├── Support Center
└── Integration health shortcut nếu có quyền

PROJECT
├── Quality
├── Releases & Deployment
├── Requirements
├── Traceability
├── Governance
├── Reports
├── AI Planning
├── AI Recommendations
└── Client Collaboration

SETTINGS
├── Knowledge & Documents
├── Event Registry
├── Governance Policies
├── Portal Administration
├── Project Notifications
├── Integrations
├── Trust & Compliance
├── Support Configuration
└── Navigation Preferences

SEPARATE CLIENT PORTAL
├── Projects
├── Reviews
├── Meetings
├── Forms
├── Comments & Feedback
└── Support
```

## 0.3 Nguyên tắc bắt buộc

1. Document Hub chỉ xuất hiện một lần trong Common Navigation.
2. Organization, Workspace, Project và Personal là scope bên trong Document Hub, không phải bốn menu riêng.
3. AI Assistant phải dùng current context và không được vượt ACL.
4. Nội dung AI phải phân biệt `suggested`, `accepted`, `applied`.
5. Không apply AI suggestion trực tiếp nếu project đã baselined mà policy yêu cầu Change Request.
6. Client Portal phải tách session, permission, cache và giao diện khỏi app nội bộ.
7. Portal không được nhận dữ liệu nội bộ chỉ vì frontend ẩn field.
8. Governance lock/finalization phải hiển thị ngay trên object được govern.
9. Quality phải nối được Requirement → Test Case → Result → Defect → Release.
10. Integration import/sync phải có validate, dry-run, execute và row-level result.
11. Trust operations phải có dry-run/readiness trước execute khi có rủi ro.
12. Report, indexing, generation, AI, import/export và sync dùng long-running job pattern.
13. `Map<String,Object>` và raw JSON không được dùng làm primary UX.
14. Action nguy hiểm phải có permission, confirmation, idempotency và audit context.
15. Không để hơn một app sidebar cố định cùng lúc.

---

# 0A. MANDATORY 100% API COVERAGE GATE

## 0A.1 Quy tắc hoàn thành bắt buộc

Wave 4 áp dụng quy tắc:

> **Không được đánh dấu `DONE`, `COMPLETE`, `IMPLEMENTED` hoặc đóng phase/module/page khi chưa kiểm soát đủ 100% endpoint trong API Contract.**

Một endpoint chỉ được xem là đã được xử lý khi thuộc đúng một trong các trạng thái:

```text
UI_IMPLEMENTED
UI_TESTED
SERVICE_ORCHESTRATED
PUBLIC_EXTERNAL
LEGACY_COMPATIBILITY
CONTRACT_BLOCKED
APPROVED_NON_UI_EXCEPTION
```

Trong đó:

### `UI_IMPLEMENTED`

Endpoint user-facing đã được nối vào:

- Route hoặc page/workbench.
- Component.
- Query/mutation.
- Loading/error/forbidden state.
- Cache/invalidation.
- Permission.
- Lifecycle.
- Trace ID.

### `UI_TESTED`

Ngoài `UI_IMPLEMENTED`, endpoint đã có bằng chứng test:

- Happy path.
- Validation.
- Permission denied.
- Error/business rule.
- Lifecycle invalid transition nếu có.
- Retry/cancel nếu long-running.
- Responsive/accessibility nếu ảnh hưởng UI.

### `SERVICE_ORCHESTRATED`

Endpoint không được browser gọi trực tiếp nhưng được backend/worker gọi trong flow do UI khởi tạo.

Ví dụ:

- Worker claim/process operation.
- Audit recording do server thực hiện.
- Webhook delivery recording.
- Internal completion callback.

Bắt buộc có:

- Tài liệu orchestration.
- Integration test.
- Bằng chứng flow UI đầu-cuối.
- Người chịu trách nhiệm.
- Không được dùng trạng thái này để né triển khai endpoint user-facing.

### `PUBLIC_EXTERNAL`

Endpoint được hệ thống ngoài gọi, không phải UI nội bộ gọi.

Ví dụ:

```text
POST /api/v1/integrations/inbound/{endpointCode}
```

Bắt buộc có:

- UI cấu hình endpoint nếu có.
- UI quan sát inbound event.
- Security test.
- Signature/replay/rate-limit test.
- API/integration test.
- Approved exception khỏi browser binding.

### `LEGACY_COMPATIBILITY`

Endpoint cũ được giữ vì tương thích.

Bắt buộc:

- Có feature flag hoặc fallback.
- Không phải primary UX.
- Có kế hoạch deprecate.
- Có test tương thích.

### `CONTRACT_BLOCKED`

Endpoint hoặc flow chưa thể ráp đúng vì API contract thiếu hoặc mâu thuẫn.

Bắt buộc:

- Có gap ID.
- Có backend ticket.
- Có owner.
- Có target phase.
- Feature bị disable hoặc feature-flag.
- **Module/Wave không được đánh dấu hoàn thành** nếu blocker thuộc phạm vi bắt buộc.

### `APPROVED_NON_UI_EXCEPTION`

Chỉ dùng khi endpoint thực sự không thuộc browser UI.

Bắt buộc:

- Lý do kiến trúc.
- Người phê duyệt.
- Test thay thế.
- Tài liệu security.
- Liên kết flow sử dụng endpoint.

## 0A.2 Không được hiểu sai “ráp đủ API”

`Ráp đủ API` không có nghĩa là ép frontend gọi mọi endpoint.

Quy tắc đúng:

```text
100% endpoint phải được kiểm kê
+
100% endpoint user-facing phải được nối vào UI
+
100% endpoint non-UI phải có phân loại và bằng chứng thay thế
+
0 endpoint bị bỏ quên
```

Không được:

- Bỏ endpoint vì không có menu riêng.
- Chỉ ghi controller đã được “bao phủ”.
- Chỉ tạo nút nhưng chưa gọi API thật.
- Chỉ mock dữ liệu rồi đánh dấu done.
- Chỉ nối happy path.
- Ẩn action thiếu permission bằng CSS sau khi đã gọi API.
- Gọi worker/service-only endpoint trực tiếp từ browser chỉ để đạt đủ số lượng.

## 0A.3 Ba cấp Completion Gate

### Page Completion Gate

Một page/workbench chỉ được hoàn thành khi:

- Tất cả endpoint được ánh xạ cho page có trạng thái hợp lệ.
- Không còn `TODO`, `UNMAPPED`, `MOCK_ONLY`.
- Tất cả endpoint user-facing đạt ít nhất `UI_TESTED`.
- Không còn contract blocker bắt buộc chưa xử lý.

### Module Completion Gate

Một module chỉ được hoàn thành khi:

```text
Mapped Endpoints = Contract Endpoints
Unmapped Endpoints = 0
User-facing Untested Endpoints = 0
Unapproved Non-UI Exceptions = 0
Required Contract Blockers = 0
```

### Wave Completion Gate

Wave 4 chỉ được hoàn thành khi:

```text
Tổng endpoint contract = Tổng endpoint trong Coverage Register
Tổng endpoint chưa phân loại = 0
Tổng endpoint user-facing chưa implement = 0
Tổng endpoint user-facing chưa test = 0
Tổng ngoại lệ chưa phê duyệt = 0
Tổng blocker bắt buộc = 0
```

## 0A.4 Coverage Register bắt buộc

Mỗi endpoint phải có một dòng với tối thiểu:

| Field | Bắt buộc |
|---|---|
| Module | Có |
| Controller/Area | Có |
| HTTP Method | Có |
| Contract Path | Có |
| Contract Purpose | Có |
| UI Page/Workbench | Có |
| Component/Action | Có |
| Integration Class | Có |
| Implementation Status | Có |
| Permission | Có trước DONE |
| Query/Mutation Hook | Có trước DONE |
| Cache Invalidation | Có nếu mutation |
| Test Evidence | Có trước DONE |
| Exception/Gap ID | Có nếu không nối UI |
| Owner | Có trong implementation tracker |

## 0A.5 Trạng thái tracker

```text
UNMAPPED
MAPPED
IN_IMPLEMENTATION
UI_IMPLEMENTED
UI_TESTED
SERVICE_ORCHESTRATED
PUBLIC_EXTERNAL
LEGACY_COMPATIBILITY
CONTRACT_BLOCKED
APPROVED_NON_UI_EXCEPTION
```

Không dùng một trạng thái chung chung như:

```text
DONE
COVERED
HANDLED
```

nếu không có test evidence.

## 0A.6 Evidence tối thiểu

Ví dụ bằng chứng hợp lệ:

```text
Route: /w/:workspaceId/p/:projectId/requirements
Component: RequirementsRegisterPage
Hook: useRequirementsQuery
Mutation: useApproveRequirementMutation
Test: requirements.approve.spec.ts
Permission test: REQUIREMENT_APPROVE denied
Network evidence: POST .../approve returns 200
Invalidation: requirements + requirement + traceability matrix
```

## 0A.7 Endpoint không có UI riêng

Endpoint không cần page riêng vẫn phải được nối vào một UI action hợp lý:

```text
approve
→ Primary/overflow lifecycle action

archive
→ Row action / detail action

reorder
→ Drag-and-drop + keyboard move

status
→ Job status panel

download
→ Download action

search
→ Search field / search overlay

list
→ Table, picker, inspector or background data source

get by ID
→ Detail route, drawer, inspector or preload

health check
→ Connection detail action

retry
→ Failed job row action

cancel
→ Running job/action menu
```

---

---

# 1. Information Architecture

## 1.1 Internal App Shell

```text
┌──────────────────────────────┬──────────────────────────────────────┐
│ SIDEBAR                      │ MAIN CONTENT                         │
│                              │                                      │
│ [Logo][Workspace/Project][«] │ Breadcrumb                           │
│                              │ Page Title                  Actions  │
│ Search                       │ Description / Metadata               │
│ Document Hub                 │                                      │
│ Notifications                │ Toolbar                              │
│ AI Assistant                 │                                      │
│ Work Inbox                   │ Page / Workbench                     │
│                              │                                      │
│ Context Navigation           │                                      │
│                              │                                      │
│ [Avatar] User / Organization │                                      │
└──────────────────────────────┴──────────────────────────────────────┘
```

## 1.2 Common Navigation

```text
Search
Document Hub
Notifications
AI Assistant
Work Inbox
```

- Search mở Search Overlay.
- `Ctrl/Cmd + K` mở Command Palette.
- Document Hub là module xuyên scope.
- AI Assistant mở side panel hoặc full workspace.
- Work Inbox là danh sách việc cần xử lý, không đồng nghĩa với Notifications.

## 1.3 Workspace Navigation

```text
Overview
Activity
Projects
Capacity
Clients & Contacts
Applications
Support
Forms
Directory
```

## 1.4 Project Navigation

```text
Overview

PLAN
Work Items
WBS
Timeline
Schedule
Resources

SCOPE & REQUIREMENTS
Scope
Deliverables
Requirements
Traceability

QUALITY
Quality
Defects
Releases

COMMERCIAL
Estimation
Financials
Quotes

CONTROL
Baselines
Change Requests
Governance

COLLABORATION
Meetings
Client Collaboration

INTELLIGENCE
AI Planning
Recommendations
Reports
```

## 1.5 Settings Navigation

```text
PERSONAL
Profile
Preferences
My Notifications
Navigation

KNOWLEDGE & DOCUMENTS
Document Types
Document Templates
Knowledge Indexing

GOVERNANCE
Governance Policies
Governed Object Types

AUTOMATION
Event Registry
Project Notification Administration

CLIENT PORTAL
Permission Policies
Portal Accounts

INTEGRATIONS
Providers
Connections
Credentials
Imports
Exports
Sync
Webhooks
Mappings
Observability

TRUST & COMPLIANCE
Trust Dashboard
Classification
Sensitive Data
Audit
Privacy
Retention
Legal Holds
Access Reviews
Evidence

SERVICE SUPPORT
Queues
Request Types
SLA
Escalation
Service Profiles
Warranties
Maintenance Configuration
```

## 1.6 Client Portal Shell

```text
┌────────────────────────────────────────────────────────────────┐
│ Brand                  Project Switcher        Help  User Menu  │
├────────────────────────────────────────────────────────────────┤
│ Overview | Reviews | Meetings | Forms | Feedback | Support      │
├────────────────────────────────────────────────────────────────┤
│ Portal Main Content                                             │
└────────────────────────────────────────────────────────────────┘
```

Client Portal phải đơn giản, responsive, chỉ dùng client-safe DTO và session riêng.

---

# 2. Route Proposal

## 2.1 Common

```text
/search
/documents
/documents/recent
/documents/favorites
/documents/shared
/documents/:documentId
/ai
/ai/conversations/:conversationId
/work-inbox
/notifications
```

## 2.2 Workspace

```text
/w/:workspaceId/applications
/w/:workspaceId/applications/:applicationId
/w/:workspaceId/support
/w/:workspaceId/support/cases
/w/:workspaceId/support/cases/:caseId
/w/:workspaceId/support/incidents
/w/:workspaceId/support/incidents/:incidentId
/w/:workspaceId/support/problems
/w/:workspaceId/support/maintenance
/w/:workspaceId/support/metrics
```

## 2.3 Project — Quality and Delivery

```text
/w/:workspaceId/p/:projectId/quality
/w/:workspaceId/p/:projectId/quality/plans/:qualityPlanId
/w/:workspaceId/p/:projectId/quality/test-plans
/w/:workspaceId/p/:projectId/quality/test-plans/:testPlanId
/w/:workspaceId/p/:projectId/quality/test-cases
/w/:workspaceId/p/:projectId/quality/test-cases/:testCaseId
/w/:workspaceId/p/:projectId/quality/test-runs
/w/:workspaceId/p/:projectId/quality/test-runs/:testRunId
/w/:workspaceId/p/:projectId/defects
/w/:workspaceId/p/:projectId/defects/:defectId
/w/:workspaceId/p/:projectId/releases
/w/:workspaceId/p/:projectId/releases/:releaseId
/w/:workspaceId/p/:projectId/deployments
```

## 2.4 Project — Requirements, Governance, Reporting and AI

```text
/w/:workspaceId/p/:projectId/requirements
/w/:workspaceId/p/:projectId/requirements/:requirementId
/w/:workspaceId/p/:projectId/traceability
/w/:workspaceId/p/:projectId/traceability/matrix
/w/:workspaceId/p/:projectId/governance
/w/:workspaceId/p/:projectId/governance/reports
/w/:workspaceId/p/:projectId/reports
/w/:workspaceId/p/:projectId/reports/:reportCode
/w/:workspaceId/p/:projectId/activity
/w/:workspaceId/p/:projectId/ai-planning
/w/:workspaceId/p/:projectId/ai-planning/:runId
/w/:workspaceId/p/:projectId/recommendations
/w/:workspaceId/p/:projectId/client-collaboration
```

## 2.5 Settings

```text
/settings/workspace/:workspaceId/knowledge/document-types
/settings/workspace/:workspaceId/knowledge/document-types/:documentTypeId
/settings/workspace/:workspaceId/knowledge/templates
/settings/workspace/:workspaceId/knowledge/indexing
/settings/workspace/:workspaceId/governance/policies
/settings/platform/event-registry
/settings/platform/event-registry/:eventDefinitionId
/settings/workspace/:workspaceId/portal/policies
/settings/workspace/:workspaceId/portal/accounts
/settings/workspace/:workspaceId/integrations
/settings/workspace/:workspaceId/integrations/connections/:connectionId
/settings/workspace/:workspaceId/integrations/credentials
/settings/workspace/:workspaceId/integrations/imports
/settings/workspace/:workspaceId/integrations/imports/:importJobId
/settings/workspace/:workspaceId/integrations/exports
/settings/workspace/:workspaceId/integrations/sync
/settings/workspace/:workspaceId/integrations/conflicts
/settings/workspace/:workspaceId/integrations/webhooks
/settings/workspace/:workspaceId/integrations/mappings
/settings/workspace/:workspaceId/integrations/observability
/settings/workspace/:workspaceId/trust
/settings/workspace/:workspaceId/trust/classification
/settings/workspace/:workspaceId/trust/sensitive-data
/settings/workspace/:workspaceId/trust/audit
/settings/workspace/:workspaceId/trust/privacy
/settings/workspace/:workspaceId/trust/privacy/:requestId
/settings/workspace/:workspaceId/trust/retention
/settings/workspace/:workspaceId/trust/legal-holds
/settings/workspace/:workspaceId/trust/access-reviews
/settings/workspace/:workspaceId/trust/evidence
/settings/workspace/:workspaceId/support
/settings/workspace/:workspaceId/support/queues
/settings/workspace/:workspaceId/support/request-types
/settings/workspace/:workspaceId/support/sla
/settings/workspace/:workspaceId/support/escalation
/settings/workspace/:workspaceId/support/service-profiles
/settings/workspace/:workspaceId/support/warranties
/settings/workspace/:workspaceId/support/maintenance
```

## 2.6 Client Portal

```text
/portal/login
/portal/accept-invite
/portal/account
/portal/projects
/portal/projects/:projectId
/portal/projects/:projectId/reviews
/portal/projects/:projectId/meetings
/portal/projects/:projectId/meetings/:meetingId
/portal/projects/:projectId/forms
/portal/projects/:projectId/forms/:formId
/portal/projects/:projectId/comments
/portal/projects/:projectId/feedback
/portal/projects/:projectId/support
/portal/projects/:projectId/support/:caseId
```

---

# 3. Page Inventory

| ID | Page / Workbench | Context |
|---|---|---|
| DOC-01 | Document Hub | Common |
| DOC-02 | Document Viewer & Inspector | Common |
| DOC-03 | Document Upload / Version Flow | Common |
| DOC-04 | Generated Document Jobs | Project |
| KNW-01 | Document Type Library | Settings |
| KNW-02 | Document Type Builder | Settings |
| KNW-03 | Knowledge Indexing Center | Settings |
| KNW-04 | Knowledge Graph Explorer | Project/Common |
| EVT-01 | Event Registry | Settings |
| EVT-02 | Event Definition Detail | Settings |
| GOV-01 | Project Governance Center | Project |
| GOV-02 | Governed Object Inspector | Shared |
| GOV-03 | Governance Policies | Settings |
| GOV-04 | Governance Reports | Project |
| QLT-01 | Quality Center | Project |
| QLT-02 | Quality Plan | Project |
| QLT-03 | Test Management | Project |
| QLT-04 | Test Case Workbench | Project |
| QLT-05 | Test Run Execution | Project |
| DEF-01 | Defect Center | Project |
| DEF-02 | Defect Detail | Project |
| REL-01 | Release Center | Project |
| REL-02 | Release Readiness | Project |
| DEP-01 | Deployment Center | Project |
| RPT-01 | Project Dashboard | Project |
| RPT-02 | Report Library | Project |
| RPT-03 | Report Runner | Project |
| RPT-04 | Export Jobs | Project/Settings |
| AI-01 | AI Assistant Panel / Workspace | Common |
| AIP-01 | AI Planning Center | Project |
| AIP-02 | Planning Suggestion Review | Project |
| AIR-01 | Recommendation Center | Project |
| AIR-02 | Entity Recommendation Panel | Shared |
| CLI-01 | Client Collaboration Center | Project |
| CLI-02 | Portal Accounts & Access | Project/Settings |
| CLI-03 | Client Reviews | Project |
| CLI-04 | Client UAT | Project |
| PRT-01 | Portal Project Home | Portal |
| PRT-02 | Portal Reviews | Portal |
| PRT-03 | Portal Meetings | Portal |
| PRT-04 | Portal Forms | Portal |
| PRT-05 | Portal Feedback | Portal |
| PRT-06 | Portal Support | Portal |
| PRD-01 | Global Search | Common |
| PRD-02 | Command Palette | Common |
| PRD-03 | Work Inbox | Common |
| PRD-04 | Saved Items | Common |
| INT-01 | Integration Dashboard | Settings |
| INT-02 | Connections & Credentials | Settings |
| INT-03 | Import Center | Settings |
| INT-04 | Export Center | Settings |
| INT-05 | Sync Center | Settings |
| INT-06 | Conflict Resolution | Settings |
| INT-07 | Webhooks | Settings |
| INT-08 | Mapping & External IDs | Settings |
| TRC-01 | Requirements Register | Project |
| TRC-02 | Requirement Workbench | Project |
| TRC-03 | Traceability Matrix | Project |
| APP-01 | Application Registry | Workspace |
| APP-02 | Application Architecture Workbench | Workspace |
| TRU-01 | Trust Dashboard | Settings |
| TRU-02 | Classification & Sensitive Data | Settings |
| TRU-03 | Privacy Request Center | Settings |
| TRU-04 | Data Subject Detail | Settings |
| TRU-05 | Retention & Legal Hold | Settings |
| TRU-06 | Access Review Campaign | Settings |
| TRU-07 | Compliance Evidence | Settings |
| SUP-01 | Support Dashboard | Workspace |
| SUP-02 | Support Case Center | Workspace |
| SUP-03 | Support Case Workbench | Workspace |
| SUP-04 | Incident & Problem Center | Workspace |
| SUP-05 | Maintenance Center | Workspace |
| SUP-06 | Support Configuration | Settings |
| SUP-07 | Handover & Knowledge | Workspace |

---

# 4. Document Hub

## 4.1 DOC-01 — Document Hub

Document Hub nằm trong Common Navigation và chỉ xuất hiện một lần.

```text
┌──────────────────────┬──────────────────────────────┬────────────────────┐
│ Scope & Collections  │ Document List               │ Preview / Inspector │
│                      │                              │                     │
│ All Documents        │ Search                       │ Metadata            │
│ Recent               │ Filters                      │ Current Version     │
│ Favorites            │ Grid/List                    │ Classification      │
│ Shared with Me       │ Documents                    │ Governance          │
│ Folders              │                              │ Shares              │
└──────────────────────┴──────────────────────────────┴────────────────────┘
```

### Scope

```text
Organization
Workspace
Project
Personal
```

Wave 4 contract mới mô tả đầy đủ project documents và workspace templates. Scope chưa có API phải feature-gate.

### API mapping

- Documents create/list/search/get/masked/approve.
- Versions upload/list/get/download.
- Folders create/list/get/archive.
- Shares create/list/revoke.
- Knowledge source/chunks.
- Knowledge graph related.
- Favorites/recent items.

### Document list

```text
Title
Code
Type
Folder
Status
Current Version
Classification
Owner
Updated
Shares
Actions
```

Contract còn thiếu owner/classification/updatedAt/folder summary trong list. Không gọi N+1 để dựng bảng.

### Search modes

```text
Document Search
Semantic Knowledge Search
```

Semantic result hiển thị source title, heading path, excerpt; ACL-filtered và không leak hidden result.

### Create document flow

1. Tạo metadata.
2. Request presigned upload.
3. Upload trực tiếp storage.
4. Complete upload.
5. Refresh current version.
6. Hiển thị indexing status.

## 4.2 DOC-02 — Document Viewer & Inspector

Tabs:

```text
Preview
Versions
Metadata
Shares
Knowledge
Governance
Activity
```

### Preview

- PDF/image/plain text preview.
- Unsupported fallback/download.
- Masked endpoint khi user thiếu sensitive access.
- Không request unmasked trước rồi mới ẩn.

### Versions

```text
Version
File
Content Type
Size
Status
Change Notes
Uploaded
Actions
```

States:

```text
PENDING
AVAILABLE
FAILED
```

### Governance tab

- Owner.
- Lock/finalized.
- Access grants.
- Governance versions.
- Snapshot diff.
- Restore.
- Baseline guard.

## 4.3 DOC-03 — Presigned Upload Flow

```text
SELECTED
→ REQUESTING_URL
→ UPLOADING
→ COMPLETING
→ AVAILABLE
```

Failure states:

```text
REQUEST_FAILED
UPLOAD_FAILED
COMPLETE_FAILED
EXPIRED
```

Requirements:

- Validate file size/MIME.
- Upload progress.
- Cancel/retry.
- Change notes.
- Không log/persist presigned URL.
- Legacy storageKey flow ẩn sau compatibility flag.

## 4.4 DOC-04 — Generated Documents

Flow:

1. Select template.
2. Select job type.
3. Review variables.
4. Queue.
5. Process/render.
6. Complete with output document.
7. Open output.

Jobs table:

```text
Template
Job Type
Status
Created
Completed
Output Document
Error
Actions
```

`process` có vẻ là worker endpoint; frontend không nên gọi nếu không được xác nhận là user-facing.

---

# 5. Knowledge

## 5.1 KNW-01 — Document Type Library

Placement:

```text
Avatar → Settings → Knowledge & Documents → Document Types
```

Table:

```text
Code
Name
Scope
Category
Default Classification
Review Cycle
Template
Built-in
System
Status
Updated
Actions
```

Filters: keyword, scope, organization/workspace, status, built-in, archived.

## 5.2 KNW-02 — Document Type Builder

Sections:

```text
General
Defaults
Custom Fields
Metadata Schema
Lifecycle
```

Custom fields:

```text
Key
Label
Description
Data Type
Required
System Field
Options
Validation
Default Value
Display Order
```

Data types:

```text
TEXT NUMBER DATE BOOLEAN SELECT MULTISELECT URL
```

Reorder dùng local draft + save-all. JSON editor chỉ là advanced mode cho admin.

## 5.3 KNW-03 — Knowledge Indexing Center

Dashboard:

- Indexed sources.
- Pending/running.
- Failed sources.
- Last project/workspace index.
- Processed/success/failure.

Jobs table:

```text
Job Type
Workspace
Project
Status
Processed
Success
Failure
Queued
Started
Completed
Trace ID
```

Special headers:

- `X-Workspace-Id`.
- `X-Actor-Id` tự lấy session.
- `X-Acl-Tokens` từ trusted access layer.

Không lưu ACL tokens trong URL, analytics hoặc local storage.

## 5.4 KNW-04 — Knowledge Graph Explorer

Entry points:

- Document → Knowledge.
- Requirement → Related Knowledge.
- AI citation.
- Search result.

Layout:

```text
Graph Canvas
Accessible Node List / Tree
Relation Filters
Selected Node Inspector
```

Graph phải có table/tree alternative và không leak inaccessible node/edge.

---

# 6. Event Registry

## 6.1 EVT-01 — Event Registry

Placement:

```text
Settings → Automation → Event Registry
```

Table:

```text
Code
Name
Event Key
Source System
Owner Module
Version
Classification
Status
Replacement
Updated
Actions
```

Lifecycle:

```text
ACTIVE INACTIVE DEPRECATED
```

Deprecate dialog: reason, replacement event, impact warning, confirm.

## 6.2 EVT-02 — Event Definition Detail

Tabs:

```text
Overview
Input Schema
Output Schema
Variables
Consumers / Usage
Lifecycle
```

Variable editor:

```text
Variable Path
Label
Type
Required
Sensitive
```

`PUT variables` là replace-all, nên dùng local draft và save-all.

Sensitive variables phải bị chặn khỏi client-visible template nếu policy không cho phép.

---

# 7. Governance

## 7.1 GOV-01 — Project Governance Center

Tabs:

```text
Overview
Ownership
Locks
Access
Versions
Reports
```

Overview:

- Governance health.
- Ownership coverage.
- Locked/finalized objects.
- Object access grants.
- Version/restore activity.
- Policy exceptions.

Ownership table:

```text
Object Type
Object
Owner Type
Owner
Assigned
Status
Actions
```

Locks table:

```text
Object
Lock Type
Reason
Created By
Created At
Finalized
Release
Open
```

Access grants:

```text
Object
Grantee
Role
Granted
Status
Revoke
```

## 7.2 GOV-02 — Governed Object Inspector

Shared inspector embedded trong document, requirement, baseline, quality plan và object khác.

Sections:

```text
Ownership
Lock / Finalization
Access Grants
Version History
Snapshot Diff
Restore
Baseline Guard
```

Restore flow:

1. Select version.
2. Compare current vs snapshot.
3. Baseline guard check.
4. Show affected links.
5. Confirm.
6. Restore.
7. Refresh object/history.

Không optimistic update.

## 7.3 GOV-03 — Governance Policies

Policy matrix rows = object types; columns:

```text
Versioning Mode
Version on Update
Lock on Finalize
Restore
Owner Grant
Baseline Guard
Audit Level
```

Disable fields mà object type catalog không hỗ trợ.

## 7.4 GOV-04 — Governance Reports

- Governance Pack.
- Ownership.
- Access Grants.
- Version History.
- Locked Objects.
- Restore Activity.

Có filters, entity deep link, permission-aware export.

---

# 8. Quality and Delivery

## 8.1 QLT-01 — Quality Center

Dashboard:

- Current Quality Plan.
- Test execution/pass rate.
- Coverage.
- Open defects.
- Critical/high defects.
- Release readiness.
- Recent deployments.
- Attention items.

Tabs:

```text
Overview
Quality Plans
Test Management
Test Runs
Coverage
```

Quality report endpoints đang trả `Map<String,Object>`; cần typed DTO trước production dashboard.

## 8.2 QLT-02 — Quality Plan

Register:

```text
Code
Name
Status
Current
Objectives
Approved
Updated
Actions
```

Detail:

```text
Objectives
Test Strategy
Entry Criteria
Exit Criteria
Linked Test Plans
Governance
History
```

Draft editable; approved/current behavior phải xác nhận backend.

## 8.3 QLT-03 — Test Management

Hierarchy:

```text
Quality Plan
└── Test Plan
    └── Test Suite
        └── Test Case
            └── Test Steps
```

Layout: structure tree + selected content.

Test case register:

```text
Code
Title
Type
Priority
Suite
Status
Coverage
Last Result
Defects
Actions
```

Test suite/case/step thiếu update/reorder; không làm editable grid giả.

## 8.4 QLT-04 — Test Case Workbench

Tabs:

```text
Definition
Steps
Coverage
Execution History
Defects
Governance
```

Coverage links requirement/scope item qua Entity Reference Picker.

## 8.5 QLT-05 — Test Run Execution

Register:

```text
Run
Type
Plan
Suite
Release
Status
Progress
Passed
Failed
Blocked
Not Run
Started
Actions
```

Workbench:

```text
Run Header
Progress
Case Queue
Selected Case Execution
Defect Creation
```

Execution panel: preconditions, steps, expected, actual, result status, create defect, previous/next.

Need clarify multiple attempts, evidence, step-level results và retest.

## 8.6 DEF-01 — Defect Center

Views:

```text
Table
Board
Analytics
```

Table:

```text
Code
Title
Severity
Priority
Status
Category
Assignee
Source Test
Age
Release
Updated
Actions
```

Board chỉ visualization; không drag qua invalid transition.

## 8.7 DEF-02 — Defect Detail

Sections:

```text
Summary
Reproduction
Expected vs Actual
Lifecycle
Assignment
Links
Source Test Result
Activity
```

Lifecycle actions chỉ hiện khi hợp lệ:

- Triage.
- Assign.
- Mark fixed.
- Ready for retest.
- Verify.
- Close.
- Reopen.
- Archive.

## 8.8 REL-01 — Release Center

Register:

```text
Code
Version
Name
Type
Planned Date
Status
Readiness
Open Defects
Test Progress
Deployment
Actions
```

Detail tabs:

```text
Overview
Items
Readiness
Test Evidence
Defects
Deployments
Rollback
Activity
```

## 8.9 REL-02 — Release Readiness

Checklist:

- Test plans approved.
- Test run completed.
- Pass threshold met.
- No blocking defects.
- Documents approved.
- Rollback plan approved.
- Environment available.
- Client UAT complete.
- Governance/baseline guard passed.

Readiness response cần typed DTO.

## 8.10 DEP-01 — Deployment Center

Tabs:

```text
Deployments
Environments
Rollback Plans
History
```

Deployment lifecycle:

```text
Create → Start → Succeed / Fail → Rollback
```

Rollback plan schema cần đầy đủ trước khi làm builder.

---

# 9. Reporting

## 9.1 RPT-01 — Project Dashboard

Project Overview dùng Dashboard APIs.

Sections:

- Health score.
- KPI strip.
- Attention.
- Schedule.
- Capacity.
- Quality.
- Finance.
- Risks.
- Change.
- AI suggestions.
- Recent activity.

Không quá 6 primary KPIs; mỗi widget có timestamp và permission-aware masking.

## 9.2 RPT-02 — Report Library

Categories:

```text
Planning
Risk
Schedule
Capacity
Estimation
Finance
Quote
Baseline
Change
Quality
Notifications
AI Planning
Governance
```

Definition card: name, code, description, required filters, supported fields/exports, permission, last run.

## 9.3 RPT-03 — Report Runner

Flow:

1. Select definition.
2. Configure filters.
3. Select fields.
4. Run.
5. Poll status.
6. View immutable snapshot.
7. Export.

Snapshot labels: run ID, generated time, project, filters, fields, classification, formula version.

## 9.4 RPT-04 — Export Jobs

```text
Report
File Name
Format
Status
Created
Completed
Size
Expires
Download
Cancel
```

Download phải recheck permission và ghi export audit.

---

# 10. AI Assistant, Planning and Recommendations

## 10.1 AI-01 — AI Assistant

Entry point trong Common Navigation. Modes:

- Side panel.
- Full workspace.
- Contextual Ask AI.

Context chip:

```text
Using context: Testing / Digital Transformation / Project Risks
```

Conversation layout:

```text
Conversation List
Chat Thread
Context / Sources Panel
Composer
```

SSE flow:

1. POST message.
2. Receive assistant message ID + stream URL.
3. Open SSE.
4. Append events.
5. Handle completed/error/cancelled.
6. Reconcile final message.

States:

```text
QUEUED CONNECTING STREAMING RECONNECTING COMPLETED CANCELLED ERROR
```

Requirements:

- Cancel.
- Reconnect.
- Idempotency key.
- Avoid duplicate tokens/messages.
- Safe markdown.
- Abort on logout/delete.
- Final server reconciliation.

Contract thiếu citation/source DTO; cần bổ sung để trả lời project facts có thể kiểm chứng.

Guides:

- Explain page.
- Explain field.
- Explain disabled action.
- Suggested questions.

## 10.2 AIP-01 — AI Planning Center

Layout:

```text
Current Planning Suggestions
Planning Runs                       [New AI Planning Run]
Recent Applied Changes
```

Create run: type, agent, prompt template, focus area, included sections, options, review.

## 10.3 AIP-02 — Planning Suggestion Review

```text
Suggestion Header
Summary
Suggestion Items
Impact / Diff
Review Decisions
Apply
```

Mỗi item hiển thị domain action, target, proposed payload, before/after, risk, accept/reject.

Apply review phải cho biết:

- Accepted/rejected count.
- Baselined state.
- Có tạo Change Request không.
- Direct actions.
- Permission.
- Irreversibility.

No optimistic update.

## 10.4 AIR-01 — Recommendation Center

Phân biệt:

```text
AI Planning = structured planning changes.
AI Recommendations = ongoing suggestions / next best actions.
```

Layout:

```text
Next Best Actions
Recommendation Feed
Filters
Run Recommendations
```

`suggestionRef` là string, không assume UUID.

Actions:

- View.
- Edit payload.
- Accept/reject.
- Suppress.
- Prepare apply.
- Feedback.

## 10.5 AIR-02 — Entity Recommendation Panel

Embed trong Task, Requirement, Risk, Resource, Release, Defect, Finance entity.

- Count badge.
- New/viewed.
- Open Recommendation Center.
- Không tự động execute.
- Explain disabled action bằng reason code/AI guide.

---

# 11. Client Collaboration and Portal

## 11.1 CLI-01 — Client Collaboration Center

Tabs:

```text
Overview
Accounts & Access
Reviews
UAT
Comments & Feedback
Portal Audit
```

Overview: active accounts, pending invites, grants, reviews, UAT, comments, support cases, activity.

## 11.2 CLI-02 — Portal Accounts & Access

Combine invites, accounts, grants, permission policies.

Invites:

```text
Email
Status
Expires
Sent
Accepted
Actions
```

Accounts:

```text
Client
Email
Status
Projects
Last Login
Actions
```

Contract thiếu account list/search, invite resend/revoke và typed permission matrix.

## 11.3 CLI-03 — Client Reviews

Register:

```text
Review
Target
Client
Status
Requested
Due
Decision
Comment
Actions
```

Critical gap: portal-facing decision endpoint chưa có.

## 11.4 CLI-04 — Client UAT

- Test case.
- Client account.
- Assignment.
- Result.
- Comment.
- Defect/feedback.

Portal UAT execution/result endpoints chưa có; chưa làm full flow.

## 11.5 Portal Pages

### PRT-01 Project Home

- Project name/status.
- Key dates.
- Pending reviews.
- Upcoming meetings.
- Published/client-visible docs khi API có.
- Open support cases.

### PRT-02 Reviews

- Requests.
- Target preview.
- Decision/comment/history.

### PRT-03 Meetings

- List/detail.
- Minutes.
- Comments.
- Client-safe DTO.

### PRT-04 Forms

- Published version.
- Dynamic renderer.
- Validation.
- Submit.
- Confirmation.

### PRT-05 Feedback

- Create/list allowed feedback.
- Visibility/status rules explicit.

### PRT-06 Support

- Create/list/detail/comments/timeline.
- Current contract thiếu detail/comments.

## 11.6 Portal Security

- `portal_access_token` session riêng.
- Separate API client/cache namespace.
- Không reuse unrestricted internal DTO.
- Client visibility enforced backend-side.
- Logout/refresh riêng.

---

# 12. Project Notifications and Productivity

## 12.1 Project Notification UX

Không tạo top-level page riêng cho subscriptions.

Entry points:

- Project context menu: Watch project.
- Task detail: Watch task.
- Avatar → Settings → My Notifications.
- Project settings → Notifications.

Subscription states:

```text
Not subscribed
Watching
Muted
Automatic Owner/Assignee/Reviewer
```

Preferences matrix rows = event code, columns = channel. Dùng Event Registry label thay raw code.

Reminder runs là admin operation dưới Settings → Notifications.

## 12.2 PRD-01 — Global Search

Overlay có hai mode:

```text
Search
Commands
```

Result groups:

- Projects.
- Tasks.
- Documents.
- Requirements.
- Test cases.
- Defects.
- Meetings.
- People.
- Clients.
- Support cases.
- Applications.

Result hiển thị type, title/code, scope, highlight, updated, classification/masked state.

## 12.3 PRD-02 — Command Palette

Examples:

- Create project/task/requirement/defect.
- Open Document Hub.
- Run report.
- Start AI planning.
- Switch workspace/project.
- Open settings.

Side-effect command phải mở form/confirmation, không execute destructive action ngay.

## 12.4 PRD-03 — Work Inbox

Difference:

```text
Notifications = events/updates.
Work Inbox = items requiring attention/action.
```

Layout:

```text
Category Rail
Inbox List
Preview / Action
```

Mark-read không thay đổi underlying entity status.

## 12.5 PRD-04 — Saved Items

Unified personal page:

```text
Saved Searches
Saved Views
Favorites
Pins
Recent Items
```

Saved view config cần versioned schema: columns, filters, sort, group, density, default.

Navigation preferences:

- Pinned items.
- Optional hidden items.
- Compact mode.
- Reset defaults.

---

# 13. Integration Hub

## 13.1 INT-01 — Integration Dashboard

Placement:

```text
Avatar → Settings → Integrations
```

Dashboard:

- Active connections.
- Health.
- Failed checks.
- Running/failed syncs.
- Open conflicts.
- Rate limits.
- Dead letters.
- Recent inbound/outbound events.

Provider catalog hiển thị capabilities và create connection.

OneDrive/Google Drive chỉ là import/export connectors, không phải primary storage.

## 13.2 INT-02 — Connections & Credentials

Connection table:

```text
Connection
Provider
Status
Credential
Last Health Check
Last Sync
Errors
Actions
```

Create flow:

1. Select provider.
2. Choose/create credential reference.
3. Name.
4. Provider config.
5. Test connection.
6. Save.
7. Enable.

Credential reference không bao giờ hiển thị secret. `secretReference` nên được tạo qua secure vault onboarding.

## 13.3 INT-03 — Import Center

Flow:

```text
Create Job
→ Select Source
→ Map
→ Validate
→ Dry Run
→ Review Rows
→ Execute
→ Result
```

Rows:

```text
Row
Source Data
Target Entity
Validation
Action
Error
Result ID
```

Dry run bắt buộc cho high-risk import; cần idempotency và partial-failure summary.

## 13.4 INT-04 — Export Center

Export profiles: object scope, fields, filters, format, mapping, status.

Export jobs: profile, status, records, file, created/completed, download/cancel.

Mọi export phải ghi Trust export audit.

## 13.5 INT-05 — Sync Center

Sync jobs:

```text
Name
Connection
Direction
Mode
Object Scope
Conflict Strategy
Status
Schedule
Last Run
Next Run
Actions
```

Contract thiếu schedule fields; ẩn scheduling cho tới khi có.

## 13.6 INT-06 — Conflict Resolution

Workbench:

```text
Conflict Queue
Source Record
Target Record
Field Diff
Resolution
```

Strategies:

```text
SOURCE_WINS
TARGET_WINS
MANUAL_REVIEW
```

Manual review chọn value per field, notes, preview, resolve.

## 13.7 INT-07 — Webhooks

Tabs:

```text
Outbound Subscriptions
Delivery Attempts
Inbound Endpoints
Inbound Events
```

Public inbound endpoint cần signature validation, replay protection, rate limiting và idempotency.

Payload sensitive phải mask.

## 13.8 INT-08 — Mapping & Observability

Mapping builder cần typed contract:

```text
Source Field
Transform
Target Field
Required
Default
Validation
```

Observability gồm rate limits, dead letters, failed sync/webhook, retry/resolve.

---

# 14. Traceability and Application Registry

## 14.1 TRC-01 — Requirements Register

Views:

```text
Table
Board
Hierarchy khi backend hỗ trợ parent
```

Table:

```text
Code
Title
Type
Priority
Status
Application
Coverage
Tests
Implementation
Updated
Actions
```

Filters: type, priority, status, application, coverage gap, implemented state.

## 14.2 TRC-02 — Requirement Workbench

Tabs:

```text
Definition
Acceptance Criteria
Sources
Versions
Trace Links
Test Coverage
Activity
Governance
```

Trace link types:

```text
IMPLEMENTED_BY
TESTED_BY
DEPENDS_ON
BLOCKS
DERIVED_FROM
```

Acceptance criteria/source thiếu update/archive/reorder; dùng append-only trước.

## 14.3 TRC-03 — Traceability Matrix

Rows = Requirements.

Columns/sections:

```text
Scope
Tasks
Test Cases
Test Results
Defects
Release
Status
```

Gap states:

- No implementation link.
- No test coverage.
- Test not run.
- Failed tests.
- Open defects.
- Not in release.
- Fully covered.

Server-side typed coverage matrix required cho performance.

## 14.4 APP-01 — Application Registry

Workspace-level register:

```text
Application
Code
Owner
Modules
Components
Endpoints
Entities
Screens
Updated
Actions
```

Use cases: requirement scope, impact analysis, traceability, AI context, documentation.

## 14.5 APP-02 — Application Architecture Workbench

Hierarchy:

```text
Application
├── Modules
├── Components
├── API Endpoints
├── Data Entities
└── Screens
    ├── Sections
    ├── Fields
    └── Actions
```

Current APIs chủ yếu create/list/get; chưa phải full architecture modeling editor.

---

# 15. Trust & Compliance

## 15.1 TRU-01 — Trust Dashboard

Metrics:

- Sensitive objects/fields.
- Sensitive access.
- Export events.
- Open privacy requests.
- Retention jobs.
- Active legal holds.
- Access review campaigns/findings.
- Evidence status.
- Classification coverage.

Attention:

- Overdue privacy request.
- Failed anonymization.
- Retention conflict with legal hold.
- Unresolved access finding.
- Unfinalized evidence.

## 15.2 TRU-02 — Classification & Sensitive Data

Classifications:

```text
PUBLIC
INTERNAL
CONFIDENTIAL
RESTRICTED
```

Sensitive fields table:

```text
Object Type
Field Path
Classification
Masking Strategy
Status
Updated
Actions
```

Strategies:

```text
REDACT PARTIAL HASH TOKENIZE
```

Preview dùng synthetic sample, không dùng giá trị thật.

## 15.3 TRU-03 — Privacy Request Center

Register:

```text
Request
Data Subject
Type
Status
Due
Owner
Created
Completed
Actions
```

Lifecycle: create, triage, in review, complete, reject, cancel.

Detail:

```text
Subject
Scope
Verification
Search Results
Export Package
Actions
Timeline
Audit
```

Contract thiếu export package detail/download.

## 15.4 TRU-04 — Data Subject Detail

- Identity keys.
- Contact points.
- Linked records.
- Consent.
- Suppressions.
- Privacy requests.
- Export packages.
- Anonymization plans.

Rebuild index cần job status contract.

## 15.5 TRU-05 — Retention & Legal Hold

Retention policies:

```text
Code
Name
Object Type
Period
Action
Status
Last Dry Run
Affected Count
Actions
```

Dry run hiển thị candidates, legal-hold exclusions, errors và impact.

Legal hold phải override retention/anonymization theo policy.

## 15.6 TRU-06 — Access Review Campaign

Register:

```text
Campaign
Scope
Reviewer
Status
Started
Due
Progress
Findings
Actions
```

Current API thiếu review item/decision endpoints; chưa thể làm campaign review hoàn chỉnh.

## 15.7 TRU-07 — Compliance Evidence

- Code/title.
- Control/framework.
- Source.
- Period.
- Classification.
- Owner.
- Status.
- Finalized.
- Document links.
- Governance.

Finalize phải lock evidence.

---

# 16. Service Support

## 16.1 SUP-01 — Support Dashboard

Metrics:

- Open cases.
- New/untriaged.
- SLA at risk/breaches.
- Incidents/problems.
- Maintenance windows.
- Effort/cost.
- Portal cases.
- Knowledge linkage.

Queue summary:

```text
Queue
Open
Unassigned
SLA Risk
Oldest
Owner
```

## 16.2 SUP-02 — Support Case Center

Views:

```text
My Queue
All Cases
Unassigned
SLA Risk
Portal Cases
Resolved
```

Table:

```text
Case
Title
Type
Priority
Status
Project
Source
Portal Visible
Owner
Assignee
SLA
Age
Updated
Actions
```

Need backend filters/pagination.

## 16.3 SUP-03 — Support Case Workbench

Layout:

```text
Case Header
Conversation
Details
Assignments
SLA
Effort
Links
Knowledge
History
```

Comments visibility:

```text
Internal
Portal-visible
```

Composer phải cho thấy visibility trước khi post.

Triage: owner, queue, SLA policy, priority, type, portal visibility.

Resolve/close request schemas cần rõ.

## 16.4 SUP-04 — Incident & Problem Center

Incident workbench:

- Summary.
- Impact.
- Timeline.
- Linked cases.
- Linked problem.
- Deployment/maintenance.
- Acknowledge/resolve/close.

Problem:

- Root cause.
- Known error.
- Workaround.
- Linked incidents/cases.
- Resolve/close.

## 16.5 SUP-05 — Maintenance Center

Tabs:

```text
Plans
Windows
Activities
Calendar
```

Current schemas/lifecycle còn thiếu; initial UI chỉ list/create.

## 16.6 SUP-06 — Support Configuration

Settings sections:

```text
Queues
Request Types
SLA Policies
SLA Targets
Escalation Rules
Service Profiles
Warranties
Maintenance Defaults
```

SLA builder cần relationship giữa policy, target, calendar, priority và request type.

## 16.7 SUP-07 — Handover & Knowledge

Handover package items:

- Documents.
- Runbooks.
- Architecture.
- Known issues.
- Contacts.
- Warranty.
- SLA.
- Training.

Knowledge/work links dùng Entity Reference Picker.

---

# 17. Shared Components

## 17.1 ScopeSwitcher

Used by Document Hub, Search, AI, Reports, Activity.

## 17.2 EntityReferencePicker

Returns type, ID, code, title, status, scope, classification. Không nhập UUID.

## 17.3 LongRunningJobPanel

Used by generation, indexing, reports, exports, AI, import/sync, privacy/anonymization/retention.

Normalized states:

```text
QUEUED PENDING RUNNING PROCESSING COMPLETED FAILED CANCELLED
```

## 17.4 SseMessageStream

- Connect/reconnect/cancel.
- Sequence handling.
- Safe markdown.
- Final reconciliation.
- Error/trace.

## 17.5 PresignedFileTransfer

- Upload/download.
- Progress/expiry/retry/cancel.
- Security cleanup.

## 17.6 LifecycleTimeline

Used by document, quality plan, test run, defect, release, deployment, requirement, privacy request, support case, incident, AI suggestion.

## 17.7 GovernedObjectBadge

Shows owner, locked, finalized, baseline guard, restricted access, version.

## 17.8 BeforeAfterDiff

Typed field diff with advanced JSON tab.

## 17.9 ClassificationBadge and MaskedValue

Text + icon, never color only; masked value never rendered as `0`.

## 17.10 PermissionAwareAction

```text
Allowed
Disabled with reason
Hidden
Requires elevated access
Requires re-authentication
```

## 17.11 JobResultSummary

Total, success, warning, failed, skipped, retry/download errors.

## 17.12 ClientVisibilityToggle

Explains exactly what external client will see.

---

# 18. API Client Architecture

## 18.1 Clients

```text
InternalApiClient
PortalApiClient
KnowledgeApiClient
SseClient
ObjectStorageTransferClient
```

## 18.2 Session separation

Internal and portal interceptors/cache must be separate.

## 18.3 Knowledge headers

Inject trusted:

```text
X-Workspace-Id
X-Actor-Id
X-Acl-Tokens
```

## 18.4 SSE

Cookie auth phù hợp với EventSource. Nếu cần custom headers, dùng fetch streaming.

Recommended event types:

```text
message.started
message.delta
message.citation
message.completed
message.error
heartbeat
```

## 18.5 Binary vs Presigned

- Report download = authenticated binary.
- Document download = presigned URL.
- Cả hai cần audit/permission phù hợp.

---

# 19. Cache and Invalidation

## 19.1 Key groups

```text
documents(scope, filters)
document(projectId, documentId)
documentVersions(projectId, documentId)
knowledgeSearch(workspaceId, projectId, query, aclHash)
eventDefinitions(filters)
governancePack(projectId)
qualityDashboard(projectId)
testPlans(projectId)
testCases(projectId, filters)
testRuns(projectId)
defects(projectId, filters)
releases(projectId)
deployments(projectId)
projectDashboard(projectId)
reportDefinitions()
reportRun(runId)
aiConversations(scope)
aiMessages(conversationId)
aiPlanningRuns(projectId)
aiRecommendations(projectId, filters)
portalProjects()
portalReviews(projectId)
workInbox(workspaceId, filters)
favorites(workspaceId)
integrationDashboard(workspaceId)
connections(workspaceId)
importJobs(workspaceId)
syncJobs(workspaceId)
syncConflicts(workspaceId)
requirements(projectId, filters)
coverageMatrix(projectId)
applications(workspaceId)
trustDashboard(workspaceId)
privacyRequests(workspaceId)
retentionPolicies(workspaceId)
supportDashboard(workspaceId)
supportCases(workspaceId, filters)
```

Sensitive/ACL-specific queries dùng isolated non-persistent cache hoặc permission hash.

## 19.2 Important invalidation

- Document upload/approve/share → document, list, version, search/index status, activity, portal share.
- Governance action → object editability, inspector, center, reports, guard state.
- Test result → run, quality dashboard, reports, coverage, release readiness.
- Defect transition → defect, dashboard, release readiness, inbox, notifications.
- Release/deployment → release, readiness, deployment, dashboard, portal state.
- AI apply → invalidate all domains returned in apply result.
- Integration sync → run, conflicts, dashboard, changed entity queries, search indexes.
- Trust/privacy → request, dashboard, subject, package, retention/hold conflicts, audits.
- Support → case, queue, dashboard, SLA, portal list, inbox, notifications.

---

# 20. Optimistic UI Rules

## Allowed

- Rename AI conversation with rollback.
- Favorite/unfavorite.
- Pin/unpin.
- Mark inbox read.
- Local table/navigation preference.
- Draft form editing.
- Local reorder before save.

## Not allowed

- Document approve/upload complete/share revoke.
- Governance lock/finalize/restore.
- Quality approve.
- Test run/defect/release/deployment lifecycle.
- Report execution/export.
- AI suggestion apply.
- Portal grants.
- Import execute/sync resolve/webhook retry.
- Privacy complete/anonymization execute/legal hold release.
- Access review complete/evidence finalize.
- Support resolve/close/incident resolve/cost approval.

---

# 21. Contract Gap Matrix

| Severity | Gap | UI Impact | Recommendation |
|---|---|---|---|
| Critical | Document APIs mới rõ project scope | Document Hub org/workspace/personal chưa đủ | Add scoped document endpoints |
| Critical | Document update/archive/move missing | Không maintain metadata/folder | Add update/archive/move |
| Critical | AI citations/sources absent | Không kiểm chứng answer | Add citation DTO/SSE events |
| Critical | AI suggestion payload chưa typed | Apply khó review/an toàn | Typed actions and diff |
| Critical | Portal review decision endpoint missing | Client không quyết định được | Add portal decision |
| Critical | Portal UAT execution missing | Không hoàn tất UAT | Add assignment/result/evidence APIs |
| Critical | Portal support detail/comments missing | Support portal chưa usable | Add detail/comment/timeline |
| Critical | Governance snapshots dynamic JSON | Diff/restore type safety thấp | Typed snapshot schemas |
| Critical | Quality reports dynamic Map | Dashboard không ổn định | Typed report DTOs |
| Critical | Privacy export thiếu detail/download | Không giao package | Add secure package endpoints |
| Critical | Anonymization/legal hold conflict unclear | Compliance risk | Policy validation engine |
| Critical | Inbound webhook security unspecified | Security risk | Signature/replay/rate-limit contract |
| High | Folder update/move absent | Folder UX hạn chế | Add rename/move |
| High | Test suite/case/step update/reorder absent | Authoring yếu | Add update/reorder |
| High | Test result attempt/evidence unclear | Retest/audit yếu | Add attempt model |
| High | Release readiness response untyped | Checklist không chắc chắn | Typed readiness DTO |
| High | Deployment/rollback schemas incomplete | Workbench khó build | Publish DTOs |
| High | Event usage endpoint absent | Deprecation impact mù | Add consumers/usage |
| High | Portal account list/search absent | Admin không quản lý được | Add list/search |
| High | Invite resend/revoke absent | Invite flow thiếu | Add resend/revoke |
| High | Permission policy schema absent | Access UI không type-safe | Capability matrix DTO |
| High | Import/mapping schemas incomplete | Mapping builder blocked | Publish typed contracts |
| High | Credential secretReference UX insecure | Secret onboarding kém | Secure vault flow |
| High | Sync scheduling fields absent | Không recurring sync | Add schedule/cadence |
| High | Report field/filter schema absent | Dynamic runner khó | Typed metadata |
| High | Requirement criteria/source CRUD thiếu | Không maintain được | Add CRUD/lifecycle |
| High | Application registry update/archive thiếu | Chỉ create/read | Add maintenance APIs |
| High | Trust DTOs incomplete | Compliance UI bất ổn | Publish typed schemas |
| High | Access review decisions absent | Campaign không review được | Add items/decisions |
| High | Support filters/pagination absent | Không scale | Standard list contract |
| High | Long-running endpoints không thống nhất | Job UX phân mảnh | Unified JobStatus |
| Medium | Search result DTO chưa mô tả | Rendering uncertain | Typed search result |
| Medium | Saved view schemas absent | Personalization khó | Versioned config DTO |
| Medium | Work Inbox thiếu snooze/dismiss | Inbox tích tụ | Add snooze/dismiss |
| Medium | Knowledge graph chỉ related endpoint | Explorer hạn chế | Add node search/detail/path |
| Medium | Generated document process giống worker | FE boundary mơ hồ | Add user start endpoint |
| Medium | Portal auth token/cookie note mâu thuẫn | Auth ambiguity | Standardize auth |
| Medium | Webhook delivery record exposed | Internal op trong FE contract | Restrict service-only |
| Medium | Retention execute không rõ | Enforcement mơ hồ | Clarify scheduler/execute |
| Medium | Legal hold target schema absent | Không review scope | Typed hold targets |
| Medium | Evidence attachment APIs absent | Evidence incomplete | Add document/link APIs |
| Medium | Support case GET detail chưa thấy | Direct route blocked | Add GET case detail |
| Low | Bulk actions thiếu | High-volume work chậm | Add batch APIs |
| Low | Usage counts thiếu | Archive decision unsafe | Add usage summaries |

---

# 22. Recommended Backend Additions

## 22.1 Unified Job Contract

```json
{
  "jobId": "uuid",
  "jobType": "KNOWLEDGE_REINDEX",
  "status": "RUNNING",
  "progressPercent": 42,
  "processedCount": 420,
  "successCount": 410,
  "warningCount": 5,
  "failureCount": 5,
  "startedAt": "...",
  "completedAt": null,
  "errorCode": null,
  "errorMessage": null,
  "traceId": "..."
}
```

## 22.2 Scoped Document API

```text
GET/POST /organizations/{organizationId}/documents
GET/POST /workspaces/{workspaceId}/documents
GET/POST /projects/{projectId}/documents
GET/POST /me/documents
```

## 22.3 AI Citation and Tool Events

```text
turn.started
content.delta
citation.added
tool.started
tool.completed
warning
turn.completed
turn.error
heartbeat
```

## 22.4 Portal-safe DTOs

Dedicated DTOs cho project overview, meeting, document, review, UAT, form, support case.

## 22.5 Quality aggregates

```text
GET /quality/overview
GET /test-cases/{id}/execution-history
GET /releases/{id}/readiness
GET /defects/metrics
```

## 22.6 Traceability aggregates

```text
GET /traceability/matrix
GET /requirements/{id}/coverage-summary
GET /traceability/gaps
```

## 22.7 Governance aggregates

```text
GET /governance/objects
GET /governance/objects/{type}/{id}/summary
GET /governance/objects/{type}/{id}/history
```

## 22.8 Trust preview/readiness

```text
POST /anonymization-plans/{id}/validate
POST /privacy-requests/{id}/readiness
POST /legal-holds/{id}/impact
```

## 22.9 Support case detail

```text
GET /support/cases/{caseId}
GET /support/cases/{caseId}/summary
GET /support/cases/{caseId}/activity
```

---

# 23. Implementation Order

## P0 — Shared Infrastructure

1. Internal/Portal API client separation.
2. SSE client.
3. Presigned transfer.
4. Unified job UI.
5. Entity Reference Picker.
6. Classification/masking.
7. Governed Object Inspector.
8. Lifecycle Timeline.
9. Before/After Diff.
10. Permission-aware action.
11. Client visibility control.
12. Sensitive/ACL cache isolation.

## P1 — Productivity and Document Foundation

1. Global Search.
2. Command Palette.
3. Work Inbox.
4. Favorites/Recent/Saved Views.
5. Document Hub.
6. Upload/version.
7. Viewer.
8. Folders/shares.
9. Templates.
10. Generated jobs.

## P2 — Knowledge and AI Assistant

1. Document Types.
2. Custom fields.
3. Knowledge indexing.
4. Semantic retrieval.
5. Knowledge graph.
6. AI conversations/messages.
7. Guides/feedback.
8. Citations when contract ready.

## P3 — Governance and Reporting

1. Policies.
2. Ownership.
3. Locks/finalization.
4. Access grants.
5. Versions/snapshots.
6. Restore/guard.
7. Project Dashboard.
8. Reports/exports.
9. Governance reports.

## P4 — Requirements and Quality

1. Requirements.
2. Trace links/matrix.
3. Quality Plan.
4. Test Management.
5. Test Run.
6. Defects.
7. Releases.
8. Deployment.

## P5 — AI Planning and Recommendations

1. Runs.
2. Suggestion review.
3. Item decisions.
4. Apply preview.
5. Change Request integration.
6. Recommendation feed.
7. Entity suggestions.
8. Next best actions.

## P6 — Client Collaboration and Portal

1. Accounts/invites/grants.
2. Policies.
3. Reviews/comments/feedback.
4. Portal auth/shell.
5. Meetings/forms/support.
6. UAT after backend completion.
7. Portal audit.

## P7 — Integration Hub

1. Providers/credentials/connections.
2. Health checks.
3. Imports/exports.
4. Sync/conflicts.
5. Webhooks.
6. Mappings/observability.

## P8 — Trust & Compliance

1. Dashboard/classification.
2. Sensitive registry/audit.
3. Data subjects/privacy requests.
4. Export packages.
5. Consent/suppressions.
6. Anonymization.
7. Retention/legal hold.
8. Access reviews/evidence.

## P9 — Service Support

1. Dashboard/case center.
2. Case workbench.
3. SLA/queues/types.
4. Incidents/problems.
5. Maintenance.
6. Escalation/warranty.
7. Service profiles/costs.
8. Handover/knowledge.
9. Portal support integration.

---

# 24. Definition of Done

Một màn hình Wave 4 chỉ hoàn thành khi:

- **Endpoint Coverage Register có đủ 100% endpoint được gán cho page/action hoặc ngoại lệ hợp lệ.**
- **Tất cả endpoint user-facing của màn hình đạt `UI_TESTED`, không chỉ `UI_IMPLEMENTED`.**
- **Không còn endpoint `UNMAPPED`, `MOCK_ONLY`, `TODO` hoặc chỉ nối nút chưa gọi API thật.**
- **Không còn `CONTRACT_BLOCKED` thuộc phạm vi bắt buộc.**
- **Module và Wave không được hoàn thành nếu còn endpoint user-facing chưa test.**

- Có route/navigation placement.
- Có internal/portal boundary rõ.
- Có capability mapping.
- Có classification/masking.
- Có loading, empty, error, forbidden, stale state.
- Có long-running/retry/cancel nếu cần.
- Có trace ID.
- Có cache/invalidation.
- Có concurrency/idempotency.
- Có lifecycle mapping.
- Có immutable/finalized behavior.
- Có Entity Reference Picker.
- Không nhập UUID.
- Không dùng raw JSON làm primary UI.
- Không dùng dynamic map chưa typed cho production dashboard.
- Không optimistic update action nguy hiểm.
- Không leak presigned URL hoặc ACL token.
- Không cache sensitive data chung.
- Không reuse internal DTO trực tiếp cho portal.
- Có responsive/client-safe UI nếu portal feature.
- Có keyboard navigation/reduced motion.
- Có happy path, permission-denied, invalid transition, retry/failure tests.
- Có SSE reconnect/cancel test nếu AI.
- Có upload expiry/failure test nếu document.
- Có client visibility và masking/export audit tests.
- Có feature flag cho contract chưa đủ.
- Không gọi worker/service-only endpoint từ UI.
- Không apply AI suggestion thiếu review/permission/baseline guard.
- Không anonymize/retain khi chưa check legal hold.

---

# 25. Final Navigation Snapshot

## Common

```text
Search
Document Hub
Notifications
AI Assistant
Work Inbox
```

## Workspace

```text
Overview
Activity
Projects
Capacity
Clients & Contacts
Applications
Support
Forms
Directory
```

## Project

```text
Overview

PLAN
Work Items
WBS
Timeline
Schedule
Resources

SCOPE & REQUIREMENTS
Scope
Deliverables
Requirements
Traceability

QUALITY
Quality
Defects
Releases

COMMERCIAL
Estimation
Financials
Quotes

CONTROL
Baselines
Change Requests
Governance

COLLABORATION
Meetings
Client Collaboration

INTELLIGENCE
AI Planning
Recommendations
Reports
```

## Settings

```text
Personal
Knowledge & Documents
Governance
Event Registry
Notifications
Client Portal
Integrations
Trust & Compliance
Service Support
```

## Client Portal

```text
Overview
Reviews
Meetings
Forms
Comments
Feedback
Support
```

---

# 26. Source Contract Coverage

Tài liệu bao phủ toàn bộ 16 module Wave 4:

1. Document Hub.
2. Knowledge.
3. Event Registry.
4. Governance.
5. Quality.
6. Reporting.
7. AI Assistant.
8. AI Planning.
9. AI Recommendation.
10. Client Portal.
11. Project Notification.
12. Productivity.
13. Integration Hub.
14. Traceability.
15. Trust & Compliance.
16. Service Support.

Mỗi controller được ánh xạ vào hub, workbench, detail inspector, settings section hoặc background operation phù hợp; không mặc định trở thành một trang riêng.

---

# 27. Endpoint-to-UI Coverage Register

> Register này được sinh trực tiếp từ `WAVE4_API_CONTRACT.md`.

- Endpoint rows extracted: **552**.
- Contract appendix ghi xấp xỉ 559 endpoints; mọi chênh lệch phải được reconciliation trước khi Wave DONE.
- Trạng thái ban đầu là `MAPPED — implementation pending`; dev phải cập nhật thành `UI_TESTED` hoặc ngoại lệ hợp lệ.

## 27.1 Completion formula

```text
Wave4Done =
  contractEndpointCount == registerEndpointCount
  AND unmapped == 0
  AND userFacingNotTested == 0
  AND unapprovedExceptions == 0
  AND requiredContractBlockers == 0
```

## 27.2 Full Register

| # | Module | Controller / Area | Method | Contract Path | Purpose | UI Page / Workbench | UI Binding | Component / Action | Class | Initial Status | Required Before DONE | Test Evidence | Gap / Exception |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | DocumentHub | Documents | `POST` | `/api/v1/projects/{projectId}/documents` | Tạo document | DOC-01 / DOC-02 | Document Hub list, viewer and actions | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 2 | DocumentHub | Documents | `GET` | `/api/v1/projects/{projectId}/documents` | Danh sách | DOC-01 / DOC-02 | Document Hub list, viewer and actions | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 3 | DocumentHub | Documents | `GET` | `/api/v1/projects/{projectId}/documents/search?q=` | Full-text search (trả masked snippets) | DOC-01 / DOC-02 | Document Hub list, viewer and actions | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 4 | DocumentHub | Documents | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}` | Lấy theo ID | DOC-01 / DOC-02 | Document Hub list, viewer and actions | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 5 | DocumentHub | Documents | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/masked` | Lấy với sensitive fields bị mask | DOC-01 / DOC-02 | Document Hub list, viewer and actions | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 6 | DocumentHub | Documents | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/approve` | Phê duyệt | DOC-01 / DOC-02 | Document Hub list, viewer and actions | Lifecycle action + confirmation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 7 | DocumentHub | Document Versions | `POST` | `.../versions` | Upload trực tiếp (legacy — dùng storageKey) | DOC-02 / DOC-03 | Document versions, presigned transfer and version actions | Command/action mutation | `LEGACY_COMPATIBILITY` | MAPPED — exception evidence required | Approved exception + integration test | TODO | TODO if applicable |
| 8 | DocumentHub | Document Versions | `POST` | `.../versions/presigned-upload` | Lấy presigned URL để upload thẳng lên storage | DOC-02 / DOC-03 | Document versions, presigned transfer and version actions | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 9 | DocumentHub | Document Versions | `POST` | `.../versions/{versionId}/complete-upload` | Xác nhận upload hoàn tất | DOC-02 / DOC-03 | Document versions, presigned transfer and version actions | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 10 | DocumentHub | Document Versions | `POST` | `.../versions/{versionId}/presigned-download` | Lấy presigned URL để download | DOC-02 / DOC-03 | Document versions, presigned transfer and version actions | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 11 | DocumentHub | Document Versions | `GET` | `.../versions` | Danh sách versions | DOC-02 / DOC-03 | Document versions, presigned transfer and version actions | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 12 | DocumentHub | Document Versions | `GET` | `.../versions/{versionId}` | Lấy metadata theo ID | DOC-02 / DOC-03 | Document versions, presigned transfer and version actions | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 13 | DocumentHub | Document Folders | `POST` | `.../document-folders` | Tạo folder | DOC-01 | Folder tree and folder actions | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 14 | DocumentHub | Document Folders | `GET` | `.../document-folders` | Danh sách | DOC-01 | Folder tree and folder actions | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 15 | DocumentHub | Document Folders | `GET` | `.../document-folders/{folderId}` | Lấy theo ID | DOC-01 | Folder tree and folder actions | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 16 | DocumentHub | Document Folders | `PATCH` | `.../document-folders/{folderId}/archive` | Lưu trữ | DOC-01 | Folder tree and folder actions | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 17 | DocumentHub | Document Shares | `POST` | `.../shares` | Tạo share token/grant | DOC-02 | Shares tab and revoke/share actions | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 18 | DocumentHub | Document Shares | `GET` | `.../shares` | Danh sách | DOC-02 | Shares tab and revoke/share actions | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 19 | DocumentHub | Document Shares | `POST` | `.../shares/{shareId}/revoke` | Thu hồi | DOC-02 | Shares tab and revoke/share actions | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 20 | DocumentHub | Document Templates | `POST` | `.../document-templates` | Tạo template | Settings → Knowledge & Documents | Document template library/detail | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 21 | DocumentHub | Document Templates | `GET` | `.../document-templates` | Danh sách | Settings → Knowledge & Documents | Document template library/detail | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 22 | DocumentHub | Document Templates | `GET` | `.../document-templates/{templateId}` | Lấy theo ID | Settings → Knowledge & Documents | Document template library/detail | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 23 | DocumentHub | Generated Document Jobs | `POST` | `.../generated-documents` | Queue generation job | DOC-04 | Generated document jobs | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 24 | DocumentHub | Generated Document Jobs | `GET` | `.../generated-documents` | Danh sách jobs | DOC-04 | Generated document jobs | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 25 | DocumentHub | Generated Document Jobs | `GET` | `.../generated-documents/{jobId}` | Lấy theo ID | DOC-04 | Generated document jobs | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 26 | DocumentHub | Generated Document Jobs | `POST` | `.../generated-documents/{jobId}/process` | Claim + render template + store (body: `variables: Map`) | DOC-04 | Generated document jobs | Command/action mutation | `SERVICE_ORCHESTRATED` | MAPPED — exception evidence required | Approved exception + integration test | TODO | TODO if applicable |
| 27 | DocumentHub | Generated Document Jobs | `POST` | `.../generated-documents/{jobId}/complete` | Mark completed (body: `outputDocumentId`) | DOC-04 | Generated document jobs | Lifecycle action + confirmation | `SERVICE_ORCHESTRATED` | MAPPED — exception evidence required | Approved exception + integration test | TODO | TODO if applicable |
| 28 | Knowledge | Document Types | `POST` | `/api/v1/knowledge/document-types` | Tạo document type | KNW-01 / KNW-02 | Document Type Library/Builder | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 29 | Knowledge | Document Types | `POST` | `/api/v1/knowledge/document-types/system` | Tạo system-level document type | KNW-01 / KNW-02 | Document Type Library/Builder | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 30 | Knowledge | Document Types | `POST` | `/api/v1/knowledge/document-types/workspace` | Tạo workspace-level document type | KNW-01 / KNW-02 | Document Type Library/Builder | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 31 | Knowledge | Document Types | `GET` | `/api/v1/knowledge/document-types?keyword=&organizationId=&workspaceId=&documentScope=&status=&builtIn=&includeArchived=&page=&size=` | Tìm kiếm (paginated) | KNW-01 / KNW-02 | Document Type Library/Builder | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 32 | Knowledge | Document Types | `GET` | `/api/v1/knowledge/document-types/{id}` | Lấy theo ID | KNW-01 / KNW-02 | Document Type Library/Builder | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 33 | Knowledge | Document Types | `PUT` | `/api/v1/knowledge/document-types/{id}` | Cập nhật | KNW-01 / KNW-02 | Document Type Library/Builder | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 34 | Knowledge | Document Types | `PATCH` | `/api/v1/knowledge/document-types/{id}/activate` | Kích hoạt | KNW-01 / KNW-02 | Document Type Library/Builder | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 35 | Knowledge | Document Types | `PATCH` | `/api/v1/knowledge/document-types/{id}/deactivate` | Vô hiệu hoá | KNW-01 / KNW-02 | Document Type Library/Builder | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 36 | Knowledge | Document Types | `PATCH` | `/api/v1/knowledge/document-types/{id}/archive` | Lưu trữ | KNW-01 / KNW-02 | Document Type Library/Builder | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 37 | Knowledge | Document Types | `PATCH` | `/api/v1/knowledge/document-types/{id}/soft-delete` | Xoá mềm | KNW-01 / KNW-02 | Document Type Library/Builder | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 38 | Knowledge | Document Type Fields | `POST` | `.../fields` | Thêm custom field | KNW-02 | Document Type Builder fields | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 39 | Knowledge | Document Type Fields | `GET` | `.../fields` | Danh sách | KNW-02 | Document Type Builder fields | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 40 | Knowledge | Document Type Fields | `GET` | `.../fields/{fieldId}` | Lấy theo ID | KNW-02 | Document Type Builder fields | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 41 | Knowledge | Document Type Fields | `PUT` | `.../fields/{fieldId}` | Cập nhật | KNW-02 | Document Type Builder fields | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 42 | Knowledge | Document Type Fields | `PUT` | `.../fields/reorder` | Sắp xếp lại (body: `orderedFieldIds: [uuid...]`) | KNW-02 | Document Type Builder fields | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 43 | Knowledge | Document Type Fields | `PATCH` | `.../fields/{fieldId}/activate` | Kích hoạt | KNW-02 | Document Type Builder fields | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 44 | Knowledge | Document Type Fields | `PATCH` | `.../fields/{fieldId}/deactivate` | Vô hiệu hoá | KNW-02 | Document Type Builder fields | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 45 | Knowledge | Document Type Fields | `PATCH` | `.../fields/{fieldId}/archive` | Lưu trữ | KNW-02 | Document Type Builder fields | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 46 | Knowledge | Document Classifications | `GET` | `/api/v1/knowledge/document-classifications` | Danh sách tất cả classifications | KNW-01 / TRU-02 | Classification selectors | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 47 | Knowledge | Knowledge Graph | `GET` | `/api/v1/knowledge/graph/nodes/{nodeId}/related?depth=1&limit=20` | Lấy related nodes (requires `X-Acl-Tokens` header) | KNW-04 | Knowledge Graph Explorer | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 48 | Knowledge | Knowledge Sources | `GET` | `/api/v1/knowledge/sources/{sourceId}` | Lấy source metadata | DOC-02 / KNW-03 | Knowledge source inspector | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 49 | Knowledge | Knowledge Sources | `GET` | `/api/v1/knowledge/sources/{sourceId}/chunks?page=&size=` | Lấy chunks (paginated) | DOC-02 / KNW-03 | Knowledge source inspector | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 50 | Knowledge | Knowledge Sources | `POST` | `/api/v1/knowledge/sources/{sourceId}/reindex` | Reindex source (header: `X-Actor-Id`) | DOC-02 / KNW-03 | Knowledge source inspector | Long-running action + status panel | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 51 | Knowledge | Knowledge Indexing | `POST` | `/api/v1/knowledge/indexing/projects/{projectId}/reindex` | Reindex toàn project (header: `X-Workspace-Id`) | KNW-03 | Knowledge Indexing Center | Long-running action + status panel | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 52 | Knowledge | Knowledge Indexing | `POST` | `/api/v1/knowledge/indexing/workspaces/{workspaceId}/reindex` | Reindex toàn workspace | KNW-03 | Knowledge Indexing Center | Long-running action + status panel | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 53 | Knowledge | Knowledge Indexing | `GET` | `/api/v1/knowledge/indexing/jobs/{jobId}` | Lấy job status | KNW-03 | Knowledge Indexing Center | Status/summary query → dashboard or job panel | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 54 | Knowledge | Knowledge Retrieval | `POST` | `/api/v1/knowledge/retrieval/search` | Semantic search (headers: `X-Workspace-Id`, `X-Actor-Id`, `X-Acl-Tokens`) | DOC-01 / AI-01 | Semantic search and AI retrieval | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 55 | EventRegistry | EventRegistry | `POST` | `/api/v1/event-definitions` | Tạo event definition | EVT-01 / EVT-02 | Event Registry and definition detail | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 56 | EventRegistry | EventRegistry | `PUT` | `/api/v1/event-definitions/{id}` | Cập nhật | EVT-01 / EVT-02 | Event Registry and definition detail | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 57 | EventRegistry | EventRegistry | `GET` | `/api/v1/event-definitions/{id}` | Lấy chi tiết | EVT-01 / EVT-02 | Event Registry and definition detail | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 58 | EventRegistry | EventRegistry | `GET` | `/api/v1/event-definitions?keyword=&sourceSystem=&eventKey=&status=&page=&size=` | Tìm kiếm | EVT-01 / EVT-02 | Event Registry and definition detail | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 59 | EventRegistry | EventRegistry | `PATCH` | `/api/v1/event-definitions/{id}/activate` | Kích hoạt | EVT-01 / EVT-02 | Event Registry and definition detail | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 60 | EventRegistry | EventRegistry | `PATCH` | `/api/v1/event-definitions/{id}/deactivate` | Vô hiệu hoá | EVT-01 / EVT-02 | Event Registry and definition detail | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 61 | EventRegistry | EventRegistry | `PATCH` | `/api/v1/event-definitions/{id}/deprecate` | Deprecated (body: `replacementEventDefinitionId`, `reason`) | EVT-01 / EVT-02 | Event Registry and definition detail | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 62 | EventRegistry | EventRegistry | `PUT` | `/api/v1/event-definitions/{id}/variables` | Upsert toàn bộ variables | EVT-01 / EVT-02 | Event Registry and definition detail | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 63 | EventRegistry | EventRegistry | `GET` | `/api/v1/event-definitions/{id}/variables` | Danh sách variables | EVT-01 / EVT-02 | Event Registry and definition detail | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 64 | Governance | Governed Object Types (catalog) | `GET` | `/api/v1/governance/object-types` | Danh sách loại object có thể govern | GOV-01 / GOV-02 | Governance Center/Inspector | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 65 | Governance | Governed Object Types (catalog) | `GET` | `/api/v1/governance/object-types/{objectTypeCode}` | Lấy theo code | GOV-01 / GOV-02 | Governance Center/Inspector | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 66 | Governance | Governance Policy (workspace-level) | `GET` | `.../governance/policies` | Danh sách policies | GOV-03 | Governance policy matrix/editor | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 67 | Governance | Governance Policy (workspace-level) | `PUT` | `.../governance/policies` | Upsert policy | GOV-03 | Governance policy matrix/editor | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 68 | Governance | Ownership | `POST` | `.../governance/ownership/assign` | Gán owner | GOV-01 / GOV-02 | Ownership table/inspector | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 69 | Governance | Ownership | `POST` | `.../governance/ownership/transfer` | Chuyển owner | GOV-01 / GOV-02 | Ownership table/inspector | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 70 | Governance | Ownership | `POST` | `.../governance/ownership/revoke` | Thu hồi (`?objectTypeCode=&targetId=`) | GOV-01 / GOV-02 | Ownership table/inspector | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 71 | Governance | Ownership | `GET` | `.../governance/ownership?objectTypeCode=&targetId=` | Lấy ownership hiện tại | GOV-01 / GOV-02 | Ownership table/inspector | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 72 | Governance | Ownership | `GET` | `.../governance/ownership/list` | Danh sách tất cả ownership trong project | GOV-01 / GOV-02 | Ownership table/inspector | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 73 | Governance | Locks & Finalization | `POST` | `.../governance/locks` | Tạo lock thủ công | GOV-01 / GOV-02 | Lock/finalization actions | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 74 | Governance | Locks & Finalization | `POST` | `.../governance/locks/{lockId}/release` | Mở lock | GOV-01 / GOV-02 | Lock/finalization actions | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 75 | Governance | Locks & Finalization | `POST` | `.../governance/locks/{objectTypeCode}/{targetId}/finalize` | Finalize object (body: `reason`) | GOV-01 / GOV-02 | Lock/finalization actions | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 76 | Governance | Locks & Finalization | `POST` | `.../governance/locks/{objectTypeCode}/{targetId}/unfinalize` | Unfinalize | GOV-01 / GOV-02 | Lock/finalization actions | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 77 | Governance | Access Grants | `POST` | `.../access-grants` | Cấp quyền truy cập object | GOV-01 / GOV-02 | Object access grants | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 78 | Governance | Access Grants | `GET` | `.../access-grants?objectTypeCode=&targetId=` | Danh sách | GOV-01 / GOV-02 | Object access grants | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 79 | Governance | Access Grants | `POST` | `.../access-grants/{grantId}/revoke` | Thu hồi | GOV-01 / GOV-02 | Object access grants | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 80 | Governance | Versioning & Snapshots | `POST` | `.../governance/versions` | Tạo version snapshot | GOV-02 | Version/snapshot/diff/restore | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 81 | Governance | Versioning & Snapshots | `GET` | `.../governance/versions?objectTypeCode=&targetId=` | Danh sách versions | GOV-02 | Version/snapshot/diff/restore | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 82 | Governance | Versioning & Snapshots | `GET` | `.../governance/snapshots/{snapshotId}` | Lấy snapshot JSON | GOV-02 | Version/snapshot/diff/restore | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 83 | Governance | Versioning & Snapshots | `GET` | `.../governance/snapshots/diff?leftSnapshotId=&rightSnapshotId=` | So sánh 2 snapshots | GOV-02 | Version/snapshot/diff/restore | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 84 | Governance | Versioning & Snapshots | `POST` | `.../governance/restore` | Khôi phục từ version | GOV-02 | Version/snapshot/diff/restore | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 85 | Governance | Versioning & Snapshots | `POST` | `.../governance/baseline-guard/check` | Kiểm tra có được phép thay đổi không | GOV-02 | Version/snapshot/diff/restore | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 86 | Governance | Governance Reports | `GET` | `.../reports/pack` | Report tổng hợp (ownership + locks + access grants) | GOV-04 | Governance reports | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 87 | Governance | Governance Reports | `GET` | `.../reports/ownership` | Ownership report | GOV-01 / GOV-02 | Ownership table/inspector | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 88 | Governance | Governance Reports | `GET` | `.../reports/access-grants` | Access grant report | GOV-01 / GOV-02 | Object access grants | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 89 | Governance | Governance Reports | `GET` | `.../reports/version-history` | Version history report | GOV-02 | Version/snapshot/diff/restore | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 90 | Governance | Governance Reports | `GET` | `.../reports/locked-objects` | Locked objects report | GOV-04 | Governance reports | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 91 | Governance | Governance Reports | `GET` | `.../reports/restore-activity` | Restore activity report | GOV-04 | Governance reports | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 92 | Quality | Quality Plan | `POST` | `.../quality-plans` | Tạo quality plan | QLT-01 / QLT-02 | Quality plan register/detail | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 93 | Quality | Quality Plan | `GET` | `.../quality-plans` | Danh sách | QLT-01 / QLT-02 | Quality plan register/detail | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 94 | Quality | Quality Plan | `GET` | `.../quality-plans/{qualityPlanId}` | Lấy theo ID | QLT-01 / QLT-02 | Quality plan register/detail | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 95 | Quality | Quality Plan | `PUT` | `.../quality-plans/{qualityPlanId}` | Cập nhật | QLT-01 / QLT-02 | Quality plan register/detail | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 96 | Quality | Quality Plan | `POST` | `.../quality-plans/{qualityPlanId}/approve` | Phê duyệt | QLT-01 / QLT-02 | Quality plan register/detail | Lifecycle action + confirmation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 97 | Quality | Quality Plan | `POST` | `.../quality-plans/{qualityPlanId}/mark-current` | Đặt làm current | QLT-01 / QLT-02 | Quality plan register/detail | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 98 | Quality | Quality Plan | `PATCH` | `.../quality-plans/{qualityPlanId}/archive` | Lưu trữ | QLT-01 / QLT-02 | Quality plan register/detail | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 99 | Quality | Test Plans & Suites | `POST` | `.../test-plans` | Tạo test plan | QLT-03 | Test Management | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 100 | Quality | Test Plans & Suites | `GET` | `.../test-plans` | Danh sách | QLT-03 | Test Management | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 101 | Quality | Test Plans & Suites | `GET` | `.../test-plans/{testPlanId}` | Lấy theo ID | QLT-03 | Test Management | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 102 | Quality | Test Plans & Suites | `POST` | `.../test-plans/{testPlanId}/approve` | Phê duyệt | QLT-03 | Test Management | Lifecycle action + confirmation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 103 | Quality | Test Plans & Suites | `PATCH` | `.../test-plans/{testPlanId}/archive` | Lưu trữ | QLT-03 | Test Management | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 104 | Quality | Test Plans & Suites | `POST` | `.../suites` | Tạo suite | QLT-03 | Test Management | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 105 | Quality | Test Plans & Suites | `GET` | `.../suites` | Danh sách | QLT-03 | Test Management | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 106 | Quality | Test Plans & Suites | `GET` | `.../suites/{suiteId}` | Lấy theo ID | QLT-03 | Test Management | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 107 | Quality | Test Plans & Suites | `PATCH` | `.../suites/{suiteId}/archive` | Lưu trữ | QLT-03 | Test Management | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 108 | Quality | Test Cases & Steps | `POST` | `.../test-cases` | Tạo test case | QLT-03 / QLT-04 | Test case register/workbench | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 109 | Quality | Test Cases & Steps | `GET` | `.../test-cases` | Danh sách | QLT-03 / QLT-04 | Test case register/workbench | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 110 | Quality | Test Cases & Steps | `GET` | `.../test-cases/{testCaseId}` | Lấy theo ID | QLT-03 / QLT-04 | Test case register/workbench | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 111 | Quality | Test Cases & Steps | `POST` | `.../test-cases/{testCaseId}/approve` | Phê duyệt | QLT-03 / QLT-04 | Test case register/workbench | Lifecycle action + confirmation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 112 | Quality | Test Cases & Steps | `PATCH` | `.../test-cases/{testCaseId}/archive` | Lưu trữ | QLT-03 / QLT-04 | Test case register/workbench | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 113 | Quality | Test Cases & Steps | `POST` | `.../steps` | Thêm step | QLT-03 / QLT-04 | Test case register/workbench | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 114 | Quality | Test Cases & Steps | `GET` | `.../steps` | Danh sách | QLT-03 / QLT-04 | Test case register/workbench | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 115 | Quality | Test Cases & Steps | `GET` | `.../steps/{stepId}` | Lấy theo ID | QLT-03 / QLT-04 | Test case register/workbench | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 116 | Quality | Test Cases & Steps | `PATCH` | `.../steps/{stepId}/archive` | Lưu trữ | QLT-03 / QLT-04 | Test case register/workbench | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 117 | Quality | Test Cases & Steps | `POST` | `.../coverage` | Link test case tới requirement/scope item | QLT-03 / QLT-04 | Test case register/workbench | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 118 | Quality | Test Cases & Steps | `GET` | `.../coverage` | Danh sách | QLT-03 / QLT-04 | Test case register/workbench | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 119 | Quality | Test Cases & Steps | `PATCH` | `.../coverage/{coverageId}/archive` | Xoá link | QLT-03 / QLT-04 | Test case register/workbench | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 120 | Quality | Test Runs | `POST` | `.../test-runs` | Tạo test run | QLT-05 | Test Run Execution | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 121 | Quality | Test Runs | `GET` | `.../test-runs` | Danh sách | QLT-05 | Test Run Execution | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 122 | Quality | Test Runs | `GET` | `.../test-runs/{testRunId}` | Lấy theo ID | QLT-05 | Test Run Execution | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 123 | Quality | Test Runs | `POST` | `.../test-runs/{testRunId}/start` | Bắt đầu | QLT-05 | Test Run Execution | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 124 | Quality | Test Runs | `POST` | `.../test-runs/{testRunId}/complete` | Hoàn thành | QLT-05 | Test Run Execution | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 125 | Quality | Test Runs | `POST` | `.../test-runs/{testRunId}/cancel` | Huỷ | QLT-05 | Test Run Execution | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 126 | Quality | Test Runs | `POST` | `.../test-runs/{testRunId}/case-results` | Ghi nhận kết quả test case | QLT-05 | Test Run Execution | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 127 | Quality | Test Runs | `GET` | `.../test-runs/{testRunId}/case-results` | Danh sách kết quả | QLT-05 | Test Run Execution | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 128 | Quality | Defects | `POST` | `.../defects` | Tạo defect | DEF-01 / DEF-02 | Defect Center/Detail | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 129 | Quality | Defects | `GET` | `.../defects` | Danh sách | DEF-01 / DEF-02 | Defect Center/Detail | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 130 | Quality | Defects | `GET` | `.../defects/{defectId}` | Lấy theo ID | DEF-01 / DEF-02 | Defect Center/Detail | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 131 | Quality | Defects | `PUT` | `.../defects/{defectId}` | Cập nhật | DEF-01 / DEF-02 | Defect Center/Detail | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 132 | Quality | Defects | `POST` | `.../defects/{defectId}/triage` | Triage | DEF-01 / DEF-02 | Defect Center/Detail | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 133 | Quality | Defects | `POST` | `.../defects/{defectId}/assign` | Gán (body: `assignedToUserId`) | DEF-01 / DEF-02 | Defect Center/Detail | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 134 | Quality | Defects | `POST` | `.../defects/{defectId}/mark-fixed` | Đánh dấu đã fix | DEF-01 / DEF-02 | Defect Center/Detail | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 135 | Quality | Defects | `POST` | `.../defects/{defectId}/ready-for-retest` | Sẵn sàng retest | DEF-01 / DEF-02 | Defect Center/Detail | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 136 | Quality | Defects | `POST` | `.../defects/{defectId}/verify` | Verify | DEF-01 / DEF-02 | Defect Center/Detail | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 137 | Quality | Defects | `POST` | `.../defects/{defectId}/close` | Đóng (body: `resolutionType`, `resolutionNote`) | DEF-01 / DEF-02 | Defect Center/Detail | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 138 | Quality | Defects | `POST` | `.../defects/{defectId}/reopen` | Reopen (body: `reason`) | DEF-01 / DEF-02 | Defect Center/Detail | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 139 | Quality | Defects | `PATCH` | `.../defects/{defectId}/archive` | Lưu trữ | DEF-01 / DEF-02 | Defect Center/Detail | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 140 | Quality | Defects | `POST` | `.../links` | Link defect tới task/requirement | DEF-01 / DEF-02 | Defect Center/Detail | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 141 | Quality | Defects | `GET` | `.../links` | Danh sách | DEF-01 / DEF-02 | Defect Center/Detail | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 142 | Quality | Defects | `PATCH` | `.../links/{linkId}/archive` | Xoá link | DEF-01 / DEF-02 | Defect Center/Detail | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 143 | Quality | Releases | `POST` | `.../releases` | Tạo release package | REL-01 / REL-02 | Release Center/Readiness | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 144 | Quality | Releases | `GET` | `.../releases` | Danh sách | REL-01 / REL-02 | Release Center/Readiness | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 145 | Quality | Releases | `GET` | `.../releases/{releasePackageId}` | Lấy theo ID | REL-01 / REL-02 | Release Center/Readiness | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 146 | Quality | Releases | `POST` | `.../releases/{releasePackageId}/check-readiness` | Kiểm tra readiness | REL-01 / REL-02 | Release Center/Readiness | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 147 | Quality | Releases | `POST` | `.../releases/{releasePackageId}/mark-ready` | Đánh dấu sẵn sàng | REL-01 / REL-02 | Release Center/Readiness | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 148 | Quality | Releases | `POST` | `.../releases/{releasePackageId}/mark-released` | Đánh dấu đã release | REL-01 / REL-02 | Release Center/Readiness | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 149 | Quality | Releases | `POST` | `.../releases/{releasePackageId}/mark-rolled-back` | Đánh dấu rollback | REL-01 / REL-02 | Release Center/Readiness | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 150 | Quality | Releases | `PATCH` | `.../releases/{releasePackageId}/archive` | Lưu trữ | REL-01 / REL-02 | Release Center/Readiness | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 151 | Quality | Releases | `POST` | `.../items` | Thêm item vào release | REL-01 / REL-02 | Release Center/Readiness | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 152 | Quality | Releases | `GET` | `.../items` | Danh sách | REL-01 / REL-02 | Release Center/Readiness | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 153 | Quality | Releases | `PATCH` | `.../items/{itemId}/archive` | Xoá | REL-01 / REL-02 | Release Center/Readiness | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 154 | Quality | Deployment | `POST` | `.../deployment-environments` | Tạo environment | DEP-01 | Deployment Center | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 155 | Quality | Deployment | `GET` | `.../deployment-environments` | Danh sách | DEP-01 | Deployment Center | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 156 | Quality | Deployment | `GET` | `.../deployment-environments/{envId}` | Lấy theo ID | DEP-01 | Deployment Center | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 157 | Quality | Deployment | `PATCH` | `.../deployment-environments/{envId}/archive` | Lưu trữ | DEP-01 | Deployment Center | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 158 | Quality | Deployment | `POST` | `.../deployments` | Tạo deployment record | DEP-01 | Deployment Center | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 159 | Quality | Deployment | `GET` | `.../deployments` | Danh sách | DEP-01 | Deployment Center | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 160 | Quality | Deployment | `GET` | `.../deployments/{deploymentId}` | Lấy theo ID | DEP-01 | Deployment Center | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 161 | Quality | Deployment | `POST` | `.../deployments/{deploymentId}/start` | Bắt đầu deploy | DEP-01 | Deployment Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 162 | Quality | Deployment | `POST` | `.../deployments/{deploymentId}/succeed` | Đánh dấu thành công | DEP-01 | Deployment Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 163 | Quality | Deployment | `POST` | `.../deployments/{deploymentId}/fail` | Đánh dấu thất bại (body: `failureReason`) | DEP-01 | Deployment Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 164 | Quality | Deployment | `POST` | `.../deployments/{deploymentId}/rollback` | Rollback (body: `rollbackReason`) | DEP-01 | Deployment Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 165 | Quality | Deployment | `POST` | `.../rollback-plans` | Tạo rollback plan | DEP-01 | Deployment Center | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 166 | Quality | Deployment | `GET` | `.../rollback-plans` | Danh sách | DEP-01 | Deployment Center | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 167 | Quality | Deployment | `GET` | `.../rollback-plans/{planId}` | Lấy theo ID | DEP-01 | Deployment Center | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 168 | Quality | Deployment | `POST` | `.../rollback-plans/{planId}/approve` | Phê duyệt | DEP-01 | Deployment Center | Lifecycle action + confirmation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 169 | Quality | Quality Reports | `GET` | `.../reports/quality-dashboard` | Dashboard tổng hợp | QLT-01 / RPT-02 | Quality dashboard/reports | Status/summary query → dashboard or job panel | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 170 | Quality | Quality Reports | `GET` | `.../reports/defects` | Defect metrics | DEF-01 / DEF-02 | Defect Center/Detail | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 171 | Quality | Quality Reports | `GET` | `.../reports/release-readiness` | Release readiness | REL-01 / REL-02 | Release Center/Readiness | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 172 | Quality | Quality Reports | `GET` | `.../reports/test-execution` | Test execution stats | QLT-01 / RPT-02 | Quality dashboard/reports | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 173 | Quality | Quality Reports | `GET` | `.../reports/test-coverage` | Coverage stats | QLT-01 / RPT-02 | Quality dashboard/reports | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 174 | Quality | Quality Reports | `GET` | `.../reports/defect-aging` | Defect aging analysis | DEF-01 / DEF-02 | Defect Center/Detail | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 175 | Quality | Quality Reports | `GET` | `.../reports/deployment-history` | Deployment history | DEP-01 | Deployment Center | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 176 | Reporting | Project Dashboard | `GET` | `.../dashboard` | Dashboard tổng hợp | RPT-01 | Project dashboard widgets | Status/summary query → dashboard or job panel | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 177 | Reporting | Project Dashboard | `GET` | `.../dashboard/health` | Health score của project | RPT-01 | Project dashboard widgets | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 178 | Reporting | Project Dashboard | `GET` | `.../dashboard/kpis` | KPIs (key performance indicators) | RPT-01 | Project dashboard widgets | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 179 | Reporting | Project Dashboard | `GET` | `.../dashboard/attention` | Các mục cần chú ý | RPT-01 | Project dashboard widgets | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 180 | Reporting | Project Reports (convenience) | `GET` | `.../reports/task-risk` | Task risk report | RPT-01 / RPT-02 / RPT-03 | Dashboard/reporting | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 181 | Reporting | Project Reports (convenience) | `GET` | `.../reports/schedule-risk` | Schedule risk report | RPT-01 / RPT-02 / RPT-03 | Dashboard/reporting | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 182 | Reporting | Project Reports (convenience) | `GET` | `.../reports/capacity` | Capacity report | RPT-01 / RPT-02 / RPT-03 | Dashboard/reporting | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 183 | Reporting | Project Reports (convenience) | `GET` | `.../reports/estimation` | Estimation report | RPT-01 / RPT-02 / RPT-03 | Dashboard/reporting | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 184 | Reporting | Project Reports (convenience) | `GET` | `.../reports/finance` | Finance report | RPT-01 / RPT-02 / RPT-03 | Dashboard/reporting | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 185 | Reporting | Project Reports (convenience) | `GET` | `.../reports/quote` | Quote report | RPT-01 / RPT-02 / RPT-03 | Dashboard/reporting | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 186 | Reporting | Project Reports (convenience) | `GET` | `.../reports/baseline-vs-current` | Baseline vs current comparison | RPT-01 / RPT-02 / RPT-03 | Dashboard/reporting | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 187 | Reporting | Project Reports (convenience) | `GET` | `.../reports/change-impact` | Change impact report | RPT-01 / RPT-02 / RPT-03 | Dashboard/reporting | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 188 | Reporting | Project Reports (convenience) | `GET` | `.../reports/notifications` | Notifications report | RPT-01 / RPT-02 / RPT-03 | Dashboard/reporting | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 189 | Reporting | Project Reports (convenience) | `GET` | `.../reports/ai-planning` | AI planning suggestions report | RPT-01 / RPT-02 / RPT-03 | Dashboard/reporting | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 190 | Reporting | Activity Feed | `GET` | `/api/v1/projects/{projectId}/activity-feed?page=&size=` | Activity feed của project (paginated) | Project Activity / RPT-01 | Activity feed | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 191 | Reporting | Report Definitions & Runs | `GET` | `/api/v1/reports/definitions` | Danh sách report definitions (catalog) | RPT-02 | Report Library | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 192 | Reporting | Report Definitions & Runs | `GET` | `/api/v1/reports/definitions/{code}` | Lấy theo code | RPT-02 | Report Library | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 193 | Reporting | Report Definitions & Runs | `POST` | `/api/v1/reports/runs` | Tạo và chạy report | RPT-02 | Report Library | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 194 | Reporting | Report Definitions & Runs | `GET` | `/api/v1/reports/runs/{reportRunId}` | Lấy run status | RPT-02 | Report Library | Status/summary query → dashboard or job panel | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 195 | Reporting | Report Definitions & Runs | `GET` | `/api/v1/reports/runs/{reportRunId}/snapshot` | Lấy data snapshot | RPT-02 | Report Library | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 196 | Reporting | Report Definitions & Runs | `POST` | `/api/v1/reports/runs/{reportRunId}/exports` | Export kết quả (body: `format`, `fileName`) | RPT-02 | Report Library | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 197 | Reporting | Report Definitions & Runs | `GET` | `/api/v1/reports/exports?projectId=` | Danh sách export jobs | RPT-02 | Report Library | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 198 | Reporting | Report Definitions & Runs | `GET` | `/api/v1/reports/exports/{exportJobId}` | Lấy theo ID | RPT-02 | Report Library | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 199 | Reporting | Report Definitions & Runs | `GET` | `/api/v1/reports/exports/{exportJobId}/download` | Download file (binary) | RPT-02 | Report Library | Download action | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 200 | Reporting | Report Definitions & Runs | `POST` | `/api/v1/reports/exports/{exportJobId}/cancel` | Huỷ | RPT-02 | Report Library | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 201 | AI Assistant | Conversations | `POST` | `.../conversations` | Tạo conversation mới | AI-01 | Conversation list/detail | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 202 | AI Assistant | Conversations | `GET` | `.../conversations?page=&size=` | Danh sách (paginated) | AI-01 | Conversation list/detail | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 203 | AI Assistant | Conversations | `GET` | `.../conversations/{id}` | Lấy theo ID | AI-01 | Conversation list/detail | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 204 | AI Assistant | Conversations | `PATCH` | `.../conversations/{id}/title` | Đổi tiêu đề | AI-01 | Conversation list/detail | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 205 | AI Assistant | Conversations | `DELETE` | `.../conversations/{id}` | Xoá (204) | AI-01 | Conversation list/detail | Delete/unsubscribe action + confirmation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 206 | AI Assistant | Conversations | `POST` | `.../conversations/{id}/archive` | Lưu trữ | AI-01 | Conversation list/detail | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 207 | AI Assistant | Messages | `POST` | `/api/v1/ai-assistant/conversations/{conversationId}/messages` | Gửi message (trả SSE start info) | AI-01 | Conversation list/detail | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 208 | AI Assistant | Messages | `GET` | `/api/v1/ai-assistant/conversations/{conversationId}/messages?page=&size=` | Danh sách messages | AI-01 | Conversation list/detail | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 209 | AI Assistant | Messages | `GET` | `/api/v1/ai-assistant/messages/{messageId}` | Lấy message theo ID | AI-01 | Chat composer/SSE stream | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 210 | AI Assistant | Messages | `GET` | `/api/v1/ai-assistant/messages/{messageId}/stream` | **SSE stream** (produces `text/event-stream`) | AI-01 | Chat composer/SSE stream | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 211 | AI Assistant | Messages | `POST` | `/api/v1/ai-assistant/messages/{messageId}/cancel` | Huỷ streaming | AI-01 | Chat composer/SSE stream | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 212 | AI Assistant | Guides | `POST` | `.../guides/explain-page` | Giải thích ngữ cảnh của trang hiện tại | AI-01 / contextual help | Explain page/field/action | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 213 | AI Assistant | Guides | `POST` | `.../guides/explain-field` | Giải thích ý nghĩa của một field | AI-01 / contextual help | Explain page/field/action | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 214 | AI Assistant | Guides | `POST` | `.../guides/explain-disabled-action` | Giải thích tại sao action bị disabled | AI-01 / contextual help | Explain page/field/action | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 215 | AI Assistant | Guides | `GET` | `.../guides/suggested-questions?pageCode=&entityType=&locale=` | Lấy suggested questions | AI-01 / contextual help | Explain page/field/action | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 216 | AI Assistant | Feedback | `POST` | `/api/v1/ai-assistant/feedbacks` | Gửi feedback (201) | AI-01 | Message feedback | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 217 | AI Planning | Planning Runs | `POST` | `.../runs` | Tạo và chạy AI planning run | AIP-01 | AI Planning runs | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 218 | AI Planning | Planning Runs | `GET` | `.../runs` | Danh sách | AIP-01 | AI Planning runs | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 219 | AI Planning | Planning Runs | `GET` | `.../runs/{runId}` | Lấy theo ID | AIP-01 | AI Planning runs | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 220 | AI Planning | Planning Runs | `POST` | `.../runs/{runId}/cancel` | Huỷ | AIP-01 | AI Planning runs | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 221 | AI Planning | Planning Suggestions | `GET` | `.../suggestions` | Danh sách suggestions | AIP-02 | Suggestion review/apply | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 222 | AI Planning | Planning Suggestions | `GET` | `.../suggestions/{suggestionId}` | Lấy theo ID | AIP-02 | Suggestion review/apply | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 223 | AI Planning | Planning Suggestions | `POST` | `.../suggestions/{suggestionId}/start-review` | Bắt đầu review | AIP-02 | Suggestion review/apply | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 224 | AI Planning | Planning Suggestions | `POST` | `.../suggestions/{suggestionId}/accept` | Chấp nhận toàn bộ | AIP-02 | Suggestion review/apply | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 225 | AI Planning | Planning Suggestions | `POST` | `.../suggestions/{suggestionId}/reject` | Từ chối (body: `reason`) | AIP-02 | Suggestion review/apply | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 226 | AI Planning | Planning Suggestions | `POST` | `.../suggestions/{suggestionId}/archive` | Lưu trữ | AIP-02 | Suggestion review/apply | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 227 | AI Planning | Planning Suggestions | `POST` | `.../suggestions/{suggestionId}/apply` | Áp dụng | AIP-02 | Suggestion review/apply | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 228 | AI Planning | Planning Suggestions | `GET` | `.../suggestions/{suggestionId}/items` | Danh sách suggestion items | AIP-02 | Suggestion review/apply | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 229 | AI Planning | Planning Suggestions | `GET` | `.../suggestions/{suggestionId}/items/{itemId}` | Lấy item | AIP-02 | Suggestion review/apply | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 230 | AI Planning | Planning Suggestions | `POST` | `.../suggestions/{suggestionId}/items/{itemId}/accept` | Chấp nhận từng item | AIP-02 | Suggestion review/apply | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 231 | AI Planning | Planning Suggestions | `POST` | `.../suggestions/{suggestionId}/items/{itemId}/reject` | Từ chối từng item | AIP-02 | Suggestion review/apply | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 232 | AI Recommendation | Recommendation Runs | `POST` | `/api/v1/ai-recommendations/projects/{projectId}/runs?workspaceId=` | Tạo run (202 Accepted) | AIR-01 | Recommendation runs | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 233 | AI Recommendation | Recommendation Runs | `GET` | `/api/v1/ai-recommendations/runs/{runId}?workspaceId=` | Lấy run status | AIR-01 | Recommendation runs | Status/summary query → dashboard or job panel | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 234 | AI Recommendation | Suggestions | `GET` | `/api/v1/ai-recommendations/projects/{projectId}/suggestions?workspaceId=&status=&severity=&page=&size=` | Danh sách suggestions của project | AIR-01 / AIR-02 | Recommendation Center/entity panel | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 235 | AI Recommendation | Suggestions | `GET` | `/api/v1/ai-recommendations/entities/{entityType}/{entityId}/suggestions?workspaceId=&projectId=&page=&size=` | Suggestions cho entity cụ thể | AIR-01 / AIR-02 | Recommendation Center/entity panel | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 236 | AI Recommendation | Suggestions | `GET` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}?workspaceId=` | Chi tiết | AIR-01 / AIR-02 | Recommendation Center/entity panel | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 237 | AI Recommendation | Suggestions | `POST` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}/view` | Đánh dấu đã xem | AIR-01 / AIR-02 | Recommendation Center/entity panel | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 238 | AI Recommendation | Suggestions | `PATCH` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}/edit` | Chỉnh sửa payload | AIR-01 / AIR-02 | Recommendation Center/entity panel | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 239 | AI Recommendation | Suggestions | `POST` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}/accept` | Chấp nhận | AIR-01 / AIR-02 | Recommendation Center/entity panel | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 240 | AI Recommendation | Suggestions | `POST` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}/reject` | Từ chối (body: `reasonCode`, `comment`) | AIR-01 / AIR-02 | Recommendation Center/entity panel | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 241 | AI Recommendation | Suggestions | `POST` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}/suppress` | Tắt tạm thời (body: `scopeType`, `durationDays`) | AIR-01 / AIR-02 | Recommendation Center/entity panel | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 242 | AI Recommendation | Suggestions | `POST` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}/prepare-apply` | Chuẩn bị apply | AIR-01 / AIR-02 | Recommendation Center/entity panel | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 243 | AI Recommendation | Suggestions | `POST` | `/api/v1/ai-recommendations/suggestions/{suggestionRef}/feedback` | Gửi feedback | AIR-01 / AIR-02 | Recommendation Center/entity panel | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 244 | AI Recommendation | Next Best Actions | `GET` | `/api/v1/ai-recommendations/projects/{projectId}/next-best-actions?workspaceId=&limit=10` | Danh sách next best actions | AIR-01 | Next Best Actions | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 245 | ClientPortal | Portal Auth (for clients) | `POST` | `.../portal/auth/accept-invite` | Kích hoạt account + set password | Portal Auth | Login/invite/password/session | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 246 | ClientPortal | Portal Auth (for clients) | `POST` | `.../portal/auth/login` | Đăng nhập portal | Portal Auth | Login/invite/password/session | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 247 | ClientPortal | Portal Auth (for clients) | `POST` | `.../portal/auth/logout` | Đăng xuất | Portal Auth | Login/invite/password/session | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 248 | ClientPortal | Portal Auth (for clients) | `POST` | `.../portal/auth/refresh` | Refresh token | Portal Auth | Login/invite/password/session | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 249 | ClientPortal | Portal Auth (for clients) | `GET` | `.../portal/auth/me` | Lấy thông tin account hiện tại | Portal Auth | Login/invite/password/session | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 250 | ClientPortal | Portal Auth (for clients) | `POST` | `.../portal/auth/password` | Đổi mật khẩu | Portal Auth | Login/invite/password/session | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 251 | ClientPortal | Portal Account Management (internal) | `GET` | `/api/v1/workspaces/{workspaceId}/portal-accounts/{accountId}` | Lấy portal account | CLI-02 | Portal account administration | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 252 | ClientPortal | Portal Account Management (internal) | `POST` | `/api/v1/workspaces/{workspaceId}/portal-accounts/{accountId}/suspend` | Suspend | CLI-02 | Portal account administration | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 253 | ClientPortal | Portal Account Management (internal) | `POST` | `/api/v1/workspaces/{workspaceId}/portal-accounts/{accountId}/deactivate` | Deactivate | CLI-02 | Portal account administration | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 254 | ClientPortal | Portal Invites (internal) | `POST` | `.../portal-invites` | Mời client (gửi email với invite token) | CLI-02 | Portal invitations | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 255 | ClientPortal | Portal Invites (internal) | `GET` | `.../portal-invites` | Danh sách invites | CLI-02 | Portal invitations | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 256 | ClientPortal | Portal Access Grants (internal) | `POST` | `.../portal-access-grants` | Cấp quyền cho portal account | CLI-02 | Portal access grants | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 257 | ClientPortal | Portal Access Grants (internal) | `GET` | `.../portal-access-grants` | Danh sách | CLI-02 | Portal access grants | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 258 | ClientPortal | Portal Access Grants (internal) | `POST` | `.../portal-access-grants/{grantId}/revoke` | Thu hồi | CLI-02 | Portal access grants | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 259 | ClientPortal | Portal Permission Policies (internal) | `POST` | `.../portal-permission-policies` | Tạo permission policy | Settings → Client Portal | Portal permission policies | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 260 | ClientPortal | Portal Permission Policies (internal) | `GET` | `.../portal-permission-policies` | Danh sách | Settings → Client Portal | Portal permission policies | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 261 | ClientPortal | Portal Permission Policies (internal) | `GET` | `.../portal-permission-policies/{policyId}` | Lấy theo ID | Settings → Client Portal | Portal permission policies | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 262 | ClientPortal | Portal Permission Policies (internal) | `PUT` | `.../portal-permission-policies/{policyId}` | Cập nhật | Settings → Client Portal | Portal permission policies | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 263 | ClientPortal | Client Reviews (internal) | `POST` | `.../client-reviews` | Tạo review request | CLI-03 / PRT-02 | Client review register/portal review | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 264 | ClientPortal | Client Reviews (internal) | `GET` | `.../client-reviews` | Danh sách | CLI-03 / PRT-02 | Client review register/portal review | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 265 | ClientPortal | Client Reviews (internal) | `GET` | `.../client-reviews/{reviewId}` | Lấy theo ID | CLI-03 / PRT-02 | Client review register/portal review | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 266 | ClientPortal | Client Reviews (internal) | `POST` | `.../client-reviews/{reviewId}/decide` | Quyết định (body: `decision`, `comment`) | CLI-03 / PRT-02 | Client review register/portal review | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 267 | ClientPortal | Client UAT Assignments (internal) | `POST` | `.../client-uat-assignments` | Gán test case cho client UAT | CLI-04 | Client UAT assignments | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 268 | ClientPortal | Client UAT Assignments (internal) | `GET` | `.../client-uat-assignments` | Danh sách | CLI-04 | Client UAT assignments | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 269 | ClientPortal | Client Feedback & Comments (internal) | `POST` | `/api/v1/projects/{projectId}/client-feedback` | Tạo feedback (internal) | CLI-01 / PRT-05 | Client feedback | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 270 | ClientPortal | Client Feedback & Comments (internal) | `GET` | `/api/v1/projects/{projectId}/client-feedback` | Danh sách | CLI-01 / PRT-05 | Client feedback | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 271 | ClientPortal | Client Feedback & Comments (internal) | `GET` | `/api/v1/projects/{projectId}/client-comments` | Danh sách comments từ portal | CLI-01 / PRT-05 | Client feedback | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 272 | ClientPortal | Client Feedback & Comments (internal) | `GET` | `/api/v1/projects/{projectId}/portal-audit-logs` | Audit log hoạt động của portal | CLI-01 / PRT-05 | Client feedback | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 273 | ClientPortal | Portal Views (for clients) | `GET` | `.../portal/projects` | Danh sách projects client có quyền xem | PRT-01..PRT-06 | Client Portal pages | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 274 | ClientPortal | Portal Views (for clients) | `GET` | `.../portal/projects/{projectId}/reviews` | Danh sách review requests | CLI-03 / PRT-02 | Client review register/portal review | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 275 | ClientPortal | Portal Views (for clients) | `GET` | `.../portal/projects/{projectId}/meetings` | Danh sách meetings | PRT-01..PRT-06 | Client Portal pages | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 276 | ClientPortal | Portal Views (for clients) | `GET` | `.../portal/projects/{projectId}/meetings/{meetingId}` | Chi tiết meeting | PRT-01..PRT-06 | Client Portal pages | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 277 | ClientPortal | Portal Views (for clients) | `GET` | `.../portal/projects/{projectId}/meetings/{meetingId}/minutes` | Meeting minutes | PRT-01..PRT-06 | Client Portal pages | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 278 | ClientPortal | Portal Views (for clients) | `GET` | `.../portal/projects/{projectId}/meetings/{meetingId}/comments` | Comments | CLI-01 / PRT-03 | Portal comments | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 279 | ClientPortal | Portal Views (for clients) | `POST` | `.../portal/projects/{projectId}/meetings/{meetingId}/comments` | Thêm comment | CLI-01 / PRT-03 | Portal comments | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 280 | ClientPortal | Portal Views (for clients) | `POST` | `.../portal/projects/{projectId}/comments` | Tạo comment | CLI-01 / PRT-03 | Portal comments | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 281 | ClientPortal | Portal Views (for clients) | `GET` | `.../portal/projects/{projectId}/comments` | Danh sách comments | CLI-01 / PRT-03 | Portal comments | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 282 | ClientPortal | Portal Views (for clients) | `POST` | `.../portal/projects/{projectId}/feedback` | Gửi feedback | CLI-01 / PRT-05 | Client feedback | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 283 | ClientPortal | Portal Views (for clients) | `GET` | `.../portal/projects/{projectId}/feedback` | Danh sách feedback | CLI-01 / PRT-05 | Client feedback | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 284 | ClientPortal | Portal Views (for clients) | `POST` | `.../portal/projects/{projectId}/support/cases` | Tạo support case | PRT-01..PRT-06 | Client Portal pages | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 285 | ClientPortal | Portal Views (for clients) | `GET` | `.../portal/projects/{projectId}/support/cases` | Danh sách support cases | PRT-01..PRT-06 | Client Portal pages | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 286 | ClientPortal | Portal Views (for clients) | `GET` | `.../portal/projects/{projectId}/forms` | Danh sách forms | PRT-01..PRT-06 | Client Portal pages | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 287 | ClientPortal | Portal Views (for clients) | `GET` | `.../portal/projects/{projectId}/forms/{formId}/published-version` | Form version đang publish | PRT-01..PRT-06 | Client Portal pages | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 288 | ClientPortal | Portal Views (for clients) | `POST` | `.../portal/projects/{projectId}/forms/{formId}/submit` | Submit form | PRT-01..PRT-06 | Client Portal pages | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 289 | ProjectNotification | Project Subscriptions | `POST` | `.../notification-subscriptions` | Subscribe (201) | Project/Task detail | Watch/mute/unsubscribe controls | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 290 | ProjectNotification | Project Subscriptions | `GET` | `.../notification-subscriptions` | Danh sách | Project/Task detail | Watch/mute/unsubscribe controls | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 291 | ProjectNotification | Project Subscriptions | `GET` | `.../notification-subscriptions/me` | Subscriptions của tôi | Project/Task detail | Watch/mute/unsubscribe controls | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 292 | ProjectNotification | Project Subscriptions | `PATCH` | `.../notification-subscriptions/{subscriptionId}/mute` | Tắt thông báo | Project/Task detail | Watch/mute/unsubscribe controls | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 293 | ProjectNotification | Project Subscriptions | `PATCH` | `.../notification-subscriptions/{subscriptionId}/unmute` | Bật lại | Project/Task detail | Watch/mute/unsubscribe controls | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 294 | ProjectNotification | Project Subscriptions | `DELETE` | `.../notification-subscriptions/{subscriptionId}` | Unsubscribe (204) | Project/Task detail | Watch/mute/unsubscribe controls | Delete/unsubscribe action + confirmation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 295 | ProjectNotification | Notification Preferences | `GET` | `/api/v1/projects/{projectId}/notification-preferences/me` | Lấy preferences của tôi | Settings → My Notifications | Preference matrix | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 296 | ProjectNotification | Notification Preferences | `PUT` | `/api/v1/projects/{projectId}/notification-preferences/me` | Upsert preferences | Settings → My Notifications | Preference matrix | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 297 | ProjectNotification | Notification Preferences | `GET` | `/api/v1/projects/{projectId}/tasks/{taskId}/notification-preferences/me` | Preferences tại task level | Settings → My Notifications | Preference matrix | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 298 | ProjectNotification | Notification Preferences | `PUT` | `/api/v1/projects/{projectId}/tasks/{taskId}/notification-preferences/me` | Upsert task-level preferences | Settings → My Notifications | Preference matrix | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 299 | ProjectNotification | Project Reminders | `POST` | `.../reminders/run?workspaceId=` | Trigger reminder job | Settings → Notifications | Reminder operations | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 300 | ProjectNotification | Project Reminders | `GET` | `.../reminders/runs?workspaceId=` | Danh sách runs | Settings → Notifications | Reminder operations | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 301 | ProjectNotification | Project Reminders | `GET` | `.../reminders/runs/{runId}?workspaceId=` | Lấy theo ID | Settings → Notifications | Reminder operations | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 302 | Productivity | Global Search | `GET` | `/api/v1/search?workspaceId=&q=&page=&size=` | Tìm kiếm toàn cục | PRD-01 | Global Search | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 303 | Productivity | Global Search | `GET` | `/api/v1/search/scopes?workspaceId=` | Danh sách scope có thể search | PRD-01 | Global Search | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 304 | Productivity | Saved Searches & Views | `POST` | `/api/v1/workspaces/{workspaceId}/saved-searches` | Lưu search | PRD-04 | Saved searches/views | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 305 | Productivity | Saved Searches & Views | `GET` | `/api/v1/workspaces/{workspaceId}/saved-searches` | Danh sách | PRD-04 | Saved searches/views | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 306 | Productivity | Saved Searches & Views | `POST` | `/api/v1/workspaces/{workspaceId}/saved-views` | Lưu view config | PRD-04 | Saved searches/views | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 307 | Productivity | Saved Searches & Views | `GET` | `/api/v1/workspaces/{workspaceId}/saved-views` | Danh sách | PRD-04 | Saved searches/views | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 308 | Productivity | Favorites & Pins | `POST` | `/api/v1/workspaces/{workspaceId}/favorites` | Thêm vào favorites | PRD-04 | Favorites and pins | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 309 | Productivity | Favorites & Pins | `GET` | `/api/v1/workspaces/{workspaceId}/favorites` | Danh sách | PRD-04 | Favorites and pins | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 310 | Productivity | Favorites & Pins | `DELETE` | `/api/v1/workspaces/{workspaceId}/favorites/{favoriteId}` | Xoá | PRD-04 | Favorites and pins | Delete/unsubscribe action + confirmation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 311 | Productivity | Favorites & Pins | `POST` | `/api/v1/workspaces/{workspaceId}/pins` | Ghim item | PRD-04 | Favorites and pins | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 312 | Productivity | Favorites & Pins | `GET` | `/api/v1/workspaces/{workspaceId}/pins` | Danh sách | PRD-04 | Favorites and pins | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 313 | Productivity | Recent Items | `POST` | `/api/v1/workspaces/{workspaceId}/recent-items` | Ghi nhận lần xem | PRD-04 | Recent items | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 314 | Productivity | Recent Items | `GET` | `/api/v1/workspaces/{workspaceId}/recent-items` | Danh sách gần đây | PRD-04 | Recent items | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 315 | Productivity | Work Inbox | `GET` | `/api/v1/workspaces/{workspaceId}/work-inbox` | Danh sách inbox items | PRD-03 | Work Inbox | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 316 | Productivity | Work Inbox | `GET` | `/api/v1/workspaces/{workspaceId}/work-inbox/counts` | Counts theo category | PRD-03 | Work Inbox | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 317 | Productivity | Work Inbox | `POST` | `/api/v1/workspaces/{workspaceId}/work-inbox/{itemId}/mark-read` | Đánh dấu đã đọc | PRD-03 | Work Inbox | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 318 | Productivity | Commands | `GET` | `/api/v1/workspaces/{workspaceId}/commands` | Danh sách command definitions | PRD-02 | Command Palette | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 319 | Productivity | Commands | `GET` | `/api/v1/workspaces/{workspaceId}/commands/suggestions?q=` | Gợi ý lệnh theo query | PRD-02 | Command Palette | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 320 | Productivity | Navigation | `GET` | `/api/v1/workspaces/{workspaceId}/navigation` | Navigation menu | Settings → Personal → Navigation | Navigation preferences | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 321 | Productivity | Navigation | `GET` | `/api/v1/workspaces/{workspaceId}/navigation/preferences` | User nav preferences | Settings → Personal → Navigation | Navigation preferences | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 322 | Productivity | Navigation | `PUT` | `/api/v1/workspaces/{workspaceId}/navigation/preferences` | Cập nhật preferences | Settings → Personal → Navigation | Navigation preferences | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 323 | IntegrationHub | Providers (platform-wide, read-only) | `GET` | `/api/v1/integrations/providers` | Danh sách providers | INT-01 | Provider catalog | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 324 | IntegrationHub | Providers (platform-wide, read-only) | `GET` | `/api/v1/integrations/providers/{providerCode}` | Lấy theo code | INT-01 | Provider catalog | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 325 | IntegrationHub | Providers (platform-wide, read-only) | `GET` | `/api/v1/integrations/providers/{providerCode}/capabilities` | Capabilities của provider | INT-01 | Provider catalog | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 326 | IntegrationHub | Connections | `POST` | `.../connections` | Tạo connection | INT-02 | Connections and health | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 327 | IntegrationHub | Connections | `GET` | `.../connections` | Danh sách | INT-02 | Connections and health | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 328 | IntegrationHub | Connections | `GET` | `.../connections/{connectionId}` | Lấy theo ID | INT-02 | Connections and health | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 329 | IntegrationHub | Connections | `POST` | `.../connections/{connectionId}/enable` | Enable | INT-02 | Connections and health | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 330 | IntegrationHub | Connections | `POST` | `.../connections/{connectionId}/disable` | Disable | INT-02 | Connections and health | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 331 | IntegrationHub | Connections | `PATCH` | `.../connections/{connectionId}/archive` | Lưu trữ | INT-02 | Connections and health | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 332 | IntegrationHub | Connections | `POST` | `.../connections/{connectionId}/health-check` | Chạy health check | INT-02 | Connections and health | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 333 | IntegrationHub | Connections | `GET` | `.../connections/{connectionId}/health-checks` | Lịch sử health checks | INT-02 | Connections and health | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 334 | IntegrationHub | Connections | `POST` | `.../connections/{connectionId}/test-connection` | Test kết nối | INT-02 | Connections and health | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 335 | IntegrationHub | Connections | `POST` | `.../connections/{connectionId}/sync-pull` | Pull data từ provider | INT-02 | Connections and health | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 336 | IntegrationHub | Credentials | `POST` | `.../credential-references` | Tạo credential reference | INT-02 | Credential references | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 337 | IntegrationHub | Credentials | `GET` | `.../credential-references` | Danh sách | INT-02 | Credential references | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 338 | IntegrationHub | Credentials | `GET` | `.../credential-references/{credentialId}` | Lấy theo ID | INT-02 | Credential references | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 339 | IntegrationHub | Credentials | `POST` | `.../credential-references/{credentialId}/rotate` | Rotate credential | INT-02 | Credential references | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 340 | IntegrationHub | Credentials | `POST` | `.../credential-references/{credentialId}/revoke` | Thu hồi | INT-02 | Credential references | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 341 | IntegrationHub | Import | `POST` | `.../integrations/import-jobs` | Tạo import job | INT-03 | Import Center | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 342 | IntegrationHub | Import | `GET` | `.../integrations/import-jobs` | Danh sách | INT-03 | Import Center | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 343 | IntegrationHub | Import | `GET` | `.../integrations/import-jobs/{importJobId}` | Lấy theo ID | INT-03 | Import Center | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 344 | IntegrationHub | Import | `POST` | `.../integrations/import-jobs/{importJobId}/validate` | Validate | INT-03 | Import Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 345 | IntegrationHub | Import | `POST` | `.../integrations/import-jobs/{importJobId}/dry-run` | Dry run | INT-03 | Import Center | Long-running action + status panel | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 346 | IntegrationHub | Import | `POST` | `.../integrations/import-jobs/{importJobId}/execute` | Thực thi | INT-03 | Import Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 347 | IntegrationHub | Import | `POST` | `.../integrations/import-jobs/{importJobId}/cancel` | Huỷ | INT-03 | Import Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 348 | IntegrationHub | Import | `GET` | `.../integrations/import-jobs/{importJobId}/rows` | Xem từng row kết quả | INT-03 | Import Center | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 349 | IntegrationHub | Import | `GET` | `.../integrations/import-templates` | Danh sách templates | INT-03 | Import Center | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 350 | IntegrationHub | Import | `GET` | `.../integrations/import-templates/{templateId}` | Lấy template | INT-03 | Import Center | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 351 | IntegrationHub | Export | `POST` | `.../integrations/export-profiles` | Tạo export profile | INT-04 | Export Center | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 352 | IntegrationHub | Export | `GET` | `.../integrations/export-profiles` | Danh sách | INT-04 | Export Center | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 353 | IntegrationHub | Export | `GET` | `.../integrations/export-profiles/{exportProfileId}` | Lấy theo ID | INT-04 | Export Center | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 354 | IntegrationHub | Export | `PUT` | `.../integrations/export-profiles/{exportProfileId}` | Cập nhật | INT-04 | Export Center | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 355 | IntegrationHub | Export | `PATCH` | `.../integrations/export-profiles/{exportProfileId}/archive` | Lưu trữ | INT-04 | Export Center | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 356 | IntegrationHub | Export | `POST` | `.../integrations/export-jobs` | Tạo export job | INT-04 | Export Center | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 357 | IntegrationHub | Export | `GET` | `.../integrations/export-jobs` | Danh sách | INT-04 | Export Center | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 358 | IntegrationHub | Export | `GET` | `.../integrations/export-jobs/{exportJobId}` | Lấy theo ID | INT-04 | Export Center | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 359 | IntegrationHub | Export | `POST` | `.../integrations/export-jobs/{exportJobId}/cancel` | Huỷ | INT-04 | Export Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 360 | IntegrationHub | Export | `GET` | `.../integrations/export-jobs/{exportJobId}/download` | Download file | INT-04 | Export Center | Download action | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 361 | IntegrationHub | Sync Jobs | `POST` | `.../integrations/sync-jobs` | Tạo sync job | INT-05 | Sync Center | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 362 | IntegrationHub | Sync Jobs | `GET` | `.../integrations/sync-jobs` | Danh sách | INT-05 | Sync Center | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 363 | IntegrationHub | Sync Jobs | `GET` | `.../integrations/sync-jobs/{syncJobId}` | Lấy theo ID | INT-05 | Sync Center | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 364 | IntegrationHub | Sync Jobs | `PUT` | `.../integrations/sync-jobs/{syncJobId}` | Cập nhật | INT-05 | Sync Center | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 365 | IntegrationHub | Sync Jobs | `POST` | `.../integrations/sync-jobs/{syncJobId}/enable` | Enable | INT-05 | Sync Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 366 | IntegrationHub | Sync Jobs | `POST` | `.../integrations/sync-jobs/{syncJobId}/disable` | Disable | INT-05 | Sync Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 367 | IntegrationHub | Sync Jobs | `PATCH` | `.../integrations/sync-jobs/{syncJobId}/archive` | Lưu trữ | INT-05 | Sync Center | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 368 | IntegrationHub | Sync Jobs | `POST` | `.../integrations/sync-jobs/{syncJobId}/run-now` | Chạy ngay | INT-05 | Sync Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 369 | IntegrationHub | Sync Jobs | `GET` | `.../integrations/sync-runs` | Danh sách sync runs | INT-05 | Sync Center | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 370 | IntegrationHub | Sync Jobs | `GET` | `.../integrations/sync-runs/{syncRunId}` | Lấy theo ID | INT-05 | Sync Center | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 371 | IntegrationHub | Sync Conflicts | `GET` | `.../integrations/sync-conflicts` | Danh sách conflicts | INT-06 | Conflict Resolution | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 372 | IntegrationHub | Sync Conflicts | `POST` | `.../integrations/sync-conflicts/{conflictId}/resolve` | Resolve (body: `resolutionStrategy`, `resolutionNotes`) | INT-06 | Conflict Resolution | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 373 | IntegrationHub | Sync Conflicts | `POST` | `.../integrations/sync-conflicts/{conflictId}/dismiss` | Dismiss | INT-06 | Conflict Resolution | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 374 | IntegrationHub | Webhooks | `POST` | `.../integrations/webhooks/subscriptions` | Tạo webhook subscription | INT-07 | Webhooks | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 375 | IntegrationHub | Webhooks | `GET` | `.../integrations/webhooks/subscriptions` | Danh sách | INT-07 | Webhooks | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 376 | IntegrationHub | Webhooks | `GET` | `.../integrations/webhooks/subscriptions/{subscriptionId}` | Lấy theo ID | INT-07 | Webhooks | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 377 | IntegrationHub | Webhooks | `PUT` | `.../integrations/webhooks/subscriptions/{subscriptionId}` | Cập nhật | INT-07 | Webhooks | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 378 | IntegrationHub | Webhooks | `POST` | `.../integrations/webhooks/subscriptions/{subscriptionId}/enable` | Enable | INT-07 | Webhooks | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 379 | IntegrationHub | Webhooks | `POST` | `.../integrations/webhooks/subscriptions/{subscriptionId}/disable` | Disable | INT-07 | Webhooks | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 380 | IntegrationHub | Webhooks | `PATCH` | `.../integrations/webhooks/subscriptions/{subscriptionId}/archive` | Lưu trữ | INT-07 | Webhooks | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 381 | IntegrationHub | Webhooks | `POST` | `.../integrations/webhooks/delivery-attempts` | Record delivery attempt | INT-07 | Webhooks | Command/action mutation | `SERVICE_ORCHESTRATED` | MAPPED — exception evidence required | Approved exception + integration test | TODO | TODO if applicable |
| 382 | IntegrationHub | Webhooks | `GET` | `.../integrations/webhooks/delivery-attempts` | Danh sách | INT-07 | Webhooks | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 383 | IntegrationHub | Webhooks | `POST` | `.../integrations/webhooks/delivery-attempts/{attemptId}/retry` | Retry | INT-07 | Webhooks | Command/action mutation | `SERVICE_ORCHESTRATED` | MAPPED — exception evidence required | Approved exception + integration test | TODO | TODO if applicable |
| 384 | IntegrationHub | Webhooks | `POST` | `/api/v1/integrations/inbound/{endpointCode}` | **Inbound webhook** (public, no auth) | INT-07 | Webhooks | Command/action mutation | `PUBLIC_EXTERNAL` | MAPPED — exception evidence required | Approved exception + integration test | TODO | TODO if applicable |
| 385 | IntegrationHub | Webhooks | `POST` | `.../integrations/inbound-endpoints` | Tạo inbound endpoint config | INT-07 | Webhooks | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 386 | IntegrationHub | Webhooks | `GET` | `.../integrations/inbound-endpoints` | Danh sách | INT-07 | Webhooks | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 387 | IntegrationHub | Webhooks | `GET` | `.../integrations/inbound-events` | Lịch sử events nhận vào | INT-07 | Webhooks | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 388 | IntegrationHub | Mapping Profiles & Observability | `POST` | `.../integrations/mapping-profiles` | Tạo mapping profile | INT-08 | Mapping/Observability | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 389 | IntegrationHub | Mapping Profiles & Observability | `GET` | `.../integrations/mapping-profiles` | Danh sách | INT-08 | Mapping/Observability | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 390 | IntegrationHub | Mapping Profiles & Observability | `PUT` | `.../integrations/mapping-profiles/{mappingProfileId}` | Cập nhật | INT-08 | Mapping/Observability | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 391 | IntegrationHub | Mapping Profiles & Observability | `PATCH` | `.../integrations/mapping-profiles/{mappingProfileId}/archive` | Lưu trữ | INT-08 | Mapping/Observability | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 392 | IntegrationHub | Mapping Profiles & Observability | `GET` | `.../integrations/external-id-mappings` | Danh sách external ID mappings | INT-08 | Mapping/Observability | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 393 | IntegrationHub | Mapping Profiles & Observability | `GET` | `.../integrations/rate-limits` | Trạng thái rate limits của providers | INT-08 | Mapping/Observability | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 394 | IntegrationHub | Mapping Profiles & Observability | `GET` | `.../integrations/dead-letter-events` | Danh sách dead letter events | INT-08 | Mapping/Observability | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 395 | IntegrationHub | Mapping Profiles & Observability | `POST` | `.../integrations/dead-letter-events/{deadLetterId}/retry` | Retry | INT-08 | Mapping/Observability | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 396 | IntegrationHub | Mapping Profiles & Observability | `POST` | `.../integrations/dead-letter-events/{deadLetterId}/resolve` | Resolve | INT-08 | Mapping/Observability | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 397 | IntegrationHub | Mapping Profiles & Observability | `GET` | `.../integrations/dashboard` | Integration observability dashboard | INT-08 | Mapping/Observability | Status/summary query → dashboard or job panel | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 398 | Traceability | Requirements | `POST` | `.../requirements` | Tạo requirement | TRC-01 / TRC-02 | Requirements register/workbench | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 399 | Traceability | Requirements | `GET` | `.../requirements` | Danh sách | TRC-01 / TRC-02 | Requirements register/workbench | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 400 | Traceability | Requirements | `GET` | `.../requirements/{requirementId}` | Lấy theo ID | TRC-01 / TRC-02 | Requirements register/workbench | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 401 | Traceability | Requirements | `PATCH` | `.../requirements/{requirementId}` | Cập nhật | TRC-01 / TRC-02 | Requirements register/workbench | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 402 | Traceability | Requirements | `POST` | `.../requirements/{requirementId}/approve` | Phê duyệt | TRC-01 / TRC-02 | Requirements register/workbench | Lifecycle action + confirmation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 403 | Traceability | Requirements | `PATCH` | `.../requirements/{requirementId}/reject` | Từ chối | TRC-01 / TRC-02 | Requirements register/workbench | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 404 | Traceability | Requirements | `PATCH` | `.../requirements/{requirementId}/defer` | Hoãn | TRC-01 / TRC-02 | Requirements register/workbench | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 405 | Traceability | Requirements | `PATCH` | `.../requirements/{requirementId}/implement` | Đánh dấu đã implement | TRC-01 / TRC-02 | Requirements register/workbench | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 406 | Traceability | Requirements | `PATCH` | `.../requirements/{requirementId}/archive` | Lưu trữ | TRC-01 / TRC-02 | Requirements register/workbench | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 407 | Traceability | Requirements | `POST` | `.../versions` | Tạo version snapshot | TRC-01 / TRC-02 | Requirements register/workbench | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 408 | Traceability | Requirements | `GET` | `.../versions` | Danh sách | TRC-01 / TRC-02 | Requirements register/workbench | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 409 | Traceability | Requirements | `GET` | `.../versions/{versionId}` | Lấy theo ID | TRC-01 / TRC-02 | Requirements register/workbench | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 410 | Traceability | Requirements | `POST` | `.../sources` | Thêm nguồn yêu cầu | TRC-01 / TRC-02 | Requirements register/workbench | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 411 | Traceability | Requirements | `GET` | `.../sources` | Danh sách | TRC-01 / TRC-02 | Requirements register/workbench | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 412 | Traceability | Requirements | `GET` | `.../sources/{sourceId}` | Lấy theo ID | TRC-01 / TRC-02 | Requirements register/workbench | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 413 | Traceability | Requirements | `POST` | `.../acceptance-criteria` | Thêm tiêu chí | TRC-01 / TRC-02 | Requirements register/workbench | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 414 | Traceability | Requirements | `GET` | `.../acceptance-criteria` | Danh sách | TRC-01 / TRC-02 | Requirements register/workbench | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 415 | Traceability | Requirements | `GET` | `.../acceptance-criteria/{criteriaId}` | Lấy theo ID | TRC-01 / TRC-02 | Requirements register/workbench | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 416 | Traceability | Trace Links | `POST` | `.../trace-links` | Tạo trace link | TRC-02 / TRC-03 | Trace links/matrix | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 417 | Traceability | Trace Links | `GET` | `.../trace-links` | Danh sách | TRC-02 / TRC-03 | Trace links/matrix | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 418 | Traceability | Trace Links | `GET` | `.../trace-links/{linkId}` | Lấy theo ID | TRC-02 / TRC-03 | Trace links/matrix | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 419 | Traceability | Trace Links | `PATCH` | `.../trace-links/{linkId}/archive` | Xoá link | TRC-02 / TRC-03 | Trace links/matrix | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 420 | Traceability | Trace Links | `GET` | `/api/v1/projects/{projectId}/reports/coverage-matrix` | Coverage/gap matrix | TRC-02 / TRC-03 | Trace links/matrix | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 421 | Traceability | Application Registry | `POST` | `.../applications` | Đăng ký application | APP-01 / APP-02 | Application registry/workbench | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 422 | Traceability | Application Registry | `GET` | `.../applications` | Danh sách | APP-01 / APP-02 | Application registry/workbench | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 423 | Traceability | Application Registry | `GET` | `.../applications/{applicationId}` | Lấy theo ID | APP-01 / APP-02 | Application registry/workbench | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 424 | Trust / Compliance | Dashboard & Policy | `GET` | `.../trust/dashboard` | Trust metrics dashboard | TRU-01 | Trust Dashboard | Status/summary query → dashboard or job panel | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 425 | Trust / Compliance | Dashboard & Policy | `GET` | `.../trust/classification-policy` | Data classification policy | TRU-01 | Trust Dashboard | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 426 | Trust / Compliance | Dashboard & Policy | `PUT` | `.../trust/classification-policy` | Upsert policy | TRU-01 | Trust Dashboard | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 427 | Trust / Compliance | Sensitive Object & Field Registry | `POST` | `.../trust/sensitive-objects` | Đăng ký object type nhạy cảm | TRU-02 | Sensitive registry/audit | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 428 | Trust / Compliance | Sensitive Object & Field Registry | `GET` | `.../trust/sensitive-objects` | Danh sách | TRU-02 | Sensitive registry/audit | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 429 | Trust / Compliance | Sensitive Object & Field Registry | `GET` | `.../trust/sensitive-objects/{objectId}` | Lấy theo ID | TRU-02 | Sensitive registry/audit | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 430 | Trust / Compliance | Sensitive Object & Field Registry | `PATCH` | `.../trust/sensitive-objects/{objectId}` | Cập nhật | TRU-02 | Sensitive registry/audit | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 431 | Trust / Compliance | Sensitive Object & Field Registry | `POST` | `.../trust/sensitive-fields` | Đăng ký field nhạy cảm | TRU-02 | Sensitive registry/audit | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 432 | Trust / Compliance | Sensitive Object & Field Registry | `GET` | `.../trust/sensitive-fields` | Danh sách | TRU-02 | Sensitive registry/audit | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 433 | Trust / Compliance | Sensitive Object & Field Registry | `GET` | `.../trust/sensitive-fields/{fieldId}` | Lấy theo ID | TRU-02 | Sensitive registry/audit | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 434 | Trust / Compliance | Sensitive Object & Field Registry | `PATCH` | `.../trust/sensitive-fields/{fieldId}` | Cập nhật | TRU-02 | Sensitive registry/audit | Edit form or inline update mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 435 | Trust / Compliance | Audit Logs | `POST` | `.../trust/sensitive-access-logs` | Ghi nhận truy cập sensitive field | TRU-02 | Sensitive registry/audit | Command/action mutation | `SERVICE_ORCHESTRATED` | MAPPED — exception evidence required | Approved exception + integration test | TODO | TODO if applicable |
| 436 | Trust / Compliance | Audit Logs | `GET` | `.../trust/sensitive-access-logs` | Danh sách | TRU-02 | Sensitive registry/audit | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 437 | Trust / Compliance | Audit Logs | `POST` | `.../trust/export-audit-logs` | Ghi nhận export audit | TRU-01..TRU-07 | Trust & Compliance | Command/action mutation | `SERVICE_ORCHESTRATED` | MAPPED — exception evidence required | Approved exception + integration test | TODO | TODO if applicable |
| 438 | Trust / Compliance | Audit Logs | `GET` | `.../trust/export-audit-logs` | Danh sách | TRU-01..TRU-07 | Trust & Compliance | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 439 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/privacy-requests` | Tạo privacy request (DSR) | TRU-03 / TRU-04 | Privacy requests/data subjects | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 440 | Trust / Compliance | Privacy & GDPR | `GET` | `.../trust/privacy-requests` | Danh sách | TRU-03 / TRU-04 | Privacy requests/data subjects | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 441 | Trust / Compliance | Privacy & GDPR | `GET` | `.../trust/privacy-requests/{requestId}` | Lấy theo ID | TRU-03 / TRU-04 | Privacy requests/data subjects | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 442 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/privacy-requests/{requestId}/triage` | Triage | TRU-03 / TRU-04 | Privacy requests/data subjects | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 443 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/privacy-requests/{requestId}/mark-in-review` | Mark in review | TRU-03 / TRU-04 | Privacy requests/data subjects | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 444 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/privacy-requests/{requestId}/complete` | Hoàn thành | TRU-03 / TRU-04 | Privacy requests/data subjects | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 445 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/privacy-requests/{requestId}/reject` | Từ chối | TRU-03 / TRU-04 | Privacy requests/data subjects | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 446 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/privacy-requests/{requestId}/cancel` | Huỷ | TRU-03 / TRU-04 | Privacy requests/data subjects | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 447 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/privacy-export-packages` | Tạo export package cho DSR | TRU-03 / TRU-04 | Privacy requests/data subjects | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 448 | Trust / Compliance | Privacy & GDPR | `GET` | `.../trust/privacy-export-packages` | Danh sách | TRU-03 / TRU-04 | Privacy requests/data subjects | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 449 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/data-subjects/rebuild-index` | Rebuild data subject index | TRU-03 / TRU-04 | Privacy requests/data subjects | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 450 | Trust / Compliance | Privacy & GDPR | `GET` | `.../trust/data-subjects` | Danh sách data subjects | TRU-03 / TRU-04 | Privacy requests/data subjects | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 451 | Trust / Compliance | Privacy & GDPR | `GET` | `.../trust/data-subjects/{subjectIndexId}` | Lấy theo ID | TRU-03 / TRU-04 | Privacy requests/data subjects | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 452 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/consent-records` | Ghi nhận consent | TRU-03 / TRU-04 | Privacy requests/data subjects | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 453 | Trust / Compliance | Privacy & GDPR | `GET` | `.../trust/consent-records` | Danh sách | TRU-03 / TRU-04 | Privacy requests/data subjects | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 454 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/consent-records/{consentId}/withdraw` | Thu hồi consent | TRU-03 / TRU-04 | Privacy requests/data subjects | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 455 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/contact-suppressions` | Tạo suppression | TRU-03 / TRU-04 | Privacy requests/data subjects | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 456 | Trust / Compliance | Privacy & GDPR | `GET` | `.../trust/contact-suppressions` | Danh sách | TRU-03 / TRU-04 | Privacy requests/data subjects | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 457 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/contact-suppressions/{suppressionId}/release` | Gỡ suppression | TRU-03 / TRU-04 | Privacy requests/data subjects | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 458 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/anonymization-plans` | Tạo anonymization plan | TRU-03 / TRU-04 | Privacy requests/data subjects | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 459 | Trust / Compliance | Privacy & GDPR | `GET` | `.../trust/anonymization-plans` | Danh sách | TRU-03 / TRU-04 | Privacy requests/data subjects | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 460 | Trust / Compliance | Privacy & GDPR | `GET` | `.../trust/anonymization-plans/{planId}` | Lấy theo ID | TRU-03 / TRU-04 | Privacy requests/data subjects | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 461 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/anonymization-plans/{planId}/dry-run` | Dry run | TRU-03 / TRU-04 | Privacy requests/data subjects | Long-running action + status panel | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 462 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/anonymization-plans/{planId}/execute` | Thực thi | TRU-03 / TRU-04 | Privacy requests/data subjects | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 463 | Trust / Compliance | Privacy & GDPR | `POST` | `.../trust/anonymization-plans/{planId}/cancel` | Huỷ | TRU-03 / TRU-04 | Privacy requests/data subjects | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 464 | Trust / Compliance | Retention & Legal Hold | `POST` | `.../trust/retention-policies` | Tạo retention policy | TRU-05 | Retention | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 465 | Trust / Compliance | Retention & Legal Hold | `GET` | `.../trust/retention-policies` | Danh sách | TRU-05 | Retention | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 466 | Trust / Compliance | Retention & Legal Hold | `GET` | `.../trust/retention-policies/{policyId}` | Lấy theo ID | TRU-05 | Retention | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 467 | Trust / Compliance | Retention & Legal Hold | `POST` | `.../trust/retention-policies/{policyId}/dry-run` | Dry run | TRU-05 | Retention | Long-running action + status panel | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 468 | Trust / Compliance | Retention & Legal Hold | `GET` | `.../trust/retention-jobs` | Danh sách retention jobs | TRU-05 | Retention | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 469 | Trust / Compliance | Retention & Legal Hold | `POST` | `.../trust/legal-holds` | Tạo legal hold | TRU-05 | Retention | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 470 | Trust / Compliance | Retention & Legal Hold | `GET` | `.../trust/legal-holds` | Danh sách | TRU-05 | Retention | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 471 | Trust / Compliance | Retention & Legal Hold | `GET` | `.../trust/legal-holds/{holdId}` | Lấy theo ID | TRU-05 | Retention | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 472 | Trust / Compliance | Retention & Legal Hold | `POST` | `.../trust/legal-holds/{holdId}/release` | Giải phóng | TRU-05 | Retention | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 473 | Trust / Compliance | Access Review & Compliance Evidence | `POST` | `.../trust/access-review-campaigns` | Tạo access review campaign | TRU-06 | Access review campaigns | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 474 | Trust / Compliance | Access Review & Compliance Evidence | `GET` | `.../trust/access-review-campaigns` | Danh sách | TRU-06 | Access review campaigns | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 475 | Trust / Compliance | Access Review & Compliance Evidence | `GET` | `.../trust/access-review-campaigns/{campaignId}` | Lấy theo ID | TRU-06 | Access review campaigns | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 476 | Trust / Compliance | Access Review & Compliance Evidence | `POST` | `.../trust/access-review-campaigns/{campaignId}/start` | Bắt đầu | TRU-06 | Access review campaigns | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 477 | Trust / Compliance | Access Review & Compliance Evidence | `POST` | `.../trust/access-review-campaigns/{campaignId}/complete` | Hoàn thành | TRU-06 | Access review campaigns | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 478 | Trust / Compliance | Access Review & Compliance Evidence | `POST` | `.../trust/access-review-campaigns/{campaignId}/cancel` | Huỷ | TRU-06 | Access review campaigns | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 479 | Trust / Compliance | Access Review & Compliance Evidence | `POST` | `.../trust/access-review-campaigns/{campaignId}/findings` | Thêm finding | TRU-06 | Access review campaigns | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 480 | Trust / Compliance | Access Review & Compliance Evidence | `GET` | `.../trust/permission-review-findings` | Danh sách findings | TRU-06 | Access review campaigns | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 481 | Trust / Compliance | Access Review & Compliance Evidence | `POST` | `.../trust/permission-review-findings/{findingId}/resolve` | Resolve | TRU-06 | Access review campaigns | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 482 | Trust / Compliance | Access Review & Compliance Evidence | `POST` | `.../trust/permission-review-findings/{findingId}/dismiss` | Dismiss | TRU-06 | Access review campaigns | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 483 | Trust / Compliance | Access Review & Compliance Evidence | `POST` | `.../trust/evidence-records` | Tạo compliance evidence | TRU-06 | Access review campaigns | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 484 | Trust / Compliance | Access Review & Compliance Evidence | `GET` | `.../trust/evidence-records` | Danh sách | TRU-06 | Access review campaigns | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 485 | Trust / Compliance | Access Review & Compliance Evidence | `GET` | `.../trust/evidence-records/{evidenceId}` | Lấy theo ID | TRU-06 | Access review campaigns | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 486 | Trust / Compliance | Access Review & Compliance Evidence | `POST` | `.../trust/evidence-records/{evidenceId}/finalize` | Finalize | TRU-06 | Access review campaigns | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 487 | ServiceSupport | Support Cases | `POST` | `.../support/cases` | Tạo support case | SUP-02 / SUP-03 | Support Case Center/Workbench | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 488 | ServiceSupport | Support Cases | `GET` | `.../support/cases` | Danh sách | SUP-02 / SUP-03 | Support Case Center/Workbench | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 489 | ServiceSupport | Support Cases | `POST` | `.../support/cases/{caseId}/triage` | Triage (body: `ownerUserId`, `slaPolicyId`) | SUP-02 / SUP-03 | Support Case Center/Workbench | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 490 | ServiceSupport | Support Cases | `POST` | `.../support/cases/{caseId}/resolve` | Resolve | SUP-02 / SUP-03 | Support Case Center/Workbench | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 491 | ServiceSupport | Support Cases | `POST` | `.../support/cases/{caseId}/close` | Đóng | SUP-02 / SUP-03 | Support Case Center/Workbench | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 492 | ServiceSupport | Support Cases | `GET` | `.../support/cases/{caseId}/comments` | Danh sách comments | SUP-02 / SUP-03 | Support Case Center/Workbench | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 493 | ServiceSupport | Support Cases | `POST` | `.../support/cases/{caseId}/comments` | Thêm comment (body: `body`, `visibility`) | SUP-02 / SUP-03 | Support Case Center/Workbench | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 494 | ServiceSupport | Support Cases | `GET` | `.../support/cases/{caseId}/assignments` | Danh sách assignments | SUP-02 / SUP-03 | Support Case Center/Workbench | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 495 | ServiceSupport | Support Cases | `POST` | `.../support/cases/{caseId}/assignments` | Gán (body: `assigneeUserId`) | SUP-02 / SUP-03 | Support Case Center/Workbench | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 496 | ServiceSupport | Support Cases | `GET` | `.../support/cases/{caseId}/efforts` | Effort records | SUP-02 / SUP-03 | Support Case Center/Workbench | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 497 | ServiceSupport | Support Cases | `POST` | `.../support/cases/{caseId}/efforts` | Ghi nhận effort (body: `effortHours`, `effortDate`) | SUP-02 / SUP-03 | Support Case Center/Workbench | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 498 | ServiceSupport | Support Cases | `GET` | `.../support/cases/{caseId}/status-history` | Lịch sử status | SUP-02 / SUP-03 | Support Case Center/Workbench | Status/summary query → dashboard or job panel | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 499 | ServiceSupport | SLA | `POST` | `.../support/sla-policies` | Tạo SLA policy | SUP-01 / SUP-06 | SLA metrics/configuration | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 500 | ServiceSupport | SLA | `GET` | `.../support/sla-policies` | Danh sách | SUP-01 / SUP-06 | SLA metrics/configuration | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 501 | ServiceSupport | SLA | `POST` | `.../support/sla-targets` | Tạo SLA target | SUP-01 / SUP-06 | SLA metrics/configuration | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 502 | ServiceSupport | SLA | `GET` | `.../support/sla-targets` | Danh sách | SUP-01 / SUP-06 | SLA metrics/configuration | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 503 | ServiceSupport | SLA | `GET` | `.../support/sla-clocks` | Active SLA clocks | SUP-01 / SUP-06 | SLA metrics/configuration | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 504 | ServiceSupport | SLA | `GET` | `.../support/sla-breaches` | SLA breaches | SUP-01 / SUP-06 | SLA metrics/configuration | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 505 | ServiceSupport | Queues & Request Types | `POST` | `.../support/queues` | Tạo support queue | SUP-06 | Queues/request types | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 506 | ServiceSupport | Queues & Request Types | `GET` | `.../support/queues` | Danh sách | SUP-06 | Queues/request types | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 507 | ServiceSupport | Queues & Request Types | `POST` | `.../support/request-types` | Tạo request type | SUP-06 | Queues/request types | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 508 | ServiceSupport | Queues & Request Types | `GET` | `.../support/request-types` | Danh sách | SUP-06 | Queues/request types | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 509 | ServiceSupport | Queues & Request Types | `POST` | `.../support/request-types/{requestTypeId}/disable` | Disable | SUP-06 | Queues/request types | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 510 | ServiceSupport | Queues & Request Types | `POST` | `.../support/request-types/{requestTypeId}/enable` | Enable | SUP-06 | Queues/request types | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 511 | ServiceSupport | Incidents & Problems | `POST` | `.../support/incidents` | Tạo incident | SUP-04 | Incident Center | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 512 | ServiceSupport | Incidents & Problems | `GET` | `.../support/incidents` | Danh sách | SUP-04 | Incident Center | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 513 | ServiceSupport | Incidents & Problems | `POST` | `.../support/incidents/{incidentId}/acknowledge` | Acknowledge | SUP-04 | Incident Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 514 | ServiceSupport | Incidents & Problems | `POST` | `.../support/incidents/{incidentId}/resolve` | Resolve | SUP-04 | Incident Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 515 | ServiceSupport | Incidents & Problems | `POST` | `.../support/incidents/{incidentId}/close` | Đóng | SUP-04 | Incident Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 516 | ServiceSupport | Incidents & Problems | `GET` | `.../support/incidents/{incidentId}/timeline` | Timeline | SUP-04 | Incident Center | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 517 | ServiceSupport | Incidents & Problems | `POST` | `.../support/incidents/{incidentId}/timeline` | Thêm timeline entry | SUP-04 | Incident Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 518 | ServiceSupport | Incidents & Problems | `POST` | `.../support/problems` | Tạo problem | SUP-04 | Incident Center | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 519 | ServiceSupport | Incidents & Problems | `GET` | `.../support/problems` | Danh sách | SUP-04 | Incident Center | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 520 | ServiceSupport | Incidents & Problems | `POST` | `.../support/problems/{problemId}/resolve` | Resolve | SUP-04 | Incident Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 521 | ServiceSupport | Incidents & Problems | `POST` | `.../support/problems/{problemId}/close` | Đóng | SUP-04 | Incident Center | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 522 | ServiceSupport | Maintenance | `POST` | `.../support/maintenance-plans` | Tạo maintenance plan | SUP-05 / SUP-06 | Maintenance operation/config | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 523 | ServiceSupport | Maintenance | `GET` | `.../support/maintenance-plans` | Danh sách | SUP-05 / SUP-06 | Maintenance operation/config | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 524 | ServiceSupport | Maintenance | `POST` | `.../support/maintenance-windows` | Tạo maintenance window | SUP-05 / SUP-06 | Maintenance operation/config | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 525 | ServiceSupport | Maintenance | `GET` | `.../support/maintenance-windows` | Danh sách | SUP-05 / SUP-06 | Maintenance operation/config | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 526 | ServiceSupport | Maintenance | `POST` | `.../support/maintenance-activities` | Tạo activity | SUP-05 / SUP-06 | Maintenance operation/config | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 527 | ServiceSupport | Maintenance | `GET` | `.../support/maintenance-activities` | Danh sách | SUP-05 / SUP-06 | Maintenance operation/config | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 528 | ServiceSupport | Escalation & Warranty | `POST` | `.../support/escalation-rules` | Tạo escalation rule | SUP-06 | Escalation/warranty settings | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 529 | ServiceSupport | Escalation & Warranty | `GET` | `.../support/escalation-rules` | Danh sách | SUP-06 | Escalation/warranty settings | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 530 | ServiceSupport | Escalation & Warranty | `POST` | `.../support/escalation-rules/{ruleId}/enable` | Enable | SUP-06 | Escalation/warranty settings | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 531 | ServiceSupport | Escalation & Warranty | `POST` | `.../support/escalation-rules/{ruleId}/disable` | Disable | SUP-06 | Escalation/warranty settings | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 532 | ServiceSupport | Escalation & Warranty | `POST` | `.../support/warranties` | Tạo warranty coverage | SUP-06 | Escalation/warranty settings | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 533 | ServiceSupport | Escalation & Warranty | `GET` | `.../support/warranties` | Danh sách | SUP-06 | Escalation/warranty settings | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 534 | ServiceSupport | Escalation & Warranty | `POST` | `.../support/warranties/{warrantyId}/expire` | Expire | SUP-06 | Escalation/warranty settings | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 535 | ServiceSupport | Service Profile & Cost | `POST` | `.../support/service-profiles` | Tạo service profile | SUP-06 | Service profile/cost settings | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 536 | ServiceSupport | Service Profile & Cost | `GET` | `.../support/service-profiles` | Danh sách | SUP-06 | Service profile/cost settings | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 537 | ServiceSupport | Service Profile & Cost | `GET` | `.../support/cost-inputs` | Danh sách cost inputs | SUP-06 | Service profile/cost settings | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 538 | ServiceSupport | Service Profile & Cost | `POST` | `.../support/cost-inputs` | Tạo cost input | SUP-06 | Service profile/cost settings | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 539 | ServiceSupport | Service Profile & Cost | `POST` | `.../support/cost-inputs/{inputId}/approve` | Phê duyệt | SUP-06 | Service profile/cost settings | Lifecycle action + confirmation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 540 | ServiceSupport | Service Profile & Cost | `GET` | `.../support/efforts` | Tất cả effort records trong workspace | SUP-06 | Service profile/cost settings | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 541 | ServiceSupport | Service Profile & Cost | `POST` | `.../support/efforts/{effortId}/cancel` | Huỷ effort record | SUP-06 | Service profile/cost settings | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 542 | ServiceSupport | Handover & Knowledge | `POST` | `.../support/handover-packages` | Tạo handover package | SUP-07 | Handover & Knowledge | Create form/wizard or queue action | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 543 | ServiceSupport | Handover & Knowledge | `GET` | `.../support/handover-packages` | Danh sách | SUP-07 | Handover & Knowledge | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 544 | ServiceSupport | Handover & Knowledge | `POST` | `.../support/handover-packages/{packageId}/finalize` | Finalize | SUP-07 | Handover & Knowledge | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 545 | ServiceSupport | Handover & Knowledge | `GET` | `.../support/handover-packages/{packageId}/items` | Danh sách items | SUP-07 | Handover & Knowledge | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 546 | ServiceSupport | Handover & Knowledge | `POST` | `.../support/handover-packages/{packageId}/items` | Thêm item | SUP-07 | Handover & Knowledge | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 547 | ServiceSupport | Handover & Knowledge | `POST` | `.../support/knowledge-links` | Link case với knowledge doc | SUP-07 | Handover & Knowledge | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 548 | ServiceSupport | Handover & Knowledge | `GET` | `.../support/knowledge-links` | Danh sách | SUP-07 | Handover & Knowledge | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 549 | ServiceSupport | Handover & Knowledge | `POST` | `.../support/work-links` | Link case với task/project | SUP-07 | Handover & Knowledge | Command/action mutation | `UI_ACTION` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 550 | ServiceSupport | Handover & Knowledge | `GET` | `.../support/work-links` | Danh sách | SUP-07 | Handover & Knowledge | List/search query → table, picker, feed or catalog | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 551 | ServiceSupport | Dashboard & Metrics | `GET` | `.../support/dashboard` | Support dashboard summary | SUP-01 | Support Dashboard | Status/summary query → dashboard or job panel | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |
| 552 | ServiceSupport | Dashboard & Metrics | `GET` | `.../support/metric-snapshots` | Metric snapshots | SUP-01 | Support Dashboard | Detail query → route, drawer or inspector | `UI_READ` | MAPPED — implementation pending | UI_TESTED | TODO | TODO if applicable |

## 27.3 Reconciliation checklist

- [ ] So sánh số endpoint trong OpenAPI với register.
- [ ] Bổ sung endpoint bị bỏ sót do contract markdown dùng format khác.
- [ ] Xác nhận full path cho các row dùng `...`.
- [ ] Gán permission/capability cho từng endpoint user-facing.
- [ ] Gán query/mutation hook.
- [ ] Gán cache invalidation cho từng mutation.
- [ ] Thêm test evidence.
- [ ] Phê duyệt mọi non-UI exception.
- [ ] Đóng mọi contract blocker bắt buộc.
- [ ] Chạy automated coverage check trong CI.

## 27.4 CI gate đề xuất

CI phải fail nếu:

```text
endpoint not found in register
OR status in [UNMAPPED, MAPPED, IN_IMPLEMENTATION, UI_IMPLEMENTED]
OR user-facing endpoint has no test evidence
OR non-UI endpoint has no approved exception
OR required blocker remains open
```

Chỉ chấp nhận trạng thái kết thúc:

```text
UI_TESTED
SERVICE_ORCHESTRATED
PUBLIC_EXTERNAL
LEGACY_COMPATIBILITY
APPROVED_NON_UI_EXCEPTION
```

`CONTRACT_BLOCKED` không phải trạng thái hoàn thành cho phạm vi bắt buộc.
