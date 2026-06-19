import React from 'react'
import { cn } from '@/utils/cn'
import type { ContentLoaderProps } from './ContentLoader.types'

/**
 * Grid pattern from Figma (Scopeary loading): 2 columns × 4 rows.
 * Cell colors (row by row, left to right):
 * Row 1: white, black | Row 2: dark gray, white | Row 3: white, medium gray | Row 4: light gray, white
 */
const GRID_CELLS = [
  'bg-white',
  'bg-neutral-100',
  'bg-neutral-700',
  'bg-white',
  'bg-white',
  'bg-neutral-500',
  'bg-neutral-300',
  'bg-white',
] as const

/** 2×4 grid: 8 cells, colors driven by CSS keyframes (--loader-c0 … --loader-c7), 5-frame animation, black BG */
const EASEOUT_CELL_COUNT = 8

/**
 * ContentLoader – Loading placeholder matching Figma design (Scopeary).
 * - default: 2×4 grid + pulse.
 * - easeOut: 2×3 grid, 4-frame animation with ease-out (based on 4 variant frames).
 *
 * @example
 * ```tsx
 * <ContentLoader />
 * <ContentLoader variant="easeOut" className="w-80" />
 * ```
 */
export const ContentLoader = React.forwardRef<HTMLDivElement, ContentLoaderProps>(
  ({ variant = 'default', animated = true, width, height, className, style, ...props }, ref) => {
    const inlineStyles: React.CSSProperties = {
      ...(typeof width !== 'undefined' && {
        width: typeof width === 'number' ? `${width}px` : width,
      }),
      ...(typeof height !== 'undefined' && {
        height: typeof height === 'number' ? `${height}px` : height,
      }),
      ...style,
    }

    if (variant === 'easeOut') {
      return (
        <div
          ref={ref}
          role="status"
          aria-busy="true"
          aria-live="polite"
          aria-label="Loading content"
          className={cn(
            'content-loader-easeout grid grid-cols-2 grid-rows-4 gap-0 overflow-hidden bg-neutral-900',
            className
          )}
          style={{
            ...inlineStyles,
            // Initial frame (frame 1) so vars exist before keyframes run
            ['--loader-c0' as string]: '#ffffff',
            ['--loader-c1' as string]: 'var(--color-neutral-900)',
            ['--loader-c2' as string]: 'var(--color-neutral-700)',
            ['--loader-c3' as string]: '#ffffff',
            ['--loader-c4' as string]: '#ffffff',
            ['--loader-c5' as string]: 'var(--color-neutral-500)',
            ['--loader-c6' as string]: 'var(--color-neutral-200)',
            ['--loader-c7' as string]: '#ffffff',
          }}
          {...props}
        >
          {Array.from({ length: EASEOUT_CELL_COUNT }, (_, i) => (
            <div
              key={i}
              className="aspect-square w-full transition-colors duration-200 ease-out"
              style={{ background: `var(--loader-c${i})` }}
            />
          ))}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label="Loading content"
        className={cn(
          'grid grid-cols-2 grid-rows-4 gap-0 overflow-hidden',
          animated && 'animate-pulse',
          className
        )}
        style={Object.keys(inlineStyles).length > 0 ? inlineStyles : undefined}
        {...props}
      >
        {GRID_CELLS.map((bgClass, index) => (
          <div key={index} className={cn('aspect-square w-full', bgClass)} />
        ))}
      </div>
    )
  }
)

ContentLoader.displayName = 'ContentLoader'
