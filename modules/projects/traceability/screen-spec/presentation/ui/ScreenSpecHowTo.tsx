'use client'

import { useState } from 'react'
import { Typography } from '@/shared/ui'

export function ScreenSpecHowTo({
  title,
  steps,
  note,
  defaultOpen = false,
}: {
  title: string
  steps: string[]
  note?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <details
      open={open}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
      className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2"
    >
      <summary className="cursor-pointer text-sm font-medium text-neutral-800">{title}</summary>
      <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-neutral-600">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {note ? (
        <Typography variant="caption" tone="muted" className="mt-2 block">
          {note}
        </Typography>
      ) : null}
    </details>
  )
}

export const SCREEN_STRUCTURE_TAB_HINTS: Record<
  'sections' | 'fields' | 'modes' | 'matrix' | 'processes' | 'events' | 'actions',
  string
> = {
  sections: 'Group fields into blocks (Main form, Footer). These become section rows on the Defines sheet.',
  fields:
    'Add each control, then use Configure to bind a component, data column, and extra validations. Required and max length go to Defines.',
  modes: 'Add CREATE / VIEW / EDIT (and SEARCH or DIALOG if needed) before the mode matrix. Missing modes show empty 〇 columns.',
  matrix:
    'Per field and mode: visible, readonly, required. Save replaces the whole set. Visible fields get 〇 on Defines (Create SC / View SC / Edit SC).',
  processes:
    'Init and data-load steps. Title = heading in Excel; content = Get; source table = Table; condition = Condition.',
  events:
    'User actions (click, submit). Title = heading; trigger / content / condition / navigate become outline rows on the Event sheet.',
  actions: 'Buttons shown on the screen (Submit, Cancel). Not a separate Excel sheet.',
}

export const SCREEN_SPEC_WORKFLOW_STEPS = [
  'On Browse, spec catalog first: entity Columns, then component option source (NONE / STATIC / DYNAMIC).',
  'Select a screen. Add Modes, then Sections and Fields. Configure each field (component, column, validations).',
  'Fill Mode matrix, then Processes and Events.',
  'Export one screen from the inspector, or group several screens on the Spec docs tab. Bulk full-spec JSON import is on Import → Screens.',
]

export const SPEC_DOC_WORKFLOW_STEPS = [
  'Create a document with a unique code (SPEC-001) and a name (Register / View / Edit).',
  'Save metadata: project, system, phase, language, Figma URL, overview — these fill the Excel header.',
  'Add screens from this app. One screen = a single-screen file. Several screens = one grouped workbook.',
  'Add Change history rows (rev, sheet, details, person, date) — they become the Change History sheet.',
  'Export Excel. Layout lists every screen; Defines / Processes / Event / Validation are blocked per screen.',
]

export const SPEC_DOC_WORKFLOW_NOTE =
  'Workbook sheets: Change History, Layout, Defines, Processes, Event, Validation, Database. Required and max length stay on Defines; extra rules (EMAIL, …) go to Validation.'
