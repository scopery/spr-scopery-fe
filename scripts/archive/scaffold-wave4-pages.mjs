import fs from 'fs'
import path from 'path'

const root = process.cwd()

function page(rel, importLine, component) {
  const content = `'use client'

${importLine}

export default function Page() {
  return <${component} />
}
`
  const p = path.join(root, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content)
  console.log('P', rel)
}

const pages = [
  [
    'app/workspace/[workspaceId]/search/page.tsx',
    "import { GlobalSearchView } from '@/modules/productivity'",
    'GlobalSearchView',
  ],
  [
    'app/workspace/[workspaceId]/work-inbox/page.tsx',
    "import { WorkInboxView } from '@/modules/productivity'",
    'WorkInboxView',
  ],
  [
    'app/workspace/[workspaceId]/saved-items/page.tsx',
    "import { SavedItemsView } from '@/modules/productivity'",
    'SavedItemsView',
  ],
  [
    'app/workspace/[workspaceId]/ai/page.tsx',
    "import { AiAssistantView } from '@/modules/ai-assistant'",
    'AiAssistantView',
  ],
  [
    'app/workspace/[workspaceId]/support/page.tsx',
    "import { SupportDashboardView } from '@/modules/service-support'",
    'SupportDashboardView',
  ],
  [
    'app/workspace/[workspaceId]/applications/page.tsx',
    "import { ApplicationRegistryView } from '@/modules/projects'",
    'ApplicationRegistryView',
  ],
  [
    'app/workspace/[workspaceId]/settings/knowledge/page.tsx',
    "import { DocumentTypeLibraryView } from '@/modules/knowledge'",
    'DocumentTypeLibraryView',
  ],
  [
    'app/workspace/[workspaceId]/settings/knowledge/indexing/page.tsx',
    "import { KnowledgeIndexingView } from '@/modules/knowledge'",
    'KnowledgeIndexingView',
  ],
  [
    'app/workspace/[workspaceId]/settings/integrations/page.tsx',
    "import { IntegrationDashboardView } from '@/modules/integration-hub'",
    'IntegrationDashboardView',
  ],
  [
    'app/workspace/[workspaceId]/settings/trust/page.tsx',
    "import { TrustDashboardView } from '@/modules/trust'",
    'TrustDashboardView',
  ],
  [
    'app/workspace/[workspaceId]/projects/[projectId]/quality/page.tsx',
    "import { QualityCenterView } from '@/modules/quality'",
    'QualityCenterView',
  ],
  [
    'app/workspace/[workspaceId]/projects/[projectId]/quality/test-plans/page.tsx',
    "import { TestManagementView } from '@/modules/quality'",
    'TestManagementView',
  ],
  [
    'app/workspace/[workspaceId]/projects/[projectId]/defects/page.tsx',
    "import { DefectCenterView } from '@/modules/quality'",
    'DefectCenterView',
  ],
  [
    'app/workspace/[workspaceId]/projects/[projectId]/releases/page.tsx',
    "import { ReleaseCenterView } from '@/modules/quality'",
    'ReleaseCenterView',
  ],
  [
    'app/workspace/[workspaceId]/projects/[projectId]/deployments/page.tsx',
    "import { DeploymentCenterView } from '@/modules/quality'",
    'DeploymentCenterView',
  ],
  [
    'app/workspace/[workspaceId]/projects/[projectId]/ai-planning/page.tsx',
    "import { AiPlanningCenterView } from '@/modules/ai-planning'",
    'AiPlanningCenterView',
  ],
  [
    'app/workspace/[workspaceId]/projects/[projectId]/recommendations/page.tsx',
    "import { RecommendationCenterView } from '@/modules/ai-recommendation'",
    'RecommendationCenterView',
  ],
  [
    'app/workspace/[workspaceId]/projects/[projectId]/client-collaboration/page.tsx',
    "import { ClientCollaborationView } from '@/modules/portal'",
    'ClientCollaborationView',
  ],
  [
    'app/workspace/[workspaceId]/projects/[projectId]/dashboard/page.tsx',
    "import { ProjectDashboardView } from '@/modules/reporting'",
    'ProjectDashboardView',
  ],
  [
    'app/workspace/[workspaceId]/projects/[projectId]/report-library/page.tsx',
    "import { ReportLibraryView } from '@/modules/reporting'",
    'ReportLibraryView',
  ],
  [
    'app/workspace/[workspaceId]/projects/[projectId]/governance/page.tsx',
    "import { ProjectGovernanceCenterView } from '@/modules/governance'",
    'ProjectGovernanceCenterView',
  ],
  [
    'app/workspace/[workspaceId]/projects/[projectId]/traceability/page.tsx',
    "import { TraceabilityMatrixView } from '@/modules/projects'",
    'TraceabilityMatrixView',
  ],
  ['app/portal/login/page.tsx', "import { PortalLoginView } from '@/modules/portal'", 'PortalLoginView'],
  [
    'app/portal/projects/page.tsx',
    "import { PortalProjectsView } from '@/modules/portal'",
    'PortalProjectsView',
  ],
  [
    'app/portal/projects/[projectId]/page.tsx',
    "import { PortalProjectHomeView } from '@/modules/portal'",
    'PortalProjectHomeView',
  ],
]

for (const [rel, imp, comp] of pages) {
  page(rel, imp, comp)
}

// Portal layout
fs.mkdirSync(path.join(root, 'app/portal'), { recursive: true })
fs.writeFileSync(
  path.join(root, 'app/portal/layout.tsx'),
  `'use client'

import type { ReactNode } from 'react'
import { PortalShell } from '@/modules/portal'

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <PortalShell>{children}</PortalShell>
}
`
)
console.log('P app/portal/layout.tsx')
console.log('pages done')
