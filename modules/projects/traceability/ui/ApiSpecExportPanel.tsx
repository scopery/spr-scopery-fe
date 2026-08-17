'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  DataTable,
  Input,
  Stack,
  Typography,
  useVisibleRowSelection,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type { RegistryApiEndpoint } from '../model/application-registry'
import { useApiSpecExcelExport } from '../hooks/useApiSpecExcelExport'

export function ApiSpecExportPanel({
  workspaceId,
  applicationId,
  applicationName,
  endpoints,
}: {
  workspaceId: string
  applicationId: string
  applicationName?: string | null
  endpoints: RegistryApiEndpoint[]
}) {
  const { exporting, exportApis } = useApiSpecExcelExport(
    workspaceId,
    applicationId,
    applicationName
  )
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return endpoints
    return endpoints.filter((endpoint) =>
      [endpoint.method, endpoint.pathPattern, endpoint.name, endpoint.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    )
  }, [endpoints, query])

  const visibleKeys = useMemo(() => filtered.map((endpoint) => endpoint.id), [filtered])
  const [selectedKeys, setSelectedKeys] = useVisibleRowSelection(visibleKeys)

  const selected = useMemo(
    () => filtered.filter((endpoint) => selectedKeys.has(endpoint.id)),
    [filtered, selectedKeys]
  )

  const handleExport = async () => {
    if (selected.length === 0) return
    try {
      const result = await exportApis(selected)
      if (result?.filename) toast.success(`Downloaded ${result.filename}`)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col border border-neutral-200 bg-white">
      <div className="shrink-0 border-b border-neutral-200 px-3 py-2">
        <Stack direction="vertical" spacing="sm">
          <Typography variant="small" tone="muted">
            Export stays on this browser — nothing is saved on the server. One sheet, one row per
            param; API columns merge when an endpoint has several params.
          </Typography>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="w-full sm:max-w-xs">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search APIs…"
                aria-label="Search APIs"
                fullWidth
                prefix={<Search size={14} />}
              />
            </div>
            <Button
              size="sm"
              disabled={selected.length === 0 || exporting}
              loading={exporting}
              onClick={() => void handleExport()}
            >
              {selected.length === 0
                ? 'Export selected'
                : `Export ${selected.length} API${selected.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </Stack>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 py-2">
        <DataTable
          ariaLabel="API endpoints to export"
          compact
          stickyHeader
          rows={filtered}
          rowKey={(row) => row.id}
          selectedKeys={selectedKeys}
          onSelectedKeysChange={setSelectedKeys}
          emptyMessage={endpoints.length === 0 ? 'No APIs in this application yet.' : 'Nothing matches.'}
          columns={[
            { id: 'method', header: 'Method', accessor: 'method', kind: 'code', width: '88px' },
            { id: 'path', header: 'Path', accessor: 'pathPattern', kind: 'code' },
            {
              id: 'name',
              header: 'Name',
              accessor: (row) => row.name || '—',
            },
            {
              id: 'params',
              header: 'Params',
              align: 'right',
              width: '80px',
              accessor: (row) => String(row.requestParams?.length ?? 0),
            },
          ]}
        />
      </div>
    </div>
  )
}
