'use client'

import type { PlateEditor } from 'platejs/react'
import { Select, Button } from '@/shared/ui'
import { cn } from '@/utils'
import {
  deleteCurrentBlock,
  duplicateCurrentBlock,
  moveCurrentBlock,
  setBlockType,
} from './block-transforms'
import { TURN_INTO_OPTIONS } from './slash-command-items'

interface BlockActionsBarProps {
  editor: PlateEditor
  className?: string
}

export function BlockActionsBar({ editor, className }: BlockActionsBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 border-b border-neutral-100 bg-white px-2 py-1.5',
        className
      )}
      role="toolbar"
      aria-label="Block actions"
    >
      <Select
        size="sm"
        placeholder="Turn into…"
        aria-label="Turn block into"
        options={TURN_INTO_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        onValueChange={(value: string) => {
          if (value) setBlockType(editor, value)
        }}
        className="min-w-[140px]"
      />
      <Button
        variant="ghost"
        size="sm"
        aria-label="Move block up"
        onClick={() => moveCurrentBlock(editor, 'up')}
      >
        ↑
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Move block down"
        onClick={() => moveCurrentBlock(editor, 'down')}
      >
        ↓
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Duplicate block"
        onClick={() => duplicateCurrentBlock(editor)}
      >
        Duplicate
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Delete block"
        onClick={() => deleteCurrentBlock(editor)}
      >
        Delete
      </Button>
    </div>
  )
}
