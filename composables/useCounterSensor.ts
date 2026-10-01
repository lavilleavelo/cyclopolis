export type ScooterStats = {
  firstDay: string;
  period: { from: string; to: string };
  share: number | null;
  average: number | null;
  monthly: { month: string; share: number | null }[];
};

export type SensorDetails = {
  idPdc: number;
  name: string;
  coordinates: [number, number] | null;
  firstDay: string | null;
  lastDay: string | null;
  flows: { bikes: number; scooters: number };
  scooters: ScooterStats | null;
};

export const SCOOTER_COLOR = '#EA580C';

export function useCounterSensor(idPdc: number) {
  const { counterStatsApiUrl } = useRuntimeConfig().public;
  return useFetch<SensorDetails>(`${counterStatsApiUrl}/api/counters/${idPdc}/sensor`, {
    key: `counter-sensor-${idPdc}`,
    server: false,
    lazy: true,
  });
}

export function formatShare(share: number | null | undefined): string {
  return share === null || share === undefined ? '–' : `${Math.round(share * 100)}\u00A0%`;
}
