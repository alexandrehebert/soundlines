"""Extract a ten-second stereo preview from an ACE-Step render."""
import sys

import numpy as np
import soundfile as sf

source, target = sys.argv[1:]
with sf.SoundFile(source) as audio:
    sample_rate = audio.samplerate
    audio.seek(10 * sample_rate)
    excerpt = audio.read(10 * sample_rate, always_2d=True)

if excerpt.shape != (10 * sample_rate, 2):
    raise ValueError("Expected a complete ten-second stereo excerpt")
if not np.isfinite(excerpt).all() or np.max(np.abs(excerpt)) < 0.01:
    raise ValueError("The excerpt contains invalid or near-silent audio")

fade = np.linspace(0, 1, sample_rate // 40)[:, None]
excerpt[:len(fade)] *= fade
excerpt[-len(fade):] *= fade[::-1]
sf.write(target, excerpt, sample_rate, subtype="PCM_24")
