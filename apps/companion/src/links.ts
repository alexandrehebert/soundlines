import { APP_URL, STORYBOOK_URL } from '@soundlines/project-config'

export const appUrl = (import.meta.env.DEV && import.meta.env.VITE_SOUNDLINES_APP_URL) || APP_URL
export const storybookUrl = (import.meta.env.DEV && import.meta.env.VITE_SOUNDLINES_STORYBOOK_URL) || STORYBOOK_URL
