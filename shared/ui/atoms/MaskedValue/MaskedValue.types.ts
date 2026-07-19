export interface MaskedValueProps {
  /** Display when unmasked; never pass 0 as a stand-in for masked. */
  value?: string | null
  masked?: boolean
  /** Placeholder shown when masked (default ••••••). */
  maskLabel?: string
  className?: string
  onReveal?: () => void
}
