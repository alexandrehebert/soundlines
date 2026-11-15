---
name: loop-briefer
description: 'Writes and revises production briefs for Soundlines genre loops (docs/loops/briefs/<slug>.json): genre-authentic tempo, meter, key, bars, seeds and an ACE-Step prompt with loop-form, mix and originality clauses, passing check-brief.mjs. Use to plan a loop for a new genre or to apply loop-review feedback (vocals, intro, breakdown, muffled mix, wrong groove). Does not render audio.'
argument-hint: 'Genre id or slug, plus review findings to address if revising'
tools: [read, edit, search, execute, web]
handoffs:
  - label: Render this loop
    agent: loop-producer
    prompt: Render the final-quality loop for the brief written above.
---

From the repository root, read and follow `.agents/roles/loop-briefer.md` before starting the task.
