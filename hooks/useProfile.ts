'use client'

import { useCallback, useState } from 'react'
import * as profileService from '@/services/profile.service'
import type { Profile } from '@/types/auth'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const p = await profileService.getProfile()
      setProfile(p)
      return p
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load profile'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProfile = useCallback(
    async (patch: { display_name?: string; avatar_url?: string }) => {
      setError(null)
      const p = await profileService.updateProfile(patch)
      setProfile(p)
      return p
    },
    []
  )

  const uploadAvatar = useCallback(async (file: File) => {
    setError(null)
    const { public_url } = await profileService.uploadAvatar(file)
    setProfile((prev) => (prev ? { ...prev, avatar_url: public_url } : null))
    return public_url
  }, [])

  return {
    profile,
    loading,
    error,
    getProfile,
    updateProfile,
    uploadAvatar,
  }
}
