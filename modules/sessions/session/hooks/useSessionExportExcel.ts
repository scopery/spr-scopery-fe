'use client'

import { useCallback } from 'react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { toAnswerText } from '@/utils/answerText'
import type { ProjectQuestion } from '@/modules/projects'
import type { AnswerItem } from '../model/session'

type UseSessionExportExcelParams = {
  sessionName: string | undefined
  orderedQuestions: ProjectQuestion[]
  questionOrderMap: Record<string, number>
  answers: Record<string, AnswerItem>
}

export function useSessionExportExcel({
  sessionName,
  orderedQuestions,
  questionOrderMap,
  answers,
}: UseSessionExportExcelParams) {
  const exportExcel = useCallback(() => {
    const headers = ['Section', 'Position', 'Question', 'Type', 'Required', 'Status', 'Answer']
    const rows = orderedQuestions.map((q) => {
      const order = questionOrderMap[q.id]
      const ans = answers[q.id]
      const status = ans?.answer_status ?? '—'
      const answerText = toAnswerText(
        q.q_type,
        ans?.value,
        q.answer_schema as Record<string, unknown>
      )
      return [
        q.section || 'general',
        order ?? '',
        q.prompt,
        q.q_type,
        q.required ? 'Yes' : 'No',
        status,
        answerText || (status !== 'answered' ? status : ''),
      ]
    })
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet, 'Questions')
    const safeName = (sessionName || 'session').replace(/[/\\?*[\]:]/g, '-').slice(0, 80)
    XLSX.writeFile(wb, `${safeName}-questions.xlsx`)
    toast.success('Export downloaded')
  }, [orderedQuestions, questionOrderMap, answers, sessionName])

  return { exportExcel }
}
