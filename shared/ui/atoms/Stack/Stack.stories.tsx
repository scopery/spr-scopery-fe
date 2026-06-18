import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from './Stack';
import { Button } from '../Button';

const meta = {
  title: 'Atoms/Stack',
  component: Stack,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Stack direction',
    },
    spacing: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Space between items',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch', 'baseline'],
      description: 'Align items',
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
      description: 'Justify content',
    },
    wrap: {
      control: 'boolean',
      description: 'Allow wrapping',
    },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

const BoxItem = ({ children }: { children: React.ReactNode }) => (
  <div className="p-md bg-primary text-white rounded">{children}</div>
);

export const Vertical: Story = {
  args: {
    direction: 'vertical',
    spacing: 'md',
    children: (
      <>
        <BoxItem>Item 1</BoxItem>
        <BoxItem>Item 2</BoxItem>
        <BoxItem>Item 3</BoxItem>
      </>
    ),
  },
};

export const Horizontal: Story = {
  args: {
    direction: 'horizontal',
    spacing: 'md',
    children: (
      <>
        <BoxItem>Item 1</BoxItem>
        <BoxItem>Item 2</BoxItem>
        <BoxItem>Item 3</BoxItem>
      </>
    ),
  },
};

export const SmallSpacing: Story = {
  args: {
    direction: 'vertical',
    spacing: 'sm',
    children: (
      <>
        <BoxItem>Item 1</BoxItem>
        <BoxItem>Item 2</BoxItem>
        <BoxItem>Item 3</BoxItem>
      </>
    ),
  },
};

export const LargeSpacing: Story = {
  args: {
    direction: 'vertical',
    spacing: 'xl',
    children: (
      <>
        <BoxItem>Item 1</BoxItem>
        <BoxItem>Item 2</BoxItem>
        <BoxItem>Item 3</BoxItem>
      </>
    ),
  },
};

export const CenterAligned: Story = {
  args: {
    direction: 'horizontal',
    spacing: 'md',
    align: 'center',
    children: (
      <>
        <BoxItem>Short</BoxItem>
        <div className="p-lg bg-primary text-white rounded">Tall item</div>
        <BoxItem>Short</BoxItem>
      </>
    ),
  },
};

export const SpaceBetween: Story = {
  args: {
    direction: 'horizontal',
    spacing: 'md',
    justify: 'between',
    children: (
      <>
        <BoxItem>Left</BoxItem>
        <BoxItem>Right</BoxItem>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export const Centered: Story = {
  args: {
    direction: 'horizontal',
    spacing: 'md',
    justify: 'center',
    align: 'center',
    children: (
      <>
        <BoxItem>Centered</BoxItem>
        <BoxItem>Items</BoxItem>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithWrap: Story = {
  args: {
    direction: 'horizontal',
    spacing: 'md',
    wrap: true,
    children: (
      <>
        <BoxItem>Item 1</BoxItem>
        <BoxItem>Item 2</BoxItem>
        <BoxItem>Item 3</BoxItem>
        <BoxItem>Item 4</BoxItem>
        <BoxItem>Item 5</BoxItem>
        <BoxItem>Item 6</BoxItem>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export const ButtonGroup: Story = {
  args: {
    direction: 'horizontal',
    spacing: 'sm',
    children: (
      <>
        <Button variant="primary">Save</Button>
        <Button variant="outline">Cancel</Button>
        <Button variant="ghost">Delete</Button>
      </>
    ),
  },
};

export const FormLayout: Story = {
  args: {
    direction: 'vertical',
    spacing: 'lg',
    children: (
      <>
        <div>
          <label className="block mb-xs font-medium">Name</label>
          <input type="text" className="w-full p-sm border rounded" />
        </div>
        <div>
          <label className="block mb-xs font-medium">Email</label>
          <input type="email" className="w-full p-sm border rounded" />
        </div>
        <Button>Submit</Button>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};
