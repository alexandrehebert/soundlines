'use client'

import { usePathname } from 'next/navigation'
import { Home } from './components/home/Home.tsx'
import { Explorer } from './Explorer.tsx'
import { useExplorer } from './ExplorerContext.ts'
import { isJukeboxPath } from './explorerLocation.ts'
import { isOpenDataPath } from './openData.ts'

export default function App() {
  const { isHome } = useExplorer()
  const pathname = usePathname()
  if (isOpenDataPath(pathname) || isJukeboxPath(pathname)) return null
  return isHome ? <Home /> : <Explorer />
}
