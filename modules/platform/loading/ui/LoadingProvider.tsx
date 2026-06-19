'use client'

import { GlobalLoadingBar } from './GlobalLoadingBar'

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalLoadingBar />
      {children}
    </>
  )
}
