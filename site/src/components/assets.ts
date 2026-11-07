import favicon from '../../../public/favicon.svg?url'
import thereminBanner from '../../../public/instrument-banners/theremin.svg?url'
import timbalesBanner from '../../../public/instrument-banners/timbales.svg?url'
import tr808Banner from '../../../public/instrument-banners/tr-808.svg?url'
import thereminIcon from '../../../public/instrument-icons/theremin.svg?url'
import timbalesIcon from '../../../public/instrument-icons/timbales.svg?url'
import tr808Icon from '../../../public/instrument-icons/tr-808.svg?url'
import type { Locale } from '../content.ts'

export { favicon }

/** Artwork shown on the artwork page; these files are produced by the app's artwork pipeline. */
export const instruments: { slug: string; name: Record<Locale, string>; banner: string; icon: string }[] = [
  { slug: 'theremin', name: { en: 'Theremin', fr: 'Thérémine' }, banner: thereminBanner, icon: thereminIcon },
  { slug: 'tr-808', name: { en: 'TR-808', fr: 'TR-808' }, banner: tr808Banner, icon: tr808Icon },
  { slug: 'timbales', name: { en: 'Timbales', fr: 'Timbales' }, banner: timbalesBanner, icon: timbalesIcon },
]
