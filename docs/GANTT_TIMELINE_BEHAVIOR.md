# Timeline / Gantt — Hierarchy & Interaction Behavior

> **Mục đích:** Chốt cách Timeline hoạt động theo hierarchy **trước khi code thêm** (drag, edit, recalculate).
>
> **Nguồn BE:** `GanttQueryService.buildItems()` · `GET /api/projects/{projectId}/gantt`
>
> **Nguồn FE:** `modules/projects/gantt/` · view `ProjectGanttView` · mapper `mapToSvarGantt.ts`

---

## 1. Timeline có theo hierarchy không?

**Có.** Timeline không phải flat list task — BE trả **danh sách phẳng** (`items[]`), mỗi item có `parentItemId`. FE build cây bằng `buildGanttTree()`.

Cấu trúc mặc định (`groupBy=PHASE`):

```text
PROJECT (root)
├── PHASE (optional grouping — theo project phases)
│   ├── WBS_NODE (có thể lồng WBS con)
│   │   │   parent: WBS cha hoặc PHASE hoặc PROJECT
│   │   └── TASK (leaf — entity schedule thật)
│   └── TASK (không gắn WBS → parent = PHASE)
├── WBS_NODE (không thuộc phase cụ thể → parent = PROJECT)
└── MILESTONE (điểm mốc — parent = WBS / PHASE / PROJECT)
```

**Quy tắc parent của TASK** (BE):

| Task có | Parent item |
|---------|-------------|
| `wbsNodeId` | `WBS:{wbsNodeId}` |
| Không WBS, có `projectPhaseId` | `PHASE:{phaseId}` |
| Không cả hai | `PROJECT:{projectId}` |

**Quy tắc parent của WBS** (BE):

| WBS có | Parent item |
|--------|-------------|
| `parentId` (WBS cha) | `WBS:{parentId}` |
| Không WBS cha, có `projectPhaseId` | `PHASE:{phaseId}` |
| Không cả hai | `PROJECT:{projectId}` |

---

## 2. Các loại item (`itemType`)

| `itemType` | `sourceEntityType` | Vai trò trên Timeline | Có lịch riêng? |
|------------|-------------------|------------------------|----------------|
| `PROJECT` | `PROJECT` | Bar tổng project | Rollup (min/max từ schedule + milestones + planned dates) |
| `PHASE` | `PROJECT_PHASE` | Nhóm theo phase | Rollup từ task trong phase |
| `WBS_NODE` | `WBS_NODE` | Cây WBS | Rollup từ task trong subtree WBS |
| `TASK` | `TASK` | Công việc thực thi | **Có** — `TaskSchedule.estimatedStartDate` / `estimatedFinishDate` |
| `MILESTONE` | `PROJECT_MILESTONE` | Điểm mốc (zero duration) | **Có** — `milestoneDate` |

**Chỉ `TASK` mới là entity được scheduler gán ngày làm việc.** Phase / WBS / Project **không có** `TaskSchedule` — bar của chúng chỉ là **tổng hợp (rollup)** từ con.

---

## 3. Cách tính `startDate` / `endDate` từng cấp

### PROJECT

- Bắt đầu từ `project.plannedStartDate` / `plannedEndDate`
- Mở rộng: min/max của mọi `TaskSchedule` + milestone dates

### PHASE (`groupBy=PHASE`)

- Bắt đầu từ `phase.plannedStartDate` / `plannedEndDate`
- Với mỗi task thuộc phase: lấy schedule nếu có, không thì `plannedStartDate` / `dueDate` của task
- Rollup min(start), max(end)

### WBS_NODE

- Chỉ rollup từ **task trong subtree WBS** (bao gồm WBS con)
- **Không** dùng `plannedStartDate`/`dueDate` của task khi chưa có schedule
- Nếu subtree không có task đã schedule → `startDate`/`endDate` = `null`

### TASK

- Có schedule: `estimatedStartDate` / `estimatedFinishDate`
- Không schedule: `scheduleStatus = UNSCHEDULED`, dates = `null`
- FE (SVAR) có thể gán **placeholder dates** để hiển thị bar — không đồng nghĩa đã schedule trên BE

### MILESTONE

- `startDate = endDate = milestoneDate`

---

## 4. `scheduleStatus` (chỉ TASK)

| Status | Ý nghĩa |
|--------|---------|
| `SCHEDULED` | Có `TaskSchedule`, đủ start/finish |
| `PARTIAL` | `PARTIALLY_SCHEDULED` |
| `BLOCKED` | Bị chặn bởi dependency / constraint |
| `UNSCHEDULED` | Chưa có schedule |
| `NOT_APPLICABLE` | Phase / WBS / Project / Milestone |

---

## 5. API BE liên quan schedule (theo cấp)

| Hành động | API | Áp dụng cho |
|-----------|-----|-------------|
| Xem timeline | `GET .../gantt` | Toàn bộ hierarchy |
| Recalculate cả plan | `POST .../gantt/recalculate` | Project — chạy `ScheduleRun`, CPM |
| Kéo / đổi range task | `POST .../gantt/tasks/{taskId}/move` | **TASK only** — tạo `TaskScheduleOverride` |
| Resize finish task | `POST .../gantt/tasks/{taskId}/resize` | **TASK only** |
| Xóa override | `POST .../gantt/tasks/{taskId}/clear-override` | **TASK only** |
| Dependencies | `GET/POST/DELETE .../gantt/dependencies` | Giữa **TASK** ↔ **TASK** |

**Không có API** `move phase`, `move wbs`, `move project bar` trên Gantt. Đổi phase/WBS date → sửa entity gốc (phase planned dates, milestone record, v.v.) hoặc đổi task con.

### Persist sau drag / edit

| API | Lưu gì | `GET gantt` đọc gì |
|-----|--------|-------------------|
| `POST .../tasks/{id}/move` | `TaskScheduleOverride` (PIN_RANGE) | **Effective dates** = schedule + override merge |
| `POST .../tasks/{id}/resize` | Override (PIN_FINISH / PIN_RANGE) | Cùng logic merge |
| `POST .../recalculate` | Schedule run mới | `TaskSchedule` từ run (override vẫn được engine respect) |

> **Fix 2026-07-20:** BE `GanttQueryService` trước đó chỉ đọc `TaskSchedule` → drag lưu override nhưng reload trả ngày cũ. Đã thêm `GanttTaskDateResolver` merge override vào projection.

- `recalculate: true` → sau override, BE chạy **full schedule run** → có thể **dịch chuyển nhiều task khác** (dependencies, CPM) → cảm giác “kéo 1 cái mà cả plan nhảy”.
- `recalculate: false` → chỉ pin task đó (override), **không** reschedule toàn project.

**Đề xuất UX:** drag task mặc định `recalculate: false`; nút **Recalculate** để user chủ động chạy lại plan.

---

## 6. Hành vi UI đề xuất (product spec — chốt trước code)

### 6.1 Nguyên tắc

1. **Một nguồn sự thật cho lịch:** chỉ `TASK` (+ milestone riêng) có ngày “thật”.
2. **Rollup chỉ đọc:** Phase / WBS / Project bar = phản ánh con, **không kéo trực tiếp** trên chart.
3. **Recalculate là hành động project-level**, không gắn mỗi lần kéo task.

### 6.2 Bảng hành vi theo loại row

| Loại row | Bar trên chart | Kéo bar (chart) | Resize bar | Click / edit | Sau khi task con đổi |
|----------|----------------|-----------------|------------|--------------|----------------------|
| **TASK** (scheduled) | Xanh dương (task) | ✅ Move → `move` API | ✅ Resize end → `resize` API | Mở task / edit dates | — |
| **TASK** (unscheduled) | Placeholder + label | ✅ Move = **schedule lần đầu** (move API) | ✅ | Set dates modal | — |
| **WBS_NODE** | Xám (summary) | ❌ Read-only | ❌ | Expand/collapse; link WBS page | Bar tự rollup |
| **PHASE** | Xám (summary) | ❌ Read-only | ❌ | Link phase settings | Bar tự rollup |
| **PROJECT** | Xám (summary) | ❌ Read-only | ❌ | — | Bar tự rollup |
| **MILESTONE** | Kim cương | ❌ Trên Gantt | ❌ | Edit **Milestone** (không qua Gantt drag) | — |

### 6.3 Vì sao kéo bar Phase/WBS “move cả plan”?

Thư viện SVAR Gantt: bar `type: summary` khi kéo ngang sẽ **`moveSummaryKids`** — dịch **toàn bộ task con** theo. Đó là behavior mặc định của Gantt chart, **không phải** API Scopery.

Nếu thêm `recalculate: true` sau drag → BE còn reschedule thêm task khác theo dependency.

**Kết luận:** Phase/WBS **phải block drag** trên chart; chỉ task leaf được kéo.

### 6.4 Luồng user đề xuất

```text
Muốn đổi lịch 1 việc:
  → Kéo bar TASK (hoặc edit dates trong task drawer)
  → Optional: bấm Recalculate nếu muốn engine tính lại dependent tasks

Muốn đổi khung phase:
  → Sửa Phase planned dates (Project Control / Phase settings)
  → Hoặc đổi task trong phase → phase bar rollup lại

Muốn đổi phạm vi WBS:
  → Đổi task gắn WBS đó / thêm task vào WBS
  → WBS bar rollup lại

Muốn dời milestone:
  → Milestone workspace (không drag trên timeline)
```

---

## 7. Hiện trạng FE (đang implement)

| Thành phần | Trạng thái |
|------------|------------|
| Data | `useProjectGantt` → `GET gantt?includeUnscheduled=true` |
| Tree | `buildGanttTree(items)` |
| Chart | `@svar-ui/react-gantt` (`ProjectGanttView`) |
| Mapper | `mapGanttTreeToSvarTasks` — `TASK` → `type: task`, còn lại → `summary` / `milestone` |
| Drag task only | `intercept('drag-task')` + `isGanttChartDraggable()` — block phase/WBS/project |
| Persist task | `onUpdateTask` → `move` / `resize` với `recalculate: false` |
| Edit dates | Double-click task bar → `GanttTaskScheduleModal` |
| Rollup hint | Toast khi kéo phase/WBS; legend trên page |
| Recalculate | Nút manual — reschedule toàn project |
| Legacy custom UI | `GanttBarRow.tsx` — **không** dùng bởi view chính |

---

## 8. Quyết định cần chốt (checklist)

Trước khi code tiếp, product/BE/FE align các điểm sau:

- [ ] **A.** Chỉ TASK draggable trên chart — Phase/WBS/Project read-only rollup? → **Đề xuất: Yes**
- [ ] **B.** Drag task có auto-recalculate không? → **Đề xuất: No (default)**; Recalculate manual
- [ ] **C.** Unscheduled task: kéo bar = tạo override / schedule lần đầu? → **Đề xuất: Yes** (move API)
- [ ] **D.** Milestone: edit ở đâu? → **Đề xuất: Milestone module**, không drag Gantt
- [ ] **E.** Resize task có đổi `estimateHours` không? → **BE: No** (chỉ `manualFinishDate`)
- [ ] **F.** Hiển thị placeholder cho unscheduled vs ẩn hẳn? → Toggle “Show unscheduled”
- [ ] **G.** Phase không có `groupBy=PHASE` thì cây thế nào? → Hiện default BE = `PHASE`

---

## 9. Mapping FE ↔ SVAR (tham khảo implement)

| `itemType` (BE) | SVAR `type` | `scopery` drag policy |
|-----------------|-------------|------------------------|
| `PROJECT` | `summary` | `rollup` — no drag |
| `PHASE` | `summary` | `rollup` — no drag |
| `WBS_NODE` | `summary` | `rollup` — no drag |
| `TASK` | `task` | `editable` — drag + resize |
| `MILESTONE` | `milestone` | `read-only` on chart |

Helper FE (đã có / dự kiến): `isGanttChartDraggable()`, `ganttDragHintForItemType()`.

---

## 10. Roadmap implement (sau khi doc được approve)

1. **P0 — Đúng behavior task-only drag** (block summary, `recalculate: false`, refetch sau save)
2. **P1 — Edit dates** — click task row → modal / task drawer (start, finish, duration text)
3. **P1 — Visual** — màu + cursor phân biệt task vs rollup; hint text trên page
4. **P2 — Milestone** — click → navigate milestone detail
5. **P2 — Phase/WBS** — click tên → link phase / WBS page (read-only trên chart)
6. **P3 — Optional** — “Recalculate after drag” checkbox cho power users

---

## 11. Liên quan tài liệu khác

| Doc | Nội dung |
|-----|----------|
| BE `PHASE_14_WBS_GANTT_TO_BE_DETAILED.md` | `TaskScheduleOverride`, move/resize, permission `GANTT_MOVE_TASK` |
| FE `modules/projects/gantt/domain/model/gantt.ts` | Contract `GanttItem` |
| FE `mapToSvarGantt.ts` | SVAR mapping + date inclusive/exclusive |

---

*Cập nhật: 2026-07-20 — draft cho review trước khi tiếp tục code Timeline interaction.*
