export { PROJECT_SITE_URL as siteUrl, REPOSITORY_URL as repository } from '../../src/projectLinks.ts'

export const locales = ['en', 'fr'] as const
export type Locale = (typeof locales)[number]
export const slugs = ['index', 'graph', 'artwork', 'audio', 'contribute'] as const
export type Slug = (typeof slugs)[number]

export type Page = {
  label: string
  title: string
  intro: string
  sections: [title: string, text: string][]
  steps?: [title: string, description: string][]
  command?: string
  showcase?: boolean
  /** Repository-relative path (optionally with #anchor) and link text. */
  resources: [path: string, title: string][]
}

export type Copy = {
  skip: string
  navigation: string
  language: string
  eyebrow: string
  source: string
  next: string
  resources: string
  workflow: string
  footer: string
  docsNote: string
  copyCommand: string
  copied: string
  pages: Record<Slug, Page>
}

export const copy: Record<Locale, Copy> = {
  en: {
    skip: 'Skip to content', navigation: 'Project guide', language: 'Language',
    eyebrow: 'Music history, connected.', source: 'Explore the source', next: 'Inside the project',
    resources: 'Go deeper', workflow: 'From idea to reviewed contribution',
    footer: 'A curated atlas, not an exhaustive history. Sources, uncertainty, and human judgment matter.',
    docsNote: 'Detailed technical guides live in the repository and are currently in English.',
    copyCommand: 'Copy', copied: 'Copied',
    pages: {
      index: {
        label: 'Overview', title: 'Music has no straight lines.',
        intro: 'Soundlines is an interactive atlas of musical lineages. Follow the connections between genres, artists, instruments, scenes, and the moments that changed how music is made and heard.',
        sections: [
          ['Explore connections, not just dates', 'Browse genre, artist, and instrument timelines; trace genre lineages in a bubble map; discover turning points in the History view. Search the catalogue, inspect citations, and share a selection through its URL. English and French, light and dark themes, and short audio previews make the atlas a place to explore.'],
          ['An open workshop', 'Behind the interface is a curated property graph, a set of instrument illustrations, and locally generated audio. This companion explains how those materials are researched, produced, checked, and reviewed. It is a guided introduction, not a mirror of the technical documentation.'],
          ['Editorial choices stay visible', 'The catalogue is representative, not exhaustive. Approximate dates are not exact invention dates. Confidence is an editorial assessment, not a probability. Prominence annotations are not popularity rankings, and missing evidence is never a reason to invent a relationship.'],
        ],
        resources: [['README.md', 'Project and local setup'], ['docs/EXPLORER.md', 'Using the explorer']],
      },
      graph: {
        label: 'Music graph', title: 'Evidence before edges.',
        intro: 'A connection is a historical claim. The graph keeps its meaning, direction, uncertainty, and sources together so that an attractive lineage does not replace a defensible one.',
        sections: [
          ['One graph, many perspectives', 'The canonical JSON property graph contains genres, artists, instruments, labels, places, tracks, scenes, events, and festivals. Stable type:slug IDs join nodes to typed edges. Periods can be approximate or bounded; source URLs and notes explain what an entry or relationship actually claims.'],
          ['Relationships have a vocabulary', 'Influence is not the same as derivation or being a subgenre. Fusion can have multiple parents; festival connections describe context rather than musical ancestry. Direction follows the relationship type, not whichever direction makes a diagram look tidy.'],
          ['Translations do not change history', 'The French overlay is keyed by the same stable IDs and translates descriptive text. It does not create entities, alter dates, or change relationships. Evidence notes, coverage registers, and generated review status accompany changes to the canonical graph.'],
          ['Mechanical correctness is only one gate', 'Tests check schema, IDs, endpoints, periods, edge directions, formatting, locale coverage, and evidence bookkeeping. Passing tests does not prove a historical claim: source verification and editorial review are separate steps.'],
        ],
        steps: [
          ['Research', 'Propose a sourced addition or correction; identify uncertainty and coverage gaps.'],
          ['Edit & translate', 'Update the graph, locale overlays, evidence, coverage, and review status together.'],
          ['Validate', 'Run the deterministic data and graph tests. Fix mechanical failures.'],
          ['Fact-check & review', 'Verify consequential claims against serious sources and review the complete change set.'],
        ],
        command: 'npm run review-status\nnpm run validate:graph',
        resources: [['docs/DATA.md', 'Data and contribution workflow'], ['docs/GRAPH.md', 'Schema and edge semantics'], ['docs/graph/evidence', 'Evidence and audits']],
      },
      artwork: {
        label: 'Instrument artwork', title: 'Recognisable at a glance.',
        intro: 'An instrument should look like itself, even at 24 pixels. References and anatomy come first; the house style gives the collection a shared visual language.',
        sections: [
          ['Start with the real instrument', 'Visual briefs record verified museum or photographic references, the silhouette, defining features and their counts, must-keep icon details, and look-alikes to avoid. The brief is checked before drawing begins.'],
          ['One identity, four surfaces', 'Each instrument ships as a monochrome icon, a banner, an avatar, and a transparent detail-header background. Generator-backed artwork uses a shared master drawing. Family palettes, a consistent tilt, and title-safe header masks keep the set coherent without making different instruments interchangeable.'],
          ['Measure it, then look at it', 'The deterministic gate checks coverage, SVG structure, references, palette, dimensions, icon extent, header transparency, and generator drift. Rendered sheets reveal problems that XML cannot: wrong proportions, ambiguous silhouettes, or unreadable details. Human Storybook sign-off remains a separate visual check.'],
        ],
        showcase: true,
        steps: [
          ['Source a brief', 'Document anatomy, references, and the features the small icon must retain.'],
          ['Draw four variants', 'Produce the master and its icon, banner, avatar, and header exports.'],
          ['Validate & compare', 'Check the files and compare rendered before/after sheets with the brief.'],
          ['Review & sign off', 'Review accuracy and recognisability, then request human approval in Storybook.'],
        ],
        command: 'node .github/skills/artwork-validate/scripts/check-artwork.mjs',
        resources: [['docs/DATA.md#instrument-artwork', 'Artwork workflow'], ['.github/skills/artwork-draw/SKILL.md', 'Drawing procedure and house style'], ['docs/artwork/briefs', 'Visual briefs'], ['scripts/artwork/generate-instrument-artwork.py', 'Master artwork generator']],
      },
      audio: {
        label: 'Audio production', title: 'Produced locally. Played instantly.',
        intro: 'Soundlines uses original, locally generated audio to suggest musical character—not to reproduce famous recordings. The app serves finished static files; visitors do not need an AI model or rendering server.',
        sections: [
          ['Two formats, two production paths', 'Seamless WAV loops power the landing turntable. Short catalogue previews play in genre detail panels. A ten-second excerpt is not automatically a seamless loop, so the workflows, briefs, and quality gates remain distinct.'],
          ['Seamless loops', 'Genre-specific briefs define tempo, meter, key, bar count, seeds, and an original instrumental prompt. The final text-to-music profile uses ACE-Step 1.5: standalone 4B language-model planning, then XL SFT rendering at 80 steps. Raw takes are screened, compared, and cut on a beat grid before wrap treatment and WAV export. Selection reports retain provenance.'],
          ['Catalogue previews', 'The historical preview workflow uses Turbo rendering at eight steps with a 1.7B planner, extracting the middle ten seconds of a 32-second performance. Brief, production, and review agents keep retakes staged separately. Review combines decoding and defect checks with calibrated scoring when available; unavailable scoring must be reported, not treated as a pass. Some selected previews use a higher-quality loop source instead.'],
          ['Quality is more than a seamless boundary', 'Loop checks measure length, tempo, level, clipping, DC, dropouts, bar stability, stereo low end, and spectral warning signs. Review also considers authenticity, originality, and provenance. Automated scores and spectrograms do not replace human listening approval.'],
          ['The two sides of the turntable', 'Dark theme plays the hip-hop loop; light theme plays a source-conditioned trap arrangement of the original phrase. The arrangement uses a cover task rather than claiming language-model-planned provenance. Switching sides preserves playback position and does not start paused audio.'],
        ],
        steps: [
          ['Brief', 'Define the musical target, format, and originality requirements.'],
          ['Produce', 'Render candidates locally; screen and extract the intended asset.'],
          ['Validate & review', 'Check measurable defects, provenance, and the brief; retake when needed.'],
          ['Listen & ship', 'Obtain human listening sign-off and serve the approved static asset.'],
        ],
        resources: [['docs/AUDIO.md', 'Audio formats and render provenance'], ['.github/skills/loop-produce/SKILL.md', 'Seamless-loop production'], ['.github/skills/preview-produce/SKILL.md', 'Catalogue-preview production'], ['docs/loops/briefs', 'Loop briefs and selection reports']],
      },
      contribute: {
        label: 'Contributing', title: 'Make the atlas more useful.',
        intro: 'A better citation, a corrected connection, a clearer translation, or a more recognisable instrument can matter as much as a new feature.',
        sections: [
          ['Run the project', 'Use Node.js 26, install dependencies with npm ci, and start Next.js with npm run dev. Docker Compose is an alternative for the app and Storybook. Audio-generation tools are optional: finished assets are already served by the app.'],
          ['Choose a bounded contribution', 'For data, propose a precise historical claim and serious sources. For artwork, begin with a visual brief. For audio, choose the correct preview or loop workflow. For interface work, keep English and French copy aligned and preserve keyboard access and both themes.'],
          ['AI-assisted, not automatically approved', 'Reusable skills describe procedures and specialised agents own research, editing, translation, production, validation, and review stages. These are tools invoked by a contributor, not background services or automatic approval pipelines. Deterministic gates and human judgment remain explicit.'],
          ['Leave a reviewable trail', 'Keep coupled files in sync, run the relevant tests, and explain evidence or production provenance in the change. Do not equate a passing mechanical gate with verified history, a recognisable drawing, or good-sounding audio. Open a pull request with a bounded scope and the checks you performed.'],
        ],
        command: 'npm ci\nnpm run dev\n\n# In a separate terminal\nnpm test\nnpm run lint\nnpm run build',
        resources: [['docs/INSTALLATION.md', 'Tool and environment setup'], ['docs/DEVELOPMENT.md', 'Development and deployment'], ['docs/ARCHITECTURE.md', 'Application architecture'], ['.github/agents', 'Specialised agents'], ['.github/skills', 'Reusable procedures']],
      },
    },
  },
  fr: {
    skip: 'Aller au contenu', navigation: 'Guide du projet', language: 'Langue',
    eyebrow: 'L’histoire de la musique, reliée.', source: 'Explorer le code', next: 'Dans les coulisses',
    resources: 'Pour aller plus loin', workflow: 'De l’idée à la contribution relue',
    footer: 'Un atlas éditorial, pas une histoire exhaustive. Les sources, les incertitudes et le jugement humain comptent.',
    docsNote: 'Les guides techniques détaillés sont dans le dépôt et sont actuellement en anglais.',
    copyCommand: 'Copier', copied: 'Copié',
    pages: {
      index: {
        label: 'Présentation', title: 'La musique ne suit pas une ligne droite.',
        intro: 'Soundlines est un atlas interactif des lignées musicales. Suivez les liens entre les genres, les artistes, les instruments, les scènes et les moments qui ont transformé la création et l’écoute de la musique.',
        sections: [
          ['Explorer les liens, pas seulement les dates', 'Parcourez les chronologies des genres, artistes et instruments ; suivez les lignées dans une carte de bulles ; découvrez les moments marquants dans la vue Histoire. Recherchez dans le catalogue, consultez les sources et partagez une sélection par son URL. Anglais et français, thèmes clair et sombre et extraits audio invitent à l’exploration.'],
          ['Un atelier ouvert', 'Derrière l’interface se trouvent un graphe éditorial, des illustrations d’instruments et des sons produits localement. Ce site explique comment ces matériaux sont documentés, fabriqués, contrôlés et relus. C’est une introduction guidée, pas une copie de la documentation technique.'],
          ['Des choix éditoriaux visibles', 'Le catalogue est représentatif, pas exhaustif. Une date approximative n’est pas une date d’invention exacte. La confiance est une appréciation éditoriale, pas une probabilité. Les annotations d’importance ne sont pas des classements de popularité ; un manque de preuves ne justifie jamais d’inventer un lien.'],
        ],
        resources: [['README.md', 'Projet et démarrage local'], ['docs/EXPLORER.md', 'Utiliser l’explorateur']],
      },
      graph: {
        label: 'Graphe musical', title: 'Des preuves avant les liens.',
        intro: 'Un lien est une affirmation historique. Le graphe associe son sens, sa direction, ses incertitudes et ses sources pour qu’une belle lignée reste défendable.',
        sections: [
          ['Un graphe, plusieurs regards', 'Le graphe de propriétés JSON canonique rassemble genres, artistes, instruments, labels, lieux, morceaux, scènes, événements et festivals. Des identifiants stables type:slug relient les nœuds par des arêtes typées. Les périodes peuvent être approximatives ou délimitées ; les URL sources et les notes précisent chaque affirmation.'],
          ['Un vocabulaire pour les relations', 'Une influence n’est ni une dérivation ni une relation de sous-genre. Une fusion peut avoir plusieurs parents ; les liens avec les festivals décrivent un contexte, pas une ascendance musicale. La direction dépend du type de relation, pas de l’apparence souhaitée du diagramme.'],
          ['La traduction ne change pas l’histoire', 'La surcouche française reprend les mêmes identifiants et traduit les textes descriptifs. Elle ne crée pas d’entités et ne modifie ni dates ni relations. Les notes de preuves, les registres de couverture et le statut de revue généré accompagnent les changements du graphe canonique.'],
          ['La conformité technique n’est qu’un contrôle', 'Les tests vérifient schéma, identifiants, extrémités, périodes, directions, formatage, traductions et suivi des preuves. Leur réussite ne démontre pas une affirmation historique : la vérification des sources et la revue éditoriale restent distinctes.'],
        ],
        steps: [
          ['Rechercher', 'Proposer un ajout ou une correction sourcée ; identifier les incertitudes et les lacunes.'],
          ['Éditer et traduire', 'Mettre à jour ensemble graphe, traductions, preuves, couverture et statut de revue.'],
          ['Valider', 'Exécuter les tests déterministes des données et du graphe. Corriger les défauts techniques.'],
          ['Vérifier et relire', 'Confronter les affirmations importantes à des sources sérieuses et relire l’ensemble du changement.'],
        ],
        command: 'npm run review-status\nnpm run validate:graph',
        resources: [['docs/DATA.md', 'Données et contributions'], ['docs/GRAPH.md', 'Schéma et sens des relations'], ['docs/graph/evidence', 'Preuves et audits']],
      },
      artwork: {
        label: 'Illustrations', title: 'Reconnaissable au premier regard.',
        intro: 'Un instrument doit rester identifiable, même à 24 pixels. Les références et l’anatomie passent avant le style commun qui unifie la collection.',
        sections: [
          ['Partir du véritable instrument', 'Les briefs visuels consignent des références muséales ou photographiques vérifiées, la silhouette, les caractéristiques et leur nombre, les détails indispensables à l’icône et les confusions à éviter. Le brief est contrôlé avant le dessin.'],
          ['Une identité, quatre supports', 'Chaque instrument possède une icône monochrome, une bannière, un avatar et un fond transparent pour l’en-tête de sa fiche. Les illustrations produites par le générateur partagent un dessin maître. Palettes par famille, inclinaison commune et masques préservant le titre assurent la cohérence sans rendre les instruments interchangeables.'],
          ['Mesurer, puis regarder', 'Le contrôle déterministe vérifie couverture, structure SVG, références, palette, dimensions, étendue des icônes, transparence et cohérence avec le générateur. Les planches rendues révèlent ce que le XML ne montre pas : proportions erronées, silhouettes ambiguës, détails illisibles. L’approbation humaine dans Storybook reste distincte.'],
        ],
        showcase: true,
        steps: [
          ['Documenter le brief', 'Décrire l’anatomie, les références et les détails à préserver dans la petite icône.'],
          ['Dessiner quatre variantes', 'Produire le maître et les exports icône, bannière, avatar et en-tête.'],
          ['Valider et comparer', 'Contrôler les fichiers et confronter les planches avant/après au brief.'],
          ['Relire et approuver', 'Examiner exactitude et lisibilité, puis demander l’approbation humaine dans Storybook.'],
        ],
        command: 'node .github/skills/artwork-validate/scripts/check-artwork.mjs',
        resources: [['docs/DATA.md#instrument-artwork', 'Processus des illustrations'], ['.github/skills/artwork-draw/SKILL.md', 'Procédure et style graphique'], ['docs/artwork/briefs', 'Briefs visuels'], ['scripts/artwork/generate-instrument-artwork.py', 'Générateur des dessins maîtres']],
      },
      audio: {
        label: 'Production audio', title: 'Produit localement. Écouté immédiatement.',
        intro: 'Soundlines utilise des sons originaux générés localement pour évoquer un caractère musical, pas pour reproduire des enregistrements célèbres. L’application sert des fichiers finalisés : aucun modèle ni serveur de rendu n’est nécessaire aux visiteurs.',
        sections: [
          ['Deux formats, deux méthodes', 'Des boucles WAV continues animent la platine d’accueil. De courts extraits se jouent dans les fiches des genres. Un extrait de dix secondes n’est pas forcément une boucle sans raccord : procédures, briefs et contrôles restent donc distincts.'],
          ['Les boucles continues', 'Les briefs définissent tempo, mesure, tonalité, nombre de mesures, graines et prompt instrumental original. Le profil final texte-vers-musique utilise ACE-Step 1.5 : planification séparée par le modèle de langage 4B, puis rendu XL SFT en 80 étapes. Les prises sont contrôlées, comparées et découpées sur une grille rythmique avant traitement du raccord et export WAV. Les rapports de sélection conservent la provenance.'],
          ['Les extraits du catalogue', 'La méthode historique utilise Turbo en huit étapes avec un planificateur 1.7B, puis extrait les dix secondes centrales d’une performance de 32 secondes. Les agents de brief, production et revue isolent les nouvelles prises. La revue combine décodage, recherche de défauts et notation calibrée lorsqu’elle est disponible ; son absence doit être signalée, pas considérée comme une réussite. Certains extraits retenus proviennent plutôt d’une boucle de qualité supérieure.'],
          ['La qualité dépasse le raccord', 'Les contrôles des boucles mesurent durée, tempo, niveau, écrêtage, composante continue, coupures, stabilité des mesures, basses stéréo et signaux spectraux suspects. La revue examine aussi authenticité, originalité et provenance. Les scores et spectrogrammes ne remplacent pas l’approbation par écoute humaine.'],
          ['Les deux faces de la platine', 'Le thème sombre joue la boucle hip-hop ; le thème clair joue son arrangement trap conditionné par la phrase originale. Cet arrangement utilise une tâche cover et ne revendique pas une planification par modèle de langage. Changer de face préserve la position de lecture et ne démarre pas un son en pause.'],
        ],
        steps: [
          ['Brief', 'Définir la cible musicale, le format et les exigences d’originalité.'],
          ['Production', 'Générer des candidats localement ; contrôler et extraire le fichier prévu.'],
          ['Validation et revue', 'Examiner défauts mesurables, provenance et brief ; refaire une prise si nécessaire.'],
          ['Écoute et livraison', 'Obtenir l’approbation humaine et servir le fichier statique validé.'],
        ],
        resources: [['docs/AUDIO.md', 'Formats et provenance audio'], ['.github/skills/loop-produce/SKILL.md', 'Production des boucles'], ['.github/skills/preview-produce/SKILL.md', 'Production des extraits'], ['docs/loops/briefs', 'Briefs et rapports de sélection']],
      },
      contribute: {
        label: 'Contribuer', title: 'Rendre l’atlas plus utile.',
        intro: 'Une meilleure source, une relation corrigée, une traduction plus claire ou un instrument plus reconnaissable peuvent compter autant qu’une nouvelle fonctionnalité.',
        sections: [
          ['Lancer le projet', 'Utilisez Node.js 26, installez les dépendances avec npm ci et lancez Next.js avec npm run dev. Docker Compose est une alternative pour l’application et Storybook. Les outils de génération audio sont facultatifs : l’application sert déjà les fichiers finalisés.'],
          ['Choisir une contribution délimitée', 'Pour les données, proposez une affirmation historique précise et des sources sérieuses. Pour le dessin, commencez par un brief visuel. Pour le son, choisissez la procédure adaptée : extrait ou boucle. Pour l’interface, alignez les textes anglais et français et préservez l’accès au clavier et les deux thèmes.'],
          ['Assisté par IA, pas approuvé automatiquement', 'Des skills réutilisables décrivent les procédures et des agents spécialisés prennent en charge recherche, édition, traduction, production, validation et revue. Ce sont des outils invoqués par un contributeur, pas des services permanents ni des pipelines d’approbation automatique. Les contrôles déterministes et le jugement humain restent explicites.'],
          ['Laisser une trace vérifiable', 'Synchronisez les fichiers liés, exécutez les tests pertinents et expliquez les preuves ou la provenance. Un contrôle technique réussi ne garantit ni l’histoire, ni la justesse d’un dessin, ni la qualité musicale. Ouvrez une pull request délimitée en indiquant les vérifications effectuées.'],
        ],
        command: 'npm ci\nnpm run dev\n\n# Dans un autre terminal\nnpm test\nnpm run lint\nnpm run build',
        resources: [['docs/INSTALLATION.md', 'Outils et environnement'], ['docs/DEVELOPMENT.md', 'Développement et déploiement'], ['docs/ARCHITECTURE.md', 'Architecture de l’application'], ['.github/agents', 'Agents spécialisés'], ['.github/skills', 'Procédures réutilisables']],
      },
    },
  },
}
