import { describe, expect, it } from 'vitest'
import type { ScreenFullSpec, ScreenSpecDocFullSpec } from '../model/screen-spec-doc'
import {
  MODE_VISIBLE_MARK,
  buildScreenSpecWorkbookModel,
  collectDefineModeCodes,
  fieldDefaultValue,
  suggestScreenSpecExcelFilename,
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
        sourceTable: 'USER_MASTER',
        conditionNote: 'active = true',
        targetFieldId: null,
        displayOrder: 1,
      },
    ],
  })

  it('keeps Search and Dialog columns only when those modes exist', () => {
    expect(collectDefineModeCodes([login])).toEqual(['CREATE', 'VIEW', 'EDIT'])
    const withSearch = screen({
      id: 's-search',
      code: 'JOBS',
      name: 'Jobs',
      modes: [
        { id: 'm1', screenId: 's-search', modeCode: 'CREATE', name: 'Create', displayOrder: 0, status: 'ACTIVE' },
        { id: 'm2', screenId: 's-search', modeCode: 'SEARCH', name: 'Search', displayOrder: 1, status: 'ACTIVE' },
      ],
    })
    expect(collectDefineModeCodes([withSearch])).toEqual(['CREATE', 'VIEW', 'EDIT', 'SEARCH'])
    const withDialog = screen({
      id: 's-dialog',
      code: 'PICKER',
      name: 'Picker',
      modes: [
        { id: 'm1', screenId: 's-dialog', modeCode: 'VIEW', name: 'View', displayOrder: 0, status: 'ACTIVE' },
        { id: 'm2', screenId: 's-dialog', modeCode: 'DIALOG', name: 'Dialog', displayOrder: 1, status: 'ACTIVE' },
      ],
    })
    expect(collectDefineModeCodes([withDialog])).toEqual(['CREATE', 'VIEW', 'EDIT', 'DIALOG'])
    expect(collectDefineModeCodes([withSearch, withDialog])).toEqual([
      'CREATE',
      'VIEW',
      'EDIT',
      'SEARCH',
      'DIALOG',
    ])
  })

  it('names the workbook file with the application', () => {
    const doc = wrapSingleScreenAsDocument(login, { applicationName: 'Job Board' })
    expect(suggestScreenSpecExcelFilename(doc)).toBe('【Job Board】Login.xlsx')
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
    expect(email?.field).toBe('Email')
    expect(email?.type).toBe('Textbox')
    expect(email?.required).toBe(MODE_VISIBLE_MARK)
    expect(email?.length).toBe('255')
    expect(email?.modeMarks.CREATE).toBe(MODE_VISIBLE_MARK)
    expect(email?.modeMarks.VIEW).toBe('')
    expect(email?.table).toBe('users')
    expect(model.defineRows.some((r) => r.kind === 'screen' && r.screenCode === 'LOGIN')).toBe(true)
  })

  it('maps Event sheet rows to system fields', () => {
    const withEvent = screen({
      ...login,
      eventItems: [
        {
          id: 'e1',
          modeId: null,
          triggerFieldId: 'f1',
          triggerActionCode: 'CLICK',
          title: 'Submit click',
          content: 'Validate → POST → navigate',
          conditionNote: 'form valid',
          targetScreenId: 's2',
          targetModeCode: 'VIEW',
          displayOrder: 0,
        },
      ],
    })
    const profile = screen({ id: 's2', code: 'PROFILE', name: 'Profile' })
    const model = buildScreenSpecWorkbookModel({
      ...wrapSingleScreenAsDocument(withEvent),
      screens: [
        { displayOrder: 1, note: null, screen: withEvent },
        { displayOrder: 2, note: null, screen: profile },
      ],
    })
    const eventBlock = model.eventRows.filter((r) => r.kind !== 'screen')
    expect(eventBlock.map((r) => r.label)).toEqual([
      'Submit click',
      'Title',
      'Content',
      'Trigger',
      'Trigger field',
      'Condition',
      'Navigate to',
    ])
    expect(eventBlock.filter((r) => r.kind === 'detail').map((r) => r.detail)).toEqual([
      'Submit click',
      'Validate → POST → navigate',
      'CLICK',
      'email · Email',
      'form valid',
      'PROFILE · Profile',
    ])
  })

  it('keeps required/max length off the Validation sheet and outlines processes', () => {
    const model = buildScreenSpecWorkbookModel(wrapSingleScreenAsDocument(login))
    expect(model.validationRows.map((r) => r.ruleType)).toEqual(['EMAIL'])
    expect(model.processRows.map((r) => r.kind)).toEqual([
      'heading',
      'detail',
      'detail',
      'detail',
      'detail',
      'detail',
    ])
    expect(model.processRows.map((r) => r.label)).toEqual([
      '1. Init',
      'Title',
      'Content',
      'Source table',
      'Condition',
      'Field',
    ])
    expect(model.processRows.filter((r) => r.kind === 'detail').map((r) => r.detail)).toEqual([
      '1. Init',
      'Load options',
      'USER_MASTER',
      'active = true',
      '',
    ])
    expect(model.databaseRows.map((r) => r.name)).toEqual(['users'])
    expect(model.databaseRows[0].attributes).toBe('email')
  })

  it('does not invent Database rows from process Source or entity name', () => {
    const unbound = screen({
      id: 's3',
      code: 'SEARCH',
      name: 'Search',
      fields: [
        {
          id: 'f2',
          sectionId: null,
          fieldKey: 'q',
          label: 'Query',
          fieldType: 'INPUT',
          description: null,
          required: false,
          displayOrder: 1,
          maxLength: null,
          remark: null,
          componentId: null,
          dataEntityFieldId: null,
          componentFieldId: null,
          component: null,
          dataField: {
            id: 'df2',
            dataEntityId: 'e2',
            columnName: 'q',
            dataType: 'VARCHAR',
            maxLength: 64,
            isNullable: true,
            isUnique: false,
            remark: null,
            displayOrder: 1,
            tableName: null,
            entityName: 'SearchQuery',
          },
          modeConfigs: [],
          validations: [],
        },
      ],
      processItems: [
        {
          id: 'p2',
          modeId: null,
          title: 'Load',
          content: 'Search',
          sourceTable: 'USER_MASTER',
          conditionNote: null,
          targetFieldId: null,
          displayOrder: 1,
        },
      ],
    })
    const model = buildScreenSpecWorkbookModel(wrapSingleScreenAsDocument(unbound))
    expect(model.databaseRows).toEqual([])
    expect(model.processRows.find((r) => r.label === 'Source table')?.detail).toBe('USER_MASTER')
    expect(model.defineRows.find((r) => r.physicalName === 'q')?.length).toBe('64')
  })

  it('maps header audit from revisions and required from any mode', () => {
    const searchOnly = screen({
      id: 's4',
      code: 'JOBS',
      name: 'Jobs',
      modes: [{ id: 'm9', screenId: 's4', modeCode: 'SEARCH', name: 'Search', displayOrder: 0, status: 'ACTIVE' }],
      fields: [
        {
          id: 'f3',
          sectionId: null,
          fieldKey: 'keyword',
          label: 'Keyword',
          fieldType: 'INPUT',
          description: null,
          required: false,
          displayOrder: 1,
          maxLength: null,
          remark: null,
          componentId: null,
          dataEntityFieldId: null,
          componentFieldId: null,
          component: null,
          dataField: null,
          modeConfigs: [
            {
              modeId: 'm9',
              modeCode: 'SEARCH',
              isVisible: true,
              isRequired: true,
              isReadonly: false,
              defaultValue: null,
              displayOrder: null,
            },
          ],
          validations: [
            {
              id: 'v3',
              modeId: null,
              ruleTypeCode: 'MAX_LENGTH',
              ruleParamJson: { maxLength: 80 },
              conditionJson: null,
              errorMessage: null,
              remark: null,
              displayOrder: 1,
            },
          ],
        },
      ],
    })
    const doc: ScreenSpecDocFullSpec = {
      id: 'd2',
      documentCode: 'SPEC-002',
      documentName: 'Jobs',
      projectName: 'Startupper',
      systemName: 'Web',
      phaseName: 'P1',
      language: 'EN',
      overview: null,
      figmaUrl: null,
      status: 'ACTIVE',
      revisions: [
        {
          id: 'r1',
          revisionNo: '1.0',
          targetSheetName: 'Defines',
          details: 'Init',
          personInCharge: 'Nhi',
          color: null,
          changedAt: '2026-08-01T10:00:00Z',
          displayOrder: 1,
        },
        {
          id: 'r2',
          revisionNo: '1.1',
          targetSheetName: 'Defines',
          details: 'Update',
          personInCharge: 'Yen',
          color: null,
          changedAt: '2026-08-14',
          displayOrder: 2,
        },
      ],
      screens: [{ displayOrder: 1, note: null, screen: searchOnly }],
    }
    const model = buildScreenSpecWorkbookModel(doc)
    expect(model.header.author).toBe('Nhi')
    expect(model.header.createdDate).toBe('2026-08-01')
    expect(model.header.version).toBe('1.1')
    expect(model.header.updatedBy).toBe('Yen')
    expect(model.header.updatedDate).toBe('2026-08-14')
    const keyword = model.defineRows.find((r) => r.physicalName === 'keyword')
    expect(keyword?.required).toBe(MODE_VISIBLE_MARK)
    expect(keyword?.length).toBe('80')
  })

  it('uses the first mode default that has a value', () => {
    expect(
      fieldDefaultValue({
        modeConfigs: [
          { modeCode: 'CREATE', defaultValue: null },
          { modeCode: 'VIEW', defaultValue: 'shown' },
        ],
      } as ScreenFullSpec['fields'][number])
    ).toBe('shown')
  })
})
