import type { ReactNode } from 'react'
import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'

export interface BulkImportFormatHelpProps {
  guide: BulkImportFormatGuide
  className?: string
  /** Start with the guide panel expanded. */
  defaultOpen?: boolean
  /** Optional label rendered next to the help icon. */
  label?: ReactNode
}
