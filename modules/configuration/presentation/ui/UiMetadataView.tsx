'use client'

import { Plus, Upload } from 'lucide-react'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Badge, Button, Input, Select, Typography, PageSkeleton } from '@/shared/ui'
import { useUiMetadata } from '../hooks/useUiMetadata'
import { LayoutType } from '../../domain/enums/configuration.enum'
import { cn } from '@/utils/cn'

const TABS = [
  { id: 'layouts', label: 'Layouts' },
  { id: 'status-sets', label: 'Status Sets' },
  { id: 'tags', label: 'Tags' },
  { id: 'taxonomies', label: 'Taxonomies' },
] as const

type TabId = (typeof TABS)[number]['id']

const LAYOUT_TYPE_OPTIONS = Object.values(LayoutType).map((value) => ({ value, label: value }))

export function UiMetadataView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [tab, setTab] = useState<TabId>('layouts')
  const {
    objectTypes,
    layouts,
    statusSets,
    tags,
    taxonomies,
    loading,
    selectedStatusSetId,
    setSelectedStatusSetId,
    statusValues,
    selectedTaxonomyId,
    setSelectedTaxonomyId,
    taxonomyTerms,
    createLayout,
    publishLayout,
    createStatusSet,
    createStatusValue,
    createTag,
    createTaxonomy,
    createTaxonomyTerm,
  } = useUiMetadata(workspaceId)

  const [layoutForm, setLayoutForm] = useState({
    objectTypeCode: '',
    layoutType: LayoutType.ListColumns as string,
    name: '',
    layoutJson: '{}',
  })
  const [statusSetForm, setStatusSetForm] = useState({ objectTypeCode: '', setCode: '', name: '' })
  const [statusValueForm, setStatusValueForm] = useState({
    valueCode: '',
    label: '',
    domainCategory: '',
  })
  const [tagForm, setTagForm] = useState({ tagCode: '', label: '', color: '' })
  const [taxonomyForm, setTaxonomyForm] = useState({ taxonomyCode: '', name: '' })
  const [termForm, setTermForm] = useState({ termCode: '', label: '', parentTermId: '' })

  if (loading) {
    return (
      <PageSkeleton variant="list" />
    )
  }

  const objectTypeOptions = objectTypes.map((t) => ({ value: t.code, label: `${t.name} (${t.code})` }))

  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          UI Metadata
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Layouts, status workflows, tags, and taxonomies for this workspace.
        </Typography>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm transition-colors',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'layouts' ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Object type</th>
                  <th className="px-3 py-2 font-medium">Layout type</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {layouts.map((layout) => (
                  <tr key={layout.id} className="border-t border-neutral-100">
                    <td className="px-3 py-2">{layout.name}</td>
                    <td className="px-3 py-2">{layout.objectTypeCode}</td>
                    <td className="px-3 py-2">{layout.layoutType}</td>
                    <td className="px-3 py-2">
                      <Badge tone={layout.currentFlag ? 'success' : 'neutral'}>
                        {layout.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {!layout.currentFlag ? (
                        <Button variant="ghost" onClick={() => void publishLayout(layout.id)} icon={<Upload size={16} />}>
                          Publish
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {layouts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center">
                      <Typography variant="small" tone="muted">
                        No layouts yet.
                      </Typography>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="border border-neutral-200 bg-white p-4">
            <Typography weight="semibold" variant="small" className="mb-3">
              New layout
            </Typography>
            <div className="flex flex-col gap-2">
              <Select
                value={layoutForm.objectTypeCode}
                onValueChange={(v: string) => setLayoutForm((f) => ({ ...f, objectTypeCode: v }))}
                options={objectTypeOptions}
                placeholder="Object type"
              />
              <Select
                value={layoutForm.layoutType}
                onValueChange={(v: string) => setLayoutForm((f) => ({ ...f, layoutType: v }))}
                options={LAYOUT_TYPE_OPTIONS}
              />
              <Input
                placeholder="Name"
                value={layoutForm.name}
                onChange={(e) => setLayoutForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                placeholder="Layout JSON"
                value={layoutForm.layoutJson}
                onChange={(e) => setLayoutForm((f) => ({ ...f, layoutJson: e.target.value }))}
              />
              <Button
                variant="outline"
                disabled={!layoutForm.objectTypeCode || !layoutForm.name.trim()}
                onClick={() =>
                  void createLayout({
                    objectTypeCode: layoutForm.objectTypeCode,
                    layoutType: layoutForm.layoutType,
                    name: layoutForm.name.trim(),
                    layoutJson: layoutForm.layoutJson.trim() || '{}',
                  }).then(() =>
                    setLayoutForm({
                      objectTypeCode: '',
                      layoutType: LayoutType.ListColumns,
                      name: '',
                      layoutJson: '{}',
                    })
                  )
                }
              >
                Create layout
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'status-sets' ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <div className="border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-4 py-3">
              <Typography weight="semibold" variant="small">
                Status sets ({statusSets.length})
              </Typography>
            </div>
            <ul className="divide-y divide-neutral-100">
              {statusSets.map((set) => (
                <li key={set.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedStatusSetId(set.id)}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-neutral-50',
                      selectedStatusSetId === set.id && 'bg-neutral-50'
                    )}
                  >
                    <Typography weight="medium" variant="small">
                      {set.name}
                    </Typography>
                    <Typography variant="small" tone="muted" className="font-mono text-xs">
                      {set.objectTypeCode} · {set.setCode}
                    </Typography>
                  </button>
                </li>
              ))}
              {statusSets.length === 0 ? (
                <li className="px-4 py-10 text-center">
                  <Typography variant="small" tone="muted">
                    No status sets yet.
                  </Typography>
                </li>
              ) : null}
            </ul>
            <div className="border-t border-neutral-100 p-3">
              <Typography weight="semibold" variant="small" className="mb-2">
                New status set
              </Typography>
              <div className="flex flex-col gap-2">
                <Select
                  value={statusSetForm.objectTypeCode}
                  onValueChange={(v: string) =>
                    setStatusSetForm((f) => ({ ...f, objectTypeCode: v }))
                  }
                  options={objectTypeOptions}
                  placeholder="Object type"
                />
                <Input
                  placeholder="Set code"
                  value={statusSetForm.setCode}
                  onChange={(e) => setStatusSetForm((f) => ({ ...f, setCode: e.target.value }))}
                />
                <Input
                  placeholder="Name"
                  value={statusSetForm.name}
                  onChange={(e) => setStatusSetForm((f) => ({ ...f, name: e.target.value }))}
                />
                <Button
                  variant="outline"
                  disabled={
                    !statusSetForm.objectTypeCode ||
                    !statusSetForm.setCode.trim() ||
                    !statusSetForm.name.trim()
                  }
                  onClick={() =>
                    void createStatusSet({
                      objectTypeCode: statusSetForm.objectTypeCode,
                      setCode: statusSetForm.setCode.trim(),
                      name: statusSetForm.name.trim(),
                    }).then(() => setStatusSetForm({ objectTypeCode: '', setCode: '', name: '' }))
                  } icon={<Plus size={16} />}>
                  Create set
                </Button>
              </div>
            </div>
          </div>

          <div className="border border-neutral-200 bg-white p-4">
            {!selectedStatusSetId ? (
              <Typography tone="muted" variant="small">
                Select a status set to view values.
              </Typography>
            ) : (
              <>
                <Typography weight="semibold" variant="small" className="mb-3">
                  Values
                </Typography>
                <ul className="mb-4 divide-y divide-neutral-100 border border-neutral-100">
                  {statusValues.map((value) => (
                    <li key={value.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{value.label}</span>
                      <Badge tone="neutral">
                        {value.domainCategory}
                      </Badge>
                    </li>
                  ))}
                  {statusValues.length === 0 ? (
                    <li className="px-3 py-4 text-center">
                      <Typography variant="small" tone="muted">
                        No values yet.
                      </Typography>
                    </li>
                  ) : null}
                </ul>
                <div className="flex flex-wrap items-end gap-2">
                  <Input
                    placeholder="Value code"
                    value={statusValueForm.valueCode}
                    onChange={(e) =>
                      setStatusValueForm((f) => ({ ...f, valueCode: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Label"
                    value={statusValueForm.label}
                    onChange={(e) => setStatusValueForm((f) => ({ ...f, label: e.target.value }))}
                  />
                  <Input
                    placeholder="Domain category"
                    value={statusValueForm.domainCategory}
                    onChange={(e) =>
                      setStatusValueForm((f) => ({ ...f, domainCategory: e.target.value }))
                    }
                  />
                  <Button
                    variant="outline"
                    disabled={
                      !statusValueForm.valueCode.trim() ||
                      !statusValueForm.label.trim() ||
                      !statusValueForm.domainCategory.trim()
                    }
                    onClick={() =>
                      void createStatusValue(selectedStatusSetId, {
                        valueCode: statusValueForm.valueCode.trim(),
                        label: statusValueForm.label.trim(),
                        domainCategory: statusValueForm.domainCategory.trim(),
                      }).then(() =>
                        setStatusValueForm({ valueCode: '', label: '', domainCategory: '' })
                      )
                    } icon={<Plus size={16} />}>
                    Add value
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'tags' ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Label</th>
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 font-medium">Color</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id} className="border-t border-neutral-100">
                    <td className="px-3 py-2">{tag.label}</td>
                    <td className="px-3 py-2 font-mono text-xs">{tag.tagCode}</td>
                    <td className="px-3 py-2">
                      {tag.color ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full border border-neutral-200"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.color}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="solid" tone={tag.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {tag.status === 'ACTIVE' ? 'Active' : tag.status === 'ARCHIVED' ? 'Archived' : tag.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {tags.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center">
                      <Typography variant="small" tone="muted">
                        No tags yet.
                      </Typography>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="border border-neutral-200 bg-white p-4">
            <Typography weight="semibold" variant="small" className="mb-3">
              New tag
            </Typography>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Tag code"
                value={tagForm.tagCode}
                onChange={(e) => setTagForm((f) => ({ ...f, tagCode: e.target.value }))}
              />
              <Input
                placeholder="Label"
                value={tagForm.label}
                onChange={(e) => setTagForm((f) => ({ ...f, label: e.target.value }))}
              />
              <Input
                placeholder="Color (hex, optional)"
                value={tagForm.color}
                onChange={(e) => setTagForm((f) => ({ ...f, color: e.target.value }))}
              />
              <Button
                variant="outline"
                disabled={!tagForm.tagCode.trim() || !tagForm.label.trim()}
                onClick={() =>
                  void createTag({
                    tagCode: tagForm.tagCode.trim(),
                    label: tagForm.label.trim(),
                    color: tagForm.color.trim() || undefined,
                  }).then(() => setTagForm({ tagCode: '', label: '', color: '' }))
                } icon={<Plus size={16} />}>
                Create tag
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'taxonomies' ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <div className="border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-4 py-3">
              <Typography weight="semibold" variant="small">
                Taxonomies ({taxonomies.length})
              </Typography>
            </div>
            <ul className="divide-y divide-neutral-100">
              {taxonomies.map((taxonomy) => (
                <li key={taxonomy.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedTaxonomyId(taxonomy.id)}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-neutral-50',
                      selectedTaxonomyId === taxonomy.id && 'bg-neutral-50'
                    )}
                  >
                    <Typography weight="medium" variant="small">
                      {taxonomy.name}
                    </Typography>
                    <Typography variant="small" tone="muted" className="font-mono text-xs">
                      {taxonomy.taxonomyCode}
                    </Typography>
                  </button>
                </li>
              ))}
              {taxonomies.length === 0 ? (
                <li className="px-4 py-10 text-center">
                  <Typography variant="small" tone="muted">
                    No taxonomies yet.
                  </Typography>
                </li>
              ) : null}
            </ul>
            <div className="border-t border-neutral-100 p-3">
              <Typography weight="semibold" variant="small" className="mb-2">
                New taxonomy
              </Typography>
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="Taxonomy code"
                  value={taxonomyForm.taxonomyCode}
                  onChange={(e) =>
                    setTaxonomyForm((f) => ({ ...f, taxonomyCode: e.target.value }))
                  }
                />
                <Input
                  placeholder="Name"
                  value={taxonomyForm.name}
                  onChange={(e) => setTaxonomyForm((f) => ({ ...f, name: e.target.value }))}
                />
                <Button
                  variant="outline"
                  disabled={!taxonomyForm.taxonomyCode.trim() || !taxonomyForm.name.trim()}
                  onClick={() =>
                    void createTaxonomy({
                      taxonomyCode: taxonomyForm.taxonomyCode.trim(),
                      name: taxonomyForm.name.trim(),
                    }).then(() => setTaxonomyForm({ taxonomyCode: '', name: '' }))
                  } icon={<Plus size={16} />}>
                  Create taxonomy
                </Button>
              </div>
            </div>
          </div>

          <div className="border border-neutral-200 bg-white p-4">
            {!selectedTaxonomyId ? (
              <Typography tone="muted" variant="small">
                Select a taxonomy to view terms.
              </Typography>
            ) : (
              <>
                <Typography weight="semibold" variant="small" className="mb-3">
                  Terms
                </Typography>
                <ul className="mb-4 divide-y divide-neutral-100 border border-neutral-100">
                  {taxonomyTerms.map((term) => (
                    <li key={term.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{term.label}</span>
                      <span className="font-mono text-xs text-neutral-400">
                        {term.parentTermId
                          ? `child of ${
                              taxonomyTerms.find((t) => t.id === term.parentTermId)?.label ??
                              term.parentTermId
                            }`
                          : 'root'}
                      </span>
                    </li>
                  ))}
                  {taxonomyTerms.length === 0 ? (
                    <li className="px-3 py-4 text-center">
                      <Typography variant="small" tone="muted">
                        No terms yet.
                      </Typography>
                    </li>
                  ) : null}
                </ul>
                <div className="flex flex-wrap items-end gap-2">
                  <Input
                    placeholder="Term code"
                    value={termForm.termCode}
                    onChange={(e) => setTermForm((f) => ({ ...f, termCode: e.target.value }))}
                  />
                  <Input
                    placeholder="Label"
                    value={termForm.label}
                    onChange={(e) => setTermForm((f) => ({ ...f, label: e.target.value }))}
                  />
                  <div className="w-44">
                    <Select
                      value={termForm.parentTermId}
                      onValueChange={(v: string) => setTermForm((f) => ({ ...f, parentTermId: v }))}
                      options={[
                        { value: '', label: 'No parent (root)' },
                        ...taxonomyTerms.map((t) => ({ value: t.id, label: t.label })),
                      ]}
                    />
                  </div>
                  <Button
                    variant="outline"
                    disabled={!termForm.termCode.trim() || !termForm.label.trim()}
                    onClick={() =>
                      void createTaxonomyTerm(selectedTaxonomyId, {
                        termCode: termForm.termCode.trim(),
                        label: termForm.label.trim(),
                        parentTermId: termForm.parentTermId || undefined,
                      }).then(() => setTermForm({ termCode: '', label: '', parentTermId: '' }))
                    } icon={<Plus size={16} />}>
                    Add term
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
