# Phase 2 Implementation — FE match API v2 + Phase 2 screens

Mục tiêu: Update UI/flows match 100% Scopery API v2 (no envelope), bỏ workaround cũ, chuẩn hoá error handling RFC 9457, implement Phase 2 screens.

---

## 0) NỀN TẢNG (must-do trước)

### 0.1 API client

- [x] Tất cả call dùng base `/api/v2` (endpoints.ts v2())
- [x] Success: dùng trực tiếp payload, KHÔNG unwrap `{ ok, data }`
- [x] Header: `Authorization: Bearer <session.access_token>` only
- [ ] 401: trigger Supabase refresh (hoặc sign out + redirect /login nếu refresh fail) — hiện clear session + redirect
- [x] Parse errors: `application/problem+json` → `ProblemDetails` (type, title, status, detail, instance, code?, errors?, request_id)

### 0.2 Error UX chuẩn hoá (centralized)

- [x] 422: field-level errors từ `errors[]` (path/message) — helper `getFieldErrors(err)`
- [x] 403: "Bạn không có quyền" + disable actions theo role trước khi gọi
- [x] 404: 404 page (IDOR mismatch → 404)
- [x] 409: branch theo `code` (ưu tiên code, type chỉ log) — `getProblemToastMessage(err)` / conflict code map
- [x] 429 TOO_MANY_REQUESTS: toast "Thao tác quá nhanh, thử lại sau"

### 0.3 Loại bỏ workaround cũ

- [x] Bỏ fallback my_role=null: BE đảm bảo luôn có `my_role`; org owner bypass => editor. FE dùng `project.my_role` (không suy diễn từ project_members row).

---

## 1) PERMISSIONS UI

- [x] Org partner: mutation disable + ẩn CTA (create project/session, PUT answers, submit/lock/reopen, invites, member mgmt, project members/questions)
- [x] Project viewer: disable/ẩn PUT answers, submit, lock
- [x] Org owner: reopen session, org invites/member mgmt; effective editor mọi project (BE trả my_role=editor)
- [ ] profile.status = suspended: disable mọi mutation + banner "Tài khoản bị suspended"

---

## 2) AUTH / PROFILE

- [x] Login/Register/Google flow; lưu access_token
- [ ] /auth/reset-password nếu dùng Supabase recovery link
- [x] GET/PATCH profile; avatar: POST /profile/avatar → PUT signed_url → PATCH avatar_url

---

## 3) ORGS (Phase 2)

### 3.1 Org Invites (owner-only)

- [x] List: GET /orgs/:orgId/invites
- [x] Create: POST; revoke: POST revoke
- [x] Create response: invite_link/invite_token chỉ hiển thị dev
- [x] Accept: /invites/:token → POST /org-invites/accept; handle INVITE_EXPIRED, INVITE_INVALID, ALREADY_ACCEPTED, INVITE_EMAIL_MISMATCH, 429

### 3.2 Org Member management (owner-only)

- [x] List: GET /orgs/:orgId/members
- [x] PATCH role/status; POST leave
- [x] LAST_OWNER 409 → modal

---

## 4) PROJECTS (Phase 2)

### 4.1 List/detail

- [x] GET projects + detail; my_role (editor|viewer); counts, active_session_id, latest_session_id

### 4.2 Project Members (owner hoặc project editor)

- [x] GET members; POST add (201/200); 409 ALREADY_PROJECT_MEMBER; PATCH/DELETE

### 4.3 Project Questions (manual; editor-only)

- [x] GET questions by section; POST add manual; PATCH edit (409 TEMPLATE_QUESTION_IMMUTABLE); POST reorder {section, ordered_ids}; DELETE archive

---

## 5) SESSIONS (Phase 2)

### 5.1 List + create

- [x] GET sessions; POST create (editor/owner); partner/viewer disable

### 5.2 Session detail

- [x] GET session {questions[], answers[]}; map by question_id
- [x] Edit khi in_progress + my_role editor (hoặc org owner); PUT answers; 409 SESSION_LOCKED → readonly + toast
- [x] POST submit; 409 ALREADY_SUBMITTED; POST lock (editor/owner); POST reopen (chỉ owner); GET progress

---

## 6) ADMIN TEMPLATES (Phase 2)

- [ ] Route group /admin/templates; guard: profile.role=admin, else 403 → redirect home + toast
- [ ] List (GET /templates published); admin CRUD /api/v2/admin/\*
- [ ] Create draft, PATCH draft, questions CRUD, POST publish (409 TEMPLATE_NOT_DRAFT, TEMPLATE_NO_ACTIVE_QUESTIONS), POST duplicate

---

## 7) TYPES / ENUMS

- [x] ProfileRole, ProfileStatus, OrgMemberRole, ProjectRole, TemplateStatus, QuestionType, SessionStatus, AnswerStatus (single_select/multi_select)

---

## 8) Definition of Done (FE)

- [ ] Không còn unwrap envelope cũ
- [x] Không còn fallback my_role null
- [ ] Tất cả mutation buttons disable theo org role + project role + session status
- [ ] Tất cả error hiển thị đúng (422 field, 409 code, 429)
- [ ] Phase 2 screens: Org invites + member mgmt, Project members + questions + reorder, Session lock/reopen/progress, Admin templates
- [ ] E2E smoke: owner/member/partner × editor/viewer × session state transitions
