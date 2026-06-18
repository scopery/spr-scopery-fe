# As-Is: Chức năng hiện tại của Web (Frontend)

Tài liệu mô tả các chức năng đang có trên web tại thời điểm hiện tại (as-is), không bao gồm kế hoạch hay tính năng chưa làm.

---

## 1. Tổng quan luồng ứng dụng

- **Landing (`/`)**: Nếu chưa đăng nhập → chuyển `/auth/login`. Nếu đã đăng nhập thì bootstrap (profile → orgs → default org) và redirect theo trạng thái:
  - `suspended` → `/suspended`
  - `needs_onboarding` (chưa có org) → `/onboarding`
  - `ready` → `/org/{orgId}/projects`
- **Bootstrap**: Đọc session từ cookie → gọi API profile → nếu suspended thì dừng; nếu không có org thì cần onboarding; nếu có org thì lấy danh sách org, set default org, vào projects.
- **Protected routes**: Các trang trong `/onboarding`, `/org/[orgId]` dùng `AuthGuard`: chưa có session thì redirect về `/auth/login`.
- **Invite accept (`/invites/[token]`)**: Trang đặc biệt, không bắt buộc đăng nhập để truy cập; nếu chưa login thì redirect `/auth/login?returnTo=/invites/<token>`.

---

## 2. Xác thực (Auth)

### 2.1 Đăng nhập (`/auth/login`)

- Form email + password; submit gọi API login v2.
- **Continue with Google**: gọi `/api/v2/auth/google` lấy URL redirect, chuyển user sang Google OAuth.
- **Continue with Apple**: UI có nút; logic tương tự (coming soon).
- Hiển thị lỗi từ query (`error`, `error_code`, `error_description`), toast khi sign-in thất bại.
- **returnTo**: Query `?returnTo=/path` → sau khi login thành công redirect về path đó (dùng cho invite accept flow).
- Link sang Đăng ký, Quên mật khẩu.

### 2.2 Đăng ký (`/auth/register`)

- Cho phép đăng ký bằng email + mật khẩu (full name, email, password, confirm password).
- Kiểm tra độ mạnh mật khẩu (weak / medium / strong).
- Sau khi đăng ký thành công, có session thì redirect theo bootstrap.

### 2.3 Callback OAuth (`/auth/callback`)

- Đọc `access_token` (và tùy chọn `refresh_token`) từ hash hoặc query.
- Lưu session (cookie) với `access_token`, `refresh_token`, `user`.
- Thành công → redirect về `/` (sau đó bootstrap redirect tiếp).
- Lỗi → hiển thị thông báo và nút "Back to sign in".

### 2.4 Quên mật khẩu (`/auth/forgot-password`)

- Form nhập email; gọi API forgot password.
- Sau khi gửi thành công: thông báo đã gửi link reset.

### 2.5 Tài khoản bị khóa (`/suspended`)

- Hiển thị khi `profile.status === 'suspended'` (sau bootstrap).
- Nội dung: "Account suspended", hướng dẫn liên hệ support.
- Nút **Logout** và link "Back to sign in".

---

## 3. Onboarding

### 3.1 Trang onboarding (`/onboarding`)

- Hiển thị khi user đã đăng nhập nhưng chưa có org nào (bootstrap status `needs_onboarding`).
- **2 tab**:
  - **Tab A — Create new organization**: Giữ như cũ. Form tên organization → gọi API tạo org, set default org, refresh bootstrap, redirect `/org/{orgId}/projects`.
  - **Tab B — Join by invite**: Form **Invite link or token** (paste link dạng `…/invites/<token>` hoặc token thô) → nút **Join organization** → parse token → POST `/api/v2/org-invites/accept` → set default org → clear `pending_invite_token` → refresh bootstrap → redirect `/org/{orgId}/projects`.
- **Tab mặc định**: Nếu `sessionStorage.pending_invite_token` tồn tại → mở tab **Join** (và pre-fill input); không thì tab **Create**.
- Nếu user đã có org (orgs.length > 0) khi vào trang → redirect `/org/{orgId}/projects`.
- **Parse token** (util `parseInviteToken`): trim; nếu input chứa `/invites/` thì lấy segment sau cùng; bỏ query/hash; validate regex (ký tự an toàn, độ dài 12–512); rỗng / có khoảng trắng / không hợp lệ → báo lỗi 422 UI-side.
- **Join error mapping** (theo `problem.code`): `INVITE_EXPIRED` → "Invite expired. Ask owner to resend."; `INVITE_INVALID` → "Invite invalid. Check the link/token."; `INVITE_EMAIL_MISMATCH` → "This invite was sent to a different email."; `ALREADY_ACCEPTED` → "Invite already used."; 403 → message forbidden chung.
- **pending_invite_token**: Khi user vào `/invites/[token]` chưa login, FE set `sessionStorage.pending_invite_token = token` rồi redirect login; sau khi login nếu vào onboarding (chưa có org) thì tab Join tự mở và có thể pre-fill. Sau join success (tại onboarding hoặc tại `/invites/[token]`) thì clear `pending_invite_token`.
- **Security**: Không log token ra console/monitoring; nếu debug thì mask dạng "abc…xyz".

### 3.2 Cài đặt profile (`/onboarding/profile`)

- Chỉnh sửa thông tin cá nhân: display name, avatar (upload).
- Gọi API update profile; có validation (ví dụ display name 1–255 ký tự).

---

## 4. Organization & App Shell

### 4.1 Layout org (`/org/[orgId]`)

- Mọi route con của `/org/[orgId]` đều bọc bởi `AuthGuard` và **AppShell**.
- Trang gốc `/org/[orgId]` chỉ redirect đến `/org/[orgId]/projects`.

### 4.2 App Shell (header chung)

- **Logo**: Link về `/`, logo Scopery.
- **Organization selector**: Popup hiển thị tên org hiện tại, role (badge), số members; chuyển org, New organization.
- **Nav chính**: Projects, Members.
- **User menu** (click avatar): Profile settings, Logout.

### 4.3 Org settings

- **Controlled lists** (`/org/[orgId]/settings/controlled-lists`): Quản lý danh sách kiểm soát (tạo, sửa, gắn project; list key, name, description, locked).
- **Stakeholders** (`/org/[orgId]/settings/stakeholders`): Trang cài đặt stakeholders của org. Chưa có trang Billing.

---

## 5. Projects

### 5.1 Danh sách projects (`/org/[orgId]/projects`)

- Gọi API danh sách project của org.
- Nút **New project** (ẩn nếu user có role org readonly, ví dụ partner).
- Query `?create=1` → mở modal tạo project.
- Mỗi card: badge role (Editable / View only với icon Pencil/Eye), tên project, mô tả (hoặc placeholder), link "View details" vào project detail.
- Empty state: icon, "No projects yet", nút Create project (nếu được phép).

### 5.2 Tạo project (CreateProjectModal)

- Modal: tên, mô tả (optional), chọn template (danh sách từ API templates published).
- Submit: gọi API tạo project với `template_id`; thành công → redirect đến `/org/[orgId]/projects/[projectId]`.

### 5.3 Chi tiết project (`/org/[orgId]/projects/[projectId]`)

- **ProjectStepIndicator**: Stepper mặc định 3 bước (Elicitation → Configure → Deploy); hỗ trợ `steps` tùy chỉnh, `hideStepper`, `stepperPosition` (top/bottom). Dùng component **Stepper** (atom) khi có steps.
- Link "Back to project": icon **CircleArrowOutUpLeft** (lucide), `aria-label="Back to project"`.
- Nút **Members**, **Questions** → link đến trang quản lý members và questions.
- Thống kê: Questions count, Answered count (từ API project detail).
- Nút **Create session** (chỉ editor), **Resume active session** (nếu có `active_session_id`).
- **Sessions**: Bảng (Name, Status, Created, Submitted, Open); mỗi hàng link đến session detail.
- Empty state: "No sessions yet", nút Create session.

### 5.4 Impact Analysis (`/org/[orgId]/projects/[projectId]/impact`)

- **ProjectStepIndicator**: Ẩn stepper mặc định; dùng **steps tùy chỉnh** (1. Create intake → 2. Choose baseline → 3. Review & apply), **stepperPosition="bottom"**. Back to project = icon **CircleArrowOutUpLeft**.
- **Luồng 3 bước**:
  - **Create intake**: paste text hoặc upload file → tạo intake; sau khi có intake chuyển bước 2.
  - **Choose baseline**: **Select** (design system) chọn session baseline; nút Run analysis (gọi impact analysis API).
  - **Review & apply**: Bảng proposals (question, proposed value, final value chỉnh được, Select Accept/Reject); nút Commit. Sau commit có thể tạo session từ revision và redirect sang session mới.
- API: run analysis (base session_id, intake_id), commit (batch_token, base, intake_id, decisions với question_id, action, final_value). Commit response trả `revision.id`; tạo session từ revision qua session service.
- **final_value**: Chuẩn theo answer_schema/q_type (text/textarea = string; number, boolean, date, select = đúng kiểu). Hỗ trợ `q_type` = open-ended (xử lý như text/textarea). Backend cần chuẩn hóa "open-ended" → "open_ended" khi commit nếu question trong DB có q_type "open-ended" (xem `utils/questionType.ts`).
- Xử lý 401: commit dùng `skipAuthRedirect: true`; trang bắt 401, toast "Session expired. Redirecting to login...", clear session, redirect login.
- Các toast lỗi (AI_BATCH_EXPIRED, v.v.) dùng message tiếng Anh từ `lib/errorHandling.ts`.

---

## 6. Project Members

### 6.1 Trang project members (`/org/[orgId]/projects/[projectId]/members`)

- Chỉ **owner** hoặc **project editor** mới thấy actions; viewer chỉ xem.
- Bảng: Name, Email, Role (editor/viewer), Status, Actions.
- **Add member**: Modal chọn user từ org members (active), chọn role (editor/viewer).
- **Change role**: Dropdown đổi role editor/viewer.
- **Remove member**: Nút Remove, confirm dialog.
- Xử lý lỗi: `ALREADY_PROJECT_MEMBER` (409).

---

## 7. Project Questions

### 7.1 Trang project questions (`/org/[orgId]/projects/[projectId]/questions`)

- Chỉ **project editor** mới thấy actions; viewer chỉ xem.
- **Back to project**: icon **CircleArrowOutUpLeft** (lucide), không dùng text.
- Danh sách câu hỏi nhóm theo section (overview, scope, …); mỗi section sort theo position, created_at.
- **Add question**: Modal form (section, prompt, q_type, required, help_text, answer_schema JSON). Gửi API dùng `normalizeQuestionTypeForApi(q_type)` (vd. open-ended → open_ended).
- **Edit**: Chỉ câu hỏi manual (`source=manual`); template question → 409 `TEMPLATE_QUESTION_IMMUTABLE`. Cập nhật question cũng chuẩn hóa `q_type` khi gửi.
- **Reorder**: Nút Up/Down sắp xếp thứ tự trong section.
- **Archive**: Nút Archive, confirm dialog; câu hỏi archived không hiện trong sessions.

### 7.2 AI Generate Questions (AIGenerateQuestionsModal)

- **API (theo `docs/API_DOCUMENTATION.md`)**:
  - **POST .../ai/questions/generate**: Body gồm `engine` (optional, `"legacy"` | `"agentkit_v2_file"` — default từ BE theo feature flag), `base_session_id`, `base_revision_id` (legacy only), `instruction`, `max_items`, `use_cached_digest` (v2). **V2:** bắt buộc `base_session_id` (422 nếu thiếu). **Legacy:** cần ít nhất một trong `base_session_id` hoặc `base_revision_id` (422 nếu không có cả hai). Lỗi: **409** `AI_FEATURE_DISABLED` (engine v2 nhưng feature tắt) → FE có thể fallback gọi lại với `engine: "legacy"` hoặc báo message; **413** `PAYLOAD_TOO_LARGE`; **502** AI errors.
  - **POST .../ai/questions/commit**: Body `batch_token`, `accepted_temp_ids`, `edits` — mỗi phần tử `edits` có dạng `{ "temp_id": "uuid", "patch": { "section"?, "prompt"?, "required"?, "tags"?, "q_type"? } }` (API doc dùng **patch** object). Batch hết hạn/đã dùng → **409** `AI_BATCH_EXPIRED`.
- **UI hiện tại**: Modal 2 bước — **Config** (instruction, chọn session context) → **Review** (list items, chỉnh section/prompt/required/tags/type, Accept từng item, Commit).
- **Config**: Instruction (optional). **Use session context**: Select baseline session (Active session / Latest session) hoặc "None". Khi BE dùng engine v2 mặc định thì **base_session_id bắt buộc** — nếu user chọn "None" có thể 422; FE nên ưu tiên chọn session (active/latest) mặc định. **Engine** (optional): có thể cho user chọn "Auto (server default)" / "Legacy" để tránh 409 khi v2 tắt; khi gặp **409 AI_FEATURE_DISABLED** thì tự retry với `engine: "legacy"` (nếu user cho phép) hoặc toast message.
- **Review**: Checkbox Accept từng item; chỉnh section, prompt, required, tags, q_type (Select với Q_TYPE_OPTIONS; nếu API trả q_type lạ thì thêm option đó). `q_type` chuẩn hóa bằng `normalizeQuestionTypeForApi` trước khi gửi. Commit gửi `edits` theo đúng format **patch** (mỗi edit: `temp_id` + `patch` object).
- **Lỗi**: 422 (thiếu base_session_id / base_revision_id) → hiển thị errors theo field; 413 → "Payload too large. Reduce scope or try a smaller input."; 429 → "Too many requests. Please try again later."; luôn show `request_id` trong error modal khi có.

---

## 8. Sessions

### 8.1 Danh sách sessions

- Hiển thị trực tiếp trên **project detail** (`/org/[orgId]/projects/[projectId]`).
- Bảng: Name, Status, Created, Submitted, Open (link).
- Badge status: In progress (tone progress #001F6D), Submitted (success), Locked (neutral).
- Không có trang sessions riêng.

### 8.2 Tạo session (CreateSessionModal)

- Modal: nhập tên session.
- Submit: gọi API tạo session; thành công → redirect đến session detail.

### 8.3 Chi tiết session – Elicitation (`/org/[orgId]/projects/[projectId]/sessions/[sessionId]`)

- **ProjectStepIndicator** với **steps tùy chỉnh**: 1. Answer questions → 2. AI improvement → 3. Lock session. Step active theo trạng thái: đang trả lời (không lock, không mở AI) = step 1; đang mở AI Improve (single hoặc all) = step 2; session submitted/locked = step 3. Back to project = icon **CircleArrowOutUpLeft**.
- **Header**: Title, Badge status, **Readiness badge** (khi có summary: "Readiness: &lt;label&gt; &lt;score&gt;", tooltip: coverage_score, clarity_score, missing_assessments), Created, save indicator (Cloud/CloudCheck), nút **AI Improve all**, **Save**, **Lock session** (khi có quyền).
- **Right panel**: **3 tab** Outline | Progress | Clarity. Progress: vòng tròn tiến độ (answered/skipped/na/required_missing), section list; Outline: danh sách section; **Clarity**: xem mục 8.4. Sidebar sticky, width 320px.
- **Lock**: Nút Lock session (editor hoặc owner); cho phép khi in_progress hoặc submitted.
- **Reopen**: Nút Reopen (chỉ **org owner**); cho phép khi submitted hoặc locked.
- Danh sách câu hỏi theo section + position; mỗi câu hỏi:
  - Loại: text, textarea, number, boolean, date, select/single_select, … (theo `q_type`).
  - Trạng thái: **answered** / **skipped** / **na** (not applicable).
  - Nhập/chọn giá trị (Input, Textarea, Switch, Select, …). Badge "Required" trước câu bắt buộc.
  - Nút **Assess clarity** (editor, khi answer_status = answered); **ClarityBadge** (label + score) khi đã assess, click mở modal chi tiết. Xem 8.4.
  - Nút AI Improve (từng câu) khi `canSave`; mở AIImproveModal.
- **AIImproveModal** / **AIImproveAllModal**: cải thiện câu (text/textarea) bằng AI, commit batch; hiển thị current vs proposed, chỉnh final value rồi commit.
- User có thể đổi trạng thái và nhập giá trị; nếu readonly (viewer) thì chỉ xem.
- **Auto-save**: Debounce 3s; save indicator (Saving… / Saved); chỉ hiển thị Saved khi lưu thành công.
- **Submit**: Click 2 lần confirm; gọi API submit.
- Xử lý lỗi: `SESSION_LOCKED` (409), `ALREADY_SUBMITTED` (409).

### 8.4 AI Clarity Assessment UI

- **API**: GET summary (`/api/v2/.../sessions/:sessionId/ai/clarity/summary`) — viewer/editor đều gọi; POST assess-one (`.../ai/clarity/assess-one`) — editor only. Success trả object trực tiếp; lỗi RFC 9457, branch theo `problem.code`.
- **Readiness badge** (header): Hiển thị "Readiness: &lt;readiness_label&gt; &lt;overall_readiness %&gt;". Tooltip: coverage_score, clarity_score, missing_assessments. Fetch summary khi mount trang.
- **Clarity tab** (right panel): overall_readiness, readiness_label; progress bars coverage_score, clarity_score; stats (required_total, required_answered, assessed_count, missing_assessments); top_blockers (click → scroll tới câu hỏi + highlight 2s); suggested_fixes (click → scroll + highlight). Nếu editor và missing_assessments &gt; 0 và không 409 AI_FEATURE_DISABLED: CTA "Assess missing required answers" (bulk assess-one tuần tự).
- **Per-question**: answer_status ≠ answered → disable nút Assess (tooltip "Answer required to assess"). Editor và !isOrgReadonly → nút "Assess clarity"; đã có assessment trong state → **ClarityBadge** (label + score), click mở **ClarityDetailsModal**.
- **ClarityDetailsModal**: clarity_score (0.00), clarity_label; ambiguity_tags; missing_fields; answer_guidance; suggested_answer_template (code block + Copy); follow_up_questions (priority badge). Editor: nút Re-assess clarity.
- **question_order**: FE sort questions (section ASC, position ASC, created_at ASC) → flatten → order = index + 1; map question_id → order cho assess-one.
- **answer_text**: util `toAnswerText(qType, value, answerSchema)` — text/textarea từ value.text; boolean/number String(value); single_select ưu tiên label; multi_select join; date value.date; fallback JSON.stringify. Không log answer_text.
- **Lỗi**: 409 AI_FEATURE_DISABLED → set featureDisabled, toast "Clarity assessment is disabled.", ẩn/disable assess toàn trang. 403 → toast "You don't have permission." 502 AI_* → toast "AI failed to assess. Please try again." 401 để apiClient redirect login.

---

## 9. Org Members & Invites

### 9.1 Trang members (`/org/[orgId]/members`)

- **2 tabs**: Members, Invites (tab Invites chỉ **owner** mới thấy).

#### Members tab

- Bảng: Name, Email, Role, Status, Actions.
- **Owner-only actions**:
  - **Change role**: Dropdown đổi role owner/member/partner.
  - **Remove member**: Nút Remove, confirm dialog.
  - **Leave organization**: Nút Leave org, confirm dialog.
- Xử lý lỗi: `LAST_OWNER` (409) khi leave/remove owner cuối.
- **Partner**: Toàn bộ mutation disable; handle 403.

#### Invites tab (owner-only)

- Danh sách invites: Email, Role, Status, Expires, Actions.
- **Create invite**: Modal (email, role member/partner); xử lý `ALREADY_MEMBER`, `INVITE_ALREADY_PENDING` (409).
- **Revoke**: Nút Revoke, confirm dialog.
- Dev/test: response có thể trả `invite_link` hoặc `invite_token`; FE hiển thị link để copy.

### 9.2 Trang accept invite (`/invites/[token]`)

- Token nằm trong path (không dùng query).
- **Chưa login**: Set `sessionStorage.pending_invite_token = token` (để onboarding sau này mở tab Join nếu user vào đó), rồi redirect `/auth/login?returnTo=/invites/<token>`.
- **Đã login**: Gọi POST `/api/v2/org-invites/accept` body `{ token }`; success → clear `pending_invite_token` → set default org → refresh bootstrap → redirect `/org/{orgId}/projects`.
- Xử lý lỗi: `INVITE_EXPIRED`, `INVITE_INVALID`, `INVITE_EMAIL_MISMATCH`, `ALREADY_ACCEPTED`; hiển thị message thân thiện.
- **Non-goals**: Không làm "Invite lookup/preview" trước khi accept (API không có endpoint an toàn để xem metadata).

---

## 10. Traceability

### 10.1 Trang trace (`/org/[orgId]/projects/[projectId]/trace`)

- Placeholder: tiêu đề "Traceability", mô tả "Traceability view will be available in a future phase."
- Nút "Back to project" về project detail.
- Chưa có UI trace thực (documents/outline services chưa tích hợp).

---

## 11. Phân quyền (FE)

- **isSuspended(status)**: profile suspended → redirect suspended.
- **isOrgReadonly(myOrgRole)**: role org = partner → ẩn/disable mọi mutation (project, session, members, invites).
- **canEditProject(myProjectRole)**: role project = editor mới được tạo/sửa session, answers, questions, project members; viewer chỉ xem.
- **resolveProjectRole(my_role)**: BE luôn trả `my_role` (org owner bypass ⇒ editor). FE dùng `project.my_role` từ API, không fallback/suy diễn.
- **Org owner**: Có quyền lock/reopen session; có quyền manage org members, invites; effective editor trên mọi project trong org.
- **Partner (route/UI)**: Partner không được "Leave org" hay "Change role" (Members tab). Create project/session modal không mở khi partner (kể cả URL `?create=1`). Session/answers form readonly cho partner.
- **Đồng bộ 3 tầng**: (1) UI disable/hide theo role; (2) Route guard (vd. `?create=1` không mở modal khi partner); (3) API 403 fallback — xử lý đẹp, không crash. Mọi nơi dùng chung helper: `isOrgReadonly`, `canEditProject`, `resolveProjectRole`, `isOwner` (org?.my_role === 'owner').

---

## 12. Design system & Utils (liên quan as-is)

- **Stepper** (atom): Component hiển thị danh sách bước dạng hexagon (id, label, active); dùng trong ProjectStepIndicator khi có `steps` tùy chỉnh.
- **Select** (atom, Radix): Dropdown với options `{ value, label }`. Lưu ý: Radix không cho phép option `value=""`; cần "None" thì dùng sentinel (vd. `__none__`) và map sang null khi xử lý.
- **Checkbox** (atom): Viền neutral-200, nền trắng; khi checked giữ nền trắng, dấu check màu đen (#171717); không bo góc (no rounded).
- **normalizeQuestionTypeForApi** (`utils/questionType.ts`): Chuẩn hóa `q_type` trước khi gửi API (vd. "open-ended" → "open_ended") để khớp enum backend. Dùng trong create/update project question và trong AIGenerateQuestionsModal khi build edits commit.

---

## 13. API & Hạ tầng FE

- **apiClient**: Gửi `Authorization: Bearer <access_token>`; parse RFC9457 `application/problem+json` khi lỗi; **401** → clear session, redirect login **với returnTo = path hiện tại** (trừ path chứa token, ví dụ `/invites/*`).
- **Error handling**: Với 409, **ưu tiên `code`** để branch logic (ALREADY_SUBMITTED, SESSION_LOCKED, …); `type` dùng log/diagnostic.
- **Helpers**: `isProblem(err)` / `isProblemDetails(err)`, `getProblemCode(err)` / `getErrorCode(err)`, **`normalizeProblem(err)`** → `{ status, code, detail }`, **`getProblemRequestId(err)`**, **`getProblemForModal(err)`** → `{ message, request_id }` (dùng cho error modal; luôn hiển thị request_id khi có). Quy ước: 409 luôn có code; FE branch theo code.
- **Endpoints**: Auth v2, profile, orgs (members, invites, leave), projects (members, questions), sessions (answers, submit, lock, reopen, progress); routes trong `constants/routes.ts`.
- **Session**: Đọc/ghi từ cookie; bootstrap dùng token để gọi profile + list orgs.
- **Tokens**: Không log token/invite token ra console; không đưa token vào query string. **Trang `/invites/[token]`**: tuyệt đối không ghi token vào analytics/logs/error reporting (Sentry breadcrumb, etc.); **nếu dùng Sentry**: scrub route param trong `beforeSend` (vd. `/invites/<token>` → `/invites/[REDACTED]`).
- **Invite token util** (`utils/inviteToken.ts`): `getPendingInviteToken()`, `setPendingInviteToken(token)`, `clearPendingInviteToken()`, `parseInviteToken(input)` — chuẩn hóa link/token, validate, throw nếu lỗi (422 UI-side).

---

## 14. Các trang / luồng chưa có hoặc chỉ placeholder

- **Forgot password**: Chỉ gửi email reset link; không có trang đổi mật khẩu mới (reset bằng link từ email do backend xử lý).
- **Reset password** (`/auth/reset-password`): Trang đã có; hiện hiển thị hướng dẫn dùng link từ email để đặt lại mật khẩu, nút "Back to sign in" và "Request new link". Form nhập mật khẩu mới (từ token trong URL) sẽ bổ sung khi BE cung cấp endpoint.
- **Trace**: Chỉ placeholder, chưa tích hợp trace thực.
- **Admin UI (templates)**: Đã implement — xem **mục 18**.
- **Billing**: Chưa có trang Billing. **Organization settings**: Đã có — `/org/[orgId]/settings/controlled-lists`, `/org/[orgId]/settings/stakeholders` (controlled lists, stakeholders). Link từ App Shell trỏ members.

## 15. Invite accept & bootstrap

- Sau khi accept invite: **refresh org list + membership** (gọi `refreshBootstrap()`) trước khi redirect về `/org/{orgId}/projects` để tránh vào org mà FE chưa có org đó trong store → 404/redirect vòng.

## 16. Redux adoption

- Khi chuyển sang Redux: store slices và pattern autosave ghi trong `docs/REDUX_ADOPTION.md`. Chốt scope slices trước khi mở phase để tránh loạn state.

## 17. Bootstrap & redirect (single source of truth)

- **Chỉ AuthContext** quyết định redirect theo `bootstrapStatus` và path; trang `/` không tự redirect (chỉ xử lý OAuth error query). Chi tiết: `docs/BOOTSTRAP_REDIRECT.md`.

---

## 18. Admin (Templates)

- **Phân quyền**: Chỉ user có `profile.role === 'admin'` mới vào được các route `/admin/*`. Non-admin → 403, redirect về home (hoặc default org projects) + toast.
- **Layout**: `AuthGuard` + `AdminShell` (header: logo về `/`, "Admin Control", nav Templates, user menu: Profile settings, Logout). Routes: `ROUTES.admin.templates`, `ROUTES.admin.templateNew`, `ROUTES.admin.template(templateId)`.

### 18.1 Danh sách templates (`/admin/templates`)

- Gọi API danh sách template (template.service). Filter theo status: All / Draft / Published / Deprecated (Select). Ô search theo tên. Nút **New template** → `/admin/templates/new`. Mỗi hàng: tên, version, status (Badge), Created; actions: View (vào detail), Duplicate (tạo bản copy rồi redirect detail bản mới). Empty state: "No templates yet", nút New template.

### 18.2 Tạo template mới (`/admin/templates/new`)

- Form: Name (bắt buộc), Version (optional). Submit → API tạo template → redirect `/admin/templates/[templateId]`.

### 18.3 Chi tiết template (`/admin/templates/[templateId]`)

- **Back**: Link icon **CircleArrowOutUpLeft** về danh sách templates.
- Header: Tên template, Badge status (draft / published / deprecated). Draft: nút **Publish** (cần ít nhất 1 question active), **Duplicate**. Mọi template: nút **Duplicate**.
- **Tabs**: Overview, Questions, JSON.
- **Overview** (chỉ draft): Input Name, Version; nút Save. Published/deprecated: chỉ xem.
- **Questions**: Bảng nhóm theo section (overview, scope, risks, …); cột Section, Prompt, Type, Required, Tags, Status, Position. Draft: nút **Add question**; mỗi hàng actions: Edit, Archive / Restore, Up/Down (reorder trong section). Add/Edit question: section, prompt, q_type (text, textarea, single_select, multi_select, number, date, boolean, json), required (Checkbox), tags (optional). Gửi API dùng `normalizeQuestionTypeForApi(q_type)`. Archive: confirm dialog; unarchive khôi phục status active. Reorder: swap position với câu trên/dưới trong cùng section.
- **JSON**: Tab xem/export cấu trúc template (read-only hoặc copy).
- Lỗi: Template not found → thông báo + link Back to templates. Toast lỗi dùng `getProblemToastMessage` từ `lib/errorHandling.ts`.

---

*Tài liệu as-is, cập nhật theo codebase tại thời điểm viết. Khi thêm/bớt tính năng nên cập nhật lại doc này.*
