import { PolymorphicComponentPropWithRef } from '@/utils/polymorphic'

export type SelectSize = 'sm' | 'md' | 'lg'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export type SelectProps<C extends React.ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  {
    /**
     * Options for the select
     * @default []
     */
    options?: SelectOption[]
    /**
     * Selected value
     */
    value?: string
    /**
     * Default value
     */
    defaultValue?: string
    /**
     * Placeholder text
     */
    placeholder?: string
    /**
     * Select size
     * @default 'md'
     */
    size?: SelectSize
    /**
     * Whether select is disabled
     * @default false
     */
    disabled?: boolean
    /**
     * Callback when value changes
     */
    onValueChange?: (value: string) => void
  }
>
