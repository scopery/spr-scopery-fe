'use client'

import { insertCallout } from '@platejs/callout'
import { insertCodeBlock, toggleCodeBlock } from '@platejs/code-block'
import { triggerFloatingLink } from '@platejs/link/react'
import { ListStyleType, toggleList } from '@platejs/list'
import { insertTable } from '@platejs/table'
import { type NodeEntry, type Path, type TElement, KEYS, PathApi } from 'platejs'
import type { PlateEditor } from 'platejs/react'

type InsertBlockOptions = {
  upsert?: boolean
}

const insertList = (editor: PlateEditor, listStyleType: string) => {
  toggleList(editor, { listStyleType })
}

const createBlockquote = (editor: PlateEditor) => ({
  children: [editor.api.create.block({ type: KEYS.p })],
  type: KEYS.blockquote,
})

const selectBlockquoteStart = (editor: PlateEditor, path: Path) => {
  const start = editor.api.start(path.concat([0]))
  if (start) editor.tf.select(start)
}

const insertBlockMap: Record<string, (editor: PlateEditor) => void> = {
  [KEYS.listTodo]: (editor) => insertList(editor, KEYS.listTodo),
  [KEYS.ol]: (editor) => insertList(editor, ListStyleType.Decimal),
  [KEYS.ul]: (editor) => insertList(editor, ListStyleType.Disc),
  [KEYS.callout]: (editor) => insertCallout(editor, { select: true, variant: 'note' }),
  [KEYS.codeBlock]: (editor) => insertCodeBlock(editor, { select: true }),
  [KEYS.table]: (editor) => insertTable(editor, { rowCount: 3, colCount: 3 }, { select: true }),
  [KEYS.hr]: (editor) =>
    editor.tf.insertNodes([{ type: KEYS.hr, children: [{ text: '' }] }], { select: true }),
  [KEYS.toggle]: (editor) => editor.tf.toggleBlock(KEYS.toggle),
  [KEYS.link]: (editor) => triggerFloatingLink(editor, { focused: true }),
}

/** Insert or transform the current block to the given type (slash command + insert) */
export function insertBlock(editor: PlateEditor, type: string, options: InsertBlockOptions = {}) {
  const { upsert = false } = options

  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block()
    if (!block) return

    const [currentNode, path] = block
    const isCurrentBlockEmpty = editor.api.isEmpty(currentNode)
    const currentBlockType = getBlockType(currentNode)
    const isSameBlockType = type === currentBlockType

    if (upsert && isCurrentBlockEmpty && isSameBlockType) return

    if (type === KEYS.blockquote) {
      const insertPath = PathApi.next(path)
      editor.tf.insertNodes(createBlockquote(editor), { at: insertPath })

      if (!isSameBlockType && isCurrentBlockEmpty) {
        editor.tf.removeNodes({ at: path })
      }

      selectBlockquoteStart(editor, isCurrentBlockEmpty && !isSameBlockType ? path : insertPath)
      return
    }

    if (insertBlockMap[type]) {
      insertBlockMap[type](editor)
    } else {
      editor.tf.insertNodes(editor.api.create.block({ type }), {
        at: PathApi.next(path),
        select: true,
      })
    }

    if (!isSameBlockType && isCurrentBlockEmpty) {
      editor.tf.removeNodes({ at: path })
    }
  })
}

const setList = (editor: PlateEditor, listStyleType: string, entry: NodeEntry<TElement>) => {
  editor.tf.setNodes(
    editor.api.create.block({
      indent: 1,
      listStyleType,
    }),
    { at: entry[1] }
  )
}

const setBlockMap: Record<
  string,
  (editor: PlateEditor, type: string, entry: NodeEntry<TElement>) => void
> = {
  [KEYS.listTodo]: (editor, type, entry) => setList(editor, type, entry),
  [KEYS.ol]: (editor, type, entry) => setList(editor, type, entry),
  [KEYS.ul]: (editor, type, entry) => setList(editor, type, entry),
  [KEYS.codeBlock]: (editor) => toggleCodeBlock(editor),
}

/** Transform the current block(s) into another block type */
export function setBlockType(editor: PlateEditor, type: string, { at }: { at?: Path } = {}) {
  editor.tf.withoutNormalizing(() => {
    if (type === KEYS.blockquote) {
      const target = at ?? editor.selection
      if (!target || editor.api.some({ at: target, match: { type } })) return

      editor.tf.toggleBlock(type, {
        ...(at ? { at } : {}),
        wrap: true,
      })
      return
    }

    const setEntry = (entry: NodeEntry<TElement>) => {
      const [node, path] = entry

      if ((node as TElement & { listStyleType?: string }).listStyleType) {
        editor.tf.unsetNodes(['listStyleType', 'indent', KEYS.listChecked], { at: path })
      }

      if (setBlockMap[type]) {
        setBlockMap[type](editor, type, entry)
        return
      }

      if (node.type !== type) {
        editor.tf.setNodes({ type }, { at: path })
      }
    }

    if (at) {
      const entry = editor.api.node<TElement>(at)
      if (entry) {
        setEntry(entry)
        return
      }
    }

    const entries = editor.api.blocks({ mode: 'lowest' })
    entries.forEach((entry) => setEntry(entry))
  })
}

export function getBlockType(block: TElement): string {
  const listStyleType = (block as TElement & { listStyleType?: string }).listStyleType
  if (listStyleType) {
    if (listStyleType === KEYS.ol || listStyleType === ListStyleType.Decimal) {
      return KEYS.ol
    }
    if (listStyleType === KEYS.listTodo) return KEYS.listTodo
    return KEYS.ul
  }
  return block.type
}

export function duplicateCurrentBlock(editor: PlateEditor) {
  const block = editor.api.block()
  if (!block) return

  const [node, path] = block
  editor.tf.insertNodes(structuredClone(node), { at: PathApi.next(path) })
}

export function deleteCurrentBlock(editor: PlateEditor) {
  const block = editor.api.block()
  if (!block) return
  editor.tf.removeNodes({ at: block[1] })
}

export function moveCurrentBlock(editor: PlateEditor, direction: 'up' | 'down') {
  const block = editor.api.block()
  if (!block) return

  const [, path] = block
  const sibling =
    direction === 'up'
      ? editor.api.previous({ at: path, match: (n) => editor.api.isBlock(n) })
      : editor.api.next({ at: path, match: (n) => editor.api.isBlock(n) })

  if (!sibling) return

  const [, siblingPath] = sibling
  editor.tf.moveNodes({
    at: path,
    to: direction === 'up' ? siblingPath : PathApi.next(siblingPath),
  })
}
