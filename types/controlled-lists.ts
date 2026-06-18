/**
 * Controlled lists and values — type-only for now (no API integration yet).
 * These types mirror the FE-8 spec and are ready for future BE wiring.
 */

export interface ControlledList {
  id: string
  /** Optional scope — project or org; depends on BE implementation. */
  project_id?: string
  org_id?: string
  list_key: string
  name?: string
  description?: string
  /** Some APIs may use locked or is_locked; we support both. */
  locked?: boolean
  is_locked?: boolean
  created_at?: string
  updated_at?: string
}

export interface ControlledValue {
  id: string
  list_id: string
  value_key: string
  label: string
  description?: string
  sort_order?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateListPayload {
  list_key: string
  name?: string
  description?: string
  locked?: boolean
  is_locked?: boolean
}

export interface UpdateListPatch {
  name?: string
  description?: string
  locked?: boolean
  is_locked?: boolean
}

export interface CreateValuePayload {
  value_key: string
  label: string
  description?: string
  sort_order?: number
  is_active?: boolean
}

export interface UpdateValuePatch {
  label?: string
  description?: string
  sort_order?: number
  is_active?: boolean
}

