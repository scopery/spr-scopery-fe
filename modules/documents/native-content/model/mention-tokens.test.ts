import { describe, expect, it } from 'vitest'
import type { Value } from 'platejs'
import { extractMentionsFromPlateValue, mentionsToRefs } from './mention-tokens'
import { createResourceMentionNode } from '@/modules/documents/document/ui/editor/resource-embed-plugins'

describe('extractMentionsFromPlateValue', () => {
  it('extracts custom resourceMention nodes', () => {
    const value = [
      {
        type: 'p',
        children: [
          createResourceMentionNode({
            resourceType: 'USER',
            resourceId: '11111111-1111-1111-1111-111111111111',
            label: 'Alice',
          }),
          { text: ' hello' },
        ],
      },
    ] as Value

    const mentions = extractMentionsFromPlateValue(value)
    expect(mentions).toEqual([
      {
        label: 'Alice',
        resourceType: 'USER',
        resourceId: '11111111-1111-1111-1111-111111111111',
      },
    ])
  })

  it('extracts legacy text tokens', () => {
    const value = [
      {
        type: 'p',
        children: [
          {
            text: 'See @[SRS](DOCUMENT:22222222-2222-2222-2222-222222222222)',
          },
        ],
      },
    ] as Value

    expect(mentionsToRefs(extractMentionsFromPlateValue(value))).toEqual([
      {
        resourceType: 'DOCUMENT',
        resourceId: '22222222-2222-2222-2222-222222222222',
      },
    ])
  })

  it('returns empty for plain text', () => {
    const value = [{ type: 'p', children: [{ text: 'no mentions' }] }] as Value
    expect(extractMentionsFromPlateValue(value)).toEqual([])
  })
})
