export interface MediaAsset {
  path: string
  contentType: string
  bytes: number
}

export type InstrumentArtworkVariant = 'icon' | 'avatar' | 'banner' | 'header'

export interface MediaManifest {
  version: 1
  instrumentArtwork: Record<string, Partial<Record<InstrumentArtworkVariant, MediaAsset>>>
  genrePreviews: Record<string, MediaAsset>
  loops: Record<string, MediaAsset>
}
