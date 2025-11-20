import { defineCollection, defineContentConfig } from '@nuxt/content';
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    news: defineCollection({
      source: 'news/*.md',
      type: 'page',
      schema: z.object({
        date: z.string(),
        newsBannerText: z.string(),
      })
    }),
    blog: defineCollection({
      source: 'blog/*.md',
      type: 'page',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        imageUrl: z.string().url(),
      })
    }),
    voiesCyclablesPage: defineCollection({
      source: 'voies-cyclables/*.md',
      type: 'page',
      schema: z.object({
        name: z.string(),
        line: z.number(),
        from: z.string(),
        to: z.string(),
        description: z.string(),
        trafic: z.string(),
        cover: z.string(),
      })
    }),
    voiesCyclablesGeojson: defineCollection({
      source: 'voies-cyclables/*.json',
      type: 'page',
      schema: z.object({
        type: z.enum(['FeatureCollection']),
        features: z.array(
          z.union([
            z.object({
              type: z.enum(["Feature"]),
              properties: z.object({
                id: z.string().optional(),
                line: z.number(),
                name: z.string(),
                status: z.enum(["planned", "postponed", "variante-postponed", "done", "wip", "variante", "tested", "unknown"]),
                type: z.enum([
                  "bidirectionnelle",
                  "bilaterale",
                  "voie-bus",
                  "voie-bus-elargie",
                  "velorue",
                  "voie-verte",
                  "bandes-cyclables",
                  "zone-de-rencontre",
                  "aucun",
                  "inconnu"
                ]),
                link: z.string().optional(),
                quality: z.enum(["satisfactory", "unsatisfactory"]),
                text: z.string().optional(),
                doneAt: z.string().optional(),
              }),
              geometry: z.object({
                type: z.enum(["LineString"]),
                coordinates: z.array(z.tuple([z.number(), z.number()])),
              }),
            }),
            z.object({
              type: z.enum(["Feature"]),
              properties: z.object({
                type: z.enum(["perspective"]),
                name: z.string(),
                line: z.number(),
                imgUrl: z.string().url(),
              }),
              geometry: z.object({
                type: z.enum(['Point']),
                coordinates: z.tuple([z.number(), z.number()])
              }),
            }),
            z.object({
              type: z.enum(["Feature"]),
              properties: z.object({
                type: z.enum(['danger']),
                name: z.string(),
                description: z.string(),
                danger: z.string(),
              }),
              geometry: z.object({
                type: z.enum(['Point']),
                coordinates: z.tuple([z.number(), z.number()]),
              }),
            })
          ])
        )
      })
    }),
    compteurs: defineCollection({
      source: 'compteurs/**/*.json',
      type: 'page',
      schema: z.object({
        name: z.string(),
        description: z.string(),
        arrondissement: z.string(),
        idPdc: z.number(),
        cyclopolisId: z.string().optional(),
        coordinates: z.array(z.number()).length(2),
        lines: z.array(z.number()).optional(),
        counts: z.array(
          z.object({
            month: z.string(),
            count: z.number(),
          })
        )
      })
    }),
    sitesPartenaires: defineCollection({
      source: 'sites-partenaires/**/*.md',
      type: 'page',
      schema: z.object({
        imageUrl: z.string().url(),
        title: z.string(),
        description: z.string(),
        city: z.string(),
        link: z.string().url(),
        index: z.number(),
      })
    }),
    cartesMinutes: defineCollection({
      source: 'cartes-minutes/**/*.md',
      type: 'page',
      schema: z.object({
        imageUrl: z.string().url(),
        title: z.string(),
        description: z.string(),
        link: z.string().url(),
        index: z.number(),
      })
    })
  }
});
