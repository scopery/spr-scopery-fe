'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Input, Modal, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useAutomationRules } from '../hooks/useAutomationRules'
import type { CreateReminderRulePayload } from '../../domain/model/reminder-rule'
import type { CreateAlertRulePayload } from '../../domain/model/alert-rule'
import type { CreateDigestRulePayload } from '../../domain/model/digest-rule'

type TabKey = 'reminders' | 'alerts' | 'digests' | 'runs'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'reminders', label: 'Reminder Rules' },
  { key: 'alerts', label: 'Alert Rules' },
  { key: 'digests', label: 'Digest Rules' },
  { key: 'runs', label: 'Digest Runs' },
]

function statusTone(status: string): 'success' | 'neutral' {
  return status === 'ACTIVE' ? 'success' : 'neutral'
}

interface AutomationRulesViewProps {
  workspaceId: string
}

export function AutomationRulesView({ workspaceId }: AutomationRulesViewProps) {
  const {
    reminderRules,
    alertRules,
    digestRules,
    digestRuns,
    loading,
    forbidden,
    createReminderRule,
    createAlertRule,
    createDigestRule,
  } = useAutomationRules(workspaceId)

  const [activeTab, setActiveTab] = useState<TabKey>('reminders')

  // Reminder rule form state
  const [reminderOpen, setReminderOpen] = useState(false)
  const [reminderName, setReminderName] = useState('')
  const [reminderTrigger, setReminderTrigger] = useState('')
  const [reminderOffset, setReminderOffset] = useState('0')
  const [reminderChannel, setReminderChannel] = useState('')
  const [reminderSaving, setReminderSaving] = useState(false)

  // Alert rule form state
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertName, setAlertName] = useState('')
  const [alertTrigger, setAlertTrigger] = useState('')
  const [alertSeverity, setAlertSeverity] = useState('')
  const [alertChannel, setAlertChannel] = useState('')
  const [alertSaving, setAlertSaving] = useState(false)

  // Digest rule form state
  const [digestOpen, setDigestOpen] = useState(false)
  const [digestName, setDigestName] = useState('')
  const [digestSchedule, setDigestSchedule] = useState('')
  const [digestChannel, setDigestChannel] = useState('')
  const [digestSaving, setDigestSaving] = useState(false)

  const isEmpty =
    reminderRules.length === 0 &&
    alertRules.length === 0 &&
    digestRules.length === 0 &&
    digestRuns.length === 0

  if (loading && isEmpty) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don&apos;t have access to automation rules</Typography>
      </div>
    )
  }

  // Reminder handlers
  const resetReminderForm = () => {
    setReminderName('')
    setReminderTrigger('')
    setReminderOffset('0')
    setReminderChannel('')
  }

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reminderName.trim() || !reminderTrigger.trim()) return
    setReminderSaving(true)
    try {
      const payload: CreateReminderRulePayload = {
        name: reminderName.trim(),
        triggerCondition: reminderTrigger.trim(),
        offsetMinutes: parseInt(reminderOffset, 10) || 0,
        ...(reminderChannel.trim() ? { channel: reminderChannel.trim() } : {}),
      }
      await createReminderRule(payload)
      toast.success('Reminder rule created')
      resetReminderForm()
      setReminderOpen(false)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setReminderSaving(false)
    }
  }

  // Alert handlers
  const resetAlertForm = () => {
    setAlertName('')
    setAlertTrigger('')
    setAlertSeverity('')
    setAlertChannel('')
  }

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!alertName.trim() || !alertTrigger.trim()) return
    setAlertSaving(true)
    try {
      const payload: CreateAlertRulePayload = {
        name: alertName.trim(),
        triggerCondition: alertTrigger.trim(),
        ...(alertSeverity.trim() ? { severity: alertSeverity.trim() } : {}),
        ...(alertChannel.trim() ? { channel: alertChannel.trim() } : {}),
      }
      await createAlertRule(payload)
      toast.success('Alert rule created')
      resetAlertForm()
      setAlertOpen(false)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setAlertSaving(false)
    }
  }

  // Digest handlers
  const resetDigestForm = () => {
    setDigestName('')
    setDigestSchedule('')
    setDigestChannel('')
  }

  const handleCreateDigest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!digestName.trim() || !digestSchedule.trim()) return
    setDigestSaving(true)
    try {
      const payload: CreateDigestRulePayload = {
        name: digestName.trim(),
        schedule: digestSchedule.trim(),
        ...(digestChannel.trim() ? { channel: digestChannel.trim() } : {}),
      }
      await createDigestRule(payload)
      toast.success('Digest rule created')
      resetDigestForm()
      setDigestOpen(false)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setDigestSaving(false)
    }
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6 flex gap-1 border-b border-neutral-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={[
              'px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-neutral-500 hover:text-neutral-800',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reminder Rules tab */}
      {activeTab === 'reminders' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <Typography as="h2" size="lg" weight="bold">Reminder rules</Typography>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setReminderOpen(true)}>
              New reminder rule
            </Button>
          </div>

          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Trigger Condition</th>
                  <th className="px-4 py-3 font-medium">Offset (minutes)</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {reminderRules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <Typography variant="small" tone="muted">No reminder rules</Typography>
                    </td>
                  </tr>
                ) : reminderRules.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3"><Typography weight="medium">{r.name}</Typography></td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{r.triggerCondition}</td>
                    <td className="px-4 py-3 text-neutral-500">{r.offsetMinutes}</td>
                    <td className="px-4 py-3 text-neutral-500">{r.channel || '—'}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                    <td className="px-4 py-3">
                      <Badge tone={r.enabled ? 'success' : 'neutral'}>{r.enabled ? 'On' : 'Off'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Modal
            open={reminderOpen}
            onClose={() => { setReminderOpen(false); resetReminderForm() }}
            title="New reminder rule"
          >
            <form onSubmit={(e) => void handleCreateReminder(e)}>
              <Stack direction="vertical" spacing="md">
                <Input
                  label="Name"
                  value={reminderName}
                  onChange={(e) => setReminderName(e.target.value)}
                  required
                  fullWidth
                />
                <Input
                  label="Trigger Condition"
                  value={reminderTrigger}
                  onChange={(e) => setReminderTrigger(e.target.value)}
                  required
                  fullWidth
                  placeholder="e.g. TASK_DUE"
                />
                <Input
                  label="Offset Minutes"
                  type="number"
                  value={reminderOffset}
                  onChange={(e) => setReminderOffset(e.target.value)}
                  fullWidth
                />
                <Input
                  label="Channel (optional)"
                  value={reminderChannel}
                  onChange={(e) => setReminderChannel(e.target.value)}
                  fullWidth
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setReminderOpen(false); resetReminderForm() }}
                    disabled={reminderSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={reminderSaving || !reminderName.trim() || !reminderTrigger.trim()}
                  >
                    {reminderSaving ? 'Creating…' : 'Create'}
                  </Button>
                </div>
              </Stack>
            </form>
          </Modal>
        </div>
      )}

      {/* Alert Rules tab */}
      {activeTab === 'alerts' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <Typography as="h2" size="lg" weight="bold">Alert rules</Typography>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setAlertOpen(true)}>
              New alert rule
            </Button>
          </div>

          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Trigger Condition</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {alertRules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <Typography variant="small" tone="muted">No alert rules</Typography>
                    </td>
                  </tr>
                ) : alertRules.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3"><Typography weight="medium">{r.name}</Typography></td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{r.triggerCondition}</td>
                    <td className="px-4 py-3 text-neutral-500">{r.severity || '—'}</td>
                    <td className="px-4 py-3 text-neutral-500">{r.channel || '—'}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                    <td className="px-4 py-3">
                      <Badge tone={r.enabled ? 'success' : 'neutral'}>{r.enabled ? 'On' : 'Off'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Modal
            open={alertOpen}
            onClose={() => { setAlertOpen(false); resetAlertForm() }}
            title="New alert rule"
          >
            <form onSubmit={(e) => void handleCreateAlert(e)}>
              <Stack direction="vertical" spacing="md">
                <Input
                  label="Name"
                  value={alertName}
                  onChange={(e) => setAlertName(e.target.value)}
                  required
                  fullWidth
                />
                <Input
                  label="Trigger Condition"
                  value={alertTrigger}
                  onChange={(e) => setAlertTrigger(e.target.value)}
                  required
                  fullWidth
                  placeholder="e.g. THRESHOLD_EXCEEDED"
                />
                <Input
                  label="Severity (optional)"
                  value={alertSeverity}
                  onChange={(e) => setAlertSeverity(e.target.value)}
                  fullWidth
                  placeholder="e.g. HIGH"
                />
                <Input
                  label="Channel (optional)"
                  value={alertChannel}
                  onChange={(e) => setAlertChannel(e.target.value)}
                  fullWidth
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setAlertOpen(false); resetAlertForm() }}
                    disabled={alertSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={alertSaving || !alertName.trim() || !alertTrigger.trim()}
                  >
                    {alertSaving ? 'Creating…' : 'Create'}
                  </Button>
                </div>
              </Stack>
            </form>
          </Modal>
        </div>
      )}

      {/* Digest Rules tab */}
      {activeTab === 'digests' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <Typography as="h2" size="lg" weight="bold">Digest rules</Typography>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setDigestOpen(true)}>
              New digest rule
            </Button>
          </div>

          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Schedule</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {digestRules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <Typography variant="small" tone="muted">No digest rules</Typography>
                    </td>
                  </tr>
                ) : digestRules.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3"><Typography weight="medium">{r.name}</Typography></td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{r.schedule}</td>
                    <td className="px-4 py-3 text-neutral-500">{r.channel || '—'}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                    <td className="px-4 py-3">
                      <Badge tone={r.enabled ? 'success' : 'neutral'}>{r.enabled ? 'On' : 'Off'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Modal
            open={digestOpen}
            onClose={() => { setDigestOpen(false); resetDigestForm() }}
            title="New digest rule"
          >
            <form onSubmit={(e) => void handleCreateDigest(e)}>
              <Stack direction="vertical" spacing="md">
                <Input
                  label="Name"
                  value={digestName}
                  onChange={(e) => setDigestName(e.target.value)}
                  required
                  fullWidth
                />
                <Input
                  label="Schedule"
                  value={digestSchedule}
                  onChange={(e) => setDigestSchedule(e.target.value)}
                  required
                  fullWidth
                  placeholder="e.g. DAILY_9AM"
                />
                <Input
                  label="Channel (optional)"
                  value={digestChannel}
                  onChange={(e) => setDigestChannel(e.target.value)}
                  fullWidth
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setDigestOpen(false); resetDigestForm() }}
                    disabled={digestSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={digestSaving || !digestName.trim() || !digestSchedule.trim()}
                  >
                    {digestSaving ? 'Creating…' : 'Create'}
                  </Button>
                </div>
              </Stack>
            </form>
          </Modal>
        </div>
      )}

      {/* Digest Runs tab */}
      {activeTab === 'runs' && (
        <div>
          <div className="mb-4">
            <Typography as="h2" size="lg" weight="bold">Digest runs</Typography>
          </div>

          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Rule ID</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Started</th>
                  <th className="px-4 py-3 font-medium">Completed</th>
                  <th className="px-4 py-3 font-medium">Recipients</th>
                </tr>
              </thead>
              <tbody>
                {digestRuns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <Typography variant="small" tone="muted">No digest runs</Typography>
                    </td>
                  </tr>
                ) : digestRuns.map((run) => (
                  <tr key={run.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{run.ruleId}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(run.status)}>{run.status}</Badge></td>
                    <td className="px-4 py-3 text-neutral-500">{run.startedAt}</td>
                    <td className="px-4 py-3 text-neutral-500">{run.completedAt ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {run.recipientCount !== null ? run.recipientCount : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
