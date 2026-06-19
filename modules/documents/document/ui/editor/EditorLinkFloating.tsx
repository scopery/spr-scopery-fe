'use client'

import {
  FloatingLinkUrlInput,
  LinkPlugin,
  submitFloatingLink,
  useFloatingLinkEdit,
  useFloatingLinkEditState,
  useFloatingLinkInsert,
  useFloatingLinkInsertState,
} from '@platejs/link/react'
import { useEditorRef, usePluginOption } from 'platejs/react'
import { Button } from '@/shared/ui'
import { cn } from '@/utils/cn'

export function EditorLinkFloating() {
  const editor = useEditorRef()
  const insertState = useFloatingLinkInsertState()
  const insert = useFloatingLinkInsert(insertState)
  const editState = useFloatingLinkEditState()
  const edit = useFloatingLinkEdit(editState)
  const mode = usePluginOption(LinkPlugin, 'mode')

  const isInsertOpen = mode === 'insert' && !insert.hidden
  const isEditOpen = mode === 'edit'

  if (!isInsertOpen && !isEditOpen) return null

  const floatingProps = isInsertOpen ? insert.props : edit.props
  const floatingRef = isInsertOpen ? insert.ref : edit.ref

  return (
    <div
      ref={floatingRef}
      {...floatingProps}
      className={cn(
        'flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2 shadow-md',
        'min-w-[280px]'
      )}
      role="dialog"
      aria-label="Link editor"
    >
      <FloatingLinkUrlInput
        className="flex-1 rounded-md border border-neutral-200 px-2 py-1.5 text-sm outline-none focus:border-neutral-400"
        placeholder="Paste or type a URL"
        aria-label="Link URL"
      />
      {isInsertOpen && (
        <input {...insert.textInputProps} className="hidden" aria-hidden tabIndex={-1} />
      )}
      <Button
        type="button"
        size="sm"
        variant="primary"
        aria-label="Apply link"
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()}
        onClick={() => submitFloatingLink(editor)}
      >
        Apply
      </Button>
      {isEditOpen && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label="Remove link"
          {...edit.unlinkButtonProps}
        >
          Remove
        </Button>
      )}
    </div>
  )
}
