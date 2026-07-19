export interface PortalProject {
  id: string
  name: string
  status: string
}

export interface PortalReview {
  id: string
  projectId: string
  title: string
  status: string
}

export interface PortalSupportCase {
  id: string
  projectId: string
  title: string
  status: string
}
