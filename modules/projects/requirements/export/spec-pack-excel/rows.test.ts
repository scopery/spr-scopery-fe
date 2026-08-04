import { describe, expect, it } from 'vitest'
import type { SpecPackPreviewDocument } from '../../model/spec-pack-preview'
import { flattenSpecPackForExcel } from './rows'

function doc(partial: Partial<SpecPackPreviewDocument>): SpecPackPreviewDocument {
  return {
    packId: 'pack-1',
    title: 'Demo',
    note: null,
    projectId: 'proj-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    generatedAt: '2026-01-02T00:00:00.000Z',
    sections: [],
    chapters: [],
    ...partial,
  }
}

describe('flattenSpecPackForExcel', () => {
  it('dedupes functions and keeps many-to-many requirement links', () => {
    const flat = flattenSpecPackForExcel(
      doc({
        sections: [
          {
            group: { id: 'g1', name: 'UI/UX', description: null },
            chapters: [
              {
                requirement: {
                  id: 'r1',
                  code: 'REQ-UX-03',
                  title: 'Req 3',
                  requirementType: 'FUNC',
                  priority: 'HIGH',
                  description: 'd3',
                },
                functions: [
                  {
                    function: {
                      id: 'f7',
                      code: 'FR-007',
                      name: 'Fn 7',
                      description: 'd7',
                      priority: 'HIGH',
                      type: 'FEATURE',
                      acceptanceCriteria: ['AC A'],
                      businessRules: [
                        {
                          code: 'BR-01',
                          title: 'Rule',
                          description: 'desc',
                          severity: 'HIGH',
                        },
                      ],
                    },
                    useCases: [],
                    screens: [],
                    apis: [],
                    components: [],
                    entities: [],
                    communications: [],
                  },
                  {
                    function: {
                      id: 'f9',
                      code: 'FR-009',
                      name: 'Fn 9',
                      description: 'd9',
                      priority: 'MED',
                      type: 'FEATURE',
                      acceptanceCriteria: ['Shared AC'],
                      businessRules: [],
                    },
                    useCases: [
                      {
                        id: 'uc1',
                        key: 'UC-STATUS-01',
                        name: 'Status',
                        goal: 'g',
                        primaryActorName: 'User',
                        triggerText: 't',
                        conditions: [{ type: 'PRECONDITION', content: 'logged in' }],
                        businessRules: [{ code: 'BR-UC-1', description: 'uc rule' }],
                        acceptanceCriteria: [
                          {
                            title: 'Happy',
                            givenText: 'G',
                            whenText: 'W',
                            thenText: 'T',
                          },
                        ],
                        flows: [
                          {
                            flowType: 'MAIN',
                            name: 'Main',
                            conditionText: null,
                            steps: [
                              { stepType: 'USER_ACTION', text: 'Click' },
                              { stepType: 'RESULT', text: 'Done' },
                            ],
                          },
                        ],
                      },
                    ],
                    screens: [],
                    apis: [],
                    components: [],
                    entities: [],
                    communications: [],
                  },
                ],
              },
              {
                requirement: {
                  id: 'r2',
                  code: 'REQ-UX-01',
                  title: 'Req 1',
                  requirementType: 'FUNC',
                  priority: 'LOW',
                  description: 'd1',
                },
                functions: [
                  {
                    function: {
                      id: 'f9',
                      code: 'FR-009',
                      name: 'Fn 9',
                      description: 'd9 again',
                      priority: 'MED',
                      type: 'FEATURE',
                      acceptanceCriteria: ['Should not duplicate'],
                      businessRules: [],
                    },
                    useCases: [
                      {
                        id: 'uc1',
                        key: 'UC-STATUS-01',
                        name: 'Status',
                        goal: 'g',
                        primaryActorName: 'User',
                        triggerText: 't',
                        conditions: [{ type: 'PRECONDITION', content: 'logged in' }],
                        businessRules: [],
                        acceptanceCriteria: [],
                        flows: [],
                      },
                    ],
                    screens: [],
                    apis: [],
                    components: [],
                    entities: [],
                    communications: [],
                  },
                ],
              },
            ],
          },
        ],
      })
    )

    expect(flat.requirements).toHaveLength(2)
    expect(flat.functions.map((f) => f.functionCode).sort()).toEqual(['FR-007', 'FR-009'])
    expect(flat.summary.uniqueFunctionCount).toBe(2)
    expect(flat.reqFnLinks).toHaveLength(3)
    expect(flat.summary.reqFnLinkCount).toBe(3)
    expect(flat.fnAcceptanceCriteria.filter((r) => r.functionCode === 'FR-009')).toHaveLength(1)
    expect(flat.useCases).toHaveLength(1)
    expect(flat.fnUcLinks).toHaveLength(1)
    expect(flat.ucConditions).toHaveLength(1)
    expect(flat.ucFlows).toHaveLength(1)
    expect(flat.ucFlowSteps).toHaveLength(2)
    expect(flat.ucAcceptanceCriteria).toHaveLength(1)
    expect(flat.ucBusinessRules).toHaveLength(1)
    expect(flat.fnBusinessRules).toHaveLength(1)
  })
})
