#!/usr/bin/env node
/**
 * Fix imports after documents module split.
 * Run: node scripts/fix-documents-imports.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const ALIAS_REPLACEMENTS = [
  ['@/modules/documents/model/document', '@/modules/documents/document'],
  ['@/modules/documents/model/document-template-types', '@/modules/documents/document-templates'],
  ['@/modules/documents/model/document-templates', '@/modules/documents/document-templates'],
  ['@/modules/documents/model/document-link-types', '@/modules/documents/document-links'],
  ['@/modules/documents/model/document-links', '@/modules/documents/document-links'],
  ['@/modules/documents/model/document-deliverable-types', '@/modules/documents/deliverables'],
  ['@/modules/documents/model/deliverables', '@/modules/documents/deliverables'],
  ['@/modules/documents/model/create-deliverable-dialog', '@/modules/documents/deliverables'],
  ['@/modules/documents/model/deliverable-document-set-picker', '@/modules/documents/deliverables'],
  ['@/modules/documents/model/evidence-documents', '@/modules/documents/evidence-documents'],
  ['@/modules/documents/model/document-hub', '@/modules/documents/document-hub'],
  ['@/modules/documents/model/project-section-types', '@/modules/documents/project-sections'],
  ['@/modules/documents/model/project-sections', '@/modules/documents/project-sections'],
  ['@/modules/documents/model/project-documents', '@/modules/documents/project-sections'],
  ['@/modules/documents/model/project-document-card', '@/modules/documents/document'],
  ['@/modules/documents/model/document-editor', '@/modules/documents/document'],
  ['@/modules/documents/model/create-document-modal', '@/modules/documents/document'],
  ['@/modules/documents/model/attach-document-modal', '@/modules/documents/document'],
  [
    '@/modules/documents/api/project-documents.api',
    '@/modules/documents/project-sections/api/project-documents.api',
  ],
  [
    '@/modules/documents/api/document-templates.api',
    '@/modules/documents/document-templates/api/document-templates.api',
  ],
  [
    '@/modules/documents/api/document-links.api',
    '@/modules/documents/document-links/api/document-links.api',
  ],
  [
    '@/modules/documents/api/deliverables.api',
    '@/modules/documents/deliverables/api/deliverables.api',
  ],
  ['@/modules/documents/api/documents.api', '@/modules/documents/document/api/documents.api'],
  ['@/modules/documents/hooks/useDocument', '@/modules/documents/document/hooks/useDocument'],
  [
    '@/modules/documents/hooks/useDocumentTemplates',
    '@/modules/documents/document-templates/hooks/useDocumentTemplates',
  ],
  ['@/modules/documents/ui/', '@/modules/documents/'],
]

/** Per-file content replacements (old -> new) */
const FILE_REPLACEMENTS = [
  // --- cross-submodule API ---
  [
    'evidence-documents/api/evidence-documents.api.ts',
    [
      [`from '../model/document-link-types'`, `from '@/modules/documents/document-links'`],
      [`from '../model/document'`, `from '@/modules/documents/document'`],
      [`from './documents.api'`, `from '@/modules/documents/document/api/documents.api'`],
      [
        `from './document-export.api'`,
        `from '@/modules/documents/document-export/api/document-export.api'`,
      ],
      [
        `from './document-links.api'`,
        `from '@/modules/documents/document-links/api/document-links.api'`,
      ],
      [
        `from './project-sections.api'`,
        `from '@/modules/documents/project-sections/api/project-sections.api'`,
      ],
    ],
  ],
  [
    'project-sections/api/project-documents.api.ts',
    [
      [`from './documents.api'`, `from '@/modules/documents/document/api/documents.api'`],
      [
        `from './document-export.api'`,
        `from '@/modules/documents/document-export/api/document-export.api'`,
      ],
    ],
  ],
  [
    'project-sections/api/project-sections.api.ts',
    [[`from '../model/document'`, `from '@/modules/documents/document'`]],
  ],
  [
    'document-hub/api/document-hub.api.ts',
    [
      [`from '../model/document'`, `from '@/modules/documents/document'`],
      [`from './documents.api'`, `from '@/modules/documents/document/api/documents.api'`],
      [
        `from './document-export.api'`,
        `from '@/modules/documents/document-export/api/document-export.api'`,
      ],
      [`from './deliverables.api'`, `from '@/modules/documents/deliverables/api/deliverables.api'`],
    ],
  ],
  [
    'document-hub/model/document-hub.ts',
    [
      [
        `from '../api/document-export.api'`,
        `from '@/modules/documents/document-export/api/document-export.api'`,
      ],
      [`from '../api/document-hub.api'`, `from '../api/document-hub.api'`],
    ],
  ],
  [
    'deliverables/api/deliverables.mapper.ts',
    [[`from '../model/document'`, `from '@/modules/documents/document'`]],
  ],
  [
    'document-templates/model/document-template-types.ts',
    [[`from './document'`, `from '@/modules/documents/document'`]],
  ],
  [
    'deliverables/model/document-deliverable-types.ts',
    [[`from './document'`, `from '@/modules/documents/document'`]],
  ],
  [
    'project-sections/model/project-section-types.ts',
    [[`from './document'`, `from '@/modules/documents/document'`]],
  ],
  [
    'project-sections/model/project-sections.ts',
    [[`from './document'`, `from '@/modules/documents/document'`]],
  ],
  [
    'evidence-documents/model/evidence-documents.ts',
    [
      [`from '../model/document-link-types'`, `from '@/modules/documents/document-links'`],
      [`from '../model/document-deliverable-types'`, `from '@/modules/documents/deliverables'`],
    ],
  ],
  [
    'document-templates/model/template-variables/template-variable-slash-items.ts',
    [
      [
        `from '../../ui/editor/slash-command-items'`,
        `from '@/modules/documents/document/ui/editor/slash-command-items'`,
      ],
      [`from '../document-template-types'`, `from '../document-template-types'`],
    ],
  ],
  // --- cross-submodule UI ---
  [
    'document/ui/DocumentEditor.tsx',
    [
      [
        `from './DocumentLinksPanel'`,
        `from '@/modules/documents/document-links/ui/DocumentLinksPanel'`,
      ],
      [
        `from './DocumentDeliverableMetadataPanel'`,
        `from '@/modules/documents/deliverables/ui/DocumentDeliverableMetadataPanel'`,
      ],
    ],
  ],
  [
    'document/ui/CreateDocumentModalView.tsx',
    [
      [
        `from './TemplatePicker'`,
        `from '@/modules/documents/document-templates/ui/TemplatePicker'`,
      ],
      [
        `from './TemplateVariableWarnings'`,
        `from '@/modules/documents/document-templates/ui/TemplateVariableWarnings'`,
      ],
    ],
  ],
  [
    'document/hooks/useCreateDocumentModal.ts',
    [
      [`from '../model/document-template-types'`, `from '@/modules/documents/document-templates'`],
      [
        `from '../model/template-variables/extract-template-variables'`,
        `from '@/modules/documents/document-templates/model/template-variables/extract-template-variables'`,
      ],
    ],
  ],
  [
    'document/api/create-document-modal.api.ts',
    [[`from '../model/document-template-types'`, `from '@/modules/documents/document-templates'`]],
  ],
  [
    'document/model/create-document-modal.ts',
    [[`from '../model/document-template-types'`, `from '@/modules/documents/document-templates'`]],
  ],
  [
    'document-templates/ui/TemplateEditor.tsx',
    [
      [`from './editor/PlateEditor'`, `from '@/modules/documents/document/ui/editor/PlateEditor'`],
      [
        `from './editor/content-adapter'`,
        `from '@/modules/documents/document/ui/editor/content-adapter'`,
      ],
      [`from './DocumentTypeBadge'`, `from '@/modules/documents/document/ui/DocumentTypeBadge'`],
    ],
  ],
  [
    'document-templates/ui/TemplatePreviewDialog.tsx',
    [
      [
        `from './editor/DocumentReadOnlyRenderer'`,
        `from '@/modules/documents/document/ui/editor/DocumentReadOnlyRenderer'`,
      ],
      [`from './DocumentTypeBadge'`, `from '@/modules/documents/document/ui/DocumentTypeBadge'`],
    ],
  ],
  [
    'document-templates/ui/TemplateCard.tsx',
    [[`from './DocumentTypeBadge'`, `from '@/modules/documents/document/ui/DocumentTypeBadge'`]],
  ],
  [
    'deliverables/ui/DeliverableHistoryPanelView.tsx',
    [
      [`from './DocumentTypeBadge'`, `from '@/modules/documents/document/ui/DocumentTypeBadge'`],
      [
        `from './WorkflowStatusBadge'`,
        `from '@/modules/documents/document/ui/WorkflowStatusBadge'`,
      ],
    ],
  ],
  [
    'deliverables/ui/DocumentDeliverableMetadataPanelView.tsx',
    [
      [`from './DocumentTypeBadge'`, `from '@/modules/documents/document/ui/DocumentTypeBadge'`],
      [
        `from './WorkflowStatusBadge'`,
        `from '@/modules/documents/document/ui/WorkflowStatusBadge'`,
      ],
    ],
  ],
  [
    'project-sections/ui/ProjectDocumentCard.tsx',
    [
      [`from './DocumentTypeBadge'`, `from '@/modules/documents/document/ui/DocumentTypeBadge'`],
      [
        `from './DocumentVisibilityBadge'`,
        `from '@/modules/documents/document/ui/DocumentVisibilityBadge'`,
      ],
    ],
  ],
  [
    'evidence-documents/ui/EntityEvidenceDocumentsPanel.tsx',
    [
      [
        `from './CreateDeliverableDialog'`,
        `from '@/modules/documents/deliverables/ui/CreateDeliverableDialog'`,
      ],
      [`from './DocumentTypeBadge'`, `from '@/modules/documents/document/ui/DocumentTypeBadge'`],
      [
        `from './WorkflowStatusBadge'`,
        `from '@/modules/documents/document/ui/WorkflowStatusBadge'`,
      ],
    ],
  ],
  [
    'evidence-documents/ui/AnswerEvidenceStrip.tsx',
    [[`from './EntityEvidenceDocumentsPanel'`, `from './EntityEvidenceDocumentsPanel'`]],
  ],
  [
    'document-templates/api/document-templates.api.ts',
    [[`from '../model/document'`, `from '@/modules/documents/document'`]],
  ],
]

function walk(dir, ext = ['.ts', '.tsx', '.mjs']) {
  const out = []
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) out.push(...walk(p, ext))
    else if (ext.some((e) => ent.name.endsWith(e))) out.push(p)
  }
  return out
}

function applyReplacements(content, pairs) {
  let next = content
  for (const [oldStr, newStr] of pairs) {
    next = next.split(oldStr).join(newStr)
  }
  return next
}

// Global alias pass on entire repo (except node_modules)
const SCAN_DIRS = [
  path.join(ROOT, 'modules'),
  path.join(ROOT, 'app'),
  path.join(ROOT, 'utils'),
  path.join(ROOT, 'hooks'),
]

let globalCount = 0
for (const dir of SCAN_DIRS) {
  if (!fs.existsSync(dir)) continue
  for (const file of walk(dir)) {
    let content = fs.readFileSync(file, 'utf8')
    const updated = applyReplacements(content, ALIAS_REPLACEMENTS)
    if (updated !== content) {
      fs.writeFileSync(file, updated)
      globalCount++
    }
  }
}
console.log(`Global alias replacements: ${globalCount} files`)

// Targeted per-file pass under modules/documents
let targetedCount = 0
for (const [rel, pairs] of FILE_REPLACEMENTS) {
  const file = path.join(ROOT, 'modules/documents', rel)
  if (!fs.existsSync(file)) {
    console.warn(`Missing: ${rel}`)
    continue
  }
  const content = fs.readFileSync(file, 'utf8')
  const updated = applyReplacements(content, pairs)
  if (updated !== content) {
    fs.writeFileSync(file, updated)
    targetedCount++
    console.log(`Fixed: ${rel}`)
  }
}
console.log(`Targeted fixes: ${targetedCount} files`)
