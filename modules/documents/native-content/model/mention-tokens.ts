import type { Value } from 'platejs'
import type { ResourceRef } from './intelligence'
import {
  RESOURCE_MENTION_KEY,
  SYNCED_BLOCK_KEY,
  type ResourceMentionElement,
} from '@/modules/documents/document/ui/editor/resource-embed-plugins'

/** Legacy text tokens: `@[label](TYPE:uuid)` */
const MENTION_TOKEN_RE = /@\[([^\]]*)\]\(([A-Z0-9_]+):([0-9a-fA-F-]{36})\)/g

export interface ExtractedMention {
  label: string
  resourceType: string
  resourceId: string
}

function walkNodes(nodes: unknown, visit: (node: Record<string, unknown>) => void): void {
  if (!Array.isArray(nodes)) return
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue
    const n = node as Record<string, unknown>
    visit(n)
    if (n.children) walkNodes(n.children, visit)
  }
}

function collectText(nodes: unknown): string {
  const parts: string[] = []
  walkNodes(nodes, (n) => {
    if (typeof n.text === 'string') parts.push(n.text)
  })
  return parts.join('\n')
}

export function extractMentionsFromPlateValue(value: Value): ExtractedMention[] {
  const found: ExtractedMention[] = []
  const seen = new Set<string>()

  walkNodes(value, (n) => {
    if (n.type === RESOURCE_MENTION_KEY) {
      const m = n as unknown as ResourceMentionElement
      const key = `${m.resourceType}:${m.resourceId}`
      if (!m.resourceType || !m.resourceId || seen.has(key)) return
      seen.add(key)
      found.push({
        label: m.label ?? '',
        resourceType: m.resourceType,
        resourceId: m.resourceId,
      })
    }
  })

  const text = collectText(value)
  for (const match of text.matchAll(MENTION_TOKEN_RE)) {
    const label = match[1] ?? ''
    const resourceType = match[2] ?? ''
    const resourceId = match[3] ?? ''
    const key = `${resourceType}:${resourceId}`
    if (!resourceType || !resourceId || seen.has(key)) continue
    seen.add(key)
    found.push({ label, resourceType, resourceId })
  }

  return found
}

export function mentionsToRefs(mentions: ExtractedMention[]): ResourceRef[] {
  return mentions.map((m) => ({
    resourceType: m.resourceType,
    resourceId: m.resourceId,
  }))
}

export function extractSyncedBlockIds(value: Value): string[] {
  const ids: string[] = []
  const seen = new Set<string>()
  walkNodes(value, (n) => {
    if (n.type !== SYNCED_BLOCK_KEY) return
    const id = typeof n.syncedBlockId === 'string' ? n.syncedBlockId : ''
    if (!id || seen.has(id)) return
    seen.add(id)
    ids.push(id)
  })
  return ids
}
