import { describe, it, expect } from 'vitest';
import { setupE2E } from './setup';

describe('Browser navigation', () => {
  const { createPage } = setupE2E();

  it('homepage loads and displays key sections', async () => {
    const page = await createPage('/');
    const title = await page.title();
    expect(title).toContain('Cyclopolis');

    const h2Texts = await page.locator('h2').allInnerTexts();
    expect(h2Texts.some((t) => t.includes('Où en est le projet'))).toBe(true);
    expect(h2Texts.some((t) => t.includes('Avancement par ligne'))).toBe(true);
    await page.close();
  });

  it('homepage has working navigation links', async () => {
    const page = await createPage('/');
    const dashboardLink = page.locator('a[href="/tableau-de-bord"]');
    expect(await dashboardLink.count()).toBeGreaterThan(0);
    const blogLink = page.locator('a[href="/blog"]');
    expect(await blogLink.count()).toBeGreaterThan(0);
    await page.close();
  });

  it('loads tableau de bord', async () => {
    const page = await createPage('/tableau-de-bord');
    const h1 = await page.locator('h1').innerText();
    expect(h1).toContain('Tableau de bord');
    await page.close();
  });

  it('loads blog page', async () => {
    const page = await createPage('/blog');
    const content = await page.content();
    expect(content).toContain('Blog de Cyclopolis');
    await page.close();
  });

  it('loads compteurs vélo page', async () => {
    const page = await createPage('/compteurs/velo');
    const heading = await page.locator('h2').first().innerText();
    expect(heading.toLowerCase()).toContain('compteurs vélo');
    const searchInput = await page.locator('input[placeholder="Chercher un compteur..."]').count();
    expect(searchInput).toBe(1);
    await page.close();
  });

  it('loads historique page', async () => {
    const page = await createPage('/historique');
    const h1 = await page.locator('h1').innerText();
    expect(h1).toContain('Historique des changements');
    await page.close();
  });

  it('loads mentions légales page', async () => {
    const page = await createPage('/mentions-legales');
    const content = await page.content();
    expect(content).toContain('Mentions légales');
    expect(content).toContain('Hébergement');
    await page.close();
  });
});
