'use client'

import { useEffect, useMemo, useState } from 'react'
import { CircleHelp, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Input, Modal, PageSkeleton, Select, Stack, Textarea, Typography } from '@/shared/ui'
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

interface CatalogScreen {
  id: string
  code: string
  name: string
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
          <div>
            <Typography variant="small" className="mb-1 block">
              Project
            </Typography>
            <Select
              size="sm"
              value={draft.projectId}
              onValueChange={(projectId: string) => setDraft((d) => ({ ...d, projectId }))}
              options={projectOptions}
              placeholder="Select project"
              aria-label="Project"
            />
          </div>
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
          <Input
            size="sm"
            fullWidth
            label="Language"
            value={draft.language}
            onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value }))}
            placeholder="EN"
          />
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
  useEffect(() => {
    setMeta(null)
    setScreenId('')
  }, [docId])
  const [rev, setRev] = useState({
    revisionNo: '',
    targetSheetName: SCREEN_SPEC_EXCEL_SHEETS.defines as string,
    details: '',
    personInCharge: '',
    changedAt: '',
  })

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

  return (
    <Stack direction="vertical" spacing="lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography weight="medium">{doc.documentName}</Typography>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
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
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              try {
                await onDeleted()
                toast.success('Document deleted')
              } catch (err) {
                toast.error(getProblemToastMessage(err))
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input size="sm" fullWidth label="Code" value={doc.documentCode} readOnly />
        <Input
          size="sm"
          fullWidth
          label="Name"
          value={form.documentName}
          onChange={(e) => setMeta({ ...form, documentName: e.target.value })}
        />
        <Input
          size="sm"
          fullWidth
          label="Project name"
          value={form.projectName ?? ''}
          onChange={(e) => setMeta({ ...form, projectName: e.target.value })}
        />
        <Input
          size="sm"
          fullWidth
          label="System"
          value={form.systemName ?? ''}
          onChange={(e) => setMeta({ ...form, systemName: e.target.value })}
        />
        <Input
          size="sm"
          fullWidth
          label="Phase"
          value={form.phaseName ?? ''}
          onChange={(e) => setMeta({ ...form, phaseName: e.target.value })}
        />
        <Input
          size="sm"
          fullWidth
          label="Language"
          value={form.language ?? ''}
          onChange={(e) => setMeta({ ...form, language: e.target.value })}
        />
        <Input
          size="sm"
          fullWidth
          label="Figma URL"
          value={form.figmaUrl ?? ''}
          onChange={(e) => setMeta({ ...form, figmaUrl: e.target.value })}
        />
      </div>
      <Textarea
        label="Overview"
        value={form.overview ?? ''}
        onChange={(e) => setMeta({ ...form, overview: e.target.value })}
      />
      <Button
        size="sm"
        onClick={async () => {
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
        }}
      >
        Save metadata
      </Button>

      <Stack direction="vertical" spacing="sm">
        <Typography weight="medium" variant="small">
          Screens in this file
        </Typography>
        <Typography tone="muted" variant="caption">
          One screen = a single-screen workbook. Several screens = grouped Startupper-style file
          (Layout lists them; Defines / Process / Event / Validation are blocked per screen).
        </Typography>
        {linked.length === 0 ? (
          <Typography tone="muted" variant="small">
            No screens yet.
          </Typography>
        ) : (
          <ul className="divide-y divide-neutral-100 border border-neutral-200">
            {linked.map((item) => (
              <li key={item.screenId} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span>
                  {item.code ?? item.screenId}
                  {item.name ? ` · ${item.name}` : ''}
                </span>
                <Button size="sm" variant="ghost" onClick={() => void removeScreen(item.screenId)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex max-w-md items-end gap-2">
          <div className="min-w-0 flex-1">
            <Select
              value={screenId}
              onValueChange={setScreenId}
              placeholder="Add a screen"
              options={available.map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` }))}
            />
          </div>
          <Button
            size="sm"
            disabled={!screenId}
            onClick={async () => {
              try {
                await addScreen({ screenId, displayOrder: linked.length + 1 })
                setScreenId('')
              } catch (err) {
                toast.error(getProblemToastMessage(err))
              }
            }}
          >
            Add
          </Button>
        </div>
      </Stack>

      <Stack direction="vertical" spacing="sm">
        <Typography weight="medium" variant="small">
          Change history
        </Typography>
        {revisions.length === 0 ? (
          <Typography tone="muted" variant="small">
            No revisions yet.
          </Typography>
        ) : (
          <ul className="divide-y divide-neutral-100 border border-neutral-200">
            {revisions.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-2 px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">
                    {item.revisionNo}
                    {item.targetSheetName ? ` · ${item.targetSheetName}` : ''}
                  </div>
                  <div className="text-neutral-600">{item.details}</div>
                  <div className="text-neutral-500">
                    {[item.personInCharge, item.changedAt].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => void removeRevision(item.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            size="sm"
            fullWidth
            label="Rev"
            value={rev.revisionNo}
            onChange={(e) => setRev((r) => ({ ...r, revisionNo: e.target.value }))}
            placeholder="1.0"
          />
          <Select
            value={rev.targetSheetName}
            onValueChange={(v: string) => setRev((r) => ({ ...r, targetSheetName: v }))}
            options={SHEET_OPTIONS}
            placeholder="Sheet"
          />
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
            label="Date"
            value={rev.changedAt}
            onChange={(e) => setRev((r) => ({ ...r, changedAt: e.target.value }))}
            placeholder="2026-08-14"
          />
        </div>
        <Textarea
          label="Details"
          value={rev.details}
          onChange={(e) => setRev((r) => ({ ...r, details: e.target.value }))}
        />
        <Button
          size="sm"
          disabled={!rev.revisionNo.trim()}
          onClick={async () => {
            try {
              await addRevision({
                revisionNo: rev.revisionNo.trim(),
                targetSheetName: rev.targetSheetName || null,
                details: rev.details.trim() || null,
                personInCharge: rev.personInCharge.trim() || null,
                changedAt: rev.changedAt.trim() || null,
                displayOrder: revisions.length + 1,
              })
              setRev({
                revisionNo: '',
                targetSheetName: SCREEN_SPEC_EXCEL_SHEETS.defines,
                details: '',
                personInCharge: '',
                changedAt: '',
              })
            } catch (err) {
              toast.error(getProblemToastMessage(err))
            }
          }}
        >
          Add revision
        </Button>
      </Stack>
    </Stack>
  )
}
