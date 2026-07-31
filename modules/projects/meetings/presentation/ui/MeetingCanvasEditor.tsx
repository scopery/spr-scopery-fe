'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Card, Input, Stack, Textarea, Typography } from '@/shared/ui'
import { MeetingNoteAiEditToolbar } from './MeetingNoteAiEditToolbar'

export type SlashCaptureKind = 'action' | 'decision' | 'risk' | 'issue' | 'requirement' | 'change'

export interface SlashCapture {
  kind: SlashCaptureKind
  content: string
}

interface MeetingCanvasEditorProps {
  label: string
  helper?: string
  placeholder?: string
  value: string
  rows?: number
  workspaceId?: string
  onChange: (value: string) => void
  onSlashCapture?: (capture: SlashCapture) => Promise<void> | void
  showSlashHints?: boolean
}

const CAPTURE_OPTIONS: { kind: SlashCaptureKind; label: string; placeholder: string }[] = [
  { kind: 'action', label: 'Action', placeholder: 'What needs to be done?' },
  { kind: 'decision', label: 'Decision', placeholder: 'What was decided?' },
  { kind: 'risk', label: 'Risk', placeholder: 'What risk was identified?' },
  { kind: 'issue', label: 'Issue', placeholder: 'What issue was raised?' },
]

const MARKER: Record<SlashCaptureKind, string> = {
  action: 'ACTION',
  decision: 'DECISION',
  risk: 'RISK',
  issue: 'ISSUE',
  requirement: 'REQUIREMENT',
  change: 'CHANGE',
}

const SLASH_RE = /^\/(action|decision|risk|issue|requirement|change)\s+(.+)$/i

function parseSlashLine(line: string): SlashCapture | null {
  const m = line.trim().match(SLASH_RE)
  if (!m) return null
  return { kind: m[1].toLowerCase() as SlashCaptureKind, content: m[2].trim() }
}

function appendMarker(value: string, kind: SlashCaptureKind, content: string) {
  const line = `[${MARKER[kind]}] ${content}`
  const trimmed = value.replace(/\s+$/, '')
  return trimmed ? `${trimmed}\n${line}\n` : `${line}\n`
}

/**
 * Meeting canvas editor with quick-capture buttons (preferred)
 * and optional `/action …` + Enter for power users.
 */
export function MeetingCanvasEditor({
  label,
  helper,
  placeholder,
  value,
  rows = 10,
  workspaceId,
  onChange,
  onSlashCapture,
  showSlashHints = false,
}: MeetingCanvasEditorProps) {
  const [capturing, setCapturing] = useState(false)
  const [activeKind, setActiveKind] = useState<SlashCaptureKind | null>(null)
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackTone, setFeedbackTone] = useState<'ok' | 'error'>('ok')
  const taRef = useRef<HTMLTextAreaElement>(null)
  const draftRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!activeKind) return
    draftRef.current?.focus()
  }, [activeKind])

  useEffect(() => {
    if (!feedback) return
    const t = window.setTimeout(() => setFeedback(null), 4000)
    return () => window.clearTimeout(t)
  }, [feedback])

  const runCapture = useCallback(
    async (capture: SlashCapture, replaceLine?: { start: number; end: number }) => {
      if (!onSlashCapture) return false
      setCapturing(true)
      try {
        await onSlashCapture(capture)
        if (replaceLine) {
          const marker = `[${MARKER[capture.kind]}] ${capture.content}`
          const next =
            value.slice(0, replaceLine.start) + marker + '\n' + value.slice(replaceLine.end)
          onChange(next)
        } else {
          onChange(appendMarker(value, capture.kind, capture.content))
        }
        setFeedbackTone('ok')
        setFeedback(`${CAPTURE_OPTIONS.find((o) => o.kind === capture.kind)?.label ?? capture.kind} captured`)
        return true
      } catch {
        setFeedbackTone('error')
        setFeedback('Could not capture — try again or use Add below the notes')
        return false
      } finally {
        setCapturing(false)
      }
    },
    [onChange, onSlashCapture, value]
  )

  const submitDraft = async () => {
    if (!activeKind || !draft.trim()) return
    const ok = await runCapture({ kind: activeKind, content: draft.trim() })
    if (ok) {
      setDraft('')
      setActiveKind(null)
    }
  }

  const tryCaptureCurrentLine = useCallback(async () => {
    if (!onSlashCapture || !taRef.current) return false
    const el = taRef.current
    const pos = el.selectionStart
    const before = value.slice(0, pos)
    const lineStart = before.lastIndexOf('\n') + 1
    const lineEndIdx = value.indexOf('\n', pos)
    const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx
    const line = value.slice(lineStart, lineEnd)
    const parsed = parseSlashLine(line)
    if (!parsed) {
      setFeedbackTone('error')
      setFeedback('No slash command on this line. Use the buttons above, or type /action your text')
      return false
    }
    return runCapture(parsed, { start: lineStart, end: lineEnd })
  }, [onSlashCapture, runCapture, value])

  const onKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const el = taRef.current
      if (!el) return
      const pos = el.selectionStart
      const before = value.slice(0, pos)
      const lineStart = before.lastIndexOf('\n') + 1
      const line = value.slice(lineStart, pos)
      if (parseSlashLine(line) || parseSlashLine(value.slice(lineStart, value.indexOf('\n', pos) === -1 ? value.length : value.indexOf('\n', pos)))) {
        e.preventDefault()
        await tryCaptureCurrentLine()
      }
    }
  }

  const activeOption = CAPTURE_OPTIONS.find((o) => o.kind === activeKind)

  return (
    <Card as="section" className="p-4">
      <Typography weight="semibold" className="mb-1">
        {label}
      </Typography>
      {helper ? (
        <Typography variant="small" tone="muted" className="mb-3">
          {helper}
        </Typography>
      ) : null}

      {showSlashHints && onSlashCapture ? (
        <Card className="mb-3 bg-neutral-50 p-3">
          <Typography variant="small" weight="medium" className="mb-2">
            Quick capture
          </Typography>
          <Typography variant="small" tone="muted" className="mb-3">
            Click a type, type a short title, then Add. This creates a real action / decision / RAID
            item and adds a marker into the notes.
          </Typography>
          <Stack direction="horizontal" spacing="sm" className="mb-3 flex-wrap">
            {CAPTURE_OPTIONS.map((opt) => (
              <Button
                key={opt.kind}
                size="sm"
                variant="neutral-flat"
                className={
                  activeKind === opt.kind
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white'
                    : undefined
                }
                disabled={capturing}
                onClick={() => {
                  setActiveKind(opt.kind)
                  setDraft('')
                }}
              >
                {opt.label}
              </Button>
            ))}
          </Stack>

          {activeKind && activeOption ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <Input
                  ref={draftRef}
                  fullWidth
                  size="md"
                  label={activeOption.label}
                  placeholder={activeOption.placeholder}
                  value={draft}
                  disabled={capturing}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void submitDraft()
                    }
                    if (e.key === 'Escape') {
                      setActiveKind(null)
                      setDraft('')
                    }
                  }}
                />
              </div>
              <Stack direction="horizontal" spacing="sm" className="items-center">
                <Button
                  size="md"
                  variant="neutral-flat"
                  className="h-9 bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white"
                  loading={capturing}
                  disabled={!draft.trim()}
                  onClick={() => void submitDraft()}
                >
                  Add
                </Button>
                <Button
                  size="md"
                  variant="neutral-flat"
                  className="h-9"
                  disabled={capturing}
                  onClick={() => {
                    setActiveKind(null)
                    setDraft('')
                  }}
                >
                  Close
                </Button>
              </Stack>
            </div>
          ) : null}
        </Card>
      ) : null}

      <div className="relative">
        <Textarea
          ref={taRef}
          fullWidth
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => void onKeyDown(e)}
        />
        <MeetingNoteAiEditToolbar
          textareaRef={taRef}
          value={value}
          workspaceId={workspaceId}
          onApply={(next, selection) => {
            onChange(next)
            requestAnimationFrame(() => {
              const el = taRef.current
              if (!el) return
              el.focus()
              el.setSelectionRange(selection.start, selection.end)
            })
          }}
        />
      </div>

      {feedback ? (
        <Typography
          variant="small"
          className={feedbackTone === 'error' ? 'mt-2 text-error' : 'mt-2 text-secondary'}
        >
          {feedback}
        </Typography>
      ) : null}
    </Card>
  )
}
