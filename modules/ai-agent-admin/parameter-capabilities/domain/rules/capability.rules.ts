import type { ParameterValueType, SupportStatus } from '../enums/capability.enum'
import { ParameterValueType as ValueType, SupportStatus as Support } from '../enums/capability.enum'

export function validateNumericRange(
  valueType: ParameterValueType | null | undefined,
  minValue: string | null | undefined,
  defaultValue: string | null | undefined,
  maxValue: string | null | undefined
): string | null {
  if (valueType !== ValueType.Number && valueType !== ValueType.Integer) return null
  const nums = [minValue, defaultValue, maxValue].map((v) => {
    if (v == null || v.trim() === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : NaN
  })
  if (nums.some((n) => n !== null && Number.isNaN(n))) {
    return 'Min / default / max must be valid numbers'
  }
  const [min, def, max] = nums
  if (min != null && max != null && min > max) return 'Min must be ≤ max'
  if (min != null && def != null && def < min) return 'Default must be ≥ min'
  if (max != null && def != null && def > max) return 'Default must be ≤ max'
  return null
}

export function requiresConditionDescription(supportStatus: SupportStatus): boolean {
  return supportStatus === Support.Conditional
}
