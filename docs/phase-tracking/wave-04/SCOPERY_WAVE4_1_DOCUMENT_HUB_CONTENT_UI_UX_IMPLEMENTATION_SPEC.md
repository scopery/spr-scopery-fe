# SCOPERY WAVE 4.1
# Document Hub Content · Native Editor · Collaboration · AI Context
## UI/UX API Page Mapping & Frontend Implementation Specification

> **Loại tài liệu:** Incremental frontend implementation specification.  
> **Quan hệ:** Wave 4.1 bổ sung lên Wave 4 hiện tại; không thay thế toàn bộ Wave 4.  
> **Phạm vi:** Các giao diện Document Hub mới phát sinh sau khi bổ sung native content, rich-text editor, collaboration, revisions, templates, mentions, Smart Blocks, synced blocks và AI context.  
> **API prefix:** `/api/v1` theo Wave 4 contract hiện tại.  
> **Completion rule:** Không được đánh dấu Wave 4.1 hoàn thành khi còn API bắt buộc chưa được ánh xạ, chưa gọi API thật, chưa có permission/error state hoặc chưa có test evidence.

---

# 0. Executive Decision

## 0.1 Vì sao cần Wave 4.1?

Wave 4 cũ đã có:

```text
Document Hub list
Uploaded file document
File versions
Folders
Shares
Basic templates
Generated document jobs
Knowledge source/indexing
Governance inspector
AI Assistant foundation
```

Nhưng chưa có giao diện đầy đủ cho:

```text
Native document content
Rich-text/block editor
Draft/autosave
Immutable content versions
Simple Table
Columns
Sub-pages
Comments
Suggestion mode
Revision diff/restore
@Resource mention
Mention permission handling
Synced blocks
Scopery Smart Blocks
Native template versions
AI context preview
AI citations inside editor
Client visibility validation
```

Wave 4.1 chỉ bổ sung các phần này và mở rộng các màn hình Document Hub hiện có.

## 0.2 Phạm vi được chọn

```text
IN SCOPE
├── NATIVE, FILE, HYBRID document UX
├── Rich-text editor
├── Formatting and block commands
├── Simple Table
├── Media and attachments
├── Columns and sub-pages
├── Draft/autosave/conflict handling
├── Comments
├── Suggestions
├── Revisions/history/diff/restore
├── Review/approve/publish
├── Resource mentions
├── Relations
├── Native templates
├── Synced blocks
├── Smart Blocks
├── AI writing/context/citations
├── Client visibility validation
├── Knowledge indexing status
└── Full endpoint coverage register

OUT OF SCOPE
├── Notion Database Table
├── Board/calendar/gallery/timeline database views
├── Formula/rollup/database relation properties
├── Spreadsheet calculation engine
├── Arbitrary HTML/CSS/JavaScript
├── Executable iframe
├── CRDT/OT realtime multiplayer cursors
├── Offline-first collaboration
└── Public anonymous editing
```

`Simple Table` là table trình bày nội dung, không phải database.

---

# 1. Source of Truth và Contract Precedence

Thứ tự ưu tiên:

```text
1. OpenAPI đang chạy trong repository
2. WAVE4_API_CONTRACT.md
3. DOCUMENT_HUB_BACKEND_FUNCTIONAL_SPEC.md
4. SCOPERY_NATIVE_DOCUMENT_EDITOR_BE_FUNCTIONAL_SPEC.md
5. Tài liệu Wave 4.1 này
```

Nếu `/draft` và `/content` cùng tồn tại:

```text
Primary UI contract đề xuất:
- Editable draft: /draft
- Immutable versions: /content-versions

Compatibility adapter:
- /content
- /revisions
```

Frontend không gọi cả hai contract cho cùng một hành vi.

Bắt buộc tạo:

```text
DocumentContentGateway
├── getEditableContent()
├── createDraft()
├── saveEditableContent()
├── validateContent()
├── createImmutableVersion()
├── listVersions()
├── getVersion()
├── diffVersions()
└── restoreVersion()
```

Gateway adapter được chọn theo OpenAPI/feature flag. Không để component biết backend đang dùng `/draft` hay `/content`.

---

# 2. App Shell và Navigation

Wave 4.1 giữ nguyên app shell đã chốt:

```text
┌──────────────────────────────┬─────────────────────────────────────────┐
│ SIDEBAR                      │ MAIN CONTENT                            │
│ [Logo][Workspace/Project][«] │                                         │
│ Search                       │ Document Hub / Editor                   │
│ Document Hub                 │                                         │
│ Notifications                │                                         │
│ AI Assistant                 │                                         │
│ Work Inbox                   │                                         │
│ Context Navigation           │                                         │
│ [Avatar + Organization]      │                                         │
└──────────────────────────────┴─────────────────────────────────────────┘
```

Rules:

- Không thêm menu `Native Documents`.
- Không thêm menu `Project Documents`.
- Không thêm menu `Document Editor`.
- Document Hub vẫn chỉ xuất hiện một lần trong Common Navigation.
- Mở editor có thể tự collapse sidebar để tăng chiều rộng.
- Settings/Templates vẫn mở qua Avatar → Settings → Knowledge & Documents.

---

# 3. Route Map

```text
/w/:workspaceId/documents
/w/:workspaceId/documents?scopeType=WORKSPACE&scopeId=:workspaceId
/w/:workspaceId/p/:projectId/documents
/w/:workspaceId/p/:projectId/documents/:documentId
/w/:workspaceId/p/:projectId/documents/:documentId/edit
/w/:workspaceId/p/:projectId/documents/:documentId/version/:contentVersionId
/w/:workspaceId/p/:projectId/documents/:documentId/compare
/w/:workspaceId/p/:projectId/documents/generated-jobs

/settings/knowledge-documents/document-types
/settings/knowledge-documents/document-types/:documentTypeId
/settings/knowledge-documents/templates
/settings/knowledge-documents/templates/:templateId
/settings/knowledge-documents/templates/:templateId/versions/:versionId
/settings/knowledge-documents/indexing
```

Query states:

```text
?panel=comments
?panel=suggestions
?panel=history
?panel=metadata
?panel=relations
?panel=shares
?panel=knowledge
?panel=governance
?mode=edit|view|suggest
?focusBlock=:blockId
?thread=:threadId
?suggestion=:suggestionId
```

Không tạo route riêng cho mỗi block type.

---

# 4. Page Inventory

| ID | Page / Workbench | Scope | New in 4.1 |
|---|---|---|---:|
| `W41-DOC-01` | Document Hub Library | Common / scope-aware | Extended |
| `W41-DOC-02` | Create Document Wizard | Project | Yes |
| `W41-DOC-03` | Document Viewer & Inspector | Project | Extended |
| `W41-DOC-04` | Native Document Editor | Project | Yes |
| `W41-DOC-05` | Media & File Version Manager | Project | Extended |
| `W41-DOC-06` | Sub-page & Page Tree Manager | Project | Yes |
| `W41-DOC-07` | Resource Mention Experience | Embedded | Yes |
| `W41-DOC-08` | Comment Collaboration | Embedded | Yes |
| `W41-DOC-09` | Suggestion Review | Embedded | Yes |
| `W41-DOC-10` | Revision History, Diff & Restore | Project | Yes |
| `W41-DOC-11` | Review, Approval & Publish | Project | Yes |
| `W41-DOC-12` | Synced Block & Smart Block Experience | Embedded | Yes |
| `W41-DOC-13` | AI Writing & Context Panel | Embedded | Yes |
| `W41-DOC-14` | Knowledge & Indexing Inspector | Project / Settings | Extended |
| `W41-DOC-15` | Document Relations Inspector | Project | Yes |
| `W41-DOC-16` | Client Visibility & Sharing Validation | Project | Yes |
| `W41-TPL-01` | Document Template Library | Settings | Extended |
| `W41-TPL-02` | Native Template Version Builder | Settings | Yes |
| `W41-GEN-01` | Generated Document Job Center | Project | Extended |
| `W41-SET-01` | Document Type & Custom Field Builder | Settings | Reused |
| `W41-SET-02` | Knowledge Indexing Center | Settings | Reused |

---

# 5. W41-DOC-01 — Document Hub Library

## 5.1 Layout

```text
┌──────────────────────┬────────────────────────────────────┬──────────────────────┐
│ Scope & Collections  │ Document List                      │ Preview / Inspector  │
│                      │                                    │                      │
│ All Documents        │ Search                             │ Preview              │
│ Recent               │ Filters                            │ Metadata             │
│ Favorites            │ List / Grid                        │ Lifecycle            │
│ Shared with Me       │                                    │ Versions             │
│ Drafts               │                                    │ Shares               │
│ In Review            │                                    │ Relations            │
│ Published            │                                    │ Knowledge            │
│ Archived             │                                    │ Governance           │
│ Folders              │                                    │                      │
└──────────────────────┴────────────────────────────────────┴──────────────────────┘
```

## 5.2 New filters

```text
contentMode: NATIVE | FILE | HYBRID
lifecycleStatus: DRAFT | IN_REVIEW | APPROVED | PUBLISHED | ARCHIVED
documentType
classification
folder
owner
updated date
hasOpenComments
hasPendingSuggestions
indexingStatus
clientVisible
```

## 5.3 Create menu

```text
New
├── Native document
├── Upload file
├── Hybrid document
├── From template
└── New folder
```

Create wizard không được tự ép upload file cho `NATIVE`.

## 5.4 List row

```text
Icon
Title
Code
Content mode
Type
Folder
Lifecycle
Classification
Owner
Current content version
Current file version
Open comments
Indexing state
Updated
Actions
```

Không gọi N+1 để dựng row. Nếu list DTO thiếu summary fields, ghi contract gap.

---

# 6. W41-DOC-02 — Create Document Wizard

## Steps

```text
1. Choose creation type
2. Choose template or blank
3. Metadata
4. Classification and client visibility
5. Folder/parent page
6. File upload nếu FILE/HYBRID
7. Review
8. Create
9. Open editor/viewer
```

## Creation type

### NATIVE

- Tạo Document.
- Tạo draft/content rỗng hoặc từ template.
- Điều hướng tới editor.

### FILE

- Tạo Document.
- Presigned upload.
- Complete upload.
- Điều hướng tới viewer.

### HYBRID

- Tạo Document.
- Tạo native draft.
- Upload file tùy chọn.
- Điều hướng tới editor.

## Components

```text
CreateDocumentWizard
DocumentModeCard
DocumentTypePicker
TemplatePicker
DocumentMetadataStep
ClassificationStep
FolderAndParentPicker
InitialFileUploadStep
CreateDocumentSummary
```

## Error recovery

- Document tạo thành công nhưng upload thất bại: giữ document, hiển thị `File upload incomplete`.
- Upload object thành công nhưng complete thất bại: retry complete.
- Template render lỗi: không tạo document partial nếu backend transaction chưa commit.
- Duplicate code: giữ form values.
- Permission changed giữa wizard: trả forbidden, không fake success.

---

# 7. W41-DOC-03 — Document Viewer & Inspector

## Header

```text
Breadcrumb / Page tree
Icon + Title
Code
Content mode
Lifecycle badge
Classification badge
Lock/finalized badge
Autosave/published state
[Edit] [Comment] [Share] [AI] [•••]
```

## Viewer modes

```text
NATIVE
- Render published content hoặc read-only draft theo permission.

FILE
- Preview current file version.

HYBRID
- Tabs: Native Content | Files.
```

## Inspector tabs

```text
Metadata
Versions
Files
Comments
Suggestions
Relations
Shares
Knowledge
Governance
Activity
```

Sensitive user không được gọi unmasked detail trước rồi mới ẩn.

## Lifecycle actions

```text
Create draft
Submit review
Approve
Reject
Publish
Archive
Restore
Lock
Unlock
Finalize
Unfinalize
```

Chỉ hiển thị action backend cho phép. Action disabled phải có reason.

---

# 8. W41-DOC-04 — Native Document Editor

## 8.1 Desktop layout

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Breadcrumb | Title | Lifecycle | Save state | Share | Review | AI | ••• │
├──────────────────────────────────────────────────────────────────────────┤
│ Optional Page Tree │              Editor Canvas              │ Inspector │
│                    │                                         │ /Comments │
│                    │                                         │ /AI       │
└──────────────────────────────────────────────────────────────────────────┘
```

Page tree và right panel có thể đóng. Editor canvas dùng max width theo:

```text
CENTERED
WIDE
FULL
```

## 8.2 Required editor components

```text
DocumentEditorPage
DocumentEditorTopBar
DocumentBreadcrumb
EditableDocumentTitle
DocumentLifecycleBadge
DocumentClassificationBadge
DocumentLockBanner
DocumentAutosaveIndicator
DocumentEditorCanvas
EditorBubbleToolbar
EditorSlashCommandMenu
EditorBlockHandle
EditorBlockActionMenu
EditorLinkPopover
EditorColorPicker
EditorMediaToolbar
EditorTableToolbar
EditorColumnToolbar
EditorSelectionToolbar
DocumentRightPanel
DocumentConflictDialog
DocumentValidationDrawer
```

## 8.3 Formatting

```text
Bold
Italic
Underline
Strike
Inline code
Link
Text color
Highlight
Clear formatting
```

## 8.4 Blocks

```text
Paragraph
Heading 1–4
Bullet list
Ordered list
To-do list
Toggle
Quote
Callout
Divider
Code block
Equation block
Image
File
PDF
Video
Audio
Embed
Bookmark
Simple Table
Columns
Table of Contents
Breadcrumb
Sub-page reference
Synced block reference
Resource mention
Smart Block
Approval block
Status block
Progress block
AI-generated block
```

Không hiển thị block chưa có backend schema support.

## 8.5 Save state

```text
Saved
Saving…
Unsaved changes
Offline changes not saved
Conflict detected
Read-only
Locked
Finalized
Archived
Validation failed
```

Autosave:

- Debounce sau thay đổi.
- Gửi `expectedRevisionNumber` hoặc `If-Match`.
- Không chạy song song nhiều save mutation.
- Save mới nhất chờ request hiện tại hoàn tất.
- No-op response không tăng revision.
- Không hiển thị `Saved` trước response thành công.

## 8.6 Conflict flow

HTTP `409`:

```text
Your version is out of date.
[Reload latest]
[Compare changes]
[Copy my unsaved content]
[Cancel]
```

Không có nút force overwrite nếu backend chưa có explicit privileged endpoint.

## 8.7 Read-only reasons

```text
NO_EDIT_PERMISSION
DOCUMENT_LOCKED
DOCUMENT_FINALIZED
DOCUMENT_ARCHIVED
PUBLISHED_VERSION_VIEW
BASELINE_GUARD_BLOCKED
REVIEW_IN_PROGRESS_POLICY
CLASSIFICATION_POLICY
```

Hiển thị lý do cụ thể, không chỉ disable toolbar.

---

# 9. Rich Block UX

## Slash command

Khi gõ `/`:

```text
BASIC
Text
Heading
List
To-do
Toggle
Quote
Callout
Divider

MEDIA
Image
File
PDF
Video
Audio
Embed
Bookmark

LAYOUT
Simple Table
Columns
Table of Contents
Sub-page

SCOPERY
Mention resource
Smart Block
Synced Block
Approval
Status
Progress

AI
Continue writing
Rewrite
Summarize
Extract tasks
Extract requirements
Extract risks
```

Search command theo label/alias.

## Block handle menu

```text
Turn into
Move up/down
Duplicate
Copy link to block
Comment
Suggest change
Create synced block
Ask AI
Delete
```

Không cho action không phù hợp block type.

---

# 10. Simple Table

## Supported

```text
Insert/delete row
Insert/delete column
Header row
Header column
Column width
Cell alignment
Cell background whitelist
Paste tabular data
Copy as CSV
Keyboard navigation
```

## Not supported

```text
Database property
Formula
Rollup
Relation
Board/calendar/gallery/timeline
Row page
Saved view
Arbitrary query
```

## Components

```text
SimpleTableBlock
SimpleTableToolbar
TableRowActionMenu
TableColumnActionMenu
TableCellToolbar
TableLimitIndicator
TableValidationError
```

## Error states

- Row/column/cell limit exceeded.
- Unequal row shape.
- Nested table rejected.
- Unsupported merged cell.
- Invalid cell block.
- Server normalized content.

Field-level error phải focus đúng table/block.

---

# 11. Media & Attachments

## Flow

```text
Choose file
→ request presigned upload
→ upload directly to R2/MinIO
→ complete upload
→ insert attachment block
→ save document content
```

## UI states

```text
Waiting
Uploading
Verifying
Available
Quarantined
Failed
Expired upload URL
Cancelled
Orphan candidate
```

## Components

```text
AttachmentUploadButton
AttachmentDropZone
AttachmentUploadQueue
AttachmentBlock
ImageBlock
PdfBlock
MediaBlock
AttachmentProgressRow
RetryUploadButton
ReplaceAttachmentDialog
AttachmentInspector
```

Rules:

- Không lưu presigned URL vào persistent store.
- Không log URL.
- Retry expired URL bằng request mới.
- Pending attachment không được publish.
- Attachment từ document khác bị reject.
- Remove block không xóa file ngay; chỉ cập nhật UI theo backend orphan policy.

---

# 12. Sub-pages & Page Tree

## Page tree

```text
Current document
├── Overview
├── Requirements
│   ├── Functional
│   └── Non-functional
└── Architecture
```

Features:

```text
Expand/collapse
Create child page
Open in current/new tab
Rename
Move
Archive
Copy link
Drag/drop nếu backend move contract đủ
Keyboard move alternative
Cycle/depth error
```

Archive parent không được hiển thị như đã archive toàn bộ child nếu backend không cascade.

---

# 13. Resource @Mention UX

## 13.1 Picker

Khi gõ `@`:

```text
Search people, projects and resources…

RECENT
TASK-128 · Implement SSO
REQ-021 · Single sign-on
Architecture Review

PEOPLE
Nguyễn Quốc Bảo
Backend Team

TASKS
TASK-128 · Implement SSO

REQUIREMENTS
REQ-021 · Single sign-on
```

## 13.2 Result fields

```text
Type icon
Code
Title/name
Scope
Status
Classification
Archived/finalized state
Allowed modes: LIVE | SNAPSHOT | REFERENCE_ONLY
```

## 13.3 Permission behavior

```text
No DISCOVER
→ item không xuất hiện, count không leak.

DISCOVER nhưng không MENTION
→ chỉ hiển thị disabled khi policy cho phép biết object tồn tại.

READ revoked sau khi đã chèn
→ chip hiển thị Restricted resource.

AI_READ denied
→ mention vẫn có thể hiển thị cho user nhưng không đưa vào AI context.

PORTAL_READ denied
→ client visibility validation fail.
```

## 13.4 Components

```text
ResourceMentionPicker
MentionTypeTabs
MentionSearchInput
MentionResultGroup
MentionResultRow
MentionModeMenu
ResourceMentionChip
RestrictedMentionChip
ArchivedMentionChip
MentionHoverCard
MentionValidationPanel
```

## 13.5 Rendering

Frontend batch resolve mentions, không gọi một request/resource.

Không tin `labelSnapshot` là current truth.

Mention không cấp quyền.

---

# 14. Comments

## Layout

Right panel:

```text
All
Open
Resolved
Mine
Mentions
Internal
Client-visible
```

## Anchor types

```text
Document
Block
Text range
```

## Components

```text
CommentSidebar
CommentThreadList
CommentThreadCard
CommentComposer
CommentReplyComposer
CommentAnchorHighlight
OrphanedCommentBadge
ResolveThreadButton
ReopenThreadButton
CommentVisibilitySelect
```

Rules:

- Internal comment không render cho portal.
- Orphaned comment vẫn xem được.
- Deleted comment hiển thị placeholder.
- Mention target không có document access thì không notify.
- Comment create/edit/delete không optimistic nếu policy/audit cần server result.

---

# 15. Suggestion Mode

Modes:

```text
VIEW
EDIT
SUGGEST
```

Suggestion UI:

```text
Inline inserted text
Inline deleted text
Block replacement diff
Sidebar summary
Accept
Reject
Accept all
Reject all
```

`Accept all` chỉ bật khi backend có atomic batch endpoint; nếu không, không giả lập client-side partial acceptance.

Components:

```text
SuggestionModeToggle
SuggestionSidebar
SuggestionDiffCard
InlineSuggestionDecoration
AcceptSuggestionButton
RejectSuggestionButton
SuggestionConflictDialog
```

Stale suggestion:

```text
This suggestion was based on an older revision.
[View current document]
[View suggestion]
```

Không auto-merge stale suggestion.

---

# 16. Revision History, Diff & Restore

## History row

```text
Revision
Type
Author
Created
Summary
Word count
Source
Status
Actions
```

## Diff

Desktop:

```text
Side-by-side
Inline
Block-level summary
```

Mobile:

```text
Inline only
```

## Restore flow

```text
Select revision
→ preview
→ baseline/lock check
→ confirmation
→ restore
→ new revision created
→ reload editor
```

Không xóa history cũ.

Components:

```text
RevisionHistoryPanel
RevisionTimeline
RevisionViewer
RevisionDiffViewer
RevisionTypeBadge
CreateRevisionDialog
RestoreRevisionDialog
RestoreImpactSummary
```

---

# 17. Review, Approval & Publish

## Lifecycle bar

```text
DRAFT
→ Submit review
IN_REVIEW
→ Approve / Reject / Return to draft
APPROVED
→ Publish
PUBLISHED
→ Create new draft
ARCHIVED
→ Restore
```

## Submit review dialog

```text
Content version
Reviewers
Due date
Note
Open comments warning
Pending suggestions warning
Client visibility warning
```

## Publish dialog

Checks:

```text
Draft/content valid
No pending attachment
Required metadata complete
Review approved
Client visibility valid
Governance/baseline guard passed
No unresolved blocking reference
```

Publish is not optimistic.

Published content is read-only.

---

# 18. Synced Blocks & Smart Blocks

## Synced Block

Actions:

```text
Create synced block
Insert synced block reference
Open source
View current revision
Convert to snapshot
Archive source
Restricted placeholder
```

Modes:

```text
LIVE
SNAPSHOT
```

## Smart Block

Types example:

```text
PROJECT_SUMMARY
PROJECT_HEALTH
TASK_LIST
WBS
MILESTONE_LIST
REQUIREMENT
TRACEABILITY_SUMMARY
RAID_LIST
MEETING
TEST_COVERAGE
DEFECT_LIST
RELEASE_READINESS
ESTIMATION_SUMMARY
FINANCE_SUMMARY
QUOTE_SUMMARY
BASELINE_COMPARISON
CHANGE_IMPACT
DOCUMENT_LIST
```

## Smart Block configuration

```text
Source resource
Mode
Allowed filters
Columns
Limit
Client visibility
Snapshot timestamp
```

No raw query builder and no SQL expression.

Components:

```text
SyncedBlockRenderer
SyncedBlockInspector
SmartBlockPicker
SmartBlockConfigDialog
SmartBlockPreview
SmartBlockRenderer
SmartBlockRestrictedState
SmartBlockTruncatedState
SnapshotSmartBlockButton
```

---

# 19. AI Writing & Context

## AI entry points

```text
Top bar AI button
Selection toolbar
Slash command
Block menu
Right AI panel
```

## Operations

```text
Continue writing
Rewrite
Make shorter
Make longer
Change tone
Fix grammar
Translate
Summarize
Extract tasks
Extract requirements
Extract risks
Extract decisions
Generate meeting minutes
Ask about tagged resources
```

## AI flow

```text
Select document/block/text
→ choose operation
→ preview AI context
→ resolve permissions server-side
→ start AI message/SSE
→ show citations
→ preview result/diff
→ apply as suggestion or new draft
```

AI result states:

```text
GENERATED
SUGGESTED
ACCEPTED
APPLIED
REJECTED
CANCELLED
FAILED
```

AI không được sửa canonical content ngay khi stream xong.

## AI context preview

Hiển thị:

```text
Current document revision
Tagged resources included
Tagged resources denied
Classification
Version/source
Estimated context size
Provider policy warnings
```

Không trả hidden content trong preview.

## Citations

Citation row:

```text
Type
Code/title
Source version
Block/chunk
Open source
Restricted state
```

Mở citation phải re-authorize.

---

# 20. Client Visibility Validation

Right inspector:

```text
Client visibility: Off/On
Validation: Passed/Failed/Not checked
```

Validation issues:

```text
Internal resource mention
Restricted resource
Sensitive field
Internal comment
Restricted attachment
Unsafe Smart Block
Unresolved reference
Unreviewed AI content
```

Each issue row:

```text
Block/location
Reason
Severity
Open block
Remove
Convert to sanitized snapshot
Request access (nếu policy cho phép)
```

Before share/publish client-visible content, validation must pass.

---

# 21. Knowledge & Indexing

## Document knowledge tab

```text
Indexing status
Knowledge source
Source version
Chunks
Last indexed
Index schema
Classification
ACL state
Last error
[Reindex]
```

## States

```text
NOT_ELIGIBLE
NOT_INDEXED
QUEUED
INDEXING
INDEXED
FAILED
STALE
REMOVAL_QUEUED
```

Rules:

- Draft không hiển thị là shared-indexed.
- Publish thành công không đồng nghĩa indexing thành công.
- Older indexing job không được hiển thị đè newer state.
- Reindex là long-running action.
- Semantic search result phải permission-filtered.

---

# 22. Document Relations

Relations inspector:

```text
OUTGOING
Document → Requirement
Document → Task
Document → Decision

INCOMING
Release → Document
Meeting → Document
Defect → Document
```

Actions:

```text
Add relation
Open resource
Remove relation
Filter by type
Show graph
```

Không cho nhập UUID thủ công.

Target picker phải permission-filtered.

Relation không cấp quyền sang target.

---

# 23. Templates

## W41-TPL-01 — Template Library

List fields:

```text
Name
Code
Template type
Scope
Status
Published version
Classification
Updated
Usage
Actions
```

Create:

```text
FILE_TEMPLATE
NATIVE_TEMPLATE
HYBRID_TEMPLATE
```

## W41-TPL-02 — Native Template Builder

Layout:

```text
Template metadata
Native editor canvas
Variables panel
Version history
Preview with sample context
Publish
```

Variable insert menu:

```text
Organization
Workspace
Project
Client
Current user
Current date
Approved safe custom variables
```

No arbitrary expression.

Published template version is read-only.

Create document from template must resolve variables server-side.

---

# 24. Generated Document Jobs

Wave 4.1 extends job center to show native/hybrid output.

```text
Job
Source
Template
Output format
Target folder
Status
Progress
Output document
Created
Started
Completed
Error
Actions
```

Browser must not call worker-only `process` or `complete` endpoint directly.

UI can:

```text
Create job
List jobs
Open job
Cancel if public API exists
Open output
Retry through approved user-facing endpoint
```

`process` and `complete` remain `SERVICE_ORCHESTRATED`.

---

# 25. Permission Matrix

| Capability | Required effective action |
|---|---|
| View document | `DOCUMENT_VIEW` |
| Create document | `DOCUMENT_CREATE` |
| Edit metadata/draft | `DOCUMENT_UPDATE` |
| Create snapshot/revision | `DOCUMENT_UPDATE` or version action |
| Archive | `DOCUMENT_ARCHIVE` |
| Restore | `DOCUMENT_RESTORE` |
| Approve | `DOCUMENT_APPROVE` |
| Publish | `DOCUMENT_PUBLISH` |
| Download | `DOCUMENT_DOWNLOAD` |
| Share | `DOCUMENT_SHARE` |
| Comment | `DOCUMENT_COMMENT` |
| Manage relation | `DOCUMENT_RELATION_MANAGE` |
| Use document in AI | `DOCUMENT_AI_USE` |
| Search knowledge | `KNOWLEDGE_SEARCH` |
| Reindex | `KNOWLEDGE_REINDEX` |
| Mention resource | `DISCOVER + READ + MENTION` |
| Embed Smart Block | `DISCOVER + READ + EMBED` |
| AI resolve resource | `READ + AI_READ` |
| Portal/client render | `READ + PORTAL_READ` |

Frontend may hide unavailable actions, but backend remains authoritative.

---

# 26. Query, Mutation & Cache Architecture

## Query key factory

```text
documents.scope(scopeType, scopeId, filters)
documents.detail(projectId, documentId, permissionHash)
documents.masked(projectId, documentId, permissionHash)
documents.draft(projectId, documentId)
documents.content(projectId, documentId)
documents.contentVersions(projectId, documentId, page)
documents.revisions(projectId, documentId)
documents.comments(projectId, documentId, filters)
documents.suggestions(projectId, documentId, filters)
documents.relations(projectId, documentId)
documents.subpages(projectId, documentId)
documents.shares(projectId, documentId)
documents.fileVersions(projectId, documentId)
documents.mentions(documentId, refs, permissionVersion)
documents.clientValidation(projectId, documentId, revision)
documents.knowledge(projectId, documentId)
documents.governance(projectId, documentId)
templates.list(workspaceId, filters)
templates.detail(workspaceId, templateId)
templates.versions(workspaceId, templateId)
syncedBlocks.detail(syncedBlockId, permissionVersion)
smartBlocks.resolve(configHash, permissionVersion)
ai.messages(conversationId)
ai.citations(messageId)
```

Sensitive query:

- Include permission version/hash.
- Do not persist to local storage.
- Clear on logout, org switch, workspace switch, project switch and permission change.

## Critical invalidation

```text
Save draft
→ draft/content, document header, validation, mentions

Create revision/version
→ history, detail, activity

Approve/publish
→ detail, published content, lifecycle, history, knowledge status, search

Archive/restore
→ list, detail, search, recent, favorites, activity, knowledge

Comment mutation
→ comment threads, counts, activity, notifications

Suggestion accept
→ content/draft, suggestions, revisions, mentions, activity

Mention changes
→ mention resolution, client validation, AI context preview

Share mutation
→ shares, detail, portal state, activity

Relation mutation
→ relations, knowledge graph, activity

Template publish
→ template detail/versions/list/create-document options

Smart/synced block mutation
→ block query, document content preview, client validation

AI apply
→ document content, suggestions, revisions, activity
```

---

# 27. Optimistic UI Rules

## Allowed

```text
Local rich-text editing before autosave
Open/close panels
Local block reorder before save
Local toolbar state
Comment draft
AI prompt draft
Favorite/unfavorite with rollback if existing Wave 4 allows
```

## Not allowed

```text
Save success indicator before response
Approve
Reject
Publish
Archive
Restore
Share/revoke
Attachment complete
Suggestion accept/reject
Revision restore
Governance lock/finalize
Client visibility pass
AI result apply
Template publish
Synced block archive
Smart block snapshot
```

---

# 28. Loading, Empty, Error & Forbidden States

Every page/component must handle:

```text
Initial loading
Background refresh
Empty
Partial empty
Validation error
Forbidden
Not found
Archived
Locked
Finalized
Masked
Stale revision
Conflict
Rate limited
Network offline
Upload expired
Upload failed
Indexing failed
AI stream interrupted
AI cancelled
Restricted mention
Deleted resource
Orphaned comment
Stale suggestion
Long-running job queued/running/failed
```

Error display includes:

```text
Human message
Error code
Trace ID
Retry when safe
Open details for admin/support
```

Không hiển thị raw stack trace.

---

# 29. Error-to-UI Mapping

| Error | UI behavior |
|---|---|
| `DOCUMENT_CONTENT_REVISION_CONFLICT` | Conflict dialog, preserve local content |
| `DOCUMENT_CONTENT_INVALID` | Validation drawer + focus block |
| `DOCUMENT_TABLE_INVALID` | Focus table and offending row/cell |
| `DOCUMENT_TABLE_LIMIT_EXCEEDED` | Limit banner, prevent further insertion |
| `DOCUMENT_ATTACHMENT_NOT_AVAILABLE` | Upload queue warning |
| `DOCUMENT_ATTACHMENT_SCOPE_MISMATCH` | Remove invalid block reference |
| `DOCUMENT_MENTION_INSERT_DENIED` | Remove pending mention and show permission reason |
| `DOCUMENT_MENTION_RESOURCE_NOT_FOUND` | Unresolved mention state |
| `DOCUMENT_CLIENT_VISIBILITY_INVALID` | Open validation drawer |
| `DOCUMENT_SUGGESTION_BASE_REVISION_CONFLICT` | Stale suggestion dialog |
| `DOCUMENT_COMMENT_ANCHOR_INVALID` | Offer document-level comment |
| `DOCUMENT_TEMPLATE_VARIABLE_MISSING` | Focus variable configuration |
| `SYNCED_BLOCK_RECURSION` | Block insertion denied |
| `AI_RESOURCE_READ_DENIED` | Context preview denied row |
| `AI_CONTEXT_TOO_LARGE` | Show truncated resource summary |
| `DOCUMENT_LOCKED` | Read-only banner |
| `DOCUMENT_FINALIZED` | Read-only banner + unfinalize action if permitted |
| `GOVERNANCE_BASELINE_GUARD_BLOCKED` | Change request/guard explanation |
| `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD` | Stop retry and surface conflict |

---

# 30. Accessibility

Required:

```text
Keyboard access for toolbar/slash command/mention picker
Arrow-key navigation in picker
Escape closes popover
Focus returns to caret
Screen-reader labels for formatting state
Table keyboard navigation
Comment anchor announced
Suggestion insertion/deletion announced
Save state uses aria-live
Conflict dialog traps focus
Color is not the only status indicator
Reduced motion supported
Touch target >= 44x44 where practical
```

Simple Table must have semantic table rendering in view mode.

---

# 31. Responsive

## Desktop ≥ 1280

- Optional page tree.
- Center editor.
- Right panel.
- Full bubble/slash toolbar.

## Tablet 768–1279

- Page tree drawer.
- Right panel overlay.
- Compact top bar.
- Editor remains primary.

## Mobile < 768

- Viewer first.
- Editor only for supported blocks.
- Toolbar bottom sheet.
- Comments/history/AI full-screen sheets.
- Revision diff inline.
- Large table horizontal scroll.
- No drag-only action; provide menus.

---

# 32. Frontend Package Structure

```text
features/document-hub/
├── api/
│   ├── documentApi.ts
│   ├── documentContentGateway.ts
│   ├── documentDraftAdapter.ts
│   ├── documentContentAdapter.ts
│   ├── documentVersionApi.ts
│   ├── documentCommentApi.ts
│   ├── documentSuggestionApi.ts
│   ├── documentMentionApi.ts
│   ├── documentRelationApi.ts
│   ├── documentTemplateApi.ts
│   ├── syncedBlockApi.ts
│   ├── smartBlockApi.ts
│   └── documentAiApi.ts
├── editor/
│   ├── schema/
│   ├── extensions/
│   ├── commands/
│   ├── serializers/
│   ├── validators/
│   └── components/
├── pages/
├── components/
├── hooks/
├── state/
├── permissions/
├── routes/
├── tests/
└── index.ts
```

Do not store canonical document content in a global Redux slice if query/editor state is sufficient.

---

# 33. Test Matrix

## Unit

```text
AST serializer/deserializer
Block ID stability
Formatting marks
URL sanitizer UI adapter
Simple Table commands
Table limits
Mention node serialization
Mention permission states
Autosave queue
Conflict state reducer
Revision diff presentation
Comment anchor mapping
Suggestion decoration
Smart Block configuration
Client visibility issue mapping
AI citation mapping
```

## Component

```text
Slash command keyboard
Mention picker permission result
Restricted mention chip
Upload queue retry
Comment resolve/reopen
Suggestion accept/reject states
History pagination
Restore confirmation
Publish validation
Client visibility issue navigation
AI stream/cancel/reconnect
```

## E2E mandatory

```text
E2E-W41-001 Create NATIVE document and open editor
E2E-W41-002 Save/reload formatting
E2E-W41-003 Insert heading/list/todo/callout/code
E2E-W41-004 Create/edit/reload Simple Table
E2E-W41-005 Table validation error focuses block
E2E-W41-006 Upload image/file via presigned flow
E2E-W41-007 Mention picker only returns authorized resources
E2E-W41-008 Save @TASK and reopen exact task
E2E-W41-009 Revoked target displays Restricted resource
E2E-W41-010 AI context preview lists exact authorized mentions
E2E-W41-011 AI citation opens authorized source/version
E2E-W41-012 Comment text range and resolve
E2E-W41-013 Suggestion accept creates new revision
E2E-W41-014 Stale suggestion is blocked
E2E-W41-015 Publish then edit creates new draft
E2E-W41-016 Version history is immutable
E2E-W41-017 Restore creates new revision
E2E-W41-018 Create/move sub-page
E2E-W41-019 Archive/restore document
E2E-W41-020 Share/revoke document
E2E-W41-021 Client visibility blocks internal mention
E2E-W41-022 Smart Block preview/resolve/snapshot
E2E-W41-023 Synced Block permission revoked
E2E-W41-024 Save conflict preserves local content
E2E-W41-025 Search respects classification and ACL
E2E-W41-026 Reindex status queued/running/success/fail
E2E-W41-027 Worker-only job endpoints are never called by browser
E2E-W41-028 All mandatory APIs have network/test evidence
```

---

# 34. Implementation Order

## W41-P0 — Contract Lock

```text
OpenAPI snapshot
Resolve /draft vs /content
Resolve /content-versions vs /revisions
Lock review/approve/reject/publish paths
Lock mention scoped/global paths
Generate typed client
Create coverage register
```

## W41-P1 — Native Core

```text
Create NATIVE/HYBRID
Editor route
Draft/content load/save
Autosave
Conflict
Validation
Formatting
Block schema
Simple Table
```

## W41-P2 — Assets & Structure

```text
Attachments
Columns
Sub-pages
Page tree
Relations
Metadata update
Archive/restore
```

## W41-P3 — Collaboration

```text
Comments
Suggestion mode
Revision history
Diff
Restore
Review/approval/publish
```

## W41-P4 — Reusable Content

```text
Native template versions
Create from template
Synced blocks
Smart Blocks
```

## W41-P5 — Intelligence & Client Safety

```text
Mentions
AI context preview
AI writing
Citations
Knowledge indexing
Client visibility validation
```

## W41-P6 — Hardening

```text
Permission revocation
Masking
Error states
Accessibility
Responsive
Performance
E2E
Coverage reconciliation
```

---

# 35. Contract Gaps

| ID | Severity | Gap | Required resolution |
|---|---|---|---|
| `W41-GAP-API-01` | Critical | `/draft` + `/content` và `/content-versions` + `/revisions` trùng capability | Chốt canonical OpenAPI hoặc compatibility adapter |
| `W41-GAP-API-02` | Critical | Review approve/reject/publish path phải xác nhận từ OpenAPI | Không code path suy đoán |
| `W41-GAP-API-03` | High | Document list DTO có thể thiếu content mode, owner, counts, indexing summary | Bổ sung aggregate DTO, không N+1 |
| `W41-GAP-API-04` | High | Comment/suggestion pagination/filter contract cần xác nhận | Chuẩn hóa trước scale |
| `W41-GAP-API-05` | High | Accept all/reject all suggestion chưa có batch endpoint | Không giả lập partial atomicity |
| `W41-GAP-API-06` | High | Cancel generated job user-facing có thể chưa có | Feature gate |
| `W41-GAP-API-07` | High | Folder rename/move API chưa chắc đã có | Feature gate hoặc bổ sung |
| `W41-GAP-API-08` | High | Realtime collaboration không có contract | Không quảng bá live collaboration |
| `W41-GAP-API-09` | Medium | Smart Block result DTO cần typed schema theo type | Không dùng raw map làm primary UI |
| `W41-GAP-API-10` | Medium | AI apply action phải trả typed affected entities | Không invalidate mù |

---

# 36. Definition of Done

Wave 4.1 chỉ hoàn thành khi:

```text
OpenAPI endpoint count = Coverage Register endpoint count
AND all mandatory endpoints classified
AND all user-facing endpoints UI_TESTED
AND no UNMAPPED endpoint
AND no MOCK_ONLY flow
AND no unresolved mandatory contract blocker
AND every mutation has invalidation strategy
AND permission-denied states tested
AND save conflict tested
AND upload expiry/failure tested
AND mention access-revoked tested
AND portal/client non-leak tested
AND AI actor permission tested
AND citations tested
AND no worker-only endpoint called from browser
AND no Notion Database Table implemented
```

Completion evidence:

```text
docs/phase-complete/WAVE_4_1_DOCUMENT_HUB_CONTENT_UI_COMPLETE.md
```

Required sections:

```text
Summary
OpenAPI snapshot/version
Endpoint reconciliation
Pages/routes implemented
Components implemented
Permission matrix
Query/mutation hooks
Cache invalidation
Error states
Accessibility
Responsive
Unit tests
Component tests
E2E tests
Network evidence
Contract blockers
Approved exceptions
Deferred items
Final endpoint counts
```

---

# 37. Endpoint-to-UI Coverage Register

Register này gồm:

```text
Wave 4 endpoints được Wave 4.1 tái sử dụng/mở rộng
+
Document Hub backend additions
+
Native Editor extension endpoints
+
Knowledge/Governance/AI supporting endpoints
```

Trạng thái ban đầu không đồng nghĩa đã implement.

## 37.1 Register Summary

```text
Total rows in Wave 4.1 register: 163
WAVE4_EXISTING reused/extended: 98
DOCUMENT_HUB_BE additions: 21
NATIVE_EDITOR_BE additions/aliases: 44
```

> Các row `CONTRACT_RECONCILIATION_REQUIRED` vẫn phải tồn tại trong register cho đến khi OpenAPI xác nhận canonical path hoặc compatibility status.

| # | Source | Module | Area | Method | Path | Purpose | Page | Component | Class | Hook | Invalidation | Initial status | Gap |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | WAVE4_EXISTING | DocumentHub | Documents | `POST` | `/api/v1/projects/{projectId}/documents` | Tạo document | W41-DOC-01 / W41-DOC-02 / W41-DOC-03 | DocumentHubPage / DocumentEditorPage / DocumentInspector | `UI_ACTION` | `useDocumentsTODocumentMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 2 | WAVE4_EXISTING | DocumentHub | Documents | `GET` | `/api/v1/projects/{projectId}/documents` | Danh sách | W41-DOC-01 / W41-DOC-02 / W41-DOC-03 | DocumentHubPage / DocumentEditorPage / DocumentInspector | `UI_READ` | `useDocumentsDanhSChQuery` | None | MAPPED — REUSE/EXTEND | — |
| 3 | WAVE4_EXISTING | DocumentHub | Documents | `GET` | `/api/v1/projects/{projectId}/documents/search?q=` | Full-text search (trả masked snippets) | W41-DOC-01 / W41-DOC-02 / W41-DOC-03 | DocumentHubPage / DocumentEditorPage / DocumentInspector | `UI_READ` | `useDocumentsFullTextSearchTrMaskedSnippetsQuery` | None | MAPPED — REUSE/EXTEND | — |
| 4 | WAVE4_EXISTING | DocumentHub | Documents | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}` | Lấy theo ID | W41-DOC-01 / W41-DOC-02 / W41-DOC-03 | DocumentHubPage / DocumentEditorPage / DocumentInspector | `UI_READ` | `useDocumentsLYTheoIdQuery` | None | MAPPED — REUSE/EXTEND | — |
| 5 | WAVE4_EXISTING | DocumentHub | Documents | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/masked` | Lấy với sensitive fields bị mask | W41-DOC-01 / W41-DOC-02 / W41-DOC-03 | DocumentHubPage / DocumentEditorPage / DocumentInspector | `UI_READ` | `useDocumentsLYVISensitiveFieldsBMaskQuery` | None | MAPPED — REUSE/EXTEND | — |
| 6 | WAVE4_EXISTING | DocumentHub | Documents | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/approve` | Phê duyệt | W41-DOC-01 / W41-DOC-02 / W41-DOC-03 | DocumentHubPage / DocumentEditorPage / DocumentInspector | `UI_ACTION` | `useDocumentsPhDuyTMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 7 | WAVE4_EXISTING | DocumentHub | Document Versions | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/versions` | Upload trực tiếp (legacy — dùng storageKey) | W41-DOC-03 / W41-DOC-05 | FileVersionPanel / AttachmentTransferManager | `LEGACY_COMPATIBILITY` | `useDocumentVersionsUploadTrCTiPLegacyDNgStoragekeyMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 8 | WAVE4_EXISTING | DocumentHub | Document Versions | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/versions/presigned-upload` | Lấy presigned URL để upload thẳng lên storage | W41-DOC-03 / W41-DOC-05 | FileVersionPanel / AttachmentTransferManager | `UI_ACTION` | `useDocumentVersionsLYPresignedUrlUploadThNgLNStorageMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 9 | WAVE4_EXISTING | DocumentHub | Document Versions | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/versions/{versionId}/complete-upload` | Xác nhận upload hoàn tất | W41-DOC-03 / W41-DOC-05 | FileVersionPanel / AttachmentTransferManager | `UI_ACTION` | `useDocumentVersionsXCNhNUploadHoNTTMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 10 | WAVE4_EXISTING | DocumentHub | Document Versions | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/versions/{versionId}/presigned-download` | Lấy presigned URL để download | W41-DOC-03 / W41-DOC-05 | FileVersionPanel / AttachmentTransferManager | `UI_ACTION` | `useDocumentVersionsLYPresignedUrlDownloadMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 11 | WAVE4_EXISTING | DocumentHub | Document Versions | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/versions` | Danh sách versions | W41-DOC-03 / W41-DOC-05 | FileVersionPanel / AttachmentTransferManager | `UI_READ` | `useDocumentVersionsDanhSChVersionsQuery` | None | MAPPED — REUSE/EXTEND | — |
| 12 | WAVE4_EXISTING | DocumentHub | Document Versions | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/versions/{versionId}` | Lấy metadata theo ID | W41-DOC-03 / W41-DOC-05 | FileVersionPanel / AttachmentTransferManager | `UI_READ` | `useDocumentVersionsLYMetadataTheoIdQuery` | None | MAPPED — REUSE/EXTEND | — |
| 13 | WAVE4_EXISTING | DocumentHub | Document Folders | `POST` | `/api/v1/projects/{projectId}/document-folders` | Tạo folder | W41-DOC-01 | DocumentFolderTree / MoveDocumentDialog | `UI_ACTION` | `useDocumentFoldersTOFolderMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 14 | WAVE4_EXISTING | DocumentHub | Document Folders | `GET` | `/api/v1/projects/{projectId}/document-folders` | Danh sách | W41-DOC-01 | DocumentFolderTree / MoveDocumentDialog | `UI_READ` | `useDocumentFoldersDanhSChQuery` | None | MAPPED — REUSE/EXTEND | — |
| 15 | WAVE4_EXISTING | DocumentHub | Document Folders | `GET` | `/api/v1/projects/{projectId}/document-folders/{folderId}` | Lấy theo ID | W41-DOC-01 | DocumentFolderTree / MoveDocumentDialog | `UI_READ` | `useDocumentFoldersLYTheoIdQuery` | None | MAPPED — REUSE/EXTEND | — |
| 16 | WAVE4_EXISTING | DocumentHub | Document Folders | `PATCH` | `/api/v1/projects/{projectId}/document-folders/{folderId}/archive` | Lưu trữ | W41-DOC-01 | DocumentFolderTree / MoveDocumentDialog | `UI_ACTION` | `useDocumentFoldersLUTrMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 17 | WAVE4_EXISTING | DocumentHub | Document Shares | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/shares` | Tạo share token/grant | W41-DOC-03 / W41-DOC-16 | DocumentSharePanel / ShareDialog | `UI_ACTION` | `useDocumentSharesTOShareTokenGrantMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 18 | WAVE4_EXISTING | DocumentHub | Document Shares | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/shares` | Danh sách | W41-DOC-03 / W41-DOC-16 | DocumentSharePanel / ShareDialog | `UI_READ` | `useDocumentSharesDanhSChQuery` | None | MAPPED — REUSE/EXTEND | — |
| 19 | WAVE4_EXISTING | DocumentHub | Document Shares | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/shares/{shareId}/revoke` | Thu hồi | W41-DOC-03 / W41-DOC-16 | DocumentSharePanel / ShareDialog | `UI_ACTION` | `useDocumentSharesThuHIMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 20 | WAVE4_EXISTING | DocumentHub | Document Templates | `POST` | `/api/v1/workspaces/{workspaceId}/document-templates` | Tạo template | W41-TPL-01 / W41-TPL-02 | DocumentTemplateLibrary / TemplateBuilderPage | `UI_ACTION` | `useDocumentTemplatesTOTemplateMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 21 | WAVE4_EXISTING | DocumentHub | Document Templates | `GET` | `/api/v1/workspaces/{workspaceId}/document-templates` | Danh sách | W41-TPL-01 / W41-TPL-02 | DocumentTemplateLibrary / TemplateBuilderPage | `UI_READ` | `useDocumentTemplatesDanhSChQuery` | None | MAPPED — REUSE/EXTEND | — |
| 22 | WAVE4_EXISTING | DocumentHub | Document Templates | `GET` | `/api/v1/workspaces/{workspaceId}/document-templates/{templateId}` | Lấy theo ID | W41-TPL-01 / W41-TPL-02 | DocumentTemplateLibrary / TemplateBuilderPage | `UI_READ` | `useDocumentTemplatesLYTheoIdQuery` | None | MAPPED — REUSE/EXTEND | — |
| 23 | WAVE4_EXISTING | DocumentHub | Generated Document Jobs | `POST` | `/api/v1/projects/{projectId}/generated-documents` | Queue generation job | W41-GEN-01 | GeneratedDocumentJobCenter / JobDetailDrawer | `UI_ACTION` | `useGeneratedDocumentJobsQueueGenerationJobMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 24 | WAVE4_EXISTING | DocumentHub | Generated Document Jobs | `GET` | `/api/v1/projects/{projectId}/generated-documents` | Danh sách jobs | W41-GEN-01 | GeneratedDocumentJobCenter / JobDetailDrawer | `UI_READ` | `useGeneratedDocumentJobsDanhSChJobsQuery` | None | MAPPED — REUSE/EXTEND | — |
| 25 | WAVE4_EXISTING | DocumentHub | Generated Document Jobs | `GET` | `/api/v1/projects/{projectId}/generated-documents/{jobId}` | Lấy theo ID | W41-GEN-01 | GeneratedDocumentJobCenter / JobDetailDrawer | `UI_READ` | `useGeneratedDocumentJobsLYTheoIdQuery` | None | MAPPED — REUSE/EXTEND | — |
| 26 | WAVE4_EXISTING | DocumentHub | Generated Document Jobs | `POST` | `/api/v1/projects/{projectId}/generated-documents/{jobId}/process` | Claim + render template + store (body: `variables: Map`) | W41-GEN-01 | GeneratedDocumentJobCenter / JobDetailDrawer | `SERVICE_ORCHESTRATED` | `useGeneratedDocumentJobsClaimRenderTemplateStoreBodyVariablesMapMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 27 | WAVE4_EXISTING | DocumentHub | Generated Document Jobs | `POST` | `/api/v1/projects/{projectId}/generated-documents/{jobId}/complete` | Mark completed (body: `outputDocumentId`) | W41-GEN-01 | GeneratedDocumentJobCenter / JobDetailDrawer | `SERVICE_ORCHESTRATED` | `useGeneratedDocumentJobsMarkCompletedBodyOutputdocumentidMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 28 | WAVE4_EXISTING | Knowledge | Document Types | `POST` | `/api/v1/knowledge/document-types` | Tạo document type | W41-TPL-01 / W41-SET-01 / Create Document | DocumentTypeLibrary / DocumentTypeBuilder | `UI_ACTION` | `useDocumentTypesTODocumentTypeMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 29 | WAVE4_EXISTING | Knowledge | Document Types | `POST` | `/api/v1/knowledge/document-types/system` | Tạo system-level document type | W41-TPL-01 / W41-SET-01 / Create Document | DocumentTypeLibrary / DocumentTypeBuilder | `UI_ACTION` | `useDocumentTypesTOSystemLevelDocumentTypeMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 30 | WAVE4_EXISTING | Knowledge | Document Types | `POST` | `/api/v1/knowledge/document-types/workspace` | Tạo workspace-level document type | W41-TPL-01 / W41-SET-01 / Create Document | DocumentTypeLibrary / DocumentTypeBuilder | `UI_ACTION` | `useDocumentTypesTOWorkspaceLevelDocumentTypeMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 31 | WAVE4_EXISTING | Knowledge | Document Types | `GET` | `/api/v1/knowledge/document-types?keyword=&organizationId=&workspaceId=&documentScope=&status=&builtIn=&includeArchived=&page=&size=` | Tìm kiếm (paginated) | W41-TPL-01 / W41-SET-01 / Create Document | DocumentTypeLibrary / DocumentTypeBuilder | `UI_READ` | `useDocumentTypesTMKiMPaginatedQuery` | None | MAPPED — REUSE/EXTEND | — |
| 32 | WAVE4_EXISTING | Knowledge | Document Types | `GET` | `/api/v1/knowledge/document-types/{id}` | Lấy theo ID | W41-TPL-01 / W41-SET-01 / Create Document | DocumentTypeLibrary / DocumentTypeBuilder | `UI_READ` | `useDocumentTypesLYTheoIdQuery` | None | MAPPED — REUSE/EXTEND | — |
| 33 | WAVE4_EXISTING | Knowledge | Document Types | `PUT` | `/api/v1/knowledge/document-types/{id}` | Cập nhật | W41-TPL-01 / W41-SET-01 / Create Document | DocumentTypeLibrary / DocumentTypeBuilder | `UI_ACTION` | `useDocumentTypesCPNhTMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 34 | WAVE4_EXISTING | Knowledge | Document Types | `PATCH` | `/api/v1/knowledge/document-types/{id}/activate` | Kích hoạt | W41-TPL-01 / W41-SET-01 / Create Document | DocumentTypeLibrary / DocumentTypeBuilder | `UI_ACTION` | `useDocumentTypesKChHoTMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 35 | WAVE4_EXISTING | Knowledge | Document Types | `PATCH` | `/api/v1/knowledge/document-types/{id}/deactivate` | Vô hiệu hoá | W41-TPL-01 / W41-SET-01 / Create Document | DocumentTypeLibrary / DocumentTypeBuilder | `UI_ACTION` | `useDocumentTypesVHiUHoMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 36 | WAVE4_EXISTING | Knowledge | Document Types | `PATCH` | `/api/v1/knowledge/document-types/{id}/archive` | Lưu trữ | W41-TPL-01 / W41-SET-01 / Create Document | DocumentTypeLibrary / DocumentTypeBuilder | `UI_ACTION` | `useDocumentTypesLUTrMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 37 | WAVE4_EXISTING | Knowledge | Document Types | `PATCH` | `/api/v1/knowledge/document-types/{id}/soft-delete` | Xoá mềm | W41-TPL-01 / W41-SET-01 / Create Document | DocumentTypeLibrary / DocumentTypeBuilder | `UI_ACTION` | `useDocumentTypesXoMMMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 38 | WAVE4_EXISTING | Knowledge | Document Type Fields | `POST` | `/api/v1/knowledge/document-types/{documentTypeId}/fields` | Thêm custom field | W41-SET-01 / W41-DOC-04 | CustomFieldSchemaBuilder / DocumentMetadataForm | `UI_ACTION` | `useDocumentTypeFieldsThMCustomFieldMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 39 | WAVE4_EXISTING | Knowledge | Document Type Fields | `GET` | `/api/v1/knowledge/document-types/{documentTypeId}/fields` | Danh sách | W41-SET-01 / W41-DOC-04 | CustomFieldSchemaBuilder / DocumentMetadataForm | `UI_READ` | `useDocumentTypeFieldsDanhSChQuery` | None | MAPPED — REUSE/EXTEND | — |
| 40 | WAVE4_EXISTING | Knowledge | Document Type Fields | `GET` | `/api/v1/knowledge/document-types/{documentTypeId}/fields/{fieldId}` | Lấy theo ID | W41-SET-01 / W41-DOC-04 | CustomFieldSchemaBuilder / DocumentMetadataForm | `UI_READ` | `useDocumentTypeFieldsLYTheoIdQuery` | None | MAPPED — REUSE/EXTEND | — |
| 41 | WAVE4_EXISTING | Knowledge | Document Type Fields | `PUT` | `/api/v1/knowledge/document-types/{documentTypeId}/fields/{fieldId}` | Cập nhật | W41-SET-01 / W41-DOC-04 | CustomFieldSchemaBuilder / DocumentMetadataForm | `UI_ACTION` | `useDocumentTypeFieldsCPNhTMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 42 | WAVE4_EXISTING | Knowledge | Document Type Fields | `PUT` | `/api/v1/knowledge/document-types/{documentTypeId}/fields/reorder` | Sắp xếp lại (body: `orderedFieldIds: [uuid...]`) | W41-SET-01 / W41-DOC-04 | CustomFieldSchemaBuilder / DocumentMetadataForm | `UI_ACTION` | `useDocumentTypeFieldsSPXPLIBodyOrderedfieldidsUuidMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 43 | WAVE4_EXISTING | Knowledge | Document Type Fields | `PATCH` | `/api/v1/knowledge/document-types/{documentTypeId}/fields/{fieldId}/activate` | Kích hoạt | W41-SET-01 / W41-DOC-04 | CustomFieldSchemaBuilder / DocumentMetadataForm | `UI_ACTION` | `useDocumentTypeFieldsKChHoTMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 44 | WAVE4_EXISTING | Knowledge | Document Type Fields | `PATCH` | `/api/v1/knowledge/document-types/{documentTypeId}/fields/{fieldId}/deactivate` | Vô hiệu hoá | W41-SET-01 / W41-DOC-04 | CustomFieldSchemaBuilder / DocumentMetadataForm | `UI_ACTION` | `useDocumentTypeFieldsVHiUHoMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 45 | WAVE4_EXISTING | Knowledge | Document Type Fields | `PATCH` | `/api/v1/knowledge/document-types/{documentTypeId}/fields/{fieldId}/archive` | Lưu trữ | W41-SET-01 / W41-DOC-04 | CustomFieldSchemaBuilder / DocumentMetadataForm | `UI_ACTION` | `useDocumentTypeFieldsLUTrMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 46 | WAVE4_EXISTING | Knowledge | Document Classifications | `GET` | `/api/v1/knowledge/document-classifications` | Danh sách tất cả classifications | W41-DOC-03 / W41-DOC-16 | ClassificationSelect / ClientVisibilityValidator | `UI_READ` | `useDocumentClassificationsDanhSChTTCClassificationsQuery` | None | MAPPED — REUSE/EXTEND | — |
| 47 | WAVE4_EXISTING | Knowledge | Knowledge Graph | `GET` | `/api/v1/knowledge/graph/nodes/{nodeId}/related?depth=1&limit=20` | Lấy related nodes (requires `X-Acl-Tokens` header) | W41-DOC-14 | RelatedResourcesPanel / KnowledgeGraphDrawer | `UI_READ` | `useKnowledgeGraphLYRelatedNodesRequiresXAclTokensHeaderQuery` | None | MAPPED — REUSE/EXTEND | — |
| 48 | WAVE4_EXISTING | Knowledge | Knowledge Sources | `GET` | `/api/v1/knowledge/sources/{sourceId}` | Lấy source metadata | W41-DOC-14 | KnowledgeSourceInspector | `UI_READ` | `useKnowledgeSourcesLYSourceMetadataQuery` | None | MAPPED — REUSE/EXTEND | — |
| 49 | WAVE4_EXISTING | Knowledge | Knowledge Sources | `GET` | `/api/v1/knowledge/sources/{sourceId}/chunks?page=&size=` | Lấy chunks (paginated) | W41-DOC-14 | KnowledgeSourceInspector | `UI_READ` | `useKnowledgeSourcesLYChunksPaginatedQuery` | None | MAPPED — REUSE/EXTEND | — |
| 50 | WAVE4_EXISTING | Knowledge | Knowledge Sources | `POST` | `/api/v1/knowledge/sources/{sourceId}/reindex` | Reindex source (header: `X-Actor-Id`) | W41-DOC-14 | KnowledgeSourceInspector | `UI_ACTION` | `useKnowledgeSourcesReindexSourceHeaderXActorIdMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 51 | WAVE4_EXISTING | Knowledge | Knowledge Indexing | `POST` | `/api/v1/knowledge/indexing/projects/{projectId}/reindex` | Reindex toàn project (header: `X-Workspace-Id`) | W41-DOC-14 / W41-SET-02 | IndexingStatusPanel / ReindexDialog | `UI_ACTION` | `useKnowledgeIndexingReindexToNProjectHeaderXWorkspaceIdMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 52 | WAVE4_EXISTING | Knowledge | Knowledge Indexing | `POST` | `/api/v1/knowledge/indexing/workspaces/{workspaceId}/reindex` | Reindex toàn workspace | W41-DOC-14 / W41-SET-02 | IndexingStatusPanel / ReindexDialog | `UI_ACTION` | `useKnowledgeIndexingReindexToNWorkspaceMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 53 | WAVE4_EXISTING | Knowledge | Knowledge Indexing | `GET` | `/api/v1/knowledge/indexing/jobs/{jobId}` | Lấy job status | W41-DOC-14 / W41-SET-02 | IndexingStatusPanel / ReindexDialog | `UI_READ` | `useKnowledgeIndexingLYJobStatusQuery` | None | MAPPED — REUSE/EXTEND | — |
| 54 | WAVE4_EXISTING | Knowledge | Knowledge Retrieval | `POST` | `/api/v1/knowledge/retrieval/search` | Semantic search (headers: `X-Workspace-Id`, `X-Actor-Id`, `X-Acl-Tokens`) | W41-DOC-01 / W41-DOC-13 | DocumentSemanticSearch / AiContextSearch | `UI_ACTION` | `useKnowledgeRetrievalSemanticSearchHeadersXWorkspaceIdXActorIdXAclTokensMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 55 | WAVE4_EXISTING | Governance | Governed Object Types (catalog) | `GET` | `/api/v1/governance/object-types` | Danh sách loại object có thể govern | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | GovernanceCapabilityLoader | `UI_READ` | `useGovernedObjectTypesCatalogDanhSChLoIObjectCThGovernQuery` | None | MAPPED — REUSE/EXTEND | — |
| 56 | WAVE4_EXISTING | Governance | Governed Object Types (catalog) | `GET` | `/api/v1/governance/object-types/{objectTypeCode}` | Lấy theo code | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | GovernanceCapabilityLoader | `UI_READ` | `useGovernedObjectTypesCatalogLYTheoCodeQuery` | None | MAPPED — REUSE/EXTEND | — |
| 57 | WAVE4_EXISTING | Governance | Governance Policy (workspace-level) | `GET` | `/api/v1/workspaces/{workspaceId}/governance/policies` | Danh sách policies | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentGovernancePolicyPanel | `UI_READ` | `useGovernancePolicyWorkspaceLevelDanhSChPoliciesQuery` | None | MAPPED — REUSE/EXTEND | — |
| 58 | WAVE4_EXISTING | Governance | Governance Policy (workspace-level) | `PUT` | `/api/v1/workspaces/{workspaceId}/governance/policies` | Upsert policy | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentGovernancePolicyPanel | `UI_ACTION` | `useGovernancePolicyWorkspaceLevelUpsertPolicyMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 59 | WAVE4_EXISTING | Governance | Ownership | `POST` | `/api/v1/projects/{projectId}/governance/ownership/assign` | Gán owner | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentOwnershipPanel | `UI_ACTION` | `useOwnershipGNOwnerMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 60 | WAVE4_EXISTING | Governance | Ownership | `POST` | `/api/v1/projects/{projectId}/governance/ownership/transfer` | Chuyển owner | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentOwnershipPanel | `UI_ACTION` | `useOwnershipChuyNOwnerMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 61 | WAVE4_EXISTING | Governance | Ownership | `POST` | `/api/v1/projects/{projectId}/governance/ownership/revoke` | Thu hồi (`?objectTypeCode=&targetId=`) | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentOwnershipPanel | `UI_ACTION` | `useOwnershipThuHIObjecttypecodeTargetidMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 62 | WAVE4_EXISTING | Governance | Ownership | `GET` | `/api/v1/projects/{projectId}/governance/ownership?objectTypeCode=&targetId=` | Lấy ownership hiện tại | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentOwnershipPanel | `UI_READ` | `useOwnershipLYOwnershipHiNTIQuery` | None | MAPPED — REUSE/EXTEND | — |
| 63 | WAVE4_EXISTING | Governance | Ownership | `GET` | `/api/v1/projects/{projectId}/governance/ownership/list` | Danh sách tất cả ownership trong project | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentOwnershipPanel | `UI_READ` | `useOwnershipDanhSChTTCOwnershipTrongProjectQuery` | None | MAPPED — REUSE/EXTEND | — |
| 64 | WAVE4_EXISTING | Governance | Locks & Finalization | `POST` | `/api/v1/projects/{projectId}/governance/locks` | Tạo lock thủ công | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentLockBanner / LifecycleActionMenu | `UI_ACTION` | `useLocksFinalizationTOLockThCNgMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 65 | WAVE4_EXISTING | Governance | Locks & Finalization | `POST` | `/api/v1/projects/{projectId}/governance/locks/{lockId}/release` | Mở lock | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentLockBanner / LifecycleActionMenu | `UI_ACTION` | `useLocksFinalizationMLockMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 66 | WAVE4_EXISTING | Governance | Locks & Finalization | `POST` | `/api/v1/projects/{projectId}/governance/locks/{objectTypeCode}/{targetId}/finalize` | Finalize object (body: `reason`) | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentLockBanner / LifecycleActionMenu | `UI_ACTION` | `useLocksFinalizationFinalizeObjectBodyReasonMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 67 | WAVE4_EXISTING | Governance | Locks & Finalization | `POST` | `/api/v1/projects/{projectId}/governance/locks/{objectTypeCode}/{targetId}/unfinalize` | Unfinalize | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentLockBanner / LifecycleActionMenu | `UI_ACTION` | `useLocksFinalizationUnfinalizeMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 68 | WAVE4_EXISTING | Governance | Access Grants | `POST` | `/api/v1/projects/{projectId}/access-grants` | Cấp quyền truy cập object | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentAccessPanel | `UI_ACTION` | `useAccessGrantsCPQuyNTruyCPObjectMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 69 | WAVE4_EXISTING | Governance | Access Grants | `GET` | `/api/v1/projects/{projectId}/access-grants?objectTypeCode=&targetId=` | Danh sách | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentAccessPanel | `UI_READ` | `useAccessGrantsDanhSChQuery` | None | MAPPED — REUSE/EXTEND | — |
| 70 | WAVE4_EXISTING | Governance | Access Grants | `POST` | `/api/v1/projects/{projectId}/access-grants/{grantId}/revoke` | Thu hồi | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentAccessPanel | `UI_ACTION` | `useAccessGrantsThuHIMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 71 | WAVE4_EXISTING | Governance | Versioning & Snapshots | `POST` | `/api/v1/projects/{projectId}/governance/versions` | Tạo version snapshot | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | GovernanceHistoryPanel / RestoreDialog | `UI_ACTION` | `useVersioningSnapshotsTOVersionSnapshotMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 72 | WAVE4_EXISTING | Governance | Versioning & Snapshots | `GET` | `/api/v1/projects/{projectId}/governance/versions?objectTypeCode=&targetId=` | Danh sách versions | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | GovernanceHistoryPanel / RestoreDialog | `UI_READ` | `useVersioningSnapshotsDanhSChVersionsQuery` | None | MAPPED — REUSE/EXTEND | — |
| 73 | WAVE4_EXISTING | Governance | Versioning & Snapshots | `GET` | `/api/v1/projects/{projectId}/governance/snapshots/{snapshotId}` | Lấy snapshot JSON | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | GovernanceHistoryPanel / RestoreDialog | `UI_READ` | `useVersioningSnapshotsLYSnapshotJsonQuery` | None | MAPPED — REUSE/EXTEND | — |
| 74 | WAVE4_EXISTING | Governance | Versioning & Snapshots | `GET` | `/api/v1/projects/{projectId}/governance/snapshots/diff?leftSnapshotId=&rightSnapshotId=` | So sánh 2 snapshots | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | GovernanceHistoryPanel / RestoreDialog | `UI_READ` | `useVersioningSnapshotsSoSNh2SnapshotsQuery` | None | MAPPED — REUSE/EXTEND | — |
| 75 | WAVE4_EXISTING | Governance | Versioning & Snapshots | `POST` | `/api/v1/projects/{projectId}/governance/restore` | Khôi phục từ version | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | GovernanceHistoryPanel / RestoreDialog | `UI_ACTION` | `useVersioningSnapshotsKhIPhCTVersionMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 76 | WAVE4_EXISTING | Governance | Versioning & Snapshots | `POST` | `/api/v1/projects/{projectId}/governance/baseline-guard/check` | Kiểm tra có được phép thay đổi không | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | GovernanceHistoryPanel / RestoreDialog | `UI_ACTION` | `useVersioningSnapshotsKiMTraCCPhPThayIKhNgMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 77 | WAVE4_EXISTING | Governance | Governance Reports | `GET` | `/api/v1/projects/{projectId}/reports/pack` | Report tổng hợp (ownership + locks + access grants) | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentGovernanceInspector | `UI_READ` | `useGovernanceReportsReportTNgHPOwnershipLocksAccessGrantsQuery` | None | MAPPED — REUSE/EXTEND | — |
| 78 | WAVE4_EXISTING | Governance | Governance Reports | `GET` | `/api/v1/projects/{projectId}/reports/ownership` | Ownership report | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentGovernanceInspector | `UI_READ` | `useGovernanceReportsOwnershipReportQuery` | None | MAPPED — REUSE/EXTEND | — |
| 79 | WAVE4_EXISTING | Governance | Governance Reports | `GET` | `/api/v1/projects/{projectId}/reports/access-grants` | Access grant report | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentGovernanceInspector | `UI_READ` | `useGovernanceReportsAccessGrantReportQuery` | None | MAPPED — REUSE/EXTEND | — |
| 80 | WAVE4_EXISTING | Governance | Governance Reports | `GET` | `/api/v1/projects/{projectId}/reports/version-history` | Version history report | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentGovernanceInspector | `UI_READ` | `useGovernanceReportsVersionHistoryReportQuery` | None | MAPPED — REUSE/EXTEND | — |
| 81 | WAVE4_EXISTING | Governance | Governance Reports | `GET` | `/api/v1/projects/{projectId}/reports/locked-objects` | Locked objects report | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentGovernanceInspector | `UI_READ` | `useGovernanceReportsLockedObjectsReportQuery` | None | MAPPED — REUSE/EXTEND | — |
| 82 | WAVE4_EXISTING | Governance | Governance Reports | `GET` | `/api/v1/projects/{projectId}/reports/restore-activity` | Restore activity report | W41-DOC-03 / W41-DOC-11 / W41-DOC-16 | DocumentGovernanceInspector | `UI_READ` | `useGovernanceReportsRestoreActivityReportQuery` | None | MAPPED — REUSE/EXTEND | — |
| 83 | WAVE4_EXISTING | AI Assistant | Conversations | `POST` | `/api/v1/ai-assistant/conversations` | Tạo conversation mới | W41-DOC-13 / Existing AI Assistant | AiConversationSelector | `UI_ACTION` | `useConversationsTOConversationMIMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 84 | WAVE4_EXISTING | AI Assistant | Conversations | `GET` | `/api/v1/ai-assistant/conversations?page=&size=` | Danh sách (paginated) | W41-DOC-13 / Existing AI Assistant | AiConversationSelector | `UI_READ` | `useConversationsDanhSChPaginatedQuery` | None | MAPPED — REUSE/EXTEND | — |
| 85 | WAVE4_EXISTING | AI Assistant | Conversations | `GET` | `/api/v1/ai-assistant/conversations/{id}` | Lấy theo ID | W41-DOC-13 / Existing AI Assistant | AiConversationSelector | `UI_READ` | `useConversationsLYTheoIdQuery` | None | MAPPED — REUSE/EXTEND | — |
| 86 | WAVE4_EXISTING | AI Assistant | Conversations | `PATCH` | `/api/v1/ai-assistant/conversations/{id}/title` | Đổi tiêu đề | W41-DOC-13 / Existing AI Assistant | AiConversationSelector | `UI_ACTION` | `useConversationsITiUMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 87 | WAVE4_EXISTING | AI Assistant | Conversations | `DELETE` | `/api/v1/ai-assistant/conversations/{id}` | Xoá (204) | W41-DOC-13 / Existing AI Assistant | AiConversationSelector | `UI_ACTION` | `useConversationsXo204Mutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 88 | WAVE4_EXISTING | AI Assistant | Conversations | `POST` | `/api/v1/ai-assistant/conversations/{id}/archive` | Lưu trữ | W41-DOC-13 / Existing AI Assistant | AiConversationSelector | `UI_ACTION` | `useConversationsLUTrMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 89 | WAVE4_EXISTING | AI Assistant | Messages | `POST` | `/api/v1/ai-assistant/conversations/{conversationId}/messages` | Gửi message (trả SSE start info) | W41-DOC-13 / Existing AI Assistant | DocumentAiPanel / AiStreamingMessage | `UI_ACTION` | `useMessagesGIMessageTrSseStartInfoMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 90 | WAVE4_EXISTING | AI Assistant | Messages | `GET` | `/api/v1/ai-assistant/conversations/{conversationId}/messages?page=&size=` | Danh sách messages | W41-DOC-13 / Existing AI Assistant | DocumentAiPanel / AiStreamingMessage | `UI_READ` | `useMessagesDanhSChMessagesQuery` | None | MAPPED — REUSE/EXTEND | — |
| 91 | WAVE4_EXISTING | AI Assistant | Messages | `GET` | `/api/v1/ai-assistant/messages/{messageId}` | Lấy message theo ID | W41-DOC-13 / Existing AI Assistant | DocumentAiPanel / AiStreamingMessage | `UI_READ` | `useMessagesLYMessageTheoIdQuery` | None | MAPPED — REUSE/EXTEND | — |
| 92 | WAVE4_EXISTING | AI Assistant | Messages | `GET` | `/api/v1/ai-assistant/messages/{messageId}/stream` | **SSE stream** (produces `text/event-stream`) | W41-DOC-13 / Existing AI Assistant | DocumentAiPanel / AiStreamingMessage | `UI_READ` | `useMessagesSseStreamProducesTextEventStreamQuery` | None | MAPPED — REUSE/EXTEND | — |
| 93 | WAVE4_EXISTING | AI Assistant | Messages | `POST` | `/api/v1/ai-assistant/messages/{messageId}/cancel` | Huỷ streaming | W41-DOC-13 / Existing AI Assistant | DocumentAiPanel / AiStreamingMessage | `UI_ACTION` | `useMessagesHuStreamingMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 94 | WAVE4_EXISTING | AI Assistant | Guides | `POST` | `/api/v1/ai-assistant/guides/explain-page` | Giải thích ngữ cảnh của trang hiện tại | W41-DOC-13 / Existing AI Assistant | DocumentHelpActions | `UI_ACTION` | `useGuidesGiIThChNgCNhCATrangHiNTIMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 95 | WAVE4_EXISTING | AI Assistant | Guides | `POST` | `/api/v1/ai-assistant/guides/explain-field` | Giải thích ý nghĩa của một field | W41-DOC-13 / Existing AI Assistant | DocumentHelpActions | `UI_ACTION` | `useGuidesGiIThChNghACAMTFieldMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 96 | WAVE4_EXISTING | AI Assistant | Guides | `POST` | `/api/v1/ai-assistant/guides/explain-disabled-action` | Giải thích tại sao action bị disabled | W41-DOC-13 / Existing AI Assistant | DocumentHelpActions | `UI_ACTION` | `useGuidesGiIThChTISaoActionBDisabledMutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 97 | WAVE4_EXISTING | AI Assistant | Guides | `GET` | `/api/v1/ai-assistant/guides/suggested-questions?pageCode=&entityType=&locale=` | Lấy suggested questions | W41-DOC-13 / Existing AI Assistant | DocumentHelpActions | `UI_READ` | `useGuidesLYSuggestedQuestionsQuery` | None | MAPPED — REUSE/EXTEND | — |
| 98 | WAVE4_EXISTING | AI Assistant | Feedback | `POST` | `/api/v1/ai-assistant/feedbacks` | Gửi feedback (201) | W41-DOC-13 / Existing AI Assistant | AiFeedbackActions | `UI_ACTION` | `useFeedbackGIFeedback201Mutation` | Document detail/list + dependent panels | MAPPED — REUSE/EXTEND | — |
| 99 | DOCUMENT_HUB_BE | DocumentHub | Metadata | `PUT` | `/api/v1/projects/{projectId}/documents/{documentId}` | Cập nhật metadata, folder, type, classification và custom fields | W41-DOC-03 | DocumentInspector / EditMetadataDrawer | `UI_ACTION` | `useUpdateDocumentMutation` | document, document-list, search, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 100 | DOCUMENT_HUB_BE | DocumentHub | Lifecycle | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/archive` | Archive document | W41-DOC-03 / W41-DOC-01 | LifecycleActionMenu / ArchiveDocumentDialog | `UI_ACTION` | `useArchiveDocumentMutation` | document, list, search, recent, favorites, activity, knowledge-status | MAPPED — IMPLEMENTATION REQUIRED | — |
| 101 | DOCUMENT_HUB_BE | DocumentHub | Lifecycle | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/restore` | Restore archived document | W41-DOC-03 / W41-DOC-01 | LifecycleActionMenu / RestoreDocumentDialog | `UI_ACTION` | `useRestoreDocumentMutation` | document, list, search, activity, knowledge-status | MAPPED — IMPLEMENTATION REQUIRED | — |
| 102 | DOCUMENT_HUB_BE | DocumentHub | Native Draft | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/draft` | Lấy native draft hiện tại | W41-DOC-04 | DocumentEditorLoader | `UI_READ` | `useDocumentDraftQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 103 | DOCUMENT_HUB_BE | DocumentHub | Native Draft | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/draft` | Tạo draft rỗng hoặc từ content version | W41-DOC-04 | CreateDraftDialog / EditorBootstrap | `UI_ACTION` | `useCreateDocumentDraftMutation` | document-draft, document-header, mention-projection | MAPPED — IMPLEMENTATION REQUIRED | — |
| 104 | DOCUMENT_HUB_BE | DocumentHub | Native Draft | `PUT` | `/api/v1/projects/{projectId}/documents/{documentId}/draft` | Save/autosave native draft bằng optimistic locking | W41-DOC-04 | DocumentAutosaveController | `UI_ACTION` | `useSaveDocumentDraftMutation` | document-draft, document-header, mention-projection | MAPPED — IMPLEMENTATION REQUIRED | — |
| 105 | DOCUMENT_HUB_BE | DocumentHub | Native Draft | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/draft/validate` | Validate và normalize AST mà không lưu | W41-DOC-04 | DocumentValidationPanel | `UI_ACTION` | `useValidateDocumentDraftMutation` | document-draft, document-header, mention-projection | MAPPED — IMPLEMENTATION REQUIRED | — |
| 106 | DOCUMENT_HUB_BE | DocumentHub | Content Versions | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/content-versions` | Tạo immutable content snapshot từ draft | W41-DOC-10 | CreateVersionDialog | `UI_ACTION` | `useCreateContentVersionMutation` | content-versions, document, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 107 | DOCUMENT_HUB_BE | DocumentHub | Content Versions | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/content-versions?page=&size=` | Danh sách immutable content versions | W41-DOC-10 | ContentVersionHistoryPanel | `UI_READ` | `useContentVersionsQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 108 | DOCUMENT_HUB_BE | DocumentHub | Content Versions | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/content-versions/{contentVersionId}` | Lấy content version chi tiết | W41-DOC-10 | ContentVersionViewer | `UI_READ` | `useContentVersionQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 109 | DOCUMENT_HUB_BE | DocumentHub | Review & Publish | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/submit-review` | Submit content version để review | W41-DOC-11 | SubmitReviewDialog | `UI_ACTION` | `useSubmitDocumentReviewMutation` | document, draft, content-versions, lifecycle, activity, knowledge-indexing | MAPPED — IMPLEMENTATION REQUIRED | — |
| 110 | DOCUMENT_HUB_BE | DocumentHub | Review & Publish | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/content-versions/{contentVersionId}/approve` | Approve content version | W41-DOC-11 | ReviewDecisionBar | `UI_ACTION` | `useApproveContentVersionMutation` | document, draft, content-versions, lifecycle, activity, knowledge-indexing | MAPPED — IMPLEMENTATION REQUIRED | — |
| 111 | DOCUMENT_HUB_BE | DocumentHub | Review & Publish | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/content-versions/{contentVersionId}/reject` | Reject content version | W41-DOC-11 | RejectReviewDialog | `UI_ACTION` | `useRejectContentVersionMutation` | document, draft, content-versions, lifecycle, activity, knowledge-indexing | MAPPED — IMPLEMENTATION REQUIRED | — |
| 112 | DOCUMENT_HUB_BE | DocumentHub | Review & Publish | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/content-versions/{contentVersionId}/publish` | Publish immutable content version | W41-DOC-11 | PublishDocumentDialog | `UI_ACTION` | `usePublishContentVersionMutation` | document, draft, content-versions, lifecycle, activity, knowledge-indexing | MAPPED — IMPLEMENTATION REQUIRED | — |
| 113 | DOCUMENT_HUB_BE | DocumentHub | Relations | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/relations` | Tạo relation tới resource khác | W41-DOC-15 | AddDocumentRelationDialog | `UI_ACTION` | `useCreateDocumentRelationMutation` | document-relations, knowledge-graph, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 114 | DOCUMENT_HUB_BE | DocumentHub | Relations | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/relations` | Danh sách incoming/outgoing relations | W41-DOC-15 | DocumentRelationsPanel | `UI_READ` | `useDocumentRelationsQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 115 | DOCUMENT_HUB_BE | DocumentHub | Relations | `DELETE` | `/api/v1/projects/{projectId}/documents/{documentId}/relations/{relationId}` | Xóa relation | W41-DOC-15 | RelationRowAction | `UI_ACTION` | `useDeleteDocumentRelationMutation` | document-relations, knowledge-graph, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 116 | DOCUMENT_HUB_BE | DocumentHub | Mentions | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/mention-candidates?q=&resourceTypes=&page=&size=&includeArchived=false&purpose=EDITOR` | Tìm resource mention candidate đã lọc quyền | W41-DOC-07 | ResourceMentionPicker | `UI_READ` | `useDocumentMentionCandidatesQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 117 | DOCUMENT_HUB_BE | DocumentHub | Mentions | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/mentions/resolve` | Resolve mention cho render hoặc AI context manifest | W41-DOC-07 / W41-DOC-13 | MentionHydrator / AiContextManifestPreview | `UI_ACTION` | `useResolveDocumentMentionsMutation` | mention-resolution-cache | MAPPED — IMPLEMENTATION REQUIRED | — |
| 118 | DOCUMENT_HUB_BE | DocumentHub | AI Context | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/ai-context-preview` | Preview resource/context AI sẽ sử dụng | W41-DOC-13 | AiContextPreviewDrawer | `UI_ACTION` | `useDocumentAiContextPreviewMutation` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 119 | DOCUMENT_HUB_BE | DocumentHub | Published Content | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/published-content` | Lấy published content với ETag | W41-DOC-03 / W41-DOC-11 | PublishedDocumentViewer | `UI_READ` | `usePublishedDocumentContentQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 120 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/content` | Lấy canonical editable content | W41-DOC-04 | DocumentEditorLoader | `UI_READ` | `useDocumentContentQuery` | None | CONTRACT_RECONCILIATION_REQUIRED | W41-GAP-API-01 |
| 121 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `PUT` | `/api/v1/projects/{projectId}/documents/{documentId}/content` | Lưu canonical editable content | W41-DOC-04 | DocumentAutosaveController | `UI_ACTION` | `useSaveDocumentContentMutation` | document content, revisions, mentions, activity | CONTRACT_RECONCILIATION_REQUIRED | W41-GAP-API-01 |
| 122 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/revisions` | Danh sách revisions | W41-DOC-10 | RevisionHistoryPanel | `UI_READ` | `useDocumentRevisionsQuery` | None | CONTRACT_RECONCILIATION_REQUIRED | W41-GAP-API-01 |
| 123 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/revisions/{revisionId}` | Lấy revision | W41-DOC-10 | RevisionViewer | `UI_READ` | `useDocumentRevisionQuery` | None | CONTRACT_RECONCILIATION_REQUIRED | W41-GAP-API-01 |
| 124 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/revisions/diff?leftRevisionId=&rightRevisionId=` | So sánh revisions | W41-DOC-10 | RevisionDiffViewer | `UI_READ` | `useDocumentRevisionDiffQuery` | None | CONTRACT_RECONCILIATION_REQUIRED | W41-GAP-API-01 |
| 125 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/revisions` | Tạo manual revision | W41-DOC-10 | CreateRevisionDialog | `UI_ACTION` | `useCreateDocumentRevisionMutation` | document content, revisions, mentions, activity | CONTRACT_RECONCILIATION_REQUIRED | W41-GAP-API-01 |
| 126 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/revisions/{revisionId}/restore` | Restore revision thành revision mới | W41-DOC-10 | RestoreRevisionDialog | `UI_ACTION` | `useRestoreDocumentRevisionMutation` | document content, revisions, mentions, activity | CONTRACT_RECONCILIATION_REQUIRED | W41-GAP-API-01 |
| 127 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/subpages` | Tạo sub-page | W41-DOC-06 | CreateSubpageDialog | `UI_ACTION` | `useCreateDocumentSubpageMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 128 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/subpages` | Danh sách sub-pages | W41-DOC-06 | DocumentPageTree | `UI_READ` | `useDocumentSubpagesQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 129 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/move` | Move document/sub-page | W41-DOC-01 / W41-DOC-06 | MoveDocumentDialog | `UI_ACTION` | `useMoveDocumentMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 130 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/comment-threads` | Tạo comment thread | W41-DOC-08 | CommentComposer | `UI_ACTION` | `useCreateDocumentCommentThreadMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 131 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/comment-threads` | Danh sách comment threads | W41-DOC-08 | CommentSidebar | `UI_READ` | `useDocumentCommentThreadsQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 132 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/document-comments/{commentId}/replies` | Reply comment | W41-DOC-08 | CommentReplyComposer | `UI_ACTION` | `useReplyDocumentCommentMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 133 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `PUT` | `/api/v1/document-comments/{commentId}` | Sửa comment | W41-DOC-08 | EditCommentComposer | `UI_ACTION` | `useUpdateDocumentCommentMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 134 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `DELETE` | `/api/v1/document-comments/{commentId}` | Soft-delete comment | W41-DOC-08 | CommentRowMenu | `UI_ACTION` | `useDeleteDocumentCommentMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 135 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/document-comment-threads/{threadId}/resolve` | Resolve thread | W41-DOC-08 | ResolveCommentThreadButton | `UI_ACTION` | `useResolveCommentThreadMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 136 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/document-comment-threads/{threadId}/reopen` | Reopen thread | W41-DOC-08 | ReopenCommentThreadButton | `UI_ACTION` | `useReopenCommentThreadMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 137 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/suggestions` | Tạo suggestion | W41-DOC-09 | SuggestionComposer | `UI_ACTION` | `useCreateDocumentSuggestionMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 138 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/projects/{projectId}/documents/{documentId}/suggestions` | Danh sách suggestions | W41-DOC-09 | SuggestionSidebar | `UI_READ` | `useDocumentSuggestionsQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 139 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/document-suggestions/{suggestionId}` | Lấy suggestion detail | W41-DOC-09 | SuggestionDiffCard | `UI_READ` | `useDocumentSuggestionQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 140 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/document-suggestions/{suggestionId}/accept` | Accept suggestion | W41-DOC-09 | AcceptSuggestionButton | `UI_ACTION` | `useAcceptDocumentSuggestionMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 141 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/document-suggestions/{suggestionId}/reject` | Reject suggestion | W41-DOC-09 | RejectSuggestionButton | `UI_ACTION` | `useRejectDocumentSuggestionMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 142 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/resource-mentions/types` | Danh sách resource type có thể mention | W41-DOC-07 | MentionTypeFilter | `UI_READ` | `useResourceMentionTypesQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 143 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/resource-mentions/search` | Search mention resource | W41-DOC-07 | ResourceMentionPicker | `UI_READ` | `useResourceMentionSearchQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 144 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/resource-mentions/resolve` | Batch resolve mentions | W41-DOC-07 | MentionHydrator | `UI_ACTION` | `useResolveResourceMentionsMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 145 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/resource-mentions/validate` | Validate mentions trước save/publish | W41-DOC-07 / W41-DOC-16 | MentionValidationPanel | `UI_ACTION` | `useValidateResourceMentionsMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 146 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/validate-client-visibility` | Kiểm tra document có an toàn cho client/portal | W41-DOC-16 | ClientVisibilityValidationDrawer | `UI_ACTION` | `useValidateDocumentClientVisibilityMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 147 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/workspaces/{workspaceId}/document-templates/{templateId}/versions` | Tạo native template version | W41-TPL-02 | TemplateVersionEditor | `UI_ACTION` | `useCreateDocumentTemplateVersionMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 148 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/workspaces/{workspaceId}/document-templates/{templateId}/versions` | Danh sách template versions | W41-TPL-02 | TemplateVersionHistory | `UI_READ` | `useDocumentTemplateVersionsQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 149 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/workspaces/{workspaceId}/document-templates/{templateId}/versions/{versionId}` | Lấy template version | W41-TPL-02 | TemplateVersionEditor | `UI_READ` | `useDocumentTemplateVersionQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 150 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `PUT` | `/api/v1/workspaces/{workspaceId}/document-templates/{templateId}/versions/{versionId}` | Cập nhật draft template version | W41-TPL-02 | TemplateVersionEditor | `UI_ACTION` | `useUpdateDocumentTemplateVersionMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 151 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/workspaces/{workspaceId}/document-templates/{templateId}/versions/{versionId}/publish` | Publish template version | W41-TPL-02 | PublishTemplateVersionDialog | `UI_ACTION` | `usePublishDocumentTemplateVersionMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 152 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/projects/{projectId}/documents/from-template` | Tạo document từ published template | W41-DOC-02 | CreateFromTemplateWizard | `UI_ACTION` | `useCreateDocumentFromTemplateMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 153 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/projects/{projectId}/documents/{documentId}/synced-blocks` | Tạo synced block từ block hiện tại | W41-DOC-12 | CreateSyncedBlockDialog | `UI_ACTION` | `useCreateSyncedBlockMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 154 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/synced-blocks/{syncedBlockId}` | Lấy synced block metadata | W41-DOC-12 | SyncedBlockInspector | `UI_READ` | `useSyncedBlockQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 155 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/synced-blocks/{syncedBlockId}/content` | Lấy synced block content | W41-DOC-12 | SyncedBlockRenderer | `UI_READ` | `useSyncedBlockContentQuery` | None | CONTRACT_RECONCILIATION_REQUIRED | W41-GAP-API-01 |
| 156 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/synced-blocks/{syncedBlockId}/snapshot` | Chuyển/copy synced block thành snapshot | W41-DOC-12 | SnapshotSyncedBlockButton | `UI_ACTION` | `useSnapshotSyncedBlockMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 157 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `PATCH` | `/api/v1/synced-blocks/{syncedBlockId}/archive` | Archive synced block | W41-DOC-12 | ArchiveSyncedBlockDialog | `UI_ACTION` | `useArchiveSyncedBlockMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 158 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/smart-blocks/types` | Danh sách Smart Block types | W41-DOC-12 | SmartBlockPicker | `UI_READ` | `useSmartBlockTypesQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |
| 159 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/smart-blocks/preview` | Preview Smart Block configuration | W41-DOC-12 | SmartBlockConfigDialog | `UI_ACTION` | `usePreviewSmartBlockMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 160 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/smart-blocks/resolve` | Resolve LIVE Smart Block | W41-DOC-12 | SmartBlockRenderer | `UI_ACTION` | `useResolveSmartBlockMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 161 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/smart-blocks/snapshot` | Tạo sanitized Smart Block snapshot | W41-DOC-12 | SnapshotSmartBlockButton | `UI_ACTION` | `useSnapshotSmartBlockMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 162 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `POST` | `/api/v1/ai-assistant/context/resolve` | Resolve document + tagged resource context cho AI | W41-DOC-13 | DocumentAiPanel | `UI_ACTION` | `useResolveAiDocumentContextMutation` | document content, revisions, mentions, activity | MAPPED — IMPLEMENTATION REQUIRED | — |
| 163 | NATIVE_EDITOR_BE | DocumentHub | Native Editor Extension | `GET` | `/api/v1/ai-assistant/messages/{messageId}/citations` | Lấy citations của AI message | W41-DOC-13 | AiCitationList | `UI_READ` | `useAiMessageCitationsQuery` | None | MAPPED — IMPLEMENTATION REQUIRED | — |

---

# 38. Coding Agent Prompt

```text
You are implementing Scopery Wave 4.1 — Document Hub Content UI.

Read first:
- CLAUDE.md / CLAUDE.ms
- Coding_convention.md
- WAVE4_API_CONTRACT.md
- SCOPERY_WAVE4_UI_UX_API_PAGE_MAPPING_AND_IMPLEMENTATION_SPEC_V3.md
- DOCUMENT_HUB_BACKEND_FUNCTIONAL_SPEC.md
- SCOPERY_NATIVE_DOCUMENT_EDITOR_BE_FUNCTIONAL_SPEC.md
- Current frontend routes, API clients, permissions, query keys and tests
- Current backend OpenAPI

Tasks:
1. Treat Wave 4.1 as an incremental extension; do not rewrite unrelated Wave 4 modules.
2. Snapshot OpenAPI and reconcile every row in the Wave 4.1 coverage register.
3. Resolve /draft vs /content and /content-versions vs /revisions before component coding.
4. Implement DocumentContentGateway so UI components are not coupled to duplicate transport contracts.
5. Extend Document Hub create flow for NATIVE, FILE and HYBRID.
6. Implement native editor, formatting, supported blocks and Simple Table.
7. Do not implement Notion Database Table or spreadsheet features.
8. Implement autosave, optimistic concurrency and conflict recovery without force overwrite.
9. Implement attachments through presigned upload/complete flow.
10. Implement sub-pages, relations, comments, suggestions, revisions and restore.
11. Implement review, approval and publish with immutable published content.
12. Implement permission-filtered structured @mentions.
13. Implement synced blocks and Smart Blocks only with typed backend contracts.
14. Implement AI context preview, SSE writing flow, suggestions and citations.
15. Implement client visibility validation before client share/publish.
16. Integrate knowledge source/indexing state without claiming queued content is indexed.
17. Reuse governance and access APIs in the document inspector.
18. Never call service-orchestrated worker endpoints from browser.
19. Add unit, component and E2E tests.
20. Update every endpoint status to UI_TESTED or an approved exception.
21. Create WAVE_4_1_DOCUMENT_HUB_CONTENT_UI_COMPLETE.md with network and test evidence.

Do not mark Wave 4.1 complete while:
- an endpoint is unmapped;
- a user-facing endpoint is untested;
- mock data replaces required API data;
- mention permission is frontend-only;
- AI uses service permissions wider than the actor;
- a published version can be edited;
- a conflict can overwrite another user's changes;
- a worker-only endpoint is called by the browser;
- client-visible output can leak internal resources;
- Database Table features are implemented outside scope.
```
