'use client'

import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Input, Select, Stack, Textarea, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { cn } from '@/utils/cn'
import type { DecisionRecord } from '../../domain/model/decision'
import {
  canDecideDecision,
  canRejectDecision,
  canSupersedeDecision,
  decisionStatusLabel,
} from '../../domain/rules/decision.rules'
import { useDecisionDetail } from '../hooks/useDecisionDetail'
import { CommentThreadsPanel } from '@/modules/projects/comments'

type DrawerTab = 'options' | 'impact' | 'links' | 'comments'

const LINK_TYPE_OPTIONS = [
  { value: 'RELATED_TO', label: 'Related to' },
  { value: 'BLOCKED_BY', label: 'Blocked by' },
  { value: 'BLOCKS', label: 'Blocks' },
  { value: 'DUPLICATE_OF', label: 'Duplicate of' },
]

const LINK_TARGET_OPTIONS = [
  { value: 'RAID_ITEM', label: 'RAID item' },
  { value: 'TASK', label: 'Task' },
  { value: 'DELIVERABLE', label: 'Deliverable' },
]

interface Props {
  projectId: string | null
  decision: DecisionRecord | null
  open: boolean
  onClose: () => void
  onUpdated: (decision: DecisionRecord) => void
}

export function DecisionDetailDrawer({ projectId, decision, open, onClose, onUpdated }: Props) {
  const [note, setNote] = useState('')
  const [tab, setTab] = useState<DrawerTab>('options')

  const [scheduleImpact, setScheduleImpact] = useState('')
  const [costImpact, setCostImpact] = useState('')
  const [scopeImpact, setScopeImpact] = useState('')
  const [impactDesc, setImpactDesc] = useState('')
  const [savingImpact, setSavingImpact] = useState(false)

  const [linkTargetType, setLinkTargetType] = useState('RAID_ITEM')
  const [linkTargetId, setLinkTargetId] = useState('')
  const [linkType, setLinkType] = useState('RELATED_TO')

  const {
    options,
    impact,
    links,
    loading,
    acting,
    decide,
    reject,
    supersede,
    archive,
    deleteOption,
    updateImpact,
    addLink,
    removeLink,
  } = useDecisionDetail(projectId, decision?.id ?? null)

  if (!open || !decision) return null

  const handleDecide = async () => {
    try {
      const updated = await decide(note.trim() || undefined)
      if (updated) onUpdated(updated)
      toast.success('Decision recorded')
      setNote('')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleReject = async () => {
    try {
      const updated = await reject(note.trim() || undefined)
      if (updated) onUpdated(updated)
      toast.success('Decision rejected')
      setNote('')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleSupersede = async () => {
    try {
      const updated = await supersede(note.trim() || undefined)
      if (updated) onUpdated(updated)
      toast.success('Decision superseded')
      setNote('')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleArchive = async () => {
    try {
      const updated = await archive()
      if (updated) onUpdated(updated)
      toast.success('Decision archived')
      onClose()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleDeleteOption = async (optionId: string) => {
    try {
      await deleteOption(optionId)
      toast.success('Option removed')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleSaveImpact = async () => {
    setSavingImpact(true)
    try {
      await updateImpact({
        scheduleDaysImpact: scheduleImpact ? Number(scheduleImpact) : null,
        costImpact: costImpact ? Number(costImpact) : null,
        scopeImpact: scopeImpact.trim() || null,
        description: impactDesc.trim() || null,
      })
      toast.success('Impact saved')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSavingImpact(false)
    }
  }

  const handleAddLink = async () => {
    if (!linkTargetId.trim()) return
    try {
      await addLink({ targetType: linkTargetType, targetId: linkTargetId.trim(), linkType })
      setLinkTargetId('')
      toast.success('Link added')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleRemoveLink = async (linkId: string) => {
    try {
      await removeLink(linkId)
      toast.success('Link removed')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const TABS: { id: DrawerTab; label: string }[] = [
    { id: 'options', label: 'Options' },
    { id: 'impact', label: 'Impact' },
    { id: 'links', label: 'Links' },
    { id: 'comments', label: 'Comments' },
  ]

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-neutral-900/[0.18] motion-drawer-backdrop"
        aria-hidden
        onClick={onClose}
      />
      <aside
        className="drawer fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-xl motion-drawer-panel"
        role="dialog"
        aria-label="Decision detail"
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4">
          <div className="min-w-0">
            <Typography variant="small" className="font-mono text-neutral-500">
              {decision.code}
            </Typography>
            <Typography as="h2" weight="semibold" className="truncate">
              {decision.title}
            </Typography>
            <Stack direction="horizontal" spacing="sm" className="mt-2 items-center">
              <Badge tone={decision.status === 'DECIDED' ? 'success' : 'neutral'}>
                {decisionStatusLabel(decision.status)}
              </Badge>
              {decision.category ? <Badge tone="neutral">{decision.category}</Badge> : null}
            </Stack>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Close"
            onClick={onClose}
            icon={<X size={16} />}
          />
        </div>

        <div className="border-b border-neutral-200 px-5">
          <nav className="flex gap-1">
            {TABS.map((t) => {
              const active = t.id === tab
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  )}
                >
                  {t.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'options' && (
            <div className="space-y-4">
              <div>
                <Typography variant="small" tone="muted">Rationale</Typography>
                <Typography className="mt-1 whitespace-pre-wrap">{decision.rationale || '—'}</Typography>
              </div>
              {decision.outcome ? (
                <div>
                  <Typography variant="small" tone="muted">Outcome</Typography>
                  <Typography className="mt-1 whitespace-pre-wrap">{decision.outcome}</Typography>
                </div>
              ) : null}
              <div>
                <Typography variant="small" tone="muted" className="mb-2">Options</Typography>
                {loading ? (
                  <Typography variant="small" tone="muted">Loading…</Typography>
                ) : options.length === 0 ? (
                  <Typography variant="small" tone="muted">No options recorded</Typography>
                ) : (
                  <ul className="space-y-2">
                    {options.map((o) => (
                      <li
                        key={o.id}
                        className="flex items-start justify-between gap-2 border border-neutral-200 p-3"
                      >
                        <div className="min-w-0">
                          <Typography weight="medium" className="truncate">{o.optionTitle}</Typography>
                          {o.optionDescription ? (
                            <Typography variant="small" tone="muted">{o.optionDescription}</Typography>
                          ) : null}
                        </div>
                        <Stack direction="horizontal" spacing="sm" className="shrink-0 items-center">
                          {o.selectedFlag ? <Badge tone="success">Selected</Badge> : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            tone="error"
                            disabled={acting}
                            onClick={() => void handleDeleteOption(o.id)}
                          >
                            Remove
                          </Button>
                        </Stack>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {tab === 'impact' && (
            <div className="space-y-4">
              <div>
                <Typography variant="small" weight="medium" className="mb-1">Schedule days impact</Typography>
                <Input
                  type="number"
                  value={scheduleImpact}
                  onChange={(e) => setScheduleImpact(e.target.value)}
                  placeholder={impact?.scheduleDaysImpact != null ? String(impact.scheduleDaysImpact) : '0'}
                />
              </div>
              <div>
                <Typography variant="small" weight="medium" className="mb-1">Cost impact</Typography>
                <Input
                  type="number"
                  value={costImpact}
                  onChange={(e) => setCostImpact(e.target.value)}
                  placeholder={impact?.costImpact != null ? String(impact.costImpact) : '0'}
                />
              </div>
              <div>
                <Typography variant="small" weight="medium" className="mb-1">Scope impact</Typography>
                <Input
                  value={scopeImpact}
                  onChange={(e) => setScopeImpact(e.target.value)}
                  placeholder={impact?.scopeImpact ?? 'Describe scope impact'}
                />
              </div>
              <div>
                <Typography variant="small" weight="medium" className="mb-1">Description</Typography>
                <Textarea
                  value={impactDesc}
                  onChange={(e) => setImpactDesc(e.target.value)}
                  placeholder={impact?.description ?? 'Additional context'}
                  rows={3}
                  fullWidth
                />
              </div>
              <Button variant="primary" size="sm" disabled={savingImpact} onClick={() => void handleSaveImpact()}>
                {savingImpact ? 'Saving…' : 'Save impact'}
              </Button>
            </div>
          )}

          {tab === 'comments' && projectId && (
            <CommentThreadsPanel
              projectId={projectId}
              targetType="DECISION"
              targetId={decision.id}
            />
          )}

          {tab === 'links' && (
            <div className="space-y-4">
              <div className="space-y-2 rounded border border-neutral-200 p-3">
                <Typography variant="small" weight="medium">Add link</Typography>
                <Select
                  value={linkType}
                  onValueChange={setLinkType}
                  options={LINK_TYPE_OPTIONS}
                />
                <Select
                  value={linkTargetType}
                  onValueChange={setLinkTargetType}
                  options={LINK_TARGET_OPTIONS}
                />
                <div className="flex gap-2">
                  <Input
                    value={linkTargetId}
                    onChange={(e) => setLinkTargetId(e.target.value)}
                    placeholder="Target ID"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Plus size={14} />}
                    disabled={!linkTargetId.trim()}
                    onClick={() => void handleAddLink()}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {loading ? (
                <Typography variant="small" tone="muted">Loading…</Typography>
              ) : links.length === 0 ? (
                <Typography variant="small" tone="muted">No links yet</Typography>
              ) : (
                <ul className="space-y-2">
                  {links.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-2 border border-neutral-200 px-3 py-2">
                      <div>
                        <Badge tone="neutral">{l.linkType.replace(/_/g, ' ')}</Badge>
                        <Typography variant="small" tone="muted" className="mt-0.5">
                          {l.targetType.replace(/_/g, ' ')} · {l.targetId}
                        </Typography>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        tone="error"
                        icon={<Trash2 size={14} />}
                        onClick={() => void handleRemoveLink(l.id)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-neutral-200 px-5 py-4">
          {(canDecideDecision(decision) ||
            canRejectDecision(decision) ||
            canSupersedeDecision(decision)) && (
            <Textarea
              placeholder="Optional note / outcome / reason"
              fullWidth
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          )}
          <Stack direction="horizontal" spacing="sm" className="flex-wrap">
            {canDecideDecision(decision) ? (
              <Button size="sm" variant="primary" disabled={acting} onClick={() => void handleDecide()}>
                Decide
              </Button>
            ) : null}
            {canRejectDecision(decision) ? (
              <Button size="sm" variant="secondary" disabled={acting} onClick={() => void handleReject()}>
                Reject
              </Button>
            ) : null}
            {canSupersedeDecision(decision) ? (
              <Button size="sm" variant="secondary" disabled={acting} onClick={() => void handleSupersede()}>
                Supersede
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              disabled={acting || decision.status === 'ARCHIVED'}
              onClick={() => void handleArchive()}
            >
              Archive
            </Button>
          </Stack>
        </div>
      </aside>
    </>
  )
}
