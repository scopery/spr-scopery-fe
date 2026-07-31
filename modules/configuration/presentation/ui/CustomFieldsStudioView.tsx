'use client'

import { Archive, Eye, Plus, Trash2 } from 'lucide-react'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Badge,
  Button,
  Checkbox,
  Input,
  Select,
  Typography,
  PageSkeleton,
  Skeleton, Card,
} from '@/shared/ui'
import { useCustomFieldsStudio } from '../hooks/useCustomFieldsStudio'
import { CustomFieldType, ValidationRuleType } from '../../domain/enums/configuration.enum'
import { isSelectFieldType } from '../../domain/rules/configuration.rules'
import { cn } from '@/utils/cn'

const FIELD_TYPE_OPTIONS = Object.values(CustomFieldType).map((value) => ({ value, label: value }))
const VALIDATION_RULE_OPTIONS = Object.values(ValidationRuleType).map((value) => ({
  value,
  label: value,
}))

export function CustomFieldsStudioView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    objectTypes,
    fields,
    selectedField,
    selectedFieldId,
    setSelectedFieldId,
    options,
    visibilityPolicies,
    validationRules,
    loading,
    detailLoading,
    creatingField,
    createField,
    createOption,
    archiveOption,
    setVisibility,
    createValidationRule,
    deleteValidationRule,
  } = useCustomFieldsStudio(workspaceId)

  const [showCreateField, setShowCreateField] = useState(false)
  const [fieldForm, setFieldForm] = useState({
    objectTypeCode: '',
    fieldKey: '',
    label: '',
    fieldType: CustomFieldType.Text as string,
    required: false,
    sensitive: false,
    clientVisible: false,
  })
  const [optionForm, setOptionForm] = useState({ optionCode: '', label: '' })
  const [ruleForm, setRuleForm] = useState({
    ruleType: ValidationRuleType.MaxLength as string,
    ruleConfigJson: '',
  })

  if (loading) {
    return <PageSkeleton variant="split" />
  }

  const objectTypeOptions = objectTypes.map((t) => ({
    value: t.code,
    label: `${t.name} (${t.code})`,
  }))

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Custom Fields
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Define custom fields available on objects in this workspace.
          </Typography>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateField(true)}
          icon={<Plus size={16} />}
        >
          New field
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <Card>
          <div className="border-b border-neutral-100 px-4 py-3">
            <Typography weight="semibold" variant="small">
              Fields ({fields.length})
            </Typography>
          </div>
          {fields.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Typography tone="muted" variant="small">
                No custom fields yet.
              </Typography>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {fields.map((field) => (
                <li key={field.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedFieldId(field.id)}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-neutral-50',
                      selectedFieldId === field.id && 'bg-neutral-50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Typography weight="medium" variant="small">
                        {field.label}
                      </Typography>
                      <Badge tone="neutral">{field.fieldType}</Badge>
                    </div>
                    <Typography variant="small" tone="muted" className="font-mono text-xs">
                      {field.objectTypeCode} · {field.fieldKey}
                    </Typography>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          {!selectedField ? (
            <div className="px-4 py-16 text-center">
              <Typography tone="muted" variant="small">
                Select a field to view details.
              </Typography>
            </div>
          ) : (
            <div className="p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Typography as="h2" size="md" weight="medium">
                    {selectedField.label}
                  </Typography>
                  <Typography variant="small" tone="muted" className="mt-1 font-mono text-xs">
                    {selectedField.objectTypeCode} · {selectedField.fieldKey} ·{' '}
                    {selectedField.status}
                  </Typography>
                </div>
                <div className="flex gap-2">
                  {selectedField.required ? <Badge tone="warning">Required</Badge> : null}
                  {selectedField.sensitive ? <Badge tone="error">Sensitive</Badge> : null}
                  {selectedField.clientVisible ? (
                    <Badge tone="success">Client visible</Badge>
                  ) : null}
                </div>
              </div>

              {detailLoading ? (
                <div className="flex justify-center py-8">
                  <Skeleton variant="rectangular" width="100%" height={80} />
                </div>
              ) : (
                <div className="space-y-6">
                  {isSelectFieldType(selectedField.fieldType) ? (
                    <div>
                      <Typography weight="semibold" variant="small" className="mb-2">
                        Options
                      </Typography>
                      <ul className="mb-3 divide-y divide-neutral-100 border border-neutral-100">
                        {options.map((opt) => (
                          <li
                            key={opt.id}
                            className="flex items-center justify-between px-3 py-2 text-sm"
                          >
                            <span>
                              {opt.label}{' '}
                              <span className="font-mono text-xs text-neutral-400">
                                {opt.optionCode}
                              </span>
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="solid"
                                tone={opt.status === 'ACTIVE' ? 'success' : 'neutral'}
                              >
                                {opt.status === 'ACTIVE'
                                  ? 'Active'
                                  : opt.status === 'ARCHIVED'
                                    ? 'Archived'
                                    : opt.status}
                              </Badge>
                              {opt.status === 'ACTIVE' ? (
                                <Button
                                  variant="ghost"
                                  onClick={() => void archiveOption(selectedField.id, opt.id)}
                                  icon={<Archive size={16} />}
                                >
                                  Archive
                                </Button>
                              ) : null}
                            </div>
                          </li>
                        ))}
                        {options.length === 0 ? (
                          <li className="px-3 py-4 text-center">
                            <Typography variant="small" tone="muted">
                              No options yet.
                            </Typography>
                          </li>
                        ) : null}
                      </ul>
                      <div className="flex flex-wrap items-end gap-2">
                        <Input
                          placeholder="Option code"
                          value={optionForm.optionCode}
                          onChange={(e) =>
                            setOptionForm((f) => ({ ...f, optionCode: e.target.value }))
                          }
                        />
                        <Input
                          placeholder="Label"
                          value={optionForm.label}
                          onChange={(e) => setOptionForm((f) => ({ ...f, label: e.target.value }))}
                        />
                        <Button
                          variant="outline"
                          disabled={!optionForm.optionCode.trim() || !optionForm.label.trim()}
                          onClick={() =>
                            void createOption(selectedField.id, {
                              optionCode: optionForm.optionCode.trim(),
                              label: optionForm.label.trim(),
                            }).then(() => setOptionForm({ optionCode: '', label: '' }))
                          }
                          icon={<Plus size={16} />}
                        >
                          Add option
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <Typography weight="semibold" variant="small" className="mb-2">
                      Visibility policies
                    </Typography>
                    <ul className="mb-3 divide-y divide-neutral-100 border border-neutral-100">
                      {visibilityPolicies.map((policy) => (
                        <li
                          key={policy.id}
                          className="flex items-center justify-between px-3 py-2 text-sm"
                        >
                          <span>{policy.audienceType}</span>
                          <Badge tone={policy.visible ? 'success' : 'neutral'}>
                            {policy.visible ? 'Visible' : 'Hidden'}
                          </Badge>
                        </li>
                      ))}
                      {visibilityPolicies.length === 0 ? (
                        <li className="px-3 py-4 text-center">
                          <Typography variant="small" tone="muted">
                            No visibility policies set.
                          </Typography>
                        </li>
                      ) : null}
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          void setVisibility(selectedField.id, {
                            audienceType: 'INTERNAL',
                            visible: true,
                          })
                        }
                        icon={<Eye size={16} />}
                      >
                        Show to internal
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          void setVisibility(selectedField.id, {
                            audienceType: 'CLIENT',
                            visible: true,
                          })
                        }
                        icon={<Eye size={16} />}
                      >
                        Show to client
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          void setVisibility(selectedField.id, {
                            audienceType: 'CLIENT',
                            visible: false,
                          })
                        }
                        icon={<Eye size={16} />}
                      >
                        Hide from client
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Typography weight="semibold" variant="small" className="mb-2">
                      Validation rules
                    </Typography>
                    <ul className="mb-3 divide-y divide-neutral-100 border border-neutral-100">
                      {validationRules.map((rule) => (
                        <li
                          key={rule.id}
                          className="flex items-center justify-between px-3 py-2 text-sm"
                        >
                          <span>
                            {rule.ruleType}{' '}
                            {rule.ruleConfigJson ? (
                              <span className="font-mono text-xs text-neutral-400">
                                {rule.ruleConfigJson}
                              </span>
                            ) : null}
                          </span>
                          <Button
                            variant="ghost"
                            onClick={() => void deleteValidationRule(selectedField.id, rule.id)}
                            icon={<Trash2 size={16} />}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                      {validationRules.length === 0 ? (
                        <li className="px-3 py-4 text-center">
                          <Typography variant="small" tone="muted">
                            No validation rules yet.
                          </Typography>
                        </li>
                      ) : null}
                    </ul>
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="w-44">
                        <Select
                          value={ruleForm.ruleType}
                          onValueChange={(v: string) => setRuleForm((f) => ({ ...f, ruleType: v }))}
                          options={VALIDATION_RULE_OPTIONS}
                        />
                      </div>
                      <Input
                        placeholder='Rule config JSON, e.g. {"max":255}'
                        value={ruleForm.ruleConfigJson}
                        onChange={(e) =>
                          setRuleForm((f) => ({ ...f, ruleConfigJson: e.target.value }))
                        }
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          void createValidationRule(selectedField.id, {
                            ruleType: ruleForm.ruleType,
                            ruleConfigJson: ruleForm.ruleConfigJson.trim() || undefined,
                          }).then(() => setRuleForm((f) => ({ ...f, ruleConfigJson: '' })))
                        }
                        icon={<Plus size={16} />}
                      >
                        Add rule
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {showCreateField ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-lg">
            <Typography as="h2" size="md" weight="medium" className="mb-2">
              New custom field
            </Typography>
            <div className="flex flex-col gap-4">
              <div>
                <Typography variant="small" tone="muted" className="mb-1.5">
                  Object type
                </Typography>
                <Select
                  value={fieldForm.objectTypeCode}
                  onValueChange={(v: string) => setFieldForm((f) => ({ ...f, objectTypeCode: v }))}
                  options={objectTypeOptions}
                  placeholder="Select object type"
                />
              </div>
              <Input
                label="Field key"
                value={fieldForm.fieldKey}
                onChange={(e) => setFieldForm((f) => ({ ...f, fieldKey: e.target.value }))}
              />
              <Input
                label="Label"
                value={fieldForm.label}
                onChange={(e) => setFieldForm((f) => ({ ...f, label: e.target.value }))}
              />
              <div>
                <Typography variant="small" tone="muted" className="mb-1.5">
                  Field type
                </Typography>
                <Select
                  value={fieldForm.fieldType}
                  onValueChange={(v: string) => setFieldForm((f) => ({ ...f, fieldType: v }))}
                  options={FIELD_TYPE_OPTIONS}
                />
              </div>
              <Checkbox
                label="Required"
                checked={fieldForm.required}
                onChange={(e) => setFieldForm((f) => ({ ...f, required: e.target.checked }))}
              />
              <Checkbox
                label="Sensitive"
                checked={fieldForm.sensitive}
                onChange={(e) => setFieldForm((f) => ({ ...f, sensitive: e.target.checked }))}
              />
              <Checkbox
                label="Client visible"
                checked={fieldForm.clientVisible}
                onChange={(e) => setFieldForm((f) => ({ ...f, clientVisible: e.target.checked }))}
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  disabled={
                    creatingField ||
                    !fieldForm.objectTypeCode ||
                    !fieldForm.fieldKey.trim() ||
                    !fieldForm.label.trim()
                  }
                  onClick={() =>
                    void createField({
                      objectTypeCode: fieldForm.objectTypeCode,
                      fieldKey: fieldForm.fieldKey.trim(),
                      label: fieldForm.label.trim(),
                      fieldType: fieldForm.fieldType,
                      required: fieldForm.required,
                      sensitive: fieldForm.sensitive,
                      clientVisible: fieldForm.clientVisible,
                    }).then(() => {
                      setShowCreateField(false)
                      setFieldForm({
                        objectTypeCode: '',
                        fieldKey: '',
                        label: '',
                        fieldType: CustomFieldType.Text,
                        required: false,
                        sensitive: false,
                        clientVisible: false,
                      })
                    })
                  }
                >
                  {creatingField ? 'Creating…' : 'Create'}
                </Button>
                <Button variant="ghost" onClick={() => setShowCreateField(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
