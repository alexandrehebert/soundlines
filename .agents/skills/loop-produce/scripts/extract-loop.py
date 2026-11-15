"""Cut the best seamless N-bar loop from a folder of takes on an exact, regression-fitted beat grid.

    $ACESTEP_HOME/.venv/bin/python extract-loop.py <brief.json> <takes-dir> <out.wav> [report.json]

Every grid downbeat candidate in every take is scored (lower is better) on:
  seam         energy difference between the loop start and the audio right after its end
  consistency  mel-profile difference between the loop's two halves (no section change inside)
  dynamics     bar-to-bar RMS variation (no build, drop or fade inside)
Output: stereo PCM16 WAV at the source rate, exactly bars*meter beats long, -1 dBFS peak,
DC removed, 8 ms wrap crossfade. Keep WAV: AAC/MP3 encoder padding breaks gapless looping.
"""
import json
import sys
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

brief = json.loads(Path(sys.argv[1]).read_text())
folder, target = Path(sys.argv[2]), Path(sys.argv[3])
report_path = Path(sys.argv[4]) if len(sys.argv) > 4 else None
SR = 22050
HEAD, TAIL = 3.0, 5.0  # skip ACE-Step's intro and ending regions
beats_in_loop = brief["bars"] * brief["meter"]
candidates, rejected = [], {}

for source in sorted(folder.glob("*.wav")):
    audio, rate = sf.read(source, always_2d=True)
    seconds = len(audio) / rate
    y = librosa.resample(audio.mean(axis=1), orig_sr=rate, target_sr=SR)
    onset = librosa.onset.onset_strength(y=y, sr=SR, hop_length=128)
    # start_bpm + high tightness keep the tracker on the brief's tempo instead of half/double time.
    _, beats = librosa.beat.beat_track(onset_envelope=onset, sr=SR, hop_length=128,
                                       start_bpm=brief["bpm"], tightness=200)
    times = librosa.frames_to_time(beats, sr=SR, hop_length=128)
    times = times[(times > 1) & (times < seconds - TAIL - 0.5)]
    if len(times) < beats_in_loop:
        rejected[source.stem] = "too few beats tracked"
        continue
    index = np.arange(len(times))
    period, offset = np.polyfit(index, times, 1)
    keep = np.abs(times - (offset + period * index)) < 0.04
    period, offset = np.polyfit(index[keep], times[keep], 1)
    bpm = 60 / period
    if abs(bpm - brief["bpm"]) / brief["bpm"] > 0.015:
        rejected[source.stem] = f"fitted {bpm:.2f} BPM, brief {brief['bpm']}"
        continue
    length = round(beats_in_loop * period * rate)
    mel = librosa.power_to_db(librosa.feature.melspectrogram(y=y, sr=SR, hop_length=512, n_mels=64))
    for beat_time in offset + period * np.arange(-2, int(seconds / period) + 2):
        # Snap each grid beat to the nearest real transient for a clean downbeat cut.
        frame = librosa.time_to_frames(beat_time, sr=SR, hop_length=128)
        window = onset[max(frame - 6, 0):frame + 7]
        if not len(window):
            continue
        attack = librosa.frames_to_time(max(frame - 6, 0) + int(np.argmax(window)), sr=SR, hop_length=128)
        start = round((attack - 0.012) * rate)
        end = start + length
        if start < HEAD * rate or end > (seconds - TAIL) * rate:
            continue
        excerpt = audio[start:end]
        w = round(0.3 * rate)
        a, b = audio[start:start + w], audio[end:end + w]
        seam = float(np.mean((a - b) ** 2) / (np.mean(a ** 2) + np.mean(b ** 2) + 1e-9))
        s, e = librosa.time_to_frames([start / rate, end / rate], sr=SR, hop_length=512)
        half = (e - s) // 2
        consistency = float(np.mean(np.abs(mel[:, s:s + half].mean(axis=1) - mel[:, s + half:e].mean(axis=1))))
        bars = [float(np.sqrt(np.mean(p ** 2))) for p in np.array_split(excerpt, brief["bars"])]
        dynamics = float(np.std(bars) / np.mean(bars))
        candidates.append(dict(score=seam + 0.1 * consistency + dynamics, seed=source.stem, start=start,
                               end=end, rate=rate, bpm=bpm, seam=seam, consistency=consistency,
                               dynamics=dynamics, path=source))

if not candidates:
    raise SystemExit(f"No loop candidates. Rejected takes: {json.dumps(rejected)}")
candidates.sort(key=lambda c: c["score"])
best = candidates[0]
audio, rate = sf.read(best["path"], always_2d=True)
start, end = best["start"], best["end"]
loop = audio[start:end].copy()
crossfade = round(rate * 0.008)
fade = np.linspace(0, 1, crossfade)[:, None]
# Fade the tail into the audio just before the loop start so the wrap is continuous.
loop[-crossfade:] = loop[-crossfade:] * (1 - fade) + audio[start - crossfade:start] * fade
loop -= loop.mean(axis=0)
loop *= 10 ** (-1.0 / 20) / np.max(np.abs(loop))
target.parent.mkdir(parents=True, exist_ok=True)
sf.write(target, loop, rate, subtype="PCM_16")

report = {
    "brief": brief["slug"],
    "profile": "draft" if folder.name == "drafts" else "final",
    "source_seed": int(best["seed"]),
    "source_start_seconds": round(start / rate, 4),
    "duration_seconds": round(len(loop) / rate, 4),
    "fitted_bpm": round(best["bpm"], 3),
    "loop_bpm": round(beats_in_loop * 60 * rate / len(loop), 3),
    "sample_rate": rate,
    "candidates_compared": len(candidates),
    "rejected_takes": rejected,
    "top": [{"seed": int(c["seed"]), "start": round(c["start"] / c["rate"], 3), "score": round(c["score"], 4),
             "seam": round(c["seam"], 4), "consistency": round(c["consistency"], 4),
             "dynamics": round(c["dynamics"], 4)} for c in candidates[:8]],
}
text = json.dumps(report, indent=2) + "\n"
if report_path:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(text)
print(text, end="")
