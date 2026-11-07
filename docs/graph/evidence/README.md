# Evidence and audits / Preuves et audits

[English](#english) · [Français](#français)

## English

This is the research trail behind Soundlines' music graph: which sources were
checked, what they support, and where a claim needed qualification, correction
or removal. It is not a blanket certification that every entry is settled.

### Start with a real example

The [Chicago house and disco evidence note](./edges/lineage__chicago-house-disco.md)
documents one connection shown in the app. The checked sources support disco as
one of Chicago house's roots, not its sole origin. The note records the
relationship type, medium confidence, the finding and the sources checked.

### What is in this folder?

| Resource | What you will find |
| --- | --- |
| [Entry notes](./nodes/) | Sources and assessments for genres, artists, instruments and other entries, grouped by type. |
| [Connection notes](./edges/) | Evidence for individual relationships, including their scope, type and editorial caveats. Historical removal notes are retained here too. |
| [Batch audits](./audits/) | Reviews of groups of claims, with findings and recommendations. An audit may propose changes without applying them to the graph. |
| [Live-edge coverage tracker](./audits/graph-edge-coverage.csv) | One row per current connection, linking its type and confidence to its evidence note. |
| [Festival coverage](./festivals.md) | The festival selection, chronology anchors and limitations. |
| [Disconnected entries](./disconnected-entries.md) | Standalone entries and unresolved attributions kept without inventing connections. |
| [Removed or retyped connections](./graph-edge-removals.md) | Reasons for historical corrections, with pointers to disposition notes. |
| [Source-fetch log](./fetch-status.jsonl) | A machine-readable record of source access attempts; successful access alone does not verify a claim. |

### How to read an evidence note

- **Graph ID** identifies the entry or connection, independently of its displayed name.
  Entry notes use `nodes/<type>/<slug>.md`; connection filenames replace `:` with `__`.
- **Reviewed** or a dated **Review status** records a source review. A note marked
  `Pending source review` is a placeholder, not a completed fact-check.
- **Finding** explains what the sources establish and what remains uncertain.
  A source about a genre or artist does not automatically prove a specific relationship.
- **Confidence** (`low`, `medium`, `high`) is an editorial assessment of evidence
  strength, not a probability or a count of citations.
- **Sources checked** lets you follow the references and assess the claim yourself.
  Older audits and removal notes are historical records; check the current
  [graph data](../../../src/data/graph.json) and linked evidence for the live state.

Automatic checks validate structure and evidence bookkeeping, not historical
truth. For the review process and source policy, see
[Data and contribution workflow](../../DATA.md); for relationship meanings and
evidence conventions, see [Graph documentation](../../GRAPH.md).

## Français

Ce dossier conserve la trace des recherches derrière le graphe musical de
Soundlines : sources consultées, faits qu'elles étayent et raisons de nuancer,
corriger ou supprimer une affirmation. Il ne certifie pas que toutes les
entrées sont définitivement établies.

### Commencer par un exemple concret

La [note sur la house de Chicago et le disco](./edges/lineage__chicago-house-disco.md)
documente un lien visible dans l'application. Les sources vérifiées présentent
le disco comme l'une des racines de la house de Chicago, pas comme son unique
origine. La note précise le type de relation, la confiance moyenne, le constat
et les sources consultées. Les notes de recherche sont rédigées en anglais.

### Que contient ce dossier ?

| Ressource | Ce qu'on y trouve |
| --- | --- |
| [Notes des entrées](./nodes/) | Sources et constats sur les genres, artistes, instruments et autres entrées, regroupés par type. |
| [Notes des liens](./edges/) | Preuves de chaque relation, portée de l'affirmation et réserves éditoriales. Les notes de suppression sont aussi conservées. |
| [Audits par lots](./audits/) | Relectures de groupes d'affirmations, avec constats et recommandations. Une recommandation n'est pas nécessairement déjà appliquée au graphe. |
| [Suivi des liens actuels](./audits/graph-edge-coverage.csv) | Une ligne par relation actuelle, avec son type, sa confiance et sa note de preuves. |
| [Couverture des festivals](./festivals.md) | Sélection des festivals, repères chronologiques et limites. |
| [Entrées sans lien](./disconnected-entries.md) | Entrées autonomes et attributions non résolues, conservées sans inventer de relations. |
| [Liens supprimés ou requalifiés](./graph-edge-removals.md) | Motifs des corrections historiques et renvois vers les notes correspondantes. |
| [Journal d'accès aux sources](./fetch-status.jsonl) | Tentatives d'accès aux références ; réussir à ouvrir une page ne suffit pas à vérifier une affirmation. |

### Lire une note de preuves

- **Graph ID** est l'identifiant stable de l'entrée ou du lien. Les notes des
  entrées suivent `nodes/<type>/<slug>.md` ; les noms de fichiers des liens
  remplacent `:` par `__`.
- **Reviewed** ou **Review status** avec une date signale une relecture des
  sources. `Pending source review` indique une note en attente, pas une
  vérification terminée.
- **Finding** explique ce que les sources établissent et les incertitudes.
  Une page sur un genre ou un artiste ne prouve pas à elle seule une relation précise.
- **Confidence** (`low`, `medium`, `high`) exprime une appréciation éditoriale de
  la solidité des preuves, pas une probabilité ni un nombre de citations.
- **Sources checked** permet de consulter les références. Les anciens audits
  et notes de suppression restent des archives : pour l'état actuel, consulter
  les [données du graphe](../../../src/data/graph.json) et les notes associées.

Les contrôles automatiques vérifient la structure et le suivi des preuves, pas
la vérité historique. Voir le [processus de contribution](../../DATA.md) pour
la relecture et les sources acceptées, et la
[documentation du graphe](../../GRAPH.md) pour le sens des relations et les
conventions des notes.
