# Wave 4 — Contract Exceptions (`CONTRACT_BLOCKED`)

> Maps Critical/High gaps from Spec V2 §21 to exception IDs.
> FE may ship UI that gates or degrades gracefully until BE closes the gap.

| Exception ID | Severity | Gap | FE handling | Unblock when |
|---|---|---|---|---|
| `W4-EX-DOC-SCOPED` | Critical | Org/workspace/personal document APIs | Scope switcher → project-only; other scopes disabled/toast | Scoped document endpoints live |
| `W4-EX-DOC-UPDATE-ARCHIVE` | Critical | Document update/archive/move missing | No bulk maintain actions in workbench | PATCH update/archive/move |
| `W4-EX-AI-CITATIONS` | Critical | AI citations/sources absent | Stream shows text only; citation panel hidden | Citation SSE events + DTO |
| `W4-EX-AI-TYPED-APPLY` | Critical | AI suggestion payload untyped | Planning apply uses best-effort preview fields | Typed action/diff contract |
| `W4-EX-PORTAL-REVIEW-DECIDE` | Critical | Portal review decision missing | **Closed on FE** via `/reviews/{id}/decide` — confirm BE | BE ships decide endpoint |
| `W4-EX-PORTAL-UAT` | Critical | Portal UAT execution missing | UAT routes not exposed / blocked; `clientPortal` enabled for login + project views only | Assignment/result/evidence APIs |
| `W4-EX-PORTAL-SUPPORT-DETAIL` | Critical | Portal support detail/comments | List-only portal support | Detail + comment + timeline |
| `W4-EX-GOV-SNAPSHOT-TYPED` | Critical | Governance snapshots dynamic JSON | Versions list only; no typed restore UX | Typed snapshot schemas |
| `W4-EX-QUALITY-MAP-DTOS` | Critical | Quality reports dynamic Map | Prefer list/center UIs over raw Map dashboards | Typed report DTOs |
| `W4-EX-PRIVACY-PACKAGE` | Critical | Privacy export detail/download | Anonymize dry-run/execute gated; package download TBD | Secure package endpoints |
| `W4-EX-LEGAL-HOLD-POLICY` | Critical | Anonymization vs legal hold unclear | FE blocks execute when active holds present | Policy validation engine |
| `W4-EX-WEBHOOK-SECURITY` | Critical | Inbound webhook security unspecified | Execute gated; no raw webhook config UI for secrets | Signature/replay/rate-limit |
| `W4-EX-GEN-DOC-WORKER` | Medium | Generated doc process/complete worker-ish | API wired; no primary user CTA | User-facing start/status only |

## Notes

- `CONTRACT_BLOCKED` is **not** Wave Complete for mandatory scope (Spec §24).
- Prefer keeping blocked surfaces behind feature flags or disabled actions with reason text.
- When BE ships a gap, flip register row → `UI_IMPLEMENTED` / `UI_TESTED` and retire the exception ID.
