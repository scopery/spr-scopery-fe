import { describe, expect, it } from 'vitest'
import type { ScreenFullSpec, ScreenSpecDocFullSpec } from '../model/screen-spec-doc'
import {
  MODE_VISIBLE_MARK,
  buildScreenSpecWorkbookModel,
  wrapSingleScreenAsDocument,
} from './screen-spec-excel.rules'

function screen(partial: Partial<ScreenFullSpec> & Pick<ScreenFullSpec, 'id' | 'code' | 'name'>): ScreenFullSpec {
  return {
    routePath: null,
    status: 'ACTIVE',
    modes: [],
    sections: [],
    fields: [],
    processItems: [],
    eventItems: [],
    ...partial,
  }
}

describe('screen-spec-excel.rules', () => {
  const login = screen({
    id: 's1',
    code: 'LOGIN',
    name: 'Login',
    modes: [
      { id: 'm1', screenId: 's1', modeCode: 'CREATE', name: 'Create', displayOrder: 0, status: 'ACTIVE' },
      { id: 'm2', screenId: 's1', modeCode: 'VIEW', name: 'View', displayOrder: 1, status: 'ACTIVE' },
    ],
    sections: [{ id: 'sec1', name: 'Main', description: null, displayOrder: 0 }],
    fields: [
      {
        id: 'f1',
        sectionId: 'sec1',
        fieldKey: 'email',
        label: 'Email',
        fieldType: 'INPUT',
        description: null,
        required: true,
        displayOrder: 1,
        maxLength: 255,
        remark: null,
        componentId: null,
        dataEntityFieldId: 'df1',
        componentFieldId: null,
        component: {
          id: 'c1',
          applicationId: 'a1',
          code: 'TXT',
          name: 'Email',
          description: null,
          componentType: 'INPUT',
          optionSourceType: 'NONE',
          sourceEntityId: null,
          sourceValueColumn: null,
          sourceLabelColumn: null,
          sourceFilterJson: null,
          options: null,
        },
        dataField: {
          id: 'df1',
          dataEntityId: 'e1',
          columnName: 'email',
          dataType: 'VARCHAR',
          maxLength: 255,
          isNullable: false,
          isUnique: true,
          remark: null,
          displayOrder: 1,
          tableName: 'users',
          entityName: 'User',
        },
        modeConfigs: [
          {
            modeId: 'm1',
            modeCode: 'CREATE',
            isVisible: true,
            isRequired: true,
            isReadonly: false,
            defaultValue: null,
            displayOrder: null,
          },
          {
            modeId: 'm2',
            modeCode: 'VIEW',
            isVisible: false,
            isRequired: false,
            isReadonly: true,
            defaultValue: null,
            displayOrder: null,
          },
        ],
        validations: [
          {
            id: 'v1',
            modeId: null,
            ruleTypeCode: 'MAX_LENGTH',
            ruleParamJson: { maxLength: 255 },
            conditionJson: null,
            errorMessage: 'too long',
            remark: null,
            displayOrder: 1,
          },
          {
            id: 'v2',
            modeId: null,
            ruleTypeCode: 'EMAIL',
            ruleParamJson: {},
            conditionJson: null,
            errorMessage: 'invalid email',
            remark: null,
            displayOrder: 2,
          },
        ],
      },
    ],
    processItems: [
      {
        id: 'p1',
        modeId: null,
        title: '1. Init',
        content: 'Load options',
        sourceTable: 'users',
        conditionNote: 'active = true',
        targetFieldId: null,
        displayOrder: 1,
      },
    ],
  })

  it('wraps a single screen as a one-screen document', () => {
    const doc = wrapSingleScreenAsDocument(login)
    expect(doc.screens).toHaveLength(1)
    expect(doc.documentCode).toBe('LOGIN')
    const model = buildScreenSpecWorkbookModel(doc)
    expect(model.header.grouped).toBe(false)
    expect(model.header.screenIdText).toBe('LOGIN')
  })

  it('groups multiple screens and marks mode visibility', () => {
    const profile = screen({ id: 's2', code: 'PROFILE', name: 'Profile' })
    const doc: ScreenSpecDocFullSpec = {
      id: 'd1',
      documentCode: 'SPEC-001',
      documentName: 'Auth pack',
      projectName: 'Startupper',
      systemName: 'Web',
      phaseName: 'P1',
      language: 'EN',
      overview: null,
      figmaUrl: null,
      status: 'ACTIVE',
      revisions: [],
      screens: [
        { displayOrder: 1, note: null, screen: login },
        { displayOrder: 2, note: 'dialog', screen: profile },
      ],
    }
    const model = buildScreenSpecWorkbookModel(doc)
    expect(model.header.grouped).toBe(true)
    expect(model.layoutScreens.map((r) => r.code)).toEqual(['LOGIN', 'PROFILE'])
    const email = model.defineRows.find((r) => r.physicalName === 'email')
    expect(email?.type).toBe('Textbox')
    expect(email?.required).toBe(MODE_VISIBLE_MARK)
    expect(email?.modeMarks.CREATE).toBe(MODE_VISIBLE_MARK)
    expect(email?.modeMarks.VIEW).toBe('')
    expect(email?.table).toBe('users')
    expect(model.defineRows.some((r) => r.kind === 'screen' && r.screenCode === 'LOGIN')).toBe(true)
  })

  it('keeps required/max length off the Validation sheet and outlines processes', () => {
    const model = buildScreenSpecWorkbookModel(wrapSingleScreenAsDocument(login))
    expect(model.validationRows.map((r) => r.ruleType)).toEqual(['EMAIL'])
    expect(model.processRows.map((r) => r.kind)).toEqual(['heading', 'detail', 'detail', 'detail'])
    expect(model.processRows[0].label).toBe('1. Init')
    expect(model.databaseTables).toEqual(['users'])
  })
})
