# Bootstrap & Redirect — Single Source of Truth

## Ai quyết định redirect?

**Chỉ AuthContext** (trong `contexts/AuthContext.tsx`) là nơi quyết định redirect dựa trên `bootstrapStatus` và `pathname`. Các trang như `/`, `/onboarding` **không** tự redirect theo auth — họ chỉ xử lý logic riêng (vd. OAuth error query trên `/`) và render UI; AuthContext effect sẽ đưa user đúng nơi.

- **Trang `/` (Home)**: Chỉ xử lý query `error` / `error_code` / `error_description` (từ OAuth callback) → toast + replace sang login với query; sau đó chỉ render spinner. **Redirect theo session/bootstrap do AuthContext đảm nhiệm** (khi `isReady` và `pathname` thay đổi).
- **Trang `/onboarding`**: Chỉ kiểm tra nếu đã có orgs → redirect projects; còn lại render 2 tab. Không tự redirect needs_login/suspended — AuthContext đã redirect trước khi user tới onboarding nếu chưa login hoặc suspended.

Tránh: mỗi page một kiểu redirect → dễ loop (vd. `/` redirect onboarding, onboarding redirect `/`).

## Luồng bootstrap (AuthContext)

1. Đọc session từ cookie → không có token → `needs_login`, set orgs/profile null.
2. Có token → gọi profile → suspended → `suspended`; không có org → `needs_onboarding`; có org → list orgs.
3. **default_org_id**: Nếu `profile.default_org_id` null hoặc không nằm trong list orgs → chọn org đầu tiên (`orgList.items[0].id`), set `currentOrgId` và gọi **PUT set default org** để tránh state lửng (user đã có org nhưng default_org_id chưa sync).
4. Set `bootstrapStatus = 'ready'` → effect redirect `/` hoặc '' sang `/org/{currentOrgId}/projects`.

## Redirect rules (trong AuthContext effect)

| bootstrapStatus   | Điều kiện path              | Hành động                          |
|-------------------|-----------------------------|------------------------------------|
| needs_login       | Không phải suspended, không /invites/* | Replace → `/auth/login`           |
| suspended         | —                           | Replace → `/suspended`             |
| needs_onboarding  | Path không bắt đầu /onboarding | Replace → `/onboarding`           |
| ready             | Path là `/` hoặc ''         | Replace → `/org/{orgId}/projects`  |
| (public path)     | ready / needs_onboarding / suspended | Redirect tương ứng (projects / onboarding / suspended) |

Invite path (`/invites/*`) không bị force về login khi needs_login (để user có thể thấy trang invite rồi redirect login với returnTo).
