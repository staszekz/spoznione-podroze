# Spóźnione Podróże

Source of [spoznionepodroze.pl](https://spoznionepodroze.pl): a photo-centric PL/EN travel blog.

## Stack

- [Astro](https://astro.build) (static output) with React islands and Tailwind CSS
- [Sanity](https://www.sanity.io) as the CMS (content: continent → country → post, PL/EN translations)
- Cloudflare Workers static assets for hosting (Workers Builds deploys `master`, PRs get preview URLs)

## Commands

Use Node 24 (`nvm use`).

| Command                                  | What it does                                   |
| ---------------------------------------- | ---------------------------------------------- |
| `pnpm install`                           | Install dependencies                           |
| `pnpm dev`                               | Dev server at `localhost:4321`                 |
| `pnpm build`                             | Build the site into `dist/`                    |
| `pnpm run check`                         | Biome lint + format (writes fixes)             |
| `pnpm astro check`                       | TypeScript and Astro type check                |
| `pnpm preview:cf`                        | Build and serve with Wrangler, like production |
| `pnpm studio:dev` / `pnpm studio:deploy` | Run or deploy Sanity Studio                    |

Agent and contributor notes: [AGENTS.md](AGENTS.md).
