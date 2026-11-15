import { cpSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { mediaDirectory } from './source.ts'
import type { InstrumentArtworkVariant, MediaAsset, MediaManifest } from './manifest.ts'

const artworkVariants: Record<InstrumentArtworkVariant, string> = {
  icon: 'instrument-icons',
  avatar: 'instrument-avatars',
  banner: 'instrument-banners',
  header: 'instrument-header-backgrounds',
}
const variants = Object.keys(artworkVariants) as InstrumentArtworkVariant[]

const publicEntries = [
  ...Object.values(artworkVariants),
  'genre-previews', 'genre-samples', 'loops', 'favicon.svg', 'favicon-light.svg',
]

function listMedia(directory: string, extension: string, contentType: string): (MediaAsset & { slug: string })[] {
  const folder = join(mediaDirectory, directory)
  return readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map(({ name }) => name)
    .sort()
    .map((name) => ({
      slug: decodeURIComponent(name.slice(0, -extension.length)),
      path: `${directory}/${name}`,
      contentType,
      bytes: statSync(join(folder, name)).size,
    }))
}

function manifest(): MediaManifest {
  const instrumentArtwork: MediaManifest['instrumentArtwork'] = {}
  for (const variant of variants) {
    for (const { slug, ...asset } of listMedia(artworkVariants[variant], '.svg', 'image/svg+xml')) {
      const artwork = instrumentArtwork[`instrument:${slug}`] ??= {}
      artwork[variant] = asset
    }
  }
  return {
    version: 1,
    instrumentArtwork,
    genrePreviews: Object.fromEntries(listMedia('genre-previews', '.m4a', 'audio/mp4')
      .map(({ slug, ...asset }) => [`genre:${slug}`, asset])),
    loops: Object.fromEntries(listMedia('loops', '.wav', 'audio/wav')
      .map(({ slug, ...asset }) => [slug, asset])),
  }
}

export function publishMedia(destination: string) {
  if (resolve(destination) === mediaDirectory) throw new Error('Choose a publication directory outside the source media directory.')
  const index = manifest()
  mkdirSync(destination, { recursive: true })
  for (const entry of publicEntries) {
    const target = join(destination, entry)
    rmSync(target, { force: true, recursive: true })
    cpSync(join(mediaDirectory, entry), target, {
      recursive: true,
      filter: (source) => basename(source) !== '.DS_Store',
    })
  }
  writeFileSync(join(destination, 'media-manifest.json'), `${JSON.stringify(index)}\n`)
}
