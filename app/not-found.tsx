import { ErrorFallback } from '@/shared/ui'

export default function NotFound() {
  return (
    <ErrorFallback
      title="Page not found"
      message="The page you are looking for does not exist or may have been moved."
      homeHref="/"
      homeLabel="Go to home"
    />
  )
}
