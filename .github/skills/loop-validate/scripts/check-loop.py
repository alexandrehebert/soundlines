"""Deterministic quality gate for ACE-Step loops (and screening of raw takes).

    $ACESTEP_HOME/.venv/bin/python check-loop.py <brief.json> <file.wav> [...] [--takes] [--png-dir DIR]

Loop mode (default) checks a shipped loop: exact length, tempo, seamless wrap, level, clipping,
mono-compatible low end, stable bars, no dropouts, no vocal-like content.
--takes screens raw 36 s renders before extraction (tempo, clipping, vocal-like content, dropouts).
Writes a mel + harmonic spectrogram PNG per file (loops are tiled twice so the seam is visible).
Exit code 1 if any file FAILs. Thresholds are calibrated on the shipped hip-hop loop and its takes;
change them only with new evidence, never to make one asset pass.
"""
import json
import sys
from pathlib import Path

import librosa
import librosa.display
import matplotlib
import numpy as np
import soundfile as sf

matplotlib.use("Agg")
import matplotlib.pyplot as plt

args = sys.argv[1:]
takes_mode = "--takes" in args
png_dir = None
if "--png-dir" in args:
    png_dir = Path(args[args.index("--png-dir") + 1])
    del args[args.index("--png-dir"):args.index("--png-dir") + 2]
args = [a for a in args if a != "--takes"]
brief = json.loads(Path(args[0]).read_text())
files = [Path(a) for a in args[1:]]
SR = 22050

# (metric, comparison, limit, severity)
LOOP_RULES = [
    ("length_error_ms", "<=", 1.0, "FAIL"),
    ("tempo_error_pct", "<=", 1.0, "FAIL"),
    ("wrap_jump_ratio", "<=", 1.0, "FAIL"),
    ("peak_dbfs", "<=", -0.9, "FAIL"),
    ("peak_dbfs", ">=", -1.1, "FAIL"),
    ("clipped_samples", "<=", 0, "FAIL"),
    ("dc_offset", "<=", 0.002, "FAIL"),
    ("rms_dbfs", ">=", -20.0, "WARN"),
    ("rms_dbfs", "<=", -10.0, "WARN"),
    ("bar_rms_cv", "<=", 0.15, "FAIL"),
    ("longest_dropout_ms", "<=", 250, "FAIL"),
    ("low_end_correlation", ">=", 0.8, "WARN"),
    # Heuristic only (instrumental references measure 0.001-0.04, harmonium-led qawwali 0.098);
    # a WARN means "inspect the harmonic spectrogram", not "contains vocals".
    ("vocal_band_ratio", "<=", 0.08, "WARN"),
    ("high_band_db", ">=", -38.0, "WARN"),
]
TAKE_RULES = [
    ("tempo_error_pct", "<=", 1.5, "FAIL"),
    ("clipped_samples", "<=", 0, "WARN"),
    ("longest_dropout_ms", "<=", 400, "FAIL"),
    ("vocal_band_ratio", "<=", 0.08, "WARN"),
    ("high_band_db", ">=", -38.0, "WARN"),
]


def fitted_bpm(y):
    onset = librosa.onset.onset_strength(y=y, sr=SR, hop_length=128)
    _, beats = librosa.beat.beat_track(onset_envelope=onset, sr=SR, hop_length=128,
                                       start_bpm=brief["bpm"], tightness=200)
    times = librosa.frames_to_time(beats, sr=SR, hop_length=128)
    if len(times) < 4:
        return 0.0
    index = np.arange(len(times))
    period, offset = np.polyfit(index, times, 1)
    keep = np.abs(times - (offset + period * index)) < 0.04
    period, _ = np.polyfit(index[keep], times[keep], 1)
    return 60 / period


def measure(path):
    audio, rate = sf.read(path, always_2d=True)
    if audio.shape[1] == 1:
        audio = np.repeat(audio, 2, axis=1)
    mono = audio.mean(axis=1)
    beats = brief["bars"] * brief["meter"]
    # Tile loops so beat tracking and spectra see the wrap like the player does.
    analysed = audio if takes_mode else np.concatenate([audio] * 3)
    y = librosa.resample(analysed.mean(axis=1), orig_sr=rate, target_sr=SR)
    bpm = fitted_bpm(y)
    harmonic, _ = librosa.effects.hpss(y)
    spec = np.abs(librosa.stft(harmonic, n_fft=2048)) ** 2
    freqs = librosa.fft_frequencies(sr=SR, n_fft=2048)
    full = np.abs(librosa.stft(y, n_fft=2048)) ** 2
    window = round(0.05 * rate)
    # Takes routinely open and end with silence; only the window extract-loop.py may cut from matters.
    body = mono[3 * rate:len(mono) - 5 * rate] if takes_mode else mono
    frames = [np.sqrt(np.mean(body[i:i + window] ** 2)) for i in range(0, len(body) - window, window)]
    quiet, longest = 0, 0
    for level in frames:
        quiet = quiet + 1 if 20 * np.log10(level + 1e-9) < -50 else 0
        longest = max(longest, quiet)
    low = librosa.resample(audio.T, orig_sr=rate, target_sr=2000)
    b = np.fft.rfftfreq(low.shape[1], 1 / 2000)
    lowpass = [np.fft.irfft(np.fft.rfft(ch) * (b < 150), n=low.shape[1]) for ch in low]
    diffs = np.abs(np.diff(audio, axis=0))
    m = {
        "seconds": round(len(audio) / rate, 4),
        "fitted_bpm": round(bpm, 3),
        "tempo_error_pct": round(abs(bpm - brief["bpm"]) / brief["bpm"] * 100, 3),
        "peak_dbfs": round(float(20 * np.log10(np.abs(audio).max() + 1e-12)), 2),
        "rms_dbfs": round(float(20 * np.log10(np.sqrt(np.mean(mono ** 2)) + 1e-12)), 2),
        "clipped_samples": int((np.abs(audio) > 0.999).sum()),
        "longest_dropout_ms": longest * 50,
        "vocal_band_ratio": round(float(spec[(freqs > 1000) & (freqs < 4000)].sum() / spec.sum()), 4),
        "high_band_db": round(float(10 * np.log10(full[freqs > 8000].sum() / full.sum() + 1e-12)), 2),
        "low_end_correlation": round(float(np.corrcoef(lowpass[0], lowpass[1])[0, 1]), 3),
    }
    if not takes_mode:
        expected = beats * 60 / brief["bpm"]
        bars = [float(np.sqrt(np.mean(p ** 2))) for p in np.array_split(mono, brief["bars"])]
        m |= {
            "length_error_ms": round(abs(len(audio) / rate - expected) * 1000, 3),
            # Wrap discontinuity relative to the loop's own 99.9th-percentile sample step.
            "wrap_jump_ratio": round(float(np.abs(audio[0] - audio[-1]).max() / np.percentile(diffs, 99.9)), 3),
            "dc_offset": round(float(np.abs(audio.mean(axis=0)).max()), 5),
            "bar_rms_cv": round(float(np.std(bars) / np.mean(bars)), 4),
        }
    if png_dir:
        png_dir.mkdir(parents=True, exist_ok=True)
        fig, axes = plt.subplots(2, 1, figsize=(16, 7))
        shown = y if takes_mode else y[: len(y) * 2 // 3]
        mel = librosa.power_to_db(librosa.feature.melspectrogram(y=shown, sr=SR, n_mels=128), ref=np.max)
        librosa.display.specshow(mel, sr=SR, x_axis="time", y_axis="mel", ax=axes[0])
        axes[0].set_title(f"{path.name} mel" + ("" if takes_mode else " (tiled x2, seam at middle)"))
        hshown = harmonic if takes_mode else harmonic[: len(harmonic) * 2 // 3]
        hmel = librosa.power_to_db(librosa.feature.melspectrogram(y=hshown, sr=SR, n_mels=128, fmax=5000),
                                   ref=np.max)
        librosa.display.specshow(hmel, sr=SR, x_axis="time", y_axis="mel", fmax=5000, ax=axes[1])
        axes[1].set_title("harmonic part 0-5 kHz: sung/spoken vocals show as wavy, gliding formant harmonics")
        fig.tight_layout()
        fig.savefig(png_dir / f"{path.stem}.png", dpi=70)
        plt.close(fig)
    return m


def judge(m):
    findings = []
    for metric, op, limit, severity in TAKE_RULES if takes_mode else LOOP_RULES:
        value = m[metric]
        if not (value <= limit if op == "<=" else value >= limit):
            findings.append(f"{severity} {metric}={value} (needs {op} {limit})")
    verdict = "FAIL" if any(f.startswith("FAIL") for f in findings) else "WARN" if findings else "PASS"
    return verdict, findings


report, failed = {}, False
for path in files:
    metrics = measure(path)
    verdict, findings = judge(metrics)
    failed |= verdict == "FAIL"
    report[str(path)] = {"verdict": verdict, "findings": findings, "metrics": metrics}
print(json.dumps(report, indent=2))
sys.exit(1 if failed else 0)
