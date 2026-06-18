export interface StepperStep {
  id: number
  label: string
  active: boolean
  /** Optional link for step (e.g. guide user to Scope / Requirements / Trace page) */
  href?: string
}

export interface StepperProps {
  steps: StepperStep[]
  className?: string
}
