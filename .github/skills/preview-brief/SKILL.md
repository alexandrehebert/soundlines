---
name: preview-brief
description: "Write and revise genre-specific briefs for ten-second ACE-Step catalogue previews."
---

# Brief genre previews

Write or revise entries in `docs/previews/briefs/{acoustic,electric,regional}.json`. These are listening previews, not seamless loops. Read neighboring entries and preserve their schema.

Ground the genre in its graph description and evidence using `.github/skills/graph-edit/scripts/lookup.mjs`; describe characteristic instruments, rhythm, performance and production. Use concrete musical direction, original material, and no imitation of named artists or recordings. Preserve culturally relevant vocal traditions where appropriate; do not impose the loop workflow's instrumental-only, beat-grid, key or tempo restrictions. Ambient and free-time genres are supported.

Request an established, full arrangement through the middle of a 32-second performance. The renderer appends production direction itself; do not duplicate it. Supply `prompt`, optional `bpm`, `meter`, and `lyrics` consistent with existing entries. Default lyrics are `[Instrumental]`.

Check JSON parsing, unique coverage across the three files, valid graph genre slugs and nonempty prompts. For a new catalogue, every genre needs one brief. For revisions, change only requested entries and explain the musical changes. Do not render or replace assets.
