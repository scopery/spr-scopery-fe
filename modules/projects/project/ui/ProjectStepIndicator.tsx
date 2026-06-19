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
    <div className="mb-6 flex flex-col gap-4 border-b-[1px] border-neutral-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
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
        <div className="mt-4 flex shrink-0 items-center gap-2 sm:mt-0">{rightContent}</div>
      )}
    </div>
  )
}
