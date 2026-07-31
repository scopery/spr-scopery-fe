'use client'

import { Ban, Check, Plus, Search, Trash2 } from 'lucide-react'

import { useCallback, useEffect, useState } from 'react'
import { Typography, Button, Input, Stack, Skeleton, DataTable } from '@/shared/ui'
import { IamStatusBadge } from '../IamStatusBadge'
import { IamSearchField } from '../IamSearchField'
import { iamRolesApi } from '@/modules/auth/iam'
import type { IamRole } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function IamRolesPanel() {
  const [keyword, setKeyword] = useState('')
  const [items, setItems] = useState<IamRole[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createCode, setCreateCode] = useState('')
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await iamRolesApi.searchRoles({
        keyword: keyword.trim() || undefined,
        page: 0,
        size: 50,
      })
      setItems(res.items)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [keyword])

  useEffect(() => {
    void load()
  }, [load])

  const runAction = async (roleId: string, action: 'activate' | 'deactivate' | 'softDelete') => {
    setActingId(roleId)
    try {
      if (action === 'activate') await iamRolesApi.activateRole(roleId)
      if (action === 'deactivate') await iamRolesApi.deactivateRole(roleId)
      if (action === 'softDelete') await iamRolesApi.softDeleteRole(roleId)
      toast.success('Role updated')
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActingId(null)
    }
  }

  const handleCreate = async () => {
    if (!createCode.trim() || !createName.trim()) {
      toast.error('Code and name are required')
      return
    }
    setCreating(true)
    try {
      await iamRolesApi.createSystemRole({
        code: createCode.trim(),
        name: createName.trim(),
        description: createDesc.trim() || undefined,
      })
      toast.success('System role created')
      setCreateOpen(false)
      setCreateCode('')
      setCreateName('')
      setCreateDesc('')
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
          placeholder="Search roles…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Button variant="primary" onClick={() => void load()} icon={<Search size={16} />}>
          Search
        </Button>
        <Button
          variant="neutral-flat"
          onClick={() => setCreateOpen((v) => !v)}
          icon={!createOpen ? <Plus size={16} /> : undefined}
        >
          {createOpen ? 'Cancel' : 'New system role'}
        </Button>
      </Stack>
      {createOpen && (
        <div className="border border-neutral-200 bg-neutral-50 p-4">
          <Typography as="p" size="sm" weight="medium" className="mb-3">
            Create system role
          </Typography>
          <Stack direction="vertical" spacing="sm" className="max-w-md">
            <Input
              label="Code"
              value={createCode}
              onChange={(e) => setCreateCode(e.target.value)}
            />
            <Input
              label="Name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
            <Input
              label="Description"
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
            />
            <Button
              variant="primary"
              disabled={creating}
              onClick={() => void handleCreate()}
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
            ariaLabel="Iam Roles Panel"
            rows={items}
            rowKey={(role) => String(role.id)}
            emptyMessage="No items."
            columns={[
              {
                id: 'code',
                header: 'Code',
                accessor: 'code',
                kind: 'code',
                cellClassName: 'text-xs',
              },
              { id: 'name', header: 'Name', accessor: 'name' },
              { id: 'scope', header: 'Scope', accessor: 'roleScope' },
              {
                id: 'status',
                header: 'Status',
                cell: (role) => (
                  <>
                    <IamStatusBadge status={role.status} />
                  </>
                ),
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (role) => (
                  <>
                    <Stack direction="horizontal" spacing="xs" className="flex-wrap">
                      <Button
                        variant="ghost"
                        disabled={actingId === role.id}
                        onClick={() => void runAction(role.id, 'activate')}
                        icon={<Check size={16} />}
                      >
                        Activate
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={actingId === role.id}
                        onClick={() => void runAction(role.id, 'deactivate')}
                        icon={<Ban size={16} />}
                      >
                        Deactivate
                      </Button>
                      {!role.isSystem && (
                        <Button
                          variant="ghost"
                          disabled={actingId === role.id}
                          onClick={() => void runAction(role.id, 'softDelete')}
                          icon={<Trash2 size={16} />}
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
      )}
    </Stack>
  )
}
