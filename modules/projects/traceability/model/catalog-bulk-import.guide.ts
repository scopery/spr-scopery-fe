import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'
import type { ArchitectureNodeType } from './architecture-workbench'

const MAX = BULK_MAX_ITEMS

export const CATALOG_BULK_IMPORT_GUIDES: Record<ArchitectureNodeType, BulkImportFormatGuide> = {
  MODULE: {
    entityLabel: 'App Module',
    maxItems: MAX,
    notes: ['code and name are required.', 'description is optional free text.'],
    fields: [
      { name: 'code', required: true, type: 'string', description: 'Module code (e.g. CART).' },
      { name: 'name', required: true, type: 'string', description: 'Module display name.' },
      {
        name: 'description',
        required: false,
        type: 'string',
        description: 'Optional module description.',
      },
    ],
    sample: {
      items: [{ code: 'CART', name: 'Cart', description: 'Shopping cart module' }],
    },
  },
  SCREEN: {
    entityLabel: 'Screen',
    maxItems: MAX,
    notes: [
      'Excel / …/screens/bulk: code, name, optional routePath only — empty catalog screens.',
      'Browse → Add node → Screen → JSON uses import-full (modes, fields, validations, processes, events). See that guide, not this shell.',
    ],
    fields: [
      { name: 'code', required: true, type: 'string', description: 'Screen code (e.g. CART_VIEW).' },
      { name: 'name', required: true, type: 'string', description: 'Screen display name.' },
      {
        name: 'routePath',
        required: false,
        type: 'string',
        description: 'Client route path for the screen.',
      },
    ],
    sample: {
      items: [{ code: 'CART_VIEW', name: 'Cart', routePath: '/cart' }],
    },
  },
  API_ENDPOINT: {
    entityLabel: 'API Endpoint',
    maxItems: MAX,
    notes: [
      'method and pathPattern are required. method must be an uppercase HTTP verb.',
      'This job creates catalog endpoints only. Linking them to a Function (Structure) or a Component (Browse → APIs tab) is a separate step.',
      'requestParams is an array of objects (or a JSON string of that array). in must be QUERY | PATH | BODY | HEADER.',
      'responseSchemaJson is a JSON string, or an object (the client stringifies it).',
    ],
    fields: [
      {
        name: 'method',
        required: true,
        type: 'enum',
        description: 'HTTP method.',
        enumValues: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      },
      {
        name: 'pathPattern',
        required: true,
        type: 'string',
        description: 'URL path pattern. Must start with / (e.g. /carts/{id}).',
      },
      {
        name: 'name',
        required: false,
        type: 'string',
        description: 'Human-readable endpoint name.',
      },
      {
        name: 'description',
        required: false,
        type: 'string',
        description: 'What the endpoint does.',
      },
      {
        name: 'requestParams',
        required: false,
        type: 'RequestParam[]',
        description: 'Query, path, body, or header params. Nested entity: RequestParam.',
      },
      {
        name: 'responseSchemaJson',
        required: false,
        type: 'string | object',
        description: 'Response body schema stored as a JSON string.',
      },
    ],
    entities: [
      {
        name: 'RequestParam',
        path: 'items[].requestParams[]',
        description: 'One request parameter on the catalog API.',
        fields: [
          { name: 'name', required: true, type: 'string', description: 'Param name, e.g. page.' },
          {
            name: 'in',
            required: true,
            type: 'enum',
            enumValues: ['QUERY', 'PATH', 'BODY', 'HEADER'],
            description: 'Where the param is sent.',
          },
          {
            name: 'type',
            required: false,
            type: 'string',
            description: 'Value type, e.g. string, integer, boolean. Defaults to string.',
          },
          { name: 'required', required: false, type: 'boolean', description: 'Whether the param is required.' },
          { name: 'description', required: false, type: 'string', description: 'What the param means.' },
          { name: 'example', required: false, type: 'string', description: 'Example value as a string.' },
        ],
      },
    ],
    sample: {
      items: [
        {
          method: 'GET',
          pathPattern: '/users',
          name: 'List users',
          description: 'Returns a paginated user list',
          requestParams: [
            {
              name: 'page',
              in: 'QUERY',
              type: 'integer',
              required: false,
              description: 'Page number',
              example: '0',
            },
          ],
          responseSchemaJson: { data: [{ id: 'string' }] },
        },
      ],
    },
  },
  COMPONENT: {
    entityLabel: 'App Component',
    maxItems: MAX,
    notes: [
      'code and name are required. This job creates the catalog shell only.',
      'Do not send fields, options, or API links here. After import, open the component on Browse: Fields, Options, and APIs tabs.',
      'Component → API links (FETCH_OPTIONS / SUBMIT / VALIDATE / LOAD_DATA / AUTOCOMPLETE) are configured on Browse, not in this JSON.',
    ],
    fields: [
      {
        name: 'code',
        required: true,
        type: 'string',
        description: 'Component code (e.g. BTN_PRIMARY). Used later as componentCode on screen full-spec fields.',
      },
      { name: 'name', required: true, type: 'string', description: 'Component display name.' },
      {
        name: 'componentType',
        required: false,
        type: 'string',
        description: 'Optional type label (BUTTON, INPUT, …).',
      },
      {
        name: 'description',
        required: false,
        type: 'string',
        description: 'Optional description.',
      },
    ],
    sample: {
      items: [
        {
          code: 'BTN_PRIMARY',
          name: 'Primary button',
          componentType: 'BUTTON',
          description: 'Primary submit control',
        },
      ],
    },
  },
  DATA_ENTITY: {
    entityLabel: 'Data Entity',
    maxItems: MAX,
    notes: [
      'code and name are required. This job creates the catalog table only.',
      'Physical columns are added later on Browse → entity → Columns. Do not send fields[] here.',
    ],
    fields: [
      {
        name: 'code',
        required: true,
        type: 'string',
        description: 'Entity code (e.g. CART_ITEM).',
      },
      { name: 'name', required: true, type: 'string', description: 'Entity display name.' },
      {
        name: 'tableName',
        required: false,
        type: 'string',
        description: 'Optional database table name.',
      },
      {
        name: 'description',
        required: false,
        type: 'string',
        description: 'Optional description.',
      },
    ],
    sample: {
      items: [
        {
          code: 'CART_ITEM',
          name: 'Cart item',
          tableName: 'cart_items',
          description: 'Line item on a cart',
        },
      ],
    },
  },
  COMMUNICATION: {
    entityLabel: 'Communication',
    maxItems: MAX,
    notes: [
      'Bulk/JSON import is not available yet — use Catalog → Add node → Communication → Single add.',
      'code and name are required.',
      'triggerKey is optional.',
    ],
    fields: [
      {
        name: 'code',
        required: true,
        type: 'string',
        description: 'Communication code (e.g. ORDER_CONFIRMED).',
      },
      { name: 'name', required: true, type: 'string', description: 'Display name.' },
      {
        name: 'triggerKey',
        required: false,
        type: 'string',
        description: 'Optional trigger key (e.g. order.confirmed).',
      },
    ],
    sample: {
      items: [
        {
          code: 'ORDER_CONFIRMED',
          name: 'Order confirmed email',
          triggerKey: 'order.confirmed',
        },
      ],
    },
  },
}
