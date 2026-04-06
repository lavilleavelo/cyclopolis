import type { Collections } from '@nuxt/content';
import { isLineStringFeature } from '~/types';

export interface TimelineSection {
  name: string;
  lines: number[];
  date: string;
  month: number;
  year: number;
  type: string;
  typeName: string;
  quality: string;
  distance: number;
  mapLink: string;
  pageLinks: { line: number; href: string }[];
  features: Collections['voiesCyclablesGeojson']['features'];
}

export function useTimeline(geojsons: Ref<Collections['voiesCyclablesGeojson'][] | null | undefined>) {
  const { getLineStringDistance, typologyNames } = useStats();

  const allSections = computed<TimelineSection[]>(() => {
    if (!geojsons.value) return [];
    const grouped = new Map<string, TimelineSection>();

    for (const geojson of geojsons.value) {
      for (const feature of geojson.features) {
        if (!isLineStringFeature(feature)) continue;
        const doneAt = feature.properties.doneAt;
        if (!doneAt) continue;

        const parts = doneAt.split('/');
        if (parts.length !== 3) continue;

        const month = parseInt(parts[1]!) - 1;
        const year = parseInt(parts[2]!);
        const line = feature.properties.line;
        const name = feature.properties.name;

        const groupKey = `${name}-${doneAt}`;
        const existing = grouped.get(groupKey);

        if (existing) {
          if (!existing.lines.includes(line)) {
            existing.lines.push(line);
            existing.lines.sort((a, b) => a - b);
            existing.pageLinks.push({
              line,
              href: feature.properties.link || `/voie-lyonnaise-${line}`,
            });
            existing.pageLinks.sort((a, b) => a.line - b.line);
          }
        } else {
          grouped.set(groupKey, {
            name,
            lines: [line],
            date: doneAt,
            month,
            year,
            type: feature.properties.type,
            typeName: typologyNames[feature.properties.type] || feature.properties.type,
            quality: feature.properties.quality,
            distance: getLineStringDistance(feature),
            mapLink: `/carte-interactive?modal=details&line=${line}&sectionName=${encodeURIComponent(name)}&fromSearch=1`,
            pageLinks: [{ line, href: feature.properties.link || `/voie-lyonnaise-${line}` }],
            features: [feature],
          });
        }
      }
    }

    return Array.from(grouped.values()).sort((a, b) => {
      const dateA = `${a.year}-${String(a.month).padStart(2, '0')}-${a.date.split('/')[0]}`;
      const dateB = `${b.year}-${String(b.month).padStart(2, '0')}-${b.date.split('/')[0]}`;
      return dateA.localeCompare(dateB) || a.lines[0] - b.lines[0];
    });
  });

  return { allSections };
}
