'use client'

import type { Value } from 'platejs'
import { KEYS } from 'platejs'
import {
  BasicBlocksPlugin,
  BasicMarksPlugin,
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  HorizontalRulePlugin,
  ItalicPlugin,
  UnderlinePlugin,
} from '@platejs/basic-nodes/react'
import { BlockquoteRules, HeadingRules, HorizontalRuleRules } from '@platejs/basic-nodes'
import { CalloutPlugin } from '@platejs/callout/react'
import { CodeBlockPlugin, CodeLinePlugin } from '@platejs/code-block/react'
import { IndentPlugin } from '@platejs/indent/react'
import { LinkPlugin } from '@platejs/link/react'
import { BulletedListRules, OrderedListRules, TaskListRules } from '@platejs/list'
import { ListPlugin } from '@platejs/list/react'
import { SlashInputPlugin, SlashPlugin } from '@platejs/slash-command/react'
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from '@platejs/table/react'
import { TogglePlugin } from '@platejs/toggle/react'
import { ParagraphPlugin } from 'platejs/react'
import { cn } from '@/utils/cn'
import { blockListBelowNodes } from './block-list'
import {
  BlockquoteElement,
  CalloutElement,
  CodeBlockElement,
  CodeLeaf,
  CodeLineElement,
  H1Element,
  H2Element,
  H3Element,
  HorizontalRuleElement,
  LinkElement,
  ParagraphElement,
  TableCellElement,
  TableElement,
  TableHeaderCellElement,
  TableRowElement,
  ToggleElement,
} from './plate-elements'
import { SlashCommandMenu } from './SlashCommandMenu'

const LIST_TARGET_PLUGINS = [...KEYS.heading, KEYS.p, KEYS.blockquote, KEYS.codeBlock, KEYS.toggle]

import type { SlateEditor } from 'platejs'

const slashTriggerQuery = (editor: SlateEditor) =>
  !editor.api.some({
    match: { type: editor.getType(KEYS.codeBlock) },
  })

export function emptyPlateValue(): Value {
  return [{ type: 'p', children: [{ text: '' }] }] as Value
}

function buildEditorPlugins() {
  return [
    BasicBlocksPlugin,
    BasicMarksPlugin,
    BoldPlugin,
    ItalicPlugin,
    UnderlinePlugin,
    CodePlugin.withComponent(CodeLeaf),
    ParagraphPlugin.withComponent(ParagraphElement),
    H1Plugin.configure({
      inputRules: [HeadingRules.markdown()],
    }).withComponent(H1Element),
    H2Plugin.configure({
      inputRules: [HeadingRules.markdown()],
    }).withComponent(H2Element),
    H3Plugin.configure({
      inputRules: [HeadingRules.markdown()],
    }).withComponent(H3Element),
    BlockquotePlugin.configure({
      inputRules: [BlockquoteRules.markdown()],
    }).withComponent(BlockquoteElement),
    HorizontalRulePlugin.configure({
      inputRules: [
        HorizontalRuleRules.markdown({ variant: '-' }),
        HorizontalRuleRules.markdown({ variant: '_' }),
      ],
    }).withComponent(HorizontalRuleElement),
    IndentPlugin.configure({
      inject: { targetPlugins: LIST_TARGET_PLUGINS },
    }),
    ListPlugin.configure({
      inject: { targetPlugins: LIST_TARGET_PLUGINS },
      render: { belowNodes: blockListBelowNodes },
      inputRules: [
        BulletedListRules.markdown({ variant: '-' }),
        BulletedListRules.markdown({ variant: '*' }),
        OrderedListRules.markdown({ variant: '.' }),
        TaskListRules.markdown({ checked: false }),
        TaskListRules.markdown({ checked: true }),
      ],
    }),
    SlashPlugin.configure({
      options: {
        triggerQuery: slashTriggerQuery,
      },
    }),
    SlashInputPlugin.withComponent(SlashCommandMenu),
    CalloutPlugin.withComponent(CalloutElement),
    TogglePlugin.withComponent(ToggleElement),
    CodeBlockPlugin.configure({
      options: {
        defaultLanguage: null,
        lowlight: null,
      },
    }).withComponent(CodeBlockElement),
    CodeLinePlugin.withComponent(CodeLineElement),
    LinkPlugin.withComponent(LinkElement),
    TablePlugin.withComponent(TableElement),
    TableRowPlugin.withComponent(TableRowElement),
    TableCellPlugin.withComponent(TableCellElement),
    TableCellHeaderPlugin.withComponent(TableHeaderCellElement),
  ]
}

const EDITOR_PLUGINS = buildEditorPlugins()

/** Shared Plate plugin set for documents, templates, and read-only rendering */
export function createEditorPlugins() {
  return EDITOR_PLUGINS
}

export const plateContentClassName = cn(
  'min-h-[320px] w-full px-4 py-3 text-neutral-900',
  'focus:outline-none',
  '[&_p]:mb-2 [&_p:last-child]:mb-0',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2',
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2',
  '[&_li]:mb-1',
  '[&_strong]:font-semibold [&_em]:italic [&_u]:underline',
  '[&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2',
  '[&_table]:w-full',
  '[&_pre]:my-3 [&_pre]:overflow-x-auto'
)
