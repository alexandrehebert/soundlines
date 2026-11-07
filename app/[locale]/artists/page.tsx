import App from '../../../src/App.tsx'
import { ensureCanonicalPage, generateLocalizedMetadata, type LocalizedPageProps } from '../../../src/i18n/routePage.ts'

export function generateMetadata(props: LocalizedPageProps) {
  return generateLocalizedMetadata(props, 'artists')
}

export default async function ArtistsPage(props: LocalizedPageProps) {
  await ensureCanonicalPage(props, 'artists')
  return <App />
}
