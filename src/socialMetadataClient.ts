import { socialMetaTags, type SocialMetadata } from './socialMetadata.ts'

export function updateDocumentMetadata(document: Document, metadata: SocialMetadata): void {
  document.title = metadata.title

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.append(canonical)
  }
  canonical.href = metadata.url

  for (const { attribute, key, content } of socialMetaTags(metadata)) {
    let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute(attribute, key)
      document.head.append(tag)
    }
    tag.content = content
  }
}
