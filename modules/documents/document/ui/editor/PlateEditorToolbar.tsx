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
import { useLinkToolbarButton, useLinkToolbarButtonState } from '@platejs/link/react'
import { insertCallout } from '@platejs/callout'
import { insertTable } from '@platejs/table'
import { useToggleToolbarButton, useToggleToolbarButtonState } from '@platejs/toggle/react'
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Table2,
  TextCursorInput,
  Underline,
  ChevronsDownUp,
  MessageSquareQuote,
  Braces,
} from 'lucide-react'
import { Button } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { TextHighlightToolbarControl } from './TextHighlightPlugin'

interface PlateEditorToolbarProps {
  editor: PlateEditor
  className?: string
}

function ToolbarButton({
  label,
  icon,
  pressed,
  onClick,
  onMouseDown,
}: {
  label: string
  icon: React.ReactNode
  pressed?: boolean
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <Button
      size="sm"
      variant={pressed ? 'secondary' : 'ghost'}
      iconOnly
      icon={icon}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      onMouseDown={onMouseDown}
    />
  )
}

function Divider() {
  return <span className="mx-0.5 hidden h-5 w-px shrink-0 bg-neutral-200 sm:block" aria-hidden />
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
        'flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5',
        className
      )}
      role="toolbar"
      aria-label="Formatting toolbar"
    >
      <ToolbarButton
        label="Paragraph"
        icon={<TextCursorInput size={15} />}
        onClick={() => editor.tf.toggleBlock(KEYS.p)}
      />
      <ToolbarButton label="Heading 1" icon={<Heading1 size={15} />} onClick={() => editor.tf.toggleBlock(KEYS.h1)} />
      <ToolbarButton label="Heading 2" icon={<Heading2 size={15} />} onClick={() => editor.tf.toggleBlock(KEYS.h2)} />
      <ToolbarButton label="Heading 3" icon={<Heading3 size={15} />} onClick={() => editor.tf.toggleBlock(KEYS.h3)} />
      <Divider />
      <ToolbarButton label="Bold" icon={<Bold size={15} />} onClick={() => editor.tf.toggleMark(KEYS.bold)} />
      <ToolbarButton label="Italic" icon={<Italic size={15} />} onClick={() => editor.tf.toggleMark(KEYS.italic)} />
      <ToolbarButton
        label="Underline"
        icon={<Underline size={15} />}
        onClick={() => editor.tf.toggleMark(KEYS.underline)}
      />
      <ToolbarButton label="Code" icon={<Code2 size={15} />} onClick={() => editor.tf.toggleMark(KEYS.code)} />
      <TextHighlightToolbarControl />
      <Divider />
      <ToolbarButton {...bulletBtn.props} label="Bullets" icon={<List size={15} />} />
      <ToolbarButton {...numberedBtn.props} label="Numbered" icon={<ListOrdered size={15} />} />
      <ToolbarButton {...todoBtn.props} label="Checklist" icon={<ListTodo size={15} />} />
      <ToolbarButton
        label="Quote"
        icon={<Quote size={15} />}
        onClick={() => editor.tf.toggleBlock(KEYS.blockquote)}
      />
      <ToolbarButton
        label="Callout"
        icon={<MessageSquareQuote size={15} />}
        onClick={() => insertCallout(editor, { variant: 'note' })}
      />
      <ToolbarButton {...toggleBtn.props} label="Toggle" icon={<ChevronsDownUp size={15} />} />
      <ToolbarButton
        label="Code block"
        icon={<Braces size={15} />}
        onClick={() => editor.tf.toggleBlock(KEYS.codeBlock)}
      />
      <ToolbarButton
        label="Divider"
        icon={<Minus size={15} />}
        onClick={() => editor.tf.insertNodes([{ type: KEYS.hr, children: [{ text: '' }] }])}
      />
      <ToolbarButton
        label="Table"
        icon={<Table2 size={15} />}
        onClick={() => insertTable(editor, { rowCount: 3, colCount: 3 })}
      />
      <ToolbarButton {...linkBtn.props} label="Link" icon={<Link2 size={15} />} />
    </div>
  )
}
