#!/usr/bin/env node
/**
 * Split constants/endpoints.ts into module-local api/endpoints.ts files.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const endpointsPath = path.join(root, 'constants/endpoints.ts')
const source = fs.readFileSync(endpointsPath, 'utf8')

const blockRe = /export const (\w+) = \{[\s\S]*?\n\} as const/g
const blocks = [...source.matchAll(blockRe)]

const mapping = {
  AUTH_ENDPOINTS: 'modules/auth/auth/api/endpoints.ts',
  PROFILE_ENDPOINTS: 'modules/auth/profile/api/endpoints.ts',
  ORG_ENDPOINTS: 'modules/org/org/api/endpoints.ts',
  ORG_INVITE_ENDPOINTS: 'modules/org/invites/api/endpoints.ts',
  TEMPLATE_ENDPOINTS: 'modules/admin/admin-templates/api/endpoints.ts',
  ADMIN_ENDPOINTS: 'modules/admin/admin-templates/api/endpoints.ts',
  PROJECT_ENDPOINTS: 'modules/projects/project/api/endpoints.ts',
  SESSION_ENDPOINTS: 'modules/sessions/session/api/endpoints.ts',
  AI_ENDPOINTS: 'modules/projects/project/api/ai-endpoints.ts',
  DOCUMENT_ENDPOINTS: 'modules/documents/document/api/endpoints.ts',
  PROJECT_SECTION_ENDPOINTS: 'modules/documents/project-sections/api/endpoints.ts',
  DOCUMENT_TEMPLATE_ENDPOINTS: 'modules/documents/document-templates/api/endpoints.ts',
  LANDSCAPE_ENDPOINTS: 'modules/landscape/landscape/api/endpoints.ts',
  COLLABORATION_ENDPOINTS: 'modules/collaboration/core/api/endpoints.ts',
  AI_DOCUMENT_ENDPOINTS: 'modules/ai-document-intelligence/document-ai/api/endpoints.ts',
  DOCUMENT_HUB_ENDPOINTS: 'modules/documents/document-hub/api/endpoints.ts',
  CONTROLLED_LIST_ENDPOINTS: 'modules/controlled-lists/lists/api/endpoints.ts',
  CONTROLLED_VALUE_ENDPOINTS: 'modules/controlled-lists/values/api/endpoints.ts',
}

const fileContents = new Map()

for (const match of blocks) {
  const name = match[1]
  const block = match[0]
  const rel = mapping[name]
  if (!rel) {
    console.warn(`No mapping for ${name}`)
    continue
  }
  const abs = path.join(root, rel)
  const existing = fileContents.get(abs) ?? []
  existing.push(block)
  fileContents.set(abs, existing)
}

const header = `import { v2 } from '@/shared/lib/api-paths'\n\n`

for (const [abs, parts] of fileContents) {
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, header + parts.join('\n\n') + '\n')
  console.log('Wrote', path.relative(root, abs))
}

// Re-export barrel
const names = blocks.map((m) => m[1]).filter((n) => mapping[n])
const barrel =
  `/** @deprecated Import from module api/endpoints — transitional re-exports */\n` +
  names.map((n) => `export { ${n} } from '@/modules/${exportPath(n)}'`).join('\n') +
  '\n'

function exportPath(endpointName) {
  const rel = mapping[endpointName]
  const mod = rel.replace(/^modules\//, '').replace(/\/api\/.*$/, '')
  if (endpointName === 'AI_ENDPOINTS') return 'projects/project/api/ai-endpoints'
  return mod + '/api/endpoints'
}

// Fix barrel - use direct paths
const barrelLines = [
  '/** Transitional re-exports — prefer module-local api/endpoints */',
  "export { AUTH_ENDPOINTS } from '@/modules/auth/auth/api/endpoints'",
  "export { PROFILE_ENDPOINTS } from '@/modules/auth/profile/api/endpoints'",
  "export { ORG_ENDPOINTS } from '@/modules/org/org/api/endpoints'",
  "export { ORG_INVITE_ENDPOINTS } from '@/modules/org/invites/api/endpoints'",
  "export { TEMPLATE_ENDPOINTS, ADMIN_ENDPOINTS } from '@/modules/admin/admin-templates/api/endpoints'",
  "export { PROJECT_ENDPOINTS } from '@/modules/projects/project/api/endpoints'",
  "export { AI_ENDPOINTS } from '@/modules/projects/project/api/ai-endpoints'",
  "export { SESSION_ENDPOINTS } from '@/modules/sessions/session/api/endpoints'",
  "export { DOCUMENT_ENDPOINTS } from '@/modules/documents/document/api/endpoints'",
  "export { PROJECT_SECTION_ENDPOINTS } from '@/modules/documents/project-sections/api/endpoints'",
  "export { DOCUMENT_TEMPLATE_ENDPOINTS } from '@/modules/documents/document-templates/api/endpoints'",
  "export { LANDSCAPE_ENDPOINTS } from '@/modules/landscape/landscape/api/endpoints'",
  "export { COLLABORATION_ENDPOINTS } from '@/modules/collaboration/core/api/endpoints'",
  "export { AI_DOCUMENT_ENDPOINTS } from '@/modules/ai-document-intelligence/document-ai/api/endpoints'",
  "export { DOCUMENT_HUB_ENDPOINTS } from '@/modules/documents/document-hub/api/endpoints'",
  "export { CONTROLLED_LIST_ENDPOINTS } from '@/modules/controlled-lists/lists/api/endpoints'",
  "export { CONTROLLED_VALUE_ENDPOINTS } from '@/modules/controlled-lists/values/api/endpoints'",
  '',
]
fs.writeFileSync(endpointsPath, barrelLines.join('\n'))

const importUpdates = [
  ['modules/auth/auth/api/auth.api.ts', "from './endpoints'", 'AUTH_ENDPOINTS'],
  ['modules/auth/profile/api/profile.api.ts', "from './endpoints'", 'PROFILE_ENDPOINTS'],
  ['modules/org/org/api/org.api.ts', "from './endpoints'", 'ORG_ENDPOINTS'],
  [
    'modules/org/invites/api/org-invites.api.ts',
    "from './endpoints'",
    'ORG_ENDPOINTS',
    'ORG_INVITE_ENDPOINTS',
  ],
  [
    'modules/projects/project/api/projects.api.ts',
    "from './endpoints'",
    'PROJECT_ENDPOINTS',
    'TEMPLATE_ENDPOINTS',
  ],
  [
    'modules/projects/questions/api/questions.api.ts',
    "from '../project/api/endpoints'",
    'PROJECT_ENDPOINTS',
  ],
  [
    'modules/projects/requirements/api/requirements.api.ts',
    "from '../project/api/endpoints'",
    'PROJECT_ENDPOINTS',
  ],
  [
    'modules/projects/questions/api/ai-questions.api.ts',
    "from '../../project/api/ai-endpoints'",
    'AI_ENDPOINTS',
  ],
  [
    'modules/projects/ai-impact/api/ai-impact.api.ts',
    "from '../../project/api/ai-endpoints'",
    'AI_ENDPOINTS',
  ],
  ['modules/sessions/session/api/sessions.api.ts', "from './endpoints'", 'SESSION_ENDPOINTS'],
  [
    'modules/sessions/ai-improve/api/ai-improve.api.ts',
    "from '../../../projects/project/api/ai-endpoints'",
    'AI_ENDPOINTS',
  ],
  [
    'modules/sessions/clarity/api/ai-clarity.api.ts',
    "from '../../../projects/project/api/ai-endpoints'",
    'AI_ENDPOINTS',
  ],
  [
    'modules/admin/admin-templates/api/admin-templates.api.ts',
    "from './endpoints'",
    'TEMPLATE_ENDPOINTS',
    'ADMIN_ENDPOINTS',
  ],
  ['modules/documents/document/api/documents.api.ts', "from './endpoints'", 'DOCUMENT_ENDPOINTS'],
  [
    'modules/documents/document-links/api/document-links.api.ts',
    "from '../../document/api/endpoints'",
    'DOCUMENT_ENDPOINTS',
  ],
  [
    'modules/documents/document-templates/api/document-templates.api.ts',
    "from './endpoints'",
    'DOCUMENT_TEMPLATE_ENDPOINTS',
  ],
  [
    'modules/documents/document-templates/api/document-templates.api.ts',
    "from '../../document/api/endpoints'",
    'DOCUMENT_ENDPOINTS',
    true,
  ],
  [
    'modules/documents/project-sections/api/project-sections.api.ts',
    "from './endpoints'",
    'PROJECT_SECTION_ENDPOINTS',
  ],
  [
    'modules/documents/project-sections/api/project-sections.api.ts',
    "from '../../document/api/endpoints'",
    'DOCUMENT_ENDPOINTS',
    true,
  ],
  [
    'modules/documents/document-export/api/document-export.api.ts',
    "from '../../document/api/endpoints'",
    'DOCUMENT_ENDPOINTS',
  ],
  [
    'modules/documents/deliverables/api/deliverables.api.ts',
    "from '../../document/api/endpoints'",
    'DOCUMENT_ENDPOINTS',
  ],
  [
    'modules/documents/deliverables/api/deliverables.api.ts',
    "from '../../document-hub/api/endpoints'",
    'DOCUMENT_HUB_ENDPOINTS',
    true,
  ],
  [
    'modules/documents/document-hub/api/document-hub.api.ts',
    "from './endpoints'",
    'DOCUMENT_HUB_ENDPOINTS',
  ],
  ['modules/landscape/landscape/api/landscape.api.ts', "from './endpoints'", 'LANDSCAPE_ENDPOINTS'],
  [
    'modules/collaboration/core/api/collaboration.api.ts',
    "from './endpoints'",
    'COLLABORATION_ENDPOINTS',
  ],
  [
    'modules/ai-document-intelligence/document-ai/api/ai-document-intelligence.api.ts',
    "from './endpoints'",
    'AI_DOCUMENT_ENDPOINTS',
  ],
  [
    'modules/controlled-lists/lists/api/controlled-lists.api.ts',
    "from './endpoints'",
    'CONTROLLED_LIST_ENDPOINTS',
  ],
  [
    'modules/controlled-lists/values/api/controlled-values.api.ts',
    "from './endpoints'",
    'CONTROLLED_VALUE_ENDPOINTS',
  ],
  ['modules/org/invites/ui/JoinOrgPanel.tsx', "from '../api/endpoints'", 'ORG_INVITE_ENDPOINTS'],
]

for (const [rel, fromPath, ...names] of importUpdates) {
  const append = names.pop() === true
  const abs = path.join(root, rel)
  let content = fs.readFileSync(abs, 'utf8')
  content = content.replace(
    /import \{[^}]+\} from '@\/constants\/endpoints'\n?/,
    append ? '' : `import { ${names.join(', ')} } from '${fromPath.replace('@/', '@/')}'\n`
  )
  if (append) {
    const importLine = `import { ${names.join(', ')} } from '${fromPath.replace(/^from '/, '').replace(/'$/, '')}'\n`
    if (!content.includes(names[0])) {
      content = content.replace(/^(import .+\n)(?!import)/m, `$1${importLine}`)
    }
  }
  fs.writeFileSync(abs, content)
}

// Governance + agent control
const govSrc = fs.readFileSync(path.join(root, 'constants/governance-endpoints.ts'), 'utf8')
const govBody = govSrc.replace(
  /const getBaseUrl[\s\S]*?const v2[\s\S]*?\n\n/,
  "import { v2 } from '@/shared/lib/api-paths'\n\n"
)
fs.writeFileSync(path.join(root, 'modules/governance/policy/api/endpoints.ts'), govBody)
fs.writeFileSync(
  path.join(root, 'constants/governance-endpoints.ts'),
  "export { GOVERNANCE_ENDPOINTS } from '@/modules/governance/policy/api/endpoints'\n"
)

const agentSrc = fs.readFileSync(path.join(root, 'constants/agent-control-endpoints.ts'), 'utf8')
const agentBody = agentSrc.replace(
  /const getBaseUrl[\s\S]*?const v2[\s\S]*?\n\n/,
  "import { v2 } from '@/shared/lib/api-paths'\n\n"
)
fs.writeFileSync(
  path.join(root, 'modules/ai-agent-control/agent-control/api/endpoints.ts'),
  agentBody
)
fs.writeFileSync(
  path.join(root, 'constants/agent-control-endpoints.ts'),
  "export { AGENT_CONTROL_ENDPOINTS } from '@/modules/ai-agent-control/agent-control/api/endpoints'\n"
)

let govApi = fs.readFileSync(
  path.join(root, 'modules/governance/policy/api/governance.api.ts'),
  'utf8'
)
govApi = govApi.replace('@/constants/governance-endpoints', './endpoints')
fs.writeFileSync(path.join(root, 'modules/governance/policy/api/governance.api.ts'), govApi)

let agentApi = fs.readFileSync(
  path.join(root, 'modules/ai-agent-control/agent-control/api/agent-control.api.ts'),
  'utf8'
)
agentApi = agentApi.replace('@/constants/agent-control-endpoints', './endpoints')
fs.writeFileSync(
  path.join(root, 'modules/ai-agent-control/agent-control/api/agent-control.api.ts'),
  agentApi
)

console.log('Done colocating endpoints')
