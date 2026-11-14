import { OpenDataGraph } from '../../../../src/components/open-data/OpenDataGraph.tsx'
import { generateOpenDataMetadata, openDataLocale, type OpenDataPageProps } from '../../../../src/i18n/openDataPage.ts'

export function generateMetadata(props: OpenDataPageProps) {
  return generateOpenDataMetadata(props, 'graph')
}

export default async function GraphPage(props: OpenDataPageProps) {
  const locale = await openDataLocale(props)
  return <OpenDataGraph locale={locale} />
}
