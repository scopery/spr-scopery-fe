import React from 'react'
import { cn } from '@/utils/cn'
import { Box } from '@/shared/ui/atoms/Box'
import { Stack } from '@/shared/ui/atoms/Stack'
import { Typography } from '@/shared/ui/atoms/Typography'
import { Select } from '@/shared/ui/atoms/Select'
import type { ProjectOverviewProps, ProjectStep } from './ProjectOverview.types'

/**
 * ProjectOverview component - Timeline progress with steps, badge, and metrics
 */
export const ProjectOverview = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      as,
      title = 'Project overview',
      description,
      badgeText,
      selectOptions,
      selectedValue,
      onSelectChange,
      progress = 0.6,
      steps = [],
      currentStepNote,
      metrics,
      cardBorderRadius = 'lg',
      cardShadow = 'sm',
      className,
      ...props
    }: ProjectOverviewProps<C>,
    ref?: React.Ref<HTMLDivElement>
  ) => {
    const Component = as || 'div'
    const clampedProgress = Math.min(Math.max(progress, 0), 1)

    const calculateLineHeight = (
      stepPosition: number,
      progress: number,
      stepIndex: number
    ): number => {
      // Base height for the line (180px as per design)
      const baseHeight = 180
      // Max height constraint
      const maxHeight = 200
      // Track height
      const trackHeight = 63
      // Calculate how far the step is from the progress
      const stepProgress = stepPosition
      const progressRatio = progress

      // Add variation based on step index to create natural variation
      // Variation range: -15px to +15px
      const variation = (stepIndex % 3) * 8 - 8 // Creates pattern: -8, 0, 8, -8, 0, 8...

      // If step is before or at progress, line extends down from track
      if (stepProgress <= progressRatio) {
        // Line extends from track bottom with variation, but capped at maxHeight
        return Math.min(baseHeight + variation, maxHeight)
      }
      // If step is after progress, line is shorter
      // Calculate based on distance from progress
      const distanceFromProgress = stepProgress - progressRatio
      // Reduce height proportionally with variation, but capped at maxHeight
      const calculatedHeight = baseHeight * (1 - distanceFromProgress * 0.5) + variation
      return Math.min(Math.max(trackHeight, calculatedHeight), maxHeight)
    }

    const renderStep = (step: ProjectStep, index: number) => {
      const isCompleted = step.status === 'completed'
      const isCurrent = step.status === 'current'
      const dotTone = isCompleted || isCurrent ? 'bg-white' : 'bg-[#bfdacc]'
      const dateTone = isCurrent ? 'text-[#c6f6a2]' : 'text-[#bfdacc]'
      const lineHeight = calculateLineHeight(step.position, clampedProgress, index)

      return (
        <Box className="w-fit flex-col items-center justify-center">
          {step.date && (
            <Box
              display="block"
              className="mx-1 w-px bg-[#cfe1d7]"
              style={{ height: `${lineHeight}px` }}
            />
          )}
          {step.date && (
            <Box display="flex" className="items-start">
              <Box display="block" className={cn('h-2 w-2  rounded-full', dotTone)} />
              <Box display="flex" className="items-center justify-center px-2">
                <Typography variant="small" className={cn('text-[11px]', dateTone)}>
                  {step.date}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )
    }

    return (
      <Component ref={ref} {...props}>
        <Box
          background="transparent"
          radius={cardBorderRadius}
          shadow={cardShadow}
          className={cn('flex flex-col gap-[10px] bg-[#15543d] p-[20px]', className)}
        >
          {/* Header */}
          <Stack direction="horizontal" justify="between" align="center" className="w-full">
            <Stack direction="vertical" spacing="xs" className="gap-[4px]">
              <Typography variant="h6" weight="semibold" className="leading-snug text-white">
                {title}
              </Typography>
              {description && (
                <Typography
                  variant="small"
                  className="max-w-[520px] leading-relaxed text-[#bfdacc]"
                >
                  {description}
                </Typography>
              )}
            </Stack>
            {(selectOptions || badgeText) && (
              <Box display="block" className="flex-shrink-0">
                <Select
                  options={
                    selectOptions || (badgeText ? [{ value: badgeText, label: badgeText }] : [])
                  }
                  value={selectedValue || badgeText}
                  onValueChange={onSelectChange}
                  size="sm"
                  className="h-auto rounded-full border border-[#a3cf5b] bg-[rgba(213,245,160,0.49)] px-[12px] py-[8px] text-white shadow-[0px_2px_4px_rgba(0,0,0,0.05)] [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-0 [&_button]:py-0 [&_button]:text-white [&_button]:shadow-none"
                />
              </Box>
            )}
          </Stack>

          {/* Timeline */}
          <Box display="block" className="relative min-h-[220px] w-full">
            {/* Step labels */}
            {steps.length > 0 && (
              <Stack
                direction="horizontal"
                justify="between"
                className="px-[10px] pb-[6px] text-[#bfdacc]"
              >
                {steps.map((step) => (
                  <Box
                    key={step.id}
                    display="block"
                    className="flex w-full -translate-x-8 justify-center"
                  >
                    <Typography
                      key={`label-${step.id}`}
                      variant="small"
                      className="text-xs text-[#bfdacc]"
                    >
                      {step.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}

            {/* Track */}
            <Box
              display="block"
              className="relative h-[63px] w-full rounded-[10px]"
              style={{ backgroundColor: '#D3D3D338' }}
              data-testid="project-track"
            >
              <Box
                display="block"
                className="absolute inset-y-0 left-0 rounded-[10px]"
                style={{
                  width: `${clampedProgress * 100}%`,
                  background: 'linear-gradient(90deg, #d5f5a0 0%, #eaffca 60%, #EAFFCA 100%)',
                }}
                data-testid="progress-bar"
              />

              {/* Step markers */}
              <Box display="block" className="absolute inset-0">
                <Box display="flex" className="relative h-full w-full justify-between">
                  {steps.map((step, index) => (
                    <Box key={step.id} display="block" className="flex w-full justify-center">
                      {renderStep(step, index)}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Current Step Note and Metrics */}
          <Stack direction="horizontal" spacing="lg" className="mt-[16px] w-full" align="end">
            <Box display="block" className="flex-1 leading-relaxed text-[#bfdacc]">
              <Typography variant="small" className=" mb-[6px] text-[#bfdacc]">
                Current Step:
              </Typography>
              {currentStepNote && (
                <Typography variant="small" className=" whitespace-pre-wrap text-[#bfdacc]">
                  {currentStepNote}
                </Typography>
              )}
            </Box>

            {metrics && (metrics.failsValue || metrics.dueValue) && (
              <Box
                display="flex"
                className="min-w-[96px] flex-col rounded-[10px] border border-[rgba(255,255,255,0.33)] text-[#bfdacc]"
              >
                <Box display="block" className="p-[10px]">
                  <Typography variant="small" className="text-[#bfdacc]">
                    {metrics.failsLabel || 'FAILS'}
                  </Typography>
                  <Typography variant="h6" weight="semibold" className=" text-white">
                    {metrics.failsValue || '0'}
                  </Typography>
                </Box>
                <Box display="block" className="h-px w-full bg-[rgba(255,255,255,0.33)]" />
                <Box display="block" className="p-[10px]">
                  <Typography variant="small" className=" text-[#bfdacc]">
                    {metrics.dueLabel || 'DUE'}
                  </Typography>
                  <Typography variant="h6" weight="semibold" className=" text-white">
                    {metrics.dueValue || 'Apr 28th'}
                  </Typography>
                </Box>
              </Box>
            )}
          </Stack>
        </Box>
      </Component>
    )
  }
)

ProjectOverview.displayName = 'ProjectOverview'
