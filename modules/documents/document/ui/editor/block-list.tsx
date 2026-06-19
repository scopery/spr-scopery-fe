'use client'

import type React from 'react'
import type { TElement } from 'platejs'
import { KEYS } from 'platejs'
import { isOrderedList } from '@platejs/list'
import type { RenderNodeWrapper } from 'platejs/react'

function BlockList({ element, children }: { element: TElement; children: React.ReactNode }) {
  const listStyleType = (element as TElement & { listStyleType?: string }).listStyleType

  if (listStyleType === KEYS.listTodo) {
    return <div className="my-1">{children}</div>
  }

  const ListTag = isOrderedList(element as TElement & { listStyleType?: string }) ? 'ol' : 'ul'
  const listStart = (element as TElement & { listStart?: number }).listStart

  return (
    <ListTag
      className="my-1 pl-6"
      style={{
        listStyleType,
        margin: 0,
        padding: 0,
        position: 'relative',
      }}
      start={listStart}
    >
      <li>{children}</li>
    </ListTag>
  )
}

/** ListPlugin belowNodes wrapper for bullet, numbered, and todo lists */
export const blockListBelowNodes: RenderNodeWrapper = (props) => {
  const listStyleType = (props.element as TElement & { listStyleType?: string }).listStyleType
  if (!listStyleType) return

  return (childProps) => <BlockList {...childProps} />
}
