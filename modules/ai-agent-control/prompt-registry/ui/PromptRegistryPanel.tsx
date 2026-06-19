'use client'

import { Box, Button, Input, Select, Typography, Badge } from '@/shared/ui'
import type { OrgAgentListItem } from '@/modules/ai-agent-control/agent-control/model/agent-control-types'
import { usePromptRegistryPanel } from '../hooks/usePromptRegistryPanel'

type Props = {
  orgId: string
  canManage: boolean
  agents: OrgAgentListItem[]
}

export function PromptRegistryPanel({ orgId, canManage, agents }: Props) {
  const panel = usePromptRegistryPanel({ orgId, canManage, agents })

  if (panel.loading) {
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
          value={panel.search}
          onChange={(e) => panel.setSearch(e.target.value)}
          placeholder="Name or prompt_key"
        />
        {canManage ? (
          <div className="flex items-end">
            <Button variant="outline" size="sm" onClick={() => panel.setShowCreateForm((v) => !v)}>
              {panel.showCreateForm ? 'Cancel' : 'New prompt template'}
            </Button>
          </div>
        ) : null}
      </div>

      {panel.showCreateForm && canManage ? (
        <div className="border-border space-y-3 rounded-md border p-4">
          <Input
            label="Prompt key"
            value={panel.promptKey}
            onChange={(e) => panel.setPromptKey(e.target.value)}
          />
          <Input label="Name" value={panel.promptName} onChange={(e) => panel.setPromptName(e.target.value)} />
          <Select
            label="Category"
            value={panel.promptCategory}
            onValueChange={(v: string) => panel.setPromptCategory(v)}
            options={(panel.metadata?.categories ?? ['writing']).map((c) => ({ value: c, label: c }))}
          />
          <Button
            variant="primary"
            size="sm"
            loading={panel.saving}
            onClick={() => void panel.handleCreatePrompt()}
          >
            Create draft prompt
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Typography variant="small" className="font-medium">
            Prompt templates ({panel.prompts.length})
          </Typography>
          {panel.prompts.length === 0 ? (
            <Typography variant="small" tone="muted">
              No prompts yet. Apply a preset or create one.
            </Typography>
          ) : (
            <ul className="space-y-2">
              {panel.prompts.map((prompt) => (
                <li key={prompt.id} className="border-border rounded-md border p-3">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => void panel.loadDetail(prompt.id)}
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
                      onClick={() => void panel.archivePrompt(prompt.id)}
                    >
                      Archive
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-border space-y-3 rounded-md border p-4">
          <Typography variant="small" className="font-medium">
            Prompt detail
          </Typography>
          {!panel.promptDetail ? (
            <Typography variant="small" tone="muted">
              Select a prompt to view versions and content.
            </Typography>
          ) : (
            <>
              <Typography variant="small" tone="muted">
                {panel.promptDetail.prompt_key} · current v
                {panel.promptDetail.current_version_number ?? '—'}
              </Typography>
              <ul className="space-y-2">
                {panel.promptDetail.versions.map((version) => (
                  <li key={version.id} className="border-border rounded border p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>
                        v{version.version_number}
                        {version.version_label ? ` (${version.version_label})` : ''} ·{' '}
                        {version.output_format}
                      </span>
                      {canManage && panel.promptDetail!.current_version_id !== version.id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void panel.handleSetCurrent(version.id)}
                        >
                          Set current
                        </Button>
                      ) : null}
                    </div>
                    {version.system_prompt ? (
                      <pre className="text-muted-foreground mt-2 max-h-24 overflow-auto whitespace-pre-wrap text-xs">
                        {version.system_prompt}
                      </pre>
                    ) : null}
                  </li>
                ))}
              </ul>
              {canManage ? (
                <div className="border-border space-y-2 border-t pt-3">
                  <Typography variant="small" className="font-medium">
                    New version
                  </Typography>
                  <Input
                    label="System prompt"
                    value={panel.versionSystem}
                    onChange={(e) => panel.setVersionSystem(e.target.value)}
                  />
                  <Input
                    label="User prompt template"
                    value={panel.versionUser}
                    onChange={(e) => panel.setVersionUser(e.target.value)}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    loading={panel.saving}
                    onClick={() => void panel.handleCreateVersion()}
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
        <div className="border-border space-y-3 rounded-md border p-4">
          <Typography variant="small" className="font-medium">
            Bind prompt to agent
          </Typography>
          <Select
            label="Agent"
            value={panel.bindingAgentId}
            onValueChange={(v: string) => panel.setBindingAgentId(v)}
            options={[
              { value: '', label: 'Select agent' },
              ...agents.map((a) => ({ value: a.id, label: `${a.name} (${a.agent_key})` })),
            ]}
          />
          <Select
            label="Prompt template"
            value={panel.bindingPromptId}
            onValueChange={(v: string) => panel.setBindingPromptId(v)}
            options={[
              { value: '', label: 'Select prompt' },
              ...panel.prompts
                .filter((p) => p.status !== 'archived')
                .map((p) => ({ value: p.id, label: `${p.name} (${p.prompt_key})` })),
            ]}
          />
          <Input
            label="Binding key"
            value={panel.bindingKey}
            onChange={(e) => panel.setBindingKey(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            loading={panel.saving}
            onClick={() => void panel.handleCreateAgentBinding()}
          >
            Create binding
          </Button>
        </div>
      ) : null}

      {panel.templateBindings.length > 0 ? (
        <div className="space-y-2">
          <Typography variant="small" className="font-medium">
            Template prompt bindings ({panel.templateBindings.length})
          </Typography>
          <ul className="space-y-2">
            {panel.templateBindings.map((binding) => (
              <li key={binding.id} className="border-border rounded border p-2 text-sm">
                {binding.binding_key} · template {binding.template_key ?? '—'} · deliverable{' '}
                {binding.deliverable_type ?? '—'} · section {binding.section_type ?? '—'}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {panel.presets.length > 0 && canManage ? (
        <div className="space-y-2">
          <Typography variant="small" className="font-medium">
            Prompt presets (inactive by default)
          </Typography>
          <ul className="space-y-2">
            {panel.presets.map((preset) => (
              <li
                key={preset.preset_key}
                className="border-border flex flex-wrap items-center justify-between gap-2 rounded border p-3"
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
                  loading={panel.saving}
                  onClick={() => void panel.handleApplyPreset(preset.preset_key)}
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
