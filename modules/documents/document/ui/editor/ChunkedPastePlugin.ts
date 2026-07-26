'use client'

import { KEYS, type TElement } from 'platejs'
import { createPlatePlugin } from 'platejs/react'
import { toast } from 'sonner'

/** Top-level blocks inserted per animation frame during large pastes. */
export const PASTE_INSERT_CHUNK_SIZE = 32

/** Prefer plain text when HTML exceeds this (deserialize cost). */
const HTML_SOFT_LIMIT = 80_000

/** Always skip HTML deserialize above this — too likely to freeze the tab. */
const HTML_HARD_LIMIT = 300_000

/** Plain text above this always uses chunked insert (even without HTML). */
const TEXT_CHUNK_THRESHOLD = 20_000

/** HTML much larger than plain text (typical Word/Docs bloat). */
const HTML_BLOAT_RATIO = 6

function shouldPreferPlainText(html: string, text: string): boolean {
  if (!text) return false
  if (html.length >= HTML_HARD_LIMIT) return true
  if (html.length >= HTML_SOFT_LIMIT && html.length >= text.length * HTML_BLOAT_RATIO) {
    return true
  }
  return false
}

function shouldChunkFragment(fragment: unknown[]): boolean {
  return fragment.length > PASTE_INSERT_CHUNK_SIZE
}

function plainTextToParagraphs(
  paragraphType: string,
  text: string
): TElement[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  if (lines.length === 0) {
    return [{ type: paragraphType, children: [{ text: '' }] }]
  }
  return lines.map((line) => ({
    type: paragraphType,
    children: [{ text: line }],
  }))
}

function scheduleFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

/**
 * Spreads large paste inserts across frames and falls back to plain text when
 * HTML deserialize would freeze the tab. Works with Plate's ChunkingPlugin
 * (content-visibility) for paint cost after insert.
 */
export const ChunkedPastePlugin = createPlatePlugin({
  key: 'chunkedPaste',
}).overrideEditor(({ editor, tf: { insertData, insertFragment } }) => {
  let chunkInsertInFlight = false

  const runChunkedInsert = (fragment: TElement[], options?: Parameters<typeof insertFragment>[1]) => {
    if (chunkInsertInFlight) {
      toast.info('Still inserting the previous paste…')
      return
    }

    chunkInsertInFlight = true
    const total = fragment.length
    const toastId = toast.loading(`Inserting pasted content… 0/${total}`)

    // First batch sync so paste still lands inside Plate's withoutNormalizing wrapper.
    const first = fragment.slice(0, PASTE_INSERT_CHUNK_SIZE)
    try {
      insertFragment(first, options)
      toast.loading(`Inserting pasted content… ${first.length}/${total}`, { id: toastId })
    } catch {
      chunkInsertInFlight = false
      toast.error('Paste failed', { id: toastId })
      return
    }

    if (total <= PASTE_INSERT_CHUNK_SIZE) {
      chunkInsertInFlight = false
      toast.success('Paste complete', { id: toastId })
      return
    }

    void (async () => {
      try {
        for (let i = PASTE_INSERT_CHUNK_SIZE; i < total; i += PASTE_INSERT_CHUNK_SIZE) {
          await scheduleFrame()
          const batch = fragment.slice(i, i + PASTE_INSERT_CHUNK_SIZE)
          insertFragment(batch)
          toast.loading(
            `Inserting pasted content… ${Math.min(i + batch.length, total)}/${total}`,
            { id: toastId }
          )
        }
        toast.success('Paste complete', { id: toastId })
      } catch {
        toast.error('Paste failed', { id: toastId })
      } finally {
        chunkInsertInFlight = false
      }
    })()
  }

  return {
    transforms: {
      insertFragment(fragment, options) {
        if (chunkInsertInFlight) {
          toast.info('Still inserting the previous paste…')
          return
        }
        if (!shouldChunkFragment(fragment)) {
          insertFragment(fragment, options)
          return
        }
        runChunkedInsert(fragment as TElement[], options)
      },

      insertData(dataTransfer) {
        if (chunkInsertInFlight) {
          toast.info('Still inserting the previous paste…')
          return
        }

        const html = dataTransfer.getData('text/html') || ''
        const text = dataTransfer.getData('text/plain') || ''

        if (shouldPreferPlainText(html, text)) {
          const paragraphType = editor.getType(KEYS.p)
          const blocks = plainTextToParagraphs(paragraphType, text)
          toast.message('Large paste — inserting as plain text for stability')
          if (shouldChunkFragment(blocks)) {
            runChunkedInsert(blocks)
          } else {
            insertFragment(blocks)
          }
          return
        }

        // Large plain-only paste (no HTML): build paragraphs and chunk-insert.
        if (!html && text.length >= TEXT_CHUNK_THRESHOLD) {
          const paragraphType = editor.getType(KEYS.p)
          runChunkedInsert(plainTextToParagraphs(paragraphType, text))
          return
        }

        // HTML path: Plate deserializes, then our insertFragment chunks large trees.
        insertData(dataTransfer)
      },
    },
  }
})
