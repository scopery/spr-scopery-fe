'use client'

import type { TElement } from 'platejs'
import type { TCalloutElement, TLinkElement } from '@platejs/utils'
import { useTodoListElement, useTodoListElementState } from '@platejs/list/react'
import { useLink } from '@platejs/link/react'
import { useTableCellElement, useTableElement } from '@platejs/table/react'
import { useToggleButton, useToggleButtonState } from '@platejs/toggle/react'
import { ChevronRight } from 'lucide-react'
import { KEYS } from 'platejs'
import { PlateElement, PlateLeaf, type PlateElementProps, type PlateLeafProps } from 'platejs/react'
import { Checkbox } from '@/shared/ui'
import { cn } from '@/utils/cn'

const CALLOUT_VARIANTS: Record<string, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  note: 'border-neutral-200 bg-neutral-50 text-neutral-800',
  tip: 'border-violet-200 bg-violet-50 text-violet-950',
  error: 'border-red-200 bg-red-50 text-red-950',
}

const CALLOUT_ICONS: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
  note: '📝',
  tip: '💡',
  error: '⛔',
}

export function ParagraphElement(props: PlateElementProps) {
  const element = props.element as TElement & {
    listStyleType?: string
    checked?: boolean
  }

  const isTodo =
    element.listStyleType === KEYS.listTodo &&
    Object.prototype.hasOwnProperty.call(element, KEYS.listChecked)

  if (isTodo) {
    const state = useTodoListElementState({ element })
    const { checkboxProps } = useTodoListElement(state)

    return (
      <PlateElement as="div" className="mb-1 flex items-start gap-2" {...props}>
        <Checkbox
          checked={checkboxProps.checked}
          onChange={(e) => checkboxProps.onCheckedChange(e.target.checked)}
          onMouseDown={(e) => checkboxProps.onMouseDown(e)}
          aria-label="Toggle checklist item"
          size="sm"
          className="mt-0.5 shrink-0"
        />
        <div
          className={cn('min-w-0 flex-1', checkboxProps.checked && 'text-neutral-500 line-through')}
        >
          {props.children}
        </div>
      </PlateElement>
    )
  }

  return <PlateElement as="p" className="mb-2 last:mb-0" {...props} />
}

export function H1Element(props: PlateElementProps) {
  return <PlateElement as="h1" className="mb-3 mt-4 text-2xl font-bold first:mt-0" {...props} />
}

export function H2Element(props: PlateElementProps) {
  return <PlateElement as="h2" className="mb-2 mt-3 text-xl font-semibold first:mt-0" {...props} />
}

export function H3Element(props: PlateElementProps) {
  return <PlateElement as="h3" className="mb-2 mt-3 text-lg font-semibold first:mt-0" {...props} />
}

export function BlockquoteElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="blockquote"
      className="my-3 border-l-2 border-neutral-300 pl-4 italic text-neutral-600"
      {...props}
    />
  )
}

export function HorizontalRuleElement(props: PlateElementProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PlateElementAny = PlateElement as any
  return (
    <PlateElementAny
      as="div"
      role="separator"
      className="my-4 border-t border-neutral-200"
      {...props}
    />
  )
}

export function CalloutElement(props: PlateElementProps) {
  const element = props.element as TCalloutElement
  const variant = element.variant ?? 'note'
  const icon = element.icon ?? CALLOUT_ICONS[variant] ?? '📝'

  return (
    <PlateElement
      as="div"
      className={cn(
        'my-3 flex gap-3 rounded-lg border px-4 py-3',
        CALLOUT_VARIANTS[variant] ?? CALLOUT_VARIANTS.note
      )}
      {...props}
    >
      <span className="shrink-0 text-base leading-6" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">{props.children}</div>
    </PlateElement>
  )
}

export function ToggleElement(props: PlateElementProps) {
  const element = props.element as TElement & { id: string }
  const state = useToggleButtonState(element.id)
  const { buttonProps, open } = useToggleButton(state)

  return (
    <PlateElement as="div" className="my-2" {...props}>
      <div className="flex items-start gap-1">
        <button
          type="button"
          {...buttonProps}
          className="mt-0.5 shrink-0 rounded p-0.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
          aria-label={open ? 'Collapse toggle' : 'Expand toggle'}
          aria-expanded={open}
        >
          <ChevronRight className={cn('h-4 w-4 transition-transform', open && 'rotate-90')} />
        </button>
        <div className="min-w-0 flex-1 font-medium">{props.children}</div>
      </div>
    </PlateElement>
  )
}

export function CodeBlockElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="pre"
      className="my-3 overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-950 p-4 font-mono text-sm text-neutral-100"
      {...props}
    />
  )
}

export function CodeLineElement(props: PlateElementProps) {
  return <PlateElement as="code" className="block whitespace-pre" {...props} />
}

export function CodeLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      as="code"
      className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-sm text-neutral-800"
      {...props}
    />
  )
}

export function LinkElement(props: PlateElementProps) {
  const { props: linkProps } = useLink({ element: props.element as TLinkElement })

  return (
    <PlateElement
      as="a"
      className="text-blue-600 underline underline-offset-2 hover:text-blue-800"
      {...props}
      {...linkProps}
    />
  )
}

export function TableElement(props: PlateElementProps) {
  const { props: tableProps } = useTableElement()

  return (
    <div className="my-4 overflow-x-auto">
      <PlateElement
        as="table"
        className="w-full min-w-[320px] border-collapse text-sm"
        {...props}
        {...tableProps}
      />
    </div>
  )
}

export function TableRowElement(props: PlateElementProps) {
  return <PlateElement as="tr" {...props} />
}

export function TableCellElement(props: PlateElementProps) {
  const { minHeight, selected, width } = useTableCellElement()

  return (
    <PlateElement
      as="td"
      className={cn('border border-neutral-200 p-2 align-top', selected && 'bg-neutral-50')}
      style={{ minHeight, width }}
      {...props}
    />
  )
}

export function TableHeaderCellElement(props: PlateElementProps) {
  const { minHeight, selected, width } = useTableCellElement()

  return (
    <PlateElement
      as="th"
      className={cn(
        'border border-neutral-200 bg-neutral-50 p-2 text-left align-top font-semibold',
        selected && 'bg-neutral-100'
      )}
      style={{ minHeight, width }}
      {...props}
    />
  )
}
