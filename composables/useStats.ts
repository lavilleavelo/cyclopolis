import type { Collections } from '@nuxt/content';
import { groupBy } from '~/helpers/helpers';
import { isLineStringFeature, type LaneType, type LaneQuality, isDangerFeature, type LaneStatus } from '~/types';

const featureStatusOrder = [
  'done',
  'variante',
  'tested',
  'wip',
  'planned',
  'postponed',
  'variante-postponed',
  'unknown',
];

const getFeatureSortKey = (feature: Collections['voiesCyclablesGeojson']['features'][0]) => {
  const id = feature.properties.id ?? '';
  const line = feature.properties.line ?? 0;
  const status = featureStatusOrder.indexOf(feature.properties.status);
  return [status, id, line].join('|');
};

export const useStats = () => {
  function getAllUniqLineStrings(voies: Collections['voiesCyclablesGeojson'][]) {
    const lineStrings = voies
      .flatMap((voie) => voie.features)
      .filter((feature) => isLineStringFeature(feature))
      .sort((a, b) => getFeatureSortKey(a).localeCompare(getFeatureSortKey(b)));

    const seen = new Set<string>();
    return lineStrings.filter((feature) => {
      const id = feature.properties.id;
      if (id === undefined) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  function getAllUniqDangers(voies: Collections['voiesCyclablesGeojson'][]) {
    return voies
      .map((voie) => voie.features)
      .flat()
      .filter(isDangerFeature)
      .filter((feature, index, sections) => {
        if (feature.properties.id === undefined) {
          return true;
        }

        return index === sections.findIndex((section) => section.properties.id === feature.properties.id);
      });
  }

  /**
   * retourne la somme des distances de tous les tronçons passé en paramètre.
   * Attention : pas de notion de dédoublonnage ici.
   */
  function getDistance({ features }: { features: Collections['voiesCyclablesGeojson']['features'] }): number {
    return features.reduce((acc: number, feature: Collections['voiesCyclablesGeojson']['features'][0]) => {
      return acc + getLineStringDistance(feature);
    }, 0);
  }

  function getLineStringDistance(feature: Collections['voiesCyclablesGeojson']['features'][0]) {
    if (feature.geometry.type !== 'LineString') {
      throw new Error('[getLineStringDistance] Feature must be a LineString');
    }

    let distance = 0;
    const coordinates = feature.geometry.coordinates;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const coord1 = coordinates[i];
      const coord2 = coordinates[i + 1];
      if (!Array.isArray(coord1) || !Array.isArray(coord2)) {
        throw new Error('[getLineStringDistance] Invalid coordinate format');
      }
      const [lon1, lat1] = coord1;
      const [lon2, lat2] = coord2;
      distance += haversine(lat1, lon1, lat2, lon2);
    }

    return distance;
  }

  function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    // Convert latitude and longitude from degrees to radians
    const toRadians = (angle: number) => (angle * Math.PI) / 180;
    lat1 = toRadians(lat1);
    lon1 = toRadians(lon1);
    lat2 = toRadians(lat2);
    lon2 = toRadians(lon2);

    // Haversine formula
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.asin(Math.sqrt(a));

    // Radius of the Earth in meters
    const radius = 6371000;

    // Calculate the distance in meters
    return Math.round(radius * c);
  }

  function displayDistanceInKm(distance: number, precision = 0) {
    if (distance === 0) {
      return '0 km';
    }
    const distanceInKm = distance / 1000;
    return `${distanceInKm.toFixed(precision)} km`;
  }

  function displayPercent(percent: number) {
    return `${percent}%`;
  }

  /**
   * retourne la somme des distances de tous les tronçons passé en paramètre, aprèds avoir retiré les doublons.
   * un doublon est un tronçon commun entre 2 VLs
   */
  function getTotalDistance(voies: Collections['voiesCyclablesGeojson'][]) {
    const features = getAllUniqLineStrings(voies);
    return getDistance({ features });
  }

  function getStats(voies: Collections['voiesCyclablesGeojson'][]) {
    const features = getAllUniqLineStrings(voies);
    const doneFeatures = features.filter((feature) => {
      return feature.properties.status === 'variante' || feature.properties.status === 'done';
    });

    const wipFeatures = features.filter((feature) => ['wip', 'tested'].includes(feature.properties.status ?? ''));
    const plannedFeatures = features.filter((feature) =>
      ['planned', 'unknown'].includes(feature.properties.status ?? ''),
    );
    const postponedFeatures = features.filter((feature) =>
      ['postponed', 'variante-postponed'].includes(feature.properties.status ?? ''),
    );

    const totalDistance = getDistance({ features });
    const doneDistance = getDistance({ features: doneFeatures });
    const wipDistance = getDistance({ features: wipFeatures });
    const plannedDistance = getDistance({ features: plannedFeatures });
    const postponedDistance = getDistance({ features: postponedFeatures });

    function getPercent(distance: number) {
      return Math.round((distance / totalDistance) * 100);
    }

    const generateLink = (statuses: LaneStatus[]) => {
      let link = `/carte-interactive?statuses=${statuses.join(',')}&modal=filters`;

      if (voies.length === 1) {
        const voie = voies[0]?.features[0]?.properties?.line;
        if (voie) {
          link += `&lines=${voie}`;
        }
      }
      return link;
    };

    return {
      done: {
        name: 'Réalisés',
        distance: doneDistance,
        percent: getPercent(doneDistance),
        class: 'text-lvv-blue-600 font-semibold',
        link: generateLink(['done', 'variante']),
      },
      wip: {
        name: 'En travaux',
        distance: wipDistance,
        percent: getPercent(wipDistance),
        class: 'text-lvv-blue-600 font-normal',
        link: generateLink(['wip', 'tested']),
      },
      planned: {
        name: 'Prévus',
        distance: plannedDistance,
        percent: getPercent(plannedDistance),
        class: 'text-black font-semibold',
        link: generateLink(['planned', 'unknown']),
      },
      postponed: {
        name: 'Reportés',
        distance: postponedDistance,
        percent: getPercent(postponedDistance),
        class: 'text-lvv-pink font-semibold',
        link: generateLink(['postponed', 'variante-postponed']),
      },
    };
  }

  function getStatsQuality(voies: Collections['voiesCyclablesGeojson'][]): {
    unsatisfactoryDistance: number;
    postponed: boolean;
    percent: number;
    dangerCount: number;
    unsatisfactoryLink: string;
  } {
    const features = getAllUniqLineStrings(voies);
    const dangers = getAllUniqDangers(voies);
    const totalDistance = getDistance({ features });
    const unsatisfactoryFeatures = features.filter((feature) => feature.properties.quality === 'unsatisfactory');
    const unsatisfactoryDistance = getDistance({ features: unsatisfactoryFeatures });
    const postponedFeatures = features.filter((feature) => feature.properties.status === 'postponed');
    const postponedDistance = getDistance({ features: postponedFeatures });

    const percent = totalDistance === 0 ? 0 : Math.round((unsatisfactoryDistance / totalDistance) * 100);

    const generateUnsatisfactoryLink = () => {
      let link = '/carte-interactive?modal=filters&qualities=unsatisfactory';
      if (voies.length === 1) {
        const voie = voies[0]?.features[0]?.properties?.line;
        if (voie) {
          link += `&lines=${voie}`;
        }
      }
      return link;
    };

    return {
      unsatisfactoryDistance,
      postponed: unsatisfactoryDistance === postponedDistance,
      percent,
      dangerCount: dangers.length,
      unsatisfactoryLink: generateUnsatisfactoryLink(),
    };
  }

  const typologyNames: Record<LaneType, string> = {
    bidirectionnelle: 'Piste bidirectionnelle',
    bilaterale: 'Piste bilatérale',
    'voie-bus': 'Voie bus',
    'voie-bus-elargie': 'Voie bus élargie',
    velorue: 'Vélorue',
    'voie-verte': 'Voie verte',
    'bandes-cyclables': 'Bandes cyclables',
    'zone-de-rencontre': 'Zone de rencontre',
    aucun: 'Aucun',
    inconnu: 'Inconnu',
  };

  const qualityNames: Record<LaneQuality, string> = {
    unsatisfactory: 'Non satisfaisant',
    satisfactory: 'Satisfaisant',
  };

  function getStatsByTypology(voies: Collections['voiesCyclablesGeojson'][]) {
    const lineStringFeatures = getAllUniqLineStrings(voies);
    const totalDistance = getDistance({ features: lineStringFeatures });

    function getPercent(distance: number) {
      return Math.round((distance / totalDistance) * 100);
    }

    const featuresByType = groupBy<
      Collections['voiesCyclablesGeojson']['features'][0],
      Collections['voiesCyclablesGeojson']['features'][0]['properties']['type']
    >(lineStringFeatures, (feature) => feature.properties.type);

    return Object.entries(featuresByType)
      .map(([type, features]) => {
        const distance = getDistance({ features });
        const percent = getPercent(distance);
        return {
          name: typologyNames[type as LaneType],
          percent,
        };
      })
      .filter((stat) => stat.percent > 0) // on ne veut pas afficher les types à 0% (arrondis)
      .sort((a, b) => b.percent - a.percent); // plus grandes barres en haut, plus propre
  }

  return {
    getAllUniqLineStrings,
    getDistance,
    getLineStringDistance,
    getTotalDistance,
    getStats,
    getStatsByTypology,
    displayDistanceInKm,
    displayPercent,
    typologyNames,
    qualityNames,
    getStatsQuality,
  };
};
