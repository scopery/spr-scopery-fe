'use client'

import { PageSkeleton, Typography } from '@/shared/ui'
import { COMPONENT_API_ROLE_SELECT_OPTIONS } from '../../domain/enums/screen-spec.enum'
import { useComponentApis } from '../hooks/useComponentApis'
import { ScreenStructureEditor, type StructureOption } from '../../../ui/ScreenStructureEditor'

export interface SpecCatalogApi {
  id: string
  method: string
  pathPattern: string
  name?: string | null
}

export function ComponentApisPanel({
  workspaceId,
  componentId,
  apis,
}: {
  workspaceId: string
  componentId: string
  apis: SpecCatalogApi[]
}) {
  const { items, loading, error, createLink, updateLink, removeLink } = useComponentApis(
    workspaceId,
    componentId
  )

  const apiOptions: StructureOption[] = apis.map((api) => ({
    value: api.id,
    label: `${api.method} ${api.pathPattern}${api.name ? ` · ${api.name}` : ''}`,
  }))

  return (
    <div className="space-y-3">
      <Typography weight="medium" variant="small">
        Linked APIs
      </Typography>
      <Typography variant="caption" tone="muted">
        How this component calls a catalog API. This is not the Function → API link on Structure.
      </Typography>
      {loading && items.length === 0 ? <PageSkeleton variant="list" /> : null}
      {error ? (
        <Typography tone="error" variant="small">
          {error}
        </Typography>
      ) : null}
      {apis.length === 0 ? (
        <Typography variant="small" tone="muted">
          Create API endpoints on Browse first, then link them here.
        </Typography>
      ) : (
        <ScreenStructureEditor
          columns={[
            {
              key: 'apiId',
              label: 'API',
              required: true,
              options: apiOptions,
              searchable: true,
              lockedOnExisting: true,
            },
            {
              key: 'role',
              label: 'Role',
              required: true,
              options: COMPONENT_API_ROLE_SELECT_OPTIONS,
            },
            { key: 'note', label: 'Note', placeholder: 'Loads user list' },
            { key: 'displayOrder', label: 'Order', placeholder: '1' },
          ]}
          items={items.map((link) => ({
            id: link.id,
            values: {
              apiId: link.apiId,
              role: link.role,
              note: link.note ?? '',
              displayOrder: link.displayOrder != null ? String(link.displayOrder) : '',
            },
          }))}
          emptyLabel="No APIs linked yet."
          addTitle="Link APIs"
          editTitle="Edit API links"
          itemLabel="API link"
          onCreate={async (values) => {
            const order = values.displayOrder.trim()
            await createLink({
              apiId: values.apiId,
              role: values.role,
              note: values.note.trim() || null,
              displayOrder: order ? Number(order) : null,
            })
          }}
          onUpdate={async (id, values) => {
            const order = values.displayOrder.trim()
            await updateLink(id, {
              role: values.role,
              note: values.note.trim() || null,
              displayOrder: order ? Number(order) : null,
            })
          }}
          onDelete={removeLink}
        />
      )}
    </div>
  )
}
