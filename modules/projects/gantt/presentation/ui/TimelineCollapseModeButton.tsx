'use client'

import { ChevronsDownUp, ChevronsUpDown, Minus } from 'lucide-react'
import { TimelineCollapseMode } from '../../domain/enums/timeline.enum'
import type { TimelineCollapseMode as CollapseMode } from '../../domain/enums/timeline.enum'
import {
  collapseModeLabel,
  nextCollapseMode,
} from '../../domain/rules/timeline-collapse.rules'

type Props = {
  mode: CollapseMode
  onChange: (mode: CollapseMode) => void
}

function CollapseIcon({ mode }: { mode: CollapseMode }) {
  if (mode === TimelineCollapseMode.Structure) {
    return <Minus className="h-3.5 w-3.5" />
  }
  if (mode === TimelineCollapseMode.Project) {
    return <ChevronsDownUp className="h-3.5 w-3.5" />
  }
  return <ChevronsUpDown className="h-3.5 w-3.5" />
}

/** Single control: click cycles Expand → Structure → Project. */
export function TimelineCollapseModeButton({ mode, onChange }: Props) {
  const label = collapseModeLabel(mode)
  const next = nextCollapseMode(mode)
  return (
    <button
      type="button"
      className="flex h-7 w-7 items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
      title={`${label} · click for ${collapseModeLabel(next)}`}
      aria-label={`Collapse mode: ${label}. Click to switch to ${collapseModeLabel(next)}`}
      onClick={() => onChange(next)}
    >
      <CollapseIcon mode={mode} />
    </button>
  )
}
