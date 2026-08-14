'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, Input, PageSkeleton, Select, Stack, Textarea, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { SCREEN_SPEC_EXCEL_SHEETS } from '../../domain/rules/screen-spec-excel.rules'
import type { UpsertScreenSpecDocBody } from '../../domain/model/screen-spec-doc'
import { useScreenSpecDocs } from '../hooks/useScreenSpecDocs'
import { useScreenSpecDocDetail } from '../hooks/useScreenSpecDocDetail'
import { useScreenSpecExcelExport } from '../hooks/useScreenSpecExcelExport'

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
  const { items, loading, error, createDoc, removeDoc } = useScreenSpecDocs(workspaceId)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ documentCode: '', documentName: '' })

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(220px,280px)_minmax(0,1fr)] overflow-hidden border border-neutral-200 bg-white">
      <aside className="flex min-h-0 flex-col overflow-hidden border-r border-neutral-200">
        <div className="space-y-2 border-b border-neutral-100 p-3">
          <Typography weight="medium" variant="small">
            Spec documents
          </Typography>
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
          <Button
            size="sm"
            disabled={creating || !draft.documentCode.trim() || !draft.documentName.trim()}
            onClick={async () => {
              setCreating(true)
              try {
                const created = await createDoc({
                  documentCode: draft.documentCode.trim(),
                  documentName: draft.documentName.trim(),
                  language: 'EN',
                })
                setDraft({ documentCode: '', documentName: '' })
                if (created) setSelectedId(created.id)
                toast.success('Spec document created')
              } catch (err) {
                toast.error(getProblemToastMessage(err))
              } finally {
                setCreating(false)
              }
            }}
          >
            Create
          </Button>
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
              No spec documents yet. Create one to group screens and export Excel.
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
          <Typography tone="muted">Select a document to add screens, revisions, and export Excel.</Typography>
        )}
      </div>
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
  const [meta, setMeta] = useState<UpsertScreenSpecDocBody | null>(null)
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
        documentCode: doc.documentCode,
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
        <Input
          size="sm"
          fullWidth
          label="Code"
          value={form.documentCode}
          onChange={(e) => setMeta({ ...form, documentCode: e.target.value })}
        />
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
          label="Project"
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
              ...form,
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
