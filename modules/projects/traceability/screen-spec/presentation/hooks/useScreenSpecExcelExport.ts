'use client'

import { useCallback, useState } from 'react'
import { getApplication } from '../../../api/traceability.api'
import { wrapSingleScreenAsDocument } from '../../domain/rules/screen-spec-excel.rules'
import {
  loadScreenFullSpecForExport,
  loadScreenSpecDocFullSpecForExport,
} from '../../infrastructure/api/screen-spec-export.api'
import { downloadScreenSpecExcel } from '../export/download-screen-spec-excel'

async function loadApplicationName(
  workspaceId: string,
  applicationId: string | null | undefined
): Promise<string | null> {
  if (!applicationId) return null
  try {
    const app = await getApplication(workspaceId, applicationId)
    return app.name
  } catch {
    return null
  }
}

export function useScreenSpecExcelExport(
  workspaceId: string | null,
  applicationId?: string | null
) {
  const [exporting, setExporting] = useState(false)

  const exportDocument = useCallback(
    async (docId: string) => {
      if (!workspaceId) return
      setExporting(true)
      try {
        const [full, applicationName] = await Promise.all([
          loadScreenSpecDocFullSpecForExport(workspaceId, docId),
          loadApplicationName(workspaceId, applicationId),
        ])
        return await downloadScreenSpecExcel({ ...full, applicationName })
      } finally {
        setExporting(false)
      }
    },
    [applicationId, workspaceId]
  )

  const exportScreen = useCallback(
    async (screenId: string, screenApplicationId?: string | null) => {
      if (!workspaceId) return
      setExporting(true)
      try {
        const [screen, applicationName] = await Promise.all([
          loadScreenFullSpecForExport(workspaceId, screenId),
          loadApplicationName(workspaceId, screenApplicationId ?? applicationId),
        ])
        return await downloadScreenSpecExcel(wrapSingleScreenAsDocument(screen, { applicationName }))
      } finally {
        setExporting(false)
      }
    },
    [applicationId, workspaceId]
  )

  return { exporting, exportDocument, exportScreen }
}
