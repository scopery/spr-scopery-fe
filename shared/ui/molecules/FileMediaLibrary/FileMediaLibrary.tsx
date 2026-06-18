import React from 'react'
import { cn } from '@/utils'
import { Box } from '@/shared/ui/atoms/Box'
import { Stack } from '@/shared/ui/atoms/Stack'
import { Typography } from '@/shared/ui/atoms/Typography'
import { Button } from '@/shared/ui/atoms/Button'
import { Plus, Share2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { FileMediaLibraryProps } from './FileMediaLibrary.types'

/**
 * FileMediaLibrary component - File and media library with folder preview
 *
 * @example
 * ```tsx
 * <FileMediaLibrary
 *   folder={{
 *     name: 'Visual Vault',
 *     fileCount: 362,
 *     description: 'A curated collection of all creative essentials',
 *     previewImages: ['/img1.jpg', '/img2.jpg', '/img3.jpg']
 *   }}
 *   onAdd={() => console.log('Add clicked')}
 *   onShare={() => console.log('Share clicked')}
 *   onAction={() => console.log('Open clicked')}
 * />
 * ```
 */
export const FileMediaLibrary = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      as,
      title = 'File & media library',
      folder = { name: '', fileCount: 0 },
      actionLabel = 'Open the folder',
      onAdd,
      onShare,
      onAction,
      onPrevious,
      onNext,
      cardBorderRadius = 'lg',
      cardShadow = 'md',
      className,
      ...props
    }: FileMediaLibraryProps<C>,
    ref?: React.Ref<HTMLDivElement>
  ) => {
    const Component = as || 'div'

    return (
      <Component ref={ref} {...props}>
        <Box
          background="white"
          radius={cardBorderRadius}
          shadow={cardShadow}
          className={cn('w-full p-5', className)}
        >
          {/* Header */}
          <Stack direction="horizontal" justify="between" align="center" className="mb-6">
            <Typography variant="h6" weight="semibold" className="text-neutral-900">
              {title}
            </Typography>
            <Stack direction="horizontal" spacing="sm" align="center">
              {onAdd && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon={<Plus size={20} />}
                  onClick={onAdd}
                  className="text-neutral-600 hover:text-neutral-900"
                  aria-label="Add file"
                />
              )}
              {onShare && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon={<Share2 size={20} />}
                  onClick={onShare}
                  className="text-neutral-600 hover:text-neutral-900"
                  aria-label="Share"
                />
              )}
            </Stack>
          </Stack>

          {/* Folder Preview Section */}
          <Box display="block" className="relative mb-6">
            <Stack direction="horizontal" spacing="none" align="center" justify="center" className="relative">
              {/* Previous Button */}
              {onPrevious && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon={<ChevronLeft size={20} />}
                  onClick={onPrevious}
                  className="absolute left-0 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-full z-10"
                  aria-label="Previous"
                />
              )}

              {/* Folder with SVG Illustration */}
              <Box display="block" className="relative mx-8">
                <Box
                  display="block"
                  className="relative w-[280px] h-[200px] rounded-lg"
                >
                  <img
                    src="/illustrations/media-folder.svg"
                    alt="Media folder"
                    className="w-full h-full object-contain"
                  />
                </Box>
              </Box>

              {/* Next Button */}
              {onNext && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon={<ChevronRight size={20} />}
                  onClick={onNext}
                  className="absolute right-0 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-full z-10"
                  aria-label="Next"
                />
              )}
            </Stack>
          </Box>

          {/* Folder Info */}
          <Stack direction="vertical" spacing="sm" className="mb-6 text-center">
            <Typography variant="h6" weight="semibold" className="text-[#2d5016]">
              {folder.name}
            </Typography>
            {folder.description && (
              <Typography variant="body" className="text-neutral-700 text-sm leading-relaxed">
                {folder.description}
              </Typography>
            )}
          </Stack>

          {/* Action Button */}
          {onAction && (
            <Box display="block" className="text-center">
              <Button
                variant="primary"
                onClick={onAction}
                className="bg-lime-800 hover:bg-lime-700 text-white px-6 py-2 rounded-full"
              >
                {actionLabel}
              </Button>
            </Box>
          )}
        </Box>
      </Component>
    )
  }
)

FileMediaLibrary.displayName = 'FileMediaLibrary'

