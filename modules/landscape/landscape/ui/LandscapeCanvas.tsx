'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeProps,
  type OnConnect,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  landscapeApi,
  type OrgNode,
  type OrgNodeLink,
  type NodeLinkType,
} from '@/modules/landscape'
import { cn } from '@/utils/cn'

const GRID_STEP = 50

function getDefaultPosition(index: number): { x: number; y: number } {
  const col = index % 4
  const row = Math.floor(index / 4)
  return { x: col * 280, y: row * 120 }
}

interface OrgNodeData extends Record<string, unknown> {
  code: string
  name: string
  node_type: string
  status: string
}

function OrgNodeCard({ data, selected }: NodeProps<Node<OrgNodeData>>) {
  return (
    <div
      className={cn(
        'min-w-[180px] rounded-lg border-2 bg-white px-3 py-2 shadow-sm transition-shadow',
        selected ? 'border-primary shadow-md' : 'border-neutral-200 hover:border-neutral-300'
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-primary" />
      <div className="font-mono text-sm text-neutral-600">{data.code}</div>
      <div className="truncate text-sm font-medium text-neutral-900">{data.name}</div>
      <div className="text-xs capitalize text-neutral-500">{data.node_type}</div>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-primary" />
    </div>
  )
}

const nodeTypes = { orgNode: OrgNodeCard }

function orgNodesToFlowNodes(nodes: OrgNode[]): Node<OrgNodeData>[] {
  return nodes.map((n, i) => {
    const pos =
      n.position_x != null && n.position_y != null
        ? { x: n.position_x, y: n.position_y }
        : getDefaultPosition(i)
    return {
      id: n.id,
      type: 'orgNode',
      position: pos,
      data: {
        code: n.code,
        name: n.name,
        node_type: n.node_type,
        status: n.status,
      },
    }
  })
}

function orgLinksToFlowEdges(links: OrgNodeLink[]): Edge[] {
  return links.map((l) => ({
    id: l.id,
    source: l.from_node_id,
    target: l.to_node_id,
    data: { link_type: l.link_type },
  }))
}

export interface LandscapeCanvasProps {
  orgId: string
  nodes: OrgNode[]
  links: OrgNodeLink[]
  canMutate: boolean
  onRefresh: () => void
  onDoubleClickCanvas: () => void
  onDoubleClickNode: (node: OrgNode) => void
}

export function LandscapeCanvas({
  orgId,
  nodes,
  links,
  canMutate,
  onRefresh,
  onDoubleClickCanvas,
  onDoubleClickNode,
}: LandscapeCanvasProps) {
  const initialNodes = useMemo(() => orgNodesToFlowNodes(nodes), [])
  const initialEdges = useMemo(() => orgLinksToFlowEdges(links), [])

  const [rfNodes, setRfNodes] = useNodesState(initialNodes)
  const [rfEdges, setRfEdges] = useEdgesState(initialEdges)

  const nodesRef = useRef(nodes)
  const linksRef = useRef(links)
  nodesRef.current = nodes
  linksRef.current = links

  useEffect(() => {
    setRfNodes(orgNodesToFlowNodes(nodes))
    setRfEdges(orgLinksToFlowEdges(links))
  }, [nodes, links, setRfNodes, setRfEdges])

  const syncPositionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())

  const flushPositions = useCallback(async () => {
    const map = pendingPositionsRef.current
    if (map.size === 0) return
    const positions = Array.from(map.entries()).map(([node_id, pos]) => ({
      node_id,
      position_x: Math.round(pos.x),
      position_y: Math.round(pos.y),
    }))
    pendingPositionsRef.current = new Map()
    try {
      await landscapeApi.batchUpdateNodePositions(orgId, positions)
    } catch {
      // Fallback: PATCH each node individually (e.g. if batch endpoint not available)
      await Promise.all(
        positions.map((p) =>
          landscapeApi.patchOrgNode(orgId, p.node_id, {
            position_x: p.position_x,
            position_y: p.position_y,
          })
        )
      )
    }
  }, [orgId])

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<OrgNodeData>>[]) => {
      setRfNodes((nds) => applyNodeChanges(changes, nds))
      for (const ch of changes) {
        if (ch.type === 'position' && ch.dragging === false && 'position' in ch && ch.position) {
          const pos = ch.position as { x: number; y: number }
          pendingPositionsRef.current.set(ch.id, pos)
          if (syncPositionDebounceRef.current) clearTimeout(syncPositionDebounceRef.current)
          syncPositionDebounceRef.current = setTimeout(() => {
            syncPositionDebounceRef.current = null
            flushPositions()
          }, 500)
        }
      }
    },
    [setRfNodes, flushPositions]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setRfEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [setRfEdges]
  )

  const onConnect: OnConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target)
        return
      if (!canMutate) return
      const tempId = `temp-${connection.source}-${connection.target}`
      const tempEdge: Edge = {
        id: tempId,
        source: connection.source,
        target: connection.target,
        type: 'smoothstep',
      }
      setRfEdges((eds) => [...eds, tempEdge])
      try {
        await landscapeApi.createNodeLink(orgId, {
          from_node_id: connection.source,
          to_node_id: connection.target,
          link_type: 'depends_on' as NodeLinkType,
        })
        onRefresh()
      } catch {
        setRfEdges((eds) => eds.filter((e) => e.id !== tempId))
      }
    },
    [orgId, canMutate, setRfEdges, onRefresh]
  )

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node<OrgNodeData>) => {
      const orgNode = nodesRef.current.find((n) => n.id === node.id)
      if (orgNode) onDoubleClickNode(orgNode)
    },
    [onDoubleClickNode]
  )

  const onPaneClick = useCallback(() => {
    onDoubleClickCanvas()
  }, [onDoubleClickCanvas])

  return (
    <div className="h-[600px] w-full rounded-lg border border-neutral-200 bg-neutral-50">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        nodesDraggable={canMutate}
        nodesConnectable={canMutate}
        elementsSelectable={true}
        fitView
        snapToGrid
        snapGrid={[GRID_STEP, GRID_STEP]}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={GRID_STEP} size={1} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </div>
  )
}
