import { describe, expect, it } from 'vitest'
import { GUIDE_ARTICLES } from '../content/articles'
import { searchGuides } from './guide-search.rules'

describe('searchGuides', () => {
  it('finds timeline by button hint', () => {
    const hits = searchGuides(GUIDE_ARTICLES, 'Apply Changes')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].article.id).toBe('plan-timeline')
  })

  it('finds create project via suggested question language', () => {
    const hits = searchGuides(GUIDE_ARTICLES, 'create a project')
    expect(hits.some((h) => h.article.id === 'project-create')).toBe(true)
  })

  it('finds RAID by New item hint', () => {
    const hits = searchGuides(GUIDE_ARTICLES, 'New item')
    expect(hits.some((h) => h.article.id === 'control-raid')).toBe(true)
  })

  it('finds Specification Packages', () => {
    const hits = searchGuides(GUIDE_ARTICLES, 'Specification Packages')
    expect(hits.some((h) => h.article.id === 'scope-requirements')).toBe(true)
  })

  it('still finds legacy Spec Packs wording via keywords', () => {
    const hits = searchGuides(GUIDE_ARTICLES, 'Spec Packs')
    expect(hits.some((h) => h.article.id === 'scope-requirements')).toBe(true)
  })
})
