# Architecture

[Back to README](../README.md)

Paths in prose and commands are relative to the repository root.

## Workspace layout

| Workspace | Owns |
| --- | --- |
| [apps/web](../apps/web/) | Next.js atlas, localized routes, and MCP endpoint |
| [apps/companion](../apps/companion/) | Vite companion published to GitHub Pages |
| [apps/storybook](../apps/storybook/) | Vite Storybook configuration and static browser catalog |
| [packages/catalogue](../packages/catalogue/) | Canonical graph data, locale overlays, review status, and framework-independent catalogue code |
| [packages/design-tokens](../packages/design-tokens/) | Platform-independent entity and family colors |
| [packages/project-config](../packages/project-config/) | Shared project URLs and link helpers |
| [packages/ui-web](../packages/ui-web/) | Reusable React DOM controls, panels, and component stories |
| [packages/media](../packages/media/) | Shared artwork, audio, favicons, and their published catalogue manifest |

pnpm links workspace packages through their package exports. Turborepo uses
these dependencies to order builds and type checks with one root lockfile.
The atlas routes, timeline projections, and interface translations live in
`apps/web/`. Graph review and artwork tools read the canonical JSON in
`packages/catalogue/data/`. History tools also resolve the previous catalogue
path when reading older Git revisions.

`packages/media/public/` owns the shared artwork, audio, and favicons.
Next.js stages those files alongside its app-specific assets in
`apps/web/public/`, preserving their public URLs. Storybook and the companion
read the shared files from the media package when they build. The media package
can publish the same files and manifest independently of the apps.

Catalogue and token packages have no browser or Next.js dependencies. A
future Expo app can use them with its own screen components, navigation, and
playback. The standalone [ACE monitor](../tools/ace-monitor/) keeps its own
dependencies and runs separately from the workspaces.

## Webapp design system

[The atlas design system](../apps/web/src/design-system/) is organized by UI responsibility.
Follow the [design system guide](./DESIGN_SYSTEM.md) when adding or changing UI.

| Folder | Owns |
| --- | --- |
| [foundations](../apps/web/src/design-system/foundations/) | Global styles, theme tokens, and vinyl styling |
| [home](../apps/web/src/design-system/home/) | Landing page, daily spotlights, chronology previews, and Soundtrails |
| [navigation](../apps/web/src/design-system/navigation/) | Shared page chrome, branding, search, and explorer links |
| [explorer](../apps/web/src/design-system/explorer/) | View controls, legend, entry details, and instrument icons |
| [bubbles](../apps/web/src/design-system/bubbles/) | Genre bubble view, minimap, and zoom controls |
| [timeline](../apps/web/src/design-system/timeline/) | Timeline and history views, including undated entries |
| [dataset](../apps/web/src/design-system/dataset/) | Dataset statistics and charts |
| [open-data](../apps/web/src/design-system/open-data/) | Open Data pages and dataset graph |
| [playback](../apps/web/src/design-system/playback/) | Audio previews, jukebox, turntable, and playback coordination |
| [ui-web](../packages/ui-web/src/) | Reusable controls, panels, and badges |

## Shared explorer architecture

- The landing-page theme button flips the vinyl from Side A (dark) to Side B
  (light). The app-wide palette is stored in `localStorage` as `soundlines-theme`;
  dark remains the default. The preference is applied before hydration and
  synchronized across tabs. Reduced-motion users see an instant side change.
  Light mode uses parchment surfaces, warm brown text, terracotta UI accents, and a muted categorical
  chart palette. Keep source hues in [familyColors.ts](../packages/design-tokens/src/familyColors.ts) stable for dark
  mode; rendering code uses `chartColor` to resolve shared light-mode aliases
  from [colorTheme.css](../apps/web/src/design-system/foundations/colorTheme.css). Bars blend over the theme's canvas,
  with dark labels in light mode; prominence, date fades, and category meanings
  remain unchanged. Colored text and instrument icons use `chartTextColor` for
  contrast without changing dark-mode hues.

- Explicit App Router pages cover home, genres, artists, instruments, and
  history. The locale layout shares [SoundlinesProviders](../apps/web/src/SoundlinesProviders.tsx)
  across them; the pages currently render the shared [App](../apps/web/src/App.tsx) UI.
- [ExplorerContext](../apps/web/src/ExplorerContext.ts) owns the graph index, active mode,
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
- App translations live in [English](../apps/web/src/i18n/locales/en.json),
  [French](../apps/web/src/i18n/locales/fr.json), [German](../apps/web/src/i18n/locales/de.json),
  [Italian](../apps/web/src/i18n/locales/it.json), and [Spanish](../apps/web/src/i18n/locales/es.json)
  JSON catalogues: UI copy, accessibility labels, date wording, graph taxonomy
  labels, and page/social metadata.
  The UI uses `next-intl`: client components call `useTranslations`, server
  components use `getTranslations`, and ICU messages handle interpolation and
  plurals. TypeScript checks message keys against the English catalogue; keep
  catalogue keys and ICU parameters aligned across languages. Graph content
  translations remain separate.
- Graph text for each non-English locale lives in `packages/catalogue/data/graph.<locale>.json`
  ([French](../packages/catalogue/data/graph.fr.json), [German](../packages/catalogue/data/graph.de.json),
  [Italian](../packages/catalogue/data/graph.it.json), and [Spanish](../packages/catalogue/data/graph.es.json)),
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
- [Social metadata](../apps/web/src/socialMetadata.ts) derives previews from the same
  routes, URL parameters, and graph nodes. App Router metadata is rendered on
  the server, including canonical and alternate-language URLs.
- [Timeline model](../apps/web/src/graph/timeline.ts) projects the graph for each mode, infers artist families, and restricts layout and traversal to same-view relationships.
- [Timeline](../apps/web/src/design-system/timeline/Timeline.tsx) composes shared [geometry](../apps/web/src/design-system/timeline/geometry.ts), [bar rendering](../apps/web/src/design-system/timeline/TimelineBar.tsx), [relationship rendering](../apps/web/src/design-system/timeline/TimelineLinks.tsx), and [viewport interaction](../apps/web/src/design-system/timeline/useTimelineViewport.ts).
- [Prominence helpers](../packages/catalogue/src/phases.ts) provide the same intensity, fade, and revival logic for both node types.
