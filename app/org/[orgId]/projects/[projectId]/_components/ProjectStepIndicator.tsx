'use client'

import { Typography, Stepper } from '@/shared/ui'
import type { StepperStep } from '@/shared/ui'

/** Project flow steps */
export const PROJECT_FLOW_STEP_IDS = {
  overview: 1,
  questions: 2,
  sessions: 3,
  documents: 4,
} as const

/** Build project flow steps with links. */
export function buildProjectFlowSteps(
  _orgId: string,
  _projectId: string,
  activeStepId: number,
  routes: {
    project: string
    questions: string
    sessions: string
    documents: string
  }
): StepperStep[] {
  return [
    { id: 1, label: 'Overview', active: activeStepId === 1, href: routes.project },
    { id: 2, label: 'Questions', active: activeStepId === 2, href: routes.questions },
    { id: 3, label: 'Sessions', active: activeStepId === 3, href: routes.sessions },
    { id: 4, label: 'Documents', active: activeStepId === 4, href: routes.documents },
  ]
}

const DEFAULT_STEPS: StepperStep[] = [
  { id: 1, label: 'Overview', active: true },
  { id: 2, label: 'Questions', active: false },
  { id: 3, label: 'Sessions', active: false },
  { id: 4, label: 'Documents', active: false },
]

interface ProjectStepIndicatorProps {
  title?: string
  description?: string
  badges?: React.ReactNode
  leftMeta?: React.ReactNode
  rightContent?: React.ReactNode
  hideStepper?: boolean
  steps?: StepperStep[]
  stepperPosition?: 'top' | 'bottom'
}

export function ProjectStepIndicator({
  title,
  description,
  badges,
  leftMeta,
  rightContent,
  hideStepper,
  steps: customSteps,
  stepperPosition = 'bottom',
}: ProjectStepIndicatorProps) {
  const steps = customSteps ?? DEFAULT_STEPS
  const showStepper = !hideStepper
  const stepperNode = showStepper ? (
    <Stepper steps={steps} className={stepperPosition === 'top' ? 'mb-4' : 'mt-4'} />
  ) : null

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b-[1px] border-neutral-200 pb-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <Typography as="h1" size="xl" weight="bold">
            {title}
          </Typography>
          {badges}
        </div>
        {description && (
          <Typography tone="muted" className="mb-2">
            {description}
          </Typography>
        )}
        {stepperPosition === 'top' && stepperNode}
        {leftMeta}
        {stepperPosition === 'bottom' && stepperNode}
      </div>
      {rightContent && (
        <div className="flex items-center gap-2 shrink-0 mt-4 sm:mt-0">
          {rightContent}
        </div>
      )}
    </div>
  )
}
