import type { GovernanceConditionGroup } from './governance-types'

export type {
  GovernancePolicy,
  GovernanceRule,
  GovernancePolicyListItem,
  GovernancePreset,
  GovernanceStatusResult,
  GovernanceEvaluateResult,
  GovernancePresetPreviewResult,
  GovernanceConditionValidationResult,
  GovernanceMetadataResult,
  GovernanceConditionClause,
  GovernanceConditionGroup,
} from './governance-types'

export type {
  GovernanceSimulatorFormState,
  GovernanceSimulatorViewProps,
  GovernanceEvaluateRequestPayload,
} from '@/modules/governance/simulator/model/governance-simulator'

export type {
  PresetPreviewModalProps,
  PresetPreviewModalViewProps,
  PresetPreviewViewModel,
} from '@/modules/governance/preset-preview/model/preset-preview-modal'

export interface GovernanceConditionBuilderProps {
  value: GovernanceConditionGroup
  onChange: (value: GovernanceConditionGroup) => void
  disabled?: boolean
}

export interface GovernanceConditionJsonEditorProps {
  orgId?: string
  value: string
  onChange: (value: string) => void
  onValidGroup?: (group: GovernanceConditionGroup) => void
  disabled?: boolean
}
