export type CurrencyAmountSize = 'sm' | 'md' | 'lg'

export interface CurrencyAmountProps {
  /** Numeric amount. Null/undefined renders an em dash when not masked. */
  amount: number | null | undefined
  /** ISO 4217 currency code (e.g. USD, VND). No implicit FX conversion. */
  currency: string
  /** BCP 47 locale for formatting. Defaults to runtime locale. */
  locale?: string
  /**
   * When true, never render the numeric value (and never as 0).
   * Shows a masked placeholder instead.
   */
  masked?: boolean
  /** Marks the value as approximate / forecast (e.g. ~ prefix). */
  approximate?: boolean
  size?: CurrencyAmountSize
  className?: string
  /** Accessible label override when masked. */
  maskedLabel?: string
}
