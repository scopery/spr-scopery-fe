/**
 * shared/ui — Design system barrel
 *
 * Rule: Only exports atomic and molecular components.
 * A component belongs here only if it:
 *   - Receives primitive props or generic UI props only
 *   - Does NOT import from services/, types/, constants/, lib/, contexts/, or any business enum
 */

// Atoms
export { Button } from './atoms/Button'
export type { ButtonProps, ButtonVariant, ButtonSize, ButtonTone } from './atoms/Button'

export { Typography, Typography as Text, Typography as Heading } from './atoms/Typography'
export type {
  TypographyProps,
  TypographyVariant,
  TypographySize,
  TypographyWeight,
  TypographyAlign,
  TypographyTone,
} from './atoms/Typography'

export { Link } from './atoms/Link'
export type { LinkProps, LinkVariant, LinkSize } from './atoms/Link'

export { Box } from './atoms/Box'
export type { BoxProps, BoxDisplay, BoxPadding, BoxRadius, BoxShadow } from './atoms/Box'

export { Input } from './atoms/Input'
export type { InputProps, InputSize, InputVariant, InputState } from './atoms/Input'

export { Checkbox } from './atoms/Checkbox'
export type { CheckboxProps, CheckboxSize } from './atoms/Checkbox'

export { Switch } from './atoms/Switch'
export type { SwitchProps, SwitchSize } from './atoms/Switch'

export { Badge } from './atoms/Badge'
export type { BadgeProps, BadgeVariant, BadgeSize, BadgeTone } from './atoms/Badge'

export { Spinner } from './atoms/Spinner'
export type { SpinnerProps, SpinnerSize, SpinnerTone } from './atoms/Spinner'

export { Radio } from './atoms/Radio'
export type { RadioProps, RadioSize } from './atoms/Radio'

export { Textarea } from './atoms/Textarea'
export type { TextareaProps, TextareaSize, TextareaVariant, TextareaResize } from './atoms/Textarea'

export { Avatar } from './atoms/Avatar'
export type { AvatarProps, AvatarSize, AvatarShape } from './atoms/Avatar'

export { Divider } from './atoms/Divider'
export type { DividerProps, DividerOrientation, DividerVariant } from './atoms/Divider'

export { Spacer } from './atoms/Spacer'
export type { SpacerProps, SpacerSize, SpacerAxis } from './atoms/Spacer'

export { Stack } from './atoms/Stack'
export type { StackProps, StackDirection, StackSpacing, StackAlign, StackJustify } from './atoms/Stack'

export { Skeleton } from './atoms/Skeleton'
export type { SkeletonProps, SkeletonVariant } from './atoms/Skeleton'

export { ContentLoader } from './atoms/ContentLoader'
export type { ContentLoaderProps, ContentLoaderVariant } from './atoms/ContentLoader'

export { Progress } from './atoms/Progress'
export type { ProgressProps, ProgressSize, ProgressTone } from './atoms/Progress'

export { Tag } from './atoms/Tag'
export type { TagProps, TagVariant, TagSize, TagTone } from './atoms/Tag'

export { Stepper } from './atoms/Stepper'
export type { StepperProps, StepperStep } from './atoms/Stepper'

export { Select } from './atoms/Select'
export type { SelectProps, SelectOption, SelectSize } from './atoms/Select'

// Molecules
export { TodoList } from './molecules/TodoList'
export type { TodoListProps, TodoItem, TodoStatus } from './molecules/TodoList'

export { Modal } from './molecules/Modal'
export type { ModalProps, ModalSize, ModalAction } from './molecules/Modal'

export { NotificationCard } from './molecules/NotificationCard'
export type { NotificationCardProps } from './molecules/NotificationCard'

export { EventCard } from './molecules/EventCard'
export type { EventCardProps } from './molecules/EventCard'

export { ProjectOverview } from './molecules/ProjectOverview'
export type {
  ProjectOverviewProps,
  ProjectStep,
  ProjectStepStatus,
  ProjectOverviewMetrics,
} from './molecules/ProjectOverview'

export { AISuggestion } from './molecules/AISuggestion'
export type { AISuggestionProps } from './molecules/AISuggestion'

export { SchedulingCard } from './molecules/SchedulingCard'
export type { SchedulingCardProps } from './molecules/SchedulingCard'

export { FileMediaLibrary } from './molecules/FileMediaLibrary'
export type { FileMediaLibraryProps } from './molecules/FileMediaLibrary'

export { UserProfileCard } from './molecules/UserProfileCard'
export type { UserProfileCardProps } from './molecules/UserProfileCard'
