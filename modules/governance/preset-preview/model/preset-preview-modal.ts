export interface PresetPreviewRuleRowViewModel {
  ruleKey: string
  name: string
  actionKey: string
  effect: string
  conditionSummary: string
}

export interface PresetPreviewViewModel {
  name: string
  description: string
  scopeType: string
  policyKey: string
  priority: number
  defaultStatus: string
  ruleCountLabel: string
  actionsAffectedLabel: string
  effectsUsedLabel: string
  rules: PresetPreviewRuleRowViewModel[]
}

export interface PresetPreviewModalProps {
  orgId: string
  presetKey: string | null
  open: boolean
  onClose: () => void
  onConfirm: (presetKey: string) => void
  confirming?: boolean
}

export interface PresetPreviewModalViewProps {
  open: boolean
  presetKey: string | null
  loading: boolean
  preview: PresetPreviewViewModel | null
  confirming: boolean
  onClose: () => void
  onConfirm: (presetKey: string) => void
}
