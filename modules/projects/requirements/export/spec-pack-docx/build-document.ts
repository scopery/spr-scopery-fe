import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IBorderOptions,
} from 'docx'
import type {
  SpecPackPreviewDocument,
  SpecPackPreviewFunctionBlock,
  SpecPackPreviewItem,
  SpecPackPreviewRequirementChapter,
  SpecPackPreviewSection,
  SpecPackPreviewUseCase,
} from '../../model/spec-pack-preview'
import { formatSpecPackDate } from '../../model/spec-pack'

const FONT = 'Century Gothic'
const PAGE_WIDTH = 9638 // DXA ≈ A4 content width with margins
const LABEL_WIDTH = 2400
const VALUE_WIDTH = PAGE_WIDTH - LABEL_WIDTH
/** Indent function blocks under a requirement (≈0.35"). */
const FN_INDENT = 504

const thinBorder: IBorderOptions = {
  style: BorderStyle.SINGLE,
  size: 8,
  color: 'D1D5DB',
}
const borders = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
}
const noBorder: IBorderOptions = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'FFFFFF',
}

function text(content: string, opts?: { bold?: boolean; muted?: boolean; size?: number }) {
  return new TextRun({
    text: content,
    font: FONT,
    bold: opts?.bold,
    size: opts?.size ?? 20, // half-points → 10pt
    color: opts?.muted ? '6B7280' : '111827',
  })
}

function para(
  content: string | TextRun[],
  opts?: {
    heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]
    spacingAfter?: number
    indentLeft?: number
  }
): Paragraph {
  const children =
    typeof content === 'string' ? [text(content, { bold: Boolean(opts?.heading) })] : content
  return new Paragraph({
    children,
    heading: opts?.heading,
    spacing: { after: opts?.spacingAfter ?? 120 },
    indent: opts?.indentLeft ? { left: opts.indentLeft } : undefined,
  })
}

function heading1(label: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 120 },
    children: [text(label, { bold: true, size: 28 })],
  })
}

/** Heading with bold title + optional muted code (for Word auto-TOC). */
function headingWithTitle(
  level: (typeof HeadingLevel)[keyof typeof HeadingLevel],
  opts: {
    prefix?: string
    title: string
    code?: string | null
    size: number
    spacingBefore?: number
    indentLeft?: number
  }
): Paragraph {
  return new Paragraph({
    heading: level,
    spacing: { before: opts.spacingBefore ?? 200, after: 100 },
    indent: opts.indentLeft ? { left: opts.indentLeft } : undefined,
    children: [
      ...(opts.prefix ? [text(`${opts.prefix} `, { bold: true, size: opts.size })] : []),
      text(opts.title, { bold: true, size: opts.size }),
      ...(opts.code
        ? [text(`  ${opts.code}`, { muted: true, size: Math.max(18, opts.size - 4) })]
        : []),
    ],
  })
}

function sectionLabel(label: string, indentLeft?: number): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    indent: indentLeft ? { left: indentLeft } : undefined,
    children: [text(label, { bold: true, size: 20, muted: true })],
  })
}

function mutedPara(content: string, indentLeft?: number): Paragraph {
  return para([text(content, { muted: true })], { indentLeft })
}

function docTitle(label: string): Paragraph {
  // Not a Heading style — keeps Word TOC clean for Groups / Requirements / Functions.
  return new Paragraph({
    spacing: { after: 160 },
    children: [text(label, { bold: true, size: 36 })],
  })
}

/** Status / type / priority as separate bordered cells (Word-safe). */
function chipRow(
  labels: Array<string | null | undefined>,
  indentLeft?: number
): Table | null {
  const chips = labels.map((l) => (l ?? '').trim()).filter(Boolean)
  if (!chips.length) return null
  const width = indentLeft ? PAGE_WIDTH - indentLeft : PAGE_WIDTH
  return new Table({
    width: { size: width, type: WidthType.DXA },
    indent: indentLeft ? { size: indentLeft, type: WidthType.DXA } : undefined,
    rows: [
      new TableRow({
        children: chips.map(
          (chip) =>
            new TableCell({
              borders,
              width: { size: 1400, type: WidthType.DXA },
              margins: { top: 40, bottom: 40, left: 80, right: 80 },
              children: [
                new Paragraph({
                  children: [text(chip, { size: 18 })],
                }),
              ],
            })
        ),
      }),
    ],
  })
}

function metaTable(
  rows: Array<[string, string | null | undefined]>,
  indentLeft?: number
): Table | null {
  const filled = rows.filter(([, v]) => Boolean(v && String(v).trim()))
  if (!filled.length) return null
  const width = indentLeft ? PAGE_WIDTH - indentLeft : PAGE_WIDTH
  const valueWidth = width - LABEL_WIDTH
  return new Table({
    width: { size: width, type: WidthType.DXA },
    indent: indentLeft ? { size: indentLeft, type: WidthType.DXA } : undefined,
    columnWidths: [LABEL_WIDTH, valueWidth],
    rows: filled.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              borders,
              width: { size: LABEL_WIDTH, type: WidthType.DXA },
              shading: { fill: 'F3F4F6' },
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [para([text(label, { bold: true })])],
            }),
            new TableCell({
              borders,
              width: { size: valueWidth, type: WidthType.DXA },
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: String(value)
                .split('\n')
                .map((line) => para([text(line)])),
            }),
          ],
        })
    ),
  })
}

type BusinessRuleRow = {
  code?: string | null
  title?: string | null
  description?: string | null
  severity?: string | null
  priority?: string | null
  status?: string | null
}

/** Title | Priority | Description — no status column. */
function businessRulesTable(
  rules: BusinessRuleRow[],
  indentLeft?: number
): Table | null {
  if (!rules.length) return null
  const width = indentLeft ? PAGE_WIDTH - indentLeft : PAGE_WIDTH
  const titleW = Math.round(width * 0.34)
  const priorityW = Math.round(width * 0.16)
  const descW = width - titleW - priorityW

  const header = new TableRow({
    children: [
      cell('Title', titleW, { bold: true, shade: true }),
      cell('Priority', priorityW, { bold: true, shade: true }),
      cell('Description', descW, { bold: true, shade: true }),
    ],
  })

  const body = rules.map((r) => {
    const title = (r.title || r.code || 'Rule').trim()
    const codeNote = r.code && r.title ? r.code : ''
    return new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: titleW, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [
            para([
              text(title, { bold: true }),
              ...(codeNote ? [text(`  ${codeNote}`, { muted: true, size: 18 })] : []),
            ]),
          ],
        }),
        cell(r.severity ?? r.priority ?? '', priorityW),
        cell(r.description ?? '', descW),
      ],
    })
  })

  return new Table({
    width: { size: width, type: WidthType.DXA },
    indent: indentLeft ? { size: indentLeft, type: WidthType.DXA } : undefined,
    columnWidths: [titleW, priorityW, descW],
    rows: [header, ...body],
  })
}

function cell(
  value: string,
  width: number,
  opts?: { bold?: boolean; shade?: boolean }
): TableCell {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts?.shade ? { fill: 'F3F4F6' } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: value
      ? String(value)
          .split('\n')
          .map((line) => para([text(line, { bold: opts?.bold })]))
      : [para([text('')])],
  })
}

function bullet(label: string, body?: string, indentLeft = 360): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: indentLeft },
    children: [
      text('• '),
      text(label, { bold: true }),
      ...(body ? [text(` — ${body}`)] : []),
    ],
  })
}

function itemList(
  title: string,
  items: SpecPackPreviewItem[],
  indentLeft?: number
): Array<Paragraph> {
  if (!items.length) return []
  const base = indentLeft ?? 0
  return [
    sectionLabel(title, base),
    ...items.map((i) => {
      const name = i.name
      const code = i.code ? `  ${i.code}` : ''
      const secondary = i.secondary ? ` (${i.secondary})` : ''
      return new Paragraph({
        spacing: { after: 60 },
        indent: { left: base + 360 },
        children: [
          text('• '),
          text(name, { bold: true }),
          ...(code ? [text(code, { muted: true })] : []),
          ...(secondary ? [text(secondary, { muted: true })] : []),
        ],
      })
    }),
  ]
}

function resolveSections(doc: SpecPackPreviewDocument): SpecPackPreviewSection[] {
  if (doc.sections?.length) return doc.sections
  return [
    {
      group: { id: 'legacy', name: 'Requirements', description: null },
      chapters: doc.chapters,
    },
  ]
}

function renderUseCase(
  uc: SpecPackPreviewUseCase,
  numberLabel: string,
  indentLeft = FN_INDENT
): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [
    sectionLabel(
      `${numberLabel}. ${uc.name}${uc.key ? `  (${uc.key})` : ''}`,
      indentLeft
    ),
  ]
  const meta = metaTable(
    [
      ['Goal', uc.goal],
      ['Primary actor', uc.primaryActorName],
      ['Trigger', uc.triggerText],
    ],
    indentLeft
  )
  if (meta) out.push(meta)

  if (uc.conditions.length) {
    out.push(sectionLabel('Conditions', indentLeft))
    for (const c of uc.conditions) out.push(bullet(c.type, c.content, indentLeft + 360))
  }
  if (uc.businessRules.length) {
    out.push(sectionLabel('Business rules', indentLeft))
    const table = businessRulesTable(
      uc.businessRules.map((r) => ({
        code: r.code,
        title: r.code,
        description: r.description,
      })),
      indentLeft
    )
    if (table) out.push(table)
  }
  if (uc.acceptanceCriteria.length) {
    out.push(sectionLabel('Acceptance criteria', indentLeft))
    for (const a of uc.acceptanceCriteria) {
      const gwt = [
        a.givenText ? `Given: ${a.givenText}` : null,
        a.whenText ? `When: ${a.whenText}` : null,
        a.thenText ? `Then: ${a.thenText}` : null,
      ]
        .filter(Boolean)
        .join('\n')
      out.push(bullet(a.title, gwt || undefined, indentLeft + 360))
    }
  }
  for (const f of uc.flows) {
    const title = [f.flowType, f.name].filter(Boolean).join(' · ')
    out.push(sectionLabel(`Flow · ${title}`, indentLeft))
    if (f.conditionText) out.push(mutedPara(f.conditionText, indentLeft))
    if (!f.steps.length) out.push(mutedPara('No steps.', indentLeft))
    else {
      f.steps.forEach((s, i) => {
        out.push(
          para(
            [
              text(`${i + 1}. `),
              text(s.stepType, { muted: true }),
              ...(s.text ? [text(` — ${s.text}`)] : []),
            ],
            { indentLeft }
          )
        )
      })
    }
  }
  return out
}

function renderFunction(
  block: SpecPackPreviewFunctionBlock,
  chapterNo: number,
  functionNo: number
): Array<Paragraph | Table> {
  const fn = block.function
  const numberLabel = `${chapterNo}.${functionNo}`
  const fnName = fn.name || fn.code || 'Function'
  const indent = FN_INDENT
  const out: Array<Paragraph | Table> = [
    // Heading 3 → shows in Word TOC (levels 1–3); indented under requirement
    headingWithTitle(HeadingLevel.HEADING_3, {
      prefix: `${numberLabel}.`,
      title: fnName,
      code: fn.code && fn.name ? fn.code : null,
      size: 22,
      spacingBefore: 160,
      indentLeft: indent,
    }),
  ]

  const meta = metaTable(
    [
      ['Code', fn.code],
      ['Title', fn.name],
      ['Type', fn.type],
      ['Priority', fn.priority],
      ['Status', fn.status],
      [
        'Module',
        block.module
          ? [block.module.name, block.module.code].filter(Boolean).join(' · ')
          : fn.moduleId,
      ],
      ['Description', fn.description],
      ['Created', fn.createdAt ? formatSpecPackDate(fn.createdAt) : null],
      ['Updated', fn.updatedAt ? formatSpecPackDate(fn.updatedAt) : null],
    ],
    indent
  )
  if (meta) out.push(meta)

  if (fn.acceptanceCriteria?.length) {
    out.push(sectionLabel('Acceptance criteria', indent))
    fn.acceptanceCriteria.forEach((c, i) =>
      out.push(para(`${i + 1}. ${c}`, { indentLeft: indent }))
    )
  }

  if (fn.businessRules?.length) {
    out.push(sectionLabel('Business rules', indent))
    const table = businessRulesTable(fn.businessRules, indent)
    if (table) out.push(table)
  }

  out.push(...itemList('Screens', block.screens, indent))
  out.push(...itemList('APIs', block.apis, indent))
  out.push(...itemList('Components', block.components, indent))
  out.push(...itemList('Entities', block.entities, indent))
  out.push(...itemList('Communications / Notifications', block.communications, indent))

  if (!block.useCases.length) {
    out.push(mutedPara('No use cases linked to this function.', indent))
  } else {
    block.useCases.forEach((uc, i) => {
      out.push(...renderUseCase(uc, `${numberLabel}.${i + 1}`, indent))
    })
  }

  return out
}

function renderChapter(
  chapter: SpecPackPreviewRequirementChapter,
  chapterNo: number
): Array<Paragraph | Table> {
  const req = chapter.requirement
  const out: Array<Paragraph | Table> = [
    // Heading 2 → Word TOC
    headingWithTitle(HeadingLevel.HEADING_2, {
      prefix: `${chapterNo}.`,
      title: req.title,
      code: req.code,
      size: 24,
      spacingBefore: 240,
    }),
  ]
  const chips = chipRow([req.requirementType, req.priority])
  if (chips) out.push(chips)

  if (chapter.loadError) {
    out.push(para([text(chapter.loadError, { bold: true })]))
    return out
  }

  if (req.description) {
    const desc = metaTable([['Description', req.description]])
    if (desc) out.push(desc)
  }

  if (!chapter.functions.length) out.push(mutedPara('No linked functions.'))
  else {
    chapter.functions.forEach((block, i) => {
      out.push(...renderFunction(block, chapterNo, i + 1))
    })
  }
  return out
}

/** Build a real OOXML .docx from the shared Spec Pack preview model. */
export async function buildSpecPackDocx(doc: SpecPackPreviewDocument): Promise<Blob> {
  const sections = resolveSections(doc)
  const children: Array<Paragraph | Table> = []

  children.push(docTitle(doc.title))
  children.push(
    para(
      [
        text(
          `Created ${formatSpecPackDate(doc.createdAt)} · Generated ${formatSpecPackDate(
            doc.generatedAt
          )} · ${doc.chapters.length} requirement${doc.chapters.length === 1 ? '' : 's'}${
            sections.length > 1 ? ` · ${sections.length} groups` : ''
          }`,
          { muted: true, size: 18 }
        ),
      ],
      { spacingAfter: 200 }
    )
  )

  if (doc.note?.trim()) {
    children.push(
      new Table({
        width: { size: PAGE_WIDTH, type: WidthType.DXA },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: {
                  top: noBorder,
                  bottom: noBorder,
                  right: noBorder,
                  left: { style: BorderStyle.SINGLE, size: 24, color: '9CA3AF' },
                },
                width: { size: PAGE_WIDTH, type: WidthType.DXA },
                shading: { fill: 'F9FAFB' },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: doc.note.split('\n').map((line) => para(line)),
              }),
            ],
          }),
        ],
      })
    )
  }

  // No baked-in Contents — use Word References → Table of Contents
  // (Headings: H1 Group · H2 Requirement · H3 Function).

  let chapterCounter = 0
  for (const section of sections) {
    children.push(heading1(section.group.name))
    if (section.group.description?.trim()) {
      children.push(mutedPara(section.group.description))
    }
    if (!section.chapters.length) {
      children.push(mutedPara('No requirements in this group.'))
      continue
    }
    for (const chapter of section.chapters) {
      chapterCounter += 1
      children.push(...renderChapter(chapter, chapterCounter))
    }
  }

  const document = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 20 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  })

  return Packer.toBlob(document)
}

export function suggestSpecPackDocxFilename(doc: SpecPackPreviewDocument): string {
  const safe = doc.title
    .replace(/[^\w\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
  return `${safe || 'spec-pack'}.docx`
}
