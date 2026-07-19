# SCOPERY WAVE 2 — UI/UX IMPLEMENTATION SPEC

> **Phạm vi:** Project · Scope · RAID · Collaboration · Notification  
> **Mục tiêu:** Chuyển toàn bộ API Wave 2 thành hệ thống giao diện rõ ràng, dễ dùng, không nhồi tất cả chức năng vào một sidebar duy nhất.
>
> **Nguyên tắc cốt lõi:**  
> - Một sidebar tại một thời điểm.  
> - Sidebar thay đổi theo context: Workspace, Project hoặc Admin.  
> - Không biến mỗi controller/API thành một menu riêng.  
> - Dùng hub page, master-detail, drawer, command palette và full-screen workbench để giảm tải navigation.

---

# 1. Kiến trúc tổng thể

Wave 2 được chia thành ba không gian:

```text
WORKSPACE APP
├── Projects
├── Notifications
└── Notification Settings

PROJECT WORKBENCH
├── Overview
├── Plan
│   ├── Work Items
│   ├── WBS
│   ├── Timeline
│   └── Schedule
├── Scope
│   ├── Scope Register
│   └── Deliverables
├── Governance
│   ├── RAID
│   └── Decisions
├── Collaboration
│   └── Meetings
├── Reports
└── Project Settings

ADMIN CONSOLE
├── Project Standards
│   ├── Phase Definitions
│   ├── Project Templates
│   └── Template Builder
└── Notification Administration
    ├── Overview
    ├── Email Templates
    ├── Email Rules
    ├── Delivery Operations
    └── Reminder / Alert / Digest Rules
```

Không dùng một sidebar duy nhất chứa toàn bộ các mục trên.

---

# 2. App Shell

## 2.1 Global Header

Global Header dùng chung cho toàn bộ hệ thống.

```text
Logo
Organization / Workspace Switcher
Context Indicator
Global Search / Command Palette
Quick Create
Notifications
Help
User Menu
```

### Context Indicator

Hiển thị rõ người dùng đang ở:

```text
Workspace
Project
Admin
```

Ví dụ:

```text
Archetype / Testing / PRJ-001 Digital Transformation
```

## 2.2 Context Sidebar

Sidebar thay đổi theo context.

### Workspace Sidebar

```text
WORKSPACE
Overview
Activity
Projects
Clients & Contacts
Forms
Document Hub
Directory

PERSONAL
Notifications
My Settings

ADMINISTRATION
Admin Console
```

### Project Sidebar

```text
PROJECT
Overview

PLAN
Work Items
WBS
Timeline
Schedule

SCOPE
Scope
Deliverables

GOVERNANCE
RAID
Decisions

COLLABORATION
Meetings

INSIGHTS
Reports

Project Settings
```

### Admin Sidebar

```text
ADMIN
Overview

PROJECT STANDARDS
Phase Definitions
Project Templates

NOTIFICATIONS
Notification Overview
Email Templates
Email Rules
Delivery Operations
Automation Rules
```

---

# 3. Vai trò người dùng

| Persona | Không gian mặc định | Chức năng chính |
|---|---|---|
| Workspace Member | Workspace App | Mở project, xem notification, chỉnh preferences |
| Project Member | Project Workbench | Task, comment, meeting, RAID được cấp quyền |
| Project Manager | Project Workbench | Quản lý project, phase, WBS, schedule, scope, RAID |
| Reviewer | Project Workbench | Review deliverable, minutes |
| Template Admin | Admin Console | Phase definitions, project templates |
| Notification Admin | Admin Console | Template/rule/automation |
| Notification Operator | Admin Console | Delivery, outbox, retry |
| Auditor | Read-only | Reports, decisions, RAID, delivery logs |

Không hard-code navigation theo role name. Menu phải dựa trên capability/permission.

---

# 4. Route Structure

```text
WORKSPACE
/w/:workspaceId/projects
/w/:workspaceId/notifications
/w/:workspaceId/settings/notifications

PROJECT
/w/:workspaceId/p/:projectId/overview
/w/:workspaceId/p/:projectId/work
/w/:workspaceId/p/:projectId/work/:taskId
/w/:workspaceId/p/:projectId/wbs
/w/:workspaceId/p/:projectId/timeline
/w/:workspaceId/p/:projectId/schedule
/w/:workspaceId/p/:projectId/scope
/w/:workspaceId/p/:projectId/deliverables
/w/:workspaceId/p/:projectId/deliverables/:deliverableId
/w/:workspaceId/p/:projectId/raid
/w/:workspaceId/p/:projectId/decisions
/w/:workspaceId/p/:projectId/meetings
/w/:workspaceId/p/:projectId/meetings/:meetingId
/w/:workspaceId/p/:projectId/reports
/w/:workspaceId/p/:projectId/settings

ADMIN
/admin/project/phase-definitions
/admin/w/:workspaceId/project-templates
/admin/w/:workspaceId/project-templates/:templateId
/admin/w/:workspaceId/project-templates/:templateId/versions/:versionId

/admin/notifications
/admin/notifications/email-templates
/admin/notifications/email-templates/:templateId
/admin/notifications/email-rules
/admin/notifications/deliveries
/admin/w/:workspaceId/notifications/automation
```

---

# 5. Danh sách màn hình

| ID | Trang | Context |
|---|---|---|
| WS-01 | Project Directory | Workspace |
| NT-01 | Notification Inbox | Workspace |
| NT-02 | Notification Settings | Workspace |
| PRJ-01 | Project Overview | Project |
| PLN-01 | Work Items | Project |
| PLN-02 | WBS | Project |
| PLN-03 | Timeline / Gantt | Project |
| PLN-04 | Schedule Diagnostics | Project |
| SCP-01 | Scope Register | Project |
| SCP-02 | Deliverables & Acceptance | Project |
| GOV-01 | RAID Register | Project |
| GOV-02 | Decision Log | Project |
| COL-01 | Meetings | Project |
| COL-02 | Meeting Workspace | Project |
| RPT-01 | Project Reports | Project |
| SET-01 | Project Settings | Project |
| ADM-01 | Phase Definitions | Admin |
| ADM-02 | Project Template Library | Admin |
| ADM-03 | Project Template Builder | Admin |
| NAD-01 | Notification Admin Overview | Admin |
| NAD-02 | Email Template Studio | Admin |
| NAD-03 | Email Rules | Admin |
| NAD-04 | Delivery Operations | Admin |
| NAD-05 | Automation Rules | Admin |

---

# 6. Workspace App

# WS-01 — Project Directory

## API

- Create project.
- Get project.
- Search projects.
- Update project.
- Activate.
- Hold.
- Complete.
- Archive.
- Apply project template.

## UI

```text
Project Directory                              [Create project]

[Search projects..............................]
[Status] [Owner] [Sort] [Columns] [Refresh]

Table / Cards
```

### Table columns

```text
Project
Code
Owner
Status
Planned Start
Planned End
Currency
Updated
Actions
```

### Create Project Wizard

1. Name and code.
2. Owner.
3. Planned dates.
4. Currency.
5. Blank project or template.
6. Review.

### Detail behavior

Click project mở Project Workbench.

Không mở project bằng modal.

---

# NT-01 — Notification Inbox

## API

- Notification list.
- Unread count.
- Mark read.
- Read all.
- Dismiss.
- Reminder list.
- Snooze.
- Dismiss reminder.
- Alert list.
- Acknowledge.
- Dismiss alert.

## Layout

```text
Inbox | Reminders | Alerts

Notification List        Selected Notification
```

### Notification item

- Source.
- Title.
- Body preview.
- Severity.
- Priority.
- Context.
- Time.
- Unread state.
- Mandatory state.
- Primary action.

### Action URL

Không điều hướng trực tiếp bằng URL từ backend.

Frontend phải có `NotificationActionResolver`:

```text
Parse target
Validate internal route
Map entity type
Validate workspace/project context
Open correct drawer/page
Fallback to notification detail
```

### Polling

Nếu chưa có WebSocket/SSE:

- Unread count: 30–60 giây.
- Refresh khi focus browser.
- Refresh inbox khi mở trang.
- Dừng polling khi tab hidden.

---

# NT-02 — Notification Settings

## API

- Preferences.
- Channel preferences.
- Subscriptions.
- Digest runs.

## Sections

```text
Delivery Behavior
Channels
Subscriptions
Digest History
```

### Delivery Behavior

- Timezone.
- Immediate/Digest.
- Digest enabled.
- Quiet hours.
- Quiet start/end.

### Channel Matrix

```text
Category                In-app     Email
Task Update             On         On
Project Update          On         Off
RAID                     On         On
Deliverable Review      On         On
Meeting                  On         Off
Comment / Mention       On         On
```

Chỉ render category/channel mà backend hỗ trợ.

---

# 7. Project Workbench

# PRJ-01 — Project Overview

## API

Composition từ:

- Project detail.
- Phases.
- Tasks.
- Milestones.
- Current schedule.
- Scope reports.
- RAID reports.
- Meeting reports.
- Subscription.

## UI

```text
Project Header
Attention Required
Project Pulse
Current Phases
Upcoming Tasks
Upcoming Milestones
Upcoming Meetings
```

### Project Header

- Code.
- Name.
- Status.
- Owner.
- Planned dates.
- Currency.
- Subscribe.
- Quick create.
- Lifecycle actions.

### Attention Required

Chỉ hiển thị item cần hành động:

- Scheduling issue.
- Overdue task.
- Critical risk.
- Deliverable in review.
- Overdue meeting action.
- Failed schedule run.

Không dùng nhiều chart không hỗ trợ quyết định.

---

# PLN-01 — Work Items

## API

- Task CRUD.
- Start.
- Block.
- Complete.
- Cancel.
- Archive.
- Dependencies.
- Milestones.
- Task schedule/history.
- Comments.

## View switcher

```text
List | Board
```

Filter được giữ giữa hai view.

### Filters

- Phase.
- WBS.
- Status.
- Priority.
- Keyword.
- Assignee.
- Due state.

## List View

Columns:

```text
Code / Title
Status
Priority
Assignee
Phase
WBS
Estimate
Planned Start
Due Date
Schedule Risk
Actions
```

## Board View

Columns:

```text
TODO
IN PROGRESS
BLOCKED
COMPLETED
```

Cancelled và Archived không nên là active board columns.

### Drag behavior

Chỉ cho phép transition backend hỗ trợ.

```text
TODO -> IN_PROGRESS
IN_PROGRESS -> BLOCKED
IN_PROGRESS -> COMPLETED
Any supported -> CANCELLED
```

Không giả lập reverse transition nếu API chưa có.

## Task Detail Drawer

Tabs:

```text
Overview
Schedule
Dependencies
Comments
Related
```

Drawer phải có deep link:

```text
/w/:workspaceId/p/:projectId/work/:taskId
```

---

# PLN-02 — WBS

## API

- WBS create.
- Get.
- Search.
- Tree.
- Update.
- Move.
- Archive.
- Scope mappings.
- Task filter by WBS.

## UI

Desktop dùng treegrid:

```text
Code / Title
Type
Phase
Level
Path
Mapped Scope
Status
Actions
```

### Actions

- Add root.
- Add child.
- Edit.
- Move.
- Archive.
- Open tasks.
- Map scope item.

### Drag and drop

Drag chỉ là một cách thao tác.

Bắt buộc có `Move Node` dialog:

- New parent.
- New sort order.
- Preview.
- Confirm.

Không cho node làm parent của chính nó hoặc descendant.

---

# PLN-03 — Timeline / Gantt

## API

- Gantt full view.
- Items.
- Dependencies.
- Issues.
- Critical path.
- Export.
- Recalculate.
- Move task.
- Resize task.
- Clear override.
- Create/delete dependency.

## Layout

```text
Toolbar
├── Date range
├── Zoom
├── Group by
├── Filters
├── Schedule run
├── Recalculate
└── Export

Body
├── Left treegrid
└── Timeline canvas
```

### Timeline elements

- Task bars.
- Milestones.
- Dependency lines.
- Critical path.
- Today marker.
- Unscheduled lane.
- Manual override indicator.
- Scheduling issue indicator.

### Move/resize flow

1. Drag task.
2. Preview old/new date.
3. Enter reason.
4. Select recalculate.
5. Save.
6. Refresh Gantt and issues.
7. Rollback if error.

### Accessibility

Phải có:

- Keyboard treegrid.
- Date editor form.
- Dependency table.
- Critical path list.
- Text label cho task bar.
- Không chỉ dùng màu.

Gantt nên cho phép collapse sidebar để dùng toàn bộ chiều rộng.

---

# PLN-04 — Schedule Diagnostics

## API

- Schedule runs.
- Current schedule.
- Task schedules.
- Daily work.
- Issues.
- Task schedule history.

## Tabs

```text
Current
Runs
Task Schedules
Daily Work
Issues
```

### Runs table

```text
Started
Planning Range
Status
Algorithm
Duration
Error
Actions
```

Pending/Running:

- Auto refresh.
- Cancel.

Failed:

- Error code.
- Error message.
- Retry bằng run mới.

### Task Schedules

```text
Task
Assignee
Estimated Start
Estimated Finish
Scheduled Hours
Unscheduled Hours
Due Gap
Risk
Status
```

---

# 8. Scope

# SCP-01 — Scope Register

## API

- Scope package.
- Import quote.
- Approve.
- Mark current.
- Archive.
- Scope item CRUD.
- WBS mappings.
- Coverage report.

## Layout

```text
Package List
Scope Item Table
Mapping Inspector
```

### Scope Package

- Code.
- Name.
- Status.
- Current.
- Created.
- Approve.
- Mark current.
- Archive.

### Scope Item Table

```text
Code / Title
Type
Scope Classification
Priority
Acceptance Required
WBS Coverage
Status
Actions
```

### Scope Classification

Backend có:

```text
inScope
outOfScope
```

UI phải dùng một control:

```text
In Scope
Out of Scope
Unclassified
```

Không cho chọn đồng thời hai giá trị.

### Approve flow

Hiển thị:

- Unclassified item count.
- Unmapped in-scope item count.
- Acceptance-required count.
- Confirmation.

---

# SCP-02 — Deliverables & Acceptance

## API

- Deliverable CRUD.
- Status.
- Archive.
- Accept.
- Reopen.
- Acceptance criteria.
- Evidence.
- Review.
- Task mappings.
- Reports.

## List columns

```text
Deliverable
Type
Status
Acceptance Required
Criteria Progress
Evidence
Linked Tasks
Review
Actions
```

## Detail tabs

```text
Overview
Acceptance Criteria
Evidence
Review
Linked Tasks
Comments
```

### Acceptance Criteria

- Mandatory.
- Type.
- Status.
- Evidence count.
- Satisfy.
- Waive with reason.

### Evidence

- Type.
- Title.
- Criteria.
- Link.
- Reference.
- Created.

### Review blocker

Contract cần bổ sung:

```text
GET current review by deliverable
GET review list by deliverable
```

Nếu không, Review tab không thể reload ổn định sau khi submit.

---

# 9. Governance

# GOV-01 — RAID Register

## API

- RAID CRUD.
- Status.
- Resolve.
- Close.
- Reopen.
- Escalate.
- Archive.
- Convert risk to issue.
- Create CR draft.
- RAID actions.
- Links.
- Reports.

## View switcher

```text
Register | Risk Matrix | Actions
```

## Register filters

- Type.
- Status.
- Owner.
- Severity.
- Probability.
- Impact.
- Escalation.

## Type-specific UI

### Risk

- Probability.
- Impact.
- Risk score.
- Response strategy.
- Trigger.

### Issue

- Severity.
- Category.
- Root cause.
- Resolution plan.

### Assumption

- Statement.
- Validation status.

### Dependency

- Dependency type.
- Linked target.

## Create RAID Wizard

1. Select type.
2. Common fields.
3. Type-specific fields.
4. Owner/links/actions.
5. Review.

Không hiển thị toàn bộ field của bốn loại trên cùng một form.

## Risk Matrix

- Probability × Impact.
- Cell count.
- Click để filter.
- Có table alternative.
- Không chỉ dùng màu.

---

# GOV-02 — Decision Log

## API

- Decision CRUD.
- Decide.
- Reject.
- Supersede.
- Archive.
- Options.
- Impact.
- Links.
- Reports.

## List columns

```text
Code / Title
Category
Status
Decided At
Decided By
Schedule Impact
Cost Impact
Actions
```

## Detail tabs

```text
Brief
Options
Impact
Links
Comments
```

## Options comparison

```text
Option
Description
Pros
Cons
Estimated Impact
Selected
```

## Contract cần chốt

`DecideDecisionRequest` cần mô tả rõ:

- selectedOptionId.
- outcome.
- reason.
- decidedAt.
- decision không có option có hợp lệ không.

---

# 10. Collaboration

# COL-01 — Meetings

## API

- Meeting CRUD.
- Start.
- Complete.
- Cancel.
- Archive.
- Meeting series.
- Reports.

## Views

```text
Upcoming
Past
Series
```

## List columns

```text
Meeting
Type
Start / End
Timezone
Status
Organizer
Participants
Minutes
Actions
```

## Create Meeting

- Title.
- Description.
- Type.
- Start/end.
- Timezone.
- Location/URL.
- Organizer.
- Series.
- Visibility.
- Participants.
- Initial agenda.

### Meeting series gap

Contract cần rõ:

- Có tự sinh occurrence không.
- Next occurrence.
- Recurrence rule.
- Skip/reschedule occurrence.
- Exceptions.

---

# COL-02 — Meeting Workspace

## Trước meeting

```text
Agenda
Participants
Preparation Notes
Artifacts
```

## Trong meeting

Desktop layout:

```text
Agenda Navigator
Meeting Notes / Minutes
Action / Decision / RAID Capture
```

### Từ note có thể tạo

- Decision.
- RAID item.
- Requirement.
- Change request draft.

### Meeting action

- Owner.
- Due date.
- Agenda source.
- Client visibility.
- Create linked task.

## Sau meeting

Tabs:

```text
Recap
Minutes
Actions
Decisions / RAID
Attendance
Artifacts
Comments
```

### Minutes workflow

```text
DRAFT
IN_REVIEW
APPROVED
REJECTED
```

Actions:

- Submit review.
- Approve.
- Reject with reason.
- Generate document.

### Realtime limitation

Wave 2 chưa có WebSocket/SSE contract.

Không quảng bá live collaboration.

Dùng:

- Save state.
- Refresh on focus.
- Polling có kiểm soát.
- Conflict warning.

---

# 11. Reports

# RPT-01 — Project Reports

## Scope reports

- Scope coverage.
- Deliverable status.
- Acceptance criteria.
- Acceptance evidence.

## RAID reports

- RAID summary.
- Risk register.
- Issue log.
- Assumption log.
- Dependency log.
- RAID actions.
- Decision log.

## Collaboration reports

- Meetings.
- Meeting actions.
- Overdue actions.
- Minutes status.
- Comment activity.

## UI

```text
Report Selector
Filters
Summary
Table / Chart
Export
```

Một số API trả `Map<String,Object>`.

Cần chuẩn hóa DTO trước khi:

- Vẽ chart cố định.
- TypeScript typing.
- Export.
- Viết automated tests.

---

# 12. Project Settings

# SET-01 — Project Settings

Dùng in-page section index:

```text
General
Phases
Lifecycle
Subscription
Danger Zone
```

## General

- Name.
- Description.
- Owner.
- Currency.
- Planned dates.

## Phases

- Ordered list.
- Create manually.
- Create from definition.
- Activate.
- Complete.
- Archive.
- Update dates/order.

## Lifecycle

- Activate.
- Hold.
- Complete.
- Archive.

Mỗi action hiển thị:

- Current state.
- Destination.
- Preconditions.
- Impact.
- Reversibility.

## Subscription

- Subscribe.
- Subscription level.
- Unsubscribe.
- Link to notification settings.

---

# 13. Admin Console

# ADM-01 — Phase Definitions

## API

- System definition.
- Organization definition.
- Workspace definition.
- Search.
- Update.
- Activate/deactivate/archive.

## UI

Filter theo scope:

```text
System
Organization
Workspace
```

Columns:

```text
Code / Name
Scope
Display Order
Default
Status
Updated
Actions
```

Không làm người dùng hiểu nhầm rằng sửa definition sẽ tự cập nhật phase đã được tạo trong project.

---

# ADM-02 — Project Template Library

## API

- Template CRUD/lifecycle.
- Versions.
- Apply.

## Filters

- Scope.
- Workspace.
- Organization.
- Category.
- Visibility.
- Status.
- Keyword.

## Actions

- Create.
- Edit metadata.
- Open builder.
- Activate.
- Deactivate.
- Archive.
- Apply.
- Duplicate version.

## Apply Wizard

1. Select published version.
2. Project identity.
3. Owner/currency/dates.
4. Include tasks.
5. Include dependencies.
6. Copy estimates.
7. Review.
8. Apply.

---

# ADM-03 — Project Template Builder

## API

- Versions.
- Template phases.
- Tasks.
- Dependencies.
- WBS.
- Publish.
- Duplicate.
- Archive.

## Full-screen Builder

```text
Structure
Tasks
Dependencies
Preview
```

### Structure

- Phase list.
- WBS tree.
- Move.
- Delete.
- Cascade warning.

### Tasks

- Phase.
- WBS.
- Default priority.
- Estimate.
- Offset.
- Default role.
- Deliverable type.

### Dependencies

- Graph.
- Table.
- Add/remove.
- Cycle validation.

### Preview

- Simulated project start.
- Derived dates.
- Included objects.
- Errors.
- Warnings.

### Version behavior

- Draft: editable.
- Published: read-only.
- Archived: read-only.
- Edit published bằng duplicate/new draft.

---

# NAD-01 — Notification Admin Overview

## UI

- Rules count.
- Template status.
- Delivery status.
- Outbox failures.
- Suppressions.
- Recent failed deliveries.
- Workspace filter.
- Quick links.

Không hiển thị fake real-time status.

---

# NAD-02 — Email Template Studio

## API

- Email template CRUD.
- Versions.
- Publish.
- Preview.

## Full-screen layout

```text
Metadata
Version Selector
Subject Editor
HTML Editor
Text Editor
Variables
Preview
```

## Security

- Sanitize HTML.
- Preview trong sandboxed iframe.
- Không execute script.
- Cảnh báo sensitive variable.
- Không lưu sample PII trong localStorage.

---

# NAD-03 — Email Rules

## API

- Rule CRUD.
- Activate/deactivate.
- Enable/disable.

## Rule editor

1. Trigger/event.
2. Template.
3. Recipient strategy.
4. Priority.
5. Mandatory.
6. Sensitive variables.
7. Scope.
8. Review.

Contract có cả:

```text
status
enabled
```

UI phải giải thích:

- Status = lifecycle.
- Enabled = rule có đang chạy không.

Không đặt hai toggle cạnh nhau mà không có mô tả.

---

# NAD-04 — Delivery Operations

## Tabs

```text
Deliveries
Outbox
Suppressions
```

## Deliveries columns

```text
Recipient
Subject
Rule
Template Version
Event
Workspace
Status
Failure
Created
```

## Outbox

- Provider.
- Status.
- Delivery.
- Failure.
- Retry.
- Cancel.

Retry không dùng optimistic update.

## Suppressions

- User.
- Category.
- Channel.
- Reason.
- Source.
- Suppressed at.
- Expires.

---

# NAD-05 — Automation Rules

## Tabs

```text
Reminder Rules
Alert Rules
Digest Rules
Digest Runs
```

Không xây generic JSON rule builder trước khi backend cung cấp đầy đủ:

- Request schema.
- Response schema.
- Conditions.
- Schedule.
- Recipients.
- Update/delete.
- Lifecycle.

---

# 14. Shared Components

## ProjectShell

- Project switcher.
- Status.
- Sidebar.
- Subscribe.
- Quick create.
- Permission-aware actions.

## EntityDetailDrawer

Dùng cho:

- Task.
- Deliverable.
- RAID.
- Decision.
- Notification.

Yêu cầu:

- Deep link.
- Browser back.
- Tabs.
- Sticky header/footer.
- Full screen trên mobile.

## Command Palette

```text
Cmd/Ctrl + K
```

Dùng để:

- Tìm project.
- Tìm task.
- Tìm member.
- Mở admin.
- Quick create.
- Chuyển workspace.

## Quick Create

### Project context

- Task.
- Milestone.
- RAID.
- Decision.
- Meeting.
- Deliverable.

## LifecycleActionRegistry

Mỗi action khai báo:

```text
Current status
Destination status
Endpoint
Permission
Confirmation
Reason required
Cache invalidation
Optimistic allowed
```

## ContextualCommentPanel

- Thread.
- Reply.
- Mention.
- Resolve.
- Client visibility.
- Soft delete.

## EntityLinkPicker

- Target type.
- Search entity.
- Relationship type.
- Preview.
- Create mapping/link.

Không nhập UUID.

---

# 15. API Integration

## Cache key gợi ý

```text
projects(workspaceId, filters)
project(projectId)
tasks(projectId, filters)
task(projectId, taskId)
wbsTree(projectId, phaseId)
gantt(projectId, runId, filters)
scheduleRuns(projectId)
currentSchedule(projectId)
scopePackages(projectId)
deliverables(projectId)
raidItems(projectId, type)
decisions(projectId)
meetings(projectId)
notifications(userId, filters)
notificationUnreadCount(userId)
notificationPreferences(workspaceId, userId)
templates(scope, workspaceId, filters)
emailRules(filters)
emailDeliveries(filters)
```

## Optimistic UI có thể dùng

- Mark notification read.
- Resolve comment thread.
- Edit simple title.
- Local drag preview.

## Không dùng optimistic UI

- Task lifecycle.
- Project lifecycle.
- Gantt save.
- Recalculate schedule.
- Scope approve.
- Deliverable accept/reopen.
- RAID resolve/escalate.
- Decision decide.
- Minutes approve.
- Template publish.
- Email retry.

---

# 16. Responsive Strategy

## Desktop

- Full context sidebar.
- Right inspector.
- Gantt full width.
- WBS treegrid.
- Builder.

## Tablet

- Collapsible sidebar.
- Full-width drawer.
- Filter side sheet.
- Simplified Gantt.

## Mobile

Ưu tiên:

- Project overview.
- Task list/detail.
- RAID.
- Meeting agenda/actions.
- Notification inbox.
- Deliverable review.
- Comments.

Giới hạn:

- WBS edit.
- Gantt edit.
- Template builder.
- Email HTML editor.
- Decision comparison rộng.

---

# 17. Accessibility

Mục tiêu WCAG 2.2 AA.

## Board

- Keyboard move.
- Announce destination.
- Không bắt buộc drag.

## WBS

- Treegrid keyboard navigation.
- Expand/collapse.
- Alternative move dialog.

## Gantt

- Text equivalent.
- Dependency table.
- Critical path list.
- Manual date editor.
- Không chỉ dùng màu.

## Risk Matrix

- Table alternative.
- Cell label đầy đủ.
- Không chỉ dùng đỏ/vàng/xanh.

## Notification

- Accessible unread badge.
- Read/unread announced.
- Dismiss button có label rõ.

---

# 18. Contract Gap Matrix

| Severity | Gap | UI Impact | Recommendation |
|---|---|---|---|
| Critical | Không có current/list deliverable review | Review tab không reload ổn định | Bổ sung review endpoints |
| Critical | Thiếu schema DecideDecisionRequest | Không thể thiết kế decide flow chính xác | Chốt contract |
| Critical | actionUrl notification chưa an toàn | Deep link dễ sai hoặc nguy hiểm | Dùng structured target |
| High | Task thiếu reverse transitions | Board không hoàn chỉnh | Bổ sung transition API |
| High | Không có My Work aggregate | Không có personal dashboard tốt | Bổ sung workspace aggregate |
| High | Nhiều list chưa pagination/filter | Scale kém | Chuẩn hóa list API |
| High | Report trả Map<String,Object> | FE không type-safe | DTO cố định |
| High | Không có realtime contract | Meeting/comment/inbox không live | SSE/WebSocket hoặc polling policy |
| High | Meeting series chưa có occurrence contract | Series UI dễ hiểu sai | Bổ sung recurrence |
| High | Automation rule schema chưa đủ | Không build rule builder được | Bổ sung schema/lifecycle |
| High | Version có nhưng lock strategy chưa rõ | Có thể overwrite dữ liệu | ETag/version contract |
| Medium | inScope/outOfScope là hai boolean | Có thể mâu thuẫn | Dùng enum/enforce |
| Medium | Criteria không update/archive | Không sửa được | Bổ sung lifecycle |
| Medium | Evidence không update/delete | Không sửa lỗi | Bổ sung lifecycle |
| Medium | Comments không pagination | Thread lớn chậm | Pagination |
| Medium | RAID filter còn hạn chế | Register lớn khó dùng | Search/status/owner/page |
| Medium | Meeting list thiếu date/page filter | Scale kém | Date range/pagination |
| Medium | Email rule active và enabled | Dễ nhầm | Document state model |

---

# 19. Backend Additions đề xuất

## Project Overview Aggregate

```text
GET /api/v1/projects/{projectId}/overview
```

## Attention Items

```text
GET /api/v1/projects/{projectId}/attention-items
```

## My Work

```text
GET /api/v1/workspaces/{workspaceId}/my-work
```

## Structured Notification Target

```json
{
  "actionType": "NAVIGATE",
  "target": {
    "workspaceId": "uuid",
    "projectId": "uuid",
    "entityType": "TASK",
    "entityId": "uuid",
    "view": "DETAIL"
  }
}
```

## Task Transitions

```text
GET /tasks/{id}/available-transitions
POST /tasks/{id}/transition
```

## Deliverable Reviews

```text
GET /projects/{projectId}/deliverables/{deliverableId}/reviews
GET /projects/{projectId}/deliverables/{deliverableId}/reviews/current
```

---

# 20. Thứ tự triển khai

## P0 — Foundation

1. Context-aware App Shell.
2. Project Sidebar.
3. Admin Sidebar.
4. Route guards.
5. Command palette.
6. Quick create.
7. Entity drawer.
8. Lifecycle registry.
9. Error/trace handling.
10. Polling/job framework.

## P1 — Core Project

1. Project Directory.
2. Project Overview.
3. Work Items List.
4. Task Drawer.
5. Board.
6. Project Settings.

## P2 — Planning

1. WBS.
2. Gantt read-only.
3. Gantt edit.
4. Schedule Diagnostics.
5. Dependencies.
6. Milestones.

## P3 — Scope & Governance

1. Scope Register.
2. Deliverables.
3. Acceptance.
4. RAID.
5. Decisions.
6. Reports.

## P4 — Collaboration

1. Meetings.
2. Meeting Workspace.
3. Minutes.
4. Meeting Actions.
5. Artifact conversion.
6. Comments.

## P5 — User Notifications

1. Inbox.
2. Badge.
3. Reminders.
4. Alerts.
5. Preferences.
6. Subscriptions.

## P6 — Admin

1. Phase Definitions.
2. Template Library.
3. Template Builder.
4. Email Template Studio.
5. Email Rules.
6. Delivery Operations.
7. Automation Rules.

---

# 21. Definition of Done

Mỗi màn hình chỉ hoàn thành khi:

- Có route.
- Có permission guard.
- Có loading.
- Có empty state.
- Có filtered-empty state.
- Có error state.
- Có forbidden state.
- Có API mapping.
- Có cache invalidation.
- Có lifecycle handling.
- Có null handling.
- Có timezone handling.
- Có keyboard navigation.
- Có mobile strategy.
- Có trace ID.
- Có test happy path.
- Có test permission denied.
- Có test business-rule error.
- Có accessibility smoke test.
- Không nhập UUID trực tiếp.
- Không dùng raw JSON làm primary UX.
- Không nested modal.
- Không optimistic update action quan trọng.
- Không dùng màu làm tín hiệu duy nhất.
- Không triển khai feature khi contract chưa đủ mà không có feature flag.
