import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Job Agent',
  description: 'Evidence-grounded AI job matching and application agent',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
