# SCOPERY WAVE 3 — UI/UX API PAGE MAPPING & IMPLEMENTATION SPEC

> **Wave:** Resource Capacity · Profitability · Estimation · Quote · Project Baseline · Project Finance  
> **Nguồn contract:** `WAVE3_API_CONTRACT.md`  
> **Quy mô:** khoảng 231 REST endpoints.
>
> **Mục tiêu:** Chuyển API Wave 3 thành hệ thống giao diện quản lý nguồn lực, ước tính, tài chính, báo giá, baseline và thay đổi dự án rõ ràng; không biến từng controller thành một menu riêng.
>
> **App Shell áp dụng:** Sidebar + Main Content, không có global header. Sidebar gồm:
>
> ```text
> Logo Icon + Workspace/Project Switcher + Collapse
> Common Navigation
> Workspace hoặc Project Navigation
> Avatar + Organization Menu
> ```
>
> Settings được mở từ Avatar Menu và sử dụng Settings Navigation riêng trong cùng sidebar.

---

# 0. Executive Summary

## 0.1 Wave 3 bổ sung những năng lực nào?

Wave 3 mở rộng Scopery từ project planning sang project control và commercial management:

```text
Resource Capacity
├── Working calendars
├── Resource profiles
├── Capacity profiles
├── Allocations
├── Availability
├── Workload
├── Utilization
├── Resource risks
└── Assignment conflicts

Estimation
├── Estimation runs
├── Task snapshots
├── WBS rollups
├── Phase rollups
└── Rate impact preview

Project Finance
├── Finance scenarios
├── Phase financials
├── Custom costs
├── Vendor costs
├── Summary
└── Scenario comparison

Profitability
├── Revenue and cost sources
├── Forecasts
├── Profitability plans
├── Adjustments
├── Variance
├── Thresholds
└── Risk flags

Quote
├── Quote register
├── Versioning
├── Pricing
├── Target margin solver
├── Quote lines
├── Terms
└── Approval/send/acceptance lifecycle

Project Control
├── Baselines
├── Baseline snapshots
├── Change requests
├── Change impact
├── Change request items
└── Change orders
```

## 0.2 Kiến trúc UI được chọn

Không tạo 40–50 trang CRUD theo controller.

Wave 3 được gom thành:

- **4 màn hình Workspace/Settings về capacity**
- **12 màn hình Project**
- **Khoảng 16 route chính**
- Detail chủ yếu dùng drawer, inspector hoặc full-page workbench.

```text
WORKSPACE
└── Capacity
    ├── Capacity Overview
    ├── Resources & Profiles
    └── Allocation Planner

SETTINGS
├── Capacity Setup
│   ├── Working Calendars
│   ├── Roles & Skills
│   ├── Capacity Profiles
│   └── Utilization Policies
└── Commercial Settings
    └── Billing / Profit Rate Cards

PROJECT
├── Resources
│   ├── Project Resource Plan
│   └── Effort & Workload
├── Estimation
│   ├── Estimation Center
│   └── Estimation Run Detail
├── Financials
│   ├── Finance Scenarios
│   ├── Scenario Workbench
│   ├── Scenario Comparison
│   └── Profitability
├── Commercial
│   ├── Quotes
│   └── Quote Builder
└── Project Control
    ├── Baselines
    ├── Baseline Detail
    ├── Change Requests
    └── Change Request Workbench
```

## 0.3 Các nguyên tắc quan trọng

1. Capacity phải hiển thị **capacity so với demand**, không chỉ hiển thị utilization percentage.
2. Financial calculations luôn lấy backend làm source of truth.
3. Draft, approved, finalized, sent và accepted phải có UI khác nhau.
4. Baseline đã approved phải được xem là reference bất biến.
5. Change Request phải hiển thị rõ before/after và tác động scope, effort, schedule, cost, revenue, margin và risk.
6. Scenario comparison phải dùng KPI side-by-side và delta.
7. Không làm lộ dữ liệu nhạy cảm qua request, cache, tooltip, export hoặc client state.
8. Không dùng màu làm tín hiệu duy nhất trong heatmap, margin health hoặc risk.
9. Rebuild, recalculate và estimation run phải dùng long-running job pattern.
10. Không cho người dùng nhập UUID hoặc raw JSON trong primary UX.

---

# 1. Research-informed UX Decisions

## 1.1 Capacity planning

Các công cụ project/resource management thường so sánh:

```text
Available Capacity
vs
Required / Allocated Work
```

Scopery nên hỗ trợ:

- Capacity heatmap.
- Allocation timeline.
- Capacity/demand chart.
- Surplus hoặc shortage.
- Resource drill-down.
- Over-allocation list.
- Table alternative cho heatmap.
- Role/project/resource grouping.

Không nên chỉ có một card `Utilization: 85%`.

## 1.2 Baseline and variance

Baseline là điểm tham chiếu đã được chấp thuận để so sánh kế hoạch hiện tại và thực tế.

UI phải phân biệt:

```text
Original Baseline
Current Baseline
Current Plan
Actual / Forecast
```

Baseline không phải một bản project có thể chỉnh sửa tùy ý sau khi approved.

## 1.3 Scenario and what-if analysis

Finance và quote scenario cần:

- Duplicate scenario.
- Chỉnh assumptions.
- Recalculate.
- So sánh side-by-side.
- Hiển thị delta.
- Chọn scenario phù hợp.
- Không làm thay đổi scenario hoặc quote gốc trước khi người dùng apply/mark current.

## 1.4 Quote lifecycle

Quote cần một workbench rõ ràng:

```text
Draft
→ Submit
→ Approve hoặc Reject
→ Send
→ Accepted
```

Editing phải bị khóa theo lifecycle phù hợp. Muốn sửa bản đã approved/sent nên duplicate thành version mới thay vì sửa đè.

## 1.5 Financial data density

Financial UI có thể chi tiết nhưng phải dùng progressive disclosure:

- KPI strip.
- Breakdown table.
- Drill-down drawer.
- Assumption panel.
- Audit/context metadata.
- Compare view.

Không nên nhồi nhiều donut chart hoặc tạo card cho mọi con số.

---

# 2. Navigation Placement

## 2.1 Common Navigation

Wave 3 không tạo common menu mới ngoài các mục đã thống nhất:

```text
Search
Document Hub
Notifications
AI Assistant / Knowledge
```

Các document như quote proposal, baseline snapshot hoặc change-order document sẽ được liên kết với Document Hub khi backend có artifact/document integration.

## 2.2 Workspace Navigation

Thêm một destination cấp cao:

```text
Capacity
```

Workspace navigation:

```text
Overview
Activity
Projects
Capacity
Clients & Contacts
Forms
Directory
```

`Capacity` là hub nghiệp vụ, không phải settings page.

## 2.3 Project Navigation

Bổ sung Wave 3 vào Project Sidebar:

```text
Overview

PLAN
Work Items
WBS
Timeline
Schedule
Resources

SCOPE
Scope
Deliverables

COMMERCIAL
Estimation
Financials
Quotes

CONTROL
Baselines
Change Requests

GOVERNANCE
RAID
Decisions

COLLABORATION
Meetings

Reports
```

### Không thêm vào sidebar

- Resource profile detail.
- Allocation detail.
- Estimation run detail.
- Finance scenario detail.
- Quote version.
- Quote line.
- Baseline snapshot.
- Change impact.
- Change order.

Các nội dung này dùng detail route, drawer hoặc workbench.

## 2.4 Settings Navigation

Wave 3 bổ sung các settings groups:

```text
CAPACITY
Working Calendars
Resource Roles & Skills
Capacity Profiles
Utilization Policies

COMMERCIAL
Billing / Profit Rate Cards
Profitability Threshold Defaults nếu backend hỗ trợ scope
```

Project-specific threshold policy vẫn nằm trong Project Financials/Resources, không phải workspace settings.

---

# 3. Persona and Permission Matrix

| Persona | Màn hình chính | Quyền năng điển hình |
|---|---|---|
| Workspace Member | Resources read, own availability | Xem capacity được phép, xem assignment |
| Resource Manager | Workspace Capacity | Calendar, resource profiles, allocations, conflicts |
| Project Member | Project Resources | Xem assignment, ghi actual effort nếu được phép |
| Project Manager | Project Resource Plan, Estimation | Allocation, estimation runs, risks |
| Finance Manager | Financials, Profitability | Scenario, costs, revenue, margin |
| Commercial / Sales | Quotes | Quote versions, lines, terms, send |
| Quote Approver | Quote review | Approve/reject |
| Project Controller / PMO | Baselines, Change Requests | Validate baseline, impact, apply CR |
| Workspace Admin | Capacity Settings | Calendar, profiles, policies |
| Auditor | Read-only | Baseline, quote, finance, change history |
| Executive / Portal Viewer | Summary only | Masked profitability/finance summary |

## 3.1 Permission principles

- Navigation dựa trên capability, không hard-code theo role name.
- Financial data phải có field-level masking.
- `includeSensitive=true` chỉ được gửi khi user có capability phù hợp.
- User không có quyền xem cost không được nhận cost data rồi chỉ ẩn bằng CSS.
- Approve, finalize, mark current và apply cần permission riêng.
- Export phải kiểm tra cùng permission với màn hình nguồn.

---

# 4. Route Proposal

```text
WORKSPACE CAPACITY
/w/:workspaceId/capacity
/w/:workspaceId/capacity/resources
/w/:workspaceId/capacity/allocations

PROJECT RESOURCES
/w/:workspaceId/p/:projectId/resources
/w/:workspaceId/p/:projectId/resources/effort

PROJECT ESTIMATION
/w/:workspaceId/p/:projectId/estimation
/w/:workspaceId/p/:projectId/estimation/:estimationRunId

PROJECT FINANCIALS
/w/:workspaceId/p/:projectId/financials
/w/:workspaceId/p/:projectId/financials/scenarios/:scenarioId
/w/:workspaceId/p/:projectId/financials/compare
/w/:workspaceId/p/:projectId/profitability

PROJECT QUOTES
/w/:workspaceId/p/:projectId/quotes
/w/:workspaceId/p/:projectId/quotes/:quoteId
/w/:workspaceId/p/:projectId/quotes/:quoteId/versions/:versionId

PROJECT CONTROL
/w/:workspaceId/p/:projectId/baselines
/w/:workspaceId/p/:projectId/baselines/:baselineId
/w/:workspaceId/p/:projectId/change-requests
/w/:workspaceId/p/:projectId/change-requests/:changeRequestId

SETTINGS — CAPACITY
/settings/workspace/:workspaceId/capacity
/settings/workspace/:workspaceId/capacity/calendars
/settings/workspace/:workspaceId/capacity/calendars/:calendarId
/settings/workspace/:workspaceId/capacity/resources
/settings/workspace/:workspaceId/capacity/profiles
/settings/workspace/:workspaceId/capacity/policies

SETTINGS — COMMERCIAL
/settings/workspace/:workspaceId/commercial/rate-cards
```

---

# 5. Page Inventory

| ID | Page | Context | Primary Persona |
|---|---|---|---|
| CAP-01 | Workspace Capacity Overview | Workspace | Resource Manager |
| CAP-02 | Resources & Profiles | Workspace | Resource Manager |
| CAP-03 | Allocation Planner | Workspace | Resource Manager |
| CAP-04 | Capacity Setup | Settings | Workspace Admin |
| RES-01 | Project Resource Plan | Project | PM |
| RES-02 | Effort & Workload | Project | PM / Member |
| EST-01 | Estimation Center | Project | PM / Estimator |
| EST-02 | Estimation Run Detail | Project | PM / Finance |
| FIN-01 | Finance Scenarios | Project | Finance Manager |
| FIN-02 | Finance Scenario Workbench | Project | Finance Manager |
| FIN-03 | Scenario Comparison | Project | Finance / PM |
| PRO-01 | Profitability Center | Project | Finance / Executive |
| QTE-01 | Quote Register | Project | Commercial |
| QTE-02 | Quote Builder | Project | Commercial / Approver |
| BAS-01 | Baseline Register | Project | Project Controller |
| BAS-02 | Baseline Detail & Compare | Project | PMO / Auditor |
| CR-01 | Change Request Register | Project | PM / Controller |
| CR-02 | Change Request Workbench | Project | PM / Finance / Approver |

---

# 6. CAP-01 — Workspace Capacity Overview

## 6.1 Mục đích

Trả lời nhanh:

- Workspace còn bao nhiêu capacity?
- Demand đang vượt capacity ở đâu?
- Ai đang under-allocated hoặc over-allocated?
- Project nào đang gây bottleneck?
- Role hoặc skill nào thiếu?
- Có conflict/risk nào cần xử lý?

## 6.2 API

- `GET /api/v1/capacity/workspaces/{workspaceId}/overview`
- `GET /api/v1/capacity/over-allocations`
- `POST /api/v1/capacity/calculate`
- Resource profiles.
- Project allocations.
- Utilization rebuild.
- Workload snapshots nếu cần historical widget.
- Threshold policy.

## 6.3 Layout

```text
Capacity Overview                            [Open Allocation Planner]

Date Range
[From] [To] [Group By] [Project] [Role] [Status] [Refresh]

Attention Strip

KPI Summary
Capacity vs Demand Chart
Utilization Heatmap
Over-allocation Table
Project / Role Breakdown
```

## 6.4 KPI Summary

Không quá 5–6 KPI:

- Available capacity hours.
- Focused capacity hours.
- Allocated hours.
- Remaining capacity.
- Over-allocated resources.
- Utilization percentage.

Mỗi KPI phải có:

- Value.
- Unit.
- Date range.
- Delta hoặc comparison nếu backend có.
- Link tới detail.

## 6.5 Capacity vs Demand

Chart:

- X-axis: date/week/month.
- Capacity.
- Focused capacity.
- Allocated/demand.
- Surplus hoặc shortage.

Có table alternative:

```text
Period
Available
Focused
Allocated
Surplus / Shortage
Status
```

## 6.6 Utilization Heatmap

Rows:

- Resource.
- Role.
- Team hoặc project grouping.

Columns:

- Day.
- Week.
- Month.

Cell:

- Allocated hours.
- Available hours.
- Utilization percent.
- Status label.

Không chỉ dùng màu:

```text
Under
Healthy
Watch
Overloaded
Critical
```

## 6.7 Attention Strip

- Critical overload.
- Open assignment conflicts.
- Open resource risk flags.
- Missing capacity profiles.
- Missing default calendar.
- Stale snapshot/rebuild.

## 6.8 Empty states

### Không có resource profile

```text
No resources are available for capacity planning.

[Sync from workspace members]
[Create resource]
```

### Chưa có allocation

```text
No project allocations in this period.

[Open Allocation Planner]
```

---

# 7. CAP-02 — Resources & Profiles

## 7.1 Mục đích

Quản lý resource pool của workspace và capacity profile liên quan.

## 7.2 API

- Resource Profile create/list/get/archive.
- Sync from members.
- Resource Role create/list.
- Resource Skill create/list.
- User Capacity Profile CRUD/lifecycle/search.
- User availability calculation.
- Utilization rebuild.

## 7.3 Layout

Master-detail:

```text
Resource Table
Resource Detail Inspector
```

## 7.4 Resource table

Columns:

```text
Resource
Type
Linked Member
Primary Role
Working Calendar
Daily Hours
Focus Factor
Current Allocation
Availability
Status
Actions
```

## 7.5 Filters

- Resource type.
- Status.
- Role.
- Calendar.
- Linked/unlinked.
- Under/over allocated.
- Keyword nếu backend bổ sung hoặc client dataset nhỏ.

## 7.6 Resource detail tabs

```text
Overview
Capacity Profile
Availability
Allocations
Assignments
Utilization
Risks & Conflicts
```

### Overview

- Display name.
- Resource type.
- Linked user/member.
- Primary role.
- Status.

### Capacity Profile

- Calendar.
- Default daily hours.
- Focus factor.
- Effective range.
- Status.

### Availability

- Date range.
- Working hours.
- Focused hours.
- Allocated hours.
- Remaining hours.
- Daily entries.

### Allocations

- Project.
- Percent.
- Type.
- Start/end.
- Status.
- Notes.

### Assignments

- Project/task.
- Role.
- Estimated hours.
- Actual hours.

## 7.7 Sync from Members

Flow:

1. Preview members without profiles.
2. Show members already linked.
3. Select all/default.
4. Confirm.
5. Show created/skipped/error summary.

Không chạy sync im lặng mà không cho biết kết quả.

## 7.8 Resource types

### MEMBER

- Linked user/member required.
- Availability comes from user capacity profile.

### EXTERNAL

- Display name required.
- User link optional/null.
- Capacity settings có thể do admin nhập.

### PLACEHOLDER

- Dùng cho planned demand chưa có người.
- UI phải có placeholder badge.
- Không hiển thị như nhân sự thật.

## 7.9 Contract limitation

Resource Profile không có update endpoint trong contract.

UI phải:

- Chỉ cho create/archive nếu contract chưa bổ sung.
- Không hiển thị edit action giả.
- Đề xuất bổ sung update cho display name, role và linking.

---

# 8. CAP-03 — Allocation Planner

## 8.1 Mục đích

Phân bổ resource cho project theo thời gian và phát hiện overload.

## 8.2 API

- Project Resource Allocation CRUD/lifecycle.
- Availability calculation.
- Workspace overview.
- Project allocation summary.
- Over-allocation.
- Capacity calculate.
- Assignment conflict.
- Resource risk flags.
- Threshold policy.

## 8.3 Layout

Full-width planner:

```text
Toolbar
├── Date range
├── Zoom
├── Group by
├── Filters
├── Show capacity
├── Show allocations
└── Recalculate

Planner
├── Resource treegrid
└── Allocation timeline

Bottom / Right Panel
├── Conflicts
├── Risks
└── Selection inspector
```

## 8.4 Resource treegrid

Columns:

- Resource.
- Role.
- Daily/focused capacity.
- Total allocated.
- Remaining.
- Utilization.
- Status.

## 8.5 Allocation timeline

Allocation bar:

- Project.
- Percent.
- Start/end.
- Allocation type.
- Status.
- Overload indicator.

Drag/resize behavior chỉ thực hiện nếu update contract hỗ trợ đầy đủ.

Khi edit:

1. Preview dates/percent.
2. Check availability.
3. Show conflict warning.
4. Save.
5. Recalculate affected period.
6. Refresh conflicts/overview.

## 8.6 Allocation create drawer

Fields:

- Resource/member picker.
- Project picker.
- Allocation percent.
- Allocation type.
- Start/end.
- Notes.

Validation:

- Percent > 0.
- End >= start.
- Overlap warning.
- Total allocation warning.
- Workspace/project consistency.

## 8.7 Conflicts

Conflict panel:

```text
Severity
Conflict Type
Resource
Task
Description
Status
Acknowledge
Open Resource
Open Task
```

`Acknowledge` không có nghĩa là resolve. UI phải hiển thị khác nhau.

## 8.8 Risk flags

- Risk reason.
- Impact type.
- Description.
- Resource.
- Status.
- Mitigate.
- Close.

Risk flag thuộc capacity không được trộn với RAID item dù có thể liên kết sau này.

---

# 9. CAP-04 — Capacity Setup

## 9.1 Vị trí

```text
Avatar
→ Settings
→ Workspace
→ Capacity
```

## 9.2 Section index

```text
Overview
Working Calendars
Resource Roles
Resource Skills
Capacity Profiles
Utilization Policies
```

## 9.3 Không gian settings

Capacity Setup là cấu hình, không phải operation dashboard.

- Working calendar definition.
- Day rules.
- Exceptions.
- Role/skill catalogs.
- User capacity defaults.
- Threshold policy.

Allocation Planner không nằm trong Settings.

---

# 10. Working Calendar Studio

## 10.1 API

- Working Calendar CRUD/lifecycle/default.
- Day Rules get/replace.
- Exceptions CRUD/search.

## 10.2 Calendar list

Columns:

```text
Calendar
Code
Timezone
Default
Status
Profiles Using
Updated
Actions
```

`Profiles Using` cần aggregate API hoặc summary field; không gọi N+1.

## 10.3 Calendar detail layout

```text
Calendar Header

Weekly Schedule
Exceptions Calendar
Usage
Lifecycle
```

## 10.4 Weekly Schedule Editor

7 rows:

```text
Day
Working / Non-working
Start
End
Working Hours
```

Yêu cầu:

- Toggle working day.
- Start/end disabled nếu non-working.
- Validate end > start.
- Working hours có thể derive hoặc nhập tùy backend rule.
- Replace-all API cần dirty state và confirm.
- Không autosave từng cell nếu endpoint replace toàn bộ.

## 10.5 Exceptions Calendar

Views:

```text
Calendar | List
```

Types:

- Holiday.
- Custom working.
- Custom non-working.

Create/Edit drawer:

- Date.
- Type.
- Name.
- Description.
- Working state.
- Working hours.

## 10.6 Set Default

- Chỉ một default calendar trong workspace.
- Confirmation nêu rõ profile mới sẽ sử dụng default nào.
- Không tự đổi calendar của profile hiện có trừ khi backend xác nhận.

---

# 11. Resource Roles, Skills and Capacity Profiles

## 11.1 Resource Roles

UI:

- Name.
- Description.
- Usage count nếu backend có.
- Create.

Contract chỉ có create/list.

Không hiển thị edit/delete trước khi có endpoint.

## 11.2 Resource Skills

Tương tự roles.

Cần tránh nhầm với:

- IAM role.
- Cost role.
- Planned task role.

Tên user-facing đề xuất:

```text
Resource Role
Resource Skill
```

và có help text phân biệt.

## 11.3 User Capacity Profiles

Table:

```text
Member
Calendar
Daily Hours
Focus Factor
Effective From
Effective To
Status
Actions
```

Detail:

- Profile period.
- Current/previous profile.
- Calendar link.
- Preview effective capacity.
- Lifecycle.

## 11.4 Effective-dated UX

Khi tạo profile mới trùng effective range:

- Hiển thị overlap.
- Nêu profile nào bị ảnh hưởng.
- Không để user vô tình tạo hai profile active chồng nhau.

Contract cần xác nhận business rule overlap.

---

# 12. Utilization Threshold Policy

## 12.1 UI

Threshold editor:

```text
Under-allocated
Healthy minimum
Healthy maximum
Watch maximum
Overloaded
Critical overload
```

## 12.2 Visualization

Dùng horizontal threshold preview:

```text
0 ─ Under ─ Healthy ─ Watch ─ Overloaded ─ Critical
```

Validation:

```text
under <= healthyMin <= healthyMax <= watchMax <= overloaded <= critical
```

## 12.3 Workspace vs Project policy

- Workspace policy là default.
- Project policy là override.
- Project UI phải hiển thị `Inherited from Workspace` hoặc `Project Override`.
- Có action `Reset to Workspace Policy` nếu backend hỗ trợ; hiện contract chưa có delete/reset endpoint.

---

# 13. RES-01 — Project Resource Plan

## 13.1 Mục đích

Quản lý resource demand và assignments trong một project.

## 13.2 API

- Project allocation summary.
- Project allocations.
- Task resource assignments.
- Resource profiles.
- Availability.
- Effort forecasts rebuild.
- Capacity summary rebuild.
- Cost inputs rebuild/get.
- Resource risk flags.
- Assignment conflicts.
- Project threshold policy.

## 13.3 Tabs

```text
Team
Allocations
Assignments
Forecast
Conflicts & Risks
Cost Inputs
```

`Cost Inputs` chỉ hiện với permission tài chính.

## 13.4 Team

- Resource.
- Role.
- Allocation.
- Assigned tasks.
- Estimate hours.
- Actual hours.
- Availability.
- Utilization/risk.

## 13.5 Task assignments

Task detail Wave 2 bổ sung tab:

```text
Resources
```

Functions:

- Add assignment.
- Select resource.
- Select role.
- Estimated hours.
- View actual hours.
- Remove assignment.

Không nhập user ID/member ID.

## 13.6 Forecast rebuild

Long-running pattern:

- Rebuild effort forecast.
- Rebuild capacity summary.
- Rebuild cost inputs.

UI phải hiển thị:

- Last rebuilt.
- Running.
- Completed.
- Failed.
- Retry.
- Trace ID.

Contract hiện chưa thể hiện job ID/progress; cần bổ sung hoặc xác nhận synchronous behavior.

## 13.7 Sensitive cost input

Khi gọi:

```text
includeSensitive=true
```

Frontend phải:

- Kiểm tra capability trước request.
- Dùng cache key khác.
- Không lưu response vào shared/global store.
- Không hiển thị trong logs.
- Không export nếu thiếu permission.
- Clear cache khi logout/permission change.

---

# 14. RES-02 — Effort & Workload

## 14.1 Mục đích

So sánh estimate và actual effort.

## 14.2 API

- Effort estimates create/list.
- Actual effort records create/list/cancel.
- Workload snapshots create/list.
- Utilization rebuild.
- Task assignments actual/estimated hours.

## 14.3 Views

```text
Effort Register
Workload Snapshot
Utilization
```

## 14.4 Effort Register

Columns:

```text
Date
Resource
Task
Estimated Hours
Actual Hours
Variance
Method / Source
Status
Actions
```

## 14.5 Actual Effort entry

Drawer:

- Date.
- Resource/member.
- Task.
- Hours.
- Optional note nếu schema được bổ sung.

Cancel:

- Confirm.
- Preserve cancelled record.
- Không xóa khỏi history.
- Status badge `Cancelled`.

## 14.6 Workload Snapshot

- Snapshot date.
- Allocated hours.
- Actual hours.
- Utilization.
- Member breakdown.
- Comparison to previous snapshot nếu data có.

Không tạo historical chart nếu snapshot cadence không rõ.

## 14.7 Contract gap

Actual Effort không có update endpoint.

Sửa sai phải:

- Cancel old record.
- Create replacement.
- UI phải giải thích audit trail.

---

# 15. EST-01 — Estimation Center

## 15.1 Mục đích

Quản lý các estimation run và current estimate của project.

## 15.2 API

- Estimation run create/list/get/cancel/mark current.
- Current estimation.
- Summary.
- Task snapshots.
- WBS rollups.
- Phase rollups.
- Rate impact preview.

## 15.3 Layout

```text
Current Estimate Summary

Estimation Runs
[New Estimation Run]

Runs Table
Issues / Warnings
```

## 15.4 Current summary

- Included tasks.
- Excluded tasks.
- Unestimated tasks.
- Unresolved role tasks.
- Unresolved rate tasks.
- Total estimate hours.
- Labor cost.
- Billing preview.
- Average cost rate.
- Average billing rate.
- Currency.
- Warning count.

## 15.5 Runs table

Columns:

```text
Name
Schedule Run
Mode
Rate Date Strategy
Currency
Status
Current
Started
Completed
Warnings
Actions
```

## 15.6 Create Estimation Run Wizard

1. Name/description.
2. Schedule run.
3. Calculation mode.
4. Rate target date strategy.
5. Currency policy.
6. Inclusion options.
7. Billing preview option.
8. Mark current option.
9. Review.

## 15.7 Long-running state

```text
PENDING
RUNNING
COMPLETED
FAILED
CANCELLED
```

Running rows:

- Spinner/status.
- Poll.
- Cancel.
- Open detail.

Failed:

- Error code.
- Error message.
- Trace ID.
- Duplicate/retry as new run.

## 15.8 Mark Current

- Current là selection, không phải lifecycle status.
- Chỉ completed run được mark current nếu business rule yêu cầu.
- Confirmation hiển thị run cũ và run mới.

---

# 16. EST-02 — Estimation Run Detail

## 16.1 Tabs

```text
Summary
Tasks
WBS Rollup
Phase Rollup
Issues
Assumptions
```

## 16.2 Task snapshots

Columns:

```text
Task
Role
Estimate Hours
Base Rate
Adjusted Rate
Inflation
Labor Cost
Billing Preview
Currency
Status
Issue
```

Statuses:

- Resolved.
- Unresolved Role.
- Unresolved Rate.
- Excluded.

## 16.3 Issue-first UX

Cho filter nhanh:

```text
All
Unresolved Role
Unresolved Rate
Unestimated
Excluded
```

Click task mở Task Drawer tại tab Estimation/Resources.

## 16.4 WBS Rollup

Treegrid:

- WBS node.
- Task count.
- Hours.
- Cost.
- Billing preview.
- Warnings.

## 16.5 Phase Rollup

Table/chart:

- Phase.
- Hours.
- Labor cost.
- Billing.
- Margin preview nếu response hỗ trợ.
- Warning count.

## 16.6 Rate Impact Preview

Mở từ task row:

```text
Preview Rate Impact
```

Form:

- Cost role.
- Target date.
- Currency.

Result:

- Current estimate hours.
- Rate card/version.
- Base rate.
- Adjusted rate.
- Inflation.
- Estimated labor cost preview.
- Label.

Preview không được tự save vào estimation run.

---

# 17. FIN-01 — Finance Scenarios

## 17.1 Mục đích

Quản lý financial models/what-if scenarios của project.

## 17.2 API

- Scenario CRUD.
- Compare.
- Recalculate.
- Approve.
- Mark current.
- Archive.
- Duplicate.
- Current finance endpoints.
- Summary.
- Phase financials.
- Custom/vendor costs.

## 17.3 Layout

```text
Current Finance Summary

Scenario List                        [Create Scenario]

Recent Comparison
```

## 17.4 Scenario cards/table

Columns:

```text
Scenario
Code
Version
Estimation Run
Revenue
Budget of Costs
Gross Margin
Margin %
PBT
Status
Current
Updated
Actions
```

## 17.5 Create Scenario Wizard

1. Identity.
2. Source estimation run.
3. Currency.
4. Planned revenue.
5. Revenue split method.
6. Contingency.
7. Overhead.
8. Target margin.
9. Assumptions.
10. Mark current.
11. Review.

## 17.6 Status behavior

```text
DRAFT
APPROVED
ARCHIVED
```

Recommended UI rule:

- Draft editable.
- Approved read-only.
- Archive read-only.
- Duplicate approved to create alternative.

Contract cần xác nhận update endpoint có cho phép update approved scenario hay không.

---

# 18. FIN-02 — Finance Scenario Workbench

## 18.1 Full-page workbench

Cho phép auto-collapse sidebar.

```text
Scenario Header
KPI Strip
Phase Financial Grid
Costs
Assumptions
Actions
```

## 18.2 KPI Strip

- Total estimate hours.
- Labor cost.
- Custom cost.
- Vendor cost.
- Contingency.
- Direct cost.
- Overhead.
- Budget of costs.
- Planned revenue.
- Gross margin.
- Margin percent.
- PBT.

Không hiển thị tất cả KPI thành 12 cards lớn.

Đề xuất:

- 4 primary KPI.
- Secondary metrics trong compact table/expandable strip.

## 18.3 Phase Financial Grid

Columns:

```text
Phase
Estimate Hours
Labor Cost
Custom Cost
Vendor Cost
Contingency
Direct Cost
Overhead
Budget of Costs
Revenue
Revenue %
Gross Margin
Margin %
PBT
```

Có horizontal scroll và sticky phase column.

## 18.4 Revenue allocation

Update revenue drawer:

- Planned revenue.
- Revenue percent.
- Show total project revenue.
- Validate total percent.
- Explain split method.

Nếu manual split:

- Sum phải khớp rule backend.
- Hiển thị unallocated/overallocated amount.

## 18.5 Custom Costs

Table:

- Phase.
- Category.
- Name.
- Amount.
- Currency.
- Cost date.
- Status.

Create/Edit drawer.

## 18.6 Vendor Costs

- Phase.
- Vendor.
- Description.
- Amount.
- Currency.
- Status.

## 18.7 Recalculate

- Không optimistic update.
- Show calculating state.
- Reload summary and phases.
- Display formula version.
- Preserve unsaved local changes hoặc block recalc khi dirty.

## 18.8 Approve / Mark Current

Approve:

- Show readiness checks.
- Show key financial KPIs.
- Confirm assumptions.
- Lock editing.

Mark Current:

- Separate action.
- Can be approved or draft only based on backend rule.
- Show current scenario replacement.

---

# 19. FIN-03 — Scenario Comparison

## 19.1 API

```text
GET /finance-scenarios/compare
```

## 19.2 Layout

```text
Left Scenario Picker
Right Scenario Picker

KPI Comparison
Delta Chart
Phase Comparison
Assumption Comparison
```

## 19.3 KPI table

| Metric | Left | Right | Delta | Better/Worse |
|---|---:|---:|---:|---|
| Revenue | | | | |
| Budget of Costs | | | | |
| Gross Margin | | | | |
| Margin % | | | | |
| PBT | | | | |
| Estimate Hours | | | | |

`Better/Worse` phải phụ thuộc metric:

- Revenue/margin tăng thường tốt.
- Cost tăng thường xấu.
- Không hard-code màu mà không có text/icon.

## 19.4 Compare limitations

Contract chỉ compare hai scenario.

UI không nên quảng bá multi-scenario matrix nếu backend chưa hỗ trợ.

## 19.5 Action

- Open left/right.
- Duplicate preferred scenario.
- Mark current.
- Create quote from scenario.

Create quote action chỉ hiển thị nếu user có permission và scenario hợp lệ.

---

# 20. PRO-01 — Profitability Center

## 20.1 Mục đích

Theo dõi profitability forecast và risk của project.

## 20.2 API

- Profitability profile.
- Summary/portal/rebuild.
- Cost sources.
- Revenue sources.
- Cost/revenue forecasts.
- Plans/versions/finalize.
- Adjustments/apply.
- Threshold policy.
- Variance.
- Profitability risk flags.
- Project profitability rate cards.

## 20.3 Tabs

```text
Overview
Sources
Forecasts
Plans
Adjustments
Variance
Risk Flags
Rate Cards
Settings
```

`Rate Cards` có thể permission-gated.

## 20.4 Overview

KPI:

- Revenue.
- Cost.
- Gross margin.
- Gross margin percent.
- PBT.
- PBT percent.
- Health status.

Breakdown:

- Cost source mix.
- Revenue source mix.
- Forecast trend nếu có dated data.
- Open risk flags.
- Recent variances.
- Current plan.

## 20.5 Health status

```text
HEALTHY
WATCH
AT_RISK
LOSS_RISK
```

Badge luôn có text và icon, không chỉ màu.

## 20.6 Sources

### Cost Sources

- Type.
- Source reference.
- Effort.
- Rate.
- Amount.
- Currency.
- Included in forecast.
- Status.

### Revenue Sources

- Type.
- Source reference.
- Amount.
- Currency.
- Confidence.
- Included in forecast.
- Status.

`sourceId` không được hiển thị thô. Cần Entity Reference Resolver.

## 20.7 Forecasts

Views:

```text
Cost Forecasts
Revenue Forecasts
```

Fields:

- Type.
- Amount.
- Confidence.
- Date.
- Assumptions.
- Status.

Contract không có update; sửa có thể cần archive/new record.

## 20.8 Plans

- Plan code.
- Name.
- Type.
- Status.
- Current version.
- Planned/baseline revenue/cost/profit/margin.

Version rail:

- Version.
- Status.
- Created.
- Finalized.

Contract chưa mô tả create/update version riêng sau plan creation; cần chốt trước builder đầy đủ.

## 20.9 Adjustments

- Type.
- Amount.
- Reason.
- Applied state.
- Apply.

Apply cần:

- Confirmation.
- Idempotency.
- Before/after summary.
- Permission.
- Audit trail.

## 20.10 Variance

- Type.
- From amount.
- To amount.
- Amount delta.
- Percent delta.
- Currency.
- Explanation.
- Source snapshot.

## 20.11 Risk Flags

- Reason.
- Impact type.
- Amount at risk.
- Status.
- Mitigate.
- Close.

## 20.12 Profitability Threshold

Editor:

- Healthy margin.
- Watch margin.
- At-risk margin.
- Loss-risk margin.

Validate monotonic order theo business rule.

---

# 21. Rate Card Naming and Placement

Wave 1 và Wave 3 đều có khái niệm Rate Card.

Để tránh nhầm:

```text
Wave 1 Rate Card
→ Cost Rate Card / Costing Rate Card

Wave 3 Profitability Rate Card
→ Billing / Profit Rate Card
```

## 21.1 Workspace Billing Rate Cards

Vị trí:

```text
Avatar
→ Settings
→ Commercial
→ Billing Rate Cards
```

## 21.2 Project Billing Rate Cards

Vị trí:

```text
Project
→ Profitability
→ Rate Cards
```

Project rate card có thể override workspace rate card.

UI phải hiển thị:

- Scope.
- Inherited/override.
- Currency.
- Rate type.
- Role/team/individual target.
- Status.

## 21.3 Contract reconciliation required

Cần xác nhận:

- Cost Rate Card và Profit Rate Card có mục tiêu khác nhau?
- Estimation dùng rate card nào?
- Quote/finance dùng source nào?
- Có inheritance giữa workspace và project không?
- Có effective dates/versioning không?

Không nên hiển thị hai menu cùng tên `Rate Cards`.

---

# 22. QTE-01 — Quote Register

## 22.1 Mục đích

Quản lý tất cả quote và current version của project.

## 22.2 API

- Quote CRUD/archive.
- Quote versions.
- Version lifecycle.
- Summary/recalculate.
- Target margin solver.
- Lines.
- Terms.

## 22.3 List columns

```text
Quote
Code
Client
Current Version
Status
Total Amount
Margin %
Valid Until
Updated
Actions
```

Total/margin cần summary aggregate để tránh N+1 request.

## 22.4 Filters

- Status.
- Client.
- Valid/expired.
- Source scenario.
- Current version.
- Keyword nếu backend bổ sung.

## 22.5 Create Quote Wizard

1. Identity.
2. Client information.
3. Source finance scenario.
4. Initial metadata.
5. Create.

Sau create mở Quote Builder.

## 22.6 Statuses

```text
DRAFT
SUBMITTED
APPROVED
REJECTED
SENT
ACCEPTED
ARCHIVED
```

Quote-level status và version-level status cần thống nhất hiển thị.

---

# 23. QTE-02 — Quote Builder

## 23.1 Full-screen workbench

```text
Quote Header
Version Rail
Editor
Summary Inspector
Client Preview
Lifecycle Actions
```

## 23.2 Header

- Code/title.
- Client.
- Status.
- Version.
- Current badge.
- Valid until.
- Save state.
- More actions.

## 23.3 Version rail

- Version number.
- Status.
- Current.
- Created.
- Submitted/approved/sent/accepted timestamps.

Actions:

- Create version.
- Duplicate.
- Mark current.
- Archive.

## 23.4 Editor sections

```text
Pricing
Quote Lines
Terms
Client Details
Proposal
Internal Notes
Summary
```

## 23.5 Pricing

- Finance scenario.
- Pricing method.
- Cost base method.
- Target margin.
- Discount method.
- Discount.
- Valid until.
- Generate lines from.

## 23.6 Target Margin Solver

Inline side panel:

```text
Cost Base
Target Margin %
Required Contract Value
```

Result không tự apply.

Actions:

- Apply required value.
- Copy.
- Cancel.

## 23.7 Quote Lines

Editable table:

```text
Drag
Line Type
Name
Description
Quantity
Unit Price
Amount
Client Visible
Source
Internal Note
Actions
```

Requirements:

- Reorder.
- Add.
- Edit.
- Delete.
- Client-visible preview.
- Internal note never shown in client preview.
- Amount calculation from backend is source of truth.

## 23.8 Quote Terms

Ordered blocks:

- Payment.
- Warranty.
- Delivery.
- Scope.
- Legal.
- Custom.

Each term:

- Title.
- Content.
- Client visible.
- Reorder.
- Edit/delete.

## 23.9 Summary Inspector

- Cost base.
- Direct cost.
- Overhead.
- Subtotal.
- Discount.
- Tax.
- Total quoted amount.
- Required contract value.
- Gross margin.
- Margin percent.
- PBT.
- Formula version.

## 23.10 Client Preview

Preview only client-visible:

- Proposal title.
- Client data.
- Lines.
- Terms.
- Totals.
- Valid until.

Must exclude:

- Internal notes.
- Sensitive cost.
- Margin.
- PBT.
- Rate details.

## 23.11 Lifecycle actions

### Draft

- Edit.
- Recalculate.
- Submit.
- Duplicate.
- Mark current.

### Submitted

- Read-only.
- Approve.
- Reject.

### Approved

- Read-only.
- Send.
- Duplicate.

### Rejected

- Read-only.
- Duplicate to revise.

### Sent

- Mark accepted.
- Duplicate if revised quote required.

### Accepted

- Locked.
- Link to baseline/scope/import workflows.

## 23.12 Contract gaps

Không thấy endpoint:

- Generate/download quote document.
- Send payload/recipient/message.
- Client preview artifact.
- Tax configuration fields.
- Approval comment.
- Audit/history list.

Không nên xây PDF/email send UX hoàn chỉnh trước khi có contract.

---

# 24. BAS-01 — Baseline Register

## 24.1 Mục đích

Quản lý baseline versions/reference points của project.

## 24.2 API

- Baseline create/list/get/update metadata.
- Current baseline.
- Refresh snapshot.
- Validate.
- Approve.
- Mark current.
- Archive.

## 24.3 List columns

```text
Baseline
Number
Status
Current
Schedule Run
Estimation Run
Finance Scenario
Quote Version
Validated
Approved
Updated
Actions
```

## 24.4 Create Baseline Wizard

1. Name/description.
2. Source schedule.
3. Source estimation.
4. Source finance scenario.
5. Source quote version.
6. Review completeness.
7. Create.
8. Refresh snapshot.
9. Validate.

## 24.5 Status model

```text
DRAFT
VALIDATED
APPROVED
ARCHIVED
```

Recommended:

- Draft metadata editable.
- Validated limited edit.
- Approved read-only.
- Archive read-only.

## 24.6 Current baseline

Current is a separate badge, not status.

Only approved baseline nên được mark current nếu business rule xác nhận.

---

# 25. BAS-02 — Baseline Detail & Compare

## 25.1 Tabs

```text
Summary
Snapshot
Validation
Sources
Compare
Metadata
```

## 25.2 Summary

- Scope count.
- Task count.
- Schedule dates/duration.
- Estimate hours.
- Cost.
- Revenue.
- Margin.
- Quote amount.
- Risks/warnings.
- Formula version.

Chỉ render khi typed summary contract có sẵn.

## 25.3 Snapshot

Snapshot tree:

```text
Project
├── Phases
├── WBS
├── Tasks
├── Schedule
├── Estimation
├── Finance
└── Quote
```

Không hiển thị `snapshotJson` raw làm primary UI.

## 25.4 Validation

Checklist:

- Source schedule exists.
- Source estimation completed.
- Finance scenario valid.
- Quote version valid/current.
- No unresolved estimate role/rate.
- Currency consistency.
- Required project data present.
- Snapshot up-to-date.

## 25.5 Compare

Compare:

```text
Baseline A
vs
Baseline B hoặc Current Plan
```

Summary delta:

- Scope.
- Task count.
- Start/end.
- Duration.
- Estimate hours.
- Cost.
- Revenue.
- Margin.
- Quote amount.

Detail diff:

- Added.
- Modified.
- Removed.
- Unchanged hidden by default.

## 25.6 Contract blocker

Contract chưa có baseline compare endpoint và snapshot schemas đang là JSON.

Cần backend:

```text
GET /baselines/{left}/compare/{right}
GET /baselines/{baseline}/compare-current
```

Không nên diff snapshot lớn hoàn toàn ở frontend.

---

# 26. CR-01 — Change Request Register

## 26.1 Mục đích

Theo dõi change lifecycle từ draft đến apply.

## 26.2 API

- CR CRUD/lifecycle.
- Items.
- Impact.
- Calculate impact.
- Change orders.

## 26.3 Views

```text
Register | Board
```

## 26.4 Register columns

```text
Code / Title
Type
Priority
Status
Baseline
Impact Summary
Submitted
Approved
Applied
Actions
```

## 26.5 Board

Columns:

```text
DRAFT
SUBMITTED
APPROVED
REJECTED
APPLIED
CANCELLED
```

Không cho drag lifecycle nếu backend chỉ hỗ trợ explicit actions và có confirmation.

Board chỉ là visualization/filter.

## 26.6 Filters

- Type.
- Priority.
- Status.
- Baseline.
- Impact severity.
- Keyword nếu backend bổ sung.
- Created/submitted date.

---

# 27. CR-02 — Change Request Workbench

## 27.1 Layout

```text
Change Request Header
Lifecycle Timeline
Change Items
Impact Analysis
Change Orders
Links / Source Context
Review & Actions
```

## 27.2 Header

- Code/title.
- Type.
- Priority.
- Status.
- Baseline.
- Reason.
- Created/submitted/approved/applied metadata.

## 27.3 Change items

Table:

```text
Operation
Target Type
Target
Summary
Before
After
Status
Actions
```

Operations:

- Add.
- Modify.
- Remove.

## 27.4 Before/After inspector

Do not show raw JSON by default.

Render field diff:

```text
Field
Before
After
Change Type
```

Advanced/debug tab may show JSON only to authorized technical users.

## 27.5 Impact Analysis

Sections:

```text
Scope
Schedule
Effort
Cost
Revenue
Margin
Quote
Risk
```

KPIs:

- Schedule impact days.
- Estimate hours impact.
- Labor/direct/overhead impact.
- Revenue impact.
- Gross margin impact.
- PBT impact.
- Quote amount impact.
- Risk impact.

Actions:

- Calculate automatically.
- Edit manual impact.
- Show calculated/manual source.
- Recalculate warning if items changed.

## 27.6 Lifecycle

```text
DRAFT
→ SUBMITTED
→ APPROVED hoặc REJECTED
→ APPLIED

DRAFT/SUBMITTED
→ CANCELLED

Any allowed state
→ ARCHIVED
```

## 27.7 Submit readiness

- At least one item.
- Baseline exists.
- Impact analysis exists or waiver.
- No invalid target.
- Currency consistent.
- Required reason present.

## 27.8 Approve

Review dialog:

- Summary.
- Items.
- Impact.
- Baseline.
- Commercial impact.
- Change order requirement.
- Confirmation.

## 27.9 Apply

Apply is high-risk.

Dialog must show:

- Target baseline.
- Operations count.
- Affected entities.
- Expected new/current baseline behavior.
- Financial/schedule impact.
- Irreversibility.
- Confirmation phrase if necessary.

Do not optimistic update.

## 27.10 Change Orders

Create from approved CR:

- Code.
- Title.
- Description.
- Commercial impact.
- Source quote version.

Change order panel:

- Status.
- Quote.
- Commercial summary.
- Approve/reject.
- Archive.

## 27.11 Contract gaps

Need clarification:

- Apply creates new baseline or mutates existing baseline?
- Apply is atomic/idempotent?
- Partial failure behavior?
- How `applyPayloadJson` is validated?
- Change order send/accept lifecycle?
- Approval comments and audit history?
- Can rejected CR return to draft?

---

# 28. Shared Components

## 28.1 CapacityHeatmap

Props:

- Rows.
- Periods.
- Threshold policy.
- Grouping.
- Cell click.
- Accessible table mode.

## 28.2 UtilizationIndicator

Displays:

- Percent.
- Hours allocated/available.
- Status text.
- Threshold source.
- Icon/color.

## 28.3 ResourcePicker

Searches:

- Member resource.
- External resource.
- Placeholder resource.

Shows:

- Role.
- Availability.
- Allocation.
- Status.

## 28.4 AllocationTimeline

- Time scale.
- Bars.
- Capacity background.
- Conflict markers.
- Drag/resize when allowed.
- Keyboard edit dialog.

## 28.5 FinancialKpiStrip

- Primary metrics.
- Currency.
- Delta.
- Masking.
- Formula timestamp/version.
- Compact/expanded modes.

## 28.6 CurrencyAmount

Requirements:

- ISO currency.
- Locale formatting.
- No implicit conversion.
- Negative style.
- Masked state.
- Approximate/forecast state.

## 28.7 SensitiveFinancialValue

States:

```text
Visible
Masked
Unavailable
Mixed Currency
Permission Required
```

Never render masked as `0`.

## 28.8 VersionRail

Used by:

- Quote versions.
- Profitability plans.
- Potential future baseline versions.

Displays:

- Number/label.
- Status.
- Current.
- Timestamp.
- Lifecycle actions.

## 28.9 ScenarioCompareTable

- Left/right.
- Delta.
- Direction.
- Metric-specific interpretation.
- Accessible table.
- Export permission.

## 28.10 LifecycleTimeline

Used by:

- Quote.
- Baseline.
- Change Request.
- Change Order.
- Scenario.

## 28.11 FinancialSourcePicker

Resolves:

- Contract.
- Milestone.
- Change order.
- Task/effort.
- Vendor/custom source.

Never asks for raw source ID.

## 28.12 JsonDiffInspector

Only for advanced/internal use.

Primary UI renders typed fields.

## 28.13 LongRunningJobState

Used by:

- Capacity rebuild.
- Conflict recalculate.
- Estimation run.
- Finance recalculate.
- Quote recalculate.
- Baseline refresh/validate.
- CR impact calculate.

States:

```text
Idle
Queued
Running
Completed
Failed
Cancelled
```

---

# 29. API Integration Strategy

## 29.1 Cache keys

```text
capacityOverview(workspaceId, from, to, filters)
resources(workspaceId)
resource(workspaceId, resourceId)
resourceAvailability(workspaceId, userId, from, to)
allocations(workspaceId, filters)
overAllocations(workspaceId, from, to)
capacityPolicy(workspaceId)
projectCapacityPolicy(projectId)

projectResources(projectId)
resourceRiskFlags(projectId)
assignmentConflicts(projectId)
effortRecords(projectId)
workloadSnapshots(projectId)

estimationRuns(projectId)
estimationRun(projectId, runId)
currentEstimation(projectId)
estimationTasks(projectId, runId)
estimationWbsRollups(projectId, runId)
estimationPhaseRollups(projectId, runId)

financeScenarios(projectId)
financeScenario(projectId, scenarioId)
financeSummary(projectId, scenarioId)
financePhases(projectId, scenarioId)
currentFinance(projectId)
scenarioCompare(projectId, leftId, rightId)

profitabilitySummary(projectId)
profitabilitySources(projectId, type)
profitabilityForecasts(projectId, type)
profitabilityPlans(projectId)
profitabilityRisks(projectId)

quotes(projectId)
quote(projectId, quoteId)
quoteVersions(projectId, quoteId)
quoteVersion(projectId, quoteId, versionId)
quoteSummary(projectId, quoteId, versionId)
quoteLines(projectId, quoteId, versionId)
quoteTerms(projectId, quoteId, versionId)

baselines(projectId)
baseline(projectId, baselineId)
currentBaseline(projectId)

changeRequests(projectId)
changeRequest(projectId, crId)
changeItems(projectId, crId)
changeImpact(projectId, crId)
changeOrders(projectId, crId)
```

## 29.2 Important invalidation

### Allocation update

Invalidate:

- Allocation list.
- Capacity overview.
- Availability affected resource.
- Over-allocations.
- Project resource summary.
- Conflicts.

### New estimation current

Invalidate:

- Current estimation.
- Finance scenario create source selector.
- Project overview financial widgets.
- Baseline source selector.

### Finance recalculation

Invalidate:

- Scenario.
- Summary.
- Phase financials.
- Compare cache using scenario.
- Profitability if integrated.
- Quote source preview.

### Quote line/term change

Invalidate:

- Version.
- Lines/terms.
- Quote summary.
- Client preview.
- Quote register aggregate.

### Baseline refresh/approve

Invalidate:

- Baseline.
- Baseline register.
- Current baseline.
- Compare.
- Change Request baseline selector.

### CR item change

Invalidate:

- Items.
- Impact stale state.
- CR readiness.
- Related baseline comparison preview.

## 29.3 Optimistic UI allowed

- Simple metadata edit with rollback.
- Reorder quote lines/terms locally before save.
- Table filter/sort.
- Mark selection in compare.
- Open/close panels.

## 29.4 No optimistic UI

- Allocation lifecycle.
- Capacity recalculation.
- Estimation run.
- Mark estimation current.
- Finance recalculate.
- Approve/mark current scenario.
- Apply profitability adjustment.
- Quote submit/approve/reject/send/accept.
- Baseline validate/approve/mark current.
- CR approve/apply.
- Change order approve.
- Financial rebuild including sensitive data.

---

# 30. Loading, Errors and Concurrency

## 30.1 Long-running operations

If endpoint is synchronous but takes time:

- Disable duplicate submit.
- Show action-level loading.
- Allow cancel only if endpoint supports.
- Use timeout-safe status.
- Do not lock entire app.

If backend returns job/run entity:

- Poll status.
- Pause when tab hidden.
- Revalidate on focus.
- Persist running indicator in project context.

## 30.2 Error mapping

| Error | UI |
|---|---|
| Validation | Field errors + summary |
| Permission | Restricted state |
| Not found | Entity removed/not accessible |
| Conflict | Refresh and compare state |
| Business rule | Explain violated lifecycle/readiness |
| Currency mismatch | Block calculation and explain |
| Calculation failure | Retry + trace ID |
| Stale version | Conflict dialog |
| Sensitive denied | Mask/restricted, do not retry with sensitive |

## 30.3 Version/concurrency

Many responses have `version`, but request lock mechanism is not explicit.

Need backend contract:

- `If-Match`.
- Version in body.
- 409/412 behavior.
- Conflict payload.

Until then:

- Revalidate before approve/apply.
- Show updatedAt.
- Avoid aggressive autosave.
- Do not overwrite approved/versioned artifacts silently.

---

# 31. Financial Safety and Privacy

## 31.1 Masking

When user lacks permission:

```text
Restricted
```

Do not show:

```text
0
—
hidden via CSS after receiving value
```

## 31.2 Client preview

Never include:

- Labor cost.
- Cost rate.
- Adjusted cost rate.
- Margin.
- PBT.
- Internal note.
- Sensitive assumptions.
- Vendor/internal cost detail.

## 31.3 Export

- Apply same permissions as screen.
- Clearly label currency.
- Include generated timestamp.
- Include scenario/version/baseline IDs as human labels, not raw UUID only.
- Watermark/internal classification if needed.

## 31.4 Mixed currency

Contract uses currency fields but no full FX policy.

UI must:

- Block silent summation across currencies.
- Show mixed currency warning.
- Require a calculation currency.
- Display rate date/source if conversion is introduced later.

---

# 32. Responsive Strategy

## Desktop-first

- Capacity heatmap.
- Allocation timeline.
- Finance grid.
- Scenario comparison.
- Quote builder.
- Baseline compare.
- CR workbench.

## Tablet

- Collapsed sidebar.
- Stacked KPI.
- Horizontal table scroll.
- Full-width drawer.
- Compare summary before detail.
- Timeline simplified.

## Mobile

Useful:

- Capacity summary.
- Own availability.
- Project team.
- Effort entry.
- Estimation summary.
- Finance summary masked/compact.
- Quote review/approve.
- Change Request review.
- Notifications/deep links.

Limited/read-only:

- Allocation planner.
- Heatmap editing.
- Scenario workbench.
- Quote line builder.
- Baseline deep compare.
- CR before/after multi-column diff.

---

# 33. Accessibility

Target: WCAG 2.2 AA.

## Capacity heatmap

- Table alternative.
- Cell accessible name includes resource, period, allocated, available and status.
- Keyboard navigation.
- Status not color-only.
- Threshold legend with text.

## Allocation planner

- Drag has keyboard/form alternative.
- Dates and percentages editable in dialog.
- Conflict announced.
- Focus preserved after move.

## Financial tables

- Sticky columns do not break keyboard focus.
- Numeric columns have clear headers.
- Currency available to screen reader.
- Negative values not color-only.

## Scenario comparison

- Delta announced with direction.
- Better/worse not color-only.
- Side-by-side table works at 200% zoom.

## Quote builder

- Reorder has move up/down actions.
- Rich text terms remain keyboard accessible.
- Client-visible toggles have clear labels.
- Status transitions have focus management.

## Baseline/CR diff

- Added/modified/removed have text and icons.
- Before/after labels explicit.
- JSON debug view is not only representation.

---

# 34. Animation

Use subtle enterprise motion.

## Sidebar/context

Follow shared App Shell specification.

## Heatmap filtering

- Crossfade cells.
- No wave animation across hundreds of cells.
- Duration under 180ms.

## Allocation move

- Direct manipulation.
- Ghost at original position.
- Snap without bounce.
- Rollback on failure.

## Scenario recalculate

- KPI values crossfade.
- Highlight changed values temporarily.
- No counting animation for financial values.

## Quote line reorder

- FLIP movement.
- Drop indicator.
- Preserve focus.

## Baseline/CR diff

- Expand section 160–180ms.
- Added/removed highlights fade.
- Respect reduced motion.

---

# 35. Contract Gap Matrix

| Severity | Gap | UI Impact | Recommendation |
|---|---|---|---|
| Critical | Wave 1 và Wave 3 cùng có Rate Card | Hai source of truth tài chính | Chốt Cost Rate vs Billing Rate và inheritance |
| Critical | Baseline snapshot/summary/validation là JSON | Không thể type-safe render/compare | Typed DTO + compare endpoints |
| Critical | CR before/after/apply payload là JSON | Apply và diff khó an toàn | Typed operation schemas/validator |
| Critical | CR apply behavior với baseline chưa rõ | Có thể mutate sai baseline | Chốt atomicity, idempotency, resulting baseline |
| Critical | Quote không có document generation/send contract | Không thể hoàn thiện proposal workflow | Add preview/document/send endpoints |
| Critical | Financial sensitive access chỉ qua query flag | Nguy cơ leak | Capability + response projection + cache policy |
| High | Resource Profile không update | Không sửa role/link/name | Add PUT |
| High | Resource Role/Skill chỉ create/list | Catalog không maintain được | Add update/archive |
| High | Estimation/finance rebuild progress chưa rõ | Job UX không ổn định | Return job/run status |
| High | Finance và Profitability overlap | User không biết dùng module nào | Define source of truth and data flow |
| High | No baseline compare endpoint | FE diff lớn/rủi ro | Server-side compare |
| High | Quote lifecycle action bodies chưa rõ | Approval/send UX thiếu data | Define comments, recipient, audit response |
| High | Quote tax fields thiếu request contract | Summary có tax nhưng không edit được | Add tax mode/rate/amount schema |
| High | Profitability plan version editing incomplete | Không build plan version workflow | Add create/update/duplicate version |
| High | Currency conversion policy absent | Mixed currency totals không an toàn | FX source/date/policy |
| High | Approve artifacts locking rules unclear | Có thể edit approved data | Publish immutable-state rules |
| Medium | Actual effort không update | Sửa sai khó | Cancel + replacement contract/document |
| Medium | Forecasts không update | Sửa forecast khó | Update/archive/new-version policy |
| Medium | Flat list endpoints thiếu pagination/filter | Performance | Standardize list contracts |
| Medium | Source IDs thiếu display projection | UI phải N+1 resolve | Include source reference summary |
| Medium | Utilization rebuild period unspecified | Result/context khó hiểu | Add from/to or snapshot period |
| Medium | Workspace/project threshold reset absent | Không bỏ override | Add delete/reset-to-inherited |
| Medium | Scenario compare chỉ 2 | Hạn chế multi-option analysis | Optional multi-scenario endpoint |
| Medium | Change order lifecycle ngắn | Không track send/client accept | Extend lifecycle if required |
| Medium | Approval/audit history endpoints absent | Governance kém | Add lifecycle events/history |
| Low | No server export endpoints | Large reports difficult | CSV/XLSX/PDF where needed |
| Low | Snapshot cadence undefined | Trend chart unreliable | Define rebuild/snapshot schedule |

---

# 36. Recommended Backend Additions

## 36.1 Capacity aggregate

```text
GET /api/v1/capacity/workspaces/{workspaceId}/planner
GET /api/v1/capacity/workspaces/{workspaceId}/resources/{resourceId}/summary
```

Include:

- Resource.
- Capacity.
- Allocations.
- Availability.
- Utilization.
- Conflicts.
- Risk count.

## 36.2 Typed references

Instead of source ID only:

```json
{
  "source": {
    "type": "TASK",
    "id": "uuid",
    "code": "TASK-001",
    "title": "Gather requirements"
  }
}
```

## 36.3 Baseline compare

```text
GET /api/v1/projects/{projectId}/baselines/{leftId}/compare/{rightId}
GET /api/v1/projects/{projectId}/baselines/{baselineId}/compare-current
```

## 36.4 Change Request preview/apply

```text
POST /change-requests/{id}/preview-apply
POST /change-requests/{id}/validate-apply
POST /change-requests/{id}/apply
```

Apply response should include:

- Applied operations.
- Failed operations.
- New baseline ID.
- Updated entities.
- Trace ID.
- Idempotency key/result.

## 36.5 Quote document and delivery

```text
POST /quotes/.../versions/{versionId}/preview
POST /quotes/.../versions/{versionId}/generate-document
POST /quotes/.../versions/{versionId}/send
GET  /quotes/.../versions/{versionId}/delivery-history
```

## 36.6 Financial access projection

Prefer:

```text
GET /finance/.../summary
GET /finance/.../summary/portal
```

or permission-projected DTOs over a simple `includeSensitive` query flag.

## 36.7 Lifecycle history

```text
GET /quotes/{id}/history
GET /baselines/{id}/history
GET /change-requests/{id}/history
GET /finance-scenarios/{id}/history
```

---

# 37. Implementation Order

## P0 — Shared Financial and Capacity Foundation

1. CurrencyAmount.
2. SensitiveFinancialValue.
3. FinancialKpiStrip.
4. VersionRail.
5. LifecycleTimeline.
6. LongRunningJobState.
7. ResourcePicker.
8. Entity reference resolver.
9. Capability-projected queries.
10. Conflict/concurrency handling.

## P1 — Workspace Capacity

1. Capacity Setup.
2. Working Calendars.
3. Resources & Profiles.
4. Capacity Overview.
5. Allocation Planner.
6. Conflicts and risks.

## P2 — Project Resources and Estimation

1. Project Resource Plan.
2. Task resource assignments.
3. Effort Register.
4. Estimation Center.
5. Estimation Run Detail.
6. Rate Impact Preview.

## P3 — Project Finance

1. Finance Scenario Register.
2. Scenario Workbench.
3. Recalculate.
4. Phase financial grid.
5. Custom/vendor costs.
6. Scenario Comparison.
7. Current finance.

## P4 — Profitability

1. Profile and summary.
2. Cost/revenue sources.
3. Forecasts.
4. Plans.
5. Adjustments.
6. Variance.
7. Risk flags.
8. Rate cards.

## P5 — Quotes

1. Quote Register.
2. Version Rail.
3. Quote Builder.
4. Lines.
5. Terms.
6. Summary/recalculate.
7. Target margin solver.
8. Lifecycle.
9. Client preview.
10. Document/send after backend contract.

## P6 — Baseline and Change Control

1. Baseline Register.
2. Baseline sources.
3. Refresh/validate/approve/current.
4. Snapshot viewer.
5. Change Request Register.
6. CR items.
7. Impact.
8. Review/approval.
9. Change order.
10. Apply after atomic contract is confirmed.
11. Compare after backend compare endpoint.

---

# 38. Definition of Done

Mỗi màn hình Wave 3 chỉ hoàn thành khi:

- Có route.
- Có capability/permission mapping.
- Có loading, empty, filtered-empty, error và forbidden state.
- Có currency handling.
- Có sensitive data policy.
- Có lifecycle mapping.
- Có immutable-state behavior.
- Có long-running action handling.
- Có cache invalidation.
- Có concurrency handling.
- Có source/reference resolution.
- Có null/mixed currency handling.
- Có trace ID.
- Có keyboard navigation.
- Có responsive strategy.
- Có reduced-motion behavior.
- Có happy-path test.
- Có permission-denied test.
- Có conflict/business-rule test.
- Có calculation failure test.
- Có accessibility smoke test.
- Không nhập UUID.
- Không dùng raw JSON làm primary UI.
- Không tính lại financial totals ở frontend như source of truth.
- Không optimistic update approve/apply/recalculate.
- Không render masked value thành 0.
- Không hiển thị client preview với internal financial data.
- Không cho edit approved/finalized artifact nếu backend không cho phép.
- Không triển khai feature khi contract chưa đủ mà không feature-flag.

---

# 39. Research References

UI decisions trong tài liệu được đối chiếu với các pattern và tài liệu chính thức về:

- Microsoft Project / Planner resource capacity, availability, workload và capacity heatmap.
- Microsoft Dynamics 365 Project Operations baseline, variance và project financial tracking.
- Microsoft Dynamics 365 project quote và what-if scenario comparison.
- Salesforce CPQ quote versioning, cost-plus pricing và approval lifecycle.
- W3C WCAG / ARIA patterns cho grid, treegrid, keyboard interaction và reduced motion.

Các pattern được điều chỉnh theo domain và API contract của Scopery, không sao chép nguyên giao diện của sản phẩm khác.
