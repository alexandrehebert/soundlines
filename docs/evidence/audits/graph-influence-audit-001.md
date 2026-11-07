# Influence edge audit — batch 001

Scope: pending `influences` edges not already assessed in prior audit ledgers. One edge remained eligible after excluding IDs already documented elsewhere. Checked 2026-11-05.

| Graph ID | Verdict | Confidence recommendation | Sources checked | Finding / caveat |
|---|---|---|---|---|
| `influence:acid-house-second-summer-of-love` | Keep; slightly reduce confidence | medium | [The Guardian, “The Second Summer of Love”](https://www.theguardian.com/music/2011/jun/15/second-summer-of-love); [British Culture Archive, “Acid House: The People’s Archive”](https://britishculturearchive.co.uk/acid-house/); [Jones & Walker Churchman, *Contemporary British History* (2024)](https://ueaeprints.uea.ac.uk/id/eprint/97031/) | The Guardian calls acid house the dominant sound of British clubland in 1988; the archive describes its spread through UK clubs and warehouse parties and says 1988 became known as the Second Summer of Love. The peer-reviewed article discusses the competing histories and memories of the UK acid-house/rave scene. This supports a strong association and scene-shaping role, but “influences” can imply a one-way causal relation when the scene was also constituted by acid house. Medium is better than high; an `associated_with` or `central_to` relation would be more exact if the graph supports one. |

## Summary

One previously unreviewed pending influence edge checked. The historic connection is strong, but its relation is closer to constitutive association than a clean one-way influence; retain only with that caveat and medium confidence.
