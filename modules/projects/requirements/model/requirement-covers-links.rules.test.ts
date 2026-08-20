import { describe, expect, it } from 'vitest'
import {
  buildCoversReqFunctionIndex,
  isCoversReqToFunctionLink,
} from './requirement-covers-links.rules'

describe('isCoversReqToFunctionLink', () => {
  it('accepts a requirement → function COVERS link', () => {
    expect(
      isCoversReqToFunctionLink({
        sourceId: 'req-1',
        sourceType: 'REQUIREMENT',
        targetId: 'fn-1',
        targetType: 'FUNCTIONAL_ITEM',
        linkType: 'COVERS',
      })
    ).toBe(true)
  })

  it('rejects links for another requirement type or missing ids', () => {
    expect(
      isCoversReqToFunctionLink({
        sourceId: 'req-1',
        sourceType: 'REQUIREMENT',
        targetId: 'tc-1',
        targetType: 'TEST_CASE',
        linkType: 'COVERS',
      })
    ).toBe(false)
    expect(
      isCoversReqToFunctionLink({
        sourceType: 'REQUIREMENT',
        targetId: 'fn-1',
        targetType: 'FUNCTIONAL_ITEM',
        linkType: 'COVERS',
      })
    ).toBe(false)
  })
})

describe('buildCoversReqFunctionIndex', () => {
  it('indexes functions per requirement and ignores other requirements', () => {
    const index = buildCoversReqFunctionIndex([
      {
        sourceId: 'req-1',
        sourceType: 'REQUIREMENT',
        targetId: 'fn-a',
        targetType: 'FUNCTIONAL_ITEM',
        targetCode: 'FN-A',
        targetTitle: 'Login',
        linkType: 'COVERS',
      },
      {
        sourceId: 'req-1',
        sourceType: 'REQUIREMENT',
        targetId: 'fn-b',
        targetType: 'FUNCTIONAL_ITEM',
        targetCode: 'FN-B',
        targetTitle: 'Logout',
        linkType: 'COVERS',
      },
      {
        sourceId: 'req-2',
        sourceType: 'REQUIREMENT',
        targetId: 'fn-c',
        targetType: 'FUNCTIONAL_ITEM',
        targetTitle: 'Other',
        linkType: 'COVERS',
      },
      {
        sourceId: 'req-1',
        sourceType: 'REQUIREMENT',
        targetId: 'fn-a',
        targetType: 'FUNCTIONAL_ITEM',
        targetTitle: 'Login duplicate',
        linkType: 'COVERS',
      },
    ])

    expect(index.get('req-1')).toEqual([
      { id: 'fn-a', code: 'FN-A', title: 'Login' },
      { id: 'fn-b', code: 'FN-B', title: 'Logout' },
    ])
    expect(index.get('req-2')).toEqual([{ id: 'fn-c', code: '', title: 'Other' }])
    expect(index.get('req-3')).toBeUndefined()
  })
})
