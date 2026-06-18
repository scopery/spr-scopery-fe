'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Box, Button, Input, Select, Typography, Badge } from '@/shared/ui'
import * as agentControlService from '@/services/agent-control.service'
import type {
  OrgAgentListItem,
  PromptPreset,
  PromptRegistryMetadata,
  PromptTemplateDetail,
  PromptTemplateListItem,
  TemplatePromptBinding,
} from '@/types/agent-control'
import { ApiError } from '@/types/api'

type Props = {
  orgId: string
  canManage: boolean
  agents: OrgAgentListItem[]
}

export function PromptRegistryPanel({ orgId, canManage, agents }: Props) {
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
        agentControlService.getPromptRegistryMetadata(orgId),
        agentControlService.listPromptTemplates(orgId, {
          search: search.trim() || undefined,
        }),
        agentControlService.listPromptPresets(orgId),
        agentControlService.listTemplatePromptBindings(orgId),
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
      const detail = await agentControlService.getPromptTemplate(orgId, promptId)
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
      const created = await agentControlService.createPromptTemplate(orgId, {
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
      const validation = await agentControlService.validatePromptPlaceholders(orgId, {
        system_prompt: versionSystem || null,
        user_prompt_template: versionUser || null,
      })
      if (validation.errors.length > 0) {
        toast.error(validation.errors.join('; '))
        return
      }
      await agentControlService.createPromptVersion(orgId, selectedPromptId, {
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
      await agentControlService.setCurrentPromptVersion(orgId, selectedPromptId, versionId)
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
      await agentControlService.applyPromptPreset(orgId, presetKey)
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
      await agentControlService.createAgentPromptBinding(orgId, bindingAgentId, {
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

  if (loading) {
    return (
      <Typography variant="small" tone="muted">
        Loading prompt registry…
      </Typography>
    )
  }

  return (
    <Box className="space-y-4">
      <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        Prompt Registry is configuration only. Runtime AI routing will be wired in a later phase. No
        prompts are executed from this UI.
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          label="Search prompts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name or prompt_key"
        />
        {canManage ? (
          <div className="flex items-end">
            <Button variant="outline" size="sm" onClick={() => setShowCreateForm((v) => !v)}>
              {showCreateForm ? 'Cancel' : 'New prompt template'}
            </Button>
          </div>
        ) : null}
      </div>

      {showCreateForm && canManage ? (
        <div className="space-y-3 rounded-md border border-border p-4">
          <Input label="Prompt key" value={promptKey} onChange={(e) => setPromptKey(e.target.value)} />
          <Input label="Name" value={promptName} onChange={(e) => setPromptName(e.target.value)} />
          <Select
            label="Category"
            value={promptCategory}
            onValueChange={(v: string) => setPromptCategory(v)}
            options={(metadata?.categories ?? ['writing']).map((c) => ({ value: c, label: c }))}
          />
          <Button variant="primary" size="sm" loading={saving} onClick={() => void handleCreatePrompt()}>
            Create draft prompt
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Typography variant="small" className="font-medium">
            Prompt templates ({prompts.length})
          </Typography>
          {prompts.length === 0 ? (
            <Typography variant="small" tone="muted">
              No prompts yet. Apply a preset or create one.
            </Typography>
          ) : (
            <ul className="space-y-2">
              {prompts.map((prompt) => (
                <li key={prompt.id} className="rounded-md border border-border p-3">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => void loadDetail(prompt.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Typography variant="small" className="font-medium">
                        {prompt.name}
                      </Typography>
                      <Badge variant="soft" tone="neutral" size="sm">
                        {prompt.status}
                      </Badge>
                    </div>
                    <Typography variant="small" tone="muted">
                      {prompt.prompt_key} · {prompt.category} · v
                      {prompt.current_version_number ?? '—'} · {prompt.binding_count} bindings
                    </Typography>
                  </button>
                  {canManage && prompt.status !== 'archived' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        void agentControlService
                          .archivePromptTemplate(orgId, prompt.id)
                          .then(() => {
                            toast.success('Prompt archived')
                            if (selectedPromptId === prompt.id) {
                              setSelectedPromptId(null)
                              setPromptDetail(null)
                            }
                            void load()
                          })
                          .catch((err) =>
                            toast.error(
                              err instanceof ApiError ? err.message : 'Failed to archive prompt'
                            )
                          )
                      }
                    >
                      Archive
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 rounded-md border border-border p-4">
          <Typography variant="small" className="font-medium">
            Prompt detail
          </Typography>
          {!promptDetail ? (
            <Typography variant="small" tone="muted">
              Select a prompt to view versions and content.
            </Typography>
          ) : (
            <>
              <Typography variant="small" tone="muted">
                {promptDetail.prompt_key} · current v{promptDetail.current_version_number ?? '—'}
              </Typography>
              <ul className="space-y-2">
                {promptDetail.versions.map((version) => (
                  <li key={version.id} className="rounded border border-border p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>
                        v{version.version_number}
                        {version.version_label ? ` (${version.version_label})` : ''} ·{' '}
                        {version.output_format}
                      </span>
                      {canManage && promptDetail.current_version_id !== version.id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleSetCurrent(version.id)}
                        >
                          Set current
                        </Button>
                      ) : null}
                    </div>
                    {version.system_prompt ? (
                      <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                        {version.system_prompt}
                      </pre>
                    ) : null}
                  </li>
                ))}
              </ul>
              {canManage ? (
                <div className="space-y-2 border-t border-border pt-3">
                  <Typography variant="small" className="font-medium">
                    New version
                  </Typography>
                  <Input
                    label="System prompt"
                    value={versionSystem}
                    onChange={(e) => setVersionSystem(e.target.value)}
                  />
                  <Input
                    label="User prompt template"
                    value={versionUser}
                    onChange={(e) => setVersionUser(e.target.value)}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    loading={saving}
                    onClick={() => void handleCreateVersion()}
                  >
                    Create version
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {canManage ? (
        <div className="space-y-3 rounded-md border border-border p-4">
          <Typography variant="small" className="font-medium">
            Bind prompt to agent
          </Typography>
          <Select
            label="Agent"
            value={bindingAgentId}
            onValueChange={(v: string) => setBindingAgentId(v)}
            options={[
              { value: '', label: 'Select agent' },
              ...agents.map((a) => ({ value: a.id, label: `${a.name} (${a.agent_key})` })),
            ]}
          />
          <Select
            label="Prompt template"
            value={bindingPromptId}
            onValueChange={(v: string) => setBindingPromptId(v)}
            options={[
              { value: '', label: 'Select prompt' },
              ...prompts
                .filter((p) => p.status !== 'archived')
                .map((p) => ({ value: p.id, label: `${p.name} (${p.prompt_key})` })),
            ]}
          />
          <Input
            label="Binding key"
            value={bindingKey}
            onChange={(e) => setBindingKey(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            loading={saving}
            onClick={() => void handleCreateAgentBinding()}
          >
            Create binding
          </Button>
        </div>
      ) : null}

      {templateBindings.length > 0 ? (
        <div className="space-y-2">
          <Typography variant="small" className="font-medium">
            Template prompt bindings ({templateBindings.length})
          </Typography>
          <ul className="space-y-2">
            {templateBindings.map((binding) => (
              <li key={binding.id} className="rounded border border-border p-2 text-sm">
                {binding.binding_key} · template {binding.template_key ?? '—'} · deliverable{' '}
                {binding.deliverable_type ?? '—'} · section {binding.section_type ?? '—'}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {presets.length > 0 && canManage ? (
        <div className="space-y-2">
          <Typography variant="small" className="font-medium">
            Prompt presets (inactive by default)
          </Typography>
          <ul className="space-y-2">
            {presets.map((preset) => (
              <li
                key={preset.preset_key}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-border p-3"
              >
                <div>
                  <Typography variant="small" className="font-medium">
                    {preset.name}
                  </Typography>
                  <Typography variant="small" tone="muted">
                    {preset.prompt_key} · {preset.category}
                  </Typography>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  loading={saving}
                  onClick={() => void handleApplyPreset(preset.preset_key)}
                >
                  Apply preset
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Box>
  )
}
