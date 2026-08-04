import type { SpecPackPreviewDocument } from '../../model/spec-pack-preview'
import {
  buildSpecPackDocx,
  suggestSpecPackDocxFilename,
} from './build-document'
import { downloadSpecPackDocx } from './download'

export {
  buildSpecPackDocx,
  suggestSpecPackDocxFilename,
} from './build-document'
export { downloadSpecPackDocx } from './download'

/** One-shot: preview document → real Word .docx download. */
export async function exportSpecPackToDocx(
  doc: SpecPackPreviewDocument
): Promise<{ filename: string }> {
  const blob = await buildSpecPackDocx(doc)
  const filename = suggestSpecPackDocxFilename(doc)
  downloadSpecPackDocx(blob, filename)
  return { filename }
}
