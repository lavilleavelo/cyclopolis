import { removeDiacritics } from '~/helpers/helpers';
import { isLineStringFeature } from '~/types';
import config from '~/config.json';

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) {
    return n;
  }

  if (n === 0) {
    return m;
  }

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min((prev[j] ?? 0) + 1, (curr[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n] ?? m;
}

export interface SearchResult {
  type: 'page' | 'blog' | 'voie' | 'section' | 'compteur-velo' | 'compteur-voiture' | 'compteur-comparaison';
  label: string;
  sublabel: string;
  href: string;
  line?: number;
  status?: string;
}

const staticPages: SearchResult[] = [
  {
    type: 'page',
    label: 'Carte interactive',
    sublabel: 'Explorer le réseau sur la carte',
    href: '/carte-interactive',
  },
  { type: 'page', label: 'Évolution du réseau', sublabel: "Suivre l'avancement au fil du temps", href: '/evolution' },
  { type: 'page', label: 'Chronologie', sublabel: 'Les tronçons livrés mois par mois', href: '/chronologie' },
  { type: 'page', label: 'Plan officiel', sublabel: 'Le plan publié par la Métropole', href: '/plan-officiel' },
  { type: 'page', label: 'Tableau de bord', sublabel: 'Indicateurs globaux du réseau', href: '/tableau-de-bord' },
  { type: 'page', label: 'Compteurs vélo', sublabel: 'Données de fréquentation vélo', href: '/compteurs/velo' },
  {
    type: 'page',
    label: 'Compteurs voiture',
    sublabel: 'Données de fréquentation voiture',
    href: '/compteurs/voiture',
  },
  {
    type: 'page',
    label: 'Comparaison vélo/voiture',
    sublabel: 'Comparer les compteurs vélo et voiture',
    href: '/compteurs/comparaison',
  },
  { type: 'page', label: 'Blog', sublabel: 'Articles et réflexions', href: '/blog' },
  { type: 'page', label: 'Historique des nouveautés', sublabel: 'Toutes les actualités du site', href: '/historique' },
  { type: 'page', label: 'Sites partenaires', sublabel: 'Les autres observatoires', href: '/sites-partenaires' },
];

export function useGlobalSearch() {
  const results = ref<SearchResult[]>([]);
  const loading = ref(false);
  const loaded = ref(false);

  let allResults: SearchResult[] = [];
  let defaultResults: SearchResult[] = [];

  async function loadIndex() {
    if (loaded.value) return;
    loading.value = true;

    const [geojsons, veloCounters, voitureCounters, voiesPages, blogArticles] = await Promise.all([
      queryCollection('voiesCyclablesGeojson').all(),
      queryCollection('compteurs').where('path', 'LIKE', '/compteurs/velo%').all(),
      queryCollection('compteurs').where('path', 'LIKE', '/compteurs/voiture%').all(),
      queryCollection('voiesCyclablesPage').all(),
      queryCollection('blog').all(),
    ]);

    const voieEndpoints = new Map(voiesPages.map((v) => [v.line, { from: v.from, to: v.to }]));

    const sectionResults: SearchResult[] = [];
    const seenSections = new Set<string>();

    for (const geojson of geojsons) {
      for (const feature of geojson.features) {
        if (!isLineStringFeature(feature)) continue;
        const key = `${feature.properties.line}-${feature.properties.name}`;
        if (seenSections.has(key)) continue;
        seenSections.add(key);

        const link = feature.properties.link || '';
        const anchor = link.includes('#') ? link.split('#')[1] : '';

        let href = `/carte-interactive?modal=details&line=${feature.properties.line}&sectionName=${encodeURIComponent(feature.properties.name)}&fromSearch=1`;
        if (anchor) {
          href += `&sectionAnchor=${encodeURIComponent(anchor)}`;
        }

        sectionResults.push({
          type: 'section',
          label: feature.properties.name,
          sublabel: `${config.revName.abbreviated} ${feature.properties.line}`,
          href,
          line: feature.properties.line,
          status: feature.properties.status,
        });
      }
    }

    const voieResults: SearchResult[] = [];
    const lines = new Set(sectionResults.map((s) => s.line!));
    for (const line of Array.from(lines).sort((a, b) => a - b)) {
      voieResults.push({
        type: 'voie',
        label: `${config.revName.singular} ${line}`,
        sublabel: voieEndpoints.has(line) ? `${voieEndpoints.get(line)!.from} → ${voieEndpoints.get(line)!.to}` : '',
        href: `/voie-lyonnaise-${line}`,
        line,
      });
    }

    const veloResults: SearchResult[] = veloCounters.map((c) => ({
      type: 'compteur-velo' as const,
      label: c.name,
      sublabel: c.arrondissement,
      href: c.path,
    }));

    const voitureCyclopolisIds = new Set(voitureCounters.filter((c) => c.cyclopolisId).map((c) => c.cyclopolisId));
    const voitureResults: SearchResult[] = voitureCounters
      .filter((c) => !c.cyclopolisId)
      .map((c) => ({
        type: 'compteur-voiture' as const,
        label: c.name,
        sublabel: c.arrondissement,
        href: c.path,
      }));

    const comparaisonResults: SearchResult[] = veloCounters
      .filter((c) => c.cyclopolisId && voitureCyclopolisIds.has(c.cyclopolisId))
      .map((c) => ({
        type: 'compteur-comparaison' as const,
        label: c.name,
        sublabel: `${c.arrondissement} — vélo/voiture`,
        href: `/compteurs/comparaison/${c.cyclopolisId}`,
      }));

    const blogResults: SearchResult[] = blogArticles.map((article) => ({
      type: 'blog' as const,
      label: article.title,
      sublabel: article.description,
      href: article.path,
    }));

    defaultResults = [...voieResults, ...staticPages];
    allResults = [
      ...voieResults,
      ...sectionResults,
      ...veloResults,
      ...voitureResults,
      ...comparaisonResults,
      ...staticPages,
      ...blogResults,
    ];
    loaded.value = true;
    loading.value = false;
  }

  function parseVoieQuery(text: string): number | null {
    const normalized = removeDiacritics(text.trim().toLowerCase());
    const match = normalized.match(/^(?:vl\s*|voie[- ]?lyonnaise?\s*)?(\d{1,2})$/);
    if (match) {
      const num = Number(match[1]);
      if (num >= 1 && num <= 20) return num;
    }
    return null;
  }

  function search(query: string) {
    if (!query || query.length < 1) {
      results.value = defaultResults;
      return;
    }

    const normalized = removeDiacritics(query.toLowerCase());

    const voieNum = parseVoieQuery(query);
    if (voieNum !== null) {
      const voieMatch = allResults.filter((r) => r.type === 'voie' && r.line === voieNum);
      const sectionMatches = allResults.filter((r) => r.type === 'section' && r.line === voieNum).slice(0, 15);
      results.value = [...voieMatch, ...sectionMatches];
      return;
    }

    if (query.length < 2) {
      results.value = [];
      return;
    }

    const terms = normalized.split(/\s+/).filter(Boolean);

    const scored = allResults
      .map((result) => {
        const haystack = removeDiacritics(`${result.label} ${result.sublabel}`.toLowerCase());
        const haystackWords = haystack.split(/[\s\-'/]+/).filter(Boolean);
        const labelNorm = removeDiacritics(result.label.toLowerCase());
        let score = 0;

        for (const term of terms) {
          if (haystack.includes(term)) {
            score += 3;
            if (labelNorm.startsWith(term)) score += 10;
            continue;
          }

          const maxDist = term.length <= 3 ? 1 : 2;
          const fuzzyMatch = haystackWords.some((word) => levenshtein(term, word.slice(0, term.length + 2)) <= maxDist);
          if (!fuzzyMatch) return null;
          score += 1;
        }

        if (result.type === 'voie') score += 5;
        if (result.type === 'page') score += 4;
        if (result.type === 'blog') score += 2;
        return { result, score };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.score - a.score);

    results.value = scored.slice(0, 20).map((s) => s.result);
  }

  return { results, loading, search, loadIndex };
}
