'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Box, Button, Input, Select, Typography, ContentLoader, Badge } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { governanceApi } from '@/modules/governance'
import {
  useGovernancePolicy,
  GovernanceConditionBuilder,
  GovernanceConditionJsonEditor,
  createEmptyConditionGroup,
  formatConditionsJson,
  parseConditionsJson,
  summarizeConditionGroup,
  type GovernanceRule,
} from '@/modules/governance'
import { useEffectivePermissions } from '@/modules/permissions'
import { hasPermission, PERMISSIONS } from '@/utils/permissions'
import { GOVERNANCE_ACTION_KEYS, GOVERNANCE_EFFECTS } from '@/constants/governance.constants'
import { ApiError } from '@/shared/lib/api-types'

export function GovernancePolicyDetailView() {
  const params = useParams()
  const orgId = params.orgId as string
  const policyId = params.policyId as string

  const { policy, rules, loading, refetch: refetchPolicy } = useGovernancePolicy(orgId, policyId)
  const { permissions } = useEffectivePermissions(orgId)
  const canManage = hasPermission(permissions, PERMISSIONS.GOVERNANCE_MANAGE)

  const [showRuleForm, setShowRuleForm] = useState(false)
  const [ruleKey, setRuleKey] = useState('')
  const [ruleName, setRuleName] = useState('')
  const [actionKey, setActionKey] = useState('document.export')
  const [effect, setEffect] = useState<'allow' | 'warn' | 'deny'>('warn')
  const [conditionMode, setConditionMode] = useState<'builder' | 'json'>('builder')
  const [conditionGroup, setConditionGroup] = useState(createEmptyConditionGroup('all'))
  const [conditionsJson, setConditionsJson] = useState(
    formatConditionsJson(createEmptyConditionGroup('all'))
  )
  const [saving, setSaving] = useState(false)

  const rulesByAction = useMemo(() => {
    const grouped: Record<string, GovernanceRule[]> = {}
    for (const rule of rules) {
      if (!grouped[rule.action_key]) grouped[rule.action_key] = []
      grouped[rule.action_key].push(rule)
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => b.priority - a.priority)
    }
    return grouped
  }, [rules])

  const handleArchivePolicy = async () => {
    try {
      await governanceApi.archiveGovernancePolicy(orgId, policyId)
      toast.success('Policy archived')
      window.location.href = ROUTES.org.governance(orgId)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to archive policy')
    }
  }

  const handleCreateRule = async () => {
    let conditions = conditionGroup
    if (conditionMode === 'json') {
      const parsed = parseConditionsJson(conditionsJson)
      if (parsed.errors.length > 0 || !parsed.group) {
        toast.error(parsed.errors[0] ?? 'Invalid conditions JSON')
        return
      }
      conditions = parsed.group
    }

    setSaving(true)
    try {
      await governanceApi.createGovernanceRule(orgId, policyId, {
        rule_key: ruleKey.trim(),
        name: ruleName.trim(),
        action_key: actionKey,
        effect,
        status: 'inactive',
        conditions,
      })
      toast.success('Rule created')
      setShowRuleForm(false)
      void refetchPolicy()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create rule')
    } finally {
      setSaving(false)
    }
  }

  const handleArchiveRule = async (ruleId: string) => {
    try {
      await governanceApi.archiveGovernanceRule(orgId, ruleId)
      toast.success('Rule archived')
      void refetchPolicy()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to archive rule')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ContentLoader variant="easeOut" className="w-20" />
      </div>
    )
  }

  if (!policy) {
    return <Typography tone="error">Policy not found</Typography>
  }

  return (
    <Box className="space-y-6">
      <Link href={ROUTES.org.governance(orgId)} className="text-sm text-primary hover:underline">
        ← Back to governance
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Typography variant="h3">{policy.name}</Typography>
          <Typography variant="small" tone="muted">
            {policy.policy_key} · {policy.scope_type} · priority {policy.priority}
            {policy.preset_key ? ` · preset ${policy.preset_key}` : ''}
          </Typography>
          {policy.description ? (
            <Typography variant="small" className="mt-2">
              {policy.description}
            </Typography>
          ) : null}
          <Typography variant="small" tone="muted" className="mt-2">
            Created {new Date(policy.created_at).toLocaleString()} · Updated{' '}
            {new Date(policy.updated_at).toLocaleString()}
          </Typography>
          <Typography variant="small" tone="muted" className="mt-1">
            Active policies are enforced server-side when governance enforcement is enabled.
          </Typography>
        </div>
        <Badge variant="soft" tone={policy.status === 'active' ? 'success' : 'neutral'} size="sm">
          {policy.status}
        </Badge>
      </div>

      {canManage && policy.status !== 'archived' ? (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowRuleForm((v) => !v)}>
            {showRuleForm ? 'Cancel rule' : 'Add rule'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            tone="error"
            onClick={() => void handleArchivePolicy()}
          >
            Archive policy
          </Button>
        </div>
      ) : null}

      {showRuleForm && canManage ? (
        <div className="border-border space-y-3 rounded-md border p-4">
          <Input label="Rule key" value={ruleKey} onChange={(e) => setRuleKey(e.target.value)} />
          <Input label="Name" value={ruleName} onChange={(e) => setRuleName(e.target.value)} />
          <Select
            label="Action key"
            value={actionKey}
            onValueChange={(v: string) => setActionKey(v)}
            options={GOVERNANCE_ACTION_KEYS.map((key) => ({ value: key, label: key }))}
          />
          <Select
            label="Effect"
            value={effect}
            onValueChange={(v: string) => setEffect(v as 'allow' | 'warn' | 'deny')}
            options={GOVERNANCE_EFFECTS.map((value) => ({ value, label: value }))}
          />
          <Select
            label="Condition editor"
            value={conditionMode}
            onValueChange={(v: string) => setConditionMode(v as 'builder' | 'json')}
            options={[
              { value: 'builder', label: 'Condition builder' },
              { value: 'json', label: 'JSON editor' },
            ]}
          />
          {conditionMode === 'builder' ? (
            <GovernanceConditionBuilder
              value={conditionGroup}
              onChange={(group) => {
                setConditionGroup(group)
                setConditionsJson(formatConditionsJson(group))
              }}
            />
          ) : (
            <GovernanceConditionJsonEditor
              orgId={orgId}
              value={conditionsJson}
              onChange={setConditionsJson}
              onValidGroup={setConditionGroup}
            />
          )}
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            onClick={() => void handleCreateRule()}
          >
            Create rule
          </Button>
        </div>
      ) : null}

      <div className="space-y-4">
        <Typography variant="small" className="font-medium">
          Rules ({rules.length})
        </Typography>
        {rules.length === 0 ? (
          <Typography variant="small" tone="muted">
            No rules yet.
          </Typography>
        ) : (
          Object.entries(rulesByAction).map(([action, actionRules]) => (
            <div key={action} className="space-y-2">
              <Typography variant="small" className="text-muted-foreground font-medium">
                {action}
              </Typography>
              {actionRules.map((rule) => (
                <div key={rule.id} className="border-border space-y-2 rounded-md border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Typography variant="small" className="font-medium">
                      {rule.name}
                    </Typography>
                    <div className="flex gap-2">
                      <Badge variant="soft" tone="neutral" size="sm">
                        {rule.effect}
                      </Badge>
                      <Badge variant="soft" tone="neutral" size="sm">
                        {rule.status}
                      </Badge>
                    </div>
                  </div>
                  <Typography variant="small" tone="muted">
                    {rule.rule_key} · priority {rule.priority}
                  </Typography>
                  <Typography variant="small">
                    {summarizeConditionGroup(rule.conditions)}
                  </Typography>
                  {rule.explanation_template ? (
                    <Typography variant="small" tone="muted">
                      {rule.explanation_template}
                    </Typography>
                  ) : null}
                  <Typography variant="small" tone="muted">
                    Updated {new Date(rule.updated_at).toLocaleString()}
                  </Typography>
                  <pre className="bg-muted/30 overflow-auto rounded p-2 text-xs">
                    {JSON.stringify(rule.conditions, null, 2)}
                  </pre>
                  {canManage && rule.status !== 'archived' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleArchiveRule(rule.id)}
                    >
                      Archive rule
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </Box>
  )
}
