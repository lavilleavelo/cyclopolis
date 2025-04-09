import { defineCollection, defineContentConfig, z } from '@nuxt/content'

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
      type: 'data',
      schema: z.object({
        type: z.enum(['FeatureCollection']),
        features: z.array(
          z.object({
            type: z.enum(["Feature"]),
            properties: z.object({
              id: z.string().optional(),
              line: z.number(),
              name: z.string(),
              status: z.enum(["planned", "postponed", "done", "wip", "variante"]).optional(),
              type: z.string(),
              link: z.string().optional(),
              quality: z.enum(["satisfactory", "unsatisfactory"]).optional(),
              imgUrl: z.string().url().optional(),
              description: z.string().optional(),
              danger: z.string().optional(),
              text: z.string().optional(),
              doneAt: z.string().optional(),
            }),
            geometry: z.object({
              type: z.enum(["Point", "LineString"]),
              coordinates: z.union([
                z.tuple([z.number(), z.number()]), // For Point
                z.array(z.tuple([z.number(), z.number()])), // For LineString
              ]),
            }),
          })
        )
      })
    })
  }
})