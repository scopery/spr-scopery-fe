export type { PersonIdentity, UserIdentityIdMode } from './domain/model/person-identity'
export {
  formatPersonLabel,
  mapIamUserToPerson,
  personInitials,
  shortUserId,
} from './domain/rules/person-identity.rules'
export { useResolveUsers } from './presentation/hooks/useResolveUsers'
export { UserIdentity } from './presentation/ui/UserIdentity'
export type { UserIdentityProps } from './presentation/ui/UserIdentity'
export { UserSearchSelect } from './presentation/ui/UserSearchSelect'
export { UserPickerModal } from './presentation/ui/UserPickerModal'
export type { UserPickerModalProps } from './presentation/ui/UserPickerModal'
export { PersonReferenceSelect } from './presentation/ui/PersonReferenceSelect'
export type {
  PersonReferenceOption,
  PersonReferenceSelectProps,
} from './presentation/ui/PersonReferenceSelect'
