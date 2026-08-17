import { describe, expect, it } from 'vitest'
import {
  UNGROUPED_COMPONENT_KEY,
  UNGROUPED_SECTION_KEY,
  fieldSectionGroupLabel,
  filterFieldComponentGroups,
  groupFieldsByComponent,
  groupFieldsBySection,
  shouldShowComponentGroups,
  shouldShowSectionGroups,
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

describe('groupFieldsBySection', () => {
  const sections = [
    { id: 's1', name: 'Main form' },
    { id: 's2', name: 'Search' },
  ]
  const components = [{ id: 'c1', code: 'USR', name: 'User form' }]

  it('follows section order and skips empty sections', () => {
    const groups = groupFieldsBySection(
      [
        { id: 'f2', sectionId: 's2' },
        { id: 'f1', sectionId: 's1' },
        { id: 'f3', sectionId: null },
      ],
      sections,
      components
    )
    expect(groups.map((g) => g.key)).toEqual(['s1', 's2', UNGROUPED_SECTION_KEY])
    expect(groups[0].fields.map((f) => f.id)).toEqual(['f1'])
    expect(groups[2].fields.map((f) => f.id)).toEqual(['f3'])
    expect(shouldShowSectionGroups(groups)).toBe(true)
  })

  it('attaches the bound component to the section label', () => {
    const groups = groupFieldsBySection(
      [{ id: 'f1', sectionId: 's1', componentId: null }],
      sections,
      components,
      { s1: 'c1' }
    )
    expect(fieldSectionGroupLabel(groups[0])).toBe('Main form · USR · User form')
  })

  it('hides grouping when every field is unsectioned', () => {
    const groups = groupFieldsBySection(
      [{ id: 'f1', sectionId: null }],
      sections,
      components
    )
    expect(shouldShowSectionGroups(groups)).toBe(false)
  })
})

describe('filterFieldComponentGroups', () => {
  const groups = [
    {
      key: 'c1',
      component: { id: 'c1', code: 'TXT', name: 'Text' },
      fields: [
        { fieldKey: 'email', label: 'Email' },
        { fieldKey: 'name', label: 'Full name' },
      ],
    },
    {
      key: UNGROUPED_COMPONENT_KEY,
      component: null,
      fields: [{ fieldKey: 'note', label: 'Note' }],
    },
  ]

  it('keeps the whole group when the component name matches', () => {
    const next = filterFieldComponentGroups(groups, 'txt')
    expect(next).toHaveLength(1)
    expect(next[0].fields).toHaveLength(2)
  })

  it('keeps only matching fields when the query is a field key', () => {
    const next = filterFieldComponentGroups(groups, 'email')
    expect(next).toHaveLength(1)
    expect(next[0].fields.map((f) => f.fieldKey)).toEqual(['email'])
  })
})
