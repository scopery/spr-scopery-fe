import { describe, expect, it } from 'vitest'
import { AiConversationStatus } from '@/modules/ai-assistant/domain/enums/ai-assistant.enum'
import type { AiConversation } from '@/modules/ai-assistant/domain/model/conversation'

/** Mirrors client filter used by useAiAssistant (W5-GAP-03). */
function filterConversations(
  items: AiConversation[],
  tab: 'active' | 'archived',
  search: string
): AiConversation[] {
  const q = search.trim().toLowerCase()
  return items.filter((c) => {
    const archived =
      c.status === AiConversationStatus.Archived || c.status === 'ARCHIVED'
    if (tab === 'active' && archived) return false
    if (tab === 'archived' && !archived) return false
    if (!q) return true
    return (c.title ?? '').toLowerCase().includes(q)
  })
}

describe('W5-B conversation list filter', () => {
  const items: AiConversation[] = [
    {
      id: '1',
      title: 'Alpha guide',
      status: AiConversationStatus.Active,
      createdAt: '2026-01-01',
    },
    {
      id: '2',
      title: 'Beta archived',
      status: AiConversationStatus.Archived,
      createdAt: '2026-01-02',
    },
  ]

  it('shows only active by default', () => {
    expect(filterConversations(items, 'active', '').map((c) => c.id)).toEqual(['1'])
  })

  it('shows only archived when tab=archived', () => {
    expect(filterConversations(items, 'archived', '').map((c) => c.id)).toEqual(['2'])
  })

  it('searches by title within tab', () => {
    expect(filterConversations(items, 'active', 'alpha').map((c) => c.id)).toEqual(['1'])
    expect(filterConversations(items, 'active', 'beta')).toEqual([])
  })
})
