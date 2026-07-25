'use client'

import {
  createPlatePlugin,
  PlateLeaf,
  type PlateLeafProps,
  useEditorRef,
  useEditorSelector,
} from 'platejs/react'
import { Highlighter, Type, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  HIGHLIGHT_BG_KEY,
  HIGHLIGHT_TEXT_KEY,
  HIGHLIGHT_TONE_META,
  HIGHLIGHT_TONES,
  highlightBgClassName,
  highlightTextClassName,
  isHighlightTone,
  TEXT_HIGHLIGHT_KEY,
  type HighlightTone,
} from './text-highlight'

type MarkKey = typeof HIGHLIGHT_BG_KEY | typeof HIGHLIGHT_TEXT_KEY

/**
 * One leaf reads BOTH marks so bg + text color can stack.
 * Text-only must NOT use bare <mark> (browser default = yellow highlight).
 */
export function HighlightStyleLeaf(props: PlateLeafProps) {
  const leaf = props.leaf as Record<string, unknown>

  const bgTone = isHighlightTone(leaf[HIGHLIGHT_BG_KEY])
    ? (leaf[HIGHLIGHT_BG_KEY] as HighlightTone)
    : isHighlightTone(leaf[TEXT_HIGHLIGHT_KEY])
      ? (leaf[TEXT_HIGHLIGHT_KEY] as HighlightTone)
      : null

  const textTone = isHighlightTone(leaf[HIGHLIGHT_TEXT_KEY])
    ? (leaf[HIGHLIGHT_TEXT_KEY] as HighlightTone)
    : null

  // Only paint background when highlightBg (or legacy) is set — never from text color alone
  const hasBg = Boolean(bgTone)
  const hasText = Boolean(textTone)

  return (
    <PlateLeaf
      {...props}
      as="span"
      className={cn(
        hasBg && 'rounded-none px-0.5',
        hasBg && highlightBgClassName(bgTone),
        hasText && highlightTextClassName(textTone),
        props.className
      )}
    />
  )
}

export const HighlightBgPlugin = createPlatePlugin({
  key: HIGHLIGHT_BG_KEY,
  node: { isLeaf: true, isDecoration: true },
}).withComponent(HighlightStyleLeaf)

export const HighlightTextPlugin = createPlatePlugin({
  key: HIGHLIGHT_TEXT_KEY,
  node: { isLeaf: true, isDecoration: true },
}).withComponent(HighlightStyleLeaf)

/** Keeps legacy `textHighlight` nodes rendering as background highlight. */
export const LegacyTextHighlightPlugin = createPlatePlugin({
  key: TEXT_HIGHLIGHT_KEY,
  node: { isLeaf: true, isDecoration: true },
}).withComponent(HighlightStyleLeaf)

/** @deprecated use HighlightBgPlugin + HighlightTextPlugin */
export const TextHighlightPlugin = HighlightBgPlugin

function applyToneMark(
  editor: ReturnType<typeof useEditorRef>,
  key: MarkKey,
  tone: HighlightTone | null
) {
  if (!editor.selection) return
  if (!tone) {
    editor.tf.removeMarks(key)
    return
  }
  const current = editor.api.marks()?.[key]
  if (current === tone) {
    editor.tf.removeMarks(key)
    return
  }
  // Only touches this key — the other highlight mark is preserved
  editor.tf.addMarks({ [key]: tone })
}

function HighlightTonePicker({
  markKey,
  label,
  icon,
  mode,
}: {
  markKey: MarkKey
  label: string
  icon: React.ReactNode
  mode: 'bg' | 'text'
}) {
  const editor = useEditorRef()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const activeTone = useEditorSelector((ed) => {
    const mark = ed.api.marks()?.[markKey]
    return isHighlightTone(mark) ? mark : null
  }, [markKey])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <Button
        size="sm"
        variant={activeTone || open ? 'secondary' : 'ghost'}
        iconOnly
        icon={icon}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
      />

      {open ? (
        <div
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-full z-50 mt-1 min-w-[10.5rem] rounded-none border border-neutral-200 bg-white p-2 shadow-md"
        >
          <TypographyHint mode={mode} />
          <div className="mb-2 grid grid-cols-5 gap-1.5">
            {HIGHLIGHT_TONES.map((tone) => {
              const meta = HIGHLIGHT_TONE_META[tone]
              return (
                <button
                  key={tone}
                  type="button"
                  role="option"
                  aria-selected={activeTone === tone}
                  title={meta.label}
                  aria-label={meta.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    applyToneMark(editor, markKey, tone)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-none border border-neutral-200 text-[10px] font-semibold',
                    mode === 'bg' ? meta.bg : 'bg-white',
                    mode === 'text' ? meta.text : 'text-neutral-700',
                    mode === 'bg' && 'ring-1 ring-inset ring-black/5',
                    activeTone === tone && 'ring-2 ring-neutral-900 ring-offset-1'
                  )}
                >
                  {mode === 'text' ? 'A' : null}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              applyToneMark(editor, markKey, null)
              setOpen(false)
            }}
            className="flex w-full items-center gap-1.5 rounded-none px-1 py-1 text-left text-xs text-neutral-700 hover:bg-neutral-50"
          >
            <X size={12} aria-hidden />
            Clear
          </button>
        </div>
      ) : null}
    </div>
  )
}

function TypographyHint({ mode }: { mode: 'bg' | 'text' }) {
  return (
    <p className="mb-1.5 text-[10px] text-neutral-500">
      {mode === 'bg' ? 'Background · shade 100' : 'Text · shade 800'}
    </p>
  )
}

export function HighlightBgToolbarControl() {
  return (
    <HighlightTonePicker
      markKey={HIGHLIGHT_BG_KEY}
      label="Highlight background"
      icon={<Highlighter size={15} />}
      mode="bg"
    />
  )
}

export function HighlightTextToolbarControl() {
  return (
    <HighlightTonePicker
      markKey={HIGHLIGHT_TEXT_KEY}
      label="Highlight text color"
      icon={<Type size={15} />}
      mode="text"
    />
  )
}

/** Both controls side by side */
export function TextHighlightToolbarControl() {
  return (
    <>
      <HighlightBgToolbarControl />
      <HighlightTextToolbarControl />
    </>
  )
}
