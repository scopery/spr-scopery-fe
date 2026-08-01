/** Structured Use Case Flow step content with ID-based @mentions. */

export const FlowMentionEntityType = {
  Screen: 'SCREEN',
  Component: 'COMPONENT',
  Api: 'API',
  Entity: 'ENTITY',
  Communication: 'COMMUNICATION',
} as const
export type FlowMentionEntityType =
  (typeof FlowMentionEntityType)[keyof typeof FlowMentionEntityType]

export interface FlowMentionAttrs {
  entityType: FlowMentionEntityType | string
  entityId: string
  label: string
  screenId?: string | null
  outOfScope?: boolean
}

export interface FlowTextNode {
  type: 'text'
  text: string
}

export interface FlowMentionNode {
  type: 'mention'
  attrs: FlowMentionAttrs
}

export type FlowContentNode = FlowTextNode | FlowMentionNode

export interface FlowMentionDoc {
  type: 'doc'
  content: FlowContentNode[]
}

export function isFlowMentionDoc(value: unknown): value is FlowMentionDoc {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as FlowMentionDoc).type === 'doc' &&
    Array.isArray((value as FlowMentionDoc).content)
  )
}

export function parseFlowContent(contentJson: string | null | undefined): FlowMentionDoc {
  if (!contentJson || !contentJson.trim()) {
    return { type: 'doc', content: [] }
  }
  try {
    const parsed: unknown = JSON.parse(contentJson)
    if (isFlowMentionDoc(parsed)) {
      return {
        type: 'doc',
        content: parsed.content.filter(
          (n): n is FlowContentNode =>
            (n.type === 'text' && typeof (n as FlowTextNode).text === 'string') ||
            (n.type === 'mention' &&
              typeof (n as FlowMentionNode).attrs?.entityId === 'string' &&
              typeof (n as FlowMentionNode).attrs?.label === 'string')
        ),
      }
    }
  } catch {
    // legacy plain text
  }
  return { type: 'doc', content: [{ type: 'text', text: contentJson }] }
}

export function serializeFlowContent(doc: FlowMentionDoc): string {
  return JSON.stringify(doc)
}

export function flowContentToPlainText(doc: FlowMentionDoc): string {
  return doc.content
    .map((n) => (n.type === 'text' ? n.text : `@${n.attrs.label}`))
    .join('')
}

export function extractMentions(doc: FlowMentionDoc): FlowMentionAttrs[] {
  return doc.content.filter((n): n is FlowMentionNode => n.type === 'mention').map((n) => n.attrs)
}

export function appendText(doc: FlowMentionDoc, text: string): FlowMentionDoc {
  if (!text) return doc
  const content = [...doc.content]
  const last = content[content.length - 1]
  if (last?.type === 'text') {
    content[content.length - 1] = { type: 'text', text: last.text + text }
  } else {
    content.push({ type: 'text', text })
  }
  return { type: 'doc', content }
}

export function appendMention(doc: FlowMentionDoc, attrs: FlowMentionAttrs): FlowMentionDoc {
  return {
    type: 'doc',
    content: [...doc.content, { type: 'mention', attrs }],
  }
}

/** Backspace from the end: shrink last text node, or drop last mention. */
export function backspaceDoc(doc: FlowMentionDoc): FlowMentionDoc {
  if (doc.content.length === 0) return doc
  const content = [...doc.content]
  const last = content[content.length - 1]
  if (last.type === 'mention') {
    content.pop()
    return { type: 'doc', content }
  }
  if (last.text.length <= 1) {
    content.pop()
    return { type: 'doc', content }
  }
  content[content.length - 1] = { type: 'text', text: last.text.slice(0, -1) }
  return { type: 'doc', content }
}

export function removeContentAt(doc: FlowMentionDoc, index: number): FlowMentionDoc {
  if (index < 0 || index >= doc.content.length) return doc
  return { type: 'doc', content: doc.content.filter((_, i) => i !== index) }
}

export function markOutOfScopeMentions(
  doc: FlowMentionDoc,
  outOfScopeKeys: Set<string>
): FlowMentionDoc {
  return {
    type: 'doc',
    content: doc.content.map((n) => {
      if (n.type !== 'mention') return n
      const key = `${n.attrs.entityType}:${n.attrs.entityId}`
      return {
        ...n,
        attrs: { ...n.attrs, outOfScope: outOfScopeKeys.has(key) },
      }
    }),
  }
}

export interface UseCaseFlowScope {
  useCaseId: string
  function: { id: string; code: string; name: string } | null
  screens: Array<{ id: string; code: string; name: string; componentCount: number }>
  apis: Array<{ id: string; name: string }>
  entities: Array<{ id: string; name: string }>
  communications: Array<{ id: string; name: string }>
}

export interface UseCaseMentionOption {
  entityType: string
  entityId: string
  label: string
  parentLabel?: string | null
  parentId?: string | null
  screenId?: string | null
}

export interface UseCaseMentionOptionsResponse {
  items: UseCaseMentionOption[]
  limit: number
  mode: string
}

export interface PrimaryFunctionChangeImpact {
  useCaseId: string
  currentFunctionId?: string | null
  newFunctionId: string
  outOfScopeMentions: Array<{
    entityType: string
    entityId: string
    label?: string | null
    screenId?: string | null
    stepId?: string | null
  }>
}
