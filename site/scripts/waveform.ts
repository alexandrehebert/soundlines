import { readFileSync } from 'node:fs'

/** Peak amplitudes (0-1) of a 16-bit PCM WAV file, in `buckets` equal slices, for drawing its real waveform. */
export function wavPeaks(path: string, buckets = 120): number[] {
  if (!Number.isInteger(buckets) || buckets < 1) throw new Error(`${path}: expected a positive bucket count`)
  const file = readFileSync(path)
  if (file.length < 12 || file.toString('ascii', 0, 4) !== 'RIFF' || file.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`${path}: expected a RIFF WAV file`)
  }
  let offset = 12
  let channels: number | undefined
  while (offset <= file.length - 8) {
    const id = file.toString('ascii', offset, offset + 4)
    const size = file.readUInt32LE(offset + 4)
    if (offset + 8 + size > file.length) throw new Error(`${path}: truncated ${id} chunk`)
    if (id === 'fmt ') {
      if (size < 16 || file.readUInt16LE(offset + 8) !== 1 || file.readUInt16LE(offset + 22) !== 16) {
        throw new Error(`${path}: expected 16-bit PCM`)
      }
      channels = file.readUInt16LE(offset + 10)
      if (channels < 1) throw new Error(`${path}: expected at least one audio channel`)
    }
    if (id === 'data') {
      if (channels === undefined) throw new Error(`${path}: missing fmt chunk`)
      const channelCount = channels
      if (size % (2 * channelCount) !== 0) throw new Error(`${path}: incomplete PCM frame`)
      const frames = size / (2 * channelCount)
      const peaks = Array.from({ length: buckets }, (_, bucket) => {
        let peak = 0
        const start = Math.floor(bucket * frames / buckets)
        const end = Math.floor((bucket + 1) * frames / buckets)
        for (let frame = start; frame < end; frame++) {
          for (let channel = 0; channel < channelCount; channel++) {
            peak = Math.max(peak, Math.abs(file.readInt16LE(offset + 8 + (frame * channelCount + channel) * 2)))
          }
        }
        return peak
      })
      const max = Math.max(...peaks) || 1
      return peaks.map((peak) => Math.round((peak / max) * 100) / 100)
    }
    offset += 8 + size + (size % 2)
  }
  throw new Error(`${path}: no data chunk`)
}
