import { describe, expect, it } from 'vitest'
import {
  UNGROUPED_COMPONENT_KEY,
  groupFieldsByComponent,
  shouldShowComponentGroups,
} from './field-groups.rules'

describe('groupFieldsByComponent', () => {
  const components = [
    { id: 'c1', code: 'TXT', name: 'Text' },
    { id: 'c2', code: 'BTN', name: 'Button' },
  ]

  it('keeps field order and groups by first appearance', () => {
    const groups = groupFieldsByComponent(
      [
        { id: 'f1', componentId: 'c2' },
        { id: 'f2', componentId: null },
        { id: 'f3', componentId: 'c2' },
      ],
      components
    )
    expect(groups.map((g) => g.key)).toEqual(['c2', UNGROUPED_COMPONENT_KEY])
    expect(groups[0].component?.code).toBe('BTN')
    expect(groups[0].fields.map((f) => f.id)).toEqual(['f1', 'f3'])
    expect(groups[1].fields.map((f) => f.id)).toEqual(['f2'])
  })

  it('hides grouping chrome when every field is unbound', () => {
    const groups = groupFieldsByComponent([{ id: 'f1', componentId: null }], components)
    expect(shouldShowComponentGroups(groups)).toBe(false)
  })

  it('shows grouping when a field is bound', () => {
    const groups = groupFieldsByComponent([{ id: 'f1', componentId: 'c1' }], components)
    expect(shouldShowComponentGroups(groups)).toBe(true)
  })

  it('falls back to the section-bound component', () => {
    const groups = groupFieldsByComponent(
      [{ id: 'f1', componentId: null, sectionId: 'sec1' }],
      components,
      { sec1: 'c1' }
    )
    expect(groups[0].key).toBe('c1')
    expect(groups[0].component?.code).toBe('TXT')
    expect(shouldShowComponentGroups(groups)).toBe(true)
  })
})
