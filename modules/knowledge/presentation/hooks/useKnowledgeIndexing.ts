'use client'

import { useCallback, useEffect, useState } from 'react'
import * as knowledgeApi from '../../infrastructure/api/knowledge'

export function useKnowledgeIndexing(workspaceId: string | null) {
  const [jobs, setJobs] = useState<
    Array<{ id?: string; jobId?: string; status?: string; jobStatus?: string; jobType?: string }>
  >([])
  const [classifications, setClassifications] = useState<
    Array<{ id: string; code?: string; name: string }>
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [sourceId, setSourceId] = useState('')
  const [sourceDetail, setSourceDetail] = useState<{
    id: string
    title?: string
    status?: string
  } | null>(null)
  const [chunks, setChunks] = useState<Array<{ id: string; text?: string }>>([])

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [jobsRes, classRes] = await Promise.all([
        knowledgeApi.listIndexingJobs(workspaceId),
        knowledgeApi.listDocumentClassifications(),
      ])
      setJobs(jobsRes.items)
      setClassifications(classRes.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load indexing jobs')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const startReindex = useCallback(async () => {
    if (!workspaceId) return
    setActionError(null)
    try {
      await knowledgeApi.startWorkspaceReindex(workspaceId)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Reindex failed')
    }
  }, [workspaceId, load])

  const loadSource = useCallback(async (id: string) => {
    if (!id.trim()) return
    setActionError(null)
    try {
      const [src, chunkRes] = await Promise.all([
        knowledgeApi.getKnowledgeSource(id.trim()),
        knowledgeApi.listSourceChunks(id.trim()),
      ])
      setSourceDetail(src)
      setChunks(chunkRes.items)
      setSourceId(id.trim())
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Load source failed')
    }
  }, [])

  const reindexSource = useCallback(async () => {
    if (!sourceId) return
    setActionError(null)
    try {
      await knowledgeApi.reindexKnowledgeSource(sourceId)
      await loadSource(sourceId)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Source reindex failed')
    }
  }, [sourceId, loadSource, load])

  return {
    jobs,
    classifications,
    sourceId,
    setSourceId,
    sourceDetail,
    chunks,
    loading,
    error,
    actionError,
    refetch: load,
    startReindex,
    loadSource,
    reindexSource,
  }
}
