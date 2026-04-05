import { describe, it, expect } from 'vitest';
import { setupE2E } from './setup';

describe('Maps and Charts rendering', () => {
  const { createPage } = setupE2E();

  describe('Interactive map page', () => {
    it('renders the MapLibre map', async () => {
      const page = await createPage('/carte-interactive');
      await page.waitForSelector('.maplibregl-canvas', { timeout: 15_000 });
      const canvasCount = await page.locator('.maplibregl-canvas').count();
      expect(canvasCount).toBeGreaterThan(0);

      const controls = await page.locator('.maplibregl-ctrl').count();
      expect(controls).toBeGreaterThan(0);
      await page.close();
    });
  });

  describe('Compteurs vélo listing map', () => {
    it('renders the map with counter markers', async () => {
      const page = await createPage('/compteurs/velo');
      await page.waitForSelector('.maplibregl-canvas', { timeout: 15_000 });
      const canvasCount = await page.locator('.maplibregl-canvas').count();
      expect(canvasCount).toBeGreaterThan(0);
      await page.close();
    });
  });

  describe('Counter detail page - charts', () => {
    it('renders charts on a vélo counter page', async () => {
      const page = await createPage('/compteurs/velo/avenue-des-freres-lumiere');
      await page.waitForSelector('.highcharts-container', { timeout: 15_000 });
      const chartCount = await page.locator('.highcharts-container').count();
      expect(chartCount).toBeGreaterThanOrEqual(2); // TotalByYear + MonthComparison

      const seriesGroups = await page.locator('.highcharts-series-group').count();
      expect(seriesGroups).toBeGreaterThanOrEqual(2);
      await page.close();
    });

    it('renders the map on a vélo counter page', async () => {
      const page = await createPage('/compteurs/velo/avenue-des-freres-lumiere');
      await page.waitForSelector('.maplibregl-canvas', { timeout: 15_000 });
      const canvasCount = await page.locator('.maplibregl-canvas').count();
      expect(canvasCount).toBeGreaterThan(0);
      await page.close();
    });
  });

  describe('Comparison page - charts', () => {
    it('renders comparison charts', async () => {
      const page = await createPage('/compteurs/comparaison/avenue-des-freres-lumiere');
      await page.waitForSelector('.highcharts-container', { timeout: 15_000 });
      const chartCount = await page.locator('.highcharts-container').count();
      expect(chartCount).toBeGreaterThanOrEqual(4); // Histogram + Share + Cumulative + Monthly

      const seriesGroups = await page.locator('.highcharts-series-group').count();
      expect(seriesGroups).toBeGreaterThanOrEqual(4);
      await page.close();
    });
  });
});
