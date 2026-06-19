import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectOverview } from './ProjectOverview'

const sampleSteps = [
  {
    id: 'elicitation',
    label: 'ELICITATION',
    date: 'Feb 15th',
    position: 0.05,
    status: 'completed' as const,
  },
  {
    id: 'planning',
    label: 'IN PLANING',
    date: 'Feb 15th',
    position: 0.32,
    status: 'completed' as const,
  },
  {
    id: 'development',
    label: 'IN DEVELOPMENT',
    date: 'Feb 15th',
    position: 0.6,
    status: 'current' as const,
  },
  { id: 'testing', label: 'TESTING', date: '', position: 0.78, status: 'upcoming' as const },
  { id: 'delivered', label: 'DELIVERED', date: '', position: 0.95, status: 'upcoming' as const },
]

describe('ProjectOverview', () => {
  it('renders title, description, and badge', () => {
    render(
      <ProjectOverview
        title="Project overview"
        description="Design low-fidelity wireframes"
        badgeText="IT Ticket System"
      />
    )

    expect(screen.getByText('Project overview')).toBeInTheDocument()
    expect(screen.getByText('Design low-fidelity wireframes')).toBeInTheDocument()
    expect(screen.getByText('IT Ticket System')).toBeInTheDocument()
  })

  it('renders steps and labels', () => {
    render(<ProjectOverview steps={sampleSteps} />)
    expect(screen.getByText('ELICITATION')).toBeInTheDocument()
    expect(screen.getByText('IN PLANING')).toBeInTheDocument()
    expect(screen.getByText('IN DEVELOPMENT')).toBeInTheDocument()
    expect(screen.getByText('TESTING')).toBeInTheDocument()
    expect(screen.getByText('DELIVERED')).toBeInTheDocument()
  })

  it('renders current step note', () => {
    render(<ProjectOverview currentStepNote="Notes on interactions" />)
    expect(screen.getByText('Current Step:')).toBeInTheDocument()
    expect(screen.getByText('Notes on interactions')).toBeInTheDocument()
  })

  it('renders metrics panel', () => {
    render(
      <ProjectOverview
        metrics={{
          failsLabel: 'FAILS',
          failsValue: '0',
          dueLabel: 'DUE',
          dueValue: 'Apr 28th',
        }}
      />
    )

    expect(screen.getByText('FAILS')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('DUE')).toBeInTheDocument()
    expect(screen.getByText('Apr 28th')).toBeInTheDocument()
  })

  it('clamps progress between 0 and 1', async () => {
    render(<ProjectOverview progress={1.5} steps={sampleSteps} />)
    const track = screen.getByTestId('project-track')
    expect(track.querySelector('[data-testid=\"progress-bar\"]')).toHaveStyle({ width: '100%' })
  })

  it('renders select dropdown when selectOptions provided', () => {
    render(
      <ProjectOverview
        selectOptions={[
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
        ]}
        selectedValue="option1"
      />
    )
    expect(screen.getByText('Option 1')).toBeInTheDocument()
  })
})
