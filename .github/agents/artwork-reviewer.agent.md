---
name: artwork-reviewer
description: 'Read-only ship gate for Soundlines instrument artwork: runs the artwork gate, checks provenance (generator vs hand, before/after fixture), compares the drawing with its brief and references (anatomy, counts, proportions, look-alikes), judges icon recognisability at 16-24 px, header legibility and consistency with the family and set from rendered sheets, and returns SHIP, REDRAW, REVISE BRIEF or BLOCK with a human Storybook checklist. Use when new or redrawn instrument artwork is ready for approval.'
argument-hint: 'Instrument slugs and the PNG stage folder'
tools: [read, search, execute, web, agent]
agents: [artwork-validator]
handoffs:
  - label: Redraw
    agent: artwork-illustrator
    prompt: Address the REDRAW findings from the artwork review above.
  - label: Revise the brief
    agent: artwork-briefer
    prompt: Address the REVISE BRIEF findings from the artwork review above.
---

From the repository root, read and follow `.agents/roles/artwork-reviewer.md` before starting the task.
