'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'
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
  '2xl': 'max-w-4xl',
  full: 'max-w-full',
}

/**
 * Modal component - Dialog overlay with header, scrollable body, and footer.
 * Always portals to `document.body` so the dimmed backdrop covers the full viewport
 * (AppShell uses overflow/transform ancestors that would otherwise clip `fixed`).
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
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
      setMounted(true)
    }, [])

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

    if (!open || !mounted) return null

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget && onClose) {
        onClose()
      }
    }

    const node = (
      <Component ref={ref} {...props}>
        {/* Overlay — full viewport dim */}
        <Box
          display="flex"
          className={cn(
            'fixed inset-0 z-[100] items-center justify-center p-md',
            'bg-neutral-900/50 backdrop-blur-sm',
            'transition-opacity duration-[var(--motion-panel)] ease-[var(--ease-enter)]'
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
              'relative flex max-h-[90vh] w-full flex-col',
              modalSizes[size],
              'transition-all duration-[var(--motion-panel)] ease-[var(--ease-enter)]'
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
                    <Typography id="modal-title" variant="h6" weight="semibold" className="flex-1">
                      {title}
                    </Typography>
                  )}
                  {showCloseButton && onClose && (
                    <Button
                      variant="ghost"
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
              className="min-h-0 flex-1 overflow-y-auto text-sm"
            >
              {children}
            </Box>

            {/* Footer - Fixed */}
            {actions.length > 0 && (
              <>
                <Divider />
                <Box display="flex" paddingX="lg" paddingY="md" className="flex-shrink-0">
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

    return createPortal(node, document.body)
  }
)

Modal.displayName = 'Modal'
