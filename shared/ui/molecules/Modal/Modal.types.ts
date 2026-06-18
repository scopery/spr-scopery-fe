import { PolymorphicComponentPropWithRef } from '@/utils'
import { ButtonProps } from '@/shared/ui/atoms/Button'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalAction {
  label: string
  onClick: () => void
  variant?: ButtonProps['variant']
  tone?: ButtonProps['tone']
  disabled?: boolean
  loading?: boolean
}

export type ModalProps<C extends React.ElementType = 'div'> =
  PolymorphicComponentPropWithRef<
    C,
    {
      /**
       * Whether the modal is open
       * @default false
       */
      open?: boolean
      /**
       * Callback when modal should close
       */
      onClose?: () => void
      /**
       * Modal title
       */
      title?: string
      /**
       * Modal size
       * @default 'md'
       */
      size?: ModalSize
      /**
       * Action buttons in footer
       */
      actions?: ModalAction[]
      /**
       * Whether to show close button
       * @default true
       */
      showCloseButton?: boolean
      /**
       * Whether clicking overlay closes modal
       * @default true
       */
      closeOnOverlayClick?: boolean
      /**
       * Whether pressing ESC closes modal
       * @default true
       */
      closeOnEscape?: boolean
    }
  >

