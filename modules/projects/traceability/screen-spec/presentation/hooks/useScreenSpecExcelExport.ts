'use client'

import { useCallback, useState } from 'react'
import { getApplication } from '../../../api/traceability.api'
import { wrapSingleScreenAsDocument } from '../../domain/rules/screen-spec-excel.rules'
import {
  loadExportScreenCatalog,
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
        const [full, applicationName, screenCatalog] = await Promise.all([
          loadScreenSpecDocFullSpecForExport(workspaceId, docId),
          loadApplicationName(workspaceId, applicationId),
          loadExportScreenCatalog(workspaceId, applicationId),
        ])
        const mockupByScreenId = new Map(screenCatalog.map((s) => [s.id, s.mockupUrl ?? null]))
        const patchedScreens = full.screens.map((entry) => ({
          ...entry,
          screen: {
            ...entry.screen,
            mockupUrl: entry.screen.mockupUrl ?? mockupByScreenId.get(entry.screen.id) ?? null,
          },
        }))
        return await downloadScreenSpecExcel({ ...full, screens: patchedScreens, applicationName, screenCatalog })
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
        const appId = screenApplicationId ?? applicationId
        const [screen, applicationName, screenCatalog] = await Promise.all([
          loadScreenFullSpecForExport(workspaceId, screenId),
          loadApplicationName(workspaceId, appId),
          loadExportScreenCatalog(workspaceId, appId),
        ])
        const mockupUrl = screenCatalog.find((s) => s.id === screenId)?.mockupUrl ?? null
        return await downloadScreenSpecExcel({
          ...wrapSingleScreenAsDocument({ ...screen, mockupUrl }, { applicationName }),
          screenCatalog,
        })
      } finally {
        setExporting(false)
      }
    },
    [applicationId, workspaceId]
  )

  return { exporting, exportDocument, exportScreen }
}
