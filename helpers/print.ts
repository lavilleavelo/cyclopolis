export type PaperOrientation = 'portrait' | 'landscape';
export type PaperFormat = 'A4' | 'A3' | 'A2' | 'A1' | 'A0';

export const PAPER_SIZES_MM: Record<PaperFormat, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A2: { width: 420, height: 594 },
  A1: { width: 594, height: 841 },
  A0: { width: 841, height: 1189 },
};

export const DESIGN_FORMAT: PaperFormat = 'A2';

export const CSS_DPI = 96;
export const CSS_PX_PER_MM = CSS_DPI / 25.4;

const EARTH_CIRCUMFERENCE_M = 40075016.686;
const MAPLIBRE_TILE_SIZE = 512;

export function getSheetSizeMm(format: PaperFormat, orientation: PaperOrientation): { width: number; height: number } {
  const { width, height } = PAPER_SIZES_MM[format];
  return orientation === 'landscape' ? { width: height, height: width } : { width, height };
}

export function getFormatScale(format: PaperFormat): number {
  return PAPER_SIZES_MM[format].width / PAPER_SIZES_MM[DESIGN_FORMAT].width;
}

const SMALLEST_REAL_SIZE_FORMAT: PaperFormat = 'A3';

export function getMapSymbolScale({ symbolScale, formatScale }: { symbolScale: number; formatScale: number }): number {
  const maxCompensation = 1 / getFormatScale(SMALLEST_REAL_SIZE_FORMAT);
  return symbolScale * Math.min(Math.max(1, 1 / formatScale), maxCompensation);
}

export function mmToPx(mm: number): number {
  return mm * CSS_PX_PER_MM;
}

export function getPrintPixelRatio({ dpi, symbolScale }: { dpi: number; symbolScale: number }): number {
  return (dpi / CSS_DPI) * symbolScale;
}

export function getEffectiveDpi({ pixelRatio, symbolScale }: { pixelRatio: number; symbolScale: number }): number {
  return Math.round((pixelRatio / symbolScale) * CSS_DPI);
}

export function getZoomForScale({
  latitude,
  scaleDenominator,
  symbolScale,
}: {
  latitude: number;
  scaleDenominator: number;
  symbolScale: number;
}): number {
  const metersPerMapPx = ((scaleDenominator / 1000) * symbolScale) / CSS_PX_PER_MM;
  const metersPerMapPxAtZoom0 = (EARTH_CIRCUMFERENCE_M * Math.cos((latitude * Math.PI) / 180)) / MAPLIBRE_TILE_SIZE;
  return Math.log2(metersPerMapPxAtZoom0 / metersPerMapPx);
}

export function getScaleBar({ metersPerMm, maxWidthMm }: { metersPerMm: number; maxWidthMm: number }): {
  meters: number;
  widthMm: number;
  label: string;
} {
  const maxMeters = metersPerMm * maxWidthMm;
  const magnitude = 10 ** Math.floor(Math.log10(maxMeters));

  let meters = magnitude;
  for (const step of [2, 5]) {
    if (step * magnitude <= maxMeters) {
      meters = step * magnitude;
    }
  }

  return {
    meters,
    widthMm: meters / metersPerMm,
    label: meters >= 1000 ? `${meters / 1000} km` : `${meters} m`,
  };
}
