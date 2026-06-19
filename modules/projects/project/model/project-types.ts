/**
 * Project types for hooks and controlled lists
 */
export interface Project {
  id: string
  org_id: string
  name: string
  description: string | null
  status: string
  created_by: string
  created_at: string
  my_role: 'editor' | 'viewer'
}
