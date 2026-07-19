import { redirect } from 'next/navigation'

export default function AdminIamAccessControlRedirectPage() {
  redirect('/admin/iam/grants/new')
}
