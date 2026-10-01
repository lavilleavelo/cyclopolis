export type CountPoint = {
  idPdc: number;
  name: string;
  road: string | null;
  direction: string | null;
  lanes: number | null;
  coordinates: number[];
};

export type MapPoint = {
  label: string;
  title: string;
  detail: string;
  coordinates: [number, number];
  color?: string;
};

const EARTH_RADIUS_METERS = 6_371_000;

export function countPointSection(name: string): string {
  const parts = name
    .split('_')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length === 3 ? `${parts[1]} → ${parts[2]}` : parts.join(' ');
}

export function countPointDirection(point: CountPoint): string | null {
  return point.direction ? point.direction.replace(/ (\d)/g, '\u00A0$1') : null;
}

export function countPointLanes(point: CountPoint): string | null {
  return point.lanes === null ? null : `${point.lanes}\u00A0voie${point.lanes > 1 ? 's' : ''}`;
}

export function toLngLat(coordinates: number[]): [number, number] {
  return [coordinates[0] ?? 0, coordinates[1] ?? 0];
}

export function distanceInMeters(from: number[], to: number[]): number {
  const [fromLng, fromLat] = toLngLat(from).map((value) => (value * Math.PI) / 180) as [number, number];
  const [toLng, toLat] = toLngLat(to).map((value) => (value * Math.PI) / 180) as [number, number];
  const x = (toLng - fromLng) * Math.cos((fromLat + toLat) / 2);
  const y = toLat - fromLat;
  return Math.hypot(x, y) * EARTH_RADIUS_METERS;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.max(10, Math.round(meters / 10) * 10)}\u00A0m`;
  }

  return `${(meters / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}\u00A0km`;
}
