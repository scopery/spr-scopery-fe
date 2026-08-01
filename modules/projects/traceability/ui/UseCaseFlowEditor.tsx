'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog, Modal, SearchableSelect } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { useUseCaseFlowScope } from '../hooks/useUseCaseFlowScope'
import { parseFlowContent } from '../model/flow-mention'
import { UseCaseFlowType } from '../model/use-case'
import type {
  AddFlowStepBody,
  ReorderFlowStepsBody,
  UpdateFlowStepBody,
  UseCaseFlow,
  UseCaseFlowStep,
} from '../model/use-case'
import { FlowMentionInput } from './FlowMentionInput'
import { FlowMentionReadonly } from './FlowMentionReadonly'

const FLOW_TYPE_LABELS: Record<string, string> = {
  [UseCaseFlowType.Main]: 'Main Flow',
  [UseCaseFlowType.Alternative]: 'Alternative Flow',
  [UseCaseFlowType.Exception]: 'Exception Flow',
}

const FLOW_TYPE_COLORS: Record<string, string> = {
  [UseCaseFlowType.Main]: 'bg-teal-500 text-white',
  [UseCaseFlowType.Alternative]: 'bg-neutral-200 text-neutral-800',
  [UseCaseFlowType.Exception]: 'bg-neutral-500 text-white',
}

const STEP_TYPE_OPTIONS = [
  { value: 'USER_ACTION', label: 'User Action' },
  { value: 'SYSTEM_ACTION', label: 'System Action' },
  { value: 'CONDITION', label: 'Condition' },
  { value: 'NAVIGATION', label: 'Navigation' },
  { value: 'RESULT', label: 'Result' },
  { value: 'ERROR', label: 'Error' },
]

interface StepModalProps {
  open: boolean
  initial?: UseCaseFlowStep | null
  saving: boolean
  hasFunction: boolean
  hasScreens: boolean
  functionLabel: string | null
  screenOptions: Array<{ value: string; label: string }>
  listMentionOptions: ReturnType<typeof useUseCaseFlowScope>['listMentionOptions']
  onSave: (
    stepType: string,
    contentJson: string | null,
    screenContextId: string | null
  ) => Promise<void>
  onClose: () => void
}

function StepModal({
  open,
  initial,
  saving,
  hasFunction,
  hasScreens,
  functionLabel,
  screenOptions,
  listMentionOptions,
  onSave,
  onClose,
}: StepModalProps) {
  const [stepType, setStepType] = useState(initial?.stepType ?? 'USER_ACTION')
  const [contentJson, setContentJson] = useState(initial?.contentJson ?? '')
  const [screenContextId, setScreenContextId] = useState(initial?.screenContextId ?? '')

  useEffect(() => {
    if (!open) return
    setStepType(initial?.stepType ?? 'USER_ACTION')
    setContentJson(initial?.contentJson ?? '')
    setScreenContextId(initial?.screenContextId ?? '')
  }, [open, initial])

  const structuredMentionsBlocked = !hasFunction
  const screenPickerDisabled = !hasFunction || !hasScreens

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit step' : 'Add step'}
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: saving ? 'Saving…' : initial ? 'Save' : 'Add step',
          onClick: () =>
            void onSave(stepType, contentJson || null, screenContextId || null),
          variant: 'primary',
          disabled: saving,
          loading: saving,
        },
      ]}
    >
      <div className="space-y-4">
        {!hasFunction ? (
          <div className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Link a primary Function to enable Screen Context and @mentions. You can still save plain
            text steps.
          </div>
        ) : !hasScreens ? (
          <div className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Function {functionLabel ?? ''} has no linked Screens yet. Link Screens on the Function
            before setting Screen Context. @mentions for APIs/Entities remain available.
          </div>
        ) : null}

        <div>
          <p className="mb-1.5 text-xs text-neutral-500">Step type</p>
          <SearchableSelect
            options={STEP_TYPE_OPTIONS}
            value={stepType}
            onValueChange={setStepType}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs text-neutral-500">Screen Context</p>
          <SearchableSelect
            options={[
              { value: '', label: '— None —' },
              ...screenOptions,
            ]}
            value={screenContextId}
            onValueChange={setScreenContextId}
            disabled={screenPickerDisabled}
            placeholder={
              !hasFunction
                ? 'Requires primary Function'
                : !hasScreens
                  ? 'No Screens linked to Function'
                  : 'Select screen…'
            }
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs text-neutral-500">Content</p>
          {structuredMentionsBlocked ? (
            <textarea
              rows={3}
              placeholder="Describe this step…"
              value={contentJson}
              onChange={(e) => setContentJson(e.target.value)}
              className="w-full border border-neutral-200 px-2 py-2 text-sm outline-none focus:border-primary"
            />
          ) : (
            <FlowMentionInput
              value={contentJson}
              screenContextId={screenContextId || null}
              listMentionOptions={listMentionOptions}
              onChange={setContentJson}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}

interface Props {
  projectId: string
  useCaseId: string
  flow: UseCaseFlow
  onUpdateFlow: (name: string | null, conditionText: string | null) => Promise<void>
  onDeleteFlow: () => Promise<void>
  onAddStep: (body: AddFlowStepBody) => Promise<void>
  onUpdateStep: (stepId: string, body: UpdateFlowStepBody) => Promise<void>
  onDeleteStep: (stepId: string) => Promise<void>
  onReorderSteps: (body: ReorderFlowStepsBody) => Promise<void>
}

export function UseCaseFlowEditor({
  projectId,
  useCaseId,
  flow,
  onDeleteFlow,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onReorderSteps,
}: Props) {
  const { scope, hasFunction, hasScreens, listMentionOptions } = useUseCaseFlowScope(
    projectId,
    useCaseId
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<UseCaseFlowStep | null>(null)
  const [modalSaving, setModalSaving] = useState(false)

  const screenOptions =
    scope?.screens.map((s) => ({
      value: s.id,
      label: s.code ? `${s.code} — ${s.name}` : s.name,
    })) ?? []

  const screenNameById = new Map(scope?.screens.map((s) => [s.id, s.name]) ?? [])

  const openAdd = () => {
    setEditingStep(null)
    setModalOpen(true)
  }

  const openEdit = (step: UseCaseFlowStep) => {
    setEditingStep(step)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingStep(null)
  }

  const handleSave = async (
    stepType: string,
    contentJson: string | null,
    screenContextId: string | null
  ) => {
    setModalSaving(true)
    try {
      if (editingStep) {
        await onUpdateStep(editingStep.id, {
          stepType,
          contentJson,
          screenContextId,
          nextScreenId: editingStep.nextScreenId ?? null,
        })
        toast.success('Step updated')
      } else {
        await onAddStep({
          stepType,
          contentJson,
          screenContextId,
          displayOrder: flow.steps.length,
        })
        toast.success('Step added')
      }
      closeModal()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save step')
    } finally {
      setModalSaving(false)
    }
  }

  const moveStep = async (fromIndex: number, toIndex: number) => {
    const reordered = [...flow.steps]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    await onReorderSteps({ stepIds: reordered.map((s) => s.id) })
  }

  const functionLabel = scope?.function
    ? `${scope.function.code} ${scope.function.name}`.trim()
    : null

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2 py-0.5 text-xs font-medium',
              FLOW_TYPE_COLORS[flow.flowType] ?? 'bg-neutral-100 text-neutral-600'
            )}
          >
            {FLOW_TYPE_LABELS[flow.flowType] ?? flow.flowType}
          </span>
          {flow.name && <span className="text-sm font-medium text-neutral-700">{flow.name}</span>}
          {flow.conditionText && (
            <span className="text-xs text-neutral-500">when: {flow.conditionText}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAdd}
            title="Add step"
            className="p-1 text-neutral-500 hover:text-neutral-900"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete flow"
            className="p-1 text-red-400 hover:text-red-600"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="space-y-1 p-4">
        {flow.steps.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-400">No steps yet.</p>
        ) : (
          flow.steps.map((step, idx) => {
            const hasContent = parseFlowContent(step.contentJson).content.length > 0
            const screenLabel = step.screenContextId
              ? screenNameById.get(step.screenContextId)
              : null
            return (
              <div
                key={step.id}
                className="flex items-start gap-2 border border-neutral-100 bg-white p-3"
              >
                <div className="flex w-6 shrink-0 items-center justify-center bg-neutral-100 text-xs font-semibold text-neutral-600">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-neutral-900 underline">
                    {STEP_TYPE_OPTIONS.find((o) => o.value === step.stepType)?.label ??
                      step.stepType}
                  </span>
                  {screenLabel ? (
                    <p className="mt-0.5 text-[11px] text-neutral-400">Screen: {screenLabel}</p>
                  ) : null}
                  {hasContent ? <FlowMentionReadonly contentJson={step.contentJson} /> : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => void moveStep(idx, idx - 1)}
                    disabled={idx === 0}
                    className={cn(
                      'p-1 text-neutral-400 hover:text-neutral-700',
                      idx === 0 && 'cursor-not-allowed opacity-30'
                    )}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => void moveStep(idx, idx + 1)}
                    disabled={idx === flow.steps.length - 1}
                    className={cn(
                      'p-1 text-neutral-400 hover:text-neutral-700',
                      idx === flow.steps.length - 1 && 'cursor-not-allowed opacity-30'
                    )}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => openEdit(step)}
                    className="p-1 text-neutral-400 hover:text-neutral-700"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => void onDeleteStep(step.id)}
                    className="p-1 text-red-400 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <StepModal
        key={editingStep?.id ?? 'new'}
        open={modalOpen}
        initial={editingStep}
        saving={modalSaving}
        hasFunction={hasFunction}
        hasScreens={hasScreens}
        functionLabel={functionLabel}
        screenOptions={screenOptions}
        listMentionOptions={listMentionOptions}
        onSave={handleSave}
        onClose={closeModal}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete flow"
        message={`Delete "${FLOW_TYPE_LABELS[flow.flowType] ?? flow.flowType}"${flow.name ? ` — ${flow.name}` : ''}? All steps in this flow will also be deleted.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        variant="danger"
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true)
          try {
            await onDeleteFlow()
          } finally {
            setDeleting(false)
          }
        }}
      />
    </div>
  )
}
