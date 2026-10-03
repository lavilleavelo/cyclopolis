import { describe, it, expect } from 'vitest';
import { setupE2E } from './setup';

describe('Counters on interactive map', () => {
  const { createPage, fetchHTML } = setupE2E();

  describe('Counter data loading', () => {
    it('does not embed counters in the map page payload', async () => {
      const payload = await fetchHTML('/carte-interactive/_payload.json');
      expect(payload).not.toContain('cyclopolisId');
    });

    it('serves the map counters as a static file', async () => {
      const counters = JSON.parse(await fetchHTML('/data/map-counters.json'));
      expect(counters.velo.length).toBeGreaterThan(0);
      expect(counters.voiture.length).toBeGreaterThan(0);
      expect(counters.velo[0].counts.length).toBeGreaterThan(0);
    });

    it('fetches the counters only when they are displayed', async () => {
      const isCountersFetched = () =>
        performance.getEntriesByType('resource').some((e) => e.name.includes('/data/map-counters.json'));

      const hiddenCountersPage = await createPage('/carte-interactive');
      await hiddenCountersPage.waitForSelector('.maplibregl-canvas', { timeout: 15_000 });
      expect(await hiddenCountersPage.evaluate(isCountersFetched)).toBe(false);
      await hiddenCountersPage.close();

      const shownCountersPage = await createPage('/carte-interactive?counters=1');
      await shownCountersPage.waitForSelector('.maplibregl-canvas', { timeout: 15_000 });
      expect(await shownCountersPage.evaluate(isCountersFetched)).toBe(true);
      await shownCountersPage.close();
    });

    it('opens the popup of a counter linked in the URL once counters are loaded', async () => {
      const page = await createPage(
        '/carte-interactive?modal=counter&counters=1&counterLink=/compteurs/velo/pont-morand',
      );
      const popup = page.locator('.maplibregl-popup');
      await popup.waitFor({ timeout: 15_000 });
      expect(await popup.textContent()).toContain('Pont Morand');
      await page.close();
    });
  });

  describe('Filter panel - counter toggle', () => {
    it('shows the counter checkbox in the filter panel', async () => {
      const page = await createPage('/carte-interactive?modal=filters');
      await page.waitForSelector('.maplibregl-canvas', { timeout: 15_000 });
      const label = page.locator('text=Afficher les compteurs');
      expect(await label.count()).toBe(1);
      await page.close();
    });

    it('checkbox is checked when counters=1 is in URL', async () => {
      const page = await createPage('/carte-interactive?modal=filters&counters=1');
      await page.waitForSelector('.maplibregl-canvas', { timeout: 15_000 });
      const label = page.locator('text=Afficher les compteurs');
      expect(await label.count()).toBe(1);
      const checkbox = label.locator('.. >> input[type="checkbox"]');
      expect(await checkbox.isChecked()).toBe(true);
      await page.close();
    });
  });

  describe('Counter sidebar panel', () => {
    it('opens counter detail sidebar for a velo counter', async () => {
      const page = await createPage(
        '/carte-interactive?modal=counter&counters=1&counterLink=/compteurs/velo/avenue-des-freres-lumiere',
      );
      await page.waitForSelector('.maplibregl-canvas', { timeout: 15_000 });

      const sidebar = page.locator('#counter-details-sidebar, #counter-details-bottom-sheet');
      await sidebar.waitFor({ timeout: 10_000 });

      await sidebar.getByRole('heading', { name: 'Total des passages par année' }).waitFor({ timeout: 15_000 });

      const content = await sidebar.textContent();
      expect(content).toContain('Compteur vélo');
      expect(content).toContain('Total des passages par année');
      expect(content).toContain('Source des données');
      await page.close();
    });

    it('opens counter detail sidebar for a comparison counter', async () => {
      const page = await createPage(
        '/carte-interactive?modal=counter&counters=1&counterLink=/compteurs/comparaison/boulevard-du-onze-novembre',
      );
      await page.waitForSelector('.maplibregl-canvas', { timeout: 15_000 });

      const sidebar = page.locator('#counter-details-sidebar, #counter-details-bottom-sheet');
      await sidebar.waitFor({ timeout: 10_000 });

      await sidebar.getByRole('heading', { name: 'Fréquentation annuelle' }).waitFor({ timeout: 15_000 });

      const content = await sidebar.textContent();
      expect(content).toContain('Fréquentation annuelle');
      expect(content).toContain('Répartition vélo / voiture');
      expect(content).toContain('Source des données');
      await page.close();
    });

    it('renders charts in the comparison counter sidebar', async () => {
      const page = await createPage(
        '/carte-interactive?modal=counter&counters=1&counterLink=/compteurs/comparaison/boulevard-du-onze-novembre',
      );
      await page.waitForSelector('.maplibregl-canvas', { timeout: 15_000 });

      const sidebar = page.locator('#counter-details-sidebar, #counter-details-bottom-sheet');
      await sidebar.waitFor({ timeout: 10_000 });
      await sidebar.locator('.highcharts-container').first().waitFor({ timeout: 15_000 });

      const chartCount = await sidebar.locator('.highcharts-container').count();
      expect(chartCount).toBeGreaterThanOrEqual(4);
      await page.close();
    });
  });

  describe('Counter sidebar navigation', () => {
    it('has open-in-new button in counter sidebar', async () => {
      const page = await createPage(
        '/carte-interactive?modal=counter&counters=1&counterLink=/compteurs/velo/avenue-des-freres-lumiere',
      );
      await page.waitForSelector('.maplibregl-canvas', { timeout: 15_000 });

      const sidebar = page.locator('#counter-details-sidebar, #counter-details-bottom-sheet');
      await sidebar.waitFor({ timeout: 10_000 });

      const content = await sidebar.innerHTML();
      expect(content).toContain('open-in-new');
      await page.close();
    });
  });
});
