import { describe, expect, it, vi } from 'vitest'
import { getGlobalLoadingCount, subscribeGlobalLoading, trackGlobalLoading } from './globalLoading'

describe('globalLoading', () => {
  it('tracks in-flight requests', () => {
    expect(getGlobalLoadingCount()).toBe(0)

    const endFirst = trackGlobalLoading()
    expect(getGlobalLoadingCount()).toBe(1)

    const endSecond = trackGlobalLoading()
    expect(getGlobalLoadingCount()).toBe(2)

    endFirst()
    expect(getGlobalLoadingCount()).toBe(1)

    endSecond()
    expect(getGlobalLoadingCount()).toBe(0)
  })

  it('notifies subscribers when count changes', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeGlobalLoading(listener)

    listener.mockClear()
    const end = trackGlobalLoading()
    expect(listener).toHaveBeenLastCalledWith(1)

    end()
    expect(listener).toHaveBeenLastCalledWith(0)

    unsubscribe()
  })

  it('skips tracking when disabled', () => {
    const end = trackGlobalLoading(false)
    expect(getGlobalLoadingCount()).toBe(0)
    end()
    expect(getGlobalLoadingCount()).toBe(0)
  })
})
