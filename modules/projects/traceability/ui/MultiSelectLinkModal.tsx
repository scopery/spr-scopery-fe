'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Button, Checkbox, Modal, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

export interface MultiSelectLinkOption {
  id: string
  code?: string | null
  label: string
  meta?: string | null
  disabled?: boolean
}

interface MultiSelectLinkModalProps {
  open: boolean
  onClose: () => void
  title: string
  searchPlaceholder?: string
  options: MultiSelectLinkOption[]
  loading?: boolean
  saving?: boolean
  emptyMessage?: string
  confirmLabel?: string
  onConfirm: (ids: string[]) => Promise<void>
}

export function MultiSelectLinkModal({
  open,
  onClose,
  title,
  searchPlaceholder = 'Search…',
  options,
  loading = false,
  saving = false,
  emptyMessage = 'No items available.',
  confirmLabel = 'Add selected',
  onConfirm,
}: MultiSelectLinkModalProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelected(new Set())
    setError(null)
    setConfirming(false)
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((item) => {
      const hay = `${item.code ?? ''} ${item.label} ${item.meta ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [options, query])

  const selectableIds = useMemo(
    () => filtered.filter((item) => !item.disabled).map((item) => item.id),
    [filtered]
  )

  const busy = saving || confirming
  const allVisibleSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id))

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        for (const id of selectableIds) next.delete(id)
      } else {
        for (const id of selectableIds) next.add(id)
      }
      return next
    })
  }

  const handleConfirm = async () => {
    const ids = [...selected]
    if (ids.length === 0 || busy) return
    setError(null)
    setConfirming(true)
    try {
      await onConfirm(ids)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onClose()
      }}
      title={title}
      size="lg"
      closeOnOverlayClick={!busy}
      closeOnEscape={!busy}
      actions={[
        {
          label: 'Cancel',
          onClick: onClose,
          variant: 'ghost',
          disabled: busy,
        },
        {
          label: `${confirmLabel}${selected.size ? ` (${selected.size})` : ''}`,
          onClick: () => void handleConfirm(),
          variant: 'primary',
          disabled: busy || selected.size === 0,
          loading: busy,
        },
      ]}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 border border-neutral-200 bg-white px-2.5 py-2">
          <Search size={14} className="shrink-0 text-neutral-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            disabled={loading || busy}
            className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:opacity-50"
            aria-label={searchPlaceholder}
          />
        </div>

        {error ? (
          <Typography tone="error" variant="small">
            {error}
          </Typography>
        ) : null}

        {loading ? (
          <Typography variant="small" tone="muted">
            Loading…
          </Typography>
        ) : filtered.length === 0 ? (
          <div className="border border-neutral-200 px-4 py-5">
            <Typography variant="small" tone="muted">
              {options.length === 0 ? emptyMessage : 'No items match your search.'}
            </Typography>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <Typography variant="caption" tone="muted">
                {selectableIds.length} available
                {selected.size > 0 ? ` · ${selected.size} selected` : ''}
              </Typography>
              {selectableIds.length > 0 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-auto px-0 font-normal"
                  disabled={busy}
                  onClick={toggleAllVisible}
                >
                  {allVisibleSelected ? 'Clear all' : 'Select all'}
                </Button>
              ) : null}
            </div>
            <ul className="max-h-[48vh] overflow-y-auto border border-neutral-200">
              {filtered.map((item) => {
                const checked = item.disabled || selected.has(item.id)
                return (
                  <li key={item.id} className="border-b border-neutral-100 last:border-b-0">
                    <div
                      role="button"
                      tabIndex={item.disabled || busy ? -1 : 0}
                      className={cn(
                        'flex items-start gap-3 px-3 py-2.5',
                        item.disabled
                          ? 'cursor-not-allowed opacity-50'
                          : 'cursor-pointer hover:bg-neutral-50',
                        selected.has(item.id) && !item.disabled && 'bg-neutral-50'
                      )}
                      onClick={() => {
                        if (!item.disabled && !busy) toggle(item.id)
                      }}
                      onKeyDown={(event) => {
                        if (item.disabled || busy) return
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          toggle(item.id)
                        }
                      }}
                    >
                      <Checkbox
                        size="sm"
                        checked={checked}
                        disabled={item.disabled || busy}
                        onChange={() => {
                          if (!item.disabled) toggle(item.id)
                        }}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-0.5"
                        aria-label={item.label}
                      />
                      <span className="min-w-0">
                        <Typography variant="small" className="whitespace-normal break-words">
                          {[item.code, item.label].filter(Boolean).join(' · ')}
                        </Typography>
                        {item.meta || item.disabled ? (
                          <Typography variant="caption" tone="muted" className="mt-0.5 block">
                            {item.disabled ? 'Already linked' : item.meta}
                          </Typography>
                        ) : null}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </Modal>
  )
}
