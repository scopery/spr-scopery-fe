import type { GovernancePresetPreviewResult } from '@/types/governance'
import type { PresetPreviewViewModel } from '@/types/governance/preset-preview-modal'
import { summarizeConditionGroup } from '@/utils/governanceConditions'

export function mapPresetPreviewToViewModel(
  preview: GovernancePresetPreviewResult
): PresetPreviewViewModel {
  const ruleCount = preview.rules.length

  return {
    name: preview.name,
    description: preview.description,
    scopeType: preview.scope_type,
    policyKey: preview.policy_key,
    priority: preview.priority,
    defaultStatus: preview.default_status,
    ruleCountLabel: `${ruleCount} rule${ruleCount === 1 ? '' : 's'}`,
    actionsAffectedLabel: preview.actions_affected.join(', '),
    effectsUsedLabel: preview.effects_used.join(', '),
    rules: preview.rules.map((rule) => ({
      ruleKey: rule.rule_key,
      name: rule.name,
      actionKey: rule.action_key,
      effect: rule.effect,
      conditionSummary: summarizeConditionGroup(rule.conditions),
    })),
  }
}
