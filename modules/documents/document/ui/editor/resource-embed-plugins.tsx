'use client'

import React from 'react'
import type { TElement } from 'platejs'
import { createPlatePlugin, PlateElement, type PlateElementProps } from 'platejs/react'
import { cn } from '@/utils/cn'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyPlateElement = PlateElement as React.FC<any>

export const RESOURCE_MENTION_KEY = 'resourceMention' as const
export const SYNCED_BLOCK_KEY = 'syncedBlock' as const

export type ResourceMentionElement = TElement & {
  type: typeof RESOURCE_MENTION_KEY
  resourceType: string
  resourceId: string
  label: string
  accessStatus?: 'RESOLVED' | 'ACCESS_REVOKED' | 'NOT_FOUND' | string
}

export type SyncedBlockElement = TElement & {
  type: typeof SYNCED_BLOCK_KEY
  syncedBlockId: string
  title: string
}

export function createResourceMentionNode(input: {
  resourceType: string
  resourceId: string
  label: string
}): ResourceMentionElement {
  return {
    type: RESOURCE_MENTION_KEY,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    label: input.label,
    children: [{ text: '' }],
  }
}

export function createSyncedBlockNode(input: {
  syncedBlockId: string
  title: string
}): SyncedBlockElement {
  return {
    type: SYNCED_BLOCK_KEY,
    syncedBlockId: input.syncedBlockId,
    title: input.title,
    children: [{ text: '' }],
  }
}

export function ResourceMentionElementView(props: PlateElementProps) {
  const el = props.element as ResourceMentionElement
  const revoked =
    el.accessStatus === 'ACCESS_REVOKED' || el.accessStatus === 'NOT_FOUND'
  return (
    <AnyPlateElement
      as="span"
      {...props}
      className={cn(
        'mx-0.5 inline-flex items-center rounded-sm border px-1 py-0.5 text-sm align-baseline',
        revoked
          ? 'border-warning/50 bg-warning/10 text-warning'
          : 'border-primary/30 bg-primary/5 text-primary'
      )}
      contentEditable={false}
      data-resource-type={el.resourceType}
      data-resource-id={el.resourceId}
    >
      {revoked ? `[Access Revoked] ${el.resourceType}` : `@${el.label || el.resourceType}`}
      {props.children}
    </AnyPlateElement>
  )
}

export function SyncedBlockElementView(props: PlateElementProps) {
  const el = props.element as SyncedBlockElement
  return (
    <AnyPlateElement
      as="div"
      {...props}
      className="my-2 border border-dashed border-neutral-300 bg-neutral-50 px-sm py-xs"
      contentEditable={false}
      data-synced-block-id={el.syncedBlockId}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        Synced block
      </div>
      <div className="text-sm text-neutral-900">{el.title || 'Untitled synced block'}</div>
      {props.children}
    </AnyPlateElement>
  )
}

export const ResourceMentionPlugin = createPlatePlugin({
  key: RESOURCE_MENTION_KEY,
  node: {
    isElement: true,
    isInline: true,
    isVoid: true,
  },
}).withComponent(ResourceMentionElementView)

export const SyncedBlockPlugin = createPlatePlugin({
  key: SYNCED_BLOCK_KEY,
  node: {
    isElement: true,
    isVoid: true,
  },
}).withComponent(SyncedBlockElementView)
