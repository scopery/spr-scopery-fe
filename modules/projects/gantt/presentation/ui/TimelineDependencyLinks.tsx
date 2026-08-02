'use client'

import { useMemo } from 'react'
import type { GanttDependency } from '../../domain/model/gantt'
import type { TimelineColumn, TimelineFlatRow } from '../../domain/model/timeline'
import { buildTimelineDependencyPaths } from '../../domain/rules/timeline-dependency-links.rules'

type Props = {
  dependencies: GanttDependency[]
  rows: TimelineFlatRow[]
  columns: TimelineColumn[]
  colWidth: number
  width: number
  height: number
}

/**
 * SVG overlay of task dependency arrows on the Cell Timeline canvas.
 */
export function TimelineDependencyLinks({
  dependencies,
  rows,
  columns,
  colWidth,
  width,
  height,
}: Props) {
  const paths = useMemo(
    () => buildTimelineDependencyPaths(dependencies, rows, columns, colWidth),
    [dependencies, rows, columns, colWidth]
  )

  if (!paths.length || width <= 0 || height <= 0) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[3] overflow-visible"
      width={width}
      height={height}
      aria-hidden
    >
      <defs>
        <marker
          id="timeline-dep-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L8,4 L0,8 Z" className="fill-sky-600" />
        </marker>
      </defs>
      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill="none"
          className="stroke-sky-600"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd="url(#timeline-dep-arrow)"
        />
      ))}
    </svg>
  )
}
