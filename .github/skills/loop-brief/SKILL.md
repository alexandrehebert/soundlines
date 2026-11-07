---
name: loop-brief
description: 'Write or revise the production brief for a Soundlines genre loop (scripts/loops/briefs/<slug>.json): genre-authentic tempo, meter, key, bar count, seeds and an ACE-Step prompt with the required loop-form, mix and originality clauses, linted by check-brief.mjs. Use when planning a loop for a new genre, when a review says a loop is not idiomatic, has vocals, an intro, a breakdown or a muffled mix, or before any ACE-Step loop render.'
argument-hint: 'Genre id or slug, e.g. "genre:amapiano", plus any review feedback to address'
---

# Write a loop brief

A brief is everything ACE-Step receives. It owns **what the loop should sound like**; rendering is
`loop-produce`, measurement is `loop-validate`, the ship decision is `loop-review`.
The reference is [scripts/loops/briefs/turntable-hip-hop.json](../../../scripts/loops/briefs/turntable-hip-hop.json): it
produced the shipped hip-hop loop, so copy its structure and density.

## Schema

```jsonc
{
  "slug": "amapiano",                 // file name, asset name
  "genre": "genre:amapiano",          // must exist in src/data/graph.json
  "asset": "public/loops/amapiano.wav", // optional; this is the default
  "bpm": 112,                         // integer felt-beat tempo, 60-180
  "meter": 4,                         // ACE-Step time signature: 2, 3, 4 or 6 (beats per bar)
  "key": "F minor",                   // "<A-G>[#|b] major|minor"
  "bars": 4,                          // 2, 4 or 8
  "duration": 36,                     // seconds rendered; ≥ loop + 14 s, ≤ 60
  "seeds": [ ... 5 unique ints ... ],
  "prompt": "...",                    // 400-1600 chars, see below
  "notes": "why these choices, with sources"
}
```

## Procedure

1. **Ground the genre.** `node .github/skills/graph-edit/scripts/lookup.mjs genre:<slug>` for the
   graph description, period and key artists (as context only). Check tempo range, meter, signature
   instruments and groove against a serious source (GRAPH.md §6 standards); cite it in `notes`.
   Reuse the catalogue brief in `scripts/previews/briefs/*.json` as a starting point if one exists.
2. **Choose musical parameters.** A typical, central tempo (not the genre extreme); a key the genre
   commonly uses; `bpm` and `meter` count the *felt* beat, because the extractor's beat tracker follows
   it. Compound feels (6/8, 12/8) are written as `meter: 2` or `4` at the dotted-quarter BPM; waltzes
   are `meter: 3`. Only `meter: 4` is verified end to end, so draft first for anything else.
   Beatless genres (ambient, drone, free improvisation) are out of scope for beat-grid loops; say so
   and stop.
3. **Write the prompt as one paragraph with five parts**, in this order (see the reference):
   1. *Identity*: `Original instrumental <era/region> <genre>, <bpm> BPM, <time signature>, <key>.`
   2. *Groove and parts*: drums/percussion pattern, bass relation to the kick, one memorable original
      motif and its instrument, and where space is left. Concrete performance verbs, not adjectives.
   3. *Loop form*: `Repeat a coherent four-bar groove with subtle variations, keep the rhythm section
      fully present from the opening beat through the middle, no intro, no breakdown, no fade-out.`
   4. *Mix*: transients, low end (controlled, mono-compatible), stereo image, saturation, "not muffled".
   5. *Originality*: `Entirely instrumental: no singing, no speech, no vocal samples. All melodies and
      performances newly composed.` Add genre-specific bans (e.g. "no pre-recorded scratching", "no MC").
4. **Never** name artists, tracks, labels' signature records, or write "in the style of"; describe the
   musical traits instead. The linter blocks graph artist/track names.
5. **Pick five fresh seeds** for a new brief. When revising a brief after review, keep the seeds that
   produced good takes and replace the bad ones.
6. **Lint**: `node .github/skills/loop-brief/scripts/check-brief.mjs scripts/loops/briefs/<slug>.json`
   must PASS. Any prompt or meta change invalidates planned codes (by design).

## Revising after review

For a source-conditioned arrangement of an existing original Soundlines loop, add
`arrangement: { source: "public/loops/<slug>.wav", strength: 0.75 }`.
Keep the source tempo, key, melody, bar count and phrase position explicit in the prompt.
The arrangement pipeline preserves the source's fitted duration exactly rather than cutting
an independently timed loop. Cite the original source and intended instrumentation changes in
`notes`; source conditioning is not a guarantee of melody preservation.

Map each review finding to one prompt change and record it in `notes`: vocals → stronger bans and
remove vocal-associated words ("soulful", "hook", "chant"); intro/breakdown → loop-form sentence earlier
and "from the opening beat"; muffled → mix paragraph; wrong groove → name the pattern placement
(beats, offbeats, swing). Change one thing at a time when possible so the next take isolates it.
