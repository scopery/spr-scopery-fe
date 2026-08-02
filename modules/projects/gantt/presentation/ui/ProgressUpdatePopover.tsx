'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Input, Stack, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

const QUICK = [0, 25, 50, 75, 100] as const
const POPOVER_WIDTH = 280

type Props = {
  /** Timeline left-pane row id (`data-timeline-row`) for anchoring. */
  anchorRowId: string
  taskTitle: string
  initialPercent?: number | null
  saving?: boolean
  storageHint?: string | null
  onSave: (body: {
    progressPercent: number
    timeSpentMinutes: number | null
    note: string | null
  }) => Promise<void> | void
  onClose: () => void
}

export function ProgressUpdatePopover({
  anchorRowId,
  taskTitle,
  initialPercent,
  saving,
  storageHint,
  onSave,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [percent, setPercent] = useState(
    initialPercent != null ? String(initialPercent) : '0'
  )
  const [hours, setHours] = useState('')
  const [note, setNote] = useState('')

  useLayoutEffect(() => {
    const update = () => {
      const anchor = document.querySelector(
        `[data-timeline-row="${CSS.escape(anchorRowId)}"]`
      ) as HTMLElement | null
      if (!anchor) {
        setPos({
          top: Math.max(8, window.innerHeight / 2 - 160),
          left: Math.max(8, window.innerWidth / 2 - POPOVER_WIDTH / 2),
        })
        return
      }
      const rect = anchor.getBoundingClientRect()
      const panelH = panelRef.current?.offsetHeight ?? 320
      let left = rect.right + 8
      if (left + POPOVER_WIDTH > window.innerWidth - 8) {
        left = Math.max(8, rect.left - POPOVER_WIDTH - 8)
      }
      let top = rect.top
      if (top + panelH > window.innerHeight - 8) {
        top = Math.max(8, window.innerHeight - panelH - 8)
      }
      top = Math.max(8, top)
      setPos({ top, left })
    }

    update()
    const raf = window.requestAnimationFrame(update)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [anchorRowId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onPointer = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [onClose])

  const submit = async () => {
    const progressPercent = Number(percent)
    if (!Number.isFinite(progressPercent) || progressPercent < 0 || progressPercent > 100) {
      return
    }
    const h = hours.trim() ? Number(hours) : null
    await onSave({
      progressPercent,
      timeSpentMinutes:
        h != null && Number.isFinite(h) ? Math.round(h * 60) : null,
      note: note.trim() || null,
    })
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Update progress"
      className={cn(
        'fixed z-[220] box-border w-[280px] max-w-[calc(100vw-16px)]',
        'border border-neutral-200 bg-white p-md shadow-lg'
      )}
      style={
        pos
          ? { top: pos.top, left: pos.left }
          : { top: -9999, left: -9999, visibility: 'hidden' }
      }
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Stack direction="vertical" spacing="sm" className="min-w-0 w-full">
        <Typography size="sm" weight="medium" className="truncate">
          Update progress
        </Typography>
        <Typography variant="caption" tone="muted" className="truncate">
          {taskTitle}
        </Typography>
        <label className="block min-w-0 w-full text-xs text-neutral-600">
          Progress %
          <Input
            fullWidth
            size="sm"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            className="mt-1"
            autoFocus
          />
        </label>
        <div className="grid min-w-0 grid-cols-5 gap-1">
          {QUICK.map((q) => (
            <Button
              key={q}
              size="sm"
              variant={percent === String(q) ? 'primary' : 'outline'}
              className="h-8 min-w-0 px-1 text-xs"
              onClick={() => setPercent(String(q))}
            >
              {q}%
            </Button>
          ))}
        </div>
        <label className="block min-w-0 w-full text-xs text-neutral-600">
          Time spent (hours)
          <Input
            fullWidth
            size="sm"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="e.g. 4"
            className="mt-1"
          />
        </label>
        <label className="block min-w-0 w-full text-xs text-neutral-600">
          Note
          <Input
            fullWidth
            size="sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
            className="mt-1"
          />
        </label>
        {storageHint && (
          <Typography variant="caption" tone="muted" className="break-words">
            {storageHint}
          </Typography>
        )}
        <Stack direction="horizontal" spacing="sm" className="justify-end">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" loading={saving} onClick={() => void submit()}>
            Save
          </Button>
        </Stack>
      </Stack>
    </div>,
    document.body
  )
}
