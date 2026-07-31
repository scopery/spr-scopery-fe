import { describe, expect, it, vi } from 'vitest'
import { openSseStream, parseSseChunk, SseEventType } from '@/shared/lib/sseClient'

describe('parseSseChunk', () => {
  it('parses Wave 5 TOKEN / COMPLETED events with ids', () => {
    const { events, rest } = parseSseChunk(
      [
        'id: 1',
        'event: TOKEN',
        'data: {"token":"Hello"}',
        '',
        'id: 2',
        'event: COMPLETED',
        'data: {"messageId":"m1"}',
        '',
        'partial',
      ].join('\n')
    )
    expect(events).toHaveLength(2)
    expect(events[0]).toMatchObject({ id: '1', event: SseEventType.Token })
    expect(events[1]).toMatchObject({ id: '2', event: SseEventType.Completed })
    expect(rest).toBe('partial')
  })

  it('exposes heartbeat comments', () => {
    const { events } = parseSseChunk(': heartbeat\n\n')
    expect(events[0]?.event).toBe(SseEventType.Heartbeat)
  })
})

describe('openSseStream', () => {
  it('parses SSE events from a stream body', async () => {
    const chunks = [
      'event: message.delta\ndata: {"delta":"Hello"}\n\n',
      'event: message.completed\ndata: {}\n\n',
    ]
    let i = 0
    const reader = {
      read: vi.fn(async () => {
        if (i >= chunks.length) return { done: true, value: undefined }
        const value = new TextEncoder().encode(chunks[i++])
        return { done: false, value }
      }),
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        body: { getReader: () => reader },
      }))
    )

    const events: string[] = []
    await new Promise<void>((resolve) => {
      openSseStream({
        url: '/api/v1/ai-assistant/messages/1/stream',
        onEvent: (ev) => events.push(ev.event),
        onDone: () => resolve(),
        maxReconnects: 0,
      })
    })

    expect(events).toContain('message.delta')
    expect(events).toContain('message.completed')
    vi.unstubAllGlobals()
  })

  it('sends Last-Event-ID on reconnect after mid-stream drop', async () => {
    const fetchMock = vi.fn()
    let call = 0

    fetchMock.mockImplementation(async () => {
      call += 1
      const chunks =
        call === 1
          ? ['id: 42\nevent: TOKEN\ndata: {"token":"Hi"}\n\n']
          : ['id: 43\nevent: COMPLETED\ndata: {}\n\n']
      let i = 0
      return {
        ok: true,
        body: {
          getReader: () => ({
            read: async () => {
              if (i >= chunks.length) return { done: true, value: undefined }
              const value = new TextEncoder().encode(chunks[i++])
              return { done: false, value }
            },
          }),
        },
      }
    })

    vi.stubGlobal('fetch', fetchMock)

    const reconnects: Array<{ attempt: number; lastEventId: string | null }> = []
    await Promise.race([
      new Promise<void>((resolve, reject) => {
        openSseStream({
          url: '/api/v1/ai-assistant/messages/1/stream',
          onEvent: () => undefined,
          onReconnect: (attempt, lastEventId) => {
            reconnects.push({ attempt, lastEventId })
          },
          onDone: () => resolve(),
          onError: () => undefined,
          maxReconnects: 2,
          reconnectDelayMs: 1,
        })
        setTimeout(() => reject(new Error('SSE reconnect test timed out')), 3000)
      }),
    ])

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2)
    const secondHeaders = (fetchMock.mock.calls[1]?.[1] as { headers?: Record<string, string> })
      ?.headers
    expect(secondHeaders?.['Last-Event-ID']).toBe('42')
    expect(reconnects[0]?.lastEventId).toBe('42')
    vi.unstubAllGlobals()
  })

  it('seeds Last-Event-ID from initialLastEventId', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      const chunks = ['id: 99\nevent: COMPLETED\ndata: {}\n\n']
      let i = 0
      return {
        ok: true,
        body: {
          getReader: () => ({
            read: async () => {
              if (i >= chunks.length) return { done: true, value: undefined }
              const value = new TextEncoder().encode(chunks[i++])
              return { done: false, value }
            },
          }),
        },
      }
    })
    vi.stubGlobal('fetch', fetchMock)

    await new Promise<void>((resolve) => {
      openSseStream({
        url: '/api/v1/ai-assistant/messages/1/stream',
        initialLastEventId: '10',
        onEvent: () => undefined,
        onDone: () => resolve(),
        maxReconnects: 0,
      })
    })

    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers)
    expect(headers.get('Last-Event-ID')).toBe('10')
    vi.unstubAllGlobals()
  })
})
