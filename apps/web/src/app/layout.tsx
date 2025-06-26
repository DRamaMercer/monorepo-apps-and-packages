import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Multi-Brand AI Agent System',
  description: 'Cline-Powered Multi-Brand AI Agent System Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
