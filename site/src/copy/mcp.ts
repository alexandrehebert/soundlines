import type { Locale, Page } from '../content.ts'

const inspectorUrl = 'https://modelcontextprotocol.io/docs/tools/inspector'

type McpCopy = {
  label: string
  title: string
  intro: string
  connect: string
  setup: string
  inspector: string
  reference: string
  schema: string
  example: string
  question: string
  explain: string
  limits: string
  data: string
  license: string
}

export const mcpCopy: Record<Locale, McpCopy> = {
  en: {
    label: 'Query the Graph',
    title: 'Query the Soundlines graph',
    intro: 'Connect an MCP client to explore the relationships between artists, genres, instruments and other entities, with the sources behind each documented connection.',
    connect: 'Connect a client',
    setup: 'Add the URL as a Streamable HTTP server. Access is public and read-only, with no API key. This configuration uses the portable MCP format, for example in a workspace .mcp.json.',
    inspector: 'Open MCP Inspector locally with this command to browse tools, inspect their schemas and run calls.',
    reference: 'Tool reference',
    schema: 'Input schema',
    example: 'Example query',
    question: 'Which French touch artists were signed to a label and are also key artists in another genre?',
    explain: 'Every branch must match from the same artist. Steps run in order, and each step can filter by direction, relationship type, confidence and the node it reaches. The result includes matching root IDs and path steps that refer to the returned node and edge records. Use the sources and confidence on those records when citing a result.',
    limits: 'A query can have up to four branches of four steps each, with no repeated node in a path. Each branch returns up to five paths per root and reports whether more exist. Use nextOffset as offset to get the next page of roots. Narrow your filters if a query reaches the traversal limit.',
    data: 'Set locale to en, fr, de, it or es for localized graph text where available. IDs and relationship types stay the same. An empty result means the dataset has no matching evidence.',
    license: 'License and attribution',
  },
  fr: {
    label: 'Interroger le graphe',
    title: 'Interroger le graphe Soundlines',
    intro: 'Connectez un client MCP pour explorer les liens entre artistes, genres, instruments et autres entités, avec les sources qui documentent chaque relation.',
    connect: 'Connecter un client',
    setup: 'Ajoutez cette URL comme serveur Streamable HTTP. L’accès est public, en lecture seule et sans clé API. Cet exemple utilise le format MCP portable, notamment dans un fichier .mcp.json à la racine du projet.',
    inspector: 'Lancez MCP Inspector en local avec cette commande pour découvrir les outils, consulter leurs schémas et les essayer.',
    reference: 'Référence des outils',
    schema: 'Schéma des paramètres',
    example: 'Exemple de requête',
    question: 'Quels artistes de la French touch ont signé avec un label et sont aussi des figures d’un autre genre ?',
    explain: 'Toutes les branches doivent correspondre à partir du même artiste. Les étapes se suivent et peuvent filtrer la direction, le type et le niveau de confiance de la relation, ainsi que l’entité atteinte. Le résultat contient les identifiants des artistes et des étapes qui renvoient aux entités et relations retournées. Appuyez vos citations sur leurs sources et tenez compte du niveau de confiance indiqué.',
    limits: 'Une requête accepte jusqu’à quatre branches de quatre étapes, sans répétition d’une entité dans un chemin. Chaque branche retourne au plus cinq chemins par entité de départ et indique si d’autres existent. Passez nextOffset comme offset pour obtenir la page suivante. Si la requête atteint la limite de parcours, précisez vos filtres.',
    data: 'Choisissez en, fr, de, it ou es dans locale pour obtenir le texte traduit quand il est disponible. Les identifiants et les types de relation restent identiques. Un résultat vide signifie que le graphe ne documente aucun lien correspondant.',
    license: 'Licence et attribution',
  },
  de: {
    label: 'Graph abfragen',
    title: 'Den Soundlines-Graphen abfragen',
    intro: 'Verbinde einen MCP-Client, um Beziehungen zwischen Künstlern, Genres, Instrumenten und anderen Entitäten samt ihren Quellen zu erkunden.',
    connect: 'Client verbinden',
    setup: 'Füge die URL als Streamable-HTTP-Server hinzu. Der öffentliche Lesezugriff erfordert keinen API-Schlüssel. Das Beispiel nutzt das portable MCP-Format, etwa in einer .mcp.json im Projektverzeichnis.',
    inspector: 'Starte MCP Inspector lokal mit diesem Befehl, um Werkzeuge und Schemata anzusehen und Aufrufe auszuführen.',
    reference: 'Werkzeugreferenz',
    schema: 'Eingabeschema',
    example: 'Beispielabfrage',
    question: 'Welche French-Touch-Künstler standen bei einem Label unter Vertrag und gelten auch in einem anderen Genre als prägend?',
    explain: 'Alle Zweige müssen beim selben Künstler beginnen. Jeder Schritt kann nach Richtung, Beziehungstyp, Konfidenz und Zielknoten filtern. Die Pfade verweisen auf die zurückgegebenen Knoten und Beziehungen. Verwende deren Quellen und Konfidenzangaben für deine Belege.',
    limits: 'Eine Abfrage erlaubt bis zu vier Zweige mit je vier Schritten. Knoten dürfen sich in einem Pfad nicht wiederholen. Pro Zweig und Startknoten werden bis zu fünf Pfade zurückgegeben, mit einem Hinweis auf weitere Treffer. Verwende nextOffset als offset für die nächste Seite. Grenze die Filter ein, wenn die Abfrage das Suchlimit erreicht.',
    data: 'Wähle en, fr, de, it oder es in locale, um verfügbare Übersetzungen zu erhalten. IDs und Beziehungstypen bleiben gleich. Ein leeres Ergebnis bedeutet, dass der Graph keine passenden Belege enthält.',
    license: 'Lizenz und Namensnennung',
  },
  it: {
    label: 'Interroga il grafo',
    title: 'Interrogare il grafo di Soundlines',
    intro: 'Collega un client MCP per esplorare le relazioni tra artisti, generi, strumenti e altre entità e consultare le fonti di ogni legame documentato.',
    connect: 'Collegare un client',
    setup: 'Aggiungi l’URL come server Streamable HTTP. L’accesso è pubblico, in sola lettura e senza chiave API. L’esempio usa il formato MCP portabile, ad esempio in un file .mcp.json nella cartella di progetto.',
    inspector: 'Avvia MCP Inspector in locale con questo comando per consultare gli strumenti e i loro schemi e provare le chiamate.',
    reference: 'Riferimento degli strumenti',
    schema: 'Schema di input',
    example: 'Esempio di interrogazione',
    question: 'Quali artisti della French touch hanno firmato con un’etichetta e sono figure di spicco anche in un altro genere?',
    explain: 'Tutti i rami devono corrispondere a partire dallo stesso artista. Ogni passaggio può filtrare per direzione, tipo, livello di confidenza e nodo raggiunto. I percorsi fanno riferimento ai nodi e alle relazioni restituiti, con fonti e livelli di confidenza da usare per citare le prove.',
    limits: 'Ogni interrogazione può avere fino a quattro rami di quattro passaggi, senza ripetere un nodo nello stesso percorso. Ogni ramo restituisce fino a cinque percorsi per nodo di partenza e indica se ne esistono altri. Usa nextOffset come offset per la pagina successiva. Restringi i filtri se raggiungi il limite di esplorazione.',
    data: 'Imposta locale su en, fr, de, it o es per ottenere il testo tradotto quando disponibile. Gli ID e i tipi di relazione non cambiano. Un risultato vuoto indica che il grafo non contiene prove corrispondenti.',
    license: 'Licenza e attribuzione',
  },
  es: {
    label: 'Consultar el grafo',
    title: 'Consultar el grafo de Soundlines',
    intro: 'Conecta un cliente MCP para explorar las relaciones entre artistas, géneros, instrumentos y otras entidades, con las fuentes de cada vínculo documentado.',
    connect: 'Conectar un cliente',
    setup: 'Añade la URL como servidor Streamable HTTP. El acceso es público, de solo lectura y sin clave de API. El ejemplo usa el formato MCP portátil, por ejemplo en un archivo .mcp.json en la raíz del proyecto.',
    inspector: 'Ejecuta este comando para abrir MCP Inspector en local, ver las herramientas y sus esquemas y probar llamadas.',
    reference: 'Referencia de herramientas',
    schema: 'Esquema de entrada',
    example: 'Ejemplo de consulta',
    question: '¿Qué artistas de la French touch firmaron con un sello y son también figuras destacadas en otro género?',
    explain: 'Todas las ramas deben coincidir a partir del mismo artista. Cada paso puede filtrar por dirección, tipo de relación, nivel de confianza y nodo de destino. Las rutas hacen referencia a los nodos y relaciones devueltos. Usa sus fuentes y niveles de confianza para citar la evidencia.',
    limits: 'Una consulta admite hasta cuatro ramas de cuatro pasos, sin repetir un nodo en una misma ruta. Cada rama devuelve hasta cinco rutas por nodo de origen e indica si hay más. Usa nextOffset como offset para la página siguiente. Acota los filtros si la consulta alcanza el límite de recorrido.',
    data: 'Elige en, fr, de, it o es en locale para obtener el texto traducido cuando esté disponible. Los ID y los tipos de relación se mantienen. Un resultado vacío indica que el grafo carece de evidencia coincidente.',
    license: 'Licencia y atribución',
  },
}

export function mcpPage(locale: Locale): Page {
  const copy = mcpCopy[locale]
  return {
    label: copy.label,
    eyebrow: 'Model Context Protocol',
    title: copy.title,
    intro: copy.intro,
    flows: [],
    sections: [],
    resources: [[inspectorUrl, 'MCP Inspector'], ['README.md#license', copy.license]],
  }
}
