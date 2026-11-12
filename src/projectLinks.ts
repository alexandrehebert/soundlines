export const REPOSITORY_URL = 'https://github.com/alexandrehebert/soundlines'
export const PROJECT_SITE_URL = 'https://alexandrehebert.github.io/soundlines'
export const STORYBOOK_URL = `${PROJECT_SITE_URL}/storybook/`
export const APP_URL = 'https://soundlines.hebert.app/'
export const MCP_URL = new URL('api/mcp', APP_URL).href

export function companionBaseUrl() {
  return process.env.NEXT_PUBLIC_SOUNDLINES_COMPANION_URL || PROJECT_SITE_URL
}

export function companionUrl(locale: string, section = '') {
  return new URL(`${locale}/${section}`, `${companionBaseUrl().replace(/\/$/, '')}/`).href
}
