import fs from 'fs'
import path from 'path'

const root = path.resolve(import.meta.dirname, '..')

const globalReplacements = [
  ['@/types/governance/governance-simulator', '@/modules/governance/model/governance-simulator'],
  ['@/types/governance/preset-preview-modal', '@/modules/governance/model/preset-preview-modal'],
  ['@/types/document-template', '@/modules/documents/model/document-template-types'],
  ['@/types/document-deliverable', '@/modules/documents/model/document-deliverable-types'],
  ['@/types/document-link', '@/modules/documents/model/document-link-types'],
  ['@/types/project-section', '@/modules/documents/model/project-section-types'],
  ['@/types/ai-agent-control', '@/modules/admin/model/ai-agent-control'],
  ['@/types/ai-prompt-playground', '@/modules/admin/model/ai-prompt-playground'],
  ['@/types/ai-run-feedback', '@/modules/admin/model/ai-run-feedback'],
  ['@/types/agent-control', '@/modules/ai-agent-control/model/agent-control-types'],
  ['@/types/controlled-lists', '@/modules/controlled-lists/model/controlled-lists-types'],
  ['@/types/api-enums', '@/shared/lib/api-enums'],
  ['@/types/collaboration', '@/modules/collaboration/model/collaboration-types'],
  ['@/types/traceability', '@/modules/projects/model/traceability'],
  ['@/types/permissions', '@/modules/permissions/model/permissions-types'],
  ['@/types/aiClarity', '@/modules/sessions/model/clarity'],
  ['@/types/governance', '@/modules/governance/model/governance-types'],
  ['@/types/ai-routing', '@/modules/admin/model/ai-routing'],
  ['@/types/ai-budget', '@/modules/admin/model/ai-budget'],
  ['@/types/document', '@/modules/documents/model/document'],
  ['@/types/project', '@/modules/projects/model/project-types'],
  ['@/types/auth', '@/modules/auth/model/auth-types'],
  ['@/types/api', '@/shared/lib/api-types'],
  ['@/types/ai', '@/modules/admin/model/ai'],
]

const appPublicReplacements = [
  ['@/modules/documents/model/document-template-types', '@/modules/documents'],
  ['@/modules/documents/model/document-deliverable-types', '@/modules/documents'],
  ['@/modules/documents/model/document-link-types', '@/modules/documents'],
  ['@/modules/documents/model/project-section-types', '@/modules/documents'],
  ['@/modules/documents/model/document', '@/modules/documents'],
  ['@/modules/collaboration/model/collaboration-types', '@/modules/collaboration'],
  ['@/modules/governance/model/governance-types', '@/modules/governance'],
  ['@/modules/governance/model/governance-simulator', '@/modules/governance'],
  ['@/modules/governance/model/preset-preview-modal', '@/modules/governance'],
  ['@/modules/controlled-lists/model/controlled-lists-types', '@/modules/controlled-lists'],
  ['@/modules/projects/model/traceability', '@/modules/projects'],
  ['@/modules/projects/model/project-types', '@/modules/projects'],
  ['@/modules/sessions/model/clarity', '@/modules/sessions'],
  ['@/modules/auth/model/auth-types', '@/modules/auth'],
  ['@/modules/permissions/model/permissions-types', '@/modules/permissions'],
  ['@/modules/admin/model/ai-agent-control', '@/modules/admin'],
  ['@/modules/admin/model/ai-prompt-playground', '@/modules/admin'],
  ['@/modules/admin/model/ai-run-feedback', '@/modules/admin'],
  ['@/modules/admin/model/ai-routing', '@/modules/admin'],
  ['@/modules/admin/model/ai-budget', '@/modules/admin'],
  ['@/modules/admin/model/ai', '@/modules/admin'],
  ['@/modules/ai-agent-control/model/agent-control-types', '@/modules/ai-agent-control'],
]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'types') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(ts|tsx|mjs)$/.test(entry.name) && !full.includes('migrate-types-imports'))
      files.push(full)
  }
  return files
}

function applyReplacements(content, replacements) {
  let out = content
  for (const [from, to] of replacements) {
    out = out.split(from).join(to)
  }
  return out
}

for (const file of walk(root)) {
  const rel = path.relative(root, file)
  let content = fs.readFileSync(file, 'utf8')
  const original = content
  content = applyReplacements(content, globalReplacements)
  if (rel.startsWith('app/')) {
    content = applyReplacements(content, appPublicReplacements)
  }
  if (content !== original) fs.writeFileSync(file, content)
}

console.log('Done migrating type imports')
