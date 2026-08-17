import React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '@/utils/cn'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
import { uiControl, uiDropdownPanel } from '../../styles/ui-surface'
import type { SelectProps, SelectSize } from './Select.types'

/** Radix Select rejects empty string item values; map them to a sentinel. */
const EMPTY_OPTION_VALUE = '__scopery_select_empty__'

function toItemValue(value: string): string {
  return value === '' ? EMPTY_OPTION_VALUE : value
}

function fromItemValue(value: string): string {
  return value === EMPTY_OPTION_VALUE ? '' : value
}

function normalizeRootValue(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  return value === '' ? EMPTY_OPTION_VALUE : value
}

/** Keep in sync with Button / Input: sm h-8, md h-9, lg h-12 */
const selectSizes: Record<SelectSize, { trigger: string; content: string; item: string }> = {
  sm: {
    trigger: 'h-8 px-3 text-sm',
    content: 'min-w-[8rem]',
    item: 'text-sm py-2 px-3',
  },
  md: {
    trigger: 'h-9 px-3 text-[13px]',
    content: 'min-w-[10rem]',
    item: 'text-sm py-2 px-3',
  },
  lg: {
    trigger: 'h-12 px-4 text-base',
    content: 'min-w-[12rem]',
    item: 'text-base py-2.5 px-4',
  },
}

/**
 * Select component - Dropdown select with Radix UI
 *
 * @example
 * ```tsx
 * <Select
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' },
 *   ]}
 *   value={value}
 *   onValueChange={setValue}
 *   placeholder="Select an option"
 * />
 * ```
 */
export const Select = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      as,
      options = [],
      value,
      defaultValue,
      placeholder = 'Select...',
      size = 'md',
      disabled = false,
      onValueChange,
      className,
      ...props
    }: SelectProps<C>,
    ref?: React.Ref<HTMLDivElement>
  ) => {
    const Component = as || 'div'
    const [open, setOpen] = React.useState(false)
    const hasEmptyOption = options.some((option) => option.value === '')
    const rootValue =
      value === undefined || value === ''
        ? hasEmptyOption
          ? EMPTY_OPTION_VALUE
          : undefined
        : value

    return (
      <Component ref={ref} className={cn('block w-full min-w-0', className)} {...props}>
        <SelectPrimitive.Root
          value={rootValue}
          defaultValue={normalizeRootValue(defaultValue)}
          onValueChange={(next) => onValueChange?.(fromItemValue(next))}
          disabled={disabled}
          open={open}
          onOpenChange={setOpen}
        >
          <SelectPrimitive.Trigger
            className={cn(
              uiControl,
              'flex w-full min-w-0 items-center justify-between gap-2',
              'overflow-hidden text-neutral-900',
              'transition-colors duration-200',
              selectSizes[size].trigger
            )}
            aria-label="Select option"
          >
            {/* Wrapper required: Radix Value often ignores its own className for truncate. */}
            <span className="min-w-0 flex-1 overflow-hidden text-left [&>span]:block [&>span]:truncate">
              <SelectPrimitive.Value placeholder={placeholder} />
            </span>
            <SelectPrimitive.Icon className="shrink-0">
              <ChevronDown size={16} className={cn('transition-transform', open && 'rotate-180')} />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className={cn(
                uiDropdownPanel,
                'relative z-[200] overflow-hidden shadow-lg',
                'w-[var(--radix-select-trigger-width)] max-h-[min(24rem,var(--radix-select-content-available-height))]',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
                'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                selectSizes[size].content
              )}
              position="popper"
              sideOffset={4}
              collisionPadding={12}
            >
              <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center text-neutral-500">
                <ChevronUp size={14} />
              </SelectPrimitive.ScrollUpButton>
              <SelectPrimitive.Viewport className="max-h-[min(20rem,var(--radix-select-content-available-height))] overflow-y-auto p-1">
                {options.map((option) => {
                  const itemValue = toItemValue(option.value)
                  return (
                    <SelectPrimitive.Item
                      key={itemValue}
                      value={itemValue}
                      disabled={option.disabled}
                      className={cn(
                        'relative flex cursor-pointer select-none items-center pr-8',
                        'outline-none focus:bg-neutral-100 focus:text-neutral-900',
                        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                        selectSizes[size].item
                      )}
                    >
                      <SelectPrimitive.ItemText className="min-w-0 truncate">
                        {option.label}
                      </SelectPrimitive.ItemText>
                      <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center">
                        <Check size={16} />
                      </SelectPrimitive.ItemIndicator>
                    </SelectPrimitive.Item>
                  )
                })}
              </SelectPrimitive.Viewport>
              <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center text-neutral-500">
                <ChevronDown size={14} />
              </SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </Component>
    )
  }
)

Select.displayName = 'Select'
