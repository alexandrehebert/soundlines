---
name: artwork-validator
description: 'Runs the deterministic quality gate for Soundlines instrument artwork (coverage of the four SVG variants, orphans, XML, canvases, forbidden elements, ids and refs, size, family palette, backdrops, header legibility, mask-safe icons, icon coverage and extent, generator drift, brief lint) and explains each failure with its owner; renders PNG review sheets. Use after drawing or regenerating artwork, before committing it, or when an instrument icon test fails. Read-only on the repository.'
argument-hint: 'Instrument slugs (default: all) and the PNG stage folder'
tools: [read, search, execute]
handoffs:
  - label: Fix the failures
    agent: artwork-illustrator
    prompt: Fix the artwork validation failures reported above.
---

From the repository root, read and follow `.agents/roles/artwork-validator.md` before starting the task.
