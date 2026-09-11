import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

// Blog posts live as .md / .mdx files in src/blog/.
// A post can embed videos via the <YouTube> component (MDX).
const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // Optional hero video for the post (YouTube id) — enables VideoObject schema.
    videoId: z.string().optional(),
  }),
});

export const collections = { blog };
