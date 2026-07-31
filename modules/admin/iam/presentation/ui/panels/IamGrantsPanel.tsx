'use client'

import { Ban, Plus, Search } from 'lucide-react'

import { useCallback, useEffect, useState } from 'react'
import { Button, Select, Stack, Typography, Skeleton, DataTable } from '@/shared/ui'
import { IamStatusBadge } from '../IamStatusBadge'
import { iamGrantsApi } from '@/modules/auth/iam'
import type { IamGrant } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { UserSearchSelect } from '@/modules/platform'
import { IamResourceSearchSelect } from '../IamResourceSearchSelect'
import { IamRoleSearchSelect } from '../IamRoleSearchSelect'

const SUBJECT_TYPE_OPTIONS = [
  { value: 'USER', label: 'User' },
  { value: 'ROLE', label: 'Role' },
]

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
      toast.error('Subject and resource are required')
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
        <div className="min-w-56">
          <UserSearchSelect label="Filter by user" value={subjectId} onChange={setSubjectId} />
        </div>
        <div className="min-w-64">
          <IamResourceSearchSelect
            label="Filter by resource"
            value={resourceId}
            onChange={setResourceId}
          />
        </div>
        <Button variant="primary" onClick={() => void load()} icon={<Search size={16} />}>
          Search
        </Button>
        <Button
          variant="neutral-flat"
          onClick={() => setShowCreate((v) => !v)}
          icon={!showCreate ? <Plus size={16} /> : undefined}
        >
          {showCreate ? 'Cancel' : 'New grant'}
        </Button>
      </Stack>
      {showCreate && (
        <div className="border border-neutral-200 bg-neutral-50 p-4">
          <Typography as="p" size="sm" weight="medium" className="mb-3">
            Create grant
          </Typography>
          <Stack direction="vertical" spacing="sm" className="max-w-lg">
            <Select
              value={form.subjectType}
              options={SUBJECT_TYPE_OPTIONS}
              onValueChange={(subjectType: string) =>
                setForm((current) => ({ ...current, subjectType, subjectId: '' }))
              }
            />
            {form.subjectType === 'USER' ? (
              <UserSearchSelect
                label="User"
                value={form.subjectId}
                onChange={(subjectId) => setForm((current) => ({ ...current, subjectId }))}
              />
            ) : (
              <IamRoleSearchSelect
                label="Subject role"
                value={form.subjectId}
                onChange={(subjectId) => setForm((current) => ({ ...current, subjectId }))}
              />
            )}
            <IamResourceSearchSelect
              value={form.resourceId}
              onChange={(resourceId) => setForm((current) => ({ ...current, resourceId }))}
            />
            <IamRoleSearchSelect
              optional
              value={form.roleId}
              onChange={(roleId) => setForm((current) => ({ ...current, roleId }))}
            />
            <Button
              variant="primary"
              disabled={creating}
              onClick={() => void create()}
              icon={<Plus size={16} />}
            >
              Create
            </Button>
          </Stack>
        </div>
      )}
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={80} />
      ) : (
        <div className="overflow-x-auto border border-neutral-200">
          <DataTable
            ariaLabel="Iam Grants Panel"
            rows={items}
            rowKey={(grant) => String(grant.id)}
            emptyMessage="No items."
            columns={[
              {
                id: 'subject',
                header: 'Subject',
                cell: (grant) => (
                  <>
                    <Typography as="span" variant="small" tone="muted">
                      {grant.subjectType}
                    </Typography>
                  </>
                ),
              },
              {
                id: 'resource',
                header: 'Resource',
                accessor: () => '—',
                kind: 'reference',
                cellClassName: 'text-xs',
              },
              { id: 'effect', header: 'Effect', accessor: 'effect' },
              {
                id: 'status',
                header: 'Status',
                cell: (grant) => (
                  <>
                    <IamStatusBadge status={grant.status} />
                  </>
                ),
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (grant) => (
                  <>
                    <Button
                      variant="ghost"
                      disabled={actingId === grant.id || grant.status !== 'ACTIVE'}
                      onClick={() => void revoke(grant.id)}
                      icon={<Ban size={16} />}
                    >
                      Revoke
                    </Button>
                  </>
                ),
              },
            ]}
          />
        </div>
      )}
    </Stack>
  )
}
