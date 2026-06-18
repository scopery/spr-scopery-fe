'use client'

import type { PlateEditor } from 'platejs/react'
import { KEYS } from 'platejs'
import { ListStyleType } from '@platejs/list'
import {
  useIndentTodoToolBarButton,
  useIndentTodoToolBarButtonState,
  useListToolbarButton,
  useListToolbarButtonState,
} from '@platejs/list/react'
import {
  useLinkToolbarButton,
  useLinkToolbarButtonState,
} from '@platejs/link/react'
import { insertCallout } from '@platejs/callout'
import { insertTable } from '@platejs/table'
import {
  useToggleToolbarButton,
  useToggleToolbarButtonState,
} from '@platejs/toggle/react'
import { Button } from '@/shared/ui'
import { cn } from '@/utils'

interface PlateEditorToolbarProps {
  editor: PlateEditor
  className?: string
}

function ToolbarButton({
  label,
  pressed,
  onClick,
  onMouseDown,
}: {
  label: string
  pressed?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <Button
      variant={pressed ? 'secondary' : 'ghost'}
      size="sm"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      {label}
    </Button>
  )
}

export function PlateEditorToolbar({ editor, className }: PlateEditorToolbarProps) {
  const bulletState = useListToolbarButtonState({ nodeType: ListStyleType.Disc })
  const bulletBtn = useListToolbarButton(bulletState)
  const numberedState = useListToolbarButtonState({ nodeType: ListStyleType.Decimal })
  const numberedBtn = useListToolbarButton(numberedState)
  const todoState = useIndentTodoToolBarButtonState({ nodeType: KEYS.listTodo })
  const todoBtn = useIndentTodoToolBarButton(todoState)
  const linkState = useLinkToolbarButtonState()
  const linkBtn = useLinkToolbarButton(linkState)
  const toggleState = useToggleToolbarButtonState()
  const toggleBtn = useToggleToolbarButton(toggleState)

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-50 px-2 py-2',
        className
      )}
      role="toolbar"
      aria-label="Formatting toolbar"
    >
      <ToolbarButton label="Paragraph" onClick={() => editor.tf.toggleBlock(KEYS.p)} />
      <ToolbarButton label="H1" onClick={() => editor.tf.toggleBlock(KEYS.h1)} />
      <ToolbarButton label="H2" onClick={() => editor.tf.toggleBlock(KEYS.h2)} />
      <ToolbarButton label="H3" onClick={() => editor.tf.toggleBlock(KEYS.h3)} />
      <span className="mx-1 h-5 w-px bg-neutral-200" aria-hidden />
      <ToolbarButton label="Bold" onClick={() => editor.tf.toggleMark(KEYS.bold)} />
      <ToolbarButton label="Italic" onClick={() => editor.tf.toggleMark(KEYS.italic)} />
      <ToolbarButton label="Underline" onClick={() => editor.tf.toggleMark(KEYS.underline)} />
      <ToolbarButton label="Code" onClick={() => editor.tf.toggleMark(KEYS.code)} />
      <span className="mx-1 h-5 w-px bg-neutral-200" aria-hidden />
      <ToolbarButton {...bulletBtn.props} label="Bullets" />
      <ToolbarButton {...numberedBtn.props} label="Numbered" />
      <ToolbarButton {...todoBtn.props} label="Checklist" />
      <ToolbarButton
        label="Quote"
        onClick={() => editor.tf.toggleBlock(KEYS.blockquote)}
      />
      <ToolbarButton
        label="Callout"
        onClick={() => insertCallout(editor, { variant: 'note' })}
      />
      <ToolbarButton {...toggleBtn.props} label="Toggle" />
      <ToolbarButton
        label="Code block"
        onClick={() => editor.tf.toggleBlock(KEYS.codeBlock)}
      />
      <ToolbarButton
        label="Divider"
        onClick={() =>
          editor.tf.insertNodes([{ type: KEYS.hr, children: [{ text: '' }] }])
        }
      />
      <ToolbarButton
        label="Table"
        onClick={() => insertTable(editor, { rowCount: 3, colCount: 3 })}
      />
      <ToolbarButton {...linkBtn.props} label="Link" />
    </div>
  )
}
