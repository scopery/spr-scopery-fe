'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Input,
  Modal,
  PageSkeleton,
  Stack,
  Typography,
  DataTable, Card,
} from '@/shared/ui'
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
      <Card className="p-8 text-center">
        <Typography weight="medium">You don&apos;t have access to automation rules</Typography>
      </Card>
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
            <Typography as="h2" size="lg" weight="bold">
              Reminder rules
            </Typography>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setReminderOpen(true)}
            >
              New reminder rule
            </Button>
          </div>

          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <DataTable
              ariaLabel="Automation Rules"
              rows={reminderRules}
              rowKey={(r) => String(r.id)}
              emptyMessage="No items."
              columns={[
                {
                  id: 'name',
                  header: 'Name',
                  cell: (r) => (
                    <>
                      <Typography weight="medium">{r.name}</Typography>
                    </>
                  ),
                },
                {
                  id: 'trigger-condition',
                  header: 'Trigger Condition',
                  accessor: 'triggerCondition',
                  cellClassName: 'text-xs text-neutral-500',
                },
                {
                  id: 'offset-minutes-',
                  header: 'Offset (minutes)',
                  accessor: 'offsetMinutes',
                  cellClassName: 'text-neutral-500',
                },
                {
                  id: 'channel',
                  header: 'Channel',
                  cell: (r) => <>{r.channel || '—'}</>,
                  cellClassName: 'text-neutral-500',
                },
                {
                  id: 'status',
                  header: 'Status',
                  cell: (r) => (
                    <>
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    </>
                  ),
                },
                {
                  id: 'enabled',
                  header: 'Enabled',
                  cell: (r) => (
                    <>
                      <Badge tone={r.enabled ? 'success' : 'neutral'}>
                        {r.enabled ? 'On' : 'Off'}
                      </Badge>
                    </>
                  ),
                },
              ]}
            />
          </div>

          <Modal
            open={reminderOpen}
            onClose={() => {
              setReminderOpen(false)
              resetReminderForm()
            }}
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
                    onClick={() => {
                      setReminderOpen(false)
                      resetReminderForm()
                    }}
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
            <Typography as="h2" size="lg" weight="bold">
              Alert rules
            </Typography>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setAlertOpen(true)}>
              New alert rule
            </Button>
          </div>

          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <DataTable
              ariaLabel="Automation Rules"
              rows={alertRules}
              rowKey={(r) => String(r.id)}
              emptyMessage="No items."
              columns={[
                {
                  id: 'name',
                  header: 'Name',
                  cell: (r) => (
                    <>
                      <Typography weight="medium">{r.name}</Typography>
                    </>
                  ),
                },
                {
                  id: 'trigger-condition',
                  header: 'Trigger Condition',
                  accessor: 'triggerCondition',
                  cellClassName: 'text-xs text-neutral-500',
                },
                {
                  id: 'severity',
                  header: 'Severity',
                  cell: (r) => <>{r.severity || '—'}</>,
                  cellClassName: 'text-neutral-500',
                },
                {
                  id: 'channel',
                  header: 'Channel',
                  cell: (r) => <>{r.channel || '—'}</>,
                  cellClassName: 'text-neutral-500',
                },
                {
                  id: 'status',
                  header: 'Status',
                  cell: (r) => (
                    <>
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    </>
                  ),
                },
                {
                  id: 'enabled',
                  header: 'Enabled',
                  cell: (r) => (
                    <>
                      <Badge tone={r.enabled ? 'success' : 'neutral'}>
                        {r.enabled ? 'On' : 'Off'}
                      </Badge>
                    </>
                  ),
                },
              ]}
            />
          </div>

          <Modal
            open={alertOpen}
            onClose={() => {
              setAlertOpen(false)
              resetAlertForm()
            }}
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
                    onClick={() => {
                      setAlertOpen(false)
                      resetAlertForm()
                    }}
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
            <Typography as="h2" size="lg" weight="bold">
              Digest rules
            </Typography>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setDigestOpen(true)}>
              New digest rule
            </Button>
          </div>

          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <DataTable
              ariaLabel="Automation Rules"
              rows={digestRules}
              rowKey={(r) => String(r.id)}
              emptyMessage="No items."
              columns={[
                {
                  id: 'name',
                  header: 'Name',
                  cell: (r) => (
                    <>
                      <Typography weight="medium">{r.name}</Typography>
                    </>
                  ),
                },
                {
                  id: 'schedule',
                  header: 'Schedule',
                  accessor: 'schedule',
                  cellClassName: 'text-xs text-neutral-500',
                },
                {
                  id: 'channel',
                  header: 'Channel',
                  cell: (r) => <>{r.channel || '—'}</>,
                  cellClassName: 'text-neutral-500',
                },
                {
                  id: 'status',
                  header: 'Status',
                  cell: (r) => (
                    <>
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    </>
                  ),
                },
                {
                  id: 'enabled',
                  header: 'Enabled',
                  cell: (r) => (
                    <>
                      <Badge tone={r.enabled ? 'success' : 'neutral'}>
                        {r.enabled ? 'On' : 'Off'}
                      </Badge>
                    </>
                  ),
                },
              ]}
            />
          </div>

          <Modal
            open={digestOpen}
            onClose={() => {
              setDigestOpen(false)
              resetDigestForm()
            }}
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
                    onClick={() => {
                      setDigestOpen(false)
                      resetDigestForm()
                    }}
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
            <Typography as="h2" size="lg" weight="bold">
              Digest runs
            </Typography>
          </div>

          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <DataTable
              ariaLabel="Automation Rules"
              rows={digestRuns}
              rowKey={(run) => String(run.id)}
              emptyMessage="No items."
              columns={[
                {
                  id: 'rule-id',
                  header: 'Rule ID',
                  accessor: () => '—',
                  kind: 'reference',
                  cellClassName: 'text-xs text-neutral-500',
                },
                {
                  id: 'status',
                  header: 'Status',
                  cell: (run) => (
                    <>
                      <Badge tone={statusTone(run.status)}>{run.status}</Badge>
                    </>
                  ),
                },
                {
                  id: 'started',
                  header: 'Started',
                  accessor: 'startedAt',
                  cellClassName: 'text-neutral-500',
                },
                {
                  id: 'completed',
                  header: 'Completed',
                  cell: (run) => <>{run.completedAt ?? '—'}</>,
                  cellClassName: 'text-neutral-500',
                },
                {
                  id: 'recipients',
                  header: 'Recipients',
                  cell: (run) => <>{run.recipientCount !== null ? run.recipientCount : '—'}</>,
                  cellClassName: 'text-neutral-500',
                },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  )
}
