# ACE-Step configuration and lessons

Verified on ACE-Step 1.5 (MLX backend, macOS, 25 GB usable unified memory) while producing
`public/loops/turntable-hip-hop.wav`. `extract-loop.py` reproduces that asset byte-for-byte from
its five takes, so these settings are the reference, not a guess.

## Shipped ("final") profile

| Stage | Setting | Value |
|---|---|---|
| Planner | LM | `acestep-5Hz-lm-4B`, backend `mlx`, run standalone (`plan-codes.py`) |
| | sampling | temperature 0.8, cfg_scale 2.5, top_p 0.9, `infer_type="llm_dit"` |
| | metadata | `bpm`, `keyscale`, `timesignature`, `duration` from the brief; CoT caption/language/metas off |
| DiT | model | `acestep-v15-xl-sft` (4B, 19 GB), loaded via `ACESTEP_CONFIG_PATH`, LM disabled |
| | steps / guidance | `inference_steps` 80, `guidance_scale` 7, `use_adg` true, `shift` 1, `dcw_enabled` false |
| | conditioning | `audio_code_string` = planned codes, `thinking` false, `use_format`/`use_cot_*` false |
| | text | `lyrics: "[Instrumental]"`, brief prompt verbatim (the same caption the LM planned with) |
| | form | `audio_duration` 36, `audio_format` wav, `batch_size` 1, fixed `seed`, `use_random_seed` false |
| Seeds | | 5 per brief (reference: 73192, 18409, 60217, 41126, 52880) |
| Extraction | | 4 bars on regression-fitted beat grid, transient-snapped start −12 ms, 8 ms wrap crossfade, DC removed, −1 dBFS peak, PCM16 at 48 kHz |

Draft profile (also used by `.github/skills/preview-produce/scripts/render-ace-previews.mjs` for catalogue previews):
`acestep-v15-turbo`, 8 steps, in-server `acestep-5Hz-lm-1.7B` with `thinking: true`. Fast and fine
for 10 s previews, not for shipped loops. A first pass on `acestep-v15-base` at 64 steps was clearly
behind XL SFT; do not use it.

## Original-source arrangements

The `arrangement` profile uses the same XL SFT DiT settings (80 steps, guidance 7, ADG, shift 1),
but `task_type: cover` and uploaded original Soundlines audio instead of 4B LM codes.
ACE-Step automatically bypasses LM planning for cover tasks (`docs/en/API.md` in the local
checkout). Use multipart `src_audio` uploads: this install rejects absolute `src_audio_path`
values with HTTP 400 despite the API documentation's path examples.
`arrange-loop.py` repeats the original source for conditioning and extracts only full cycles at
the original phrase position, with exactly the source frame count, sample rate and PCM16 format.
Source and conditioning checksums are recorded in the request and selection report.
Chroma comparisons guide candidate selection but cannot certify preservation of a melody;
the unchanged mechanical gate and human comparative listening are both required.

## Failure modes met, and how the scripts avoid them

| Symptom | Cause | Guard |
|---|---|---|
| `MPS backend out of memory (MPS allocated: 22 GiB …)` | 4B LM + XL DiT together exceed 25 GB | two phases: `plan-codes.py` with no server, then `ace-server.sh start final` with `ACESTEP_INIT_LLM=false` |
| Renders silently come from turbo | server default `ACESTEP_CONFIG_PATH` is `acestep-v15-turbo` | `ace-server.sh` sets the env and checks `/health.loaded_model`; `render-takes.mjs` refuses on mismatch |
| `result.json` reports `lm_model: acestep-5Hz-lm-0.6B` on final takes | server default label; the LM is not loaded (`ACESTEP_INIT_LLM=false`) and the planned 4B codes come in via `audio_code_string` | harmless; verify provenance from `request.json` (`thinking` false, non-empty `audio_code_string`), not from `result.json.lm_model` |
| LM tries vLLM on macOS | `ACESTEP_LM_BACKEND` defaults to `vllm` | backend `mlx` set explicitly in both scripts |
| Takes ignore an edited prompt | codes were planned for the previous caption | `codes/brief.sha256`; stale codes deleted, rendering refused |
| Loop starts mid-intro or contains the ending fade | ACE-Step opens with a build and ends with a fade or silence | 36 s takes; extraction only between 3 s and duration−5 s; prompt says "no intro, no breakdown, no fade-out" |
| Section change inside the loop (drop, breakdown) | free-running arrangement | scorer penalises half-to-half mel difference and bar RMS variation; prompt asks for "a coherent four-bar groove … fully present from the opening beat" |
| Audible click or tempo drift at the wrap | loop length from detected BPM, cut not on a transient | length = exact beats × regression-fitted period; start snapped to onset; 8 ms crossfade into pre-roll |
| Beat tracker at half or double time | ambiguous onsets | `start_bpm` = brief BPM, `tightness` 200; takes whose fitted BPM is >1.5 % off are rejected |
| Hallucinated vocals, rap or DJ scratches in an "instrumental" | genre prior (hip-hop, R&B…) | `[Instrumental]` lyrics + explicit "no singing, no speech, no vocal samples, no pre-recorded scratching"; reviewer inspects harmonic spectrograms |
| Muffled, lo-fi or over-compressed sound | weak production language | prompt ends with a mix paragraph (transients, controlled sub, stereo image, "not muffled") |
| Seamless loop clicks after encoding | AAC/MP3 priming and padding | ship WAV; previews (non-looping) may stay AAC |
| Install disappears | ACE-Step was installed under `/private/tmp`, purged on reboot | install at `~/Tools/ACE-Step-1.5` (the scripts' default `ACESTEP_HOME`); the skill warns about `/tmp` |
| `ace-server.sh start` times out with `/health` 200 | upstream lazy-loads models (`models_initialized` stays false) | the script exports `ACESTEP_NO_INIT=false` for eager loading |
| Lost renders | `/tmp` stage, no resume | stage under `~/.cache/soundlines-loops/<slug>`; renders resume per seed and write atomically |
| Hung requests | XL takes ~7 min per seed | 30 min per-take deadline with 3 s polling; `/query_result` status 2 surfaces the server error |
