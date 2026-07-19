import { describe, expect, it } from 'vitest'
import { parseAstToPlateValue, plateValueToAst } from '../model/ast-adapter'

const empty = [{ type: 'p', children: [{ text: '' }] }]

describe('ast-adapter', () => {
  it('round-trips Plate value arrays via doc wrapper', () => {
    const value = [
      { type: 'h1', children: [{ text: 'Hello' }] },
      { type: 'p', children: [{ text: 'World' }] },
    ]
    const ast = plateValueToAst(value as never)
    expect(JSON.parse(ast)).toEqual({ type: 'doc', content: value })
    expect(parseAstToPlateValue(ast)).toEqual(value)
  })

  it('parses doc-wrapped content', () => {
    const ast = JSON.stringify({
      type: 'doc',
      content: [{ type: 'p', children: [{ text: 'x' }] }],
    })
    expect(parseAstToPlateValue(ast)).toEqual([{ type: 'p', children: [{ text: 'x' }] }])
  })

  it('falls back to empty on invalid ast', () => {
    expect(parseAstToPlateValue('not-json')).toEqual(empty)
    expect(parseAstToPlateValue('')).toEqual(empty)
  })
})
