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

export { Card } from './atoms/Card'
export type { CardProps } from './atoms/Card'

export { Input } from './atoms/Input'
export type { InputProps, InputSize, InputVariant, InputState } from './atoms/Input'

export { Checkbox } from './atoms/Checkbox'
export type { CheckboxProps, CheckboxSize } from './atoms/Checkbox'

export { Switch } from './atoms/Switch'
export type { SwitchProps, SwitchSize } from './atoms/Switch'

export { Badge } from './atoms/Badge'
export type { BadgeProps, BadgeVariant, BadgeSize, BadgeTone } from './atoms/Badge'

export { Filter } from './molecules/Filter'
export type { FilterProps, FilterOption } from './molecules/Filter'

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
export type {
  StackProps,
  StackDirection,
  StackSpacing,
  StackAlign,
  StackJustify,
} from './atoms/Stack'

export { Skeleton } from './atoms/Skeleton'
export type { SkeletonProps, SkeletonVariant } from './atoms/Skeleton'

export { PageSkeleton } from './molecules/PageSkeleton'
export type { PageSkeletonProps, PageSkeletonVariant } from './molecules/PageSkeleton'

export { ContentLoader } from './atoms/ContentLoader'
export type { ContentLoaderProps, ContentLoaderVariant } from './atoms/ContentLoader'

export { Progress } from './atoms/Progress'
export type { ProgressProps, ProgressSize, ProgressTone } from './atoms/Progress'

export { Tag } from './atoms/Tag'
export type { TagProps, TagVariant, TagSize, TagTone } from './atoms/Tag'

export { Stepper, StepperHexagon } from './atoms/Stepper'
export type { StepperProps, StepperStep } from './atoms/Stepper'

export { Select } from './atoms/Select'
export type { SelectProps, SelectOption, SelectSize } from './atoms/Select'

export { SearchableSelect } from './atoms/SearchableSelect'

export { CurrencyAmount } from './atoms/CurrencyAmount'
export type { CurrencyAmountProps, CurrencyAmountSize } from './atoms/CurrencyAmount'

export { SensitiveFinancialValue, SensitiveFinancialState } from './atoms/SensitiveFinancialValue'
export type {
  SensitiveFinancialValueProps,
  SensitiveFinancialStateType,
} from './atoms/SensitiveFinancialValue'

// Molecules
export { TodoList } from './molecules/TodoList'
export type { TodoListProps, TodoItem, TodoStatus } from './molecules/TodoList'

export { Modal } from './molecules/Modal'
export type { ModalProps, ModalSize, ModalAction } from './molecules/Modal'

export { DetailDrawer } from './molecules/DetailDrawer'
export type { DetailDrawerProps } from './molecules/DetailDrawer'

export { DataTable } from './molecules/DataTable'
export type {
  DataTableAlign,
  DataTableCellKind,
  DataTableColumn,
  DataTableProps,
  DataTableSort,
  DataTableSortDirection,
} from './molecules/DataTable'

export { ConfirmDialog } from './molecules/ConfirmDialog'
export type { ConfirmDialogProps } from './molecules/ConfirmDialog'

export { ErrorFallback } from './molecules/ErrorFallback'
export type { ErrorFallbackProps } from './molecules/ErrorFallback'

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

export { FinancialKpiStrip } from './molecules/FinancialKpiStrip'
export type {
  FinancialKpiStripProps,
  FinancialKpiItem,
  FinancialKpiStripMode,
} from './molecules/FinancialKpiStrip'

export { VersionRail } from './molecules/VersionRail'
export type {
  VersionRailProps,
  VersionRailItem,
  VersionRailItemStatus,
} from './molecules/VersionRail'

export { LifecycleTimeline, LifecycleStepState } from './molecules/LifecycleTimeline'
export type {
  LifecycleTimelineProps,
  LifecycleTimelineStep,
  LifecycleStepStateType,
} from './molecules/LifecycleTimeline'

export { LongRunningJobState, LongRunningJobStatus } from './molecules/LongRunningJobState'
export type {
  LongRunningJobStateProps,
  LongRunningJobStatusType,
} from './molecules/LongRunningJobState'

export { LongRunningJobPanel } from './molecules/LongRunningJobPanel'
export type { LongRunningJobPanelProps } from './molecules/LongRunningJobPanel'

export { ClassificationBadge, ClassificationLevel } from './atoms/ClassificationBadge'
export type {
  ClassificationBadgeProps,
  ClassificationLevelType,
} from './atoms/ClassificationBadge'

export { MaskedValue } from './atoms/MaskedValue'
export type { MaskedValueProps } from './atoms/MaskedValue'

export { PermissionAwareAction, PermissionActionState } from './molecules/PermissionAwareAction'
export type {
  PermissionAwareActionProps,
  PermissionActionStateType,
} from './molecules/PermissionAwareAction'

export { GovernedObjectBadge } from './molecules/GovernedObjectBadge'
export type { GovernedObjectBadgeProps } from './molecules/GovernedObjectBadge'

export { BeforeAfterDiff } from './molecules/BeforeAfterDiff'
export type { BeforeAfterDiffProps, BeforeAfterDiffField } from './molecules/BeforeAfterDiff'

export { ClientVisibilityToggle } from './molecules/ClientVisibilityToggle'
export type { ClientVisibilityToggleProps } from './molecules/ClientVisibilityToggle'

export { JobResultSummary } from './molecules/JobResultSummary'
export type { JobResultSummaryProps } from './molecules/JobResultSummary'

export { EntityReferencePicker } from './molecules/EntityReferencePicker'
export type {
  EntityReferencePickerProps,
  EntityReferenceOption,
} from './molecules/EntityReferencePicker'
