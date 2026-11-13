import type { ReactNode } from 'react'
import { OpenDataPage } from '../../../src/components/OpenDataPage.tsx'
import { openDataLocale, type OpenDataPageProps } from '../../../src/i18n/openDataPage.ts'

export default async function DataLayout(props: OpenDataPageProps & { children: ReactNode }) {
  const locale = await openDataLocale(props)
  return <OpenDataPage locale={locale}>{props.children}</OpenDataPage>
}
