'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/project-templates.api'
import type {
  CreateProjectTemplatePhasePayload,
  CreateProjectTemplateTaskDependencyPayload,
  CreateProjectTemplateTaskPayload,
  CreateProjectTemplateVersionPayload,
  ProjectTemplate,
  ProjectTemplatePhase,
  ProjectTemplateTask,
  ProjectTemplateTaskDependency,
  ProjectTemplateVersion,
} from '../../domain/model/project-template'

export function useProjectTemplateBuilder(templateId: string | null) {
  const [template, setTemplate] = useState<ProjectTemplate | null>(null)
  const [versions, setVersions] = useState<ProjectTemplateVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [phases, setPhases] = useState<ProjectTemplatePhase[]>([])
  const [tasks, setTasks] = useState<ProjectTemplateTask[]>([])
  const [dependencies, setDependencies] = useState<ProjectTemplateTaskDependency[]>([])
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTemplateAndVersions = useCallback(async () => {
    if (!templateId) return
    setLoading(true)
    setError(null)
    try {
      const [tpl, vs] = await Promise.all([
        api.getProjectTemplate(templateId),
        api.listTemplateVersions(templateId),
      ])
      setTemplate(tpl)
      setVersions(vs)
      setSelectedVersionId((prev) => {
        if (prev && vs.some((v) => v.id === prev)) return prev
        return vs.find((v) => v.status === 'DRAFT')?.id ?? vs[0]?.id ?? null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template')
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    void loadTemplateAndVersions()
  }, [loadTemplateAndVersions])

  const selectedVersion = versions.find((v) => v.id === selectedVersionId) ?? null
  const isDraft = selectedVersion?.status === 'DRAFT'

  const loadVersionDetail = useCallback(async () => {
    if (!templateId || !selectedVersionId) {
      setPhases([])
      setTasks([])
      setDependencies([])
      return
    }
    setDetailLoading(true)
    setError(null)
    try {
      const [ph, tk, dep] = await Promise.all([
        api.listTemplatePhases(templateId, selectedVersionId),
        api.listTemplateTasks(templateId, selectedVersionId),
        api.listTemplateTaskDependencies(templateId, selectedVersionId),
      ])
      setPhases(ph)
      setTasks(tk)
      setDependencies(dep)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load version detail')
    } finally {
      setDetailLoading(false)
    }
  }, [templateId, selectedVersionId])

  useEffect(() => {
    void loadVersionDetail()
  }, [loadVersionDetail])

  const createVersion = useCallback(
    async (body: CreateProjectTemplateVersionPayload) => {
      if (!templateId) throw new Error('Missing template id')
      const version = await api.createTemplateVersion(templateId, body)
      await loadTemplateAndVersions()
      setSelectedVersionId(version.id)
      return version
    },
    [templateId, loadTemplateAndVersions]
  )

  const publishVersion = useCallback(async () => {
    if (!templateId || !selectedVersionId) return
    await api.publishTemplateVersion(templateId, selectedVersionId)
    await loadTemplateAndVersions()
  }, [templateId, selectedVersionId, loadTemplateAndVersions])

  const createPhase = useCallback(
    async (body: CreateProjectTemplatePhasePayload) => {
      if (!templateId || !selectedVersionId) throw new Error('Select a draft version first')
      await api.createTemplatePhase(templateId, selectedVersionId, body)
      await loadVersionDetail()
    },
    [templateId, selectedVersionId, loadVersionDetail]
  )

  const createTask = useCallback(
    async (body: CreateProjectTemplateTaskPayload) => {
      if (!templateId || !selectedVersionId) throw new Error('Select a draft version first')
      await api.createTemplateTask(templateId, selectedVersionId, body)
      await loadVersionDetail()
    },
    [templateId, selectedVersionId, loadVersionDetail]
  )

  const createDependency = useCallback(
    async (body: CreateProjectTemplateTaskDependencyPayload) => {
      if (!templateId || !selectedVersionId) throw new Error('Select a draft version first')
      await api.createTemplateTaskDependency(templateId, selectedVersionId, body)
      await loadVersionDetail()
    },
    [templateId, selectedVersionId, loadVersionDetail]
  )

  return {
    template,
    versions,
    selectedVersionId,
    setSelectedVersionId,
    selectedVersion,
    isDraft,
    phases,
    tasks,
    dependencies,
    loading,
    detailLoading,
    error,
    createVersion,
    publishVersion,
    createPhase,
    createTask,
    createDependency,
    refetch: loadTemplateAndVersions,
  }
}
