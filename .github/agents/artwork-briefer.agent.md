---
name: artwork-briefer
description: 'Writes and revises visual briefs for Soundlines instrument artwork (docs/artwork/briefs/<slug>.json): verified museum or photo references, silhouette, defining anatomical features with counts, icon must-keep features, look-alikes to avoid and the drawing method, passing check-brief.mjs. Use to plan artwork for a new instrument, before a redraw, or to apply artwork-review findings about accuracy or recognisability. Does not draw.'
argument-hint: 'Instrument id or slug, plus review findings to address if revising'
tools: [read, edit, search, execute, web]
handoffs:
  - label: Draw this instrument
    agent: artwork-illustrator
    prompt: Draw the four SVGs for the brief written above.
---

From the repository root, read and follow `.agents/roles/artwork-briefer.md` before starting the task.
