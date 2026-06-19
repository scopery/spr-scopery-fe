import { PolymorphicComponentPropWithRef } from '@/utils/polymorphic'

export type TodoStatus = 'blocking' | 'essential' | 'urgent' | 'normal'

export type TodoItem = {
  id: string
  title: string
  completed?: boolean
  date?: string
  status?: TodoStatus
  description?: string
  assignee?: {
    name: string
    avatar?: string
  }
  expanded?: boolean
}

export type TodoListProps<C extends React.ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  {
    /**
     * Title of the todo list
     * @default 'To do list'
     */
    title?: string
    /**
     * Array of todo items
     * @default []
     */
    items?: TodoItem[]
    /**
     * Callback when add button is clicked
     */
    onAdd?: () => void
    /**
     * Callback when a todo item is toggled
     */
    onToggle?: (id: string, completed: boolean) => void
    /**
     * Callback when a todo item is expanded/collapsed
     */
    onExpand?: (id: string, expanded: boolean) => void
    /**
     * Border radius for the card container
     */
    cardBorderRadius?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
    /**
     * Shadow for the card container
     */
    cardShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  }
>
