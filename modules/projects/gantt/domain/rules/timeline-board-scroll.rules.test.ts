import { describe, expect, it } from 'vitest'
import {
  clampScrollLeft,
  columnScrollLeft,
  wheelDeltaToHorizontalPan,
} from './timeline-board-scroll.rules'

describe('wheelDeltaToHorizontalPan', () => {
  it('prefers horizontal delta when larger', () => {
    expect(wheelDeltaToHorizontalPan(40, 10)).toBe(40)
  })

  it('maps vertical wheel to horizontal pan', () => {
    expect(wheelDeltaToHorizontalPan(0, 80)).toBe(80)
    expect(wheelDeltaToHorizontalPan(5, -90)).toBe(-90)
  })
})

describe('clampScrollLeft', () => {
  it('no-ops when there is no horizontal overflow', () => {
    expect(clampScrollLeft(0, 0, 100)).toBe(0)
  })

  it('clamps within [0, maxLeft]', () => {
    expect(clampScrollLeft(10, 100, 50)).toBe(60)
    expect(clampScrollLeft(10, 100, -50)).toBe(0)
    expect(clampScrollLeft(90, 100, 50)).toBe(100)
  })
})

describe('columnScrollLeft', () => {
  it('centers the column in the viewport', () => {
    expect(columnScrollLeft(10, 54, 540)).toBe(10 * 54 - 270 + 27)
  })

  it('returns 0 for invalid column', () => {
    expect(columnScrollLeft(-1, 54, 540)).toBe(0)
  })
})
