import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import type { ModalProps } from './Modal.types'
import { Modal } from './Modal'
import { Typography } from '@/shared/ui/atoms/Typography'
import { Button } from '@/shared/ui/atoms/Button'
import { Input } from '@/shared/ui/atoms/Input'
import { Textarea } from '@/shared/ui/atoms/Textarea'

const meta = {
  title: 'Molecules/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    title: {
      control: 'text',
      description: 'Modal title',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Modal size',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Whether to show close button',
    },
    closeOnOverlayClick: {
      control: 'boolean',
      description: 'Whether clicking overlay closes modal',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Whether pressing ESC closes modal',
    },
  },
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

// Wrapper component for interactive stories
type ModalStoryArgs = Omit<ModalProps<'div'>, 'ref'>
const ModalWrapper = (args: ModalStoryArgs) => {
  const [open, setOpen] = useState(args.open ?? false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal {...args} open={open} onClose={() => setOpen(false)}>
        {args.children}
      </Modal>
    </>
  )
}

export const Default: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Modal Title',
    children: (
      <Typography>
        This is the modal content. It can contain any React elements.
      </Typography>
    ),
  },
}

export const WithActions: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Confirm Action',
    actions: [
      { label: 'Cancel', onClick: () => {}, variant: 'ghost' },
      { label: 'Confirm', onClick: () => {}, variant: 'primary' },
    ],
    children: (
      <Typography>
        Are you sure you want to proceed with this action?
      </Typography>
    ),
  },
}

export const WithForm: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Create New Item',
    actions: [
      { label: 'Cancel', onClick: () => {}, variant: 'ghost' },
      { label: 'Create', onClick: () => {}, variant: 'primary' },
    ],
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input label="Name" placeholder="Enter name" />
        <Textarea label="Description" placeholder="Enter description" />
      </div>
    ),
  },
}

export const LongContent: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Scrollable Content',
    actions: [
      { label: 'Close', onClick: () => {}, variant: 'primary' },
    ],
    children: (
      <div>
        {Array.from({ length: 20 }, (_, i) => (
          <Typography key={i} className="mb-4">
            Paragraph {i + 1}: This is a long paragraph to demonstrate scrolling
            behavior. The modal body should scroll while the header and footer
            remain fixed.
          </Typography>
        ))}
      </div>
    ),
  },
}

export const Small: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Small Modal',
    size: 'sm',
    children: (
      <Typography>
        This is a small modal with limited width.
      </Typography>
    ),
  },
}

export const Large: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Large Modal',
    size: 'lg',
    children: (
      <Typography>
        This is a large modal with more width for content.
      </Typography>
    ),
  },
}

export const WithoutCloseButton: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Modal Without Close Button',
    showCloseButton: false,
    children: (
      <Typography>
        This modal does not have a close button in the header.
      </Typography>
    ),
  },
}

export const MultipleActions: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Multiple Actions',
    actions: [
      { label: 'Delete', onClick: () => {}, variant: 'ghost', tone: 'error' },
      { label: 'Cancel', onClick: () => {}, variant: 'ghost' },
      { label: 'Save', onClick: () => {}, variant: 'primary' },
    ],
    children: (
      <Typography>
        This modal has multiple action buttons in the footer.
      </Typography>
    ),
  },
}

