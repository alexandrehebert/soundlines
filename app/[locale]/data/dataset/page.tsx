import { OpenDataDataset } from '../../../../src/components/open-data/OpenDataDataset.tsx'
import { generateOpenDataMetadata, openDataLocale, type OpenDataPageProps } from '../../../../src/i18n/openDataPage.ts'

export function generateMetadata(props: OpenDataPageProps) {
  return generateOpenDataMetadata(props, 'dataset')
}

export default async function DatasetPage(props: OpenDataPageProps) {
  await openDataLocale(props)
  return <OpenDataDataset />
}
