'use client'

import { Archive, Ban, Check, Copy, Pencil, Plus, Save, Trash2, Upload } from 'lucide-react'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Badge, Button, ConfirmDialog, Input, Modal, Select, Stack, Typography, PageSkeleton, Skeleton } from '@/shared/ui'
import { useRateCardEditor } from '../hooks/useRateCardEditor'
import {
  canEditVersionLines,
  canPublishVersion,
  isVersionArchived,
} from '../../domain/rules/rate-card.rules'
import type { RateCardLine } from '../../domain/model/rate-card-line'
import type { RateCardVersion } from '../../domain/model/rate-card-version'

const EMPTY_LINE_FORM = {
  costRoleId: '',
  seniorityLevel: '',
  locationCode: '',
  currencyCode: '',
  costRatePerHour: '',
  billingRatePerHour: '',
  notes: '',
}

type ConfirmActionType = 'publish' | 'archive-version' | 'archive-card' | 'deactivate-card' | 'delete-line'

function versionStatusTone(version: RateCardVersion): 'success' | 'warning' | 'neutral' {
  if (version.status === 'PUBLISHED') return 'success'
  if (canEditVersionLines(version)) return 'warning'
  return 'neutral'
}

export function RateCardEditorView() {
  const { rateCardId } = useParams<{ rateCardId: string }>()
  const {
    rateCard,
    versions,
    selectedVersion,
    selectedVersionId,
    setSelectedVersionId,
    lines,
    loading,
    linesLoading,
    error,
    saving,
    createVersion,
    publishVersion,
    archiveVersion,
    duplicateVersion,
    archiveRateCard,
    deactivateRateCard,
    activateRateCard,
    updateRateCard,
    addLine,
    updateLine,
    deleteLine,
  } = useRateCardEditor(rateCardId)

  const [metaForm, setMetaForm] = useState({ name: '', description: '', defaultCurrencyCode: '' })
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [versionForm, setVersionForm] = useState({ name: '', effectiveFrom: '', effectiveTo: '' })

  const [showLineModal, setShowLineModal] = useState(false)
  const [editingLine, setEditingLine] = useState<RateCardLine | null>(null)
  const [lineForm, setLineForm] = useState(EMPTY_LINE_FORM)

  const [confirmAction, setConfirmAction] = useState<{
    type: ConfirmActionType
    targetId?: string
  } | null>(null)

  useEffect(() => {
    if (!rateCard) return
    setMetaForm({
      name: rateCard.name,
      description: rateCard.description ?? '',
      defaultCurrencyCode: rateCard.defaultCurrencyCode,
    })
  }, [rateCard])

  const versionOptions = versions.map((v) => ({
    value: v.id,
    label: `${v.name ?? `Version ${v.versionNumber}`} · ${v.status}`,
  }))

  const openCreateLine = () => {
    setEditingLine(null)
    setLineForm(EMPTY_LINE_FORM)
    setShowLineModal(true)
  }

  const openEditLine = (line: RateCardLine) => {
    setEditingLine(line)
    setLineForm({
      costRoleId: line.costRoleId,
      seniorityLevel: line.seniorityLevel ?? '',
      locationCode: line.locationCode ?? '',
      currencyCode: line.currencyCode,
      costRatePerHour: String(line.costRatePerHour),
      billingRatePerHour: line.billingRatePerHour != null ? String(line.billingRatePerHour) : '',
      notes: line.notes ?? '',
    })
    setShowLineModal(true)
  }

  const submitLine = async () => {
    const payload = {
      costRoleId: lineForm.costRoleId.trim(),
      seniorityLevel: lineForm.seniorityLevel.trim() || undefined,
      locationCode: lineForm.locationCode.trim() || undefined,
      currencyCode: lineForm.currencyCode.trim().toUpperCase(),
      costRatePerHour: Number(lineForm.costRatePerHour),
      billingRatePerHour: lineForm.billingRatePerHour
        ? Number(lineForm.billingRatePerHour)
        : undefined,
      notes: lineForm.notes.trim() || undefined,
    }
    if (editingLine) {
      await updateLine(editingLine.id, payload)
    } else {
      await addLine(payload)
    }
    setShowLineModal(false)
    setEditingLine(null)
    setLineForm(EMPTY_LINE_FORM)
  }

  if (loading) {
    return (
      <PageSkeleton variant="detail" />
    )
  }

  if (error || !rateCard) {
    return (
      <div className="border border-red-200 bg-red-50 p-4">
        <Typography variant="small" className="text-red-700">
          {error ?? 'Rate card not found.'}
        </Typography>
      </div>
    )
  }

  const editable = selectedVersion ? canEditVersionLines(selectedVersion) : false

  const confirmCopy: Record<ConfirmActionType, { title: string; message: string }> = {
    publish: {
      title: 'Publish version',
      message: 'Publishing locks this version from further line edits. Continue?',
    },
    'archive-version': {
      title: 'Archive version',
      message: 'This version will no longer be usable for rate resolution. Continue?',
    },
    'archive-card': {
      title: 'Archive rate card',
      message: 'This rate card will be archived and removed from active resolution. Continue?',
    },
    'deactivate-card': {
      title: 'Deactivate rate card',
      message: 'This rate card will be deactivated. You can activate it again later. Continue?',
    },
    'delete-line': {
      title: 'Delete line',
      message: 'This line will be permanently removed from the version. Continue?',
    },
  }

  const metaDirty =
    rateCard &&
    (metaForm.name.trim() !== rateCard.name ||
      (metaForm.description.trim() || '') !== (rateCard.description ?? '') ||
      metaForm.defaultCurrencyCode.trim() !== rateCard.defaultCurrencyCode)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            {rateCard.name}
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1 font-mono text-xs">
            {rateCard.code} · {rateCard.scope} · {rateCard.defaultCurrencyCode}
          </Typography>
        </div>
        <Stack direction="horizontal" spacing="sm" align="center" className="flex-wrap">
          <Badge
            variant="solid"
            tone={
              rateCard.status === 'ACTIVE'
                ? 'success'
                : rateCard.status === 'ARCHIVED'
                  ? 'neutral'
                  : 'warning'
            }
          >
            {rateCard.status === 'ARCHIVED'
              ? 'Archived'
              : rateCard.status === 'ACTIVE'
                ? 'Active'
                : rateCard.status === 'INACTIVE'
                  ? 'Inactive'
                  : rateCard.status}
          </Badge>
          {rateCard.status === 'ACTIVE' ? (
            <Button
              variant="outline"
              onClick={() => setConfirmAction({ type: 'deactivate-card' })}
              icon={<Ban size={16} />}
            >
              Deactivate
            </Button>
          ) : null}
          {rateCard.status === 'INACTIVE' ? (
            <Button variant="outline" onClick={() => void activateRateCard()} icon={<Check size={16} />}>
              Activate
            </Button>
          ) : null}
          {rateCard.status !== 'ARCHIVED' ? (
            <Button
              variant="outline"
              tone="error"
              onClick={() => setConfirmAction({ type: 'archive-card' })}
              icon={<Archive size={16} />}
            >
              Archive card
            </Button>
          ) : null}
        </Stack>
      </div>

      {rateCard.status !== 'ARCHIVED' ? (
        <div className="mb-4 border border-neutral-200 bg-white p-4">
          <Typography weight="semibold" variant="small" className="mb-3">
            Card metadata
          </Typography>
          <Stack direction="vertical" spacing="md" className="max-w-lg">
            <Input
              label="Name"
              value={metaForm.name}
              onChange={(e) => setMetaForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Description"
              value={metaForm.description}
              onChange={(e) => setMetaForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Input
              label="Default currency"
              value={metaForm.defaultCurrencyCode}
              onChange={(e) =>
                setMetaForm((f) => ({ ...f, defaultCurrencyCode: e.target.value.toUpperCase() }))
              }
            />
            <Button
              variant="primary"
              disabled={!metaDirty || !metaForm.name.trim() || !metaForm.defaultCurrencyCode.trim() || saving}
              onClick={() =>
                void updateRateCard({
                  name: metaForm.name.trim(),
                  description: metaForm.description.trim() || undefined,
                  defaultCurrencyCode: metaForm.defaultCurrencyCode.trim(),
                })
              }
              icon={<Save size={16} />}
            >
              Save metadata
            </Button>
          </Stack>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border border-neutral-200 bg-white p-4">
        <div className="min-w-[220px]">
          <Typography variant="small" tone="muted" className="mb-1.5">
            Version
          </Typography>
          <Select
            value={selectedVersionId ?? ''}
            onValueChange={(v: string) => setSelectedVersionId(v)}
            options={versionOptions}
            placeholder="Select a version"
          />
        </div>
        <Stack direction="horizontal" spacing="sm">
          <Button variant="outline" onClick={() => setShowVersionModal(true)} icon={<Plus size={16} />}>
            New version
          </Button>
          {selectedVersion && canPublishVersion(selectedVersion) ? (
            <Button
              variant="primary"
              onClick={() => setConfirmAction({ type: 'publish', targetId: selectedVersion.id })} icon={<Upload size={16} />}>
              Publish
            </Button>
          ) : null}
          {selectedVersion && !isVersionArchived(selectedVersion) ? (
            <Button
              variant="ghost"
              onClick={() =>
                setConfirmAction({ type: 'archive-version', targetId: selectedVersion.id })
              } icon={<Archive size={16} />}>
              Archive version
            </Button>
          ) : null}
          {selectedVersion ? (
            <Button
              variant="ghost"
              onClick={() => void duplicateVersion(selectedVersion.id)} icon={<Copy size={16} />}>
              Duplicate
            </Button>
          ) : null}
        </Stack>
      </div>

      {selectedVersion ? (
        <div className="mb-4 flex flex-wrap items-center gap-4 border border-neutral-200 bg-white px-4 py-3">
          <Typography as="span" variant="small" size="xs" tone="muted">
            Effective {selectedVersion.effectiveFrom} → {selectedVersion.effectiveTo ?? '∞'}
          </Typography>
          <Badge variant="solid" tone={versionStatusTone(selectedVersion)}>
            {String(selectedVersion.status).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
          </Badge>
        </div>
      ) : null}

      <div className="border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <Typography weight="semibold" variant="small">
            Lines ({lines.length})
          </Typography>
          <Button variant="primary" disabled={!editable} onClick={openCreateLine} icon={<Plus size={16} />}>
            Add line
          </Button>
        </div>
        {!selectedVersion ? (
          <div className="px-4 py-10 text-center">
            <Typography tone="muted" variant="small">
              Select or create a version to manage lines.
            </Typography>
          </div>
        ) : linesLoading ? (
          <div className="flex justify-center py-10">
            <Skeleton variant="rectangular" width="100%" height={80} />
          </div>
        ) : lines.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Typography tone="muted" variant="small">
              No lines yet for this version.
            </Typography>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Cost role</th>
                  <th className="px-3 py-2 font-medium">Seniority</th>
                  <th className="px-3 py-2 font-medium">Location</th>
                  <th className="px-3 py-2 font-medium">Currency</th>
                  <th className="px-3 py-2 font-medium">Cost / hr</th>
                  <th className="px-3 py-2 font-medium">Billing / hr</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className="border-t border-neutral-100">
                    <td className="px-3 py-2 font-mono text-xs">{line.costRoleId}</td>
                    <td className="px-3 py-2">{line.seniorityLevel ?? '—'}</td>
                    <td className="px-3 py-2">{line.locationCode ?? '—'}</td>
                    <td className="px-3 py-2">{line.currencyCode}</td>
                    <td className="px-3 py-2">{line.costRatePerHour.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      {line.billingRatePerHour != null ? line.billingRatePerHour.toFixed(2) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {editable ? (
                        <Stack direction="horizontal" spacing="xs" justify="end">
                          <Button variant="ghost" onClick={() => openEditLine(line)} icon={<Pencil size={16} />}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            tone="error"
                            onClick={() =>
                              setConfirmAction({ type: 'delete-line', targetId: line.id })
                            } icon={<Trash2 size={16} />}>
                            Delete
                          </Button>
                        </Stack>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        title="New version"
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setShowVersionModal(false), variant: 'ghost' },
          {
            label: saving ? 'Creating…' : 'Create',
            onClick: async () => {
              await createVersion({
                name: versionForm.name.trim() || undefined,
                effectiveFrom: versionForm.effectiveFrom,
                effectiveTo: versionForm.effectiveTo || undefined,
              })
              setShowVersionModal(false)
              setVersionForm({ name: '', effectiveFrom: '', effectiveTo: '' })
            },
            variant: 'primary',
            loading: saving,
            disabled: !versionForm.effectiveFrom,
          },
        ]}
      >
        <Stack direction="vertical" spacing="md">
          <Input
            label="Name (optional)"
            value={versionForm.name}
            onChange={(e) => setVersionForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Effective from"
            type="date"
            value={versionForm.effectiveFrom}
            onChange={(e) => setVersionForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
          />
          <Input
            label="Effective to (optional)"
            type="date"
            value={versionForm.effectiveTo}
            onChange={(e) => setVersionForm((f) => ({ ...f, effectiveTo: e.target.value }))}
          />
        </Stack>
      </Modal>

      <Modal
        open={showLineModal}
        onClose={() => setShowLineModal(false)}
        title={editingLine ? 'Edit line' : 'Add line'}
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setShowLineModal(false), variant: 'ghost' },
          {
            label: saving ? 'Saving…' : editingLine ? 'Save' : 'Add',
            onClick: submitLine,
            variant: 'primary',
            loading: saving,
            disabled:
              !lineForm.costRoleId.trim() ||
              !lineForm.currencyCode.trim() ||
              !lineForm.costRatePerHour,
          },
        ]}
      >
        <Stack direction="vertical" spacing="md">
          <Input
            label="Cost role ID"
            value={lineForm.costRoleId}
            onChange={(e) => setLineForm((f) => ({ ...f, costRoleId: e.target.value }))}
            helperText="UUID of the cost role from Costing Setup."
          />
          <Input
            label="Seniority level (optional)"
            value={lineForm.seniorityLevel}
            onChange={(e) => setLineForm((f) => ({ ...f, seniorityLevel: e.target.value }))}
            placeholder="SENIOR"
          />
          <Input
            label="Location code (optional)"
            value={lineForm.locationCode}
            onChange={(e) => setLineForm((f) => ({ ...f, locationCode: e.target.value }))}
            placeholder="VN"
          />
          <Input
            label="Currency code"
            value={lineForm.currencyCode}
            onChange={(e) => setLineForm((f) => ({ ...f, currencyCode: e.target.value }))}
            placeholder="USD"
          />
          <Input
            label="Cost rate / hour"
            type="number"
            step="0.01"
            value={lineForm.costRatePerHour}
            onChange={(e) => setLineForm((f) => ({ ...f, costRatePerHour: e.target.value }))}
          />
          <Input
            label="Billing rate / hour (optional)"
            type="number"
            step="0.01"
            value={lineForm.billingRatePerHour}
            onChange={(e) => setLineForm((f) => ({ ...f, billingRatePerHour: e.target.value }))}
          />
          <Input
            label="Notes (optional)"
            value={lineForm.notes}
            onChange={(e) => setLineForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </Stack>
      </Modal>

      <ConfirmDialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction ? confirmCopy[confirmAction.type].title : ''}
        message={confirmAction ? confirmCopy[confirmAction.type].message : ''}
        variant={confirmAction?.type === 'publish' ? 'default' : 'danger'}
        confirmLabel={confirmAction?.type === 'publish' ? 'Publish' : 'Confirm'}
        onConfirm={async () => {
          if (!confirmAction) return
          if (confirmAction.type === 'publish' && confirmAction.targetId) {
            await publishVersion(confirmAction.targetId)
          } else if (confirmAction.type === 'archive-version' && confirmAction.targetId) {
            await archiveVersion(confirmAction.targetId)
          } else if (confirmAction.type === 'archive-card') {
            await archiveRateCard()
          } else if (confirmAction.type === 'deactivate-card') {
            await deactivateRateCard()
          } else if (confirmAction.type === 'delete-line' && confirmAction.targetId) {
            await deleteLine(confirmAction.targetId)
          }
        }}
      />
    </div>
  )
}
