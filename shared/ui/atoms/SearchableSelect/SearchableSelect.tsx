'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/utils/cn'
import { uiControl, uiDropdownPanel } from '../../styles/ui-surface'
import type { SelectOption, SelectSize } from '../Select/Select.types'
import { useFixedAnchorRect } from './useFixedAnchorRect'

interface SearchableSelectProps {
  options?: SelectOption[]
  value?: string
  placeholder?: string
  searchPlaceholder?: string
  size?: SelectSize
  disabled?: boolean
  onValueChange?: (value: string) => void
  className?: string
}

const triggerHeight: Record<SelectSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-3 text-[13px]',
  lg: 'h-12 px-4 text-base',
}

export function SearchableSelect({
  options = [],
  value,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  size = 'md',
  disabled = false,
  onValueChange,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pos = useFixedAnchorRect(open, rootRef)

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? '',
    [options, value]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    if (!open) return
    setTimeout(() => inputRef.current?.focus(), 0)
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t) || listRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return
    onValueChange?.(option.value)
    setOpen(false)
    setQuery('')
  }

  const handleOpen = () => {
    if (disabled) return
    setOpen((v) => !v)
    if (!open) setQuery('')
  }

  const panel =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={listRef}
            role="listbox"
            style={{
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              width: pos?.width ?? 0,
              maxHeight: pos?.maxHeight ?? PANEL_FALLBACK,
              visibility: pos ? 'visible' : 'hidden',
            }}
            className={cn(
              uiDropdownPanel,
              'fixed z-[200] flex flex-col overflow-hidden shadow-lg'
            )}
          >
            <div className="shrink-0 border-b border-neutral-100 px-2 py-1.5">
              <div className="flex items-center gap-1.5 text-neutral-400">
                <Search size={13} className="shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-neutral-400">No results</div>
              ) : (
                filtered.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    disabled={option.disabled}
                    onClick={() => handleSelect(option)}
                    className={cn(
                      'relative flex w-full cursor-pointer select-none items-center px-3 py-2 pr-8 text-left text-sm',
                      'focus:outline-none',
                      option.disabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:bg-neutral-100 focus:bg-neutral-100',
                      option.value === value && 'font-medium text-neutral-900'
                    )}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {option.value === value ? (
                      <span className="absolute right-2 flex items-center">
                        <Check size={14} />
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <div ref={rootRef} className={cn('relative block w-full min-w-0', className)}>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          uiControl,
          'flex w-full min-w-0 items-center justify-between gap-2',
          'overflow-hidden text-neutral-900',
          'transition-colors duration-200',
          triggerHeight[size]
        )}
      >
        <span className={cn('min-w-0 flex-1 truncate text-left', !selectedLabel && 'text-neutral-400')}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>
      {panel}
    </div>
  )
}

const PANEL_FALLBACK = 256
