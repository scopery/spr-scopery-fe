# Redux Adoption — Store & Patterns

Khi chuyển từ bootstrap + guards + session cookie sang Redux, cần cập nhật các mục sau. **Chốt scope store trước khi mở phase** để tránh loạn state giữa local / react-query / redux.

## Store slices tối thiểu (chốt)

| Slice            | Nội dung                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **authSlice**    | `session` (access_token, refresh_token, user basic), `profile`, `suspended`, `bootstrapStatus`. Hydrate từ cookie on load. |
| **orgSlice**     | `orgs` list, `defaultOrgId`, `currentOrgId`, `memberships` (role/status per org từ API getOrg/list).                       |
| **projectSlice** | `currentProject`, `my_role`, counts (questions_count, answered_count); list per org nếu cần.                               |
| **sessionSlice** | Current session detail, **answers draft** (local), `saveStatus`, `progress`.                                               |
| **uiSlice**      | Modals, toasts, global loading (optional; có thể để local state).                                                          |

## Pattern autosave (sessions)

1. **Local form state** (component) → `dispatch(updateAnswerDraft({ questionId, ... }))`.
2. **Debounce thunk** `saveAnswers`: đọc draft từ store, gọi PUT answers.
3. **409 / 403** → chuyển mode readonly (ví dụ `SESSION_LOCKED` → set session lock state, toast, ngừng autosave).

Khi submit / lock / reopen session: **cancel** mọi autosave pending (clear debounce timer) để tránh PUT chạy sau và gặp 409.

## Cập nhật so với as-is

- **Bootstrap**: Thay `runBootstrap()` bằng dispatch load profile + listOrgs + set currentOrgId.
- **Guards**: AuthGuard kiểm tra `session` từ store; org/project guards đọc role từ store.
- **Invite accept**: Sau accept + setDefaultOrg → dispatch refresh orgs + profile (hoặc full bootstrap), xong mới redirect.
