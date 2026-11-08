import favicon from '../../../public/favicon.svg?url'
import hipHopLoop from '../../../public/loops/turntable-hip-hop.wav?url'
import thereminBanner from '../../../public/instrument-banners/theremin.svg?url'
import timbalesBanner from '../../../public/instrument-banners/timbales.svg?url'
import tr808Banner from '../../../public/instrument-banners/tr-808.svg?url'
import thereminIcon from '../../../public/instrument-icons/theremin.svg?url'
import timbalesIcon from '../../../public/instrument-icons/timbales.svg?url'
import tr808Icon from '../../../public/instrument-icons/tr-808.svg?url'
import saxophoneAvatar from '../../../public/instrument-avatars/saxophone.svg?url'
import saxophoneBanner from '../../../public/instrument-banners/saxophone.svg?url'
import saxophoneHeader from '../../../public/instrument-header-backgrounds/saxophone.svg?url'
import saxophoneIcon from '../../../public/instrument-icons/saxophone.svg?url'
import artworkEn from '../assets/screens/artwork-en.jpg?url'
import artworkFr from '../assets/screens/artwork-fr.jpg?url'
import graphEn from '../assets/screens/graph-en.jpg?url'
import graphFr from '../assets/screens/graph-fr.jpg?url'
import homeEn from '../assets/screens/home-en.jpg?url'
import homeFr from '../assets/screens/home-fr.jpg?url'
import type { Locale } from '../content.ts'

export { favicon, hipHopLoop }

/** Artwork shown on the artwork page; these files are produced by the app's artwork pipeline. */
export const instruments: { slug: string; name: Record<Locale, string>; banner: string; icon: string }[] = [
  { slug: 'theremin', name: { en: 'Theremin', fr: 'Thérémine', de: 'Theremin', it: 'Theremin', es: 'Teremín' }, banner: thereminBanner, icon: thereminIcon },
  { slug: 'tr-808', name: { en: 'TR-808', fr: 'TR-808', de: 'TR-808', it: 'TR-808', es: 'TR-808' }, banner: tr808Banner, icon: tr808Icon },
  { slug: 'timbales', name: { en: 'Timbales', fr: 'Timbales', de: 'Timbales', it: 'Timbales', es: 'Timbales' }, banner: timbalesBanner, icon: timbalesIcon },
]

/** Repository path of an instrument's visual brief. */
export const instrumentBrief = (slug: string) => `docs/artwork/briefs/${slug}.json`

/** The instrument followed through the artwork workflow: its four exported files. */
export const saxophone = { icon: saxophoneIcon, banner: saxophoneBanner, avatar: saxophoneAvatar, header: saxophoneHeader }

/** Screenshots of the running app (1280×800, scaled to 960 px), shown as final results. */
export const screens: Record<'graph' | 'artwork' | 'home', Record<Locale, string>> = {
  graph: { en: graphEn, fr: graphFr, de: graphEn, it: graphEn, es: graphEn },
  artwork: { en: artworkEn, fr: artworkFr, de: artworkEn, it: artworkEn, es: artworkEn },
  home: { en: homeEn, fr: homeFr, de: homeEn, it: homeEn, es: homeEn },
}
