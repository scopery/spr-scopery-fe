'use client'

import { useEffect, useMemo, useRef } from 'react'
import { buildSpecPackDocHtml } from '../export/spec-pack-doc'
import { SpecPackProductName } from '../model/spec-pack.labels'
import type { SpecPackPreviewDocument } from '../model/spec-pack-preview'

interface SpecPackPreviewPanelProps {
  document: SpecPackPreviewDocument
  /** Scroll iframe to `#req-{id}` or `#fn-{id}` when the outline selection changes. */
  scrollToAnchorId?: string | null
  /** Bump on each outline click so re-selecting the same item still scrolls. */
  scrollToken?: number
}

function scrollIframeToAnchor(
  iframe: HTMLIFrameElement,
  anchorId: string
): void {
  const doc = iframe.contentDocument
  if (!doc) return
  const el = doc.getElementById(anchorId)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  doc.querySelectorAll('.flash-target').forEach((node) => {
    node.classList.remove('flash-target')
  })
  el.classList.add('flash-target')
  window.setTimeout(() => el.classList.remove('flash-target'), 1200)
}

/**
 * WYSIWYG preview: exact DOC HTML.
 * Must sit in a parent with a definite height — fills it completely.
 * allow-same-origin + no script: styles/fonts from Google can still load for Montserrat fallback.
 */
export function SpecPackPreviewPanel({
  document: doc,
  scrollToAnchorId = null,
  scrollToken = 0,
}: SpecPackPreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const srcDoc = useMemo(() => buildSpecPackDocHtml(doc), [doc])
  const pendingScrollRef = useRef<string | null>(null)

  useEffect(() => {
    if (!scrollToAnchorId) return
    pendingScrollRef.current = scrollToAnchorId
    const iframe = iframeRef.current
    if (!iframe) return

    const run = () => {
      const target = pendingScrollRef.current
      if (!target || !iframeRef.current) return
      scrollIframeToAnchor(iframeRef.current, target)
    }

    if (iframe.contentDocument?.readyState === 'complete') {
      requestAnimationFrame(run)
    }
  }, [scrollToAnchorId, scrollToken])

  return (
    <iframe
      ref={iframeRef}
      title={SpecPackProductName.previewTitle}
      srcDoc={srcDoc}
      sandbox="allow-same-origin"
      referrerPolicy="no-referrer-when-downgrade"
      className="block h-full w-full border border-neutral-300 bg-white"
      onLoad={() => {
        const target = pendingScrollRef.current ?? scrollToAnchorId
        if (!target || !iframeRef.current) return
        scrollIframeToAnchor(iframeRef.current, target)
      }}
    />
  )
}
