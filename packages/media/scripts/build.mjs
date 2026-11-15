import { fileURLToPath } from 'node:url'
import { publishMedia } from '../src/publish.ts'

publishMedia(fileURLToPath(new URL('../dist', import.meta.url)))
