'use client'

import React, {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Checkbox } from '../../atoms/Checkbox'
import { Typography } from '../../atoms/Typography'
import { cn } from '@/utils/cn'

export type DataTableCellKind = 'text' | 'code' | 'reference'
export type DataTableAlign = 'left' | 'center' | 'right'
export type DataTableSortDirection = 'asc' | 'desc'

export interface DataTableColumn<T> {
  id: string
  header: ReactNode
  accessor?: keyof T | ((row: T) => ReactNode)
  cell?: (row: T, rowIndex: number) => ReactNode
  kind?: DataTableCellKind
  align?: DataTableAlign
  width?: string
  sticky?: boolean
  sortable?: boolean
  /** Prevent row click when a control inside this cell is used. */
  interactive?: boolean
  truncate?: boolean
  headerClassName?: string
  cellClassName?: string | ((row: T) => string | undefined)
}

export interface DataTableSort {
  columnId: string
  direction: DataTableSortDirection
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  ariaLabel: string
  emptyMessage?: ReactNode
  selectedRowKey?: string | null
  onRowClick?: (row: T) => void
  /**
   * Single-character hotkeys while the table is focused (e.g. P/F/B/S/N).
   * Arrow Up/Down move the focused row; caller should `preventDefault` when handled.
   */
  onRowHotkey?: (row: T, key: string, event: KeyboardEvent) => void
  /** Fired when keyboard/pointer focus moves to a different row. */
  onFocusedRowChange?: (row: T | null) => void
  selectedKeys?: ReadonlySet<string>
  onSelectedKeysChange?: (keys: Set<string>) => void
  sort?: DataTableSort | null
  onSortChange?: (sort: DataTableSort) => void
  stickyHeader?: boolean
  compact?: boolean
  beforeRows?: ReactNode
  className?: string
  tableClassName?: string
  rowClassName?: string | ((row: T) => string | undefined)
}

function alignClass(align: DataTableAlign | undefined): string {
  if (align === 'center') return 'text-center'
  if (align === 'right') return 'text-right'
  return 'text-left'
}

function resolveValue<T>(column: DataTableColumn<T>, row: T): ReactNode {
  if (column.cell) return null
  if (typeof column.accessor === 'function') return column.accessor(row)
  if (column.accessor != null) return row[column.accessor] as ReactNode
  return null
}

function isTechnicalIdentifier(value: ReactNode): boolean {
  if (typeof value !== 'string') return false
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ||
    /^[0-9A-HJKMNP-TV-Z]{26}$/.test(value)
  )
}

/**
 * Generic catalog-style table.
 *
 * `code` cells are intentionally normal-weight proportional text.
 * `reference` cells never expose raw technical IDs: provide a readable cell
 * renderer/accessor, otherwise the component renders an em dash.
 */
function DataTableInner<T>(
  {
    columns,
    rows,
    rowKey,
    ariaLabel,
    emptyMessage = 'No items.',
    selectedRowKey,
    onRowClick,
    onRowHotkey,
    onFocusedRowChange,
    selectedKeys,
    onSelectedKeysChange,
    sort,
    onSortChange,
    stickyHeader = true,
    compact = false,
    beforeRows,
    className,
    tableClassName,
    rowClassName,
  }: DataTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const tableRef = useRef<HTMLTableElement>(null)
  const keyboardEnabled = Boolean(onRowClick || onRowHotkey)
  const selectable = Boolean(selectedKeys && onSelectedKeysChange)
  const allVisibleSelected =
    selectable && rows.length > 0 && rows.every((row) => selectedKeys?.has(rowKey(row)))
  const someVisibleSelected = selectable && rows.some((row) => selectedKeys?.has(rowKey(row)))

  useEffect(() => {
    setFocusedIndex((index) => {
      if (rows.length === 0) return 0
      return Math.min(index, rows.length - 1)
    })
  }, [rows.length])

  // Keep keyboard focus aligned when parent jumps to a row (e.g. scroll-to-nearest).
  useEffect(() => {
    if (selectedRowKey == null) return
    const idx = rows.findIndex((row) => rowKey(row) === selectedRowKey)
    if (idx >= 0) {
      setFocusedIndex((current) => (current === idx ? current : idx))
    }
  }, [rowKey, rows, selectedRowKey])

  const focusedKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!onFocusedRowChange) return
    const row = rows[focusedIndex] ?? null
    const key = row ? rowKey(row) : null
    if (key === focusedKeyRef.current) return
    focusedKeyRef.current = key
    onFocusedRowChange(row)
  }, [focusedIndex, onFocusedRowChange, rowKey, rows])

  useEffect(() => {
    if (!keyboardEnabled || !tableRef.current) return
    const trs = tableRef.current.querySelectorAll('tbody tr')
    const el = trs[focusedIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focusedIndex, keyboardEnabled])

  const stickyOffsets = useMemo(() => {
    // Selectable checkbox column sits before sticky cells — include its width in left offsets.
    let offset = selectable ? 40 : 0
    return columns.map((column) => {
      if (!column.sticky) return undefined
      const current = `${offset}px`
      const parsedWidth = Number.parseInt(column.width ?? '0', 10)
      offset += Number.isFinite(parsedWidth) ? parsedWidth : 0
      return current
    })
  }, [columns, selectable])

  const toggleAll = () => {
    if (!selectedKeys || !onSelectedKeysChange) return
    if (allVisibleSelected) {
      const next = new Set(selectedKeys)
      rows.forEach((row) => next.delete(rowKey(row)))
      onSelectedKeysChange(next)
      return
    }
    const next = new Set(selectedKeys)
    rows.forEach((row) => next.add(rowKey(row)))
    onSelectedKeysChange(next)
  }

  const toggleOne = (key: string) => {
    if (!selectedKeys || !onSelectedKeysChange) return
    const next = new Set(selectedKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onSelectedKeysChange(next)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    if (!keyboardEnabled || rows.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setFocusedIndex((index) => Math.min(index + 1, rows.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setFocusedIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && onRowClick) {
      event.preventDefault()
      const row = rows[focusedIndex]
      if (row) onRowClick(row)
    } else if (event.key === ' ' && selectable) {
      event.preventDefault()
      const row = rows[focusedIndex]
      if (row) toggleOne(rowKey(row))
    } else if (
      onRowHotkey &&
      event.key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      const row = rows[focusedIndex]
      if (row) onRowHotkey(row, event.key, event)
    }
  }

  return (
    <div ref={ref} className={cn('min-h-0 overflow-auto', className)}>
      <table
        ref={tableRef}
        className={cn(
          'w-full table-fixed text-left text-sm outline-none',
          keyboardEnabled && 'focus-visible:ring-2 focus-visible:ring-secondary/40',
          tableClassName
        )}
        aria-label={ariaLabel}
        tabIndex={keyboardEnabled ? 0 : undefined}
        onKeyDown={handleKeyDown}
      >
        <thead className={cn(stickyHeader && 'sticky top-0 z-10 bg-surface-card')}>
          <tr className="border-b border-neutral-200 text-neutral-500">
            {selectable ? (
              <th className="sticky left-0 z-30 w-10 bg-surface-card px-3 py-2">
                <Checkbox
                  size="sm"
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected && !allVisibleSelected}
                  onChange={toggleAll}
                  aria-label="Select all visible rows"
                />
              </th>
            ) : null}
            {columns.map((column, columnIndex) => {
              const activeSort = sort?.columnId === column.id
              return (
                <th
                  key={column.id}
                  scope="col"
                  style={{
                    width: column.width,
                    left: stickyOffsets[columnIndex],
                  }}
                  className={cn(
                    'font-calsans bg-surface-card px-3 py-2 font-normal',
                    alignClass(column.align),
                    column.sticky && 'sticky z-20',
                    column.headerClassName
                  )}
                >
                  {column.sortable && onSortChange ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-neutral-900"
                      onClick={() =>
                        onSortChange({
                          columnId: column.id,
                          direction: activeSort && sort.direction === 'asc' ? 'desc' : 'asc',
                        })
                      }
                    >
                      {column.header}
                      {activeSort ? (sort.direction === 'asc' ? '↑' : '↓') : null}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {beforeRows}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-3 py-8 text-center">
                <Typography variant="small" tone="muted">
                  {emptyMessage}
                </Typography>
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => {
              const key = rowKey(row)
              const selected = selectedRowKey === key
              const focused = keyboardEnabled && focusedIndex === rowIndex
              return (
                <tr
                  key={key}
                  data-row-key={key}
                  aria-selected={selected || selectedKeys?.has(key) || undefined}
                  className={cn(
                    'border-b border-neutral-100 transition-colors',
                    keyboardEnabled && 'cursor-pointer',
                    selected
                      ? 'bg-neutral-200'
                      : focused
                        ? 'border-l-2 border-l-neutral-200 bg-neutral-50'
                        : 'border-l-2 border-l-transparent hover:bg-neutral-50',
                    typeof rowClassName === 'function' ? rowClassName(row) : rowClassName
                  )}
                  onClick={() => {
                    setFocusedIndex(rowIndex)
                    onRowClick?.(row)
                    if (keyboardEnabled) tableRef.current?.focus()
                  }}
                >
                  {selectable ? (
                    <td
                      className="sticky left-0 z-[2] w-10 bg-inherit px-3 py-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Checkbox
                        size="sm"
                        checked={selectedKeys?.has(key) ?? false}
                        onChange={() => toggleOne(key)}
                        aria-label={`Select row ${rowIndex + 1}`}
                      />
                    </td>
                  ) : null}
                  {columns.map((column, columnIndex) => {
                    const rawValue = resolveValue(column, row)
                    const renderedValue = column.cell ? column.cell(row, rowIndex) : rawValue
                    const content =
                      column.kind === 'reference' &&
                      (!renderedValue || isTechnicalIdentifier(renderedValue))
                        ? '—'
                        : (renderedValue ?? '—')
                    const customCellClass =
                      typeof column.cellClassName === 'function'
                        ? column.cellClassName(row)
                        : column.cellClassName
                    return (
                      <td
                        key={column.id}
                        style={{ left: stickyOffsets[columnIndex] }}
                        onClick={
                          column.interactive ? (event) => event.stopPropagation() : undefined
                        }
                        className={cn(
                          'bg-inherit px-3 text-neutral-800',
                          column.truncate !== false && 'truncate',
                          compact ? 'py-2' : 'py-2.5',
                          alignClass(column.align),
                          column.kind === 'code' && 'font-normal text-neutral-900',
                          column.sticky && 'sticky z-[1]',
                          customCellClass
                        )}
                      >
                        {content}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export const DataTable = forwardRef(DataTableInner) as <T>(
  props: DataTableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement
