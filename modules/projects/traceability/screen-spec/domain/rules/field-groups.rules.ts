export const UNGROUPED_COMPONENT_KEY = 'none'

export interface FieldComponentRef {
  id: string
  code: string
  name: string
}

export interface FieldComponentGroup<
  T extends { componentId?: string | null; sectionId?: string | null },
> {
  key: string
  component: FieldComponentRef | null
  fields: T[]
}

export function resolveFieldComponentId(
  field: { componentId?: string | null; sectionId?: string | null },
  componentIdBySectionId?: Record<string, string>
): string | null {
  if (field.componentId) return field.componentId
  if (!field.sectionId || !componentIdBySectionId) return null
  return componentIdBySectionId[field.sectionId] ?? null
}

export function groupFieldsByComponent<
  T extends { componentId?: string | null; sectionId?: string | null },
>(
  fields: T[],
  components: FieldComponentRef[],
  componentIdBySectionId?: Record<string, string>
): FieldComponentGroup<T>[] {
  const groups: FieldComponentGroup<T>[] = []
  const indexByKey = new Map<string, number>()
  for (const field of fields) {
    const componentId = resolveFieldComponentId(field, componentIdBySectionId)
    const key = componentId || UNGROUPED_COMPONENT_KEY
    let index = indexByKey.get(key)
    if (index == null) {
      groups.push({
        key,
        component: componentId ? (components.find((c) => c.id === componentId) ?? null) : null,
        fields: [],
      })
      index = groups.length - 1
      indexByKey.set(key, index)
    }
    groups[index].fields.push(field)
  }
  return groups
}

export function shouldShowComponentGroups(
  groups: Array<{ key: string }>
): boolean {
  return groups.length > 1 || groups[0]?.key !== UNGROUPED_COMPONENT_KEY
}

export function fieldComponentGroupLabel(group: {
  key: string
  component: FieldComponentRef | null
}): string {
  if (group.component) return `${group.component.code} · ${group.component.name}`
  if (group.key !== UNGROUPED_COMPONENT_KEY) return 'Linked component'
  return 'No component'
}

export const UNGROUPED_SECTION_KEY = 'none'

export interface FieldSectionRef {
  id: string
  name: string
}

export interface FieldSectionGroup<
  T extends { componentId?: string | null; sectionId?: string | null },
> {
  key: string
  section: FieldSectionRef | null
  component: FieldComponentRef | null
  fields: T[]
}

export function groupFieldsBySection<
  T extends { componentId?: string | null; sectionId?: string | null },
>(
  fields: T[],
  sections: FieldSectionRef[],
  components: FieldComponentRef[],
  componentIdBySectionId?: Record<string, string>
): FieldSectionGroup<T>[] {
  const bySection = new Map<string, T[]>()
  const unsectioned: T[] = []
  const known = new Set(sections.map((section) => section.id))
  for (const field of fields) {
    if (field.sectionId && known.has(field.sectionId)) {
      const list = bySection.get(field.sectionId) ?? []
      list.push(field)
      bySection.set(field.sectionId, list)
    } else {
      unsectioned.push(field)
    }
  }
  const groups: FieldSectionGroup<T>[] = []
  for (const section of sections) {
    const sectionFields = bySection.get(section.id)
    if (!sectionFields?.length) continue
    const componentId =
      componentIdBySectionId?.[section.id] ??
      sectionFields.find((field) => field.componentId)?.componentId ??
      null
    groups.push({
      key: section.id,
      section,
      component: componentId ? (components.find((c) => c.id === componentId) ?? null) : null,
      fields: sectionFields,
    })
  }
  if (unsectioned.length > 0) {
    groups.push({
      key: UNGROUPED_SECTION_KEY,
      section: null,
      component: null,
      fields: unsectioned,
    })
  }
  return groups
}

export function shouldShowSectionGroups(groups: Array<{ key: string }>): boolean {
  return groups.length > 1 || groups[0]?.key !== UNGROUPED_SECTION_KEY
}

export function fieldSectionGroupLabel(group: {
  section: FieldSectionRef | null
  component: FieldComponentRef | null
}): string {
  if (group.section && group.component) {
    return `${group.section.name} · ${group.component.code} · ${group.component.name}`
  }
  if (group.section) return group.section.name
  return 'No section'
}

export function filterFieldComponentGroups<
  T extends {
    fieldKey: string
    label: string
    componentId?: string | null
    sectionId?: string | null
  },
>(groups: FieldComponentGroup<T>[], query: string): FieldComponentGroup<T>[] {
  const q = query.trim().toLowerCase()
  if (!q) return groups
  return groups.flatMap((group) => {
    const groupHit = fieldComponentGroupLabel(group).toLowerCase().includes(q)
    if (groupHit) return [group]
    const fields = group.fields.filter(
      (field) =>
        field.fieldKey.toLowerCase().includes(q) || field.label.toLowerCase().includes(q)
    )
    return fields.length > 0 ? [{ ...group, fields }] : []
  })
}
