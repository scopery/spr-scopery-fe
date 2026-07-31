'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Modal,
  PageSkeleton,
  Stack,
  Typography,
  Input,
  Select,
  DataTable, Card,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useEmailRules } from '../hooks/useEmailRules'
import type { CreateEmailRulePayload } from '../../domain/model/email-rule'
import { useEmailTemplates } from '@/modules/notifications/admin/email-templates'

function statusTone(status: string): 'success' | 'neutral' | 'error' {
  if (status === 'ACTIVE') return 'success'
  if (status === 'INACTIVE') return 'neutral'
  return 'error'
}

export function EmailRulesView() {
  const { rules, loading, forbidden, actingId, create, runAction, remove } = useEmailRules()
  const { templates } = useEmailTemplates()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [triggerEvent, setTriggerEvent] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [priority, setPriority] = useState('0')
  const [saving, setSaving] = useState(false)

  if (loading && rules.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <Card className="p-8 text-center">
        <Typography weight="medium">You don&apos;t have access to email rules</Typography>
      </Card>
    )
  }

  const resetForm = () => {
    setName('')
    setTriggerEvent('')
    setTemplateId('')
    setPriority('0')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !triggerEvent.trim()) return
    setSaving(true)
    try {
      const payload: CreateEmailRulePayload = {
        name: name.trim(),
        triggerEvent: triggerEvent.trim(),
        templateId: templateId.trim() || null,
        priority: parseInt(priority, 10) || 0,
      }
      await create(payload)
      toast.success('Email rule created')
      resetForm()
      setCreateOpen(false)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleAction = async (
    ruleId: string,
    action: 'activate' | 'deactivate' | 'enable' | 'disable',
    label: string
  ) => {
    try {
      await runAction(ruleId, action)
      toast.success(`Rule ${label}`)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await remove(id)
      toast.success('Rule deleted')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Typography as="h1" size="lg" weight="semibold">
          Email rules
        </Typography>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          New rule
        </Button>
      </div>

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Email Rules"
          rows={rules}
          rowKey={(r) => String(r.id)}
          emptyMessage="No items."
          columns={[
            {
              id: 'name',
              header: 'Name',
              cell: (r) => (
                <>
                  <Typography weight="medium">{r.name}</Typography>
                  {r.mandatory && (
                    <Badge tone="warning" className="mt-1">
                      Mandatory
                    </Badge>
                  )}
                </>
              ),
            },
            {
              id: 'trigger-event',
              header: 'Trigger event',
              accessor: 'triggerEvent',
              cellClassName: 'text-xs text-neutral-500',
            },
            {
              id: 'priority',
              header: 'Priority',
              accessor: 'priority',
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
                  <Badge tone={r.enabled ? 'success' : 'neutral'}>{r.enabled ? 'On' : 'Off'}</Badge>
                </>
              ),
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (r) => (
                <>
                  <Stack direction="horizontal" spacing="sm">
                    {r.status !== 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={actingId === r.id}
                        onClick={() => void handleAction(r.id, 'activate', 'activated')}
                      >
                        Activate
                      </Button>
                    )}
                    {r.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actingId === r.id}
                        onClick={() => void handleAction(r.id, 'deactivate', 'deactivated')}
                      >
                        Deactivate
                      </Button>
                    )}
                    {r.enabled ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actingId === r.id}
                        onClick={() => void handleAction(r.id, 'disable', 'disabled')}
                      >
                        Disable
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actingId === r.id}
                        onClick={() => void handleAction(r.id, 'enable', 'enabled')}
                      >
                        Enable
                      </Button>
                    )}
                    {!r.mandatory && (
                      <Button
                        size="sm"
                        variant="ghost"
                        tone="error"
                        disabled={actingId === r.id}
                        onClick={() => void handleDelete(r.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </Stack>
                </>
              ),
            },
          ]}
        />
      </div>

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          resetForm()
        }}
        title="New email rule"
      >
        <form onSubmit={(e) => void handleCreate(e)}>
          <Stack direction="vertical" spacing="md">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <Input
              label="Trigger event"
              value={triggerEvent}
              onChange={(e) => setTriggerEvent(e.target.value)}
              required
              fullWidth
              placeholder="e.g. PROJECT_CREATED"
            />
            <Select
              label="Template (optional)"
              value={templateId}
              options={[
                { value: '', label: 'No template' },
                ...templates.map((template) => ({
                  value: template.id,
                  label: `${template.code} · ${template.name}`,
                })),
              ]}
              onValueChange={setTemplateId}
            />
            <Input
              label="Priority"
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              fullWidth
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCreateOpen(false)
                  resetForm()
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving || !name.trim() || !triggerEvent.trim()}
              >
                {saving ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </Stack>
        </form>
      </Modal>
    </div>
  )
}
