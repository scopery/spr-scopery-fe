'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import type { PointRef, TComboboxInputElement, TElement } from 'platejs'
import { filterWords } from '@platejs/combobox'
import {
  useComboboxInput,
  useHTMLInputCursorState,
} from '@platejs/combobox/react'
import {
  PlateElement,
  useComposedRef,
  useEditorRef,
  type PlateElementProps,
} from 'platejs/react'
import { cn } from '@/utils'
import { useEditorSlashExtras } from './editor-slash-extras-context'
import { SLASH_COMMAND_GROUPS } from './slash-command-items'
import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox'

export function SlashCommandMenu(props: PlateElementProps<TComboboxInputElement>) {
  const { editor, element, children, ...rest } = props
  const extraGroups = useEditorSlashExtras()
  const commandGroups = useMemo(
    () => [...SLASH_COMMAND_GROUPS, ...extraGroups],
    [extraGroups]
  )

  return (
    <PlateElement as="span" editor={editor} element={element} {...rest}>
      <span className="relative inline-block">
        <InlineCombobox element={element} trigger="/">
          <InlineComboboxInput />
          <InlineComboboxContent>
            <InlineComboboxEmpty>No commands found</InlineComboboxEmpty>
            {commandGroups.map(({ group, items }) => (
              <InlineComboboxGroup key={group} label={group}>
                {items.map((item) => {
                  const Icon = item.icon
                  return (
                    <InlineComboboxItem
                      key={item.id}
                      id={item.id}
                      value={item.value}
                      label={item.label}
                      keywords={item.keywords}
                      group={group}
                      focusEditor={item.focusEditor}
                      onSelect={() => item.onSelect(editor)}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
                      <span className="min-w-0">
                        <span className="block font-medium leading-5">{item.label}</span>
                        <span className="block text-xs text-neutral-500">{item.description}</span>
                      </span>
                    </InlineComboboxItem>
                  )
                })}
              </InlineComboboxGroup>
            ))}
          </InlineComboboxContent>
        </InlineCombobox>
      </span>
      {children}
    </PlateElement>
  )
}
