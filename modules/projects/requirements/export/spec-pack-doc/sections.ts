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
  return `<h4>${escapeHtml(title)}</h4><ul>${rows}</ul>`
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
      ? `<h4>Conditions</h4><ul>${uc.conditions
          .map(
            (c) =>
              `<li><strong>${escapeHtml(c.type)}</strong> — ${escapeHtml(c.content)}</li>`
          )
          .join('')}</ul>`
      : ''

  const rules =
    uc.businessRules.length > 0
      ? `<h4>Business rules</h4><ul>${uc.businessRules
          .map(
            (r) =>
              `<li><strong>${escapeHtml(r.code)}</strong> — ${escapeHtml(r.description)}</li>`
          )
          .join('')}</ul>`
      : ''

  const ac =
    uc.acceptanceCriteria.length > 0
      ? `<h4>Acceptance criteria</h4><ul>${uc.acceptanceCriteria
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
      return `<h4>Flow · ${escapeHtml(title)}</h4>${cond}${steps}`
    })
    .join('')

  return `
    <div class="uc-block">
      <h4>${escapeHtml(numberLabel)}. Use Case · ${escapeHtml(uc.key)} — ${escapeHtml(
        uc.name
      )}</h4>
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
  const title = [fn.code, fn.name].filter(Boolean).join(' — ')

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
      ? `<h4>Acceptance criteria</h4><ol>${fn.acceptanceCriteria
          .map((c) => `<li>${nl2br(c)}</li>`)
          .join('')}</ol>`
      : ''

  const rules =
    fn.businessRules && fn.businessRules.length > 0
      ? `<h4>Business rules</h4><table>${fn.businessRules
          .map((r) => {
            const head = [r.code, r.title].filter(Boolean).join(' — ')
            const badges = [
              r.severity ? `<span class="chip">${escapeHtml(r.severity)}</span>` : '',
              r.status ? `<span class="chip">${escapeHtml(r.status)}</span>` : '',
            ].join('')
            return `<tr><th>${escapeHtml(head)}</th><td>${badges}${
              r.description ? `<div>${nl2br(r.description)}</div>` : ''
            }</td></tr>`
          })
          .join('')}</table>`
      : ''

  const useCases = block.useCases
    .map((uc, i) => renderUseCaseHtml(uc, `${numberLabel}.${i + 1}`))
    .join('')

  return `
    <div class="fn-block">
      <h3>${escapeHtml(numberLabel)}. Function · ${escapeHtml(title)}</h3>
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
  const chips = [
    req.requirementType ? `<span class="chip">${escapeHtml(req.requirementType)}</span>` : '',
    req.priority ? `<span class="chip">${escapeHtml(req.priority)}</span>` : '',
  ].join('')

  if (chapter.loadError) {
    return `
      <h2>${chapterNo}. ${escapeHtml(req.code)} — ${escapeHtml(req.title)}</h2>
      <p class="error">${escapeHtml(chapter.loadError)}</p>
    `
  }

  const functions = chapter.functions
    .map((block, i) => renderFunctionBlockHtml(block, chapterNo, i + 1))
    .join('')

  return `
    <h2>${chapterNo}. ${escapeHtml(req.code)} — ${escapeHtml(req.title)}</h2>
    ${chips ? `<p>${chips}</p>` : ''}
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
  const chapters = doc.chapters
    .map((chapter, index) => renderRequirementChapterHtml(chapter, index))
    .join('\n')

  return `
    <h1>${escapeHtml(doc.title)}</h1>
    <p class="meta">
      Created ${escapeHtml(formatSpecPackDate(doc.createdAt))} · Generated ${escapeHtml(
        formatSpecPackDate(doc.generatedAt)
      )} ·
      ${doc.chapters.length} requirement${doc.chapters.length === 1 ? '' : 's'}
    </p>
    ${doc.note ? `<div class="note">${nl2br(doc.note)}</div>` : ''}
    ${chapters}
  `
}
