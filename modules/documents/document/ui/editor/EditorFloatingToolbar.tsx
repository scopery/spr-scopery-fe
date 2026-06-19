'use client'

import { KEYS } from 'platejs'
import { useLinkToolbarButton, useLinkToolbarButtonState } from '@platejs/link/react'
import { getDOMSelectionBoundingClientRect, offset, useVirtualFloating } from '@platejs/floating'
import { useEditorRef, useEditorSelector, useFocused, useReadOnly } from 'platejs/react'
import { useEffect, useMemo } from 'react'
import { Button } from '@/shared/ui'
import { cn } from '@/utils/cn'

function MarkButton({ label, mark }: { label: string; mark: string }) {
  const editor = useEditorRef()
  const pressed = useEditorSelector((ed) => !!ed.selection && ed.api.hasMark(mark), [mark])

  return (
    <Button
      variant={pressed ? 'secondary' : 'ghost'}
      size="sm"
      aria-label={label}
      aria-pressed={pressed}
      onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()}
      onClick={() => editor.tf.toggleMark(mark)}
    >
      {label}
    </Button>
  )
}

export function EditorFloatingToolbar() {
  const editor = useEditorRef()
  const readOnly = useReadOnly()
  const focused = useFocused()

  const selectionExpanded = useEditorSelector((ed) => !!ed.selection && !ed.api.isCollapsed(), [])

  const linkState = useLinkToolbarButtonState()
  const linkBtn = useLinkToolbarButton(linkState)

  const open = focused && selectionExpanded && !readOnly

  const getBoundingClientRect = useMemo(() => () => getDOMSelectionBoundingClientRect(), [])

  const floating = useVirtualFloating({
    open,
    getBoundingClientRect,
    placement: 'top',
    middleware: [offset(8)],
  })

  useEffect(() => {
    if (open) floating.update()
  }, [open, floating])

  if (!open) return null

  return (
    <div
      ref={floating.refs.setFloating}
      style={floating.style}
      className={cn(
        'z-50 flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-1 shadow-md'
      )}
      role="toolbar"
      aria-label="Text formatting"
    >
      <MarkButton label="Bold" mark={KEYS.bold} />
      <MarkButton label="Italic" mark={KEYS.italic} />
      <MarkButton label="Underline" mark={KEYS.underline} />
      <MarkButton label="Code" mark={KEYS.code} />
      <Button
        variant={linkBtn.props.pressed ? 'secondary' : 'ghost'}
        size="sm"
        aria-label="Link"
        aria-pressed={linkBtn.props.pressed}
        onMouseDown={linkBtn.props.onMouseDown}
        onClick={linkBtn.props.onClick}
      >
        Link
      </Button>
    </div>
  )
}
