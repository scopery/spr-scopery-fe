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
import { cn } from '@/utils/cn'

export interface PlateEditorHandle {
  insertText: (text: string) => void
}

interface PlateEditorBodyProps {
  value: Value
  readOnly?: boolean
  onChange?: (value: Value) => void
  placeholder?: string
  slashExtras?: SlashCommandGroupConfig[]
  /** Stretch to parent height; content scrolls inside (immersive editor). */
  fillHeight?: boolean
}

export const PlateEditorBody = forwardRef<PlateEditorHandle, PlateEditorBodyProps>(
  function PlateEditorBody(
    {
      value,
      readOnly = false,
      onChange,
      placeholder = 'Start writing…',
      slashExtras = [],
      fillHeight = false,
    },
    ref
  ) {
    const plugins = useMemo(() => createEditorPlugins(), [])

    const editor = usePlateEditor({
      plugins,
      value,
      readOnly,
      // Slate chunking + content-visibility:auto — default chunkSize (1000) is too
      // coarse for typical docs; smaller chunks keep paint cost down after large pastes.
      chunking: {
        chunkSize: 64,
        contentVisibilityAuto: true,
      },
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
          <Plate
            editor={editor}
            onChange={readOnly ? undefined : ({ value }) => onChange?.(value)}
          >
            <div
              className={cn(
                'flex min-h-0 flex-col',
                fillHeight ? 'h-full min-h-full flex-1' : 'flex-1'
              )}
            >
              {!readOnly && <PlateEditorToolbar editor={editor} />}
              {!readOnly && <BlockActionsBar editor={editor} />}
              {!readOnly && <EditorLinkFloating />}
              {!readOnly && <EditorFloatingToolbar />}
              <PlateContent
                className={cn(
                  plateContentClassName,
                  fillHeight
                    ? 'min-h-0 flex-1 overflow-y-auto'
                    : 'min-h-[min(70vh,640px)]'
                )}
                placeholder={readOnly ? undefined : placeholder}
                readOnly={readOnly}
                aria-label="Document body"
              />
            </div>
          </Plate>
        </TableProvider>
      </EditorSlashExtrasContext.Provider>
    )
  }
)
