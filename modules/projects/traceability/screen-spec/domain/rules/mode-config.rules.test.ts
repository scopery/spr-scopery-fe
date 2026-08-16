import { describe, expect, it } from 'vitest'
import { RequiredOverride } from '../enums/screen-spec.enum'
import { buildModeConfigReplacePayload, draftFromModeConfig, effectiveRequired } from './mode-config.rules'
import type { ModeConfigDraft, ScreenFieldModeConfig } from '../model/screen-spec'

describe('mode-config.rules', () => {
  const modes = ['m1', 'm2']

  it('loads missing config as inherit', () => {
    const draft = draftFromModeConfig('m1', undefined)
    expect(draft.required).toBe(RequiredOverride.Inherit)
    expect(draft.isVisible).toBe(true)
  })

  it('sends every mode row on replace so hidden / required overrides are not dropped', () => {
    const drafts: ModeConfigDraft[] = [
      {
        modeId: 'm1',
        isVisible: true,
        required: RequiredOverride.Inherit,
        isReadonly: false,
        defaultValue: null,
        displayOrder: null,
      },
      {
        modeId: 'm2',
        isVisible: false,
        required: RequiredOverride.Optional,
        isReadonly: false,
        defaultValue: null,
        displayOrder: null,
      },
    ]
    const payload = buildModeConfigReplacePayload(drafts, true)
    expect(payload.modeConfigs).toHaveLength(2)
    expect(payload.modeConfigs[1].modeId).toBe('m2')
    expect(payload.modeConfigs[1].isRequired).toBe(false)
    expect(payload.modeConfigs[1].isVisible).toBe(false)
  })

  it('materializes all modes when every draft is omissible so payload is not empty', () => {
    const drafts: ModeConfigDraft[] = modes.map((modeId) => ({
      modeId,
      isVisible: true,
      required: RequiredOverride.Inherit,
      isReadonly: false,
      defaultValue: null,
      displayOrder: null,
    }))
    const payload = buildModeConfigReplacePayload(drafts, true)
    expect(payload.modeConfigs).toHaveLength(2)
    expect(payload.modeConfigs.every((c) => c.isRequired)).toBe(true)
  })

  it('does not treat hidden fields as required', () => {
    const draft: ModeConfigDraft = {
      modeId: 'm1',
      isVisible: false,
      required: RequiredOverride.Required,
      isReadonly: false,
      defaultValue: null,
      displayOrder: null,
    }
    expect(effectiveRequired(true, draft)).toBe(false)
  })

  it('maps existing config rows to explicit required/optional', () => {
    const config: ScreenFieldModeConfig = {
      modeId: 'm1',
      isVisible: true,
      isRequired: true,
      isReadonly: true,
      defaultValue: 'x',
      displayOrder: 2,
    }
    const draft = draftFromModeConfig('m1', config)
    expect(draft.required).toBe(RequiredOverride.Required)
    expect(draft.isReadonly).toBe(true)
  })
})
