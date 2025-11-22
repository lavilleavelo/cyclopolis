import type { Collections } from '@nuxt/content';
import type { Ref } from 'vue';

export type LaneType =
| 'bidirectionnelle'
| 'bilaterale'
| 'voie-bus'
| 'voie-bus-elargie'
| 'velorue'
| 'voie-verte'
| 'bandes-cyclables'
| 'zone-de-rencontre'
| 'aucun'
| 'inconnu';

export type LaneStatus = 'done' | 'wip' | 'planned' | 'tested' | 'postponed' | 'unknown' | 'variante' | 'variante-postponed';

export type LaneQuality = 'unsatisfactory' | 'satisfactory';

export type LineStringFeature = {
  type: 'Feature';
  properties: {
    id?: string // sert à identifier des tronçons communs entre plusieurs lignes
    line: number; // numéro de la voie cyclable
    name: string; // nom de la voie cyclable
    status: LaneStatus; // status d'avancement de la voie cyclable
    type: LaneType; // type de la voie cyclable
    doneAt?: string; // si applicable, date de fin des travaux (utile pour suivre la progression)
    link?: string;
    quality?: LaneQuality; // tronçon de qualité ou non
  };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
};

export type PerspectiveFeature = {
  type: 'Feature';
  properties: {
    type: 'perspective';
    line: number;
    name: string;
    imgUrl: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
};

export type CompteurFeature = {
  type: 'Feature';
  properties: {
    type: 'compteur-velo' | 'compteur-voiture';
    line?: number;
    name: string;
    link?: string;
    counts: Array<{
      month: string;
      count: number;
    }>;
    /**
     * z-index like
     */
    circleSortKey?: number;
    circleRadius?: number;
    circleStrokeWidth?: number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
};

export type DangerFeature = {
  type: 'Feature';
  properties: {
    id?: string,
    type: 'danger',
    name: string
    description: string
    danger: string
  }
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export type Count = { month: string, count: number };

/**
 * type helpers
 */
export function isLineStringFeature(feature: Collections['voiesCyclablesGeojson']['features'][0] | CompteurFeature): feature is Extract<Collections['voiesCyclablesGeojson']['features'][0], { geometry: { type: "LineString" } }> {
  return feature.geometry.type === 'LineString';
}

export function isPointFeature(feature: Collections['voiesCyclablesGeojson']['features'][0] | CompteurFeature): feature is Extract<typeof feature, { geometry: { type: 'Point'; coordinates: [number, number] ; properties: { line?: string } } }> {
  return feature.geometry.type === 'Point';
}

export function isPerspectiveFeature(feature: Collections['voiesCyclablesGeojson']['features'][0] | CompteurFeature): feature is Extract<Collections['voiesCyclablesGeojson']['features'][0], { properties: { type: "perspective" } }> {
  return isPointFeature(feature) && feature.properties.type === 'perspective';
}

export function isDangerFeature(feature: Collections['voiesCyclablesGeojson']['features'][0] | CompteurFeature): feature is Extract<Collections['voiesCyclablesGeojson']['features'][0], { properties: { type: "danger" } }> {
  return isPointFeature(feature) && feature.properties.type === "danger";
}

export function isCompteurFeature(feature: Collections['voiesCyclablesGeojson']['features'][0] | CompteurFeature): feature is CompteurFeature {
  return isPointFeature(feature) && ['compteur-velo', 'compteur-voiture'].includes(feature.properties.type);
}

export interface BaseFilterItem {
  label: string;
  isEnabled: boolean;
}

export interface StatusTypeQualityFilterItem extends BaseFilterItem {
  statuses?: string[];
  types?: string[];
  qualities?: string[];
}

export interface LineFilterItem extends BaseFilterItem {
  line: number;
}

export interface FiltersState {
  statusFilters: Ref<Array<StatusTypeQualityFilterItem>>;
  typeFilters: Ref<Array<StatusTypeQualityFilterItem>>;
  qualityFilters: Ref<Array<StatusTypeQualityFilterItem>>;
  lineFilters: Ref<Array<LineFilterItem>>;
  dateRange: Ref<[number, number]>;
  minDate: Ref<number>;
  maxDate: Ref<number>;
  dateSteps: Ref<number[]>;
}

export interface FilterActions {
  toggleStatusFilter: (index: number) => void;
  toggleTypeFilter: (index: number) => void;
  toggleQualityFilter: (index: number) => void;
  toggleLineFilter: (index: number) => void;
  setDateRange: (newDateRange: [number, number]) => void;
}

export interface UseBikeLaneFiltersOptions {
  allFeatures: Ref<Collections['voiesCyclablesGeojson']['features']>;
  allGeojsons?: Ref<Collections['voiesCyclablesGeojson'][] | undefined | null>;
  allLines?: Ref<any[] | undefined | null>;
}
