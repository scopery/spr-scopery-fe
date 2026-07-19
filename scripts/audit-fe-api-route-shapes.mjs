#!/usr/bin/env node
/**
 * Compare FE apiPath resource prefixes vs known-dead patterns.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SKIP = new Set(['node_modules', '.next', 'coverage', 'dist', '.git', 'scripts'])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(p)
  }
  return out
}

const deadPrefixes = ['/orgs/', '/profile', '/org-invites/']
const files = walk(ROOT)
const byPrefix = new Map()
const deadHits = []

const callRe = /apiPath\(\s*(?:`([^`]+)`|'([^']+)'|"([^"]+)")/g

for (const file of files) {
  const rel = relative(ROOT, file)
  const text = readFileSync(file, 'utf8')
  let m
  while ((m = callRe.exec(text))) {
    const raw = m[1] || m[2] || m[3]
    // normalize template: take first segment before ${
    const path = raw.split('${')[0].split('?')[0]
    const prefix = '/' + (path.replace(/^\//, '').split('/')[0] || '')
    byPrefix.set(prefix, (byPrefix.get(prefix) || 0) + 1)
    for (const dead of deadPrefixes) {
      if (raw.includes(dead.replace(/\/$/, '')) || raw.startsWith(dead) || raw.includes('/orgs/')) {
        if (raw.includes('/orgs/') || raw === '/profile' || raw.startsWith('/profile/') || raw.includes('/org-invites')) {
          deadHits.push(`${rel}: apiPath(\`${raw.slice(0, 80)}\`)`)
          break
        }
      }
    }
  }
}

const sorted = [...byPrefix.entries()].sort((a, b) => b[1] - a[1])
console.log('FE apiPath prefix counts:')
for (const [k, v] of sorted) console.log(`  ${String(v).padStart(4)}  ${k}/...`)

const uniqueDead = [...new Set(deadHits)]
console.log(`\nLikely-dead path shapes (orgs/profile/org-invites): ${uniqueDead.length}`)
for (const h of uniqueDead.slice(0, 40)) console.log(' ', h)
if (uniqueDead.length > 40) console.log(`  ... +${uniqueDead.length - 40} more`)

writeFileSync(
  '/tmp/fe-dead-orgs-paths.txt',
  uniqueDead.join('\n') + '\n'
)
