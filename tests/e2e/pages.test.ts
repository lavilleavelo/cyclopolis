import { describe, it, expect } from 'vitest';
import { setupE2E } from './setup';

describe('Pages HTML rendering', () => {
  const { fetchHTML } = setupE2E();

  describe('Homepage', () => {
    it('renders with key content', async () => {
      const html = await fetchHTML('/');
      expect(html).toContain('Cyclopolis');
      expect(html).toContain('Voies Lyonnaises');
      expect(html).toContain('Où en est le projet');
      expect(html).toContain('Avancement par ligne');
      expect(html).toContain('Voir le tableau de bord complet');
    });

    it('contains navigation header', async () => {
      const html = await fetchHTML('/');
      expect(html).toContain('Cartes détaillées');
      expect(html).toContain('Compteurs');
      expect(html).toContain('Blog');
    });
  });

  describe('Tableau de bord', () => {
    it('renders dashboard with progress data', async () => {
      const html = await fetchHTML('/tableau-de-bord');
      expect(html).toContain('Tableau de bord de suivi des Voies Lyonnaises');
      expect(html).toContain('Distance totale');
    });
  });

  describe('Blog', () => {
    it('renders blog listing', async () => {
      const html = await fetchHTML('/blog');
      expect(html).toContain('Blog de Cyclopolis');
    });
  });

  describe('Historique', () => {
    it('renders changelog timeline', async () => {
      const html = await fetchHTML('/historique');
      expect(html).toContain('Historique des changements');
    });
  });

  describe('Compteurs vélo', () => {
    it('renders counter listing', async () => {
      const html = await fetchHTML('/compteurs/velo');
      expect(html).toContain('compteurs vélo');
      expect(html).toContain('Chercher un compteur');
      expect(html).toContain('data.eco-counter.com');
    });
  });

  describe('Compteurs voiture', () => {
    it('renders car counter listing', async () => {
      const html = await fetchHTML('/compteurs/voiture');
      expect(html).toContain('compteurs voiture');
      expect(html).toContain('Chercher un compteur');
    });
  });

  describe('Compteurs comparaison', () => {
    it('renders comparison listing', async () => {
      const html = await fetchHTML('/compteurs/comparaison');
      expect(html).toContain('Comparaison');
      expect(html).toContain('Chercher un compteur');
    });
  });

  describe('Mentions légales', () => {
    it('renders legal page', async () => {
      const html = await fetchHTML('/mentions-legales');
      expect(html).toContain('Mentions légales');
      expect(html).toContain('Hébergement');
      expect(html).toContain('Protection des données');
      expect(html).toContain('OVH');
    });
  });

  describe('Sites partenaires', () => {
    it('renders partner sites', async () => {
      const html = await fetchHTML('/sites-partenaires');
      expect(html).toContain('partenaires');
    });
  });
});
