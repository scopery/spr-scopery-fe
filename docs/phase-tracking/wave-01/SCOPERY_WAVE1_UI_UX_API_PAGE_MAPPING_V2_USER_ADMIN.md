# SCOPERY WAVE 1 — UI/UX INFORMATION ARCHITECTURE & API PAGE MAPPING

> **Mục tiêu:** Gom khoảng 160 REST API của Wave 1 thành một hệ thống giao diện enterprise dễ dùng, dễ mở rộng và không tạo một màn hình riêng cho từng endpoint.
>
> **Nguyên tắc chính:** Thiết kế theo **công việc người dùng** và **đối tượng quản lý**, không sao chép cấu trúc module backend sang menu frontend.

---

## 1. Kết luận kiến trúc

### Số lượng màn hình đề xuất

- Khoảng **19 route/màn hình chính**.
- Các thao tác CRUD nhỏ sử dụng **side panel/drawer**.
- Các đối tượng phức tạp sử dụng **detail page có tabs**.
- Các cấu hình nhiều bước sử dụng **builder/full-page workflow**.
- Không tạo route riêng cho activate, deactivate, archive, publish, revoke hoặc duplicate; đây là các action trong detail page hoặc action menu.

### Cấu trúc sản phẩm tách theo đối tượng sử dụng

Không dùng một sidebar chung chứa cả chức năng làm việc hằng ngày và chức năng quản trị. Giao diện được tách thành hai không gian:

```text
USER APP
├── Home
├── Workspace Directory
├── Clients & Contacts
├── Forms / Submissions
├── Rate Lookup (nếu được cấp quyền)
└── My Account

ADMIN CONSOLE
├── Organization Administration
│   ├── Organizations & Workspaces
│   └── User Directory
├── Workspace Administration
│   ├── Members & Teams
│   ├── Roles & Assignments
│   └── Grants & Authorization
├── Security
│   └── Audit Log
├── Cost Administration
│   ├── Rate Card Library
│   ├── Rate Card Editor
│   ├── Costing Setup
│   └── Rate Resolution Diagnostics
└── Configuration
    ├── Configuration Overview
    ├── Custom Fields Studio
    ├── Forms Studio
    └── UI & Metadata
```

Admin có nút `Open Admin Console`; user thường không nhìn thấy nút này. Admin vẫn có thể quay lại User App để trải nghiệm hệ thống như một workspace member.

---

## 2. Phân tách User App và Admin Console

## 2.1 Nguyên tắc

- **User App** phục vụ công việc hằng ngày và chỉ hiển thị dữ liệu/nghiệp vụ mà member cần dùng.
- **Admin Console** phục vụ quản trị người dùng, quyền, cấu hình, chi phí và audit.
- Không chỉ ẩn menu bằng frontend; mọi route và action vẫn phải được backend authorization kiểm tra.
- User App và Admin Console dùng chung design system, authentication, workspace context và component library nhưng có navigation shell khác nhau.
- Không tự động chuyển một user vào Admin Console chỉ vì họ có một quyền quản trị nhỏ; họ chủ động mở Admin Console khi cần.

## 2.2 Nhóm persona

| Persona | Không gian mặc định | Chức năng chính |
|---|---|---|
| Regular User / Workspace Member | User App | Xem workspace, directory, clients/contacts được phép xem, submit form, xem profile |
| Team Lead / Project Lead | User App | Như member, thêm các action được delegation hoặc role cho phép |
| Workspace Admin | Admin Console | Member, team, workspace role, assignments, grants, workspace configuration |
| Organization Admin | Admin Console | Organization, workspace, user administration trong phạm vi organization |
| Security Admin / Auditor | Admin Console | Grants, authorization tester, audit events, security diagnostics |
| Cost Admin / Finance Manager | Admin Console | Cost roles, rate cards, inflation policies, member cost-role assignments |
| System Admin | Admin Console | Global users, organizations, system roles, permission matrix và toàn bộ scope được cấp |

## 2.3 User App navigation

```text
Home
Workspace
├── Directory
└── Clients & Contacts
Forms
├── Available Forms
└── My Submissions
Tools
└── Rate Lookup          [chỉ hiện khi có quyền]
Account
└── Profile & Security
```

### User App không nên hiển thị

- Global user management.
- Organization/workspace lifecycle.
- Permission matrix.
- Role CRUD.
- Grant CRUD/delegation.
- Audit log toàn hệ thống.
- Rate-card version editor.
- Inflation policy.
- Custom-field definition.
- Form/layout/status/taxonomy builders.

User có thể nhìn thấy kết quả của cấu hình, ví dụ custom fields hoặc custom form, nhưng không nhìn thấy màn hình tạo cấu hình đó.

## 2.4 Admin Console navigation

```text
Overview

Organization
├── Organizations & Workspaces
└── User Directory

Workspace
├── Members & Teams
├── Roles & Assignments
└── Grants & Authorization

Security
└── Audit Log

Costs
├── Rate Card Library
├── Costing Setup
└── Rate Resolution

Configuration
├── Overview
├── Custom Fields
├── Forms
└── UI & Metadata
```

Navigation được tạo từ capability/permission, không hard-code theo một role name duy nhất.

## 2.5 Phân loại các màn hình hiện có

| Page ID | Trang | User | Admin | Ghi chú |
|---|---|---:|---:|---|
| AUTH-01 | Login | Có | Có | Shared |
| AUTH-02 | Password Recovery | Có | Có | Shared |
| HOME-01 | Workspace Home | Có | Có | Admin mở trong User App |
| ORG-01 | Organizations & Workspaces | Không | Có | Organization/System Admin |
| PEOPLE-01 | User Directory | Hạn chế | Có | User chỉ dùng simplified directory nếu được phép |
| PEOPLE-02 | Members & Teams | Read-only tùy quyền | Có | CRUD nằm trong Admin Console |
| ACCESS-01 | Roles & Permissions | Không | Có | Workspace/System Admin |
| ACCESS-02 | Grants & Authorization | Không | Có | Security/Workspace Admin |
| SEC-01 | Audit & Security | Không | Có | Auditor/Security Admin |
| EXT-01 | Clients & Contacts | Có | Có | User App cho nghiệp vụ; Admin có thêm create/manage |
| RATE-01 | Rate Card Library | Không | Có | Cost Admin |
| RATE-02 | Rate Card Editor | Không | Có | Cost Admin |
| RATE-03 | Costing Setup | Không | Có | Cost Admin |
| RATE-04 | Rate Resolution | Có điều kiện | Có | User chỉ dùng lookup đơn giản; admin dùng diagnostic đầy đủ |
| CONFIG-01 | Configuration Overview | Không | Có | Workspace Admin |
| CONFIG-02 | Custom Fields Studio | Không | Có | Workspace Admin |
| CONFIG-03 | Forms Studio | Không | Có | User chỉ submit form, không dùng builder |
| CONFIG-04 | UI & Metadata | Không | Có | Workspace Admin |
| PROFILE-01 | Profile & Security | Có | Có | Shared |

## 2.6 Cùng API nhưng khác giao diện theo persona

### Members

**User App**

- Xem danh sách thành viên cơ bản.
- Xem tên, avatar, team, trạng thái có thể liên hệ.
- Không hiển thị internal IDs, audit metadata hoặc lifecycle actions.

**Admin Console**

- Add member.
- Activate/deactivate.
- Team assignment.
- Role assignment.
- Cost-role link.
- Administrative metadata.

### Clients & Contacts

**User App**

- Tìm client/contact.
- Xem thông tin được phép.
- Chọn contact trong form hoặc nghiệp vụ.

**Admin Console**

- Tạo external organization/contact.
- Gán primary contact.
- Quản lý status.
- Xem metadata cấu hình.

### Forms

**User App**

- Danh sách form có thể dùng.
- Render form published.
- Submit.
- Xem submission của bản thân hoặc đối tượng được phép.

**Admin Console**

- Tạo form.
- Tạo version.
- Xây section/field.
- Preview.
- Publish.
- Xem toàn bộ submission theo quyền.

### Rate Resolution

**User App**

- Form lookup đơn giản.
- Chỉ trả kết quả business-friendly.
- Ẩn internal rateCardId/versionId/lineId trong mặc định.

**Admin Console**

- Diagnostic inputs đầy đủ.
- Resolution chain.
- Internal references.
- Copy JSON và trace information.

## 2.7 Chuyển đổi giữa hai không gian

Top bar của admin có:

- `Back to Workspace`
- Organization/workspace context.
- Admin Console label rõ ràng.
- Optional `View as member` ở phase sau, chỉ khi backend hỗ trợ impersonation an toàn.

Không nên:

- Dùng cùng một sidebar rồi disabled hàng loạt menu.
- Hiển thị menu admin cho user rồi để họ gặp trang 403.
- Trộn form submission với form builder trong cùng màn hình.
- Trộn rate lookup hằng ngày với rate-card configuration.

---

## 2. App Shell đề xuất

### Global top bar

Các component:

- `OrganizationSwitcher`
- `WorkspaceSwitcher`
- `GlobalSearchButton`
- `CommandPaletteTrigger`
- `HelpMenu`
- `NotificationPlaceholder`
- `UserMenu`

### Left navigation

- Collapsible sidebar.
- Hiển thị nhóm menu theo quyền.
- Giữ trạng thái thu gọn.
- Trên màn hình nhỏ chuyển thành modal navigation.
- Không đưa toàn bộ configuration item lên sidebar; chỉ hiển thị một mục **Configuration** và dùng sub-navigation bên trong.

### Page header chuẩn

```text
Breadcrumb
Page title + short description
Status badge / scope badge
Primary action
Secondary actions / overflow
```

Mỗi màn hình chỉ nên có **một primary action chính**.

### Workspace context

Tất cả màn hình có API scoped theo `workspaceId` phải:

- Hiển thị workspace hiện tại rõ ràng.
- Không cho thao tác khi chưa chọn workspace.
- Giữ workspace gần nhất.
- Khi đổi workspace phải reset filter, selection và cache có liên quan.
- Hiển thị cảnh báo nếu người dùng đang thay đổi dữ liệu ở workspace khác.

---

## 3. Danh sách trang đề xuất

## AUTH-01 — Login

**API**

- `POST /api/v1/iam/auth/login`
- `POST /api/v1/iam/auth/refresh`
- `POST /api/v1/iam/auth/logout`
- `GET /api/v1/iam/me`

**UI**

- Centered authentication card.
- Username.
- Password.
- Show/hide password.
- Remembered username tùy chọn, không lưu password.
- Link quên mật khẩu.
- Inline validation.
- Loading state trên nút login.
- Generic credential error, không tiết lộ tài khoản có tồn tại.

**Không nên**

- Không cần dashboard background phức tạp.
- Không tự xử lý JWT bằng localStorage.
- Không hiển thị lỗi kỹ thuật thô.

---

## AUTH-02 — Password Recovery

**API**

- `POST /api/v1/iam/auth/password/reset-request`
- `POST /api/v1/iam/auth/password/reset-confirm`

**UI**

Flow hai bước:

1. Nhập email.
2. Đặt mật khẩu mới từ token.

Component:

- `PasswordRequirementChecklist`
- `SuccessState`
- `ExpiredTokenState`
- `ReturnToLoginLink`

Thông báo reset-request luôn giống nhau để không tiết lộ email có tồn tại.

---

## HOME-01 — Workspace Home

**API chính**

- `GET /api/v1/iam/me`
- Dữ liệu lightweight từ organization/workspace/configuration APIs.

**Mục đích**

Wave 1 chưa có API analytics tổng hợp, vì vậy Home không nên giả lập dashboard KPI. Trang này nên là **setup and navigation dashboard**.

**UI**

- Welcome header.
- Organization/workspace hiện tại.
- Setup progress:
  - Workspace đã cấu hình chưa.
  - Đã có member chưa.
  - Đã có role assignment chưa.
  - Đã có rate card chưa.
  - Đã có custom form chưa.
- Recent setup objects nếu dữ liệu có thể lấy nhẹ.
- Quick actions theo quyền.
- Empty-state onboarding cho workspace mới.

**Pattern**

- Calm dashboard.
- 4–6 action cards tối đa.
- Không dùng quá nhiều biểu đồ không có dữ liệu thực sự hữu ích.

---

## ORG-01 — Organizations & Workspaces

**API**

- Organizations: create, list, detail, update, activate, archive.
- Workspaces: create, list, detail, update, activate, archive.

**Cấu trúc trang**

Tabs:

1. `Organizations`
2. `Workspaces`

### Organizations tab

- Search.
- Status filter.
- Owner filter.
- Data table.
- Create button.
- Row click mở detail side panel.
- Archive/activate trong action menu.

### Workspaces tab

- Organization filter.
- Search.
- Status filter.
- Owner filter.
- Data table.
- Create workspace wizard.
- Detail side panel hoặc full detail route nếu sau này workspace có nhiều cấu hình.

### Component

- `ScopeBadge`
- `StatusBadge`
- `OwnerCell`
- `OrganizationSelect`
- `WorkspaceCreateForm`
- `LifecycleActionMenu`
- `ArchiveConfirmationDialog`

**UX**

- Create workspace nên tự chọn organization hiện tại.
- Không hiển thị UUID thô; dùng searchable entity picker.
- Archive phải hiển thị ảnh hưởng dự kiến.
- Activate có thể thực hiện trực tiếp nhưng vẫn cần feedback rõ ràng.

---

## PEOPLE-01 — User Directory

**API**

- Users create, list, detail, update.
- Activate, deactivate, suspend.

**UI**

- Search theo username/email.
- Status segmented filter.
- Paginated data table.
- Column: user, email, status, created, updated, actions.
- Create user bằng side panel.
- Detail drawer có:
  - Overview.
  - Status.
  - Role assignments.
  - Workspace memberships nếu dữ liệu liên kết có sẵn.
  - Security summary nếu được phép.

**Actions**

- Activate.
- Deactivate.
- Suspend.
- Edit full name.
- Open role assignment flow.

**UX**

- Status transitions dùng menu có mô tả.
- Suspend phải yêu cầu reason ở UI dù backend request hiện chưa nhận reason; reason có thể dùng cho audit note khi backend hỗ trợ sau.
- Không để action bằng icon không nhãn cho thao tác nhạy cảm.

---

## PEOPLE-02 — Members & Teams

**API**

- Workspace members.
- Workspace teams.
- Team members.

**Cấu trúc**

Tabs:

1. `Workspace Members`
2. `Teams`

### Members

- Searchable list.
- Filter active/inactive.
- Add member qua user picker.
- Detail side panel.
- Activate/deactivate.
- Link sang cost-role assignment.

### Teams

- Team card/list toggle.
- Data table mặc định cho quy mô lớn.
- Team detail side panel:
  - Overview.
  - Members.
  - Role assignments.
- Add/remove member.
- Archive/activate.

**Lưu ý**

Team API đang deprecated, vì vậy UI cần đặt service abstraction để sau này đổi sang OrgTeam API mà không phải viết lại toàn bộ component.

---

## ACCESS-01 — Roles & Permissions

**API**

- Roles.
- Permission matrix.
- Permission detail/actions.
- Rights.
- Role assignments.

**Cấu trúc trang**

Tabs:

1. `Roles`
2. `Permission Matrix`
3. `Assignments`
4. `Legacy Rights`

### Roles tab

- Search.
- Scope filter.
- Source filter.
- Status filter.
- Workspace filter.
- Role table.
- Create role side panel.
- Role detail full panel:
  - Basic information.
  - Assigned users/teams.
  - Permission summary.
  - Lifecycle.

### Permission Matrix tab

Đây là màn hình data-dense:

- Group theo `moduleCode`.
- Sticky first column.
- Permission ở rows.
- Actions ở nested columns hoặc expandable row.
- Risk badge.
- Resource scope.
- Data access policy.
- Subject types.
- Search và module filter.
- Read-only trong Wave 1.

### Assignments tab

- Assignee type.
- User/team picker.
- Role picker.
- Workspace scope.
- Active/inactive.
- Batch assign nếu backend bổ sung batch endpoint sau.

### Legacy Rights tab

- Chỉ dùng cho kiểm tra tương thích.
- Gắn nhãn `Legacy`.
- Không đặt ở vị trí nổi bật.

**UX quan trọng**

- Không dùng một modal khổng lồ cho permission matrix.
- Role detail nên cho xem impact: số user/team đang sử dụng role.
- Deactivate/soft-delete cần cảnh báo assignment đang bị ảnh hưởng.

---

## ACCESS-02 — Grants & Authorization

**API**

- Grants CRUD/lifecycle.
- Grant rights.
- Grant permission actions.
- Delegate.
- Revoke.
- Authorization check.
- Batch check.
- Explain.
- Legacy check-by-right.

**Cấu trúc trang**

Tabs:

1. `Access Grants`
2. `Authorization Tester`

### Grants tab

- Filters:
  - Subject.
  - Workspace.
  - Resource.
  - Effect.
  - Status.
  - Expiration.
- Data table.
- `ALLOW` và `DENY` dùng badge rõ ràng nhưng không phụ thuộc màu duy nhất.
- Expired/expiring soon indicator.
- Detail drawer:
  - Subject.
  - Resource and scope.
  - Role.
  - Rights.
  - Permission actions.
  - Delegation.
  - Expiry.
  - Reason.
  - Audit metadata.

### Create Grant flow

Dùng stepper 4 bước:

1. Subject.
2. Resource/scope.
3. Permissions/actions hoặc role.
4. Expiry and review.

Có summary cuối trước khi cấp quyền.

### Delegate flow

- Tách khỏi create grant thường.
- Hiển thị delegation depth.
- Giải thích quyền có thể được chuyển tiếp.
- Require reason.
- Review screen bắt buộc.

### Authorization Tester

Two-column layout:

- Left: permission, action, resource type, resource.
- Right: allowed/denied result.
- Reason.
- Explanation.
- Contributing grant IDs dưới dạng clickable references.
- History gần đây lưu local trong phiên.
- Batch mode bằng editable rows.

**UX**

- Revoke, DENY grant và delegation là action rủi ro cao.
- Không optimistic update cho action quyền truy cập.
- Sau action phải refresh authorization cache.

---

## SEC-01 — Audit & Security

**API**

- Audit events.
- Authorization explain có thể deep-link từ audit detail.
- Current user security state.

**UI**

- Filter bar:
  - Event type.
  - Severity.
  - Actor.
  - Resource type.
  - Organization.
  - Workspace.
  - Date range ở FE nếu backend hỗ trợ bổ sung.
- Paginated data table.
- Detail drawer:
  - Event overview.
  - Actor.
  - Target resource.
  - Before/after diff.
  - Reason.
  - Trace ID.
  - Occurred at.
- Copy trace ID button.
- JSON viewer có syntax formatting, collapse và copy.

**UX**

- Không render JSON raw thành một dòng.
- Before/after nên dùng field diff.
- Severity không chỉ biểu thị bằng màu.
- Cho phép deep-link tới resource nếu còn tồn tại.

---

## EXT-01 — Clients & Contacts

**API**

- External organizations.
- External contacts.

**Cấu trúc**

Split view:

- Left/primary: external organization list.
- Right/detail: selected organization.
- Contact tab nằm trong organization detail.
- Global contacts tab tùy chọn.

**UI**

- Filter organization type: client, vendor, other.
- Search organization/contact.
- Create organization side panel.
- Add contact ngay trong organization detail.
- Primary contact badge.
- Empty state khi organization chưa có contact.

**Lưu ý contract**

Response hiện không trả một số field như phone, title, taxId, website và updatedAt. UI không nên thiết kế bắt buộc các field này cho tới khi API được bổ sung.

---

## RATE-01 — Rate Card Library

**API**

- Rate card create/list/detail/update.
- Activate/deactivate/archive.
- Versions list/create.

**UI**

- Search.
- Scope filter.
- Organization/workspace filter.
- Status filter.
- Currency filter.
- Table/card toggle, mặc định table.
- Default rate card indicator.
- Current version status.
- Create rate card wizard.

**Create wizard**

1. Name/code.
2. Scope.
3. Scope target.
4. Currency/default.
5. Review.

Click row mở `RATE-02`.

---

## RATE-02 — Rate Card Editor

**API**

- Rate card detail.
- Versions.
- Publish/archive/duplicate.
- Rate card lines CRUD.

**Page layout**

```text
Rate card header
Version selector + status
Effective date banner
Tabs: Rate Lines | Version History | Settings
```

### Rate Lines

- Editable data grid chỉ khi version là DRAFT.
- Columns:
  - Cost role.
  - Seniority.
  - Location.
  - Currency.
  - Cost rate/hour.
  - Billing rate/hour.
  - Margin preview nếu tính được ở FE.
  - Notes.
- Add line.
- Duplicate line.
- Delete line.
- Validation inline.
- Sticky totals/summary tùy nhu cầu.

### Version History

- Timeline/table.
- Effective range.
- Published by/at.
- Duplicate.
- Archive.
- Compare versions nếu backend bổ sung API hoặc FE tải hai version.

### Publish workflow

- Readiness checklist.
- Validation errors.
- Effective date summary.
- Confirmation.
- Không cho publish bằng một click trực tiếp từ table.

**UX**

- DRAFT: editable.
- PUBLISHED: read-only.
- ARCHIVED: read-only.
- Hiển thị unsaved changes.
- Có leave-page guard.
- Không optimistic update cho publish/archive.

---

## RATE-03 — Costing Setup

**API**

- Cost roles.
- Member cost-role assignments.
- Inflation policies.

**Cấu trúc**

Tabs:

1. `Cost Roles`
2. `Member Assignments`
3. `Inflation Policies`

### Cost Roles

- Scope/category/status filters.
- Create/edit side panel.
- Lifecycle actions.
- Usage summary.

### Member Assignments

- Workspace required.
- Member search.
- Cost role filter.
- Effective date filter.
- Table có date ranges.
- Assignment editor side panel.
- Timeline preview cho một member.
- Cảnh báo overlapping effective ranges ở FE và hiển thị lỗi backend rõ ràng.

### Inflation Policies

- Scope filter.
- Effective period.
- Inflation percent.
- Compound frequency.
- Lifecycle.
- Date-range visualization nhỏ.
- Preview calculation chỉ khi công thức nghiệp vụ được xác nhận.

---

## RATE-04 — Rate Resolution

**API**

- `POST /api/rate-card/resolve`
- `POST /api/rate-card/preview-task-rate`

**Cấu trúc**

Tabs:

1. `Resolve Rate`
2. `Task Cost Preview`

### Resolve Rate

Input:

- Organization.
- Workspace.
- Project.
- Cost role/code.
- Target date.
- Currency.
- Rate type.

Result card:

- Selected rate card/version/line.
- Base rates.
- Adjusted rates.
- Inflation policy.
- Years forward.
- Resolution timestamp.
- Explanation trail nếu backend bổ sung sau.

### Task Cost Preview

- Task picker/ID.
- Estimate hours.
- Rate snapshot.
- Estimated labor cost.

**UX**

- Đây là diagnostic/preview tool, không phải form lưu.
- Giữ request gần nhất trong session.
- Copy result as JSON cho troubleshooting.
- Hiển thị rõ dữ liệu chỉ là preview.

---

## CONFIG-01 — Configuration Overview

**API**

- Object types.
- Counts/lists từ custom field, form, layout, status, tag, taxonomy APIs.

**UI**

- Object type selector.
- Configuration health cards:
  - Custom fields.
  - Forms.
  - Published layouts.
  - Status sets.
  - Tags.
  - Taxonomies.
- Quick create.
- Warnings:
  - Draft chưa publish.
  - Field chưa có option.
  - Form version chưa publish.
  - Layout chưa có current version.

Không cần chart phức tạp.

---

## CONFIG-02 — Custom Fields Studio

**API**

- Object types.
- Custom field definitions.
- Options.
- Values.
- Visibility policies.
- Validation rules.

**Layout**

Master-detail:

- Left: object type + field list.
- Center: selected field overview.
- Right side panel hoặc tabs cho properties.

Tabs của field:

1. `General`
2. `Options`
3. `Validation`
4. `Visibility`
5. `Usage`

### General

- Field key.
- Label.
- Type.
- Required.
- Sensitive.
- Client visible.
- Status.

### Options

Chỉ hiện với SELECT/MULTI_SELECT:

- Sortable option list.
- Add/edit.
- Archive.
- Drag-and-drop reorder nếu backend hỗ trợ lưu sort order.

### Validation

- Rule type.
- Friendly form theo từng rule.
- Advanced JSON chỉ là fallback.
- Validation preview.

### Visibility

- Audience matrix.
- Internal/client visibility.
- Explanation text.

### Values

Field values không nên có một trang quản trị riêng. Chúng được render trong detail/create/edit của object mục tiêu bằng `DynamicFieldRenderer`.

**UX**

- Sau khi field đã có data, thay đổi field type phải bị hạn chế hoặc yêu cầu migration.
- Sensitive fields có warning rõ ràng.
- Không bắt user nhập `ruleConfigJson` thủ công trong flow bình thường.

---

## CONFIG-03 — Forms Studio

**API**

- Form definitions.
- Form versions.
- Sections.
- Fields.
- Publish.
- Submit.
- Submission list/detail.

**Cấu trúc**

Tabs:

1. `Forms`
2. `Submissions`

### Form list

- Object type.
- Form type.
- Status.
- Current version.
- Create form.

### Form Builder

Full-page 3-pane builder:

```text
Left: field palette
Center: form canvas
Right: selected element properties
Top: version selector, preview, publish
```

Capabilities:

- Add section.
- Add core field/custom field.
- Instruction text.
- Separator.
- Reorder.
- Required/readonly.
- Preview desktop/mobile.
- Draft autosave hoặc explicit save tùy API.
- Publish checklist.

### Submissions

- Form filter.
- Status/validation status.
- Object target.
- Table.
- Detail drawer.
- Payload rendered thành field/value layout.
- Raw JSON nằm trong advanced section.

**UX**

- Không dùng modal cho builder.
- Published version luôn read-only.
- Tạo version mới để chỉnh sửa.
- Hiển thị version đang được dùng khi submit.

---

## CONFIG-04 — UI & Metadata

**API**

- Layouts.
- Status sets/values.
- Tags/assignments.
- Taxonomies/terms.

**Cấu trúc**

Tabs:

1. `Layouts`
2. `Status Sets`
3. `Tags`
4. `Taxonomies`

### Layouts

- Object type.
- Layout type.
- Draft/published.
- Layout builder.
- Schema-driven editor.
- JSON preview trong advanced tab, không bắt user chỉnh raw JSON.
- Publish flow.

### Status Sets

- Status set list.
- Ordered status values.
- Domain category.
- Drag reorder nếu backend hỗ trợ sort order.
- Preview workflow.

### Tags

- Tag library.
- Color picker có contrast preview.
- Allowed object types.
- Archive.
- Assignment được thực hiện tại object detail thông qua `TagPicker`.

### Taxonomies

- Taxonomy list.
- Hierarchical tree.
- Add root/child term.
- Expand/collapse.
- Search term.
- Không dùng flat table cho hierarchy chính.

---

## PROFILE-01 — Profile & Security

**API**

- `GET /api/v1/iam/me`
- Change password.
- Revoke all sessions.
- Logout.

**Tabs**

1. `Profile`
2. `Security`
3. `Organizations`

### Security

- Change password form.
- Password requirements.
- MFA status read-only trong Wave 1 nếu chưa có API setup.
- Revoke all sessions.
- Current-session warning.
- Success state yêu cầu login lại khi cần.

---

## 4. Component patterns dùng chung

## 4.1 DataTableShell

Dùng cho các list API có pagination.

Bao gồm:

- Search.
- Filter chips.
- Advanced filter popover.
- Column visibility.
- Sort state nếu API hỗ trợ.
- Pagination.
- Page size.
- Row selection.
- Batch action toolbar.
- Empty state.
- Error state.
- Refresh.
- Saved views ở phase sau.

Quy tắc:

- Tối đa 2 action inline trên row.
- Từ 3 action trở lên dùng overflow menu.
- Khi chọn rows, batch toolbar thay thế normal toolbar.
- Row click mở detail; checkbox và action buttons không trigger row navigation.
- Sticky header cho bảng dài.
- Không dùng horizontal scroll cho các cột không quan trọng; cho phép ẩn cột.

---

## 4.2 EntityDetailDrawer

Dùng cho xem nhanh và edit đơn giản.

Kích thước:

- 420–520 px cho detail đơn giản.
- 640–720 px cho form trung bình.
- Full page cho builder, permission matrix, rate card editor.

Structure:

- Header.
- Status/scope.
- Tabs.
- Scroll body.
- Sticky footer khi edit.
- Unsaved change guard.

---

## 4.3 LifecycleActionMenu

Chuẩn hóa:

- Activate.
- Deactivate.
- Suspend.
- Archive.
- Revoke.
- Publish.
- Duplicate.
- Soft delete.

Mỗi action khai báo:

- Risk level.
- Confirmation requirement.
- Required reason.
- Optimistic update allowed hay không.
- Success message.
- Cache invalidation.
- Required permission.

---

## 4.4 DynamicFieldRenderer

Map field type thành component:

| Field type | UI |
|---|---|
| TEXT | Text input |
| LONG_TEXT | Textarea |
| NUMBER | Integer input |
| DECIMAL | Decimal input |
| CURRENCY | Amount + currency |
| DATE | Date picker |
| DATETIME | Date-time picker |
| BOOLEAN | Checkbox/switch tùy ngữ cảnh |
| SELECT | Combobox |
| MULTI_SELECT | Multi-combobox |
| USER | User picker |
| TEAM | Team picker |
| EXTERNAL_CONTACT | Contact picker |
| EXTERNAL_ORGANIZATION | Organization picker |
| PROJECT | Project picker |
| TASK | Task picker |
| DOCUMENT | Document picker |
| URL | URL input |
| EMAIL | Email input |
| PHONE | Phone input |
| PERCENTAGE | Percentage input |

Renderer phải đọc:

- Required.
- Sensitive.
- Client visible.
- Options.
- Validation rules.
- Visibility policy.
- Layout placement.

---

## 4.5 EntityPicker

Không để người dùng nhập UUID.

Picker cần:

- Search.
- Debounce.
- Keyboard navigation.
- Selected summary.
- Scope awareness.
- Clear.
- Loading/empty/error.
- Optional recent items.

Các biến thể:

- UserPicker.
- TeamPicker.
- RolePicker.
- WorkspacePicker.
- OrganizationPicker.
- CostRolePicker.
- ExternalPartyPicker.
- Project/TaskPicker.

---

## 4.6 Status and scope badges

Không chỉ dùng màu.

Ví dụ:

- `Active` + check icon.
- `Inactive` + pause icon.
- `Suspended` + warning icon.
- `Archived` + archive icon.
- `Draft` + edit icon.
- `Published` + published icon.
- `Allow` + explicit label.
- `Deny` + explicit label.

---

## 5. Global UX rules

## 5.1 Progressive disclosure

- Mặc định chỉ hiển thị thông tin cần để hoàn thành tác vụ.
- Technical IDs, JSON, version metadata và trace details nằm trong Advanced/Developer details.
- Không dồn tất cả field vào một màn hình.

## 5.2 Search and filter

- Search input luôn có clear.
- Debounce 250–400 ms.
- Filter đang dùng hiển thị thành chips.
- Có `Clear all`.
- URL sync cho filter/list page để copy link.
- Server-side pagination.
- Reset page về 0 khi filter thay đổi.

## 5.3 Feedback

- Skeleton cho first load.
- Inline spinner cho row/action.
- Toast cho success không cần quyết định tiếp.
- Inline alert cho validation/business rule.
- Blocking error page chỉ khi toàn trang không hoạt động.
- Status message phải được screen reader nhận biết.

## 5.4 Error mapping

| HTTP | UI |
|---|---|
| 400 | Field errors + summary |
| 401 | Single refresh attempt, sau đó về login |
| 403 | Permission state có giải thích |
| 404 | Not-found state, link quay lại list |
| 409 | Conflict gần field/object liên quan |
| 422 | Business-rule callout, giữ dữ liệu form |
| 500 | Retry + copy trace ID |

Luôn giữ:

- `errorCode`
- `message`
- `details`
- `traceId`
- `path`

Không hiển thị stack trace.

## 5.5 Confirmation policy

Không cần confirmation cho:

- Mở drawer.
- Save edit thông thường.
- Activate reversible.
- Duplicate.

Cần confirmation cho:

- Archive.
- Delete.
- Revoke grant.
- Remove team member nếu ảnh hưởng quyền.
- Publish rate card/form/layout.
- Change password.
- Revoke all sessions.
- DENY/delegated grant.

Confirmation phải nói rõ:

- Object nào.
- Điều gì sẽ thay đổi.
- Có thể hoàn tác không.
- Ảnh hưởng đến ai.

## 5.6 Optimistic UI

Có thể dùng cho:

- Update label/description.
- Add/remove tag nếu reversible.
- Reorder local builder elements trước khi save.

Không dùng cho:

- Permission/grant changes.
- Publish.
- Archive.
- Password.
- Session revocation.
- Rate-card lifecycle.
- Financial rate changes.

---

## 6. API integration requirements

## 6.1 Cookie authentication

HTTP client phải dùng credentials:

```ts
credentials: "include"
```

Không lưu access token hoặc refresh token trong localStorage.

## 6.2 Refresh strategy

- Chỉ một refresh request chạy tại một thời điểm.
- Các request gặp 401 chờ cùng refresh promise.
- Retry request ban đầu một lần.
- Nếu refresh thất bại: clear client state và chuyển về login.
- Tránh vòng lặp refresh vô hạn.

## 6.3 Authorization-driven UI

- Dùng batch authorization check khi trang có nhiều action.
- Backend vẫn là nguồn quyết định cuối cùng.
- Không coi việc ẩn button là security.
- Action không phù hợp với trạng thái nên ẩn.
- Action phù hợp nhưng user thiếu quyền có thể disabled kèm lý do nếu việc biết action đó hữu ích.
- Action nhạy cảm không nên hiển thị khi user không được phép biết.

## 6.4 Pagination

API dùng zero-based page:

- UI có thể hiển thị page 1-based.
- Adapter phải chuyển đổi.
- Reset selection khi đổi page.
- Không giữ selection xuyên trang trừ khi batch flow hỗ trợ rõ ràng.

## 6.5 Null handling

Mọi response field có thể xuất hiện với `null`.

- Không dùng truthy check cho number/boolean.
- Phân biệt `false`, `0`, empty string và `null`.
- Render em dash hoặc `Not set`, không render literal `null`.

## 6.6 Traceability

- Lấy `X-Trace-Id` từ response header.
- Lưu trace ID cùng error.
- Cho phép copy trong error details.
- Gắn trace ID vào báo lỗi hỗ trợ.

---

## 7. Accessibility baseline

Mục tiêu: **WCAG 2.2 Level AA**.

Checklist:

- Keyboard dùng được toàn bộ.
- Focus visible.
- Focus không bị drawer/header che.
- Label thật cho mọi field.
- Error liên kết với field.
- Error summary focus được.
- Status/toast có live region phù hợp.
- Không chỉ dùng màu để truyền trạng thái.
- Text contrast tối thiểu theo WCAG.
- UI control tối thiểu 24×24 CSS px; mục tiêu thực tế 40–44 px cho touch.
- Modal trap focus đúng và trả focus về trigger khi đóng.
- Table có header semantics.
- Builder có alternative keyboard controls cho drag-and-drop.
- Tooltip không chứa thông tin bắt buộc duy nhất.
- Reduced-motion support.
- Date/currency không phụ thuộc locale mặc định không kiểm soát.

---

## 8. Responsive strategy

Scopery Wave 1 là hệ thống enterprise data-dense, nên áp dụng **desktop-first nhưng responsive**.

### Desktop

- Full sidebar.
- Multi-column filters.
- Tables.
- Split views.
- Builders.

### Tablet

- Collapsible navigation.
- Detail drawer gần full width.
- Table giảm cột.
- Filter trong side sheet.

### Mobile

Ưu tiên:

- Search/view detail.
- Quick status actions.
- Add simple entity.
- Review authorization result.
- View audit record.

Không ưu tiên mobile cho:

- Permission matrix.
- Rate card line editor.
- Form builder.
- Layout builder.
- Taxonomy tree editing phức tạp.

Các builder nên hiển thị read-only hoặc thông báo “Edit on larger screen” thay vì cố nhồi full functionality.

---

## 9. Xu hướng UI nên áp dụng có chọn lọc

### Nên dùng

- Calm, low-noise dashboard.
- Role-aware navigation.
- Command palette.
- Progressive disclosure.
- Side panels cho quick edit.
- Master-detail views.
- Inline edit có kiểm soát.
- Searchable entity pickers.
- Saved views ở phase sau.
- AI assistant sau này đặt theo context, không chiếm toàn bộ giao diện.
- Dense/comfortable table density toggle.
- Draft/publish workflows rõ ràng.

### Không nên chạy theo

- Glassmorphism làm giảm contrast.
- Animation quá nhiều.
- Card cho mọi dữ liệu.
- Dashboard nhiều biểu đồ nhưng không hỗ trợ quyết định.
- Icon-only navigation.
- Modal lồng modal.
- Editable JSON làm UI chính.
- Một menu sidebar phản ánh nguyên xi tất cả backend module.

---

## 10. Thứ tự implement

## P0 — UI Foundation

1. App shell.
2. Authentication.
3. Workspace context.
4. HTTP client/refresh/error adapter.
5. Permission gate.
6. DataTableShell.
7. EntityDetailDrawer.
8. Form primitives.
9. Status/scope badges.
10. Confirmation policy.
11. Empty/loading/error states.
12. Accessibility baseline.

## P1 — Foundation administration

1. Organizations & Workspaces.
2. User Directory.
3. Members & Teams.
4. Roles & Permissions.
5. Grants & Authorization.
6. Clients & Contacts.
7. Audit Log.
8. Profile & Security.

## P2 — Rate management

1. Rate Card Library.
2. Rate Card Editor.
3. Costing Setup.
4. Rate Resolution.

## P3 — Configuration studio

1. Configuration Overview.
2. Custom Fields Studio.
3. Forms Studio.
4. UI & Metadata.

---

## 11. Reusable frontend modules

```text
app-shell/
auth/
workspace-context/
authorization/
data-table/
entity-drawer/
entity-picker/
lifecycle-actions/
dynamic-fields/
builder-core/
error-handling/
audit-json-viewer/
rate-card-editor/
form-builder/
layout-builder/
taxonomy-tree/
```

---

## 12. Route proposal — tách User App và Admin Console

```text
PUBLIC / SHARED
/login
/password/forgot
/password/reset
/account

USER APP
/w/:workspaceId/home
/w/:workspaceId/directory
/w/:workspaceId/relationships
/w/:workspaceId/forms
/w/:workspaceId/forms/:formId
/w/:workspaceId/submissions
/w/:workspaceId/rates/lookup

ADMIN CONSOLE — ORGANIZATION
/admin/organizations
/admin/organizations/:organizationId
/admin/users
/admin/users/:userId

ADMIN CONSOLE — WORKSPACE
/admin/w/:workspaceId/overview
/admin/w/:workspaceId/members
/admin/w/:workspaceId/teams
/admin/w/:workspaceId/access/roles
/admin/w/:workspaceId/access/assignments
/admin/w/:workspaceId/access/grants
/admin/w/:workspaceId/access/tester
/admin/w/:workspaceId/security/audit

ADMIN CONSOLE — COST
/admin/w/:workspaceId/rates/cards
/admin/w/:workspaceId/rates/cards/:rateCardId
/admin/w/:workspaceId/rates/setup
/admin/w/:workspaceId/rates/resolve

ADMIN CONSOLE — CONFIGURATION
/admin/w/:workspaceId/config
/admin/w/:workspaceId/config/fields
/admin/w/:workspaceId/config/forms
/admin/w/:workspaceId/config/forms/:formId
/admin/w/:workspaceId/config/ui-metadata
```

Quy ước:

- `/w/...` luôn là User App.
- `/admin/...` luôn là Admin Console.
- Organization-level route không bắt buộc `workspaceId`.
- Workspace-scoped admin route luôn có `/admin/w/:workspaceId/...`.
- Route guard kiểm tra capability trước khi render shell.
- API 403 vẫn phải được xử lý vì frontend route guard không thay thế backend authorization.

---

## 13. Definition of Done cho mỗi màn hình

- Có route và permission guard.
- Có loading, empty, error, success.
- Có keyboard navigation.
- Có responsive behavior.
- Có API query/mutation mapping.
- Có cache invalidation.
- Có lifecycle action policy.
- Có null handling.
- Có 401/403/409/422 handling.
- Có trace ID.
- Có analytics event cho action chính nếu analytics được triển khai.
- Có unit/component test.
- Có integration test cho happy path và permission-denied path.
- Có accessibility test cơ bản.
- Không hiển thị UUID thay cho tên entity.
- Không tạo modal lồng modal.
- Không dùng raw JSON làm UX mặc định.
