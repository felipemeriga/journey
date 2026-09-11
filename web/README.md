# felipemeriga.dev — portfolio + blog (Astro)

Personal site for Felipe Ramos da Silva. Built with **Astro** (static output),
using the **Modernist** design system. Portfolio home page + a Markdown/MDX blog
with video support, strong SEO (sitemap, RSS, OpenGraph, JSON-LD), and a static
build served by nginx (deployable via Dokploy).

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # -> dist/  (static)
npm run preview    # serve the built dist/ locally
```

## Structure

```
src/
  content.config.ts        # blog collection schema (glob loader + zod)
  layouts/
    Base.astro             # <head>, SEO meta/OG, JSON-LD, global styles
    Post.astro             # blog post layout (BlogPosting + VideoObject schema)
  components/
    Nav.astro              # sticky nav (scroll-progress bar on home)
    YouTube.astro          # lazy YouTube embed (facade → iframe on click)
  pages/
    index.astro            # portfolio home (Modernist)
    404.astro
    blog/index.astro       # post listing
    blog/[...slug].astro    # individual post route
    rss.xml.js             # RSS feed
  scripts/portfolio.js     # canvas motion graphics (hero + card motifs)
  styles/site.css          # reveal animations, hover tints, blog prose
  blog/*.mdx               # ← blog posts live here
public/
  styles.css               # the Modernist design system (tokens + classes)
  assets/                  # portrait.jpg, résumé PDF
```

## Blog & videos — currently parked

The blog/video feature is **temporarily disabled**. All of it lives in
`blog-parked/` (nothing under `src/` builds it, so the site is just the
portfolio home + 404). To re-enable, move the files back into `src/`:

```bash
cd web
mv blog-parked/content.config.ts src/content.config.ts
mv blog-parked/blog            src/blog
mv blog-parked/pages-blog      src/pages/blog
mv blog-parked/rss.xml.js      src/pages/rss.xml.js
mv blog-parked/Post.astro      src/layouts/Post.astro
mv blog-parked/YouTube.astro   src/components/YouTube.astro
```

Then re-add the `Blog` link in `src/components/Nav.astro`, the RSS `<link>` in
`src/layouts/Base.astro`, and (optionally) point the content-section "Blog" card
in `src/pages/index.astro` back at `/blog`. The sections below document how it
works once restored.

## Write a blog post

Create `src/blog/my-post.mdx` (or `.md`):

```mdx
---
title: "My post title"
description: "One-sentence summary (used for SEO + the listing)."
pubDate: 2026-03-20
tags: ["Rust", "Distributed systems"]
draft: false            # true = hidden from build/listing/RSS
# videoId: "abc123"     # optional YouTube id → adds a Video badge + VideoObject schema
---

Markdown content here. Use `##` / `###` for headings.
```

The post appears automatically on `/blog`, gets its own page at
`/blog/my-post/`, and is added to the RSS feed and sitemap.

## Add a video to a post

In an `.mdx` post, import and use the `<YouTube>` component:

```mdx
import YouTube from '../components/YouTube.astro';

<YouTube id="aqz-KE-bpKQ" title="What this video shows" />
```

Set `videoId` in the frontmatter too if it's the post's primary/hero video —
that adds a "Video" badge on the listing and `VideoObject` structured data for
video-rich search results. Videos embed from YouTube (lazy-loaded facade), so
there's no bandwidth/transcoding to run.

## ⚠️ Before deploying: set the real domain

`astro.config.mjs` has `site: 'https://felipemeriga.dev'` as a placeholder.
Change it to the real URL — it's used for canonical links, the sitemap, and RSS.

## Deploy (Dokploy on meriga-server)

Static build served by nginx. The included `Dockerfile` builds `dist/` and
serves it:

- **Dokploy → Application → Build Type: Dockerfile.** Point it at this directory.
- The container listens on **:80**; set the domain + TLS in Dokploy (Traefik).
- `nginx.conf` handles Astro's directory routing, asset caching, and gzip.

Build/run locally to sanity-check the container:

```bash
docker build -t felipe-portfolio .
docker run -p 8080:80 felipe-portfolio   # http://localhost:8080
```
