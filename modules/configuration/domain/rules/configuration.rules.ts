import { CustomFieldStatus, CustomFieldType, FormVersionStatus } from '../enums/configuration.enum'
import type { CustomFieldDefinition } from '../model/custom-field'
import type { CustomFormVersion } from '../model/form-version'
import type { CustomFormField } from '../model/form-field'
import type { CustomFormSection } from '../model/form-section'
import type { CustomFieldValueInput } from '../model/field-value'
import type { LayoutDefinition } from '../model/layout'

export function isCustomFieldActive(field: CustomFieldDefinition): boolean {
  return field.status === CustomFieldStatus.Active
}

export function isSelectFieldType(fieldType: string): boolean {
  return fieldType === CustomFieldType.Select || fieldType === CustomFieldType.MultiSelect
}

export function isMultiSelectFieldType(fieldType: string): boolean {
  return fieldType === CustomFieldType.MultiSelect
}

export function isFormVersionPublished(version: CustomFormVersion): boolean {
  return version.status === FormVersionStatus.Published
}

export function canEditFormVersion(version: CustomFormVersion): boolean {
  return version.status === FormVersionStatus.Draft
}

export function isLayoutPublished(layout: LayoutDefinition): boolean {
  return layout.currentFlag === true
}

/** Value key on CustomFieldValueInput that corresponds to a given field type. */
export function getValueKeyForFieldType(
  fieldType: string
): keyof Omit<CustomFieldValueInput, 'fieldId'> {
  switch (fieldType) {
    case CustomFieldType.LongText:
      return 'valueLongText'
    case CustomFieldType.Number:
    case CustomFieldType.Percentage:
      return 'valueNumber'
    case CustomFieldType.Decimal:
    case CustomFieldType.Currency:
      return 'valueDecimal'
    case CustomFieldType.Boolean:
      return 'valueBoolean'
    case CustomFieldType.Date:
      return 'valueDate'
    case CustomFieldType.DateTime:
      return 'valueDatetime'
    case CustomFieldType.Select:
    case CustomFieldType.MultiSelect:
      return 'valueOptionIds'
    default:
      return 'valueText'
  }
}

/** Group form fields by section id ('' bucket for fields without a section). */
export function groupFormFieldsBySection(
  fields: CustomFormField[],
  sections: CustomFormSection[]
): Array<{ section: CustomFormSection | null; fields: CustomFormField[] }> {
  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder)
  const groups: Array<{ section: CustomFormSection | null; fields: CustomFormField[] }> = []

  for (const section of sorted) {
    groups.push({
      section,
      fields: fields
        .filter((f) => f.sectionId === section.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    })
  }

  const unsectioned = fields
    .filter((f) => !f.sectionId || !sections.some((s) => s.id === f.sectionId))
    .sort((a, b) => a.sortOrder - b.sortOrder)
  if (unsectioned.length > 0) {
    groups.push({ section: null, fields: unsectioned })
  }

  return groups
}
