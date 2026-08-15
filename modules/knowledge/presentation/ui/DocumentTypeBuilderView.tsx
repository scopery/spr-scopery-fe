'use client'

import { Button, Input, Stack, Textarea, Typography } from '@/shared/ui'
import { useDocumentTypes } from '../hooks/useDocumentTypes'
import { useDocumentTypeBuilder } from '../hooks/useDocumentTypeBuilder'

export function DocumentTypeBuilderView() {
  const { refetch } = useDocumentTypes()
  const {
    code,
    setCode,
    name,
    setName,
    description,
    setDescription,
    submitting,
    error,
    success,
    create,
  } = useDocumentTypeBuilder(refetch)

  return (
    <Stack direction="vertical" spacing="sm">
      <Typography as="h1" size="md" weight="medium">
        Document Type Builder
      </Typography>
      <Typography variant="small" tone="muted">
        Create a workspace document type. Advanced field schema expands when contract is ready.
      </Typography>
      {error ? <Typography tone="error">{error}</Typography> : null}
      {success ? <Typography tone="success">{success}</Typography> : null}
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Code (e.g. TMPL-SRS)"
        aria-label="Type code"
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        aria-label="Type name"
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        aria-label="Type description"
      />
      <Button disabled={submitting || !code.trim() || !name.trim()} onClick={() => void create()}>
        Create type
      </Button>
    </Stack>
  )
}
