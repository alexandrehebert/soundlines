import type { Locale, Page } from '../content.ts'

type ChangelogCopy = {
  label: string
  nav: string
  intro: string
  scope: string
  search: string
  category: string
  all: string
  empty: string
  commit: string
  merge: string
  files: string
  nodes: string
  edges: string
  changes: string
  download: string
  markdown: string
  automation: string
  focus: string
  assets: string
  affected: string
  moreEntities: string
  technical: string
  page: string
  pagination: string
  about: string
  statuses: Record<'added' | 'updated' | 'removed', string>
  categories: Record<'graph' | 'previews' | 'loops' | 'artwork' | 'app' | 'site' | 'workflow' | 'docs' | 'other', string>
}

export const changelogCopy: Record<Locale, ChangelogCopy> = {
  en: {
    label: 'Changelog',
    nav: 'Changelog',
    intro: 'Follow the history of the graph, audio previews, loops, instrument artwork, app and production workflows.',
    scope: 'Generated from committed Git history, newest first in topological order. Merge entries compare with their first parent and may repeat branch changes. Original commit messages stay in English. Uncommitted work and raw audio takes are not included; an audio entry is not a listening approval.',
    search: 'Search entities or changes', category: 'Category', all: 'All repository changes', empty: 'No matching changes.',
    commit: 'View exact changes', merge: 'Merge', files: 'Changed files', nodes: 'Graph nodes', edges: 'Graph connections',
    changes: 'Added / updated / removed', download: 'Download full history (JSON)', markdown: 'Readable changelog (Markdown)',
    automation: 'How updates work',
    focus: 'Explore updates to the music graph, audio previews, loops and instrument illustrations. Each update lists the entities affected. Other repository changes are available in the category filter.',
    assets: 'Graph & assets', affected: 'Affected entities', moreEntities: 'Show remaining entities',
    technical: 'Commit details', page: 'Page', pagination: 'Changelog pages', about: 'About this history & downloads',
    statuses: { added: 'Added', updated: 'Updated', removed: 'Removed' },
    categories: { graph: 'Graph data & evidence', previews: 'Audio previews', loops: 'Audio loops', artwork: 'Instrument artwork', app: 'Explorer', site: 'Companion site', workflow: 'Workflow & tooling', docs: 'Documentation', other: 'Other' },
  },
  fr: {
    label: 'Journal des changements',
    nav: 'Journal',
    intro: 'Suivez l’histoire du graphe, des aperçus audio, des boucles, des illustrations, de l’application et des processus de production.',
    scope: 'Généré à partir de l’historique Git validé, du plus récent au plus ancien selon l’ordre topologique. Les fusions sont comparées à leur premier parent et peuvent répéter des changements de branche. Les messages des commits restent en anglais. Le travail non validé et les prises audio brutes sont exclus ; une entrée audio ne vaut pas approbation à l’écoute.',
    search: 'Rechercher une entité ou un changement', category: 'Catégorie', all: 'Tous les changements du dépôt', empty: 'Aucun changement correspondant.',
    commit: 'Voir les changements exacts', merge: 'Fusion', files: 'Fichiers modifiés', nodes: 'Entités du graphe', edges: 'Relations du graphe',
    changes: 'Ajouts / modifications / suppressions', download: 'Télécharger l’historique complet (JSON)', markdown: 'Journal des changements (Markdown)',
    automation: 'Comment les mises à jour fonctionnent',
    focus: 'Découvrez les mises à jour du graphe musical, des aperçus audio, des boucles et des illustrations d’instruments. Chaque entrée présente les entités concernées. Le filtre de catégorie donne accès aux autres changements du dépôt.',
    assets: 'Graphe et contenus', affected: 'Entités concernées', moreEntities: 'Afficher les autres entités',
    technical: 'Détails du commit', page: 'Page', pagination: 'Pages du journal', about: 'À propos de cet historique et téléchargements',
    statuses: { added: 'Ajoutée', updated: 'Modifiée', removed: 'Supprimée' },
    categories: { graph: 'Graphe et preuves', previews: 'Aperçus audio', loops: 'Boucles audio', artwork: 'Illustrations d’instruments', app: 'Explorateur', site: 'Site compagnon', workflow: 'Processus et outils', docs: 'Documentation', other: 'Autres' },
  },
  de: {
    label: 'Änderungsprotokoll',
    nav: 'Änderungen',
    intro: 'Verfolge die Geschichte des Graphen, der Audiovorschauen, Loops, Instrumentenbilder, Anwendung und Produktionsabläufe.',
    scope: 'Aus der eingecheckten Git-Historie erzeugt, neueste Einträge zuerst in topologischer Reihenfolge. Merges werden mit ihrem ersten Eltern-Commit verglichen und können Branch-Änderungen wiederholen. Commit-Nachrichten bleiben auf Englisch. Nicht eingecheckte Arbeit und rohe Audioaufnahmen sind ausgeschlossen; ein Audioeintrag ist keine Hörfreigabe.',
    search: 'Entitäten oder Änderungen suchen', category: 'Kategorie', all: 'Alle Repository-Änderungen', empty: 'Keine passenden Änderungen.',
    commit: 'Genaue Änderungen ansehen', merge: 'Merge', files: 'Geänderte Dateien', nodes: 'Graph-Knoten', edges: 'Graph-Verbindungen',
    changes: 'Hinzugefügt / aktualisiert / entfernt', download: 'Vollständige Historie herunterladen (JSON)', markdown: 'Lesbares Änderungsprotokoll (Markdown)',
    automation: 'So funktionieren Aktualisierungen',
    focus: 'Entdecke Aktualisierungen des Musikgraphen, der Audiovorschauen, Loops und Instrumentenbilder. Jeder Eintrag nennt die betroffenen Entitäten. Weitere Repository-Änderungen sind über den Kategoriefilter verfügbar.',
    assets: 'Graph und Inhalte', affected: 'Betroffene Entitäten', moreEntities: 'Weitere Entitäten anzeigen',
    technical: 'Commit-Details', page: 'Seite', pagination: 'Protokollseiten', about: 'Über diese Historie und Downloads',
    statuses: { added: 'Hinzugefügt', updated: 'Aktualisiert', removed: 'Entfernt' },
    categories: { graph: 'Graph-Daten und Belege', previews: 'Audiovorschauen', loops: 'Audio-Loops', artwork: 'Instrumentenbilder', app: 'Explorer', site: 'Begleitseite', workflow: 'Abläufe und Werkzeuge', docs: 'Dokumentation', other: 'Sonstiges' },
  },
  it: {
    label: 'Registro delle modifiche',
    nav: 'Modifiche',
    intro: 'Segui la storia del grafo, delle anteprime audio, dei loop, delle illustrazioni, dell’applicazione e dei processi di produzione.',
    scope: 'Generato dalla cronologia Git registrata, dalle modifiche più recenti in ordine topologico. I merge sono confrontati con il primo genitore e possono ripetere modifiche dei rami. I messaggi dei commit restano in inglese. Il lavoro non registrato e le registrazioni audio grezze sono esclusi; una voce audio non equivale a un’approvazione all’ascolto.',
    search: 'Cerca entità o modifiche', category: 'Categoria', all: 'Tutte le modifiche del repository', empty: 'Nessuna modifica corrispondente.',
    commit: 'Vedi le modifiche esatte', merge: 'Merge', files: 'File modificati', nodes: 'Entità del grafo', edges: 'Relazioni del grafo',
    changes: 'Aggiunte / aggiornate / rimosse', download: 'Scarica la cronologia completa (JSON)', markdown: 'Registro delle modifiche (Markdown)',
    automation: 'Come funzionano gli aggiornamenti',
    focus: 'Esplora gli aggiornamenti del grafo musicale, delle anteprime audio, dei loop e delle illustrazioni di strumenti. Ogni voce elenca le entità interessate. Le altre modifiche del repository sono disponibili nel filtro per categoria.',
    assets: 'Grafo e contenuti', affected: 'Entità interessate', moreEntities: 'Mostra le altre entità',
    technical: 'Dettagli del commit', page: 'Pagina', pagination: 'Pagine del registro', about: 'Informazioni sulla cronologia e download',
    statuses: { added: 'Aggiunta', updated: 'Aggiornata', removed: 'Rimossa' },
    categories: { graph: 'Dati e prove del grafo', previews: 'Anteprime audio', loops: 'Loop audio', artwork: 'Illustrazioni di strumenti', app: 'Esploratore', site: 'Sito complementare', workflow: 'Processi e strumenti', docs: 'Documentazione', other: 'Altro' },
  },
  es: {
    label: 'Registro de cambios',
    nav: 'Cambios',
    intro: 'Sigue la historia del grafo, las muestras de audio, los bucles, las ilustraciones, la aplicación y los procesos de producción.',
    scope: 'Generado a partir del historial Git confirmado, con lo más reciente primero en orden topológico. Las fusiones se comparan con su primer padre y pueden repetir cambios de ramas. Los mensajes de los commits permanecen en inglés. Se excluyen el trabajo sin confirmar y las tomas de audio sin procesar; una entrada de audio no implica aprobación de escucha.',
    search: 'Buscar entidades o cambios', category: 'Categoría', all: 'Todos los cambios del repositorio', empty: 'No hay cambios coincidentes.',
    commit: 'Ver los cambios exactos', merge: 'Fusión', files: 'Archivos modificados', nodes: 'Entidades del grafo', edges: 'Relaciones del grafo',
    changes: 'Añadidas / actualizadas / eliminadas', download: 'Descargar el historial completo (JSON)', markdown: 'Registro de cambios (Markdown)',
    automation: 'Cómo funcionan las actualizaciones',
    focus: 'Explora las actualizaciones del grafo musical, las muestras de audio, los bucles y las ilustraciones de instrumentos. Cada entrada muestra las entidades afectadas. Los demás cambios del repositorio están disponibles en el filtro por categoría.',
    assets: 'Grafo y contenidos', affected: 'Entidades afectadas', moreEntities: 'Mostrar las demás entidades',
    technical: 'Detalles del commit', page: 'Página', pagination: 'Páginas del registro', about: 'Acerca del historial y descargas',
    statuses: { added: 'Añadida', updated: 'Actualizada', removed: 'Eliminada' },
    categories: { graph: 'Datos y pruebas del grafo', previews: 'Muestras de audio', loops: 'Bucles de audio', artwork: 'Ilustraciones de instrumentos', app: 'Explorador', site: 'Sitio complementario', workflow: 'Procesos y herramientas', docs: 'Documentación', other: 'Otros' },
  },
}

export function changelogPage(locale: Locale): Page {
  const c = changelogCopy[locale]
  return {
    label: c.label, nav: c.nav, title: c.label, intro: c.intro, flows: [], sections: [],
    resources: [['CHANGELOG.md', c.markdown], ['docs/DEVELOPMENT.md#changelog', c.automation]],
  }
}
