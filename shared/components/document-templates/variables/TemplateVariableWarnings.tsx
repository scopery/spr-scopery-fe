'use client'

import { Typography } from '@/shared/ui'
import type { TemplateVariableWarning } from '@/types/document-template'

interface TemplateVariableWarningsProps {
  unknownVariables: string[]
  warnings?: TemplateVariableWarning[]
}

export function TemplateVariableWarnings({
  unknownVariables,
  warnings = [],
}: TemplateVariableWarningsProps) {
  if (unknownVariables.length === 0 && warnings.length === 0) return null

  const displayWarnings =
    warnings.length > 0
      ? warnings
      : unknownVariables.map((variable) => ({
          code: 'unknown_variable' as const,
          variable,
          message: `Unknown template variable "${variable}".`,
        }))

  return (
    <div
      className="border border-amber-200 bg-amber-50 p-3 space-y-2"
      role="status"
      aria-live="polite"
    >
      <Typography variant="small" weight="medium">
        Variable warnings
      </Typography>
      <ul className="list-disc pl-5 space-y-1">
        {displayWarnings.map((warning, index) => (
          <li key={`${warning.variable ?? warning.message}-${index}`}>
            <Typography variant="small" tone="muted">
              {warning.message}
            </Typography>
          </li>
        ))}
      </ul>
    </div>
  )
}
