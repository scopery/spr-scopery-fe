'use client'

import { useState } from 'react'
import { Typography } from '@/shared/ui'
import { DeliveriesTab } from './DeliveriesTab'
import { OutboxTab } from './OutboxTab'
import { SuppressionsTab } from './SuppressionsTab'

type Tab = 'deliveries' | 'outbox' | 'suppressions'

const TABS: { id: Tab; label: string }[] = [
  { id: 'deliveries', label: 'Deliveries' },
  { id: 'outbox', label: 'Outbox' },
  { id: 'suppressions', label: 'Suppressions' },
]

export function DeliveryOperationsView() {
  const [activeTab, setActiveTab] = useState<Tab>('deliveries')

  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">Delivery Operations</Typography>
      </div>

      <div className="mb-4 flex gap-1 border-b border-neutral-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-neutral-500 hover:text-neutral-800',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'deliveries' && <DeliveriesTab />}
      {activeTab === 'outbox' && <OutboxTab />}
      {activeTab === 'suppressions' && <SuppressionsTab />}
    </div>
  )
}
