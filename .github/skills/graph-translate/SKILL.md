---
name: graph-translate
description: 'Write, review or add a language to the Soundlines graph overlays (src/data/graph.<locale>.json, e.g. graph.fr.json). Use when translating names, descriptions, phase notes, estimate notes or relationship notes for new or changed graph entries in any locale, fixing overlay coverage test failures ("covers every node descriptive text field in the <locale> overlay"), proofreading localized graph copy, or adding a new language to the graph.'
argument-hint: 'Locale and ids to translate, "missing" to find gaps, or "add <locale>"'
---

# Graph text overlays (any locale)

`src/data/graph.json` holds all structure and the English text. Each other app locale has one
overlay, `src/data/graph.<locale>.json`, holding translated text only, keyed by the same stable ids
([docs/GRAPH.md](../../../docs/GRAPH.md) §1). Overlays are registered in `GRAPH_OVERLAYS`
(`src/data/graphLocale.ts`), which rejects unknown ids, fields and empty strings. App UI copy is separate
(`src/i18n/locales/<locale>.json`); never put graph text there.

Language-specific style rules live in `references/<locale>.md`: [fr](./references/fr.md),
[de](./references/de.md), [it](./references/it.md), and [es](./references/es.md).
Read the one for your target locale first; if it does not exist, create it (see "Add a language").

## Overlay shape (identical for every locale)

```json
{
  "nodes": {
    "<node id>": {
      "name": "…", "description": "…", "phaseNote": "…", "estimateNote": "…",
      "phaseNotes": { "<phase start year>": "…" }
    }
  },
  "edges": {
    "<edge id>": { "note": "…", "estimateNote": "…" }
  }
}
```

Only these fields are allowed. Never copy ids, periods, sources, types or relationships into an overlay.

## Required coverage (enforced per overlay by `src/data/graphLocale.test.ts`)

| English field | Overlay key | Required when |
|---|---|---|
| node `name` | `nodes[id].name` | type is `event`, `instrument`, `place` or `scene` (optional for genres, labels, festivals) |
| node `description` | `description` | present |
| node `phaseNote` | `phaseNote` | present |
| node `period.estimateNote` | `estimateNote` | present (and only if the node has a period) |
| phase `note` | `phaseNotes["<start>"]` | present |
| edge `note` | `edges[id].note` | present |
| edge `period.estimateNote` | `edges[id].estimateNote` | present |

Artist and track names are never translated: do not add `name` for them (tested).

```sh
node .github/skills/graph-edit/scripts/lookup.mjs <id>   # shows which overlay keys exist per locale
npx vitest run src/data/graphLocale.test.ts              # lists every missing <id>.<field> per locale
```

## Translate

1. List the gaps (test output above, or the ids from the change set) for **every** overlay, not just
   the one you know best. A change to English text means every overlay entry for that field is stale.
2. Translate from the English text in `graph.json`, never from another overlay.
3. Preserve every token inside English backticks exactly; these are graph identifiers or names, not
   prose. Preserve quoted work titles and proper names unless the locale reference says otherwise.
4. Keep meaning exact: same facts, dates, hedges ("approximately", "editorial, not a measured ranking")
   and confidence nuance. Add nothing the English and its sources do not support.
5. Write natural editorial prose in the target language, following its `references/<locale>.md`.
   Check its false-friend notes before translating ambiguous English. Places and instruments use the
   standard local name when one exists.
6. Insert entries next to related ones; keep the file as `JSON.stringify(data, null, 2) + '\n'`
   (tested by `src/data/graphFiles.test.ts`).
7. Run `node .github/skills/graph-translate/scripts/audit.mjs <locale> <ids...>` for the ids in
   scope (or omit ids to audit the full overlay) and resolve every error, then run
   `npm run validate:graph`. The audit checks identifier and year preservation plus known
   false-friend patterns; it cannot judge whether a translation is idiomatic or factually exact.

Machine-assisted translation still needs human review. Review a representative sample of 20 changed
or completed fields (all fields if fewer than 20), comparing English and target text for meaning,
proper names, dates, terminology, hedges and negation. List uncertain terminology in the summary.

## Add a language

A new graph language is also a new app locale; both must land together.

1. Add the code to `LOCALES` in `src/i18n/routing.ts`.
2. App UI: add `src/i18n/locales/<locale>.json` with the same keys and ICU placeholders as `en.json`,
   register it in `src/i18n/catalogue.ts`, and add the language switcher entry in
   `src/components/navigation/DiscoveryChrome.tsx` (plus its label key in every catalogue).
3. Graph: create `src/data/graph.<locale>.json` (`{ "nodes": {}, "edges": {} }`), import it in
   `src/data/graphLocale.ts` and register it in `GRAPH_OVERLAYS` (TypeScript fails until you do; the
   test "registers exactly one graph.<locale>.json overlay per non-English app locale" checks files).
4. Write `references/<locale>.md` with the language's style rules (genre-name conventions,
   typography, dates, centuries, eras such as BCE), modelled on [fr.md](./references/fr.md).
5. Fill the overlay until the coverage tests pass; for a large backlog use the `graph-translator`
   agent per slice (one family or node type at a time).
6. Run the translation audit for the new locale, `npm run validate:graph` and `npm test`.
