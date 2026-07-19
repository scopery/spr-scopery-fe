export interface QualityPlan {
  id: string
  projectId: string
  title: string
  status: string
  createdAt?: string
}

export interface TestPlan {
  id: string
  projectId: string
  title: string
  status: string
}

export interface TestCase {
  id: string
  projectId: string
  code?: string
  title: string
  status: string
}

export interface TestRun {
  id: string
  projectId: string
  title: string
  status: string
}

export interface Defect {
  id: string
  projectId: string
  code?: string
  title: string
  status: string
  priority?: string
}

export interface ReleasePackage {
  id: string
  projectId: string
  title: string
  status: string
}

export interface Deployment {
  id: string
  projectId: string
  title: string
  status: string
}
