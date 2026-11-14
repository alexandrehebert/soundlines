import { OpenDataChangelog } from '../../../../src/components/open-data/OpenDataChangelog.tsx'
import { generateOpenDataMetadata, openDataLocale, type OpenDataPageProps } from '../../../../src/i18n/openDataPage.ts'

export function generateMetadata(props: OpenDataPageProps) {
  return generateOpenDataMetadata(props, 'changelog')
}

export default async function ChangelogPage(props: OpenDataPageProps) {
  const locale = await openDataLocale(props)
  return <OpenDataChangelog locale={locale} />
}
