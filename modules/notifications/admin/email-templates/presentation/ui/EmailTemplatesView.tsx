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
  DataTable, Card,
} from '@/shared/ui'
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
      <Card className="p-8 text-center">
        <Typography weight="medium">You don&apos;t have access to email templates</Typography>
      </Card>
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return
    setSaving(true)
    try {
      const payload: CreateEmailTemplatePayload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
      }
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
    try {
      await activate(id)
      toast.success('Template activated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleDeactivate = async (id: string) => {
    try {
      await deactivate(id)
      toast.success('Template deactivated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await remove(id)
      toast.success('Template deleted')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Typography as="h1" size="lg" weight="semibold">
          Email templates
        </Typography>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          New template
        </Button>
      </div>

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Email Templates"
          rows={templates}
          rowKey={(t) => String(t.id)}
          emptyMessage="No items."
          columns={[
            {
              id: 'code-name',
              header: 'Code / Name',
              cell: (t) => (
                <>
                  <Typography as="span" variant="small" className="font-normal text-neutral-500">
                    {t.code}
                  </Typography>
                  <Typography as="div" weight="medium">
                    {t.name}
                  </Typography>
                </>
              ),
              kind: 'code',
            },
            {
              id: 'category',
              header: 'Category',
              cell: (t) => <>{t.category ?? '—'}</>,
              cellClassName: 'text-neutral-500',
            },
            {
              id: 'status',
              header: 'Status',
              cell: (t) => (
                <>
                  <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                </>
              ),
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (t) => (
                <>
                  <Stack direction="horizontal" spacing="sm">
                    {t.status !== 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={actingId === t.id}
                        onClick={() => void handleActivate(t.id)}
                      >
                        Activate
                      </Button>
                    )}
                    {t.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actingId === t.id}
                        onClick={() => void handleDeactivate(t.id)}
                      >
                        Deactivate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      tone="error"
                      disabled={actingId === t.id}
                      onClick={() => void handleDelete(t.id)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </>
              ),
            },
          ]}
        />
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New email template">
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
              label="Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              fullWidth
              placeholder="e.g. WELCOME_EMAIL"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving || !name.trim() || !code.trim()}
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
