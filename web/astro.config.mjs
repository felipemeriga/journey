// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// NOTE: change `site` to your real deployed URL — it's used for canonical URLs,
// the sitemap, and the RSS feed. Placeholder until the meriga-server domain is set.
export default defineConfig({
  site: 'https://felipemeriga.dev',
  integrations: [mdx(), sitemap()],
  build: { format: 'directory' },
});
