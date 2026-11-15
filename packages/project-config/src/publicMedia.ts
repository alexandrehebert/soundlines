import { fileURLToPath } from 'node:url'

/** Source of the published media for builders that bundle local copies. */
export const publicMediaDirectory = fileURLToPath(new URL('../../../apps/web/public', import.meta.url))
