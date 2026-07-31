'use client'

import { Plus, Upload } from 'lucide-react'

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
import { useFormBuilder } from '../hooks/useFormBuilder'
import { FormFieldSource } from '../../domain/enums/configuration.enum'
import { canEditFormVersion } from '../../domain/rules/configuration.rules'

const FIELD_SOURCE_OPTIONS = Object.values(FormFieldSource).map((value) => ({
  value,
  label: value,
}))

export function FormBuilderView() {
  const { formId } = useParams<{ workspaceId: string; formId: string }>()
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    customFields,
    form,
    versions,
    selectedVersion,
    selectedVersionId,
    setSelectedVersionId,
    fieldGroups,
    loading,
    structureLoading,
    creatingVersion,
    publishing,
    createVersion,
    publishVersion,
    createSection,
    createField,
  } = useFormBuilder(workspaceId, formId)

  const [sectionTitle, setSectionTitle] = useState('')
  const [fieldForm, setFieldForm] = useState({
    fieldSource: FormFieldSource.CustomField as string,
    customFieldDefinitionId: '',
    coreFieldKey: '',
    sectionId: '',
    requiredOnForm: false,
  })

  if (loading) {
    return <PageSkeleton variant="detail" />
  }

  if (!form) {
    return (
      <Typography variant="small" tone="muted">
        Form not found.
      </Typography>
    )
  }

  const versionOptions = versions
    .sort((a, b) => b.versionNumber - a.versionNumber)
    .map((v) => ({ value: v.id, label: `v${v.versionNumber} · ${v.status}` }))

  const sectionOptions = [
    { value: '', label: 'No section' },
    ...fieldGroups
      .filter((g) => g.section)
      .map((g) => ({ value: g.section!.id, label: g.section!.title })),
  ]

  const customFieldOptions = customFields
    .filter((f) => f.objectTypeCode === form.objectTypeCode)
    .map((f) => ({ value: f.id, label: f.label }))

  const editable = selectedVersion ? canEditFormVersion(selectedVersion) : false

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            {form.name}
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1 font-mono text-xs">
            {form.formCode} · {form.objectTypeCode}
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-48">
            <Select
              value={selectedVersionId ?? ''}
              onValueChange={(v: string) => setSelectedVersionId(v)}
              options={versionOptions}
              placeholder="Select version"
            />
          </div>
          <Button
            variant="outline"
            disabled={creatingVersion}
            onClick={() => void createVersion()}
            icon={<Plus size={16} />}
          >
            {creatingVersion ? 'Creating…' : 'New version'}
          </Button>
          {selectedVersion && editable ? (
            <Button
              variant="primary"
              disabled={publishing}
              onClick={() => void publishVersion(selectedVersion.id)}
              icon={<Upload size={16} />}
            >
              {publishing ? 'Publishing…' : 'Publish'}
            </Button>
          ) : null}
        </div>
      </div>

      {!selectedVersion ? (
        <div className="border border-dashed border-neutral-300 bg-neutral-50 px-4 py-16 text-center">
          <Typography tone="muted" variant="small">
            No version yet. Create a version to start building the form.
          </Typography>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <Typography weight="semibold" variant="small">
                Version {selectedVersion.versionNumber}
              </Typography>
              <Badge
                variant="solid"
                tone={selectedVersion.status === 'PUBLISHED' ? 'success' : 'neutral'}
              >
                {selectedVersion.status === 'PUBLISHED'
                  ? 'Published'
                  : selectedVersion.status === 'DRAFT'
                    ? 'Draft'
                    : selectedVersion.status}
              </Badge>
            </div>

            {structureLoading ? (
              <div className="flex justify-center py-8">
                <Skeleton variant="rectangular" width="100%" height={80} />
              </div>
            ) : (
              <div className="space-y-4">
                {fieldGroups.map((group, idx) => (
                  <div
                    key={group.section?.id ?? `unsectioned-${idx}`}
                    className="border border-neutral-100"
                  >
                    <div className="border-b border-neutral-100 bg-neutral-50 px-3 py-2">
                      <Typography weight="medium" variant="small">
                        {group.section?.title ?? 'Unsectioned fields'}
                      </Typography>
                    </div>
                    {group.fields.length === 0 ? (
                      <div className="px-3 py-4 text-center">
                        <Typography variant="small" tone="muted">
                          No fields in this section.
                        </Typography>
                      </div>
                    ) : (
                      <ul className="divide-y divide-neutral-100">
                        {group.fields.map((field) => {
                          const def = customFields.find(
                            (f) => f.id === field.customFieldDefinitionId
                          )
                          return (
                            <li
                              key={field.id}
                              className="flex items-center justify-between px-3 py-2 text-sm"
                            >
                              <span>{def?.label ?? field.fieldSource}</span>
                              <div className="flex items-center gap-2">
                                <Badge tone="neutral">{field.fieldSource}</Badge>
                                {field.requiredOnForm ? (
                                  <Badge tone="warning">Required</Badge>
                                ) : null}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                ))}
                {fieldGroups.length === 0 ? (
                  <Typography tone="muted" variant="small">
                    No sections or fields yet.
                  </Typography>
                ) : null}
              </div>
            )}
          </Card>

          {editable ? (
            <div className="space-y-6">
              <Card className="p-4">
                <Typography weight="semibold" variant="small" className="mb-3">
                  Add section
                </Typography>
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="Section title"
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    disabled={!sectionTitle.trim()}
                    onClick={() =>
                      void createSection({ title: sectionTitle.trim() }).then(() =>
                        setSectionTitle('')
                      )
                    }
                    icon={<Plus size={16} />}
                  >
                    Add section
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <Typography weight="semibold" variant="small" className="mb-3">
                  Add field
                </Typography>
                <div className="flex flex-col gap-2">
                  <Select
                    value={fieldForm.fieldSource}
                    onValueChange={(v: string) => setFieldForm((f) => ({ ...f, fieldSource: v }))}
                    options={FIELD_SOURCE_OPTIONS}
                  />
                  {fieldForm.fieldSource === FormFieldSource.CustomField ? (
                    <Select
                      value={fieldForm.customFieldDefinitionId}
                      onValueChange={(v: string) =>
                        setFieldForm((f) => ({ ...f, customFieldDefinitionId: v }))
                      }
                      options={customFieldOptions}
                      placeholder="Select custom field"
                    />
                  ) : null}
                  {fieldForm.fieldSource === FormFieldSource.CoreField ? (
                    <Input
                      placeholder="Core field key"
                      value={fieldForm.coreFieldKey}
                      onChange={(e) =>
                        setFieldForm((f) => ({ ...f, coreFieldKey: e.target.value }))
                      }
                    />
                  ) : null}
                  <Select
                    value={fieldForm.sectionId}
                    onValueChange={(v: string) => setFieldForm((f) => ({ ...f, sectionId: v }))}
                    options={sectionOptions}
                  />
                  <Checkbox
                    label="Required on form"
                    checked={fieldForm.requiredOnForm}
                    onChange={(e) =>
                      setFieldForm((f) => ({ ...f, requiredOnForm: e.target.checked }))
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      void createField({
                        fieldSource: fieldForm.fieldSource,
                        customFieldDefinitionId: fieldForm.customFieldDefinitionId || undefined,
                        coreFieldKey: fieldForm.coreFieldKey.trim() || undefined,
                        sectionId: fieldForm.sectionId || undefined,
                        requiredOnForm: fieldForm.requiredOnForm,
                      }).then(() =>
                        setFieldForm({
                          fieldSource: FormFieldSource.CustomField,
                          customFieldDefinitionId: '',
                          coreFieldKey: '',
                          sectionId: '',
                          requiredOnForm: false,
                        })
                      )
                    }
                    icon={<Plus size={16} />}
                  >
                    Add field
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center">
              <Typography tone="muted" variant="small">
                This version is {selectedVersion.status.toLowerCase()} and cannot be edited. Create
                a new version to make changes.
              </Typography>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
