'use client'

import { useEffect, useState } from 'react'
import { Button, Input, PageSkeleton, Stack, Textarea, Typography } from '@/shared/ui'
import {
  API_PARAM_LOCATION_SELECT_OPTIONS,
  type ApiRequestParam,
} from '../../../model/application-registry'
import { useApiEndpointSpec } from '../hooks/useApiEndpointSpec'
import { ScreenStructureEditor } from '../../../ui/ScreenStructureEditor'

function paramKey(param: ApiRequestParam, index: number): string {
  return `${param.name}-${param.in}-${index}`
}

export function ApiEndpointSpecPanel({
  workspaceId,
  applicationId,
  endpointId,
  onSaved,
}: {
  workspaceId: string
  applicationId: string
  endpointId: string
  onSaved?: () => void
}) {
  const { endpoint, loading, error, save } = useApiEndpointSpec(
    workspaceId,
    applicationId,
    endpointId
  )
  const [description, setDescription] = useState('')
  const [params, setParams] = useState<ApiRequestParam[]>([])
  const [schema, setSchema] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!endpoint) return
    setDescription(endpoint.description ?? '')
    setParams(endpoint.requestParams ?? [])
    setSchema(endpoint.responseSchemaJson ?? '')
    setFormError(null)
  }, [endpoint])

  const dirty =
    Boolean(endpoint) &&
    ((endpoint?.description ?? '') !== description ||
      (endpoint?.responseSchemaJson ?? '') !== schema ||
      JSON.stringify(endpoint?.requestParams ?? []) !== JSON.stringify(params))

  const handleSave = async () => {
    if (!endpoint) return
    setSaving(true)
    setFormError(null)
    try {
      await save({
        method: endpoint.method,
        pathPattern: endpoint.pathPattern,
        name: endpoint.name ?? endpoint.pathPattern,
        description: description.trim() || null,
        requestParams: params,
        responseSchemaJson: schema.trim() || null,
      })
      onSaved?.()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save API spec')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !endpoint) {
    return <PageSkeleton variant="list" />
  }

  return (
    <div className="space-y-3 border-t border-neutral-200 pt-4">
      <Typography weight="medium" variant="small">
        Request & response
      </Typography>
      <Typography variant="caption" tone="muted">
        This is the catalog API contract. Linking it to a function (Structure) or a component
        (Browse → component → APIs) does not change these params.
      </Typography>
      {error ? (
        <Typography tone="error" variant="small">
          {error}
        </Typography>
      ) : null}
      {endpoint ? (
        <Stack direction="vertical" spacing="sm">
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Description
            </Typography>
            <Input
              fullWidth
              size="sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Returns a paginated user list"
            />
          </div>
          <Typography variant="caption" tone="muted">
            Request params
          </Typography>
          <ScreenStructureEditor
            columns={[
              { key: 'name', label: 'Name', required: true, placeholder: 'page' },
              {
                key: 'in',
                label: 'In',
                required: true,
                options: API_PARAM_LOCATION_SELECT_OPTIONS,
              },
              { key: 'type', label: 'Type', required: true, placeholder: 'integer' },
              { key: 'required', label: 'Required', options: ['false', 'true'] as const },
              { key: 'description', label: 'Description', placeholder: 'Page number' },
              { key: 'example', label: 'Example', placeholder: '0' },
            ]}
            items={params.map((param, index) => ({
              id: paramKey(param, index),
              values: {
                name: param.name,
                in: param.in,
                type: param.type,
                required: param.required ? 'true' : 'false',
                description: param.description ?? '',
                example: param.example ?? '',
              },
            }))}
            emptyLabel="No request params yet."
            addTitle="Add params"
            editTitle="Edit params"
            itemLabel="param"
            onCreate={async (values) => {
              setParams((prev) => [
                ...prev,
                {
                  name: values.name.trim(),
                  in: values.in as ApiRequestParam['in'],
                  type: values.type.trim() || 'string',
                  required: values.required === 'true',
                  description: values.description.trim() || null,
                  example: values.example.trim() || null,
                },
              ])
            }}
            onUpdate={async (id, values) => {
              setParams((prev) =>
                prev.map((param, index) =>
                  paramKey(param, index) === id
                    ? {
                        name: values.name.trim(),
                        in: values.in as ApiRequestParam['in'],
                        type: values.type.trim() || 'string',
                        required: values.required === 'true',
                        description: values.description.trim() || null,
                        example: values.example.trim() || null,
                      }
                    : param
                )
              )
            }}
            onDelete={async (id) => {
              setParams((prev) => prev.filter((param, index) => paramKey(param, index) !== id))
            }}
          />
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Response schema
            </Typography>
            <Textarea
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              placeholder='{"data":[{"id":"string"}]}'
              rows={6}
            />
          </div>
          {formError ? (
            <Typography tone="error" variant="small">
              {formError}
            </Typography>
          ) : null}
          <Button size="sm" loading={saving} disabled={!dirty} onClick={() => void handleSave()}>
            {dirty ? 'Save API spec' : 'Saved'}
          </Button>
        </Stack>
      ) : null}
    </div>
  )
}
