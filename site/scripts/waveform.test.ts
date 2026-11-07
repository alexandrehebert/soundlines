import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { wavPeaks } from './waveform.ts'

const directory = mkdtempSync(join(tmpdir(), 'soundlines-waveform-'))
afterAll(() => rmSync(directory, { recursive: true, force: true }))

function wave(samples: number[], channels = 1, format = 1, oddChunk = false) {
  const header = Buffer.alloc(12)
  header.write('RIFF')
  header.write('WAVE', 8)
  const fmt = Buffer.alloc(24)
  fmt.write('fmt ')
  fmt.writeUInt32LE(16, 4)
  fmt.writeUInt16LE(format, 8)
  fmt.writeUInt16LE(channels, 10)
  fmt.writeUInt32LE(48000, 12)
  fmt.writeUInt32LE(48000 * channels * 2, 16)
  fmt.writeUInt16LE(channels * 2, 20)
  fmt.writeUInt16LE(16, 22)
  const data = Buffer.alloc(8 + samples.length * 2)
  data.write('data')
  data.writeUInt32LE(samples.length * 2, 4)
  samples.forEach((sample, i) => data.writeInt16LE(sample, 8 + i * 2))
  const junk = oddChunk ? Buffer.from([74, 85, 78, 75, 1, 0, 0, 0, 42, 0]) : Buffer.alloc(0)
  const result = Buffer.concat([header, fmt, junk, data])
  result.writeUInt32LE(result.length - 8, 4)
  return result
}

function fixture(name: string, data: Buffer) {
  const path = join(directory, name)
  writeFileSync(path, data)
  return path
}

describe('WAV waveform peaks', () => {
  it('reads the peak of both channels in each slice', () => {
    const path = fixture('stereo.wav', wave([8192, -16384, 24576, 0, -32768, 0], 2))
    expect(wavPeaks(path, 3)).toEqual([0.5, 0.75, 1])
  })

  it('includes the final sample when the frame count is not divisible by the slice count', () => {
    const path = fixture('remainder.wav', wave([8192, 0, 16384, 0, -32768]))
    expect(wavPeaks(path, 2)).toEqual([0.25, 1])
  })

  it('preserves short audio and silence without inventing amplitude', () => {
    expect(wavPeaks(fixture('short.wav', wave([32767])), 3)).toEqual([0, 0, 1])
    expect(wavPeaks(fixture('silence.wav', wave([0, 0, 0])), 3)).toEqual([0, 0, 0])
  })

  it('skips padded odd-length chunks', () => {
    const path = fixture('padded.wav', wave([8192, -32768], 1, 1, true))
    expect(wavPeaks(path, 2)).toEqual([0.25, 1])
  })

  it('rejects unsupported formats and missing format metadata', () => {
    expect(() => wavPeaks(fixture('non-pcm.wav', wave([1], 1, 3)))).toThrow('expected 16-bit PCM')
    const missingFmt = wave([1])
    missingFmt.write('JUNK', 12)
    expect(() => wavPeaks(fixture('missing-fmt.wav', missingFmt))).toThrow('missing fmt chunk')
  })

  it('reports invalid input and truncated audio explicitly', () => {
    const path = fixture('valid.wav', wave([1]))
    expect(() => wavPeaks(path, 0)).toThrow('positive bucket count')
    expect(() => wavPeaks(fixture('invalid.wav', Buffer.from('not audio')))).toThrow('RIFF WAV')
    expect(() => wavPeaks(fixture('truncated.wav', wave([1]).subarray(0, -1)))).toThrow('truncated data chunk')
  })
})
