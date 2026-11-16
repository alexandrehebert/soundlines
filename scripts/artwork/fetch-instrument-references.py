"""Download the source files cited by instrument artwork briefs."""

import argparse
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
import json
from pathlib import Path
import re
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urldefrag, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
BRIEFS = ROOT / 'docs/artwork/briefs'
ARCHIVE = BRIEFS / 'sources'
MAX_BYTES = 64 * 1024 * 1024
FILE_TYPES = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/tiff': 'tif',
    'image/svg+xml': 'svg',
    'text/html': 'html',
    'application/xhtml+xml': 'html',
}


def brief_sources(brief):
    geometry = brief['geometry']
    sources = [(ref['url'], ref['shows']) for ref in brief['references']]
    if dimensions := geometry.get('documentedDimensions'):
        sources.append((dimensions['source'], f"Dimensions for {dimensions['scope']}"))
    if photo := geometry.get('referenceImage'):
        sources.extend(((photo['source'], 'Photo provenance'), (photo['url'], 'Direct reference photo')))
    return [{'url': url, 'role': role} for url, role in dict.fromkeys(sources)]


def download(url):
    parsed = urlparse(url)
    if parsed.scheme != 'https' or not parsed.hostname:
        return {'error': 'Expected an HTTPS source'}
    name = re.sub(r'[^a-zA-Z0-9.-]+', '-', Path(parsed.path).stem)[:64].strip('.-')
    stem = f"{parsed.hostname}-{name or 'index'}-{sha256(url.encode()).hexdigest()[:12]}"
    for suffix in set(FILE_TYPES.values()):
        existing = ARCHIVE / f'{stem}.{suffix}'
        if existing.is_file():
            return {'file': existing.name, 'type': suffix}

    try:
        request = Request(quote(url, safe=":/?&=%+#@!$'()*+,;[]"),
                          headers={'User-Agent': 'Soundlines artwork references (public source archive)'})
        with urlopen(request, timeout=12) as response:
            suffix = FILE_TYPES.get(response.headers.get_content_type())
            if suffix is None:
                return {'error': f'Unsupported content type {response.headers.get_content_type()}'}
            data = response.read(MAX_BYTES + 1)
        if not data or len(data) > MAX_BYTES:
            return {'error': 'Empty response or file exceeds 64 MiB'}
        if suffix == 'pdf' and not data.startswith(b'%PDF-'):
            return {'error': 'Response is not a PDF'}
        if (parsed.path.lower().endswith('.pdf') and suffix != 'pdf'
                or parsed.path.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')) and suffix == 'html'):
            return {'error': 'Expected a media file but received a source page'}
        target = ARCHIVE / f'{stem}.{suffix}'
        pending = target.with_suffix('.partial')
        pending.write_bytes(data)
        pending.replace(target)
        return {'file': target.name, 'type': suffix}
    except HTTPError as error:
        return {'error': f'HTTP {error.code}'}
    except (URLError, OSError, ValueError) as error:
        return {'error': str(error)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('slugs', nargs='*', help='Instrument slugs (default: all)')
    parser.add_argument('--status', action='store_true', help='Show locally cached coverage without downloading')
    args = parser.parse_args()
    known = {path.stem: path for path in BRIEFS.glob('*.json')}
    if unknown := set(args.slugs) - known.keys():
        parser.error(f"Unknown brief: {', '.join(sorted(unknown))}")

    wanted = args.slugs or sorted(known)
    sources = {slug: brief_sources(json.loads(known[slug].read_text())) for slug in wanted}
    index = ARCHIVE / 'index.json'
    archived = json.loads(index.read_text()) if index.exists() else {}
    if not args.status:
        urls = list(dict.fromkeys(urldefrag(ref['url']).url for refs in sources.values() for ref in refs))
        ARCHIVE.mkdir(exist_ok=True)
        with ThreadPoolExecutor(max_workers=8) as pool:
            results = dict(zip(urls, pool.map(download, urls)))
        if not args.slugs:
            archived = {}
        for slug, refs in sources.items():
            archived[slug] = [{**ref, **results[urldefrag(ref['url']).url]} for ref in refs]
        index.write_text(json.dumps(archived, ensure_ascii=False, indent=2, sort_keys=True) + '\n')
        downloaded = sum('file' in result for result in results.values())
        print(f'{downloaded}/{len(urls)} unique sources cached.')

    coverage = {}
    for slug, refs in sources.items():
        cited_urls = {ref['url'] for ref in refs}
        coverage[slug] = {ref['type'] for ref in archived.get(slug, [])
                          if ref['url'] in cited_urls and 'file' in ref
                          and (ARCHIVE / ref['file']).is_file()}
    with_source = sum(bool(types) for types in coverage.values())
    with_pdf = sum('pdf' in types for types in coverage.values())
    with_media = sum(bool(types - {'html'}) for types in coverage.values())
    print(f'{with_source}/{len(wanted)} instruments have a local source, '
          f'{with_media} with a PDF or image, including {with_pdf} with a PDF.')
    if args.status:
        for slug, types in coverage.items():
            if not types - {'html'}:
                print(f"{slug}: {'source pages only' if types else 'no cached source'}")
    print(f'Per-instrument source locations and download errors: {index.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
