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
    notes: ['code and name are required.', 'routePath is optional (e.g. /cart).'],
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
      'method and pathPattern are required.',
      'method must be an HTTP verb in uppercase.',
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
        description: 'URL path pattern (e.g. /carts/{id}).',
      },
      {
        name: 'name',
        required: false,
        type: 'string',
        description: 'Optional human-readable endpoint name.',
      },
    ],
    sample: {
      items: [{ method: 'GET', pathPattern: '/carts/{id}', name: 'Get cart by id' }],
    },
  },
  COMPONENT: {
    entityLabel: 'App Component',
    maxItems: MAX,
    notes: ['code and name are required.', 'componentType is optional free text or taxonomy label.'],
    fields: [
      {
        name: 'code',
        required: true,
        type: 'string',
        description: 'Component code (e.g. BTN_PRIMARY).',
      },
      { name: 'name', required: true, type: 'string', description: 'Component display name.' },
      {
        name: 'componentType',
        required: false,
        type: 'string',
        description: 'Optional component type label.',
      },
    ],
    sample: {
      items: [{ code: 'BTN_PRIMARY', name: 'Primary button', componentType: 'BUTTON' }],
    },
  },
  DATA_ENTITY: {
    entityLabel: 'Data Entity',
    maxItems: MAX,
    notes: ['code and name are required.', 'tableName is optional physical table name.'],
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
    ],
    sample: {
      items: [{ code: 'CART_ITEM', name: 'Cart item', tableName: 'cart_items' }],
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
