export { ScopeRegisterView } from './presentation/ui/ScopeRegisterView'
export { useScopeRegister } from './presentation/hooks/useScopeRegister'
export { useScopePackageRequirements } from './presentation/hooks/useScopePackageRequirements'
export * as scopeApi from './infrastructure/api/scope.api'
export type {
  ScopePackage,
  ScopeItem,
  ScopePackageRequirement,
  CreateScopePackagePayload,
  CreateScopeItemPayload,
  UpdateScopeItemPayload,
} from './domain/model/scope'
export { ScopePackageStatus, ScopeItemType, ScopeItemPriority } from './domain/enums/scope.enum'
