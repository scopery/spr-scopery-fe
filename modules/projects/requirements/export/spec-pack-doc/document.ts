import type { SpecPackPreviewDocument } from '../../model/spec-pack-preview'
import { escapeHtml } from './escape'
import { renderSpecPackBodyHtml } from './sections'
import { specPackDocStyles } from './styles'

/** Assemble a full HTML document Word can open as .doc. */
export function buildSpecPackDocHtml(doc: SpecPackPreviewDocument): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.title)}</title>
  <style>${specPackDocStyles()}</style>
</head>
<body>
${renderSpecPackBodyHtml(doc)}
</body>
</html>`
}

export function suggestSpecPackDocFilename(doc: SpecPackPreviewDocument): string {
  const safe = doc.title
    .replace(/[^\w\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
  return `${safe || 'spec-pack'}.doc`
}
