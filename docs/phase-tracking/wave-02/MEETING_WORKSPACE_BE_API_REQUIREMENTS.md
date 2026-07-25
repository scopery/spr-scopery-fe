# Meeting Workspace Gaps — BE API Requirements

> **Status:** Proposed for BE implementation  
> **Date:** 2026-07-25  
> **Owner:** FE (Scopery) → handoff to BE  
> **FE context:** Meeting detail redesigned as continuous workspace  
> (`Prepare → Live meeting → Follow-up`) with one canvas + context rail.  
> FE ships shell/layout/autosave against **existing** Wave 2 meeting APIs.  
> Gaps below block the full collaborative-meeting experience.  
> **Related contracts:**  
> - `docs/phase-tracking/wave-02/WAVE2_API_CONTRACT.md` §4 Meetings  
> - Existing task / document / RAID / decision / requirement list APIs

---

## 0. Why FE needs this

| Gap | FE workaround today | User pain |
|---|---|---|
| No structured meeting canvas / blocks | One `minutes.summary` textarea + slash-command heuristics that create notes/action items | Cannot persist Decision/Action/Risk blocks as first-class canvas content |
| No agenda topic lifecycle | Show `agendaItem.status` if present; cannot Start / Discussed / Skip | Agenda stays a static prep list during live meeting |
| Attendance richer than Attended | Only `POST .../attended` | Cannot mark Absent / Joined late / Left early |
| Artifact link picker | Drawer searches existing project APIs then POSTs `artifact-links` with id | Works if list/search APIs exist; no dedicated meeting link-search |
| Structured recap DTO | FE composes recap from minutes + action items + notes + attendance | No single “recap” payload; no Published status beyond `generate-document` |
| AI assist | Not wired | No generate agenda / extract actions / draft recap |
| Meeting objective field | Reuses `description` or prep notes | Objective and description are conflated |

---

## 1. Meeting canvas content model (structured blocks)

### 1.1 Problem

Today content lives in:

- `minutes.summary` (free text)
- `meeting notes` (flat notes + convert endpoints)
- `action-items` (separate list)

Redesign needs **one evolving canvas** with typed blocks:

```text
Text | Heading | Checklist | Decision | Action | Risk | Issue | Requirement | ChangeRequest
```

Slash commands (`/decision`, `/action`, `/risk`, …) must create durable blocks, not only side entities.

### 1.2 Goals

1. Persist ordered blocks for a meeting (or for its latest minutes draft).  
2. Creating an Action/Decision/RAID block optionally materializes the linked domain entity.  
3. Convert from a Text block → typed block without duplicating a “Notes” panel.  
4. Follow-up recap can aggregate blocks by type.

### 1.3 Proposed APIs

**Option A (preferred) — blocks on minutes**

```http
GET    /api/projects/{projectId}/meetings/{meetingId}/minutes/{minutesId}/blocks
POST   /api/projects/{projectId}/meetings/{meetingId}/minutes/{minutesId}/blocks
PATCH  /api/projects/{projectId}/meetings/{meetingId}/minutes/{minutesId}/blocks/{blockId}
DELETE /api/projects/{projectId}/meetings/{meetingId}/minutes/{minutesId}/blocks/{blockId}
POST   /api/projects/{projectId}/meetings/{meetingId}/minutes/{minutesId}/blocks/reorder
POST   /api/projects/{projectId}/meetings/{meetingId}/minutes/{minutesId}/blocks/{blockId}/convert
```

**Create block body**

```json
{
  "type": "ACTION",
  "content": "Update migration plan",
  "sortOrder": 3,
  "meta": {
    "ownerTargetType": "USER",
    "ownerTargetId": "<uuid>",
    "dueDate": "2026-07-28"
  },
  "materialize": true
}
```

**Block types**

| type | Materialize to |
|---|---|
| `TEXT` / `HEADING` / `CHECKLIST` | none |
| `DECISION` | Decision (optional) |
| `ACTION` | Meeting action item (+ optional linked task) |
| `RISK` / `ISSUE` | RAID item |
| `REQUIREMENT` | Requirement draft |
| `CHANGE_REQUEST` | Change request draft |

**Block response**

```json
{
  "id": "<uuid>",
  "minutesId": "<uuid>",
  "type": "ACTION",
  "content": "Update migration plan",
  "sortOrder": 3,
  "status": "ACTIVE",
  "linkedEntityType": "MEETING_ACTION_ITEM",
  "linkedEntityId": "<uuid>",
  "meta": {
    "ownerDisplayName": "Linh Nguyen",
    "dueDate": "2026-07-28"
  },
  "createdAt": "<instant>",
  "updatedAt": "<instant>"
}
```

**Convert body**

```json
{
  "toType": "RISK",
  "materialize": true,
  "meta": { "type": "RISK" }
}
```

After convert: original TEXT block is replaced (or marked converted) — **do not** leave a duplicate “Converted → …” note row.

**Option B — meeting-level canvas**

Same shape under:

```http
/api/projects/{projectId}/meetings/{meetingId}/canvas/blocks
```

Prefer Option A if canvas always belongs to the working minutes draft.

### 1.4 FE interim

Until blocks exist, FE:

- Autosaves free-text into `minutes.summary`
- Parses slash lines and calls existing `action-items` / `notes` + convert APIs
- Shows capture chips in the canvas for created entities

---

## 2. Agenda topic lifecycle (live meeting)

### 2.1 Problem

`MeetingAgendaItem.status` exists (`PENDING`, …) but FE has no APIs to:

- Start topic
- Mark discussed
- Skip
- Track elapsed vs timebox

### 2.2 Proposed APIs

```http
POST /api/projects/{projectId}/meetings/{meetingId}/agenda-items/{agendaItemId}/start
POST /api/projects/{projectId}/meetings/{meetingId}/agenda-items/{agendaItemId}/discuss
POST /api/projects/{projectId}/meetings/{meetingId}/agenda-items/{agendaItemId}/skip
POST /api/projects/{projectId}/meetings/{meetingId}/agenda-items/{agendaItemId}/reopen
```

**Enriched agenda item fields**

```json
{
  "id": "<uuid>",
  "title": "Migration blockers",
  "status": "IN_DISCUSSION",
  "sortOrder": 2,
  "timeboxMinutes": 15,
  "startedAt": "<instant>",
  "discussedAt": null,
  "skippedAt": null,
  "elapsedSeconds": 504,
  "ownerUserId": "<uuid>",
  "ownerDisplayName": "Linh",
  "expectedOutcome": "Decide whether deployment must be delayed"
}
```

**Status enum**

```text
PENDING | IN_DISCUSSION | DISCUSSED | SKIPPED
```

**Create/Update agenda item — add fields**

```json
{
  "title": "Review migration blockers",
  "description": null,
  "ownerUserId": "<uuid>",
  "timeboxMinutes": 15,
  "expectedOutcome": "Decide whether deployment must be delayed",
  "sortOrder": 1
}
```

### 2.3 FE interim

FE can create / reorder / edit / delete agenda items via existing CRUD.  
Topic start/discussed/skip buttons are disabled until these endpoints ship (UI shows progress counts from `status` when BE returns them).

---

## 3. Meeting objective

### 3.1 Problem

Prepare mode needs:

```text
What must this meeting achieve?
```

Separate from long description / prep notes.

### 3.2 Proposal

Add on Meeting:

```json
{
  "objective": "Confirm migration readiness and decide go/no-go"
}
```

`PUT .../meetings/{meetingId}` accepts `objective`.  
Until then FE stores objective text in `description` or minutes prep summary with a UI label only.

---

## 4. Attendance model

### 4.1 Problem

Prepare mode needs invite roles only.  
Live / Follow-up need:

```text
Present | Absent | Joined late | Left early
```

Today: `mark-attended` only.

### 4.2 Proposed APIs

```http
POST /api/projects/{projectId}/meetings/{meetingId}/participants/{participantId}/attendance
```

```json
{
  "attendanceStatus": "ATTENDED",
  "joinedAt": null,
  "leftAt": null,
  "note": null
}
```

**attendanceStatus**

```text
INVITED | ACCEPTED | DECLINED | ATTENDED | ABSENT | JOINED_LATE | LEFT_EARLY
```

Keep `mark-attended` as shorthand for `ATTENDED` (backward compatible).

---

## 5. Artifact / context link picker

### 5.1 Problem

`POST .../artifact-links` requires `artifactType` + `artifactId` (+ optional name).  
Users must not paste UUIDs.

### 5.2 Goals

1. Search project items by type + query.  
2. Link returns display code/title.  
3. Optional external URL links.

### 5.3 Proposed APIs

**A. Dedicated search (preferred)**

```http
GET /api/projects/{projectId}/meetings/linkable-items?types=TASK,DOCUMENT,DECISION,RAID_ITEM,REQUIREMENT&q=&limit=20&offset=0
```

```json
{
  "items": [
    {
      "artifactType": "TASK",
      "artifactId": "<uuid>",
      "code": "TASK-142",
      "title": "Validate production backup",
      "subtitle": "Phase 2 · In progress",
      "status": "IN_PROGRESS"
    }
  ],
  "page": { "limit": 20, "offset": 0, "total": 1 }
}
```

**B. Enrich artifact-link response**

```json
{
  "id": "<uuid>",
  "artifactType": "TASK",
  "artifactId": "<uuid>",
  "artifactCode": "TASK-142",
  "artifactName": "Validate production backup",
  "artifactStatus": "IN_PROGRESS",
  "href": null
}
```

**C. External link**

```json
{
  "artifactType": "EXTERNAL_URL",
  "artifactId": null,
  "url": "https://...",
  "artifactName": "Runbook"
}
```

### 5.4 FE interim

`LinkProjectItemDrawer` searches existing list endpoints (tasks, documents, RAID, decisions) client-side and posts `artifact-links` with resolved id + name.

---

## 6. Structured meeting recap + publish lifecycle

### 6.1 Problem

Post-meeting should show:

```text
Summary · Decisions · Action items · Risks/Issues · Attendance
```

Minutes lifecycle today:

```text
DRAFT → IN_REVIEW → APPROVED | REJECTED
(+ generate-document)
```

Missing:

- Aggregated recap DTO
- Explicit `PUBLISHED` (or treat document generation as publish)
- `Request changes` as first-class (reject exists)
- `Create follow-up meeting` from completed meeting

### 6.2 Proposed APIs

```http
GET  /api/projects/{projectId}/meetings/{meetingId}/recap
POST /api/projects/{projectId}/meetings/{meetingId}/recap/generate
POST /api/projects/{projectId}/meetings/{meetingId}/minutes/{minutesId}/publish
POST /api/projects/{projectId}/meetings/{meetingId}/follow-up
```

**Recap response**

```json
{
  "meetingId": "<uuid>",
  "minutesId": "<uuid>",
  "minutesStatus": "DRAFT",
  "summary": "...",
  "decisions": [{ "id": "<uuid>", "title": "...", "sourceBlockId": null }],
  "actionItems": [{ "id": "<uuid>", "title": "...", "ownerDisplayName": "...", "dueDate": "...", "status": "OPEN", "linkedTaskId": null }],
  "raidItems": [{ "id": "<uuid>", "type": "RISK", "title": "..." }],
  "attendance": { "present": 5, "absent": 1, "invited": 6 },
  "unresolvedAgendaItemIds": ["<uuid>"],
  "documentId": null,
  "generatedAt": "<instant>"
}
```

**Publish**

- Sets minutes (or meeting) to published state
- Ensures meeting note document exists (may call same logic as `generate-document`)
- Idempotent if already published

**Follow-up**

```json
{
  "title": "Weekly Project Review — follow-up",
  "startAt": "<instant>",
  "copyUnresolvedActionItems": true,
  "copyUnresolvedAgenda": true
}
```

Returns created `Meeting`.

### 6.3 FE interim

FE builds a **MeetingRecap** view-model from parallel loads (minutes, action items, notes/conversions, participants) and uses existing submit/approve/generate-document buttons with clearer labels (`Publish meeting note` = generate when approved).

---

## 7. AI assist (P2)

Not required for P0 shell. When ready:

```http
POST /api/projects/{projectId}/meetings/{meetingId}/ai/generate-agenda
POST /api/projects/{projectId}/meetings/{meetingId}/ai/suggest-captures
POST /api/projects/{projectId}/meetings/{meetingId}/ai/generate-recap
```

Each returns suggestions with:

```json
{
  "suggestions": [
    {
      "id": "<uuid>",
      "kind": "ACTION",
      "content": "Validate backup before release",
      "confidence": 0.82,
      "status": "PENDING_REVIEW"
    }
  ]
}
```

Confirm / dismiss:

```http
POST .../ai/suggestions/{suggestionId}/accept
POST .../ai/suggestions/{suggestionId}/dismiss
```

UI must show **AI suggested · Not confirmed** until accept.

---

## 8. Autosave / concurrency (nice-to-have)

FE debounces `PUT .../minutes/{id}` locally.

BE should:

- Accept partial updates
- Return `updatedAt` / `version`
- Optionally support `If-Match` / version conflict `409` so multi-user canvas can surface “Couldn’t save · Retry”

---

## 9. Priority for BE

| Priority | Item | Blocks FE |
|---|---|---|
| **P0** | Agenda topic lifecycle + expectedOutcome | Live agenda rail |
| **P0** | Attendance PATCH (Absent / late) | Live attendance |
| **P0** | Artifact link search + enriched response | Link drawer quality |
| **P1** | Canvas blocks model | True collaborative notes |
| **P1** | Recap DTO + publish + follow-up | Post-meeting polish |
| **P1** | Meeting.objective | Prepare clarity |
| **P2** | AI endpoints | AI assist |
| **P2** | Optimistic concurrency on minutes | Multi-editor |

---

## 10. Acceptance checklist (BE)

- [ ] Agenda item can move PENDING → IN_DISCUSSION → DISCUSSED / SKIPPED  
- [ ] Agenda list returns progress counts / timestamps / expectedOutcome  
- [ ] Participant attendance supports Absent (and optionally late/left)  
- [ ] Linkable-item search returns Tasks/Documents/Decisions/RAID/Requirements  
- [ ] Artifact link GET returns code + title (not only raw id)  
- [ ] Canvas blocks CRUD + convert without duplicate note rows  
- [ ] Recap endpoint returns aggregated post-meeting payload  
- [ ] Publish minutes / meeting note is explicit and idempotent  
- [ ] Follow-up meeting create copies unresolved work when requested  

---

## 11. FE shipped without waiting

Implemented on current Wave 2 APIs:

1. Lifecycle stepper (view ≠ status)  
2. Header with one primary action + More (Cancel / Archive)  
3. Canvas + context rail layout  
4. Autosave minutes summary  
5. Agenda CRUD + reorder UI  
6. Participants add / remove / mark attended  
7. Slash-command capture → action item / note convert  
8. Structured action item list + create linked task  
9. Composed Follow-up recap UI  
10. Link project item drawer (client search over existing lists)  
11. Empty states with CTAs  
