import type { SpecPackPreviewDocument } from '../../model/spec-pack-preview'
import { buildSpecPackDocHtml, suggestSpecPackDocFilename } from './document'
import { downloadSpecPackDoc } from './download'

export { buildSpecPackDocHtml, suggestSpecPackDocFilename } from './document'
export { downloadSpecPackDoc } from './download'
export { renderSpecPackBodyHtml, renderRequirementChapterHtml } from './sections'

/** One-shot: preview document → downloadable Word HTML (.doc). */
export function exportSpecPackToDoc(doc: SpecPackPreviewDocument): {
  filename: string
} {
  const html = buildSpecPackDocHtml(doc)
  const filename = suggestSpecPackDocFilename(doc)
  downloadSpecPackDoc(html, filename)
  return { filename }
}
