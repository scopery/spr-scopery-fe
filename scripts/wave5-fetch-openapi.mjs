#!/usr/bin/env node
/**
 * Fetch Wave 5 OpenAPI snapshot and record sha256 into WAVE5_CONTRACT_LOCK.md notes.
 *
 * Usage:
 *   node scripts/wave5-fetch-openapi.mjs
 *   OPENAPI_URL=http://localhost:8080/v3/api-docs node scripts/wave5-fetch-openapi.mjs
 *
 * Exits 1 if BE unreachable (does not invent a fake snapshot).
 */
import { createHash } from 'node:crypto'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const ROOT = process.cwd()
const OUT = join(ROOT, 'docs/phase-tracking/wave-05/openapi-wave5-snapshot.json')
const URL = process.env.OPENAPI_URL || 'http://localhost:8080/v3/api-docs'

async function main() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  let res
  try {
    res = await fetch(URL, { signal: controller.signal })
  } catch (err) {
    clearTimeout(timer)
    console.error(
      `OpenAPI fetch failed (${URL}): ${err instanceof Error ? err.message : String(err)}`
    )
    console.error('Start the BE, then re-run. Snapshot will not be faked.')
    process.exit(1)
  }
  clearTimeout(timer)

  if (!res.ok) {
    console.error(`OpenAPI fetch HTTP ${res.status} from ${URL}`)
    process.exit(1)
  }

  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    console.error('OpenAPI response is not valid JSON')
    process.exit(1)
  }

  mkdirSync(dirname(OUT), { recursive: true })
  const pretty = `${JSON.stringify(json, null, 2)}\n`
  writeFileSync(OUT, pretty, 'utf8')
  const sha256 = createHash('sha256').update(pretty).digest('hex')

  console.log(`Wrote ${OUT}`)
  console.log(`sha256: ${sha256}`)
  console.log('Paste hash into docs/phase-tracking/wave-05/WAVE5_CONTRACT_LOCK.md')
}

main()
