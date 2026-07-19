/**
 * Audit: list APIs typed as `{ items }` must normalize BE array payloads.
 *
 * Fails when a function returning Promise<{ items: ... }> does a bare
 * `return apiClient.get(...)` without normalizeItemList / normalizeList.
 *
 * Usage: node scripts/audit-list-response-normalize.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const modulesRoot = path.join(root, 'modules')

const SKIP_DIR = new Set(['node_modules', '.next', 'dist'])

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIR.has(name)) continue
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (/\.api\.ts$/.test(name) || name === 'knowledge.ts') out.push(full)
  }
  return out
}

const files = walk(modulesRoot)
const offenders = []

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  // Split roughly by export async function
  const parts = src.split(/(?=export async function\s+\w+)/g)
  for (const part of parts) {
    const sig = part.match(
      /export async function\s+(\w+)\s*\([^)]*\)\s*:\s*Promise<\s*\{\s*items\s*:/
    )
    if (!sig) continue
    const name = sig[1]
    const body = part.slice(0, 1200)
    const hasNormalize =
      /normalizeItemList\s*\(/.test(body) ||
      /normalizeList\s*\(/.test(body) ||
      /asItemList\s*\(/.test(body) ||
      /asList\s*\(/.test(body)
    const bareReturn =
      /return\s+apiClient\.get\s*[<(]/.test(body) ||
      /return\s+portalApiClient\.get\s*[<(]/.test(body)
    if (bareReturn && !hasNormalize) {
      offenders.push({
        file: path.relative(root, file),
        fn: name,
      })
    }
  }
}

if (offenders.length === 0) {
  console.log(`OK — scanned ${files.length} API files; no bare { items } list GETs found.`)
  process.exit(0)
}

console.error(`FAIL — ${offenders.length} list API(s) return { items } without normalize:\n`)
for (const o of offenders) {
  console.error(`  - ${o.file} :: ${o.fn}`)
}
console.error(`\nUse normalizeItemList() from @/shared/lib/normalizeListResponse`)
process.exit(1)
