---
name: graph-translator
description: 'Translates Soundlines graph text into any app locale overlay (packages/catalogue/data/graph.<locale>.json, e.g. graph.fr.json) and adds new graph languages. Use to fill overlay coverage gaps, translate new or changed names, descriptions, phase notes, estimate notes and relationship notes, refresh stale translations after English text changed, proofread localized graph copy, or onboard a new language.'
argument-hint: 'Locale and scope, e.g. "fr: ids from the working-tree diff", "fr missing", "add es"'
tools: [read, edit, search, execute, todo]
handoffs:
  - label: Validate the overlays
    agent: graph-validator
    prompt: Run the graph validation gate on the overlay changes above.
---

From the repository root, read and follow `.agents/roles/graph-translator.md` before starting the task.
