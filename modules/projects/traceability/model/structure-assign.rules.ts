import {
  StructureFocusType,
  type StructureFocus,
} from './overall-structure'

/** Drag payload for Overall Structure assign. */
export const STRUCTURE_ASSIGN_DRAG_MIME = 'application/x-scopery-structure-assign'

export type StructureDragKind =
  | typeof StructureFocusType.Module
  | typeof StructureFocusType.Function
  | typeof StructureFocusType.Screen
  | typeof StructureFocusType.ApiEndpoint
  | typeof StructureFocusType.Component
  | typeof StructureFocusType.Entity
  | typeof StructureFocusType.Communication
  | typeof StructureFocusType.Nfr

export type StructureAssignAction =
  | 'move-function-to-module'
  | 'link-screen-to-function'
  | 'link-api-to-function'
  | 'link-communication-to-function'
  | 'link-component-to-screen'
  | 'move-entity-to-module'
  | 'scope-nfr-to-target'

export type StructureDropZoneId =
  | 'screens'
  | 'apis'
  | 'communications'
  | 'components'
  | 'functions'
  | 'entities'
  | 'nfr'
  | 'scope-target'

export interface StructureAssignDragPayload {
  kind: StructureDragKind
  id: string
  label: string
  projectId?: string | null
}

export function encodeStructureDrag(payload: StructureAssignDragPayload): string {
  return JSON.stringify(payload)
}

export function decodeStructureDrag(raw: string): StructureAssignDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as StructureAssignDragPayload
    if (!parsed?.kind || !parsed?.id) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Resolve typed assign action from dragged candidate → focused drop target.
 * Returns null when the pair is not allowed (including same-node / self-assign).
 */
export function resolveStructureAssignAction(
  dragKind: StructureDragKind,
  focus: StructureFocus,
  dragId?: string
): StructureAssignAction | null {
  if (dragId && dragId === focus.id) return null
  if (dragKind === StructureFocusType.Function && focus.type === StructureFocusType.Module) {
    return 'move-function-to-module'
  }
  if (dragKind === StructureFocusType.Screen && focus.type === StructureFocusType.Function) {
    return 'link-screen-to-function'
  }
  if (
    dragKind === StructureFocusType.ApiEndpoint &&
    focus.type === StructureFocusType.Function
  ) {
    return 'link-api-to-function'
  }
  if (
    dragKind === StructureFocusType.Communication &&
    focus.type === StructureFocusType.Function
  ) {
    return 'link-communication-to-function'
  }
  if (
    dragKind === StructureFocusType.Component &&
    focus.type === StructureFocusType.Screen
  ) {
    return 'link-component-to-screen'
  }
  if (dragKind === StructureFocusType.Entity && focus.type === StructureFocusType.Module) {
    return 'move-entity-to-module'
  }
  if (
    dragKind === StructureFocusType.Nfr &&
    (focus.type === StructureFocusType.Module ||
      focus.type === StructureFocusType.Function ||
      focus.type === StructureFocusType.Screen)
  ) {
    return 'scope-nfr-to-target'
  }
  if (
    focus.type === StructureFocusType.Nfr &&
    (dragKind === StructureFocusType.Module ||
      dragKind === StructureFocusType.Function ||
      dragKind === StructureFocusType.Screen)
  ) {
    return 'scope-nfr-to-target'
  }
  return null
}

/** True when the dragged/candidate node is the focused node itself. */
export function isSameStructureNode(
  candidateId: string,
  focus: StructureFocus | null
): boolean {
  return Boolean(focus && candidateId === focus.id)
}

export function zonesForFocus(focusType: StructureFocus['type']): StructureDropZoneId[] {
  switch (focusType) {
    case StructureFocusType.Function:
      return ['screens', 'apis', 'communications', 'nfr']
    case StructureFocusType.Screen:
      return ['components']
    case StructureFocusType.Module:
      return ['functions', 'entities', 'nfr']
    case StructureFocusType.Nfr:
      return ['scope-target']
    default:
      return []
  }
}

/**
 * Which Available palette groups belong to the focused node.
 * Everything else is hidden — Available is focus-contextual, not a full catalog.
 */
export function availablePaletteGroupIdsForFocus(
  focusType: StructureFocus['type']
): string[] {
  switch (focusType) {
    case StructureFocusType.Function:
      return ['screens', 'apis', 'communications', 'nfrs']
    case StructureFocusType.Screen:
      return ['components']
    case StructureFocusType.Module:
      return ['functions', 'entities', 'nfrs']
    case StructureFocusType.Nfr:
      return ['nfrTargets', 'modules', 'functions', 'screens']
    default:
      return []
  }
}

/** Whether a candidate kind can be assigned to the current focus. */
export function isAssignableCandidateKind(
  dragKind: StructureDragKind,
  focus: StructureFocus
): boolean {
  return resolveStructureAssignAction(dragKind, focus) != null
}

export function zoneLabel(zone: StructureDropZoneId): string {
  switch (zone) {
    case 'screens':
      return 'Screens'
    case 'apis':
      return 'APIs'
    case 'communications':
      return 'Communications'
    case 'components':
      return 'Components'
    case 'functions':
      return 'Functions'
    case 'entities':
      return 'Entities'
    case 'nfr':
      return 'NFRs'
    case 'scope-target':
      return 'Scope targets'
  }
}

export function zoneHint(zone: StructureDropZoneId): string {
  switch (zone) {
    case 'screens':
      return 'Drop screens here'
    case 'apis':
      return 'Drop APIs here'
    case 'communications':
      return 'Drop communications here'
    case 'components':
      return 'Drop components here'
    case 'functions':
      return 'Drop functions here'
    case 'entities':
      return 'Drop entities here'
    case 'nfr':
      return 'Drop NFRs here'
    case 'scope-target':
      return 'Drop Module, Function, or Screen'
  }
}

/** Whether a drag kind is accepted by a specific typed zone under the given focus. */
export function zoneAcceptsDrag(
  zone: StructureDropZoneId,
  dragKind: StructureDragKind,
  focus: StructureFocus,
  dragId?: string
): boolean {
  const action = resolveStructureAssignAction(dragKind, focus, dragId)
  if (!action) return false
  switch (zone) {
    case 'screens':
      return action === 'link-screen-to-function'
    case 'apis':
      return action === 'link-api-to-function'
    case 'communications':
      return action === 'link-communication-to-function'
    case 'components':
      return action === 'link-component-to-screen'
    case 'functions':
      return action === 'move-function-to-module'
    case 'entities':
      return action === 'move-entity-to-module'
    case 'nfr':
      return action === 'scope-nfr-to-target' && dragKind === StructureFocusType.Nfr
    case 'scope-target':
      return (
        action === 'scope-nfr-to-target' &&
        (dragKind === StructureFocusType.Module ||
          dragKind === StructureFocusType.Function ||
          dragKind === StructureFocusType.Screen)
      )
  }
}

export function previewAssignLabel(
  payload: StructureAssignDragPayload,
  focus: StructureFocus,
  focusLabel: string
): string | null {
  const action = resolveStructureAssignAction(payload.kind, focus, payload.id)
  if (!action) return null
  switch (action) {
    case 'link-screen-to-function':
      return `Link ${payload.label} to ${focusLabel}`
    case 'link-api-to-function':
      return `Link ${payload.label} to ${focusLabel}`
    case 'link-communication-to-function':
      return `Link ${payload.label} to ${focusLabel}`
    case 'link-component-to-screen':
      return `Use ${payload.label} on ${focusLabel}`
    case 'move-function-to-module':
      return `Assign ${payload.label} to ${focusLabel}`
    case 'move-entity-to-module':
      return `Assign ${payload.label} to ${focusLabel}`
    case 'scope-nfr-to-target':
      return focus.type === StructureFocusType.Nfr
        ? `Scope ${focusLabel} to ${payload.label}`
        : `Scope ${payload.label} to ${focusLabel}`
  }
}

export function dropZoneLabelForFocus(focusType: StructureFocus['type']): string {
  switch (focusType) {
    case StructureFocusType.Function:
      return 'Drop Screens, APIs, or Communications here'
    case StructureFocusType.Screen:
      return 'Drop Components here'
    case StructureFocusType.Module:
      return 'Drop Functions or Entities here'
    case StructureFocusType.Nfr:
      return 'Drop Module, Function, or Screen to scope'
    default:
      return 'Select a node that accepts assignments'
  }
}

export function actionNeedsProject(action: StructureAssignAction): boolean {
  return (
    action === 'link-screen-to-function' ||
    action === 'link-api-to-function' ||
    action === 'link-communication-to-function' ||
    action === 'move-function-to-module' ||
    action === 'scope-nfr-to-target'
  )
}

export function actionLabel(action: StructureAssignAction): string {
  switch (action) {
    case 'link-screen-to-function':
      return 'Link screen'
    case 'link-api-to-function':
      return 'Link API'
    case 'link-communication-to-function':
      return 'Link communication'
    case 'link-component-to-screen':
      return 'Link component'
    case 'move-function-to-module':
      return 'Assign function'
    case 'move-entity-to-module':
      return 'Assign entity'
    case 'scope-nfr-to-target':
      return 'Scope NFR'
  }
}
