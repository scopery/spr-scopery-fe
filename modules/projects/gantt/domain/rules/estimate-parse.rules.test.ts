import { describe, expect, it } from 'vitest'
import { formatEstimateHours, parseEstimateHours } from './estimate-parse.rules'

describe('parseEstimateHours', () => {
  it('parses hours and days', () => {
    expect(parseEstimateHours('8')).toBe(8)
    expect(parseEstimateHours('8h')).toBe(8)
    expect(parseEstimateHours('3.5h')).toBe(3.5)
    expect(parseEstimateHours('2d')).toBe(16)
    expect(parseEstimateHours('1.5d')).toBe(12)
  })

  it('rejects invalid input', () => {
    expect(parseEstimateHours('')).toBeNull()
    expect(parseEstimateHours('abc')).toBeNull()
    expect(parseEstimateHours('0h')).toBeNull()
  })
})

describe('formatEstimateHours', () => {
  it('formats day multiples as d', () => {
    expect(formatEstimateHours(16)).toBe('2d')
    expect(formatEstimateHours(8)).toBe('1d')
    expect(formatEstimateHours(5)).toBe('5h')
  })
})
