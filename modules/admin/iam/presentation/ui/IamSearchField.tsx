'use client'

import { Input } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { InputProps } from '@/shared/ui'

type IamSearchFieldProps = Omit<InputProps, 'size' | 'label'>

export function IamSearchField({ className, ...props }: IamSearchFieldProps) {
  return (
    <div className={cn('w-44 shrink-0', className)}>
      <Input fullWidth {...props} />
    </div>
  )
}
