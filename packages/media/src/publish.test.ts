import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { publishMedia } from './publish.ts'
import { mediaDirectory } from './source.ts'

it('publishes a usable catalogue index and refreshes shared files alongside app files', () => {
  const output = mkdtempSync(join(tmpdir(), 'soundlines-media-'))
  try {
    mkdirSync(join(output, 'genre-previews'))
    writeFileSync(join(output, 'genre-previews/retired.m4a'), '')
    writeFileSync(join(output, 'app-only.json'), '{}')

    publishMedia(output)

    const manifest = JSON.parse(readFileSync(join(output, 'media-manifest.json'), 'utf8'))
    expect(manifest.version).toBe(1)
    const { path, contentType, bytes } = manifest.genrePreviews['genre:disco']
    expect({ path, contentType }).toEqual({ path: 'genre-previews/disco.m4a', contentType: 'audio/mp4' })
    const preview = readFileSync(join(output, path))
    expect(preview.byteLength).toBe(bytes)
    expect(preview.equals(readFileSync(join(mediaDirectory, path)))).toBe(true)
    expect(Object.keys(manifest.instrumentArtwork['instrument:saxophone']).sort())
      .toEqual(['avatar', 'banner', 'header', 'icon'])
    expect(manifest.loops['turntable-hip-hop'].path).toBe('loops/turntable-hip-hop.wav')
    expect(existsSync(join(output, 'genre-previews/retired.m4a'))).toBe(false)
    expect(readFileSync(join(output, 'app-only.json'), 'utf8')).toBe('{}')
  } finally {
    rmSync(output, { recursive: true, force: true })
  }
})
