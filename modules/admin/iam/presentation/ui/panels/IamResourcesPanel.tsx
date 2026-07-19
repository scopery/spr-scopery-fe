'use client'

import { Ban, Check, Plus, Search } from 'lucide-react'

import { useCallback, useEffect, useState } from 'react'
import NextLink from 'next/link'
import { Button, Input, Stack, Typography, Skeleton } from '@/shared/ui'
import { IamStatusBadge } from '../IamStatusBadge'
import { IamSearchField } from '../IamSearchField'
import { iamResourcesApi } from '@/modules/auth/iam'
import type { IamResource } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export function IamResourcesPanel() {
  const [keyword, setKeyword] = useState('')
  const [items, setItems] = useState<IamResource[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ code: '', resourceType: '', name: '', description: '' })
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await iamResourcesApi.searchResources({
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

  const runAction = async (id: string, action: 'activate' | 'deactivate') => {
    setActingId(id)
    try {
      if (action === 'activate') await iamResourcesApi.activateResource(id)
      else await iamResourcesApi.deactivateResource(id)
      toast.success('Resource updated')
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActingId(null)
    }
  }

  const create = async () => {
    if (!form.code.trim() || !form.resourceType.trim() || !form.name.trim()) {
      toast.error('Code, type, and name are required')
      return
    }
    setCreating(true)
    try {
      await iamResourcesApi.createResource({
        code: form.code.trim(),
        resourceType: form.resourceType.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      })
      toast.success('Resource created')
      setShowCreate(false)
      setForm({ code: '', resourceType: '', name: '', description: '' })
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
          placeholder="Search resources…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Button variant="primary" onClick={() => void load()} icon={<Search size={16} />}>
          Search
        </Button>
        <Button variant="neutral-flat" onClick={() => setShowCreate((v) => !v)} icon={!showCreate ? <Plus size={16} /> : undefined}>{showCreate ? 'Cancel' : 'New resource'}
        </Button>
      </Stack>
      {showCreate && (
        <div className="border border-neutral-200 bg-neutral-50 p-4">
          <Typography as="p" size="sm" weight="medium" className="mb-3">
            Register resource
          </Typography>
          <Stack direction="vertical" spacing="sm" className="max-w-lg">
            <Input label="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            <Input
              label="Resource type"
              value={form.resourceType}
              onChange={(e) => setForm((f) => ({ ...f, resourceType: e.target.value }))}
            />
            <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Button variant="primary" disabled={creating} onClick={() => void create()} icon={<Plus size={16} />}>
              Create
            </Button>
          </Stack>
        </div>
      )}
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={120} />
      ) : (
        <div className="overflow-x-auto border border-neutral-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="min-w-[12rem] whitespace-nowrap px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((resource) => (
                <tr key={resource.id} className="border-t border-neutral-100">
                  <td className="px-3 py-2 font-mono text-xs">
                    <NextLink
                      href={ADMIN_ROUTES.iamResource(resource.id)}
                      className="text-primary hover:underline"
                    >
                      {resource.code}
                    </NextLink>
                  </td>
                  <td className="px-3 py-2">{resource.resourceType}</td>
                  <td className="px-3 py-2">
                    <NextLink
                      href={ADMIN_ROUTES.iamResource(resource.id)}
                      className="text-primary hover:underline"
                    >
                      {resource.name}
                    </NextLink>
                  </td>
                  <td className="px-3 py-2">
                    <IamStatusBadge status={resource.status} />
                  </td>
                  <td className="px-3 py-2">
                    <Stack direction="horizontal" spacing="xs">
                      <Button
                        variant="ghost"
                        disabled={actingId === resource.id}
                        onClick={() => void runAction(resource.id, 'activate')} icon={<Check size={16} />}>
                        Activate
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={actingId === resource.id}
                        onClick={() => void runAction(resource.id, 'deactivate')} icon={<Ban size={16} />}>
                        Deactivate
                      </Button>
                      <NextLink
                        href={ADMIN_ROUTES.iamResource(resource.id)}
                        className="inline-flex items-center px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100"
                      >
                        View
                      </NextLink>
                    </Stack>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center">
                    <Typography variant="small" tone="muted">
                      No resources found
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
