import { fileURLToPath } from 'node:url'

export const mediaDirectory = fileURLToPath(new URL('../public', import.meta.url))
