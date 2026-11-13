import { storybookUrl } from '../links.ts'
import type { Copy } from '../content.ts'

export const de: Copy = {
  skip: 'Zum Inhalt springen', navigation: 'Hinter den Kulissen', language: 'Sprache', openApp: 'Soundlines öffnen',
  openDataTitle: 'Offene Daten in Soundlines',
  openDataDescription: 'Der Datensatz, der Abfrageleitfaden und das Inhaltsprotokoll befinden sich jetzt in der Hauptanwendung.',
  openDataLink: 'Offene Daten erkunden',
  eyebrow: 'Hinter den Kulissen eines Musikatlas', source: 'Quellcode erkunden', next: 'Alle Werkstätten besuchen',
  resources: 'Mehr erfahren', footer: 'Ein kuratierter Atlas, keine vollständige Geschichte. Quellen, Unsicherheit und menschliches Urteil zählen.',
  docsNote: 'Ausführliche technische Anleitungen stehen im Repository und sind derzeit auf Englisch.',
  legend: 'Wer macht was', produces: 'Erstellt', result: 'Endergebnis', backTo: 'zurück zu Schritt', example: 'Konkretes Beispiel', examples: 'Konkrete Beispiele', brief: 'Konzept lesen',
  actors: { human: 'Mensch', agent: 'KI-Assistent', model: 'KI-Modell', script: 'Code', test: 'Automatische Prüfung' },
  stats: [['entries', 'Einträge: Genres, Künstler, Orte…'], ['connections', 'dokumentierte Verbindungen'], ['sources', 'verschiedene Quellenlinks'], ['artworkFiles', 'Instrumentenzeichnungen'], ['evidenceNotes', 'Belegvermerke']],
  pages: {
    index: {
      label: 'Übersicht', title: 'Musik verläuft nicht geradlinig.',
      intro: 'Soundlines ist ein interaktiver Atlas musikalischer Entwicklungslinien. Diese Begleitseite öffnet seine Werkstatt: woher jede Angabe stammt, wie jede Zeichnung und jeder Klang entstanden ist und wer oder was sie geprüft hat, bevor sie in die App kamen.',
      overview: {
        title: 'Drei Werkstätten, ein Atlas',
        intro: 'In Soundlines werden beim Surfen keine Daten massenhaft ausgelesen oder Inhalte erzeugt. Jede Inhaltsart hat ihren eigenen Produktionsweg, und jeder endet vor der Veröffentlichung mit Prüfungen.',
        lanes: [
          ['Fakten', ['Bücher, Archive, Museen', 'Recherche und Schreiben', 'Belegvermerk', 'Automatische Tests', 'Faktenprüfung']],
          ['Zeichnungen', ['Museumsfotos', 'Gestaltungskonzept', 'Zeichnungsgenerator', 'Größen- und Stilprüfung', 'Menschliche Sichtprüfung']],
          ['Klänge', ['Musikalisches Konzept', 'KI-Modell auf einem Laptop', 'Beste Aufnahme auswählen', 'Audiomessungen', 'Menschliche Hörprüfung']],
        ], destination: 'Die Soundlines-App',
      }, flows: [],
      sections: [
        ['Was die App zeigt', 'Zeitleisten für Genres, Künstler und Instrumente, eine Kreiskarte der Genreentwicklung, eine Geschichtsansicht mit Wendepunkten und Klangbeispiele für Genres – auf Englisch, Französisch, Deutsch, Italienisch und Spanisch. Jeder Balken, Kreis und jede Verbindung auf dem Bildschirm stammt aus einer einzigen Datendatei. Diese Seiten erklären deshalb alles, was du sehen kannst.'],
        ['Mit KI-Assistenten erstellt, von Menschen geprüft', 'Ein großer Teil der Recherche, Texte, Zeichnungen und Audioarbeit entstand mit KI-Assistenten nach schriftlichen, versionierten Verfahren. Assistenten schlagen vor; automatische Prüfungen messen; Menschen entscheiden. Ein bestandener Test beweist niemals, dass ein Datum stimmt, eine Zeichnung genau ist oder ein Loop gut klingt.'],
        ['Ehrlich über Unsicherheit', 'Der Katalog ist repräsentativ, nicht vollständig. Ungefähre Datierungen sind keine genauen Erfindungsdaten. Verlässlichkeit ist ein redaktionelles Urteil, keine Wahrscheinlichkeit. Die Farbabstufung zur historischen Bedeutung ist keine Beliebtheitsrangliste, und fehlende Belege rechtfertigen niemals eine erfundene Beziehung.'],
      ], resources: [['README.md', 'Projekt und lokale Einrichtung'], ['docs/EXPLORER.md', 'Den Explorer verwenden']],
    },
    graph: {
      label: 'Musikdaten', title: 'Woher die Fakten kommen.',
      intro: 'Jedes Genre, jeder Künstler und jede Verbindung in Soundlines ist eine kleine Aussage mit zugehörigen Quellen. So gelangt sie vom Bibliotheksregal zu einer Linie auf deinem Bildschirm.',
      flows: [{ title: 'Der Weg einer Verbindung', caption: 'Von einer offenen Frage zu einer veröffentlichten Verbindung mit Quellen. Quellen werden gelesen, um Aussagen zu prüfen; ihr Inhalt wird niemals in die App kopiert.', steps: [
        { actor: 'agent', title: 'Eine Lücke erkennen', text: 'Ein Rechercheassistent vergleicht den Graphen mit der Geschichte, die er abdecken soll (fehlende Regionen, Jahrzehnte oder Genres), und schlägt Ergänzungen mit Quellen vor. Er ändert nichts.', output: ['doc', 'Vorschlag mit Quellen'], preview: { kind: 'note', title: 'Vorschlag', lines: ['Chicago House, entstanden aus Disco', 'Späte 1970er- bis 1980er-Jahre', '3 Quellen: öffentliches Radio, PBS, ein staatliches Museum'] } },
        { actor: 'human', title: 'Über Ergänzungen entscheiden', text: 'Die Projektleitung wählt Vorschläge aus und entscheidet über Ermessensfragen: Beziehungstyp, ungefähren Zeitraum, Verlässlichkeit.', output: ['decision', 'Genehmigte Ergänzungsliste'], preview: { kind: 'checks', items: ['Verbindung hinzufügen', 'Typ: entstanden aus, nicht nur Einfluss', 'Verlässlichkeit: mittel'] } },
        { actor: 'script', title: 'Quellen abrufen', text: 'Jede zitierte Seite wird heruntergeladen und das Ergebnis protokolliert (bisher {fetchAttempts} Versuche). Lehnt ein Server ab, wird eine andere Methode versucht.', output: ['log', 'Abrufprotokoll mit einer Zeile je Versuch'], preview: { kind: 'log', items: [['ok', 'wcmu.org · vollständige Seite'], ['ok', 'pbs.org · vollständige Seite'], ['blocked', 'academic.oup.com · gesperrt (403)']] } },
        { actor: 'human', title: 'Gesperrt? Manuell öffnen', text: 'Viele Verlage sperren automatisierte Leser ({fetchBlocked} Versuche). Deshalb wurden {fetchBrowser} Seiten in einem gewöhnlichen Browser geöffnet. Ein Suchausschnitt allein bestätigt keine Aussage.', output: ['doc', 'Von einem Menschen gelesene Seiten'], preview: { kind: 'page', title: '909originals.com', lines: ['„House“, The Face, 1986 (PDF)', 'Im Browser geöffnet'] } },
        { actor: 'agent', title: 'Ergebnisse festhalten', text: 'Ein Bearbeitungsassistent aktualisiert die Datendatei, die Übersetzungen und einen Belegvermerk, der festhält, was jede Quelle stützt und was nicht. Beschreibungen werden in eigenen Worten verfasst.', output: ['data', 'graph.json, Übersetzungen und Belegvermerk'], preview: { kind: 'link', from: 'Disco', to: 'Chicago House', type: 'entstanden aus', confidence: 'mittel' } },
        { actor: 'test', title: 'Automatische Prüfungen', text: 'Tests lehnen fehlerhafte IDs, Verbindungen ohne Ziel, unmögliche Datierungen, falsche Richtungen sowie fehlende Übersetzungen und Belege ab.', output: ['report', 'Ergebnisbericht: bestanden oder fehlgeschlagen'], preview: { kind: 'checks', items: ['IDs und Verbindungen auflösbar', 'Datierungen und Richtung plausibel', 'Übersetzungen vorhanden', 'Belegvermerk vorhanden'] } },
        { actor: 'agent', title: 'Quellen erneut öffnen', text: 'Der Faktencheck prüft die Quellen und empfiehlt Korrekturen, eine niedrigere Konfidenz, einen anderen Beziehungstyp oder eine Entfernung. Im Review meldet er seine Befunde an den Prüfer, der nötige Korrekturen an den Editor zurückgibt.', output: ['doc', 'Befunde des Faktenchecks'], preview: { kind: 'note', title: 'Belegvermerk', lines: ['Quelle geprüft, Wortlaut angepasst', 'Entstanden aus · mittel', 'Geprüft am 05.11.2026'] } },
        { actor: 'human', title: 'Prüfen und veröffentlichen', text: 'Die gesamte Änderung wird geprüft und zusammengeführt. Die App liest anschließend die aktualisierte Datei. Es gibt weder eine Datenbank noch laufendes Auslesen fremder Seiten.', output: ['app', 'Verbindung in der App verfügbar'], preview: { kind: 'screen', shot: 'graph', alt: 'Chicago House in der Soundlines-Genrezeitleiste mit seiner Verbindung zu Disco' } },
      ], loops: [
        { from: [6, 7, 8], to: 5, label: 'Validierungsfehler, schwache Belege oder Befunde aus der Prüfung' },
      ] }],
      sections: [
        ['Eine Datei, neun Eintragstypen', 'Alle Daten stehen in einer JSON-Datei: {entries} Einträge ({genres} Genres, {artists} Künstler, {instruments} Instrumente sowie Labels, Orte, Titel, Szenen, Ereignisse und Festivals), verbunden durch {connections} typisierte Beziehungen. Jeder Eintrag hat eine feste ID wie genre:chicago-house, auf die Übersetzungen, Belegvermerke und die App verweisen.'],
        ['Was eine gute Quelle ausmacht', 'Wissenschaftliche Bücher und Zeitschriften, Museen, Archive und Bibliotheken, etablierte Musiknachschlagewerke, seriöse Rundfunkanbieter und offizielle Archive. Wikipedia kann Ausgangspunkt oder Gegenprüfung sein, aber niemals der einzige Beleg, wenn bessere Quellen vorliegen. Blogs, Foren, Fan-Wikis und Suchergebnisseiten werden abgelehnt.'],
        ['Verbindungen haben Bedeutung', 'Ein Einfluss ist keine Abstammung, ein Untergenre keine Fusion, eine Festivalverbindung Kontext und keine Herkunft. Jede Verbindung hat einen Typ, eine Richtung, eine Verlässlichkeitsstufe (ein redaktionelles Urteil, keine Wahrscheinlichkeit) und oft eine erläuternde Anmerkung. {evidenceNotes} Belegvermerke halten die Prüfungen fest.'],
        ['Übersetzen, ohne Geschichte umzuschreiben', 'Übersetzungen stehen in getrennten Dateien mit denselben IDs. Sie übersetzen nur Wörter: Sie können weder Einträge ergänzen noch Datierungen ändern oder Verbindungen verschieben. Für die neuen Sprachen wurden die umfangreichen Graphtexte mithilfe eines lokal ausgeführten Übersetzungsmodells übertragen. Namen und Zahlen wurden geschützt, musikalisches Vokabular stichprobenartig geprüft und redaktionelle Korrekturen ergänzt. Maschinelle Unterstützung ersetzt keine vollständige sprachliche Prüfung.'],
      ],
      example: { title: 'Chicago House ← Disco', intro: 'Eine Verbindung aus der Kreiskarte, genau wie gespeichert und dokumentiert.', rows: [
        ['Verbindung', 'Chicago House entstand aus Disco'], ['Verlässlichkeit', 'Mittel'], ['Quellen', 'WCMU Public Radio · PBS · Ausstellung der Abraham Lincoln Presidential Library and Museum'],
        ['Redaktionelle Anmerkung', 'Disco-Edits, die DJ-Praxis der Disco, Soul und Drumcomputer flossen alle in Chicago House ein. Die Abstammung ist real, doch Disco sollte nicht als einziger Ursprung dargestellt werden.'], ['Prüfung', 'Quellen geprüft und Wortlaut angepasst, 5. November 2026'],
      ], path: 'docs/graph/evidence/edges/lineage__chicago-house-disco.md', link: 'Belegvermerk lesen' },
      resources: [['docs/DATA.md', 'Daten- und Beitragsverfahren'], ['docs/GRAPH.md', 'Schema und Bedeutung der Verbindungen'], ['docs/graph/evidence/README.md', 'Belege und Prüfungen']],
    },
    artwork: {
      label: 'Instrumentenzeichnungen', title: 'Auf einen Blick erkennbar.',
      intro: 'Jedes der {instruments} Instrumente wird als Code in SVG-Vektordateien gezeichnet, statt als Bild gemalt oder erzeugt. Jede Kurve lässt sich prüfen, und ein Skript kann überprüfen, ob ein 24-Pixel-Symbol noch wie das echte Instrument aussieht.',
      flows: [{ title: 'Vom Museumsfoto zum App-Symbol', caption: 'Vom belegten Konzept bis zur menschlichen Freigabe.', steps: [
        { actor: 'agent', title: 'Das Original studieren', text: 'Ein Gestaltungskonzept sammelt geprüfte Museums- oder Fotoreferenzen, die Silhouette, Erkennungsmerkmale mit ihrer Anzahl (Saiten, Tasten, Trommeln) und zu vermeidende Verwechslungen.', output: ['doc', 'Gestaltungskonzept'], preview: { kind: 'note', title: 'Konzept: Saxofon', lines: ['Gebogenes Altsaxofon: S-Bogen, aufwärts gerichteter Schallbecher', 'Runde Klappendeckel entlang eines konischen Korpus', 'Vermeiden: eine gerade Klarinette oder Trompete'] } },
        { actor: 'script', title: 'Die Vorlage zeichnen', text: 'Die meisten Instrumente werden einmal in einem Python-Generator beschrieben: Formen, Proportionen und Familienfarben. Ein KI-Assistent schreibt diesen Code und passt ihn an.', output: ['code', 'Zeichnungscode (Python)'], preview: { kind: 'blueprint', title: 'Saxofon · Vektorskizze', units: 'Zeichnungseinheiten', anchors: 'Ankerpunkte', handles: 'Kurvengriffe', description: 'Saxofonumriss mit Ankerpunkten und Griffen zur Formung einer Kurve. Die Maße sind Zeichnungseinheiten und nicht die Größe des echten Instruments.' } },
        { actor: 'script', title: 'Vier Versionen exportieren', text: 'Ein einfarbiges Symbol, ein breites Banner, ein runder Avatar und ein transparenter Hintergrund für den Kopfbereich mit Platz für den Titel.', output: ['image', 'Vier SVG-Bilder'], preview: { kind: 'artwork' } },
        { actor: 'test', title: 'Messen', text: 'Prüfungen kontrollieren Dateistruktur, Palette, Größe, die Ausfüllung des 24-Pixel-Quadrats und die Übereinstimmung der Dateien mit dem Generator.', output: ['report', 'Prüfbericht und PNG-Prüfbögen'], preview: { kind: 'checks', items: ['Familienpalette', 'Dateistruktur und Größe', 'Symbol bei 24 px lesbar', 'Entspricht dem Generator'] } },
        { actor: 'agent', title: 'Zeichnung prüfen', text: 'Der Prüfer vergleicht die Bögen mit dem Konzept und kontrolliert die Herkunft der Dateien. Fehler in der Zeichnung werden korrigiert, Fehler im Konzept dort behoben. Fehlgeschlagene Prüfungen oder unklare Herkunft blockieren die Freigabe.', output: ['report', 'Prüfurteil'], preview: { kind: 'checks', items: ['Zeichnung oder Dateien korrigieren', 'Konzept oder Referenzen überarbeiten'] } },
        { actor: 'human', title: 'Ansehen und freigeben', text: 'Nach der Prüfung gibt ein Mensch die Zeichnung in Storybook endgültig frei.', output: ['app', 'Zeichnung in der App'], preview: { kind: 'screen', shot: 'artwork', alt: 'Die Saxofon-Seitenleiste in der Soundlines-Instrumentenzeitleiste' } },
      ], loops: [
        { from: [4, 5], to: 2, label: 'Zeichnung oder Dateien korrigieren' },
        { from: [5], to: 1, label: 'Konzept oder Referenzen überarbeiten' },
      ] }],
      sections: [
        ['Warum mit Code zeichnen?', 'SVG-Zeichnungen sind kleine Textdateien, die in jeder Größe scharf bleiben und sich an helle und dunkle Designs anpassen. Da sie aus Text bestehen, erscheint eine geänderte Saite oder Klappe bei der Prüfung wie jede andere Codeänderung. Ein Generator hält {artworkFiles} Dateien konsistent.'],
        ['Eine Sammlung statt Clipart', 'Jede Instrumentenfamilie hat ihre eigene Palette, und alle Zeichnungen teilen dieselbe leichte Neigung. So wirken alle Zeichnungen wie eine zusammengehörige Sammlung. Das Konzept stellt sicher, dass der gemeinsame Stil eine Bratsche niemals wie eine Geige aussehen lässt.'],
        ['Was Maschinen nicht beurteilen können', 'Ein Skript erkennt, dass ein Symbol zu klein ist; es erkennt keinen falschen Halswinkel einer Laute. Deshalb bleiben gerenderte Bögen und die menschliche Sichtprüfung getrennte, verpflichtende Schritte.'],
      ], showcase: true,
      resources: [['docs/DATA.md#instrument-artwork', 'Zeichnungsverfahren'], ['.github/skills/artwork-draw/SKILL.md', 'Zeichenverfahren und Hausstil'], ['docs/artwork/briefs', 'Gestaltungskonzepte'], ['scripts/artwork/generate-instrument-artwork.py', 'Hauptgenerator für Zeichnungen']],
    },
    audio: {
      label: 'Klangproduktion', title: 'Wie entstehen die Klänge in Soundlines?',
      intro: 'Die Klänge in Soundlines sind eigenständige Instrumentalstücke, die auf einem Laptop mit ACE-Step 1.5, einem quelloffenen Musikmodell, erzeugt wurden, keine Ausschnitte berühmter Aufnahmen. Besucher laden nur fertige Dateien herunter: Während des Surfens läuft keine KI.',
      flows: [{ title: 'So entsteht ein nahtloser Loop', caption: 'Die Schallplatte auf der Startseite dreht sich zu Loops, die so entstanden sind.', steps: [
        { actor: 'agent', title: 'Das Konzept schreiben', text: 'Tempo, Tonart, Taktart, Länge und eine eigenständige instrumentale Beschreibung des Genres: kein Gesang, keine bekannte Melodie, kein Intro oder Break.', output: ['doc', 'Loop-Konzept'], preview: { kind: 'note', title: 'Konzept: Hip-Hop-Loop', lines: ['Boom-Bap · 92 BPM · d-Moll', '4 Takte, kein Gesang, kein Intro', '5 Zufallsstartwerte ausprobieren'] } },
        { actor: 'model', title: 'Die Musik planen', text: 'Ein Sprachmodell mit vier Milliarden Parametern schreibt zunächst für jede Aufnahme einen kompakten musikalischen Plan, sogenannte Audiocodes.', output: ['data', 'Audiocodes für jede Aufnahme'], preview: { kind: 'codes' } },
        { actor: 'model', title: 'Den Klang erzeugen', text: 'Ein zweites Modell verwandelt diesen Plan in 80 Verfeinerungsschritten in Audio. Beide laufen nacheinander, weil sie nicht gemeinsam in den Arbeitsspeicher des Laptops passen.', output: ['audio', 'Rohaufnahmen'], preview: { kind: 'takes' } },
        { actor: 'test', title: 'Aufnahmen prüfen', text: 'Fehlerhafte Aufnahmen vor dem Schnitt aussortieren. Bleiben weniger als zwei übrig, weitere Seeds planen und rendern.', output: ['audio', 'Geprüfte Aufnahmen'], preview: { kind: 'checks', items: ['Geprüfte Aufnahmen'] } },
        { actor: 'script', title: 'Den perfekten Schnitt finden', text: 'Mehrere Aufnahmen werden mit unterschiedlichen Zufallsstartwerten erzeugt. Skripte passen ein Beat-Raster an, vergleichen Abschnitte von vier Takten und behalten den flüssigsten, mit einer Überblendung von 8 ms an der Nahtstelle.', output: ['audio', 'Nahtloser Loop und Auswahlbericht'], preview: { kind: 'loop', caption: '135 Schnitte verglichen · Startwert 41126', takeLabel: 'Vollständige Aufnahme', schematicLabel: 'schematische Wellenform', discardedLabel: 'Verworfen', selectionLabel: 'Ausgewählter Abschnitt', keptLabel: 'Beibehaltener Loop' } },
        { actor: 'test', title: 'Messen', text: 'Genaue Länge und Tempo, Lautheit, Übersteuerung, Aussetzer, Stabilität zwischen Takten, Mono-Bass und Hinweise auf versteckten Gesang im Spektrogramm.', output: ['report', 'Messungen und Spektrogramme'], preview: { kind: 'checks', items: ['Genau 16 Schläge', 'Keine Übersteuerung oder Aussetzer', 'Bass in Mono', 'Warnung im Stimmbereich'] } },
        { actor: 'agent', title: 'Loop prüfen', text: 'Der Prüfer bewertet Spektrogramme, musikalische Passung und Herkunft. Fehler bei Validierung oder Herkunft blockieren die Veröffentlichung. Er kann einen anderen Schnitt, eine andere Aufnahme oder ein überarbeitetes Konzept verlangen.', output: ['report', 'Prüfurteil'], preview: { kind: 'checks', items: ['Prüfurteil'] } },
        { actor: 'human', title: 'Anhören', text: 'Zahlen ersetzen keine Ohren: Ein Mensch hört zu und gibt die WAV-Datei vor der Veröffentlichung frei.', output: ['app', 'WAV-Loop auf dem Plattenspieler'], preview: { kind: 'player', caption: 'turntable-hip-hop.wav · 10,4 s, nahtlos', waveformLabel: 'Wellenform des Hip-Hop-Loops der Startseite', playerLabel: 'Hip-Hop-Loop der Startseite' } },
      ], loops: [
        { from: [4, 7], to: 2, label: 'Zu wenige geeignete Aufnahmen oder eine neue Aufnahme nötig' },
        { from: [6, 7], to: 5, label: 'Falsche Länge oder hörbare Naht: anderen Schnitt versuchen' },
        { from: [7], to: 1, label: 'Konzept oder Originalität problematisch: Konzept überarbeiten' },
      ] },
        {
          title: 'So entstehen die Hörproben des Katalogs',
          caption: 'Hörproben haben eigene Konzepte, einen eigenen Renderer und ein eigenes Prüfverfahren.',
          steps: [
            { actor: 'agent', title: 'Konzept schreiben', text: 'Genre und Instrumentierung beschreiben.', output: ['doc', 'Hörprobenkonzept'], preview: { kind: 'checks', items: ['Hörprobenkonzept'] } },
            { actor: 'script', title: 'Hörprobe rendern', text: 'Der Standardrenderer nutzt ACE-Step Turbo mit acht Schritten und einem Planer mit 1,7 Milliarden Parametern. Er schneidet die mittleren zehn Sekunden aus einer 32-Sekunden-Aufnahme. Die Fortschrittsdatei erlaubt es, fertige Clips zu überspringen und fehlgeschlagene erneut zu rendern.', output: ['audio', '10-Sekunden-Clip'], preview: { kind: 'checks', items: ['10-Sekunden-Clip'] } },
            { actor: 'agent', title: 'Prüfen und vergleichen', text: 'Wiedergabe und technische Fehler prüfen, dann die Clips bewerten. Pro auffälligem Genre das Konzept überarbeiten und einen zweiten Clip separat rendern. Beide mit demselben Verfahren vergleichen und bei fehlender Verbesserung das Original behalten.', output: ['report', 'Ausgewählter Clip und Vergleich'], preview: { kind: 'checks', items: ['Ausgewählter Clip und Vergleich'] } },
          ],
          loops: [{ from: [3], to: 1, label: 'Eine separate Neuaufnahme pro auffälligem Genre' }],
        },
      ],
      sections: [
        ['Warum lokal erzeugen?', 'Das Modell auf einem Laptop auszuführen hält alle Einstellungen, Zufallsstartwerte und Dateien unter Kontrolle und hinterlässt eine schriftliche Spur: Jeder Loop hat ein Konzept und einen Auswahlbericht mit Startwerten, Schnittpunkten und Vergleichen. Jeder kann nachvollziehen, wie ein Klang entstand.'],
        ['Eigenständig statt nachgeahmt', 'Konzepte beschreiben den Charakter eines Genres (Groove, Instrumente, Produktionszeit), niemals einen bestimmten Künstler, Titel oder eine Stimme. Prüfungen achten neben der Klangqualität auf versteckten Gesang und das Risiko einer Nachahmung.'],
      ],
      example: { title: 'Der Loop der Startseite', intro: 'Der Hip-Hop-Loop auf Seite A des Plattenspielers.', rows: [
        ['Stil', 'Eigenständiges Boom-Bap-Instrumental, d-Moll, 92 BPM'], ['Modelle', 'ACE-Step 1.5: 4B-Planer, danach XL-SFT-Klangerzeugung mit 80 Schritten'], ['Aufnahmen', 'Fünf Aufnahmen von je 36 Sekunden (Startwerte 73192, 18409, 60217, 41126, 52880)'], ['Ausgewählt', 'Startwert 41126, ab 11,668 s: genau 16 Schläge, 10,435 s'], ['Format', 'Stereo-WAV, 48 kHz. MP3 oder AAC würden Stille hinzufügen, die einen nahtlosen Loop unterbricht.'], ['Seite B', 'Die Trap-Version (helles Design) ist aus derselben Phrase neu arrangiert. So bleibt beim Designwechsel der Takt erhalten.'],
      ], path: 'docs/loops/briefs/turntable-hip-hop.json', link: 'Konzept lesen' },
      resources: [['docs/AUDIO.md', 'Audioformate und Herkunft der Klangerzeugung'], ['.github/skills/loop-produce/SKILL.md', 'Produktion nahtloser Loops'], ['docs/loops/briefs', 'Loop-Konzepte und Auswahlberichte']],
    },
    build: {
      label: 'Technischer Aufbau', title: 'Eine App, eine Datendatei und ein Team von Assistenten.',
      intro: 'Soundlines ist eine Web-App aus quelloffenen Werkzeugen, einer einzigen Musikdatendatei und {skills} schriftlichen Verfahren, denen {agents} spezialisierte KI-Assistenten unter menschlicher Aufsicht folgen.',
      flows: [{ title: 'Von der Datendatei zum Bildschirm', caption: 'Es gibt keine Datenbank: Der Musikgraph wird mit der App ausgeliefert.', steps: [
        { actor: 'script', title: 'Die Datendatei', text: 'graph.json enthält alle Einträge und Verbindungen; getrennte Dateien enthalten die übersetzten Texte.', output: ['data', 'Eine JSON-Datei je Sprache'], preview: { kind: 'files', items: ['graph.json', 'graph.fr.json', 'graph.de.json', 'graph.it.json', 'graph.es.json'] } },
        { actor: 'script', title: 'Eine Abfrageschicht', text: 'Ein einziges TypeScript-Modul beantwortet alle Fragen (Nachbarn, Entwicklungslinien, Zeiträume, Suche), sodass die Oberfläche die Datei niemals direkt liest.', output: ['code', 'Fertige Antworten für die Seiten'], preview: { kind: 'note', title: 'Chicago House', lines: ['Entstanden aus: Disco', '1980 – heute', 'Familie Disco und House'] } },
        { actor: 'script', title: 'Seiten', text: 'Next.js und React rendern jede Seite auf dem Server auf Englisch, Französisch, Deutsch, Italienisch oder Spanisch. Anschließend werden Zeitleisten, Kreiskarte und Audio interaktiv.', output: ['app', 'Interaktive Seiten in fünf Sprachen'], preview: { kind: 'screen', shot: 'artwork', alt: 'Die Soundlines-Instrumentenzeitleiste mit geöffneter Saxofon-Seitenleiste' } },
        { actor: 'test', title: 'Tests und Build', text: 'Graph- und Grafikprüfungen laufen auf GitHub, wenn ein Pull Request die dafür konfigurierten Pfade ändert. Vor dem Zusammenführen die relevanten Prüfungen ausführen. Vercel baut die App für die Veröffentlichung.', output: ['report', 'Erfolgreiche Prüfungen und Produktionsbuild'], preview: { kind: 'checks', items: ['Graphprüfungen', 'Zeichnungsprüfungen', 'Tests und Linting', 'Produktionsbuild'] } },
        { actor: 'script', title: 'Hosting', text: 'Die App wird auf Vercel bereitgestellt; diese Begleitseite ist eine eigenständige statische Website auf GitHub Pages.', output: ['app', 'Die veröffentlichte App und diese Website'], preview: { kind: 'screen', shot: 'home', alt: 'Die Soundlines-Startseite mit ihrem Plattenspieler' } },
      ] }],
      sections: [
        ['Die Werkzeuge', 'Durchgehend TypeScript; React 19 und der Next.js App Router für die App; Tailwind CSS für Stile; next-intl für die fünf Sprachen; Vitest und Storybook für Tests und Komponentenvorschauen; Docker Compose für die lokale Einrichtung mit einem Befehl. Diese Begleitseite verwendet React und Vite, zu statischem HTML vorgerendert.'],
        ['Nachlesbare Verfahren', 'Skills sind schrittweise Verfahren mit eigenen Skripten im Repository; Agenten sind Rollenbeschreibungen, die sie verwenden. Da sie wie Code versioniert sind, kann jeder genau nachlesen, welchen Auftrag ein Assistent erhielt, und ihn verbessern.'],
        ['Möchtest du helfen?', 'Eine bessere Quelle, eine korrigierte Verbindung, eine klarere Übersetzung oder ein besser erkennbares Instrument sind ebenso wichtig wie eine neue Funktion. Halte Änderungen klein, führe die passenden Prüfungen aus und erläutere deine Belege in der Pull-Anfrage.'],
      ], resources: [['docs/INSTALLATION.md', 'Werkzeuge und Umgebung einrichten'], ['docs/DEVELOPMENT.md', 'Entwicklung und Bereitstellung'], ['docs/ARCHITECTURE.md', 'Anwendungsarchitektur'], ['.github/agents', 'Spezialisierte Agenten'], ['.github/skills', 'Wiederverwendbare Verfahren'], [storybookUrl, 'Komponentengalerie (Storybook)']],
    },
  },
}
