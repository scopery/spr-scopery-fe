'use client'

import { useEffect, useState } from 'react'
import { Modal, Input, Select, Typography } from '@/shared/ui'
import type { ScopePackage } from '@/modules/projects/scope/domain/model/scope'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
]

interface StartSessionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: { scopePackageId: string; title?: string; language: string }) => Promise<void>
  scopePackages: ScopePackage[]
}

export function StartSessionModal({
  open,
  onClose,
  onSubmit,
  scopePackages,
}: StartSessionModalProps) {
  const [scopePackageId, setScopePackageId] = useState('')
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setScopePackageId(scopePackages[0]?.id ?? '')
    setTitle('')
    setLanguage('en')
  }, [open, scopePackages])

  const handleSubmit = async () => {
    if (!scopePackageId) return
    setLoading(true)
    try {
      await onSubmit({ scopePackageId, title: title.trim() || undefined, language })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const packageOptions = scopePackages.map((p) => ({
    value: p.id,
    label: `${p.code} — ${p.name}`,
  }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Start elicitation session"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Start session',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
          disabled: !scopePackageId,
        },
      ]}
    >
      <div className="space-y-4">
        <div>
          <Typography variant="caption" className="block mb-1 font-medium text-neutral-700">
            Scope package <span className="text-red-500">*</span>
          </Typography>
          <Select
            value={scopePackageId}
            onValueChange={setScopePackageId}
            options={packageOptions}
            className="w-full"
          />
        </div>
        <Input
          label="Session title"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Optional — e.g. Sprint 3 Elicitation"
        />
        <div>
          <Typography variant="caption" className="block mb-1 font-medium text-neutral-700">
            Question language
          </Typography>
          <Select
            value={language}
            onValueChange={setLanguage}
            options={LANGUAGE_OPTIONS}
            className="w-full"
          />
          <Typography variant="caption" className="block mt-1 text-neutral-500">
            AI will write questions, options, and feedback in this language.
          </Typography>
        </div>
      </div>
    </Modal>
  )
}
