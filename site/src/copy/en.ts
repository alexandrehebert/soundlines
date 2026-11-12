import { storybookUrl } from '../links.ts'
import type { Copy } from '../content.ts'

export const en: Copy = {
  skip: 'Skip to content',
  navigation: 'Behind the scenes',
  language: 'Language',
  openApp: 'Open Soundlines',
  eyebrow: 'Behind the scenes of a music atlas',
  source: 'Explore the source',
  next: 'Visit each workshop',
  resources: 'Go deeper',
  footer: 'A curated atlas, not an exhaustive history. Sources, uncertainty, and human judgment matter.',
  docsNote: 'Detailed technical guides live in the repository and are currently in English.',
  legend: 'Who does what',
  produces: 'Produces',
  result: 'Final result',
  backTo: 'back to step',
  example: 'Real example',
  examples: 'Real examples',
  brief: 'Read its brief',
  actors: {
    human: 'Person',
    agent: 'AI assistant',
    model: 'AI model',
    script: 'Code',
    test: 'Automatic check',
  },
  stats: [
    ['entries', 'entries: genres, artists, places…'],
    ['connections', 'documented connections'],
    ['sources', 'distinct source links'],
    ['artworkFiles', 'instrument drawings'],
    ['evidenceNotes', 'evidence notes'],
  ],
  pages: {
    index: {
      label: 'Overview',
      title: 'Music has no straight lines.',
      intro:
        'Soundlines is an interactive atlas of musical lineages. This companion opens the workshop behind it: where each fact comes from, how every drawing and sound was made, and who (or what) checked them before they reached the app.',
      overview: {
        title: 'Three workshops, one atlas',
        intro:
          'Nothing in Soundlines is scraped in bulk or generated while you browse. Each kind of content has its own production line, and every line ends with checks before anything is published.',
        lanes: [
          ['Facts', ['Books, archives, museums', 'Research and writing', 'Evidence note', 'Automatic tests', 'Fact-check']],
          ['Drawings', ['Museum photos', 'Visual brief', 'Drawing generator', 'Size and style checks', 'Human look']],
          ['Sounds', ['Musical brief', 'AI model on a laptop', 'Best take chosen', 'Audio measurements', 'Human listen']],
        ],
        destination: 'The Soundlines app',
      },
      flows: [],
      sections: [
        [
          'What you see in the app',
          'Timelines of genres, artists and instruments, a bubble map of how genres descend from one another, a History view of turning points and genre sounds to listen to, in English, French, German, Italian and Spanish. Every bar, bubble and link on screen comes from a single data file, so the pages here explain everything you can see.',
        ],
        [
          'Made with AI assistants, checked by people',
          'Much of the research, writing, drawing and audio work was done with AI assistants following written, versioned procedures. Assistants propose; automatic checks measure; people decide. A passing test never counts as proof that a date is right, a drawing is accurate or a loop sounds good.',
        ],
        [
          'Honest about uncertainty',
          'The catalogue is representative, not exhaustive. Approximate dates are not exact invention dates. Confidence is an editorial judgement, not a probability. Prominence shading is not a popularity ranking, and missing evidence is never a reason to invent a relationship.',
        ],
      ],
      resources: [
        ['README.md', 'Project and local setup'],
        ['docs/EXPLORER.md', 'Using the explorer'],
      ],
    },
    graph: {
      label: 'Music data',
      title: 'Where the facts come from.',
      intro:
        'Every genre, artist and connection in Soundlines is a small claim with its sources attached. Here is how one travels from a library shelf to a line on your screen.',
      flows: [
        {
          title: 'The journey of one connection',
          caption: 'From an open question to a published, sourced link. Sources are read to check a claim; their content is never copied into the app.',
          steps: [
            {
              actor: 'agent',
              title: 'Spot a gap',
              text: 'A research assistant compares the graph with the history it should cover (missing regions, decades or genres) and proposes sourced additions. It edits nothing.',
              output: ['doc', 'Sourced proposal'],
              preview: { kind: 'note', title: 'Proposal', lines: ['Chicago house, derived from disco', 'Late 1970s – 1980s', '3 sources: public radio, PBS, a state museum'] },
            },
            {
              actor: 'human',
              title: 'Decide what to add',
              text: 'The maintainer chooses which proposals to pursue and settles judgement calls: relationship type, approximate period, confidence.',
              output: ['decision', 'Approved list of additions'],
              preview: { kind: 'checks', items: ['Add the connection', 'Type: derived from, not just influence', 'Confidence: medium'] },
            },
            {
              actor: 'script',
              title: 'Fetch the sources',
              text: 'Each cited page is downloaded and the outcome logged ({fetchAttempts} attempts so far). If a server refuses, another method is tried.',
              output: ['log', 'Fetch log, one line per attempt'],
              preview: { kind: 'log', items: [['ok', 'wcmu.org · full page'], ['ok', 'pbs.org · full page'], ['blocked', 'academic.oup.com · blocked (403)']] },
            },
            {
              actor: 'human',
              title: 'Blocked? Open it by hand',
              text: 'Many publishers block automated readers ({fetchBlocked} attempts), so {fetchBrowser} pages were opened in an ordinary browser. A search snippet alone never confirms a claim.',
              output: ['doc', 'Pages read by a person'],
              preview: { kind: 'page', title: '909originals.com', lines: ['“House”, The Face, 1986 (PDF)', 'Opened in a browser'] },
            },
            {
              actor: 'agent',
              title: 'Write it down',
              text: 'An editing assistant updates the data file, the translations and an evidence note recording what each source supports, and what it does not. Descriptions are written in its own words.',
              output: ['data', 'graph.json, language overlays and evidence note'],
              preview: { kind: 'link', from: 'Disco', to: 'Chicago house', type: 'derived from', confidence: 'medium' },
            },
            {
              actor: 'test',
              title: 'Machine checks',
              text: 'Tests reject broken IDs, links pointing nowhere, impossible dates, wrong directions, missing translations and missing evidence.',
              output: ['report', 'Pass or fail report'],
              preview: { kind: 'checks', items: ['IDs and links resolve', 'Dates and direction make sense', 'Translations present', 'Evidence note present'] },
            },
            {
              actor: 'agent',
              title: 'Re-open the sources',
              text: 'A fact-checker reads each source again and records a verdict: keep, correct, lower the confidence, change the type, or remove.',
              output: ['doc', 'Verdict written in the evidence note'],
              preview: { kind: 'note', title: 'Evidence note', lines: ['Source checked, wording updated', 'Derived from · medium', 'Reviewed 2026-11-05'] },
            },
            {
              actor: 'human',
              title: 'Review and publish',
              text: 'The whole change is reviewed and merged. The app then reads the updated file. There is no database and no live scraping.',
              output: ['app', 'Connection live in the app'],
              preview: { kind: 'screen', shot: 'graph', alt: 'Chicago house in the Soundlines genre timeline, with its line to disco' },
            },
          ],
          loops: [{ from: [6, 7], to: 5, label: 'Failed check or weak source' }],
        },
      ],
      sections: [
        [
          'One file, nine kinds of entry',
          'All the data lives in one JSON file: {entries} entries ({genres} genres, {artists} artists, {instruments} instruments, plus labels, places, tracks, scenes, events and festivals) linked by {connections} typed connections. Each entry has a stable ID such as genre:chicago-house, which translations, evidence notes and the app all use to refer to it.',
        ],
        [
          'What counts as a good source',
          'Scholarly books and journals, museums, archives and libraries, established music references, serious broadcasters and official archives. Wikipedia can be a starting point or a cross-check, never the only support when better sources exist. Blogs, forums, fan wikis and search-result pages are refused.',
        ],
        [
          'Connections have meanings',
          'An influence is not a descent; a subgenre is not a fusion; a festival link is context, not ancestry. Each connection has a type, a direction, a confidence level (an editorial judgement, not a probability) and often a note explaining the nuance. {evidenceNotes} evidence notes record what was checked.',
        ],
        [
          'Translating without rewriting history',
          'Each translated language lives in a separate file keyed by the same IDs. It only translates words: it cannot add entries, change dates or move connections. Machine-assisted translations are checked for musical vocabulary and refined through editorial corrections.',
        ],
      ],
      example: {
        title: 'Chicago house ← disco',
        intro: 'One link from the bubble map, exactly as it is stored and documented.',
        rows: [
          ['Connection', 'Chicago house is derived from disco'],
          ['Confidence', 'Medium'],
          ['Sources', 'WCMU public radio · PBS · Abraham Lincoln Presidential Library and Museum exhibit'],
          [
            'Editorial note',
            'Disco edits, disco DJ practice, soul and drum machines all fed Chicago house. The descent is real, but disco should not be presented as its only origin.',
          ],
          ['Review', 'Sources checked and wording updated, 5 Nov 2026'],
        ],
        path: 'docs/graph/evidence/edges/lineage__chicago-house-disco.md',
        link: 'Read its evidence note',
      },
      resources: [
        ['docs/DATA.md', 'Data and contribution workflow'],
        ['docs/GRAPH.md', 'Schema and edge semantics'],
        ['docs/graph/evidence/README.md', 'Evidence and audits'],
      ],
    },
    artwork: {
      label: 'Instrument drawings',
      title: 'Recognisable at a glance.',
      intro:
        'Each of the {instruments} instruments is drawn as code, as vector SVG files, rather than painted or generated as a picture. Every curve can be reviewed, and a script can check that a 24-pixel icon still looks like the real instrument.',
      flows: [
        {
          title: 'From museum photo to app icon',
          caption: 'Every instrument goes through the same five stations.',
          steps: [
            {
              actor: 'agent',
              title: 'Study the real thing',
              text: 'A brief gathers verified museum or photo references, the silhouette, defining features with their counts (strings, keys, drums) and look-alikes to avoid.',
              output: ['doc', 'Visual brief'],
              preview: { kind: 'note', title: 'Brief: saxophone', lines: ['Curved alto: hooked neck, upturned bell', 'Round key cups along a conical body', 'Avoid: a straight clarinet or a trumpet'] },
            },
            {
              actor: 'script',
              title: 'Draw the master',
              text: 'Most instruments are described once in a Python generator: shapes, proportions and family colours. An AI assistant writes and adjusts that code.',
              output: ['code', 'Drawing code (Python)'],
              preview: {
                kind: 'blueprint',
                title: 'Saxophone · vector sketch',
                units: 'drawing units',
                anchors: 'Anchor points',
                handles: 'Curve handles',
                description: 'Saxophone outline with anchor points and handles that shape a curve. The dimensions are drawing units, not the size of the real instrument.',
              },
            },
            {
              actor: 'script',
              title: 'Export four versions',
              text: 'A one-colour icon, a wide banner, a round avatar and a transparent header background that keeps room for the title.',
              output: ['image', 'Four SVG images'],
              preview: { kind: 'artwork' },
            },
            {
              actor: 'test',
              title: 'Measure',
              text: 'Checks verify file structure, palette, size, how much of the 24-pixel square the icon fills, and that files still match the generator.',
              output: ['report', 'Check report and PNG review sheets'],
              preview: { kind: 'checks', items: ['Family palette', 'File structure and size', 'Icon readable at 24 px', 'Matches the generator'] },
            },
            {
              actor: 'human',
              title: 'Look and approve',
              text: 'Rendered sheets are compared with the brief, before and after. A person gives the final sign-off in Storybook, the component gallery.',
              output: ['app', 'Artwork shown in the app'],
              preview: { kind: 'screen', shot: 'artwork', alt: 'The saxophone panel in the Soundlines instrument timeline' },
            },
          ],
          loops: [
            { from: [4, 5], to: 2, label: 'Failed check or unreadable icon' },
            { from: [5], to: 1, label: 'Wrong anatomy' },
          ],
        },
      ],
      sections: [
        [
          'Why draw with code?',
          'SVG drawings are small text files that stay sharp at any size and adapt to light and dark themes. Because they are text, a changed string or key shows up in review like any other code change, and one generator keeps {artworkFiles} files consistent.',
        ],
        [
          'One collection, not clip art',
          'Each instrument family has its own palette, and every drawing shares the same slight tilt, so the set reads as one collection. The brief makes sure that shared style never makes a viola look like a violin.',
        ],
        [
          'What machines cannot judge',
          'A script can tell that an icon is too small; it cannot tell that a lute has the wrong neck angle. That is why rendered sheets and a human look remain separate, required steps.',
        ],
      ],
      showcase: true,
      resources: [
        ['docs/DATA.md#instrument-artwork', 'Artwork workflow'],
        ['.github/skills/artwork-draw/SKILL.md', 'Drawing procedure and house style'],
        ['docs/artwork/briefs', 'Visual briefs'],
        ['scripts/artwork/generate-instrument-artwork.py', 'Master artwork generator'],
      ],
    },
    audio: {
      label: 'Sound Production',
      title: 'How are the sounds in Soundlines made?',
      intro:
        'The sounds in Soundlines are original instrumentals generated on a laptop with ACE-Step 1.5, an open-source music model, not excerpts of famous records. Visitors only download finished files: no AI runs while you browse.',
      flows: [
        {
          title: 'How a seamless loop is made',
          caption: 'The record on the landing page spins on loops made this way.',
          steps: [
            {
              actor: 'agent',
              title: 'Write the brief',
              text: 'Tempo, key, metre, length and an original instrumental description of the genre: no vocals, no famous melody, no intro or breakdown.',
              output: ['doc', 'Loop brief'],
              preview: { kind: 'note', title: 'Brief: hip-hop loop', lines: ['Boom-bap · 92 BPM · D minor', '4 bars, no vocals, no intro', '5 seeds to try'] },
            },
            {
              actor: 'model',
              title: 'Plan the music',
              text: 'A 4-billion-parameter language model first writes a compact musical plan, called audio codes, for each take.',
              output: ['data', 'Audio codes for each take'],
              preview: { kind: 'codes' },
            },
            {
              actor: 'model',
              title: 'Render the sound',
              text: 'A second model turns that plan into audio in 80 refinement steps. The two run one after the other because they do not fit in the laptop’s memory together.',
              output: ['audio', 'Raw takes'],
              preview: { kind: 'takes' },
            },
            {
              actor: 'script',
              title: 'Find the perfect cut',
              text: 'Several takes are rendered with different seeds. Scripts fit a beat grid, compare four-bar windows and keep the smoothest, with an 8 ms crossfade at the join.',
              output: ['audio', 'Seamless loop and selection report'],
              preview: {
                kind: 'loop',
                caption: '135 cuts compared · seed 41126',
                takeLabel: 'Full take',
                schematicLabel: 'schematic waveform',
                discardedLabel: 'Not kept',
                selectionLabel: 'Selected section',
                keptLabel: 'Kept loop',
              },
            },
            {
              actor: 'test',
              title: 'Measure',
              text: 'Exact length and tempo, loudness, clipping, dropouts, bar-to-bar stability, mono bass and signs of hidden vocals in the spectrogram.',
              output: ['report', 'Measurements and spectrograms'],
              preview: { kind: 'checks', items: ['Exactly 16 beats', 'No clipping or dropouts', 'Bass in mono', 'No hidden vocals'] },
            },
            {
              actor: 'human',
              title: 'Listen',
              text: 'Numbers do not replace ears: a person listens and approves before the WAV file ships.',
              output: ['app', 'WAV loop on the turntable'],
              preview: {
                kind: 'player',
                caption: 'turntable-hip-hop.wav · 10.4 s, seamless',
                waveformLabel: 'Waveform of the landing-page hip-hop loop',
                playerLabel: 'Landing-page hip-hop loop',
              },
            },
          ],
          loops: [
            { from: [5, 6], to: 2, label: 'Hidden vocals or audible seam: new takes' },
            { from: [6], to: 1, label: 'Wrong groove: new brief' },
          ],
        },
      ],
      sections: [
        [
          'Why generate locally?',
          'Running the model on a laptop keeps every setting, seed and file under control, and leaves a written trail: each loop has a brief and a selection report with its seeds, cut points and comparisons. Anyone can see how a sound was made.',
        ],
        [
          'Original, not imitation',
          'Briefs describe a genre’s character (groove, instruments, production era), never a specific artist, song or voice. Reviews look for hidden vocals and imitation risk as well as sound quality.',
        ],
      ],
      example: {
        title: 'The landing-page loop',
        intro: 'The hip-hop loop on side A of the turntable.',
        rows: [
          ['Style', 'Original boom-bap instrumental, D minor, 92 BPM'],
          ['Models', 'ACE-Step 1.5: 4B planner, then XL SFT renderer at 80 steps'],
          ['Takes', 'Five 36-second takes (seeds 73192, 18409, 60217, 41126, 52880)'],
          ['Chosen', 'Seed 41126, from 11.668 s: exactly 16 beats, 10.435 s'],
          ['Format', 'Stereo WAV, 48 kHz. MP3 or AAC would add silence that breaks a seamless loop.'],
          ['Side B', 'The trap version (light theme) is re-arranged from the same phrase, so switching theme keeps the beat.'],
        ],
        path: 'docs/loops/briefs/turntable-hip-hop.json',
        link: 'Read its brief',
      },
      resources: [
        ['docs/AUDIO.md', 'Audio formats and render provenance'],
        ['.github/skills/loop-produce/SKILL.md', 'Seamless-loop production'],
        ['docs/loops/briefs', 'Loop briefs and selection reports'],
      ],
    },
    build: {
      label: 'How it’s built',
      title: 'An app, a data file and a team of assistants.',
      intro:
        'Soundlines is a web app made from open-source tools, a single music data file and {skills} written procedures that {agents} specialised AI assistants follow under human supervision.',
      flows: [
        {
          title: 'From a data file to your screen',
          caption: 'There is no database: the music graph ships with the app.',
          steps: [
            {
              actor: 'script',
              title: 'The data file',
              text: 'graph.json holds every entry and connection; separate overlay files hold the translations.',
              output: ['data', 'One JSON file per language'],
              preview: { kind: 'files', items: ['graph.json', 'graph.fr.json'] },
            },
            {
              actor: 'script',
              title: 'One query layer',
              text: 'A single TypeScript module answers every question (neighbours, lineages, periods, search), so the interface never reads the file directly.',
              output: ['code', 'Ready-made answers for the pages'],
              preview: { kind: 'note', title: 'Chicago house', lines: ['Derived from: disco', '1980 – now', 'Disco & House family'] },
            },
            {
              actor: 'script',
              title: 'Pages',
              text: 'Next.js and React render each page on the server in English, French, German, Italian or Spanish, then the timelines, bubble map and audio become interactive.',
              output: ['app', 'Interactive pages in English, French, German, Italian and Spanish'],
              preview: { kind: 'screen', shot: 'artwork', alt: 'The Soundlines instrument timeline with the saxophone panel open' },
            },
            {
              actor: 'test',
              title: 'Tests and build',
              text: 'Graph and artwork checks run on GitHub for every pull request; tests, linting and a production build run before merging, and Vercel builds the app again to deploy it.',
              output: ['report', 'Green checks and a production build'],
              preview: { kind: 'checks', items: ['Graph checks', 'Artwork checks', 'Tests and linting', 'Production build'] },
            },
            {
              actor: 'script',
              title: 'Hosting',
              text: 'The app is deployed on Vercel; this companion is a separate static site on GitHub Pages.',
              output: ['app', 'The live app and this site'],
              preview: { kind: 'screen', shot: 'home', alt: 'The Soundlines home page with its turntable' },
            },
          ],
        },
      ],
      sections: [
        [
          'The stack',
          'TypeScript throughout; React 19 and the Next.js App Router for the app; Tailwind CSS for styles; next-intl for English, French, German, Italian and Spanish; Vitest and Storybook for tests and component previews; Docker Compose for a one-command local setup. This companion uses React and Vite, prerendered to static HTML.',
        ],
        [
          'Procedures you can read',
          'Skills are step-by-step procedures, with their own scripts, stored in the repository; agents are role descriptions that use them. Because they are versioned like code, anyone can read exactly what an assistant was asked to do, and improve it.',
        ],
        [
          'Want to help?',
          'A better source, a corrected connection, a clearer translation or a more recognisable instrument matters as much as a new feature. Keep changes small, run the relevant checks and explain your evidence in the pull request.',
        ],
      ],
      resources: [
        ['docs/INSTALLATION.md', 'Tool and environment setup'],
        ['docs/DEVELOPMENT.md', 'Development and deployment'],
        ['docs/ARCHITECTURE.md', 'Application architecture'],
        ['.github/agents', 'Specialised agents'],
        ['.github/skills', 'Reusable procedures'],
        [storybookUrl, 'Component gallery (Storybook)'],
      ],
    },
  },
}
