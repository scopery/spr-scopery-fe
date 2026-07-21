# FE ↔ BE Contract Mismatch Tracker

> Generated: 2026-07-20  
> Scope: compare FE (`spr-scopery-fe`) vs BE (`spr-scopery-be`) **as implemented in code** — not WAVE docs.  
> Trigger: create resource failed with `RESOURCE_PROFILE_INVALID_TYPE` (`MEMBER` vs BE `INTERNAL_USER`).

## How to use

| Severity | Meaning |
|----------|---------|
| **break** | FE sends value / shape BE rejects or cannot parse → 400 / empty UI |
| **warn** | Display, filter, or optional field wrong; create may still work |
| **doc-only** | Docs/UI comment outdated; runtime may be fine |
| **fixed** | Already corrected on FE in this pass |

Status column for team tracking: `open` | `in-progress` | `done` | `wontfix`.

---

## Summary

| Area | break | warn | doc-only | fixed |
|------|------:|-----:|---------:|------:|
| Capacity / resource | 0 | 0 | 1 (CAP-F17) | all break/warn IDs |
| Quotes / finance / estimation | 0 | 0 | 0 | 12 |
| Project modules (task, WBS, scope, …) | 0 | 0 | 0 | 14 |
| AI agent admin / notifications / IAM | 0 | 0 | 0 | 10 |
| **Rough total** | **0** | **0** | **1** | **~87** |

**Status (2026-07-20):** All open **break** + **warn** tracker IDs fixed on FE to match BE. CAP-F17 left as doc-only (no BE archive controllers).

---

## A. Capacity / Resource (highest priority)

### A1. Enums

| ID | Status | Severity | FE | BE | Notes |
|----|--------|----------|----|----|-------|
| CAP-E01 | **done** | fixed | Was `MEMBER` / `EXTERNAL` / `PLACEHOLDER` | `INTERNAL_USER`, `TEAM`, `EXTERNAL_CONTRACTOR`, `VENDOR_STAFF`, `PLACEHOLDER_ROLE`, `SYSTEM_RESOURCE` | Fixed in `modules/capacity/domain/enums/capacity.enum.ts` + Create UI |
| CAP-E02 | **done** | fixed | `AllocationType`: `PLANNED`, `RESERVED`, `CONFIRMED` | same | |
| CAP-E03 | **done** | fixed | `CalendarExceptionType` full BE set | same | |
| CAP-E04 | **done** | fixed | Utilization: `UNDER_ALLOCATED`, `CRITICAL_OVERLOAD`, `UNAVAILABLE` | same | |
| CAP-E05 | **done** | fixed | `ResourceProfileStatus` includes `INACTIVE` | same | |
| CAP-E06 | **done** | fixed | `UserCapacityProfileStatus` + `ON_LEAVE`, `UNAVAILABLE` | same | |
| CAP-E07 | **done** | fixed | Actual effort status `RECORDED`, `UPDATED`, `CANCELLED` | same | |
| CAP-E08 | **done** | fixed | Task assignment types BE set | same | |
| CAP-E09 | **done** | fixed | Effort `estimateType` BE set | same | |
| CAP-E10 | **done** | fixed | Actual effort `inputMode` BE set | same | |

### A2. Request / response shapes

| ID | Status | Severity | Topic | FE | BE | Notes |
|----|--------|----------|-------|----|----|-------|
| CAP-F01 | **done** | fixed | Create task assignment | `resourceProfileId`, `assignmentType`, `plannedEffortHours?` | same | |
| CAP-F02 | **done** | fixed | Task assignment response | BE shape | same | |
| CAP-F03 | **done** | fixed | Create effort estimate | `targetType`, `targetId`, `estimateType`, `effortHours` | same | |
| CAP-F04 | **done** | fixed | Create actual effort | + `inputMode`, `targetType`, `targetId` | same | |
| CAP-F05 | **done** | fixed | Create resource role | `roleCode` + `name` | same | |
| CAP-F06 | **done** | fixed | Create resource skill | `skillCode` + `name` | same | |
| CAP-F07 | **done** | fixed | UserCapacityProfile field | `capacityStatus` | same | |
| CAP-F08 | **done** | fixed | Update user capacity profile | required fields always sent | same | |
| CAP-F09 | **done** | fixed | Calculate capacity | `userId` required | `userId` `@NotNull` | Phase 2 overview/plan alignment |
| CAP-F10 | **done** | fixed | Daily capacity entry | `projectAllocatedHours` + `isWorkingDay` | same | Phase 2 |
| CAP-F11 | **done** | fixed | Workspace overview | `users`, `totalFocusedHours`, `overAllocatedUserCount` | same | Phase 2 |
| CAP-F12 | **done** | fixed | Over-allocations list | `OverAllocationResponse.overAllocatedUsers` | same | Phase 2 |
| CAP-F13 | **done** | fixed | Project allocation summary | required `fromDate`+`toDate`; `totalAllocationPercent`, `allocations`, `distinctUserCount` | same | Phase 2 |
| CAP-F14 | **done** | fixed | Workload snapshot | capacity/forecast/gap fields; POST no body | same | Phase 2 |
| CAP-F15 | **done** | fixed | ResourceProfile response | `linkedWorkspaceMemberId` optional on FE | omitted from BE response | |
| CAP-F16 | **done** | fixed | Sync-from-members | array → `createdCount=length` | `List<ResourceProfileResponse>` | Mapper handles array |
| CAP-F17 | open | doc-only | Role/skill archive | UI says BE thiếu | Paths exist, no controller mapped | |

### A3. Evidence (capacity)

- FE enums: `modules/capacity/domain/enums/capacity.enum.ts`
- FE APIs: `modules/capacity/infrastructure/api/`
- BE enums: `spr-scopery-be/.../resourcecapacity/**/domain/enums/`
- Example reject: `CreateResourceProfileAction` + `ResourceType.java`

---

## B. Quotes / Finance / Estimation

| ID | Status | Severity | Module | FE | BE |
|----|--------|----------|--------|----|----|
| QOT-E01 | **done** | fixed | QuotePricingMethod | `FROM_FINANCE_PLANNED_REVENUE`, `TARGET_MARGIN_SOLVER`, `MANUAL_TOTAL`, `PHASE_LINE_SUM` | same |
| QOT-E02 | **done** | fixed | QuoteCostBaseMethod | `BUDGET_OF_COSTS`, `DIRECT_COST`, `CUSTOM` | same |
| QOT-E03 | **done** | fixed | QuoteDiscountMethod | `NONE`, `FIXED_AMOUNT`, `PERCENT_OF_SUBTOTAL` | same |
| QOT-E04 | **done** | fixed | QuoteGenerateLinesFrom | `PHASE_FINANCE`, `SUMMARY`, `NONE` | same |
| QOT-E05 | **done** | fixed | QuoteLineType | `PHASE`, `SERVICE`, `DELIVERABLE`, `CUSTOM`, `OPTIONAL` | same |
| QOT-E06 | **done** | fixed | QuoteTermType | `PAYMENT_TERM`, `VALIDITY`, `ASSUMPTION`, … | same |
| QOT-E07 | **done** | fixed | QuoteStatus vs QuoteVersionStatus | Quote: `DRAFT/ACTIVE/ARCHIVED`; version: rich set | same |
| FIN-E01 | **done** | fixed | RevenueSplitMethod | `MANUAL_AMOUNT`, `MANUAL_PERCENT`, `COST_PROPORTION` | same |
| FIN-E02 | **done** | fixed | Contingency / overhead method | Separate `ContingencyMethod` + `OverheadMethod` | same |
| EST-E01 | **done** | fixed | EstimationCalculationMode | `TASK_ESTIMATE_ONLY`, `TASK_ESTIMATE_WITH_RATE`, `SCHEDULED_WORK_WITH_RATE` | same |
| EST-E02 | **done** | fixed | RateTargetDateStrategy | `PROJECT_PLANNED_START`, `TASK_SCHEDULED_START`, … | same |
| EST-E03 | **done** | fixed | TaskSnapshotStatus | `CALCULATED`, `RATE_UNRESOLVED`, `ROLE_UNRESOLVED`, … | same |

---

## C. Project modules

| ID | Status | Severity | What | FE | BE |
|----|--------|----------|------|----|----|
| PC-E01 | **done** | fixed | ChangeType | `SCOPE_CHANGE`, `REVENUE_CHANGE`, … | `SCOPE_CHANGE`, `REVENUE_CHANGE`, … |
| PC-E02 | **done** | fixed | ChangeItemOperation | `CREATE`, `UPDATE`, `DELETE`, … | `CREATE`, `UPDATE`, `DELETE`, … |
| PC-E03 | **done** | fixed | BaselineStatus | `READY` | `READY` |
| TSK-E01 | **done** | fixed | TaskStatus complete | FE `DONE` | BE `DONE` |
| DEP-E01 | **done** | fixed | DependencyType | `FINISH_TO_START`, … | `FINISH_TO_START`, … |
| WBS-E01 | **done** | fixed | WbsNodeType | `WORK_PACKAGE`, `DELIVERABLE`, `TASK_GROUP` | `WORK_PACKAGE`, `DELIVERABLE`, `TASK_GROUP` |
| MS-E01 | **done** | fixed | MilestoneStatus | `PLANNED` | `PLANNED` |
| PH-E01 | **done** | fixed | ProjectPhaseStatus | `PLANNED` | `PLANNED` |
| DEL-E01 | **done** | fixed | DeliverableType | full BE catalog | long BE catalog |
| EV-E01 | **done** | fixed | EvidenceType | `TEXT`, `LINK`, `REFERENCE`, `NOTE` | `TEXT`, `LINK`, `REFERENCE`, `NOTE` |
| SCP-E01 | **done** | fixed | ScopeItemType | `FEATURE`, `WORKSTREAM`, … | `FEATURE`, `WORKSTREAM`, … |
| REV-E01 | **done** | fixed | ReviewStatus | `OPEN` | `OPEN` |
| DEC-E01 | **done** | fixed | DecisionStatus / Category | `PROPOSED`, richer categories | `PROPOSED`, richer categories |
| MTG-E01 | **done** | fixed | Meeting action / attendance | `DONE`, BE attendance set | `DONE`, no `ABSENT` |

---

## D. AI admin / notifications / IAM

| ID | Status | Severity | What | FE | BE |
|----|--------|----------|------|----|----|
| AI-E01 | **done** | fixed | AgentScope | `SYSTEM`, `ORGANIZATION`, `WORKSPACE` | same |
| AI-E02 | **done** | fixed | AgentAutonomyLevel | `SUGGEST_ONLY`, `DRAFT_ONLY`, `REQUIRES_APPROVAL`, `AUTO_EXECUTE_READ_ONLY`, `AUTO_EXECUTE_RESTRICTED` | same |
| AI-E03 | **done** | fixed | ProviderSecretType | `API_KEY` only | same |
| AI-E04 | **done** | fixed | ProviderType | `LLM`, `OCR`, `EMBEDDING` | same |
| AI-E05 | **done** | fixed | ToolMutationType | `READ`, `MUTATION` | same |
| AI-E06 | **done** | fixed | UsagePolicyAction | `BLOCK`, `WARN` | same |
| NAD-E01 | **done** | fixed | EmailRecipientStrategy | matches BE `EmailRecipientStrategy.java` | same |
| IAM-E01 | **done** | fixed | IamResourceType | `ORGANIZATION`, `WORKSPACE`, `TEAM`, `GLOBAL` | same |
| NTF-E01 | **done** | fixed | NotificationSeverity | `INFO`, `SUCCESS`, `WARNING`, `ERROR`, `SECURITY`, `APPROVAL` | same |
| QA-E01 | **done** | fixed | DefectStatus | full BE lifecycle | richer BE lifecycle |

---

## E. Recommended fix order

1. **Capacity create paths user hits now** — ResourceType ✅; next: role/skill `*Code`, task assignment body, allocation/calendar enums.
2. **Capacity overview / plan screens** — response field renames + over-allocation shape + summary date params.
3. **Quotes / finance / estimation create modals** — enum catalogs (highest 400 rate).
4. **Project work items** — TaskStatus `DONE`, dependency types, WBS/scope/milestone ✅ (section C).
5. **AI Control admin** — scope/autonomy/tool/policy enums ✅ (section D AI/NAD/IAM/NTF).

### Suggested FE pattern per fix

1. Copy BE enum string values into FE `as const` object.  
2. Align create/update payload field names to BE `*Request.java`.  
3. Map BE response → domain in `infrastructure/mappers/` if UI needs different labels.  
4. Add a Vitest: “payload uses only BE-allowed enum values”.  
5. Mark ID `done` in this tracker.

---

## F. Out of scope / caveats

- Did **not** exhaust every endpoint in the monorepo; focused on capacity fully + high-traffic domains with confirmed enum/DTO diffs.
- WAVE3/WAVE docs often **stale** vs BE (e.g. ResourceType `MEMBER` in WAVE3_API_CONTRACT). Prefer BE Java sources.
- Some FE “soft” UI may appear to work with mocks / empty catch — still count as **break** if live API rejects.

---

## F. Gantt / Timeline

| ID | Status | Severity | Issue | Fix |
|----|--------|----------|-------|-----|
| GNT-01 | **done** | break | Drag/edit gọi `move`/`resize` lưu `TaskScheduleOverride` nhưng `GET /gantt` chỉ đọc `TaskSchedule` từ schedule run → reload trả ngày cũ | BE: `GanttTaskDateResolver` merge override vào projection (`GanttQueryService`) |
| GNT-02 | **done** | warn | FE gửi `recalculate: true` mặc định → có thể reschedule cả project sau mỗi drag | FE: `recalculate: false` trên drag/resize/modal edit |

---

## G. Related files

| Artifact | Path |
|----------|------|
| This tracker | `docs/FE_BE_CONTRACT_MISMATCH_TRACKER.md` |
| Permission route map (separate) | `scripts/permission-route-map.md` |
| FE capacity enums | `modules/capacity/domain/enums/capacity.enum.ts` |
| BE ResourceType | `spr-scopery-be/.../resourceprofile/domain/enums/ResourceType.java` |
