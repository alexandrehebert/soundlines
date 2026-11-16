# Soundlines mobile web

A phone-sized browser prototype with a Home feed, catalogue Search, and a Library.
Home opens to the newest catalogue additions.
Entries without addition dates follow the dated entries. Each ten-card group
includes one editorial Spotlight and one Soundtrail. The feed cycles the
catalogue after the last entry. Swipe vertically to change cards and sideways
within a Soundtrail to change steps. Use the Up and Down arrow keys or Page Up
and Page Down when the feed has focus. Soundtrail arrows move between steps.
Sound plays after pressing a preview button and stops when the active card or
step changes. Leaving Home stops playback and keeps the current feed position.
Tap a card title or search result to open its mobile entry with historical context, sources,
and expandable groups of related entries. Library opens with catalogue categories, then families where available.
Artist lists scroll by year and offer a date slider. Instrument albums use a grid of artwork grouped by period. Undated entries appear last.

Run `docker compose up -d mobile-web` from the repository root and open
`http://localhost:5175`. To try it on a phone on the same network, run
`MOBILE_WEB_BIND=0.0.0.0 docker compose up -d mobile-web` and open
port 5175 on your computer's local network address.

Run `pnpm dev:mobile` to start Vite directly.
`pnpm --filter @soundlines/mobile-web build` produces a static site in
`apps/mobile-web/dist`.

Vite selects feed entries from the shared catalogue at build time. Artwork and
previews use the public media manifest. Set `VITE_MEDIA_MANIFEST_URL` to use
another copy of the manifest.

Genre covers are sourced from the shared media package and its
[artwork briefs](../../docs/artwork/README.md#genre-covers). Genres awaiting a
cover display a record graphic. Instrument cards use the catalogue's existing
artwork. The other catalogue cards use typography.
