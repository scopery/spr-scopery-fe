import type { adminTemplatesApi } from '@/modules/admin'

/** Display order of sections (not alphabetical). */
export const SECTION_ORDER = ['overview', 'scope', 'risks', 'timeline', 'assumptions', 'general']

export function sectionSortIndex(section: string): number {
  const i = SECTION_ORDER.indexOf(section || 'general')
  return i >= 0 ? i : SECTION_ORDER.length
}

export const SECTION_OPTIONS = [
  { value: 'overview', label: 'Overview' },
  { value: 'scope', label: 'Scope' },
  { value: 'risks', label: 'Risks' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'assumptions', label: 'Assumptions' },
  { value: 'general', label: 'General' },
]

export const Q_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'single_select', label: 'Single select' },
  { value: 'multi_select', label: 'Multi select' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'json', label: 'JSON' },
]

export function statusBadgeTone(status: string): 'info' | 'success' | 'neutral' | 'warning' {
  switch (status) {
    case 'draft':
      return 'info'
    case 'published':
      return 'success'
    case 'deprecated':
      return 'warning'
    default:
      return 'neutral'
  }
}

export function questionsBySection(questions: adminTemplatesApi.SystemQuestion[]) {
  const sorted = [...questions].sort((a, b) => {
    const orderA = sectionSortIndex(a.section || '')
    const orderB = sectionSortIndex(b.section || '')
    if (orderA !== orderB) return orderA - orderB
    const posA = a.position ?? 0
    const posB = b.position ?? 0
    if (posA !== posB) return posA - posB
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
  return sorted.reduce(
    (acc, q) => {
      const s = q.section || 'general'
      if (!acc[s]) acc[s] = []
      acc[s].push(q)
      return acc
    },
    {} as Record<string, adminTemplatesApi.SystemQuestion[]>
  )
}

/** Iterate section keys in SECTION_ORDER so table order is consistent. */
export function orderedSectionEntries(
  bySection: Record<string, adminTemplatesApi.SystemQuestion[]>
): [string, adminTemplatesApi.SystemQuestion[]][] {
  const order = [...SECTION_ORDER]
  const rest = Object.keys(bySection).filter((k) => !SECTION_ORDER.includes(k))
  rest.sort()
  for (const k of rest) order.push(k)
  return order.filter((k) => bySection[k]?.length).map((k) => [k, bySection[k]])
}
