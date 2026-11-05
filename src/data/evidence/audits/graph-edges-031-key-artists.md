# Key-artist edge audit 031

Scope: final four pending `key_artist_of` edges after the ranges assigned to batches 029 and 030. The sources were checked for a direct, central artist/genre relationship. Recommendations only; graph, shared tracker, and per-edge evidence notes were not edited.

| Graph ID | Verdict | Confidence | Sources checked | Finding / caveat |
|---|---|---|---|---|
| `key:yellowman-dancehall` | Keep; raise | high | [Jamaica Observer, “Yellowman broke the colour barrier”](https://www.jamaicaobserver.com/2022/09/23/yellowman-broke-the-colour-barrier/); [AllMusic biography](https://www.allmusic.com/artist/king-yellow-mn0000681340) | Jamaican reporting identifies him as arguably dancehall’s greatest deejay; AllMusic calls him Jamaica’s first dancehall superstar and says his early-1980s success helped establish dancehall. This is a central, historically important association. |
| `key:ying-yang-twins-crunk` | Keep; raise | high | [AllMusic biography](https://www.allmusic.com/artist/p392373); [DDEX genre definition, Crunk](https://service.ddex.net/dd/DD-AVS-CURRENT/dd/ddex_Crunk.html) | AllMusic says the Atlanta duo rose to the forefront of the crunk explosion; DDEX identifies “Get Low” by Lil Jon and the Ying Yang Twins as an archetypal crunk recording. Strong fit, though their broader classification also includes Southern/party rap. |
| `key:youssou-ndour-mbalax` | Keep | high | [Oxford Bibliographies in Music, “Youssou N’Dour”](https://academic.oup.com/reference/62400/reference-article-abstract/561714377?login=false); [Encyclopaedia Britannica biography](https://www.britannica.com/biography/Youssou-NDour) | Oxford’s scholarly overview says N’Dour was among the musicians who developed mbalax and that scholars credit him with naming and popularizing it. The edge is strongly supported and central. |
| `key:zeppelin-hard-rock` | Keep cautiously | medium | [Rock & Roll Hall of Fame, Led Zeppelin](https://rockhall.com/inductees/led-zeppelin%2B/); [AllMusic artist profile](https://www.allmusic.com/artist/led-zeppelin-mn0000139026) | The Rock Hall describes the band’s late-1960s heavy-blues roots and a forceful rock sound that helped pave the way for heavy metal. The classification is plausible and common, but this pass did not find a strong opened source explicitly naming hard rock; the cited Hall account supports adjacent heavy blues/rock context rather than the exact genre tag. Keep medium pending a direct source, and do not treat it as a complete description. |

## Source notes

- Prioritized Jamaican reporting, specialist/reference music sources for the Ying Yang Twins, Oxford scholarship for N’Dour, and the Rock Hall for Led Zeppelin. The exact hard-rock label for Zeppelin remains less directly substantiated than the other three edges.
- Confidence assesses the specific artist-to-genre fit, not whether the genre alone summarizes the artist’s full career.
