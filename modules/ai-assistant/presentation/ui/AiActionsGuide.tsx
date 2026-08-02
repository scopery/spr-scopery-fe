'use client'

import { X } from 'lucide-react'
import { Typography } from '@/shared/ui'

export const AI_ACTIONS = [
  { badge: 'Task', label: 'Create task', example: 'Tạo task cho tính năng đăng nhập' },
  { badge: 'Task', label: 'Update task status', example: 'Đánh dấu task X là Done' },
  { badge: 'FR', label: 'Create functional item', example: 'Tạo functional item cho màn hình dashboard' },
  { badge: 'NFR', label: 'Create NFR', example: 'Tạo NFR về hiệu năng hệ thống' },
  { badge: 'REQ', label: 'Create requirement', example: 'Tạo requirement cho luồng thanh toán' },
  { badge: 'Scope', label: 'Create scope item', example: 'Thêm scope item mới vào dự án' },
  { badge: 'Screen', label: 'Create screen', example: 'Tạo screen cho trang cài đặt' },
  { badge: 'API', label: 'Create API endpoint', example: 'Tạo endpoint POST /api/orders' },
  { badge: 'Module', label: 'Create module', example: 'Tạo module Quản lý người dùng' },
  { badge: 'Entity', label: 'Create data entity', example: 'Tạo data entity cho bảng Order' },
  { badge: 'Comp', label: 'Create component', example: 'Tạo component Header' },
  { badge: 'Plan', label: 'Create planning element', example: 'Phân rã công việc thành planning element' },
  { badge: 'Phase', label: 'Create project phase', example: 'Tạo phase Sprint 1' },
]

export function AiActionsGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute bottom-full left-0 z-50 mb-2 w-80 border border-neutral-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
        <Typography variant="small" weight="semibold">What AI can do</Typography>
        <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
          <X size={14} />
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-neutral-50">
        {AI_ACTIONS.map((a) => (
          <div key={a.label} className="flex items-start gap-2 px-3 py-2">
            <span className="mt-0.5 shrink-0 inline-flex items-center bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 w-12 justify-center">
              {a.badge}
            </span>
            <div className="min-w-0">
              <Typography variant="small" weight="medium">{a.label}</Typography>
              <Typography variant="caption" tone="muted" className="truncate">{a.example}</Typography>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
