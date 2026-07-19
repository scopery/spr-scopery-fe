'use client'

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Box, Link as DesignLink, Typography } from '@/shared/ui'

import NextLink from 'next/link'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface ShellSidebarItem {
  label: string
  href?: string
  icon?: ReactNode
  active?: boolean
  disabled?: boolean
  children?: ShellSidebarItem[]
}

export interface ShellSidebarSection {
  label: string
  items: ShellSidebarItem[]
}

export interface ShellSidebarProps {
  ariaLabel: string
  sections: ShellSidebarSection[]
  className?: string
  /** Icon-rail mode: labels hidden, tooltips via title. */
  collapsed?: boolean
  /** Remount key for workspace ↔ project context enter animation. */
  contextKey?: string
}

const SECTION_STORAGE_PREFIX = 'scopery.sidebar.section.'

export function ShellSidebar({
  ariaLabel,
  sections,
  className,
  collapsed = false,
  contextKey,
}: ShellSidebarProps) {
  const navRef = useRef<HTMLElement>(null)
  const [rail, setRail] = useState<{ top: number; height: number } | null>(null)

  const updateRail = () => {
    const nav = navRef.current
    if (!nav) return
    const active = nav.querySelector<HTMLElement>('[aria-current="page"]')
    if (!active) {
      setRail(null)
      return
    }
    const navBox = nav.getBoundingClientRect()
    const itemBox = active.getBoundingClientRect()
    setRail({
      top: itemBox.top - navBox.top + nav.scrollTop,
      height: itemBox.height,
    })
  }

  useLayoutEffect(() => {
    updateRail()
  }, [sections, collapsed, contextKey])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const onScroll = () => updateRail()
    nav.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateRail)
    return () => {
      nav.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateRail)
    }
  }, [sections, collapsed])

  return (
    <nav
      ref={navRef}
      aria-label={ariaLabel}
      data-collapsed={collapsed || undefined}
      className={cn('relative space-y-3 motion-context-enter', className)}
      key={contextKey}
    >
      {rail ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 z-10 w-0.5 bg-primary motion-rail"
          style={{ top: rail.top, height: rail.height }}
        />
      ) : null}

      {sections.map((section) => (
        <SidebarSection key={section.label} section={section} collapsed={collapsed} />
      ))}
    </nav>
  )
}

function SidebarSection({
  section,
  collapsed,
}: {
  section: ShellSidebarSection
  collapsed: boolean
}) {
  const storageKey = `${SECTION_STORAGE_PREFIX}${section.label}`
  const [open, setOpen] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored === '0') setOpen(false)
      if (stored === '1') setOpen(true)
    } catch {
      /* ignore */
    }
  }, [storageKey])

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem(storageKey, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const hasActive = useMemo(
    () =>
      section.items.some(
        (item) => item.active || item.children?.some((c) => c.active)
      ),
    [section.items]
  )

  // Keep section open when an item inside is active
  useEffect(() => {
    if (hasActive) setOpen(true)
  }, [hasActive])

  if (collapsed) {
    return (
      <Box as="section">
        <ul className="flex flex-col">
          {section.items.map((item) => (
            <ShellSidebarListItem
              key={`${section.label}-${item.label}`}
              item={item}
              collapsed
            />
          ))}
        </ul>
      </Box>
    )
  }

  const showHeading = Boolean(section.label.trim())

  return (
    <Box as="section">
      {showHeading ? (
        <button
          type="button"
          onClick={toggle}
          className="mb-1 flex w-full items-center justify-between gap-2 px-2 py-1 text-left motion-colors hover:text-neutral-900"
          aria-expanded={open}
        >
          <Typography
            as="span"
            variant="small"
            tone="muted"
            weight="medium"
            className="text-[11px] uppercase tracking-wide motion-label"
          >
            {section.label}
          </Typography>
          <ChevronDown
            size={14}
            className={cn(
              'shrink-0 text-neutral-400 motion-chevron',
              open ? 'rotate-0' : '-rotate-90'
            )}
            aria-hidden
          />
        </button>
      ) : null}

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-[160ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
          !showHeading || open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <ul
            className={cn(
              'flex flex-col pb-1',
              !showHeading || open ? 'opacity-100' : 'opacity-0',
              'transition-opacity duration-[140ms] ease-[cubic-bezier(0.4,0,0.2,1)]'
            )}
          >
            {section.items.map((item, index) => (
              <ShellSidebarListItem
                key={`${section.label}-${item.label}`}
                item={item}
                style={
                  showHeading && open
                    ? { transitionDelay: `${Math.min(index * 12, 96)}ms` }
                    : undefined
                }
              />
            ))}
          </ul>
        </div>
      </div>
    </Box>
  )
}

function ShellSidebarListItem({
  item,
  collapsed = false,
  style,
}: {
  item: ShellSidebarItem
  collapsed?: boolean
  style?: CSSProperties
}) {
  const content = (
    <>
      {item.icon ? (
        <span
          className={cn(
            'shrink-0 motion-colors',
            item.active ? 'text-primary' : item.disabled ? 'text-neutral-400' : 'text-neutral-500'
          )}
          aria-hidden
        >
          {item.icon}
        </span>
      ) : null}
      <Typography
        as="span"
        variant="small"
        className={cn(
          'min-w-0 truncate motion-label',
          collapsed && 'pointer-events-none max-w-0 translate-x-[-4px] overflow-hidden opacity-0'
        )}
      >
        {item.label}
      </Typography>
    </>
  )

  const linkClass = cn(
    'relative flex items-center gap-2 rounded-none border-l-2 border-transparent px-3 py-2 text-sm motion-colors motion-icon-hover',
    collapsed ? 'justify-center px-2' : '',
    !item.disabled && 'hover:bg-neutral-50',
    item.active && 'bg-neutral-50 text-neutral-900',
    item.disabled && 'cursor-not-allowed text-neutral-400'
  )

  return (
    <li style={style}>
      {item.href && !item.disabled ? (
        <DesignLink
          as={NextLink}
          href={item.href}
          title={collapsed ? item.label : undefined}
          aria-current={item.active ? 'page' : undefined}
          className={linkClass}
        >
          {content}
        </DesignLink>
      ) : (
        <span
          title={collapsed ? item.label : undefined}
          className={linkClass}
          aria-current={item.active ? 'page' : undefined}
        >
          {content}
        </span>
      )}

      {!collapsed && item.children?.length ? (
        <ul className="ml-8 flex flex-col">
          {item.children.map((child) => (
            <li key={`${item.label}-${child.label}`}>
              {child.href && !child.disabled ? (
                <DesignLink
                  as={NextLink}
                  href={child.href}
                  aria-current={child.active ? 'page' : undefined}
                  className={cn(
                    'flex items-center rounded-none border-l-2 border-transparent px-3 py-1.5 text-sm text-neutral-600 motion-colors hover:bg-neutral-50 hover:text-neutral-900',
                    child.active && 'bg-neutral-50 text-neutral-900'
                  )}
                >
                  {child.label}
                </DesignLink>
              ) : (
                <Typography
                  as="span"
                  variant="small"
                  tone="muted"
                  className="flex cursor-not-allowed items-center rounded-none border-l-2 border-transparent px-3 py-1.5 text-neutral-400"
                >
                  {child.label}
                </Typography>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}
