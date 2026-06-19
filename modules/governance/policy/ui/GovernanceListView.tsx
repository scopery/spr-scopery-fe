'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Box, Button, Input, Select, Typography, ContentLoader, Badge } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { governanceApi } from '@/modules/governance'
import {
  GovernanceStatusBanner,
  GovernanceSimulator,
  PresetPreviewModal,
  type GovernancePolicyListItem,
  type GovernancePreset,
  type GovernanceStatusResult,
} from '@/modules/governance'
import { useEffectivePermissions } from '@/modules/permissions'
import { hasPermission, PERMISSIONS } from '@/utils/permissions'
import { ApiError } from '@/shared/lib/api-types'

export function GovernanceListView() {
  const params = useParams()
  const orgId = params.orgId as string

  const { permissions } = useEffectivePermissions(orgId)
  const canManage = hasPermission(permissions, PERMISSIONS.GOVERNANCE_MANAGE)
  const canEvaluate = hasPermission(permissions, PERMISSIONS.GOVERNANCE_EVALUATE)
  const canViewRules = hasPermission(permissions, PERMISSIONS.GOVERNANCE_VIEW)

  const [items, setItems] = useState<GovernancePolicyListItem[]>([])
  const [total, setTotal] = useState(0)
  const [presets, setPresets] = useState<GovernancePreset[]>([])
  const [statusInfo, setStatusInfo] = useState<GovernanceStatusResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [scopeFilter, setScopeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [policyKey, setPolicyKey] = useState('')
  const [policyName, setPolicyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [presetPreviewKey, setPresetPreviewKey] = useState<string | null>(null)
  const [applyingPreset, setApplyingPreset] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [policiesRes, statusRes] = await Promise.all([
        governanceApi.listGovernancePolicies(orgId, {
          status: statusFilter || undefined,
          scope_type: scopeFilter || undefined,
          search: search.trim() || undefined,
          include_archived: statusFilter === 'archived' ? true : undefined,
        }),
        governanceApi.getGovernanceStatus(orgId).catch(() => null),
      ])
      setItems(policiesRes.items)
      setTotal(policiesRes.total)
      setStatusInfo(statusRes)
      const presetRes = await governanceApi
        .listGovernancePresets(orgId)
        .catch(() => ({ items: [] }))
      setPresets(presetRes.items)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load governance policies')
    } finally {
      setLoading(false)
    }
  }, [orgId, scopeFilter, search, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const activeCount = useMemo(() => items.filter((i) => i.status === 'active').length, [items])

  const handleCreate = async () => {
    if (!policyKey.trim() || !policyName.trim()) {
      toast.error('Policy key and name are required')
      return
    }
    setCreating(true)
    try {
      await governanceApi.createGovernancePolicy(orgId, {
        policy_key: policyKey.trim(),
        name: policyName.trim(),
        scope_type: 'org',
        status: 'inactive',
      })
      toast.success('Policy created')
      setShowCreate(false)
      setPolicyKey('')
      setPolicyName('')
      void load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create policy')
    } finally {
      setCreating(false)
    }
  }

  const handleApplyPreset = async (presetKey: string) => {
    setApplyingPreset(true)
    try {
      await governanceApi.applyGovernancePreset(orgId, {
        preset_key: presetKey,
        activate: false,
      })
      toast.success('Preset applied as inactive policy')
      setPresetPreviewKey(null)
      void load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to apply preset')
    } finally {
      setApplyingPreset(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ContentLoader variant="easeOut" className="w-20" />
      </div>
    )
  }

  return (
    <Box className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography variant="h3">Governance policies</Typography>
          <Typography variant="small" tone="muted">
            Configure org governance rules. Policies are inactive by default until activated. Active
            policies are enforced on document export, deliverables, templates, and workflow
            transitions.
          </Typography>
        </div>
        {canManage ? (
          <Button variant="primary" size="sm" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Cancel' : 'New policy'}
          </Button>
        ) : null}
      </div>

      <GovernanceStatusBanner status={statusInfo} />

      <div className="grid gap-3 md:grid-cols-3">
        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name or policy key"
        />
        <Select
          label="Status"
          value={statusFilter}
          onValueChange={(v: string) => setStatusFilter(v)}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
        <Select
          label="Scope"
          value={scopeFilter}
          onValueChange={(v: string) => setScopeFilter(v)}
          options={[
            { value: '', label: 'All scopes' },
            { value: 'org', label: 'Org' },
            { value: 'project', label: 'Project' },
          ]}
        />
      </div>

      {showCreate && canManage ? (
        <div className="border-border space-y-3 rounded-md border p-4">
          <Input
            label="Policy key"
            value={policyKey}
            onChange={(e) => setPolicyKey(e.target.value)}
            placeholder="my_policy_key"
          />
          <Input
            label="Name"
            value={policyName}
            onChange={(e) => setPolicyName(e.target.value)}
            placeholder="My policy"
          />
          <Button
            variant="primary"
            size="sm"
            loading={creating}
            onClick={() => void handleCreate()}
          >
            Create policy
          </Button>
        </div>
      ) : null}

      {items.length === 0 ? (
        <Typography variant="small" tone="muted">
          {search || statusFilter || scopeFilter
            ? 'No policies match the current filters.'
            : activeCount === 0
              ? 'No governance policies yet. Create a policy or apply a preset to get started.'
              : 'No policies found.'}
        </Typography>
      ) : (
        <>
          <Typography variant="small" tone="muted">
            Showing {items.length} of {total}
          </Typography>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="border-border rounded-md border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <Link
                      href={ROUTES.org.governancePolicy(orgId, item.id)}
                      className="font-medium text-primary hover:underline"
                    >
                      {item.name}
                    </Link>
                    <Typography variant="small" tone="muted">
                      {item.policy_key} · {item.scope_type}
                      {item.project_name ? ` · ${item.project_name}` : ''}
                      {item.preset_key ? ` · preset: ${item.preset_key}` : ''}
                    </Typography>
                    <Typography variant="small" tone="muted">
                      Priority {item.priority} · {item.rule_count} rules ({item.active_rule_count}{' '}
                      active) · Updated {new Date(item.updated_at).toLocaleDateString()}
                    </Typography>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="soft"
                      tone={item.status === 'active' ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                    <Link
                      href={ROUTES.org.governancePolicy(orgId, item.id)}
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {presets.length > 0 && canManage ? (
        <div className="space-y-2">
          <Typography variant="small" className="font-medium">
            Presets (apply as inactive)
          </Typography>
          <ul className="space-y-2">
            {presets.map((preset) => (
              <li
                key={preset.preset_key}
                className="border-border flex flex-wrap items-center justify-between gap-2 rounded border p-3"
              >
                <div>
                  <Typography variant="small" className="font-medium">
                    {preset.name}
                  </Typography>
                  <Typography variant="small" tone="muted">
                    {preset.description}
                  </Typography>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetPreviewKey(preset.preset_key)}
                >
                  Preview & apply
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {canEvaluate ? <GovernanceSimulator orgId={orgId} canViewRuleDetails={canViewRules} /> : null}

      <PresetPreviewModal
        orgId={orgId}
        presetKey={presetPreviewKey}
        open={presetPreviewKey !== null}
        onClose={() => setPresetPreviewKey(null)}
        onConfirm={(key) => void handleApplyPreset(key)}
        confirming={applyingPreset}
      />
    </Box>
  )
}
