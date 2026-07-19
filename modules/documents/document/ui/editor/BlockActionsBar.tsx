'use client'

import type { PlateEditor } from 'platejs/react'
import { ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react'
import { Select, Button } from '@/shared/ui'
import { cn } from '@/utils/cn'
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
        'flex flex-wrap items-center gap-1 border-b border-neutral-100 bg-white px-2 py-1',
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
        className="min-w-[8rem] max-w-[10rem]"
      />
      <Button
        size="sm"
        variant="ghost"
        iconOnly
        aria-label="Move block up"
        title="Move up"
        onClick={() => moveCurrentBlock(editor, 'up')}
        icon={<ArrowUp size={14} />}
      />
      <Button
        size="sm"
        variant="ghost"
        iconOnly
        aria-label="Move block down"
        title="Move down"
        onClick={() => moveCurrentBlock(editor, 'down')}
        icon={<ArrowDown size={14} />}
      />
      <Button
        size="sm"
        variant="ghost"
        iconOnly
        aria-label="Duplicate block"
        title="Duplicate"
        onClick={() => duplicateCurrentBlock(editor)}
        icon={<Copy size={14} />}
      />
      <Button
        size="sm"
        variant="ghost"
        iconOnly
        aria-label="Delete block"
        title="Delete"
        onClick={() => deleteCurrentBlock(editor)}
        icon={<Trash2 size={14} />}
      />
    </div>
  )
}
