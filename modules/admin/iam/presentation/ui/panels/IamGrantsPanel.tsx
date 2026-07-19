'use client'

import { Ban, Plus, Search } from 'lucide-react'

import { useCallback, useEffect, useState } from 'react'
import { Button, Input, Stack, Typography, Skeleton } from '@/shared/ui'
import { IamStatusBadge } from '../IamStatusBadge'
import { IamSearchField } from '../IamSearchField'
import { iamGrantsApi } from '@/modules/auth/iam'
import type { IamGrant } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function IamGrantsPanel() {
  const [subjectId, setSubjectId] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [items, setItems] = useState<IamGrant[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    subjectType: 'USER',
    subjectId: '',
    resourceId: '',
    roleId: '',
    effect: 'ALLOW',
  })
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await iamGrantsApi.searchGrants({
        subjectId: subjectId.trim() || undefined,
        resourceId: resourceId.trim() || undefined,
        page: 0,
        size: 50,
      })
      setItems(res.items)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [subjectId, resourceId])

  useEffect(() => {
    void load()
  }, [load])

  const revoke = async (grantId: string) => {
    setActingId(grantId)
    try {
      await iamGrantsApi.revokeGrant(grantId)
      toast.success('Grant revoked')
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActingId(null)
    }
  }

  const create = async () => {
    if (!form.subjectId.trim() || !form.resourceId.trim()) {
      toast.error('Subject ID and resource ID are required')
      return
    }
    setCreating(true)
    try {
      await iamGrantsApi.createGrant({
        subjectType: form.subjectType,
        subjectId: form.subjectId.trim(),
        resourceId: form.resourceId.trim(),
        roleId: form.roleId.trim() || undefined,
        effect: form.effect,
      })
      toast.success('Grant created')
      setShowCreate(false)
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <Stack direction="vertical" spacing="md">
      <Stack direction="horizontal" spacing="sm" className="flex-wrap items-center">
        <IamSearchField
          placeholder="Subject ID"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        />
        <IamSearchField
          placeholder="Resource ID"
          value={resourceId}
          onChange={(e) => setResourceId(e.target.value)}
        />
        <Button variant="primary" onClick={() => void load()} icon={<Search size={16} />}>
          Search
        </Button>
        <Button variant="neutral-flat" onClick={() => setShowCreate((v) => !v)} icon={!showCreate ? <Plus size={16} /> : undefined}>{showCreate ? 'Cancel' : 'New grant'}
        </Button>
      </Stack>
      {showCreate && (
        <div className="border border-neutral-200 bg-neutral-50 p-4">
          <Typography as="p" size="sm" weight="medium" className="mb-3">
            Create grant
          </Typography>
          <Stack direction="vertical" spacing="sm" className="max-w-lg">
            <Input
              label="Subject type"
              value={form.subjectType}
              onChange={(e) => setForm((f) => ({ ...f, subjectType: e.target.value }))}
            />
            <Input
              label="Subject ID"
              value={form.subjectId}
              onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
            />
            <Input
              label="Resource ID"
              value={form.resourceId}
              onChange={(e) => setForm((f) => ({ ...f, resourceId: e.target.value }))}
            />
            <Input
              label="Role ID (optional)"
              value={form.roleId}
              onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
            />
            <Button variant="primary" disabled={creating} onClick={() => void create()} icon={<Plus size={16} />}>
              Create
            </Button>
          </Stack>
        </div>
      )}
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={80} />
      ) : (
        <div className="overflow-x-auto border border-neutral-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-3 py-2 font-medium">Subject</th>
                <th className="px-3 py-2 font-medium">Resource</th>
                <th className="px-3 py-2 font-medium">Effect</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="min-w-[12rem] whitespace-nowrap px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((grant) => (
                <tr key={grant.id} className="border-t border-neutral-100">
                  <td className="px-3 py-2">
                    <Typography as="span" variant="small" tone="muted">
                      {grant.subjectType}
                    </Typography>
                    <br />
                    <Typography as="span" variant="small" className="font-mono">
                      {grant.subjectId}
                    </Typography>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{grant.resourceId}</td>
                  <td className="px-3 py-2">{grant.effect}</td>
                  <td className="px-3 py-2">
                    <IamStatusBadge status={grant.status} />
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      variant="ghost"
                      disabled={actingId === grant.id || grant.status !== 'ACTIVE'}
                      onClick={() => void revoke(grant.id)} icon={<Ban size={16} />}>
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center">
                    <Typography variant="small" tone="muted">
                      No grants found
                    </Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Stack>
  )
}
