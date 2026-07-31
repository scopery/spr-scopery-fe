'use client'

import {
  Activity,
  AlertTriangle,
  Calendar,
  FileSearch,
  FileText,
  FolderKanban,
  HelpCircle,
  ListTodo,
  Sparkles,
} from 'lucide-react'
import { Card, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

export type AiLandingMode = 'project' | 'document' | 'general'

export interface AiLandingPrompt {
  id: string
  title: string
  description: string
  prompt: string
  icon?:
    | 'health'
    | 'changes'
    | 'overdue'
    | 'risks'
    | 'weekly'
    | 'milestone'
    | 'summarize'
    | 'requirements'
    | 'tasks'
    | 'sections'
    | 'ask'
    | 'workspace'
    | 'pick-project'
    | 'pick-docs'
    | 'general'
}

const PROJECT_PROMPTS: AiLandingPrompt[] = [
  {
    id: 'health',
    title: 'Analyze project health',
    description: 'Health & delays',
    prompt: 'Analyze project health and identify the main blockers and delays.',
    icon: 'health',
  },
  {
    id: 'changes',
    title: 'Summarize recent changes',
    description: 'What moved lately',
    prompt: 'Summarize recent changes across this project.',
    icon: 'changes',
  },
  {
    id: 'overdue',
    title: 'Find overdue work',
    description: 'Tasks behind schedule',
    prompt: 'Find overdue work and explain why it is delayed.',
    icon: 'overdue',
  },
  {
    id: 'risks',
    title: 'Review risks',
    description: 'Open risks & impact',
    prompt: 'Review open risks and highlight the highest impact items.',
    icon: 'risks',
  },
  {
    id: 'weekly',
    title: 'Generate weekly report',
    description: 'Status narrative',
    prompt: 'Generate a concise weekly status report for this project.',
    icon: 'weekly',
  },
  {
    id: 'milestone',
    title: 'Plan next milestone',
    description: 'Tasks & risks',
    prompt: 'Plan the next milestone including key tasks and risks.',
    icon: 'milestone',
  },
]

const DOCUMENT_PROMPTS: AiLandingPrompt[] = [
  {
    id: 'summarize',
    title: 'Summarize',
    description: 'Key points',
    prompt: 'Summarize this document.',
    icon: 'summarize',
  },
  {
    id: 'requirements',
    title: 'Extract requirements',
    description: 'Find gaps',
    prompt: 'Extract requirements from this document and note any gaps.',
    icon: 'requirements',
  },
  {
    id: 'tasks',
    title: 'Extract tasks',
    description: 'Actionable work',
    prompt: 'Extract actionable tasks from this document.',
    icon: 'tasks',
  },
  {
    id: 'doc-risks',
    title: 'Find risks',
    description: 'Risk signals',
    prompt: 'Find risks mentioned or implied in this document.',
    icon: 'risks',
  },
  {
    id: 'sections',
    title: 'Check missing sections',
    description: 'Completeness',
    prompt: 'Check this document for missing or incomplete sections.',
    icon: 'sections',
  },
  {
    id: 'ask',
    title: 'Ask a question',
    description: 'Open-ended',
    prompt: 'I have a question about this document.',
    icon: 'ask',
  },
]

const GENERAL_PROMPTS: AiLandingPrompt[] = [
  {
    id: 'workspace',
    title: 'Current workspace',
    description: 'Orient me',
    prompt: 'Help me understand what I should focus on in this workspace.',
    icon: 'workspace',
  },
  {
    id: 'pick-project',
    title: 'Select a project',
    description: 'Ground in a project',
    prompt: 'Help me pick a project to work on with AI.',
    icon: 'pick-project',
  },
  {
    id: 'pick-docs',
    title: 'Select documents',
    description: 'Add context',
    prompt: 'Help me select documents to use as context.',
    icon: 'pick-docs',
  },
  {
    id: 'general',
    title: 'General question',
    description: 'Anything else',
    prompt: 'I have a general question.',
    icon: 'general',
  },
]

function PromptIcon({ icon }: { icon?: AiLandingPrompt['icon'] }) {
  const cls = 'shrink-0 text-primary'
  switch (icon) {
    case 'health':
      return <Activity size={18} className={cls} />
    case 'changes':
      return <FileSearch size={18} className={cls} />
    case 'overdue':
      return <ListTodo size={18} className={cls} />
    case 'risks':
      return <AlertTriangle size={18} className={cls} />
    case 'weekly':
      return <Calendar size={18} className={cls} />
    case 'milestone':
      return <Sparkles size={18} className={cls} />
    case 'summarize':
      return <FileText size={18} className={cls} />
    case 'requirements':
      return <FileSearch size={18} className={cls} />
    case 'tasks':
      return <ListTodo size={18} className={cls} />
    case 'sections':
      return <FileText size={18} className={cls} />
    case 'ask':
      return <HelpCircle size={18} className={cls} />
    case 'workspace':
      return <Sparkles size={18} className={cls} />
    case 'pick-project':
      return <FolderKanban size={18} className={cls} />
    case 'pick-docs':
      return <FileText size={18} className={cls} />
    default:
      return <Sparkles size={18} className={cls} />
  }
}

export function landingPromptsFor(mode: AiLandingMode): AiLandingPrompt[] {
  if (mode === 'document') return DOCUMENT_PROMPTS
  if (mode === 'project') return PROJECT_PROMPTS
  return GENERAL_PROMPTS
}

interface AiWorkspaceLandingProps {
  mode: AiLandingMode
  contextLabel: string
  recent: Array<{ id: string; title: string; when: string }>
  disabled?: boolean
  onSelectPrompt: (prompt: AiLandingPrompt) => void
  onOpenRecent: (id: string) => void
}

export function AiWorkspaceLanding({
  mode,
  contextLabel,
  recent,
  disabled = false,
  onSelectPrompt,
  onOpenRecent,
}: AiWorkspaceLandingProps) {
  const prompts = landingPromptsFor(mode)
  const heading =
    mode === 'document'
      ? `Work with ${contextLabel}`
      : mode === 'project'
        ? `Work with ${contextLabel}`
        : 'What do you want to work on?'

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="mx-auto w-full max-w-[880px] px-4 py-10 md:px-6">
        <div className="mb-8 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary-gradient text-white">
            <Sparkles size={18} />
          </span>
          <div>
            <Typography as="h1" className="font-calsans text-2xl font-bold text-neutral-900">
              {heading}
            </Typography>
            <Typography variant="small" tone="muted" className="mt-1 block">
              Pick a starting point or type your own question below.
            </Typography>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((item) => (
            <Card
              as="button"
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPrompt(item)}
              className={cn(
                'group p-4 text-left transition-all',
                'hover:border-primary/30 hover:shadow-sm',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              <PromptIcon icon={item.icon} />
              <Typography as="span" className="mt-3 block text-sm font-medium text-neutral-900">
                {item.title}
              </Typography>
              <Typography as="span" variant="caption" tone="muted" className="mt-1 block">
                {item.description}
              </Typography>
            </Card>
          ))}
        </div>

        {recent.length > 0 ? (
          <div className="mt-10">
            <Typography variant="small" weight="medium" className="mb-3 text-neutral-700">
              Recent work
            </Typography>
            <ul className="divide-y divide-neutral-100 border border-neutral-200 bg-white">
              {recent.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50"
                    onClick={() => onOpenRecent(item.id)}
                  >
                    <Typography as="span" variant="small" className="truncate text-neutral-800">
                      {item.title}
                    </Typography>
                    <Typography as="span" variant="caption" tone="muted" className="shrink-0">
                      {item.when}
                    </Typography>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
