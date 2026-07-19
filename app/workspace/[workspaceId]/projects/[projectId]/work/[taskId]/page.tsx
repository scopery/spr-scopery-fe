'use client'

import { useParams } from 'next/navigation'
import { ProjectWorkItemsView } from '@/modules/projects/task/presentation/ui/ProjectWorkItemsView'

export default function ProjectWorkTaskPage() {
  const params = useParams<{ taskId: string }>()
  return <ProjectWorkItemsView taskId={params.taskId} />
}
