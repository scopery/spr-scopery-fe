import { describe, expect, it } from 'vitest'
import { normalizeItemList, normalizeList } from './normalizeListResponse'

describe('normalizeListResponse', () => {
  it('accepts bare arrays (ApiResponse.success(List))', () => {
    expect(normalizeList([{ id: '1' }])).toEqual([{ id: '1' }])
  })

  it('accepts { items }', () => {
    expect(normalizeList({ items: [{ id: 'a' }] })).toEqual([{ id: 'a' }])
  })

  it('accepts Spring { content }', () => {
    expect(normalizeList({ content: [{ id: 'c' }] })).toEqual([{ id: 'c' }])
  })

  it('accepts nested { data: { items } }', () => {
    expect(normalizeList({ data: { items: [{ id: 'd' }] } })).toEqual([{ id: 'd' }])
  })

  it('accepts nested { data: T[] }', () => {
    expect(normalizeList({ data: [{ id: 'e' }] })).toEqual([{ id: 'e' }])
  })

  it('returns [] for null/undefined/empty object', () => {
    expect(normalizeList(null)).toEqual([])
    expect(normalizeList(undefined)).toEqual([])
    expect(normalizeList({})).toEqual([])
  })

  it('normalizeItemList always exposes items array', () => {
    expect(normalizeItemList([{ id: '1' }])).toEqual({ items: [{ id: '1' }] })
    expect(normalizeItemList(undefined)).toEqual({ items: [] })
  })
})
