---
description: 'Rules for ACE-Step genre loop briefs, selection reports and loop audio assets.'
applyTo: 'docs/loops/briefs/**,public/loops/**'
---
# Genre loops

- Pipeline, one owner per step: brief (`loop-briefer`, `loop-brief` skill) → optional turbo draft →
  final render and extraction (`loop-producer`, `loop-produce`) → deterministic gate (`loop-validator`,
  `loop-validate`) → ship decision (`loop-reviewer`, `loop-review`) → human listening sign-off.
- Shipped loops use `acestep-v15-xl-sft`, 80 steps, guidance 7 + ADG.
  Text-to-music uses the final profile with `acestep-5Hz-lm-4B` codes. Source-conditioned
  arrangements of original Soundlines loops use the arrangement profile with cover conditioning
  (ACE-Step bypasses LM planning), source checksum, exact source frame count and phrase alignment
  recorded in the selection report. Melody preservation requires human comparative listening.
  Neither path may ship drafts. Configuration and known failure modes:
  `.github/skills/loop-produce/references/ace-step.md`.
- Each loop is `public/loops/<slug>.wav` (PCM16, never AAC/MP3) with `docs/loops/briefs/<slug>.json`
  and its generated `<slug>.selection.json`. Never hand-edit a selection report; re-extract instead.
- Briefs are original and instrumental: no artist/track names, no "in the style of". Lint with
  `node .github/skills/loop-brief/scripts/check-brief.mjs`.
- Takes, codes, logs and spectrograms stay in `$LOOP_STAGE_ROOT/<slug>` (default `~/.cache/soundlines-loops`), not in the repo.
