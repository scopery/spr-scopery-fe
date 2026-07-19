import { PhaseDefinitionStatus } from '../enums/phase-definition.enum'
import type { PhaseDefinition } from '../model/phase-definition'

export function canEditPhaseDefinition(def: PhaseDefinition): boolean {
  return def.status !== PhaseDefinitionStatus.Archived
}

export function canActivatePhaseDefinition(def: PhaseDefinition): boolean {
  return def.status === PhaseDefinitionStatus.Inactive
}

export function canDeactivatePhaseDefinition(def: PhaseDefinition): boolean {
  return def.status === PhaseDefinitionStatus.Active
}

export function canArchivePhaseDefinition(def: PhaseDefinition): boolean {
  return def.status !== PhaseDefinitionStatus.Archived
}

export function phaseDefinitionStatusLabel(status: string): string {
  switch (status) {
    case PhaseDefinitionStatus.Active:
      return 'Active'
    case PhaseDefinitionStatus.Inactive:
      return 'Inactive'
    case PhaseDefinitionStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}

export function phaseDefinitionStatusTone(
  status: string
): 'success' | 'neutral' | 'error' {
  switch (status) {
    case PhaseDefinitionStatus.Active:
      return 'success'
    case PhaseDefinitionStatus.Inactive:
      return 'neutral'
    case PhaseDefinitionStatus.Archived:
      return 'error'
    default:
      return 'neutral'
  }
}
