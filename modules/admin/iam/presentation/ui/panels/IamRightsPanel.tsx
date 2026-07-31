'use client'

import { Search } from 'lucide-react'

import { useCallback, useEffect, useState } from 'react'
import { Button, Stack, Skeleton, Typography, DataTable } from '@/shared/ui'
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
          <DataTable
            ariaLabel="Iam Rights Panel"
            rows={items}
            rowKey={(right) => String(right.id)}
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
              { id: 'module', header: 'Module', cell: (right) => <>{right.module ?? '—'}</> },
              {
                id: 'status',
                header: 'Status',
                cell: (right) => (
                  <>
                    <IamStatusBadge status={right.status} />
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
