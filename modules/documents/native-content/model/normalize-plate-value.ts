import type { Value } from 'platejs'
import { emptyPlateValue } from '@/modules/documents/document/ui/editor/empty-plate-value'

type UnknownRecord = Record<string, unknown>

function isRecord(v: unknown): v is UnknownRecord {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v)
}

/** TipTap / ProseMirror-like node (uses `content`, not Slate `children`). */
function looksLikeTipTapNode(node: UnknownRecord): boolean {
  if (Array.isArray(node.content)) return true
  if (node.type === 'text' && typeof node.text === 'string') return true
  if (typeof node.type === 'string') {
    return [
      'doc',
      'paragraph',
      'heading',
      'bulletList',
      'orderedList',
      'listItem',
      'blockquote',
      'codeBlock',
      'horizontalRule',
      'hardBreak',
    ].includes(node.type)
  }
  return false
}

function mapBlockType(type: string, attrs?: UnknownRecord): string {
  switch (type) {
    case 'paragraph':
      return 'p'
    case 'heading': {
      const level = Number(attrs?.level ?? 1)
      if (level === 2) return 'h2'
      if (level === 3) return 'h3'
      return 'h1'
    }
    case 'blockquote':
      return 'blockquote'
    case 'codeBlock':
      return 'code_block'
    case 'horizontalRule':
      return 'hr'
    case 'bulletList':
      return 'ul'
    case 'orderedList':
      return 'ol'
    case 'listItem':
      return 'li'
    default:
      return type || 'p'
  }
}

function marksToProps(marks: unknown): UnknownRecord {
  if (!Array.isArray(marks)) return {}
  const props: UnknownRecord = {}
  for (const mark of marks) {
    if (!isRecord(mark) || typeof mark.type !== 'string') continue
    if (mark.type === 'bold') props.bold = true
    else if (mark.type === 'italic') props.italic = true
    else if (mark.type === 'underline') props.underline = true
    else if (mark.type === 'code') props.code = true
    else if (mark.type === 'highlightBg') {
      const tone = mark.attrs && isRecord(mark.attrs) ? mark.attrs.tone : mark.tone
      if (typeof tone === 'string') props.highlightBg = tone
    } else if (mark.type === 'highlightText') {
      const tone = mark.attrs && isRecord(mark.attrs) ? mark.attrs.tone : mark.tone
      if (typeof tone === 'string') props.highlightText = tone
    } else if (mark.type === 'textHighlight' || mark.type === 'highlight') {
      const tone = mark.attrs && isRecord(mark.attrs) ? mark.attrs.tone : mark.tone
      if (typeof tone === 'string') props.highlightBg = tone
      else props.highlightBg = 'amber'
    }
  }
  return props
}

function convertTipTapNode(node: unknown): UnknownRecord | UnknownRecord[] {
  if (!isRecord(node)) {
    return { text: node == null ? '' : String(node) }
  }

  if (node.type === 'hardBreak') {
    return { text: '\n' }
  }

  if (node.type === 'text' || (typeof node.text === 'string' && !Array.isArray(node.content))) {
    return {
      text: String(node.text ?? ''),
      ...marksToProps(node.marks),
    }
  }

  if (node.type === 'doc') {
    const content = Array.isArray(node.content) ? node.content : []
    return content.flatMap((child) => {
      const converted = convertTipTapNode(child)
      return Array.isArray(converted) ? converted : [converted]
    })
  }

  const type = mapBlockType(String(node.type ?? 'p'), isRecord(node.attrs) ? node.attrs : undefined)
  const rawChildren = Array.isArray(node.content)
    ? node.content
    : Array.isArray(node.children)
      ? node.children
      : []

  const children = rawChildren.flatMap((child) => {
    const converted = convertTipTapNode(child)
    return Array.isArray(converted) ? converted : [converted]
  })

  // Slate elements must have a non-empty children array
  return {
    type,
    children: children.length > 0 ? children : [{ text: '' }],
  }
}

function hasChildren(node: unknown): boolean {
  return isRecord(node) && Array.isArray(node.children)
}

/** True when value looks like a valid Slate/Plate element list. */
export function isSlateElementList(value: unknown): value is Value {
  if (!Array.isArray(value) || value.length === 0) return false
  return value.every((node) => {
    if (!isRecord(node)) return false
    if (typeof node.text === 'string' && !hasChildren(node)) return false
    return hasChildren(node)
  })
}

/**
 * Coerce TipTap / ProseMirror / Plate payloads into a Plate Value.
 * Always returns a non-empty Slate element list.
 */
export function normalizeToPlateValue(raw: unknown): Value {
  if (raw == null) return emptyPlateValue()

  let nodes: unknown = raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return emptyPlateValue()
    try {
      nodes = JSON.parse(trimmed)
    } catch {
      return emptyPlateValue()
    }
  }

  if (isRecord(nodes) && Array.isArray(nodes.content) && (nodes.type === 'doc' || !nodes.children)) {
    nodes = nodes.content
  }

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return emptyPlateValue()
  }

  const needsConvert = nodes.some((n) => isRecord(n) && looksLikeTipTapNode(n))
  if (needsConvert) {
    const converted = nodes.flatMap((n) => {
      const next = convertTipTapNode(n)
      return Array.isArray(next) ? next : [next]
    })
    const elements = converted.filter(hasChildren)
    return (elements.length > 0 ? elements : emptyPlateValue()) as Value
  }

  if (isSlateElementList(nodes)) return nodes

  // Soft repair: wrap text-only roots / missing children
  const repaired = nodes.map((n) => {
    if (!isRecord(n)) return { type: 'p', children: [{ text: String(n ?? '') }] }
    if (typeof n.text === 'string' && !hasChildren(n)) {
      return { type: 'p', children: [{ text: n.text }] }
    }
    if (!hasChildren(n)) {
      return { type: String(n.type ?? 'p'), children: [{ text: '' }] }
    }
    return n
  })

  return (repaired.length > 0 ? repaired : emptyPlateValue()) as Value
}
