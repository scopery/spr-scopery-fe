import { PolymorphicComponentPropWithRef } from '@/utils'

export type ProjectStepStatus = 'completed' | 'current' | 'upcoming'

export interface ProjectStep {
  id: string
  label: string
  date: string
  /**
   * Position on the timeline from 0 to 1
   */
  position: number
  status?: ProjectStepStatus
}

export interface ProjectOverviewMetrics {
  failsLabel?: string
  failsValue?: string
  dueLabel?: string
  dueValue?: string
}

export type ProjectOverviewProps<C extends React.ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  {
  /**
   * Title of the project overview
   */
  title?: string
  /**
   * Description text
   */
  description?: string
  /**
   * Badge text on the top-right (deprecated, use selectOptions instead)
   * @deprecated Use selectOptions instead
   */
  badgeText?: string
  /**
   * Options for the dropdown select on the top-right
   */
  selectOptions?: Array<{ value: string; label: string }>
  /**
   * Selected value for the dropdown
   */
  selectedValue?: string
  /**
   * Callback when dropdown value changes
   */
  onSelectChange?: (value: string) => void
  /**
   * Current progress ratio (0 to 1) for the gradient bar
   * @default 0.6
   */
  progress?: number
  /**
   * Steps shown on the timeline
   */
  steps?: ProjectStep[]
  /**
   * Current step notes text
   */
  currentStepNote?: string
  /**
   * Metrics card on the right
   */
  metrics?: ProjectOverviewMetrics
  /**
   * Border radius for the card container
   */
  cardBorderRadius?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  /**
   * Shadow for the card container
   */
  cardShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  }
>

