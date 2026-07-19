'use client'

import { useCallback, useState } from 'react'
import * as knowledgeApi from '../../infrastructure/api/knowledge'

export function useDocumentTypeBuilder(refetch: () => Promise<void> | void) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const create = useCallback(async () => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await knowledgeApi.createWorkspaceDocumentType({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || null,
      })
      setSuccess('Document type created')
      setCode('')
      setName('')
      setDescription('')
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setSubmitting(false)
    }
  }, [code, name, description, refetch])

  return {
    code,
    setCode,
    name,
    setName,
    description,
    setDescription,
    submitting,
    error,
    success,
    create,
  }
}
