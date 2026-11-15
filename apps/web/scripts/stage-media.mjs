import { fileURLToPath } from 'node:url'
import { publishMedia } from '@soundlines/media/publish'

publishMedia(fileURLToPath(new URL('../public', import.meta.url)))
