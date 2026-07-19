'use client'

import { Badge, Typography } from '@/shared/ui'
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="w-32 border border-neutral-200 bg-neutral-50 p-2" />
                {RISK_MATRIX_IMPACT_LEVELS.map((impact) => (
                  <th
                    key={impact}
                    className="border border-neutral-200 bg-neutral-50 p-2 text-center font-medium text-neutral-600"
                  >
                    Impact: {raidRiskImpactLabel(impact)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RISK_MATRIX_PROBABILITY_LEVELS.map((probability) => (
                <tr key={probability}>
                  <th className="border border-neutral-200 bg-neutral-50 p-2 text-left font-medium text-neutral-600">
                    Probability: {raidRiskProbabilityLabel(probability)}
                  </th>
                  {RISK_MATRIX_IMPACT_LEVELS.map((impact) => {
                    const cellItems = getRiskMatrixCellItems(riskItems, probability, impact)
                    const tone = riskMatrixCellTone(probability, impact)
                    return (
                      <td key={impact} className="border border-neutral-200 p-2 align-top">
                        <div className="min-h-16 space-y-1.5">
                          {cellItems.length === 0 ? (
                            <Typography as="span" variant="small" tone="muted">
                              —
                            </Typography>
                          ) : (
                            cellItems.map((item) => (
                              <div key={item.id} className="flex items-start gap-1.5">
                                <Badge tone={tone} size="sm">
                                  {item.code}
                                </Badge>
                                <Typography variant="small" className="leading-5">
                                  {item.title}
                                </Typography>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
