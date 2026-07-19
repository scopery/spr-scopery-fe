import { redirect } from 'next/navigation'

export default function ProjectIndexPage({
  params,
}: {
  params: { workspaceId: string; projectId: string }
}) {
  redirect(`/workspace/${params.workspaceId}/projects/${params.projectId}/overview`)
}
