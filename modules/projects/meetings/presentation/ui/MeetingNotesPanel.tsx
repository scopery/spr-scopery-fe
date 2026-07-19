'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Stack, Textarea, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type { MeetingNote } from '../../domain/model/meeting-note'

const CONVERT_OPTIONS = [
  { key: 'decision', label: '→ Decision' },
  { key: 'risk', label: '→ RAID (Risk)' },
  { key: 'issue', label: '→ RAID (Issue)' },
  { key: 'requirement', label: '→ Requirement' },
  { key: 'change-request', label: '→ Change request' },
]

interface Props {
  notes: MeetingNote[]
  onCreateNote: (body: { content: string }) => Promise<unknown>
  onArchiveNote: (noteId: string) => Promise<void>
  onConvertToDecision: (noteId: string) => Promise<unknown>
  onConvertToRaidItem: (noteId: string, body: { type: string }) => Promise<unknown>
  onConvertToRequirement: (noteId: string) => Promise<unknown>
  onConvertToChangeRequest: (noteId: string) => Promise<unknown>
}

export function MeetingNotesPanel({
  notes,
  onCreateNote,
  onArchiveNote,
  onConvertToDecision,
  onConvertToRaidItem,
  onConvertToRequirement,
  onConvertToChangeRequest,
}: Props) {
  const [newContent, setNewContent] = useState('')
  const [adding, setAdding] = useState(false)
  const [actingNoteId, setActingNoteId] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!newContent.trim()) return
    setAdding(true)
    try {
      await onCreateNote({ content: newContent.trim() })
      setNewContent('')
      toast.success('Note added')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setAdding(false)
    }
  }

  const handleArchive = async (noteId: string) => {
    setActingNoteId(noteId)
    try {
      await onArchiveNote(noteId)
      toast.success('Note archived')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActingNoteId(null)
    }
  }

  const handleConvert = async (noteId: string, option: string) => {
    setActingNoteId(noteId)
    try {
      if (option === 'decision') {
        await onConvertToDecision(noteId)
        toast.success('Converted to decision')
      } else if (option === 'risk') {
        await onConvertToRaidItem(noteId, { type: 'RISK' })
        toast.success('Converted to RAID item (Risk)')
      } else if (option === 'issue') {
        await onConvertToRaidItem(noteId, { type: 'ISSUE' })
        toast.success('Converted to RAID item (Issue)')
      } else if (option === 'requirement') {
        await onConvertToRequirement(noteId)
        toast.success('Converted to requirement')
      } else if (option === 'change-request') {
        await onConvertToChangeRequest(noteId)
        toast.success('Converted to change request draft')
      }
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActingNoteId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          value={newContent}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewContent(e.target.value)}
          placeholder="Add a note…"
          rows={2}
          fullWidth
        />
        <Button
          size="sm"
          variant="secondary"
          icon={<Plus size={14} />}
          disabled={adding || !newContent.trim()}
          onClick={() => void handleAdd()}
        >
          Add
        </Button>
      </div>

      {notes.length === 0 ? (
        <Typography variant="small" tone="muted">No notes yet</Typography>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded border border-neutral-200 p-3">
              <Typography className="whitespace-pre-wrap text-sm">{note.content}</Typography>
              {note.convertedTo ? (
                <Typography variant="small" tone="muted" className="mt-1">
                  Converted → {note.convertedTo.type}
                </Typography>
              ) : (
                <Stack direction="horizontal" spacing="sm" className="mt-2 flex-wrap">
                  {CONVERT_OPTIONS.map((opt) => (
                    <Button
                      key={opt.key}
                      size="sm"
                      variant="ghost"
                      disabled={actingNoteId === note.id}
                      onClick={() => void handleConvert(note.id, opt.key)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    tone="error"
                    icon={<Trash2 size={12} />}
                    disabled={actingNoteId === note.id}
                    onClick={() => void handleArchive(note.id)}
                  >
                    Archive
                  </Button>
                </Stack>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
