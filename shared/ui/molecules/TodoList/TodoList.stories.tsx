import type { Meta, StoryObj } from '@storybook/react'
import { TodoList } from './TodoList'
import type { TodoItem } from './TodoList.types'

const meta = {
  title: 'Molecules/TodoList',
  component: TodoList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title of the todo list',
    },
    items: {
      control: 'object',
      description: 'Array of todo items',
    },
    onAdd: {
      action: 'add clicked',
      description: 'Callback when add button is clicked',
    },
    onToggle: {
      action: 'toggle clicked',
      description: 'Callback when a todo item is toggled',
    },
    onExpand: {
      action: 'expand clicked',
      description: 'Callback when a todo item is expanded/collapsed',
    },
  },
} satisfies Meta<typeof TodoList>

export default meta
type Story = StoryObj<typeof meta>

const defaultItems: TodoItem[] = [
  {
    id: '1',
    title: 'Update button styles to match guidelines',
    date: 'Mar 24th',
    status: 'blocking',
  },
  {
    id: '2',
    title: 'Sync with UX team to refine user flows',
    date: 'Mar 24th',
    status: 'essential',
    expanded: true,
    description:
      'Design low-fidelity wireframes for the new landing page, ensuring a user-friendly layout and clear content hierarchy.',
    assignee: {
      name: 'Kaylynn Siphron',
    },
  },
  {
    id: '3',
    title: 'Create wireframes for the new landing page',
    date: 'Mar 23rd',
    status: 'urgent',
  },
  {
    id: '4',
    title: 'Use a grid system for consistency',
    date: 'Mar 22nd',
    status: 'blocking',
  },
]

export const Default: Story = {
  args: {
    items: defaultItems,
    onAdd: () => console.log('Add clicked'),
    onToggle: (id: string, completed: boolean) => console.log('Toggle:', id, completed),
  },
}

export const WithoutAddButton: Story = {
  args: {
    items: defaultItems,
  },
}

export const WithCompletedTasks: Story = {
  args: {
    items: [
      {
        id: '1',
        title: 'Completed task',
        completed: true,
        date: 'Mar 20th',
        status: 'normal',
      },
      ...defaultItems,
    ],
  },
}

export const SingleTask: Story = {
  args: {
    items: [
      {
        id: '1',
        title: 'Single task item',
        date: 'Mar 24th',
        status: 'essential',
      },
    ],
  },
}

export const WithAllStatuses: Story = {
  args: {
    items: [
      {
        id: '1',
        title: 'Blocking task',
        date: 'Mar 24th',
        status: 'blocking',
      },
      {
        id: '2',
        title: 'Essential task',
        date: 'Mar 24th',
        status: 'essential',
      },
      {
        id: '3',
        title: 'Urgent task',
        date: 'Mar 23rd',
        status: 'urgent',
      },
      {
        id: '4',
        title: 'Normal task',
        date: 'Mar 22nd',
        status: 'normal',
      },
    ],
  },
}

export const FullyExpanded: Story = {
  args: {
    items: [
      {
        id: '1',
        title: 'Task with full details',
        date: 'Mar 24th',
        status: 'essential',
        expanded: true,
        description:
          'This is a detailed description of the task. It can contain multiple lines of text explaining what needs to be done.',
        assignee: {
          name: 'John Doe',
          avatar: 'https://i.pravatar.cc/150?img=1',
        },
      },
      {
        id: '2',
        title: 'Another expanded task',
        date: 'Mar 23rd',
        status: 'urgent',
        expanded: true,
        description: 'Another task with expanded details.',
        assignee: {
          name: 'Jane Smith',
        },
      },
    ],
  },
}
