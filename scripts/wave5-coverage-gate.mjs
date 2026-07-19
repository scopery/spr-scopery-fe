#!/usr/bin/env node
/**
 * Wave 5 coverage / security gate (§43).
 *
 * Default mode (`implementation`):
 *   - Register has exactly 102 endpoints
 *   - No UNMAPPED rows
 *   - Required register fields present
 *   - Browser endpoints source must not export service-only execution-log transitions
 *   - AI Agent paths must stay under /api/ai-agent (not /api/v1/ai-agent)
 *
 * Strict mode (`--strict-done`):
 *   - User-facing → UI_TESTED
 *   - SSE → UI_STREAM_TESTED
 *   - Service-orchestrated → SERVICE_ORCHESTRATED_TESTED
 *   Use only when E2E/worker evidence is recorded in the register.
 *
 * Usage:
 *   node scripts/wave5-coverage-gate.mjs
 *   node scripts/wave5-coverage-gate.mjs --strict-done
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const REGISTER = join(
  ROOT,
  'docs/phase-tracking/wave-05/SCOPERY_WAVE5_API_COVERAGE_REGISTER.csv'
)
const ENDPOINTS = join(
  ROOT,
  'modules/ai-agent-admin/infrastructure/api/endpoints.ts'
)
const ASSISTANT_ENDPOINTS = join(
  ROOT,
  'modules/ai-assistant/infrastructure/api/endpoints.ts'
)

const STRICT = process.argv.includes('--strict-done')
const EXPECTED_COUNT = 102

function parseCsv(text) {
  const rows = []
  let i = 0
  let field = ''
  let row = []
  let inQuotes = false
  while (i < text.length) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      field += c
      i += 1
      continue
    }
    if (c === '"') {
      inQuotes = true
      i += 1
      continue
    }
    if (c === ',') {
      row.push(field)
      field = ''
      i += 1
      continue
    }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1
      row.push(field)
      if (row.some((cell) => cell.length > 0)) rows.push(row)
      row = []
      field = ''
      i += 1
      continue
    }
    field += c
    i += 1
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function fail(msg) {
  console.error(`Wave 5 coverage gate FAILED:\n  - ${msg}`)
  process.exit(1)
}

const csvText = readFileSync(REGISTER, 'utf8')
const table = parseCsv(csvText)
if (table.length < 2) fail('Coverage register is empty')

const header = table[0]
const col = (name) => {
  const idx = header.indexOf(name)
  if (idx < 0) fail(`Missing column ${name}`)
  return idx
}

const iStatus = col('InitialStatus')
const iMethod = col('Method')
const iPath = col('Path')
const iClass = col('IntegrationClass')
const iPerm = col('Permission')
const iPage = col('Page')
const iEvidence = col('TestEvidence')
const iRequired = col('RequiredBeforeDone')

const data = table.slice(1)
if (data.length !== EXPECTED_COUNT) {
  fail(`Expected ${EXPECTED_COUNT} endpoints, found ${data.length}`)
}

const errors = []
const warnings = []

let unmapped = 0
let userFacingUntested = 0
let streamUntested = 0
let serviceUntested = 0

for (const row of data) {
  const status = (row[iStatus] || '').trim()
  const integration = (row[iClass] || '').trim()
  const method = row[iMethod]
  const path = row[iPath]
  const label = `${method} ${path}`

  if (!row[iPerm]?.trim()) errors.push(`${label}: empty Permission`)
  if (!row[iPage]?.trim()) errors.push(`${label}: empty Page`)
  if (!row[iEvidence]?.trim()) errors.push(`${label}: empty TestEvidence`)
  if ((row[iRequired] || '').trim() === 'YES' && !row[iEvidence]?.trim()) {
    errors.push(`${label}: RequiredBeforeDone=YES without TestEvidence id`)
  }

  if (status === 'UNMAPPED' || status.startsWith('UNMAPPED')) {
    unmapped += 1
    errors.push(`${label}: UNMAPPED`)
  }

  const isService =
    integration === 'SERVICE_ORCHESTRATED' || status.includes('SERVICE_ORCHESTRATED')
  const isStream = integration === 'UI_STREAM' || path.includes('/stream')

  if (isService) {
    if (!/SERVICE_ORCHESTRATED_TESTED/.test(status)) {
      serviceUntested += 1
      if (STRICT) errors.push(`${label}: service endpoint not SERVICE_ORCHESTRATED_TESTED (${status})`)
      else warnings.push(`${label}: pending SERVICE_ORCHESTRATED_TESTED`)
    }
  } else if (isStream) {
    if (status !== 'UI_STREAM_TESTED') {
      streamUntested += 1
      if (STRICT) errors.push(`${label}: SSE not UI_STREAM_TESTED (${status})`)
      else warnings.push(`${label}: pending UI_STREAM_TESTED`)
    }
  } else if (status !== 'UI_TESTED') {
    userFacingUntested += 1
    if (STRICT) errors.push(`${label}: user-facing not UI_TESTED (${status})`)
    else warnings.push(`${label}: pending UI_TESTED`)
  }
}

const endpointsSrc = readFileSync(ENDPOINTS, 'utf8')
const agentPathCalls = [...endpointsSrc.matchAll(/apiPath\(\s*([`'"])([^`'"]+)\1/g)].map(
  (m) => m[2]
)
if (agentPathCalls.some((p) => p.startsWith('/v1/ai-agent') || p.includes('/v1/ai-agent/'))) {
  errors.push('AI Agent endpoints must not use /v1/ai-agent prefix in apiPath()')
}
if (agentPathCalls.some((p) => !p.startsWith('/ai-agent') && p.includes('ai-agent'))) {
  errors.push('Unexpected ai-agent path shape in AI_AGENT_ADMIN_ENDPOINTS')
}
for (const frag of [
  'execution-logs/${id}/running',
  'execution-logs/${id}/succeeded',
  'execution-logs/${id}/failed',
  'execution-logs/${id}/cancel',
]) {
  if (endpointsSrc.includes(frag)) {
    errors.push(`Browser endpoints export service-only path fragment: ${frag}`)
  }
}
// POST create log must not be a dedicated mutation helper beyond GET list/detail
if (/createExecutionLog|postExecutionLog|executionLogsCreate/.test(endpointsSrc)) {
  errors.push('Browser endpoints appear to export execution-log create mutation')
}

const assistantSrc = readFileSync(ASSISTANT_ENDPOINTS, 'utf8')
if (!assistantSrc.includes('/ai-assistant')) {
  errors.push('AI Assistant endpoints missing /ai-assistant paths')
}

console.log('Wave 5 coverage gate')
console.log(`  mode: ${STRICT ? 'strict-done' : 'implementation'}`)
console.log(`  register rows: ${data.length}`)
console.log(`  unmapped: ${unmapped}`)
console.log(`  user-facing pending UI_TESTED: ${userFacingUntested}`)
console.log(`  stream pending UI_STREAM_TESTED: ${streamUntested}`)
console.log(`  service pending SERVICE_ORCHESTRATED_TESTED: ${serviceUntested}`)

if (warnings.length && !STRICT) {
  console.log(`  warnings: ${warnings.length} (use --strict-done after E2E evidence)`)
}

if (errors.length) {
  console.error('Failures:\n' + errors.map((e) => `  - ${e}`).join('\n'))
  process.exit(1)
}

if (STRICT) {
  console.log('Wave5Done gate OK — all tested statuses satisfied')
} else {
  console.log(
    'Implementation gate OK — FE mapping + security locks pass; Wave5Done still requires E2E (--strict-done)'
  )
}
