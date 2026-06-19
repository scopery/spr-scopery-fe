#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const fixes = {
  'modules/auth/auth/api/auth.api.ts': "import { AUTH_ENDPOINTS } from './endpoints'",
  'modules/auth/profile/api/profile.api.ts': "import { PROFILE_ENDPOINTS } from './endpoints'",
  'modules/org/org/api/org.api.ts': "import { ORG_ENDPOINTS } from './endpoints'",
  'modules/org/invites/api/org-invites.api.ts':
    "import { ORG_ENDPOINTS, ORG_INVITE_ENDPOINTS } from './endpoints'",
  'modules/org/invites/ui/JoinOrgPanel.tsx':
    "import { ORG_INVITE_ENDPOINTS } from '../api/endpoints'",
  'modules/projects/project/api/projects.api.ts':
    "import { PROJECT_ENDPOINTS, TEMPLATE_ENDPOINTS } from './endpoints'",
  'modules/projects/questions/api/questions.api.ts':
    "import { PROJECT_ENDPOINTS } from '../project/api/endpoints'",
  'modules/projects/requirements/api/requirements.api.ts':
    "import { PROJECT_ENDPOINTS } from '../project/api/endpoints'",
  'modules/projects/questions/api/ai-questions.api.ts':
    "import { AI_ENDPOINTS } from '../../project/api/ai-endpoints'",
  'modules/projects/ai-impact/api/ai-impact.api.ts':
    "import { AI_ENDPOINTS } from '../../project/api/ai-endpoints'",
  'modules/sessions/session/api/sessions.api.ts': "import { SESSION_ENDPOINTS } from './endpoints'",
  'modules/sessions/ai-improve/api/ai-improve.api.ts':
    "import { AI_ENDPOINTS } from '../../../projects/project/api/ai-endpoints'",
  'modules/sessions/clarity/api/ai-clarity.api.ts':
    "import { AI_ENDPOINTS } from '../../../projects/project/api/ai-endpoints'",
  'modules/admin/admin-templates/api/admin-templates.api.ts':
    "import { TEMPLATE_ENDPOINTS, ADMIN_ENDPOINTS } from './endpoints'",
  'modules/documents/document/api/documents.api.ts':
    "import { DOCUMENT_ENDPOINTS } from './endpoints'",
  'modules/documents/document-links/api/document-links.api.ts':
    "import { DOCUMENT_ENDPOINTS } from '../../document/api/endpoints'",
  'modules/documents/document-templates/api/document-templates.api.ts':
    "import { DOCUMENT_TEMPLATE_ENDPOINTS } from './endpoints'\nimport { DOCUMENT_ENDPOINTS } from '../../document/api/endpoints'",
  'modules/documents/project-sections/api/project-sections.api.ts':
    "import { PROJECT_SECTION_ENDPOINTS } from './endpoints'\nimport { DOCUMENT_ENDPOINTS } from '../../document/api/endpoints'",
  'modules/documents/document-export/api/document-export.api.ts':
    "import { DOCUMENT_ENDPOINTS } from '../../document/api/endpoints'",
  'modules/documents/deliverables/api/deliverables.api.ts':
    "import { DOCUMENT_ENDPOINTS } from '../../document/api/endpoints'\nimport { DOCUMENT_HUB_ENDPOINTS } from '../../document-hub/api/endpoints'",
  'modules/documents/document-hub/api/document-hub.api.ts':
    "import { DOCUMENT_HUB_ENDPOINTS } from './endpoints'",
  'modules/landscape/landscape/api/landscape.api.ts': null, // has other imports on line 6
  'modules/collaboration/core/api/collaboration.api.ts': null,
  'modules/ai-document-intelligence/document-ai/api/ai-document-intelligence.api.ts':
    "import { AI_DOCUMENT_ENDPOINTS } from './endpoints'",
  'modules/controlled-lists/lists/api/controlled-lists.api.ts':
    "import { CONTROLLED_LIST_ENDPOINTS } from './endpoints'",
  'modules/controlled-lists/values/api/controlled-values.api.ts':
    "import { CONTROLLED_VALUE_ENDPOINTS } from './endpoints'",
}

for (const [rel, replacement] of Object.entries(fixes)) {
  const abs = path.join(root, rel)
  let content = fs.readFileSync(abs, 'utf8')
  content = content.replace(/import \{[^}]*\} from 'from [^']+'\n?/g, '')
  if (replacement === null) {
    const line = rel.includes('landscape')
      ? "import { LANDSCAPE_ENDPOINTS } from './endpoints'"
      : "import { COLLABORATION_ENDPOINTS } from './endpoints'"
    content = line + '\n' + content
  } else {
    content = replacement + '\n' + content
  }
  fs.writeFileSync(abs, content)
  console.log('Fixed', rel)
}

console.log('Import fixes done')
