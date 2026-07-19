# Wave 4 — Phần còn thiếu (chia phase nhỏ)

> Scaffold P0–P9 đã có (routes, modules, nav, flags) — hầu hết chỉ **`UI_IMPLEMENTED`**.  
> Mục tiêu các phase dưới: đưa từng slice lên **`UI_TESTED`** theo DoD §24 + Coverage Register §0A.  
> Tracker tổng: [WAVE4_COVERAGE_TRACKER.md](./WAVE4_COVERAGE_TRACKER.md)

## Quy tắc mỗi phase

1. Endpoints của slice → domain / API / hook / View đầy đủ  
2. Loading / empty / error / forbidden  
3. Tests: happy path + 403 (+ SSE/upload nếu áp dụng)  
4. Cập nhật Coverage Tracker  
5. Không nhảy phase sau khi chưa đóng gate (trừ `CONTRACT_BLOCKED` có exception ID)

Mỗi **PR = 1 page ID hoặc 1 controller group** — không gom cả một phase lớn vào một PR.

---

## Roadmap

| Phase | Scope | Ước lượng | Gate |
|---|---|---|---|
| **W4-A** | Shared polish (Storybook/Vitest, SSE/presign, actor header) | 3–5 ngày | Molecules có test tối thiểu |
| **W4-B** | Productivity deep-dive (Search palette, ⌘K, Inbox, Saved) | ~1 tuần | PRD-01…04 → `UI_TESTED` |
| **W4-C** | Document Hub DOC-01…04 | 1.5–2 tuần | DocumentHub endpoints `UI_TESTED` hoặc `CONTRACT_BLOCKED` + ID |
| **W4-D** | Knowledge + AI Assistant SSE | 1–1.5 tuần | KNW + AI-01 `UI_TESTED` / blocked có ID |
| **W4-E** | Governance + Reporting | ~1 tuần | Không raw Map; GOV/RPT `UI_TESTED` |
| **W4-F** | Requirements + Quality chain | ~2 tuần | Req → Case → Result → Defect → Release demo được |
| **W4-G** | AI Planning + Recommendations | ~1 tuần | CR/baseline guard trước apply |
| **W4-H** | Client Collaboration + Portal | 1.5–2 tuần | Portal-safe DTOs; session tách |
| **W4-I** | Integration Hub | 1–1.5 tuần | Validate → dry-run → execute |
| **W4-J** | Trust + Service Support | 1.5–2 tuần | Legal-hold check; resolve không optimistic |

**Thứ tự bắt buộc:** W4-A → W4-B → W4-C → … → W4-J  
**Bắt đầu ngay:** W4-A → W4-B → W4-C (ưu tiên Document Hub).

---

## Chi tiết từng phase

### W4-A — Shared polish

- Storybook + Vitest: `LongRunningJobPanel`, `EntityReferencePicker`, `ClassificationBadge`, `MaskedValue`, `PermissionAwareAction`
- SSE reconnect/cancel tests; Presigned expiry/retry tests
- Knowledge header: gắn `actorId` từ auth (không chỉ `workspaceId`)

### W4-B — Productivity

- Nối `GlobalSearchPalette` → `useGlobalSearch` (data thật)
- Command Palette (⌘K): search + navigation actions
- Work Inbox: mark-read optimistic (§20), empty/forbidden
- Favorites / Recent / Saved Views CRUD tối thiểu

### W4-C — Document Hub (ưu tiên cao)

Mở rộng `modules/documents/document-hub` — **không** viết hub thứ hai:

- DOC-01: list + scope switcher
- DOC-02: viewer + versions + governance chips
- DOC-03: presigned upload đầy đủ (đã có `document-versions.api.ts`)
- DOC-04: generated jobs + `LongRunningJobPanel`
- Scoped org/workspace/personal API thiếu → flag + `CONTRACT_BLOCKED`

### W4-D — Knowledge + AI Assistant

- KNW-01/02 Type Library + Builder  
- KNW-03 Indexing + job polling  
- KNW-04 Graph (related-only nếu contract thiếu)  
- AI-01 conversation + SSE + cancel; citations → `CONTRACT_BLOCKED` nếu BE chưa có  

### W4-E — Governance + Reporting

- GOV-01/02 Center + Inspector trên object thật  
- GOV-03/04 policies + reports  
- RPT-01…04 typed dashboard, runner poll, export jobs — **không** dùng raw `Map` làm primary UX  

### W4-F — Requirements + Quality

- TRC + Applications  
- Quality → Test → Run → Defect → Release → Deployment  
- Lifecycle actions: **không** optimistic  

### W4-G — AI Planning + Recommendations

- Suggestion states: suggested / accepted / applied  
- Apply preview + baseline/CR guard  

### W4-H — Portal

- Internal CLI + `app/portal/**`  
- `portalApiClient` session tách; bật `wave4Portal` khi auth ổn  
- UAT/support detail thiếu BE → `CONTRACT_BLOCKED`  

### W4-I — Integrations

- Connections, import/export, sync, conflicts, webhooks  
- Mọi mutation nguy hiểm: confirm + dry-run trước execute  

### W4-J — Trust + Support

- Privacy / retention / legal hold / access review  
- Cases, SLA, incidents; portal support link  
- Không anonymize/retain khi chưa check legal hold  

---

## Không làm trong các phase này

- Big-bang rewrite Document Hub sang Architecture v2  
- Đánh dấu Wave DONE khi còn endpoint user-facing chưa `UI_TESTED`  
- Mock production như đã complete  

---

## Next action

Khi sẵn sàng implement: bắt đầu **W4-A**, rồi **W4-B**, rồi **W4-C**.
