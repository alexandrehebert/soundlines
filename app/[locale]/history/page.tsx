import { ensureCanonicalPage, generateLocalizedMetadata, type LocalizedPageProps } from '../../../src/i18n/routePage.ts'

export function generateMetadata(props: LocalizedPageProps) {
  return generateLocalizedMetadata(props, 'history')
}

export default async function HistoryPage(props: LocalizedPageProps) {
  await ensureCanonicalPage(props, 'history')
  return null
}
