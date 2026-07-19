#!/usr/bin/env node
/**
 * Guard: apiPath must stay single-arg; no hardcoded /api/v2; no local v1/v2 helpers.
 * Preferred: apiPath('/resource/...') → `${origin}/api/resource/...`
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SKIP_DIRS = new Set(['node_modules', '.next', 'coverage', 'dist', '.git', 'scripts', 'docs'])

const BAD = [
  { re: /\/api\/v2\b/, label: 'hardcoded /api/v2' },
  { re: /const\s+v[12]\s*=\s*\(/, label: 'local v1/v2 helper (use apiPath)' },
  { re: /apiPath\([^)]*,\s*['"]v[12]['"]/, label: 'apiPath still takes a version arg' },
  { re: /\bapiRootPath\b/, label: 'deprecated apiRootPath (use apiPath)' },
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx|js|mjs)$/.test(name)) out.push(p)
  }
  return out
}

const hits = []
const files = walk(ROOT)
for (const file of files) {
  const rel = relative(ROOT, file)
  if (rel === 'shared/lib/api-paths.ts') continue
  const text = readFileSync(file, 'utf8')
  for (const { re, label } of BAD) {
    if (re.test(text)) hits.push(`${rel}: ${label}`)
  }
}

if (hits.length) {
  console.error('API path audit failed:\n' + hits.map((h) => `  - ${h}`).join('\n'))
  process.exit(1)
}

console.log(`API path audit OK (${files.length} files) — base=${'/api'} via apiPath()`)
