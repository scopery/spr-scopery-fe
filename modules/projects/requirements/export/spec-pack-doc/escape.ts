/** HTML escaping for Spec Pack DOC export — keep pure and tiny. */

export function escapeHtml(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function nl2br(value: string | null | undefined): string {
  return escapeHtml(value).replace(/\r\n|\n|\r/g, '<br/>')
}
