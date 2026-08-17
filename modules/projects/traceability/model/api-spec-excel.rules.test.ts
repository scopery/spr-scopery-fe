import { describe, expect, it } from 'vitest'
import type { RegistryApiEndpoint } from './application-registry'
import {
  buildApiSpecExcelModel,
  prettyJson,
  suggestApiSpecExcelFilename,
  tryFormatJson,
} from './api-spec-excel.rules'

function endpoint(partial: Partial<RegistryApiEndpoint> & Pick<RegistryApiEndpoint, 'id'>): RegistryApiEndpoint {
  return {
    applicationId: 'app1',
    method: 'GET',
    pathPattern: '/users',
    name: 'List users',
    description: 'Paginated list',
    requestParams: null,
    responseSchemaJson: null,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    ...partial,
  }
}

describe('api-spec-excel.rules', () => {
  it('formats valid JSON and keeps invalid text', () => {
    expect(tryFormatJson('{"a":1}')).toEqual({ ok: true, value: '{\n  "a": 1\n}' })
    expect(tryFormatJson('{nope}').ok).toBe(false)
    expect(prettyJson('{"a":1}')).toBe('{\n  "a": 1\n}')
    expect(prettyJson('{nope}')).toBe('{nope}')
  })

  it('emits one row when an API has no params', () => {
    const model = buildApiSpecExcelModel([endpoint({ id: 'e1' })])
    expect(model.rows).toHaveLength(1)
    expect(model.merges).toEqual([])
    expect(model.rows[0].paramName).toBe('')
  })

  it('emits one row per param and merges API-level cells', () => {
    const model = buildApiSpecExcelModel([
      endpoint({
        id: 'e1',
        requestParams: [
          { name: 'page', in: 'QUERY', type: 'integer', required: false, description: 'Page', example: '0' },
          { name: 'size', in: 'QUERY', type: 'integer', required: true, description: null, example: null },
        ],
        responseSchemaJson: '{"items":[]}',
      }),
    ])
    expect(model.rows).toHaveLength(2)
    expect(model.merges).toEqual([{ start: 0, end: 1 }])
    expect(model.rows.map((r) => r.paramName)).toEqual(['page', 'size'])
    expect(model.rows[0].paramRequired).toBe('No')
    expect(model.rows[1].paramRequired).toBe('Yes')
    expect(model.rows[0].responseSchema).toBe('{\n  "items": []\n}')
    expect(model.rows[1].method).toBe('GET')
  })

  it('suggests a client-side filename from the app name', () => {
    expect(suggestApiSpecExcelFilename('Job Board')).toBe('【Job Board】APIs.xlsx')
  })
})
