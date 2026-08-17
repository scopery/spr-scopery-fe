import { RequiredOverride, ScreenModeCode } from '../enums/screen-spec.enum'
import type {
  ModeConfigDraft,
  ReplaceFieldModeConfigsBody,
  ScreenFieldModeConfig,
} from '../model/screen-spec'

export function isModeActive(status: string | null | undefined): boolean {
  return (status ?? 'ACTIVE').toUpperCase() === 'ACTIVE'
}

export function findModeConfig(
  configs: ScreenFieldModeConfig[] | undefined,
  mode: { id: string; modeCode?: string | null }
): ScreenFieldModeConfig | undefined {
  if (!configs?.length) return undefined
  return (
    configs.find((c) => c.modeId && c.modeId === mode.id) ??
    configs.find((c) => c.modeCode && c.modeCode === mode.modeCode)
  )
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

/** Replace-all payload. Always send every mode so BE cannot drop a row and fall back to defaults. */
export function buildModeConfigReplacePayload(
  drafts: ModeConfigDraft[],
  fieldRequired: boolean | null | undefined
): ReplaceFieldModeConfigsBody {
  return { modeConfigs: drafts.map((d) => toInput(d, fieldRequired)) }
}

export function fieldLevelDefaultValue(configs: ScreenFieldModeConfig[] | undefined): string {
  return configs?.find((config) => config.defaultValue)?.defaultValue ?? ''
}

export function inheritRequiredOnDrafts(drafts: ModeConfigDraft[]): ModeConfigDraft[] {
  return drafts.map((draft) => ({ ...draft, required: RequiredOverride.Inherit }))
}

export function applyDefaultValueToDrafts(
  drafts: ModeConfigDraft[],
  modes: Array<{ id: string; modeCode?: string | null }>,
  defaultValue: string | null
): ModeConfigDraft[] {
  const create = modes.find((mode) => String(mode.modeCode) === ScreenModeCode.Create)
  return drafts.map((draft) => {
    if (create) {
      return draft.modeId === create.id ? { ...draft, defaultValue } : draft
    }
    return { ...draft, defaultValue }
  })
}
