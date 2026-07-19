'use client'

import { Search } from 'lucide-react'

import { useCallback, useEffect, useState } from 'react'
import { Button, Stack, Skeleton, Typography } from '@/shared/ui'
import { IamStatusBadge } from '../IamStatusBadge'
import { IamSearchField } from '../IamSearchField'
import { iamRightsApi } from '@/modules/auth/iam'
import type { IamRight } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function IamRightsPanel() {
  const [keyword, setKeyword] = useState('')
  const [module, setModule] = useState('')
  const [items, setItems] = useState<IamRight[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await iamRightsApi.searchRights({
        keyword: keyword.trim() || undefined,
        module: module.trim() || undefined,
        page: 0,
        size: 50,
      })
      setItems(res.items)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [keyword, module])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Stack direction="vertical" spacing="md">
      <Stack direction="horizontal" spacing="sm" className="flex-wrap items-center">
        <IamSearchField
          placeholder="Search rights…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <IamSearchField
          placeholder="Module"
          value={module}
          onChange={(e) => setModule(e.target.value)}
          className="w-32"
        />
        <Button variant="primary" onClick={() => void load()} icon={<Search size={16} />}>
          Search
        </Button>
      </Stack>
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={120} />
      ) : (
        <div className="overflow-x-auto border border-neutral-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Module</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((right) => (
                <tr key={right.id} className="border-t border-neutral-100">
                  <td className="px-3 py-2 font-mono text-xs">{right.code}</td>
                  <td className="px-3 py-2">{right.name}</td>
                  <td className="px-3 py-2">{right.module ?? '—'}</td>
                  <td className="px-3 py-2">
                    <IamStatusBadge status={right.status} />
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center">
                    <Typography variant="small" tone="muted">
                      No rights found
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
