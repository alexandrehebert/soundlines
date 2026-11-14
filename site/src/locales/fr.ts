import { storybookUrl } from '../links.ts'
import type { LocalizedContent } from '../content.ts'

export const fr: LocalizedContent = {
  skip: 'Aller au contenu',
  navigation: 'Dans les coulisses',
  language: 'Langue',
  openApp: 'Ouvrir Soundlines',
  openDataTitle: 'Les données ouvertes sont dans Soundlines',
  openDataDescription: 'Explorez le jeu de données Soundlines dans l’application.',
  openDataLink: 'Explorer les données ouvertes',
  eyebrow: 'Les coulisses d’un atlas musical',
  source: 'Explorer le code',
  next: 'Visiter chaque atelier',
  resources: 'Pour aller plus loin',
  footer: 'Un atlas éditorial, pas une histoire exhaustive. Les sources, les incertitudes et le jugement humain comptent.',
  docsNote: 'Les guides techniques détaillés sont dans le dépôt et sont actuellement en anglais.',
  legend: 'Qui fait quoi',
  produces: 'Produit',
  result: 'Résultat final',
  backTo: 'retour à l’étape',
  example: 'Exemple réel',
  examples: 'Exemples réels',
  brief: 'Lire son brief',
  actors: {
    human: 'Personne',
    agent: 'Assistant IA',
    model: 'Modèle d’IA',
    script: 'Code',
    test: 'Contrôle automatique',
  },
  stats: [
    ['entries', 'entrées : genres, artistes, lieux…'],
    ['connections', 'liens documentés'],
    ['sources', 'liens vers des sources distinctes'],
    ['artworkFiles', 'dessins d’instruments'],
    ['evidenceNotes', 'notes de preuves'],
  ],
  pages: {
    index: {
      label: 'Présentation',
      title: 'La musique ne suit pas une ligne droite.',
      intro:
        'Soundlines est un atlas interactif des lignées musicales. Ce site ouvre les portes de l’atelier : d’où vient chaque information, comment chaque dessin et chaque son ont été fabriqués, et qui (ou quoi) les a vérifiés avant leur arrivée dans l’application.',
      overview: {
        title: 'Trois ateliers, un atlas',
        intro:
          'Rien dans Soundlines n’est aspiré en masse ni généré pendant la navigation. Chaque type de contenu suit sa propre chaîne de fabrication, et chaque chaîne se termine par des contrôles avant publication.',
        lanes: [
          ['Faits', ['Livres, archives, musées', 'Recherche et rédaction', 'Note de preuves', 'Tests automatiques', 'Vérification']],
          ['Dessins', ['Photos de musée', 'Brief visuel', 'Générateur de dessins', 'Contrôles de taille et de style', 'Regard humain']],
          ['Sons', ['Brief musical', 'Modèle d’IA sur un portable', 'Meilleure prise', 'Mesures audio', 'Écoute humaine']],
        ],
        destination: 'L’application Soundlines',
      },
      flows: [],
      sections: [
        [
          'Ce que montre l’application',
          'Des chronologies des genres, artistes et instruments, une carte de bulles de la filiation des genres, une vue Histoire des moments marquants et des sons de genres à écouter, en anglais, français, allemand, italien et espagnol. Chaque barre, bulle et lien à l’écran provient d’un seul fichier de données : ces pages expliquent donc tout ce que vous voyez.',
        ],
        [
          'Fabriqué avec des assistants IA, vérifié par des personnes',
          'Une grande partie de la recherche, de la rédaction, du dessin et du son a été réalisée avec des assistants IA qui suivent des procédures écrites et versionnées. Les assistants proposent, les contrôles automatiques mesurent, les personnes décident. Un test réussi ne prouve jamais qu’une date est juste, qu’un dessin est exact ou qu’une boucle sonne bien.',
        ],
        [
          'Honnête sur les incertitudes',
          'Le catalogue est représentatif, pas exhaustif. Une date approximative n’est pas une date d’invention exacte. La confiance est une appréciation éditoriale, pas une probabilité. L’intensité des barres n’est pas un classement de popularité ; un manque de preuves ne justifie jamais d’inventer un lien.',
        ],
      ],
      resources: [
        ['README.md', 'Projet et démarrage local'],
        ['docs/EXPLORER.md', 'Utiliser l’explorateur'],
      ],
    },
    graph: {
      label: 'Données musicales',
      title: 'D’où viennent les faits.',
      intro:
        'Chaque genre, artiste et lien de Soundlines est une petite affirmation accompagnée de ses sources. Voici le trajet de l’une d’elles, d’un rayon de bibliothèque jusqu’à une ligne sur votre écran.',
      flows: [
        {
          title: 'Le parcours d’un lien',
          caption: 'D’une question ouverte à un lien publié et sourcé. Les sources sont lues pour vérifier une affirmation ; leur contenu n’est jamais copié dans l’application.',
          steps: [
            {
              actor: 'agent',
              title: 'Repérer un manque',
              text: 'Un assistant de recherche compare le graphe à l’histoire qu’il devrait couvrir (régions, décennies ou genres absents) et propose des ajouts sourcés. Il ne modifie rien.',
              output: ['doc', 'Proposition sourcée'],
              preview: { kind: 'note', title: 'Proposition', lines: ['Chicago house, dérivée du disco', 'Fin des années 1970 – années 1980', '3 sources : radio publique, PBS, un musée d’État'] },
            },
            {
              actor: 'human',
              title: 'Décider quoi ajouter',
              text: 'Le mainteneur choisit les propositions à retenir et tranche les questions de jugement : type de relation, période approximative, confiance.',
              output: ['decision', 'Liste des ajouts retenus'],
              preview: { kind: 'checks', items: ['Ajouter le lien', 'Type : dérivé de, pas seulement une influence', 'Confiance : moyenne'] },
            },
            {
              actor: 'script',
              title: 'Consulter les sources',
              text: 'Chaque page citée est téléchargée et le résultat journalisé ({fetchAttempts} tentatives à ce jour). Si le serveur refuse, une autre méthode est tentée.',
              output: ['log', 'Journal de consultation, une ligne par tentative'],
              preview: { kind: 'log', items: [['ok', 'wcmu.org · page complète'], ['ok', 'pbs.org · page complète'], ['blocked', 'academic.oup.com · bloqué (403)']] },
            },
            {
              actor: 'human',
              title: 'Bloquée ? L’ouvrir à la main',
              text: 'Beaucoup d’éditeurs bloquent les lecteurs automatiques ({fetchBlocked} tentatives) : {fetchBrowser} pages ont été ouvertes dans un navigateur ordinaire. Un extrait de recherche ne suffit jamais.',
              output: ['doc', 'Pages lues par une personne'],
              preview: { kind: 'page', title: '909originals.com', lines: ['« House », The Face, 1986 (PDF)', 'Ouvert dans un navigateur'] },
            },
            {
              actor: 'agent',
              title: 'Le consigner',
              text: 'Un assistant d’édition met à jour le fichier de données, les traductions et une note de preuves indiquant ce que chaque source établit, et ce qu’elle n’établit pas. Les descriptions sont rédigées avec ses propres mots.',
              output: ['data', 'graph.json, traductions et note de preuves'],
              preview: { kind: 'link', from: 'Disco', to: 'Chicago house', type: 'dérivé de', confidence: 'moyenne' },
            },
            {
              actor: 'test',
              title: 'Contrôles automatiques',
              text: 'Les tests refusent identifiants cassés, liens vers le vide, dates impossibles, directions erronées, traductions ou preuves manquantes.',
              output: ['report', 'Rapport réussi ou échoué'],
              preview: { kind: 'checks', items: ['Identifiants et liens valides', 'Dates et direction cohérentes', 'Traductions présentes', 'Note de preuves présente'] },
            },
            {
              actor: 'agent',
              title: 'Rouvrir les sources',
              text: 'La vérification des sources peut recommander une correction, une baisse de confiance, un autre type de lien ou un retrait. En mode revue, les constats sont transmis à la personne chargée de la revue, qui renvoie les corrections nécessaires à l’agent d’édition.',
              output: ['doc', 'Constats de vérification'],
              preview: { kind: 'note', title: 'Note de preuves', lines: ['Source vérifiée, formulation corrigée', 'Dérivé de · moyenne', 'Relu le 2026-11-05'] },
            },
            {
              actor: 'human',
              title: 'Relire et publier',
              text: 'L’ensemble du changement est relu puis fusionné. L’application lit alors le fichier mis à jour, sans base de données ni collecte en direct.',
              output: ['app', 'Lien en ligne dans l’application'],
              preview: { kind: 'screen', shot: 'graph', alt: 'La Chicago house dans la chronologie des genres de Soundlines, avec sa ligne vers le disco' },
            },
          ],
          loops: [
            { from: [6, 7, 8], to: 5, label: 'Échec de la validation, preuve insuffisante ou problème relevé en revue' },
          ],
        },
      ],
      sections: [
        [
          'Un fichier, neuf types d’entrées',
          'Toutes les données tiennent dans un fichier JSON : {entries} entrées ({genres} genres, {artists} artistes, {instruments} instruments, ainsi que labels, lieux, morceaux, scènes, événements et festivals) reliées par {connections} liens typés. Chaque entrée possède un identifiant stable, par exemple genre:chicago-house, que traductions, notes de preuves et application utilisent pour la désigner.',
        ],
        [
          'Ce qu’est une bonne source',
          'Ouvrages et revues scientifiques, musées, archives et bibliothèques, références musicales reconnues, médias sérieux et archives officielles. Wikipédia peut servir de point de départ ou de recoupement, jamais de seul appui quand de meilleures sources existent. Blogs, forums, wikis de fans et pages de résultats de recherche sont refusés.',
        ],
        [
          'Les liens ont un sens',
          'Une influence n’est pas une filiation ; un sous-genre n’est pas une fusion ; un lien avec un festival décrit un contexte, pas une ascendance. Chaque lien a un type, une direction, un niveau de confiance (une appréciation éditoriale, pas une probabilité) et souvent une note qui précise la nuance. {evidenceNotes} notes de preuves consignent ce qui a été vérifié.',
        ],
        [
          'Traduire sans réécrire l’histoire',
          'Chaque langue traduite possède un fichier séparé, indexé par les mêmes identifiants. Il ne traduit que les mots : il ne peut ni ajouter d’entrées, ni changer de dates, ni déplacer de liens. Les traductions assistées par machine font l’objet de vérifications du vocabulaire musical et de corrections éditoriales.',
        ],
      ],
      example: {
        title: 'House de Chicago ← disco',
        intro: 'Un lien de la carte de bulles, tel qu’il est réellement stocké et documenté.',
        rows: [
          ['Lien', 'La house de Chicago dérive du disco'],
          ['Confiance', 'Moyenne'],
          ['Sources', 'Radio publique WCMU · PBS · exposition de l’Abraham Lincoln Presidential Library and Museum'],
          [
            'Note éditoriale',
            'Les montages disco, la pratique des DJ disco, la soul et les boîtes à rythmes ont tous nourri la house de Chicago. La filiation est réelle, mais le disco ne doit pas être présenté comme sa seule origine.',
          ],
          ['Relecture', 'Sources vérifiées et formulation mise à jour, 5 nov. 2026'],
        ],
        path: 'docs/graph/evidence/edges/lineage__chicago-house-disco.md',
        link: 'Lire sa note de preuves',
      },
      resources: [
        ['docs/DATA.md', 'Données et contributions'],
        ['docs/GRAPH.md', 'Schéma et sens des relations'],
        ['docs/graph/evidence/README.md', 'Preuves et audits'],
      ],
    },
    artwork: {
      label: 'Dessins d’instruments',
      title: 'Reconnaissable au premier regard.',
      intro:
        'Chacun des {instruments} instruments est dessiné en code, sous forme de fichiers vectoriels SVG, plutôt que peint ou généré comme une image. Chaque courbe peut être relue, et un script peut vérifier qu’une icône de 24 pixels ressemble encore au véritable instrument.',
      flows: [
        {
          title: 'De la photo de musée à l’icône',
          caption: 'Du brief documenté à l’accord humain.',
          steps: [
            {
              actor: 'agent',
              title: 'Étudier l’original',
              text: 'Un brief réunit des références muséales ou photographiques vérifiées, la silhouette, les caractéristiques et leur nombre (cordes, touches, fûts) et les sosies à éviter.',
              output: ['doc', 'Brief visuel'],
              preview: { kind: 'note', title: 'Brief : saxophone', lines: ['Alto courbé : bocal recourbé, pavillon relevé', 'Clés rondes le long d’un corps conique', 'À éviter : une clarinette droite ou une trompette'] },
            },
            {
              actor: 'script',
              title: 'Dessiner le maître',
              text: 'La plupart des instruments sont décrits une fois dans un générateur Python : formes, proportions et couleurs de famille. Un assistant IA écrit et ajuste ce code.',
              output: ['code', 'Code de dessin (Python)'],
              preview: {
                kind: 'blueprint',
                title: 'Saxophone · tracé vectoriel',
                units: 'unités de dessin',
                anchors: 'Points d’ancrage',
                handles: 'Poignées de courbe',
                description: 'Contour du saxophone avec des points d’ancrage et des poignées qui règlent une courbe. Les dimensions sont des unités de dessin, pas la taille réelle de l’instrument.',
              },
            },
            {
              actor: 'script',
              title: 'Exporter quatre versions',
              text: 'Une icône monochrome, une bannière, un avatar rond et un fond d’en-tête transparent qui laisse de la place au titre.',
              output: ['image', 'Quatre images SVG'],
              preview: { kind: 'artwork' },
            },
            {
              actor: 'test',
              title: 'Mesurer',
              text: 'Les contrôles vérifient structure, palette, taille, la part du carré de 24 pixels occupée par l’icône et la conformité avec le générateur.',
              output: ['report', 'Rapport de contrôles et planches PNG'],
              preview: { kind: 'checks', items: ['Palette de la famille', 'Structure et poids du fichier', 'Icône lisible à 24 px', 'Conforme au générateur'] },
            },
            { actor: 'agent', title: 'Examiner l’illustration', text: 'L’agent compare les planches au brief et vérifie la provenance. Il demande de corriger un dessin qui s’écarte d’un brief solide, de revoir un brief défaillant, ou bloque la publication si les contrôles ou la provenance échouent.', output: ['report', 'Verdict de revue'], preview: { kind: 'checks', items: ['Dessin ou fichiers à corriger', 'Brief ou références à revoir'] } },
            {
              actor: 'human',
              title: 'Regarder et approuver',
              text: 'Une personne donne l’accord final dans Storybook après la revue de l’illustration.',
              output: ['app', 'Illustration affichée dans l’application'],
              preview: { kind: 'screen', shot: 'artwork', alt: 'La fiche du saxophone dans la chronologie des instruments de Soundlines' },
            },
          ],
          loops: [
            { from: [4, 5], to: 2, label: 'Dessin ou fichiers à corriger' },
            { from: [5], to: 1, label: 'Brief ou références à revoir' },
          ],
        },
      ],
      sections: [
        [
          'Pourquoi dessiner en code ?',
          'Les dessins SVG sont de petits fichiers texte, nets à toutes les tailles, qui s’adaptent aux thèmes clair et sombre. Comme ce sont des textes, une corde ou une touche modifiée apparaît en revue comme n’importe quel changement de code, et un seul générateur garde {artworkFiles} fichiers cohérents.',
        ],
        [
          'Une collection, pas des cliparts',
          'Chaque famille d’instruments a sa palette et tous les dessins partagent la même légère inclinaison : l’ensemble forme une collection. Le brief garantit que ce style commun ne fait jamais ressembler un alto à un violon.',
        ],
        [
          'Ce que les machines ne jugent pas',
          'Un script sait qu’une icône est trop petite ; il ne voit pas qu’un luth a un manche mal incliné. Les planches rendues et le regard humain restent donc des étapes séparées et obligatoires.',
        ],
      ],
      showcase: true,
      resources: [
        ['docs/DATA.md#instrument-artwork', 'Processus des illustrations'],
        ['.github/skills/artwork-draw/SKILL.md', 'Procédure et style graphique'],
        ['docs/artwork/briefs', 'Briefs visuels'],
        ['scripts/artwork/generate-instrument-artwork.py', 'Générateur des dessins maîtres'],
      ],
    },
    audio: {
      label: 'Création des sons',
      title: 'Comment sont créés les sons de Soundlines ?',
      intro:
        'Les sons de Soundlines sont des instrumentaux originaux générés sur un ordinateur portable avec ACE-Step 1.5, un modèle musical open source, et non des extraits de disques célèbres. Les visiteurs ne téléchargent que des fichiers finalisés : aucune IA ne tourne pendant la navigation.',
      flows: [
        {
          title: 'Fabriquer une boucle sans raccord',
          caption: 'Le disque de la page d’accueil tourne sur des boucles fabriquées ainsi.',
          steps: [
            {
              actor: 'agent',
              title: 'Écrire le brief',
              text: 'Tempo, tonalité, mesure, durée et description instrumentale originale du genre : pas de voix, pas de mélodie célèbre, ni intro ni pont.',
              output: ['doc', 'Brief de boucle'],
              preview: { kind: 'note', title: 'Brief : boucle hip-hop', lines: ['Boom-bap · 92 BPM · ré mineur', '4 mesures, sans voix ni intro', '5 graines à essayer'] },
            },
            {
              actor: 'model',
              title: 'Planifier la musique',
              text: 'Un modèle de langage de 4 milliards de paramètres écrit d’abord un plan musical compact, les codes audio, pour chaque prise.',
              output: ['data', 'Codes audio pour chaque prise'],
              preview: { kind: 'codes' },
            },
            {
              actor: 'model',
              title: 'Produire le son',
              text: 'Un second modèle transforme ce plan en audio en 80 étapes d’affinage. Les deux tournent l’un après l’autre car ils ne tiennent pas ensemble dans la mémoire du portable.',
              output: ['audio', 'Prises brutes'],
              preview: { kind: 'takes' },
            },
            { actor: 'test', title: 'Trier les prises', text: 'Écarter les prises qui échouent aux contrôles avant la découpe. S’il en reste moins de deux, planifier et générer des prises avec de nouvelles graines.', output: ['audio', 'Prises validées'], preview: { kind: 'checks', items: ['Prises validées'] } },
            {
              actor: 'script',
              title: 'Trouver la coupe parfaite',
              text: 'Plusieurs prises sont générées avec des graines différentes. Des scripts calent une grille rythmique, comparent des fenêtres de quatre mesures et gardent la plus régulière, avec un fondu de 8 ms au raccord.',
              output: ['audio', 'Boucle sans raccord et rapport de sélection'],
              preview: {
                kind: 'loop',
                caption: '135 coupes comparées · graine 41126',
                takeLabel: 'Prise complète',
                schematicLabel: 'forme d’onde schématique',
                discardedLabel: 'Non conservé',
                selectionLabel: 'Passage sélectionné',
                keptLabel: 'Boucle conservée',
              },
            },
            {
              actor: 'test',
              title: 'Mesurer',
              text: 'Durée et tempo exacts, volume, écrêtage, coupures, stabilité d’une mesure à l’autre, basses en mono et indices de voix cachées dans le spectrogramme.',
              output: ['report', 'Mesures et spectrogrammes'],
              preview: { kind: 'checks', items: ['Exactement 16 temps', 'Ni écrêtage ni coupure', 'Basses en mono', 'Alerte dans la bande vocale'] },
            },
            { actor: 'agent', title: 'Examiner la boucle', text: 'L’agent examine les spectrogrammes, le rendu musical et la provenance. Un échec des contrôles ou un problème de provenance bloque la publication. Il peut demander une nouvelle découpe, une autre prise ou un brief révisé.', output: ['report', 'Verdict de revue'], preview: { kind: 'checks', items: ['Verdict de revue'] } },
            {
              actor: 'human',
              title: 'Écouter',
              text: 'Les chiffres ne remplacent pas l’oreille : une personne écoute et approuve avant la livraison du fichier WAV.',
              output: ['app', 'Boucle WAV sur la platine'],
              preview: {
                kind: 'player',
                caption: 'turntable-hip-hop.wav · 10,4 s, sans raccord',
                waveformLabel: 'Forme d’onde de la boucle hip-hop de la page d’accueil',
                playerLabel: 'Boucle hip-hop de la page d’accueil',
              },
            },
          ],
          loops: [
            { from: [4, 7], to: 2, label: 'Trop peu de prises utilisables ou nouvelle interprétation nécessaire' },
            { from: [6, 7], to: 5, label: 'Durée incorrecte ou raccord audible : essayer une autre découpe' },
            { from: [7], to: 1, label: 'Problème de brief ou d’originalité : revoir le brief' },
          ],
        },
        {
          title: 'Comment sont créés les extraits du catalogue',
          caption: 'Les extraits ont leurs propres briefs, leur moteur de rendu et leur procédure de revue.',
          steps: [
            { actor: 'agent', title: 'Préparer le brief', text: 'Décrire le genre et son instrumentation.', output: ['doc', 'Brief de l’extrait'], preview: { kind: 'checks', items: ['Brief de l’extrait'] } },
            { actor: 'script', title: 'Générer l’extrait', text: 'Le rendu standard utilise ACE-Step Turbo en huit étapes avec un planificateur de 1,7 milliard de paramètres. Il extrait les dix secondes centrales d’une prise de 32 secondes. Le fichier de suivi permet d’ignorer les extraits terminés et de relancer les échecs.', output: ['audio', 'Extrait de 10 secondes'], preview: { kind: 'checks', items: ['Extrait de 10 secondes'] } },
            { actor: 'agent', title: 'Vérifier et comparer', text: 'Vérifier la lecture et les défauts techniques, puis noter les extraits. Pour chaque genre signalé, revoir le brief et générer une seule nouvelle prise à part. Comparer les deux avec le même outil de notation et garder l’original si la nouvelle prise ne l’améliore pas.', output: ['report', 'Extrait retenu et comparaison'], preview: { kind: 'checks', items: ['Extrait retenu et comparaison'] } },
          ],
          loops: [{ from: [3], to: 1, label: 'Une seule nouvelle prise par genre signalé' }],
        },
      ],
      sections: [
        [
          'Pourquoi générer localement ?',
          'Faire tourner le modèle sur un portable garde la maîtrise de chaque réglage, graine et fichier, et laisse une trace écrite : chaque boucle a un brief et un rapport de sélection avec ses graines, ses points de coupe et ses comparaisons. Chacun peut voir comment un son a été fabriqué.',
        ],
        [
          'Original, pas imitation',
          'Les briefs décrivent le caractère d’un genre (groove, instruments, époque de production), jamais un artiste, un morceau ou une voix précis. Les revues recherchent voix cachées et risques d’imitation autant que la qualité sonore.',
        ],
      ],
      example: {
        title: 'La boucle de la page d’accueil',
        intro: 'La boucle hip-hop de la face A de la platine.',
        rows: [
          ['Style', 'Instrumental boom-bap original, ré mineur, 92 BPM'],
          ['Modèles', 'ACE-Step 1.5 : planificateur 4B, puis rendu XL SFT en 80 étapes'],
          ['Prises', 'Cinq prises de 36 secondes (graines 73192, 18409, 60217, 41126, 52880)'],
          ['Choix', 'Graine 41126, à partir de 11,668 s : exactement 16 temps, 10,435 s'],
          ['Format', 'WAV stéréo, 48 kHz. Le MP3 ou l’AAC ajouteraient un silence qui casse la boucle.'],
          ['Face B', 'La version trap (thème clair) est réarrangée à partir de la même phrase : changer de thème garde le rythme.'],
        ],
        path: 'docs/loops/briefs/turntable-hip-hop.json',
        link: 'Lire son brief',
      },
      resources: [
        ['docs/AUDIO.md', 'Formats et provenance audio'],
        ['.github/skills/loop-produce/SKILL.md', 'Production des boucles'],
        ['docs/loops/briefs', 'Briefs et rapports de sélection'],
      ],
    },
    build: {
      label: 'La fabrication',
      title: 'Une application, un fichier de données et une équipe d’assistants.',
      intro:
        'Soundlines est une application web construite avec des outils open source, un seul fichier de données musicales et {skills} procédures écrites que {agents} assistants IA spécialisés suivent sous supervision humaine.',
      flows: [
        {
          title: 'Du fichier de données à votre écran',
          caption: 'Pas de base de données : le graphe musical est livré avec l’application.',
          steps: [
            {
              actor: 'script',
              title: 'Le fichier de données',
              text: 'graph.json contient toutes les entrées et tous les liens ; des fichiers séparés contiennent les traductions.',
              output: ['data', 'Un fichier JSON par langue'],
              preview: { kind: 'files', items: ['graph.json', 'graph.fr.json'] },
            },
            {
              actor: 'script',
              title: 'Une couche de requêtes',
              text: 'Un seul module TypeScript répond à toutes les questions (voisins, lignées, périodes, recherche) : l’interface ne lit jamais le fichier directement.',
              output: ['code', 'Réponses prêtes pour les pages'],
              preview: { kind: 'note', title: 'Chicago house', lines: ['Dérivée de : disco', '1980 – aujourd’hui', 'Famille Disco et house'] },
            },
            {
              actor: 'script',
              title: 'Les pages',
              text: 'Next.js et React génèrent chaque page sur le serveur en anglais, français, allemand, italien ou espagnol, puis chronologies, carte de bulles et audio deviennent interactifs.',
              output: ['app', 'Pages interactives en anglais, français, allemand, italien et espagnol'],
              preview: { kind: 'screen', shot: 'artwork', alt: 'La chronologie des instruments de Soundlines avec la fiche du saxophone ouverte' },
            },
            {
              actor: 'test',
              title: 'Tests et build',
              text: 'Les contrôles du graphe et des dessins tournent sur GitHub quand une pull request touche les chemins configurés. Lancez les contrôles pertinents avant la fusion. Vercel compile l’application pour la déployer.',
              output: ['report', 'Contrôles au vert et build de production'],
              preview: { kind: 'checks', items: ['Contrôles du graphe', 'Contrôles des illustrations', 'Tests et lint', 'Build de production'] },
            },
            {
              actor: 'script',
              title: 'Hébergement',
              text: 'L’application est déployée sur Vercel ; ce site compagnon est un site statique distinct sur GitHub Pages.',
              output: ['app', 'L’application en ligne et ce site'],
              preview: { kind: 'screen', shot: 'home', alt: 'La page d’accueil de Soundlines et sa platine' },
            },
          ],
        },
      ],
      sections: [
        [
          'Les outils',
          'TypeScript partout ; React 19 et l’App Router de Next.js pour l’application ; Tailwind CSS pour les styles ; next-intl pour l’anglais, le français, l’allemand, l’italien et l’espagnol ; Vitest et Storybook pour les tests et l’aperçu des composants ; Docker Compose pour un démarrage local en une commande. Ce site compagnon utilise React et Vite, pré-rendu en HTML statique.',
        ],
        [
          'Des procédures lisibles',
          'Les skills sont des procédures pas à pas, avec leurs propres scripts, stockées dans le dépôt ; les agents sont des descriptions de rôle qui les utilisent. Versionnés comme le code, ils permettent à chacun de lire exactement ce qui a été demandé à un assistant, et de l’améliorer.',
        ],
        [
          'Envie d’aider ?',
          'Une meilleure source, un lien corrigé, une traduction plus claire ou un instrument plus reconnaissable comptent autant qu’une nouvelle fonctionnalité. Proposez des changements limités, lancez les contrôles pertinents et expliquez vos preuves dans la pull request.',
        ],
      ],
      resources: [
        ['docs/INSTALLATION.md', 'Outils et environnement'],
        ['docs/DEVELOPMENT.md', 'Développement et déploiement'],
        ['docs/ARCHITECTURE.md', 'Architecture de l’application'],
        ['.github/agents', 'Agents spécialisés'],
        ['.github/skills', 'Procédures réutilisables'],
        [storybookUrl, 'Galerie de composants (Storybook)'],
      ],
    },
  },
}
