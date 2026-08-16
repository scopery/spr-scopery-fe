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
