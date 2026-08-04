import type { SpecPackPreviewDocument } from '../../model/spec-pack-preview'
import { downloadSpecPackExcel } from './download'
import {
  buildSpecPackExcelWorkbook,
  suggestSpecPackExcelFilename,
} from './workbook'

export { downloadSpecPackExcel } from './download'
export {
  buildSpecPackExcelWorkbook,
  suggestSpecPackExcelFilename,
} from './workbook'
export { flattenSpecPackForExcel } from './rows'

/** One-shot: preview document → downloadable Excel (.xlsx). */
export async function exportSpecPackToExcel(
  doc: SpecPackPreviewDocument
): Promise<{ filename: string }> {
  const wb = await buildSpecPackExcelWorkbook(doc)
  const buffer = await wb.xlsx.writeBuffer()
  const bytes =
    buffer instanceof ArrayBuffer
      ? buffer
      : Uint8Array.from(buffer as ArrayLike<number>).buffer
  const filename = suggestSpecPackExcelFilename(doc)
  downloadSpecPackExcel(bytes, filename)
  return { filename }
}
