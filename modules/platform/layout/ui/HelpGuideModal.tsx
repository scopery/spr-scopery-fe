'use client'

import { Modal, Typography } from '@/shared/ui'
import {
  Building2,
  FolderKanban,
  Map,
  Users,
  Target,
  FileText,
  GitBranch,
  MessageSquare,
  Zap,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface HelpGuideModalProps {
  open: boolean
  onClose: () => void
}

const FLOW_ITEMS = [
  { icon: Building2, label: 'Org' },
  { icon: FolderKanban, label: 'Project' },
  { icon: Target, label: 'Scope' },
  { icon: FileText, label: 'Reqs' },
  { icon: GitBranch, label: 'Trace' },
  { icon: MessageSquare, label: 'Sessions' },
  { icon: Zap, label: 'Impact' },
] as const

/** Optional: add images to public/help/ (e.g. scope.png) and set image: '/help/scope.png' for screenshot illustrations */
const SECTIONS: Array<{
  icon: typeof Building2
  title: string
  summary: string
  image?: string
  steps: string[]
}> = [
  {
    icon: Building2,
    title: '1. Organization & Projects',
    summary: 'Set up your workspace and create projects.',
    steps: [
      'In the header, click the organization name (top-left) to switch org or create a new one.',
      'Go to Projects to see all projects in the current org. Click a project to open it.',
      'Inside a project: use Members to manage who can edit; use Questions to configure the question set for sessions.',
    ],
  },
  {
    icon: Map,
    title: '2. Landscape (org-level)',
    summary: 'Define systems, subsystems, and modules; link them.',
    steps: [
      'Open Landscape from the org area. Use the Nodes tab to build a tree: add systems, subsystems, and modules; set code and name.',
      'Create a node: click “Create node”, choose parent (or none for root), type (system/subsystem/module), code, and name.',
      'Use the Links tab to create or edit links between nodes (e.g. “depends on”, “integrates with”). Edit or delete links as needed.',
    ],
  },
  {
    icon: Users,
    title: '3. Actors (org-level)',
    summary: 'Define who or what interacts with the system (personas, systems, teams).',
    steps: [
      'Open Actors from the org area. List shows all org actors (persona, system, team, external).',
      'Create actor: give a key (e.g. “customer”), name, and optional description. Edit or deactivate later.',
      'Actors are used when you assign “who” to requirements in the project Requirements page.',
    ],
  },
  {
    icon: Target,
    title: '4. Scope (project)',
    summary: 'Decide which modules are in scope for this project.',
    steps: [
      'In the project, follow the step “Scope” or open Scope from the menu. You’ll see modules from Landscape.',
      'Drag or assign each module to Primary (in scope), Impacted, or Out of scope. Save to replace the full scope.',
      'Scope drives what appears in Trace and impact analysis.',
    ],
  },
  {
    icon: FileText,
    title: '5. Requirements (project)',
    summary: 'Define BO, BR, FR, NFR and link them to actors and modules.',
    steps: [
      'Open Requirements. Create requirements with a code, title, type (BO/BR/FR/NFR), and optional parent for hierarchy.',
      'Edit a requirement to change title, description, or type. Use “Assign” to set which actors and which modules (from scope) map to that requirement.',
      'BO/BR/FR/NFR structure: BO top-level; BR under BO; FR under BR; NFR can attach to BO or BR.',
    ],
  },
  {
    icon: GitBranch,
    title: '6. Trace (project)',
    summary: 'Connect requirements to modules and see the full trace view.',
    steps: [
      'Open Trace to see the trace view: landscape, scope, requirements, and trace links in one place.',
      'Use “Manage trace links” to add links: from requirement to org_node (or vice versa), with link type (e.g. implements, satisfies). Edit or delete existing links.',
      'Trace links show how requirements are implemented or satisfied by modules.',
    ],
  },
  {
    icon: MessageSquare,
    title: '7. Sessions (project)',
    summary: 'Run elicitation sessions: answer questions, improve with AI, submit.',
    steps: [
      'On the project page, click “Create session”, give it a name, then open the new session.',
      'Answer questions: go through each question and fill in your answers. Use AI improvement if available to refine answers.',
      'When done, Submit the session. Editors can Lock it (no more edits) or Reopen if needed. Create more sessions as needed.',
    ],
  },
  {
    icon: Zap,
    title: '8. Impact Analysis (project)',
    summary: 'Analyse impact using intakes and baseline.',
    steps: [
      'Open Impact. Step 1: create an intake (paste text or upload a file) so the system has content to analyse.',
      'Step 2: choose a baseline (e.g. a submitted session or revision) to compare against.',
      'Step 3: review the impact analysis results and apply changes if the feature supports it.',
    ],
  },
]

export function HelpGuideModal({ open, onClose }: HelpGuideModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="End-to-end guide"
      size="xl"
      showCloseButton
      closeOnOverlayClick
      closeOnEscape
      actions={[{ label: 'Close', onClick: onClose, variant: 'primary' }]}
    >
      <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
        {/* Flow overview with icons */}
        <div className="bg-neutral-50/80 rounded-lg border border-neutral-200 p-4">
          <Typography as="p" size="sm" weight="medium" className="mb-3 text-neutral-700">
            Recommended flow
          </Typography>
          <div className="flex flex-wrap items-center gap-2">
            {FLOW_ITEMS.map(({ icon: Icon, label }, i) => (
              <span key={i} className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600',
                    'shadow-sm'
                  )}
                  aria-hidden
                >
                  <Icon size={18} />
                </span>
                <Typography
                  as="span"
                  variant="small"
                  weight="medium"
                  className="hidden text-neutral-700 sm:inline"
                >
                  {label}
                </Typography>
                {i < FLOW_ITEMS.length - 1 && (
                  <ArrowRight size={14} className="shrink-0 text-neutral-400" aria-hidden />
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Detailed sections with icons */}
        {SECTIONS.map((section, i) => (
          <section key={i} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex gap-3">
              <span
                className={cn(
                  'bg-primary/10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-primary'
                )}
              >
                <section.icon size={20} />
              </span>
              <div>
                <Typography as="h3" size="sm" weight="semibold" className="text-neutral-900">
                  {section.title}
                </Typography>
                <Typography as="p" variant="small" tone="muted" className="mt-0.5">
                  {section.summary}
                </Typography>
              </div>
            </div>
            {section.image && (
              <div className="mb-3 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={section.image}
                  alt=""
                  className="max-h-48 w-full object-contain object-left-top"
                />
              </div>
            )}
            <ul className="space-y-2 pl-1">
              {section.steps.map((step, j) => (
                <li key={j} className="flex gap-2 text-sm text-neutral-700">
                  <ChevronRight size={14} className="text-primary/70 mt-0.5 shrink-0" aria-hidden />
                  <Typography as="span" variant="small" className="text-neutral-700">
                    {step}
                  </Typography>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  )
}
