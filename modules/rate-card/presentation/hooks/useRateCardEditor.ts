'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as cardsApi from '../../infrastructure/api/cards.api'
import * as versionsApi from '../../infrastructure/api/versions.api'
import * as linesApi from '../../infrastructure/api/lines.api'
import type { RateCard, UpdateRateCardPayload } from '../../domain/model/rate-card'
import type {
  CreateRateCardVersionPayload,
  RateCardVersion,
} from '../../domain/model/rate-card-version'
import type {
  CreateRateCardLinePayload,
  RateCardLine,
  UpdateRateCardLinePayload,
} from '../../domain/model/rate-card-line'

/** Single rate card: versions + line items for the selected version. */
export function useRateCardEditor(rateCardId: string | null) {
  const [rateCard, setRateCard] = useState<RateCard | null>(null)
  const [versions, setVersions] = useState<RateCardVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [lines, setLines] = useState<RateCardLine[]>([])
  const [loading, setLoading] = useState(true)
  const [linesLoading, setLinesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!rateCardId) return
    setLoading(true)
    setError(null)
    try {
      const [card, versionList] = await Promise.all([
        cardsApi.getRateCard(rateCardId),
        versionsApi.listRateCardVersions(rateCardId),
      ])
      setRateCard(card)
      setVersions(versionList)
      setSelectedVersionId((prev) => {
        if (prev && versionList.some((v) => v.id === prev)) return prev
        const current = versionList.find((v) => v.id === card.currentVersionId)
        return current?.id ?? versionList[0]?.id ?? null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rate card')
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [rateCardId])

  useEffect(() => {
    void load()
  }, [load])

  const loadLines = useCallback(async () => {
    if (!rateCardId || !selectedVersionId) {
      setLines([])
      return
    }
    setLinesLoading(true)
    try {
      const items = await linesApi.listRateCardLines(rateCardId, selectedVersionId)
      setLines(items)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLinesLoading(false)
    }
  }, [rateCardId, selectedVersionId])

  useEffect(() => {
    void loadLines()
  }, [loadLines])

  const selectedVersion = versions.find((v) => v.id === selectedVersionId) ?? null

  const createVersion = useCallback(
    async (payload: CreateRateCardVersionPayload) => {
      if (!rateCardId) return
      setSaving(true)
      try {
        const created = await versionsApi.createRateCardVersion(rateCardId, payload)
        toast.success('Version created')
        await load()
        setSelectedVersionId(created.id)
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSaving(false)
      }
    },
    [rateCardId, load]
  )

  const publishVersion = useCallback(
    async (versionId: string) => {
      if (!rateCardId) return
      setSaving(true)
      try {
        await versionsApi.publishRateCardVersion(rateCardId, versionId)
        toast.success('Version published')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSaving(false)
      }
    },
    [rateCardId, load]
  )

  const archiveVersion = useCallback(
    async (versionId: string) => {
      if (!rateCardId) return
      setSaving(true)
      try {
        await versionsApi.archiveRateCardVersion(rateCardId, versionId)
        toast.success('Version archived')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSaving(false)
      }
    },
    [rateCardId, load]
  )

  const duplicateVersion = useCallback(
    async (versionId: string) => {
      if (!rateCardId) return
      setSaving(true)
      try {
        const created = await versionsApi.duplicateRateCardVersion(rateCardId, versionId)
        toast.success('Version duplicated')
        await load()
        setSelectedVersionId(created.id)
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSaving(false)
      }
    },
    [rateCardId, load]
  )

  const archiveRateCard = useCallback(async () => {
    if (!rateCardId) return
    setSaving(true)
    try {
      await cardsApi.archiveRateCard(rateCardId)
      toast.success('Rate card archived')
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      throw err
    } finally {
      setSaving(false)
    }
  }, [rateCardId, load])

  const deactivateRateCard = useCallback(async () => {
    if (!rateCardId) return
    setSaving(true)
    try {
      await cardsApi.deactivateRateCard(rateCardId)
      toast.success('Rate card deactivated')
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      throw err
    } finally {
      setSaving(false)
    }
  }, [rateCardId, load])

  const activateRateCard = useCallback(async () => {
    if (!rateCardId) return
    setSaving(true)
    try {
      await cardsApi.activateRateCard(rateCardId)
      toast.success('Rate card activated')
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      throw err
    } finally {
      setSaving(false)
    }
  }, [rateCardId, load])

  const updateRateCard = useCallback(
    async (payload: UpdateRateCardPayload) => {
      if (!rateCardId) return
      setSaving(true)
      try {
        await cardsApi.updateRateCard(rateCardId, payload)
        toast.success('Rate card updated')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSaving(false)
      }
    },
    [rateCardId, load]
  )

  const addLine = useCallback(
    async (payload: CreateRateCardLinePayload) => {
      if (!rateCardId || !selectedVersionId) return
      setSaving(true)
      try {
        await linesApi.createRateCardLine(rateCardId, selectedVersionId, payload)
        toast.success('Line added')
        await loadLines()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSaving(false)
      }
    },
    [rateCardId, selectedVersionId, loadLines]
  )

  const updateLine = useCallback(
    async (lineId: string, payload: UpdateRateCardLinePayload) => {
      if (!rateCardId || !selectedVersionId) return
      setSaving(true)
      try {
        await linesApi.updateRateCardLine(rateCardId, selectedVersionId, lineId, payload)
        toast.success('Line updated')
        await loadLines()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSaving(false)
      }
    },
    [rateCardId, selectedVersionId, loadLines]
  )

  const deleteLine = useCallback(
    async (lineId: string) => {
      if (!rateCardId || !selectedVersionId) return
      setSaving(true)
      try {
        await linesApi.deleteRateCardLine(rateCardId, selectedVersionId, lineId)
        toast.success('Line removed')
        await loadLines()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSaving(false)
      }
    },
    [rateCardId, selectedVersionId, loadLines]
  )

  return {
    rateCard,
    versions,
    selectedVersion,
    selectedVersionId,
    setSelectedVersionId,
    lines,
    loading,
    linesLoading,
    error,
    saving,
    createVersion,
    publishVersion,
    archiveVersion,
    duplicateVersion,
    archiveRateCard,
    deactivateRateCard,
    activateRateCard,
    updateRateCard,
    addLine,
    updateLine,
    deleteLine,
    refetch: load,
  }
}
