import { describe, expect, it } from 'vitest'
import { normalizeToPlateValue } from './normalize-plate-value'

describe('normalizeToPlateValue', () => {
  it('converts TipTap paragraph + text nodes to Plate', () => {
    const raw = [
      {
        type: 'paragraph',
        content: [
          {
            text: 'Updated: version 2 of the project specification.',
            type: 'text',
          },
        ],
      },
    ]
    expect(normalizeToPlateValue(raw)).toEqual([
      {
        type: 'p',
        children: [{ text: 'Updated: version 2 of the project specification.' }],
      },
    ])
  })

  it('converts TipTap doc wrapper', () => {
    const raw = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Title', marks: [{ type: 'bold' }] }],
        },
      ],
    }
    expect(normalizeToPlateValue(raw)).toEqual([
      { type: 'h2', children: [{ text: 'Title', bold: true }] },
    ])
  })

  it('passes through valid Plate values', () => {
    const value = [{ type: 'p', children: [{ text: 'ok' }] }]
    expect(normalizeToPlateValue(value)).toEqual(value)
  })

  it('parses JSON string TipTap payload', () => {
    const ast = JSON.stringify([
      { type: 'paragraph', content: [{ type: 'text', text: 'hi' }] },
    ])
    expect(normalizeToPlateValue(ast)).toEqual([{ type: 'p', children: [{ text: 'hi' }] }])
  })
})
