'use client'

import { useCallback, useEffect, useState } from 'react'
import * as feedbackApi from '../api/ai-run-feedback.api'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type {
  AIRunFeedbackListItem,
  AIQualitySummary,
  AIFeedbackStatus,
  AIPromptVersionQualityItem,
} from '@/modules/admin/ai-feedback'

interface UseAIAgentQualityPanelParams {
  agentId: string
  orgId?: string
}

export function useAIAgentQualityPanel({ agentId, orgId }: UseAIAgentQualityPanelParams) {
  const [summary, setSummary] = useState<AIQualitySummary | null>(null)
  const [feedback, setFeedback] = useState<AIRunFeedbackListItem[]>([])
  const [versions, setVersions] = useState<AIPromptVersionQualityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<AIRunFeedbackListItem | null>(null)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [summaryRes, feedbackRes, versionsRes] = await Promise.all([
        feedbackApi.getAgentQualitySummary(agentId, { org_id: orgId }),
        feedbackApi.listAgentFeedback(agentId, {
          org_id: orgId,
          status: statusFilter || undefined,
          limit: 25,
        }),
        feedbackApi.getAgentVersionQuality(agentId, orgId),
      ])
      setSummary(summaryRes)
      setFeedback(feedbackRes.items)
      setVersions(versionsRes.items)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [agentId, orgId, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const updateStatus = async (status: AIFeedbackStatus) => {
    if (!selected) return
    setUpdating(true)
    try {
      await feedbackApi.updateFeedbackStatus(selected.feedbackId, { status })
      toast.success('Feedback status updated.')
      setSelected(null)
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setUpdating(false)
    }
  }

  return {
    summary,
    feedback,
    versions,
    loading,
    statusFilter,
    selected,
    updating,
    setStatusFilter,
    setSelected,
    updateStatus,
  }
}
