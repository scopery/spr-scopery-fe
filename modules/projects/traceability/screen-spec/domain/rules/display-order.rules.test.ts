import { describe, expect, it } from 'vitest'
import {
  moveOrderedId,
  ordersNeedingUpdate,
  sortByDisplayOrder,
} from './display-order.rules'

describe('moveOrderedId', () => {
  it('moves an id before another', () => {
    expect(moveOrderedId(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b'])
  })

  it('no-ops when ids are missing or the same', () => {
    expect(moveOrderedId(['a', 'b'], 'a', 'a')).toEqual(['a', 'b'])
    expect(moveOrderedId(['a', 'b'], 'z', 'a')).toEqual(['a', 'b'])
  })
})

describe('ordersNeedingUpdate', () => {
  it('returns only rows whose displayOrder changed', () => {
    expect(
      ordersNeedingUpdate(
        [
          { id: 'a', displayOrder: 0 },
          { id: 'b', displayOrder: 1 },
          { id: 'c', displayOrder: 2 },
        ],
        ['a', 'c', 'b']
      )
    ).toEqual([
      { id: 'c', displayOrder: 1 },
      { id: 'b', displayOrder: 2 },
    ])
  })
})

describe('sortByDisplayOrder', () => {
  it('sorts nulls as 0', () => {
    expect(
      sortByDisplayOrder([
        { displayOrder: 2 },
        { displayOrder: null },
        { displayOrder: 1 },
      ]).map((r) => r.displayOrder)
    ).toEqual([null, 1, 2])
  })
})
