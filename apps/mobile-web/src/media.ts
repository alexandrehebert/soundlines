import type { MediaAsset, MediaManifest } from '@soundlines/media/manifest'
import { PROJECT_SITE_URL } from '@soundlines/project-config'
import { useEffect, useState } from 'react'

const manifestUrl = new URL(
  import.meta.env.VITE_MEDIA_MANIFEST_URL || `${PROJECT_SITE_URL}/media/media-manifest.json`,
  window.location.href,
)

export function assetUrl(asset?: MediaAsset) {
  return asset ? new URL(asset.path, manifestUrl).href : undefined
}

export function useMedia() {
  const [attempt, setAttempt] = useState(0)
  const [manifest, setManifest] = useState<MediaManifest>()
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading')

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      controller.abort()
      setStatus('unavailable')
    }, 8_000)
    void (async () => {
      try {
        const response = await fetch(manifestUrl, { signal: controller.signal })
        if (!response.ok) throw new Error('Media manifest unavailable.')
        const result = await response.json() as MediaManifest
        if (result.version !== 1 || !result.instrumentArtwork || !result.genrePreviews) {
          throw new Error('Unsupported media manifest.')
        }
        setManifest(result)
        setStatus('ready')
      } catch {
        if (!controller.signal.aborted) setStatus('unavailable')
      } finally {
        window.clearTimeout(timeout)
      }
    })()
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [attempt])

  return {
    manifest,
    status,
    retry() {
      setStatus('loading')
      setAttempt((previous) => previous + 1)
    },
  }
}
