import type { StructureAssignDragPayload } from './structure-assign.rules'

/**
 * HTML5 DnD blocks custom MIME getData() during dragover in most browsers.
 * Keep the active payload in module state so drop zones can validate while hovering.
 */
let activeDrag: StructureAssignDragPayload | null = null
const listeners = new Set<() => void>()

export function setActiveStructureDrag(payload: StructureAssignDragPayload | null) {
  activeDrag = payload
  listeners.forEach((l) => l())
}

export function getActiveStructureDrag(): StructureAssignDragPayload | null {
  return activeDrag
}

export function subscribeActiveStructureDrag(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
