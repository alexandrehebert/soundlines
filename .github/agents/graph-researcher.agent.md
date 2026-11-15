---
name: graph-researcher
description: 'Researches coverage gaps in the Soundlines music graph and proposes sourced additions as a GRAPH.md §7 merge patch without editing files. Use to plan enrichment: pre-1600 or post-2010 chronology, underrepresented regions and traditions, candidate events, missing genres, key artists, tracks, labels, places or scenes.'
argument-hint: 'Area to research, e.g. "post-2010 genres" or "West African griot traditions"'
tools: [read, search, web, execute]
handoffs:
  - label: Apply this merge patch
    agent: graph-editor
    prompt: Apply the merge patch proposed above, with evidence, locale overlays and a passing validation gate.
---

From the repository root, read and follow `.agents/roles/graph-researcher.md` before starting the task.
