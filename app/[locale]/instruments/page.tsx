import App from '../../../src/App.tsx'
import { ensureCanonicalPage, generateLocalizedMetadata, type LocalizedPageProps } from '../../../src/i18n/routePage.ts'

export function generateMetadata(props: LocalizedPageProps) {
  return generateLocalizedMetadata(props, 'instruments')
}

export default async function InstrumentsPage(props: LocalizedPageProps) {
  await ensureCanonicalPage(props, 'instruments')
  return <App />
}
