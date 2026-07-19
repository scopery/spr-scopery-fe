export const RecommendationStatus = {
  Open: 'OPEN',
  Dismissed: 'DISMISSED',
  Applied: 'APPLIED',
} as const
export type RecommendationStatus =
  (typeof RecommendationStatus)[keyof typeof RecommendationStatus]
