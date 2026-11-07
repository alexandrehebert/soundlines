import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ACE Monitor',
  description: 'Read-only dashboard for the local ACE-Step rendering server',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
