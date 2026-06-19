'use client'

import { useState, useRef } from 'react'
import { Copy, FileJson } from 'lucide-react'
import { Modal, Button, Typography, Textarea } from '@/shared/ui'
import { adminTemplatesApi } from '@/modules/admin'
import { normalizeQuestionTypeForApi } from '@/utils/questionType'
import { cn } from '@/utils/cn'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

const SAMPLE_QUESTION_JSON = {
  section: 'overview',
  prompt: 'What is the project goal?',
  q_type: 'textarea',
  required: true,
  help_text: 'Optional guidance for the user.',
  tags: ['goal', 'scope'],
  answer_schema: {},
  visibility_logic: null,
  position: 0,
}

export function AddQuestionByJsonModal({
  templateId,
  onClose,
  onSuccess,
}: {
  templateId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [jsonTab, setJsonTab] = useState<'template' | 'paste'>('template')
  const [jsonInput, setJsonInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCopySample = () => {
    const text = JSON.stringify(SAMPLE_QUESTION_JSON, null, 2)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result)
        JSON.parse(text)
        setJsonInput(text)
        toast.success('File loaded')
      } catch {
        toast.error('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSubmit = async () => {
    const raw = jsonInput.trim()
    if (!raw) {
      toast.error('Paste JSON or upload a file')
      return
    }
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      toast.error('Invalid JSON')
      return
    }
    const items = Array.isArray(data) ? data : [data]
    if (items.length === 0) {
      toast.error('No question object(s) found')
      return
    }
    setLoading(true)
    let done = 0
    try {
      for (const item of items) {
        if (item === null || typeof item !== 'object') {
          toast.error('Each item must be an object')
          break
        }
        const o = item as Record<string, unknown>
        const section = typeof o.section === 'string' ? o.section : 'general'
        const prompt = typeof o.prompt === 'string' ? o.prompt : ''
        if (!prompt.trim()) {
          toast.error('"prompt" is required for each question')
          break
        }
        const qType = typeof o.q_type === 'string' ? o.q_type : 'text'
        const required = !!o.required
        const helpText = o.help_text != null ? String(o.help_text) : null
        const tags = Array.isArray(o.tags) ? o.tags.map((t) => String(t)) : undefined
        const answerSchema =
          o.answer_schema != null && typeof o.answer_schema === 'object'
            ? (o.answer_schema as Record<string, unknown>)
            : {}
        const visibilityLogic = o.visibility_logic != null ? o.visibility_logic : undefined
        const position = typeof o.position === 'number' ? o.position : undefined
        await adminTemplatesApi.addTemplateQuestion(templateId, {
          section,
          prompt: prompt.trim(),
          q_type: normalizeQuestionTypeForApi(qType),
          required,
          help_text: helpText?.trim() || null,
          tags,
          answer_schema: answerSchema,
          visibility_logic: visibilityLogic,
          position,
        })
        done += 1
      }
      if (done > 0) {
        toast.success(done === 1 ? 'Question created' : `${done} questions created`)
        onSuccess()
      }
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add question by JSON"
      size="lg"
      actions={[{ label: 'Cancel', onClick: onClose, variant: 'secondary' }]}
    >
      <div className="space-y-4">
        <div className="flex gap-1 border-b border-neutral-200">
          <button
            type="button"
            onClick={() => setJsonTab('template')}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm transition-colors',
              jsonTab === 'template'
                ? 'border-primary font-medium text-primary'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            )}
          >
            JSON template
          </button>
          <button
            type="button"
            onClick={() => setJsonTab('paste')}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm transition-colors',
              jsonTab === 'paste'
                ? 'border-primary font-medium text-primary'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            )}
          >
            Paste / Upload
          </button>
        </div>

        {jsonTab === 'template' && (
          <div className="max-h-[50vh] space-y-4 overflow-y-auto">
            <div className="space-y-2 text-sm text-neutral-700">
              <Typography weight="semibold" className="text-neutral-900">
                Field reference
              </Typography>
              <ul className="list-inside list-disc space-y-1 text-neutral-600">
                <li>
                  <strong>section</strong> — string, enum: overview | scope | risks | timeline |
                  assumptions | general
                </li>
                <li>
                  <strong>prompt</strong> — string, required. Question text.
                </li>
                <li>
                  <strong>q_type</strong> — string, enum: text | textarea | single_select |
                  multi_select | number | date | boolean | json
                </li>
                <li>
                  <strong>required</strong> — boolean. Whether the answer is mandatory.
                </li>
                <li>
                  <strong>help_text</strong> — string | null, optional. Guidance shown below the
                  question.
                </li>
                <li>
                  <strong>tags</strong> — string[], optional. e.g. [&quot;scope&quot;,
                  &quot;risk&quot;]
                </li>
                <li>
                  <strong>answer_schema</strong> — object. For text, textarea, number, date,
                  boolean, json use <code className="bg-neutral-100 px-1">&#123;&#125;</code>. For
                  single_select / multi_select use{' '}
                  <code className="bg-neutral-100 px-1">
                    &#123; &quot;options&quot;: [&#123;&quot;value&quot;: &quot;a&quot;,
                    &quot;label&quot;: &quot;Label A&quot;&#125;] &#125;
                  </code>{' '}
                  or{' '}
                  <code className="bg-neutral-100 px-1">
                    &#123; &quot;enum&quot;: [&quot;a&quot;, &quot;b&quot;] &#125;
                  </code>
                  .
                </li>
                <li>
                  <strong>visibility_logic</strong> — object | null, optional. Conditional
                  visibility rules.
                </li>
                <li>
                  <strong>position</strong> — number, optional. Order within section.
                </li>
              </ul>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Typography variant="small" weight="medium" className="text-neutral-600">
                  Sample (one question)
                </Typography>
                <Button variant="ghost" size="sm" onClick={handleCopySample} className="gap-1">
                  {copied ? (
                    'Copied'
                  ) : (
                    <>
                      <Copy size={14} /> Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="max-h-64 overflow-auto rounded-md border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs text-neutral-800">
                {JSON.stringify(SAMPLE_QUESTION_JSON, null, 2)}
              </pre>
            </div>
            <Typography variant="small" tone="muted">
              You can paste a single object or an array of objects to add multiple questions at
              once.
            </Typography>
          </div>
        )}

        {jsonTab === 'paste' && (
          <div className="space-y-4">
            <div>
              <Typography variant="small" weight="medium" className="mb-1 block text-neutral-600">
                Paste JSON or upload file
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="sr-only"
                aria-label="Upload JSON file"
              />
              <div className="mb-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1"
                >
                  <FileJson size={14} />
                  Upload .json
                </Button>
              </div>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"section":"overview","prompt":"...","q_type":"text","required":true,"answer_schema":{}}'
                fullWidth
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
                disabled={!jsonInput.trim()}
              >
                Add question(s)
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
