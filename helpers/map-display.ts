import type { LaneQuality, LaneStatus, LaneType } from '~/types';

export type MapDisplayMode = 'line' | 'status' | 'type';

export const MAP_DISPLAY_MODES: { id: MapDisplayMode; label: string }[] = [
  { id: 'line', label: 'Ligne' },
  { id: 'status', label: 'Statut' },
  { id: 'type', label: 'Type' },
];

const LVV_BLUE = '#152B68';
const LVV_PINK = '#C84271';
const GREEN = '#2F8F4E';
const GREY = '#8A8A8A';

const THICK_WIDTH = 4;
const THIN_WIDTH = 2;
const DOUBLE_LINE_WIDTH = 1.5;
const DOUBLE_LINE_GAP = 2.5;

export const STATUS_COLOR = LVV_BLUE;
export const WISHED_STATUS_COLOR = LVV_PINK;

export function getStatusColor(status: LaneStatus): string {
  return status === 'postponed' ? WISHED_STATUS_COLOR : STATUS_COLOR;
}

export type LaneTypeStyle = {
  id: string;
  label: string;
  types: LaneType[];
  quality?: LaneQuality;
  color: string;
  width: number;
  gapWidth?: number;
  dasharray?: number[];
  dotted?: boolean;
  crosses?: boolean;
};

export const LANE_TYPE_STYLES: LaneTypeStyle[] = [
  {
    id: 'bidirectionnelle',
    label: 'Piste bidirectionnelle',
    types: ['bidirectionnelle'],
    color: LVV_BLUE,
    width: THICK_WIDTH,
  },
  {
    id: 'bilaterale',
    label: 'Piste bilatérale',
    types: ['bilaterale'],
    color: LVV_BLUE,
    width: DOUBLE_LINE_WIDTH,
    gapWidth: DOUBLE_LINE_GAP,
  },
  {
    id: 'voie-verte',
    label: 'Voie verte',
    types: ['voie-verte'],
    quality: 'satisfactory',
    color: GREEN,
    width: THICK_WIDTH,
  },
  {
    id: 'voie-verte-non-satisfaisante',
    label: 'Voie verte non satisfaisante',
    types: ['voie-verte'],
    quality: 'unsatisfactory',
    color: GREEN,
    width: THICK_WIDTH,
    dasharray: [2, 1],
  },
  {
    id: 'voie-bus-elargie',
    label: 'Voie bus élargie',
    types: ['voie-bus-elargie'],
    color: LVV_PINK,
    width: THICK_WIDTH,
    dotted: true,
  },
  { id: 'voie-bus', label: 'Voie bus', types: ['voie-bus'], color: LVV_PINK, width: THIN_WIDTH, dotted: true },
  {
    id: 'velorue',
    label: 'Vélorue',
    types: ['velorue'],
    color: LVV_PINK,
    width: THICK_WIDTH,
    dasharray: [2, 1.5],
  },
  {
    id: 'zone-de-rencontre',
    label: 'Zone de rencontre',
    types: ['zone-de-rencontre'],
    color: LVV_PINK,
    width: THIN_WIDTH,
  },
  {
    id: 'bandes-cyclables',
    label: 'Bandes cyclables',
    types: ['bandes-cyclables'],
    color: LVV_BLUE,
    width: DOUBLE_LINE_WIDTH,
    gapWidth: DOUBLE_LINE_GAP,
    dasharray: [3, 2],
  },
  {
    id: 'aucun',
    label: 'Aucun aménagement',
    types: ['aucun', 'inconnu'],
    color: GREY,
    width: THICK_WIDTH,
    crosses: true,
  },
];

export function isQualityShownByLaneType(type: LaneType): boolean {
  return LANE_TYPE_STYLES.some((style) => style.quality && style.types.includes(type));
}

export function matchesLaneTypeStyle(
  style: Pick<LaneTypeStyle, 'types' | 'quality'>,
  { type, quality }: { type: LaneType; quality?: LaneQuality },
): boolean {
  if (!style.types.includes(type)) {
    return false;
  }
  if (!style.quality) {
    return true;
  }
  return (style.quality === 'unsatisfactory') === (quality === 'unsatisfactory');
}

export function getLaneTypeLayerId(style: LaneTypeStyle): string {
  return `type-${style.id}`;
}

export function getLaneTypeDasharray(style: LaneTypeStyle): number[] | undefined {
  return style.dotted ? [0, 2] : style.dasharray;
}
