'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import * as workspaceInvitationsApi from '../api/workspace-invitations.api'
import type { CreateWorkspaceInvitationModalProps } from '../model'

const DEFAULT_EXPIRY_DAYS = 7

function defaultExpiresAtIso(): string {
  const date = new Date()
  date.setDate(date.getDate() + DEFAULT_EXPIRY_DAYS)
  return date.toISOString()
}

export function useCreateWorkspaceInvitationModal({
  workspaceId,
  onClose,
  onSuccess,
}: CreateWorkspaceInvitationModalProps) {
  const [email, setEmail] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [invitationCode, setInvitationCode] = useState<string | null>(null)

  const reset = useCallback(() => {
    setEmail('')
    setSendEmail(false)
    setInvitationCode(null)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [onClose, reset])

  const handleSubmit = useCallback(async () => {
    const trimmedEmail = email.trim().toLowerCase()
    if (sendEmail && !trimmedEmail) {
      toast.error('Email is required when sending an invitation email')
      return
    }

    setLoading(true)
    try {
      const res = await workspaceInvitationsApi.createWorkspaceInvitation(workspaceId, {
        invitedEmail: trimmedEmail || undefined,
        expiresAt: defaultExpiresAtIso(),
        sendEmail,
      })

      if (res.invitationCode) {
        setInvitationCode(res.invitationCode)
        toast.success('Invitation created')
        return
      }

      toast.success(sendEmail ? 'Invitation created and email sent' : 'Invitation created')
      handleClose()
      onSuccess()
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.problem.detail || 'Failed to create invitation')
      } else {
        toast.error('Failed to create invitation')
      }
    } finally {
      setLoading(false)
    }
  }, [email, sendEmail, workspaceId, handleClose, onSuccess])

  const handleCopyAndClose = useCallback(() => {
    if (invitationCode && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(invitationCode)
      toast.success('Invitation code copied')
    }
    handleClose()
    onSuccess()
  }, [invitationCode, handleClose, onSuccess])

  return {
    email,
    setEmail,
    sendEmail,
    setSendEmail,
    loading,
    invitationCode,
    handleClose,
    handleSubmit,
    handleCopyAndClose,
  }
}
