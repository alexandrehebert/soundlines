"""Prepare original-loop conditioning or extract source-aligned arrangement cycles.

    arrange-loop.py prepare <brief.json> <stage>
    arrange-loop.py extract <brief.json> <stage> <asset.wav> <report.json>
"""
import hashlib
import json
import sys
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf


def main():
    mode, brief_path, stage_path, *outputs = sys.argv[1:]
    if mode not in ("prepare", "extract") or (mode == "extract" and len(outputs) != 2):
        raise SystemExit(__doc__)
    brief = json.loads(Path(brief_path).read_text())
    source_path = Path(brief["arrangement"]["source"])
    info = sf.info(source_path)
    if info.samplerate != 48000 or info.subtype != "PCM_16" or info.channels != 2:
        raise ValueError("Arrangement source must be stereo 48 kHz PCM16.")
    source, rate = sf.read(source_path, always_2d=True)
    length = len(source)
    if not length:
        raise ValueError("Arrangement source is empty.")
    stage = Path(stage_path)
    digest = hashlib.sha256(source_path.read_bytes()).hexdigest()
    identity = {
        "source": brief["arrangement"]["source"],
        "source_sha256": digest,
        "source_frames": length,
        "sample_rate": rate,
        "brief_sha256": hashlib.sha256(Path(brief_path).read_bytes()).hexdigest(),
    }
    if mode == "prepare":
        stage.mkdir(parents=True, exist_ok=True)
        frames = brief["duration"] * rate
        conditioning = np.tile(source, (int(np.ceil(frames / length)), 1))[:frames]
        sf.write(stage / "source.wav", conditioning, rate, subtype="PCM_16")
        identity["conditioning_sha256"] = hashlib.sha256((stage / "source.wav").read_bytes()).hexdigest()
        (stage / "source.json").write_text(json.dumps(identity, indent=2) + "\n")
        print(json.dumps(identity, indent=2))
        return

    recorded = json.loads((stage / "source.json").read_text())
    if any(recorded[key] != value for key, value in identity.items()):
        raise ValueError("Source or brief changed after conditioning was prepared.")
    if hashlib.sha256((stage / "source.wav").read_bytes()).hexdigest() != recorded["conditioning_sha256"]:
        raise ValueError("Conditioning audio changed after preparation.")
    candidates = []
    chroma_source = chroma(source, rate)
    for take in sorted((stage / "takes").glob("*.wav")):
        request = json.loads(take.with_suffix(".request.json").read_text())
        if not (
            request["model"] == "acestep-v15-xl-sft"
            and request["inference_steps"] == 80
            and request["guidance_scale"] == 7
            and request["use_adg"]
            and not request["thinking"]
            and request["task_type"] == "cover"
            and request["prompt"] == brief["prompt"]
            and request["audio_cover_strength"] == brief["arrangement"]["strength"]
            and request["source_provenance"] == recorded
        ):
            raise ValueError(f"Arrangement provenance mismatch: {take}")
        audio, take_rate = sf.read(take, always_2d=True)
        if take_rate != rate:
            raise ValueError(f"Unexpected take sample rate: {take_rate}")
        # Only complete cycles at the original phrase position; skip the opening and ending.
        for start in range(length, len(audio) - length - 5 * rate + 1, length):
            excerpt = audio[start:start + length].copy()
            similarity = float(np.mean(np.sum(chroma_source * chroma(excerpt, rate), axis=0)))
            bars = [float(np.sqrt(np.mean(bar ** 2))) for bar in np.array_split(excerpt, brief["bars"])]
            if not min(bars) > 0:
                continue
            dynamics = float(np.std(bars) / np.mean(bars))
            candidates.append({
                "seed": int(take.stem), "start_frame": start,
                "chroma_cosine": similarity, "bar_rms_cv": dynamics,
                "score": 1 - similarity + dynamics, "path": take,
            })
    if not candidates:
        raise ValueError("No source-aligned arrangement candidates.")
    candidates.sort(key=lambda candidate: candidate["score"])
    best = candidates[0]
    audio, _ = sf.read(best["path"], always_2d=True)
    start = best["start_frame"]
    loop = audio[start:start + length].copy()
    crossfade = round(rate * 0.008)
    fade = np.linspace(0, 1, crossfade)[:, None]
    loop[-crossfade:] = loop[-crossfade:] * (1 - fade) + audio[start - crossfade:start] * fade
    loop -= loop.mean(axis=0)
    peak = np.max(np.abs(loop))
    if not np.isfinite(peak) or peak <= 0:
        raise ValueError("Arrangement has invalid or silent audio.")
    loop *= 10 ** (-1 / 20) / peak
    target, report_path = map(Path, outputs)
    target.parent.mkdir(parents=True, exist_ok=True)
    sf.write(target, loop, rate, subtype="PCM_16")
    report = {
        "brief": brief["slug"], "profile": "arrangement",
        **identity, "conditioning_sha256": recorded["conditioning_sha256"],
        "source_seed": best["seed"], "source_start_seconds": start / rate,
        "duration_seconds": length / rate, "loop_bpm": brief["bars"] * brief["meter"] * 60 * rate / length,
        "frames": length, "audio_cover_strength": brief["arrangement"]["strength"],
        "candidates_compared": len(candidates),
        "melody_review": "Human comparative listening required; see docs/AUDIO.md for approval. Chroma similarity is not proof of melody preservation.",
        "top": [{key: value for key, value in candidate.items() if key != "path"} for candidate in candidates[:8]],
    }
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


def chroma(audio, rate):
    mono = librosa.resample(audio.mean(axis=1), orig_sr=rate, target_sr=22050)
    harmonic = librosa.effects.harmonic(mono)
    features = librosa.feature.chroma_stft(y=harmonic, sr=22050, hop_length=256)
    return features / np.maximum(np.linalg.norm(features, axis=0, keepdims=True), 1e-12)


if __name__ == "__main__":
    main()
