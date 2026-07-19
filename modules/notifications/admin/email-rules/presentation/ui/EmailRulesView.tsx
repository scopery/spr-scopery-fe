'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Modal, PageSkeleton, Stack, Typography, Input, Select } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useEmailRules } from '../hooks/useEmailRules'
import type { CreateEmailRulePayload } from '../../domain/model/email-rule'

function statusTone(status: string): 'success' | 'neutral' | 'error' {
  if (status === 'ACTIVE') return 'success'
  if (status === 'INACTIVE') return 'neutral'
  return 'error'
}

export function EmailRulesView() {
  const { rules, loading, forbidden, actingId, create, runAction, remove } = useEmailRules()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [triggerEvent, setTriggerEvent] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [priority, setPriority] = useState('0')
  const [saving, setSaving] = useState(false)

  if (loading && rules.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don&apos;t have access to email rules</Typography>
      </div>
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
    label: string,
  ) => {
    try {
      await runAction(ruleId, action)
      toast.success(`Rule ${label}`)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleDelete = async (id: string) => {
    try { await remove(id); toast.success('Rule deleted') }
    catch (err) { toast.error(getProblemToastMessage(err)) }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Typography as="h1" size="lg" weight="semibold">Email rules</Typography>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          New rule
        </Button>
      </div>

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Trigger event</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Enabled</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <Typography variant="small" tone="muted">No email rules</Typography>
                </td>
              </tr>
            ) : rules.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Typography weight="medium">{r.name}</Typography>
                  {r.mandatory && <Badge tone="warning" className="mt-1">Mandatory</Badge>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-500">{r.triggerEvent}</td>
                <td className="px-4 py-3 text-neutral-500">{r.priority}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={r.enabled ? 'success' : 'neutral'}>{r.enabled ? 'On' : 'Off'}</Badge>
                </td>
                <td className="px-4 py-3">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={createOpen} onClose={() => { setCreateOpen(false); resetForm() }} title="New email rule">
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
            <Input
              label="Template ID (optional)"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              fullWidth
            />
            <Input
              label="Priority"
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              fullWidth
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => { setCreateOpen(false); resetForm() }} disabled={saving}>
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
