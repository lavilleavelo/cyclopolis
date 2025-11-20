import config from './config.json';

const TITLE = `Cyclopolis - Suivi des ${config.revName.plural} par ${config.assoName}`;
const DESCRIPTION =
  `Plateforme citoyenne et associative, par ${config.assoName}. État d'avancement, cartes interactives des itinéraires, détails, travaux : suivez le développement du réseau cyclable sécurisé lyonnais`;
const BASE_URL = 'https://cyclopolis.fr';
const COVER_IMAGE_URL = 'https://cyclopolis.lavilleavelo.org/cyclopolis.png';

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
          content: DESCRIPTION
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
          content: DESCRIPTION
        },
        { hid: 'twitter:image', name: 'twitter:image', content: COVER_IMAGE_URL }
      ],
      script: [
        {
          src: 'https://beamanalytics.b-cdn.net/beam.min.js',
          'data-token': process.env.BEAM_ANALYTICS_TOKEN,
          async: true
        }
      ]
    }
  },

  runtimeConfig: {
    public: {
      maptilerKey: process.env.MAPTILER_KEY
    }
  },

  modules: ['@nuxtjs/tailwindcss', '@nuxt/content', '@nuxt/icon', '@nuxt/eslint'],

  content: {
    markdown: {
      tags: { h1: 'h1', h5: 'h5', h6: 'h6' }
    }
  },

  icon: {
    customCollections: [
      {
        prefix: 'cyclopolis',
        dir: './assets/icons'
      }
    ]
  },

  tailwindcss: { viewer: false },

  nitro: {
    prerender: {
      routes: ['/sitemap.xml']
    }
  },

  build: {
    transpile: ['@headlessui/vue']
  },

  compatibilityDate: '2024-08-11'
});
