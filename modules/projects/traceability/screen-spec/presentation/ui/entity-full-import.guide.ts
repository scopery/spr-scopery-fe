import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'
import { ENTITY_IMPORT_DATA_TYPES, ENTITY_IMPORT_FULL_MAX_ITEMS } from '../../domain/model/entity-import'

export const ENTITY_FULL_SPEC_IMPORT_GUIDE: BulkImportFormatGuide = {
  entityLabel: 'Data entity full spec',
  maxItems: ENTITY_IMPORT_FULL_MAX_ITEMS,
  notes: [
    'Payload shape: { "items": [ DataEntity, ... ] }. A bare array is also accepted.',
    'POST …/applications/{appId}/data-entities/import-full — one async job creates each entity, then its columns.',
    'projectId is required on each item, or select a project in the dialog.',
    'fields[] is optional. Omit it to create a catalog table only.',
    'Excel / Bulk add still create the catalog shell only (code, name, tableName, description).',
    'Unknown keys are rejected. Duplicate entity code or columnName in the same file is rejected on the client.',
  ],
  fields: [
    { name: 'projectId', required: true, type: 'uuid', description: 'Owning project. Omit only if a project is selected in the dialog.' },
    { name: 'code', required: true, type: 'string', description: 'Entity code (e.g. CART_ITEM).' },
    { name: 'name', required: true, type: 'string', description: 'Entity display name.' },
    { name: 'description', required: false, type: 'string', description: 'Optional description.' },
    { name: 'tableName', required: false, type: 'string', description: 'Optional physical table name.' },
    { name: 'moduleId', required: false, type: 'uuid', description: 'Optional catalog module to attach the entity to.' },
    {
      name: 'fields',
      required: false,
      type: 'EntityField[]',
      description: 'Physical columns created with the entity.',
    },
  ],
  entities: [
    {
      name: 'EntityField',
      path: 'items[].fields[]',
      description: 'One column on the data entity.',
      fields: [
        { name: 'columnName', required: true, type: 'string', description: 'Physical column name (e.g. qty).' },
        {
          name: 'dataType',
          required: true,
          type: 'enum',
          enumValues: [...ENTITY_IMPORT_DATA_TYPES],
          description: 'Column type. Matches the catalog field picker plus BE extras (BIGINT, JSONB, …).',
        },
        { name: 'maxLength', required: false, type: 'integer', description: 'Optional max length (VARCHAR).' },
        {
          name: 'isNullable',
          required: false,
          type: 'boolean',
          description: 'Defaults to false when omitted.',
        },
        { name: 'isUnique', required: false, type: 'boolean', description: 'Defaults to false when omitted.' },
        {
          name: 'isPrimaryKey',
          required: false,
          type: 'boolean',
          description: 'Defaults to false when omitted.',
        },
        { name: 'defaultValue', required: false, type: 'string', description: 'Optional default value.' },
        { name: 'precision', required: false, type: 'integer', description: 'Optional DECIMAL precision.' },
        { name: 'scale', required: false, type: 'integer', description: 'Optional DECIMAL scale.' },
        { name: 'remark', required: false, type: 'string', description: 'Optional note.' },
        { name: 'displayOrder', required: false, type: 'integer', description: 'Sort order. Defaults to 0.' },
      ],
    },
  ],
  sample: {
    items: [
      {
        code: 'CART_ITEM',
        name: 'Cart item',
        tableName: 'cart_items',
        description: 'Line item on a cart',
        fields: [
          { columnName: 'id', dataType: 'UUID', isPrimaryKey: true, displayOrder: 0 },
          { columnName: 'qty', dataType: 'INTEGER', isNullable: false, displayOrder: 1 },
          { columnName: 'sku', dataType: 'VARCHAR', maxLength: 64, isUnique: true, displayOrder: 2 },
        ],
      },
    ],
  },
}
