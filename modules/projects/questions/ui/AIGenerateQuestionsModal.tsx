'use client'

import { useState, useCallback } from 'react'
import { Modal, Typography, Button, Input, Select, Checkbox } from '@/shared/ui'
import { useQuestionsGenerate, useQuestionsCommit } from '@/modules/projects'
import type { ProjectDetail } from '@/modules/projects'
import type {
  GeneratedQuestionItem,
  QuestionsCommitEdit,
  QuestionsCommitPatch,
  QuestionsGenerateBody,
} from '@/modules/projects'
import { normalizeQuestionTypeForApi } from '@/utils/questionType'
import { getProblemToastMessage, isConflictCode } from '@/shared/lib/errorHandling'
import { toast } from 'sonner'

const Q_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'single_select', label: 'Single select' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'json', label: 'JSON' },
]

interface AIGenerateQuestionsModalProps {
  open: boolean
  onClose: () => void
  orgId: string
  projectId: string
  project: ProjectDetail | null
  onSuccess: () => void
}

type Step = 'config' | 'review'

export function AIGenerateQuestionsModal({
  open,
  onClose,
  orgId,
  projectId,
  project,
  onSuccess,
}: AIGenerateQuestionsModalProps) {
  const [step, setStep] = useState<Step>('config')
  const [instruction, setInstruction] = useState('')
  const [engine, setEngine] = useState<'agentkit_v2_file' | 'legacy'>('agentkit_v2_file')
  const [maxItems, setMaxItems] = useState<number>(12)
  const [baselineSessionId, setBaselineSessionId] = useState<string | null>(null)
  const [batchToken, setBatchToken] = useState<string | null>(null)
  const [items, setItems] = useState<GeneratedQuestionItem[]>([])
  const [accepted, setAccepted] = useState<Record<string, boolean>>({})
  const [edits, setEdits] = useState<Record<string, Partial<GeneratedQuestionItem>>>({})

  const { mutateAsync: generate, isPending: generatePending } = useQuestionsGenerate()
  const { mutateAsync: commit, isPending: commitPending } = useQuestionsCommit()

  const baselineOptions: { value: string; label: string }[] = []
  if (project?.active_session_id) {
    baselineOptions.push({ value: project.active_session_id, label: 'Active session' })
  }
  if (project?.latest_session_id && project.latest_session_id !== project?.active_session_id) {
    baselineOptions.push({ value: project.latest_session_id, label: 'Latest session' })
  }
  const defaultBaseline = project?.active_session_id ?? project?.latest_session_id ?? null

  const handleGenerate = useCallback(async () => {
    const baseSessionId = baselineSessionId ?? defaultBaseline ?? null
    if (engine === 'agentkit_v2_file' && !baseSessionId) {
      toast.error('Please select a session. V2 requires base_session_id.')
      return
    }
    if (engine === 'legacy' && !baseSessionId) {
      toast.error('Legacy requires at least one session or revision. Please select a session.')
      return
    }
    const body: QuestionsGenerateBody = {
      engine,
      base_session_id: baseSessionId ?? undefined,
      base_revision_id: undefined,
      instruction: instruction.trim() || undefined,
      max_items: maxItems >= 1 && maxItems <= 100 ? maxItems : undefined,
      use_cached_digest: engine === 'agentkit_v2_file' ? true : undefined,
    }
    const tryGenerate = async (overrides?: Partial<QuestionsGenerateBody>) => {
      return generate(orgId, projectId, { ...body, ...overrides })
    }
    try {
      const res = await tryGenerate()
      if (!res) return
      setBatchToken(res.batch_token)
      setItems(res.items)
      const acc: Record<string, boolean> = {}
      res.items.forEach((i) => {
        acc[i.temp_id] = true
      })
      setAccepted(acc)
      setEdits({})
      setStep('review')
    } catch (err) {
      if (isConflictCode(err, 'AI_FEATURE_DISABLED') && engine === 'agentkit_v2_file') {
        try {
          const res = await tryGenerate({ engine: 'legacy' })
          if (res) {
            setBatchToken(res.batch_token)
            setItems(res.items)
            const acc: Record<string, boolean> = {}
            res.items.forEach((i) => {
              acc[i.temp_id] = true
            })
            setAccepted(acc)
            setEdits({})
            setStep('review')
            toast.info('Generated with legacy engine (v2 is off on server).')
            return
          }
        } catch {
          toast.error(getProblemToastMessage(err))
        }
      } else {
        toast.error(getProblemToastMessage(err))
      }
      setStep('config')
    }
  }, [
    orgId,
    projectId,
    instruction,
    engine,
    maxItems,
    baselineSessionId,
    defaultBaseline,
    generate,
  ])

  const handleCommit = useCallback(async () => {
    if (!batchToken) return
    const acceptedTempIds = items.filter((i) => accepted[i.temp_id]).map((i) => i.temp_id)
    if (acceptedTempIds.length === 0) {
      toast.error('Select at least one question to add.')
      return
    }
    const editsList: QuestionsCommitEdit[] = Object.entries(edits)
      .filter(([tempId]) => acceptedTempIds.includes(tempId))
      .map(([tempId, e]) => {
        if (!e || Object.keys(e).length === 0) return null
        const patch: QuestionsCommitPatch = {}
        if (e.section != null) patch.section = e.section
        if (e.prompt != null) patch.prompt = e.prompt
        if (e.required != null) patch.required = e.required
        if (e.tags != null) patch.tags = e.tags
        if (e.q_type != null) patch.q_type = normalizeQuestionTypeForApi(e.q_type)
        if (Object.keys(patch).length === 0) return null
        return { temp_id: tempId, patch }
      })
      .filter((x): x is QuestionsCommitEdit => x != null)
    try {
      await commit(
        orgId,
        projectId,
        {
          batch_token: batchToken,
          accepted_temp_ids: acceptedTempIds,
          edits: editsList.length > 0 ? editsList : undefined,
        },
        { onSuccess }
      )
      onClose()
      toast.success('Questions added.')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      setStep('config')
    }
  }, [batchToken, items, accepted, edits, orgId, projectId, commit, onSuccess, onClose])

  const handleClose = useCallback(() => {
    setStep('config')
    setInstruction('')
    setEngine('agentkit_v2_file')
    setMaxItems(12)
    setBaselineSessionId(null)
    setBatchToken(null)
    setItems([])
    setAccepted({})
    setEdits({})
    onClose()
  }, [onClose])

  const toggleAccept = (tempId: string) => {
    setAccepted((prev) => ({ ...prev, [tempId]: !prev[tempId] }))
  }

  const setEdit = (
    tempId: string,
    field: keyof GeneratedQuestionItem,
    value: string | boolean | string[]
  ) => {
    setEdits((prev) => ({
      ...prev,
      [tempId]: { ...prev[tempId], [field]: value },
    }))
  }

  const getItemDisplay = (item: GeneratedQuestionItem) => {
    const e = edits[item.temp_id]
    return {
      section: e?.section ?? item.section,
      prompt: e?.prompt ?? item.prompt,
      required: e?.required ?? item.required,
      tags: e?.tags ?? item.tags ?? [],
      q_type: e?.q_type ?? item.q_type,
    }
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === 'config' ? 'AI Generate Questions' : 'Review generated questions'}
      size="lg"
      showCloseButton
      actions={[]}
    >
      {step === 'config' ? (
        <div className="space-y-4">
          <Input
            label="Instruction (optional)"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Focus on scope and risks"
            fullWidth
          />
          <div>
            <label className="mb-1 block text-sm text-neutral-700">Engine</label>
            <Select
              options={[
                { value: 'agentkit_v2_file', label: 'V2 (recommended)' },
                { value: 'legacy', label: 'Legacy' },
              ]}
              value={engine}
              onValueChange={(v: string) =>
                setEngine(v === 'legacy' ? 'legacy' : 'agentkit_v2_file')
              }
              className="w-full"
            />
            <Typography variant="small" tone="muted" className="mt-1">
              {engine === 'agentkit_v2_file'
                ? 'V2 requires a session (base_session_id).'
                : 'Legacy requires at least one session or revision.'}
            </Typography>
          </div>
          {baselineOptions.length > 0 ? (
            <div>
              <label className="mb-1 block text-sm text-neutral-700">
                Session <span className="text-error-600">*</span>
              </label>
              <Select
                options={[{ value: '__none__', label: 'None' }, ...baselineOptions]}
                value={(baselineSessionId ?? defaultBaseline) || '__none__'}
                onValueChange={(v: string) => setBaselineSessionId(v === '__none__' ? null : v)}
                placeholder="Select session"
                className="w-full"
              />
            </div>
          ) : (
            <Typography variant="small" tone="muted">
              Create a session with answers first. V2 requires base_session_id.
            </Typography>
          )}
          <div>
            <Input
              label="Max questions (1–100, optional)"
              type="number"
              min={1}
              max={100}
              value={maxItems}
              onChange={(e) => setMaxItems(Number(e.target.value) || 12)}
              fullWidth
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerate}
              loading={generatePending}
              disabled={engine === 'agentkit_v2_file' && !(baselineSessionId ?? defaultBaseline)}
            >
              Generate
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {items.map((item) => {
              const disp = getItemDisplay(item)
              const isAccepted = accepted[item.temp_id]
              return (
                <div key={item.temp_id} className=" space-y-2">
                  <div className="flex items-center gap-2 bg-neutral-100 p-2">
                    <Checkbox
                      checked={isAccepted}
                      onChange={() => toggleAccept(item.temp_id)}
                      label="Accept"
                      size="sm"
                    />
                  </div>
                  <Input
                    label="Section"
                    value={disp.section}
                    onChange={(e) => setEdit(item.temp_id, 'section', e.target.value)}
                    fullWidth
                  />
                  <Input
                    label="Prompt"
                    value={disp.prompt}
                    onChange={(e) => setEdit(item.temp_id, 'prompt', e.target.value)}
                    fullWidth
                  />
                  <Checkbox
                    id={`req-${item.temp_id}`}
                    checked={disp.required}
                    onChange={(e) => setEdit(item.temp_id, 'required', e.target.checked)}
                    label="Required"
                    size="sm"
                  />
                  <div>
                    <label className="mb-1 block text-sm text-neutral-700">Type</label>
                    <Select
                      options={
                        Q_TYPE_OPTIONS.some((o) => o.value === disp.q_type)
                          ? Q_TYPE_OPTIONS
                          : [{ value: disp.q_type, label: disp.q_type }, ...Q_TYPE_OPTIONS]
                      }
                      value={disp.q_type}
                      onValueChange={(v: string) => setEdit(item.temp_id, 'q_type', v)}
                      size="md"
                      className="w-full"
                    />
                  </div>
                  <Input
                    label="Tags (comma-separated)"
                    value={Array.isArray(disp.tags) ? disp.tags.join(', ') : ''}
                    onChange={(e) =>
                      setEdit(
                        item.temp_id,
                        'tags',
                        e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    fullWidth
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-end gap-2 border-t border-neutral-200 pt-2">
            <Button variant="ghost" onClick={() => setStep('config')}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleCommit}
              loading={commitPending}
              disabled={!Object.values(accepted).some(Boolean)}
            >
              Commit
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
