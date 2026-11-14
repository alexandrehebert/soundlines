import { OpenDataGraph } from '../../../../src/design-system/open-data/OpenDataGraph.tsx'
import { generateOpenDataMetadata, type OpenDataPageProps } from '../../../../src/i18n/openDataPage.ts'

export function generateMetadata(props: OpenDataPageProps) {
  return generateOpenDataMetadata(props, 'graph')
}

export default function GraphPage() {
  return <OpenDataGraph />
}
