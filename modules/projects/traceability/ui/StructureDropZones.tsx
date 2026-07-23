'use client'

import { useEffect, useState } from 'react'
import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { StructureFocus } from '../model/overall-structure'
import {
  decodeStructureDrag,
  previewAssignLabel,
  STRUCTURE_ASSIGN_DRAG_MIME,
  zoneAcceptsDrag,
  zoneHint,
  zoneLabel,
  zonesForFocus,
  type StructureAssignDragPayload,
  type StructureDropZoneId,
} from '../model/structure-assign.rules'
import {
  getActiveStructureDrag,
  setActiveStructureDrag,
  subscribeActiveStructureDrag,
} from '../model/structure-drag-session'

interface StructureDropZonesProps {
  focus: StructureFocus
  focusLabel: string
  assigning?: boolean
  onAssign: (payload: StructureAssignDragPayload) => void
}

export function StructureDropZones({
  focus,
  focusLabel,
  assigning = false,
  onAssign,
}: StructureDropZonesProps) {
  const zones = zonesForFocus(focus.type)
  const [activeZone, setActiveZone] = useState<StructureDropZoneId | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragPayload, setDragPayload] = useState<StructureAssignDragPayload | null>(null)

  useEffect(() => subscribeActiveStructureDrag(() => setDragPayload(getActiveStructureDrag())), [])

  if (zones.length === 0) {
    return (
      <Typography variant="small" tone="muted" className="p-3">
        This node type does not accept assignments via drop.
      </Typography>
    )
  }

  const resolvePayload = (e: React.DragEvent): StructureAssignDragPayload | null => {
    return (
      getActiveStructureDrag() ||
      decodeStructureDrag(e.dataTransfer.getData(STRUCTURE_ASSIGN_DRAG_MIME))
    )
  }

  const handleDragOver = (e: React.DragEvent, zone: StructureDropZoneId) => {
    e.preventDefault()
    const payload = resolvePayload(e) || dragPayload
    setActiveZone(zone)
    if (payload) {
      if (zoneAcceptsDrag(zone, payload.kind, focus, payload.id)) {
        e.dataTransfer.dropEffect = 'link'
        setPreview(previewAssignLabel(payload, focus, focusLabel))
      } else {
        e.dataTransfer.dropEffect = 'none'
        setPreview(
          payload.id === focus.id ? 'Cannot assign a node to itself' : 'Not allowed here'
        )
      }
    } else {
      e.dataTransfer.dropEffect = 'link'
      setPreview(zoneHint(zone))
    }
  }

  const handleDrop = (e: React.DragEvent, zone: StructureDropZoneId) => {
    e.preventDefault()
    setActiveZone(null)
    setPreview(null)
    const payload = resolvePayload(e)
    setActiveStructureDrag(null)
    if (!payload) return
    if (!zoneAcceptsDrag(zone, payload.kind, focus, payload.id)) return
    onAssign(payload)
  }

  return (
    <div className="space-y-2 p-3">
      {zones.map((zone) => {
        const accepts =
          !dragPayload || zoneAcceptsDrag(zone, dragPayload.kind, focus, dragPayload.id)
        return (
          <div
            key={zone}
            onDragOver={(e) => handleDragOver(e, zone)}
            onDragLeave={() => {
              setActiveZone(null)
              setPreview(null)
            }}
            onDrop={(e) => handleDrop(e, zone)}
            className={cn(
              'min-h-[72px] border border-dashed p-3 transition-colors',
              dragPayload && !accepts && 'opacity-40',
              activeZone === zone && accepts
                ? 'border-secondary bg-secondary/10'
                : activeZone === zone && !accepts
                  ? 'border-neutral-300 bg-neutral-50'
                  : 'border-secondary/30 bg-white'
            )}
          >
            <Typography
              variant="small"
              className="text-xs font-medium uppercase tracking-wide text-neutral-900"
            >
              {zoneLabel(zone)}
            </Typography>
            <Typography variant="small" tone="muted" className="mt-1">
              {activeZone === zone && preview
                ? preview
                : dragPayload && !accepts
                  ? 'Not allowed for this item'
                  : zoneHint(zone)}
            </Typography>
          </div>
        )
      })}
      {assigning ? (
        <Typography variant="small" tone="muted">
          Assigning…
        </Typography>
      ) : null}
    </div>
  )
}
