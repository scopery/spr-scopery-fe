'use client'

import { useMemo } from 'react'
import { buildSpecPackDocHtml } from '../export/spec-pack-doc'
import type { SpecPackPreviewDocument } from '../model/spec-pack-preview'

interface SpecPackPreviewPanelProps {
  document: SpecPackPreviewDocument
}

/**
 * WYSIWYG preview: exact DOC HTML.
 * Must sit in a parent with a definite height — fills it completely.
 */
export function SpecPackPreviewPanel({ document: doc }: SpecPackPreviewPanelProps) {
  const srcDoc = useMemo(() => buildSpecPackDocHtml(doc), [doc])

  return (
    <iframe
      title="Spec Pack document preview"
      srcDoc={srcDoc}
      sandbox="allow-same-origin"
      className="block h-full w-full border border-neutral-300 bg-white"
    />
  )
}
