'use client'

import { Badge, DataTable, Typography, type DataTableColumn } from '@/shared/ui'
import {
  RISK_MATRIX_IMPACT_LEVELS,
  RISK_MATRIX_PROBABILITY_LEVELS,
  filterRiskItems,
  getRiskMatrixCellItems,
  raidRiskImpactLabel,
  raidRiskProbabilityLabel,
  riskMatrixCellTone,
} from '../../domain/rules/raid.rules'
import type { RaidItem } from '../../domain/model/raid'

interface RaidRiskMatrixViewProps {
  items: RaidItem[]
}

export function RaidRiskMatrixView({ items }: RaidRiskMatrixViewProps) {
  const riskItems = filterRiskItems(items)

  return (
    <div>
      <Typography variant="small" tone="muted" className="mb-4">
        Open risks plotted by probability (rows) × impact (columns). Only items of type Risk are
        shown.
      </Typography>

      {riskItems.length === 0 ? (
        <div className="border border-neutral-200 bg-white p-8 text-center">
          <Typography variant="small" tone="muted">
            No risk items to plot yet
          </Typography>
        </div>
      ) : (
        <DataTable
          ariaLabel="RAID risk matrix"
          rows={[...RISK_MATRIX_PROBABILITY_LEVELS]}
          rowKey={(probability) => probability}
          tableClassName="min-w-[560px]"
          columns={[
            {
              id: 'probability',
              header: 'Probability',
              width: '8rem',
              accessor: (probability) => raidRiskProbabilityLabel(probability),
              cellClassName: 'font-medium text-neutral-600',
            },
            ...RISK_MATRIX_IMPACT_LEVELS.map(
              (impact): DataTableColumn<(typeof RISK_MATRIX_PROBABILITY_LEVELS)[number]> => ({
                id: impact,
                header: `Impact: ${raidRiskImpactLabel(impact)}`,
                align: 'center',
                cellClassName: 'align-top',
                cell: (probability) => {
                  const cellItems = getRiskMatrixCellItems(riskItems, probability, impact)
                  const tone = riskMatrixCellTone(probability, impact)
                  return (
                    <div className="min-h-16 space-y-1.5 text-left">
                      {cellItems.length === 0
                        ? '—'
                        : cellItems.map((item) => (
                            <div key={item.id} className="flex items-start gap-1.5">
                              <Badge tone={tone} size="sm">
                                {item.code}
                              </Badge>
                              <Typography variant="small" className="leading-5">
                                {item.title}
                              </Typography>
                            </div>
                          ))}
                    </div>
                  )
                },
              })
            ),
          ]}
        />
      )}
    </div>
  )
}
