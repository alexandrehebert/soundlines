---
name: artwork-brief
description: 'Write or revise the visual brief for a Soundlines instrument artwork (scripts/artwork/briefs/<slug>.json): verified reference images and records, silhouette, defining anatomical features, the features an icon must keep, confusions to avoid and the drawing method, linted by check-brief.mjs. Use before drawing a new instrument, before redrawing one, or when an artwork review says the instrument is inaccurate, unrecognisable or reads as another instrument.'
argument-hint: 'Instrument id or slug, e.g. "instrument:charango", plus any review findings to address'
---

# Write an artwork brief

The brief owns **what the instrument must look like**, with evidence. Drawing is `artwork-draw`,
mechanical checks are `artwork-validate`, the ship decision is `artwork-review`.
Reference: [scripts/artwork/briefs/charango.json](../../../scripts/artwork/briefs/charango.json).

## Schema

```jsonc
{
  "slug": "charango",                    // file name and asset name
  "instrument": "instrument:charango",   // must exist in src/data/graph.json (graph-edit adds nodes)
  "family": "strings",                   // must equal the node's family (it picks the palette)
  "method": "generator",                 // "generator" (preferred: master in the Python generator) or "hand"
  "references": [                        // ≥ 2 https, each opened and checked; say what it shows
    { "url": "https://commons.wikimedia.org/wiki/File:…", "shows": "front view: …" }
  ],
  "silhouette": "…",                     // 30-300 chars: overall shape, pose, proportions
  "features": ["…"],                     // 3-8 defining traits visible at banner size, with counts
  "iconFeatures": ["…"],                 // 1-3 traits, including the natural playing pose, at 16-24 px
  "avoid": ["…"],                        // 1-6 confusions with neighbours, anachronisms, wrong views
  "notes": "…"                           // which variant/era is drawn and why
}
```

## Procedure

1. **Ground the instrument.** `node .github/skills/graph-edit/scripts/lookup.mjs instrument:<slug>` for
   the name, family, period and sources. If the node does not exist, stop: it must be added through
   `graph-edit` first (the artwork gate rejects orphan files).
2. **Find references.** Prefer, in order: museum collection records (Met, MIM Brussels, Musée de la
   musique, Smithsonian, university collections), maker or manual documentation for hardware, Wikimedia
   Commons photos with a clear front view, then encyclopaedias for counts and dimensions. Open every URL
   and describe what it shows; a reference you did not open is not a reference. AllMusic and Britannica
   block automated fetches; do not cite pages you could not read.
3. **Choose the variant.** The common modern form unless the graph node describes a historical one
   (period, description). Say which in `notes`.
4. **Write features as checkable facts**: shapes, counts (strings, courses, pegs, keys, pads, valves),
   where parts sit relative to each other, proportions ("neck about as long as the body"). Each should be
   something a reviewer can confirm on the PNG.
5. **Write `iconFeatures`** as the 1-3 shapes that still identify the instrument at 16 px, including
   its natural playing position. Put the pose rationale in `notes`. For symmetrical string bodies,
   preserve symmetry around the neck axis before rotating the complete instrument. Write `avoid`
   with the nearest look-alikes in the set (`ls public/instrument-icons`).
6. **Pick `method`**: `generator` for anything the family builders (`plucked`, `bowed`, `indian`,
   `synthesizer`) or helpers can express; `hand` only when the shape needs bespoke paths. Existing
   instruments keep their current method unless the review asks otherwise.
7. Lint: `node .github/skills/artwork-brief/scripts/check-brief.mjs scripts/artwork/briefs/<slug>.json`.

## Rules

- Briefs describe anatomy, never ask to copy or trace a photo, and never ask for logos or brand
  wordmarks (the lint rejects common brands). Model labels on electronic hardware are allowed only when
  they are the graph name.
- Revisions address each review finding with a concrete change to `features`, `iconFeatures` or `avoid`.
- Only `scripts/artwork/briefs/<slug>.json` is edited; never artwork files or scripts.
