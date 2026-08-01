'use client'

import { Button, Typography } from '@/shared/ui'
import type {
  OverallStructureResponse,
  StructureCandidatesResponse,
  StructureFocus,
} from '../model/overall-structure'
import type { StructureAssignDragPayload } from '../model/structure-assign.rules'
import { enrichCandidatesWithLinkedState } from '../model/structure-candidates-enrich'
import { StructureCandidatePalette } from './StructureCandidatePalette'
import { StructureNodeInspector } from './StructureNodeInspector'

interface ContextualAssignmentDockProps {
  tree: OverallStructureResponse | null
  focus: StructureFocus | null
  candidates: StructureCandidatesResponse | null
  candidatesLoading?: boolean
  assigning?: boolean
  projectId: string | null
  onClose: () => void
  onAssign: (payload: StructureAssignDragPayload) => void
  onAssignMany: (payloads: StructureAssignDragPayload[]) => void
  onFocusLinked: (focus: StructureFocus) => void
  onUnlinkScreen: (functionId: string, screenId: string, projectId?: string | null) => void
  onUnlinkApi: (functionId: string, apiId: string, projectId?: string | null) => void
  onUnlinkCommunication: (
    functionId: string,
    communicationId: string,
    projectId?: string | null
  ) => void
  onUnlinkComponent: (screenId: string, componentId: string) => void
  onUnlinkEntity: (entityId: string, moduleId: string) => void
}

export function ContextualAssignmentDock({
  tree,
  focus,
  candidates,
  candidatesLoading,
  assigning,
  projectId,
  onClose,
  onAssign,
  onAssignMany,
  onFocusLinked,
  onUnlinkScreen,
  onUnlinkApi,
  onUnlinkCommunication,
  onUnlinkComponent,
  onUnlinkEntity,
}: ContextualAssignmentDockProps) {
  if (!focus) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center border-l border-neutral-200 bg-white px-6 text-center">
        <Typography weight="medium">Assignment dock</Typography>
        <Typography variant="small" tone="muted" className="mt-1 max-w-sm">
          Select a Module, Function, Screen, Entity, or NFR in the structure to open Available
          items next to drop zones.
        </Typography>
      </div>
    )
  }

  const enriched = enrichCandidatesWithLinkedState(candidates, tree, focus)

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-neutral-200 bg-white">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2">
        <Typography weight="medium" size="sm">
          Contextual assignment
        </Typography>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[minmax(300px,1.15fr)_minmax(0,0.85fr)]">
        <StructureCandidatePalette
          focus={focus}
          candidates={enriched}
          loading={candidatesLoading}
          projectId={projectId}
          onAssign={onAssign}
          onAssignMany={onAssignMany}
          onViewLinked={onFocusLinked}
        />
        <StructureNodeInspector
          tree={tree}
          focus={focus}
          assigning={assigning}
          onAssign={onAssign}
          onUnlinkScreen={onUnlinkScreen}
          onUnlinkApi={onUnlinkApi}
          onUnlinkCommunication={onUnlinkCommunication}
          onUnlinkComponent={onUnlinkComponent}
          onUnlinkEntity={onUnlinkEntity}
        />
      </div>
    </div>
  )
}
