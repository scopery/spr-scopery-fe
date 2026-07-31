'use client'

import { useCallback, useEffect, useState } from 'react'
import { useCaseApi } from '@/modules/projects/traceability'
import * as qualityApi from '../../infrastructure/api/quality.api'
import type {
  CreateTestCaseStepPayload,
  TestCaseDetail,
  TestCaseTraceability,
  UpdateTestCasePayload,
  UpdateTestCaseStepPayload,
} from '../../domain/model/quality'

export type TestCaseLinkKind = 'useCase'

export interface TestCaseLinkOption {
  id: string
  code?: string | null
  label: string
  status?: string | null
}

export function useTestCaseDetail(projectId: string | null, testCaseId: string | null) {
  const [detail, setDetail] = useState<TestCaseDetail | null>(null)
  const [traceability, setTraceability] = useState<TestCaseTraceability | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !testCaseId) {
      setDetail(null)
      setTraceability(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [testCase, links] = await Promise.all([
        qualityApi.getTestCase(projectId, testCaseId),
        qualityApi.getTestCaseTraceability(projectId, testCaseId),
      ])
      setDetail(testCase)
      setTraceability(links)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Test Case')
    } finally {
      setLoading(false)
    }
  }, [projectId, testCaseId])

  useEffect(() => {
    void load()
  }, [load])

  const update = useCallback(
    async (changes: Omit<UpdateTestCasePayload, 'version'>) => {
      if (!projectId || !testCaseId || !detail) return
      setSaving(true)
      try {
        const updated = await qualityApi.updateTestCase(projectId, testCaseId, {
          ...changes,
          version: detail.version ?? 0,
        })
        setDetail((current) => (current ? { ...current, ...updated } : current))
        return updated
      } finally {
        setSaving(false)
      }
    },
    [detail, projectId, testCaseId]
  )

  const addStep = useCallback(
    async (body: CreateTestCaseStepPayload) => {
      if (!projectId || !testCaseId) return
      const created = await qualityApi.createTestCaseStep(projectId, testCaseId, body)
      setDetail((current) =>
        current ? { ...current, steps: [...(current.steps ?? []), created] } : current
      )
      return created
    },
    [projectId, testCaseId]
  )

  const updateStep = useCallback(
    async (stepId: string, body: UpdateTestCaseStepPayload) => {
      if (!projectId || !testCaseId) return
      const updated = await qualityApi.updateTestCaseStep(projectId, testCaseId, stepId, body)
      setDetail((current) =>
        current
          ? {
              ...current,
              steps: current.steps.map((step) => (step.id === stepId ? updated : step)),
            }
          : current
      )
      return updated
    },
    [projectId, testCaseId]
  )

  const duplicateStep = useCallback(
    async (stepId: string) => {
      if (!projectId || !testCaseId) return
      const created = await qualityApi.duplicateTestCaseStep(projectId, testCaseId, stepId)
      setDetail((current) =>
        current ? { ...current, steps: [...current.steps, created] } : current
      )
    },
    [projectId, testCaseId]
  )

  const archiveStep = useCallback(
    async (stepId: string) => {
      if (!projectId || !testCaseId) return
      await qualityApi.archiveTestCaseStep(projectId, testCaseId, stepId)
      setDetail((current) =>
        current
          ? { ...current, steps: current.steps.filter((step) => step.id !== stepId) }
          : current
      )
    },
    [projectId, testCaseId]
  )

  const bulkAddSteps = useCallback(
    async (items: CreateTestCaseStepPayload[]) => {
      if (!projectId || !testCaseId || items.length === 0) return
      await qualityApi.batchCreateTestCaseSteps(projectId, testCaseId, items)
      await load()
    },
    [load, projectId, testCaseId]
  )

  const loadLinkOptions = useCallback(
    async (_kind: TestCaseLinkKind): Promise<TestCaseLinkOption[]> => {
      if (!projectId) return []
      const response = await useCaseApi.listUseCases(projectId)
      return response.map((item) => ({
        id: item.id,
        code: item.key,
        label: item.name,
        status: item.status,
      }))
    },
    [projectId]
  )

  const replaceLinks = useCallback(
    async (_kind: TestCaseLinkKind, ids: string[]) => {
      if (!projectId || !testCaseId) return
      const updated = await qualityApi.replaceTestCaseUseCaseLinks(projectId, testCaseId, ids)
      setTraceability(updated)
      setDetail((current) =>
        current
          ? {
              ...current,
              requirementCount: updated.requirements.length,
              useCaseCount: updated.useCases.length,
            }
          : current
      )
      return updated
    },
    [projectId, testCaseId]
  )

  return {
    detail,
    traceability,
    loading,
    saving,
    error,
    refetch: load,
    update,
    addStep,
    updateStep,
    duplicateStep,
    archiveStep,
    bulkAddSteps,
    loadLinkOptions,
    replaceLinks,
  }
}
