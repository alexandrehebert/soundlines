# Audio

[Back to README](../README.md)

Paths in prose and commands are relative to the repository root.

## Landing-page loop

The [hip-hop loop](../public/loops/hip-hop.wav) played by the landing turntable was generated locally
with ACE-Step 1.5's highest-quality pairing: the `acestep-v15-xl-sft` (4B) DiT at
80 diffusion steps, guidance 7 with ADG, and the largest `acestep-5Hz-lm-4B`
planner. Because both models do not fit in 25 GB of unified memory together, the
planner's audio codes were generated first, then rendered by the XL DiT.
Five original 36-second instrumental boom-bap takes in D minor at 92 BPM used
seeds 73192, 18409, 60217, 41126, and 52880. Four-bar excerpts on a
regression-fitted beat grid were compared for seam similarity, bar-to-bar
consistency, and level stability. The selected seed is 41126, from 11.668 s:
exactly 16 beats at 92.0 BPM (10.435 s), stereo 48 kHz PCM16, normalized to
-1 dBFS peak with an 8 ms wrap crossfade. WAV avoids lossy encoder padding at
the loop boundary.
The deployed app serves this static asset; it does not require a running ACE-Step API.
Its brief and selection report are in [scripts/loops/briefs](../scripts/loops/briefs). Loops for other
genres follow the same pipeline through the `loop-briefer`, `loop-producer`, `loop-validator` and
`loop-reviewer` agents; the bundled scripts and the verified ACE-Step configuration are in
[.github/skills/loop-produce](../.github/skills/loop-produce).

## Genre previews

ACE-Step previews live in `public/genre-previews`. The renderer takes the
middle ten seconds of a 32-second performance and uses the genre briefs in
`scripts/previews/briefs/*.json`. With the local ACE-Step API on port 8020 and its
planner enabled, set `ACESTEP_PYTHON` to the ACE-Step environment's Python
executable and `ACESTEP_PREVIEW_STATE` to a writable progress file, then run
`node scripts/previews/render-ace-previews.mjs`. Reuse the progress file to skip
completed clips, or pass genre slugs to render a subset.
