#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const GLOBAL = [
  ['@/modules/admin/model/ai-run-feedback', '@/modules/admin/ai-feedback'],
  ['@/modules/admin/model/ai-prompt-playground', '@/modules/admin/ai-playground'],
  ['@/modules/admin/model/ai-agent-control', '@/modules/admin/ai-agents'],
  ['@/modules/admin/model/ai-routing', '@/modules/admin/ai-routing'],
  ['@/modules/admin/model/ai-budget', '@/modules/admin/ai-budgets'],
  ['@/modules/admin/model/ai', '@/modules/admin/ai-config'],
  ['@/modules/projects/model/traceability', '@/modules/projects/traceability'],
]

const FILE_FIXES = [
  [
    'modules/sessions/session/ui/SessionDetailView.tsx',
    [
      [`from '../api/sessions.api'`, `from '@/modules/sessions/session/api/sessions.api'`],
      [`from '../api/ai-clarity.api'`, `from '@/modules/sessions/clarity/api/ai-clarity.api'`],
      [`from '../hooks/useSessionDetail'`, `from '../hooks/useSessionDetail'`],
      [`from '../model/session'`, `from '../model/session'`],
      [`from '../model/clarity'`, `from '@/modules/sessions/clarity'`],
      [`from './AIImproveModal'`, `from '@/modules/sessions/ai-improve/ui/AIImproveModal'`],
      [`from './AIImproveAllModal'`, `from '@/modules/sessions/ai-improve/ui/AIImproveAllModal'`],
      [`from './ClarityBadge'`, `from '@/modules/sessions/clarity/ui/ClarityBadge'`],
      [`from './ClarityPanel'`, `from '@/modules/sessions/clarity/ui/ClarityPanel'`],
      [`from './ClarityDetailsModal'`, `from '@/modules/sessions/clarity/ui/ClarityDetailsModal'`],
    ],
  ],
  [
    'modules/sessions/ai-improve/ui/AIImproveModal.tsx',
    [
      [`from '../hooks/useAiImprove'`, `from '../hooks/useAiImprove'`],
      [`from '../model/session'`, `from '@/modules/sessions/session'`],
    ],
  ],
  [
    'modules/sessions/ai-improve/ui/AIImproveAllModal.tsx',
    [[`from '../model/session'`, `from '@/modules/sessions/session'`]],
  ],
  [
    'modules/admin/ai-playground/model/ai-prompt-playground.ts',
    [[`from './ai-agent-control'`, `from '@/modules/admin/ai-agents'`]],
  ],
  [
    'modules/admin/ai-budgets/ui/ai-budget-badges.tsx',
    [[`from './ai-agent-badges'`, `from '@/modules/admin/ai-agents/ui/ai-agent-badges'`]],
  ],
  [
    'modules/admin/ai-agents/ui/ai-agent-usage-summary-cards.tsx',
    [[`from './ai-agent-badges'`, `from './ai-agent-badges'`]],
  ],
  [
    'modules/admin/ai-routing/ui/ai-agent-routing-panel.tsx',
    [
      [`from '../../api/ai-routing.api'`, `from '../api/ai-routing.api'`],
      [`from '../../api/ai-agents.api'`, `from '@/modules/admin/ai-agents/api/ai-agents.api'`],
    ],
  ],
  [
    'modules/admin/ai-playground/ui/ai-agent-playground-panel.tsx',
    [
      [`from './ai-agent-badges'`, `from '@/modules/admin/ai-agents/ui/ai-agent-badges'`],
      [`from '../../api/ai-prompt-playground.api'`, `from '../api/ai-prompt-playground.api'`],
      [`from '../../api/ai-agents.api'`, `from '@/modules/admin/ai-agents/api/ai-agents.api'`],
      [
        `from './ai-run-feedback-controls'`,
        `from '@/modules/admin/ai-feedback/ui/ai-run-feedback-controls'`,
      ],
    ],
  ],
  [
    'modules/admin/ai-feedback/ui/ai-run-feedback-controls.tsx',
    [[`from '../../api/ai-run-feedback.api'`, `from '../api/ai-run-feedback.api'`]],
  ],
  [
    'modules/admin/ai-feedback/ui/ai-agent-quality-panel.tsx',
    [[`from '../../api/ai-run-feedback.api'`, `from '../api/ai-run-feedback.api'`]],
  ],
  [
    'modules/admin/ai-config/hooks/useAdminAi.ts',
    [
      [`from '@/modules/admin/model/ai'`, `from '@/modules/admin/ai-config'`],
      [`from '@/modules/admin/ai-config'`, `from '../model/ai'`],
    ],
  ],
  [
    'modules/admin/ai-config/hooks/useAiRunDetail.ts',
    [[`from '@/modules/admin/model/ai'`, `from '../model/ai'`]],
  ],
  [
    'modules/admin/ai-agents/hooks/useAiAgents.ts',
    [[`from '@/modules/admin/model/ai-agent-control'`, `from '../model/ai-agent-control'`]],
  ],
  [
    'modules/admin/ai-budgets/hooks/useAiBudgets.ts',
    [[`from '@/modules/admin/model/ai-budget'`, `from '../model/ai-budget'`]],
  ],
  [
    'modules/admin/ai-agents/ui/ai-agent-badges.tsx',
    [[`from '@/modules/admin/model/ai-agent-control'`, `from '../model/ai-agent-control'`]],
  ],
  [
    'modules/admin/ai-budgets/ui/ai-budget-badges.tsx',
    [[`from '@/modules/admin/model/ai-budget'`, `from '../model/ai-budget'`]],
  ],
  [
    'modules/admin/ai-agents/ui/ai-agent-usage-summary-cards.tsx',
    [[`from '@/modules/admin/model/ai-agent-control'`, `from '../model/ai-agent-control'`]],
  ],
]

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory() && !['node_modules', '.next'].includes(e.name)) walk(p, a)
    else if (/\.(ts|tsx)$/.test(e.name)) a.push(p)
  }
  return a
}

function apply(content, pairs) {
  let u = content
  for (const [a, b] of pairs) u = u.split(a).join(b)
  return u
}

let n = 0
for (const dir of ['modules', 'app', 'utils']) {
  const base = path.join(ROOT, dir)
  if (!fs.existsSync(base)) continue
  for (const f of walk(base)) {
    const c = fs.readFileSync(f, 'utf8')
    const u = apply(c, GLOBAL)
    if (u !== c) {
      fs.writeFileSync(f, u)
      n++
    }
  }
}
console.log('Global:', n)

for (const [rel, pairs] of FILE_FIXES) {
  const f = path.join(ROOT, rel)
  if (!fs.existsSync(f)) continue
  const c = fs.readFileSync(f, 'utf8')
  const u = apply(c, pairs)
  if (u !== c) {
    fs.writeFileSync(f, u)
    console.log('Fixed:', rel)
  }
}

// Fix useAdminAi - the double replace might have broken it, read and fix manually if needed
