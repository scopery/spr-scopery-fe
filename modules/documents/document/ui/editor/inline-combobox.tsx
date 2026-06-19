'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import type { PointRef, TElement } from 'platejs'
import { filterWords } from '@platejs/combobox'
import { useComboboxInput, useHTMLInputCursorState } from '@platejs/combobox/react'
import { useComposedRef, useEditorRef } from 'platejs/react'
import { cn } from '@/utils/cn'

type FilterableItem = {
  value: string
  group?: string
  keywords?: string[]
  label?: string
}

type FilterFn = (item: FilterableItem, search: string) => boolean

type InlineComboboxContextValue = {
  filter: FilterFn | false
  inputProps: ReturnType<typeof useComboboxInput>['props']
  inputRef: React.RefObject<HTMLInputElement | null>
  removeInput: ReturnType<typeof useComboboxInput>['removeInput']
  showTrigger: boolean
  trigger: string
  setHasEmpty: (hasEmpty: boolean) => void
  search: string
  setSearch: (value: string) => void
  activeId: string | null
  setActiveId: (id: string | null) => void
  registerItem: (id: string, onSelect: () => void) => void
  unregisterItem: (id: string) => void
  selectActiveItem: () => void
  itemIds: string[]
}

const InlineComboboxContext = createContext<InlineComboboxContextValue | null>(null)

export function useInlineComboboxContext() {
  const ctx = useContext(InlineComboboxContext)
  if (!ctx) throw new Error('InlineCombobox components must be used within InlineCombobox')
  return ctx
}

const defaultFilter: FilterFn = ({ group, keywords = [], label, value }, search) => {
  if (!search) return true
  const uniqueTerms = new Set([value, ...keywords, group, label].filter(Boolean))
  return Array.from(uniqueTerms).some((keyword) => filterWords(keyword!, search))
}

type InlineComboboxProps = {
  children: React.ReactNode
  element: TElement
  trigger: string
  filter?: FilterFn | false
  hideWhenNoValue?: boolean
  showTrigger?: boolean
}

export function InlineCombobox({
  children,
  element,
  filter = defaultFilter,
  hideWhenNoValue = false,
  showTrigger = true,
  trigger,
}: InlineComboboxProps) {
  const editor = useEditorRef()
  const inputRef = useRef<HTMLInputElement>(null)
  const cursorState = useHTMLInputCursorState(inputRef)
  const [search, setSearch] = useState('')
  const [hasEmpty, setHasEmpty] = useState(false)
  const [itemIds, setItemIds] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const itemHandlersRef = useRef<Map<string, () => void>>(new Map())

  const registerItem = useCallback((id: string, onSelect: () => void) => {
    itemHandlersRef.current.set(id, onSelect)
    setItemIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const unregisterItem = useCallback((id: string) => {
    itemHandlersRef.current.delete(id)
    setItemIds((prev) => prev.filter((itemId) => itemId !== id))
  }, [])

  const selectActiveItem = useCallback(() => {
    if (!activeId) return
    itemHandlersRef.current.get(activeId)?.()
  }, [activeId])

  const insertPointRef = useRef<PointRef | null>(null)

  useEffect(() => {
    insertPointRef.current?.unref()
    insertPointRef.current = null

    const path = editor.api.findPath(element)
    if (!path) return

    const point = editor.api.before(path)
    if (!point) return

    const pointRef = editor.api.pointRef(point)
    insertPointRef.current = pointRef

    return () => {
      if (insertPointRef.current === pointRef) insertPointRef.current = null
      pointRef.unref()
    }
  }, [editor, element])

  useEffect(() => {
    if (itemIds.length === 0) {
      setActiveId(null)
      return
    }
    if (!activeId || !itemIds.includes(activeId)) {
      setActiveId(itemIds[0] ?? null)
    }
  }, [itemIds, activeId])

  const { props: inputProps, removeInput } = useComboboxInput({
    cancelInputOnBlur: false,
    cursorState,
    autoFocus: true,
    ref: inputRef,
    onCancelInput: (cause) => {
      if (cause !== 'backspace') {
        editor.tf.insertText(trigger + search, {
          at: insertPointRef.current?.current ?? undefined,
        })
      }
      if (cause === 'arrowLeft' || cause === 'arrowRight') {
        editor.tf.move({
          distance: 1,
          reverse: cause === 'arrowLeft',
        })
      }
    },
  })

  const open = (itemIds.length > 0 || hasEmpty) && (!hideWhenNoValue || search.length > 0)

  const contextValue = useMemo<InlineComboboxContextValue>(
    () => ({
      filter,
      inputProps,
      inputRef,
      removeInput,
      setHasEmpty,
      showTrigger,
      trigger,
      search,
      setSearch,
      activeId,
      setActiveId,
      registerItem,
      unregisterItem,
      selectActiveItem,
      itemIds,
    }),
    [
      filter,
      inputProps,
      removeInput,
      showTrigger,
      trigger,
      search,
      activeId,
      registerItem,
      unregisterItem,
      selectActiveItem,
      itemIds,
    ]
  )

  return (
    <InlineComboboxContext.Provider value={contextValue}>
      <span contentEditable={false} className="relative inline">
        {children}
        {open ? null : null}
      </span>
    </InlineComboboxContext.Provider>
  )
}

export function InlineComboboxInput({
  className,
  ref: propRef,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  ref?: React.RefObject<HTMLInputElement | null>
}) {
  const ctx = useInlineComboboxContext()
  const {
    inputProps,
    inputRef,
    showTrigger,
    trigger,
    setSearch,
    itemIds,
    activeId,
    setActiveId,
    removeInput,
    selectActiveItem,
  } = ctx
  const ref = useComposedRef(propRef, inputRef)

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    inputProps.onKeyDown?.(event)
    if (event.defaultPrevented) return

    const currentIndex = itemIds.findIndex((id) => id === activeId)

    if (event.key === 'ArrowDown' && itemIds.length > 0) {
      event.preventDefault()
      setActiveId(itemIds[(currentIndex + 1) % itemIds.length] ?? null)
    } else if (event.key === 'ArrowUp' && itemIds.length > 0) {
      event.preventDefault()
      setActiveId(itemIds[(currentIndex - 1 + itemIds.length) % itemIds.length] ?? null)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      removeInput(true)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      selectActiveItem()
    }
  }

  return (
    <>
      {showTrigger && <span className="text-neutral-400">{trigger}</span>}
      <span className="relative min-h-[1lh] min-w-[1ch]">
        <span className="invisible overflow-hidden text-nowrap" aria-hidden>
          {ctx.search || '\u200B'}
        </span>
        <input
          ref={ref}
          className={cn('absolute left-0 top-0 size-full bg-transparent outline-none', className)}
          value={ctx.search}
          autoComplete="off"
          aria-label="Filter slash commands"
          aria-controls="slash-command-listbox"
          aria-expanded
          aria-autocomplete="list"
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={inputProps.onBlur}
          {...props}
        />
      </span>
    </>
  )
}

type InlineComboboxItemProps = {
  id: string
  value: string
  label?: string
  keywords?: string[]
  group?: string
  focusEditor?: boolean
  onSelect: () => void
  children: React.ReactNode
  className?: string
}

export function InlineComboboxItem({
  id,
  value,
  label,
  keywords,
  group,
  focusEditor = true,
  onSelect,
  children,
  className,
}: InlineComboboxItemProps) {
  const ctx = useInlineComboboxContext()
  const editor = useEditorRef()

  const visible = ctx.filter === false || ctx.filter({ value, label, keywords, group }, ctx.search)

  const handleSelect = useCallback(() => {
    ctx.removeInput(false)
    onSelect()
    if (focusEditor) editor.tf.focus()
  }, [ctx, onSelect, focusEditor, editor])

  useEffect(() => {
    if (!visible) {
      ctx.unregisterItem(id)
      return
    }
    ctx.registerItem(id, handleSelect)
    return () => ctx.unregisterItem(id)
  }, [ctx, id, handleSelect, visible])

  if (!visible) return null

  const isActive = ctx.activeId === id

  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors',
        isActive ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-700 hover:bg-neutral-50',
        className
      )}
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={() => ctx.setActiveId(id)}
      onClick={handleSelect}
    >
      {children}
    </button>
  )
}

export function InlineComboboxContent({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const ctx = useInlineComboboxContext()
  const open =
    (ctx.itemIds.length > 0 || ctx.search.length > 0) &&
    (ctx.itemIds.length > 0 || ctx.search.length > 0)

  if (!open && ctx.itemIds.length === 0 && !ctx.search) return null

  return (
    <div
      id="slash-command-listbox"
      className={cn(
        'absolute left-0 top-full z-50 mt-1 max-h-[320px] w-[300px] overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1 shadow-lg',
        className
      )}
      role="listbox"
      aria-label="Slash commands"
    >
      {children}
    </div>
  )
}

export function InlineComboboxGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="py-1">
      <div className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
        {label}
      </div>
      <div>{children}</div>
    </div>
  )
}

export function InlineComboboxEmpty({ children }: { children: React.ReactNode }) {
  const ctx = useInlineComboboxContext()

  useEffect(() => {
    ctx.setHasEmpty(true)
    return () => ctx.setHasEmpty(false)
  }, [ctx])

  if (ctx.itemIds.length > 0) return null

  return <div className="px-2 py-3 text-sm text-neutral-500">{children}</div>
}
