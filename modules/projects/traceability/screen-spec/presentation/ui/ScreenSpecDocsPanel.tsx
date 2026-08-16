'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleHelp, MoreHorizontal, Pencil, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  AnchoredMenu,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  Divider,
  Input,
  Modal,
  PageSkeleton,
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

function catalogScreenLabel(screen: CatalogScreen): string {
  const name = screen.name.trim()
  const code = screen.code.trim()
  if (name && code && name !== code) return `${name} · ${code}`
  return name || code || screen.id
}

function linkedScreenLabel(
  item: { screenId: string; code?: string | null; name?: string | null },
  catalog: CatalogScreen[]
): string {
  const match = catalog.find((s) => s.id === item.screenId)
  if (match) return catalogScreenLabel(match)
  const name = item.name?.trim() ?? ''
  const code = item.code?.trim() ?? ''
  if (name && code && name !== code) return `${name} · ${code}`
  return name || code || item.screenId
}

function FieldControl({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <span className="text-sm font-normal text-neutral-700">{label}</span>
      {children}
    </div>
  )
}

function HeaderField({ label, value }: { label: string; value: string | null | undefined }) {
  const text = value?.trim()
  return (
    <div className="min-w-0">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className={text ? 'truncate text-sm text-neutral-900' : 'text-sm text-neutral-400'}>
        {text || '—'}
      </div>
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
  applicationId = null,
}: {
  workspaceId: string
  screens: CatalogScreen[]
  applicationId?: string | null
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
      toast.success('High Level Design created')
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
            High Level Design
          </Typography>
          <div className="flex items-center">
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              icon={<Plus size={16} strokeWidth={1.75} />}
              aria-label="Create High Level Design"
              onClick={openCreate}
            />
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              icon={<CircleHelp size={16} strokeWidth={1.75} />}
              aria-label="How to use High Level Design"
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
                ? 'Create a project in this workspace first. High Level Design requires a project.'
                : 'No High Level Design documents yet. Use + to create one.'}
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
            applicationId={applicationId}
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
        title="Create High Level Design"
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
        title="How High Level Design works"
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
  applicationId,
  docId,
  screens,
  onDeleted,
}: {
  workspaceId: string
  applicationId?: string | null
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
  const { exporting, exportDocument } = useScreenSpecExcelExport(workspaceId, applicationId)
  const [headerOpen, setHeaderOpen] = useState(false)
  const [headerDraft, setHeaderDraft] = useState<UpdateScreenSpecDocBody | null>(null)
  const [savingHeader, setSavingHeader] = useState(false)
  const [screensOpen, setScreensOpen] = useState(false)
  const [screenQuery, setScreenQuery] = useState('')
  const [selectedScreenIds, setSelectedScreenIds] = useState<string[]>([])
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [addingRevision, setAddingRevision] = useState(false)
  const [addingScreen, setAddingScreen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const menuAnchorRef = useRef<HTMLDivElement>(null)
  const [rev, setRev] = useState(EMPTY_REVISION)

  useEffect(() => {
    setHeaderOpen(false)
    setHeaderDraft(null)
    setScreensOpen(false)
    setScreenQuery('')
    setSelectedScreenIds([])
    setRevisionOpen(false)
    setRev(EMPTY_REVISION)
  }, [docId])

  const linked = doc?.screens ?? []
  const linkedIds = new Set(linked.map((s) => s.screenId))
  const available = useMemo(
    () => screens.filter((s) => !linkedIds.has(s.id)),
    [screens, linked]
  )
  const filteredAvailable = useMemo(() => {
    const q = screenQuery.trim().toLowerCase()
    if (!q) return available
    return available.filter(
      (s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    )
  }, [available, screenQuery])

  if (loading && !doc) return <PageSkeleton variant="list" />
  if (error) return <Typography tone="error">{error}</Typography>
  if (!doc) return null

  const openHeaderEditor = () => {
    setHeaderDraft({
      documentName: doc.documentName,
      projectName: doc.projectName,
      systemName: doc.systemName,
      phaseName: doc.phaseName,
      language: doc.language ?? 'EN',
      overview: doc.overview,
      figmaUrl: doc.figmaUrl,
    })
    setHeaderOpen(true)
  }

  const patchHeader = (patch: Partial<UpdateScreenSpecDocBody>) => {
    if (!headerDraft) return
    setHeaderDraft({ ...headerDraft, ...patch })
  }

  const handleSaveHeader = async () => {
    if (!headerDraft) return
    setSavingHeader(true)
    try {
      await saveMeta({
        documentName: headerDraft.documentName.trim(),
        projectName: headerDraft.projectName?.trim() || null,
        systemName: headerDraft.systemName?.trim() || null,
        phaseName: headerDraft.phaseName?.trim() || null,
        language: headerDraft.language?.trim() || 'EN',
        overview: headerDraft.overview?.trim() || null,
        figmaUrl: headerDraft.figmaUrl?.trim() || null,
      })
      setHeaderOpen(false)
      setHeaderDraft(null)
      toast.success('Document saved')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSavingHeader(false)
    }
  }

  const handleAddScreens = async () => {
    if (selectedScreenIds.length === 0) return
    setAddingScreen(true)
    try {
      let order = linked.length
      for (const id of selectedScreenIds) {
        order += 1
        await addScreen({ screenId: id, displayOrder: order })
      }
      const count = selectedScreenIds.length
      setSelectedScreenIds([])
      setScreenQuery('')
      setScreensOpen(false)
      toast.success(count === 1 ? 'Screen added' : `${count} screens added`)
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

      <Divider variant="dashed" />

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <Typography weight="medium" variant="small">
            Document header
          </Typography>
          <Button
            size="sm"
            variant="ghost"
            iconOnly
            icon={<Pencil size={16} strokeWidth={1.75} />}
            aria-label="Edit document header"
            onClick={openHeaderEditor}
          />
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
          <HeaderField label="Name" value={doc.documentName} />
          <HeaderField label="Project name" value={doc.projectName} />
          <HeaderField label="System" value={doc.systemName} />
          <HeaderField label="Phase" value={doc.phaseName} />
          <HeaderField label="Language" value={doc.language} />
          <div className="min-w-0 sm:col-span-2 xl:col-span-3">
            <div className="text-sm text-neutral-500">Mockup URL</div>
            {doc.figmaUrl?.trim() ? (
              <a
                href={doc.figmaUrl.trim()}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-sm text-primary hover:underline"
              >
                {doc.figmaUrl.trim()}
              </a>
            ) : (
              <div className="text-sm text-neutral-400">—</div>
            )}
          </div>
        </div>
        {doc.overview?.trim() ? (
          <div className="mt-4">
            <div className="text-sm text-neutral-500">Overview</div>
            <Typography variant="small" className="mt-1 whitespace-pre-wrap text-neutral-800">
              {doc.overview}
            </Typography>
          </div>
        ) : null}
      </section>

      <Divider variant="dashed" />

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <Typography weight="medium" variant="small">
            Screens{linked.length > 0 ? ` · ${linked.length}` : ''}
          </Typography>
          <Button
            size="sm"
            variant="ghost"
            iconOnly
            icon={<Plus size={16} strokeWidth={1.75} />}
            aria-label="Add screens"
            onClick={() => {
              setSelectedScreenIds([])
              setScreenQuery('')
              setScreensOpen(true)
            }}
          />
        </div>
        {linked.length === 0 ? (
          <Typography tone="muted" variant="small" className="block">
            No screens in this document yet. Use + to add screens from this app.
          </Typography>
        ) : (
          <div className="flex flex-wrap gap-2">
            {linked.map((item) => (
              <div
                key={item.screenId}
                className="inline-flex h-8 items-center gap-1 border border-neutral-200 bg-neutral-50 pl-2 text-sm"
              >
                <span>{linkedScreenLabel(item, screens)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  iconOnly
                  icon={<X size={14} strokeWidth={1.75} />}
                  aria-label={`Remove ${linkedScreenLabel(item, screens)}`}
                  onClick={() => void removeScreen(item.screenId)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <Divider variant="dashed" />

      <section>
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
      </section>

      <Modal
        open={screensOpen}
        onClose={() => setScreensOpen(false)}
        title="Add screens"
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setScreensOpen(false), variant: 'ghost' },
          {
            label: selectedScreenIds.length > 1 ? `Add ${selectedScreenIds.length}` : 'Add',
            onClick: () => void handleAddScreens(),
            disabled: addingScreen || selectedScreenIds.length === 0,
            loading: addingScreen,
          },
        ]}
      >
        <Stack direction="vertical" spacing="sm">
          <Input
            size="sm"
            fullWidth
            type="search"
            value={screenQuery}
            onChange={(e) => setScreenQuery(e.target.value)}
            placeholder="Search code or name"
            aria-label="Search screens"
          />
          {available.length === 0 ? (
            <Typography tone="muted" variant="small">
              All screens in this app are already in this document.
            </Typography>
          ) : filteredAvailable.length === 0 ? (
            <Typography tone="muted" variant="small">
              No screens match this search.
            </Typography>
          ) : (
            <div className="max-h-72 overflow-y-auto border border-neutral-200">
              <div className="border-b border-neutral-100 px-3 py-2">
                <Checkbox
                  size="sm"
                  label="Select all"
                  checked={
                    filteredAvailable.length > 0 &&
                    filteredAvailable.every((s) => selectedScreenIds.includes(s.id))
                  }
                  indeterminate={
                    filteredAvailable.some((s) => selectedScreenIds.includes(s.id)) &&
                    !filteredAvailable.every((s) => selectedScreenIds.includes(s.id))
                  }
                  onChange={(e) => {
                    const visibleIds = filteredAvailable.map((s) => s.id)
                    if (e.target.checked) {
                      setSelectedScreenIds((prev) => [...new Set([...prev, ...visibleIds])])
                    } else {
                      const drop = new Set(visibleIds)
                      setSelectedScreenIds((prev) => prev.filter((id) => !drop.has(id)))
                    }
                  }}
                />
              </div>
              <ul>
                {filteredAvailable.map((screen) => {
                  const checked = selectedScreenIds.includes(screen.id)
                  return (
                    <li key={screen.id} className="border-b border-neutral-100 px-3 py-2 last:border-b-0">
                      <Checkbox
                        size="sm"
                        label={catalogScreenLabel(screen)}
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScreenIds((prev) => [...prev, screen.id])
                          } else {
                            setSelectedScreenIds((prev) => prev.filter((id) => id !== screen.id))
                          }
                        }}
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </Stack>
      </Modal>

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

      <Modal
        open={headerOpen && headerDraft !== null}
        onClose={() => {
          setHeaderOpen(false)
          setHeaderDraft(null)
        }}
        title="Edit document header"
        size="md"
        actions={[
          {
            label: 'Cancel',
            onClick: () => {
              setHeaderOpen(false)
              setHeaderDraft(null)
            },
            variant: 'ghost',
          },
          {
            label: 'Save',
            onClick: () => void handleSaveHeader(),
            disabled: savingHeader || !headerDraft?.documentName.trim(),
            loading: savingHeader,
          },
        ]}
      >
        {headerDraft ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              size="sm"
              fullWidth
              label="Name"
              value={headerDraft.documentName}
              onChange={(e) => patchHeader({ documentName: e.target.value })}
            />
            <Input
              size="sm"
              fullWidth
              label="Project name"
              value={headerDraft.projectName ?? ''}
              onChange={(e) => patchHeader({ projectName: e.target.value })}
            />
            <Input
              size="sm"
              fullWidth
              label="System"
              value={headerDraft.systemName ?? ''}
              onChange={(e) => patchHeader({ systemName: e.target.value })}
            />
            <Input
              size="sm"
              fullWidth
              label="Phase"
              value={headerDraft.phaseName ?? ''}
              onChange={(e) => patchHeader({ phaseName: e.target.value })}
            />
            <FieldControl label="Language">
              <Select
                size="sm"
                value={headerDraft.language ?? 'EN'}
                onValueChange={(language: string) => patchHeader({ language })}
                options={languageOptions(headerDraft.language)}
                aria-label="Language"
              />
            </FieldControl>
            <Input
              size="sm"
              fullWidth
              label="Mockup URL"
              value={headerDraft.figmaUrl ?? ''}
              onChange={(e) => patchHeader({ figmaUrl: e.target.value })}
            />
            <div className="sm:col-span-2">
              <Textarea
                size="sm"
                fullWidth
                label="Overview"
                value={headerDraft.overview ?? ''}
                onChange={(e) => patchHeader({ overview: e.target.value })}
                placeholder="Shown on the Excel cover"
              />
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete High Level Design?"
        message="This removes the document and its change history. Screens in the catalog are not deleted."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={onDeleted}
      />
    </Stack>
  )
}
