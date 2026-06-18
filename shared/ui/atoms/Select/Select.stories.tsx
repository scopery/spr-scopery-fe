import type { Meta, StoryObj } from '@storybook/react'
import { Select } from './Select'
import { useState } from 'react'

const meta = {
  title: 'Atoms/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    options: {
      control: 'object',
      description: 'Array of select options',
    },
    value: {
      control: 'text',
      description: 'Selected value',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Select size',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether select is disabled',
    },
    onValueChange: {
      action: 'value changed',
      description: 'Callback when value changes',
    },
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

const defaultOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
]

export const Default: Story = {
  args: {
    options: defaultOptions,
    placeholder: 'Select an option...',
  },
}

export const WithValue: Story = {
  args: {
    options: defaultOptions,
    value: 'option2',
  },
}

export const Small: Story = {
  args: {
    options: defaultOptions,
    size: 'sm',
    placeholder: 'Small select...',
  },
}

export const Large: Story = {
  args: {
    options: defaultOptions,
    size: 'lg',
    placeholder: 'Large select...',
  },
}

export const Disabled: Story = {
  args: {
    options: defaultOptions,
    disabled: true,
    placeholder: 'Disabled select...',
  },
}

export const WithDisabledOptions: Story = {
  args: {
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2', disabled: true },
      { value: 'option3', label: 'Option 3' },
    ],
    placeholder: 'Select...',
  },
}

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState<string>()
    return (
      <Select
        options={defaultOptions}
        value={value}
        onValueChange={setValue}
        placeholder="Select an option..."
      />
    )
  },
}

