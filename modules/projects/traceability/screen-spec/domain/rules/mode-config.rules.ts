import { RequiredOverride } from '../enums/screen-spec.enum'
import type {
  ModeConfigDraft,
  ReplaceFieldModeConfigsBody,
  ScreenFieldModeConfig,
} from '../model/screen-spec'

export function isModeActive(status: string | null | undefined): boolean {
  return (status ?? 'ACTIVE').toUpperCase() === 'ACTIVE'
}

export function draftFromModeConfig(
  modeId: string,
  config: ScreenFieldModeConfig | undefined
): ModeConfigDraft {
  if (!config) {
    return {
      modeId,
      isVisible: true,
      required: RequiredOverride.Inherit,
      isReadonly: false,
      defaultValue: null,
      displayOrder: null,
    }
  }
  return {
    modeId,
    isVisible: config.isVisible,
    required: config.isRequired ? RequiredOverride.Required : RequiredOverride.Optional,
    isReadonly: config.isReadonly,
    defaultValue: config.defaultValue,
    displayOrder: config.displayOrder,
  }
}

export function isOmissibleModeDraft(draft: ModeConfigDraft): boolean {
  return (
    draft.isVisible &&
    draft.required === RequiredOverride.Inherit &&
    !draft.isReadonly &&
    (draft.defaultValue == null || draft.defaultValue === '') &&
    draft.displayOrder == null
  )
}

export function resolveIsRequired(fieldRequired: boolean | null | undefined, override: RequiredOverride): boolean {
  if (override === RequiredOverride.Required) return true
  if (override === RequiredOverride.Optional) return false
  return Boolean(fieldRequired)
}

export function effectiveRequired(
  fieldRequired: boolean | null | undefined,
  draft: ModeConfigDraft
): boolean {
  if (!draft.isVisible) return false
  return resolveIsRequired(fieldRequired, draft.required)
}

function toInput(draft: ModeConfigDraft, fieldRequired: boolean | null | undefined) {
  return {
    modeId: draft.modeId,
    isVisible: draft.isVisible,
    isRequired: resolveIsRequired(fieldRequired, draft.required),
    isReadonly: draft.isReadonly,
    defaultValue: draft.defaultValue || null,
    displayOrder: draft.displayOrder,
  }
}

/** Replace-all payload. Empty is invalid (400) — materialize all modes if every draft is omissible. */
export function buildModeConfigReplacePayload(
  drafts: ModeConfigDraft[],
  fieldRequired: boolean | null | undefined
): ReplaceFieldModeConfigsBody {
  const included = drafts.filter((d) => !isOmissibleModeDraft(d)).map((d) => toInput(d, fieldRequired))
  if (included.length > 0) return { modeConfigs: included }
  return { modeConfigs: drafts.map((d) => toInput(d, fieldRequired)) }
}
