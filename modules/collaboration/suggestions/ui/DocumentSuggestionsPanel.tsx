'use client'

import { useState } from 'react'
import { Avatar, Badge, Button, Input, Textarea, Typography, ContentLoader } from '@/shared/ui'
import type {
  CollaborationPermissions,
  DocumentSuggestion,
} from '@/modules/collaboration/core/model/collaboration'
import { useDocumentSuggestions } from '@/modules/collaboration/core/hooks'
import { MentionUserPicker } from '@/modules/collaboration/comments/ui/MentionUserPicker'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'

interface DocumentSuggestionsPanelProps {
  orgId: string
  documentId: string
  projectId?: string
  permissions: CollaborationPermissions
}

function SuggestionCard({
  suggestion,
  permissions,
  onAccept,
  onReject,
}: {
  suggestion: DocumentSuggestion
  permissions: CollaborationPermissions
  onAccept: (id: string) => Promise<void>
  onReject: (id: string) => Promise<void>
}) {
  const name = suggestion.author_display_name || suggestion.author_email || 'User'
  return (
    <div className="space-y-2 border border-neutral-200 p-3">
      <div className="flex items-start gap-2">
        <Avatar name={name} size="sm" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Typography variant="small" weight="medium">
              {name}
            </Typography>
            <Badge variant="soft" tone="neutral" size="sm">
              {suggestion.status}
            </Badge>
            <Typography variant="small" tone="muted">
              {new Date(suggestion.created_at).toLocaleString()}
            </Typography>
          </div>
          {suggestion.title && (
            <Typography weight="medium" className="mt-1">
              {suggestion.title}
            </Typography>
          )}
          <Typography className="mt-1 whitespace-pre-wrap">{suggestion.description}</Typography>
          {suggestion.status === 'open' && (
            <div className="mt-2 flex gap-2">
              {permissions.canAcceptSuggestion && (
                <Button variant="primary" size="sm" onClick={() => onAccept(suggestion.id)}>
                  Accept
                </Button>
              )}
              {permissions.canRejectSuggestion && (
                <Button variant="outline" size="sm" onClick={() => onReject(suggestion.id)}>
                  Reject
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function DocumentSuggestionsPanel({
  orgId,
  documentId,
  projectId,
  permissions,
}: DocumentSuggestionsPanelProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mentions, setMentions] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const { suggestions, loading, createSuggestion, acceptSuggestion, rejectSuggestion } =
    useDocumentSuggestions({
      orgId,
      documentId,
      projectId,
      canViewSuggestions: permissions.canViewSuggestions,
    })

  const handleCreate = async () => {
    if (!description.trim()) return
    setSubmitting(true)
    try {
      await createSuggestion(title.trim() || null, description.trim(), mentions)
      setTitle('')
      setDescription('')
      setMentions([])
    } catch (err) {
      const msg = err instanceof ApiError ? err.problem.detail : 'Failed to create suggestion'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!permissions.canViewSuggestions) {
    return <Typography tone="muted">You do not have access to suggestions.</Typography>
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <ContentLoader variant="easeOut" className="w-16" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Typography weight="semibold">Suggestions ({suggestions.length})</Typography>

      {permissions.canCreateSuggestion && (
        <div className="space-y-2 border border-neutral-200 p-3">
          <Input
            label="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
          <Textarea
            label="Suggestion"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            fullWidth
          />
          <MentionUserPicker
            orgId={orgId}
            projectId={projectId}
            value={mentions}
            onChange={setMentions}
          />
          <Button
            variant="primary"
            size="sm"
            loading={submitting}
            onClick={() => void handleCreate()}
          >
            Submit suggestion
          </Button>
        </div>
      )}

      {suggestions.length === 0 ? (
        <Typography tone="muted">No suggestions yet.</Typography>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              permissions={permissions}
              onAccept={acceptSuggestion}
              onReject={rejectSuggestion}
            />
          ))}
        </div>
      )}
    </div>
  )
}
