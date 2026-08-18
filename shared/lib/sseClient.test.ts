import { describe, expect, it, vi } from 'vitest'
import {
  extractSseTextDelta,
  isSseTerminalEvent,
  openSseStream,
  parseSseChunk,
  parseSseJson,
  resolveSseEventName,
  resolveSseUrl,
  SseEventType,
} from '@/shared/lib/sseClient'

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

  it('parses CRLF-delimited answer.delta frames from Spring', () => {
    const { events, rest } = parseSseChunk(
      'id: 1\r\nevent: answer.delta\r\ndata: {"delta":"Hello"}\r\n\r\npartial'
    )
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      id: '1',
      event: 'answer.delta',
      data: '{"delta":"Hello"}',
    })
    expect(rest).toBe('partial')
  })
})

describe('extractSseTextDelta', () => {
  it('reads BE answer.delta { delta }', () => {
    expect(extractSseTextDelta('{"delta":"Hello"}')).toBe('Hello')
  })

  it('reads Phase 42 { text }', () => {
    expect(extractSseTextDelta('{"text":"Task **API**"}')).toBe('Task **API**')
  })

  it('unwraps Spring double-encoded JSON strings', () => {
    expect(extractSseTextDelta('"{\\"delta\\":\\"Hi\\"}"')).toBe('Hi')
    expect(parseSseJson('"{\\"delta\\":\\"Hi\\"}"')).toEqual({ delta: 'Hi' })
  })

  it('reads nested delta.content objects', () => {
    expect(extractSseTextDelta('{"delta":{"content":"Hi"}}')).toBe('Hi')
  })

  it('keeps raw text when data is not JSON', () => {
    expect(extractSseTextDelta('plain token')).toBe('plain token')
  })

  it('does not dump the JSON envelope when no token field exists', () => {
    expect(extractSseTextDelta('{"messageId":"m1","sequence":1}')).toBe('')
  })
})

describe('isSseTerminalEvent', () => {
  it('treats STATUS_CHANGED COMPLETED as terminal', () => {
    expect(isSseTerminalEvent('STATUS_CHANGED', '{"status":"COMPLETED"}')).toBe(true)
    expect(isSseTerminalEvent('STATUS_CHANGED', '{"status":"GENERATING"}')).toBe(false)
    expect(isSseTerminalEvent('TOKEN', '{"token":"x"}')).toBe(false)
  })
})

describe('resolveSseUrl', () => {
  it('keeps relative AI stream URLs on the same-origin API rewrite', () => {
    expect(resolveSseUrl('/api/v1/ai-assistant/messages/1/stream')).toBe(
      '/api/v1/ai-assistant/messages/1/stream'
    )
  })

  it('strips a BE host so the browser never hits a bad TLS cert', () => {
    expect(
      resolveSseUrl('https://136-85-104-51.sslip.io/api/v1/ai-assistant/messages/abc/stream')
    ).toBe('/api/v1/ai-assistant/messages/abc/stream')
  })

  it('unwraps the old /api/sse prefix back onto the rewrite path', () => {
    expect(resolveSseUrl('/api/sse/v1/ai-assistant/messages/1/stream')).toBe(
      '/api/v1/ai-assistant/messages/1/stream'
    )
  })
})

describe('resolveSseEventName', () => {
  it('keeps a named SSE event', () => {
    expect(
      resolveSseEventName({ event: 'answer.delta', data: '{"delta":"x"}' })
    ).toBe('answer.delta')
  })

  it('reads type from JSON when event is the default message', () => {
    expect(
      resolveSseEventName({
        event: 'message',
        data: '{"eventType":"answer.completed","status":"COMPLETED"}',
      })
    ).toBe('answer.completed')
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

  it('does not send Last-Event-ID when seeded as 0', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      body: {
        getReader: () => ({
          read: async () => ({ done: true, value: undefined }),
        }),
      },
    }))
    vi.stubGlobal('fetch', fetchMock)

    await new Promise<void>((resolve) => {
      openSseStream({
        url: '/api/v1/ai-assistant/messages/1/stream',
        initialLastEventId: '0',
        onEvent: () => undefined,
        onDone: () => resolve(),
        onError: () => resolve(),
        maxReconnects: 0,
      })
    })

    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers)
    expect(headers.get('Last-Event-ID')).toBeNull()
    vi.unstubAllGlobals()
  })

  it('flushes a trailing COMPLETED frame without a blank line', async () => {
    const chunks = ['id: 9\nevent: COMPLETED\ndata: {}']
    let i = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
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

    expect(events).toContain('COMPLETED')
    vi.unstubAllGlobals()
  })

  it('resolves default message events and double-encoded answer.delta payloads', async () => {
    const chunks = [
      'event: message\ndata: {"eventType":"answer.delta","delta":"Hello"}\n\n',
      'id: 2\nevent: answer.delta\ndata: "{\\"delta\\":\\" world\\"}"\n\n',
      'event: message\ndata: {"type":"answer.completed"}\n\n',
    ]
    let i = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
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
      }))
    )

    const names: string[] = []
    const tokens: string[] = []
    await new Promise<void>((resolve) => {
      openSseStream({
        url: '/api/v1/ai-assistant/messages/1/stream',
        onEvent: (ev) => {
          names.push(ev.event)
          if (ev.event === 'answer.delta') tokens.push(extractSseTextDelta(ev.data))
        },
        onDone: () => resolve(),
        maxReconnects: 0,
      })
    })

    expect(names).toEqual(['answer.delta', 'answer.delta', 'answer.completed'])
    expect(tokens.join('')).toBe('Hello world')
    vi.unstubAllGlobals()
  })

  it('does not surface onError on the first mid-stream drop', async () => {
    const fetchMock = vi.fn()
    let call = 0
    fetchMock.mockImplementation(async () => {
      call += 1
      if (call === 1) throw new Error('network drop')
      const chunks = ['id: 1\nevent: COMPLETED\ndata: {}\n\n']
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

    const errors: unknown[] = []
    await new Promise<void>((resolve, reject) => {
      openSseStream({
        url: '/api/v1/ai-assistant/messages/1/stream',
        onEvent: () => undefined,
        onError: (err) => errors.push(err),
        onDone: () => resolve(),
        maxReconnects: 2,
        reconnectDelayMs: 1,
      })
      setTimeout(() => reject(new Error('SSE transient error test timed out')), 3000)
    })

    expect(errors).toHaveLength(0)
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2)
    vi.unstubAllGlobals()
  })
})
