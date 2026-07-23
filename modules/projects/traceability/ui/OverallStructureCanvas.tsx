'use client'

import { useCallback, useEffect, useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  Handle,
  Position,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type {
  OverallStructureResponse,
  StructureFocus,
} from '../model/overall-structure'
import { StructureFocusType } from '../model/overall-structure'

interface OverallStructureCanvasProps {
  tree: OverallStructureResponse
  focus: StructureFocus | null
  onFocus: (focus: StructureFocus) => void
}

type StructureCanvasData = {
  label: string
  subtitle?: string
  focus: StructureFocus
  selected: boolean
}

function StructureCanvasNode({ data }: NodeProps<Node<StructureCanvasData>>) {
  return (
    <div
      className={cn(
        'min-w-[160px] max-w-[220px] border bg-white px-3 py-2 shadow-sm',
        data.selected ? 'border-secondary bg-secondary text-white' : 'border-neutral-200'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-neutral-300" />
      <div className={cn('text-xs font-medium', data.selected ? 'text-white' : 'text-neutral-900')}>
        {data.label}
      </div>
      {data.subtitle ? (
        <div
          className={cn(
            'truncate text-[10px]',
            data.selected ? 'text-white/80' : 'text-neutral-500'
          )}
        >
          {data.subtitle}
        </div>
      ) : null}
      <Handle type="source" position={Position.Bottom} className="!bg-neutral-300" />
    </div>
  )
}

const nodeTypes = { structure: StructureCanvasNode }

function buildGraph(
  tree: OverallStructureResponse,
  focus: StructureFocus | null
): { nodes: Node<StructureCanvasData>[]; edges: Edge[] } {
  const nodes: Node<StructureCanvasData>[] = []
  const edges: Edge[] = []
  let y = 0
  const colModule = 40
  const colFn = 280
  const colLeaf = 520

  tree.modules.forEach((mod, mi) => {
    const modY = y
    nodes.push({
      id: `mod:${mod.id}`,
      type: 'structure',
      position: { x: colModule, y: modY },
      data: {
        label: mod.name,
        subtitle: mod.code,
        focus: { type: StructureFocusType.Module, id: mod.id },
        selected: focus?.type === StructureFocusType.Module && focus.id === mod.id,
      },
    })
    let childY = modY
    mod.functions.forEach((fn) => {
      nodes.push({
        id: `fn:${fn.id}`,
        type: 'structure',
        position: { x: colFn, y: childY },
        data: {
          label: fn.title,
          subtitle: fn.code,
          focus: { type: StructureFocusType.Function, id: fn.id },
          selected: focus?.type === StructureFocusType.Function && focus.id === fn.id,
        },
      })
      edges.push({
        id: `e-mod-fn-${mod.id}-${fn.id}`,
        source: `mod:${mod.id}`,
        target: `fn:${fn.id}`,
      })
      let leafY = childY
      fn.screens.slice(0, 4).forEach((scr) => {
        nodes.push({
          id: `scr:${scr.id}:${fn.id}`,
          type: 'structure',
          position: { x: colLeaf, y: leafY },
          data: {
            label: scr.name,
            subtitle:
              scr.usedByFunctionCount && scr.usedByFunctionCount > 1
                ? `Shared by ${scr.usedByFunctionCount}`
                : scr.code,
            focus: { type: StructureFocusType.Screen, id: scr.id },
            selected: focus?.type === StructureFocusType.Screen && focus.id === scr.id,
          },
        })
        edges.push({
          id: `e-fn-scr-${fn.id}-${scr.id}`,
          source: `fn:${fn.id}`,
          target: `scr:${scr.id}:${fn.id}`,
        })
        leafY += 70
      })
      fn.apis.slice(0, 3).forEach((api) => {
        nodes.push({
          id: `api:${api.id}:${fn.id}`,
          type: 'structure',
          position: { x: colLeaf + 40, y: leafY },
          data: {
            label: `${api.method} ${api.pathPattern}`,
            subtitle: 'API',
            focus: { type: StructureFocusType.ApiEndpoint, id: api.id },
            selected:
              focus?.type === StructureFocusType.ApiEndpoint && focus.id === api.id,
          },
        })
        edges.push({
          id: `e-fn-api-${fn.id}-${api.id}`,
          source: `fn:${fn.id}`,
          target: `api:${api.id}:${fn.id}`,
        })
        leafY += 70
      })
      childY = Math.max(childY + 90, leafY)
    })
    mod.entities.forEach((ent) => {
      nodes.push({
        id: `ent:${ent.id}`,
        type: 'structure',
        position: { x: colFn, y: childY },
        data: {
          label: ent.name,
          subtitle: `Entity · ${ent.code}`,
          focus: { type: StructureFocusType.Entity, id: ent.id },
          selected: focus?.type === StructureFocusType.Entity && focus.id === ent.id,
        },
      })
      edges.push({
        id: `e-mod-ent-${mod.id}-${ent.id}`,
        source: `mod:${mod.id}`,
        target: `ent:${ent.id}`,
      })
      childY += 80
    })
    y = Math.max(y + 140, childY + 40) + mi * 10
  })

  ;(tree.unassignedFunctions ?? []).forEach((fn, i) => {
    nodes.push({
      id: `ufn:${fn.id}`,
      type: 'structure',
      position: { x: colFn, y: y + i * 80 },
      data: {
        label: fn.title,
        subtitle: 'Unassigned',
        focus: { type: StructureFocusType.Function, id: fn.id },
        selected: focus?.type === StructureFocusType.Function && focus.id === fn.id,
      },
    })
  })

  return { nodes, edges }
}

export function OverallStructureCanvas({
  tree,
  focus,
  onFocus,
}: OverallStructureCanvasProps) {
  const graph = useMemo(() => buildGraph(tree, focus), [tree, focus])
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges)

  useEffect(() => {
    setNodes(graph.nodes)
    setEdges(graph.edges)
  }, [graph, setNodes, setEdges])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<StructureCanvasData>) => {
      onFocus(node.data.focus)
    },
    [onFocus]
  )

  if (tree.modules.length === 0 && !(tree.unassignedFunctions?.length)) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Typography variant="small" tone="muted">
          No structure nodes to display on canvas.
        </Typography>
      </div>
    )
  }

  return (
    <div className="h-full min-h-[320px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  )
}
