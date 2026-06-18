'use client'

import { useMemo } from 'react'
import type { Value } from 'platejs'
import { Typography } from '@/shared/ui'
import { PlateEditorBody } from './PlateEditor'
import { contentToPlateValue } from './content-adapter'

interface DocumentReadOnlyRendererProps {
  content: unknown
}

export function DocumentReadOnlyRenderer({ content }: DocumentReadOnlyRendererProps) {
  const plateValue = useMemo(() => contentToPlateValue(content), [content])

  const hasText = plateValue.some((node) => {
    const walk = (n: unknown): boolean => {
      if (!n || typeof n !== 'object') return false
      const obj = n as { text?: string; children?: unknown[] }
      if (typeof obj.text === 'string' && obj.text.trim()) return true
      return Array.isArray(obj.children) && obj.children.some(walk)
    }
    return walk(node)
  })

  if (!hasText) {
    return (
      <Typography tone="muted" className="italic px-4 py-3">
        Empty document
      </Typography>
    )
  }

  return (
    <div className="border-t border-neutral-200">
      <PlateEditorBody value={plateValue as Value} readOnly placeholder="" />
    </div>
  )
}
