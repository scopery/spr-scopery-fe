#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Longest-first to avoid partial replacements */
const GLOBAL = [
  ['@/modules/governance/model/governance-conditions', '@/modules/governance/policy'],
  ['@/modules/governance/model/governance-types', '@/modules/governance/policy'],
  ['@/modules/governance/model/governance-simulator', '@/modules/governance/simulator'],
  ['@/modules/governance/model/preset-preview-modal', '@/modules/governance/preset-preview'],
  ['@/modules/governance/model/governance', '@/modules/governance/policy'],
  ['@/modules/org/model/org-invite', '@/modules/org/invites'],
  ['@/modules/org/model/org', '@/modules/org/org'],
  ['@/modules/org/api/org-invites.api', '@/modules/org/invites/api/org-invites.api'],
  ['@/modules/org/api/org.api', '@/modules/org/org/api/org.api'],
  [
    '@/modules/ai-agent-control/model/agent-control-types',
    '@/modules/ai-agent-control/agent-control',
  ],
  ['@/modules/ai-agent-control/model/agent-control', '@/modules/ai-agent-control/agent-control'],
  [
    '@/modules/ai-document-intelligence/model/ai-document-intelligence',
    '@/modules/ai-document-intelligence/document-ai',
  ],
  ['@/modules/collaboration/model/collaboration', '@/modules/collaboration/core'],
  ['@/modules/controlled-lists/model/controlled-lists-types', '@/modules/controlled-lists/lists'],
  ['@/modules/controlled-lists/model/controlled-lists', '@/modules/controlled-lists/lists'],
  ['@/modules/permissions/model/permissions', '@/modules/permissions/access'],
]

const FILE_FIXES = [
  [
    'modules/governance/policy/model/governance.ts',
    [
      [
        `from './governance-simulator'`,
        `from '@/modules/governance/simulator/model/governance-simulator'`,
      ],
      [
        `from './preset-preview-modal'`,
        `from '@/modules/governance/preset-preview/model/preset-preview-modal'`,
      ],
    ],
  ],
  [
    'modules/ai-agent-control/agent-control/ui/AgentControlView.tsx',
    [
      [
        `from './PromptRegistryPanel'`,
        `from '@/modules/ai-agent-control/prompt-registry/ui/PromptRegistryPanel'`,
      ],
      [
        `from './RuntimeUsagePanel'`,
        `from '@/modules/ai-agent-control/runtime/ui/RuntimeUsagePanel'`,
      ],
    ],
  ],
  [
    'modules/ai-agent-control/prompt-registry/ui/PromptRegistryPanel.tsx',
    [
      [
        `from '../api/agent-control.api'`,
        `from '@/modules/ai-agent-control/agent-control/api/agent-control.api'`,
      ],
      [
        `from '../model/agent-control-types'`,
        `from '@/modules/ai-agent-control/agent-control/model/agent-control-types'`,
      ],
    ],
  ],
  [
    'modules/ai-agent-control/runtime/ui/RuntimeUsagePanel.tsx',
    [
      [
        `from '../api/agent-control.api'`,
        `from '@/modules/ai-agent-control/agent-control/api/agent-control.api'`,
      ],
      [
        `from '../model/agent-control-types'`,
        `from '@/modules/ai-agent-control/agent-control/model/agent-control-types'`,
      ],
    ],
  ],
  [
    'modules/ai-agent-control/agent-control/hooks/useAgentControl.ts',
    [
      [
        `from '@/modules/ai-agent-control/model/agent-control-types'`,
        `from '../model/agent-control-types'`,
      ],
    ],
  ],
  [
    'modules/ai-document-intelligence/document-ai/ui/DocumentAIPanel.tsx',
    [
      [
        `from './RelatedDocumentsPanel'`,
        `from '@/modules/ai-document-intelligence/related-documents/ui/RelatedDocumentsPanel'`,
      ],
    ],
  ],
  [
    'modules/ai-document-intelligence/project-ai/ui/ProjectAIActionsMenu.tsx',
    [
      [
        `from '../api/ai-document-intelligence.api'`,
        `from '@/modules/ai-document-intelligence/document-ai/api/ai-document-intelligence.api'`,
      ],
      [
        `from '../model/ai-document-intelligence'`,
        `from '@/modules/ai-document-intelligence/document-ai/model/ai-document-intelligence'`,
      ],
      [
        `from './AIPreviewDialog'`,
        `from '@/modules/ai-document-intelligence/document-ai/ui/AIPreviewDialog'`,
      ],
    ],
  ],
  [
    'modules/ai-document-intelligence/related-documents/ui/RelatedDocumentsPanel.tsx',
    [
      [
        `from '../api/ai-document-intelligence.api'`,
        `from '@/modules/ai-document-intelligence/document-ai/api/ai-document-intelligence.api'`,
      ],
      [
        `from '../model/ai-document-intelligence'`,
        `from '@/modules/ai-document-intelligence/document-ai/model/ai-document-intelligence'`,
      ],
    ],
  ],
  [
    'modules/auth/auth/context/AuthContext.tsx',
    [
      [`from '../api/profile.api'`, `from '@/modules/auth/profile/api/profile.api'`],
      [`from '@/modules/org/api/org.api'`, `from '@/modules/org/org/api/org.api'`],
      [`from '@/modules/org/model/org'`, `from '@/modules/org/org'`],
    ],
  ],
  [
    'modules/auth/profile/api/profile.api.ts',
    [[`from '../model/auth'`, `from '@/modules/auth/auth/model/auth'`]],
  ],
  [
    'modules/auth/profile/hooks/useProfile.ts',
    [[`from '../model/auth'`, `from '@/modules/auth/auth/model/auth'`]],
  ],
  [
    'modules/auth/profile/index.ts',
    [[`from './model/auth'`, `from '@/modules/auth/auth/model/auth'`]],
  ],
  [
    'modules/collaboration/panel/ui/DocumentCollaborationPanel.tsx',
    [
      [`from '../model/collaboration'`, `from '@/modules/collaboration/core/model/collaboration'`],
      [
        `from './DocumentCommentsPanel'`,
        `from '@/modules/collaboration/comments/ui/DocumentCommentsPanel'`,
      ],
      [
        `from './DocumentSuggestionsPanel'`,
        `from '@/modules/collaboration/suggestions/ui/DocumentSuggestionsPanel'`,
      ],
      [
        `from './DocumentActivityPanel'`,
        `from '@/modules/collaboration/activity/ui/DocumentActivityPanel'`,
      ],
      [
        `from './ShareDocumentDialog'`,
        `from '@/modules/collaboration/sharing/ui/ShareDocumentDialog'`,
      ],
    ],
  ],
  [
    'modules/collaboration/comments/ui/DocumentCommentsPanel.tsx',
    [
      [
        `from '../api/collaboration.api'`,
        `from '@/modules/collaboration/core/api/collaboration.api'`,
      ],
      [`from '../model/collaboration'`, `from '@/modules/collaboration/core/model/collaboration'`],
    ],
  ],
  [
    'modules/collaboration/comments/ui/DocumentCommentThread.tsx',
    [[`from '../model/collaboration'`, `from '@/modules/collaboration/core/model/collaboration'`]],
  ],
  [
    'modules/collaboration/comments/ui/MentionUserPicker.tsx',
    [
      [
        `from '../api/collaboration.api'`,
        `from '@/modules/collaboration/core/api/collaboration.api'`,
      ],
      [`from '../model/collaboration'`, `from '@/modules/collaboration/core/model/collaboration'`],
    ],
  ],
  [
    'modules/collaboration/suggestions/ui/DocumentSuggestionsPanel.tsx',
    [
      [
        `from '../api/collaboration.api'`,
        `from '@/modules/collaboration/core/api/collaboration.api'`,
      ],
      [`from '../model/collaboration'`, `from '@/modules/collaboration/core/model/collaboration'`],
      [
        `from './MentionUserPicker'`,
        `from '@/modules/collaboration/comments/ui/MentionUserPicker'`,
      ],
    ],
  ],
  [
    'modules/collaboration/activity/ui/DocumentActivityPanel.tsx',
    [
      [
        `from '../api/collaboration.api'`,
        `from '@/modules/collaboration/core/api/collaboration.api'`,
      ],
      [`from '../model/collaboration'`, `from '@/modules/collaboration/core/model/collaboration'`],
    ],
  ],
  [
    'modules/collaboration/sharing/ui/ShareDocumentDialog.tsx',
    [
      [
        `from '../api/collaboration.api'`,
        `from '@/modules/collaboration/core/api/collaboration.api'`,
      ],
      [`from '../model/collaboration'`, `from '@/modules/collaboration/core/model/collaboration'`],
    ],
  ],
  [
    'modules/controlled-lists/values/api/controlled-values.api.ts',
    [
      [
        `from '../model/controlled-lists-types'`,
        `from '@/modules/controlled-lists/lists/model/controlled-lists-types'`,
      ],
    ],
  ],
  [
    'modules/controlled-lists/values/hooks/useControlledValues.ts',
    [
      [
        `from '../model/controlled-lists'`,
        `from '@/modules/controlled-lists/lists/model/controlled-lists'`,
      ],
    ],
  ],
  [
    'modules/controlled-lists/values/index.ts',
    [
      [
        `from './model/controlled-lists'`,
        `from '@/modules/controlled-lists/lists/model/controlled-lists'`,
      ],
    ],
  ],
]

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (['node_modules', '.next'].includes(e.name)) continue
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p, a)
    else if (/\.(ts|tsx|mjs)$/.test(e.name)) a.push(p)
  }
  return a
}

function apply(content, pairs) {
  let u = content
  for (const [a, b] of pairs) u = u.split(a).join(b)
  return u
}

let n = 0
for (const dir of ['modules', 'app', 'utils', 'hooks']) {
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
  if (!fs.existsSync(f)) {
    console.warn('Missing', rel)
    continue
  }
  const c = fs.readFileSync(f, 'utf8')
  const u = apply(c, pairs)
  if (u !== c) {
    fs.writeFileSync(f, u)
    console.log('Fixed:', rel)
  }
}
