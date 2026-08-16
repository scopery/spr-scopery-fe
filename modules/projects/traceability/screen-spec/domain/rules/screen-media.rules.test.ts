import { describe, expect, it } from 'vitest'
import { SCREEN_MEDIA_MAX_BYTES, validateScreenMediaFile } from './screen-media.rules'

function file(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(size)], { type })
  return new File([blob], name, { type })
}

describe('validateScreenMediaFile', () => {
  it('accepts a small png', () => {
    expect(validateScreenMediaFile(file('a.png', 'image/png', 128))).toBeNull()
  })

  it('rejects over 5MB', () => {
    expect(validateScreenMediaFile(file('a.png', 'image/png', SCREEN_MEDIA_MAX_BYTES + 1))).toBe(
      'Image must be 5MB or smaller.'
    )
  })

  it('rejects non-image types', () => {
    expect(validateScreenMediaFile(file('a.pdf', 'application/pdf', 128))).toBe(
      'Use PNG, JPEG, WebP, or GIF.'
    )
  })
})
