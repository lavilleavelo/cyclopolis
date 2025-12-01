import type { Collections } from '@nuxt/content';
import type { Map as MaplibreType } from 'maplibre-gl';

type ColoredLineStringFeature = Extract<
  Collections['voiesCyclablesGeojson']['features'][0],
  { geometry: { type: 'LineString' } }
> & { properties: { color: string } };

// features plotted last are on top
const sortOrder = [1, 3, 2, 4, 5, 6, 7, 12, 8, 9, 10, 11].reverse();

export function sortByLine(
  featureA: Extract<Collections['voiesCyclablesGeojson']['features'][0], { geometry: { type: 'LineString' } }>,
  featureB: Extract<Collections['voiesCyclablesGeojson']['features'][0], { geometry: { type: 'LineString' } }>,
) {
  const lineA = featureA.properties.line;
  const lineB = featureB.properties.line;
  return sortOrder.indexOf(lineA) - sortOrder.indexOf(lineB);
}

export function getCrossIconUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 8; // Set the desired width of your icon
  canvas.height = 8; // Set the desired height of your icon
  const context = canvas.getContext('2d');
  if (!context) {
    return '';
  }

  // Draw the first diagonal line of the "X"
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(canvas.width, canvas.height);
  context.lineWidth = 3;
  context.stroke();

  // Draw the second diagonal line of the "X"
  context.beginPath();
  context.moveTo(0, canvas.height);
  context.lineTo(canvas.width, 0);
  context.lineWidth = 3;
  context.stroke();

  return canvas.toDataURL();
}

export function groupFeaturesByColor(features: ColoredLineStringFeature[]) {
  const featuresByColor: Record<string, ColoredLineStringFeature[]> = {};
  for (const feature of features) {
    const color = feature.properties.color;

    if (featuresByColor[color]) {
      featuresByColor[color].push(feature);
    } else {
      featuresByColor[color] = [feature];
    }
  }
  return featuresByColor;
}

export function createLineShieldIcon(lineNumber: number, color: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const size = 64;

  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return canvas;
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 4;

  // circle background
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fill();

  // white border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // line number
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(lineNumber), centerX, centerY + 3);

  return canvas;
}

export function createCompositeLineShieldIcon(lineNumbers: number[], colors: string[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const iconSize = 64;
  const radius = iconSize / 2 - 4;
  const overlapPercent = 0.3; // 30% overlap
  const spacing = iconSize - iconSize * overlapPercent; // Distance between circle centers

  canvas.width = iconSize + spacing * (lineNumbers.length - 1);
  canvas.height = iconSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return canvas;
  }

  lineNumbers.forEach((lineNumber, index) => {
    const color = colors[index];
    const x = index * spacing + iconSize / 2;
    const centerY = iconSize / 2;

    // circle background
    ctx.fillStyle = color || '#000000';
    ctx.beginPath();
    ctx.arc(x, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    // white border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // line number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(lineNumber), x, centerY + 3);
  });

  return canvas;
}

export function normalizeLineDirection(coordinates: [number, number][]): [number, number][] {
  if (coordinates.length < 2) {
    return coordinates;
  }

  const start = coordinates[0];
  const end = coordinates[coordinates.length - 1];

  if (!start || !end) {
    return coordinates;
  }

  const [startLon, startLat] = start;
  const [endLon, endLat] = end;

  const latDiff = endLat - startLat;
  const lonDiff = endLon - startLon;

  const shouldReverse =
    Math.abs(lonDiff) > 0.0000001
      ? lonDiff < 0 // If going west (negative lonDiff), reverse
      : latDiff > 0; // If going north (positive latDiff), reverse

  return shouldReverse ? [...coordinates].reverse() : coordinates;
}

export function addCompositeIconNames(features: Collections['voiesCyclablesGeojson']['features']) {
  // les sections en commun ont un ID
  const sectionGroups = new Map<
    string,
    { line: number; feature: Collections['voiesCyclablesGeojson']['features'][0]; index: number }[]
  >();

  features.forEach((feature, index) => {
    if (feature.geometry.type !== 'LineString' || !('id' in feature.properties) || !feature.properties.id) {
      return;
    }

    const sectionId = feature.properties.id;
    if (!sectionGroups.has(sectionId)) {
      sectionGroups.set(sectionId, []);
    }
    sectionGroups.get(sectionId)!.push({
      line: feature.properties.line,
      feature,
      index,
    });
  });

  const processedFeatures = features.map((feature) => {
    if (feature.geometry.type === 'LineString') {
      return {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: normalizeLineDirection(feature.geometry.coordinates as [number, number][]),
        },
      };
    }
    return { ...feature };
  });

  sectionGroups.forEach((group) => {
    group.sort((a, b) => a.line - b.line);

    const lineNumbers = group.map((item) => item.line).sort((a, b) => a - b);
    const compositeIconName = `line-shield-${lineNumbers.join('-')}`;

    group.forEach((item) => {
      const feature = item.feature;
      if (feature.geometry.type === 'LineString') {
        const currentFeature = processedFeatures[item.index];
        if (currentFeature && 'properties' in currentFeature) {
          processedFeatures[item.index] = {
            ...currentFeature,
            properties: { ...currentFeature.properties, compositeIconName },
          };
        }
      }
    });
  });

  return processedFeatures;
}

// todo: optimize to only generate needed combinations
export function generateCompositeIconCombinations(totalLines: number): Set<string> {
  const compositeIcons = new Set<string>();

  // Generate 2-line combinations
  for (let i = 1; i <= totalLines; i++) {
    for (let j = i + 1; j <= totalLines; j++) {
      compositeIcons.add(`${i}-${j}`);
    }
  }

  // Generate 3-line combinations
  for (let i = 1; i <= totalLines; i++) {
    for (let j = i + 1; j <= totalLines; j++) {
      for (let k = j + 1; k <= totalLines; k++) {
        compositeIcons.add(`${i}-${j}-${k}`);
      }
    }
  }

  // Generate 4-line combinations
  for (let i = 1; i <= totalLines; i++) {
    for (let j = i + 1; j <= totalLines; j++) {
      for (let k = j + 1; k <= totalLines; k++) {
        for (let l = k + 1; l <= totalLines; l++) {
          compositeIcons.add(`${i}-${j}-${k}-${l}`);
        }
      }
    }
  }

  return compositeIcons;
}

export function createDashArrayAnimator(map: MaplibreType, layerId: string) {
  const dashArraySequence = [
    [0, 2, 2],
    [0.25, 2, 1.75],
    [0.5, 2, 1.5],
    [0.75, 2, 1.25],
    [1, 2, 1],
    [1.25, 2, 0.75],
    [1.5, 2, 0.5],
    [1.75, 2, 0.25],
    [2, 2, 0],
    [0, 0.25, 2, 1.75],
    [0, 0.5, 2, 1.5],
    [0, 0.75, 2, 1.25],
    [0, 1, 2, 1],
    [0, 1.25, 2, 0.75],
    [0, 1.5, 2, 0.5],
    [0, 1.75, 2, 0.25],
  ];

  const dashSpeed = 60;

  let step = 0;
  function animateDashArray(timestamp: number) {
    const newStep = Math.floor((timestamp / dashSpeed) % dashArraySequence.length);

    if (newStep !== step) {
      map.setPaintProperty(layerId, 'line-dasharray', dashArraySequence[step]);
      step = newStep;
    }

    requestAnimationFrame(animateDashArray);
  }
  return animateDashArray;
}
