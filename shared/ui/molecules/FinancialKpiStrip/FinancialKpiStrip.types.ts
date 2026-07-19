import type { ReactNode } from 'react'
import type { SensitiveFinancialState } from '../../atoms/SensitiveFinancialValue'

export type FinancialKpiStripMode = 'compact' | 'expanded'

export interface FinancialKpiItem {
  id: string
  label: string
  /** Pre-rendered value (e.g. CurrencyAmount / SensitiveFinancialValue). */
  value: ReactNode
  /** Optional delta text or node (e.g. "+12%"). */
  delta?: ReactNode
  /** Positive / negative / neutral hint for delta color (never sole signal). */
  deltaTone?: 'positive' | 'negative' | 'neutral'
  /** Optional footnote (formula timestamp, version, etc.). */
  footnote?: string
  /** Sensitive state hint for a11y when value is masked. */
  sensitiveState?: SensitiveFinancialState
}

export interface FinancialKpiStripProps {
  items: FinancialKpiItem[]
  mode?: FinancialKpiStripMode
  className?: string
  'aria-label'?: string
}
