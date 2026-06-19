'use client'

import { Button, Typography } from '@/shared/ui'
import { useGovernanceConditionJsonEditor } from '../hooks/useGovernanceConditionJsonEditor'
import type { GovernanceConditionJsonEditorProps } from '../model/governance'

export function GovernanceConditionJsonEditor({
  orgId,
  value,
  onChange,
  onValidGroup,
  disabled = false,
}: GovernanceConditionJsonEditorProps) {
  const editor = useGovernanceConditionJsonEditor({ orgId, value, onChange, onValidGroup })

  return (
    <div className="space-y-2">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Conditions (JSON)</span>
        <textarea
          className="border-border min-h-32 w-full rounded border p-2 font-mono text-xs"
          value={value}
          onChange={(e) => editor.handleChange(e.target.value)}
          disabled={disabled}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={disabled} onClick={editor.runFormat}>
          Format JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          loading={editor.validating}
          onClick={() => void editor.runValidate()}
        >
          Validate
        </Button>
        <Button variant="ghost" size="sm" disabled={disabled} onClick={editor.loadSample}>
          Load sample
        </Button>
      </div>
      <Typography variant="small" tone="muted">
        Allowed fields: actor_role, workflow_status, readiness_status, partner_access,
        export_format, package_format, selected_document_count, and others from governance metadata.
      </Typography>
      {editor.validationOk ? (
        <Typography variant="small" className="text-green-700">
          {editor.validationOk}
        </Typography>
      ) : null}
      {editor.validationErrors.length > 0 ? (
        <ul className="text-destructive list-disc pl-4 text-sm">
          {editor.validationErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
