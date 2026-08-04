import type { SpecPackPreviewDocument } from '../../model/spec-pack-preview'
import { escapeHtml } from './escape'
import { renderSpecPackBodyHtml } from './sections'
import { specPackDocStyles } from './styles'

/**
 * Montserrat is a geometric sans close to Century Gothic and ships bold (700).
 * Browser preview often lacks Century Gothic; Word still prefers local Century Gothic first.
 */
const PREVIEW_FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap"
    rel="stylesheet"
  />
`

/** Assemble a full HTML document Word can open as .doc (+ browser preview). */
export function buildSpecPackDocHtml(doc: SpecPackPreviewDocument): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(doc.title)}</title>
  ${PREVIEW_FONT_LINKS}
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
