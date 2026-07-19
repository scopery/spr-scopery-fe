export interface FilterOption<T extends string = string> {
  value: T
  label: string
  disabled?: boolean
}

export interface FilterProps<T extends string = string> {
  options: FilterOption<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label'?: string
  className?: string
}
