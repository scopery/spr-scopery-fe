import type { Metadata } from 'next'
import { Questrial } from 'next/font/google'
import { Providers } from './Providers'
import './globals.css'

const questrial = Questrial({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-questrial',
})

export const metadata: Metadata = {
  title: 'Scopery',
  description: 'Token-first, accessible UI component library',
  icons: {
    icon: '/scopery_logo.svg',
    shortcut: '/scopery_logo.svg',
    apple: '/scopery_logo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={questrial.variable} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
