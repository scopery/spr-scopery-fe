import type { Meta, StoryObj } from '@storybook/react';
import { Radio } from './Radio';

const meta = {
  title: 'Atoms/Radio',
  component: Radio,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Radio size',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the radio is disabled',
    },
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'default',
    value: 'option1',
    label: 'Option 1',
  },
};

export const WithHelperText: Story = {
  args: {
    name: 'helper',
    value: 'option1',
    label: 'Premium Plan',
    helperText: 'Recommended for teams',
  },
};

export const WithError: Story = {
  args: {
    name: 'error',
    value: 'option1',
    label: 'Invalid option',
    error: 'This option is not available',
  },
};

export const Checked: Story = {
  args: {
    name: 'checked',
    value: 'option1',
    label: 'Selected option',
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    name: 'disabled',
    value: 'option1',
    label: 'Disabled option',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    name: 'disabled-checked',
    value: 'option1',
    label: 'Disabled checked',
    disabled: true,
    defaultChecked: true,
  },
};

export const Small: Story = {
  args: {
    name: 'small',
    value: 'option1',
    label: 'Small radio',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    name: 'medium',
    value: 'option1',
    label: 'Medium radio',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    name: 'large',
    value: 'option1',
    label: 'Large radio',
    size: 'lg',
  },
};

export const RadioGroup: Story = {
  render: () => (
    <div className="flex flex-col gap-md">
      <Radio name="plan" value="free" label="Free" helperText="Basic features" />
      <Radio name="plan" value="pro" label="Pro" helperText="Advanced features" defaultChecked />
      <Radio name="plan" value="enterprise" label="Enterprise" helperText="All features" />
    </div>
  ),
};

