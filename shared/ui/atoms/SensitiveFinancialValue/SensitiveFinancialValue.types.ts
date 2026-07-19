import type { CurrencyAmountSize } from '../CurrencyAmount'

export const SensitiveFinancialState = {
  Visible: 'visible',
  Masked: 'masked',
  Unavailable: 'unavailable',
  MixedCurrency: 'mixedCurrency',
  PermissionRequired: 'permissionRequired',
} as const

export type SensitiveFinancialState =
  (typeof SensitiveFinancialState)[keyof typeof SensitiveFinancialState]

export interface SensitiveFinancialValueProps {
  state: SensitiveFinancialState
  amount?: number | null
  currency?: string
  locale?: string
  approximate?: boolean
  size?: CurrencyAmountSize
  className?: string
  /** Custom message for permission / unavailable / mixed states */
  message?: string
}
