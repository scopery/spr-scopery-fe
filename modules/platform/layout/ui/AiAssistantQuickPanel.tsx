'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import NextLink from 'next/link'
import { FileText, FolderKanban, Sparkles } from 'lucide-react'
import { Link as DesignLink, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'

export interface AiAssistantQuickPanelProps {
  open: boolean
  onClose: () => void
  workspaceId: string
  projectId: string | null
  projectName?: string | null
  anchorRef: React.RefObject<HTMLElement>
}

export function AiAssistantQuickPanel({
  open,
  onClose,
  workspaceId,
  projectId,
  projectName,
  anchorRef,
}: AiAssistantQuickPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  const updatePosition = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = 280
    let left = rect.right + 8
    if (left + width > window.innerWidth - 8) left = Math.max(8, rect.left - width - 8)
    setPosition({ top: rect.top, left })
  }, [anchorRef])

  useEffect(() => {
    if (!open) return
    updatePosition()
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (anchorRef.current?.contains(t) || panelRef.current?.contains(t)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', updatePosition)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, onClose, updatePosition, anchorRef])

  if (!open || !position || typeof document === 'undefined') return null

  const docHubHref = ROUTES.workspace.documentHub(
    workspaceId,
    projectId ? { projectId } : undefined
  )

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[100] w-70 border border-neutral-200 bg-white shadow-xl"
      style={{ top: position.top, left: position.left, width: 280 }}
    >
      <div className="border-b border-neutral-100 px-3 py-2">
        <Typography weight="medium" className="text-sm">
          AI Assistant
        </Typography>
        <Typography variant="small" tone="muted">
          {projectId
            ? `Context: ${projectName ?? 'Project'}`
            : 'Context: Workspace'}
        </Typography>
      </div>
      <div className="flex flex-col py-1">
        {projectId ? (
          <DesignLink
            as={NextLink}
            href={ROUTES.workspace.projectOverview(workspaceId, projectId)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50"
            onClick={onClose}
          >
            <FolderKanban size={14} className="text-neutral-500" />
            Project overview & AI actions
          </DesignLink>
        ) : null}
        <DesignLink
          as={NextLink}
          href={docHubHref}
          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50"
          onClick={onClose}
        >
          <FileText size={14} className="text-neutral-500" />
          Documents in current scope
        </DesignLink>
        <DesignLink
          as={NextLink}
          href={ROUTES.workspace.aiAssistant(workspaceId)}
          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50"
          onClick={onClose}
        >
          <Sparkles size={14} className="text-neutral-500" />
          Open AI chat
        </DesignLink>
        <DesignLink
          as={NextLink}
          href={ROUTES.workspace.agentControl(workspaceId)}
          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50"
          onClick={onClose}
        >
          <Sparkles size={14} className="text-neutral-500" />
          Agent & model control
        </DesignLink>
      </div>
    </div>,
    document.body
  )
}
