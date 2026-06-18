'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Typography, Button, Input } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { createTemplate } from '@/services/template.service'
import { toast } from 'sonner'
import { getProblemToastMessage, getFieldErrors } from '@/shared/lib/errorHandling'

export default function AdminTemplatesNewPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [version, setVersion] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    setLoading(true)
    setFieldErrors({})
    try {
      const created = await createTemplate({
        name: name.trim(),
        version: version.trim() || undefined,
      })
      toast.success('Draft template created')
      router.push(ROUTES.admin.template(created.id))
    } catch (err) {
      const errors = getFieldErrors(err)
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
      }
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Link
        href={ROUTES.admin.templates}
        className="inline-flex items-center gap-1 text-primary hover:underline mb-4"
      >
        <ArrowLeft size={20} />
        Back to templates
      </Link>
      <Typography as="h1" size="xl" weight="bold" className="mb-2">
        Create template draft
      </Typography>
      <Typography variant="small" tone="muted" className="mb-6">
        Create a new template in draft. Add questions and publish when ready.
      </Typography>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Scoping Elicitation"
          fullWidth
          required
          error={fieldErrors.name}
        />
        <Input
          label="Version (optional)"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="e.g. 1.0"
          fullWidth
          error={fieldErrors.version}
        />
        <div className="flex gap-2 pt-2">
          <Button type="submit" variant="primary" loading={loading}>
            Create draft
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(ROUTES.admin.templates)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
