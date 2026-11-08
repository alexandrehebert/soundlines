# Architecture

[Back to README](../README.md)

Paths in prose and commands are relative to the repository root.

## Shared explorer architecture

- The landing-page theme button flips the vinyl from Side A (dark) to Side B
  (light). The app-wide palette is stored in `localStorage` as `soundlines-theme`;
  dark remains the default. The preference is applied before hydration and
  synchronized across tabs. Reduced-motion users see an instant side change.
  Light mode uses parchment surfaces, warm brown text, terracotta UI accents, and a muted categorical
  chart palette. Keep source hues in [theme.ts](../src/theme.ts) stable for dark
  mode; rendering code uses `chartColor` to resolve shared light-mode aliases
  from [colorTheme.css](../src/colorTheme.css). Bars blend over the theme's canvas,
  with dark labels in light mode; prominence, date fades, and category meanings
  remain unchanged. Colored text and instrument icons use `chartTextColor` for
  contrast without changing dark-mode hues.

- Explicit App Router pages cover home, genres, artists, instruments, and
  history. The locale layout shares [SoundlinesProviders](../src/SoundlinesProviders.tsx)
  across them; the pages currently render the shared [App](../src/App.tsx) UI.
- [ExplorerContext](../src/ExplorerContext.ts) owns the graph index, active mode,
  selection, per-mode ranges, history filters, and URL synchronization. Next's
  router pushes view changes and replaces query-only changes, preserving browser
  history and unrelated URL parameters. Legacy query links redirect to the
  corresponding explicit route. Pages render on demand so the initial server
  render reflects the request's query parameters.
- Locales are language-only (`en`, `fr`, `de`, `it`, and `es`). next-intl's
  default prefix routing provides a path for each language without a custom
  prefix map or internal country-code rewrite. The root proxy uses next-intl's
  built-in locale negotiation and preference cookie; explicit locale URLs remain
  stable. A standard Next.js redirect preserves old `/en-US` links, including
  paths and query parameters.
- The landing-page footer links to each explorer page and lets visitors switch
  between the supported languages.
- App translations live in [English](../src/i18n/locales/en.json),
  [French](../src/i18n/locales/fr.json), [German](../src/i18n/locales/de.json),
  [Italian](../src/i18n/locales/it.json), and [Spanish](../src/i18n/locales/es.json)
  JSON catalogues: UI copy, accessibility labels, date wording, graph taxonomy
  labels, and page/social metadata.
  The UI uses `next-intl`: client components call `useTranslations`, server
  components use `getTranslations`, and ICU messages handle interpolation and
  plurals. TypeScript checks message keys against the English catalogue; keep
  catalogue keys and ICU parameters aligned across languages. Graph content
  translations remain separate.
- Graph text for each non-English locale lives in `src/data/graph.<locale>.json`
  ([French](../src/data/graph.fr.json), [German](../src/data/graph.de.json),
  [Italian](../src/data/graph.it.json), and [Spanish](../src/data/graph.es.json)),
  registered in `GRAPH_OVERLAYS`. Each is keyed by stable entity IDs and overlays
  only translated fields on the canonical graph. Overlays cover descriptions,
  phase summaries, individual phase notes, period-estimate notes, and all
  relationship notes. Instruments, places, scenes, and applicable
  genre names have localized labels; artist, label, and recording names retain
  their original form. Previously missing French long-form text was machine-translated
  with Google Translate, with manual corrections to visible musical terminology.
  The remaining 860 French relationship notes were translated directly, without an
  external translation service, preserving source references and caveats.
  All translations remain editorial text requiring review. Coverage tests require
  every source descriptive field to have a nonempty entry in each overlay and verify
  that translations preserve graph structure.
- [Social metadata](../src/socialMetadata.ts) derives previews from the same
  routes, URL parameters, and graph nodes. App Router metadata is rendered on
  the server, including canonical and alternate-language URLs.
- [Timeline model](../src/graph/timeline.ts) projects the graph for each mode, infers artist families, and restricts layout and traversal to same-view relationships.
- [Timeline](../src/components/Timeline.tsx) composes shared [geometry](../src/components/timeline/geometry.ts), [bar rendering](../src/components/timeline/TimelineBar.tsx), [relationship rendering](../src/components/timeline/TimelineLinks.tsx), and [viewport interaction](../src/components/timeline/useTimelineViewport.ts).
- [Prominence helpers](../src/graph/phases.ts) provide the same intensity, fade, and revival logic for both node types.
