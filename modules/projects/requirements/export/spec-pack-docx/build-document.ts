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
  opts?: { heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]; spacingAfter?: number }
): Paragraph {
  const children =
    typeof content === 'string' ? [text(content, { bold: Boolean(opts?.heading) })] : content
  return new Paragraph({
    children,
    heading: opts?.heading,
    spacing: { after: opts?.spacingAfter ?? 120 },
  })
}

function heading1(label: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 160 },
    children: [text(label, { bold: true, size: 32 })],
  })
}

function heading2(label: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB', space: 4 },
    },
    children: [text(label, { bold: true, size: 26 })],
  })
}

function heading3(label: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [text(label, { bold: true, size: 22 })],
  })
}

function heading4(label: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [text(label, { bold: true, size: 20, muted: true })],
  })
}

function mutedPara(content: string): Paragraph {
  return para([text(content, { muted: true })])
}

/** Status / type / priority as separate bordered cells (Word-safe). */
function chipRow(labels: Array<string | null | undefined>): Table | null {
  const chips = labels.map((l) => (l ?? '').trim()).filter(Boolean)
  if (!chips.length) return null
  return new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
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

function metaTable(rows: Array<[string, string | null | undefined]>): Table | null {
  const filled = rows.filter(([, v]) => Boolean(v && String(v).trim()))
  if (!filled.length) return null
  return new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
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
              width: { size: VALUE_WIDTH, type: WidthType.DXA },
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

function bullet(label: string, body?: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 360 },
    children: [
      text('• '),
      text(label, { bold: true }),
      ...(body ? [text(` — ${body}`)] : []),
    ],
  })
}

function itemList(title: string, items: SpecPackPreviewItem[]): Array<Paragraph> {
  if (!items.length) return []
  return [
    heading4(title),
    ...items.map((i) => {
      const code = i.code ? `${i.code} · ` : ''
      const secondary = i.secondary ? ` (${i.secondary})` : ''
      return bullet(`${code}${i.name}${secondary}`)
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

function renderUseCase(uc: SpecPackPreviewUseCase, numberLabel: string): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [
    heading4(`${numberLabel}. Use Case · ${uc.key} — ${uc.name}`),
  ]
  const meta = metaTable([
    ['Goal', uc.goal],
    ['Primary actor', uc.primaryActorName],
    ['Trigger', uc.triggerText],
  ])
  if (meta) out.push(meta)

  if (uc.conditions.length) {
    out.push(heading4('Conditions'))
    for (const c of uc.conditions) out.push(bullet(c.type, c.content))
  }
  if (uc.businessRules.length) {
    out.push(heading4('Business rules'))
    for (const r of uc.businessRules) out.push(bullet(r.code, r.description))
  }
  if (uc.acceptanceCriteria.length) {
    out.push(heading4('Acceptance criteria'))
    for (const a of uc.acceptanceCriteria) {
      const gwt = [
        a.givenText ? `Given: ${a.givenText}` : null,
        a.whenText ? `When: ${a.whenText}` : null,
        a.thenText ? `Then: ${a.thenText}` : null,
      ]
        .filter(Boolean)
        .join('\n')
      out.push(bullet(a.title, gwt || undefined))
    }
  }
  for (const f of uc.flows) {
    const title = [f.flowType, f.name].filter(Boolean).join(' · ')
    out.push(heading4(`Flow · ${title}`))
    if (f.conditionText) out.push(mutedPara(f.conditionText))
    if (!f.steps.length) out.push(mutedPara('No steps.'))
    else {
      f.steps.forEach((s, i) => {
        out.push(
          para([
            text(`${i + 1}. `),
            text(s.stepType, { muted: true }),
            ...(s.text ? [text(` — ${s.text}`)] : []),
          ])
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
  const title = [fn.code, fn.name].filter(Boolean).join(' — ')
  const out: Array<Paragraph | Table> = [
    heading3(`${numberLabel}. Function · ${title}`),
  ]

  const meta = metaTable([
    ['Code', fn.code],
    ['Title', fn.name],
    ['Type', fn.type],
    ['Priority', fn.priority],
    ['Status', fn.status],
    [
      'Module',
      block.module
        ? [block.module.code, block.module.name].filter(Boolean).join(' · ')
        : fn.moduleId,
    ],
    ['Description', fn.description],
    ['Created', fn.createdAt ? formatSpecPackDate(fn.createdAt) : null],
    ['Updated', fn.updatedAt ? formatSpecPackDate(fn.updatedAt) : null],
  ])
  if (meta) out.push(meta)

  if (fn.acceptanceCriteria?.length) {
    out.push(heading4('Acceptance criteria'))
    fn.acceptanceCriteria.forEach((c, i) => out.push(para(`${i + 1}. ${c}`)))
  }

  if (fn.businessRules?.length) {
    out.push(heading4('Business rules'))
    for (const r of fn.businessRules) {
      const head = [r.code, r.title].filter(Boolean).join(' — ')
      out.push(para([text(head, { bold: true })]))
      const chips = chipRow([r.severity, r.status])
      if (chips) out.push(chips)
      if (r.description) out.push(para(r.description))
    }
  }

  out.push(...itemList('Screens', block.screens))
  out.push(...itemList('APIs', block.apis))
  out.push(...itemList('Components', block.components))
  out.push(...itemList('Entities', block.entities))
  out.push(...itemList('Communications / Notifications', block.communications))

  if (!block.useCases.length) out.push(mutedPara('No use cases linked to this function.'))
  else {
    block.useCases.forEach((uc, i) => {
      out.push(...renderUseCase(uc, `${numberLabel}.${i + 1}`))
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
    heading2(`${chapterNo}. ${req.code} — ${req.title}`),
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

  children.push(heading1(doc.title))
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

  // TOC
  let chapterCounter = 0
  const showGroupHeadings = sections.length > 1
  children.push(heading2('Contents'))
  for (const section of sections) {
    if (showGroupHeadings) {
      children.push(para([text(section.group.name, { bold: true })]))
    }
    for (const chapter of section.chapters) {
      chapterCounter += 1
      children.push(
        para(
          `${chapterCounter}. ${chapter.requirement.code} — ${chapter.requirement.title}`,
          { spacingAfter: 60 }
        )
      )
    }
  }

  chapterCounter = 0
  for (const section of sections) {
    children.push(heading2(section.group.name))
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
