/**
 * API enum question_type_enum expects snake_case (e.g. open_ended).
 * Normalize display/hyphenated values before sending to API.
 *
 * Note: For impact commit (POST .../ai/questions/commit), the backend loads
 * questions from DB. If a question has q_type "open-ended" in the DB, the API
 * must normalize it to "open_ended" before using in enum context, or the commit
 * returns 404 "invalid input value for enum question_type_enum: \"open-ended\"".
 */
export function normalizeQuestionTypeForApi(qType: string): string {
  if (qType === 'open-ended') return 'open_ended'
  return qType
}
