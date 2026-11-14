import { OpenDataQuery } from '../../../../src/components/open-data/OpenDataQuery.tsx'
import { generateOpenDataMetadata, openDataLocale, type OpenDataPageProps } from '../../../../src/i18n/openDataPage.ts'

export function generateMetadata(props: OpenDataPageProps) {
  return generateOpenDataMetadata(props, 'query')
}

export default async function QueryPage(props: OpenDataPageProps) {
  const locale = await openDataLocale(props)
  return <OpenDataQuery locale={locale} />
}
