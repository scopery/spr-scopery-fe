# Notification / Work Inbox policy (V1)

V1 splits awareness from actionable work for **Org & Workspace** events.

| Channel | Purpose | UI |
| --- | --- | --- |
| **Notification** | Awareness only (FYI) | Title + body + **Dismiss** — no Accept / Open / Approve |
| **Work Inbox** | Requires a decision | Accept / Approve / Reject (and later Open) |

Recipient rule: every create path resolves an explicit `Set<userId>` first, then fans out **one row per user**. Never broadcast “whole workspace” without a named audience strategy.

## Policy matrix (V1)

| Event | Work Inbox | Notification (no action) | Audience |
| --- | --- | --- | --- |
| Org / Workspace invite created | Accept | Omit (Work Inbox only for invitee) | Invitee only |
| Invite accepted | — | FYI | Inviter |
| Join request created | Review (Approve / Reject) | — | Users with `WORKSPACE_MANAGE_JOIN_REQUEST` on that workspace |
| Join approved / rejected | — | FYI | Requester only |
| Org / WS member kicked (removed / deactivated) | — | FYI | Affected user |
| Org member added / WS member activated or added | — | FYI | That user |

## Implementation notes

- BE: `WorkspaceAudienceResolver` + `InAppDeliveryService`
  - Work Inbox: `deliverWorkInbox(..., actionType, ...)`
  - FYI: `deliverNotificationFyi` always sets `actionType=null`, `actionUrl=null`
- Dedup keys stay per-user: `{SOURCE}:{id}:{userId}`
- Invite accept / cancel / revoke still dismiss related inbox rows via `InvitationInboxCleanupService`
- Join approve / reject / cancel dismisses all Work Inbox rows for that `JOIN_REQUEST` source id
- Work Inbox list is **personal** (by `userId` across workspaces); route workspace only gates `WORK_INBOX_VIEW`
- FE Notification UI: Dismiss only (no Accept / Open)

## Out of scope (V1)

- Task assign / due / overdue Work Inbox
- Change-request / quote / finance Work Inbox
- Replacing project `EmailRecipientStrategy` email pipelines
