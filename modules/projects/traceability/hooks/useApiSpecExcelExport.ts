'use client'

import { useCallback, useState } from 'react'
import { getApiEndpoint } from '../api/traceability.api'
import type { RegistryApiEndpoint } from '../model/application-registry'
import { downloadApiSpecExcel } from '../ui/api-spec-workbook'

export function useApiSpecExcelExport(
  workspaceId: string,
  applicationId: string,
  applicationName?: string | null
) {
  const [exporting, setExporting] = useState(false)

  const exportApis = useCallback(
    async (endpoints: RegistryApiEndpoint[]) => {
      if (endpoints.length === 0) return
      setExporting(true)
      try {
        const full = await Promise.all(
          endpoints.map((endpoint) =>
            getApiEndpoint(workspaceId, applicationId, endpoint.id).catch(() => endpoint)
          )
        )
        return await downloadApiSpecExcel(full, applicationName)
      } finally {
        setExporting(false)
      }
    },
    [applicationId, applicationName, workspaceId]
  )

  return { exporting, exportApis }
}
