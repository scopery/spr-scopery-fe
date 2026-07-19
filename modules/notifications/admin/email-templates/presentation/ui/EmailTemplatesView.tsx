'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Modal, PageSkeleton, Stack, Typography, Input } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useEmailTemplates } from '../hooks/useEmailTemplates'
import type { CreateEmailTemplatePayload } from '../../domain/model/email-template'

function statusTone(status: string): 'success' | 'neutral' | 'error' {
  if (status === 'ACTIVE') return 'success'
  if (status === 'INACTIVE') return 'neutral'
  return 'error'
}

export function EmailTemplatesView() {
  const { templates, loading, forbidden, actingId, create, activate, deactivate, remove } =
    useEmailTemplates()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)

  if (loading && templates.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don&apos;t have access to email templates</Typography>
      </div>
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return
    setSaving(true)
    try {
      const payload: CreateEmailTemplatePayload = { name: name.trim(), code: code.trim().toUpperCase() }
      await create(payload)
      toast.success('Email template created')
      setName('')
      setCode('')
      setCreateOpen(false)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async (id: string) => {
    try { await activate(id); toast.success('Template activated') }
    catch (err) { toast.error(getProblemToastMessage(err)) }
  }

  const handleDeactivate = async (id: string) => {
    try { await deactivate(id); toast.success('Template deactivated') }
    catch (err) { toast.error(getProblemToastMessage(err)) }
  }

  const handleDelete = async (id: string) => {
    try { await remove(id); toast.success('Template deleted') }
    catch (err) { toast.error(getProblemToastMessage(err)) }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Typography as="h1" size="lg" weight="semibold">Email templates</Typography>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          New template
        </Button>
      </div>

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Code / Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center"><Typography variant="small" tone="muted">No email templates</Typography></td></tr>
            ) : templates.map((t) => (
              <tr key={t.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Typography as="span" variant="small" className="font-mono text-neutral-500">{t.code}</Typography>
                  <Typography as="div" weight="medium">{t.name}</Typography>
                </td>
                <td className="px-4 py-3 text-neutral-500">{t.category ?? '—'}</td>
                <td className="px-4 py-3"><Badge tone={statusTone(t.status)}>{t.status}</Badge></td>
                <td className="px-4 py-3">
                  <Stack direction="horizontal" spacing="sm">
                    {t.status !== 'ACTIVE' && (
                      <Button size="sm" variant="secondary" disabled={actingId === t.id} onClick={() => void handleActivate(t.id)}>Activate</Button>
                    )}
                    {t.status === 'ACTIVE' && (
                      <Button size="sm" variant="ghost" disabled={actingId === t.id} onClick={() => void handleDeactivate(t.id)}>Deactivate</Button>
                    )}
                    <Button size="sm" variant="ghost" tone="error" disabled={actingId === t.id} onClick={() => void handleDelete(t.id)}>Delete</Button>
                  </Stack>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New email template">
        <form onSubmit={(e) => void handleCreate(e)}>
          <Stack direction="vertical" spacing="md">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <Input label="Code" value={code} onChange={(e) => setCode(e.target.value)} required fullWidth placeholder="e.g. WELCOME_EMAIL" />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving || !name.trim() || !code.trim()}>{saving ? 'Creating…' : 'Create'}</Button>
            </div>
          </Stack>
        </form>
      </Modal>
    </div>
  )
}
