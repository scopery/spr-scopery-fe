import { describe, expect, it } from 'vitest'
import { StructureFocusType } from './overall-structure'
import {
  actionNeedsProject,
  availablePaletteGroupIdsForFocus,
  resolveStructureAssignAction,
  zoneAcceptsDrag,
} from './structure-assign.rules'

describe('structure-assign.rules', () => {
  it('allows Screen → Function', () => {
    expect(
      resolveStructureAssignAction(StructureFocusType.Screen, {
        type: StructureFocusType.Function,
        id: 'f1',
      })
    ).toBe('link-screen-to-function')
  })

  it('allows Component → Screen', () => {
    expect(
      resolveStructureAssignAction(StructureFocusType.Component, {
        type: StructureFocusType.Screen,
        id: 's1',
      })
    ).toBe('link-component-to-screen')
  })

  it('blocks Entity → Screen', () => {
    expect(
      resolveStructureAssignAction(StructureFocusType.Entity, {
        type: StructureFocusType.Screen,
        id: 's1',
      })
    ).toBeNull()
  })

  it('allows Function → Module move', () => {
    expect(
      resolveStructureAssignAction(StructureFocusType.Function, {
        type: StructureFocusType.Module,
        id: 'm1',
      })
    ).toBe('move-function-to-module')
  })

  it('flags project-scoped actions', () => {
    expect(actionNeedsProject('link-screen-to-function')).toBe(true)
    expect(actionNeedsProject('link-component-to-screen')).toBe(false)
  })

  it('activates Screens zone only for Screen drag onto Function', () => {
    const focus = { type: StructureFocusType.Function, id: 'f1' }
    expect(zoneAcceptsDrag('screens', StructureFocusType.Screen, focus)).toBe(true)
    expect(zoneAcceptsDrag('apis', StructureFocusType.Screen, focus)).toBe(false)
    expect(zoneAcceptsDrag('apis', StructureFocusType.ApiEndpoint, focus)).toBe(true)
  })

  it('blocks assigning a node to itself', () => {
    expect(
      resolveStructureAssignAction(
        StructureFocusType.Screen,
        { type: StructureFocusType.Function, id: 'same' },
        'same'
      )
    ).toBeNull()
    expect(
      resolveStructureAssignAction(
        StructureFocusType.Screen,
        { type: StructureFocusType.Function, id: 'fn' },
        'scr'
      )
    ).toBe('link-screen-to-function')
  })

  it('limits Available groups by focus type', () => {
    expect(availablePaletteGroupIdsForFocus(StructureFocusType.Function)).toEqual([
      'screens',
      'apis',
      'communications',
      'nfrs',
    ])
    expect(availablePaletteGroupIdsForFocus(StructureFocusType.Screen)).toEqual([
      'components',
    ])
    expect(availablePaletteGroupIdsForFocus(StructureFocusType.Module)).toEqual([
      'functions',
      'entities',
      'nfrs',
    ])
  })
})
