'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-types'
import * as agentControlApi from '@/modules/ai-agent-control/agent-control/api/agent-control.api'
import type {
  OrgAgentListItem,
  PromptPreset,
  PromptRegistryMetadata,
  PromptTemplateDetail,
  PromptTemplateListItem,
  TemplatePromptBinding,
} from '@/modules/ai-agent-control/agent-control/model/agent-control-types'

interface UsePromptRegistryPanelParams {
  orgId: string
  canManage: boolean
  agents: OrgAgentListItem[]
}

export function usePromptRegistryPanel({ orgId, canManage, agents }: UsePromptRegistryPanelParams) {
  const [loading, setLoading] = useState(true)
  const [metadata, setMetadata] = useState<PromptRegistryMetadata | null>(null)
  const [prompts, setPrompts] = useState<PromptTemplateListItem[]>([])
  const [presets, setPresets] = useState<PromptPreset[]>([])
  const [templateBindings, setTemplateBindings] = useState<TemplatePromptBinding[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  const [promptDetail, setPromptDetail] = useState<PromptTemplateDetail | null>(null)
  const [search, setSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [promptKey, setPromptKey] = useState('')
  const [promptName, setPromptName] = useState('')
  const [promptCategory, setPromptCategory] = useState('writing')
  const [versionSystem, setVersionSystem] = useState('')
  const [versionUser, setVersionUser] = useState('')
  const [bindingAgentId, setBindingAgentId] = useState('')
  const [bindingKey, setBindingKey] = useState('default')
  const [bindingPromptId, setBindingPromptId] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [meta, promptsRes, presetsRes, bindingsRes] = await Promise.all([
        agentControlApi.getPromptRegistryMetadata(orgId),
        agentControlApi.listPromptTemplates(orgId, {
          search: search.trim() || undefined,
        }),
        agentControlApi.listPromptPresets(orgId),
        agentControlApi.listTemplatePromptBindings(orgId),
      ])
      setMetadata(meta)
      setPrompts(promptsRes.items)
      setPresets(presetsRes)
      setTemplateBindings(bindingsRes.items)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load prompt registry')
    } finally {
      setLoading(false)
    }
  }, [orgId, search])

  useEffect(() => {
    void load()
  }, [load])

  const loadDetail = async (promptId: string) => {
    try {
      const detail = await agentControlApi.getPromptTemplate(orgId, promptId)
      setSelectedPromptId(promptId)
      setPromptDetail(detail)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load prompt detail')
    }
  }

  const handleCreatePrompt = async () => {
    if (!promptKey.trim() || !promptName.trim()) {
      toast.error('Prompt key and name are required')
      return
    }
    setSaving(true)
    try {
      const created = await agentControlApi.createPromptTemplate(orgId, {
        prompt_key: promptKey.trim(),
        name: promptName.trim(),
        category: promptCategory,
        status: 'draft',
      })
      toast.success('Prompt template created')
      setShowCreateForm(false)
      setPromptKey('')
      setPromptName('')
      await load()
      await loadDetail(created.id)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create prompt')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateVersion = async () => {
    if (!selectedPromptId) return
    setSaving(true)
    try {
      const validation = await agentControlApi.validatePromptPlaceholders(orgId, {
        system_prompt: versionSystem || null,
        user_prompt_template: versionUser || null,
      })
      if (validation.errors.length > 0) {
        toast.error(validation.errors.join('; '))
        return
      }
      await agentControlApi.createPromptVersion(orgId, selectedPromptId, {
        system_prompt: versionSystem || null,
        user_prompt_template: versionUser || null,
        output_format: 'markdown',
        variables_json: validation.placeholders,
      })
      toast.success('Version created')
      setVersionSystem('')
      setVersionUser('')
      await loadDetail(selectedPromptId)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create version')
    } finally {
      setSaving(false)
    }
  }

  const handleSetCurrent = async (versionId: string) => {
    if (!selectedPromptId) return
    try {
      await agentControlApi.setCurrentPromptVersion(orgId, selectedPromptId, versionId)
      toast.success('Current version updated')
      await loadDetail(selectedPromptId)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to set current version')
    }
  }

  const handleApplyPreset = async (presetKey: string) => {
    setSaving(true)
    try {
      await agentControlApi.applyPromptPreset(orgId, presetKey)
      toast.success('Prompt preset applied (inactive)')
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to apply preset')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateAgentBinding = async () => {
    if (!bindingAgentId || !bindingPromptId || !bindingKey.trim()) {
      toast.error('Agent, prompt, and binding key are required')
      return
    }
    setSaving(true)
    try {
      await agentControlApi.createAgentPromptBinding(orgId, bindingAgentId, {
        prompt_template_id: bindingPromptId,
        binding_key: bindingKey.trim(),
      })
      toast.success('Agent prompt binding created')
      setBindingAgentId('')
      setBindingPromptId('')
      setBindingKey('default')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create binding')
    } finally {
      setSaving(false)
    }
  }

  const archivePrompt = async (promptId: string) => {
    try {
      await agentControlApi.archivePromptTemplate(orgId, promptId)
      toast.success('Prompt archived')
      if (selectedPromptId === promptId) {
        setSelectedPromptId(null)
        setPromptDetail(null)
      }
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to archive prompt')
    }
  }

  return {
    loading,
    metadata,
    prompts,
    presets,
    templateBindings,
    selectedPromptId,
    promptDetail,
    search,
    showCreateForm,
    promptKey,
    promptName,
    promptCategory,
    versionSystem,
    versionUser,
    bindingAgentId,
    bindingKey,
    bindingPromptId,
    saving,
    agents,
    canManage,
    setSearch,
    setShowCreateForm,
    setPromptKey,
    setPromptName,
    setPromptCategory,
    setVersionSystem,
    setVersionUser,
    setBindingAgentId,
    setBindingKey,
    setBindingPromptId,
    loadDetail,
    handleCreatePrompt,
    handleCreateVersion,
    handleSetCurrent,
    handleApplyPreset,
    handleCreateAgentBinding,
    archivePrompt,
  }
}
