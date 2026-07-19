# Scopery Backend — API Specification

## 1. Docker / Connection Info

| Service    | Internal (Docker)        | External (localhost)  |
|------------|--------------------------|-----------------------|
| Backend    | `scopery-backend:8080`   | `http://localhost:8080` |
| PostgreSQL | `scopery-postgres:5432`  | `localhost:5433`      |
| Redis      | `scopery-redis:6379`     | `localhost:6379`      |

```bash
docker compose up -d
```

**Swagger UI:** `http://localhost:8080/swagger-ui.html`
**OpenAPI JSON:** `http://localhost:8080/v3/api-docs`

---

## 2. Authentication

### Flow
```
POST /api/iam/auth/login
  → server sets 2 HTTP-only cookies:
      access_token   (~15 min)
      refresh_token  (~7 days, path=/api/iam/auth only)
  → browser sends access_token cookie automatically on each request
  → when expired → POST /api/iam/auth/refresh
  → logout       → POST /api/iam/auth/logout
```

### Token — two ways to send
| Client | Method |
|--------|--------|
| Browser | `access_token` HTTP-only cookie (auto) |
| Postman / mobile | `Authorization: Bearer <token>` header |

### CSRF (Double Submit Cookie)
All **POST / PUT / PATCH / DELETE** except `/api/iam/auth/**` require CSRF token:

1. Server sets `XSRF-TOKEN` cookie (JS-readable, not HttpOnly)
2. FE reads `XSRF-TOKEN` and sends it as `X-XSRF-TOKEN` header

```js
// axios global setup
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';
```

---

## 3. Standard Response

### Success
```json
{ "success": true, "data": { ... }, "timestamp": "2026-06-22T07:00:00Z" }
```

### Paginated list (`data` field)
```json
{
  "items": [],
  "page": 0,
  "size": 20,
  "totalElements": 100,
  "totalPages": 5,
  "first": true,
  "last": false
}
```

### Error
```json
{
  "success": false,
  "status": 422,
  "errorCode": "WORKSPACE_CODE_ALREADY_EXISTS",
  "message": "Workspace code already exists: ACME",
  "details": [],
  "traceId": "uuid",
  "timestamp": "..."
}
```

### HTTP Status Convention
| Code | When |
|------|------|
| 200  | OK |
| 201  | Created (POST create endpoints) |
| 400  | Invalid input / validation error |
| 401  | Not authenticated |
| 403  | Authenticated but no permission |
| 404  | Resource not found |
| 409  | Conflict / duplicate |
| 422  | Business rule violation (wrong state, dependency inactive, etc.) |
| 500  | Server error |

---

## 4. Public Endpoints (no auth required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/iam/auth/login` | Login |
| POST | `/api/iam/auth/refresh` | Refresh token |
| POST | `/api/iam/auth/logout` | Logout |
| POST | `/api/iam/users` | Register new user |

---

## 5. IAM — Auth

**Base:** `/api/iam/auth`

| Method | Path | Request Body | Description |
|--------|------|--------------|-------------|
| POST | `/login` | `{ username*, password* }` | Login — sets `access_token` + `refresh_token` cookies |
| POST | `/refresh` | _(refresh_token cookie)_ | Rotate both tokens |
| POST | `/logout` | _(refresh_token cookie)_ | Clear cookies, revoke refresh token |

---

## 6. IAM — Users

**Base:** `/api/iam/users`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ username*(3-100), email*, fullName(max 255) }` | Create user — returns 201 |
| GET | `/{id}` | — | Get user by ID |
| GET | `/` | `?keyword&status&page=0&size=20` | Search users |
| PUT | `/{id}` | `{ fullName }` | Update full name |
| PATCH | `/{id}/activate` | — | Activate user |
| PATCH | `/{id}/deactivate` | — | Deactivate user |
| PATCH | `/{id}/suspend` | — | Suspend user |

---

## 7. IAM — Roles

**Base:** `/api/iam/roles`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/system` | `{ code*(2-100), name*, description, roleScope, roleSource, parentRoleId }` | Create system role |
| POST | `/workspace` | `{ code*(2-100), name*, description, roleScope, roleSource, workspaceId, parentRoleId }` | Create workspace role |
| GET | `/{id}` | — | Get role |
| GET | `/` | `?keyword&workspaceId&roleScope&roleSource&status&includeDeleted=false&page=0&size=20` | Search roles |
| PUT | `/{id}` | `{ name*, description }` | Update role |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/deactivate` | — | Deactivate |
| PATCH | `/{id}/soft-delete` | — | Soft delete |

---

## 8. IAM — Rights

**Base:** `/api/iam/rights`

`iam_right` is now a legacy compatibility catalog. New backend code and admin UI should model business authority as permission/action:

```text
Permission = grouped capability, e.g. WORKSPACE_MANAGEMENT
Action     = operation under that permission, e.g. UPDATE
Right      = legacy backing code, e.g. UPDATE_WORKSPACE
```

Admin UI should not ask users to choose rights directly. Use `/api/iam/permissions` and `/api/iam/grants/{id}/actions` instead. The rights endpoints remain for legacy/debug use during migration.

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| GET | `/{id}` | — | Get right |
| GET | `/` | `?keyword&module&status&page=0&size=50` | Search rights |

### IAM Permission / Action Catalog

**Base:** `/api/iam/permissions`

Permission/action metadata is seeded into the database and exposed for admin UI:

| Table | Purpose |
|-------|---------|
| `iam_permission` | Stores permission metadata: `code`, `module_code`, `name`, `description`, `resource_scope_level`, `data_access_policy`, `permission_category`, `assignable_subject_types`, `risk_level`, `status` |
| `iam_permission_action` | Stores action metadata under a permission. `right_id` is only a legacy bridge |
| `iam_permission_action_dependency` | Stores action dependencies, e.g. `UPDATE` requires `VIEW` |
| `iam_access_grant_permission_action` | Stores the actual permission actions attached to grants |

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| GET | `/matrix` | — | List active permissions with nested actions for FE permission matrix |
| GET | `/` | `?keyword&moduleCode&resourceScopeLevel&dataAccessPolicy&permissionCategory&riskLevel&assignableSubjectType&status&page=0&size=20` | Search permissions with nested actions |
| GET | `/{id}` | — | Get permission with nested actions |
| GET | `/{id}/actions` | — | List actions under one permission |

Permission response includes UI metadata:

```json
{
  "code": "WORKSPACE_ACCESS_MANAGEMENT",
  "name": "Workspace Access Management",
  "resourceScopeLevel": "WORKSPACE",
  "dataAccessPolicy": "SCOPE_WIDE",
  "permissionCategory": "ACCESS_CONTROL",
  "assignableSubjectTypes": ["ROLE", "TEAM", "USER"],
  "riskLevel": "HIGH",
  "actions": [
    { "id": "uuid", "actionCode": "INVITE_MEMBER", "legacyRightCode": "WORKSPACE_INVITE_MEMBER" }
  ]
}
```

Seeded authority examples:

| Permission | Action | Legacy backing right |
|------------|--------|----------------------|
| `SYSTEM_IAM_MANAGEMENT` | `VIEW_USER` | `VIEW_IAM_USER` |
| `SYSTEM_IAM_MANAGEMENT` | `MANAGE_ROLE` | `MANAGE_IAM_ROLE` |
| `SYSTEM_RESOURCE_MANAGEMENT` | `MANAGE` | `MANAGE_IAM_RESOURCE` |
| `SYSTEM_GOVERNANCE_MANAGEMENT` | `MANAGE` | `SYSTEM_MANAGE_GOVERNANCE` |
| `SYSTEM_NOTIFICATION_MANAGEMENT` | `MANAGE_TEMPLATE` | `SYSTEM_MANAGE_NOTIFICATION_TEMPLATE` |
| `ORGANIZATION_MANAGEMENT` | `CREATE_WORKSPACE` | `CREATE_WORKSPACE` |
| `WORKSPACE_MANAGEMENT` | `UPDATE` | `UPDATE_WORKSPACE` |
| `TEAM_MANAGEMENT` | `MANAGE` | `MANAGE_TEAM` |
| `WORKSPACE_ACCESS_MANAGEMENT` | `INVITE_MEMBER` | `WORKSPACE_INVITE_MEMBER` |
| `WORKSPACE_ACCESS_MANAGEMENT` | `MANAGE_JOIN_REQUEST` | `WORKSPACE_MANAGE_JOIN_REQUEST` |
| `WORKSPACE_ROLE_MANAGEMENT` | `ASSIGN_ROLE` | `ASSIGN_ROLE` |

Policy vocabulary:

| Field | Values | Meaning |
|-------|--------|---------|
| `resourceScopeLevel` | `SYSTEM`, `ORGANIZATION`, `WORKSPACE` | Resource level where this permission applies |
| `dataAccessPolicy` | `OWNER_ONLY`, `ANCESTOR_INHERITED`, `SCOPE_WIDE` | Which data inside the scope the granted subject can access |
| `permissionCategory` | See Appendix A | UI/admin grouping inside a scope |
| `assignableSubjectTypes` | `USER`, `TEAM`, `ROLE` | Which grant subject types may receive this permission |
| `riskLevel` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Admin warning/confirmation level |

`SCOPE_WIDE` does **not** mean public/anonymous access. It means: if a subject already has the permission/action in the scope, it can operate on all matching resources in that scope.

Catalog scope is not the same thing as granted scope:

```text
Permission catalog = what can be granted
Access grant       = who gets it, on which concrete IAM resource
```

For workspace permissions, FE must grant on the IAM resource of a specific workspace, not on a global/system resource.

Recommended FE grouping:

| UI group | Filter | Grant target |
|----------|--------|--------------|
| System | `resourceScopeLevel=SYSTEM` | `GLOBAL` IAM resource `GLOBAL_SYSTEM` |
| Organization | `resourceScopeLevel=ORGANIZATION` | Concrete `ORGANIZATION` IAM resource |
| Workspace | `resourceScopeLevel=WORKSPACE` | Concrete `WORKSPACE` IAM resource |

When assigning permissions, FE should hide or disable permission groups whose `assignableSubjectTypes` does not contain the selected grant `subjectType`. Backend also enforces this on `POST /api/iam/grants/{id}/actions`.

---

## 9. IAM — Access Grants

**Base:** `/api/iam/grants`

Access grants now attach permission actions through `iam_access_grant_permission_action`. Legacy rights are kept as compatibility/debug APIs; `POST /{id}/rights` dual-writes mapped permission actions when possible.

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ subjectType*, subjectId*, resourceId*, roleId, effect, scopeType, scopeRefId, workspaceId, grantedBy }` | Create grant |
| GET | `/{id}` | — | Get grant |
| GET | `/` | `?subjectId&resourceId&workspaceId&status&page=0&size=20` | Search grants |
| PATCH | `/{id}/revoke` | — | Revoke grant |
| GET | `/{id}/rights` | — | List rights on grant |
| POST | `/{id}/rights` | `{ rightId* }` | Add right to grant |
| DELETE | `/{id}/rights/{rightId}` | — | Remove right from grant |
| GET | `/{id}/actions` | — | List permission actions attached to grant |
| POST | `/{id}/actions` | `{ permissionActionId }` or `{ permissionCode, actionCode }` | Add permission action to grant |
| DELETE | `/{id}/actions/{permissionActionId}` | — | Remove permission action from grant |

Grant behavior:

- A grant without attached permission actions grants **nothing**.
- `POST /{id}/actions` saves `permission_action_id` directly and does not require `right_id`.
- Authorization checks permission actions first. Legacy `rightCode` checks are resolved to mapped permission actions when possible.
- Workspace-scoped permissions can only be granted on a concrete `WORKSPACE` IAM resource.
- Organization-scoped permissions can only be granted on a concrete `ORGANIZATION` IAM resource.
- System-scoped permissions can only be granted on the `GLOBAL` IAM resource and must not carry a `workspaceId`.
- Workspace grants must carry `workspaceId`, and it must match the target workspace IAM resource.
- Organization grants must not carry `workspaceId`.
- Permission actions can only be attached when the grant `subjectType` is listed in the permission's `assignableSubjectTypes`.

### FE Expected Flow — Permission Assignment

1. Load available permissions:

```http
GET /api/iam/permissions/matrix
```

2. Resolve the concrete IAM resource:

```http
GET /api/iam/resources/by-code?resourceType=GLOBAL&code=GLOBAL_SYSTEM
GET /api/iam/resources/by-ref?resourceType=WORKSPACE&refId={workspaceId}
GET /api/iam/resources/by-ref?resourceType=ORGANIZATION&refId={organizationId}
```

3. Find or create the grant for the selected subject and resource:

```http
GET /api/iam/grants?subjectId={userId}&resourceId={iamResourceId}&workspaceId={workspaceId}&status=ACTIVE
POST /api/iam/grants
```

4. Load current selected actions:

```http
GET /api/iam/grants/{grantId}/actions
```

5. Save checkbox changes as deltas:

```http
POST   /api/iam/grants/{grantId}/actions
DELETE /api/iam/grants/{grantId}/actions/{permissionActionId}
```

---

## 10. IAM — Role Assignments

**Base:** `/api/iam/role-assignments`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ assigneeType*, assigneeId*, roleId*, workspaceId, assignedBy }` | Assign role |
| GET | `/{id}` | — | Get assignment |
| GET | `/` | `?roleId&assigneeId&assigneeType&status&workspaceId&page=0&size=20` | Search assignments |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/deactivate` | — | Deactivate |

---

## 11. IAM — Auth Resources

**Base:** `/api/iam/resources`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ code*(2-100), resourceType*, name*(max 255), description }` | Register resource |
| GET | `/{id}` | — | Get resource |
| GET | `/` | `?keyword&resourceType&status&page=0&size=20` | Search |
| GET | `/by-ref` | `?resourceType&refId` | Get IAM resource by business entity reference |
| GET | `/by-code` | `?resourceType&code` | Get IAM resource by code and type |
| PUT | `/{id}` | `{ name*(max 255), description }` | Update |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/deactivate` | — | Deactivate |

Manual `POST /api/iam/resources` is limited to `GLOBAL` resources. Concrete `ORGANIZATION`, `WORKSPACE`, and `TEAM` resources are bootstrapped by their owning modules so they always carry a business `refId`.

---

## 12. IAM — Authorization Check

**Base:** `/api/iam/authorization`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/check` | `{ userId*, resourceId*, rightCode* }` | Debug: check if user has a legacy right on resource |

Example request:

```json
{
  "userId": "00000000-0000-0000-0000-000000000001",
  "resourceId": "00000000-0000-0000-0000-000000000002",
  "rightCode": "UPDATE_WORKSPACE"
}
```

Example response (`data` field):

```json
{
  "userId": "00000000-0000-0000-0000-000000000001",
  "resourceId": "00000000-0000-0000-0000-000000000002",
  "rightCode": "UPDATE_WORKSPACE",
  "allowed": true,
  "reason": "USER_GRANT_ALLOW"
}
```

Backend application services should call authorization with centralized constants instead of raw strings:

```java
iamIntegrationService.requireWorkspaceAccess(
    workspaceId, userId, IamAuthorities.WORKSPACE_UPDATE);
```

The HTTP debug endpoint has not yet been expanded to accept `{ permissionCode, actionCode }`; use `rightCode` for API testing for now.

---

## 13. Workspace — Organizations

**Base:** `/api/organizations`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ name*, code*, description }` | Create organization — returns 201 |
| GET | `/{id}` | — | Get organization |
| GET | `/` | `?keyword&ownerUserId&status&page=0&size=20` | Search organizations |
| PUT | `/{id}` | `{ name*, description }` | Update |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/archive` | — | Archive |

---

## 14. Workspace — Workspaces

**Base:** `/api/workspaces`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ organizationId*(UUID), name*, code*, description, defaultVisibility, joinPolicy }` | Create workspace — returns 201 |
| GET | `/{id}` | — | Get workspace detail |
| GET | `/` | `?organizationId&ownerUserId&keyword&status&page=0&size=20` | Search workspaces |
| PUT | `/{id}` | `{ name*, description, defaultVisibility, joinPolicy }` | Update |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/archive` | — | Archive |

**Enums:**
- `defaultVisibility`: `PRIVATE` | `PUBLIC`
- `joinPolicy`: `INVITE_ONLY` | `REQUEST_TO_JOIN` | `INVITE_OR_REQUEST` | `DISABLED`

---

## 15. Workspace — Members

**Base:** `/api/workspaces/{workspaceId}/members`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ userId*(UUID) }` | Add member — returns 201 |
| GET | `/` | `?userId&status&page=0&size=20` | List members |
| PATCH | `/{memberId}/activate` | — | Activate member |
| PATCH | `/{memberId}/deactivate` | — | Deactivate member |

---

## 16. Workspace — Teams

**Base:** `/api/workspaces/{workspaceId}/teams`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ name*, code*, description }` | Create team — returns 201 |
| GET | `/{teamId}` | — | Get team |
| GET | `/` | `?status&page=0&size=20` | Search teams |
| PUT | `/{teamId}` | `{ name*, description }` | Update team |
| PATCH | `/{teamId}/activate` | — | Activate |
| PATCH | `/{teamId}/archive` | — | Archive |
| POST | `/{teamId}/members` | `{ userId*(UUID) }` | Add team member |
| GET | `/{teamId}/members` | `?page=0&size=20` | List team members |
| DELETE | `/{teamId}/members/{userId}` | — | Remove team member |

---

## 17. Workspace — Invitations

**Base:** `/api/workspaces`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/{workspaceId}/invitations` | `{ invitedEmail, maxUses(Integer), expiresAt(Instant), sendEmail(boolean) }` | Create invitation — response includes `invitationCode` (raw, shown **once only**) |
| GET | `/{workspaceId}/invitations` | — | List invitations (`invitationCode` = null, only `invitationCodeHint` shown) |
| PATCH | `/{workspaceId}/invitations/{id}/revoke` | — | Revoke invitation |
| POST | `/invitations/{code}/accept` | — | Accept invitation by raw code |

> `invitationCode` is returned only on create. Store it immediately — it cannot be retrieved again.

---

## 18. Workspace — Join Requests

Join requests are **not** part of onboarding. Users submit and manage them after they have workspace access (or via the open entry point below). Requests do not expire automatically — they remain `PENDING` until approved, rejected, or cancelled by the requester.

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/api/workspaces/{workspaceId}/join-requests` | `{ message }` | Submit join request when workspace ID is known |
| POST | `/api/workspace-join-requests` | `{ workspaceId, workspaceCode, message }` | Submit join request via ID or code |
| GET | `/api/workspaces/{workspaceId}/join-requests` | `?status` | List join requests (workspace admin) |
| PATCH | `/api/workspaces/{workspaceId}/join-requests/{id}/approve` | — | Approve — adds user as member |
| PATCH | `/api/workspaces/{workspaceId}/join-requests/{id}/reject` | `{ reviewNote }` | Reject |
| DELETE | `/api/workspaces/{workspaceId}/join-requests/{id}` | — | Cancel own pending request |

**Join request statuses:** `PENDING` | `APPROVED` | `REJECTED` | `CANCELLED`

> **Note:** Invitation codes may have `expiresAt`; join requests do not expire on their own.

---

## 19. Workspace — Context (Switcher)

**Base:** `/api/workspace-context`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| GET | `/current` | — | Get current active workspace for logged-in user |
| GET | `/available` | — | List all workspaces user is an active member of |
| PUT | `/current` | `{ workspaceId*(UUID) }` | Switch current workspace |

---

## 20. Workspace — Onboarding

**Base:** `/api/workspace-onboarding`

New users must complete onboarding before accessing workspace features. Onboarding supports **two paths only** — create a workspace or join via invitation code. Join requests are handled separately (see §18).

### State machine

```
START
  └─► CHOOSE_WORKSPACE_OPTION
        ├─► CREATE_WORKSPACE      → auto-creates Org + Workspace → COMPLETED
        └─► ENTER_INVITATION_CODE → accept invitation            → COMPLETED
```

Legacy states (`WAITING_FOR_APPROVAL`, `REQUEST_TO_JOIN`, `CANCELLED`) from older clients are reset to `CHOOSE_WORKSPACE_OPTION` via `/reset-choice`.

### Endpoints

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| GET | `/status` | — | Get current onboarding state |
| POST | `/start` | — | Initialize onboarding state — returns 201 |
| POST | `/choose-option` | `{ option* }` | Choose a path |
| POST | `/create-workspace` | `{ organizationName*, organizationCode*, workspaceName*, workspaceCode*, workspaceDescription }` | Auto-create org + workspace, complete onboarding |
| POST | `/accept-invitation` | `{ code* }` | Accept invitation code, complete onboarding |
| POST | `/reset-choice` | — | Back to option selection; cancels legacy pending join request if any |

**`option` enum:** `CREATE_WORKSPACE` | `JOIN_WITH_INVITATION`

> `REQUEST_TO_JOIN` is no longer supported during onboarding (returns 422).

### Example: create-workspace payload
```json
{
  "organizationName": "Acme Corporation",
  "organizationCode": "ACME",
  "workspaceName": "Product Team",
  "workspaceCode": "PRODUCT_TEAM"
}
```

---

## 21. Event Registry — Event Definitions

**Base:** `/api/event-definitions`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ code*(max 100), name*(max 255), sourceSystem*(max 100), eventKey*(max 150), description, inputSchema, outputSchema }` | Create event definition — returns 201 |
| GET | `/{id}` | — | Get detail (includes variables) |
| GET | `/` | `?keyword&sourceSystem&eventKey&status&page=0&size=20` | Search |
| PUT | `/{id}` | `{ name*(max 255), description, inputSchema, outputSchema }` | Update |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/deactivate` | — | Deactivate |
| PUT | `/{id}/variables` | `[ { variablePath*, variableLabel, variableType*, required, description, exampleValue } ]` | Upsert variables (replaces all) |
| GET | `/{id}/variables` | — | List variables |

> `eventKey` must be uppercase letters, digits, and underscores only — e.g. `USER_SIGNED_UP`.

---

## 22. Notification — Email Templates

**Base:** `/api/notification/email-templates`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ code*, name*, description, scope*, workspaceId, eventDefinitionId* }` | Create template — returns 201 |
| GET | `/{id}` | — | Get template |
| GET | `/` | `?keyword&scope&status&workspaceId&eventDefinitionId&page=0&size=20` | Search |
| PUT | `/{id}` | `{ name*, description }` | Update |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/deactivate` | — | Deactivate |
| DELETE | `/{id}` | — | Delete |
| POST | `/{id}/versions` | `{ subjectTemplate*, htmlBodyTemplate*, textBodyTemplate }` | Create draft version |
| GET | `/{id}/versions` | — | List versions |
| PATCH | `/{id}/versions/{versionId}/publish` | — | Publish version (makes it active) |

---

## 23. Notification — Email Template Preview

**Base:** `/api/notification/email-templates`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/preview` | `{ versionId*(UUID), samplePayload: { key: value } }` | Render template with sample data — returns `{ subject, htmlBody, textBody }` |

---

## 24. Notification — Email Rules

**Base:** `/api/notification/email-rules`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ code*, name*, description, scope*, workspaceId, eventDefinitionId*, templateId*, recipientStrategy*, recipientConfigJson, priority }` | Create rule — returns 201 |
| GET | `/{id}` | — | Get rule |
| GET | `/` | `?keyword&scope&status&workspaceId&eventDefinitionId&templateId&page=0&size=20` | Search |
| PUT | `/{id}` | `{ name*, description, recipientStrategy*, recipientConfigJson, priority }` | Update |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/deactivate` | — | Deactivate |
| PATCH | `/{id}/enable` | — | Enable (fires on trigger) |
| PATCH | `/{id}/disable` | — | Disable (skipped on trigger) |
| DELETE | `/{id}` | — | Delete |

**`recipientStrategy`:** `FIXED_ADDRESS` | `EVENT_PAYLOAD_FIELD` | `WORKSPACE_USERS_WITH_RIGHT`

---

## 25. Notification — Email Deliveries

**Base:** `/api/notification/email-deliveries`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| GET | `/{id}` | — | Get delivery record |
| GET | `/` | `?ruleId&templateId&eventDefinitionId&workspaceId&status&page=0&size=20` | Search deliveries |

---

## 26. Notification — Email Outbox

**Base:** `/api/notification/email-outbox`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| GET | `/{id}` | — | Get outbox record |
| GET | `/` | `?deliveryId&status&providerType&page=0&size=20` | Search outbox |
| POST | `/{id}/retry` | — | Manually retry a failed record |

---

## 27. AI Agent — Providers

**Base:** `/api/ai-agent/providers`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ name*, code*, type*, apiBaseUrl, description }` | Create provider — returns 201 |
| GET | `/{id}` | — | Get provider detail |
| GET | `/` | `?keyword&type&status&page=0&size=20` | Search |
| PUT | `/{id}` | `{ name*, type*, apiBaseUrl, description }` | Update |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/deactivate` | — | Deactivate |

---

## 28. AI Agent — Provider Secrets

**Base:** `/api/ai-agent/provider-secrets`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ providerId*, secretType*(max 50), secretValue*(max 5000), description }` | Store encrypted API key — deactivates previous active secret |
| GET | `/{id}` | — | Get secret (masked value) |
| GET | `/` | `?providerId&secretType&status&page=0&size=20` | Search |
| PUT | `/{id}/rotate` | `{ secretValue*(max 5000), description }` | Rotate secret |
| PATCH | `/{id}/deactivate` | — | Deactivate |

---

## 29. AI Agent — AI Models

**Base:** `/api/ai-agent/models`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ providerId*, name*, code*, providerModelId*, type*, description }` | Create model — returns 201 |
| GET | `/{id}` | — | Get model detail |
| GET | `/` | `?providerId&keyword&status&type&page=0&size=20` | Search |
| PUT | `/{id}` | `{ name*, providerModelId*, type*, description }` | Update |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/deactivate` | — | Deactivate |

---

## 30. AI Agent — Model Deployments

**Base:** `/api/ai-agent/model-deployments`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ modelId*, name*, code*, environment*, providerDeploymentId*, endpointUrl, defaultTemperature, defaultMaxOutputTokens, isDefault, description }` | Create deployment — returns 201 |
| GET | `/{id}` | — | Get deployment detail |
| GET | `/` | `?modelId&environment&keyword&status&isDefault&page=0&size=20` | Search |
| PUT | `/{id}` | `{ name*, providerDeploymentId*, endpointUrl, defaultTemperature, defaultMaxOutputTokens, isDefault, description }` | Update |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/deactivate` | — | Deactivate |
| PATCH | `/{id}/set-default` | — | Set as default for model + environment |

**`environment`:** `DEV` | `UAT` | `PROD`

---

## 31. AI Agent — Model Parameter Capabilities

**Base:** `/api/ai-agent/model-parameter-capabilities`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ modelId*, parameterName*, apiParameterKey, supportStatus*, valueType*, minValue, maxValue, defaultValue, nullable*, ifNullBehavior, description }` | Create capability — returns 201 |
| GET | `/{id}` | — | Get capability detail |
| GET | `/` | `?modelId&parameterName&supportStatus&valueType&status&page=0&size=20` | Search |
| PUT | `/{id}` | `{ apiParameterKey, supportStatus*, valueType*, minValue, maxValue, defaultValue, nullable*, ifNullBehavior, description }` | Update |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/deactivate` | — | Deactivate |

**`ifNullBehavior`:** `DO_NOT_SEND_PARAMETER` | `USE_PROVIDER_DEFAULT`

---

## 32. AI Agent — Agents

**Base:** `/api/ai-agent/agents`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ name*(max 255), code*(max 100), type*, description, defaultModelDeploymentId, outputFormat }` | Create agent — returns 201 |
| GET | `/{id}` | — | Get agent detail |
| GET | `/` | `?keyword&type&status&outputFormat&page=0&size=20` | Search |
| PUT | `/{id}` | `{ name*(max 255), type*, description, defaultModelDeploymentId, outputFormat }` | Update |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/deactivate` | — | Deactivate |

---

## 33. AI Agent — Prompt Templates

**Base:** `/api/ai-agent/prompt-templates`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ agentId*, name*(max 255), code*(max 100), description }` | Create template — returns 201 |
| GET | `/{id}` | — | Get template detail |
| GET | `/` | `?agentId&keyword&status&page=0&size=20` | Search |
| PUT | `/{id}` | `{ name*(max 255), description }` | Update |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/deactivate` | — | Deactivate |

---

## 34. AI Agent — Prompt Versions

**Base:** `/api/ai-agent/prompt-versions`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ templateId*, title, content*, contentFormat*, variableSchema, changeNote }` | Create draft version — returns 201 |
| GET | `/{id}` | — | Get version detail |
| GET | `/` | `?templateId&status&contentFormat&page=0&size=20` | Search |
| PUT | `/{id}` | `{ title, content*, contentFormat*, variableSchema, changeNote }` | Update (DRAFT only) |
| PATCH | `/{id}/activate` | — | Publish version (archives current active) |
| PATCH | `/{id}/archive` | — | Archive version |

**`contentFormat`:** `PLAIN_TEXT` | `MARKDOWN` | `JINJA2`

---

## 35. AI Agent — Event Configurations

**Base:** `/api/ai-agent/event-configs`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ code*(max 100), name*(max 255), eventDefinitionId*, environment, triggerType*, agentId*, promptVersionId*, modelDeploymentId*, conditionExpression, description }` | Create event config — returns 201 |
| GET | `/{id}` | — | Get config detail |
| GET | `/resolve` | `?eventDefinitionId&sourceSystem&eventKey&environment` | Resolve active config for an event |
| GET | `/` | `?keyword&eventDefinitionId&environment&triggerType&status&agentId&page=0&size=20` | Search |
| PUT | `/{id}` | `{ name*, triggerType*, agentId*, promptVersionId*, modelDeploymentId*, conditionExpression, description }` | Update |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/deactivate` | — | Deactivate |

---

## 36. AI Agent — Usage Policies

**Base:** `/api/ai-agent/usage-policies`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ code*(max 100), name*(max 255), targetType*, targetId, maxRequestsPerPeriod, maxTokensPerPeriod, maxCostPerPeriod, maxConcurrentRequests, dailyBudget, period, action*, priority, description }` | Create policy — returns 201 |
| GET | `/{id}` | — | Get policy detail |
| GET | `/` | `?keyword&targetType&status&page=0&size=20` | Search |
| PUT | `/{id}` | `{ name*, maxRequestsPerPeriod, maxTokensPerPeriod, maxCostPerPeriod, maxConcurrentRequests, dailyBudget, period, action*, priority, description }` | Update |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/deactivate` | — | Deactivate |

---

## 37. AI Agent — Executions (Trigger)

**Base:** `/api/ai-agent/executions`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/event` | `{ requestId*, eventDefinitionId, eventCode, sourceSystem, eventKey, environment, triggerSource, inputVariables: {}, metadata }` | Trigger execution by event |
| POST | `/event-config/{eventConfigId}` | `{ requestId*, triggerSource, inputVariables: {}, metadata }` | Trigger execution by EventConfig ID |

> Provide one of: `eventDefinitionId`, `eventCode`, or `sourceSystem`+`eventKey`.

---

## 38. AI Agent — Execution Logs

**Base:** `/api/ai-agent/execution-logs`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/` | `{ requestId*(max 150), eventConfigId, eventDefinitionId, agentId*, promptVersionId*, modelDeploymentId*, triggerSource*, metadata }` | Create execution log — returns 201 |
| GET | `/{id}` | — | Get log detail |
| GET | `/` | `?requestId&eventConfigId&eventDefinitionId&agentId&promptVersionId&modelDeploymentId&triggerSource&status&createdFrom&createdTo&page=0&size=20` | Search |
| PATCH | `/{id}/running` | — | Mark as running |
| PATCH | `/{id}/succeeded` | `{ inputTokenCount, outputTokenCount, totalTokenCount, estimatedCost, providerRequestId, metadata }` | Mark as succeeded |
| PATCH | `/{id}/failed` | `{ errorCode, errorMessage, inputTokenCount, outputTokenCount, totalTokenCount, estimatedCost, providerRequestId, metadata }` | Mark as failed |
| PATCH | `/{id}/cancel` | — | Cancel execution |

---

## 39. AI Agent — Playground

**Base:** `/api/ai-agent/playground`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/event-config/{eventConfigId}/run` | `{ requestId, inputVariables: {} }` | Run via EventConfig |
| POST | `/direct/run` | `{ requestId, agentId*, promptVersionId*, modelDeploymentId*, inputVariables: {} }` | Run directly without EventConfig |
| POST | `/prompt/preview` | `{ promptVersionId*, inputVariables: {} }` | Preview rendered prompt (no AI call) |
| GET | `/options` | `?includeEventConfigs=true&includeAgents=true&includePromptVersions=true&includeModelDeployments=true` | Get dropdown options |

---

## 40. Knowledge — Document Types

**Base:** `/api/knowledge/document-types`

| Method | Path | Request | Description |
|--------|------|---------|-------------|
| POST | `/system` | `{ code*(2-100), name*(max 255), description }` | Create system-scoped type — returns 201 |
| POST | `/workspace` | `{ code*(2-100), name*(max 255), description, workspaceId }` | Create workspace-scoped type — returns 201 |
| GET | `/{id}` | — | Get document type |
| GET | `/` | `?keyword&workspaceId&documentScope&status&includeDeleted=false&page=0&size=20` | Search |
| PUT | `/{id}` | `{ name*(max 255), description }` | Update |
| PATCH | `/{id}/activate` | — | Activate |
| PATCH | `/{id}/deactivate` | — | Deactivate |
| PATCH | `/{id}/soft-delete` | — | Soft delete |

---

## Appendix A — Common Enums

| Enum | Values |
|------|--------|
| User status | `ACTIVE` \| `INACTIVE` \| `SUSPENDED` |
| IAM permission status | `ACTIVE` \| `INACTIVE` |
| IAM resource scope level | `SYSTEM` \| `ORGANIZATION` \| `WORKSPACE` |
| IAM data access policy | `OWNER_ONLY` \| `ANCESTOR_INHERITED` \| `SCOPE_WIDE` |
| IAM permission category | `SECURITY` \| `RESOURCE_ADMIN` \| `GOVERNANCE` \| `NOTIFICATION_ADMIN` \| `ORGANIZATION_ADMIN` \| `WORKSPACE_ADMIN` \| `ACCESS_CONTROL` \| `TEAM_ADMIN` \| `MEMBER_ADMIN` \| `CONTENT_ADMIN` |
| IAM permission risk level | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |
| IAM permission assignable subject type | `USER` \| `TEAM` \| `ROLE` |
| IAM grant effect | `ALLOW` \| `DENY` |
| IAM subject type | `USER` \| `TEAM` \| `ROLE` |
| IAM action code | `VIEW` \| `CREATE` \| `UPDATE` \| `ARCHIVE` \| `DEACTIVATE` \| `DELETE` \| `EXPORT` \| `INVITE` \| `ASSIGN_ROLE` \| `ADD` \| `REMOVE` \| `MANAGE` \| `CREATE_WORKSPACE` \| `MANAGE_MEMBER` \| `MANAGE_TEAM` \| `MANAGE_ROLE` \| `MANAGE_ACCESS` \| `MANAGE_SETTING` \| `MANAGE_PERMISSION` \| `INVITE_MEMBER` \| `MANAGE_INVITATION` \| `REQUEST_JOIN` \| `MANAGE_JOIN_REQUEST` \| `RETRY` \| `VIEW_USER` \| `CREATE_USER` \| `VIEW_ROLE` \| `VIEW_RIGHT` \| `VIEW_ACCESS_GRANT` \| `MANAGE_ACCESS_GRANT` \| `MANAGE_DOCUMENT_TYPE` \| `VIEW_NOTIFICATION` \| `MANAGE_NOTIFICATION` \| `MANAGE_TEMPLATE` \| `MANAGE_RULE` \| `VIEW_DELIVERY` \| `RETRY_DELIVERY` |
| Workspace visibility | `PRIVATE` \| `PUBLIC` |
| Workspace join policy | `INVITE_ONLY` \| `REQUEST_TO_JOIN` \| `INVITE_OR_REQUEST` \| `DISABLED` |
| Organization status | `ACTIVE` \| `ARCHIVED` |
| Workspace status | `ACTIVE` \| `ARCHIVED` |
| Onboarding option | `CREATE_WORKSPACE` \| `JOIN_WITH_INVITATION` |
| Onboarding status | `IN_PROGRESS` \| `WAITING_FOR_APPROVAL` \| `COMPLETED` \| `CANCELLED` \| `FAILED` |
| Invitation status | `PENDING` \| `ACCEPTED` \| `EXPIRED` \| `REVOKED` |
| Join request status | `PENDING` \| `APPROVED` \| `REJECTED` \| `CANCELLED` |
| AI Agent environment | `DEV` \| `UAT` \| `PROD` |
| Prompt content format | `PLAIN_TEXT` \| `MARKDOWN` \| `JINJA2` |
| Email scope | `SYSTEM` \| `WORKSPACE` |
| Email recipient strategy | `FIXED_ADDRESS` \| `EVENT_PAYLOAD_FIELD` \| `WORKSPACE_USERS_WITH_RIGHT` |

---

## Appendix B — Seeded Admin Account

After first `docker compose up`, an admin account is seeded automatically (configured via `.env`):

```
Username : admin
Password : Admin@123456
Role     : SUPER_ADMIN
```

Login:
```bash
curl -c cookies.txt -X POST http://localhost:8080/api/iam/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123456"}'
```

---

## Appendix C — Quick Start (Next.js / Axios)

```ts
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,           // send cookies
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      await api.post('/api/iam/auth/refresh');
      return api(err.config);
    }
    return Promise.reject(err);
  }
);

export default api;
```

```ts
// Usage
await api.post('/api/iam/auth/login', { username: 'admin', password: 'Admin@123456' });
const me = await api.get('/api/workspace-context/current');
```
