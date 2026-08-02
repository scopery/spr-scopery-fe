import type { GuideArticle, GuideGroup } from '../model/guide'

export interface GuideSearchHit {
  article: GuideArticle
  score: number
  matchedQuestion?: string
}

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

function scoreArticle(article: GuideArticle, q: string): GuideSearchHit | null {
  if (!q) return null
  let score = 0
  let matchedQuestion: string | undefined

  if (normalize(article.title).includes(q)) score += 50
  if (normalize(article.subtitle).includes(q)) score += 25

  for (const kw of article.keywords) {
    if (normalize(kw).includes(q) || q.includes(normalize(kw))) score += 15
  }

  for (const step of article.steps) {
    if (normalize(step.title).includes(q)) score += 10
    if (normalize(step.body).includes(q)) score += 4
    for (const hint of step.uiHints ?? []) {
      if (normalize(hint).includes(q)) score += 12
    }
  }

  for (const question of article.suggestedQuestions) {
    if (normalize(question).includes(q) || q.includes(normalize(question))) {
      score += 30
      matchedQuestion = question
      break
    }
  }

  if (score <= 0) return null
  return { article, score, matchedQuestion }
}

export function searchGuides(articles: GuideArticle[], query: string): GuideSearchHit[] {
  const q = normalize(query)
  if (!q) return []
  return articles
    .map((a) => scoreArticle(a, q))
    .filter((h): h is GuideSearchHit => h != null)
    .sort((a, b) => b.score - a.score)
}

export function collectSuggestedQuestions(articles: GuideArticle[], limit = 8): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const article of articles) {
    for (const q of article.suggestedQuestions) {
      const key = normalize(q)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(q)
      if (out.length >= limit) return out
    }
  }
  return out
}

export function articlesByGroup(
  articles: GuideArticle[],
  groups: GuideGroup[]
): Array<{ group: GuideGroup; articles: GuideArticle[] }> {
  const sortedGroups = [...groups].sort((a, b) => a.order - b.order)
  return sortedGroups
    .map((group) => ({
      group,
      articles: articles.filter((a) => a.groupId === group.id),
    }))
    .filter((g) => g.articles.length > 0)
}

export function findArticle(articles: GuideArticle[], id: string): GuideArticle | undefined {
  return articles.find((a) => a.id === id)
}
