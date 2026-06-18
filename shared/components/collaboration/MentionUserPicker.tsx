'use client'

import { useEffect, useState } from 'react'
import { Select, Typography } from '@/shared/ui'
import * as collaborationService from '@/services/collaboration.service'
import type { MentionableUser } from '@/types/collaboration'

interface MentionUserPickerProps {
  orgId: string
  projectId?: string
  value: string[]
  onChange: (userIds: string[]) => void
  disabled?: boolean
}

export function MentionUserPicker({
  orgId,
  projectId,
  value,
  onChange,
  disabled,
}: MentionUserPickerProps) {
  const [users, setUsers] = useState<MentionableUser[]>([])
  const [selected, setSelected] = useState('')

  useEffect(() => {
    collaborationService
      .listMentionableUsers(orgId, { project_id: projectId })
      .then((res) => setUsers(res.items))
      .catch(() => setUsers([]))
  }, [orgId, projectId])

  const available = users.filter((u) => !value.includes(u.user_id))

  const addUser = (userId: string) => {
    if (!userId || value.includes(userId)) return
    onChange([...value, userId])
    setSelected('')
  }

  const removeUser = (userId: string) => {
    onChange(value.filter((id) => id !== userId))
  }

  return (
    <div className="space-y-2">
      <Typography variant="small" weight="medium">
        Mention members
      </Typography>
      <Select
        value={selected || '__none__'}
        onValueChange={(v: string) => {
          if (v !== '__none__') addUser(v)
        }}
        disabled={disabled || available.length === 0}
        options={[
          { value: '__none__', label: 'Select member to mention…' },
          ...available.map((u) => ({
            value: u.user_id,
            label: u.display_name || u.email || u.user_id,
          })),
        ]}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((id) => {
            const user = users.find((u) => u.user_id === id)
            const label = user?.display_name || user?.email || id
            return (
              <button
                key={id}
                type="button"
                className="text-xs px-2 py-1 bg-neutral-100 border border-neutral-200 rounded"
                onClick={() => removeUser(id)}
                aria-label={`Remove mention ${label}`}
              >
                @{label} ×
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
