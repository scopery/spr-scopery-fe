# Traceability Multi-View & Use Case Flow Mentions

Feature description for Wave 4 work delivered on FE + BE (local Docker).

---

## Cách đọc số liệu (`a/b`)

Công thức chung: **`a/b` = đã đạt / tổng cần đạt**.

Ví dụ `0/1` = chưa có cái nào đạt trong tổng 1. `1/2` = đạt 1 trên tổng 2.

Chuỗi coverage (Functional):

`Requirement → Function → Use Case → Test Case → Execution`

Nếu tầng trước còn thiếu, tầng sau có thể hiện **Not evaluated** (chưa tính, không phải lỗi).

---

### Bảng Requirements (Functional Coverage → Requirements)

Mỗi hàng = 1 Requirement.

| Cột | Ý nghĩa |
| --- | ------- |
| **Functions** | Số Function đã map với Requirement đó. `—` = chưa map Function. |
| **Function→UC** `a/b Functions có UC` | Trong `b` Function đã map, có `a` Function đã có ≥1 Use Case. `0/1` = có 1 Function nhưng Function đó chưa có UC. |
| **UC→Test** `a/b UC có Test` | Trong `b` Use Case của Requirement, có `a` UC đã gắn ≥1 Test Case. |
| **Execution** `P/F/B/NR` | Kết quả chạy test mới nhất: Passed / Failed / Blocked / Not Run. |
| **Coverage** | Trạng thái tổng + đường layer (Fn → UC → Impl → Test). |
| **Next action** | Việc nên làm tiếp (bấm được). |

**Not evaluated:** chưa đủ tầng trước (vd. chưa có Function) nên không đếm UC/Test.

---

### Bảng Functions (Functional Coverage → Functions)

Mỗi hàng = 1 Function.

| Cột | Ý nghĩa |
| --- | ------- |
| **Requirements** `a/b Req có UC` | Function đang link `b` Requirement; trong đó `a` Requirement đã được “phủ” bởi Use Case (UC của Function này cover Req đó). `0/1` = có 1 Req gắn Function nhưng chưa có UC cover. |
| **Use Cases** `a/b UC sẵn sàng · c đã có Test` | `b` = tổng UC primary của Function; `a` = UC đã đủ spec (ready); `c` = UC đã có Test Case. |
| **Coverage** | `NOT_MAPPED` / `PARTIAL` / `COMPLETE`. |
| **Next action** | Link Requirements / Create Use Case / Cover remaining… |

Mở mũi tên hàng → xem từng Requirement đã cover bởi UC nào.

---

### Bảng Use Cases (Functional Coverage → Use Cases)

Mỗi hàng = 1 Use Case.

| Cột | Ý nghĩa |
| --- | ------- |
| **Parent Function** | Function chính của UC. |
| **Specification** | Spec đã đủ chưa (`INCOMPLETE` / `TEST_READY`…). |
| **AC / Tests** | Số acceptance criteria · số test case (· latest result nếu có). |
| **Coverage** | Spec + test đã đủ chưa. |
| **Next action** | Complete specification / Link Test Case / Review… |

---

### Bảng Implementation

Mỗi hàng = 1 Function. Đếm Screen / API / Component đã link. Status `MISSING` | `PARTIAL` | `COMPLETE`.

---

### Bảng NFR Verification

Mỗi hàng = 1 Requirement non-functional: attribute → targets → verification cases → latest result.

---

## 1. Requirement Traceability — multi-view shell

**Route:** Project → Traceability (`?tab=&segment=&filter=`)

| Tab | Purpose | Main API |
| --- | ------- | -------- |
| **Overview** | Coverage strip, dual pipelines (Functional / NFR), “Needs attention” shortcuts | `GET …/traceability/overview` |
| **Functional Coverage** | Three segments: Requirements matrix, Functions pivot, Use Cases pivot | `…/matrix`, `…/functions`, `…/use-cases` |
| **Implementation** | Per-Function Screens / APIs / Components coverage | `GET …/traceability/implementation` |
| **NFR Verification** | Non-functional reqs → spec / targets / verification cases / latest result | `GET …/traceability/nfr-verification` |
| **Explorer** | Coverage tree from one root object | `GET …/traceability/explorer?rootType=&rootId=` |

### Gap stacking rule

If a Requirement is `MISSING_FUNCTION`, do **not** also treat Missing Use Case / Missing Test as actionable for that chain — downstream is “not evaluated”. Same idea: UC gap before Test.

---

## 2. Use Case Flow — Function-scoped @mentions

**Where:** Use Case detail → Flows → Add/Edit step.

Mentions only from parent Function scope (Screens → Components lazy, APIs, Entities). See [`USE_CASE_FLOW_SCOPE_MENTIONS_BE_API_REQUIREMENTS.md`](./USE_CASE_FLOW_SCOPE_MENTIONS_BE_API_REQUIREMENTS.md).

---

## Related docs

- [`REQUIREMENT_TRACEABILITY_BE_API_REQUIREMENTS.md`](./REQUIREMENT_TRACEABILITY_BE_API_REQUIREMENTS.md)
- [`USE_CASE_FLOW_SCOPE_MENTIONS_BE_API_REQUIREMENTS.md`](./USE_CASE_FLOW_SCOPE_MENTIONS_BE_API_REQUIREMENTS.md)
- [`WAVE4_API_CONTRACT.md`](./WAVE4_API_CONTRACT.md) § Trace Links / Flow scope
