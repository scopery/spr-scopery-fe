'use client'

import { useCallback, useState } from 'react'
import { wrapSingleScreenAsDocument } from '../../domain/rules/screen-spec-excel.rules'
import {
  loadScreenFullSpecForExport,
  loadScreenSpecDocFullSpecForExport,
} from '../../infrastructure/api/screen-spec-export.api'
import { downloadScreenSpecExcel } from '../export/download-screen-spec-excel'

export function useScreenSpecExcelExport(workspaceId: string | null) {
  const [exporting, setExporting] = useState(false)

  const exportDocument = useCallback(
    async (docId: string) => {
      if (!workspaceId) return
      setExporting(true)
      try {
        const full = await loadScreenSpecDocFullSpecForExport(workspaceId, docId)
        return await downloadScreenSpecExcel(full)
      } finally {
        setExporting(false)
      }
    },
    [workspaceId]
  )

  const exportScreen = useCallback(
    async (screenId: string) => {
      if (!workspaceId) return
      setExporting(true)
      try {
        const screen = await loadScreenFullSpecForExport(workspaceId, screenId)
        return await downloadScreenSpecExcel(wrapSingleScreenAsDocument(screen))
      } finally {
        setExporting(false)
      }
    },
    [workspaceId]
  )

  return { exporting, exportDocument, exportScreen }
}
