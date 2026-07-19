export interface EntityReferenceOption {
  id: string
  type: string
  code?: string | null
  title: string
  status?: string | null
  scopeLabel?: string | null
  classification?: string | null
}

export interface EntityReferencePickerProps {
  options: EntityReferenceOption[]
  value?: EntityReferenceOption | null
  onChange?: (option: EntityReferenceOption | null) => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  emptyLabel?: string
  className?: string
  'aria-label'?: string
}
