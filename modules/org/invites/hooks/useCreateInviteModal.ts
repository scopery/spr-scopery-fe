'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import * as orgInvitesApi from '../api/org-invites.api'
import type { CreateInviteModalProps, OrgInviteRole } from '../model/org-invite'

export function useCreateInviteModal({ orgId, open, onClose, onSuccess }: CreateInviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrgInviteRole>('member')
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const reset = useCallback(() => {
    setEmail('')
    setRole('member')
    setInviteLink(null)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [onClose, reset])

  const handleSubmit = useCallback(async () => {
    if (!email.trim()) {
      toast.error('Email is required')
      return
    }
    setLoading(true)
    try {
      const res = await orgInvitesApi.createInvite(orgId, {
        email: email.trim().toLowerCase(),
        role,
      })
      if (res.invite_link) {
        setInviteLink(res.invite_link)
        toast.success('Invite created')
      } else if (res.invite_token && process.env.NODE_ENV !== 'production') {
        const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/invites/${res.invite_token}`
        setInviteLink(link)
        toast.success('Invite created (dev token)')
      } else {
        toast.success('Invite created and sent via email')
        handleClose()
        onSuccess()
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const code = err.problem.code
        if (code === 'ALREADY_MEMBER') toast.error('User is already a member')
        else if (code === 'INVITE_ALREADY_PENDING')
          toast.error('Invite already pending for this email')
        else toast.error(err.problem.detail || 'Failed to create invite')
      } else {
        toast.error('Failed to create invite')
      }
    } finally {
      setLoading(false)
    }
  }, [email, role, orgId, handleClose, onSuccess])

  const handleCopyAndClose = useCallback(() => {
    if (inviteLink && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink)
      toast.success('Link copied to clipboard')
    }
    handleClose()
    onSuccess()
  }, [inviteLink, handleClose, onSuccess])

  return {
    email,
    setEmail,
    role,
    setRole,
    loading,
    inviteLink,
    handleClose,
    handleSubmit,
    handleCopyAndClose,
    open,
  }
}
