'use client'

import type { NodeEntry, SlateEditor } from 'platejs'
import { isHotkey } from 'platejs'
import { createPlatePlugin } from 'platejs/react'
import {
  getNextTableCell,
  getPreviousTableCell,
  getTableEntries,
  insertTableRow,
} from '@platejs/table'

function selectCellStart(editor: SlateEditor, cellEntry: NodeEntry) {
  editor.tf.select(editor.api.start(cellEntry[1]))
}

/**
 * Table keyboard affordances missing from the default Plate table plugin:
 * - Enter stays default → new paragraph / line **inside** the cell
 * - Tab / Shift+Tab → next / previous cell (Tab on last cell inserts a row)
 * - Alt+Enter → insert a row below
 *
 * Exit above/below the table: ExitBreakPlugin (Mod+Enter / Mod+Shift+Enter).
 */
export const TableKeyboardPlugin = createPlatePlugin({
  key: 'tableKeyboard',
  handlers: {
    onKeyDown: ({ editor, event }) => {
      if (event.defaultPrevented) return

      const entries = getTableEntries(editor)
      if (!entries) return

      if (isHotkey('alt+enter', event)) {
        event.preventDefault()
        event.stopPropagation()
        insertTableRow(editor, { select: true })
        return true
      }

      if (isHotkey('shift+tab', event)) {
        event.preventDefault()
        event.stopPropagation()
        const prev = getPreviousTableCell(
          editor,
          entries.cell,
          entries.cell[1],
          entries.row
        )
        if (prev) selectCellStart(editor, prev)
        return true
      }

      if (isHotkey('tab', event) && !event.altKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        event.stopPropagation()
        const next = getNextTableCell(
          editor,
          entries.cell,
          entries.cell[1],
          entries.row
        )
        if (next) {
          selectCellStart(editor, next)
        } else {
          insertTableRow(editor, { select: true })
        }
        return true
      }
    },
  },
})
