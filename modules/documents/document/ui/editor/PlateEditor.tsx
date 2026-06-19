'use client'

import { forwardRef, useImperativeHandle, useMemo } from 'react'
import type { Value } from 'platejs'
import { Plate, PlateContent, usePlateEditor } from 'platejs/react'
import { TableProvider } from '@platejs/table/react'
import { createEditorPlugins, plateContentClassName } from './plate-config'
import { BlockActionsBar } from './BlockActionsBar'
import { EditorFloatingToolbar } from './EditorFloatingToolbar'
import { EditorLinkFloating } from './EditorLinkFloating'
import { PlateEditorToolbar } from './PlateEditorToolbar'
import { EditorSlashExtrasContext } from './editor-slash-extras-context'
import type { SlashCommandGroupConfig } from './slash-command-items'

export interface PlateEditorHandle {
  insertText: (text: string) => void
}

interface PlateEditorBodyProps {
  value: Value
  readOnly?: boolean
  onChange?: (value: Value) => void
  placeholder?: string
  slashExtras?: SlashCommandGroupConfig[]
}

export const PlateEditorBody = forwardRef<PlateEditorHandle, PlateEditorBodyProps>(
  function PlateEditorBody(
    { value, readOnly = false, onChange, placeholder = 'Start writing…', slashExtras = [] },
    ref
  ) {
    const plugins = useMemo(() => createEditorPlugins(), [])

    const editor = usePlateEditor({
      plugins,
      value,
      readOnly,
    })

    useImperativeHandle(
      ref,
      () => ({
        insertText: (text: string) => {
          if (readOnly) return
          editor.tf.insertText(text)
        },
      }),
      [editor, readOnly]
    )

    return (
      <EditorSlashExtrasContext.Provider value={slashExtras}>
        <TableProvider>
          <Plate editor={editor} onChange={readOnly ? undefined : ({ value }) => onChange?.(value)}>
            {!readOnly && <PlateEditorToolbar editor={editor} />}
            {!readOnly && <BlockActionsBar editor={editor} />}
            {!readOnly && <EditorLinkFloating />}
            {!readOnly && <EditorFloatingToolbar />}
            <PlateContent
              className={plateContentClassName}
              placeholder={readOnly ? undefined : placeholder}
              readOnly={readOnly}
              aria-label="Document body"
            />
          </Plate>
        </TableProvider>
      </EditorSlashExtrasContext.Provider>
    )
  }
)
