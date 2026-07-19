import { RaidActionStatus } from '../enums/raid-action.enum'
import type { RaidAction } from '../model/raid-action'

export function canCompleteRaidAction(action: RaidAction): boolean {
  return action.status === RaidActionStatus.Open || action.status === RaidActionStatus.InProgress
}

export function canCancelRaidAction(action: RaidAction): boolean {
  return action.status === RaidActionStatus.Open || action.status === RaidActionStatus.InProgress
}

export function raidActionStatusLabel(status: string): string {
  switch (status) {
    case RaidActionStatus.Open: return 'Open'
    case RaidActionStatus.InProgress: return 'In progress'
    case RaidActionStatus.Complete: return 'Complete'
    case RaidActionStatus.Cancelled: return 'Cancelled'
    default: return status
  }
}
