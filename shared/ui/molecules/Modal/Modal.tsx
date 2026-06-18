import React from 'react'
import { cn } from '@/utils'
import { Box } from '@/shared/ui/atoms/Box'
import { Stack } from '@/shared/ui/atoms/Stack'
import { Typography } from '@/shared/ui/atoms/Typography'
import { Button } from '@/shared/ui/atoms/Button'
import { Divider } from '@/shared/ui/atoms/Divider'
import { X } from 'lucide-react'
import type { ModalProps, ModalSize } from './Modal.types'

const modalSizes: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
}

/**
 * Modal component - Dialog overlay with header, scrollable body, and footer
 *
 * @example
 * ```tsx
 * <Modal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   actions={[
 *     { label: 'Cancel', onClick: () => setIsOpen(false), variant: 'ghost' },
 *     { label: 'Confirm', onClick: handleConfirm, variant: 'primary' }
 *   ]}
 * >
 *   <Typography>Are you sure you want to proceed?</Typography>
 * </Modal>
 * ```
 */
export const Modal = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      as,
      open = false,
      onClose,
      title,
      size = 'md',
      actions = [],
      showCloseButton = true,
      closeOnOverlayClick = true,
      closeOnEscape = true,
      className: _className,
      children,
      ...props
    }: ModalProps<C>,
    ref?: React.Ref<HTMLDivElement>
  ) => {
    const Component = as || 'div'

    // Handle ESC key
    React.useEffect(() => {
      if (!open || !closeOnEscape || !onClose) return

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [open, closeOnEscape, onClose])

    // Prevent body scroll when modal is open
    React.useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      return () => {
        document.body.style.overflow = ''
      }
    }, [open])

    if (!open) return null

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget && onClose) {
        onClose()
      }
    }

    return (
      <Component ref={ref} {...props}>
        {/* Overlay */}
        <Box
          display="flex"
          className={cn(
            'fixed inset-0 z-50 items-center justify-center',
            'bg-black/50 backdrop-blur-sm',
            'transition-opacity duration-200'
          )}
          onClick={handleOverlayClick}
          aria-modal="true"
          role="dialog"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {/* Modal Container */}
          <Box
            display="flex"
            background="white"
            shadow="xl"
            className={cn(
              'flex flex-col max-h-[90vh] w-full',
              modalSizes[size],
              'transform transition-all duration-200'
            )}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Header - Fixed */}
            {(title || showCloseButton) && (
              <Box
                display="flex"
                paddingX="lg"
                paddingY="md"
                className="flex-shrink-0 border-b border-neutral-200"
              >
                <Stack
                  direction="horizontal"
                  spacing="none"
                  justify="between"
                  align="center"
                  className="w-full"
                >
                  {title && (
                    <Typography
                      id="modal-title"
                      variant="h6"
                      weight="semibold"
                      className="flex-1"
                    >
                      {title}
                    </Typography>
                  )}
                  {showCloseButton && onClose && (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={<X size={20} />}
                      onClick={onClose}
                      className="ml-auto text-neutral-400"
                      aria-label="Close modal"
                    />
                  )}
                </Stack>
              </Box>
            )}

            {/* Body - Scrollable */}
            <Box
              display="block"
              paddingX="lg"
              paddingY="md"
              className="flex-1 overflow-y-auto min-h-0 text-sm"
            >
              {children}
            </Box>

            {/* Footer - Fixed */}
            {actions.length > 0 && (
              <>
                <Divider />
                <Box
                  display="flex"
                  paddingX="lg"
                  paddingY="md"
                  className="flex-shrink-0"
                >
                  <Stack
                    direction="horizontal"
                    spacing="sm"
                    justify="end"
                    align="center"
                    className="w-full"
                  >
                    {actions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || 'primary'}
                        tone={action.tone}
                        size="md"
                        disabled={action.disabled}
                        loading={action.loading}
                        onClick={action.onClick}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Component>
    )
  }
)

Modal.displayName = 'Modal'

