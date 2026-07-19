import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LongRunningJobPanel } from './LongRunningJobPanel'
import { UnifiedJobStatus } from '@/shared/lib/unifiedJob'

describe('LongRunningJobPanel', () => {
  it('renders nothing without job', () => {
    const { container } = render(<LongRunningJobPanel job={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows running job label and progress', () => {
    render(
      <LongRunningJobPanel
        job={{
          jobId: '1',
          jobType: 'REINDEX',
          status: UnifiedJobStatus.Running,
          progressPercent: 40,
        }}
      />
    )
    expect(screen.getByText('REINDEX')).toBeInTheDocument()
    expect(screen.getByText('Running')).toBeInTheDocument()
  })

  it('shows failed message', () => {
    render(
      <LongRunningJobPanel
        job={{
          jobId: '2',
          jobType: 'EXPORT',
          status: UnifiedJobStatus.Failed,
          errorMessage: 'Disk full',
        }}
      />
    )
    expect(screen.getByText('Disk full')).toBeInTheDocument()
  })
})
