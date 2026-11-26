import config from './config.json';

const TITLE = `Cyclopolis - Suivi des ${config.revName.plural} par ${config.assoName}`;
const DESCRIPTION = `Plateforme citoyenne et associative, par ${config.assoName}. État d'avancement, cartes interactives des itinéraires, détails, travaux : suivez le développement du réseau cyclable sécurisé lyonnais`;
const BASE_URL = 'https://cyclopolis.fr';
const COVER_IMAGE_URL = 'https://cyclopolis.lavilleavelo.org/cyclopolis.png';

const SECONDARY_LINE_FILE = /voies-cyclables\/ligne-([a-z]+)\.(?:json|md)$/;

function getSecondaryLineFromFile(fileId: string): number | undefined {
  const letter = fileId.match(SECONDARY_LINE_FILE)?.[1];
  if (!letter) {
    return undefined;
  }
  const secondaryLine = config.secondaryLines.lines.find((line) => line.letter.toLowerCase() === letter);
  if (!secondaryLine) {
    throw new Error(`${fileId} : voie secondaire « ${letter} » absente de secondaryLines dans config.json`);
  }
  return secondaryLine.line;
}

type ContentFeature = { geometry?: { type?: string }; properties: { type?: string; line?: number } };

export default defineNuxtConfig({
  srcDir: '.',
  css: ['~/assets/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: TITLE,
      meta: [
        { hid: 'description', name: 'description', content: DESCRIPTION },
        // facebook
        { property: 'og:site_name', content: TITLE },
        { hid: 'og:type', property: 'og:type', content: 'website' },
        { hid: 'og:url', property: 'og:url', content: BASE_URL },
        { hid: 'og:title', property: 'og:title', content: TITLE },
        {
          hid: 'og:description',
          property: 'og:description',
          content: DESCRIPTION,
        },
        { hid: 'og:image', property: 'og:image', content: COVER_IMAGE_URL },
        { property: 'og:image:width', content: '640' },
        { property: 'og:image:height', content: '476' },
        // twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { hid: 'twitter:url', name: 'twitter:url', content: BASE_URL },
        { hid: 'twitter:title', name: 'twitter:title', content: TITLE },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: DESCRIPTION,
        },
        { hid: 'twitter:image', name: 'twitter:image', content: COVER_IMAGE_URL },
      ],
    },
  },

  runtimeConfig: {
    public: {
      maptilerKey: process.env.MAPTILER_KEY,
      counterStatsApiUrl: 'https://carte.lavilleavelo.org',
    },
  },

  modules: ['@nuxtjs/tailwindcss', '@nuxt/content', '@nuxt/icon', '@nuxt/eslint', 'nuxt-umami'],

  hooks: {
    'content:file:afterParse'({ file, content }) {
      const line = getSecondaryLineFromFile(file.id);
      if (line === undefined) {
        return;
      }
      if (!Array.isArray(content.features)) {
        content.line = line;
        return;
      }
      for (const feature of content.features as ContentFeature[]) {
        if (feature.geometry?.type === 'LineString' || feature.properties.type === 'perspective') {
          feature.properties.line = line;
        }
      }
    },
  },

  content: {
    markdown: {
      tags: { h1: 'h1', h5: 'h5', h6: 'h6' },
    },
  },

  icon: {
    customCollections: [
      {
        prefix: 'cyclopolis',
        dir: './assets/icons',
      },
    ],
  },

  tailwindcss: { viewer: false },

  nitro: {
    prerender: {
      routes: ['/sitemap.xml', '/data/map-counters.json'],
      ignore: ['/carte-interactive?'],
    },
  },

  build: {
    transpile: ['@headlessui/vue'],
  },

  vite: {
    optimizeDeps: {
      include: ['highcharts-vue', '@vueuse/core'],
      exclude: ['@panoramax/web-viewer'],
    },
  },

  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.includes('pnx-'),
    },
  },

  compatibilityDate: '2024-08-11',

  umami: {
    id: 'b9a30c67-3c47-465f-9629-632badd7632a',
    host: 'https://umami.nimbus.lavilleavelo.org',
    autoTrack: true,
    ignoreLocalhost: true,
    excludeQueryParams: true,
    enabled: true,
    logErrors: true,
  },
});
