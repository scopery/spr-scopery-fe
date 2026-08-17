import { cn } from '@/utils/cn'

export function FieldGroupHeading({
  code,
  title,
  subtitle,
  className,
}: {
  code?: string | null
  title: string
  subtitle?: string | null
  className?: string
}) {
  return (
    <span className={cn('block min-w-0', className)}>
      {code ? (
        <span className="block truncate text-[11px] font-normal leading-4 text-neutral-400">
          {code}
        </span>
      ) : null}
      <span className="block truncate text-sm font-medium leading-5 text-neutral-900">{title}</span>
      {subtitle ? (
        <span className="block truncate text-[11px] font-normal leading-4 text-neutral-500">
          {subtitle}
        </span>
      ) : null}
    </span>
  )
}
