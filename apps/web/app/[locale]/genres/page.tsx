import { ensureCanonicalPage, generateLocalizedMetadata, type LocalizedPageProps } from '../../../src/i18n/routePage.ts'

export function generateMetadata(props: LocalizedPageProps) {
  return generateLocalizedMetadata(props, 'genres')
}

export default async function GenresPage(props: LocalizedPageProps) {
  await ensureCanonicalPage(props, 'genres')
  return null
}
