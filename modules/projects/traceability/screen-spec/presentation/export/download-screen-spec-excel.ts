import {
  excelWriteBufferToArrayBuffer,
  safeExcelFileStem,
  triggerBrowserDownload,
} from '@/shared/lib/excel/download'
import type { ScreenSpecDocFullSpec } from '../../domain/model/screen-spec-doc'
import { suggestScreenSpecExcelFilename } from '../../domain/rules/screen-spec-excel.rules'
import { buildScreenSpecExcelWorkbook } from './screen-spec-workbook'

export async function downloadScreenSpecExcel(doc: ScreenSpecDocFullSpec): Promise<{ filename: string }> {
  const wb = await buildScreenSpecExcelWorkbook(doc)
  const buffer = await wb.xlsx.writeBuffer()
  const filename = safeExcelFileStem(suggestScreenSpecExcelFilename(doc).replace(/\.xlsx$/i, ''), 'screen-spec') + '.xlsx'
  triggerBrowserDownload(excelWriteBufferToArrayBuffer(buffer), filename)
  return { filename }
}
