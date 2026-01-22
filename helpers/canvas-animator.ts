import type { Map as MaplibreType, LngLatBounds } from 'maplibre-gl';
import type { LineStringFeature } from '~/types';

/**
 * C'est un replacement pour une solution comme https://stackoverflow.com/a/45817976 qui est en fait extrêmement lente
 * l'animation est entièrement faite avec un canvas superposé à la maplibre map. L'utilisation du CPU est réduite au de ~20% à ~4-5%
 */
export class CanvasDashAnimator {
  private readonly map: MaplibreType;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;

  private features: LineStringFeature[] = [];
  private iconCache: Map<string, HTMLCanvasElement> = new Map();

  private projectionCache: Map<
    LineStringFeature,
    {
      path: Path2D;
      length: number;
      center: { x: number; y: number } | null;
      isVisible: boolean;
    }
  > = new Map();

  private needsProjectionUpdate: boolean = true;
  private selectedLines: Set<number> | null = null;

  private readonly boundUpdateProjection: () => void;

  constructor(map: MaplibreType, features: LineStringFeature[]) {
    this.map = map;
    this.features = this.prepareFeatures(features);

    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      pointerEvents: 'none',
      width: '100%',
      height: '100%',
    });

    const container = this.map.getCanvasContainer();
    container.appendChild(this.canvas);

    const context = this.canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;

    this.boundUpdateProjection = () => {
      this.needsProjectionUpdate = true;
    };

    this.map.on('resize', this.handleResize.bind(this));
    this.map.on('move', this.boundUpdateProjection);
    this.map.on('zoom', this.boundUpdateProjection);

    this.handleResize();
    this.start();
  }

  private prepareFeatures(features: LineStringFeature[]): LineStringFeature[] {
    const sortedFeatures = [...features].sort(
      (a, b) => (a.properties.line ?? Infinity) - (b.properties.line ?? Infinity),
    );

    return sortedFeatures.map((f) => {
      if (!f.bbox && f.geometry.coordinates.length > 0) {
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (const [lng, lat] of f.geometry.coordinates) {
          if (lng < minX) minX = lng;
          if (lat < minY) minY = lat;
          if (lng > maxX) maxX = lng;
          if (lat > maxY) maxY = lat;
        }
        f.bbox = [minX, minY, maxX, maxY];
      }
      return f;
    });
  }

  private handleResize() {
    const caps = this.map.getCanvas();
    const width = caps.clientWidth;
    const height = caps.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    this.needsProjectionUpdate = true;
  }

  public setFeatures(features: LineStringFeature[]) {
    this.features = this.prepareFeatures(features);
    this.projectionCache.clear();
    this.needsProjectionUpdate = true;
  }

  public setImages(images: Map<string, HTMLCanvasElement>) {
    this.iconCache = images;
  }

  public setSelectedLines(selectedLines: number[] | null) {
    this.selectedLines = selectedLines ? new Set(selectedLines) : null;
    this.needsProjectionUpdate = true;
  }

  public start() {
    if (!this.animationFrameId) this.loop();
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy() {
    this.stop();
    this.map.off('resize', this.handleResize);
    this.map.off('move', this.boundUpdateProjection);
    this.map.off('zoom', this.boundUpdateProjection);
    this.canvas.remove();
  }

  private loop() {
    this.render();
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  private isVisible(bbox: number[] | undefined, bounds: LngLatBounds): boolean {
    if (!bbox) return true;
    return (
      bbox[2] >= bounds.getWest() &&
      bbox[0] <= bounds.getEast() &&
      bbox[3] >= bounds.getSouth() &&
      bbox[1] <= bounds.getNorth()
    );
  }

  private updateProjections(bounds: LngLatBounds) {
    this.projectionCache.clear();
    const claimedSegments = new Set<string>();

    for (const feature of this.features) {
      const visible = this.isVisible(feature.bbox, bounds);
      if (!visible) continue;

      const coords = feature.geometry.coordinates;
      if (coords.length < 2) continue;

      const lineId = feature.properties.line;
      const isSelected = this.selectedLines && lineId !== undefined && this.selectedLines.has(lineId);

      const path = new Path2D();
      let length = 0;
      let segmentsAdded = 0;
      let prevCoord = coords[0] as [number, number];
      let prevP = this.map.project(prevCoord);

      let movedTo = false;

      for (let i = 1; i < coords.length; i++) {
        const currCoord = coords[i] as [number, number];
        const segKey = [prevCoord, currCoord]
          .sort()
          .map((c) => c.join(','))
          .join('|');

        if (isSelected || !claimedSegments.has(segKey)) {
          if (!isSelected) claimedSegments.add(segKey);

          const p = this.map.project(currCoord);

          if (!movedTo) {
            path.moveTo(prevP.x, prevP.y);
            movedTo = true;
          }

          path.lineTo(p.x, p.y);
          const dx = p.x - prevP.x;
          const dy = p.y - prevP.y;
          length += Math.sqrt(dx * dx + dy * dy);

          prevP = p;
          segmentsAdded++;
        } else {
          movedTo = false;
          prevCoord = currCoord;
          prevP = this.map.project(currCoord);
        }

        prevCoord = currCoord;
      }

      if (segmentsAdded > 0) {
        const midPoint = this.map.project(coords[Math.floor(coords.length / 2)] as [number, number]);

        this.projectionCache.set(feature, {
          path,
          length,
          center: midPoint,
          isVisible: true,
        });
      }
    }
    this.needsProjectionUpdate = false;
  }

  private render() {
    if (!this.map || !this.ctx || !this.canvas.isConnected) return;

    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;
    const bounds = this.map.getBounds();
    const zoom = this.map.getZoom();

    if (this.needsProjectionUpdate) {
      this.updateProjections(bounds);
    }

    this.ctx.clearRect(0, 0, width, height);

    const dashSpeed = 20;
    const offset = ((performance.now() / 1000) * dashSpeed) % 16;

    this.ctx.lineCap = 'butt';
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([8, 8]);

    let currentLineId: number | null = null;
    let accumulatedDist = 0;

    for (const feature of this.features) {
      const lineId = feature.properties.line;
      if (lineId !== currentLineId) {
        currentLineId = lineId;
        accumulatedDist = 0;
      }

      const cached = this.projectionCache.get(feature);
      if (!cached) continue;

      const isSelected = !this.selectedLines || (lineId !== undefined && this.selectedLines.has(lineId));

      this.ctx.globalAlpha = isSelected ? 1.0 : 0.2;
      this.ctx.strokeStyle = feature.properties.color || '#000';
      this.ctx.lineDashOffset = -(offset + accumulatedDist);

      this.ctx.stroke(cached.path);
      accumulatedDist += cached.length;
    }

    this.ctx.setLineDash([]);
    const scale = 0.35;

    for (const feature of this.features) {
      const cached = this.projectionCache.get(feature);
      if (!cached || !cached.center) continue;

      const props = feature.properties;
      const distance = props.distance || 0;

      if (zoom < 13 && distance < 730) continue;
      if (zoom >= 13 && zoom < 17 && distance < 300) continue;

      const lineId = feature.properties.line;
      const isSelected = !this.selectedLines || (lineId !== undefined && this.selectedLines.has(lineId));

      const iconKey = props.compositeIconName || `line-shield-${lineId}`;
      const icon = this.iconCache.get(iconKey);
      if (!icon) continue;

      this.ctx.globalAlpha = isSelected ? 1.0 : 0.2;
      const w = icon.width * scale;
      const h = icon.height * scale;
      this.ctx.drawImage(icon, cached.center.x - w / 2, cached.center.y - h / 2, w, h);
    }

    this.ctx.globalAlpha = 1.0;
  }
}

export function createCanvasDashAnimator(map: MaplibreType, features: LineStringFeature[]) {
  return new CanvasDashAnimator(map, features);
}
