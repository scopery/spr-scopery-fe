export interface ClientVisibilityToggleProps {
  visibleToClient: boolean
  onChange?: (visible: boolean) => void
  /** Explanation of what the external client will see. */
  explanation?: string
  disabled?: boolean
  className?: string
}
