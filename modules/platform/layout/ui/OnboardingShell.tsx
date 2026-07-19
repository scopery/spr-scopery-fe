import Image from 'next/image'

/** Matches Figma inset for the vertical guide line (px). */
const LINE_INSET = 54

/** Space from viewport bottom — keeps pattern visible on shorter screens. */
const BOTTOM_OFFSET = 54

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white">
      {/* Horizontal line — pinned to viewport bottom only */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 z-0 bg-neutral-500"
        style={{ top: 'auto', bottom: BOTTOM_OFFSET, height: 2 }}
      />
      {/* Vertical line — full viewport height */}
      <div
        aria-hidden
        className="pointer-events-none fixed z-0 bg-neutral-300"
        style={{ top: 0, bottom: 0, left: LINE_INSET, width: 2 }}
      />
      <Image
        src="/illustrations/corner_pattern.svg"
        alt=""
        width={314}
        height={314}
        priority
        aria-hidden
        className="pointer-events-none fixed z-0 h-[min(314px,42vw)] w-[min(314px,42vw)] max-sm:h-[min(204px,52vw)] max-sm:w-[min(204px,52vw)]"
        style={{ left: LINE_INSET, bottom: BOTTOM_OFFSET }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
