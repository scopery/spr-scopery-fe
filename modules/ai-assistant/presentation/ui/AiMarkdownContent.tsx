'use client'

import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/utils/cn'

interface AiMarkdownContentProps {
  content: string
  className?: string
  /** Streaming caret after the last text node */
  trailing?: ReactNode
}

export function AiMarkdownContent({ content, className, trailing }: AiMarkdownContentProps) {
  if (!content.trim()) return null

  return (
    <div
      className={cn(
        'ai-md text-[15px] leading-[1.65] text-neutral-900',
        '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        '[&_p]:my-2.5',
        '[&_strong]:font-semibold [&_strong]:text-neutral-900',
        '[&_em]:italic',
        '[&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5',
        '[&_ol]:my-2.5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5',
        '[&_li]:pl-0.5',
        '[&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-lg [&_h1]:font-semibold',
        '[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold',
        '[&_h3]:mb-1.5 [&_h3]:mt-2.5 [&_h3]:text-[15px] [&_h3]:font-semibold',
        '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
        '[&_blockquote]:my-2.5 [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-600',
        '[&_hr]:my-3 [&_hr]:border-neutral-200',
        '[&_code]:bg-neutral-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]',
        '[&_pre]:my-2.5 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-neutral-200 [&_pre]:bg-neutral-50 [&_pre]:p-3',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
        '[&_table]:my-2.5 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm',
        '[&_th]:border [&_th]:border-neutral-200 [&_th]:bg-neutral-50 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left',
        '[&_td]:border [&_td]:border-neutral-200 [&_td]:px-2 [&_td]:py-1.5',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {trailing}
    </div>
  )
}
