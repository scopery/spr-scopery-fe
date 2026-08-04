import type {
  SpecPackPreviewDocument,
  SpecPackPreviewFunctionBlock,
  SpecPackPreviewItem,
  SpecPackPreviewRequirementChapter,
  SpecPackPreviewUseCase,
} from '../../model/spec-pack-preview'
import { formatSpecPackDate } from '../../model/spec-pack'
import { escapeHtml, nl2br } from './escape'

function itemLabel(item: SpecPackPreviewItem): string {
  const code = item.code ? `${escapeHtml(item.code)} · ` : ''
  const secondary = item.secondary
    ? ` <span class="muted">(${escapeHtml(item.secondary)})</span>`
    : ''
  return `${code}${escapeHtml(item.name)}${secondary}`
}

function renderItemList(title: string, items: SpecPackPreviewItem[]): string {
  if (!items.length) return ''
  const rows = items.map((i) => `<li>${itemLabel(i)}</li>`).join('')
  return `<p class="section-label">${escapeHtml(title)}</p><ul>${rows}</ul>`
}

function renderChips(labels: Array<string | null | undefined>): string {
  const chips = labels
    .map((l) => (l ?? '').trim())
    .filter(Boolean)
    .map((l) => `<td class="chip-cell">${escapeHtml(l)}</td>`)
  if (!chips.length) return ''
  return `<table class="chip-row" role="presentation"><tr>${chips.join('')}</tr></table>`
}

function metaRow(label: string, valueHtml: string | null | undefined): string {
  if (!valueHtml) return ''
  return `<tr><th>${escapeHtml(label)}</th><td>${valueHtml}</td></tr>`
}

function renderUseCaseHtml(
  uc: SpecPackPreviewUseCase,
  numberLabel: string
): string {
  const metaRows = [
    uc.goal ? `<tr><th>Goal</th><td>${nl2br(uc.goal)}</td></tr>` : '',
    uc.primaryActorName
      ? `<tr><th>Primary actor</th><td>${escapeHtml(uc.primaryActorName)}</td></tr>`
      : '',
    uc.triggerText
      ? `<tr><th>Trigger</th><td>${nl2br(uc.triggerText)}</td></tr>`
      : '',
  ].join('')

  const conditions =
    uc.conditions.length > 0
      ? `<p class="section-label">Conditions</p><ul>${uc.conditions
          .map(
            (c) =>
              `<li><strong>${escapeHtml(c.type)}</strong> — ${escapeHtml(c.content)}</li>`
          )
          .join('')}</ul>`
      : ''

  const rules =
    uc.businessRules.length > 0
      ? `<p class="section-label">Business rules</p><ul>${uc.businessRules
          .map(
            (r) =>
              `<li><strong>${escapeHtml(r.code)}</strong> — ${escapeHtml(r.description)}</li>`
          )
          .join('')}</ul>`
      : ''

  const ac =
    uc.acceptanceCriteria.length > 0
      ? `<p class="section-label">Acceptance criteria</p><ul>${uc.acceptanceCriteria
          .map((a) => {
            const gwt = [
              a.givenText ? `Given: ${escapeHtml(a.givenText)}` : null,
              a.whenText ? `When: ${escapeHtml(a.whenText)}` : null,
              a.thenText ? `Then: ${escapeHtml(a.thenText)}` : null,
            ]
              .filter(Boolean)
              .join('<br/>')
            return `<li><strong>${escapeHtml(a.title)}</strong>${
              gwt ? `<br/>${gwt}` : ''
            }</li>`
          })
          .join('')}</ul>`
      : ''

  const flows = uc.flows
    .map((f) => {
      const title = [f.flowType, f.name].filter(Boolean).join(' · ')
      const steps =
        f.steps.length > 0
          ? `<ol>${f.steps
              .map(
                (s) =>
                  `<li><span class="muted">${escapeHtml(s.stepType)}</span>${
                    s.text ? ` — ${escapeHtml(s.text)}` : ''
                  }</li>`
              )
              .join('')}</ol>`
          : '<p class="muted">No steps.</p>'
      const cond = f.conditionText
        ? `<p class="muted">${escapeHtml(f.conditionText)}</p>`
        : ''
      return `<p class="section-label">Flow · ${escapeHtml(title)}</p>${cond}${steps}`
    })
    .join('')

  return `
    <div class="uc-block">
      <p class="section-label">${escapeHtml(numberLabel)}. ${escapeHtml(uc.name)}${
        uc.key ? ` <span class="code-muted">${escapeHtml(uc.key)}</span>` : ''
      }</p>
      ${metaRows ? `<table>${metaRows}</table>` : ''}
      ${conditions}
      ${rules}
      ${ac}
      ${flows}
    </div>
  `
}

export function renderFunctionBlockHtml(
  block: SpecPackPreviewFunctionBlock,
  chapterNo: number,
  functionNo: number
): string {
  const fn = block.function
  const numberLabel = `${chapterNo}.${functionNo}`
  const fnName = fn.name || fn.code || 'Function'
  const fnCode = fn.code && fn.name ? fn.code : null

  const metaRows = [
    metaRow('Code', fn.code ? escapeHtml(fn.code) : null),
    metaRow('Title', fn.name ? escapeHtml(fn.name) : null),
    metaRow('Type', fn.type ? escapeHtml(fn.type) : null),
    metaRow('Priority', fn.priority ? escapeHtml(fn.priority) : null),
    metaRow('Status', fn.status ? escapeHtml(fn.status) : null),
    metaRow(
      'Module',
      block.module
        ? itemLabel(block.module)
        : fn.moduleId
          ? escapeHtml(fn.moduleId)
          : null
    ),
    metaRow('Description', fn.description ? nl2br(fn.description) : null),
    metaRow(
      'Created',
      fn.createdAt ? escapeHtml(formatSpecPackDate(fn.createdAt)) : null
    ),
    metaRow(
      'Updated',
      fn.updatedAt ? escapeHtml(formatSpecPackDate(fn.updatedAt)) : null
    ),
  ].join('')

  const acceptance =
    fn.acceptanceCriteria && fn.acceptanceCriteria.length > 0
      ? `<p class="section-label">Acceptance criteria</p><ol>${fn.acceptanceCriteria
          .map((c) => `<li>${nl2br(c)}</li>`)
          .join('')}</ol>`
      : ''

  const rules =
    fn.businessRules && fn.businessRules.length > 0
      ? `<p class="section-label">Business rules</p><table>${fn.businessRules
          .map((r) => {
            const head = [r.title, r.code].filter(Boolean).join(' · ')
            return `<tr><th>${escapeHtml(head || 'Rule')}</th><td>${renderChips([
              r.severity,
              r.status,
            ])}${r.description ? `<div>${nl2br(r.description)}</div>` : ''}</td></tr>`
          })
          .join('')}</table>`
      : ''

  const useCases = block.useCases
    .map((uc, i) => renderUseCaseHtml(uc, `${numberLabel}.${i + 1}`))
    .join('')

  return `
    <div class="fn-block">
      <h4><b>${escapeHtml(numberLabel)}. ${escapeHtml(fnName)}</b>${
        fnCode ? ` <span class="code-muted">${escapeHtml(fnCode)}</span>` : ''
      }</h4>
      ${metaRows ? `<table>${metaRows}</table>` : ''}
      ${acceptance}
      ${rules}
      ${renderItemList('Screens', block.screens)}
      ${renderItemList('APIs', block.apis)}
      ${renderItemList('Components', block.components)}
      ${renderItemList('Entities', block.entities)}
      ${renderItemList('Communications / Notifications', block.communications)}
      ${
        useCases ||
        '<p class="muted">No use cases linked to this function.</p>'
      }
    </div>
  `
}

export function renderRequirementChapterHtml(
  chapter: SpecPackPreviewRequirementChapter,
  index: number
): string {
  const req = chapter.requirement
  const chapterNo = index + 1
  const chips = renderChips([req.requirementType, req.priority])
  const titleHtml = `<b>${chapterNo}. ${escapeHtml(req.title)}</b>${
    req.code ? ` <span class="code-muted">${escapeHtml(req.code)}</span>` : ''
  }`

  if (chapter.loadError) {
    return `
      <h3>${titleHtml}</h3>
      <p class="error">${escapeHtml(chapter.loadError)}</p>
    `
  }

  const functions = chapter.functions
    .map((block, i) => renderFunctionBlockHtml(block, chapterNo, i + 1))
    .join('')

  return `
    <h3>${titleHtml}</h3>
    ${chips ? chips : ''}
    ${
      req.description
        ? `<table><tr><th>Description</th><td>${nl2br(req.description)}</td></tr></table>`
        : ''
    }
    ${
      functions ||
      '<p class="muted">No linked functions.</p>'
    }
  `
}

export function renderSpecPackBodyHtml(doc: SpecPackPreviewDocument): string {
  const sections = doc.sections?.length
    ? doc.sections
    : [
        {
          group: { id: 'legacy', name: 'Requirements', description: null },
          chapters: doc.chapters,
        },
      ]

  const tocItems: string[] = []
  let chapterCounter = 0
  const showGroupHeadings = sections.length > 1
  for (const section of sections) {
    if (showGroupHeadings) {
      tocItems.push(
        `<div class="toc-group"><b>${escapeHtml(section.group.name)}</b></div>`
      )
    }
    for (const chapter of section.chapters) {
      chapterCounter += 1
      tocItems.push(
        `<div class="toc-item">${chapterCounter}. ${escapeHtml(
          chapter.requirement.title
        )}${
          chapter.requirement.code
            ? ` <span class="code-muted">${escapeHtml(chapter.requirement.code)}</span>`
            : ''
        }</div>`
      )
    }
  }

  const toc =
    chapterCounter > 0
      ? `
    <p class="toc-heading">Contents</p>
    <div class="toc">
      ${tocItems.join('\n')}
    </div>
  `
      : ''

  chapterCounter = 0
  const body = sections
    .map((section) => {
      const groupHeading = `
      <h2><b>${escapeHtml(section.group.name)}</b></h2>
      ${
        section.group.description
          ? `<p class="muted">${nl2br(section.group.description)}</p>`
          : ''
      }
    `
      const chaptersHtml = section.chapters
        .map((chapter) => {
          chapterCounter += 1
          return renderRequirementChapterHtml(chapter, chapterCounter - 1)
        })
        .join('\n')
      return `${groupHeading}${chaptersHtml || '<p class="muted">No requirements in this group.</p>'}`
    })
    .join('\n')

  return `
    <h1><b>${escapeHtml(doc.title)}</b></h1>
    <p class="meta">
      Created ${escapeHtml(formatSpecPackDate(doc.createdAt))} · Generated ${escapeHtml(
        formatSpecPackDate(doc.generatedAt)
      )} ·
      ${doc.chapters.length} requirement${doc.chapters.length === 1 ? '' : 's'}
      ${
        sections.length > 1
          ? ` · ${sections.length} groups`
          : ''
      }
    </p>
    ${doc.note ? `<div class="note">${nl2br(doc.note)}</div>` : ''}
    ${toc}
    ${body}
  `
}
