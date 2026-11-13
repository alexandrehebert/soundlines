import { ContributionPage } from '../../../../src/components/ContributionPage.tsx'
import { generateOpenDataMetadata, openDataLocale, type OpenDataPageProps } from '../../../../src/i18n/openDataPage.ts'

export function generateMetadata(props: OpenDataPageProps) {
  return generateOpenDataMetadata(props, 'contribute')
}

export default async function ContributePage(props: OpenDataPageProps) {
  const locale = await openDataLocale(props)
  return <ContributionPage locale={locale} />
}
