import { redirect } from 'next/navigation'
import { localizePath } from '../../../src/i18n/routing.ts'
import { openDataLocale, type OpenDataPageProps } from '../../../src/i18n/openDataPage.ts'
import { openDataPath } from '../../../src/openData.ts'

export default async function DataPage(props: OpenDataPageProps) {
  const locale = await openDataLocale(props)
  redirect(localizePath(openDataPath('dataset'), locale))
}
