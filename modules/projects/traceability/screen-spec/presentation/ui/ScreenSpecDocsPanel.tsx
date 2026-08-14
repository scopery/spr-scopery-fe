'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, CircleHelp, MoreHorizontal, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  AnchoredMenu,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Input,
  Modal,
  PageSkeleton,
  SearchableSelect,
  Select,
  Stack,
  Textarea,
  Typography,
  anchoredMenuItemClassName,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { SCREEN_SPEC_EXCEL_SHEETS } from '../../domain/rules/screen-spec-excel.rules'
import type { UpdateScreenSpecDocBody } from '../../domain/model/screen-spec-doc'
import { useScreenSpecDocs } from '../hooks/useScreenSpecDocs'
import { useScreenSpecDocDetail } from '../hooks/useScreenSpecDocDetail'
import { useScreenSpecExcelExport } from '../hooks/useScreenSpecExcelExport'
import { SPEC_DOC_WORKFLOW_NOTE, SPEC_DOC_WORKFLOW_STEPS } from './ScreenSpecHowTo'

const SHEET_OPTIONS = Object.values(SCREEN_SPEC_EXCEL_SHEETS).map((name) => ({
  value: name,
  label: name,
}))

const LANGUAGE_OPTIONS = [
  { value: 'EN', label: 'EN' },
  { value: 'JA', label: 'JA' },
]

const EMPTY_REVISION = {
  revisionNo: '',
  targetSheetName: SCREEN_SPEC_EXCEL_SHEETS.defines as string,
  details: '',
  personInCharge: '',
  changedAt: '',
}

interface CatalogScreen {
  id: string
  code: string
  name: string
}

function FieldControl({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <span className="text-sm font-normal text-neutral-700">{label}</span>
      {children}
    </div>
  )
}

function languageOptions(current: string | null | undefined) {
  const value = (current ?? 'EN').trim() || 'EN'
  if (LANGUAGE_OPTIONS.some((o) => o.value === value)) return LANGUAGE_OPTIONS
  return [...LANGUAGE_OPTIONS, { value, label: value }]
}

export function ScreenSpecDocsPanel({
  workspaceId,
  screens,
}: {
  workspaceId: string
  screens: CatalogScreen[]
}) {
  const { items, projects, loading, error, createDoc, removeDoc } = useScreenSpecDocs(workspaceId)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({
    projectId: '',
    documentCode: '',
    documentName: '',
    language: 'EN',
  })

  const projectOptions = useMemo(
    () => [
      { value: '', label: projects.length === 0 ? 'No projects in this workspace' : 'Select project…' },
      ...projects.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
    ],
    [projects]
  )

  const openCreate = () => {
    setDraft({
      projectId: projects.length === 1 ? projects[0].id : '',
      documentCode: '',
      documentName: '',
      language: 'EN',
    })
    setCreateOpen(true)
  }

  const handleCreate = async () => {
    const project = projects.find((p) => p.id === draft.projectId)
    if (!project) {
      toast.error('Select a project')
      return
    }
    setCreating(true)
    try {
      const created = await createDoc({
        projectId: project.id,
        documentCode: draft.documentCode.trim(),
        documentName: draft.documentName.trim(),
        projectName: project.name,
        language: draft.language.trim() || 'EN',
      })
      setDraft({ projectId: '', documentCode: '', documentName: '', language: 'EN' })
      setCreateOpen(false)
      if (created) setSelectedId(created.id)
      toast.success('Spec document created')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(220px,280px)_minmax(0,1fr)] overflow-hidden border border-neutral-200 bg-white">
      <aside className="flex min-h-0 flex-col overflow-hidden border-r border-neutral-200">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2">
          <Typography weight="medium" variant="small">
            Spec documents
          </Typography>
          <div className="flex items-center">
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              icon={<Plus size={16} strokeWidth={1.75} />}
              aria-label="Create spec document"
              onClick={openCreate}
            />
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              icon={<CircleHelp size={16} strokeWidth={1.75} />}
              aria-label="How to use spec documents"
              onClick={() => setGuideOpen(true)}
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading && items.length === 0 ? <PageSkeleton variant="list" /> : null}
          {error ? (
            <Typography tone="error" variant="small" className="p-3">
              {error}
            </Typography>
          ) : null}
          {items.length === 0 && !loading ? (
            <Typography tone="muted" variant="small" className="p-3">
              {projects.length === 0
                ? 'Create a project in this workspace first. Spec documents require a project.'
                : 'No spec documents yet. Use + to create one.'}
            </Typography>
          ) : null}
          <ul>
            {items.map((doc) => {
              const active = doc.id === selectedId
              return (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(doc.id)}
                    className={`w-full border-b border-neutral-100 px-3 py-2 text-left text-sm ${
                      active ? 'bg-primary/5 text-primary' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="font-medium">{doc.documentCode}</div>
                    <div className="text-neutral-600">{doc.documentName}</div>
                    {doc.projectName ? (
                      <div className="text-xs text-neutral-500">{doc.projectName}</div>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>

      <div className="min-h-0 overflow-y-auto p-4">
        {selectedId ? (
          <ScreenSpecDocEditor
            workspaceId={workspaceId}
            docId={selectedId}
            screens={screens}
            onDeleted={async () => {
              await removeDoc(selectedId)
              setSelectedId(null)
            }}
          />
        ) : (
          <Typography tone="muted" variant="small">
            Select a document on the left, or create one with +.
          </Typography>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create spec document"
        size="sm"
        actions={[
          { label: 'Cancel', onClick: () => setCreateOpen(false), variant: 'ghost' },
          {
            label: 'Create',
            onClick: () => void handleCreate(),
            disabled:
              creating ||
              !draft.projectId ||
              !draft.documentCode.trim() ||
              !draft.documentName.trim(),
            loading: creating,
          },
        ]}
      >
        <Stack direction="vertical" spacing="sm">
          <FieldControl label="Project">
            <Select
              size="sm"
              value={draft.projectId}
              onValueChange={(projectId: string) => setDraft((d) => ({ ...d, projectId }))}
              options={projectOptions}
              placeholder="Select project"
              aria-label="Project"
            />
          </FieldControl>
          <Input
            size="sm"
            fullWidth
            label="Code"
            value={draft.documentCode}
            onChange={(e) => setDraft((d) => ({ ...d, documentCode: e.target.value }))}
            placeholder="SPEC-001"
          />
          <Input
            size="sm"
            fullWidth
            label="Name"
            value={draft.documentName}
            onChange={(e) => setDraft((d) => ({ ...d, documentName: e.target.value }))}
            placeholder="Register / View / Edit"
          />
          <FieldControl label="Language">
            <Select
              size="sm"
              value={draft.language}
              onValueChange={(language: string) => setDraft((d) => ({ ...d, language }))}
              options={LANGUAGE_OPTIONS}
              aria-label="Language"
            />
          </FieldControl>
        </Stack>
      </Modal>

      <Modal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="How spec documents work"
        size="md"
        actions={[{ label: 'Close', onClick: () => setGuideOpen(false), variant: 'ghost' }]}
      >
        <Stack direction="vertical" spacing="md">
          <ol className="list-decimal space-y-2 pl-4 text-sm text-neutral-700">
            {SPEC_DOC_WORKFLOW_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <Typography variant="caption" tone="muted">
            {SPEC_DOC_WORKFLOW_NOTE}
          </Typography>
        </Stack>
      </Modal>
    </div>
  )
}

function ScreenSpecDocEditor({
  workspaceId,
  docId,
  screens,
  onDeleted,
}: {
  workspaceId: string
  docId: string
  screens: CatalogScreen[]
  onDeleted: () => Promise<void>
}) {
  const {
    doc,
    revisions,
    loading,
    error,
    saveMeta,
    addScreen,
    removeScreen,
    addRevision,
    removeRevision,
  } = useScreenSpecDocDetail(workspaceId, docId)
  const { exporting, exportDocument } = useScreenSpecExcelExport(workspaceId)
  const [meta, setMeta] = useState<UpdateScreenSpecDocBody | null>(null)
  const [screenId, setScreenId] = useState('')
  const [overviewOpen, setOverviewOpen] = useState(false)
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [addingRevision, setAddingRevision] = useState(false)
  const [addingScreen, setAddingScreen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const menuAnchorRef = useRef<HTMLDivElement>(null)
  const [rev, setRev] = useState(EMPTY_REVISION)

  useEffect(() => {
    setMeta(null)
    setScreenId('')
    setOverviewOpen(false)
    setRevisionOpen(false)
    setRev(EMPTY_REVISION)
  }, [docId])

  const form = meta ?? (doc
    ? {
        documentName: doc.documentName,
        projectName: doc.projectName,
        systemName: doc.systemName,
        phaseName: doc.phaseName,
        language: doc.language ?? 'EN',
        overview: doc.overview,
        figmaUrl: doc.figmaUrl,
      }
    : null)

  const linked = doc?.screens ?? []
  const linkedIds = new Set(linked.map((s) => s.screenId))
  const available = useMemo(
    () => screens.filter((s) => !linkedIds.has(s.id)),
    [screens, linked]
  )

  if (loading && !doc) return <PageSkeleton variant="list" />
  if (error) return <Typography tone="error">{error}</Typography>
  if (!doc || !form) return null

  const dirty = meta !== null
  const langOptions = languageOptions(form.language)

  const patchMeta = (patch: Partial<UpdateScreenSpecDocBody>) => {
    setMeta({ ...form, ...patch })
  }

  const handleSave = async () => {
    try {
      await saveMeta({
        documentName: form.documentName.trim(),
        projectName: form.projectName?.trim() || null,
        systemName: form.systemName?.trim() || null,
        phaseName: form.phaseName?.trim() || null,
        language: form.language?.trim() || 'EN',
        overview: form.overview?.trim() || null,
        figmaUrl: form.figmaUrl?.trim() || null,
      })
      setMeta(null)
      toast.success('Document saved')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleAddScreen = async () => {
    if (!screenId) return
    setAddingScreen(true)
    try {
      await addScreen({ screenId, displayOrder: linked.length + 1 })
      setScreenId('')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setAddingScreen(false)
    }
  }

  const handleAddRevision = async () => {
    setAddingRevision(true)
    try {
      await addRevision({
        revisionNo: rev.revisionNo.trim(),
        targetSheetName: rev.targetSheetName || null,
        details: rev.details.trim() || null,
        personInCharge: rev.personInCharge.trim() || null,
        changedAt: rev.changedAt.trim() || null,
        displayOrder: revisions.length + 1,
      })
      setRev(EMPTY_REVISION)
      setRevisionOpen(false)
      toast.success('Revision added')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setAddingRevision(false)
    }
  }

  return (
    <Stack direction="vertical" spacing="md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge size="sm" variant="soft">
              {doc.documentCode}
            </Badge>
            <Typography weight="medium">{doc.documentName}</Typography>
          </div>
          {doc.projectName ? (
            <Typography variant="caption" tone="muted" className="mt-1 block">
              {doc.projectName}
            </Typography>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="sm"
            disabled={exporting}
            onClick={async () => {
              try {
                const result = await exportDocument(docId)
                if (result) toast.success(`Exported ${result.filename}`)
              } catch (err) {
                toast.error(getProblemToastMessage(err))
              }
            }}
          >
            {exporting ? 'Exporting…' : 'Export Excel'}
          </Button>
          <div ref={menuAnchorRef}>
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              icon={<MoreHorizontal size={16} strokeWidth={1.75} />}
              aria-label="Document actions"
              onClick={() => setMenuOpen((open) => !open)}
            />
          </div>
          <AnchoredMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            anchorRef={menuAnchorRef}
            minWidth={140}
          >
            <button
              type="button"
              role="menuitem"
              className={`${anchoredMenuItemClassName} text-error`}
              onClick={() => {
                setMenuOpen(false)
                setDeleteOpen(true)
              }}
            >
              Delete document
            </button>
          </AnchoredMenu>
        </div>
      </div>

      <Card hasShadow={false} className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Typography weight="medium" variant="small">
            Document header
          </Typography>
          <Button size="sm" disabled={!dirty || !form.documentName.trim()} onClick={() => void handleSave()}>
            Save
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Input
            size="sm"
            fullWidth
            label="Name"
            value={form.documentName}
            onChange={(e) => patchMeta({ documentName: e.target.value })}
          />
          <Input
            size="sm"
            fullWidth
            label="Project name"
            value={form.projectName ?? ''}
            onChange={(e) => patchMeta({ projectName: e.target.value })}
          />
          <Input
            size="sm"
            fullWidth
            label="System"
            value={form.systemName ?? ''}
            onChange={(e) => patchMeta({ systemName: e.target.value })}
          />
          <Input
            size="sm"
            fullWidth
            label="Phase"
            value={form.phaseName ?? ''}
            onChange={(e) => patchMeta({ phaseName: e.target.value })}
          />
          <FieldControl label="Language">
            <Select
              size="sm"
              value={form.language ?? 'EN'}
              onValueChange={(language: string) => patchMeta({ language })}
              options={langOptions}
              aria-label="Language"
            />
          </FieldControl>
          <div className="sm:col-span-2 xl:col-span-3">
            <Input
              size="sm"
              fullWidth
              label="Figma URL"
              value={form.figmaUrl ?? ''}
              onChange={(e) => patchMeta({ figmaUrl: e.target.value })}
            />
          </div>
        </div>
        <button
          type="button"
          className="mt-3 flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
          onClick={() => setOverviewOpen((open) => !open)}
        >
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            className={overviewOpen ? 'rotate-180' : undefined}
          />
          Overview
        </button>
        {overviewOpen ? (
          <div className="mt-2">
            <Textarea
              size="sm"
              fullWidth
              value={form.overview ?? ''}
              onChange={(e) => patchMeta({ overview: e.target.value })}
              placeholder="Shown on the Excel cover"
            />
          </div>
        ) : null}
      </Card>

      <Card hasShadow={false} className="p-4">
        <Typography weight="medium" variant="small">
          Screens{linked.length > 0 ? ` · ${linked.length}` : ''}
        </Typography>
        {linked.length === 0 ? (
          <Typography tone="muted" variant="small" className="mt-3 block">
            Add screens to include in the workbook.
          </Typography>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {linked.map((item) => (
              <div
                key={item.screenId}
                className="inline-flex h-8 items-center gap-1 border border-neutral-200 bg-neutral-50 pl-2 text-sm"
              >
                <span>
                  {item.code ?? item.screenId}
                  {item.name ? ` · ${item.name}` : ''}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  iconOnly
                  icon={<X size={14} strokeWidth={1.75} />}
                  aria-label={`Remove ${item.code ?? item.screenId}`}
                  onClick={() => void removeScreen(item.screenId)}
                />
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 grid grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <FieldControl label="Add screen">
            <SearchableSelect
              size="sm"
              value={screenId}
              onValueChange={setScreenId}
              placeholder={available.length === 0 ? 'All screens added' : 'Search screens'}
              searchPlaceholder="Search code or name"
              disabled={available.length === 0}
              options={available.map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` }))}
            />
          </FieldControl>
          <Button size="sm" disabled={!screenId || addingScreen} onClick={() => void handleAddScreen()}>
            Add
          </Button>
        </div>
      </Card>

      <Card hasShadow={false} className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Typography weight="medium" variant="small">
            Change history
          </Typography>
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus size={14} strokeWidth={1.75} />}
            onClick={() => {
              setRev(EMPTY_REVISION)
              setRevisionOpen(true)
            }}
          >
            Add revision
          </Button>
        </div>
        {revisions.length === 0 ? (
          <Typography tone="muted" variant="small">
            No revisions yet. Add a row for the Change History sheet.
          </Typography>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-neutral-200 text-neutral-500">
                <tr>
                  <th className="px-2 py-2 font-medium">Rev</th>
                  <th className="px-2 py-2 font-medium">Sheet</th>
                  <th className="px-2 py-2 font-medium">Details</th>
                  <th className="px-2 py-2 font-medium">Person</th>
                  <th className="px-2 py-2 font-medium">Date</th>
                  <th className="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {revisions.map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-2 font-medium">{item.revisionNo}</td>
                    <td className="px-2 py-2 text-neutral-600">{item.targetSheetName ?? '—'}</td>
                    <td className="px-2 py-2 text-neutral-600">{item.details ?? '—'}</td>
                    <td className="px-2 py-2 text-neutral-600">{item.personInCharge ?? '—'}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-neutral-600">
                      {item.changedAt ?? '—'}
                    </td>
                    <td className="px-2 py-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        iconOnly
                        icon={<X size={14} strokeWidth={1.75} />}
                        aria-label={`Remove revision ${item.revisionNo}`}
                        onClick={() => void removeRevision(item.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={revisionOpen}
        onClose={() => setRevisionOpen(false)}
        title="Add revision"
        size="sm"
        actions={[
          { label: 'Cancel', onClick: () => setRevisionOpen(false), variant: 'ghost' },
          {
            label: 'Add',
            onClick: () => void handleAddRevision(),
            disabled: addingRevision || !rev.revisionNo.trim(),
            loading: addingRevision,
          },
        ]}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            size="sm"
            fullWidth
            label="Rev"
            value={rev.revisionNo}
            onChange={(e) => setRev((r) => ({ ...r, revisionNo: e.target.value }))}
            placeholder="1.0"
          />
          <FieldControl label="Sheet">
            <Select
              size="sm"
              value={rev.targetSheetName}
              onValueChange={(v: string) => setRev((r) => ({ ...r, targetSheetName: v }))}
              options={SHEET_OPTIONS}
              aria-label="Sheet"
            />
          </FieldControl>
          <Input
            size="sm"
            fullWidth
            label="Person"
            value={rev.personInCharge}
            onChange={(e) => setRev((r) => ({ ...r, personInCharge: e.target.value }))}
          />
          <Input
            size="sm"
            fullWidth
            type="date"
            label="Date"
            value={rev.changedAt}
            onChange={(e) => setRev((r) => ({ ...r, changedAt: e.target.value }))}
          />
          <div className="sm:col-span-2">
            <Textarea
              size="sm"
              fullWidth
              label="Details"
              value={rev.details}
              onChange={(e) => setRev((r) => ({ ...r, details: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete spec document?"
        message="This removes the document and its change history. Screens in the catalog are not deleted."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={onDeleted}
      />
    </Stack>
  )
}
